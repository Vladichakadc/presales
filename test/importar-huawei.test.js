'use strict';
// El importador Huawei: normalizacion de nombres, parser de numeros y resolucion de unidad.
//
// Es el tercero de la familia (`cps`, `juniper`, `huawei`) y comparte su regla: una fila solo
// se cree si al menos dos de sus columnas casan con lo ya verificado y ninguna lo contradice.
// Lo que se prueba aqui es la mecanica que sostiene esa regla — si el nombre no normaliza, o
// la unidad se deduce mal, el anclaje compara peras con manzanas y deja de proteger.
const test = require('node:test');
const assert = require('node:assert');
const { claveModelo, aNumero, leerCabecera, resolverUnidad, evaluarCifras } = require('../scripts/importar-huawei');

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

// La tabla de rendimiento de las fichas AR, con sus cabeceras literales (R25C10, 2026-10-05).
// Trae nueve filas de cifras y solo tres son campos del catalogo; las otras seis miden otra
// cosa (otro escenario o un paquete fijo) y tienen que quedarse fuera.
const CABECERA_HUAWEI = [
  'Model',
  'Forwarding performance (NAT + ACL + QoS, IMIX)',
  'IPsec performance (IMIX)',
  'IPsec performance (512 bytes)',
  'SD-WAN IPsec performance* (IMIX)',
  'SD-WAN IPsec performance* (512 bytes)',
  'SD-WAN performance** (IMIX)',
  'SD-WAN performance** (512 bytes)',
  'SD-WAN typical performance*** (IMIX)',
  'SD-WAN typical performance*** (512 bytes)',
];

test('la cabecera literal de Huawei cae en su campo: el reenvio IMIX no es el SD-WAN tipico', () => {
  const { columnas, ignoradas } = leerCabecera(CABECERA_HUAWEI);
  const porCampo = Object.fromEntries(columnas.map((c) => [c.campo, CABECERA_HUAWEI[c.i]]));
  assert.deepStrictEqual(porCampo, {
    fwd: 'Forwarding performance (NAT + ACL + QoS, IMIX)',
    ipsec: 'IPsec performance (IMIX)',
    typ: 'SD-WAN typical performance*** (IMIX)',
  });
  // «SD-WAN IPsec performance» es la fila que el AR8700-8 llevaba como `typ` (24 Gbps).
  assert.ok(ignoradas.includes('SD-WAN IPsec performance* (IMIX)'));
  assert.ok(ignoradas.includes('SD-WAN performance** (IMIX)'));
  for (const h of ignoradas) assert.ok(!/typical.*IMIX\)$/.test(h) || /bytes/.test(h), h);
});

// Catalogo sintetico: las pruebas no se ponen rojas el dia que alguien corrige un dato.
const CATALOGO = [
  { id: 'AR9990', fwd: 30000, ipsec: 20000, typ: 24000, mpps: null },
  { id: 'AR9991', fwd: 2000, ipsec: 2000, typ: null, mpps: null },
];
const fila = (modelo, fwd, ipsec, typ) => [modelo, fwd, ipsec, '', '', '', '', '', typ, ''];

test('sin --force, una cifra que difiere aparta la fila entera: parece una fila desplazada', () => {
  const r = evaluarCifras([CABECERA_HUAWEI, fila('AR9990', '30 Gbps', '20 Gbps', '15.5 Gbps')], {}, CATALOGO);
  assert.deepStrictEqual(r.aceptadas, []);
  assert.match(r.apartadas[0].motivo, /la fila dice 15\.500 y el catalogo 24\.000 .*--force lo corrige/);
});

test('--force pisa la cifra que difiere cuando las otras dos columnas anclan', () => {
  const r = evaluarCifras([CABECERA_HUAWEI, fila('AR9990', '30 Gbps', '20 Gbps', '15.5 Gbps')], { force: true }, CATALOGO);
  assert.deepStrictEqual(r.apartadas, []);
  assert.strictEqual(r.aceptadas[0].anclas, 2);
  assert.deepStrictEqual(r.aceptadas[0].nuevos.map((n) => [n.campo, n.valor, n.pisa]), [['typ', 15500, 24000]]);
});

test('--force no salta el anclaje: con una sola columna que casa, no corrige nada', () => {
  const r = evaluarCifras([CABECERA_HUAWEI, fila('AR9990', '30 Gbps', '', '15.5 Gbps')], { force: true }, CATALOGO);
  assert.deepStrictEqual(r.aceptadas, []);
  assert.match(r.apartadas[0].motivo, /solo 1 ancla/);
  // Saltarse el anclaje es otra decision, con otro nombre.
  const s = evaluarCifras([CABECERA_HUAWEI, fila('AR9990', '30 Gbps', '', '15.5 Gbps')], { force: true, sinContraste: true }, CATALOGO);
  assert.strictEqual(s.aceptadas.length, 1);
});

test('un hueco se llena con dos anclas, y la unidad sale de la cabecera o del contraste', () => {
  const r = evaluarCifras([CABECERA_HUAWEI, fila('AR9991', '2 Gbps', '2 Gbps', '600 Mbps')], {}, CATALOGO);
  assert.deepStrictEqual(r.aceptadas[0].nuevos.map((n) => [n.campo, n.valor]), [['typ', 600]]);
  assert.strictEqual(r.aceptadas[0].anclas, 2);
});

test('el orden de las columnas no decide: la de SD-WAN o la de paquete fijo no roban el campo', () => {
  // Una hoja copiada a mano no tiene por que traer el orden de la ficha. Si la columna de
  // paquete fijo o la de SD-WAN llega primero, el campo tiene que seguir siendo el de IMIX.
  const cab = ['Modelo', 'Forwarding performance (1400 bytes)', 'SD-WAN IPsec performance (IMIX)',
    'Forwarding performance (NAT + ACL + QoS, IMIX)', 'IPsec performance (IMIX)'];
  const { columnas } = leerCabecera(cab);
  const porCampo = Object.fromEntries(columnas.map((c) => [c.campo, cab[c.i]]));
  assert.deepStrictEqual(porCampo, {
    fwd: 'Forwarding performance (NAT + ACL + QoS, IMIX)',
    ipsec: 'IPsec performance (IMIX)',
  });
});
