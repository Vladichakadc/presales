'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { clasificar, resumen } = require('../scripts/limpiar-ramas.js');

test('solo se borra una rama claude/* que main contiene entera y sin PR abierto', () => {
  const r = clasificar([
    { nombre: 'claude/fusionada', porDelante: 0 },
    { nombre: 'claude/con-obra', porDelante: 2 },
    { nombre: 'claude/en-revision', porDelante: 0 },
    { nombre: 'claude/sin-comparar', porDelante: null },
    { nombre: 'main', porDelante: 0 },
    { nombre: 'fuente/algo', porDelante: 0 },
    { nombre: 'vigia/fuentes', porDelante: 0 },
  ], ['claude/en-revision']);
  assert.deepStrictEqual(r.borrar, ['claude/fusionada']);
  assert.deepStrictEqual(r.quedan.map((q) => q.nombre), ['claude/con-obra', 'claude/en-revision', 'claude/sin-comparar']);
  assert.match(resumen(r, false), /Se borrarían \(1\)/);
});

test('mutación de control: una rama con un solo commit propio no se borra', () => {
  assert.deepStrictEqual(clasificar([{ nombre: 'claude/x', porDelante: 1 }], []).borrar, []);
  assert.deepStrictEqual(clasificar([{ nombre: 'claude/x', porDelante: 0 }], []).borrar, ['claude/x']);
});

test('el workflow solo borra con aplicar, a mano, y solo con lo que decide el módulo', () => {
  const yml = fs.readFileSync(path.join(__dirname, '..', '.github', 'workflows', 'limpiar-ramas.yml'), 'utf8');
  assert.match(yml, /^on:\n  workflow_dispatch:/m, 'solo se lanza a mano');
  assert.doesNotMatch(yml, /schedule:|push:|pull_request/, 'nunca se dispara solo');
  assert.match(yml, /aplicar:[\s\S]*default: false/, 'por defecto solo lista');
  assert.match(yml, /clasificar\(/);
  assert.match(yml, /if \(aplicar\)/, 'borra solo con aplicar');
  assert.ok(yml.endsWith('\n') && !yml.endsWith('\n\n'));
});
