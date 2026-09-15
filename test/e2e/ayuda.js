'use strict';
/* Ayuda compartida de los E2E (pendiente #40, 2026-09-15): cargar Playwright esté donde
   esté, abrir sesión y llevar la cuenta de comprobaciones. Un solo sitio — la alternativa
   era copiar el bloque en cada script, que es como `llevarABom` tuvo seis copias. */

// Playwright NO es dependencia del paquete: pesa ~300 MB de navegadores y Railway
// construiría más lento por algo que producción nunca usa. Se resuelve en este orden:
// dependencia local (npm i -D playwright), instalación global (npm i -g playwright —
// `npm root -g` la encuentra aunque NODE_PATH no venga en el entorno) o error claro.
function cargarPlaywright() {
  try { return require('playwright'); } catch { /* sigue */ }
  try {
    const { execSync } = require('child_process');
    const path = require('path');
    return require(path.join(execSync('npm root -g').toString().trim(), 'playwright'));
  } catch { /* cae al mensaje */ }
  console.error('Playwright no está disponible. Instálalo con:');
  console.error('  npm i -D playwright && npx playwright install chromium');
  console.error('o global: npm i -g playwright && npx playwright install chromium');
  process.exit(2);
}

const BASE = process.env.E2E_BASE || 'http://localhost:4131';
const USUARIO = process.env.E2E_USER || 'presales';
const CLAVE = process.env.E2E_PASSWORD || 'e2e-local';

async function abrirSesion(page) {
  await page.goto(BASE + '/login');
  await page.fill('input[name=usuario]', USUARIO);
  await page.fill('input[name=password]', CLAVE);
  await page.click('button[type=submit]');
  await page.waitForURL('**/');
}

async function abrirDimensionador(page) {
  await abrirSesion(page);
  await page.goto(BASE + '/dimensionador-aruba-edgeconnect.html');
  await page.waitForSelector('#users', { timeout: 20000 });
  await page.waitForTimeout(900);
}

// Contador de comprobaciones con salida uniforme: «ok - ...» / «FALLO - ...» y código de
// salida al final. Cada script crea el suyo y lo cierra con resumen().
function contador() {
  const fallos = [];
  return {
    fallos,
    ok(cond, msg) {
      console.log((cond ? 'ok' : 'FALLO') + ' - ' + msg);
      if (!cond) fallos.push(msg);
    },
    resumen(nombre) {
      console.log(fallos.length
        ? `\n[${nombre}] RESULTADO: ${fallos.length} FALLO(S)`
        : `\n[${nombre}] RESULTADO: TODO VERDE`);
      return fallos.length ? 1 : 0;
    },
  };
}

module.exports = { cargarPlaywright, BASE, USUARIO, CLAVE, abrirSesion, abrirDimensionador, contador };
