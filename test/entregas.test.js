'use strict';
// scripts/entregas.js lee docs/entregas/ (2026-10-31, mejora aprobada por el dueño al cerrar el PR #92).
// Lo que importa es que una entrega mal formada lo diga con su motivo, nunca que se rellene: un nombre
// que no casa con la cabecera, un encargo que falta o una sección vacía.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { leerEntrega, leerEntregas, resumen } = require('../scripts/entregas');

const BUENA = `# 2026-10-31 · PR #98 · Algo que cambió

- **Encargo:** «Ejecuta la mejora propuesta»

## Cerrado

Lo hecho.

## Estado

Lo que queda. **Criterio que conviene conservar**: una regla.
`;

test('una entrega bien formada se lee entera y sin problemas', () => {
  const e = leerEntrega('2026-10-31-pr-98.md', BUENA);
  assert.deepStrictEqual(e.problemas, []);
  assert.strictEqual(e.pr, 98);
  assert.strictEqual(e.fecha, '2026-10-31');
  assert.strictEqual(e.titulo, 'Algo que cambió');
  assert.strictEqual(e.encargo, '«Ejecuta la mejora propuesta»');
  assert.strictEqual(e.cerrado, 'Lo hecho.');
  assert.match(e.estado, /Criterio que conviene conservar/);
});

test('cada defecto se dice por su nombre', () => {
  const nombre = leerEntrega('2026-10-31-pr-99.md', BUENA);
  assert.ok(nombre.problemas.some((p) => /el nombre dice 2026-10-31 · PR #99 y la cabecera 2026-10-31 · PR #98/.test(p)));
  assert.ok(leerEntrega('entrega.md', BUENA).problemas.some((p) => /AAAA-MM-DD-pr-N\.md/.test(p)));
  assert.ok(leerEntrega('2026-10-31-pr-98.md', BUENA.replace(/^- \*\*Encargo:.*\n/m, '')).problemas.some((p) => /Encargo/.test(p)));
  assert.ok(leerEntrega('2026-10-31-pr-98.md', BUENA.replace('Lo hecho.', '')).problemas.some((p) => /«## Cerrado»/.test(p)));
  assert.ok(leerEntrega('2026-10-31-pr-98.md', BUENA.replace('## Estado', '## Otra')).problemas.some((p) => /«## Estado»/.test(p)));
  assert.ok(leerEntrega('2026-10-31-pr-98.md', BUENA.replace(' · PR #98 ·', ' ·')).problemas.some((p) => /primera línea/.test(p)));
});

test('la carpeta se ordena por fecha y PR, sin la plantilla ni el README, y el resumen las cuenta', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'entregas-'));
  fs.writeFileSync(path.join(dir, '2026-10-31-pr-98.md'), BUENA);
  fs.writeFileSync(path.join(dir, '2026-10-30-pr-120.md'), BUENA.replace('2026-10-31 · PR #98', '2026-10-30 · PR #120'));
  fs.writeFileSync(path.join(dir, '2026-10-31-pr-100.md'), BUENA.replace('PR #98', 'PR #100'));
  fs.writeFileSync(path.join(dir, 'PLANTILLA.md'), '# AAAA-MM-DD · PR #N · <título>');
  fs.writeFileSync(path.join(dir, 'README.md'), '# Entregas');
  const L = leerEntregas(dir);
  assert.deepStrictEqual(L.map((e) => e.pr), [100, 98, 120]);
  const r = resumen(L, 2);
  assert.match(r, /Entregas registradas en docs\/entregas\/: 3 \(se muestran las 2 más recientes\)/);
  assert.match(r, /2026-10-31 · PR #100 · Algo que cambió/);
  assert.doesNotMatch(r, /PR #120/);
});
