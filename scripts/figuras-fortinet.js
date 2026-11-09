'use strict';
// FIGURAS DE FORTINET CON LOCK (2026-11-09, mejora propuesta al cerrar el PR #148 y aprobada por el
// dueño: «Ejecuta mejora propuesta»).
//
// Las figuras fg-*.webp y fwf-*.webp se recortaron a mano de la página «Hardware» de cada ficha
// (o de la guía de hardware de los cuatro que no tienen ficha por serie). Hasta hoy no quedaba
// escrito QUÉ caja se recortó: cuando Fortinet publique otra edición de una ficha, nadie podría
// rehacer la figura con el mismo encuadre ni saber si el dibujo cambió. Este comando guarda en
// `scripts/figuras-fortinet.lock.json`, por figura, el documento, la página, la caja en puntos PDF,
// el tamaño en píxeles y la huella del .webp que se sirve; y por documento, la rama `fuente/*` que
// lo trajo y su huella.
//
// LAS CAJAS DE LAS 73 FIGURAS QUE YA EXISTIAN se midieron, no se escribieron: cada figura servida
// se buscó por correlación normalizada, a varias escalas, en la página que cita su pie, y la caja
// es la que mejor casa (la correlación queda en el lock). Rehechas con esa caja, salen con el mismo
// encuadre que las servidas, con unos píxeles de desfase.
//
// Uso:
//   npm run figuras-fortinet                       comprueba lock, figuras y pies (no escribe nada)
//   npm run figuras-fortinet -- --rehacer <carpeta-con-los-pdf> [--solo <ruta>] [--aplicar]
//       Rehace cada figura desde su caja: pdftoppm (Poppler) rasteriza y recorta, y cwebp (o, si no
//       está, Pillow) la guarda en WebP con calidad 90, como las existentes. Sin --aplicar solo dice
//       cuánto difiere cada una de la servida (contra la diferencia que dio al medirla) y si el PDF
//       es la misma edición que la del lock; con --aplicar escribe las figuras y pone al día su
//       huella y su diferencia. Un PDF de OTRA edición no se usa sin
//       revisar la caja: el dibujo puede haber cambiado de sitio.
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const cp = require('child_process');

const RAIZ = path.join(__dirname, '..');
const LOCK = path.join(__dirname, 'figuras-fortinet.lock.json');
const VISTAS = path.join(RAIZ, 'public/data/fortinet-vistas-equipos.json');
const CALIDAD = 90;
// Una figura rehecha es «la misma» si su diferencia media por canal (0-255) con la servida no pasa
// de la que dio al medirla (`diferencia` en el lock) más este margen. No vale un umbral único: en
// un dibujo denso (las rejillas de ventilación del 7121F) remuestrear mueve mucho los píxeles sin
// cambiar el dibujo, y da 20 donde un panel sencillo da 4.
const MARGEN = 3;
const MISMO_ENCUADRE = 15; // para una figura nueva, que aún no tiene diferencia medida

const sha256 = (buf) => crypto.createHash('sha256').update(buf).digest('hex');

// Las páginas que cita un pie, en orden: «p. 7 «Hardware»». Un pie con dos citas da la frontal en
// la primera y la trasera en la segunda (las guías del 7081F y del 7121F).
function paginasDelPie(fuente) {
  return [...String(fuente || '').matchAll(/p\. (\d+) «/g)].map((m) => Number(m[1]));
}

// Todo lo que tiene que cuadrar entre el mapa de figuras, el lock y los archivos. Pura: recibe
// la lectura de cada .webp para poder probarla sin disco.
function comprobar(vistas, lock, leer) {
  const problemas = [];
  const figuras = (lock && lock.figuras) || {};
  const documentos = (lock && lock.documentos) || {};
  const usadas = new Set();
  const vistos = new Set();
  for (const [modelo, v] of Object.entries(vistas)) {
    if (modelo.startsWith('_')) continue;
    const paginas = paginasDelPie(v.fuente);
    for (const cara of ['front', 'rear']) {
      const ruta = v[cara];
      if (!ruta) continue;
      usadas.add(ruta);
      const f = figuras[ruta];
      if (!f) { problemas.push(`${modelo} (${cara}): ${ruta} no está en el lock; nadie sabría de qué caja salió`); continue; }
      const esperada = cara === 'rear' && paginas.length > 1 ? paginas[1] : paginas[0];
      if (f.pagina !== esperada) {
        problemas.push(`${ruta}: el lock la saca de la p. ${f.pagina} y el pie de ${modelo} cita la p. ${esperada}`);
      }
      if (!Array.isArray(f.caja) || f.caja.length !== 4 || f.caja.some((n) => !(n >= 0))) {
        problemas.push(`${ruta}: caja mal formada`);
      }
      if (vistos.has(ruta)) continue; // la figura que comparten dos modelos se comprueba una vez
      vistos.add(ruta);
      let datos = null;
      try { datos = leer(ruta); } catch { /* se dice abajo */ }
      if (!datos) problemas.push(`${ruta}: el archivo no existe`);
      else if (sha256(datos) !== f.sha256) {
        problemas.push(`${ruta}: la figura cambió sin pasar por este comando (huella distinta de la del lock)`);
      }
    }
  }
  for (const [ruta, f] of Object.entries(figuras)) {
    if (!usadas.has(ruta)) problemas.push(`${ruta}: está en el lock y ningún modelo la usa`);
    if (!documentos[f.documento]) problemas.push(`${ruta}: el documento «${f.documento}» no está declarado en el lock`);
  }
  return problemas;
}

function leerJson(f) { return JSON.parse(fs.readFileSync(f, 'utf8')); }
const leerFigura = (ruta) => fs.readFileSync(path.join(RAIZ, 'public', ruta));

function tiene(cmd) {
  return cp.spawnSync('sh', ['-c', `command -v ${cmd}`], { stdio: 'ignore' }).status === 0;
}

// PNG a WebP con calidad 90: cwebp si está; si no, Pillow (el mismo códec, libwebp).
function aWebp(png, webp) {
  if (tiene('cwebp')) {
    cp.execFileSync('cwebp', ['-quiet', '-q', String(CALIDAD), '-m', '6', png, '-o', webp]);
  } else {
    cp.execFileSync('python3', ['-I', '-c',
      'import sys; from PIL import Image; Image.open(sys.argv[1]).convert("RGB").save(sys.argv[2], "WEBP", quality=int(sys.argv[3]), method=6)',
      png, webp, String(CALIDAD)]);
  }
}

// Diferencia media por canal entre dos imágenes del mismo tamaño (las decodifica Pillow o dwebp).
function diferencia(a, b) {
  const py = 'import sys; from PIL import Image; import numpy as n; '
    + 'x=n.asarray(Image.open(sys.argv[1]).convert("RGB"),dtype=float); y=n.asarray(Image.open(sys.argv[2]).convert("RGB"),dtype=float); '
    + 'print("tam" if x.shape!=y.shape else round(abs(x-y).mean(),2))';
  const r = cp.execFileSync('python3', ['-I', '-c', py, a, b]).toString().trim();
  return r === 'tam' ? Infinity : Number(r);
}

function paginaEnPuntos(pdf, pagina) {
  const out = cp.execFileSync('pdfinfo', ['-f', String(pagina), '-l', String(pagina), pdf]).toString();
  const m = new RegExp(`Page\\s+${pagina} size:\\s+([\\d.]+) x ([\\d.]+)`).exec(out);
  if (!m) throw new Error(`pdfinfo no da el tamaño de la p. ${pagina} de ${pdf}`);
  return [Number(m[1]), Number(m[2])];
}

// La figura a partir de su caja: la escala sale del ancho en píxeles de la figura servida, para
// que la rehecha tenga exactamente su tamaño.
function rehacerUna(f, pdf, destino) {
  // Una escala por eje: la caja manda en los dos, porque alguna figura servida (la 7121F) no se
  // escaló igual en horizontal que en vertical.
  const [x, y, w, h] = f.caja;
  const [ancho, alto] = f.tamano;
  const sx = ancho / w;
  const sy = alto / h;
  const [pw, ph] = paginaEnPuntos(pdf, f.pagina);
  const pref = path.join(os.tmpdir(), `figfort-${process.pid}-${Date.now()}`);
  cp.execFileSync('pdftoppm', ['-f', String(f.pagina), '-l', String(f.pagina),
    '-scale-to-x', String(Math.round(pw * sx)), '-scale-to-y', String(Math.round(ph * sy)),
    '-x', String(Math.round(x * sx)), '-y', String(Math.round(y * sy)), '-W', String(ancho), '-H', String(alto),
    '-png', '-singlefile', pdf, pref], { stdio: ['ignore', 'ignore', 'ignore'] });
  aWebp(`${pref}.png`, destino);
  fs.unlinkSync(`${pref}.png`);
}

function rehacer(carpeta, { solo, aplicar }) {
  for (const cmd of ['pdftoppm', 'pdfinfo', 'python3']) {
    if (!tiene(cmd)) { console.error(`Falta ${cmd} (Poppler y Python con Pillow).`); return 2; }
  }
  const lock = leerJson(LOCK);
  let fallos = 0;
  const huellas = {};
  for (const [ruta, f] of Object.entries(lock.figuras)) {
    if (solo && ruta !== solo && path.basename(ruta) !== solo) continue;
    const doc = lock.documentos[f.documento];
    const pdf = path.join(carpeta, f.documento);
    if (!fs.existsSync(pdf)) { console.log(`FALTA   ${ruta}: no está ${f.documento} en ${carpeta} (rama ${doc.rama})`); fallos++; continue; }
    const huella = huellas[pdf] || (huellas[pdf] = sha256(fs.readFileSync(pdf)));
    const otraEdicion = huella !== doc.sha256;
    const nueva = path.join(os.tmpdir(), `figfort-${path.basename(ruta)}`);
    rehacerUna(f, pdf, nueva);
    const d = diferencia(nueva, path.join(RAIZ, 'public', ruta));
    const tope = (typeof f.diferencia === 'number' ? f.diferencia : MISMO_ENCUADRE) + MARGEN;
    const estado = otraEdicion ? 'EDICION' : d <= tope ? 'IGUAL  ' : 'DISTINTA';
    console.log(`${estado} ${ruta}: diferencia media ${d}${otraEdicion ? ' — el PDF no es la edición del lock: revisa la caja antes de aplicar' : ''}`);
    if (aplicar && !otraEdicion) {
      fs.copyFileSync(nueva, path.join(RAIZ, 'public', ruta));
      f.sha256 = sha256(fs.readFileSync(nueva));
      f.diferencia = d;
    } else if (otraEdicion || d > tope) fallos++;
    fs.unlinkSync(nueva);
  }
  if (aplicar) fs.writeFileSync(LOCK, JSON.stringify(lock, null, 1) + '\n');
  return fallos ? 1 : 0;
}

function main(argv) {
  const args = argv.slice(2);
  const i = args.indexOf('--rehacer');
  if (i >= 0) {
    const carpeta = args[i + 1];
    if (!carpeta) { console.error('Uso: --rehacer <carpeta-con-los-pdf> [--solo <ruta>] [--aplicar]'); return 2; }
    const j = args.indexOf('--solo');
    return rehacer(carpeta, { solo: j >= 0 ? args[j + 1] : null, aplicar: args.includes('--aplicar') });
  }
  const problemas = comprobar(leerJson(VISTAS), leerJson(LOCK), leerFigura);
  for (const p of problemas) console.log(`  · ${p}`);
  const n = Object.keys(leerJson(LOCK).figuras).length;
  console.log(problemas.length ? `${problemas.length} problema(s) en las figuras de Fortinet.` : `Las ${n} figuras de Fortinet casan con su lock y su pie.`);
  return problemas.length ? 1 : 0;
}

if (require.main === module) process.exit(main(process.argv));

module.exports = { comprobar, paginasDelPie, rehacerUna, sha256, MARGEN, MISMO_ENCUADRE };
