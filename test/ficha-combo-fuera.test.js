'use strict';
/* El desplegable de la ficha resalta los fuera de venta (petición del dueño, 2026-10-28: «resalta
   el combo de los equipos que están fuera de venta»). Una sola regla en ficha.js para los siete
   dimensionadores:
   - van al final, en un grupo con nombre (`optgroup.optg-fuera`), que es lo que también pintan los
     desplegables nativos de macOS y del móvil, que ignoran el color de cada opción;
   - el contador «Equipos que cumplen» dice cuántos de ellos son fuera de venta, y una nota bajo el
     desplegable explica que están y para qué sirven (va enlazada al desplegable con
     `aria-describedby`, para quien usa lector de pantalla);
   - con uno elegido, una pastilla roja junto al desplegable y el aviso del equipo en rojo.
   El fin de venta ANUNCIADO sigue entre los vigentes: hasta su fecha se pide con normalidad. */

const test = require('node:test');
const assert = require('node:assert');
const { cargar } = require('./ayuda/navegador');

// El doble de `document` no devuelve contenedores; aquí se le da uno mínimo para leer el HTML.
function pintar(cfg) {
  const g = cargar('public/js/ficha.js');
  const cont = { innerHTML: '', style: {}, hidden: false, dataset: {}, classList: { add() {}, remove() {}, toggle() {} },
    addEventListener() {}, querySelector: () => null, querySelectorAll: () => [], setAttribute() {}, removeAttribute() {} };
  g.document.getElementById = (id) => (id === 'v' ? cont : null);
  g.FICHA.render({ contenedor: 'v', ...cfg });
  return cont.innerHTML;
}
const MS = [
  { id: 'A' },
  { id: 'B', eolAnnounced: { lastOrder: '2099-01-01' } },
  { id: 'C', eol: true },
  { id: 'L', legacy: true },
  { id: 'D', eolAnnounced: { lastOrder: '2020-01-01' } },
];
const valores = (html) => [...html.matchAll(/<option value="([^"]+)"/g)].map((x) => x[1]);

test('los fuera de venta van al final, en su grupo con nombre; el anunciado y la línea anterior, con los vigentes', () => {
  const h = pintar({ candidatos: MS, recomendado: 'A' });
  const grupo = /<optgroup class="optg-fuera" label="([^"]+)">([\s\S]*?)<\/optgroup>/.exec(h);
  assert.ok(grupo, 'hay grupo de fuera de venta');
  assert.match(grupo[1], /^Fuera de venta \(2\) · solo parque instalado, no se recomiendan$/);
  assert.deepStrictEqual(valores(grupo[2]), ['C', 'D'], 'dentro, los dos fuera de venta (eol y fecha vencida), en su orden');
  assert.deepStrictEqual(valores(h), ['A', 'B', 'L', 'C', 'D'], 'vigentes, anunciado y línea anterior primero');
  const fuera = h.slice(0, grupo.index);
  assert.doesNotMatch(fuera, /data-ciclo="fuera"/, 'ningún fuera de venta fuera del grupo');
});

test('el contador y la nota dicen cuántos fuera de venta hay; la nota describe el desplegable', () => {
  const h = pintar({ candidatos: MS, recomendado: 'A' });
  assert.match(h, /<span class="ficha-cuenta"> · 5 <span class="ficha-cuenta-fuera">\(2 fuera de venta\)<\/span><\/span>/,
    'el primer número sigue siendo el total (lo lee e2e-candidatos)');
  assert.match(h, /<select id="v-sel" aria-describedby="v-sel-fuera">/);
  assert.match(h, /<p class="ficha-sel-fuera" id="v-sel-fuera">La lista incluye <b>2 equipo\(s\) fuera de venta<\/b>/);
  assert.doesNotMatch(h, /ficha-sel-pill/, 'con un vigente elegido, no hay pastilla');
});

test('sin fuera de venta no cambia nada: ni grupo, ni nota, ni contador extra', () => {
  const h = pintar({ candidatos: [{ id: 'A' }, { id: 'B' }], recomendado: 'A' });
  assert.doesNotMatch(h, /optgroup|ficha-sel-fuera|ficha-cuenta-fuera|aria-describedby|ficha-sel-pill/);
  assert.match(h, /<span class="ficha-cuenta"> · 2<\/span>/);
});

test('con un fuera de venta elegido: pastilla roja junto al desplegable, marca y aviso en rojo', () => {
  const h = pintar({ candidatos: MS, recomendado: 'A', seleccionado: 'C' });
  assert.match(h, /<\/select><span class="ficha-sel-pill">Fuera de venta<\/span>/);
  assert.match(h, /<option value="C" class="opt-ciclo opt-ciclo-fuera" data-ciclo="fuera" selected>/);
  assert.match(h, /<span class="ficha-ref fuera">fuera de venta<\/span>/);
  assert.match(h, /<p class="ficha-aviso fuera">Equipo <b>fuera de venta<\/b>/);
  // Un anunciado elegido no lleva pastilla ni aviso en rojo: todavía se vende.
  const a = pintar({ candidatos: MS, recomendado: 'A', seleccionado: 'B' });
  assert.doesNotMatch(a, /ficha-sel-pill|ficha-aviso fuera/);
});

test('la hoja común pinta el grupo, la opción y el desplegable cerrado con el rojo fijo, nunca con --red', () => {
  const css = require('fs').readFileSync(require('path').join(__dirname, '..', 'public', 'controles.css'), 'utf8');
  assert.match(css, /optgroup\.optg-fuera \{[^}]*color: var\(--ciclo-rojo\)/);
  assert.match(css, /option\.opt-ciclo-fuera \{[^}]*background-color: var\(--ciclo-rojo-fondo\)/);
  assert.match(css, /select:has\(option\.opt-ciclo-fuera:checked\) \{[^}]*box-shadow: inset 4px 0 0 var\(--ciclo-rojo\)/);
  assert.doesNotMatch(css.replace(/\/\*[\s\S]*?\*\//g, ''), /optg-fuera[^}]*var\(--red/, 'el grupo no usa el color de marca');
});
