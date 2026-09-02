const express = require('express');
const {
  toDimensionadorHuawei,
  toDimensionadorCisco,
  toDimensionadorFortinet,
  toDimensionadorJuniper,
  toDimensionadorMikrotik,
  toDimensionadorAruba,
  toDimensionadorNokia,
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
