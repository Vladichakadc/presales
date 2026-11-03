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

// El arranque de cada sesión enseña las tres últimas (2026-10-31, mejora aprobada al cerrar el PR #98):
// sin la cabecera de RELEVO.md, una sesión nueva no veía qué se entregó lo último. Como el listado de
// temas en curso, va antes de `npm install` y dentro de un `if` con tiempo límite: no corta el arranque.
test('session-start.sh enseña las tres últimas entregas sin poder cortar el arranque', () => {
  const hook = fs.readFileSync(path.join(__dirname, '..', '.claude/hooks/session-start.sh'), 'utf8');
  const i = hook.indexOf('node scripts/entregas.js');
  assert.ok(i > 0, 'session-start.sh no corre scripts/entregas.js');
  assert.ok(i < hook.indexOf('npm install --no-audit'), 'va antes de npm install: no necesita dependencias');
  const linea = hook.slice(hook.lastIndexOf('\n', i) + 1, hook.indexOf('\n', i));
  assert.match(linea, /^if ! timeout \d+ node scripts\/entregas\.js --n=3\b/, 'dentro de un if con timeout, las tres últimas');
});

// El resumen nombra siempre las entregas mal formadas, también las que no muestra (2026-11-01, mejora
// aprobada al cerrar el PR #101): el arranque enseña tres, y una rota más vieja hacía saltar el aviso
// sin decir cuál era.
test('una entrega rota fuera de las mostradas se nombra con su archivo y su motivo', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'entregas-'));
  for (const pr of [101, 102, 103]) {
    fs.writeFileSync(path.join(dir, `2026-10-31-pr-${pr}.md`), BUENA.replace('PR #98', `PR #${pr}`));
  }
  fs.writeFileSync(path.join(dir, '2026-10-30-pr-90.md'), '# 2026-10-30 · PR #90 · Rota\n');
  const L = leerEntregas(dir);
  const r = resumen(L, 3);
  assert.doesNotMatch(r, /2026-10-30 · PR #90 · Rota/, 'no se muestra entera: no está entre las tres');
  assert.match(r, /Mal formadas fuera de las mostradas \(1\):/);
  assert.match(r, /! 2026-10-30-pr-90\.md: falta «- \*\*Encargo:\*\* …»/);
  assert.doesNotMatch(resumen(L.slice(0, 3), 3), /Mal formadas/, 'sin rotas fuera, nada que decir');
  assert.doesNotMatch(resumen(L, 0), /Mal formadas fuera/, 'con --todas ya se ven todas: no se repite');
});
