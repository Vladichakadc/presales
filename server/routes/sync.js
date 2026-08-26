const express = require('express');
const router = express.Router();
const multer = require('multer');
const { analyzeCatalog } = require('../services/aiSync');
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

// La sincronización con IA corre solo en local, a propósito. Dos razones independientes,
// y cualquiera de las dos bastaría:
//
// 1. No serviría de nada. Estas rutas escriben en la base de datos, y la de producción es
//    efímera: se reconstruye desde server/seed/legacyData/ en cada despliegue. Un cambio
//    aplicado en producción se perdería en el siguiente deploy, dando una falsa sensación
//    de haberse guardado. El camino real es analizar en local, llevar las propuestas
//    aprobadas a los archivos de seed y desplegar — con lo que además cada cambio de
//    catálogo queda revisado en un diff de git, que es lo que permitió detectar un modelo
//    inexistente que llevaba tiempo en el catálogo.
//
// 2. Sería peligroso. Sin ANTHROPIC_API_KEY, aiSync.js cae en su modo mock y devuelve
//    propuestas inventadas con apariencia legítima — incluido un producto que no existe,
//    con precio y specs verosímiles. Aplicarlas corrompería el catálogo con datos falsos.
function bloqueadoEnProduccion(res) {
  if (process.env.NODE_ENV !== 'production') return false;
  res.status(503).json({
    error: 'La sincronización con IA está deshabilitada en producción. Ejecútala en local, '
      + 'lleva los cambios aprobados a los archivos de server/seed/legacyData/ y despliega: '
      + 'el catálogo de producción se resiembra desde ahí en cada despliegue.',
  });
  return true;
}

router.post('/sync/analyze', upload.single('datasheet'), async (req, res) => {
  if (bloqueadoEnProduccion(res)) return;
  const { vendor } = req.body;
  if (!vendor) return res.status(400).json({ error: 'Vendor requerido' });

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
