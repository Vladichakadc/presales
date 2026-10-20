'use strict';
// FIGURAS OFICIALES DEL DIMENSIONADOR JUNIPER (2026-10-19, petición del dueño: las imágenes de
// los equipos en alta calidad, frontal y trasera, y la distribución de Aruba).
//
// Lo mismo que guardan las pruebas de Fortinet, Huawei y MikroTik, porque un mapa de figuras se
// pudre igual en todos: un fichero que no está, un modelo que ya no existe, una figura sin
// procedencia. Y dos cosas propias de este:
//   - Las figuras salen de la guía de hardware de cada modelo (y de la ficha de línea en los dos
//     SSR sin guía descargable), así que el pie tiene que nombrar el documento, la página y el
//     rótulo literal de la figura, de las DOS caras.
//   - Se guardan sin pérdida (WebP VP8L): son dibujos técnicos con números de componente, y una
//     compresión con pérdida emborrona justo los números que la leyenda de la guía explica.

const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..');
const VISTAS = JSON.parse(fs.readFileSync(path.join(RAIZ, 'public/data/juniper-vistas-equipos.json'), 'utf8'));
const { MODELS, SDWAN } = require('../server/seed/legacyData/juniper.js');

const entradas = Object.entries(VISTAS).filter(([k]) => !k.startsWith('_'));

test('cada figura declarada existe, no es un stub y es WebP sin pérdida', () => {
  for (const [modelo, v] of entradas) {
    for (const cara of ['front', 'rear']) {
      assert.ok(v[cara], `${modelo}: le falta la cara ${cara}`);
      assert.ok(v[cara].startsWith('/img/equipos/jn-'), `${modelo}: ${cara} fuera de /img/equipos/jn-*`);
      const f = path.join(RAIZ, 'public', v[cara]);
      assert.ok(fs.existsSync(f), `${modelo}: ${v[cara]} no existe`);
      const b = fs.readFileSync(f);
      assert.ok(b.length > 4096, `${modelo}: ${v[cara]} es demasiado pequeño para una figura`);
      assert.strictEqual(b.toString('ascii', 0, 4), 'RIFF', `${modelo}: ${v[cara]} no es RIFF`);
      assert.strictEqual(b.toString('ascii', 8, 12), 'WEBP', `${modelo}: ${v[cara]} no es WebP`);
      assert.strictEqual(b.toString('ascii', 12, 16), 'VP8L', `${modelo}: ${v[cara]} no es sin pérdida (VP8L)`);
    }
  }
});

test('los 18 equipos del catálogo Juniper tienen figura, y ninguna es de un modelo que no existe', () => {
  const ids = [...MODELS, ...SDWAN].map((m) => m.id);
  for (const [modelo] of entradas) assert.ok(ids.includes(modelo), `${modelo} tiene figura y no está en el catálogo`);
  for (const id of ids) assert.ok(VISTAS[id], `${id} está en el catálogo y no tiene figura`);
});

test('cada pie cita el documento, la página y el rótulo literal de las dos caras', () => {
  for (const [modelo, v] of entradas) {
    assert.match(v.fuente, /^(Guía de hardware|Ficha SSR1?00+ Line of Routers)/, `${modelo}: no nombra el documento`);
    const citas = v.fuente.match(/«[^»]{12,}»/g) || [];
    assert.ok(citas.length >= 2, `${modelo}: tiene que citar el rótulo de la frontal y el de la trasera`);
    assert.match(v.fuente, /p\. \d+/, `${modelo}: no dice la página`);
    assert.match(v.url || '', /^https:\/\/www\.juniper\.net\//, `${modelo}: el documento de origen no está enlazado en \`url\``);
    if (v.fuente.startsWith('Guía de hardware')) {
      assert.match(v.url || '', /^https:\/\/www\.juniper\.net\/documentation\/us\/en\/hardware\//, `${modelo}: no enlaza su guía`);
      assert.match(v.fuente, /Front Panel/i, `${modelo}: la frontal no cita una figura «Front Panel»`);
      assert.match(v.fuente, /(Rear|Back) Panel/i, `${modelo}: la trasera no cita una figura «Rear/Back Panel»`);
    }
  }
});

test('la página carga el mapa de figuras y la ficha lo usa con la distribución de Aruba', () => {
  const js = fs.readFileSync(path.join(RAIZ, 'public/js/dimensionador-juniper-srx.js'), 'utf8');
  assert.ok(js.includes("fetch('/data/juniper-vistas-equipos.json')"), 'la página no carga el mapa de figuras');
  assert.match(js, /panelFijo:\s*true/);
  assert.match(js, /detalleExpandible:\s*true/);
  const html = fs.readFileSync(path.join(RAIZ, 'public/dimensionador-juniper-srx.html'), 'utf8');
  assert.ok(html.includes('<div class="cols">') && html.includes('class="col-fijo"'), 'la página no tiene la rejilla de dos columnas');
});
