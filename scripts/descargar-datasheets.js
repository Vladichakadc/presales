#!/usr/bin/env node
'use strict';
// Descarga los datasheets oficiales de HPE/Aruba a public/datasheets/.
//
// POR QUE EXISTE ESTE SCRIPT Y NO LOS ARCHIVOS YA COMMITEADOS
// El entorno donde se genero el catalogo de Aruba tiene bloqueado el egreso de red hacia
// los dominios de HPE (denegacion 403 de la politica de la organizacion), asi que los PDF
// no se pudieron traer alli. Este script deja la operacion en un solo comando desde
// cualquier maquina con salida a internet:
//
//     npm run datasheets            descarga lo que falte
//     npm run datasheets -- --force vuelve a bajar todo, para refrescar versiones
//     npm run datasheets -- --list  solo muestra que se bajaria, sin tocar la red
//
// La lista de documentos vive en server/seed/legacyData/aruba.js (DATASHEETS), que es la
// misma fuente que consume la aplicacion: no hay un segundo listado que se desincronice.
//
// QUE PASA CON LOS QUE NO SON PDF DIRECTO
// Varias URLs de HPE son paginas de aterrizaje que entregan el PDF tras un redirect con
// javascript o un formulario. El script lo detecta —comprueba la firma %PDF del contenido,
// no solo el Content-Type, que HPE no siempre envia bien— y las reporta aparte en vez de
// guardar un HTML con extension .pdf, que es la forma silenciosa de romper esto.

const fs = require('fs');
const path = require('path');
const https = require('https');
const { URL } = require('url');

const { DATASHEETS } = require('../server/seed/legacyData/aruba');

const DESTINO = path.join(__dirname, '..', 'public', 'datasheets');
const args = process.argv.slice(2);
const FORCE = args.includes('--force');
const LIST = args.includes('--list');
const MAX_REDIRECTS = 5;
const TIMEOUT_MS = 45000;
const REINTENTOS = 2;

const espera = (ms) => new Promise((r) => setTimeout(r, ms));

function descargar(url, redirects = 0) {
  return new Promise((resolve, reject) => {
    if (redirects > MAX_REDIRECTS) return reject(new Error('demasiados redirects'));
    const req = https.get(url, {
      headers: {
        // Cabeceras de un navegador real: HPE frena en seco una rafaga de peticiones que
        // solo llevan User-Agent y nada mas -eso es lo que distingue a un scraper de una
        // persona navegando, mas que la propia identidad del cliente.
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
          + '(KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
        Accept: 'application/pdf,text/html,*/*',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
        Referer: 'https://www.hpe.com/us/en/aruba-networking.html',
      },
      timeout: TIMEOUT_MS,
    }, (res) => {
      const { statusCode, headers } = res;
      if (statusCode >= 300 && statusCode < 400 && headers.location) {
        res.resume();
        const siguiente = new URL(headers.location, url).toString();
        return resolve(descargar(siguiente, redirects + 1));
      }
      if (statusCode !== 200) {
        res.resume();
        return reject(new Error(`HTTP ${statusCode}`));
      }
      const trozos = [];
      res.on('data', (c) => trozos.push(c));
      res.on('end', () => resolve({ buf: Buffer.concat(trozos), tipo: headers['content-type'] || '' }));
      res.on('error', reject);
    });
    req.on('timeout', () => { req.destroy(new Error('timeout')); });
    req.on('error', reject);
  });
}

// La firma manda sobre el Content-Type: es lo unico que distingue de verdad un PDF de una
// pagina de aterrizaje servida con la cabecera equivocada.
const esPdf = (buf) => buf.length > 4 && buf.subarray(0, 5).toString('latin1') === '%PDF-';

// Un timeout o un 403 sueltos, en medio de una tanda de 24 peticiones seguidas, son la firma
// de un limite de ritmo -no de que el documento no exista-, asi que valen un reintento con
// espera creciente antes de darse por vencido. Un 404 no se reintenta: ese es un error real.
async function descargarConReintentos(url) {
  for (let intento = 0; ; intento++) {
    try {
      return await descargar(url);
    } catch (err) {
      const esTransitorio = /timeout|HTTP 403|HTTP 429|HTTP 5\d\d|ECONNRESET/.test(err.message);
      if (!esTransitorio || intento >= REINTENTOS) throw err;
      await espera(3000 * (intento + 1) + Math.random() * 2000);
    }
  }
}

async function main() {
  const docs = Object.entries(DATASHEETS);
  if (!fs.existsSync(DESTINO)) fs.mkdirSync(DESTINO, { recursive: true });

  if (LIST) {
    console.log(`${docs.length} documentos en el manifiesto:\n`);
    for (const [clave, d] of docs) {
      const destino = path.join(DESTINO, d.file);
      const estado = fs.existsSync(destino) ? 'ya presente' : 'falta';
      console.log(`  ${clave.padEnd(14)} ${d.file.padEnd(38)} ${estado}`);
      console.log(`  ${''.padEnd(14)} ${d.url || '(sin URL — fuente elaborada localmente)'}`);
    }
    return 0;
  }

  const ok = [], omitidos = [], noPdf = [], fallidos = [];

  for (const [clave, d] of docs) {
    const destino = path.join(DESTINO, d.file);
    // Sin `url` no es un PDF de HPE que bajar: es una fuente que este catálogo elaboró a
    // mano (ver DATASHEETS.priceList en aruba.js) y que ya vive en el repo.
    if (!d.url) {
      omitidos.push(d.file);
      console.log(`· ${d.file} — sin URL (fuente elaborada localmente), se omite`);
      continue;
    }
    if (!FORCE && fs.existsSync(destino)) {
      omitidos.push(d.file);
      console.log(`· ${d.file} — ya presente, se omite (--force para rebajarlo)`);
      continue;
    }
    process.stdout.write(`↓ ${d.file} … `);
    try {
      const { buf, tipo } = await descargarConReintentos(d.url);
      if (!esPdf(buf)) {
        noPdf.push({ clave, file: d.file, url: d.url, tipo });
        console.log(`no es un PDF directo (${tipo.split(';')[0] || 'sin tipo'}) — se omite`);
        continue;
      }
      fs.writeFileSync(destino, buf);
      ok.push({ file: d.file, kb: Math.round(buf.length / 1024) });
      console.log(`${Math.round(buf.length / 1024)} KB`);
    } catch (err) {
      fallidos.push({ clave, file: d.file, url: d.url, motivo: err.message });
      console.log(`ERROR: ${err.message}`);
    }
    // Pausa entre documentos, no solo entre reintentos: 24 peticiones seguidas sin respiro
    // es justo el patron que un limite de ritmo detecta, aunque cada una individualmente
    // luzca como un navegador.
    await espera(1500 + Math.random() * 1500);
  }

  console.log('\n─────────────────────────────────────────────');
  console.log(`Descargados: ${ok.length}   Ya presentes: ${omitidos.length}   `
    + `No son PDF directo: ${noPdf.length}   Fallidos: ${fallidos.length}`);
  if (ok.length) {
    const totalKb = ok.reduce((a, x) => a + x.kb, 0);
    console.log(`Tamano total descargado: ${(totalKb / 1024).toFixed(1)} MB`);
  }
  if (noPdf.length) {
    console.log('\nEstos hay que guardarlos a mano desde el navegador (son paginas de aterrizaje):');
    for (const n of noPdf) console.log(`  ${n.file}\n    ${n.url}`);
  }
  if (fallidos.length) {
    console.log('\nFallidos:');
    for (const f of fallidos) console.log(`  ${f.file} — ${f.motivo}\n    ${f.url}`);
  }
  console.log('\nLos PDF presentes se sirven desde /datasheets/ detras del muro de');
  console.log('autenticacion; la pagina enlaza la copia local y cae a la URL oficial si falta.');
  console.log('Para que produccion los sirva hay que commitearlos: el contenedor se');
  console.log('reconstruye desde git en cada despliegue.');

  // Codigo de salida distinto de cero solo si algo fallo de verdad. Que una URL sea una
  // pagina de aterrizaje es esperado y esta reportado, no es un fallo del script.
  return fallidos.length ? 1 : 0;
}

main().then((c) => process.exit(c)).catch((e) => { console.error(e); process.exit(1); });
