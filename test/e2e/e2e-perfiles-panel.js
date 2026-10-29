'use strict';
/* El panel de perfiles multi-sede, el mismo en las siete páginas (2026-10-29).

   Hasta hoy cada página llevaba su copia del bloque y ya divergían: Escape y `role="dialog"` solo
   en Juniper y Nokia, el mensaje al guardar sin nombre en cinco, Aruba sin nombres accesibles. Ahora
   lo monta `BOM.montarPerfiles` (bom.js). Esta batería recorre las siete y comprueba que el panel
   está, que se lee igual y que la ventana del consolidado se abre, se cierra con Escape y con el
   fondo, y devuelve el foco al botón. */
/* global document, localStorage */

const { cargarPlaywright, abrirSesion, asentar, contador } = require('./ayuda');

const BASE = process.env.E2E_BASE || 'http://localhost:4131';
const PAGINAS = ['aruba-edgeconnect', 'cisco-catalyst8k', 'fortinet-fortigate', 'huawei-netengine',
  'juniper-srx', 'mikrotik-routeros', 'nokia-7750sr'];
// Un perfil guardado de antemano, para que «Consolidar» tenga algo que sumar en todas.
const PERFIL = { id: 'e2e-panel-1', nombre: 'Sucursal e2e', vendor: 'cisco', sedes: 3, modelo: 'Equipo de prueba',
  fecha: '2026-10-29', version: 1, ciclo: null, campos: {},
  filas: [{ cat: 'Equipo', desc: 'Equipo de prueba', sku: 'E2E-1', qty: 1, unit: 100 }] };

(async () => {
  const { chromium } = cargarPlaywright();
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 936 } });
  const t = contador();
  const errores = [];
  page.on('pageerror', (e) => errores.push(e.message));
  await abrirSesion(page);
  await page.evaluate((p) => { localStorage.setItem('presales-perfiles', JSON.stringify([p])); }, PERFIL);

  for (const p of PAGINAS) {
    await page.goto(`${BASE}/dimensionador-${p}.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#perfilesPanel #nombrePerfil', { state: 'attached', timeout: 20000 });
    await asentar(page);
    const d = await page.evaluate(() => {
      const $ = (id) => document.getElementById(id);
      const v = $('modalConsolidado');
      return {
        nombre: $('nombrePerfil').getAttribute('aria-label'), sedes: $('perfilSedes').getAttribute('aria-label'),
        vivo: $('perfilMsg') && $('perfilMsg').getAttribute('aria-live'),
        dialogo: v && v.getAttribute('role') === 'dialog' && v.getAttribute('aria-modal') === 'true'
          && v.getAttribute('aria-labelledby') === 'consolidadoTit' && !!$('consolidadoTit'),
        oculto: v && v.hidden, modales: document.querySelectorAll('#modalConsolidado').length,
        lista: $('listaPerfiles').textContent.trim(),
      };
    });
    t.ok(d.nombre && d.sedes && d.vivo === 'polite', `${p}: el panel generado tiene nombres accesibles y mensajes vivos`);
    t.ok(d.dialogo && d.oculto && d.modales === 1, `${p}: una sola ventana del consolidado, diálogo con nombre y cerrada al abrir`);
    t.ok(/Sin perfiles guardados/.test(d.lista) || p === 'cisco-catalyst8k',
      `${p}: la lista enseña solo los perfiles de su fabricante (${d.lista.slice(0, 40)})`);
    if (p === 'cisco-catalyst8k') t.ok(/Sucursal e2e/.test(d.lista), 'cisco-catalyst8k: y Cisco ve el suyo');
    // Guardar sin nombre lo dice, en las siete (Aruba no decía nada). Fortinet lo confirma antes
    // con el servidor y su puerta decide el botón: allí basta con que no se guarde nada.
    const guardar = await page.evaluate(() => {
      const b = document.getElementById('btnGuardarPerfil');
      if (b.disabled) return { deshabilitado: true };
      b.click();
      return { msg: document.getElementById('perfilMsg').textContent };
    });
    await asentar(page);
    const msg = guardar.deshabilitado ? '' : await page.$eval('#perfilMsg', (x) => x.textContent);
    t.ok(guardar.deshabilitado || /Pon un nombre y el número de sedes/.test(msg), `${p}: guardar sin nombre lo dice (${msg || 'botón cerrado por la puerta'})`);
    t.ok(await page.evaluate(() => JSON.parse(localStorage.getItem('presales-perfiles')).length === 1), `${p}: y no guarda nada`);
    // Consolidar abre la ventana; Escape la cierra y devuelve el foco. Fortinet confirma con el
    // servidor antes: con el escenario vacío su puerta no deja, y eso ya lo prueba su batería.
    if (p === 'fortinet-fortigate') continue;
    // Como lo haría una persona: primero la pestaña donde está el panel (el foco no puede volver a
    // un botón de una pestaña oculta).
    const pane = await page.$eval('#perfilesPanel', (x) => { const c = x.closest('.tabpane'); return c ? c.id.replace(/^pane-/, '') : null; });
    if (pane) { await page.click(`[role=tab][data-tab="${pane}"]`); await asentar(page); }
    await page.click('#btnConsolidar');
    await page.waitForSelector('#modalConsolidado:not([hidden])', { timeout: 15000 });
    await asentar(page);
    t.ok(/Sucursal e2e ×3/.test(await page.$eval('#consolidadoSub', (x) => x.textContent)), `${p}: el consolidado suma el perfil guardado`);
    await page.keyboard.press('Escape');
    const tras = await page.evaluate(() => ({ oculto: document.getElementById('modalConsolidado').hidden,
      foco: (document.activeElement || {}).id }));
    t.ok(tras.oculto && tras.foco === 'btnConsolidar', `${p}: Escape la cierra y el foco vuelve a «Consolidar» (${JSON.stringify(tras)})`);
    await page.click('#btnConsolidar');
    await page.waitForSelector('#modalConsolidado:not([hidden])', { timeout: 15000 });
    await page.mouse.click(5, 5);
    t.ok(await page.$eval('#modalConsolidado', (x) => x.hidden), `${p}: un clic en el fondo también la cierra`);
  }

  t.ok(errores.length === 0, `sin excepciones de página (${errores.join(' | ') || 'ninguna'})`);
  await browser.close();
  t.resumen('e2e-perfiles-panel');
})().catch((e) => { console.error(e); process.exit(1); });
