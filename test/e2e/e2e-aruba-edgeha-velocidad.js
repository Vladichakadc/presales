'use strict';
/* La interconexión EdgeHA también por velocidad (mejora aprobada el 2026-10-27). Un par de EC-10106
   con dos enlaces RJ-45 de 800 Mbps: cada chasis tiene RJ-45 libres, pero el agregado del sitio
   (1,6 Gbps) no cabe en 1 GbE. Antes la interconexión iba igual por cobre y solo se avisaba; ahora
   va por la jaula SFP+ que queda libre en los dos, con su óptica de 10G. (El caso de cobre que
   basta lo conduce e2e-aruba-edgeha-cobre.js.) */
const { cargarPlaywright, abrirDimensionador, asentar, contador } = require('./ayuda');

(async () => {
  const { chromium } = cargarPlaywright();
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errores = [];
  page.on('pageerror', (e) => errores.push(e.message));
  const t = contador();
  await abrirDimensionador(page);

  const filas = page.locator('.wan-fila');
  await filas.first().locator('input[data-campo=down]').fill('800');
  await filas.first().locator('select[data-campo=medio]').selectOption('RJ45');
  await page.click('#btnAddWan');
  await asentar(page);
  await filas.nth(1).locator('input[data-campo=down]').fill('800');
  await filas.nth(1).locator('select[data-campo=medio]').selectOption('RJ45');
  await asentar(page);
  if (!(await page.isChecked('#chkHa'))) { await page.click('#chkHa'); await asentar(page); }
  await page.selectOption('#pickModel', 'EC-10106');
  await asentar(page);

  const chooser = ((await page.textContent('#sfpChooser')) || '').replace(/\s+/g, ' ');
  t.ok(/Interconexión EdgeHA/.test(chooser) && /por SFP\+/.test(chooser),
    `con 1,6 Gbps de agregado la interconexión va por la jaula SFP+ (${chooser.slice(0, 160)})`);
  t.ok(!/Latiguillo de cobre/.test(chooser), 'y no por un latiguillo de 1 GbE');
  t.ok(/10G/.test(chooser), 'con óptica de 10G, la menor que cubre el agregado');

  t.ok(errores.length === 0, 'sin errores de JS' + (errores.length ? ': ' + errores.join(' | ') : ''));
  await browser.close();
  process.exit(t.resumen('e2e-aruba-edgeha-velocidad'));
})().catch((e) => { console.error('ERROR E2E:', e.message); process.exit(2); });
