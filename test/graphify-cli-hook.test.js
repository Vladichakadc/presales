'use strict';
// LA COMPROBACION DE LA CLI DE GRAPHIFY AL ARRANCAR (`.claude/hooks/graphify-cli.sh`), conducida
// con un `graphify` falso delante en el PATH, como el `npm` falso de auditar-dependencias.test.js.
// Tres casos: sin CLI dice el comando FIJADO (si no, la skill se instala sola sin version), con
// otra version avisa y con la revisada calla salvo para decirlo. Y nunca instala nada.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const cp = require('child_process');

const RAIZ = path.join(__dirname, '..');
const SCRIPT = path.join(RAIZ, '.claude', 'hooks', 'graphify-cli.sh');
const FIJADA = fs.readFileSync(path.join(RAIZ, '.claude', 'skills', 'graphify', '.graphify_version'), 'utf8').trim();

// Un PATH con solo lo imprescindible para el script y, si se pide, un `graphify` que responde
// la version dada. Nada de la maquina: si el script intentara instalar, no encontraria `uv`.
function correr(version) {
  const bin = fs.mkdtempSync(path.join(os.tmpdir(), 'graphify-bin-'));
  for (const util of ['awk', 'tr', 'cat']) {
    const real = cp.execSync(`command -v ${util}`, { shell: '/bin/bash' }).toString().trim();
    fs.symlinkSync(real, path.join(bin, util));
  }
  if (version) {
    fs.writeFileSync(path.join(bin, 'graphify'), `#!/bin/bash\necho "graphify ${version}"\n`, { mode: 0o755 });
  }
  const r = cp.spawnSync('/bin/bash', [SCRIPT, RAIZ], { env: { PATH: bin }, encoding: 'utf8' });
  return { rc: r.status, out: r.stdout + r.stderr };
}

test('sin la CLI, dice el comando con la versión revisada y no instala nada', () => {
  const r = correr(null);
  assert.strictEqual(r.rc, 0, 'avisa, no bloquea el arranque');
  assert.ok(r.out.includes(`uv tool install "graphifyy==${FIJADA}"`), r.out);
  assert.match(r.out, /sin fijar/);
});

test('con otra versión, avisa y da el comando para volver a la revisada', () => {
  const r = correr('0.0.1');
  assert.strictEqual(r.rc, 0);
  assert.match(r.out, /AVISO: graphify 0\.0\.1 instalado/);
  assert.ok(r.out.includes(`--reinstall "graphifyy==${FIJADA}"`), r.out);
});

test('con la versión revisada, solo lo dice', () => {
  const r = correr(FIJADA);
  assert.strictEqual(r.rc, 0);
  assert.ok(r.out.includes(`graphify: ${FIJADA} (la version revisada`), r.out);
  assert.doesNotMatch(r.out, /AVISO|uv tool/);
});

test('el arranque lo llama', () => {
  const arranque = fs.readFileSync(path.join(RAIZ, '.claude', 'hooks', 'session-start.sh'), 'utf8');
  assert.match(arranque, /^bash \.claude\/hooks\/graphify-cli\.sh \. \|\| true$/m);
});
