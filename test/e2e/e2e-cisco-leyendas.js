'use strict';
/* La leyenda de los números de las figuras de Cisco (2026-10-27, petición del dueño: «al ampliar
   la imagen deberá mostrar la tabla donde se indica a qué hace referencia cada puerto con su
   número»). Se conduce lo que el dueño ve: la tarjeta ofrece la tabla de la cara que enseña, la
   pestaña la cambia por la de la otra cara, y la lupa la pinta bajo la figura ampliada y la
   cambia con las flechas. El sujeto es el C8130-G2: frontal de 8 números (tabla 1 de su ficha) y
   trasera de 2 (figura 1 de la guía de la serie 8100). */
const { cargarPlaywright, BASE, abrirSesion, asentar, trasNavegar, contador } = require('./ayuda');

const PAGINA = `${BASE}/dimensionador-cisco-catalyst8k.html?bw=100`;
const MODELO = 'Cisco Secure Router C8130-G2';

const leerTarjeta = (page) => page.evaluate(() => {
  const d = globalThis.document.querySelector('#verdict .ficha-vista-leyenda');
  return d ? {
    visible: !d.hidden,
    resumen: (d.querySelector('summary') || {}).textContent || '',
    filas: [...d.querySelectorAll('tbody tr')].map((tr) => [...tr.cells].map((td) => td.textContent.replace(/\s+/g, ' ').trim()).join(' ')),
  } : null;
});
const leerLupa = (page) => page.evaluate(() => {
  const l = globalThis.document.querySelector('#fichaLupa');
  const c = l && l.querySelector('.ficha-lupa-leyenda');
  return {
    abierta: !!(l && !l.hidden),
    visible: !!(c && !c.hidden),
    titulo: ((c && c.querySelector('.ficha-leyenda-tit')) || {}).textContent || '',
    filas: c ? [...c.querySelectorAll('tbody tr')].map((tr) => [...tr.cells].map((td) => td.textContent.replace(/\s+/g, ' ').trim()).join(' ')) : [],
    // La tabla tiene que verse con la figura, no quedar fuera de la caja sin poder llegar.
    alcanzable: !!(c && c.getBoundingClientRect().top < globalThis.innerHeight),
  };
});

(async () => {
  const { chromium } = cargarPlaywright();
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const t = contador();

  await abrirSesion(page);
  await trasNavegar(page, () => page.goto(PAGINA, { waitUntil: 'domcontentloaded' }), { selector: '#verdict-sel' });
  await asentar(page);
  const hay = await page.evaluate((m) => [...globalThis.document.querySelectorAll('#verdict-sel option')].some((o) => o.value === m), MODELO);
  t.ok(hay, `el ${MODELO} está en el selector de la ficha`);
  if (hay) {
    await page.selectOption('#verdict-sel', MODELO);
    await asentar(page);
  }

  const frente = await leerTarjeta(page);
  t.ok(frente && frente.visible && /Qué es cada número \(8\)/.test(frente.resumen),
    `la tarjeta ofrece la leyenda de la cara frontal (${frente && frente.resumen})`);
  t.ok(frente && frente.filas.length === 8 && /^1 LED de estado y LED baliza azul/.test(frente.filas[0])
    && frente.filas.some((f) => /^4 4 puertos GE RJ-45 4 x GE RJ-45 ports$/.test(f)),
  `cada número con lo que es y su rótulo literal (${frente && frente.filas.slice(0, 2).join(' / ')})`);

  await page.click('#verdict .ficha-vista-tab[data-vista=rear]');
  await asentar(page);
  const trasera = await leerTarjeta(page);
  t.ok(trasera && trasera.visible && /\(2\)/.test(trasera.resumen) && /^1 Estado del sistema/.test(trasera.filas[0] || ''),
    `la pestaña «Trasera» cambia la leyenda por la de esa cara (${trasera && trasera.resumen})`);

  await page.click('#verdict .ficha-vista-zoom');
  await asentar(page);
  const lupaT = await leerLupa(page);
  t.ok(lupaT.abierta && lupaT.visible && lupaT.filas.length === 2 && /trasera/.test(lupaT.titulo),
    `al ampliar, la tabla de los números va bajo la figura (${lupaT.filas.join(' / ')})`);
  t.ok(lupaT.alcanzable, 'y queda a la vista dentro de la caja');
  await page.keyboard.press('ArrowRight');
  await asentar(page);
  const lupaF = await leerLupa(page);
  t.ok(lupaF.visible && lupaF.filas.length === 8 && /frontal · tabla 1 de la ficha/.test(lupaF.titulo),
    `las flechas cambian de cara y la tabla con ella (${lupaF.titulo})`);
  t.ok(lupaF.filas.some((f) => /^8 Ranura de bloqueo Kensington y tornillo de tierra/.test(f)),
    'el último número de la frontal está en la tabla');
  await page.keyboard.press('Escape');
  await asentar(page);

  await browser.close();
  process.exit(t.resumen('e2e-cisco-leyendas'));
})().catch((e) => { console.error('ERROR E2E:', e.message); process.exit(2); });
