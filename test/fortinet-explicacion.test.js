'use strict';
// LA EXPLICACIÓN DEL RESULTADO DE FORTINET, FUERA DE LA PÁGINA (2026-10-31, fase 3.2 del plan de
// mejora de los dimensionadores). `resumenDescartes`, `fueraDeVentaQueCumplen` y `licenciaHa` vivían
// en dimensionador-fortinet-fortigate.js y solo se probaban recortando su código; ahora están en
// fortinet-explicacion.js. Al moverlas se comparó la versión de la página con la del módulo en 6.355
// casos (los 58 FortiGate en los tres modos de HA y 3.000 resultados al azar): ninguna diferencia.
// El motor (fortinet-motor.js) y sus reglas no se tocan: esto solo lee lo que el motor decidió.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const X = require('../public/js/fortinet-explicacion.js');

const cand = (id, estado, extra = {}) => ({ id, elegible: false, eol: false, soporta: 0, bloqueos: [], eval: { estado }, ...extra });

test('los descartados se agrupan por su motivo: sin dato, capacidad o restricción', () => {
  const r = { descartados: [
    cand('FG-40F', 'apartado', { eval: { estado: 'apartado', apartadoPor: 'ssl', apartadoPorN: 'inspección SSL' } }),
    cand('FG-60F', 'excede', { eval: { estado: 'excede', manda: { k: 'tp', n: 'Threat Protection' } } }),
    cand('FG-70F', 'excede', { eval: { estado: 'excede', manda: { k: 'tp', n: 'Threat Protection' } } }),
    cand('FG-80F', 'ok', { bloqueos: [{ codigo: 'CICLO_VIDA', mensaje: 'fin de venta' }] }),
  ] };
  const { sinDato, porCapacidad, porRestriccion } = X.resumenDescartes(r);
  assert.deepStrictEqual([...sinDato.get('ssl').modelos], ['FG-40F']);
  assert.deepStrictEqual([...porCapacidad.get('tp').modelos], ['FG-60F', 'FG-70F']);
  assert.strictEqual(porRestriccion.get('CICLO_VIDA').ejemplo, 'fin de venta');
  assert.strictEqual(X.RESTRICCION_N.CICLO_VIDA, 'fuera de venta en compra nueva');
});

test('al desplegable solo van los fuera de venta que cumplen y que solo aparta el ciclo de vida', () => {
  const r = { candidatos: [
    cand('A', 'ok', { eol: true, soporta: 900, bloqueos: [{ codigo: 'CICLO_VIDA' }] }),
    cand('B', 'ok', { eol: true, soporta: 300, bloqueos: [{ codigo: 'CICLO_VIDA' }] }),
    cand('C', 'ok', { eol: true, bloqueos: [{ codigo: 'CICLO_VIDA' }, { codigo: 'PUERTOS_INSUFICIENTES' }] }),
    cand('D', 'excede', { eol: true, bloqueos: [{ codigo: 'CICLO_VIDA' }] }),
    cand('E', 'ok', { eol: true, elegible: true, bloqueos: [{ codigo: 'CICLO_VIDA' }] }),
  ] };
  assert.deepStrictEqual(X.fueraDeVentaQueCumplen(r).map((c) => c.id), ['B', 'A'], 'ordenados de menor a mayor capacidad');
});

test('la licencia FortiGuard en HA: única solo en activo-pasivo de la serie de la guía', () => {
  const m = { haLicenciaUnica: { serie: '60F', skuHa: 'FG-61F-HA' } };
  assert.strictEqual(X.licenciaHa(m, 'standalone', false), null);
  assert.match(X.licenciaHa(m, 'ha-ap', true).texto, /^una sola suscripción para el par: FG-61F-HA × 2/);
  assert.match(X.licenciaHa(m, 'ha-ap', false).texto, /este BOM cotiza una suscripción por nodo, pero la serie 60F admite una sola/);
  assert.strictEqual(X.licenciaHa(m, 'ha-aa', true).unica, false);
  assert.match(X.licenciaHa({}, 'ha-ap', false).texto, /no da licencia única en HA a este modelo/);
});

test('la página carga el módulo antes que su script y solo delega', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'public/dimensionador-fortinet-fortigate.html'), 'utf8');
  const i = html.indexOf('<script src="/js/fortinet-explicacion.js"></script>');
  assert.ok(i > 0 && i < html.indexOf('<script src="/js/dimensionador-fortinet-fortigate.js"'), 'el módulo, antes que la página');
  const pag = fs.readFileSync(path.join(__dirname, '..', 'public/js/dimensionador-fortinet-fortigate.js'), 'utf8');
  assert.match(pag, /^function resumenDescartes\(r\) \{ return FortinetExplicacion\.resumenDescartes\(r\); \}$/m);
  assert.match(pag, /^function fueraDeVentaQueCumplen\(r\) \{ return FortinetExplicacion\.fueraDeVentaQueCumplen\(r\); \}$/m);
  assert.match(pag, /^function licenciaHa\(m, modo, cotizada = unicaCotizada\(m\)\) \{ return FortinetExplicacion\.licenciaHa\(m, modo, cotizada\); \}$/m);
  assert.match(pag, /^const RESTRICCION_N = FortinetExplicacion\.RESTRICCION_N;$/m);
});
