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

/* ── Listas de precios: se casan por SKU ──────────────────────────────────────
   Los dos fallos que motivaron esto, encontrados subiendo la lista de precios real de Fortinet
   («2026Q3 Main Price list_AMER…xlsx»), y los dos del tipo que no rompe nada y solo calla:
     1. Una lista de precios no tiene columna «model» sino SKU/Description/Price, asi que el
        contraste devolvia «no se encontro una columna de modelo» y no validaba nada.
     2. El alias de precio apuntaba a un campo `price` que NO EXISTE en este catalogo (se llama
        `elp`), y `campoDe` solo acepta un alias cuyo destino exista: la columna de precio se
        ignoraba siempre, en silencio. */
const conSku = [
  { model: 'FortiGate 30G', hwSku: 'FG-30G', fw: 4000, elp: '~ $525' },
  { model: 'FortiGate 50G', hwSku: 'FG-50G', fw: 5000, elp: '~ $800' },
];

test('una lista de precios se casa por SKU cuando no hay columna de modelo', () => {
  const r = CONTRASTE.contrastar({
    modelos: conSku,
    filas: [{ SKU: 'FG-30G', Description: 'FortiGate 30G', 'List Price': 600 }],
  });
  assert.ok(!r.error, r.error);
  assert.strictEqual(r.modo, 'sku');
  assert.strictEqual(r.cambios.length, 1);
  // El id es el MODELO del catalogo, no el SKU: es lo que el importador sabe localizar.
  assert.strictEqual(r.cambios[0].id, 'FortiGate 30G');
  assert.strictEqual(r.cambios[0].field, 'elp');
  assert.strictEqual(r.cambios[0].newValue, 600);
});

test('el precio se reconoce: el alias apunta a `elp`, que es como se llama aqui', () => {
  const r = CONTRASTE.contrastar({ modelos: conSku, filas: [{ model: 'FortiGate 30G', precio: 600 }] });
  assert.strictEqual(r.cambios.length, 1, 'la columna de precio ya no se ignora');
  assert.strictEqual(r.cambios[0].field, 'elp');
  // Y el mismo precio con otro formato no es un cambio: «~ $525» y «525» son el mismo dato.
  const igual = CONTRASTE.contrastar({ modelos: conSku, filas: [{ model: 'FortiGate 30G', precio: '$525' }] });
  assert.strictEqual(igual.cambios.length, 0);
  assert.strictEqual(igual.sinCambio, 1);
});

test('en modo SKU las filas que no casan se cuentan, no se listan como altas', () => {
  // Una price list AMER trae miles de referencias de licencias, soporte y accesorios. Listarlas
  // como «altas» sepultaria los pocos cambios reales bajo miles de lineas de ruido.
  const filas = [
    { SKU: 'FG-30G', 'List Price': 600 },
    { SKU: 'FC-10-0030G-950-02-12', 'List Price': 200 }, // licencia FortiGuard
    { SKU: 'SP-FG30G-PSU', 'List Price': 45 }, // accesorio
  ];
  const r = CONTRASTE.contrastar({ modelos: conSku, filas });
  assert.strictEqual(r.cambios.length, 1);
  assert.strictEqual(r.altas.length, 0, 'nada de altas en modo SKU');
  assert.strictEqual(r.sinCasar, 2, 'las otras dos se cuentan');
});

test('sin columna de modelo NI de SKU se explica, en vez de callar', () => {
  const r = CONTRASTE.contrastar({ modelos: conSku, filas: [{ foo: 1, bar: 2 }] });
  assert.match(r.error, /ni una columna de modelo ni una de SKU/i);
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
