// Tests del importador gobernado de lista de precios (scripts/importar-lista-aruba.js).
// Los fixtures son SINTÉTICOS: la lista real del distribuidor jamás entra al repo
// (regla de confidencialidad del 2026-09-13). Los valores prohibidos de las columnas
// confidenciales están aquí precisamente para demostrar que NO se extraen.
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const {
  parsearLista, construirRoster, comparar, generarCsv, parsearCsv, CABECERA_ESPERADA,
} = require('../scripts/importar-lista-aruba');
const arubaData = require('../server/seed/legacyData/aruba');

// ── Fixture: lista sintética con el formato exacto del distribuidor ─────────
function fixtureLista(filas) {
  const cero = (v) => (v === undefined ? '' : v);
  const lineas = [CABECERA_ESPERADA.join('|')];
  for (const f of filas) {
    const c = new Array(18).fill('');
    c[0] = 'WESTCON GROUP COLOMBIA LTDA'; // prohibido — nunca debe salir
    c[1] = 'R2CW4';                       // PA Number — prohibido
    c[5] = f.sku;
    c[10] = f.desc;
    c[11] = cero(f.lp);
    c[12] = cero(f.vig);
    c[13] = '123.45';                     // Net Price — prohibido
    c[14] = '14';                         // descuento — prohibido
    c[16] = cero(f.plc);
    lineas.push(c.join('|'));
  }
  const ruta = path.join(os.tmpdir(), `lista-fixture-${process.pid}-${Math.random().toString(36).slice(2)}.txt`);
  fs.writeFileSync(ruta, lineas.join('\n'));
  return ruta;
}

test('parsearLista extrae SOLO las 5 columnas permitidas', () => {
  const ruta = fixtureLista([{ sku: 'J4858D', desc: 'Aruba 1G SFP LC SX 500m MMF XCVR', lp: '569.00', vig: '2023-04-01', plc: 'GA' }]);
  const { lista } = parsearLista(ruta);
  const f = lista.get('J4858D');
  assert.deepStrictEqual(f, { desc: 'Aruba 1G SFP LC SX 500m MMF XCVR', lp: 569, vigencia: '2023-04-01', plc: 'GA' });
  const crudo = JSON.stringify([...lista.values()]);
  assert.ok(!/WESTCON|R2CW4|123\.45/.test(crudo), 'no debe filtrarse ninguna columna confidencial');
  fs.unlinkSync(ruta);
});

test('parsearLista aborta si la cabecera no es la esperada (fail-safe)', () => {
  const ruta = path.join(os.tmpdir(), `lista-mala-${process.pid}.txt`);
  fs.writeFileSync(ruta, 'SKU|DESC|PRECIO\nJ4858D|x|1\n');
  assert.throws(() => parsearLista(ruta), /cabecera/i);
  fs.unlinkSync(ruta);
});

test('parsearLista deduplica: gana la vigencia más reciente', () => {
  const ruta = fixtureLista([
    { sku: 'J4858D', desc: 'vieja', lp: '500.00', vig: '2022-01-01', plc: 'GA' },
    { sku: 'J4858D', desc: 'nueva', lp: '569.00', vig: '2023-04-01', plc: 'GA' },
  ]);
  const { lista } = parsearLista(ruta);
  assert.strictEqual(lista.get('J4858D').lp, 569);
  assert.strictEqual(lista.get('J4858D').desc, 'nueva');
  fs.unlinkSync(ruta);
});

test('construirRoster cubre exactamente los SKU del CSV vigente', () => {
  const roster = construirRoster(arubaData);
  const enRoster = new Set(roster.map((r) => r.sku));
  const csv = parsearCsv(path.join(__dirname, '..', 'public', 'datasheets', 'aruba-lista-precios-hpe.csv'));
  assert.strictEqual(csv.length, 134, 'el CSV vigente tiene 134 filas de datos');
  for (const fila of csv) {
    assert.ok(enRoster.has(fila.sku), `${fila.sku} del CSV debe estar declarado en el roster`);
  }
  // Y al revés: el roster no declara nada que el CSV no refleje
  assert.strictEqual(enRoster.size, roster.length, 'sin SKU duplicados en el roster');
  for (const r of roster) assert.ok(csv.some((f) => f.sku === r.sku), `${r.sku} del roster debe tener fila en el CSV`);
});

test('comparar detecta precio repo≠lista, cambio de CSV, PLC→ES, ausente y candidatos', () => {
  const roster = [
    { sku: 'AAA', familia: 'F1', precioRepo: 100, origen: 'accesorio' },
    { sku: 'BBB', familia: 'F2', precioRepo: 200, origen: 'accesorio' },
    { sku: 'CCC', familia: 'F3', precioRepo: null, origen: 'modelo' },
    { sku: 'DDD', familia: 'F4', precioRepo: null, origen: 'modelo' },
  ];
  const lista = new Map([
    ['AAA', { desc: 'a', lp: 150, vigencia: '2026-01-01', plc: 'GA' }],          // precio cambió
    ['BBB', { desc: 'b', lp: 200, vigencia: '2026-01-01', plc: 'ES' }],          // PLC GA→ES
    ['CCC', { desc: 'c', lp: 300, vigencia: '2026-01-01', plc: 'GA' }],          // CSV desactualizado
    // DDD ausente de la lista
    ['NEW1', { desc: 'Aruba EdgeConnect 10900 SD-WAN Gateway', lp: 999, vigencia: '2026-01-01', plc: 'GA' }],
    ['NEW2', { desc: 'Aruba 10G SFP+ LC SR 300m MMF XCVR', lp: 500, vigencia: '2026-01-01', plc: 'GA' }],
    ['NEW3', { desc: 'Aruba 9240 Spare Fan', lp: 100, vigencia: '2026-01-01', plc: 'GA' }],
  ]);
  const csvActual = [
    { sku: 'AAA', mod: 'F1', desc: 'a', p: 100, vig: '2025-01-01', plc: 'GA' },
    { sku: 'BBB', mod: 'F2', desc: 'b', p: 200, vig: '2025-01-01', plc: 'GA' },
    { sku: 'CCC', mod: 'F3', desc: 'c', p: 250, vig: '2025-01-01', plc: 'GA' },
    { sku: 'DDD', mod: 'F4', desc: 'd', p: 400, vig: '2025-01-01', plc: 'GA' },
  ];
  const d = comparar(roster, lista, csvActual);
  assert.deepStrictEqual(d.preciosRepoVsLista.map((x) => x.sku), ['AAA']);
  // BBB también cambia de fila: su PLC pasa GA→ES (y además se reporta en plcTransiciones)
  assert.deepStrictEqual(d.csvVsLista.map((x) => x.sku).sort(), ['AAA', 'BBB', 'CCC']);
  assert.deepStrictEqual(d.plcTransiciones.map((x) => x.sku), ['BBB']);
  assert.deepStrictEqual(d.ausentesEnLista.map((x) => x.sku), ['DDD']);
  assert.deepStrictEqual(d.nuevosCandidatos.edgeconnect.map((x) => x.sku), ['NEW1']);
  assert.deepStrictEqual(d.nuevosCandidatos.opticas.map((x) => x.sku), ['NEW2']);
  assert.deepStrictEqual(d.nuevosCandidatos.gateways.map((x) => x.sku), ['NEW3']);
});

test('generarCsv regenera desde la lista y conserva la fila de un SKU ausente', () => {
  const roster = [
    { sku: 'AAA', familia: 'F1', precioRepo: null, origen: 'modelo' },
    { sku: 'DDD', familia: 'F4', precioRepo: null, origen: 'modelo' },
  ];
  const lista = new Map([['AAA', { desc: 'desc nueva', lp: 150, vigencia: '2026-01-01', plc: 'GA' }]]);
  const csvActual = [{ sku: 'DDD', mod: 'F4', desc: 'desc previa', p: 400, vig: '2025-01-01', plc: 'GA' }];
  const csv = generarCsv(roster, lista, csvActual);
  const lineas = csv.trim().split('\n');
  assert.strictEqual(lineas[0], 'sku,modelo_dimensionador,descripcion_hpe,list_price_usd,vigencia_list_price,estado_plc');
  assert.strictEqual(lineas[1], 'AAA,F1,desc nueva,150.00,2026-01-01,GA');
  assert.strictEqual(lineas[2], 'DDD,F4,desc previa,400.00,2025-01-01,GA');
  assert.ok(!/\||westcon/i.test(csv), 'el CSV generado no puede contener separadores ni datos del distribuidor');
});

test('guardarraíl de confidencialidad: una descripción sospechosa aborta la escritura', () => {
  const roster = [{ sku: 'AAA', familia: 'F1', precioRepo: null, origen: 'modelo' }];
  const lista = new Map([['AAA', { desc: 'Westcon bundle', lp: 1, vigencia: '2026-01-01', plc: 'GA' }]]);
  assert.throws(() => generarCsv(roster, lista, []), /confidencialidad/i);
});
