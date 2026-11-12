'use strict';
// LAS RESPUESTAS DEL CATÁLOGO, CACHEADAS UNA VEZ AL DÍA (2026-11-12, server/services/cacheRespuestas.js).
// Se monta en una aplicación Express mínima lo mismo que monta server.js en `/api` (sin el muro de acceso,
// que no es lo que se prueba) y se fija:
//   a. cada ruta cacheada sirve, en la primera y en la segunda petición, exactamente el JSON de una
//      proyección nueva, con el mismo Content-Type que `res.json`;
//   b. cruzar la fecha de un `lastOrder` cambia lo que sirve el cotizador (el día va en la clave);
//   c. `usarModelos()` invalida la caché (vacía la caché);
//   d. una proyección que falla no se guarda;
//   e. todo `lastOrder` es AAAA-MM-DD: el día UTC en la clave solo es exacto si vencen a las 00:00 UTC.
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');

process.env.AUTH_STATE_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'cache-respuestas-'));

const test = require('node:test');
const assert = require('node:assert');
const express = require('express');
const proyeccion = require('../server/services/catalogProjection');
const cache = require('../server/services/cacheRespuestas');
const { catalogo, listo } = require('../server/services/catalogoEnMemoria');

const app = express();
app.use('/api', require('../server/routes/catalog'));
app.use('/api', require('../server/routes/cotizador'));
app.use('/api', require('../server/routes/dimensionador'));
app.use('/api', require('../server/routes/guia'));
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => res.status(500).json({ error: err.message }));

let servidor;
let puerto;
function pedir(ruta) {
  return new Promise((resolve, reject) => {
    http.get({ host: '127.0.0.1', port: puerto, path: ruta }, (res) => {
      const partes = [];
      res.on('data', (c) => partes.push(c));
      res.on('end', () => resolve({ status: res.statusCode, texto: Buffer.concat(partes).toString('utf8'), tipo: res.headers['content-type'] }));
    }).on('error', reject);
  });
}

const ahoraReal = Date.now;
test.before(async () => {
  await listo();
  await new Promise((r) => { servidor = app.listen(0, '127.0.0.1', r); });
  puerto = servidor.address().port;
});
test.after(() => { Date.now = ahoraReal; cache.usarReloj(null); servidor.close(); });
test.beforeEach(() => { Date.now = ahoraReal; cache.usarReloj(null); cache.invalidar(); });

// Lo que `/api/dimensionador/:vendor` añadía a la proyección antes de la caché.
async function dimensionadorFresco(clave, fn, vendor) {
  const datos = await proyeccion[fn]();
  const cicloVida = proyeccion.respaldoCicloVida(vendor);
  return { ...datos, cicloVida, datasetVersion: proyeccion.versionDeCatalogo(clave, { ...datos, cicloVida }) };
}

const RUTAS = [
  ['/api/vendors', () => proyeccion.getVendorsList()],
  ['/api/catalog', () => proyeccion.toIndexPR()],
  ['/api/cotizador/catalog', () => proyeccion.toCotizadorCatalog()],
  ['/api/guia/roles', () => proyeccion.toGuiaRoles()],
  ...[['huawei', 'toDimensionadorHuawei'], ['cisco', 'toDimensionadorCisco'], ['fortinet', 'toDimensionadorFortinet'],
    ['juniper', 'toDimensionadorJuniper'], ['mikrotik', 'toDimensionadorMikrotik'], ['aruba', 'toDimensionadorAruba'],
    ['nokia', 'toDimensionadorNokia'], ['nokia-sr', 'toDimensionadorNokiaRouter']]
    .map(([clave, fn]) => [`/api/dimensionador/${clave}`, () => dimensionadorFresco(clave, fn, clave === 'nokia-sr' ? 'nokia' : clave)]),
];

test('a. cada ruta cacheada sirve el JSON de una proyección nueva, en la primera y en la segunda petición', async () => {
  for (const [ruta, fresca] of RUTAS) {
    const esperado = JSON.stringify(await fresca());
    for (const vez of ['primera', 'segunda']) {
      const r = await pedir(ruta);
      assert.strictEqual(r.status, 200, `${ruta} (${vez})`);
      assert.match(r.tipo, /^application\/json; charset=utf-8$/i, `${ruta} (${vez}): Content-Type`);
      assert.strictEqual(r.texto, esperado, `${ruta} (${vez}): no es lo que da una proyección nueva`);
    }
  }
});

test('a. un fabricante sin dimensionador da 404 y no se cachea', async () => {
  for (const v of ['nadie', 'constructor', '__proto__']) {
    const r = await pedir(`/api/dimensionador/${v}`);
    assert.strictEqual(r.status, 404, v);
  }
});

test('b. cruzar la fecha de un lastOrder cambia lo que sirve el cotizador', async () => {
  // El primer fin de venta anunciado del catálogo que el cotizador ofrece mientras no vence.
  const productos = await catalogo.Product.findAll({});
  const conFecha = productos.map((p) => p.specs && p.specs.eolAnnounced && p.specs.eolAnnounced.lastOrder).filter(Boolean).sort();
  assert.ok(conFecha.length > 0, 'el catálogo no trae ningún lastOrder: la prueba no mide nada');
  const cuerpos = new Set();
  for (const fecha of conFecha) {
    const t = Date.parse(fecha);
    const antes = t - 12 * 3600 * 1000;
    const despues = t + 12 * 3600 * 1000;
    Date.now = () => antes; cache.usarReloj(() => antes);
    const a = (await pedir('/api/cotizador/catalog')).texto;
    Date.now = () => despues; cache.usarReloj(() => despues);
    const d = (await pedir('/api/cotizador/catalog')).texto;
    assert.strictEqual(d, JSON.stringify(await proyeccion.toCotizadorCatalog()), `${fecha}: el día siguiente sirve lo de la víspera`);
    if (a !== d) cuerpos.add(fecha);
  }
  assert.ok(cuerpos.size > 0, 'ningún lastOrder cambia el cotizador: la prueba no mide el vencimiento');
});

test('c. usarModelos invalida lo guardado', async () => {
  let llamadas = 0;
  const producir = () => { llamadas += 1; return { n: llamadas }; };
  assert.strictEqual(await cache.cuerpo('prueba-c', producir), '{"n":1}');
  assert.strictEqual(await cache.cuerpo('prueba-c', producir), '{"n":1}', 'la segunda petición vuelve a proyectar');
  proyeccion.usarModelos(catalogo);
  assert.strictEqual(await cache.cuerpo('prueba-c', producir), '{"n":2}', 'usarModelos no invalidó la caché');
});

test('c. dos primeras peticiones a la vez comparten un solo cálculo; otro día, otro cálculo', async () => {
  let llamadas = 0;
  const producir = async () => { llamadas += 1; await new Promise((r) => setTimeout(r, 10)); return { n: llamadas }; };
  const [x, y] = await Promise.all([cache.cuerpo('prueba-p', producir), cache.cuerpo('prueba-p', producir)]);
  assert.strictEqual(llamadas, 1);
  assert.strictEqual(x, y);
  const manana = ahoraReal() + 24 * 3600 * 1000;
  cache.usarReloj(() => manana);
  await cache.cuerpo('prueba-p', producir);
  assert.strictEqual(llamadas, 2, 'el día siguiente sirvió lo guardado');
});

test('d. una proyección que falla no se guarda', async () => {
  let llamadas = 0;
  const producir = () => { llamadas += 1; if (llamadas === 1) throw new Error('fallo'); return { ok: true }; };
  await assert.rejects(cache.cuerpo('prueba-d', producir), /fallo/);
  assert.strictEqual(await cache.cuerpo('prueba-d', producir), '{"ok":true}', 'se sirvió el fallo guardado');
  assert.strictEqual(llamadas, 2);
});

test('e. todo lastOrder del catálogo es AAAA-MM-DD', async () => {
  const productos = await catalogo.Product.findAll({});
  for (const p of productos) {
    const f = p.specs && p.specs.eolAnnounced && p.specs.eolAnnounced.lastOrder;
    if (f) assert.match(f, /^\d{4}-\d{2}-\d{2}$/, `${p.model}: lastOrder «${f}» con hora; el día en la clave de la caché ya no basta`);
  }
});
