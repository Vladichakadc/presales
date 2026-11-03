'use strict';
// El traspaso entre sesiones (docs/traspaso/README.md) solo sirve si `npm run traspasos` lee lo
// que la plantilla escribe. Si alguien renombra un campo de la plantilla y no el lector, cada
// tema en curso saldría «(no consta)» y la siguiente sesión tomaría un tema ya tomado.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { leerCabecera, archivosDeTema, prsSinTraspaso, repoDeOrigen, RAMA_NO_TEMA, CAMPOS, marcaParada, prsNombrados, DIAS_PARADA } = require('../scripts/traspasos');

const RAIZ = path.join(__dirname, '..');

test('la plantilla declara todos los campos que lee npm run traspasos', () => {
  const plantilla = fs.readFileSync(path.join(RAIZ, 'docs/traspaso/PLANTILLA.md'), 'utf8');
  assert.deepStrictEqual(Object.keys(leerCabecera(plantilla)), CAMPOS);
});

test('lee la cabecera y no inventa un campo que falta', () => {
  const texto = '# Traspaso: x\n\n- **Tema:** Cisco XGS-PON\n- **Estado:** en curso\n'
    + '- **Archivos que toca:** public/js/cisco-motor.js, test/cisco.test.js\n'
    + '\n## Hecho\n\n- **Tema:** esto ya no es cabecera\n';
  assert.deepStrictEqual(leerCabecera(texto), {
    Tema: 'Cisco XGS-PON',
    Estado: 'en curso',
    'Archivos que toca': 'public/js/cisco-motor.js, test/cisco.test.js',
  });
});

test('README y plantilla no cuentan como tema', () => {
  const listado = 'docs/traspaso/README.md\ndocs/traspaso/PLANTILLA.md\ndocs/traspaso/cisco-xgspon.md\n';
  assert.deepStrictEqual(archivosDeTema(listado), ['cisco-xgspon.md']);
});


// El arranque de cada sesión remota enseña los temas en curso (mejora aprobada el 2026-10-27).
// Va antes de `npm install`: con `set -e`, una instalación que falla (el proxy dio 403 al
// registro de npm ese mismo día) cortaría el arranque antes de llegar. Y no puede abortarlo.
test('el arranque lista los temas en curso antes de npm install y sin abortar', () => {
  const hook = fs.readFileSync(path.join(RAIZ, '.claude/hooks/session-start.sh'), 'utf8');
  const lista = hook.indexOf('node scripts/traspasos.js');
  const instala = hook.indexOf('npm install --no-audit');
  assert.ok(lista > 0, 'session-start.sh ya no corre scripts/traspasos.js');
  assert.ok(lista < instala, 'el listado de temas va antes de npm install');
  const linea = hook.slice(hook.lastIndexOf('\n', lista) + 1, hook.indexOf('\n', lista));
  assert.match(linea, /^if ! .*timeout \d+ node scripts\/traspasos\.js/,
    'el listado va dentro de un if con timeout: un fetch colgado o fallido no puede cortar el arranque');
});

// Dos veces el 2026-10-27 dos sesiones hicieron el mismo trabajo porque la otra rama no salía en el
// listado: un PR abierto con el traspaso ya borrado es un tema tomado igual.
test('un PR abierto cuya rama no lleva traspaso sale aparte; uno con traspaso no se repite', () => {
  const prs = [
    { number: 30, title: 'EdgeHA por velocidad', head: { ref: 'claude/edgeha-velocidad' }, user: { login: 'v' }, updated_at: 'x' },
    { number: 31, title: 'PQC', head: { ref: 'claude/elegant-pascal-7ymts7' }, user: { login: 'v' }, updated_at: 'y' },
  ];
  assert.deepStrictEqual(prsSinTraspaso(prs, ['claude/elegant-pascal-7ymts7']).map((p) => [p.numero, p.rama]),
    [[30, 'claude/edgeha-velocidad']]);
  assert.deepStrictEqual(prsSinTraspaso(null, []), []);
});

test('el repositorio sale del remoto en https o ssh', () => {
  assert.strictEqual(repoDeOrigen('https://github.com/Vladichakadc/presales.git\n'), 'Vladichakadc/presales');
  assert.strictEqual(repoDeOrigen('git@github.com:Vladichakadc/presales'), 'Vladichakadc/presales');
  assert.strictEqual(repoDeOrigen('https://gitlab.com/x/y'), null);
});

test('las ramas de transporte de documentos y las de Dependabot no son temas', () => {
  // Un workflow de transporte corta `fuente/*` desde la rama del tema y arrastra su traspaso.
  assert.ok(RAMA_NO_TEMA.test('origin/fuente/pqc-2-2026-10-27'));
  assert.ok(RAMA_NO_TEMA.test('origin/dependabot/npm_and_yarn/x'));
  assert.ok(!RAMA_NO_TEMA.test('origin/claude/fuente-nueva'));
});

// RAMAS PARADAS (2026-11-01): una rama abandonada sigue declarando sus archivos; se marca, nunca se borra sola.
test('una rama sin commits en más de tres días se marca parada, con los PR fusionados que nombra y cómo cerrarla', () => {
  const ahora = Date.parse('2026-11-01T17:00:00Z');
  const m = marcaParada({ rama: 'claude/vieja', fecha: '2026-10-29 02:30:21 +0000', estado: 'en curso', fusionados: [58, 60], ahora });
  assert.match(m, /^PARADA: 3 días sin commits/, 'tres días y medio cuentan como más de tres');
  assert.match(m, /PR ya fusionados \(#58, #60\)/);
  assert.match(m, /git push origin --delete claude\/vieja/);
  assert.match(m, /--aunque claude\/vieja/);
  assert.strictEqual(marcaParada({ rama: 'claude/viva', fecha: '2026-10-31T17:00:00Z', estado: 'en curso', ahora }), null, 'dos días es un tema vivo');
  assert.strictEqual(DIAS_PARADA, require('../scripts/reservar').DIAS_PARADA, 'la misma regla que reservar');
});

test('un traspaso cerrado se marca aunque sea reciente; los PR nombrados se leen sin repetir', () => {
  const m = marcaParada({ rama: 'claude/x', fecha: new Date().toISOString(), estado: 'cerrado sin fusionar: duplicado del PR #62' });
  assert.match(m, /^CERRADO/);
  assert.match(m, /ya no bloquea a npm run reservar/);
  assert.doesNotMatch(m, /--aunque/, 'reservar ya ignora un traspaso cerrado');
  assert.deepStrictEqual(prsNombrados('PR #62 y el PR #58; otra vez PR #62, no #7'), [58, 62]);
});
