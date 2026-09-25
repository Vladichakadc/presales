'use strict';
/* global module */
/* ══ REGLAS PURAS DEL DIMENSIONADOR FORTIGATE ═══════════════════════════════════════════
   Salen del «Informe final de validacion tecnica y plan de mejora del modulo Fortinet
   Presales» (22-sep-2026), que consolida dos auditorias y clasifica sus hallazgos en P0
   tecnico, P0 comercial, P1 arquitectonico y P2 de experiencia.

   ESTAN AQUI, FUERA DE LA PAGINA, POR EL MISMO MOTIVO QUE `aruba-reglas.js`: eran reglas de
   calculo y de licenciamiento enterradas en un archivo que necesita DOM, asi que no habia
   forma de probarlas. Las veinte pruebas de aceptacion del informe (AT-01 a AT-20) se
   afirman contra este modulo en `test/fortinet-reglas.test.js`; lo que de verdad necesita un
   navegador -que la pantalla las CONDUZCA- se prueba en `test/e2e/e2e-fortinet-auditoria.js`.
   Mismo patron UMD que `motor-ingenieria.js`: global `FortinetReglas` en el navegador,
   require() en Node.

   LOS CUATRO CAMBIOS DE FONDO, Y LO QUE CADA UNO SUSTITUYE
   ────────────────────────────────────────────────────────
   1. MULTIEJE EN VEZ DE UNA CIFRA DERIVADA. El motor anterior reducia el modelo a UNA
      capacidad efectiva y comparaba contra UN requerimiento. Ahora cada eje -firewall,
      IPsec, IPS, NGFW, Threat Protection, SSL, sesiones y sesiones nuevas por segundo-
      tiene su propia demanda, su propia capacidad OFICIAL y su propia utilizacion. El
      maximo de todas define el cuello de botella, que es lo que se explica en pantalla.

   2. SSL ES UN EJE, NO UN CASTIGO PORCENTUAL. Es el P0 tecnico del informe. La pagina
      estimaba la inspeccion SSL como `tp x 0,65`; el Product Matrix publica la cifra por
      modelo y el cociente ssl/tp va de 0,52 a 1,18 -en el 50G, el 70G y el 90G el equipo
      aguanta MAS SSL que Threat Protection-. Un factor unico no es conservador: se
      equivoca en las dos direcciones. Sin cifra oficial el modelo se APARTA con su motivo
      y se pide PoC; nunca se sustituye por la de otra capa.

   3. EL BUNDLE SE DERIVA DE LAS FUNCIONES Y BLOQUEA LO QUE ESTA POR DEBAJO. Y el soporte
      incluido dentro del bundle NO se vuelve a cotizar: los tres bundles traen FortiCare
      Premium, y el BOM anadia ademas una linea de soporte siempre.

   4. EL TERMINO PRODUCE UN SKU PEDIBLE. En el price list el sufijo `DD` es el marcador del
      patron, no un codigo: una cotizacion con `-DD` no se puede pasar a un distribuidor.

   LO QUE ESTE MODULO NO HACE, A PROPOSITO
   ───────────────────────────────────────
   No aplica ninguno de los factores que el informe manda EXCLUIR -0,55 y 0,45 para SSL,
   0,95 para SD-WAN, 0,90 para SIP, 0,70 para proxy, 0,95 para logging, 0,85 por nodo en
   HA activo-activo, 0,95 por politica DDoS, 15 % por VDOM-, ni los pisos de serie (60F
   como minimo de SD-WAN, pisos fijos para OSPF/BGP). No son cifras publicadas: dependen
   del flujo, del perfil, del cifrado y de la configuracion. Donde el informe los convierte
   en advertencia o en escenario de prueba, esa advertencia se emite; multiplicar por ellos
   seria inventar precision. */
(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.FortinetReglas = api;
}(typeof window !== 'undefined' ? window : globalThis, function () {

  /* ── 1 · EJES DE DIMENSIONAMIENTO ─────────────────────────────────────────────────────
     Cada eje declara de que campo del catalogo sale su capacidad y como se lee un hueco.

     `dureza` ES EL CAMPO QUE EVITA DOS ERRORES OPUESTOS, y por eso son dos valores y no uno:

       'dura'  — si el escenario pide este eje y el catalogo NO trae la cifra del modelo, el
                 modelo se APARTA con su motivo. Es el caso de SSL: marcar «inspeccion
                 profunda SSL/TLS» es declarar que ESA es la metrica que manda, asi que
                 recomendar un equipo sin ella seria recomendar a ciegas justo el eje que se
                 pidio. Regla 5.1 del informe y AT-20.

       'blanda'— el eje se evalua donde hay dato y se DECLARA ausente donde no, sin apartar.
                 Es el caso de `cps` en el 100F y el 200F: es un eje derivado (sale de las
                 sesiones y de su vida media, no de un dato que nadie pidio) y apartar dos
                 modelos vigentes por un hueco del «Top Selling Models Matrix» seria
                 esconderlos de una propuesta por un defecto del documento, no del equipo.

     Confundirlos en un solo comportamiento es lo que produce o bien un catalogo mutilado o
     bien una recomendacion sobre un dato que nadie midio. */
  const EJES = [
    { k: 'fw', escalaMbps: true, n: 'Firewall', frase: 'el firewall', campo: 'fw', dureza: 'dura',
      metodo: 'Firewall Throughput (1518 B UDP), sesión descargada al ASIC de red' },
    { k: 'vpn', escalaMbps: true, n: 'IPsec VPN', frase: 'el motor IPsec', campo: 'vpn', dureza: 'dura',
      metodo: 'IPsec VPN Throughput (512 B), criptografía descargada al ASIC' },
    { k: 'ips', escalaMbps: true, n: 'IPS', frase: 'el IPS', campo: 'ips', dureza: 'dura',
      metodo: 'IPS Throughput (Enterprise Mix)' },
    { k: 'ngfw', escalaMbps: true, n: 'NGFW', frase: 'el NGFW', campo: 'ngfw', dureza: 'dura',
      metodo: 'NGFW Throughput (Enterprise Mix) = IPS + Application Control' },
    { k: 'tp', escalaMbps: true, n: 'Threat Protection', frase: 'Threat Protection', campo: 'tp', dureza: 'dura',
      metodo: 'Threat Protection (Enterprise Mix) = NGFW + antivirus + logging' },
    { k: 'ssl', escalaMbps: true, n: 'Inspección SSL', frase: 'la inspección SSL', campo: 'ssl', dureza: 'dura',
      metodo: 'SSL Inspection Throughput (IPS activo, promedio de sesiones HTTPS)' },
    { k: 'sess', n: 'Sesiones concurrentes', frase: 'la tabla de sesiones', campo: 'sess', dureza: 'dura',
      unidad: 'sesiones', metodo: 'Concurrent Sessions (valor base, sin licencia Hyperscale)' },
    { k: 'cps', n: 'Sesiones nuevas / s', frase: 'las sesiones nuevas por segundo', campo: 'cps', dureza: 'blanda',
      unidad: 'cps', metodo: 'New Sessions/Sec (TCP, modo flow)' },
    // ── LIMITES DE CONFIGURACION (Product Matrix, sept-2026) ───────────────────────────
    // Entraron el 2026-09-23 y cierran el hueco que este mismo modulo declaraba en pantalla:
    // la pagina pedia tuneles y usuarios de acceso remoto y despues decia que el tope por
    // modelo «no esta en este catalogo». Un control que no se puede contrastar invita a creer
    // que se tuvo en cuenta, que es peor que su ausencia.
    //
    // `configuracion: true` LOS SEPARA DE LOS EJES DE RENDIMIENTO, y no es cosmetico: el
    // techo de utilizacion es una politica sobre CIFRAS DE LABORATORIO («no disenar al 100 %
    // de un numero medido en banco»). Un maximo de tuneles, de VDOM o de usuarios
    // recomendados no es una medicion: es un tope de la plataforma. Aplicarle el mismo
    // margen apartaria un modelo por un limite que el fabricante declara como absoluto, y
    // encima en silencio. Se comparan contra el 100 % de lo publicado.
    { k: 'tunGw', n: 'Túneles IPsec sitio a sitio', frase: 'los túneles del overlay', campo: 'tunGw',
      dureza: 'dura', unidad: 'túneles', configuracion: true,
      metodo: 'Max G/W to G/W IPsec Tunnels (Product Matrix)' },
    { k: 'tunCli', n: 'Túneles IPsec de cliente', frase: 'los túneles de acceso remoto', campo: 'tunCli',
      dureza: 'dura', unidad: 'túneles', configuracion: true,
      metodo: 'Max Client to G/W IPsec Tunnels (Product Matrix)' },
    { k: 'sslVpnUsers', n: 'Usuarios SSL-VPN concurrentes', frase: 'los usuarios SSL-VPN', campo: 'sslVpnUsers',
      dureza: 'dura', unidad: 'usuarios', configuracion: true,
      metodo: 'Concurrent SSL VPN Users (Recommended Maximum, Tunnel Mode)' },
    { k: 'sslVpn', n: 'Caudal SSL-VPN', frase: 'el motor SSL-VPN', campo: 'sslVpn', dureza: 'dura',
      metodo: 'SSL VPN Throughput (Product Matrix)' },
    { k: 'vdom', n: 'Dominios virtuales', frase: 'los dominios virtuales', campo: 'vdomMax',
      dureza: 'dura', unidad: 'VDOM', configuracion: true,
      metodo: 'Virtual Domains (Max) (Product Matrix)' },
    // ── ESCALA DEL SECURITY FABRIC (2026-09-23, hallazgo F15 del informe de auditoria) ────
    // Cuantos FortiAP y FortiSwitch gestiona el equipo por FortiLink, y cuantos FortiToken
    // puede registrar para el doble factor del acceso remoto. Son topes de plataforma que el
    // Product Matrix publica por modelo (y las fichas por serie para 400F, 600F y 1000F), asi
    // que van con `configuracion: true` por la misma razon que los tuneles.
    { k: 'aps', n: 'FortiAP gestionados', frase: 'los FortiAP gestionados', campo: 'aps',
      dureza: 'dura', unidad: 'FortiAP', configuracion: true,
      metodo: 'Max FortiAPs (Total) (Product Matrix)' },
    { k: 'switches', n: 'FortiSwitch gestionados', frase: 'los FortiSwitch gestionados', campo: 'switches',
      dureza: 'dura', unidad: 'FortiSwitch', configuracion: true,
      metodo: 'Max FortiSwitches (Product Matrix)' },
    { k: 'tokens', n: 'FortiToken (doble factor)', frase: 'los FortiToken del acceso remoto', campo: 'tokens',
      dureza: 'dura', unidad: 'FortiToken', configuracion: true,
      metodo: 'Max FortiTokens (Product Matrix)' },
  ];
  // `escalaMbps` marca los ejes cuya demanda es PROPORCIONAL al caudal del sitio. Solo esos
  // sirven para responder «hasta cuantos Mbps aguanta este modelo en este escenario»: el
  // caudal SSL-VPN y los limites de configuracion son constantes declaradas aparte, y
  // meterlos en esa regla de tres daria un tope que se mueve al cambiar un dato que no es
  // caudal. Antes esto se deducia de «no tiene `unidad`», que valia por casualidad.
  const EJE_POR_K = Object.fromEntries(EJES.map((e) => [e.k, e]));

  // Las cinco capas de inspeccion, de menor a mayor profundidad. El orden ES la regla: una
  // funcion activa impone un piso, y se dimensiona contra la mas profunda de las activas.
  const ORDEN_CAPAS = ['fw', 'vpn', 'ips', 'ngfw', 'tp'];

  /* ── 2 · DEMANDA DE TRAFICO ───────────────────────────────────────────────────────────
     AT-11. `max(WAN, inter-VLAN)` SOLO vale si alguien declara que los picos no coinciden;
     en cualquier otro caso se suma. El defecto tiene que ser la suma, porque es la lectura
     conservadora y porque `max` automatico es exactamente lo que baja de familia sin que
     nadie lo haya decidido -el informe lo demuestra con su ejemplo recalculado: 600 Mbps de
     Internet y 300 de inter-VLAN dan 750 u 1.125 Mbps segun el supuesto, y eso cambia el
     equipo-.

     `crecimiento` y `techo` SON POLITICAS DISTINTAS y por eso son dos parametros:
       · crecimiento infla la DEMANDA (el trafico que habra dentro de N meses);
       · techo limita la UTILIZACION admisible de la capacidad publicada (no disenar al
         100 % de una cifra de laboratorio).
     Mezclarlos en un solo «margen» hace imposible responder «¿a que utilizacion queda?». */
  function demandaTrafico(e) {
    const en = (v) => Math.max(0, Number(v) || 0);
    const internet = en(e && e.internet);
    const interVlan = en(e && e.interVlan);
    const otros = en(e && e.otros);
    const concurrentes = !(e && e.picosNoConcurrentes);
    const base = concurrentes ? internet + interVlan + otros
      : Math.max(internet, interVlan, otros);
    const crecimiento = Math.max(0, Number(e && e.crecimiento) || 0);
    return {
      internet, interVlan, otros, concurrentes,
      base,
      previsto: base * (1 + crecimiento),
      crecimiento,
      regla: concurrentes
        ? 'suma de los caminos (supuesto por defecto: los picos coinciden)'
        : 'máximo entre los caminos (declarado: los picos no son concurrentes)',
    };
  }

  /* ── 3 · CAPA EFECTIVA ────────────────────────────────────────────────────────────────
     Activar una funcion de inspeccion no encarece un porcentaje la capa elegida: CAMBIA la
     cifra del datasheet que aplica. `funciones` es el catalogo declarado en legacyData;
     `activas` es el conjunto de ids marcados. La eleccion del usuario vale como base -puede
     dimensionar contra algo mas exigente- pero nunca contra algo mas liviano. */
  function capaEfectiva(elegida, activas, funciones) {
    const base = ORDEN_CAPAS.indexOf(elegida);
    let idx = base < 0 ? ORDEN_CAPAS.indexOf('tp') : base;
    const elevan = [];
    for (const f of funciones || []) {
      if (!f.capa || !(activas || []).includes(f.id)) continue;
      const i = ORDEN_CAPAS.indexOf(f.capa);
      if (i > (base < 0 ? 0 : base)) elevan.push(f);
      if (i > idx) idx = i;
    }
    return { k: ORDEN_CAPAS[idx], elevan, elevada: idx > base };
  }

  /* ── 4 · EVALUACION MULTIEJE ──────────────────────────────────────────────────────────
     `demandas` es {eje: cantidad}; un eje ausente o en 0 no se evalua. `techo` es la
     utilizacion maxima admitida (1 = sin techo declarado mas alla del crecimiento).

     TRES ESTADOS POR EJE, NO DOS. `ok`, `excede` y `sinDato`, que dice algo del CATALOGO y
     no del equipo: tratarlo como `ok` recomienda a ciegas y tratarlo como `excede` descarta
     un equipo por un hueco documental. Es el mismo tercer estado que ya protege `redund` y
     las casillas del comparador. */
  // Utilizacion legible. Con dos decimales por debajo del 1 % porque ahi es donde vive el
  // hallazgo util: un eje al 0,35 % esta a dos ordenes de magnitud del que manda, y
  // redondearlo a «0 %» esconde justo la distancia que evita subir de gama sin motivo.
  const pct = (u) => (u == null ? '—'
    : u * 100 < 1 ? `${(u * 100).toFixed(2)} %` : `${Math.round(u * 100)} %`);

  function evaluarModelo(m, demandas, opciones) {
    const o = opciones || {};
    const techo = o.techo > 0 ? o.techo : 1;
    const ejes = [];
    let apartaPor = null;
    for (const def of EJES) {
      const req = Math.max(0, Number(demandas && demandas[def.k]) || 0);
      if (!req) continue;
      const cap = m[def.campo];
      if (cap == null) {
        ejes.push({ k: def.k, n: def.n, frase: def.frase, unidad: def.unidad || 'Mbps',
          metodo: def.metodo, req, cap: null, u: null, estado: 'sinDato', dureza: def.dureza });
        if (def.dureza === 'dura' && !apartaPor) apartaPor = def;
        continue;
      }
      // El techo de utilizacion NO se aplica a un maximo de configuracion: ver la nota de
      // `configuracion` en EJES. Un tope de plataforma se compara contra si mismo.
      const techoEje = def.configuracion ? 1 : techo;
      const u = req / cap;
      ejes.push({ k: def.k, n: def.n, frase: def.frase, unidad: def.unidad || 'Mbps',
        metodo: def.metodo, req, cap, u, configuracion: !!def.configuracion,
        estado: u > techoEje ? 'excede' : 'ok', dureza: def.dureza });
    }
    const conDato = ejes.filter((e) => e.u != null);
    const manda = conDato.length ? conDato.reduce((a, b) => (b.u > a.u ? b : a)) : null;
    const excede = conDato.filter((e) => e.estado === 'excede');
    const sinDato = ejes.filter((e) => e.estado === 'sinDato');
    let estado = 'ok';
    let motivo = null;
    if (apartaPor) {
      estado = 'apartado';
      motivo = `el catálogo no trae ${apartaPor.n} de este modelo, y es el eje que el `
        + 'escenario pide dimensionar: se aparta en vez de sustituirlo por otra capa. '
        + 'Confirmar con el Product Matrix o validar con PoC.';
    } else if (excede.length) {
      estado = 'excede';
      const p = excede[0];
      motivo = `${p.n} al ${pct(p.u)} de ${p.configuracion ? 'lo que la plataforma admite' : 'la cifra publicada'}`
        + (techo < 1 && !p.configuracion ? ` (techo de utilización declarado: ${pct(techo)})` : '');
    }
    return {
      // QUE EJE lo aparto, como dato y no como cadena. Quien lo pinta necesita agrupar por
      // motivo -«3 sin cifra de SSL» y «5 sin tope de tuneles» son dos tareas de datos
      // distintas-, y sacarlo de una expresion regular sobre `motivo` seria atar el texto de
      // pantalla a una decision de logica: cambiar una palabra romperia el recuento en
      // silencio, que es como se llega a un contador que cuenta cualquier cosa.
      apartadoPor: apartaPor ? apartaPor.k : null,
      apartadoPorN: apartaPor ? apartaPor.n : null,
      id: m.id, estado, motivo, ejes, manda,
      uMax: manda ? manda.u : null,
      // Un eje 'blanda' sin dato no aparta, pero tampoco se calla: la ficha lo declara.
      sinComprobar: sinDato.filter((e) => e.dureza === 'blanda').map((e) => e.n),
    };
  }

  // `apartados` sale ordenado por motivo para que la lista corta se explique en vez de
  // leerse como catalogo completo -misma regla que la calculadora de throughput-.
  function evaluar(modelos, demandas, opciones) {
    const aptos = [];
    const apartados = [];
    for (const m of modelos || []) {
      const r = evaluarModelo(m, demandas, opciones);
      if (r.estado === 'ok') aptos.push({ modelo: m, eval: r });
      else apartados.push({ modelo: m, eval: r });
    }
    return {
      aptos,
      apartados,
      sinDatoCritico: apartados.filter((x) => x.eval.estado === 'apartado').length,
      porCapacidad: apartados.filter((x) => x.eval.estado === 'excede').length,
    };
  }

  /* ── 5 · BUNDLE MINIMO ────────────────────────────────────────────────────────────────
     AT-03. El bundle sale de las FUNCIONES pedidas, y elegir uno por debajo se bloquea.
     Se deriva del `incluye` de cada bundle y no de una tabla paralela funcion -> bundle:
     dos sitios con el mismo dato se desincronizan, y aqui el que se quedaria atras es el
     que decide si una cotizacion es valida.

     Una funcion con `servicio:null` NO eleva el bundle: es de FortiOS (inspeccion TLS) o se
     cotiza como producto aparte (FortiSandbox). Confundirlas es como se llega a «multi-WAN
     obliga a Enterprise», que el informe desmiente expresamente (AT-07). */
  /* «NO INCLUIR» EN LOS DOS COMBOS COMERCIALES (peticion del dueño, 2026-09-22).
     Hay dos cotizaciones legitimas que antes no se podian armar: la de solo hardware -un
     cliente que ya tiene sus suscripciones vigentes y amplia el parque- y la que separa
     equipo de servicios para negociarlos por vias distintas.
     NO ES UN BLOQUEO, PERO TAMPOCO ES MUDO. Excluir el bundle teniendo funciones de
     inspeccion pedidas produce una cotizacion que NO alcanza para el escenario descrito, y
     eso se DECLARA como aviso en vez de bloquear la exportacion: quien lo excluye
     normalmente sabe por que, y bloquearlo le dejaria sin salida salvo copiar la tabla a
     mano -que es justo como se pierde la advertencia-. Callarlo seria peor: es una
     cotizacion corta presentada como completa. */
  const SIN_LINEA = 'none';

  function bundleMinimo(activas, funciones, bundles) {
    const pedidos = [];
    for (const f of funciones || []) {
      if (!(activas || []).includes(f.id) || !f.servicio) continue;
      for (const s of [f.servicio].concat(f.tambien || [])) {
        if (!pedidos.some((p) => p.servicio === s)) pedidos.push({ servicio: s, por: f });
      }
    }
    const codigos = Object.keys(bundles || {});
    const cubre = (code) => pedidos.every((p) => (bundles[code].incluye || []).includes(p.servicio));
    const validos = codigos.filter(cubre).sort((a, b) => (bundles[a].nivel || 0) - (bundles[b].nivel || 0));
    const minimo = validos.length ? validos[0] : null;
    return {
      servicios: pedidos.map((p) => p.servicio),
      validos,
      minimo,
      // Quien exige el bundle mas alto, para poder decirlo en vez de solo bloquear.
      // SE AGRUPA POR FUNCION, no por servicio: «IoT Detection + DLP» pide DOS servicios
      // (`dlp` e `iot`) y sin agrupar el mensaje salia con la misma funcion repetida dos
      // veces -«no cubre IoT Detection + DLP y IoT Detection + DLP»-, que es la clase de
      // detalle que hace dudar de todo lo demas que dice la pantalla.
      exigentes: Object.values(pedidos
        .filter((p) => !codigos.filter((c) => (bundles[c].nivel || 0) < (bundles[minimo] ? bundles[minimo].nivel : 99))
          .some((c) => (bundles[c].incluye || []).includes(p.servicio)))
        .reduce((acc, p) => {
          const k = p.por.id || p.por.n;
          if (!acc[k]) acc[k] = { funcion: p.por.n, servicios: [], porQue: p.por.porQue || null };
          acc[k].servicios.push(p.servicio);
          return acc;
        }, {})),
    };
  }

  // ¿El bundle elegido esta por debajo del minimo? Devuelve el hallazgo o null. El campo
  // `bloquea` distingue los dos casos: un bundle REAL por debajo del minimo es una
  // cotizacion que no se puede pedir (bloquea), y «no incluir» es una exclusion deliberada
  // que solo hay que declarar.
  function validarBundle(elegido, activas, funciones, bundles) {
    const min = bundleMinimo(activas, funciones, bundles);
    if (elegido === SIN_LINEA) {
      // Sin ninguna funcion que licenciar no hay nada que declarar: excluir el bundle es
      // entonces una cotizacion de hardware coherente consigo misma. `min.minimo` NO sirve
      // de guarda aqui -sin servicios pedidos todos los bundles «cubren» el vacio y el
      // minimo sale igualmente-, asi que se mira lo que de verdad se pide.
      if (!min.servicios.length) return null;
      const quien = min.exigentes.map((e) => e.funcion).join(' y ') || min.servicios.join(', ');
      return {
        codigo: 'bundle-excluido',
        bloquea: false,
        nivel: 'warning',
        minimo: min.minimo,
        mensaje: `El bundle FortiGuard se ha excluido de la cotización, pero el escenario pide `
          + `${quien}, que necesita ${bundles[min.minimo].n}. La cotización cubre el equipo, `
          + 'no el escenario: la suscripción tiene que estar vigente por otra vía.',
        detalle: min.exigentes.map((e) => e.porQue).filter(Boolean),
      };
    }
    if (!min.minimo || min.validos.includes(elegido)) return null;
    const nombres = min.exigentes.map((e) => e.funcion).join(' y ');
    return {
      codigo: 'bundle-insuficiente',
      bloquea: true,
      nivel: 'bloqueo',
      minimo: min.minimo,
      mensaje: `${bundles[elegido] ? bundles[elegido].n : elegido} no cubre `
        + `${nombres || min.servicios.join(', ')}. El bundle mínimo para este escenario es `
        + `${bundles[min.minimo].n}.`,
      detalle: min.exigentes.map((e) => e.porQue).filter(Boolean),
    };
  }

  /* ── 6 · SKU CON TERMINO REAL ─────────────────────────────────────────────────────────
     AT-06. `DD` es el marcador del patron en el price list, no un codigo pedible. Se
     sustituye por el sufijo de meses del termino elegido. Un SKU que no termina en `DD`
     se devuelve intacto: no todos los SKU llevan el marcador y reescribir a ciegas los
     ultimos dos caracteres corromperia los que no. */
  function skuTermino(sku, anios, terminos) {
    if (!sku) return { sku: null, exacto: false, motivo: 'el price list no trae SKU para esta línea' };
    if (!/-DD$/.test(sku)) return { sku, exacto: true, motivo: null };
    const t = (terminos || {})[anios];
    if (!t) {
      return { sku, exacto: false,
        motivo: `el catálogo no tiene equivalencia de SKU para un término de ${anios} año(s): `
          + 'el marcador DD se queda puesto y la línea no es pedible' };
    }
    return { sku: sku.replace(/-DD$/, `-${t.sufijo}`), exacto: true, motivo: null, meses: t.meses };
  }

  // Packs de FortiClient: los endpoints se redondean a 25 y se reparten del pack mayor al
  // menor (550 = 1 x 500 + 2 x 25, el ejemplo del propio Ordering Guide). Subir de pack por
  // precio no se decide aqui: el precio no esta en el catalogo.
  function packsEms(endpoints, tamanos) {
    const tams = (tamanos || []).slice().sort((a, b) => b - a);
    const menor = tams[tams.length - 1] || 25;
    let resto = Math.ceil(Math.max(0, endpoints) / menor) * menor;
    const out = [];
    for (const t of tams) {
      const n = Math.floor(resto / t);
      if (n > 0) { out.push({ tam: t, n }); resto -= n * t; }
    }
    return out;
  }

  /* ── 7 · LINEAS COMERCIALES ───────────────────────────────────────────────────────────
     AT-04, AT-05, AT-06, AT-08, AT-17. Devuelve las filas del BOM en la forma neutra que
     comparten los siete dimensionadores ({cat, desc, sku, qty, unit, nota}) mas la lista de
     avisos y de bloqueos que la puerta de exportacion consume.

     LAS TRES CORRECCIONES QUE JUSTIFICAN QUE ESTO SEA UNA FUNCION Y NO MARKUP:
       · el soporte incluido en el bundle no se vuelve a cotizar (era doble cobro real);
       · FortiConverter no se duplica cuando Enterprise ya lo trae;
       · el termino produce un SKU pedible en vez de `-DD`. */
  // AVISOS QUE INFORMAN Y AVISOS QUE ADVIERTEN NO SON LO MISMO, y confundirlos dejaba la puerta
  // siempre en «valido con advertencias»: «FortiCare Premium ya va dentro del bundle» es una
  // explicacion, no un supuesto que alguien tenga que confirmar. Los de este conjunto no
  // cambian el estado de la cotizacion; el resto (exclusiones, coberturas tomadas de un
  // informe) si la dejan en WARNING, que es exportable pero con la advertencia estampada.
  const AVISOS_INFO = new Set(['soporte-incluido', 'converter-incluido', 'elite-upgrade', 'ha-licencia-por-nodo', 'bdl',
    'sandbox-incluido']);

  function lineasComerciales(e) {
    const m = e.modelo;
    const bundles = e.bundles || {};
    const care = e.care || {};
    const qty = Math.max(1, parseInt(e.qty, 10) || 1);
    const anios = parseInt(e.anios, 10) || 3;
    const terminos = e.terminos;
    const bundleCod = e.bundle;
    const careCod = e.care_elegido;
    const lic = m.lic || null;
    const filas = [];
    const avisos = [];
    const bloqueos = [];
    const termino = `término ${anios} año${anios > 1 ? 's' : ''}`;
    // Cada bloqueo declara su NIVEL: 'borrador' = falta un SKU o un precio pero el diseno es
    // coherente (la propuesta sale como borrador tecnico y no va al cotizador); 'bloqueo' =
    // la cotizacion no se puede pedir tal como esta (ninguna salida comercial).
    const bloquear = (b) => bloqueos.push(Object.assign({ nivel: 'borrador' }, b));
    const avisar = (a) => avisos.push(Object.assign({ nivel: AVISOS_INFO.has(a.codigo) ? 'info' : 'warning' }, a));

    // Los precios salen SOLO de la 2026Q3 Mid Price list_AMER_FINAL_EFF 090726.xlsx
    // (instruccion del dueño, 2026-09-24). Un precio que esa lista no trae ya no se conserva de
    // otra edicion: el catalogo lo deja en null y lo marca (`tier.fueraDeLista`, ver
    // legacyData/fortinet.js). Se anota aqui cada vez que una linea lo pide, con el SKU exacto
    // del termino, y la cotizacion sale como borrador diciendo cuales son.
    const fueraDeLista = [];
    const precio = (tier) => {
      if (!tier) return null;
      const k = anios === 1 ? 'y1' : anios === 5 ? 'y5' : 'y3';
      const v = tier[k];
      if (v == null && tier.fueraDeLista && tier.fueraDeLista[k]) {
        fueraDeLista.push(skuTermino(tier.sku, anios, terminos).sku || tier.sku);
      }
      return v == null ? null : v;
    };

    // RENOVACION Y CO-TERM: la caja ya esta instalada. Cotizarla otra vez es el error que el
    // informe del 23-sep describe como «usar un SKU de renovacion para una compra inicial»
    // leido al reves: aqui se compran SOLO los servicios del equipo que ya existe.
    const sinEquipo = !!e.sinEquipo;
    const excluyeBundle = bundleCod === SIN_LINEA;
    const bundle = excluyeBundle ? null : bundles[bundleCod];
    const licTier = (lic && !excluyeBundle) ? lic[bundleCod] : null;

    /* CONSTRUCCION BDL (compra nueva). La price list publica el equipo y su primer bundle en
       UN SKU combinado (FG-90G-BDL-809-36 = equipo + Enterprise + FortiCare Premium, 3 anos),
       y es la construccion que Fortinet preve para la primera compra: una linea en vez de dos.
       NO ES MAS BARATA, y conviene no venderla asi: en la lista de septiembre el combinado
       cuesta EXACTAMENTE equipo + bundle en los 162 casos (54 modelos x 3 terminos). Lo que
       aporta es que se pide con un solo codigo y no se puede olvidar el bundle. Solo existe
       para Enterprise y UTP -ATP no tiene combinado- y solo en compra nueva. */
    const bdlTier = (e.construccion === 'bdl' && !sinEquipo && lic && bundle) ? lic[`${bundleCod}Bdl`] : null;
    const usaBdl = !!(bdlTier && bdlTier.sku && m.hwSku);

    // ── Equipo ────────────────────────────────────────────────────────────────────────
    if (usaBdl) {
      const s = skuTermino(bdlTier.sku, anios, terminos);
      if (!s.exacto) bloquear({ codigo: 'sku-dd', mensaje: `SKU combinado del equipo: ${s.motivo}.` });
      filas.push({ cat: 'Equipo', desc: m.id, sku: s.sku, qty, unit: precio(bdlTier), bdl: true,
        nota: `SKU combinado de compra nueva: equipo + ${bundle.n} + FortiCare Premium · ${termino}` });
      avisar({ codigo: 'bdl',
        mensaje: `Compra nueva: el equipo y ${bundle.n} van en el SKU combinado ${s.sku} (incluye FortiCare Premium), `
          + 'que es la construcción que la price list publica para la primera compra. Una línea en vez de dos.' });
    } else if (!sinEquipo) {
      filas.push({ cat: 'Equipo', desc: m.id, sku: m.hwSku || null, qty,
        unit: m.elpN != null ? m.elpN : null,
        nota: `${m.seg} · ${m.ifaces}${m.eol ? ' · DESCONTINUADO (EOL)' : ''}` });
      if (!m.hwSku) {
        bloquear({ codigo: 'sin-sku-hardware',
          mensaje: `${m.id} no tiene SKU de hardware vigente en el price list (equipo descontinuado): `
            + 'sirve como referencia de un parque instalado, no como línea pedible.' });
      }
    }

    // ── Bundle FortiGuard ─────────────────────────────────────────────────────────────
    if (excluyeBundle) {
      avisar({ codigo: 'bundle-excluido',
        mensaje: 'Bundle FortiGuard excluido de la cotización a petición: no se cotiza ninguna '
          + 'suscripción de seguridad. La cotización vale para un parque que ya la tiene vigente.' });
    } else if (usaBdl) {
      // Ya va dentro del SKU combinado: una segunda linea lo cobraria dos veces.
    } else if (!licTier) {
      bloquear({ codigo: 'sin-sku-bundle',
        mensaje: `${bundle ? bundle.n : bundleCod} no tiene SKU vigente para ${m.id} en el price list.` });
      filas.push({ cat: 'Licencias FortiGuard', desc: bundle ? bundle.n : bundleCod, sku: null, qty, unit: null,
        nota: `${termino} · sin SKU vigente para este modelo` });
    } else {
      const s = skuTermino(licTier.sku, anios, terminos);
      if (!s.exacto) bloquear({ codigo: 'sku-dd', mensaje: `Bundle FortiGuard: ${s.motivo}.` });
      filas.push({ cat: 'Licencias FortiGuard', desc: bundle.n, sku: s.sku, qty, unit: precio(licTier),
        nota: `${termino} · ${bundle.svcs}` });
    }

    // ── Soporte FortiCare ─────────────────────────────────────────────────────────────
    // AT-04. Los tres bundles incluyen FortiCare Premium. Antes se anadia SIEMPRE una linea
    // de soporte encima, asi que una cotizacion con UTP + Premium cobraba Premium dos veces.
    const incluyeSoporte = !!(bundle && (bundle.incluye || []).includes('forticare-premium'));
    const careTier = lic && lic.care ? lic.care[e.careKey] : null;
    const nivelCare = care[careCod] || null;
    if (careCod === SIN_LINEA) {
      // Excluir el soporte SIN bundle que lo traiga deja un equipo sin cobertura ninguna, y
      // eso se dice distinto de excluirlo teniendo Premium incluido en el bundle.
      avisar({ codigo: 'soporte-excluido',
        mensaje: incluyeSoporte
          ? `Soporte FortiCare excluido como línea propia: ${bundle.n} ya trae FortiCare Premium, `
            + 'así que la cotización no pierde cobertura.'
          : 'Soporte FortiCare excluido de la cotización a petición: el equipo se cotiza SIN '
            + 'contrato de soporte ni derecho a RMA ni a actualizaciones de FortiOS.' });
    } else if (!incluyeSoporte) {
      // Sin bundle que lo traiga, el soporte es una linea propia y obligatoria.
      const s = careTier ? skuTermino(careTier.sku, anios, terminos) : { sku: null, exacto: false, motivo: 'sin SKU para este modelo' };
      if (!s.exacto) bloquear({ codigo: 'sku-soporte', mensaje: `Soporte FortiCare: ${s.motivo}.` });
      filas.push({ cat: 'Soporte', desc: nivelCare ? nivelCare.n : careCod, sku: s.sku, qty, unit: precio(careTier),
        nota: `${termino} · ${nivelCare ? nivelCare.sla : ''}` });
    } else if (careCod === 'fcpre') {
      avisar({ codigo: 'soporte-incluido',
        mensaje: `FortiCare Premium ya va dentro de ${bundle.n}: no se cotiza una segunda línea de soporte. `
          + 'Antes se añadía siempre, y esa cotización cobraba el mismo soporte dos veces.' });
    } else if (careCod === 'fc247') {
      avisar({ codigo: 'soporte-inferior',
        mensaje: `${nivelCare ? nivelCare.n : careCod} está POR DEBAJO del FortiCare Premium que `
          + `${bundle.n} ya incluye: no se cotiza, porque bajar de nivel no es una opción de compra. `
          + 'Para un soporte inferior habría que cotizar servicios sueltos sin bundle.' });
    } else {
      /* ELITE ES UNA MEJORA DEL PREMIUM INCLUIDO, Y LA PRICE LIST TRAE ESA MEJORA COMO SKU
         PROPIO: «Upgrade FortiCare Premium to Elite (Require FortiCare Premium)», familia
         -204. Hasta el 2026-09-23 se cotizaba el contrato Elite completo (-284) encima del
         Premium y se advertia que «el price list publica el SKU de Elite con su precio de
         servicio completo»; el documento publicaba la mejora, solo que nadie la habia leido.
         En un 90G a tres anos son 409,80 USD de mejora frente a 1.639,20 de contrato. */
      const upg = lic && lic.eliteUpg;
      if (upg) {
        const s = skuTermino(upg.sku, anios, terminos);
        if (!s.exacto) bloquear({ codigo: 'sku-soporte', mensaje: `Mejora a FortiCare Elite: ${s.motivo}.` });
        filas.push({ cat: 'Soporte', desc: `${nivelCare ? nivelCare.n : careCod} — upgrade sobre el Premium incluido en ${bundle.n}`,
          sku: s.sku, qty, unit: precio(upg),
          nota: `${termino} · SKU de mejora de la price list («Upgrade FortiCare Premium to Elite»)` });
        avisar({ codigo: 'elite-upgrade',
          mensaje: 'FortiCare Elite se cotiza como MEJORA del Premium que el bundle ya trae, con el SKU propio '
            + 'de la price list (familia -204), no como un segundo contrato de soporte completo.' });
      } else {
        const s = careTier ? skuTermino(careTier.sku, anios, terminos) : { sku: null, exacto: false, motivo: 'sin SKU para este modelo' };
        if (!s.exacto) bloquear({ codigo: 'sku-soporte', mensaje: `Soporte FortiCare: ${s.motivo}.` });
        filas.push({ cat: 'Soporte', desc: `${nivelCare ? nivelCare.n : careCod} — upgrade sobre el Premium incluido en ${bundle.n}`,
          sku: s.sku, qty, unit: precio(careTier),
          nota: `${termino} · ${nivelCare ? nivelCare.sla : ''}` });
        avisos.push({ codigo: 'elite-upgrade', nivel: 'warning',
          mensaje: 'FortiCare Elite se cotiza como mejora del Premium que el bundle ya trae, pero la price list no '
            + 'trae el SKU de mejora de este modelo: la línea lleva el contrato Elite completo. Confirmar con el '
            + 'distribuidor si se factura como delta o como reemplazo.' });
      }
    }

    // ── FortiConverter ────────────────────────────────────────────────────────────────
    // AT-05. Enterprise lo incluye. Antes la linea se anadia siempre que el modelo tuviera
    // SKU de converter, asi que con Enterprise elegido se cobraba dos veces.
    const bundleTraeConverter = !!(bundle && (bundle.incluye || []).includes('forticonverter'));
    if (bundleTraeConverter) {
      if (e.converter) {
        avisar({ codigo: 'converter-incluido',
          mensaje: `FortiConverter ya va dentro de ${bundle.n}: no se añade una segunda línea.` });
      }
    } else if (e.converter) {
      // El SKU es el EXACTO de la lista, el de 12 meses, sea cual sea el termino: la lista
      // lo publica una sola vez por modelo («1 Year FCT SVC»). Aplicarle el sufijo del termino
      // producia a 3 y 5 anos un SKU que la lista no tiene, con el precio del de 12 meses.
      if (lic && lic.converter && lic.converter.sku) {
        filas.push({ cat: 'Servicios opcionales', desc: 'FortiConverter — migración de configuración',
          sku: lic.converter.sku, qty: 1, unit: lic.converter.fee,
          nota: 'Servicio único, pedido a la carta. Migra desde Cisco ASA, Check Point o Palo Alto. '
            + 'La price list lo publica solo como «1 Year FCT SVC»: no cambia con el término de la cotización.' });
      } else {
        bloquear({ codigo: 'sin-sku-converter',
          mensaje: `La 2026Q3 Mid Price list no trae, en lo extraído, el FortiConverter de ${m.id}.` });
      }
    }

    // ── Servicios avanzados de SD-WAN ─────────────────────────────────────────────────
    // AT-07 y AT-08. La funcion base no se licencia; estos servicios si, y SOLO cuando el
    // diseno los usa. Tener dos WAN no deriva ninguno.
    // F2 (2026-09-24): los tres servicios NO son tres lineas. El Ordering Guide de Secure
    // SD-WAN los vende en UN SKU por FortiGate, el «SD-WAN Service (Add-on)» (1387/1389), que
    // es la forma para un equipo con bundle de seguridad —el caso de este BOM, que siempre lo
    // lleva o lo excluye porque el parque ya lo tiene—. El SKU y el PRECIO salen de la price
    // list firmada, con la familia contrastada contra el documento. Ver SDWAN_SERVICIO.
    const svs = e.serviciosSdwan || [];
    let sdwanSku = null;
    if (svs.length) {
      const svc = lic && lic.sdwanSvc;
      const nombres = svs.map((sv) => sv.n).join(' · ');
      if (svc && svc.addon) {
        const s = skuTermino(svc.addon.sku, anios, terminos);
        const unit = precio(svc.addon);
        sdwanSku = svc.addon.sku;
        if (!s.exacto) bloquear({ codigo: 'sku-dd', mensaje: `SD-WAN Service: ${s.motivo}.` });
        filas.push({ cat: 'Servicios SD-WAN', desc: 'SD-WAN Service (add-on) — ' + nombres, sku: s.sku, qty, unit,
          nota: `${termino} · un solo SKU cubre los tres servicios${svc.nota ? ` · ${svc.nota}` : ''} (${svc.fuente})` });
        if (unit == null) {
          bloquear({ codigo: 'sin-precio-sdwan',
            mensaje: `SD-WAN Service ${s.sku}: la price list trae este SKU pero no su precio para un término de `
              + `${anios} año(s). Pedirlo al distribuidor antes de cotizar en firme.` });
        }
      } else {
        filas.push({ cat: 'Servicios SD-WAN', desc: 'SD-WAN Service (add-on) — ' + nombres, sku: null, qty, unit: null,
          nota: svs.map((sv) => sv.d).join(' ') });
        bloquear({ codigo: 'sin-sku-sdwan',
          mensaje: `SD-WAN Service para ${m.id}: `
            + (svc && svc.motivo ? `${svc.motivo}.` : 'el catálogo no trae su SKU.')
            + ' La línea no es pedible hasta confirmarlo.' });
      }
    }

    /* ── FORTISASE: LICENCIA POR USUARIO, CON EL SKU DE SU ORDERING GUIDE ─────────────────
       El conector SD-WAN de arriba es por FortiGate; los usuarios de FortiSASE son otra linea,
       con su cantidad (F10 del 23-sep). Desde el 2026-09-24 el SKU sale de la tabla del
       Ordering Guide de FortiSASE: edicion (Standard, Advanced, Comprehensive) por banda de
       usuarios. Sin edicion no hay SKU; por debajo de la banda minima (50), tampoco, y se dice
       en vez de subir la cantidad por su cuenta. El precio no esta en este catalogo. */
    const sase = Math.max(0, parseInt(e.saseUsuarios, 10) || 0);
    if (sase > 0) {
      const tabla = e.sase || null;
      const ed = e.saseEdicion || '';
      const edN = { standard: 'Standard', advanced: 'Advanced', comprehensive: 'Comprehensive' }[ed] || null;
      const banda = tabla ? (tabla.bandas || []).find((x) => sase >= x.desde && (x.hasta == null || sase <= x.hasta)) : null;
      if (!edN) {
        filas.push({ cat: 'Servicios SD-WAN', desc: 'FortiSASE — licencias de usuario', sku: null, qty: sase, unit: null,
          nota: `${termino} · ${sase} usuario(s) declarados · falta elegir la edición` });
        bloquear({ codigo: 'sin-sku-sase',
          mensaje: `FortiSASE para ${sase} usuario(s): el SKU depende de la edición (Standard, Advanced o Comprehensive) `
            + 'y no está declarada.' });
      } else if (!(tabla && tabla.bandas)) {
        filas.push({ cat: 'Servicios SD-WAN', desc: `FortiSASE ${edN} — licencias de usuario`, sku: null, qty: sase, unit: null,
          nota: `${termino} · ${sase} usuario(s) declarados · sin tabla de SKU en el catálogo` });
        bloquear({ codigo: 'sin-sku-sase',
          mensaje: `FortiSASE para ${sase} usuario(s): el catálogo servido no trae la tabla de SKU del Ordering Guide.` });
      } else if (!banda) {
        filas.push({ cat: 'Servicios SD-WAN', desc: `FortiSASE ${edN} — licencias de usuario`, sku: null, qty: sase, unit: null,
          nota: `${termino} · ${sase} usuario(s) declarados` });
        bloquear({ codigo: 'sase-bajo-minimo',
          mensaje: `FortiSASE para ${sase} usuario(s): la banda más baja que publica el Ordering Guide empieza en `
            + `${tabla ? tabla.minimo : 50} usuarios, así que por debajo no hay SKU. Confirmar con el distribuidor si se cotiza `
            + 'el mínimo de la banda.' });
      } else {
        const s = skuTermino(banda[ed], anios, terminos);
        if (!s.exacto) bloquear({ codigo: 'sku-dd', mensaje: `FortiSASE: ${s.motivo}.` });
        filas.push({ cat: 'Servicios SD-WAN', desc: `FortiSASE ${edN} — licencias de usuario`, sku: s.sku, qty: sase, unit: null,
          nota: `${termino} · ${sase} usuario(s), banda ${banda.desde}${banda.hasta == null ? '+' : `-${banda.hasta}`} (${tabla.fuente})` });
        bloquear({ codigo: 'sin-precio-sase',
          mensaje: `FortiSASE ${s.sku}: el SKU es el del Ordering Guide, pero su precio no está en este catálogo (de la `
            + 'price list solo se extraen las filas que nombran un FortiGate). Pedirlo al distribuidor antes de cotizar en firme.' });
        if (ed === 'comprehensive' && tabla.comprehensivePopMinimo && sase < tabla.comprehensivePopMinimo) {
          avisar({ codigo: 'sase-pop-limitado',
            mensaje: `FortiSASE Comprehensive con ${sase} usuario(s): el Ordering Guide advierte que por debajo de `
              + `${tabla.comprehensivePopMinimo} usuarios la disponibilidad de PoP es limitada.` });
        }
      }
      /* El SD-WAN Service de gama 1389 (del 60G en adelante) YA TRAE plazas de FortiSASE
         Standard, por tramo de modelo. No se descuentan solas: los documentos dan tramos
         («60G+», «100F+»...) y no una tabla por modelo, y ADEMAS NO COINCIDEN en el ultimo
         tramo (FortiSASE, sep-2026: 100 desde el 1800F; Secure SD-WAN, ago-2026: desde el
         2500G). Se AVISA, para que las plazas incluidas no se paguen dos veces. */
      if (sdwanSku && /-1389-/.test(sdwanSku)) {
        avisar({ codigo: 'sase-incluido-sdwan',
          mensaje: `El SD-WAN Service ${sdwanSku} ya incluye plazas de FortiSASE Standard según la gama del equipo: `
            + '5 desde el 60G, 10 desde el 100F, 50 desde el 700G y 100 desde el 1800F según el Ordering Guide de FortiSASE '
            + '(sep-2026); el de Secure SD-WAN (ago-2026) pone ese último tramo en el 2500G. '
            + `La línea de ${sase} usuario(s) no las descuenta: restarlas antes de cotizar para no pagarlas dos veces `
            + '(son plazas Standard: no sustituyen a las de otra edición).' });
      }
    }

    /* ── FORTICLIENT EMS: LICENCIA POR ENDPOINT GESTIONADO, EN PACKS ──────────────────────
       La cantidad es la de ENDPOINTS GESTIONADOS que declara quien disena (F12 del 23-sep):
       usuarios y endpoints no son lo mismo -un usuario tiene portatil y movil, un kiosco no
       tiene usuario-, asi que la pagina sugiere la suma de usuarios pero no la impone.
       Desde el 2026-09-24 el SKU sale del Ordering Guide de FortiClient: packs de 25, 500,
       2.000 y 10.000 endpoints, familia VPN/ZTNA (428), en FortiClient Cloud (EMS05) o en EMS
       on-premise (EMS04). Sin despliegue declarado no hay SKU, y se dice. */
    const ems = Math.max(0, parseInt(e.endpointsEms, 10) || 0);
    if (ems > 0) {
      const tabla = e.ems || null;
      const porPack = tabla && tabla.sku ? tabla.sku[e.emsDespliegue] : null;
      const despN = { cloud: 'FortiClient Cloud', onprem: 'EMS on-premise' }[e.emsDespliegue] || null;
      if (!porPack) {
        // Dos causas distintas y se dicen distinto: el dato que falta en el escenario, o la tabla
        // que falta en el catalogo servido (que seria un fallo de este repositorio, no del usuario).
        const sinTabla = !(tabla && tabla.sku);
        filas.push({ cat: 'Licencias endpoint', desc: 'FortiClient EMS — VPN/ZTNA', sku: null, qty: ems, unit: null,
          nota: `${termino} · ${ems} endpoint(s) gestionados · ${sinTabla ? 'sin tabla de SKU en el catálogo' : 'falta elegir el despliegue'}` });
        bloquear({ codigo: 'sin-sku-ems',
          mensaje: sinTabla
            ? `FortiClient EMS para ${ems} endpoint(s): el catálogo servido no trae la tabla de SKU del Ordering Guide.`
            : `FortiClient EMS para ${ems} endpoint(s): el SKU de cada pack depende del despliegue `
              + '(FortiClient Cloud o EMS on-premise), y no está declarado.' });
      } else {
        const packs = packsEms(ems, tabla.packs);
        const reparto = packs.map((p) => `${p.n} × pack de ${p.tam}`).join(' + ');
        for (const p of packs) {
          const s = skuTermino(porPack[p.tam], anios, terminos);
          if (!s.exacto) bloquear({ codigo: 'sku-dd', mensaje: `FortiClient EMS: ${s.motivo}.` });
          filas.push({ cat: 'Licencias endpoint', desc: `${despN} — VPN/ZTNA, pack de ${p.tam} endpoints`, sku: s.sku,
            qty: p.n, unit: null,
            nota: `${termino} · ${ems} endpoint(s) gestionados: ${reparto} (${tabla.fuente})` });
        }
        bloquear({ codigo: 'sin-precio-ems',
          mensaje: `FortiClient EMS (${reparto}): los SKU son los del Ordering Guide, pero su precio no está en este `
            + 'catálogo (de la price list solo se extraen las filas que nombran un FortiGate). Pedirlo al distribuidor '
            + 'antes de cotizar en firme; el precio decide también si conviene subir al pack siguiente.' });
      }
    }

    /* ── SANDBOX: TRES COSAS DISTINTAS CON EL MISMO NOMBRE (F11 del 23-sep) ──────────────
         incluido  la deteccion en la nube que traen los bundles: «FortiGate Cloud Sandbox»
                   va dentro de AMP en Enterprise, UTP y ATP. Hasta el 2026-09-24 se tomaba del
                   informe de auditoria (ref. [2]) y se advertia; ese dia se leyo la matriz del
                   Ordering Guide de FortiGuard y lo confirma. No se cotiza linea.
         ai        el servicio del FortiGate que la price list publica por modelo («FG AI based
                   Sandbox SVC», familia -577): linea con SKU exacto.
         dedicado  FortiSandbox como producto aparte (appliance, VM o FortiSandbox Cloud): su
                   SKU no esta en este catalogo; entra la linea y la propuesta queda en borrador. */
    if (e.sandbox === 'incluido') {
      if (!bundle) {
        bloqueos.push({ codigo: 'sandbox-sin-bundle', nivel: 'bloqueo',
          mensaje: 'Sandbox «incluido en el bundle» pedido con el bundle excluido: sin bundle no hay cobertura '
            + 'incluida. Elegir un bundle o cotizar el servicio de sandbox como línea propia.' });
      } else {
        avisar({ codigo: 'sandbox-incluido',
          mensaje: `Detección sandbox en la nube cubierta por ${bundle.n}: «FortiGate Cloud Sandbox» va dentro de `
            + 'Advanced Malware Protection en Enterprise, UTP y ATP (Ordering Guide de FortiGuard, mayo-2026, p. 3). '
            + 'No se cotiza línea aparte.' });
      }
    } else if (e.sandbox === 'ai') {
      const t = lic && lic.sandboxAi;
      const s = t ? skuTermino(t.sku, anios, terminos) : { sku: null, exacto: false, motivo: `el price list no trae el servicio de sandbox para ${m.id}` };
      if (!s.exacto) bloquear({ codigo: 'sin-sku-sandbox', mensaje: `Servicio de sandbox: ${s.motivo}.` });
      filas.push({ cat: 'Servicios de seguridad', desc: 'FortiGuard AI-based Sandbox — servicio del FortiGate',
        sku: s.sku, qty, unit: t ? precio(t) : null,
        nota: `${termino} · price list: «FG AI based Sandbox SVC»` });
    } else if (e.sandbox === 'dedicado') {
      const mod = { appliance: 'appliance', vm: 'maquina virtual', cloud: 'FortiSandbox Cloud' }[e.sandboxModalidad] || 'modalidad sin declarar';
      filas.push({ cat: 'Servicios de seguridad', desc: `FortiSandbox dedicado — ${mod}`, sku: null, qty: 1, unit: null,
        nota: 'Producto aparte del FortiGate: se dimensiona por volumen de archivos, no por throughput del firewall.' });
      bloquear({ codigo: 'sin-sku-sandbox-dedicado',
        mensaje: `FortiSandbox dedicado (${mod}): su SKU sale de otro dimensionamiento. El Ordering Guide de FortiSandbox `
          + '(sep-2026) lo fija por archivos/hora contra la cifra del datasheet, por las VM de detonación y por las '
          + 'licencias de Windows/Office de esas VM. La línea entra para que la cotización no salga corta.' });
    }

    /* ── REGISTRO (logging) ────────────────────────────────────────────────────────────
       La nube tiene SKU por modelo en la price list («Sub to CLD based Central Logging»,
       familia -585). FortiAnalyzer es otro producto y se dimensiona por ingesta: su SKU no
       esta aqui. El disco local no se cotiza: es una RESTRICCION del equipo, y la aplica el
       motor al elegir candidatos. */
    if (e.registro === 'nube') {
      const t = lic && lic.logCloud;
      const s = t ? skuTermino(t.sku, anios, terminos) : { sku: null, exacto: false, motivo: `el price list no trae el registro en la nube para ${m.id}` };
      if (!s.exacto) bloquear({ codigo: 'sin-sku-registro', mensaje: `Registro en la nube: ${s.motivo}.` });
      filas.push({ cat: 'Registro', desc: 'Registro central en la nube (logging)', sku: s.sku, qty, unit: t ? precio(t) : null,
        nota: `${termino} · price list: «Sub to CLD based Central Logging»` });
    } else if (e.registro === 'faz') {
      const gb = Math.max(0, Number(e.registroGbDia) || 0);
      filas.push({ cat: 'Registro', desc: 'FortiAnalyzer — appliance, VM o cloud', sku: null, qty: 1, unit: null,
        nota: gb ? `Dimensionar por ingesta: ${gb} GB/día declarados` : 'Dimensionar por GB/día de ingesta' });
      bloquear({ codigo: 'sin-sku-faz',
        mensaje: 'FortiAnalyzer es un producto aparte, con su propio dimensionamiento. El Ordering Guide de FortiAnalyzer '
          + '(jul-2026) lo vende como appliance (FAZ-300G a FAZ-3750G), VM por suscripción en tramos de 5, 50 y 500 '
          + 'GB/día, o VM perpetua de 1 a 2.000 GB/día: la forma la decide quien diseña el registro. La línea entra '
          + 'para que la cotización no salga corta.' });
    }

    /* ── VDOM POR ENCIMA DE LOS INCLUIDOS (F15/T22) ──────────────────────────────────────
       El documento publica «por defecto / maximo»; entre uno y otro se licencian. Por encima
       del maximo ya lo aparta el motor. El SKU de la licencia de VDOM no esta en la price list
       extraida: entra la linea con la cantidad y la propuesta queda en borrador. */
    const vdomExtra = Math.max(0, parseInt(e.vdomsExtra, 10) || 0);
    if (vdomExtra > 0) {
      filas.push({ cat: 'Licencias', desc: `Licencia de VDOM adicionales (${vdomExtra} sobre los incluidos)`, sku: null,
        qty: vdomExtra, unit: null, nota: 'Por encima de los dominios virtuales que el modelo trae incluidos.' });
      bloquear({ codigo: 'sin-sku-vdom',
        mensaje: `El diseno usa ${vdomExtra} VDOM por encima de los incluidos en el modelo, y la licencia se compra aparte: `
          + 'la price list extraida no trae su SKU. Confirmarlo antes de cotizar en firme.' });
    }

    /* ── SEGUNDA FUENTE (alimentacion redundante con fuente opcional) ───────────────────
       Un equipo con `redund: 'opcional'` sale de fabrica con UNA fuente y admite la segunda:
       si el diseno exige redundancia, esa segunda fuente es una linea, no un supuesto. */
    if (e.segundaFuente) {
      filas.push({ cat: 'Alimentación', desc: 'Segunda fuente / adaptador de alimentación (redundancia)', sku: null,
        qty, unit: null, nota: 'El equipo sale de fabrica con una sola fuente y admite la segunda.' });
      bloquear({ codigo: 'sin-sku-fuente',
        mensaje: `${m.id} admite una segunda fuente que no viene incluida, y su SKU no está en este catálogo.` });
    }

    // ── HA ────────────────────────────────────────────────────────────────────────────
    // AT-17. La regla general es una licencia por nodo. La excepcion de FortiGuard unico en
    // activo-pasivo depende del modelo y de la version de FortiOS, y este catalogo no trae
    // la elegibilidad: se DECLARA en vez de ofrecerse sin evidencia.
    if (qty > 1) {
      avisar({ codigo: 'ha-licencia-por-nodo',
        mensaje: `Clúster de ${qty} unidades: cada nodo lleva su propia suscripción FortiGuard y su propio `
          + 'FortiCare. La excepción de FortiGuard único en activo-pasivo existe, pero depende del modelo y '
          + 'de la versión de FortiOS y este catálogo no trae esa elegibilidad: confirmarla con Fortinet '
          + 'antes de quitar una licencia.' });
    }

    if (fueraDeLista.length) {
      bloquear({ codigo: 'precio-fuera-de-lista',
        mensaje: `${fueraDeLista.length} línea(s) sin precio: la 2026Q3 Mid Price list (AMER, 07-sep-2026), que es la `
          + `única fuente de precios de este catálogo, no trae en lo extraído el precio de ${fueraDeLista.join(', ')}. `
          + 'El de la edición de agosto ya no se usa. Pedirlo al distribuidor antes de cotizar en firme.' });
    }
    return { filas, avisos, bloqueos, soporteIncluido: incluyeSoporte || usaBdl, bdl: usaBdl };
  }

  /* ── 8 y 9 · LA PUERTA DE COTIZACION Y LA HUELLA YA NO VIVEN AQUI ──────────────────────
     Desde el 2026-09-23 las decide `fortinet-motor.js`, que es el mismo codigo en el navegador
     y en el servidor: una puerta de CUATRO estados (READY, WARNING, DRAFT, BLOCKED) en vez de
     los seis de la revision anterior, y una huella SHA-256 sobre el escenario normalizado en
     vez del FNV-1a. Se retiraron de este archivo para que no queden dos implementaciones de la
     misma decision: es como `llevarABom` acabo en seis copias que no hacian lo mismo. */

  /* ── 10 · SALUD DE LA FUENTE COMERCIAL ────────────────────────────────────────────────
     AT-16. Una fuente de precios vencida bloquea la exportacion de grado comercial; el
     informe es explicito en que «no se resuelve con una advertencia pasiva».
     `MESES_PRECIO` es la parte discutible y va declarada, igual que SEMANAS_TOLERADAS en el
     vigia de fuentes: sin umbral, cualquier lista de precios valdria para siempre; con uno
     escrito a fuego dentro de una funcion, nadie sabria que existe. */
  const MESES_PRECIO = 6;
  function saludPrecios(fuente, hoy) {
    if (!fuente || !fuente.fecha) {
      return { estado: 'sin-fecha', bloquea: true,
        mensaje: 'La lista de precios no declara fecha: no se puede afirmar que siga vigente. '
          + 'Una fuente sin fecha no es una fuente reciente.' };
    }
    const f = new Date(`${fuente.fecha}${fuente.fecha.length === 7 ? '-01' : ''}T00:00:00Z`);
    const ahora = hoy ? new Date(hoy) : new Date();
    const meses = (ahora.getUTCFullYear() - f.getUTCFullYear()) * 12
      + (ahora.getUTCMonth() - f.getUTCMonth());
    if (meses > MESES_PRECIO) {
      return { estado: 'vencida', bloquea: true, meses,
        mensaje: `La lista de precios es de hace ${meses} meses (límite declarado: ${MESES_PRECIO}). `
          + 'Una cotización sobre precios vencidos se entrega a un cliente como si fueran de hoy.' };
    }
    return { estado: 'vigente', bloquea: false, meses,
      mensaje: `Lista de precios de hace ${meses} mes(es).` };
  }

  return {
    EJES, EJE_POR_K, ORDEN_CAPAS, MESES_PRECIO,
    demandaTrafico, capaEfectiva,
    evaluarModelo, evaluar, pct,
    bundleMinimo, validarBundle,
    skuTermino, packsEms, lineasComerciales, AVISOS_INFO,
    saludPrecios,
  };
}));
