'use strict';
// El aviso de solapes de un PR con otros temas abiertos (2026-11-06, scripts/solapes-pr.js). Se fija
// lo que lo haría inútil o dañino: que no viera el caso que lo motivó (PR #142 frente a la reserva del
// #143), que avisara de los archivos de cierre que todos tocan o de la propia rama, o que el job
// pudiera escribir, instalar o poner en rojo un PR.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { avisos, notaLectura, escaparAnotacion, main } = require('../scripts/solapes-pr');

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

// Lo leído, en UNA línea `::notice` (2026-11-09): sin ella, un «ninguno» no se ve desde una sesión,
// que solo lee las anotaciones. Se cuenta con los filtros de `choques`, o un «Solapes: 0» saldría
// junto a cifras que incluyen lo que nunca se comparó.
const CERRADO = { origen: 'claude/perfiles-un-modulo', tema: 'perfiles', estado: 'cerrado sin fusionar: duplicado', archivos: ['public/js/bom.js'] };
const PR_ABIERTO = { origen: 'claude/figuras-fortinet', tema: 'PR #149 «Figuras»', estado: 'PR abierto', archivos: ['RELEVO.md', 'scripts/figuras-fortinet.js'] };
const ESTE_PR = { origen: 'claude/esta', tema: 'PR #150 «Este»', estado: 'PR abierto', archivos: ['scripts/solapes-pr.js'] };

test('la nota cuenta lo que se compara: sin la propia rama ni los cerrados, y los archivos sin los de cierre', () => {
  const nota = notaLectura({ propios: ['scripts/solapes-pr.js', 'RELEVO.md', 'docs/entregas/x.md'], ocupados: [RESERVA_143, CERRADO, PR_ABIERTO, ESTE_PR],
    rama: 'claude/esta', base: 'origin/main', avisoPrs: null, solapes: 0 });
  assert.strictEqual(nota, 'Leído: 1 traspaso(s) en curso de otras ramas (y 1 cerrado(s), que no cuentan); 1 PR abierto(s) sin traspaso; '
    + '3 archivo(s) de este PR contra origin/main, 1 sin los de cierre. Solapes: 0.');
});

test('sin poder leer los PR, la nota lo dice en vez de contar cero', () => {
  const nota = notaLectura({ propios: [], ocupados: [RESERVA_143], rama: 'x', base: 'origin/main', avisoPrs: 'sin token', solapes: 0 });
  assert.match(nota, /los PR abiertos no se pudieron leer/);
  assert.ok(!/PR abierto\(s\) sin traspaso/.test(nota), nota);
});

function conducir(lectores, rama = 'claude/esta') {
  const lineas = [];
  const log = console.log;
  console.log = (s) => lineas.push(String(s));
  try {
    assert.strictEqual(main(['--base=origin/main', `--rama=${rama}`], {}, lectores), 0);
  } finally { console.log = log; }
  return {
    avisos: lineas.filter((l) => l.startsWith('::warning title=solapes::')),
    notas: lineas.filter((l) => l.startsWith('::notice')),
  };
}

test('sin solapes deja una sola anotación ::notice con lo leído, y ningún ::warning', () => {
  const r = conducir({ diff: () => ['scripts/solapes-pr.js', 'RELEVO.md'], ocupados: () => ({ ocupados: [CERRADO, PR_ABIERTO, ESTE_PR], avisoPrs: null }) });
  assert.deepStrictEqual(r.avisos, []);
  assert.strictEqual(r.notas.length, 1, r.notas.join(' | '));
  assert.match(r.notas[0], /^::notice title=solapes::Leído: 0 traspaso\(s\) en curso .*1 PR abierto\(s\) sin traspaso; 2 archivo\(s\) .*1 sin los de cierre\. Solapes: 0\.$/);
});

test('con solapes, una sola ::notice junto a un ::warning por tema, nunca una por archivo', () => {
  const r = conducir({ diff: () => PR_142, ocupados: () => ({ ocupados: [RESERVA_143, PR_ABIERTO], avisoPrs: null }) }, 'claude/skus-fortinet-variantes');
  assert.strictEqual(r.avisos.length, 1);
  assert.strictEqual(r.notas.length, 1, r.notas.join(' | '));
  assert.match(r.notas[0], /Solapes: 1\.$/);
});

test('sin poder leer los PR, la ::notice sale igual y lo dice', () => {
  const r = conducir({ diff: () => ['a.js'], ocupados: () => ({ ocupados: [], avisoPrs: 'sin token' }) });
  assert.ok(r.avisos.some((l) => /Solo se miraron los traspasos/.test(l)));
  assert.strictEqual(r.notas.length, 1);
  assert.match(r.notas[0], /los PR abiertos no se pudieron leer/);
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
