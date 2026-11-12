'use strict';
// /api/fuentes?vendor=<code> (2026-11-01, mejora propuesta al cerrar el PR #120). La pestaña de
// fuentes, la hoja «Supuestos» y el arranque de Fortinet pintan un solo fabricante y bajaban los
// siete. Se arranca el servidor real en modo producción (como test/compresion.test.js) y se fija:
//   - con `vendor`, la misma forma (`{ <code>: {...} }`) y el mismo contenido que la entrada de la
//     respuesta completa, y nada más;
//   - sin `vendor`, los siete, como siempre (`scripts/verificar-pantallas.js` la lee así);
//   - un código que no existe da 404 y uno mal formado 400: nunca un `{}` que la pantalla leería
//     como «sin procedencia registrada»;
//   - los tres lectores del navegador piden su fabricante, no los siete.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');

const RAIZ = path.join(__dirname, '..');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'presales-fuentes-vendor-'));
process.env.AUTH_STATE_DIR = dir;
const usuariosMod = require('../server/usuarios');
fs.writeFileSync(path.join(dir, 'usuarios.json'), JSON.stringify({ version: 1, usuarios: [
  { id: 'u1', usuario: 'ana', nombre: 'Ana', rol: 'admin', activo: true, passwordHash: usuariosMod.hashPassword('contrasena-de-ana-larga') },
] }));

const PORT = 5300 + Math.floor(Math.random() * 400);
let servidor;
let salida = '';

function pedir(ruta, { metodo = 'GET', cookie, cuerpo } = {}) {
  return new Promise((resolve, reject) => {
    const headers = {};
    if (cookie) headers.Cookie = cookie;
    if (cuerpo) headers['Content-Type'] = 'application/json';
    const req = http.request({ host: '127.0.0.1', port: PORT, path: ruta, method: metodo, headers }, (res) => {
      const partes = [];
      res.on('data', (c) => partes.push(c));
      res.on('end', () => resolve({ status: res.statusCode, texto: Buffer.concat(partes).toString('utf8'), headers: res.headers }));
    });
    req.on('error', reject);
    if (cuerpo) req.write(JSON.stringify(cuerpo));
    req.end();
  });
}

test.before(() => new Promise((resolve, reject) => {
  servidor = spawn(process.execPath, ['server/server.js'], { cwd: RAIZ, env: { ...process.env, NODE_ENV: 'production', PORT: String(PORT),
    AUTH_PASSWORD: 'no-se-usa', AUTH_STATE_DIR: dir, SESSION_SECRET: 's', ANTHROPIC_API_KEY: '' } });
  const t = setTimeout(() => reject(new Error(`no arrancó:\n${salida}`)), 60000);
  const oir = (c) => { salida += c; if (salida.includes('Presales corriendo en')) { clearTimeout(t); resolve(); } };
  servidor.stdout.on('data', oir);
  servidor.stderr.on('data', oir);
}));
test.after(() => { if (servidor) servidor.kill(); fs.rmSync(dir, { recursive: true, force: true }); });

async function sesion() {
  const r = await pedir('/login', { metodo: 'POST', cuerpo: { usuario: 'ana', password: 'contrasena-de-ana-larga' } });
  assert.strictEqual(r.status, 200);
  return String(r.headers['set-cookie']).split(';')[0];
}

test('con ?vendor= llega solo ese fabricante, idéntico a su entrada en la respuesta completa', async () => {
  const cookie = await sesion();
  const todas = await pedir('/api/fuentes', { cookie });
  assert.strictEqual(todas.status, 200);
  const completo = JSON.parse(todas.texto);
  const codigos = Object.keys(completo);
  assert.deepStrictEqual([...codigos].sort(), ['aruba', 'cisco', 'fortinet', 'huawei', 'juniper', 'mikrotik', 'nokia'],
    'sin vendor siguen llegando los siete');
  let suma = 0;
  for (const code of codigos) {
    const r = await pedir(`/api/fuentes?vendor=${code}`, { cookie });
    assert.strictEqual(r.status, 200, code);
    const uno = JSON.parse(r.texto);
    assert.deepStrictEqual(Object.keys(uno), [code], `${code}: solo su clave`);
    assert.deepStrictEqual(uno[code], completo[code], `${code}: el mismo contenido que en la respuesta completa`);
    suma += r.texto.length;
    assert.ok(r.texto.length < todas.texto.length, `${code}: pesa menos que los siete`);
  }
  assert.ok(suma <= todas.texto.length + 200, 'los siete por separado suman lo mismo que la respuesta completa');
});

test('un fabricante desconocido da 404 y uno mal formado 400, nunca un objeto vacío', async () => {
  const cookie = await sesion();
  const nadie = await pedir('/api/fuentes?vendor=arista', { cookie });
  assert.strictEqual(nadie.status, 404);
  assert.match(nadie.texto, /desconocido/);
  for (const malo of ['', 'Cisco', '..%2F', 'a'.repeat(40), 'cisco&vendor=aruba']) {
    const r = await pedir(`/api/fuentes?vendor=${malo}`, { cookie });
    assert.strictEqual(r.status, 400, `«${malo}» se rechaza (${r.status})`);
  }
});

test('sin sesión, la ruta filtrada sigue tras el muro', async () => {
  const r = await pedir('/api/fuentes?vendor=cisco');
  assert.strictEqual(r.status, 401);
});

test('los tres lectores del navegador piden su fabricante, no los siete', () => {
  const leer = (f) => fs.readFileSync(path.join(RAIZ, 'public/js', f), 'utf8');
  const sinFiltro = /fetch\(\s*['"`]\/api\/fuentes['"`]\s*\)/;
  for (const f of ['procedencia.js', 'bom.js', 'dimensionador-fortinet-fortigate.js']) {
    assert.doesNotMatch(leer(f), sinFiltro, `${f} ya no pide /api/fuentes entera`);
    assert.match(leer(f), /\/api\/fuentes\?vendor=/, `${f} pide con ?vendor=`);
  }
});
