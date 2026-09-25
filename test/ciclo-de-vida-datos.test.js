'use strict';
// Pendiente 34: la regla del semáforo de ciclo de vida, fijada sobre los DATOS del
// catálogo (docs/portabilidad-aruba.md, hallazgo 1).
//
// LA REGLA. El semáforo solo se enciende donde hay `eolAnnounced` CON FECHA; donde no lo
// hay, la pantalla declara «el catálogo no trae el ciclo de vida» (tercer estado, la misma
// idea que protege `redund`). Portarlo de otra forma pintaría «vigente» por omisión sobre
// los modelos sin boletín — el mismo error que el «IPS: no aplica» del Catalyst 8300, y más
// caro, porque lo que se afirmaría es que un equipo se puede pedir.
//
// El semáforo vive en el JS cliente (FICHA.marca/rango), así que aquí se fija el invariante
// sobre los datos que lo alimentan, en los legacyData de los ocho fabricantes:
//   1. Ningún modelo AFIRMA vigencia en el dato (no existe campo `vigente` ni un
//      `eol: false` explícito): la ausencia de boletín queda SIN AFIRMAR, que es lo que
//      permite el tercer estado.
//   2. Todo ciclo de vida afirmado (`eolAnnounced`) trae una fecha de último pedido
//      parseable: sin ella el semáforo no podría ni encenderse ni degradar solo cuando la
//      fecha pase (FICHA.eosVencido parsea `lastOrder`).
//   3. Puente con el cliente: FICHA.marca no enciende nada sobre un modelo sin dato (ni
//      verde ni naranja), y lo que sí enciende exige la fecha.
//
// LO QUE ESTA PRUEBA NO GARANTIZA. Que los modelos sin boletín estén vigentes de verdad:
// eso exige cargar los boletines de cada fabricante (para Huawei es el pendiente 14,
// bloqueado por Akamai), no un test. Tampoco cubre el `eol` binario de Fortinet
// (FORTINET_EOL_MODELS vive en seedCatalog.js, no en el legacyData): es una afirmación de
// «fuera de venta», no de «vigente», así que no puede producir el verde falso que esta
// regla persigue.

const test = require('node:test');
const assert = require('node:assert');
const { cargar } = require('./ayuda/navegador.js');

const CATALOGOS = {
  huawei: require('../server/seed/legacyData/huawei.js').MODELS,
  cisco: require('../server/seed/legacyData/cisco.js').MODELS,
  fortinet: require('../server/seed/legacyData/fortinet.js').MODELS,
  juniper: require('../server/seed/legacyData/juniper.js').MODELS,
  mikrotik: require('../server/seed/legacyData/mikrotik.js').MODELS,
  aruba: require('../server/seed/legacyData/aruba.js').MODELS,
  // Nokia son dos listas: el fabric 7220 IXR y los catorce de agregación/core.
  'nokia (7220 IXR)': require('../server/seed/legacyData/nokia.js').MODELS,
  'nokia (7250/7750)': require('../server/seed/legacyData/nokia.js').MODELS_ROUTER,
};

const { FICHA } = cargar('public/js/ficha.js');

test('ningún modelo afirma vigencia en el dato: sin boletín queda sin afirmar', () => {
  for (const [fabricante, models] of Object.entries(CATALOGOS)) {
    assert.ok(models.length > 0, `${fabricante}: la lista no está vacía`);
    for (const m of models) {
      assert.ok(!('vigente' in m),
        `${fabricante} / ${m.id}: un campo «vigente» sería un verde afirmado sin boletín`);
      assert.notStrictEqual(m.eol, false,
        `${fabricante} / ${m.id}: un eol:false explícito afirmaría vigencia; la ausencia de boletín debe quedar sin afirmar (null/undefined)`);
    }
  }
});

test('todo ciclo de vida afirmado trae fecha de último pedido parseable', () => {
  let afirmados = 0;
  let total = 0;
  for (const [fabricante, models] of Object.entries(CATALOGOS)) {
    for (const m of models) {
      total += 1;
      if (m.eolAnnounced == null) continue; // sin afirmar: el tercer estado, no un verde
      afirmados += 1;
      assert.ok(typeof m.eolAnnounced === 'object',
        `${fabricante} / ${m.id}: eolAnnounced debe ser el boletín estructurado, no un booleano`);
      assert.ok(Number.isFinite(Date.parse(m.eolAnnounced.lastOrder)),
        `${fabricante} / ${m.id}: eolAnnounced sin lastOrder parseable no puede encender el semáforo ni degradarse solo`);
    }
  }
  // La cifra sale en el informe para que se vea lo fina que es la capa afirmada: la
  // inmensa mayoría del catálogo va (correctamente) sin afirmar.
  console.log(`[ciclo-de-vida] ${afirmados} modelos con boletín fechado de ${total} en catálogo`);
  assert.ok(afirmados > 0, 'hoy hay boletines (Cisco, Juniper, Aruba): la rama afirmada existe y se prueba');
  assert.ok(afirmados < total, 'no todo el catálogo tiene boletín: el tercer estado es el caso común');
});

test('el cliente no enciende el semáforo sin dato, y lo que enciende exige fecha', () => {
  // Sin dato: ni verde ni naranja — la pantalla declara que el catálogo no trae el ciclo
  // de vida (el tercer estado lo pinta la página; aquí se fija que el dato solo no basta
  // para encender nada).
  assert.strictEqual(FICHA.marca({ id: 'X' }), null, 'sin eolAnnounced no hay marca: no se afirma nada');
  assert.strictEqual(FICHA.marca({ id: 'X', eolAnnounced: null }), null);

  // Con boletín fechado en el futuro: se anuncia, y sigue siendo recomendable hasta la fecha.
  const futuro = { id: 'X', eolAnnounced: { lastOrder: '2999-01-01' } };
  assert.strictEqual(FICHA.marca(futuro).t, 'fin de venta anunciado');
  assert.strictEqual(FICHA.recomendable(futuro), true);

  // Con la fecha pasada cae solo a fuera de venta, sin que nadie edite el catálogo.
  const vencido = { id: 'X', eolAnnounced: { lastOrder: '2000-01-01' } };
  assert.strictEqual(FICHA.marca(vencido).t, 'fin de venta vencido');
  assert.strictEqual(FICHA.recomendable(vencido), false);
});

test('Aruba EC-XS NO lleva boletín: verificado vigente en fuentes oficiales el 2026-09-16', () => {
  // Petición directa del dueño: «valida en las fuentes oficiales si el EC-XS sigue
  // vigente o entró en EOL». Veredicto (comentario de EOL_ANNOUNCED en
  // server/seed/legacyData/aruba.js): las QuickSpecs oficiales a50004289enw V18
  // (06-jul-2026) lo listan ORDENABLE (JM962A#AC3 y la NAL S3N70A), la garantía
  // oficial a00143138enw lo declara «Active» sin fecha de fin de venta, y la señal
  // de los agregadores (EoS 31-ene-2026) no existe en ningún canal oficial. La casa
  // nunca marca por agregadores: esta guarda fija el veredicto para que nadie lo
  // «arregle» desde un checker de terceros.
  const aruba = CATALOGOS.aruba;
  const ecxs = aruba.find((m) => m.id === 'EC-XS');
  assert.ok(ecxs, 'el EC-XS sigue en el catálogo');
  assert.strictEqual(ecxs.eolAnnounced, null,
    'EC-XS: verificado vigente el 2026-09-16 (QuickSpecs V18 + garantía oficial); marcarlo exige documento del fabricante, no un agregador');
  // El que SÍ está fuera de venta queda marcado con su fecha (la condición que el
  // dueño pidió resaltar): EC-XL, último pedido 2026-03-31, ya vencido hoy.
  const ecxl = aruba.find((m) => m.id === 'EC-XL');
  assert.ok(ecxl && ecxl.eolAnnounced, 'EC-XL conserva su boletín oficial');
  assert.strictEqual(FICHA.marca(ecxl).t, 'fin de venta vencido',
    'con el último pedido en pasado, la marca dice «fin de venta vencido» — la condición real a día de hoy');
  assert.strictEqual(FICHA.recomendable(ecxl), false, 'vencido = rango 2: nunca se propone');
});
