'use strict';
/* E2E de regresión núcleo (pendiente #40): lo mínimo que nunca puede romperse — login,
   carga del dimensionador, recomendación con enlaces declarados, BOM con equipo y
   suscripción, término de 7 años disponible y UN solo botón de copiar enlace. */
const { cargarPlaywright, abrirDimensionador, contador } = require('./ayuda');

(async () => {
  const { chromium } = cargarPlaywright();
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on('dialog', (d) => d.accept());
  const t = contador();

  // abrirDimensionador ya abre la sesión (goto /login → credenciales → portal → página):
  // llamar también a abrirSesion antes provocaría un doble /login que redirige al portal.
  await abrirDimensionador(page);
  t.ok(true, 'el login redirige al portal y deja entrar (sin sesión, #users no aparecería)');
  t.ok(await page.locator('#users').count() === 1, 'el dimensionador carga con su formulario');

  await page.fill('#users', '60');
  await page.locator('.wan-fila').first().locator('input[data-campo=down]').fill('200');
  await page.waitForTimeout(900);
  const modelo = await page.inputValue('#pickModel');
  t.ok(!!modelo, 'con enlaces declarados hay equipo recomendado (' + modelo + ')');

  await page.click('[data-tab=bom]');
  await page.waitForTimeout(600);
  const bom = (await page.textContent('#pane-bom')) || '';
  t.ok(/Equipo/.test(bom) && bom.includes(modelo), 'el BOM cotiza el equipo recomendado');
  t.ok(/Suscripción SD-WAN/.test(bom), 'el BOM cotiza la suscripción EdgeConnect');

  await page.click('[data-tab=calc]');
  await page.waitForTimeout(300);
  const siete = await page.locator('#termYears option[value="7"]').count();
  t.ok(siete === 1, 'el término de 7 años está disponible (#28)');

  const nCopiar = await page.$$eval('button', (bs) => bs.filter((b) => /copiar enlace/i.test(b.textContent || '')).length);
  t.ok(nCopiar === 1, 'un solo botón «Copiar enlace del escenario» (2026-09-15)');

  await page.click('#btnLimpiarEscenario');
  await page.waitForSelector('#users', { timeout: 20000 });
  await page.waitForTimeout(600);
  t.ok((await page.inputValue('#users')) === '' && !/users=/.test(page.url()),
    '«Limpiar escenario» vuelve a los valores por defecto con la URL desnuda');

  await browser.close();
  process.exit(t.resumen('e2e-regresion'));
})().catch((e) => { console.error('ERROR E2E:', e.message); process.exit(2); });
