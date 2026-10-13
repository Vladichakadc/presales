'use strict';
// FIGURAS OFICIALES DEL DIMENSIONADOR MIKROTIK (2026-10-13, petición del dueño: «incluye las
// gráficas de los equipos en alta definición de la parte frontal y posterior de cada equipo»).
//
// Lo mismo que vigilan las de Aruba, Fortinet y Huawei —una ruta que no existe, un modelo que el
// catálogo ya no tiene, una figura sin procedencia— y lo propio de MikroTik:
//   1. salen de la galería «Product images» de la ficha oficial, que NO rotula qué cara es cada
//      foto: la cara se decidió mirándolas, y el pie dice si la vista es recta o en perspectiva;
//   2. la galería mezcla el equipo con accesorios (tornillos, fuente, cable, escuadras) e
//      infografías: ninguna de esas puede servirse como el equipo;
//   3. alta definición de verdad: WebP sin pérdida a la resolución del PNG oficial (solo recortado
//      el margen blanco), nunca reescalada.
// LO QUE NO SE AFIRMA: que todos tengan trasera. La galería de varios equipos de sobremesa (hEX,
// RB5009 de interior) no trae la cara opuesta, y servir la de un hermano sería un «parecido».
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..');
const VISTAS = JSON.parse(fs.readFileSync(path.join(RAIZ, 'public/data/mikrotik-vistas-equipos.json'), 'utf8'));
const { MODELS } = require('../server/seed/legacyData/mikrotik.js');
const entradas = Object.entries(VISTAS).filter(([k]) => !k.startsWith('_'));

// Ancho y alto del lienzo de un WebP sin pérdida: 14 bits cada uno, tras la firma 0x2f.
function lienzo(buf) {
  const i = buf.indexOf(Buffer.from('VP8L')) + 8;
  const bits = buf.readUInt32LE(i + 1);
  return [(bits & 0x3fff) + 1, ((bits >> 14) & 0x3fff) + 1];
}

test('cada figura existe, es WebP SIN pérdida y de alta definición', () => {
  for (const [modelo, v] of entradas) {
    for (const cara of ['front', 'rear']) {
      if (!v[cara]) continue;
      assert.match(v[cara], /^\/img\/equipos\/mt-[a-z0-9-]+-(front|rear)\.webp$/, `${modelo}: ${cara} fuera del patrón mt-*.webp`);
      const fichero = path.join(RAIZ, 'public', v[cara]);
      assert.ok(fs.existsSync(fichero), `${modelo}: ${v[cara]} no existe`);
      const buf = fs.readFileSync(fichero);
      const cab = buf.subarray(0, 12).toString('latin1');
      assert.ok(cab.startsWith('RIFF') && cab.endsWith('WEBP'), `${modelo}: ${v[cara]} no es un WebP`);
      assert.ok(buf.includes(Buffer.from('VP8L')) && !buf.includes(Buffer.from('VP8 ')), `${modelo}: ${v[cara]} con pérdida`);
      const [w, h] = lienzo(buf);
      assert.ok(Math.max(w, h) >= 1000, `${modelo}: ${v[cara]} mide ${w} × ${h}: no es alta definición`);
    }
  }
});

test('cada modelo con figura existe en el catálogo, y todo equipo físico del catálogo tiene frontal', () => {
  const ids = new Set(MODELS.map((m) => m.id));
  for (const [modelo] of entradas) assert.ok(ids.has(modelo), `${modelo} tiene figura pero no está en el catálogo`);
  for (const m of MODELS.filter((x) => x.ser !== 'CHR')) {
    assert.ok(VISTAS[m.id] && VISTAS[m.id].front, `${m.id}: sin figura frontal (su ficha la publica)`);
  }
  for (const m of MODELS.filter((x) => x.ser === 'CHR')) {
    assert.ok(!VISTAS[m.id], `${m.id}: una licencia virtual no tiene figura de equipo`);
  }
});

test('cada figura cita la galería de su ficha oficial, el código del equipo y qué vista es', () => {
  for (const [modelo, v] of entradas) {
    assert.match(v.fuente || '', /^Galería oficial «Product images» de la ficha https:\/\/mikrotik\.com\/product\/\S+ — «[^»]+»\. /,
      `${modelo}: la procedencia no dice ficha y código («${v.fuente}»)`);
    const codigo = v.fuente.match(/«([^»]+)»\./)[1];
    assert.strictEqual(codigo, MODELS.find((m) => m.id === modelo).codigo, `${modelo}: el código citado no es el del modelo`);
    assert.match(v.fuente, /\d+_hi_res\.png \(\d+ × \d+ px, servida a \d+ × \d+\)/, `${modelo}: no dice qué imagen ni a qué tamaño`);
    assert.match(v.fuente, /recta|perspectiva|tapa/i, `${modelo}: no dice qué vista es`);
    if (v.tamano) assert.match(v.tamano, /^\d+ × \d+ × \d+ mm \(ficha oficial\)$/, `${modelo}: tamaño mal formado`);
  }
});

test('la página de la ficha casa con el código del modelo: la URL de su figura es la de su tabla de pruebas', () => {
  const { FICHAS } = require('../server/seed/legacyData/mikrotikPruebas');
  for (const [modelo, v] of entradas) {
    const m = MODELS.find((x) => x.id === modelo);
    const url = v.fuente.match(/https:\/\/mikrotik\.com\/product\/\S+/)[0];
    assert.strictEqual(url.toLowerCase(), FICHAS[m.codigo].url.toLowerCase(), `${modelo}: figura de otra ficha`);
  }
});
