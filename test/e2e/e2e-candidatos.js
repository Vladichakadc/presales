'use strict';
/* E2E de la lista clicable de candidatos (SPEC B.2, petición del dueño 2026-09-15):
   «Equipos que cumplen · N» muestra las filas de candidatos, el clic elige otro equipo
   —selector único, ficha, aviso de desvío y BOM lo siguen— y «Volver al recomendado»
   restaura.
   CONTRATO NUEVO (2026-09-16, petición directa del dueño): la tarjeta va FIJA y sin
   scroll interno, así que la lista se compacta a los 6 primeros candidatos y un pie
   honesto («+ N más…») declara el resto — el selector de equipo del panel 1 los lista
   todos. Las N filas completas ya no cabrían en un panel fijo: fue el propio scroll
   que eso exigía lo que el dueño pidió quitar. */
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
  t.ok(filas === Math.min(cuenta, 6),
    `la lista pinta los candidatos hasta su tope compacto de 6 (${filas} de ${cuenta})`);
  if (cuenta > 6) {
    const masTxt = (await page.textContent('#verdict .ficha-cands-mas')) || '';
    t.ok(new RegExp(`\\+ ${cuenta - 6} más`).test(masTxt),
      `el pie declara honestamente los ${cuenta - 6} candidatos que no caben: «${masTxt.trim()}»`);
  }

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
