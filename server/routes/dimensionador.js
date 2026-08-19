const express = require('express');
const {
  toDimensionadorHuawei,
  toDimensionadorCisco,
  toDimensionadorFortinet,
  toDimensionadorMikrotik,
} = require('../services/catalogProjection');

const router = express.Router();

const projections = {
  huawei: toDimensionadorHuawei,
  cisco: toDimensionadorCisco,
  fortinet: toDimensionadorFortinet,
  mikrotik: toDimensionadorMikrotik,
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
