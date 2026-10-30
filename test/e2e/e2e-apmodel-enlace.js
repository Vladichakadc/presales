'use strict';
/* El modelo de AP de MikroTik viaja en el enlace (mejora propuesta al cerrar el PR #75, dentro del
   encargo del dueño «ejecuta las mejoras propuestas»). Sus opciones llegan con el catálogo, después
   de que ESTADO restaura el enlace: sin `opcionesTarde` el valor se perdía sin aviso y el receptor
   veía el BOM con el primer AP. Lo que fija esta batería:
   - un enlace con `apModel` aterriza en ese modelo;
   - un enlace viejo, sin `apModel`, sigue en el de siempre (el primero);
   - el valor por defecto es la primera opción que llega: no viaja si nadie lo cambió. */
const { cargarPlaywright, abrirSesion, asentar, contador, BASE } = require('./ayuda');

const RUTA = '/dimensionador-mikrotik-routeros.html';

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
    await page.waitForSelector('#apModel option:nth-child(2)', { state: 'attached', timeout: 20000 });
    await asentar(page);
  };

  await abrir('');
  const opciones = await page.$$eval('#apModel option', (os) => os.map((o) => o.value));
  t.ok(opciones.length > 1, `el catálogo trae más de un AP (${opciones.length})`);
  const [primero, segundo] = opciones;

  await abrir(`?chkCapsman=1&apCount=4&apModel=${encodeURIComponent(segundo)}`);
  t.ok((await page.inputValue('#apModel')) === segundo, `un enlace con apModel aterriza en ese modelo (${segundo})`);
  t.ok(/apModel=/.test(page.url()), 'y el enlace lo sigue llevando');

  await abrir('?chkCapsman=1&apCount=4');
  t.ok((await page.inputValue('#apModel')) === primero, `un enlace sin apModel sigue en el de siempre (${primero})`);
  // Otro campo visible: el bloque de CAPsMAN no se despliega al venir del enlace (anotado aparte).
  await page.fill('#bw', '150');
  await page.dispatchEvent('#bw', 'input');
  await asentar(page);
  t.ok(/bw=150/.test(page.url()) && !/apModel=/.test(page.url()), `y el AP por defecto no viaja: nadie lo cambió (${page.url().split('?')[1]})`);

  t.ok(errores.length === 0, 'sin errores de JS' + (errores.length ? ': ' + errores.join(' | ') : ''));
  await browser.close();
  process.exit(t.resumen('e2e-apmodel-enlace'));
})().catch((e) => { console.error('ERROR E2E (e2e-apmodel-enlace):', e.message); process.exit(2); });
