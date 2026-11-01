'use strict';
// ÓPTICAS, INTERCONEXIÓN EdgeHA Y SEMÁFORO DE PUERTOS, FUERA DE LA PÁGINA (2026-10-31, fase 3.1 del
// plan de mejora de los dimensionadores). Vivían en dimensionador-aruba-edgeconnect.js, mezclados con
// el DOM y sin prueba posible; ahora están en aruba-reglas.js y reciben el catálogo de accesorios
// como parámetro. Al moverlas se comparó la versión de la página con la del módulo en 30.075 casos
// (los 25 modelos del catálogo, enlaces al azar, una y dos unidades): ninguna diferencia. Aquí se
// fijan los casos que importan, con el catálogo real, y que la página solo delega.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const R = require('../public/js/aruba-reglas.js');
const datos = require('../server/seed/legacyData/aruba.js');

const cat = { catalogo: datos.ARUBA_ACCESSORY_CATALOG, compat: datos.ACCESSORY_COMPAT };
const M = Object.fromEntries(datos.MODELS.map((m) => [m.id, m]));
const enlace = (medio, mbps, rol = 'principal') => ({ tipo: 'internet', medio, down: mbps, up: mbps, rol });

test('las ópticas candidatas nunca son DAC, TAA ni de fin de venta', () => {
  for (const id of Object.keys(datos.ACCESSORY_COMPAT)) {
    for (const v of ['1G', '10G', '25G']) {
      for (const o of R.opticasPorVelocidad(cat, id, v)) {
        assert.strictEqual(o.a.speed, v);
        assert.ok(o.a.media !== 'DAC' && !/_TAA$/.test(o.a.media || '') && o.a.plc !== 'ES', `${id} ${v}: ${o.sku}`);
      }
    }
  }
  assert.deepStrictEqual(R.opticasPorVelocidad(cat, 'EC-10106', '10G').map((o) => o.sku), ['J9150D', 'J9151E', 'J9153D']);
  assert.deepStrictEqual(R.opticasPorVelocidad(cat, 'EC-10106', null), []);
  assert.deepStrictEqual(R.opticasPorVelocidad({}, 'EC-10106', '10G'), [], 'sin catálogo, ninguna');
});

test('la interconexión EdgeHA va por cobre si queda RJ-45 en los dos chasis, y por jaula si no', () => {
  const dos = [enlace('RJ45', 500), enlace('RJ45', 500)];
  const cobre = R.interconexionEdgeHA(cat, M['EC-10106'], 2, dos, {});
  assert.strictEqual(cobre.modo, 'cobre');
  assert.strictEqual(cobre.puerto, 'rj45');
  assert.deepStrictEqual(cobre.ops, [], 'por cobre no se cotiza ninguna óptica');
  const jaula = R.interconexionEdgeHA(cat, M['EC-L'], 2, dos, {});
  assert.strictEqual(jaula.puerto, 'sfpPlus');
  assert.strictEqual(jaula.vel, '1G', 'la menor velocidad que cubre el agregado de 1 Gbps');
  assert.ok(jaula.ops.length >= 1);
  assert.strictEqual(R.interconexionEdgeHA(cat, M['EC-10106'], 1, dos, {}), null, 'sin par HA no hay interconexión');
  assert.strictEqual(R.interconexionEdgeHA(cat, M['Gateway 9004'], 2, dos, {}), null, 'solo en EdgeConnect');
});

test('el semáforo de puertos: verde, ámbar y rojo con su motivo', () => {
  assert.strictEqual(R.evaluarPuertos(cat, M['EC-10106'], [enlace('RJ45', 300), enlace('SFP+ 10G', 3000)], 1).nivel, 'verde');
  const rojo = R.evaluarPuertos(cat, M['EC-10104'], [enlace('RJ45', 300), enlace('SFP+ 10G', 3000)], 1);
  assert.strictEqual(rojo.nivel, 'rojo');
  assert.strictEqual(rojo.motivo, 'El EC-10104 tiene 4x RJ-45: enlace 2 por SFP+ 10G sin jaula libre que lo admita.');
  const sinCobre = R.evaluarPuertos(cat, M['EC-L'], [enlace('RJ45', 300)], 1);
  assert.match(sinCobre.motivo, /enlace 1 por RJ-45 sin puerto de cobre libre — si va a una jaula SFP, declara el medio «SFP 1G»/);
  const ambar = R.evaluarPuertos(cat, M['EC-10106'], [enlace('RJ45', 3000)], 1);
  assert.strictEqual(ambar.nivel, 'ambar');
  assert.match(ambar.motivo, /^El enlace 1 declara 3 Gbps por RJ45, que lleva 1 Gbps — cambia el medio\.$/);
});

test('el par EdgeHA cuenta los LAN y la interconexión de los dos chasis', () => {
  const a = R.auditarPuertos(cat, M['EC-10106'], [enlace('RJ45', 500), enlace('RJ45', 500)], 2);
  assert.strictEqual(a.par, true);
  assert.strictEqual(a.puertosNecesarios, 2 + R.LAN_RESERVADOS * 2 + 2);
  assert.strictEqual(R.auditarPuertos(cat, M['EC-10106'], [enlace('RJ45', 500)], 2).par, false, 'con un solo enlace no hay par');
});

test('la página solo delega: las mismas funciones, ninguna con su lógica', () => {
  const pag = fs.readFileSync(path.join(__dirname, '..', 'public/js/dimensionador-aruba-edgeconnect.js'), 'utf8');
  for (const f of ['opticasPorVelocidad', 'parEdgeHA', 'velocidadEdgeHA', 'sinJaulasSfp', 'velocidadesJaula', 'opcionesHa',
    'interconexionEdgeHA', 'inventarioTxt', 'cobreSfp', 'auditarPuertos', 'motivoPuertos', 'evaluarPuertos', 'fmt']) {
    const m = new RegExp(`^function ${f}\\([^)]*\\)\\{ return ArubaReglas\\.${f}\\(`, 'm').exec(pag);
    assert.ok(m, `${f}: la página debe delegar en ArubaReglas.${f} en una sola línea`);
  }
  assert.match(pag, /^const LAN_RESERVADOS=ArubaReglas\.LAN_RESERVADOS;$/m);
  assert.match(pag, /^const NOMBRE_PUERTO=ArubaReglas\.NOMBRE_PUERTO;$/m);
  assert.match(pag, /^const VELOCIDAD_OPTICA=ArubaReglas\.VELOCIDAD_OPTICA;$/m);
});
