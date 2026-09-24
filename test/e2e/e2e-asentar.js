'use strict';
/* global document, window */
/* E2E del propio asentar() (2026-09-24). Todas las baterías esperan con él desde ese día, así
   que su contrato se prueba aparte, sobre una página SINTÉTICA que sirve Playwright (nunca
   llega al servidor) y que no depende del catálogo:

     1. espera a un temporizador corto (700 ms, por debajo del umbral declarado);
     2. espera a una petición lenta y a la lectura de su cuerpo;
     3. NO espera a un temporizador largo (por encima del umbral: los rótulos que vuelven a su
        texto) — es la mitad declarada del contrato, y se fija para que nadie la cambie sin
        verla;
     4. NO se cuelga con una imagen diferida que quedó POR ENCIMA de la vista ni con una dentro
        de display:none. La primera versión esperó 30 s a la foto de un 50G que estaba 5.000 px
        por encima: solo miraba un borde;
     5. sobre una página sin rastreador falla diciéndolo, en vez de dar por quieta una página
        que nadie midió. */
const { cargarPlaywright, abrirSesion, asentar, BASE, UMBRAL_TEMPORIZADOR_MS, contador } = require('./ayuda');

const SINTETICA = `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>asentar</title></head><body>
<div id="estado">inicial</div>
<button id="corto">corto</button><button id="red">red</button><button id="largo">largo</button>
<div style="height:8000px"></div>
<img id="lejos" loading="lazy" alt="" src="/__e2e/lejos.png">
<div style="height:14000px"></div>
<div style="display:none"><img loading="lazy" alt="" src="/__e2e/oculta.png"></div>
<script>
  const estado = document.getElementById('estado');
  document.getElementById('corto').onclick = () => setTimeout(() => { estado.textContent = 'tras el corto'; }, 700);
  document.getElementById('red').onclick = async () => {
    const r = await fetch('/__e2e/lento');
    estado.textContent = (await r.json()).v;
  };
  document.getElementById('largo').onclick = () => setTimeout(() => { estado.textContent = 'tras el largo'; }, ${UMBRAL_TEMPORIZADOR_MS + 800});
</script></body></html>`;

async function servirSintetica(page) {
  await page.route(`${BASE}/__e2e/**`, async (route) => {
    const url = route.request().url();
    if (url.endsWith('/sintetica')) return route.fulfill({ contentType: 'text/html', body: SINTETICA });
    if (url.endsWith('/lento')) {
      await new Promise((ok) => { setTimeout(ok, 1200); });
      return route.fulfill({ contentType: 'application/json', body: '{"v":"tras la red"}' });
    }
    return route.abort();
  });
}

(async () => {
  const { chromium } = cargarPlaywright();
  const browser = await chromium.launch();
  const t = contador();

  const page = await browser.newPage({ viewport: { width: 1000, height: 800 } });
  await abrirSesion(page);
  await servirSintetica(page);
  await page.goto(`${BASE}/__e2e/sintetica`, { waitUntil: 'domcontentloaded' });
  await asentar(page);

  const texto = () => page.$eval('#estado', (e) => e.textContent);

  await page.click('#corto');
  await asentar(page);
  t.ok(await texto() === 'tras el corto', 'espera a un temporizador corto (700 ms) antes de devolver el control');

  await page.click('#red');
  await asentar(page);
  t.ok(await texto() === 'tras la red', 'espera a una petición lenta (1,2 s) y a la lectura de su cuerpo');

  await page.click('#largo');
  const t0 = Date.now();
  await asentar(page);
  t.ok(await texto() === 'tras la red' && Date.now() - t0 < UMBRAL_TEMPORIZADOR_MS + 800,
    `no espera a un temporizador por encima del umbral declarado (${UMBRAL_TEMPORIZADOR_MS} ms): son rótulos que vuelven a su texto`);

  // La diferida está 8.000 px abajo: no ha cruzado la vista ni su margen de precarga. Se
  // salta de golpe al final, así queda unos 14.000 px POR ENCIMA sin haber pasado nunca por
  // la vista — la forma exacta de la foto del 50G. La de display:none nunca se pide.
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  const t1 = Date.now();
  let colgada = null;
  try { await asentar(page, { timeout: 8000 }); } catch (e) { colgada = e.message; }
  t.ok(colgada === null, 'no se cuelga con una imagen diferida por encima de la vista ni con una en display:none'
    + (colgada ? `: ${colgada}` : ` (${Date.now() - t1} ms)`));
  // Sin esto, el caso anterior podría pasar en vacío: si la imagen hubiera llegado a pedirse,
  // estaría completa (rota) y no habría nada que esperar.
  t.ok(!(await page.$eval('#lejos', (i) => i.complete)) && (await page.$eval('#lejos', (i) => i.getBoundingClientRect().bottom)) < 0,
    'el caso existe: la imagen diferida sigue sin cargar y está por encima de la vista');

  const sin = await browser.newPage();
  await servirSintetica(sin);
  await sin.goto(`${BASE}/__e2e/sintetica`, { waitUntil: 'domcontentloaded' });
  let error = '';
  try { await asentar(sin, { timeout: 5000 }); } catch (e) { error = e.message; }
  t.ok(/no lleva el rastreador/.test(error), 'sobre una página sin rastreador falla diciéndolo, no la da por quieta');

  await browser.close();
  process.exit(t.resumen('e2e-asentar'));
})().catch((e) => { console.error('ERROR E2E:', e.message); process.exit(2); });
