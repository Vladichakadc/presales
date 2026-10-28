'use strict';
// LA LISTA DEL TRANSPORTE DE DOCUMENTOS, COMPROBADA EN `npm run verificar` (2026-10-28).
//
// Hasta hoy vivía dentro de un `node -e "..."` de `traer-cisco-huawei.yml` y las pruebas la leían
// con expresiones regulares sobre el YAML; un error de una entrada se descubría en Actions. Desde
// que vive en `scripts/transporte/documentos.js` se carga con `require()` y se comprueba entera.
// Al moverla salió un archivo repetido (`huawei-a800-producto.html`, dos entradas con la misma URL
// que se pisaban en la rama de transporte): la primera regla de abajo es por ese caso.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { DOCS } = require('../scripts/transporte/documentos');
const TIPOS = ['html', 'pdf', 'texto', 'pptx', 'paginas', 'imagenes', 'scripts'];

test('cada archivo de la lista es único: dos entradas con el mismo nombre se pisan en la rama', () => {
  assert.ok(DOCS.length > 300, `solo ${DOCS.length} entradas: la lista dejó de cargarse entera`);
  const vistos = new Set();
  const repetidos = DOCS.map((d) => d.archivo).filter((a) => (vistos.has(a) ? true : (vistos.add(a), false)));
  assert.deepStrictEqual(repetidos, []);
});

test('cada entrada dice qué es, para quién y de dónde sale', () => {
  for (const d of DOCS) {
    assert.ok(TIPOS.includes(d.tipo), `${d.archivo}: tipo «${d.tipo}» desconocido`);
    assert.match(d.para || '', /^[A-Z]+$/, `${d.archivo}: sin fabricante`);
    const urls = d.urls || [];
    assert.ok(urls.length || d.descubrir || d.descubrirPiezas || d.descubrirEnlace,
      `${d.archivo}: sin URL y sin página de la que descubrirla`);
    for (const u of urls) assert.match(u, /^https:\/\/[^\s"'`]+$/, `${d.archivo}: URL no válida ${u}`);
  }
});

test('lo que se descubre en otra página nombra una entrada de la lista', () => {
  const nombres = new Set(DOCS.map((d) => d.archivo));
  for (const d of DOCS) {
    const de = [].concat(d.descubrir ? d.descubrir.de : [], d.descubrirPiezas ? d.descubrirPiezas.de : [],
      d.descubrirEnlace ? d.descubrirEnlace.de : []);
    for (const x of de) assert.ok(nombres.has(x), `${d.archivo}: descubre en «${x}», que no está en la lista`);
  }
});

test('el workflow ejecuta el módulo, y ningún script del transporte queda dentro del YAML', () => {
  const yml = fs.readFileSync(path.join(__dirname, '..', '.github', 'workflows', 'traer-cisco-huawei.yml'), 'utf8');
  assert.match(yml, /run: node scripts\/transporte\/traer\.js/);
  assert.doesNotMatch(yml, /node -e "|node - <</, 'el transporte vuelve a llevar un script dentro del YAML');
  assert.doesNotMatch(yml, /archivo: '/, 'una entrada de la lista quedó en el YAML');
  // Y el script, antes de pedir nada, se niega a correr con una entrada HTML sin declarar.
  const traer = fs.readFileSync(path.join(__dirname, '..', 'scripts', 'transporte', 'traer.js'), 'utf8');
  assert.ok(traer.indexOf("d.tipo === 'html' && !d.debeContener && !d.exploracion") < traer.indexOf('const SOLO'));
});
