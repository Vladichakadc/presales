'use strict';
// El traspaso entre sesiones (docs/traspaso/README.md) solo sirve si `npm run traspasos` lee lo
// que la plantilla escribe. Si alguien renombra un campo de la plantilla y no el lector, cada
// tema en curso saldría «(no consta)» y la siguiente sesión tomaría un tema ya tomado.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { leerCabecera, archivosDeTema, CAMPOS } = require('../scripts/traspasos');

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
