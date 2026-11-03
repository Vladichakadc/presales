'use strict';
// LA ELECCIÓN DEL MODELO DE ARUBA, FUERA DE render() (2026-11-01, fase 3.1, tercera entrega). El filtro
// de candidatos se movió sin cambiar su cuerpo y se midió con `npm run equivalencia --
// scripts/equivalencias/aruba-eleccion.js` (3.300 escenarios contra la página de main, 0 diferencias;
// la mutación de control da 1.190). Aquí: que el filtro no lee nada de fuera de su contexto, que cada
// descarte va a su motivo y que la página solo delega.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const R = require('../public/js/aruba-reglas.js');

const base = (extra) => ({
  coincideFiltro: () => true, famMode: 'any', personaMode: 'auto', PERSONA_MODELOS: {}, boost: false, secMode: 'none',
  ArubaReglas: R, IMIX_FACTOR: 0.7, needProc: 100, fmt: R.fmt, centralParaModelo: () => null,
  capacidadMax: (m) => m.wanMax, capacidadComparable: (m) => m.wanMax, needDe: () => 100,
  clientesMax: R.clientesMax, apsMax: R.apsMax, users: 0, aps: 0, flujosDe: R.flujosDe, flujosReq: 0,
  D: { boostMbps: 0, wanLinks: [] }, evaluarPuertos: () => ({ nivel: 'verde' }), PQC: { motivo: () => null },
  soMode: 'aos10', SO_NOMBRE: {}, nivelPqc: '', ...extra,
});
const ec = (id, wanMax, extra) => ({ id, fam: 'ec', wanMax, ...extra });

test('cumple quien llega en capacidad; cada descarte va a su contador o a su lista', () => {
  const MODELS = [ec('chico', 50), ec('justo', 100), ec('grande', 1000, { clients: 5 }), ec('sinPuerto', 500), ec('pqc', 500)];
  const r = R.filtrarCandidatos(MODELS, base({
    users: 10,
    evaluarPuertos: (m) => (m.id === 'sinPuerto' ? { nivel: 'rojo', motivo: 'sin jaula' } : { nivel: 'verde' }),
    PQC: { motivo: (m) => (m.id === 'pqc' ? 'no consta' : null) }, nivelPqc: 'clave',
  }));
  assert.deepStrictEqual(r.candidates.map((m) => m.id), ['justo']);
  assert.strictEqual(r.outByClients, 1, 'el grande no llega en clientes');
  assert.deepStrictEqual(r.outByPuertos.map((x) => [x.m.id, x.motivo]), [['sinPuerto', 'sin jaula']]);
  assert.deepStrictEqual(r.outByPqc.map((x) => x.m.id), ['pqc']);
});

test('sin cifra no se afirma que cumpla: se cuenta aparte', () => {
  const r = R.filtrarCandidatos([ec('sinDato', 500, { wanMax: 500 })], base({ capacidadMax: () => null }));
  assert.strictEqual(r.candidates.length, 0);
  assert.strictEqual(r.outBySinDato, 1);
});

test('la página delega en ArubaReglas.filtrarCandidatos y no conserva el filtro', () => {
  const pag = fs.readFileSync(path.join(__dirname, '..', 'public/js/dimensionador-aruba-edgeconnect.js'), 'utf8');
  assert.match(pag, /= ArubaReglas\.filtrarCandidatos\(MODELS, \{/);
  assert.match(pag, /nivelPqc: \$\('reqPqc'\)\.value,/);
  assert.doesNotMatch(pag, /const candidates=MODELS\.filter\(/, 'el filtro no vuelve a la página');
  const mod = fs.readFileSync(path.join(__dirname, '..', 'public/js/aruba-reglas.js'), 'utf8');
  const cuerpo = mod.slice(mod.indexOf('function filtrarCandidatos('), mod.indexOf('return { candidates,'));
  assert.doesNotMatch(cuerpo, /\$\(|document\.|window\./, 'el filtro no lee el DOM');
});
