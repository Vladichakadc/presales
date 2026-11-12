const express = require('express');
const {
  toDimensionadorHuawei,
  toDimensionadorCisco,
  toDimensionadorFortinet,
  toDimensionadorJuniper,
  toDimensionadorMikrotik,
  toDimensionadorAruba,
  toDimensionadorNokia,
  toDimensionadorNokiaRouter,
  respaldoCicloVida,
  versionDeCatalogo,
} = require('../services/catalogProjection');

const { cuerpo } = require('../services/cacheRespuestas');

const router = express.Router();

const projections = {
  huawei: toDimensionadorHuawei,
  cisco: toDimensionadorCisco,
  fortinet: toDimensionadorFortinet,
  juniper: toDimensionadorJuniper,
  mikrotik: toDimensionadorMikrotik,
  aruba: toDimensionadorAruba,
  nokia: toDimensionadorNokia,
  // Nokia tiene dos dimensionadores porque tiene dos preguntas: la 7220 IXR se disenya como
  // fabric (cuantos leafs y spines) y estos catorce se eligen de uno en uno por capacidad.
  'nokia-sr': toDimensionadorNokiaRouter,
};

// El fabricante real de 'nokia-sr' es 'nokia': la clave de esta tabla nombra al DIMENSIONADOR
// (Nokia tiene dos porque tiene dos preguntas), no al fabricante del catalogo de fuentes.
const FABRICANTE = { 'nokia-sr': 'nokia' };

// La respuesta entera (con `cicloVida` y `datasetVersion`, cuya huella SHA-256 era buena parte del
// coste) se guarda serializada por fabricante: ver cacheRespuestas.js.
async function respuesta(clave) {
  // `cicloVida` se anade AQUI y no dentro de cada proyeccion: son ocho funciones y la regla
  // es una. Repetirla ocho veces es como `llevarABom` acabo divergiendo en seis copias.
  const datos = await projections[clave]();
  const vendor = FABRICANTE[clave] || clave;
  // `datasetVersion` se anade aqui por la misma razon: una regla, no ocho copias. Se calcula
  // sobre los datos y el ciclo de vida, que es todo lo que la pagina pinta del catalogo.
  const cicloVida = respaldoCicloVida(vendor);
  return { ...datos, cicloVida, datasetVersion: versionDeCatalogo(clave, { ...datos, cicloVida }) };
}

router.get('/dimensionador/:vendor', async (req, res, next) => {
  const clave = req.params.vendor;
  // Un fabricante desconocido no toca la caché: `hasOwn`, para que «constructor» no sea una clave.
  if (!Object.prototype.hasOwnProperty.call(projections, clave)) return res.status(404).json({ error: 'Vendor sin dimensionador' });
  try {
    res.type('json').send(await cuerpo(`dimensionador:${clave}`, () => respuesta(clave)));
  } catch (err) {
    next(err);
  }
});

module.exports = router;
