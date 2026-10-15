'use strict';
/* E2E de los puertos del chasis en el dimensionador Aruba (2026-10-15, revisión del panel 2
   pedida por el dueño): «selecciona e indica que cabe en determinado equipo cuando se selecciona
   el medio del puerto RJ45 o SFP, pero no valida si los equipos tienen ese tipo de puertos; y al
   cambiar de medio no se devuelve a un equipo inferior si este cumple».

   Medido en Chromium ANTES del cambio, sobre 2fd2a59:
     · la barra «cabe en …» iba un render por detrás: con SFP+ decía «no cabe en EC-10104»
       cuando el elegido ya era el EC-10106, y al volver a RJ-45 «cabe en EC-10106» con el
       selector ya en el EC-10104;
     · un enlace RJ-45 «cabía en EC-L» (6x SFP+, ningún cobre), y 3.000 Mbps por RJ-45 también;
     · soltar una elección manual que no cabía lo deshacía el oyente de bom.js.
   Y el selector «Segmento de instalación», que solo reordenaba la recomendación, se retira. */
const { cargarPlaywright, abrirDimensionador, asentar, contador } = require('./ayuda');

(async () => {
  const { chromium } = cargarPlaywright();
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errores = [];
  page.on('pageerror', (e) => errores.push(e.message));
  const t = contador();
  await abrirDimensionador(page);

  const fila = page.locator('.wan-fila').first();
  const medio = (v) => fila.locator('select[data-campo=medio]').selectOption(v);
  const leer = async () => {
    await asentar(page);
    return {
      pick: await page.inputValue('#pickModel'),
      barra: ((await page.textContent('#wanResumen')) || '').replace(/\s+/g, ' '),
      alerta: (await page.isVisible('#alertaEscalado')) ? ((await page.textContent('#alertaEscalado')) || '') : '',
      medio: await fila.locator('select[data-campo=medio]').inputValue(),
    };
  };

  t.ok(!(await page.$('#segSeg')), 'el selector «Segmento de instalación» ya no está en la página');

  // ── El medio mueve el equipo en los dos sentidos, y la barra nombra el de ESTE render ──
  await fila.locator('input[data-campo=down]').fill('100');
  let r = await leer();
  t.ok(r.pick === 'EC-10104' && /cabe en EC-10104/.test(r.barra), `RJ-45 a 100 Mbps: EC-10104 y «cabe en EC-10104» (${r.pick})`);
  await medio('SFP+ 10G');
  r = await leer();
  t.ok(r.pick === 'EC-10106' && /cabe en EC-10106/.test(r.barra), `SFP+ 10G: sube al EC-10106 y la barra lo nombra (${r.pick} · ${r.barra.slice(-40)})`);
  t.ok(/EC-10104 cumpliría por capacidad/.test(r.alerta) && /SFP\+ 10G sin jaula libre/.test(r.alerta), 'la alerta de escalado dice qué modelo no cabe y por qué');
  await medio('RJ45');
  r = await leer();
  t.ok(r.pick === 'EC-10104' && /cabe en EC-10104/.test(r.barra) && !r.alerta, `de vuelta a RJ-45: baja al EC-10104, la barra lo dice y la alerta se va (${r.pick})`);
  await medio('SFP28 25G');
  r = await leer();
  t.ok(r.pick === 'EC-10150', `SFP28 25G: solo el EC-10150 tiene jaulas SFP28 vigentes (${r.pick})`);
  await medio('RJ45');
  r = await leer();
  t.ok(r.pick === 'EC-10104', `y de vuelta a RJ-45, otra vez el EC-10104 (${r.pick})`);

  // ── Un RJ-45 no cabe en un chasis sin cobre ──
  await page.selectOption('#pickModel', 'EC-L');
  r = await leer();
  t.ok(r.pick === 'EC-L' && /no cabe en EC-L/.test(r.barra) && /R9Y49A/.test(r.barra),
    'elegir el EC-L con un enlace RJ-45 se respeta, pero la barra dice «no cabe» y la salida (transceptor 1000BASE-T)');
  // Cambiar los enlaces después suelta la elección: el escenario ya no es el que se eligió.
  await medio('SFP 1G');
  await medio('RJ45');
  r = await leer();
  t.ok(r.pick === 'EC-10104' && /EC-L estaba elegido/.test(r.alerta), `al cambiar el medio, el selector vuelve a seguir al dimensionamiento (${r.pick})`);

  // ── El caudal sube el medio cuando nadie lo eligió, y lo baja si vuelve ──
  await medio('RJ45'); // elegido igual al automático: sigue siendo automático
  await fila.locator('input[data-campo=down]').fill('3000');
  r = await leer();
  t.ok(r.medio === 'SFP+ 10G', `3.000 Mbps no van por un RJ-45 de 1 GbE: el medio sube a SFP+ 10G (${r.medio})`);
  await fila.locator('input[data-campo=down]').fill('300');
  r = await leer();
  t.ok(r.medio === 'RJ45', `al bajar a 300 Mbps vuelve a RJ-45 (${r.medio})`);
  // Elegido a mano, no se toca: la fila dice que no lleva el caudal y la barra avisa.
  await medio('SFP 1G');
  await fila.locator('input[data-campo=down]').fill('3000');
  r = await leer();
  const msg = (await fila.locator('[data-wan-msg]').textContent()) || '';
  t.ok(r.medio === 'SFP 1G' && /Cambia el medio a SFP\+ 10G/.test(msg), `medio elegido a mano: se respeta y la fila pide cambiarlo («${msg.slice(0, 60)}»)`);
  t.ok(/con aviso/.test(r.barra), 'y la barra lo marca en ámbar');
  await medio('SFP+ 10G');

  // ── Puertos contados: cuatro RJ-45 para enlaces y LAN en el EC-10104 ──
  await fila.locator('input[data-campo=down]').fill('100');
  await medio('RJ45');
  for (let i = 0; i < 2; i++) { await page.click('#btnAddWan'); await asentar(page); }
  const filas = page.locator('.wan-fila');
  for (let i = 1; i < 3; i++) await filas.nth(i).locator('input[data-campo=down]').fill('50');
  r = await leer();
  t.ok(r.pick !== 'EC-10104' && /EC-10104 cumpliría por capacidad/.test(r.alerta) && /falta 1 de los 2 puertos LAN/.test(r.alerta),
    `tres enlaces + 2 LAN no caben en los 4 RJ-45 del EC-10104: pasa al ${r.pick} y lo dice`);

  // ── Campos que no aportan al escenario: inactivos, con su motivo ──
  for (let i = 0; i < 3; i++) await filas.nth(i).locator('select[data-campo=tipo]').selectOption('MPLS L3');
  await asentar(page);
  t.ok(await page.isDisabled('#chkBreakout'), 'todo MPLS: el Local Breakout queda inactivo (no hay Internet que sacar en local)');
  t.ok(!/chkBreakout=/.test(page.url()), 'y no viaja en el enlace del escenario');
  await filas.nth(2).locator('select[data-campo=tipo]').selectOption('DIA');
  await asentar(page);
  t.ok(!(await page.isDisabled('#chkBreakout')), 'con un enlace de Internet vuelve a estar activo');
  t.ok(await page.isDisabled('#boostProfile'), 'sin Boost, el perfil de datos de Boost está inactivo');
  await page.click('#famSeg button[data-v=sucursal]');
  await asentar(page);
  t.ok(await page.isDisabled('#fecMode') && await page.isDisabled('#selTrafico'), 'con gateways, FEC e IMIX (solo de EdgeConnect) quedan inactivos');
  await page.click('#famSeg button[data-v=any]');
  await asentar(page);
  t.ok(!(await page.isDisabled('#fecMode')), 'y vuelven al dejar la familia en «Indiferente»');

  t.ok(errores.length === 0, 'sin errores de JS' + (errores.length ? ': ' + errores.join(' | ') : ''));
  await browser.close();
  process.exit(t.resumen('e2e-aruba-puertos'));
})().catch((e) => { console.error('ERROR E2E:', e.message); process.exit(2); });
