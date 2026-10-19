'use strict';
// Escalón superior (N+1) de ficha.js (2026-10-19). Lo que se fija: que el N+1 es el siguiente con
// MÁS capacidad (ocho variantes con la misma cifra no son un escalón), que nunca propone un equipo
// fuera de venta, que el diferencial de precio solo existe con precio confirmado en los dos, y que
// la familia limita cuando la página lo pide.
const test = require('node:test');
const assert = require('node:assert');
const { cargar } = require('./ayuda/navegador');

const { FICHA } = cargar('public/js/ficha.js');
const cfg = (extra) => Object.assign({ metrica: (m) => m.cap, precio: (m) => (m.p == null ? null : m.p) }, extra);

const A = { id: 'A', cap: 100, p: 1000, fam: 'x' };
const A2 = { id: 'A2', cap: 100, p: 1100, fam: 'x' };
const B = { id: 'B', cap: 300, p: 1800, fam: 'x' };
const C = { id: 'C', cap: 200, fam: 'y' };
const VIEJO = { id: 'V', cap: 150, p: 900, eol: true, fam: 'x' };

test('el N+1 es el de menor capacidad estrictamente mayor, no el siguiente de la lista', () => {
  const e = FICHA.escalonSuperior([A, A2, B, C], A, cfg());
  assert.strictEqual(e.modelo.id, 'C', 'A2 empata en cifra: no es un escalón');
  assert.strictEqual(e.delta, 100);
});

test('un equipo fuera de venta nunca es el escalón', () => {
  assert.strictEqual(FICHA.escalonSuperior([A, VIEJO, B], A, cfg()).modelo.id, 'B');
});

test('diferencial de precio solo con precio en los dos', () => {
  assert.strictEqual(FICHA.escalonSuperior([A, B], A, cfg()).deltaPrecio, 800);
  assert.strictEqual(FICHA.escalonSuperior([A, C], A, cfg()).deltaPrecio, null, 'C no tiene precio: no se inventa la diferencia');
});

test('la familia limita cuando la página la declara', () => {
  const e = FICHA.escalonSuperior([A, B, C], A, cfg({ mismaFamilia: (a, b) => a.fam === b.fam }));
  assert.strictEqual(e.modelo.id, 'B');
});

test('sin escalón: el mayor de la lista, o sin métrica', () => {
  assert.strictEqual(FICHA.escalonSuperior([A, B], B, cfg()), null);
  assert.strictEqual(FICHA.escalonSuperior([A, B], { id: 'Z' }, cfg()), null);
  assert.strictEqual(FICHA.escalonSuperior([A, B], A, null), null);
});
