'use strict';
/* global window, document, getComputedStyle */
/*   ↑ los callbacks de page.evaluate corren EN el navegador; eslint los analiza como
     código Node y sin esta declaración marcaría no-undef sobre funciones del DOM.
   E2E del panel «Equipos que cumplen» FIJO (2026-09-16, petición directa del dueño):
   la columna derecha queda clavada (top:16) SIN scroll interno —«no es funcional para
   los usuarios»— y el único scroll es el de la página, que gobierna la columna de
   configuración. La tarjeta va compacta (foto + candidatos + medidores) y las
   características se DESPLIEGAN DENTRO de la propia tarjeta (petición directa del
   dueño: «en el mismo cuadro donde recomiendas el equipo, como estaba antes — sin
   llevarlo a otra página»); al expandirse, la columna suelta el sticky para que el
   detalle se lea con el scroll normal. Este script es la guardia: si el panel
   plegado crece más allá del viewport, si alguien le devuelve el overflow, si el
   detalle sale de la tarjeta o si el sticky no se suelta al expandir, rompe aquí.
   Conserva además la regresión original (v29): el panel no se suelta antes del
   fondo de la página. */
const { cargarPlaywright, abrirDimensionador, asentar, contador } = require('./ayuda');

(async () => {
  const { chromium } = cargarPlaywright();
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const t = contador();

  await abrirDimensionador(page);
  await page.fill('#users', '300');
  await page.locator('.wan-fila').first().locator('input[data-campo=down]').fill('500');
  await asentar(page);

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
    `el panel PLEGADO cabe entero en el viewport (alto=${desborde.alto}px ≤ 900) — si crece, hay que compactar, no darle scroll`);

  // ── sigue clavado a top:16 de principio a fin (regresión v29) ──
  const topAl = async () => page.$eval(PANEL, (el) => Math.round(el.getBoundingClientRect().top));
  // El sticky solo se clava cuando el scroll pasa su posición natural: se mide primero
  // esa posición y se supera con margen, en vez de un número a ojo que cambia con el alto
  // de la cabecera.
  const offsetNatural = await page.$eval(PANEL, (el) => el.offsetTop);

  await page.evaluate((y) => window.scrollTo(0, y), offsetNatural + 400);
  await asentar(page);
  const topMedio = await topAl();
  t.ok(Math.abs(topMedio - 16) <= 2, `panel clavado a top:16 pasada su posición natural (top=${topMedio})`);

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await asentar(page);
  const topFondo = await topAl();
  const sId = await page.evaluate(() => window.scrollY);
  t.ok(sId > 1000, `la página sí se desplazó hasta el fondo (scrollY=${sId})`);
  t.ok(topFondo >= 10 && topFondo <= 18,
    `panel sigue clavado al llegar al fondo (top=${topFondo}) — la regresión lo soltaba ~187 px antes`);

  // ── las características viven DENTRO de la tarjeta, plegadas por defecto
  //    (2026-09-16, petición directa del dueño: «en el mismo cuadro donde
  //    recomiendas el equipo, como estaba antes — sin llevarlo a otra página»).
  //    La pestaña «Equipo» de la versión anterior se retira. ──
  const det = await page.$('#verdict-det');
  t.ok(!!det, 'la tarjeta lleva el contenedor del detalle (#verdict-det) en su interior');
  const detInfo = await page.$eval('#verdict-det', (el) => ({
    oculto: el.hidden,
    enTarjeta: !!el.closest('#verdict'),
    texto: (el.textContent || '').length,
    titulo: (el.querySelector('.ficha-det-tit') || {}).textContent || '',
  }));
  t.ok(detInfo.enTarjeta,
    'el detalle vive DENTRO de la tarjeta que recomienda el equipo — si sale a otro contenedor, «se pierde» (regresión de los ~6300 px)');
  t.ok(detInfo.oculto, 'el detalle arranca plegado: la tarjeta compacta es la que cabe en el viewport');
  t.ok(detInfo.texto > 200, `el detalle trae el porqué + las secciones (${detInfo.texto} caracteres)`);
  t.ok(/Características del equipo seleccionado/.test(detInfo.titulo),
    `el detalle se encabeza con su título (${detInfo.titulo.trim().slice(0, 60)})`);
  const tabEquipo = await page.$('.tabs button[data-tab="equipo"]');
  t.ok(!tabEquipo, 'ya no hay pestaña «Equipo»: el detalle no lleva a otra página');

  // ── expansión: el sticky se suelta y el detalle se lee con el scroll de la página ──
  const salto = await page.$('#verdict .ficha-salto a');
  t.ok(!!salto, 'la tarjeta fija lleva el conmutador «Ver características del equipo ↓»');
  await page.evaluate(() => window.scrollTo(0, 0));
  await asentar(page);
  await salto.click();
  await asentar(page);
  const abierto = await page.evaluate(() => {
    const col = document.querySelector('.cols>.col-fijo');
    return {
      detVisible: !document.getElementById('verdict-det').hidden,
      claseExp: col.classList.contains('expandida'),
      posicion: getComputedStyle(col).position,
      url: window.location.search,
      textoSalto: (document.getElementById('verdict-salto') || {}).textContent || '',
    };
  });
  t.ok(abierto.detVisible, 'el conmutador despliega las características en la misma tarjeta');
  t.ok(abierto.claseExp, 'al expandirse la columna recibe .expandida');
  t.ok(abierto.posicion === 'static',
    `al expandirse el sticky se SUELTA (position=${abierto.posicion}) — una tarjeta clavada más alta que el viewport dejaría el detalle inalcanzable`);
  t.ok(/Ocultar características/.test(abierto.textoSalto),
    `el conmutador pasa a «Ocultar características ↑» (${abierto.textoSalto.trim()})`);
  t.ok(/ficha=abierta/.test(abierto.url),
    `el estado expandido viaja en la URL (?ficha=abierta) — deep-link del escenario (${abierto.url.slice(0, 60)}…)`);

  // ── repliegue: vuelve el sticky y la tarjeta compacta ──
  await page.click('#verdict .ficha-salto a');
  await asentar(page);
  const plegado = await page.evaluate(() => {
    const col = document.querySelector('.cols>.col-fijo');
    return {
      detOculto: document.getElementById('verdict-det').hidden,
      sinClase: !col.classList.contains('expandida'),
      posicion: getComputedStyle(col).position,
      url: window.location.search,
    };
  });
  t.ok(plegado.detOculto, 'el conmutador repliega las características');
  t.ok(plegado.sinClase && plegado.posicion === 'sticky',
    `al plegarse el sticky se repone (position=${plegado.posicion})`);
  t.ok(!/ficha=abierta/.test(plegado.url), 'al plegarse el parámetro sale de la URL');

  // ── deep-link: cargar la página CON ?ficha=abierta abre las características solas ──
  const urlBase = await page.evaluate(() => window.location.href.split('?')[0] + '?' + window.location.search.replace(/^\?/, '').split('&').filter((p) => p && !p.startsWith('ficha=')).join('&'));
  await page.goto(urlBase + (urlBase.includes('?') && !urlBase.endsWith('?') ? '&' : '') + 'ficha=abierta', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#users', { timeout: 20000 });
  await asentar(page);
  const deeplink = await page.evaluate(() => ({
    detVisible: !!document.getElementById('verdict-det') && !document.getElementById('verdict-det').hidden,
    claseExp: document.querySelector('.cols>.col-fijo').classList.contains('expandida'),
  }));
  t.ok(deeplink.detVisible && deeplink.claseExp,
    'cargar con ?ficha=abierta deja las características desplegadas (deep-link del escenario)');

  await browser.close();
  process.exit(t.resumen('e2e-sticky'));
})().catch((e) => { console.error('ERROR E2E:', e.message); process.exit(2); });
