'use strict';
/* global document */
/* E2E de entradas límite en los dimensionadores (2026-10-01). Nació de recorrer las nueve
   pantallas con valores límite en cada control: cuatro errores que ninguna batería veía.
   (1) Con -5 Mbps, Huawei decía «Requiere -13 Mbps» y recomendaba un AR5710: solo trataba el 0
   como «sin datos». (2) Nokia 7750 SR hacía lo mismo («Requerimiento -6 Gbps») y además, con
   el formulario VACÍO, recomendaba el 7250 IXR-e con catorce «equipos que cumplen». (3) La
   pestaña «Catálogo» de Huawei pintaba el texto «null» en los puertos LAN de cuatro modelos.
   (4) La lista de materiales de Aruba decía «precio null» en una nota para el cliente.
   (5) En modo agregado multi-sede, -5 sedes daban un requerimiento negativo en Huawei y Cisco
   («-13000 Mbps», «-5 túneles IPsec»): se leen como una sede. (6) Y al probar esos enlaces
   salió el más grave: cualquier enlace compartido con un modo en la URL (`modeSeg`, `platSeg`,
   `dirSeg`, `critSeg`) lanzaba una excepción en Huawei y Cisco, porque el BOM se pintaba
   antes de que llegara el catálogo.
   La regla que se fija es la de los demás dimensionadores: sin caudal (o con uno negativo) no
   se recomienda nada y la pantalla pide los valores; y ningún texto interno del código
   («null», «undefined», «NaN») llega a una pestaña que lee el usuario. */
const { cargarPlaywright, abrirSesion, asentar, BASE, contador } = require('./ayuda');

// Los cinco con un campo de caudal único (#bw). Fortinet y Aruba lo derivan de su builder.
const CON_BW = [
  'dimensionador-huawei-netengine.html', 'dimensionador-cisco-catalyst8k.html',
  'dimensionador-mikrotik-routeros.html', 'dimensionador-juniper-srx.html',
  'dimensionador-nokia-7750sr.html',
];
const TODOS = CON_BW.concat([
  'dimensionador-fortinet-fortigate.html', 'dimensionador-aruba-edgeconnect.html',
  'dimensionador-nokia-7220ixr.html', 'dimensionador-starlink-leo.html',
]);
// Un escenario con precio en cada página: el pie de la lista de materiales (CAPEX, OPEX, TCO y
// su nota) solo se pinta cuando hay líneas con precio, y ahí vivía el «precio null» de Aruba.
const ARUBA_CON_PRECIO = '?famSeg=ec&users=30&wanLinksData=' + encodeURIComponent(JSON.stringify(
  { v: 2, wanLinks: [{ id: 1, tipo: 'DIA', medio: 'RJ45', down: 100, up: 100, simetrico: true }] }));
const escenario = (pag) => (CON_BW.includes(pag) ? `${pag}?bw=2500`
  : pag === 'dimensionador-aruba-edgeconnect.html' ? pag + ARUBA_CON_PRECIO : pag);
const TEXTO_DE_CODIGO = /\b(?:null|undefined|NaN|Infinity)\b|\[object Object\]/;
const CAUDAL_NEGATIVO = /(?<![\w\-/.:°])-\d[\d.,]*\s?(?:Mbps|Gbps|Tbps)/;

(async () => {
  const { chromium } = cargarPlaywright();
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errores = [];
  page.on('pageerror', (e) => errores.push(e.message));
  const t = contador();
  await abrirSesion(page);

  const abrir = async (ruta) => {
    await page.goto(BASE + '/' + ruta, { waitUntil: 'domcontentloaded' });
    await asentar(page);
  };
  const veredicto = () => page.evaluate(() => ({
    elegido: !!document.getElementById('verdict-sel'),
    texto: (document.getElementById('verdict') || document.body).innerText.replace(/\s+/g, ' '),
    pagina: document.body.innerText,
  }));

  // ── Un caudal negativo no se dimensiona: se lee como «sin caudal» ─────────────────────
  for (const pag of CON_BW) {
    await abrir(`${pag}?bw=-5`);
    const v = await veredicto();
    t.ok(!v.elegido && /Ingrese valores para recomendar un equipo/i.test(v.texto),
      `${pag} · -5 de caudal no recomienda ningún equipo y pide los valores`);
    const neg = v.pagina.match(CAUDAL_NEGATIVO);
    t.ok(!neg, `${pag} · ningún caudal negativo en pantalla${neg ? ` (aparece «${neg[0]}»)` : ''}`);
  }

  // ── Agregado multi-sede con sedes negativas: cuenta como una sede, nunca resta ──────────
  // Encontrado al recorrer los modos: Cisco dimensionaba contra «-13000 Mbps» y Huawei pedía
  // «-5 túneles IPsec».
  for (const pag of ['dimensionador-huawei-netengine.html', 'dimensionador-cisco-catalyst8k.html']) {
    await abrir(`${pag}?bw=500&modeSeg=agg&sites=-5`);
    const v = await veredicto();
    const neg = v.pagina.match(CAUDAL_NEGATIVO) || v.pagina.match(/-\d+ (?:sedes|túneles)/);
    t.ok(!neg, `${pag} · -5 sedes en modo agregado no da cifras negativas${neg ? ` (aparece «${neg[0]}»)` : ''}`);
    t.ok(v.elegido, `${pag} · -5 sedes se leen como una y hay recomendación`);
  }

  // ── Nokia 7750 SR: el formulario vacío no recomienda; los puertos solos sí dimensionan ─
  {
    await abrir('dimensionador-nokia-7750sr.html');
    const vacio = await veredicto();
    t.ok(!vacio.elegido && /Ingrese valores para recomendar un equipo/i.test(vacio.texto),
      'Nokia 7750 SR · sin caudal ni puertos no recomienda ningún equipo');
    await abrir('dimensionador-nokia-7750sr.html?portQty=4');
    const puertos = await veredicto();
    t.ok(puertos.elegido, 'Nokia 7750 SR · con solo puertos pedidos sí hay recomendación (la densidad dimensiona)');
  }

  // ── Huawei: los modelos sin puertos LAN publicados salen con «—», no con «null» ────────
  {
    await abrir('dimensionador-huawei-netengine.html?bw=500');
    await page.click('[data-tab="cat"]');
    await asentar(page);
    const tabla = await page.evaluate(() => document.getElementById('tbl-hw-ar-cat').innerText);
    const fila = await page.evaluate(() => {
      const tr = [...document.querySelectorAll('#tbl-hw-ar-cat tbody tr')].find((r) => r.textContent.includes('AR8700-8'));
      return tr ? tr.children[5].textContent.trim() : null;
    });
    t.ok(!/\bnull\b/.test(tabla), 'Huawei · la tabla del catálogo AR no contiene «null»');
    t.ok(fila === '—', `Huawei · el AR8700-8 (sin puertos LAN en el catálogo) muestra «—» (muestra «${fila}»)`);
  }

  // ── Ningún texto interno del código en las pestañas que lee el usuario ─────────────────
  // La pestaña «Fuentes» queda fuera a propósito: sus notas de procedencia citan campos del
  // catálogo tal cual (`sdwan: null`), y esa cita es deliberada.
  for (const pag of TODOS) {
    await abrir(escenario(pag));
    const pestanas = await page.evaluate(() => [...document.querySelectorAll('[role=tab]')]
      .filter((b) => (b.offsetWidth || b.offsetHeight) && !/fuentes/i.test(b.textContent))
      .map((b, i) => { b.dataset.e2eLimite = String(i); return b.textContent.trim(); }));
    const leidas = [['(inicial)', await page.evaluate(() => document.body.innerText)]];
    for (let i = 0; i < pestanas.length; i++) {
      // Una subpestaña de un panel que la pestaña anterior escondió no se puede pulsar ahora.
      const boton = page.locator(`[data-e2e-limite="${i}"]`);
      if (!(await boton.isVisible())) continue;
      await boton.click();
      await asentar(page);
      leidas.push([pestanas[i], await page.evaluate(() => document.body.innerText)]);
    }
    const malas = leidas.filter(([, texto]) => TEXTO_DE_CODIGO.test(texto))
      .map(([n, texto]) => {
        const m = texto.match(TEXTO_DE_CODIGO);
        return `${n}: «…${texto.slice(Math.max(0, m.index - 50), m.index + 20).replace(/\s+/g, ' ')}…»`;
      });
    t.ok(!malas.length, `${pag} · sin «null/undefined/NaN» en ${leidas.length} vista(s)${malas.length ? ' — ' + malas.join(' | ') : ''}`);
  }

  // ── Un enlace compartido con cualquier modo abre sin excepciones ───────────────────────
  // El enlace repone los grupos segmentados con un click sintético que llega ANTES que el
  // catálogo: en Huawei y Cisco ese click pintaba el BOM con la lista de modelos vacía y
  // reventaba («reading 'id'») con CUALQUIER modo en la URL — 15 de 60 enlaces.
  for (const pag of TODOS.filter((p) => p !== 'dimensionador-starlink-leo.html')) {
    await abrir(pag);
    const grupos = await page.evaluate(() => [...document.querySelectorAll('.seg[id]')]
      .map((g) => ({ id: g.id, vals: [...g.querySelectorAll('button[data-v]')].map((x) => x.dataset.v) })));
    const rotos = [];
    let enlaces = 0;
    for (const g of grupos) {
      for (const v of g.vals) {
        const antes = errores.length;
        await abrir(`${pag}?bw=500&${g.id}=${encodeURIComponent(v)}`);
        enlaces += 1;
        if (errores.length > antes) rotos.push(`${g.id}=${v}: ${errores[errores.length - 1]}`);
        errores.length = antes;
      }
    }
    t.ok(!rotos.length, `${pag} · ${enlaces} enlace(s) con un modo en la URL abren sin excepciones${rotos.length ? ' — ' + rotos.slice(0, 3).join(' | ') : ''}`);
  }

  // ── Aruba: la nota del pie de la lista de materiales habla en español, no en código ────
  {
    await abrir(escenario('dimensionador-aruba-edgeconnect.html'));
    await page.click('[data-tab="bom"]');
    await asentar(page);
    const pie = await page.evaluate(() => (document.getElementById('tcoFin') || {}).innerText || '');
    t.ok(/HPE Aruba SSE \(sin precio en la lista/.test(pie),
      `Aruba · el pie de la lista de materiales nombra la SSE sin precio en español («${pie.slice(pie.indexOf('SSE') - 10, pie.indexOf('SSE') + 50)}»)`);
  }

  t.ok(!errores.length, `sin excepciones de página${errores.length ? ': ' + errores.slice(0, 3).join(' | ') : ''}`);
  await browser.close();
  t.resumen('e2e-entradas-limite');
})().catch((e) => { console.error(e); process.exit(1); });
