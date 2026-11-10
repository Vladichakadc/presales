'use strict';
// CONTRATO COMÚN DE MOTOR (2026-11-10, auditoría de los dimensionadores, fase 2). Cada motor declara
// `VERSION_MOTOR`, su página la pasa a la hoja «Supuestos» y `scripts/motores.lock.json` guarda la
// huella de sus archivos: un cambio sin subir la versión se frena aquí.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const L = require('../scripts/motores-lock.js');

const RAIZ = path.join(__dirname, '..');
const leer = (r) => fs.readFileSync(path.join(RAIZ, r), 'utf8');

test('los seis motores casan con su lock: ninguno cambió sin subir su versión', () => {
  const lista = L.problemas(L.estadoActual(), L.leerLock());
  assert.deepStrictEqual(lista, [], `\n${lista.join('\n')}`);
});

test('cada motor exporta la misma VERSION_MOTOR que declara su texto', () => {
  for (const m of L.MOTORES) {
    const api = require(path.join(RAIZ, m.declara));
    assert.match(String(api.VERSION_MOTOR), /^\d+\.\d+\.\d+$/, m.id);
    assert.strictEqual(api.VERSION_MOTOR, L.versionDe(leer(m.declara)), m.id);
  }
});

test('cada página pasa la versión de su motor a la hoja «Supuestos»', () => {
  for (const m of L.MOTORES) {
    const texto = leer(m.pagina);
    const re = new RegExp(`BOM\\.fijarCatalogo\\([^;]*window\\.${m.global}\\.VERSION_MOTOR`);
    assert.match(texto, re, `${m.pagina} no pasa la versión de ${m.global}`);
  }
});

test('un cambio con la misma versión se frena; con la versión subida pide renovar el lock; bajar no vale', () => {
  const lock = { x: { version: '1.0.0', huella: 'sha256:a' } };
  assert.match(L.problemas({ x: { version: '1.0.0', huella: 'sha256:b' } }, lock)[0], /cambió y sigue en la versión 1\.0\.0/);
  assert.match(L.problemas({ x: { version: '1.0.1', huella: 'sha256:b' } }, lock)[0], /renueva el lock/);
  assert.match(L.problemas({ x: { version: '0.9.0', huella: 'sha256:b' } }, lock)[0], /la versión baja/);
  assert.deepStrictEqual(L.problemas({ x: { version: '1.0.0', huella: 'sha256:a' } }, lock), []);
  assert.match(L.problemas({ x: { version: null, huella: 'sha256:a' } }, lock)[0], /no declara VERSION_MOTOR/);
  assert.match(L.problemas({}, lock)[0], /ya no es un motor/);
});

test('la huella cubre todos los archivos del motor y no depende del fin de línea', () => {
  const textos = { 'a.js': 'uno\n', 'b.js': 'dos\n' };
  const h = L.huella(['a.js', 'b.js'], (r) => textos[r]);
  assert.notStrictEqual(L.huella(['a.js', 'b.js'], (r) => (r === 'b.js' ? 'dos!\n' : textos[r])), h, 'un cambio en el segundo archivo cambia la huella');
  assert.strictEqual(L.huella(['a.js', 'b.js'], (r) => textos[r].replace(/\n/g, '\r\n')), h);
  // Aruba decide con dos archivos y Fortinet también: los dos van en su huella.
  assert.deepStrictEqual(L.MOTORES.find((m) => m.id === 'aruba').archivos, ['public/js/aruba-reglas.js', 'public/js/motor-ingenieria.js']);
  assert.deepStrictEqual(L.MOTORES.find((m) => m.id === 'fortinet').archivos, ['public/js/fortinet-motor.js', 'public/js/fortinet-reglas.js']);
});
