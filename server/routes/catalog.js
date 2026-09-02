const express = require('express');
const { getVendorsList, toIndexPR, toFuentes } = require('../services/catalogProjection');

const router = express.Router();

router.get('/vendors', async (req, res, next) => {
  try {
    res.json(await getVendorsList());
  } catch (err) {
    next(err);
  }
});

router.get('/catalog', async (req, res, next) => {
  try {
    res.json(await toIndexPR());
  } catch (err) {
    next(err);
  }
});

router.get('/fuentes', async (req, res, next) => {
  try {
    res.json(await toFuentes());
  } catch (err) {
    next(err);
  }
});

module.exports = router;
