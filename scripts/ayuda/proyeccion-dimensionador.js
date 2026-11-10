'use strict';
/* LO QUE RECIBE UN DIMENSIONADOR, sin arrancar el servidor (2026-11-10, fase 2 de la auditoria de los
 * dimensionadores). Los casos de scripts/equivalencias/ que miden un corte sobre el catalogo real lo
 * lanzan con execFileSync y leen la salida estandar: la proyeccion del fabricante pedido, la misma
 * funcion que sirve GET /api/dimensionador/<fabricante>, sobre una base sembrada con la misma
 * seedCatalog() del arranque.
 *
 * Como pantallas-servidas.js, la base va EN MEMORIA a proposito (un DATABASE_PATH heredado apuntaria
 * a la base de alguien) y la siembra escribe sus avisos por el canal de errores, para que la salida
 * estandar sea solo el JSON.
 *   node scripts/ayuda/proyeccion-dimensionador.js juniper
 */
process.env.DATABASE_PATH = ':memory:';
console.log = (...a) => console.error(...a);

const FUNCION = {
  huawei: 'toDimensionadorHuawei', cisco: 'toDimensionadorCisco', fortinet: 'toDimensionadorFortinet',
  juniper: 'toDimensionadorJuniper', mikrotik: 'toDimensionadorMikrotik', aruba: 'toDimensionadorAruba',
  nokia: 'toDimensionadorNokia', 'nokia-sr': 'toDimensionadorNokiaRouter',
};

const fabricante = process.argv[2];
if (!FUNCION[fabricante]) {
  console.error(`Uso: node scripts/ayuda/proyeccion-dimensionador.js <${Object.keys(FUNCION).join('|')}>`);
  process.exit(2);
}

const { sequelize } = require('../../server/models');
const seedCatalog = require('../../server/seed/seedCatalog');
const proyeccion = require('../../server/services/catalogProjection');

(async () => {
  await sequelize.sync();
  await seedCatalog();
  process.stdout.write(JSON.stringify(await proyeccion[FUNCION[fabricante]]()));
  await sequelize.close();
})().catch((e) => {
  console.error(e && e.stack ? e.stack : String(e));
  process.exit(1);
});
