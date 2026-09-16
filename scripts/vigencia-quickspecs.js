#!/usr/bin/env node
'use strict';
// Vigilancia de vigencia por guias de pedido oficiales: avisa cuando un modelo del
// catalogo DESAPARECE de su guia oficial — la señal temprana y OFICIAL de un fin de
// venta, sin depender de agregadores de terceros.
//
// EL PROBLEMA QUE RESUELVE (2026-09-16, mejora propuesta y aceptada por el dueño)
// La validacion del EC-XS se hizo a mano: los agregadores decian EoS 31-ene-2026 y las
// QuickSpecs oficiales V18 (06-jul-2026) lo seguian listando ordenable — la fuente
// oficial desmonto la señal de terceros. Ese cruce no puede depender de que alguien
// vuelva a mirar: cuando `npm run datasheets -- --force` refresque un PDF (tipicamente
// porque `npm run vigia` aviso de que el documento cambio), este script dice QUE CAMBIO
// en terminos de ordenabilidad, modelo a modelo.
//
//     npm run vigencia                cruza y reporta
//     npm run vigencia -- --json      la misma salida como JSON, para CI
//
// QUE HACE Y QUE NO HACE
// · LEE las copias locales de las guias oficiales (public/datasheets/*.pdf) y busca el
//   `hwSku` de cada modelo cubierto en la seccion de pedido de SU guia. NO sale a
//   internet: corre igual en este entorno que en CI, porque los documentos oficiales
//   viajan CON el repositorio.
// · NO escribe nada en el catalogo. Una alarma es una orden de revisar el boletin
//   oficial a mano — la marca de fin de venta sigue entrando solo por documento del
//   fabricante, con su cita literal (ver EOL_ANNOUNCED en aruba.js). Automatizar la
//   marca seria automatizar el juicio, y eso aqui no se hace.
// · NO extrae tablas: solo comprueba presencia/ausencia de un SKU, que es binario y
//   verificable. La lectura de filas desplazadas es justo lo que este repositorio no
//   automatiza (ver vigia-fuentes.js).
//
// LOS TRES ESTADOS DE UN MODELO, Y LAS DOS CLASES DE HALLAZGO
//   ordenable   el SKU (base u opcion #) figura en la seccion de pedido de su guia
//   mencionado  solo figura fuera de ella (p. ej. la tabla comparativa): no consta
//               como ordenable — el tercer estado de siempre, no un ausente
//   ausente     no figura en todo el documento
// · ALARMA (sale con codigo 1): mencionado/ausente SIN boletin de fin de venta en el
//   catalogo — posible fin de venta no documentado. Hoy: ninguno; maniana es la señal.
// · NOTA (informativa, codigo 0): ausente CON boletin (consistente), u ordenable CON
//   boletin vencido (HPE mantiene la variante NoLoc tras el ultimo pedido — patron
//   observado con S0B67A en la V18; se vigila la proxima revision).
//
// ALCANCE (ampliado 2026-09-17, primer pendiente accionable de la lista del dueño)
// Cada familia se cruza contra SU guia oficial, porque ningun documento cubre dos:
// · EdgeConnect SD-WAN (fam 'ec')  → QuickSpecs EdgeConnect (a50004289enw)
// · Gateways serie 9000            → guia de pedidos PSNow (a00067607enw): el documento
//   entero ES la guia («Ordering guide»), sin seccion «Configuration Information».
// · Gateways serie 9100            → QuickSpecs 9100 Hybrid (a50006999enw)
// · Gateway 9240 (serie 9200)      → QuickSpecs CX 9240 (a50004272enw)
// Quedan fuera, declarado: modelos sin SKU hardware (EC-V — se licencia, no se pide
// chasis) y las series legacy 7000/7200 (sin hwSku en el catalogo; sus guias no estan
// en el repo). Un modelo con hwSku que no case con NINGUNA fuente rompe el cruce con
// codigo 2 — un verde silencioso por modelo huerfano seria peor que ningun cruce.

const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');
const { MODELS, DATASHEETS } = require('../server/seed/legacyData/aruba');

const JSON_OUT = process.argv.slice(2).includes('--json');

// Las fuentes oficiales y a que modelos cubre cada una. `marcaGuia`/`marcaFin`
// delimitan la seccion de pedido dentro del texto extraido; `marcaFin: null` significa
// «hasta el final del documento» (la guia PSNow de la serie 9000 es toda ella de
// pedidos). Si un documento cambia de forma, el script falla declarandolo (codigo 2)
// antes que cruzar contra la region equivocada — un verde falso por seccion movida
// seria peor que ningun cruce.
const FUENTES = [
  {
    clave: 'ecQuickspecs',
    marcaGuia: 'Configuration Information',
    marcaFin: 'Technical Specifications',
    cubre: (m) => m.fam === 'ec' && !!m.hwSku,
  },
  {
    clave: 'gw9000Psnow',
    marcaGuia: 'Ordering guide',
    marcaFin: null, // el documento entero es la guia de pedidos (7 pp, a00067607enw)
    cubre: (m) => m.fam === 'gw' && /^Gateway 90/.test(m.id) && !!m.hwSku,
  },
  {
    clave: 'gw9100',
    marcaGuia: 'Configuration Information',
    marcaFin: 'Technical Specifications',
    cubre: (m) => m.fam === 'gw' && /^Gateway 91/.test(m.id) && !!m.hwSku,
  },
  {
    clave: 'gw9200Qs',
    marcaGuia: 'Configuration Information',
    marcaFin: 'Technical Specifications',
    cubre: (m) => m.fam === 'gw' && /^Gateway 92/.test(m.id) && !!m.hwSku,
  },
];

// La fuente de un modelo, o null si ninguna lo cubre. Un modelo CON hwSku sin fuente
// es un agujero del cruce: se declara en el informe y rompe la ejecucion (codigo 2).
function fuenteDe(m) {
  return FUENTES.find((f) => f.cubre(m)) || null;
}

// La fecha de creacion del PDF viene en formato «D:YYYYMMDDHHmmSS±HH'mm'»; la version
// legible (V18, 06-jul-2026) vive en un campo que pdf.js no expone, asi que se declara
// lo que si se puede leer: titulo y fecha.
function fechaDelPdf(cruda) {
  const m = /^D:(\d{4})(\d{2})(\d{2})/.exec(cruda || '');
  return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
}

// Clasificacion pura: dado donde aparece el SKU y si el modelo trae boletin, devuelve
// el veredicto. Separada de la lectura del PDF para que el test la fije sin documento.
function clasificar(presencia, eolAnnounced) {
  const conBoletin = !!eolAnnounced;
  if (presencia === 'ordenable') {
    if (conBoletin) {
      return { veredicto: 'nota',
        detalle: `ordenable pese al boletin (ultimo pedido ${eolAnnounced.lastOrder}): la guia aun lista una variante — vigilar la proxima revision` };
    }
    return { veredicto: 'ok', detalle: 'ordenable en la guia de pedido' };
  }
  if (conBoletin) {
    return { veredicto: 'nota',
      detalle: `${presencia} del documento y con boletin (ultimo pedido ${eolAnnounced.lastOrder}): consistente` };
  }
  return { veredicto: 'alarma',
    detalle: `${presencia} de la guia de pedido oficial SIN boletin en el catalogo — posible fin de venta no documentado: revisar el boletin oficial a mano` };
}

// pdf.js escribe sus avisos de fuentes («Warning: TT: undefined function…») en STDOUT,
// no en stderr: sin este filtro, `--json` llevaria una linea basura delante y CI no
// podria parsearlo. Se tragan solo esas lineas y solo mientras dura el parseo — el
// resto de la salida del proceso no se toca.
async function parsearPdf(buf) {
  const original = process.stdout.write.bind(process.stdout);
  process.stdout.write = (chunk, ...rest) => {
    if (String(chunk).startsWith('Warning:')) return true;
    return original(chunk, ...rest);
  };
  try {
    return await pdf(buf);
  } finally {
    process.stdout.write = original;
  }
}

// Lee y delimita la seccion de pedido de una fuente. Cache por clave: un mismo PDF no
// se parsea dos veces aunque cubra varios modelos.
async function cargarFuente(fuente, cache) {
  if (cache.has(fuente.clave)) return cache.get(fuente.clave);
  const meta = DATASHEETS[fuente.clave];
  const archivo = path.join(__dirname, '..', 'public', 'datasheets', meta.file);
  if (!fs.existsSync(archivo)) {
    throw new Error(`no esta la copia local de ${meta.n} (${path.relative(process.cwd(), archivo)}) — descargala con npm run datasheets`);
  }
  const datos = await parsearPdf(fs.readFileSync(archivo));
  const texto = datos.text || '';
  const iGuia = texto.indexOf(fuente.marcaGuia);
  const iFin = fuente.marcaFin ? texto.indexOf(fuente.marcaFin) : texto.length;
  if (iGuia < 0 || iFin <= iGuia) {
    throw new Error(`${meta.n} ya no tiene la forma esperada («${fuente.marcaGuia}»${fuente.marcaFin ? ` / «${fuente.marcaFin}»` : ''}) — revisar el documento antes de cruzar`);
  }
  const cargada = {
    guia: texto.slice(iGuia, iFin),
    texto,
    meta: {
      clave: fuente.clave,
      documento: meta.n,
      archivo: path.relative(process.cwd(), archivo),
      titulo: (datos.info && datos.info.Title) || null,
      creado: fechaDelPdf(datos.info && datos.info.CreationDate),
      url: meta.url,
    },
  };
  cache.set(fuente.clave, cargada);
  return cargada;
}

async function informe() {
  const cache = new Map();
  const modelos = [];
  const sinSku = [];
  const sinFuente = [];
  const fuentesUsadas = new Map();

  for (const m of MODELS) {
    if (!m.hwSku) { sinSku.push(m.id); continue; } // EC-V, series 7000/7200: nada que buscar
    const fuente = fuenteDe(m);
    if (!fuente) { sinFuente.push(m.id); continue; }
    const f = await cargarFuente(fuente, cache);
    fuentesUsadas.set(fuente.clave, f.meta);
    // La opcion «#AC3» (NoLoc) cuelga del SKU base: basta la presencia del base.
    const presencia = f.guia.includes(m.hwSku) ? 'ordenable'
      : f.texto.includes(m.hwSku) ? 'mencionado' : 'ausente';
    modelos.push({ id: m.id, sku: m.hwSku, fuente: fuente.clave, presencia, ...clasificar(presencia, m.eolAnnounced) });
  }

  if (sinFuente.length) {
    throw new Error(`modelos con SKU hardware sin guia asignada: ${sinFuente.join(', ')} — declarar su fuente en FUENTES antes de cruzar`);
  }

  const alarmas = modelos.filter((x) => x.veredicto === 'alarma');
  const notas = modelos.filter((x) => x.veredicto === 'nota');
  return {
    fuentes: [...fuentesUsadas.values()],
    modelos,
    fueraDeAlcance: {
      sinSku,
      motivo: 'sin SKU hardware que buscar (EC-V se licencia por software; series 7000/7200 legacy sin SKU en el catalogo)',
    },
    resumen: {
      cotejados: modelos.length,
      ordenables: modelos.filter((x) => x.presencia === 'ordenable').length,
      notas: notas.length,
      alarmas: alarmas.length,
    },
  };
}

function imprimir(d) {
  const porFuente = new Map();
  for (const m of d.modelos) {
    if (!porFuente.has(m.fuente)) porFuente.set(m.fuente, []);
    porFuente.get(m.fuente).push(m);
  }
  for (const f of d.fuentes) {
    console.log(`Fuente: ${f.documento} — ${f.titulo || 'sin titulo'}`
      + `${f.creado ? `, creado ${f.creado}` : ''} (${f.archivo})`);
    for (const m of porFuente.get(f.clave) || []) {
      const marca = m.veredicto === 'alarma' ? '✖ ALARMA' : m.veredicto === 'nota' ? '⚠ nota' : '✔';
      console.log(`  ${marca}  ${m.id.padEnd(17)} ${m.sku.padEnd(8)} ${m.detalle}`);
    }
    console.log('');
  }
  console.log(`  Alcance: ${d.resumen.cotejados} modelos con SKU cotejados en ${d.fuentes.length} guias oficiales; `
    + `sin SKU (${d.fueraDeAlcance.sinSku.join(', ') || 'ninguno'}) quedan fuera — ${d.fueraDeAlcance.motivo}.`);
  console.log('');
  if (d.resumen.alarmas) {
    console.log(`  ${d.resumen.alarmas} ALARMA(S): revisar el boletin oficial de fin de venta a mano. `
      + 'La marca no entra sola — entra por documento del fabricante, con su cita.');
  } else {
    console.log('  Sin alarmas: todo modelo sin boletin sigue ordenable en su guia oficial.');
  }
}

if (require.main === module) {
  informe()
    .then((d) => {
      if (JSON_OUT) console.log(JSON.stringify(d, null, 2));
      else imprimir(d);
      process.exit(d.resumen.alarmas ? 1 : 0);
    })
    .catch((e) => { console.error(`[vigencia] ${e.message}`); process.exit(2); });
}

module.exports = { informe, clasificar, fechaDelPdf, fuenteDe, FUENTES };
