'use strict';
// LA COMPROBACION DE GRAPHIFY AL ARRANCAR (`.claude/hooks/graphify-cli.sh`), conducida con un
// `graphify` falso delante en el PATH, como el `npm` falso de auditar-dependencias.test.js, y
// sobre un repositorio git temporal: el de verdad puede tener un `graphify-out/` de cualquier dia.
// La CLI: sin ella dice el comando FIJADO (si no, la skill se instala sola sin version), con otra
// version avisa y con la revisada calla salvo para decirlo. El grafo: si se hizo sobre otro commit
// que HEAD, avisa con el comando para rehacerlo. Y nunca instala ni construye nada.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const cp = require('child_process');

const RAIZ = path.join(__dirname, '..');
const SCRIPT = path.join(RAIZ, '.claude', 'hooks', 'graphify-cli.sh');
const FIJADA = fs.readFileSync(path.join(RAIZ, '.claude', 'skills', 'graphify', '.graphify_version'), 'utf8').trim();

const git = (dir, ...args) => cp.execFileSync('git', ['-C', dir, ...args], {
  encoding: 'utf8',
  env: { ...process.env, GIT_AUTHOR_NAME: 'p', GIT_AUTHOR_EMAIL: 'p@p', GIT_COMMITTER_NAME: 'p', GIT_COMMITTER_EMAIL: 'p@p' },
}).trim();

// Un repositorio con la skill instalada y dos commits; devuelve los dos.
function repo() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'graphify-repo-'));
  fs.mkdirSync(path.join(dir, '.claude', 'skills', 'graphify'), { recursive: true });
  fs.writeFileSync(path.join(dir, '.claude', 'skills', 'graphify', '.graphify_version'), `${FIJADA}\n`);
  git(dir, 'init', '-q');
  git(dir, 'add', '.');
  git(dir, 'commit', '-qm', 'uno');
  const primero = git(dir, 'rev-parse', 'HEAD');
  fs.writeFileSync(path.join(dir, 'a.js'), 'module.exports = 1;\n');
  git(dir, 'add', '.');
  git(dir, 'commit', '-qm', 'dos');
  return { dir, primero, cabeza: git(dir, 'rev-parse', 'HEAD') };
}

// Un graph.json como el que escribe graphify: la clave de primer nivel al final, y un nodo cuyo
// texto lleva la misma clave con otro commit (escapada, como la serializa JSON), que no debe contar.
function grafo(dir, commit) {
  fs.mkdirSync(path.join(dir, 'graphify-out'), { recursive: true });
  const g = { nodes: [{ id: 'n', label: `"built_at_commit": "${'f'.repeat(40)}"` }], links: [] };
  if (commit) g.built_at_commit = commit;
  fs.writeFileSync(path.join(dir, 'graphify-out', 'graph.json'), JSON.stringify(g, null, 2));
}

// Un PATH con solo lo imprescindible para el script y, si se pide, un `graphify` que responde
// la version dada. Nada de la maquina: si el script intentara instalar, no encontraria `uv`.
function correr(version, dir) {
  const bin = fs.mkdtempSync(path.join(os.tmpdir(), 'graphify-bin-'));
  for (const util of ['awk', 'tr', 'cat', 'grep', 'tail', 'git']) {
    const real = cp.execSync(`command -v ${util}`, { shell: '/bin/bash' }).toString().trim();
    fs.symlinkSync(real, path.join(bin, util));
  }
  if (version) {
    fs.writeFileSync(path.join(bin, 'graphify'), `#!/bin/bash\necho "graphify ${version}"\n`, { mode: 0o755 });
  }
  const r = cp.spawnSync('/bin/bash', [SCRIPT, dir || repo().dir], { env: { PATH: bin }, encoding: 'utf8' });
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

test('con la versión revisada y sin grafo, solo lo dice', () => {
  const r = correr(FIJADA);
  assert.strictEqual(r.rc, 0);
  assert.ok(r.out.includes(`graphify: ${FIJADA} (la version revisada`), r.out);
  assert.doesNotMatch(r.out, /AVISO|uv tool|graphify update/);
});

test('un grafo hecho sobre otro commit avisa, con cuántos archivos cambiaron y el comando', () => {
  const { dir, primero, cabeza } = repo();
  grafo(dir, primero);
  const r = correr(FIJADA, dir);
  assert.strictEqual(r.rc, 0, 'avisa, no bloquea el arranque');
  assert.ok(r.out.includes(`es del commit ${primero.slice(0, 7)} y HEAD es ${cabeza.slice(0, 7)}`), r.out);
  assert.match(r.out, /1 archivo\(s\) cambiaron/);
  assert.match(r.out, /graphify update \./);
  assert.ok(!fs.existsSync(path.join(dir, 'graphify-out', 'GRAPH_REPORT.md')), 'no construye nada');
});

test('un grafo de un commit que el clon no tiene también avisa', () => {
  const { dir } = repo();
  grafo(dir, 'a'.repeat(40));
  const r = correr(FIJADA, dir);
  assert.match(r.out, /de un commit que este clon no tiene \(aaaaaaa\)/);
  assert.match(r.out, /graphify update \./);
});

test('un grafo del commit actual, o sin commit registrado, calla', () => {
  const { dir, cabeza } = repo();
  grafo(dir, cabeza);
  assert.doesNotMatch(correr(FIJADA, dir).out, /AVISO|graphify update/);
  grafo(dir, null);
  assert.doesNotMatch(correr(FIJADA, dir).out, /AVISO|graphify update/,
    'sin built_at_commit no hay con qué comparar, y la cadena dentro de un nodo no cuenta');
  // Un commit que no cambia ningún archivo (vacío, o un merge sin diferencias) no deja viejo el grafo.
  git(dir, 'commit', '-q', '--allow-empty', '-m', 'vacío');
  grafo(dir, cabeza);
  assert.doesNotMatch(correr(FIJADA, dir).out, /AVISO|graphify update/);
});

test('el arranque lo llama', () => {
  const arranque = fs.readFileSync(path.join(RAIZ, '.claude', 'hooks', 'session-start.sh'), 'utf8');
  assert.match(arranque, /^bash \.claude\/hooks\/graphify-cli\.sh \. \|\| true$/m);
});
