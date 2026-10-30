'use strict';
// Fin de venta de Fortinet con fecha (petición del dueño, 2026-10-29): al elegir un equipo, la
// ficha dice su último pedido y su fin de soporte; un fin de venta anunciado se marca y sigue
// recomendable hasta su fecha, y uno vencido deja de proponerse aunque tenga SKU en la lista.

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { cargar } = require('./ayuda/navegador.js');

const F = require('../server/seed/legacyData/fortinet.js');
const { FICHA } = cargar('public/js/ficha.js');

const modelo = (id) => F.MODELS.find((m) => m.id === id);

test('cada fila de EOL_ANNOUNCED casa con un modelo y trae fechas coherentes', () => {
  for (const [base, a] of Object.entries(F.EOL_ANNOUNCED)) {
    const m = modelo(`FortiGate ${base}`);
    assert.ok(m, `${base}: no hay tal modelo; la fila no marcaría nada`);
    assert.strictEqual(m.eolAnnounced, a);
    const eoo = new Date(a.lastOrder);
    const eos = new Date(a.endOfSupport);
    assert.ok(Number.isFinite(eoo.getTime()) && Number.isFinite(eos.getTime()), `${base}: fechas parseables`);
    assert.strictEqual(eos.getUTCFullYear() - eoo.getUTCFullYear(), 5, `${base}: el aviso da 60 meses de soporte`);
    assert.strictEqual(a.lastOrder.slice(4), a.endOfSupport.slice(4), `${base}: mismo día y mes`);
    assert.match(a.url, /^https:\/\/support\.fortinet\.com\//, `${base}: remite al portal de Fortinet`);
    assert.ok(a.confirmar, `${base}: el dato transcrito lo dice`);
  }
});

test('el 400F y el 401F no tienen fin de venta: sin afirmar, nunca «vigente» por declaración', () => {
  for (const id of ['FortiGate 400F', 'FortiGate 401F']) {
    assert.strictEqual(modelo(id).eolAnnounced, null);
    assert.strictEqual(FICHA.marca(modelo(id)), null);
  }
});

test('el 60F se pide hasta el 13-ene-2027 y después cae solo', () => {
  const m = modelo('FortiGate 60F');
  assert.strictEqual(m.eolAnnounced.lastOrder, '2027-01-13');
  assert.strictEqual(FICHA.rango(m), Date.now() < Date.parse('2027-01-13') ? 0 : 2);
  // La misma fila con la fecha ya pasada: la regla común la aparta sola.
  assert.strictEqual(FICHA.rango({ ...m, eolAnnounced: { ...m.eolAnnounced, lastOrder: '2000-01-13' } }), 2);
});

test('el 1000F, con SKU en la lista, sale fuera de venta por su fecha vencida', () => {
  const m = modelo('FortiGate 1000F');
  assert.ok(m.hwSku, 'sigue en la lista firmada: el SKU solo no lo apartaría');
  assert.strictEqual(FICHA.rango(m), 2);
});

test('la ficha dice último pedido, fin de soporte y que hay que confirmarlo', () => {
  const vencido = { ...modelo('FortiGate 1000F'), eol: true };
  const t = FICHA.avisoDe(vencido);
  assert.match(t, /2026-10-13/);
  assert.match(t, /2031-10-13/);
  assert.match(t, /confirmar en el portal/);
  const anunciado = { id: 'X', eolAnnounced: { lastOrder: '2999-01-13', endOfSupport: '3004-01-13', confirmar: 'confirmar' } };
  assert.match(FICHA.avisoDe(anunciado), /3004-01-13/);
  assert.match(FICHA.cicloDeVida(anunciado, { respaldado: false }).detalle, /soporte del fabricante hasta el 3004-01-13/);
});

test('la proyección del dimensionador Fortinet aplica la regla común de fuera de venta', () => {
  const src = fs.readFileSync(path.join(__dirname, '../server/services/catalogProjection.js'), 'utf8');
  const cuerpo = /async function toDimensionadorFortinet\(\)[\s\S]*?\n\}\n/.exec(src)[0];
  assert.match(cuerpo, /eol: fueraDeVenta\(p\.eol, p\.specs\)/);
});
