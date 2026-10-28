'use strict';
// `npm run candidatas` compara la huella de cada PDF servido con la copia de public/datasheets/
// de la que salieron las cifras (mejora aprobada el 2026-10-28). El 2026-10-28 la comparación se
// hizo a mano y destapó que la descarga de EdgeConnect era la Rev. 9 y la copia la Rev. 8: esto
// la deja escrita, y frena una `copia` que apunta a un archivo que ya no existe (diría «sin copia»
// en cada corrida sin que nadie lo mirara).
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { CASOS, compararConCopia, lineaCopia } = require('../scripts/probar-candidatas');

test('cada `copia` declarada existe y es un PDF', () => {
  const copias = CASOS.flatMap((c) => c.candidatas).filter((c) => c.copia).map((c) => c.copia);
  assert.ok(copias.length >= 2, 'las descargas de psnow declaran su copia');
  for (const ruta of copias) {
    const abs = path.join(__dirname, '..', ruta);
    assert.ok(fs.existsSync(abs), `no existe ${ruta}`);
    assert.strictEqual(fs.readFileSync(abs).subarray(0, 4).toString('latin1'), '%PDF', `${ruta} no es un PDF`);
  }
});

test('igual, distinta, sin PDF servido y sin copia se dicen distinto', () => {
  const leer = (r) => { if (r === 'falta.pdf') throw new Error('ENOENT'); return 'a'.repeat(64); };
  assert.strictEqual(compararConCopia('a'.repeat(64), 'x.pdf', leer).estado, 'igual');
  assert.strictEqual(compararConCopia('b'.repeat(64), 'x.pdf', leer).estado, 'distinta');
  assert.strictEqual(compararConCopia(null, 'x.pdf', leer).estado, 'sin-pdf');
  assert.strictEqual(compararConCopia('a'.repeat(64), 'falta.pdf', leer).estado, 'sin-copia');
  assert.strictEqual(compararConCopia('a'.repeat(64), undefined, leer), null);
  assert.match(lineaCopia(compararConCopia('a'.repeat(64), 'x.pdf', leer)), /MISMO DOCUMENTO/);
  assert.match(lineaCopia(compararConCopia('b'.repeat(64), 'x.pdf', leer)), /EDICION DISTINTA.*contrastar/);
});
