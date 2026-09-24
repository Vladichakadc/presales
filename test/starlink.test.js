'use strict';
// Dimensionador Starlink LEO. Lo que estas pruebas fijan son las dos reglas que hacen honesto
// un catalogo sin verificar: un dato que falta APARTA el kit con su motivo (nunca lo aprueba),
// y el numero de terminales sale del supuesto de planificacion declarado, no de una capacidad
// que Starlink no publica. Lo que NO garantizan: que las cifras de legacyData/starlink.js sean
// las de la ficha oficial — eso esta pendiente de contrastar (PENDIENTES.md).
const test = require('node:test');
const assert = require('node:assert');
const { cargar } = require('./ayuda/navegador.js');
const { KITS, FUENTE } = require('../server/seed/legacyData/starlink.js');

const { STARLINK } = cargar('public/js/dimensionador-starlink-leo.js');

const base = {
  sitios: 1, downMbps: 100, upMbps: 10, rol: 'principal', movilidad: 'fijo', energia: 'ac',
  presupuestoW: 0, redundancia: false, planDown: 100, planUp: 10, gbMes: 500, cableM: 10, kitSel: '',
};
const esc = (o) => ({ ...base, ...o });

test('el catalogo se declara sin verificar y sin precios inventados', () => {
  assert.strictEqual(FUENTE.verificado, false);
  for (const k of KITS) {
    assert.strictEqual(k.elpN, null, `${k.id} no puede traer precio sin lista firmada`);
    assert.strictEqual(k.sku, null, `${k.id} no puede traer un SKU sin verificar`);
  }
});

test('sitio fijo con AC recomienda el kit Standard', () => {
  const r = STARLINK.calcular(KITS, esc({}));
  assert.strictEqual(r.recomendado.id, 'standard');
  assert.strictEqual(r.terminalesSitio, 1);
});

test('maritimo aparta el Standard (no soportado) y el Mini (no consta), y recomienda el vigente', () => {
  const r = STARLINK.calcular(KITS, esc({ movilidad: 'maritimo' }));
  assert.strictEqual(r.recomendado.id, 'performance', 'la linea anterior va detras de la vigente');
  const mini = r.evaluados.find((x) => x.kit.id === 'mini');
  assert.strictEqual(mini.ok, false);
  assert.ok(mini.motivos.some((m) => m.includes('no consta')), 'un null se declara como hueco, no como negativa');
  const std = r.evaluados.find((x) => x.kit.id === 'standard');
  assert.ok(std.motivos.some((m) => m.includes('no está soportado')));
});

test('un presupuesto de potencia aparta al kit sin consumo publicado en vez de aprobarlo', () => {
  const r = STARLINK.calcular(KITS, esc({ presupuestoW: 60 }));
  assert.strictEqual(r.recomendado.id, 'mini');
  const perf = r.evaluados.find((x) => x.kit.id === 'performance');
  assert.strictEqual(perf.ok, false);
  assert.ok(perf.motivos[0].includes('no trae su consumo'));
});

test('DC recomienda el Mini; portatil ordena por consumo', () => {
  assert.strictEqual(STARLINK.calcular(KITS, esc({ energia: 'dc' })).recomendado.id, 'mini');
  assert.strictEqual(STARLINK.calcular(KITS, esc({ movilidad: 'portatil' })).recomendado.id, 'mini');
});

test('los terminales salen del eje que manda y N+1 suma uno', () => {
  assert.deepStrictEqual({ ...STARLINK.terminalesPorSitio(esc({ downMbps: 250 })) },
    { base: 3, total: 3, manda: 'bajada' });
  assert.deepStrictEqual({ ...STARLINK.terminalesPorSitio(esc({ upMbps: 35 })) },
    { base: 4, total: 4, manda: 'subida' });
  assert.strictEqual(STARLINK.terminalesPorSitio(esc({ redundancia: true })).total, 2);
});

test('el BOM multiplica por sitios, anade el agregador con varios terminales y no pone precios', () => {
  const e = esc({ sitios: 4, downMbps: 180, cableM: 30 });
  const r = STARLINK.calcular(KITS, e);
  const filas = STARLINK.filasBom(r, e);
  const equipo = filas.find((f) => f.cat === 'Equipo');
  assert.strictEqual(equipo.qty, 8);
  assert.ok(filas.some((f) => f.cat === 'Integración' && f.qty === 4), 'un agregador por sitio');
  assert.ok(filas.some((f) => /Cable Starlink 45 m/.test(f.desc)), 'el tendido de 30 m supera el cable incluido');
  assert.ok(filas.every((f) => f.unit == null), 'todo va «Consultar»');
});

test('un kit elegido a mano que no cumple se cotiza pero se marca', () => {
  const r = STARLINK.calcular(KITS, esc({ movilidad: 'maritimo', kitSel: 'standard' }));
  assert.strictEqual(r.elegido.id, 'standard');
  assert.strictEqual(r.manual, true);
  assert.strictEqual(r.elegidoCumple, false);
  assert.strictEqual(r.recomendado.id, 'performance', 'elegir a mano no cambia la recomendacion');
});
