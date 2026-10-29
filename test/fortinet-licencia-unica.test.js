'use strict';
/* La licencia FortiGuard única del par, como alternativa elegible en el BOM (2026-10-28, mejora
   propuesta al cerrar el PR #56).

   La guía de FortiOS 7.6.6 («Single FortiGuard license for FortiGate A-P HA cluster», traída por
   Actions a `fuente/transporte-1-2026-10-28`): «When a customer purchases two units with the HA SKU
   (such as 2 x FG-40F-HA), they can further purchase a single order of the following subscriptions:
   Enterprise Protection, UTP, ATP […] registered to the vSN. A la carte SKUs are not supported, and
   cannot be registered to the vSN.» Hasta hoy el BOM lo decía y seguía cotizando una suscripción por
   nodo. Con `disponibilidad.licenciaUnica` cotiza dos unidades del SKU de HA y UN bundle, y lo que no
   cabe lo dice: activo-activo, un modelo que la guía no nombra, una renovación, sin bundle, los
   servicios a la carta, la mejora a Elite y el SKU de HA que la lista no trae. */

const test = require('node:test');
const assert = require('node:assert');

const R = require('../public/js/fortinet-reglas.js');
const M = require('../public/js/fortinet-motor.js');
const fortinet = require('../server/seed/legacyData/fortinet.js');
const SKUS = require('../server/seed/legacyData/fortinetSkus.js');

const elpN = (m) => ((SKUS[m.id] || []).find((x) => x.sku === m.hwSku) || {}).p ?? null;
const MODELS = fortinet.MODELS.map((m) => ({ ...m, eol: !m.hwSku, elpN: elpN(m) }));
const porId = (id) => MODELS.find((m) => m.id === id);
const CARE_KEY = { fc247: 'essential', fcpre: 'premium', fcelite: 'elite' };

const comercial = (over) => R.lineasComerciales(Object.assign({
  modelo: porId('FortiGate 61F'), bundles: fortinet.BUNDLES, care: fortinet.CARE,
  bundle: 'ent', care_elegido: 'fcpre', careKey: CARE_KEY.fcpre,
  qty: 2, haModo: 'ha-ap', licenciaUnica: true, anios: 3, terminos: fortinet.TERMINOS,
  converter: false, serviciosSdwan: [], ems: fortinet.EMS_LICENCIAS, sase: fortinet.SASE_USUARIOS,
  construccion: 'bdl',
}, over || {}));
const fila = (r, cat) => r.filas.find((f) => f.cat === cat);
const codigos = (l) => l.map((x) => x.codigo);

test('61F en activo-pasivo: dos unidades del SKU de HA, un solo bundle al vSN y sin el combinado BDL', () => {
  const r = comercial();
  const eq = fila(r, 'Equipo');
  assert.strictEqual(eq.sku, 'FG-61F-HA');
  assert.strictEqual(eq.qty, 2);
  assert.strictEqual(eq.unit, 1309, 'precio del SKU de HA en la lista firmada');
  assert.ok(!eq.bdl, 'el combinado lleva el equipo normal: con la licencia única no se usa');
  const lic = fila(r, 'Licencias FortiGuard');
  assert.strictEqual(lic.qty, 1, 'una sola suscripción para el par');
  assert.match(lic.nota, /registrada a su número de serie virtual \(vSN\)/);
  assert.ok(!r.filas.some((f) => f.cat === 'Soporte'), 'el bundle trae FortiCare Premium: ninguna línea de soporte');
  assert.ok(codigos(r.avisos).includes('ha-licencia-unica-sin-bdl'));
  const unica = r.avisos.find((a) => a.codigo === 'ha-licencia-unica');
  assert.match(unica.mensaje, /dos unidades de FG-61F-HA y un solo Enterprise Protection/);
  assert.match(unica.mensaje, /set logical-sn enable/);
  assert.match(unica.mensaje, /Heartbeat de la serie: port5/);
  assert.deepStrictEqual(r.bloqueos, [], 'nada que lo deje en borrador');
  // El ahorro: una suscripción menos; el SKU de HA cuesta lo que la unidad normal.
  assert.strictEqual(r.licenciaUnica.aplicada, true);
  assert.strictEqual(r.licenciaUnica.ahorro, lic.unit);
});

test('frente a la cotización por nodo, el total baja exactamente una suscripción', () => {
  const total = (r) => r.filas.reduce((s, f) => s + (f.unit || 0) * f.qty, 0);
  const porNodo = comercial({ licenciaUnica: false });
  const unica = comercial();
  assert.ok(porNodo.filas.some((f) => f.bdl), 'por nodo, compra nueva: el combinado BDL');
  assert.strictEqual(porNodo.licenciaUnica, null, 'sin pedirla no hay nada que decir de ella');
  assert.strictEqual(Math.round((total(porNodo) - total(unica)) * 100) / 100, unica.licenciaUnica.ahorro);
  // Sin pedirla, el aviso de siempre dice dónde se pide.
  assert.match(porNodo.avisos.find((a) => a.codigo === 'ha-licencia-unica').mensaje, /marcar «Licencia única del par»/);
});

test('70F y 100F: la guía los nombra pero la lista no trae su SKU de HA: borrador, sin precio ni ahorro', () => {
  for (const id of ['FortiGate 70F', 'FortiGate 100F']) {
    const r = comercial({ modelo: porId(id) });
    const eq = fila(r, 'Equipo');
    assert.strictEqual(eq.sku, null, id);
    assert.strictEqual(eq.unit, null, `${id}: sin SKU no hay precio`);
    const b = r.bloqueos.find((x) => x.codigo === 'sin-sku-ha');
    assert.ok(b, id);
    assert.strictEqual(b.nivel, 'borrador');
    assert.strictEqual(r.licenciaUnica.ahorro, null, `${id}: sin los tres precios no se dice una cifra`);
  }
});

test('pedida donde no cabe: se dice por qué y se cotiza por nodo', () => {
  const casos = [
    [{ haModo: 'ha-aa' }, /activo-pasivo de dos unidades/],
    [{ qty: 1, haModo: 'standalone' }, /activo-pasivo de dos unidades/],
    [{ modelo: porId('FortiGate 90G') }, /no la da a FortiGate 90G/],
    [{ sinEquipo: true, construccion: 'separado' }, /renovación el par ya está comprado/],
    [{ bundle: 'none' }, /bundle excluido/],
  ];
  for (const [over, motivo] of casos) {
    const r = comercial(over);
    const a = r.avisos.find((x) => x.codigo === 'ha-licencia-unica-no-aplica');
    assert.ok(a, JSON.stringify(over));
    assert.strictEqual(a.nivel, 'warning', 'se ve en la pantalla, no es un aviso informativo');
    assert.match(a.mensaje, motivo);
    assert.strictEqual(r.licenciaUnica.aplicada, false);
    const lic = fila(r, 'Licencias FortiGuard');
    if (lic) assert.strictEqual(lic.qty, over.qty || 2, `${JSON.stringify(over)}: por nodo`);
    assert.ok(!r.filas.some((f) => /-HA$/.test(f.sku || '')), 'sin el SKU de HA');
  }
});

test('servicios a la carta con la licencia única: la guía no los deja registrar al vSN, y la cotización no sale', () => {
  const r = comercial({ sandbox: 'ai', registro: 'nube', converter: true });
  const b = r.bloqueos.find((x) => x.codigo === 'ha-licencia-unica-a-la-carta');
  assert.ok(b);
  assert.strictEqual(b.nivel, 'bloqueo');
  // Con Enterprise, FortiConverter va dentro del bundle: no es una línea a la carta.
  assert.match(b.mensaje, /\(AI-based Sandbox, registro en la nube\)/);
  assert.match(b.mensaje, /A la carte SKUs are not supported/);
  // Con UTP no lo trae, y entonces sí lo es.
  const utp = comercial({ bundle: 'utp', converter: true }).bloqueos.find((x) => x.codigo === 'ha-licencia-unica-a-la-carta');
  assert.match(utp.mensaje, /\(FortiConverter\)/);
  // Los servicios que no van al FortiGate (usuarios de FortiSASE, endpoints de EMS) no cuentan.
  const r2 = comercial({ endpointsEms: 30, emsDespliegue: 'cloud' });
  assert.ok(!codigos(r2.bloqueos).includes('ha-licencia-unica-a-la-carta'));
});

test('FortiCare Elite con la licencia única: la guía no dice si la mejora va al vSN, queda en borrador', () => {
  const r = comercial({ care_elegido: 'fcelite', careKey: CARE_KEY.fcelite });
  const b = r.bloqueos.find((x) => x.codigo === 'ha-licencia-unica-elite');
  assert.ok(b);
  assert.strictEqual(b.nivel, 'borrador');
});

test('cada modelo con la licencia única trae el precio de su SKU de HA de la lista firmada, o null sin SKU', () => {
  for (const m of fortinet.MODELS.filter((x) => x.haLicenciaUnica)) {
    const u = m.haLicenciaUnica;
    if (!u.skuHa) { assert.strictEqual(u.precioHa, null, m.id); continue; }
    const fila = (SKUS[m.id] || []).find((x) => x.sku === u.skuHa);
    assert.ok(fila, `${m.id}: ${u.skuHa} no está en la lista`);
    assert.strictEqual(u.precioHa, fila.p, m.id);
    assert.strictEqual(u.descHa, 'HA Pair HW', m.id);
  }
});

/* ── El motor: el campo, cuándo se ofrece y el BOM que sale de él ─────────────────────────── */
const CAT = {
  models: MODELS, bundles: fortinet.BUNDLES, care: fortinet.CARE, funciones: fortinet.FUNCIONES,
  serviciosSdwan: fortinet.SERVICIOS_SDWAN, terminos: fortinet.TERMINOS, fortios: fortinet.FORTIOS,
  ems: fortinet.EMS_LICENCIAS, sase: fortinet.SASE_USUARIOS, datasetVersion: 'fortinet@prueba',
};
const escenario = (disp, comercialExtra) => ({
  topologia: { rol: 'none', enlaces: [{ id: 1, tipo: 'DIA', down: 100 }] },
  escala: { usuarios: 20, sesionesPorUsuario: 20 }, seguridad: { capa: 'ngfw' },
  disponibilidad: disp, comercial: Object.assign({ motivo: 'nueva' }, comercialExtra || {}),
  seleccion: { manual: 'FortiGate 61F' },
});

test('motor: en compra nueva activo-pasivo el BOM sale con la licencia única; en otro caso el campo no viaja', () => {
  const r = M.evaluar(escenario({ modo: 'ha-ap', licenciaUnica: true }), CAT, { hoy: '2026-10-28T00:00:00Z' });
  assert.deepStrictEqual(r.errores, []);
  assert.strictEqual(r.bom.licenciaUnica.aplicada, true);
  assert.deepStrictEqual(r.bom.filas.map((f) => [f.sku, f.qty]), [['FG-61F-HA', 2], ['FC-10-0061F-809-02-36', 1]]);
  assert.strictEqual(r.campos['disponibilidad.licenciaUnica'].visible, true);
  // En activo-activo y en una renovación la casilla no se ofrece: el motor la devuelve a su valor
  // por defecto y lo declara inactivo, como cualquier campo oculto.
  for (const [disp, com] of [[{ modo: 'ha-aa', licenciaUnica: true }, {}],
    [{ modo: 'ha-ap', licenciaUnica: true }, { motivo: 'renovacion', serieInstalada: 'FGT61FTK0000001' }]]) {
    const n = M.evaluar(escenario(disp, com), CAT, { hoy: '2026-10-28T00:00:00Z' });
    assert.strictEqual(n.campos['disponibilidad.licenciaUnica'].visible, false, JSON.stringify([disp, com]));
    assert.ok(n.inactivos.includes('disponibilidad.licenciaUnica'));
    assert.strictEqual(n.snapshot.disponibilidad.licenciaUnica, false);
    if (n.bom) assert.strictEqual(n.bom.licenciaUnica, null);
  }
  // Un valor que no es booleano no entra.
  const malo = M.evaluar(escenario({ modo: 'ha-ap', licenciaUnica: 'si' }), CAT, { hoy: '2026-10-28T00:00:00Z' });
  assert.ok(malo.errores.some((e) => e.campo === 'disponibilidad.licenciaUnica'));
});
