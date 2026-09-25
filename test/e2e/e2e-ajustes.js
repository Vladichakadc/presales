'use strict';
/* E2E de las cantidades ajustadas a mano (mejora propuesta y aprobada por el dueño,
   2026-09-16). Lo que se conduce aquí es el ciclo completo que haría mentiroso el ajuste
   si fallara cualquiera de sus partes:
     1. la línea calculada ofrece el control (borde discontinuo) con la cifra del motor;
     2. ajustarla cambia el subtotal y DECLARA el badge con la cifra calculada;
     3. el ajuste viaja en la URL y SOBREVIVE a la recarga (estado compartido);
     4. el texto plano lo enumera en su sección (es lo que se pega en el correo);
     5. devolverla a la cifra del motor PODA el ajuste — no queda rastro en la URL;
     6. una cantidad fuera de rango no se puede escribir: se repone la calculada. */
const { cargarPlaywright, abrirDimensionador, asentar, contador } = require('./ayuda');

(async () => {
  const { chromium } = cargarPlaywright();
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const t = contador();
  const ok = t.ok;

  await abrirDimensionador(page);

  // Escenario mínimo con BOM: usuarios + un enlace WAN (el motor necesita ambos).
  await page.fill('#users', '60');
  await page.locator('.wan-fila').first().locator('input[data-campo=down]').fill('200');
  await asentar(page);
  await page.click('[data-tab=bom]');
  await asentar(page);

  // 1 · el control existe en las líneas calculadas, con la cifra del motor
  const nAjustar = await page.locator('#bomTabla [data-bom-ajustar]').count();
  ok(nAjustar >= 3, 'las líneas calculadas llevan control de cantidad (' + nAjustar + ')');
  const primera = page.locator('#bomTabla [data-bom-ajustar]').first();
  const calc = await primera.getAttribute('data-bom-calc');
  ok(/^\d+$/.test(calc || '') && parseInt(calc, 10) >= 1, 'data-bom-calc guarda la cifra del motor (' + calc + ')');

  // 2 · ajustar: badge declarado + subtotal actualizado
  const subAntes = await primera.locator('xpath=ancestor::tr[1]').locator('td.r').last().textContent();
  await primera.fill(String(parseInt(calc, 10) + 2));
  await primera.press('Tab'); // el listener es change: se dispara al salir del campo
  await asentar(page);
  const bomTxt = (await page.textContent('#pane-bom')) || '';
  ok(/Cantidad ajustada a mano — el cálculo decía \d+/.test(bomTxt), 'el badge declara el ajuste con la cifra del motor');
  const subDespues = await page.locator('#bomTabla [data-bom-ajustar]').first().locator('xpath=ancestor::tr[1]').locator('td.r').last().textContent();
  ok(subAntes !== subDespues, 'el subtotal de la línea cambia con el ajuste (' + (subAntes || '').trim() + ' → ' + (subDespues || '').trim() + ')');

  // 3 · viaja en la URL y sobrevive a la recarga
  ok(/bomAjustes=/.test(page.url()), 'el ajuste viaja en la URL del escenario');
  await page.goto(page.url(), { waitUntil: 'domcontentloaded' }); // sin load: Google Fonts puede colgarlo (ver ayuda.js)
  await page.waitForSelector('#users', { timeout: 20000 });
  await asentar(page);
  await page.click('[data-tab=bom]');
  await asentar(page);
  const valorTrasRecarga = await page.locator('#bomTabla [data-bom-ajustar]').first().inputValue();
  ok(valorTrasRecarga === String(parseInt(calc, 10) + 2), 'tras recargar, la línea sigue ajustada (' + valorTrasRecarga + ')');
  ok(/Cantidad ajustada a mano/.test((await page.textContent('#pane-bom')) || ''), 'y el badge sobrevive con ella');

  // 4 · el texto plano lo enumera (es lo que se pega en el correo)
  const txt = await page.inputValue('#bomOut');
  ok(/CANTIDADES AJUSTADAS A MANO/.test(txt), 'el texto plano lleva la sección de ajustes');

  // 5 · volver a la cifra del motor PODA el ajuste
  const misma = page.locator('#bomTabla [data-bom-ajustar]').first();
  await misma.fill(calc);
  await misma.press('Tab');
  await asentar(page);
  ok(!/Cantidad ajustada a mano/.test((await page.textContent('#pane-bom')) || ''), 'al volver a la cifra del motor el badge desaparece');
  const urlFinal = decodeURIComponent(page.url());
  ok(!/bomAjustes=%7B..|bomAjustes=\{..|\bbomAjustes=.*sku:/.test(urlFinal), 'y el ajuste se poda de la URL (no queda rastro)');

  // 6 · fuera de rango: se repone la cifra calculada y no se escribe nada
  const otra = page.locator('#bomTabla [data-bom-ajustar]').first();
  await otra.fill('0');
  await otra.press('Tab');
  await asentar(page);
  ok((await page.locator('#bomTabla [data-bom-ajustar]').first().inputValue()) === calc, 'un 0 se repone a la cifra calculada (' + calc + ')');
  ok(!/bomAjustes=.*sku:/.test(decodeURIComponent(page.url())), 'y no queda ajuste escrito');

  await browser.close();
  // OJO: t.fallos es un ARRAY y [] es truthy — salir con el retorno de resumen(), no con
  // la veracidad del array, o el script reportaría fallo con todo en verde.
  process.exit(t.resumen('e2e-ajustes'));
})().catch((e) => { console.error(e); process.exit(1); });
