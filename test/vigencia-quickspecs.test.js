'use strict';
// La vigilancia de vigencia por QuickSpecs (mejora propuesta y aceptada, 2026-09-16):
// fija la regla de clasificacion y la realidad de hoy contra el documento oficial.
//
// POR QUE HAY DOS CAPAS. La primera fija la REGLA con modelos de mentira (sin PDF de por
// medio): una alarma solo salta cuando un modelo SIN boletin deja de constar como
// ordenable — ni por tener boletin (eso es una nota), ni por seguir ordenable. La segunda
// conduce el documento oficial de verdad: si algun dia falla tras un
// `npm run datasheets -- --force`, no es el test el que se rompe — es la alarma
// funcionando, y toca revisar el boletin oficial a mano.

const test = require('node:test');
const assert = require('node:assert');
const { informe, clasificar, fechaDelPdf } = require('../scripts/vigencia-quickspecs');

test('la regla: ordenable sin boletin es ok', () => {
  const c = clasificar('ordenable', null);
  assert.strictEqual(c.veredicto, 'ok');
});

test('la regla: ordenable CON boletin es nota, nunca alarma — la guia tarda en retirarlo', () => {
  // Observado con S0B67A en la V18: HPE mantiene la variante NoLoc tras el ultimo
  // pedido. Alarmar por eso seria llorar lobo cada revision.
  const c = clasificar('ordenable', { lastOrder: '2026-03-31' });
  assert.strictEqual(c.veredicto, 'nota');
  assert.match(c.detalle, /2026-03-31/);
});

test('la regla: ausente o solo mencionado SIN boletin es ALARMA — la señal que nacio del EC-XS', () => {
  // Es exactamente el escenario de los agregadores, pero detectado desde el lado
  // oficial: si maniana JM962A desaparece de la guia, salta aqui y no en un checker.
  assert.strictEqual(clasificar('ausente', null).veredicto, 'alarma');
  assert.strictEqual(clasificar('mencionado', null).veredicto, 'alarma');
  assert.match(clasificar('ausente', null).detalle, /boletin oficial/);
});

test('la regla: ausente CON boletin es nota consistente, no alarma', () => {
  const c = clasificar('ausente', { lastOrder: '2026-03-31' });
  assert.strictEqual(c.veredicto, 'nota');
  assert.match(c.detalle, /consistente/);
});

test('la fecha del PDF se lee del formato D:AAAAMMDD…', () => {
  assert.strictEqual(fechaDelPdf("D:20260623134504-06'00'"), '2026-06-23');
  assert.strictEqual(fechaDelPdf(null), null);
  assert.strictEqual(fechaDelPdf('basura'), null);
});

test('contra el documento oficial de hoy: EC-XS ordenable, EC-XL nota, cero alarmas', async () => {
  const d = await informe();
  // La fuente se declara con lo que se puede leer del propio documento.
  assert.strictEqual(d.fuente.titulo, 'HPE Aruba Networking EdgeConnect SD-WAN');
  assert.strictEqual(d.fuente.creado, '2026-06-23');

  const xs = d.modelos.find((m) => m.id === 'EC-XS');
  assert.ok(xs, 'el EC-XS esta en el cruce');
  assert.strictEqual(xs.presencia, 'ordenable',
    'EC-XS: verificado vigente el 2026-09-16 — si esto cambia, la alarma es la protagonista');
  assert.strictEqual(xs.veredicto, 'ok');

  const xl = d.modelos.find((m) => m.id === 'EC-XL');
  assert.strictEqual(xl.veredicto, 'nota', 'EC-XL: ordenable pese al boletin vencido (patron NoLoc de la V18)');

  assert.strictEqual(d.resumen.alarmas, 0,
    'hoy no hay alarmas — si aparecen tras refrescar las QuickSpecs, revisar el boletin oficial a mano');
  assert.strictEqual(d.resumen.cotejados, 9, 'los nueve EdgeConnect con hwSku entran al cruce');
  assert.ok(d.fueraDeAlcance.sinSku.includes('EC-V'), 'el EC-V queda declarado fuera de alcance');
});
