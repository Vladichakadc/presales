'use strict';
/* E2E del rol activo/respaldo en el Multi-Underlay Builder de Aruba (2026-09-24): R11 de la
   auditoría de Fortinet y M9 de la de Aruba, más el aviso M1 corregido.

   Un 4G de respaldo sumaba al caudal del sitio y al tier de la suscripción: con DIA 1000 +
   4G 200 la propuesta salía con Foundation «sin límite de caudal» y $80.857, cuando el
   respaldo solo lleva tráfico si cae el DIA. Aquí se conduce la pantalla de verdad: el
   control de la fila, el tier, la barra resumen, el aviso de continuidad parcial, el enlace
   compartido (ida y vuelta) y que un enlace ANTIGUO, sin rol, se lee como todos activos. */
const { cargarPlaywright, abrirDimensionador, BASE, asentar, contador } = require('./ayuda');

const URL_DIM = BASE + '/dimensionador-aruba-edgeconnect.html';
function enlace(p) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(p)) q.set(k, typeof v === 'object' ? JSON.stringify(v) : String(v));
  return URL_DIM + '?' + q.toString();
}
const wan = (...links) => ({ v: 2, wanLinks: links.map((l, i) => ({ id: i + 1, medio: 'RJ45', up: l.down, simetrico: true, ...l })) });

(async () => {
  const { chromium } = cargarPlaywright();
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on('dialog', (d) => d.accept());
  const errores = [];
  page.on('pageerror', (e) => errores.push(e.message));
  const t = contador();
  await abrirDimensionador(page);

  const leer = async () => ({
    pick: await page.inputValue('#pickModel'),
    tier: await page.$eval('#selTier', (s) => s.options[0].textContent),
    resumen: (await page.textContent('#wanResumen')) || '',
    bom: await page.inputValue('#bomOut'),
  });
  const cargar = async (p) => {
    await page.goto(enlace(p), { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#users', { timeout: 20000 });
    await asentar(page);
    return leer();
  };

  // ── Enlace antiguo, sin rol: los dos enlaces suman (lo de siempre) ──────────
  const antiguo = await cargar({ chkBoost: 1, wanLinksData: wan({ tipo: 'DIA', down: 1000 }, { tipo: '4G/5G', down: 200 }) });
  t.ok(/Sin límite de caudal/.test(antiguo.tier), `sin rol, los dos suman y el tier es «sin límite» (${antiguo.tier.trim()})`);
  const selRol = await page.$$eval('#wanBuilderFilas [data-campo=rol]', (ss) => ss.map((s) => s.value));
  t.ok(selRol.length === 2 && selRol.every((v) => v === 'activo'), `un enlace sin rol se pinta como activo (${selRol.join(', ')})`);

  // ── Se marca el 4G como respaldo desde la fila, como lo haría una persona ────
  await page.selectOption('#wanBuilderFilas .wan-fila >> nth=1 >> [data-campo=rol]', 'respaldo');
  await asentar(page);
  const conResp = await leer();
  t.ok(/1 Gbps/.test(conResp.tier) && !/Sin límite/.test(conResp.tier), `con el 4G de respaldo el tier baja a 1 Gbps (${conResp.tier.trim()})`);
  t.ok(/Σ 1000 Mbps/.test(conResp.resumen), 'la barra resumen suma solo el activo (Σ 1000 Mbps)');
  t.ok(/1 de respaldo \(200 Mbps\), fuera de la operación normal/.test(conResp.resumen), 'la barra resumen declara el respaldo aparte');
  t.ok(/Puertos WAN: 2/.test(conResp.resumen), 'el respaldo sigue ocupando su puerto');
  const msg = await page.textContent('#wanBuilderFilas .wan-fila >> nth=1 >> [data-wan-msg]');
  t.ok(/Respaldo: no suma al caudal ni al tier/.test(msg || ''), 'la fila de respaldo explica qué hace');
  t.ok(/Continuidad parcial: si cae el enlace 1 \(/.test(conResp.bom),
    'la revisión del diseño declara la continuidad parcial (el 4G no cubre el DIA entero)');
  t.ok(/RESPALDO \(entra si cae un activo/.test(conResp.bom), 'el texto exportable marca el enlace de respaldo');
  // 30 % de los túneles: con los dos sumando, 0,3 × 1.200 = 360 → 108 Mbps → 2 bloques; con el
  // 4G de respaldo, 0,3 × 1.000 = 300 → 90 Mbps → 1 bloque.
  const bAntes = /(\d+) x\s+EdgeConnect Boost/.exec(antiguo.bom), bDespues = /(\d+) x\s+EdgeConnect Boost/.exec(conResp.bom);
  t.ok(bAntes && bAntes[1] === '2' && bDespues && bDespues[1] === '1',
    `el Boost deja de contar el tráfico del respaldo (${bAntes ? bAntes[1] : '—'} → ${bDespues ? bDespues[1] : '—'} bloques)`);

  // ── El enlace compartido lleva el rol, y SOLO cuando es respaldo ─────────────
  const url = page.url();
  const datos = JSON.parse(new URL(url).searchParams.get('wanLinksData') || '{}');
  const roles = (datos.wanLinks || []).map((l) => l.rol || '(sin rol)');
  t.ok(roles[0] === '(sin rol)' && roles[1] === 'respaldo', `el activo viaja sin rol y el respaldo con él (${roles.join(', ')})`);
  const vuelta = await cargar({ chkBoost: 1, wanLinksData: datos });
  t.ok(vuelta.tier === conResp.tier && vuelta.pick === conResp.pick, `ida y vuelta: el enlace reproduce el mismo tier y equipo (${vuelta.pick})`);
  const rolesVuelta = await page.$$eval('#wanBuilderFilas [data-campo=rol]', (ss) => ss.map((s) => s.value));
  t.ok(rolesVuelta.join(',') === 'activo,respaldo', `ida y vuelta: los roles se reponen en las filas (${rolesVuelta.join(', ')})`);

  // ── Solo respaldos: la fila lo dice ──────────────────────────────────────────
  await cargar({ wanLinksData: wan({ tipo: '4G/5G', down: 100, rol: 'respaldo' }) });
  const soloMsg = await page.textContent('#wanBuilderFilas .wan-fila >> nth=0 >> [data-wan-msg]');
  t.ok(/Ningún enlace está marcado como activo/.test(soloMsg || ''), 'sin activos, la fila pide marcar uno');

  // ── HA: un respaldo de 5 Gbps no dispara la regla de par HA ─────────────────
  const ha = await cargar({ wanLinksData: wan({ tipo: 'DIA', down: 5000 }, { tipo: 'DIA', down: 5000, rol: 'respaldo' }) });
  t.ok(!(await page.isChecked('#chkHa')), 'con un solo activo de 5 Gbps la regla HA (≥2 enlaces activos) no pre-marca el par');
  t.ok(ha.pick, `sigue habiendo recomendación (${ha.pick})`);

  // ── M1: con margen y enlaces holgados ya no salta «el underlay no sostiene» ──
  const m1 = await cargar({ users: 100, perUser: 2, wanLinksData: wan({ tipo: 'DIA', down: 1000 }) });
  t.ok(!/no sostiene la demanda/.test(m1.bom), 'M1: 200 Mbps de demanda sobre 1 Gbps de enlace no dispara el aviso (antes saltaba por el margen)');
  const m1b = await cargar({ users: 400, perUser: 5, wanLinksData: wan({ tipo: 'DIA', down: 1000 }) });
  t.ok(/no sostiene la demanda/.test(m1b.bom), 'M1: 2 Gbps de demanda sobre 1 Gbps de enlace sí lo dispara');

  // ── Boost: el escenario que más túnel pide, no siempre la operación normal ───
  // Con breakout, el túnel es el 30 % del caudal mientras quede Internet. Si cae el DIA y lo
  // recoge un MPLS de respaldo, no queda Internet y el túnel lleva los 1.000 Mbps: 300 de
  // Boost (3 bloques) y no 90 (1 bloque). Un 4G de respaldo no cambia nada: recoge el
  // tráfico por Internet y el breakout sigue descargando.
  const bloquesDe = (bom) => { const x = /(\d+) x\s+EdgeConnect Boost/.exec(bom); return x ? x[1] : null; };
  const bMpls = await cargar({ famSeg: 'ec', chkBoost: 1, users: 100, perUser: 2,
    wanLinksData: wan({ tipo: 'MPLS L3', down: 500 }, { tipo: 'DIA', down: 500 }, { tipo: 'MPLS L2', down: 500, rol: 'respaldo' }) });
  const vMpls = (await page.textContent('#verdict')) || '';
  t.ok(bloquesDe(bMpls.bom) === '3', `Boost con un MPLS de respaldo del DIA: 3 bloques por la falla (${bloquesDe(bMpls.bom)})`);
  t.ok(/si cae el enlace 2/.test(vMpls), 'la ficha dice qué escenario gobierna el Boost');
  const b4g = await cargar({ famSeg: 'ec', chkBoost: 1, users: 100, perUser: 2,
    wanLinksData: wan({ tipo: 'MPLS L3', down: 500 }, { tipo: 'DIA', down: 500 }, { tipo: '4G/5G', down: 500, rol: 'respaldo' }) });
  t.ok(bloquesDe(b4g.bom) === '1', `Boost con un 4G de respaldo: la operación normal, 1 bloque (${bloquesDe(b4g.bom)})`);

  t.ok(errores.length === 0, 'sin errores de JavaScript en la página' + (errores.length ? ': ' + errores.join(' | ') : ''));
  await browser.close();
  process.exit(t.resumen('e2e-aruba-respaldo'));
})().catch((e) => { console.error(e); process.exit(1); });
