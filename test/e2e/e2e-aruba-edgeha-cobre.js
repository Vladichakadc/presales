'use strict';
/* La interconexión EdgeHA por el puerto que le toca (mejora aprobada el 2026-10-27). La auditoría
   del par ya elegía el puerto de la interconexión (mismo tipo en los dos chasis, primero el RJ-45),
   pero el builder y la lista de materiales pedían igual dos ópticas. Con un par de EC-10104 y dos
   enlaces RJ-45 de 100 Mbps, cada chasis se queda con RJ-45 libres: la interconexión es un
   latiguillo, sin óptica que elegir ni cotizar. (El caso de jaula —EC-10150 con dos enlaces de
   5 Gbps, óptica 10G por elegir— lo conduce e2e-desbordamiento-ec.js.) */
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
  await filas.first().locator('input[data-campo=down]').fill('100');
  await filas.first().locator('select[data-campo=medio]').selectOption('RJ45');
  await page.click('#btnAddWan');
  await asentar(page);
  await filas.nth(1).locator('input[data-campo=down]').fill('100');
  await filas.nth(1).locator('select[data-campo=medio]').selectOption('RJ45');
  await asentar(page);
  if (!(await page.isChecked('#chkHa'))) { await page.click('#chkHa'); await asentar(page); }
  await page.selectOption('#pickModel', 'EC-10104');
  await asentar(page);

  const chooser = ((await page.textContent('#sfpChooser')) || '').replace(/\s+/g, ' ');
  t.ok(/Interconexión EdgeHA/.test(chooser) && /por RJ-45/.test(chooser) && /Latiguillo de cobre/.test(chooser),
    `el builder dice que la interconexión va por RJ-45 con un latiguillo (${chooser.slice(0, 120)})`);
  t.ok(await page.locator('#sfpChooser select[data-sfp-medio="EdgeHA"]').count() === 0,
    'y no ofrece ninguna óptica que elegir para ella');

  const ficha = ((await page.textContent('#verdict')) || '').replace(/\s+/g, ' ');
  t.ok(/Cableado del par EdgeHA/.test(ficha) && /latiguillo de cobre, sin ópticas/.test(ficha),
    'el asistente de cableado dice lo mismo');

  await page.click('[data-tab=bom]');
  await asentar(page);
  const filasHA = await page.$$eval('#bomTabla tbody tr', (rs) => rs.map((r) => r.textContent.replace(/\s+/g, ' ')).filter((x) => /EdgeHA/.test(x)));
  t.ok(filasHA.length === 1 && /Latiguillo RJ-45/.test(filasHA[0]),
    `la lista de materiales lleva un latiguillo, no dos ópticas (${filasHA.join(' | ').slice(0, 140)})`);
  t.ok(!filasHA.some((x) => /PENDIENTE DE SELECCIÓN/.test(x)), 'y nada queda pendiente de elegir');

  t.ok(errores.length === 0, 'sin errores de JS' + (errores.length ? ': ' + errores.join(' | ') : ''));
  await browser.close();
  process.exit(t.resumen('e2e-aruba-edgeha-cobre'));
})().catch((e) => { console.error('ERROR E2E:', e.message); process.exit(2); });
