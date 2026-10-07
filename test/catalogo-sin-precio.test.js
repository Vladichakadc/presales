'use strict';
// LO QUE VA «CONSULTAR» A PROPOSITO SE INVENTARIA, CON SU MOTIVO (2026-10-07).
//
// El R9Y49A de Aruba fue el primer accesorio del catalogo sin precio declarado: compatibilidad
// oficial, fila de la lista sin transcribir. Lo que se prueba es lo que haria que se quedara
// asi por olvido: que `npm run catalogo` no lo viera, que viera solo Aruba, o que no avisara el
// dia que el CSV del cotizador ya trae su fila.
const test = require('node:test');
const assert = require('node:assert');
const { sinPrecioDeclarado } = require('../scripts/catalogo-check');
const { ARUBA_ACCESSORY_CATALOG } = require('../server/seed/legacyData/aruba');

test('el inventario encuentra cada accesorio sin precio de Aruba, con su motivo y sin fila en el CSV', () => {
  const filas = sinPrecioDeclarado();
  const esperados = Object.entries(ARUBA_ACCESSORY_CATALOG).filter(([, a]) => a.sinPrecio).map(([k]) => k);
  assert.ok(esperados.length >= 1, 'el R9Y49A declara sinPrecio desde el 2026-10-07');
  const deAruba = filas.filter((f) => f.modulo === 'aruba');
  assert.deepStrictEqual(deAruba.map((f) => f.ruta), esperados.map((k) => `ARUBA_ACCESSORY_CATALOG.${k}`));
  for (const f of deAruba) {
    assert.ok(f.motivo && f.motivo.length > 20, `${f.ruta}: el motivo tiene que decir por que`);
    assert.strictEqual(f.filaCsv, null, `${f.ruta}: si el CSV ya trae su fila, la prueba de coherencia de Aruba ya esta en rojo`);
  }
});

test('el inventario recorre todo legacyData/, no solo Aruba: nada mas declara sinPrecio hoy', () => {
  // Si otro fabricante estrena el patron, esta prueba lo nombra: que se anada aqui a sabiendas.
  const fuera = sinPrecioDeclarado().filter((f) => f.modulo !== 'aruba').map((f) => `${f.modulo}:${f.ruta}`);
  assert.deepStrictEqual(fuera, []);
});
