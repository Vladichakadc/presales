'use strict';
/* La PQC de gestión y control en la pantalla (2026-10-30, verificación del PR #84). La ficha AR6710-L
   R26C00 de Huawei da PQC en SSL, SSH y el DTLS del SD-WAN, no en el IPsec de datos: el dimensionador
   tiene que decirlo en la ficha del equipo, con su documento, y «Exigir PQC» no puede darlo por bueno.
   Se conduce lo que sirve el servidor (proyección del catálogo incluida), no el módulo suelto. */
const { cargarPlaywright, BASE, abrirSesion, asentar, trasNavegar, contador } = require('./ayuda');

const PAGINA = `${BASE}/dimensionador-huawei-netengine.html?bw=10`;
const MODELO = 'AR6710-L26T2X4';

(async () => {
  const { chromium } = cargarPlaywright();
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errores = [];
  page.on('pageerror', (e) => errores.push(e.message));
  const t = contador();

  await abrirSesion(page);
  await trasNavegar(page, () => page.goto(PAGINA, { waitUntil: 'domcontentloaded' }), { selector: '#verdict-sel' });
  await asentar(page);
  const hay = await page.evaluate((id) => [...globalThis.document.querySelectorAll('#verdict-sel option')].some((o) => o.value === id), MODELO);
  t.ok(hay, `el desplegable de la ficha ofrece el ${MODELO}`);
  if (hay) {
    await page.selectOption('#verdict-sel', MODELO);
    await asentar(page);
    const ficha = ((await page.textContent('#verdict')) || '').replace(/\s+/g, ' ');
    t.ok(/Criptografía post-cuántica \(PQC\)/.test(ficha), 'la ficha pinta su sección de PQC');
    t.ok(/no consta/.test(ficha), 'el soporte en el túnel sigue en «no consta»');
    t.ok(/Gestión y control/.test(ficha) && /SSL, SSH y DTLS del SD-WAN/.test(ficha) && /no cuenta para «Exigir PQC»/.test(ficha),
      'y la fila «Gestión y control» dice dónde la da su ficha y que no cuenta para el requisito');
    const enlace = await page.evaluate(() => {
      const a = [...globalThis.document.querySelectorAll('#verdict a')].find((x) => /AR6710-L%20Series/.test(x.getAttribute('href') || ''));
      return a ? a.getAttribute('href') : null;
    });
    t.ok(!!enlace && enlace.startsWith('https://e-file.huawei.com/'), 'con el enlace al documento oficial');
  }

  // Con «Exigir PQC», ningún Huawei la tiene documentada en el túnel: la de gestión no basta.
  await page.selectOption('#reqPqc', 'clave');
  await asentar(page);
  const cuerpo = ((await page.textContent('body')) || '').replace(/\s+/g, ' ');
  t.ok(/no consta en ningún documento oficial/.test(cuerpo), 'con «Exigir PQC», los AR6710-L se apartan por «no consta»');

  t.ok(errores.length === 0, 'sin errores de JS' + (errores.length ? ': ' + errores.join(' | ') : ''));
  await browser.close();
  process.exit(t.resumen('e2e-pqc-gestion-huawei'));
})().catch((e) => { console.error('ERROR E2E:', e.message); process.exit(2); });
