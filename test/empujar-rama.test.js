'use strict';
// `scripts/empujar-rama.js` contra un remoto git de verdad (un repositorio desnudo en una
// carpeta temporal). Es la prueba que no existía cuando la vigía pasó tres semanas sin avisar:
// el push que se rechazaba («stale info») solo se ve con una rama remota que ya existe y un
// checkout que no la trae, y eso no se puede fingir con dobles.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');
const E = require('../scripts/empujar-rama.js');

const PERSONA = ['-c', 'user.name=Una Persona', '-c', 'user.email=persona@example.com'];
const git = (cwd, ...args) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();

// Un remoto con `main` y un clon superficial de `main`, como el que deja actions/checkout.
function montar() {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'empujar-rama-'));
  const remoto = path.join(base, 'remoto.git');
  const semilla = path.join(base, 'semilla');
  git(base, 'init', '-q', '--bare', '-b', 'main', remoto);
  git(base, 'init', '-q', '-b', 'main', semilla);
  fs.mkdirSync(path.join(semilla, 'datos'));
  fs.writeFileSync(path.join(semilla, 'datos', 'lock.json'), '{"v":1}\n');
  fs.writeFileSync(path.join(semilla, 'otro.txt'), 'x\n');
  git(semilla, 'add', '.');
  git(semilla, ...PERSONA, 'commit', '-q', '-m', 'inicio');
  git(semilla, 'remote', 'add', 'origin', remoto);
  git(semilla, 'push', '-q', 'origin', 'main');
  const clon = (nombre) => {
    const dir = path.join(base, nombre);
    git(base, 'clone', '-q', '--depth=1', '--branch', 'main', `file://${remoto}`, dir);
    return dir;
  };
  return { base, remoto, semilla, clon };
}
const cabeza = (remoto, rama) => {
  try { return git(remoto, 'rev-parse', `refs/heads/${rama}`); } catch { return null; }
};

test('sin cambios en las rutas no hace nada', () => {
  const m = montar();
  const dir = m.clon('a');
  fs.writeFileSync(path.join(dir, 'otro.txt'), 'cambia otra cosa\n');
  const r = E.empujar({ rama: 'bot/lock', mensaje: 'm', rutas: ['datos/lock.json'], cwd: dir });
  assert.strictEqual(r.estado, 'sin-cambios');
  assert.strictEqual(cabeza(m.remoto, 'bot/lock'), null, 'no se creó la rama');
});

test('una rama nueva se crea; si ya es del bot, se reconstruye sobre main sin «stale info»', () => {
  const m = montar();
  const a = m.clon('a');
  fs.writeFileSync(path.join(a, 'datos', 'lock.json'), '{"v":2}\n');
  assert.strictEqual(E.empujar({ rama: 'bot/lock', mensaje: 'semana 1', rutas: ['datos/lock.json'], cwd: a }).estado, 'empujada');
  const primera = cabeza(m.remoto, 'bot/lock');
  assert.strictEqual(git(m.remoto, 'log', '-1', '--format=%ce', primera), E.BOT.correo);
  // La semana siguiente, otro checkout que solo trae main: es justo donde fallaba la vigía.
  const b = m.clon('b');
  fs.writeFileSync(path.join(b, 'datos', 'lock.json'), '{"v":3}\n');
  assert.strictEqual(E.empujar({ rama: 'bot/lock', mensaje: 'semana 2', rutas: ['datos/lock.json'], cwd: b }).estado, 'empujada');
  const segunda = cabeza(m.remoto, 'bot/lock');
  assert.notStrictEqual(segunda, primera);
  assert.strictEqual(git(m.remoto, 'show', `${segunda}:datos/lock.json`), '{"v":3}');
  assert.strictEqual(git(m.remoto, 'rev-parse', `${segunda}^`), git(m.remoto, 'rev-parse', 'main'), 'un solo commit sobre main');
});

test('si una persona empujó encima, no se pisa', () => {
  const m = montar();
  const a = m.clon('a');
  fs.writeFileSync(path.join(a, 'datos', 'lock.json'), '{"v":2}\n');
  E.empujar({ rama: 'bot/lock', mensaje: 'semana 1', rutas: ['datos/lock.json'], cwd: a });
  // Una persona añade su commit encima de la rama del bot.
  const p = path.join(m.base, 'persona');
  git(m.base, 'clone', '-q', '--branch', 'bot/lock', `file://${m.remoto}`, p);
  fs.writeFileSync(path.join(p, 'otro.txt'), 'arreglo a mano\n');
  git(p, ...PERSONA, 'commit', '-q', '-am', 'arreglo a mano');
  git(p, 'push', '-q', 'origin', 'bot/lock');
  const suya = cabeza(m.remoto, 'bot/lock');
  const b = m.clon('b');
  fs.writeFileSync(path.join(b, 'datos', 'lock.json'), '{"v":3}\n');
  const r = E.empujar({ rama: 'bot/lock', mensaje: 'semana 2', rutas: ['datos/lock.json'], cwd: b });
  assert.strictEqual(r.estado, 'retenida');
  assert.strictEqual(r.committer, 'persona@example.com');
  assert.strictEqual(cabeza(m.remoto, 'bot/lock'), suya, 'su commit sigue ahí');
});

// La forma exacta de la rama `datasheets/aruba` que dejó la corrida del 2026-09-02: autor quien
// lanzó el workflow y committer el bot, con el correo numerado que usaba peter-evans. La primera
// versión de esta prueba firmaba con `E.BOT.correo` y pasaba; contra la rama real, el script la
// habría dado por de una persona.
const PETER_EVANS = '41898282+github-actions[bot]@users.noreply.github.com';
test('una rama de peter-evans (autor la persona, committer el bot numerado) sí se reconstruye', () => {
  const m = montar();
  const p = path.join(m.base, 'antigua');
  git(m.base, 'clone', '-q', `file://${m.remoto}`, p);
  git(p, 'checkout', '-q', '-b', 'datasheets/aruba');
  fs.writeFileSync(path.join(p, 'datos', 'lock.json'), '{"v":"pr"}\n');
  execFileSync('git', ['commit', '-q', '-am', 'pr antiguo'], {
    cwd: p,
    env: {
      ...process.env,
      GIT_AUTHOR_NAME: 'Persona', GIT_AUTHOR_EMAIL: 'persona@example.com',
      GIT_COMMITTER_NAME: 'github-actions[bot]', GIT_COMMITTER_EMAIL: PETER_EVANS,
    },
  });
  git(p, 'push', '-q', 'origin', 'datasheets/aruba');
  assert.strictEqual(git(m.remoto, 'log', '-1', '--format=%ae %ce', 'datasheets/aruba'), `persona@example.com ${PETER_EVANS}`);
  const b = m.clon('b');
  fs.writeFileSync(path.join(b, 'datos', 'lock.json'), '{"v":"nuevo"}\n');
  assert.strictEqual(E.empujar({ rama: 'datasheets/aruba', mensaje: 'nuevo', rutas: ['datos'], cwd: b }).estado, 'empujada');
  assert.strictEqual(git(m.remoto, 'log', '-1', '--format=%ce', 'datasheets/aruba'), E.BOT.correo);
});

test('si el remoto cambia entre la lectura y el push, falla en vez de pisar', () => {
  const m = montar();
  const a = m.clon('a');
  fs.writeFileSync(path.join(a, 'datos', 'lock.json'), '{"v":2}\n');
  E.empujar({ rama: 'bot/lock', mensaje: 'semana 1', rutas: ['datos/lock.json'], cwd: a });
  // El checkout b ya conoce la cabeza del bot; otra corrida la mueve antes de que b empuje.
  const b = m.clon('b');
  git(b, 'fetch', '-q', '--depth=1', 'origin', '+refs/heads/bot/lock:refs/remotes/origin/bot/lock');
  const vieja = git(b, 'rev-parse', 'refs/remotes/origin/bot/lock');
  const c = m.clon('c');
  fs.writeFileSync(path.join(c, 'datos', 'lock.json'), '{"v":"c"}\n');
  E.empujar({ rama: 'bot/lock', mensaje: 'otra corrida', rutas: ['datos/lock.json'], cwd: c });
  // b empuja con la lease que esperaba la cabeza vieja: tiene que rechazarse.
  fs.writeFileSync(path.join(b, 'datos', 'lock.json'), '{"v":"b"}\n');
  git(b, 'add', 'datos/lock.json');
  git(b, '-c', `user.email=${E.BOT.correo}`, '-c', `user.name=${E.BOT.nombre}`, 'commit', '-q', '-m', 'b');
  const push = spawnSync('git', ['push', `--force-with-lease=HEAD:refs/heads/bot/lock:${vieja}`, 'origin', 'HEAD:refs/heads/bot/lock'], { cwd: b, encoding: 'utf8' });
  assert.notStrictEqual(push.status, 0, 'la lease protege lo que otra corrida escribió');
  assert.strictEqual(git(m.remoto, 'show', 'bot/lock:datos/lock.json'), '{"v":"c"}');
});

test('el nombre de la rama se valida antes de tocar nada, y el CLI deja el estado', () => {
  for (const mala of ['x; rm -rf /', 'propuesta/$(id)', '../main', 'a..b', '-rama', 'Mayus/x', '', 'x.lock']) {
    assert.ok(!E.ramaValida(mala), mala);
  }
  for (const buena of ['vigia/fuentes', 'datasheets/aruba', 'propuesta/fortinet-123456']) assert.ok(E.ramaValida(buena), buena);
  const m = montar();
  const a = m.clon('a');
  fs.writeFileSync(path.join(a, 'datos', 'lock.json'), '{"v":2}\n');
  const salida = path.join(m.base, 'output.txt');
  const mal = spawnSync(process.execPath, [path.join(__dirname, '..', 'scripts', 'empujar-rama.js'), '--rama', 'x; id', '--mensaje', 'm', '--', 'datos'], { cwd: a, encoding: 'utf8' });
  assert.strictEqual(mal.status, 2);
  assert.strictEqual(git(a, 'status', '--porcelain'), 'M datos/lock.json', 'no se añadió ni se hizo commit de nada');
  const bien = spawnSync(process.execPath, [path.join(__dirname, '..', 'scripts', 'empujar-rama.js'), '--rama', 'bot/lock', '--mensaje', 'm', '--', 'datos'],
    { cwd: a, encoding: 'utf8', env: { ...process.env, GITHUB_OUTPUT: salida } });
  assert.strictEqual(bien.status, 0, bien.stderr);
  assert.strictEqual(fs.readFileSync(salida, 'utf8'), 'estado=empujada\n');
});
