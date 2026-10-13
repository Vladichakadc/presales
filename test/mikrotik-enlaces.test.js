'use strict';
// SEGUNDO ENLACE WAN EN EL DIMENSIONADOR MIKROTIK (2026-10-13). Encargo del dueño: «qué pasa si se
// necesita incluir un segundo enlace, de Internet o MPLS, principal y backup; cómo se comporta el
// equipo; los módulos SFP recomendados de acuerdo al ancho de banda». Lo que fija esta batería:
//   1. un respaldo ocupa puerto y no suma; dos principales suman; el caudal es el máximo entre el
//      escenario normal y los de falla (un respaldo más rápido gobierna);
//   2. cada enlace va a un puerto del equipo según su velocidad y su entrega, y el módulo sale de la
//      matriz oficial de MikroTik: lo que la matriz marca «-» para ese equipo no se recomienda;
//   3. un equipo al que no le caben los enlaces y un puerto de LAN se aparta con su motivo;
//   4. MPLS principal con respaldo de Internet: en la falla el tráfico va cifrado, y esa celda
//      IPsec también se comprueba;
//   5. sin enlaces declarados, el dimensionador hace lo de antes.
const test = require('node:test');
const assert = require('node:assert');
const M = require('../public/js/mikrotik-motor.js');
const D = require('../server/seed/legacyData/mikrotik');

const rango = (m) => (m.eol ? 2 : m.legacy ? 1 : 0);
const MODULOS = {};
for (const lista of Object.values(D.OPTICS)) for (const o of lista) MODULOS[o.sku] = { price: o.price, d: o.d };
const OPC = { licencias: D.LICENSE_LEVELS, bgpRam: D.BGP_RAM, rango, compat: D.COMPATIBILIDAD, notas: D.NOTAS_COMPAT, modulos: MODULOS };
const evaluar = (esc) => M.evaluar({ head: 0, ...esc }, D.MODELS, OPC);
const fila = (ev, id) => ev.rows.find((r) => r.m.id === id);
const E = (tipo, rol, mbps, medio) => ({ tipo, rol, mbps, medio });

test('sin enlaces declarados: un principal con la velocidad del sitio, como antes', () => {
  const ev = evaluar({ bw: 500 });
  assert.strictEqual(ev.enlaces.length, 1);
  assert.strictEqual(ev.enlaces[0].rol, 'principal');
  assert.strictEqual(ev.porSentido, 500);
  assert.strictEqual(ev.pick.m.id, 'hEX E50UG');
  const a = ev.pick.puertos.asig[0];
  assert.strictEqual(a.puerto, 'puerto Ethernet 1G');
  assert.strictEqual(a.sku, null, 'sin entrega definida no se recomienda módulo');
});

test('principal y respaldo: el respaldo ocupa puerto pero no suma', () => {
  const ev = evaluar({ bw: 500, enlaces: [E('internet', 'principal', 500, 'cobre'), E('mpls', 'respaldo', 300, 'cobre')] });
  assert.strictEqual(ev.wan.normal, 500);
  assert.strictEqual(ev.porSentido, 500);
  assert.strictEqual(ev.pick.puertos.asig.length, 2);
  assert.ok(ev.avisos.some((a) => /^Failover:/.test(a)));
});

test('un respaldo más rápido que el principal gobierna: en la falla el equipo reenvía su velocidad', () => {
  const ev = evaluar({ bw: 300, enlaces: [E('internet', 'principal', 300, 'cobre'), E('internet', 'respaldo', 1000, 'cobre')] });
  assert.strictEqual(ev.wan.caudal, 1000);
  assert.strictEqual(ev.porSentido, 1000);
  assert.ok(ev.avisos.some((a) => /Gobierna la falla del enlace 1/.test(a)));
});

test('dos principales son balanceo y suman', () => {
  const ev = evaluar({ bw: 500, enlaces: [E('internet', 'principal', 500, 'cobre'), E('internet', 'principal', 500, 'cobre')] });
  assert.strictEqual(ev.porSentido, 1000);
  assert.ok(ev.avisos.some((a) => /^Balanceo:/.test(a)));
});

test('fibra monomodo de 1 Gbps: aparta a los que no tienen jaula y pone el módulo de la matriz', () => {
  const ev = evaluar({ bw: 500, enlaces: [E('internet', 'principal', 1000, 'fibra-sm')] });
  assert.ok(fila(ev, 'hEX E50UG').miss.some((x) => /no tiene jaulas SFP/.test(x)));
  const a = ev.pick.puertos.asig[0];
  assert.match(a.puerto, /^jaula SFP/);
  assert.strictEqual(a.sku, 'S-31DLC20D');
  assert.strictEqual(a.precio, 29);
});

test('cobre por encima de 1 Gbps: puerto de 2,5G si lo hay; si no, S+RJ10 donde la matriz lo admite', () => {
  const rb = D.MODELS.find((m) => m.id === 'RB5009UG+S+IN');
  const a25 = M.asignarPuertos(rb, [{ n: 1, ...E('internet', 'principal', 2500, 'cobre') }], OPC).asig[0];
  assert.strictEqual(a25.puerto, 'puerto Ethernet 2,5G');
  assert.strictEqual(a25.sku, null);
  const r5 = M.asignarPuertos(rb, [{ n: 1, ...E('internet', 'principal', 5000, 'cobre') }], OPC);
  assert.strictEqual(r5.asig[0].sku, 'S+RJ10');
  assert.ok(r5.avisos.some((x) => /refrigeración pasiva/.test(x)), 'el RB5009 es pasivo: la matriz no recomienda el S+RJ10 sin ventilación');
  // L009: su jaula SFP admite 2,5G, pero la matriz marca «-» el S+RJ10.
  const l009 = D.MODELS.find((m) => m.id === 'L009UiGS-RM');
  const rl = M.asignarPuertos(l009, [{ n: 1, ...E('internet', 'principal', 2500, 'cobre') }], OPC);
  assert.match(rl.miss[0], /no admite el S\+RJ10/);
});

test('dos enlaces de 10G en fibra: el RB5009 (1 SFP+) se aparta y el CCR2004-16G-2S+ lleva dos S+31DLC10D', () => {
  const ev = evaluar({ bw: 10, unit: 1000, firewall: 'ninguno', enlaces: [E('internet', 'principal', 10000, 'fibra-sm'), E('mpls', 'respaldo', 10000, 'fibra-sm')] });
  assert.ok(fila(ev, 'RB5009UG+S+IN').miss.some((x) => /enlace 2/.test(x)));
  const ccr = fila(ev, 'CCR2004-16G-2S+').puertos.asig;
  assert.deepStrictEqual(ccr.map((a) => a.sku), ['S+31DLC10D', 'S+31DLC10D']);
});

test('un equipo que la matriz no lista lleva el módulo «a consultar», no el de un hermano', () => {
  const pc = D.MODELS.find((m) => m.id === 'CCR2004-16G-2S+PC');
  const r = M.asignarPuertos(pc, [{ n: 1, ...E('internet', 'principal', 1000, 'fibra-sm') }], OPC);
  assert.strictEqual(r.asig[0].sku, null);
  assert.strictEqual(r.asig[0].consultar, true);
  assert.ok(r.avisos.some((x) => /no figura en la matriz oficial/.test(x)));
});

test('siempre queda un puerto para la LAN', () => {
  const r = M.asignarPuertos({ id: 'x', puertos: { ge: 2 } }, [
    { n: 1, ...E('internet', 'principal', 100, 'cobre') }, { n: 2, ...E('internet', 'respaldo', 100, 'cobre') }], OPC);
  assert.match(r.miss[0], /no queda ninguno para la LAN/);
});

test('MPLS principal con respaldo de Internet: la celda IPsec del respaldo también se comprueba', () => {
  const enlaces = [E('mpls', 'principal', 200, 'cobre'), E('internet', 'respaldo', 200, 'cobre')];
  const ev = evaluar({ bw: 200, enlaces });
  assert.strictEqual(ev.respaldoCifrado, true);
  assert.ok(fila(ev, 'hEX lite RB750r2').miss.some((x) => /respaldo cifrado por Internet: la ficha no publica IPsec/.test(x)));
  assert.ok(ev.avisos.some((a) => /^Respaldo cifrado:/.test(a)));
  // Si el respaldo no se cifra, no se exige.
  const sin = evaluar({ bw: 200, enlaces, respaldoIpsec: false });
  assert.ok(!fila(sin, 'hEX lite RB750r2').miss.some((x) => /respaldo cifrado/.test(x)));
});

test('la matriz extraída dice lo que dice la página oficial en los casos que deciden', () => {
  assert.strictEqual(D.COMPATIBILIDAD['hEX S']['S+RJ10'], false);
  assert.strictEqual(D.COMPATIBILIDAD.L009['S+31DLC10D'], '14');
  assert.strictEqual(D.COMPATIBILIDAD['CCR2004-1G-12S+2XS']['S+RJ10'], '11');
  assert.match(D.NOTAS_COMPAT['14'], /up to 2\.5G rate, manual speed setting/);
  // Cada modelo con jaulas y fila de matriz la tiene en la tabla, y cada SKU recomendable tiene precio.
  for (const m of D.MODELS.filter((x) => x.compat)) assert.ok(D.COMPATIBILIDAD[m.compat], m.id);
  for (const x of M.MODULOS) assert.ok(MODULOS[x.sku], `${x.sku} sin precio en OPTICS`);
});
