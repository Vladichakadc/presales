'use strict';
/* La suscripción FortiGuard de un clúster, dicha en la página (F3, 2026-10-28).

   La guía de FortiOS 7.6.6 («Single FortiGuard license for FortiGate A-P HA cluster») deja
   compartir una sola suscripción FortiGuard en activo-pasivo a las series 40F, 60F, 70F, 80F y
   100F y sus variantes (`haLicenciaUnica` en legacyData/fortinet.js). El motor lo dice en el aviso
   `ha-licencia-unica`, pero es `info` y la página no enseña los avisos `info` del BOM: el día que
   entró, la página seguía diciendo «la licencia no se comparte en HA» en la ficha y «cada nodo
   lleva su propia suscripción FortiGuard» en la cantidad, el resumen y el BOM. Ahora los cuatro
   sitios salen de `licenciaHa()`, y el campo tiene que llegar al navegador por la API. */

const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { execFileSync } = require('child_process');

const fortinet = require('../server/seed/legacyData/fortinet.js');

const JS = fs.readFileSync(path.join(__dirname, '..', 'public', 'js', 'dimensionador-fortinet-fortigate.js'), 'utf8');
const modelo = (id) => fortinet.MODELS.find((m) => m.id === id);

// La función de la página, ejecutada tal cual está escrita (no una copia de su lógica).
function licenciaHa() {
  const fn = /function licenciaHa\(m, modo, bom\) \{[\s\S]*?\n\}\n/.exec(JS);
  assert.ok(fn, 'la página ya no tiene licenciaHa');
  const ctx = {};
  vm.runInNewContext(`${fn[0]}this.f = licenciaHa;`, ctx);
  return ctx.f;
}

test('activo-pasivo en una serie de la guía: el BOM sigue por nodo y se dice la licencia única con su SKU de HA', () => {
  const f = licenciaHa();
  assert.strictEqual(f(modelo('FortiGate 61F'), 'standalone'), null);
  const ap = f(modelo('FortiGate 61F'), 'ha-ap');
  assert.strictEqual(ap.unica, true);
  assert.match(ap.texto, /este BOM cotiza una suscripción por nodo/);
  assert.match(ap.texto, /serie 60F admite una sola/);
  assert.match(ap.texto, /FG-61F-HA/);
  assert.match(ap.texto, /FortiOS 7\.6\.6/);
  // El 70F está en la guía, pero la lista firmada no trae su SKU de HA: se dice, no se inventa.
  assert.match(f(modelo('FortiGate 70F'), 'ha-ap').texto, /que la lista firmada no trae para este modelo: consultar/);
  // Con la licencia única aplicada por el motor (`bom.licenciaUnica`), la página dice una sola
  // suscripción; solo cuenta para el modelo del BOM, no para otro que se mire en la ficha.
  const aplicada = f(modelo('FortiGate 61F'), 'ha-ap', { modelo: 'FortiGate 61F', licenciaUnica: true });
  assert.strictEqual(aplicada.aplicada, true);
  assert.match(aplicada.texto, /una sola suscripción para el par .*FG-61F-HA/);
  assert.strictEqual(f(modelo('FortiGate 81F'), 'ha-ap', { modelo: 'FortiGate 61F', licenciaUnica: true }).aplicada, undefined);
});

test('activo-activo, o un modelo que la guía no nombra: una suscripción por nodo, con su motivo', () => {
  const f = licenciaHa();
  const aa = f(modelo('FortiGate 61F'), 'ha-aa');
  assert.strictEqual(aa.unica, false);
  assert.match(aa.texto, /solo vale en activo-pasivo/);
  const otro = fortinet.MODELS.find((m) => !m.haLicenciaUnica);
  assert.match(f(otro, 'ha-ap').texto, /no da licencia única en HA a este modelo/);
  // Sin modelo (ninguno validado) no se rompe: dice la regla general.
  assert.match(f(null, 'ha-ap').texto, /una suscripción por nodo/);
});

test('la cantidad, el resumen, la ficha y el BOM salen de licenciaHa, y la regla vieja no vuelve', () => {
  assert.strictEqual((JS.match(/licenciaHa\(/g) || []).length, 5, 'la definición y sus cuatro usos');
  assert.doesNotMatch(JS, /la licencia no se comparte en HA/);
  assert.doesNotMatch(JS, /cada nodo lleva su propia suscripción FortiGuard/);
  assert.doesNotMatch(JS, /cada uno lleva su propia suscripción/);
});

test('haLicenciaUnica llega al navegador: la proyección de /api/dimensionador/fortinet la conserva', () => {
  // Se siembra una base en memoria con la siembra del arranque, como scripts/ayuda/pantallas-servidas.js.
  const programa = `
    process.env.DATABASE_PATH = ':memory:';
    console.log = (...a) => console.error(...a);
    const { sequelize } = require('./server/models');
    const seedCatalog = require('./server/seed/seedCatalog');
    const proyeccion = require('./server/services/catalogProjection');
    (async () => {
      await sequelize.sync();
      await seedCatalog();
      const d = await proyeccion.toDimensionadorFortinet();
      const m = d.models.find((x) => x.id === 'FortiGate 61F');
      process.stdout.write(JSON.stringify(m.haLicenciaUnica || null));
      await sequelize.close();
    })().catch((e) => { console.error(e); process.exit(1); });`;
  const salida = execFileSync(process.execPath, ['-e', programa], {
    cwd: path.join(__dirname, '..'), encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'],
  });
  const u = JSON.parse(salida);
  assert.ok(u, 'el 61F llega sin haLicenciaUnica');
  assert.strictEqual(u.serie, '60F');
  assert.strictEqual(u.skuHa, 'FG-61F-HA');
});

/* ── La licencia única, como alternativa elegible en el BOM (mejora aprobada el 2026-10-29) ──
   «When a customer purchases two units with the HA SKU (such as 2 x FG-40F-HA), they can further
   purchase a single order of the following subscriptions: Enterprise Protection, Unified Threat
   Protection (UTP), Advanced Threat Protection (ATP) […] A la carte SKUs are not supported, and
   cannot be registered to the vSN» (FortiOS 7.6.6 Administration Guide). */
const R = require('../public/js/fortinet-reglas.js');
const M = require('../public/js/fortinet-motor.js');
const SKUS = require('../server/seed/legacyData/fortinetSkus.js');

const comercial = (over) => R.lineasComerciales(Object.assign({
  modelo: modelo('FortiGate 61F'), bundles: fortinet.BUNDLES, care: fortinet.CARE, bundle: 'ent',
  care_elegido: 'fcpre', careKey: 'premium', qty: 2, haModo: 'ha-ap', licenciaUnica: true, anios: 3,
  terminos: fortinet.TERMINOS, converter: false, serviciosSdwan: [], ems: fortinet.EMS_LICENCIAS,
  sase: fortinet.SASE_USUARIOS, construccion: 'bdl',
}, over));

test('licencia única pedida y aplicable: dos SKU de HA con su precio, un solo bundle y sin SKU combinado', () => {
  const r = comercial({});
  assert.strictEqual(r.parUnico, true);
  const equipo = r.filas.find((f) => f.cat === 'Equipo');
  assert.strictEqual(equipo.sku, 'FG-61F-HA');
  assert.strictEqual(equipo.qty, 2);
  assert.strictEqual(equipo.unit, SKUS['FortiGate 61F'].find((x) => x.sku === 'FG-61F-HA').p, 'el precio es el de la lista firmada');
  assert.ok(!equipo.bdl, 'el SKU combinado llevaría un bundle por unidad: no se usa');
  const bundle = r.filas.find((f) => f.cat === 'Licencias FortiGuard');
  assert.strictEqual(bundle.qty, 1);
  assert.match(bundle.nota, /número de serie virtual \(vSN\)/);
  assert.ok(!r.filas.some((f) => f.cat === 'Soporte'), 'el FortiCare Premium va dentro del bundle');
  assert.match(r.avisos.find((a) => a.codigo === 'ha-licencia-unica').mensaje, /aplicada .*dos unidades de FG-61F-HA y un solo Enterprise Protection/);
  assert.ok(!r.avisos.some((a) => a.codigo === 'ha-licencia-unica-no'));
});

test('licencia única pedida y no aplicable: se dice por qué y el BOM sigue con una suscripción por nodo', () => {
  const casos = [
    [{ haModo: 'ha-aa' }, /solo vale en un clúster activo-pasivo de dos unidades/],
    [{ modelo: modelo('FortiGate 90G') }, /no la da a FortiGate 90G/],
    [{ modelo: modelo('FortiGate 70F') }, /la lista firmada no trae el SKU de HA de FortiGate 70F/],
    [{ bundle: 'none' }, /pide uno de los bundles Enterprise Protection, UTP o ATP/],
    [{ care_elegido: 'fcelite', careKey: 'elite' }, /la mejora a FortiCare Elite es un SKU a la carta/],
    [{ serviciosSdwan: [fortinet.SERVICIOS_SDWAN[0]] }, /el SD-WAN Service es un SKU a la carta/],
    [{ sandbox: 'ai', registro: 'nube' }, /el sandbox del FortiGate, el registro en la nube son SKU a la carta/],
    [{ bundle: 'utp', converter: true }, /el FortiConverter es un SKU a la carta/],
  ];
  for (const [over, motivo] of casos) {
    const r = comercial(over);
    assert.strictEqual(r.parUnico, false, JSON.stringify(over));
    const no = r.avisos.find((a) => a.codigo === 'ha-licencia-unica-no');
    assert.ok(no && no.nivel === 'warning', `${JSON.stringify(over)}: sin aviso visible`);
    assert.match(no.mensaje, motivo);
    assert.match(no.mensaje, /El BOM sigue con una suscripción por nodo/);
    const bundle = r.filas.find((f) => f.cat === 'Licencias FortiGuard');
    if (bundle) assert.strictEqual(bundle.qty, 2, `${JSON.stringify(over)}: el bundle sigue por nodo`);
    assert.ok(!r.filas.some((f) => f.sku && /-HA$/.test(f.sku)), `${JSON.stringify(over)}: sin SKU de HA`);
  }
  // Con Enterprise, el FortiConverter va dentro del bundle: no es una línea a la carta y no impide nada.
  assert.strictEqual(comercial({ converter: true }).parUnico, true);
});

test('el escenario lo lleva hasta el BOM, y fuera de activo-pasivo el campo no cuenta', () => {
  const CAT = {
    models: fortinet.MODELS.map((m) => ({ ...m, eol: !m.hwSku,
      elpN: ((SKUS[m.id] || []).find((x) => x.sku === m.hwSku) || {}).p ?? null })),
    bundles: fortinet.BUNDLES, care: fortinet.CARE, funciones: fortinet.FUNCIONES,
    serviciosSdwan: fortinet.SERVICIOS_SDWAN, terminos: fortinet.TERMINOS, fortios: fortinet.FORTIOS,
    ems: fortinet.EMS_LICENCIAS, sase: fortinet.SASE_USUARIOS, datasetVersion: 'fortinet@prueba',
  };
  const esc = (modo) => ({
    topologia: { rol: 'spoke', hubs: 1, enlaces: [{ id: 1, tipo: 'DIA', down: 50, overlay: true }] },
    escala: { usuarios: 20 },
    disponibilidad: { modo, licenciaUnica: true },
    seleccion: { manual: 'FortiGate 61F' },
  });
  const ap = M.evaluar(esc('ha-ap'), CAT, { hoy: '2026-10-29T00:00:00Z' });
  assert.deepStrictEqual(ap.errores || [], []);
  assert.strictEqual(ap.bom.modelo, 'FortiGate 61F');
  assert.strictEqual(ap.bom.licenciaUnica, true);
  assert.strictEqual(ap.bom.filas.find((f) => f.cat === 'Licencias FortiGuard').qty, 1);
  // En activo-activo el campo no aplica: el motor lo lleva a su valor neutro y no avisa de nada.
  const aa = M.evaluar(esc('ha-aa'), CAT, { hoy: '2026-10-29T00:00:00Z' });
  assert.strictEqual(aa.bom.licenciaUnica, false);
  assert.ok(!aa.bom.avisos.some((a) => a.codigo === 'ha-licencia-unica-no'));
});
