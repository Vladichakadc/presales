'use strict';
/* Petición del dueño del 2026-10-28, en las páginas reales: «cuando se seleccione una opción de
   cualquier dimensionador, como ya se está resaltando en la parte de la izquierda, también se
   resalte en la parte de la derecha de todos los dimensionadores».

   En los ocho dimensionadores con casillas de función: arriba de la columna de resultados está el
   panel «Funciones activadas»; al marcar una casilla de la izquierda aparece su pastilla, con el
   mismo acento que la fila marcada; al desmarcarla, desaparece; un clic en la pastilla devuelve el
   foco a su casilla. */
const { cargarPlaywright, BASE, abrirSesion, asentar, trasNavegar, contador } = require('./ayuda');

const PAGINAS = ['aruba-edgeconnect', 'cisco-catalyst8k', 'fortinet-fortigate', 'huawei-netengine',
  'juniper-srx', 'mikrotik-routeros', 'nokia-7220ixr', 'nokia-7750sr'];

// La primera casilla de función visible, habilitada y sin marcar de la columna de parámetros de la
// primera rejilla que lleva panel.
const elegir = (page) => page.evaluate(() => {
  const panel = globalThis.document.querySelector('.funciones-activas');
  if (!panel) return null;
  const izq = panel.parentElement.parentElement.firstElementChild;
  const cb = [...izq.querySelectorAll('label > input[type="checkbox"]')].find((c) => !c.checked && !c.disabled && c.id
    && !c.parentElement.matches('.wan-sim, .wan-ov, .switch') && c.parentElement.getClientRects().length);
  return cb ? cb.id : null;
});

const estado = (page, id) => page.evaluate((idCasilla) => {
  const panel = globalThis.document.querySelector('.funciones-activas');
  const chip = panel.querySelector(`.fa-pastilla[data-para="${idCasilla}"]`);
  const fila = globalThis.document.getElementById(idCasilla).parentElement;
  return {
    n: Number(panel.querySelector('.fa-n').textContent),
    chip: !!chip,
    barraChip: chip ? globalThis.getComputedStyle(chip).boxShadow : '',
    barraFila: globalThis.getComputedStyle(fila).boxShadow,
    pesoChip: chip ? globalThis.getComputedStyle(chip).fontWeight : '',
  };
}, id);

(async () => {
  const { chromium } = cargarPlaywright();
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errores = [];
  page.on('pageerror', (e) => errores.push(e.message));
  const t = contador();
  await abrirSesion(page);

  for (const pag of PAGINAS) {
    await trasNavegar(page, () => page.goto(`${BASE}/dimensionador-${pag}.html`, { waitUntil: 'domcontentloaded' }), { selector: '.funciones-activas' });
    await asentar(page);
    const sitio = await page.evaluate(() => {
      const p = globalThis.document.querySelector('.funciones-activas');
      const rejilla = p.parentElement.parentElement;
      return { segunda: rejilla.children[1] === p.parentElement, rejilla: /\b(cols|dim)\b/.test(rejilla.className) };
    });
    t.ok(sitio.segunda && sitio.rejilla, `${pag}: el panel está arriba de la columna de resultados`);

    const id = await elegir(page);
    if (!id) { t.ok(false, `${pag}: no hay una casilla de función libre que marcar`); continue; }
    const antes = await estado(page, id);
    await page.click(`#${id}`);
    await asentar(page);
    const on = await estado(page, id);
    // Marcar una puede arrastrar otra (la página fija la que depende de ella): se cuenta al menos una más.
    t.ok(on.chip && on.n > antes.n, `${pag}: al marcar #${id} su pastilla aparece a la derecha (${antes.n} → ${on.n})`);
    t.ok(/inset/.test(on.barraChip) && on.barraChip === on.barraFila && Number(on.pesoChip) >= 600,
      `${pag}: la pastilla lleva el mismo resaltado que su fila (${on.barraChip})`);

    await page.click(`.funciones-activas .fa-pastilla[data-para="${id}"]`);
    await asentar(page);
    t.ok(await page.evaluate((x) => globalThis.document.activeElement && globalThis.document.activeElement.id === x, id), `${pag}: la pastilla lleva a su casilla`);

    await page.click(`#${id}`);
    await asentar(page);
    const off = await estado(page, id);
    t.ok(!off.chip && off.n < on.n, `${pag}: al desmarcarla, su pastilla se va`);
  }

  t.ok(errores.length === 0, 'sin errores de JS' + (errores.length ? ': ' + errores.join(' | ') : ''));
  await browser.close();
  process.exit(t.resumen('e2e-funciones-activas'));
})().catch((e) => { console.error('ERROR E2E:', e.message); process.exit(2); });
