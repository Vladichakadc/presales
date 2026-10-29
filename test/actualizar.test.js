'use strict';
// BOTÓN «ACTUALIZAR» EN TODOS LOS DIMENSIONADORES (petición del dueño, 2026-10-29). Lo que se
// puede fijar sin navegador: que las nueve páginas cargan el módulo y registran su recálculo, y
// que el módulo valida antes de recalcular sin inventar un resultado si el catálogo no llegó.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..');
const leer = (r) => fs.readFileSync(path.join(RAIZ, r), 'utf8');
const PAGINAS = ['aruba-edgeconnect', 'cisco-catalyst8k', 'fortinet-fortigate', 'huawei-netengine',
  'juniper-srx', 'mikrotik-routeros', 'nokia-7220ixr', 'nokia-7750sr', 'starlink-leo'];

test('los nueve dimensionadores cargan el botón y registran su recálculo', () => {
  for (const pag of PAGINAS) {
    const html = leer(`public/dimensionador-${pag}.html`);
    assert.strictEqual((html.match(/<script src="\/js\/actualizar\.js" defer><\/script>/g) || []).length, 1, `${pag}: actualizar.js, una vez y diferido`);
    const js = leer(`public/js/dimensionador-${pag}.js`);
    assert.strictEqual((js.match(/window\.DIMENSIONADOR_ACTUALIZAR = /g) || []).length, 1, `${pag}: sin su función de recálculo el botón no hace nada`);
  }
});

test('el botón valida, recalcula y dice el resultado', () => {
  const js = leer('public/js/actualizar.js');
  // Valida con las reglas que el HTML ya declara y marca lo fuera de regla.
  assert.match(js, /el\.checkValidity\(\)/);
  assert.match(js, /setAttribute\('aria-invalid', 'true'\)/);
  // Con el catálogo sin llegar no finge un cálculo.
  assert.match(js, /fn\(\) === false/);
  // El resultado se anuncia (role="status").
  assert.match(js, /role="status"/);
  // Sin JavaScript en línea (CSP `script-src 'self'`).
  assert.doesNotMatch(js, /onclick=|on[a-z]+="/);
  // Estilos: la hoja común para las ocho y la propia de Starlink, que no enlaza controles.css.
  assert.match(leer('public/controles.css'), /\.btn-actualizar \{/);
  assert.match(leer('public/dimensionador-starlink-leo.css'), /\.btn-actualizar \{/);
});
