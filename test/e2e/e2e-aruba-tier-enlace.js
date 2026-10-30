'use strict';
/* El tier de caudal de Aruba (`#selTier`) en un enlace (mejora propuesta al cerrar el PR #80, dentro
   del encargo del dueño «ejecuta las mejoras propuestas»). El HTML lo trae vacío y sus opciones
   llegan con el catálogo, el mismo caso que `apModel` y `pickModel`. Lo que fija esta batería:
   - un enlace con un tier elegido aterriza en ese tier, no en «Automático»;
   - el enlace lo sigue llevando;
   - sin elegir nada, «Automático» no viaja en el enlace. */
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
    await page.waitForSelector('#selTier option:nth-child(2)', { state: 'attached', timeout: 20000 });
    await asentar(page);
  };

  await abrir('');
  t.ok((await page.inputValue('#selTier')) === 'auto', 'sin enlace, el tier es «Automático»');
  // Un tier que el nivel deducido admite (los no admitidos salen deshabilitados).
  const tiers = await page.$$eval('#selTier option', (os) => os.filter((o) => o.value !== 'auto' && !o.disabled).map((o) => o.value));
  t.ok(tiers.length > 0, `hay tiers elegibles con el escenario por defecto (${tiers.join(', ')})`);
  const tier = tiers[0];
  // Un cambio cualquiera del escenario: «Automático» no debe aparecer en el enlace.
  await page.fill('#users', '40');
  await page.dispatchEvent('#users', 'input');
  await asentar(page);
  t.ok(!new URL(page.url()).searchParams.has('selTier'), `sin elegir tier, «Automático» no viaja (${page.url().split('?')[1] || ''})`);

  await abrir(`?selTier=${encodeURIComponent(tier)}`);
  t.ok((await page.inputValue('#selTier')) === tier, `un enlace con selTier aterriza en ese tier (${tier}; quedó ${await page.inputValue('#selTier')})`);
  t.ok(new URL(page.url()).searchParams.get('selTier') === tier, 'y el enlace lo sigue llevando');

  t.ok(errores.length === 0, 'sin errores de JS' + (errores.length ? ': ' + errores.join(' | ') : ''));
  await browser.close();
  process.exit(t.resumen('e2e-aruba-tier-enlace'));
})().catch((e) => { console.error('ERROR E2E (e2e-aruba-tier-enlace):', e.message); process.exit(2); });
