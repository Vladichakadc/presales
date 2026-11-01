'use strict';
// LA MEDICIÓN DE EQUIVALENCIA (2026-11-01). Lo que tiene que cumplir para que un «0 diferencias»
// signifique algo: reconoce los valores de otro contexto (el fallo del comparador del PR #100), ve
// una diferencia de verdad y se niega a dar por buena una medición cuya mutación de control no
// cambia nada.
const test = require('node:test');
const assert = require('node:assert');
const vm = require('vm');
const path = require('path');
const E = require('../scripts/equivalencia');

test('un Map, un Set o una fecha de otro contexto se comparan por su contenido, no como objetos vacíos', () => {
  const otro = vm.runInNewContext('({ m: new Map([["a", 1], ["b", 2]]), s: new Set([2, 1]), d: new Date(0) })');
  const aqui = { m: new Map([['b', 2], ['a', 1]]), s: new Set([1, 2]), d: new Date(0) };
  assert.strictEqual(E.huella(otro), E.huella(aqui), 'mismo contenido, mismo resultado aunque vengan de dos contextos');
  const distinto = vm.runInNewContext('({ m: new Map([["a", 1], ["b", 3]]), s: new Set([2, 1]), d: new Date(0) })');
  assert.notStrictEqual(E.huella(distinto), E.huella(aqui), 'un valor distinto dentro del Map se ve');
  assert.notStrictEqual(E.huella({}), E.huella(aqui.m), 'un Map no es un objeto vacío');
});

test('undefined, NaN, -0 y una excepción son resultados distintos de null, 0 y de otro valor', () => {
  assert.notStrictEqual(E.huella(undefined), E.huella(null));
  assert.notStrictEqual(E.huella(NaN), E.huella(null));
  assert.notStrictEqual(E.huella(-0), E.huella(0));
  assert.notStrictEqual(E.huella({ a: undefined }), E.huella({}));
  const lanza = () => { throw new TypeError('x'); };
  const r = E.comparar(lanza, () => null, [[1]]);
  assert.strictEqual(r.diferentes, 1, 'fallar no es lo mismo que devolver null');
  assert.strictEqual(E.comparar(lanza, lanza, [[1]]).diferentes, 0, 'dos versiones que fallan igual son iguales');
});

test('una medición sin mutación, sin casos o con una mutación que no cambia nada no vale', () => {
  const f = (x) => x * 2;
  assert.throws(() => E.medir({ viejo: f, nuevo: f, casos: [[1]] }), /mutación de control/);
  assert.throws(() => E.medir({ viejo: f, nuevo: f, mutado: (x) => x + 1, casos: [] }), /sin casos/);
  const ciega = E.medir({ viejo: f, nuevo: f, mutado: (x) => x * 2, casos: [[1], [2]] });
  assert.strictEqual(ciega.valido, false, 'si la mutación no da diferencias, el «0» no prueba nada');
  const buena = E.medir({ viejo: f, nuevo: f, mutado: (x) => (x === 2 ? 5 : x * 2), casos: [[1], [2]] });
  assert.deepStrictEqual([buena.diferentes, buena.control, buena.valido], [0, 1, true]);
});

test('el caso de ejemplo carga pqc.js de HEAD y del árbol, y su mutación se ve', () => {
  const caso = require('../scripts/equivalencias/pqc');
  const fns = caso.cargar({ desdeRef: E.desdeRef('HEAD'), actual: E.actual });
  const casos = caso.casos();
  assert.ok(casos.length > 2000, `los modelos de los siete fabricantes por niveles y SO (${casos.length})`);
  const r = E.medir({ ...fns, casos });
  assert.strictEqual(r.diferentes, 0, JSON.stringify(r.ejemplos[0]));
  assert.ok(r.valido && r.control > 10, `la mutación tiene que verse (${r.control})`);
});

test('la orden sale con 0 sin diferencias, 1 con diferencias y 2 si el comparador no ve', () => {
  const callar = (fn) => { const l = console.log; console.log = () => {}; try { return fn(); } finally { console.log = l; } };
  const ruta = path.join(__dirname, '..', 'scripts', 'equivalencias', 'pqc.js');
  assert.strictEqual(callar(() => E.main([ruta, '--ref=HEAD'])), 0);
  const caso = require(ruta);
  const original = caso.cargar;
  try {
    caso.cargar = (h) => { const f = original(h); return { ...f, nuevo: f.mutado }; };
    assert.strictEqual(callar(() => E.main([ruta, '--ref=HEAD'])), 1, 'una versión nueva que cambia algo');
    caso.cargar = (h) => { const f = original(h); return { ...f, mutado: f.nuevo }; };
    assert.strictEqual(callar(() => E.main([ruta, '--ref=HEAD'])), 2, 'una mutación ciega');
  } finally { caso.cargar = original; }
});
