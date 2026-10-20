'use strict';
/* El escalado de plataforma y los supuestos de diseño del dimensionador Huawei (2026-10-12,
   «prompt maestro» del dueño). Se conduce la CADENA COMPLETA: que con un caudal que la serie AR no
   alcanza el veredicto proponga NetEngine 8000 con su tarjeta (y no el viejo «fuera de la
   plataforma»), que el botón cambie de plataforma de verdad y deje el enlace con `platSeg`, que los
   supuestos (perfil, A-FEC, breakout) aparezcan rotulados y repinten la barra de distribución, y que
   la memoria técnica descargable los declare. Lo que fija esta batería es el RECORRIDO, no una
   cifra: los números salen del catálogo y cambian cuando se trae una ficha. */
const { cargarPlaywright, BASE, abrirSesion, asentar, trasNavegar, contador } = require('./ayuda');
const fs = require('fs');

const PAGINA = `${BASE}/dimensionador-huawei-netengine.html`;

(async () => {
  const { chromium } = cargarPlaywright();
  const browser = await chromium.launch();
  const page = await browser.newPage({ acceptDownloads: true });
  const t = contador();
  const errores = [];
  page.on('pageerror', (e) => errores.push(e.message));

  await abrirSesion(page);

  // 1 · 40 Gbps: la serie AR no llega y se propone NetEngine 8000.
  await trasNavegar(page, () => page.goto(`${PAGINA}?bw=40&unit=1000`, { waitUntil: 'domcontentloaded' }), { selector: '#btnEscalar' });
  await asentar(page);
  const antes = await page.evaluate(() => {
    const d = globalThis.document;
    return {
      tag: ((d.querySelector('#verdict .tag') || {}).textContent || '').trim(),
      modelo: ((d.querySelector('#verdict .model') || {}).textContent || '').trim(),
      callout: ((d.querySelector('#verdict .callout') || {}).textContent || ''),
      boton: !!d.getElementById('btnEscalar'),
      avisos: (d.getElementById('avisosMotor') || {}).textContent || '',
      distribOculta: d.getElementById('distrib').hidden,
    };
  });
  t.ok(antes.tag === 'Optimización de plataforma', `el veredicto dice «Optimización de plataforma» (${antes.tag})`);
  t.ok(antes.modelo === 'Plataforma superior recomendada' && !/Fuera de la plataforma/.test(antes.modelo),
    `y ya no «Fuera de la plataforma» (${antes.modelo})`);
  t.ok(antes.boton && /NE8000/.test(antes.callout) && /NetEngine 8000/.test(antes.callout),
    'la tarjeta propone un modelo de NetEngine 8000 con su botón');
  t.ok(!/Optimización de plataforma/.test(antes.avisos), 'el aviso del motor no repite lo que ya dice la tarjeta');

  // El botón cambia de plataforma de verdad, no solo el texto.
  await page.click('#btnEscalar');
  await asentar(page);
  const despues = await page.evaluate(() => {
    const d = globalThis.document;
    const activo = [...d.getElementById('platSeg').children].find((b) => b.getAttribute('aria-pressed') === 'true');
    return {
      plataforma: activo ? activo.dataset.v : null,
      modelo: ((d.querySelector('#verdict .model') || {}).textContent || '').trim(),
      boton: !!d.getElementById('btnEscalar'),
      distribOculta: d.getElementById('distrib').hidden,
      url: globalThis.location.search,
    };
  });
  t.ok(despues.plataforma === 'ne8000', `el botón deja la plataforma en NE8000 (${despues.plataforma})`);
  t.ok(/^NE8000/.test(despues.modelo), `y el veredicto recomienda un NE8000 (${despues.modelo})`);
  t.ok(!despues.boton, 'la tarjeta de escalado desaparece una vez aceptada');
  t.ok(despues.distribOculta, 'la barra de distribución no aplica en una plataforma de transporte');
  t.ok(/platSeg=ne8000/.test(despues.url), `el enlace compartido conserva la plataforma (${despues.url})`);

  // 2 · Supuestos de diseño: perfil VoIP, A-FEC y breakout.
  await trasNavegar(page, () => page.goto(`${PAGINA}?bw=200&trafico=voip&fec=1&sDia=1`, { waitUntil: 'domcontentloaded' }), { selector: '#verdict-sel' });
  await asentar(page);
  const sup = await page.evaluate(() => {
    const d = globalThis.document;
    const dist = d.getElementById('distrib');
    return {
      controles: { trafico: d.getElementById('trafico').value, fec: d.getElementById('fec').checked, dia: d.getElementById('sDia').checked },
      visible: !dist.hidden,
      tramos: ['.l-dia', '.l-tun', '.l-over'].filter((s) => dist.querySelector(s)).length,
      porque: [...d.querySelectorAll('#verdict .why li')].map((l) => l.textContent).join('\n'),
    };
  });
  t.ok(sup.controles.trafico === 'voip' && sup.controles.fec && sup.controles.dia, 'el enlace repone perfil, A-FEC y breakout');
  t.ok(sup.visible && sup.tramos === 3, `la barra de distribución pinta sus tres tramos (${sup.tramos})`);
  t.ok(/supuesto de diseño/.test(sup.porque) && /supuesto declarado/.test(sup.porque), 'cada supuesto sale rotulado en el «cómo se llegó»');
  t.ok(/Local breakout/.test(sup.porque), 'y el breakout dice cuánto cruza los túneles');

  // 3 · La memoria técnica descargable declara los supuestos y trae sus cuatro secciones.
  await page.click('[data-tab=bom]');
  await asentar(page);
  const [descarga] = await Promise.all([page.waitForEvent('download', { timeout: 30000 }), page.click('#memoriaBtn')]);
  const md = fs.readFileSync(await descarga.path(), 'utf8');
  for (const sec of ['## 1. Resumen ejecutivo', '## 2. Memoria de cálculo', '## 3. Lista de materiales', '## 4. Cuadro de especificaciones físicas']) {
    t.ok(md.includes(sec), `la memoria trae «${sec}»`);
  }
  t.ok(/supuesto de diseño/.test(md) && /no cifras publicadas por Huawei/.test(md), 'y declara que los supuestos no son cifras de Huawei');
  t.ok(/\.md$/.test(descarga.suggestedFilename()), `y se descarga como Markdown (${descarga.suggestedFilename()})`);

  // 4 · Cuota mensual: sin precio no hay cuota, y la pantalla lo dice en vez de calcularla. Desde
  // el 2026-10-20 (decisión del dueño: los «~ $» sin documento pasan a «Consultar») ningún Huawei
  // trae precio de referencia; hasta entonces este paso medía el MRR con el «~ $950» del AR651. La
  // aritmética de la cuota la sigue fijando test/bom-mrr.test.js.
  await page.selectOption('#pickModel', 'AR651');
  await asentar(page);
  const mrr = await page.evaluate(() => (globalThis.document.getElementById('mrrBox') || {}).textContent || '');
  t.ok(/Sin precios no hay cuota/.test(mrr) && !/Cuota mensual \(MRR\)/.test(mrr), 'sin precio de referencia el simulador no da una cuota');
  t.ok(/Huawei no publica lista/.test(mrr) && !/\$\s?\d/.test(mrr), 'y dice por qué, sin una cifra inventada');

  t.ok(errores.length === 0, `sin errores de JavaScript en la página${errores.length ? ': ' + errores[0] : ''}`);
  await browser.close();
  process.exit(t.resumen('e2e-huawei-escalado'));
})().catch((e) => { console.error('ERROR E2E:', e.message); process.exit(2); });
