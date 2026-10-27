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

// Par EdgeHA (2026-10-27): «You can choose any LAN or WAN port combination for this HA Link […]
// You must match the media type and speed for both ends […] you cannot use MGMT ports»
// (Orchestrator, «Deployment - EdgeHA»). Cada enlace WAN aterriza en un chasis del par; cada
// chasis reserva sus 2 LAN y el puerto de la interconexión, del mismo tipo en los dos.
test('par EdgeHA: los enlaces se reparten y cada chasis gasta el puerto de la interconexión', () => {
  const dos = R.asignarPuertosPar(P('EC-10104'), [enlace(1, 'RJ45', 100), enlace(2, 'RJ45', 100)], 2);
  assert.strictEqual(dos.cabe, true);
  assert.strictEqual(dos.ha, 'rj45');
  assert.deepStrictEqual(dos.porChasis.map((c) => c.usados.rj45), [4, 4], '1 enlace + 1 HA + 2 LAN en cada uno');
  // Cuatro de 10G no caben en un EC-10106 (2 SFP+), pero en el par sí: dos en cada chasis, la
  // interconexión por cobre y los LAN en las combo.
  const diez = [1, 2, 3, 4].map((n) => enlace(n, 'SFP+ 10G', 5000));
  assert.strictEqual(R.asignarPuertos(P('EC-10106'), diez, 2).cabe, false);
  const par = R.asignarPuertosPar(P('EC-10106'), diez, 2);
  assert.strictEqual(par.cabe, true, JSON.stringify(par));
  assert.strictEqual(par.ha, 'rj45');
  assert.deepStrictEqual(par.porChasis.map((c) => c.usados.sfpPlus), [2, 2]);
  // Tres enlaces en un EC-10104: el chasis con dos se queda sin uno de sus LAN.
  const tres = R.asignarPuertosPar(P('EC-10104'), [1, 2, 3].map((n) => enlace(n, 'RJ45', 100)), 2);
  assert.strictEqual(tres.cabe, false);
  assert.strictEqual(tres.lanFaltan, 1);
  // Con los dos chasis llenos de enlaces no queda puerto para la interconexión.
  const ocho = R.asignarPuertosPar(P('EC-10104'), [1, 2, 3, 4, 5, 6, 7, 8].map((n) => enlace(n, 'RJ45', 100)), 2);
  assert.strictEqual(ocho.haFalta, true);
  assert.strictEqual(ocho.cabe, false);
  // Un respaldo ocupa puerto igual que en un chasis; un equipo virtual no tiene nada que auditar.
  assert.strictEqual(R.asignarPuertosPar(null, diez, 2).virtual, true);
});

// La interconexión, también por velocidad (mejora aprobada, 2026-10-27). En un fallo cruza lo
// que llega al chasis que no está activo; la regla de la casa pide que cubra el agregado del
// sitio. Con `haMbps` se elige el tipo común libre más barato que lo cubre; si ninguno, el más
// rápido que se pueda usar (`haCubre: false`); sin `haMbps`, como antes.
test('par EdgeHA: la interconexión va por el puerto más barato que cubre el agregado', () => {
  const dosCobre = (mbps) => [enlace(1, 'RJ45', mbps), enlace(2, 'RJ45', mbps)];
  // EC-10106: 2 SFP+, 2 combo y 2 RJ-45 por chasis. 1,6 Gbps no caben en un RJ-45 de 1 GbE.
  const rapido = R.asignarPuertosPar(P('EC-10106'), dosCobre(800), 2, { haMbps: 1600 });
  assert.strictEqual(rapido.ha, 'sfpPlus');
  assert.strictEqual(rapido.haCubre, true);
  assert.strictEqual(rapido.cabe, true);
  // 800 Mbps sí caben por cobre: un latiguillo, ninguna óptica.
  const lento = R.asignarPuertosPar(P('EC-10106'), dosCobre(400), 2, { haMbps: 800 });
  assert.strictEqual(lento.ha, 'rj45');
  assert.strictEqual(lento.haCubre, true);
  // Una jaula sin óptica que cubra (lo dice la página por su catálogo) no se elige: va el cobre,
  // y se dice que no llega.
  const sinOptica = R.asignarPuertosPar(P('EC-10106'), dosCobre(800), 2, { haMbps: 1600, haVel: (t) => (t === 'sfpPlus' ? 0 : 1000) });
  assert.strictEqual(sinOptica.ha, 'rj45');
  assert.strictEqual(sinOptica.haCubre, false);
  // Si ningún tipo cubre, el más rápido de los que se pueden usar.
  const corto = R.asignarPuertosPar(P('EC-10106'), dosCobre(800), 2, { haMbps: 20000 });
  assert.strictEqual(corto.ha, 'sfpPlus');
  assert.strictEqual(corto.haCubre, false);
  // Sin agregado, el comportamiento de antes.
  const antes = R.asignarPuertosPar(P('EC-10106'), dosCobre(800), 2);
  assert.strictEqual(antes.ha, 'rj45');
  assert.strictEqual(antes.haCubre, null);
});

test('par EdgeHA: elegir la interconexión por velocidad no cambia si el par cabe', () => {
  // El riesgo que se temía: que la jaula que gasta la interconexión le falte a un enlace. No
  // puede pasar: la interconexión se elige tras los enlaces y antes de los LAN, que van a
  // cualquier puerto. Se recorre todo el catálogo con mezclas de enlaces.
  const medios = ['RJ45', 'SFP 1G', 'SFP+ 10G', 'SFP28 25G'];
  for (const m of aruba.MODELS.filter((x) => x.puertos)) {
    for (let n = 2; n <= 8; n++) {
      for (let k = 0; k < medios.length; k++) {
        const enlaces = Array.from({ length: n }, (_, i) => enlace(i + 1, medios[(i + k) % medios.length], 500));
        const sin = R.asignarPuertosPar(m.puertos, enlaces, 2);
        for (const haMbps of [500, 2000, 15000, 40000]) {
          const con = R.asignarPuertosPar(m.puertos, enlaces, 2, { haMbps });
          assert.strictEqual(con.cabe, sin.cabe, `${m.id}, ${n} enlaces desde ${medios[k]}, ${haMbps} Mbps`);
          assert.strictEqual(con.lanFaltan, sin.lanFaltan, `${m.id}: LAN que faltan`);
          assert.strictEqual(con.haFalta, sin.haFalta, `${m.id}: interconexión`);
        }
      }
    }
  }
});
