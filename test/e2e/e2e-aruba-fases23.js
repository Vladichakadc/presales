'use strict';
/* global localStorage */
/* E2E de las fases 2 y 3 de la auditoría técnica del dimensionador Aruba (2026-09-17),
   cerradas el 2026-09-24. Cada bloque reproduce en el navegador real el escenario con el que
   se encontró el hallazgo y fija lo que la pantalla dice ahora:

     M5  error de JS al abrir un enlace antes de que llegue la API
     M6  página vacía: el BOM cotizaba un EC-XS por defecto
     A2  DTD/Boost movían la familia a EdgeConnect sin avisar y no volvía
     A3  Central «7/90xx» cotizado en gateways de otras series
     A4  Foundation Base para sedes pequeñas en 9004/9012
     A5  los APs no aparecían en la lista de materiales
     A7  ópticas: chasis sin SFP recomendados para fibra, motivo real y medio SFP28 25G
     M3  dos cifras de FEC sin explicar
     M4  breakout 70/30 por encima de la capacidad de Internet
     M7  el exportable llevaba textos internos del repositorio
     M8  VPNC de SD-Branch y N+1 de campus, declarados
     B1  EC-XL fuera de venta sin sucesor */
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
    await page.goto(p ? enlace(p) : URL_DIM, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#users', { timeout: 20000 });
    await page.waitForTimeout(1500);
    return {
      pick: await page.inputValue('#pickModel'),
      bom: await page.inputValue('#bomOut'),
      verdict: (await page.textContent('#verdict')) || '',
    };
  };

  // ── M5 · un enlace con grupos .seg, con la API retrasada ─────────────────────
  {
    await page.route('**/api/dimensionador/**', async (route) => { await new Promise((r) => setTimeout(r, 1500)); await route.continue(); });
    const antes = errores.length;
    await page.goto(enlace({ famSeg: 'ec', segSeg: 'hub', destSeg: 'cloud', fecMode: 'alto', wanLinksData: wan({ tipo: 'DIA', down: 300 }) }), { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3500);
    await page.unroute('**/api/dimensionador/**');
    const nuevos = errores.slice(antes);
    t.ok(nuevos.length === 0, 'M5: abrir un enlace antes de que llegue la API ya no lanza «reading \'auto\'»' + (nuevos.length ? ': ' + nuevos.join(' | ') : ''));
    errores.length = antes;
    t.ok(!!(await page.inputValue('#pickModel')), 'M5: y cuando llega la API, la página dimensiona');
  }

  // ── M6 · página vacía ────────────────────────────────────────────────────────
  {
    const r = await cargar(null);
    t.ok(/Sin equipo que cotizar/.test(r.bom), 'M6: la página vacía dice que no hay equipo que cotizar');
    t.ok(!/EC-XS/.test(r.bom) && !/TOTAL DE REFERENCIA/.test(r.bom), 'M6: sin EC-XS por defecto y sin un total de $0');
    const filas = await page.$$eval('#bomTabla tbody tr', (rs) => rs.length);
    t.ok(filas === 0, `M6: la tabla del BOM no tiene líneas (${filas})`);
  }

  // ── A2 · el salto de familia se declara y se deshace ─────────────────────────
  {
    await cargar({ wanLinksData: wan({ tipo: 'DIA', down: 300 }), users: 50, perUser: 2 });
    await page.click('#famSeg button[data-v="sucursal"]');
    await page.waitForTimeout(500);
    await page.selectOption('#selSeguridad', 'dtd');
    await page.waitForTimeout(700);
    const pulsado = await page.$eval('#famSeg [aria-pressed="true"]', (b) => b.dataset.v);
    const aviso = await page.$eval('#famAviso', (n) => (n.hidden ? '' : n.textContent));
    t.ok(pulsado === 'ec', `A2: con DTD la familia pasa a EdgeConnect (${pulsado})`);
    t.ok(/pasó a EdgeConnect SD-WAN porque Dynamic Threat Defense/.test(aviso) && /vuelve a «Gateways sucursal»/.test(aviso), 'A2: y lo dice bajo el selector');
    await page.selectOption('#selSeguridad', 'none');
    await page.waitForTimeout(700);
    const vuelta = await page.$eval('#famSeg [aria-pressed="true"]', (b) => b.dataset.v);
    const avisoVuelta = await page.$eval('#famAviso', (n) => n.hidden);
    t.ok(vuelta === 'sucursal' && avisoVuelta, `A2: al quitar DTD vuelve a «Gateways sucursal» (${vuelta})`);
    // Una elección manual entretanto manda: no se deshace nada.
    await page.check('#chkBoost');
    await page.waitForTimeout(500);
    await page.click('#famSeg button[data-v="any"]');
    await page.waitForTimeout(500);
    await page.uncheck('#chkBoost');
    await page.waitForTimeout(500);
    const manual = await page.$eval('#famSeg [aria-pressed="true"]', (b) => b.dataset.v);
    t.ok(manual === 'any', `A2: si alguien elige familia a mano entretanto, su elección se queda (${manual})`);
  }

  // ── A3 · Central solo con SKU en las series que cubre ────────────────────────
  {
    const g9004 = await cargar({ famSeg: 'sucursal', users: 200, perUser: 1, wanLinksData: wan({ tipo: 'DIA', down: 300 }) });
    t.ok(g9004.pick === 'Gateway 9004' && /Central Foundation\s+JZ119AAE/.test(g9004.bom), `A3: el 9004 (serie 9000) sigue con JZ119AAE (${g9004.pick})`);
    const g9106 = await cargar({ famSeg: 'sucursal', users: 3000, perUser: 1, wanLinksData: wan({ tipo: 'DIA', down: 3000 }) });
    t.ok(/^Gateway 91/.test(g9106.pick), `A3: escenario de serie 9100 (${g9106.pick})`);
    t.ok(!/JZ11[89]AAE|JZ12[0-3]AAE/.test(g9106.bom), 'A3: el 9106/9114 ya no cotiza el SKU de Central de la serie 7/90xx');
    t.ok(/Central Foundation\s+S0B89AAE/.test(g9106.bom) && /SKU oficial de la Serie 9100 Hybrid; precio a confirmar/.test(g9106.bom),
      'A3: cotiza el SKU oficial de la serie 9100 (S0B89AAE a 3 años), con el precio a confirmar');
    // El escenario C de la fase 1 (campus 12.000 clientes / 1.200 APs), que da un 9240.
    const g9240 = await cargar({ famSeg: 'campus', users: 12000, perUser: 0.3, aps: 1200, wanLinksData: wan({ tipo: 'DIA', medio: 'SFP+ 10G', down: 2000 }) });
    t.ok(g9240.pick === 'Gateway 9240', `A3: escenario de campus grande (${g9240.pick})`);
    t.ok(/Central Foundation\s+JZ196AAE/.test(g9240.bom), 'A3: el 9240 cotiza la familia 92/72xx (JZ196AAE), no la 7/90xx');
  }

  // ── A2 · IDS/IPS en el gateway con Central + Security ────────────────────────
  {
    await cargar({ users: 200, perUser: 1, wanLinksData: wan({ tipo: 'DIA', down: 300 }) });
    await page.click('#famSeg button[data-v="sucursal"]');
    await page.waitForTimeout(400);
    await page.selectOption('#selSeguridad', 'gwsec');
    await page.waitForTimeout(800);
    const fam = await page.$eval('#famSeg [aria-pressed="true"]', (b) => b.dataset.v);
    const pick = await page.inputValue('#pickModel');
    const bom = await page.inputValue('#bomOut');
    t.ok(fam === 'sucursal', `A2: IDS/IPS en el gateway ya no mueve la familia a EdgeConnect (${fam})`);
    t.ok(/^Gateway 90/.test(pick), `A2: recomienda un gateway con nivel + Security (${pick})`);
    t.ok(/Central Foundation \+ Security\s+R4D99AAE/.test(bom), 'A2: la suscripción de Central pasa a Foundation + Security (R4D99AAE, oficial)');
    t.ok(!/Dynamic Threat Defense\s+[A-Z0-9]{6,}/.test(bom), 'A2: sin licencia DTD de EdgeConnect en un gateway');
    // Con la familia en EdgeConnect, IDS/IPS en el gateway abre a «Indiferente» y lo dice.
    await page.click('#famSeg button[data-v="ec"]');
    await page.waitForTimeout(400);
    await page.selectOption('#selSeguridad', 'none');
    await page.waitForTimeout(400);
    await page.selectOption('#selSeguridad', 'gwsec');
    await page.waitForTimeout(700);
    const fam2 = await page.$eval('#famSeg [aria-pressed="true"]', (b) => b.dataset.v);
    const aviso2 = await page.$eval('#famAviso', (n) => (n.hidden ? '' : n.textContent));
    t.ok(fam2 === 'any' && /solo existe en los gateways SD-Branch/.test(aviso2), `A2: desde EdgeConnect abre a «Indiferente» y lo dice (${fam2})`);
    await page.selectOption('#selSeguridad', 'none');
    await page.waitForTimeout(700);
    const fam3 = await page.$eval('#famSeg [aria-pressed="true"]', (b) => b.dataset.v);
    t.ok(fam3 === 'ec', `A2: y al quitarlo vuelve a EdgeConnect (${fam3})`);
    // Sede pequeña con IDS/IPS: se ofrece Foundation Base + Security.
    const peq = await cargar({ famSeg: 'sucursal', selSeguridad: 'gwsec', users: 40, perUser: 2, wanLinksData: wan({ tipo: 'DIA', down: 100 }) });
    t.ok(/Central Foundation Base \+ Security \(R4D94AAE a 3 años\)/.test(peq.bom), `A4: con IDS/IPS y 40 usuarios se ofrece Base + Security (${peq.pick})`);
  }

  // ── A4 · Foundation Base para una sede pequeña ───────────────────────────────
  {
    const r = await cargar({ famSeg: 'sucursal', users: 40, perUser: 2, wanLinksData: wan({ tipo: 'DIA', down: 100 }) });
    t.ok(/Gateway 90(04|12)/.test(r.pick) && /Central Foundation Base \(JZ125AAE a 3 años\)/.test(r.bom), `A4: con 40 usuarios se ofrece Foundation Base (${r.pick})`);
    const grande = await cargar({ famSeg: 'sucursal', users: 400, perUser: 1, wanLinksData: wan({ tipo: 'DIA', down: 400 }) });
    t.ok(!/Foundation Base/.test(grande.bom), 'A4: con 400 usuarios no se ofrece');
  }

  // ── A5 · los APs aparecen en la lista ────────────────────────────────────────
  {
    const r = await cargar({ famSeg: 'sucursal', users: 200, perUser: 1, aps: 20, wanLinksData: wan({ tipo: 'DIA', down: 300 }) });
    t.ok(/20 x\s+Puntos de acceso/.test(r.bom), 'A5: 20 APs entran en la lista, declarados');
    t.ok(/Acceso inalámbrico/i.test(r.bom) || /ACCESO INALÁMBRICO/.test(r.bom), 'A5: con su propia categoría');
  }

  // ── A7 · fibra, motivo real y 25G ────────────────────────────────────────────
  {
    const r = await cargar({ wanLinksData: wan({ tipo: 'DIA', medio: 'SFP 1G', down: 1000 }, { tipo: 'MPLS L3', medio: 'SFP+ 10G', down: 2000 }) });
    t.ok(!/^Gateway 90(04|12)$/.test(r.pick), `A7: un chasis sin jaulas SFP ya no sale recomendado para fibra (${r.pick})`);
    const sfp = (await page.textContent('#sfpChooser')) || '';
    t.ok(!/no admite ópticas/.test(sfp), 'A7: el selector de ópticas ya no dice «no admite» cuando lo que falta es el dato');
    const medios = await page.$$eval('#wanBuilderFilas .wan-fila >> nth=0 >> [data-campo=medio] option', (os) => os.map((o) => o.value));
    t.ok(medios.includes('SFP28 25G'), `A7: el medio SFP28 25G se puede declarar (${medios.join(', ')})`);
    const r25 = await cargar({ famSeg: 'ec', wanLinksData: wan({ tipo: 'DIA', medio: 'SFP28 25G', down: 1500 }) });
    const ops25 = await page.$$eval('#sfpChooser select option', (os) => os.map((o) => o.value).filter(Boolean));
    // Control: el MISMO sitio en 10G sí cabe en un EC-M. Sin él, esta aserción pasaría también
    // si el EC-M se descartara por cualquier otro motivo.
    const r10 = await cargar({ famSeg: 'ec', wanLinksData: wan({ tipo: 'DIA', medio: 'SFP+ 10G', down: 1500 }) });
    t.ok(r10.pick === 'EC-M', `A7 (control): el mismo sitio en 10G recomienda el EC-M (${r10.pick})`);
    await cargar({ famSeg: 'ec', wanLinksData: wan({ tipo: 'DIA', medio: 'SFP28 25G', down: 1500 }) });
    t.ok(!/^EC-(S|M|L)$/.test(r25.pick) && r25.pick !== r10.pick, `A7: en 25G el EC-M, sin SFP28, queda fuera (${r25.pick})`);
    t.ok(ops25.length > 0 || /única compatible/.test((await page.textContent('#sfpChooser')) || ''), `A7: y hay ópticas de 25G compatibles para elegir (${ops25.length})`);
  }

  // ── M3 · las dos cifras de FEC, rotuladas ────────────────────────────────────
  {
    await cargar({ wanLinksData: wan({ tipo: 'DIA', down: 500 }) });
    const hint = (await page.textContent('#fecHint')) || '';
    t.ok(/el motor reserva 15 %/.test(hint), 'M3: el hint de FEC dice la reserva del motor (15 %)');
    const widget = (await page.textContent('#widgetPerf')) || '';
    t.ok(/ancla VSG/.test(widget) && /reserva FEC del motor \(15 %\)/.test(widget), 'M3: el widget rotula el ancla VSG y la reserva del motor');
  }

  // ── M4 · el breakout que no cabe por Internet se dice ────────────────────────
  {
    const r = await cargar({ wanLinksData: wan({ tipo: 'MPLS L3', down: 1000 }, { tipo: 'DIA', down: 100 }) });
    t.ok(/Breakout por encima de Internet/.test(r.bom), 'M4: MPLS 1000 + DIA 100 declara que el 70 % no cabe por Internet');
    const ok = await cargar({ wanLinksData: wan({ tipo: 'MPLS L3', down: 100 }, { tipo: 'DIA', down: 1000 }) });
    t.ok(!/Breakout por encima de Internet/.test(ok.bom), 'M4: y no lo dice cuando sí cabe');
  }

  // ── M7 · nada interno en el exportable ───────────────────────────────────────
  {
    const r = await cargar({ users: 300, perUser: 2, chkHa: 1, selSeguridad: 'dtd', wanLinksData: wan({ tipo: 'MPLS L3', down: 1000 }, { tipo: 'DIA', down: 1000 }) });
    const internos = r.bom.split('\n').filter((l) => /aruba\.js|CARE_SKU|\.csv\b|Copia local|\bbrief\b|legacyData|\/datasheets\//i.test(l));
    t.ok(internos.length === 0, 'M7: el BOM exportable no nombra archivos ni constantes del repositorio' + (internos.length ? ': ' + internos.map((l) => l.trim()).join(' | ') : ''));
  }

  // ── M8 · VPNC y N+1 declarados ───────────────────────────────────────────────
  {
    const suc = await cargar({ famSeg: 'sucursal', users: 200, perUser: 1, wanLinksData: wan({ tipo: 'DIA', down: 300 }) });
    t.ok(/concentrador VPNC/.test(suc.bom), 'M8: un gateway de sucursal declara el VPNC que no incluye');
    const campus = await cargar({ famSeg: 'campus', users: 3000, perUser: 1, aps: 200, wanLinksData: wan({ tipo: 'DIA', medio: 'SFP+ 10G', down: 2000 }) });
    t.ok(/Campus sin clúster/.test(campus.bom), `M8: un gateway de campus sin HA declara el N+1 que falta (${campus.pick})`);
    const campusHa = await cargar({ famSeg: 'campus', users: 3000, perUser: 1, aps: 200, chkHa: 1, wanLinksData: wan({ tipo: 'DIA', medio: 'SFP+ 10G', down: 2000 }) });
    t.ok(!/Campus sin clúster/.test(campusHa.bom), 'M8: con HA marcado ya no');
  }

  // ── A2 · IDS/IPS en el gateway contra la cifra oficial del VSG ──────────────
  {
    // 900 Mbps: por firewall basta un 9004 (4 Gbps); por IDS/IPS (1,1 Gbps × 0,70 IMIX) no, y
    // hace falta un 9106 (2,5 Gbps). Es la diferencia que el eje existe para marcar.
    const fw = await cargar({ famSeg: 'sucursal', wanLinksData: wan({ tipo: 'DIA', down: 900 }) });
    const ids = await cargar({ famSeg: 'sucursal', selSeguridad: 'gwsec', wanLinksData: wan({ tipo: 'DIA', down: 900 }) });
    t.ok(fw.pick === 'Gateway 9004', `A2 (control): sin IDS/IPS, 900 Mbps caben en un 9004 (${fw.pick})`);
    t.ok(ids.pick === 'Gateway 9106', `A2: con IDS/IPS se dimensiona contra la cifra oficial y sube a un 9106 (${ids.pick})`);
    t.ok(/Hasta 2,5 Gbps de throughput IDS\/IPS \(VSG SD-Branch/.test(ids.verdict + ((await page.textContent('#pane-calc')) || '')), 'A2: la ficha pinta el IDS/IPS oficial del gateway');
  }

  // ── M8 · túneles de la sede y headend sugerido en el consolidado ─────────────
  {
    const r = await cargar({ famSeg: 'sucursal', users: 100, perUser: 1, wanLinksData: wan({ tipo: 'DIA', down: 300 }, { tipo: '4G/5G', down: 50, rol: 'respaldo' }) });
    t.ok(/Esta sede abre 2 túneles SD-WAN hacia cada VPNC/.test(r.bom), 'M8: la sede cuenta sus túneles (el respaldo también abre el suyo)');
    await page.evaluate(() => { try { localStorage.removeItem('presales-perfiles'); } catch { /* sin almacenamiento */ } });
    await cargar({ famSeg: 'sucursal', users: 100, perUser: 1, wanLinksData: wan({ tipo: 'DIA', down: 300 }, { tipo: '4G/5G', down: 50, rol: 'respaldo' }) });
    await page.click('[data-tab="bom"]'); // los perfiles viven en la pestaña de la lista de materiales
    await page.waitForTimeout(300);
    await page.fill('#nombrePerfil', 'Sucursal tipo');
    await page.fill('#perfilSedes', '300');
    await page.click('#btnGuardarPerfil');
    await page.waitForTimeout(500);
    await page.click('#btnConsolidar');
    await page.waitForTimeout(700);
    const aviso = (await page.textContent('#avisoVpnc').catch(() => '')) || '';
    t.ok(/300 sedes con gateway de sucursal abren 600 túneles/.test(aviso), `M8: el consolidado suma los túneles (${aviso.slice(0, 90)})`);
    t.ok(/mínimo por túneles es el Gateway 9106 \(8,000 túneles/.test(aviso), 'M8: y sugiere el headend vigente más pequeño que los sostiene (9106), no el 7240XM de la línea anterior');
    await page.click('#consolidadoCerrar');
    await page.evaluate(() => { try { localStorage.removeItem('presales-perfiles'); } catch { /* sin almacenamiento */ } });
  }

  // ── B1 · EC-XL con sucesor rotulado ──────────────────────────────────────────
  {
    await cargar({ famSeg: 'ec', wanLinksData: wan({ tipo: 'DIA', medio: 'SFP+ 10G', down: 4000 }) });
    await page.selectOption('#pickModel', 'EC-XL');
    await page.waitForTimeout(900);
    const txt = ((await page.textContent('#verdict')) || '') + ((await page.textContent('#pane-calc')) || '');
    t.ok(/sucesor natural: EC-10150 \(inferencia por capacidad, sin doc oficial\)/.test(txt), 'B1: el EC-XL fuera de venta muestra su sucesor, rotulado como inferencia');
  }

  t.ok(errores.length === 0, 'sin errores de JavaScript en la página' + (errores.length ? ': ' + errores.join(' | ') : ''));
  await browser.close();
  process.exit(t.resumen('e2e-aruba-fases23'));
})().catch((e) => { console.error(e); process.exit(1); });
