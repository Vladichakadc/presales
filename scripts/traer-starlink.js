'use strict';
/* TRAE LAS ESPECIFICACIONES OFICIALES DE STARLINK PARA CONTRASTAR legacyData/starlink.js
 *
 *     node scripts/traer-starlink.js [--salida=fuente-starlink] [--sin-navegador]
 *
 * POR QUE EXISTE. El catalogo de Starlink entro el 2026-09-24 SIN VERIFICAR: el proxy de
 * egreso del entorno donde se edita este repositorio corta starlink.com (medido ese dia,
 * `curl` no conecta). Los ejecutores de GitHub Actions no pasan por ese proxy —es la via ya
 * aprobada aqui para Fortinet y Juniper—, asi que `traer-starlink.yml` corre este script alli
 * y publica lo que traiga en la rama de transporte `fuente/starlink-specs`. Tambien se puede
 * correr desde cualquier maquina con salida.
 *
 * NO EXTRAE NADA. Guarda los documentos y su texto; la transcripcion a `legacyData/starlink.js`
 * sigue siendo humana y deja diff en git. Automatizar la lectura de una ficha es justo donde
 * se cuela el dato de otro kit — la misma regla que los importadores de este repositorio.
 *
 * EL CONTENIDO MANDA SOBRE EL CODIGO HTTP, y aqui por dos motivos:
 *   1. Un PDF que responde 200 con la pagina de error en HTML es un 404 disfrazado: se exige
 *      la firma `%PDF`.
 *   2. starlink.com es una aplicacion que monta la pagina con JavaScript. Un `fetch` devuelve
 *      el esqueleto — 200, cientos de KB, y ni una especificacion dentro. Por eso la pagina
 *      se RENDERIZA en Chromium y el texto resultante se juzga con `juzgarTexto()`: tiene que
 *      nombrar un kit y traer varias magnitudes de ficha (W, kg, mm, IP, grados). Un texto
 *      que no las trae se reporta como vacio, con su motivo, en vez de publicarse como
 *      fuente buena. Es el riesgo que se declaro al proponer este script.
 *
 * UN FALLO NO TUMBA LA CORRIDA. Cada intento queda en `informe.json` con su codigo o su
 * motivo: un informe que dice «no se pudo» con el por que vale; uno que se calla los fallos
 * para salir en verde, no. Sale con codigo 1 solo si no se guardo NADA util.
 */
const fs = require('fs');
const path = require('path');

// Nombres con los que Starlink rotula sus kits. Se buscan en el texto para saber QUE kit
// describe una pagina: el orden de las pestañas de la web no es un dato estable.
const KITS = ['Standard Actuated', 'Flat High Performance', 'High Performance', 'Performance',
  'Enterprise', 'Standard', 'Mini'];

// Rutas candidatas de las fichas en PDF. Son candidatas y no conocidas: se prueban todas y
// el informe dice cual respondio. Dos hosts porque Starlink ha servido sus archivos
// publicos desde los dos.
const PDFS = ['standard', 'mini', 'performance', 'flat_high_performance', 'enterprise', 'standard_actuated']
  .map((kit) => ({
    archivo: `ficha-${kit.replace(/_/g, '-')}.pdf`,
    urls: [
      `https://api.starlink.com/public-files/specification_sheet_${kit}.pdf`,
      `https://www.starlink.com/public-files/specification_sheet_${kit}.pdf`,
    ],
  }));

// La pagina de especificaciones, sin parametro y con cada pestaña. Se piden de mas a
// proposito: una pestaña que no existe devuelve la misma pagina que otra, y eso se ve en
// el informe (mismo kit detectado) sin hacer daño.
const PAGINAS = [null, 1, 2, 3, 4, 5, 6, 7, 8].map((n) => ({
  archivo: n == null ? 'pagina-especificaciones' : `pagina-spec-${n}`,
  url: `https://www.starlink.com/specifications${n == null ? '' : `?spec=${n}`}`,
}));

// Magnitudes que una ficha de hardware trae y un esqueleto de aplicacion no. Cada una
// cuenta una sola vez aunque aparezca cien veces.
const MAGNITUDES = [
  ['vatios', /\b\d{1,3}\s?(?:-|–|to)?\s?\d{0,3}\s?W\b/],
  ['kilos', /\b\d+(?:[.,]\d+)?\s?kg\b/i],
  ['milimetros', /\b\d{2,4}(?:[.,]\d+)?\s?mm\b/i],
  ['proteccion', /\bIP\s?\d{2}\b/],
  ['grados', /\b\d{2,3}\s?°/],
];
const MINIMO_MAGNITUDES = 3;

// Juzga si un texto renderizado es una ficha de especificaciones o un esqueleto. Pura, para
// poder probarla en Node: es la unica pieza de este script cuyo error pasaria en verde.
function juzgarTexto(texto) {
  const t = String(texto || '');
  const magnitudes = MAGNITUDES.filter(([, re]) => re.test(t)).map(([n]) => n);
  // El nombre mas largo primero: «Flat High Performance» no debe contarse ademas como
  // «Performance» ni como «High Performance».
  const kits = [];
  let resto = t;
  for (const k of KITS) {
    const re = new RegExp(`\\b${k}\\b`, 'i');
    if (re.test(resto)) {
      kits.push(k);
      resto = resto.replace(new RegExp(`\\b${k}\\b`, 'gi'), ' ');
    }
  }
  if (t.trim().length < 300) return { ok: false, motivo: `texto de ${t.trim().length} caracteres: la pagina no se monto`, magnitudes, kits };
  if (!kits.length) return { ok: false, motivo: 'no nombra ningun kit de Starlink', magnitudes, kits };
  if (magnitudes.length < MINIMO_MAGNITUDES) {
    return { ok: false, motivo: `solo ${magnitudes.length} de ${MAGNITUDES.length} magnitudes de ficha (${magnitudes.join(', ') || 'ninguna'}): parece un esqueleto o una pagina comercial`, magnitudes, kits };
  }
  return { ok: true, motivo: '', magnitudes, kits };
}

async function traerPdfs(salida) {
  const informe = [];
  for (const doc of PDFS) {
    const intentos = [];
    let guardado = false;
    for (const url of doc.urls) {
      let res;
      try {
        res = await fetch(url, { headers: { 'User-Agent': 'presales-traer-fuente/1.0' } });
      } catch (e) { intentos.push({ url, error: String(e.message || e) }); continue; }
      if (!res.ok) { intentos.push({ url, status: res.status }); continue; }
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.subarray(0, 4).toString() !== '%PDF') {
        intentos.push({ url, status: res.status, firma: buf.subarray(0, 8).toString('hex'), nota: 'no es un PDF' });
        continue;
      }
      fs.writeFileSync(path.join(salida, doc.archivo), buf);
      intentos.push({ url, status: res.status, bytes: buf.length, guardado: true });
      guardado = true;
      break;
    }
    informe.push({ tipo: 'pdf', archivo: doc.archivo, guardado, intentos });
  }
  return informe;
}

async function traerPaginas(salida) {
  let playwright;
  try {
    playwright = require('./ayuda/chromium.js');
  } catch (e) {
    return [{ tipo: 'pagina', archivo: '-', guardado: false, intentos: [{ error: `sin resolvedor de navegador: ${e.message}` }] }];
  }
  const { chromium } = playwright.requerirPlaywright();
  const navegador = await chromium.launch(playwright.opcionesDeLanzamiento());
  const contexto = await navegador.newContext({ locale: 'en-US', viewport: { width: 1366, height: 1000 } });
  const informe = [];
  for (const p of PAGINAS) {
    const page = await contexto.newPage();
    const intento = { url: p.url };
    try {
      const res = await page.goto(p.url, { waitUntil: 'domcontentloaded', timeout: 45000 });
      intento.status = res ? res.status() : null;
      // Se espera al TEXTO, no a la red: una aplicacion con telemetria nunca queda en
      // `networkidle`. Si en 25 s no aparece una unidad de ficha, se juzga lo que haya.
      // eslint-disable-next-line no-undef -- corre dentro de la pagina, no en Node
      await page.waitForFunction(() => /\b\d+(?:[.,]\d+)?\s?(?:kg|mm)\b/i.test(document.body.innerText), null, { timeout: 25000 })
        .catch(() => { intento.nota = 'no aparecio ninguna unidad de ficha en 25 s'; });
      await page.waitForTimeout(1500);
      // eslint-disable-next-line no-undef -- corre dentro de la pagina, no en Node
      const texto = await page.evaluate(() => document.body.innerText);
      const juicio = juzgarTexto(texto);
      Object.assign(intento, { caracteres: texto.length, ...juicio });
      // El texto se guarda SIEMPRE, tambien el que no pasa: es lo que permite ver por que no
      // paso sin volver a correr nada. Lo que decide si cuenta como fuente es `ok`.
      fs.writeFileSync(path.join(salida, `${p.archivo}.txt`), texto);
      await page.screenshot({ path: path.join(salida, `${p.archivo}.png`), fullPage: true });
    } catch (e) {
      intento.error = String(e.message || e).split('\n')[0];
    }
    await page.close();
    informe.push({ tipo: 'pagina', archivo: `${p.archivo}.txt`, guardado: !!intento.ok, intentos: [intento] });
  }
  await navegador.close();
  return informe;
}

function imprimir(informe) {
  const lineas = [];
  for (const d of informe) {
    lineas.push(`${d.guardado ? 'OK   ' : 'FALLA'}  ${d.tipo.padEnd(6)}  ${d.archivo}`);
    for (const i of d.intentos) {
      const detalle = [i.status || i.error, i.url,
        i.kits && i.kits.length ? `kits: ${i.kits.join(', ')}` : '',
        i.magnitudes ? `magnitudes: ${i.magnitudes.length}` : '',
        i.motivo || i.nota ? `<- ${i.motivo || i.nota}` : ''].filter(Boolean).join('  ');
      lineas.push(`        ${detalle}`);
    }
  }
  return lineas.join('\n');
}

async function main() {
  const arg = (n, d) => { const a = process.argv.find((x) => x.startsWith(`--${n}=`)); return a ? a.split('=').slice(1).join('=') : d; };
  const salida = arg('salida', 'fuente-starlink');
  fs.mkdirSync(salida, { recursive: true });
  const informe = await traerPdfs(salida);
  if (!process.argv.includes('--sin-navegador')) informe.push(...await traerPaginas(salida));
  const fecha = new Date().toISOString();
  fs.writeFileSync(path.join(salida, 'informe.json'), JSON.stringify({ fecha, informe }, null, 2));
  const texto = imprimir(informe);
  fs.writeFileSync(path.join(salida, 'informe.txt'), `${fecha}\n${texto}\n`);
  console.log(texto);
  const utiles = informe.filter((d) => d.guardado).length;
  console.log(`\n${utiles} de ${informe.length} documentos utiles en ${salida}/`);
  if (!utiles) process.exit(1);
}

if (require.main === module) {
  main().catch((e) => { console.error(e); process.exit(1); });
}

module.exports = { juzgarTexto, PDFS, PAGINAS };
