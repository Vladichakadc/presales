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
// FORTIWIFI Y FORTIEXTENDER (2026-11-06, mejora aprobada por el dueño al cerrar el PR #140). Sus
// filas no nombran un FortiGate, asi que el bucle principal (el de cada FortiGate) no las ve, y para ellos no hay precio
// verificado con que anclar. Su ancla es otra, y doble: el SKU EXACTO de la «Ordering Information»
// de su ficha (fortinetVariantes.js: FWF-30G-[RC] -> FWF-30G-<codigo regional>; FEX-211G…) tiene que
// estar en un bloque cuyo texto nombra el mismo modelo. El nombre va anclado y, ademas, un nombre
// conocido mas largo que lo extiende (FortiWiFi-50G-5G-II frente a FortiWiFi-50G) se lleva sus
// filas: no las arrastra el corto. Un bloque que trae el hardware de OTRO modelo se rechaza entero.
// Ver `extraerSinFortiGate`, que es pura y se prueba sin la lista (test/importar-skus-fortinet.test.js).
//
//   node scripts/importar-skus-fortinet.js <price-list.xlsx> [--dry]

const fs = require('fs');
const path = require('path');
// ── FORTIWIFI Y FORTIEXTENDER ────────────────────────────────────────────────────────────────
// [RC] es el codigo regional que la ficha imprime en el SKU de los FortiWiFi («[RC] = regional
// code: A, B, D, E, F, I, J, N, P, S, V, and Y»): esas doce letras y ninguna otra.
const CODIGOS_RC = ['A', 'B', 'D', 'E', 'F', 'I', 'J', 'N', 'P', 'S', 'V', 'Y'];
const escapar = (t) => t.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
const reNombre = (n) => new RegExp(escapar(n) + '(?![0-9A-Za-z])', 'i');

// Lo que se busca en la lista, de los datos con su ficha. Solo las variantes SIN `lic`: las que lo
// tienen ya salen del bloque de su FortiGate (sus filas nombran FortiGate-40F, FortiGate-50G…).
function objetivos({ variantes = [], extenders = [] } = {}) {
  const out = [];
  for (const v of variantes) {
    if (v.lic) continue;
    const raiz = v.rc ? v.sku.replace(/-\[RC\]$/, '') : v.sku;
    out.push({ id: v.id, nombres: [v.id.replace(/ /g, '-'), raiz],
      esHw: v.rc ? ((s) => new RegExp(`^${escapar(raiz)}-(${CODIGOS_RC.join('|')})$`).test(s)) : ((s) => s === v.sku) });
  }
  for (const x of (extenders || [])) {
    const raices = [...new Set(x.skus.map((s) => s.replace(/-(AM|EA)$/, '')))];
    out.push({ id: x.id, nombres: [x.id.replace(/ /g, '-'), ...raices], esHw: (s) => x.skus.includes(s) });
  }
  return out;
}

// filas: arrays de la hoja DataSet; idx: indices de columna {sku, precio, tipo, item, vd, sd, prod}.
// Devuelve { salida: {id: refs}, rechazos: [texto] }.
function extraerSinFortiGate(filas, idx, datos) {
  const objs = objetivos(datos);
  const todos = objs.flatMap((o) => o.nombres.map((n) => ({ n, o })));
  const textoDe = (f) => [f[idx.item], f[idx.vd], f[idx.prod]].map((x) => String(x || '')).join(' | ');
  const salida = {};
  const rechazos = [];
  for (const o of objs) {
    // Un nombre conocido mas largo que empieza por uno de los nuestros es otro modelo.
    const largos = todos.filter((t) => t.o !== o && o.nombres.some((n) => t.n.length > n.length
      && t.n.toLowerCase().startsWith(n.toLowerCase()))).map((t) => reNombre(t.n));
    const propios = o.nombres.map(reNombre);
    const bloque = filas.filter((f) => {
      if (!String(f[idx.sku] || '').trim()) return false;
      const t = textoDe(f);
      return propios.some((r) => r.test(t)) && !largos.some((r) => r.test(t));
    });
    if (!bloque.length) { rechazos.push(`${o.id}: sin ninguna fila en el documento`); continue; }
    const sku = (f) => String(f[idx.sku]).trim();
    if (!bloque.some((f) => o.esHw(sku(f)))) {
      rechazos.push(`${o.id}: ninguna fila del bloque trae su SKU de hardware de la ficha`); continue;
    }
    const ajeno = bloque.find((f) => objs.some((x) => x !== o && x.esHw(sku(f))));
    if (ajeno) { rechazos.push(`${o.id}: CONTRADICE — el bloque trae ${sku(ajeno)}, hardware de otro modelo`); continue; }
    const vistos = new Set();
    salida[o.id] = bloque.map((f) => {
      const p = Number(f[idx.precio]);
      return { sku: sku(f), d: String(f[idx.sd] || f[idx.vd] || '').trim(),
        p: String(f[idx.precio]).trim() !== '' && Number.isFinite(p) ? p : null, t: String(f[idx.tipo] || '').trim() || null };
    }).filter((x) => (vistos.has(x.sku) ? false : vistos.add(x.sku)));
  }
  return { salida, rechazos };
}

module.exports = { extraerSinFortiGate, objetivos, CODIGOS_RC };
if (require.main !== module) return;

const archivo = process.argv[2];
const dry = process.argv.includes('--dry');
if (!archivo || !fs.existsSync(archivo)) {
  console.error('Uso: node scripts/importar-skus-fortinet.js <price-list.xlsx> [--dry]');
  process.exit(1);
}
const XLSX = require('xlsx');

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
  // Los FortiWiFi (variantes sin licencias de la lista) no nombran un FortiGate: van por
  // extraerSinFortiGate, con su propia ancla.
  if (m.variante && m.listaSinExtraer) continue;
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

// FortiWiFi y FortiExtender, con su propia ancla (ver la cabecera).
const VAR = require('../server/seed/legacyData/fortinetVariantes.js');
const sinFG = extraerSinFortiGate(datos, { sku: iSKU, precio: iPrecio, tipo: iTipo, item: iItem, vd: iVD, sd: iSD, prod: iProd },
  { variantes: VAR.VARIANTES, extenders: VAR.FORTIEXTENDER.modelos });
for (const [id, refs] of Object.entries(sinFG.salida)) { salida[id] = refs; total += refs.length; }
rechazos.push(...sinFG.rechazos);

// VALIDADOR SEMANTICO (F18, 2026-09-23). El ancla del precio caza la fila desplazada, pero no
// una descripcion que contradice su propio codigo: la lista de septiembre trae
// `FG-90G-BDL-1082-60` descrito como «1 Year». No se rechaza —el SKU y el precio estan
// anclados y son correctos—, se REPORTA aqui para que se vea el dia que entra, y el servicio
// de referencias lo corrige a la vista al servirlo (server/services/terminoSku.js).
const terminoSku = require('../server/services/terminoSku');
const incoherentes = [];
for (const [modelo, refs] of Object.entries(salida)) {
  for (const r of refs) {
    const v = terminoSku.validar(r);
    if (!v.ok) incoherentes.push(`${modelo}: ${r.sku} dice ${v.mesesTexto} meses en el texto («${r.d}») y ${v.mesesSku} en el codigo`);
  }
}
console.log(`modelos con referencias: ${Object.keys(salida).length} (FortiGate con hwSku: ${M.filter((m) => m.hwSku && !m.variante).length}; FortiWiFi y FortiExtender: ${Object.keys(sinFG.salida).length})`);
if (incoherentes.length) console.log('TERMINO INCOHERENTE ENTRE TEXTO Y CODIGO (se importa; el servicio lo corrige a la vista):\n  ' + incoherentes.join('\n  '));
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
