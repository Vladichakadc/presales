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
      una que la ficha no publica no lo aparta, pero se avisa.
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
      const es = escala(m, p.escala || {});
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
    return { demanda: d, plataforma: plat, seguridad: seg, tlsEnRouter, filas, candidatos, apartados };
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

  // Licencias del equipo elegido. G2: por la clase (S, M, L, XL, 2XL) de la guía de pedido;
  // Catalyst 8000, ISR y ASR: DNA por tier; Meraki: por modelo y término.
  //   o = { gestion: 'sdwan'|'autonomo', nivel: 'E'|'A'|'P', seguridad, url, malware, anios }
  function licencias(m, o, LIC) {
    const anios = Math.max(1, Math.floor(num(o.anios, 1)) || 1);
    const nivel = ['E', 'A', 'P'].includes(o.nivel) ? o.nivel : 'A';
    const filas = [], avisos = [];
    const sku = (plantilla, c) => plantilla.replace('{c}', c);
    if (m.lic === 'cswan') {
      const c = m.clase;
      if (!c) { avisos.push('La clase de esta plataforma no consta: la referencia de licencia sale de CCW.'); return { filas, avisos }; }
      filas.push({ cat: 'Licencias', desc: LIC.osE.n, sku: sku(LIC.osE.sku, c), qty: 1, unit: 0, nota: LIC.osE.d, incluida: true });
      const nv = nivel === 'P' ? 'A' : nivel;
      if (nivel === 'P') avisos.push('La G2 no tiene un nivel Premier: se propone Advantage.');
      if (o.gestion === 'autonomo') {
        if (nv === 'A') filas.push({ cat: 'Licencias', desc: LIC.rosA.n, sku: sku(LIC.rosA.sku, c), qty: 1, unit: null, nota: `${LIC.rosA.d} Término ${anios} año(s): precio en CCW.` });
      } else {
        const L = nv === 'E' ? LIC.cswanE : LIC.cswanA;
        filas.push({ cat: 'Licencias', desc: L.n, sku: sku(L.sku, c), qty: 1, unit: null, nota: `${L.d} Término ${anios} año(s): precio en CCW.` });
      }
      if (o.seguridad === 'onbox') {
        if (c === '2XL') avisos.push('La clase 2XL (8600) no tiene licencias de seguridad LIC-SEC: la inspección va desacoplada o en la nube.');
        else {
          filas.push({ cat: 'Licencias', desc: LIC.secT.n, sku: sku(LIC.secT.sku, c), qty: 1, unit: null, nota: LIC.secT.d });
          if (o.url) filas.push({ cat: 'Licencias', desc: LIC.secC.n, sku: sku(LIC.secC.sku, c), qty: 1, unit: null, nota: LIC.secC.d });
          if (o.malware) filas.push({ cat: 'Licencias', desc: LIC.secM.n, sku: sku(LIC.secM.sku, c), qty: 1, unit: null, nota: LIC.secM.d });
        }
      }
    } else if (m.lic === 'meraki') {
      const nom = { E: 'Enterprise', A: 'Advanced Security', P: 'Secure SD-WAN Plus' }[nivel];
      filas.push({ cat: 'Licencias', desc: `Licencia Meraki MX ${nom}`, sku: null, qty: 1, unit: null,
        nota: `Una por equipo, por modelo y término (${anios} año(s)); la referencia sigue el patrón de LIC-MX67-SEC-3YR, confirmado en CCW: confirmar la del modelo.` });
      if (o.seguridad === 'onbox' && nivel === 'E') avisos.push('Inspeccionar en el MX (IDS/IPS, filtrado, malware) pide Advanced Security o superior: Enterprise no lo incluye.');
    } else {
      const letra = nivel;
      const nom = { E: 'Essentials', A: 'Advantage', P: 'Premier' }[letra];
      filas.push({ cat: 'Licencias', desc: `Cisco DNA ${nom}`, sku: `DNA-C-T<n>-${letra}-${anios}Y`, qty: 1, unit: null,
        nota: `Término ${anios} año(s). El tier de ancho de banda (T0-T3+) se confirma en CCW según el caudal.` });
      if (letra === 'E' && /8500/.test(m.id)) avisos.push('Catalyst 8500 no admite DNA Essentials: requiere Advantage como mínimo.');
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
    fmt, cifra, capaOverlay, demanda, requisitos, escala, evaluar, resumenApartados, licencias, poolCgnat, memoria,
  };
});
