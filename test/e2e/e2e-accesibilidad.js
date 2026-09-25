'use strict';
/* global document, window, axe */
/* E2E de accesibilidad (2026-09-24): lo que la entrega de Fortinet dejó «no ejecutado».

   Dos comprobaciones automáticas sobre las pantallas de la herramienta, detrás del muro:

   1. AUDITORÍA axe-core (WCAG 2.0/2.1 A y AA). Falla ante cualquier violación de impacto
      «critical» o «serious»; las «moderate» y «minor» se listan sin fallar, para no convertir
      en rojo lo que es una mejora opinable.
   2. ZOOM AL 200 % (WCAG 1.4.10, reflow): la pantalla a 640 px de ancho —1.280 px al 200 %—
      no puede obligar a desplazarse en horizontal.

   Lo que NO sustituye, y se dice: la prueba con un lector de pantalla real (NVDA, VoiceOver).
   axe comprueba la semántica que un lector necesita; si lo que anuncia se entiende, solo lo
   dice una persona escuchándolo.

   axe se inyecta con page.evaluate, que va por el protocolo de depuración y no por un
   <script>: la CSP de la aplicación (script-src 'self') bloquearía un script en línea, y
   relajarla para la prueba sería probar otra aplicación. */
const fs = require('fs');
const { cargarPlaywright, abrirSesion, BASE, asentar, contador } = require('./ayuda');

const AXE = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');

const PANTALLAS = [
  { n: 'Portal', ruta: '/' },
  { n: 'Dimensionador Fortinet', ruta: '/dimensionador-fortinet-fortigate.html' },
  { n: 'Dimensionador Aruba', ruta: '/dimensionador-aruba-edgeconnect.html' },
  { n: 'Dimensionador Cisco', ruta: '/dimensionador-cisco-catalyst8k.html' },
  { n: 'Dimensionador Huawei', ruta: '/dimensionador-huawei-netengine.html' },
  { n: 'Dimensionador MikroTik', ruta: '/dimensionador-mikrotik-routeros.html' },
  { n: 'Dimensionador Juniper', ruta: '/dimensionador-juniper-srx.html' },
  { n: 'Dimensionador Nokia 7750', ruta: '/dimensionador-nokia-7750sr.html' },
  { n: 'Dimensionador Nokia 7220', ruta: '/dimensionador-nokia-7220ixr.html' },
  { n: 'Cotizador', ruta: '/cotizador.html' },
  { n: 'Guía de diseño', ruta: '/guia-diseno-interactiva.html' },
  { n: 'Cuenta', ruta: '/cuenta' },
  // Con escenario: los resultados, la ficha, las insignias y los avisos solo existen cuando
  // hay algo que dimensionar, y una auditoría de la página vacía no los ve.
  { n: 'Fortinet con escenario', ruta: '/dimensionador-fortinet-fortigate.html?wanLinksData='
    + encodeURIComponent(JSON.stringify({ v: 2, wanLinks: [{ id: 1, tipo: 'DIA', down: 800, overlay: false }, { id: 2, tipo: 'MPLS L3', down: 200, overlay: true }] })) + '&users=150' },
  { n: 'Fortinet con escenario · lista de materiales', ruta: '/dimensionador-fortinet-fortigate.html?wanLinksData='
    + encodeURIComponent(JSON.stringify({ v: 2, wanLinks: [{ id: 1, tipo: 'DIA', down: 800, overlay: false }] })) + '&users=150', pestana: 'bom' },
  { n: 'Aruba con escenario', ruta: '/dimensionador-aruba-edgeconnect.html?users=120&perUser=2&chkBoost=1&wanLinksData='
    + encodeURIComponent(JSON.stringify({ v: 2, wanLinks: [{ id: 1, tipo: 'DIA', medio: 'RJ45', down: 500, up: 500, simetrico: true }, { id: 2, tipo: '4G/5G', medio: 'RJ45', down: 100, up: 50, simetrico: false, rol: 'respaldo' }] })) },
  { n: 'Aruba con escenario · lista de materiales', ruta: '/dimensionador-aruba-edgeconnect.html?users=120&perUser=2&wanLinksData='
    + encodeURIComponent(JSON.stringify({ v: 2, wanLinks: [{ id: 1, tipo: 'DIA', medio: 'RJ45', down: 500, up: 500, simetrico: true }] })), pestana: 'bom' },
  { n: 'Cisco con escenario', ruta: '/dimensionador-cisco-catalyst8k.html?bw=800' },
];

const GRAVES = new Set(['critical', 'serious']);

(async () => {
  const { chromium } = cargarPlaywright();
  const browser = await chromium.launch();
  const t = contador();
  const resumen = [];

  // Una página por comprobación: la auditoría a ancho de escritorio y el reflow a 640 px.
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await abrirSesion(page);
  for (const p of PANTALLAS) {
    await page.goto(BASE + p.ruta, { waitUntil: 'domcontentloaded' });
    await asentar(page);
    if (p.pestana) { await page.click(`[data-tab="${p.pestana}"]`); await asentar(page); }
    await page.evaluate(AXE);
    const r = await page.evaluate(() => axe.run(document, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
      resultTypes: ['violations'],
    }).then((res) => res.violations.map((v) => ({
      id: v.id, impact: v.impact, help: v.help, n: v.nodes.length,
      ejemplos: v.nodes.slice(0, 3).map((x) => x.target.join(' ')),
    }))));
    const graves = r.filter((v) => GRAVES.has(v.impact));
    const leves = r.filter((v) => !GRAVES.has(v.impact));
    t.ok(graves.length === 0, `axe · ${p.n}: sin violaciones graves (WCAG 2.1 A/AA)`
      + (graves.length ? ': ' + graves.map((v) => `${v.id} [${v.impact}] ×${v.n} (${v.ejemplos.join(' | ')})`).join('; ') : ''));
    if (leves.length) console.log(`   (info) ${p.n}: ${leves.map((v) => `${v.id} [${v.impact}] ×${v.n}`).join(', ')}`);
    resumen.push({ pantalla: p.n, graves: graves.length, leves: leves.length });
  }
  await page.close();

  const zoom = await browser.newPage({ viewport: { width: 640, height: 900 } });
  await abrirSesion(zoom);
  for (const p of PANTALLAS) {
    await zoom.goto(BASE + p.ruta, { waitUntil: 'domcontentloaded' });
    await asentar(zoom);
    if (p.pestana) { await zoom.click(`[data-tab="${p.pestana}"]`); await asentar(zoom); }
    const m = await zoom.evaluate(() => ({ ancho: document.documentElement.scrollWidth, vista: window.innerWidth }));
    t.ok(m.ancho <= m.vista + 1, `zoom 200 % · ${p.n}: sin desplazamiento horizontal (${m.ancho} px de contenido en ${m.vista} px)`);
  }
  await zoom.close();

  console.log('\nResumen axe:', resumen.map((r) => `${r.pantalla} ${r.graves}/${r.leves}`).join(' · '));
  console.log('No sustituye la prueba con un lector de pantalla real: eso lo hace una persona.');
  await browser.close();
  process.exit(t.resumen('e2e-accesibilidad'));
})().catch((e) => { console.error(e); process.exit(1); });
