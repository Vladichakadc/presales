#!/usr/bin/env node
'use strict';
// Regenera el PDF del manual de usuario final a partir de docs/manual-usuario/manual.html.
//
// POR QUE ESTE SCRIPT Y NO UN GENERADOR DE PDF EN NODE
// El manual se escribe como una pagina HTML normal -mismos colores, tipografias y
// convenciones visuales que la propia aplicacion (Barlow / Barlow Condensed / IBM Plex Mono,
// paleta de :root)- y se imprime a PDF con Chromium sin cabeza, que es quien mejor respeta
// esa maquetacion (saltos de pagina, tablas con cabecera repetida, cajas que no se cortan a
// la mitad via `page-break-inside:avoid`). Volver a describir el mismo documento con una
// libreria de generacion de PDF en Python o Node habria significado mantener dos fuentes de
// verdad del mismo contenido.
//
// POR QUE LAS TIPOGRAFIAS ESTAN COMMITEADAS EN docs/manual-usuario/fonts/ Y NO SE BAJAN DE
// GOOGLE FONTS EN CADA REGENERACION
// El Chromium que trae este entorno no confia en el certificado del proxy de salida de la
// organizacion, aunque curl si -curl usa el almacen de confianza del sistema, la copia de
// Chromium que trae Playwright no-, asi que una peticion a fonts.googleapis.com termina en
// ERR_CONNECTION_RESET dentro del navegador aunque la misma URL responda 200 por curl. La
// solucion no es bajar la verificacion TLS del navegador: es no depender de la red para esto.
// Los diez archivos .ttf de docs/manual-usuario/fonts/ son exactamente los que Google Fonts
// serviria para Barlow, Barlow Condensed e IBM Plex Mono en los pesos que usa el manual, y
// docs/manual-usuario/fonts/local.css los declara con @font-face y rutas relativas: el
// render no toca la red en ningun momento.
//
// COMO SE USA
//     npm run manual
//
// Escribe docs/manual-usuario/Manual de uso - Dimensionadores y BOM.pdf. Si cambia el
// contenido de manual.html, basta con volver a correr este script; no hace falta tocar nada
// mas.
//
// REQUIERE PLAYWRIGHT, A PROPOSITO FUERA DE package.json
// Este manual no forma parte de la aplicacion -no la sirve, no la prueba, no la despliega-
// y Playwright con un Chromium descargado pesa varios cientos de MB. Anadirlo a las
// dependencias obligaria a bajar eso en cada `npm install` de este repo, para una tarea que
// se corre pocas veces al ano. El script busca Playwright en las rutas donde ya vive en el
// entorno de trabajo habitual del equipo; si no lo encuentra, dice exactamente que instalar.

const path = require('path');
const fs = require('fs');

const RUTAS_PLAYWRIGHT = ['playwright', '/opt/node22/lib/node_modules/playwright'];
const RUTAS_CHROMIUM = ['/opt/pw-browsers/chromium-1194/chrome-linux/chrome'];

function requerirPlaywright() {
  for (const ruta of RUTAS_PLAYWRIGHT) {
    try { return require(ruta); } catch { /* probar la siguiente */ }
  }
  console.error('No se encontro el paquete "playwright". Instalalo sin guardarlo en '
    + 'package.json y trae un Chromium:\n\n'
    + '    npm install --no-save playwright\n'
    + '    npx playwright install chromium\n');
  process.exit(1);
}

function chromiumDisponible() {
  return RUTAS_CHROMIUM.find((r) => fs.existsSync(r));
}

const { chromium } = requerirPlaywright();

const DIR = path.join(__dirname, '..', 'docs', 'manual-usuario');
const ORIGEN = path.join(DIR, 'manual.html');
const DESTINO = path.join(DIR, 'Manual de uso - Dimensionadores y BOM.pdf');
const CHROMIUM = chromiumDisponible();

async function generar() {
  // Sin ruta conocida, se deja que Playwright use el Chromium que haya instalado el
  // propio paquete -es lo correcto fuera de este entorno, donde no existe /opt/pw-browsers.
  const b = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {});
  try {
    const p = await b.newPage();
    await p.goto('file://' + ORIGEN, { waitUntil: 'load' });
    // eslint-disable-next-line no-undef -- corre dentro de la pagina, no en Node
    await p.evaluate(() => document.fonts.ready);
    await p.waitForTimeout(300);
    await p.pdf({
      path: DESTINO,
      format: 'A4',
      printBackground: true,
      margin: { top: '0', bottom: '0', left: '0', right: '0' },
    });
  } finally {
    await b.close();
  }
  console.log(`Escrito: ${path.relative(process.cwd(), DESTINO)}`);
}

if (require.main === module) {
  generar().catch((e) => { console.error('No se pudo generar el manual:', e.message); process.exit(1); });
}

module.exports = { generar };
