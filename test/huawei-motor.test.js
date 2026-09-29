'use strict';
// Motor puro del dimensionador Huawei (public/js/huawei-motor.js).
// LINEA BASE: los escenarios de `LEGADO` se midieron reproduciendo render() sobre
// legacyData/huawei.js en el commit f2a939d (revision del 2026-09-29), ANTES de tocar nada.
// `legado:true` reproduce ese comportamiento; sin la opcion rigen las correcciones H-01..H-05.
const test = require('node:test');
const assert = require('node:assert');
const M = require('../public/js/huawei-motor.js');
const { MODELS } = require('../server/seed/legacyData/huawei.js');

const esc = (o) => Object.assign({ bw: 500, unit: 1, mode: 'link', sites: 1, conc: 40, head: 30, dirMult: 2, frame: 340,
  profile: 'typ', lan: 0, aps: 0, svc: { sdwan: true, utm: false, slice: false }, want: {} }, o);
const pick = (o, opc) => { const r = M.evaluar(esc(o), MODELS, opc); return r.pick && r.pick.m.id; };

const LEGADO = [
  ['500 Mbps SD-WAN', {}, 'AR6710-L14T2X4'],
  ['500 Mbps SD-WAN, total agregado', { dirMult: 1 }, 'AR5710-S8T2XE'],
  ['50 Mbps SD-WAN', { bw: 50 }, 'AR5710-S8T2S'],
  ['perfil fwd + SD-WAN marcado', { profile: 'fwd' }, 'AR5710-S8T2S'],
  ['perfil ipsec + SD-WAN', { profile: 'ipsec' }, 'AR6710-L8T3TS1X2'],
  ['UTM + SD-WAN 300 Mbps', { bw: 300, svc: { sdwan: true, utm: true } }, 'AR6710-L8T3TS1X2'],
  ['2 Gbps fwd sin SD-WAN', { bw: 2000, profile: 'fwd', svc: { sdwan: false } }, 'AR6710-H4T4X2Y7'],
  ['6 Gbps fwd sin SD-WAN', { bw: 6000, profile: 'fwd', svc: { sdwan: false } }, 'AR8140-12G10XG'],
  ['1 Gbps fwd + slicing', { bw: 1000, profile: 'fwd', svc: { sdwan: false, slice: true } }, 'AR6710-L14T2X4'],
  ['hub 100 sedes x 50 Mbps', { bw: 50, mode: 'agg', sites: 100 }, 'AR6710-H4T4X2Y7'],
  ['SD-WAN 500 Mbps + 8 LAN', { lan: 8 }, 'AR6710-L14T2X4'],
  ['SD-WAN 2 Gbps + 8 LAN', { bw: 2000, dirMult: 1, lan: 8 }, null],
  ['450 Mbps fwd + PoE + Wi-Fi', { bw: 450, profile: 'fwd', svc: {}, want: { poe: true, wifi: true } }, 'AR651W-8P'],
];
for (const [n, o, esperado] of LEGADO) {
  test(`linea base (legado) · ${n}`, () => assert.strictEqual(pick(o, { legado: true }), esperado));
}

test('H-01 · SD-WAN fija el piso de capa: perfil fwd + SD-WAN ya no dimensiona contra el reenvío', () => {
  const r = M.evaluar(esc({ profile: 'fwd' }), MODELS);
  assert.strictEqual(r.pk, 'typ');
  assert.ok(r.pick.cap >= r.need);
  assert.strictEqual(r.pick.cap, r.pick.m.typ, 'la capacidad comparada es la de SD-WAN típico');
  assert.notStrictEqual(r.pick.m.id, 'AR5710-S8T2S');
  assert.ok(r.avisos.some((a) => /sube de/.test(a)));
});

test('H-01 · sin funciones activas el perfil manda y no se sube nada', () => {
  const r = M.evaluar(esc({ profile: 'fwd', svc: { sdwan: false } }), MODELS);
  assert.strictEqual(r.pk, 'fwd');
  assert.strictEqual(r.avisos.length, 0);
});

test('H-01 · el perfil más hondo que el piso se respeta', () => {
  assert.strictEqual(M.capaEfectiva('typ', { sdwan: true }).capa, 'typ');
  assert.strictEqual(M.capaEfectiva('ipsec', { sdwan: false }).capa, 'ipsec');
});

test('H-02 · UTM declara que no hay cifra de inspección y no finge una', () => {
  const r = M.evaluar(esc({ bw: 300, svc: { sdwan: true, utm: true } }), MODELS);
  assert.ok(r.avisos.some((a) => /prueba de concepto/.test(a)));
  const sin = M.evaluar(esc({ bw: 300 }), MODELS);
  assert.ok(!sin.avisos.some((a) => /prueba de concepto/.test(a)));
});

test('H-04 · slicing FlexE aparta la serie AR; nodo de núcleo solo compite NetEngine', () => {
  const s = M.evaluar(esc({ bw: 1000, profile: 'fwd', svc: { slice: true } }), MODELS);
  assert.ok(s.rows.filter((r) => !r.isWan).every((r) => r.miss.length));
  const n = M.evaluar(esc({ bw: 5000, mode: 'core' }), MODELS);
  assert.ok(n.pick && n.pick.isWan, 'con SD-WAN marcado por defecto, el nodo de núcleo sigue teniendo respuesta');
  assert.ok(n.rows.filter((r) => !r.isWan).every((r) => r.miss.length));
});

test('H-05 · lan:null es «el catálogo no lo dice» y no descarta a los hubs', () => {
  const hubs = MODELS.filter((m) => m.cls === 'AR' && m.lan == null).map((m) => m.id);
  assert.deepStrictEqual(hubs.sort(), ['AR6710-H4T4X2Y7', 'AR8140-12G10XG', 'AR8140-T-12G10XG', 'AR8700-8'].sort());
  const r = M.evaluar(esc({ bw: 2000, dirMult: 1, lan: 8 }), MODELS);
  assert.ok(r.pick, 'a 2 Gbps con 8 LAN ya hay candidato');
  assert.ok(!r.rows.find((x) => x.m.id === 'AR8140-12G10XG').miss.some((t) => /LAN/.test(t)));
});

test('H-08 · la licencia de rendimiento sale con la necesidad real y no con 0', () => {
  const r = M.evaluar(esc({ bw: 450, profile: 'fwd', svc: {}, want: { poe: true, wifi: true } }), MODELS);
  assert.strictEqual(r.pick.m.id, 'AR651W-8P');
  const con = M.licencias(r.pick, { need: r.need, aps: 0, svc: r.svc, pk: r.pk });
  assert.ok(con.some((l) => /rendimiento/.test(l.t) && l.on));
  const sin = M.licencias(r.pick, { need: 0, aps: 0, svc: r.svc, pk: r.pk });
  assert.ok(!sin.some((l) => /rendimiento/.test(l.t)), 'con need:0 desaparecía: el defecto de H-08');
});

test('sin ancho de banda no hay recomendación', () => {
  assert.strictEqual(M.evaluar(esc({ bw: '' }), MODELS).raw, 0);
});

const { PARTS } = require('../server/seed/legacyData/huawei.js');
const piezas = (id, want) => M.piezasBom(MODELS.find((m) => m.id === id), PARTS, { want: want || {} });

test('H-06 · AR8700-8: las alternativas de MPU y fuente son UNA línea a elegir, no cinco piezas', () => {
  const p = piezas('AR8700-8');
  assert.deepStrictEqual(p.elegir.map((g) => g.grupo).sort(), ['fuente', 'mpu']);
  assert.strictEqual(p.elegir.find((g) => g.grupo === 'mpu').qty, 2, 'la MPU se pide en pareja');
  assert.ok(!p.pedir.some((x) => /^(MPU|PAC|PDC)/.test(x.codigo)));
  assert.ok(p.pedir.some((x) => x.codigo === 'FAN240'));
});

test('H-06 · la tarjeta 5G solo se pide si se pide 4G/5G; las WSIC son ampliación', () => {
  const sin = piezas('AR6710-L26T2X4');
  assert.ok(sin.noAplican.some((x) => x.codigo === 'SICNR'));
  assert.ok(sin.opcionales.some((x) => x.codigo === 'WSIC4GE'));
  assert.ok(!sin.pedir.some((x) => x.codigo === 'SICNR' || x.codigo.startsWith('WSIC')));
  const con = piezas('AR6710-L26T2X4', { wan: true });
  assert.ok(con.pedir.some((x) => x.codigo === 'SICNR'));
});

test('H-06 · doble fuente declarada (redund:true) pide dos; una sola fuente pide una', () => {
  assert.strictEqual(piezas('AR8140-12G10XG').pedir.find((x) => x.codigo === 'PAC350').qty, 2);
  assert.strictEqual(piezas('AR6710-L26T2X4').pedir.find((x) => x.codigo === 'PAC350').qty, 1);
});

test('H-06 · todo código de parts del catálogo tiene un papel declarado (nada cae al valor por defecto)', () => {
  const sinRol = [...new Set(MODELS.flatMap((m) => m.parts || []))].filter((k) => !M.ROL_PIEZA[k]);
  assert.deepStrictEqual(sinRol, []);
});

test('el desempate es determinista: el orden en que la API sirve el catálogo no cambia el elegido', () => {
  const e = esc({ bw: 300, profile: 'ipsec', svc: { sdwan: false } });
  const a = M.evaluar(e, MODELS).pick.m.id;
  const b = M.evaluar(e, [...MODELS].reverse()).pick.m.id;
  assert.strictEqual(a, b);
  assert.strictEqual(a, 'AR5710-S8T2S');
});
