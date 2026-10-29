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
// Desde el 2026-10-28 lleva un tercer parámetro, si el BOM cotiza la licencia única, que por defecto
// sale de `unicaCotizada(m)` (el BOM validado, `RES`): se ejecutan las dos, con `RES` vacío.
function licenciaHa(res = null) {
  const fn = /function licenciaHa\(m, modo, cotizada = unicaCotizada\(m\)\) \{[\s\S]*?\n\}\n/.exec(JS);
  const uc = /function unicaCotizada\(m\) \{[\s\S]*?\n\}\n/.exec(JS);
  assert.ok(fn && uc, 'la página ya no tiene licenciaHa o unicaCotizada');
  const ctx = { RES: res };
  vm.runInNewContext(`${uc[0]}${fn[0]}this.f = licenciaHa;`, ctx);
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
});

test('con la licencia única cotizada en el BOM, la página dice una sola suscripción para el par', () => {
  const m = modelo('FortiGate 61F');
  const res = { seleccion: { id: m.id, modelo: m }, bom: { filas: [{ cat: 'Equipo', sku: 'FG-61F-HA', haUnica: true }] } };
  const t = licenciaHa(res)(m, 'ha-ap');
  assert.strictEqual(t.unica, true);
  assert.match(t.texto, /una sola suscripción para el par: FG-61F-HA × 2/);
  assert.doesNotMatch(t.texto, /cotiza una suscripción por nodo/);
  // Otro candidato de la ficha: el BOM es del validado, así que para él sigue la regla general.
  const otro = licenciaHa(res)(modelo('FortiGate 81F'), 'ha-ap');
  assert.match(otro.texto, /este BOM cotiza una suscripción por nodo/);
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
  assert.strictEqual(u.precioHa, 1309, 'el precio del SKU de HA, de la lista firmada, también llega');
});
