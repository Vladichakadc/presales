'use strict';
/* La hoja «Supuestos» del Excel dice con que catalogo y con que motor se calculo la propuesta
   (auditoria 2026-11-09, fase 1). Se descarga el Excel de Cisco (catalogo por contenido) y el de
   Fortinet (ademas, la version de su motor) y se lee la hoja. */
const fs = require('fs');
const XLSX = require('xlsx');
const { cargarPlaywright, BASE, abrirSesion, asentar, trasNavegar, contador } = require('./ayuda');

const PAGINAS = [
  { nombre: 'Cisco', url: `${BASE}/dimensionador-cisco-catalyst8k.html?bw=50&plataforma=isr`, selector: '#verdict-sel', fab: 'cisco' },
];

async function filas(page, t, p) {
  await trasNavegar(page, () => page.goto(p.url, { waitUntil: 'domcontentloaded' }), { selector: p.selector });
  await asentar(page);
  await page.click('[data-tab=bom]');
  await asentar(page);
  const [descarga] = await Promise.all([page.waitForEvent('download', { timeout: 30000 }), page.click('#xlsBtn')]);
  const libro = XLSX.read(fs.readFileSync(await descarga.path()), { type: 'buffer' });
  t.ok(libro.SheetNames[1] === 'Supuestos', `${p.nombre}: «Supuestos» es la segunda hoja`);
  return XLSX.utils.sheet_to_json(libro.Sheets.Supuestos, { header: 1 }).map((r) => r.join(' | ')).join('\n');
}

(async () => {
  const { chromium } = cargarPlaywright();
  const browser = await chromium.launch();
  const page = await browser.newPage({ acceptDownloads: true });
  const errores = [];
  page.on('pageerror', (e) => errores.push(e.message));
  const t = contador();
  await abrirSesion(page);
  for (const p of PAGINAS) {
    const hoja = await filas(page, t, p);
    const v = hoja.match(new RegExp(`Versión del catálogo \\| (${p.fab}@[0-9a-f]{16})`));
    t.ok(!!v, `${p.nombre}: la hoja trae «Versión del catálogo» con la forma ${p.fab}@<16 hex>`);
    t.ok(/Versión del motor \| /.test(hoja), `${p.nombre}: y la fila «Versión del motor»`);
    const api = await page.evaluate(async (f) => (await (await fetch(`/api/dimensionador/${f}`)).json()).datasetVersion, p.fab);
    t.ok(v && v[1] === api, `${p.nombre}: la version del Excel es la que sirve la API (${api})`);
  }
  t.ok(errores.length === 0, 'sin errores de JS' + (errores.length ? ': ' + errores.join(' | ') : ''));
  await browser.close();
  process.exit(t.resumen('e2e-trazabilidad-catalogo'));
})().catch((e) => { console.error('ERROR E2E:', e.message); process.exit(2); });
