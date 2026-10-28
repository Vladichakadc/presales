'use strict';
/* El fin de venta también en el Excel (2026-10-28, mejora propuesta al cerrar el PR #40). En
   pantalla el Catalyst 8300-1N1S-6T sale en rojo (último pedido el 2027-01-31, sucesor C8375-E-G2);
   el Excel que llega al cliente tiene que decirlo: un aviso en rojo en la hoja BOM y la sección
   «Ciclo de vida del equipo» en «Supuestos», con la fecha, el sucesor y el boletín. Un equipo sin
   dato de ciclo (C8130-G2) no lleva ni lo uno ni lo otro. Y el consolidado multi-sede, que no lleva
   «Supuestos», avisa del perfil con fin de venta en pantalla y en la hoja BOM de su Excel. */
const fs = require('fs');
const XLSX = require('xlsx');
const { cargarPlaywright, BASE, abrirSesion, asentar, trasNavegar, contador } = require('./ayuda');

const PAGINA = `${BASE}/dimensionador-cisco-catalyst8k.html?bw=100`;

async function excelDe(page, t, modelo) {
  await page.selectOption('#pickModel', modelo);
  await asentar(page);
  let descarga = null;
  try {
    [descarga] = await Promise.all([page.waitForEvent('download', { timeout: 30000 }), page.click('#xlsBtn')]);
  } catch (e) {
    t.ok(false, `el Excel de ${modelo} se descarga (${e.message.slice(0, 120)})`);
    return null;
  }
  const libro = XLSX.read(fs.readFileSync(await descarga.path()), { type: 'buffer' });
  const plano = (h) => (libro.SheetNames.includes(h)
    ? XLSX.utils.sheet_to_json(libro.Sheets[h], { header: 1 }).map((r) => r.join(' | ')).join('\n') : '');
  return { bom: plano('BOM'), sup: plano('Supuestos'), hojas: libro.SheetNames };
}

let paso = 'arranque';
(async () => {
  const { chromium } = cargarPlaywright();
  const browser = await chromium.launch();
  const page = await browser.newPage({ acceptDownloads: true });
  const errores = [];
  page.on('pageerror', (e) => errores.push(e.message));
  const t = contador();

  await abrirSesion(page);
  await trasNavegar(page, () => page.goto(PAGINA, { waitUntil: 'domcontentloaded' }), { selector: '#verdict-sel' });
  await page.waitForFunction(() => globalThis.document.querySelectorAll('#pickModel option').length > 1, null, { timeout: 20000 });
  await page.click('[data-tab=bom]');
  await asentar(page);

  paso = 'fin de venta anunciado';
  const con = await excelDe(page, t, 'Catalyst 8300-1N1S-6T');
  if (con) {
    t.ok(con.hojas[0] === 'BOM' && con.hojas[1] === 'Supuestos', `BOM primero y «Supuestos» segunda (${con.hojas.join(', ')})`);
    t.ok(/Atención: el equipo tiene fin de venta anunciado \(último pedido el 2027-01-31\)\. Detalle, sucesor y boletín en la hoja «Supuestos»\./.test(con.bom),
      'la hoja BOM avisa del fin de venta con su fecha');
    t.ok(/CICLO DE VIDA DEL EQUIPO/.test(con.sup) && /Estado \| Fin de venta anunciado/.test(con.sup), '«Supuestos» trae la sección del ciclo de vida');
    t.ok(/Sucesor según el boletín \| Cisco Secure Router C8375-E-G2/.test(con.sup) && /Boletín oficial \| https:\/\/www\.cisco\.com\//.test(con.sup),
      'con el sucesor del boletín y su enlace');
  }

  paso = 'equipo sin dato de ciclo';
  const sin = await excelDe(page, t, 'Cisco Secure Router C8130-G2');
  if (sin) {
    t.ok(!/Atención: el equipo/.test(sin.bom) && !/CICLO DE VIDA/.test(sin.sup), 'un equipo sin dato de ciclo no lleva aviso ni sección');
  }

  // El consolidado multi-sede (2026-10-28, mejora propuesta al cerrar el PR #41): no lleva hoja
  // «Supuestos», así que el aviso va en la pantalla del consolidado y en la hoja BOM de su Excel.
  paso = 'consolidado multi-sede';
  await page.selectOption('#pickModel', 'Catalyst 8300-1N1S-6T');
  await asentar(page);
  await page.fill('#nombrePerfil', 'Sucursal e2e');
  await page.fill('#perfilSedes', '50');
  await page.click('#btnGuardarPerfil');
  await asentar(page);
  await page.click('#btnConsolidar');
  await asentar(page);
  const modal = ((await page.textContent('#consolidadoTabla')) || '').replace(/\s+/g, ' ');
  t.ok(/Ciclo de vida del despliegue/.test(modal) && /Perfil «Sucursal e2e» \(50 sede\(s\), Catalyst 8300-1N1S-6T\): el equipo tiene fin de venta anunciado \(último pedido el 2027-01-31\)/.test(modal),
    `el consolidado en pantalla avisa del perfil con fin de venta (${modal.slice(0, 160)})`);
  try {
    const [d] = await Promise.all([page.waitForEvent('download', { timeout: 30000 }), page.click('#xlsConsolidadoBtn')]);
    const libro = XLSX.read(fs.readFileSync(await d.path()), { type: 'buffer' });
    const bom = XLSX.utils.sheet_to_json(libro.Sheets[libro.SheetNames[0]], { header: 1 }).map((r) => r.join(' | ')).join('\n');
    t.ok(/CICLO DE VIDA DE LOS EQUIPOS DEL DESPLIEGUE/.test(bom) && /Atención — Perfil «Sucursal e2e» \(50 sede\(s\), Catalyst 8300-1N1S-6T\)/.test(bom)
      && /sucesor según el boletín: Cisco Secure Router C8375-E-G2/.test(bom), 'y su Excel, en la hoja BOM, con el sucesor');
    t.ok(!libro.SheetNames.includes('Supuestos'), 'el consolidado sigue sin hoja «Supuestos»');
  } catch (e) {
    t.ok(false, `el Excel del consolidado se descarga (${e.message.slice(0, 120)})`);
  }

  t.ok(errores.length === 0, 'sin errores de JS' + (errores.length ? ': ' + errores.join(' | ') : ''));
  await browser.close();
  process.exit(t.resumen('e2e-ciclo-excel'));
})().catch((e) => { console.error(`ERROR E2E (e2e-ciclo-excel, ${paso}):`, e.message); process.exit(2); });
