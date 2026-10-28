'use strict';
/* La leyenda de los números en las figuras de Juniper (2026-10-27, mejora propuesta tras las de
   Cisco y ejecutada por el dueño). Todas las figuras de Juniper son dibujos de su guía de hardware
   (o de su ficha de línea) con los componentes numerados, así que el equipo que la página
   recomiende sirve de sujeto: la lupa tiene que pintar bajo la figura la tabla de esa cara, y
   cambiarla al pasar a la otra. La tarjeta es la clavada (`panelFijo`): ahí no va el desplegable,
   porque la compacta tiene que caber entera. */
const fs = require('fs');
const XLSX = require('xlsx');
const { cargarPlaywright, BASE, abrirSesion, asentar, trasNavegar, contador } = require('./ayuda');

const PAGINA = `${BASE}/dimensionador-juniper-srx.html?bw=500`;

const leerLupa = (page) => page.evaluate(() => {
  const l = globalThis.document.querySelector('#fichaLupa');
  const c = l && l.querySelector('.ficha-lupa-leyenda');
  return {
    abierta: !!(l && !l.hidden),
    visible: !!(c && !c.hidden),
    titulo: ((c && c.querySelector('.ficha-leyenda-tit')) || {}).textContent || '',
    numeros: c ? [...c.querySelectorAll('tbody tr')].map((tr) => Number(tr.cells[0].textContent.trim())) : [],
    completas: c ? [...c.querySelectorAll('tbody tr')].every((tr) => tr.cells[1].textContent.trim() && tr.cells[2].textContent.trim()) : false,
  };
});

(async () => {
  const { chromium } = cargarPlaywright();
  const browser = await chromium.launch();
  const page = await browser.newPage({ acceptDownloads: true });
  const t = contador();

  await abrirSesion(page);
  await trasNavegar(page, () => page.goto(PAGINA, { waitUntil: 'domcontentloaded' }), { selector: '#verdict' });
  await asentar(page);
  const ficha = await page.evaluate(() => ({
    zoom: !!globalThis.document.querySelector('#verdict .ficha-vista-zoom'),
    desplegable: !!globalThis.document.querySelector('#verdict .ficha-vista-leyenda'),
    modelo: (globalThis.document.querySelector('#verdict .ficha-vista') || { dataset: {} }).dataset.modelo || '',
  }));
  t.ok(ficha.zoom, `la ficha del recomendado tiene figura con lupa (${ficha.modelo})`);
  t.ok(!ficha.desplegable, 'la tarjeta clavada no lleva el desplegable de la leyenda: tiene que caber entera');

  if (ficha.zoom) {
    await page.click('#verdict .ficha-vista-zoom');
    await asentar(page);
    const frente = await leerLupa(page);
    const seguidos = (ns) => ns.length > 0 && ns.every((n, i) => n === ns[0] + i);
    t.ok(frente.abierta && frente.visible && /vista frontal/.test(frente.titulo),
      `al ampliar, la tabla de la vista frontal va bajo la figura (${frente.titulo})`);
    t.ok(seguidos(frente.numeros) && frente.numeros[0] === 1 && frente.completas,
      `números del 1 al ${frente.numeros[frente.numeros.length - 1]}, cada uno con qué es y su rótulo`);
    await page.keyboard.press('ArrowRight');
    await asentar(page);
    const tras = await leerLupa(page);
    t.ok(tras.visible && /vista trasera/.test(tras.titulo) && seguidos(tras.numeros),
      `la flecha pasa a la trasera y la tabla con ella (${tras.numeros.length} números)`);
    await page.keyboard.press('Escape');
    await asentar(page);
  }

  // La figura y su tabla viajan en el Excel del BOM (mejora aprobada el 2026-10-27): la hoja
  // «Fotos del equipo» incrusta las dos caras y escribe bajo cada una qué es cada número.
  await page.click('[data-tab=bom]');
  await asentar(page);
  const [descarga] = await Promise.all([page.waitForEvent('download', { timeout: 30000 }), page.click('#xlsBtn')]);
  const buf = fs.readFileSync(await descarga.path());
  t.ok(buf.includes(Buffer.from('xl/media/image1.png')) && buf.includes(Buffer.from('xl/media/image2.png')),
    'el Excel incrusta la cara frontal y la trasera');
  const libro = XLSX.read(buf, { type: 'buffer' });
  const plano = libro.SheetNames.includes('Fotos del equipo')
    ? XLSX.utils.sheet_to_json(libro.Sheets['Fotos del equipo'], { header: 1 }).map((r) => r.join(' | ')).join('\n') : '';
  t.ok(/Modelo: (SRX|SSR)\S+/.test(plano) && /Guía de hardware|Ficha SSR/.test(plano),
    'la hoja «Fotos del equipo» declara el modelo y el documento de la figura');
  t.ok(/Qué es cada número de la vista frontal/.test(plano) && /Qué es cada número de la vista trasera/.test(plano),
    'y bajo cada cara, la tabla de sus números');
  t.ok(/^\s*1\. .+ — «.+»/m.test(plano), 'cada fila con lo que es y su rótulo literal');
  // La foto de producto también (mejora aprobada el 2026-10-27): tercera imagen, con su pie propio.
  t.ok(buf.includes(Buffer.from('xl/media/image3.png')), 'el Excel incrusta además la foto de producto');
  t.ok(/^Foto de producto$/m.test(plano) && /^Foto de producto de la (ficha|página) /m.test(plano),
    'con su título y el pie del documento del que sale');
  t.ok(libro.SheetNames[0] === 'BOM' && libro.SheetNames[1] === 'Supuestos',
    `la hoja BOM sigue primera y «Supuestos» segunda (${libro.SheetNames.join(', ')})`);

  await browser.close();
  process.exit(t.resumen('e2e-leyendas-juniper'));
})().catch((e) => { console.error('ERROR E2E:', e.message); process.exit(2); });
