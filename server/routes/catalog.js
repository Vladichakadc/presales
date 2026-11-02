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

// `?vendor=<code>` da solo ese fabricante, con la misma forma que sin él. Un código que no es un
// texto corto de letras se rechaza (400) y uno que no existe da 404: nunca un `{}` que la pantalla
// leería como «sin procedencia registrada».
router.get('/fuentes', async (req, res, next) => {
  try {
    const { vendor } = req.query;
    if (vendor === undefined) return res.json(await toFuentes());
    if (typeof vendor !== 'string' || !/^[a-z][a-z0-9-]{0,31}$/.test(vendor)) {
      return res.status(400).json({ error: 'fabricante no válido' });
    }
    const uno = await toFuentes(vendor);
    if (!uno[vendor]) return res.status(404).json({ error: 'fabricante desconocido' });
    res.json(uno);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
