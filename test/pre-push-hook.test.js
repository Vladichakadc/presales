'use strict';
// EL AVISO ANTES DE UN `git push` (`.claude/hooks/pre-push.sh`), conducido de verdad: se le da
// el JSON que manda Claude Code y se mira lo que responde. Hasta el 2026-10-06 no lo probaba
// nada, y ese día ganó una segunda comprobación —la auditoría de dependencias, después de que un
// aviso crítico nuevo de proxy-addr pusiera `verificar` en rojo tras empujar—. Las reglas:
//   - se calla sin registro, o cuando la puerta y la auditoría son posteriores a lo tocado;
//   - avisa (`ask`, nunca bloquea) si `verificar` es anterior al último cambio del código;
//   - avisa si `auditar` es anterior al último cambio del lock o tiene más de 12 horas;
//   - no habla de la auditoría si nunca se ha corrido una: no hay nada que comparar.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const cp = require('child_process');

const RAIZ = path.join(__dirname, '..');
const HORA = 3600000;

function repo() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'prepush-'));
  fs.mkdirSync(path.join(dir, '.claude', 'hooks'), { recursive: true });
  fs.mkdirSync(path.join(dir, '.claude', 'learning'), { recursive: true });
  for (const f of ['pre-push.sh', 'lib-comando.js']) {
    fs.copyFileSync(path.join(RAIZ, '.claude', 'hooks', f), path.join(dir, '.claude', 'hooks', f));
  }
  fs.mkdirSync(path.join(dir, 'server'));
  fs.writeFileSync(path.join(dir, 'server', 'x.js'), '1\n');
  fs.writeFileSync(path.join(dir, 'package.json'), '{}\n');
  fs.writeFileSync(path.join(dir, 'package-lock.json'), '{}\n');
  cp.execSync('git init -q && git add -A', { cwd: dir });
  return dir;
}

// Fija la fecha de modificación de un archivo, en milisegundos desde ahora.
function tocar(dir, f, haceMs) {
  const t = new Date(Date.now() - haceMs);
  fs.utimesSync(path.join(dir, f), t, t);
}

function registrar(dir, corridas) {
  const lineas = corridas.map(([action, haceMs, rc = 0]) =>
    JSON.stringify({ ts: new Date(Date.now() - haceMs).toISOString(), skill: 'npm', action, rc }));
  fs.writeFileSync(path.join(dir, '.claude', 'learning', 'runs.jsonl'), lineas.join('\n') + '\n');
}

function empujar(dir, comando = 'git push -u origin main') {
  const entrada = JSON.stringify({ cwd: dir, tool_name: 'Bash', tool_input: { command: comando } });
  const out = cp.execFileSync('bash', [path.join(dir, '.claude', 'hooks', 'pre-push.sh')], { input: entrada }).toString();
  return out ? JSON.parse(out).hookSpecificOutput : null;
}

function escenario({ codigo = 2 * HORA, lock = 3 * HORA, corridas }) {
  const dir = repo();
  tocar(dir, 'server/x.js', codigo);
  tocar(dir, 'package.json', lock);
  tocar(dir, 'package-lock.json', lock);
  if (corridas) registrar(dir, corridas);
  return dir;
}

test('sin registro de corridas se calla', () => {
  assert.strictEqual(empujar(escenario({})), null);
});

test('con verificar y auditar posteriores a todo, se calla', () => {
  assert.strictEqual(empujar(escenario({ corridas: [['verificar', HORA], ['auditar', HORA]] })), null);
});

test('un verificar anterior al último cambio del código pide confirmación, sin bloquear', () => {
  const r = empujar(escenario({ codigo: HORA, corridas: [['verificar', 2 * HORA], ['auditar', HORA / 2]] }));
  assert.strictEqual(r.permissionDecision, 'ask');
  assert.match(r.permissionDecisionReason, /npm run verificar/);
  assert.match(r.permissionDecisionReason, /server\/x\.js/);
  assert.doesNotMatch(r.permissionDecisionReason, /npm run auditar/);
});

test('un verificar en rojo no cuenta como verde', () => {
  const r = empujar(escenario({ codigo: 2 * HORA, corridas: [['verificar', 3 * HORA], ['verificar', HORA, 1]] }));
  assert.match(r.permissionDecisionReason, /npm run verificar/);
});

test('una auditoría de hace más de 12 horas pide confirmación', () => {
  const r = empujar(escenario({ lock: 20 * HORA, corridas: [['verificar', HORA], ['auditar', 13 * HORA]] }));
  assert.strictEqual(r.permissionDecision, 'ask');
  assert.match(r.permissionDecisionReason, /npm run auditar.*13 h/);
  assert.doesNotMatch(r.permissionDecisionReason, /puerta de verificacion/);
});

test('un lock tocado después de la última auditoría pide confirmación', () => {
  const r = empujar(escenario({ lock: HORA, codigo: 3 * HORA, corridas: [['verificar', HORA / 2], ['auditar', 2 * HORA]] }));
  assert.match(r.permissionDecisionReason, /El lock cambio despues del ultimo "npm run auditar"/);
});

test('sin ninguna auditoría registrada no habla de ella', () => {
  assert.strictEqual(empujar(escenario({ corridas: [['verificar', HORA]] })), null);
});

test('un push que solo se menciona no dispara el aviso', () => {
  const dir = escenario({ codigo: HORA, corridas: [['verificar', 2 * HORA]] });
  assert.strictEqual(empujar(dir, 'git commit -m "hacer git push luego"'), null);
  assert.ok(empujar(dir), 'y el mismo escenario con un push de verdad sí avisa');
});
