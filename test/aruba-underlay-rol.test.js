'use strict';
// R11 de la auditoria de Fortinet (2026-09-23) y M9 de la auditoria de Aruba (2026-09-17):
// un enlace de RESPALDO no suma en operacion normal. `estadoDerivado()` sumaba todos los
// enlaces del Multi-Underlay Builder, asi que un 4G de backup inflaba el caudal, el tier de
// la suscripcion y a veces el appliance. La regla es la misma que Fortinet aplica en
// `escenariosTrafico` desde la etapa 7, y vive en `ArubaReglas.escenariosUnderlay`.
//
// Lo que NO puede moverse —un sitio sin respaldos sale identico— lo vigila ademas el
// contraste `aruba-underlay`, medido en Chromium antes del cambio.

const test = require('node:test');
const assert = require('node:assert');

const aruba = require('../server/seed/legacyData/aruba.js');
const R = require('../public/js/aruba-reglas.js');
const { calcularRequerimientosIngenieria } = require('../public/js/motor-ingenieria.js');

const enlace = (id, tipo, down, rol) => Object.assign({ id, tipo, down, up: down, medio: 'RJ45' }, rol ? { rol } : {});

test('R11: sin respaldos, la operacion normal son las mismas sumas de siempre', () => {
  const links = [enlace(1, 'MPLS L3', 200), enlace(2, 'DIA', 300), enlace(3, '4G/5G', 100)];
  const esc = R.escenariosUnderlay(links);
  assert.strictEqual(esc.length, 1, 'sin respaldos no hay escenarios de falla que evaluar');
  const [n] = esc;
  // La formula anterior: caudalTotal = Σ down; mplsMbps = Σ down MPLS; inet = el resto.
  assert.strictEqual(n.total, links.reduce((s, l) => s + l.down, 0));
  assert.strictEqual(n.mpls, 200);
  assert.strictEqual(n.inet, 400);
  assert.strictEqual(n.respaldo, 0);
});

test('R11: un rol ausente o desconocido es «activo» (los enlaces ya compartidos no traen rol)', () => {
  const sin = R.escenariosUnderlay([enlace(1, 'DIA', 500)])[0];
  const raro = R.escenariosUnderlay([Object.assign(enlace(1, 'DIA', 500), { rol: 'x' })])[0];
  assert.strictEqual(sin.total, 500);
  assert.strictEqual(raro.total, 500);
});

test('M9: un 4G de respaldo no suma al caudal de operacion normal', () => {
  const esc = R.escenariosUnderlay([enlace(1, 'DIA', 1000), enlace(2, '4G/5G', 200, 'respaldo')]);
  const n = esc[0];
  assert.strictEqual(n.total, 1000);
  assert.strictEqual(n.inet, 1000);
  assert.strictEqual(n.respaldo, 200);
  // Cae el DIA: el 4G recoge 200 y quedan 800 sin cursar.
  const f = esc.find((e) => e.id === 'falla:1');
  assert.ok(f, 'hay escenario de falla del activo');
  assert.strictEqual(f.total, 200);
  assert.strictEqual(f.perdida, 800);
  assert.strictEqual(f.enlace, 1);
  assert.strictEqual(f.caidoMbps, 1000);
});

test('M9: el tier de la suscripcion deja de subir por el respaldo (caso medido en pantalla)', () => {
  // DIA 1000 + 4G 200: con los dos sumando, Foundation pasaba de 1 Gbps a «sin límite»
  // (en pantalla, $80.857 frente a $42.697 con el 4G como respaldo).
  const todosActivos = R.escenariosUnderlay([enlace(1, 'DIA', 1000), enlace(2, '4G/5G', 200)])[0];
  const conRespaldo = R.escenariosUnderlay([enlace(1, 'DIA', 1000), enlace(2, '4G/5G', 200, 'respaldo')])[0];
  const tierDe = (mbps) => R.tierParaCaudal(aruba.BW_TIERS, aruba.LICENSES, mbps, 'foundation').code;
  assert.strictEqual(tierDe(todosActivos.total), 'bwunl');
  assert.strictEqual(tierDe(conRespaldo.total), 'bw1g');
});

test('R11: el caudal que recoge un respaldo cuenta en la familia del RESPALDO', () => {
  // Cae el MPLS y lo cubre un 4G: ese caudal viaja por Internet, no por MPLS.
  const esc = R.escenariosUnderlay([enlace(1, 'MPLS L3', 300), enlace(2, 'DIA', 500), enlace(3, '4G/5G', 100, 'respaldo')]);
  const f = esc.find((e) => e.id === 'falla:1');
  assert.strictEqual(f.mpls, 0);
  assert.strictEqual(f.inet, 600);
  assert.strictEqual(f.perdida, 200);
  // Y cae el DIA: el 4G recoge 100 de sus 500.
  const g = esc.find((e) => e.id === 'falla:2');
  assert.strictEqual(g.mpls, 300);
  assert.strictEqual(g.inet, 100);
  assert.strictEqual(g.perdida, 400);
});

test('R11: varios respaldos se reparten la carga del activo caido en orden', () => {
  const esc = R.escenariosUnderlay([enlace(1, 'DIA', 500), enlace(2, '4G/5G', 100, 'respaldo'), enlace(3, 'MPLS L2', 300, 'respaldo')]);
  const f = esc.find((e) => e.id === 'falla:1');
  assert.strictEqual(f.inet, 100);
  assert.strictEqual(f.mpls, 300);
  assert.strictEqual(f.perdida, 100);
});

test('R11: ninguna falla supera a la operacion normal, asi que la normal dimensiona', () => {
  // Propiedad sobre combinaciones: por eso el appliance, el tier y el Boost se calculan con
  // la operacion normal y las fallas solo informan de la perdida.
  const tipos = ['MPLS L3', 'DIA', 'Banda Ancha', '4G/5G'];
  let casos = 0;
  for (let a = 0; a < tipos.length; a++) {
    for (let b = 0; b < tipos.length; b++) {
      for (const d1 of [50, 700, 5000]) {
        for (const d2 of [20, 400, 6000]) {
          const links = [enlace(1, tipos[a], d1), enlace(2, 'DIA', 250), enlace(3, tipos[b], d2, 'respaldo')];
          const esc = R.escenariosUnderlay(links);
          const normal = esc[0];
          for (const e of esc.slice(1)) {
            assert.ok(e.total <= normal.total, `${tipos[a]} ${d1} / ${tipos[b]} ${d2}: la falla ${e.id} (${e.total}) supera la normal (${normal.total})`);
            const disNormal = calcularRequerimientosIngenieria({ bw_mpls_mbps: normal.mpls, bw_internet_mbps: normal.inet, local_breakout_activo: true, headroom_pct: 30 }).throughputDisenoMbps;
            const disFalla = calcularRequerimientosIngenieria({ bw_mpls_mbps: e.mpls, bw_internet_mbps: e.inet, local_breakout_activo: true, headroom_pct: 30 }).throughputDisenoMbps;
            assert.ok(disFalla <= disNormal, `la falla ${e.id} pediria mas appliance que la operacion normal`);
            casos++;
          }
        }
      }
    }
  }
  assert.ok(casos > 100, 'la propiedad se comprobo sobre suficientes combinaciones');
});

test('R11: un enlace sin caudal no cuenta ni como activo ni como respaldo', () => {
  const esc = R.escenariosUnderlay([enlace(1, 'DIA', 0), enlace(2, 'MPLS L3', 100), enlace(3, '4G/5G', 0, 'respaldo')]);
  assert.strictEqual(esc.length, 1, 'un respaldo sin caudal no genera escenarios');
  assert.strictEqual(esc[0].total, 100);
});

test('R11: solo respaldos deja la operacion normal en cero (la pagina pide un activo)', () => {
  const esc = R.escenariosUnderlay([enlace(1, '4G/5G', 100, 'respaldo')]);
  assert.strictEqual(esc[0].total, 0);
  assert.strictEqual(esc[0].respaldo, 100);
  assert.strictEqual(esc.length, 1, 'sin activos no hay nada que se pueda caer');
});
