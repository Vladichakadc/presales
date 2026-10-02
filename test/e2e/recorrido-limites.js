'use strict';
/* global document, Event */
/* RECORRIDO DE VALORES LÍMITE (2026-10-02). `npm run limites`, y cada miércoles en
   `.github/workflows/limites.yml`.

   Recorre cada `public/dimensionador-*.html` —la lista sale del disco, así que un
   dimensionador nuevo entra solo— y en cada pestaña (salvo las de `PESTANAS_FUERA`):
     1. activa cada modo que un usuario puede tocar: los botones de los grupos segmentados,
        cada opción de los desplegables cortos y cada casilla;
     2. a cada campo numérico que se hace visible le mete los `VALORES` límite;
     3. tras cada acción busca lo que la pantalla no debería mostrar ni hacer (`CLASES` en
        `limites-reglas.js`): excepciones, texto del código, cantidades negativas, notación
        exponencial, cantidades del BOM que no son enteras y una página que no se asienta;
     4. y al final abre la página por enlace con cada valor de cada grupo segmentado, que es
        como reventaban Huawei y Cisco hasta el 2026-10-01.
   No compara ninguna cifra del catálogo: eso es del contraste.

   Corre con el runner de la batería (`run-e2e.js`), que levanta un servidor desechable con una
   clave de la corrida, pero NO es un `e2e-*.js`: tarda varios minutos y no hace falta en cada
   push. Escribe `.limites/resultado.json` (o `LIMITES_SALIDA`) y sale con 1 si hay hallazgos. */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { cargarPlaywright, abrirSesion, asentar, BASE } = require('./ayuda');
const R = require('./limites-reglas');

const RAIZ = path.join(__dirname, '..', '..');
const SALIDA = process.env.LIMITES_SALIDA || path.join(RAIZ, '.limites', 'resultado.json');
const PAGINAS = fs.readdirSync(path.join(RAIZ, 'public'))
  .filter((f) => /^dimensionador-.*\.html$/.test(f))
  .filter((f) => !process.env.LIMITES_SOLO || f.includes(process.env.LIMITES_SOLO))
  .sort();

function commitActual() {
  if (process.env.GITHUB_SHA) return process.env.GITHUB_SHA.slice(0, 7);
  try { return execSync('git rev-parse --short HEAD', { cwd: RAIZ }).toString().trim(); } catch { return null; }
}

(async () => {
  const t0 = Date.now();
  const { chromium } = cargarPlaywright();
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
  page.on('dialog', (d) => d.accept());

  // El mismo criterio que `verificar-pantallas.js`: cuenta lo del propio origen, y un
  // ERR_ABORTED solo se descuenta mientras ESTE script abandona la página a propósito.
  const origen = new URL(BASE).origin;
  const propio = (url) => !url || url.startsWith(origen);
  let abandonando = false;
  let pendientes = [];
  page.on('pageerror', (e) => pendientes.push({ clase: 'excepcion', fragmento: e.message }));
  page.on('console', (m) => {
    if (m.type() === 'error' && propio((m.location() || {}).url)) pendientes.push({ clase: 'consola', fragmento: m.text() });
  });
  page.on('requestfailed', (r) => {
    const motivo = (r.failure() || {}).errorText || '';
    if (abandonando && motivo.includes('ERR_ABORTED')) return;
    if (propio(r.url())) pendientes.push({ clase: 'peticion', fragmento: `${r.url().replace(origen, '')} (${motivo})` });
  });

  await abrirSesion(page);
  const crudos = [];
  let acciones = 0;
  let controles = 0;
  let pagina = '';

  const ir = async (ruta) => {
    abandonando = true;
    try { await page.goto(`${BASE}/${ruta}`, { waitUntil: 'domcontentloaded' }); } finally { abandonando = false; }
  };
  // Tras cada acción: esperar a que la página termine lo que empezó y mirar.
  const revisar = async (donde) => {
    acciones += 1;
    try { await asentar(page); } catch (e) { crudos.push({ pagina, donde, clase: 'no-asienta', fragmento: e.message }); }
    for (const p of pendientes) crudos.push({ pagina, donde, ...p });
    pendientes = [];
    const { texto, cantidades } = await page.evaluate(() => {
      const out = [];
      for (const tabla of document.querySelectorAll('table.bom-tabla')) {
        const cab = [...tabla.querySelectorAll('thead th')].map((th) => th.textContent.trim().toLowerCase());
        const i = cab.findIndex((h) => h.startsWith('cant'));
        if (i < 0) continue;
        for (const tr of tabla.querySelectorAll('tbody tr')) {
          const td = tr.children[i];
          if (!td) continue;
          const campo = td.querySelector('input');
          out.push({ valor: campo ? campo.value : td.textContent, fila: tr.textContent.replace(/\s+/g, ' ').trim().slice(0, 90) });
        }
      }
      return { texto: document.body.innerText, cantidades: out };
    });
    for (const h of R.hallazgosDeTexto(texto)) crudos.push({ pagina, donde, ...h });
    for (const c of cantidades) {
      if (!R.cantidadBomValida(c.valor)) crudos.push({ pagina, donde, clase: 'cantidad-bom', fragmento: `«${c.valor}» en: ${c.fila}` });
    }
  };
  const fijar = (id, v) => page.evaluate(({ id, v }) => {
    const el = document.getElementById(id);
    if (!el) return false;
    el.value = v;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  }, { id, v });
  const numericosVisibles = () => page.evaluate(() => [...document.querySelectorAll('input[type=number]')]
    .filter((e) => e.id && !e.disabled && (e.offsetWidth || e.offsetHeight)).map((e) => ({ id: e.id, valor: e.value })));

  for (const pag of PAGINAS) {
    pagina = pag;
    await ir(pag);
    await revisar('carga');
    const probados = new Set();
    const probarNuevos = async (contexto) => {
      for (const c of await numericosVisibles()) {
        if (probados.has(c.id)) continue;
        probados.add(c.id);
        controles += 1;
        for (const v of R.VALORES) {
          if (await fijar(c.id, v)) await revisar(`${contexto} · #${c.id}=${JSON.stringify(v)}`);
        }
        if (await fijar(c.id, c.valor)) await revisar(`${contexto} · #${c.id} restaurado`);
      }
    };
    const pestanas = await page.evaluate(() => [...document.querySelectorAll('[role=tab]')]
      .filter((b) => b.offsetWidth || b.offsetHeight)
      .map((b, i) => { b.dataset.limPestana = String(i); return b.textContent.trim().slice(0, 40); }));
    for (let t = -1; t < pestanas.length; t++) {
      let nombre = 'inicial';
      if (t >= 0) {
        nombre = pestanas[t];
        if (R.pestanaFuera(nombre)) continue;
        const boton = page.locator(`[data-lim-pestana="${t}"]`);
        if (!(await boton.isVisible())) continue;
        await boton.click();
        await revisar(`pestaña ${nombre}`);
      }
      await probarNuevos(`pestaña ${nombre}`);
      // Los modos que un usuario puede tocar en esta vista, en el estado en que esté.
      const modos = await page.evaluate(() => {
        const vis = (e) => !!(e.offsetWidth || e.offsetHeight);
        const out = [];
        document.querySelectorAll('.seg button').forEach((b, i) => {
          if (vis(b)) { b.dataset.limModo = `s${i}`; out.push({ tipo: 'boton', k: `s${i}`, n: `${b.closest('.seg').id || 'grupo'}: ${b.textContent.trim().slice(0, 24)}` }); }
        });
        document.querySelectorAll('select').forEach((s) => {
          if (s.id && vis(s) && !s.disabled && s.options.length <= 12) [...s.options].forEach((o) => out.push({ tipo: 'opcion', id: s.id, v: o.value, n: `#${s.id}=${o.value}` }));
        });
        document.querySelectorAll('input[type=checkbox]').forEach((c, i) => {
          if (!c.disabled && !c.checked && (vis(c) || (c.labels && c.labels[0] && vis(c.labels[0])))) {
            c.dataset.limModo = `c${i}`; out.push({ tipo: 'casilla', k: `c${i}`, n: `casilla ${c.id || i}` });
          }
        });
        return out;
      });
      for (const m of modos) {
        if (m.tipo === 'opcion') {
          if (!(await fijar(m.id, m.v))) continue;
        } else {
          const ok = await page.evaluate(({ k, tipo }) => {
            const el = document.querySelector(`[data-lim-modo="${k}"]`);
            if (!el || (tipo === 'casilla' && el.checked) || !(el.offsetWidth || el.offsetHeight || (el.labels && el.labels[0]))) return false;
            el.click();
            return true;
          }, m);
          if (!ok) continue;
        }
        await revisar(`pestaña ${nombre} · ${m.n}`);
        await probarNuevos(`pestaña ${nombre} · ${m.n}`);
      }
    }
    // Enlaces con cada modo en la URL: un enlace compartido repone los grupos con un click
    // sintético que llega antes que el catálogo.
    const grupos = await page.evaluate(() => [...document.querySelectorAll('.seg[id]')]
      .map((g) => ({ id: g.id, vals: [...g.querySelectorAll('button[data-v]')].map((b) => b.dataset.v) })));
    for (const g of grupos) {
      for (const v of g.vals) {
        await ir(`${pag}?bw=500&${g.id}=${encodeURIComponent(v)}`);
        await revisar(`enlace ?${g.id}=${v}`);
      }
    }
    console.log(`[limites] ${pag}: ${probados.size} campo(s) numérico(s), ${grupos.reduce((n, g) => n + g.vals.length, 0)} enlace(s)`);
  }
  await browser.close();

  const { hallazgos, exceptuados } = R.depurar(crudos);
  const resultado = {
    fecha: new Date().toISOString().slice(0, 10),
    commit: commitActual(),
    duracionS: Math.round((Date.now() - t0) / 1000),
    paginas: PAGINAS, controles, acciones, exceptuados,
    pestanasFuera: R.PESTANAS_FUERA.map((p) => ({ patron: String(p.patron), porQue: p.porQue })),
    hallazgos,
  };
  fs.mkdirSync(path.dirname(SALIDA), { recursive: true });
  fs.writeFileSync(SALIDA, JSON.stringify(resultado, null, 2) + '\n');

  console.log(`\n[limites] ${PAGINAS.length} dimensionadores · ${controles} campos numéricos · ${acciones} acciones · ${resultado.duracionS} s`
    + (exceptuados ? ` · ${exceptuados} exceptuado(s)` : ''));
  if (!hallazgos.length) {
    console.log('[limites] RESULTADO: SIN HALLAZGOS');
    return;
  }
  for (const h of hallazgos) console.log(`FALLO - [${h.pagina}] ${R.CLASES[h.clase] || h.clase} · ${h.donde}${R.veces(h)} — «${h.fragmento}»`);
  console.log(`\n[limites] RESULTADO: ${hallazgos.length} HALLAZGO(S) — ${SALIDA}`);
  process.exitCode = 1;
})().catch((e) => { console.error('[limites] el recorrido no terminó:', e); process.exit(2); });
