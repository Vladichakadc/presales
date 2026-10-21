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
      d: 'El router enruta y un firewall aparte inspecciona: el firewall se dimensiona en su propio dimensionador.' },
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
      else if (m.pim) piezas.push({ cat: 'Módulos', desc: 'Módulo celular (PIM) — elegir uno', sku: null, pim: true });
      else motivos.push('sin celular integrado ni ranura PIM');
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
      const rq = requisitos(m, p.requisitos || {});
      motivos.push(...es.motivos, ...rq.motivos);
      avisos.push(...es.avisos, ...rq.avisos);
      if (co.cae) avisos.push('Sin cifra SD-WAN propia: se dimensiona con su IPsec, que no incluye DPI ni FNF.');
      if (/1\.400 B/.test(co.base || '')) avisos.push(`Su cifra de ${co.n} está medida con paquetes de 1.400 B: con tráfico real (IMIX) rinde menos.`);
      if (esMeraki(m) && d.total > 0) avisos.push('Meraki no publica el tamaño de paquete de sus cifras.');
      return { m, ok: !motivos.length, motivos, avisos, co, cd, u, capEq, piezas: rq.piezas };
    });
    const candidatos = filas.filter((f) => f.ok).sort((a, b) => a.capEq - b.capEq);
    const apartados = filas.filter((f) => !f.ok);
    return { demanda: d, plataforma: plat, seguridad: seg, tlsEnRouter, filas, candidatos, apartados, topo, tunelesManual: num((p.escala || {}).tuneles) > 0 };
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
    fmt, cifra, capaOverlay, demanda, requisitos, escala, tunelesTopologia, evaluar, resumenApartados, licencias, traficoLicencia, tierDna, poolCgnat, memoria,
  };
});
