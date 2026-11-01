'use strict';
/* global module */
/* ══ REGLAS PURAS DEL DIMENSIONADOR ARUBA (fase 1 de la auditoria 2026-09-17) ══
   La auditoria tecnica del 2026-09-17 (documento «Auditoria tecnica — Dimensionador
   Aruba») encontro cinco fallos criticos que cambiaban el equipo o el precio de la
   propuesta. Cuatro de ellos eran reglas de calculo enterradas en la pagina, sin prueba
   posible porque la pagina necesita DOM. Se extraen aqui, sin DOM ni estado, con el mismo
   patron UMD que motor-ingenieria.js: global `ArubaReglas` en el navegador y require()
   en los tests de Node (test/aruba-auditoria-fase1.test.js).

   C1 · tierParaCaudal   — el tier automatico solo elige entre los tiers que EXISTEN para
                           el nivel deducido. Foundation se vende en 100 Mbps, 1 Gbps e
                           ilimitado; proponer «Foundation 200 Mbps» dejaba la suscripcion
                           en «consultar» y fuera del total.
   C2/C3 · capacidadSo   — gateways: las cifras de APs, clientes y licencia de capacidad
                           dependen del sistema operativo (AOS 10 / AOS 8). El catalogo
                           mezclaba cifras AOS 8 con SKU de licencia AOS 10.
   C4 · boostMbpsSitio   — Boost = 30 % del trafico WAN PRIVADO que viaja por el tunel
                           (regla de preventa declarada), no del requerimiento inflado con
                           margen, penalizaciones y una cuota de breakout invertida.
        boostRecMbps     — el Boost recomendado por HPE de cada appliance, como numero,
                           para descartar el modelo que no lo sostiene.
   A1 · admiteDtd        — Dynamic Threat Defense solo en EdgeConnect y no en el modelo
                           marcado `dtd:false`: filtro duro, no solo un aviso rojo. Hasta el
                           2026-10-06 lo estaba el EC-XS entero; la doc oficial solo exceptua
                           sus PN 200889 y 200900, y el vigente publica su capacidad IDS/IPS.
   R11/M9 · escenariosUnderlay (2026-09-24) — un enlace de respaldo no suma en operacion
                           normal: un 4G de backup inflaba el caudal, el tier y a veces el
                           appliance. Misma regla que Fortinet (etapa 7).
        escenarioBoost   — el Boost toma el escenario que mas tunel pide: una falla no suma
                           caudal, pero puede dejar el sitio sin breakout.
   Puertos · asignarPuertos (2026-10-15) — cada enlace a un puerto real del chasis, por su
                           medio; medioMinimo y enlacesSobreMedio, el medio que lleva un caudal.
           asignarPuertosPar (2026-10-27) — el par EdgeHA: los enlaces repartidos entre los dos
                           chasis y, en cada uno, el puerto de la interconexion y los LAN. */
(function(root, factory){
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.ArubaReglas = api;
})(typeof window !== 'undefined' ? window : globalThis, function(){

  // Porcentaje del trafico WAN privado que se licencia como Boost. Regla de preventa del
  // dueño (2026-09-13), SIN FUENTE oficial: HPE no publica porcentaje guia; la unica regla
  // de campo localizada sugiere 40 % (discrepancia documentada en aruba.js/fuentes.js).
  const BOOST_CUOTA = 0.30;

  // C1. `tiers` = SIZING.bwTiers (ordenados de menor a mayor, el ilimitado con mbps null al
  // final); `licenses` = LICENSES del API ({bw100:{foundation:{…},advanced:{…}}, …}).
  // Un tier sin datos de licencia en absoluto se conserva (misma semantica que el filtro
  // del selector manual: `!lic || lic[nivel]`); uno que tiene datos pero no para el nivel
  // pedido NO existe para ese nivel y se salta.
  function tierParaCaudal(tiers, licenses, mbps, nivel) {
    const lista = (tiers || []).filter((t) => {
      if (!nivel) return true;
      const lic = licenses && licenses[t.code];
      return !lic || !!lic[nivel];
    });
    for (const t of lista) {
      if (t.mbps != null && t.mbps >= mbps) return t;
    }
    // Por encima del ultimo tier con cifra: el ilimitado, si existe para el nivel.
    const ilimitado = lista.find((t) => t.mbps == null);
    return ilimitado || lista[lista.length - 1] || null;
  }

  // C2/C3. Capacidad del gateway para el sistema operativo elegido.
  //   `m.porSo` ausente           → las cifras base del modelo valen para ambos SO.
  //   `m.porSo[so]` es un objeto  → se superpone a las cifras base (aps, clients, licCap…).
  //   `m.porSo[so] === null`      → el catalogo NO tiene cifras de ese modelo para ese SO
  //                                  (o el modelo no lo soporta): no se puede afirmar que
  //                                  cumpla, y el dimensionador lo descarta explicandolo.
  // Devuelve {sinCifra:true, motivo} o el objeto a superponer ({} si no hay cambio).
  function capacidadSo(m, so) {
    if (!m || !m.porSo || !so) return {};
    if (!(so in m.porSo)) return {};
    const ov = m.porSo[so];
    if (ov === null) {
      const motivo = (m.porSoMotivo && m.porSoMotivo[so]) || 'sin cifras de capacidad para este sistema operativo en el catalogo';
      return { sinCifra: true, motivo };
    }
    return ov;
  }

  // C4. Mbps de Boost que necesita la sede.
  //   · Con enlaces declarados: el 30 % del trafico que el motor de ingenieria deja en los
  //     tuneles privados (`bwTunelesPrivados`: todo el underlay sin breakout; con breakout,
  //     la cuota interna de la regla 70/30 del brief). Es trafico ACTUAL: Boost se reasigna
  //     del pool en minutos sin tocar hardware, asi que no se le aplica margen de
  //     crecimiento, penalizacion de funcion ni paridad FEC (que se añade DESPUES de
  //     optimizar, en el lado WAN).
  //   · Sin enlaces: el 30 % de la demanda estimada actual (usuarios × Mbps/usuario).
  function boostMbpsSitio({ bwTunelesPrivados = 0, caudalTotal = 0, users = 0, perUser = 0 } = {}) {
    const privado = caudalTotal > 0 ? bwTunelesPrivados : users * perUser;
    return Math.round(BOOST_CUOTA * Math.max(0, privado || 0));
  }

  // Boost recomendado por HPE (spec.boostRec: «200 Mbps», «1 Gbps», «8 Gbps»), en Mbps.
  // null = el catalogo no lo publica para ese modelo (EC-V): no descarta, se declara.
  function boostRecMbps(m) {
    const s = m && m.spec && m.spec.boostRec;
    if (!s) return null;
    const x = /([\d.,]+)\s*(G|M)bps/i.exec(String(s));
    if (!x) return null;
    const n = parseFloat(x[1].replace(',', '.'));
    if (!Number.isFinite(n)) return null;
    return /g/i.test(x[2]) ? Math.round(n * 1000) : Math.round(n);
  }

  // A1. ¿Admite Dynamic Threat Defense (IDS/IPS en el chasis)? Solo EdgeConnect, y no el
  // modelo que el catalogo marque `dtd:false`. La capacidad publicada (idsMbps) la comprueba
  // la pagina, porque depende del escenario.
  function admiteDtd(m) {
    return !!m && m.fam === 'ec' && m.dtd !== false;
  }

  // R11/M9 (2026-09-24). Escenarios de trafico del underlay, con la MISMA regla que
  // `FortinetMotor.escenariosTrafico` (etapa 7 de Fortinet): un enlace de respaldo no suma en
  // operacion normal; cuando cae un activo, su carga migra a los respaldos hasta su caudal, y
  // lo que no cabe es `perdida`. El trafico que un respaldo recoge cuenta en la familia del
  // RESPALDO: si cae el MPLS y lo cubre un 4G, ese caudal viaja por Internet.
  //   · Sin ningun respaldo declarado devuelve solo la operacion normal, con las mismas sumas
  //     de siempre: por eso los enlaces ya compartidos (que no traen `rol`) no cambian.
  //   · Ninguna falla supera a la operacion normal EN CAUDAL (se quita un activo y entra como
  //     mucho su mismo caudal), asi que el appliance y el tier se dimensionan con `normal`.
  //     El Boost NO: depende del reparto MPLS/Internet, que una falla si mueve (ver
  //     `escenarioBoost`). Las fallas dicen ademas cuanto se pierde si el respaldo no alcanza.
  function escenariosUnderlay(wanLinks) {
    const todos = wanLinks || [];
    const enl = todos.filter((l) => l.down > 0);
    const esMpls = (l) => /^MPLS/.test(l.tipo);
    const act = enl.filter((l) => l.rol !== 'respaldo');
    const resp = enl.filter((l) => l.rol === 'respaldo');
    const suma = (arr) => arr.reduce((a, l) => a + l.down, 0);
    const normal = { id: 'normal', n: 'Operación normal', mpls: suma(act.filter(esMpls)),
      inet: suma(act.filter((l) => !esMpls(l))), respaldo: suma(resp), perdida: 0 };
    normal.total = normal.mpls + normal.inet;
    const out = [normal];
    if (resp.length) {
      act.forEach((L) => {
        let pendiente = L.down;
        let mpls = normal.mpls - (esMpls(L) ? L.down : 0);
        let inet = normal.inet - (esMpls(L) ? 0 : L.down);
        for (const Bk of resp) {
          const mover = Math.min(pendiente, Bk.down);
          if (esMpls(Bk)) mpls += mover; else inet += mover;
          pendiente -= mover;
        }
        const i = todos.indexOf(L) + 1;
        out.push({ id: `falla:${L.id}`, n: `Falla del enlace ${i} (${L.tipo})`, mpls, inet,
          total: mpls + inet, perdida: pendiente, enlace: i, caidoMbps: L.down });
      });
    }
    return out;
  }

  // Eje Boost (2026-09-24). Con breakout, el tunel privado es el 30 % del caudal solo
  // mientras quede Internet (motor-ingenieria.js); sin Internet es el caudal entero. Si cae
  // el DIA y su carga la recoge un MPLS de respaldo, el tunel pasa de 300 a 1.000 Mbps con
  // el mismo caudal total. `tunelDe(e)` da los Mbps de tunel de un escenario (los calcula el
  // motor); gana el mayor y, en empate, la operacion normal, que va primera. Es la misma
  // regla que Fortinet aplica a cada eje: la demanda es el maximo entre escenarios.
  function escenarioBoost(escenarios, tunelDe) {
    let mejor = null;
    for (const e of escenarios || []) {
      const mbps = tunelDe(e);
      if (!mejor || mbps > mejor.mbps) mejor = { escenario: e, mbps };
    }
    return mejor;
  }

  /* ══ PUERTOS DEL CHASIS (2026-10-15, revisión del panel 2 pedida por el dueño) ══
     Hasta este día la auditoría de puertos solo sabía dos cosas: contar los del EC-10104 y
     preguntar si la ficha decía «SFP» en algún sitio. Así un enlace RJ-45 «cabía» en un EC-L
     (6x SFP+, ningún cobre), cinco enlaces cabían en un EC-XS de 4 puertos y tres de 10G en
     un 10108 eran un aviso, no un «no cabe». Ahora cada modelo declara su inventario
     (`puertos` en aruba.js, leído de su `ifaces`) y cada enlace se asigna a un puerto real.

     Tipos: rj45 (cobre 10/100/1000), combo (RJ-45 o SFP de 1G, uno u otro), sfp (jaula de
     1G), sfpPlus (1/10G), sfp28 (1/10/25G) y celular (módem integrado: solo 4G/5G).
     Orden de asignación, del enlace más exigente al menos (greedy óptimo para esta jerarquía:
     cada tipo de enlace prueba primero el puerto que nadie más puede usar):
       25G → sfp28 · 10G → sfpPlus, sfp28 · RJ-45 → rj45, combo · 1G → sfp, combo, sfpPlus,
       sfp28 · y por último los LAN que el appliance necesita, en cualquier puerto libre.
     Un enlace RJ-45 NO va a una jaula SFP: eso es declarar «SFP 1G» y elegir el transceptor
     de cobre 1000BASE-T, que es lo que la lista de materiales cotiza. */
  const MEDIO_MBPS = { RJ45: 1000, 'SFP 1G': 1000, 'SFP+ 10G': 10000, 'SFP28 25G': 25000 };
  // El medio más pequeño que lleva un caudal; null si ninguno (más de 25 Gbps por enlace).
  function medioMinimo(mbps, base) {
    const orden = ['RJ45', 'SFP 1G', 'SFP+ 10G', 'SFP28 25G'];
    const desde = Math.max(0, orden.indexOf(base || 'RJ45'));
    return orden.slice(desde).find((m) => MEDIO_MBPS[m] >= mbps) || null;
  }
  const RUTAS = {
    'SFP28 25G': ['sfp28'],
    'SFP+ 10G': ['sfpPlus', 'sfp28'],
    RJ45: ['rj45', 'combo'],
    'SFP 1G': ['sfp', 'combo', 'sfpPlus', 'sfp28'],
  };
  const ORDEN_MEDIOS = ['SFP28 25G', 'SFP+ 10G', 'RJ45', 'SFP 1G'];
  const TIPOS_PUERTO = ['rj45', 'combo', 'sfp', 'sfpPlus', 'sfp28'];
  // `puertos` null = equipo virtual (EC-V): no hay chasis que auditar. `lan` = puertos LAN que
  // se reservan además de los enlaces. Devuelve {cabe, sinAsignar:[{enlace, medio}], lanFaltan,
  // usados:{tipo:n}, celular:n}. Solo cuentan los enlaces con caudal; los de respaldo, sí: ocupan
  // puerto aunque no sumen caudal.
  function asignarPuertos(puertos, enlaces, lan) {
    if (!puertos) return { cabe: true, virtual: true, sinAsignar: [], lanFaltan: 0, usados: {}, celular: 0 };
    const libre = {};
    TIPOS_PUERTO.forEach((t) => { libre[t] = puertos[t] || 0; });
    let celularLibre = puertos.celular || 0;
    const usados = {};
    const tomar = (t) => { libre[t] -= 1; usados[t] = (usados[t] || 0) + 1; };
    const activos = (enlaces || []).map((l, i) => ({ ...l, n: i + 1 })).filter((l) => l.down > 0 || l.up > 0);
    const sinAsignar = [];
    let celular = 0;
    // El módem integrado lo usa un 4G/5G antes que cualquier puerto.
    const pendientes = activos.filter((l) => {
      if (/^4G\/5G/.test(l.tipo || '') && celularLibre > 0) { celularLibre -= 1; celular += 1; return false; }
      return true;
    });
    for (const medio of ORDEN_MEDIOS) {
      for (const l of pendientes.filter((x) => x.medio === medio)) {
        const t = RUTAS[medio].find((r) => libre[r] > 0);
        if (t) tomar(t); else sinAsignar.push({ enlace: l.n, medio, tipo: l.tipo });
      }
    }
    // Un medio desconocido no se asigna a ciegas.
    pendientes.filter((l) => !RUTAS[l.medio]).forEach((l) => sinAsignar.push({ enlace: l.n, medio: l.medio, tipo: l.tipo }));
    let lanFaltan = 0;
    for (let i = 0; i < (lan || 0); i++) {
      const t = TIPOS_PUERTO.find((r) => libre[r] > 0);
      if (t) tomar(t); else lanFaltan += 1;
    }
    return { cabe: !sinAsignar.length && !lanFaltan, sinAsignar, lanFaltan, usados, celular };
  }
  // Par EdgeHA (2026-10-27): dos chasis iguales. Cada enlace WAN aterriza en UNO del par (VSG
  // SD-Branch, fig. «EC HA»; el de menos ocupación de los que tienen puerto para su medio), y
  // cada chasis reserva sus `lan` y el puerto de la interconexión: «any LAN or WAN port […]
  // You must match the media type and speed for both ends of the HA link […] you cannot use
  // MGMT ports» (Orchestrator, «Deployment - EdgeHA»). Por eso el puerto HA es del mismo tipo en
  // los dos. Devuelve lo mismo que asignarPuertos, con `usados` del par, `porChasis` y `ha` (el
  // tipo elegido, o null y `haFalta`).
  // POR VELOCIDAD (mejora aprobada, 2026-10-27): en un fallo, la interconexión lleva lo que
  // cruza de un chasis al otro, y la regla de la casa pide que cubra el agregado del sitio. Con
  // `opts.haMbps` se elige el tipo común libre MÁS BARATO que lo cubre (primero el cobre: un
  // latiguillo), y si ninguno, el más rápido que se pueda usar; `haCubre` dice si llega.
  // `opts.haVel(tipo)` da los Mbps que alcanza la interconexión por ese tipo EN ESTE MODELO (la
  // página lo sabe por las ópticas de su catálogo; 0 = no se puede usar); sin ella, la del puerto.
  // Sin `haMbps`, el primer tipo común libre, como antes. La interconexión se elige después de
  // los enlaces y antes de los LAN, que van a cualquier puerto: cambiar su tipo no cambia
  // cuántos puertos se gastan, así que un chasis que cabía sigue cabiendo.
  const VEL_TIPO = { rj45: 1000, combo: 1000, sfp: 1000, sfpPlus: 10000, sfp28: 25000 };
  function elegirHa(comunes, opts) {
    const o = opts || {};
    if (!(o.haMbps > 0) || !comunes.length) return { ha: comunes[0] || null, haCubre: null };
    const vel = (t) => (typeof o.haVel === 'function' ? (Number(o.haVel(t)) || 0) : VEL_TIPO[t]);
    const usables = comunes.filter((t) => vel(t) > 0);
    const cubre = usables.find((t) => vel(t) >= o.haMbps);
    if (cubre) return { ha: cubre, haCubre: true };
    const mas = usables.slice().sort((a, b) => vel(b) - vel(a))[0];
    return { ha: mas || comunes[0], haCubre: false };
  }
  function asignarPuertosPar(puertos, enlaces, lan, opts) {
    if (!puertos) return { cabe: true, virtual: true, sinAsignar: [], lanFaltan: 0, usados: {}, celular: 0, ha: null, haFalta: false, haCubre: null, porChasis: [] };
    const chasis = [0, 1].map(() => {
      const libre = {};
      TIPOS_PUERTO.forEach((t) => { libre[t] = puertos[t] || 0; });
      return { libre, usados: {}, celularLibre: puertos.celular || 0, celular: 0 };
    });
    const tomar = (c, t) => { c.libre[t] -= 1; c.usados[t] = (c.usados[t] || 0) + 1; };
    const ocupados = (c) => TIPOS_PUERTO.reduce((s, t) => s + (c.usados[t] || 0), 0) + c.celular;
    const activos = (enlaces || []).map((l, i) => ({ ...l, n: i + 1 })).filter((l) => l.down > 0 || l.up > 0);
    const sinAsignar = [];
    const pendientes = activos.filter((l) => {
      if (!/^4G\/5G/.test(l.tipo || '')) return true;
      const c = chasis.filter((x) => x.celularLibre > 0).sort((a, b) => ocupados(a) - ocupados(b))[0];
      if (!c) return true;
      c.celularLibre -= 1; c.celular += 1;
      return false;
    });
    for (const medio of ORDEN_MEDIOS) {
      for (const l of pendientes.filter((x) => x.medio === medio)) {
        const opciones = chasis.map((c) => ({ c, t: RUTAS[medio].find((r) => c.libre[r] > 0) })).filter((o) => o.t);
        opciones.sort((a, b) => ocupados(a.c) - ocupados(b.c));
        if (opciones.length) tomar(opciones[0].c, opciones[0].t); else sinAsignar.push({ enlace: l.n, medio, tipo: l.tipo });
      }
    }
    pendientes.filter((l) => !RUTAS[l.medio]).forEach((l) => sinAsignar.push({ enlace: l.n, medio: l.medio, tipo: l.tipo }));
    const { ha, haCubre } = elegirHa(TIPOS_PUERTO.filter((t) => chasis.every((c) => c.libre[t] > 0)), opts);
    if (ha) chasis.forEach((c) => tomar(c, ha));
    let lanFaltan = 0;
    for (const c of chasis) {
      for (let i = 0; i < (lan || 0); i++) {
        const t = TIPOS_PUERTO.find((r) => c.libre[r] > 0);
        if (t) tomar(c, t); else lanFaltan += 1;
      }
    }
    const usados = {};
    chasis.forEach((c) => Object.entries(c.usados).forEach(([t, n]) => { usados[t] = (usados[t] || 0) + n; }));
    return { cabe: !sinAsignar.length && !lanFaltan && !!ha, sinAsignar, lanFaltan, usados,
      celular: chasis.reduce((s, c) => s + c.celular, 0), ha, haFalta: !ha, haCubre,
      porChasis: chasis.map((c) => ({ usados: c.usados, celular: c.celular })) };
  }
  // Enlaces cuyo caudal pasa de lo que lleva su medio (un DIA de 3 Gbps por RJ-45 de 1 GbE). No
  // depende del modelo: es una declaración imposible, y se dice en la fila.
  function enlacesSobreMedio(enlaces) {
    return (enlaces || []).map((l, i) => ({ ...l, n: i + 1 }))
      .filter((l) => MEDIO_MBPS[l.medio] != null && Math.max(l.down || 0, l.up || 0) > MEDIO_MBPS[l.medio]);
  }


  /* ══ ÓPTICAS, INTERCONEXIÓN EdgeHA Y SEMÁFORO DE PUERTOS (2026-10-31, fase 3.1 del plan de
     mejora de los dimensionadores: el cálculo de la página de Aruba, a módulos puros con prueba) ══
     Vivían en dimensionador-aruba-edgeconnect.js, mezclados con el DOM. Aquí, sin estado: el
     catálogo de accesorios llega como `cat = {catalogo, compat}` (lo que la página recibe de
     /api/dimensionador/aruba) y las unidades del sitio (1, o 2 con el par HA) como número. La
     página conserva funciones con los mismos nombres que solo pasan esos dos datos, así que ninguna
     llamada cambia. La lógica es la misma, línea a línea; su historia está en los comentarios de la
     página y en PENDIENTES.md. Prueba: test/aruba-opticas-puertos.test.js. */
  const LAN_RESERVADOS = 2;
  const NOMBRE_PUERTO = { rj45: 'RJ-45', combo: 'combo RJ-45/SFP 1G', sfp: 'SFP 1G', sfpPlus: 'SFP+ 1/10G', sfp28: 'SFP28 1/10/25G', celular: 'módem 4G/5G integrado' };
  // Velocidad de las ópticas del catálogo, en Mbps por dirección (full-duplex).
  const VELOCIDAD_OPTICA = { '1G': 1000, '10G': 10000, '25G': 25000 };
  const VEL_JAULA = { sfp: ['1G'], sfpPlus: ['1G', '10G'], sfp28: ['1G', '10G', '25G'] };
  function fmt(m) {
    if (m == null) return '—';
    if (m >= 1000) return (m / 1000).toFixed(m % 1000 ? 1 : 0) + ' Gbps';
    return Math.round(m) + ' Mbps';
  }
  const catalogoDe = (cat) => (cat && cat.catalogo) || {};
  const compatDe = (cat) => (cat && cat.compat) || {};
  // Ópticas compatibles con un modelo a una velocidad: sin DAC (sala), sin TAA (van por el
  // cumplimiento especial) y nunca en fin de venta («ES»).
  function opticasPorVelocidad(cat, modeloId, speed) {
    if (!speed || !modeloId) return [];
    const cfg = compatDe(cat)[modeloId]; if (!cfg) return [];
    const catalogo = catalogoDe(cat);
    return cfg.items.map((sku) => ({ sku, a: catalogo[sku] }))
      .filter((x) => x.a && x.a.speed === speed && x.a.media !== 'DAC' && !/_TAA$/.test(x.a.media || '') && x.a.plc !== 'ES');
  }
  // El predicado del par EdgeHA: EdgeConnect, dos unidades y ≥2 enlaces activos. Devuelve los
  // enlaces activos o null.
  function parEdgeHA(esEC, unidades, links) {
    const act = (links || []).filter((l) => l.down > 0 || l.up > 0);
    return (esEC && unidades === 2 && act.length >= 2) ? act : null;
  }
  // La menor velocidad de óptica del modelo que cubre el agregado (regla declarada de la casa).
  function velocidadEdgeHA(cat, modeloId, agregadoMbps) {
    const cfg = compatDe(cat)[modeloId]; if (!cfg) return null;
    const catalogo = catalogoDe(cat);
    const speeds = [...new Set(cfg.items.map((s) => catalogo[s] && catalogo[s].speed).filter(Boolean))];
    const caben = speeds.filter((s) => (VELOCIDAD_OPTICA[s] || 0) >= agregadoMbps)
      .sort((a, b) => VELOCIDAD_OPTICA[a] - VELOCIDAD_OPTICA[b]);
    return caben[0] || null;
  }
  // ¿El chasis no tiene ninguna jaula SFP? Del inventario; sin él no se afirma nada.
  function sinJaulasSfp(modelo) {
    const p = modelo && modelo.puertos;
    if (!p) return false;
    return !(p.sfp || p.combo || p.sfpPlus || p.sfp28);
  }
  // Velocidades de óptica que la jaula `tipo` de ESTE modelo admite y el catálogo trae.
  function velocidadesJaula(cat, m, tipo) {
    const cfg = compatDe(cat)[m.id];
    const catalogo = catalogoDe(cat);
    const delModelo = new Set(cfg ? cfg.items.map((k) => catalogo[k] && catalogo[k].speed).filter(Boolean) : []);
    return (VEL_JAULA[tipo] || []).filter((v) => delModelo.has(v) && opticasPorVelocidad(cat, m.id, v).length);
  }
  // Lo que la auditoría del par necesita para elegir la interconexión por velocidad.
  function opcionesHa(cat, m, enlacesPar) {
    if (!m || !enlacesPar) return undefined;
    return {
      haMbps: enlacesPar.reduce((s, l) => s + l.down, 0),
      haVel: (t) => ((t === 'rj45' || t === 'combo') ? VELOCIDAD_OPTICA['1G']
        : Math.max(0, ...velocidadesJaula(cat, m, t).map((v) => VELOCIDAD_OPTICA[v] || 0))),
    };
  }
  // La interconexión del par, por el puerto que le toca: cobre (latiguillo), jaula (2 ópticas de
  // la menor velocidad que admite y cubre el agregado) o sin puerto común.
  function interconexionEdgeHA(cat, m, unidades, links, pick) {
    const enlaces = m ? parEdgeHA(m.fam === 'ec', unidades, links) : null;
    if (!enlaces) return null;
    const agregado = enlaces.reduce((s, l) => s + l.down, 0);
    const r = { enlaces, agregado, puerto: null, modo: 'optica', vel: null, ops: [], sku: null, aviso: null };
    if (m.puertos) {
      const asig = asignarPuertosPar(m.puertos, links, LAN_RESERVADOS, opcionesHa(cat, m, enlaces));
      r.puerto = asig.ha;
      if (!asig.ha) { r.modo = 'sinPuerto'; return r; }
      if (asig.ha === 'rj45' || asig.ha === 'combo') {
        r.modo = 'cobre';
        if (agregado > (VELOCIDAD_OPTICA['1G'])) r.aviso = `el RJ-45 es de 1 GbE y el agregado del sitio es ${fmt(agregado)}: la regla de la casa pide ≥ agregado, y no queda libre en los dos chasis una jaula con óptica que lo cubra; si importa, libera una del mismo tipo en ambos`;
        return r;
      }
      const admitidas = velocidadesJaula(cat, m, asig.ha);
      r.vel = admitidas.find((v) => (VELOCIDAD_OPTICA[v] || 0) >= agregado) || null;
      if (!r.vel) {
        r.modo = 'sinOptica';
        r.aviso = admitidas.length
          ? `la jaula ${NOMBRE_PUERTO[asig.ha]} admite como mucho ${admitidas[admitidas.length - 1]} en el catálogo y el agregado del sitio es ${fmt(agregado)}`
          : `el catálogo no trae ópticas para la jaula ${NOMBRE_PUERTO[asig.ha]} de ${m.id}`;
        return r;
      }
    } else {
      r.vel = velocidadEdgeHA(cat, m.id, agregado);
      if (!r.vel) { r.modo = 'sinOptica'; r.aviso = `el agregado del sitio (${fmt(agregado)}) supera las ópticas del catálogo para ${m.id}`; return r; }
    }
    r.ops = opticasPorVelocidad(cat, m.id, r.vel);
    if (!r.ops.length) { r.modo = 'sinOptica'; r.aviso = `no hay óptica ${r.vel} compatible con ${m.id} en el catálogo`; return r; }
    const p = pick && pick.EdgeHA;
    r.sku = p && r.ops.some((o) => o.sku === p) ? p : (r.ops.length === 1 ? r.ops[0].sku : null);
    return r;
  }
  // Texto del inventario para los motivos: «4x RJ-45 + 2x SFP+ 1/10G».
  function inventarioTxt(p) {
    if (!p) return 'sin chasis (virtual)';
    return Object.keys(NOMBRE_PUERTO).filter((k) => p[k]).map((k) => `${p[k]}x ${NOMBRE_PUERTO[k]}`).join(' + ');
  }
  // Transceptores 1000BASE-T certificados del modelo: la salida para un cobre sin RJ-45 libre.
  function cobreSfp(cat, modelo) {
    return opticasPorVelocidad(cat, modelo.id, '1G').filter((o) => o.a.media === 'COPPER').map((o) => o.sku);
  }
  // Con el par EdgeHA se audita el par; sin él, un chasis.
  function auditarPuertos(cat, modelo, wanLinks, unidades) {
    const enlaces = (wanLinks || []).filter((l) => l.down > 0 || l.up > 0);
    const enlacesPar = modelo ? parEdgeHA(modelo.fam === 'ec', unidades, wanLinks) : null;
    const par = !!enlacesPar;
    return {
      par,
      puertosNecesarios: enlaces.length + LAN_RESERVADOS * (par ? 2 : 1) + (par ? 2 : 0),
      hayFibra: enlaces.some((l) => /^SFP/.test(l.medio)),
      asignacion: par ? asignarPuertosPar(modelo.puertos, wanLinks, LAN_RESERVADOS, opcionesHa(cat, modelo, enlacesPar))
        : asignarPuertos(modelo ? modelo.puertos : null, wanLinks, LAN_RESERVADOS),
    };
  }
  // El porqué de un «no cabe», con el número de enlace y lo que hay que cambiar.
  function motivoPuertos(cat, modelo, asig) {
    const inv = inventarioTxt(modelo.puertos);
    const partes = [];
    const porMedio = {};
    asig.sinAsignar.forEach((x) => { (porMedio[x.medio] = porMedio[x.medio] || []).push(x.enlace); });
    Object.entries(porMedio).forEach(([medio, ns]) => {
      const cuales = `enlace${ns.length > 1 ? 's' : ''} ${ns.join(', ')}`;
      if (medio === 'RJ45') {
        const cu = cobreSfp(cat, modelo);
        partes.push(`${cuales} por RJ-45 sin puerto de cobre libre${cu.length ? ` — si va a una jaula SFP, declara el medio «SFP 1G» y elige el transceptor 1000BASE-T (${cu.join(', ')})` : ''}`);
      } else {
        partes.push(`${cuales} por ${medio} sin jaula libre que lo admita`);
      }
    });
    if (asig.porChasis) {
      if (asig.lanFaltan) partes.push(`${asig.lanFaltan === 1 ? 'falta 1' : `faltan ${asig.lanFaltan}`} de los ${LAN_RESERVADOS} puertos LAN de cada chasis`);
      if (asig.haFalta) partes.push('no queda en los dos chasis un puerto libre del mismo tipo para la interconexión EdgeHA (mismo medio y velocidad en los dos extremos, nunca el MGMT)');
      return `Cada ${modelo.id} del par EdgeHA tiene ${inv}, con los enlaces repartidos entre los dos: ${partes.join('; ')}.`;
    }
    if (asig.lanFaltan) partes.push(`${asig.lanFaltan === 1 ? 'falta 1' : `faltan ${asig.lanFaltan}`} de los ${LAN_RESERVADOS} puertos LAN`);
    return `El ${modelo.id} tiene ${inv}: ${partes.join('; ')}.`;
  }
  // Semáforo de puertos: rojo (algo no tiene puerto), ámbar (cabe, pero un enlace declara más de
  // lo que lleva su medio) o verde. Una sola regla para el descarte, la barra y la ficha.
  function evaluarPuertos(cat, modelo, wanLinks, unidades) {
    const a = auditarPuertos(cat, modelo, wanLinks, unidades);
    let nivel = 'verde', motivo = '';
    const sobre = enlacesSobreMedio((wanLinks || []).filter((l) => l.down > 0 || l.up > 0));
    if (modelo && !a.asignacion.cabe) {
      nivel = 'rojo';
      motivo = motivoPuertos(cat, modelo, a.asignacion);
    } else if (sobre.length) {
      nivel = 'ambar';
      motivo = sobre.map((l) => `El enlace ${l.n} declara ${fmt(Math.max(l.down, l.up))} por ${l.medio}, que lleva ${fmt(MEDIO_MBPS[l.medio])}`).join('; ') + ' — cambia el medio.';
    }
    return { ...a, nivel, motivo };
  }

  /* ESTADO COMERCIAL DERIVADO (fase 3.1, segunda entrega, 2026-11-01). Topes de la licencia de
     capacidad (clientes, APs y el nivel que los cubre), el bloque de Boost, los flujos que publica cada
     fuente, el precio y el SKU de un peldaño por término, y la suscripción de Central de cada gateway.
     Trasladadas sin cambiar su cuerpo desde la página, que conserva los nombres como envoltorios; lo
     que leían de sus globales (SIZING, CENTRAL_SERIE, CENTRAL, SKU_CAT, secMode) llega por parámetro,
     con el mismo nombre. Medido con `npm run equivalencia -- scripts/equivalencias/aruba-estado.js`. */
  function clientesMax(m){
    if(m.licCap&&m.licCap.length) return Math.max(...m.licCap.map(t=>t.clients));
    return m.clients;
  }

  function apsMax(m){
    if(m.licCap&&m.licCap.length) return Math.max(...m.licCap.map(t=>t.aps));
    return m.aps;
  }

  function nivelLicenciaNecesario(m,need,users,aps){
    if(!m.licCap) return null;
    return m.licCap.find(t=>t.fw>=need&&t.clients>=(users||0)&&t.aps>=(aps||0))
      ||m.licCap[m.licCap.length-1];
  }

  function bloquesBoost(SIZING, mbps){
    const b=(SIZING.boost&&SIZING.boost.bloque)||100;
    return Math.max(1,Math.ceil(mbps/b));
  }

  function flujosDe(m){
    if(m.fam==='ec'){
      const s=m.spec&&m.spec.conexiones;
      const n=s?parseInt(String(s).replace(/\D/g,''),10):NaN;
      return Number.isFinite(n)?n:null;
    }
    return m.fwSess!=null?m.fwSess:null;
  }

  function tierPrice(t,y){ if(!t) return null; const v=t['y'+y]; return v==null?null:v; }

  function tierSku(t,y){ if(!t||t.sku==null) return null; if(typeof t.sku==='string') return t.sku; return t.sku['y'+y]||null; }

  function baseParaModelo(CENTRAL_SERIE, m, D, secMode){
    const fam=Object.values(CENTRAL_SERIE).find(f=>(f.series||[]).includes(m.serie));
    const t=fam&&fam[secMode==='gwsec'?'foundationBaseSec':'foundationBase'];
    if(!t||!(t.modelos||[]).includes(m.id)||!(D.users<=t.maxClientes)) return null;
    return {n:t.n, sku:(t.sku&&t.sku['y'+D.termYrs])||null, maxClientes:t.maxClientes};
  }

  function centralParaModelo({ centralSerie: CENTRAL_SERIE, central: CENTRAL, skuCat: SKU_CAT }, m, nivel, termYrs, conSeguridad){
    if(!m||!nivel) return null;
    const fam=Object.values(CENTRAL_SERIE).find(f=>(f.series||[]).includes(m.serie));
    if(!fam) return null;
    const t=fam[nivel+(conSeguridad?'Sec':'')];
    if(!t||(t.soloSeries&&!t.soloSeries.includes(m.serie))) return null;
    const sku=(t.sku&&t.sku['y'+termYrs])||null;
    let precio=null;
    const base=CENTRAL[nivel];
    if(sku&&base&&tierSku(base,termYrs)===sku) precio=tierPrice(base,termYrs);
    else if(sku){ const f=(SKU_CAT||[]).find(x=>x.sku===sku); if(f&&f.p!=null) precio=f.p; }
    return {n:t.n, sku, precio};
  }

  return { BOOST_CUOTA, tierParaCaudal, capacidadSo, boostMbpsSitio, boostRecMbps, admiteDtd, escenariosUnderlay, escenarioBoost,
    MEDIO_MBPS, medioMinimo, asignarPuertos, asignarPuertosPar, enlacesSobreMedio,
    LAN_RESERVADOS, NOMBRE_PUERTO, VELOCIDAD_OPTICA, VEL_JAULA, fmt, opticasPorVelocidad, parEdgeHA, velocidadEdgeHA, sinJaulasSfp,
    velocidadesJaula, opcionesHa, interconexionEdgeHA, inventarioTxt, cobreSfp, auditarPuertos, motivoPuertos, evaluarPuertos,
    clientesMax, apsMax, nivelLicenciaNecesario, bloquesBoost, flujosDe, tierPrice, tierSku, baseParaModelo, centralParaModelo };
});
