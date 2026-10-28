'use strict';
/* La criptografía post-cuántica exigida, con su versión mínima, en la hoja «Supuestos» del Excel
   (mejora propuesta en la sexagesimosexta entrega, 2026-10-27). Con «Exigir PQC» el equipo la cumple
   DESDE una versión de software: el ISR 1000 trae la PPK desde IOS XE 17.12.1a, y un cliente con el
   equipo en 17.9 no la tiene. Se descarga el Excel del dimensionador Cisco con el requisito puesto y
   se lee la hoja; sin el requisito, la sección no sale. */
const fs = require('fs');
const XLSX = require('xlsx');
const { cargarPlaywright, BASE, abrirSesion, asentar, trasNavegar, contador } = require('./ayuda');

const PAGINA = `${BASE}/dimensionador-cisco-catalyst8k.html?bw=50&plataforma=isr`;

async function supuestos(page, t, url, nombre) {
  await trasNavegar(page, () => page.goto(url, { waitUntil: 'domcontentloaded' }), { selector: '#verdict-sel' });
  await asentar(page);
  await page.click('[data-tab=bom]');
  await asentar(page);
  let descarga = null;
  try {
    [descarga] = await Promise.all([page.waitForEvent('download', { timeout: 30000 }), page.click('#xlsBtn')]);
  } catch (e) {
    t.ok(false, `el Excel se descarga (${nombre})`);
    return '';
  }
  const libro = XLSX.read(fs.readFileSync(await descarga.path()), { type: 'buffer' });
  t.ok(libro.SheetNames[0] === 'BOM' && libro.SheetNames[1] === 'Supuestos',
    `${nombre}: el BOM sigue primero y «Supuestos» segunda (${libro.SheetNames.join(', ')})`);
  return libro.Sheets.Supuestos
    ? XLSX.utils.sheet_to_json(libro.Sheets.Supuestos, { header: 1 }).map((r) => r.join(' | ')).join('\n') : '';
}

(async () => {
  const { chromium } = cargarPlaywright();
  const browser = await chromium.launch();
  const page = await browser.newPage({ acceptDownloads: true });
  const errores = [];
  page.on('pageerror', (e) => errores.push(e.message));
  const t = contador();
  await abrirSesion(page);

  const con = await supuestos(page, t, `${PAGINA}&reqPqc=clave`, 'con PQC exigida');
  t.ok(/CRIPTOGRAFÍA POST-CUÁNTICA EXIGIDA/.test(con), 'con «Exigir PQC», la hoja trae su sección');
  t.ok(/Requisito del escenario \| Mecanismo quantum-safe documentado/.test(con), 'dice qué nivel exige el escenario');
  t.ok(/¿El equipo del BOM lo cumple\? \| Sí/.test(con), 'y que el ISR recomendado lo cumple');
  t.ok(/Mecanismo documentado \| PPK \(RFC 8784\)/.test(con), 'el mecanismo es la PPK, dicho como lo que es');
  t.ok(/Versión mínima de software \| IOS XE 17\.12\.1a o superior/.test(con), 'con la versión mínima de software del ISR 1000');
  t.ok(/Fuente \| «Configuring Quantum-Safe Encryption Using Postquantum Preshared Keys»/.test(con), 'y su fuente');
  t.ok(/Documento oficial \| https:\/\/www\.cisco\.com\/c\/en\/us\/td\/docs\/routers\/ios\/config\/17-x\/sec-vpn\/b-security-vpn\/m-sec-cfg-quantum-encryption-ppk\.html/.test(con),
    'y el enlace al documento, el de su entrada en fuentes.js');

  const sin = await supuestos(page, t, PAGINA, 'sin PQC exigida');
  t.ok(sin.length > 0 && !/POST-CUÁNTICA EXIGIDA/.test(sin), 'sin el requisito, la sección no sale');

  t.ok(errores.length === 0, 'sin errores de JS' + (errores.length ? ': ' + errores.join(' | ') : ''));
  await browser.close();
  process.exit(t.resumen('e2e-pqc-supuestos'));
})().catch((e) => { console.error('ERROR E2E:', e.message); process.exit(2); });
