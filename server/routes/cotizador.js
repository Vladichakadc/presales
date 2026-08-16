const express = require('express');
const { toCotizadorCatalog } = require('../services/catalogProjection');

const router = express.Router();

router.get('/cotizador/catalog', async (req, res, next) => {
  try {
    res.json(await toCotizadorCatalog());
  } catch (err) {
    next(err);
  }
});

module.exports = router;
