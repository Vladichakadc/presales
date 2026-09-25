'use strict';
// POST /api/sizing/starlink — recalculo autoritativo del dimensionador Starlink LEO.
//
// El navegador ya calcula en vivo con el mismo motor (js/dimensionador-starlink-leo.js); esta
// ruta existe para la paridad frontend/backend que pide el prompt maestro de integracion
// (seccion 4.3): un cliente que enviara `required`/`plan`/`bom` ya calculados no puede usarlos
// para inflar una cotizacion, porque el servidor los ignora y recalcula desde `inputs` con su
// propio saneo (`sanearEstado`, en services/starlinkSizing.js).
const express = require('express');
const { calcular } = require('../services/starlinkSizing');

const router = express.Router();

router.post('/sizing/starlink', (req, res) => {
  const { state, result } = calcular(req.body);
  res.json({ state, result });
});

module.exports = router;
