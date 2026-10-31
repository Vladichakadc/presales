'use strict';
/* global window */
/*   ↑ los callbacks de page.evaluate corren EN el navegador.
   EL BOTÓN «ACTUALIZAR» COMO DETECTOR (mejora propuesta al cerrar el PR #86, aprobada por el dueño
   el 2026-10-31). Si el recálculo del botón cambia lo que se veía, la página no estaba al día, y el
   botón lo dice («El resultado no estaba al día…») y deja en la consola el último campo tocado y el
   enlace. En los nueve dimensionadores:
     1. sin falso aviso: con la página al día (recién preparada y recalculada), el botón dice
        «Actualizado»;
     2. con aviso: se cambia un campo SIN eventos (como lo haría un código que se olvidó de
        recalcular), el botón dice «no estaba al día» y la consola lo registra;
     3. y al pulsar otra vez, como ya está al día, vuelve a «Actualizado».
   Para el paso 2 vale el primer campo numérico visible cuyo cambio mueve el resultado: se prueban
   hasta diez, reponiendo cada uno. */
const { cargarPlaywright, BASE, abrirSesion, asentar, trasNavegar, contador } = require('./ayuda');
const { PAGINAS, PREPARAR, salir } = require('./resultados');

let donde = 'al empezar';

const estado = (page) => page.evaluate(() => (window.document.querySelector('.act-estado') || {}).textContent || '');
async function pulsar(page) {
  await page.locator('.btn-actualizar').first().click();
  await asentar(page);
  return estado(page);
}

(async () => {
  const { chromium } = cargarPlaywright();
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errores = [];
  const avisos = [];
  page.on('pageerror', (e) => errores.push(e.message));
  page.on('console', (m) => { if (m.type() === 'warning' && m.text().includes('[actualizar]')) avisos.push(m.text()); });
  const t = contador();
  await abrirSesion(page);
  let detectadas = 0;

  for (const pag of PAGINAS) {
    donde = `${pag}, al abrir`;
    await trasNavegar(page, () => page.goto(`${BASE}/dimensionador-${pag}.html`, { waitUntil: 'domcontentloaded' }), { selector: '.btn-actualizar' });
    await page.waitForFunction(() => typeof window.DIMENSIONADOR_ACTUALIZAR === 'function', null, { timeout: 20000 });
    await asentar(page);
    for (const [sel, v] of PREPARAR[pag] || []) {
      await page.locator(sel).first().fill(v, { timeout: 10000 });
      await salir(page);
      await asentar(page);
    }

    donde = `${pag}, sin falso aviso`;
    const limpio = await pulsar(page);
    t.ok(/^Actualizado a las/.test(limpio), `${pag}: con la página al día, el botón dice «Actualizado» («${limpio}»)`);

    donde = `${pag}, con aviso`;
    const candidatos = await page.evaluate(() => {
      const d = window.document;
      const cols = [...d.querySelectorAll('.cols, .dim')].filter((g) => g.children.length > 1).map((g) => g.firstElementChild)
        .concat([...d.querySelectorAll('.config-panel')]);
      return cols.flatMap((c) => [...c.querySelectorAll('input[type="number"]')])
        .filter((x) => !x.disabled && !x.readOnly && x.checkVisibility()).slice(0, 10)
        .map((x, i) => { x.dataset.e2eDetector = String(i); return i; });
    });
    let detectado = '';
    for (const i of candidatos) {
      const antes = avisos.length;
      const original = await page.evaluate((k) => {
        const x = window.document.querySelector(`[data-e2e-detector="${k}"]`);
        const v = x.value;
        const n = Number(v || 0);
        const max = x.max !== '' ? Number(x.max) : Infinity;
        const min = x.min !== '' ? Number(x.min) : 0;
        let nuevo = n ? Math.min(max, n * 2) : Math.min(max, 10);
        if (nuevo === n) nuevo = Math.max(min, n / 2);
        x.value = String(nuevo); // sin eventos: así se queda atrás un recálculo olvidado
        return v;
      }, i);
      const dicho = await pulsar(page);
      if (/no estaba al día/.test(dicho)) {
        detectado = dicho;
        t.ok(avisos.length > antes && /ultimoCampo|enlace/.test(avisos[avisos.length - 1] || 'ultimoCampo'), `${pag}: la consola registra el desfase`);
        const otra = await pulsar(page);
        t.ok(/^Actualizado a las/.test(otra), `${pag}: al pulsar otra vez, ya al día, vuelve a «Actualizado» («${otra}»)`);
        break;
      }
      // Ese campo no mueve el resultado en este escenario: se repone y se prueba el siguiente.
      await page.evaluate(([k, v]) => { window.document.querySelector(`[data-e2e-detector="${k}"]`).value = v; }, [i, original]);
      await pulsar(page);
    }
    if (detectado) detectadas += 1;
    t.ok(!!detectado || !candidatos.length, `${pag}: un campo cambiado sin eventos hace que el botón diga «no estaba al día»${detectado ? ` («${detectado.slice(0, 90)}»)` : ` (probados ${candidatos.length})`}`);
  }

  console.log(`RESUMEN - botón detector: ${PAGINAS.length} páginas · sin falso aviso al día · desfase detectado en ${detectadas}`);
  t.ok(errores.length === 0, 'sin errores de JS' + (errores.length ? ': ' + [...new Set(errores)].slice(0, 5).join(' | ') : ''));
  await browser.close();
  process.exit(t.resumen('e2e-boton-detector'));
})().catch((e) => { console.error('ERROR E2E:', `[${donde}]`, e.message.split('\n')[0]); process.exit(2); });
