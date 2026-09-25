'use strict';
// Guardia de datos del TECHO de la línea EdgeConnect (2026-09-16, corrección del
// desbordamiento con enlaces de gran capacidad).
//
// CONTEXTO. Un escenario 5000+5000 Mbps produce un requerimiento de diseño de ≈21,4 Gbps
// (motor de ingeniería: ÷IMIX 0,70 × 1,15 FEC × 1,30 margen) y el dimensionador caía al
// veredicto vacío. La propuesta que acompañaba al reporte traía cifras y SKU que el
// QuickSpecs oficial a50004289enw V18 (06-jul-2026, copia en public/datasheets/
// edgeconnect-quickspecs.pdf) REFUTA literalmente:
//
//   · «EC-10108 = SKU S2D93A, 10 Gbps»     → FALSO. El SKU de pedido es S0E23A (línea BTO
//     de la guía de configuración) y la tabla Comparison (p.30) y su ficha por modelo
//     (p.36) publican «Typical WAN Bandwidth 2-2000 Mbps» / «WAN bandwidth 2 to 2000 Mbps
//     (bidirectional)». Los 10G del 10108 son la velocidad de sus INTERFACES SFP+, no el
//     throughput del appliance.
//   · «EC-10150 tolera hasta 20.000 Mbps»  → FALSO. La misma p.30 publica «Up to 12 Gbps».
//     El catálogo ya llevaba 12000 y se queda así.
//   · «EC-XL = SKU JZ888A»                 → FALSO. JZ888A es el kit de montaje
//     «EC-L/XL-H Center Mount Kit» (catálogo maestro de accesorios, lista oficial del
//     distribuidor). El chasis EC-XL-H-10G es S0B67A — y está FUERA DE VENTA (último
//     pedido 2026-03-31, política oficial de ciclo de vida), así que no es propuesta
//     para diseño nuevo en ningún caso.
//   · «EC-V-10G»                           → NO EXISTE como SKU: EC-V es el appliance
//     virtual y su caudal lo fijan el tier de la suscripción y los vCPU asignados, sin
//     cifra de hardware publicada (wanMax null por regla de la casa: sin dato oficial,
//     no se inventa).
//
// Estas guardias fijan las cifras oficiales para que nadie las «corrija» después con el
// snippet erróneo, y fijan también de qué dato cuelga el texto del veredicto de
// desbordamiento (el modelo del techo y su cifra salen de MODELS, no de literales).

const test = require('node:test');
const assert = require('node:assert');
const { MODELS, ARUBA_ACCESSORY_CATALOG } = require('../server/seed/legacyData/aruba.js');

const porId = (id) => MODELS.find((m) => m.id === id);

test('EC-10150: el techo oficial de la línea es 12 Gbps (QuickSpecs V18 p.30), no 20', () => {
  const m = porId('EC-10150');
  assert.ok(m, 'el EC-10150 está en el catálogo');
  assert.strictEqual(m.wanMax, 12000, '«Up to 12 Gbps» (a50004289enw V18, p.30)');
  assert.strictEqual(m.hwSku, 'S2N65A', 'SKU BTO de la guía de configuración del QuickSpecs');
  assert.ok(!m.eolAnnounced, 'vigente: ordenable en la guía de pedido del QuickSpecs V18');
});

test('EC-10108: SKU real S0E23A y rango WAN 2-2000 Mbps (el 10G es la interfaz, no el throughput)', () => {
  const m = porId('EC-10108');
  assert.ok(m, 'el EC-10108 está en el catálogo');
  assert.strictEqual(m.hwSku, 'S0E23A', 'S2D93A no es el chasis: es S0E23A (línea BTO del QuickSpecs)');
  assert.strictEqual(m.wanMin, 2);
  assert.strictEqual(m.wanMax, 2000, 'p.30 «2-2000 Mbps» y ficha p.36 «2 to 2000 Mbps (bidirectional)»');
});

test('EC-XL: chasis S0B67A (JZ888A es el kit de montaje) y fuera de venta', () => {
  const m = porId('EC-XL');
  assert.ok(m, 'el EC-XL está en el catálogo');
  assert.strictEqual(m.hwSku, 'S0B67A', 'EC-XL-H-10G = S0B67A, no JZ888A');
  assert.ok(m.eolAnnounced && m.eolAnnounced.lastOrder === '2026-03-31',
    'fin de venta vencido (política oficial de ciclo de vida): nunca se recomienda para diseño nuevo');
});

test('JZ888A es un accesorio de montaje, no un chasis', () => {
  const a = ARUBA_ACCESSORY_CATALOG.JZ888A;
  assert.ok(a, 'JZ888A figura en el catálogo maestro de accesorios');
  assert.match(a.name, /Center Mount/i, '«EC-L/XL-H Center Mount Kit» — kit de montaje en rack');
  assert.strictEqual(a.category, 'MOUNT');
});

test('EC-V: sin techo de hardware publicado (wanMax null) — se dimensiona por licencia y vCPU', () => {
  const m = porId('EC-V');
  assert.ok(m, 'el EC-V está en el catálogo');
  assert.strictEqual(m.wanMax, null, 'ningún «EC-V-10G»: sin cifra oficial no se inventa');
  assert.strictEqual(m.hwSku, null, 'no hay SKU de chasis: se licencia por tier de suscripción');
});

test('el techo de la familia EdgeConnect lo pone el EC-10150 (de ahí lo lee el veredicto)', () => {
  const tope = MODELS.filter((m) => m.fam === 'ec' && m.wanMax != null)
    .sort((a, b) => b.wanMax - a.wanMax)[0];
  assert.strictEqual(tope.id, 'EC-10150');
  assert.strictEqual(tope.wanMax, 12000);
});
