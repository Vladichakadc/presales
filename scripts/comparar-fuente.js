#!/usr/bin/env node
'use strict';
// COMPARA UNA RAMA DE TRANSPORTE (fuente/*) CON LA COPIA ANTERIOR DE CADA DOCUMENTO
// (2026-11-09, mejora aprobada por el dueño al cerrar el PR #154).
//
// POR QUE. Revisar un pendiente «que espera un documento oficial» es volver a traerlo por Actions
// y ver si cambió. Eso se hacía a mano: buscar en qué rama fuente/* estaba la copia anterior,
// comparar los blobs, sacar el texto de los PDF y leer el diff. Media hora de comandos, y fácil
// dejarse algo: el 2026-11-09 la ficha del 7250 IXR-R había pasado a nombrar MACsec y el
// repositorio seguía diciendo que no. Este script hace esa pasada en una línea.
//
// QUE DICE DE CADA DOCUMENTO que la rama trae y main no:
//   IGUAL      el mismo archivo, byte a byte, que la copia anterior.
//   BYTES      cambia el archivo y no su texto (una marca rotatoria, otro empaquetado del PDF).
//   TEXTO      cambia el texto. SIEMPRE enseña las líneas que cambian (+ nuevas, − retiradas),
//              nunca solo el veredicto: una limpieza de texto demasiado agresiva podría esconder
//              un cambio real, y la línea a la vista es lo que deja comprobarlo.
//   NUEVO      ninguna otra rama fuente/* trae un documento con ese nombre.
//   SIN-TEXTO  bytes distintos y el texto no se pudo leer: «no se sabe», nunca «no cambió».
//
// EL TEXTO DE UN HTML ES EL DEL VIGIA (`textoNormalizado` de vigia-fuentes.js): una sola regla
// decide si «cambió el texto», aquí y cada lunes. El de un PDF lo saca pdf-parse; el corte de
// línea no cuenta (una edición nueva recoloca los párrafos): una línea solo se enseña si su
// texto no está, seguido, en el otro documento.
//
// SOLO LEE: ni escribe en legacyData/ ni decide nada. Un cambio de texto lo mira una persona.
//
//   node scripts/comparar-fuente.js <rama> [--buscar=<regex>] [--lineas=N] [--solo=a,b] [--sin-traer] [--anotaciones]
//     <rama>       fuente/pendientes-2-2026-11-09 (con o sin el prefijo origin/)
//     --buscar     cuenta las apariciones de la expresión antes y ahora (p. ej. --buscar=FWF-50G-5G-II)
//     --lineas     cuántas líneas enseñar por lado en un TEXTO (12; 0 = todas)
//     --solo       solo estos archivos, por nombre
//     --sin-traer  no hace git fetch de las ramas fuente/* (usa las que ya hay en local)
//     --anotaciones  además, lo dice en anotaciones de Actions (job `comparar` del transporte) y no falla nunca
const { execFileSync } = require('child_process');
const path = require('path');
const { textoNormalizado } = require('./vigia-fuentes');

const RAIZ = path.join(__dirname, '..');
const git = (args, opciones = {}) => execFileSync('git', args, { cwd: RAIZ, maxBuffer: 256 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'], ...opciones });
const gitTexto = (args) => git(args).toString('utf8');

// El informe de la corrida no es un documento: cambia en cada una.
const NO_SON_DOCUMENTOS = new Set(['informe.json']);
const colapsar = (s) => String(s).replace(/\s+/g, ' ').trim();

const ENTIDADES = { nbsp: ' ', amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", '#39': "'" };
/* Las líneas de un HTML, para ENSEÑAR lo que cambia (el veredicto lo da `textoNormalizado`): un
   bloque que se cierra es un salto de línea. */
function lineasDeHtml(html) {
  return String(html)
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<br\s*\/?>|<\/(?:p|div|li|tr|td|th|h[1-6]|section|article|ul|ol|table|dt|dd|pre|button|a|span)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&(nbsp|amp|lt|gt|quot|apos|#39);/g, (_, e) => ENTIDADES[e])
    .split('\n').map(colapsar).filter(Boolean);
}
const lineasDeTexto = (texto) => String(texto).split('\n').map(colapsar).filter(Boolean);

/* Puro. Lo que cambia entre dos textos dados en líneas: `mas`, las líneas del nuevo cuyo texto no
   está seguido en el viejo; `menos`, al revés. El corte de línea no cuenta. `igual` es que el texto
   entero, sin contar espacios, es el mismo. Si no es igual y no sale ninguna línea, cambió el orden. */
function compararLineas(viejas, nuevas) {
  const todoViejo = colapsar(viejas.join(' '));
  const todoNuevo = colapsar(nuevas.join(' '));
  if (todoViejo === todoNuevo) return { igual: true, mas: [], menos: [], soloOrden: false };
  const unicas = (lineas, otro) => {
    const vistas = new Set();
    return lineas.filter((l) => (vistas.has(l) || otro.includes(l) ? false : vistas.add(l)));
  };
  const mas = unicas(nuevas, todoViejo);
  const menos = unicas(viejas, todoNuevo);
  return { igual: false, mas, menos, soloOrden: !mas.length && !menos.length };
}

/* Puro. El veredicto de un documento. `anterior` y `actual`: {blob, texto, lineas, sinTexto}.
   `texto` es el que decide (el del vigía en HTML, el colapsado en PDF); `lineas`, lo que se enseña. */
function clasificar(anterior, actual) {
  if (!anterior) return { estado: 'NUEVO' };
  if (anterior.blob === actual.blob) return { estado: 'IGUAL' };
  if (actual.sinTexto || anterior.sinTexto) return { estado: 'SIN-TEXTO', motivo: actual.sinTexto || anterior.sinTexto };
  if (anterior.texto === actual.texto) return { estado: 'BYTES' };
  const d = compararLineas(anterior.lineas, actual.lineas);
  // El texto que decide difiere: es TEXTO aunque las líneas no lo sepan enseñar.
  return { estado: 'TEXTO', mas: d.mas, menos: d.menos, soloOrden: d.igual || d.soloOrden };
}

/* Puro. La copia anterior de un documento: entre las ramas que lo traen, la más reciente que no
   sea la que se compara ni posterior a ella. `candidatas`: [{rama, fecha, ruta, blob}]. */
function elegirAnterior(candidatas, rama, fechaRama) {
  return candidatas
    .filter((c) => c.rama !== rama && c.fecha <= fechaRama)
    .sort((a, b) => b.fecha - a.fecha || a.rama.localeCompare(b.rama))[0] || null;
}

const cuenta = (texto, re) => (re ? (String(texto).match(re) || []).length : null);

/* El texto de un PDF: pdf-parse (la dependencia del repositorio) y, si no está instalada o no lo
   lee, `pdftotext` de Poppler si la máquina lo trae. Sin ninguno, «no se sabe» con su motivo. */
async function textoDePdf(buf) {
  const motivos = [];
  try {
    const { text } = await require('pdf-parse')(buf);
    return { texto: text };
  } catch (e) { motivos.push(e.code === 'MODULE_NOT_FOUND' ? 'falta pdf-parse (npm install)' : `pdf-parse no lo leyó (${String(e.message).split('\n')[0]})`); }
  try {
    return { texto: execFileSync('pdftotext', ['-q', '-', '-'], { input: buf, maxBuffer: 256 * 1024 * 1024, stdio: ['pipe', 'pipe', 'ignore'] }).toString('utf8') };
  } catch (e) { motivos.push(e.code === 'ENOENT' ? 'no hay pdftotext' : 'pdftotext no lo leyó'); }
  return { texto: null, motivo: motivos.join('; ') };
}

async function leer(ref, ruta, blob) {
  const buf = git(['cat-file', 'blob', blob]);
  if (/\.html?$/i.test(ruta)) {
    const html = buf.toString('utf8');
    return { blob, texto: textoNormalizado(buf, 'text/html'), lineas: lineasDeHtml(html), crudo: html };
  }
  if (/\.pdf$/i.test(ruta)) {
    const r = await textoDePdf(buf);
    return r.texto == null ? { blob, sinTexto: r.motivo } : { blob, texto: colapsar(r.texto), lineas: lineasDeTexto(r.texto), crudo: r.texto };
  }
  if (/\.(?:txt|json|csv|xml|md)$/i.test(ruta)) {
    const t = buf.toString('utf8');
    return { blob, texto: colapsar(t), lineas: lineasDeTexto(t), crudo: t };
  }
  return { blob, sinTexto: 'no es HTML, PDF ni texto' };
}

function argumentos(argv) {
  const o = { rama: null, lineas: 12, buscar: null, solo: null, traer: true, anotaciones: false };
  for (const a of argv) {
    if (a === '--sin-traer') o.traer = false;
    else if (a === '--anotaciones') o.anotaciones = true;
    else if (a.startsWith('--lineas=')) o.lineas = Math.max(0, parseInt(a.slice(9), 10) || 0);
    else if (a.startsWith('--buscar=')) o.buscar = new RegExp(a.slice(9), 'g');
    else if (a.startsWith('--solo=')) o.solo = new Set(a.slice(7).split(',').map((s) => s.trim()).filter(Boolean));
    else if (!a.startsWith('--') && !o.rama) o.rama = a.replace(/^origin\//, '');
    else throw new Error(`Argumento no reconocido: ${a}`);
  }
  if (!o.rama) throw new Error('Falta la rama: node scripts/comparar-fuente.js <fuente/…> [--buscar=<regex>] [--lineas=N] [--solo=a,b] [--sin-traer]');
  return o;
}

// rutas y blobs de un árbol: Map(ruta → blob)
function arbol(ref) {
  const m = new Map();
  for (const l of gitTexto(['ls-tree', '-r', ref]).split('\n')) {
    const x = /^\d+ blob ([0-9a-f]+)\t(.+)$/.exec(l);
    if (x) m.set(x[2], x[1]);
  }
  return m;
}

function pintar(fila, o) {
  const lineas = [];
  const ant = fila.anterior ? `  (anterior: ${fila.anterior.rama}, ${new Date(fila.anterior.fecha * 1000).toISOString().slice(0, 10)})` : '';
  const v = fila.veredicto;
  const nota = { IGUAL: '', NUEVO: '  sin copia anterior en ninguna rama fuente/*', BYTES: '  cambia el archivo, no su texto',
    'SIN-TEXTO': `  bytes distintos y sin texto que comparar: ${v.motivo}`,
    TEXTO: v.soloOrden ? '  el mismo texto en otro orden o con otro corte' : `  +${(v.mas || []).length} −${(v.menos || []).length}` }[v.estado];
  lineas.push(`${v.estado.padEnd(9)} ${fila.nombre}${nota}${ant}`);
  if (v.estado === 'TEXTO') {
    for (const [signo, lista] of [['+', v.mas], ['−', v.menos]]) {
      const tope = o.lineas === 0 ? lista.length : o.lineas;
      for (const l of lista.slice(0, tope)) lineas.push(`    ${signo} ${l.length > 220 ? `${l.slice(0, 220)}…` : l}`);
      if (lista.length > tope) lineas.push(`    ${signo} … y ${lista.length - tope} más (--lineas=0 las enseña todas)`);
    }
  }
  if (fila.buscar) lineas.push(`    buscar ${o.buscar}: antes ${fila.buscar.antes}, ahora ${fila.buscar.ahora}`);
  return lineas;
}

/* Puro. Lo que una corrida de Actions deja a la vista de una sesión, que de Actions solo lee las
   anotaciones (el proxy corta logs y resúmenes): UNA línea `::notice` con el recuento y un
   `::warning` por documento con TEXTO o SIN-TEXTO. GitHub enseña diez avisos por paso, así que del
   noveno en adelante van juntos en uno. Un SIN-TEXTO nunca va en el recuento como si nada: avisa. */
const TOPE_AVISOS = 9;
const escaparAnotacion = (t) => String(t).replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A');
function anotaciones(filas, rama) {
  const recuento = {};
  for (const f of filas) recuento[f.veredicto.estado] = (recuento[f.veredicto.estado] || 0) + 1;
  const orden = ['IGUAL', 'BYTES', 'TEXTO', 'NUEVO', 'SIN-TEXTO'].filter((k) => recuento[k]);
  const salida = [`::notice title=comparar-fuente::${escaparAnotacion(`Rama ${rama}: ${filas.length} documento(s) frente a su copia anterior. ${orden.map((k) => `${k}: ${recuento[k]}`).join(' · ') || 'ninguno'}.`)}`];
  // Lo buscado (--buscar): en la misma línea, solo los documentos donde la cuenta cambia.
  const buscados = filas.filter((f) => f.buscar);
  if (buscados.length) {
    const cambian = buscados.filter((f) => f.buscar.antes !== f.buscar.ahora && f.buscar.antes !== 'sin copia').map((f) => `${f.nombre} (${f.buscar.antes} → ${f.buscar.ahora})`);
    const nuevos = buscados.filter((f) => f.buscar.antes === 'sin copia' && f.buscar.ahora !== 0).map((f) => `${f.nombre} (nuevo: ${f.buscar.ahora})`);
    const todo = [...cambian, ...nuevos];
    salida[0] += escaparAnotacion(` Lo buscado ${todo.length ? `cambia en: ${todo.join(', ')}.` : 'aparece las mismas veces que antes en todos.'}`);
  }
  const corta = (l) => (l.length > 140 ? `${l.slice(0, 140)}…` : l);
  const avisos = filas.filter((f) => f.veredicto.estado === 'TEXTO' || f.veredicto.estado === 'SIN-TEXTO').map((f) => {
    const v = f.veredicto;
    const ant = f.anterior ? ` (anterior: ${f.anterior.rama})` : '';
    if (v.estado === 'SIN-TEXTO') return `${f.nombre}: bytes distintos y sin texto que comparar${ant}: ${v.motivo}. No es «sin cambios».`;
    if (v.soloOrden) return `${f.nombre}: el mismo texto en otro orden o con otro corte${ant}.`;
    const muestra = [...v.mas.slice(0, 3).map((l) => `+ ${corta(l)}`), ...v.menos.slice(0, 3).map((l) => `− ${corta(l)}`)].join(' | ');
    return `${f.nombre}: cambia el texto, +${v.mas.length} −${v.menos.length}${ant}. ${muestra}`;
  });
  for (const a of avisos.slice(0, TOPE_AVISOS)) salida.push(`::warning title=comparar-fuente::${escaparAnotacion(a)}`);
  if (avisos.length > TOPE_AVISOS) {
    const resto = filas.filter((f) => f.veredicto.estado === 'TEXTO' || f.veredicto.estado === 'SIN-TEXTO').slice(TOPE_AVISOS).map((f) => `${f.nombre} (${f.veredicto.estado})`);
    salida.push(`::warning title=comparar-fuente::${escaparAnotacion(`Y ${resto.length} más con cambios o sin leer: ${resto.join(', ')}. Verlos con node scripts/comparar-fuente.js ${rama}`)}`);
  }
  return salida;
}

/* En Actions (--anotaciones) nunca sale distinto de 0: la corrida va sobre la cabeza de main y Railway
   espera a sus checks. Lo que falla se dice en un aviso. */
async function main(argv = process.argv.slice(2), env = process.env) {
  const enActions = argv.includes('--anotaciones');
  try {
    const rc = await comparar(argv, env);
    if (enActions && rc !== 0) console.log('::warning title=comparar-fuente::La comparación no se pudo hacer (ver el paso); no dice nada de lo traído.');
    return enActions ? 0 : rc;
  } catch (e) {
    if (!enActions) throw e;
    console.log(`::warning title=comparar-fuente::${escaparAnotacion(`La comparación falló: ${String(e.message).split('\n')[0]}. No dice nada de lo traído.`)}`);
    return 0;
  }
}

async function comparar(argv, env) {
  let o;
  try { o = argumentos(argv); } catch (e) { console.error(e.message); return 2; }
  if (o.traer) {
    try { git(['fetch', '-q', 'origin', '+refs/heads/fuente/*:refs/remotes/origin/fuente/*', '+refs/heads/main:refs/remotes/origin/main']); } catch (e) {
      console.error(`No se pudieron traer las ramas fuente/* (${String(e.stderr || e.message).trim().split('\n')[0]}); se sigue con las que hay en local.`);
    }
  }
  const ref = `origin/${o.rama}`;
  let fechaRama;
  try { fechaRama = Number(gitTexto(['log', '-1', '--format=%ct', ref]).trim()); } catch {
    console.error(`No existe la rama ${ref}. Las ramas de transporte se listan con: git branch -r --list 'origin/fuente/*'`);
    return 2;
  }
  const enMain = arbol('origin/main');
  const propia = arbol(ref);
  const documentos = [...propia].filter(([ruta]) => !enMain.has(ruta) && !NO_SON_DOCUMENTOS.has(path.basename(ruta)))
    .filter(([ruta]) => !o.solo || o.solo.has(path.basename(ruta)));
  if (!documentos.length) {
    console.log(`La rama ${o.rama} no trae ningún documento que main no tenga${o.solo ? ' con esos nombres' : ''}.`);
    if (o.anotaciones) for (const l of anotaciones([], o.rama)) console.log(l);
    return 0;
  }

  // Las demás ramas fuente/*, con lo que cada una trae y main no.
  const nombres = new Set(documentos.map(([ruta]) => path.basename(ruta)));
  const candidatas = new Map(); // nombre → [{rama, fecha, ruta, blob}]
  for (const l of gitTexto(['for-each-ref', '--format=%(refname:short) %(committerdate:unix)', 'refs/remotes/origin/fuente/']).split('\n').filter(Boolean)) {
    const [corto, fecha] = l.split(' ');
    const rama = corto.replace(/^origin\//, '');
    if (rama === o.rama) continue;
    for (const [ruta, blob] of arbol(corto)) {
      const nombre = path.basename(ruta);
      if (!nombres.has(nombre) || enMain.has(ruta)) continue;
      if (!candidatas.has(nombre)) candidatas.set(nombre, []);
      candidatas.get(nombre).push({ rama, fecha: Number(fecha), ruta, blob });
    }
  }

  console.log(`Rama ${o.rama} (${new Date(fechaRama * 1000).toISOString().slice(0, 10)}): ${documentos.length} documento(s) frente a su copia anterior.\n`);
  const recuento = {};
  const filas = [];
  const impreso = [];
  for (const [ruta, blob] of documentos.sort((a, b) => a[0].localeCompare(b[0]))) {
    const nombre = path.basename(ruta);
    const anterior = elegirAnterior(candidatas.get(nombre) || [], o.rama, fechaRama);
    let actual = { blob };
    let previo = anterior ? { blob: anterior.blob } : null;
    // Solo se lee el texto si hace falta: con bytes distintos, o para contar lo que se busca.
    if ((previo && previo.blob !== blob) || o.buscar) {
      actual = await leer(ref, ruta, blob);
      if (previo) previo = previo.blob === blob ? actual : await leer(`origin/${anterior.rama}`, anterior.ruta, anterior.blob);
    }
    const veredicto = clasificar(previo, actual);
    recuento[veredicto.estado] = (recuento[veredicto.estado] || 0) + 1;
    const contar = (d) => (!d ? 'sin copia' : d.crudo == null ? 'sin texto' : cuenta(d.crudo, o.buscar));
    const buscar = o.buscar ? { antes: contar(previo), ahora: contar(actual) } : null;
    filas.push({ nombre, anterior, veredicto, buscar });
    for (const l of pintar({ nombre, anterior, veredicto, buscar }, o)) { console.log(l); impreso.push(l); }
  }
  console.log(`\n${Object.entries(recuento).map(([k, n]) => `${k}: ${n}`).join(' · ')}`);
  if (o.anotaciones) {
    for (const l of anotaciones(filas, o.rama)) console.log(l);
    if (env.GITHUB_STEP_SUMMARY) {
      try { require('fs').appendFileSync(env.GITHUB_STEP_SUMMARY, `## Lo traído frente a su copia anterior (${o.rama})\n\n\`\`\`\n${impreso.join('\n')}\n\`\`\`\n`); } catch { /* el resumen es comodidad */ }
    }
  }
  console.log('Solo compara: un TEXTO lo lee una persona antes de tocar el catálogo, y un SIN-TEXTO no es «sin cambios».');
  return 0;
}

if (require.main === module) main().then((rc) => { process.exitCode = rc; });

module.exports = { lineasDeHtml, lineasDeTexto, compararLineas, clasificar, elegirAnterior, argumentos, pintar, colapsar, anotaciones, main, TOPE_AVISOS };
