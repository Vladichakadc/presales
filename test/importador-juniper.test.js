'use strict';
// El importador de la matriz SRX. Lo que se prueba aqui es el parser de numeros y el
// reconocimiento de cabeceras, que es donde un error no se ve: una unidad mal deducida
// escribe una cifra plausible en el catalogo y el dimensionador la usa sin pestanear.
const test = require('node:test');
const assert = require('node:assert');
const { aNumero, claveModelo, leerCabecera } = require('../scripts/importar-juniper');

test('normaliza el nombre del modelo venga como venga', () => {
  for (const t of ['SRX380', 'srx-380', 'SRX 380', 'Juniper SRX380', 'juniper srx-380']) {
    assert.strictEqual(claveModelo(t), 'SRX380', t);
  }
});

test('lo que no es un modelo del catalogo devuelve null', () => {
  assert.strictEqual(claveModelo('vSRX 3.0'), null);
  assert.strictEqual(claveModelo('Model'), null);
  assert.strictEqual(claveModelo(''), null);
});

test('separadores de miles y decimales', () => {
  assert.strictEqual(aNumero('6.5'), 6.5);
  assert.strictEqual(aNumero('512,000'), 512000);
  assert.strictEqual(aNumero('1,400,000'), 1400000);
  assert.strictEqual(aNumero('1.400.000'), 1400000);
  assert.strictEqual(aNumero('20 Gbps'), 20);
});

test('el punto con tres digitos se resuelve por el tipo de columna', () => {
  // "1.400" son 1,4 Gbps en una columna de caudal y 1.400 sesiones en una de conteo. No hay
  // forma de saberlo mirando la celda, asi que lo decide para que columna se esta leyendo.
  assert.strictEqual(aNumero('1.400'), 1.4);
  assert.strictEqual(aNumero('1.400', true), 1400);
});

test('celda sin dato no es lo mismo que celda ilegible', () => {
  // null = la matriz no publica esa cifra, se salta. NaN = hay algo y no se entiende, se
  // reporta. Confundirlos haria que un error de copia pasara por "sin dato publicado".
  for (const vacio of ['', '-', 'N/A', 'n/a', '  ']) assert.strictEqual(aNumero(vacio), null, vacio);
  assert.ok(Number.isNaN(aNumero('unos 20')));
  assert.ok(Number.isNaN(aNumero('abc')));
});

test('reconoce las columnas por cabecera, con IMIX antes que la base', () => {
  const cab = ['Model', 'Firewall Performance (Max)', 'Firewall Performance (IMIX)',
    'IPsec VPN (Max)', 'IPsec VPN (IMIX)', 'IPS Throughput', 'Threat Prevention',
    'Max Concurrent Sessions', 'Connections per Second'];
  const { colModelo, columnas } = leerCabecera(cab);
  assert.strictEqual(colModelo, 0);
  assert.strictEqual(columnas.map((c) => c.campo).join(','),
    'fw,fwImix,vpn,vpnImix,ips,atp,sess,cps');
});

test('"IPsec" no se confunde con la columna de IPS', () => {
  // \\bips\\b no puede picar dentro de "ipsec": serian dos capas de medicion distintas
  // intercambiadas, que es exactamente el error que este catalogo separa en campos.
  const { columnas } = leerCabecera(['Model', 'IPsec VPN Throughput']);
  assert.strictEqual(columnas[0].campo, 'vpn');
});

test('la unidad declarada en la cabecera se lee', () => {
  const { columnas } = leerCabecera(['Model', 'Firewall (Gbps)', 'IPS Throughput (Mbps)']);
  assert.strictEqual(columnas[0].unidadDeclarada, 1000);
  assert.strictEqual(columnas[1].unidadDeclarada, 1);
});

test('una cabecera que no se reconoce se aparta, no se adivina', () => {
  const { columnas, ignoradas } = leerCabecera(['Model', 'Rack Units', 'Firewall']);
  assert.strictEqual(columnas.length, 1);
  assert.deepStrictEqual(ignoradas, ['Rack Units']);
});
