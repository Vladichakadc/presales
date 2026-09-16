#!/usr/bin/env node
'use strict';
// Vigilancia de vigencia por QuickSpecs: avisa cuando un EdgeConnect del catalogo
// DESAPARECE de la guia de pedido oficial — la señal temprana y OFICIAL de un fin de
// venta, sin depender de agregadores de terceros.
//
// EL PROBLEMA QUE RESUELVE (2026-09-16, mejora propuesta y aceptada por el dueño)
// La validacion del EC-XS se hizo a mano: los agregadores decian EoS 31-ene-2026 y las
// QuickSpecs oficiales V18 (06-jul-2026) lo seguian listando ordenable — la fuente
// oficial desmonto la señal de terceros. Ese cruce no puede depender de que alguien
// vuelva a mirar: cuando `npm run datasheets -- --force` refresque el PDF (tipicamente
// porque `npm run vigia` aviso de que el documento cambio), este script dice QUE CAMBIO
// en terminos de ordenabilidad, modelo a modelo.
//
//     npm run vigencia                cruza y reporta
//     npm run vigencia -- --json      la misma salida como JSON, para CI
//
// QUE HACE Y QUE NO HACE
// · LEE la copia local de las QuickSpecs (public/datasheets/edgeconnect-quickspecs.pdf)
//   y busca el `hwSku` de cada modelo EdgeConnect en la seccion «Configuration
//   Information» (la guia de pedido). NO sale a internet: corre igual en este entorno
//   que en CI, porque el documento oficial viaja CON el repositorio.
// · NO escribe nada en el catalogo. Una alarma es una orden de revisar el boletin
//   oficial a mano — la marca de fin de venta sigue entrando solo por documento del
//   fabricante, con su cita literal (ver EOL_ANNOUNCED en aruba.js). Automatizar la
//   marca seria automatizar el juicio, y eso aqui no se hace.
// · NO extrae tablas: solo comprueba presencia/ausencia de un SKU, que es binario y
//   verificable. La lectura de filas desplazadas es justo lo que este repositorio no
//   automatiza (ver vigia-fuentes.js).
//
// LOS TRES ESTADOS DE UN MODELO, Y LAS DOS CLASES DE HALLAZGO
//   ordenable   el SKU (base u opcion #) figura en la guia de pedido
//   mencionado  solo figura fuera de ella (p. ej. la tabla comparativa): no consta
//               como ordenable — el tercer estado de siempre, no un ausente
//   ausente     no figura en todo el documento
// · ALARMA (sale con codigo 1): mencionado/ausente SIN boletin de fin de venta en el
//   catalogo — posible fin de venta no documentado. Hoy: ninguno; maniana es la señal.
// · NOTA (informativa, codigo 0): ausente CON boletin (consistente), u ordenable CON
//   boletin vencido (HPE mantiene la variante NoLoc tras el ultimo pedido — patron
//   observado con S0B67A en la V18; se vigila la proxima revision).
//
// ALCANCE DECLARADO. Solo modelos fam 'ec' con hwSku: las QuickSpecs de EdgeConnect no
// cubren los gateways de campus (fam 'gw' — sus guias son otros documentos, ver
// DATASHEETS.gw9000/gw9100/gw9200Qs) ni los virtuales/sin SKU (EC-V, series 7000/7200).
// Extenderlo es una mejora futura con el mismo patron, no un hueco silencioso.

const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');
const { MODELS, DATASHEETS } = require('../server/seed/legacyData/aruba');

const PDF = path.join(__dirname, '..', 'public', 'datasheets', DATASHEETS.ecQuickspecs.file);
const JSON_OUT = process.argv.slice(2).includes('--json');

// Las marcas que delimitan la guia de pedido dentro del texto extraido. Si el documento
// cambia de forma, el script falla declarandolo (codigo 2) antes que cruzar contra la
// region equivocada — un verde falso por seccion movida seria peor que ningun cruce.
const MARCA_GUIA = 'Configuration Information';
const MARCA_FIN = 'Technical Specifications';

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

async function informe() {
  if (!fs.existsSync(PDF)) {
    throw new Error(`no esta la copia local de las QuickSpecs (${path.relative(process.cwd(), PDF)}) — descargala con npm run datasheets`);
  }
  const datos = await parsearPdf(fs.readFileSync(PDF));
  const texto = datos.text || '';
  const iGuia = texto.indexOf(MARCA_GUIA);
  const iFin = texto.indexOf(MARCA_FIN);
  if (iGuia < 0 || iFin < 0 || iFin <= iGuia) {
    throw new Error(`las QuickSpecs ya no tienen la forma esperada («${MARCA_GUIA}» / «${MARCA_FIN}») — revisar el documento antes de cruzar`);
  }
  const guia = texto.slice(iGuia, iFin);

  const modelos = [];
  const sinSku = [];
  for (const m of MODELS) {
    if (m.fam !== 'ec') continue; // gateways de campus: otras guias, alcance declarado
    if (!m.hwSku) { sinSku.push(m.id); continue; }
    // La opcion «#AC3» (NoLoc) cuelga del SKU base: basta la presencia del base.
    const presencia = guia.includes(m.hwSku) ? 'ordenable'
      : texto.includes(m.hwSku) ? 'mencionado' : 'ausente';
    modelos.push({ id: m.id, sku: m.hwSku, presencia, ...clasificar(presencia, m.eolAnnounced) });
  }

  const alarmas = modelos.filter((x) => x.veredicto === 'alarma');
  const notas = modelos.filter((x) => x.veredicto === 'nota');
  return {
    fuente: {
      documento: DATASHEETS.ecQuickspecs.n,
      archivo: path.relative(process.cwd(), PDF),
      titulo: (datos.info && datos.info.Title) || null,
      creado: fechaDelPdf(datos.info && datos.info.CreationDate),
      url: DATASHEETS.ecQuickspecs.url,
    },
    modelos,
    fueraDeAlcance: {
      sinSku,
      gateways: MODELS.filter((m) => m.fam === 'gw').map((m) => m.id),
      motivo: 'las QuickSpecs de EdgeConnect no cubren gateways de campus ni modelos sin SKU hardware',
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
  console.log(`Fuente: ${d.fuente.documento} — ${d.fuente.titulo || 'sin titulo'}`
    + `${d.fuente.creado ? `, creado ${d.fuente.creado}` : ''} (${d.fuente.archivo})`);
  console.log('');
  for (const m of d.modelos) {
    const marca = m.veredicto === 'alarma' ? '✖ ALARMA' : m.veredicto === 'nota' ? '⚠ nota' : '✔';
    console.log(`  ${marca}  ${m.id.padEnd(10)} ${m.sku.padEnd(8)} ${m.detalle}`);
  }
  console.log('');
  console.log(`  Alcance: ${d.resumen.cotejados} EdgeConnect con SKU cotejados; `
    + `sin SKU (${d.fueraDeAlcance.sinSku.join(', ') || 'ninguno'}) y gateways de campus `
    + `(${d.fueraDeAlcance.gateways.length}) quedan fuera — ${d.fueraDeAlcance.motivo}.`);
  console.log('');
  if (d.resumen.alarmas) {
    console.log(`  ${d.resumen.alarmas} ALARMA(S): revisar el boletin oficial de fin de venta a mano. `
      + 'La marca no entra sola — entra por documento del fabricante, con su cita.');
  } else {
    console.log('  Sin alarmas: todo EdgeConnect sin boletin sigue ordenable en la guia oficial.');
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

module.exports = { informe, clasificar, fechaDelPdf, MARCA_GUIA, MARCA_FIN };
