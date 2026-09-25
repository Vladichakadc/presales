'use strict';
// La cobertura del contraste: qué módulos de `public/js/` ejercita de verdad una corrida.
//
// POR QUÉ SE MIDE Y NO SE DECLARA. La propuesta original era que cada caso declarara
// `cubre: ['ficha.js']`. Se descartó por su propio riesgo: un caso que declare cubrir
// `bom.js` sin conducir una línea del BOM da una cobertura FALSA, y eso es peor que no tener
// el dato — invita a no escribir el caso que falta. Es la forma exacta del `noAplica`
// deducido y del `estable` puesto a ojo. Chromium no se puede rellenar a mano.
//
// Aquí se fija la agregación, que es la parte con regla. Lo que NO se prueba aquí: que
// Chromium reporte bien (eso es la corrida) ni que la cifra sea buena (eso es una decisión).
const test = require('node:test');
const assert = require('node:assert');
const { agregar, informe, UMBRAL_ROZADO } = require('../scripts/ayuda/cobertura');

// Forma mínima de lo que devuelve `page.coverage.stopJSCoverage()`.
const entrada = (modulo, fns) => ({
  url: `http://127.0.0.1:4000/js/${modulo}`,
  functions: fns.map(([inicio, veces]) => ({ ranges: [{ startOffset: inicio, endOffset: inicio + 10, count: veces }] })),
});

test('una función cuenta como ejecutada si algún rango suyo corrió', () => {
  const [f] = agregar([entrada('a.js', [[0, 1], [10, 0], [20, 3]])], ['a.js']);
  assert.strictEqual(f.total, 3);
  assert.strictEqual(f.usadas, 2);
  assert.strictEqual(f.pct, 67);
});

test('se UNE entre cargas de página, no se toma la mejor', () => {
  // Es el caso de un módulo compartido: en la pantalla de Nokia corre una función y en la de
  // Fortinet otra distinta. Quedarse con la mejor página diría menos de lo que la corrida
  // hizo; quedarse con la última, todavía menos.
  const filas = agregar([
    entrada('bom.js', [[0, 1], [10, 0], [20, 0]]),
    entrada('bom.js', [[0, 1], [10, 2], [20, 0]]),
  ], ['bom.js']);
  assert.strictEqual(filas[0].usadas, 2, 'la de la primera página MÁS la de la segunda');
  assert.strictEqual(filas[0].total, 3, 'y el total no se duplica: la misma función es una');
});

test('«sin conducir» no es «0 %», y son estados distintos', () => {
  // Un módulo que ninguna pantalla carga no se midió. Reportarlo como 0 % afirmaría que se
  // ejercitó cero de algo que se miró, y nadie lo miró — el tercer estado de siempre.
  const filas = agregar([entrada('a.js', [[0, 0], [10, 0]])], ['a.js', 'nadie.js']);
  const a = filas.find((f) => f.modulo === 'a.js');
  const n = filas.find((f) => f.modulo === 'nadie.js');
  assert.strictEqual(a.estado, 'rozado');
  assert.strictEqual(a.pct, 0, 'cargado y con cero funciones corridas SÍ es 0 %');
  assert.strictEqual(n.estado, 'sin conducir');
  assert.strictEqual(n.pct, null, '«sin conducir» no tiene porcentaje, porque no se midió');
});

test('el umbral separa rozado de ejercitado, y está declarado', () => {
  const bajo = agregar([entrada('a.js', Array.from({ length: 100 }, (_, i) => [i * 10, i < UMBRAL_ROZADO - 1 ? 1 : 0]))], ['a.js']);
  const alto = agregar([entrada('a.js', Array.from({ length: 100 }, (_, i) => [i * 10, i < UMBRAL_ROZADO ? 1 : 0]))], ['a.js']);
  assert.strictEqual(bajo[0].estado, 'rozado');
  assert.strictEqual(alto[0].estado, 'ejercitado');
});

test('lo peor sale primero: sin conducir, luego de menos a más ejercitado', () => {
  // Un informe que obliga a desplazarse para ver el hueco es un informe que no avisa.
  const filas = agregar([
    entrada('alto.js', [[0, 1], [10, 1]]),
    entrada('bajo.js', [[0, 1], [10, 0], [20, 0], [30, 0], [40, 0]]),
  ], ['alto.js', 'bajo.js', 'nadie.js']);
  assert.deepStrictEqual(filas.map((f) => f.modulo), ['nadie.js', 'bajo.js', 'alto.js']);
});

test('scripts de otro origen o que no son de /js/ se ignoran', () => {
  const filas = agregar([
    { url: 'https://cdn.ajeno.com/js/analitica.js', functions: [{ ranges: [{ startOffset: 0, endOffset: 5, count: 1 }] }] },
    { url: 'http://127.0.0.1:4000/vendor/xlsx.js', functions: [{ ranges: [{ startOffset: 0, endOffset: 5, count: 1 }] }] },
  ], ['a.js']);
  assert.strictEqual(filas[0].estado, 'sin conducir', 'ninguno de los dos cuenta como cobertura de public/js/');
});

test('el informe lleva su procedencia dentro', () => {
  // Una cobertura de hace meses sigue leyéndose como un hecho de hoy. Misma regla que
  // `medidoEn` en cada caso y que la fecha de cada fuente del catálogo.
  const d = informe([], { commit: 'abc1234', fecha: '2026-09-16' });
  assert.strictEqual(d.medidoEn.commit, 'abc1234');
  assert.strictEqual(d.medidoEn.fecha, '2026-09-16');
  assert.strictEqual(d.umbralRozado, UMBRAL_ROZADO, 'el umbral viaja con el dato: sin él, el estado no se puede reinterpretar');
});

test('el artefacto del repositorio, si está, tiene la forma que el inventario espera', () => {
  // `npm run catalogo` lo lee sin abrir un navegador. Si la forma cambiara, la sección se
  // caería en el sitio equivocado — este es el freno barato, como pantallas-campos.
  const fs = require('fs');
  const path = require('path');
  const ruta = path.join(__dirname, '..', 'scripts', 'contrastes', 'cobertura.lock.json');
  if (!fs.existsSync(ruta)) return; // aún no medida: no es un fallo
  const d = JSON.parse(fs.readFileSync(ruta, 'utf8'));
  assert.ok(d.medidoEn && d.medidoEn.commit && d.medidoEn.fecha, 'falta la procedencia');
  assert.strictEqual(typeof d.umbralRozado, 'number');
  assert.ok(Array.isArray(d.modulos) && d.modulos.length);
  for (const m of d.modulos) {
    assert.ok(['sin conducir', 'rozado', 'ejercitado'].includes(m.estado), `estado desconocido: ${m.estado}`);
    if (m.estado === 'sin conducir') assert.strictEqual(m.pct, null);
    else assert.ok(typeof m.pct === 'number' && m.total > 0);
  }
});
