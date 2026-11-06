'use strict';
// El importador de la lista de Fortinet extrae también FortiWiFi y FortiExtender (2026-11-06,
// mejora aprobada por el dueño al cerrar el PR #140). Sin precio verificado con que anclar, el
// ancla es el SKU exacto de su ficha DENTRO de un bloque que nombra el mismo modelo. Se prueba con
// una lista sintética: la firmada no entra al repositorio y estas filas no son sus cifras.
const test = require('node:test');
const assert = require('node:assert');

const { extraerSinFortiGate, objetivos, CODIGOS_RC } = require('../scripts/importar-skus-fortinet.js');
const V = require('../server/seed/legacyData/fortinetVariantes.js');

// Columnas como en la hoja DataSet: SKU, Price, Product Type, Item, Vendor Description, Short Description, Product.
const IDX = { sku: 0, precio: 1, tipo: 2, item: 3, vd: 4, sd: 5, prod: 6 };
const fila = (sku, precio, tipo, prod, sd) => [sku, precio, tipo, '', '', sd || `desc ${sku}`, prod];
const DATOS = { variantes: V.VARIANTES, extenders: V.FORTIEXTENDER.modelos };
const extraer = (filas) => extraerSinFortiGate(filas, IDX, DATOS);

test('busca los siete FortiWiFi y los seis FortiExtender, no las variantes que ya salen de su FortiGate', () => {
  const ids = objetivos(DATOS).map((o) => o.id);
  const sinLic = V.VARIANTES.filter((v) => !v.lic).map((v) => v.id);
  assert.deepStrictEqual(ids, [...sinLic, ...V.FORTIEXTENDER.modelos.map((x) => x.id)]);
  assert.ok(!ids.includes('FortiGate 40F-3G4G'));
  assert.strictEqual(ids.length, 8 + 6);
});

test('un FortiWiFi con [RC] entra por cualquiera de los doce códigos regionales, y solo por ellos', () => {
  const o = objetivos(DATOS).find((x) => x.id === 'FortiWiFi 30G');
  for (const c of CODIGOS_RC) assert.ok(o.esHw(`FWF-30G-${c}`), c);
  assert.ok(!o.esHw('FWF-30G-C'));
  assert.ok(!o.esHw('FWF-30G'));
  assert.ok(!o.esHw('FWF-30G-AB'));
});

test('extrae el bloque anclado: hardware por código regional y sus licencias, sin repetir', () => {
  const { salida, rechazos } = extraer([
    fila('FWF-30G-A', 900, 'HW', 'FortiWiFi-30G', 'HW FWF-30G-A'),
    fila('FWF-30G-J', 900, 'HW', 'FortiWiFi-30G'),
    fila('FC-10-W030G-809-02-12', 150, 'Service', 'FortiWiFi-30G'),
    fila('FC-10-W030G-809-02-12', 150, 'Service', 'FortiWiFi-30G'),
    fila('FWF-30G-BDL-950-36', '', 'HW', 'FortiWiFi-30G'),
  ]);
  assert.deepStrictEqual(salida['FortiWiFi 30G'].map((r) => r.sku),
    ['FWF-30G-A', 'FWF-30G-J', 'FC-10-W030G-809-02-12', 'FWF-30G-BDL-950-36']);
  assert.strictEqual(salida['FortiWiFi 30G'][0].p, 900);
  assert.strictEqual(salida['FortiWiFi 30G'][3].p, null, 'un precio vacío es «sin dato», nunca 0');
  assert.ok(rechazos.some((r) => r.startsWith('FortiWiFi 31G: sin ninguna fila')));
});

test('el nombre corto no arrastra las filas de un modelo más largo (FWF-50G frente a FWF-50G-5G-II)', () => {
  const { salida } = extraer([
    fila('FWF-50G-A', 1000, 'HW', 'FortiWiFi-50G'),
    fila('FWF-50G-5G-II', 2500, 'HW', 'FortiWiFi-50G-5G-II'),
    fila('FC-10-W50G5-809-02-12', 300, 'Service', 'FortiWiFi-50G-5G-II'),
    fila('FWF-70G-A', 1200, 'HW', 'FortiWiFi-70G'),
    fila('FWF-70G-POE', 1600, 'HW', 'FortiWiFi-70G-POE'),
  ]);
  assert.deepStrictEqual(salida['FortiWiFi 50G'].map((r) => r.sku), ['FWF-50G-A']);
  assert.deepStrictEqual(salida['FortiWiFi 50G-5G-II'].map((r) => r.sku), ['FWF-50G-5G-II', 'FC-10-W50G5-809-02-12']);
  assert.deepStrictEqual(salida['FortiWiFi 70G'].map((r) => r.sku), ['FWF-70G-A']);
  assert.deepStrictEqual(salida['FortiWiFi 70G-POE'].map((r) => r.sku), ['FWF-70G-POE']);
});

test('sin el SKU de hardware de su ficha, el bloque no entra aunque nombre el modelo', () => {
  const { salida, rechazos } = extraer([
    fila('FC-10-W030G-809-02-12', 150, 'Service', 'FortiWiFi-30G'),
    fila('FWF-30G-C', 900, 'HW', 'FortiWiFi-30G'),
  ]);
  assert.ok(!('FortiWiFi 30G' in salida));
  assert.ok(rechazos.some((r) => r.startsWith('FortiWiFi 30G: ninguna fila del bloque trae su SKU')));
});

test('un SKU de hardware sin su nombre en el texto no ancla: hacen falta los dos', () => {
  const { salida } = extraer([fila('FEX-211G', 700, 'HW', 'Accesorio')]);
  assert.ok(!('FortiExtender 211G' in salida));
});

test('un bloque que trae el hardware de otro modelo se rechaza entero', () => {
  const { salida, rechazos } = extraer([
    fila('FEX-211G', 700, 'HW', 'FortiExtender-211G'),
    fila('FEX-101G', 500, 'HW', 'FortiExtender-211G'),
  ]);
  assert.ok(!('FortiExtender 211G' in salida));
  assert.ok(rechazos.some((r) => /FortiExtender 211G: CONTRADICE .*FEX-101G/.test(r)));
});

test('los FortiExtender anclan por su SKU exacto, también los de dos regiones', () => {
  const { salida } = extraer([
    fila('FEX-101G', 500, 'HW', 'FortiExtender-101G'),
    fila('FC-10-X101G-247-02-12', 80, 'Service', 'FortiExtender-101G'),
    fila('FEW-50G-AM', 1900, 'HW', 'FortiExtender-WAN-50G'),
    fila('FEW-50G-EA', 1900, 'HW', 'FEW-50G'),
    fila('FEX-201F-AM', 600, 'HW', 'FortiExtender-201F'),
  ]);
  assert.deepStrictEqual(salida['FortiExtender 101G'].map((r) => r.sku), ['FEX-101G', 'FC-10-X101G-247-02-12']);
  assert.deepStrictEqual(salida['FortiExtender WAN 50G'].map((r) => r.sku), ['FEW-50G-AM', 'FEW-50G-EA']);
  // La ficha da el 201F solo en EA: el AM no es su SKU y el bloque no ancla.
  assert.ok(!('FortiExtender 201F' in salida));
});
