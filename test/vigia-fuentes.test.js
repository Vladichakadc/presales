'use strict';
// El vigia de fuentes, contra un servidor local.
//
// LA REGLA QUE FIJA ESTA BATERIA: un documento que no se pudo leer NO es un documento sin
// cambios. Confundirlos seria decir "todo sigue igual" cuando en realidad no se comprobo
// nada — el mismo error que tratar `redund: undefined` como `false`, o una fuente sin fecha
// como recien verificada. Por eso `inalcanzable` es un estado propio y sale en el informe.
const test = require('node:test');
const assert = require('node:assert');
const http = require('http');
const crypto = require('crypto');
const { revisar, claveDe } = require('../scripts/vigia-fuentes');

let servidor;
let base;
const CUERPO = 'contenido del datasheet oficial';

test.before(async () => {
  servidor = http.createServer((req, res) => {
    if (req.url === '/ok') { res.writeHead(200, { 'Content-Type': 'application/pdf' }); res.end(CUERPO); return; }
    if (req.url === '/otro') { res.writeHead(200); res.end('el fabricante lo cambio'); return; }
    res.writeHead(403); res.end('denegado por politica');
  });
  await new Promise((r) => servidor.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${servidor.address().port}`;
});

test.after(() => servidor && servidor.close());

test('un documento accesible se lee y se resume con su sha-256', async () => {
  const r = await revisar('fortinet', { documento: 'Matrix', url: `${base}/ok` });
  assert.strictEqual(r.estado, 'leido');
  assert.strictEqual(r.hash, crypto.createHash('sha256').update(CUERPO).digest('hex'));
  assert.strictEqual(r.bytes, Buffer.byteLength(CUERPO));
});

test('el hash cambia cuando el documento cambia, que es todo el punto del vigia', async () => {
  const uno = await revisar('fortinet', { documento: 'Matrix', url: `${base}/ok` });
  const otro = await revisar('fortinet', { documento: 'Matrix', url: `${base}/otro` });
  assert.notStrictEqual(uno.hash, otro.hash);
});

test('un 403 se reporta como inalcanzable con su codigo, nunca como sin cambios', async () => {
  const r = await revisar('juniper', { documento: 'SRX Matrix', url: `${base}/denegado` });
  assert.strictEqual(r.estado, 'inalcanzable');
  assert.match(r.detalle, /403/);
  assert.strictEqual(r.hash, undefined, 'sin hash: no se leyo nada que resumir');
});

test('un host que no responde tampoco se da por bueno', async () => {
  // Puerto cerrado a proposito: la conexion falla y eso es informacion, no silencio.
  const r = await revisar('cisco', { documento: 'EOL', url: 'http://127.0.0.1:1/nada' });
  assert.strictEqual(r.estado, 'inalcanzable');
  assert.ok(r.detalle, 'dice por qué no se pudo leer');
});

test('la clave identifica al documento y no a su posicion en la lista', () => {
  // Reordenar FUENTES no debe perder el historial de hashes.
  assert.strictEqual(claveDe('fortinet', { url: 'https://x/y.pdf' }), 'fortinet::https://x/y.pdf');
  assert.notStrictEqual(
    claveDe('fortinet', { url: 'https://x/y.pdf' }),
    claveDe('juniper', { url: 'https://x/y.pdf' }),
  );
});
