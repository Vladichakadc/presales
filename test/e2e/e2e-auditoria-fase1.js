'use strict';
/* E2E de la fase 1 de la auditoría técnica del 2026-09-17 («Auditoría técnica —
   Dimensionador Aruba»). Reproduce en el navegador real los escenarios con los que se
   encontraron los cinco hallazgos críticos y el A1, y fija el resultado corregido en la
   pantalla y en la lista de materiales. Cada escenario entra por el ENLACE del escenario
   (querystring), que es como un preventa se lo pasa a otro: así se prueba también que el
   selector de sistema operativo viaja en la URL. */
const { cargarPlaywright, abrirDimensionador, BASE, contador } = require('./ayuda');

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

  const cargar = async (p) => {
    await page.goto(enlace(p), { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#users', { timeout: 20000 });
    await page.waitForTimeout(1500);
    return {
      pick: await page.inputValue('#pickModel'),
      bom: await page.inputValue('#bomOut'),
      verdict: (await page.textContent('#verdict')) || '',
    };
  };

  // ── C1 · Escenario A: DIA 100 + 4G 50/20, 30 usuarios ───────────────────────
  {
    const r = await cargar({ famSeg: 'ec', users: 30, perUser: 2,
      wanLinksData: wan({ tipo: 'DIA', down: 100 }, { tipo: '4G/5G', down: 50, up: 20, simetrico: false }) });
    t.ok(r.pick === 'EC-10104', `A: recomienda EC-10104 (${r.pick})`);
    t.ok(/EdgeConnect Foundation — 1 Gbps\s+S1A\d{2}AAS/.test(r.bom),
      'A: la suscripción es Foundation 1 Gbps con SKU y precio (antes «Foundation 200 Mbps» en consultar)');
    t.ok(!/Foundation — (20|50|200|500) Mbps|Foundation — 2 Gbps/.test(r.bom),
      'A: ningún tier Foundation inexistente en la lista de materiales');
    t.ok(/TOTAL DE REFERENCIA/.test(r.bom), 'A: el total ya incluye la suscripción (sin líneas pendientes)');
  }

  // ── C1 + A1 · Escenario D: banda ancha 40/10, 8 usuarios, DTD ──────────────
  {
    const r = await cargar({ famSeg: 'ec', users: 8, perUser: 2, selSeguridad: 'dtd',
      wanLinksData: wan({ tipo: 'Banda Ancha', down: 40, up: 10, simetrico: false }) });
    t.ok(r.pick && r.pick !== 'EC-XS', `D: con DTD ya no recomienda EC-XS (${r.pick})`);
    t.ok(/EdgeConnect Foundation — 100 Mbps\s+S1C\d{2}AAS/.test(r.bom), 'D: Foundation 100 Mbps con SKU (antes «Foundation 50 Mbps»)');
    t.ok(/Dynamic Threat Defense/.test(r.bom) && !/\[ROJO\] Dynamic Threat Defense/.test(r.bom),
      'D: DTD cotizado sobre un modelo que sí lo corre, sin alerta roja');
  }

  // ── C4 · Escenario E: hub MPLS 1G + DIA 1G, Boost, segmentación, HA ────────
  {
    const r = await cargar({ famSeg: 'ec', users: 800, perUser: 3, chkBoost: 1, boostProfile: 'repetido',
      chkSeg: 1, chkHa: 1,
      wanLinksData: wan({ tipo: 'MPLS L3', medio: 'SFP 1G', down: 1000 }, { tipo: 'DIA', medio: 'SFP 1G', down: 1000 }) });
    const m = /(\d+) x\s+EdgeConnect Boost/.exec(r.bom);
    t.ok(m && m[1] === '2', `E: Boost = 2 bloques (30 % de los 600 Mbps del túnel), antes 10 (${m ? m[1] : 'sin línea'})`);
    t.ok(r.pick === 'EC-M', `E: el EC-M sigue cubriendo el hub (${r.pick})`);
  }

  // ── C2 · Escenario C: campus 12.000 clientes / 1.200 APs ────────────────────
  {
    const base = { famSeg: 'campus', users: 12000, perUser: 0.3, aps: 1200,
      wanLinksData: wan({ tipo: 'DIA', medio: 'SFP+ 10G', down: 2000 }) };
    const r10 = await cargar(base);
    t.ok(r10.pick === 'Gateway 9240', `C/AOS 10: recomienda el 9240 (${r10.pick})`);
    t.ok(!/R8R4[12]AAE|R8R1[34]AAE/.test(r10.bom), 'C/AOS 10: sin licencia de capacidad (Base cubre 32.000 clientes / 4.000 APs)');
    t.ok(/Sistema operativo:\s+AOS 10/.test(r10.bom), 'C/AOS 10: la propuesta declara el sistema operativo');
    const r8 = await cargar({ ...base, soSeg: 'aos8' });
    t.ok(/R8R14AAE/.test(r8.bom), 'C/AOS 8: pide la licencia Gold AOS 8 (R8R14AAE), no la de AOS 10');
    t.ok(!/R8R42AAE/.test(r8.bom), 'C/AOS 8: el SKU de AOS 10 ya no se cuela');
    t.ok(/Sistema operativo:\s+AOS 8/.test(r8.bom), 'C/AOS 8: el enlace restaura el SO elegido');
  }

  // ── C3 · Escenario H: 300 usuarios, 40 APs, HA ──────────────────────────────
  {
    const base = { famSeg: 'sucursal', users: 300, perUser: 1, aps: 40, chkHa: 1,
      wanLinksData: wan({ tipo: 'DIA', down: 300 }) };
    const r10 = await cargar(base);
    t.ok(/^Gateway 90(04|12)$/.test(r10.pick), `H/AOS 10: 40 APs caben en la serie 9000 (${r10.pick}), antes 9106`);
    const r8 = await cargar({ ...base, soSeg: 'aos8' });
    t.ok(!/^Gateway 90/.test(r8.pick), `H/AOS 8: la serie 9000 (32 APs) ya no cumple (${r8.pick || 'sin candidato'})`);
    t.ok(r8.pick !== 'Gateway 9114' && r8.pick !== 'Gateway 9106', 'H/AOS 8: 9106/9114 sin cifras AOS 8 no se proponen');
  }

  // ── C5 · Un 7005 elegido a mano declara su fin de venta ─────────────────────
  {
    await cargar({ famSeg: 'sucursal', users: 20, perUser: 1, soSeg: 'aos8', wanLinksData: wan({ tipo: 'DIA', down: 50 }) });
    await page.selectOption('#pickModel', '7005');
    await page.waitForTimeout(900);
    const v = (await page.textContent('#verdict')) || '';
    t.ok(/2022-10-31/.test(v) && /ya pas/.test(v), 'C5: el 7005 elegido a mano declara su último pedido (2022-10-31) ya vencido');
  }

  if (errores.length) console.log('[e2e-auditoria-fase1] errores de página observados:', [...new Set(errores)].join(' | '));
  await browser.close();
  process.exit(t.resumen('e2e-auditoria-fase1'));
})().catch((e) => { console.error('ERROR E2E:', e.message); process.exit(2); });
