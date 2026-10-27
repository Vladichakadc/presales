'use strict';
/* Las figuras de Cisco, con la tabla de sus números, en el Excel del BOM (mejora aprobada el
   2026-10-27). Aruba, Fortinet y Huawei ya llevaban la hoja «Fotos del equipo»; Cisco no, y con las
   leyendas en la lupa la propuesta impresa seguía con números sin explicar. Se descarga el Excel
   del C8130-G2 (frontal de 8 números, tabla 1 de su ficha; trasera de 2) y se lee la hoja. */
const fs = require('fs');
const XLSX = require('xlsx');
const { cargarPlaywright, BASE, abrirSesion, asentar, trasNavegar, contador } = require('./ayuda');

const PAGINA = `${BASE}/dimensionador-cisco-catalyst8k.html?bw=100`;
const MODELO = 'Cisco Secure Router C8130-G2';

(async () => {
  const { chromium } = cargarPlaywright();
  const browser = await chromium.launch();
  const page = await browser.newPage({ acceptDownloads: true });
  const errores = [];
  page.on('pageerror', (e) => errores.push(e.message));
  const t = contador();

  await abrirSesion(page);
  await trasNavegar(page, () => page.goto(PAGINA, { waitUntil: 'domcontentloaded' }), { selector: '#verdict-sel' });
  await asentar(page);
  await page.selectOption('#verdict-sel', MODELO);
  await asentar(page);
  await page.click('[data-tab=bom]');
  await asentar(page);

  const [descarga] = await Promise.all([page.waitForEvent('download', { timeout: 30000 }), page.click('#xlsBtn')]);
  const buf = fs.readFileSync(await descarga.path());
  t.ok(buf.includes(Buffer.from('xl/media/image1.png')) && buf.includes(Buffer.from('xl/media/image2.png')),
    'el Excel incrusta la cara frontal y la trasera');
  const libro = XLSX.read(buf, { type: 'buffer' });
  t.ok(libro.SheetNames[0] === 'BOM' && libro.SheetNames.includes('Fotos del equipo'),
    `el BOM sigue primero y lleva la hoja «Fotos del equipo» (${libro.SheetNames.join(', ')})`);
  const plano = libro.SheetNames.includes('Fotos del equipo')
    ? XLSX.utils.sheet_to_json(libro.Sheets['Fotos del equipo'], { header: 1 }).map((r) => r.join(' | ')).join('\n') : '';
  t.ok(plano.includes(`Modelo: ${MODELO}`) && /documentos oficiales de Cisco/.test(plano) && /8100 Series Secure Routers Data Sheet/.test(plano),
    'la hoja declara el modelo y la procedencia de las figuras');
  t.ok(/Qué es cada número de la vista frontal \(tabla 1 de la ficha\)/.test(plano),
    'bajo la frontal, el título de su tabla de números con la tabla de origen');
  t.ok(/4\. 4 puertos GE RJ-45 — «4 x GE RJ-45 ports»/.test(plano) && /8\. Ranura de bloqueo Kensington/.test(plano),
    'cada número con su traducción y el rótulo literal del documento');
  t.ok(/Qué es cada número de la vista trasera/.test(plano) && /1\. Estado del sistema/.test(plano),
    'y lo mismo bajo la trasera');

  t.ok(errores.length === 0, 'sin errores de JS' + (errores.length ? ': ' + errores.join(' | ') : ''));
  await browser.close();
  process.exit(t.resumen('e2e-cisco-excel-figuras'));
})().catch((e) => { console.error('ERROR E2E:', e.message); process.exit(2); });
