'use strict';
/* La figura oficial del equipo en el dimensionador Huawei (2026-10-06, petición del dueño:
   «sube la gráfica de los equipos al dimensionador de Huawei tal cual como está en Aruba y
   Fortinet»). Se conduce la CADENA COMPLETA, como en Fortinet: que la figura se sirve de
   verdad y no es un 404 con hueco, que su pie dice de qué documento salió, que las dos caras
   y la lupa funcionan donde el documento publica dos, que un modelo sin figura lo DICE, y que
   la figura viaja en el Excel del BOM. No cuántos modelos la tienen: ese número sube en
   cuanto alguien traiga las fichas que faltan.
   El sujeto es el AR611, el único con frontal y trasera junto al AR617VW-LTE4: es un AR610
   de sobremesa, y su ficha (R26C00) publica las dos vistas. */
const fs = require('fs');
const XLSX = require('xlsx');
const { cargarPlaywright, BASE, abrirSesion, asentar, trasNavegar, contador } = require('./ayuda');

const PAGINA = `${BASE}/dimensionador-huawei-netengine.html?bw=10`;

async function mirarFigura(page) {
  await page.evaluate(() => { const f = globalThis.document.querySelector('#verdict .ficha-vista, #verdict .ficha-vista-vacia'); if (f) f.scrollIntoView({ block: 'center' }); });
  // `loading="lazy"`: hasta que la figura entra en el viewport, naturalWidth es 0.
  await page.waitForFunction(() => {
    const i = globalThis.document.querySelector('#verdict .ficha-vista img');
    return !i || (i.complete && i.naturalWidth > 0);
  }, null, { timeout: 15000 }).catch(() => {});
  return page.evaluate(() => {
    const d = globalThis.document;
    const f = d.querySelector('#verdict .ficha-vista');
    const i = f && f.querySelector('img');
    return {
      hay: !!f, src: i ? i.getAttribute('src') : null, ancho: i ? i.naturalWidth : 0,
      pie: ((f && f.querySelector('figcaption')) || {}).textContent || '',
      caras: f ? f.querySelectorAll('.ficha-vista-tab').length : -1,
      lupa: !!(f && f.querySelector('.ficha-vista-zoom')),
      vacia: ((d.querySelector('#verdict .ficha-vista-vacia')) || {}).textContent || '',
    };
  });
}

(async () => {
  const { chromium } = cargarPlaywright();
  const browser = await chromium.launch();
  const page = await browser.newPage({ acceptDownloads: true });
  const t = contador();

  await abrirSesion(page);
  await trasNavegar(page, () => page.goto(PAGINA, { waitUntil: 'domcontentloaded' }), { selector: '#verdict-sel' });
  await asentar(page);
  await page.selectOption('#verdict-sel', 'AR611');
  await asentar(page);

  const f = await mirarFigura(page);
  t.ok(f.hay, 'la ficha corona con la figura oficial del equipo, como en Aruba y Fortinet');
  t.ok(/^\/img\/equipos\/hw-ar611-front\.webp$/.test(f.src || ''), `la figura sale del repositorio (${f.src})`);
  t.ok(f.ancho > 0, `y CARGA de verdad, no es un hueco (natural ${f.ancho}px)`);
  t.ok(/Datasheet NetEngine AR610 Series \(R26C00\), p\. 1 — «NetEngine AR611»/.test(f.pie),
    `el pie declara documento, página y rótulo (${f.pie.slice(0, 90)}…)`);
  t.ok(/mm \(Al × An × Fo\)/.test(f.pie), 'y el tamaño del equipo');
  t.ok(f.caras === 2, `conmutador frontal/trasera: el documento publica las dos vistas (${f.caras} pestañas)`);
  t.ok(f.lupa, 'la lupa está, como en Aruba y Fortinet');

  await page.click('#verdict .ficha-vista-tab[data-vista=rear]');
  await asentar(page);
  const trasera = await mirarFigura(page);
  t.ok(/hw-ar611-rear\.webp$/.test(trasera.src || '') && trasera.ancho > 0,
    `la pestaña «Trasera» sirve la cara de conectores y carga (${trasera.src}, ${trasera.ancho}px)`);

  await page.click('#verdict .ficha-vista-zoom');
  await asentar(page);
  const lupa = await page.evaluate(() => {
    const l = globalThis.document.querySelector('#fichaLupa');
    const i = l && l.querySelector('img');
    return { abierta: !!(l && !l.hidden), ancho: i ? i.naturalWidth : 0, pie: ((l && l.querySelector('figcaption')) || {}).textContent || '' };
  });
  t.ok(lupa.abierta && lupa.ancho > 0, `la lupa abre la figura a su resolución natural (${lupa.ancho}px)`);
  t.ok(/R26C00/.test(lupa.pie), 'y conserva la procedencia en su pie');
  await page.keyboard.press('Escape');
  await asentar(page);

  // La figura viaja en el Excel del BOM, con las dos caras y su procedencia.
  await page.click('[data-tab=bom]');
  await asentar(page);
  const [descarga] = await Promise.all([page.waitForEvent('download', { timeout: 30000 }), page.click('#xlsBtn')]);
  const buf = fs.readFileSync(await descarga.path());
  t.ok(buf.includes(Buffer.from('xl/media/image1.png')) && buf.includes(Buffer.from('xl/media/image2.png')),
    'el Excel incrusta la cara frontal y la trasera');
  const libro = XLSX.read(buf, { type: 'buffer' });
  t.ok(libro.SheetNames.includes('Fotos del equipo'), 'el Excel lleva la hoja «Fotos del equipo»');
  const plano = libro.SheetNames.includes('Fotos del equipo')
    ? XLSX.utils.sheet_to_json(libro.Sheets['Fotos del equipo'], { header: 1 }).map((r) => r.join(' | ')).join('\n') : '';
  t.ok(plano.includes('Modelo: AR611') && /R26C00/.test(plano), 'la hoja declara el modelo cotizado y la procedencia');

  // EL HUECO HONESTO, con un sujeto que no depende del catálogo del día: se sirve el mapa de
  // figuras SIN la entrada del AR611. `quitado` prueba que la intercepción se aplicó y que la
  // entrada existía (`delete` devuelve true aunque la clave no esté).
  let quitado = false;
  await page.route('**/data/huawei-vistas-equipos.json', async (ruta) => {
    const r = await ruta.fetch();
    const mapa = await r.json();
    quitado = 'AR611' in mapa;
    delete mapa.AR611;
    await ruta.fulfill({ response: r, json: mapa });
  });
  await trasNavegar(page, () => page.goto(PAGINA, { waitUntil: 'domcontentloaded' }), { selector: '#verdict-sel' });
  await asentar(page);
  await page.selectOption('#verdict-sel', 'AR611');
  await asentar(page);
  const hueco = await mirarFigura(page);
  await page.unroute('**/data/huawei-vistas-equipos.json');
  t.ok(quitado && !hueco.hay && /Sin foto oficial/.test(hueco.vacia),
    'un modelo sin figura oficial DECLARA el hueco en vez de enseñar la de un hermano de serie');

  await browser.close();
  process.exit(t.resumen('e2e-huawei-vistas'));
})().catch((e) => { console.error('ERROR E2E:', e.message); process.exit(2); });
