'use strict';
/* E2E de las ópticas SFP de los enlaces WAN (SPEC B.1, petición del dueño 2026-09-15):
   medio SFP 1G / SFP+ 10G → el BOM cotiza la óptica; con varias compatibles hay mensaje
   y select SIN opción por defecto (el tipo lo elige el usuario); hasta elegirla la línea
   queda PENDIENTE DE SELECCIÓN sin precio; RJ45 no pide nada. */
const { cargarPlaywright, abrirDimensionador, asentar, contador } = require('./ayuda');

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
  await asentar(page);
  await page.selectOption('#pickModel', 'EC-10150'); // varias ópticas 10G compatibles
  await asentar(page);

  t.ok(await page.isVisible('#sfpChooser'), 'el chooser aparece con un enlace SFP+ 10G');
  const txt = (await page.textContent('#sfpChooser')) || '';
  t.ok(/ópticas SFP\+ 10G compatibles/.test(txt), 'mensaje «hay N ópticas compatibles — selecciona el tipo»');
  const sel = page.locator('#sfpChooser select[data-sfp-medio]');
  t.ok(await sel.count() === 1, 'select de óptica presente (varias compatibles)');
  t.ok((await sel.inputValue()) === '', 'el select NO trae opción por defecto — la elige el usuario');

  await page.click('[data-tab=bom]');
  await asentar(page);
  let bom = (await page.textContent('#pane-bom')) || '';
  t.ok(/PENDIENTE DE SELECCIÓN/.test(bom), 'BOM: óptica PENDIENTE DE SELECCIÓN sin precio hasta elegirla');

  await page.click('[data-tab=calc]');
  await asentar(page);
  const primera = await sel.locator('option').nth(1).getAttribute('value');
  await sel.selectOption(primera);
  await asentar(page);
  t.ok(new RegExp('sfpPickData=').test(page.url()), 'la elección viaja en la URL del escenario');
  await page.click('[data-tab=bom]');
  await asentar(page);
  bom = (await page.textContent('#pane-bom')) || '';
  t.ok(!/PENDIENTE DE SELECCIÓN/.test(bom) && bom.includes(primera),
    `tras elegir, el BOM cotiza la óptica (${primera}) y el PENDIENTE desaparece`);

  await page.click('[data-tab=calc]');
  await asentar(page);
  await fila.locator('select[data-campo=medio]').selectOption('RJ45');
  await asentar(page);
  t.ok(await page.isHidden('#sfpChooser'), 'medio RJ45: sin óptica que pedir (chooser oculto)');

  // Pendiente 24 (2026-10-07): el 1G del EC-10108 deja de estar «en conflicto documental» —
  // el Hardware Reference Rev V lo da por bueno— y se cotiza como en el 10106.
  await fila.locator('select[data-campo=medio]').selectOption('SFP 1G');
  await asentar(page);
  await page.selectOption('#pickModel', 'EC-10108');
  await asentar(page);
  const txt1g = (await page.textContent('#sfpChooser')) || '';
  t.ok(!/conflicto documental/.test(txt1g), 'EC-10108 en 1G: ya no dice «conflicto documental»');
  const ops1g = await page.$$eval('#sfpChooser select[data-sfp-medio] option', (os) => os.map((o) => o.value).filter(Boolean));
  t.ok(['S3R03A', 'J4858D', 'J4859D'].every((s) => ops1g.includes(s)),
    `EC-10108 en 1G: ofrece el cobre y las dos fibras de 1G (${ops1g.join(', ')})`);

  // Y su densidad: cuatro jaulas (dos SFP+ en wan0/wan1 y dos combo de 1G), no dos. Cuatro
  // enlaces de 1G caben sin aviso; tres de 10G no, aunque el total sí.
  const anadir = async () => { await page.click('#btnAddWan'); await asentar(page); };
  for (let i = 0; i < 3; i++) await anadir();
  const filas = page.locator('.wan-fila');
  for (let i = 0; i < 4; i++) {
    await filas.nth(i).locator('select[data-campo=medio]').selectOption('SFP 1G');
    await filas.nth(i).locator('input[data-campo=down]').fill('100');
  }
  await asentar(page);
  await page.selectOption('#pickModel', 'EC-10108');
  await asentar(page);
  let ficha = (await page.textContent('#pane-calc')) || '';
  t.ok(!/Densidad de ópticas/.test(ficha), 'EC-10108 con cuatro enlaces de 1G: caben, sin aviso de densidad');
  for (let i = 0; i < 3; i++) await filas.nth(i).locator('select[data-campo=medio]').selectOption('SFP+ 10G');
  await asentar(page);
  await page.selectOption('#pickModel', 'EC-10108');
  await asentar(page);
  ficha = (await page.textContent('#pane-calc')) || '';
  t.ok(/3 enlaces de 10G sobre 2 jaulas SFP\+ del EC-10108/.test(ficha),
    'EC-10108 con tres enlaces de 10G: avisa que solo hay dos jaulas SFP+');

  await browser.close();
  process.exit(t.resumen('e2e-sfp'));
})().catch((e) => { console.error('ERROR E2E:', e.message); process.exit(2); });
