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
const { comprobar, paginasDelPie, sha256, traer, codigoDe } = require('../scripts/figuras-fortinet.js');

const RAIZ = path.join(__dirname, '..');
const VISTAS = JSON.parse(fs.readFileSync(path.join(RAIZ, 'public/data/fortinet-vistas-equipos.json'), 'utf8'));
const LOCK = JSON.parse(fs.readFileSync(path.join(RAIZ, 'scripts/figuras-fortinet.lock.json'), 'utf8'));
const leer = (ruta) => fs.readFileSync(path.join(RAIZ, 'public', ruta));

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
  const fig = (pagina) => ({ documento: 'x.pdf', pagina, caja: [1, 2, 3, 4], tamano: [10, 5], sha256: sha256(datos) });
  const lock = { documentos: { 'x.pdf': { rama: 'fuente/x', ruta: 'x.pdf', url: 'https://www.fortinet.com/x.pdf',
    urlDe: 'rama fuente/x, informe.json', sha256: 'a'.repeat(64) } },
    figuras: { '/img/equipos/fg-x-front.webp': fig(7), '/img/equipos/fg-x-rear.webp': fig(7) } };
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
