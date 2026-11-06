'use strict';
// El aviso de solapes de un PR con otros temas abiertos (2026-11-06, scripts/solapes-pr.js). Se fija
// lo que lo haría inútil o dañino: que no viera el caso que lo motivó (PR #142 frente a la reserva del
// #143), que avisara de los archivos de cierre que todos tocan o de la propia rama, o que el job
// pudiera escribir, instalar o poner en rojo un PR.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { avisos, escaparAnotacion, main } = require('../scripts/solapes-pr');

const RESERVA_143 = { origen: 'claude/fortinet-skus-wifi-extender', tema: 'el importador de la lista de Fortinet extrae también FortiWiFi y FortiExtender',
  estado: 'en curso', archivos: ['scripts/importar-skus-fortinet.js', 'test/importar-skus-fortinet.test.js', 'server/seed/legacyData/fortinetVariantes.js'] };
const PR_142 = ['CLAUDE.md', 'RELEVO.md', 'docs/entregas/2026-11-06-pr-142.md', 'scripts/importar-skus-fortinet.js',
  'server/seed/legacyData/fortinetVariantes.js', 'test/importar-skus-fortinet.test.js'];

test('el caso que lo motivó: el PR #142 contra la reserva del #143 avisa de los tres archivos, no de los de cierre', () => {
  const a = avisos({ propios: PR_142, ocupados: [RESERVA_143], rama: 'claude/skus-fortinet-variantes' });
  assert.strictEqual(a.length, 1);
  assert.deepStrictEqual([...a[0].pisa].sort(), ['scripts/importar-skus-fortinet.js', 'server/seed/legacyData/fortinetVariantes.js', 'test/importar-skus-fortinet.test.js']);
  assert.match(a[0].texto, /rama claude\/fortinet-skus-wifi-extender, en curso/);
  assert.match(a[0].texto, /un tema ajeno no se toma/);
});

test('la propia rama, un tema cerrado y los archivos de cierre no avisan', () => {
  assert.deepStrictEqual(avisos({ propios: PR_142, ocupados: [RESERVA_143], rama: RESERVA_143.origen }), []);
  assert.deepStrictEqual(avisos({ propios: PR_142, ocupados: [{ ...RESERVA_143, estado: 'cerrado (PR #143)' }], rama: 'otra' }), []);
  const soloCierre = { origen: 'claude/otro', tema: 'otro', estado: 'en curso', archivos: ['RELEVO.md', 'docs/entregas/', 'CLAUDE.md'] };
  assert.deepStrictEqual(avisos({ propios: PR_142, ocupados: [soloCierre], rama: 'x' }), []);
});

test('una carpeta declarada contiene sus archivos, y un PR abierto sin traspaso cuenta igual', () => {
  const pr = { origen: 'claude/manual', tema: 'PR #200 «Manual»', estado: 'PR abierto', archivos: ['docs/manual-usuario/'] };
  const a = avisos({ propios: ['docs/manual-usuario/capitulo-1.md'], ocupados: [pr], rama: 'x' });
  assert.deepStrictEqual(a.map((x) => [x.origen, x.pisa]), [['claude/manual', ['docs/manual-usuario/capitulo-1.md ↔ docs/manual-usuario/']]]);
});

test('la anotación escapa saltos de línea y «%»', () => {
  assert.strictEqual(escaparAnotacion('50%\nya'), '50%25%0Aya');
});

test('sin diff legible avisa y sale con 0: nunca pone un PR en rojo', () => {
  const lineas = [];
  const log = console.log;
  console.log = (s) => lineas.push(String(s));
  try {
    assert.strictEqual(main(['--base=origin/rama-que-no-existe-jamas', '--rama=x'], {}), 0);
  } finally { console.log = log; }
  assert.ok(lineas.some((l) => /^::warning title=solapes::No se pudo leer el diff/.test(l)), lineas.join(' | '));
});

test('el job: solo en PR, lectura de PR sin escritura, sin instalar nada y sin guardar el token', () => {
  const yml = fs.readFileSync(path.join(__dirname, '..', '.github', 'workflows', 'verificar.yml'), 'utf8');
  const job = yml.slice(yml.indexOf('\n  solapes:\n'));
  assert.ok(job.length > 20, 'existe el job solapes');
  assert.match(job, /if: github\.event_name == 'pull_request'/);
  assert.match(job, /permissions:\n {6}contents: read\n {6}pull-requests: read\n/);
  assert.ok(!/: write/.test(job), 'sin escritura');
  assert.ok(!/npm (?:ci|install)|npx /.test(job), 'no instala nada');
  assert.match(job, /persist-credentials: false/);
  assert.match(job, /fetch-depth: 0/, 'trae todas las ramas: los traspasos viven en ellas');
  assert.match(job, /run: node scripts\/solapes-pr\.js\n?$/);
  assert.ok(!/continue-on-error/.test(job), 'no hace falta: el script sale siempre con 0');
});
