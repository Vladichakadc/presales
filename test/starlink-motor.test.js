'use strict';
// Motor de dominio del dimensionador Starlink LEO (integracion del modulo canonico
// `starlink-leo-dimensionador`, prompt maestro del 2026-09-24).
//
// TRES COSAS DISTINTAS SE PRUEBAN AQUI, A PROPOSITO EN ARCHIVOS/BLOQUES SEPARADOS:
//
// 1. LA LINEA BASE CANONICA NO SE TOCA. `starlink-leo-dimensionador/tests/run-tests.cjs` trae
//    sus propias 47 aserciones contra `starlink-leo-dimensionador/app.js`. El mandato de
//    integracion prohibe modificarlas o sustituirlas; lo que hace falta es que `npm test` las
//    corra, porque hasta ahora solo corrian si alguien se acordaba de invocar el script a mano
//    — el mismo argumento que ya vale para `npm run catalogo` en el resto de este repositorio.
//    Se invoca el script SIN TOCARLO (spawn), no se reimplementan sus aserciones aqui: eso
//    evita que una copia manual diverja de la fuente de verdad.
//
// 2. PARIDAD DE LA COPIA SERVIDA. El motor que corre en el navegador es
//    public/js/dimensionador-starlink-leo.js, y el que corre en el servidor es el MISMO
//    archivo (server/services/starlinkSizing.js lo requiere por ruta, no una copia pegada) —
//    asi que probar aqui la copia servida y no solo la de referencia es lo que demuestra que la
//    integracion no diverge de su fuente.
//
// 3. LO QUE LA LINEA BASE NO CUBRIA. El prompt maestro pide una matriz de aceptacion mas amplia
//    (T01-T62); los 47 originales no llegan a los conflictos de diversidad de operador (T17,
//    T18), el trafico nulo (T31), la degradacion de confianza (T33) ni el saneo de entradas
//    hostiles del backend (seccion 19). Los casos que son de UI pura — grid responsive,
//    impresion, teclado, lector de pantalla — no se prueban aqui porque el motor no las
//    implementa; se verifican a mano en navegador y quedan declaradas en el informe de entrega,
//    no fingidas con una asercion que no comprobaria nada real.
const test = require('node:test');
const assert = require('node:assert');
const path = require('path');
const { spawnSync } = require('child_process');
const engine = require('../public/js/dimensionador-starlink-leo.js');
const { sanearEstado, sanearCatalogos, calcular } = require('../server/services/starlinkSizing');

function estado(overrides = {}) {
  const base = {
    siteName: 'Caso de prueba', scope: 'local', linkRole: 'primary', criticality: 'important',
    availability: 99.5, users: 20, concurrency: 60, workDays: 20, workHours: 8, growth: 0,
    headroom: 0, failoverHours: 8, protocolOverhead: 0,
    applications: {
      office: { enabled: false, adoption: 100, down: 0.2, up: 0.08 },
      video: { enabled: false, quality: '720', adoption: 50, hours: 1, concurrent: 4 },
      voice: { enabled: false, adoption: 50, hours: 1, concurrent: 4, rate: 0.1 },
      streaming: { enabled: false, quality: '1080', adoption: 20, hours: 1, concurrent: 2 },
      cctv: { enabled: false, cameras: 8, rate: 1.5, hours: 24, days: 30 },
      backup: { enabled: false, gbDay: 5, window: 5, frequency: 'workdays' },
      transfer: { enabled: false, gbMonth: 100, direction: 'down', window: 20 },
      iot: { enabled: false, devices: 100, mbDay: 10, peak: 1 },
      guest: { enabled: false, users: 10, gbDay: 0.5, concurrent: 3, rate: 1 },
      manual: { enabled: true, gb: 500, down: 5, up: 2 },
    },
    speedProfile: 'conservative', customDown: 100, customUp: 15, maxUtilization: 70,
    redundancy: 'auto', obstruction: 'clear', powerQuality: 'stable', environment: 'normal',
    mobility: 'fixed', area: 300, floors: 1, wallDensity: 'medium', upsMinutes: 60,
    pricesVerified: true, catalogDate: '2026-09-23',
  };
  const merged = { ...base, ...overrides };
  if (overrides.applications) {
    merged.applications = {};
    for (const key of Object.keys(base.applications)) {
      merged.applications[key] = { ...base.applications[key], ...(overrides.applications[key] || {}) };
    }
  }
  return merged;
}

test('la linea base canonica (47 aserciones de starlink-leo-dimensionador) sigue pasando sin tocarla', () => {
  const raiz = path.join(__dirname, '..', 'starlink-leo-dimensionador');
  const r = spawnSync(process.execPath, ['tests/run-tests.cjs'], { cwd: raiz, encoding: 'utf8' });
  assert.strictEqual(r.status, 0, `run-tests.cjs fallo:\n${r.stdout}\n${r.stderr}`);
  const salida = JSON.parse(r.stdout);
  assert.strictEqual(salida.ok, true);
  assert.strictEqual(salida.assertions, 47, 'el mandato prohibe reducir la cobertura original');
});

test('la copia servida en public/js/ es el mismo motor, no una copia divergente', () => {
  const catalogos = engine.createCatalogs();
  assert.strictEqual(engine.version, '1.0.0');
  const r = engine.calculate(estado({ applications: { manual: { gb: 40 } } }), catalogos);
  assert.strictEqual(r.plan.name, 'Local Priority 50 GB');
});

test('T17/T18: sin diversidad de operador, alta disponibilidad o mision critica son No-Go', () => {
  const catalogos = engine.createCatalogs();
  const sinDiversidadAlta = engine.calculate(estado({ availability: 99.9, redundancy: 'dual' }), catalogos);
  assert.ok(sinDiversidadAlta.issues.some((i) => i.code === 'NO_CARRIER_DIVERSITY'));
  assert.strictEqual(sinDiversidadAlta.status, 'nogo');

  const mision = engine.calculate(estado({ criticality: 'mission', redundancy: 'single' }), catalogos);
  assert.ok(mision.issues.some((i) => i.code === 'MISSION_NO_DIVERSITY'));
  assert.strictEqual(mision.status, 'nogo');
});

test('T19/T20: dual nunca baja de 2 terminales; hybrid nunca baja de 1 Starlink + respaldo', () => {
  const catalogos = engine.createCatalogs();
  const dual = engine.calculate(estado({ redundancy: 'dual', applications: { manual: { gb: 10, down: 5, up: 1 } } }), catalogos);
  assert.strictEqual(dual.architecture.starlinkTerminals, 2);
  const hybrid = engine.calculate(estado({ redundancy: 'hybrid', applications: { manual: { gb: 10, down: 5, up: 1 } } }), catalogos);
  assert.strictEqual(hybrid.architecture.starlinkTerminals, 1);
  assert.strictEqual(hybrid.architecture.hasDiverseBackup, true);
});

test('T31: sin ninguna aplicacion activa, NO_TRAFFIC fuerza No-Go', () => {
  const catalogos = engine.createCatalogs();
  const r = engine.calculate(estado({ applications: { manual: { enabled: false } } }), catalogos);
  assert.ok(r.issues.some((i) => i.code === 'NO_TRAFFIC'));
  assert.strictEqual(r.status, 'nogo');
});

test('T33: obstruccion pendiente resta 25 puntos de confianza, no bloquea', () => {
  const catalogos = engine.createCatalogs();
  const limpio = engine.calculate(estado({ obstruction: 'clear' }), catalogos);
  const pendiente = engine.calculate(estado({ obstruction: 'pending' }), catalogos);
  assert.strictEqual(limpio.confidence.score - pendiente.confidence.score, 25);
  assert.notStrictEqual(pendiente.status, 'nogo');
});

test('T41/T42: UPS parte de 90 W base + 15 W por AP, y energia inestable con poco respaldo avisa', () => {
  const catalogos = engine.createCatalogs();
  const r = engine.calculate(estado({ powerQuality: 'unstable', upsMinutes: 45, area: 20, floors: 1 }), catalogos);
  assert.strictEqual(r.accessPoints, 1, 'area minima y un piso: un solo AP');
  assert.strictEqual(r.ups.totalW, r.architecture.starlinkTerminals * r.hardware.powerW + 90 + 1 * 15);
  assert.ok(r.issues.some((i) => i.code === 'POWER_RISK'));
});

test('seccion 19: el saneo del backend nunca deja pasar NaN, tipos ajenos o enums desconocidos', () => {
  const state = sanearEstado({
    users: 'mil', concurrency: Number.NaN, availability: Infinity,
    scope: 'marte', redundancy: ['dual'], siteName: 'x'.repeat(500),
    applications: { manual: { enabled: true, gb: null, down: 'rapido', up: {} } },
  });
  assert.strictEqual(state.users, 1, 'un valor no numerico cae al valor por defecto declarado');
  assert.strictEqual(state.concurrency, 50, 'NaN no se propaga: cae al valor por defecto, no al minimo');
  assert.strictEqual(state.availability, 99.5, 'Infinity no es un numero valido: cae al valor por defecto');
  assert.strictEqual(state.scope, 'local', 'un enum desconocido cae al valor por defecto');
  assert.strictEqual(state.redundancy, 'auto');
  assert.strictEqual(state.siteName.length, 80, 'siteName se recorta, nunca se propaga sin limite');
  assert.strictEqual(state.applications.manual.gb, 50, 'null no es un numero valido: cae al valor por defecto');
  assert.strictEqual(state.applications.manual.down, 5, 'una cadena no numerica cae al valor por defecto');
  assert.strictEqual(state.applications.manual.up, 2, 'un objeto no numerico cae al valor por defecto');
});

test('seccion 6: el catalogo editable solo admite precio de un id existente, nunca cuota ni planes nuevos', () => {
  const catalogos = sanearCatalogos({
    local: [
      { id: 'local-50', price: 999999 },
      { id: 'plan-inventado', price: 1 },
      { id: 'local-1000', gb: 1, price: -50 },
    ],
  });
  assert.strictEqual(catalogos.local.find((p) => p.id === 'local-50').price, 999999);
  assert.strictEqual(catalogos.local.length, 4, 'ningun id desconocido crea una fila nueva');
  assert.strictEqual(catalogos.local.find((p) => p.id === 'local-1000').gb, 1000, 'la cuota no se puede editar');
  assert.strictEqual(catalogos.local.find((p) => p.id === 'local-1000').price, 905000, 'un precio negativo se ignora');
});

test('T62 (motor): el resultado saneado del backend es identico al del motor con el mismo estado ya acotado', () => {
  const entrada = { availability: 99.9, criticality: 'mission', users: 80, applications: { manual: { enabled: true, gb: 900, down: 40, up: 8 } } };
  const { state, result } = calcular({ inputs: entrada });
  const directo = engine.calculate(state, engine.createCatalogs());
  // `calculatedAt` es la hora de cada llamada, no parte de la recomendacion: se compara aparte.
  const { calculatedAt: h1, ...restoResult } = result;
  const { calculatedAt: h2, ...restoDirecto } = directo;
  assert.deepStrictEqual(restoResult, restoDirecto);
  assert.ok(h1 && h2);
});
