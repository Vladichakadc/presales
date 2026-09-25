'use strict';
// Cifras del «EdgeConnect SD-Branch» Validated Solution Guide (septiembre de 2026, copia en
// public/datasheets/sd-branch-design-vsg.pdf, p. 63) que el dimensionador Aruba usa desde el
// 2026-09-24: el throughput de IDS/IPS de cada gateway (eje de la estrategia «IDS/IPS en el
// gateway», A2) y la escala de túneles de cada headend (VPNC sugerido en el consolidado, M8).
// Se fijan con su valor para que un cambio de catálogo que las pierda no pase en silencio.

const test = require('node:test');
const assert = require('node:assert');
const aruba = require('../server/seed/legacyData/aruba.js');

const porId = (id) => aruba.MODELS.find((m) => m.id === id);

test('VSG p.63: throughput de IDS/IPS de los cinco gateways que lo publica', () => {
  const esperado = { 'Gateway 9004': 1100, 'Gateway 9012': 1100, 'Gateway 9106': 2500, 'Gateway 9114': 4000, 'Gateway 9240': 6000 };
  for (const [id, mbps] of Object.entries(esperado)) assert.strictEqual(porId(id).idsMbps, mbps, id);
});

test('VSG p.63: sin cifra no se copia la del hermano (9004-LTE) ni se inventa (7000/7200, EdgeConnect)', () => {
  assert.strictEqual(porId('Gateway 9004-LTE').idsMbps, null, 'el 9004-LTE no está en la tabla del VSG');
  for (const m of aruba.MODELS.filter((x) => x.legacy || x.fam === 'ec')) assert.strictEqual(m.idsMbps, null, m.id);
});

test('VSG p.63: la inspección rinde menos que el firewall publicado (18-30 %)', () => {
  for (const m of aruba.MODELS.filter((x) => x.idsMbps != null)) {
    const r = m.idsMbps / m.fw;
    assert.ok(r > 0.15 && r < 0.35, `${m.id}: IDS/IPS ${m.idsMbps} sobre firewall ${m.fw} = ${r.toFixed(2)}`);
  }
});

test('VSG p.63: escala de túneles SD-WAN por headend', () => {
  const esperado = { 'Gateway 9012': 512, 'Gateway 9106': 8000, 'Gateway 9114': 16000, 'Gateway 9240': 32000, '7240XM': 6144 };
  for (const [id, n] of Object.entries(esperado)) assert.strictEqual(porId(id).vpncTuneles, n, id);
  assert.strictEqual(porId('Gateway 9004').vpncTuneles, null, 'el 9004 no figura como headend en el VSG');
});

test('la ficha del gateway lleva la cifra de IDS/IPS con su fuente', () => {
  assert.match(porId('Gateway 9106').spec.idsips, /Hasta 2,5 Gbps de throughput IDS\/IPS \(VSG SD-Branch, sep-2026\)/);
});
