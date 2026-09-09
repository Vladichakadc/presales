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
const { cargar } = require('./ayuda/navegador.js');

const { BOM } = cargar('public/js/bom.js');

const limpiar = () => BOM.refsExtra().forEach((r) => BOM.quitarRef(r.sku || r.d));

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
  BOM.quitarRef('A-1');
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
