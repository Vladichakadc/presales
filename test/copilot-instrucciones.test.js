'use strict';
// Las copias para GitHub Copilot dicen lo mismo que sus skills (2026-10-02). Siete skills tienen
// copia en `.github/instructions/`, con un índice en `.github/copilot-instructions.md`, y la
// extensión que las generaba no corre aquí: el día que la auditoría de prompts cambió tres de esas
// skills, sus copias seguían diciendo lo anterior, entre otras cosas «AUTO-START on new agent
// session» de una automatización que aquí no existe. `scripts/copilot-instrucciones.js` las
// regenera; esta prueba frena la deriva.
const test = require('node:test');
const assert = require('node:assert');
const { revisar, descripcion, partir } = require('../scripts/copilot-instrucciones');

test('cada copia de Copilot y el índice coinciden con su skill', () => {
  const r = revisar();
  assert.ok(r.nombres.length >= 7, `se esperaban las siete copias y hay ${r.nombres.length}`);
  assert.deepStrictEqual(r.cambios.map((c) => c.nombre), [], 'regenera con: node scripts/copilot-instrucciones.js');
  assert.strictEqual(r.nuevoIndice, r.indice, '.github/copilot-instructions.md no coincide; regenera con: node scripts/copilot-instrucciones.js');
});

test('la descripción se lee igual en una línea, entre comillas o en bloque', () => {
  assert.strictEqual(descripcion('name: x\ndescription: Hace algo.', 'x'), 'Hace algo.');
  assert.strictEqual(descripcion('description: "Con \\"comillas\\" y — raya"', 'x'), 'Con "comillas" y — raya');
  assert.strictEqual(descripcion("description: 'Con ''simples'''", 'x'), "Con 'simples'");
  assert.strictEqual(descripcion('description: >\n  Una línea\n  y otra.\nmetadata:\n  a: 1', 'x'), 'Una línea y otra.');
  assert.throws(() => descripcion('name: x', 'x'), /no trae description/);
});

test('un archivo sin cabecera, o con saltos de Windows, se trata igual que el resto', () => {
  assert.deepStrictEqual(partir('---\r\nname: x\r\n---\r\ncuerpo\r\n', 'x'), { cabecera: 'name: x', cuerpo: 'cuerpo\n' });
  assert.throws(() => partir('sin cabecera', 'x'), /no empieza por una cabecera/);
});
