'use strict';
// RESPUESTAS COMPRIMIDAS (2026-11-01, «optimizar la página»). Se arranca el servidor real en modo
// producción, como test/servidor-produccion.test.js, y se pide con http crudo para ver la cabecera
// Content-Encoding (fetch descomprime por su cuenta). Lo que se fija: brotli o gzip según lo que pide
// el navegador, el contenido intacto, nada comprimido sin pedirlo y las rutas con secretos fuera (BREACH).
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const zlib = require('zlib');
const { spawn } = require('child_process');

const RAIZ = path.join(__dirname, '..');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'presales-compresion-'));
process.env.AUTH_STATE_DIR = dir;
const usuariosMod = require('../server/usuarios');
// Cuarenta usuarios: la lista de /api/usuarios pasa de 1 KB, el umbral por debajo del cual nada se
// comprime. Sin eso, la prueba de las rutas con secretos pasaría aunque se quitara el filtro.
const hashConsulta = usuariosMod.hashPassword('contrasena-de-consulta-larga');
fs.writeFileSync(path.join(dir, 'usuarios.json'), JSON.stringify({ version: 1, usuarios: [
  { id: 'u1', usuario: 'ana', nombre: 'Ana', rol: 'admin', activo: true, passwordHash: usuariosMod.hashPassword('contrasena-de-ana-larga') },
  ...Array.from({ length: 40 }, (_, i) => ({ id: `c${i}`, usuario: `consulta${i}`, nombre: `Persona de consulta número ${i}`, rol: 'consulta', activo: true, passwordHash: hashConsulta })),
] }));

const PORT = 4900 + Math.floor(Math.random() * 400);
let servidor;
let salida = '';

function pedir(ruta, { metodo = 'GET', encoding, cookie, cuerpo } = {}) {
  return new Promise((resolve, reject) => {
    const headers = {};
    if (encoding) headers['Accept-Encoding'] = encoding;
    if (cookie) headers.Cookie = cookie;
    if (cuerpo) headers['Content-Type'] = 'application/json';
    const req = http.request({ host: '127.0.0.1', port: PORT, path: ruta, method: metodo, headers }, (res) => {
      const partes = [];
      res.on('data', (c) => partes.push(c));
      res.on('end', () => {
        const crudo = Buffer.concat(partes);
        const enc = res.headers['content-encoding'] || null;
        const texto = (enc === 'br' ? zlib.brotliDecompressSync(crudo) : enc === 'gzip' ? zlib.gunzipSync(crudo) : crudo).toString('utf8');
        resolve({ status: res.statusCode, enc, bytes: crudo.length, texto, headers: res.headers });
      });
    });
    req.on('error', reject);
    if (cuerpo) req.write(JSON.stringify(cuerpo));
    req.end();
  });
}

test.before(() => new Promise((resolve, reject) => {
  servidor = spawn(process.execPath, ['server/server.js'], { cwd: RAIZ, env: { ...process.env, NODE_ENV: 'production', PORT: String(PORT),
    AUTH_PASSWORD: 'no-se-usa', AUTH_STATE_DIR: dir, DATABASE_PATH: path.join(dir, 'c.sqlite'), SESSION_SECRET: 's', ANTHROPIC_API_KEY: '' } });
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

test('los scripts salen con brotli o gzip según lo que pide el navegador, y el contenido es el mismo', async () => {
  const cookie = await sesion();
  const original = fs.readFileSync(path.join(RAIZ, 'public/js/bom.js'), 'utf8');
  const br = await pedir('/js/bom.js', { encoding: 'br, gzip', cookie });
  assert.strictEqual(br.enc, 'br');
  assert.strictEqual(br.texto, original, 'descomprimido es el archivo exacto');
  assert.ok(br.bytes < original.length * 0.5, `brotli reduce más de la mitad (${br.bytes} de ${original.length})`);
  assert.match(String(br.headers.vary), /Accept-Encoding/i, 'Vary para que ninguna caché sirva la versión equivocada');
  const gz = await pedir('/js/bom.js', { encoding: 'gzip', cookie });
  assert.strictEqual(gz.enc, 'gzip');
  assert.strictEqual(gz.texto, original);
  const nada = await pedir('/js/bom.js', { cookie });
  assert.strictEqual(nada.enc, null, 'sin Accept-Encoding no se comprime');
});

test('el JSON de la API también sale comprimido', async () => {
  const cookie = await sesion();
  const r = await pedir('/api/fuentes', { encoding: 'gzip', cookie });
  assert.strictEqual(r.status, 200);
  assert.strictEqual(r.enc, 'gzip');
  assert.ok(JSON.parse(r.texto), 'JSON válido tras descomprimir');
  assert.ok(r.bytes < Buffer.byteLength(r.texto) * 0.4, `(${r.bytes} de ${Buffer.byteLength(r.texto)})`);
});

test('las rutas con secretos no se comprimen (BREACH)', async () => {
  const login = await pedir('/login', { metodo: 'POST', encoding: 'br, gzip', cuerpo: { usuario: 'ana', password: 'contrasena-de-ana-larga' } });
  assert.strictEqual(login.enc, null, 'el acceso');
  const cookie = String(login.headers['set-cookie']).split(';')[0];
  const alta = await pedir('/api/usuarios', { metodo: 'POST', encoding: 'br, gzip', cookie,
    cuerpo: { usuario: 'carla-con-un-nombre-largo-para-pasar-del-kilobyte', nombre: 'Carla '.repeat(200), rol: 'consulta' } });
  assert.ok([200, 201, 400].includes(alta.status), `alta: ${alta.status} ${alta.texto.slice(0, 120)}`);
  assert.strictEqual(alta.enc, null, 'el alta, que devuelve la contraseña generada');
  const lista = await pedir('/api/usuarios', { encoding: 'gzip', cookie });
  assert.ok(Buffer.byteLength(lista.texto) > 2048, `la lista pasa del umbral de compresión (${Buffer.byteLength(lista.texto)} B): si no, esta prueba no prueba nada`);
  assert.strictEqual(lista.enc, null, 'la lista de usuarios');
  const estado = await pedir('/api/cuenta/estado', { encoding: 'gzip', cookie });
  assert.strictEqual(estado.enc, null, 'la cuenta');
});
