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
      metodo: 'Firewall Throughput (1518 B UDP), sesion descargada al ASIC de red' },
    { k: 'vpn', escalaMbps: true, n: 'IPsec VPN', frase: 'el motor IPsec', campo: 'vpn', dureza: 'dura',
      metodo: 'IPsec VPN Throughput (512 B), criptografia descargada al ASIC' },
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
        : 'maximo entre los caminos (declarado: los picos no son concurrentes)',
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
      motivo = `el catalogo no trae ${apartaPor.n} de este modelo, y es el eje que el `
        + 'escenario pide dimensionar: se aparta en vez de sustituirlo por otra capa. '
        + 'Confirmar con el Product Matrix o validar con PoC.';
    } else if (excede.length) {
      estado = 'excede';
      const p = excede[0];
      motivo = `${p.n} al ${pct(p.u)} de ${p.configuracion ? 'lo que la plataforma admite' : 'la cifra publicada'}`
        + (techo < 1 && !p.configuracion ? ` (techo de utilizacion declarado: ${pct(techo)})` : '');
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
        minimo: min.minimo,
        mensaje: `El bundle FortiGuard se ha excluido de la cotizacion, pero el escenario pide `
          + `${quien}, que necesita ${bundles[min.minimo].n}. La cotizacion cubre el equipo, `
          + 'no el escenario: la suscripcion tiene que estar vigente por otra via.',
        detalle: min.exigentes.map((e) => e.porQue).filter(Boolean),
      };
    }
    if (!min.minimo || min.validos.includes(elegido)) return null;
    const nombres = min.exigentes.map((e) => e.funcion).join(' y ');
    return {
      codigo: 'bundle-insuficiente',
      bloquea: true,
      minimo: min.minimo,
      mensaje: `${bundles[elegido] ? bundles[elegido].n : elegido} no cubre `
        + `${nombres || min.servicios.join(', ')}. El bundle minimo para este escenario es `
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
    if (!sku) return { sku: null, exacto: false, motivo: 'el price list no trae SKU para esta linea' };
    if (!/-DD$/.test(sku)) return { sku, exacto: true, motivo: null };
    const t = (terminos || {})[anios];
    if (!t) {
      return { sku, exacto: false,
        motivo: `el catalogo no tiene equivalencia de SKU para un termino de ${anios} anio(s): `
          + 'el marcador DD se queda puesto y la linea no es pedible' };
    }
    return { sku: sku.replace(/-DD$/, `-${t.sufijo}`), exacto: true, motivo: null, meses: t.meses };
  }

  /* ── 7 · LINEAS COMERCIALES ───────────────────────────────────────────────────────────
     AT-04, AT-05, AT-06, AT-08, AT-17. Devuelve las filas del BOM en la forma neutra que
     comparten los siete dimensionadores ({cat, desc, sku, qty, unit, nota}) mas la lista de
     avisos y de bloqueos que la puerta de exportacion consume.

     LAS TRES CORRECCIONES QUE JUSTIFICAN QUE ESTO SEA UNA FUNCION Y NO MARKUP:
       · el soporte incluido en el bundle no se vuelve a cotizar (era doble cobro real);
       · FortiConverter no se duplica cuando Enterprise ya lo trae;
       · el termino produce un SKU pedible en vez de `-DD`. */
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
    const termino = `termino ${anios} ano${anios > 1 ? 's' : ''}`;

    const precio = (tier) => {
      if (!tier) return null;
      const v = anios === 1 ? tier.y1 : anios === 5 ? tier.y5 : tier.y3;
      return v == null ? null : v;
    };

    // ── Equipo ────────────────────────────────────────────────────────────────────────
    filas.push({ cat: 'Equipo', desc: m.id, sku: m.hwSku || null, qty,
      unit: m.elpN != null ? m.elpN : null,
      nota: `${m.seg} · ${m.ifaces}${m.eol ? ' · DESCONTINUADO (EOL)' : ''}` });
    if (!m.hwSku) {
      bloqueos.push({ codigo: 'sin-sku-hardware',
        mensaje: `${m.id} no tiene SKU de hardware vigente en el price list (equipo descontinuado): `
          + 'sirve como referencia de un parque instalado, no como linea pedible.' });
    }

    // ── Bundle FortiGuard ─────────────────────────────────────────────────────────────
    const excluyeBundle = bundleCod === SIN_LINEA;
    const licTier = (lic && !excluyeBundle) ? lic[bundleCod] : null;
    const bundle = excluyeBundle ? null : bundles[bundleCod];
    if (excluyeBundle) {
      avisos.push({ codigo: 'bundle-excluido',
        mensaje: 'Bundle FortiGuard excluido de la cotizacion a peticion: no se cotiza ninguna '
          + 'suscripcion de seguridad. La cotizacion vale para un parque que ya la tiene vigente.' });
    } else if (!licTier) {
      bloqueos.push({ codigo: 'sin-sku-bundle',
        mensaje: `${bundle ? bundle.n : bundleCod} no tiene SKU vigente para ${m.id} en el price list.` });
      filas.push({ cat: 'Licencias FortiGuard', desc: bundle ? bundle.n : bundleCod, sku: null, qty, unit: null,
        nota: `${termino} · sin SKU vigente para este modelo` });
    } else {
      const s = skuTermino(licTier.sku, anios, terminos);
      if (!s.exacto) bloqueos.push({ codigo: 'sku-dd', mensaje: `Bundle FortiGuard: ${s.motivo}.` });
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
      avisos.push({ codigo: 'soporte-excluido',
        mensaje: incluyeSoporte
          ? `Soporte FortiCare excluido como linea propia: ${bundle.n} ya trae FortiCare Premium, `
            + 'asi que la cotizacion no pierde cobertura.'
          : 'Soporte FortiCare excluido de la cotizacion a peticion: el equipo se cotiza SIN '
            + 'contrato de soporte ni derecho a RMA ni a actualizaciones de FortiOS.' });
    } else if (!incluyeSoporte) {
      // Sin bundle que lo traiga, el soporte es una linea propia y obligatoria.
      const s = careTier ? skuTermino(careTier.sku, anios, terminos) : { sku: null, exacto: false, motivo: 'sin SKU para este modelo' };
      if (!s.exacto) bloqueos.push({ codigo: 'sku-soporte', mensaje: `Soporte FortiCare: ${s.motivo}.` });
      filas.push({ cat: 'Soporte', desc: nivelCare ? nivelCare.n : careCod, sku: s.sku, qty, unit: precio(careTier),
        nota: `${termino} · ${nivelCare ? nivelCare.sla : ''}` });
    } else if (careCod === 'fcpre') {
      avisos.push({ codigo: 'soporte-incluido',
        mensaje: `FortiCare Premium ya va dentro de ${bundle.n}: no se cotiza una segunda linea de soporte. `
          + 'Antes se anadia siempre, y esa cotizacion cobraba el mismo soporte dos veces.' });
    } else if (careCod === 'fc247') {
      avisos.push({ codigo: 'soporte-inferior',
        mensaje: `${nivelCare ? nivelCare.n : careCod} esta POR DEBAJO del FortiCare Premium que `
          + `${bundle.n} ya incluye: no se cotiza, porque bajar de nivel no es una opcion de compra. `
          + 'Para un soporte inferior habria que cotizar servicios sueltos sin bundle.' });
    } else {
      // AT-04 + informe §12: Elite se representa como UPGRADE del Premium incluido, no como
      // un contrato de soporte completo adicional.
      const s = careTier ? skuTermino(careTier.sku, anios, terminos) : { sku: null, exacto: false, motivo: 'sin SKU para este modelo' };
      if (!s.exacto) bloqueos.push({ codigo: 'sku-soporte', mensaje: `Soporte FortiCare: ${s.motivo}.` });
      filas.push({ cat: 'Soporte', desc: `${nivelCare ? nivelCare.n : careCod} — upgrade sobre el Premium incluido en ${bundle.n}`,
        sku: s.sku, qty, unit: precio(careTier),
        nota: `${termino} · ${nivelCare ? nivelCare.sla : ''}` });
      avisos.push({ codigo: 'elite-upgrade',
        mensaje: 'FortiCare Elite se cotiza como mejora del Premium que el bundle ya trae. '
          + 'El price list publica el SKU de Elite con su precio de servicio completo, no un diferencial: '
          + 'confirmar con el distribuidor si se factura como delta o como reemplazo.' });
    }

    // ── FortiConverter ────────────────────────────────────────────────────────────────
    // AT-05. Enterprise lo incluye. Antes la linea se anadia siempre que el modelo tuviera
    // SKU de converter, asi que con Enterprise elegido se cobraba dos veces.
    const bundleTraeConverter = !!(bundle && (bundle.incluye || []).includes('forticonverter'));
    if (bundleTraeConverter) {
      if (e.converter) {
        avisos.push({ codigo: 'converter-incluido',
          mensaje: `FortiConverter ya va dentro de ${bundle.n}: no se anade una segunda linea.` });
      }
    } else if (e.converter) {
      if (lic && lic.converter) {
        const s = skuTermino(lic.converter.sku, anios, terminos);
        if (!s.exacto) bloqueos.push({ codigo: 'sku-converter', mensaje: `FortiConverter: ${s.motivo}.` });
        filas.push({ cat: 'Servicios opcionales', desc: 'FortiConverter — migracion de configuracion',
          sku: s.sku, qty: 1, unit: lic.converter.fee,
          nota: 'Servicio unico, pedido a la carta. Migra desde Cisco ASA, Check Point o Palo Alto.' });
      } else {
        bloqueos.push({ codigo: 'sin-sku-converter',
          mensaje: `El price list no trae SKU de FortiConverter para ${m.id}.` });
      }
    }

    // ── Servicios avanzados de SD-WAN ─────────────────────────────────────────────────
    // AT-07 y AT-08. La funcion base no se licencia; estos servicios si, y SOLO cuando el
    // diseno los usa. Tener dos WAN no deriva ninguno.
    for (const sv of e.serviciosSdwan || []) {
      filas.push({ cat: 'Servicios SD-WAN', desc: sv.n, sku: sv.sku || null, qty, unit: null,
        nota: sv.d });
      if (!sv.sku) {
        bloqueos.push({ codigo: 'sin-sku-sdwan',
          mensaje: `«${sv.n}»: este repositorio no ha leido su SKU del Ordering Guide, asi que la linea `
            + 'no es pedible. Confirmarlo antes de exportar como cotizacion.' });
      }
    }

    /* ── FORTICLIENT EMS: LICENCIA POR ENDPOINT, DERIVADA DEL DIMENSIONAMIENTO ────────
       El unico bloque de licenciamiento cuya CANTIDAD sale de un campo del dimensionamiento
       y no de una eleccion comercial: los endpoints son los usuarios ya declarados (los del
       sitio mas los de acceso remoto). Pedirlos otra vez en el paso 4 habria sido un segundo
       sitio con el mismo dato.
       VA SIN SKU Y BLOQUEA, a proposito. Este catalogo trae el PATRON del codigo
       (`FC1-10-EMS05-428-01-DD`, 25 endpoints) y no un codigo pedible: la linea entra con la
       cantidad correcta para que la cotizacion no salga corta, y cierra la exportacion hasta
       que alguien confirme el SKU del tramo en el Ordering Guide. Inventar el tramo seria el
       fallo del `FortiGate 2000F`. */
    const ems = Math.max(0, parseInt(e.endpointsEms, 10) || 0);
    if (ems > 0) {
      filas.push({ cat: 'Licencias endpoint', desc: 'FortiClient EMS — ZTNA + VPN gestionado',
        sku: null, qty: ems, unit: null,
        nota: `${termino} · ${ems} endpoint(s) declarados en el dimensionamiento` });
      bloqueos.push({ codigo: 'sin-sku-ems',
        mensaje: `FortiClient EMS para ${ems} endpoint(s): este repositorio solo tiene el PATRON del SKU `
          + '(`FC1-10-EMS05-428-01-DD`, tramo de 25), no el codigo del tramo que corresponde. '
          + 'Confirmarlo en el Ordering Guide antes de exportar como cotizacion.' });
    }

    // ── HA ────────────────────────────────────────────────────────────────────────────
    // AT-17. La regla general es una licencia por nodo. La excepcion de FortiGuard unico en
    // activo-pasivo depende del modelo y de la version de FortiOS, y este catalogo no trae
    // la elegibilidad: se DECLARA en vez de ofrecerse sin evidencia.
    if (qty > 1) {
      avisos.push({ codigo: 'ha-licencia-por-nodo',
        mensaje: `Cluster de ${qty} unidades: cada nodo lleva su propia suscripcion FortiGuard y su propio `
          + 'FortiCare. La excepcion de FortiGuard unico en activo-pasivo existe, pero depende del modelo y '
          + 'de la version de FortiOS y este catalogo no trae esa elegibilidad: confirmarla con Fortinet '
          + 'antes de quitar una licencia.' });
    }

    return { filas, avisos, bloqueos, soporteIncluido: incluyeSoporte };
  }

  /* ── 8 · ESTADO DEL ESCENARIO ─────────────────────────────────────────────────────────
     Los seis estados del informe (§14). El orden importa: `bloqueado` gana sobre todo, y
     `borrador` sobre cualquier cosa que pretenda calcular sin los datos minimos.

     ESTO NO ES UN SEMAFORO DECORATIVO: de `puedeExportar` cuelgan Excel, imprimir y enviar
     al cotizador. Lo que el informe llama «export gate» es que una propuesta que nadie
     puede pedir no salga de la herramienta con aspecto de cotizacion. */
  function estadoEscenario(e) {
    const faltan = e.faltan || [];
    const bloqueos = e.bloqueos || [];
    const avisos = e.avisos || [];
    if (faltan.length) {
      return { estado: 'borrador', puedeCalcular: false, puedeExportar: false,
        titulo: 'Borrador',
        motivo: `Faltan datos minimos: ${faltan.join(', ')}.`,
        detalle: 'Sin ellos no se calcula, y el BOM anterior no se conserva: una lista de materiales '
          + 'que sobrevive a un escenario incompleto es una cotizacion de otra pregunta.' };
    }
    if (!e.hayCandidato) {
      return { estado: 'calculable', puedeCalcular: true, puedeExportar: false,
        titulo: 'Sin candidato tecnico',
        motivo: 'Ningun modelo vigente supera todos los ejes del escenario.',
        detalle: null };
    }
    if (e.stale) {
      return { estado: 'bloqueado', puedeCalcular: true, puedeExportar: false,
        titulo: 'Escenario modificado despues del calculo',
        motivo: 'Los datos cambiaron y la lista de materiales corresponde al escenario anterior.',
        detalle: 'Recalcular antes de exportar. Exportar aqui entregaria una cotizacion que no '
          + 'corresponde a lo que la pantalla muestra.' };
    }
    if (bloqueos.length) {
      return { estado: 'bloqueado', puedeCalcular: true, puedeExportar: false,
        titulo: 'Bloqueado para cotizacion',
        motivo: bloqueos[0].mensaje,
        detalle: bloqueos.length > 1 ? `${bloqueos.length} bloqueos en total.` : null,
        bloqueos };
    }
    if (avisos.length) {
      return { estado: 'advertencia', puedeCalcular: true, puedeExportar: true,
        titulo: 'Valido con advertencias',
        motivo: avisos[0].mensaje,
        detalle: `${avisos.length} advertencia(s) registradas con la propuesta.`,
        avisos };
    }
    return { estado: 'valido-comercial', puedeCalcular: true, puedeExportar: true,
      titulo: 'Valido para cotizacion',
      motivo: 'Todas las lineas tienen SKU exacto y el escenario coincide con el calculo.',
      detalle: null };
  }

  /* ── 9 · HUELLA DEL ESCENARIO ─────────────────────────────────────────────────────────
     AT-15. La lista de materiales guarda la huella del escenario con el que se construyo;
     si el escenario cambia despues, las dos dejan de coincidir y la exportacion se cierra.
     FNV-1a sobre un JSON canonico: no necesita crypto (que en el navegador es asincrono) y
     lo unico que se le pide es que dos escenarios distintos no se confundan. NO es un hash
     criptografico y no se usa para nada que lo necesite. */
  function huella(obj) {
    const canon = (v) => {
      if (v === null || typeof v !== 'object') return JSON.stringify(v == null ? null : v);
      if (Array.isArray(v)) return `[${v.map(canon).join(',')}]`;
      return `{${Object.keys(v).sort().map((k) => `${JSON.stringify(k)}:${canon(v[k])}`).join(',')}}`;
    };
    const s = canon(obj);
    let h = 0x811c9dc5;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    return h.toString(16).padStart(8, '0');
  }

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
        mensaje: `La lista de precios es de hace ${meses} meses (limite declarado: ${MESES_PRECIO}). `
          + 'Una cotizacion sobre precios vencidos se entrega a un cliente como si fueran de hoy.' };
    }
    return { estado: 'vigente', bloquea: false, meses,
      mensaje: `Lista de precios de hace ${meses} mes(es).` };
  }

  return {
    EJES, EJE_POR_K, ORDEN_CAPAS, MESES_PRECIO,
    demandaTrafico, capaEfectiva,
    evaluarModelo, evaluar, pct,
    bundleMinimo, validarBundle,
    skuTermino, lineasComerciales,
    estadoEscenario, huella, saludPrecios,
  };
}));
