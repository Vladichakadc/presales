'use strict';
// La vigilia del despliegue (mejora aprobada el 2026-10-28): un commit de `main` que se queda sin
// desplegar no lo avisaba nada, porque la sonda solo corre cuando un despliegue termina. Ese día la
// fusión del PR #53 esperó en cola casi una hora y Railway la saltó, y la del PR #51 no creó
// ningún despliegue. Aquí, la decisión sin red.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const V = require('../scripts/vigilia-despliegue');

const SHA = 'a'.repeat(40);
const FECHA = '2026-10-28T17:47:34Z';
const T0 = Date.parse(FECHA);
const min = (n) => T0 + n * 60000;
const verde = [{ name: 'verificar', status: 'completed', conclusion: 'success' }, { name: 'pantallas', status: 'completed', conclusion: 'success' }];
const dep = (estado) => [{ sha: SHA, created_at: FECHA, estados: estado ? [{ state: estado, created_at: FECHA }] : [] }];
const datos = (checks, despliegues) => V.leerDatos({ sha: SHA, fecha: FECHA, checks, despliegues });

test('desplegado: se cierra el aviso, también antes del margen', () => {
  assert.strictEqual(V.decidir(datos(verde, dep('success')), min(10)).accion, 'cerrar');
  assert.strictEqual(V.plan(V.decidir(datos(verde, dep('success')), min(10)), { title: 'x' }), 'cerrar');
  assert.strictEqual(V.plan(V.decidir(datos(verde, dep('success')), min(10)), null), 'nada');
});

test('dentro del margen no se avisa de nada', () => {
  const d = V.decidir(datos(verde, dep('queued')), min(89));
  assert.deepStrictEqual([d.accion, d.motivo], ['nada', 'esperando']);
});

test('pasado el margen se avisa con la causa que se ve desde GitHub', () => {
  assert.strictEqual(V.decidir(datos(verde, dep('queued')), min(120)).motivo, 'en-cola', 'el PR #53: en cola');
  assert.strictEqual(V.decidir(datos(verde, []), min(120)).motivo, 'sin-despliegue', 'el PR #51: Railway no lo registró');
  assert.strictEqual(V.decidir(datos(verde, dep('inactive')), min(120)).motivo, 'sin-despliegue', 'saltado o reemplazado');
  const rojo = [{ name: 'verificar', status: 'completed', conclusion: 'success' }, { name: 'pantallas', status: 'completed', conclusion: 'failure' }];
  assert.strictEqual(V.decidir(datos(rojo, []), min(120)).motivo, 'ci-rojo');
  assert.strictEqual(V.decidir(datos([{ name: 'verificar', status: 'in_progress' }], []), min(120)).motivo, 'ci-sin-terminar');
});

test('un despliegue fallido lo avisa la sonda, no la vigilia', () => {
  assert.deepStrictEqual([V.decidir(datos(verde, dep('failure')), min(200)).accion], ['nada']);
});

test('un aviso por commit: no se repite y se comenta con la cabeza nueva', () => {
  const d = V.decidir(datos(verde, []), min(120));
  assert.strictEqual(V.plan(d, null), 'abrir');
  assert.strictEqual(V.plan(d, { title: V.tituloIssue(d) }), 'nada');
  assert.strictEqual(V.plan(d, { title: `${V.PREFIJO}: bbbbbbb lleva 95 min sin desplegarse` }), 'comentar');
  assert.match(V.tituloIssue(d), /^Main sin desplegar: aaaaaaa lleva 120 min sin desplegarse$/);
  const urls = { repo: 'https://github.com/o/r', corrida: 'https://github.com/o/r/actions/runs/1' };
  assert.match(V.cuerpoIssue(d, urls), /Railway no creó ningún despliegue/);
  assert.match(V.cuerpoIssue(d, urls), /`verificar`: verde · `pantallas`: verde/);
});

test('los datos de la API se validan: sin commit o fecha válidos no se decide nada', () => {
  assert.strictEqual(V.decidir(V.leerDatos({ sha: 'x', fecha: FECHA, checks: verde, despliegues: [] }), min(200)).accion, 'nada');
  assert.strictEqual(V.decidir(V.leerDatos({ sha: SHA, fecha: 'ayer', checks: verde, despliegues: [] }), min(200)).accion, 'nada');
  // Un estado desconocido no cuenta como `success`.
  assert.strictEqual(V.decidir(datos(verde, dep('desplegado')), min(200)).motivo, 'en-cola');
  assert.strictEqual(V.margen('30'), 30);
  assert.strictEqual(V.margen('5'), V.MARGEN_MIN);
  assert.strictEqual(V.margen('abc'), V.MARGEN_MIN);
});

test('el workflow corre solo, no instala nada y solo escribe issues', () => {
  const yml = fs.readFileSync(path.join(__dirname, '..', '.github/workflows/vigilia-despliegue.yml'), 'utf8');
  const sinComentarios = yml.replace(/^\s*#.*\n/gm, '');
  assert.match(sinComentarios, /schedule:\n\s+- cron: '[^']+'/, 'corre programado');
  assert.match(sinComentarios, /^permissions:\n {2}contents: read\n/m, 'por defecto, solo lectura');
  assert.match(sinComentarios, /issues: write/);
  assert.ok(!/contents: write|npm (?:ci|install)|npx /.test(sinComentarios), 'sin escritura de código ni instalación');
  assert.match(sinComentarios, /persist-credentials: false/);
  assert.match(sinComentarios, /require\('\.\/scripts\/vigilia-despliegue\.js'\)/);
  assert.ok(sinComentarios.endsWith('\n') && !sinComentarios.endsWith('\n\n'), 'un solo salto de línea al final');
});
