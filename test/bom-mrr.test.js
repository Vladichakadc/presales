'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { cargar } = require('./ayuda/navegador.js');

// BOM.mrr: cuota mensual de servicio gestionado (2026-10-12). Pura y compartida.
const { BOM } = cargar('public/js/bom.js');

test('MRR = CAPEX × (1 + margen) ÷ meses + OPEX mensual + fee sobre ambos', () => {
  const r = BOM.mrr({ capexNeto: 36000, opexMensual: 500, meses: 36, margenFin: 10, feeMsp: 20 });
  assert.ok(Math.abs(r.cuotaHardware - 1100) < 1e-9);
  assert.ok(Math.abs(r.fee - (1100 + 500) * 0.2) < 1e-9);
  assert.ok(Math.abs(r.mrr - 1920) < 1e-9);
  assert.ok(Math.abs(r.tcv - 1920 * 36) < 1e-6);
  assert.strictEqual(r.completo, true);
});

test('sin precio no hay cuota completa: las líneas que faltan se cuentan', () => {
  const r = BOM.mrr({ capexNeto: 0, opexMensual: 0, meses: 24, sinPrecio: 6 });
  assert.strictEqual(r.mrr, 0);
  assert.strictEqual(r.completo, false);
  assert.strictEqual(r.sinPrecio, 6);
  assert.strictEqual(BOM.mrr({ capexNeto: 100, opexMensual: 0, meses: 12, sinPrecio: 2 }).completo, false);
});

test('entradas inválidas no producen NaN ni cuotas negativas', () => {
  const r = BOM.mrr({ capexNeto: -5, opexMensual: 'x', meses: 0, margenFin: -3, feeMsp: null });
  assert.ok([r.mrr, r.tcv, r.cuotaHardware].every((n) => Number.isFinite(n) && n >= 0));
  assert.strictEqual(r.meses, 36);
});
