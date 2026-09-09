#!/usr/bin/env node
'use strict';
// Extrae de la price list oficial de Fortinet TODAS las referencias de pedido asociadas a cada
// equipo del catalogo, y las escribe en server/seed/legacyData/fortinetSkus.js.
//
// POR QUE EXISTE. La ficha de un equipo mostraba su rendimiento pero ni una sola referencia de
// pedido: quien arma una propuesta tenia el modelo pero no que pedir. La price list ya trae esa
// informacion —hardware, bundles de FortiCare/FortiGuard, licencias y SaaS— asociada al mismo
// modelo, asi que el dato no faltaba: faltaba traerlo.
//
// EL ANCLAJE, IGUAL QUE EN LOS OTROS IMPORTADORES. Una fila solo entra si el bloque de ese
// modelo contiene su `hwSku` ya verificado y ese SKU trae el mismo precio que el catalogo. Si
// el documento se equivoca sobre lo que el catalogo dice hoy, no hay razon para creerle el
// resto de su bloque — mismo criterio que scripts/importar-propuesta.js.
//
// EL CASADO VA ANCLADO AL NOMBRE, no por substring suelto: `FortiGate-30G` no debe arrastrar
// las filas de un futuro `FortiGate-30G2`. Se midio que hoy no hay arrastre, pero la guarda se
// deja puesta porque el catalogo cambia y ese error no avisaria.
//
//   node scripts/importar-skus-fortinet.js <price-list.xlsx> [--dry]

const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const archivo = process.argv[2];
const dry = process.argv.includes('--dry');
if (!archivo || !fs.existsSync(archivo)) {
  console.error('Uso: node scripts/importar-skus-fortinet.js <price-list.xlsx> [--dry]');
  process.exit(1);
}

const MODELOS = require('../server/seed/legacyData/fortinet.js');
const M = MODELOS.MODELS || Object.values(MODELOS).find(Array.isArray);
const cotizador = require('../server/seed/legacyData/cotizadorCatalog.js');
const CAT = Array.isArray(cotizador) ? cotizador : (cotizador.CATALOG || Object.values(cotizador).find(Array.isArray));
const precioDe = new Map(CAT.filter((x) => /fortinet/i.test(x.vendor || '')).map((x) => [x.model, x.elpN]));

const wb = XLSX.readFile(archivo);
const hoja = wb.Sheets.DataSet;
if (!hoja) { console.error('El documento no trae la hoja "DataSet".'); process.exit(1); }
const filas = XLSX.utils.sheet_to_json(hoja, { header: 1, defval: '', blankrows: false });

// La cabecera no esta en la fila 0: el documento lleva rotulo y direccion postal encima.
const iCab = filas.findIndex((f) => f.includes('SKU') && f.includes('Price'));
if (iCab < 0) { console.error('No se encontro la fila de cabeceras en DataSet.'); process.exit(1); }
const cab = filas[iCab];
const col = (n) => cab.indexOf(n);
const iSKU = col('SKU'); const iPrecio = col('Price'); const iTipo = col('Product Type');
const iItem = col('Item'); const iVD = col('Vendor Description'); const iSD = col('Short Description');
const iProd = col('Product');

const datos = filas.slice(iCab + 1).filter((f) => String(f[iSKU] || '').trim());
const textoDe = (f) => [f[iItem], f[iVD], f[iProd]].map((x) => String(x || '')).join(' | ');

const salida = {};
const rechazos = [];
let total = 0;

for (const m of M) {
  if (!m.hwSku) continue; // sin SKU de hardware verificado no hay ancla, asi que no se importa
  // La lista nombra "FortiGate-120G"; el catalogo, "FortiGate 120G".
  const nombre = m.id.replace(/^FortiGate /, 'FortiGate-');
  const re = new RegExp(nombre.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&') + '(?![0-9A-Za-z])');
  const bloque = datos.filter((f) => re.test(textoDe(f)));
  if (!bloque.length) { rechazos.push(`${m.id}: sin ninguna fila en el documento`); continue; }

  // ANCLA: el hardware del propio modelo tiene que estar y coincidir en precio con el catalogo.
  const hw = bloque.find((f) => String(f[iSKU]).trim() === m.hwSku);
  if (!hw) { rechazos.push(`${m.id}: su hwSku ${m.hwSku} no aparece en el bloque`); continue; }
  const esperado = precioDe.get(m.id);
  const real = Number(hw[iPrecio]);
  if (esperado !== undefined && Number.isFinite(real) && Math.abs(real - esperado) > 0.5) {
    rechazos.push(`${m.id}: DESANCLADO — el catalogo cotiza ${esperado} y la lista dice ${real}`);
    continue;
  }

  const refs = bloque.map((f) => {
    const p = Number(f[iPrecio]);
    return {
      sku: String(f[iSKU]).trim(),
      d: String(f[iSD] || f[iVD] || '').trim(),
      p: Number.isFinite(p) ? p : null,
      t: String(f[iTipo] || '').trim() || null,
    };
  }).filter((x) => x.sku);

  // Un mismo SKU puede repetirse en el documento; se conserva la primera aparicion.
  const vistos = new Set();
  salida[m.id] = refs.filter((x) => (vistos.has(x.sku) ? false : vistos.add(x.sku)));
  total += salida[m.id].length;
}

console.log(`modelos con referencias: ${Object.keys(salida).length} de ${M.filter((m) => m.hwSku).length}`);
console.log(`referencias totales: ${total}`);
if (rechazos.length) console.log('RECHAZOS (no se importan):\n  ' + rechazos.join('\n  '));
if (dry) { console.log('\n--dry: no se escribio nada.'); process.exit(0); }

const destino = path.join(__dirname, '..', 'server', 'seed', 'legacyData', 'fortinetSkus.js');
const cabecera = `'use strict';
// Referencias de pedido de cada equipo FortiGate: hardware, bundles de FortiCare/FortiGuard,
// licencias y SaaS, con su descripcion y su precio de lista.
//
// GENERADO por scripts/importar-skus-fortinet.js desde la price list oficial
// "2026Q3 Mid Price list_AMER_FINAL_EFF 090726.xlsx" (AMER, vigente desde el 07-sep-2026), la
// misma que ya respalda los precios de cotizadorCatalog.js. NO SE EDITA A MANO: se regenera
// pasando la lista nueva al importador, que ancla cada bloque contra el hwSku y el precio ya
// verificados antes de aceptarlo.
//
// El precio (\`p\`) es de lista y excluye descuentos de canal, impuestos y promociones — la misma
// advertencia que el resto del catalogo. \`t\` es el tipo que declara el documento: HW, Service
// o SaaS.
//
// Fecha de extraccion: ${new Date().toISOString().slice(0, 10)} · ${total} referencias sobre ${Object.keys(salida).length} equipos.

module.exports = `;
fs.writeFileSync(destino, cabecera + JSON.stringify(salida, null, 1) + ';\n');
const kb = (fs.statSync(destino).size / 1024).toFixed(0);
console.log(`\nescrito ${path.relative(process.cwd(), destino)} (${kb} KB)`);
