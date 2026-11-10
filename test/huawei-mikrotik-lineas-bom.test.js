'use strict';
/* LAS LISTAS DE MATERIALES DE HUAWEI Y MIKROTIK, EN SUS MOTORES (fase 2 de la auditoria del 2026-11-09,
   ADR-1, corte 5). Que den lo mismo que las paginas lo miden scripts/equivalencias/huawei-bom.js y
   mikrotik-bom.js; aqui, las reglas de cantidad y de precio que prometen por si mismas. */
const test = require('node:test');
const assert = require('node:assert');
const H = require('../public/js/huawei-motor.js');
const MK = require('../public/js/mikrotik-motor.js');
const HW = require('../server/seed/legacyData/huawei.js');
const MT = require('../server/seed/legacyData/mikrotik.js');

// ── Huawei ──
const mh = HW.MODELS.find((m) => m.cls !== 'WAN');
const hicare = { n: 'Hi-Care Standard', sla: '9x5xNBD' };
const ctxH = (extra) => ({ m: mh, qty: 2, opticas: [], piezas: { pedir: [], elegir: [], opcionales: [], noAplican: [] }, lics: [],
  soporte: hicare, anios: 3, precioRef: undefined, datos: { PARTS: {}, OPTIC_LABEL: {}, CASILLA_REQ: { utm: 'sUtm' } }, ...extra });

test('Huawei: el equipo lleva el precio de referencia del cotizador solo si consta, y lo dice', () => {
  const sin = H.lineasBom(ctxH()).find((f) => f.cat === 'Equipo');
  assert.strictEqual(sin.unit, null);
  assert.ok(!/referencia estimado/.test(sin.nota));
  const con = H.lineasBom(ctxH({ precioRef: 1234 })).find((f) => f.cat === 'Equipo');
  assert.strictEqual(con.unit, 1234);
  assert.match(con.nota, /Precio de referencia estimado del cotizador/);
});

test('Huawei: SnS va solo en Soporte, nunca dos veces; las licencias requeridas, con su casilla', () => {
  const lics = [{ on: true, t: 'SnS — prueba', d: '' }, { on: true, t: 'Licencia UTM', d: 'x', req: 'utm', sku: 'LIC-UTM' },
    { on: false, t: 'Nota', d: '' }];
  const filas = H.lineasBom(ctxH({ lics }));
  const licencias = filas.filter((f) => f.cat === 'Licencias');
  assert.deepStrictEqual(licencias.map((f) => f.desc), ['Licencia UTM']);
  assert.strictEqual(licencias[0].por, 'sUtm');
  assert.strictEqual(filas.filter((f) => /^SnS/.test(f.desc)).length, 1);
  assert.match(filas.find((f) => f.desc === hicare.n).nota, /36 meses/);
});

test('Huawei: cada optica declarada, por equipo, con sus codigos BOM', () => {
  const opticas = [{ fam: 'sfp10', o: { sku: 'OPT-1', bom: ['0231', '0232'], d: 'SFP+' }, qty: 3 }];
  const fila = H.lineasBom(ctxH({ opticas, datos: { PARTS: {}, OPTIC_LABEL: { sfp10: '10GE SFP+' }, CASILLA_REQ: {} } }))
    .find((f) => f.cat === 'Ópticas');
  assert.strictEqual(fila.qty, 6);
  assert.strictEqual(fila.sku, '0231 / 0232');
  assert.match(fila.desc, /^10GE SFP\+ — OPT-1/);
});

// ── MikroTik ──
const mm = MT.MODELS.find((m) => m.ser !== 'CHR' && m.elpN != null) || MT.MODELS[0];
const SUPPORT = { 'sw-basic': { n: 'Comunidad', sla: 'foro' }, partner: { n: 'Partner', sla: '8x5' }, training: { n: 'Curso', d: 'MTCNA' } };
const APS = [{ sku: 'cAP ax', hwModel: 'cAPGi-5HaxD2HaxD', price: 109, d: 'AP', poeDraw: 11 }];
const ctxM = (extra) => ({ m: mm, qty: 3, enlaces: [], optics: [], ap: { qty: 0, modelo: APS[0], manual: false },
  poe: { fuente: 'caja', capsman: false, poe: false, apModel: 'cAP ax', apCount: '0' }, licencia: { d: 'Nivel 4' }, nivel: 'nivel 4',
  soporte: { support: SUPPORT['sw-basic'], supCode: 'sw-basic' }, training: false, datos: { APS, SUPPORT }, ...extra });

test('MikroTik: las opticas van por router; los AP y el soporte, no; la licencia embebida vale 0', () => {
  const filas = MK.lineasBom(ctxM({ optics: [{ cat: 'sfp', qty: 2, optic: { sku: 'S+85DLC03D', d: 'SFP+ SR', price: 30 } }],
    ap: { qty: 4, modelo: APS[0], manual: false } }));
  assert.strictEqual(filas.find((f) => f.sku === 'S+85DLC03D').qty, 6);
  const ap = filas.find((f) => f.cat === 'Puntos de acceso');
  assert.strictEqual(ap.qty, 4);
  assert.strictEqual(ap.por, 'chkCapsman', 'los AP del dimensionamiento llevan su casilla');
  assert.strictEqual(filas.find((f) => f.cat === 'Licencia').unit, 0);
  const soporte = filas.find((f) => f.cat === 'Soporte');
  assert.strictEqual(soporte.qty, null);
  assert.strictEqual(soporte.unit, 0, 'el soporte de comunidad vale 0');
});

test('MikroTik: la fuente de 48 V entra solo con PoE pedido y CAPsMAN, sin precio y con su potencia minima', () => {
  const poe = { fuente: '48', capsman: true, poe: true, apModel: 'cAP ax', apCount: '4' };
  const fila = MK.lineasBom(ctxM({ poe })).find((f) => f.cat === 'Alimentación');
  assert.ok(fila, 'la fuente entra');
  assert.strictEqual(fila.unit, null);
  assert.match(fila.nota, /Al menos 44/);
  assert.ok(!MK.lineasBom(ctxM({ poe: { ...poe, fuente: 'caja' } })).some((f) => f.cat === 'Alimentación'));
  assert.ok(!MK.lineasBom(ctxM({ poe: { ...poe, poe: false } })).some((f) => f.cat === 'Alimentación'));
});

test('las versiones de los motores viajan a «Supuestos»', () => {
  for (const motor of [H, MK, require('../public/js/aruba-reglas.js')]) assert.match(motor.VERSION_MOTOR, /^\d+\.\d+\.\d+$/);
});
