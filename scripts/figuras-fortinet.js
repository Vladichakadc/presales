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
//   npm run figuras-fortinet -- --rehacer <carpeta-con-los-pdf> [--solo <ruta>] [--aplicar] [--aunque-dudosa]
//       Rehace cada figura desde su caja: pdftoppm (Poppler) rasteriza y recorta, y cwebp (o, si no
//       está, Pillow) la guarda en WebP con calidad 90, como las existentes. Sin --aplicar solo dice
//       cuánto difiere cada una de la servida (contra la diferencia que dio al medirla) y si el PDF
//       es la misma edición que la del lock; con --aplicar escribe las figuras y pone al día su
//       huella y su diferencia. Un PDF de OTRA edición no se usa sin
//       revisar la caja: el dibujo puede haber cambiado de sitio.
//       Cada recorte se compara además con las otras figuras de su documento, en lo que las
//       distingue: si se parece más a una vecina sale DUDOSA, cuenta como fallo y no se aplica
//       (--aunque-dudosa la fuerza, tras confirmar la caja por el rótulo). Ver «LA CAJA, CONTRA LAS
//       FIGURAS VECINAS».
//   npm run figuras-fortinet -- --traer <carpeta> [--json] [--todas]
//       Lo que corre el job `contrastar_figuras` del vigía cada lunes (2026-11-09, mejora propuesta
//       al cerrar el PR #149). Baja cada documento del lock de su `url` y lo compara con su huella:
//       si es la misma edición no hay nada que rehacer; si es otra, rehace cada figura de ese
//       documento con su caja y dice si el dibujo sigue siendo el mismo (IGUAL) o no (DISTINTA).
//       Un documento que no se pudo bajar, o que no es un PDF, es un ERROR, nunca «sin cambios».
//       --todas rehace también las de la misma edición (para calibrar el Poppler del ejecutor).
//       No escribe nada en el repositorio. Sale con 0 sin cambios, 1 con otra edición y 2 con error.
//   npm run figuras-fortinet -- --resumen <json>    el texto legible del JSON de --traer
//
// POR QUÉ LAS URL VIVEN AQUÍ Y NO EN fuentes.js. Las fichas por serie entraron en fuentes.js sin
// URL («el repositorio no conserva la URL exacta de cada ficha»), así que el vigía no las mide y
// nunca quedan pendientes. Las URL sí estaban en el historial: cada rama `fuente/*` trae el
// informe de su corrida (archivo guardado y estado 200) y el workflow que la hizo tenía la base.
// Cada documento lleva en `urlDe` de dónde se sacó la suya.
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

// DOS CAJAS DE LA MISMA PÁGINA NO SE PISAN (2026-11-12, mejora propuesta al cerrar el PR #188 y
// aprobada por el dueño: «Ejecuta mejora y pendientes»). Las cajas se midieron por correlación, y en
// una página con dos dibujos casi iguales (el FortiGate y el FortiWiFi de la misma serie) la
// correlación elige el que no es: la trasera del FortiWiFi 50G-5G-II tenía la caja de la del
// FortiGate 50G-5G, y el frontal del FortiWiFi 50G la del FortiGate 50G, las dos hasta el PR #188.
// La figura servida era la buena; el lock no, y el vigía la habría rehecho con el dibujo del otro.
// Dos figuras distintas del mismo documento y página cuyas cajas se solapan más de la mitad del área
// de la menor son un error. Una figura que comparten dos modelos es UN archivo y no cuenta. Un solape
// a propósito se declara aquí, con su motivo; uno declarado que ya no se solapa también avisa.
const SOLAPE_MAXIMO = 0.5;
const SOLAPES_DECLARADOS = {}; // 'ruta-a|ruta-b' (en orden alfabético) → motivo

function solapeDe(a, b) {
  const ancho = Math.min(a[0] + a[2], b[0] + b[2]) - Math.max(a[0], b[0]);
  const alto = Math.min(a[1] + a[3], b[1] + b[3]) - Math.max(a[1], b[1]);
  if (!(ancho > 0 && alto > 0)) return 0;
  return (ancho * alto) / Math.min(a[2] * a[3], b[2] * b[3]);
}

function cajasQueSePisan(figuras, declarados) {
  const problemas = [];
  const vistos = new Set();
  const lista = Object.entries(figuras).filter(([, f]) => Array.isArray(f.caja) && f.caja.length === 4)
    .sort(([a], [b]) => a.localeCompare(b));
  for (let i = 0; i < lista.length; i++) {
    for (let j = i + 1; j < lista.length; j++) {
      const [ra, a] = lista[i];
      const [rb, b] = lista[j];
      if (a.documento !== b.documento || a.pagina !== b.pagina) continue;
      const s = solapeDe(a.caja, b.caja);
      const clave = `${ra}|${rb}`;
      if (s <= SOLAPE_MAXIMO) continue;
      vistos.add(clave);
      if (Object.prototype.hasOwnProperty.call(declarados, clave)) continue;
      problemas.push(`${ra} y ${rb}: sus cajas de la p. ${a.pagina} de «${a.documento}» se solapan un ${Math.round(s * 100)} % `
        + 'de la menor; una de las dos es seguramente el dibujo de la otra. Confírmalo por un detalle que solo tenga una '
        + '(rótulo, LED, antenas), no por la correlación, o declara el par en SOLAPES_DECLARADOS con su motivo');
    }
  }
  for (const [clave, motivo] of Object.entries(declarados)) {
    if (!String(motivo || '').trim()) problemas.push(`${clave}: solape declarado sin motivo`);
    else if (!vistos.has(clave)) problemas.push(`${clave}: está en SOLAPES_DECLARADOS y sus cajas ya no se solapan; sobra`);
  }
  return problemas;
}

// Todo lo que tiene que cuadrar entre el mapa de figuras, el lock y los archivos. Pura: recibe
// la lectura de cada .webp para poder probarla sin disco.
function comprobar(vistas, lock, leer, declarados = SOLAPES_DECLARADOS) {
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
  // Sin URL el vigía no puede bajar el documento cada lunes; sin `urlDe`, nadie sabe de dónde salió.
  for (const [nombre, d] of Object.entries(documentos)) {
    if (!/^https:\/\/[a-z0-9.-]+\.(?:fortinet\.com|amazonaws\.com)\//.test(d.url || '')) problemas.push(`${nombre}: sin URL https de Fortinet en el lock`);
    if (!d.urlDe || !/fuente\//.test(d.urlDe)) problemas.push(`${nombre}: la URL no dice de qué rama fuente/* sale (urlDe)`);
  }
  problemas.push(...cajasQueSePisan(figuras, declarados));
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

// El tope de una figura: la diferencia que dio al medirla más el margen.
const topeDe = (f) => (typeof f.diferencia === 'number' ? f.diferencia : MISMO_ENCUADRE) + MARGEN;

// Rehace una figura desde un PDF y la compara con la servida: {diferencia, tope, igual}.
function compararFigura(ruta, f, pdf) {
  const nueva = path.join(os.tmpdir(), `figfort-${process.pid}-${path.basename(ruta)}`);
  try {
    rehacerUna(f, pdf, nueva);
    const d = diferencia(nueva, path.join(RAIZ, 'public', ruta));
    return { diferencia: d, tope: topeDe(f), igual: d <= topeDe(f), nueva };
  } catch (e) {
    try { fs.unlinkSync(nueva); } catch { /* no llegó a escribirse */ }
    throw e;
  }
}

// LA CAJA, CONTRA LAS FIGURAS VECINAS (2026-11-12, mejora propuesta al cerrar el PR #191 y aprobada
// por el dueño: «Ejecuta pendientes y mejora propuesta»). El freno de solapes caza dos cajas sobre el
// mismo dibujo; no caza dos cajas CAMBIADAS entre sí, ni dice nada mientras se mide una caja nueva.
// Aquí el recorte de cada caja se compara con su figura servida y con las demás del mismo documento,
// pero SOLO EN LOS PÍXELES DONDE LAS DOS FIGURAS DIFIEREN (el rótulo, el LED «WIFI», las antenas): el
// detalle que solo tiene una. Comparar la imagen entera no sirve y se midió: entre un FortiGate y su
// FortiWiFi el ruido de remuestrear pesa más que el rótulo, y tres figuras bien medidas (70G frontal,
// 30G trasera) salían más cerca de su vecina que de sí mismas. En la zona que difiere, las 92 figuras
// del lock quedan a +48 o más de su vecina más parecida, y las dos cajas erradas hasta el PR #188, a
// -53 y -66. Dos figuras sin zona que las distinga (las traseras del 30G son el mismo dibujo) salen
// «indistinguibles»: la imagen no puede decidir, y se dice en vez de darlas por buenas.
const ANCHO_DETALLE = 800; // a 400 px el rótulo «5G» de una antena ya no se distingue
const UMBRAL_DETALLE = 40; // diferencia de gris (0-255) para contar un píxel como «difiere»
const MINIMO_DETALLE = 12; // con menos píxeles que difieran, las dos figuras no se distinguen

// Mide el recorte contra la figura propia y cada vecina. Devuelve, por vecina, {ruta, propia, vecina,
// pixeles} o {ruta, indistinguible: true, pixeles}. Necesita Python con Pillow y numpy.
function medirVecinas(recorte, propia, vecinas) {
  if (!vecinas.length) return [];
  const py = [
    'import sys',
    'from PIL import Image, ImageFilter',
    'import numpy as n',
    'W, U, K = int(sys.argv[1]), float(sys.argv[2]), int(sys.argv[3])',
    'def carga(p, size=None):',
    '    i = Image.open(p).convert("L")',
    '    if size is None: size = (W, max(1, round(i.height * W / i.width)))',
    '    return n.asarray(i.resize(size, Image.LANCZOS).filter(ImageFilter.GaussianBlur(1.5)), dtype=float), size',
    'crop, size = carga(sys.argv[4])',
    'a, _ = carga(sys.argv[5], size)',
    'for p in sys.argv[6:]:',
    '    b, _ = carga(p, size)',
    '    m = abs(a - b) > U',
    '    k = int(m.sum())',
    '    if k < K: print("x", "x", k)',
    '    else: print(round(float(abs(crop - a)[m].mean()), 1), round(float(abs(crop - b)[m].mean()), 1), k)',
  ].join('\n');
  const lineas = cp.execFileSync('python3', ['-I', '-c', py, String(ANCHO_DETALLE), String(UMBRAL_DETALLE), String(MINIMO_DETALLE),
    recorte, propia.archivo, ...vecinas.map((v) => v.archivo)]).toString().trim().split('\n');
  return vecinas.map((v, i) => {
    const [a, b, k] = lineas[i].split(' ');
    return a === 'x' ? { ruta: v.ruta, indistinguible: true, pixeles: Number(k) }
      : { ruta: v.ruta, propia: Number(a), vecina: Number(b), pixeles: Number(k) };
  });
}

// Pura: qué vecinas ponen la caja en duda (en lo que las distingue, el recorte se parece más a la
// vecina que a la figura propia) y de cuáles no se puede distinguir.
function juzgarVecinas(medidas) {
  return {
    dudosas: medidas.filter((m) => !m.indistinguible && m.vecina < m.propia),
    indistinguibles: medidas.filter((m) => m.indistinguible),
  };
}

// Las demás figuras del mismo documento que tienen archivo servido.
function vecinasDe(ruta, figuras, existe = (r) => fs.existsSync(path.join(RAIZ, 'public', r))) {
  const f = figuras[ruta];
  return Object.entries(figuras).filter(([r, g]) => r !== ruta && g.documento === f.documento && existe(r))
    .map(([r]) => ({ ruta: r, archivo: path.join(RAIZ, 'public', r) }));
}

const faltaHerramienta = () => ['pdftoppm', 'pdfinfo', 'python3'].find((cmd) => !tiene(cmd)) || null;

function rehacer(carpeta, { solo, aplicar, aunqueDudosa }) {
  const falta = faltaHerramienta();
  if (falta) { console.error(`Falta ${falta} (Poppler y Python con Pillow).`); return 2; }
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
    const { diferencia: d, tope, nueva } = compararFigura(ruta, f, pdf);
    const { dudosas, indistinguibles } = juzgarVecinas(medirVecinas(nueva, { ruta, archivo: path.join(RAIZ, 'public', ruta) }, vecinasDe(ruta, lock.figuras)));
    const dudosa = dudosas.length > 0 && !aunqueDudosa;
    const estado = otraEdicion ? 'EDICION' : dudosas.length ? 'DUDOSA ' : d <= tope ? 'IGUAL  ' : 'DISTINTA';
    console.log(`${estado} ${ruta}: diferencia media ${d}${otraEdicion ? ' — el PDF no es la edición del lock: revisa la caja antes de aplicar' : ''}`);
    for (const v of dudosas) {
      console.log(`        en lo que la distingue de ${v.ruta} (${v.pixeles} px), el recorte se parece más a esa (${v.vecina}) que a la suya (${v.propia}): `
        + `la caja cae seguramente en el dibujo de la otra${aplicar && dudosa ? '; no se aplica (--aunque-dudosa la fuerza, tras confirmarla por el rótulo)' : ''}`);
    }
    for (const v of indistinguibles) console.log(`        no se distingue de ${v.ruta} por la imagen (${v.pixeles} px distintos): la caja se confirma mirando el rótulo de la página`);
    if (dudosa) { fallos++; fs.unlinkSync(nueva); continue; }
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

// LO QUE CORRE EL VIGÍA (2026-11-09). Pura salvo por `fetch` y `comparar`, que la prueba sustituye.
const TIEMPO_LIMITE = 120000; // las guías del 7081F y del 7121F pasan de 8 MB
const A_LA_VEZ = 4;
const CABECERAS = { 'User-Agent': 'presales-vigia-fuentes/1.0 (+catalogo interno)', Accept: 'application/pdf,*/*' };
const esPdf = (buf) => buf.length > 4 && buf.subarray(0, 5).toString('latin1') === '%PDF-';
const breve = (e) => String((e && e.message) || e).replace(/\s+/g, ' ').slice(0, 200);

async function traer({ lock, carpeta, todas = false, fetch = globalThis.fetch, comparar = compararFigura, herramientas = faltaHerramienta }) {
  const porDoc = {};
  for (const [ruta, f] of Object.entries(lock.figuras)) (porDoc[f.documento] = porDoc[f.documento] || []).push([ruta, f]);
  const docs = Object.entries(lock.documentos);
  const out = new Array(docs.length);
  let falta;
  const uno = async ([documento, doc]) => {
    const r = { documento, url: doc.url || null, estado: 'error', figuras: [] };
    if (!/^https:\/\//.test(doc.url || '')) return { ...r, error: 'el lock no trae una URL https para este documento' };
    const control = new AbortController();
    const reloj = setTimeout(() => control.abort(), TIEMPO_LIMITE);
    let buf;
    try {
      const res = await fetch(doc.url, { redirect: 'follow', signal: control.signal, headers: CABECERAS });
      if (!res.ok) return { ...r, error: `HTTP ${res.status}` };
      buf = Buffer.from(await res.arrayBuffer());
    } catch (e) {
      return { ...r, error: control.signal.aborted ? `sin respuesta en ${TIEMPO_LIMITE / 1000} s` : breve(e) };
    } finally { clearTimeout(reloj); }
    if (!esPdf(buf)) return { ...r, error: `no es un PDF (${buf.length} bytes)` };
    r.bytes = buf.length;
    r.sha256 = sha256(buf);
    r.estado = r.sha256 === doc.sha256 ? 'igual' : 'otraEdicion';
    if (r.estado === 'igual' && !todas) return r;
    if (falta === undefined) falta = herramientas();
    const pdf = path.join(carpeta, documento);
    fs.writeFileSync(pdf, buf);
    for (const [ruta, f] of porDoc[documento] || []) {
      if (falta) { r.figuras.push({ ruta, resultado: 'error', error: `falta ${falta} en el ejecutor` }); continue; }
      try {
        const c = comparar(ruta, f, pdf);
        if (c.nueva) { try { fs.unlinkSync(c.nueva); } catch { /* ya no está */ } }
        r.figuras.push({ ruta, resultado: c.igual ? 'igual' : 'distinta', diferencia: c.diferencia, tope: c.tope });
      } catch (e) {
        r.figuras.push({ ruta, resultado: 'error', error: breve(e) });
      }
    }
    return r;
  };
  let siguiente = 0;
  const trabajador = async () => {
    while (siguiente < docs.length) { const i = siguiente++; out[i] = await uno(docs[i]); }
  };
  fs.mkdirSync(carpeta, { recursive: true });
  await Promise.all(Array.from({ length: Math.min(A_LA_VEZ, docs.length) }, trabajador));
  return { todas, documentos: out };
}

// 0 todo igual, 1 alguna otra edición o una figura distinta, 2 algo que no se pudo comprobar.
function codigoDe(inf) {
  const docs = inf.documentos;
  if (docs.some((d) => d.estado === 'error' || d.figuras.some((f) => f.resultado === 'error'))) return 2;
  if (docs.some((d) => d.estado === 'otraEdicion' || d.figuras.some((f) => f.resultado === 'distinta'))) return 1;
  return 0;
}

function resumen(inf) {
  const l = [];
  for (const d of inf.documentos) {
    const cab = d.estado === 'error' ? `ERROR    ${d.documento}: ${d.error}`
      : d.estado === 'igual' ? `MISMA    ${d.documento}` : `EDICION  ${d.documento}: la ficha publicada ya no es la del lock`;
    l.push(cab);
    for (const f of d.figuras) {
      l.push(f.resultado === 'error' ? `  ERROR    ${f.ruta}: ${f.error}`
        : `  ${f.resultado === 'igual' ? 'IGUAL   ' : 'DISTINTA'} ${f.ruta}: diferencia ${f.diferencia} (tope ${f.tope})`);
    }
  }
  const n = (e) => inf.documentos.filter((d) => d.estado === e).length;
  l.push(`${inf.documentos.length} documentos · misma edición ${n('igual')} · otra edición ${n('otraEdicion')} · sin comprobar ${n('error')}`);
  return l.join('\n');
}

async function main(argv) {
  const args = argv.slice(2);
  const t = args.indexOf('--traer');
  if (t >= 0) {
    const carpeta = args[t + 1];
    if (!carpeta || carpeta.startsWith('--')) { console.error('Uso: --traer <carpeta> [--json] [--todas]'); return 2; }
    const inf = await traer({ lock: leerJson(LOCK), carpeta, todas: args.includes('--todas') });
    console.log(args.includes('--json') ? JSON.stringify(inf, null, 1) : resumen(inf));
    return codigoDe(inf);
  }
  const r = args.indexOf('--resumen');
  if (r >= 0) { console.log(resumen(leerJson(args[r + 1]))); return 0; }
  const i = args.indexOf('--rehacer');
  if (i >= 0) {
    const carpeta = args[i + 1];
    if (!carpeta) { console.error('Uso: --rehacer <carpeta-con-los-pdf> [--solo <ruta>] [--aplicar] [--aunque-dudosa]'); return 2; }
    const j = args.indexOf('--solo');
    return rehacer(carpeta, { solo: j >= 0 ? args[j + 1] : null, aplicar: args.includes('--aplicar'), aunqueDudosa: args.includes('--aunque-dudosa') });
  }
  const problemas = comprobar(leerJson(VISTAS), leerJson(LOCK), leerFigura);
  for (const p of problemas) console.log(`  · ${p}`);
  const n = Object.keys(leerJson(LOCK).figuras).length;
  console.log(problemas.length ? `${problemas.length} problema(s) en las figuras de Fortinet.` : `Las ${n} figuras de Fortinet casan con su lock y su pie.`);
  return problemas.length ? 1 : 0;
}

if (require.main === module) main(process.argv).then((c) => process.exit(c), (e) => { console.error(e); process.exit(2); });

module.exports = { medirVecinas, juzgarVecinas, vecinasDe, comprobar, paginasDelPie, solapeDe, SOLAPE_MAXIMO, SOLAPES_DECLARADOS, rehacerUna, sha256, traer, codigoDe, resumen, MARGEN, MISMO_ENCUADRE };
