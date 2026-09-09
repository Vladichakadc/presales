'use strict';
// Referencias de pedido de un equipo: que hay que pedir de verdad, no solo que equipo elegir.
//
// POR QUE EXISTE. La ficha mostraba el rendimiento de un equipo y ni una sola referencia de
// pedido, asi que quien armaba una propuesta tenia el modelo pero no el SKU. En Fortinet ese
// dato ya estaba en la price list que respalda los precios (hardware, bundles de FortiCare y
// FortiGuard, licencias y SaaS); solo faltaba traerlo y mostrarlo.
//
// LO QUE CADA FABRICANTE TIENE ES DISTINTO, Y SE DICE. Fortinet trae 6.849 referencias con
// precio; Aruba trae variantes de producto SIN numero de parte (HPE no lo publica en el
// material disponible, igual que no publica precios); Cisco trae el SKU de cabecera de 8 de sus
// 21 modelos; Huawei, MikroTik, Juniper y Nokia no traen ninguna. Un fabricante sin referencias
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
    const refs = ((m && m.skus) || []).map((s) => ({ sku: s.sku || null, d: s.d || '', p: null, t: s.sku ? 'HW' : null }));
    if (m && m.hwSku && !refs.some((r) => r.sku === m.hwSku)) refs.unshift({ sku: m.hwSku, d: `${id} (referencia de cabecera)`, p: null, t: 'HW' });
    return {
      vendor: v,
      modelo: id,
      refs,
      fuente: 'Páginas de producto y tienda oficiales de HPE/Aruba',
      // Se dice lo que son: variantes publicadas, no numeros de parte, porque la mayoria va con
      // `sku: null`. Presentarlas como referencias de pedido prometeria un dato que no existe.
      nota: 'HPE no publica número de parte ni precio para la mayoría de estas variantes en el material disponible: se listan como referencias de producto, y hay que confirmarlas con el distribuidor antes de cotizar.',
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
