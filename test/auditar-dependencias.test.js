'use strict';
// El freno de las dependencias (scripts/auditar-dependencias.js), con informes de `npm audit`
// sintéticos: un informe real cambia cada día con la base de avisos, y esta prueba no puede
// ponerse en rojo por eso. La línea de comandos se prueba con un `npm` falso delante en el PATH,
// para no dejar en el script ningún atajo que salte la auditoría de verdad.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const A = require('../scripts/auditar-dependencias.js');

const HOY = '2026-10-02';
const aviso = (paquete, gravedad, id, extra = {}) => ({
  source: 1, name: paquete, dependency: paquete, title: `fallo de ${paquete}`, severity: gravedad,
  url: `https://github.com/advisories/${id}`, range: '<9.9.9', ...extra,
});
// Un informe con la forma de `npm audit --json` (auditReportVersion 2).
function informe(entradas) {
  const vulnerabilities = {};
  for (const [paquete, via, fixAvailable = true] of entradas) {
    vulnerabilities[paquete] = { name: paquete, severity: 'high', isDirect: false, via, effects: [], range: '*', nodes: [], fixAvailable };
  }
  return { auditReportVersion: 2, vulnerabilities, metadata: { vulnerabilities: {}, dependencies: {} } };
}
const ALTO = 'GHSA-aaaa-bbbb-cccc';
const MODERADO = 'GHSA-dddd-eeee-ffff';
const excepcion = (extra = {}) => ({ id: ALTO, paquete: 'undici', motivo: 'sin arreglo publicado y no se usa su WebSocket', caduca: '2026-11-15', ...extra });

test('un informe limpio no frena', () => {
  const r = A.evaluar(informe([]), [], HOY);
  assert.deepStrictEqual([r.frenan.length, r.informativos.length, r.problemas.length], [0, 0, 0]);
});

test('un aviso alto o crítico frena; un moderado se lista sin frenar', () => {
  const r = A.evaluar(informe([
    ['undici', [aviso('undici', 'high', ALTO)]],
    ['minimist', [aviso('minimist', 'critical', 'GHSA-1111-2222-3333')]],
    ['moment', [aviso('moment', 'moderate', MODERADO)]],
  ]), [], HOY);
  assert.deepStrictEqual(r.frenan.map((a) => a.paquete).sort(), ['minimist', 'undici']);
  assert.deepStrictEqual(r.informativos.map((a) => a.id), [MODERADO]);
  assert.match(A.informar(r), /ALTO {2}undici {2}GHSA-aaaa-bbbb-cccc/);
});

test('las cadenas de `via` no son avisos: se cuentan una vez, en su paquete', () => {
  const r = A.evaluar(informe([
    ['undici', [aviso('undici', 'high', ALTO)]],
    ['node-gyp', ['undici']],
    ['sqlite3', ['node-gyp']],
  ]), [], HOY);
  assert.strictEqual(r.frenan.length, 1);
});

test('una excepción vigente, con motivo, deja pasar ese aviso y solo ese', () => {
  const r = A.evaluar(informe([
    ['undici', [aviso('undici', 'high', ALTO)]],
    ['tar', [aviso('tar', 'high', 'GHSA-4444-5555-6666')]],
  ]), [excepcion()], HOY);
  assert.deepStrictEqual(r.exceptuados.map((a) => a.id), [ALTO]);
  assert.deepStrictEqual(r.frenan.map((a) => a.paquete), ['tar']);
  assert.deepStrictEqual(r.problemas, []);
});

test('una excepción caducada, lejana, vieja o mal escrita frena', () => {
  const conAviso = informe([['undici', [aviso('undici', 'high', ALTO)]]]);
  for (const [e, motivo] of [
    [excepcion({ caduca: '2026-10-01' }), /caducó el 2026-10-01/],
    [excepcion({ caduca: '2027-06-30' }), /a más de 90 días/],
    [excepcion({ id: 'CVE-2026-1234' }), /tiene que ser un GHSA/],
    [excepcion({ motivo: '' }), /falta el motivo/],
    [excepcion({ paquete: '' }), /falta el paquete/],
    [excepcion({ caduca: 'pronto' }), /no es una fecha/],
    [excepcion({ paquete: 'otro' }), /ya no casa con ningún aviso/],
  ]) {
    const r = A.evaluar(conAviso, [e], HOY);
    assert.ok(r.problemas.some((p) => motivo.test(p)), `${JSON.stringify(e)} -> ${r.problemas}`);
    assert.strictEqual(r.frenan.length, 1, 'el aviso vuelve a frenar');
  }
  // Y una excepción de algo que ya se arregló también frena: si no, taparía el aviso de mañana.
  assert.match(A.evaluar(informe([]), [excepcion()], HOY).problemas[0], /ya no casa/);
  // El borde: caducar a 90 días justos vale; el día de la caducidad todavía vale.
  assert.deepStrictEqual(A.evaluar(conAviso, [excepcion({ caduca: '2026-12-31' })], HOY).problemas, []);
  assert.deepStrictEqual(A.evaluar(conAviso, [excepcion({ caduca: HOY })], HOY).problemas, []);
});

test('un informe que no se puede leer no es un informe limpio', () => {
  for (const malo of [null, {}, { error: { code: 'ENOTFOUND' } }, { vulnerabilities: {} }]) {
    assert.throws(() => A.evaluar(malo, [], HOY), /no se puede leer/, JSON.stringify(malo));
  }
});

test('las excepciones del repositorio están en regla hoy', () => {
  for (const e of A.EXCEPCIONES) {
    const r = A.evaluar(informe([[e.paquete, [aviso(e.paquete, 'high', e.id)]]]), [e]);
    assert.deepStrictEqual(r.problemas, [], JSON.stringify(e));
  }
});

// La línea de comandos, con un `npm` falso que devuelve lo que se le diga.
function correr(salidaNpm, codigoNpm = 1) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'auditar-'));
  fs.writeFileSync(path.join(dir, 'salida.txt'), salidaNpm);
  fs.writeFileSync(path.join(dir, 'npm'), `#!/bin/sh\ncat "${path.join(dir, 'salida.txt')}"\nexit ${codigoNpm}\n`, { mode: 0o755 });
  const resumen = path.join(dir, 'resumen.md');
  const r = spawnSync(process.execPath, [path.join(__dirname, '..', 'scripts', 'auditar-dependencias.js')], {
    encoding: 'utf8', env: { ...process.env, PATH: `${dir}${path.delimiter}${process.env.PATH}`, GITHUB_STEP_SUMMARY: resumen },
  });
  return { ...r, resumen: fs.existsSync(resumen) ? fs.readFileSync(resumen, 'utf8') : '' };
}

test('la línea de comandos: limpio sale 0, un alto sale 1, sin informe sale 2', () => {
  // El script lee las EXCEPCIONES reales, y una que no casa con ningún aviso frena. Así que el
  // informe «limpio» trae los avisos que hoy están declarados, y nada más.
  const declarados = A.EXCEPCIONES.map((e) => [e.paquete, [aviso(e.paquete, 'high', e.id)]]);
  const limpio = correr(JSON.stringify(informe(declarados)), 0);
  assert.strictEqual(limpio.status, 0, limpio.stdout + limpio.stderr);
  assert.match(limpio.stdout, /0 aviso\(s\) que frenan/);
  assert.match(limpio.resumen, /## Auditoría de dependencias/);
  const alto = correr(JSON.stringify(informe([...declarados, ['undici', [aviso('undici', 'high', ALTO)]]])));
  assert.strictEqual(alto.status, 1);
  assert.match(alto.stdout, /Frenan:\n {2}ALTO {2}undici/);
  for (const nada of ['', 'npm ERR! network request failed', JSON.stringify({ error: { code: 'EAI_AGAIN', summary: 'sin red' } })]) {
    const r = correr(nada);
    assert.strictEqual(r.status, 2, `«${nada}» -> ${r.status}`);
    assert.match(r.stderr, /no se pudo comprobar, y eso frena/);
  }
});

test('verificar.yml corre el freno, y sin continue-on-error', () => {
  const yml = fs.readFileSync(path.join(__dirname, '..', '.github', 'workflows', 'verificar.yml'), 'utf8')
    .replace(/^\s*#.*\n/gm, '');
  const paso = yml.split(/\n(?= {6}- )/).find((p) => /run: npm run auditar\b/.test(p));
  assert.ok(paso, 'verificar.yml no corre npm run auditar');
  assert.ok(!/continue-on-error/.test(paso), 'el paso de auditoría vuelve a ser informativo: un aviso alto no pondría nada en rojo');
  assert.ok(!/npm audit\b/.test(yml.replace(paso, '')), 'otro paso corre npm audit por su cuenta, fuera del freno');
});

test('la línea no promete un arreglo que npm audit fix no aplica', () => {
  // Con el aviso de braces del 2026-10-05, npm proponía bajar nodemon a la 1.14.10: un cambio de
  // versión mayor, que `npm audit fix` no hace. La línea decía «arreglo: npm audit fix».
  const via = [aviso('braces', 'high', ALTO)];
  const linea = (fix) => A.informar(A.evaluar(informe([['braces', via, fix]]), [], HOY));
  assert.match(linea(true), /\(arreglo: npm audit fix\)/);
  assert.match(linea({ name: 'nodemon', version: '1.14.10', isSemVerMajor: true }),
    /\(sin arreglo directo: npm solo propone nodemon 1\.14\.10, un cambio de versión mayor\)/);
  assert.match(linea({ name: 'nodemon', version: '3.1.15', isSemVerMajor: false }), /\(arreglo: npm audit fix, que deja nodemon en 3\.1\.15\)/);
  assert.match(linea(false), /\(sin arreglo publicado\)/);
});
