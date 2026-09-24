'use strict';
/* ══ E2E DEL REDISEÑO DINAMICO FORTINET (etapa 7, informe de auditoria del 23-sep-2026) ══════
   `test/fortinet-motor.test.js` afirma las reglas contra el motor puro. Esto afirma lo que
   ese test no ve y el informe exige como criterio de salida: que la PANTALLA las conduce —la
   recomendacion, la seleccion, el grafico, el BOM y cada boton leen el MISMO resultado—, que
   el servidor confirma antes de que salga nada, y que la experiencia es la pedida (panel
   anclado, sin doble scroll en movil, anuncios para lector de pantalla, enlace verificable).

   Mismo criterio que e2e-fortinet-auditoria.js: se afirman DECISIONES y ESTADOS, no cifras
   del catalogo, salvo las que SON el hallazgo (CU-01 del informe: 90G, TP ~50 %, SSL ~42 %). */
/* global document, window, getComputedStyle */
const { cargarPlaywright, abrirSesion, asentar, contador } = require('./ayuda');

const BASE = process.env.E2E_BASE || 'http://localhost:4131';
const PAGINA = `${BASE}/dimensionador-fortinet-fortigate.html`;
// CU-01 del informe: sucursal spoke, 500 Mbps DIA por el overlay, 200 inter-VLAN, 50 remotos
// con 100 Mbps, 300 usuarios × 75 sesiones, AV + Web + SSL, 30 % de crecimiento, techo 70 %.
const CU01 = new URLSearchParams({
  wanLinksData: JSON.stringify({ v: 2, wanLinks: [{ id: 1, tipo: 'DIA', down: 500, overlay: true }] }),
  rolSeg: 'spoke', hubs: '2', interVlan: '200', chkRemoto: '1', vpnUsers: '50', vpnMbps: '100',
  users: '300', sesUser: '75', vidaSes: '30', chkAv: '1', chkWeb: '1', chkSsl: '1', techoUtil: '70',
}).toString();

(async () => {
  const { chromium } = cargarPlaywright();
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 936 } });
  page.on('dialog', (d) => d.accept());
  const t = contador();
  const errores = [];
  page.on('pageerror', (e) => errores.push(e.message));

  await abrirSesion(page);
  const abrir = async (qs) => {
    await page.goto(`${PAGINA}${qs ? `?${qs}` : ''}`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#stickyReco', { timeout: 20000 });
    await asentar(page);
  };
  const texto = (sel) => page.$eval(sel, (e) => (e.innerText || e.textContent || '').replace(/\s+/g, ' ')).catch(() => '');
  const estado = () => page.evaluate(() => {
    const d = (id) => { const b = document.getElementById(id); return b ? b.disabled : null; };
    return {
      reco: (document.getElementById('verdict-sel') || {}).value || null,
      sticky: document.getElementById('stickyReco').innerText,
      gate: document.getElementById('gateResumen').innerText,
      bomModelo: (document.querySelector('#bomBody .model') || {}).textContent || null,
      xls: d('xlsBtn'), copy: d('copyBtn'), cot: d('btnACotizador'), perfil: d('btnGuardarPerfil'),
      xlsTxt: document.getElementById('xlsBtn').textContent,
      qty: document.getElementById('qty').value, qtyRO: document.getElementById('qty').readOnly,
    };
  });

  /* ── T01 · CU-01 ────────────────────────────────────────────────────────────────── */
  await abrir(CU01);
  let e = await estado();
  const ejes = await texto('#ejesPanel');
  t.ok(e.reco === 'FortiGate 90G', `T01: el escenario auditado recomienda el 90G (${e.reco})`);
  const pctDe = (eje) => { const m = new RegExp(`${eje}\\s+(\\d+(?:\\.\\d+)?) %`).exec(ejes); return m ? Number(m[1]) : null; };
  const tp = pctDe('Threat Protection');
  const ssl = pctDe('Inspección SSL');
  t.ok(tp != null && Math.abs(tp - 50) <= 2 && ssl != null && Math.abs(ssl - 42) <= 2,
    `T01: reproduce las utilizaciones del informe con ±2 puntos (TP ${tp} %, SSL ${ssl} %)`);
  t.ok(/Lista para cotizar/i.test(e.gate), 'T01: sin bloqueos, la puerta está lista');
  t.ok(e.bomModelo === 'FortiGate 90G', 'T03: la lista de materiales es la del modelo validado');

  /* ── T02 / T03 / T25 · OVERRIDE QUE NO CUMPLE ─────────────────────────────────────── */
  await page.selectOption('#pickModel', 'FortiGate 40F');
  await asentar(page);
  e = await estado();
  const ov = await texto('#overrideAviso');
  t.ok(/40F/.test(ov) && /Threat Protection/.test(ov) && /Inspección SSL/.test(ov),
    'T02: elegir el 40F muestra el déficit de Threat Protection y de SSL');
  t.ok(e.bomModelo === 'FortiGate 90G' && e.reco === 'FortiGate 90G',
    'T02/T03: la recomendación y el BOM siguen en el 90G validado; el BOM nunca cotiza el 40F');
  t.ok(/Bloqueada/i.test(e.gate), 'T02: la puerta queda bloqueada mientras se mantenga la elección');
  t.ok(e.xls && e.copy && e.cot && e.perfil, 'T25: Excel, copiar, cotizador y perfil se deshabilitan juntos');
  await page.click('#overrideAviso [data-corregir]');
  await asentar(page);
  e = await estado();
  t.ok(!e.xls && !e.cot && /Lista para cotizar/i.test(e.gate), 'T02: «Volver al recomendado» reabre la puerta');
  t.ok(await page.$eval('#pickModel', (s) => s.value) === '', 'y el selector vuelve a «seguir la recomendación»');

  // Un override que SI cumple se revalida y pasa a ser el modelo del BOM.
  await page.click('.sr-alt[data-alt="FortiGate 120G"]').catch(() => {});
  await asentar(page);
  e = await estado();
  t.ok(e.bomModelo === e.reco && /elegido a mano/.test(e.sticky),
    `T03: una alternativa elegida se revalida y el BOM la sigue (${e.reco} / ${e.bomModelo})`);

  /* ── T04 / T05 · ALTA DISPONIBILIDAD ─────────────────────────────────────────────── */
  await abrir(CU01);
  await page.check('#chkHa');
  await asentar(page);
  e = await estado();
  t.ok(e.qty === '2' && e.qtyRO, 'T04: con HA la cantidad es 2 y no se puede editar');
  t.ok(!(await page.$eval('#fldHaModo', (x) => x.hidden)), 'T04: aparece el modo del clúster');
  t.ok(e.reco === 'FortiGate 90G', 'T05: el clúster no suma capacidad: la recomendación no cambia');
  const qtys = await page.$$eval('#bomTabla tbody tr', (trs) => trs.map((tr) => (tr.children[2] || {}).textContent || '').filter(Boolean));
  t.ok(qtys.length && qtys.every((q) => /^\s*2\s*$/.test(q) || !/\d/.test(q)), `T05: cada línea del BOM va por 2 nodos (${qtys.join(', ')})`);

  /* ── T06 / T07 · FortiOS y SSL-VPN ───────────────────────────────────────────────── */
  await abrir(`${CU01}&vpnTipo=sslvpn`);
  const bloq = await texto('#resBloqueos');
  t.ok(/retirado en FortiOS 7\.6\.3/.test(bloq), 'T06: SSL-VPN en 7.6.3+ se bloquea con su causa');
  t.ok(/Cambiar a IPsec/.test(bloq), 'T06: y se ofrece IPsec como corrección');
  // CU-05: «se explica el motivo con fuente». Desde el 2026-09-24 la regla de 7.6.3+ está
  // leída en las Release Notes 7.6.3, así que cita documento y página y ya no se disculpa.
  t.ok(/Fuente: .*7\.6\.3 Release Notes, p\. 15/.test(bloq) && !/no se leyó desde este entorno/.test(bloq),
    'CU-05: el bloqueo cita su fuente leída, con documento y página');
  {
    // Y una regla citada SIN leer se sigue declarando como tal: el catálogo real ya no tiene
    // ninguna, así que se devuelve la de 7.6.3+ a `leida:false` interceptando la API.
    const pg = await browser.newPage({ viewport: { width: 1440, height: 936 } });
    await abrirSesion(pg);
    let tocadas = 0;
    await pg.route('**/api/dimensionador/fortinet', async (route) => {
      const r = await route.fetch();
      const j = await r.json();
      for (const rg of (j.fortios && j.fortios.reglas) || []) {
        if (rg.modelos === '*' && rg.versiones.includes('7.6.3+')) { rg.leida = false; tocadas += 1; }
      }
      await route.fulfill({ response: r, json: j });
    });
    await pg.goto(`${PAGINA}?${CU01}&vpnTipo=sslvpn`, { waitUntil: 'domcontentloaded' });
    await pg.waitForSelector('#stickyReco', { timeout: 20000 });
    await asentar(pg);
    const b2 = await pg.$eval('#resBloqueos', (e) => (e.innerText || e.textContent || '').replace(/\s+/g, ' ')).catch(() => '');
    t.ok(tocadas === 1 && /no se leyó desde este entorno/.test(b2),
      `CU-05: una regla citada sin leer lo declara junto al bloqueo (reglas tocadas: ${tocadas})`);
    await pg.close();
  }
  await page.click('#resBloqueos [data-corregir]');
  await asentar(page);
  t.ok(await page.$eval('#vpnTipo', (s) => s.value) === 'ipsec' && (await estado()).reco === 'FortiGate 90G',
    'T06: la corrección aplica IPsec y el escenario vuelve a tener equipo');
  await page.selectOption('#fortiOS', '7.4');
  await page.selectOption('#vpnTipo', 'sslvpn');
  await asentar(page);
  const opsSsl = await page.$eval('#verdict-sel', (s) => [...s.options].map((o) => o.value));
  t.ok(!opsSsl.includes('FortiGate 90G') && !opsSsl.includes('FortiGate 91G'),
    'T07: con SSL-VPN, la serie 90G queda fuera aunque haya dato histórico (nota 11 del Matrix)');

  /* ── T08 · CORRECCION AUTOMATICA REVERSIBLE DEL BUNDLE ───────────────────────────── */
  await abrir(CU01);
  await page.selectOption('#licBundle', 'utp');
  await asentar(page);
  await page.check('#chkIotDlp');
  await asentar(page);
  t.ok(await page.$eval('#licBundle', (s) => s.value) === 'ent', 'T08: marcar DLP/IoT con UTP corrige a Enterprise');
  t.ok(/Enterprise Protection/.test(await texto('#autoCorr')), 'T08: y explica por qué');
  await page.click('#btnCorrDeshacer');
  await asentar(page);
  t.ok(await page.$eval('#licBundle', (s) => s.value) === 'utp' && /Bloqueada/i.test((await estado()).gate),
    'T08: la corrección es reversible; deshecha, la puerta bloquea con su motivo');

  /* ── T10 / T11 · SANDBOX ─────────────────────────────────────────────────────────── */
  await abrir(CU01);
  t.ok(await page.$eval('#fldSandbox', (x) => x.hidden), 'T11: sin FortiSandbox no se pregunta cómo se cubre');
  await page.check('#chkSandbox');
  await asentar(page);
  const catsSb = () => page.$$eval('#bomTabla tbody tr', (trs) => trs.map((tr) => tr.textContent));
  t.ok(!(await catsSb()).some((x) => /Sandbox/i.test(x)), 'T10: sandbox incluido en el bundle no crea una línea');
  await page.selectOption('#sandboxModo', 'dedicado');
  await asentar(page);
  t.ok(!(await page.$eval('#fldSandboxModalidad', (x) => x.hidden)) && /Bloqueada/i.test((await estado()).gate),
    'T11: el FortiSandbox dedicado pide la modalidad y sin ella no se cotiza');
  await page.selectOption('#sandboxModalidad', 'vm');
  await asentar(page);
  t.ok((await catsSb()).some((x) => /FortiSandbox dedicado/.test(x)) && /borrador/i.test((await estado()).gate),
    'T11: con modalidad entra en línea propia, sin SKU inventado (borrador)');

  /* ── T12 · EMS POR ENDPOINTS GESTIONADOS ─────────────────────────────────────────── */
  await abrir(CU01);
  await page.check('#chkEms');
  await asentar(page);
  t.ok(!(await page.$eval('#fldEms', (x) => x.hidden)) && /Bloqueada/i.test((await estado()).gate),
    'T12: EMS pide sus endpoints y no los deriva de los usuarios en silencio');
  await page.click('#btnEmsSugerir');
  await asentar(page);
  t.ok(await page.$eval('#emsEndpoints', (x) => x.value) === '350', 'T12: «Sugerir» propone usuarios + remotos, a la vista');
  // Sin despliegue declarado la línea entra con los endpoints y sin SKU, y la puerta sigue
  // cerrada: el despliegue decide el SKU de cada pack (Ordering Guide de FortiClient).
  t.ok(!(await page.$eval('#fldEmsDespliegue', (x) => x.hidden)) && /Bloqueada/i.test((await estado()).gate),
    'T12: EMS pide también el despliegue, que decide el SKU');
  await page.selectOption('#emsDespliegue', 'cloud');
  await asentar(page);
  const ems = (await catsSb()).find((x) => /VPN\/ZTNA/.test(x)) || '';
  // La cantidad Y el pack: con `|| ems.length > 0` esta aserción pasaba con cualquier fila
  // que mencionara EMS, así que no comprobaba que la cantidad fueran los endpoints declarados.
  t.ok(/FC1-10-EMS05-428-01-36/.test(ems) && /\b14\b/.test(ems),
    `T12: los 350 endpoints entran como 14 packs de 25 con el SKU exacto de FortiClient Cloud («${ems.replace(/\s+/g, ' ').slice(0, 140)}»)`);

  /* ── T13 / T14 · FORMULARIO DINAMICO ─────────────────────────────────────────────── */
  await abrir(CU01);
  t.ok(!(await page.$eval('#fldHubs', (x) => x.hidden)) && await page.$eval('#fldAgg', (x) => x.hidden),
    'T14: un spoke declara hubs y no spokes');
  await page.click('#rolSeg button[data-v="hub"]');
  await asentar(page);
  t.ok(await page.$eval('#fldHubs', (x) => x.hidden) && !(await page.$eval('#fldAgg', (x) => x.hidden))
    && !(await page.$eval('#fldConc', (x) => x.hidden)), 'T14: un hub declara spokes y simultaneidad, no hubs');
  t.ok(/plano de control|Maximum Values/i.test(await texto('#resBloqueos')), 'T14: el hub advierte la escala del plano de control');
  await page.click('#rolSeg button[data-v="none"]');
  await asentar(page);
  t.ok(await page.$eval('#grpSdwan', (x) => x.hidden), 'T13: sin SD-WAN desaparecen los servicios avanzados');
  t.ok(await page.$eval('#hubs', (x) => x.value) === '2', 'T13: el valor oculto se conserva para recuperarlo');
  t.ok(!/hubs=/.test(page.url()), 'T13: y no viaja en el enlace mientras no aplica');
  t.ok(/hubs a los que cifra/.test(await texto('#requisitos')), 'T13: los requisitos declaran qué se conserva fuera del cálculo');

  /* ── T15 · ENLACE DE RESPALDO ────────────────────────────────────────────────────── */
  const RESP = new URLSearchParams({ wanLinksData: JSON.stringify({ v: 2, wanLinks: [
    { id: 1, tipo: 'DIA', down: 1000, overlay: false }, { id: 2, tipo: '4G/5G', down: 200, overlay: false, rol: 'respaldo' }] }) }).toString();
  await abrir(RESP);
  t.ok(await page.$eval('#bw', (x) => x.value) === '1000', 'T15: el respaldo no suma al caudal de operación normal');
  const req = await texto('#requisitos');
  t.ok(/Falla del enlace 1/.test(req), 'T15: aparece el escenario de falla del enlace activo');
  t.ok(/800 Mbps sin camino/.test(req), 'T15: y lo que no cabe en el respaldo se declara como pérdida, no se reparte');

  /* ── T16 · TLS CIFRADO × INSPECCIONADO ───────────────────────────────────────────── */
  await abrir(CU01);
  // Se lee con la pestaña «Requisitos» abierta, como la lee una persona: oculta, la tabla no
  // tiene maquetacion y sus celdas salen pegadas.
  await page.click('#rtab-req');
  await asentar(page);
  const sslReq = async () => { const m = /Inspección SSL\s+([\d.]+ [MG]bps)/.exec(await texto('#requisitos')); return m ? m[1] : null; };
  const antesSsl = await sslReq();
  await page.selectOption('#pctCifrado', '80');
  await asentar(page);
  const despuesSsl = await sslReq();
  t.ok(antesSsl && despuesSsl && antesSsl !== despuesSsl, `T16: la parte cifrada reduce la demanda del eje SSL (${antesSsl} → ${despuesSsl})`);

  /* ── T17 / T18 / T19 · HARDWARE FISICO ───────────────────────────────────────────── */
  await abrir('wanLinksData=' + encodeURIComponent(JSON.stringify({ v: 2, wanLinks: [{ id: 1, tipo: 'DIA', down: 300, overlay: false }] })));
  await page.selectOption('#registroDestino', 'local');
  await page.fill('#registroGbDia', '5');
  await page.fill('#registroDias', '30');
  await page.dispatchEvent('#registroDias', 'input');
  await asentar(page);
  e = await estado();
  const disco = await page.evaluate(() => {
    const m = (document.getElementById('verdict-sel') || {}).value;
    return m;
  });
  t.ok(disco && /1G$|1F$/.test(disco.replace(/^FortiGate /, '')), `T17: con registro local manda un modelo con disco (${disco})`);
  await page.selectOption('#registroDestino', 'faz');
  await asentar(page);
  await page.fill('#poeW', '60');
  await page.dispatchEvent('#poeW', 'input');
  await asentar(page);
  t.ok(/sin PoE en el SKU base/.test(await texto('#verdict')), 'T18: un SKU base sin PoE no cubre un requerimiento PoE');
  await page.fill('#poeW', '0');
  await page.dispatchEvent('#poeW', 'input');
  await page.fill('#pt_sfpp_10g', '4');
  await page.dispatchEvent('#pt_sfpp_10g', 'input');
  await asentar(page);
  const conPuertos = await page.$eval('#verdict-sel', (s) => s.value).catch(() => null);
  t.ok(conPuertos && conPuertos !== 'FortiGate 30G' && /puertos/i.test(await texto('#verdict')),
    `T19: 4 × SFP+ 10 GE descartan a quien no los tiene y se dice (${conPuertos})`);

  /* ── T20 · CHASIS ────────────────────────────────────────────────────────────────── */
  await abrir(CU01);
  await page.selectOption('#pickModel', 'FortiGate 7081F');
  await asentar(page);
  t.ok(/chasis modular/.test(await texto('#resBloqueos')) && /Bloqueada/i.test((await estado()).gate),
    'T20: un chasis no exporta BOM sin su configurador');

  /* ── T21 · FUERA DE VENTA POR TIPO DE COMPRA ─────────────────────────────────────── */
  await abrir(CU01);
  let ops = await page.$eval('#verdict-sel', (s) => [...s.options].map((o) => o.value));
  t.ok(!ops.includes('FortiGate 600F') && !ops.includes('FortiGate 70F'), 'T21: en compra nueva ningún fuera de venta es candidato');
  await page.selectOption('#motivoCompra', 'ampliacion');
  await asentar(page);
  ops = await page.$eval('#verdict-sel', (s) => [...s.options].map((o) => o.value));
  t.ok(ops.includes('FortiGate 600F'), 'T21: en ampliación el parque instalado vuelve a ser elegible');
  await page.selectOption('#verdict-sel', 'FortiGate 600F');
  await asentar(page);
  t.ok(!(await page.$eval('#fldJustEol', (x) => x.hidden)) && /Bloqueada/i.test((await estado()).gate),
    'T21: elegirlo exige una justificación escrita');
  await page.fill('#justificacionEol', 'Ampliación de un clúster existente con el mismo modelo');
  await page.dispatchEvent('#justificacionEol', 'input');
  await asentar(page);
  t.ok(!/Falta justificación/.test(await texto('#resBloqueos')), 'T21: con la justificación, ese bloqueo desaparece');

  /* ── T22 · VDOM POR ENCIMA DE LOS INCLUIDOS ──────────────────────────────────────── */
  await abrir(CU01);
  await page.fill('#vdoms', '20');
  await page.dispatchEvent('#vdoms', 'input');
  await asentar(page);
  const bomVd = await page.$$eval('#bomTabla tbody tr', (trs) => trs.map((tr) => tr.textContent).join(' | '));
  t.ok(/VDOM/.test(bomVd) && /borrador/i.test((await estado()).gate),
    'T22: los VDOM sobre la cuota incluida añaden su licencia y, sin SKU, dejan borrador');

  /* ── T24 · COBERTURA DEL BANNER = CATALOGO SERVIDO ───────────────────────────────── */
  const api = await page.evaluate(async () => (await (await fetch('/api/dimensionador/fortinet')).json()).models);
  const conSsl = api.filter((m) => m.ssl != null).length;
  t.ok(new RegExp(`SSL ${conSsl}/${api.length}`).test(await texto('#dataBanner')),
    `T24: el banner cuenta la cobertura del catálogo servido (SSL ${conSsl}/${api.length})`);
  await page.click('[data-tab=src]');
  await asentar(page);
  const src = await texto('#pane-src');
  t.ok(!/julio 2026|03-ago-2026|filtrados para excluir/.test(src), 'T24: la pestaña Fuentes no contradice la procedencia declarada');
  t.ok(new RegExp(`SSL ${conSsl}/${api.length}`).test(src), 'T24: y cuenta la misma cobertura que el banner');
  await page.click('[data-tab=calc]');
  await asentar(page);

  /* ── T25 · BORRADOR: solo lo que admite borrador ─────────────────────────────────── */
  e = await estado();
  t.ok(!e.xls && /borrador/i.test(e.xlsTxt) && e.cot && e.perfil, 'T25: en BORRADOR solo sale el borrador técnico');

  /* ── CONFIRMACION DEL SERVIDOR ───────────────────────────────────────────────────── */
  await abrir(CU01);
  await page.click('#tab-bom');
  await asentar(page);
  const [resp] = await Promise.all([
    page.waitForResponse((r) => r.url().includes('/api/v1/fortinet/evaluations'), { timeout: 15000 }),
    page.click('#xlsBtn'),
  ]);
  const j = await resp.json();
  t.ok(resp.status() === 200 && j.permitida === true && j.quoteGate === 'READY',
    'la exportación a Excel la confirma el servidor antes de generarse');
  t.ok(j.auditada === true, 'y queda registrada en la auditoría de acciones comerciales');
  // El servidor no se fía del navegador: una huella distinta, o una acción que la puerta no
  // admite, se rechazan aunque la pantalla las pidiera.
  const rechazo = await page.evaluate(async () => {
    const body = { scenario: { topologia: { rol: 'none', enlaces: [{ id: 1, tipo: 'DIA', down: 500 }] } }, accion: 'excel', scenarioHash: 'sha256:falsa' };
    const r1 = await fetch('/api/v1/fortinet/evaluations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const body2 = { scenario: { topologia: { rol: 'none', enlaces: [{ id: 1, tipo: 'DIA', down: 500 }] } }, requestedOverrideModel: 'FortiGate 30G', accion: 'cotizador' };
    const r2 = await fetch('/api/v1/fortinet/evaluations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body2) });
    const r3 = await fetch('/api/v1/fortinet/evaluations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ scenario: {}, precio: 1 }) });
    return { huella: r1.status, override: r2.status, override2: (await r2.json()).codigo, extra: r3.status };
  });
  t.ok(rechazo.huella === 409, 'el servidor rechaza una huella que no es la del escenario que evaluó (409)');
  t.ok(rechazo.override === 409 && rechazo.override2 === 'puerta-cerrada', 'y una acción comercial sobre un override que no cumple (409)');
  t.ok(rechazo.extra === 400, 'y un campo que no conoce (400): nada entra sin estar en el contrato');

  /* ── T26 · ESCRITORIO: la columna izquierda se mueve y el panel no ───────────────── */
  await abrir(CU01);
  await page.evaluate(() => window.scrollTo(0, 800));
  await asentar(page);
  const p1 = await page.evaluate(() => ({ res: document.getElementById('dimRes').getBoundingClientRect().top, form: document.getElementById('paso3').getBoundingClientRect().top }));
  await page.evaluate(() => window.scrollBy(0, 900));
  await asentar(page);
  const p2 = await page.evaluate(() => ({ res: document.getElementById('dimRes').getBoundingClientRect().top, form: document.getElementById('paso3').getBoundingClientRect().top,
    pie: document.getElementById('resPie').getBoundingClientRect().bottom, alto: window.innerHeight }));
  t.ok(Math.abs(p1.res - p2.res) < 2 && Math.abs(p1.form - p2.form) > 800,
    `T26: el formulario se desplaza (${Math.round(p1.form)} → ${Math.round(p2.form)}) y el panel no (${Math.round(p1.res)} → ${Math.round(p2.res)})`);
  t.ok(p2.pie <= p2.alto, 'T26: el pie con la puerta de cotización queda dentro de la ventana');

  /* ── T27 · MOVIL: sin doble scroll y con resumen accesible ───────────────────────── */
  await page.setViewportSize({ width: 390, height: 844 });
  await abrir(CU01);
  const movil = await page.evaluate(() => {
    const f = document.getElementById('dimForm');
    const bar = document.getElementById('resMovil');
    return { ancho: document.documentElement.scrollWidth, vista: window.innerWidth, anidado: f.scrollHeight > f.clientHeight + 1,
      barra: getComputedStyle(bar).display, rol: bar.getAttribute('role'), txt: bar.innerText };
  });
  t.ok(movil.ancho <= movil.vista, `T27: sin desplazamiento horizontal (${movil.ancho} ≤ ${movil.vista})`);
  t.ok(!movil.anidado, 'T27: el formulario no tiene scroll propio');
  t.ok(movil.barra !== 'none' && movil.rol === 'region' && /90G/.test(movil.txt), 'T27: el resumen de una línea sigue a la vista y es una región con nombre');
  // Las cinco pestañas del panel se VEN, no solo se pueden desplazar: a 1024 px la quinta
  // quedaba cortada detrás de un scroll horizontal que nada anunciaba.
  const pestanas = async () => page.$eval('.res-tabs', (e) => ({ total: e.scrollWidth, visible: e.clientWidth }));
  const pMovil = await pestanas();
  await page.setViewportSize({ width: 1024, height: 768 });
  await asentar(page);
  const pMedia = await pestanas();
  t.ok(pMovil.total <= pMovil.visible + 1 && pMedia.total <= pMedia.visible + 1,
    `las cinco pestañas del resultado caben a 390 y a 1024 px (${pMovil.total}/${pMovil.visible}, ${pMedia.total}/${pMedia.visible})`);
  await page.setViewportSize({ width: 1440, height: 936 });

  /* ── T28 · ANUNCIOS PARA LECTOR DE PANTALLA ──────────────────────────────────────── */
  await abrir(CU01);
  const anuncio = () => page.$eval('#resAnuncio', (n) => ({ txt: n.textContent, live: n.getAttribute('aria-live') }));
  let a = await anuncio();
  t.ok(a.live === 'polite' && /90G/.test(a.txt), 'T28: el modelo recomendado se anuncia en una región aria-live');
  await page.selectOption('#pickModel', 'FortiGate 40F');
  await asentar(page);
  a = await anuncio();
  t.ok(/Bloqueada/i.test(a.txt) && /40F/.test(a.txt), 'T28: el bloqueo por el override también se anuncia');

  /* ── T29 · GRAFICO ACCESIBLE ─────────────────────────────────────────────────────── */
  await page.click('#rtab-graf');
  await asentar(page);
  const graf = await page.evaluate(() => {
    const tr = document.getElementById('track');
    const lbl = document.getElementById(tr.getAttribute('aria-labelledby'));
    return { rol: tr.getAttribute('role'), nombre: lbl ? lbl.textContent : '', filas: document.querySelectorAll('#grafTabla tbody tr').length,
      desc: (document.getElementById(tr.getAttribute('aria-describedby')) || {}).textContent || '' };
  });
  t.ok(graf.rol === 'img' && /Escala/.test(graf.nombre) && /Requerimiento/.test(graf.desc), 'T29: el gráfico tiene nombre y descripción accesibles');
  t.ok(graf.filas > 10, `T29: y una tabla equivalente (${graf.filas} filas)`);
  // Pestañas con roving tabindex: una sola entra en el orden de tabulación.
  const tabs = await page.$$eval('.res-tabs [role=tab]', (ts) => ts.map((x) => x.tabIndex));
  t.ok(tabs.filter((x) => x === 0).length === 1, 'las pestañas del panel usan roving tabindex');
  await page.focus('#rtab-graf');
  await page.keyboard.press('ArrowRight');
  t.ok(await page.evaluate(() => document.activeElement.id) === 'rtab-bomp'
    && !(await page.$eval('#rpanel-bomp', (x) => x.hidden)), 'la flecha derecha mueve el foco y elige la pestaña siguiente');

  /* ── T30 · ENLACE VERIFICABLE ────────────────────────────────────────────────────── */
  await abrir(CU01);
  await page.selectOption('#termYears', '5');
  await asentar(page);
  const url = page.url();
  t.ok(/[?&]h=[0-9a-f]{16}/.test(url) && /[?&]ds=[0-9a-f]{16}/.test(url), 'T30: el enlace lleva la huella del escenario y la versión del catálogo');
  const hEmisor = await page.evaluate(() => document.getElementById('gateResumen').innerText.match(/huella ([0-9a-f]+)/)[1]);
  const receptor = await browser.newPage({ viewport: { width: 1440, height: 936 } });
  receptor.on('pageerror', (x) => errores.push(x.message));
  await abrirSesion(receptor);
  await receptor.goto(url, { waitUntil: 'domcontentloaded' });
  await receptor.waitForSelector('#stickyReco', { timeout: 20000 });
  await asentar(receptor);
  const rec = await receptor.evaluate(() => ({ ver: (document.querySelector('.estado-verificacion') || {}).textContent || '',
    h: document.getElementById('gateResumen').innerText.match(/huella ([0-9a-f]+)/)[1], term: document.getElementById('termYears').value }));
  t.ok(/Enlace verificado/.test(rec.ver) && rec.h === hEmisor && rec.term === '5',
    'T30: el receptor recalcula y obtiene el mismo escenario, catálogo y huella');
  await receptor.goto(url.replace(/([?&]h=)[0-9a-f]{4}/, '$1ffff'), { waitUntil: 'domcontentloaded' });
  await receptor.waitForSelector('#stickyReco', { timeout: 20000 });
  await asentar(receptor);
  t.ok(/no coincide/.test(await receptor.$eval('.estado-verificacion', (x) => x.textContent).catch(() => '')),
    'T30: una huella que no coincide se dice, no se ignora');
  await receptor.close();

  /* ── DESHACER ────────────────────────────────────────────────────────────────────── */
  await abrir(CU01);
  await page.selectOption('#techoUtil', '60');
  await asentar(page);
  await page.click('#btnDeshacer');
  await asentar(page);
  t.ok(await page.$eval('#techoUtil', (s) => s.value) === '70', 'el historial deshace el último cambio del escenario');

  t.ok(errores.length === 0, `sin excepciones de página (${errores.join(' | ') || 'ninguna'})`);
  await browser.close();
  process.exit(t.resumen('e2e-fortinet-rediseno'));
})().catch((e) => { console.error('ERROR E2E:', e.message); process.exit(2); });
