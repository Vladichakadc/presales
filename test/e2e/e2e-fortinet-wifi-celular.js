'use strict';
/* Wi-Fi integrado y WAN celular 4G/5G en la página de Fortinet (2026-11-04).

   El encargo del dueño: que el dimensionador traiga los FortiWiFi y los FortiExtender, con
   opciones para calcular el equipo cuando se pidan. Esta batería conduce la página y comprueba
   que lo que pinta es lo que decide el motor: Wi-Fi → un FortiWiFi y el BOM con su SKU de código
   regional; 5G integrado → una variante con módem 5G; FortiExtender → la línea en el BOM, uno por
   enlace, apartando el que no llega a la bajada; y que el enlace compartido reabre lo mismo. */
/* global document */

const { cargarPlaywright, abrirSesion, asentar, contador } = require('./ayuda');

const BASE = process.env.E2E_BASE || 'http://localhost:4131';
const PAGINA = `${BASE}/dimensionador-fortinet-fortigate.html`;
// Sucursal con DIA de 300 Mbps y respaldo 4G/5G de 400 Mbps.
const SUCURSAL = new URLSearchParams({
  wanLinksData: JSON.stringify({ v: 2, wanLinks: [
    { id: 1, tipo: 'DIA', down: 300, overlay: false },
    { id: 2, tipo: '4G/5G', down: 400, overlay: false, rol: 'respaldo' },
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

  await abrirSesion(page);
  await page.goto(`${PAGINA}?${SUCURSAL}`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#stickyReco', { timeout: 20000 });
  await asentar(page);

  t.ok(/no se pidió cómo llega/.test(await cuerpo()), 'un enlace 4G/5G sin pedir «WAN celular» se avisa');
  t.ok(await page.$eval('#fldCelularVia', (e) => e.hidden), '«Cómo llega» no se ve sin WAN celular');

  // Wi-Fi integrado.
  await page.check('#chkWifi');
  await asentar(page);
  const bomWifi = await texto('#bomBody .model');
  t.ok(/^FortiWiFi /.test(bomWifi.trim()), `con Wi-Fi el BOM sigue a un FortiWiFi (${bomWifi})`);
  const todo = await cuerpo();
  t.ok(/FWF-\d+G-\[RC\]/.test(todo) && /código regional/.test(todo), 'el SKU sale con [RC] y la página pide elegir el código regional');
  t.ok(/no es que la lista no los traiga/.test(todo), 'sin precio extraído lo dice como es, no como «la lista no lo trae»');
  await page.uncheck('#chkWifi');
  await asentar(page);

  // 5G con módem integrado.
  await page.selectOption('#celularGen', '5g');
  await asentar(page);
  t.ok(!(await page.$eval('#fldCelularVia', (e) => e.hidden)), '«Cómo llega» aparece con WAN celular, marcado obligatorio');
  t.ok(/cómo llega el enlace 4G\/5G/i.test(await cuerpo()), 'sin elegirlo falta el dato, no se elige por silencio');
  await page.selectOption('#celularVia', 'integrado');
  await asentar(page);
  const bom5g = await texto('#bomBody .model');
  t.ok(/5G/.test(bom5g), `con 5G integrado el BOM lleva una variante con módem 5G (${bom5g})`);

  // FortiExtender 5G: el FortiGate vuelve a ser el de siempre y el FortiExtender entra en el BOM.
  await page.selectOption('#celularVia', 'extender');
  await asentar(page);
  const res = await texto('#celularResultado');
  t.ok(/FortiExtender WAN 50G/.test(res) && /400 Mbps/.test(res), `el resultado nombra el FortiExtender y la bajada (${res.slice(0, 90)}…)`);
  t.ok(/FortiExtender 101G, su módem es LTE CAT-6: no es 5G/.test(res), 'aparta los 4G con su motivo');
  const bomFg = await texto('#bomBody .model');
  t.ok(/^FortiGate \d+[FG]$/.test(bomFg.trim()), `el FortiGate es un modelo base (${bomFg})`);
  t.ok(/FortiExtender WAN 50G/.test(await texto('#bomTabla')), 'la línea del FortiExtender está en el BOM');
  // Su figura de la ficha, cargada de verdad, con su leyenda numerada (2026-11-10).
  const fig = await page.$eval('#celularResultado', (c) => {
    const img = c.querySelector('figure.fex-figura img');
    return img ? { src: img.getAttribute('src'), ancho: img.naturalWidth, filas: c.querySelectorAll('.ficha-leyenda tbody tr').length } : null;
  });
  t.ok(fig && fig.src === '/img/equipos/fex-50g-front.webp' && fig.ancho > 0,
    `el FortiExtender WAN 50G enseña su figura de la ficha (${fig ? `${fig.src}, ${fig.ancho} px` : 'ninguna'})`);
  t.ok(fig && fig.filas === 8, `con su leyenda de 8 números (${fig ? fig.filas : 0})`);

  // 4G por FortiExtender: 400 Mbps no caben en el 101G (300 Mbps de bajada).
  await page.selectOption('#celularGen', '4g');
  await asentar(page);
  const res4 = await texto('#celularResultado');
  t.ok(/FortiExtender 211G/.test(res4) && /101G, su módem publica 300 Mbps/.test(res4), 'con 4G a 400 Mbps va el 211G y el 101G se aparta por su bajada');
  t.ok(/no dibuja el FortiExtender 211G: sin figura oficial/.test(res4) && !(await page.$('#celularResultado figure.fex-figura')),
    'el 211G, que la ficha no dibuja, lo dice y no enseña la figura de otro');

  // El enlace compartido reabre lo mismo.
  const url = page.url();
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#stickyReco', { timeout: 20000 });
  await asentar(page);
  t.ok(await page.inputValue('#celularGen') === '4g' && await page.inputValue('#celularVia') === 'extender',
    'el enlace guarda la generación y el camino del enlace celular');
  t.ok(/FortiExtender 211G/.test(await texto('#celularResultado')), 'y vuelve a elegir el mismo FortiExtender');

  t.ok(errores.length === 0, `sin excepciones de página (${errores.join(' | ') || 'ninguna'})`);
  await browser.close();
  t.resumen('e2e-fortinet-wifi-celular');
})().catch((e) => { console.error(e); process.exit(1); });
