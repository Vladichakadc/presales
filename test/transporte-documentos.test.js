'use strict';
// LA LISTA DEL TRANSPORTE DE DOCUMENTOS, CARGADA COMO MÓDULO (2026-10-28, mejora aprobada por el dueño).
//
// Hasta el 2026-10-28 la lista de `traer-cisco-huawei.yml` vivía dentro de un script de Node escrito en
// el YAML, y bash lo leía antes que Node: una entrada mal escrita se descubría en Actions. Ahora es
// `scripts/transporte/documentos.js` y esta prueba la carga en `npm run verificar`. Al sacarla aparecieron
// dos defectos que nadie veía: un mismo `archivo` en dos entradas (la segunda pisaba a la primera en una
// corrida completa) y una entrada que descubría piezas en una página que se bajaba después de ella.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const RAIZ = path.join(__dirname, '..');
const DOCS = require('../scripts/transporte/documentos.js');
const TIPOS = new Set(['html', 'pdf', 'pptx', 'paginas', 'imagenes', 'scripts', 'texto']);
const FABRICANTES = new Set(['CISCO', 'HUAWEI', 'MIKROTIK', 'FORTINET', 'ARUBA', 'JUNIPER', 'NOKIA']);
const descubre = (d) => d.descubrir || d.descubrirEnlace || d.descubrirPiezas;

test('cada entrada tiene nombre, tipo y fabricante conocidos, y de dónde sacar el documento', () => {
  assert.ok(DOCS.length > 300, `solo ${DOCS.length} entradas: ¿se perdió parte de la lista?`);
  for (const d of DOCS) {
    assert.match(d.archivo, /^[a-z0-9][a-z0-9._-]*$/, `nombre de archivo raro: «${d.archivo}»`);
    assert.ok(TIPOS.has(d.tipo), `${d.archivo}: tipo «${d.tipo}» desconocido`);
    assert.ok(FABRICANTES.has(d.para), `${d.archivo}: fabricante «${d.para}» desconocido`);
    assert.ok(Array.isArray(d.urls), `${d.archivo}: sin lista de urls`);
    assert.ok(d.urls.length || descubre(d), `${d.archivo}: ni urls ni de dónde descubrirlas`);
    for (const u of d.urls) assert.match(u, /^https:\/\/[a-z0-9.-]+\//i, `${d.archivo}: url que no es https («${u}»)`);
  }
});

test('ningún nombre se repite: dos entradas con el mismo archivo se pisan en una corrida completa', () => {
  const vistos = new Set();
  for (const d of DOCS) {
    assert.ok(!vistos.has(d.archivo), `${d.archivo} está dos veces`);
    vistos.add(d.archivo);
  }
});

test('lo que descubre sus URL en otra página la nombra, y esa página se baja antes', () => {
  const posicion = new Map(DOCS.map((d, i) => [d.archivo, i]));
  DOCS.forEach((d, i) => {
    const cfg = descubre(d);
    if (!cfg) return;
    for (const de of [].concat(cfg.de)) {
      assert.ok(posicion.has(de), `${d.archivo} lee «${de}», que no está en la lista`);
      assert.ok(posicion.get(de) < i, `${d.archivo} lee «${de}», que se baja después`);
    }
    if (d.descubrirPiezas || d.descubrirEnlace) {
      assert.ok(Array.isArray(cfg.dominios) && cfg.dominios.length, `${d.archivo}: sin dominios del fabricante (la página es contenido de fuera)`);
    }
    if (d.descubrirPiezas) assert.ok(Number.isInteger(cfg.max) && cfg.max > 0, `${d.archivo}: sin tope de piezas`);
  });
});

test('el workflow solo lanza el script: bash ya no lee la lista', () => {
  const yml = fs.readFileSync(path.join(RAIZ, '.github/workflows/traer-cisco-huawei.yml'), 'utf8');
  assert.match(yml, /run: node scripts\/transporte\/traer\.js\n/);
  assert.ok(!/NODE_JS|archivo: '/.test(yml), 'la lista o el script volvieron al YAML');
  const traer = fs.readFileSync(path.join(RAIZ, 'scripts/transporte/traer.js'), 'utf8');
  assert.match(traer, /const DOCS = require\('\.\/documentos'\);/);
});
