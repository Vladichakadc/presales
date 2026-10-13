'use strict';
// LAS FICHAS DE MIKROTIK SE VIGILAN POR SUS DATOS (2026-10-13, la mejora propuesta en la
// duodécima entrega). La fuente general solo miraba la portada de productos: si MikroTik cambiaba
// la tabla de pruebas o el precio de un equipo, nadie se enteraba y el dimensionador seguía
// recomendando con la cifra vieja. Lo que fija esta batería:
//   1. el vigía lee la página con el MISMO lector que `npm run mikrotik` y compara la huella de lo
//      transcrito, así que un carrusel de «productos relacionados» que cambia no alarma y un
//      precio que cambia sí;
//   2. una página que ya no se lee como la ficha de ese equipo no es «sin cambios»: es ilegible;
//   3. lo verificado en el lock es EXACTAMENTE lo transcrito en `mikrotikPruebas.js`. Si alguien
//      relee una ficha sin dejar el lock al día (o al revés), esta prueba se pone roja.
const test = require('node:test');
const assert = require('node:assert');
const http = require('http');
const { revisar } = require('../scripts/vigia-fuentes');
const { leerFicha, huellaFicha } = require('../scripts/importar-mikrotik');
const { validarLock } = require('../scripts/vigia-publicar');
const { FUENTES, documentoFichaMikrotik } = require('../server/seed/legacyData/fuentes');
const { FICHAS } = require('../server/seed/legacyData/mikrotikPruebas');
const LOCK = require('../server/seed/legacyData/fuentes.lock.json');

const pagina = ({ codigo = 'RB5009UG+S+IN', precio = '$219.00', relacionados = 'hEX S' } = {}) => `<!doctype html>
<meta property="og:url" content="https://mikrotik.com/product/rb5009ug_s_in" />
<div>Product code</div><div>${codigo}</div><div>Suggested price</div><div>${precio}</div>
<div>CPU</div><div>88F7040</div><div>CPU core count</div><div>4</div>
<div>Size of RAM</div><div>1 GB</div><div>RouterOS license</div><div>5</div>
<h2>Ethernet test results</h2><table>
<tr><td>Mode</td><td>Configuration</td><td>1518 byte</td><td>512 byte</td><td>64 byte</td></tr>
<tr><td>Routing</td><td>none (fast path)</td><td>811.2</td><td>9851.4</td><td>2332</td><td>9551.9</td><td>4969.4</td><td>2703.3</td></tr>
<tr><td>Routing</td><td>25 ip filter rules</td><td>771.2</td><td>9365.6</td><td>755.9</td><td>3096.2</td><td>761</td><td>414</td></tr>
</table><h2>Documents</h2><div>Related products</div><div>${relacionados}</div>`;

let servidor;
let base;
test.before(async () => {
  const rutas = {
    '/igual': pagina(),
    '/otro-carrusel': pagina({ relacionados: 'CCR2216-1G-12XS-2XQ' }),
    '/otro-precio': pagina({ precio: '$239.00' }),
    '/otro-equipo': pagina({ codigo: 'RB4011iGS+RM' }),
  };
  servidor = http.createServer((req, res) => {
    if (rutas[req.url]) { res.writeHead(200, { 'Content-Type': 'text/html' }); res.end(rutas[req.url]); return; }
    res.writeHead(404); res.end('no');
  });
  await new Promise((r) => servidor.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${servidor.address().port}`;
});
test.after(() => servidor && servidor.close());

const fuente = (ruta) => ({ documento: documentoFichaMikrotik('RB5009UG+S+IN'), url: base + ruta, vigilar: 'ficha-mikrotik', codigo: 'RB5009UG+S+IN' });

test('la huella del vigía es la del importador, y un carrusel distinto no la mueve', async () => {
  const a = await revisar('mikrotik', fuente('/igual'));
  const b = await revisar('mikrotik', fuente('/otro-carrusel'));
  assert.strictEqual(a.estado, 'leido');
  assert.strictEqual(a.clase, 'datos');
  assert.strictEqual(a.hashVigilado, huellaFicha(leerFicha(pagina()).ficha));
  assert.notStrictEqual(a.hashTexto, b.hashTexto, 'el texto de la página sí cambió');
  assert.strictEqual(a.hashVigilado, b.hashVigilado, 'los datos del equipo no');
});

test('un precio distinto sí mueve la huella', async () => {
  const a = await revisar('mikrotik', fuente('/igual'));
  const c = await revisar('mikrotik', fuente('/otro-precio'));
  assert.notStrictEqual(a.hashVigilado, c.hashVigilado);
});

test('la ficha de otro equipo en esa URL es ilegible, nunca «sin cambios»', async () => {
  const r = await revisar('mikrotik', fuente('/otro-equipo'));
  assert.strictEqual(r.estado, 'inalcanzable');
  assert.match(r.detalle, /es la ficha de RB4011iGS\+RM/);
});

test('cada ficha transcrita es una fuente vigilada, y su lock verificado es exactamente lo transcrito', () => {
  const vigiladas = FUENTES.mikrotik.filter((f) => f.vigilar === 'ficha-mikrotik');
  assert.strictEqual(vigiladas.length, Object.keys(FICHAS).length);
  for (const [codigo, f] of Object.entries(FICHAS)) {
    const e = LOCK.documentos[`mikrotik::${f.url}`];
    assert.ok(e, `${codigo}: sin entrada en el lock — se releyó la ficha sin dejar el lock verificado`);
    assert.strictEqual(e.clase, 'datos');
    assert.strictEqual(e.documento, documentoFichaMikrotik(codigo));
    assert.strictEqual(e.hashVerificado, huellaFicha({ codigo, ...f }),
      `${codigo}: lo verificado en el lock no es lo transcrito en mikrotikPruebas.js`);
  }
});

test('el job que publica acepta la clase «datos» y sigue sin dejar mover lo verificado de una fuente estable', () => {
  const clave = Object.keys(LOCK.documentos).find((k) => k.startsWith('mikrotik::https://mikrotik.com/product/'));
  assert.strictEqual(validarLock(LOCK, LOCK), null);
  const movido = JSON.parse(JSON.stringify(LOCK));
  movido.documentos[clave].hashVerificado = 'f'.repeat(64);
  assert.match(validarLock(LOCK, movido) || '', /movió hashVerificado/);
});
