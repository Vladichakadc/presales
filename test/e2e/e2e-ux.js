'use strict';
/* E2E de las mejoras UX del 2026-09-15 (peticiones directas del dueño): botón único de
   copiar enlace, «Limpiar escenario», cálculo declarado del destino de tráfico, tier
   automático sincronizado con el módulo 2, unidades por HA sin campo cantidad, orden de
   la pestaña BOM (lista primero, añadir al final), BOM editable (retirar/restaurar con
   la omisión en la URL) y licenciamiento SSE por usuario con su línea PENDIENTE. */
const { cargarPlaywright, abrirDimensionador, contador } = require('./ayuda');

(async () => {
  const { chromium } = cargarPlaywright();
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on('dialog', d => d.accept());
  const t = contador();
  const ok = t.ok;

  await abrirDimensionador(page);

  // D1 · un solo botón «copiar enlace»
  const nCopiar = await page.$$eval('button', bs => bs.filter(b => /copiar enlace/i.test(b.textContent || '')).length);
  ok(nCopiar === 1, 'un solo botón «Copiar enlace» (hay ' + nCopiar + ')');

  // D7 · sin campo cantidad
  ok(await page.locator('#qty').count() === 0, 'el campo Cantidad ya no existe');

  // D2 · limpiar escenario
  await page.fill('#users', '60');
  await page.locator('.wan-fila').first().locator('input[data-campo=down]').fill('200');
  await page.waitForTimeout(700);
  await page.click('#btnLimpiarEscenario');
  await page.waitForSelector('#users', { timeout: 20000 });
  await page.waitForTimeout(700);
  ok((await page.inputValue('#users')) === '', '«Limpiar escenario» deja los campos en su defecto');
  ok(!/users=/.test(page.url()), 'la URL queda desnuda tras limpiar');

  // Escenario base para el resto
  await page.fill('#users', '60');
  await page.locator('.wan-fila').first().locator('input[data-campo=down]').fill('200');
  await page.waitForTimeout(800);

  // D3 · destino del tráfico declara el cálculo
  const hintHib = (await page.textContent('#destHint')) || '';
  ok(/×1,00|sin sobrecoste/i.test(hintHib), 'destino Híbrido declara su cálculo (×1,00)');
  await page.click('#destSeg button[data-v=cloud]');
  await page.waitForTimeout(500);
  const hintCloud = (await page.textContent('#destHint')) || '';
  ok(/\+5 %|×1,05/.test(hintCloud), 'destino Cloud-First declara su +5 % (×1,05)');
  await page.click('#destSeg button[data-v=hibrido]');
  await page.waitForTimeout(400);

  // D8 · tier automático declara el tier deducido
  const autoTxt = await page.locator('#selTier option').first().textContent();
  ok(/Automático — .+ \(Σ enlaces WAN/.test(autoTxt), 'tier «Automático» muestra el deducido: ' + autoTxt.trim());

  // D7b · HA => 2 unidades en el BOM (con Advanced, cuya escalera HA cubre todos los
  // tiers; On-Premises tiene su propia escalera HA E-STU desde el 2026-09-16 — #17)
  await page.check('#chkAiops');
  await page.waitForTimeout(500);
  await page.check('#chkHa');
  await page.waitForTimeout(700);
  await page.click('[data-tab=bom]');
  await page.waitForTimeout(600);
  let bomTxt = (await page.textContent('#pane-bom')) || '';
  ok(/HA — .*segundo nodo|segundo nodo del par/.test(bomTxt), 'HA 1+1 cotiza el segundo nodo sin campo cantidad');
  // D7c · HA en On-Premises (#17, cerrado 2026-09-16): el segundo nodo lleva su SKU
  // HA E-STU propio (escalera «On-Premises High Availability» del QuickSpecs), ya no 2× estándar.
  // chkOnprem vive dentro de <details class="adv">: hay que abrir el menú antes de marcarla.
  await page.click('[data-tab=calc]');
  await page.waitForTimeout(300);
  await page.click('details.adv summary');
  await page.waitForTimeout(200);
  await page.check('#chkOnprem');
  await page.waitForTimeout(500);
  await page.click('[data-tab=bom]');
  await page.waitForTimeout(600);
  bomTxt = (await page.textContent('#pane-bom')) || '';
  ok(/On-Premises HA — .*segundo nodo del par/.test(bomTxt.replace(/\s+/g, ' ')),
    'HA on-prem cotiza el segundo nodo con SKU HA E-STU (#17)');
  await page.click('[data-tab=calc]');
  await page.waitForTimeout(300);
  await page.uncheck('#chkOnprem');
  await page.waitForTimeout(300);
  await page.click('[data-tab=calc]');
  await page.waitForTimeout(300);
  await page.uncheck('#chkHa');
  await page.uncheck('#chkAiops');
  await page.waitForTimeout(500);

  // D11 · tarjeta gráfica del equipo (petición directa del dueño, 2026-09-16): la foto
  // oficial corona la ficha, CAMBIA al elegir otro equipo, y el conmutador trae las
  // vistas frontal/trasera que publica el documento de origen. Modelo sin foto oficial:
  // aviso honesto, nunca un «parecido».
  const imgSel = '#verdict .ficha-vista img';
  await page.waitForSelector(imgSel, { timeout: 20000 });
  const src1 = await page.$eval(imgSel, (i) => i.getAttribute('src'));
  ok(/\/img\/equipos\/.+-front\.webp$/.test(src1), 'la ficha corona con la foto oficial del equipo (' + src1 + ')');
  const pie1 = ((await page.textContent('#verdict .ficha-vista figcaption')) || '').replace(/\s+/g, ' ');
  ok(/mm|pulgadas|in\b/.test(pie1) && /QuickSpecs|Hardware Reference|DS serie|spec sheet/i.test(pie1),
    'el pie declara tamaño y procedencia: ' + pie1.trim().slice(0, 90));
  // ··· cambia con la selección
  const cands = await page.$$('#verdict .ficha-cand');
  ok(cands.length >= 2, 'hay al menos 2 candidatos para probar el cambio de foto (' + cands.length + ')');
  await cands[1].click();
  await page.waitForTimeout(600);
  const src2 = await page.$eval(imgSel, (i) => i.getAttribute('src'));
  ok(src2 !== src1, 'la foto cambia al seleccionar otro equipo (' + src1.split('/').pop() + ' → ' + src2.split('/').pop() + ')');
  // ··· conmutador frontal/trasera (los EC pequeños de este escenario traen ambas caras)
  const nTabs = await page.locator('#verdict .ficha-vista-tab').count();
  ok(nTabs === 2, 'el equipo trae las dos vistas, frontal y trasera (' + nTabs + ' pestañas)');
  await page.click('#verdict .ficha-vista-tab[data-vista=rear]');
  await page.waitForTimeout(250);
  const srcRear = await page.$eval(imgSel, (i) => i.getAttribute('src'));
  ok(/-rear\.webp$/.test(srcRear), '«Trasera» carga la cara trasera (' + srcRear.split('/').pop() + ')');
  await page.click('#verdict .ficha-vista-tab[data-vista=front]');
  await page.waitForTimeout(250);
  ok((await page.$eval(imgSel, (i) => i.getAttribute('src'))) === src2, '«Frontal» devuelve la cara frontal');
  // ··· volver al recomendado y probar el hueco honesto con un modelo sin foto
  await page.click('#verdict-volver');
  await page.waitForTimeout(500);
  await page.selectOption('#pickModel', 'EC-S');
  await page.waitForTimeout(600);
  ok(await page.locator('#verdict .ficha-vista-vacia').count() === 1,
    'un modelo sin foto oficial declara el hueco, no enseña una foto prestada');
  const txtVacio = (await page.textContent('#verdict .ficha-vista-vacia')) || '';
  ok(/Sin foto oficial/.test(txtVacio), 'el aviso dice por qué no hay foto: ' + txtVacio.trim().slice(0, 70));
  await page.click('#verdict-volver');
  await page.waitForTimeout(500);

  // D9/D10 · orden de secciones: Lista primero, Añadir al final
  await page.click('[data-tab=bom]');
  await page.waitForTimeout(600);
  const secciones = await page.$$eval('#pane-bom h2', hs => hs.map(h => h.textContent.trim().slice(0, 30)));
  ok(/^Lista de materiales/.test(secciones[0]), 'la lista de materiales va primera');
  ok(/^Añadir a la lista/.test(secciones[secciones.length - 1]), '«Añadir a la lista» va al final');

  // D10b · retirar y restaurar una línea calculada
  const nAntes = await page.locator('#bomTabla tbody tr').count();
  const nOmitir = await page.locator('#bomTabla [data-bom-omitir]').count();
  ok(nOmitir >= 3, 'todas las líneas calculadas llevan botón de retirar (' + nOmitir + ')');
  await page.locator('#bomTabla [data-bom-omitir]').first().click();
  await page.waitForTimeout(600);
  const nDespues = await page.locator('#bomTabla [data-bom-omitir]').count();
  ok(nDespues === nOmitir - 1, 'la línea retirada sale de la tabla (quedan ' + nDespues + ' líneas con botón)');
  const retTxt = (await page.textContent('#bomRetiradas')) || '';
  ok(/Líneas retiradas/.test(retTxt), 'aparece «Líneas retiradas» restaurable');
  ok(/bomOmitidas=/.test(page.url()), 'la omisión viaja en la URL del escenario');
  await page.click('#bomRetiradas summary');
  await page.waitForTimeout(200);
  await page.click('#bomRetiradas .bom-restaurar');
  await page.waitForTimeout(600);
  ok(await page.locator('#bomTabla [data-bom-omitir]').count() === nOmitir, '«Restaurar» la devuelve a la tabla');

  // D5 · SSE sin usuarios => PENDIENTE + campo marcado; con usuarios => cantidad
  await page.click('[data-tab=calc]');
  await page.waitForTimeout(300);
  await page.fill('#users', '');
  await page.selectOption('#selSeguridad', 'sse');
  await page.waitForTimeout(700);
  ok(await page.isVisible('#usersReqTag'), 'con SSE y sin usuarios, el campo se marca como requerido');
  await page.click('[data-tab=bom]');
  await page.waitForTimeout(600);
  bomTxt = (await page.textContent('#pane-bom')) || '';
  ok(/PENDIENTE: declara los usuarios/.test(bomTxt), 'la línea SSE queda PENDIENTE sin usuarios (no inventa una licencia)');
  await page.click('[data-tab=calc]');
  await page.waitForTimeout(300);
  await page.fill('#users', '60');
  await page.waitForTimeout(700);
  ok(await page.isHidden('#usersReqTag'), 'la marca desaparece al declarar usuarios');
  await page.click('[data-tab=bom]');
  await page.waitForTimeout(600);
  bomTxt = (await page.textContent('#pane-bom')) || '';
  ok(/60 usuarios/.test(bomTxt), 'la línea SSE toma la cantidad de usuarios declarada');
  await page.click('[data-tab=calc]');
  await page.waitForTimeout(300);
  await page.selectOption('#selSeguridad', 'none');
  await page.waitForTimeout(400);

  // Regresión rápida SFP (el BOM cambió con filasVivas)
  await page.click('[data-tab=calc]');
  await page.waitForTimeout(300);
  const fila = page.locator('.wan-fila').first();
  await fila.locator('select[data-campo=medio]').selectOption('SFP+ 10G');
  await page.waitForTimeout(600);
  await page.selectOption('#pickModel', 'EC-10150');
  await page.waitForTimeout(700);
  ok(await page.isVisible('#sfpChooser'), 'regresión: chooser SFP sigue apareciendo');
  await page.click('[data-tab=bom]');
  await page.waitForTimeout(500);
  bomTxt = (await page.textContent('#pane-bom')) || '';
  ok(/PENDIENTE DE SELECCIÓN/.test(bomTxt), 'regresión: óptica PENDIENTE DE SELECCIÓN en el BOM');

  await browser.close();
  process.exit(t.resumen('e2e-ux'));
})().catch(e => { console.error('ERROR E2E:', e.message); process.exit(2); });
