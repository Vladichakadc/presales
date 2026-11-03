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

/* RENDERDOCUMENT, APAGADO AQUI (2026-11-03). Desde la 1.62, Playwright deja activado
 * RenderDocument en Chromium: cada navegacion abre un documento nuevo cuyo V8 no conserva la
 * cobertura del anterior, y el informe del contraste solo contaba la ULTIMA pagina (medido en CI
 * el 2026-10-02 con la 1.63, y en local el 2026-11-03 con la 1.63 y Chromium 153: seis modulos
 * «sin conducir» que la corrida acababa de conducir). Por eso Playwright estaba fijado en la
 * 1.61.1, con Chromium 149, anterior a varios zero-days de V8 explotados en 2026 (el ultimo,
 * CVE-2026-87491, corregido en Chromium 153.0.8010.36). Apagar la funcion en el lanzamiento
 * devuelve la cobertura acumulada sin quedarse atras de version.
 *
 * Se anade a los `args` que traiga el que llama, sin pisarlos, y solo si no la nombra ya. */
const SIN_RENDER_DOCUMENT = '--disable-features=RenderDocument';

// Azucar para el caso comun: `chromium.launch(opcionesDeLanzamiento())`.
function opcionesDeLanzamiento(extra) {
  const ejecutable = chromiumDisponible();
  const opciones = Object.assign({}, extra, ejecutable ? { executablePath: ejecutable } : {});
  const args = Array.isArray(opciones.args) ? opciones.args.slice() : [];
  if (!args.some((a) => /RenderDocument/.test(a))) args.push(SIN_RENDER_DOCUMENT);
  opciones.args = args;
  return opciones;
}

module.exports = { requerirPlaywright, chromiumDisponible, opcionesDeLanzamiento, SIN_RENDER_DOCUMENT, RUTAS_PLAYWRIGHT, RUTAS_CHROMIUM };
