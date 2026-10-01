'use strict';
// El informe «cotizador frente a dimensionador» de `npm run catalogo` (scripts/catalogo-check.js).
// Nacio de la revision Huawei del 2026-09-29: el NE8000 M8 decia 4,8 Tbps en el cotizador y 2,4 en
// el dimensionador, y nada lo avisaba. Se prueba con catalogos SINTETICOS: una prueba que fijara las
// discrepancias reales se pondria roja el dia que alguien corrigiera el dato, que es justo lo que se
// quiere que pase.
const test = require('node:test');
const assert = require('node:assert');
const { leerSpec, contrasteCotizador, normalizarModelo } = require('../scripts/catalogo-check.js');

test('lee cada etiqueta con su cifra en Mbps y la tolerancia del redondeo con que se escribió', () => {
  const r = leerSpec('FW 4 Gbps · NGFW 0.6 Gbps · IPsec 3.5 Gbps · 4 GE RJ45');
  assert.deepStrictEqual(r.cifras.map((c) => [c.etiqueta, c.valor, c.tolerancia]),
    [['FW', 4000, 500], ['NGFW', 600, 50], ['IPsec', 3500, 50]]);
  assert.deepStrictEqual(r.ilegibles, []);
});

test('cifra sin etiqueta, con FWD, en Tbps y en Mpps', () => {
  const r = leerSpec('2.4 Tbps · 405 Mpps · 4 tarjetas 400G');
  assert.deepStrictEqual(r.cifras.map((c) => [c.etiqueta, c.valor]), [['BASE', 2400000], ['Mpps', 405]]);
  assert.deepStrictEqual(leerSpec('1.3 Gbps FWD · IPsec 800 Mbps').cifras.map((c) => c.etiqueta), ['FWD', 'IPsec']);
});

test('los rangos WAN de Aruba dan mínimo y máximo', () => {
  const r = leerSpec('EdgeConnect SD-WAN · WAN 10 Mbps - 3 Gbps · SKU S3N73A');
  assert.deepStrictEqual(r.cifras.map((c) => [c.etiqueta, c.valor]), [['WAN_MIN', 10], ['WAN_MAX', 3000]]);
  assert.deepStrictEqual(leerSpec('WAN hasta 12 Gbps').cifras.map((c) => [c.etiqueta, c.valor]), [['WAN_MAX', 12000]]);
});

test('una cifra que no sabe leer sale como ilegible, nunca se descarta', () => {
  assert.deepStrictEqual(leerSpec('tope 1 Gbps por interfaz').ilegibles, ['tope 1 Gbps por interfaz']);
  assert.deepStrictEqual(leerSpec('8 GE + 1 NIM · SD-WAN nativo').cifras, [], 'un segmento sin unidad de rendimiento no es una cifra');
});

test('normaliza nombres como el traspaso al cotizador', () => {
  assert.strictEqual(normalizarModelo('NetEngine NE8000 M4'), normalizarModelo('NE8000 M4'));
  assert.strictEqual(normalizarModelo('Juniper SRX 320'), normalizarModelo('SRX320'));
});

const mapa = { acme: { mod: 'acme', listas: ['MODELS'], campos: { FW: 'fw', BASE: 'cap' }, escala: { cap: 1000 } } };
const correr = (modelos, cotizador) => contrasteCotizador({
  mapa, cotizador, cargar: () => ({ MODELS: modelos }),
})[0];

test('coincide dentro del redondeo del cotizador y difiere fuera de él', () => {
  const r = correr([{ id: 'X1', fw: 570 }, { id: 'X2', fw: 700 }],
    [{ vendor: 'Acme', model: 'X1', spec: 'FW 0.6 Gbps' }, { vendor: 'Acme', model: 'X2', spec: 'FW 0.6 Gbps' }]);
  assert.strictEqual(r.comparadas, 2);
  assert.strictEqual(r.coincide, 1);
  assert.deepStrictEqual(r.difiere.map((d) => d.modelo), ['X2']);
});

test('los cinco estados se cuentan por separado y ninguno se deduce', () => {
  const r = correr([{ id: 'X1', fw: null, cap: 2000 }],
    [{ vendor: 'Acme', model: 'X1', spec: 'FW 1 Gbps · 2 Tbps · NGFW 1 Gbps · raro 3 Gbps raro' },
      { vendor: 'Acme', model: 'Fantasma', spec: 'FW 1 Gbps' }]);
  assert.strictEqual(r.sinDato.length, 1, 'fw en null: sin dato, no «difiere»');
  assert.strictEqual(r.coincide, 1, 'cap en Gbps (2000) con su escala coincide con «2 Tbps»');
  assert.strictEqual(r.difiere.length, 0);
  assert.strictEqual(r.ilegible.length, 2, 'NGFW sin campo declarado y el segmento raro');
  assert.deepStrictEqual(r.sinPareja, ['Fantasma']);
});

test('el informe corre sobre el catálogo real y cubre a los siete fabricantes', () => {
  const r = contrasteCotizador();
  assert.deepStrictEqual(r.map((x) => x.vendor).sort(), ['aruba', 'cisco', 'fortinet', 'huawei', 'juniper', 'mikrotik', 'nokia']);
  for (const x of r) {
    assert.ok(!x.error, `${x.vendor}: ${x.error}`);
    assert.strictEqual(x.coincide + x.difiere.length, x.comparadas);
  }
});

// ── La pantalla: que cifra se cita ─────────────────────────────────────────────
const { proyectarFila, CONTRASTE_COTIZADOR } = require('../server/services/cifrasCotizador');

test('proyectarFila deja intacto lo que coincide, y los puertos siempre', () => {
  const m = { id: 'X', fwd: 1300, ipsec: 800, typ: 620 };
  const spec = '1.3 Gbps FWD · IPsec 800 Mbps · SD-WAN 620 Mbps · 8 GE';
  assert.deepStrictEqual(proyectarFila(spec, m, CONTRASTE_COTIZADOR.huawei), { spec, enRevision: [] });
});

test('proyectarFila retira la cifra que difiere y dice cuales estaban en disputa', () => {
  const m = { id: 'NE8000 M8', cap: 2400000, mpps: 453 };
  const r = proyectarFila('4.8 Tbps · 1086 Mpps · 8 tarjetas 400G', m, CONTRASTE_COTIZADOR.huawei);
  assert.strictEqual(r.spec, 'Capacidad en revisión · Mpps en revisión · 8 tarjetas 400G');
  assert.deepStrictEqual(r.enRevision, [
    { campo: 'cap', cotizador: '4.8 Tbps', dimensionador: '2.4 Tbps' },
    { campo: 'mpps', cotizador: '1086 Mpps', dimensionador: '453 Mpps' },
  ]);
});

test('proyectarFila: un rango WAN con un extremo en disputa se retira entero, una sola vez', () => {
  const m = { id: 'EC', wanMin: 10, wanMax: 2000 };
  const r = proyectarFila('EdgeConnect · WAN 10 Mbps - 3 Gbps · SKU S1', m, CONTRASTE_COTIZADOR.aruba);
  assert.strictEqual(r.spec, 'EdgeConnect · WAN en revisión · SKU S1');
  assert.strictEqual(r.enRevision.length, 1);
});

test('proyectarFila: sin pareja o sin dato no hay nada que contrastar, y no se toca', () => {
  const spec = '300 Mbps FWD · IPsec 200 Mbps';
  assert.deepStrictEqual(proyectarFila(spec, null, CONTRASTE_COTIZADOR.cisco), { spec, enRevision: [] });
  assert.deepStrictEqual(proyectarFila(spec, { id: 'X', fwd: null, ipsec: null }, CONTRASTE_COTIZADOR.cisco), { spec, enRevision: [] });
});
