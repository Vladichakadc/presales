'use strict';
// LA ALIMENTACION ELECTRICA ES TRES ESTADOS, NO DOS.
//
// `m.redund` (doble fuente si/no) es el mismo campo que Cisco ya traia al 100% de su
// catalogo. Al extenderlo a los otros cinco fabricantes, la mayoria de sus modelos no tienen
// el dato -el Product Matrix de Fortinet no lo publica, ni el material de Juniper o
// MikroTik que ya usa este catalogo-. Tratar esa ausencia como "no es de doble fuente"
// inventaria un dato negativo, exactamente lo que este catalogo evita en todo lo demas
// (precios de Aruba, cps de Fortinet, cobertura de Juniper). Estas pruebas fijan que
// `undefined` se declara como tal y nunca se confunde con `false`.
const test = require('node:test');
const assert = require('node:assert');
const { cargar } = require('./ayuda/navegador');

const { FICHA } = cargar('public/js/ficha.js');

test('sin campo redund ni psu: se declara que el catalogo no lo dice, no que no lo tiene', () => {
  const sec = FICHA.seccionAlimentacion({ id: 'X' });
  assert.strictEqual(sec.titulo, 'Alimentación eléctrica');
  assert.strictEqual(sec.filas.length, 1);
  assert.match(sec.filas[0][1], /no lo especifica/);
  assert.doesNotMatch(sec.filas[0][1], />No</, 'undefined no puede leerse como "No"');
  assert.match(sec.nota, /datasheet/i);
});

test('redund:false es un hecho verificado, no una ausencia de dato', () => {
  const sec = FICHA.seccionAlimentacion({ id: 'X', redund: false });
  assert.match(sec.filas[0][1], /No — fuente única/);
  assert.doesNotMatch(sec.filas[0][1], /no lo especifica/);
});

test('redund:true declara doble fuente de serie', () => {
  const sec = FICHA.seccionAlimentacion({ id: 'X', redund: true });
  assert.match(sec.filas[0][1], /Sí — de serie/);
});

test('psu.watts/tipo/volts/amps solo aparecen cuando estan presentes', () => {
  const sec = FICHA.seccionAlimentacion({ id: 'X', redund: true,
    psu: { watts: 350, tipo: 'AC-DC', volts: '90–290 V', amps: '12 V / 29.2 A' } });
  // Comparado como JSON: los arrays que devuelve ficha.js viven en el realm del vm de
  // pruebas, y deepStrictEqual los rechaza por identidad de Array.prototype aunque el
  // contenido sea igual.
  const claves = Array.prototype.map.call(sec.filas, (f) => f[0]);
  assert.strictEqual(JSON.stringify(claves), JSON.stringify(
    ['Fuente redundante (doble fuente)', 'Consumo típico', 'Tipo de fuente', 'Rango de entrada', 'Salida']));
});

test('sin psu.watts no aparece la fila de consumo (no se rellena con 0)', () => {
  const sec = FICHA.seccionAlimentacion({ id: 'X', redund: true, psu: {} });
  assert.strictEqual(sec.filas.length, 1);
});

test('psu.texto se usa como nota cuando esta presente, aunque redund sea conocido', () => {
  const sec = FICHA.seccionAlimentacion({ id: 'X', redund: true, psu: { texto: 'Doble fuente 350 W.' } });
  assert.strictEqual(sec.nota, 'Doble fuente 350 W.');
});

test('sin modelo no revienta', () => {
  const sec = FICHA.seccionAlimentacion(null);
  assert.strictEqual(sec.titulo, 'Alimentación eléctrica');
  assert.strictEqual(sec.filas.length, 0);
});

// ── COBERTURA REAL DEL CATALOGO: lo que se transcribio y lo que se dejo en null ──────────
// No inventa cifras: cada modelo con dato viene de una frase ya publicada en el propio
// legacyData (fuentes 1+1, doble fuente, PSU redundantes...), nunca de una suposicion sobre
// el tamano o la gama del equipo.
test('Huawei: los AR8140 (doble fuente 350 W) quedan marcados; un AR sin mencion de fuente queda sin dato', () => {
  const { MODELS } = require('../server/seed/legacyData/huawei.js');
  const ar8140 = MODELS.find((m) => m.id === 'AR8140-12G10XG');
  assert.strictEqual(ar8140.redund, true);
  assert.strictEqual(ar8140.psu.watts, 350);
  const ar611 = MODELS.find((m) => m.id === 'AR611');
  assert.strictEqual(ar611.redund, undefined, 'AR611 no menciona fuente en el catalogo: no se debe inventar');
});

test('Cisco: redund sigue con cobertura completa (no se toco el dato, solo se movio la seccion)', () => {
  const { MODELS } = require('../server/seed/legacyData/cisco.js');
  assert.strictEqual(MODELS.filter((m) => m.redund === undefined).length, 0);
});

// Esta prueba fijaba «ningun modelo Fortinet tiene redund ni psu» porque el Product Matrix
// no publica alimentacion. Eso seguia siendo cierto del Product Matrix, pero no del
// fabricante: el 2026-09-03 se leyeron tres documentos oficiales aparte (community y
// docs.fortinet.com) y tres modelos pasaron a tener dato verificado. Lo que la prueba fija
// ahora no es el numero -que crecera segun se lean mas documentos- sino la regla que importa:
// el que no tiene dato se queda en `undefined`, nunca en `false`, y ningun `psu` declara
// consumo que la fuente no publique.
test('Fortinet: solo tienen alimentacion los modelos leidos de un documento oficial', () => {
  const { MODELS } = require('../server/seed/legacyData/fortinet.js');
  const conDato = MODELS.filter((m) => m.redund !== undefined).map((m) => m.id);
  assert.deepStrictEqual(conDato.sort(),
    ['FortiGate 100F', 'FortiGate 7081F', 'FortiGate 7121F']);

  // El resto en `undefined`: «el catalogo no lo dice» nunca se degrada a un «no» inventado.
  assert.strictEqual(MODELS.filter((m) => m.redund === false).length, 0);

  // Ninguno de los tres declara consumo: los 2500 W del 7081F son capacidad por fuente, y
  // `psu.watts` lo rotula la ficha como «Consumo tipico». Confundirlos seria una cifra falsa
  // con apariencia correcta, que es justo lo que este catalogo evita.
  for (const m of MODELS.filter((x) => x.psu)) {
    assert.strictEqual(m.psu.watts, undefined, `${m.id}: no hay consumo publicado que declarar`);
  }
});
