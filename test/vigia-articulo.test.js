'use strict';
// EL VIGÍA VIGILA EL ARTÍCULO DE UNA AYUDA, NO SU NAVEGACIÓN (2026-10-27, mejora propuesta al
// cerrar la quincuagesimosexta entrega). La ayuda de Cisco Secure Access sirve el tema dentro de
// su <article>, rodeado de la navegación de toda la ayuda. Lo que fija esta batería:
//   1. un tema nuevo en la navegación no mueve la huella; una cifra del tema sí;
//   2. una página sin <article>, o con uno casi vacío, es ilegible, nunca «sin cambios»;
//   3. la fuente de la que sale `tunelMbps` y `ecmpMax` de Secure Access se vigila así.
const test = require('node:test');
const assert = require('node:assert');
const http = require('http');
const { revisar, articuloDe } = require('../scripts/vigia-fuentes');
const { FUENTES } = require('../server/seed/legacyData/fuentes');

const tema = (gbps = '1 Gbps', ecmp = '10') => `<article id="ipsec-network-tunnels" class="topic concept"><h1>Establish an IPsec Tunnel</h1>
<p>Tunnel Throughput, Capacity, and Scaling. Each tunnel supports the following limits and allowances:</p>
<table><tr><td>Maximum throughput</td><td>${gbps} per tunnel (in either direction)</td></tr>
<tr><td>Packets per second</td><td>No restriction</td></tr><tr><td>Users per tunnel</td><td>No restriction</td></tr></table>
<p>Secure Access supports up to ${ecmp} ECMP tunnels. Exceeding the throughput limit may result in degraded performance.</p></article>`;
const pagina = ({ nav = 'Network Tunnel Groups · Resource Connectors', cuerpo = tema() } = {}) =>
  `<!doctype html><html><body><nav>${nav}</nav>${cuerpo}<footer>Last updated: Oct 26, 2026</footer></body></html>`;

let servidor;
let base;
test.before(async () => {
  const rutas = {
    '/igual': pagina(),
    '/otra-navegacion': pagina({ nav: 'Network Tunnel Groups · Resource Connectors · Un tema nuevo de la ayuda' }),
    '/otra-cifra': pagina({ cuerpo: tema('2 Gbps') }),
    '/sin-articulo': pagina({ cuerpo: '<div>Sign in to continue</div>' }),
    '/articulo-vacio': pagina({ cuerpo: '<article>Loading…</article>' }),
  };
  servidor = http.createServer((req, res) => {
    if (rutas[req.url]) { res.writeHead(200, { 'Content-Type': 'text/html' }); res.end(rutas[req.url]); return; }
    res.writeHead(404); res.end('no');
  });
  await new Promise((r) => servidor.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${servidor.address().port}`;
});
test.after(() => servidor && servidor.close());

const fuente = (ruta) => ({ documento: 'Establish an IPsec Tunnel', url: base + ruta, vigilar: 'articulo' });

test('una entrada nueva en la navegación no mueve la huella; una cifra del tema sí', async () => {
  const a = await revisar('cisco', fuente('/igual'));
  const b = await revisar('cisco', fuente('/otra-navegacion'));
  const c = await revisar('cisco', fuente('/otra-cifra'));
  assert.strictEqual(a.estado, 'leido');
  assert.strictEqual(a.clase, 'datos');
  assert.notStrictEqual(a.hashTexto, b.hashTexto, 'el texto de la página sí cambió');
  assert.strictEqual(a.hashVigilado, b.hashVigilado, 'el tema no');
  assert.notStrictEqual(a.hashVigilado, c.hashVigilado, 'el gigabit por túnel sí');
});

test('sin <article>, o con uno casi vacío, la página es ilegible', async () => {
  const sin = await revisar('cisco', fuente('/sin-articulo'));
  assert.strictEqual(sin.estado, 'inalcanzable');
  assert.match(sin.detalle, /no trae el <article>/);
  const vacio = await revisar('cisco', fuente('/articulo-vacio'));
  assert.strictEqual(vacio.estado, 'inalcanzable');
  assert.match(vacio.detalle, /casi vacío/);
  assert.strictEqual(articuloDe('<p>nada</p>'), null);
});

test('la fuente de los túneles de Secure Access se vigila por su artículo', () => {
  const f = FUENTES.cisco.find((x) => /Establish an IPsec Tunnel/.test(x.documento));
  assert.ok(f, 'la fuente existe');
  assert.strictEqual(f.vigilar, 'articulo');
  assert.strictEqual(f.estable, false);
});
