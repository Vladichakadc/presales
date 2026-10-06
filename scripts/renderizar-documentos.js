'use strict';
/* TRAE EL TEXTO DE UNA PÁGINA QUE SOLO EXISTE DESPUÉS DE EJECUTAR SU JAVASCRIPT (2026-10-06).
 *
 * Las descripciones de hardware de Huawei (`support.huawei.com/enterprise/en/doc/EDOC…`) son
 * las que dicen cuántas fuentes vienen de serie en cada AR, qué módulo usa cada uno y la
 * capacidad de conmutación de cada A800 E. La primera corrida de `traer-cisco-huawei.yml` las
 * pidió con `fetch` y recibió once veces un 200 de 3.800 bytes: el cascarón de la aplicación,
 * sin una línea del documento. La validación por contenido hizo su trabajo —no se guardó un
 * cascarón como si fuera la ficha—, pero el documento no llega sin un navegador.
 *
 * Esto es ese navegador, y NO EXTRAE NADA: guarda el texto que pinta cada marco de la página,
 * los enlaces (para descubrir en el índice las páginas de los demás modelos) y las peticiones
 * que hizo la página, para poder diagnosticar si el contenido llega por otra ruta o pide
 * sesión. La lectura sigue siendo humana y el dato entra por los importadores.
 *
 * LA FIRMA DEL CONTENIDO MANDA SOBRE EL CÓDIGO HTTP, como en el resto de transportes: una
 * página cuenta como traída solo si algún marco contiene el texto que solo puede estar en el
 * documento correcto. Lo demás se guarda igual —es el diagnóstico— pero el informe dice que no
 * se encontró.
 *
 * Corre en un job SIN permiso de escritura (`traer-cisco-huawei.yml`, job `renderizar`): instala
 * Playwright, y una dependencia comprometida no debe tener a mano un token que empuje.
 *
 *   node scripts/renderizar-documentos.js --lista lista.json --salida dir/
 *
 * `lista.json` es un array de `{archivo, url, debeContener}`; `archivo` es el nombre del JSON
 * que se escribe en `--salida`.
 */
const fs = require('fs');
const path = require('path');

const ESPERA_MS = 45000;
const MAX_PETICIONES = 300;
const MAX_TEXTO = 400000;

// Lo que se acepta en la lista, comprobado antes de abrir un navegador: un `archivo` que
// escapara del directorio de salida, o una URL que no fuera https, se rechazan aquí.
function validarLista(lista) {
  if (!Array.isArray(lista) || !lista.length) throw new Error('la lista está vacía o no es un array');
  const vistos = new Set();
  for (const e of lista) {
    if (!e || typeof e !== 'object') throw new Error('entrada que no es un objeto');
    if (!/^[a-z0-9][a-z0-9.-]*\.json$/.test(e.archivo || '')) throw new Error(`archivo no válido: «${e.archivo}»`);
    if (vistos.has(e.archivo)) throw new Error(`archivo repetido: ${e.archivo}`);
    vistos.add(e.archivo);
    let u;
    try { u = new URL(e.url); } catch { throw new Error(`${e.archivo}: URL no válida`); }
    if (u.protocol !== 'https:') throw new Error(`${e.archivo}: solo https`);
    if (typeof e.debeContener !== 'string' || e.debeContener.length < 3) {
      throw new Error(`${e.archivo}: sin «debeContener», no hay forma de distinguir el documento del cascarón`);
    }
  }
  return lista;
}

function argumento(nombre) {
  const i = process.argv.indexOf(nombre);
  return i > 0 ? process.argv[i + 1] : null;
}

async function textoDeMarcos(page) {
  const marcos = [];
  for (const f of page.frames()) {
    try {
      const texto = await f.evaluate(() => (globalThis.document.body ? globalThis.document.body.innerText : ''));
      marcos.push({ url: f.url(), texto: String(texto || '').slice(0, MAX_TEXTO) });
    } catch (e) {
      marcos.push({ url: f.url(), error: String(e.message || e) });
    }
  }
  return marcos;
}

async function enlacesDeMarcos(page) {
  const out = new Set();
  for (const f of page.frames()) {
    try {
      const hrefs = await f.evaluate(() => [...globalThis.document.querySelectorAll('a[href]')].map((a) => a.href));
      for (const h of hrefs) if (/^https:/.test(h)) out.add(h);
    } catch { /* un marco que se fue mientras se leía */ }
  }
  return [...out];
}

async function renderizar(page, entrada) {
  const peticiones = [];
  const alResponder = (r) => {
    if (peticiones.length >= MAX_PETICIONES) return;
    const tipo = r.request().resourceType();
    if (!['document', 'xhr', 'fetch'].includes(tipo)) return;
    peticiones.push({ url: r.url(), status: r.status(), tipo, contenido: r.headers()['content-type'] || null });
  };
  page.on('response', alResponder);
  const resultado = { url: entrada.url, debeContener: entrada.debeContener, fecha: new Date().toISOString() };
  try {
    const resp = await page.goto(entrada.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    resultado.status = resp ? resp.status() : null;
    const limite = Date.now() + ESPERA_MS;
    let marcos = [];
    while (Date.now() < limite) {
      marcos = await textoDeMarcos(page);
      if (marcos.some((m) => (m.texto || '').includes(entrada.debeContener))) break;
      await page.waitForTimeout(1500);
    }
    resultado.urlFinal = page.url();
    resultado.titulo = await page.title().catch(() => null);
    resultado.marcos = await textoDeMarcos(page);
    resultado.encontrado = resultado.marcos.some((m) => (m.texto || '').includes(entrada.debeContener));
    resultado.enlaces = await enlacesDeMarcos(page);
  } catch (e) {
    resultado.error = String(e.message || e);
    resultado.encontrado = false;
  }
  page.off('response', alResponder);
  resultado.peticiones = peticiones;
  return resultado;
}

async function main() {
  const rutaLista = argumento('--lista');
  const salida = argumento('--salida');
  if (!rutaLista || !salida) {
    console.error('Uso: node scripts/renderizar-documentos.js --lista lista.json --salida dir/');
    process.exit(2);
  }
  const lista = validarLista(JSON.parse(fs.readFileSync(rutaLista, 'utf8')));
  fs.mkdirSync(salida, { recursive: true });

  const { requerirPlaywright, opcionesDeLanzamiento } = require('./ayuda/chromium');
  const { chromium } = requerirPlaywright();
  const browser = await chromium.launch(opcionesDeLanzamiento());
  const contexto = await browser.newContext({ locale: 'en-US', viewport: { width: 1366, height: 900 } });
  const informe = [];
  for (const entrada of lista) {
    const page = await contexto.newPage();
    const r = await renderizar(page, entrada);
    await page.close();
    fs.writeFileSync(path.join(salida, entrada.archivo), JSON.stringify(r, null, 2));
    const bytes = (r.marcos || []).reduce((s, m) => s + (m.texto || '').length, 0);
    informe.push({ archivo: entrada.archivo, url: entrada.url, encontrado: r.encontrado, status: r.status || null,
      marcos: (r.marcos || []).length, caracteres: bytes, enlaces: (r.enlaces || []).length, error: r.error || null });
    console.log(`${r.encontrado ? 'OK   ' : 'FALLA'}  ${entrada.archivo}  (${r.status || r.error}, ${bytes} caracteres en ${(r.marcos || []).length} marcos)`);
  }
  await browser.close();
  fs.writeFileSync(path.join(salida, 'informe-render.json'), JSON.stringify(informe, null, 2));
}

if (require.main === module) {
  main().catch((e) => { console.error(e); process.exit(1); });
}

module.exports = { validarLista, renderizar };
