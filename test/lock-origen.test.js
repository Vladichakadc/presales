'use strict';
// De dónde salen los paquetes que se instalan en producción (2026-10-02). Railway instala con
// `npm ci` desde ese día, así que lo que corre en producción es exactamente lo que dice
// `package-lock.json`: cada entrada trae la URL de la que se descarga (`resolved`) y la huella del
// archivo (`integrity`).
//
// El 16 de septiembre el lock traía cuatro paquetes resueltos contra `npm.mirrors.msh.team`, el
// espejo del entorno donde se añadieron. Railway no lo alcanzaba: ocho despliegues seguidos
// fallaron y producción pasó unas 13 horas sin cambios. Se corrigió a mano y no quedó ninguna
// prueba. Y el caso peor es el que no falla: con un espejo alcanzable el despliegue sale bien, y
// la huella no protege nada, porque es la del archivo que sirvió el espejo.
//
// Por eso cada entrada tiene que descargarse del registro oficial, del archivo de SU nombre y SU
// versión: una entrada `express` que apunta al archivo de otro paquete es la forma conocida de
// colar una dependencia en un lock («lockfile injection»). Un alias (`"xlsx": "npm:@e965/xlsx"`)
// declara su paquete real en `name`, y se comprueba contra ese. La huella tiene que ser sha512.
// Medido ese día: las 366 entradas cumplen la forma exacta.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..');
const REGISTRO = 'https://registry.npmjs.org/';
const SHA512 = /^sha512-[A-Za-z0-9+/]{86}==$/;
// Un nombre de paquete de npm, con ámbito o sin él.
const NOMBRE = /^(?:@[a-z0-9][a-z0-9._~-]*\/)?[a-z0-9][a-z0-9._~-]*$/;
const VERSION = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;

// La URL de la que tiene que descargarse una entrada, o el motivo por el que no se puede saber.
function tarballEsperado(clave, entrada) {
  const nombre = entrada.name || clave.slice(clave.lastIndexOf('node_modules/') + 'node_modules/'.length);
  if (!NOMBRE.test(nombre)) return { motivo: `«${nombre}» no es un nombre de paquete de npm` };
  if (!VERSION.test(String(entrada.version))) return { motivo: `«${entrada.version}» no es una versión` };
  return { url: `${REGISTRO}${nombre}/-/${nombre.split('/').pop()}-${entrada.version}.tgz` };
}

// Lo que no cumple, entrada por entrada. Un lock que no se puede leer tampoco cumple.
function problemasDelLock(lock) {
  if (!lock || typeof lock !== 'object' || ![2, 3].includes(lock.lockfileVersion) || !lock.packages || typeof lock.packages !== 'object') {
    return ['el lock no es de la versión 2 o 3 de npm, y sin su sección `packages` no se puede comprobar'];
  }
  const problemas = [];
  for (const [clave, e] of Object.entries(lock.packages)) {
    if (clave === '') continue;
    if (!/^(?:node_modules\/(?:@[^/]+\/)?[^/]+\/)*node_modules\/(?:@[^/]+\/)?[^/]+$/.test(clave)) {
      problemas.push(`${clave}: no está bajo node_modules (un enlace o un workspace no se descargan del registro: decide y amplía esta regla)`);
      continue;
    }
    if (e.link) { problemas.push(`${clave}: es un enlace local, no una descarga del registro`); continue; }
    // Lo que va dentro del archivo de otro paquete no se descarga: lo cubre la huella del padre.
    if (e.inBundle && e.resolved === undefined) continue;
    const { url, motivo } = tarballEsperado(clave, e);
    if (motivo) { problemas.push(`${clave}: ${motivo}`); continue; }
    if (e.resolved !== url) problemas.push(`${clave}: se descarga de «${e.resolved}» y tiene que ser «${url}»`);
    if (!SHA512.test(String(e.integrity))) problemas.push(`${clave}: la huella «${e.integrity}» no es sha512`);
  }
  return problemas;
}

// Un lock sintético con la forma del de verdad: una entrada normal, una con ámbito, una anidada y
// un alias.
function lockDePrueba(cambios = {}) {
  const h = (c) => `sha512-${c.repeat(86)}==`;
  const packages = {
    '': { name: 'presales', version: '1.0.0' },
    'node_modules/express': { version: '5.1.0', resolved: `${REGISTRO}express/-/express-5.1.0.tgz`, integrity: h('a') },
    'node_modules/@anthropic-ai/sdk': { version: '0.60.0', resolved: `${REGISTRO}@anthropic-ai/sdk/-/sdk-0.60.0.tgz`, integrity: h('b') },
    'node_modules/a/node_modules/debug': { version: '3.2.7', resolved: `${REGISTRO}debug/-/debug-3.2.7.tgz`, integrity: h('c') },
    'node_modules/xlsx': { name: '@e965/xlsx', version: '0.20.3', resolved: `${REGISTRO}@e965/xlsx/-/xlsx-0.20.3.tgz`, integrity: h('d') },
    ...cambios,
  };
  return { name: 'presales', version: '1.0.0', lockfileVersion: 3, requires: true, packages };
}

test('el lock del repositorio solo descarga del registro oficial, el archivo de cada paquete, con huella sha512', () => {
  const lock = JSON.parse(fs.readFileSync(path.join(RAIZ, 'package-lock.json'), 'utf8'));
  assert.deepStrictEqual(problemasDelLock(lock), []);
  // Que no pase en vacío: el lock trae cientos de entradas, y todas se miraron.
  assert.ok(Object.keys(lock.packages).length > 300, 'el lock trae menos entradas de las esperadas');
});

test('un lock sintético con la forma del real pasa', () => {
  assert.deepStrictEqual(problemasDelLock(lockDePrueba()), []);
});

test('un espejo, http, git, un archivo local o una URL con algo detrás no pasan', () => {
  for (const resolved of [
    'https://npm.mirrors.msh.team/express/-/express-5.1.0.tgz',
    'http://registry.npmjs.org/express/-/express-5.1.0.tgz',
    'https://registry.npmjs.org.evil.example/express/-/express-5.1.0.tgz',
    'git+ssh://git@github.com/expressjs/express.git#abc123',
    'file:../express-5.1.0.tgz',
    `${REGISTRO}express/-/express-5.1.0.tgz?x=1`,
    undefined,
  ]) {
    const e = { version: '5.1.0', resolved, integrity: `sha512-${'a'.repeat(86)}==` };
    const p = problemasDelLock(lockDePrueba({ 'node_modules/express': e }));
    assert.strictEqual(p.length, 1, `${resolved} -> ${p}`);
    assert.match(p[0], /^node_modules\/express: se descarga de/);
  }
});

test('una entrada que apunta al archivo de otro paquete o de otra versión no pasa', () => {
  const h = `sha512-${'a'.repeat(86)}==`;
  for (const [clave, e] of [
    ['node_modules/express', { version: '5.1.0', resolved: `${REGISTRO}evil-express/-/evil-express-5.1.0.tgz`, integrity: h }],
    ['node_modules/express', { version: '5.1.0', resolved: `${REGISTRO}express/-/express-4.0.0.tgz`, integrity: h }],
    // Un alias tiene que bajar el paquete que declara, no el del nombre de la carpeta ni otro.
    ['node_modules/xlsx', { name: '@e965/xlsx', version: '0.20.3', resolved: `${REGISTRO}xlsx/-/xlsx-0.20.3.tgz`, integrity: h }],
    ['node_modules/xlsx', { name: '@evil/xlsx', version: '0.20.3', resolved: `${REGISTRO}@e965/xlsx/-/xlsx-0.20.3.tgz`, integrity: h }],
  ]) {
    assert.strictEqual(problemasDelLock(lockDePrueba({ [clave]: e })).length, 1, JSON.stringify(e));
  }
});

test('una huella que falta o no es sha512 no pasa', () => {
  for (const integrity of [undefined, '', `sha1-${'a'.repeat(27)}=`, `sha256-${'a'.repeat(43)}=`, `sha512-${'a'.repeat(86)}== sha1-${'a'.repeat(27)}=`]) {
    const e = { version: '5.1.0', resolved: `${REGISTRO}express/-/express-5.1.0.tgz`, integrity };
    const p = problemasDelLock(lockDePrueba({ 'node_modules/express': e }));
    assert.deepStrictEqual(p.map((x) => /no es sha512/.test(x)), [true], `${integrity} -> ${p}`);
  }
});

test('enlaces, workspaces, nombres o versiones raros y un lock ilegible no pasan; lo empaquetado dentro de otro sí', () => {
  const h = `sha512-${'a'.repeat(86)}==`;
  assert.strictEqual(problemasDelLock(lockDePrueba({ 'node_modules/local': { link: true, resolved: 'packages/local' } })).length, 1);
  assert.strictEqual(problemasDelLock(lockDePrueba({ 'packages/local': { version: '1.0.0' } })).length, 1);
  assert.strictEqual(problemasDelLock(lockDePrueba({ 'node_modules/express': { version: 'latest', resolved: `${REGISTRO}express/-/express-latest.tgz`, integrity: h } })).length, 1);
  assert.strictEqual(problemasDelLock(lockDePrueba({ 'node_modules/../evil': { version: '1.0.0', resolved: `${REGISTRO}evil/-/evil-1.0.0.tgz`, integrity: h } })).length, 1);
  for (const malo of [null, {}, { lockfileVersion: 1, dependencies: {} }, { lockfileVersion: 3 }]) {
    assert.strictEqual(problemasDelLock(malo).length, 1, JSON.stringify(malo));
  }
  // Un paquete empaquetado dentro del archivo de su padre no se descarga: lo cubre la huella del padre.
  assert.deepStrictEqual(problemasDelLock(lockDePrueba({ 'node_modules/express/node_modules/x': { version: '1.0.0', inBundle: true } })), []);
});

test('ningún .npmrc del repositorio cambia el registro', () => {
  // Con otro `registry`, npm cambia el anfitrión de registry.npmjs.org por el configurado al
  // instalar, aunque el lock esté limpio. Hoy no hay .npmrc; si aparece, no puede tocar el registro.
  const npmrc = path.join(RAIZ, '.npmrc');
  if (!fs.existsSync(npmrc)) return;
  const lineas = fs.readFileSync(npmrc, 'utf8').split('\n').map((l) => l.trim()).filter((l) => l && !/^[#;]/.test(l));
  assert.deepStrictEqual(lineas.filter((l) => /^(?:@[^:]+:)?registry\s*=|^replace-registry-host\s*=/.test(l)), []);
});
