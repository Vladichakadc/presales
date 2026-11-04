'use strict';
// EL REGISTRO DE CORRIDAS Y EL RECORDATORIO DEL ASESOR (`.claude/hooks/aprendizaje.sh`), conducido
// de verdad: se le da el JSON que manda Claude Code y se mira lo que escribe y lo que responde.
// Las reglas:
//   - PreToolUse abre la corrida en `en-curso.jsonl`; PostToolUse la cierra en `runs.jsonl` con rc=0;
//   - un comando que solo se menciona (dentro de un `echo`) no se registra;
//   - antes de una corrida, si las dos ultimas de la MISMA accion acabaron mal (rc distinto de 0
//     saldado por el arranque, o abiertas sin cerrar), recuerda consultar al asesor;
//   - el recordatorio va en `additionalContext` y nunca lleva `permissionDecision`: avisa, no
//     aprueba ni frena nada.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const cp = require('child_process');

const RAIZ = path.join(__dirname, '..');
const MIN = 60000;
const { fallosSeguidos, MINIMO } = require('../.claude/hooks/lib-fallos.js');

function repo() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'aprendizaje-'));
  fs.mkdirSync(path.join(dir, '.claude', 'hooks'), { recursive: true });
  for (const f of ['aprendizaje.sh', 'lib-comando.js', 'lib-fallos.js']) {
    fs.copyFileSync(path.join(RAIZ, '.claude', 'hooks', f), path.join(dir, '.claude', 'hooks', f));
  }
  return dir;
}

const aprendido = (dir, f) => path.join(dir, '.claude', 'learning', f);
const leer = (dir, f) => { try { return fs.readFileSync(aprendido(dir, f), 'utf8'); } catch { return ''; } };

// Las corridas de antes: [accion, hace cuantos minutos, rc] en runs.jsonl, y [accion, minutos, id]
// en en-curso.jsonl (abiertas: PostToolUse no llego).
function historia(dir, { runs = [], abiertas = [] }) {
  fs.mkdirSync(path.join(dir, '.claude', 'learning'), { recursive: true });
  const ts = (min) => new Date(Date.now() - min * MIN).toISOString();
  fs.writeFileSync(aprendido(dir, 'runs.jsonl'), runs.map(([action, min, rc]) =>
    JSON.stringify({ ts: ts(min), skill: 'npm', action, rc })).join('\n') + (runs.length ? '\n' : ''));
  fs.writeFileSync(aprendido(dir, 'en-curso.jsonl'), abiertas.map(([action, min, id]) =>
    JSON.stringify({ ts: ts(min), id, skill: 'npm', action })).join('\n') + (abiertas.length ? '\n' : ''));
}

function hook(dir, evento, comando, id = 'toolu_nuevo') {
  const entrada = JSON.stringify({ hook_event_name: evento, tool_name: 'Bash', tool_use_id: id, tool_input: { command: comando } });
  const out = cp.execFileSync('bash', [path.join(dir, '.claude', 'hooks', 'aprendizaje.sh')], {
    input: entrada, env: { ...process.env, CLAUDE_PROJECT_DIR: dir },
  }).toString();
  return out ? JSON.parse(out).hookSpecificOutput : null;
}

test('PreToolUse abre la corrida y PostToolUse la cierra con rc=0', () => {
  const dir = repo();
  assert.strictEqual(hook(dir, 'PreToolUse', 'npm run verificar', 'toolu_a'), null, 'sin historia, nada que recordar');
  assert.match(leer(dir, 'en-curso.jsonl'), /"id":"toolu_a".*"action":"verificar"/);
  hook(dir, 'PostToolUse', 'npm run verificar', 'toolu_a');
  assert.strictEqual(leer(dir, 'en-curso.jsonl').trim(), '', 'cerrada, ya no esta en curso');
  const r = JSON.parse(leer(dir, 'runs.jsonl').trim());
  assert.deepStrictEqual([r.action, r.rc], ['verificar', 0]);
});

test('un comando que solo se menciona no se registra', () => {
  const dir = repo();
  hook(dir, 'PreToolUse', 'echo "luego npm run verificar"');
  assert.strictEqual(leer(dir, 'en-curso.jsonl'), '');
});

test('el segundo fallo seguido de la misma accion recuerda consultar al asesor, sin aprobar ni frenar', () => {
  const dir = repo();
  historia(dir, { runs: [['e2e', 30, 0], ['e2e', 20, 1]], abiertas: [['e2e', 10, 'toolu_x']] });
  const h = hook(dir, 'PreToolUse', 'E2E_SOLO=ciclo npm run e2e');
  assert.ok(h, 'dos fallos seguidos de e2e: tiene que recordarlo');
  assert.strictEqual(h.hookEventName, 'PreToolUse');
  assert.match(h.additionalContext, /2 ultimas corridas de "npm run e2e"/);
  assert.match(h.additionalContext, /asesor/);
  assert.ok(!('permissionDecision' in h), 'un recordatorio no decide el permiso de nada');
  assert.match(leer(dir, 'en-curso.jsonl'), /"id":"toolu_nuevo"/, 'y la corrida se registra igual');
});

test('no recuerda nada con un solo fallo, con un verde en medio, ni por los fallos de otra accion', () => {
  const casos = [
    ['un fallo', { abiertas: [['verificar', 5, 'a']] }],
    ['verde en medio', { runs: [['verificar', 30, 1], ['verificar', 20, 0]], abiertas: [['verificar', 5, 'a']] }],
    ['otra accion', { runs: [['e2e', 30, 1]], abiertas: [['e2e', 5, 'a']] }],
  ];
  for (const [nombre, h] of casos) {
    const dir = repo();
    historia(dir, h);
    assert.strictEqual(hook(dir, 'PreToolUse', 'npm run verificar'), null, nombre);
  }
});

test('la regla, sin shell: cuenta hacia atras desde la mas reciente y no cuenta la que se abre ahora', () => {
  const l = (o) => JSON.stringify({ skill: 'npm', ...o });
  const runs = [l({ ts: '2026-11-04T01:00:00Z', action: 'test', rc: 0 }), l({ ts: '2026-11-04T02:00:00Z', action: 'test', rc: 1 })].join('\n');
  const abiertas = [l({ ts: '2026-11-04T03:00:00Z', action: 'test', id: 'b' }), l({ ts: '2026-11-04T04:00:00Z', action: 'test', id: 'ahora' })].join('\n');
  assert.strictEqual(fallosSeguidos('test', runs, abiertas, 'ahora'), 2);
  assert.strictEqual(fallosSeguidos('test', runs, abiertas), 3);
  assert.strictEqual(fallosSeguidos('test', runs + '\n{cortada', ''), 1, 'una linea cortada no rompe la cuenta');
  assert.strictEqual(fallosSeguidos(null, runs, abiertas), 0);
  assert.strictEqual(MINIMO, 2, 'CLAUDE.md dice «dos veces»');
});
