'use strict';
// Las acciones de GitHub van fijadas por commit, no por etiqueta (2026-10-02). Desde que el lock
// solo descarga del registro oficial de npm (test/lock-origen.test.js), las acciones eran el único
// código que entraba en CI por una referencia que puede cambiar: una etiqueta como `v5` es un
// puntero que su dueño puede mover a otro commit, y así se comprometió `tj-actions/changed-files`
// en 2025. Nueve workflows de este repositorio tienen permiso de escritura, y en ellos corren
// estas acciones junto al token.
//
// Cuatro reglas:
//   1. Cada `uses:` es `dueño/acción@<commit de 40 hexadecimales> # vX.Y.Z`. El comentario dice
//      qué versión es ese commit, y es lo que lee Dependabot para proponer la siguiente.
//   2. Una misma acción va en el mismo commit y la misma versión en todos los workflows: se
//      validan juntas y se mueven juntas.
//   3. Solo acciones oficiales de GitHub (`actions/`). Una de terceros se decide y se declara
//      aquí, no entra sola.
//   4. Dependabot vigila `github-actions`: una referencia fijada que nadie actualiza se pudre.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..');
const DIR = path.join(RAIZ, '.github', 'workflows');
const DUENOS = new Set(['actions']);
const FORMA = /^(?<accion>[a-z0-9-]+\/[a-z0-9._-]+)@(?<sha>[0-9a-f]{40}) # (?<version>v\d+\.\d+\.\d+)$/;

// Cada `uses:` de cada workflow, sin los comentarios de línea completa.
const usos = [];
for (const yml of fs.readdirSync(DIR).filter((f) => f.endsWith('.yml'))) {
  fs.readFileSync(path.join(DIR, yml), 'utf8').split('\n').forEach((linea, i) => {
    const m = linea.match(/^\s*(?:- )?uses:\s*(.+?)\s*$/);
    if (m && !/^\s*#/.test(linea)) usos.push({ donde: `${yml}:${i + 1}`, valor: m[1] });
  });
}

test('cada acción va fijada por commit, con su versión en el comentario', () => {
  assert.ok(usos.length >= 40, `se esperaban las ~47 referencias de los workflows y hay ${usos.length}`);
  for (const { donde, valor } of usos) {
    assert.match(valor, FORMA, `${donde}: «${valor}» no va fijada por commit con su versión (\`acción@<sha> # vX.Y.Z\`)`);
  }
});

test('una misma acción va en el mismo commit y la misma versión en todos los workflows', () => {
  const porAccion = new Map();
  for (const { donde, valor } of usos) {
    const m = valor.match(FORMA);
    if (!m) continue;
    const { accion, sha, version } = m.groups;
    if (!porAccion.has(accion)) porAccion.set(accion, new Map());
    const vistas = porAccion.get(accion);
    const clave = `${sha} # ${version}`;
    vistas.set(clave, [...(vistas.get(clave) || []), donde]);
  }
  for (const [accion, vistas] of porAccion) {
    assert.strictEqual(vistas.size, 1, `${accion} va en ${vistas.size} versiones: ${[...vistas].map(([k, d]) => `${k} (${d.join(', ')})`).join(' | ')}`);
  }
});

test('solo acciones oficiales de GitHub, y ninguna local que se cuele sin declarar', () => {
  for (const { donde, valor } of usos) {
    const dueno = valor.split('/')[0];
    assert.ok(DUENOS.has(dueno), `${donde}: «${dueno}» no es un dueño de acciones declarado; decide si entra y añádelo a DUENOS con su motivo`);
  }
});

test('Dependabot vigila las acciones, para que lo fijado no se quede viejo', () => {
  const cfg = fs.readFileSync(path.join(RAIZ, '.github', 'dependabot.yml'), 'utf8');
  assert.match(cfg, /package-ecosystem: github-actions\n\s+directory: \/\n\s+schedule:\n\s+interval: (?:daily|weekly|monthly)/);
});
