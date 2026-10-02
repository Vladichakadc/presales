'use strict';
// La vigía en dos jobs (2026-10-02): `medir` no tiene permisos y `publicar` no ejecuta nada de
// fuera, y valida lo que `medir` le pasa antes de copiarlo al repositorio. Estas pruebas fijan
// tres cosas: que la validación ACEPTA todo lo que la corrida de verdad produce (si no, la
// vigía se pondría en rojo sola, que es justo lo que le pasó tres semanas), que RECHAZA lo que
// solo una corrida manipulada produciría, y que la separación de permisos no se deshace sin
// que una prueba lo diga.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const V = require('../scripts/vigia-publicar.js');
const { aplicarAlLock, clasificar, claveDe, normalizarEntrada } = require('../scripts/vigia-fuentes.js');

const RAIZ = path.join(__dirname, '..');
const h = (c) => c.repeat(64);
const copia = (x) => JSON.parse(JSON.stringify(x));

// Un catálogo de fuentes sintético: una estable, una dinámica, una que se mide por primera vez
// y una que se retiró de FUENTES pero sigue en el lock.
const FUENTES = {
  acme: [
    { documento: 'Ficha estable', url: 'https://acme.example/ficha.pdf' },
    { documento: 'Página dinámica', url: 'https://acme.example/producto', estable: false },
    { documento: 'Fuente nueva', url: 'https://acme.example/nueva.pdf' },
    { documento: 'Página que pasa a texto', url: 'https://acme.example/eol' },
  ],
};
const fuentes = V.fuentesPorClave(FUENTES);
const [ESTABLE, DINAMICA, NUEVA, A_TEXTO] = FUENTES.acme.map((f) => claveDe('acme', f));
const RETIRADA = 'acme::https://acme.example/retirada.pdf';
const T0 = '2026-09-14T12:00:00.000Z';
const lockBase = () => ({
  revisado: T0,
  documentos: {
    [ESTABLE]: { documento: 'Ficha estable', hashVerificado: h('a'), bytes: 100, medido: T0 },
    [DINAMICA]: { documento: 'Página dinámica', hashVerificado: h('b'), bytes: 200, medido: T0, clase: 'texto' },
    [A_TEXTO]: { documento: 'Página que pasa a texto', hashVerificado: h('c'), bytes: 300, medido: T0 },
    [RETIRADA]: { documento: 'Fuente retirada', hashVerificado: h('d'), bytes: 400, medido: T0 },
  },
});

// Una semana de la vigía con las funciones de verdad (`clasificar` y `aplicarAlLock`).
function semana(lock, lecturas, ahora) {
  const resultados = lecturas.map(({ clave, hash, clase = 'bytes', estado = 'leido' }) => {
    const f = fuentes.get(clave);
    const r = estado === 'leido'
      ? { vendor: 'acme', documento: f.documento, url: f.url, estado, hash, hashVigilado: hash, clase, bytes: 123, clave, estable: f.estable }
      : { vendor: 'acme', documento: f.documento, url: f.url, estado, detalle: 'HTTP 403', clave, estable: f.estable };
    clasificar(r, normalizarEntrada(lock.documentos[clave]), ahora);
    return r;
  });
  return { nuevo: aplicarAlLock(copia(lock), resultados, ahora), resultados };
}

test('acepta todo lo que la corrida de verdad produce, también semana tras semana', () => {
  const viejo = lockBase();
  const { nuevo } = semana(viejo, [
    { clave: ESTABLE, hash: h('e') },                 // cambió: queda pendiente
    { clave: DINAMICA, hash: h('f'), clase: 'texto' }, // página dinámica: se absorbe
    { clave: NUEVA, hash: h('1') },                   // primera medición
    { clave: A_TEXTO, hash: h('2'), clase: 'texto' }, // cambio de clase: línea base nueva
  ], '2026-09-21T06:00:00.000Z');
  assert.ok(nuevo.documentos[ESTABLE].visto, 'el cambio quedó pendiente');
  assert.strictEqual(V.validarLock(viejo, nuevo, fuentes), null);
  // La semana siguiente sigue cambiado y el pendiente conserva su fecha original.
  const { nuevo: otro } = semana(nuevo, [{ clave: ESTABLE, hash: h('9') }, { clave: NUEVA, hash: h('1') }], '2026-09-28T06:00:00.000Z');
  assert.strictEqual(otro.documentos[ESTABLE].pendienteDesde, '2026-09-21T06:00:00.000Z');
  assert.strictEqual(V.validarLock(nuevo, otro, fuentes), null);
  // Y una fuente inalcanzable no toca nada.
  const { nuevo: igual } = semana(otro, [{ clave: ESTABLE, estado: 'inalcanzable' }], '2026-10-05T06:00:00.000Z');
  assert.strictEqual(V.validarLock(otro, igual, fuentes), null);
});

test('el lock que hay hoy en el repositorio pasa contra sí mismo y contra una semana simulada', () => {
  const real = JSON.parse(fs.readFileSync(path.join(RAIZ, 'server/seed/legacyData/fuentes.lock.json'), 'utf8'));
  const todas = V.fuentesPorClave();
  assert.strictEqual(V.validarLock(real, real, todas), null, 'ningún campo del lock real es desconocido');
  // Cada fuente vigilable, leída: lo que ya estaba, con su mismo hash; lo nuevo, por primera vez.
  const resultados = [...todas.entries()].map(([clave, f], i) => {
    const previo = normalizarEntrada(real.documentos[clave]);
    const hash = previo ? previo.hashVerificado : h(String(i % 10));
    const r = { vendor: f.vendor, documento: f.documento, url: f.url, estado: 'leido', hash, hashVigilado: hash, clase: (previo && previo.clase) || 'bytes', bytes: 1, clave, estable: f.estable };
    return clasificar(r, previo, '2026-10-05T06:00:00.000Z');
  });
  assert.strictEqual(V.validarLock(real, aplicarAlLock(copia(real), resultados, '2026-10-05T06:00:00.000Z'), todas), null);
});

test('rechaza lo que solo una corrida manipulada produciría', () => {
  const viejo = lockBase();
  const casos = [
    ['mover hashVerificado de una fuente estable', (n) => { n.documentos[ESTABLE].hashVerificado = h('e'); }, /--revisado/],
    ['borrar una entrada', (n) => { delete n.documentos[ESTABLE]; }, /desapareció/],
    ['inventar una fuente', (n) => { n.documentos['acme::https://otro.example/x'] = { documento: 'x', hashVerificado: h('1'), bytes: 1, medido: T0 }; }, /no declara/],
    ['tocar una fuente retirada', (n) => { n.documentos[RETIRADA].bytes = 1; }, /ya no está en FUENTES/],
    ['un campo desconocido', (n) => { n.documentos[ESTABLE].script = 'x'; }, /campo desconocido/],
    ['un hash que no es hex', (n) => { n.documentos[DINAMICA].hashVerificado = 'x'.repeat(64); }, /hashVerificado/],
    ['una primera medición ya pendiente', (n) => { n.documentos[NUEVA] = { documento: 'Fuente nueva', hashVerificado: h('1'), visto: { hash: h('2'), bytes: 1, medido: T0 }, pendienteDesde: T0 }; }, /primera medición/],
    ['un documento que no es el de FUENTES', (n) => { n.documentos[NUEVA] = { documento: '@alguien **x**', hashVerificado: h('1') }; }, /documento/],
    ['un documento enorme', (n) => { n.documentos[ESTABLE].documento = 'x'.repeat(5000); }, /documento/],
    ['un cambio de clase en una entrada que ya la declaraba', (n) => { n.documentos[DINAMICA].clase = 'bytes'; }, /cambio de clase/],
    ['un visto con campos de más', (n) => { n.documentos[ESTABLE].visto = { hash: h('e'), bytes: 1, medido: T0, script: 'x' }; }, /visto/],
    ['sin documentos', (n) => { delete n.documentos; }, /documentos/],
  ];
  for (const [nombre, estropear, motivo] of casos) {
    const nuevo = copia(viejo);
    estropear(nuevo);
    const dice = V.validarLock(viejo, nuevo, fuentes);
    assert.ok(dice && motivo.test(dice), `${nombre}: dio «${dice}»`);
  }
  // Reiniciar la fecha de un pendiente que sigue pendiente.
  const { nuevo: pendiente } = semana(viejo, [{ clave: ESTABLE, hash: h('e') }], '2026-09-21T06:00:00.000Z');
  const { nuevo: siguiente } = semana(pendiente, [{ clave: ESTABLE, hash: h('9') }], '2026-09-28T06:00:00.000Z');
  siguiente.documentos[ESTABLE].pendienteDesde = '2026-09-28T06:00:00.000Z';
  assert.match(V.validarLock(pendiente, siguiente, fuentes) || '', /reinició pendienteDesde/);
});

test('del informe solo se usa lo comprobable: la fuente sale de FUENTES y el detalle va saneado', () => {
  const d = {
    cambiados: [{ vendor: 'acme', url: 'https://acme.example/ficha.pdf', documento: '**inyectado** @alguien', hash: h('e'), hashVigilado: h('e'), hashPrevio: h('a'), bytes: 123, medidoAntes: T0 }],
    inalcanzables: [{ vendor: 'acme', url: 'https://acme.example/producto', detalle: 'HTTP 403\n\n`x` ' + 'y'.repeat(300) }],
  };
  const { error, informe } = V.informeDe(d, fuentes);
  assert.strictEqual(error, undefined);
  assert.strictEqual(informe.cambiados[0].documento, 'Ficha estable', 'el texto es el de FUENTES, no el del informe');
  assert.strictEqual(informe.cambiados[0].ahora, 'e'.repeat(16));
  const det = informe.inalcanzables[0].detalle;
  assert.ok(!det.includes('`') && !det.includes('\n') && det.length <= 200, det);
  for (const [nombre, malo] of [
    ['una fuente que no existe', { ...d, cambiados: [{ ...d.cambiados[0], url: 'https://otro.example' }] }],
    ['un hash inválido', { ...d, cambiados: [{ ...d.cambiados[0], hashVigilado: 'nope', hash: 'nope' }] }],
    ['sin la lista', { cambiados: [] }],
  ]) {
    assert.ok(V.informeDe(malo, fuentes).error, nombre);
  }
});

test('el cuerpo del issue: cambios, inalcanzables y qué pasó con el lock', () => {
  const { informe } = V.informeDe({
    cambiados: [{ vendor: 'acme', url: 'https://acme.example/ficha.pdf', hash: h('e'), hashVigilado: h('e'), hashPrevio: h('a'), bytes: 123, medidoAntes: T0 }],
    inalcanzables: [{ vendor: 'acme', url: 'https://acme.example/producto', detalle: 'HTTP 403' }],
  }, fuentes);
  const c = V.cuerpoIssue(informe, { estado: 'empujada', enlace: '[abrir el PR](https://x/compare/main...vigia/fuentes?expand=1).' });
  assert.match(c, /## Fuentes que cambiaron/);
  assert.match(c, /- \*\*acme\*\* — Ficha estable\n {2}- https:\/\/acme\.example\/ficha\.pdf\n {2}- medido antes: `aaaaaaaaaaaaaaaa` el 2026-09-14T12:00:00\.000Z\n {2}- ahora: `eeeeeeeeeeeeeeee` \(123 bytes\)/);
  assert.match(c, /- \*\*acme\*\* — Página dinámica: `HTTP 403`/);
  assert.match(c, /rama `vigia\/fuentes`.*\[abrir el PR\]/);
  assert.match(V.cuerpoIssue(informe, { estado: 'retenida' }), /no es del vigía y no se pisó/);
  assert.match(V.cuerpoIssue(informe, { estado: 'fallida' }), /No se pudo empujar la rama/);
  assert.ok(!/El lock de esta corrida/.test(V.cuerpoIssue(informe, { estado: 'sin-cambios' })));
  assert.match(c, /_Generado por \[Claude Code\]\(https:\/\/claude\.ai\/code\)_$/);
  assert.strictEqual(V.tituloIssue(informe), 'Fuentes del catálogo: 1 cambiaron');
  assert.strictEqual(V.tituloIssue({ cambiados: [], inalcanzables: [{}, {}] }), 'Fuentes del catálogo: 2 no se pudieron leer');
  assert.strictEqual(V.tituloIssue({ cambiados: [], inalcanzables: [] }), 'Vigía de fuentes: no se pudo guardar lo medido');
});

// La lección de las tres semanas: una corrida que falla sin escribir donde se mira no avisa.
test('todo fallo llega al issue, no solo los hallazgos', () => {
  const vacio = { cambiados: [], inalcanzables: [] };
  assert.strictEqual(V.hayQueAvisar(vacio, { estado: 'sin-cambios' }), false, 'nada que contar, nada que escribir');
  assert.strictEqual(V.hayQueAvisar(vacio, { estado: 'fallida' }), true, 'un push rechazado se cuenta aunque no haya hallazgos');
  assert.strictEqual(V.hayQueAvisar({ cambiados: [{}], inalcanzables: [] }, { estado: 'empujada' }), true);
  const c = V.cuerpoFallo('«acme::https://x»: la corrida movió hashVerificado `de` @alguien', 'https://ejemplo/corrida');
  assert.match(c, /^## La corrida de la vigía no se publicó/);
  assert.match(c, /Motivo: `«acme::https:\/\/x»: la corrida movió hashVerificado 'de' @alguien`/);
  assert.ok(!c.replace(/`[^`]*`/g, '').includes('@'), 'el motivo va en código: no menciona a nadie');
  assert.match(c, /Corrida: https:\/\/ejemplo\/corrida/);
  assert.match(c, /_Generado por \[Claude Code\]\(https:\/\/claude\.ai\/code\)_$/);
  assert.match(V.TITULO_FALLO, /no se publicó/);
});

test('principal: valida, copia el lock y deja el informe; si algo no pasa, no escribe nada', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'vigia-artefacto-'));
  const lockRepo = path.join(dir, 'lock-del-repo.json');
  const real = fs.readFileSync(path.join(RAIZ, 'server/seed/legacyData/fuentes.lock.json'), 'utf8');
  fs.writeFileSync(lockRepo, real);
  fs.mkdirSync(path.join(dir, 'server/seed/legacyData'), { recursive: true });
  const artefacto = path.join(dir, 'server/seed/legacyData/fuentes.lock.json');
  const nuevo = JSON.parse(real);
  nuevo.revisado = '2026-10-05T06:00:00.000Z';
  fs.writeFileSync(artefacto, JSON.stringify(nuevo));
  fs.writeFileSync(path.join(dir, 'vigia.json'), JSON.stringify({ cambiados: [], inalcanzables: [] }));
  const inf = V.principal(dir, lockRepo);
  assert.deepStrictEqual(inf, { cambiados: [], inalcanzables: [] });
  assert.strictEqual(JSON.parse(fs.readFileSync(lockRepo, 'utf8')).revisado, '2026-10-05T06:00:00.000Z', 'el lock se copió');
  assert.ok(fs.existsSync(path.join(dir, 'informe.json')));
  // Manipulado: no escribe nada.
  fs.writeFileSync(lockRepo, real);
  const primera = Object.keys(nuevo.documentos)[0];
  delete nuevo.documentos[primera];
  fs.writeFileSync(artefacto, JSON.stringify(nuevo));
  assert.throws(() => V.principal(dir, lockRepo), /desapareció/);
  assert.strictEqual(fs.readFileSync(lockRepo, 'utf8'), real, 'el lock del repositorio no se tocó');
});

test('el CLI del job que publica: si rechaza, sale con 1, deja el motivo y no toca el lock', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'vigia-rechazo-'));
  const lockReal = path.join(RAIZ, 'server/seed/legacyData/fuentes.lock.json');
  const antes = fs.readFileSync(lockReal, 'utf8');
  const nuevo = JSON.parse(antes);
  delete nuevo.documentos[Object.keys(nuevo.documentos)[0]];
  fs.mkdirSync(path.join(dir, 'server/seed/legacyData'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'server/seed/legacyData/fuentes.lock.json'), JSON.stringify(nuevo));
  fs.writeFileSync(path.join(dir, 'vigia.json'), JSON.stringify({ cambiados: [], inalcanzables: [] }));
  const r = spawnSync(process.execPath, [path.join(RAIZ, 'scripts/vigia-publicar.js'), dir], { encoding: 'utf8' });
  assert.strictEqual(r.status, 1, r.stdout + r.stderr);
  assert.match(JSON.parse(fs.readFileSync(path.join(dir, 'rechazo.json'), 'utf8')).motivo, /desapareció/);
  assert.strictEqual(fs.readFileSync(lockReal, 'utf8'), antes, 'el lock del repositorio no se tocó');
});

test('--resumen cuenta la misma corrida que el JSON, sin volver a la red', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'vigia-resumen-'));
  const nueva = { vendor: 'acme', documento: 'Fuente nueva', estado: 'leido', cambio: 'primera medición', bytes: 10 };
  const d = { resultados: [nueva, { ...nueva, documento: 'Otra nueva' }], cambiados: [], nuevos: [nueva, nueva], inalcanzables: [], pendientes: [] };
  fs.writeFileSync(path.join(dir, 'vigia.json'), JSON.stringify(d));
  const r = spawnSync(process.execPath, [path.join(RAIZ, 'scripts/vigia-fuentes.js'), '--resumen', path.join(dir, 'vigia.json')], { encoding: 'utf8' });
  assert.strictEqual(r.status, 0, r.stderr);
  assert.match(r.stdout, /0 cambio\(s\), 2 primera\(s\) medición\(es\), 0 inalcanzable\(s\)\./);
});

test('lo que corre en los dos jobs no necesita paquetes de npm: ninguno los instala', () => {
  const internos = new Set(require('module').builtinModules);
  for (const archivo of ['scripts/vigia-fuentes.js', 'scripts/vigia-publicar.js', 'server/seed/legacyData/fuentes.js', 'test/e2e/limites-reglas.js']) {
    const fuente = fs.readFileSync(path.join(RAIZ, archivo), 'utf8');
    for (const [, m] of fuente.matchAll(/require\(\s*['"]([^'"]+)['"]\s*\)/g)) {
      assert.ok(m.startsWith('.') || internos.has(m.replace(/^node:/, '')), `${archivo} requiere «${m}», que el job no tiene instalado`);
    }
  }
});

test('la separación de permisos no se deshace sin que esta prueba lo diga', () => {
  // Cada job, por su texto: el que ejecuta código de fuera no tiene permisos de escritura ni
  // guarda el token, y el que los tiene no instala nada.
  const jobs = (yml) => {
    // Sin comentarios: «Sin `npm ci` a propósito» no es instalar nada.
    const texto = fs.readFileSync(path.join(RAIZ, '.github/workflows', yml), 'utf8').replace(/^\s*#.*\n/gm, '');
    const cab = texto.slice(0, texto.indexOf('\njobs:'));
    const out = { cab };
    const partes = texto.slice(texto.indexOf('\njobs:')).split(/\n {2}(?=[a-z][\w-]*:\n)/);
    for (const p of partes.slice(1)) out[p.slice(0, p.indexOf(':'))] = p;
    return out;
  };
  const instala = /npm (?:ci|install)|npx /;
  const v = jobs('vigia-fuentes.yml');
  assert.match(v.cab, /permissions:\n {2}contents: read\n/);
  assert.ok(!/: write/.test(v.medir) && /persist-credentials: false/.test(v.medir) && !instala.test(v.medir), 'medir: sin escritura, sin token guardado y sin instalar');
  assert.ok(/contents: write/.test(v.publicar) && !instala.test(v.publicar), 'publicar: con permisos y sin instalar nada');
  assert.match(v.publicar, /path: \$\{\{ runner\.temp \}\}\/vigia/, 'el artefacto se baja fuera del repositorio');
  // El job y su paso del issue corren aunque algo falle: un rojo que no llega al issue no avisa.
  assert.ok((v.publicar.match(/if: \$\{\{ !cancelled\(\) \}\}/g) || []).length >= 2, 'publicar escribe en el issue aunque falle la medición');
  const l = jobs('limites.yml');
  assert.match(l.cab, /permissions:\n {2}contents: read\n/);
  assert.ok(!/: write/.test(l.recorrer) && /persist-credentials: false/.test(l.recorrer), 'recorrer: sin escritura');
  assert.ok(/issues: write/.test(l.informar) && !instala.test(l.informar), 'informar: con permisos y sin instalar nada');
});
