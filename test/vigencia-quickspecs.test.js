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
const { MODELS } = require('../server/seed/legacyData/aruba');
const { informe, clasificar, fechaDelPdf, fuenteDe, FUENTES } = require('../scripts/vigencia-quickspecs');

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

test('contra los documentos oficiales de hoy: EC-XS ordenable, EC-XL nota, cero alarmas', async () => {
  const d = await informe();
  // Las fuentes se declaran con lo que se puede leer de cada documento.
  const ec = d.fuentes.find((f) => f.clave === 'ecQuickspecs');
  assert.strictEqual(ec.titulo, 'HPE Aruba Networking EdgeConnect SD-WAN');
  assert.strictEqual(ec.creado, '2026-06-23');

  const xs = d.modelos.find((m) => m.id === 'EC-XS');
  assert.ok(xs, 'el EC-XS esta en el cruce');
  assert.strictEqual(xs.presencia, 'ordenable',
    'EC-XS: verificado vigente el 2026-09-16 — si esto cambia, la alarma es la protagonista');
  assert.strictEqual(xs.veredicto, 'ok');

  const xl = d.modelos.find((m) => m.id === 'EC-XL');
  assert.strictEqual(xl.veredicto, 'nota', 'EC-XL: ordenable pese al boletin vencido (patron NoLoc de la V18)');

  assert.strictEqual(d.resumen.alarmas, 0,
    'hoy no hay alarmas — si aparecen tras refrescar las guias, revisar el boletin oficial a mano');
  assert.strictEqual(d.resumen.cotejados, 15, 'los nueve EdgeConnect y los seis gateways con hwSku entran al cruce');
  assert.ok(d.fueraDeAlcance.sinSku.includes('EC-V'), 'el EC-V queda declarado fuera de alcance');
});

// La extension a gateways de campus (2026-09-17, primer pendiente accionable de la
// lista del dueño): cada gateway con SKU se cruza contra SU guia — la serie 9000 no
// esta en las QuickSpecs de EdgeConnect, tiene la suya (PSNow a00067607enw).
test('la correspondencia modelo-guia: cada gateway con SKU cae en SU documento', () => {
  assert.strictEqual(fuenteDe(MODELS.find((m) => m.id === 'Gateway 9004')).clave, 'gw9000Psnow');
  assert.strictEqual(fuenteDe(MODELS.find((m) => m.id === 'Gateway 9012')).clave, 'gw9000Psnow');
  assert.strictEqual(fuenteDe(MODELS.find((m) => m.id === 'Gateway 9106')).clave, 'gw9100');
  assert.strictEqual(fuenteDe(MODELS.find((m) => m.id === 'Gateway 9114')).clave, 'gw9100');
  assert.strictEqual(fuenteDe(MODELS.find((m) => m.id === 'Gateway 9240')).clave, 'gw9200Qs');
  // Un gateway con SKU de una serie sin guia asignada NO puede quedar verde en
  // silencio: fuenteDe devuelve null y el informe rompe declarandolo (codigo 2).
  assert.strictEqual(fuenteDe({ fam: 'gw', id: 'Gateway 9300', hwSku: 'XXXXXXA' }), null);
  // Sin SKU no hay nada que buscar: ni fuente ni alarma (EC-V, legacy 7000/7200).
  assert.strictEqual(fuenteDe({ fam: 'gw', id: '7030', hwSku: null }), null);
});

test('contra las guias de gateways de hoy: los seis, ordenables', async () => {
  const d = await informe();
  for (const id of ['Gateway 9004', 'Gateway 9004-LTE', 'Gateway 9012', 'Gateway 9106', 'Gateway 9114', 'Gateway 9240']) {
    const m = d.modelos.find((x) => x.id === id);
    assert.ok(m, `${id} entra al cruce`);
    assert.strictEqual(m.presencia, 'ordenable', `${id}: verificado en su guia el 2026-09-17`);
    assert.strictEqual(m.veredicto, 'ok');
  }
  assert.strictEqual(d.fuentes.length, 4, 'EdgeConnect + 9000 (PSNow) + 9100 + 9200');
});
