'use strict';
// VECINOS BGP DE LA «MAXIMUM VALUES TABLE» (2026-10-13, pendiente F4-resto). Lo que fija:
//   1. la tabla sale de la respuesta oficial de FortiOS 7.6.7 y cada fila casa, al cargar, con
//      las dos cifras que el catalogo ya tenia verificadas (politicas y tuneles IPsec);
//   2. lo que no ancla o la tabla no lista queda en null, nunca con la cifra de otro modelo o
//      de otra version (3800G, 400G, 3000G, 3500G, 7081F, 7121F);
//   3. el eje es un tope de configuracion: aparta al modelo que no llega, contra el 100 %;
//   4. sin vecinos declarados, nada cambia.
const test = require('node:test');
const assert = require('node:assert');
const M = require('../public/js/fortinet-motor.js');
const R = require('../public/js/fortinet-reglas.js');
const F = require('../server/seed/legacyData/fortinet.js');

const modelo = (id) => F.MODELS.find((m) => m.id === `FortiGate ${id}`);
const CAT = { models: F.MODELS.map((m) => ({ ...m, eol: !m.hwSku })), bundles: F.BUNDLES, care: F.CARE,
  funciones: F.FUNCIONES, serviciosSdwan: F.SERVICIOS_SDWAN, terminos: F.TERMINOS, fortios: F.FORTIOS,
  ems: F.EMS_LICENCIAS, sase: F.SASE_USUARIOS, datasetVersion: 'fortinet@prueba' };
const ESC = (bgp) => ({ sitio: { segmento: 'campus' }, topologia: { rol: 'none', enlaces: [{ id: 1, tipo: 'DIA', down: 1000 }] },
  seguridad: { capa: 'fw', funciones: [] }, escala: { bgpPeers: bgp } });
const evaluar = (esc) => M.evaluar(esc, CAT, { hoy: '2026-10-13T00:00:00Z' });

test('cada fila de la tabla ancla al cargar con politicas y tuneles, y se aplica', () => {
  for (const [base, fila] of Object.entries(F.MVT_LIMITES)) {
    const m = modelo(base);
    assert.strictEqual(m.policies, fila.ancla.policies, `${base}: politicas`);
    assert.strictEqual(m.tunGw, fila.ancla.tunGw, `${base}: tuneles`);
    assert.strictEqual(m.bgpPeers, fila.bgpPeers, base);
  }
  assert.strictEqual(modelo('30G').bgpPeers, 1000);
  assert.strictEqual(modelo('1000F').bgpPeers, 5000);
  assert.strictEqual(modelo('4800F').bgpPeers, 13000);
  assert.deepStrictEqual(modelo('61F').bgpDe, { modelo: '60F', fuente: 'Maximum Values Table, FortiOS 7.6.7 (variante del mismo silicio)' });
});

test('lo que no ancla o la tabla no lista queda sin dato, no con el de otro', () => {
  for (const id of ['3800G', '3801G', '400G', '401G', '3000G', '3500G', '7081F', '7121F']) {
    assert.strictEqual(modelo(id).bgpPeers, null, id);
    assert.strictEqual(modelo(id).bgpDe, null, id);
  }
  // El 3800G no entra porque un ancla contradice: la prueba lo deja escrito.
  assert.ok(!F.MVT_LIMITES['3800G']);
  assert.strictEqual(modelo('3800G').policies, 400000);
});

test('el eje es un tope de configuracion: contra el 100 % y sin techo de utilizacion', () => {
  const e = R.EJES.find((x) => x.k === 'bgpPeers');
  assert.strictEqual(e.configuracion, true);
  assert.strictEqual(e.dureza, 'dura');
  assert.ok(!R.EJES.some((x) => /ospf|rutas/i.test(x.k)), 'ni OSPF ni rutas: la tabla no los publica como hace falta');
});

test('2000 vecinos BGP: los de 1000 se apartan con su motivo; el 1000F (5000) sigue', () => {
  const r = evaluar(ESC(2000));
  const c200 = r.candidatos.find((x) => x.id === 'FortiGate 200G');
  assert.ok(!c200.elegible);
  assert.match(c200.eval.motivo, /Vecinos BGP al 200 %/, 'el motivo nombra el eje');
  assert.ok(r.candidatos.find((x) => x.id === 'FortiGate 1000F').elegible);
  // El 3800G no tiene dato: un eje duro sin cifra aparta, no aprueba por omision.
  assert.ok(!r.candidatos.find((x) => x.id === 'FortiGate 3800G').elegible);
});

test('sin vecinos declarados el eje no existe en la evaluacion', () => {
  const r = evaluar(ESC(0));
  assert.ok(!r.recomendacion.eval.ejes.some((e) => e.k === 'bgpPeers'));
  const con = evaluar(ESC(500));
  assert.ok(con.recomendacion.eval.ejes.some((e) => e.k === 'bgpPeers'));
});
