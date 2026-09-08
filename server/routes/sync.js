const express = require('express');
const router = express.Router();
const multer = require('multer');
const { analyzeCatalog, SinClave } = require('../services/aiSync');
const { tipoPorFirma } = require('../services/firmaArchivo');
const { Product, Vendor, LicenseBundle, SupportTier, Part } = require('../models');

// Configure multer for memory storage
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB limit

// Categoría por defecto al crear un producto NEW sugerido por IA (no todos los vendors son firewall)
const DEFAULT_CATEGORY_BY_VENDOR = { huawei: 'router_branch', cisco: 'router', nokia: 'router', fortinet: 'firewall', juniper: 'router', mikrotik: 'router', aruba: 'sdwan' };

async function resolveVendorId(vendorCode) {
  const vendor = await Vendor.findOne({ where: { code: vendorCode.toLowerCase() } });
  return vendor ? vendor.id : null;
}

function parseJson(raw, label) {
  try {
    return typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch {
    console.warn(`[Sync Apply] Saltando "${label}": newValue no es JSON válido`);
    return null;
  }
}

// ANALIZAR corre en cualquier entorno; ESCRIBIR EN LA BASE, solo en local.
//
// Antes las dos rutas estaban bloqueadas en producción bajo un mismo motivo, pero no eran el
// mismo problema, y meterlas en el mismo saco impedía justo lo que esta herramienta tiene que
// hacer: revisar el catálogo que se está sirviendo. Ahora se separan.
//
// - `analyze` LEE el catálogo y llama a la IA. En producción es seguro y además útil: la base
//   de producción se resiembra desde server/seed/legacyData/ en cada despliegue, así que
//   analizarla es analizar exactamente lo vigente. Falla cerrado sin ANTHROPIC_API_KEY
//   (aiSync lanza SinClave -> 503): ya no existe el mock que inventaba propuestas, así que no
//   hay forma de que devuelva un dato falso por no tener clave.
//
// - `apply` ESCRIBE en la base, y esa escritura no tiene sentido en producción: la base es
//   efímera y el cambio se perdería en el siguiente deploy, dando una falsa sensación de
//   haberse guardado. El camino durable es otro y no pasa por aquí: se descarga la propuesta
//   y `.github/workflows/aplicar-propuesta.yml` la aplica sobre legacyData/ con anclaje y
//   abre un PR — el token de escritura vive en Actions, nunca en este servicio, que es el que
//   sirve los precios. Cada cambio de catálogo queda así en un diff revisable, que es lo que
//   una vez cazó un modelo inexistente que llevaba tiempo dentro. Ver docs/sincronizacion.md.
function bloqueadoEnProduccion(res) {
  if (process.env.NODE_ENV !== 'production') return false;
  res.status(503).json({
    error: 'Aplicar a la base solo tiene sentido en local (la de producción es efímera). '
      + 'Para publicar un cambio: descarga la propuesta y ejecuta el workflow '
      + '«aplicar-propuesta» en GitHub, que la aplica sobre server/seed/legacyData/ y abre un PR.',
  });
  return true;
}

// La UI necesita saber en qué entorno está y si hay clave, para no ofrecer un botón que va a
// fallar: en producción no se muestra «aplicar a base local», y sin clave se avisa antes de
// gastar una llamada. Va bajo el permiso `sync` como el resto del router.
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

    const [products, licenses, supportTiers, parts] = await Promise.all([
      Product.findAll({ where: { vendorId } }),
      LicenseBundle.findAll({ where: { vendorId } }),
      SupportTier.findAll({ where: { vendorId } }),
      Part.findAll({ where: { vendorId } }),
    ]);

    const catalogData = {
      equipment: products.map(p => ({ id: p.model, priceDisplay: p.priceDisplay, priceNumeric: p.priceNumeric, ...p.specs })),
      licenses: licenses.map(l => ({ code: l.code, name: l.name, description: l.description })),
      supportTiers: supportTiers.map(t => ({ code: t.code, name: t.name, sla: t.sla, description: t.description })),
      parts: parts.map(p => ({ code: p.code, sku: p.sku, description: p.description })),
    };

    const hasAnyData = catalogData.equipment.length || catalogData.licenses.length || catalogData.supportTiers.length || catalogData.parts.length;
    if (!hasAnyData) {
      return res.json({ changes: [] });
    }

    const changes = await analyzeCatalog(vendor, catalogData, req.file);
    res.json({ changes });
  } catch (err) {
    if (err instanceof SinClave) return res.status(503).json({ error: err.message });
    console.error('[Sync Route Error]', err);
    res.status(500).json({ error: 'Error analizando con IA' });
  }
});

// target=product: specs técnicos y precio (priceDisplay/priceNumeric) de un equipo
async function applyProductChange(change, vendorId, defaultCategory) {
  if (change.type === 'NEW') {
    const parsed = parseJson(change.newValue, change.id);
    if (!parsed) return false;
    const { priceDisplay, priceNumeric, ...specs } = parsed;
    const [product, created] = await Product.findOrCreate({
      where: { vendorId, model: change.id },
      defaults: {
        category: defaultCategory,
        specs,
        priceDisplay: priceDisplay || null,
        priceNumeric: priceNumeric ?? null,
        sourceUrl: change.sourceUrl || null,
      },
    });
    if (!created) {
      product.specs = { ...(product.specs || {}), ...specs };
      if (priceDisplay) product.priceDisplay = priceDisplay;
      if (priceNumeric != null) product.priceNumeric = priceNumeric;
      if (change.sourceUrl) product.sourceUrl = change.sourceUrl;
      product.changed('specs', true);
      await product.save();
    }
    return true;
  }

  // UPDATE
  const product = await Product.findOne({ where: { vendorId, model: change.id } });
  if (!product) return false;

  if (change.field === 'price') {
    const parsed = parseJson(change.newValue, change.id);
    if (!parsed) return false;
    if (parsed.priceDisplay != null) product.priceDisplay = parsed.priceDisplay;
    if (parsed.priceNumeric != null) product.priceNumeric = parsed.priceNumeric;
  } else {
    const specs = product.specs || {};
    specs[change.field] = change.newValue;
    product.specs = specs;
    product.changed('specs', true);
  }
  if (change.sourceUrl) product.sourceUrl = change.sourceUrl;
  await product.save();
  return true;
}

// target=license/supportTier/part: registros identificados por code (único por vendor)
async function applyCatalogRecordChange(Model, change, vendorId, buildDefaults) {
  if (change.type === 'NEW') {
    const parsed = parseJson(change.newValue, change.id);
    if (!parsed) return false;
    await Model.findOrCreate({
      where: { vendorId, code: change.id },
      defaults: { vendorId, code: change.id, ...buildDefaults(parsed) },
    });
    return true;
  }

  const record = await Model.findOne({ where: { vendorId, code: change.id } });
  if (!record) return false;
  record[change.field] = change.newValue;
  await record.save();
  return true;
}

router.post('/sync/apply', async (req, res) => {
  if (bloqueadoEnProduccion(res)) return;
  const { vendor, changes } = req.body;
  if (!changes || !Array.isArray(changes) || !vendor) {
    return res.status(400).json({ error: 'Vendor and Changes array required' });
  }

  try {
    const vendorId = await resolveVendorId(vendor);
    if (!vendorId) return res.status(400).json({ error: 'Vendor inválido' });
    const defaultCategory = DEFAULT_CATEGORY_BY_VENDOR[vendor.toLowerCase()] || 'router';

    let appliedCount = 0;
    let skippedCount = 0;
    for (const change of changes) {
      try {
        const target = change.target || 'product';
        let applied;
        if (target === 'license') {
          applied = await applyCatalogRecordChange(LicenseBundle, change, vendorId, (p) => ({ name: p.name, description: p.description ?? null }));
        } else if (target === 'supportTier') {
          applied = await applyCatalogRecordChange(SupportTier, change, vendorId, (p) => ({ name: p.name, sla: p.sla ?? null, description: p.description ?? null }));
        } else if (target === 'part') {
          applied = await applyCatalogRecordChange(Part, change, vendorId, (p) => ({ sku: p.sku ?? null, description: p.description ?? null }));
        } else {
          applied = await applyProductChange(change, vendorId, defaultCategory);
        }
        if (applied) appliedCount++; else skippedCount++;
      } catch (err) {
        console.error(`[Sync Apply] Error aplicando cambio "${change.id}":`, err.message);
        skippedCount++;
      }
    }
    res.json({ success: true, appliedCount, skippedCount });
  } catch (err) {
    console.error('[Sync Apply Error]', err);
    res.status(500).json({ error: 'Error aplicando cambios' });
  }
});

module.exports = router;
