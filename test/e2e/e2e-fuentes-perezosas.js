'use strict';
/* global window */
/*   ↑ los callbacks de page.evaluate corren EN el navegador.
   LA PESTAÑA «FUENTES» SE PIDE AL VERSE (2026-11-01). En los siete dimensionadores con pestaña de
   fuentes, /api/fuentes (los siete fabricantes, ~250 KB sin comprimir) se pedía al abrir la página
   aunque la pestaña estuviera oculta, y a un administrador dos veces. Ahora:
     1. al abrir y asentarse la página, procedencia.js no la pide (Fortinet sí, una vez: su banner,
        su vigencia y su puerta la necesitan desde el arranque);
     2. al abrir «Fuentes», la caja se pinta con su tabla;
     3. y la pestaña la pide una sola vez, también con permiso de sincronización. */
const { cargarPlaywright, BASE, abrirSesion, asentar, trasNavegar, contador } = require('./ayuda');

const PAGINAS = ['aruba-edgeconnect', 'cisco-catalyst8k', 'fortinet-fortigate', 'huawei-netengine',
  'juniper-srx', 'mikrotik-routeros', 'nokia-7750sr'];
// Las páginas que piden /api/fuentes por su cuenta al arrancar, con el motivo.
const PROPIAS = { 'fortinet-fortigate': 'banner, vigencia de la lista y puerta comercial' };

let donde = 'al empezar';

(async () => {
  const { chromium } = cargarPlaywright();
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errores = [];
  page.on('pageerror', (e) => errores.push(e.message));
  let pedidas = 0;
  page.on('request', (r) => { if (new URL(r.url()).pathname === '/api/fuentes') pedidas += 1; });
  const t = contador();
  await abrirSesion(page);

  for (const pag of PAGINAS) {
    donde = `${pag}, al abrir`;
    pedidas = 0;
    await trasNavegar(page, () => page.goto(`${BASE}/dimensionador-${pag}.html`, { waitUntil: 'domcontentloaded' }), { selector: '[data-tab=src]' });
    await asentar(page);
    const alAbrir = pedidas;
    const esperadas = PROPIAS[pag] ? 1 : 0;
    t.ok(alAbrir === esperadas,
      `${pag}: al abrir, ${esperadas ? `una petición a /api/fuentes (${PROPIAS[pag]})` : 'ninguna petición a /api/fuentes'} (hubo ${alAbrir})`);
    const vacia = await page.evaluate(() => (window.document.querySelector('[data-procedencia]') || {}).textContent || '');
    t.ok(/Cargando/.test(vacia), `${pag}: la caja oculta sigue sin pintar («${vacia.trim().slice(0, 30)}»)`);

    donde = `${pag}, al abrir Fuentes`;
    await page.click('[data-tab=src]');
    await page.waitForFunction(() => {
      const c = window.document.querySelector('[data-procedencia]');
      return c && !/Cargando/.test(c.textContent);
    }, null, { timeout: 20000 });
    await asentar(page);
    const pintada = await page.evaluate(() => {
      const c = window.document.querySelector('[data-procedencia]');
      return { tabla: !!c.querySelector('table'), texto: c.textContent.replace(/\s+/g, ' ').trim().slice(0, 60) };
    });
    t.ok(pintada.tabla, `${pag}: al abrir «Fuentes» la caja trae su tabla («${pintada.texto}»)`);
    t.ok(pedidas === esperadas + 1, `${pag}: la pestaña la pide una sola vez (${pedidas} en total, ${esperadas} propia de la página)`);
  }

  console.log(`RESUMEN - fuentes perezosas: ${PAGINAS.length} páginas`);
  t.ok(errores.length === 0, 'sin errores de JS' + (errores.length ? ': ' + [...new Set(errores)].slice(0, 5).join(' | ') : ''));
  await browser.close();
  process.exit(t.resumen('e2e-fuentes-perezosas'));
})().catch((e) => { console.error('ERROR E2E:', `[${donde}]`, e.message.split('\n')[0]); process.exit(2); });
