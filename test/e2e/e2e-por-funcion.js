'use strict';
/* global document, Event */
/* «Por <función>» en la fila del BOM (mejora del cierre del PR #61, aprobada el 2026-10-29,
   complementaria del PR #66), en las páginas reales:
   - Fortinet: con FortiConverter pedido (fuera de Enterprise, que ya lo trae), su línea dice «por
     FortiConverter…», lleva `data-por="chkConverter"` y su botón vuelve a la casilla en la pestaña
     «Dimensionar»; al desmarcarla, la línea se va. El equipo y el bundle no llevan marca.
   - Cisco: con la seguridad en la nube (SSE), «Acceso privado a aplicaciones» trae su línea de Secure
     Private Access, marcada con `saPrivado`; la de Secure Internet Access, que va siempre, no.
   - MikroTik: «Capacitación» trae su línea, marcada con `chkTraining`, y se va al desmarcarla; en el
     Excel, la hoja «Supuestos» la lista en «Líneas por función» y la hoja «BOM» no lleva la marca
     (2026-10-31, fase 2.1 del plan). */
const fs = require('fs');
const XLSX = require('xlsx');
const { cargarPlaywright, BASE, abrirSesion, asentar, trasNavegar, contador } = require('./ayuda');

const filasPor = (page) => page.$$eval('#bomTabla tbody tr', (trs) => trs.map((tr) => ({
  txt: tr.textContent.replace(/\s+/g, ' ').trim(),
  por: tr.getAttribute('data-por') || '',
  chip: (tr.querySelector('.fa-por') || { textContent: '' }).textContent.replace(/\s+/g, ' ').trim(),
})));
const valor = (page, sel, v) => page.$eval(sel, (el, x) => {
  el.value = x;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
}, v);

(async () => {
  const { chromium } = cargarPlaywright();
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 }, acceptDownloads: true });
  page.on('dialog', (d) => d.accept());
  const errores = [];
  page.on('pageerror', (e) => errores.push(e.message));
  const t = contador();
  await abrirSesion(page);

  // ── Fortinet ──────────────────────────────────────────────────────────────────────────
  await trasNavegar(page, () => page.goto(`${BASE}/dimensionador-fortinet-fortigate.html`, { waitUntil: 'domcontentloaded' }),
    { selector: '#wanBuilderFilas [data-campo=down]' });
  await asentar(page);
  await page.fill('#wanBuilderFilas [data-campo=down] >> nth=0', '300');
  await page.dispatchEvent('#wanBuilderFilas [data-campo=down] >> nth=0', 'input');
  await asentar(page);
  await page.selectOption('#licBundle', 'utp');
  await page.check('#chkConverter');
  await asentar(page);
  await page.click('[data-tab=bom]');
  await asentar(page);
  let f = await filasPor(page);
  const conv = f.find((x) => /FortiConverter — migración/.test(x.txt));
  t.ok(conv && conv.por === 'chkConverter' && /^por FortiConverter/.test(conv.chip),
    `Fortinet: la línea de FortiConverter dice de qué función sale (${conv ? `${conv.por} · «${conv.chip}»` : 'sin la línea'})`);
  const marcadas = f.filter((x) => x.por);
  t.ok(marcadas.length === 1 && marcadas[0] === conv,
    `Fortinet: solo la línea que trae la función lleva marca; el equipo, el bundle y el soporte no (${marcadas.length})`);

  await page.click('#bomTabla tr[data-por~="chkConverter"] .fa-por-b');
  await asentar(page);
  const destino = await page.evaluate(() => ({
    calc: !document.getElementById('pane-calc').hidden,
    foco: document.activeElement && document.activeElement.id,
  }));
  t.ok(destino.calc && destino.foco === 'chkConverter', `Fortinet: el botón lleva a la casilla, en su pestaña (${JSON.stringify(destino)})`);

  await page.uncheck('#chkConverter');
  await asentar(page);
  await page.click('[data-tab=bom]');
  await asentar(page);
  f = await filasPor(page);
  t.ok(!f.some((x) => /FortiConverter — migración/.test(x.txt)) && !f.some((x) => x.por.includes('chkConverter')),
    'Fortinet: sin la función, ni la línea ni la marca');

  // ── Cisco ─────────────────────────────────────────────────────────────────────────────
  await trasNavegar(page, () => page.goto(`${BASE}/dimensionador-cisco-catalyst8k.html`, { waitUntil: 'domcontentloaded' }),
    { selector: '#seguridad' });
  await asentar(page);
  // Sin caudal la página dice «sin candidato» y no hay BOM: primero un caudal con equipo.
  await valor(page, '#bw', '200');
  await asentar(page);
  await page.waitForSelector('#verdict-sel', { timeout: 20000 });
  await valor(page, '#diaPct', '50');
  await valor(page, '#seguridad', 'sse');
  await asentar(page);
  await page.click('[data-tab=bom]');
  await asentar(page);
  await page.check('#saPrivado');
  await asentar(page);
  f = await filasPor(page);
  const spa = f.find((x) => /Secure Private Access/.test(x.txt));
  const sia = f.find((x) => /Secure Internet Access/.test(x.txt));
  t.ok(spa && spa.por === 'saPrivado' && /^por Acceso privado a aplicaciones/.test(spa.chip),
    `Cisco: la línea de Secure Private Access dice de qué función sale (${spa ? `${spa.por} · «${spa.chip}»` : 'sin la línea'})`);
  t.ok(sia && !sia.por, 'Cisco: la de Secure Internet Access, que va siempre con SSE, no lleva marca');

  // ── MikroTik ─────────────────────────────────────────────────────────────────────────
  // La capacitación es una línea que solo existe con su casilla: la marca va y viene con ella.
  await trasNavegar(page, () => page.goto(`${BASE}/dimensionador-mikrotik-routeros.html`, { waitUntil: 'domcontentloaded' }),
    { selector: '#bw' });
  await asentar(page);
  await valor(page, '#bw', '200');
  await asentar(page);
  await page.click('[data-tab=bom]');
  await asentar(page);
  await page.check('#chkTraining');
  await asentar(page);
  f = await filasPor(page);
  const cap = f.filter((x) => x.por === 'chkTraining');
  t.ok(cap.length === 1 && /^por /.test(cap[0].chip), `MikroTik: la capacitación dice de qué casilla sale (${cap.length ? `«${cap[0].chip}»` : 'sin la marca'})`);
  // El Excel: la marca viaja a «Supuestos», no a la hoja que lee el cliente.
  let libro = null;
  try {
    const [descarga] = await Promise.all([page.waitForEvent('download', { timeout: 30000 }), page.click('#xlsBtn')]);
    libro = XLSX.read(fs.readFileSync(await descarga.path()), { type: 'buffer' });
  } catch (e) {
    t.ok(false, `MikroTik: el Excel se descarga (${e.message})`);
  }
  if (libro) {
    const hoja = (n) => (libro.Sheets[n] ? XLSX.utils.sheet_to_json(libro.Sheets[n], { header: 1 }).map((r) => r.join(' | ')) : []);
    const sup = hoja('Supuestos');
    const casilla = cap.length ? cap[0].chip.replace(/^por\s+/, '') : null;
    t.ok(sup.includes('LÍNEAS POR FUNCIÓN | Referencia | Cantidad | Función que la trae'),
      'MikroTik: «Supuestos» trae la sección «Líneas por función»');
    t.ok(!!casilla && sup.some((l) => l.endsWith(` | ${casilla}`)),
      `MikroTik: la línea de la capacitación, con el nombre de su casilla («${casilla}»)`);
    // «por <casilla>» es la etiqueta de la pantalla; «por» a secas sale en textos normales del BOM.
    t.ok(!hoja('BOM').some((l) => l.includes('Función que la trae') || (casilla && l.includes(`por ${casilla}`))),
      'MikroTik: la hoja «BOM» que lee el cliente no lleva la marca');
  }

  await page.uncheck('#chkTraining');
  await asentar(page);
  f = await filasPor(page);
  t.ok(!f.some((x) => x.por === 'chkTraining'), 'MikroTik: sin la casilla, ni la línea ni la marca');

  t.ok(errores.length === 0, 'sin errores de JS' + (errores.length ? ': ' + errores.join(' | ') : ''));
  await browser.close();
  process.exit(t.resumen('e2e-por-funcion'));
})().catch((e) => { console.error('ERROR E2E:', e.message); process.exit(2); });
