'use strict';
/* global document */
/* Un enlace que pide una opción que el desplegable ya no ofrece lo dice (2026-11-12, PR #204). El 7220
   IXR ofrecía «1 GbE» de acceso, que ningún modelo publica; al quitarla, un enlace guardado con
   `accesoVel=1` abría el escenario a 25 GbE sin una palabra. Ahora `estado.js` lo anuncia con el campo,
   lo pedido y lo que quedó, y un enlace con una opción vigente no anuncia nada. */
const { cargarPlaywright, BASE, abrirSesion, asentar, trasNavegar, contador } = require('./ayuda');

(async () => {
  const { chromium } = cargarPlaywright();
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errores = [];
  page.on('pageerror', (e) => errores.push(e.message));
  const t = contador();
  await abrirSesion(page);
  const abrir = async (q) => {
    await trasNavegar(page, () => page.goto(`${BASE}/dimensionador-nokia-7220ixr.html?${q}`, { waitUntil: 'domcontentloaded' }), { selector: '#accesoVel' });
    await asentar(page);
    return page.evaluate(() => ({
      valor: document.getElementById('accesoVel').value,
      opciones: [...document.getElementById('accesoVel').options].map((o) => o.value),
      avisos: [...document.querySelectorAll('.estado-sin-opcion')].map((n) => n.textContent),
    }));
  };

  const viejo = await abrir('servers=300&accesoVel=1&oversub=3');
  t.ok(!viejo.opciones.includes('1'), `la página ya no ofrece 1 GbE (${viejo.opciones})`);
  t.ok(viejo.valor === '25', `el campo queda en su valor por defecto (${viejo.valor})`);
  t.ok(viejo.avisos.length === 1 && /«1»/.test(viejo.avisos[0]) && /Velocidad de puerto por servidor/.test(viejo.avisos[0]) && /25 GbE/.test(viejo.avisos[0]),
    `y lo dice con el campo, lo pedido y lo que quedó: ${viejo.avisos[0] || '(sin aviso)'}`);

  const vigente = await abrir('servers=300&accesoVel=100&oversub=3');
  t.ok(vigente.valor === '100' && vigente.avisos.length === 0, `una opción vigente se aplica y no anuncia nada (${vigente.valor}, ${vigente.avisos.length} avisos)`);

  t.ok(errores.length === 0, `sin errores de página (${errores.join(' · ') || 'ninguno'})`);
  await browser.close();
  process.exit(t.resumen('e2e-enlace-opcion-retirada'));
})().catch((e) => { console.error(e); process.exit(1); });
