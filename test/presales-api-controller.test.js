'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { createPresalesRouter, createPresalesHandlers } = require('../server/presales_api_controller');

const llamar = async (fn, body) => {
  let c = 200, b;
  await fn({ body }, { status(x) { c = x; return this; }, json(x) { b = x; return this; } });
  return { c, b };
};

test('el router registra 5 rutas y exige requireAdmin si hay ProductModel', () => {
  const rutas = [];
  const express = { Router: () => ({ post: (p, ...f) => rutas.push([p, f.length]) }) };
  createPresalesRouter(express);
  assert.equal(rutas.length, 5);
  assert.throws(() => createPresalesRouter(express, { ProductModel: { bulkCreate() {} } }));
  rutas.length = 0;
  createPresalesRouter(express, { ProductModel: { bulkCreate() {} }, requireAdmin() {} });
  assert.deepEqual(rutas.find((r) => r[0] === '/catalog/import'), ['/catalog/import', 2]);
});

test('/catalog/import rechaza fabricantes fuera de la lista y acepta HUAWEI', async () => {
  const h = createPresalesHandlers();
  assert.equal((await llamar(h.handleCatalogImport, { fabricante: 'EVIL', items: [{ sku: 'a', modelo: 'b' }] })).c, 400);
  const ok = await llamar(h.handleCatalogImport, { fabricante: 'huawei', items: [{ sku: 'a', modelo: 'b', list_price_usd: 1 }] });
  assert.equal(ok.b.ok, true);
});

test('los motores Huawei y Aruba responden por la API', async () => {
  const h = createPresalesHandlers();
  assert.equal((await llamar(h.handleHuaweiSizing, { bw_enlace_mbps: 500 })).b.ok, true);
  assert.equal((await llamar(h.handleArubaSizing, { bw_mpls_mbps: 100, bw_internet_mbps: 200 })).b.ok, true);
});
