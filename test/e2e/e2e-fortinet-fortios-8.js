'use strict';
/* FortiOS 8.0 en el selector de versión de la página de Fortinet (2026-11-10).

   El encargo del dueño: que al elegir la 8.0.2 el dimensionador tenga en cuenta lo que trae. Esta
   batería conduce la página y comprueba que pinta lo que decide el motor con las Release Notes de
   8.0.2: la ayuda del selector lo dice, el modo túnel SSL-VPN deja de ofrecerse, el equipo que esas
   notas no nombran (FortiWiFi 50G-5G-II) deja de recomendarse, y el enlace compartido reabre lo mismo.
   Sin elegirla, nada cambia. */
/* global document */

const { cargarPlaywright, abrirSesion, asentar, contador } = require('./ayuda');

const BASE = process.env.E2E_BASE || 'http://localhost:4131';
const PAGINA = `${BASE}/dimensionador-fortinet-fortigate.html`;
const SUCURSAL = new URLSearchParams({
  wanLinksData: JSON.stringify({ v: 2, wanLinks: [
    { id: 1, tipo: 'DIA', down: 300, overlay: false },
    { id: 2, tipo: '4G/5G', down: 100, overlay: false, rol: 'respaldo' },
  ] }),
}).toString();

(async () => {
  const { chromium } = cargarPlaywright();
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 936 } });
  const t = contador();
  const errores = [];
  page.on('pageerror', (e) => errores.push(e.message));
  const texto = (sel) => page.$eval(sel, (e) => (e.innerText || e.textContent || '').replace(/\s+/g, ' ')).catch(() => '');
  const cuerpo = () => page.evaluate(() => document.body.innerText.replace(/\s+/g, ' '));
  const sslDeshabilitado = () => page.$eval('#vpnTipo option[value=sslvpn]', (o) => o.disabled);

  await abrirSesion(page);
  await page.goto(`${PAGINA}?${SUCURSAL}`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#stickyReco', { timeout: 20000 });
  await asentar(page);

  // Por defecto sigue la rama 7.6.3+, y la 8.0 está entre las opciones.
  t.ok(await page.inputValue('#fortiOS') === '7.6.3+', 'la versión por defecto sigue siendo 7.6.3 o superior');
  const opciones = await page.$$eval('#fortiOS option', (os) => os.map((o) => o.value));
  t.ok(opciones.includes('8.0'), `el selector ofrece la 8.0 (${opciones.join(', ')})`);
  const bomAntes = (await texto('#bomBody .model')).trim();

  // Con Wi-Fi y 5G integrado, en 7.6.3+ el único que lo trae es el FortiWiFi 50G-5G-II.
  await page.check('#chkWifi');
  await page.selectOption('#celularGen', '5g');
  await asentar(page);
  await page.selectOption('#celularVia', 'integrado');
  await asentar(page);
  const con76 = (await texto('#bomBody .model')).trim();
  t.ok(/FortiWiFi 50G-5G-II/.test(con76), `con 7.6.3+, Wi-Fi y 5G integrado dan el FortiWiFi 50G-5G-II (${con76})`);

  // Con 8.0 sus Release Notes no lo nombran: deja de recomendarse y se dice por qué.
  await page.selectOption('#fortiOS', '8.0');
  await asentar(page);
  const ayuda = await texto('#fortiOSHint');
  t.ok(/Release Notes de 8\.0\.2/.test(ayuda) && /Maximum Values Table/.test(ayuda) && /las cifras de rendimiento no se publican por versión/.test(ayuda),
    `la ayuda dice qué se aplica de 8.0.2, qué cambia en sus topes y qué no (${ayuda.slice(0, 80)}…)`);
  // Las novedades de la rama: títulos de su guía, con enlace, del catálogo (2026-11-11).
  const nov = await page.$eval('#fortiOSHint details.fortios-novedades', (d) => ({ n: d.querySelectorAll('li').length,
    enlace: (d.querySelector('a') || {}).href || '', texto: d.textContent })).catch(() => null);
  t.ok(nov && nov.n >= 6 && /docs\.fortinet\.com\/document\/fortigate\/8\.0\.0\/new-features/.test(nov.enlace),
    `con 8.0 se listan las novedades de la rama con el enlace a su guía (${nov ? `${nov.n}, ${nov.enlace}` : 'no están'})`);
  t.ok(nov && /Increase number of supported switches/.test(nov.texto) && /FortiExtender integration with SD-WAN/.test(nov.texto), 'con el título literal de la guía');
  const con8 = (await texto('#bomBody .model')).trim();
  t.ok(!/FortiWiFi 50G-5G-II/.test(con8), `con 8.0 el FortiWiFi 50G-5G-II ya no es el recomendado (${con8 || 'sin recomendación'})`);
  t.ok(/FortiWiFi 50G-5G-II cumple el escenario pero no figura entre los modelos que esa versión soporta/.test(await cuerpo()), 'y la página dice la causa: 8.0.2 no lo nombra');
  // La corrección que se ofrece devuelve la versión a la rama por defecto.
  const boton = await page.$('button.btn-corr:has-text("Volver a FortiOS 7.6.3+")');
  t.ok(!!boton, 'se ofrece «Volver a FortiOS 7.6.3+»');
  if (boton) {
    await boton.click();
    await asentar(page);
    t.ok(await page.inputValue('#fortiOS') === '7.6.3+' && /FortiWiFi 50G-5G-II/.test(await texto('#bomBody .model')), 'y al pulsarla vuelve el FortiWiFi 50G-5G-II');
    await page.selectOption('#fortiOS', '8.0');
    await asentar(page);
  }

  // Sin Wi-Fi ni celular, la 8.0 recomienda el mismo equipo que antes: las cifras no cambian.
  await page.uncheck('#chkWifi');
  await page.selectOption('#celularGen', '');
  await asentar(page);
  const base8 = (await texto('#bomBody .model')).trim();
  t.ok(base8 === bomAntes, `sin Wi-Fi ni celular, 8.0 recomienda lo mismo que 7.6.3+ (${base8} / ${bomAntes})`);

  // El modo túnel SSL-VPN no se ofrece con 8.0, y vuelve con 7.6.0-7.6.2.
  t.ok(await sslDeshabilitado(), 'con 8.0 la opción SSL-VPN en modo túnel está deshabilitada');
  t.ok(/retirado en FortiOS 8\.0/.test(await texto('#vpnTipo option[value=sslvpn]')), 'y su texto dice que 8.0 lo retiró');
  await page.selectOption('#fortiOS', '7.6.0-7.6.2');
  await asentar(page);
  t.ok(!(await sslDeshabilitado()), 'con 7.6.0 a 7.6.2 vuelve a ofrecerse');

  // El enlace compartido guarda la versión.
  await page.selectOption('#fortiOS', '8.0');
  await asentar(page);
  const url = page.url();
  t.ok(/fortiOS=8\.0/.test(decodeURIComponent(url)), `la versión viaja en el enlace (${url.slice(-60)})`);
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#stickyReco', { timeout: 20000 });
  await asentar(page);
  t.ok(await page.inputValue('#fortiOS') === '8.0', 'y al reabrirlo sigue en 8.0');

  t.ok(errores.length === 0, `sin excepciones de página (${errores.join(' | ') || 'ninguna'})`);
  await browser.close();
  t.resumen('e2e-fortinet-fortios-8');
})().catch((e) => { console.error(e); process.exit(1); });
