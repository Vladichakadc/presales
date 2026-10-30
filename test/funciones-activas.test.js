'use strict';
// LAS FUNCIONES ACTIVADAS, TAMBIÉN A LA DERECHA (petición del dueño, 2026-10-28). Lo que se puede
// fijar sin navegador; lo que se ve lo conduce `test/e2e/e2e-funciones-activas.js` en las ocho
// páginas.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..');
const leer = (r) => fs.readFileSync(path.join(RAIZ, r), 'utf8');
const PAGINAS = ['aruba-edgeconnect', 'cisco-catalyst8k', 'fortinet-fortigate', 'huawei-netengine',
  'juniper-srx', 'mikrotik-routeros', 'nokia-7220ixr', 'nokia-7750sr'];

test('los ocho dimensionadores con casillas cargan el panel y la hoja común', () => {
  for (const pag of PAGINAS) {
    const html = leer(`public/dimensionador-${pag}.html`);
    assert.strictEqual((html.match(/<script src="\/js\/funciones-activas\.js" defer><\/script>/g) || []).length, 1, `${pag}: funciones-activas.js, una vez y diferido`);
    assert.match(html, /<link rel="stylesheet" href="\/controles\.css">/, `${pag}: sin la hoja común el panel sale sin resaltar`);
  }
  // Starlink usa interruptores, que ya enseñan su estado: ni hoja común ni panel.
  assert.doesNotMatch(leer('public/dimensionador-starlink-leo.html'), /funciones-activas\.js/);
});

test('la derecha cuenta lo mismo que la izquierda resalta', () => {
  const js = leer('public/js/funciones-activas.js');
  const css = leer('public/controles.css');
  // Las mismas exclusiones: si una se resalta a la izquierda, tiene su pastilla, y al revés.
  const excl = js.match(/const EXCLUIDAS = '([^']+)'/)[1].split(',').map((x) => x.trim()).sort();
  const deCss = [...css.match(/label:has\(> input\[type="checkbox"\]:checked\)((?::not\([^)]+\))+) \{/)[1].matchAll(/:not\(([^)]+)\)/g)].map((m) => m[1]).sort();
  assert.deepStrictEqual(excl, deCss);
  // Lo oculto no cuenta; lo bloqueado sí, con la barra gris como a la izquierda.
  assert.match(js, /n\.hidden \|\| n\.classList\.contains\('hidden'\)/);
  assert.match(css, /\.fa-pastilla\.fa-fija \{ box-shadow: inset 3px 0 0 var\(--steel/);
  // El mismo resaltado que la fila: acento al 6 %, barra de 3 px y seminegrita.
  assert.match(css, /\.fa-pastilla \{[^}]*background-color: color-mix\(in srgb, var\(--red, #0E1A2B\) 6%, var\(--card, #FFF\)\);[^}]*box-shadow: inset 3px 0 0 var\(--red, #0E1A2B\);/s);
  // Sin JavaScript en línea (CSP `script-src 'self'`): el clic va por delegación, no por onclick.
  assert.doesNotMatch(js, /onclick=|on[a-z]+="/);
  // Se repinta también tras un recálculo sin eventos (perfiles, «restablecer»), sin bucle.
  assert.match(js, /new MutationObserver\(\(\) => \{ if \(!r\.espera\) reponer\(r\); pintar\(r\); \}\)\.observe\(der, \{ childList: true, subtree: true \}\)/);
  assert.match(js, /if \(firma === r\.firma\) return;/);
});

// LO QUE TRAJO LA FUNCIÓN (petición del dueño, 2026-10-29). Lo que se ve, en
// `test/e2e/e2e-funciones-activas.js`; aquí, lo que no puede cambiar sin que se note.
test('lo resaltado en el resultado sale de comparar el antes y el después, con el mismo acento', () => {
  const js = leer('public/js/funciones-activas.js');
  const css = leer('public/controles.css');
  // La foto se toma en el `click` (antes del `input`/`change` con que la página recalcula), en
  // captura, y solo al marcar.
  assert.match(js, /document\.addEventListener\('click', \(e\) => \{[\s\S]*?if \(r && cb\.checked\) seguir\(r, cb\);[\s\S]*?\}, true\);/);
  // Lo marcado es lo que no estaba en la foto de antes: ni un mapa función→fila ni marcas que una
  // página escriba a mano (el riesgo de la propuesta del PR #61).
  assert.match(js, /if \(n > 0\) quedan\.set\(k, n - 1\); else nuevas\.push\(u\);/);
  assert.doesNotMatch(js, /data-por|MAPA_|POR_FUNCION/);
  for (const pag of PAGINAS) assert.doesNotMatch(leer(`public/js/dimensionador-${pag}.js`), /fa-nuevo/, `${pag}: la página no marca a mano`);
  // Cualquier otro control borra las marcas; al desmarcar no se marca nada.
  assert.match(js, /document\.addEventListener\('change', otro, true\);/);
  // Dice de qué función salió cada punto, y el panel lo cuenta.
  assert.match(js, /el\.title = `Apareció al activar «\$\{c\.nombre\}»`;/);
  assert.match(js, /no cambió nada visible del resultado/);
  // El mismo resaltado que la fila de la izquierda: acento al 6 % y barra de 3 px.
  assert.match(css, /\.fa-nuevo:not\(tr\) \{[^}]*background-color: color-mix\(in srgb, var\(--red, #0E1A2B\) 6%, var\(--card, #FFF\)\) !important;[^}]*box-shadow: inset 3px 0 0 var\(--red, #0E1A2B\) !important;/s);
  assert.match(css, /tr\.fa-nuevo > td, tr\.fa-nuevo > th \{/);
  assert.match(css, /forced-colors: active\)[\s\S]*\.fa-nuevo:not\(tr\), tr\.fa-nuevo > td \{ outline: 2px solid Highlight; \}/);
});
