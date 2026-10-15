'use strict';
// IMPORTADOR DE FIGURAS DE HUAWEI (2026-10-15, mejora aprobada por el dueño).
//
// Las figuras buenas de Huawei (los renders de la Galería de imágenes de productos de
// Info-Finder, frontal y trasera) solo se pueden bajar desde un navegador con la sesión del
// dueño. Hasta hoy entraban a mano: alguien convertía el PNG, lo copiaba a public/img/equipos y
// editaba el JSON. Este comando hace esa última parte comprobando antes de escribir:
//
//   1. el modelo existe en el catálogo (server/seed/legacyData/huawei.js);
//   2. la cara es «front» o «rear», y cada archivo existe;
//   3. la procedencia está escrita (documento o galería, código y rótulo): una figura sin
//      origen no entra;
//   4. la figura nueva no es MENOR que la que ya hay (salvo --aunque-menor): una figura peor
//      que reemplaza a una mejor es el error que esto existe para impedir;
//   5. el resultado es WebP SIN pérdida (`VP8L`), los píxeles exactos del original: un PNG o
//      JPEG se convierte con `cwebp -lossless -exact`; un WebP con pérdida se rechaza.
//
// Sin --aplicar no escribe nada (como lista-aruba): enseña el plan.
//
// Uso:  npm run figuras-huawei -- <carpeta> [--aplicar] [--aunque-menor]
// La carpeta lleva las imágenes y un procedencia.json:
//   { "AR5710-S8T2S": { "front": "s8t2s-front.png", "rear": "s8t2s-rear.png",
//       "fuente": "Galería de imágenes de productos de Info-Finder (50010720) — «NetEngine AR5710-S8T2S». …" } }
// «tamano» ("43,6 × 442 × 420 mm (Al × An × Fo)") solo hace falta en un modelo sin figura previa.
// «captura» es obligatoria (decisión del dueño, 2026-10-15): la ficha de la galería tal como se
// ve en el navegador, con el rótulo y el código. Es la prueba de que el pie dice lo que la página
// decía: con --aplicar, las capturas y el procedencia.json van a una rama nueva
// fuente/figuras-huawei-<fecha> (una por corrida, como los transportes), que se revisa y se borra.
// Nunca entran en main.
// «fuente» sustituye a la del modelo: tiene que describir las caras que quedan publicadas.

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const RAIZ = path.join(__dirname, '..');
const JSON_RUTA = path.join(RAIZ, 'public', 'data', 'huawei-vistas-equipos.json');
const IMG_DIR = path.join(RAIZ, 'public', 'img', 'equipos');
// El tamaño de cada figura publicada. Lo escribe este comando y lo vigila
// test/huawei-vistas-equipos.test.js: una figura que encoge o que entra sin pasar por aquí
// pone la prueba en rojo, también si alguien edita el JSON a mano.
const LOCK_RUTA = path.join(RAIZ, 'scripts', 'figuras-huawei.lock.json');
const CARAS = ['front', 'rear'];

// Dimensiones de una imagen PNG, JPEG o WebP, leyendo su cabecera (sin dependencias).
function dimensiones(buf) {
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return { tipo: 'png', ancho: buf.readUInt32BE(16), alto: buf.readUInt32BE(20) };
  }
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2;
    while (i < buf.length) {
      if (buf[i] !== 0xff) { i++; continue; }
      const m = buf[i + 1];
      if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) {
        return { tipo: 'jpeg', alto: buf.readUInt16BE(i + 5), ancho: buf.readUInt16BE(i + 7) };
      }
      i += 2 + buf.readUInt16BE(i + 2);
    }
    return null;
  }
  if (buf.toString('latin1', 0, 4) === 'RIFF' && buf.toString('latin1', 8, 12) === 'WEBP') {
    const l = buf.indexOf(Buffer.from('VP8L'));
    if (l >= 0 && buf[l + 8] === 0x2f) {
      const b = buf.readUInt32LE(l + 9);
      return { tipo: 'webp', sinPerdida: true, ancho: (b & 0x3fff) + 1, alto: ((b >> 14) & 0x3fff) + 1 };
    }
    return { tipo: 'webp', sinPerdida: false };
  }
  return null;
}

// Las reglas del pie que test/huawei-vistas-equipos.test.js exige a cada figura publicada, para
// rechazar al planificar lo que verificar rechazaría después: documento con página (o la
// galería con su código) y rótulo literal; un rótulo que nombra a este modelo y no a un hermano;
// y la variante de alimentación que dibuja en las NetEngine 8000 y las A800 E.
const PIE = /^((Data ?[Ss]heet|NetEngine) .+, (p\.|diapositiva) \d+|Galería de imágenes de productos de Info-Finder \([^)]{3,}\)) — «[^»]{6,}»\. \S/;
const claveRotulo = (s) => s.replace(/\(.*?\)|（.*?）/g, '').replace(/\s*service router/i, '').replace(/NetEngine|NE|Router/g, '').replace(/[\s*]/g, '').toLowerCase();

function problemasDelPie(modelo, fuente) {
  const out = [];
  if (!PIE.test(fuente)) out.push('el pie no sigue «<documento>, p. N — «<rótulo>». …» ni «Galería de imágenes de productos de Info-Finder (<código>) — «<rótulo>». …»');
  const rotulo = (fuente.match(/«([^»]+)»/) || [])[1] || '';
  if (!rotulo.split(' / ').map(claveRotulo).includes(claveRotulo(modelo))) out.push(`el rótulo citado («${rotulo}») no nombra este modelo`);
  if (/^NE8000 [MF]/.test(modelo)) {
    const m = /variante (DC|AC)/.exec(fuente);
    if (!m) out.push('no dice qué variante de alimentación dibuja («variante DC»)');
    else if (!new RegExp('(también la|no publica por separado la) ' + (m[1] === 'DC' ? 'AC' : 'DC')).test(fuente)) out.push('no dice que el documento trae también la otra variante');
  }
  if (/^NetEngine A8\d\d E$/.test(modelo) && !(/una fuente AC/.test(fuente) && /doble AC/.test(fuente))) {
    out.push('no dice que dibuja la variante de una fuente AC y que hay doble AC');
  }
  return out;
}

const slug = (modelo) => modelo.toLowerCase().replace(/^netengine\s+/, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function planificar(carpeta, { modelos, vistas, aunqueMenor = false }) {
  const ruta = path.join(carpeta, 'procedencia.json');
  if (!fs.existsSync(ruta)) return { errores: [`falta ${ruta}`], cambios: [] };
  const proc = JSON.parse(fs.readFileSync(ruta, 'utf8'));
  const ids = new Set(modelos.map((m) => m.id));
  const errores = []; const cambios = []; const capturas = [];
  for (const [modelo, e] of Object.entries(proc)) {
    if (!ids.has(modelo)) { errores.push(`${modelo}: no está en el catálogo de Huawei`); continue; }
    const extra = Object.keys(e).filter((k) => !CARAS.includes(k) && k !== 'fuente' && k !== 'tamano' && k !== 'captura');
    if (extra.length) errores.push(`${modelo}: claves desconocidas (${extra.join(', ')}); las caras son front y rear`);
    if (typeof e.fuente !== 'string' || e.fuente.trim().length < 30) {
      errores.push(`${modelo}: sin procedencia escrita (documento o galería, código y rótulo)`); continue;
    }
    const pie = problemasDelPie(modelo, e.fuente.trim());
    if (pie.length) { for (const p of pie) errores.push(`${modelo}: ${p}`); continue; }
    // El tamaño del equipo lo pinta el pie: un modelo sin figura previa lo trae en la carpeta.
    const tamano = e.tamano || (vistas[modelo] && vistas[modelo].tamano);
    if (!/\d+(,\d+)? × \d+(,\d+)? × \d+(,\d+)? mm/.test(tamano || '')) {
      errores.push(`${modelo}: falta «tamano» («Al × An × Fo mm», de su ficha)`); continue;
    }
    const captura = typeof e.captura === 'string' ? path.join(carpeta, e.captura) : null;
    const dc = captura && fs.existsSync(captura) ? dimensiones(fs.readFileSync(captura)) : null;
    if (!dc) { errores.push(`${modelo}: falta «captura», la ficha de la galería como se ve en el navegador (PNG, JPEG o WebP)`); continue; }
    capturas.push({ modelo, origen: captura });
    const caras = CARAS.filter((c) => e[c]);
    if (!caras.length) { errores.push(`${modelo}: no trae ni front ni rear`); continue; }
    for (const cara of caras) {
      const archivo = path.join(carpeta, e[cara]);
      if (!fs.existsSync(archivo)) { errores.push(`${modelo} ${cara}: no existe ${e[cara]}`); continue; }
      const d = dimensiones(fs.readFileSync(archivo));
      if (!d) { errores.push(`${modelo} ${cara}: ${e[cara]} no es PNG, JPEG ni WebP`); continue; }
      if (d.tipo === 'webp' && !d.sinPerdida) { errores.push(`${modelo} ${cara}: ${e[cara]} es WebP con pérdida; hace falta el original`); continue; }
      const actual = vistas[modelo] && vistas[modelo][cara];
      let antes = null;
      if (actual && fs.existsSync(path.join(RAIZ, 'public', actual))) antes = dimensiones(fs.readFileSync(path.join(RAIZ, 'public', actual)));
      if (antes && d.ancho * d.alto < antes.ancho * antes.alto && !aunqueMenor) {
        errores.push(`${modelo} ${cara}: la nueva (${d.ancho} × ${d.alto}) es menor que la actual (${antes.ancho} × ${antes.alto}); --aunque-menor si es a propósito`);
        continue;
      }
      // La ruta actual se conserva (la A816 E es hw-a816e-…); pero si otro modelo comparte el
      // archivo (el AR8140 y el AR8140-T publican la misma figura), escribir encima cambiaría
      // también la del hermano sin decirlo: la nueva va a su propio archivo.
      const compartida = actual && Object.entries(vistas).some(([k, v]) => k !== modelo && v && v[cara] === actual);
      const destino = actual && !compartida ? actual : `/img/equipos/hw-${slug(modelo)}-${cara}.webp`;
      cambios.push({ modelo, cara, origen: archivo, tipo: d.tipo, ancho: d.ancho, alto: d.alto,
        antes: antes ? `${antes.ancho} × ${antes.alto}` : null, compartida: !!compartida,
        destino, fuente: e.fuente.trim(), tamano });
    }
  }
  return { errores, cambios, capturas };
}

function aWebpSinPerdida(origen, destino, tipo) {
  if (tipo === 'webp') { fs.copyFileSync(origen, destino); return; }
  execFileSync('cwebp', ['-quiet', '-lossless', '-exact', '-metadata', 'none', origen, '-o', destino]);
  const d = dimensiones(fs.readFileSync(destino));
  if (!d || !d.sinPerdida) throw new Error(`${destino}: cwebp no produjo un WebP sin pérdida`);
}

// La rama de capturas se arma con la fontanería de git (hash-object, mktree, commit-tree): un
// commit huérfano con capturas/<modelo>.<ext> y procedencia.json, sin tocar el árbol de trabajo
// ni la rama en curso. Si la rama ya existe no se pisa: el nombre lleva la fecha y la hora.
function ramaDeCapturas(plan, carpeta, { cwd = RAIZ, ahora = new Date() } = {}) {
  const git = (args, input) => execFileSync('git', args, { cwd, input, encoding: 'utf8' }).trim();
  const sello = ahora.toISOString().replace(/[-:]/g, '').replace('T', '-').slice(0, 13);
  const rama = `fuente/figuras-huawei-${sello}`;
  try { git(['rev-parse', '--verify', '--quiet', `refs/heads/${rama}`]); throw new Error(`la rama ${rama} ya existe`); } catch (e) {
    if (/ya existe/.test(e.message)) throw e;
  }
  const blob = (archivo) => git(['hash-object', '-w', '--', archivo]);
  const filas = plan.capturas.map((c) => `100644 blob ${blob(c.origen)}	${slug(c.modelo)}${path.extname(c.origen).toLowerCase()}`);
  const sub = git(['mktree'], filas.join('\n') + '\n');
  const raiz = git(['mktree'], `040000 tree ${sub}\tcapturas\n100644 blob ${blob(path.join(carpeta, 'procedencia.json'))}\tprocedencia.json\n`);
  const commit = git(['commit-tree', raiz, '-m', `Capturas de la galería de Info-Finder de ${plan.capturas.length} figura(s) de Huawei`]);
  git(['update-ref', `refs/heads/${rama}`, commit]);
  return rama;
}

function escribirLock(lock) {
  const orden = {};
  for (const k of Object.keys(lock).sort()) orden[k] = lock[k];
  const texto = JSON.stringify(orden, null, 1).replace(/\[\n\s+(\d+),\n\s+(\d+)\n\s+\]/g, '[$1, $2]');
  fs.writeFileSync(LOCK_RUTA, texto + '\n');
}

function aplicar(plan, vistas, lock) {
  for (const c of plan.cambios) {
    lock[c.destino] = [c.ancho, c.alto];
    aWebpSinPerdida(c.origen, path.join(RAIZ, 'public', c.destino), c.tipo);
    vistas[c.modelo] = vistas[c.modelo] || {};
    vistas[c.modelo][c.cara] = c.destino;
    vistas[c.modelo].fuente = c.fuente;
    vistas[c.modelo].tamano = c.tamano;
  }
  return vistas;
}

function main(argv) {
  const args = argv.slice(2);
  const carpeta = args.find((a) => !a.startsWith('--'));
  if (!carpeta) { console.error('Uso: npm run figuras-huawei -- <carpeta> [--aplicar] [--aunque-menor]'); return 1; }
  const { MODELS } = require('../server/seed/legacyData/huawei');
  const vistas = JSON.parse(fs.readFileSync(JSON_RUTA, 'utf8'));
  const plan = planificar(carpeta, { modelos: MODELS, vistas, aunqueMenor: args.includes('--aunque-menor') });
  for (const c of plan.cambios) console.log(`  ${c.modelo} ${c.cara}: ${c.antes || 'sin figura'} → ${c.ancho} × ${c.alto} (${c.tipo}) → ${c.destino}${c.compartida ? ' (deja de compartir la figura con su hermano)' : ''}`);
  for (const e of plan.errores) console.log(`  RECHAZADA  ${e}`);
  if (plan.errores.length) { console.log(`\n${plan.errores.length} figura(s) rechazada(s): no se escribe nada hasta corregirlas.`); return 2; }
  if (!args.includes('--aplicar')) { console.log('\nDry-run: no se escribió nada. Relanza con --aplicar.'); return 0; }
  const nuevas = plan.cambios.some((c) => c.tipo !== 'webp');
  if (nuevas) {
    try { execFileSync('cwebp', ['-version'], { stdio: 'ignore' }); } catch {
      console.error('Falta cwebp (libwebp) para convertir sin pérdida: brew install webp · apt-get install webp'); return 1;
    }
  }
  fs.mkdirSync(IMG_DIR, { recursive: true });
  // La rama primero: si git falla, no queda nada escrito a medias.
  const rama = ramaDeCapturas(plan, carpeta);
  const lock = JSON.parse(fs.readFileSync(LOCK_RUTA, 'utf8'));
  fs.writeFileSync(JSON_RUTA, JSON.stringify(aplicar(plan, vistas, lock), null, 2) + '\n');
  escribirLock(lock);
  console.log(`\n${plan.cambios.length} figura(s) escritas sin pérdida y ${path.relative(RAIZ, JSON_RUTA)} y ${path.relative(RAIZ, LOCK_RUTA)} actualizados.`);
  console.log(`Capturas en la rama ${rama} (fuera de main). Súbela para revisarla: git push origin ${rama}`);
  return 0;
}

if (require.main === module) process.exit(main(process.argv));

module.exports = { dimensiones, planificar, problemasDelPie, ramaDeCapturas, slug };
