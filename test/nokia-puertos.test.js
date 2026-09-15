'use strict';
// Pendiente 35: la auditoría de puertos de Nokia, la más rica de los ocho fabricantes, no
// salía en ninguna pantalla. Estas pruebas fijan lo que el bloque «Configuración de
// puertos» debe decir en las dos páginas del dimensionador Nokia — y lo que NO debe decir:
// una densidad deducida donde el catálogo no la trae.
//
// Lo que garantiza: que el HTML que alimenta la ficha/tarjeta nombra cada grupo con su uso,
// trata las configuraciones como alternativas (jamás sumadas) y declara el tercer estado
// cuando no hay dato. Lo que NO garantiza: que la página lo pinte bien (eso lo conduce
// `npm run pantallas`) ni que las cifras del catálogo sean las del fabricante (eso es la
// pestaña de procedencia).

const test = require('node:test');
const assert = require('node:assert');
const { cargar } = require('./ayuda/navegador.js');
const { MODELS, MODELS_ROUTER } = require('../server/seed/legacyData/nokia.js');

const { NOKIA_SR } = cargar('public/js/dimensionador-nokia-7750sr.js');
const { NOKIA_7220 } = cargar('public/js/dimensionador-nokia-7220ixr.js');

const deRouter = (id) => MODELS_ROUTER.find((m) => m.id === id);
const deFabric = (id) => MODELS.find((m) => m.id === id);

test('la tarjeta del fabric lista cada grupo de puertos con su uso', () => {
  const html = NOKIA_7220.puertosHtml(deFabric('7220 IXR-D2L'));
  assert.ok(html.includes('48 × 25 GbE'), 'el grupo de acceso con su cantidad y velocidad');
  assert.ok(html.includes('>acceso<'), 'el uso de acceso, rotulado');
  assert.ok(html.includes('8 × 100 GbE') && html.includes('>fabric<'), 'el grupo de fabric');
  assert.ok(html.includes('gestión'), 'la gestión se nombra como tal, fuera de la escala de fabric');

  // El D3L no separa acceso de fabric: sus 32x100GE sirven para lo uno o lo otro según el
  // rol, y el rótulo tiene que decirlo — llamarlos «acceso» a secas mentiría en un spine.
  const d3l = NOKIA_7220.puertosHtml(deFabric('7220 IXR-D3L'));
  assert.ok(d3l.includes('32 × 100 GbE') && d3l.includes('acceso o fabric'), 'el uso ambos se declara');
});

test('un modelo sin dato de puertos declara el tercer estado, no inventa densidad', () => {
  for (const sinDato of [{ id: 'X' }, { id: 'X', puertos: [] }, { id: 'X', puertos: null }]) {
    assert.ok(NOKIA_7220.puertosHtml(sinDato).includes('el catálogo no trae la densidad de este chasis'));
  }
});

test('las configuraciones alternativas se muestran con «o» y nunca sumadas', () => {
  const sec = NOKIA_SR.seccionPuertos(deRouter('7250 IXR-6e'));
  assert.strictEqual(sec.titulo, 'Configuración de puertos');
  assert.strictEqual(sec.filas.length, 2, 'una fila por configuración, no una suma');
  assert.ok(sec.filas[0][0].includes('Opción 1 de 2'), 'enumeradas como opciones');
  assert.ok(sec.nota.includes('alternativas, no acumulables'), 'el texto explícito');
  assert.ok(sec.nota.includes('«36x100GE»') && sec.nota.includes('«12x400GE»'), 'ambas citadas');
  assert.ok(sec.nota.includes('<b>o</b>'), 'unidas con «o», no con «+»');
  // Y dentro de cada configuración sí conviven grupos (el SR-1x-92S trae 12x400GE + 80x100GE
  // en la MISMA configuración): ahí el «+» es correcto.
  const s92 = NOKIA_SR.seccionPuertos(deRouter('7750 SR-1x-92S'));
  assert.strictEqual(s92.filas.length, 1);
  assert.ok(s92.filas[0][1].includes('12 × 400GE + 80 × 100GE'));
  assert.strictEqual(s92.nota, null, 'una sola configuración no es una alternativa');
});

test('un chasis modular muestra su notaPuertos literal y no afirma densidad', () => {
  const sr7s = deRouter('7750 SR-7s');
  const sec = NOKIA_SR.seccionPuertos(sr7s);
  assert.ok(sec.nota.includes(sr7s.notaPuertos), 'la nota del catálogo, literal');
  // Se compara como texto y no con deepStrictEqual: el array nace en el realm del ejecutor
  // de pruebas (ayuda/navegador.js) y los prototipos no son los de este proceso.
  assert.strictEqual(sec.filas.map((f) => f[0]).join(','), 'Slots', 'solo lo que el catálogo publica');
  assert.ok(sec.filas[0][1].includes('7 × IOM'), 'los slots sí se dicen');

  // El 7250 IXR-e publica velocidades sin densidad: no es modular y también va con su nota.
  const ixre = deRouter('7250 IXR-e');
  const secE = NOKIA_SR.seccionPuertos(ixre);
  assert.strictEqual(secE.filas.length, 0, 'sin slots no hay fila que aparente densidad');
  assert.ok(secE.nota.includes(ixre.notaPuertos));
});

test('sin configs ni notaPuertos, la ficha declara el tercer estado', () => {
  const sec = NOKIA_SR.seccionPuertos({ id: 'Hipotético' });
  assert.ok(sec.nota.includes('el catálogo no trae la densidad de este chasis'));
});
