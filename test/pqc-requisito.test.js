'use strict';
// Requisito «Exigir criptografía post-cuántica» (2026-10-27, la mejora propuesta en la
// quincuagesimoséptima entrega, aprobada con «ejecuta las mejoras propuestas»). Lo que fija:
//   1. una sola regla (public/js/pqc.js): sin documento, «no consta», nunca «no la tiene»; con
//      ML-KEM exigido, una PPK o un MACsec no bastan, y se dice qué trae el equipo;
//   2. los siete motores o páginas la aplican y apartan con ese motivo;
//   3. las siete páginas ofrecen las mismas tres opciones, cargan pqc.js antes que el código que
//      la usa y guardan el campo en el escenario (enlace y almacenamiento).
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const PQC = require('../public/js/pqc.js');

const PAGINAS = {
  cisco: 'dimensionador-cisco-catalyst8k', fortinet: 'dimensionador-fortinet-fortigate',
  huawei: 'dimensionador-huawei-netengine', juniper: 'dimensionador-juniper-srx',
  mikrotik: 'dimensionador-mikrotik-routeros', nokia: 'dimensionador-nokia-7750sr',
  aruba: 'dimensionador-aruba-edgeconnect',
};
const leer = (rel) => fs.readFileSync(path.join(__dirname, '..', 'public', rel), 'utf8');

test('la regla: sin documento «no consta»; ML-KEM exigido no lo cubre una PPK ni un MACsec', () => {
  assert.strictEqual(PQC.motivo({ pqc: null }, ''), null, 'sin exigir, nada se aparta');
  assert.strictEqual(PQC.motivo({ pqc: null }, 'desconocido'), null, 'un nivel desconocido es «no se exige»');
  assert.match(PQC.motivo({ pqc: null }, 'clave'), /no consta en ningún documento oficial/);
  assert.doesNotMatch(PQC.motivo({}, 'mlkem'), /no la tiene/);
  assert.strictEqual(PQC.motivo({ pqc: { tipo: 'ppk' } }, 'clave'), null);
  assert.strictEqual(PQC.motivo({ pqc: { tipo: 'macsec' } }, 'clave'), null);
  assert.strictEqual(PQC.motivo({ pqc: { tipo: 'mlkem' } }, 'mlkem'), null);
  assert.match(PQC.motivo({ pqc: { tipo: 'ppk' } }, 'mlkem'), /su documento da PPK \(RFC 8784\), no un algoritmo ML-KEM/);
  assert.match(PQC.motivo({ pqc: { tipo: 'macsec' } }, 'mlkem'), /MACsec\/ANYsec quantum-safe, no un algoritmo ML-KEM/);
});

test('las siete páginas: mismo desplegable, pqc.js antes que quien lo usa y el campo en el escenario', () => {
  const opciones = Object.entries(PQC.NIVELES).map(([v, n]) => `<option value="${v}">${n}</option>`).join('');
  for (const [fab, pag] of Object.entries(PAGINAS)) {
    const html = leer(`${pag}.html`);
    const sel = html.match(/<select id="reqPqc"[^>]*>(.*?)<\/select>/);
    assert.ok(sel, `${fab}: falta el desplegable #reqPqc`);
    assert.strictEqual(sel[1], opciones, `${fab}: las opciones no son las de pqc.js`);
    assert.match(html, /<label for="reqPqc"[^>]*>Criptografía post-cuántica \(exigir\)<\/label>/, `${fab}: sin etiqueta`);
    const iPqc = html.indexOf('<script src="/js/pqc.js">');
    assert.ok(iPqc > 0, `${fab}: no carga /js/pqc.js`);
    assert.ok(iPqc < html.indexOf(`<script src="/js/${pag}.js">`), `${fab}: pqc.js después de la página`);
    const motor = html.match(/<script src="\/js\/(\w+-motor)\.js">/);
    if (motor) assert.ok(iPqc < html.indexOf(motor[0]), `${fab}: pqc.js después de ${motor[1]}`);
    const js = leer(`js/${pag}.js`);
    assert.ok((js.match(/'reqPqc'/g) || []).length >= 2, `${fab}: #reqPqc no repinta o no viaja en el escenario`);
  }
});

test('Cisco: la G2 cumple ML-KEM; un Catalyst 8000 trae PPK; un ASR se aparta como «no consta»', () => {
  const M = require('../public/js/cisco-motor.js');
  const { MODELS } = require('../server/seed/legacyData/cisco.js');
  const g2 = MODELS.find((m) => m.id === 'Cisco Secure Router C8231-G2');
  const c8k = MODELS.find((m) => m.ser === 'Catalyst 8000');
  const asr = MODELS.find((m) => m.ser === 'ASR 1000');
  assert.deepStrictEqual(M.requisitos(g2, { pqc: 'mlkem' }).motivos, []);
  // Desde el 2026-10-27 (guía de IOS XE 17): la PPK basta para «clave», no para ML-KEM.
  assert.deepStrictEqual(M.requisitos(c8k, { pqc: 'clave' }).motivos, []);
  assert.deepStrictEqual(M.requisitos(c8k, { pqc: 'mlkem' }).motivos,
    ['criptografía post-cuántica: su documento da PPK (RFC 8784), no un algoritmo ML-KEM']);
  assert.deepStrictEqual(M.requisitos(asr, { pqc: 'clave' }).motivos,
    ['criptografía post-cuántica: no consta en ningún documento oficial que la traiga']);
});

test('Juniper: con PPK basta, los seis SRX pasan; con ML-KEM se apartan diciendo qué traen', () => {
  const M = require('../public/js/juniper-motor.js');
  const { MODELS } = require('../server/seed/legacyData/juniper.js');
  const srx = MODELS.filter((m) => m.ngfw != null || m.fw != null);
  const clave = M.candidatosSrx(srx, 'fw', 1, 0, 'clave');
  assert.deepStrictEqual(clave.candidatos.map((m) => m.id).sort(),
    srx.filter((m) => m.fw != null && m.pqc).map((m) => m.id).sort());
  const ml = M.candidatosSrx(srx, 'fw', 1, 0, 'mlkem');
  assert.strictEqual(ml.candidatos.length, 0);
  assert.ok(ml.outByPqc.some((x) => x.id === 'SRX1500' && /PPK \(RFC 8784\), no un algoritmo ML-KEM/.test(x.motivo)));
  assert.deepStrictEqual(M.candidatosSrx(srx, 'fw', 1, 0, '').outByPqc, []);
});

test('MikroTik: la PPK basta para «clave» y no para ML-KEM; Huawei: nada documentado, todo se aparta', () => {
  const MK = require('../public/js/mikrotik-motor.js');
  const DK = require('../server/seed/legacyData/mikrotik');
  const opc = { licencias: DK.LICENSE_LEVELS, bgpRam: DK.BGP_RAM, rango: () => 0 };
  const ev = MK.evaluar({ bw: 100, head: 0, firewall: 'completo', trama: 512, pqc: 'clave' }, DK.MODELS, opc);
  assert.ok(ev.pick && ev.pick.m.pqc, 'recomienda un equipo con PPK documentada');
  const sinDoc = /no consta en ningún documento oficial/;
  for (const r of ev.rows) {
    assert.strictEqual(r.miss.some((x) => sinDoc.test(x)), !r.m.pqc, `${r.m.id}: el motivo sale donde no hay documento`);
  }
  const ml = MK.evaluar({ bw: 100, head: 0, firewall: 'completo', trama: 512, pqc: 'mlkem' }, DK.MODELS, opc);
  assert.strictEqual(ml.pick, null);
  assert.ok(ml.rows.some((r) => r.miss.some((x) => /PPK \(RFC 8784\), no un algoritmo ML-KEM/.test(x))));

  const HW = require('../public/js/huawei-motor.js');
  const { MODELS } = require('../server/seed/legacyData/huawei.js');
  const esc = { bw: 100, unit: 1, mode: 'link', sites: 1, conc: 40, head: 30, dirMult: 2, frame: 340,
    profile: 'typ', lan: 0, aps: 0, svc: { sdwan: true, utm: false, slice: false }, want: {}, pqc: 'mlkem' };
  const h = HW.evaluar(esc, MODELS, {});
  assert.strictEqual(h.pick, null);
  const grupos = HW.resumenApartados(h).grupos;
  assert.ok(grupos.some((g) => g.tipo === 'pqc' && /criptografía post-cuántica/.test(g.etiqueta)));
  assert.ok(HW.evaluar({ ...esc, pqc: '' }, MODELS, {}).pick, 'sin exigirla, el mismo escenario recomienda');
});

test('Fortinet: el motor (navegador y servidor) bloquea con PQC_NO_CONSTA y su motivo', () => {
  const M = require('../public/js/fortinet-motor.js');
  const fortinet = require('../server/seed/legacyData/fortinet.js');
  // Todos los FortiGate del catálogo documentan ML-KEM (Maximum Values Table o Release Notes);
  // uno sin `pqc` es el caso que la regla tiene que bloquear.
  assert.ok(fortinet.MODELS.every((m) => m.pqc && m.pqc.tipo === 'mlkem'));
  const sinDoc = { ...fortinet.MODELS.find((m) => m.id === 'FortiGate 90G'), pqc: null };
  const CAT = { models: [sinDoc], bundles: fortinet.BUNDLES, care: fortinet.CARE, funciones: fortinet.FUNCIONES,
    serviciosSdwan: fortinet.SERVICIOS_SDWAN, terminos: fortinet.TERMINOS, fortios: fortinet.FORTIOS,
    ems: fortinet.EMS_LICENCIAS, sase: fortinet.SASE_USUARIOS, datasetVersion: 'fortinet@prueba' };
  const esc = (pqc) => ({ topologia: { rol: 'none', enlaces: [{ id: 1, tipo: 'DIA', down: 100 }] }, seguridad: { capa: 'fw', pqc } });
  const r = M.evaluar(esc('mlkem'), CAT, { hoy: '2026-10-27T00:00:00Z' });
  const c = r.candidatos.find((x) => x.id === 'FortiGate 90G' || (x.m && x.m.id === 'FortiGate 90G')) || r.candidatos[0];
  const bloqueos = JSON.stringify(c);
  assert.match(bloqueos, /PQC_NO_CONSTA/);
  assert.match(bloqueos, /no consta en ningún documento oficial/);
  assert.doesNotMatch(JSON.stringify(M.evaluar(esc(''), CAT, { hoy: '2026-10-27T00:00:00Z' }).candidatos), /PQC_NO_CONSTA/);
  // Un nivel fuera de la enumeración es un error del escenario, no un «no se exige» silencioso.
  assert.ok(M.normalizar(esc('cuantica'), CAT).errores.length > 0);
});
