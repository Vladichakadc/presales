'use strict';
/* global document */
/* «Fuentes oficiales» del portal (2026-11-01, la mejora propuesta al cerrar el PR #71): un botón que
   comprueba las fuentes de los siete fabricantes, de uno en uno, con la ruta del botón «Actualizar
   fuentes» de cada dimensionador.

   La ruta de salud se SIMULA (`page.route`): la de verdad vuelve a leer cada documento en el sitio del
   fabricante, y una batería que corre en cada PR no puede pegar a siete fabricantes. Lo que se mide
   aquí es la página: que va de uno en uno en la red, lo que pinta en cada fila (también un fabricante
   que falla), la línea final y que el enlace abre la pestaña «Fuentes» de su dimensionador. */
const { cargarPlaywright, abrirSesion, BASE, asentar, contador } = require('./ayuda');

const RESPUESTAS = {
  huawei: { resumen: { sinCambios: 30, cambiaron: 2, primera: 1 }, n: 33 },
  cisco: { error: 500 },
  fortinet: { resumen: { sinCambios: 16 }, n: 16, deCache: true },
  juniper: { resumen: { sinCambios: 10 }, n: 10 },
  mikrotik: { resumen: { sinCambios: 28 }, n: 28 },
  aruba: { resumen: { sinCambios: 12, inalcanzables: 2 }, n: 14 },
  nokia: { resumen: { sinCambios: 4 }, n: 4 },
};

(async () => {
  const { chromium } = cargarPlaywright();
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const t = contador();
  const errores = [];
  page.on('pageerror', (e) => errores.push(e.message));

  let enVuelo = 0;
  let maximo = 0;
  const orden = [];
  // La vigilancia del lunes (2026-11-02): `/api/fuentes` se pide al abrir la sección, una vez, y no al
  // cargar el portal. Esa ruta NO se simula: el vigía es el lock del repositorio, sin salir a la red.
  let pedidasFuentes = 0;
  page.on('request', (r) => { if (new URL(r.url()).pathname === '/api/fuentes') pedidasFuentes += 1; });
  await page.route('**/api/fuentes/*/salud', async (route) => {
    const vendor = new URL(route.request().url()).pathname.split('/')[3];
    enVuelo += 1; maximo = Math.max(maximo, enVuelo); orden.push(vendor);
    await new Promise((r) => setTimeout(r, 150));
    enVuelo -= 1;
    const d = RESPUESTAS[vendor];
    if (!d || d.error) {
      await route.fulfill({ status: d ? d.error : 404, contentType: 'application/json', body: JSON.stringify({ error: 'No se pudieron comprobar las fuentes' }) });
      return;
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
      vendor, revisadoEn: new Date().toISOString(), deCache: !!d.deCache, resumen: d.resumen,
      fuentes: Array.from({ length: d.n }, () => ({})),
    }) });
  });

  await abrirSesion(page);
  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
  await asentar(page);
  t.ok(pedidasFuentes === 0, `al cargar el portal no se pide /api/fuentes (${pedidasFuentes})`);
  await page.click('.nav-btn[data-page="fuentes"]');
  t.ok(await page.isVisible('#page-fuentes'), 'el botón de la barra lateral abre «Fuentes oficiales»');
  await page.waitForFunction(() => {
    const celdas = [...document.querySelectorAll('#fpCuerpo .fp-vigia')];
    return celdas.length === 7 && celdas.every((c) => !/Leyendo/.test(c.textContent));
  }, null, { timeout: 15000 });
  t.ok(pedidasFuentes === 1, `al abrir la sección, /api/fuentes una sola vez (${pedidasFuentes})`);

  const filas = () => page.$$eval('#fpCuerpo tr', (trs) => trs.map((tr) => ({
    fab: tr.dataset.fpFab, texto: [...tr.children].map((c) => c.textContent.replace(/\s+/g, ' ').trim()).join(' | '), href: (tr.querySelector('a') || {}).getAttribute ? tr.querySelector('a').getAttribute('href') : '' })));
  const antes = await filas();
  t.ok(antes.length === 7 && antes.every((f) => /Sin comprobar/.test(f.texto)), `siete filas sin comprobar antes de pulsar (${antes.length})`);
  t.ok(antes.every((f) => /^\/dimensionador-[a-z0-9-]+\.html\?tab=src$/.test(f.href)), 'cada fila enlaza a la pestaña «Fuentes» de su dimensionador');
  const { FUENTES } = require('../../server/seed/legacyData/fuentes');
  const huaweiAntes = antes.find((f) => f.fab === 'huawei').texto;
  t.ok(new RegExp(`^Huawei \\| ${FUENTES.huawei.length} \\| \\d+ sin cambios.*(leído sin cambios por última vez el \\d{4}-\\d\\d-\\d\\d|no comprobada).* \\| Sin comprobar \\| — \\|`).test(huaweiAntes),
    `antes de comprobar, el vigía ya dice lo suyo, con su fecha y sus ${FUENTES.huawei.length} documentos («${huaweiAntes}»)`);
  t.ok(antes.every((f) => /^\S.* \| \d+ \| \d+ sin cambios/.test(f.texto)), 'los siete traen la columna del vigía');

  await page.click('#fpComprobar');
  await page.waitForFunction(() => /Comprobando Huawei \(1 de 7\)/.test(document.getElementById('fpEstado').textContent), null, { timeout: 5000 });
  t.ok(await page.isDisabled('#fpComprobar'), 'mientras comprueba, el botón no admite otra pulsación');
  await page.waitForFunction(() => /^Comprobados los 7/.test(document.getElementById('fpEstado').textContent), null, { timeout: 20000 });

  t.ok(maximo === 1, `de uno en uno en la red (máximo a la vez: ${maximo})`);
  t.ok(orden.join(',') === 'huawei,cisco,fortinet,juniper,mikrotik,aruba,nokia', `en el orden del portal (${orden.join(', ')})`);
  t.ok(!(await page.isDisabled('#fpComprobar')), 'al terminar, el botón vuelve a estar disponible');

  const despues = Object.fromEntries((await filas()).map((f) => [f.fab, f.texto]));
  t.ok(/^Huawei \| 33 \| \d+ sin cambios.* \| 30 sin cambios · 2 cambiaron sin contrastar · 1 sin medición previa \| \d\d:\d\d \|/.test(despues.huawei), `Huawei: «${despues.huawei}»`);
  t.ok(/No se pudo comprobar: No se pudieron comprobar las fuentes/.test(despues.cisco), `Cisco, que falla, lo dice y no para a los demás: «${despues.cisco}»`);
  t.ok(/de hace menos de 10 min/.test(despues.fortinet), 'Fortinet, servido de la caché del servidor, lo dice');
  t.ok(/12 sin cambios · 2 inalcanzables/.test(despues.aruba), `Aruba: «${despues.aruba}»`);
  t.ok(/^Nokia \| 4 \| \d+ sin cambios.* \| 4 sin cambios \|/.test(despues.nokia), `Nokia, el último, también se comprobó: «${despues.nokia}»`);

  const estado = await page.textContent('#fpEstado');
  t.ok(estado === 'Comprobados los 7 fabricantes: cambiaron documentos sin contrastar en Huawei; hay documentos inalcanzables en Aruba; no se pudo comprobar Cisco.',
    `la línea final nombra a quién mirar («${estado}»)`);

  await page.click('.nav-btn[data-page="dashboard"]');
  await page.click('.nav-btn[data-page="fuentes"]');
  await asentar(page);
  t.ok(pedidasFuentes === 1, `volver a la sección no repite la petición (${pedidasFuentes})`);

  // La última corrida del vigía que llegó a main (2026-11-02, tras el PR #122). La fecha real del lock
  // cambia con cada corrida fusionada: aquí se mira la forma y que el aviso vaya con su texto.
  const linea = await page.textContent('#fpVigiaCorrida');
  t.ok(await page.isVisible('#fpVigiaCorrida')
    && /^«Vigía semanal» es la corrida del \d{4}-\d\d-\d\d \((hoy|hace \d+ días?)\), la última que se fusionó en main\./.test(linea),
  `la línea dice de qué corrida del vigía es la columna («${linea}»)`);
  const alerta = await page.$eval('#fpVigiaCorrida', (e) => e.classList.contains('fp-alerta'));
  t.ok(alerta === /Pasa de una semana/.test(linea), 'el color de aviso va con el texto del aviso, no solo');

  // El enlace lleva a la pestaña «Fuentes» del dimensionador de verdad.
  await page.click('#fpCuerpo tr[data-fp-fab="huawei"] a');
  await page.waitForURL(/dimensionador-huawei-netengine\.html\?tab=src/, { timeout: 10000 });
  await asentar(page);
  t.ok(await page.getAttribute('.tabs button[data-tab="src"]', 'aria-selected') === 'true', 'el enlace de Huawei abre su pestaña «Fuentes»');

  // Con un lock viejo (la respuesta real, retocada en la red), avisa.
  const vieja = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  vieja.on('pageerror', (e) => errores.push(e.message));
  await vieja.route((u) => u.pathname === '/api/fuentes', async (route) => {
    const res = await route.fetch();
    const d = await res.json();
    for (const k of Object.keys(d)) d[k].vigiaRevisado = '2020-01-06T12:00:00.000Z';
    await route.fulfill({ response: res, json: d });
  });
  await abrirSesion(vieja);
  await vieja.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
  await asentar(vieja);
  await vieja.click('.nav-btn[data-page="fuentes"]');
  await vieja.waitForSelector('#fpVigiaCorrida:not([hidden])', { timeout: 15000 });
  const lineaVieja = await vieja.textContent('#fpVigiaCorrida');
  t.ok(/corrida del 2020-01-06 \(hace \d+ días\).*Pasa de una semana: la corrida siguiente no corrió o espera en la rama vigia\/fuentes/.test(lineaVieja)
    && await vieja.$eval('#fpVigiaCorrida', (e) => e.classList.contains('fp-alerta')),
  `con la última corrida fusionada hace años, avisa en ámbar («${lineaVieja.slice(0, 90)}…»)`);
  await vieja.close();

  t.ok(errores.length === 0, `sin excepciones de página (${errores.join(' | ') || 'ninguna'})`);
  await browser.close();
  t.resumen('e2e-fuentes-portal');
})().catch((e) => { console.error(e); process.exit(1); });
