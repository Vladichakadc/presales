'use strict';
/* global window, document, getComputedStyle */
/*   ↑ los callbacks de page.evaluate corren EN el navegador; eslint los analiza como
     código Node y sin esta declaración marcaría no-undef sobre funciones del DOM.
   E2E del panel «Equipos que cumplen» FIJO (2026-09-16, petición directa del dueño):
   la columna derecha queda clavada (top:16) SIN scroll interno —«no es funcional para
   los usuarios»— y el único scroll es el de la página, que gobierna la columna de
   configuración. Para que sea posible la tarjeta va compacta (foto + candidatos +
   medidores) y el detalle largo vive abajo en #verdict-detalle; este script es la
   guardia: si el panel crece más allá del viewport o alguien le devuelve el overflow,
   rompe aquí. Conserva además la regresión original (v29): el panel no se suelta
   antes del fondo de la página. */
const { cargarPlaywright, abrirDimensionador, contador } = require('./ayuda');

(async () => {
  const { chromium } = cargarPlaywright();
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const t = contador();

  await abrirDimensionador(page);
  await page.fill('#users', '300');
  await page.locator('.wan-fila').first().locator('input[data-campo=down]').fill('500');
  await page.waitForTimeout(900);

  const PANEL = '.cols>.col-fijo';
  const sticky = await page.$eval(PANEL, (el) => getComputedStyle(el).position);
  t.ok(sticky === 'sticky', 'el panel «Equipos que cumplen» es position:sticky');

  // ── SIN SCROLL INTERNO: ni overflow auto/scroll ni contenido que lo exija ──
  const desborde = await page.$eval(PANEL, (el) => ({
    overflowY: getComputedStyle(el).overflowY,
    exceso: el.scrollHeight - el.clientHeight,
    alto: Math.round(el.getBoundingClientRect().height),
  }));
  t.ok(desborde.overflowY !== 'auto' && desborde.overflowY !== 'scroll',
    `el panel no tiene scroll interno propio (overflow-y=${desborde.overflowY})`);
  t.ok(desborde.exceso <= 1,
    `el contenido del panel no desborda su caja (scrollHeight-clientHeight=${desborde.exceso})`);
  t.ok(desborde.alto <= 900,
    `el panel cabe entero en el viewport (alto=${desborde.alto}px ≤ 900) — si crece, hay que sacar contenido a #verdict-detalle, no darle scroll`);

  // ── sigue clavado a top:16 de principio a fin (regresión v29) ──
  const topAl = async () => page.$eval(PANEL, (el) => Math.round(el.getBoundingClientRect().top));
  // El sticky solo se clava cuando el scroll pasa su posición natural: se mide primero
  // esa posición y se supera con margen, en vez de un número a ojo que cambia con el alto
  // de la cabecera.
  const offsetNatural = await page.$eval(PANEL, (el) => el.offsetTop);

  await page.evaluate((y) => window.scrollTo(0, y), offsetNatural + 400);
  await page.waitForTimeout(300);
  const topMedio = await topAl();
  t.ok(Math.abs(topMedio - 16) <= 2, `panel clavado a top:16 pasada su posición natural (top=${topMedio})`);

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(400);
  const topFondo = await topAl();
  const sId = await page.evaluate(() => window.scrollY);
  t.ok(sId > 1000, `la página sí se desplazó hasta el fondo (scrollY=${sId})`);
  t.ok(topFondo >= 10 && topFondo <= 18,
    `panel sigue clavado al llegar al fondo (top=${topFondo}) — la regresión lo soltaba ~187 px antes`);

  // ── el detalle largo vive en la pestaña «Equipo»: FUERA del panel clavado y
  //    alcanzable a UN clic desde la barra de pestañas, siempre visible
  //    (2026-09-16: la 1.ª versión lo dejó a ~6300 px —7 viewports— y el dueño
  //    reportó las características «perdidas»; la 2.ª, dentro de la columna
  //    izquierda, medía igual de profundo. La pestaña es la solución) ──
  const detalle = await page.$eval('#verdict-detalle', (el) => ({
    texto: (el.textContent || '').length,
    enPaneEquipo: !!el.closest('#pane-equipo'),
    titulo: (el.querySelector('.ficha-det-tit') || {}).textContent || '',
  }));
  t.ok(detalle.texto > 200, `el detalle de la ficha (porqué + secciones) se pinta en #verdict-detalle (${detalle.texto} caracteres)`);
  t.ok(detalle.enPaneEquipo,
    'el detalle vive DENTRO de la pestaña «Equipo» (#pane-equipo) — si vuelve al flujo de «Dimensionar», queda enterrado a ~6300 px y «se pierde»');
  t.ok(/Características del equipo seleccionado/.test(detalle.titulo),
    `el detalle se encabeza con su título (${detalle.titulo.trim().slice(0, 60)})`);
  const veredictoTieneWhy = await page.$eval(PANEL, (el) => !!el.querySelector('.why'));
  t.ok(!veredictoTieneWhy, 'la tarjeta clavada ya no carga el porqué/secciones largas — eso es lo que forzaba el scroll');

  // La pestaña existe en la barra y la pista de vacío se oculta al haber detalle
  const tabEquipo = await page.$('.tabs button[data-tab="equipo"]');
  t.ok(!!tabEquipo, 'la barra de pestañas incluye «Equipo»');
  const pistaOculta = await page.$eval('#detalleVacio', (el) => getComputedStyle(el).display === 'none');
  t.ok(pistaOculta, 'la pista «Configure el sitio…» se oculta cuando ya hay detalle pintado');

  // ── wayfinding: la tarjeta declara dónde están las características y el salto
  //    cambia a la pestaña «Equipo» y las deja a la vista ──
  const salto = await page.$('#verdict .ficha-salto a');
  t.ok(!!salto, 'la tarjeta fija lleva el enlace «Ver características del equipo ↓»');
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(200);
  await salto.click();
  await page.waitForTimeout(1200);
  const estado = await page.evaluate(() => ({
    paneVisible: !document.getElementById('pane-equipo').hidden,
    tabActiva: document.querySelector('.tabs button[data-tab="equipo"]').getAttribute('aria-selected') === 'true',
    topDetalle: Math.round(document.getElementById('verdict-detalle').getBoundingClientRect().top),
  }));
  t.ok(estado.paneVisible, 'el salto revela la pestaña «Equipo» (pane-equipo visible)');
  t.ok(estado.tabActiva, 'el salto marca «Equipo» como pestaña activa');
  t.ok(estado.topDetalle >= 0 && estado.topDetalle <= 900,
    `el salto deja las características a la vista (top=${estado.topDetalle}px en un viewport de 900)`);

  await browser.close();
  process.exit(t.resumen('e2e-sticky'));
})().catch((e) => { console.error('ERROR E2E:', e.message); process.exit(2); });
