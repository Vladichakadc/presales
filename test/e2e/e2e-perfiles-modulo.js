'use strict';
/* El panel de perfiles multi-sede, un solo módulo (2026-10-28, mejora propuesta al cerrar el PR #55).
   Las siete páginas llevaban su copia del panel y habían divergido: Escape y `role="dialog"` en dos,
   el mensaje al guardar en cinco, cerrar pinchando fuera solo en Aruba. Ahora es `BOM.montarPerfiles`,
   y esta batería conduce en cuatro páginas lo que antes no hacían todas:
     - guardar sin nombre dice qué falta; guardar dice qué se guardó;
     - la ventana del consolidado es un diálogo con nombre, el foco entra en ella;
     - Escape la cierra y el foco vuelve a «Consolidar»; pinchar fuera también la cierra.
   Fortinet (su puerta de cotización) lo conducen e2e-fortinet-auditoria y e2e-fortinet-rediseno;
   Juniper y Nokia 7750, e2e-perfiles-juniper-nokia. */
const { cargarPlaywright, BASE, abrirSesion, asentar, trasNavegar, contador } = require('./ayuda');

const PAGINAS = [
  ['Huawei', `${BASE}/dimensionador-huawei-netengine.html`],
  ['MikroTik', `${BASE}/dimensionador-mikrotik-routeros.html?bw=100`],
  ['Cisco', `${BASE}/dimensionador-cisco-catalyst8k.html?bw=100`],
  ['Aruba', `${BASE}/dimensionador-aruba-edgeconnect.html?users=120&perUser=2&wanLinksData=${encodeURIComponent(JSON.stringify({
    v: 2, wanLinks: [{ id: 1, tipo: 'DIA', medio: 'RJ45', down: 500, up: 500, simetrico: true }] }))}`],
];

let paso = 'arranque';
(async () => {
  const { chromium } = cargarPlaywright();
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errores = [];
  page.on('pageerror', (e) => errores.push(e.message));
  const t = contador();
  await abrirSesion(page);

  let primera = true;
  for (const [nombre, url] of PAGINAS) {
    paso = `${nombre}: abrir`;
    await trasNavegar(page, () => page.goto(url, { waitUntil: 'domcontentloaded' }), { selector: '[data-tab=bom]' });
    await page.waitForFunction(() => globalThis.document.querySelectorAll('#pickModel option').length > 0, null, { timeout: 20000 });
    if (primera) {
      await page.evaluate(() => { try { globalThis.localStorage.clear(); } catch { /* sin almacenamiento */ } });
      primera = false;
    }
    await page.click('[data-tab=bom]');
    await asentar(page);

    paso = `${nombre}: guardar`;
    await page.fill('#nombrePerfil', '');
    await page.fill('#perfilSedes', '');
    await page.click('#btnGuardarPerfil');
    await asentar(page);
    t.ok((await page.textContent('#perfilMsg')) === 'Pon un nombre y el número de sedes idénticas.', `${nombre}: guardar sin nombre dice qué falta`);
    await page.fill('#nombrePerfil', `Sede ${nombre}`);
    await page.fill('#perfilSedes', '3');
    await page.click('#btnGuardarPerfil');
    await asentar(page);
    const msg = await page.textContent('#perfilMsg');
    t.ok(msg === `Perfil «Sede ${nombre}» guardado con 3 sede(s).`, `${nombre}: guardar dice qué guardó (${msg})`);
    const filas = await page.$$eval('#listaPerfiles tbody tr', (trs) => trs.map((tr) => tr.cells[0].textContent.trim()));
    t.ok(filas.length === 1 && filas[0] === `Sede ${nombre}`, `${nombre}: la lista enseña solo el perfil de la página (${filas.join(', ')})`);

    paso = `${nombre}: consolidar`;
    await page.click('#btnConsolidar');
    await page.waitForSelector('#modalConsolidado:not([hidden])', { timeout: 20000 });
    await asentar(page);
    const dialogo = await page.evaluate(() => {
      const m = globalThis.document.getElementById('modalConsolidado');
      const tit = globalThis.document.getElementById(m.getAttribute('aria-labelledby') || '-');
      return { role: m.getAttribute('role'), modal: m.getAttribute('aria-modal'), titulo: tit ? tit.textContent.trim() : '',
        foco: m.contains(globalThis.document.activeElement) };
    });
    t.ok(dialogo.role === 'dialog' && dialogo.modal === 'true' && dialogo.titulo.length > 0,
      `${nombre}: la ventana es un diálogo con nombre (${dialogo.role}, ${dialogo.modal}, «${dialogo.titulo}»)`);
    t.ok(dialogo.foco, `${nombre}: el foco entra en la ventana`);
    const sedes = (await page.textContent('#consolidadoSub')) || '';
    t.ok(new RegExp(`${3 * PAGINAS.findIndex((x) => x[0] === nombre) + 3} sedes en total`).test(sedes),
      `${nombre}: el consolidado suma los perfiles de todas las páginas (${sedes.trim()})`);

    paso = `${nombre}: cerrar`;
    await page.keyboard.press('Escape');
    await asentar(page);
    t.ok(await page.isHidden('#modalConsolidado'), `${nombre}: Escape cierra`);
    t.ok(await page.evaluate(() => globalThis.document.activeElement && globalThis.document.activeElement.id === 'btnConsolidar'),
      `${nombre}: el foco vuelve a «Consolidar»`);
    await page.click('#btnConsolidar');
    await page.waitForSelector('#modalConsolidado:not([hidden])', { timeout: 20000 });
    await page.click('#modalConsolidado', { position: { x: 5, y: 5 } });
    await asentar(page);
    t.ok(await page.isHidden('#modalConsolidado'), `${nombre}: pinchar fuera cierra`);
  }

  t.ok(errores.length === 0, `sin errores de JS (${errores.join(' | ')})`);
  await browser.close();
  process.exit(t.resumen('e2e-perfiles-modulo'));
})().catch((e) => { console.error(`ERROR E2E (${paso}):`, e.message); process.exit(2); });
