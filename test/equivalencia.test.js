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

// EN CI (2026-11-01): cada PR vuelve a medir los casos cuyos archivos toca.
test('las aceptaciones salen de la descripción del PR, con motivo, y solo con ese formato', () => {
  const a = E.aceptaciones('Resumen\nequivalencia-acepta: aruba-estado: el nivel pasa a exigir más caudal\n'
    + 'equivalencia-acepta: pqc: corto\n  equivalencia-acepta:fortinet-porque:  texto nuevo de la explicación del HA \nacepta: otro: nada');
  assert.deepStrictEqual(JSON.parse(JSON.stringify(a)), {
    'aruba-estado': 'el nivel pasa a exigir más caudal',
    'fortinet-porque': 'texto nuevo de la explicación del HA',
  }, 'un motivo de menos de diez caracteres no acepta nada');
  assert.deepStrictEqual(E.aceptaciones(undefined), {});
});

test('un caso se mide si el PR toca un archivo suyo o algo dentro de una carpeta suya', () => {
  assert.ok(E.tocaCaso(['public/js/pqc.js'], ['README.md', 'public/js/pqc.js']));
  assert.ok(E.tocaCaso(['public/js/'], ['public/js/bom.js']));
  assert.ok(!E.tocaCaso(['public/js/pqc.js'], ['public/js/pqc-otro.js']));
  assert.ok(!E.tocaCaso([], ['public/js/pqc.js']));
});

test('cada caso declara qué archivos mide, y existen', () => {
  const fs = require('fs');
  const dir = path.join(__dirname, '..', 'scripts', 'equivalencias');
  const casos = fs.readdirSync(dir).filter((f) => f.endsWith('.js'));
  assert.ok(casos.length >= 4);
  for (const f of casos) {
    const c = require(path.join(dir, f));
    assert.ok(Array.isArray(c.mide) && c.mide.length, `${f}: sin \`mide\`, --todos no sabe cuándo medirlo`);
    for (const r of c.mide) assert.ok(fs.existsSync(path.join(__dirname, '..', r)), `${f}: mide ${r}, que no existe`);
  }
});

test('verificar.yml mide las equivalencias en cada PR, con la descripción como variable y el historial entero', () => {
  const fs = require('fs');
  const yml = fs.readFileSync(path.join(__dirname, '..', '.github', 'workflows', 'verificar.yml'), 'utf8');
  assert.match(yml, /fetch-depth: 0/, 'sin historial no hay base común con main');
  const i = yml.indexOf('- name: Equivalencias');
  assert.ok(i > 0, 'falta el paso de las equivalencias');
  const paso = yml.slice(i, yml.indexOf('\n      - name:', i + 10) > 0 ? yml.indexOf('\n      - name:', i + 10) : undefined);
  assert.match(paso, /if: github\.event_name == 'pull_request'/);
  assert.match(paso, /PR_BODY: \$\{\{ github\.event\.pull_request\.body \}\}/);
  assert.match(paso, /run: node scripts\/equivalencia\.js --todos --base="origin\/\$BASE_REF"/);
  assert.doesNotMatch(paso.slice(paso.indexOf('run:')), /\$\{\{/, 'la descripción del PR nunca se interpola en el shell (inyección)');
  assert.doesNotMatch(paso, /continue-on-error/);
});
