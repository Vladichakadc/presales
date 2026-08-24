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
const mikrotikData = require('./legacyData/mikrotik');
const arubaData = require('./legacyData/aruba');
const guiaRoles = require('./legacyData/guiaRoles');

const CISCO_EOL_MODELS = new Set(['ISR 4221', 'ISR 4331', 'ISR 4351', 'ISR 4431', 'ISR 4451', 'ISR 4461']);
// Confirmado contra "2026Q3 Main Price list_AMER_FINAL_EFF 080326.xlsx": FortiGate 200F tiene "End of Order Announcement"
// explícito (será removido del pricelist 2026 Q3); 100F/600F ya no aparecen en la lista de precios vigente (EOL en un trimestre anterior).
// FortiGate 70F: sin SKU de hardware nuevo en el price list (solo renovación de servicios UTP/ATP a 1 año) — reemplazado
// por FortiGate 71F (mismo NP7/SoC + 128GB SSD onboard), que sí tiene SKU de hardware y bundles completos vigentes.
const FORTINET_EOL_MODELS = new Set(['FortiGate 100F', 'FortiGate 200F', 'FortiGate 600F', 'FortiGate 70F']);

// PR group -> {vendorCode, category}. hw_ar/hw_wan both belong to vendor 'huawei'.
const PR_GROUPS = {
  hw_ar: { vendorCode: 'huawei', category: 'router_branch' },
  hw_wan: { vendorCode: 'huawei', category: 'router_wan' },
  cisco: { vendorCode: 'cisco', category: 'router' },
  nokia: { vendorCode: 'nokia', category: 'router' },
  fortinet: { vendorCode: 'fortinet', category: 'firewall' },
  juniper: { vendorCode: 'juniper', category: 'router' },
  arista: { vendorCode: 'arista', category: 'switch' },
  mikrotik: { vendorCode: 'mikrotik', category: 'router' },
  aruba: { vendorCode: 'aruba', category: 'sdwan' },
};

const NAME_PREFIXES = ['NetEngine ', 'Nokia ', 'Juniper ', 'Arista ', 'Catalyst ', 'FortiGate ', 'MikroTik ', 'Aruba '];

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
        priceNumeric: o.price != null ? o.price : null,
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
      // La categoria tambien se corrige: backfillPricesFromCotizador crea las filas que solo
      // existen en cotizadorCatalog con category 'router' fijo, y corre antes que esto. Sin
      // este update, 33 FortiGate quedaban como 'router' y el dimensionador —que filtra por
      // category 'firewall'— los descartaba en silencio.
      await product.update({
        specs: mergedSpecs,
        category: categoryFn(item),
        eol: product.eol || eolModels.has(model),
      });
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
    eolModels: FORTINET_EOL_MODELS,
    categoryFn: () => 'firewall',
  });
  await seedSupportTiers(vendorIds.fortinet, fortinetData.CARE);
  await seedLicenseBundles(vendorIds.fortinet, fortinetData.BUNDLES, false);

  // ── MikroTik ──────────────────────────────────────────────────────────────
  // mikrotik.js manda sobre indexPR.mikrotik: aporta RAM, núcleos, nivel de licencia y
  // PoE, que es lo que realmente dimensiona en RouterOS. seedDimensionadorModels fusiona
  // por nombre exacto de modelo sobre las filas que ya creó seedIndexPR.
  const mt = await seedOpticsAndParts(vendorIds.mikrotik, mikrotikData.OPTICS, null, false);
  await seedDimensionadorModels(
    vendorIds.mikrotik,
    // elp/elpN van a las columnas de precio del Product, no al blob specs.
    mikrotikData.MODELS.map(({ elp, elpN, ...m }) => m),
    { opticCategoryIds: mt.opticCategoryIds, categoryFn: () => 'router' },
  );
  for (const m of mikrotikData.MODELS) {
    const product = await Product.findOne({ where: { vendorId: vendorIds.mikrotik, model: m.id } });
    if (product) await product.update({ priceDisplay: m.elp, priceNumeric: m.elpN });
  }

  // APs gestionables por CAPsMAN — Products de categoria 'ap' para que el dimensionador
  // pueda cotizarlos sin confundirlos con los routers que sí se dimensionan por throughput.
  for (const ap of mikrotikData.ACCESS_POINTS) {
    await Product.findOrCreate({
      where: { vendorId: vendorIds.mikrotik, model: ap.sku },
      defaults: {
        vendorId: vendorIds.mikrotik, model: ap.sku, category: 'ap',
        specs: { hwModel: ap.model, poeDraw: ap.poeDraw },
        specSummary: ap.d, priceDisplay: '~ $' + ap.price, priceNumeric: ap.price,
      },
    });
  }

  await seedSupportTiers(vendorIds.mikrotik, mikrotikData.SUPPORT);

  // ── HPE Aruba Networking ──────────────────────────────────────────────────
  // aruba.js manda sobre indexPR.aruba: aporta las capas de throughput (ipsec/fw/boost),
  // los flujos y —lo que de verdad decide un hub— el número de túneles del fabric.
  // La categoría separa las dos familias porque no se dimensionan igual: 'sdwan' son los
  // EdgeConnect (admiten Boost) y 'gateway' los 9000 de SD-Branch (no lo admiten).
  await seedDimensionadorModels(vendorIds.aruba, arubaData.MODELS, {
    categoryFn: (item) => (item.fam === 'gw' ? 'gateway' : 'sdwan'),
  });
  await seedSupportTiers(vendorIds.aruba, arubaData.CARE);
  await seedLicenseBundles(vendorIds.aruba, arubaData.BUNDLES, false);

  // Sin price list verificado no hay precio: se fuerza priceNumeric a null para que el BOM
  // declare la línea "sin cotizar" en vez de sumar el 0 que dejó el cotizador (elpN:0).
  // Ver la cabecera de server/seed/legacyData/aruba.js.
  await Product.update(
    { priceDisplay: 'Consultar', priceNumeric: null },
    { where: { vendorId: vendorIds.aruba } },
  );

  await seedRoleRecommendations(vendorIds);

  console.log('[seed] Catalogo inicial poblado desde datos legacy.');
}

module.exports = seedCatalog;
