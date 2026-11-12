const express = require('express');
const { toCotizadorCatalog } = require('../services/catalogProjection');

const { servir } = require('../services/cacheRespuestas');

const router = express.Router();

router.get('/cotizador/catalog', servir('cotizador', toCotizadorCatalog));

module.exports = router;
