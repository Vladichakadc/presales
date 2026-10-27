'use strict';
/* global document */
/* E2E del piloto «del pliego al escenario» en el dimensionador Cisco (2026-10-27). La API de
   Anthropic no se llama: la ruta se intercepta con una respuesta grabada en la forma exacta del
   servidor (propuestas con su cita comprobada y descartes con su motivo). Lo que se comprueba es
   la página:
     · nada se aplica solo: sin marcar, «Aplicar» está deshabilitado y el escenario no cambia;
     · se aplican SOLO las filas marcadas, y el motor de siempre dimensiona con ellas;
     · los descartes se enseñan con su motivo;
     · el texto del pliego no viaja en el enlace del escenario;
     · sin clave (el servidor real de la corrida), el error se dice. */
const { cargarPlaywright, abrirSesion, asentar, contador, BASE } = require('./ayuda');

const RESPUESTA = {
  modelo: 'claude-opus-5-5',
  propuestas: [
    { campo: 'bw', n: 'Ancho de banda contratado', tipo: 'num', valor: 2, cita: 'un enlace de 2 Gbps simétricos', nota: '2 Gbps', citaVerificada: true },
    { campo: 'unit', n: 'Unidad del caudal', tipo: 'opcion', valor: '1000', cita: '2 Gbps', nota: '', citaVerificada: true },
    { campo: 'chkRedund', n: 'Doble fuente', tipo: 'bool', valor: true, cita: 'doble fuente de alimentación', nota: '', citaVerificada: true },
    { campo: 'reqPqc', n: 'Criptografía post-cuántica', tipo: 'opcion', valor: 'mlkem', cita: 'basado en ML-KEM', nota: '', citaVerificada: true },
  ],
  rechazadas: [{ campo: 'chkHa', n: 'Dos routers por sede', valor: 'true', cita: 'alta disponibilidad total', motivo: 'la cita no aparece literalmente en el texto' }],
};

(async () => {
  const { chromium } = cargarPlaywright();
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errores = [];
  page.on('pageerror', (e) => errores.push(e.message));
  const t = contador();
  await abrirSesion(page);
  await page.goto(BASE + '/dimensionador-cisco-catalyst8k.html', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#btnPliego', { timeout: 20000 });
  await asentar(page);

  t.ok(/no se guarda en este servidor/.test(await page.textContent('#pliegoAviso')), 'el aviso de confidencialidad está antes de enviar');

  // ── Sin clave (el servidor de la corrida arranca sin ANTHROPIC_API_KEY): el error se dice ──
  await page.fill('#pliegoTexto', 'Enlace de 500 Mbps.');
  await page.click('#btnPliego');
  await page.waitForFunction(() => /ANTHROPIC_API_KEY|servidor respondió/.test(document.getElementById('pliegoEstado').textContent), null, { timeout: 15000 });
  t.ok(/ANTHROPIC_API_KEY/.test(await page.textContent('#pliegoEstado')), 'sin clave, la página dice que falta la clave');

  // ── Con una respuesta grabada ──
  await page.route('**/api/escenario/desde-documento', (ruta) => ruta.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(RESPUESTA) }));
  await page.fill('#bw', '100');
  await page.selectOption('#unit', '1');
  await asentar(page);
  const antes = await page.inputValue('#pickModel').catch(() => '');
  await page.fill('#pliegoTexto', 'La sede central requiere un enlace de 2 Gbps simétricos, doble fuente de alimentación y cifrado basado en ML-KEM.');
  await page.click('#btnPliego');
  await page.waitForSelector('.tabla-pliego', { timeout: 15000 });
  const filas = await page.locator('.tabla-pliego tbody tr').count();
  t.ok(filas === 4, `cuatro propuestas en la tabla (${filas})`);
  t.ok(/2 Gbps simétricos/.test(await page.textContent('.tabla-pliego')), 'cada propuesta enseña su cita');
  t.ok(await page.isDisabled('#btnPliegoAplicar'), 'sin marcar nada, «Aplicar» está deshabilitado');
  t.ok(await page.inputValue('#bw') === '100' && !(await page.isChecked('#chkRedund')), 'proponer no cambia el escenario');
  t.ok(/la cita no aparece literalmente en el texto/.test(await page.textContent('#pliegoResultado')), 'los descartes se enseñan con su motivo');

  // Se marcan tres de las cuatro (no la de PQC): solo esas se aplican.
  const marcar = (i) => page.locator('.pliego-sel').nth(i).check();
  await marcar(0); await marcar(1); await marcar(2);
  await page.click('#btnPliegoAplicar');
  await asentar(page);
  t.ok(await page.inputValue('#bw') === '2' && await page.inputValue('#unit') === '1000', 'el caudal y la unidad marcados se aplicaron (2 Gbps)');
  t.ok(await page.isChecked('#chkRedund'), 'la doble fuente marcada se aplicó');
  t.ok(await page.inputValue('#reqPqc') === '', 'la PQC sin marcar NO se aplicó');
  const despues = await page.inputValue('#pickModel').catch(() => '');
  t.ok(despues && despues !== antes, `el motor de siempre redimensionó con lo aceptado (${antes} → ${despues})`);
  t.ok(!/pliego|sede%20central|ML-KEM/i.test(page.url()), 'el texto del pliego no viaja en el enlace del escenario');

  t.ok(!errores.length, `sin errores de JavaScript (${errores.join(' | ')})`);
  await browser.close();
  process.exit(t.resumen('e2e-pliego'));
})().catch((e) => { console.error(e); process.exit(1); });
