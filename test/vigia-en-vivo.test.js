'use strict';
// EL BOTÓN «ACTUALIZAR FUENTES» (2026-10-29, encargo del dueño). server/vigiaEnVivo.js vuelve a leer
// cada documento oficial y lo clasifica contra lo que una persona contrastó, con la regla del vigía.
// Sin red: `revisar`, el lock y el reloj se inyectan.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const enVivo = require('../server/vigiaEnVivo');
const vigia = require('../scripts/vigia-fuentes');
const { FUENTES } = require('../server/seed/legacyData/fuentes');

const leer = (r) => fs.readFileSync(path.join(__dirname, '..', r), 'utf8');
// Un fabricante con varias fuentes con URL, para tener de todo.
const VENDOR = Object.keys(FUENTES).find((v) => FUENTES[v].filter((f) => f.url && !f.sinVigilancia).length >= 3);
const conUrl = FUENTES[VENDOR].filter((f) => f.url && !f.sinVigilancia);

function lockCon(entradas) {
  const documentos = {};
  for (const [f, e] of entradas) documentos[vigia.claveDe(VENDOR, f)] = e;
  return { documentos };
}

test('clasifica cada documento con la regla del vigía: sin cambios, cambió sin contrastar, inalcanzable', async () => {
  enVivo.limpiarCache();
  const [a, b, c] = conUrl;
  const lock = lockCon([[a, { hashVerificado: 'H-A', clase: 'texto' }], [b, { hashVerificado: 'H-B', clase: 'texto', pendienteDesde: '2026-10-19T00:00:00Z' }]]);
  const revisar = async (vendor, f, opts) => {
    assert.strictEqual(opts.tiempoLimite, enVivo.TIEMPO_POR_DOCUMENTO, 'la persona que espera pide menos tiempo que el vigía semanal');
    if (f === a) return { vendor, documento: f.documento, url: f.url, estado: 'leido', hashVigilado: 'H-A', clase: 'texto', bytes: 10 };
    if (f === b) return { vendor, documento: f.documento, url: f.url, estado: 'leido', hashVigilado: 'OTRO', clase: 'texto', bytes: 10 };
    if (f === c) return { vendor, documento: f.documento, url: f.url, estado: 'inalcanzable', detalle: 'HTTP 403' };
    return { vendor, documento: f.documento, url: f.url, estado: 'inalcanzable', detalle: 'no se pidió' };
  };
  const r = await enVivo.revisarVendor(VENDOR, { revisar, leerLock: () => lock, forzar: true });
  const de = (f) => r.fuentes.find((x) => x.url === f.url);
  assert.strictEqual(de(a).cambio, 'sin cambios');
  const cambio = de(b).cambio;
  // Una fuente estable que difiere es CAMBIÓ, con la fecha ORIGINAL; una dinámica, «varió».
  if (b.estable === false) assert.strictEqual(cambio, 'varió (página dinámica)');
  else { assert.strictEqual(cambio, 'CAMBIÓ'); assert.strictEqual(de(b).pendienteDesde, '2026-10-19T00:00:00Z'); }
  assert.strictEqual(de(c).estado, c.retirada ? 'retirada' : 'inalcanzable');
  assert.match(de(c).detalle, /HTTP 403/);
  assert.strictEqual(r.fuentes.length, FUENTES[VENDOR].length, 'una fila por fuente declarada');
  assert.ok(r.resumen.sinCambios >= 1);
  // Lo que sale no lleva el texto ni el hash del documento: la pestaña no los necesita.
  assert.ok(r.fuentes.every((f) => !('texto' in f) && !('hashVigilado' in f)));
});

test('las fuentes sin URL o sin vigilancia no se piden a la red', async () => {
  enVivo.limpiarCache();
  const pedidas = [];
  const revisar = async (vendor, f) => { pedidas.push(f.url); return { vendor, documento: f.documento, url: f.url, estado: 'inalcanzable', detalle: 'x' }; };
  const v = Object.keys(FUENTES).find((k) => FUENTES[k].some((f) => !f.url || f.sinVigilancia));
  const r = await enVivo.revisarVendor(v, { revisar, leerLock: () => ({ documentos: {} }), forzar: true });
  for (const f of FUENTES[v]) {
    const fila = r.fuentes.find((x) => x.documento === f.documento && x.url === (f.url || null));
    if (!f.url) { assert.strictEqual(fila.estado, 'sin-url'); assert.ok(!pedidas.includes(f.url)); }
    else if (f.sinVigilancia) { assert.strictEqual(fila.estado, 'sin-vigilancia'); assert.ok(!pedidas.includes(f.url)); }
  }
});

test('con mesura: 10 minutos de caché, una sola corrida a la vez y como mucho cuatro descargas', async () => {
  enVivo.limpiarCache();
  let llamadas = 0;
  let enVuelo = 0;
  let pico = 0;
  let t = 1_000_000;
  const revisar = async (vendor, f) => {
    llamadas += 1; enVuelo += 1; pico = Math.max(pico, enVuelo);
    await new Promise((r) => { setTimeout(r, 5); });
    enVuelo -= 1;
    return { vendor, documento: f.documento, url: f.url, estado: 'inalcanzable', detalle: 'x' };
  };
  const o = { revisar, leerLock: () => ({ documentos: {} }), reloj: () => t };
  const [r1, r2] = await Promise.all([enVivo.revisarVendor(VENDOR, o), enVivo.revisarVendor(VENDOR, o)]);
  assert.strictEqual(llamadas, conUrl.length, 'dos pulsaciones a la vez comparten la corrida');
  assert.ok(pico <= enVivo.EN_PARALELO, `como mucho ${enVivo.EN_PARALELO} a la vez (pico ${pico})`);
  assert.strictEqual(r1.revisadoEn, r2.revisadoEn);
  const r3 = await enVivo.revisarVendor(VENDOR, o);
  assert.strictEqual(r3.deCache, true);
  assert.strictEqual(llamadas, conUrl.length, 'dentro de los 10 minutos no se vuelve a pedir nada');
  t += enVivo.VIGENCIA_MS + 1;
  const r4 = await enVivo.revisarVendor(VENDOR, o);
  assert.strictEqual(r4.deCache, false);
  assert.strictEqual(llamadas, 2 * conUrl.length);
  assert.strictEqual(await enVivo.revisarVendor('no-existe', o), null);
});

test('la ruta y el botón: solo URL de fuentes.js, sin escribir el lock, y el botón dice lo que hace', () => {
  const srv = leer('server/server.js');
  const ruta = srv.slice(srv.indexOf("app.get('/api/fuentes/:vendor/salud'"), srv.indexOf('// Borrar una fuente CARGADA.'));
  assert.match(ruta, /Object\.prototype\.hasOwnProperty\.call\(FUENTES, vendor\)/, 'un fabricante que no está en fuentes.js no corre nada');
  assert.match(ruta, /require\('\.\/vigiaEnVivo'\)\.revisarVendor\(vendor\)/);
  const mod = leer('server/vigiaEnVivo.js');
  assert.doesNotMatch(mod, /guardarLock|aplicarAlLock|writeFile|escribir/, 'solo lee: lo contrastado lo mueve `--revisado`');
  assert.match(mod, /vigia\.clasificar\(r, previo/, 'la regla del vigía, importada');
  const js = leer('public/js/procedencia.js');
  assert.match(js, /&#8635; Actualizar fuentes<\/button>/);
  assert.match(js, /fetch\(`\/api\/fuentes\/\$\{encodeURIComponent\(code\)\}\/salud`\)/);
  assert.match(js, /No cambia el catálogo\./);
  assert.match(js, /Comprobado ahora<\/th>/);
});
