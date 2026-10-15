'use strict';
// Puertos del chasis en el dimensionador Aruba (2026-10-15, revisión del panel 2 pedida por el
// dueño): «indica que cabe en un equipo al elegir RJ-45 o SFP, pero no valida si el equipo tiene
// ese tipo de puerto». Medido en Chromium antes del cambio: un enlace RJ-45 «cabía en EC-L»
// (6x SFP+, ningún cobre) y 3.000 Mbps por un RJ-45 de 1 GbE también. Ahora cada modelo trae su
// inventario (`PUERTOS` en aruba.js) y ArubaReglas.asignarPuertos pone cada enlace en un puerto
// real. Estas pruebas fijan la regla pura y que el inventario no invente ningún número.

const test = require('node:test');
const assert = require('node:assert');

const aruba = require('../server/seed/legacyData/aruba.js');
const R = require('../public/js/aruba-reglas.js');

const enlace = (n, medio, down, extra) => Object.assign({ id: n, tipo: 'DIA', medio, down, up: down }, extra || {});
const P = (id) => aruba.MODELS.find((m) => m.id === id).puertos;

test('cada modelo del catálogo tiene inventario de puertos (o null si es virtual)', () => {
  for (const m of aruba.MODELS) {
    assert.ok(Object.prototype.hasOwnProperty.call(aruba.PUERTOS, m.id), `${m.id}: falta en PUERTOS`);
  }
  for (const id of Object.keys(aruba.PUERTOS)) {
    assert.ok(aruba.MODELS.some((m) => m.id === id), `PUERTOS nombra un modelo que no existe: ${id}`);
  }
  assert.strictEqual(P('EC-V'), null, 'EC-V es virtual: sin chasis');
});

test('ningún número del inventario sale de la nada: cada cuenta está en el `ifaces` del modelo', () => {
  // Busca «Nx <algo de ese tipo>» en el texto oficial transcrito. El texto varía de documento
  // a documento («dual-media», «combo», «10GBASE-X (SFP+)»…), así que cada tipo admite sus
  // rótulos, y la cuenta tiene que aparecer pegada a uno de ellos.
  const rotulos = {
    rj45: /(RJ-?45|GbE(?! SFP)|10\/100\/1000)/i,
    combo: /(combo|dual-media)/i,
    sfp: /SFP(?![+2])/i,
    sfpPlus: /(SFP\+|10GBASE-X)/i,
    sfp28: /SFP28/i,
  };
  for (const m of aruba.MODELS) {
    const p = m.puertos;
    if (!p) continue;
    const trozos = m.ifaces.split(/\s+\+\s+|\s*·\s*/);
    for (const [tipo, n] of Object.entries(p)) {
      if (tipo === 'celular') { assert.match(m.ifaces, /LTE/, `${m.id}: módem celular sin LTE en su ficha`); continue; }
      const casa = trozos.some((t) => new RegExp(`(^|\\s)${n}x\\s`).test(t) && rotulos[tipo].test(t));
      assert.ok(casa, `${m.id}: ${n}x ${tipo} no aparece en su ifaces («${m.ifaces}»)`);
    }
  }
});

test('un enlace RJ-45 no cabe en un chasis sin cobre (EC-L, EC-10150, 9240)', () => {
  for (const id of ['EC-L', 'EC-10150', 'Gateway 9240']) {
    const a = R.asignarPuertos(P(id), [enlace(1, 'RJ45', 100)], 2);
    assert.strictEqual(a.cabe, false, `${id}: un RJ-45 no puede ir a una jaula SFP sin transceptor declarado`);
    assert.deepStrictEqual(a.sinAsignar.map((x) => x.enlace), [1]);
  }
  // Declarado como SFP 1G (el transceptor de cobre va en la jaula), sí.
  assert.strictEqual(R.asignarPuertos(P('EC-L'), [enlace(1, 'SFP 1G', 100)], 2).cabe, true);
});

test('el EC-10104 y el EC-XS: cuatro RJ-45 para enlaces y LAN, ninguna jaula', () => {
  for (const id of ['EC-10104', 'EC-XS']) {
    assert.strictEqual(R.asignarPuertos(P(id), [enlace(1, 'RJ45', 100), enlace(2, 'RJ45', 100)], 2).cabe, true, `${id}: 2 + 2 LAN caben`);
    const tres = R.asignarPuertos(P(id), [1, 2, 3].map((n) => enlace(n, 'RJ45', 50)), 2);
    assert.strictEqual(tres.cabe, false, `${id}: 3 enlaces + 2 LAN no caben en 4 puertos`);
    assert.strictEqual(tres.lanFaltan, 1);
    assert.strictEqual(R.asignarPuertos(P(id), [enlace(1, 'SFP 1G', 100)], 2).cabe, false, `${id}: sin jaulas SFP`);
  }
});

test('EC-10106/10108: dos SFP+ y dos combo — cuatro de 1G caben, tres de 10G no', () => {
  const p = P('EC-10108');
  assert.strictEqual(R.asignarPuertos(p, [1, 2, 3, 4].map((n) => enlace(n, 'SFP 1G', 100)), 2).cabe, true);
  const diez = R.asignarPuertos(p, [1, 2, 3].map((n) => enlace(n, 'SFP+ 10G', 2000)), 2);
  assert.strictEqual(diez.cabe, false);
  assert.deepStrictEqual(diez.sinAsignar.map((x) => x.enlace), [3]);
  assert.strictEqual(R.asignarPuertos(p, [enlace(1, 'SFP28 25G', 2000)], 2).cabe, false, 'sin SFP28 en el 10108');
});

test('el combo se reserva para el cobre antes que para la fibra de 1G', () => {
  // 7205: 2 SFP+ y 4 dual-media. Cuatro RJ-45 y dos SFP 1G caben si la fibra va a las SFP+.
  const links = [1, 2, 3, 4].map((n) => enlace(n, 'RJ45', 50)).concat([enlace(5, 'SFP 1G', 50), enlace(6, 'SFP 1G', 50)]);
  assert.strictEqual(R.asignarPuertos(P('7205'), links, 0).cabe, true);
});

test('un respaldo ocupa puerto; un enlace sin caudal, no', () => {
  const p = P('EC-10104');
  assert.strictEqual(R.asignarPuertos(p, [enlace(1, 'RJ45', 100), enlace(2, 'RJ45', 50, { rol: 'respaldo' }), enlace(3, 'RJ45', 50)], 2).cabe, false);
  assert.strictEqual(R.asignarPuertos(p, [enlace(1, 'RJ45', 100), enlace(2, 'RJ45', 0)], 2).cabe, true);
});

test('el 4G/5G del 9004-LTE va al módem integrado, no a un RJ-45', () => {
  const links = [enlace(1, 'RJ45', 100), enlace(2, 'RJ45', 100), enlace(3, 'RJ45', 50, { tipo: '4G/5G' })];
  assert.strictEqual(R.asignarPuertos(P('Gateway 9004-LTE'), links, 2).cabe, true);
  assert.strictEqual(R.asignarPuertos(P('Gateway 9004'), links, 2).cabe, false);
});

test('el medio sube al primero que lleva el caudal, y no baja del típico del transporte', () => {
  assert.strictEqual(R.medioMinimo(500, 'RJ45'), 'RJ45');
  assert.strictEqual(R.medioMinimo(1000, 'RJ45'), 'RJ45');
  assert.strictEqual(R.medioMinimo(3000, 'RJ45'), 'SFP+ 10G');
  assert.strictEqual(R.medioMinimo(20000, 'RJ45'), 'SFP28 25G');
  assert.strictEqual(R.medioMinimo(40000, 'RJ45'), null);
  assert.strictEqual(R.medioMinimo(100, 'SFP 1G'), 'SFP 1G');
  const sobre = R.enlacesSobreMedio([enlace(1, 'RJ45', 3000), enlace(2, 'SFP+ 10G', 3000)]);
  assert.deepStrictEqual(sobre.map((l) => l.n), [1]);
});

test('ningún RJ-45 del catálogo pasa de 1 GbE (la regla del medio lo da por hecho)', () => {
  for (const m of aruba.MODELS) {
    if (!m.puertos || !(m.puertos.rj45 || m.puertos.combo)) continue;
    assert.doesNotMatch(m.ifaces, /(2\.5|5|10)GBASE-T|mGig|Smart Rate/i, `${m.id}: trae cobre multigigabit y MEDIO_MBPS.RJ45 lo trataría como 1G`);
  }
  assert.strictEqual(R.MEDIO_MBPS.RJ45, 1000);
});
