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
};

router.get('/dimensionador/:vendor', async (req, res, next) => {
  const projection = projections[req.params.vendor];
  if (!projection) return res.status(404).json({ error: 'Vendor sin dimensionador' });
  try {
    res.json(await projection());
  } catch (err) {
    next(err);
  }
});

module.exports = router;
