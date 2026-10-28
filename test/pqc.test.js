'use strict';
// CRIPTOGRAFÍA POST-CUÁNTICA EN LA FICHA (2026-10-27, encargo del dueño). Lo que fija:
//   1. tres cosas distintas no se mezclan: un algoritmo PQC (ML-KEM), una clave precompartida
//      post-cuántica (PPK, RFC 8784) y MACsec/ANYsec «quantum-safe» (simétrico);
//   2. sin documento, «no consta», nunca «no» (la regla de la alimentación);
//   3. solo lleva `pqc` el equipo que su documento nombra: la G2 con IOS XE (no los G2-MX),
//      los FortiGate que lista la Maximum Values Table de 7.6.7 o sus Release Notes, los SRX de la
//      tabla del Feature Explorer y los 7750 de las fichas Release 26; y desde el 2026-10-27 (tema
//      pqc-documentos) la PPK de los Catalyst 8000 y el ISR 1000 (guía de IOS XE 17), de los
//      EdgeConnect (cifrados de ECOS) y de los MikroTik cuya ficha dice «RouterOS v7» y CHR;
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
  const TIPO_CISCO = { 'Secure Router (G2)': 'mlkem', 'Catalyst 8000': 'ppk', 'ISR 1000': 'ppk', 'ASR 1002-HX': 'ppk', 'ASR 1006-X': 'ppk' };
  for (const m of C) {
    assert.strictEqual(m.pqc ? m.pqc.tipo : undefined, TIPO_CISCO[m.ser] || TIPO_CISCO[m.id], `${m.id}: pqc donde no toca (${m.ser})`);
  }
  // Los G2-MX llevan MX OS: ni la nota ni la guía de IOS XE los cubren. De los ASR, fuera de venta,
  // su boletín da la última versión: el 1001-X se queda en la 17.9 (sin PPK, que llega en la 17.11.1a).
  assert.ok(!C.find((m) => m.id === 'Cisco Secure Router C8111-G2-MX').pqc);
  assert.ok(!C.find((m) => m.id === 'ASR 1001-X').pqc);
  assert.match(C.find((m) => m.id === 'ASR 1002-HX').pqc.alcance, /hasta la IOS XE 17\.15/);
  assert.match(C.find((m) => m.id === 'ASR 1006-X').pqc.alcance, /hasta la IOS XE 17\.18/);
  assert.strictEqual(C.find((m) => m.id === 'Catalyst 8300-1N1S-6T').pqc.desde, 'IOS XE 17.11.1a');
  assert.strictEqual(C.find((m) => m.id === 'Catalyst 8500L-8S4X').pqc.desde, 'IOS XE 17.12.1a');
  assert.strictEqual(C.find((m) => m.id === 'ISR 1111-8P').pqc.desde, 'IOS XE 17.12.1a');
  // Los que llegan en la 26.1.2, con esa versión.
  assert.match(C.find((m) => m.id === 'Cisco Secure Router C8650-G2').pqc.desde, /^IOS XE 26\.1\.2/);
  // Los de la Maximum Values Table de 7.6.7 y, desde el 2026-10-27, los diez que no tienen fila
  // en ella pero que sus Release Notes dicen que corren una 7.6 posterior a la 7.6.1.
  const porRn = ['FortiGate 400G', 'FortiGate 401G', 'FortiGate 3000G', 'FortiGate 3001G', 'FortiGate 3500G',
    'FortiGate 3501G', 'FortiGate 3800G', 'FortiGate 3801G', 'FortiGate 7081F', 'FortiGate 7121F'];
  for (const m of CATALOGOS.fortinet) {
    assert.strictEqual(!!m.pqc, !!m.bgpDe || porRn.includes(m.id), `${m.id}: pqc sin la MVT 7.6.7 ni sus Release Notes, o al revés`);
    if (!m.bgpDe && m.pqc) assert.match(m.pqc.alcance, /Release Notes de FortiOS 7\.6\.[67]/);
  }
  assert.deepStrictEqual(CATALOGOS.juniper.filter((m) => m.pqc).map((m) => m.id).sort(),
    ['SRX1500', 'SRX1600', 'SRX2300', 'SRX4200', 'SRX4300', 'SRX4700']);
  assert.deepStrictEqual(CATALOGOS.nokia.filter((m) => m.pqc).map((m) => m.id).sort(),
    ['7750 SR-14s', '7750 SR-1', '7750 SR-1s', '7750 SR-2s', '7750 SR-7s', '7750 SR-1x-48D', '7750 SR-1x-92S'].sort());
  assert.ok(CATALOGOS.huawei.every((m) => !m.pqc), 'huawei: no hay documento oficial de PQC en el catálogo');
  // Aruba: los EdgeConnect (ECOS), no los gateways AOS; la fuente no da la versión.
  for (const m of CATALOGOS.aruba) {
    assert.strictEqual(!!m.pqc, m.fam === 'ec', `${m.id}: pqc donde no toca`);
    if (m.pqc) assert.strictEqual(m.pqc.desde, null);
  }
  // MikroTik: donde la ficha o el manual de usuario dicen «RouterOS v7» y en CHR; los que solo
  // dicen «la versión de /system resource o superior» se quedan en «no consta».
  const sinV7 = ['RB750UPr2', 'RB960PGS-PB', 'RB1100x4'];
  for (const m of CATALOGOS.mikrotik) {
    assert.strictEqual(!!m.pqc, !sinV7.includes(m.codigo), `${m.id}: pqc donde no toca`);
    if (m.pqc) assert.strictEqual(m.pqc.desde, 'RouterOS 7.21');
  }
  for (const [v, L] of Object.entries(CATALOGOS)) {
    for (const m of L.filter((x) => x.pqc)) {
      assert.ok(['mlkem', 'ppk', 'macsec'].includes(m.pqc.tipo), `${v} ${m.id}: tipo`);
      for (const k of ['mecanismo', 'donde', 'fuente']) assert.ok(m.pqc[k], `${v} ${m.id}: falta ${k}`);
    }
  }
});

// Un «no la trae» con su documento (`pqcNo`, 2026-10-28): solo con motivo y fuente, nunca junto a un
// `pqc`, con una fuente de fuentes.js que lo declara con ese campo, y la ficha y el Comparador lo dicen.
test('`pqcNo`: un «no» con documento, con su fuente declarada, que la ficha y el Comparador dicen como tal', () => {
  const conNo = Object.entries(CATALOGOS).flatMap(([v, L]) => L.filter((m) => m.pqcNo).map((m) => [v, m]));
  assert.deepStrictEqual(conNo.map(([, m]) => m.id), ['ASR 1001-X']);
  for (const [v, m] of conNo) {
    assert.ok(!m.pqc, `${m.id}: un «no» y un «sí» a la vez`);
    for (const k of ['motivo', 'corto', 'fuente']) assert.ok(m.pqcNo[k], `${m.id}: falta ${k}`);
    const declaran = (FUENTES[v] || []).filter((f) => (f.campos || []).includes('pqcNo'))
      .flatMap((f) => resolverModelos(v, f).ids || []);
    assert.ok(declaran.includes(m.id), `${m.id}: ninguna fuente declara su pqcNo`);
  }
  const asr = CATALOGOS.cisco.find((m) => m.id === 'ASR 1001-X');
  const sec = FICHA.seccionPqc(asr);
  assert.match(valor(sec, 'Soporte'), /no la trae/);
  assert.match(valor(sec, 'Motivo'), /IOS XE 17\.9/);
  assert.match(sec.nota, /Un documento oficial dice que este equipo no la trae\. Fuente: Boletín de fin de venta/);
  assert.doesNotMatch(sec.nota, /eso no prueba/);
  const { COMPARADOR } = cargar('public/js/comparador.js');
  const fila = COMPARADOR.SECCIONES.flatMap((s) => s.filas).find((f) => f.k === 'pqc');
  const celda = COMPARADOR.celda(fila, { grupo: 'x', raw: asr });
  assert.strictEqual(celda.estado, 'dato');
  assert.match(celda.txt, /^No — última versión IOS XE 17\.9/);
  // Sin fuente, la ficha no lo da por bueno.
  assert.match(valor(FICHA.seccionPqc({ id: 'x', pqcNo: { motivo: 'm' } }), 'Soporte'), /no consta/);
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
