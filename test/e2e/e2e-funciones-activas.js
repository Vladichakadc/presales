'use strict';
/* Petición del dueño del 2026-10-28, en las páginas reales: «cuando se seleccione una opción de
   cualquier dimensionador, como ya se está resaltando en la parte de la izquierda, también se
   resalte en la parte de la derecha de todos los dimensionadores».

   En los ocho dimensionadores con casillas de función: arriba de la columna de resultados está el
   panel «Funciones activadas»; al marcar una casilla de la izquierda aparece su pastilla, con el
   mismo acento que la fila marcada; al desmarcarla, desaparece; un clic en la pastilla devuelve el
   foco a su casilla.

   Y lo que trajo la función (2026-10-29: «cuando se active una función también debes resaltar la
   descripción en el panel derecho para que los usuarios puedan observar en donde apareció»): tras
   el recálculo, el panel dice cuántos puntos del resultado cambiaron, cada uno va resaltado dentro
   de la columna de resultados con «Apareció al activar «X»», «Ver» lleva a uno, y al desmarcar no
   queda ninguno. Al menos en una página la función tiene que cambiar algo visible. */
const { cargarPlaywright, BASE, abrirSesion, asentar, trasNavegar, contador } = require('./ayuda');

const PAGINAS = ['aruba-edgeconnect', 'cisco-catalyst8k', 'fortinet-fortigate', 'huawei-netengine',
  'juniper-srx', 'mikrotik-routeros', 'nokia-7220ixr', 'nokia-7750sr'];

// La primera casilla de función visible, habilitada y sin marcar de la columna de parámetros de la
// primera rejilla que lleva panel.
const elegir = (page) => page.evaluate(() => {
  const panel = globalThis.document.querySelector('.funciones-activas');
  if (!panel) return null;
  // La rejilla: la columna de resultados lleva el panel dentro, salvo la tarjeta clavada
  // (`.col-fijo`), junto a la cual es otra pieza de la propia rejilla.
  const esRejilla = (n) => n.classList.contains('cols') || n.classList.contains('dim');
  const rejilla = esRejilla(panel.parentElement) ? panel.parentElement : panel.parentElement.parentElement;
  const izq = rejilla.firstElementChild;
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
  let conCambios = 0;

  for (const pag of PAGINAS) {
    await trasNavegar(page, () => page.goto(`${BASE}/dimensionador-${pag}.html`, { waitUntil: 'domcontentloaded' }), { selector: '.funciones-activas' });
    await asentar(page);
    const sitio = await page.evaluate(() => {
      const p = globalThis.document.querySelector('.funciones-activas');
      if (p.nextElementSibling && p.nextElementSibling.classList.contains('col-fijo')) {
        // Junto a la tarjeta clavada: en la columna derecha, encima de ella, y la tarjeta igual de alta.
        const a = p.getBoundingClientRect(), b = p.nextElementSibling.getBoundingClientRect();
        const izq = p.parentElement.firstElementChild.getBoundingClientRect();
        return { ok: Math.abs(a.left - b.left) <= 1 && a.bottom <= b.top && a.left > izq.right, donde: 'junto a la tarjeta clavada' };
      }
      const rejilla = p.parentElement.parentElement;
      return { ok: rejilla.children[1] === p.parentElement && (rejilla.classList.contains('cols') || rejilla.classList.contains('dim')), donde: 'dentro de la columna de resultados' };
    });
    t.ok(sitio.ok, `${pag}: el panel está arriba de la columna de resultados (${sitio.donde})`);

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

    // Lo que trajo: el módulo espera a que la derecha se calme y lo dice en el panel.
    const llego = await page.waitForSelector('.funciones-activas .fa-cambio', { timeout: 8000 }).then(() => true, () => false);
    t.ok(llego, `${pag}: al activar #${id} el panel dice qué cambió en el resultado`);
    if (llego) {
      const c = await page.evaluate(() => {
        const d = globalThis.document;
        const panel = d.querySelector('.funciones-activas');
        const msg = panel.querySelector('.fa-cambio').textContent.replace(/\s+/g, ' ');
        const m = /cambi(?:ó 1 punto|aron (\d+) puntos)/.exec(msg);
        const marcas = [...d.querySelectorAll('.fa-nuevo')];
        const rejilla = panel.closest('.cols, .dim') || panel.parentElement.closest('.cols, .dim');
        const izq = rejilla.firstElementChild;
        return { msg, n: m ? (m[1] ? Number(m[1]) : 1) : 0, marcas: marcas.length,
          fuera: marcas.filter((e) => izq.contains(e) || panel.contains(e)).length,
          sinTitulo: marcas.filter((e) => !/^Apareció al activar «.+»$/.test(e.title)).length,
          visible: marcas.some((e) => e.getClientRects().length) };
      });
      t.ok(c.n === c.marcas, `${pag}: el número del panel es el de lo resaltado (${c.n} = ${c.marcas}: «${c.msg.slice(0, 80)}»)`);
      t.ok(c.fuera === 0 && c.sinTitulo === 0, `${pag}: lo resaltado está en el resultado y dice de qué función salió`);
      if (c.marcas) conCambios += 1;
      if (c.visible) {
        await page.click('.funciones-activas .fa-ver');
        await asentar(page);
        t.ok(await page.evaluate(() => !!(globalThis.document.activeElement && globalThis.document.activeElement.classList.contains('fa-nuevo'))),
          `${pag}: «Ver» lleva a lo resaltado`);
      }
    }

    await page.click(`.funciones-activas .fa-pastilla[data-para="${id}"]`);
    await asentar(page);
    t.ok(await page.evaluate((x) => globalThis.document.activeElement && globalThis.document.activeElement.id === x, id), `${pag}: la pastilla lleva a su casilla`);

    await page.click(`#${id}`);
    await asentar(page);
    const off = await estado(page, id);
    t.ok(!off.chip && off.n < on.n, `${pag}: al desmarcarla, su pastilla se va`);
    t.ok(await page.evaluate(() => !globalThis.document.querySelector('.fa-nuevo, .funciones-activas .fa-cambio')),
      `${pag}: al desmarcarla no queda nada resaltado como si lo hubiera traído`);
  }
  t.ok(conCambios > 0, `al menos en una página la función activada cambia algo visible del resultado (${conCambios} de ${PAGINAS.length})`);

  t.ok(errores.length === 0, 'sin errores de JS' + (errores.length ? ': ' + errores.join(' | ') : ''));
  await browser.close();
  process.exit(t.resumen('e2e-funciones-activas'));
})().catch((e) => { console.error('ERROR E2E:', e.message); process.exit(2); });
