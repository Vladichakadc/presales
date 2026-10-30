'use strict';
/* El modelo de Aruba en un enlace, repuesto por ESTADO (`opcionesTarde`, mejora propuesta al cerrar
   el PR #77 y aprobada por el dueño el 2026-10-30: «Sí, hazla»). Antes lo reponía la página con una
   captura propia (QMODEL_URL). Lo que no puede cambiar con la vía nueva:
   - un enlace con `pickModel` aterriza en ese equipo, aunque no sea el recomendado;
   - queda como elegido a mano (`bomManual`): el render no lo cambia por el recomendado;
   - el enlace lo sigue llevando, y sin `pickModel` el selector sigue al recomendado. */
const { cargarPlaywright, abrirSesion, asentar, contador, BASE } = require('./ayuda');

const RUTA = '/dimensionador-aruba-edgeconnect.html';

(async () => {
  const { chromium } = cargarPlaywright();
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errores = [];
  page.on('pageerror', (e) => errores.push(e.message));
  const t = contador();
  await abrirSesion(page);

  const abrir = async (qs) => {
    await page.goto(BASE + RUTA + qs, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#pickModel option:nth-child(2)', { state: 'attached', timeout: 20000 });
    await asentar(page);
  };
  const estado = () => page.$eval('#pickModel', (s) => ({ valor: s.value, manual: s.dataset.bomManual === '1' }));

  await abrir('');
  const sinEnlace = await estado();
  const opciones = await page.$$eval('#pickModel option', (os) => os.map((o) => o.value));
  t.ok(opciones.length > 2, `el selector trae los equipos del catálogo (${opciones.length})`);
  t.ok(!sinEnlace.manual, `sin enlace, el selector sigue al recomendado (${sinEnlace.valor})`);
  // Un equipo distinto del que la página elige sola: así se ve que manda el enlace.
  const elegido = opciones.filter((v) => v && v !== sinEnlace.valor).pop();

  await abrir(`?pickModel=${encodeURIComponent(elegido)}`);
  const conEnlace = await estado();
  t.ok(conEnlace.valor === elegido, `un enlace con pickModel aterriza en ese equipo (${elegido}; quedó ${conEnlace.valor})`);
  t.ok(conEnlace.manual, 'y queda como elegido a mano, como lo dejaba la captura propia de antes');
  await page.fill('#users', '40');
  await page.dispatchEvent('#users', 'input');
  await asentar(page);
  const trasCambio = await estado();
  t.ok(trasCambio.valor === elegido, `un cambio del escenario no lo devuelve al recomendado (${trasCambio.valor})`);
  t.ok(new URL(page.url()).searchParams.get('pickModel') === elegido, 'y el enlace lo sigue llevando');

  t.ok(errores.length === 0, 'sin errores de JS' + (errores.length ? ': ' + errores.join(' | ') : ''));
  await browser.close();
  process.exit(t.resumen('e2e-aruba-pickmodel-enlace'));
})().catch((e) => { console.error('ERROR E2E (e2e-aruba-pickmodel-enlace):', e.message); process.exit(2); });
