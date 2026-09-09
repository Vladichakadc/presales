'use strict';
// El anclaje del importador de propuestas.
//
// La regla que fija esta bateria: **si la propuesta se equivoca sobre lo que el catalogo
// dice HOY, no hay razon para creerle lo que dice que deberia decir**. Es el equivalente,
// para una propuesta de IA, del doble anclaje que `npm run juniper` aplica a una fila de
// tabla: una cifra suelta siempre parece plausible, una que ademas acierta el valor que va a
// sustituir, mucho menos.
const test = require('node:test');
const assert = require('node:assert');
const { anclar, mismoValor, escribirCampo, literalJs } = require('../scripts/importar-propuesta');

const MODELOS = [
  { id: 'FortiGate 60F', fw: 10, tp: 0.7, cps: null },
  { id: 'FortiGate 100F', fw: 20, tp: 1.6, cps: 36000 },
];

const base = {
  target: 'product', type: 'UPDATE', id: 'FortiGate 60F', field: 'fw',
  oldValue: '10', newValue: '12', reason: 'Datasheet 2026',
  sourceUrl: 'https://www.fortinet.com/x.pdf',
};

test('un UPDATE bien anclado se acepta', () => {
  assert.strictEqual(anclar(base, MODELOS).ok, true);
});

test('si el oldValue no coincide con el catalogo, se aparta entera', () => {
  const r = anclar({ ...base, oldValue: '18' }, MODELOS);
  assert.strictEqual(r.ok, false);
  assert.match(r.motivo, /desanclada/);
});

test('el formato no descalifica: 10, "10" y "10 Gbps" son el mismo dato', () => {
  assert.ok(mismoValor(10, '10'));
  assert.ok(mismoValor(10, '10 Gbps'));
  assert.ok(mismoValor('~ $1,800', '1800'));
  assert.ok(!mismoValor(10, '12'));
  // null nunca casa con nada: "sin dato" no es un valor.
  assert.ok(!mismoValor(null, '0'));
  assert.ok(!mismoValor(undefined, ''));
});

test('un campo vacio en el catalogo solo ancla si la propuesta tambien lo dice vacio', () => {
  const vacio = { ...base, field: 'cps', oldValue: 'N/A', newValue: '50000' };
  assert.strictEqual(anclar(vacio, MODELOS).ok, true);
  const miente = { ...base, field: 'cps', oldValue: '30000', newValue: '50000' };
  assert.strictEqual(anclar(miente, MODELOS).ok, false);
});

test('las altas se reportan pero nunca se aplican solas', () => {
  const alta = { ...base, type: 'NEW', id: 'FortiGate 9000F' };
  const r = anclar(alta, MODELOS);
  assert.strictEqual(r.ok, false);
  assert.match(r.motivo, /alta de registro/);
});

test('un modelo que no existe, un campo que no existe y un precio se apartan', () => {
  assert.match(anclar({ ...base, id: 'FortiGate 9999Z' }, MODELOS).motivo, /no está en el catálogo/);
  assert.match(anclar({ ...base, field: 'inventado' }, MODELOS).motivo, /no existe en ese modelo/);
  assert.match(anclar({ ...base, field: 'price' }, MODELOS).motivo, /cotizadorCatalog/);
  // Los TRES nombres del precio. `elp`/`elpN` es como se llama en este catalogo y es lo que
  // emite la ventana de contraste desde que lee listas de precios; hasta el 2026-09-09 esta
  // guarda solo miraba `price`, asi que un cambio de `elp` se rechazaba por accidente (no
  // esta en los MODELS de legacyData) y con el motivo equivocado. Una proteccion que funciona
  // por un efecto lateral deja de funcionar el dia que ese efecto cambia, en silencio.
  assert.match(anclar({ ...base, field: 'elp' }, MODELOS).motivo, /cotizadorCatalog/);
  assert.match(anclar({ ...base, field: 'elpN' }, MODELOS).motivo, /cotizadorCatalog/);
});

test('sin URL de fuente oficial no se aplica', () => {
  assert.match(anclar({ ...base, sourceUrl: '' }, MODELOS).motivo, /sin URL/i);
  assert.match(anclar({ ...base, sourceUrl: 'segun mis notas' }, MODELOS).motivo, /sin URL/i);
});

test('una propuesta que no cambia nada se aparta en vez de ensuciar el diff', () => {
  assert.match(anclar({ ...base, newValue: '10' }, MODELOS).motivo, /sin cambio real/);
});

test('escribirCampo cambia solo el campo pedido del modelo pedido', () => {
  const texto = "const MODELS = [\n{id:'A1', fw:10, tp:2},\n{id:'A2', fw:10, tp:4}\n];\n";
  const salida = escribirCampo(texto, 'A1', 'fw', 12);
  assert.match(salida, /\{id:'A1', fw:12, tp:2\}/);
  assert.match(salida, /\{id:'A2', fw:10, tp:4\}/, 'no toca el otro modelo');
  // Un campo que no esta en el bloque devuelve null en vez de escribir donde no debe.
  assert.strictEqual(escribirCampo(texto, 'A1', 'noExiste', 1), null);
  assert.strictEqual(escribirCampo(texto, 'NoEsta', 'fw', 1), null);
});

test('un newValue hostil se guarda como dato, nunca como codigo', () => {
  // POR QUE. `newValue` puede venir de un datasheet subido por cualquiera y pasar por la IA,
  // asi que no es una cadena de confianza. La primera version escapaba la comilla pero no la
  // barra invertida: un valor acabado en `\` cerraba la cadena antes de tiempo y el resto se
  // leia como codigo — corrompiendo el archivo y dejando el servidor sin arrancar.
  const texto = "const MODELS = [\n{id:'A1', seg:'Sucursal'}\n];\nmodule.exports={MODELS};\n";
  const hostil = "x\\', evil:(()=>{throw new Error('ejecutado')})(), y:'";
  const salida = escribirCampo(texto, 'A1', 'seg', hostil);

  // El archivo resultante es JS valido y, al evaluarlo, el valor vuelve intacto y no se
  // ejecuta nada. Function() en vez de require() para no depender del disco en la prueba.
  const modulo = { exports: {} };
  // eslint-disable-next-line no-new-func
  new Function('module', 'exports', salida)(modulo, modulo.exports);
  assert.strictEqual(modulo.exports.MODELS[0].seg, hostil);

  // La barra, la comilla y el salto de linea se escapan; un numero va sin comillas.
  assert.strictEqual(literalJs('a\\b'), "'a\\\\b'");
  assert.strictEqual(literalJs("d'e"), "'d\\'e'");
  assert.strictEqual(literalJs('f\ng'), "'f\\ng'");
  assert.strictEqual(literalJs(20), '20');
});
