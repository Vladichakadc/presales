'use strict';
/* global window, document, getComputedStyle */
/*   ↑ los callbacks de page.evaluate corren EN el navegador; eslint los analiza como
     código Node y sin esta declaración marcaría no-undef sobre funciones del DOM.
   E2E del panel sticky «Equipos que cumplen» (fix v29, 2026-09-15): la columna derecha
   queda fija (top:16) mientras la izquierda se desplaza. La regresión que lo originó
   soltaba el panel ~187 px antes del final por la zona muerta bajo .cols; la guardia es
   el invariante documentado en el CSS: alto del panel ≤ 100vh − zona muerta. */
const { cargarPlaywright, abrirDimensionador, contador } = require('./ayuda');

(async () => {
  const { chromium } = cargarPlaywright();
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const t = contador();

  await abrirDimensionador(page);
  await page.fill('#users', '300');
  await page.locator('.wan-fila').first().locator('input[data-campo=down]').fill('500');
  await page.waitForTimeout(900);

  const PANEL = '.cols>div:last-child';
  const sticky = await page.$eval(PANEL, (el) => getComputedStyle(el).position);
  t.ok(sticky === 'sticky', 'el panel «Equipos que cumplen» es position:sticky');

  const topAl = async () => page.$eval(PANEL, (el) => Math.round(el.getBoundingClientRect().top));
  // El sticky solo se clava cuando el scroll pasa su posición natural: se mide primero
  // esa posición y se supera con margen, en vez de un número a ojo que cambia con el alto
  // de la cabecera.
  const offsetNatural = await page.$eval(PANEL, (el) => el.offsetTop);

  await page.evaluate((y) => window.scrollTo(0, y), offsetNatural + 400);
  await page.waitForTimeout(300);
  const topMedio = await topAl();
  t.ok(Math.abs(topMedio - 16) <= 2, `panel clavado a top:16 pasada su posición natural (top=${topMedio})`);

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(400);
  const topFondo = await topAl();
  const sId = await page.evaluate(() => window.scrollY);
  t.ok(sId > 1000, `la página sí se desplazó hasta el fondo (scrollY=${sId})`);
  t.ok(topFondo >= 10 && topFondo <= 18,
    `panel sigue clavado al llegar al fondo (top=${topFondo}) — la regresión lo soltaba ~187 px antes`);

  await browser.close();
  process.exit(t.resumen('e2e-sticky'));
})().catch((e) => { console.error('ERROR E2E:', e.message); process.exit(2); });
