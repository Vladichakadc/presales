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

// `ficha.js` va PRIMERO: desde el 2026-09-16 la regla de puertos vive ahi (pendiente 35) y
// la pagina de Nokia solo la llama. Que esta prueba siga pasando sin tocar una asercion es
// la mejor senal de que el traslado no cambio la regla, solo su domicilio.
const { NOKIA_SR } = cargar('public/js/ficha.js', 'public/js/dimensionador-nokia-7750sr.js');
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
  // «de este equipo» y ya no «de este chasis»: desde que la regla vive en `ficha.js`
  // (pendiente 35) la usan los siete fabricantes, y un FortiGate 40F no es un chasis. Es un
  // cambio de redacción deliberado, no un texto que se movió solo — de ahí que se anote.
  assert.ok(sec.nota.includes('el catálogo no trae la densidad de este equipo'));
});

test('los otros seis fabricantes no reciben un panel vacío: el texto libre se muestra Y se declara', () => {
  // Es la mitad del pendiente 35 que se ve desde fuera de Nokia. Sus catálogos traen los
  // puertos como texto (`ports` en Cisco/Huawei/MikroTik, `ifaces` en Fortinet/Juniper/Aruba),
  // así que la sección los enseña y DICE que no están estructurados. Decirlo es la diferencia
  // entre «este equipo no tiene puertos» y «el catálogo no sabe contarlos» — la misma
  // distinción que protege `redund` y el `noAplica` del comparador.
  const { FICHA } = cargar('public/js/ficha.js');
  const cisco = require('../server/seed/legacyData/cisco.js').MODELS[0];
  const sec = FICHA.seccionPuertos(cisco);
  assert.ok(sec.filas.length === 1 && sec.filas[0][0] === 'Interfaces');
  assert.ok(sec.filas[0][1].includes('NIM slot'), 'el texto del catálogo, tal cual');
  assert.match(sec.nota, /<b>como texto<\/b>/, 'y se declara que no es dato estructurado');
  assert.match(sec.nota, /no se puede contrastar la densidad/);

  // Fortinet usa `ifaces` en vez de `ports`: las dos claves valen, porque el catálogo las
  // nombra distinto y eso es del catálogo, no del equipo. El 100F no trae puertos
  // estructurados (su columna del Matrix se parte en varias líneas), así que es el que cae aquí.
  const f100 = require('../server/seed/legacyData/fortinet.js').MODELS.find((m) => m.id === 'FortiGate 100F');
  const s100 = FICHA.seccionPuertos(f100);
  assert.strictEqual(s100.filas[0][0], 'Interfaces');
  assert.strictEqual(s100.filas[0][1], f100.ifaces.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'));
});

// Hasta el 2026-10-02 aquí había `includes('GE')` sobre el 30G, y pasaba con «undefined ×
// undefinedGE» en pantalla: la ficha leía los puertos de Fortinet ({n, vel, medios}) con las
// claves de Nokia ({cantidad, veloc}). Lo encontró el recorrido de valores límite. Ahora se
// exige el texto entero, y sobre todos los FortiGate que traen puertos estructurados.
test('los puertos estructurados de Fortinet se leen con su forma, sin «undefined»', () => {
  const { FICHA } = cargar('public/js/ficha.js');
  const { MODELS } = require('../server/seed/legacyData/fortinet.js');
  const conPuertos = MODELS.filter((m) => Array.isArray(m.puertos) && m.puertos.length);
  assert.ok(conPuertos.length >= 17, `hay ${conPuertos.length} FortiGate con puertos estructurados`);
  for (const m of conPuertos) {
    const sec = FICHA.seccionPuertos(m);
    const texto = JSON.stringify(sec);
    assert.ok(!/undefined|NaN|null ×/.test(texto), `${m.id}: ${texto}`);
    assert.strictEqual(sec.filas.length, m.puertos.length, `${m.id}: una fila por grupo`);
  }
  const de = (id) => FICHA.seccionPuertos(MODELS.find((m) => m.id === id));
  assert.strictEqual(de('FortiGate 60F').filas.map((f) => f.join(': ')).join(' | '), 'Puertos: 10 × 1GE RJ45');
  assert.strictEqual(de('FortiGate 60F').nota, null, 'sin pares compartidos no hay nota');
  // El 80F: «8x GE RJ45, 2x Shared Port Pairs». Un par compartido es UN puerto con dos medios.
  const s80 = de('FortiGate 80F');
  assert.strictEqual(s80.filas.map((f) => f.join(': ')).join(' | '),
    'Puertos: 8 × 1GE RJ45 | Puertos de medio compartido: 2 × 1GE RJ45 o SFP');
  assert.match(s80.nota, /medio compartido.*se usa con uno solo de sus medios a la vez, así que cuenta una sola vez/);
  assert.strictEqual(de('FortiGate 120G').filas.map((f) => f[1]).join(' + '), '16 × 1GE RJ45 + 8 × 1GE SFP + 4 × 10GE SFP+');
});

test('un grupo de puertos que no se deja leer no se pinta a medias: cae al texto libre', () => {
  const { FICHA } = cargar('public/js/ficha.js');
  for (const raro of [[{ n: 4 }], [{ cantidad: 'cuatro', veloc: 1 }], [{ vel: 10, medios: ['SFP+'] }], [null]]) {
    const sec = FICHA.seccionPuertos({ id: 'X', ifaces: '4 GE RJ45', puertos: raro });
    assert.strictEqual(sec.filas.map((f) => f.join(': ')).join(' | '), 'Interfaces: 4 GE RJ45', JSON.stringify(raro));
    assert.ok(!JSON.stringify(sec).includes('undefined'), JSON.stringify(raro));
  }
  // La forma del Nokia 7220 IXR sigue valiendo, con su uso rotulado.
  const nokia = FICHA.seccionPuertos({ id: 'X', puertos: [{ cantidad: 48, veloc: 25, uso: 'acceso' }] });
  assert.strictEqual(nokia.filas.map((f) => f.join(': ')).join(' | '), 'Puertos de acceso: 48 × 25GE');
});
