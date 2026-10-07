'use strict';
/* global document, window, MutationObserver */
/* E2E «lector virtual» (2026-10-07): el guion de la prueba con lector de pantalla
   (docs/decisiones-del-dueno-2026-09-24.md, sección 4), recorrido sobre el ÁRBOL DE
   ACCESIBILIDAD que Chromium entrega a NVDA y a VoiceOver.

   El dueño aprobó la prueba con un lector real, y en este entorno no hay ninguno. Esto es lo más
   cerca que se llega sin una persona: lo que un lector lee —rol, nombre accesible, descripción,
   estado, posición en el grupo— y lo que una región viva anuncia al cambiar, sacado por el
   protocolo de depuración (Accessibility.getPartialAXTree / getFullAXTree), no deducido del HTML.
   Por cada tarea imprime la frase literal que compondría un lector, y comprueba lo que el guion
   dice que debería oírse. Lo que NO sustituye, y se dice: si esa frase se entiende al oírla, y el
   orden real de lectura de un lector concreto. Eso sigue siendo de una persona.

   T6 (bloqueo de SSL-VPN y «Cambiar a IPsec») y T10 (zoom al 200 %) no se repiten aquí: los
   cubren e2e-fortinet-ssl y e2e-accesibilidad. */
const { cargarPlaywright, abrirSesion, BASE, asentar, trasNavegar, contador } = require('./ayuda');

const ROL = {
  textbox: 'edición', spinbutton: 'número', combobox: 'cuadro combinado', checkbox: 'casilla',
  radio: 'botón de opción', button: 'botón', tab: 'pestaña', link: 'enlace', heading: 'encabezado',
  table: 'tabla', columnheader: 'encabezado de columna', img: 'gráfico', image: 'gráfico', alert: 'alerta',
  status: 'estado', navigation: 'navegación', tabpanel: 'panel de pestaña',
};

const prop = (n, k) => { const p = (n.properties || []).find((x) => x.name === k); return p ? p.value.value : undefined; };
// La frase que compondría un lector: nombre, rol, estados y posición.
function frase(n, extra = '') {
  const partes = [n.name && n.name.value, ROL[n.role.value] || n.role.value];
  if (prop(n, 'level')) partes.push(`nivel ${prop(n, 'level')}`);
  if (prop(n, 'selected')) partes.push('seleccionada');
  if (prop(n, 'disabled')) partes.push('no disponible');
  if (n.description && n.description.value) partes.push(n.description.value);
  if (extra) partes.push(extra);
  return partes.filter(Boolean).join(', ');
}

async function ax(cdp, selector) {
  const { root } = await cdp.send('DOM.getDocument', { depth: 0 });
  const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector });
  if (!nodeId) return null;
  const { nodes } = await cdp.send('Accessibility.getPartialAXTree', { nodeId, fetchRelatives: false });
  return nodes.find((n) => !n.ignored) || nodes[0];
}
async function arbol(cdp) {
  const { nodes } = await cdp.send('Accessibility.getFullAXTree');
  return nodes.filter((n) => !n.ignored);
}

// Lo que anuncian las regiones vivas desde ahora: cada cambio de texto de un [aria-live],
// [role=status] o [role=alert] queda apuntado, como lo recibiría un lector.
async function escucharAnuncios(page) {
  await page.evaluate(() => {
    window.__anuncios = [];
    const vivas = document.querySelectorAll('[aria-live],[role=status],[role=alert]');
    const obs = new MutationObserver((ms) => {
      for (const m of ms) {
        const r = m.target.nodeType === 1 ? m.target.closest('[aria-live],[role=status],[role=alert]') : m.target.parentElement && m.target.parentElement.closest('[aria-live],[role=status],[role=alert]');
        const t = r && r.textContent.replace(/\s+/g, ' ').trim();
        if (t && window.__anuncios[window.__anuncios.length - 1] !== t) window.__anuncios.push(t);
      }
    });
    vivas.forEach((v) => obs.observe(v, { childList: true, subtree: true, characterData: true }));
  });
}
const anuncios = (page) => page.evaluate(() => window.__anuncios || []);

(async () => {
  const { chromium } = cargarPlaywright();
  const browser = await chromium.launch();
  const t = contador();
  const oido = (tarea, f) => console.log(`  ${tarea} se oiría: «${f}»`);

  // ── T1 · acceso con una clave mal escrita ─────────────────────────────────────────────────
  {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    const cdp = await ctx.newCDPSession(page);
    await page.goto(`${BASE}/login`);
    for (const [sel, nombre] of [['#usuario', 'Usuario'], ['#password', 'Contraseña']]) {
      const n = await ax(cdp, sel);
      oido('T1', frase(n));
      t.ok(n && n.name.value === nombre, `T1: ${sel} anuncia su etiqueta «${nombre}»`);
    }
    await escucharAnuncios(page);
    await page.fill('#usuario', 'presales');
    await page.fill('#password', 'esta-no-es');
    await page.click('#btn');
    await page.waitForFunction(() => (document.getElementById('aviso').textContent || '').trim().length > 0, null, { timeout: 15000 });
    const aviso = await ax(cdp, '#aviso');
    const oidos = await anuncios(page);
    oido('T1', oidos[oidos.length - 1] || '(nada)');
    t.ok(aviso && aviso.role.value === 'alert', `T1: el aviso de error es una alerta, que el lector anuncia sin mover el foco (${aviso && aviso.role.value})`);
    t.ok(oidos.length > 0, 'T1: el error llega a una región viva');
    const foco = await page.evaluate(() => document.activeElement && document.activeElement.id);
    t.ok(foco && foco !== '', `T1: el foco no se pierde en la página (${foco})`);
    await ctx.close();
  }

  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await abrirSesion(page);
  const cdp = await page.context().newCDPSession(page);

  // ── T2 · portal: encabezados en orden y barra de fabricante ───────────────────────────────
  {
    await trasNavegar(page, () => page.goto(`${BASE}/dimensionador-fortinet-fortigate.html`));
    await asentar(page);
    const nodos = await arbol(cdp);
    const niveles = nodos.filter((n) => n.role.value === 'heading').map((n) => prop(n, 'level'));
    const saltos = niveles.filter((l, i) => i > 0 && l - niveles[i - 1] > 1);
    t.ok(niveles[0] === 1 && saltos.length === 0, `T2: encabezados sin saltos de nivel (${niveles.join(' ')})`);
    const nav = await ax(cdp, '.navfab');
    const conteo = await page.textContent('.navfab-conteo');
    const actual = await ax(cdp, '.navfab-paso.aqui');
    // `aria-current` llega a NVDA y a VoiceOver por las API de accesibilidad del sistema, pero el
    // protocolo de depuración no lo lista entre las propiedades del nodo: se lee del atributo.
    const enCurso = await page.getAttribute('.navfab-paso.aqui', 'aria-current');
    oido('T2', `${frase(nav)}… ${frase(actual, enCurso ? 'actual' : '')}… ${conteo}`);
    t.ok(nav && /fabricante/i.test(nav.name.value), 'T2: la barra es una navegación con nombre');
    t.ok(/^\d+ \/ 7$/.test((conteo || '').trim()), `T2: la barra dice el paso del recorrido («${conteo}»)`);
    t.ok(actual && enCurso === 'step', `T2: el paso actual se anuncia como actual (aria-current=${enCurso})`);
  }

  // ── T3 · dimensionador Fortinet: etiquetas y anuncio de la recomendación ──────────────────
  {
    const nodos = await arbol(cdp);
    const controles = nodos.filter((n) => ['textbox', 'spinbutton', 'combobox', 'checkbox', 'radio'].includes(n.role.value));
    const mudos = controles.filter((n) => !(n.name && n.name.value && n.name.value.trim()));
    t.ok(controles.length > 10 && mudos.length === 0, `T3: los ${controles.length} controles visibles tienen etiqueta (${mudos.length} sin nombre)`);
    await escucharAnuncios(page);
    await page.fill('#wanBuilderFilas .wan-fila input[data-campo=down]', '2500');
    await page.press('#wanBuilderFilas .wan-fila input[data-campo=down]', 'Tab');
    await asentar(page);
    const oidos = await anuncios(page);
    const reco = oidos.find((x) => /FortiGate/.test(x));
    oido('T3', reco || '(nada)');
    t.ok(!!reco, 'T3: al cambiar el caudal, la región viva anuncia la recomendación nueva');
  }

  // ── T4 y T5 · pestañas del resultado y gráfico de utilización ─────────────────────────────
  {
    const pestanas = (await arbol(cdp)).filter((n) => n.role.value === 'tab');
    const seleccionadas = pestanas.filter((n) => prop(n, 'selected'));
    const enGrupo = await page.$$eval('[role=tablist][aria-label="Secciones del dimensionador"] [role=tab]', (ts) => ts.length);
    oido('T4', frase(pestanas[0], `1 de ${enGrupo}`));
    t.ok(pestanas.length >= 5 && pestanas.every((n) => n.name && n.name.value), `T4: ${pestanas.length} pestañas, todas con nombre`);
    t.ok(seleccionadas.length >= 1, 'T4: una pestaña se anuncia seleccionada');
    await page.click('#rtab-graf');
    await asentar(page);
    const graf = await ax(cdp, '[role=img][aria-labelledby=trackLbl]');
    oido('T5', graf ? frase(graf) : '(nada)');
    t.ok(graf && graf.name.value && graf.description && graf.description.value, 'T5: el gráfico tiene nombre y descripción');
  }

  // ── T7 · lista de materiales: encabezados de columna y botones no disponibles ─────────────
  {
    await page.click('#tab-bom');
    await asentar(page);
    const nodos = await arbol(cdp);
    const cabeceras = nodos.filter((n) => n.role.value === 'columnheader');
    t.ok(cabeceras.length >= 3, `T7: la tabla del BOM anuncia ${cabeceras.length} encabezados de columna`);
    const apagados = nodos.filter((n) => n.role.value === 'button' && prop(n, 'disabled'));
    for (const b of apagados) oido('T7', frase(b));
    const sinMotivo = apagados.filter((b) => !(b.description && b.description.value));
    t.ok(sinMotivo.length === 0, `T7: un botón no disponible dice por qué (${sinMotivo.map((b) => b.name.value).join(', ') || 'todos lo dicen'})`);
  }

  // ── T8 · Aruba: añadir un enlace en el Multi-Underlay Builder ─────────────────────────────
  {
    await trasNavegar(page, () => page.goto(`${BASE}/dimensionador-aruba-edgeconnect.html`));
    await asentar(page);
    await escucharAnuncios(page);
    const antes = await page.locator('#wanBuilderFilas .wan-fila').count();
    await page.click('#btnAddWan');
    await asentar(page);
    const filas = page.locator('#wanBuilderFilas .wan-fila');
    t.ok(await filas.count() === antes + 1, 'T8: la fila nueva aparece');
    const ultima = antes + 1;
    const mudos = [];
    for (const campo of await filas.nth(antes).locator('input, select').all()) {
      const id = await campo.evaluate((e) => { if (!e.id) e.id = `lector-${Math.random().toString(36).slice(2)}`; return e.id; });
      const n = await ax(cdp, `#${id}`);
      if (!(n && n.name && n.name.value)) mudos.push(id);
    }
    t.ok(mudos.length === 0, `T8: los campos de la fila ${ultima} tienen etiqueta (${mudos.length} sin nombre)`);
    const oidos = await anuncios(page);
    oido('T8', oidos[oidos.length - 1] || '(nada)');
    t.ok(oidos.some((x) => new RegExp(`enlace ${ultima}`, 'i').test(x)), 'T8: la fila nueva se anuncia');
  }

  // ── T9 · cotizador: añadir un equipo y oír el total ───────────────────────────────────────
  {
    await trasNavegar(page, () => page.goto(`${BASE}/cotizador.html`));
    await asentar(page);
    await escucharAnuncios(page);
    await page.click('.cat-add');
    await asentar(page);
    const oidos = await anuncios(page);
    const dicho = oidos.find((x) => /Añadido .+ total de referencia/.test(x));
    oido('T9', dicho || '(nada)');
    t.ok(!!dicho, 'T9: al añadir un equipo se anuncia la línea y el total nuevo');
  }

  await browser.close();
  process.exit(t.resumen('e2e-lector-virtual'));
})().catch((e) => { console.error('ERROR E2E:', e.message); process.exit(2); });
