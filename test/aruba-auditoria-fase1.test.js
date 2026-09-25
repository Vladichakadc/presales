'use strict';
// FASE 1 DE LA AUDITORIA TECNICA DEL 2026-09-17 («Auditoria tecnica — Dimensionador
// Aruba»): los cinco hallazgos criticos que cambiaban el equipo o el precio de la
// propuesta, mas el A1 (DTD en EC-XS). Cada prueba reproduce el escenario con el que se
// encontro el fallo en produccion y fija la cifra correcta, para que un refactor no los
// devuelva en silencio.
//
//   C1  tier Foundation inexistente («Foundation 200 Mbps» en «consultar»)
//   C2  9240: capacidades AOS 8 con SKU de licencia AOS 10 (Gold de US$19.995 de mas)
//   C3  serie 9000 limitada a 32 APs (cifra AOS 8): 9106 donde basta un 9012
//   C4  Boost ~5x: 10 bloques (US$196.560) donde la regla de la propia pagina da 2
//   C5  7005/7008/7210/7220 cotizables pese a su boletin oficial de fin de venta
//   A1  EC-XS recomendado con Dynamic Threat Defense, que no corre en el

const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { cargar } = require('./ayuda/navegador.js');

const aruba = require('../server/seed/legacyData/aruba.js');
const R = require('../public/js/aruba-reglas.js');
const { calcularRequerimientosIngenieria } = require('../public/js/motor-ingenieria.js');
const { FICHA } = cargar('public/js/ficha.js');

const porId = (id) => aruba.MODELS.find((m) => m.id === id);
const TIERS = aruba.BW_TIERS;
const LIC = aruba.LICENSES;

// ── C1 ───────────────────────────────────────────────────────────────────────
test('C1: el tier automatico nunca propone un tier que no existe para el nivel', () => {
  for (const nivel of ['foundation', 'advanced', 'onprem']) {
    for (let mbps = 1; mbps <= 5000; mbps += 7) {
      const t = R.tierParaCaudal(TIERS, LIC, mbps, nivel);
      assert.ok(t, `${nivel} ${mbps} Mbps: hay tier`);
      assert.ok(LIC[t.code] && LIC[t.code][nivel],
        `${nivel} ${mbps} Mbps: el tier ${t.code} no existe para ese nivel — la suscripción quedaría en «consultar»`);
      assert.ok(t.mbps == null || t.mbps >= mbps, `${nivel} ${mbps} Mbps: el tier ${t.code} no cubre el caudal`);
    }
  }
});

test('C1: los escenarios de la auditoria eligen el tier Foundation que SI se vende', () => {
  // Escenario A: DIA 100 + 4G 50 = 150 Mbps → Foundation 1 Gbps (antes «Foundation 200 Mbps»).
  assert.strictEqual(R.tierParaCaudal(TIERS, LIC, 150, 'foundation').code, 'bw1g');
  // Escenario D: 40 Mbps → Foundation 100 Mbps (antes «Foundation 50 Mbps»).
  assert.strictEqual(R.tierParaCaudal(TIERS, LIC, 40, 'foundation').code, 'bw100');
  // Escenario G: 2 Gbps → Foundation ilimitado (antes «Foundation 2 Gbps»).
  assert.strictEqual(R.tierParaCaudal(TIERS, LIC, 2000, 'foundation').code, 'bwunl');
  // Advanced conserva su escalera fina.
  assert.strictEqual(R.tierParaCaudal(TIERS, LIC, 150, 'advanced').code, 'bw200');
  assert.strictEqual(R.tierParaCaudal(TIERS, LIC, 2000, 'advanced').code, 'bw2g');
});

test('C1: con Foundation, el tier elegido es mas barato que el Advanced equivalente (a 3 anos)', () => {
  // Documenta la premisa de no «subir» a Advanced por precio: con la lista vigente,
  // Foundation en su tier valido siempre cuesta menos. Si la lista cambia y deja de ser
  // cierto, esta prueba avisa de que hay que comparar los dos niveles.
  for (const mbps of [10, 40, 150, 450, 900, 1500, 2000, 4000]) {
    const f = R.tierParaCaudal(TIERS, LIC, mbps, 'foundation');
    const a = R.tierParaCaudal(TIERS, LIC, mbps, 'advanced');
    assert.ok(LIC[f.code].foundation.y3 <= LIC[a.code].advanced.y3,
      `${mbps} Mbps: Foundation ${f.code} (${LIC[f.code].foundation.y3}) vs Advanced ${a.code} (${LIC[a.code].advanced.y3})`);
  }
});

// ── C2 ───────────────────────────────────────────────────────────────────────
test('C2: el 9240 cotiza los SKU AOS 10 con la capacidad AOS 10, y los AOS 8 con la AOS 8', () => {
  const m = porId('Gateway 9240');
  const csv = fs.readFileSync(path.join(__dirname, '..', 'public/datasheets/aruba-lista-precios-hpe.csv'), 'utf8');
  const a10 = R.capacidadSo(m, 'aos10').licCap;
  const a8 = R.capacidadSo(m, 'aos8').licCap;
  // AOS 10 — «AOS 10 Capacity Licenses» (techdocs HPE) + DS serie 9200.
  assert.deepStrictEqual(a10.map((t) => [t.fw, t.aps, t.clients]),
    [[20000, 4000, 32000], [30000, 8000, 48000], [40000, 16000, 64000]]);
  assert.deepStrictEqual(a10.map((t) => t.sku || null), [null, 'R8R41AAE', 'R8R42AAE']);
  for (const sku of ['R8R41AAE', 'R8R42AAE']) {
    const fila = csv.split('\n').find((l) => l.startsWith(sku + ','));
    assert.ok(fila && /AOS10/.test(fila), `${sku} es la licencia AOS 10 en la lista del distribuidor`);
  }
  // AOS 8 — tabla AOS 8 del DS serie 9200 (reemplazo de 7210/7220/7240XM).
  assert.deepStrictEqual(a8.map((t) => [t.fw, t.aps, t.clients]),
    [[20000, 512, 16000], [30000, 1000, 24000], [40000, 2000, 32000]]);
  assert.deepStrictEqual(a8.map((t) => t.sku || null), [null, 'R8R13AAE', 'R8R14AAE']);
  assert.ok(a8.every((t) => t.elp == null), 'AOS 8 sin List Price en la lista: «consultar», nunca inventado');
  // La base del catálogo es AOS 10 y coincide con porSo.aos10: SKU y cifra de la misma arquitectura.
  assert.deepStrictEqual(m.licCap, a10);
});

test('C2: escenario C (12.000 clientes, 1.200 APs) ya no pide licencia Gold en AOS 10', () => {
  const nivel = (licCap, need, users, aps) => licCap.find((t) => t.fw >= need && t.clients >= users && t.aps >= aps);
  const m = porId('Gateway 9240');
  assert.strictEqual(nivel(R.capacidadSo(m, 'aos10').licCap, 4700, 12000, 1200).code, 'hw',
    'AOS 10: el 9240 sin licencia cubre 12.000 clientes y 1.200 APs');
  assert.strictEqual(nivel(R.capacidadSo(m, 'aos8').licCap, 4700, 12000, 1200).code, 'gold',
    'AOS 8: sí hace falta Gold (2.000 APs)');
});

// ── C3 ───────────────────────────────────────────────────────────────────────
test('C3: la serie 9000 gestiona 128/256 APs en AOS 10 y 32 en AOS 8', () => {
  assert.strictEqual(R.capacidadSo(porId('Gateway 9004'), 'aos10').aps, 128);
  assert.strictEqual(R.capacidadSo(porId('Gateway 9004-LTE'), 'aos10').aps, 128);
  assert.strictEqual(R.capacidadSo(porId('Gateway 9012'), 'aos10').aps, 256);
  for (const id of ['Gateway 9004', 'Gateway 9004-LTE', 'Gateway 9012']) {
    assert.strictEqual(R.capacidadSo(porId(id), 'aos8').aps, 32, `${id} en AOS 8`);
  }
  // Escenario H: 40 APs caben en un 9012 (y un 9004) en AOS 10 — antes se escalaba a 9106.
  assert.ok(R.capacidadSo(porId('Gateway 9012'), 'aos10').aps >= 40);
  assert.ok(R.capacidadSo(porId('Gateway 9012'), 'aos8').aps < 40);
});

test('C3: un gateway sin cifras para el SO elegido se declara, no se afirma', () => {
  const s8 = R.capacidadSo(porId('Gateway 9114'), 'aos8');
  assert.ok(s8.sinCifra && /AOS 8/.test(s8.motivo), 'el 9114 no corre AOS 8');
  // 2026-09-24: la tabla «AOS-8 Specifications» de la QuickSpecs 9100 (p. 14) se transcribió —
  // antes el 9106 se declaraba sin cifra en AOS 8. Ahora trae la suya y el 9114 sigue sin
  // correr AOS 8 («Not Supported» en esa misma tabla).
  const s106 = R.capacidadSo(porId('Gateway 9106'), 'aos8');
  assert.ok(!s106.sinCifra, '9106: en AOS 8 ya tiene cifras propias');
  assert.strictEqual(s106.aps, 256, '9106 en AOS 8: 256 APs (QuickSpecs 9100, tabla AOS-8)');
  assert.strictEqual(s106.clients, 8000, '9106 en AOS 8: 8K usuarios/dispositivos concurrentes');
  for (const m of aruba.MODELS.filter((x) => x.legacy)) {
    assert.ok(R.capacidadSo(m, 'aos10').sinCifra, `${m.id}: sus cifras son AOS 8`);
    assert.deepStrictEqual(R.capacidadSo(m, 'aos8'), {}, `${m.id}: en AOS 8 valen las cifras base`);
  }
  // EdgeConnect no depende del SO de los gateways.
  for (const m of aruba.MODELS.filter((x) => x.fam === 'ec')) {
    assert.deepStrictEqual(R.capacidadSo(m, 'aos8'), {}, `${m.id} corre ECOS`);
  }
});

// ── C4 ───────────────────────────────────────────────────────────────────────
test('C4: Boost sobre el trafico de los tuneles — escenario E pasa de 10 bloques a 2', () => {
  // Escenario E de la auditoría: MPLS 1G + DIA 1G, breakout activo, 800 usuarios x 3 Mbps.
  const ing = calcularRequerimientosIngenieria({
    bw_mpls_mbps: 1000, bw_internet_mbps: 1000, local_breakout_activo: true,
    perfil_trafico: 'ENTERPRISE_MIX', fec_activo: true, enlace_calidad: 'NORMAL',
    modelo_seguridad: 'NINGUNO', headroom_pct: 30, total_usuarios: 800, densidad_usuarios: 'ESTANDAR',
  });
  const mbps = R.boostMbpsSitio({ bwTunelesPrivados: ing.distribucion.bwTunelesPrivados,
    caudalTotal: 2000, users: 800, perUser: 3 });
  assert.strictEqual(ing.distribucion.bwTunelesPrivados, 600, 'la misma cifra que el hint del breakout');
  assert.strictEqual(mbps, 180, '30 % de 600 Mbps');
  assert.strictEqual(Math.max(1, Math.ceil(mbps / aruba.BOOST.bloque)), 2, '2 bloques de 100 Mbps, no 10');
  // Sin enlaces declarados: 30 % de la demanda actual, sin margen.
  assert.strictEqual(R.boostMbpsSitio({ caudalTotal: 0, users: 100, perUser: 2 }), 60);
});

test('C4: el Boost recomendado por HPE se lee como numero y deja fuera a quien no llega', () => {
  assert.strictEqual(R.boostRecMbps(porId('EC-10104')), 200);
  assert.strictEqual(R.boostRecMbps(porId('EC-S')), 500);
  assert.strictEqual(R.boostRecMbps(porId('EC-M')), 1000);
  assert.strictEqual(R.boostRecMbps(porId('EC-10150')), 8000);
  assert.strictEqual(R.boostRecMbps(porId('EC-V')), null, 'sin dato publicado: no descarta, se declara');
  // Todo EdgeConnect físico que admite Boost publica su recomendado.
  for (const m of aruba.MODELS.filter((x) => x.fam === 'ec' && x.boostMax != null)) {
    assert.ok(R.boostRecMbps(m) > 0, `${m.id}: boostRec legible`);
  }
});

// ── C5 ───────────────────────────────────────────────────────────────────────
test('C5: 7005/7008/7210/7220 llevan su boletin oficial y ya no se recomiendan', () => {
  const esperado = {
    7005: ['2022-10-31', '2027-10-31', 'Gateway 9004'],
    7008: ['2022-10-31', '2027-10-31', 'Gateway 9012'],
    7210: ['2025-01-31', '2030-01-31', 'Gateway 9240'],
    7220: ['2025-01-31', '2030-01-31', 'Gateway 9240'],
  };
  for (const [id, [lastOrder, eos, sucesor]] of Object.entries(esperado)) {
    const m = porId(id);
    assert.ok(m.eolAnnounced, `${id}: boletín de fin de venta`);
    assert.strictEqual(m.eolAnnounced.lastOrder, lastOrder);
    assert.strictEqual(m.eolAnnounced.endOfSupport, eos);
    assert.ok(m.eolAnnounced.sucesor.startsWith(sucesor), `${id}: sucesor oficial ${sucesor}`);
    assert.ok(/^https:\/\/asp-documents\.arubanetworks\.com\//.test(m.eolAnnounced.url), `${id}: URL del boletín oficial`);
    assert.strictEqual(FICHA.recomendable(m), false, `${id}: fuera de venta nunca se recomienda`);
  }
  assert.strictEqual(porId('7008').sucesor, 'Gateway 9012', 'el boletín reemplaza el 7008 por el 9012, no por el 9004');
  // Sin boletín localizado: siguen como línea anterior, sin marca inventada.
  for (const id of ['7010', '7024', '7030', '7205', '7240XM']) {
    assert.strictEqual(porId(id).eolAnnounced, null, `${id}: sin boletín oficial, sin marca`);
  }
});

// ── A1 ───────────────────────────────────────────────────────────────────────
test('A1: Dynamic Threat Defense es filtro duro — ni EC-XS ni gateways', () => {
  assert.strictEqual(R.admiteDtd(porId('EC-XS')), false);
  assert.ok(!/^S/.test(porId('EC-XS').spec.idsips), 'la ficha del EC-XS ya no afirma IDS/IPS');
  for (const id of ['EC-10104', 'EC-10106', 'EC-S', 'EC-M', 'EC-10150', 'EC-V']) {
    assert.strictEqual(R.admiteDtd(porId(id)), true, id);
  }
  assert.strictEqual(R.admiteDtd(porId('Gateway 9004')), false, 'DTD es licencia EdgeConnect');
});

// ── Contrato de la pagina ────────────────────────────────────────────────────
test('la pagina carga las reglas y las usa en vez de copias propias', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'public/dimensionador-aruba-edgeconnect.html'), 'utf8');
  const js = fs.readFileSync(path.join(__dirname, '..', 'public/js/dimensionador-aruba-edgeconnect.js'), 'utf8');
  assert.ok(html.indexOf('/js/aruba-reglas.js') > -1 && html.indexOf('/js/aruba-reglas.js') < html.indexOf('/js/dimensionador-aruba-edgeconnect.js'),
    'aruba-reglas.js se carga antes que el script de la página');
  assert.ok(html.includes('id="soSeg"'), 'el selector de sistema operativo existe');
  assert.ok(js.includes("'soSeg'"), 'el SO viaja en el enlace del escenario');
  assert.ok(js.includes('ArubaReglas.tierParaCaudal('), 'C1 usa la regla probada');
  assert.ok(js.includes('ArubaReglas.boostMbpsSitio('), 'C4 usa la regla probada');
  assert.ok(js.includes('ArubaReglas.admiteDtd('), 'A1 usa la regla probada');
  assert.ok(!js.includes('function boostMbpsAuto'), 'la fórmula de Boost anterior no sobrevive como copia');
});
