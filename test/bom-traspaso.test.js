'use strict';
// Casado de nombres entre el dimensionador y el cotizador. Los dos catalogos nombran los
// equipos distinto ("SRX380" frente a "Juniper SRX380", "EC-XS" frente a "Aruba EC-XS"), asi
// que se normaliza en vez de mantener a mano una tabla de equivalencias que se
// desincronizaria. Estas pruebas fijan que la normalizacion no colapse equipos distintos.
const test = require('node:test');
const assert = require('node:assert');
const { cargar } = require('./ayuda/navegador');

const { BOM } = cargar('public/js/bom.js');
const norm = BOM.normalizar;

test('el prefijo de fabricante no impide el casado', () => {
  assert.strictEqual(norm('Juniper SRX380'), norm('SRX380'));
  assert.strictEqual(norm('Aruba EC-XS'), norm('EC-XS'));
  assert.strictEqual(norm('FortiGate 200G'), norm('fortigate 200g'));
});

test('separadores y mayusculas dan igual', () => {
  assert.strictEqual(norm('SRX-380'), norm('srx 380'));
  assert.strictEqual(norm('C8300-1N1S-4T2X'), norm('c8300 1n1s 4t2x'));
});

test('dos equipos distintos NO se colapsan en el mismo nombre', () => {
  // Es el riesgo real de normalizar: pasarse de tolerante y meter en el BOM un equipo que
  // no es el que se dimensiono.
  assert.notStrictEqual(norm('SRX380'), norm('SRX340'));
  assert.notStrictEqual(norm('FortiGate 90G'), norm('FortiGate 91G'));
  assert.notStrictEqual(norm('EC-XS'), norm('EC-S'));
});

test('un nombre que es solo el fabricante no se queda vacio', () => {
  // Si al quitar el prefijo no queda nada, se conserva el original: una cadena vacia casaria
  // con cualquier otra cadena vacia y meteria lineas cruzadas.
  assert.notStrictEqual(norm('Juniper'), '');
  assert.notStrictEqual(norm('Cisco'), norm('Aruba'));
});

/* ── EL COTIZADOR RECIBE EL BOM COMPLETO (A6, 2026-09-18) ──────────────────────────────
   Medido en Chromium antes de escribir esto: el BOM de un FortiGate 200G a 2.500 Mbps son
   cuatro lineas por $38.088,20 y al cotizador viajaba SOLO el equipo, $11.477 — el 70 % de
   la cotizacion se volvia a teclear a mano. Lo que estas pruebas fijan no es que viaje mas,
   sino las tres reglas que impiden que viaje MAL: el hardware no se cotiza dos veces, la
   tabla consolidada multi-sede no se confunde con el BOM de la pantalla, y cuando no se puede
   probar que el BOM es el del equipo que viaja, viaja solo el equipo y se dice por que. */

// Los objetos vienen del realm de `vm` que monta `cargar()`, asi que su prototipo no es el
// de este modulo y `deepStrictEqual` los rechaza aunque coincidan campo a campo. Se aplanan.
const llano = (x) => JSON.parse(JSON.stringify(x));

function conBom(filas, opciones) {
  const g = cargar('public/js/bom.js');
  g.BOM.fijarVendor('fortinet');
  g.BOM.renderTabla(filas, opciones || {});
  return g.BOM;
}

const FILAS_200G = [
  { cat: 'Equipo', desc: 'FortiGate 200G', sku: 'FG-200G', qty: 1, unit: 11477, nota: 'Campus / Agr · 10GE SFP+' },
  { cat: 'Licencias FortiGuard', desc: 'Enterprise Protection', sku: 'FC-10-FG2HG-809-02-DD', qty: 1, unit: 21205.8, nota: 'término 3 años' },
  { cat: 'Soporte', desc: 'FortiCare Premium', sku: 'FC-10-FG2HG-247-02-DD', qty: 1, unit: 4989.6, nota: 'término 3 años' },
];

test('al cotizador viaja el equipo por nombre y el resto del BOM como referencias', () => {
  const B = conBom(FILAS_200G);
  const r = B.enviarACotizador({ modelo: 'FortiGate 200G', qty: 1, de: 'Fortinet' });
  assert.strictEqual(r.ok, true);
  assert.strictEqual(r.motivo, '');
  assert.strictEqual(r.lineas, 3);
  const cola = B.recogerEntrada();
  // El equipo sigue viajando SOLO como nombre: su precio lo pone CATALOG, que es la fuente
  // de verdad del cotizador. Si viajara con precio habria dos sitios con el mismo dato.
  assert.deepStrictEqual(llano(cola[0]), { modelo: 'FortiGate 200G', qty: 1, nota: '', de: 'Fortinet' });
  assert.strictEqual(cola[0].ref, undefined);
  assert.deepStrictEqual(llano(cola.slice(1).map((e) => e.ref.sku)),
    ['FC-10-FG2HG-809-02-DD', 'FC-10-FG2HG-247-02-DD']);
  // La categoria viaja para que la cotizacion agrupe la linea por lo que es.
  assert.deepStrictEqual(llano(cola.slice(1).map((e) => e.ref.cat)), ['Licencias FortiGuard', 'Soporte']);
  assert.strictEqual(cola[1].ref.p, 21205.8);
  assert.strictEqual(cola[1].ref.v, 'fortinet');
});

test('la fila del equipo NO viaja ademas como referencia', () => {
  // Es el fallo de los $38.088,20 -> $49.565,20 que renderTabla ya avisa para las
  // referencias anadidas a mano: el mismo cortafuegos cotizado dos veces.
  const B = conBom(FILAS_200G);
  B.enviarACotizador({ modelo: 'FortiGate 200G', qty: 1, de: 'Fortinet' });
  const skus = B.recogerEntrada().filter((e) => e.ref).map((e) => e.ref.sku);
  assert.ok(!skus.includes('FG-200G'));
});

test('con el equipo SIN SKU, la categoria es la unica defensa y basta', () => {
  // Es el caso REAL de cuatro de los seis dimensionadores que montan el boton: Huawei,
  // Juniper, MikroTik y Nokia construyen su fila de hardware con `sku: null` porque esos
  // catalogos no traen referencia de pedido. Ahi la defensa del SKU no puede actuar y la
  // unica que queda es `cat !== 'Equipo'`. Sin esta prueba, un sabotaje que quitara esa
  // condicion pasaba en verde — comprobado saboteandola.
  const B = conBom([
    { cat: 'Equipo', desc: 'NetEngine AR6710', sku: null, qty: 1, unit: null },
    { cat: 'Óptica', desc: 'SFP+ 10G SR', sku: 'OPT-10G-SR', qty: 2, unit: 180 },
  ]);
  const r = B.enviarACotizador({ modelo: 'NetEngine AR6710', qty: 1, de: 'Huawei' });
  assert.strictEqual(r.lineas, 2); // el equipo + la optica, nunca el equipo dos veces
  const cola = B.recogerEntrada();
  assert.deepStrictEqual(llano(cola.filter((e) => e.ref).map((e) => e.ref.d)), ['SFP+ 10G SR']);
});

test('una fila de otra categoria que repite el SKU del equipo tampoco viaja', () => {
  const B = conBom(FILAS_200G.concat([
    { cat: 'Repuestos', desc: 'FortiGate 200G de repuesto', sku: 'FG-200G', qty: 1, unit: 11477 },
  ]));
  B.enviarACotizador({ modelo: 'FortiGate 200G', qty: 1, de: 'Fortinet' });
  const skus = B.recogerEntrada().filter((e) => e.ref).map((e) => e.ref.sku);
  assert.ok(!skus.includes('FG-200G'));
});

test('la nota de cada fila NO viaja: lleva texto interno y la cotizacion la ve el cliente', () => {
  const B = conBom(FILAS_200G);
  B.enviarACotizador({ modelo: 'FortiGate 200G', qty: 1, de: 'Fortinet' });
  for (const e of B.recogerEntrada().filter((x) => x.ref)) {
    assert.strictEqual(e.ref.nota, undefined);
    assert.ok(!JSON.stringify(e.ref).includes('término 3 años'));
  }
});

test('sin ninguna fila de categoria Equipo viaja solo el equipo, y se dice', () => {
  // Falla cerrado: sin saber cual de las filas es el hardware, mandarlas todas lo cotizaria
  // dos veces. Se prefiere una cotizacion corta y declarada a una inflada en silencio.
  const B = conBom([{ cat: 'Soporte', desc: 'FortiCare', sku: 'FC-1', qty: 1, unit: 100 }]);
  const r = B.enviarACotizador({ modelo: 'FortiGate 200G', qty: 1, de: 'Fortinet' });
  assert.strictEqual(r.motivo, 'sin-equipo');
  assert.strictEqual(r.lineas, 1);
  assert.strictEqual(B.recogerEntrada().length, 1);
});

test('si el BOM esta cotizando otro equipo, sus licencias no viajan', () => {
  // El desplegable del BOM cotiza cualquier equipo a proposito (ver avisoDesvio), asi que el
  // BOM puede ser de otra caja. Sus licencias no corresponden al equipo que se manda.
  const B = conBom(FILAS_200G);
  const r = B.enviarACotizador({ modelo: 'FortiGate 30G', qty: 1, de: 'Fortinet' });
  assert.strictEqual(r.motivo, 'otro-equipo');
  assert.strictEqual(r.lineas, 1);
  assert.deepStrictEqual(llano(B.recogerEntrada().map((e) => e.modelo)), ['FortiGate 30G']);
});

test('el prefijo del fabricante no rompe el casado entre la fila del BOM y el modelo', () => {
  const B = conBom([{ cat: 'Equipo', desc: 'EC-XS', sku: 'R7Q47A', qty: 1, unit: 1000 },
    { cat: 'Suscripción', desc: 'EdgeConnect Advanced', sku: 'SUB-1', qty: 1, unit: 500 }]);
  const r = B.enviarACotizador({ modelo: 'Aruba EC-XS', qty: 1, de: 'Aruba' });
  assert.strictEqual(r.motivo, '');
  assert.strictEqual(r.lineas, 2);
});

test('la tabla consolidada multi-sede no cambia lo que viaja al cotizador', () => {
  // `sinRefs:true` marca la tabla que suma varias sedes: no es el BOM de este equipo, y
  // guardarla haria que «Enviar al cotizador» mandara las filas de todas las sedes.
  const B = conBom(FILAS_200G);
  B.renderTabla([{ cat: 'Equipo', desc: 'FortiGate 600F', sku: 'FG-600F', qty: 12, unit: 30000 },
    { cat: 'Soporte', desc: 'FortiCare x12 sedes', sku: 'FC-X', qty: 12, unit: 900 }], { sinRefs: true });
  B.enviarACotizador({ modelo: 'FortiGate 200G', qty: 1, de: 'Fortinet' });
  const cola = B.recogerEntrada();
  assert.deepStrictEqual(llano(cola.filter((e) => e.ref).map((e) => e.ref.sku)),
    ['FC-10-FG2HG-809-02-DD', 'FC-10-FG2HG-247-02-DD']);
});

test('las referencias anadidas a mano siguen viajando junto al BOM calculado', () => {
  const g = cargar('public/js/bom.js');
  g.BOM.fijarVendor('fortinet');
  g.BOM.agregarRef({ sku: 'FG-TRAN-SFP', d: 'Transceptor SFP+', p: 250, v: 'fortinet', de: 'FortiGate 200G' });
  g.BOM.renderTabla(FILAS_200G, {});
  const r = g.BOM.enviarACotizador({ modelo: 'FortiGate 200G', qty: 1, de: 'Fortinet' });
  assert.strictEqual(r.lineas, 4); // equipo + 2 calculadas + 1 anadida a mano
  const skus = g.BOM.recogerEntrada().filter((e) => e.ref).map((e) => e.ref.sku);
  assert.deepStrictEqual(llano(skus), ['FC-10-FG2HG-809-02-DD', 'FC-10-FG2HG-247-02-DD', 'FG-TRAN-SFP']);
});
