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
  t.ok((await page.$$('#celularResultado figure.fex-figura .fex-cara')).length === 1 && /solo dibuja la cara de puertos/.test(res + (await texto('#celularResultado'))),
    'del WAN 50G la ficha solo dibuja una cara, y lo dice');

  // Dónde va el FortiExtender (2026-11-11): los de vehículo y exterior solo compiten al pedirlos.
  t.ok(!(await page.$eval('#fldCelularEntorno', (e) => e.hidden)), '«Dónde va el FortiExtender» aparece con FortiExtender');
  t.ok(/FortiExtender Vehicle 511G, es un equipo de vehículo: compite al pedir ese entorno/.test(res) && /FortiExtender 200F, no tiene módem/.test(res),
    'sin pedir entorno, los de vehículo y el 200F salen apartados con su motivo');
  await page.selectOption('#celularEntorno', 'vehiculo');
  await asentar(page);
  const resVeh = await texto('#celularResultado');
  t.ok(/FortiExtender: FortiExtender Vehicle 511G/.test(resVeh) && /FortiExtender Rugged Data Sheet/.test(resVeh), `en vehículo va el Vehicle 511G, citando su ficha (${resVeh.slice(0, 90)}…)`);
  t.ok(/FortiExtender Vehicle 511G/.test(await texto('#bomTabla')) && /FEV-511G/.test(await texto('#bomTabla')), 'y entra en el BOM con su SKU');
  t.ok(/vehiculo/.test(page.url()), 'el entorno viaja en el enlace');
  t.ok((await page.$$('#celularResultado figure.fex-figura .fex-cara')).length === 2 && /FEXR-DAT-R08-20260805/.test(resVeh + (await texto('#celularResultado'))),
    'el Vehicle 511G enseña sus dos caras, de la ficha Rugged');
  t.ok((await page.$$('#celularResultado figure.fex-figura .fex-cara[data-cara="front"] details.ficha-vista-leyenda')).length === 1, 'con la leyenda de la cara de puertos');
  await page.selectOption('#celularEntorno', 'exterior');
  await asentar(page);
  t.ok(/FortiExtender: FortiExtender Rugged 511G/.test(await texto('#celularResultado')), 'a la intemperie va el Rugged 511G');
  await page.selectOption('#celularEntorno', '');
  await asentar(page);
  t.ok(/FortiExtender: FortiExtender WAN 50G/.test(await texto('#celularResultado')) && !/celularEntorno/.test(page.url()), 'y de vuelta a interior, el WAN 50G de siempre, sin rastro en el enlace');

  // 4G por FortiExtender: 400 Mbps no caben en el 101G (300 Mbps de bajada).
  await page.selectOption('#celularGen', '4g');
  await asentar(page);
  const res4 = await texto('#celularResultado');
  t.ok(/FortiExtender 211G/.test(res4) && /101G, su módem publica 300 Mbps/.test(res4), 'con 4G a 400 Mbps va el 211G y el 101G se aparta por su bajada');
  // El 211G, que la ficha no dibuja, enseña las dos caras de su QuickStart Guide, cada una con su leyenda (PR #185).
  const fig4 = await page.$eval('#celularResultado', (c) => ({
    caras: [...c.querySelectorAll('figure.fex-figura .fex-cara')].map((d) => ({ cara: d.dataset.cara, src: d.querySelector('img').getAttribute('src'), filas: d.querySelectorAll('.ficha-leyenda tbody tr').length })),
    pie: (c.querySelector('figure.fex-figura figcaption') || {}).textContent || '',
  })).catch(() => ({ caras: [], pie: '' }));
  await page.waitForFunction(() => [...document.querySelectorAll('#celularResultado figure.fex-figura img')].every((i) => i.complete && i.naturalWidth > 0), null, { timeout: 15000 }).catch(() => {});
  const anchos = await page.$$eval('#celularResultado figure.fex-figura img', (is) => is.map((i) => i.naturalWidth));
  t.ok(fig4.caras.length === 2 && fig4.caras[0].src === '/img/equipos/fex-211g-front.webp' && fig4.caras[1].src === '/img/equipos/fex-211g-rear.webp',
    `el 211G enseña sus dos figuras, no las de otro (${fig4.caras.map((x) => x.src).join(', ') || 'ninguna'})`);
  t.ok(anchos.length === 2 && anchos.every((w) => w > 0), `y las dos cargan (${anchos.join(', ')} px)`);
  t.ok(fig4.caras.length === 2 && fig4.caras.every((x) => x.filas === 6), `cada una con su leyenda de 6 números (${fig4.caras.map((x) => x.filas).join(', ')})`);
  t.ok(/QuickStart Guide FortiExtender 211G/.test(fig4.pie), 'y el pie dice de qué documento salen');

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
