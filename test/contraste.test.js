'use strict';
// Contraste de un documento cargado contra el catálogo (public/js/contraste.js).
//
// Es la vista previa que se abre al subir una fuente tabular: enseña qué trae de nuevo el
// documento SIN IA. Lo que se prueba aquí es exactamente lo que la haría mentir si fallara:
//   1. Reconocer una columna que NO es un campo del catálogo (adivinar un mapeo).
//   2. Marcar como cambio un valor que solo difiere en formato («10» vs «10 Gbps»).
//   3. Aplicar un alta sola, o proponer borrar un campo porque el documento venga vacío.
//   4. No casar «SRX380» con «Juniper SRX380» (mismo equipo, otro nombre).

const test = require('node:test');
const assert = require('node:assert');
const { cargar } = require('./ayuda/navegador.js');

const { CONTRASTE } = cargar('public/js/contraste.js');

// Un catálogo mínimo: dos campos reales (fwd, ipsec) y nada más.
const modelos = [
  { model: 'AR650', fwd: 620, ipsec: 200 },
  { model: 'AR6700', fwd: 1300, ipsec: 800 },
];

test('normalizarModelo iguala nombre con y sin prefijo y separadores', () => {
  assert.strictEqual(CONTRASTE.normalizarModelo('Juniper SRX380'), CONTRASTE.normalizarModelo('SRX-380'));
  assert.strictEqual(CONTRASTE.normalizarModelo('  AR650 '), 'ar650');
});

test('mismoValor compara por valor, no por formato', () => {
  assert.ok(CONTRASTE.mismoValor('620', 620));
  assert.ok(CONTRASTE.mismoValor('10 Gbps', '10gbps'));
  assert.ok(CONTRASTE.mismoValor('5,999', '5999'));
  assert.ok(!CONTRASTE.mismoValor('620', '630'));
});

test('un valor distinto en columna reconocida es un cambio', () => {
  const r = CONTRASTE.contrastar({
    modelos,
    filas: [{ model: 'AR650', fwd: 700 }],
  });
  assert.strictEqual(r.cambios.length, 1);
  assert.strictEqual(r.cambios[0].id, 'AR650');
  assert.strictEqual(r.cambios[0].field, 'fwd');
  assert.strictEqual(r.cambios[0].oldValue, 620);
  assert.strictEqual(r.cambios[0].newValue, 700);
});

test('un valor igual salvo el formato NO es un cambio', () => {
  const r = CONTRASTE.contrastar({
    modelos,
    filas: [{ model: 'AR650', fwd: '620 Mbps' }],
  });
  assert.strictEqual(r.cambios.length, 0);
  assert.strictEqual(r.sinCambio, 1);
});

test('una columna que no es campo del catálogo se ignora, no se adivina', () => {
  const r = CONTRASTE.contrastar({
    modelos,
    filas: [{ model: 'AR650', fwd: 700, 'columna rara': 'x' }],
  });
  assert.deepStrictEqual(Array.from(r.columnasIgnoradas), ['columna rara']);
});

test('un alias humano solo se aplica si el campo destino existe', () => {
  // `throughput` → `fwd` (existe): se reconoce. `precio` → `price` (no existe en estos
  // modelos): se ignora, no inventa un campo.
  const r = CONTRASTE.contrastar({
    modelos,
    filas: [{ model: 'AR650', throughput: 700, precio: '$999' }],
  });
  assert.strictEqual(r.cambios.length, 1);
  assert.strictEqual(r.cambios[0].field, 'fwd');
  assert.ok(Array.from(r.columnasIgnoradas).includes('precio'));
});

test('un modelo que no está en el catálogo es un alta, nunca un cambio', () => {
  const r = CONTRASTE.contrastar({
    modelos,
    filas: [{ model: 'AR9999', fwd: 5000 }],
  });
  assert.strictEqual(r.cambios.length, 0);
  assert.strictEqual(r.altas.length, 1);
  assert.strictEqual(r.altas[0].id, 'AR9999');
});

test('una celda vacía en el documento no propone borrar el campo', () => {
  const r = CONTRASTE.contrastar({
    modelos,
    filas: [{ model: 'AR650', fwd: '', ipsec: '   ' }],
  });
  assert.strictEqual(r.cambios.length, 0);
});

test('casa el nombre con prefijo de fabricante', () => {
  const r = CONTRASTE.contrastar({
    modelos,
    filas: [{ model: 'Huawei AR650', fwd: 700 }],
  });
  assert.strictEqual(r.cambios.length, 1);
  assert.strictEqual(r.cambios[0].id, 'AR650');
});

test('sin columna de modelo devuelve error, no adivina', () => {
  const r = CONTRASTE.contrastar({ modelos, filas: [{ foo: 1, bar: 2 }] });
  assert.ok(r.error);
});

test('comoPropuesta emite la forma del importador y excluye las altas', () => {
  const cambios = [{ id: 'AR650', field: 'fwd', oldValue: 620, newValue: 700 }];
  const p = CONTRASTE.comoPropuesta('huawei', cambios, 'https://e.huawei.com/x');
  assert.strictEqual(p.vendor, 'huawei');
  assert.strictEqual(p.cambios.length, 1);
  const c = p.cambios[0];
  assert.strictEqual(c.target, 'product');
  assert.strictEqual(c.type, 'UPDATE');
  assert.strictEqual(c.id, 'AR650');
  assert.strictEqual(c.field, 'fwd');
  assert.strictEqual(c.oldValue, '620');
  assert.strictEqual(c.newValue, '700');
  assert.strictEqual(c.sourceUrl, 'https://e.huawei.com/x');
});

test('comoPropuesta escribe N/A cuando el valor anterior está vacío', () => {
  const p = CONTRASTE.comoPropuesta('huawei', [{ id: 'AR650', field: 'typ', oldValue: null, newValue: 45 }], '');
  assert.strictEqual(p.cambios[0].oldValue, 'N/A');
});
