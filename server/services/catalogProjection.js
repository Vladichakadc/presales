const {
  Vendor, Product, OpticCategory, Optic, Part,
  SupportTier, LicenseBundle, RoleRecommendation,
} = require('../models');
const cotizadorCatalog = require('../seed/legacyData/cotizadorCatalog');
const mikrotikData = require('../seed/legacyData/mikrotik');
const arubaData = require('../seed/legacyData/aruba');
const nokiaData = require('../seed/legacyData/nokia');
const { fuentesDe } = require('../seed/legacyData/fuentes');
const fuentesSubidas = require('../fuentesSubidas');
const fs = require('fs');
const pathMod = require('path');

// Datasheets descargados con `npm run datasheets`. Se lee el directorio una vez por
// peticion (una syscall) en vez de un existsSync por documento, y la ausencia de la
// carpeta no es un error: la aplicacion funciona igual enlazando las URLs de HPE.
const DIR_DATASHEETS = pathMod.join(__dirname, '..', '..', 'public', 'datasheets');
function datasheetsLocales() {
  try {
    // .csv se suma junto a .pdf para las fuentes que este catálogo elaboró (no son un PDF
    // oficial de HPE que descargar): ver DATASHEETS.priceList en aruba.js.
    return new Set(fs.readdirSync(DIR_DATASHEETS).filter((f) => /\.(pdf|csv)$/i.test(f)));
  } catch {
    return new Set();
  }
}

const NAME_PREFIXES = ['NetEngine ', 'Nokia ', 'Juniper ', 'Catalyst ', 'FortiGate ', 'Aruba '];

function normalizeName(model) {
  let s = model.trim();
  for (const p of NAME_PREFIXES) {
    if (s.startsWith(p)) { s = s.slice(p.length); break; }
  }
  return s.toLowerCase();
}

// Etiquetas legibles para categorias de opticas — estaticas, iguales en todos los
// vendors que las usan (huawei/cisco), por eso viven aqui y no en la DB.
const OPTIC_LABEL = {
  ge: 'GE — SFP / eSFP',
  sfp10: '10GE — SFP+',
  sfp25: '25GE — SFP28',
  qsfp100: '100GE — QSFP28',
  qsfpdd400: '400GE — QSFP-DD',
  sfp1g: '1GE — SFP / GLC',
  sfp10g: '10GE — SFP+',
  qsfp40g: '40GE — QSFP+',
  qsfp100g: '100GE — QSFP28',
};

async function vendorIdMap() {
  const vendors = await Vendor.findAll();
  const map = {};
  for (const v of vendors) map[v.code] = v.id;
  return map;
}

function specWithoutGroup(specs) {
  const { prGroup, ...rest } = specs || {};
  return rest;
}

async function getVendorsList() {
  const vendors = await Vendor.findAll({ order: [['name', 'ASC']] });
  return vendors.map((v) => ({
    code: v.code,
    name: v.name,
    colorHex: v.colorHex,
    lastSyncedAt: v.lastSyncedAt,
    lastSyncStatus: v.lastSyncStatus,
  }));
}

// Procedencia por fabricante, para que el portal pueda decir de que documento y de que fecha
// salen las cifras que alguien esta a punto de citar en una propuesta. Sale de
// legacyData/fuentes.js, que transcribe lo que ya estaba en las cabeceras de cada catalogo.
async function toFuentes() {
  const vendors = await Vendor.findAll({ order: [['name', 'ASC']] });
  const out = {};
  for (const v of vendors) {
    // Las subidas a mano van PRIMERO (son lo más reciente que alguien aportó) y antes que la
    // procedencia transcrita del catálogo. Con el manifiesto vacío esto no añade nada, así que
    // el comportamiento por defecto no cambia.
    const cargadas = fuentesSubidas.comoProcedencia(v.code);
    out[v.code] = { nombre: v.name, colorHex: v.colorHex, fuentes: [...cargadas, ...fuentesDe(v.code)] };
  }
  return out;
}

// index.html PR shape: {hw_ar:[...], hw_wan:[...], cisco:[...], nokia:[...], fortinet:[...], juniper:[...], mikrotik:[...], aruba:[...]}
async function toIndexPR() {
  const products = await Product.findAll();
  const result = { hw_ar: [], hw_wan: [], cisco: [], nokia: [], fortinet: [], juniper: [], mikrotik: [], aruba: [] };
  for (const p of products) {
    if (p.eol) continue;
    const group = p.specs && p.specs.prGroup;
    if (!group || !(group in result)) continue;
    const entry = { model: p.model, ...specWithoutGroup(p.specs) };
    if (p.priceDisplay) entry.elp = p.priceDisplay;
    result[group].push(entry);
  }
  return result;
}

// cotizador.html CATALOG shape: flat array {vendor, color, model, seg, spec, elp, elpN}.
// Driven by the legacy cotizadorCatalog list (the authoritative "what's quotable" set)
// rather than every Product row — the Product table also holds dimensionador-only and
// guia-only entries that were never part of the cotizador catalog. Each row is matched
// to its live Product (by normalized name) so price/spec stay current after a sync.
async function toCotizadorCatalog() {
  const vendors = await Vendor.findAll();
  const vendorByCode = {};
  for (const v of vendors) vendorByCode[v.code] = v;

  const products = await Product.findAll();
  const byKey = {};
  for (const p of products) byKey[`${p.vendorId}::${normalizeName(p.model)}`] = p;

  const out = [];
  for (const row of cotizadorCatalog) {
    const vendor = vendorByCode[row.vendor.toLowerCase()];
    if (!vendor) continue;
    const product = byKey[`${vendor.id}::${normalizeName(row.model)}`];
    if (product && product.eol) continue;
    out.push({
      vendor: vendor.name,
      color: vendor.colorHex,
      model: row.model,
      seg: row.seg,
      spec: (product && product.specSummary) || row.spec,
      elp: (product && product.priceDisplay) || row.elp,
      elpN: (product && product.priceNumeric != null) ? product.priceNumeric : row.elpN,
    });
  }
  return out;
}

// bomAsString: Cisco's OPTICS.bom is a bare string (esc(o.bom) in the page's markup);
// Huawei's is always an array, even when empty (bomTag(arr) calls arr.map on it).
async function dimensionadorOptics(vendorId, { bomAsString = false } = {}) {
  const categories = await OpticCategory.findAll({ where: { vendorId }, include: [{ model: Optic }] });
  const optics = {};
  const opticLabel = {};
  for (const cat of categories) {
    optics[cat.code] = cat.Optics.map((o) => ({
      sku: o.sku,
      bom: bomAsString ? (o.bomCodes && o.bomCodes[0]) || '' : (o.bomCodes || []),
      d: o.description,
      price: o.priceNumeric, // null en Huawei/Cisco; sus paginas no lo leen
    }));
    opticLabel[cat.code] = OPTIC_LABEL[cat.code] || cat.label;
  }
  return { optics, opticLabel };
}

async function toDimensionadorHuawei() {
  const vendorIds = await vendorIdMap();
  const vendorId = vendorIds.huawei;
  const { optics, opticLabel } = await dimensionadorOptics(vendorId);

  const parts = await Part.findAll({ where: { vendorId } });
  const partsOut = {};
  for (const part of parts) partsOut[part.code] = { sku: part.sku, bom: null, d: part.description };

  const tiers = await SupportTier.findAll({ where: { vendorId } });
  const hicare = {};
  for (const t of tiers) hicare[t.code] = { n: t.name, sla: t.sla, d: t.description };

  const products = await Product.findAll({
    where: { vendorId },
    include: [{ model: OpticCategory }, { model: Part }],
  });
  const models = products
    .filter((p) => p.specs && p.specs.cls)
    .map((p) => ({
      id: p.model,
      ...p.specs,
      optics: p.OpticCategories.map((c) => c.code),
      parts: p.Parts.map((pt) => pt.code),
    }));

  return { optics, opticLabel, parts: partsOut, models, hicare };
}

async function toDimensionadorCisco() {
  const vendorIds = await vendorIdMap();
  const vendorId = vendorIds.cisco;
  const { optics, opticLabel } = await dimensionadorOptics(vendorId, { bomAsString: true });

  const parts = await Part.findAll({ where: { vendorId } });
  const partsDesc = {};
  for (const part of parts) partsDesc[part.code] = part.description;

  const tiers = await SupportTier.findAll({ where: { vendorId } });
  const smartnet = {};
  for (const t of tiers) smartnet[t.code] = { n: t.name, sla: t.sla, d: t.description };

  const bundles = await LicenseBundle.findAll({ where: { vendorId } });
  const dnaDesc = {};
  for (const b of bundles) dnaDesc[b.code] = b.description;

  const products = await Product.findAll({
    where: { vendorId },
    include: [{ model: OpticCategory }, { model: Part }],
  });
  const models = products
    .filter((p) => p.specs && p.specs.ser && p.specs.fam)
    .map((p) => ({
      id: p.model,
      ...p.specs,
      optics: p.OpticCategories.map((c) => c.code),
      parts: p.Parts.map((pt) => pt.code),
    }));

  return { optics, opticLabel, partsDesc, smartnet, dnaDesc, models };
}

async function toDimensionadorFortinet() {
  const vendorIds = await vendorIdMap();
  const vendorId = vendorIds.fortinet;

  const bundles = await LicenseBundle.findAll({ where: { vendorId } });
  const bundlesOut = {};
  for (const b of bundles) bundlesOut[b.code] = { n: b.name, svcs: b.description };

  const tiers = await SupportTier.findAll({ where: { vendorId } });
  const care = {};
  for (const t of tiers) care[t.code] = { n: t.name, sla: t.sla };

  const products = await Product.findAll({ where: { vendorId } });
  const models = products
    .filter((p) => p.specs && p.specs.seg && p.category === 'firewall')
    // elpN habilita el total del BOM: sin el precio numerico la pagina solo puede
    // mostrar la cadena "~ $4,792" y no sumar hardware + licencias + soporte.
    .map((p) => ({
      id: p.model, ...p.specs, eol: p.eol,
      elp: p.priceDisplay, elpN: p.priceNumeric,
    }));

  return { models, bundles: bundlesOut, care };
}

// MikroTik: ademas de modelos/opticas/soporte devuelve las constantes de dimensionamiento
// (FastTrack, RAM por feed BGP, topes de licencia) para que la pagina no las duplique —
// mikrotik.js es la unica fuente de verdad de la politica de sizing.
async function toDimensionadorMikrotik() {
  const vendorIds = await vendorIdMap();
  const vendorId = vendorIds.mikrotik;
  const { optics, opticLabel } = await dimensionadorOptics(vendorId);

  const tiers = await SupportTier.findAll({ where: { vendorId } });
  const support = {};
  for (const t of tiers) support[t.code] = { n: t.name, sla: t.sla, d: t.description };

  const products = await Product.findAll({
    where: { vendorId },
    include: [{ model: OpticCategory }],
  });
  const models = products
    .filter((p) => p.category === 'router' && p.specs && p.specs.ram !== undefined)
    .map((p) => ({
      id: p.model,
      ...specWithoutGroup(p.specs),
      optics: p.OpticCategories.map((c) => c.code),
      eol: p.eol,
      elp: p.priceDisplay,
      elpN: p.priceNumeric,
    }));

  const accessPoints = products
    .filter((p) => p.category === 'ap')
    .map((p) => ({
      sku: p.model,
      hwModel: p.specs && p.specs.hwModel,
      poeDraw: p.specs && p.specs.poeDraw,
      d: p.specSummary,
      price: p.priceNumeric,
    }));

  return {
    models,
    optics,
    opticLabel,
    accessPoints,
    support,
    sizing: {
      fasttrack: mikrotikData.FASTTRACK_FACTOR,
      licenseLevels: mikrotikData.LICENSE_LEVELS,
      bgpRam: mikrotikData.BGP_RAM,
    },
  };
}

// Juniper: modelos SRX (firewall, por capa de inspeccion) y SSR (SD-WAN, una sola cifra)
// separados a proposito. Mezclarlos en una lista invitaria a comparar por Mbps dos productos
// que resuelven cosas distintas — el mismo error que se corrigio en el dimensionador de
// Cisco con el selector de plataforma.
async function toDimensionadorJuniper() {
  const vendorIds = await vendorIdMap();
  const vendorId = vendorIds.juniper;

  const bundles = await LicenseBundle.findAll({ where: { vendorId } });
  const bundlesOut = {};
  for (const b of bundles) bundlesOut[b.code] = { n: b.name, svcs: b.description };

  const tiers = await SupportTier.findAll({ where: { vendorId } });
  const care = {};
  for (const t of tiers) care[t.code] = { n: t.name, sla: t.sla };

  const products = await Product.findAll({ where: { vendorId } });
  const deSpecs = (p) => ({
    id: p.model, ...p.specs, eol: p.eol, elp: p.priceDisplay, elpN: p.priceNumeric,
  });
  // `fwImix` distingue una fila del catalogo del dimensionador de una fila que solo viene
  // del listado del portal: sin ese campo el modelo no se puede dimensionar.
  const models = products
    .filter((p) => p.category === 'firewall' && p.specs && p.specs.fw != null)
    .map(deSpecs);
  const sdwan = products
    .filter((p) => p.category === 'sdwan' && p.specs && p.specs.cap != null)
    .map(deSpecs);

  return { models, sdwan, bundles: bundlesOut, care };
}

// Aruba: misma forma que Fortinet (modelos + bundles + soporte) mas lo que en EdgeConnect
// no depende del modelo sino del sitio — los tiers de ancho de banda de la suscripcion, el
// pool de Boost y el overhead de Path Conditioning. Van en `sizing` para que aruba.js siga
// siendo la unica fuente de la politica de dimensionamiento, igual que en MikroTik.
async function toDimensionadorAruba() {
  const vendorIds = await vendorIdMap();
  const vendorId = vendorIds.aruba;

  const bundles = await LicenseBundle.findAll({ where: { vendorId } });
  const bundlesOut = {};
  for (const b of bundles) bundlesOut[b.code] = { n: b.name, svcs: b.description };

  const tiers = await SupportTier.findAll({ where: { vendorId } });
  const care = {};
  for (const t of tiers) care[t.code] = { n: t.name, sla: t.sla, d: t.description };

  const locales = datasheetsLocales();
  const rutaLocal = (file) => (file && locales.has(file) ? `/datasheets/${file}` : null);

  const products = await Product.findAll({ where: { vendorId } });
  const models = products
    .filter((p) => p.specs && p.specs.fam && ['sdwan', 'gateway'].includes(p.category))
    .map((p) => ({
      id: p.model, ...specWithoutGroup(p.specs), eol: p.eol,
      elp: p.priceDisplay, elpN: p.priceNumeric,
      dsLocal: rutaLocal(p.specs && p.specs.dsFile),
    }));

  // Cada documento lleva su copia local cuando esta descargada; la pagina prefiere esa y
  // cae a la URL oficial si falta.
  const datasheets = {};
  for (const [clave, d] of Object.entries(arubaData.DATASHEETS)) {
    datasheets[clave] = { ...d, local: rutaLocal(d.file) };
  }

  return {
    models,
    bundles: bundlesOut,
    care,
    careSkus: arubaData.CARE_SKU,
    licenses: arubaData.LICENSES,
    software: arubaData.SOFTWARE,
    centralTiers: arubaData.CENTRAL_TIERS,
    datasheets,
    sizing: {
      bwTiers: arubaData.BW_TIERS,
      boost: arubaData.BOOST,
      fec: arubaData.FEC_OVERHEAD,
    },
  };
}

// Nokia: fabric de datacenter (7220 IXR). Distinto de los otros seis — no hay un solo
// "modelo elegido", el dimensionador arma un diseño con un LEAF y un SPINE y sus cantidades,
// así que aquí solo se entrega el catálogo de modelos con sus puertos estructurados; el
// motor de sizing (leafsNecesarios/spineNecesario) vive en public/js/dimensionador-nokia-7220ixr.js,
// igual que las otras páginas calculan del lado del cliente sobre el catálogo servido.
async function toDimensionadorNokia() {
  const vendorIds = await vendorIdMap();
  const vendorId = vendorIds.nokia;

  const products = await Product.findAll({ where: { vendorId, category: 'switch_fabric' } });
  const models = products
    .filter((p) => p.specs && Array.isArray(p.specs.puertos))
    .map((p) => ({
      id: p.model, ...p.specs, eol: p.eol, elp: p.priceDisplay, elpN: p.priceNumeric,
    }));

  return { models };
}

// Nokia fase 2: los 14 que NO son fabric. Aqui si hay "un modelo elegido", asi que la pagina
// usa `js/ficha.js` como los otros cinco dimensionadores. Se entregan tambien las familias,
// porque la plataforma se acota antes que el caudal (misma regla que Cisco).
async function toDimensionadorNokiaRouter() {
  const vendorIds = await vendorIdMap();
  const products = await Product.findAll({
    where: { vendorId: vendorIds.nokia, category: 'router_core' },
  });
  const models = products
    .filter((p) => p.specs && typeof p.specs.cap === 'number')
    .map((p) => ({
      id: p.model, ...p.specs, eol: p.eol, elp: p.priceDisplay, elpN: p.priceNumeric,
    }))
    .sort((a, b) => a.cap - b.cap);

  return { models, plataformas: nokiaData.PLATAFORMAS };
}

// guia-diseno-interactiva.html EQ shape: {role: [{v,color,model,spec,alt,elp}, ...]}
async function toGuiaRoles() {
  const recs = await RoleRecommendation.findAll({
    include: [{ model: Product, include: [{ model: Vendor }] }],
    order: [['id', 'ASC']],
  });
  const result = {};
  for (const r of recs) {
    if (!result[r.role]) result[r.role] = [];
    result[r.role].push({
      v: r.Product.Vendor.name,
      color: r.Product.Vendor.colorHex,
      model: r.Product.model,
      spec: r.Product.specSummary || '',
      alt: r.altText || '',
      elp: r.Product.priceDisplay || 'Consultar',
    });
  }
  return result;
}

module.exports = {
  toDimensionadorNokiaRouter,
  getVendorsList,
  toIndexPR,
  toFuentes,
  toCotizadorCatalog,
  toDimensionadorHuawei,
  toDimensionadorCisco,
  toDimensionadorFortinet,
  toDimensionadorJuniper,
  toDimensionadorMikrotik,
  toDimensionadorAruba,
  toDimensionadorNokia,
  toGuiaRoles,
};
