'use strict';
// `node_modules` NO SE VERSIONA, NI COMO ENLACE (2026-11-12, PR #194). El PR #191 dejó en main un enlace
// simbólico `node_modules -> /home/user/presales/node_modules`: `.gitignore` decía `node_modules/`, y con la
// barra final git solo ignora un directorio, no un enlace. Con él en la base, `npm run visibles` fallaba en
// cada PR (EEXIST al enlazar las dependencias en el worktree) y cambiar a main borraba las dependencias
// instaladas de quien lo hiciera.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const RAIZ = path.join(__dirname, '..');

test('node_modules no está en el índice de git, y .gitignore lo ignora también como enlace', () => {
  const lineas = fs.readFileSync(path.join(RAIZ, '.gitignore'), 'utf8').split('\n').map((l) => l.trim());
  assert.ok(lineas.includes('node_modules'), '.gitignore lleva «node_modules» sin barra final (con ella no ignora un enlace)');
  let versionado = '';
  try { versionado = execFileSync('git', ['ls-files', '--', 'node_modules'], { cwd: RAIZ, encoding: 'utf8' }); } catch { return; /* sin git (un tarball): no hay índice que mirar */ }
  assert.strictEqual(versionado.trim().split('\n').filter(Boolean).length, 0, 'node_modules está versionado');
});
