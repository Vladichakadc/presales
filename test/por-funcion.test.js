'use strict';
// «POR <FUNCIÓN>» EN LA FILA DEL BOM (2026-10-29). Lo que se fija sin navegador: que cada marca sale
// de una lectura que la página ya hace (nunca de un mapa que pueda desincronizarse), que el consolidado
// no la lleva y que el módulo carga a tiempo. Lo que se ve lo conduce `test/e2e/e2e-por-funcion.js`.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..');
const leer = (r) => fs.readFileSync(path.join(RAIZ, r), 'utf8');
const casillaEnHtml = (html, id) => new RegExp(`<label[^>]*>\\s*<input type="checkbox" id="${id}"`).test(html);

test('Cisco: cada clave `req` del motor tiene su casilla, y la tabla repite la lectura que hace la página', () => {
  const motor = leer('public/js/cisco-motor.js');
  const pag = leer('public/js/dimensionador-cisco-catalyst8k.js');
  const html = leer('public/dimensionador-cisco-catalyst8k.html');
  const tablas = {};
  for (const nombre of ['CASILLA_REQ', 'CASILLA_LIC', 'CASILLA_SA']) {
    const m = new RegExp(`const ${nombre} = \\{([^}]*)\\};`).exec(pag);
    assert.ok(m, `falta ${nombre}`);
    for (const [, k, id] of m[1].matchAll(/(\w+):'(\w+)'/g)) {
      tablas[k] = id;
      // La entrada repite una lectura que ya existe: `clave:$('casilla').checked`.
      assert.ok(pag.includes(`${k}:$('${id}').checked`), `${nombre}.${k} → ${id}: la página no lee esa casilla para esa clave`);
      assert.ok(casillaEnHtml(html, id), `${id} no es una casilla de la página`);
    }
  }
  const reqs = new Set([...motor.matchAll(/\breq: '(\w+)'/g)].map((m) => m[1]));
  reqs.add('privado'); // porUsuario(…, 'privado')
  assert.ok(reqs.size >= 6, `el motor marca sus filas (${[...reqs].join(', ')})`);
  for (const r of reqs) assert.ok(tablas[r], `el motor marca una fila con req:'${r}' y la página no sabe de qué casilla es`);
});

test('Fortinet: cada `req` de las reglas es una casilla de la tabla de enlaces de la página', () => {
  const reglas = leer('public/js/fortinet-reglas.js');
  const pag = leer('public/js/dimensionador-fortinet-fortigate.js');
  const html = leer('public/dimensionador-fortinet-fortigate.html');
  const reqs = [...reglas.matchAll(/req: '([\w.]+)'/g)].map((m) => m[1]);
  assert.ok(reqs.length >= 5, `las reglas marcan sus filas (${reqs.join(', ')})`);
  for (const r of reqs) {
    const m = new RegExp(`\\['${r.replace('.', '\\.')}', '(\\w+)', 'chk'\\]`).exec(pag);
    assert.ok(m, `req:'${r}' no está en la tabla UI de la página como casilla`);
    assert.ok(casillaEnHtml(html, m[1]), `${m[1]} no es una casilla de la página`);
  }
  // Los servicios SD-WAN van por su servicio, con la misma tabla que arma `comercial.sdwan`.
  assert.match(reglas, /req: svs\.map\(\(sv\) => 'comercial\.sdwan:' \+ sv\.id\)/);
  assert.match(pag, /s\.comercial\.sdwan = Object\.entries\(CHK_SDWAN\)/);
  assert.match(pag, /if \(m\) return CHK_SDWAN\[m\[1\]\] \|\| null;/);
  assert.match(pag, /const filas = r\.bom\.filas\.map\(\(f\) => \(f\.req \? \{ \.\.\.f, por: \[\]\.concat\(f\.req\)\.map\(casillaDeReq\)/);
});

test('la marca falla cerrado, no viaja al consolidado y el módulo carga antes que la página', () => {
  const js = leer('public/js/por-funcion.js');
  const bom = leer('public/js/bom.js');
  // Solo una casilla de verdad, y marcada: una fila sin la función pedida no se le atribuye.
  assert.match(js, /cb\.type === 'checkbox' && cb\.parentElement && cb\.parentElement\.tagName === 'LABEL'/);
  assert.match(js, /const v = validos\(por\)\.filter\(\(id\) => casilla\(id\)\.checked\);\s*if \(!v\.length\) return '';/);
  // bom.js pinta lo que diga el módulo, y nada sin él.
  assert.match(bom, /const porAttr = PF && f\.por \? PF\.atributo\(f\.por\) : '';/);
  // El consolidado suma perfiles guardados: sin casillas en pantalla que respalden la marca.
  assert.strictEqual((bom.match(/por: undefined/g) || []).length, 3, 'consolidar() quita `por` en sus tres ramas');
  for (const pag of ['cisco-catalyst8k', 'fortinet-fortigate']) {
    const html = leer(`public/dimensionador-${pag}.html`);
    const i = html.indexOf('<script src="/js/por-funcion.js"></script>');
    assert.ok(i > 0 && i < html.indexOf('<body'), `${pag}: por-funcion.js, sin defer y antes del <body>`);
  }
  assert.match(leer('public/controles.css'), /\.fa-por-b \{/);
});
