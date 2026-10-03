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

// ── Una sola copia: el hueco que rellena la siembra (2026-10-03) ──────────────────────────────
const { rellenarSpec, indiceDimensionador, contrastarFila } = require('../server/services/cifrasCotizador');

test('el hueco del cotizador sale con la cifra del dimensionador, escala y Mpps incluidas', () => {
  const cfg = { campos: { FWD: 'fwd', IPsec: 'ipsec', BASE: 'cap', Mpps: 'mpps', WAN_MIN: 'wanMin', WAN_MAX: 'wanMax' }, escala: { cap: 1000 } };
  const m = { id: 'X', fwd: 1300, ipsec: 800, cap: 2400, mpps: 405, wanMin: 10, wanMax: 3000 };
  assert.strictEqual(rellenarSpec('{fwd} FWD · IPsec {ipsec} · 8 GE', m, 'acme', cfg).spec, '1.3 Gbps FWD · IPsec 800 Mbps · 8 GE');
  assert.strictEqual(rellenarSpec('{cap} · {mpps} · 4 tarjetas 400G', m, 'acme', cfg).spec, '2.4 Tbps · 405 Mpps · 4 tarjetas 400G', 'la capacidad en Gbps con su escala');
  assert.strictEqual(rellenarSpec('EdgeConnect · WAN {wanMin} - {wanMax}', m, 'acme', cfg).spec, 'EdgeConnect · WAN 10 Mbps - 3 Gbps');
  assert.deepStrictEqual(rellenarSpec('FW 4 Gbps · 4 GE', m, 'acme', cfg), { spec: 'FW 4 Gbps · 4 GE', huecos: [] }, 'sin hueco, intacto');
  // Lo que se rellena coincide con el dimensionador al releerlo: la pantalla no lo pondra «en revision».
  const lleno = rellenarSpec('{fwd} FWD · IPsec {ipsec}', { id: 'X', fwd: 1234, ipsec: 1250 }, 'huawei').spec;
  assert.deepStrictEqual(proyectarFila(lleno, { id: 'X', fwd: 1234, ipsec: 1250 }, CONTRASTE_COTIZADOR.huawei).enRevision, []);
});

test('un hueco que no se puede rellenar no llega a la pantalla: su segmento dice «sin dato»', () => {
  const cfg = { campos: { FWD: 'fwd', IPsec: 'ipsec' } };
  const r = rellenarSpec('{fwd} FWD · IPsec {ipsec} · {ngfw} · {xyz} · 8 GE', { id: 'X', fwd: 1300 }, 'acme', cfg);
  assert.strictEqual(r.spec, '1.3 Gbps FWD · IPsec sin dato · NGFW sin dato · Cifra sin dato · 8 GE');
  assert.deepStrictEqual(r.huecos.map((h) => h.estado), ['catalogo', 'sinDato', 'ilegible', 'ilegible'], 'un campo que el fabricante no declara no se adivina');
  const sinPareja = rellenarSpec('{fwd} FWD · 8 GE', null, 'acme', cfg);
  assert.deepStrictEqual([sinPareja.spec, sinPareja.huecos[0].estado], ['FWD sin dato · 8 GE', 'sinPareja']);
});

test('el informe cuenta aparte las cifras que pone el dimensionador y lista el hueco que no se rellena', () => {
  const r = correr([{ id: 'X1', fw: 570, cap: 2000 }], [
    { vendor: 'Acme', model: 'X1', spec: 'FW {fw} · {cap} · 4 GE' },
    { vendor: 'Acme', model: 'X1', spec: 'FW 0.6 Gbps' },
    { vendor: 'Acme', model: 'Fantasma', spec: 'FW {fw}' },
  ]);
  assert.strictEqual(r.delDimensionador, 2, 'la cifra que pone el dimensionador no es una segunda copia');
  assert.deepStrictEqual([r.comparadas, r.coincide], [1, 1], 'lo que queda escrito se sigue contrastando');
  assert.deepStrictEqual(r.huecosSinCifra.map((x) => [x.modelo, x.estado]), [['Fantasma', 'sinPareja']]);
});

test('una linea con pareja no copia una cifra que el dimensionador ya trae, y cada hueco se rellena', () => {
  // Las dos caras del contrato, sobre el archivo real: copiarla aqui es corregirla en dos sitios
  // con cada ficha (293 copias hasta el 2026-10-03), y un hueco sin rellenar sale «sin dato».
  const filas = require('../server/seed/legacyData/cotizadorCatalog');
  const indice = indiceDimensionador();
  const copias = [];
  const huecos = [];
  let rellenos = 0;
  for (const row of filas) {
    const vendor = String(row.vendor).toLowerCase();
    const cfg = CONTRASTE_COTIZADOR[vendor];
    if (!cfg) continue;
    const m = indice[vendor].get(normalizarModelo(row.model)) || null;
    for (const h of rellenarSpec(row.spec, m, vendor).huecos) {
      if (h.estado === 'catalogo') rellenos++;
      else huecos.push(`${row.model}: {${h.campo}} (${h.estado})`);
    }
    if (!m) continue;
    for (const e of contrastarFila(row.spec, m, cfg)) {
      if (e.estado === 'coincide' || e.estado === 'difiere') copias.push(`${row.model}: «${e.texto}» (${e.campo})`);
    }
  }
  assert.deepStrictEqual(copias, [], 'escribe el hueco {campo}: la cifra la pone el dimensionador');
  assert.deepStrictEqual(huecos, [], 'un hueco que el dimensionador no puede rellenar sale «sin dato» en el cotizador');
  assert.ok(rellenos > 250, `solo ${rellenos} cifras del cotizador las pone el dimensionador`);
});
