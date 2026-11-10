'use strict';
/* LA LISTA DE MATERIALES DE CISCO, SIN DOM (fase 2 de la auditoria del 2026-11-09, ADR-1, corte 3).
   `CiscoMotor.lineasBom` arma las filas que renderBom() armaba entre el pintado. Que de lo mismo que el
   bloque de la pagina lo mide scripts/equivalencias/cisco-bom.js en cada PR; aqui van las reglas de
   cantidad que la funcion promete por si misma. */
const test = require('node:test');
const assert = require('node:assert');
const M = require('../public/js/cisco-motor.js');
const C = require('../server/seed/legacyData/cisco.js');

const m = C.MODELS.find((x) => x.lic === 'cswan') || C.MODELS[0];
const p0 = { modo: 'link', bwMbps: 500, dirMult: 2, headPct: 30, perfil: 'sdwan', plataforma: 'xe', seguridad: 'ninguna',
  enlaces: [], requisitos: {}, catalogo: { optics: {}, modulosG2: [], modulosC8k: [] }, ha: false };
const licencia = { gestion: 'sdwan', nivel: '', seguridad: 'ninguna', url: false, malware: false, anios: 3, trafico: 0, vpns: 0, modulos: [] };
const ctx = (extra) => ({ m, p: p0, sedesQty: 3, anios: 3, optQty: 0, mods: { lista: [] }, crit: 'low', sel: {},
  pid: 'PID-PRUEBA', vencido: false, licencia, firewall: null, secureAccess: { filas: [], avisos: [] },
  datos: { CELULAR: {}, OPTICS: {}, OPTIC_LABEL: {}, PARTS_DESC: {}, SMARTNET: {}, LIC_G2: C.LICENCIAS_G2, LIC_DNA: C.LICENCIAS_DNA, PIM_SKUS: [],
    CASILLA_REQ: {}, CASILLA_LIC: {}, CASILLA_SA: { privado: 'saPrivado' } }, ...extra });
const equipo = (r) => r.filas.find((f) => f.cat === 'Equipo');

test('el equipo va por sede, y con dos routers por sede (HA) se duplica', () => {
  assert.strictEqual(equipo(M.lineasBom(ctx())).qty, 3);
  assert.strictEqual(equipo(M.lineasBom(ctx({ p: { ...p0, ha: true } }))).qty, 6);
  assert.strictEqual(equipo(M.lineasBom(ctx())).sku, 'PID-PRUEBA', 'la referencia la da la pagina');
});

test('Secure Access va por cliente y por usuario: su cantidad no se multiplica por los equipos', () => {
  const sa = { filas: [{ cat: 'Seguridad', desc: 'Secure Access', sku: 'SA-PRUEBA', qty: 250, req: 'privado', nota: '' }], avisos: ['aviso SA'] };
  const r = M.lineasBom(ctx({ p: { ...p0, ha: true }, secureAccess: sa }));
  const fila = r.filas.find((f) => f.sku === 'SA-PRUEBA');
  assert.strictEqual(fila.qty, 250);
  assert.strictEqual(fila.por, 'saPrivado', 'la fila lleva la casilla que la pidio');
  assert.ok(r.avisosLic.includes('aviso SA'), 'el aviso de Secure Access va con los de licencias');
});

test('el soporte del nivel elegido, con su termino; sin nivel en el catalogo, no hay fila', () => {
  const r = M.lineasBom(ctx({ datos: { ...ctx().datos, SMARTNET: { low: { n: 'Smart Net Total Care 8x5xNBD', sla: '8x5xNBD' } } } }));
  const sn = r.filas.find((f) => f.cat === 'Soporte');
  assert.ok(sn && sn.qty === 3 && /término 3 año/.test(sn.nota));
  assert.ok(!M.lineasBom(ctx()).filas.some((f) => f.cat === 'Soporte'));
});

test('las opticas elegidas van por equipo; sin modelo elegido, la linea pide elegirlo', () => {
  const r = M.lineasBom(ctx({ optQty: 2 }));
  const op = r.filas.find((f) => f.cat === 'Ópticas');
  assert.strictEqual(op.qty, 6);
  assert.strictEqual(op.sku, null);
  assert.match(op.desc, /elegir el modelo/);
});
