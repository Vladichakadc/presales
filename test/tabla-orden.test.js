'use strict';
// Ordenacion de columnas. La coma es separador de MILES y el punto es decimal, que es como
// esta escrito este catalogo (`~ $5,999`, `512,000`, `6.4 Tbps`). Al reves, 5.999 dolares
// valian menos que 29 — se detecto ordenando la tabla de MikroTik en el portal.
const test = require('node:test');
const assert = require('node:assert');
const { cargar } = require('./ayuda/navegador');

const { TABLA } = cargar('public/js/tabla.js');
const n = TABLA.valorNumerico;

test('la coma separa miles: 5.999 dolares valen mas que 29', () => {
  assert.strictEqual(n('~ $5,999'), 5999);
  assert.ok(n('~ $5,999') > n('~ $29'));
});

test('el punto es decimal', () => {
  assert.strictEqual(n('6.4'), 6.4);
  assert.ok(n('6.4') > n('2.5'));
});

test('la unidad se normaliza: 6,4 Tbps es mas que 100 Gbps', () => {
  // Sin esto la columna de caudal se ordenaria por el numero desnudo y un equipo de 6,4
  // Tbps quedaria por debajo de uno de 100 Gbps. Es lo que hace comparable una columna que
  // mezcla Mbps, Gbps y Tbps, como hacen estos catalogos.
  assert.ok(n('6.4 Tbps') > n('100 Gbps'));
  assert.ok(n('100 Gbps') > n('900 Mbps'));
});

test('lee cifras con simbolos y espacios alrededor', () => {
  assert.strictEqual(n('512,000'), 512000);
  assert.strictEqual(n('~ $5,999'), 5999);
});

test('los miles repetidos: 1,400,000 no son 1.400', () => {
  // Regresion encontrada por esta prueba, no por la vista. El patron capturaba un solo grupo
  // de miles, asi que "5,000,000" sesiones valia 5.000 y el equipo mas grande de la tabla se
  // ordenaba entre los mas pequenos. Silencioso: la celda se ve bien, solo el orden miente.
  assert.strictEqual(n('  1,400,000  '), 1400000);
  assert.strictEqual(n('5,000,000'), 5000000);
  assert.ok(n('5,000,000') > n('512,000'));
});

test('un modelo que lleva numeros no es una cantidad', () => {
  // "RB4011iGS+" empieza por letra: es un nombre, y ordenarlo como numero mezclaria la
  // columna de modelo con la de cifras.
  assert.strictEqual(n('RB4011iGS+'), null);
});

test('"sin dato" no es cero: no puede colarse como el menor', () => {
  // Tratar un hueco como 0 mentiria: un equipo sin precio publicado apareceria como el mas
  // barato de la tabla, que en una herramienta de cotizacion es el peor error posible.
  for (const vacio of ['Consultar', '—', '-', 'N/D', '']) {
    assert.ok(n(vacio) === null || Number.isNaN(n(vacio)),
      `"${vacio}" deberia quedar sin valor numerico, no valer 0`);
  }
});
