'use strict';
// El importador de la lista de precios de Fortinet (`npm run skus`), con una lista SINTETICA: la
// lista firmada no entra al repositorio, y estas filas no son de ninguna edicion real (los
// codigos de licencia PRB… y los precios son inventados para la prueba). Lo que se fija es el
// anclaje, no cifras:
//   · FortiGate: el bloque entra si trae su hwSku con el precio del catalogo; un nombre parecido
//     (30G2) no arrastra filas; las variantes no tienen bloque propio (van en el de su base).
//   · FortiWiFi (2026-11-06): nombre y SKU de su ficha, con [RC] por un codigo publicado; un
//     codigo regional que la ficha no publica rechaza el bloque; FortiWiFi-50G no se queda las
//     filas de FortiWiFi-50G-5G-II; el codigo de licencias se sugiere, nunca se escribe.
//   · FortiExtender (2026-11-06): nombre o codigo de su FortiCare, y algun SKU de su ficha.
const test = require('node:test');
const assert = require('node:assert');

const { extraer, contradiceRc } = require('../scripts/importar-skus-fortinet.js');
const V = require('../server/seed/legacyData/fortinetVariantes.js');

const CAB = ['Item', 'SKU', 'Vendor Description', 'Short Description', 'Product', 'Product Type', 'Price'];
const fila = (producto, sku, d, tipo, precio) => [producto, sku, d, d, producto, tipo, precio];
const LISTA = [
  ['Fortinet price list (sintetica)'],
  ['Direccion postal'],
  CAB,
  fila('FortiGate-30G', 'FG-30G', 'HW FG-30G', 'HW', 500),
  fila('FortiGate-30G', 'FC-10-0030G-809-02-12', '1 Year Enterprise Protection', 'Service', 120),
  fila('FortiGate-30G2', 'FG-30G2', 'HW FG-30G2', 'HW', 999),
  fila('FortiGate-40F', 'FG-40F', 'HW FG-40F', 'HW', 600),
  fila('FortiGate-40F-3G4G', 'FG-40F-3G4G', 'HW FG-40F-3G4G', 'HW', 900),
  // FortiWiFi 50G: dos codigos regionales publicados, licencias y combinado.
  fila('FortiWiFi-50G', 'FWF-50G-A', 'HW FWF-50G-A', 'HW', 800),
  fila('FortiWiFi-50G', 'FWF-50G-E', 'HW FWF-50G-E', 'HW', 800),
  fila('FortiWiFi-50G', 'FC-10-PRB50-809-02-12', '1 Year Enterprise Protection', 'Service', 200),
  fila('FortiWiFi-50G', 'FC-10-PRB50-950-02-36', '3 Year Unified Threat Protection', 'Service', 400),
  fila('FortiWiFi-50G', 'FWF-50G-BDL-809-12', '1 Year HW, FC Premium & ENT BDL', 'HW', 1000),
  fila('FortiWiFi-50G', 'FWF-50G-A', 'HW FWF-50G-A (repetida)', 'HW', 800),
  // La de Wi-Fi y 5G: no es de la 50G.
  fila('FortiWiFi-50G-5G-II', 'FWF-50G-5G-II', 'HW FWF-50G-5G-II', 'HW', 1900),
  // FortiWiFi 30G con un codigo regional que la ficha no publica.
  fila('FortiWiFi-30G', 'FWF-30G-A', 'HW FWF-30G-A', 'HW', 450),
  fila('FortiWiFi-30G', 'FWF-30G-Q', 'HW FWF-30G-Q', 'HW', 450),
  // FortiWiFi 31G sin su hardware.
  fila('FortiWiFi-31G', 'FC-10-PRB31-809-02-12', '1 Year Enterprise Protection', 'Service', 150),
  // FortiExtender 101G: el FortiCare no nombra el modelo, pero lleva el codigo de su ficha.
  fila('FortiExtender-101G', 'FEX-101G', 'HW FEX-101G', 'HW', 400),
  fila('FortiCare', 'FC-10-X101G-247-02-36', '3 Year FortiCare Premium', 'Service', 90),
  // FortiExtender WAN 50G: solo la de Norteamerica.
  fila('FortiExtender WAN 50G', 'FEW-50G-AM', 'HW FEW-50G-AM', 'HW', 1500),
];

const MODELOS = [
  { id: 'FortiGate 30G', hwSku: 'FG-30G' },
  { id: 'FortiGate 40F', hwSku: 'FG-40F' },
  { id: 'FortiGate 40F-3G4G', hwSku: 'FG-40F-3G4G', variante: { de: 'FortiGate 40F' } },
];
const correr = (cambios = {}) => extraer({ filas: LISTA, modelos: MODELOS,
  precioDe: new Map([['FortiGate 30G', 500], ['FortiGate 40F', 600]]),
  variantes: V.VARIANTES, extenders: V.FORTIEXTENDER.modelos, ...cambios });

test('FortiGate: ancla por hwSku y precio, sin arrastrar un nombre parecido ni dar bloque a una variante', () => {
  const r = correr();
  assert.deepStrictEqual(r.salida['FortiGate 30G'].map((x) => x.sku), ['FG-30G', 'FC-10-0030G-809-02-12']);
  assert.ok(r.salida['FortiGate 40F'].some((x) => x.sku === 'FG-40F-3G4G'), 'la variante va en el bloque de su base');
  assert.ok(!('FortiGate 40F-3G4G' in r.salida));
  const d = correr({ precioDe: new Map([['FortiGate 30G', 510]]) });
  assert.ok(!('FortiGate 30G' in d.salida));
  assert.ok(d.rechazos.some((x) => /FortiGate 30G: DESANCLADO/.test(x)));
});

test('FortiWiFi: nombre y SKU de la ficha, [RC] por un código publicado, y el nombre más largo se queda sus filas', () => {
  const r = correr();
  const b = r.salida['FortiWiFi 50G'];
  assert.deepStrictEqual(b.map((x) => x.sku),
    ['FWF-50G-A', 'FWF-50G-E', 'FC-10-PRB50-809-02-12', 'FC-10-PRB50-950-02-36', 'FWF-50G-BDL-809-12']);
  assert.strictEqual(b[0].p, 800);
  assert.deepStrictEqual(r.salida['FortiWiFi 50G-5G-II'].map((x) => x.sku), ['FWF-50G-5G-II']);
  // El código de licencias se sugiere; no se escribe en ningún sitio.
  assert.ok(r.sugerencias.includes("FortiWiFi 50G: lic: 'PRB50', bdl: 'FWF-50G-BDL'"));
  assert.ok(r.sugerencias.some((x) => /^FortiWiFi 50G-5G-II: ningun codigo de licencias/.test(x)));
});

test('FortiWiFi: un código regional que la ficha no publica, o sin su hardware, rechaza el bloque entero', () => {
  const r = correr();
  assert.ok(!('FortiWiFi 30G' in r.salida));
  assert.ok(r.rechazos.some((x) => /FortiWiFi 30G: FWF-30G-Q lleva un codigo regional que la ficha no publica/.test(x)));
  assert.ok(!('FortiWiFi 31G' in r.salida));
  assert.ok(r.rechazos.some((x) => /FortiWiFi 31G: el SKU de su ficha FWF-31G-\[RC\] no aparece/.test(x)));
  assert.ok(r.rechazos.some((x) => /FortiWiFi 70G: sin ninguna fila/.test(x)));
  // Las celulares tienen `lic` declarado: no se buscan como FortiWiFi.
  assert.ok(!r.rechazos.some((x) => /^FortiGate 50G-5G/.test(x)));
  assert.strictEqual(contradiceRc('FWF-70G-POE', 'FWF-70G-Q'), false, 'sin [RC] no hay código regional que contradecir');
});

test('FortiExtender: por nombre o por el código de su FortiCare, con algún SKU de su ficha', () => {
  const r = correr();
  assert.deepStrictEqual(r.salida['FortiExtender 101G'].map((x) => [x.sku, x.p]),
    [['FEX-101G', 400], ['FC-10-X101G-247-02-36', 90]]);
  assert.deepStrictEqual(r.salida['FortiExtender WAN 50G'].map((x) => x.sku), ['FEW-50G-AM']);
  assert.ok(r.avisos.includes('FortiExtender WAN 50G: la lista no trae FEW-50G-EA'));
  assert.ok(r.avisos.some((x) => /FortiExtender WAN 50G: la lista no trae su FortiCare/.test(x)));
  assert.ok(r.rechazos.some((x) => /FortiExtender 211G: sin ninguna fila/.test(x)));
});

test('una lista sin la fila de cabeceras no se lee', () => {
  assert.throws(() => extraer({ filas: [['nada']], modelos: [], precioDe: new Map() }), /cabeceras/);
});
