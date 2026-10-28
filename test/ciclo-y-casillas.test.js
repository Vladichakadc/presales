'use strict';
// DOS PETICIONES DEL DUEÑO DEL 2026-10-27, fijadas donde se pueden fijar sin navegador (lo que se
// ve lo conduce `test/e2e/e2e-ciclo-y-casillas.js`):
//   1. «Resalta en rojo en el combo cuando los equipos están o van a estar fuera de venta»: una sola
//      regla (FICHA.opcionCiclo) para el desplegable de la ficha y para el selector de modelo propio
//      de cada página; el rojo va siempre con su texto, y la línea anterior no es fin de venta.
//   2. «Resalta cuando se activa una funcionalidad activando el check»: la hoja común
//      `public/controles.css`, enlazada por los ocho dimensionadores que tienen casillas de función.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { cargar } = require('./ayuda/navegador.js');

const RAIZ = path.join(__dirname, '..');
const { FICHA } = cargar('public/js/ficha.js');
const leer = (r) => fs.readFileSync(path.join(RAIZ, r), 'utf8');

test('fuera de venta y fin de venta anunciado salen marcados, con su texto; vigente y línea anterior, no', () => {
  const futuro = new Date(Date.now() + 400 * 864e5).toISOString().slice(0, 10);
  const pasado = new Date(Date.now() - 40 * 864e5).toISOString().slice(0, 10);
  const casos = [
    [{ id: 'a' }, null, ''],
    [{ id: 'b', legacy: true }, null, ''],
    [{ id: 'c', eol: true }, 'fuera', 'fuera de venta'],
    [{ id: 'd', eolAnnounced: { lastOrder: pasado } }, 'fuera', 'fin de venta vencido'],
    [{ id: 'e', eolAnnounced: { lastOrder: futuro } }, 'anunciado', `fin de venta el ${futuro}`],
  ];
  for (const [m, ciclo, texto] of casos) {
    const oc = FICHA.opcionCiclo(m);
    assert.strictEqual(oc.ciclo, ciclo, `${m.id}: ciclo`);
    if (!ciclo) { assert.strictEqual(oc.attr, ''); assert.strictEqual(oc.sufijo, ''); continue; }
    assert.match(oc.attr, new RegExp(`class="opt-ciclo opt-ciclo-${ciclo}" data-ciclo="${ciclo}"`));
    assert.ok(oc.sufijo.endsWith(texto), `${m.id}: el rojo va con su texto («${oc.sufijo}»)`);
  }
  // La regla propia de la página suma, no resta: Fortinet sin SKU de hardware en la lista firmada.
  assert.strictEqual(FICHA.opcionCiclo({ id: 'f' }, { fuera: true }).ciclo, 'fuera');
});

test('el desplegable de la ficha y el selector de modelo de cada página usan la misma regla', () => {
  const ficha = leer('public/js/ficha.js');
  assert.match(ficha, /const oc = opcionCiclo\(m\);[\s\S]{0,300}<option value="\$\{esc\(m\.id\)\}"\$\{oc\.attr\}/);
  for (const pag of ['aruba-edgeconnect', 'cisco-catalyst8k', 'fortinet-fortigate', 'huawei-netengine', 'juniper-srx', 'mikrotik-routeros']) {
    const js = leer(`public/js/dimensionador-${pag}.js`);
    assert.match(js, /FICHA\.opcionCiclo\((m|x)(, \{ fuera: m\.eol \|\| !m\.hwSku \})?\)/, `${pag}: su selector no marca el ciclo de vida`);
    assert.doesNotMatch(js, /<option[^\n]*(\(EOL\)|\(fuera de venta\))/, `${pag}: queda una opción con la marca de fin de venta escrita a mano`);
  }
});

test('los ocho dimensionadores con casillas enlazan la hoja común', () => {
  const css = leer('public/controles.css');
  assert.match(css, /label:has\(> input\[type="checkbox"\]:checked\)/, 'falta el resaltado de la casilla marcada');
  assert.match(css, /option\.opt-ciclo \{ color: var\(--ciclo-rojo\); \}/, 'falta el rojo de las opciones');
  assert.match(css, /select:has\(option\.opt-ciclo:checked\)/, 'falta el desplegable cerrado en rojo');
  // El rojo del fin de venta es fijo: `--red` es el color de marca de cada página (verde en Aruba).
  assert.doesNotMatch(css.split('/* 2 ·')[0], /var\(--red\b/, 'el rojo del ciclo de vida no puede ser el color de marca');
  for (const pag of ['aruba-edgeconnect', 'cisco-catalyst8k', 'fortinet-fortigate', 'huawei-netengine', 'juniper-srx', 'mikrotik-routeros', 'nokia-7220ixr', 'nokia-7750sr']) {
    assert.match(leer(`public/dimensionador-${pag}.html`), /<link rel="stylesheet" href="\/controles\.css">/, `${pag} no enlaza controles.css`);
  }
});
