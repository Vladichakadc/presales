const express = require('express');
const { toGuiaRoles } = require('../services/catalogProjection');

const router = express.Router();

router.get('/guia/roles', async (req, res, next) => {
  try {
    res.json(await toGuiaRoles());
  } catch (err) {
    next(err);
  }
});

module.exports = router;
