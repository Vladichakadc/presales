#!/usr/bin/env node
// ── Importador gobernado de la lista de precios del distribuidor (Aruba) ─────
//
// Mejora propuesta por el arquitecto y aprobada por el dueño el 2026-09-13:
// convertir la actualización de precios en un PROCESO, no en una edición manual.
//
// Flujo que gobierna este script:
//
//   lista del distribuidor (txt) ──► parseo restringido ──► roster del repo
//                                                              │
//                              diff para revisión humana ◄─────┘
//                                   │ --aplicar
//                                   ▼
//                     public/datasheets/aruba-lista-precios-hpe.csv
//
// REGLAS DE GOBERNANZA (no negociables — son las del repo):
//
//   1. CONFIDENCIALIDAD. La lista es de un distribuidor: contiene nombre del
//      partner, PA Number, Net Price y % de descuento. Este script SOLO lee las
//      5 columnas permitidas por la decisión del dueño (2026-09-13):
//        · Product Number (SKU)              — índice 5
//        · Short Description                 — índice 10
//        · List Price                        — índice 11
//        · List Price Effective Date         — índice 12
//        · PLC Status                        — índice 16
//      La cabecera se valida literalmente: si el formato cambia, el script ABORTA
//      antes de tocar nada (fail-safe). Nunca escribe el archivo original ni
//      vuelca columnas prohibidas en ninguna salida.
//
//   2. EL REPO MANDA SOBRE EL SURTIDO. Qué SKU se cotizan lo decide la
//      declaración del repo (modelos, licencias, Boost, Central, accesorios),
//      no la lista. La lista solo aporta precio, vigencia y PLC de esos SKU.
//      Los SKU de la lista que NO están en el roster se reportan como
//      «candidatos nuevos» para que el humano decida — nunca entran solos.
//
//   3. DRY-RUN POR DEFECTO. Sin `--aplicar` no se escribe nada. Con `--aplicar`
//      se reescribe ÚNICAMENTE el CSV del cotizador (ruta fija). Este script
//      JAMÁS edita aruba.js: si el diff muestra precios de repo desactualizados,
//      el humano los corrige en su commit gobernado (el test de coherencia
//      dual catálogo↔CSV rompe el build hasta que lo haga — es la alarma).
//
//   4. DEDUPLICACIÓN. La lista puede repetir un SKU (revisiones de precio).
//      Gana la fila con la List Price Effective Date más reciente.
//
// Uso:
//   node scripts/importar-lista-aruba.js <ruta-lista.txt> [--aplicar] [--json salida.json]
//
// Códigos de salida: 0 = sin diferencias (o CSV escrito con --aplicar);
// 1 = error de uso/formato; 2 = hay diferencias pendientes de revisión humana.

'use strict';

const fs = require('fs');
const path = require('path');

const CSV_RUTA = path.join(__dirname, '..', 'public', 'datasheets', 'aruba-lista-precios-hpe.csv');

// Cabecera esperada de la lista (los 18 campos, en orden). Se valida COMPLETA
// para que un cambio de formato del distribuidor aborte el proceso en vez de
// extraer columnas equivocadas — incluidas las prohibidas.
const CABECERA_ESPERADA = [
  'Partner Name', 'PA Number', 'Country', 'Currency', 'Incoterm',
  'Product Number', 'Pricing Model(MG1)', 'Pricing Model (MG1) Description',
  'PL', 'PL Description', 'Short Description', 'List Price',
  'List Price Effective Date', 'Net Price', 'PA Discount Percentage',
  'Net Price Effective Date', 'PLC Status', 'PLC Effective Date',
];
const COL = { sku: 5, desc: 10, lp: 11, vigencia: 12, plc: 16 }; // únicas permitidas

// ── 1 · Parseo restringido ───────────────────────────────────────────────────
// Devuelve Map<sku, {desc, lp, vigencia, plc}>. Lanza si la cabecera no es la
// esperada. Ignora filas sin SKU o sin precio numérico (se contabilizan).
function parsearLista(ruta) {
  const crudo = fs.readFileSync(ruta, 'utf8');
  const lineas = crudo.split(/\r?\n/).filter((l) => l.trim() !== '');
  if (lineas.length < 2) throw new Error('La lista está vacía o no tiene filas de datos.');

  const cab = lineas[0].split('|');
  const coincide = CABECERA_ESPERADA.every((esperada, i) => (cab[i] || '').trim() === esperada);
  if (!coincide) {
    throw new Error(
      'La cabecera de la lista NO coincide con el formato conocido del distribuidor. '
      + 'Por seguridad (columnas confidenciales) el importador aborta: revisar CABECERA_ESPERADA.',
    );
  }

  const lista = new Map();
  let descartadas = 0;
  for (let i = 1; i < lineas.length; i += 1) {
    const c = lineas[i].split('|');
    const sku = (c[COL.sku] || '').trim();
    const lp = Number((c[COL.lp] || '').trim());
    if (!sku || !Number.isFinite(lp) || lp <= 0) { descartadas += 1; continue; }
    const fila = {
      desc: (c[COL.desc] || '').trim(),
      lp,
      vigencia: (c[COL.vigencia] || '').trim(),
      plc: (c[COL.plc] || '').trim() || null,
    };
    const previa = lista.get(sku);
    // Dedup: gana la vigencia más reciente; a igual fecha, la última aparición.
    if (!previa || fila.vigencia >= previa.vigencia) lista.set(sku, fila);
  }
  return { lista, filas: lineas.length - 1, descartadas };
}

// ── 2 · Roster: los SKU que el repo declara cotizables ───────────────────────
// Orden canónico = el del CSV vigente (documentado en la cabecera del CSV):
// modelos (hwSku) → variantes de la línea actual → suscripciones → HA → Boost →
// Central → licencias de capacidad → reman legacy → accesorios.
// `precioRepo` es el precio declarado en aruba.js cuando existe (licencias,
// Boost, Central, capacidad y accesorios): el diff lo confronta con la lista.
function construirRoster(arubaData) {
  const roster = [];
  const push = (sku, familia, precioRepo, origen) => {
    if (sku) roster.push({ sku, familia, precioRepo: precioRepo ?? null, origen });
  };

  const esLineaActual = (id) => /^EC-|^Gateway /.test(id);
  // 2.1 · hwSku de cada modelo (orden de declaración)
  for (const m of arubaData.MODELS) push(m.hwSku, m.id, null, 'modelo');
  // 2.2 · Variantes de la línea actual (TAA, NAL, DC, 2PS…)
  for (const m of arubaData.MODELS) {
    if (!esLineaActual(m.id)) continue;
    for (const s of m.skus || []) if (s.sku && s.sku !== m.hwSku) push(s.sku, m.id, null, 'variante');
  }
  // 2.3 · Suscripciones EdgeConnect (SaaS y On-Premises)
  const FAM_LIC = {
    foundation: 'Suscripcion EdgeConnect Foundation',
    advanced: 'Suscripcion EdgeConnect Advanced',
    onprem: 'Suscripcion EdgeConnect On-Premises',
  };
  for (const [nivel, familia] of Object.entries(FAM_LIC)) {
    for (const bw of Object.values(arubaData.LICENSES)) {
      const t = bw[nivel];
      // Foundation no existe en los tiers intermedios (restricción oficial 2026-09-13):
      // el nivel ausente se omite, no es un error de datos.
      if (!t) continue;
      for (const y of ['y1', 'y3', 'y5']) push(t.sku[y], familia, t[y], 'licencia');
    }
  }
  // 2.4 · Suscripciones HA (segundo nodo del par)
  const FAM_HA = {
    foundation: 'Suscripcion EdgeConnect Foundation HA',
    advanced: 'Suscripcion EdgeConnect Advanced HA',
  };
  for (const [nivel, familia] of Object.entries(FAM_HA)) {
    for (const bw of Object.values(arubaData.LICENSES_HA)) {
      const t = bw[nivel];
      // Foundation HA solo tiene 3 tiers (misma restricción que LICENSES): se omite.
      if (!t) continue;
      for (const y of ['y1', 'y3', 'y5']) push(t.sku[y], familia, t[y], 'licencia-ha');
    }
  }
  // 2.5 · Boost (SaaS y On-Premises, bloques 100M y 10G)
  const FAM_BOOST = { saas: 'Boost EdgeConnect (SaaS)', onprem: 'Boost EdgeConnect (On-Premises)' };
  for (const [via, familia] of Object.entries(FAM_BOOST)) {
    for (const bloque of Object.values(arubaData.BOOST[via])) {
      for (const y of ['y1', 'y3', 'y5']) push(bloque.sku[y], familia, bloque[y], 'boost');
    }
  }
  // 2.6 · Central para gateways 70xx/90xx
  for (const tier of Object.values(arubaData.CENTRAL_TIERS)) {
    for (const y of ['y1', 'y3', 'y5']) push(tier.sku[y], 'Central (gateways 70xx/90xx)', tier[y], 'central');
  }
  // 2.7 · Licencias perpetuas de capacidad (9240 Silver/Gold)
  for (const m of arubaData.MODELS) {
    for (const c of m.licCap || []) push(c.sku, m.id, c.elp ?? null, 'capacidad');
  }
  // 2.8 · Remanufacturados legacy (7000/7200)
  for (const m of arubaData.MODELS) {
    if (esLineaActual(m.id)) continue;
    for (const s of m.skus || []) if (s.sku) push(s.sku, m.id, null, 'legacy-reman');
  }
  // 2.9 · Catálogo maestro de accesorios
  for (const [sku, a] of Object.entries(arubaData.ARUBA_ACCESSORY_CATALOG)) {
    push(sku, 'Accesorios EdgeConnect y gateways', a.listPrice, 'accesorio');
  }
  return roster;
}

// ── 3 · Diff: lista oficial vs estado del repo ───────────────────────────────
const PATRONES_NUEVOS = {
  edgeconnect: /edgeconnect|\bsd-wan\b/i,
  opticas: /\bSFP28?\b|\bSFP\+\b|\bXCVR\b|\bDAC\b|transceiver/i,
  gateways: /\b(9004|9012|9106|9114|9240)\b/,
};

function comparar(roster, lista, csvActual) {
  const enRoster = new Set(roster.map((r) => r.sku));
  const diff = {
    preciosRepoVsLista: [], // repo desactualizado → corregir aruba.js a mano
    csvVsLista: [],         // el CSV regenerado difiere del vigente
    plcTransiciones: [],    // GA→ES u otros cambios de ciclo de vida
    ausentesEnLista: [],    // el repo los cotiza pero la lista ya no los trae
    nuevosCandidatos: { edgeconnect: [], opticas: [], gateways: [] },
  };

  const csvPorSku = new Map(csvActual.map((f) => [f.sku, f]));
  for (const r of roster) {
    const l = lista.get(r.sku);
    if (!l) { diff.ausentesEnLista.push({ sku: r.sku, familia: r.familia, origen: r.origen }); continue; }
    if (r.precioRepo !== null && r.precioRepo !== l.lp) {
      diff.preciosRepoVsLista.push({
        sku: r.sku, familia: r.familia, precioRepo: r.precioRepo, precioLista: l.lp, vigencia: l.vigencia,
      });
    }
    const csv = csvPorSku.get(r.sku);
    if (csv) {
      if (csv.p !== l.lp || csv.vig !== l.vigencia || csv.plc !== (l.plc || '')) {
        diff.csvVsLista.push({
          sku: r.sku, familia: r.familia,
          csv: { p: csv.p, vig: csv.vig, plc: csv.plc },
          lista: { p: l.lp, vig: l.vigencia, plc: l.plc || '' },
        });
      }
      if (csv.plc === 'GA' && l.plc && l.plc !== 'GA') {
        diff.plcTransiciones.push({ sku: r.sku, familia: r.familia, de: 'GA', a: l.plc, vigencia: l.vigencia });
      }
    }
  }

  // Candidatos nuevos: en la lista, fuera del roster, con pinta de SD-WAN Aruba.
  // Se reportan para decisión humana — JAMÁS entran solos al CSV.
  for (const [sku, l] of lista) {
    if (enRoster.has(sku)) continue;
    for (const [cubo, patron] of Object.entries(PATRONES_NUEVOS)) {
      if (patron.test(l.desc)) {
        diff.nuevosCandidatos[cubo].push({ sku, desc: l.desc, lp: l.lp, vigencia: l.vigencia, plc: l.plc });
        break; // un SKU solo aparece en el primer cubo que lo reclama
      }
    }
  }
  return diff;
}

// ── 4 · CSV: parseo del vigente y regeneración gobernada ────────────────────
function parsearCsv(ruta) {
  if (!fs.existsSync(ruta)) return [];
  return fs.readFileSync(ruta, 'utf8').split(/\r?\n/).filter((l) => l.trim() !== '')
    .slice(1) // cabecera
    .map((l) => {
      const [sku, mod, desc, p, vig, plc] = l.split(',');
      return { sku, mod, desc, p: Number(p), vig, plc: plc || '' };
    });
}

// Regenera el CSV desde la lista. Los SKU del roster ausentes de la lista
// conservan su fila vigente (y se reportan en el diff) — no se borran solos.
function generarCsv(roster, lista, csvActual) {
  const csvPorSku = new Map(csvActual.map((f) => [f.sku, f]));
  const filas = ['sku,modelo_dimensionador,descripcion_hpe,list_price_usd,vigencia_list_price,estado_plc'];
  for (const r of roster) {
    const l = lista.get(r.sku);
    const prev = csvPorSku.get(r.sku);
    const fila = l
      ? [r.sku, r.familia, l.desc, l.lp.toFixed(2), l.vigencia, l.plc || '']
      : [r.sku, r.familia, prev ? prev.desc || '' : '', prev ? prev.p.toFixed(2) : '', prev ? prev.vig : '', prev ? prev.plc : ''];
    // Guardarraíl de confidencialidad: ningún campo de salida puede contener
    // el separador de la lista ni rastro de las columnas prohibidas.
    for (const campo of fila) {
      if (/\||westcon|net price|pa number|discount/i.test(String(campo))) {
        throw new Error(`Guardarraíl de confidencialidad: campo sospechoso en la fila de ${r.sku}. Abortando.`);
      }
    }
    filas.push(fila.join(','));
  }
  return filas.join('\n') + '\n';
}

// ── 5 · CLI ──────────────────────────────────────────────────────────────────
function main(argv) {
  const args = argv.slice(2);
  const rutaLista = args.find((a) => !a.startsWith('--'));
  const aplicar = args.includes('--aplicar');
  const iJson = args.indexOf('--json');
  const rutaJson = iJson >= 0 ? args[iJson + 1] : null;
  if (!rutaLista) {
    console.error('Uso: node scripts/importar-lista-aruba.js <lista.txt> [--aplicar] [--json salida.json]');
    return 1;
  }

  const arubaData = require('../server/seed/legacyData/aruba');
  const { lista, filas, descartadas } = parsearLista(rutaLista);
  const roster = construirRoster(arubaData);
  const csvActual = parsearCsv(CSV_RUTA);
  const diff = comparar(roster, lista, csvActual);

  console.log(`Lista parseada: ${filas} filas, ${lista.size} SKU únicos (${descartadas} filas descartadas).`);
  console.log(`Roster del repo: ${roster.length} SKU cotizables.`);
  console.log('');
  console.log(`· Precios repo ≠ lista (corregir aruba.js a mano): ${diff.preciosRepoVsLista.length}`);
  for (const d of diff.preciosRepoVsLista) {
    console.log(`    ${d.sku} [${d.familia}] repo $${d.precioRepo} → lista $${d.precioLista} (vig. ${d.vigencia})`);
  }
  console.log(`· Filas del CSV que cambiarían: ${diff.csvVsLista.length}`);
  for (const d of diff.csvVsLista) {
    console.log(`    ${d.sku} [${d.familia}] $${d.csv.p}→$${d.lista.p} · ${d.csv.vig}→${d.lista.vig} · PLC ${d.csv.plc}→${d.lista.plc}`);
  }
  console.log(`· Transiciones de ciclo de vida (GA→…): ${diff.plcTransiciones.length}`);
  for (const d of diff.plcTransiciones) console.log(`    ${d.sku} [${d.familia}] GA → ${d.a} (vig. ${d.vigencia})`);
  console.log(`· SKU del roster ausentes de la lista: ${diff.ausentesEnLista.length}`);
  for (const d of diff.ausentesEnLista) console.log(`    ${d.sku} [${d.familia}] (${d.origen})`);
  console.log('· Candidatos nuevos en la lista (revisión humana — no entran solos):');
  for (const [cubo, items] of Object.entries(diff.nuevosCandidatos)) {
    console.log(`    ${cubo}: ${items.length}`);
    for (const it of items.slice(0, 40)) console.log(`      ${it.sku} — ${it.desc} — $${it.lp} (vig. ${it.vigencia}, PLC ${it.plc || 's/d'})`);
    if (items.length > 40) console.log(`      … y ${items.length - 40} más (ver --json)`);
  }

  if (rutaJson) {
    fs.writeFileSync(rutaJson, JSON.stringify({ generadoEn: new Date().toISOString(), diff }, null, 2));
    console.log(`\nDiff completo escrito en ${rutaJson}`);
  }

  const hayDiferencias = diff.preciosRepoVsLista.length + diff.csvVsLista.length
    + diff.plcTransiciones.length + diff.ausentesEnLista.length > 0;

  if (aplicar) {
    const csv = generarCsv(roster, lista, csvActual);
    fs.writeFileSync(CSV_RUTA, csv);
    console.log(`\nCSV regenerado con --aplicar: ${CSV_RUTA}`);
    console.log('Recuerda: los precios declarados en aruba.js NO los toca este script —');
    console.log('revísalos contra el diff y haz tu commit gobernado (el test de coherencia vigila).');
    return 0;
  }
  console.log('\nDry-run: no se escribió nada. Revisa el diff y relanza con --aplicar para regenerar el CSV.');
  return hayDiferencias ? 2 : 0;
}

if (require.main === module) process.exit(main(process.argv));

module.exports = { parsearLista, construirRoster, comparar, generarCsv, parsearCsv, CSV_RUTA, CABECERA_ESPERADA };
