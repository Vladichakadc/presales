'use strict';
// Escritura atómica en el volumen persistente (server/escrituraAtomica.js).
//
// LO QUE SE PRUEBA ES LO QUE FALLA EN SILENCIO. Un `usuarios.json` cortado por un SIGTERM a mitad
// de escritura se lee como «no existe» y el arranque rehace el administrador desde AUTH_PASSWORD:
// se pierden los usuarios dados de alta sin que nada lo diga. Aquí se afirma que el destino nunca
// queda a medias (si la escritura falla, sigue el contenido anterior), que no quedan temporales,
// que el permiso 0600 se conserva y que los dos módulos del volumen escriben por este camino.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { escribirAtomico } = require('../server/escrituraAtomica');

const dirNuevo = () => fs.mkdtempSync(path.join(os.tmpdir(), 'atomica-'));
const temporales = (dir) => fs.readdirSync(dir).filter((f) => f.endsWith('.tmp'));

test('escribe, reescribe entero y no deja temporales', () => {
  const dir = dirNuevo();
  const f = path.join(dir, 'usuarios.json');
  escribirAtomico(f, JSON.stringify({ v: 1, relleno: 'x'.repeat(5000) }));
  escribirAtomico(f, JSON.stringify({ v: 2 }));
  assert.deepStrictEqual(JSON.parse(fs.readFileSync(f, 'utf8')), { v: 2 }, 'el contenido nuevo, sin restos del anterior');
  assert.deepStrictEqual(temporales(dir), []);
});

test('crea el directorio si falta y conserva el permiso 0600', { skip: process.platform === 'win32' }, () => {
  const f = path.join(dirNuevo(), 'fuentes', 'fuentes-subidas.json');
  escribirAtomico(f, '{}', { mode: 0o600 });
  assert.strictEqual(fs.statSync(f).mode & 0o777, 0o600, 'el archivo guarda hashes: no puede ser legible por otros');
});

test('si la escritura falla, el destino conserva el contenido anterior y el temporal se borra', () => {
  const dir = dirNuevo();
  const f = path.join(dir, 'usuarios.json');
  escribirAtomico(f, '{"v":1}');
  // Un dato que writeFileSync rechaza hace fallar la escritura DESPUÉS de crear el temporal: es el
  // caso del proceso que muere a mitad. Con writeFileSync directo, el destino ya estaría truncado.
  assert.throws(() => escribirAtomico(f, { no: 'es un buffer' }));
  assert.strictEqual(fs.readFileSync(f, 'utf8'), '{"v":1}');
  assert.deepStrictEqual(temporales(dir), []);
});

test('si el renombrado falla (el destino es un directorio), no queda temporal', () => {
  const dir = dirNuevo();
  const f = path.join(dir, 'ocupado');
  fs.mkdirSync(f);
  fs.writeFileSync(path.join(f, 'dentro'), 'x');
  assert.throws(() => escribirAtomico(f, 'datos'));
  assert.deepStrictEqual(temporales(dir), []);
  assert.ok(fs.statSync(f).isDirectory(), 'el destino sigue como estaba');
});

test('usuarios.js y fuentesSubidas.js escriben el volumen por la vía atómica', () => {
  for (const archivo of ['server/usuarios.js', 'server/fuentesSubidas.js']) {
    const src = fs.readFileSync(path.join(__dirname, '..', archivo), 'utf8');
    assert.match(src, /require\('\.\/escrituraAtomica'\)/, `${archivo} no usa escribirAtomico`);
    assert.doesNotMatch(src, /fs\.writeFileSync\(/, `${archivo} vuelve a escribir sobre el archivo vivo`);
  }
});

test('fuentesSubidas: registrar deja manifiesto y documento sin temporales a la vista', () => {
  const dir = dirNuevo();
  const { execFileSync } = require('child_process');
  // Proceso aparte: el módulo lee AUTH_STATE_DIR al cargarse y otras pruebas ya lo cargaron.
  execFileSync(process.execPath, ['-e', `
    const s = require(${JSON.stringify(path.join(__dirname, '..', 'server', 'fuentesSubidas.js'))});
    s.registrar('huawei', { originalname: 'ficha.pdf', buffer: Buffer.from('%PDF-1.7 prueba'), tipo: 'pdf' });
    s.registrar('huawei', { originalname: 'ficha2.pdf', buffer: Buffer.from('%PDF-1.7 otra'), tipo: 'pdf' });
  `], { env: { ...process.env, AUTH_STATE_DIR: dir } });
  const fdir = path.join(dir, 'fuentes');
  assert.deepStrictEqual(temporales(fdir), []);
  const m = JSON.parse(fs.readFileSync(path.join(fdir, 'fuentes-subidas.json'), 'utf8'));
  assert.strictEqual(m.huawei.length, 2);
  for (const e of m.huawei) assert.ok(fs.existsSync(path.join(fdir, e.archivo)));
});
