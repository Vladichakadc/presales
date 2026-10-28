'use strict';
/* La suscripción FortiGuard del clúster, en la página de Fortinet (F3, 2026-10-28).

   La guía de FortiOS 7.6.6 deja compartir una sola suscripción FortiGuard en activo-pasivo a las
   series 40F, 60F, 70F, 80F y 100F. El motor lo decía en un aviso `info` que la página no enseña,
   y la página seguía diciendo «la licencia no se comparte en HA». Esta batería conduce el clúster
   con un 61F y comprueba que la cantidad, la ficha y el BOM dicen lo mismo que la guía, que el
   activo-activo vuelve a una por nodo con su motivo, y que el BOM sigue cotizando por nodo. */
/* global document */

const { cargarPlaywright, abrirSesion, asentar, contador } = require('./ayuda');

const BASE = process.env.E2E_BASE || 'http://localhost:4131';
const PAGINA = `${BASE}/dimensionador-fortinet-fortigate.html`;
// Una sucursal pequeña, en la que el 61F cumple de sobra.
const SUCURSAL = new URLSearchParams({
  wanLinksData: JSON.stringify({ v: 2, wanLinks: [{ id: 1, tipo: 'DIA', down: 50, overlay: true }] }),
  rolSeg: 'spoke', hubs: '1', users: '20', sesUser: '30', vidaSes: '30',
}).toString();

(async () => {
  const { chromium } = cargarPlaywright();
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 936 } });
  const t = contador();
  const errores = [];
  page.on('pageerror', (e) => errores.push(e.message));

  await abrirSesion(page);
  await page.goto(`${PAGINA}?${SUCURSAL}`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#stickyReco', { timeout: 20000 });
  await asentar(page);
  await page.check('#chkHa');
  await asentar(page);
  await page.selectOption('#haModo', 'ha-ap');
  await asentar(page);
  await page.selectOption('#pickModel', 'FortiGate 61F');
  await asentar(page);

  const texto = (sel) => page.$eval(sel, (e) => (e.innerText || e.textContent || '').replace(/\s+/g, ' ')).catch(() => '');
  const bomModelo = await texto('#bomBody .model');
  t.ok(/61F/.test(bomModelo), `el 61F elegido cumple y el BOM lo sigue (${bomModelo})`);

  const qty = await texto('#qtyHint');
  t.ok(/serie 60F admite una sola/.test(qty) && /FG-61F-HA/.test(qty) && /FortiOS 7\.6\.6/.test(qty),
    'la cantidad dice la licencia única de su serie en activo-pasivo, con su SKU de HA y su guía');
  t.ok(/este BOM cotiza una suscripción por nodo/.test(qty), 'y que el BOM sigue cotizando una por nodo');

  const aviso = await texto('#bomTabla .bom-aviso');
  t.ok(/FG-61F-HA/.test(aviso) && /una suscripción por nodo/.test(aviso), `el aviso del BOM dice lo mismo (${aviso.slice(0, 90)}…)`);

  const cuerpo = await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' '));
  t.ok(!/la licencia no se comparte en HA/.test(cuerpo) && !/cada nodo lleva su propia suscripción FortiGuard/.test(cuerpo),
    'la regla vieja («no se comparte», «su propia suscripción FortiGuard») no aparece en ninguna parte');
  t.ok(/Nodos a licenciar 2 — este BOM cotiza una suscripción por nodo/.test(cuerpo),
    'la ficha, en «Nodos a licenciar», dice lo mismo');

  const qtys = await page.$$eval('#bomTabla tbody tr', (trs) => trs.map((tr) => (tr.children[2] || {}).textContent || '').filter(Boolean));
  t.ok(qtys.length && qtys.every((q) => /^\s*2\s*$/.test(q) || !/\d/.test(q)), `el BOM sigue con 2 de cada línea (${qtys.join(', ')})`);

  await page.selectOption('#haModo', 'ha-aa');
  await asentar(page);
  const aa = await texto('#qtyHint');
  t.ok(/solo vale en activo-pasivo/.test(aa) && !/admite una sola/.test(aa),
    'en activo-activo vuelve a una por nodo y dice por qué');

  t.ok(errores.length === 0, `sin excepciones de página (${errores.join(' | ') || 'ninguna'})`);
  await browser.close();
  t.resumen('e2e-fortinet-ha-licencia');
})().catch((e) => { console.error(e); process.exit(1); });
