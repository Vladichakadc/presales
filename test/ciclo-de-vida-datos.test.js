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
