const express = require('express');
const { toGuiaRoles } = require('../services/catalogProjection');

const { servir } = require('../services/cacheRespuestas');

const router = express.Router();

router.get('/guia/roles', servir('guia', toGuiaRoles));

module.exports = router;
