'use strict';
// EL TRINQUETE DE LA SELECCION.
//
// Medido en el navegador antes de tocar nada: se elegia un FortiGate 7121F a 20 Gbps, se
// bajaba el caudal a 50 Mbps y la pagina seguia mostrando el 7121F mientras el recomendado
// era un 30G. La seleccion solo podia SUBIR, nunca bajar.
//
// La causa no era la eleccion manual sino que no se distinguia de la heredada: la regla era
// "conservar la seleccion mientras ese equipo siga cumplir", y como cumplir es
// capacidad >= requerimiento, un equipo grande cumple para TODO requerimiento menor. La
// seleccion que el propio modulo habia dejado en el render anterior se reciclaba con ese
// mismo criterio, asi que el recomendado solo salia en el primerisimo render de la pagina.
//
// Estas pruebas fijan la distincion. Cubren las seis paginas a la vez, porque ficha.js es
// el unico sitio donde se decide.
const test = require('node:test');
const assert = require('node:assert');
const { cargar } = require('./ayuda/navegador');

const { FICHA } = cargar('public/js/ficha.js');

const lista = (...ids) => ids.map((id) => ({ id }));

test('sin eleccion manual la ficha sigue SIEMPRE al recomendado, suba o baje', () => {
  const cid = 'sel-sigue';
  assert.strictEqual(
    FICHA.render({ contenedor: cid, candidatos: lista('A', 'B', 'C'), recomendado: 'A' }), 'A');
  // Sube el requerimiento: A deja de estar y se recomienda B.
  assert.strictEqual(
    FICHA.render({ contenedor: cid, candidatos: lista('B', 'C'), recomendado: 'B' }), 'B');
  // Y ahora BAJA. Aqui es donde fallaba: B seguia cumpliendo, asi que se quedaba pegado.
  assert.strictEqual(
    FICHA.render({ contenedor: cid, candidatos: lista('A', 'B', 'C'), recomendado: 'A' }), 'A',
    'si esto falla, la seleccion heredada volvio a ser un trinquete que solo sube');
});

test('REGRESION del caso reportado: bajar el caudal baja el equipo', () => {
  // Reproduccion literal de lo medido: todos los modelos cumplen a caudal bajo, porque un
  // equipo grande cumple cualquier requerimiento menor. Es el escenario que hacia que la
  // herramienta mostrara siempre el mismo equipo.
  const cid = 'sel-caudal';
  const todos = lista('30G', '60F', '70G', '120G', '400F', '1000F');
  assert.strictEqual(
    FICHA.render({ contenedor: cid, candidatos: todos, recomendado: '1000F' }), '1000F');
  assert.strictEqual(
    FICHA.render({ contenedor: cid, candidatos: todos, recomendado: '30G' }), '30G',
    'la ficha se quedo en el equipo grande aunque el dimensionamiento bajo a uno pequeno');
});

test('una eleccion deliberada SI se conserva al mover un parametro', () => {
  // La funcion que justifica el desplegable: comparar el que cumple justo con el siguiente
  // escalon sin perderlo en cuanto se toca un campo. No se rompe al arreglar el trinquete.
  const cid = 'sel-manual';
  FICHA.render({ contenedor: cid, candidatos: lista('A', 'B', 'C'), recomendado: 'A' });
  assert.strictEqual(
    FICHA.render({ contenedor: cid, candidatos: lista('A', 'B', 'C'), recomendado: 'A', seleccionado: 'C' }), 'C');
  assert.strictEqual(
    FICHA.render({ contenedor: cid, candidatos: lista('A', 'B', 'C'), recomendado: 'B' }), 'C',
    'la eleccion deliberada debe sobrevivir a un cambio de parametro');
  assert.strictEqual(FICHA.elegido(cid), 'C');
});

test('la eleccion deliberada se suelta cuando ese equipo deja de cumplir', () => {
  const cid = 'sel-suelta';
  FICHA.render({ contenedor: cid, candidatos: lista('A', 'B', 'C'), recomendado: 'A', seleccionado: 'C' });
  assert.strictEqual(
    FICHA.render({ contenedor: cid, candidatos: lista('A', 'B'), recomendado: 'A' }), 'A',
    'no puede quedarse en pantalla la ficha de un equipo que ya no sirve');
});

test('una vez suelta, no vuelve a pegarse sola cuando el equipo reaparece', () => {
  // El trinquete tenia esta segunda cara: bastaba que el modelo volviera a la lista para que
  // se reactivara la retencion, porque nada distinguia "lo eligio alguien" de "estaba ahi".
  const cid = 'sel-repesca';
  FICHA.render({ contenedor: cid, candidatos: lista('A', 'B', 'C'), recomendado: 'A', seleccionado: 'C' });
  FICHA.render({ contenedor: cid, candidatos: lista('A', 'B'), recomendado: 'A' });
  assert.strictEqual(
    FICHA.render({ contenedor: cid, candidatos: lista('A', 'B', 'C'), recomendado: 'B' }), 'B',
    'al reaparecer C no debe volver a quedarse pegado');
});

test('sin ningun candidato no se inventa una seleccion', () => {
  const cid = 'sel-vacio';
  FICHA.render({ contenedor: cid, candidatos: lista('A', 'B'), recomendado: 'A' });
  assert.strictEqual(
    FICHA.render({ contenedor: cid, candidatos: [], recomendado: null }), null);
});

test('cada contenedor lleva su propia seleccion', () => {
  // Dos fichas en la misma pagina no pueden pisarse el estado.
  FICHA.render({ contenedor: 'sel-p1', candidatos: lista('A', 'B'), recomendado: 'A', seleccionado: 'B' });
  FICHA.render({ contenedor: 'sel-p2', candidatos: lista('A', 'B'), recomendado: 'A' });
  assert.strictEqual(FICHA.elegido('sel-p1'), 'B');
  assert.strictEqual(FICHA.elegido('sel-p2'), 'A');
});
