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
const { comprobar, paginasDelPie, sha256 } = require('../scripts/figuras-fortinet.js');

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
  const lock = { documentos: { 'x.pdf': { rama: 'fuente/x', ruta: 'x.pdf', sha256: 'a'.repeat(64) } },
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
