'use strict';
// Pendiente 34, la otra mitad: la regla del semáforo en el CLIENTE.
//
// `test/ciclo-de-vida-datos.test.js` fija el invariante sobre los datos (ningún modelo
// afirma vigencia, todo `eolAnnounced` trae fecha parseable). Esto fija lo que la pantalla
// hace con ellos, que es donde vivía el defecto: la copia de Aruba tenía el VERDE como rama
// por defecto, así que todo modelo sin marca salía «Generación actual» — una afirmación de
// que el equipo se puede pedir, sostenida únicamente por la ausencia de una marca.
//
// LAS DOS REGLAS QUE ESTO GUARDA:
//   1. Sin respaldo declarado, NUNCA verde. `cicloVida.respaldado` lo decide el servidor a
//      partir de las `campos` de `legacyData/fuentes.js`; hoy solo Cisco y Juniper.
//   2. Un fin de venta ANUNCIADO y todavía no vencido no es «fuera de venta»: hasta esa
//      fecha el equipo se pide con normalidad. `FICHA.rango()` ya lo distinguía y el
//      semáforo de Aruba no, así que la misma página se contradecía.
const test = require('node:test');
const assert = require('node:assert');
const { cargar } = require('./ayuda/navegador');
const { respaldoCicloVida } = require('../server/services/catalogProjection');

const { FICHA } = cargar('public/js/ficha.js');
const RESPALDADO = { respaldado: true, fuente: 'Boletines oficiales de fin de venta (EOL)', fecha: '2026-07-27' };
const SIN_RESPALDO = { respaldado: false, motivo: 'ninguna fuente declarada respalda el campo eolAnnounced de este fabricante' };
const futuro = () => new Date(Date.now() + 400 * 864e5).toISOString().slice(0, 10);
const pasado = () => new Date(Date.now() - 400 * 864e5).toISOString().slice(0, 10);

test('sin fuente declarada que respalde el fin de venta, un modelo limpio NUNCA sale verde', () => {
  const c = FICHA.cicloDeVida({ id: 'X' }, SIN_RESPALDO);
  assert.strictEqual(c.estado, 'sinDato');
  assert.strictEqual(c.cls, 'gris');
  assert.match(c.detalle, /respalda/i);
});

test('lo mismo cuando la página no informa nada: el tercer estado, no el verde', () => {
  // `null` es «no consta». Leerlo como vigente es exactamente el defecto del pendiente.
  assert.strictEqual(FICHA.cicloDeVida({ id: 'X' }, null).estado, 'sinDato');
});

test('con fuente declarada y fechada, un modelo limpio sí es vigente y dice de dónde sale', () => {
  const c = FICHA.cicloDeVida({ id: 'X' }, RESPALDADO);
  assert.strictEqual(c.estado, 'vigente');
  assert.strictEqual(c.cls, 'verde');
  // No basta con decir «vigente»: hay que decir contra qué documento y de qué fecha, o es la
  // misma afirmación sin respaldo con otro color.
  assert.match(c.detalle, /Boletines oficiales/);
  assert.match(c.detalle, /2026-07-27/);
});

test('fin de venta ANUNCIADO y no vencido es ámbar, no rojo: hasta esa fecha se pide', () => {
  const m = { id: 'X', eolAnnounced: { lastOrder: futuro(), sucesor: 'Y' } };
  const c = FICHA.cicloDeVida(m, RESPALDADO);
  assert.strictEqual(c.estado, 'anunciado');
  assert.strictEqual(c.cls, 'ambar');
  // Y coherente con la otra implementación de la misma regla, que ya existía.
  assert.ok(FICHA.recomendable(m), 'si el semáforo dice que se pide, rango() no puede decir lo contrario');
});

test('la misma fecha, ya vencida, sí es rojo — y las dos implementaciones coinciden', () => {
  const m = { id: 'X', eolAnnounced: { lastOrder: pasado() } };
  const c = FICHA.cicloDeVida(m, RESPALDADO);
  assert.strictEqual(c.estado, 'fuera');
  assert.strictEqual(c.cls, 'rojo');
  assert.ok(!FICHA.recomendable(m));
});

test('`eol` binario sin fecha es rojo y DECLARA que la fecha no está, en vez de callarlo', () => {
  const c = FICHA.cicloDeVida({ id: 'X', eol: true }, RESPALDADO);
  assert.strictEqual(c.estado, 'fuera');
  assert.match(c.detalle, /no trae la fecha/i);
});

test('`legacy` es ámbar aunque el fabricante no tenga respaldo: es un dato positivo del catálogo', () => {
  // El tercer estado cubre la AUSENCIA de información. Una marca que el catálogo sí trae se
  // muestra siempre: no depende de que exista un boletín de fin de venta.
  const c = FICHA.cicloDeVida({ id: 'X', legacy: true, sucesor: 'Z' }, SIN_RESPALDO);
  assert.strictEqual(c.estado, 'anterior');
  assert.strictEqual(c.cls, 'ambar');
  assert.match(c.detalle, /Z/);
});

test('el respaldo sale de `campos` de fuentes.js, no de una segunda lista escrita a mano', () => {
  // Si alguien añadiera un fabricante a mano en otro sitio, esto seguiría pasando y la
  // afirmación de vigencia dejaría de tener documento detrás. Por eso se comprueba que lo que
  // devuelve el servidor CASA con la declaración, fabricante por fabricante.
  const { FUENTES } = require('../server/seed/legacyData/fuentes');
  for (const vendor of Object.keys(FUENTES)) {
    const declara = FUENTES[vendor].some((f) => Array.isArray(f.campos) && f.campos.includes('eolAnnounced'));
    assert.strictEqual(respaldoCicloVida(vendor).respaldado, declara,
      `${vendor}: el respaldo del semáforo no coincide con lo que declara fuentes.js`);
  }
});

test('hoy solo Cisco y Juniper pueden pintar verde, y los otros cinco lo declaran', () => {
  // Cifra medida, no supuesta: si mañana se carga el boletín EOL de Huawei (pendiente 14) y
  // se declara en `campos`, esta prueba falla y obliga a actualizar el recuento — que es
  // justo lo que se quiere, porque el pendiente 34 cierra cuando esa lista crece.
  const conRespaldo = Object.keys(require('../server/seed/legacyData/fuentes').FUENTES)
    .filter((v) => respaldoCicloVida(v).respaldado).sort();
  assert.deepStrictEqual(conRespaldo, ['cisco', 'juniper']);
});
