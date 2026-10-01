'use strict';
// El importador Huawei: normalizacion de nombres, parser de numeros y resolucion de unidad.
//
// Es el tercero de la familia (`cps`, `juniper`, `huawei`) y comparte su regla: una fila solo
// se cree si al menos dos de sus columnas casan con lo ya verificado y ninguna lo contradice.
// Lo que se prueba aqui es la mecanica que sostiene esa regla — si el nombre no normaliza, o
// la unidad se deduce mal, el anclaje compara peras con manzanas y deja de proteger.
const test = require('node:test');
const assert = require('node:assert');
const { claveModelo, aNumero, leerCabecera, resolverUnidad } = require('../scripts/importar-huawei');

test('el nombre del modelo normaliza entre las formas que usa Huawei', () => {
  assert.strictEqual(claveModelo('AR611'), 'AR611');
  assert.strictEqual(claveModelo('Huawei AR 611'), 'AR611');
  assert.strictEqual(claveModelo('ar-611'), 'AR611');
  // NetEngine se abrevia para que "NetEngine A821 E" y "NE A821 E" sean el mismo modelo.
  assert.strictEqual(claveModelo('NetEngine A821 E'), claveModelo('NE A821 E'));
  assert.strictEqual(claveModelo(''), null);
  assert.strictEqual(claveModelo(null), null);
});

test('aNumero distingue sin dato de ilegible', () => {
  // Sin dato: null. Es lo que el catalogo guarda como "no lo trae la fuente".
  assert.strictEqual(aNumero('', false), null);
  assert.strictEqual(aNumero('N/A', false), null);
  assert.strictEqual(aNumero('-', false), null);
  assert.strictEqual(aNumero('—', false), null);
  // Ilegible: NaN, y la fila se reporta en vez de colarse como si no trajera dato.
  assert.ok(Number.isNaN(aNumero('aprox. mucho', false)));
});

test('aNumero lee los formatos en los que llega una tabla real', () => {
  assert.strictEqual(aNumero('300', false), 300);
  assert.strictEqual(aNumero('6.5', false), 6.5);
  assert.strictEqual(aNumero('6,5', false), 6.5);
  assert.strictEqual(aNumero('20 Gbps', false), 20);
  assert.strictEqual(aNumero('1,400,000', true), 1400000);
  assert.strictEqual(aNumero('1.400.000', true), 1400000);
  // El punto con tres digitos es ambiguo y lo resuelve el tipo de columna: en una de
  // conteo "1.400" son mil cuatrocientos; en una de caudal, 1,4.
  assert.strictEqual(aNumero('1.400', true), 1400);
  assert.strictEqual(aNumero('1.400', false), 1.4);
});

test('la cabecera reconoce las columnas por su nombre y no por su posicion', () => {
  const { colModelo, columnas } = leerCabecera(
    ['Mpps', 'IPsec VPN (Gbps)', 'Model', 'Typical Throughput (Gbps)', 'Notas'],
  );
  assert.strictEqual(colModelo, 2);
  const porCampo = Object.fromEntries(columnas.map((c) => [c.campo, c]));
  assert.strictEqual(porCampo.mpps.i, 0);
  assert.strictEqual(porCampo.ipsec.i, 1);
  assert.strictEqual(porCampo.typ.i, 3);
  // La unidad declarada en la cabecera se lee y no hace falta deducirla.
  assert.strictEqual(porCampo.ipsec.unidadDeclarada, 1000);
  assert.strictEqual(porCampo.mpps.unidadDeclarada, null);
});

test('typ y fwd son columnas distintas: confundirlas es el error que este catalogo evita', () => {
  const { columnas } = leerCabecera(['Model', 'Forwarding', 'Typical Throughput']);
  const campos = columnas.map((c) => c.campo);
  assert.ok(campos.includes('fwd'));
  assert.ok(campos.includes('typ'));
  assert.notStrictEqual(campos.indexOf('fwd'), campos.indexOf('typ'));
});

test('la unidad se deduce por contraste cuando la cabecera calla', () => {
  // AR611 tiene fwd:300 (Mbps) en el catalogo. Una columna sin unidad que traiga 0.3
  // solo casa si se interpreta como Gbps.
  const col = { i: 1, campo: 'fwd', tipo: 'tput', unidadDeclarada: null };
  const enGbps = resolverUnidad(col, [['AR611', '0.3'], ['AR651', '2']], 0);
  assert.strictEqual(enGbps.factor, 1000);
  assert.match(enGbps.como, /contraste/);

  const enMbps = resolverUnidad(col, [['AR611', '300'], ['AR651', '2000']], 0);
  assert.strictEqual(enMbps.factor, 1);

  // Una columna de conteo no se escala nunca.
  assert.strictEqual(resolverUnidad({ campo: 'mpps', tipo: 'conteo' }, [], 0).factor, 1);
});

// ── Ciclo de vida: EOM es el ultimo pedido; EOS es el fin del soporte ──────────
const { leerEol } = require('../scripts/importar-huawei.js');

test('--eol toma EOM como ultimo pedido y EOS como fin de soporte, no al reves', () => {
  const r = leerEol([
    ['Product Model', 'EOFS Date', 'EOS Date', 'EOM Date', 'Bulletin URL'],
    ['AR651', '2029-07-31', '2031-07-31', '2026-12-31', 'https://support.huawei.com/x'],
  ]);
  assert.strictEqual(r.error, undefined);
  assert.deepStrictEqual(r.aceptadas.map((a) => [a.id, a.lastOrder, a.endOfSupport]), [['AR651', '2026-12-31', '2031-07-31']]);
});

test('--eol rechaza un archivo con EOS pero sin EOM, en vez de tomar el fin de soporte por fin de venta', () => {
  const r = leerEol([['Modelo', 'EOFS Date', 'EOS Date'], ['AR651', '2029-07-31', '2031-07-31']]);
  assert.match(r.error, /EOS es el fin del SOPORTE/);
});

test('--eol aparta el boletin de una version de software: no es el fin de venta del chasis', () => {
  const r = leerEol([
    ['Modelo', 'Version', 'EOM Date'],
    ['NE8000 M8', 'V800R023C00', '2026-07-16'],
    ['NE8000 M4 V800R023C00', '', '2026-07-16'],
    ['AR651', '', '2026-12-31'],
  ]);
  assert.deepStrictEqual(r.aceptadas.map((a) => a.id), ['AR651']);
  assert.strictEqual(r.apartadas.length, 2);
  for (const a of r.apartadas) assert.match(a.motivo, /version de software \(V800R023C00\)/);
});

test('--eol aparta una fila con el fin de servicio antes del ultimo pedido: columnas cambiadas', () => {
  const r = leerEol([['Modelo', 'EOM Date', 'EOS Date'], ['AR651', '2031-07-31', '2026-12-31']]);
  assert.deepStrictEqual(r.aceptadas, []);
  assert.match(r.apartadas[0].motivo, /columnas cambiadas/);
});
