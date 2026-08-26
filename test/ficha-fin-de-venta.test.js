'use strict';
// La regla de "se muestra pero no se recomienda" vive en un solo sitio (public/js/ficha.js)
// justo porque antes vivia en tres y los tres decian cosas distintas: Fortinet y MikroTik
// borraban los descontinuados, Cisco los dejaba competir de igual a igual y podia proponer
// un chasis fuera de venta para un diseno nuevo, y Aruba tenia su propio criterio para
// `legacy`. Estas pruebas fijan la regla unificada para que no vuelva a divergir.
const test = require('node:test');
const assert = require('node:assert');
const { cargar } = require('./ayuda/navegador');

const { FICHA } = cargar('public/js/ficha.js');

const DIA = 24 * 3600 * 1000;
const fecha = (offsetDias) => new Date(Date.now() + offsetDias * DIA).toISOString().slice(0, 10);

test('rango 0: un modelo vigente', () => {
  assert.strictEqual(FICHA.rango({ id: 'X' }), 0);
  assert.strictEqual(FICHA.recomendable({ id: 'X' }), true);
});

test('rango 1: la linea anterior se propone solo si nada vigente cumple', () => {
  assert.strictEqual(FICHA.rango({ id: 'X', legacy: true }), 1);
  assert.strictEqual(FICHA.recomendable({ id: 'X', legacy: true }), true);
});

test('rango 2: fuera de venta nunca se recomienda', () => {
  assert.strictEqual(FICHA.rango({ id: 'X', eol: true }), 2);
  assert.strictEqual(FICHA.recomendable({ id: 'X', eol: true }), false);
});

test('un fin de venta ANUNCIADO pero no vencido sigue siendo recomendable', () => {
  // Hasta la fecha de ultimo pedido el equipo se pide con normalidad. Marcarlo como fuera
  // de venta antes de tiempo quitaria de la mesa un equipo que todavia se puede comprar.
  const m = { id: 'X', eolAnnounced: { pid: 'X-K9', lastOrder: fecha(120) } };
  assert.strictEqual(FICHA.rango(m), 0);
  assert.strictEqual(FICHA.recomendable(m), true);
});

test('pasada la fecha de ultimo pedido cae a rango 2 SOLO, sin editar el catalogo', () => {
  // Este es el punto del diseno: estos avisos se quedan obsoletos porque nadie vuelve a
  // tocarlos. La fecha decide, no un campo que alguien tenga que acordarse de cambiar.
  const m = { id: 'X', eolAnnounced: { pid: 'X-K9', lastOrder: fecha(-1) } };
  assert.strictEqual(FICHA.rango(m), 2);
  assert.strictEqual(FICHA.recomendable(m), false);
});

test('una fecha ilegible no descataloga el equipo por accidente', () => {
  const m = { id: 'X', eolAnnounced: { pid: 'X-K9', lastOrder: 'proximamente' } };
  assert.strictEqual(FICHA.rango(m), 0);
});

test('ordenar antepone lo vigente a lo legacy y deja lo fuera de venta al final', () => {
  const lista = [
    { id: 'eol', eol: true },
    { id: 'legacy', legacy: true },
    { id: 'vigente' },
  ];
  // Se comparan unidas y no con deepStrictEqual porque la lista vuelve del contexto del
  // navegador simulado: mismo contenido, otro Array.prototype.
  assert.strictEqual(FICHA.ordenar(lista, () => 0).map((m) => m.id).join(' < '),
    'vigente < legacy < eol');
});

test('recomendar nunca devuelve un equipo fuera de venta', () => {
  const soloEol = [{ id: 'a', eol: true }, { id: 'b', eol: true }];
  assert.strictEqual(FICHA.recomendar(soloEol), null,
    'sin candidatos recomendables la respuesta correcta es "ninguno", no "el menos malo"');
});

test('recomendar prefiere lo vigente aunque el legacy vaya primero en la lista', () => {
  const lista = [{ id: 'viejo', legacy: true }, { id: 'nuevo' }];
  assert.strictEqual(FICHA.recomendar(FICHA.ordenar(lista, () => 0)).id, 'nuevo');
});
