'use strict';
// EL LOCK DE LAS FIGURAS DE FORTINET (scripts/figuras-fortinet.js, 2026-11-09, mejora aprobada al
// cerrar el PR #148). Cada figura fg-*.webp y fwf-*.webp tiene que decir de qué documento, página y
// caja salió, y la que se sirve tiene que ser la del lock: una figura cambiada a mano, una sin
// caja o una que cita otra página que su pie dejaría de poder rehacerse con el mismo encuadre
// cuando Fortinet publique otra edición de la ficha. Rehacer necesita los PDF y Poppler, que CI no
// tiene; esta prueba solo lee.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { comprobar, paginasDelPie, sha256, traer, codigoDe, solapeDe, SOLAPE_MAXIMO, SOLAPES_DECLARADOS, medirVecinas, juzgarVecinas, vecinasDe } = require('../scripts/figuras-fortinet.js');

const RAIZ = path.join(__dirname, '..');
const VISTAS = JSON.parse(fs.readFileSync(path.join(RAIZ, 'public/data/fortinet-vistas-equipos.json'), 'utf8'));
const LOCK = JSON.parse(fs.readFileSync(path.join(RAIZ, 'scripts/figuras-fortinet.lock.json'), 'utf8'));
const leer = (ruta) => fs.readFileSync(path.join(RAIZ, 'public', ruta));
// La caja de la trasera del FortiWiFi 50G-5G-II en el lock de main antes del PR #188 (medida el 2026-11-09).
const LOCK_MAIN_50G5G_II_REAR = [34.91, 263.35, 374.88, 69.35];

test('las figuras que se sirven casan con su lock y su pie', () => {
  assert.deepStrictEqual(comprobar(VISTAS, LOCK, leer), []);
});

test('cada documento del lock dice de qué rama fuente/* salió y lleva su huella', () => {
  for (const [nombre, d] of Object.entries(LOCK.documentos)) {
    assert.match(d.rama, /^fuente\//, `${nombre}: sin rama fuente/*`);
    assert.ok(d.ruta && d.ruta.endsWith('.pdf'), `${nombre}: sin ruta dentro de la rama`);
    assert.match(d.sha256, /^[0-9a-f]{64}$/, `${nombre}: sin huella`);
  }
});

test('cada caja lleva cómo se midió y la diferencia de referencia para rehacerla', () => {
  for (const [ruta, f] of Object.entries(LOCK.figuras)) {
    assert.match(f.medido || '', /correlación 0\.\d+/, `${ruta}: no dice cómo se midió su caja`);
    assert.ok(typeof f.diferencia === 'number' && f.diferencia >= 0, `${ruta}: sin diferencia de referencia`);
    assert.ok(Array.isArray(f.tamano) && f.tamano.every((n) => Number.isInteger(n) && n > 0), `${ruta}: tamaño mal formado`);
  }
});

test('las páginas de un pie salen en orden, y la trasera de un pie con dos citas es la segunda', () => {
  assert.deepStrictEqual(paginasDelPie('Datasheet FortiGate 90G Series, p. 7 «Hardware» — «FortiGate 90G»'), [7]);
  assert.deepStrictEqual(paginasDelPie('Guide, p. 8 «front panel» y p. 12 «back panel»'), [8, 12]);
  assert.deepStrictEqual(paginasDelPie('sin cita'), []);
});

// Un mapa y un lock mínimos para comprobar cada freno por separado.
function caso() {
  const datos = Buffer.from('figura');
  const vistas = { 'FortiGate X': { front: '/img/equipos/fg-x-front.webp', rear: '/img/equipos/fg-x-rear.webp',
    fuente: 'Datasheet FortiGate X Series, p. 7 «Hardware» — «FortiGate X»' } };
  const fig = (pagina, y = 2) => ({ documento: 'x.pdf', pagina, caja: [1, y, 3, 4], tamano: [10, 5], sha256: sha256(datos) });
  const lock = { documentos: { 'x.pdf': { rama: 'fuente/x', ruta: 'x.pdf', url: 'https://www.fortinet.com/x.pdf',
    urlDe: 'rama fuente/x, informe.json', sha256: 'a'.repeat(64) } },
    figuras: { '/img/equipos/fg-x-front.webp': fig(7), '/img/equipos/fg-x-rear.webp': fig(7, 20) } };
  return { vistas, lock, leer: () => datos };
}

test('el caso mínimo pasa limpio', () => {
  const { vistas, lock, leer: l } = caso();
  assert.deepStrictEqual(comprobar(vistas, lock, l), []);
});

test('frena una figura sin entrada en el lock', () => {
  const { vistas, lock, leer: l } = caso();
  delete lock.figuras['/img/equipos/fg-x-rear.webp'];
  assert.match(comprobar(vistas, lock, l).join('\n'), /no está en el lock/);
});

test('frena una figura cambiada sin pasar por el comando', () => {
  const { vistas, lock } = caso();
  assert.match(comprobar(vistas, lock, () => Buffer.from('otra')).join('\n'), /cambió sin pasar por este comando/);
});

test('frena una página del lock que no es la que cita el pie', () => {
  const { vistas, lock, leer: l } = caso();
  lock.figuras['/img/equipos/fg-x-front.webp'].pagina = 9;
  assert.match(comprobar(vistas, lock, l).join('\n'), /el pie de FortiGate X cita la p\. 7/);
});

test('frena una entrada del lock que ningún modelo usa, y un documento sin declarar', () => {
  const { vistas, lock, leer: l } = caso();
  lock.figuras['/img/equipos/fg-y-front.webp'] = { ...lock.figuras['/img/equipos/fg-x-front.webp'], documento: 'y.pdf' };
  const p = comprobar(vistas, lock, l).join('\n');
  assert.match(p, /ningún modelo la usa/);
  assert.match(p, /«y\.pdf» no está declarado/);
});

test('una figura compartida por dos modelos se comprueba una sola vez', () => {
  const { vistas, lock } = caso();
  vistas['FortiGate X1'] = { ...vistas['FortiGate X'] };
  assert.strictEqual(comprobar(vistas, lock, () => Buffer.from('otra')).length, 2);
});

test('frena un documento sin URL de Fortinet o sin la rama de la que salió', () => {
  const { vistas, lock, leer: l } = caso();
  lock.documentos['x.pdf'].url = 'http://otro.example/x.pdf';
  delete lock.documentos['x.pdf'].urlDe;
  const p = comprobar(vistas, lock, l).join('\n');
  assert.match(p, /x\.pdf: sin URL https de Fortinet/);
  assert.match(p, /x\.pdf: la URL no dice de qué rama/);
});

test('cada documento del lock real trae su URL y de dónde salió', () => {
  const real = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'scripts', 'figuras-fortinet.lock.json'), 'utf8'));
  for (const [nombre, d] of Object.entries(real.documentos)) {
    assert.match(d.url, /^https:\/\//, nombre);
    assert.ok(d.urlDe.includes(d.rama), `${nombre}: urlDe cita su rama ${d.rama}`);
  }
});

// EL VIGÍA (2026-11-09): sin red. `fetch` y `comparar` simulados; lo que se prueba es la regla.
const PDF = Buffer.from('%PDF-1.7 ficha');
const respuesta = (buf, status = 200) => ({ ok: status < 400, status, arrayBuffer: async () => buf });
const correr = (lock, fetch, extra = {}) => traer({ lock, carpeta: fs.mkdtempSync(path.join(os.tmpdir(), 'figtraer-')),
  fetch, herramientas: () => null, comparar: () => ({ diferencia: 2, tope: 5, igual: true }), ...extra });

test('traer: la misma edición no rehace nada; otra edición rehace sus figuras', async () => {
  const { lock } = caso();
  lock.documentos['x.pdf'].sha256 = sha256(PDF);
  let rehechas = 0;
  const comparar = () => { rehechas++; return { diferencia: 2, tope: 5, igual: true }; };
  const misma = await correr(lock, async () => respuesta(PDF), { comparar });
  assert.strictEqual(misma.documentos[0].estado, 'igual');
  assert.strictEqual(rehechas, 0);
  assert.strictEqual(codigoDe(misma), 0);
  const otra = await correr(lock, async () => respuesta(Buffer.from('%PDF-1.7 otra')), { comparar });
  assert.strictEqual(otra.documentos[0].estado, 'otraEdicion');
  assert.deepStrictEqual(otra.documentos[0].figuras.map((f) => f.resultado), ['igual', 'igual']);
  assert.strictEqual(codigoDe(otra), 1);
});

test('traer: una figura que ya no casa sale DISTINTA', async () => {
  const { lock } = caso();
  const inf = await correr(lock, async () => respuesta(PDF), { comparar: () => ({ diferencia: 60, tope: 5, igual: false }) });
  assert.ok(inf.documentos[0].figuras.every((f) => f.resultado === 'distinta' && f.diferencia === 60));
  assert.strictEqual(codigoDe(inf), 1);
});

test('traer: lo que no se pudo bajar o no es un PDF es un error, nunca «sin cambios»', async () => {
  const { lock } = caso();
  for (const fetch of [async () => respuesta(PDF, 403), async () => respuesta(Buffer.from('<html>')), async () => { throw new Error('ECONNRESET'); }]) {
    const inf = await correr(lock, fetch);
    assert.strictEqual(inf.documentos[0].estado, 'error');
    assert.strictEqual(codigoDe(inf), 2);
  }
  const sinHerramientas = await correr(lock, async () => respuesta(PDF), { herramientas: () => 'pdftoppm' });
  assert.match(sinHerramientas.documentos[0].figuras[0].error, /falta pdftoppm/);
  assert.strictEqual(codigoDe(sinHerramientas), 2);
});

// DOS CAJAS DE LA MISMA PÁGINA NO SE PISAN (2026-11-12, mejora propuesta al cerrar el PR #188). Los
// dos casos son los que pasaron de verdad: cajas del lock de main antes del PR #188, cuyas figuras
// servidas eran las buenas pero cuyas cajas caían en el dibujo del FortiGate de la misma página.
function casoSolape(cajaA, cajaB, paginaB = 7) {
  const { vistas, lock, leer: l } = caso();
  vistas['FortiWiFi X'] = { front: '/img/equipos/fwf-x-front.webp', rear: '/img/equipos/fwf-x-rear.webp',
    fuente: `Datasheet FortiGate X Series, p. ${paginaB} «Hardware» — «FortiWiFi X»` };
  lock.figuras['/img/equipos/fg-x-front.webp'].caja = cajaA;
  lock.figuras['/img/equipos/fwf-x-front.webp'] = { ...lock.figuras['/img/equipos/fg-x-front.webp'], pagina: paginaB, caja: cajaB };
  lock.figuras['/img/equipos/fwf-x-rear.webp'] = { ...lock.figuras['/img/equipos/fg-x-rear.webp'], pagina: paginaB, caja: [1, 900, 3, 4] };
  return { vistas, lock, l };
}

test('frena dos cajas del mismo documento y página que se solapan: el frontal del FortiWiFi 50G antes del PR #188', () => {
  // fg-50g-front y fwf-50g-front, p. 7 de la ficha FGFWF-50G-DAT-R17.
  const { vistas, lock, l } = casoSolape([35.16, 174.65, 373.92, 68.22], [35.29, 174.81, 373.92, 68.01]);
  const p = comprobar(vistas, lock, l).join('\n');
  assert.match(p, /fg-x-front\.webp y \/img\/equipos\/fwf-x-front\.webp: sus cajas de la p\. 7 de «x\.pdf» se solapan un 100 %/);
  assert.match(p, /no por la correlación/);
});

test('frena el otro caso real: la trasera del FortiWiFi 50G-5G-II con la caja de la del FortiGate 50G-5G', () => {
  // fwf-50g-5g-ii-rear del lock de main (y = 263,35) y fg-50g-5g-rear tal como la midió el PR #188, p. 10.
  const viejaFwf = LOCK_MAIN_50G5G_II_REAR;
  assert.ok(solapeDe([34.78, 263.22, 374.76, 69.72], viejaFwf) > SOLAPE_MAXIMO);
  const { vistas, lock, l } = casoSolape([34.78, 263.22, 374.76, 69.72], viejaFwf);
  assert.match(comprobar(vistas, lock, l).join('\n'), /se solapan un \d+ %/);
});

test('no cuenta cajas de otra página, ni las que se tocan sin pisarse, ni una figura que comparten dos modelos', () => {
  const limpio = (c) => comprobar(c.vistas, c.lock, c.l);
  assert.deepStrictEqual(limpio(casoSolape([1, 2, 3, 4], [1, 2, 3, 4], 8)), []);
  assert.strictEqual(solapeDe([0, 0, 10, 10], [0, 5, 10, 10]), 0.5); // la mitad justa no frena
  assert.deepStrictEqual(limpio(casoSolape([0, 0, 10, 10], [0, 5, 10, 10])), []);
  assert.strictEqual(solapeDe([0, 0, 10, 10], [10, 0, 10, 10]), 0);
  const { vistas, lock, leer: l } = caso();
  vistas['FortiGate X-SSD'] = { ...vistas['FortiGate X'] };
  assert.deepStrictEqual(comprobar(vistas, lock, l), []);
});

test('un solape declarado pasa con su motivo; sin motivo, o si ya no se solapa, avisa', () => {
  const { vistas, lock, l } = casoSolape([1, 2, 3, 4], [1, 2, 3, 4]);
  const clave = '/img/equipos/fg-x-front.webp|/img/equipos/fwf-x-front.webp';
  assert.deepStrictEqual(comprobar(vistas, lock, l, { [clave]: 'la ficha dibuja una sola unidad para las dos' }), []);
  assert.match(comprobar(vistas, lock, l, { [clave]: ' ' }).join('\n'), /solape declarado sin motivo/);
  lock.figuras['/img/equipos/fwf-x-front.webp'].caja = [1, 500, 3, 4];
  assert.match(comprobar(vistas, lock, l, { [clave]: 'motivo' }).join('\n'), /ya no se solapan; sobra/);
});

test('los solapes declarados del lock real llevan su motivo', () => {
  for (const [clave, motivo] of Object.entries(SOLAPES_DECLARADOS)) {
    assert.match(clave, /^\/img\/equipos\/[^|]+\|\/img\/equipos\/[^|]+$/, clave);
    assert.ok(String(motivo).trim().length > 20, `${clave}: motivo`);
  }
});

// LA CAJA, CONTRA LAS FIGURAS VECINAS (2026-11-12, mejora propuesta al cerrar el PR #191). --rehacer
// compara cada recorte con las demás figuras de su documento en lo que las distingue.
test('una caja es dudosa si, en lo que las distingue, el recorte se parece más a la vecina; la que no se distingue se dice aparte', () => {
  const j = juzgarVecinas([
    { ruta: 'a', propia: 3, vecina: 69.7, pixeles: 202 }, // lo medido en el frontal del FortiWiFi 50G con su caja buena
    { ruta: 'b', propia: 69.1, vecina: 3.1, pixeles: 202 }, // y con la caja del FortiGate 50G, la de antes del PR #188
    { ruta: 'c', indistinguible: true, pixeles: 0 }, // las traseras del 30G: el mismo dibujo
  ]);
  assert.deepStrictEqual(j.dudosas.map((m) => m.ruta), ['b']);
  assert.deepStrictEqual(j.indistinguibles.map((m) => m.ruta), ['c']);
  assert.deepStrictEqual(juzgarVecinas([]), { dudosas: [], indistinguibles: [] });
});

test('las vecinas de una figura son las demás de su documento que tienen archivo', () => {
  const figuras = { '/a': { documento: 'x.pdf' }, '/b': { documento: 'x.pdf' }, '/c': { documento: 'y.pdf' }, '/d': { documento: 'x.pdf' } };
  assert.deepStrictEqual(vecinasDe('/a', figuras, (r) => r !== '/d').map((v) => v.ruta), ['/b']);
});

// La medición de verdad, con las figuras servidas (sin PDF): la figura del FortiGate 50G, puesta como
// «recorte» del FortiWiFi 50G, es justo lo que daba su caja errada. Necesita Python con Pillow y numpy.
const hayPillow = require('child_process').spawnSync('python3', ['-I', '-c', 'import PIL, numpy']).status === 0;
test('medirVecinas: el dibujo del FortiGate 50G como recorte del FortiWiFi 50G sale dudoso; el suyo, no', { skip: !hayPillow && 'sin Python con Pillow y numpy' }, () => {
  const en = (n) => ({ ruta: `/img/equipos/${n}.webp`, archivo: path.join(RAIZ, 'public/img/equipos', `${n}.webp`) });
  const fwf = en('fwf-50g-front');
  const fg = en('fg-50g-front');
  const mal = juzgarVecinas(medirVecinas(fg.archivo, fwf, [fg]));
  assert.deepStrictEqual(mal.dudosas.map((m) => m.ruta), [fg.ruta]);
  assert.ok(mal.dudosas[0].propia - mal.dudosas[0].vecina > 30, 'la distancia no es de ruido');
  const bien = juzgarVecinas(medirVecinas(fwf.archivo, fwf, [fg]));
  assert.deepStrictEqual(bien, { dudosas: [], indistinguibles: [] });
  // Las traseras del 30G son el mismo dibujo: no se pueden distinguir, y se dice.
  const iguales = juzgarVecinas(medirVecinas(en('fg-30g-rear').archivo, en('fg-30g-rear'), [en('fwf-30g-rear')]));
  assert.strictEqual(iguales.indistinguibles.length, 1);
  assert.strictEqual(iguales.dudosas.length, 0);
});
