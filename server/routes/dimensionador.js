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
  toDimensionadorStarlink,
  respaldoCicloVida,
} = require('../services/catalogProjection');

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
  starlink: toDimensionadorStarlink,
};

// El fabricante real de 'nokia-sr' es 'nokia': la clave de esta tabla nombra al DIMENSIONADOR
// (Nokia tiene dos porque tiene dos preguntas), no al fabricante del catalogo de fuentes.
const FABRICANTE = { 'nokia-sr': 'nokia' };

router.get('/dimensionador/:vendor', async (req, res, next) => {
  const projection = projections[req.params.vendor];
  if (!projection) return res.status(404).json({ error: 'Vendor sin dimensionador' });
  try {
    // `cicloVida` se anade AQUI y no dentro de cada proyeccion: son ocho funciones y la regla
    // es una. Repetirla ocho veces es como `llevarABom` acabo divergiendo en seis copias.
    const datos = await projection();
    const vendor = FABRICANTE[req.params.vendor] || req.params.vendor;
    res.json({ ...datos, cicloVida: respaldoCicloVida(vendor) });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
