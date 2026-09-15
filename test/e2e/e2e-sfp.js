'use strict';
/* E2E de las ópticas SFP de los enlaces WAN (SPEC B.1, petición del dueño 2026-09-15):
   medio SFP 1G / SFP+ 10G → el BOM cotiza la óptica; con varias compatibles hay mensaje
   y select SIN opción por defecto (el tipo lo elige el usuario); hasta elegirla la línea
   queda PENDIENTE DE SELECCIÓN sin precio; RJ45 no pide nada. */
const { cargarPlaywright, abrirDimensionador, contador } = require('./ayuda');

(async () => {
  const { chromium } = cargarPlaywright();
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const t = contador();

  await abrirDimensionador(page);
  await page.fill('#users', '200');
  const fila = page.locator('.wan-fila').first();
  await fila.locator('select[data-campo=medio]').selectOption('SFP+ 10G');
  await fila.locator('input[data-campo=down]').fill('500');
  await page.waitForTimeout(600);
  await page.selectOption('#pickModel', 'EC-10150'); // varias ópticas 10G compatibles
  await page.waitForTimeout(800);

  t.ok(await page.isVisible('#sfpChooser'), 'el chooser aparece con un enlace SFP+ 10G');
  const txt = (await page.textContent('#sfpChooser')) || '';
  t.ok(/ópticas SFP\+ 10G compatibles/.test(txt), 'mensaje «hay N ópticas compatibles — selecciona el tipo»');
  const sel = page.locator('#sfpChooser select[data-sfp-medio]');
  t.ok(await sel.count() === 1, 'select de óptica presente (varias compatibles)');
  t.ok((await sel.inputValue()) === '', 'el select NO trae opción por defecto — la elige el usuario');

  await page.click('[data-tab=bom]');
  await page.waitForTimeout(600);
  let bom = (await page.textContent('#pane-bom')) || '';
  t.ok(/PENDIENTE DE SELECCIÓN/.test(bom), 'BOM: óptica PENDIENTE DE SELECCIÓN sin precio hasta elegirla');

  await page.click('[data-tab=calc]');
  await page.waitForTimeout(300);
  const primera = await sel.locator('option').nth(1).getAttribute('value');
  await sel.selectOption(primera);
  await page.waitForTimeout(600);
  t.ok(new RegExp('sfpPickData=').test(page.url()), 'la elección viaja en la URL del escenario');
  await page.click('[data-tab=bom]');
  await page.waitForTimeout(600);
  bom = (await page.textContent('#pane-bom')) || '';
  t.ok(!/PENDIENTE DE SELECCIÓN/.test(bom) && bom.includes(primera),
    `tras elegir, el BOM cotiza la óptica (${primera}) y el PENDIENTE desaparece`);

  await page.click('[data-tab=calc]');
  await page.waitForTimeout(300);
  await fila.locator('select[data-campo=medio]').selectOption('RJ45');
  await page.waitForTimeout(600);
  t.ok(await page.isHidden('#sfpChooser'), 'medio RJ45: sin óptica que pedir (chooser oculto)');

  await browser.close();
  process.exit(t.resumen('e2e-sfp'));
})().catch((e) => { console.error('ERROR E2E:', e.message); process.exit(2); });
