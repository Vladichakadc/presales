'use strict';
// La vigía en dos jobs (2026-10-02): `medir` no tiene permisos y `publicar` no ejecuta nada de
// fuera, y valida lo que `medir` le pasa antes de copiarlo al repositorio. Estas pruebas fijan
// dos cosas: que la validación ACEPTA todo lo que la corrida de verdad produce (si no, la
// vigía se pondría en rojo sola, que es justo lo que le pasó tres semanas), y que RECHAZA lo
// que solo una corrida manipulada produciría. La separación de permisos de los workflows la
// guarda `test/workflows-permisos.test.js`.
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
  assert.deepStrictEqual(inf, { cambiados: [], inalcanzables: [], reaparecidas: [] });
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

// EL CONTRASTE DEL PRODUCT MATRIX EN EL ISSUE (2026-10-14). Lo deja el job `contrastar` tras leer
// un PDF de fortinet.com: se valida campo a campo como vigia.json, y el issue dice qué cifras
// cambiaron en vez de solo «el documento cambió».
const MATRIX_OK = {
  edicion: 'PROMTX-2026-R178-NOV', hash: h('a'), mismoDocumento: true, coinciden: 620,
  difieren: [{ id: '400G', campo: 'policies', catalogo: 30000, documento: 50000, texto: '50 000' }],
  sinLeer: [], nuevos: [], faltan: [], noEnCatalogo: [],
};

test('el contraste del Product Matrix se valida antes de escribirlo y el issue dice qué cambió', () => {
  const { matrix } = V.resumenMatrix(copia(MATRIX_OK));
  assert.strictEqual(matrix.limpio, false);
  assert.match(matrix.url, /Fortinet_Product_Matrix\.pdf$/, 'la URL sale de fuentes.js');
  assert.ok(V.hayQueAvisar({ cambiados: [], inalcanzables: [] }, { estado: 'sin-cambios' }, matrix));
  assert.match(V.tituloIssue({ cambiados: [], inalcanzables: [] }, matrix), /Product Matrix de Fortinet: 1 cifra/);
  const cuerpo = V.cuerpoIssue({ cambiados: [], inalcanzables: [] }, null, matrix);
  assert.match(cuerpo, /PROMTX-2026-R178-NOV/);
  assert.match(cuerpo, /\| 400G \| policies \| 30000 \| 50000 \|/);
  assert.match(cuerpo, /Nada se ha escrito en el catálogo/);
  // Todo casa: se dice cómo marcarlo revisado, y no hace falta escribir en el issue por él.
  const limpio = V.resumenMatrix({ ...copia(MATRIX_OK), difieren: [] }).matrix;
  assert.strictEqual(limpio.limpio, true);
  assert.ok(!V.hayQueAvisar({ cambiados: [], inalcanzables: [] }, { estado: 'sin-cambios' }, limpio));
  assert.match(V.cuerpoIssue({ cambiados: [], inalcanzables: [] }, null, limpio), /--revisado fortinet https:\/\/www\.fortinet\.com/);
  // Pedido a mano sobre la edición ya verificada: no se invita a marcar revisado lo que ya lo está.
  const aMano = V.resumenMatrix({ ...copia(MATRIX_OK), difieren: [] }, { aDemanda: true }).matrix;
  assert.match(V.cuerpoIssue({ cambiados: [], inalcanzables: [] }, null, aMano), /sigue casando con el catálogo/);
  assert.ok(!/--revisado/.test(V.cuerpoIssue({ cambiados: [], inalcanzables: [] }, null, aMano)));
  // Un PDF que cambió entre las dos descargas se avisa.
  assert.match(V.cuerpoIssue({ cambiados: [], inalcanzables: [] }, null, V.resumenMatrix({ ...copia(MATRIX_OK), mismoDocumento: false }).matrix), /no es el que midió el vigía/);
});

test('rechaza un contraste que solo produciría un artefacto manipulado, y un fallo también llega al issue', () => {
  const malos = [
    null, [], { ...MATRIX_OK, coinciden: -1 }, { ...MATRIX_OK, difieren: 'x' },
    { ...MATRIX_OK, edicion: '<script>' }, { ...MATRIX_OK, hash: 'abc' },
    { ...MATRIX_OK, difieren: [{ id: '../x', campo: 'policies' }] },
    { ...MATRIX_OK, nuevos: ['FG-<b>'] }, { ...MATRIX_OK, mismoDocumento: 'si' },
  ];
  for (const m of malos) assert.ok(V.resumenMatrix(m).error, JSON.stringify(m));
  // Lo que se copia al issue va acortado y sin caracteres de marcado.
  const largo = V.resumenMatrix({ ...copia(MATRIX_OK), difieren: [{ id: '90G', campo: 'tp', catalogo: 1, documento: `<img src=x>${'z'.repeat(500)}` }] }).matrix;
  assert.ok(!/[<>]/.test(largo.difieren[0].documento) && largo.difieren[0].documento.length <= 80);
  const fallo = { error: 'el job contrastar no terminó (descarga o lectura del PDF)' };
  assert.ok(V.hayQueAvisar({ cambiados: [], inalcanzables: [] }, null, fallo));
  assert.match(V.cuerpoIssue({ cambiados: [], inalcanzables: [] }, null, fallo), /no se pudo usar/);
});

// FUENTES RETIRADAS (2026-10-14). Una fuente que fuentes.js declara `retirada` y sigue sin leerse
// no vuelve cada lunes al issue; si un día se lee, se avisa: el fabricante la republicó.
test('una fuente retirada que sigue caída no avisa; si reaparece, sí', () => {
  const { conRetirada } = require('../scripts/vigia-fuentes.js');
  const f = { documento: 'Ficha vieja', url: 'https://acme.example/vieja.pdf', retirada: { fecha: '2026-10-13', motivo: '404' } };
  const caida = conRetirada({ vendor: 'acme', documento: f.documento, url: f.url, estado: 'inalcanzable', detalle: 'HTTP 404' }, f);
  assert.strictEqual(caida.estado, 'retirada');
  assert.match(caida.detalle, /retirada el 2026-10-13: HTTP 404/);
  const vuelve = conRetirada({ vendor: 'acme', url: f.url, estado: 'leido' }, f);
  assert.strictEqual(vuelve.reaparecio, true);
  assert.strictEqual(conRetirada({ estado: 'inalcanzable' }, { documento: 'x' }).estado, 'inalcanzable', 'sin retirada nada cambia');
  // En el issue: solo si FUENTES la declara retirada.
  const fuentes = V.fuentesPorClave({ acme: [f, { documento: 'Viva', url: 'https://acme.example/viva.pdf' }] });
  const ok = V.informeDe({ cambiados: [], inalcanzables: [], reaparecidas: [{ vendor: 'acme', url: f.url }] }, fuentes);
  assert.strictEqual(ok.informe.reaparecidas.length, 1);
  assert.ok(V.hayQueAvisar(ok.informe, null));
  assert.match(V.cuerpoIssue(ok.informe, null), /Fuentes retiradas que vuelven a publicarse/);
  assert.ok(V.informeDe({ cambiados: [], inalcanzables: [], reaparecidas: [{ vendor: 'acme', url: 'https://acme.example/viva.pdf' }] }, fuentes).error);
  // La del A816 E está declarada así en el catálogo de fuentes real.
  const { FUENTES } = require('../server/seed/legacyData/fuentes');
  const a816 = FUENTES.huawei.find((x) => /A816 E Datasheet/.test(x.documento));
  assert.match(a816.retirada.fecha, /^\d{4}-\d{2}-\d{2}$/);
  for (const lista of Object.values(FUENTES)) {
    for (const x of lista) if (x.retirada) assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(x.retirada.fecha) && x.retirada.motivo, x.documento);
  }
});

// EL CONTRASTE DE LAS FICHAS DE CISCO (2026-10-21). Lo deja un job que trae páginas de fuera:
// se valida antes de escribirlo, y la URL de cada ficha tiene que ser una que fuentes.js declare.
test('el contraste de las fichas de Cisco se valida, y el issue dice qué cifra cambió o qué ficha no se leyó', () => {
  const REALES = require('../server/seed/legacyData/fuentes.js').FUENTES;
  const url = REALES.cisco.find((f) => /8200 Series Secure Router Data Sheet/.test(f.documento)).url;
  const base = { fichas: [{ url, documento: 'x', error: null, casan: 56, difieren: [], sinLeer: [], sinColumna: [] }] };
  const limpio = V.resumenCisco(copia(base)).cisco;
  assert.ok(limpio.limpio && limpio.casan === 56);
  assert.ok(!V.hayQueAvisar({ cambiados: [], inalcanzables: [] }, { estado: 'sin-cambios' }, null, limpio), 'todo casa: no hace falta escribir');
  const cambio = copia(base);
  cambio.fichas[0].difieren = [{ modelo: 'Cisco Secure Router C8211-G2', campo: 'fwd', catalogo: 5600, ficha: 6000, etiqueta: 'Forwarding (512B)' }];
  const c = V.resumenCisco(cambio).cisco;
  assert.ok(V.hayQueAvisar({ cambiados: [], inalcanzables: [] }, { estado: 'sin-cambios' }, null, c));
  assert.match(V.tituloIssue({ cambiados: [], inalcanzables: [] }, null, c), /Fichas de Cisco y Meraki: 1 cifra/);
  const cuerpo = V.cuerpoIssue({ cambiados: [], inalcanzables: [] }, null, null, c);
  assert.match(cuerpo, /\| Cisco Secure Router C8211-G2 \| fwd \| 5600 \| 6000 \| Forwarding \(512B\) \|/);
  assert.match(cuerpo, /Nada se ha escrito en el catálogo/);
  // El documento sale de fuentes.js, no del artefacto.
  assert.match(cuerpo, /8200 Series Secure Router Data Sheet|casan 56/);
  // Una ficha que no se pudo traer, o que no dio ninguna celda, no es «sin cambios».
  const caida = copia(base); caida.fichas[0].error = 'HTTP 403'; caida.fichas[0].casan = 0;
  const cc = V.resumenCisco(caida).cisco;
  assert.ok(!cc.limpio && V.hayQueAvisar({ cambiados: [], inalcanzables: [] }, null, null, cc));
  assert.match(V.cuerpoIssue({ cambiados: [], inalcanzables: [] }, null, null, cc), /no se pudieron usar[\s\S]*HTTP 403/);
  const vacia = copia(base); vacia.fichas[0].casan = 0;
  assert.ok(!V.resumenCisco(vacia).cisco.limpio, 'una ficha sin ninguna celda avisa');
  // Lo que solo un artefacto manipulado traería se rechaza.
  const malos = [null, {}, { fichas: [] }, { fichas: [{ ...base.fichas[0], url: 'https://ejemplo.invalid/x' }] },
    { fichas: [{ ...base.fichas[0], casan: -1 }] }, { fichas: [{ ...base.fichas[0], difieren: [{ modelo: '<script>', campo: 'fwd' }] }] },
    { fichas: [{ ...base.fichas[0], sinColumna: ['../../x'] }] }];
  for (const m of malos) assert.ok(V.resumenCisco(m).error, JSON.stringify(m));
  // Y un job que no terminó también llega al issue.
  const fallo = { error: 'el job contrastar_cisco no terminó (failure)' };
  assert.ok(V.hayQueAvisar({ cambiados: [], inalcanzables: [] }, null, null, fallo));
  assert.match(V.cuerpoIssue({ cambiados: [], inalcanzables: [] }, null, null, fallo), /no se pudo usar/);
});
