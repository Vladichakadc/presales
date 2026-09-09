'use strict';
// Referencias anadidas a mano al BOM (public/js/bom.js).
//
// Existen porque ver una referencia no basta: un FortiGate se vende casi siempre con su bundle
// de FortiCare, y esa linea habia que teclearla a mano en el cotizador. Lo que se prueba aqui es
// lo que las haria inutiles o mentirosas:
//   1. Que SOBREVIVAN al repintado del BOM. El BOM se repinta en cada cambio de escenario; si
//      vivieran en el array de filas de la pagina, mover el caudal las borraria en silencio —
//      exactamente el modo de fallo que ya tuvo `llevarABom`.
//   2. Que SUMEN al total. Un bundle en la cotizacion que no sume seria un total que no
//      corresponde a lo que la cotizacion lleva dentro.
//   3. Que anadir dos veces sume cantidad en vez de duplicar el renglon.

const test = require('node:test');
const assert = require('node:assert');
const { cargar, cargarCon } = require('./ayuda/navegador.js');

// El realm del vm trae su propio localStorage: es de ahi de donde hay que vaciar.
const realmBase = cargar('public/js/bom.js');
const { BOM } = realmBase;

// Se vacia por almacenamiento y no por quitarRef: la clave de una referencia es
// `fabricante|sku`, y reconstruirla aqui duplicaria esa regla en la prueba.
const limpiar = () => realmBase.localStorage.removeItem('presales-bom-refs');

test('anadir una referencia la guarda; anadirla otra vez suma cantidad', () => {
  limpiar();
  BOM.agregarRef({ sku: 'FG-60F-BDL-950-36', d: '3 Year HW, FC Premium & UTP', p: 3130, v: 'Fortinet' });
  assert.strictEqual(BOM.refsExtra().length, 1);
  BOM.agregarRef({ sku: 'FG-60F-BDL-950-36', d: '3 Year HW, FC Premium & UTP', p: 3130, v: 'Fortinet' });
  const lista = BOM.refsExtra();
  assert.strictEqual(lista.length, 1, 'no duplica el renglon');
  assert.strictEqual(lista[0].qty, 2, 'suma cantidad');
  limpiar();
});

test('la referencia entra en la tabla del BOM, en su grupo, y SUMA al total', () => {
  limpiar();
  // Un BOM con un equipo de 1.000 y una referencia de 250 tiene que totalizar 1.250: si la
  // referencia no entrara en el calculo, el total mentiria sobre lo que lleva dentro.
  const filas = [{ cat: 'Equipo', desc: 'FortiGate 60F', sku: 'FG-60F', qty: 1, unit: 1000 }];
  const sinRef = BOM.renderTabla(filas, {});
  assert.ok(!sinRef.includes('Referencias añadidas'));

  BOM.agregarRef({ sku: 'FC-10-0060F-950-02-36', d: 'UTP 3 años', p: 250, v: 'Fortinet' });
  const conRef = BOM.renderTabla(filas, {});
  assert.ok(conRef.includes('Referencias añadidas'), 'aparece su grupo');
  assert.ok(conRef.includes('FC-10-0060F-950-02-36'), 'con su SKU');
  assert.ok(conRef.includes('1,250') || conRef.includes('1250'), 'y suma al total: ' + (conRef.match(/[\d,]+<\/td><\/tr>\s*<\/tbody>/) || [''])[0]);
  limpiar();
});

test('la referencia no depende de las filas que pase la pagina: sobrevive al repintado', () => {
  limpiar();
  BOM.agregarRef({ sku: 'FG-X-BDL', d: 'bundle', p: 10, v: 'Fortinet' });
  // Se repinta con OTRAS filas, como haria un cambio de escenario que elige otro equipo.
  const otro = BOM.renderTabla([{ cat: 'Equipo', desc: 'FortiGate 120G', sku: 'FG-120G', qty: 1, unit: 5511 }], {});
  assert.ok(otro.includes('FG-X-BDL'), 'la referencia sigue ahi tras repintar con otro equipo');
  limpiar();
});

test('quitar la referencia la retira de verdad', () => {
  limpiar();
  BOM.agregarRef({ sku: 'A-1', d: 'uno', p: 1, v: 'Fortinet' });
  BOM.agregarRef({ sku: 'A-2', d: 'dos', p: 2, v: 'Fortinet' });
  // La clave es `fabricante|sku`: con una lista compartida, el sku suelto podria pertenecer
  // a dos fabricantes.
  BOM.quitarRef('fortinet|A-1');
  const lista = BOM.refsExtra();
  assert.strictEqual(lista.length, 1);
  assert.strictEqual(lista[0].sku, 'A-2');
  limpiar();
});

test('una referencia sin precio no se cuenta como cotizada', () => {
  limpiar();
  // Las variantes de Aruba van sin precio: tienen que salir como «consultar», no como 0.
  BOM.agregarRef({ sku: null, d: 'EC-XS-FIPS', p: null, v: 'Aruba' });
  const html = BOM.renderTabla([{ cat: 'Equipo', desc: 'EC-XS', sku: 'EC-XS', qty: 1, unit: 500 }], {});
  assert.ok(html.includes('EC-XS-FIPS'));
  assert.ok(/consultar/i.test(html), 'la linea sin precio se declara, no vale 0');
  limpiar();
});

/* ── UNA SOLA LISTA PARA LOS SIETE FABRICANTES ─────────────────────────────────
   La primera version guardaba por pagina, asi que un bundle de Fortinet no llegaba al
   cotizador si el envio se hacia desde la pagina de Aruba: una perdida silenciosa, justo en la
   pantalla que existe para armar una cotizacion multi-fabricante. */

test('las referencias de dos fabricantes conviven en la misma lista', () => {
  limpiar();
  BOM.fijarVendor('fortinet');
  BOM.agregarRef({ sku: 'FG-60F-BDL', d: 'bundle Forti', p: 100, v: 'fortinet' });
  BOM.fijarVendor('aruba');
  BOM.agregarRef({ sku: 'EC-XS-SP', d: 'variante Aruba', p: null, v: 'aruba' });
  assert.strictEqual(BOM.refsExtra().length, 2, 'las dos sobreviven');
  limpiar();
});

test('el BOM de un fabricante muestra SOLO las suyas', () => {
  limpiar();
  BOM.agregarRef({ sku: 'FG-60F-BDL', d: 'bundle Forti', p: 100, v: 'fortinet' });
  BOM.agregarRef({ sku: 'EC-XS-SP', d: 'variante Aruba', p: null, v: 'aruba' });

  BOM.fijarVendor('fortinet');
  const enForti = BOM.renderTabla([], {});
  assert.ok(enForti.includes('FG-60F-BDL'), 'la de Fortinet se ve en Fortinet');
  assert.ok(!enForti.includes('EC-XS-SP'), 'la de Aruba NO: no corresponde a ese equipo');

  BOM.fijarVendor('aruba');
  const enAruba = BOM.renderTabla([], {});
  assert.ok(enAruba.includes('EC-XS-SP'));
  assert.ok(!enAruba.includes('FG-60F-BDL'));
  limpiar();
});

test('quitar una referencia no arrastra la del otro fabricante con el mismo codigo', () => {
  // Con una lista compartida, dos fabricantes pueden traer el mismo codigo: la clave es
  // `fabricante|sku`, no el sku suelto.
  limpiar();
  BOM.agregarRef({ sku: 'X-1', d: 'de Fortinet', p: 1, v: 'fortinet' });
  BOM.agregarRef({ sku: 'X-1', d: 'de Aruba', p: 2, v: 'aruba' });
  assert.strictEqual(BOM.refsExtra().length, 2, 'mismo codigo, fabricantes distintos: dos lineas');
  BOM.quitarRef('fortinet|X-1');
  const quedan = BOM.refsExtra();
  assert.strictEqual(quedan.length, 1);
  assert.strictEqual(quedan[0].v, 'aruba', 'sobrevive la del otro fabricante');
  limpiar();
});

test('migra lo guardado bajo la clave vieja y no lo pierde', () => {
  // La migracion corre UNA vez por carga del modulo, asi que se prueba en un realm propio con
  // la clave vieja ya puesta — que es exactamente la situacion de quien uso la version
  // anterior y abre la nueva.
  const previo = {
    'presales-bom-refs:/prueba.html':
      JSON.stringify([{ sku: 'VIEJA-1', d: 'guardada antes', p: 5, qty: 3, v: 'fortinet' }]),
  };
  const realm = cargarCon(previo, 'public/js/bom.js');
  const tras = realm.BOM.refsExtra();
  assert.ok(tras.some((r) => r.sku === 'VIEJA-1'), 'la referencia vieja se conservo');
  assert.strictEqual(tras.find((r) => r.sku === 'VIEJA-1').qty, 3, 'con su cantidad');
  assert.strictEqual(realm.localStorage.getItem('presales-bom-refs:/prueba.html'), null,
    'y la clave vieja se limpia, para no migrar dos veces');
});

/* ── CANTIDAD EDITABLE ─────────────────────────────────────────────────────── */

test('la cantidad se puede fijar, y el subtotal la sigue', () => {
  limpiar();
  BOM.agregarRef({ sku: 'FC-10-UTP-36', d: 'UTP 3 años', p: 250, v: 'fortinet' });
  BOM.fijarVendor('fortinet');
  BOM.cantidadRef('fortinet|FC-10-UTP-36', 4);
  assert.strictEqual(BOM.refsExtra()[0].qty, 4);
  const html = BOM.renderTabla([], {});
  assert.ok(html.includes('1,000'), 'el subtotal es 4 x 250 = 1.000');
  limpiar();
});

test('una cantidad menor que 1 quita la linea, que es lo que significa escribir 0', () => {
  limpiar();
  BOM.agregarRef({ sku: 'A-9', d: 'algo', p: 10, v: 'fortinet' });
  BOM.cantidadRef('fortinet|A-9', 0);
  assert.strictEqual(BOM.refsExtra().length, 0);
  limpiar();
});

test('una cantidad no numerica no corrompe la linea', () => {
  limpiar();
  BOM.agregarRef({ sku: 'A-8', d: 'algo', p: 10, v: 'fortinet' });
  BOM.cantidadRef('fortinet|A-8', 'abc');
  // NaN no es una cantidad: se trata como quitarla, nunca se guarda un qty invalido que
  // haria que el subtotal saliera NaN en una cotizacion.
  assert.strictEqual(BOM.refsExtra().length, 0);
  limpiar();
});

test('solo las referencias anadidas traen campo de cantidad, no las que calcula la pagina', () => {
  limpiar();
  BOM.fijarVendor('fortinet');
  BOM.agregarRef({ sku: 'B-1', d: 'bundle', p: 5, v: 'fortinet' });
  const html = BOM.renderTabla([{ cat: 'Equipo', desc: 'FortiGate 60F', sku: 'FG-60F', qty: 2, unit: 1000 }], {});
  const campos = (html.match(/data-bom-cant/g) || []).length;
  assert.strictEqual(campos, 1, 'solo la referencia anadida es editable');
  limpiar();
});
