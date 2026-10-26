'use strict';
/* global module */
// `module` existe solo en Node (tests); en el navegador el typeof lo degrada.
/* ══ MOTOR DEL DIMENSIONADOR CISCO (2026-10-20) ══

   Módulo puro, sin DOM ni estado, con el patrón UMD de `juniper-motor.js`: en el navegador
   cuelga `CiscoMotor` de `window`; en Node se carga con require() desde las pruebas.

   DE DÓNDE SALE. El dueño trajo una herramienta externa («Dimensionador Oficial CISCO — 8000
   Secure Routers G2, Catalyst 8000, Meraki MX & Licenciamiento Unificado», 35 equipos, HTML
   suelto) y pidió actualizar este dimensionador con ella. Se contrastó cifra a cifra con las
   fichas oficiales (ver `docs/herramienta-externa-cisco-2026-10-20.md`); lo que entra aquí es su
   MÉTODO, corregido, no sus datos ni sus porcentajes. Lo que NO entra y por qué:

   - Sus recargos fijos (+35 % por seguridad, +15 % por ZBF, +10 % por voz…) no salen de ningún
     documento de Cisco. Inspeccionar no encarece la cifra de reenvío un tanto por ciento: CAMBIA
     LA CIFRA QUE APLICA. Con inspección en el equipo, el tráfico inspeccionado se compara con la
     Threat Protection publicada (EMIX, NGFW + IPS + URLF + AMP), que ya trae el coste dentro.
   - Contaba la salida local a Internet (DIA) en la etiqueta y nunca en la cuenta, y modelaba la
     duplicación de paquetes como +35 %: duplicar un flujo lo duplica entero.
   - Dividía la inspección TLS por 0,55. Ninguna ficha de router de este catálogo publica caudal
     con descifrado TLS: si el diseño lo pide en el router, ningún equipo cumple, y se dice.

   LO QUE SÍ ENTRA:

   1. Reparto overlay / DIA. En una sucursal todo el tráfico del sitio pasa por el router: la
      parte que viaja por el overlay ocupa la capa del perfil (reenvío, IPsec o SD-WAN) y la que
      sale en local ocupa la capa de su seguridad (reenvío sin inspección o con firewall aparte,
      Threat Protection si se inspecciona en el equipo, IPsec si va cifrada a un SSE en la nube).
      En un agregado o un hub solo llega el overlay: la DIA sale en cada sucursal.
   2. Las dos capas comparten el equipo: la utilización es la SUMA de las dos fracciones
      (overlay / su cifra + DIA / la suya) y el equipo cumple si no pasa del 100 %. Es un
      supuesto de diseño —un reparto lineal de la CPU— y la pantalla lo dice.
   3. FEC y duplicación de paquetes sobre el overlay, y margen sobre todo: coeficientes que
      declara quien dimensiona, nunca cifras de Cisco.
   4. Escala con lo que la ficha publica (túneles, rutas, sesiones de NAT, dispositivos
      recomendados de Meraki): una cifra publicada que no llega aparta el modelo con su motivo;
      una que la ficha no publica no lo aparta, pero se avisa. Los túneles se pueden escribir o
      derivar de la topología (`tunelesTopologia`, 2026-10-21): aritmética de sedes, hubs y
      transportes, sin ninguna cifra nueva de Cisco; la escrita manda sobre la calculada.
   5. Requisitos de hardware (doble fuente, celular, NIM, SM, MACsec, PoE): un modelo que no
      confirma el requisito se aparta diciendo si es porque no lo tiene o porque no consta.
   6. Licencias de la G2 por la clase de la plataforma (guía de pedido, tablas 9 y 10).

   LAS CIFRAS SON DEL FABRICANTE; LOS COEFICIENTES LOS DECLARA QUIEN DIMENSIONA. Si alguien
   «afina» uno, rompe `test/cisco-motor.test.js` y no la propuesta de un cliente. */
(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.CiscoMotor = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {

  // Qué familia del catálogo pertenece a cada plataforma, por `ser`. No son intercambiables
  // aunque coincida el caudal: cambia el plano de gestión, el licenciamiento y quién opera.
  const PLATAFORMAS = {
    xe: { n: 'IOS XE SD-WAN — Secure Router (G2) y Catalyst 8000', es: (m) => /Catalyst 8000|Secure Router \(G2\)/.test(m.ser) },
    isr: { n: 'ISR 1000', es: (m) => /ISR 1000/.test(m.ser) },
    meraki: { n: 'Meraki MX — gestión desde el dashboard', es: (m) => m.ser === 'Meraki MX' },
    asr: { n: 'ASR 1000 — parque instalado', es: (m) => /ASR 1000/.test(m.ser) },
    all: { n: 'Todas las plataformas', es: () => true },
  };

  // Capa del overlay según el perfil. En SD-WAN, un modelo sin cifra propia cae a su IPsec y se
  // marca (`cae`): es la excepción de Cisco que CLAUDE.md declara, y la lista lo dice.
  const PERFILES = {
    fwd: { n: 'Reenvío (routing + NAT + ACL + QoS)', k: 'fwd' },
    ipsec: { n: 'IPsec', k: 'ipsec' },
    sdwan: { n: 'SD-WAN (IPsec + QoS + DPI + FNF)', k: 'sdwan', respaldo: 'ipsec' },
  };

  // Dónde se mide la salida local a Internet según cómo se protege.
  const SEGURIDAD = {
    ninguna: { n: 'Sin inspección local', k: 'fwd',
      d: 'La salida a Internet solo se enruta y se traduce (NAT): se mide con la cifra de reenvío.' },
    onbox: { n: 'Inspección en el router', k: 'amenazas',
      d: 'Threat Protection en Secure Router y Catalyst (EMIX, NGFW + IPS + URLF + AMP); NGFW en Meraki.' },
    desacoplada: { n: 'Firewall dedicado', k: 'fwd',
      d: 'El router enruta y un firewall aparte inspecciona: se propone un Cisco Secure Firewall por la cifra de su capa de inspección.' },
    sse: { n: 'Seguridad en la nube (SSE)', k: 'ipsec',
      d: 'La salida a Internet viaja cifrada hasta el servicio en la nube: ocupa la capa IPsec del router.' },
  };

  const ROTULO_CAMPO = { fwd: 'reenvío', ipsec: 'IPsec', sdwan: 'SD-WAN', amenazas: 'Threat Protection' };

  // Puertos útiles de una IPv4 para NAT de origen: 1.024-65.535.
  const PUERTOS_UTILES = 64512;

  const num = (v, min = 0) => {
    const n = Number(v);
    return Number.isFinite(n) ? Math.max(min, n) : min;
  };
  const pct = (v) => Math.min(100, num(v)) / 100;
  // Techo a prueba de coma flotante: 1000 × 1,3 da 1300,0000000000002 y un ⌈ ⌉ directo lo
  // subiría a 1301.
  const techo = (x) => Math.ceil(Math.round(x * 1e6) / 1e6);
  const esMeraki = (m) => m && m.ser === 'Meraki MX';

  function fmt(mbps) {
    if (mbps == null || !Number.isFinite(mbps)) return '—';
    if (mbps >= 1e6) return (mbps / 1e6).toFixed(1).replace(/\.0$/, '') + ' Tbps';
    if (mbps >= 1000) return (mbps / 1000).toFixed(mbps % 1000 ? 1 : 0).replace(/\.0$/, '') + ' Gbps';
    return Math.round(mbps) + ' Mbps';
  }
  const miles = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  // La cifra de un campo, con su base de medida y el rótulo de lo que mide. `amenazas` se rotula
  // por su base: en Meraki es su NGFW (detección o prevención), en el resto Threat Protection.
  function cifra(m, k) {
    const v = m && typeof m[k] === 'number' ? m[k] : null;
    const base = (m && m.bases && m.bases[k]) || null;
    let n = ROTULO_CAMPO[k] || k;
    if (k === 'amenazas' && esMeraki(m)) n = /detección/.test(base || '') ? 'NGFW (detección)' : 'NGFW';
    return { k, v, base, n };
  }

  // La capa del overlay en el perfil pedido; en SD-WAN cae a IPsec si no hay cifra propia.
  function capaOverlay(m, perfil) {
    const P = PERFILES[perfil] || PERFILES.sdwan;
    const c = cifra(m, P.k);
    if (c.v == null && P.respaldo) {
      const r = cifra(m, P.respaldo);
      if (r.v != null) return { ...r, cae: true };
    }
    return { ...c, cae: false };
  }

  // Caudal que atraviesa el equipo, partido en overlay y salida local, antes y después de los
  // coeficientes. `dirMult` es 2 cuando el caudal se declara por sentido: Cisco publica la suma
  // de los dos.
  function demanda(p) {
    const modo = ['agg', 'hub'].includes(p.modo) ? p.modo : 'link';
    const bw = num(p.bwMbps);
    const dir = num(p.dirMult, 1) || 1;
    const sedes = Math.max(1, Math.floor(num(p.sedes, 1)));
    const conc = pct(p.concPct == null ? 100 : p.concPct);
    const dia = modo === 'link' ? pct(p.diaPct) : 0;
    const fec = pct(p.fecPct);
    const dup = pct(p.dupPct);
    const head = pct(p.headPct);

    let sitio;
    if (modo === 'agg') sitio = bw * sedes * conc * (1 - pct(p.diaPct)) * dir;
    else sitio = bw * dir;
    const overlay = modo === 'link' ? sitio * (1 - dia) : sitio;
    const diaMbps = modo === 'link' ? sitio * dia : 0;
    const overlayNeed = overlay > 0 ? techo(overlay * (1 + fec) * (1 + dup) * (1 + head)) : 0;
    const diaNeed = diaMbps > 0 ? techo(diaMbps * (1 + head)) : 0;

    const pasos = [];
    if (modo === 'agg') {
      pasos.push({ n: `${sedes} sede(s) × ${fmt(bw)} × ${Math.round(conc * 100)} % de simultaneidad`, v: bw * sedes * conc });
      if (pct(p.diaPct)) pasos.push({ n: `Sin la salida local de cada sede (−${Math.round(pct(p.diaPct) * 100)} %)`, v: bw * sedes * conc * (1 - pct(p.diaPct)) });
    } else {
      pasos.push({ n: modo === 'hub' ? 'Tráfico agregado del hub' : 'Caudal del sitio', v: bw });
    }
    if (dir === 2) pasos.push({ n: 'Por sentido → suma de los dos (Cisco publica la suma)', v: sitio });
    if (diaMbps) pasos.push({ n: `Salida local a Internet (${Math.round(dia * 100)} %)`, v: diaMbps }, { n: 'Por el overlay', v: overlay });
    if (fec) pasos.push({ n: `FEC (+${Math.round(fec * 100)} % sobre el overlay, supuesto)`, v: overlay * (1 + fec) });
    if (dup) pasos.push({ n: `Duplicación de paquetes (+${Math.round(dup * 100)} % del overlay)`, v: overlay * (1 + fec) * (1 + dup) });
    pasos.push({ n: `Margen de crecimiento (+${Math.round(head * 100)} %)`, v: overlayNeed + diaNeed });

    return {
      modo, bw, sedes, conc, dir, dia, fec, dup, head,
      sitio, overlay, diaMbps, overlayNeed, diaNeed, total: overlayNeed + diaNeed,
      distribucion: { overlay, dia: diaMbps, sobrecarga: Math.max(0, overlayNeed + diaNeed - overlay - diaMbps) },
      pasos,
    };
  }

  // Requisitos de hardware. Cada uno dice qué campo lo confirma; un modelo que no lo confirma se
  // aparta, distinguiendo «no lo tiene» de «no consta».
  function requisitos(m, r) {
    const motivos = [], avisos = [], piezas = [];
    if (r.dualPsu) {
      if (m.redund === true) { /* de serie */ }
      else if (m.redund === 'opcional') {
        if (m.psu2) piezas.push({ cat: 'Alimentación', desc: 'Segunda fuente para redundancia', sku: m.psu2.sku, nota: m.psu2.d });
        else avisos.push('La segunda fuente es opcional y el catálogo no trae su referencia: confirmarla en la guía de pedido.');
      } else if (m.redund === false) motivos.push('fuente única: no admite una segunda');
      else motivos.push('no consta cuántas fuentes trae de serie');
    }
    if (r.celular) {
      if (m.lte) { /* integrado */ }
      else if (m.pim) piezas.push({ cat: 'Módulos', desc: 'Módulo celular (PIM) — elegir uno', sku: null, pim: true, need: r.celularMbps || null });
      else motivos.push('sin celular integrado ni ranura PIM');
    }
    // AppQoE con DRE (propuesta 2.3): la guía dice quién lo ejecuta y cuántas conexiones optimiza
    // cada perfil; caudal con optimización no publica ninguna ficha.
    if (r.appqoe) {
      const a = m.appqoe;
      const c = Math.floor(num(r.appqoeConexiones));
      if (!a) motivos.push('AppQoE (DRE) no consta para este equipo en su guía');
      else if (a.rol === 'controlador') avisos.push('Controlador de servicio de AppQoE: el DRE corre en un nodo externo (Catalyst 8000V o C8500L-8S4X), que este BOM no lleva.');
      else if (!a.perfiles.length) avisos.push('AppQoE (DRE): la guía lo admite en este equipo pero no publica su perfil: consultar.');
      else {
        const perfil = a.perfiles.find((x) => x.conexiones >= c) || null;
        const max = a.perfiles[a.perfiles.length - 1];
        if (!perfil) motivos.push(`DRE llega a ${miles(max.conexiones)} conexiones (perfil ${max.p}) frente a ${miles(c)}`);
        else avisos.push(`AppQoE (DRE): perfil ${perfil.p}, hasta ${miles(perfil.conexiones)} conexiones optimizadas, con ${perfil.ram} GB de RAM y ${perfil.disco} GB de disco además de los del equipo; ninguna ficha publica el caudal con optimización.`);
      }
    }
    if (r.nim && !(num(m.nim) >= 1)) motivos.push('sin ranura NIM');
    if (r.sm && !(num(m.sm) >= 1)) motivos.push('sin ranura SM');
    if (r.macsec) {
      if (m.macsec === 'integrado') { /* en todos sus puertos */ }
      else if (m.macsec === 'nim') piezas.push({ cat: 'Módulos', desc: 'NIM WAN con MACsec — elegir una', sku: null, macsec: true });
      else motivos.push('MACsec no consta en su ficha');
    }
    if (r.poe) {
      const w = num(r.poeW);
      if (typeof m.poe !== 'number') motivos.push('el catálogo no trae su presupuesto PoE');
      else if (m.poe < Math.max(1, w)) motivos.push(`PoE de ${m.poe} W frente a ${w} W pedidos`);
    }
    return { motivos, avisos, piezas };
  }

  // Túneles de datos que levanta CADA equipo según la topología (propuesta 2.1 del 2026-10-21,
  // ejecutada con el encargo del dueño «ejecuta pendientes y mejora propuesta»). Es aritmética,
  // no una cifra de Cisco: cada par de transportes (colores) que se ven entre sí es un túnel, y
  // con «cada color solo con el suyo» los pares son los colores comunes. El rol sale del modo:
  // una sede es una sucursal; un agregado o un hub, un hub.
  //   · Hub y radios: la sucursal solo con los hubs.
  //   · Malla completa: la sucursal con las demás sedes y con los hubs.
  //   · Hub, en las dos: con todas las sedes y con los demás hubs.
  //   t = { topologia: 'hub'|'malla', sedes, hubs, colores, coloresHub, ven }
  function tunelesTopologia(t, modo) {
    if (!t || !['hub', 'malla'].includes(t.topologia)) return null;
    const ent = (v, def) => { const n = Math.floor(num(v)); return n >= 1 ? n : def; };
    const sedes = ent(t.sedes, 0);
    if (!sedes) return null;
    const esHub = modo === 'agg' || modo === 'hub';
    // Vacío es un hub; 0 vale en una malla sin hubs. Si el equipo ES el hub, hay al menos uno.
    const hubsDecl = t.hubs === '' || t.hubs == null ? 1 : Math.max(0, Math.floor(num(t.hubs)));
    const hubs = esHub ? Math.max(1, hubsDecl) : hubsDecl;
    const cs = ent(t.colores, 1), ch = ent(t.coloresHub, cs);
    const ven = t.ven !== false;
    const pares = (a, b) => (ven ? a * b : Math.min(a, b));
    const pasos = [];
    const pl = (n, uno, varios) => `${miles(n)} ${n === 1 ? uno : varios}`;
    const sumar = (n, por, uno, varios) => {
      if (n > 0 && por > 0) pasos.push({ n: `${pl(n, uno, varios)} × ${pl(por, 'par', 'pares')} de transportes`, v: n * por });
    };
    if (esHub) {
      sumar(sedes, pares(cs, ch), 'sede', 'sedes');
      sumar(hubs - 1, pares(ch, ch), 'hub más', 'hubs más');
    } else {
      if (t.topologia === 'malla') sumar(sedes - 1, pares(cs, cs), 'sede más', 'sedes más');
      sumar(hubs, pares(cs, ch), 'hub', 'hubs');
    }
    const total = pasos.reduce((a, x) => a + x.v, 0);
    return { topologia: t.topologia, rol: esHub ? 'hub' : 'sucursal', sedes, hubs, colores: cs, coloresHub: ch, ven, pasos, total };
  }

  /* ══ ENLACES WAN Y PUERTOS (2026-10-21, propuesta 1.1, aprobada por el dueño) ══
     Cada enlace va a un puerto real del equipo, contado de su ficha (`puertos` en cisco.js). Sin
     enlaces declarados no se comprueba nada: es el caso de siempre.
     · Un enlace se describe por cómo lo ENTREGA el operador (cobre o fibra y la velocidad de la
       interfaz), no por lo contratado: 300 Mbps entregados en fibra de 1G piden una jaula de 1G.
     · Va primero lo más exigente (fibra de 100G hasta cobre de 1G) y cada enlace al puerto que
       menos falta hace: WAN antes que flex o convertible, nativo antes que con transceptor, el más
       lento que lo admite y uno dedicado antes que un combo. Un puerto «LAN» nunca recibe un enlace.
     · Un cobre de 1G puede ir a una jaula que admita 1G con el transceptor 1000BASE-T del catálogo
       (GLC-T/GLC-TE; MA-SFP-1GB-TX en Meraki), que va al BOM.
     · Si los puertos fijos no bastan y queda una ranura NIM, se propone el módulo de la guía de
       pedido de su familia que lo admite y lleva más de los enlaces que faltan (a igualdad, primero
       los WAN, luego los LAN/WAN con L3, y el de menos puertos). Sin ranura NIM y con una SM libre,
       el portador de dos NIM de la familia (C-SM-NIM-ADPT en la G2, C-SM-NIM-ADPTR en el 8300). Si
       tampoco, el equipo se aparta con su motivo. Un chasis modular (ASR 1006-X) no se comprueba.
     · Un enlace DSL va al puerto DSL integrado (`dsl`, ISR 1116-4P) y un puerto DSL no recibe un
       enlace Ethernet. Un cobre de 10G va a una SFP+ con el transceptor 10GBASE-T donde la guía de
       hardware lo da (`sfp10gt`, serie 8300 de la G2).
     · Lo que la ficha admite a la vez (`combinaciones`: tabla 5 del 12X4QC; bahías y 240 GE del
       C8570-G2) aparta el equipo si los enlaces no caben en ninguna.
     · Cada enlace de fibra lleva su óptica en el BOM. Con el tipo de fibra y la distancia del tramo
       declarados (2026-10-21), la elige `elegirOptica` con el alcance de la ficha de cada óptica: la
       primera del catálogo que llega (van de menor a mayor alcance), antes la que no exige nada
       (RS-FEC, cable de acondicionamiento). Sin alguno de los dos va «elegir una», diciendo qué falta; si ninguna
       llega, va «consultar» con un aviso: las ópticas del catálogo no son todas las de Cisco, así
       que el equipo no se aparta por eso.
     · Un enlace celular no ocupa puerto Ethernet: pide módem integrado o PIM (el requisito de
       celular que ya existía). */
  const TIPOS_ENLACE = { internet: 'Internet', mpls: 'MPLS / privado', celular: 'Celular (4G/5G)' };
  const ROLES_ENLACE = { principal: 'Principal', respaldo: 'Respaldo' };
  const ENTREGAS = {
    'cobre-1g': { medio: 'cobre', vel: 1, n: 'cobre RJ-45 de 1G' },
    'cobre-2.5g': { medio: 'cobre', vel: 2.5, n: 'cobre RJ-45 de 2,5G' },
    'cobre-5g': { medio: 'cobre', vel: 5, n: 'cobre RJ-45 de 5G' },
    'cobre-10g': { medio: 'cobre', vel: 10, n: 'cobre RJ-45 de 10G' },
    'fibra-1g': { medio: 'fibra', vel: 1, n: 'fibra de 1G' },
    'fibra-10g': { medio: 'fibra', vel: 10, n: 'fibra de 10G' },
    'fibra-25g': { medio: 'fibra', vel: 25, n: 'fibra de 25G' },
    'fibra-40g': { medio: 'fibra', vel: 40, n: 'fibra de 40G' },
    'fibra-100g': { medio: 'fibra', vel: 100, n: 'fibra de 100G' },
    // Va a un puerto DSL integrado (`dsl` del equipo); su velocidad la da la línea, no la interfaz.
    dsl: { medio: 'dsl', vel: null, n: 'DSL (ADSL2+/VDSL2)' },
  };
  // Tipos de fibra de un enlace: los de la tabla de cableado de las fichas de las ópticas.
  const FIBRAS = {
    smf: 'monomodo G.652', om1: 'multimodo OM1', om2: 'multimodo OM2', om3: 'multimodo OM3', om4: 'multimodo OM4',
  };
  const MAX_ENLACES = 8;
  const JAULAS = ['SFP', 'SFP+', 'SFP28', 'QSFP+', 'QSFP28'];
  // Velocidad de cada categoría de óptica del catálogo; los cables directos no son la óptica de un enlace.
  const VEL_OPTICA = { sfp1g: 1, mxsfp1g: 1, mxg2sfp1g: 1, sfp10g: 10, sfp10gt: 10, mxsfp10g: 10, mxg2sfp10g: 10, mxsfp25g: 25, qsfp40g: 40, qsfp100g: 100 };
  // Transceptores de cobre: 1000BASE-T en una jaula de 1G y 10GBASE-T en una SFP+.
  const COBRE_SFP = /\b(1000|10G)BASE-T\b/;
  const VEL_COBRE_SFP = [1, 10];
  const fmtVel = (g) => `${String(g).replace('.', ',')}G`;
  // Orden lexicográfico de dos claves de preferencia: la menor gana.
  const antes = (a, b) => { for (let k = 0; k < a.length; k++) if (a[k] !== b[k]) return a[k] < b[k]; return false; };
  // Orden de reparto: lo que menos puertos admiten va primero.
  const ORDEN_ENTREGA = ['dsl', 'fibra-100g', 'fibra-40g', 'fibra-25g', 'fibra-10g', 'cobre-10g', 'cobre-5g', 'cobre-2.5g', 'fibra-1g', 'cobre-1g'];

  // Los enlaces declarados, normalizados y numerados; lo que no se entiende se descarta.
  function enlacesValidos(enlaces) {
    return (Array.isArray(enlaces) ? enlaces : []).slice(0, MAX_ENLACES).map((e, i) => {
      const x = e || {};
      const tipo = TIPOS_ENLACE[x.tipo] ? x.tipo : 'internet';
      const rol = ROLES_ENLACE[x.rol] ? x.rol : 'principal';
      const ent = tipo === 'celular' ? null : ENTREGAS[x.entrega] ? x.entrega : null;
      // La fibra solo cuenta en una entrega de fibra; el tramo, en fibra y en cobre.
      const fib = !!ent && ENTREGAS[ent].medio === 'fibra';
      const km = fib || (!!ent && ENTREGAS[ent].medio === 'cobre') ? num(x.km) : 0;
      // Un celular declara la bajada y la subida que necesita (Mbps): eligen el módulo por categoría.
      const cel = tipo === 'celular';
      return { n: i + 1, tipo, rol, entrega: ent, e: ent ? ENTREGAS[ent] : null,
        fibra: fib && FIBRAS[x.fibra] ? x.fibra : null, km: km > 0 ? km : null,
        bajada: cel && num(x.bajada) > 0 ? num(x.bajada) : null, subida: cel && num(x.subida) > 0 ? num(x.subida) : null };
    }).filter((x) => x.tipo === 'celular' || x.e);
  }
  // Un enlace celular pide módem: suma el requisito de celular a lo que ya pedía el escenario.
  function requisitosConEnlaces(p) {
    const r = { ...((p && p.requisitos) || {}) };
    const cel = enlacesValidos(p && p.enlaces).filter((x) => x.tipo === 'celular');
    if (cel.length) {
      r.celular = true;
      const max = (k) => Math.max(0, ...cel.map((x) => x[k] || 0)) || null;
      r.celularMbps = { bajada: max('bajada'), subida: max('subida') };
    }
    return r;
  }

  // Los módulos celulares de la familia (`lista`: los PIM de su guía de pedido) frente a la bajada y
  // la subida que pide el enlace, con la categoría de cada uno (`CEL`, ficha de los módulos). Lo que
  // se compara es el ancho de banda de la categoría, un pico teórico: el operador da menos.
  function pimsCelular(lista, CEL, need) {
    const opciones = (lista || []).map((x) => ({ sku: x.sku, ...((CEL && CEL[x.sku]) || {}) }));
    const n = need || {};
    if (!n.bajada && !n.subida) return { opciones, elegibles: opciones, falta: true };
    const llega = (o) => o.bajada != null && (!n.bajada || o.bajada >= n.bajada) && (!n.subida || o.subida >= n.subida);
    const elegibles = opciones.filter(llega);
    const max = opciones.filter((o) => o.bajada != null).sort((a, b) => b.bajada - a.bajada)[0] || null;
    return { opciones, elegibles, max };
  }

  // Los módulos de la guía de pedido de la familia del equipo (G2: tablas 7 y 8; Catalyst
  // 8300/8200: tabla 5, con sus límites de familia y de ranura). El ISR, el 8500 y el ASR no traen
  // lista. `cat` = { modulosG2, modulosC8k }.
  function modulosEquipo(m, cat) {
    const c = cat || {};
    if (m.lic === 'cswan') return { lista: c.modulosG2 || [], fuente: 'la guía de pedido de la G2 (tablas 7 y 8)', pim: 'tabla 8' };
    if (/^Catalyst 8[23]00/.test(m.id)) {
      const cabe = (x) => (!x.familia || m.id.startsWith(x.familia)) && (!x.ranuras || (m.sm || 0) >= x.ranuras);
      return { lista: (c.modulosC8k || []).filter(cabe), fuente: 'la guía de pedido de los Catalyst 8300/8200 (tabla 5)', pim: 'tabla 5' };
    }
    return { lista: [], fuente: null, pim: null };
  }

  // Cómo entra un enlace en un puerto, o null si no entra.
  function admite(pu, e, conTransceptor) {
    if (e.medio === 'dsl' || pu.medios.includes('DSL')) return e.medio === 'dsl' && pu.medios.includes('DSL') ? { via: 'nativo', medio: 'DSL' } : null;
    const min = pu.velMin != null ? pu.velMin : pu.vel;
    const rango = e.vel <= pu.vel && e.vel >= min;
    const jaula = pu.medios.find((x) => JAULAS.includes(x));
    // Una jaula que solo admite un transceptor de cobre (`soloCobre`: la XGSPON/10GBASE-T de las
    // 8100 VAI/VAP) nunca recibe una óptica.
    if (pu.soloCobre && e.medio !== 'cobre') return null;
    if (e.medio === 'cobre') {
      if (pu.medios.includes('RJ45') && rango) return { via: 'nativo', medio: 'RJ45' };
      if (VEL_COBRE_SFP.includes(e.vel) && conTransceptor && jaula && rango) return { via: 'transceptor', medio: jaula };
      return null;
    }
    return jaula && rango ? { via: 'optica', medio: jaula } : null;
  }

  // Las ópticas del catálogo para una velocidad: las de la familia del equipo (`optics`), o las
  // Cisco de esa velocidad si el puerto es de un módulo, cuyas jaulas no lista el equipo.
  const OPTICA_CISCO = { 1: 'sfp1g', 10: 'sfp10g', 40: 'qsfp40g', 100: 'qsfp100g' };
  function categorias(m, vel, enModulo) {
    if (enModulo) return OPTICA_CISCO[vel] ? [OPTICA_CISCO[vel]] : [];
    return (m.optics || []).filter((k) => VEL_OPTICA[k] === vel);
  }
  function opticasDe(m, vel, OPTICS, enModulo) {
    return categorias(m, vel, enModulo).flatMap((k) => ((OPTICS && OPTICS[k]) || []).filter((o) => !COBRE_SFP.test(o.d || '')));
  }
  function transceptoresCobre(m, vel, OPTICS, enModulo) {
    return categorias(m, vel, enModulo).flatMap((k) => ((OPTICS && OPTICS[k]) || []).filter((o) => COBRE_SFP.test(o.d || '')));
  }

  // Distancia legible: «300 m», «1,5 km».
  const fmtKm = (km) => (km < 1 ? `${miles(km * 1000)} m` : `${String(Math.round(km * 1000) / 1000).replace('.', ',')} km`);
  // La óptica que llega al tramo, con el alcance de su ficha en esa fibra: la primera del catálogo
  // que llega (cada familia va de menor a mayor alcance, el estándar de cada fibra antes que el
  // alternativo: SR antes que LRM), salvo que solo llegue pidiendo algo (`segunda`: RS-FEC, un
  // cable de acondicionamiento) y otra llegue sin eso. Sin fibra o sin distancia no se elige:
  // «elegir una», con lo que falte. Devuelve { lista, elegida, tramo, falta, noLlega }.
  function elegirOptica(opticas, fibra, km) {
    const todas = opticas || [];
    if (!todas.length) return { lista: todas, elegida: null };
    if (!fibra) return { lista: todas, elegida: null, falta: km ? 'el tipo de fibra' : 'el tipo de fibra y la distancia del tramo' };
    const enFibra = todas.filter((o) => (o.alcance || []).some((t) => t.fibra === fibra));
    if (!km) return { lista: enFibra, elegida: null, falta: 'la distancia del tramo', noLlega: enFibra.length ? null : { max: null } };
    const m = km * 1000;
    let mejor = null, max = null;
    enFibra.forEach((o, i) => {
      // De cada óptica, el tramo que llega con menos condiciones y menor alcance.
      let t = null;
      for (const x of o.alcance) {
        if (x.fibra !== fibra) continue;
        if (!max || x.m > max.m) max = { sku: o.bom || o.sku, m: x.m };
        if (m < (x.desde || 0) || m > x.m) continue;
        if (!t || antes([x.segunda ? 1 : 0, x.m], [t.segunda ? 1 : 0, t.m])) t = x;
      }
      if (!t) return;
      const clave = [t.segunda ? 1 : 0, i];
      if (!mejor || antes(clave, mejor.clave)) mejor = { o, t, clave };
    });
    // `llega`: el alcance de la elegida en esa fibra (el de su ficha, no el del tramo que se usa).
    if (mejor) return { lista: [mejor.o], elegida: mejor.o, tramo: mejor.t, llega: Math.max(...mejor.o.alcance.filter((t) => t.fibra === fibra).map((t) => t.m)) };
    return { lista: [], elegida: null, noLlega: { max } };
  }
  // Por qué no hay óptica: «ninguna … llega a 90 km en monomodo (G.652); la de más alcance, …».
  function motivoOptica(a) {
    const al = a.alcance;
    if (!al || !al.noLlega) return null;
    const donde = `en ${FIBRAS[al.fibra]}`;
    if (!al.noLlega.max) return `ninguna óptica de ${fmtVel(ENTREGAS[a.entrega].vel)} del catálogo para este equipo va ${donde}`;
    return `ninguna óptica de ${fmtVel(ENTREGAS[a.entrega].vel)} del catálogo para este equipo llega a ${fmtKm(al.km)} ${donde} (la de más alcance, ${al.noLlega.max.sku}: ${fmtKm(al.noLlega.max.m / 1000)})`;
  }

  // Reparto de los enlaces en los puertos de un equipo. `cat` = { optics, modulosG2, modulosC8k }.
  // `extra`: enlaces ya validados que se suman (la extensión TLOC de un sitio con dos routers).
  function asignarEnlaces(m, enlaces, cat, extra) {
    const c = cat || {};
    const lista = [...enlacesValidos(enlaces).filter((x) => x.tipo !== 'celular'), ...(extra || [])];
    const res = { asignados: [], sinAsignar: [], modulos: [], modular: false, sinDato: false, combinacion: null };
    if (!lista.length) return res;
    if (m.puertos === null) { res.modular = true; return res; }
    if (!Array.isArray(m.puertos)) { res.sinDato = true; return res; }
    // Transceptores de cobre por velocidad, en los puertos fijos y en los de un módulo.
    const cobreDe = (vel, enModulo) => transceptoresCobre(m, vel, c.optics, enModulo);
    const libres = [];
    // `ref` es el módulo de `res.modulos` que trae el puerto: dos NIM iguales son dos módulos.
    const sumar = (grupos, modulo, ref) => grupos.forEach((g) => {
      if (g.uso === 'LAN') return;
      for (let i = 0; i < g.n; i++) libres.push({ ...g, modulo: modulo || null, ref: ref == null ? null : ref });
    });
    sumar(m.puertos);
    if (m.dsl) libres.push({ n: 1, vel: null, medios: ['DSL'], uso: 'WAN', dsl: m.dsl, modulo: null, ref: null });
    let nimLibres = Math.max(0, Math.floor(num(m.nim)));
    let smLibres = Math.max(0, Math.floor(num(m.sm)));
    const mods = modulosEquipo(m, c).lista;
    // El portador de dos NIM en una ranura SM (C-SM-NIM-ADPT en la G2, C-SM-NIM-ADPTR en el
    // Catalyst 8300): solo si la guía de la familia lo lista y queda una ranura SM.
    const portador = mods.find((x) => x.en === 'sm' && /^C-SM-NIM-ADPTR?$/.test(x.sku));
    let abierto = null;
    const candidatosModulo = mods.filter((x) => x.en === 'nim' && Array.isArray(x.puertos))
      .sort((a, b) => (a.puertos.every((g) => g.uso === 'WAN') ? 0 : 1) - (b.puertos.every((g) => g.uso === 'WAN') ? 0 : 1)
        || a.puertos.reduce((t, g) => t + g.n, 0) - b.puertos.reduce((t, g) => t + g.n, 0));
    const orden = [...lista].sort((a, b) => ORDEN_ENTREGA.indexOf(a.entrega) - ORDEN_ENTREGA.indexOf(b.entrega) || a.n - b.n);
    // El límite de enlaces WAN de la ficha manda sobre los puertos: los últimos declarados sobran.
    const tope = m.maxWan || Infinity;
    const sobran = new Set(lista.slice(tope).map((x) => x.n));
    // El tramo de cobre (2026-10-21): un transceptor llega a lo que dé su ficha (100 m el
    // 1000BASE-T, 30 m el SFP-10G-T-X) y un RJ-45 del equipo a sus 100 m (`alcanceRJ45`: de su guía
    // de hardware o, si no lo trae, de la norma 802.3). Sin tramo declarado no se comprueba.
    const metrosDe = (x) => (x.km ? x.km * 1000 : 0);
    const rjM = m.alcanceRJ45 ? m.alcanceRJ45.m : null;
    const alcanceCobre = (o) => Math.max(0, ...(o.alcance || []).filter((t) => t.fibra === 'cobre').map((t) => t.m));
    const cobreQueLlega = (x, enModulo) => cobreDe(x.e.vel, enModulo).filter((o) => !metrosDe(x) || alcanceCobre(o) >= metrosDe(x));
    const admiteTramo = (pu, x, enModulo) => {
      const a = admite(pu, x.e, cobreQueLlega(x, enModulo).length > 0);
      if (a && a.via === 'nativo' && x.e.medio === 'cobre' && rjM && metrosDe(x) > rjM) return null;
      return a;
    };
    const mejor = (e) => {
      let elegido = null;
      libres.forEach((pu, i) => {
        const a = admiteTramo(pu, e, !!pu.modulo);
        if (!a) return;
        const clave = [pu.uso === 'WAN' ? 0 : 1, a.via === 'transceptor' ? 1 : 0, pu.vel || 0, pu.medios.length > 1 ? 1 : 0];
        if (!elegido || antes(clave, elegido.clave)) elegido = { i, a, clave };
      });
      return elegido;
    };
    // Una ranura NIM para un módulo: la del chasis o, sin ella, un hueco del portador.
    const ranuraNim = () => {
      if (nimLibres > 0) { nimLibres -= 1; return { ok: true, en: null }; }
      if (!portador) return { ok: false };
      if (!abierto || !abierto.huecos) {
        if (smLibres <= 0) return { ok: false };
        smLibres -= 1;
        abierto = { sku: portador.sku, d: portador.d, enlaces: [], portador: true, huecos: 2 };
        res.modulos.push(abierto);
      }
      abierto.huecos -= 1;
      return { ok: true, en: abierto };
    };
    for (const e of orden) {
      if (sobran.has(e.n)) { res.sinAsignar.push({ enlace: e.n, motivo: `admite ${m.maxWan} enlaces WAN a la vez` }); continue; }
      let el = mejor(e);
      if (!el) {
        // El módulo que admite este enlace y, de los que faltan por repartir, a más: un C-NIM-4X
        // lleva tres fibras de 10G en una sola ranura donde tres C-NIM-1X pedirían un portador.
        const cabe = (mod, x) => mod.puertos.some((g) => g.uso !== 'LAN' && admiteTramo(g, x, true));
        const resto = orden.slice(orden.indexOf(e)).filter((x) => !sobran.has(x.n));
        const cubre = (mod) => Math.min(resto.filter((x) => cabe(mod, x)).length, mod.puertos.filter((g) => g.uso !== 'LAN').reduce((t, g) => t + g.n, 0));
        const mod = candidatosModulo.filter((x) => cabe(x, e)).reduce((a, x) => (!a || cubre(x) > cubre(a) ? x : a), null);
        const r = mod ? ranuraNim() : { ok: false };
        if (r.ok) {
          res.modulos.push({ sku: mod.sku, d: mod.d, enlaces: [], ...(r.en ? { dentro: r.en } : {}) });
          sumar(mod.puertos, mod.sku, res.modulos.length - 1);
          el = mejor(e);
        }
      }
      if (!el) {
        // Un cobre que cabría en una jaula si el catálogo trajera su transceptor: se dice así.
        const jaulaDe = { 1: 'fibra-1g', 10: 'fibra-10g' }[e.e.vel];
        const falta = e.e.medio === 'cobre' && jaulaDe && !cobreDe(e.e.vel, false).length && libres.some((pu) => admite(pu, ENTREGAS[jaulaDe], false));
        let porque = falta ? `: tiene jaulas de ${fmtVel(e.e.vel)}, pero el catálogo no trae su transceptor de cobre${e.e.vel === 10 ? ' 10GBASE-T para este equipo' : ''}` : '';
        // Un DSL sin puerto integrado: los NIM DSL de la guía salieron de venta (EOL15805).
        if (!porque && e.e.medio === 'dsl' && mods.some((x) => /^NIM-VA/.test(x.sku) && x.finVenta)) {
          porque = `: los NIM DSL de su guía están fuera de venta (último pedido el ${mods.find((x) => /^NIM-VA/.test(x.sku)).finVenta.ultimoPedido}, boletín EOL15805) y sin reemplazo`;
        }
        // Un cobre que tendría puerto si el tramo fuera más corto: el motivo es la distancia.
        if (!porque && e.e.medio === 'cobre' && metrosDe(e)) {
          const sinTramo = { ...e, km: null };
          if (libres.some((pu) => admiteTramo(pu, sinTramo, !!pu.modulo))) {
            const llegan = [rjM && libres.some((pu) => admite(pu, e.e, false)) ? `${rjM} m en un RJ-45` : null,
              ...cobreDe(e.e.vel, false).map((o) => `${alcanceCobre(o)} m con el ${o.bom || o.sku}`)].filter(Boolean);
            porque = `: el cobre no llega a ${fmtKm(e.km)} (${[...new Set(llegan)].join('; ')}); hace falta fibra`;
          }
        }
        res.sinAsignar.push({ enlace: e.n, motivo: e.tipo === 'tloc' ? `sin puerto para la extensión TLOC (${e.e.n})` : `sin puerto para el enlace ${e.n} (${e.e.n})${porque}` });
        continue;
      }
      const pu = libres.splice(el.i, 1)[0];
      if (pu.ref != null) {
        const mo = res.modulos[pu.ref];
        mo.enlaces.push(e.n);
        if (mo.dentro && !mo.dentro.enlaces.includes(e.n)) mo.dentro.enlaces.push(e.n);
      }
      const fibra = e.e.medio === 'fibra';
      const al = fibra ? elegirOptica(opticasDe(m, e.e.vel, c.optics, !!pu.modulo), e.fibra, e.km) : null;
      res.asignados.push({
        enlace: e.n, tipo: e.tipo, rol: e.rol, entrega: e.entrega,
        puerto: { uso: pu.uso, medios: pu.medios, vel: pu.vel, modulo: pu.modulo, ...(pu.dsl ? { dsl: pu.dsl } : {}),
          ...(pu.rotulo ? { rotulo: pu.rotulo } : {}),
          ...(pu.ref != null && res.modulos[pu.ref].dentro ? { portador: res.modulos[pu.ref].dentro.sku } : {}) },
        via: el.a.via, medio: el.a.medio,
        opticas: al ? al.lista : null,
        alcance: al ? { ...al, fibra: e.fibra, km: e.km } : null,
        transceptores: el.a.via === 'transceptor' ? cobreQueLlega(e, !!pu.modulo) : null,
        tramoCobre: e.e.medio === 'cobre' && e.km ? {
          km: e.km,
          llega: el.a.via === 'nativo' ? rjM : Math.max(...cobreQueLlega(e, !!pu.modulo).map(alcanceCobre)),
          supuesto: el.a.via === 'nativo' && !(m.alcanceRJ45 && m.alcanceRJ45.guia && e.e.vel <= m.alcanceRJ45.hasta),
        } : null,
      });
    }
    // Lo que la ficha admite a la vez: sus combinaciones de puertos (tabla 5 del 12X4QC) o un tope
    // de GE habilitados. Cuenta lo asignado a los puertos fijos.
    const fijos = res.asignados.filter((a) => !a.puerto.modulo && a.puerto.vel);
    const comb = m.combinaciones;
    if (comb && fijos.length) {
      const n = { sfp: 0, q40: 0, q100: 0 };
      for (const a of fijos) {
        const v = ENTREGAS[a.entrega].vel;
        if (v === 100) n.q100 += 1; else if (v === 40) n.q40 += 1; else n.sfp += 1;
      }
      if (!comb.lista.some((k) => n.sfp <= k.sfp && n.q40 <= k.q40 && n.q100 <= k.q100)) res.combinacion = { ...n, fuente: comb.fuente };
      const ge = fijos.reduce((t, a) => t + ENTREGAS[a.entrega].vel, 0);
      if (comb.maxGE && ge > comb.maxGE) res.excedeGE = { ge, max: comb.maxGE };
    }
    for (const mo of res.modulos) {
      if (mo.dentro) mo.enPortador = mo.dentro.sku;
      delete mo.dentro; delete mo.huecos;
    }
    res.asignados.sort((a, b) => a.enlace - b.enlace);
    res.sinAsignar.sort((a, b) => a.enlace - b.enlace);
    return res;
  }
  /* ══ SITIO CON DOS ROUTERS (2026-10-21, propuesta 1.3) ══
     Guía de diseño de Catalyst SD-WAN («WAN Edge Deployment»): un segundo router por redundancia,
     normalmente conectado a todos los transportes; si uno cae, el otro lleva el enrutamiento de toda
     la sede. Por eso cada router se dimensiona para todo el tráfico (no se reparte) y el BOM lleva
     dos. Con TLOC extension («TLOC Extension»), cada router va a parte de los transportes y alcanza
     los demás por una interfaz hacia su vecino: los enlaces se alternan (1, 3, 5… al primero) y
     cada router suma su interfaz TLOC (un puerto de cobre de 1G, supuesto). Un enlace celular no se
     extiende por TLOC: avisa. */
  function repartoHa(m, p) {
    const c = (p && p.catalogo) || {};
    if (!p || !p.ha || !p.haTloc) return asignarEnlaces(m, p && p.enlaces, c);
    const val = enlacesValidos(p.enlaces).filter((x) => x.tipo !== 'celular');
    const tloc = (k) => ({ n: 100 + k, tipo: 'tloc', rol: 'principal', entrega: 'cobre-1g', e: ENTREGAS['cobre-1g'], fibra: null, km: null, bajada: null, subida: null });
    const r = [1, 2].map((k) => {
      const x = asignarEnlaces(m, [], c, [...val.filter((_, i) => i % 2 === k - 1), tloc(k)]);
      const marca = (o) => ({ ...o, router: k });
      return { ...x, asignados: x.asignados.map(marca), sinAsignar: x.sinAsignar.map((o) => ({ ...o, router: k, motivo: `${o.motivo} (router ${k})` })), modulos: x.modulos.map(marca) };
    });
    return { asignados: [...r[0].asignados, ...r[1].asignados], sinAsignar: [...r[0].sinAsignar, ...r[1].sinAsignar], modulos: [...r[0].modulos, ...r[1].modulos],
      modular: r[0].modular, sinDato: r[0].sinDato, combinacion: r[0].combinacion || r[1].combinacion, excedeGE: r[0].excedeGE || r[1].excedeGE, tloc: true };
  }

  // Por qué la combinación de puertos no cabe, con las cuentas.
  function motivoCombinacion(en) {
    if (en && en.combinacion) {
      const n = en.combinacion;
      const partes = [n.q100 && `${n.q100}×100G`, n.q40 && `${n.q40}×40G`, n.sfp && `${n.sfp}×SFP+`].filter(Boolean).join(' + ');
      return `la combinación de puertos ${partes} no está entre las que admite a la vez (${n.fuente})`;
    }
    if (en && en.excedeGE) return `los enlaces suman ${miles(en.excedeGE.ge)} GE de puertos y la ficha admite ${miles(en.excedeGE.max)} GE a la vez`;
    return null;
  }

  // Lo que el reparto añade al BOM: módulos propuestos, ópticas y transceptores de cobre.
  function piezasEnlaces(r) {
    const piezas = [];
    // En un sitio con dos routers y TLOC extension, cada pieza dice de qué router es.
    const push = (de, x) => piezas.push(de.router ? { ...x, desc: `Router ${de.router}: ${x.desc}`, porRouter: true } : x);
    // Los enlaces por su nombre; la interfaz TLOC (101, 102) no es un enlace del operador.
    const paraLista = (ns) => {
      const e = ns.filter((n) => n < 100);
      return [e.length ? `${e.length > 1 ? 'los enlaces' : 'el enlace'} ${e.join(' y ')}` : null, ns.some((n) => n > 100) ? 'la extensión TLOC' : null].filter(Boolean).join(' y ');
    };
    const quien = (a) => paraLista([a.enlace]);
    for (const mo of (r && r.modulos) || []) {
      const para = paraLista(mo.enlaces);
      push(mo, mo.portador
        ? { cat: 'Módulos', desc: `${mo.d} — para el NIM de ${para}`.replace('de el ', 'del '), sku: mo.sku,
          nota: 'Lo propone el reparto de enlaces: no queda ranura NIM y sí una SM, donde este portador aloja dos NIM (guía de pedido de la familia). Precio en CCW.', moduloEnlace: true }
        : { cat: 'Módulos', desc: `${mo.d} — para ${para}`, sku: mo.sku,
          nota: `Lo propone el reparto de enlaces: los puertos fijos no bastan. Módulo de la guía de pedido de la familia${mo.enPortador ? `, en el portador ${mo.enPortador}` : ''}; precio en CCW.`, moduloEnlace: true });
    }
    for (const a of (r && r.asignados) || []) {
      const lista = (a.opticas || a.transceptores || []).map((o) => o.sku);
      const enModulo = a.puerto.modulo ? ` Va en el ${a.puerto.modulo}: confirmar su compatibilidad en la matriz de Cisco.` : '';
      const al = a.alcance;
      if (a.opticas && al && al.elegida) {
        const o = al.elegida, t = al.tramo;
        push(a, { cat: 'Ópticas', desc: `Óptica de ${fmtVel(ENTREGAS[a.entrega].vel)} para ${quien(a)}: tramo de ${fmtKm(al.km)} en ${FIBRAS[al.fibra]}`,
          sku: o.bom || o.sku,
          nota: `${o.d}. La elige el alcance de su ficha: el tramo es de ${fmtKm(al.km)} y llega a ${fmtKm(al.llega / 1000)} en ${FIBRAS[al.fibra]}${t.nota ? `; ${t.nota}` : ''}.${enModulo}` });
      } else if (a.opticas && al && al.noLlega) {
        push(a, { cat: 'Ópticas', desc: `Óptica de ${fmtVel(ENTREGAS[a.entrega].vel)} para ${quien(a)} — consultar`, sku: null,
          nota: `${motivoOptica(a)[0].toUpperCase()}${motivoOptica(a).slice(1)}: consultar con Cisco.` });
      } else if (a.opticas) {
        push(a, { cat: 'Ópticas', desc: `Óptica de ${fmtVel(ENTREGAS[a.entrega].vel)} para ${quien(a)}${lista.length > 1 ? ' — elegir una' : ''}`,
          sku: lista.length === 1 ? (a.opticas[0].bom || a.opticas[0].sku) : null,
          nota: lista.length
            ? `${lista.join(', ')}: la elige el alcance del tramo${al && al.falta ? ` (falta ${al.falta})` : ''}.${enModulo}`
            : 'El catálogo no trae ópticas de esta velocidad para este equipo: consultar la matriz de compatibilidad de Cisco.' });
      } else if (a.transceptores) {
        const diez = ENTREGAS[a.entrega].vel === 10;
        push(a, { cat: 'Ópticas', desc: `Transceptor de cobre ${diez ? '10GBASE-T' : '1000BASE-T'} para ${quien(a)}${lista.length > 1 ? ' — elegir uno' : ''}`,
          sku: lista.length === 1 ? (a.transceptores[0].bom || a.transceptores[0].sku) : null,
          nota: `El enlace llega en cobre y va a una jaula ${a.medio}: ${lista.join(' o ')}.${a.tramoCobre ? ` Tramo de ${fmtKm(a.tramoCobre.km)}; llega a ${a.tramoCobre.llega} m.` : diez ? ` ${a.transceptores[0].d}: el cableado del operador no puede pasar de ahí.` : ''}` });
      }
    }
    // Con dos routers repartidos, cada pieza es de uno: no se duplica con el segundo equipo.
    return piezas;
  }
  // Rótulo de un puerto asignado: «SFP+ WAN de 10G (en el C-NIM-WAN-2X)».
  function rotuloPuerto(a) {
    const pu = a.puerto;
    if (pu.medios.includes('DSL')) return `Puerto DSL ${pu.uso} (${pu.dsl})`;
    const medio = pu.medios.length > 1 ? `${a.medio} (combo ${pu.medios.join('/')})` : pu.medios[0];
    return `${medio} ${pu.uso} de ${fmtVel(pu.vel)}${pu.rotulo ? ` (${pu.rotulo})` : ''}${pu.modulo ? ` en el ${pu.modulo}` : ''}`;
  }

  // Escenario: la entrega de los enlaces principales tiene que llevar el caudal por sentido. Un
  // celular no cuenta (su velocidad no se declara). Solo en una sede y con el caudal por sentido.
  function enlacesFrenteCaudal(p) {
    if (!p || (p.modo && p.modo !== 'link') || num(p.dirMult, 1) !== 2) return null;
    const prin = enlacesValidos(p.enlaces).filter((x) => x.rol === 'principal' && x.e);
    // Un DSL no declara velocidad de interfaz: con uno entre los principales no se puede afirmar.
    if (!prin.length || prin.some((x) => !x.e.vel)) return null;
    const cabe = prin.reduce((t, x) => t + x.e.vel * 1000, 0);
    const bw = num(p.bwMbps);
    return bw > cabe ? { bw, cabe } : null;
  }

  /* ══ CISCO SECURE ACCESS (2026-10-21, propuesta 3.1) ══
     Con la salida a Internet hacia un SSE, el BOM lleva la suscripción que la paga (`SECURE_ACCESS`
     en cisco.js, de su guía de pedido) y la memoria los túneles que pide su guía de usuario.
     · Una suscripción por cliente (sin precio propio) y licencia por usuario cubierto —SIA y, si se
       marca, SPA, Essentials o Advantage, con su mínimo— o, solo en SIA Essentials, por sede: el
       grupo lo fija la salida a Internet de la sede por sentido y el tier, el volumen mensual de datos
       (que el escenario no trae: «elegir una»).
     · IPS en la nube: Advantage lo incluye; con Essentials, el complemento SA-THRT por puesto.
     · Túneles: 1 Gbps por túnel y uno de respaldo por cada principal. La guía no dice si el gigabit es
       por sentido: se cuenta la suma de los dos, con el margen (lo prudente, supuesto declarado). */
  function secureAccess(o, d, SA) {
    const res = { filas: [], avisos: [], principales: 0, tuneles: 0 };
    if (!SA || !d || !(d.diaMbps > 0)) return res;
    const x = o || {};
    const cat = 'Seguridad en la nube';
    res.principales = Math.max(1, Math.ceil(d.diaNeed / SA.tunelMbps));
    res.tuneles = res.principales * 2;
    res.filas.push({ cat, desc: 'Cisco Secure Access — suscripción (una por cliente)', sku: SA.sub, qty: 1,
      nota: `Sin precio propio: lo ponen las líneas de producto, por tramos de usuarios en CCW. Plazo de ${SA.plazos.join(', ')} meses; incluye el soporte SWSS Enhanced.` });
    let nivel = SA.usuario[x.nivel] ? x.nivel : 'ess';
    const u = Math.floor(num(x.usuarios));
    const puestos = u ? Math.max(u, SA.minUsuarios) : SA.minUsuarios;
    if (!u) res.avisos.push(`Secure Access: sin usuarios declarados, la licencia por usuario va con el mínimo de la guía (${SA.minUsuarios}); ajustarla.`);
    else if (u < SA.minUsuarios) res.avisos.push(`Secure Access pide un mínimo de ${SA.minUsuarios} usuarios: se proponen ${SA.minUsuarios}.`);
    const porUsuario = (uso, sku, n) => res.filas.push({ cat, desc: `Secure ${uso} Access ${SA.usuario[nivel].n} — por usuario`, sku, qty: n,
      nota: 'Licencia por usuario cubierto (empleados y terceros con acceso); el precio sale del tramo de usuarios y del plazo en CCW.' });
    if (x.licencia === 'sede') {
      if (nivel !== 'ess') { res.avisos.push('Secure Access por sede solo existe en SIA Essentials: se propone Essentials.'); nivel = 'ess'; }
      const mbps = d.dir === 2 ? d.diaMbps / 2 : d.diaMbps;
      const g = SA.sede.find((k) => mbps <= k.hastaMbps);
      if (!g) {
        res.avisos.push(`Secure Access por sede llega a ${miles(SA.sede[SA.sede.length - 1].hastaMbps)} Mbps y la sede sale con ${miles(mbps)} Mbps por sentido: va por usuario.`);
        porUsuario('Internet', SA.usuario[nivel].sia, puestos);
      } else {
        res.filas.push({ cat, desc: `Secure Internet Access Essentials por sede, grupo ${g.grupo} (hasta ${miles(g.hastaMbps)} Mbps) — elegir una`, sku: null, qty: 1,
          nota: `${g.tiers.map((t) => `${t.sku}: ${t.datos} de datos al mes`).join('; ')}. Lo decide el volumen mensual. Cubre solo a los usuarios de la sede (los remotos van por usuario) y no trae Experience Insights, Secure Client ni RBI.` });
      }
      if (x.privado) porUsuario('Private', SA.usuario[nivel].spa, puestos);
      if (x.ips) res.avisos.push('Secure Access: el complemento de IPS (SA-THRT) va por puesto; con la licencia por sede, consultar.');
    } else {
      porUsuario('Internet', SA.usuario[nivel].sia, puestos);
      if (x.privado) porUsuario('Private', SA.usuario[nivel].spa, puestos);
      if (x.ips) {
        if (nivel === 'ess') res.filas.push({ cat, desc: SA.amenazas.n, sku: SA.amenazas.sku, qty: puestos, nota: `${SA.amenazas.d} Cantidad: el mayor número de puestos.` });
        else res.avisos.push('Secure Access Advantage ya incluye IPS y control L7: no hace falta SA-THRT.');
      }
    }
    res.avisos.push(`Secure Access: la salida a Internet (${miles(d.diaNeed)} Mbps con margen, los dos sentidos) pide ${res.principales} túnel(es) IPsec de 1 Gbps y otros tantos de respaldo${res.principales > 1 ? ', en un grupo ECMP' : ''}.`);
    return res;
  }

  // Controladores de Catalyst SD-WAN (propuesta 2.2): con el número de equipos del overlay, el
  // despliegue del SD-WAN Manager (las opciones de la tabla cuyo rango lo contiene) y cuántos
  // Validators y Controllers, con sus recursos (`CONTROLADORES_SDWAN`, recursos recomendados de la
  // versión que declara). Por encima del máximo, varios overlays.
  function controladoresSdwan(equipos, saie, RC) {
    const n = Math.floor(num(equipos));
    if (!RC || !n) return null;
    if (n > RC.maxEquipos) return { n, fuera: true, max: RC.maxEquipos, version: RC.version };
    const en = (x) => n >= x.de && n <= x.a;
    const manager = (saie ? RC.manager.conSaie : RC.manager.sinSaie).filter(en).map((x) => ({ ...x, recursos: RC.tipos[x.tipo] }));
    return { n, saie: !!saie, version: RC.version, manager,
      validadores: RC.validadores.find(en) || null, controladores: RC.controladores.find(en) || null };
  }

  /* ══ FIREWALL DEDICADO: CISCO SECURE FIREWALL (2026-10-21, propuesta 3.2) ══
     Con «Firewall dedicado aparte», la salida a Internet la inspecciona un Secure Firewall de las
     series 1200, 3100 o 4200 (`SECURE_FIREWALL`): el más pequeño cuya cifra de la capa que pide el
     escenario llega, como en Fortinet: FW + AVC, FW + AVC + IPS (la habitual) o el descifrado TLS si
     se pide; nunca la cifra de otra capa. La necesidad es la salida a Internet con el margen, los dos
     sentidos sumados (la ficha no dice el sentido). Las sesiones escritas, si las hay, contra las
     sesiones con AVC de la ficha. */
  const CAPAS_FW = { avc: { k: 'fwAvc', n: 'FW + AVC' }, ips: { k: 'ips', n: 'FW + AVC + IPS' }, tls: { k: 'tls', n: 'descifrado TLS' } };
  function firewallDedicado(d, o, FW) {
    if (!FW || !d || !(d.diaMbps > 0)) return null;
    const x = o || {};
    const capa = x.tls ? 'tls' : x.capa === 'avc' ? 'avc' : 'ips';
    const c = CAPAS_FW[capa];
    const need = d.diaNeed;
    const ses = Math.floor(num(x.sesiones));
    const filas = FW.modelos.map((m) => {
      const motivos = [];
      if (m[c.k] < need) motivos.push(`${c.n}: ${miles(m[c.k])} Mbps frente a ${miles(need)}`);
      if (ses && m.sesiones < ses) motivos.push(`${miles(m.sesiones)} sesiones con AVC frente a ${miles(ses)}`);
      return { m, ok: !motivos.length, motivos, u: need / m[c.k] };
    });
    const candidatos = filas.filter((f) => f.ok).sort((a, b) => a.m[c.k] - b.m[c.k]);
    return { capa, n: c.n, k: c.k, base: FW.bases[c.k], need, candidatos, apartados: filas.filter((f) => !f.ok), elegido: candidatos[0] || null };
  }
  // El firewall elegido y su licencia de Threat, Malware y URL al BOM. La 3100 y la 4200 llevan el
  // plazo en la referencia (1, 3 o 5 años); la 1200 lo elige en CCW.
  function piezasFirewall(fw, anios) {
    if (!fw || !fw.elegido) return { filas: [], avisos: [] };
    const m = fw.elegido.m;
    const avisos = [];
    let n = [1, 3, 5].includes(anios) ? anios : null;
    if (!n) { n = anios > 5 ? 5 : 3; avisos.push(`La suscripción del Secure Firewall es de 1, 3 o 5 años: se propone ${n}.`); }
    const conPlazo = m.tmc.includes('{n}');
    return {
      filas: [
        { cat: 'Firewall', desc: `${m.id} — firewall dedicado con Threat Defense`, sku: m.pid, qty: 1,
          nota: `Se dimensiona con su ${fw.n}: ${miles(m[fw.k])} Mbps (${fw.base}) frente a ${miles(fw.need)} de salida a Internet con margen. Precio en CCW.` },
        { cat: 'Licencias', desc: `Licencia Threat, Malware y URL del ${m.id}${conPlazo ? ` — ${n} años` : ''}`, sku: m.tmc.replace('{n}', n), qty: 1,
          nota: `IPS, Malware Defense y URL Filtering (guía de pedido de seguridad de red). ${conPlazo ? '' : `Plazo de 1, 3 o 5 años al pedirla en CCW (${n} propuesto). `}Malware y URL no tienen cifra propia en la ficha.` },
      ],
      avisos,
    };
  }

  // Escala: una cifra publicada que no llega aparta; una que no se publica, avisa.
  function escala(m, e) {
    const motivos = [], avisos = [];
    const mirar = (need, campo, rotulo) => {
      const n = Math.floor(num(need));
      if (!n) return;
      if (typeof m[campo] !== 'number') { avisos.push(`La ficha no publica ${rotulo}: confirmar ${miles(n)} con Cisco.`); return; }
      if (m[campo] < n) motivos.push(`${miles(m[campo])} ${rotulo} frente a ${miles(n)}`);
    };
    mirar(e.tuneles, 'tuneles', 'túneles');
    mirar(e.rutas, 'rutas', 'rutas');
    mirar(e.sesiones, 'nat', 'sesiones de NAT');
    if (esMeraki(m)) mirar(e.dispositivos, 'clientes', 'dispositivos recomendados');
    if (e.tuneles && m.tunelesNota) avisos.push(`Túneles: ${m.tunelesNota}.`);
    return { motivos, avisos };
  }

  // Evalúa cada modelo de la plataforma contra la demanda. Devuelve todos, con su utilización y
  // sus motivos; los que cumplen van ordenados por su capacidad equivalente para esta mezcla de
  // tráfico (la menor primero: el más pequeño que cumple).
  function evaluar(models, p) {
    const d = demanda(p);
    // Los túneles escritos mandan; sin ellos, los que da la topología.
    const topo = tunelesTopologia(p.topologia, d.modo);
    const req = requisitosConEnlaces(p);
    const esc = { ...(p.escala || {}) };
    if (!(num(esc.tuneles) > 0) && topo) esc.tuneles = topo.total;
    const plat = PLATAFORMAS[p.plataforma] || PLATAFORMAS.xe;
    const seg = SEGURIDAD[p.seguridad] || SEGURIDAD.ninguna;
    const tlsEnRouter = !!p.tls && p.seguridad === 'onbox' && d.diaNeed > 0;
    const filas = (models || []).filter((m) => plat.es(m)).map((m) => {
      const motivos = [], avisos = [];
      const co = capaOverlay(m, p.perfil);
      const cd = d.diaNeed > 0 ? cifra(m, seg.k) : null;
      if (d.overlayNeed > 0 && co.v == null) motivos.push(`no publica cifra de ${PERFILES[p.perfil] ? ROTULO_CAMPO[PERFILES[p.perfil].k] : 'SD-WAN'}`);
      if (cd && cd.v == null) motivos.push(p.seguridad === 'onbox' ? 'no publica Threat Protection ni NGFW' : `no publica cifra de ${cd.n}`);
      if (tlsEnRouter) motivos.push('ninguna ficha de router publica caudal con descifrado TLS');
      let u = null;
      if (!motivos.length) {
        u = (d.overlayNeed > 0 ? d.overlayNeed / co.v : 0) + (cd ? d.diaNeed / cd.v : 0);
        if (u > 1) motivos.push(`utilización del ${Math.round(u * 100)} %`);
      }
      const capEq = u ? d.total / u : null;
      const es = escala(m, esc);
      const rq = requisitos(m, req);
      motivos.push(...es.motivos, ...rq.motivos);
      avisos.push(...es.avisos, ...rq.avisos);
      const en = repartoHa(m, p);
      motivos.push(...en.sinAsignar.map((x) => x.motivo));
      if (motivoCombinacion(en)) motivos.push(motivoCombinacion(en));
      if (en.modular) avisos.push('Chasis modular: los puertos de los enlaces dependen de las tarjetas que se pidan (consultar).');
      if (en.sinDato) avisos.push('Los puertos de este equipo no están contados: los enlaces no se comprueban.');
      for (const mo of en.modulos) {
        avisos.push(mo.portador
          ? `No queda ranura NIM: el ${mo.sku} (${mo.d}) ocupa una ranura SM y aloja el NIM ${mo.enlaces.length > 1 ? `de los enlaces ${mo.enlaces.join(' y ')}` : `del enlace ${mo.enlaces[0]}`}.`
          : `Los puertos fijos no bastan: ${mo.enlaces.length > 1 ? 'los enlaces' : 'el enlace'} ${mo.enlaces.join(' y ')} van en un ${mo.sku} (${mo.d})${mo.enPortador ? `, dentro del ${mo.enPortador}` : ''}.`);
      }
      for (const a of en.asignados) {
        const mo = motivoOptica(a), al = a.alcance;
        if (mo) avisos.push(`Enlace ${a.enlace}: ${mo}; consultar con Cisco.`);
        if (a.tramoCobre && a.tramoCobre.supuesto) avisos.push(`Enlace ${a.enlace}: los ${a.tramoCobre.llega} m del cobre en su RJ-45 son la norma IEEE 802.3; su guía de hardware no los da para ${fmtVel(ENTREGAS[a.entrega].vel)}.`);
        else if (al && al.tramo && al.tramo.segunda) avisos.push(`Enlace ${a.enlace}: la ${al.elegida.bom || al.elegida.sku} a ${fmtKm(al.km)} ${al.tramo.nota}.`);
      }
      if (m.notaPuertos && en.asignados.length) avisos.push(m.notaPuertos);
      if (p.ha && esMeraki(m)) avisos.push('Dos MX en una sede funcionan en «warm spare»: la guía de diseño de Catalyst SD-WAN no aplica; confirmarlo con la documentación de Meraki.');
      if (co.cae) avisos.push('Sin cifra SD-WAN propia: se dimensiona con su IPsec, que no incluye DPI ni FNF.');
      if (/1\.400 B/.test(co.base || '')) avisos.push(`Su cifra de ${co.n} está medida con paquetes de 1.400 B: con tráfico real (IMIX) rinde menos.`);
      if (esMeraki(m) && d.total > 0) avisos.push('Meraki no publica el tamaño de paquete de sus cifras.');
      return { m, ok: !motivos.length, motivos, avisos, co, cd, u, capEq, piezas: [...rq.piezas, ...piezasEnlaces(en)], enlaces: en };
    });
    const candidatos = filas.filter((f) => f.ok).sort((a, b) => a.capEq - b.capEq);
    const apartados = filas.filter((f) => !f.ok);
    return { demanda: d, plataforma: plat, seguridad: seg, tlsEnRouter, filas, candidatos, apartados, topo, tunelesManual: num((p.escala || {}).tuneles) > 0,
      enlaces: enlacesValidos(p.enlaces), enlacesCaudal: enlacesFrenteCaudal(p),
      ha: p.ha ? { tloc: !!p.haTloc, celular: enlacesValidos(p.enlaces).some((x) => x.tipo === 'celular') } : null };
  }

  // Los apartados agrupados por su primer motivo, con un rótulo sin cifras: la cifra de cada
  // uno ya va en su fila de «Modelos evaluados».
  const GRUPOS = [
    [/^utilización/, 'no llegan: utilización por encima del 100 %'],
    [/túneles frente/, 'publican menos túneles de los pedidos'],
    [/rutas frente/, 'publican menos rutas de las pedidas'],
    [/sesiones de NAT frente/, 'publican menos sesiones de NAT de las pedidas'],
    [/dispositivos recomendados frente/, 'recomiendan menos dispositivos de los de la sede'],
    [/^PoE de/, 'no llegan a la potencia PoE pedida'],
    [/el cobre no llega a/, 'no llegan con cobre a algún tramo: hace falta fibra'],
    [/NIM DSL de su guía están fuera de venta/, 'no tienen DSL integrado (los NIM DSL están fuera de venta)'],
    [/^sin puerto para el enlace/, 'no tienen puerto para algún enlace WAN'],
    [/^sin puerto para la extensión TLOC/, 'no tienen puerto para la extensión TLOC'],
    [/enlaces WAN a la vez/, 'admiten menos enlaces WAN de los declarados'],
    [/combinación de puertos|GE a la vez/, 'no admiten esa combinación de puertos a la vez'],
  ];
  function resumenApartados(apartados) {
    const grupos = new Map();
    for (const f of apartados || []) {
      const m0 = String(f.motivos[0] || 'sin motivo');
      const g = GRUPOS.find(([re]) => re.test(m0));
      const clave = g ? g[1] : m0;
      if (!grupos.has(clave)) grupos.set(clave, []);
      grupos.get(clave).push(f.m.id);
    }
    return [...grupos.entries()].map(([motivo, ids]) => ({ motivo, ids }));
  }

  // Tráfico que cuenta para el tier de ancho de banda DNA (FAQ de las suscripciones DNA): en
  // SD-WAN, todo el tráfico WAN (los dos sentidos, que es el «agregado» de la tabla); fuera de
  // SD-WAN, solo el cifrado: el overlay si el perfil cifra y la salida a un SSE, que viaja en IPsec.
  function traficoLicencia(d, p) {
    if (!d) return { wan: 0, cifrado: 0 };
    const tunel = p.perfil === 'fwd' ? 0 : d.overlay;
    const sse = p.seguridad === 'sse' ? d.diaMbps : 0;
    return { wan: d.sitio, cifrado: tunel + sse, conMargen: d.sitio * (1 + num(p.headPct) / 100) };
  }

  // El tier DNA más bajo que cubre el tráfico, sin pasar del máximo de la plataforma (`dnaTierMax`)
  // ni usar un tier que la plataforma no tiene (`solo`). Sin tráfico que contar, el más bajo.
  function tierDna(m, mbps, DNA) {
    const disp = DNA.tiers.filter((t) => !t.solo || t.solo.includes(m.id));
    const tope = m.dnaTierMax ? disp.findIndex((t) => t.t === m.dnaTierMax) : disp.length - 1;
    const lista = disp.slice(0, tope >= 0 ? tope + 1 : disp.length);
    const t = lista.find((x) => x.agregado >= mbps);
    return { tier: t || lista[lista.length - 1], tope: !t, lista };
  }

  // Licencias del equipo elegido. G2: por la clase (S, M, L, XL, 2XL) de la guía de pedido;
  // Catalyst 8000, ISR y ASR: DNA por tier de ancho de banda; Meraki: por clase de equipo.
  //   o = { gestion: 'sdwan'|'autonomo', nivel: 'E'|'A'|'P', seguridad, url, malware, anios,
  //         trafico: traficoLicencia(), vpns, modulos: [módulos elegidos] }
  function licencias(m, o, LIC, DNA) {
    const anios = Math.max(1, Math.floor(num(o.anios, 1)) || 1);
    const nivel = ['E', 'A', 'P'].includes(o.nivel) ? o.nivel : 'A';
    const filas = [], avisos = [];
    const sku = (plantilla, c) => plantilla.replaceAll('{c}', c);
    if (m.lic === 'cswan') {
      const c = m.clase;
      if (!c) { avisos.push('La clase de esta plataforma no consta: la referencia de licencia sale de CCW.'); return { filas, avisos }; }
      filas.push({ cat: 'Licencias', desc: LIC.osE.n, sku: sku(LIC.osE.sku, c), qty: 1, unit: 0, nota: LIC.osE.d, incluida: true });
      const nv = nivel === 'P' ? 'A' : nivel;
      if (nivel === 'P') avisos.push('La G2 no tiene un nivel Premier: se propone Advantage.');
      if (o.gestion === 'autonomo') {
        if (nv === 'A') filas.push({ cat: 'Licencias', desc: LIC.rosA.n, sku: sku(LIC.rosA.sku, c), qty: 1, unit: null, nota: `${sku(LIC.rosA.d, c)} Término ${anios} año(s): precio en CCW.` });
      } else {
        const L = nv === 'E' ? LIC.cswanE : LIC.cswanA;
        filas.push({ cat: 'Licencias', desc: L.n, sku: sku(L.sku, c), qty: 1, unit: null, nota: `${L.d} Término ${anios} año(s): precio en CCW.` });
        if (LIC.nube) filas.push({ cat: 'Licencias', desc: LIC.nube.n, sku: null, qty: 1, unit: null, nota: LIC.nube.d, opcional: true });
      }
      if (o.seguridad === 'onbox') {
        // La guía de pedido nombra los que no admiten Threat, URL Filtering ni Malware Defense.
        if (m.secAddon === false) avisos.push(`El ${m.id.replace('Cisco Secure Router ', '')} no admite las licencias de seguridad LIC-SEC (guía de pedido de la G2): la inspección va desacoplada o en la nube.`);
        else {
          if (o.gestion === 'autonomo' && LIC.swmOnPrem) {
            if (nv !== 'A') avisos.push('Los add-ons de seguridad en modo autónomo van sobre Routing Advantage: se propone Advantage.');
            if (nv !== 'A') filas.push({ cat: 'Licencias', desc: LIC.rosA.n, sku: sku(LIC.rosA.sku, c), qty: 1, unit: null, nota: `${sku(LIC.rosA.d, c)} Término ${anios} año(s): precio en CCW.` });
            filas.push({ cat: 'Licencias', desc: LIC.swmOnPrem.n, sku: LIC.swmOnPrem.sku, qty: 1, unit: null, nota: LIC.swmOnPrem.d });
          }
          filas.push({ cat: 'Licencias', desc: LIC.secT.n, sku: sku(LIC.secT.sku, c), qty: 1, unit: null, nota: LIC.secT.d });
          if (o.url) filas.push({ cat: 'Licencias', desc: LIC.secC.n, sku: sku(LIC.secC.sku, c), qty: 1, unit: null, nota: LIC.secC.d });
          if (o.malware) filas.push({ cat: 'Licencias', desc: LIC.secM.n, sku: sku(LIC.secM.sku, c), qty: 1, unit: null, nota: LIC.secM.d });
        }
      }
    } else if (m.lic === 'meraki') {
      // Suscripción («Subscription - MX Licensing»): una referencia por clase de equipo, Essential
      // o Advantage, publicada. En co-terminación la licencia va por modelo y la página de
      // licencias no la publica: se dice, no se inventa.
      const t = nivel === 'E' ? 'E' : 'A';
      filas.push({ cat: 'Licencias', desc: `Licencia Meraki por suscripción — ${t === 'E' ? 'Essential' : 'Advantage'}`,
        sku: m.licClase ? `${m.licClase}-${t}` : null, qty: 1, unit: null,
        nota: `Una por equipo, de la clase ${m.licClase || '(no consta)'}; término ${anios} año(s): precio en CCW. Si la organización está en co-terminación, la licencia va por modelo (patrón LIC-MX67-SEC-3YR, de CCW) y se confirma la del modelo.` });
      if (nivel === 'P') {
        avisos.push('En suscripción no hay nivel por encima de Advantage: se propone Advantage.');
        // SD-WAN+ en co-terminación: Advanced Security más la ampliación por dispositivo de su
        // grupo (términos de 1, 3 y 5 años). Sin grupo o con otro término, la referencia no consta.
        const ref = m.sdwPlus && [1, 3, 5].includes(anios) ? `LIC-MX-SDW-${m.sdwPlus}-${anios}Y` : null;
        avisos.push(ref
          ? `En co-terminación, SD-WAN+ es Advanced Security más la ampliación por dispositivo ${ref}; en la suscripción por dispositivo esa ampliación no existe.`
          : 'En co-terminación, la página de licencias de Meraki no da la ampliación SD-WAN+ por dispositivo de este modelo con este término: confirmar en CCW.');
      }
      if (o.seguridad === 'onbox' && nivel === 'E') avisos.push('En suscripción, Essential ya trae IDS/IPS, filtrado y AMP; en co-terminación, inspeccionar en el MX pide Advanced Security (Enterprise no lo incluye).');
    } else if (!DNA) {
      const letra = nivel;
      const nom = { E: 'Essentials', A: 'Advantage', P: 'Premier' }[letra];
      filas.push({ cat: 'Licencias', desc: `Cisco DNA ${nom}`, sku: `DNA-C-T<n>-${letra}-${anios}Y`, qty: 1, unit: null,
        nota: `Término ${anios} año(s). El tier de ancho de banda se confirma en CCW según el caudal.` });
    } else {
      let letra = nivel;
      if (letra === 'P') { letra = 'A'; avisos.push('DNA Premier está discontinuado (FAQ de las suscripciones DNA): se propone Advantage.'); }
      if (letra === 'E' && DNA.soloAdvantage.some((p) => m.id.startsWith(p))) {
        letra = 'A';
        avisos.push(`${/^ASR/.test(m.id) ? 'El ASR 1000' : 'El Catalyst 8500'} solo admite DNA Advantage (FAQ de las suscripciones DNA): se propone Advantage.`);
      }
      const vpns = Math.floor(num(o.vpns));
      if (letra === 'E' && vpns > DNA.vpnsEssentials) {
        letra = 'A';
        avisos.push(`DNA Essentials admite ${DNA.vpnsEssentials} VPN de usuario (más la de gestión) y el escenario pide ${vpns}: la segmentación sin límite es de Advantage, que se propone.`);
      }
      const plazo = DNA.terminos.includes(anios) ? anios : DNA.terminos[0];
      if (plazo !== anios) avisos.push(`Las suscripciones DNA son de ${DNA.terminos.slice(0, -1).join(', ')} o ${DNA.terminos[DNA.terminos.length - 1]} años: se propone ${plazo}.`);
      const tr = o.trafico || { wan: 0, cifrado: 0 };
      const sdwan = o.gestion !== 'autonomo';
      const cuenta = sdwan ? tr.wan : tr.cifrado;
      const { tier, tope, lista } = tierDna(m, cuenta, DNA);
      const porque = sdwan
        ? `todo el tráfico WAN, ${fmt(cuenta)} sumando los dos sentidos`
        : cuenta > 0 ? `el tráfico cifrado, ${fmt(cuenta)} sumando los dos sentidos` : 'sin cifrado, el tier más bajo ya libera todo el reenvío';
      filas.push({ cat: 'Licencias', desc: `Cisco DNA ${letra === 'E' ? 'Essentials' : 'Advantage'} — ${tier.t}`, sku: `DNA-C-${tier.t}-${letra}-${plazo}Y`, qty: 1, unit: null,
        nota: `Tier ${tier.t} (hasta ${fmt(tier.nominal)} nominales, ${fmt(tier.agregado)} agregados) por ${porque}. Término ${plazo} años; precio en CCW.` });
      if (tope && cuenta > tier.agregado) avisos.push(`El tráfico (${fmt(cuenta)}) pasa del tier ${tier.t}, el más alto de esta plataforma: la plataforma se queda corta.`);
      else if (sdwan && tr.conMargen > tier.agregado) {
        const sig = lista.find((x) => x.agregado >= tr.conMargen);
        if (sig) avisos.push(`Con el margen de crecimiento (${fmt(tr.conMargen)}) haría falta el ${sig.t}: el tier se puede subir a mitad del plazo (FAQ de DNA).`);
      }
      const voz = (o.modulos || []).filter((x) => x && x.voz).map((x) => x.sku);
      if (voz.length && letra === 'E') avisos.push(`La guía de pedido pide DNA Advantage para los módulos de voz (tabla 9), y el BOM lleva ${voz.join(', ')}.`);
      // HSEC: incluida con la suscripción en los 8200/8300; en el ISR, por encima del límite de VPERF.
      const H = DNA.hsecCatalyst;
      if (H && H.familias.some((f) => m.id.startsWith(f))) filas.push({ cat: 'Licencias', desc: H.n, sku: H.sku, qty: 1, unit: 0, nota: H.d, incluida: true });
      else if (m.ser !== 'ISR 1000') avisos.push(`HSEC: la guía de pedido de los Catalyst 8300/8200 la incluye con DNA; para el ${m.id} las fuentes del catálogo no la nombran: confirmar en CCW si hace falta cifrado completo.`);
      if (m.ser === 'ISR 1000' && DNA.isr) {
        const cuatro = /-4P$/.test(m.id);
        const limite = cuatro ? DNA.isr.vperf4P : DNA.isr.vperf8P;
        if (tr.cifrado > limite) {
          filas.push({ cat: 'Licencias', desc: 'Licencia HSEC (IPsec sin límite)', sku: cuatro ? DNA.isr.hsec4P : DNA.isr.hsec8P, qty: 1, unit: null,
            nota: `El tráfico cifrado (${fmt(tr.cifrado)}) pasa de los ${limite} Mbps de la licencia VPERF; HSEC quita el límite (ficha del ISR 1000, tabla 41).` });
        } else if (tr.cifrado > 0) {
          avisos.push(`Con ${fmt(tr.cifrado)} cifrados basta la licencia de rendimiento VPERF (hasta ${limite} Mbps; SEC sola da ${DNA.isr.sec}): ver la tabla 41 de la ficha del ISR 1000.`);
        }
      }
      if (!sdwan) {
        const re = (DNA.routingEssentials || []).find((x) => m.id.startsWith(x.familia));
        if (re) avisos.push(`En modo autónomo hay otra opción: Catalyst Routing Essentials (${re.sku}), 7 años y sin tier de ancho de banda, con firewall de aplicaciones e IPsec punto a punto con HSEC; no incluye SD-WAN, y la guía no le cita IPS ni filtrado de URL.`);
      }
    }
    return { filas, avisos };
  }

  // NAT de origen con asignación por bloques de puertos (PBA). Prefijo: el menor que contiene
  // las direcciones necesarias.
  function poolCgnat(p) {
    const usuarios = Math.floor(num(p.usuarios));
    const bloque = Math.floor(num(p.bloque, 1)) || 1;
    if (!usuarios || bloque > PUERTOS_UTILES) return null;
    const porIp = Math.floor(PUERTOS_UTILES / bloque);
    const ips = Math.ceil(usuarios / porIp);
    const prefijo = 32 - Math.ceil(Math.log2(ips));
    return { usuarios, bloque, porIp, ips, prefijo, enPrefijo: 2 ** (32 - prefijo) };
  }

  // Memoria técnica en Markdown: escenario, memoria de cálculo con los supuestos rotulados, el
  // equipo con sus cifras y bases, la utilización, lo apartado y el BOM.
  function memoria(ev, ctx) {
    const c = ctx || {};
    const d = ev.demanda;
    const f = c.fila || ev.candidatos[0] || null;
    const L = [];
    L.push(`# Memoria técnica — dimensionamiento Cisco${f ? ` · ${f.m.id}` : ''}`, '');
    L.push(`Fecha: ${c.fecha || '—'} · Plataforma: ${ev.plataforma.n}`, '');
    L.push('## Escenario', '');
    L.push(`- Modo: ${{ link: 'enlace de una sede', agg: 'agregado multi-sede', hub: 'hub / datacenter' }[d.modo]}`);
    if (ev.ha) L.push(`- Sede con dos routers: cada uno dimensionado para todo el tráfico (si uno cae, el otro lleva la sede; guía de diseño de Catalyst SD-WAN)${ev.ha.tloc ? ', con extensión TLOC: los enlaces alternados y una interfaz entre los dos' : ', los dos a todos los transportes'}`);
    L.push(`- Caudal declarado: ${fmt(d.bw)}${d.dir === 2 ? ' por sentido' : ' total'}${d.modo === 'agg' ? ` · ${d.sedes} sede(s) al ${Math.round(d.conc * 100)} %` : ''}`);
    L.push(`- Perfil del overlay: ${(PERFILES[c.perfil] || PERFILES.sdwan).n}`);
    L.push(`- Salida local a Internet: ${Math.round(d.dia * 100)} % · seguridad: ${ev.seguridad.n}`);
    L.push('', '## Memoria de cálculo', '');
    for (const p of d.pasos) L.push(`- ${p.n}: **${fmt(p.v)}**`);
    L.push('', `Demanda de diseño: overlay **${fmt(d.overlayNeed)}**${d.diaNeed ? ` + salida local **${fmt(d.diaNeed)}**` : ''}.`);
    L.push('', '### Supuestos de diseño (no son cifras de Cisco)', '');
    L.push('- Las dos capas comparten el equipo: la utilización es la suma de sus fracciones y no pasa del 100 %.');
    if (d.fec) L.push(`- FEC: +${Math.round(d.fec * 100)} % sobre el overlay.`);
    if (d.dup) L.push(`- Duplicación de paquetes: el ${Math.round(d.dup * 100)} % del overlay viaja dos veces.`);
    L.push(`- Margen de crecimiento: +${Math.round(d.head * 100)} %.`);
    if (ev.topo) {
      const t = ev.topo;
      L.push(`- Túneles por topología (${t.topologia === 'malla' ? 'malla completa' : 'hub y radios'}, el equipo como ${t.rol}${t.ven ? '' : ', cada transporte solo con el suyo'}): ${t.pasos.map((x) => `${x.n} = ${miles(x.v)}`).join('; ')}; total **${miles(t.total)}**${ev.tunelesManual ? ' (manda la cifra escrita a mano)' : ''}.`);
    }
    if (f) {
      L.push('', `## Equipo propuesto: ${f.m.id}`, '');
      L.push(`${f.m.fam || ''} · Serie ${f.m.ser}`, '');
      L.push('| Cifra | Valor | Base de medida |', '|---|---:|---|');
      for (const k of ['fwd', 'ipsec', 'sdwan', 'amenazas']) {
        const x = cifra(f.m, k);
        L.push(`| ${x.n} | ${x.v == null ? 'sin dato' : fmt(x.v)} | ${x.base || 'no consta'} |`);
      }
      if (f.u != null) L.push('', `Utilización con esta demanda: **${Math.round(f.u * 100)} %** (overlay contra ${f.co.n}${f.cd ? `, salida local contra ${f.cd.n}` : ''}).`);
      if (f.avisos.length) { L.push('', '### Avisos', ''); for (const a of f.avisos) L.push(`- ${a}`); }
      if (f.m.datasheet) L.push('', `Ficha oficial: ${f.m.datasheet}`);
    } else {
      L.push('', '## Sin equipo', '', 'Ningún equipo de la plataforma cumple el escenario.');
    }
    if (ev.enlaces && ev.enlaces.length) {
      L.push('', '## Enlaces WAN y puertos', '');
      const en = f && f.enlaces;
      for (const x of ev.enlaces) {
        const a = en ? en.asignados.find((y) => y.enlace === x.n) : null;
        const s = en ? en.sinAsignar.find((y) => y.enlace === x.n) : null;
        const optica = a && a.alcance ? (a.alcance.elegida ? `, óptica ${a.alcance.elegida.bom || a.alcance.elegida.sku}` : a.alcance.noLlega ? `, ${motivoOptica(a)}` : '') : '';
        const tramo = x.fibra && x.km ? `, ${fmtKm(x.km)} en ${FIBRAS[x.fibra]}` : x.e && x.e.medio === 'cobre' && x.km ? `, tramo de ${fmtKm(x.km)}` : '';
        const destino = x.tipo === 'celular' ? 'módem celular (integrado o PIM)' : a ? `${rotuloPuerto(a)}${optica}` : s ? s.motivo : 'sin comprobar';
        L.push(`- Enlace ${x.n}: ${TIPOS_ENLACE[x.tipo]}, ${ROLES_ENLACE[x.rol].toLowerCase()}${x.e ? `, ${x.e.n}` : ''}${tramo} → ${destino}`);
      }
    }
    const res = resumenApartados(ev.apartados);
    if (res.length) {
      L.push('', '## Modelos apartados', '');
      for (const g of res) L.push(`- ${g.motivo}: ${g.ids.join(', ')}`);
    }
    if (c.filas && c.filas.length) {
      L.push('', '## Lista de materiales', '', '| Categoría | Descripción | Referencia | Cant. |', '|---|---|---|---:|');
      for (const r of c.filas) L.push(`| ${r.cat} | ${r.desc} | ${r.sku || 'consultar'} | ${r.qty} |`);
    }
    L.push('', '---', 'Preselección de preventa con las cifras publicadas por Cisco; no es una cotización. Confirmar referencias y precios en CCW.');
    return L.join('\n') + '\n';
  }

  return {
    PLATAFORMAS, PERFILES, SEGURIDAD, PUERTOS_UTILES,
    TIPOS_ENLACE, ROLES_ENLACE, ENTREGAS, FIBRAS, MAX_ENLACES, elegirOptica, motivoOptica, fmtKm, secureAccess, firewallDedicado, piezasFirewall, pimsCelular, controladoresSdwan,
    fmt, cifra, capaOverlay, demanda, requisitos, escala, tunelesTopologia, evaluar,
    enlacesValidos, requisitosConEnlaces, modulosEquipo, asignarEnlaces, repartoHa, motivoCombinacion, piezasEnlaces, rotuloPuerto, enlacesFrenteCaudal, resumenApartados, licencias, traficoLicencia, tierDna, poolCgnat, memoria,
  };
});
