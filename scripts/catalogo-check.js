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

const fs = require('fs');
const path = require('path');
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
  // Nokia faltaba entero hasta el 2026-09-03: este informe contaba SEIS fabricantes de siete,
  // asi que sus 18 modelos no aparecian ni como hueco. Un informe que omite un fabricante es
  // peor que no tenerlo, que es la misma razon por la que los precios se cuentan sobre
  // cotizadorCatalog y no sobre los MODELS de cada uno.
  //
  // Va en dos filas porque son dos catalogos con dos motores: `MODELS` es el fabric 7220 IXR
  // y `MODELS_ROUTER` la agregacion y el core. Se cuentan `cap` y `redund` y NADA MAS: en la
  // lista de routers, `configs` en null NO es un hueco -son los chasis modulares, que no
  // publican densidad y lo declaran-, asi que contarlo diria "9 de 14" e inventaria cinco
  // ausencias que no existen. Justo el informe que miente del que avisa la cabecera.
  'nokia (fabric)': { mod: 'nokia', lista: 'MODELS', campos: ['cap', 'redund'] },
  'nokia (agregacion/core)': { mod: 'nokia', lista: 'MODELS_ROUTER', campos: ['cap', 'redund'] },
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

/* ── PANTALLAS: un campo declarado que ya no existe ───────────────────────────
   QUE COMPRUEBA. Cada dimensionador le pasa a `ESTADO.vincular({campos})` la lista de ids
   cuyo valor viaja en el enlace compartido. Si alguien renombra o retira un control y no
   toca esa lista, el campo deja de reponerse: quien abre el enlace ve otro escenario. Aqui
   se cruza la lista declarada contra el `id=` del HTML de esa misma pagina.

   POR QUE HACIA FALTA. Los dos fallos del 2026-09-13 fueron de esta clase y el inventario
   no miraba nada de la capa de presentacion: el refactor de Aruba retiro `#bw` y dejo
   `pantallas.yml` en rojo cuatro dias, y la lista de parametros v1 solo la declaraba una
   pagina. Este informe mira el catalogo; esto mira que la pantalla y su estado sigan
   hablando del mismo control.

   POR QUE SE PARSEA Y NO SE EJECUTA. En `dimensionador-nokia-7220ixr.js` la llamada vive
   detras de un `await fetch(...)`, asi que cargar el modulo exigiria doblar la red y el DOM
   para leer un array literal. Se extrae el texto, y cuando `campos:` es un identificador —el
   `CAMPOS_ESCENARIO` de Aruba— se resuelve su declaracion en el mismo archivo.

   Y SI NO SE PUEDE LEER, SE DICE. Una pagina que no se sabe parsear se reporta como error,
   nunca se salta en silencio: un comprobador que no comprueba se porta igual que uno que
   pasa, que es como `CISCO_EOL_MODELS` vivio meses sin marcar nada. */

// Ids que NO estan en el HTML a proposito porque los crea un modulo compartido en tiempo de
// ejecucion. Cada excepcion trae el modulo y el ancla que debe seguir existiendo en el: si
// `ficha.js` dejara de construir ese `<select>`, la excepcion caducaria y este informe lo
// dice, en vez de seguir tapando un campo que ya no existe en ninguna parte.
//
// EL ANCLA VA COMPLETA, Y ESO SE APRENDIO SABOTEANDO. La primera version anclaba en
// `${cid}-sel`; al renombrar el control a `${cid}-selector` para comprobar que saltaba, NO
// salto — el ancla corta seguia siendo subcadena de la larga, asi que la excepcion se daba por
// viva sobre un control que ya no existia. Una excepcion que no sabe caducar tapa exactamente
// lo que este comprobador existe para encontrar, que es el conjunto inerte de siempre.
const TARDIOS = {
  'verdict-sel': {
    modulo: 'public/js/ficha.js',
    // El ancla lleva `${cid}` a proposito: es el TEXTO FUENTE de la plantilla de ficha.js,
    // no una interpolacion que se olvido de escribir con backticks.
    // eslint-disable-next-line no-template-curly-in-string
    ancla: '<select id="${cid}-sel">',
    porque: 'lo pinta ficha.js despues del primer render (el desplegable de equipo)',
  },
};

function camposDeclarados(src) {
  const m = src.match(/ESTADO\.vincular\(\s*\{[\s\S]{0,160}?campos:\s*(\[[\s\S]*?\]|[A-Za-z_$][\w$]*)/);
  if (!m) return { error: 'no se encontro la llamada a ESTADO.vincular({campos:...})' };
  let bruto = m[1];
  if (!bruto.startsWith('[')) {
    const decl = src.match(new RegExp(`(?:const|let|var)\\s+${bruto}\\s*=\\s*(\\[[\\s\\S]*?\\])\\s*;`));
    if (!decl) return { error: `campos apunta a "${bruto}" y no se encontro su declaracion en el mismo archivo` };
    bruto = decl[1];
  }
  const ids = [...bruto.matchAll(/['"]([^'"]+)['"]/g)].map((x) => x[1]);
  if (!ids.length) return { error: 'la lista de campos se leyo vacia' };
  return { ids };
}

function pantallas() {
  const dirPublic = path.join(__dirname, '..', 'public');
  const archivos = fs.readdirSync(path.join(dirPublic, 'js'))
    .filter((f) => f.startsWith('dimensionador-') && f.endsWith('.js'))
    .sort();
  const filas = [];
  for (const archivo of archivos) {
    const pagina = archivo.replace(/\.js$/, '.html');
    const rutaHtml = path.join(dirPublic, pagina);
    if (!fs.existsSync(rutaHtml)) { filas.push({ pagina, error: 'no existe su HTML' }); continue; }
    const { ids, error } = camposDeclarados(fs.readFileSync(path.join(dirPublic, 'js', archivo), 'utf8'));
    if (error) { filas.push({ pagina, error }); continue; }
    const html = fs.readFileSync(rutaHtml, 'utf8');
    const enHtml = (id) => new RegExp(`id=["']${id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']`).test(html);
    const faltan = [];
    const tardios = [];
    for (const id of ids) {
      if (enHtml(id)) continue;
      const t = TARDIOS[id];
      if (!t) { faltan.push({ id, motivo: 'no existe ningun control con ese id' }); continue; }
      // La excepcion solo vale mientras su modulo siga creando el control.
      const mod = path.join(__dirname, '..', t.modulo);
      const vivo = fs.existsSync(mod) && fs.readFileSync(mod, 'utf8').includes(t.ancla);
      if (vivo) tardios.push(id);
      else faltan.push({ id, motivo: `se exceptuaba porque ${t.porque}, pero ${t.modulo} ya no lo crea` });
    }
    filas.push({ pagina, campos: ids.length, faltan, tardios });
  }
  return filas;
}

function procedencia() {
  const ahora = new Date();
  return vendors.map((v) => ({ vendor: v.code, fuentes: fuentesDe(v.code, ahora) }));
}

function informe() {
  return {
    cobertura: cobertura(), cicloDeVida: cicloDeVida(), precios: precios(),
    pantallas: pantallas(), procedencia: procedencia(),
  };
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
    console.log('\n== PANTALLAS: campos declarados que no existen ==');
    console.log('   Cada dimensionador declara en ESTADO.vincular({campos}) los ids que viajan en el');
    console.log('   enlace compartido. Uno que ya no exista deja de reponerse, y el enlace llega mudo.\n');
    let rotos = 0;
    for (const f of d.pantallas) {
      if (f.error) { rotos++; console.log(`[ERROR] ${f.pagina}  ${f.error}`); continue; }
      const tardios = f.tardios.length ? `  (${f.tardios.length} lo pinta un modulo)` : '';
      if (!f.faltan.length) { console.log(`[ok   ] ${f.pagina.padEnd(38)} ${String(f.campos).padStart(2)} campos${tardios}`); continue; }
      rotos++;
      console.log(`[ROTO ] ${f.pagina.padEnd(38)} ${String(f.campos).padStart(2)} campos${tardios}`);
      for (const x of f.faltan) console.log(`         ${x.id}: ${x.motivo}`);
    }
    console.log(rotos ? `\n${rotos} pantalla(s) con un campo declarado que no existe.` : '\nNinguna pantalla declara un campo que no exista.');
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

module.exports = { informe, cobertura, cicloDeVida, precios, pantallas, procedencia };
