'use strict';
// Casado de nombres entre el dimensionador y el cotizador. Los dos catalogos nombran los
// equipos distinto ("SRX380" frente a "Juniper SRX380", "EC-XS" frente a "Aruba EC-XS"), asi
// que se normaliza en vez de mantener a mano una tabla de equivalencias que se
// desincronizaria. Estas pruebas fijan que la normalizacion no colapse equipos distintos.
const test = require('node:test');
const assert = require('node:assert');
const { cargar } = require('./ayuda/navegador');

const { BOM } = cargar('public/js/bom.js');
const norm = BOM.normalizar;

test('el prefijo de fabricante no impide el casado', () => {
  assert.strictEqual(norm('Juniper SRX380'), norm('SRX380'));
  assert.strictEqual(norm('Aruba EC-XS'), norm('EC-XS'));
  assert.strictEqual(norm('FortiGate 200G'), norm('fortigate 200g'));
});

test('separadores y mayusculas dan igual', () => {
  assert.strictEqual(norm('SRX-380'), norm('srx 380'));
  assert.strictEqual(norm('C8300-1N1S-4T2X'), norm('c8300 1n1s 4t2x'));
});

test('dos equipos distintos NO se colapsan en el mismo nombre', () => {
  // Es el riesgo real de normalizar: pasarse de tolerante y meter en el BOM un equipo que
  // no es el que se dimensiono.
  assert.notStrictEqual(norm('SRX380'), norm('SRX340'));
  assert.notStrictEqual(norm('FortiGate 90G'), norm('FortiGate 91G'));
  assert.notStrictEqual(norm('EC-XS'), norm('EC-S'));
});

test('un nombre que es solo el fabricante no se queda vacio', () => {
  // Si al quitar el prefijo no queda nada, se conserva el original: una cadena vacia casaria
  // con cualquier otra cadena vacia y meteria lineas cruzadas.
  assert.notStrictEqual(norm('Juniper'), '');
  assert.notStrictEqual(norm('Cisco'), norm('Aruba'));
});
