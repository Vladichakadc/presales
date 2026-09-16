'use strict';
// Integridad del mapa de fotos oficiales de equipos Aruba (2026-09-16).
//
// POR QUE ESTA PRUEBA EXISTE. La tarjeta gráfica de la ficha (opt-in `vistas` de
// ficha.js, petición directa del dueño) promete dos cosas: que TODA foto que se muestra
// es oficial y está versionada en el repo (la regla del catálogo prohíbe enseñar un
// «parecido»), y que el mapa no apunta a modelos que no existen ni a archivos que se
// borraron. Estas reglas convierten esa clase de fallo en ruido de CI: una ruta rota,
// un id que ya no está en el catálogo o una entrada sin procedencia rompen la build
// aquí — no la presentación al cliente.

const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const { MODELS } = require('../server/seed/legacyData/aruba');

const rutaJson = path.join(__dirname, '..', 'public', 'data', 'aruba-vistas-equipos.json');
const VISTAS = JSON.parse(fs.readFileSync(rutaJson, 'utf8'));

const idsCatalogo = new Set(MODELS.map((m) => m.id));
const entradas = Object.entries(VISTAS).filter(([k]) => k !== '_procedencia');

test('el mapa declara su procedencia', () => {
  assert.ok(typeof VISTAS._procedencia === 'string' && VISTAS._procedencia.length > 40,
    'falta _procedencia: sin ella no hay forma de auditar de qué documento salió cada foto');
});

test('cada entrada cuelga de un modelo real del catálogo', () => {
  for (const [id] of entradas) {
    assert.ok(idsCatalogo.has(id), `«${id}» está en el mapa de vistas pero no en el catálogo`);
  }
});

test('toda entrada tiene foto frontal, procedencia y tamaño', () => {
  for (const [id, v] of entradas) {
    assert.ok(v.front && v.front.startsWith('/img/equipos/'), `${id}: falta foto frontal o no cuelga de /img/equipos/`);
    assert.ok(v.fuente && v.fuente.length > 8, `${id}: falta la fuente oficial de la foto (página/documento)`);
    assert.ok(v.tamano && v.tamano.length > 8, `${id}: falta el pie de tamaño (el dueño pidió «analiza el tamaño del equipo»)`);
  }
});

test('todas las fotos referenciadas existen en public/ y pesan algo', () => {
  for (const [id, v] of entradas) {
    for (const cara of ['front', 'rear']) {
      if (!v[cara]) continue;
      const p = path.join(__dirname, '..', 'public', v[cara]);
      assert.ok(fs.existsSync(p), `${id}: no existe ${v[cara]}`);
      assert.ok(fs.statSync(p).size > 2000, `${id}: ${v[cara]} pesa sospechosamente poco`);
    }
  }
});

test('las fotos solo se enchufan por opt-in: ficha.js exige cfg.vistas y cfg.panelFijo', () => {
  const ficha = fs.readFileSync(path.join(__dirname, '..', 'public', 'js', 'ficha.js'), 'utf8');
  // Sin estas guardas el módulo compartido pintaría fotos o movería secciones en los
  // otros cuatro dimensionadores, que no las han pedido.
  assert.ok(/cfg\.vistas && typeof cfg\.vistas === 'object'/.test(ficha), 'ficha.js: la tarjeta gráfica debe ser opt-in (cfg.vistas)');
  assert.ok(/cfg\.panelFijo && cfg\.contenedorDetalle/.test(ficha), 'ficha.js: el detalle aparte debe ser opt-in (cfg.panelFijo + cfg.contenedorDetalle)');
  assert.ok(/!cfg\.panelFijo \? ' larga'/.test(ficha), 'ficha.js: con panelFijo la lista de candidatos no lleva scroll interno (.larga)');
});

test('la página de Aruba declara los opt-ins y carga el mapa', () => {
  const pag = fs.readFileSync(path.join(__dirname, '..', 'public', 'js', 'dimensionador-aruba-edgeconnect.js'), 'utf8');
  assert.ok(/panelFijo:true/.test(pag), 'la página de Aruba no declara panelFijo');
  assert.ok(/contenedorDetalle:'verdict-detalle'/.test(pag), 'la página de Aruba no declara contenedorDetalle');
  assert.ok(pag.includes('/data/aruba-vistas-equipos.json'), 'la página de Aruba no carga el mapa de vistas');
  const html = fs.readFileSync(path.join(__dirname, '..', 'public', 'dimensionador-aruba-edgeconnect.html'), 'utf8');
  assert.ok(html.includes('id="verdict-detalle"'), 'falta el contenedor #verdict-detalle en el HTML');
  assert.ok(!/overflow-y:auto/.test(html.split('id="verdict"')[0].split('TAB 2')[0]),
    'la columna del verdict no debe tener scroll interno');
});
