#!/usr/bin/env node
'use strict';
// Contrasta una edicion del Fortinet Product Matrix contra el catalogo, celda a celda.
//
// POR QUE EXISTE
// El vigia avisa de que el PDF cambio, pero no dice QUE cambio. Hasta el 2026-10-13 la revision
// era leer el documento a ojo, y una edicion nueva se podia dar por buena sin ver que el 400G
// habia pasado de 10.000 a 30.000 politicas. Este comando hace esa lectura por programa:
//
//     npm run matrix -- Fortinet_Product_Matrix.pdf          informe legible
//     npm run matrix -- Fortinet_Product_Matrix.pdf --json   el mismo informe como JSON
//
// SOLO COMPARA. NUNCA ESCRIBE en legacyData/. Lo que difiere se corrige a mano (con su
// comentario y la edicion de la que sale) y se marca revisado con
// `npm run vigia -- --revisado fortinet <url>`. Extraer una tabla de un PDF y volcarla sola al
// catalogo es justo donde se cuela una fila desplazada; comparar no tiene ese riesgo, porque una
// celda mal asignada sale como diferencia y la mira una persona.
//
// COMO LEE EL PDF
// No usa la maquetacion en texto (`pdftotext -layout`), que parte las celdas y mezcla las
// llamadas de nota con las cifras. Lee cada trozo de texto con su POSICION (pdf-parse, que el
// repositorio ya tiene) y:
//   - las cabeceras de modelo («FG/FWF-30G», «FG-3800G») fijan las columnas por su centro;
//   - la etiqueta de la izquierda fija la fila; una linea que empieza por «(» continua la de
//     arriba y no es fila;
//   - cada cifra va a la columna mas cercana y a la fila mas cercana por altura, asi que «Gbps»
//     en la linea de abajo se une a su cifra;
//   - las llamadas de nota (1, 2, 4, 11...) van en letra mas pequena y se descartan por tamano,
//     no por parecer un numero: «200» tuneles y la nota «11» se distinguen por la letra.
// Las paginas de FortiManager, FortiAnalyzer y maquinas virtuales no tienen cabeceras FG y no
// se leen.
//
// QUE COMPARA
// Rendimiento (fw, vpn, ips, ngfw, tp, ssl), sesiones y cps, los siete limites (tuneles,
// SSL-VPN, politicas, VDOM) y la plataforma (VDOM incluidos, FortiAP, FortiSwitch, FortiToken,
// disco, fuentes, formato y variantes), contra el catalogo YA CARGADO (`MODELS` y
// `MATRIX_PLATAFORMA`), que es lo que sirve la aplicacion. No compara «Interfaces» (texto libre
// en varias lineas; los puertos estructurados se transcribieron a mano en `PUERTOS`), la
// latencia ni Application Control (el catalogo no los usa). Avisa tambien de los modelos que
// la edicion anade o quita respecto de `MATRIX_LIMITES`.
//
// DESDE EL VIGIA (2026-10-14). El job `contrastar` de vigia-fuentes.yml lo corre solo cuando el
// lock que acaba de medir deja el Product Matrix pendiente de revisar:
//
//     node scripts/contrastar-matrix.js --pendiente <fuentes.lock.json>   url= y hash= si esta pendiente
//     node scripts/contrastar-matrix.js --pendiente <lock> --forzar     tambien si no lo esta (a demanda)
//     node scripts/contrastar-matrix.js --url <url> --hash-esperado <hex> --json
//
// `--url` solo acepta la URL que `fuentes.js` declara para el Product Matrix (no un documento
// cualquiera) y dice si el PDF bajado es el mismo que midio el vigia: si Fortinet lo cambio entre
// las dos descargas, el informe lo avisa en vez de atribuir el contraste a otra edicion.
//
// CODIGO DE SALIDA: 0 si todo casa; 1 si hay diferencias, celdas sin leer o cambios de modelos;
// 2 si no se pudo leer el documento (descarga, firma, URL).
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const HEX64 = /^[0-9a-f]{64}$/;
const TIEMPO_LIMITE = 60000;

const FILAS = [
  ['fw', /^Firewall Throughput/], ['vpn', /^IPsec VPN Throughput/], ['ips', /^IPS Throughput/],
  ['ngfw', /^NGFW Throughput/], ['tp', /^Threat Protection Throughput/],
  ['sess', /^Concurrent Sessions/], ['cps', /^New Sessions\/Sec/], ['policies', /^Firewall Policies/],
  ['tunGw', /^Max G\/W to G\/W IPSEC Tunnels/i], ['tunCli', /^Max Client to G\/W IPSEC Tunnels/i],
  ['sslVpn', /^SSL VPN Throughput/], ['sslVpnUsers', /^Concurrent SSL VPN Users/],
  ['ssl', /^SSL Inspection Throughput/], ['aps', /^Max FortiAPs/], ['switches', /^Max FortiSwitches/],
  ['tokens', /^Max FortiTokens/], ['vdom', /^Virtual Domains/], ['almacen', /^Local Storage/],
  ['fuentes', /^Power Supplies/], ['formato', /^Form Factor/], ['variantes', /^Variants/],
];
const CABECERA = /^FG(?:\/FWF)?-(\d+[A-Z])\b/;
// Tamano de letra (alto del trozo) por debajo del cual un trozo es una llamada de nota.
const NOTA_MAX = 20;
// Un titulo de seccion o una cabecera de otro producto cierra el bloque de FortiGate.
const TITULO_MIN = 45;

/* Paginas como listas de trozos {s, x, y, w, h}. y crece hacia arriba (coordenadas del PDF). */
async function leerPaginas(buffer) {
  const pdf = require('pdf-parse');
  const paginas = [];
  await pdf(buffer, {
    pagerender: (pg) => pg.getTextContent().then((tc) => {
      paginas.push(tc.items.filter((it) => it.str.trim()).map((it) => ({
        s: it.str.trim(), x: it.transform[4], y: it.transform[5], w: it.width, h: it.height,
      })));
      return '';
    }),
  });
  return paginas;
}

/* Celdas {id, campo, texto} de todas las paginas, y la edicion si el pie la trae. */
function celdasDe(paginas) {
  const celdas = [];
  let edicion = null;
  for (const trozos of paginas) {
    for (const t of trozos) { const m = t.s.match(/\bPROMTX-\d{4}-R\d+-[A-Z]{3}\b/); if (m) edicion = m[0]; }
    const cabeceras = trozos.filter((t) => CABECERA.test(t.s));
    const lineasCab = [...new Set(cabeceras.map((t) => Math.round(t.y)))].sort((a, b) => b - a);
    for (const yCab of lineasCab) {
      const cols = cabeceras.filter((t) => Math.round(t.y) === yCab)
        .map((t) => ({ id: t.s.match(CABECERA)[1], c: t.x + t.w / 2 })).sort((a, b) => a.c - b.c);
      const borde = cols[0].c - (cols.length > 1 ? (cols[1].c - cols[0].c) / 2 : 60);
      // El bloque acaba en el siguiente titulo o cabecera por debajo.
      const fin = Math.max(-Infinity, ...trozos.filter((t) => t.y < yCab - 2 && t.h >= TITULO_MIN).map((t) => t.y));
      const enBloque = trozos.filter((t) => t.y < yCab - 2 && t.y > fin && t.h > NOTA_MAX);
      // La etiqueta EMPIEZA en el margen izquierdo (puede ser larga); la cifra tiene el CENTRO
      // dentro de la zona de columnas.
      const etiquetas = enBloque.filter((t) => t.x < borde - 30 && !t.s.startsWith('('));
      const valores = enBloque.filter((t) => t.x >= borde - 30 && t.x + t.w / 2 >= borde);
      const porCelda = new Map();
      for (const v of valores) {
        const centro = v.x + v.w / 2;
        const col = cols.reduce((a, c) => (Math.abs(c.c - centro) < Math.abs(a.c - centro) ? c : a));
        const fila = etiquetas.reduce((a, e) => (Math.abs(e.y - v.y) < Math.abs(a.y - v.y) ? e : a), etiquetas[0]);
        if (!fila) continue;
        const clave = `${col.id}|${fila.y}`;
        if (!porCelda.has(clave)) porCelda.set(clave, { id: col.id, etiqueta: fila.s, trozos: [] });
        porCelda.get(clave).trozos.push(v);
      }
      for (const c of porCelda.values()) {
        const def = FILAS.find(([, re]) => re.test(c.etiqueta));
        if (!def) continue;
        const texto = c.trozos.sort((a, b) => b.y - a.y || a.x - b.x).map((t) => t.s).join(' ').replace(/\s+/g, ' ').trim();
        celdas.push({ id: c.id, campo: def[0], texto });
      }
      // Una fila conocida sin ninguna cifra en una columna es una celda sin leer, no un «—».
      for (const [campo, re] of FILAS) {
        if (!etiquetas.some((e) => re.test(e.s))) continue;
        for (const col of cols) {
          if (!celdas.some((x) => x.id === col.id && x.campo === campo)) celdas.push({ id: col.id, campo, texto: '' });
        }
      }
    }
  }
  return { celdas, edicion };
}

const entero = (x) => Number(String(x).replace(/[\s,]/g, ''));

/* El texto de una celda en la unidad del catalogo. undefined = no se pudo leer; null = «—». */
function valorDe(texto, campo) {
  const t = (texto || '').replace(/\s+/g, ' ').trim();
  if (!t) return undefined;
  if (/^[—–-]+$/.test(t)) return null;
  if (campo === 'fuentes' || campo === 'formato') return t;
  if (campo === 'variantes') return t.split(/\s*,\s*/).filter(Boolean);
  if (campo === 'almacen') {
    const m = t.match(/^(?:(\d+)\s*x\s*)?([\d.]+)\s*(GB|TB)(?:\s+SSD)?(?:\s*\((\w+)\))?$/i);
    if (!m) return undefined;
    const gb = Math.round((m[1] ? Number(m[1]) : 1) * parseFloat(m[2]) * (/TB/i.test(m[3]) ? 1000 : 1));
    return { variante: m[4] || null, gb };
  }
  if (campo === 'aps' || campo === 'vdom') {
    const m = t.match(/^(\d[\d ,]*?)\s*\/\s*(\d[\d ,]*)$/);
    return m ? [entero(m[1]), entero(m[2])] : undefined;
  }
  if (campo === 'fw') {
    const m = t.match(/^([\d.]+)\s*\/\s*[\d.]+\s*\/\s*[\d.]+\s*(Gbps|Tbps)?$/);
    if (!m) return undefined;
    return Math.round(parseFloat(m[1]) * (m[2] === 'Tbps' ? 1e6 : 1000));
  }
  // «12 Million / 40 Million»: la segunda cifra es con la licencia Hyperscale; vale la primera.
  const base = t.split(/\s+\/\s+/)[0].trim();
  let m = base.match(/^([\d.]+)\s*(M[il]+ion|Billion)$/i);
  if (m) return Math.round(parseFloat(m[1]) * (/^B/i.test(m[2]) ? 1e9 : 1e6));
  m = base.match(/^([\d.]+)\s*(Gbps|Mbps)$/);
  if (m) return Math.round(parseFloat(m[1]) * (m[2] === 'Gbps' ? 1000 : 1));
  m = base.match(/^(\d{1,3}(?:[ ,]\d{3})+|\d+)$/);
  if (m) return entero(m[1]);
  return undefined;
}

/* Compara las celdas con el catalogo cargado. Devuelve el informe; no toca nada. */
function contrastar(celdas, catalogo) {
  const { MODELS, MATRIX_PLATAFORMA, MATRIX_LIMITES } = catalogo;
  const modelo = (id) => MODELS.find((m) => m.id === `FortiGate ${id}`);
  const out = { coinciden: 0, difieren: [], sinLeer: [], noEnCatalogo: [], nuevos: [], faltan: [] };
  const igual = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
  for (const c of celdas) {
    const m = modelo(c.id);
    if (!m) { if (!out.noEnCatalogo.includes(c.id)) out.noEnCatalogo.push(c.id); continue; }
    const v = valorDe(c.texto, c.campo);
    if (v === undefined) { out.sinLeer.push({ id: c.id, campo: c.campo, texto: c.texto }); continue; }
    const pl = MATRIX_PLATAFORMA[c.id] || {};
    let pares;
    if (c.campo === 'aps') pares = [['aps', v && v[0], m.aps], ['apsTun', v && v[1], m.apsTun]];
    else if (c.campo === 'vdom') pares = [['vdomDef', v && v[0], m.vdomDef], ['vdomMax', v && v[1], m.vdomMax]];
    else if (c.campo === 'almacen') {
      // El documento atribuye el disco a la variante («128 GB (61F)»); sin parentesis, al modelo.
      const cat = pl.almacen ? { variante: pl.almacen[0] === c.id ? null : pl.almacen[0], gb: pl.almacen[1] } : null;
      pares = [['almacen', v, cat]];
    } else if (c.campo === 'fuentes' || c.campo === 'formato') pares = [[c.campo, v, pl[c.campo]]];
    else if (c.campo === 'variantes') pares = [['variantes', v || [], pl.variantes || []]];
    else pares = [[c.campo, v, m[c.campo]]];
    for (const [k, doc, cat] of pares) {
      if (igual(doc, cat)) out.coinciden++;
      else out.difieren.push({ id: c.id, campo: k, catalogo: cat ?? null, documento: doc ?? null, texto: c.texto });
    }
  }
  const enDoc = [...new Set(celdas.map((c) => c.id))];
  out.nuevos = enDoc.filter((id) => !MATRIX_LIMITES[id]);
  out.faltan = Object.keys(MATRIX_LIMITES).filter((id) => !enDoc.includes(id));
  return out;
}

const fmt = (v) => (v == null ? '—' : typeof v === 'object' ? JSON.stringify(v) : String(v));

function informe(r, edicion) {
  const L = [`CONTRASTE · Fortinet Product Matrix${edicion ? ` (${edicion})` : ' (edicion no encontrada en el pie)'} contra el catalogo`];
  L.push(`  coinciden ${r.coinciden} · difieren ${r.difieren.length} · sin leer ${r.sinLeer.length}`);
  if (r.nuevos.length) L.push(`  modelos que la edicion anade: ${r.nuevos.join(', ')}`);
  if (r.faltan.length) L.push(`  modelos de MATRIX_LIMITES que la edicion ya no lista: ${r.faltan.join(', ')}`);
  if (r.noEnCatalogo.length) L.push(`  columnas sin modelo en el catalogo: ${r.noEnCatalogo.join(', ')}`);
  for (const d of r.difieren) L.push(`DIF  ${d.id} ${d.campo}: catalogo ${fmt(d.catalogo)} · documento ${fmt(d.documento)} («${d.texto}»)`);
  for (const s of r.sinLeer) L.push(` ?   ${s.id} ${s.campo}: «${s.texto}» — leer a mano`);
  const limpio = !r.difieren.length && !r.sinLeer.length && !r.nuevos.length && !r.faltan.length;
  L.push(limpio ? '\nTodo casa: la edicion no cambia ninguna cifra del catalogo.'
    : '\nNada se ha escrito. Corregir legacyData/fortinet.js a mano con la edicion citada y marcar revisado con npm run vigia -- --revisado fortinet <url>.');
  return { texto: L.join('\n'), limpio };
}

/* La fuente del Product Matrix en `fuentes.js` y su clave en el lock del vigia. */
function fuenteMatrix() {
  const { FUENTES } = require('../server/seed/legacyData/fuentes');
  const f = (FUENTES.fortinet || []).find((x) => /Product Matrix/i.test(x.documento) && x.url);
  if (!f) throw new Error('fuentes.js no declara la URL del Fortinet Product Matrix');
  return { url: f.url, clave: `fortinet::${f.url}` };
}

/* Si el lock deja el Product Matrix pendiente de revisar: {url, hash, desde} o null. La URL sale
   de fuentes.js, no del lock; del lock solo se toma el hash, y solo si es un SHA-256. */
function pendienteDelLock(lock, fuente = fuenteMatrix(), forzar = false) {
  const e = lock && lock.documentos ? lock.documentos[fuente.clave] : null;
  if (!e || (!e.visto && !forzar)) return null;
  // A demanda y sin cambio pendiente, el PDF que se espera es el verificado.
  const crudo = e.visto ? e.visto.hash : e.hashVerificado;
  const hash = typeof crudo === 'string' && HEX64.test(crudo) ? crudo : null;
  const desde = typeof e.pendienteDesde === 'string' && /^\d{4}-\d{2}-\d{2}T[\d:.]+Z$/.test(e.pendienteDesde) ? e.pendienteDesde : null;
  return { url: fuente.url, hash, desde };
}

/* Baja el PDF y comprueba la firma. `traer` se inyecta en las pruebas. */
async function descargar(url, traer = fetch) {
  const control = new AbortController();
  const reloj = setTimeout(() => control.abort(), TIEMPO_LIMITE);
  try {
    const res = await traer(url, { redirect: 'follow', signal: control.signal,
      headers: { 'User-Agent': 'presales-contrastar-matrix/1.0 (+catalogo interno)' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.subarray(0, 4).toString() !== '%PDF') throw new Error(`no es un PDF (firma ${buf.subarray(0, 4).toString('hex')})`);
    return { buf, hash: crypto.createHash('sha256').update(buf).digest('hex') };
  } finally {
    clearTimeout(reloj);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const valor = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : undefined; };
  if (args.includes('--pendiente')) {
    // Salida para $GITHUB_OUTPUT: pendiente=false, o pendiente=true con url= y hash=.
    const p = pendienteDelLock(JSON.parse(fs.readFileSync(valor('--pendiente'), 'utf8')), fuenteMatrix(), args.includes('--forzar'));
    console.log(p ? `pendiente=true\nurl=${p.url}\nhash=${p.hash || ''}` : 'pendiente=false');
    return 0;
  }
  let buf;
  let origen = {};
  const url = valor('--url');
  if (url) {
    if (url !== fuenteMatrix().url) { console.error(`--url solo acepta la del Product Matrix de fuentes.js, no ${url}`); return 2; }
    try {
      const d = await descargar(url);
      buf = d.buf;
      const esperado = valor('--hash-esperado');
      origen = { url, hash: d.hash, hashEsperado: HEX64.test(esperado || '') ? esperado : null };
      origen.mismoDocumento = origen.hashEsperado ? origen.hashEsperado === d.hash : null;
    } catch (e) {
      console.error(`No se pudo bajar el Product Matrix: ${e.message}`);
      return 2;
    }
  } else {
    const archivo = args.find((a) => !a.startsWith('--'));
    if (!archivo) {
      console.error('Uso: npm run matrix -- <Fortinet_Product_Matrix.pdf> [--json]');
      return 2;
    }
    buf = fs.readFileSync(path.resolve(archivo));
    if (buf.subarray(0, 4).toString() !== '%PDF') { console.error(`${archivo} no es un PDF (firma ${buf.subarray(0, 4).toString('hex')}).`); return 2; }
  }
  const catalogo = require('../server/seed/legacyData/fortinet');
  const { celdas, edicion } = celdasDe(await leerPaginas(buf));
  const r = contrastar(celdas, catalogo);
  const { texto, limpio } = informe(r, edicion);
  if (args.includes('--json')) console.log(JSON.stringify({ edicion, ...origen, ...r, limpio }, null, 2));
  else {
    console.log(texto);
    if (origen.mismoDocumento === false) console.log('\nAVISO: el PDF bajado no es el que midio el vigia (Fortinet lo cambio entre las dos descargas).');
  }
  return limpio ? 0 : 1;
}

if (require.main === module) main().then((c) => process.exit(c)).catch((e) => { console.error(e); process.exit(2); });

module.exports = { leerPaginas, celdasDe, valorDe, contrastar, informe, pendienteDelLock, descargar, fuenteMatrix, FILAS };
