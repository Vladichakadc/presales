'use strict';
// Dimensionador Starlink LEO. Lo que estas pruebas fijan son las dos reglas que hacen honesto
// el catalogo: un dato que la ficha no dice APARTA el kit con su motivo (nunca lo aprueba), y
// el numero de terminales sale del supuesto de planificacion declarado, no de una capacidad
// que Starlink no publica. Las cifras salen de las fichas oficiales en PDF (2026-09-24); lo
// que estas pruebas NO garantizan es que Starlink no las cambie despues.
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

test('las fichas oficiales respaldan el catalogo, sin precios ni SKU inventados', () => {
  assert.strictEqual(FUENTE.verificado, true);
  assert.ok(FUENTE.fecha, 'la fecha de descarga se declara');
  for (const k of KITS) {
    assert.strictEqual(k.elpN, null, `${k.id} no puede traer precio sin lista del canal`);
    assert.strictEqual(k.sku, null, `${k.id} no puede traer un SKU que la ficha no publica`);
    assert.match(k.fuenteUrl, /^https:\/\/api\.starlink\.com\/public-files\/specification_sheet_/, `${k.id} cita su ficha`);
  }
});

test('lo que ninguna ficha dice sigue en null, no en false ni en true', () => {
  // Las correcciones de la lectura del 2026-09-24: la primera version afirmaba cosas que las
  // fichas no dicen. Si alguien vuelve a rellenarlas a ojo, esto salta.
  for (const k of KITS) assert.strictEqual(k.maritimo, null, `${k.id}: ninguna ficha menciona uso maritimo`);
  assert.strictEqual(KITS.find((k) => k.id === 'standard').enMovimiento, null, 'la ficha del Standard no lo prohibe');
  assert.ok(KITS.every((k) => k.cableMaxM == null), 'ninguna ficha documenta un cable mas largo');
  assert.ok(KITS.every((k) => !k.legacy), 'ninguna ficha dice nada del ciclo de vida');
  assert.strictEqual(KITS.find((k) => k.id === 'performance').enMovimiento, true, 'la del Performance dice «in-motion usage»');
});

test('sitio fijo con AC recomienda el kit Standard', () => {
  const r = STARLINK.calcular(KITS, esc({}));
  assert.strictEqual(r.recomendado.id, 'standard');
  assert.strictEqual(r.terminalesSitio, 1);
});

test('en movimiento solo cumple el kit cuya ficha lo dice', () => {
  const r = STARLINK.calcular(KITS, esc({ movilidad: 'movimiento' }));
  assert.strictEqual(r.recomendado.id, 'performance');
  const std = r.evaluados.find((x) => x.kit.id === 'standard');
  assert.strictEqual(std.ok, false);
  assert.ok(std.motivos.some((m) => m.includes('no consta')), 'un null se declara como hueco, no como negativa');
});

test('maritimo no recomienda nada: ninguna ficha lo respalda', () => {
  const r = STARLINK.calcular(KITS, esc({ movilidad: 'maritimo' }));
  assert.strictEqual(r.recomendado, null);
  const perf = r.evaluados.find((x) => x.kit.id === 'performance');
  assert.deepStrictEqual([...perf.motivos], ['el catálogo no consta que se soporte en uso marítimo']);
});

test('un presupuesto de potencia filtra por el consumo publicado', () => {
  assert.strictEqual(STARLINK.calcular(KITS, esc({ presupuestoW: 60 })).recomendado.id, 'mini');
  // Y un kit sin consumo publicado se aparta en vez de aprobarse.
  const sinDato = { ...KITS[0], id: 'x', watts: null };
  const j = STARLINK.elegibilidad(sinDato, esc({ presupuestoW: 200 }));
  assert.strictEqual(j.ok, false);
  assert.match(j.motivos[0], /no trae su consumo/);
});

test('DC recomienda el Mini; portatil ordena por consumo', () => {
  assert.strictEqual(STARLINK.calcular(KITS, esc({ energia: 'dc' })).recomendado.id, 'mini');
  assert.strictEqual(STARLINK.calcular(KITS, esc({ movilidad: 'portatil' })).recomendado.id, 'mini');
  const dcFijo = STARLINK.calcular(KITS, esc({ energia: 'dc', presupuestoW: 150, cableM: 20 }));
  assert.strictEqual(dcFijo.recomendado.id, 'performance', 'DC con 20 m de tendido: el Mini trae 15 m');
});

test('el tendido largo aparta al kit de cable corto y lleva al que trae el cable', () => {
  assert.strictEqual(STARLINK.calcular(KITS, esc({ cableM: 15 })).recomendado.id, 'standard', '15 m cabe justo');
  const r = STARLINK.calcular(KITS, esc({ cableM: 30 }));
  assert.strictEqual(r.recomendado.id, 'enterprise', '50 m de cable Enterprise');
  const std = r.evaluados.find((x) => x.kit.id === 'standard');
  assert.match(std.motivos[0], /supera los 15 m/);
  assert.strictEqual(STARLINK.calcular(KITS, esc({ cableM: 60 })).recomendado, null);
});

test('los terminales salen del eje que manda y N+1 suma uno', () => {
  assert.deepStrictEqual({ ...STARLINK.terminalesPorSitio(esc({ downMbps: 250 })) },
    { base: 3, total: 3, manda: 'bajada' });
  assert.deepStrictEqual({ ...STARLINK.terminalesPorSitio(esc({ upMbps: 35 })) },
    { base: 4, total: 4, manda: 'subida' });
  assert.strictEqual(STARLINK.terminalesPorSitio(esc({ redundancia: true })).total, 2);
});

test('el BOM multiplica por sitios, anade el agregador con varios terminales y no pone precios', () => {
  const e = esc({ sitios: 4, downMbps: 180 });
  const r = STARLINK.calcular(KITS, e);
  const filas = STARLINK.filasBom(r, e);
  const equipo = filas.find((f) => f.cat === 'Equipo');
  assert.strictEqual(equipo.qty, 8);
  assert.ok(filas.some((f) => f.cat === 'Integración' && f.qty === 4 && /multi-WAN/.test(f.desc)), 'un agregador por sitio');
  assert.ok(!filas.some((f) => /Cable Starlink/.test(f.desc)), 'ningun cable que la ficha no documente');
  assert.ok(filas.every((f) => f.unit == null), 'todo va «Consultar»');
});

test('un kit sin router con un solo terminal lleva la linea del router', () => {
  const e = esc({ cableM: 30 });
  const filas = STARLINK.filasBom(STARLINK.calcular(KITS, e), e);
  assert.ok(filas.some((f) => /el kit no trae router/.test(f.desc)));
  const std = STARLINK.filasBom(STARLINK.calcular(KITS, esc({})), esc({}));
  assert.ok(!std.some((f) => f.cat === 'Integración'), 'el Standard trae Router 3');
});

test('un kit elegido a mano que no cumple se cotiza pero se marca', () => {
  const r = STARLINK.calcular(KITS, esc({ movilidad: 'movimiento', kitSel: 'standard' }));
  assert.strictEqual(r.elegido.id, 'standard');
  assert.strictEqual(r.manual, true);
  assert.strictEqual(r.elegidoCumple, false);
  assert.strictEqual(r.recomendado.id, 'performance', 'elegir a mano no cambia la recomendacion');
});
