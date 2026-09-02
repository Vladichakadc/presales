#!/usr/bin/env node
'use strict';
// Inventario del catalogo: que falta, en que fabricante y en cuantos modelos.
//
// POR QUE EXISTE
// `npm run cps -- --check` y `npm run juniper -- --check` ya hacian esto, cada uno para su
// fabricante. Pero eran los dos unicos: para los otros cinco no habia forma de saber cuantos
// huecos hay sin abrir el archivo y contar a ojo. Este script generaliza esa idea a los seis
// catalogos y anade lo que ninguno miraba — la procedencia y su antiguedad, y los avisos de
// fin de venta cuya fecha ya paso.
//
//     npm run catalogo                cobertura de campos, ciclo de vida y procedencia
//     npm run catalogo -- --fuentes   solo la procedencia
//     npm run catalogo -- --json      la misma informacion como JSON, para CI
//
// NO SALE A INTERNET. Solo lee los archivos de server/seed/legacyData/, asi que corre igual
// dentro de este entorno (donde los dominios de los fabricantes estan bloqueados por egreso)
// que fuera. Sirve para saber que ir a buscar ANTES de abrir un documento de cien paginas.
//
// COMO LEER LA SALIDA. Un campo en `null` significa "el catalogo no trae el dato", nunca
// "el equipo no lo tiene": el motor no filtra por un eje sin dato y la ficha lo declara. Que
// un porcentaje sea bajo no es un fallo del codigo, es un hueco del catalogo — y saber
// exactamente cual es el punto de este comando.

const { fuentesDe, ANTIGUEDAD_AVISO_MESES } = require('../server/seed/legacyData/fuentes');
const vendors = require('../server/seed/legacyData/vendors');

const args = process.argv.slice(2);
const JSON_OUT = args.includes('--json');
const SOLO_FUENTES = args.includes('--fuentes');

// Campos que se inventarian por fabricante. Solo los que el motor usa para dimensionar o
// cotizar: contar la cobertura de un campo decorativo no ayuda a nadie.
const CAMPOS = {
  huawei: { mod: 'huawei', lista: 'MODELS', campos: ['fwd', 'ipsec', 'typ', 'mpps', 'redund'] },
  cisco: { mod: 'cisco', lista: 'MODELS', campos: ['ipsec', 'sdwan', 'redund'] },
  fortinet: { mod: 'fortinet', lista: 'MODELS', campos: ['fw', 'tp', 'vpn', 'sess', 'cps', 'redund'] },
  mikrotik: { mod: 'mikrotik', lista: 'MODELS', campos: ['fwd', 'ipsec', 'ram', 'cores', 'redund'] },
  aruba: { mod: 'aruba', lista: 'MODELS', campos: ['redund'] },
  juniper: { mod: 'juniper', lista: 'MODELS', campos: ['fw', 'fwImix', 'vpn', 'ips', 'atp', 'sess', 'redund'] },
};

function cargar(nombre) {
  try {
    return require(`../server/seed/legacyData/${nombre}`);
  } catch {
    return null;
  }
}

// Un campo cuenta como presente si no es null ni undefined. `false` SI cuenta: en `redund`
// es un hecho verificado ("fuente unica"), no una ausencia — es justo la distincion de tres
// estados que ficha.js protege.
const tieneDato = (v) => v !== null && v !== undefined;

function cobertura() {
  const filas = [];
  for (const [vendor, cfg] of Object.entries(CAMPOS)) {
    const mod = cargar(cfg.mod);
    const modelos = mod && Array.isArray(mod[cfg.lista]) ? mod[cfg.lista] : null;
    if (!modelos) { filas.push({ vendor, error: `no se pudo leer ${cfg.mod}.${cfg.lista}` }); continue; }
    const campos = {};
    for (const campo of cfg.campos) {
      const con = modelos.filter((m) => tieneDato(m[campo])).length;
      campos[campo] = { con, de: modelos.length, pct: Math.round((con / modelos.length) * 100) };
    }
    filas.push({ vendor, modelos: modelos.length, campos });
  }
  return filas;
}

// Fin de venta: cuantos modelos estan marcados y cuantos avisos ya vencieron. Un boletin con
// la fecha de ultimo pedido pasada no es un error — ficha.js lo degrada solo — pero conviene
// verlo, porque significa que ese equipo ya no se propone.
function cicloDeVida() {
  const hoy = new Date().toISOString().slice(0, 10);
  const filas = [];
  for (const [vendor, cfg] of Object.entries(CAMPOS)) {
    const mod = cargar(cfg.mod);
    const modelos = mod && Array.isArray(mod[cfg.lista]) ? mod[cfg.lista] : [];
    if (!modelos.length) continue;
    const eol = modelos.filter((m) => m.eol === true).length;
    const anunciados = modelos.filter((m) => m.eolAnnounced);
    const vencidos = anunciados.filter((m) => m.eolAnnounced.lastOrder && m.eolAnnounced.lastOrder < hoy);
    filas.push({ vendor, modelos: modelos.length, eol, anunciados: anunciados.length, vencidos: vencidos.length });
  }
  return filas;
}

// Precios: cuantos equipos cotizables van sin cifra.
//
// Se cuenta sobre cotizadorCatalog.js y NO sobre los MODELS de cada fabricante, porque ese
// archivo es la fuente autoritativa de "que se puede cotizar" — los MODELS de los
// dimensionadores incluyen equipos de referencia que nunca llevaron precio. Contarlo alli
// daba "Fortinet 0/58 sin cotizar" justo del unico fabricante con lista de precios firmada:
// un informe que miente es peor que no tenerlo.
//
// Aruba va entera sin cotizar a proposito (no hay price list) y el BOM lo declara, en vez de
// inventar importes.
function precios() {
  const filas = require('../server/seed/legacyData/cotizadorCatalog');
  const porVendor = new Map();
  for (const row of filas) {
    const v = String(row.vendor || '').toLowerCase();
    if (!porVendor.has(v)) porVendor.set(v, { vendor: v, con: 0, de: 0 });
    const acc = porVendor.get(v);
    acc.de++;
    if (tieneDato(row.elpN) && row.elpN > 0) acc.con++;
  }
  return [...porVendor.values()]
    .map((a) => ({ ...a, sinCotizar: a.de - a.con }))
    .sort((a, b) => a.vendor.localeCompare(b.vendor));
}

function procedencia() {
  const ahora = new Date();
  return vendors.map((v) => ({ vendor: v.code, fuentes: fuentesDe(v.code, ahora) }));
}

function informe() {
  return { cobertura: cobertura(), cicloDeVida: cicloDeVida(), precios: precios(), procedencia: procedencia() };
}

function barra(pct) {
  const llenos = Math.round(pct / 10);
  return `${'#'.repeat(llenos)}${'.'.repeat(10 - llenos)}`;
}

function imprimir(d) {
  if (!SOLO_FUENTES) {
    console.log('\n== COBERTURA DE CAMPOS ==');
    console.log('   Un campo en null significa "el catalogo no trae el dato", no "el equipo no lo tiene".\n');
    for (const f of d.cobertura) {
      if (f.error) { console.log(`${f.vendor.padEnd(10)} ${f.error}`); continue; }
      console.log(`${f.vendor.padEnd(10)} ${String(f.modelos).padStart(3)} modelos`);
      for (const [campo, c] of Object.entries(f.campos)) {
        console.log(`   ${campo.padEnd(8)} ${barra(c.pct)} ${String(c.pct).padStart(3)}%  ${c.con}/${c.de}`);
      }
    }

    console.log('\n== CICLO DE VIDA ==');
    for (const f of d.cicloDeVida) {
      const vencidos = f.vencidos ? `  (${f.vencidos} con la fecha de ultimo pedido ya pasada)` : '';
      console.log(`${f.vendor.padEnd(10)} ${f.eol} fuera de venta, ${f.anunciados} con fin de venta anunciado${vencidos}`);
    }

    console.log('\n== PRECIOS (sobre el catalogo del cotizador) ==');
    for (const f of d.precios) {
      console.log(`${f.vendor.padEnd(10)} ${f.con}/${f.de} con precio, ${f.sinCotizar} sin cotizar`);
    }
  }

  console.log('\n== PROCEDENCIA ==');
  console.log(`   Se avisa a partir de ${ANTIGUEDAD_AVISO_MESES} meses. "sin fecha" no es "reciente".\n`);
  let piden = 0;
  for (const v of d.procedencia) {
    console.log(`${v.vendor}`);
    for (const f of v.fuentes) {
      if (f.estado !== 'vigente') piden++;
      const edad = f.meses === null ? 'sin fecha' : `${f.meses} mes(es)`;
      console.log(`   [${f.estado.padEnd(9)}] ${f.documento}  ·  ${edad}`);
    }
  }
  console.log(`\n${piden} fuente(s) piden revision.\n`);
}

if (require.main === module) {
  const d = informe();
  if (JSON_OUT) console.log(JSON.stringify(d, null, 2));
  else imprimir(d);
}

module.exports = { informe, cobertura, cicloDeVida, precios, procedencia };
