'use strict';
// LA COMPROBACION DE GRAPHIFY AL ARRANCAR (`.claude/hooks/graphify-cli.sh`), conducida con un
// `graphify` falso delante en el PATH, como el `npm` falso de auditar-dependencias.test.js, y
// sobre un repositorio git temporal: el de verdad puede tener un `graphify-out/` de cualquier dia.
// La CLI: sin ella y con `uv`, instala la FIJADA (desde el 2026-10-15; si no, la skill se
// instalaria sola sin version); sin `uv`, o si la instalacion falla, dice el comando fijado y
// sigue (siempre con la extension `pdf`, que trae pypdf). Con otra version avisa y no la toca;
// con la revisada calla salvo para decirlo. El grafo: si la CLI responde, se le pregunta que
// archivos de los que lee cambiaron desde su manifiesto (desde el 2026-10-15); si no, si se hizo
// sobre otro commit que HEAD. Avisa con el comando para rehacerlo, y nunca lo construye.
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
function grafo(dir, commit, { manifiesto } = {}) {
  fs.mkdirSync(path.join(dir, 'graphify-out'), { recursive: true });
  if (manifiesto) fs.writeFileSync(path.join(dir, 'graphify-out', 'manifest.json'), '{}');
  const g = { nodes: [{ id: 'n', label: `"built_at_commit": "${'f'.repeat(40)}"` }], links: [] };
  if (commit) g.built_at_commit = commit;
  fs.writeFileSync(path.join(dir, 'graphify-out', 'graph.json'), JSON.stringify(g, null, 2));
}

// Un PATH con solo lo imprescindible para el script y, si se pide, un `graphify` que responde
// la version dada. Nada de la maquina: sin `uv` falso, el script no encuentra con que instalar.
// `uv` es el cuerpo de un `uv` falso: cada llamada deja sus argumentos en `uv.log`, junto a el.
// `python` es el cuerpo de la consulta a graphify: con el, la CLI falsa lleva de shebang un
// `python3` falso que responde `--version` y, llamado con `-I`, deja sus argumentos en `py.log`
// y hace lo que diga el cuerpo (lo que imprimiria `detect_incremental`).
function correr(version, dir, { uv, python } = {}) {
  const bin = fs.mkdtempSync(path.join(os.tmpdir(), 'graphify-bin-'));
  for (const util of ['awk', 'tr', 'cat', 'grep', 'tail', 'head', 'git']) {
    const real = cp.execSync(`command -v ${util}`, { shell: '/bin/bash' }).toString().trim();
    fs.symlinkSync(real, path.join(bin, util));
  }
  if (version && python) {
    fs.writeFileSync(path.join(bin, 'python3'),
      `#!/bin/bash\nif [ "$1" = "-I" ]; then echo "$@" >> "\${0%/*}/py.log"\n${python}\nexit\nfi\necho "graphify ${version}"\n`,
      { mode: 0o755 });
    fs.writeFileSync(path.join(bin, 'graphify'), `#!${path.join(bin, 'python3')}\n`, { mode: 0o755 });
  } else if (version) {
    fs.writeFileSync(path.join(bin, 'graphify'), `#!/bin/bash\necho "graphify ${version}"\n`, { mode: 0o755 });
  }
  if (uv) {
    fs.writeFileSync(path.join(bin, 'uv'), `#!/bin/bash\necho "$*" >> "\${0%/*}/uv.log"\n${uv}\n`, { mode: 0o755 });
  }
  const r = cp.spawnSync('/bin/bash', [SCRIPT, dir || repo().dir], { env: { PATH: bin }, encoding: 'utf8' });
  const leer = (f) => (fs.existsSync(path.join(bin, f)) ? fs.readFileSync(path.join(bin, f), 'utf8') : '');
  return { rc: r.status, out: r.stdout + r.stderr, uv: leer('uv.log'), py: leer('py.log') };
}

// Un `uv` que instala de verdad, en falso: deja junto a el un `graphify` con la version pedida.
// `chmod` va por su ruta: el PATH de la prueba no lo trae, y no tiene por que traerlo.
const CHMOD = cp.execSync('command -v chmod', { shell: '/bin/bash' }).toString().trim();
// eslint-disable-next-line no-template-curly-in-string -- es bash, no una plantilla de JS
const UV_INSTALA = 'v="${@: -1}"; v="${v##*==}"\n' +
  `printf '#!/bin/bash\\necho "graphify %s"\\n' "$v" > "\${0%/*}/graphify"; ${CHMOD} +x "\${0%/*}/graphify"`;

test('sin la CLI y sin uv, dice el comando con la versión revisada', () => {
  const r = correr(null);
  assert.strictEqual(r.rc, 0, 'avisa, no bloquea el arranque');
  assert.ok(r.out.includes(`uv tool install "graphifyy[pdf]==${FIJADA}"`), r.out);
  assert.match(r.out, /sin fijar/);
});

test('sin la CLI y con uv, instala exactamente la versión revisada, con su extensión pdf y sin --upgrade', () => {
  const r = correr(null, null, { uv: UV_INSTALA });
  assert.strictEqual(r.rc, 0);
  assert.strictEqual(r.uv, `tool install graphifyy[pdf]==${FIJADA}\n`, 'una sola llamada, fijada y con pypdf');
  assert.match(r.out, /instalando la version revisada/);
  assert.ok(r.out.includes(`graphify: ${FIJADA} (la version revisada`), r.out);
  assert.doesNotMatch(r.out, /no esta instalado\. Antes/);
});

test('si la instalación falla, no bloquea el arranque y deja el comando fijado', () => {
  const r = correr(null, null, { uv: 'echo "    error: proxy 403" >&2; exit 2' });
  assert.strictEqual(r.rc, 0, 'un PyPI cortado no tumba el arranque');
  assert.ok(r.out.includes(`uv tool install "graphifyy[pdf]==${FIJADA}"`), r.out);
  assert.doesNotMatch(r.out, /graphify: \d/, 'no da por instalado lo que no se instaló');
  assert.match(r.out, /no se pudo instalar graphify: error: proxy 403/, 'dice por qué, sin la sangría de uv');
});

test('con otra versión instalada no llama a uv: solo avisa', () => {
  const r = correr('0.0.1', null, { uv: UV_INSTALA });
  assert.strictEqual(r.uv, '', 'una versión que alguien puso no se pisa sola');
  assert.match(r.out, /AVISO: graphify 0\.0\.1 instalado/);
});

test('con otra versión, avisa y da el comando para volver a la revisada', () => {
  const r = correr('0.0.1');
  assert.strictEqual(r.rc, 0);
  assert.match(r.out, /AVISO: graphify 0\.0\.1 instalado/);
  assert.ok(r.out.includes(`--reinstall "graphifyy[pdf]==${FIJADA}"`), r.out);
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

// Lo que graphify lee, frente a su manifiesto: manda sobre el commit cuando la CLI responde.
test('si graphify dice que nada de lo que lee cambió, calla aunque el commit sea otro', () => {
  const { dir, primero } = repo();
  grafo(dir, primero, { manifiesto: true });
  const r = correr(FIJADA, dir, { python: 'echo 0' });
  assert.strictEqual(r.rc, 0);
  assert.doesNotMatch(r.out, /AVISO|graphify update/, 'el aviso en falso que no apagaba `graphify update .`');
  assert.match(r.py, /^-I -c /, 'consulta a la propia graphify, aislada');
  assert.ok(r.py.trim().endsWith(dir), 'la raíz va como argumento, no dentro del código');
});

test('si graphify ve archivos que lee y cambiaron, avisa con cuántos y cuáles', () => {
  const { dir, cabeza } = repo();
  grafo(dir, cabeza, { manifiesto: true });
  const r = correr(FIJADA, dir, { python: 'printf "5\\nserver/a.js\\nb.md\\nc.sh\\n"' });
  assert.strictEqual(r.rc, 0, 'avisa, no bloquea el arranque');
  assert.match(r.out, /no refleja 5 archivo\(s\) que lee y cambiaron \(server\/a\.js b\.md c\.sh\)/);
  assert.match(r.out, /graphify update \./);
  assert.doesNotMatch(r.out, /es del commit/, 'con la consulta no se compara el commit');
});

test('si la consulta falla o responde algo que no es un número, vuelve a comparar el commit', () => {
  for (const python of ['exit 1', 'echo "Traceback"']) {
    const { dir, primero, cabeza } = repo();
    grafo(dir, primero, { manifiesto: true });
    const r = correr(FIJADA, dir, { python });
    assert.ok(r.out.includes(`es del commit ${primero.slice(0, 7)} y HEAD es ${cabeza.slice(0, 7)}`), r.out);
  }
});

test('sin manifiesto, o con una CLI que no es un python, no consulta y compara el commit', () => {
  const { dir, primero } = repo();
  grafo(dir, primero);
  const sinManifiesto = correr(FIJADA, dir, { python: 'echo 0' });
  assert.strictEqual(sinManifiesto.py, '', 'sin manifiesto no hay con qué comparar');
  assert.match(sinManifiesto.out, /es del commit/);
  grafo(dir, primero, { manifiesto: true });
  assert.match(correr(FIJADA, dir).out, /es del commit/, 'un shebang de bash no es el interprete de graphify');
});

test('el arranque lo llama', () => {
  const arranque = fs.readFileSync(path.join(RAIZ, '.claude', 'hooks', 'session-start.sh'), 'utf8');
  assert.match(arranque, /^bash \.claude\/hooks\/graphify-cli\.sh \. \|\| true$/m);
});
