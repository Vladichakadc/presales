'use strict';
/* La licencia FortiGuard única del par activo-pasivo, cotizada en el BOM (mejora propuesta al
   cerrar el PR #56, ejecutada por encargo del dueño el 2026-10-28: «ejecuta las mejoras
   propuestas»).

   La guía de FortiOS 7.6.6 («Single FortiGuard license for FortiGate A-P HA cluster», copia en la
   rama fuente/transporte-1-2026-10-28): con dos unidades del SKU de HA («such as 2 x FG-40F-HA»)
   se pide «a single order» de Enterprise Protection, UTP o ATP, registrado al número de serie
   virtual del par (vSN); «A la carte SKUs are not supported, and cannot be registered to the vSN».
   Lo que estas pruebas fijan: se cotiza así solo cuando se pide y todo lo que la guía exige está;
   si no, el BOM sigue por nodo y dice por qué; y lo que ya estaba guardado no cambia de huella. */

const test = require('node:test');
const assert = require('node:assert');

const M = require('../public/js/fortinet-motor.js');
const F = require('../server/seed/legacyData/fortinet.js');
const SKUS = require('../server/seed/legacyData/fortinetSkus.js');

const CAT = {
  models: F.MODELS.map((m) => ({ ...m, eol: !m.hwSku,
    elpN: ((SKUS[m.id] || []).find((x) => x.sku === m.hwSku) || {}).p ?? null })),
  bundles: F.BUNDLES, care: F.CARE, funciones: F.FUNCIONES,
  serviciosSdwan: F.SERVICIOS_SDWAN, terminos: F.TERMINOS, fortios: F.FORTIOS,
  ems: F.EMS_LICENCIAS, sase: F.SASE_USUARIOS, datasetVersion: 'fortinet@prueba',
};
const ESC = (comercial, modo, manual) => ({
  sitio: { segmento: 'branch' },
  topologia: { rol: 'none', enlaces: [{ id: 1, tipo: 'DIA', down: 100, overlay: false }] },
  seguridad: { capa: 'tp', funciones: ['chkAv'] },
  escala: { usuarios: 20 },
  disponibilidad: { modo },
  comercial,
  seleccion: { manual },
});
const evaluar = (e) => M.evaluar(e, CAT, { hoy: '2026-10-28T00:00:00Z' });
const lineas = (r, cat) => r.bom.filas.filter((f) => f.cat === cat);
const aviso = (r, codigo) => r.bom.avisos.find((a) => a.codigo === codigo);

test('par 60F activo-pasivo con la licencia única: 2 × FG-60F-HA y un solo bundle, con el ahorro dicho', () => {
  const r = evaluar(ESC({ motivo: 'nueva', haLicenciaUnica: true }, 'ha-ap', 'FortiGate 60F'));
  const eq = lineas(r, 'Equipo');
  assert.strictEqual(eq.length, 1);
  assert.strictEqual(eq[0].sku, 'FG-60F-HA');
  assert.strictEqual(eq[0].qty, 2);
  const lista = SKUS['FortiGate 60F'].find((x) => x.sku === 'FG-60F-HA');
  assert.strictEqual(eq[0].unit, lista.p, 'el precio del SKU de HA sale de la lista firmada, por su SKU exacto');
  assert.ok(!eq[0].bdl, 'el SKU combinado es por unidad: con la licencia única no se usa');
  const b = lineas(r, 'Licencias FortiGuard');
  assert.strictEqual(b.length, 1);
  assert.strictEqual(b[0].qty, 1, 'una sola suscripción para el par');
  assert.match(b[0].nota, /número de serie virtual/);
  const a = aviso(r, 'ha-licencia-unica-cotizada');
  assert.ok(a && a.nivel === 'info');
  // Por nodo: 2 combinados; única: 2 SKU de HA + 1 bundle. El ahorro es un bundle (los SKU de HA
  // cuestan lo mismo que el de hardware en la lista de septiembre).
  const porNodo = evaluar(ESC({ motivo: 'nueva' }, 'ha-ap', 'FortiGate 60F'));
  const total = (x) => x.bom.filas.filter((f) => ['Equipo', 'Licencias FortiGuard'].includes(f.cat))
    .reduce((s, f) => s + f.qty * f.unit, 0);
  const ahorro = Math.round((total(porNodo) - total(r)) * 100) / 100;
  assert.strictEqual(ahorro, b[0].unit);
  assert.match(a.mensaje, new RegExp(`ahorra \\$${ahorro.toLocaleString('en-US', { maximumFractionDigits: 2 }).replace('.', '\\.')}`));
  assert.notStrictEqual(r.quoteGate, 'BLOCKED');
});

test('sin pedirla, nada cambia: mismo BOM por nodo y misma huella que antes de existir la casilla', () => {
  const sin = evaluar(ESC({ motivo: 'nueva' }, 'ha-ap', 'FortiGate 60F'));
  const conFalse = evaluar(ESC({ motivo: 'nueva', haLicenciaUnica: false }, 'ha-ap', 'FortiGate 60F'));
  assert.strictEqual(conFalse.scenarioHash, sin.scenarioHash, '`false` y «no está» son la misma huella');
  assert.ok(!('haLicenciaUnica' in sin.snapshot.comercial), 'el campo no existe si no se pidió');
  assert.strictEqual(lineas(sin, 'Equipo')[0].sku, 'FG-60F-BDL-809-36');
  assert.strictEqual(lineas(sin, 'Equipo')[0].qty, 2);
  assert.match(aviso(sin, 'ha-licencia-unica').mensaje, /marca «Licencia FortiGuard única del par»/);
});

test('si se pide y algo de lo que la guía exige falta, sigue por nodo y dice por qué', () => {
  const casos = [
    // El 100F está en la guía, pero la lista firmada no trae su SKU de HA.
    [ESC({ motivo: 'ampliacion', haLicenciaUnica: true, justificacionEol: 'parque instalado' }, 'ha-ap', 'FortiGate 100F'), /no trae el SKU de HA/],
    // Un modelo que la guía no nombra.
    [ESC({ motivo: 'nueva', haLicenciaUnica: true }, 'ha-ap', 'FortiGate 90G'), /no da licencia única en HA a FortiGate 90G/],
    // Sin bundle no hay «single order» de Enterprise, UTP o ATP.
    [ESC({ motivo: 'nueva', haLicenciaUnica: true, bundle: 'none' }, 'ha-ap', 'FortiGate 60F'), /exige un solo Enterprise Protection, UTP o ATP/],
  ];
  for (const [esc, motivo] of casos) {
    const r = evaluar(esc);
    const a = aviso(r, 'ha-unica-no-aplica');
    assert.ok(a, `${esc.seleccion.manual}: sin aviso`);
    assert.strictEqual(a.nivel, 'warning', 'se pidió y no se cotiza: no es una nota, es un reparo');
    assert.match(a.mensaje, motivo);
    assert.ok(!r.bom.filas.some((f) => f.haUnica), 'ninguna línea de HA');
    for (const f of lineas(r, 'Licencias FortiGuard')) assert.strictEqual(f.qty, 2);
  }
});

test('en activo-activo o en una renovación la casilla no aplica: queda inactiva y no cuenta', () => {
  const aa = evaluar(ESC({ motivo: 'nueva', haLicenciaUnica: true }, 'ha-aa', 'FortiGate 60F'));
  assert.ok(aa.inactivos.includes('comercial.haLicenciaUnica'));
  assert.ok(!aa.bom.filas.some((f) => f.haUnica));
  const ren = evaluar(ESC({ motivo: 'renovacion', serieInstalada: 'FGT60F-X', haLicenciaUnica: true }, 'ha-ap', 'FortiGate 60F'));
  assert.ok(ren.inactivos.includes('comercial.haLicenciaUnica'));
  assert.strictEqual(ren.campos['comercial.haLicenciaUnica'].visible, false);
  const ap = evaluar(ESC({ motivo: 'nueva' }, 'ha-ap', 'FortiGate 60F'));
  assert.strictEqual(ap.campos['comercial.haLicenciaUnica'].visible, true);
});

test('las líneas a la carta siguen por unidad y se dicen: la guía no deja registrarlas al vSN', () => {
  const r = evaluar(ESC({ motivo: 'nueva', haLicenciaUnica: true, soporte: 'fcelite', converter: true }, 'ha-ap', 'FortiGate 60F'));
  const a = aviso(r, 'ha-unica-a-la-carta');
  assert.ok(a, 'sin aviso de las líneas a la carta');
  assert.strictEqual(a.nivel, 'warning');
  assert.match(a.mensaje, /no se registran al número de serie virtual/);
  assert.match(a.mensaje, /Elite/);
  for (const f of lineas(r, 'Soporte')) assert.strictEqual(f.qty, 2, 'la mejora a Elite sigue por unidad');
});
