'use strict';
// El aviso de despliegue (scripts/aviso-despliegue.js y sonda-produccion.yml, 2026-10-02). Los
// eventos tienen la forma de los que Railway publica de verdad, leídos ese día de la API de
// GitHub: un deployment «Presales / production» creado por railway-app[bot], con el id del
// entorno en `payload` y estados `in_progress`, `success`, `failure` e `inactive`. Fijan tres
// cosas: que avisa cuando un despliegue falla o cuando la sonda no pasa tras uno que terminó
// bien (falla cerrado), que no escribe nada por un estado que no es final, que no es de Railway
// o que no es de producción, y que del evento no llega al issue nada sin validar.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const A = require('../scripts/aviso-despliegue.js');

const SHA = 'b2bb81bbaf97b85ef43d7233d1beee35bc60716c';
const ENLACE = 'https://railway.com/project/27eafffc-672e-48cc-ac79-6da823d50860?environmentId=96a55d46-1f45-4eda-9d46-1cf9a0c8131f';
const URLS = { repo: 'https://github.com/dueno/presales', corrida: 'https://github.com/dueno/presales/actions/runs/1' };

function estado(state, { ds = {}, d = {} } = {}) {
  return {
    deployment_status: {
      state, description: '', creator: { login: 'railway-app[bot]' },
      log_url: ENLACE, target_url: ENLACE, environment_url: ENLACE, ...ds,
    },
    deployment: {
      sha: SHA, environment: 'Presales / production', creator: { login: 'railway-app[bot]' },
      payload: { environmentId: '96a55d46-1f45-4eda-9d46-1cf9a0c8131f' }, ...d,
    },
  };
}
const de = (payload, sonda) => A.decidir(A.leerEvento('deployment_status', payload, ''), sonda);
const SANA = { resultado: 'success', salud: 'success', muro: 'success' };

test('un despliegue de producción que termina bien y pasa la sonda cierra el aviso abierto', () => {
  const d = de(estado('success'), SANA);
  assert.strictEqual(d.accion, 'cerrar', d.motivo);
  const c = A.comentarioCierre(d, URLS);
  assert.match(c, /`b2bb81b` terminó bien y la sonda pasa/);
  assert.ok(c.includes(URLS.corrida));
});

test('tras un despliegue que terminó bien, una sonda que no pasa o no corrió avisa: falla cerrado', () => {
  const rojo = de(estado('success'), { resultado: 'failure', salud: 'failure', muro: 'success' });
  assert.deepStrictEqual([rojo.accion, rojo.caso], ['avisar', 'sonda']);
  assert.strictEqual(A.tituloIssue(rojo), 'Producción en rojo tras desplegar b2bb81b');
  const cuerpo = A.cuerpoIssue(rojo, URLS);
  assert.match(cuerpo, /`\/salud` y `\/login`: \*\*falla\*\*/);
  assert.match(cuerpo, /Muro de acceso \(`npm run puerta`\): pasa/);
  assert.match(cuerpo, /catálogo de precios podría estar a la vista/);
  for (const resultado of ['cancelled', 'skipped', undefined, '']) {
    const d = de(estado('success'), { resultado });
    assert.strictEqual(d.accion, 'avisar', `sonda «${resultado}» -> ${d.accion}`);
    assert.match(A.cuerpoIssue(d, URLS), /no llegó a correr/);
  }
});

test('un despliegue que falla avisa, y dice que producción sigue con el anterior', () => {
  for (const s of ['failure', 'error']) {
    const d = de(estado(s));
    assert.deepStrictEqual([d.accion, d.caso, d.simulacro], ['avisar', 'fallo', false], s);
    assert.strictEqual(A.tituloIssue(d), 'Despliegue fallido: b2bb81b no llegó a producción');
    const cuerpo = A.cuerpoIssue(d, URLS);
    assert.match(cuerpo, /Producción sigue con el despliegue anterior/);
    assert.ok(cuerpo.includes(`- Commit: ${URLS.repo}/commit/${SHA}`));
    assert.ok(cuerpo.includes(`- Railway: ${ENLACE}`));
    assert.ok(cuerpo.includes(`- Corrida que avisa: ${URLS.corrida}`));
    assert.match(cuerpo, /se cierra solo cuando un despliegue posterior termina bien/);
  }
});

test('un estado que no es final no escribe nada', () => {
  for (const s of ['in_progress', 'queued', 'pending', 'inactive', 'otro', undefined]) {
    assert.strictEqual(de(estado(s), SANA).accion, 'nada', String(s));
  }
});

test('solo cuenta lo que crea Railway para producción, aunque se renombre el proyecto', () => {
  assert.strictEqual(de(estado('failure', { ds: { creator: { login: 'alguien' } } })).accion, 'nada');
  assert.strictEqual(de(estado('failure', { ds: { creator: null } })).accion, 'nada');
  const otro = { environment: 'Presales / staging', payload: { environmentId: '00000000-0000-0000-0000-000000000000' } };
  assert.strictEqual(de(estado('failure', { d: otro })).accion, 'nada');
  // El id del entorno no cambia si se renombra el proyecto; el nombre cubre que falte el id.
  assert.strictEqual(de(estado('failure', { d: { environment: 'Otro nombre / production' } })).accion, 'avisar');
  assert.strictEqual(de(estado('failure', { d: { payload: null } })).accion, 'avisar');
  assert.strictEqual(de(estado('failure', { d: { payload: 'texto' } })).accion, 'avisar');
  // Otros eventos tampoco escriben nada.
  assert.strictEqual(A.decidir(A.leerEvento('push', {}, SHA), SANA).accion, 'nada');
  assert.strictEqual(A.decidir(A.leerEvento('deployment_status', null, ''), SANA).accion, 'nada');
});

test('del evento no llega al issue nada sin validar', () => {
  // La descripción es texto libre: no se usa nunca.
  const malicioso = estado('failure', { ds: { description: '@dueno mira [esto](https://evil.example) `rm -rf`' } });
  assert.ok(!/evil|@dueno|rm -rf/.test(A.cuerpoIssue(de(malicioso), URLS)));
  // Un enlace que no es de Railway no se pinta; si otro campo trae uno válido, se usa ese.
  const ajeno = de(estado('failure', { ds: { log_url: 'https://evil.example/x', target_url: 'javascript:alert(1)', environment_url: 'https://railway.com.evil.example/project/x' } }));
  const cuerpoAjeno = A.cuerpoIssue(ajeno, URLS);
  assert.ok(!/evil|javascript/.test(cuerpoAjeno));
  assert.match(cuerpoAjeno, /no trae un enlace reconocible/);
  // Un enlace de Railway dentro de otro, o con algo detrás, tampoco: la forma se ancla entera.
  for (const u of [`https://evil.example/r?u=${ENLACE}`, `${ENLACE}&x=1`, `${ENLACE}\n[otro](https://evil.example)`]) {
    const d = de(estado('failure', { ds: { log_url: u, target_url: u, environment_url: u } }));
    assert.match(A.cuerpoIssue(d, URLS), /no trae un enlace reconocible/, u);
  }
  const mixto = de(estado('failure', { ds: { log_url: 'https://evil.example/x' } }));
  assert.ok(A.cuerpoIssue(mixto, URLS).includes(`- Railway: ${ENLACE}`));
  // Un commit que no es un SHA no entra en ningún enlace, pero el aviso sale igual.
  for (const sha of ['../../evil', SHA.toUpperCase(), `${SHA}0`, null]) {
    const d = de(estado('failure', { d: { sha } }));
    assert.strictEqual(d.accion, 'avisar');
    const cuerpo = A.cuerpoIssue(d, URLS);
    assert.match(A.tituloIssue(d), /\(commit no legible\)/);
    assert.ok(!cuerpo.includes('/commit/'), String(sha));
  }
});

test('a mano: sin simulacro no escribe nada; con simulacro recorre el camino del fallo y lo dice', () => {
  assert.strictEqual(A.decidir(A.leerEvento('workflow_dispatch', { inputs: { simulacro: 'ninguno' } }, SHA), {}).accion, 'nada');
  assert.strictEqual(A.decidir(A.leerEvento('workflow_dispatch', {}, SHA), {}).accion, 'nada');
  const d = A.decidir(A.leerEvento('workflow_dispatch', { inputs: { simulacro: A.SIMULACRO } }, SHA), {});
  assert.deepStrictEqual([d.accion, d.caso, d.simulacro], ['avisar', 'fallo', true]);
  assert.strictEqual(A.tituloIssue(d), '[Simulacro] Despliegue fallido: b2bb81b no llegó a producción');
  assert.match(A.cuerpoIssue(d, URLS), /^> \*\*Simulacro\*\*, lanzado a mano/);
});

// El workflow, por su texto y sin comentarios.
const YML = fs.readFileSync(path.join(__dirname, '..', '.github', 'workflows', 'sonda-produccion.yml'), 'utf8')
  .replace(/^\s*#.*\n/gm, '');
const job = (nombre) => {
  const m = YML.match(new RegExp(`\\n {2}${nombre}:\\n([\\s\\S]*?)(?=\\n {2}[a-z][\\w-]*:\\n|$)`));
  assert.ok(m, `sonda-produccion.yml no tiene el job ${nombre}`);
  return m[1];
};

test('sonda-produccion.yml escucha los despliegues y sigue lanzándose a mano', () => {
  const on = YML.slice(YML.indexOf('\non:'), YML.indexOf('\npermissions:'));
  assert.match(on, /\n {2}deployment_status:\n/);
  assert.match(on, /\n {2}workflow_dispatch:\n/);
  assert.match(on, new RegExp(`options:\\n\\s+- ninguno\\n\\s+- ${A.SIMULACRO}\\n`), 'el simulacro del workflow no es el del módulo');
  assert.match(on, /default: ninguno\n/);
});

test('la sonda corre en cada éxito; el aviso, en los estados finales y en el simulacro', () => {
  const sondear = job('sondear');
  assert.match(sondear, /if: \$\{\{ github\.event_name == 'workflow_dispatch' \|\| github\.event\.deployment_status\.state == 'success' \}\}/);
  assert.match(sondear, /salud: \$\{\{ steps\.salud\.outcome \}\}/);
  assert.match(sondear, /muro: \$\{\{ steps\.muro\.outcome \}\}/);
  assert.match(sondear, /id: salud\n/);
  assert.match(sondear, /id: muro\n/);
  const avisar = job('avisar');
  const si = avisar.match(/if: >-\n([\s\S]*?\}\})/)[1].replace(/\s+/g, ' ');
  assert.match(si, /^ \$\{\{ !cancelled\(\) && \(/, 'el aviso tiene que correr también cuando la sonda falló o se saltó');
  for (const s of ['success', 'failure', 'error']) assert.ok(si.includes(`github.event.deployment_status.state == '${s}'`), s);
  assert.ok(si.includes(`inputs.simulacro == '${A.SIMULACRO}'`));
  assert.match(avisar, /needs: sondear\n/);
});

test('el job que avisa solo ejecuta el módulo, y nada del evento se interpola en código', () => {
  const avisar = job('avisar');
  assert.match(avisar, /sparse-checkout: \|\n\s+scripts\/aviso-despliegue\.js\n\s+sparse-checkout-cone-mode: false/);
  assert.match(avisar, /A\.leerEvento\(context\.eventName, context\.payload, context\.sha\)/);
  assert.match(avisar, /labels: A\.ETIQUETA/);
  // `${{ github.event... }}` solo puede aparecer en un `if:`, que evalúa GitHub y no la shell.
  for (const linea of YML.split('\n').filter((l) => l.includes('${{ github.event') || l.includes('github.event.'))) {
    assert.match(linea, /^\s+(?:if: |\$\{\{ !cancelled|github\.event\.deployment_status\.state ==)/, `interpolación fuera de un if: ${linea.trim()}`);
  }
  assert.ok(!/run:[^\n]*\$\{\{ (?:github\.event|inputs)/.test(YML));
});
