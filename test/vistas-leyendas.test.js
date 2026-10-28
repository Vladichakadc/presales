'use strict';
// LEYENDAS DE LAS FIGURAS FUERA DE CISCO (2026-10-27, mejora propuesta al cerrar las de Cisco y
// ejecutada por el dueño: «ejecutar mejora propuesta»). Cisco tiene su prueba propia
// (`cisco-leyendas.test.js`); esta cubre los demás mapas de vistas.
//
// El 2026-10-27 se miraron las 228 figuras de Huawei, Fortinet, Aruba, MikroTik y Juniper: llevan
// números las 36 de Juniper (guías de hardware y dos fichas de línea) y las 2 del Aruba 7010; las
// demás rotulan sobre el dibujo o son fotos. Lo que se vigila:
//   1. Una leyenda está completa: números seguidos (la trasera del 7010 empieza en 11, porque su
//      guía numera las dos caras en una sola tabla), cada uno con rótulo literal y traducción.
//   2. Va con su figura, dice de qué tabla sale y, si el documento no es inglés, su idioma.
//   3. Las figuras con números la tienen y las demás no: una figura nueva se decide aquí.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..');
const MAPAS = ['huawei', 'fortinet', 'aruba', 'mikrotik', 'juniper'];
const leer = (f) => JSON.parse(fs.readFileSync(path.join(RAIZ, `public/data/${f}-vistas-equipos.json`), 'utf8'));
const CARAS = ['front', 'rear'];

// Figuras CON números, miradas una a una el 2026-10-27.
const CON_NUMEROS = (ruta) => /^\/img\/equipos\/jn-/.test(ruta) || /^\/img\/equipos\/gw-7010-(front|rear)\.webp$/.test(ruta);

function entradas(fab) {
  return Object.entries(leer(fab)).filter(([k, v]) => !k.startsWith('_') && v && typeof v === 'object');
}

test('cada leyenda está completa: números seguidos, rótulo literal y traducción', () => {
  for (const fab of MAPAS) {
    for (const [modelo, v] of entradas(fab)) {
      for (const cara of CARAS) {
        const ley = v[cara + 'Leyenda'];
        if (!ley) continue;
        const id = `${fab} ${modelo} ${cara}`;
        assert.ok(v[cara], `${id}: leyenda de una cara sin figura`);
        assert.match(ley.tabla || '', /tabla \d+|leyenda de la figura \d+/, `${id}: no dice de qué tabla sale`);
        if (ley.lang !== undefined) assert.match(ley.lang, /^[a-z]{2}$/, `${id}: idioma «${ley.lang}» no válido`);
        assert.ok(Array.isArray(ley.filas) && ley.filas.length, `${id}: leyenda vacía`);
        const primero = ley.filas[0][0];
        ley.filas.forEach((f, i) => {
          assert.ok(Array.isArray(f) && f.length === 3, `${id}: fila ${i + 1} sin [n, literal, traducción]`);
          assert.strictEqual(f[0], primero + i, `${id}: salta del ${primero + i - 1} al ${f[0]}`);
          assert.ok(typeof f[1] === 'string' && f[1].trim() === f[1] && f[1], `${id}: número ${f[0]} sin rótulo literal`);
          assert.ok(typeof f[2] === 'string' && f[2].trim(), `${id}: número ${f[0]} sin traducción`);
        });
      }
    }
  }
});

test('las figuras con números llevan leyenda y las demás no', () => {
  for (const fab of MAPAS) {
    for (const [modelo, v] of entradas(fab)) {
      for (const cara of CARAS) {
        if (!v[cara]) continue;
        if (CON_NUMEROS(v[cara])) assert.ok(v[cara + 'Leyenda'], `${fab} ${modelo}: ${v[cara]} lleva números y no tiene leyenda`);
        else assert.ok(!v[cara + 'Leyenda'], `${fab} ${modelo}: ${v[cara]} no lleva números y tiene leyenda (o es nueva: decidir aquí)`);
      }
    }
  }
});

test('cada mapa con leyendas declara su procedencia', () => {
  assert.match(leer('juniper')._leyendas || '', /frontLeyenda y rearLeyenda/);
  assert.match(leer('aruba')['7010'].rearLeyenda.tabla, /numera las dos caras seguidas/);
});

test('la ficha pone el idioma del rótulo literal y el Excel de Aruba lleva la leyenda', () => {
  const ficha = fs.readFileSync(path.join(RAIZ, 'public/js/ficha.js'), 'utf8');
  assert.match(ficha, /lang="\$\{esc\(idioma\)\}"/);
  const aruba = fs.readFileSync(path.join(RAIZ, 'public/js/dimensionador-aruba-edgeconnect.js'), 'utf8');
  assert.match(aruba, /frontLeyenda:vBom\.frontLeyenda\|\|null, rearLeyenda:vBom\.rearLeyenda\|\|null/);
});

test('el Excel de Juniper lleva las figuras con su leyenda (mejora aprobada el 2026-10-27)', () => {
  const juniper = fs.readFileSync(path.join(RAIZ, 'public/js/dimensionador-juniper-srx.js'), 'utf8');
  assert.match(juniper, /fotos: \{ modelo: m\.id, origen: 'Extraídas de los documentos oficiales de Juniper'/);
  assert.match(juniper, /frontLeyenda: vistaBom\.frontLeyenda \|\| null, rearLeyenda: vistaBom\.rearLeyenda \|\| null/);
});

test('la foto de producto viaja al Excel con su pie (mejora aprobada el 2026-10-27)', () => {
  const bom = fs.readFileSync(path.join(RAIZ, 'public/js/bom.js'), 'utf8');
  assert.match(bom, /if \(fotos\.foto\) \{\s*pon\('Foto de producto', true\);\s*if \(fotos\.fotoFuente\) pon\(fotos\.fotoFuente\);/);
  const juniper = fs.readFileSync(path.join(RAIZ, 'public/js/dimensionador-juniper-srx.js'), 'utf8');
  assert.match(juniper, /foto: vistaBom\.foto \|\| null, fotoFuente: vistaBom\.fotoFuente \|\| null/);
  const cisco = fs.readFileSync(path.join(RAIZ, 'public/js/dimensionador-cisco-catalyst8k.js'), 'utf8');
  assert.match(cisco, /foto:VISTAS\[m\.id\]\.foto \|\| null, fotoFuente:VISTAS\[m\.id\]\.fotoFuente \|\| null/);
});
