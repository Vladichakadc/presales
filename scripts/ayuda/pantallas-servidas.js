'use strict';
/* LO QUE RECIBEN LAS PANTALLAS, sin arrancar el servidor (2026-10-02).
 *
 * `npm run catalogo` compara el portal y la guia de diseno con el dimensionador, y eso no se
 * puede hacer leyendo `legacyData/`: lo que pinta cada pantalla sale de la siembra, que funde la
 * fila del portal con la del dimensionador del mismo equipo (ver `cifrasCotizador.js`). Medido
 * el dia que nacio: la capacidad de Nokia llegaba al portal en Gbps donde todo el portal lee
 * Mbps, y eso no estaba en ningun archivo — `indexPR.js` dice «300 Gbps» y tiene razon.
 *
 * Asi que se siembra una base EN MEMORIA con la misma `seedCatalog()` del arranque y se
 * devuelve, en JSON por la salida estandar, lo que sirven `/api/catalog` y `/api/guia/roles`,
 * mas los equipos fuera de venta segun la misma regla que aplica la proyeccion.
 *
 * EN MEMORIA Y NO EN UN ARCHIVO, a proposito: `DATABASE_PATH` se fija aqui, antes de cargar los
 * modelos, y no se lee del entorno. Un valor heredado apuntaria a la base de alguien, y sembrar
 * o leer esa no es lo que se pidio.
 */
process.env.DATABASE_PATH = ':memory:';

// La siembra escribe en la consola («[seed] ...»): va al canal de errores para que la salida
// estandar sea solo el JSON que lee quien llama.
console.log = (...a) => console.error(...a);

const { sequelize, Product, Vendor } = require('../../server/models');
const seedCatalog = require('../../server/seed/seedCatalog');
const proyeccion = require('../../server/services/catalogProjection');
const { normalizarModelo } = require('../../server/services/cifrasCotizador');

(async () => {
  await sequelize.sync();
  await seedCatalog();
  const productos = await Product.findAll({ include: [{ model: Vendor }] });
  const fueraDeVenta = productos
    .filter((p) => proyeccion.fueraDeVenta(p.eol, p.specs))
    .map((p) => ({ vendor: p.Vendor.code, clave: normalizarModelo(p.model) }));
  const salida = {
    portal: await proyeccion.toIndexPR(),
    guia: await proyeccion.toGuiaRoles(),
    fueraDeVenta,
  };
  process.stdout.write(JSON.stringify(salida));
  await sequelize.close();
})().catch((e) => {
  console.error(e && e.stack ? e.stack : String(e));
  process.exit(1);
});
