'use strict';
/* El desplegable de la ficha de Fortinet lleva también los fuera de venta, como el de Cisco
   (petición del dueño, 2026-10-28: «incluye en el combo del dimensionador de Fortinet los equipos
   que están fuera de venta así como en el dimensionador de Cisco»).

   En compra nueva el motor aparta al fuera de venta con `CICLO_VIDA`, y la ficha solo recibía los
   elegibles: el combo no los enseñaba nunca. Ahora la página añade, detrás de los vigentes, los
   que cumplen el escenario y SOLO se apartan por su ciclo de vida. Siguen sin recomendarse, y
   elegir uno es el override de siempre (cotización bloqueada hasta declarar ampliación,
   renovación o co-term con su justificación). */

const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const M = require('../public/js/fortinet-motor.js');
const fortinet = require('../server/seed/legacyData/fortinet.js');

const JS = fs.readFileSync(path.join(__dirname, '..', 'public', 'js', 'dimensionador-fortinet-fortigate.js'), 'utf8');

// Las dos piezas de la página, ejecutadas tal cual están escritas (no una copia de su lógica).
function piezaDeLaPagina() {
  const fn = /function fueraDeVentaQueCumplen\(r\) \{[\s\S]*?\n\}\n/.exec(JS);
  const cf = /const comoFicha = [^\n]*\n/.exec(JS);
  assert.ok(fn && cf, 'la página ya no tiene fueraDeVentaQueCumplen o comoFicha');
  const ctx = {};
  vm.runInNewContext(`${fn[0]}${cf[0]}this.f = fueraDeVentaQueCumplen; this.c = comoFicha;`, ctx);
  return { fueraDeVentaQueCumplen: ctx.f, comoFicha: ctx.c };
}

// El catálogo con la forma que sirve /api/dimensionador/fortinet (como en fortinet-motor.test.js).
const CAT = {
  models: fortinet.MODELS.map((m) => ({ ...m, eol: !m.hwSku })),
  bundles: fortinet.BUNDLES, care: fortinet.CARE, funciones: fortinet.FUNCIONES,
  serviciosSdwan: fortinet.SERVICIOS_SDWAN, terminos: fortinet.TERMINOS, fortios: fortinet.FORTIOS,
  ems: fortinet.EMS_LICENCIAS, sase: fortinet.SASE_USUARIOS,
  datasetVersion: 'fortinet@prueba',
};
// Un sitio pequeño, donde el 70F (fuera de venta) llega de sobra.
const ESC = (motivo, manual) => ({
  sitio: { segmento: 'branch' },
  topologia: { rol: 'spoke', hubs: 2, enlaces: [{ id: 1, tipo: 'DIA', down: 100, overlay: true }] },
  seguridad: { capa: 'tp', funciones: ['chkAv'] },
  escala: { usuarios: 50 },
  comercial: { motivo },
  ...(manual ? { seleccion: { manual } } : {}),
});
const evaluar = (esc) => M.evaluar(esc, CAT, { hoy: '2026-10-28T00:00:00Z' });

test('en compra nueva, el combo lleva los fuera de venta que cumplen, detrás de los vigentes', () => {
  const P = piezaDeLaPagina();
  const r = evaluar(ESC('nueva'));
  const fuera = P.fueraDeVentaQueCumplen(r);
  assert.ok(fuera.some((c) => c.id === 'FortiGate 70F'), `el 70F cumple y solo lo aparta el ciclo (${fuera.map((c) => c.id).join(', ')})`);
  for (const c of fuera) {
    assert.ok(c.eol, `${c.id} es fuera de venta`);
    assert.strictEqual(c.eval.estado, 'ok', `${c.id} cumple la capacidad`);
    assert.ok(c.bloqueos.every((b) => b.codigo === 'CICLO_VIDA'), `${c.id}: solo lo aparta el ciclo de vida`);
  }
  assert.ok(!fuera.some((c) => r.elegibles.includes(c)), 'no repite un elegible');
  assert.ok(r.recomendacion && !r.recomendacion.eol, 'la recomendación sigue siendo un vigente');
  // Lo que la página pasa a la ficha: vigentes primero, luego los fuera de venta.
  const lista = [...r.elegibles, ...fuera].map((c) => P.comoFicha(c.modelo));
  const primerFuera = lista.findIndex((m) => m.eol);
  assert.ok(primerFuera > 0 && lista.slice(primerFuera).every((m) => m.eol), 'los fuera de venta van al final');
});

test('lo que no llega por capacidad o por otra restricción no entra en el combo', () => {
  const P = piezaDeLaPagina();
  const r = evaluar(ESC('nueva'));
  const ids = new Set(P.fueraDeVentaQueCumplen(r).map((c) => c.id));
  for (const c of r.candidatos.filter((x) => x.eol && x.eval.estado !== 'ok')) {
    assert.ok(!ids.has(c.id), `${c.id} no cumple la capacidad y no debe ofrecerse`);
  }
});

test('elegir uno en compra nueva es un override que no cumple: cotización bloqueada y motivo de ciclo', () => {
  const r = evaluar(ESC('nueva', 'FortiGate 70F'));
  assert.ok(r.override && r.override.elegible === false);
  assert.ok(r.override.bloqueos.some((b) => b.codigo === 'CICLO_VIDA'));
  assert.notStrictEqual(r.seleccion && r.seleccion.id, 'FortiGate 70F', 'el BOM sigue con el validado');
});

test('sin SKU de hardware en la lista firmada, la ficha lo recibe como fuera de venta', () => {
  const { comoFicha } = piezaDeLaPagina();
  const vigente = { id: 'x', hwSku: 'FG-X' };
  assert.strictEqual(comoFicha(vigente), vigente);
  assert.strictEqual(comoFicha({ id: 'y', hwSku: null }).eol, true);
  assert.strictEqual(comoFicha({ id: 'z', eol: true }).eol, true);
});

test('la ficha de Fortinet recibe esa lista y enseña el fuera de venta elegido a mano', () => {
  assert.match(JS, /candidatos: \[\.\.\.r\.elegibles, \.\.\.fuera\]\.map\(\(c\) => comoFicha\(c\.modelo\)\)/);
  assert.match(JS, /seleccionado: manualFuera \|\| r\.seleccion\.id/);
});
