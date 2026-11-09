'use strict';
/* PRUEBA METAMORFICA (auditoria 2026-11-09): el equipo recomendado NO puede depender del orden
   en que llega el catalogo. La base de datos sirve los modelos en el orden de su indice unico;
   si dos equipos empatan en cifra y el motor no desempata, el elegido cambia con ese orden.
   Cada motor se evalua con el catalogo original y con varios barajados deterministas, y la
   recomendacion tiene que ser siempre la misma. */

const test = require('node:test');
const assert = require('node:assert');

const fortinetM = require('../public/js/fortinet-motor.js');
const ciscoM = require('../public/js/cisco-motor.js');
const huaweiM = require('../public/js/huawei-motor.js');
const mikrotikM = require('../public/js/mikrotik-motor.js');
const fortinet = require('../server/seed/legacyData/fortinet.js');
const SKUS = require('../server/seed/legacyData/fortinetSkus.js');
const cisco = require('../server/seed/legacyData/cisco.js');
const huawei = require('../server/seed/legacyData/huawei.js');
const mikrotik = require('../server/seed/legacyData/mikrotik.js');

// Generador pseudoaleatorio con semilla fija: la prueba es reproducible.
const baraje = (semilla) => {
  let s = semilla;
  const rnd = () => { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648; };
  return (a) => {
    const b = a.slice();
    for (let i = b.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [b[i], b[j]] = [b[j], b[i]];
    }
    return b;
  };
};
const SEMILLAS = [1, 7, 13, 42, 99, 2026];
const BW = [10, 50, 100, 200, 500, 1000, 2000, 5000, 10000];

// Devuelve los escenarios en los que el orden del catalogo cambia el recomendado.
function rompen(escenarios, correr, modelos) {
  const malos = [];
  for (const { clave, esc } of escenarios) {
    const base = correr(esc, modelos);
    for (const semilla of SEMILLAS) {
      const otro = correr(esc, baraje(semilla)(modelos));
      if (otro !== base) { malos.push(`${clave}: ${base} / ${otro} (semilla ${semilla})`); break; }
    }
  }
  return malos;
}

test('Fortinet: barajar el catalogo no cambia el equipo recomendado', () => {
  const modelos = fortinet.MODELS.map((m) => ({ ...m, eol: !m.hwSku,
    elpN: ((SKUS[m.id] || []).find((x) => x.sku === m.hwSku) || {}).p ?? null }));
  const cat = (ms) => ({ models: ms, bundles: fortinet.BUNDLES, care: fortinet.CARE, funciones: fortinet.FUNCIONES,
    serviciosSdwan: fortinet.SERVICIOS_SDWAN, terminos: fortinet.TERMINOS, fortios: fortinet.FORTIOS,
    ems: fortinet.EMS_LICENCIAS, sase: fortinet.SASE_USUARIOS, datasetVersion: 'fortinet@prueba' });
  const escenarios = [];
  for (const segmento of ['branch', 'campus', 'dc']) for (const capa of ['fw', 'tp']) for (const bw of BW) {
    escenarios.push({ clave: `${segmento}/${capa}/${bw}`, esc: {
      sitio: { segmento },
      topologia: { rol: 'spoke', hubs: 1, enlaces: [{ id: 1, tipo: 'DIA', down: bw, overlay: true }] },
      trafico: { interVlanMbps: bw / 4 },
      seguridad: { capa, funciones: capa === 'tp' ? ['chkAv', 'chkWeb'] : [] },
      remoto: { activo: false },
      escala: { usuarios: 200, sesionesPorUsuario: 50, vidaSesionS: 30 },
      politica: { crecimientoPct: 30, techoPct: 70 },
    } });
  }
  const malos = rompen(escenarios, (esc, ms) => {
    const r = fortinetM.evaluar(esc, cat(ms), { hoy: '2026-09-23T00:00:00Z' });
    return r.recomendacion ? r.recomendacion.id : null;
  }, modelos);
  assert.deepStrictEqual(malos.slice(0, 5), [], `${malos.length} escenarios dependen del orden`);
});

test('Cisco: barajar el catalogo no cambia el primer candidato', () => {
  const escenarios = [];
  for (const plataforma of ['xe', 'isr', 'meraki', 'asr']) for (const perfil of Object.keys(ciscoM.PERFILES))
    for (const seguridad of Object.keys(ciscoM.SEGURIDAD)) for (const bw of BW) {
      escenarios.push({ clave: `${plataforma}/${perfil}/${seguridad}/${bw}`, esc: {
        modo: 'link', bwMbps: bw, dirMult: 2, headPct: 30, perfil, plataforma, seguridad,
        diaPct: seguridad === 'ninguna' ? 0 : 30 } });
    }
  const malos = rompen(escenarios, (esc, ms) => {
    const r = ciscoM.evaluar(ms, esc);
    return r.candidatos[0] ? r.candidatos[0].m.id : null;
  }, cisco.MODELS);
  assert.deepStrictEqual(malos.slice(0, 5), [], `${malos.length} escenarios dependen del orden`);
});

test('Huawei: barajar el catalogo no cambia el recomendado', () => {
  const escenarios = [];
  for (const plataforma of Object.keys(huaweiM.PLATAFORMAS)) for (const profile of huaweiM.CAPAS) for (const bw of BW) {
    escenarios.push({ clave: `${plataforma}/${profile}/${bw}`, esc: {
      bw, unit: 1, mode: 'link', sites: 20, conc: 40, head: 30, dirMult: 2, frame: 340, profile, plataforma,
      lan: 0, aps: 0, svc: { sdwan: false, utm: false }, want: {} } });
  }
  const malos = rompen(escenarios, (esc, ms) => {
    const r = huaweiM.evaluar(esc, ms);
    return r.pick ? r.pick.m.id : null;
  }, huawei.MODELS);
  assert.deepStrictEqual(malos.slice(0, 5), [], `${malos.length} escenarios dependen del orden`);
});

test('MikroTik: barajar el catalogo no cambia el recomendado', () => {
  const opc = { licencias: mikrotik.LICENSE_LEVELS, bgpRam: mikrotik.BGP_RAM };
  const escenarios = [];
  for (const perfil of Object.keys(mikrotikM.PERFILES)) for (const firewall of Object.keys(mikrotikM.FIREWALL))
    for (const trama of Object.keys(mikrotikM.TRAMAS)) for (const bw of BW) {
      escenarios.push({ clave: `${perfil}/${firewall}/${trama}/${bw}`, esc: {
        bw, head: 20, perfil, firewall, trama, modo: 'sitio', sedes: 10, conc: 50 } });
    }
  const malos = rompen(escenarios, (esc, ms) => {
    const r = mikrotikM.evaluar(esc, ms, opc);
    return r.pick ? r.pick.m.id : null;
  }, mikrotik.MODELS);
  assert.deepStrictEqual(malos.slice(0, 5), [], `${malos.length} escenarios dependen del orden`);
});
