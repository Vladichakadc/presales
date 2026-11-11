'use strict';
/* LA LISTA DE MATERIALES DE ARUBA, SIN DOM (fase 2 de la auditoria del 2026-11-09, ADR-1, primer corte).
   `ArubaReglas.lineasBom` arma las filas que renderBom() armaba entre el pintado. Que dé lo mismo que
   el bloque de la pagina lo mide scripts/equivalencias/aruba-bom.js en cada PR; aqui van las reglas
   que la funcion promete por si misma: no toca la seleccion del modal, dice lo que hay que soltar y
   no inventa una cantidad ni una fila que no aplica. */
const test = require('node:test');
const assert = require('node:assert');
const R = require('../public/js/aruba-reglas.js');
const A = require('../server/seed/legacyData/aruba.js');

const datos = {
  LICENSES: A.LICENSES, LICENSES_HA: A.LICENSES_HA, BUNDLES: A.BUNDLES, CARE: A.CARE, CARE_SKU: A.CARE_SKU,
  CENTRAL: A.CENTRAL_TIERS, CENTRAL_SERIE: A.CENTRAL_POR_SERIE, SKU_CAT: [],
  SIZING: { bwTiers: A.BW_TIERS, boost: A.BOOST }, ACCESSORY_CATALOG: A.ARUBA_ACCESSORY_CATALOG,
  ACCESSORY_COMPAT: A.ACCESSORY_COMPAT, DTD: null, SSE: A.ARUBA_SSE,
};
const modelo = (id) => A.MODELS.find((m) => m.id === id);
const tier = (code) => A.BW_TIERS.find((t) => t.code === code);
const D0 = { qty: 1, termYrs: 3, bundle: 'foundation', care: 'fcnbd', central: '', tier: tier('bw100'), bloques: 0,
  wanLinks: [], onprem: false, users: 0, aps: 0 };
const ctx = (extra) => ({ m: modelo('EC-10106'), D: D0, capTier: null, haMarcado: false, secMode: 'none', elegidos: {},
  inyectados: [], pickSfp: {}, datos, opticaResuelta: () => ({ ops: [], sku: null }), necesidadesOptica: () => ({}), ...extra });

test('la seleccion del modal no se toca: lo incompatible se devuelve en `soltar`', () => {
  const compatible = A.ACCESSORY_COMPAT['EC-10106'].items[0];
  const elegidos = { [compatible]: 2, 'NO-EXISTE': 1 };
  const copia = JSON.parse(JSON.stringify(elegidos));
  const r = R.lineasBom(ctx({ elegidos }));
  assert.deepStrictEqual(elegidos, copia, 'lineasBom no modifica ctx.elegidos');
  assert.deepStrictEqual(r.soltar, ['NO-EXISTE']);
  const fila = r.filas.find((f) => f.sku === compatible);
  assert.ok(fila && fila.qty === 2 && fila.cat === 'Accesorios', 'el accesorio compatible entra con su cantidad');
});

test('un accesorio que el diseno ya exige se suelta del modal: no se cotiza dos veces en el pedido siguiente', () => {
  const r = R.lineasBom(ctx({ m: modelo('EC-10150'), elegidos: { S2N67A: 1 },
    inyectados: [{ sku: 'S2N67A', qty: 1, por: 'chkBoost', nota: 'kit de Boost' }] }));
  assert.deepStrictEqual(r.soltar, ['S2N67A']);
  assert.ok(r.filas.some((f) => f.sku === 'S2N67A' && f.por === 'chkBoost'));
});

// 2026-11-11 (mejora propuesta al cerrar el PR #167): la fila manual se soltaba solo para la pasada
// SIGUIENTE; en esta, las dos filas iban al BOM, y un Excel exportado entonces llevaba el kit dos veces.
test('un accesorio que el motor pone y que tambien se eligio en el modal sale UNA vez, ya en esta pasada', () => {
  const r = R.lineasBom(ctx({ m: modelo('EC-10150'), elegidos: { S2N67A: 1 },
    inyectados: [{ sku: 'S2N67A', qty: 1, por: 'chkBoost', nota: 'kit de Boost' }] }));
  const kit = r.filas.filter((f) => f.sku === 'S2N67A');
  assert.strictEqual(kit.length, 1, `el kit sale ${kit.length} veces`);
  assert.strictEqual(kit[0].por, 'chkBoost', 'manda la fila del motor, con su porqué');
});

test('lo mismo con la optica de un enlace que el builder ya resolvio', () => {
  const optica = A.ACCESSORY_COMPAT['EC-10106'].items.find((s) => /SFP/i.test((A.ARUBA_ACCESSORY_CATALOG[s] || {}).name || ''));
  assert.ok(optica, 'el EC-10106 admite alguna optica del catalogo');
  const r = R.lineasBom(ctx({ elegidos: { [optica]: 3 },
    necesidadesOptica: () => ({ 'SFP 10G': 1 }), opticaResuelta: () => ({ ops: [optica], sku: optica }) }));
  const filas = r.filas.filter((f) => f.sku === optica);
  assert.strictEqual(filas.length, 1, `la optica sale ${filas.length} veces`);
  assert.strictEqual(filas[0].qty, 1, 'con la cantidad del builder (un enlace), no la del modal');
  assert.deepStrictEqual(r.soltar, [optica]);
});

test('un accesorio del modal que el motor no pone sigue entrando, detras del equipo', () => {
  const compatible = A.ACCESSORY_COMPAT['EC-10150'].items.find((s) => s !== 'S2N67A');
  const r = R.lineasBom(ctx({ m: modelo('EC-10150'), elegidos: { [compatible]: 2, S2N67A: 1 },
    inyectados: [{ sku: 'S2N67A', qty: 1, por: 'chkBoost', nota: 'kit de Boost' }] }));
  assert.strictEqual(r.filas[0].cat, 'Equipo');
  assert.deepStrictEqual({ sku: r.filas[1].sku, qty: r.filas[1].qty }, { sku: compatible, qty: 2 }, 'el manual va justo detras del equipo, como antes');
  assert.deepStrictEqual(r.soltar, ['S2N67A']);
});

test('par HA de EdgeConnect: suscripcion del nodo primario y la del segundo nodo, por la casilla', () => {
  const r = R.lineasBom(ctx({ D: { ...D0, qty: 2 }, haMarcado: true }));
  const subs = r.filas.filter((f) => f.cat === 'Suscripción SD-WAN');
  assert.strictEqual(subs.length, 2);
  assert.strictEqual(subs[1].por, 'chkHa');
  assert.ok(r.licHa, 'devuelve la suscripcion del segundo nodo, que citan las notas');
  const sinCasilla = R.lineasBom(ctx({ D: { ...D0, qty: 2 }, haMarcado: false }));
  assert.strictEqual(sinCasilla.licHa, null);
  assert.strictEqual(sinCasilla.filas.filter((f) => f.cat === 'Suscripción SD-WAN').length, 1);
});

test('SSE sin usuarios declarados no inventa la cantidad de licencias', () => {
  const r = R.lineasBom(ctx({ secMode: 'sse', D: { ...D0, users: 0 } }));
  const sse = r.filas.find((f) => f.cat === 'Seguridad SASE');
  assert.ok(sse, 'la linea SSE entra declarada');
  assert.strictEqual(sse.qty, null);
  assert.match(sse.desc, /PENDIENTE/);
  const con = R.lineasBom(ctx({ secMode: 'sse', D: { ...D0, users: '40' } })).filas.find((f) => f.cat === 'Seguridad SASE');
  assert.strictEqual(con.qty, 40);
});

test('EC-V es virtual: sin fila de soporte de hardware aunque haya nivel CARE', () => {
  const r = R.lineasBom(ctx({ m: modelo('EC-V') }));
  assert.ok(!r.filas.some((f) => f.cat === 'Soporte'));
  assert.ok(R.lineasBom(ctx()).filas.some((f) => f.cat === 'Soporte'), 'un EC fisico si la lleva');
});

test('Dynamic Threat Defense: la escalera de la lista con suscripcion; 7 anos se modela a 5; sin escalera, consultar', () => {
  const conDtd = { ...datos, DTD: A.DTD_LICENSES };
  const r = R.lineasBom(ctx({ secMode: 'dtd', datos: conDtd }));
  const dtd = r.filas.find((f) => f.cat === 'Seguridad');
  assert.strictEqual(dtd.sku, A.DTD_LICENSES.saas.sku.y3);
  assert.strictEqual(dtd.unit, A.DTD_LICENSES.saas.y3);
  const a7 = R.lineasBom(ctx({ secMode: 'dtd', datos: conDtd, D: { ...D0, termYrs: 7 } })).filas.find((f) => f.cat === 'Seguridad');
  assert.strictEqual(a7.sku, A.DTD_LICENSES.saas.sku.y5, 'el termino de 7 anos cae al de 5');
  assert.match(a7.nota, /se modela a 5/);
  const sinEscalera = R.lineasBom(ctx({ secMode: 'dtd' })).filas.find((f) => f.cat === 'Seguridad');
  assert.strictEqual(sinEscalera.sku, null);
  assert.match(sinEscalera.nota, /consultar/);
  const sinSuscripcion = R.lineasBom(ctx({ secMode: 'dtd', datos: conDtd, D: { ...D0, bundle: '' } }));
  assert.ok(!sinSuscripcion.filas.some((f) => f.cat === 'Seguridad'), 'sin suscripcion, DTD no se cotiza');
});
