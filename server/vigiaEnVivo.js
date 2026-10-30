'use strict';
// EL BOTÓN «ACTUALIZAR FUENTES» (2026-10-29, encargo del dueño: «publicar el botón Actualizar en
// producción», que eligió como «Actualizar fuentes»).
//
// La pestaña «Fuentes y Referencias» enseñaba la Vigilancia de cada documento tal como la dejó el
// vigía del lunes (fuentes.lock.json), y su botón «↻ Actualizar» solo volvía a leer esa misma tabla
// del servidor. Este módulo hace lo que el nombre promete: vuelve a pedir cada documento oficial al
// fabricante y lo compara con lo que una persona ya contrastó, con LA MISMA regla del vigía
// (`revisar`, `conRetirada` y `clasificar` de scripts/vigia-fuentes.js, importadas, no copiadas: dos
// copias de una regla se separan, que es el fallo que `llevarABom` tuvo en seis archivos).
//
// SOLO LEE. No escribe el lock (vive en el repositorio y lo que una persona contrastó solo lo mueve
// `npm run vigia -- --revisado`) ni toca el catálogo. Un documento que cambió sale «cambió · sin
// contrastar», igual que en el issue del vigía; quien lo vea abre el documento.
//
// CON MESURA. Cada comprobación pega contra los servidores del fabricante: un resultado por
// fabricante vale 10 minutos (`VIGENCIA_MS`), dos pulsaciones a la vez comparten la misma corrida, y
// se piden como mucho cuatro documentos a la vez con 20 s por documento. Solo se piden las URL de
// legacyData/fuentes.js, que vienen del repositorio: nada de lo que llega en la petición elige a
// dónde se conecta el servidor.
const vigia = require('../scripts/vigia-fuentes');
const { FUENTES } = require('./seed/legacyData/fuentes');

const VIGENCIA_MS = 10 * 60 * 1000;
const EN_PARALELO = 4;
const TIEMPO_POR_DOCUMENTO = 20000;

const cache = new Map(); // vendor -> { revisadoEn, ms, fuentes }
const enCurso = new Map(); // vendor -> Promise

async function enLotes(items, n, fn) {
  const out = new Array(items.length);
  let i = 0;
  async function trabajador() {
    while (i < items.length) { const k = i++; out[k] = await fn(items[k]); }
  }
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, trabajador));
  return out;
}

// Una fuente, comprobada y clasificada contra el lock. Lo que sale es lo que la pestaña necesita,
// sin el texto ni los hashes completos.
async function comprobar(vendor, f, lock, deps) {
  const base = { vendor, documento: f.documento, url: f.url || null };
  if (!f.url) return { ...base, estado: 'sin-url', detalle: 'fuente interna sin URL pública — se vigila por commit' };
  if (f.sinVigilancia) return { ...base, estado: 'sin-vigilancia', detalle: f.sinVigilancia };
  const r = vigia.conRetirada(await deps.revisar(vendor, f, { tiempoLimite: deps.tiempoLimite }), f);
  r.estable = f.estable !== false;
  const previo = vigia.normalizarEntrada(lock.documentos[vigia.claveDe(vendor, f)]);
  vigia.clasificar(r, previo, deps.ahora());
  return {
    ...base,
    estado: r.estado,
    cambio: r.cambio || null,
    detalle: r.detalle || null,
    pendienteDesde: r.pendienteDesde || null,
    reaparecio: !!r.reaparecio,
    bytes: r.bytes == null ? null : r.bytes,
    tipo: r.tipo || null,
    clase: r.clase || null,
  };
}

// El resultado de un fabricante: de la caché si es reciente, de la corrida en curso si la hay, o
// una corrida nueva. `forzar` no salta la mesura: solo existe para las pruebas.
async function revisarVendor(vendor, opciones) {
  const o = opciones || {};
  const lista = FUENTES[vendor];
  if (!lista) return null;
  const deps = {
    revisar: o.revisar || vigia.revisar,
    leerLock: o.leerLock || vigia.leerLock,
    ahora: o.ahora || (() => new Date().toISOString()),
    reloj: o.reloj || Date.now,
    tiempoLimite: o.tiempoLimite || TIEMPO_POR_DOCUMENTO,
  };
  const previo = cache.get(vendor);
  if (previo && !o.forzar && deps.reloj() - previo.ms < VIGENCIA_MS) return { ...previo, deCache: true };
  if (enCurso.has(vendor)) return enCurso.get(vendor);
  const corrida = (async () => {
    const lock = deps.leerLock();
    const fuentes = await enLotes(lista, EN_PARALELO, (f) => comprobar(vendor, f, lock, deps));
    const res = { vendor, revisadoEn: deps.ahora(), ms: deps.reloj(), fuentes, resumen: resumir(fuentes) };
    cache.set(vendor, res);
    return { ...res, deCache: false };
  })();
  enCurso.set(vendor, corrida);
  try { return await corrida; } finally { enCurso.delete(vendor); }
}

function resumir(fuentes) {
  const c = { sinCambios: 0, cambiaron: 0, varian: 0, primera: 0, inalcanzables: 0, otras: 0 };
  for (const f of fuentes) {
    if (f.cambio === 'sin cambios') c.sinCambios += 1;
    else if (f.cambio === 'CAMBIÓ') c.cambiaron += 1;
    else if (f.cambio === 'varió (página dinámica)') c.varian += 1;
    else if (f.cambio === 'primera medición' || (f.cambio || '').startsWith('nueva línea base')) c.primera += 1;
    else if (f.estado === 'inalcanzable') c.inalcanzables += 1;
    else c.otras += 1;
  }
  return c;
}

function limpiarCache() { cache.clear(); enCurso.clear(); }

module.exports = { revisarVendor, resumir, limpiarCache, VIGENCIA_MS, EN_PARALELO, TIEMPO_POR_DOCUMENTO };
