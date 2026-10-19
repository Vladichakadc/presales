'use strict';
// Explicabilidad del dimensionador Huawei (2026-10-19): la fórmula del ×2 escrita entera, el
// cuello de botella de cada modelo apartado con sus cifras y lo que hace falta para encender el
// chasis frente a lo opcional. NINGUNA cifra del cálculo cambia: estas pruebas afirman que el
// texto cuenta la misma cuenta que el motor hace, y que `miss` (lo que leen la tabla, las pruebas
// viejas y el contraste) sigue igual.
const test = require('node:test');
const assert = require('node:assert');
const M = require('../public/js/huawei-motor.js');
const { MODELS, PARTS } = require('../server/seed/legacyData/huawei.js');

const esc = (o) => Object.assign({ bw: 500, unit: 1, mode: 'link', sites: 1, conc: 40, head: 30, dirMult: 2, frame: 340,
  profile: 'typ', lan: 0, aps: 0, svc: { sdwan: true }, want: {}, plataforma: 'ar' }, o);

test('la fórmula bidireccional escribe bajada + subida y cita el techo publicado como suma', () => {
  const ev = M.evaluar(esc({ bw: 900 }), MODELS);
  const f = M.formulaBidireccional(ev, false);
  assert.strictEqual(f.suma, true);
  assert.strictEqual(f.documento, true, 'las fichas AR respaldan la suma en SD-WAN típico');
  assert.match(f.texto, /bajada 900 Mbps \+ subida 900 Mbps = 1\.8 Gbps/);
  assert.match(f.texto, /suma de los dos sentidos/);
  assert.strictEqual(ev.fisico, 1800, 'la cifra del cálculo no cambia: base × 2');
});

test('en reenvío la fórmula no afirma un respaldo documental que no existe', () => {
  const ev = M.evaluar(esc({ bw: 900, profile: 'fwd', svc: {} }), MODELS);
  const f = M.formulaBidireccional(ev, false);
  assert.strictEqual(f.documento, false);
  assert.doesNotMatch(f.texto, /que Huawei publica como suma/);
  assert.match(f.texto, /no dice si el reenvío/);
});

test('total agregado: sin duplicar y lo dice', () => {
  const ev = M.evaluar(esc({ bw: 900, dirMult: 1 }), MODELS);
  const f = M.formulaBidireccional(ev, false);
  assert.strictEqual(f.suma, false);
  assert.match(f.texto, /total agregado.*900 Mbps, sin duplicar/);
});

test('cada modelo apartado por caudal dice su techo, lo exigido y lo que le falta', () => {
  const ev = M.evaluar(esc({ bw: 900 }), MODELS);
  const r = ev.rows.find((x) => x.m.id === 'AR651');
  assert.ok(r.miss.includes('capacidad insuficiente'), 'el texto corto de siempre se conserva');
  assert.strictEqual(r.motivos[0].tipo, 'capacidad');
  assert.match(r.motivos[0].texto, /techo de 600 Mbps en «SD-WAN típico» frente a 2\.3 Gbps exigidos: faltan 1\.7 Gbps/);
  assert.strictEqual(r.miss.length, r.motivos.length, 'un motivo por cada restricción que falla, en el mismo orden');
});

test('sin cifra en la capa: el motivo dice que no se sustituye por otra', () => {
  const ev = M.evaluar(esc({ plataforma: 'vcpe', profile: 'ipsec', svc: {} }), MODELS);
  const r = ev.rows.find((x) => x.m.id === 'AR6700V-L (2 vCPU)');
  assert.strictEqual(r.motivos[0].tipo, 'sinCifra');
  assert.match(r.motivos[0].texto, /no se sustituye por la de otra capa/);
});

test('el resumen agrupa por cuello y cuenta los modelos de otras plataformas', () => {
  const ev = M.evaluar(esc({ bw: 900, lan: 30 }), MODELS);
  const res = M.resumenApartados(ev);
  const total = res.grupos.reduce((t, g) => t + g.modelos.length, 0);
  assert.strictEqual(total, ev.rows.filter((r) => r.miss.length).length, 'cada apartado cuenta una vez');
  assert.ok(res.grupos.some((g) => g.tipo === 'capacidad'));
  const fuera = res.fuera.reduce((t, f) => t + f.n, 0);
  assert.strictEqual(fuera + ev.rows.length, MODELS.length, 'los de otra plataforma más los evaluados son el catálogo');
  assert.deepStrictEqual(res.fuera.map((f) => f.plataforma).sort(), ['a800', 'ne8000', 'vcpe']);
});

test('sin caudal no hay nada que explicar', () => {
  assert.deepStrictEqual(M.resumenApartados(M.evaluar(esc({ bw: '' }), MODELS)), { grupos: [], fuera: [] });
});

test('la línea base legada del contraste no cambia de forma', () => {
  const ev = M.evaluar(esc({ profile: 'typ' }), MODELS, { legado: true });
  assert.deepStrictEqual(ev.fueraDePlataforma, []);
  assert.ok(ev.rows.every((r) => Array.isArray(r.motivos)));
});

const piezas = (id, want) => M.piezasBom(MODELS.find((m) => m.id === id), PARTS, { want: want || {} });

test('BOM: la SPU-700H del AR8700-8 y su MPU y fuente son base del chasis; el ventilador y los accesorios no se marcan', () => {
  const p = piezas('AR8700-8');
  assert.match(p.pedir.find((x) => x.codigo === 'SPU700H').base, /no tiene puertos/);
  assert.match(p.elegir.find((g) => g.grupo === 'mpu').base, /sin unidad de procesamiento/);
  assert.match(p.elegir.find((g) => g.grupo === 'fuente').base, /no enciende/);
  for (const k of ['FAN240', 'RACK', 'CONSOLE']) assert.ok(!p.pedir.find((x) => x.codigo === k).base, `${k} no consta como paso de pedido del chasis`);
});

test('BOM: el AR6710-H marca su SRU-700S y su fuente como base, sin afirmar cuántas fuentes vienen de serie', () => {
  const p = piezas('AR6710-H4T4X2Y7');
  assert.match(p.pedir.find((x) => x.codigo === 'SRU700S').base, /si el configurador la trae dentro/);
  const f = p.elegir.find((g) => g.grupo === 'fuente');
  assert.match(f.base, /no diga si alguna viene de serie/);
  assert.ok(!p.opcionales.some((x) => x.base), 'lo opcional nunca es base');
});
