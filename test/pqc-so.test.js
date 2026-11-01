'use strict';
// «Exigir PQC» respeta el sistema operativo del escenario (mejora aprobada el 2026-10-28). La PPK
// de los gateways de Aruba está documentada con AOS-8 (guía de AOS-8 y notas de la 8.12.0.5), no
// con AOS-10: con el selector en AOS 10, un 9004 no puede pasar el requisito como si la trajera.
const test = require('node:test');
const assert = require('node:assert');
const PQC = require('../public/js/pqc');
const { MODELS } = require('../server/seed/legacyData/aruba');

const gw = MODELS.find((m) => m.id === 'Gateway 9004');
const ec = MODELS.find((m) => m.fam === 'ec' && m.pqc);

test('la PPK de un gateway vale con AOS 8 y no consta con AOS 10', () => {
  assert.strictEqual(gw.pqc.so, 'aos8');
  assert.strictEqual(PQC.motivo(gw, 'clave', { so: 'aos8', soNombre: 'AOS 8' }), null);
  assert.match(PQC.motivo(gw, 'clave', { so: 'aos10', soNombre: 'AOS 10 (Central)' }),
    /su documento la da con AOS 8; con AOS 10 \(Central\) no consta/);
  // Con ML-KEM exigido y el SO bueno, sigue diciendo que una PPK no es ML-KEM.
  assert.match(PQC.motivo(gw, 'mlkem', { so: 'aos8' }), /no un algoritmo ML-KEM/);
});

test('sin contexto, o en un equipo sin `so`, la regla no cambia', () => {
  assert.strictEqual(PQC.motivo(gw, 'clave'), null, 'las páginas que no pasan SO siguen como antes');
  assert.strictEqual(PQC.motivo(ec, 'clave', { so: 'aos10' }), null, 'un EdgeConnect corre ECOS: el selector no le afecta');
  assert.strictEqual(PQC.motivo(gw, '', { so: 'aos10' }), null, 'sin requisito no se aparta nada');
});

test('solo los gateways con PQC de AOS-8 la declaran por sistema operativo', () => {
  for (const m of MODELS) {
    if (!m.pqc) continue;
    if (m.fam === 'gw') assert.strictEqual(m.pqc.so, 'aos8', `${m.id}: su PPK es de AOS-8`);
    else assert.strictEqual(m.pqc.so, undefined, `${m.id}: no depende del SO del gateway`);
  }
});

test('la página de Aruba y la hoja «Supuestos» pasan el sistema operativo del escenario', () => {
  const fs = require('fs');
  const path = require('path');
  const pag = fs.readFileSync(path.join(__dirname, '..', 'public/js/dimensionador-aruba-edgeconnect.js'), 'utf8');
  // El filtro vive en aruba-reglas.js desde el 2026-11-01 (fase 3.1); la página le pasa soMode.
  const reglas = fs.readFileSync(path.join(__dirname, '..', 'public/js/aruba-reglas.js'), 'utf8');
  assert.match(reglas, /PQC\.motivo\(m,nivelPqc,\{so:soMode/, 'el filtro del dimensionador no pasa el SO');
  assert.match(pag, /ArubaReglas\.filtrarCandidatos\(MODELS, \{[^}]*\bsoMode\b/, 'la página no pasa el SO al filtro');
  assert.match(pag, /so:m\.fam==='gw'\?\{so:soMode/, 'los supuestos del Excel no llevan el SO');
  const bom = fs.readFileSync(path.join(__dirname, '..', 'public/js/bom.js'), 'utf8');
  assert.match(bom, /P\.motivo\(\{ pqc: p, pqcNo: s\.pqcNo \|\| null \}, exigida, s\.so \|\| null\)/, 'la hoja no pasa el SO');
});
