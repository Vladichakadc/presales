'use strict';
/* Perfiles multi-sede en Juniper y Nokia 7750 (2026-10-28, mejora propuesta al cerrar el PR #50).
   Antes solo cinco dimensionadores guardaban perfiles: un despliegue con un core SRX o un PE 7750 no
   entraba en el BOM consolidado. Se conduce lo que hace el dueño:
     - en Juniper, un perfil con el SRX1500 elegido a mano (último pedido vencido el 2026-04-15) y otro
       en la plataforma SSR; «Cargar» devuelve la plataforma y el caudal del primero;
     - en Nokia 7750, un perfil que solo ve sus propios perfiles en su lista;
     - el consolidado desde Nokia suma los dos fabricantes, avisa del SRX1500 fuera de venta con el
       catálogo de Juniper pedido al servidor, y se exporta a Excel con las líneas de los dos. */
const fs = require('fs');
const XLSX = require('xlsx');
const { cargarPlaywright, BASE, abrirSesion, asentar, trasNavegar, contador } = require('./ayuda');

const JUNIPER = `${BASE}/dimensionador-juniper-srx.html?bw=500`;
const NOKIA = `${BASE}/dimensionador-nokia-7750sr.html?bw=100`;

async function guardar(page, nombre, sedes) {
  await page.fill('#nombrePerfil', nombre);
  await page.fill('#perfilSedes', String(sedes));
  await page.click('#btnGuardarPerfil');
  await asentar(page);
  return page.textContent('#perfilMsg');
}
const filasLista = (page) => page.$$eval('#listaPerfiles tbody tr', (trs) => trs.map((tr) => tr.cells[0].textContent.trim()));

let paso = 'arranque';
(async () => {
  const { chromium } = cargarPlaywright();
  const browser = await chromium.launch();
  const page = await browser.newPage({ acceptDownloads: true });
  const errores = [];
  page.on('pageerror', (e) => errores.push(e.message));
  const t = contador();
  await abrirSesion(page);

  paso = 'Juniper: perfil SRX con el SRX1500 elegido a mano';
  await trasNavegar(page, () => page.goto(JUNIPER, { waitUntil: 'domcontentloaded' }), { selector: '#verdict-sel' });
  await page.waitForFunction(() => globalThis.document.querySelectorAll('#pickModel option').length > 1, null, { timeout: 20000 });
  await page.evaluate(() => { try { globalThis.localStorage.clear(); } catch { /* sin almacenamiento */ } });
  await page.click('[data-tab=bom]');
  await asentar(page);
  t.ok(await page.isVisible('#btnGuardarPerfil'), 'Juniper: el panel de perfiles está en la pestaña del BOM');
  t.ok(await page.isDisabled('#btnConsolidar'), 'sin perfiles, «Consolidar» está desactivado');
  await page.selectOption('#pickModel', 'SRX1500');
  await asentar(page);
  const msg1 = await guardar(page, 'Core', 2);
  t.ok(/Perfil «Core» guardado con 2 sede\(s\)/.test(msg1), `se guarda el perfil SRX (${msg1})`);
  t.ok((await filasLista(page)).join() === 'Core', 'la lista lo enseña');

  paso = 'Juniper: perfil en la plataforma SSR';
  await page.click('[data-tab=calc]');
  await page.click('#platSeg [data-v=ssr]');
  await page.fill('#bw', '100');
  await page.dispatchEvent('#bw', 'input');
  await asentar(page);
  await page.click('[data-tab=bom]');
  await asentar(page);
  const msg2 = await guardar(page, 'Sucursal SSR', 10);
  t.ok(/Perfil «Sucursal SSR» guardado con 10 sede\(s\)/.test(msg2), `se guarda el perfil SSR (${msg2})`);

  paso = 'Juniper: «Cargar» devuelve el escenario';
  await page.click('#listaPerfiles tbody tr:first-child [data-perfil-cargar]');
  await asentar(page);
  const repuesto = await page.evaluate(() => ({
    plat: (globalThis.document.querySelector('#platSeg [aria-pressed="true"]') || {}).dataset.v,
    bw: globalThis.document.getElementById('bw').value,
  }));
  t.ok(repuesto.plat === 'srx' && repuesto.bw === '500', `«Cargar» repone la plataforma SRX y los 500 de caudal (${repuesto.plat}, ${repuesto.bw})`);

  paso = 'Nokia 7750: perfil propio';
  await trasNavegar(page, () => page.goto(NOKIA, { waitUntil: 'domcontentloaded' }), { selector: '#verdict-sel' });
  await asentar(page);
  await page.click('[data-tab=bom]');
  await asentar(page);
  t.ok(!(await page.isDisabled('#btnConsolidar')), 'en Nokia, «Consolidar» se activa con los perfiles de Juniper');
  t.ok((await filasLista(page)).length === 0, 'la lista de Nokia no enseña los perfiles de Juniper');
  const msg3 = await guardar(page, 'PE', 1);
  t.ok(/Perfil «PE» guardado con 1 sede\(s\)/.test(msg3), `se guarda el perfil Nokia (${msg3})`);
  // Por la API del módulo, no por la clave del almacenamiento (que es un detalle de bom.js).
  const guardados = await page.evaluate(() => globalThis.BOM.perfiles().map((p) => p.vendor));
  t.ok(guardados.includes('nokia-sr'), `el perfil de Nokia lleva la clave de su ruta de catálogo (${guardados.join(', ')})`);

  paso = 'consolidado desde Nokia';
  await page.click('#btnConsolidar');
  await page.waitForSelector('#modalConsolidado:not([hidden])', { timeout: 20000 });
  await asentar(page);
  const modal = await page.textContent('#modalConsolidado');
  t.ok(/multi-fabricante \(juniper, nokia\)/.test(modal), 'el consolidado junta los dos fabricantes, por su nombre');
  t.ok(/13 sedes en total/.test(modal), 'suma las sedes de los tres perfiles (2 + 10 + 1)');
  t.ok(/SRX1500/.test(modal) && /fuera de venta/.test(modal), 'avisa del SRX1500 fuera de venta, puesto al día con el catálogo de Juniper');
  t.ok(!/sin contrastar con el catálogo de hoy/.test(modal), 'ningún perfil se queda con la foto vieja: los dos catálogos se leyeron');

  paso = 'Excel del consolidado';
  let descarga = null;
  try {
    [descarga] = await Promise.all([page.waitForEvent('download', { timeout: 30000 }), page.click('#xlsConsolidadoBtn')]);
  } catch (e) {
    t.ok(false, `el Excel del consolidado se descarga (${e.message.slice(0, 120)})`);
  }
  if (descarga) {
    const libro = XLSX.read(fs.readFileSync(await descarga.path()), { type: 'buffer' });
    const bom = XLSX.utils.sheet_to_json(libro.Sheets.BOM, { header: 1 }).map((r) => r.join(' | ')).join('\n');
    t.ok(/SRX1500/.test(bom) && /Nokia /.test(bom), 'el Excel lleva las líneas de Juniper y de Nokia');
    t.ok(/fuera de venta/.test(bom), 'y el aviso del SRX1500 en la hoja BOM');
  }

  await page.keyboard.press('Escape');
  await asentar(page);
  t.ok(await page.isHidden('#modalConsolidado'), 'Escape cierra el consolidado');

  t.ok(errores.length === 0, `sin errores de JS (${errores.join(' | ')})`);
  await browser.close();
  process.exit(t.resumen('e2e-perfiles-juniper-nokia'));
})().catch((e) => { console.error(`ERROR E2E (${paso}):`, e.message); process.exit(2); });
