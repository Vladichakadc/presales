'use strict';
// POST /api/escenario/desde-documento (2026-10-27, piloto «del pliego al escenario»). El permiso
// (`herramientas`) lo pone server.js delante del router, como en /api/v1/fortinet. El texto del
// pliego llega en el cuerpo, se usa en la petición a la API y se descarta: no se guarda ni se
// escribe en el log. Ver server/services/aiEscenario.js.
const express = require('express');
const { SinClave, ClaveInvalida, SinSaldo, LimiteIA, RechazoIA, RespuestaCortada } = require('../services/aiSync');
const IA = require('../services/aiEscenario');

const router = express.Router();

router.post('/desde-documento', async (req, res) => {
  const { pagina, texto } = req.body || {};
  if (typeof pagina !== 'string' || !Object.prototype.hasOwnProperty.call(IA.PAGINAS, pagina)) {
    return res.status(400).json({ error: 'Página sin piloto de IA.' });
  }
  if (typeof texto !== 'string' || !texto.trim()) return res.status(400).json({ error: 'Pega el texto del pliego.' });
  if (texto.length > IA.MAX_TEXTO) {
    return res.status(413).json({ error: `El texto pasa de ${IA.MAX_TEXTO.toLocaleString('es')} caracteres: pega solo la parte técnica, o por partes.` });
  }
  try {
    res.json(await IA.proponerEscenario(pagina, texto));
  } catch (err) {
    // Mismo reparto que /api/sync/analyze: la falta de clave o de saldo es del servicio (503),
    // el límite es transitorio (429), un rechazo no es «el pliego no dice nada» (422) y un corte
    // es una respuesta incompleta (502).
    if (err instanceof SinClave || err instanceof ClaveInvalida || err instanceof SinSaldo) {
      return res.status(503).json({ error: err.message });
    }
    if (err instanceof LimiteIA) return res.status(429).json({ error: err.message });
    if (err instanceof RechazoIA) return res.status(422).json({ error: err.message });
    if (err instanceof RespuestaCortada) return res.status(502).json({ error: err.message });
    console.error('[IA escenario] Error:', err && err.message);
    res.status(500).json({ error: 'No se pudo analizar el pliego con IA.' });
  }
});

module.exports = router;
