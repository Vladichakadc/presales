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

  /* LA ELECCIÓN DEL MODELO (fase 3.1, tercera entrega, 2026-11-01). El filtro de candidatos de la
     página (arquetipo, Boost, DTD, IDS/IPS, SO, capacidad con IMIX, clientes, APs, flujos, Boost
     recomendado, puertos y PQC, con un contador o una lista por cada motivo de descarte), trasladado
     sin cambiar su cuerpo desde render(). Lo que leía de render() y de la página llega en `ctx` con
     el mismo nombre; devuelve los candidatos y los descartes. El orden (FICHA.ordenar) sigue en la
     página. Medido con `npm run equivalencia -- scripts/equivalencias/aruba-eleccion.js`. */
  function filtrarCandidatos(MODELS, ctx){
    const { coincideFiltro, famMode, personaMode, PERSONA_MODELOS, boost, secMode, ArubaReglas, IMIX_FACTOR, needProc, fmt, centralParaModelo, capacidadMax, capacidadComparable, needDe, clientesMax, apsMax, users, aps, flujosDe, flujosReq, D, evaluarPuertos, PQC, soMode, SO_NOMBRE, nivelPqc } = ctx;
    let outByBoost=0,outByClients=0,outByAps=0,outBySinDato=0,outByFlujos=0,outByPersona=0;
    // Fase 1 de la auditoria 2026-09-17: tres descartes nuevos, cada uno con su porque.
    const outBySo=[], outByDtd=[], outByBoostRec=[];
    // gwsec (2026-09-24): gateways sin nivel «+ Security» en el documento oficial (7000/7200),
    // y los que no llegan (o no publican) el throughput de IDS/IPS del VSG.
    const outBySinSec=[], outByIds=[], outByIdsEc=[];
    // M2 · Auditoría de puertos (SPEC B.3, para todo chasis desde el 2026-10-15): un modelo en
    // el que algún enlace no tiene puerto queda fuera. Se anota con su motivo y solo si habría
    // cumplido todo lo demás: es lo que dispara #alertaEscalado y el porqué del veredicto.
    const outByPuertos=[];
    // Criptografía post-cuántica exigida (2026-10-27): la regla única de pqc.js, también al final.
    const outByPqc=[];
    const candidates=MODELS.filter(m=>{
      if(!coincideFiltro(m,famMode)) return false;
      // Arquetipo de sede (fase 11): restringe el catalogo a los modelos que el VSG
      // posiciona para ese tamanyo de sitio. Libre = no restringe.
      if(personaMode!=='auto'&&personaMode!=='micro'&&PERSONA_MODELOS[personaMode]
        &&!PERSONA_MODELOS[personaMode].includes(m.id)){ outByPersona++; return false; }
      if(boost&&m.boostMax==null){ outByBoost++; return false; }
      // A1: Dynamic Threat Defense solo corre en EdgeConnect, y no en el modelo que el catálogo
      // marque `dtd:false`. Antes era un aviso rojo debajo de un equipo que seguía saliendo
      // RECOMENDADO y cotizaba la licencia DTD.
      if(secMode==='dtd'&&!ArubaReglas.admiteDtd(m)){ if(m.fam==='ec') outByDtd.push(m.id); return false; }
      // Y donde el fabricante publica la capacidad de IDS/IPS del EdgeConnect (hoy el EC-XS, en
      // su spec sheet: 300 Mbps en línea), es un techo duro, con la misma degradación IMIX que el
      // eje de IDS/IPS de los gateways (2026-10-06). Sin cifra, sigue la reserva del motor.
      if(secMode==='dtd'&&m.fam==='ec'&&m.idsMbps!=null&&m.idsMbps*IMIX_FACTOR<needProc){
        outByIdsEc.push({id:m.id, motivo:`IDS/IPS en línea ${fmt(m.idsMbps)} (×${IMIX_FACTOR} IMIX) por debajo de ${fmt(needProc)}`}); return false; }
      // IDS/IPS en el gateway (gwsec, 2026-09-24): solo los gateways cuya serie tiene nivel
      // «+ Security» en el documento oficial de Central (9000, 9100, 9200). EdgeConnect lo hace
      // con DTD y la línea 7000/7200 no tiene ese nivel.
      if(secMode==='gwsec'&&(m.fam==='ec'||!centralParaModelo(m, 'foundation', 1, true))){ if(m.fam!=='ec') outBySinSec.push(m.id); return false; }
      // Y el eje de IDS/IPS con la cifra oficial del VSG (idsMbps), con la misma degradación
      // IMIX que el firewall del gateway. Sin cifra publicada (9004-LTE) no se afirma que cumpla:
      // se aparta con su motivo, nunca con la cifra de firewall ni con la de su hermano.
      if(secMode==='gwsec'&&m.fam==='gw'){
        if(m.idsMbps==null){ outByIds.push({id:m.id, motivo:'sin cifra de IDS/IPS en el VSG'}); return false; }
        if(m.idsMbps*IMIX_FACTOR<needProc){ outByIds.push({id:m.id, motivo:`IDS/IPS ${fmt(m.idsMbps)} (×${IMIX_FACTOR} IMIX) por debajo de ${fmt(needProc)}`}); return false; }
      }
      // C2/C3: un gateway sin cifras para el SO elegido (9114 en AOS 8, series 7000/7200 en
      // AOS 10) no puede afirmarse que cumpla — se descarta y se dice por qué.
      if(m.sinCifraSo){ outBySo.push(m); return false; }
      // EC-V no publica rango: se dimensiona por licencia y vCPU, no por hardware.
      if(m.fam==='ec'&&m.wanMax==null) return false;
      const cap=capacidadMax(m);
      // Sin cifra publicada no se puede afirmar que cumpla: se descarta y se explica, en
      // vez de colarlo con un numero inventado o de omitirlo en silencio.
      if(cap==null){ outBySinDato++; return false; }
      // Factor IMIX (regla de trabajo del duenyo): la mezcla real de trafico rinde menos
      // que el UDP de laboratorio. En EdgeConnect la degradación vive YA en el
      // requerimiento del motor de ingeniería (÷IMIX según perfil) y se compara contra el
      // nominal; en gateways se conserva el ×0,70 del lado capacidad (ver
      // capacidadComparable — brief carrier-grade 2026-09-13, sin doble conteo).
      if(capacidadComparable(m)<needDe(m)) return false;
      const cMax=clientesMax(m), aMax=apsMax(m);
      if(cMax!=null&&users&&cMax<users){ outByClients++; return false; }
      if(aMax!=null&&aps&&aMax<aps){ outByAps++; return false; }
      // Flujos simultáneos: el chasis debe soportar con holgura los flujos calculados.
      // null (EC-V) = la fuente no publica el dato: no descarta, se declara.
      const fl=flujosDe(m);
      if(flujosReq>0&&fl!=null&&fl<flujosReq){ outByFlujos++; return false; }
      // C4: el Boost que necesita la sede no puede superar el que HPE recomienda optimizar
      // en ese appliance (EC-10104 200 Mbps, EC-S 500 Mbps, EC-M 1 Gbps…). null = sin dato
      // publicado: no descarta, se declara.
      if(boost&&m.fam==='ec'&&D.boostMbps>0){
        const rec=ArubaReglas.boostRecMbps(m);
        if(rec!=null&&D.boostMbps>rec){ outByBoostRec.push(m.id); return false; }
      }
      // Auditoría de puertos: la regla se evalúa AL FINAL para saber si el modelo habría
      // cumplido todo lo demás (y por tanto el dimensionador está escalando por los puertos o
      // el medio de los enlaces, no por capacidad). La MISMA regla del semáforo de #wanResumen.
      const ev=evaluarPuertos(m,D.wanLinks);
      if(ev.nivel==='rojo'){ outByPuertos.push({m, motivo:ev.motivo}); return false; }
      // El SO del escenario va con la regla: la PPK de los gateways es de AOS-8 (pqc.so); los
      // EdgeConnect corren ECOS y su `pqc` no declara SO, así que el selector no les afecta.
      const motPqc=PQC.motivo(m,nivelPqc,{so:soMode, soNombre:SO_NOMBRE[soMode]||soMode});
      if(motPqc){ outByPqc.push({m, motivo:motPqc}); return false; }
      return true;
    });
    return { candidates, outByBoost, outByClients, outByAps, outBySinDato, outByFlujos, outByPersona, outBySo, outByDtd, outByBoostRec, outBySinSec, outByIds, outByIdsEc, outByPuertos, outByPqc };
  }

  // Sube cuando una misma entrada puede dar otra recomendacion o otra lista; viaja a «Supuestos»
  // (fase 2 de la auditoria del 2026-11-09, ADR-1).
  // 1.0.1 (2026-11-11): un accesorio que el motor pone y que también se eligió en el modal sale una
  // sola vez, en esa misma pasada (antes, la fila manual se soltaba solo para la siguiente).
  const VERSION_MOTOR = '1.0.1';

  /* LA LISTA DE MATERIALES (fase 2 de la auditoria del 2026-11-09, ADR-1, primer corte). Las filas
     que renderBom() armaba entre el pintado salen aqui, sin DOM ni estado: la pagina lee lo que hay
     en pantalla (casillas, opticas elegidas, accesorios del modal) y lo pasa en `ctx`. Las reglas de
     cada fila no cambian y sus comentarios viajan con ellas; la equivalencia con el bloque de la
     pagina la mide scripts/equivalencias/aruba-bom.js.
       ctx.m, ctx.D      el modelo de la lista y el estado derivado del escenario (estadoDerivado)
       ctx.capTier       la licencia de capacidad deducida (gateways 9200), o null
       ctx.haMarcado     la casilla del par HA; ctx.secMode, la seguridad del sitio
       ctx.elegidos      los accesorios elegidos a mano en el modal ({ sku: cantidad }): no se toca
       ctx.inyectados    los accesorios que el diseno exige (accesoriosInyectados de la pagina)
       ctx.pickSfp       las opticas elegidas por medio en el builder de enlaces
       ctx.datos         LICENSES, LICENSES_HA, BUNDLES, CARE, CARE_SKU, CENTRAL, CENTRAL_SERIE,
                         SKU_CAT, SIZING, ACCESSORY_CATALOG, ACCESSORY_COMPAT, DTD y SSE
       ctx.opticaResuelta, ctx.necesidadesOptica   las de la pagina
     Devuelve { filas, soltar, licHa }. `soltar` son los accesorios del modal que la pagina quita de
     la seleccion: los que el modelo no admite y los que el motor ya pone (duplicarlos seria un
     error de pedido). `licHa` es la suscripcion del segundo nodo, que las notas citan. */
  function lineasBom(ctx) {
    const { m, D, capTier, secMode } = ctx;
    const { LICENSES, LICENSES_HA, BUNDLES, CARE, CARE_SKU, CENTRAL, CENTRAL_SERIE, SKU_CAT, SIZING,
      ACCESSORY_CATALOG, ACCESSORY_COMPAT, DTD, SSE } = ctx.datos;
    const qty=D.qty, termYrs=D.termYrs;
    const bundle=D.bundle, care=D.care, central=D.central;
    const bwTier=D.tier, bwCode=bwTier?bwTier.code:null;
    const bloques=D.bloques;
    const esEC=m.fam==='ec', esVirtual=m.id==='EC-V';
    const termino=`término ${termYrs} año${termYrs>1?'s':''}`;
    const famLabel=x=>x.serie+(x.fam==='ec'?' SD-WAN':' · gateway');
    const miles=n=>n==null?'—':n.toLocaleString('en-US');
    const catAcc={catalogo:ACCESSORY_CATALOG, compat:ACCESSORY_COMPAT};
    // La seleccion del modal, en copia: lo que hay que soltar se devuelve, no se borra aqui.
    const acc=Object.assign({}, ctx.elegidos);
    const soltar=[];
    const quita=(sku)=>{ delete acc[sku]; soltar.push(sku); };
    const suelta=(sku)=>{ if(acc[sku]) quita(sku); };
    const lic=LICENSES[bwCode]||null;
    const licTier=lic&&bundle?(lic[bundle]||null):null;
    // Par HA 1+1: HPE publica un juego de SKU propio para el SEGUNDO nodo (LICENSES_HA),
    // con el mismo precio que el estándar — lo que cambia es el SKU de pedido. Aplica a
    // las TRES modalidades desde el 2026-09-16 (pendiente #17 cerrado): el QuickSpecs
    // vigente (a50004289enw) publica la escalera «On-Premises High Availability E-STU» y
    // la lista la tarifa con la misma invariante (HA == estándar, verificada 32/32).
    const haPar=esEC&&!!ctx.haMarcado&&qty===2;
    const licHa=haPar&&bundle?((LICENSES_HA[bwCode]||{})[bundle]||null):null;
    // El soporte se cotiza por MODELO (CARE_SKU, servicio atado a la variante de hardware),
    // no por tier de caudal — desde 2026-09-13 sale de la lista de precios documentada en
    // aruba.js. Lo que la lista no cubre (fcsw, gateways, 4HR del 10150) sigue en consultar.
    const cs=care&&CARE_SKU[m.id]?CARE_SKU[m.id][care]:null;
    const careTier=cs?{sku:{y1:cs.y1[0],y3:cs.y3[0],y5:cs.y5[0]},y1:cs.y1[1],y3:cs.y3[1],y5:cs.y5[1]}:null;
    const licPrice=tierPrice(licTier,termYrs);
    const licHaPrice=tierPrice(licHa,termYrs);
    const carePrice=tierPrice(careTier,termYrs);
    // Boost se licencia como SaaS sobre Foundation/Advanced y como E-STU sobre On-Premises:
    // cada modalidad tiene su propio juego de SKUs (2026-09-13, ver aruba.js).
    const boostCfg=bloques&&SIZING.boost?(bundle==='onprem'?SIZING.boost.onprem:SIZING.boost.saas):null;
    const boostBlk=boostCfg?boostCfg.bloque100:null;
    const boostPrice=tierPrice(boostBlk,termYrs);

    // Los paneles de detalle del equipo («Ficha del equipo», «Capacidad por nivel», «Suscripción»
    // y «Soporte HPE») ya NO se pintan aquí: desde 2026-09-13 viven unificados en la ficha del
    // dimensionador (seccionesDe), una sola tarjeta sin cifras repetidas. Esta función solo
    // mantiene la visibilidad de los campos y construye las filas de la lista de materiales.

    // El pool de Boost NO multiplica por unidad: es un caudal agregado del fabric.
    const filas=[
      {cat:'Equipo', desc:m.id, sku:m.hwSku||null, qty, unit:m.elpN!=null?m.elpN:null,
       nota:`${m.seg} · ${famLabel(m)} · ${m.ifaces}`},
    ];
    // Ópticas y accesorios (fase 12): catálogo maestro del servidor, con precios de la
    // lista oficial del distribuidor; solo los compatibles con el modelo elegido — la
    // selección se depura al cambiar de equipo para no cotizar una óptica incompatible.
    const cfgAcc=ACCESSORY_COMPAT[m.id]||null;
    Object.keys(acc).forEach(sku=>{
      if(!cfgAcc||!cfgAcc.items.includes(sku)) quita(sku);
    });
    // Las filas del modal se guardan aparte y entran al final, detrás del Equipo: el motor pone después
    // accesorios que también se eligen en el modal (el kit de Boost, la óptica de un enlace, la de la
    // interconexión EdgeHA) y los suelta con `suelta()`; sin esperar, esa misma pasada ya llevaba la
    // fila manual y el Excel exportado entonces cotizaba el kit dos veces (mejora propuesta al cerrar el
    // PR #167, hecha el 2026-11-11).
    const manuales=[];
    Object.entries(acc).forEach(([sku,n])=>{
      const a=ACCESSORY_CATALOG[sku];
      if(!a||n<=0) return;
      manuales.push({cat:'Accesorios', desc:a.name, sku, qty:n, unit:a.listPrice!=null?a.listPrice:null,
        nota:'List Price de la lista oficial del distribuidor (vigencia '+(a.vigencia||'s/f')+') — catálogo maestro de accesorios; confirmar precio firme antes de cotizar'});
    });
    // M4 · Inyección automática de hardware (SPEC B.5): accesorios que el DISEÑO exige y
    // que no dependen de la selección manual del modal. El precio sale del catálogo maestro
    // (ACCESSORY_CATALOG: S2N67A $9.096, R7J63A $747 — lista oficial del distribuidor).
    const inyectados=ctx.inyectados||[];
    inyectados.forEach(({sku,qty:qIny,nota,por})=>{
      // Si además se eligió a mano en el modal, la línea inyectada manda y la manual se
      // suelta: duplicar el kit en la cotización sería un error de pedido.
      suelta(sku);
      const a=ACCESSORY_CATALOG[sku]||null;
      filas.push({por, cat:'Accesorios', desc:a?a.name:sku, sku, qty:qIny,
        unit:a&&a.listPrice!=null?a.listPrice:null, nota});
    });
    // Ópticas SFP de los enlaces WAN (petición del dueño, 2026-09-15): una por enlace
    // declarado con medio SFP. En EdgeConnect NO se multiplica por las unidades del par
    // HA (2026-09-17, asistente de cableado EdgeHA): en el diseño oficial de sucursal del
    // VSG SD-Branch (fig. «EC HA») cada enlace aterriza en UN chasis del par y el enlace
    // EdgeHA lleva sus túneles a ambos — el ×2 cotizaba el patrón de HUB («each WAN
    // transport is brought into each appliance») en una sucursal. Los gateways de campus
    // conservan el ×unidades: su cableado HA no se ha validado contra fuente oficial.
    const pickSfp=ctx.pickSfp||{};
    Object.entries(ctx.necesidadesOptica(D.wanLinks)).forEach(([medio,nLinks])=>{
      const {ops, sku}=ctx.opticaResuelta(m.id, medio, pickSfp);
      if(!ops.length) return; // el aviso «este modelo no admite ese medio» vive en #sfpChooser
      const qtyO=esEC?nLinks:nLinks*qty;
      if(!sku){
        filas.push({cat:'Accesorios', desc:`Óptica ${medio} para ${nLinks} enlace${nLinks===1?'':'s'} WAN — PENDIENTE DE SELECCIÓN en el builder`, sku:null, qty:qtyO, unit:null,
          nota:`El escenario declara ${nLinks} enlace${nLinks===1?'':'s'} con medio ${medio} y hay ${ops.length} ópticas compatibles con ${m.id}: selecciona el tipo en la sección de enlaces WAN (pestaña Dimensionar). No entra en el total hasta elegirla.`});
        return;
      }
      // Misma regla anti-duplicado que los inyectados: si esa óptica ya se metió a mano
      // en el modal, la línea del builder manda y la manual se suelta.
      suelta(sku);
      const a=ACCESSORY_CATALOG[sku];
      filas.push({cat:'Accesorios', desc:a.name, sku, qty:qtyO, unit:a.listPrice!=null?a.listPrice:null,
        nota:`Óptica ${medio} × ${qtyO} (${nLinks} enlace${nLinks===1?'':'s'}${esEC&&qty>1?' — EdgeHA: cada enlace aterriza en UN chasis del par (VSG SD-Branch, fig. «EC HA»)':qty>1?` × ${qty} unidades`:''}) — List Price de la lista oficial (vigencia ${a.vigencia||'s/f'}); tipo seleccionado en el builder WAN`});
    });
    // Interconexión EdgeHA (pendiente #7 del dueño, 2026-09-17 — mejora aprobada): el
    // enlace directo entre los dos chasis del par necesita 1 puerto por chasis. Si hay
    // cobre libre lo resuelve un latiguillo (no cotizable desde el catálogo); si va por
    // fibra son 2 ópticas de la velocidad recomendada (≥ agregado — regla declarada de
    // la casa, ver velocidadEdgeHA). Sin elección del usuario la línea queda PENDIENTE
    // DE SELECCIÓN sin precio: declarada, nunca una óptica inventada.
    const ha=interconexionEdgeHA(catAcc, m, qty, D.wanLinks, pickSfp);
    if(ha){
      const agr=fmt(ha.agregado);
      if(ha.modo==='cobre'){
        filas.push({por:'chkHa', cat:'Accesorios', desc:`Latiguillo RJ-45 — interconexión EdgeHA del par (1 puerto ${NOMBRE_PUERTO[ha.puerto]} por chasis)`, sku:null, qty:1, unit:null,
          nota:`La auditoría de puertos del par la lleva por ${NOMBRE_PUERTO[ha.puerto]} libre en los dos chasis («match the media type and speed for both ends», Orchestrator): un latiguillo de cobre, ninguna óptica. El catálogo no cotiza latiguillos.${ha.aviso?` Aviso: ${ha.aviso}.`:''}`});
      }else if(ha.modo==='sinPuerto'){
        filas.push({por:'chkHa', cat:'Accesorios', desc:'Interconexión EdgeHA — sin puerto libre del mismo tipo en los dos chasis', sku:null, qty:2, unit:null,
          nota:'La auditoría de puertos del par no encuentra un puerto libre del mismo tipo en los dos chasis para la interconexión: el modelo no cabe con estos enlaces. Se declara para que la propuesta no salga sin el enlace del par.'});
      }else if(ha.modo==='sinOptica'){
        filas.push({por:'chkHa', cat:'Accesorios', desc:`Interconexión EdgeHA — 2 puertos (1 por chasis)${ha.puerto?` por ${NOMBRE_PUERTO[ha.puerto]}`:''} — óptica a confirmar con HPE`, sku:null, qty:2, unit:null,
          nota:`${ha.aviso.charAt(0).toUpperCase()+ha.aviso.slice(1)} (agregado del sitio ${agr}). No entra en el total: se declara, sin SKU inventado.`});
      }else if(!ha.sku){
        filas.push({por:'chkHa', cat:'Accesorios', desc:'Interconexión EdgeHA — 2 ópticas (1 por chasis) — PENDIENTE DE SELECCIÓN en el builder', sku:null, qty:2, unit:null,
          nota:`La interconexión del par lleva los túneles de cada underlay a ambos chasis (VSG SD-Branch, fig. «EC HA»)${ha.puerto?` y va por ${NOMBRE_PUERTO[ha.puerto]}`:''}. Velocidad ${ha.vel} (≥ agregado del sitio, ${agr} — regla declarada de la casa); hay ${ha.ops.length} ópticas compatibles: selecciona el tipo en la sección de enlaces WAN (pestaña Dimensionar). No entra en el total hasta elegirla.`});
      }else{
        // Misma regla anti-duplicado que el resto de ópticas: si ya se metió a mano en el
        // modal, la línea del builder manda y la manual se suelta.
        suelta(ha.sku);
        const aHA=ACCESSORY_CATALOG[ha.sku];
        filas.push({por:'chkHa', cat:'Accesorios', desc:`${aHA.name} — interconexión EdgeHA del par`, sku:ha.sku, qty:2, unit:aHA.listPrice!=null?aHA.listPrice:null,
          nota:`Óptica ${ha.vel} × 2 (1 por chasis)${ha.puerto?`, por ${NOMBRE_PUERTO[ha.puerto]}: no queda cobre libre del mismo tipo en los dos chasis`:''} — ≥ agregado del sitio (${agr}), regla declarada de la casa. List Price de la lista oficial (vigencia ${aHA.vigencia||'s/f'}); tipo seleccionado en el builder WAN`});
      }
    }
    if(esEC){
      if(bundle){
        if(licHa){
          // Par HA 1+1: 1× suscripción estándar (nodo primario) + 1× suscripción de alta
          // disponibilidad (segundo nodo, SKU «HA» del QuickSpecs). Misma forma en SaaS
          // (Foundation/Advanced HA) y en On-Premises (E-STU HA, desde el 2026-09-16).
          filas.push({cat:'Suscripción SD-WAN', desc:`${BUNDLES[bundle].n} — ${bwTier?bwTier.n:'tier por definir'} · nodo primario`,
            sku:tierSku(licTier,termYrs), qty:1, unit:licPrice,
            nota:`${termino} · suscripción por caudal del sitio, no por modelo de appliance`});
          filas.push({por:'chkHa', cat:'Suscripción SD-WAN', desc:`${BUNDLES[bundle].n} HA — ${bwTier?bwTier.n:'tier por definir'} · segundo nodo del par 1+1`,
            sku:tierSku(licHa,termYrs), qty:1, unit:licHaPrice,
            nota:`${termino} · ${D.onprem
              ?'SKU HA E-STU del QuickSpecs (sección «On-Premises High Availability», verificada 2026-09-16)'
              :'SKU de alta disponibilidad del QuickSpecs (existencia y regla «match tier, bandwidth, term»)'}; la lista de precios documentada lo tarifa igual que el estándar`});
        }else{
          filas.push({cat:'Suscripción SD-WAN', desc:`${BUNDLES[bundle].n} — ${bwTier?bwTier.n:'tier por definir'}`,
            sku:tierSku(licTier,termYrs), qty, unit:licPrice,
            nota:`${termino} · suscripción por caudal del sitio, no por modelo de appliance`
              +(haPar&&D.onprem?' · par HA on-prem: la escalera de SKU HA E-STU no llegó del servidor — consultar':'' )});
        }
        if(bloques){
          filas.push({por:'chkBoost', cat:'Aceleración', desc:`${SIZING.boost.n} — bloque de ${SIZING.boost.bloque} Mbps`,
            sku:tierSku(boostBlk,termYrs), qty:bloques, unit:boostPrice,
            nota:`Pool agregado del fabric (${fmt(bloques*SIZING.boost.bloque)} = 30 % del tráfico WAN privado estimado). Orchestrator lo reparte entre sedes; no multiplica por unidad.`});
        }
        // Dynamic Threat Defense (pendiente #31, 2026-09-14): licencia opcional APARTE de
        // Foundation y Advanced (QuickSpecs p.32) pero DE la suscripción — sin ella no se
        // cotiza (igual que Boost; lo declara la revisión del diseño). SÍ está en la lista
        // de precios vigente: escalera PLANA por appliance (sin tiers de caudal), con SKU
        // por modalidad × término. Con HA 1+1, dos líneas como el resto de licencias:
        // 1× estándar (nodo primario) + 1× SKU de alta disponibilidad (segundo nodo) — la
        // lista lo tarifa igual que el estándar, invariante verificada 2026-09-14.
        if(secMode==='dtd'){
          // La lista también publica término de 7 años: por alcance se modela a 5 (#28).
          const yrs=termYrs>=7?5:termYrs;
          const nota7=termYrs>=7?' · la lista publica también 7 años: se modela a 5 por alcance (#28)':'';
          const notaBase=`${termino} · licencia opcional aparte de Foundation/Advanced (QuickSpecs p.32) · List Price de la lista vigente (2026-06-01)${nota7}`;
          const dtdMod=D.onprem?'onprem':'saas';
          const dtdStd=DTD?DTD[dtdMod]:null, dtdHa=DTD?DTD[dtdMod+'Ha']:null;
          if(!dtdStd){
            // Fallback pre-merge de DATOS: sin la escalera en el API, «consultar».
            filas.push({cat:'Seguridad', desc:'Dynamic Threat Defense — IDS/IPS, DDoS adaptativo, clasificación web',
              sku:null, qty, unit:null,
              nota:`${termino} · licencia opcional aparte de Foundation/Advanced (QuickSpecs p.32) · la escalera de precios no llegó del servidor — consultar`});
          }else if(haPar&&dtdHa){
            filas.push({cat:'Seguridad', desc:'Dynamic Threat Defense — IDS/IPS, DDoS adaptativo, clasificación web · nodo primario',
              sku:tierSku(dtdStd,yrs), qty:1, unit:tierPrice(dtdStd,yrs), nota:notaBase});
            filas.push({por:'chkHa', cat:'Seguridad', desc:'Dynamic Threat Defense HA — IDS/IPS del segundo nodo del par 1+1',
              sku:tierSku(dtdHa,yrs), qty:1, unit:tierPrice(dtdHa,yrs),
              nota:`${termino} · SKU de alta disponibilidad del segundo nodo; la lista lo tarifa igual que el estándar (invariante verificada 2026-09-14)${nota7}`});
          }else{
            filas.push({cat:'Seguridad', desc:'Dynamic Threat Defense — IDS/IPS, DDoS adaptativo, clasificación web',
              sku:tierSku(dtdStd,yrs), qty, unit:tierPrice(dtdStd,yrs), nota:notaBase});
          }
        }
        // Modalidad On-Premises (E-STU): la suscripcion INCLUYE el software de Orchestrator
        // on-prem (data sheet oficial a50010073enw); lo que corre por cuenta del cliente es
        // el ALOJAMIENTO — VM, disponibilidad, backup y actualizaciones. La linea lo declara
        // para que la propuesta no olvide dimensionar esa infraestructura (2026-09-13, fase 10).
        if(D.onprem){
          filas.push({por:'chkOnprem', cat:'Orquestación', desc:'Orchestrator auto-alojado — software incluido en la suscripción On-Premises',
            sku:null, qty:1, unit:null,
            nota:'Sin coste de licencia (incluido en E-STU) · el alojamiento —VM, uptime, backup y upgrades— corre por cuenta del cliente'});
        }
      }
    }else{
      if(central){
        // A3 (auditoría 2026-09-17, corregido 2026-09-24): los SKU de Central cargados
        // (JZ118–JZ123AAE) son los de la lista con descripción literal «Aruba 7/90xx Gtwy», y se
        // aplicaban a TODO gateway — también a los 9106/9114 (serie 9100), al 9240 (serie 9200)
        // y a la serie 7200. Para esas series la lista cargada no trae su SKU (la 72xx tiene su
        // propia familia, documentada en aruba.js sin precio cargado; la 91xx/92xx está por
        // confirmar con HPE): la línea queda en «consultar» con el motivo, nunca con el SKU y el
        // precio de otra serie.
        const conSeg=secMode==='gwsec';
        const c=centralParaModelo({centralSerie:CENTRAL_SERIE, central:CENTRAL, skuCat:SKU_CAT}, m, central, termYrs, conSeg);
        filas.push({cat:'Suscripción de gestión', desc:c?c.n:(CENTRAL[central]||{}).n||'Central',
          sku:c?c.sku:null, qty, unit:c?c.precio:null,
          nota:!c
            ?`${termino} · HPE Aruba Networking Central, suscripción por dispositivo · CONSULTAR: el documento oficial no publica el nivel ${conSeg?'«+ Security» ':''}para la ${m.serie}`
            :c.precio!=null
              ?`${termino} · HPE Aruba Networking Central, suscripción por dispositivo`
              :`${termino} · HPE Aruba Networking Central, suscripción por dispositivo · SKU oficial de la ${m.serie}; precio a confirmar con el distribuidor`});
      }
      if(capTier&&capTier.code!=='hw'){
        filas.push({cat:'Licencia perpetua', desc:`Capacidad ${capTier.n}`, sku:capTier.sku||null, qty, unit:capTier.elp!=null?capTier.elp:null,
          nota:`Amplía el mismo hardware a ${fmt(capTier.fw)} · ${miles(capTier.aps)} APs · ${miles(capTier.clients)} dispositivos`});
      }
    }
    // A5 (auditoría 2026-09-17, corregido 2026-09-24): los APs solo limitaban el modelo — ni su
    // hardware ni su suscripción de Central por AP aparecían en la lista, y la propuesta salía
    // corta sin decirlo. Este catálogo no trae modelos de AP: la línea entra DECLARADA, con la
    // cantidad del escenario y sin SKU ni precio, que es lo que la cuenta como «sin cotizar».
    if(D.aps>0){
      filas.push({cat:'Acceso inalámbrico', desc:`Puntos de acceso — hardware y suscripción de Central por AP`, sku:null, qty:D.aps, unit:null,
        nota:'Fuera del catálogo de este dimensionador: el modelo de AP y su suscripción de Central se eligen y cotizan aparte. Se declara para que la propuesta no salga corta.'});
    }
    // HPE Aruba Networking SSE (SPEC B.4): suscripcion POR USUARIO (ZTNA, SWG, CASB, DEM —
    // paquetes oficiales Foundation ZTNA / Foundation SWG / Foundation Plus / Advanced /
    // Advanced Plus, QuickSpecs SSE a50009212enw). SKU y precio del global `sse` del API
    // (R8M36AAE, precio null → «consultar», EXCLUIDA de los totales con nota al pie);
    // co-terminada con la suscripción del sitio (mismo término). Si el frente DATOS aún no
    // sirve el global, la línea entra igualmente con el SKU del contrato y «consultar».
    if(secMode==='sse'){
      const sseSku=(SSE&&SSE.sku)||'R8M36AAE';
      const ssePrecio=SSE&&SSE.precio!=null?SSE.precio:null;
      // Usuarios = cantidad de licencias (petición del dueño, 2026-09-15): sin la cifra la
      // línea NO se cotiza con un «1» inventado — queda PENDIENTE y el campo #users se
      // marca como requerido en el formulario (ver marcarUsersReq en render).
      const nUsers=parseInt(D.users)>0?parseInt(D.users):null;
      filas.push({cat:'Seguridad SASE', desc:'HPE Aruba Networking SSE — suscripción por usuario (ZTNA, SWG, CASB, DEM)'
          +(nUsers?'':' — PENDIENTE: declara los usuarios del sitio'),
        sku:sseSku, qty:nUsers, unit:ssePrecio,
        nota:nUsers
          ?`${termino} · co-terminada con la suscripción del sitio · por usuario (${miles(nUsers)} usuarios) · paquetes Foundation ZTNA / Foundation SWG / Foundation Plus / Advanced / Advanced Plus (QuickSpecs SSE)${SSE&&SSE.nota?' · '+SSE.nota:''} · HPE no publica List Price — consultar`
          :`SSE se suscribe POR USUARIO (QuickSpecs SSE) y el escenario no declara usuarios: la cantidad de licencias no se puede fijar. Rellena «Usuarios / dispositivos concurrentes» en el módulo 2.`});
    }
    if(care&&!esVirtual){
      filas.push({cat:'Soporte', desc:CARE[care].n, sku:tierSku(careTier,termYrs), qty, unit:carePrice,
        nota:`${termino} · ${CARE[care].sla}`});
    }
    // Lo que el motor soltó del modal porque ya lo pone él no entra: una sola fila por accesorio.
    const sueltos=new Set(soltar);
    filas.splice(1, 0, ...manuales.filter(f=>!sueltos.has(f.sku)));
    return { filas, soltar, licHa };
  }

  return { VERSION_MOTOR, BOOST_CUOTA, tierParaCaudal, capacidadSo, boostMbpsSitio, boostRecMbps, admiteDtd, escenariosUnderlay, escenarioBoost,
    MEDIO_MBPS, medioMinimo, asignarPuertos, asignarPuertosPar, enlacesSobreMedio,
    LAN_RESERVADOS, NOMBRE_PUERTO, VELOCIDAD_OPTICA, VEL_JAULA, fmt, opticasPorVelocidad, parEdgeHA, velocidadEdgeHA, sinJaulasSfp,
    velocidadesJaula, opcionesHa, interconexionEdgeHA, inventarioTxt, cobreSfp, auditarPuertos, motivoPuertos, evaluarPuertos,
    clientesMax, apsMax, nivelLicenciaNecesario, bloquesBoost, flujosDe, tierPrice, tierSku, baseParaModelo, centralParaModelo, filtrarCandidatos, lineasBom };
});
