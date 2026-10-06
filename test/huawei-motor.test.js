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
  // Medido en f2a939d con el AR651 sin `typ`, salia el AR5710-S8T2S. Desde el 2026-10-05 el
  // AR651 trae los 600 Mbps de su ficha (AR650, 20250810-v3) y es el mas pequeno que cumple,
  // tambien por el camino legado: lo que cambio es el dato, no el motor.
  ['50 Mbps SD-WAN', { bw: 50 }, 'AR651'],
  ['perfil fwd + SD-WAN marcado', { profile: 'fwd' }, 'AR5710-S8T2S'],
  ['perfil ipsec + SD-WAN', { profile: 'ipsec' }, 'AR6710-L8T3TS1X2'],
  ['UTM + SD-WAN 300 Mbps', { bw: 300, svc: { sdwan: true, utm: true } }, 'AR6710-L8T3TS1X2'],
  ['2 Gbps fwd sin SD-WAN', { bw: 2000, profile: 'fwd', svc: { sdwan: false } }, 'AR6710-H4T4X2Y7'],
  ['6 Gbps fwd sin SD-WAN', { bw: 6000, profile: 'fwd', svc: { sdwan: false } }, 'AR8140-12G10XG'],
  // Medido en f2a939d salia el AR6710-L14T2X4 (4 Gbps). Desde el 2026-10-06 la ficha AR6710-L
  // R26C00 da 3,2 Gbps de reenvio al L26T2X4 (el catalogo decia 2), y cumple los 2,6 Gbps de
  // demanda siendo mas pequeno: otra vez cambio el dato, no el motor.
  ['1 Gbps fwd + slicing', { bw: 1000, profile: 'fwd', svc: { sdwan: false, slice: true } }, 'AR6710-L26T2X4'],
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

test('H3 · la plataforma se elige antes que el caudal: solo compiten los modelos de esa línea', () => {
  const de = (plataforma, o) => M.evaluar(esc({ bw: 2000, profile: 'fwd', svc: {}, plataforma, ...o }), MODELS);
  const ar = de('ar'), ne = de('ne8000'), a8 = de('a800');
  assert.ok(ar.rows.every((r) => r.m.cls === 'AR'), 'AR: solo serie AR');
  assert.ok(ne.rows.every((r) => /^NE8000/.test(r.m.ser)), 'NE8000: solo NE8000');
  assert.ok(a8.rows.every((r) => r.m.ser === 'A800 E'), 'A800 E: solo A800 E');
  assert.strictEqual(ar.pick.m.id, 'AR6710-H4T4X2Y7');
  // Hasta el 2026-10-06 salia el NE8000 M1A, con 176 Gbps. Su ficha da 352 de conmutacion (los
  // 176 eran la capacidad de puertos), y el mas pequeno que cumple pasa a ser el M6 (320): cambio
  // el dato, no la regla de la plataforma, que es lo que esta prueba guarda.
  assert.strictEqual(ne.pick.m.id, 'NE8000 M6');
  assert.strictEqual(a8.pick.m.id, 'NetEngine A813 E');
});

test('H3 · antes, con reenvío puro, un AR y un NE8000 competían en la misma lista (legado)', () => {
  const r = M.evaluar(esc({ bw: 2000, profile: 'fwd', svc: {} }), MODELS, { legado: true });
  assert.ok(r.fit.some((x) => x.isWan) && r.fit.some((x) => !x.isWan), 'la línea base mezclaba familias');
});

test('H3 · en transporte, SD-WAN, UTM, WAC, PoE, 4G/5G, Wi-Fi y LAN no entran en el cálculo', () => {
  const r = M.evaluar(esc({ bw: 2000, plataforma: 'ne8000', svc: { sdwan: true, utm: true }, want: { poe: true, wifi: true }, aps: 50, lan: 24 }), MODELS);
  assert.ok(r.pick, 'las funciones AR no vacían la plataforma de transporte');
  assert.strictEqual(r.pick.m.id, 'NE8000 M6', 'el mismo que sin esas funciones (ver la prueba anterior)');
  assert.ok(!r.avisos.some((a) => /sube de|UTM/.test(a)));
});

test('H3 · en la serie AR el slicing FlexE no entra en el cálculo', () => {
  const con = M.evaluar(esc({ bw: 1000, profile: 'fwd', svc: { slice: true } }), MODELS);
  const sin = M.evaluar(esc({ bw: 1000, profile: 'fwd', svc: {} }), MODELS);
  assert.strictEqual(con.pick.m.id, sin.pick.m.id);
  assert.strictEqual(con.svc.slice, false);
});

test('H3 · FlexE: lo confirmado va antes que lo que no consta, y no se aparta a nadie', () => {
  const r = M.evaluar(esc({ bw: 1000, plataforma: 'a800', svc: { slice: true } }), MODELS);
  assert.strictEqual(r.pick.m.id, 'NetEngine A821 E', 'el único A800 E que declara FlexE');
  assert.strictEqual(r.fit.length, 4, 'los que no lo declaran siguen elegibles');
  assert.ok(r.avisos.some((a) => /FlexE/.test(a) && /no consta/.test(a)));
  const ne = M.evaluar(esc({ bw: 1000, plataforma: 'ne8000', svc: { slice: true } }), MODELS);
  assert.ok(ne.avisos.some((a) => /ningún modelo de esta plataforma lo declara/.test(a)));
});

test('H3 · un escenario viejo con modo «core» se lee como plataforma NE8000', () => {
  const r = M.evaluar(esc({ bw: 5000, mode: 'core' }), MODELS);
  assert.strictEqual(r.plataforma, 'ne8000');
  assert.ok(r.pick && r.pick.isWan);
});

test('H3 · los túneles del hub solo se piden en la serie AR', () => {
  assert.strictEqual(M.evaluar(esc({ bw: 50, mode: 'agg', sites: 100, plataforma: 'ne8000' }), MODELS).tuneles, 0);
  assert.strictEqual(M.evaluar(esc({ bw: 50, mode: 'agg', sites: 100 }), MODELS).tuneles, 100);
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

// LA SECCION «ORDERING INFORMATION» DE LAS FICHAS (2026-10-06): el BOM cotizaba un AR8700-8 sin
// la SPU-700H, que lleva todos sus puertos, y un AR6710-H sin su placa de control.
test('Ordering Information · el AR8700-8 pide la SPU-700H, y la MPU dice que la ficha deja una o dos', () => {
  const p = piezas('AR8700-8');
  const spu = p.pedir.find((x) => x.codigo === 'SPU700H');
  assert.ok(spu && spu.qty === 1, 'el chasis se vende sin puertos: la SPU se pide siempre');
  assert.match(spu.nota, /assembly chassis/);
  const mpu = p.elegir.find((g) => g.grupo === 'mpu');
  assert.match(mpu.nota, /una o dos MPU/);
  assert.match(mpu.nota, /25\.1/, 'dos MPU con SD-WAN exigen la 25.1: la ficha lo dice en su nota al pie');
});

test('Ordering Information · el AR6710-H pide su placa de control (SRU-700S) y una fuente que no es la PAC350', () => {
  const p = piezas('AR6710-H4T4X2Y7');
  const sru = p.pedir.find((x) => x.codigo === 'SRU700S');
  assert.ok(sru && sru.qty === 1);
  assert.match(sru.nota, /single or dual main control boards/);
  assert.ok(p.pedir.some((x) => x.codigo === 'PSU6710H'));
  assert.ok(!p.pedir.some((x) => x.codigo === 'PAC350'));
});

// La potencia de salida de cada fuente es un dato del catálogo (`psu.salida`), transcrito de la
// fila «Maximum output power» de cada ficha de serie AR (AR6710-L R26C00, AR6710-H R25C10 y AR8000
// R25C10). Hasta el 2026-10-06 vivía copiado en esta prueba, y antes la prueba lo leía de
// `psu.texto` y pasaba en falso: ese texto cita también la potencia de la pieza equivocada para
// explicar por qué no es la suya.
test('una fuente del BOM no contradice la potencia que publica la ficha del equipo', () => {
  // La PAC180 del AR6710-L8T3 (70 W en su ficha), la PAC350 del L14 (150 W) y la del AR6710-H
  // (300 W AC / 260 W DC) salieron así: el código de la pieza lleva su potencia, y la ficha
  // publica la de las fuentes del equipo. Si no casan, la pieza es de otro equipo.
  for (const m of MODELS) {
    for (const k of m.parts || []) {
      const w = Number((k.match(/^P[AD]C(\d+)$/) || [])[1]);
      if (!w) continue;
      const salida = ((m.psu || {}).salida || []).map((s) => s.w);
      assert.ok(salida.length, `${m.id}: pide ${k} y el catálogo no dice qué potencia de salida publica su ficha (psu.salida)`);
      assert.ok(salida.includes(w), `${m.id}: pide ${k} (${w} W) y su ficha publica ${salida.join(' / ')} W`);
    }
  }
});

test('la potencia de salida no se confunde con el consumo: cada fuente da más de lo que gasta el equipo', () => {
  // El error que ya tuvo el AR8140: 350 W de cada fuente pintados como consumo típico. Si alguien
  // vuelve a cruzar los dos campos, la salida quedaría por debajo del consumo, que es imposible.
  for (const m of MODELS.filter((x) => x.psu && x.psu.salida)) {
    for (const s of m.psu.salida) {
      assert.ok(Number.isFinite(s.w) && s.w > 0 && s.tipo, `${m.id}: salida mal formada`);
      if (m.psu.watts != null) assert.ok(s.w > m.psu.watts, `${m.id}: una fuente de ${s.w} W no alimenta un consumo típico de ${m.psu.watts} W`);
    }
  }
});

test('el AR6710-L14 y el L8T3 no piden fuente: las suyas no son módulos que se pidan aparte', () => {
  for (const id of ['AR6710-L14T2X4', 'AR6710-L8T3TS1X2']) {
    const p = piezas(id);
    assert.ok(![...p.pedir, ...p.elegir.flatMap((g) => g.opciones.map((codigo) => ({ codigo })))].some((x) => /^P[AD]C|^PSU/.test(x.codigo)), id);
    assert.match(MODELS.find((m) => m.id === id).psu.texto, /El BOM no pide fuente/);
  }
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

test('H-11 · un hub declara los túneles que se piden y que el catálogo no trae el tope', () => {
  const r = M.evaluar(esc({ bw: 50, mode: 'agg', sites: 100 }), MODELS);
  assert.strictEqual(r.tuneles, 100);
  assert.ok(r.avisos.some((a) => /100 túneles IPsec/.test(a) && /no trae el tope/.test(a)));
  assert.strictEqual(r.pick.m.id, 'AR6710-H4T4X2Y7', 'declarar no cambia la recomendación: sin dato no se aparta a nadie');
});

test('H-11 · fuera del modo agregado no se pide ningún túnel ni se avisa', () => {
  const r = M.evaluar(esc({ bw: 50, sites: 100 }), MODELS);
  assert.strictEqual(r.tuneles, 0);
  assert.ok(!r.avisos.some((a) => /túneles/.test(a)));
});

test('H-11 · si un modelo publica su tope de túneles, se comprueba (catálogo sintético)', () => {
  const sint = MODELS.map((m) => (m.id === 'AR6710-H4T4X2Y7' ? { ...m, tuneles: 50 } : m.id === 'AR8140-12G10XG' ? { ...m, tuneles: 4000 } : m));
  const r = M.evaluar(esc({ bw: 50, mode: 'agg', sites: 100 }), sint);
  assert.ok(r.rows.find((x) => x.m.id === 'AR6710-H4T4X2Y7').miss.some((t) => /50 túneles/.test(t)));
  assert.ok(r.fit.some((x) => x.m.id === 'AR8140-12G10XG'));
  assert.ok(r.avisos.some((a) => /publican su tope/.test(a)));
  // el modelo que no lo publica (null) no se aparta: «no lo dice» no es «no soporta»
  assert.ok(!r.rows.find((x) => x.m.id === 'AR5710-S8T2S').miss.some((t) => /túneles/.test(t)));
});

test('H-11 · la línea base legada no cambia', () => {
  assert.strictEqual(pick({ bw: 50, mode: 'agg', sites: 100 }, { legado: true }), 'AR6710-H4T4X2Y7');
  assert.strictEqual(M.evaluar(esc({ bw: 50, mode: 'agg', sites: 100 }), MODELS, { legado: true }).avisos.length, 0);
});

test('H-12 · HA 1+1: cada equipo se dimensiona al caudal completo y se cotizan dos', () => {
  const sin = M.evaluar(esc({ bw: 500 }), MODELS);
  const con = M.evaluar(esc({ bw: 500, ha: true }), MODELS);
  assert.strictEqual(sin.unidades, 1);
  assert.strictEqual(con.unidades, 2);
  assert.strictEqual(con.need, sin.need, 'el par suma disponibilidad, no capacidad: la necesidad no se reparte');
  assert.strictEqual(con.pick.m.id, sin.pick.m.id, 'el equipo no baja de gama por ser un par');
  assert.ok(con.avisos.some((a) => /suma disponibilidad y no capacidad/.test(a)));
});

test('H-12 · misión crítica sin HA lo advierte; con HA no', () => {
  assert.ok(M.evaluar(esc({ bw: 500, crit: 4 }), MODELS).avisos.some((a) => /sin alta disponibilidad/.test(a)));
  assert.ok(!M.evaluar(esc({ bw: 500, crit: 4, ha: true }), MODELS).avisos.some((a) => /sin alta disponibilidad/.test(a)));
  assert.ok(!M.evaluar(esc({ bw: 500, crit: 2 }), MODELS).avisos.some((a) => /sin alta disponibilidad/.test(a)));
});

test('H-12 · la línea base legada ignora la HA', () => {
  assert.strictEqual(M.evaluar(esc({ bw: 500, ha: true }), MODELS, { legado: true }).unidades, 1);
});

test('H-12 · el aviso de fuentes redundantes solo sale si el catálogo lo declara', () => {
  const hub = M.evaluar(esc({ bw: 6000, profile: 'fwd', svc: { sdwan: false }, ha: true }), MODELS);
  assert.strictEqual(hub.pick.m.id, 'AR8140-12G10XG');
  assert.ok(hub.avisos.some((a) => /ya declara fuentes redundantes/.test(a)));
  const ar = M.evaluar(esc({ bw: 500, ha: true }), MODELS);
  assert.ok(!ar.avisos.some((a) => /ya declara fuentes redundantes/.test(a)), 'redund ausente no se lee como false ni como true');
});

test('H-13 · el plazo de las suscripciones sale en el texto de cada línea', () => {
  const r = M.evaluar(esc({ bw: 500 }), MODELS);
  const t = (anios) => M.licencias(r.pick, { need: r.need, aps: 0, svc: r.svc, pk: r.pk, anios }).map((l) => l.t).join(' | ');
  assert.match(t(1), /NCE-WAN — 12 meses/);
  assert.match(t(3), /NCE-WAN — 36 meses/);
  assert.match(t(5), /SnS — Software Subscription and Support, 60 meses/);
  assert.match(t(undefined), /12 meses/, 'sin plazo declarado rige el año de siempre');
});

const { OPTICS } = require('../server/seed/legacyData/huawei.js');
const ar = MODELS.find((m) => m.id === 'AR5710-S8T2X');

test('H-07 · cada fila declarada entra al BOM con su óptica y su cantidad', () => {
  const r = M.opticasBom(ar, [{ fam: 'sfp10', sku: 'OMXD30000', qty: 2 }, { fam: 'ge', sku: 'SFP-GE-LX-SM1310', qty: 1 }], OPTICS);
  assert.deepStrictEqual(r.validas.map((v) => [v.fam, v.o.sku, v.qty]), [['sfp10', 'OMXD30000', 2], ['ge', 'SFP-GE-LX-SM1310', 1]]);
  assert.strictEqual(r.invalidas.length, 0);
});

test('H-07 · una familia que el equipo no lista sale como inválida, no se descarta en silencio', () => {
  const r = M.opticasBom(ar, [{ fam: 'qsfp100', sku: 'QSFP28-100G-SR4', qty: 1 }], OPTICS);
  assert.strictEqual(r.validas.length, 0);
  assert.strictEqual(r.invalidas.length, 1);
  assert.match(r.invalidas[0].motivo, /no lista la familia/);
});

test('H-07 · una óptica que no existe en el catálogo es inválida, y cantidad 0 no cuenta', () => {
  const r = M.opticasBom(ar, [{ fam: 'sfp10', sku: 'INVENTADA', qty: 1 }, { fam: 'sfp10', sku: 'OMXD30000', qty: 0 }], OPTICS);
  assert.strictEqual(r.validas.length, 0);
  assert.strictEqual(r.invalidas.length, 1);
  assert.match(r.invalidas[0].motivo, /no está en el catálogo/);
});

test('H-07 · sin filas declaradas no se pide ninguna óptica', () => {
  const r = M.opticasBom(ar, [], OPTICS);
  assert.deepStrictEqual(r, { validas: [], invalidas: [] });
});

// Encontrado el 2026-10-01 recorriendo la pantalla con valores límite: con -5 Mbps la página
// decía «Requiere -13 Mbps» y recomendaba un AR5710, porque solo trataba el 0 como «sin datos».
test('un caudal negativo cuenta como ninguno: nunca se dimensiona contra un requerimiento negativo', () => {
  const neg = M.evaluar(esc({ bw: -5 }), MODELS);
  const cero = M.evaluar(esc({ bw: 0 }), MODELS);
  assert.strictEqual(neg.raw, 0);
  assert.ok(neg.need >= 0 && neg.needMpps >= 0, `need ${neg.need}, needMpps ${neg.needMpps}`);
  assert.deepStrictEqual([neg.need, neg.pick && neg.pick.m.id], [cero.need, cero.pick && cero.pick.m.id]);
  const agregado = M.evaluar(esc({ bw: -50, mode: 'agg', sites: 10 }), MODELS);
  assert.strictEqual(agregado.need, 0);
});

test('un hub con menos de una sede se lee como una: ni requerimiento negativo ni «-5 túneles»', () => {
  const neg = M.evaluar(esc({ bw: 50, mode: 'agg', sites: -5 }), MODELS);
  const una = M.evaluar(esc({ bw: 50, mode: 'agg', sites: 1 }), MODELS);
  assert.strictEqual(neg.sites, 1);
  assert.strictEqual(neg.tuneles, 1);
  assert.ok(neg.need > 0, `need ${neg.need}`);
  assert.deepStrictEqual([neg.need, neg.pick && neg.pick.m.id], [una.need, una.pick && una.pick.m.id]);
  assert.ok(!neg.avisos.some((a) => /-\d/.test(a)), neg.avisos.join(' | '));
});
