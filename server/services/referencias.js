'use strict';
// Referencias de pedido de un equipo: que hay que pedir de verdad, no solo que equipo elegir.
//
// POR QUE EXISTE. La ficha mostraba el rendimiento de un equipo y ni una sola referencia de
// pedido, asi que quien armaba una propuesta tenia el modelo pero no el SKU. En Fortinet ese
// dato ya estaba en la price list que respalda los precios (hardware, bundles de FortiCare y
// FortiGuard, licencias y SaaS); solo faltaba traerlo y mostrarlo.
//
// LO QUE CADA FABRICANTE TIENE ES DISTINTO, Y SE DICE. Fortinet trae 6.849 referencias con
// precio; Aruba trae variantes de producto SIN numero de parte para la mayoria (HPE no lo
// publica en el material disponible), pero el SKU de cabecera de 15 modelos (EdgeConnect y
// gateway) SI trae List Price real desde el 2026-09-10 (ver ARUBA_LIST_PRICE, mas abajo);
// Cisco trae el SKU de cabecera de 8 de sus 21 modelos; Huawei, MikroTik, Juniper y Nokia no
// traen ninguna. Un fabricante sin referencias
// lo declara — nunca se rellena con un numero de parte plausible, que es exactamente como entro
// el "FortiGate 2000F" inexistente que este catalogo ya sufrio.
//
// SE SIRVE DESDE legacyData Y NO DESDE LA BASE, igual que la procedencia (`toFuentes`): es un
// catalogo de referencia estatico que no se cruza con ninguna otra tabla, y sembrar 6.849 filas
// en cada arranque solo alargaria el despliegue.

const fortinetSkus = require('../seed/legacyData/fortinetSkus.js');

// El resto se carga en perezoso: solo Fortinet y Aruba tienen algo que dar hoy.
const modelosDe = (archivo) => {
  const m = require(`../seed/legacyData/${archivo}.js`);
  return m.MODELS || Object.values(m).find(Array.isArray) || [];
};

const VENDORS = new Set(['fortinet', 'aruba', 'cisco', 'huawei', 'mikrotik', 'juniper', 'nokia']);

// List Price de HPE por SKU, extraído el 2026-09-10 de un export de lista de precios de un
// distribuidor autorizado (ver public/datasheets/aruba-lista-precios-hpe.csv) — SOLO el List
// Price y su vigencia, nunca el nombre del distribuidor ni su % de descuento. Cubre el
// hardware EdgeConnect y gateway con SKU confirmado; lo que sigue sin SKU (EC-XS-SP,
// EC-XS-FIPS, EC-V, la serie 7000/7200) sigue sin precio.
const ARUBA_LIST_PRICE = {
  JM962A: 2752, R9D72A: 1546, S0E22A: 4318, S0E23A: 5588, S3N73A: 13479,
  JZ872A: 21323, JZ878A: 34592, S0B67A: 46664, S2N65A: 47304,
  R1B20A: 2505, R3V91A: 3247, R1B31A: 4441, S5H02A: 9228, R9M45A: 19944, R7H95A: 37614,
  // Serie 7000/7200 (2026-09-13, misma lista): solo la unidad REMANUFACTURADA HPE (sufijo
  // AR) tiene List Price — la nueva no aparece en la lista. 7024 y 7240XM: ni una ni otra.
  JW633AR: 1567, JX927AR: 2718, JW678AR: 4185, JW686AR: 7326,
  JW735AR: 13609, JW743AR: 17798, JW751AR: 26699,
};

const SIN_REFERENCIAS = {
  huawei: 'El catálogo de Huawei no trae referencias de pedido: sus cifras salen del portafolio comercial, que publica rendimiento y no números de parte.',
  mikrotik: 'El catálogo de MikroTik no trae referencias de pedido, y tampoco tiene lista de precios firmada — el propio nombre del modelo es la referencia con la que se pide.',
  juniper: 'El catálogo de Juniper no trae referencias de pedido: no hay lista de precios de este fabricante en el material disponible.',
  nokia: 'El catálogo de Nokia no trae referencias de pedido: no hay lista de precios de este fabricante en el material disponible.',
};

function referenciasDe(vendor, modeloId) {
  const v = String(vendor || '').toLowerCase();
  if (!VENDORS.has(v)) return null;
  const id = String(modeloId || '');

  if (v === 'fortinet') {
    const refs = fortinetSkus[id] || [];
    return {
      vendor: v,
      modelo: id,
      refs,
      fuente: '2026Q3 Mid Price list_AMER_FINAL_EFF 090726.xlsx',
      nota: refs.length
        ? 'Precios de lista, sin descuentos de canal, impuestos ni promociones.'
        : 'Este equipo no tiene referencias en la lista de precios vigente (suele significar que está fuera de venta y solo admite renovación de servicios).',
    };
  }

  if (v === 'aruba') {
    const m = modelosDe('aruba').find((x) => x.id === id);
    const precio = ARUBA_LIST_PRICE[(m && m.hwSku) || ''] ?? null;
    const refs = ((m && m.skus) || [])
      .map((s) => ({ sku: s.sku || null, d: s.d || '', p: s.sku ? (ARUBA_LIST_PRICE[s.sku] ?? null) : null, t: s.sku ? 'HW' : null }));
    if (m && m.hwSku && !refs.some((r) => r.sku === m.hwSku)) refs.unshift({ sku: m.hwSku, d: `${id} (referencia de cabecera)`, p: precio, t: 'HW' });
    return {
      vendor: v,
      modelo: id,
      refs,
      fuente: precio != null
        ? 'Páginas de producto y tienda oficiales de HPE/Aruba; List Price de export de distribuidor HPE (public/datasheets/aruba-lista-precios-hpe.csv)'
        : 'Páginas de producto y tienda oficiales de HPE/Aruba',
      // Se dice lo que son: variantes publicadas, no numeros de parte, porque la mayoria va con
      // `sku: null`. Presentarlas como referencias de pedido prometeria un dato que no existe.
      // El SKU de cabecera SI trae List Price cuando este catalogo lo tiene confirmado (2026-09-10,
      // ver ARUBA_LIST_PRICE) — es el precio de lista de HPE, sin el descuento del distribuidor.
      nota: 'HPE no publica número de parte para la mayoría de estas variantes en el material disponible: se listan como referencias de producto. El SKU de cabecera trae List Price de HPE cuando está confirmado; no es precio neto (sin descuento de distribuidor) — confirmar con el distribuidor antes de cotizar.',
    };
  }

  if (v === 'cisco') {
    const m = modelosDe('cisco').find((x) => x.id === id);
    const refs = m && m.hwSku ? [{ sku: m.hwSku, d: `${id} (referencia de cabecera)`, p: null, t: 'HW' }] : [];
    return {
      vendor: v,
      modelo: id,
      refs,
      fuente: 'Export de CCW (Products_115951960955347.xlsx)',
      nota: refs.length
        ? 'Solo la referencia de cabecera: el catálogo no trae el desglose de bundles y licencias de este equipo.'
        : 'El catálogo no trae referencia de pedido para este equipo — de los 21 modelos Cisco, 8 la tienen.',
    };
  }

  return { vendor: v, modelo: id, refs: [], fuente: null, nota: SIN_REFERENCIAS[v] || null };
}

module.exports = { referenciasDe, VENDORS };
