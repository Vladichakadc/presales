'use strict';
// LOS ACCESOS DEL PORTAL LLEVAN EL COLOR DE LA TARJETA DE SU FABRICANTE (2026-10-15).
//
// Bajo el titulo del portal hay un boton por dimensionador. Su color vivia en un `style=` por
// boton, escrito a mano y aparte del de las tarjetas (`VENDORS` en `public/js/index.js`, que
// pinta el icono con `accentTxt || accent`). Ahora va en una clase `acceso-<id>` del `<style>` de
// `index.html`, y esta prueba casa cada una con su tarjeta: cambiar el color de un fabricante en
// un sitio y no en el otro se frena aqui. Starlink y la guia no tienen tarjeta (Starlink queda
// fuera de los fabricantes a proposito: ver CLAUDE.md) y se declaran en PROPIOS.
//
// Se leen los archivos en vez de ejecutarlos, como `guia-topologias.test.js`: `index.js` pinta al
// cargar y `VENDORS` es un `const` del script, no cuelga de `window`. Si la lectura no encuentra
// nada, la prueba falla en vez de pasar vacia.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const publico = path.join(__dirname, '..', 'public');
const html = fs.readFileSync(path.join(publico, 'index.html'), 'utf8');
const indexJs = fs.readFileSync(path.join(publico, 'js', 'index.js'), 'utf8');

// Accesos sin tarjeta de fabricante: su color se declara solo en el CSS.
const PROPIOS = new Set(['guia', 'starlink']);

function coloresDeTarjetas() {
  const colores = new Map();
  for (const m of indexJs.matchAll(/\{id:'([a-z]+)',name:'[^']*',accent:'(#[0-9A-Fa-f]{6})'(?:,accentTxt:'(#[0-9A-Fa-f]{6})')?/g)) {
    colores.set(m[1], (m[3] || m[2]).toUpperCase());
  }
  return colores;
}

function coloresDeAccesos() {
  const colores = new Map();
  for (const m of html.matchAll(/\.acceso-([a-z]+)\{--acceso:([^}]+)\}/g)) colores.set(m[1], m[2].trim().toUpperCase());
  return colores;
}

function botonesDeAccesos() {
  const bloque = html.match(/<div class="accesos">([\s\S]*?)<\/div>/);
  assert.ok(bloque, 'index.html ya no tiene el bloque <div class="accesos">');
  return [...bloque[1].matchAll(/<a\b([^>]*)>/g)].map(m => m[1]);
}

test('cada acceso de fabricante lleva el color de su tarjeta del portal', () => {
  const tarjetas = coloresDeTarjetas();
  const accesos = coloresDeAccesos();
  assert.ok(tarjetas.size >= 7, `se leyeron ${tarjetas.size} tarjetas de index.js`);
  assert.ok(accesos.size >= 7, `se leyeron ${accesos.size} clases acceso-* de index.html`);
  for (const [id, color] of accesos) {
    if (PROPIOS.has(id)) continue;
    assert.ok(tarjetas.has(id), `acceso-${id} no tiene tarjeta en VENDORS: declararlo en PROPIOS o corregir el id`);
    assert.strictEqual(color, tarjetas.get(id), `acceso-${id} no lleva el color de la tarjeta de ${id}`);
  }
});

test('los accesos no vuelven a llevar el color en linea, y cada clase usada existe', () => {
  const botones = botonesDeAccesos();
  const accesos = coloresDeAccesos();
  assert.ok(botones.length >= 8, `se leyeron ${botones.length} botones`);
  for (const atributos of botones) {
    assert.ok(!/\bstyle=/.test(atributos), `un acceso vuelve a llevar style=: ${atributos.trim()}`);
    const clase = atributos.match(/\bacceso-([a-z]+)\b/);
    if (clase) assert.ok(accesos.has(clase[1]), `acceso-${clase[1]} se usa y no se declara en el <style>`);
  }
});
