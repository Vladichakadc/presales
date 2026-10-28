'use strict';
/* «Exigir PQC» respeta el sistema operativo de los gateways (mejora aprobada el 2026-10-28). La
   PPK de los gateways de Aruba está documentada con AOS-8 (guía de AOS-8 y notas de la 8.12.0.5),
   no con AOS-10. Con gateways de sucursal y la PQC exigida: en AOS 10 ninguno la trae documentada
   y la página lo dice con su motivo; en AOS 8 recomienda uno. */
const { cargarPlaywright, abrirDimensionador, asentar, contador } = require('./ayuda');

(async () => {
  const { chromium } = cargarPlaywright();
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errores = [];
  page.on('pageerror', (e) => errores.push(e.message));
  const t = contador();
  await abrirDimensionador(page);

  // Sin enlaces WAN la página no dimensiona: uno de 100 Mbps, como las demás baterías de Aruba.
  await page.locator('.wan-fila').first().locator('input[data-campo=down]').fill('100');
  await asentar(page);
  await page.click('#famSeg button[data-v="sucursal"]');
  await asentar(page);
  await page.selectOption('#reqPqc', 'clave');
  await asentar(page);

  await page.click('#soSeg button[data-v="aos10"]');
  await asentar(page);
  const con10 = ((await page.textContent('body')) || '').replace(/\s+/g, ' ');
  t.ok(/su documento la da con AOS 8; con AOS 10 \(Central\) no consta/.test(con10),
    'con AOS 10, el gateway sale apartado: su PPK es de AOS 8 y con AOS 10 no consta');

  await page.click('#soSeg button[data-v="aos8"]');
  await asentar(page);
  const con8 = ((await page.textContent('#verdict')) || '').replace(/\s+/g, ' ');
  t.ok(/Gateway 9[0-9]{3}|\b7[0-9]{3}/.test(con8), `con AOS 8, recomienda un gateway con la PPK documentada (${con8.slice(0, 120)})`);
  const cuerpo8 = ((await page.textContent('body')) || '').replace(/\s+/g, ' ');
  t.ok(!/con AOS 8 \(Mobility Conductor\) no consta/.test(cuerpo8), 'y con AOS 8 no aparta por el sistema operativo');

  t.ok(errores.length === 0, 'sin errores de JS' + (errores.length ? ': ' + errores.join(' | ') : ''));
  await browser.close();
  process.exit(t.resumen('e2e-pqc-so-aruba'));
})().catch((e) => { console.error('ERROR E2E:', e.message); process.exit(2); });
