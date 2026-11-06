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
// FORTIWIFI Y FORTIEXTENDER (2026-11-06, mejora aprobada por el dueño). Sus filas no nombran un
// FortiGate, asi que el bucle de arriba no las veia y salian «consultar» (`listaSinExtraer` en
// fortinet.js; `fex-sin-precio` en el motor). No tienen un precio ya verificado contra el que
// anclar —nunca estuvieron en el catalogo—, asi que el ancla son las dos cosas que SI estan
// verificadas, las de su ficha: el NOMBRE del modelo en la fila y el SKU de su «Ordering
// Information» (fortinetVariantes.js). Un bloque entra solo si trae ese SKU de hardware; un
// codigo regional que la ficha no publica lo contradice y el bloque se rechaza entero.
//   · FortiWiFi: solo las variantes SIN `lic` declarado. Las celulares (40F-3G4G, 50G-5G,
//     51G-5G) ya salen del bloque de su FortiGate y no se tocan. «FortiWiFi-50G» no arrastra las
//     filas de «FortiWiFi-50G-5G-II» ni «FortiWiFi-70G» las de «FortiWiFi-70G-POE»: una fila va
//     al nombre declarado mas largo que la nombra.
//   · FortiExtender: ademas del nombre, entran las filas cuyo SKU lleva el codigo de modelo de
//     su FortiCare de la ficha (`X101G` en FC-10-X101G-247-02-DD).
// El codigo de licencias de un FortiWiFi (`lic`, `bdl`) NO se escribe solo: el importador lo
// SUGIERE si su bloque trae uno y solo uno, y una persona lo declara en fortinetVariantes.js
// tras mirarlo. Sin eso la variante sigue «consultar», que es lo honesto.
//
//   node scripts/importar-skus-fortinet.js <price-list.xlsx> [--dry]

const fs = require('fs');
const path = require('path');

const { CODIGOS_REGIONALES, casaSku } = require('../server/seed/legacyData/fortinetVariantes.js');

const escapar = (s) => s.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
// La lista nombra «FortiGate-120G» y «FortiWiFi-50G»; el catalogo, «FortiGate 120G». Solo el
// primer espacio se vuelve guion, como ha sido siempre en FortiGate. El FortiExtender acepta
// guion o espacio en cada hueco («FortiExtender WAN 50G»): no hay lista leida que diga cual usa.
const GUARDA = '(?![0-9A-Za-z])';
const reNombre = (id) => new RegExp(escapar(id.replace(/^(FortiGate|FortiWiFi) /, '$1-')) + GUARDA);
const reNombreLibre = (id) => new RegExp(escapar(id).split(' ').join('[- ]') + GUARDA);

// Un SKU con la forma del de la ficha pero con un codigo regional que la ficha no publica.
function contradiceRc(skuFicha, sku) {
  if (!/\[RC\]/.test(skuFicha)) return false;
  const [antes, despues] = skuFicha.split('[RC]');
  const re = new RegExp(`^${escapar(antes)}([A-Z])${escapar(despues)}$`);
  const x = re.exec(sku);
  return !!x && !CODIGOS_REGIONALES.includes(x[1]);
}

function leerTabla(filas) {
  // La cabecera no esta en la fila 0: el documento lleva rotulo y direccion postal encima.
  const iCab = filas.findIndex((f) => f.includes('SKU') && f.includes('Price'));
  if (iCab < 0) throw new Error('No se encontro la fila de cabeceras en DataSet.');
  const cab = filas[iCab];
  const col = (n) => cab.indexOf(n);
  const c = { sku: col('SKU'), precio: col('Price'), tipo: col('Product Type'), item: col('Item'),
    vd: col('Vendor Description'), sd: col('Short Description'), prod: col('Product') };
  const datos = filas.slice(iCab + 1).filter((f) => String(f[c.sku] || '').trim());
  const texto = (f) => [f[c.item], f[c.vd], f[c.prod]].map((x) => String(x || '')).join(' | ');
  const ref = (f) => {
    const p = Number(f[c.precio]);
    return { sku: String(f[c.sku]).trim(), d: String(f[c.sd] || f[c.vd] || '').trim(),
      p: Number.isFinite(p) ? p : null, t: String(f[c.tipo] || '').trim() || null };
  };
  return { datos, texto, ref, precio: (f) => Number(f[c.precio]), sku: (f) => String(f[c.sku]).trim() };
}

// Un mismo SKU puede repetirse en el documento; se conserva la primera aparicion.
const sinRepetir = (refs) => {
  const vistos = new Set();
  return refs.filter((x) => x.sku && (vistos.has(x.sku) ? false : vistos.add(x.sku)));
};

/* Lo que sale de una lista. `modelos` son los de fortinet.js (las variantes se saltan en el
   bucle de FortiGate: sus filas ya van en el bloque de su base); `precioDe` el precio del
   cotizador por id; `variantes` y `extenders` las tablas de fortinetVariantes.js. */
function extraer({ filas, modelos, precioDe, variantes = [], extenders = [] }) {
  const T = leerTabla(filas);
  const salida = {};
  const rechazos = [];
  const sugerencias = [];
  const avisos = [];

  for (const m of modelos) {
    if (!m.hwSku || m.variante) continue; // sin SKU de hardware verificado no hay ancla
    const re = reNombre(m.id);
    const bloque = T.datos.filter((f) => re.test(T.texto(f)));
    if (!bloque.length) { rechazos.push(`${m.id}: sin ninguna fila en el documento`); continue; }

    // ANCLA: el hardware del propio modelo tiene que estar y coincidir en precio con el catalogo.
    const hw = bloque.find((f) => T.sku(f) === m.hwSku);
    if (!hw) { rechazos.push(`${m.id}: su hwSku ${m.hwSku} no aparece en el bloque`); continue; }
    const esperado = precioDe.get(m.id);
    const real = T.precio(hw);
    if (esperado !== undefined && Number.isFinite(real) && Math.abs(real - esperado) > 0.5) {
      rechazos.push(`${m.id}: DESANCLADO — el catalogo cotiza ${esperado} y la lista dice ${real}`);
      continue;
    }
    salida[m.id] = sinRepetir(bloque.map(T.ref));
  }

  // ── FortiWiFi: nombre + SKU de la ficha ─────────────────────────────────────────────────
  const wifi = variantes.filter((v) => !v.lic && /^FortiWiFi /.test(v.id));
  for (const v of wifi) {
    const re = reNombre(v.id);
    // Los nombres declarados mas largos que empiezan por este se quedan con sus filas.
    const masLargos = wifi.filter((o) => o !== v && o.id.startsWith(`${v.id}-`)).map((o) => reNombre(o.id));
    const bloque = T.datos.filter((f) => re.test(T.texto(f)) && !masLargos.some((r) => r.test(T.texto(f))));
    if (!bloque.length) { rechazos.push(`${v.id}: sin ninguna fila en el documento`); continue; }
    const hws = bloque.filter((f) => casaSku(v.sku, T.sku(f)));
    if (!hws.length) { rechazos.push(`${v.id}: el SKU de su ficha ${v.sku} no aparece en el bloque`); continue; }
    const raros = bloque.map(T.sku).filter((s) => contradiceRc(v.sku, s));
    if (raros.length) {
      rechazos.push(`${v.id}: ${raros.join(', ')} lleva un codigo regional que la ficha no publica (${CODIGOS_REGIONALES.join(', ')})`);
      continue;
    }
    const refs = sinRepetir(bloque.map(T.ref));
    salida[v.id] = refs;
    const precios = [...new Set(hws.map(T.precio).filter(Number.isFinite))];
    if (precios.length > 1) avisos.push(`${v.id}: el equipo no cuesta lo mismo en cada codigo regional (${precios.join(', ')})`);
    const cods = [...new Set(refs.map((r) => /^FC-10-([A-Z0-9]+)-(?:809|950|928)-02-(?:12|36|60)$/.exec(r.sku)).filter(Boolean).map((x) => x[1]))];
    const bdls = [...new Set(refs.map((r) => /^(.+-BDL)-(?:809|950)-(?:12|36|60)$/.exec(r.sku)).filter(Boolean).map((x) => x[1]))];
    if (cods.length === 1) {
      sugerencias.push(`${v.id}: lic: '${cods[0]}'${bdls.length === 1 ? `, bdl: '${bdls[0]}'` : ''}`
        + `${bdls.length > 1 ? ` (bdl: varios, ${bdls.join(', ')}: elegir mirando la lista)` : ''}`);
    } else {
      sugerencias.push(`${v.id}: ${cods.length ? `varios codigos de licencias (${cods.join(', ')})` : 'ningun codigo de licencias'}; no se sugiere \`lic\``);
    }
  }

  // ── FortiExtender: nombre o codigo de su FortiCare + SKU de la ficha ────────────────────
  for (const x of extenders) {
    const re = reNombreLibre(x.id);
    const codCare = [...String(x.care || '').matchAll(/FC-10-([A-Z0-9]+)-247-02-DD/g)].map((y) => y[1]);
    const deCare = (s) => codCare.some((c) => s.startsWith(`FC-10-${c}-`));
    const bloque = T.datos.filter((f) => re.test(T.texto(f)) || deCare(T.sku(f)));
    if (!bloque.length) { rechazos.push(`${x.id}: sin ninguna fila en el documento`); continue; }
    const faltan = x.skus.filter((s) => !bloque.some((f) => T.sku(f) === s));
    if (faltan.length === x.skus.length) {
      rechazos.push(`${x.id}: ningun SKU de su ficha (${x.skus.join(', ')}) aparece en el bloque`);
      continue;
    }
    if (faltan.length) avisos.push(`${x.id}: la lista no trae ${faltan.join(', ')}`);
    if (codCare.length && !bloque.some((f) => deCare(T.sku(f)))) avisos.push(`${x.id}: la lista no trae su FortiCare (${x.care})`);
    salida[x.id] = sinRepetir(bloque.map(T.ref));
  }

  const total = Object.values(salida).reduce((n, r) => n + r.length, 0);
  return { salida, rechazos, sugerencias, avisos, total };
}

module.exports = { extraer, contradiceRc };

if (require.main === module) {
  const archivo = process.argv[2];
  const dry = process.argv.includes('--dry');
  if (!archivo || !fs.existsSync(archivo)) {
    console.error('Uso: node scripts/importar-skus-fortinet.js <price-list.xlsx> [--dry]');
    process.exit(1);
  }
  const XLSX = require('xlsx');
  const MODELOS = require('../server/seed/legacyData/fortinet.js');
  const M = MODELOS.MODELS || Object.values(MODELOS).find(Array.isArray);
  const { VARIANTES, FORTIEXTENDER } = require('../server/seed/legacyData/fortinetVariantes.js');
  const cotizador = require('../server/seed/legacyData/cotizadorCatalog.js');
  const CAT = Array.isArray(cotizador) ? cotizador : (cotizador.CATALOG || Object.values(cotizador).find(Array.isArray));
  const precioDe = new Map(CAT.filter((x) => /fortinet/i.test(x.vendor || '')).map((x) => [x.model, x.elpN]));

  const wb = XLSX.readFile(archivo);
  const hoja = wb.Sheets.DataSet;
  if (!hoja) { console.error('El documento no trae la hoja "DataSet".'); process.exit(1); }
  const filas = XLSX.utils.sheet_to_json(hoja, { header: 1, defval: '', blankrows: false });

  let r;
  try {
    r = extraer({ filas, modelos: M, precioDe, variantes: VARIANTES, extenders: FORTIEXTENDER.modelos });
  } catch (e) { console.error(e.message); process.exit(1); }
  const { salida, rechazos, sugerencias, avisos, total } = r;

  // VALIDADOR SEMANTICO (F18, 2026-09-23). El ancla del precio caza la fila desplazada, pero no
  // una descripcion que contradice su propio codigo: la lista de septiembre trae
  // `FG-90G-BDL-1082-60` descrito como «1 Year». No se rechaza —el SKU y el precio estan
  // anclados y son correctos—, se REPORTA aqui para que se vea el dia que entra, y el servicio
  // de referencias lo corrige a la vista al servirlo (server/services/terminoSku.js).
  const terminoSku = require('../server/services/terminoSku');
  const incoherentes = [];
  for (const [modelo, refs] of Object.entries(salida)) {
    for (const x of refs) {
      const v = terminoSku.validar(x);
      if (!v.ok) incoherentes.push(`${modelo}: ${x.sku} dice ${v.mesesTexto} meses en el texto («${x.d}») y ${v.mesesSku} en el codigo`);
    }
  }
  const candidatos = M.filter((m) => m.hwSku && !m.variante).length
    + VARIANTES.filter((v) => !v.lic && /^FortiWiFi /.test(v.id)).length + FORTIEXTENDER.modelos.length;
  console.log(`modelos con referencias: ${Object.keys(salida).length} de ${candidatos} (FortiGate, FortiWiFi y FortiExtender)`);
  if (incoherentes.length) console.log('TERMINO INCOHERENTE ENTRE TEXTO Y CODIGO (se importa; el servicio lo corrige a la vista):\n  ' + incoherentes.join('\n  '));
  console.log(`referencias totales: ${total}`);
  if (avisos.length) console.log('AVISOS (se importa):\n  ' + avisos.join('\n  '));
  if (sugerencias.length) {
    console.log('CODIGO DE LICENCIAS DE CADA FORTIWIFI (no se escribe solo: declararlo en fortinetVariantes.js tras mirarlo):\n  '
      + sugerencias.join('\n  '));
  }
  if (rechazos.length) console.log('RECHAZOS (no se importan):\n  ' + rechazos.join('\n  '));
  if (dry) { console.log('\n--dry: no se escribio nada.'); process.exit(0); }

  const destino = path.join(__dirname, '..', 'server', 'seed', 'legacyData', 'fortinetSkus.js');
  const cabecera = `'use strict';
// Referencias de pedido de cada equipo FortiGate, FortiWiFi y FortiExtender: hardware, bundles de
// FortiCare/FortiGuard, licencias y SaaS, con su descripcion y su precio de lista.
//
// GENERADO por scripts/importar-skus-fortinet.js desde la price list oficial
// "${path.basename(archivo)}". NO SE EDITA A MANO: se regenera pasando la lista nueva al
// importador, que ancla cada bloque antes de aceptarlo (FortiGate: hwSku y precio ya verificados;
// FortiWiFi y FortiExtender: nombre y SKU de su ficha).
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
}
