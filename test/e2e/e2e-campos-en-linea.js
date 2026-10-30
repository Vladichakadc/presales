'use strict';
/* global window */
/*   ↑ los callbacks de page.evaluate corren EN el navegador.
   CADA CAMPO RECALCULA EN LÍNEA (mejora propuesta al cerrar el PR #69, aprobada por el dueño el
   2026-10-29: «ejecuta mejora propuesta»). El dueño pidió el botón «Actualizar» porque la derecha
   no siempre seguía a la izquierda: cada página escucha una LISTA de campos, y uno fuera de la lista
   no dispara nada. El botón es la salida segura; esta batería es la que encuentra la causa.

   EL ORÁCULO ES EL PROPIO BOTÓN, y por eso no da falsos avisos en campos que no mueven nada. Para
   cada campo visible de la columna de parámetros, en los nueve dimensionadores:
     A = el texto de la columna de resultados antes de tocarlo;
     se cambia como lo haría una persona (casilla: clic; desplegable: otra opción; número o texto:
       escribir y salir del campo, que es cuando el navegador dispara `change`);
     B = el texto tras asentar, SIN pulsar nada;
     C = el texto tras `window.DIMENSIONADOR_ACTUALIZAR()`, el recálculo completo del botón.
   Si C difiere de B, el recálculo en línea se quedó corto: o no se enteró del cambio (B = A) o lo
   pintó a medias (B ≠ A, p. ej. el resultado sí y el BOM no). Las dos cosas son fallo. Si C = B,
   la página estaba al día, haya cambiado algo (B ≠ A) o no tuviera nada que cambiar en este
   escenario (B = A, se cuenta como «sin efecto» y no se afirma nada más).
   Después se repone el valor y se recalcula, para que el campo siguiente parta del mismo escenario.

   Lo que es correcto que no siga en línea se declara en EXCEPCIONES con su motivo; hoy, ninguno. */
const { cargarPlaywright, BASE, abrirSesion, asentar, trasNavegar, contador } = require('./ayuda');

const PAGINAS = ['aruba-edgeconnect', 'cisco-catalyst8k', 'fortinet-fortigate', 'huawei-netengine',
  'juniper-srx', 'mikrotik-routeros', 'nokia-7220ixr', 'nokia-7750sr', 'starlink-leo'];

// El escenario de partida: sin caudal, casi todas las páginas dicen «sin candidato» y casi ningún
// campo tiene nada que mover (la primera medición en CI, 2026-10-29: 29 de 38 campos de Cisco «sin
// efecto»). Con un caudal típico de sucursal, cada campo tiene un resultado que cambiar.
const PREPARAR = {
  'aruba-edgeconnect': [['#users', '300'], ['.wan-fila input[data-campo=down]', '500']],
  'cisco-catalyst8k': [['#bw', '500']],
  'huawei-netengine': [['#bw', '500']],
  'juniper-srx': [['#bw', '500']],
  'mikrotik-routeros': [['#bw', '500']],
  'nokia-7750sr': [['#bw', '100']],
};

// { 'pagina': { idDelCampo: 'motivo' } }
const EXCEPCIONES = {};

// Marca cada campo visible y habilitado de las columnas de parámetros con `data-e2e-campo` y
// devuelve su descripción. Los ya probados (por `data-e2e-hecho`) no vuelven.
const marcarCampos = (page) => page.evaluate(() => {
  const d = window.document;
  const cols = [];
  d.querySelectorAll('.cols, .dim').forEach((g) => { if (g.children.length > 1) cols.push(g.firstElementChild); });
  d.querySelectorAll('.config-panel').forEach((p) => cols.push(p));
  // Lo plegado se abre, como lo abriría quien busca ese parámetro (los avanzados de Starlink).
  cols.forEach((c) => c.querySelectorAll('details:not([open])').forEach((x) => { x.open = true; }));
  const SEL = 'input:not([type="hidden"]):not([type="button"]):not([type="submit"]):not([type="file"]):not([type="date"]):not([type="color"]), select, textarea';
  const out = [];
  let n = Number(d.body.dataset.e2eN || 0);
  cols.forEach((c) => c.querySelectorAll(SEL).forEach((el) => {
    if (el.disabled || el.readOnly || !el.checkVisibility({ visibilityProperty: true }) || el.dataset.e2eHecho) return;
    // La barra del propio botón y los campos de la lista de perfiles no son parámetros del cálculo.
    if (el.closest('.barra-actualizar, .perfiles, #panelPerfiles, dialog')) return;
    if (el.tagName === 'SELECT' && el.options.length < 2) return;
    n += 1;
    el.dataset.e2eCampo = String(n);
    el.dataset.e2eHecho = '1';
    const lab = el.id && d.querySelector(`label[for="${window.CSS.escape(el.id)}"]`);
    const nombre = el.id || el.name || (el.dataset.campo ? `[data-campo=${el.dataset.campo}]` : '')
      || ((lab || el.closest('label') || {}).textContent || '').replace(/\s+/g, ' ').trim().slice(0, 40) || `campo ${n}`;
    out.push({ n, nombre, id: el.id || '', tipo: el.tagName === 'INPUT' ? el.type : el.tagName.toLowerCase() });
  }));
  d.body.dataset.e2eN = String(n);
  return out;
});

// El texto de los resultados: la segunda columna (y siguientes) de cada rejilla visible y el panel de
// resultados de Starlink, sin el panel de funciones activadas (dice cuántos puntos cambiaron con el
// último evento, que no es parte del cálculo).
const leerResultados = (page) => page.evaluate(() => {
  const d = window.document;
  const partes = [];
  const tomar = (el) => {
    if (!el.checkVisibility()) return;
    const c = el.cloneNode(true);
    c.querySelectorAll('.funciones-activas, .barra-actualizar, script, style').forEach((x) => x.remove());
    partes.push(c.textContent.replace(/\s+/g, ' ').trim());
  };
  d.querySelectorAll('.cols, .dim').forEach((g) => [...g.children].slice(1).forEach(tomar));
  d.querySelectorAll('.results-panel').forEach(tomar);
  return partes.join(' ‖ ');
});

// El valor actual del campo, para reponerlo.
const valorDe = (page, n) => page.evaluate((k) => {
  const el = window.document.querySelector(`[data-e2e-campo="${k}"]`);
  if (!el) return null;
  return el.type === 'checkbox' || el.type === 'radio' ? { checked: el.checked } : { value: el.value };
}, n);

const usable = (page, n) => page.evaluate((k) => {
  const el = window.document.querySelector(`[data-e2e-campo="${k}"]`);
  return !!el && !el.disabled && !el.readOnly && el.checkVisibility({ visibilityProperty: true });
}, n);

// Un valor distinto y válido para un número: el doble (o 10 desde cero), dentro de min/max y del paso.
const otroNumero = (page, n) => page.evaluate((k) => {
  const el = window.document.querySelector(`[data-e2e-campo="${k}"]`);
  const v = Number(el.value || 0);
  const min = el.min !== '' ? Number(el.min) : -Infinity;
  const max = el.max !== '' ? Number(el.max) : Infinity;
  const paso = el.step && el.step !== 'any' ? Number(el.step) : null;
  const ajustar = (x) => {
    let y = Math.min(max, Math.max(min, x));
    if (paso) y = Math.round((y - (Number.isFinite(min) ? min : 0)) / paso) * paso + (Number.isFinite(min) ? min : 0);
    return Number(y.toFixed(6));
  };
  for (const cand of [v ? v * 2 : 10, v ? v / 2 : 1, Number.isFinite(max) ? max : v + 1, Number.isFinite(min) ? min : v - 1]) {
    const y = ajustar(cand);
    if (y !== v && Number.isFinite(y)) return String(y);
  }
  return null;
}, n);

async function cambiar(page, campo, nuevo) {
  const loc = page.locator(`[data-e2e-campo="${campo.n}"]`);
  if (campo.tipo === 'checkbox' || campo.tipo === 'radio') {
    // El clic del propio elemento: dispara input y change como el de una persona, aunque una
    // etiqueta estilizada lo tape.
    await loc.evaluate((el) => el.click());
  } else if (campo.tipo === 'select') {
    await loc.selectOption(nuevo, { timeout: 5000 });
  } else {
    await loc.fill(nuevo, { timeout: 5000 });
    await loc.evaluate((el) => el.blur());
  }
}

(async () => {
  const { chromium } = cargarPlaywright();
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errores = [];
  page.on('pageerror', (e) => errores.push(e.message));
  const t = contador();
  await abrirSesion(page);

  for (const pag of PAGINAS) {
    await trasNavegar(page, () => page.goto(`${BASE}/dimensionador-${pag}.html`, { waitUntil: 'domcontentloaded' }), { selector: '.btn-actualizar' });
    await page.waitForFunction(() => typeof window.DIMENSIONADOR_ACTUALIZAR === 'function', null, { timeout: 20000 });
    await asentar(page);
    for (const [sel, v] of PREPARAR[pag] || []) {
      const loc = page.locator(sel).first();
      await loc.fill(v);
      await loc.evaluate((el) => el.blur());
      await asentar(page);
    }
    // Se parte de lo que el botón deja: si la página arrancó desfasada, eso no es de ningún campo.
    t.ok(await page.evaluate(() => window.DIMENSIONADOR_ACTUALIZAR() !== false), `${pag}: el catálogo llegó y el recálculo completo corre`);
    await asentar(page);

    // Las pestañas que tengan columna de parámetros (Cisco y MikroTik llevan campos en la del BOM).
    const pestanas = await page.evaluate(() => [...window.document.querySelectorAll('[role="tab"]')]
      .map((b, i) => { b.dataset.e2ePestana = String(i); return i; }));
    const recorridos = pestanas.length ? pestanas : [null];
    let probados = 0, enLinea = 0, sinEfecto = 0;
    const malos = [];

    for (const p of recorridos) {
      if (p !== null) {
        await page.locator(`[data-e2e-pestana="${p}"]`).evaluate((b) => b.click());
        await asentar(page);
      }
      const campos = await marcarCampos(page);
      for (const campo of campos) {
        const excepcion = (EXCEPCIONES[pag] || {})[campo.id];
        // Un campo anterior puede haberlo ocultado o bloqueado (un desplegable que cambia el bloque
        // visible): se salta, igual que lo saltaría una persona.
        if (!(await usable(page, campo.n))) continue;
        const original = await valorDe(page, campo.n);
        if (!original) continue;
        let nuevo = null;
        if (campo.tipo === 'select') {
          nuevo = await page.locator(`[data-e2e-campo="${campo.n}"]`).evaluate((el) => {
            const o = [...el.options].find((x) => !x.disabled && x.value !== el.value);
            return o ? o.value : null;
          });
        } else if (campo.tipo === 'number' || campo.tipo === 'range') {
          nuevo = await otroNumero(page, campo.n);
        } else if (campo.tipo !== 'checkbox' && campo.tipo !== 'radio') {
          nuevo = `${original.value} e2e`;
        }
        if (nuevo === null && campo.tipo !== 'checkbox' && campo.tipo !== 'radio') continue;

        const a = await leerResultados(page);
        await cambiar(page, campo, nuevo);
        await asentar(page);
        const b = await leerResultados(page);
        await page.evaluate(() => window.DIMENSIONADOR_ACTUALIZAR());
        await asentar(page);
        const c = await leerResultados(page);
        probados += 1;

        if (c !== b) {
          // La primera diferencia, para que el aviso diga qué se quedó atrás.
          let i = 0;
          while (i < b.length && b[i] === c[i]) i += 1;
          const tramo = `en línea «…${b.slice(Math.max(0, i - 30), i + 50)}…» / con el botón «…${c.slice(Math.max(0, i - 30), i + 50)}…»`;
          if (excepcion) console.log(`ok - ${pag}: ${campo.nombre} no sigue en línea, declarado: ${excepcion}`);
          else malos.push(`${campo.nombre} (${campo.tipo}, ${b === a ? 'no se enteró' : 'a medias'}): ${tramo}`);
        } else if (b !== a) {
          enLinea += 1;
        } else {
          sinEfecto += 1;
        }

        // Reponer y volver al mismo escenario.
        const ahora = await valorDe(page, campo.n);
        if (ahora && JSON.stringify(ahora) !== JSON.stringify(original) && await usable(page, campo.n)) {
          if ('checked' in original) await cambiar(page, campo, null);
          else if (campo.tipo === 'select') await cambiar(page, campo, original.value);
          else await cambiar(page, campo, original.value);
        }
        await asentar(page);
        await page.evaluate(() => window.DIMENSIONADOR_ACTUALIZAR());
        await asentar(page);
      }
    }
    console.log(`RESUMEN - ${pag}: ${probados} campos probados · ${enLinea} recalculan en línea · ${sinEfecto} sin efecto en este escenario · ${malos.length} se quedan atrás`);
    t.ok(probados > 0, `${pag}: hay campos que probar`);
    for (const m of malos) t.ok(false, `${pag}: ${m}`);
    if (!malos.length) t.ok(true, `${pag}: todos los campos que mueven el resultado lo mueven en línea`);
  }

  t.ok(errores.length === 0, 'sin errores de JS' + (errores.length ? ': ' + [...new Set(errores)].slice(0, 5).join(' | ') : ''));
  await browser.close();
  process.exit(t.resumen('e2e-campos-en-linea'));
})().catch((e) => { console.error('ERROR E2E:', e.message); process.exit(2); });
