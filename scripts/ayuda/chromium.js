'use strict';
/* DONDE VIVE PLAYWRIGHT Y DONDE VIVE CHROMIUM — resuelto en UN sitio.
 *
 * Tres scripts conducen un navegador (`verificar-pantallas.js`, `contraste-motor.js` y
 * `generar-manual-usuario.js`) y los tres llevaban su propia copia de esta resolucion. No era
 * teorico: la copia de `contraste-motor.js` fijaba `/opt/pw-browsers/...` sin alternativa y
 * pasaba SIEMPRE `executablePath`, asi que habria fallado en el ejecutor de GitHub —donde
 * Playwright se instala en `node_modules` y su Chromium en la cache del propio paquete— justo
 * al llevar el contraste a CI. Es la forma exacta que ya tuvo `llevarABom` en seis copias:
 * tres implementaciones de lo mismo que no hacen lo mismo.
 *
 * PLAYWRIGHT VA FUERA DE package.json A PROPOSITO. Un Chromium descargado pesa cientos de MB
 * y no tiene por que bajarse en cada `npm install` de un repositorio que no lo necesita para
 * nada mas. Los workflows lo instalan con `--no-save` en su propio job.
 *
 * EL ORDEN DE BUSQUEDA IMPORTA, Y ES EL QUE YA USABAN LOS DOS SCRIPTS QUE FUNCIONAN:
 *   1. `require('playwright')` — resuelve `./node_modules/playwright`, que es lo que hay en
 *      un ejecutor de Actions tras `npm install --no-save playwright`;
 *   2. la ruta global del entorno de trabajo habitual del equipo.
 * Y para el ejecutable: la primera ruta conocida QUE EXISTA; si no hay ninguna, no se pasa
 * `executablePath` y se deja que Playwright use el Chromium que el mismo descargo. Eso ultimo
 * es lo correcto fuera de este entorno, donde `/opt/pw-browsers` no existe.
 */
const fs = require('fs');

// `PLAYWRIGHT_PATH` y `CHROMIUM_PATH` van primero para poder apuntar a una instalacion
// concreta sin tocar codigo — util en una maquina que no sea ni este entorno ni un ejecutor.
const RUTAS_PLAYWRIGHT = [
  process.env.PLAYWRIGHT_PATH,
  'playwright',
  '/opt/node22/lib/node_modules/playwright',
].filter(Boolean);

const RUTAS_CHROMIUM = [
  process.env.CHROMIUM_PATH,
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  '/opt/pw-browsers/chromium/chrome-linux/chrome',
].filter(Boolean);

// Sale del proceso con codigo 1 y diciendo QUE instalar, en vez de lanzar un error de
// `require` que obliga a leer el codigo para entenderlo.
function requerirPlaywright() {
  for (const ruta of RUTAS_PLAYWRIGHT) {
    try { return require(ruta); } catch { /* probar la siguiente */ }
  }
  console.error('No se encontro el paquete "playwright". Instalalo sin guardarlo en '
    + 'package.json y trae un Chromium:\n\n'
    + '    npm install --no-save playwright\n'
    + '    npx playwright install --with-deps chromium\n');
  process.exit(1);
}

// `undefined` cuando no hay ninguna ruta conocida: el que llama NO debe pasar
// `executablePath` en ese caso.
const chromiumDisponible = () => RUTAS_CHROMIUM.find((r) => fs.existsSync(r));

// Azucar para el caso comun: `chromium.launch(opcionesDeLanzamiento())`.
function opcionesDeLanzamiento(extra) {
  const ejecutable = chromiumDisponible();
  return Object.assign({}, extra, ejecutable ? { executablePath: ejecutable } : {});
}

module.exports = { requerirPlaywright, chromiumDisponible, opcionesDeLanzamiento, RUTAS_PLAYWRIGHT, RUTAS_CHROMIUM };
