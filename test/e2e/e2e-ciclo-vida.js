'use strict';
/* E2E del resaltado de ciclo de vida (2026-09-16, petición directa del dueño: «valida en
   las fuentes oficiales si el EC-XS sigue vigente o entró en EOL y resalta si hay equipos
   con esta condición para que los usuarios lo sepan»).
   Veredicto documentado en server/seed/legacyData/aruba.js: el EC-XS está VIGENTE según
   las fuentes oficiales (QuickSpecs a50004289enw V18 del 06-jul-2026 lo listan ordenable;
   garantía oficial a00143138enw: «Active») — la señal de los agregadores no existe en
   ningún canal oficial, así que NO lleva marca de fin de venta.
   La pantalla usa la regla única del pendiente 34 (FICHA.cicloHtml): el que SÍ cumplió su
   fin de venta (EC-XL, último pedido 2026-03-31, ya vencido) sale ROJO con su fecha y el
   fin de soporte del boletín; el EC-XS, sin boletín y sin respaldo declarado a nivel de
   fabricante, sale en el TERCER ESTADO («Sin dato de ciclo de vida») — nunca verde por
   omisión y, sobre todo, NUNCA con una marca de fin de venta sacada de un agregador. */
const { cargarPlaywright, abrirDimensionador, asentar, trasNavegar, BASE, contador } = require('./ayuda');

(async () => {
  const { chromium } = cargarPlaywright();
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on('dialog', (d) => d.accept());
  const t = contador();

  await abrirDimensionador(page);

  // Pestaña Catálogo: el semáforo por modelo.
  await page.click('[data-tab=cat]');
  await asentar(page);
  const filaDe = async (id) => {
    const filas = await page.$$('#tbl-aruba-cat tbody tr');
    for (const f of filas) {
      const cod = await f.$eval('td code', (c) => c.textContent.trim()).catch(() => '');
      if (cod === id) return (await f.textContent()) || '';
    }
    return null;
  };

  const xl = await filaDe('EC-XL');
  t.ok(!!xl, 'el EC-XL aparece en el catálogo (fuera de venta se muestra, no se esconde)');
  t.ok(xl && xl.includes('Fuera de venta'),
    'EC-XL: con la fecha de último pedido ya pasada, el semáforo es ROJO «Fuera de venta»');
  t.ok(xl && xl.includes('2026-03-31'),
    'EC-XL: el semáforo lleva su fecha de último pedido (2026-03-31)');
  t.ok(xl && xl.includes('soporte del fabricante hasta el 2033-03-31'),
    'EC-XL: el semáforo suma el fin de soporte del boletín (2033-03-31) — el dato del parque instalado');

  const xs = await filaDe('EC-XS');
  t.ok(!!xs, 'el EC-XS aparece en el catálogo');
  t.ok(xs && !/fin de venta|fuera de venta/i.test(xs),
    'EC-XS: NINGUNA marca de fin de venta — verificado vigente en fuentes oficiales el 2026-09-16');
  t.ok(xs && xs.includes('Sin dato de ciclo de vida'),
    'EC-XS: tercer estado honesto (sin boletín respaldado a nivel fabricante) — nunca verde por omisión');

  // C5 de la auditoría 2026-09-17: el 7005 tiene boletín oficial de fin de venta
  // (31-oct-2022, soporte hasta 31-oct-2027) — rojo con sus fechas. El 7010 no tiene boletín
  // con fecha, pero desde el 2026-10-06 la página oficial de psnow de su serie lo da por
  // retirado: rojo, y diciendo que la fecha no está (antes era el ejemplo de línea anterior).
  const l7005 = await filaDe('7005');
  t.ok(l7005 && l7005.includes('Fuera de venta') && l7005.includes('2022-10-31'),
    '7005: fuera de venta con la fecha de su boletín oficial (2022-10-31)');
  t.ok(l7005 && l7005.includes('2027-10-31'), '7005: el semáforo suma el fin de soporte (2027-10-31)');
  const l7010 = await filaDe('7010');
  t.ok(l7010 && l7010.includes('Fuera de venta') && /no trae la fecha/.test(l7010),
    '7010: retirado por HPE sin fecha — rojo, y declara que el catálogo no trae la fecha');

  // El selector de equipo nombra la condición con la fecha ya vencida.
  await page.click('[data-tab=calc]');
  await asentar(page);
  const etiquetaXL = await page.$eval('#pickModel option[value="EC-XL"]', (o) => o.textContent).catch(() => '');
  t.ok(/fin de venta vencido/.test(etiquetaXL),
    'el combo nombra al EC-XL «fin de venta vencido» (no «fin de venta» a secas: la fecha ya pasó)');
  const etiquetaXS = await page.$eval('#pickModel option[value="EC-XS"]', (o) => o.textContent).catch(() => '');
  t.ok(etiquetaXS && !/fin de venta|fuera de venta/i.test(etiquetaXS),
    'el combo NO marca al EC-XS con fin de venta');

  // La ficha del EC-XL elegido declara la condición actual y el fin de soporte.
  await page.fill('#users', '60');
  await page.locator('.wan-fila').first().locator('input[data-campo=down]').fill('200');
  await asentar(page);
  await page.selectOption('#pickModel', 'EC-XL');
  await asentar(page);
  const ficha = (await page.textContent('#verdict')) || '';
  t.ok(/ya pasó/.test(ficha), 'la ficha del EC-XL declara que su fecha de último pedido ya pasó');
  t.ok(/2033-03-31/.test(ficha), 'la ficha declara el fin de soporte del fabricante (2033-03-31)');

  // El ámbar de «línea anterior» se queda sin sujeto real en Aruba: toda la línea AOS 8 está
  // ya fuera de venta. No se borra la comprobación, se le da un sujeto: la misma página con el
  // 7030 devuelto a línea anterior (sin `eol`), que es como estaba hasta el 2026-10-06.
  let devuelto = false;
  await page.route('**/api/dimensionador/aruba', async (ruta) => {
    const r = await ruta.fetch();
    const datos = await r.json();
    const lista = Array.isArray(datos.models) ? datos.models : (Array.isArray(datos.MODELS) ? datos.MODELS : []);
    for (const m of lista) if (m.id === '7030' && m.eol) { m.eol = false; devuelto = true; }
    await ruta.fulfill({ response: r, json: datos });
  });
  await trasNavegar(page, () => page.goto(BASE + '/dimensionador-aruba-edgeconnect.html', { waitUntil: 'domcontentloaded' }), { selector: '#users' });
  await asentar(page);
  await page.click('[data-tab=cat]');
  await asentar(page);
  const leg = await filaDe('7030');
  await page.unroute('**/api/dimensionador/aruba');
  t.ok(devuelto, 'la intercepción se aplicó: el 7030 llegaba con eol y se le quitó');
  t.ok(leg && /L.nea anterior/.test(leg), 'un AOS 8 sin marca de fin de venta conserva el ámbar de línea anterior');
  t.ok(leg && /sucesor natural: Gateway 9012/.test(leg), 'y nombra su sucesor inferido, rotulado como inferencia');

  await browser.close();
  process.exit(t.resumen('e2e-ciclo-vida'));
})().catch((e) => { console.error('ERROR E2E:', e.message); process.exit(2); });
