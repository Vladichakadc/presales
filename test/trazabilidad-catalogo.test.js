'use strict';
/* TRAZABILIDAD DEL CATALOGO (auditoria 2026-11-09, fase 1). Cada dimensionador sirve una
   `datasetVersion` derivada del CONTENIDO, y la hoja «Supuestos» del BOM la escribe junto a
   la del motor: una propuesta tiene que poder decir con que catalogo se calculo. */

const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { versionDeCatalogo } = require('../server/services/catalogProjection');

test('la version cambia con el contenido y no con el orden de las claves', () => {
  const a = versionDeCatalogo('huawei', { models: [{ id: 'A', cap: 1 }], optics: { x: 1 } });
  const b = versionDeCatalogo('huawei', { optics: { x: 1 }, models: [{ cap: 1, id: 'A' }] });
  const c = versionDeCatalogo('huawei', { models: [{ id: 'A', cap: 2 }], optics: { x: 1 } });
  assert.strictEqual(a, b, 'mismas cifras, otro orden de claves: misma version');
  assert.notStrictEqual(a, c, 'otra cifra: otra version');
  assert.match(a, /^huawei@[0-9a-f]{16}$/);
});

test('el nombre del fabricante va en la version, y la de Fortinet ya calculada se respeta', () => {
  const d = { models: [] };
  assert.notStrictEqual(versionDeCatalogo('cisco', d), versionDeCatalogo('huawei', d));
  assert.strictEqual(versionDeCatalogo('fortinet', { datasetVersion: 'fortinet@abc', models: [] }), 'fortinet@abc');
});

test('la ruta /api/dimensionador/<v> devuelve datasetVersion en los ocho dimensionadores con catalogo', async () => {
  const dir = fs.mkdtempSync(path.join(require('os').tmpdir(), 'trazab-'));
  process.env.DATABASE_PATH = path.join(dir, 'db.sqlite');
  process.env.AUTH_STATE_DIR = dir;
  const { sequelize } = require('../server/models');
  const seedCatalog = require('../server/seed/seedCatalog');
  await sequelize.sync();
  await seedCatalog();
  const express = require('express');
  const app = express();
  app.use('/api', require('../server/routes/dimensionador'));
  const server = app.listen(0);
  const base = `http://127.0.0.1:${server.address().port}/api/dimensionador`;
  try {
    const vistos = new Set();
    for (const v of ['huawei', 'cisco', 'fortinet', 'juniper', 'mikrotik', 'aruba', 'nokia', 'nokia-sr']) {
      const r = await fetch(`${base}/${v}`);
      assert.strictEqual(r.status, 200, v);
      const d = await r.json();
      assert.match(d.datasetVersion, /^[a-z-]+@[0-9a-f]{16}$/, v);
      const otra = await (await fetch(`${base}/${v}`)).json();
      assert.strictEqual(otra.datasetVersion, d.datasetVersion, `${v}: estable entre dos lecturas`);
      vistos.add(d.datasetVersion);
    }
    assert.strictEqual(vistos.size, 8, 'ocho dimensionadores, ocho versiones distintas');
  } finally {
    server.close();
    await sequelize.close();
  }
});

test('cada pagina que carga su catalogo se lo entrega al BOM, y bom.js lo escribe en Supuestos', () => {
  const dir = path.join(__dirname, '..', 'public', 'js');
  const paginas = fs.readdirSync(dir).filter((f) => /^dimensionador-.*\.js$/.test(f) && f !== 'dimensionador-starlink-leo.js');
  assert.strictEqual(paginas.length, 8, paginas.join(', '));
  for (const f of paginas) {
    assert.match(fs.readFileSync(path.join(dir, f), 'utf8'), /BOM\.fijarCatalogo\(/, `${f} no llama a BOM.fijarCatalogo`);
  }
  const bom = fs.readFileSync(path.join(dir, 'bom.js'), 'utf8');
  assert.match(bom, /\['Versión del catálogo'/);
  assert.match(bom, /\['Versión del motor'/);
});
