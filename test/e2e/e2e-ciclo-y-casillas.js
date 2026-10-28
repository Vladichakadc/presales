'use strict';
/* Dos peticiones del dueño del 2026-10-27, en las páginas reales:
   1. «Resalta en rojo en el combo cuando los equipos están o van a estar fuera de venta»: en el
      selector de modelo de Cisco las opciones fuera de venta (los ASR 1000) y las de fin de venta
      anunciado salen en rojo y con su texto, y el desplegable cerrado se tiñe cuando la elegida es
      una de ellas. Las vigentes no.
   2. «Resalta cuando se activa una funcionalidad activando el check»: al marcar una casilla de
      función su fila se tiñe y gana la barra del acento; al desmarcarla vuelve a como estaba, y la
      casilla no se mueve de sitio. Se conduce en Cisco, Fortinet y Nokia 7220 (la única página sin
      ficha: comparte la hoja común). */
const { cargarPlaywright, BASE, abrirSesion, asentar, trasNavegar, contador } = require('./ayuda');

const ROJO = 'rgb(180, 35, 24)'; // --ciclo-rojo de controles.css

const fila = (page, id) => page.$eval(`#${id}`, (el) => {
  const l = el.closest('label');
  const cs = globalThis.getComputedStyle(l);
  const r = el.getBoundingClientRect();
  return { fondo: cs.backgroundColor, sombra: cs.boxShadow, peso: cs.fontWeight, x: Math.round(r.left), y: Math.round(r.top), marcada: el.checked };
});

async function probarCasilla(t, page, id, pagina) {
  const antes = await fila(page, id);
  if (antes.marcada) { await page.click(`#${id}`); await asentar(page); }
  const off = await fila(page, id);
  await page.click(`#${id}`);
  await asentar(page);
  const on = await fila(page, id);
  t.ok(on.marcada && on.fondo !== off.fondo && /inset/.test(on.sombra) && Number(on.peso) >= 600,
    `${pagina}: al marcar #${id} la fila se resalta (fondo ${off.fondo} → ${on.fondo}, barra y seminegrita)`);
  t.ok(on.x === off.x && Math.abs(on.y - off.y) <= 1, `${pagina}: la casilla no se mueve al marcarla`);
  await page.click(`#${id}`);
  await asentar(page);
  const otraVez = await fila(page, id);
  t.ok(!otraVez.marcada && otraVez.fondo === off.fondo && !/inset/.test(otraVez.sombra),
    `${pagina}: al desmarcarla vuelve a como estaba`);
}

(async () => {
  const { chromium } = cargarPlaywright();
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errores = [];
  page.on('pageerror', (e) => errores.push(e.message));
  const t = contador();
  await abrirSesion(page);

  // --- Cisco: el selector de modelo del BOM lista el catálogo entero, con los ASR fuera de venta.
  // El selector de modelo vive en la pestaña BOM, oculta al cargar: se espera a la ficha y a que el
  // combo esté poblado, y se cambia de pestaña antes de elegir.
  await trasNavegar(page, () => page.goto(`${BASE}/dimensionador-cisco-catalyst8k.html`, { waitUntil: 'domcontentloaded' }), { selector: '#verdict-sel' });
  await page.waitForFunction(() => globalThis.document.querySelectorAll('#pickModel option').length > 1, null, { timeout: 20000 });
  await asentar(page);
  // La casilla primero, en la pestaña de dimensionamiento que está a la vista.
  await probarCasilla(t, page, 'chkFec', 'Cisco');
  const ops = await page.$$eval('#pickModel option', (os) => os.map((o) => ({
    v: o.value, t: o.textContent, c: o.dataset.ciclo || '', color: globalThis.getComputedStyle(o).color,
  })));
  const fuera = ops.filter((o) => o.c === 'fuera');
  const anunciados = ops.filter((o) => o.c === 'anunciado');
  const vigentes = ops.filter((o) => !o.c && o.v);
  t.ok(fuera.length > 0 && fuera.every((o) => o.color === ROJO && /fuera de venta|fin de venta vencido/.test(o.t)),
    `los fuera de venta van en rojo y lo dicen (${fuera.length}: ${fuera.slice(0, 3).map((o) => o.v).join(', ')}…)`);
  t.ok(anunciados.every((o) => o.color === ROJO && /fin de venta (el \d{4}-\d{2}-\d{2}|anunciado)/.test(o.t)),
    `los de fin de venta anunciado, también en rojo y con su fecha (${anunciados.length})`);
  t.ok(vigentes.length > 0 && vigentes.every((o) => o.color !== ROJO), 'los vigentes no van en rojo');

  await page.click('[data-tab=bom]');
  await asentar(page);
  const cerrado = () => page.$eval('#pickModel', (s) => globalThis.getComputedStyle(s).color);
  if (vigentes.length) {
    await page.selectOption('#pickModel', vigentes[0].v);
    await asentar(page);
    t.ok((await cerrado()) !== ROJO, 'con un vigente elegido, el desplegable no se tiñe');
  }
  if (fuera.length) {
    await page.selectOption('#pickModel', fuera[0].v);
    await asentar(page);
    t.ok((await cerrado()) === ROJO, `con ${fuera[0].v} elegido, el desplegable cerrado se ve en rojo`);
  }

  // La misma regla en el desplegable de la ficha (FICHA.opcionCiclo): sus opciones con ciclo, en rojo.
  const ficha = await page.$$eval('#verdict-sel option', (os) => os.filter((o) => o.dataset.ciclo).map((o) => globalThis.getComputedStyle(o).color));
  t.ok(ficha.every((c) => c === ROJO), `el desplegable de la ficha usa la misma regla (${ficha.length} con ciclo)`);

  // --- Fortinet: una función que fija el piso de capa.
  await trasNavegar(page, () => page.goto(`${BASE}/dimensionador-fortinet-fortigate.html`, { waitUntil: 'domcontentloaded' }), { selector: '#chkAv' });
  await asentar(page);
  await probarCasilla(t, page, 'chkAv', 'Fortinet');

  // --- Nokia 7220 IXR: sin ficha, con la hoja común.
  await trasNavegar(page, () => page.goto(`${BASE}/dimensionador-nokia-7220ixr.html`, { waitUntil: 'domcontentloaded' }), { selector: '#chkDual' });
  await asentar(page);
  await probarCasilla(t, page, 'chkDual', 'Nokia 7220 IXR');

  t.ok(errores.length === 0, 'sin errores de JS' + (errores.length ? ': ' + errores.join(' | ') : ''));
  await browser.close();
  process.exit(t.resumen('e2e-ciclo-y-casillas'));
})().catch((e) => { console.error('ERROR E2E:', e.message); process.exit(2); });
