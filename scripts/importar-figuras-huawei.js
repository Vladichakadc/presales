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
// «fuente» sustituye a la del modelo: tiene que describir las caras que quedan publicadas.

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const RAIZ = path.join(__dirname, '..');
const JSON_RUTA = path.join(RAIZ, 'public', 'data', 'huawei-vistas-equipos.json');
const IMG_DIR = path.join(RAIZ, 'public', 'img', 'equipos');
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

const slug = (modelo) => modelo.toLowerCase().replace(/^netengine\s+/, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function planificar(carpeta, { modelos, vistas, aunqueMenor = false }) {
  const ruta = path.join(carpeta, 'procedencia.json');
  if (!fs.existsSync(ruta)) return { errores: [`falta ${ruta}`], cambios: [] };
  const proc = JSON.parse(fs.readFileSync(ruta, 'utf8'));
  const ids = new Set(modelos.map((m) => m.id));
  const errores = []; const cambios = [];
  for (const [modelo, e] of Object.entries(proc)) {
    if (!ids.has(modelo)) { errores.push(`${modelo}: no está en el catálogo de Huawei`); continue; }
    const extra = Object.keys(e).filter((k) => !CARAS.includes(k) && k !== 'fuente');
    if (extra.length) errores.push(`${modelo}: claves desconocidas (${extra.join(', ')}); las caras son front y rear`);
    if (typeof e.fuente !== 'string' || e.fuente.trim().length < 30) {
      errores.push(`${modelo}: sin procedencia escrita (documento o galería, código y rótulo)`); continue;
    }
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
        destino, fuente: e.fuente.trim() });
    }
  }
  return { errores, cambios };
}

function aWebpSinPerdida(origen, destino, tipo) {
  if (tipo === 'webp') { fs.copyFileSync(origen, destino); return; }
  execFileSync('cwebp', ['-quiet', '-lossless', '-exact', '-metadata', 'none', origen, '-o', destino]);
  const d = dimensiones(fs.readFileSync(destino));
  if (!d || !d.sinPerdida) throw new Error(`${destino}: cwebp no produjo un WebP sin pérdida`);
}

function aplicar(plan, vistas) {
  for (const c of plan.cambios) {
    aWebpSinPerdida(c.origen, path.join(RAIZ, 'public', c.destino), c.tipo);
    vistas[c.modelo] = vistas[c.modelo] || {};
    vistas[c.modelo][c.cara] = c.destino;
    vistas[c.modelo].fuente = c.fuente;
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
  fs.writeFileSync(JSON_RUTA, JSON.stringify(aplicar(plan, vistas), null, 2) + '\n');
  console.log(`\n${plan.cambios.length} figura(s) escritas sin pérdida y ${path.relative(RAIZ, JSON_RUTA)} actualizado.`);
  return 0;
}

if (require.main === module) process.exit(main(process.argv));

module.exports = { dimensiones, planificar, slug };
