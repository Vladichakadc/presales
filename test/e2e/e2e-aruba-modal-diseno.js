'use strict';
/* LO QUE YA PONE EL DISEÑO, MARCADO EN EL MODAL DE ACCESORIOS DE ARUBA (2026-11-11, mejora propuesta al
   cerrar el PR #179). Desde ese PR, un accesorio del modal que el motor también pone sale una sola vez en el
   BOM, pero desaparecía de la selección sin explicarlo. Ahora el modal lo marca con su porqué y no deja
   elegirlo; la marca se calcula al abrir el modal, así que con un escenario que ya no lo pone vuelve a
   poder elegirse. Se conduce con un enlace por fibra, cuya óptica pone el builder, y con uno de cobre. */
const { cargarPlaywright, BASE, abrirSesion, asentar, trasNavegar, contador } = require('./ayuda');

const enlace = (medio) => '/dimensionador-aruba-edgeconnect.html?users=120&perUser=2&pickModel=EC-10106&wanLinksData='
  + encodeURIComponent(JSON.stringify({ v: 2, wanLinks: [{ id: 1, tipo: 'DIA', medio, down: 1000, up: 1000, simetrico: true }] }));

async function abrirModal(page) {
  await page.click('[data-tab="bom"]');
  await asentar(page);
  await page.click('#accBtn');
  await page.waitForSelector('#accModal:not([hidden])', { timeout: 10000 });
}
const filasModal = (page) => page.evaluate(() => [...globalThis.document.querySelectorAll('#accLista .acc-fila')].map((f) => {
  const i = f.querySelector('input[data-acc]');
  const id = i && i.getAttribute('aria-describedby');
  const motivo = id ? globalThis.document.getElementById(id) : null;
  return { sku: i ? i.dataset.acc : null, diseno: f.dataset.diseno === '1', disabled: !!(i && i.disabled),
    valor: i ? i.value : null, motivo: motivo ? motivo.textContent : null };
}));

(async () => {
  const { chromium } = cargarPlaywright();
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errores = [];
  page.on('pageerror', (e) => errores.push(e.message));
  const t = contador();
  await abrirSesion(page);

  // Fibra: el builder pone la óptica del enlace. Si hay varias compatibles, se elige la primera en el builder.
  await trasNavegar(page, () => page.goto(BASE + enlace('SFP+ 10G'), { waitUntil: 'domcontentloaded' }), { selector: '[data-tab="bom"]' });
  await asentar(page);
  const sel = await page.$('select[data-sfp-medio="SFP+ 10G"]');
  if (sel) {
    const primera = await sel.evaluate((s) => [...s.options].map((o) => o.value).find((v) => v));
    if (primera) { await sel.selectOption(primera); await asentar(page); }
  }
  await abrirModal(page);
  let filas = await filasModal(page);
  const marcadas = filas.filter((f) => f.diseno);
  t.ok(marcadas.length >= 1, `con un enlace de fibra, el modal marca lo que pone el diseño (${marcadas.map((f) => f.sku).join(', ') || 'nada'})`);
  for (const f of marcadas) {
    t.ok(f.disabled, `${f.sku}: su cantidad no se puede tocar`);
    t.ok(/^Ya lo pone el diseño: la óptica SFP\+ 10G de los enlaces WAN, \d+ en la lista de materiales\.$/.test(f.motivo || ''),
      `${f.sku}: dice por qué y cuántos («${f.motivo}»)`);
    t.ok(Number(f.valor) >= 1, `${f.sku}: enseña la cantidad del diseño (${f.valor})`);
  }
  t.ok(filas.some((f) => !f.diseno && !f.disabled), 'lo que el diseño no pone se sigue pudiendo elegir');
  const foco = await page.evaluate(() => {
    const a = globalThis.document.activeElement;
    return a ? { id: a.id, disabled: !!a.disabled } : null;
  });
  t.ok(foco && !foco.disabled, 'el foco entra en una cantidad que se puede tocar, no en una deshabilitada');
  await page.keyboard.press('Escape');

  // Cobre: el diseño no pone ninguna óptica, y la misma óptica vuelve a poder elegirse (la marca no se guarda).
  await trasNavegar(page, () => page.goto(BASE + enlace('RJ45'), { waitUntil: 'domcontentloaded' }), { selector: '[data-tab="bom"]' });
  await asentar(page);
  await abrirModal(page);
  filas = await filasModal(page);
  t.ok(!filas.some((f) => f.diseno), 'con un enlace de cobre, el modal no marca nada');
  for (const f of marcadas) {
    const ahora = filas.find((x) => x.sku === f.sku);
    t.ok(ahora && !ahora.disabled, `${f.sku}: vuelve a poder elegirse`);
  }

  t.ok(errores.length === 0, 'sin errores de JS' + (errores.length ? ': ' + errores.join(' | ') : ''));
  await browser.close();
  process.exit(t.resumen('e2e-aruba-modal-diseno'));
})().catch((e) => { console.error('ERROR E2E:', e.message); process.exit(2); });
