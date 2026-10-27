'use strict';
// CRIPTOGRAFÍA POST-CUÁNTICA EN LA FICHA (2026-10-27, encargo del dueño). Lo que fija:
//   1. tres cosas distintas no se mezclan: un algoritmo PQC (ML-KEM), una clave precompartida
//      post-cuántica (PPK, RFC 8784) y MACsec/ANYsec «quantum-safe» (simétrico);
//   2. sin documento, «no consta», nunca «no» (la regla de la alimentación);
//   3. solo lleva `pqc` el equipo que su documento nombra: la G2 con IOS XE (no los G2-MX ni
//      los Catalyst), los FortiGate que lista la Maximum Values Table de 7.6.7, los SRX de la
//      tabla del Feature Explorer y los 7750 de las fichas Release 26;
//   4. cada equipo marcado tiene una fuente en fuentes.js que lo declara con el campo `pqc`;
//   5. las siete páginas pintan la sección.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { cargar } = require('./ayuda/navegador');
const { FICHA } = cargar('public/js/ficha.js');
const { FUENTES, resolverModelos } = require('../server/seed/legacyData/fuentes');

const CATALOGOS = {
  cisco: require('../server/seed/legacyData/cisco').MODELS,
  fortinet: require('../server/seed/legacyData/fortinet').MODELS,
  juniper: require('../server/seed/legacyData/juniper').MODELS,
  nokia: require('../server/seed/legacyData/nokia').MODELS_ROUTER,
  huawei: require('../server/seed/legacyData/huawei').MODELS,
  aruba: require('../server/seed/legacyData/aruba').MODELS,
  mikrotik: require('../server/seed/legacyData/mikrotik').MODELS,
};
const valor = (sec, clave) => (sec.filas.find((f) => f[0] === clave) || [])[1];

test('la ficha distingue algoritmo PQC, clave precompartida y MACsec, y sin dato dice «no consta»', () => {
  const g2 = CATALOGOS.cisco.find((m) => m.id === 'Cisco Secure Router C8231-G2');
  const ml = FICHA.seccionPqc(g2);
  assert.strictEqual(ml.titulo, 'Criptografía post-cuántica (PQC)');
  assert.match(valor(ml, 'Soporte'), /^Sí — algoritmo post-cuántico ML-KEM \(FIPS 203\)$/);
  assert.match(valor(ml, 'Software'), /IOS XE 26\.1\.1 o superior/);
  assert.match(ml.nota, /Release Notes for Cisco 8000 Series Secure Routers, Release 26\.1\.x/);
  const srx = FICHA.seccionPqc(CATALOGOS.juniper.find((m) => m.id === 'SRX4700'));
  assert.match(valor(srx, 'Soporte'), /PPK, RFC 8784\): no es un algoritmo post-cuántico/);
  assert.match(valor(srx, 'Software'), /Junos OS 24\.4R1-S2/);
  const sr = FICHA.seccionPqc(CATALOGOS.nokia.find((m) => m.id === '7750 SR-7s'));
  assert.match(valor(sr, 'Soporte'), /MACsec\/ANYsec «quantum-safe».*no es un algoritmo post-cuántico/);
  assert.match(valor(sr, 'Software'), /la fuente no da la versión/);
  for (const m of [{ id: 'x' }, null, { id: 'y', pqc: { tipo: 'inventado' } }]) {
    const s = FICHA.seccionPqc(m);
    assert.match(valor(s, 'Soporte'), /no consta/);
    assert.match(s.nota, /eso no prueba que no la tenga/);
  }
});

test('solo lleva `pqc` el equipo que su documento nombra', () => {
  const C = CATALOGOS.cisco;
  for (const m of C) {
    assert.strictEqual(!!m.pqc, m.ser === 'Secure Router (G2)', `${m.id}: pqc donde no toca (${m.ser})`);
  }
  // Los G2-MX llevan MX OS: la nota de IOS XE no los cubre.
  assert.ok(!C.find((m) => m.id === 'Cisco Secure Router C8111-G2-MX').pqc);
  // Los que llegan en la 26.1.2, con esa versión.
  assert.match(C.find((m) => m.id === 'Cisco Secure Router C8650-G2').pqc.desde, /^IOS XE 26\.1\.2/);
  for (const m of CATALOGOS.fortinet) assert.strictEqual(!!m.pqc, !!m.bgpDe, `${m.id}: pqc sin la MVT 7.6.7 o al revés`);
  assert.deepStrictEqual(CATALOGOS.juniper.filter((m) => m.pqc).map((m) => m.id).sort(),
    ['SRX1500', 'SRX1600', 'SRX2300', 'SRX4200', 'SRX4300', 'SRX4700']);
  assert.deepStrictEqual(CATALOGOS.nokia.filter((m) => m.pqc).map((m) => m.id).sort(),
    ['7750 SR-14s', '7750 SR-1', '7750 SR-1s', '7750 SR-2s', '7750 SR-7s'].sort());
  for (const v of ['huawei', 'aruba', 'mikrotik']) {
    assert.ok(CATALOGOS[v].every((m) => !m.pqc), `${v}: no hay documento oficial de PQC en el catálogo`);
  }
  for (const [v, L] of Object.entries(CATALOGOS)) {
    for (const m of L.filter((x) => x.pqc)) {
      assert.ok(['mlkem', 'ppk', 'macsec'].includes(m.pqc.tipo), `${v} ${m.id}: tipo`);
      for (const k of ['mecanismo', 'donde', 'fuente']) assert.ok(m.pqc[k], `${v} ${m.id}: falta ${k}`);
    }
  }
});

test('cada equipo con `pqc` tiene una fuente que lo declara con ese campo', () => {
  for (const [v, L] of Object.entries(CATALOGOS)) {
    const declarados = new Set((FUENTES[v] || []).filter((f) => (f.campos || []).includes('pqc'))
      .flatMap((f) => resolverModelos(v, f).ids || []));
    const sin = L.filter((m) => m.pqc && !declarados.has(m.id)).map((m) => m.id);
    assert.deepStrictEqual(sin, [], `${v}: sin fuente de PQC → ${sin.join(', ')}`);
  }
});

test('las siete páginas de un equipo pintan la sección', () => {
  const paginas = ['aruba-edgeconnect', 'cisco-catalyst8k', 'fortinet-fortigate', 'huawei-netengine',
    'juniper-srx', 'mikrotik-routeros', 'nokia-7750sr'];
  for (const p of paginas) {
    const js = fs.readFileSync(path.join(__dirname, '..', 'public', 'js', `dimensionador-${p}.js`), 'utf8');
    assert.match(js, /FICHA\.seccionPqc\(m\)/, `${p} no pinta la PQC`);
  }
});

// El Comparador del portal enseña el mismo dato en una línea (mejora encontrada por el camino).
test('el Comparador da la PQC en una línea, dice lo que no es un algoritmo PQC y sin dato no rellena', () => {
  const { COMPARADOR } = cargar('public/js/comparador.js');
  const fila = COMPARADOR.SECCIONES.flatMap((s) => s.filas).find((f) => f.k === 'pqc');
  assert.ok(fila, 'la fila existe');
  const dev = (raw) => ({ grupo: 'x', raw });
  const g2 = CATALOGOS.cisco.find((m) => m.id === 'Cisco Secure Router C8650-G2');
  assert.strictEqual(JSON.stringify(COMPARADOR.celda(fila, dev(g2))), JSON.stringify({ estado: 'dato', txt: 'ML-KEM (FIPS 203) — desde IOS XE 26.1.2' }));
  const srx = CATALOGOS.juniper.find((m) => m.id === 'SRX1500');
  assert.match(COMPARADOR.celda(fila, dev(srx)).txt, /^PPK de RFC 8784 \(no es un algoritmo PQC\) — desde Junos OS 22\.4R1$/);
  assert.strictEqual(COMPARADOR.celda(fila, dev({ model: 'AR651' })).estado, 'sinDato');
  assert.strictEqual(COMPARADOR.crudo(fila, dev(g2)), null, 'sin flecha de «mejor»: no es una cifra');
});
