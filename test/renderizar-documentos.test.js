'use strict';
// EL RENDERIZADOR DE TRANSPORTE (2026-10-06): `scripts/renderizar-documentos.js` y el job
// `renderizar` de `traer-cisco-huawei.yml`. Dos cosas que alguien podría «simplificar»:
//   1. la lista se valida antes de abrir un navegador: un `archivo` que escape del directorio de
//      salida o una entrada sin `debeContener` (sin él no hay forma de distinguir el documento
//      del cascarón de JavaScript, que es justo lo que trajo la primera corrida);
//   2. el job que instala Playwright NO puede escribir en el repositorio, y el que escribe NO
//      instala nada: juntar los dos en un job dejaría a una dependencia comprometida con un
//      token que empuja.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { validarLista } = require('../scripts/renderizar-documentos.js');

// Se lee como texto, como `workflows-imagen.test.js`: js-yaml solo llega por eslint y una prueba
// no se apoya en una dependencia que nadie declaró. Los comentarios fuera, para que una frase
// que nombre algo no cuente como el paso que lo hace.
const TEXTO = fs.readFileSync(path.join(__dirname, '..', '.github/workflows/traer-cisco-huawei.yml'), 'utf8')
  .replace(/^\s*#.*\n/gm, '');
const JOBS = {};
for (const p of TEXTO.slice(TEXTO.indexOf('\njobs:')).split(/\n {2}(?=[a-z][\w-]*:\n)/).slice(1)) {
  JOBS[p.slice(0, p.indexOf(':'))] = p;
}
const cabecera = TEXTO.slice(0, TEXTO.indexOf('\njobs:'));

test('validarLista acepta una lista bien formada', () => {
  assert.doesNotThrow(() => validarLista([{ archivo: 'a.json', url: 'https://support.huawei.com/x', debeContener: 'AR6710' }]));
});

test('validarLista rechaza lo que escaparía del directorio, lo repetido, lo que no es https y lo que no se puede validar', () => {
  const base = { url: 'https://support.huawei.com/x', debeContener: 'AR6710' };
  assert.throws(() => validarLista([]), /vacía/);
  assert.throws(() => validarLista([{ ...base, archivo: '../a.json' }]), /archivo no válido/);
  assert.throws(() => validarLista([{ ...base, archivo: 'sub/a.json' }]), /archivo no válido/);
  assert.throws(() => validarLista([{ ...base, archivo: 'a.html' }]), /archivo no válido/);
  assert.throws(() => validarLista([{ ...base, archivo: 'a.json' }, { ...base, archivo: 'a.json' }]), /repetido/);
  assert.throws(() => validarLista([{ ...base, archivo: 'a.json', url: 'http://support.huawei.com/x' }]), /solo https/);
  assert.throws(() => validarLista([{ ...base, archivo: 'a.json', debeContener: '' }]), /debeContener/);
});

test('la lista del workflow pasa la validación', () => {
  const m = (JOBS.renderizar || '').match(/<<'LISTA'\n([\s\S]*?)\n\s*LISTA\n/);
  assert.ok(m, 'el job renderizar no lleva su lista (o el heredoc perdió las comillas y expandiría variables)');
  assert.doesNotThrow(() => validarLista(JSON.parse(m[1])));
});

test('el job que instala Playwright no puede escribir, y el que escribe no instala nada', () => {
  assert.match(cabecera, /\npermissions:\n {2}contents: read\n/, 'el permiso por defecto del workflow tiene que ser de lectura');
  const r = JOBS.renderizar;
  assert.ok(r, 'no hay job renderizar');
  assert.doesNotMatch(r, /: write/, 'renderizar pide escritura');
  assert.match(r, /actions\/checkout@[^\n]*\n\s+with:\n\s+persist-credentials: false/, 'renderizar deja el token guardado en la copia');
  assert.match(r, /playwright@/, 'renderizar ya no instala Playwright: revisar esta prueba');

  const t = JOBS.traer;
  assert.match(t, /\n {4}permissions:\n {6}contents: write\n/);
  assert.doesNotMatch(t, /npm (ci|install)|playwright|npx /, 'el job que escribe instala o ejecuta paquetes');
  assert.match(t, /\n {4}needs: renderizar\n/);
  assert.match(t, /\n {4}if: \$\{\{ !cancelled\(\) \}\}\n/, 'si el render falla, las fichas PDF tienen que seguir llegando');
});
