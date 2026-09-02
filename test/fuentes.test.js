'use strict';
// La procedencia del catalogo: fechas, antiguedad y el tercer estado.
//
// La regla que fija esta bateria es la misma que ya rige `redund` y los precios de Aruba:
// **una fuente sin fecha no es una fuente reciente**. Tratar `fecha: null` como 0 meses
// diria "recien verificado" justo donde no se sabe nada, que es el error contrario al que
// este catalogo comete jamas.
const test = require('node:test');
const assert = require('node:assert');
const {
  FUENTES, ANTIGUEDAD_AVISO_MESES, mesesDesde, estadoFuente, fuentesDe, fuentesQueAvisan,
} = require('../server/seed/legacyData/fuentes');
const vendors = require('../server/seed/legacyData/vendors');

const AHORA = new Date(Date.UTC(2026, 8, 2)); // 2 de septiembre de 2026

test('cada fabricante del catalogo tiene al menos una fuente registrada', () => {
  for (const v of vendors) {
    assert.ok(Array.isArray(FUENTES[v.code]) && FUENTES[v.code].length > 0,
      `${v.code} declara su procedencia`);
  }
});

test('mesesDesde cuenta meses completos y admite fecha de solo mes', () => {
  assert.strictEqual(mesesDesde('2026-08', AHORA), 1);
  assert.strictEqual(mesesDesde('2026-07', AHORA), 2);
  assert.strictEqual(mesesDesde('2025-09', AHORA), 12);
  // Dia completo: el 17 de agosto aun no cumple el mes el dia 2 de septiembre.
  assert.strictEqual(mesesDesde('2026-08-17', AHORA), 0);
  assert.strictEqual(mesesDesde('2026-08-01', AHORA), 1);
});

test('sin fecha no se lee como reciente: devuelve null, nunca 0', () => {
  assert.strictEqual(mesesDesde(null, AHORA), null);
  assert.strictEqual(mesesDesde('', AHORA), null);
  assert.strictEqual(mesesDesde('no-es-una-fecha', AHORA), null);
  assert.strictEqual(estadoFuente({ fecha: null }, AHORA).estado, 'sin fecha');
  assert.strictEqual(estadoFuente({ fecha: null }, AHORA).meses, null);
});

test('el umbral de antiguedad separa vigente de vieja', () => {
  const justoAntes = new Date(Date.UTC(2026, 8 - (ANTIGUEDAD_AVISO_MESES - 1), 2));
  const justoDespues = new Date(Date.UTC(2026, 8 - ANTIGUEDAD_AVISO_MESES, 2));
  const iso = (d) => d.toISOString().slice(0, 10);
  assert.strictEqual(estadoFuente({ fecha: iso(justoAntes) }, AHORA).estado, 'vigente');
  assert.strictEqual(estadoFuente({ fecha: iso(justoDespues) }, AHORA).estado, 'vieja');
});

test('fuentesDe resuelve el estado y tolera un fabricante desconocido', () => {
  const fortinet = fuentesDe('fortinet', AHORA);
  assert.ok(fortinet.length >= 2, 'Fortinet tiene matriz y lista de precios');
  for (const f of fortinet) assert.ok(f.estado, 'cada fuente trae su estado resuelto');
  assert.deepStrictEqual(fuentesDe('arista', AHORA), []); // Arista se retiro del catalogo
  assert.deepStrictEqual(fuentesDe(null, AHORA), []);
});

test('los fabricantes sin fecha documentada se declaran, no se rellenan', () => {
  // MikroTik y Aruba: sus cabeceras no fechan la revision, y eso se conserva tal cual en
  // vez de inventar un mes. Es el hueco que el aviso del arranque hace visible.
  for (const code of ['mikrotik', 'aruba']) {
    const sinFecha = fuentesDe(code, AHORA).filter((f) => f.estado === 'sin fecha');
    assert.ok(sinFecha.length > 0, `${code} declara que su fuente no trae fecha`);
  }
});

test('fuentesQueAvisan recoge solo lo que no esta vigente, con su fabricante', () => {
  const avisos = fuentesQueAvisan(AHORA);
  for (const a of avisos) {
    assert.notStrictEqual(a.estado, 'vigente');
    assert.ok(a.vendor, 'el aviso dice de que fabricante es');
    assert.ok(a.documento, 'y de que documento');
  }
  // Con las fechas de hoy, MikroTik y Aruba tienen que estar entre los avisos.
  const conAviso = new Set(avisos.map((a) => a.vendor));
  assert.ok(conAviso.has('mikrotik') && conAviso.has('aruba'));
});

test('ninguna URL registrada es inventada: o es http(s) o es null', () => {
  for (const [vendor, lista] of Object.entries(FUENTES)) {
    for (const f of lista) {
      assert.ok(f.url === null || /^https?:\/\//.test(f.url), `${vendor}: ${f.documento}`);
      assert.ok(f.documento && f.cubre, `${vendor}: toda fuente dice qué es y qué cubre`);
    }
  }
});
