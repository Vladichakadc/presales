'use strict';
// `npm run cisco` (scripts/contrastar-cisco.js): las fichas de Cisco y Meraki contra el catálogo,
// celda a celda (mejora propuesta al cerrar la entrega del dimensionador Cisco, 2026-10-20).
//
// Las fichas reales viven en ramas de transporte (`fuente/*`), no en el repositorio: estas pruebas
// usan fichas sintéticas con la maquetación de las reales (cabecera que agrupa modelos, `colspan`
// de Meraki, dos bases de IPsec en el Catalyst) y las cifras del propio catálogo, así que siguen
// valiendo si una cifra cambia. Lo que vigilan es lo que haría mentir al comparador: decir «casa»
// con una cifra cambiada, comparar la base equivocada o dar por buena una ficha que ya no sabe leer.
const test = require('node:test');
const assert = require('node:assert');
const { contrastar, valor, codigoSalida } = require('../scripts/contrastar-cisco.js');
const { MODELS } = require('../server/seed/legacyData/cisco.js');

const id = (x) => MODELS.find((m) => m.id === x);
const gbps = (mbps) => `Up to ${mbps / 1000} Gbps`;
const pagina = (titulo, tablas, canonica = null) => `<html><head><title>${titulo}</title>${canonica ? `<link rel="canonical" href="${canonica}">` : ''}</head><body>${tablas}</body></html>`;
const fila = (...c) => `<tr>${c.map((x) => `<td>${x}</td>`).join('')}</tr>`;

function fichaG2({ fwd } = {}) {
  const a = id('Cisco Secure Router C8211-G2');
  const b = id('Cisco Secure Router C8231-G2');
  return pagina('Cisco 8200 Series Secure Routers Data Sheet - Cisco', `<table>
    ${fila('', 'C8231-E-G2, C8231-G2, C8221-G2, and C8221L-G2', 'C8211-G2')}
    <tr><td colspan="3">Throughput</td></tr>
    ${fila('Forwarding (512B)', gbps(b.fwd), gbps(fwd ?? a.fwd))}
    ${fila('IPsec (512B)', gbps(b.ipsec), gbps(a.ipsec))}
    ${fila('SD-WAN* (512B)', gbps(b.sdwan), gbps(a.sdwan))}
    ${fila('IPsec tunnels', `Up to ${b.tuneles} (Starting at IOS XE 26.2.1) Up to 700 (Prior to IOS XE 26.2.1)`, `Up to ${a.tuneles} (Starting at IOS XE 26.2.1)`)}
  </table>`);
}

test('una ficha con las cifras del catálogo casa entera, y la celda agrupada vale para cada modelo', () => {
  const r = contrastar(fichaG2(), 'g2.html');
  assert.strictEqual(r.familia, 'Secure Router (G2)');
  assert.ok(r.celdas.length >= 16, `solo ${r.celdas.length} celdas`);
  assert.ok(r.celdas.every((x) => x.estado === 'casa'), JSON.stringify(r.celdas.filter((x) => x.estado !== 'casa')));
  // «C8231-E-G2, C8231-G2, C8221-G2, and C8221L-G2» nombra a los cuatro, y el C8231-G2 no se
  // confunde con el C8231-E-G2.
  const nombrados = new Set(r.celdas.map((x) => x.modelo));
  for (const n of ['C8231-E-G2', 'C8231-G2', 'C8221-G2', 'C8221L-G2', 'C8211-G2']) assert.ok(nombrados.has(`Cisco Secure Router ${n}`), n);
  assert.strictEqual(codigoSalida([r]), 0);
});

test('una cifra cambiada en la ficha sale como diferencia, con las dos cifras', () => {
  const r = contrastar(fichaG2({ fwd: 9999000 }), 'g2.html');
  const d = r.celdas.filter((x) => x.estado === 'difiere');
  assert.strictEqual(d.length, 1);
  assert.deepStrictEqual([d[0].modelo, d[0].campo, d[0].ficha], ['Cisco Secure Router C8211-G2', 'fwd', 9999000]);
  assert.strictEqual(codigoSalida([r]), 1);
});

test('falla cerrado: una ficha reconocida de la que no sale ninguna celda no es «todo casa»', () => {
  const otra = fichaG2().replace(/Forwarding \(512B\)|IPsec \(512B\)|SD-WAN\* \(512B\)|IPsec tunnels/g, 'Otra etiqueta');
  const r = contrastar(otra, 'g2.html');
  assert.strictEqual(r.celdas.length, 0);
  assert.strictEqual(codigoSalida([r]), 2);
  // Y un archivo que no es una ficha se ignora; solo ignorados tampoco es «todo casa».
  const guia = contrastar(pagina('Hardware Installation Guide for Cisco 8400 Series Secure Routers - Cisco', ''), 'hig.html');
  assert.strictEqual(guia.reconocida, false);
  assert.strictEqual(codigoSalida([guia]), 2);
});

test('el modelo que cita la ficha y no aparece en ninguna cabecera sale «sin columna»', () => {
  const url = id('Cisco Secure Router C8211-G2').datasheet;
  const r = contrastar(fichaG2().replace('</head>', `<link rel="canonical" href="${url}"></head>`), 'g2.html');
  // La ficha sintética no trae el C8225-G2 ni los C8235: su `datasheet` es la misma.
  assert.ok(r.sinColumna.includes('Cisco Secure Router C8225-G2'));
  assert.ok(!r.sinColumna.includes('Cisco Secure Router C8211-G2'));
  assert.strictEqual(codigoSalida([r]), 1);
});

test('Catalyst: con IPsec en dos bases se compara la que el modelo declara en `bases`', () => {
  const m = id('Catalyst 8200');
  assert.match(m.bases.ipsec, /IMIX/);
  const r = contrastar(pagina('Cisco Catalyst 8200 Series Edge Platforms Data Sheet - Cisco', `<table>
    ${fila('Feature', 'C8200-1N-4T')}
    ${fila('IPv4 Forwarding Throughput (1400Bytes)', gbps(m.fwd))}
    ${fila('IPsec Throughput (1400Bytes)', 'Up to 123Gbps')}
    ${fila('IPsec Throughput (IMIX * )', `${m.ipsec}Mbps`)}
  </table>`), 'c8200.html');
  const ipsec = r.celdas.filter((x) => x.campo === 'ipsec');
  assert.strictEqual(ipsec.length, 1, 'comparó también la base de 1.400 B');
  assert.strictEqual(ipsec[0].estado, 'casa');
  assert.ok(r.celdas.every((x) => x.estado === 'casa'));
});

test('Meraki: la cabecera con colspan, «-» casa con null y el texto «up to N devices»', () => {
  const mx = id('Cisco Secure Router C8355-G2-MX');
  const r = contrastar(pagina('C8355-G2-MX Datasheet - Cisco Meraki Documentation', `<table>
    <tr><th colspan="2">C8355-G2-MX</th></tr>
    ${fila('Maximum NGFW Throughput', `${mx.fwd / 1000} Gbps`)}
    ${fila('Maximum Site-to-Site VPN Throughput', `${mx.ipsec / 1000} Gbps`)}
    ${fila('Advanced Security Throughput', `${mx.amenazas / 1000} Gbps`)}
    ${fila('Recommended Device Count', mx.clientes.toLocaleString('en-US'))}
    ${fila('Maximum Recommended Tunnels', mx.tuneles.toLocaleString('en-US'))}
    ${fila('Recommended Use Case', 'Large branch secure routing and SD-WAN')}
  </table>`), 'c8355.html');
  assert.deepStrictEqual(r.celdas.map((x) => x.campo).sort(), ['amenazas', 'clientes', 'fwd', 'ipsec', 'sdwan', 'tuneles']);
  assert.ok(r.celdas.every((x) => x.estado === 'casa'), JSON.stringify(r.celdas));
  const g2 = id('Cisco Secure Router C8130-G2');
  assert.strictEqual(g2.amenazas, null);
  const sinTp = contrastar(pagina('Cisco 8100 Series Secure Routers Data Sheet - Cisco', `<table>
    ${fila('Throughput', 'C8130-G2/ C8130-VAI-G2')}
    ${fila('Threat Protection** (EMIX)', '-')}
  </table>`), 'c8100.html');
  // Desde el 2026-10-26 la columna nombra dos modelos del catálogo (el C8130-VAI-G2 entró con su
  // modelo base), y se contrastan los dos.
  assert.deepStrictEqual(sinTp.celdas.map((x) => [x.campo, x.estado]), [['amenazas', 'casa'], ['amenazas', 'casa']]);
});

test('lectura de celdas: unidades, sufijos K y M, notas y texto alrededor', () => {
  assert.deepStrictEqual(valor('Up to 19.7Gbps', 'mbps'), { n: 19700 });
  assert.deepStrictEqual(valor('1,200 Mbps', 'mbps'), { n: 1200 });
  assert.deepStrictEqual(valor('900 Mbps***', 'mbps'), { n: 900 });
  assert.deepStrictEqual(valor('Up to 6K (Starting from IOS XE 26.2.1) Up to 3.5K', 'n'), { n: 6000 });
  assert.deepStrictEqual(valor('1.5M', 'n'), { n: 1500000 });
  assert.deepStrictEqual(valor('8000 (10000 [2] )', 'n'), { n: 8000 });
  assert.deepStrictEqual(valor('Small branch with up to 50 devices', 'n'), { n: 50 });
  assert.deepStrictEqual(valor('-', 'mbps'), { noPublica: true });
  assert.strictEqual(valor('Yes', 'mbps'), null);
});

// DESDE EL VIGÍA (2026-10-21): `--traer` trae las fichas que el catálogo cita y fuentes.js
// declara, y nunca otra; lo que no se puede traer o leer sale con su motivo y código 2.
test('--traer: solo las fichas del catálogo que fuentes.js declara, de los dominios oficiales', () => {
  const { fichasDeCatalogo } = require('../scripts/contrastar-cisco.js');
  const { FUENTES } = require('../server/seed/legacyData/fuentes.js');
  const lista = fichasDeCatalogo();
  assert.ok(lista.length >= 15, `solo ${lista.length} fichas`);
  const declaradas = new Set(FUENTES.cisco.map((f) => f.url));
  for (const u of lista) {
    assert.ok(declaradas.has(u), `${u} no está en fuentes.js`);
    assert.match(new URL(u).hostname, /^(www\.cisco\.com|documentation\.meraki\.com)$/);
  }
  // Un modelo que citara una ficha no declarada, o de otro dominio, no entra en la lista.
  const ajenos = [{ datasheet: 'https://ejemplo.invalid/ficha.html' }, { datasheet: lista[0] }];
  assert.deepStrictEqual(fichasDeCatalogo(ajenos, { cisco: [{ url: 'https://ejemplo.invalid/ficha.html' }, { url: lista[0] }] }), [lista[0]]);
});

test('--traer: una ficha que casa, otra que no se puede traer y otra que ya no es una ficha', async () => {
  const { traerYContrastar, resumenJson, codigoSalida } = require('../scripts/contrastar-cisco.js');
  const ok = await traerYContrastar('https://www.cisco.com/a.html', async () => ({ ok: true, status: 200, text: async () => fichaG2() }));
  assert.ok(ok.reconocida && !ok.error && ok.celdas.every((x) => x.estado === 'casa'));
  const caida = await traerYContrastar('https://www.cisco.com/b.html', async () => ({ ok: false, status: 403 }));
  assert.strictEqual(caida.error, 'HTTP 403');
  const login = await traerYContrastar('https://www.cisco.com/c.html', async () => ({ ok: true, status: 200, text: async () => pagina('Log in - Cisco', '') }));
  assert.match(login.error, /ya no se reconoce como ficha/);
  const red = await traerYContrastar('https://www.cisco.com/d.html', async () => { throw new Error('ECONNRESET'); });
  assert.strictEqual(red.error, 'ECONNRESET');
  // Un solo fallo basta para el 2: «no se pudo leer» nunca es «todo casa».
  assert.strictEqual(codigoSalida([ok]), 0);
  assert.strictEqual(codigoSalida([ok, caida]), 2);
  // El artefacto lleva lo que el issue necesita, sin el HTML.
  const j = resumenJson([ok, caida]);
  assert.deepStrictEqual(Object.keys(j.fichas[0]).sort(), ['casan', 'difieren', 'documento', 'error', 'sinColumna', 'sinLeer', 'url']);
  assert.strictEqual(j.fichas[1].error, 'HTTP 403');
  assert.ok(!JSON.stringify(j).includes('<table'));
});
