'use strict';
/* global window */
/*   ↑ los callbacks de page.evaluate corren EN el navegador.
   EL RESULTADO AL ABRIR LA PÁGINA, NO SOLO AL CAMBIAR UN CAMPO (mejora propuesta al cerrar el PR #79,
   aprobada por el dueño el 2026-10-31: «ejecuta la mejora propuesta»). `e2e-campos-en-linea.js`
   prueba 380 cambios y ninguno se queda atrás, pero empieza pulsando «Actualizar» para partir de un
   estado limpio, y con eso tapa justo un desfase posible: la página que se abre con un escenario
   ya puesto (un enlace compartido con parámetros, una recarga) y pinta la derecha antes de aplicar
   lo restaurado. Los botones segmentados (`.seg`) son el sitio de riesgo: `estado.js` los repone con
   un clic sintético DESPUÉS de que corra el script de la página.

   EL MISMO ORÁCULO: el botón. En cada uno de los nueve dimensionadores y en tres arranques, se lee el
   texto de resultados con la página recién abierta y asentada (A) y tras
   `window.DIMENSIONADOR_ACTUALIZAR()` (C). Si difieren, la página arrancó desfasada.
     1. vacía: la página sin parámetros;
     2. enlace compartido: el escenario se pone a mano (caudal de sucursal, la primera casilla de
        función, la segunda opción del primer botón segmentado), se toma la URL que escribe
        `estado.js` y se abre como documento nuevo;
     3. recarga: ese mismo documento, recargado.
   Lo que es correcto que arranque distinto se declara en EXCEPCIONES con su motivo; hoy, ninguno. */
const { cargarPlaywright, BASE, abrirSesion, asentar, trasNavegar, contador } = require('./ayuda');
const { PAGINAS, PREPARAR, leerResultados, salir, diferencia } = require('./resultados');

// { 'pagina': { 'arranque': 'motivo' } }
const EXCEPCIONES = {};

// Dónde va la batería: si algo revienta, el error lo dice (en CI solo se leen las anotaciones).
let donde = 'al empezar';

// Abrir y esperar a lo que el botón necesita: su función registrada y la página quieta (el
// catálogo llegó, `estado.js` repuso lo suyo). Leer antes daría un falso rojo con la carga a medias.
async function abrir(page, url) {
  await trasNavegar(page, () => page.goto(url, { waitUntil: 'domcontentloaded' }), { selector: '.btn-actualizar' });
  await page.waitForFunction(() => typeof window.DIMENSIONADOR_ACTUALIZAR === 'function', null, { timeout: 20000 });
  await asentar(page);
}

// A contra C: lo que la página pintó sola al abrir contra lo que deja el recálculo completo.
async function comparar(page) {
  const a = await leerResultados(page);
  const corrio = await page.evaluate(() => window.DIMENSIONADOR_ACTUALIZAR() !== false);
  await asentar(page);
  const c = await leerResultados(page);
  return { a, c, corrio };
}

// El escenario del enlace: caudal de sucursal, la primera casilla de función libre y la segunda
// opción del primer botón segmentado (lo que `estado.js` repone por clic sintético). Devuelve qué
// tocó, para que el aviso lo diga.
async function ponerEscenario(page, pag) {
  const hecho = [];
  for (const [sel, v] of PREPARAR[pag] || []) {
    await page.locator(sel).first().fill(v, { timeout: 10000 });
    await salir(page);
    await asentar(page);
    hecho.push(`${sel}=${v}`);
  }
  const extra = await page.evaluate(() => {
    const d = window.document;
    const out = [];
    const cols = [...d.querySelectorAll('.cols, .dim')].filter((g) => g.children.length > 1).map((g) => g.firstElementChild)
      .concat([...d.querySelectorAll('.config-panel')]);
    const cb = cols.flatMap((c) => [...c.querySelectorAll('label > input[type="checkbox"]')])
      .find((x) => !x.checked && !x.disabled && x.id && x.checkVisibility() && !x.parentElement.matches('.wan-sim, .wan-ov, .switch'));
    if (cb) { cb.click(); out.push(`#${cb.id}`); }
    const seg = cols.flatMap((c) => [...c.querySelectorAll('.seg[id]')]).find((g) => g.checkVisibility());
    if (seg) {
      const otro = [...seg.querySelectorAll('button[data-v]')].find((b) => b.getAttribute('aria-pressed') !== 'true' && !b.disabled);
      if (otro) { otro.click(); out.push(`#${seg.id}=${otro.dataset.v}`); }
    }
    return out;
  });
  await asentar(page);
  return hecho.concat(extra);
}

(async () => {
  const { chromium } = cargarPlaywright();
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errores = [];
  page.on('pageerror', (e) => errores.push(e.message));
  const t = contador();
  await abrirSesion(page);

  // GitHub publica 10 avisos por paso y la de campos en línea ya usa 9: esta resume en uno.
  let alDia = 0;
  for (const pag of PAGINAS) {
    const base = `${BASE}/dimensionador-${pag}.html`;
    const resultados = [];

    donde = `${pag}, vacía`;
    await abrir(page, base);
    resultados.push(['vacía', await comparar(page), '']);

    donde = `${pag}, poniendo el escenario`;
    const tocado = await ponerEscenario(page, pag);
    const url = page.url();

    // Abrir el enlace es cargar un documento nuevo con esa URL: la misma pestaña sirve (el rastreador
    // de asentar() se instala por pestaña, y la sesión es la misma). Se pasa antes por otra página
    // para que no quede nada del documento anterior.
    donde = `${pag}, enlace compartido`;
    await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
    await abrir(page, url);
    resultados.push(['enlace compartido', await comparar(page), tocado.join(', ')]);

    donde = `${pag}, recarga`;
    await abrir(page, url);
    await trasNavegar(page, () => page.reload({ waitUntil: 'domcontentloaded' }), { selector: '.btn-actualizar' });
    await page.waitForFunction(() => typeof window.DIMENSIONADOR_ACTUALIZAR === 'function', null, { timeout: 20000 });
    await asentar(page);
    resultados.push(['recarga', await comparar(page), tocado.join(', ')]);

    const malos = [];
    for (const [arranque, r, escenario] of resultados) {
      t.ok(r.corrio, `${pag} (${arranque}): el catálogo llegó y el recálculo completo corre`);
      const excepcion = (EXCEPCIONES[pag] || {})[arranque];
      if (r.a === r.c) continue;
      if (excepcion) console.log(`ok - ${pag} (${arranque}): arranca distinto, declarado: ${excepcion}`);
      else malos.push(`${arranque}${escenario ? ` [${escenario}]` : ''}: al abrir ${diferencia(r.a, r.c)}`);
    }
    alDia += 3 - malos.length;
    console.log(`  ${pag}: arranque vacío, por enlace (${tocado.length ? tocado.join(', ') : 'sin escenario que poner'}) y recargado · ${3 - malos.length} de 3 al día al abrir`);
    for (const m of malos) t.ok(false, `${pag}: ${m}`);
    if (!malos.length) t.ok(true, `${pag}: los tres arranques muestran lo mismo que el recálculo completo`);
  }

  console.log(`RESUMEN - arranque: ${PAGINAS.length} páginas × 3 arranques (vacía, enlace compartido, recarga) · ${alDia} de ${PAGINAS.length * 3} al día al abrir`);
  t.ok(errores.length === 0, 'sin errores de JS' + (errores.length ? ': ' + [...new Set(errores)].slice(0, 5).join(' | ') : ''));
  await browser.close();
  process.exit(t.resumen('e2e-arranque'));
})().catch((e) => { console.error('ERROR E2E:', `[${donde}]`, e.message.split('\n')[0]); process.exit(2); });
