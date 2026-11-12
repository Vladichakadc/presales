const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
  analizarDocumento, SinClave, ClaveInvalida, LimiteIA, SinSaldo, RechazoIA, RespuestaCortada,
} = require('../services/aiSync');
const { tipoPorFirma } = require('../services/firmaArchivo');
const catalogoEnMemoria = require('../services/catalogoEnMemoria');

// Configure multer for memory storage
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB limit

async function resolveVendorId(vendorCode) {
  const { Vendor } = await catalogoEnMemoria.listo();
  const vendor = await Vendor.findOne({ where: { code: vendorCode.toLowerCase() } });
  return vendor ? vendor.id : null;
}

// ANALIZAR corre en cualquier entorno; APLICAR ya no escribe en ninguna parte.
//
// - `analyze` LEE el catálogo y llama a la IA. Es seguro y útil también en producción: el catálogo
//   se siembra desde server/seed/legacyData/ en cada arranque, así que analizarlo es analizar
//   exactamente lo vigente. Falla cerrado sin ANTHROPIC_API_KEY (aiSync lanza SinClave -> 503):
//   ya no existe el mock que inventaba propuestas.
//
// - `apply` escribía en la base. En producción nunca tuvo sentido (la base era efímera y el
//   cambio se perdía en el siguiente despliegue), y desde que el catálogo vive en memoria
//   (ADR-3, 2026-11-11) tampoco en local: se perdería al reiniciar. El camino durable es otro y no
//   pasa por aquí: se descarga la propuesta y `npm run propuesta` (o el workflow
//   «aplicar-propuesta», que abre el PR) la aplica sobre legacyData/ con anclaje. Cada cambio de
//   catálogo queda así en un diff revisable, que es lo que una vez cazó un modelo inexistente que
//   llevaba tiempo dentro. Ver docs/sincronizacion.md.
const NO_SE_APLICA = 'Aplicar no escribe en ninguna base: el catálogo se siembra desde '
  + 'server/seed/legacyData/ en cada arranque. Para publicar un cambio, descarga la propuesta y '
  + 'aplícala con «npm run propuesta» o con el workflow «aplicar-propuesta» de GitHub, que abre un PR.';

// La UI necesita saber si hay clave, para avisar antes de gastar una llamada. Va bajo el permiso `sync` como el resto del router.
router.get('/sync/estado', (req, res) => {
  res.json({
    produccion: process.env.NODE_ENV === 'production',
    tieneClave: !!process.env.ANTHROPIC_API_KEY,
  });
});

router.post('/sync/analyze', upload.single('datasheet'), async (req, res) => {
  const { vendor } = req.body;
  if (!vendor) return res.status(400).json({ error: 'Vendor requerido' });

  // El tipo del adjunto se decide por su firma, no por el mimetype del navegador.
  if (req.file) {
    const tipo = tipoPorFirma(req.file.buffer, req.file.originalname);
    if (!tipo) {
      return res.status(415).json({
        error: 'El archivo no es un PDF, un XLSX ni un texto CSV/TXT reconocible. Se comprueba el contenido, no la extensión.',
      });
    }
    req.file.tipo = tipo;
  }

  try {
    const vendorId = await resolveVendorId(vendor);
    if (!vendorId) return res.status(400).json({ error: 'Vendor inválido' });

    // El orden que daba SQLite por su indice unico (modelo o codigo), escrito: es el del texto que
    // recibe la IA, y con el mismo texto el catalogo cacheado se reutiliza.
    const { Product, LicenseBundle, SupportTier, Part } = await catalogoEnMemoria.listo();
    const [products, licenses, supportTiers, parts] = await Promise.all([
      Product.findAll({ where: { vendorId }, order: [['model', 'ASC']] }),
      LicenseBundle.findAll({ where: { vendorId }, order: [['code', 'ASC']] }),
      SupportTier.findAll({ where: { vendorId }, order: [['code', 'ASC']] }),
      Part.findAll({ where: { vendorId }, order: [['code', 'ASC']] }),
    ]);

    const catalogData = {
      equipment: products.map(p => ({ id: p.model, priceDisplay: p.priceDisplay, priceNumeric: p.priceNumeric, ...p.specs })),
      licenses: licenses.map(l => ({ code: l.code, name: l.name, description: l.description })),
      supportTiers: supportTiers.map(t => ({ code: t.code, name: t.name, sla: t.sla, description: t.description })),
      parts: parts.map(p => ({ code: p.code, sku: p.sku, description: p.description })),
    };

    const hasAnyData = catalogData.equipment.length || catalogData.licenses.length || catalogData.supportTiers.length || catalogData.parts.length;
    if (!hasAnyData) {
      return res.json({ changes: [], contraste: null });
    }

    // Una hoja (CSV/XLSX) se contrasta primero sin IA y al modelo solo llega lo que ese
    // contraste no reconoce; un PDF o un texto van al modelo enteros (ver analizarDocumento).
    const { changes, contraste } = await analizarDocumento(vendor, catalogData, req.file);
    res.json({ changes, contraste });
  } catch (err) {
    // Errores propios de aiSync, cada uno con su HTTP: config (503) frente a transitorio (429)
    // frente a lo desconocido (500). Antes todo lo que no fuera SinClave caía en el 500
    // genérico, y un 401 por clave inválida se leía como «Error analizando con IA» — sin pista
    // de que el problema era la clave. instanceof funciona aquí: misma instancia del módulo.
    if (err instanceof SinClave || err instanceof ClaveInvalida || err instanceof SinSaldo) {
      return res.status(503).json({ error: err.message });
    }
    if (err instanceof LimiteIA) return res.status(429).json({ error: err.message });
    if (err instanceof RechazoIA) return res.status(422).json({ error: err.message });
    if (err instanceof RespuestaCortada) return res.status(502).json({ error: err.message });
    console.error('[Sync Route Error]', err);
    res.status(500).json({ error: 'Error analizando con IA' });
  }
});

// Se conserva la ruta para que un cliente viejo reciba el motivo y no un 404.
router.post('/sync/apply', (req, res) => {
  res.status(503).json({ error: NO_SE_APLICA });
});

module.exports = router;
