'use strict';
/* E2E de la lista clicable de candidatos (SPEC B.2, petición del dueño 2026-09-15):
   «Equipos que cumplen · N» muestra las N filas (no solo el recomendado), el clic elige
   otro equipo —selector único, ficha, aviso de desvío y BOM lo siguen— y «Volver al
   recomendado» restaura. */
const { cargarPlaywright, abrirDimensionador, contador } = require('./ayuda');

(async () => {
  const { chromium } = cargarPlaywright();
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const t = contador();

  await abrirDimensionador(page);
  await page.fill('#users', '60');
  await page.locator('.wan-fila').first().locator('input[data-campo=down]').fill('200');
  await page.waitForTimeout(900);

  const cuenta = parseInt((((await page.textContent('#verdict .ficha-cuenta')) || '').match(/\d+/) || ['0'])[0]);
  const filas = await page.locator('#verdict .ficha-cand').count();
  t.ok(cuenta >= 2, `varios equipos cumplen (contador: ${cuenta})`);
  t.ok(filas === cuenta, `la lista pinta tantas filas como anuncia el contador (${filas})`);

  const recId = ((await page.locator('#verdict .ficha-cand:has(.cand-badge.rec) b').first().textContent()) || '').trim();
  t.ok(!!recId, `hay fila con insignia «recomendado» (${recId})`);

  const otra = page.locator('#verdict .ficha-cand:not(.on)').first();
  const otraId = ((await otra.locator('b').textContent()) || '').trim();
  await otra.click();
  await page.waitForTimeout(900);
  t.ok((await page.inputValue('#pickModel')) === otraId, `el clic elige otro equipo y el selector único lo sigue (${otraId})`);
  t.ok(await page.isVisible('#verdict .ficha-desvio'), 'aparece el aviso «elegido a mano» con su vuelta al recomendado');

  await page.click('[data-tab=bom]');
  await page.waitForTimeout(600);
  const bom = (await page.textContent('#pane-bom')) || '';
  t.ok(bom.includes(otraId), `el BOM cotiza el equipo elegido en la lista (${otraId})`);

  await page.click('[data-tab=calc]');
  await page.waitForTimeout(300);
  await page.click('#verdict .ficha-volver');
  await page.waitForTimeout(900);
  t.ok((await page.inputValue('#pickModel')) === recId, `«Volver al recomendado» restaura ${recId}`);
  t.ok((await page.locator('#verdict .ficha-desvio').count()) === 0, 'el aviso de desvío desaparece al volver');

  await browser.close();
  process.exit(t.resumen('e2e-candidatos'));
})().catch((e) => { console.error('ERROR E2E:', e.message); process.exit(2); });
