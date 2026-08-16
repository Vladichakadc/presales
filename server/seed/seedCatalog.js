const {
  Vendor, Product, OpticCategory, Optic, Part,
  ProductOptic, ProductPart, SupportTier, LicenseBundle, RoleRecommendation,
} = require('../models');

const vendorsData = require('./legacyData/vendors');
const indexPR = require('./legacyData/indexPR');
const cotizadorCatalog = require('./legacyData/cotizadorCatalog');
const huaweiData = require('./legacyData/huawei');
const ciscoData = require('./legacyData/cisco');
const fortinetData = require('./legacyData/fortinet');
const guiaRoles = require('./legacyData/guiaRoles');

const CISCO_EOL_MODELS = new Set(['ISR 4221', 'ISR 4331', 'ISR 4351', 'ISR 4431', 'ISR 4451', 'ISR 4461']);

// PR group -> {vendorCode, category}. hw_ar/hw_wan both belong to vendor 'huawei'.
const PR_GROUPS = {
  hw_ar: { vendorCode: 'huawei', category: 'router_branch' },
  hw_wan: { vendorCode: 'huawei', category: 'router_wan' },
  cisco: { vendorCode: 'cisco', category: 'router' },
  nokia: { vendorCode: 'nokia', category: 'router' },
  fortinet: { vendorCode: 'fortinet', category: 'firewall' },
  juniper: { vendorCode: 'juniper', category: 'router' },
  arista: { vendorCode: 'arista', category: 'switch' },
};

const NAME_PREFIXES = ['NetEngine ', 'Nokia ', 'Juniper ', 'Arista ', 'Catalyst ', 'FortiGate '];

function normalizeName(model) {
  let s = model.trim();
  for (const p of NAME_PREFIXES) {
    if (s.startsWith(p)) { s = s.slice(p.length); break; }
  }
  return s.toLowerCase();
}

function vendorCodeFromDisplayName(name) {
  return name.toLowerCase();
}

async function seedVendors() {
  const map = {};
  for (const v of vendorsData) {
    const [row] = await Vendor.findOrCreate({ where: { code: v.code }, defaults: v });
    map[v.code] = row.id;
  }
  return map;
}

// Base source of truth for index.html + cotizador.html: index.html's PR object has
// granular per-vendor numeric fields (fwd/ipsec/sdwan/cap/mpps/...) that cotizador's
// flat CATALOG doesn't carry, so PR seeds the Product rows and cotizador contributes
// pricing (elp/elpN) via best-effort name matching below.
async function seedIndexPR(vendorIds) {
  const created = [];
  for (const [group, items] of Object.entries(indexPR)) {
    const { vendorCode, category } = PR_GROUPS[group];
    const vendorId = vendorIds[vendorCode];
    for (const item of items) {
      const { model, elp, ...specs } = item;
      specs.prGroup = group;
      const [product] = await Product.findOrCreate({
        where: { vendorId, model },
        defaults: {
          vendorId, model, category, specs,
          specSummary: null,
          priceDisplay: elp || null,
        },
      });
      created.push(product);
    }
  }
  return created;
}

// Best-effort price backfill: match cotizador CATALOG rows against seeded Products
// by normalized name (strips vendor-name prefixes). Unmatched rows keep null pricing
// — a disclosed Phase 1 gap; Phase 2's real research replaces all pricing anyway.
async function backfillPricesFromCotizador(vendorIds) {
  const byVendorNormName = {};
  const allProducts = await Product.findAll();
  for (const p of allProducts) {
    const key = `${p.vendorId}::${normalizeName(p.model)}`;
    byVendorNormName[key] = p;
  }

  for (const row of cotizadorCatalog) {
    const code = vendorCodeFromDisplayName(row.vendor);
    const vendorId = vendorIds[code];
    if (!vendorId) continue;
    const key = `${vendorId}::${normalizeName(row.model)}`;
    const product = byVendorNormName[key];
    if (product) {
      await product.update({
        priceDisplay: row.elp,
        priceNumeric: row.elpN,
        specSummary: row.spec,
      });
    } else {
      // No matching Product from PR — insert the cotizador-only row so cotizador.html
      // still has full parity even where PR didn't already list this device.
      await Product.findOrCreate({
        where: { vendorId, model: row.model },
        defaults: {
          vendorId, model: row.model, category: 'router',
          specs: {}, specSummary: row.spec,
          priceDisplay: row.elp, priceNumeric: row.elpN,
        },
      });
    }
  }
}

async function seedOpticsAndParts(vendorId, OPTICS, PARTS, partsAreDescOnly) {
  const opticCategoryIds = {};
  for (const [code, list] of Object.entries(OPTICS || {})) {
    const [cat] = await OpticCategory.findOrCreate({
      where: { vendorId, code },
      defaults: { vendorId, code, label: code },
    });
    opticCategoryIds[code] = cat.id;
    for (const o of list) {
      await Optic.create({
        opticCategoryId: cat.id,
        sku: o.sku,
        bomCodes: Array.isArray(o.bom) ? o.bom : (o.bom ? [o.bom] : []),
        description: o.d,
      });
    }
  }

  const partIds = {};
  if (PARTS) {
    for (const [code, val] of Object.entries(PARTS)) {
      const sku = partsAreDescOnly ? null : val.sku;
      const description = partsAreDescOnly ? val : val.d;
      const [part] = await Part.findOrCreate({
        where: { vendorId, code },
        defaults: { vendorId, code, sku, description },
      });
      partIds[code] = part.id;
    }
  }

  return { opticCategoryIds, partIds };
}

// Huawei/Cisco/Fortinet dimensionador data carries the richest per-model specs
// (fwd/ipsec/mpps/optics/parts/...). Merges into an existing PR-seeded Product row
// when the model string matches exactly (works for most Cisco/Fortinet and many
// Huawei AR-series models), or creates a new row when it doesn't — a real naming
// drift between the two legacy files (e.g. Huawei WAN-series id sets differ),
// disclosed and left for Phase 2's research pass to fully reconcile.
async function seedDimensionadorModels(vendorId, models, { opticCategoryIds = {}, partIds = {}, eolModels = new Set(), categoryFn }) {
  for (const item of models) {
    const { id: model, optics, parts, ...specs } = item;
    const [product, created] = await Product.findOrCreate({
      where: { vendorId, model },
      defaults: {
        vendorId,
        model,
        category: categoryFn(item),
        specs,
        specSummary: null,
        eol: eolModels.has(model),
      },
    });
    if (!created) {
      const mergedSpecs = { ...(product.specs || {}), ...specs };
      await product.update({ specs: mergedSpecs, eol: product.eol || eolModels.has(model) });
    }

    for (const code of optics || []) {
      const opticCategoryId = opticCategoryIds[code];
      if (!opticCategoryId) continue;
      await ProductOptic.findOrCreate({ where: { productId: product.id, opticCategoryId } });
    }
    for (const code of parts || []) {
      const partId = partIds[code];
      if (!partId) continue;
      await ProductPart.findOrCreate({ where: { productId: product.id, partId } });
    }
  }
}

async function seedSupportTiers(vendorId, tiers) {
  for (const [code, t] of Object.entries(tiers)) {
    await SupportTier.findOrCreate({
      where: { vendorId, code },
      defaults: { vendorId, code, name: t.n, sla: t.sla, description: t.d || null },
    });
  }
}

async function seedLicenseBundles(vendorId, bundles, descOnly) {
  for (const [code, b] of Object.entries(bundles)) {
    const name = descOnly ? code.toUpperCase() : b.n;
    const description = descOnly ? b : (b.svcs || b.d || null);
    await LicenseBundle.findOrCreate({
      where: { vendorId, code },
      defaults: { vendorId, code, name, description },
    });
  }
}

async function seedRoleRecommendations(vendorIds) {
  for (const [role, entries] of Object.entries(guiaRoles)) {
    for (const entry of entries) {
      const code = vendorCodeFromDisplayName(entry.v);
      const vendorId = vendorIds[code];
      if (!vendorId) continue;
      const [product] = await Product.findOrCreate({
        where: { vendorId, model: entry.model },
        defaults: {
          vendorId,
          model: entry.model,
          category: 'other',
          specs: {},
          specSummary: entry.spec,
          priceDisplay: entry.elp,
        },
      });
      await RoleRecommendation.findOrCreate({
        where: { role, productId: product.id },
        defaults: { role, productId: product.id, altText: entry.alt, note: null },
      });
    }
  }
}

async function seedCatalog() {
  const existingVendors = await Vendor.count();
  if (existingVendors > 0) return;

  const vendorIds = await seedVendors();

  await seedIndexPR(vendorIds);
  await backfillPricesFromCotizador(vendorIds);

  const hw = await seedOpticsAndParts(vendorIds.huawei, huaweiData.OPTICS, huaweiData.PARTS, false);
  await seedDimensionadorModels(vendorIds.huawei, huaweiData.MODELS, {
    opticCategoryIds: hw.opticCategoryIds,
    partIds: hw.partIds,
    categoryFn: (item) => (item.cls === 'AR' ? 'router_branch' : 'router_wan'),
  });
  await seedSupportTiers(vendorIds.huawei, huaweiData.HICARE);

  const cs = await seedOpticsAndParts(vendorIds.cisco, ciscoData.OPTICS, ciscoData.PARTS_DESC, true);
  await seedDimensionadorModels(vendorIds.cisco, ciscoData.MODELS, {
    opticCategoryIds: cs.opticCategoryIds,
    partIds: cs.partIds,
    eolModels: CISCO_EOL_MODELS,
    categoryFn: (item) => (item.ser === 'ASR 1000' ? 'router_wan' : 'router_branch'),
  });
  await seedSupportTiers(vendorIds.cisco, ciscoData.SMARTNET);
  await seedLicenseBundles(vendorIds.cisco, ciscoData.DNA_DESC, true);

  await seedDimensionadorModels(vendorIds.fortinet, fortinetData.MODELS, {
    categoryFn: () => 'firewall',
  });
  await seedSupportTiers(vendorIds.fortinet, fortinetData.CARE);
  await seedLicenseBundles(vendorIds.fortinet, fortinetData.BUNDLES, false);

  await seedRoleRecommendations(vendorIds);

  console.log('[seed] Catalogo inicial poblado desde datos legacy.');
}

module.exports = seedCatalog;
