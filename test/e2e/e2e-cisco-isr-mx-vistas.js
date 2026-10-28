'use strict';
/* Las figuras que faltaban en el dimensionador Cisco (2026-10-28, encargo del dueño: «incluye las
   gráficas de los equipos Cisco, por qué no estás incluyendo la ISR; mejora los gráficos de los
   equipos MX»). Se conduce lo que el dueño ve en la tarjeta de la ficha:
     - ISR 1116-4P: Cisco solo dibuja la cara del logotipo; la tarjeta se abre por ella y la pestaña
       «Frontal» dice por qué no hay cara de puertos, en vez de desaparecer.
     - ISR 1161X-8P: la cara de puertos de la familia 11x1(X)-8P con su tabla de 9 números, y la foto.
     - Meraki MX75: se abre por la cara de puertos (Meraki la rotula «Back»), y ofrece la foto. */
const { cargarPlaywright, BASE, abrirSesion, asentar, trasNavegar, contador } = require('./ayuda');

const leer = (page) => page.evaluate(() => {
  const f = globalThis.document.querySelector('#verdict .ficha-vista');
  if (!f) return null;
  const on = f.querySelector('.ficha-vista-tab.on');
  const img = f.querySelector('.ficha-vista-img img');
  const notas = [...f.querySelectorAll('.ficha-vista-sinrear')].filter((n) => !n.hidden).map((n) => n.textContent);
  const ley = f.querySelector('.ficha-vista-leyenda');
  return {
    tabs: [...f.querySelectorAll('.ficha-vista-tab')].map((x) => x.dataset.vista),
    on: on ? on.dataset.vista : null,
    imgVisible: !!(img && !img.hidden && img.getAttribute('src')),
    src: img ? img.getAttribute('src') : '',
    notas,
    leyenda: ley && !ley.hidden ? ((ley.querySelector('summary') || {}).textContent || '') : '',
    pie: (f.querySelector('figcaption') || {}).textContent || '',
  };
});

async function elegir(page, url, modelo, t) {
  await trasNavegar(page, () => page.goto(url, { waitUntil: 'domcontentloaded' }), { selector: '#verdict-sel' });
  await asentar(page);
  const hay = await page.evaluate((m) => [...globalThis.document.querySelectorAll('#verdict-sel option')].some((o) => o.value === m), modelo);
  t.ok(hay, `el ${modelo} está en el selector de la ficha`);
  if (hay) { await page.selectOption('#verdict-sel', modelo); await asentar(page); }
  return hay;
}

(async () => {
  const { chromium } = cargarPlaywright();
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errores = [];
  page.on('pageerror', (e) => errores.push(e.message));
  const t = contador();
  await abrirSesion(page);

  if (await elegir(page, `${BASE}/dimensionador-cisco-catalyst8k.html?bw=50&plataforma=isr`, 'ISR 1116-4P', t)) {
    const v = await leer(page);
    t.ok(v && v.on === 'rear' && v.imgVisible && /cs-isr111x-rear/.test(v.src),
      `ISR 1116-4P: la tarjeta se abre por la cara del logotipo de la serie C111x (${v && v.on} ${v && v.src})`);
    await page.click('#verdict .ficha-vista-tab[data-vista=front]');
    await asentar(page);
    const f = await leer(page);
    t.ok(f && !f.imgVisible && f.notas.length === 1 && /no publica la cara de puertos del C1116-4P/.test(f.notas[0]),
      'ISR 1116-4P: la pestaña «Frontal» dice por qué no hay cara de puertos');
  }

  if (await elegir(page, `${BASE}/dimensionador-cisco-catalyst8k.html?bw=50&plataforma=isr`, 'ISR 1161X-8P', t)) {
    const v = await leer(page);
    t.ok(v && v.on === 'front' && /cs-isr11x1x-8p-front/.test(v.src) && /\(9\)/.test(v.leyenda),
      `ISR 1161X-8P: la cara de puertos de la familia 11x1(X)-8P con sus 9 números (${v && v.leyenda})`);
    t.ok(v && v.tabs.join() === 'front,rear,foto', `ISR 1161X-8P: frontal, trasera (con su nota) y foto (${v && v.tabs})`);
    await page.click('#verdict .ficha-vista-tab[data-vista=foto]');
    await asentar(page);
    const f = await leer(page);
    t.ok(f && f.imgVisible && /figura 3 «C1161X- 8PLTEP»/.test(f.pie), 'ISR 1161X-8P: la foto lleva su propio pie, con la figura de la ficha');
  }

  if (await elegir(page, `${BASE}/dimensionador-cisco-catalyst8k.html?bw=300&plataforma=meraki`, 'Meraki MX75', t)) {
    const v = await leer(page);
    t.ok(v && v.on === 'rear' && /cs-mx75-rear/.test(v.src), `Meraki MX75: se abre por la cara de puertos (${v && v.on})`);
    t.ok(v && v.tabs.includes('foto'), 'Meraki MX75: ofrece la foto de producto de su ficha');
  }

  t.ok(errores.length === 0, `sin errores de JS (${errores.join(' | ')})`);
  await browser.close();
  process.exit(t.resumen('e2e-cisco-isr-mx-vistas'));
})().catch((e) => { console.error('ERROR E2E:', e.message); process.exit(2); });
