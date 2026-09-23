'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   CALCULADORA DE THROUGHPUT — qué capa se dimensiona y qué se hace con lo que
   el catálogo no publica. El pintado vive en js/index.js.

   POR QUÉ EXISTE ESTE MÓDULO. La calculadora elegía equipo con una sola línea:

       const cap = profile==='ipsec' && d.ipsec>0 ? d.ipsec : d.tp;

   `d.tp` es la cifra de PORTADA de cada catálogo (firewall en Fortinet,
   forwarding en Huawei, capacidad de conmutación en Nokia). De ahí salían tres
   fallos, y los tres daban una respuesta con pinta de correcta:

   1. El perfil «SD-WAN / NGFW» no miraba la cifra de NGFW ni una sola vez —
      caía a la de firewall. Medido en el navegador con los valores por defecto
      de la pantalla (1 Gbps, bidireccional, 30 % de margen = 2,6 Gbps): proponía
      un FortiGate 30G, que hace 4 Gbps de firewall y 570 Mbps de NGFW. Factor
      4,6x por debajo de lo pedido. El que cumple de verdad es el FortiGate 120G,
      cuatro escalones de gama más arriba. Es el mismo modo de fallo que la
      auditoría de FortiGate documentó (14,3x) y que el SRX380 repite (10x).
   2. En el perfil IPsec, un equipo SIN cifra de IPsec no se apartaba: se
      juzgaba por su forwarding. Para 2,6 Gbps de IPsec proponía un Nokia
      7220 IXR-D1 —un leaf de fabric de datacenter— porque conmuta 88 Gbps, y un
      Aruba EC-S cuyo IPsec en este catálogo es 0.
   3. Comparaba las siete cifras de portada entre sí como si fueran la misma
      medida, sin decirlo, mientras el comparador de la pantalla de al lado
      avisa exactamente de eso.

   LA REGLA. Se dimensiona con la cifra de la capa que pide el perfil. Si el
   catálogo no la trae para ese modelo, el modelo SE APARTA CON SU MOTIVO —
   nunca se sustituye por la de otra capa, que es justo lo que produce
   propuestas cortas por un orden de magnitud. Es la misma regla que
   `dimensionador-juniper-srx.js` aplica a `fw` y la que `ficha.js` aplica al
   tercer estado: «no lo tenemos apuntado» no es «vale cero».
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  // Un valor de capacidad puede llegar como número en Mbps o como texto ya
  // formateado, según el catálogo. `0`, `null` y los guiones son la forma que
  // este catálogo tiene de decir «no hay dato» — nunca «vale cero».
  function mbps(v) {
    if (v === null || v === undefined) return null;
    if (typeof v === 'number') return v > 0 ? v : null;
    // Sin un dígito no hay cifra: «—», «N/A», «Consultar» y el vacío son las
    // formas en que este catálogo dice que no lo publica.
    const s = String(v).trim();
    if (!/[0-9]/.test(s)) return null;
    const n = parseFloat(s.replace(/[^0-9.]/g, ''));
    if (!isFinite(n) || n <= 0) return null;
    if (/Tbps/i.test(s)) return n * 1e6;
    if (/Gbps/i.test(s)) return n * 1000;
    return n;
  }

  function fmt(m) {
    if (m === null || m === undefined) return null;
    if (m >= 1e6) return `${(m / 1e6).toFixed(m % 1e6 ? 1 : 0).replace(/\.0$/, '')} Tbps`;
    if (m >= 1000) return `${(m / 1000).toFixed(m % 1000 ? 1 : 0).replace(/\.0$/, '')} Gbps`;
    return `${Math.round(m)} Mbps`;
  }

  // El catálogo Juniper mete tres medidas distintas en el mismo campo `cap`, y las
  // anota: «24 Gbps FW» es firewall en un SRX, «4.8 Tbps» es capacidad de
  // conmutación en un MX, y la cifra de un SSR es su caudal SD-WAN —el Session
  // Smart Router no hace otra cosa—. Se lee del catálogo en vez de suponerlo por
  // el tamaño del número, que es como se acaba etiquetando un SSR de router de core.
  const SD_WAN_SSR = 'SD-WAN (Session Smart, sin túneles)';
  const esSSR = (d) => /^SSR/i.test(String(d.ser || ''));
  function capaJuniper(d) {
    if (esSSR(d)) return { n: SD_WAN_SSR, v: d.cap };
    // `fw` viene del dimensionador y es numérico; `cap` es el texto del portal.
    // Se prefiere el numérico cuando está: es el que se verificó contra la matriz
    // oficial de Juniper.
    if (d.fw != null) return { n: 'Firewall (paquetes grandes)', v: d.fw };
    if (/FW\s*$/i.test(String(d.cap || ''))) return { n: 'Firewall (paquetes grandes)', v: d.cap };
    return { n: 'Capacidad de conmutación', v: d.cap };
  }

  // Dónde dimensionar de verdad cada fabricante: el catálogo del portal es un
  // resumen, y los dimensionadores trabajan con las capas completas.
  const HERRAMIENTA = {
    hw_ar: { txt: 'dimensionador Huawei', url: '/dimensionador-huawei-netengine.html' },
    hw_wan: { txt: 'dimensionador Huawei', url: '/dimensionador-huawei-netengine.html' },
    cisco: { txt: 'dimensionador Cisco', url: '/dimensionador-cisco-catalyst8k.html' },
    fortinet: { txt: 'dimensionador Fortinet', url: '/dimensionador-fortinet-fortigate.html' },
    juniper: { txt: 'dimensionador Juniper', url: '/dimensionador-juniper-srx.html' },
    mikrotik: { txt: 'dimensionador MikroTik', url: '/dimensionador-mikrotik-routeros.html' },
    aruba: { txt: 'dimensionador Aruba', url: '/dimensionador-aruba-edgeconnect.html' },
    nokia: { txt: 'dimensionador Nokia', url: '/dimensionador-nokia-7750sr.html' },
  };

  // PERFILES. `capa` dice, catálogo por catálogo, de qué campo sale la cifra de
  // ESA capa y cómo se llama. Un catálogo que no figura aquí, o cuyo lector
  // devuelve vacío, no es que valga cero: es que no publica esa capa, y sus
  // equipos se apartan diciéndolo.
  //
  // Los campos son los de `/api/catalog`, que NO es `legacyData/indexPR.js`:
  // `seedCatalog.js` funde en la misma fila lo que trae el catálogo del portal y
  // lo que trae el dimensionador de ese fabricante, así que Cisco llega con
  // `sdwan` numérico y los SRX de la generación 2024 con `vpn`, `ips` y `atp`.
  // Escribir este mapa contra `indexPR.js` fue el primer error de este módulo:
  // apartaba a Cisco entero del perfil SD-WAN por un dato que sí estaba, que es
  // el mismo fallo que el comparador cometió diciendo «IPS: no aplica» de un
  // Catalyst 8300. Se corrigió leyendo la API de verdad en el navegador.
  const PERFILES = {
    fwd: {
      etq: 'Reenvío / firewall (paquetes grandes)',
      mide: 'La cifra de portada: reenvío con NAT, ACL y QoS, o firewall sin inspección, medida con paquetes grandes. Es la más alta que publica cada fabricante y no se sostiene si el equipo inspecciona el tráfico. Sirve para dimensionar tránsito, no seguridad.',
      falta: 'el catálogo no publica su cifra de reenvío',
      capa: {
        hw_ar: (d) => ({ n: 'Forwarding', v: d.fwd }),
        hw_wan: (d) => ({ n: 'Capacidad de conmutación', v: d.cap }),
        cisco: (d) => ({ n: 'Forwarding', v: d.fwd != null ? d.fwd : d.cap }),
        nokia: (d) => ({ n: 'Capacidad de conmutación', v: d.cap }),
        fortinet: (d) => ({ n: 'Firewall (paquetes grandes)', v: d.fw }),
        juniper: capaJuniper,
        mikrotik: (d) => ({ n: 'Forwarding', v: d.fwd }),
        aruba: (d) => (d.fw != null
          ? { n: 'Firewall', v: d.fw }
          : { n: 'Forwarding', v: d.fwd }),
      },
    },
    ipsec: {
      etq: 'IPsec VPN',
      mide: 'Tráfico cifrado en túnel IPsec. También se mide con paquetes grandes, así que no cubre la inspección de lo que sale del túnel.',
      falta: 'el catálogo no publica su cifra de IPsec',
      capa: {
        hw_ar: (d) => ({ n: 'IPsec', v: d.ipsec }),
        cisco: (d) => ({ n: 'IPsec', v: d.ipsec }),
        fortinet: (d) => ({ n: 'IPsec VPN', v: d.vpn }),
        // Solo los SRX que traen cifra propia. Uno sin `vpn` no se dimensiona con
        // su firewall: en el SRX380 son 20 Gbps de firewall frente a 4,4 de IPsec.
        juniper: (d) => ({ n: 'IPsec VPN', v: d.vpn }),
        mikrotik: (d) => ({ n: 'IPsec (AES-CBC)', v: d.ipsec }),
        aruba: (d) => ({ n: 'IPsec', v: d.ipsec }),
      },
    },
    sdwan: {
      etq: 'SD-WAN (overlay)',
      mide: 'El caudal que el equipo mueve como nodo SD-WAN, con el overlay levantado. No es lo mismo que la cifra de firewall ni que la de inspección: pregunta por el transporte, no por la seguridad.',
      falta: 'el catálogo no publica su cifra de SD-WAN',
      capa: {
        hw_ar: (d) => ({ n: 'SD-WAN', v: d.sdwan }),
        cisco: (d) => ({ n: 'SD-WAN (IOS XE)', v: d.sdwan }),
        juniper: (d) => (esSSR(d) ? { n: SD_WAN_SSR, v: d.cap } : { n: null, v: null }),
        // EdgeConnect se dimensiona contra el ancho de banda WAN que soporta el
        // modelo, que es lo que HPE publica: un techo, no un throughput de
        // inspección. Su dimensionador añade el suelo del rango, que aquí no
        // aplica porque la pregunta es «quién llega», no «quién sobra».
        aruba: (d) => ({ n: 'Ancho de banda WAN máximo', v: d.wanMax }),
      },
    },
    ngfw: {
      etq: 'Con inspección (NGFW / IPS)',
      mide: 'La capa que aguanta el equipo con el motor de aplicación e inspección activo. En gama de sucursal es hasta un orden de magnitud menor que la cifra de firewall, y es la que hay que usar para dimensionar una sede con seguridad. Fortinet la publica como NGFW y Juniper como IPS: no son la misma prueba y la tabla lo dice en cada fila.',
      falta: 'el catálogo no publica su cifra con inspección activa',
      capa: {
        fortinet: (d) => ({ n: 'NGFW', v: d.ngfw }),
        juniper: (d) => ({ n: 'IPS', v: d.ips }),
      },
    },
    tp: {
      etq: 'Inspección completa (Threat Protection / ATP)',
      mide: 'El stack completo de seguridad: antivirus, control de aplicación e IPS a la vez. Es la cifra realista de una sede con seguridad avanzada y la más baja que publica cada fabricante — Threat Protection en Fortinet, Advanced Threat Prevention en Juniper.',
      falta: 'el catálogo no publica su cifra de inspección completa',
      capa: {
        fortinet: (d) => ({ n: 'Threat Protection', v: d.tp }),
        juniper: (d) => ({ n: 'ATP', v: d.atp }),
      },
    },
    // INSPECCIÓN TLS — VA AL FINAL, PERO NO ES EL ÚLTIMO PELDAÑO DE LA ESCALERA.
    // Los cinco perfiles de arriba sí forman una escalera de profundidad creciente
    // y caudal decreciente. Este NO: descifrar TLS es OTRA RUTA de proceso, con su
    // propio silicio y su propia metodología, y el cociente ssl/tp del catálogo va
    // de 0,52 (40F) a 1,18 (50G) — en el 50G, el 70G y el 90G el equipo aguanta MÁS
    // inspección TLS que Threat Protection. Por eso no se deriva de `tp` con un
    // factor: ese derate único vivió en el dimensionador de Fortinet hasta el
    // 2026-09-22 y era su defecto P0, porque se equivoca en las DOS direcciones.
    //
    // HASTA EL 2026-09-23 ESTA PANTALLA NO PODÍA OFRECER EL PERFIL, y no por
    // diseño: el catálogo solo traía `ssl` de 9 modelos. Al leer la tabla del
    // Product Matrix de septiembre pasó a 51 de 58 (19 de los 21 que el portal
    // lista), y con eso el perfil deja de ser un hueco lleno de apartados.
    ssl: {
      etq: 'Inspección TLS / SSL (descifrado en línea)',
      mide: 'Lo que el equipo aguanta descifrando HTTPS en línea, con IPS activo y una mezcla de suites criptográficas. NO es un peldaño más de la escalera anterior ni una fracción de Threat Protection: es otra ruta de proceso y otra medición, y en varios modelos de este catálogo la cifra es MAYOR que la de Threat Protection. Hoy solo Fortinet la publica por modelo.',
      falta: 'el catálogo no publica su cifra de inspección TLS',
      capa: {
        // Un solo lector a propósito. Añadir aquí a los otros siete con la cifra
        // de otra capa sería exactamente el derate que este repositorio retiró.
        fortinet: (d) => ({ n: 'SSL Inspection', v: d.ssl }),
      },
    },
  };

  // Requerimiento en Mbps. Se deja aquí para que la pantalla y la exportación
  // no puedan calcularlo cada una a su manera.
  function requerimiento({ bw, unit, dir, margin }) {
    const b = parseFloat(bw) || 0;
    const u = parseFloat(unit) || 1;
    const d = parseFloat(dir) || 1;
    const m = (parseFloat(margin) || 0) / 100;
    return b * u * d * (1 + m);
  }

  // La cifra de un equipo para un perfil: `{n, mbps}` cuando el catálogo la
  // trae, `{n:null, mbps:null, motivo}` cuando no. Nunca se rellena con otra.
  function capaDe(dev, perfilId) {
    const perfil = PERFILES[perfilId];
    const lector = perfil && perfil.capa[dev.grupo];
    if (!lector) return { n: null, mbps: null, motivo: perfil ? perfil.falta : null };
    const r = lector(dev.raw || {}) || {};
    const v = mbps(r.v);
    if (v === null) return { n: null, mbps: null, motivo: perfil.falta };
    return { n: r.n, mbps: v };
  }

  // Evalúa el catálogo entero contra el requerimiento. Devuelve tres montones,
  // porque son tres cosas distintas y confundirlas es lo que fallaba:
  //   candidatos — tienen cifra de esa capa y cumplen
  //   cortos     — tienen cifra de esa capa y no llegan
  //   apartados  — no tienen cifra de esa capa: no se pueden comprobar
  function evaluar(devs, perfilId, need) {
    const candidatos = [];
    const cortos = [];
    const apartados = [];
    for (const d of devs || []) {
      const capa = capaDe(d, perfilId);
      if (capa.mbps === null) { apartados.push({ d, motivo: capa.motivo }); continue; }
      const fila = { d, capa: capa.n, mbps: capa.mbps, holgura: need > 0 ? capa.mbps / need - 1 : null };
      if (capa.mbps >= need) candidatos.push(fila); else cortos.push(fila);
    }
    // El más pequeño que cumple, igual que los seis dimensionadores.
    candidatos.sort((a, b) => a.mbps - b.mbps);
    cortos.sort((a, b) => b.mbps - a.mbps);
    return { candidatos, cortos, apartados };
  }

  // Agrupa por fabricante conservando el orden de capacidad dentro de cada uno.
  // El orden de los fabricantes sale del CATÁLOGO, no de una lista escrita a
  // mano: la lista fija ya dejó fuera a Aruba y MikroTik en los filtros del
  // cotizador, y aquí habría hecho desaparecer en silencio a un fabricante nuevo.
  function porFabricante(filas) {
    const orden = [];
    const mapa = {};
    for (const f of filas) {
      const v = f.d.vendor;
      if (!mapa[v]) { mapa[v] = []; orden.push(v); }
      mapa[v].push(f);
    }
    return orden
      .map((v) => ({ vendor: v, color: mapa[v][0].d.color, filas: mapa[v] }))
      .sort((a, b) => a.filas[0].mbps - b.filas[0].mbps);
  }

  /* CUÁNTO DEL CATÁLOGO PUEDE RESPONDER ESTE PERFIL, ANTES DE ENSEÑAR LA LISTA.
     El panel de apartados ya existía, pero va ABAJO: primero se lee una lista de
     tres equipos de un solo fabricante y solo después se descubre que los otros
     siete no se comprobaron. En los perfiles de inspección eso no es un detalle
     —el de NGFW, que es el que viene marcado por defecto, aparta cinco de los
     ocho grupos— y con la inspección TLS es el caso extremo: la publica UN
     fabricante. Una lista corta sin ese encabezado se lee como «no hay equipo»
     cuando lo que pasa es que «no hay dato», y son dos conclusiones opuestas: la
     primera manda a subir de gama, la segunda a completar un documento.

     SE MIDE CONTRA EL CATÁLOGO, NO SE DECLARA. Una lista escrita a mano de qué
     fabricante publica qué capa se quedaría con los fabricantes de ayer — es la
     forma exacta de `CISCO_EOL_MODELS`, que listaba modelos que ya no existían y
     por eso no marcaba nada sin que nadie se enterara. */
  function cobertura(devs, perfilId) {
    const orden = [];
    const mapa = {};
    let con = 0;
    for (const d of devs || []) {
      const v = d.vendor;
      if (!mapa[v]) { mapa[v] = { vendor: v, color: d.color, con: 0, de: 0 }; orden.push(v); }
      mapa[v].de += 1;
      if (capaDe(d, perfilId).mbps !== null) { mapa[v].con += 1; con += 1; }
    }
    const fabs = orden.map((v) => mapa[v]);
    return {
      total: (devs || []).length,
      con,
      fabricantes: fabs.length,
      conCifra: fabs.filter((f) => f.con > 0).length,
      porFabricante: fabs.slice().sort((a, b) => b.con - a.con || a.vendor.localeCompare(b.vendor)),
    };
  }

  // Los apartados se cuentan por fabricante: una lista de 40 modelos no informa,
  // «Nokia: 18 modelos» sí, y con el enlace a donde sí se dimensionan.
  function apartadosPorFabricante(apartados) {
    const orden = [];
    const mapa = {};
    for (const a of apartados) {
      const v = a.d.vendor;
      if (!mapa[v]) { mapa[v] = { vendor: v, color: a.d.color, n: 0, motivo: a.motivo, tool: HERRAMIENTA[a.d.grupo] }; orden.push(v); }
      mapa[v].n += 1;
    }
    return orden.map((v) => mapa[v]).sort((a, b) => b.n - a.n);
  }

  // Aviso de bases: solo cuando de verdad se están mezclando medidas distintas.
  // Entre equipos del mismo fabricante no hay nada que avisar, y un aviso que
  // sale siempre deja de leerse.
  function avisoBases(filas) {
    const capas = Array.from(new Set(filas.map((f) => f.capa)));
    const fabs = Array.from(new Set(filas.map((f) => f.d.vendor)));
    if (fabs.length < 2) return null;
    if (capas.length > 1) {
      return `Estas cifras **no miden lo mismo**: ${capas.join(', ')}. Cada fabricante publica su propia base, así que sirven para saber quién cumple, no para coronar a uno.`;
    }
    return 'Cada fabricante mide **en su propio banco de pruebas**, con su mezcla de paquetes y su configuración. Sirven para ver quién cumple, no para ordenar fabricantes entre sí.';
  }

  // La exportación se arma con los datos, no rascando el HTML ya pintado: lo que
  // se exportaba antes salía de leer los `<div style="font-size:13px">` de la
  // pantalla, así que perdía la capa usada —que es el dato que da sentido a la
  // cifra— y se rompía al tocar el maquetado.
  function csv(res, ctx) {
    const filas = [['Fabricante', 'Modelo', 'Serie', 'Segmento', 'Capa dimensionada', 'Cifra de esa capa (Mbps)', 'Cifra de esa capa', 'Holgura', 'Puertos']];
    for (const f of res.candidatos) {
      filas.push([
        f.d.vendor, f.d.model, f.d.series || '', f.d.seg || '',
        f.capa, String(Math.round(f.mbps)), fmt(f.mbps),
        f.holgura === null ? '' : `${Math.round(f.holgura * 100)}%`,
        f.d.ports || '',
      ]);
    }
    for (const a of res.apartados) {
      filas.push([a.d.vendor, a.d.model, a.d.series || '', a.d.seg || '', 'sin comprobar', '', '', a.motivo, a.d.ports || '']);
    }
    const cab = [
      `# Calculadora de Throughput — perfil ${ctx.perfil}`,
      `# Requerimiento: ${fmt(ctx.need)} (${ctx.detalle})`,
      '# Los modelos "sin comprobar" no traen la cifra de esa capa en el catalogo: no se dimensionan con la de otra capa.',
    ];
    return `${cab.join('\n')}\n${filas.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')}`;
  }

  window.CALC = {
    PERFILES, HERRAMIENTA, mbps, fmt, requerimiento, capaDe, evaluar,
    cobertura, porFabricante, apartadosPorFabricante, avisoBases, csv,
  };
}());
