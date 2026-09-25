'use strict';
// Cantidades ajustadas a mano en el BOM (public/js/bom.js — opt-in `ajustable`, 2026-09-16).
//
// La mejora nace de un hueco real: la lista admitía RETIRAR líneas pero no AJUSTAR su
// cantidad, y prohibirlo era la respuesta fácil — el preventa a veces necesita «una óptica
// más de repuesto» o «dos enlaces que el escenario no modela». La respuesta de arquitectura
// es admitir el ajuste como parte del estado y DECLARARLO en todas partes. Lo que se prueba
// aquí es lo que la haría mentirosa o rompería a los demás:
//   1. Que sea OPT-IN: sin el flag, una línea calculada se pinta como siempre — los otros
//      seis dimensionadores comparten este archivo y no pueden cambiar por una mejora de Aruba.
//   2. Que el input lleve la cifra del motor en data-bom-calc: sin ella la página no sabría
//      contra qué diverge el ajuste (ni cuándo podarlo).
//   3. Que el ajuste se DECLARE — badge en la tabla, nota y sección en el texto plano — con
//      la cifra que el motor había calculado: un ajuste sin declarar parece un error.
//   4. Que una línea sin cantidad calculada (qty null) no lleve control: lo que le falta es
//      el dato, no una cifra que pisar.
//   5. Que lo añadido a mano (refs) conserve SU control y no gane el de las calculadas.

const test = require('node:test');
const assert = require('node:assert');
const { cargar } = require('./ayuda/navegador.js');

const { BOM } = cargar('public/js/bom.js');

const FILAS = [
  { cat: 'Equipo', desc: 'EC-M', sku: 'JM964A', qty: 2, unit: 1000 },
  { cat: 'Seguridad SASE', desc: 'SSE pendiente', sku: 'R8M36AAE', qty: null, unit: null },
];

test('sin el flag ajustable, las líneas calculadas no llevan control (los otros seis dimensionadores no cambian)', () => {
  const html = BOM.renderTabla(FILAS, { editable: true });
  assert.ok(!html.includes('data-bom-ajustar'), 'ninguna línea calculada lleva input de ajuste');
  assert.ok(html.includes('data-bom-omitir'), 'el flag editable sigue pintando el botón de retirar');
});

test('con ajustable, las líneas calculadas con cantidad llevan input con la cifra del motor', () => {
  const html = BOM.renderTabla(FILAS, { editable: true, ajustable: true });
  const inputs = html.match(/data-bom-ajustar=/g) || [];
  assert.strictEqual(inputs.length, 1, 'solo la línea con cantidad calculada lleva control');
  assert.ok(html.includes('data-bom-ajustar="sku:JM964A"'), 'la clave es la de BOM.claveFila');
  assert.ok(/data-bom-calc="2"/.test(html), 'data-bom-calc guarda la cifra del motor');
  assert.ok(!html.includes('data-bom-ajustar="sku:R8M36AAE"'), 'la línea sin cantidad calculada no lleva control');
});

test('la fila ajustada declara el badge con la cifra del motor, y el input muestra la ajustada', () => {
  const ajustada = [{ cat: 'Equipo', desc: 'EC-M', sku: 'JM964A', qty: 3, unit: 1000, ajuste: 2 }];
  const html = BOM.renderTabla(ajustada, { editable: true, ajustable: true });
  assert.ok(html.includes('Cantidad ajustada a mano — el cálculo decía 2'), 'badge con la cifra del motor');
  assert.ok(html.includes('value="3"'), 'el input muestra la cantidad ajustada');
  assert.ok(html.includes('data-bom-calc="2"'), 'y data-bom-calc sigue siendo la cifra del motor (para podar al volver a ella)');
  // Y el subtotal usa la cantidad AJUSTADA: 3 x 1.000 = 3.000, no 2.000.
  assert.ok(html.includes('3,000') || html.includes('3000'), 'el subtotal respeta el ajuste');
});

test('lo añadido a mano conserva SU stepper y no gana el control de las calculadas', () => {
  const conRef = [{ cat: 'Referencias', desc: 'bundle', sku: 'FC-X', qty: 1, unit: 10, _ref: 'Fortinet|FC-X' }];
  const html = BOM.renderTabla(conRef, { editable: true, ajustable: true });
  assert.ok(html.includes('data-bom-cant="Fortinet|FC-X"'), 'su control es el de siempre');
  assert.ok(!html.includes('data-bom-ajustar'), 'y no el de las calculadas — dos controles en una celda serían ambiguos');
});

test('sin el badge declarado por la página, no hay marca — el módulo no inventa ajustes', () => {
  const html = BOM.renderTabla(FILAS, { editable: true, ajustable: true });
  assert.ok(!html.includes('Cantidad ajustada a mano'), 'ninguna fila declara ajuste');
});

test('el texto plano declara el ajuste junto a la fila y en sección propia', () => {
  const filas = [{ cat: 'Equipo', desc: 'EC-M', sku: 'JM964A', qty: 3, unit: 1000, ajuste: 2 }];
  const txt = BOM.comoTexto(filas, {});
  assert.ok(txt.includes('(cantidad ajustada a mano — el cálculo del dimensionador decía 2)'), 'nota inline junto a la fila');
  assert.ok(txt.includes('CANTIDADES AJUSTADAS A MANO'), 'sección propia');
  assert.ok(/JM964A\): 3 uds — el cálculo decía 2/.test(txt), 'la sección da la ajustada y la del motor');
});

test('el texto plano sin ajustes no lleva la sección (no se declara lo que no pasó)', () => {
  const txt = BOM.comoTexto(FILAS, {});
  assert.ok(!txt.includes('CANTIDADES AJUSTADAS A MANO'), 'sin sección');
  assert.ok(!txt.includes('cantidad ajustada a mano'), 'ni nota inline');
});
