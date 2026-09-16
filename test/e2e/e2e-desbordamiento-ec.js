'use strict';
/* E2E del desbordamiento de la línea EdgeConnect (2026-09-16, reporte del dueño):
   enlaces 5000 Mbps MPLS + 5000 Mbps Internet → el requerimiento de diseño del motor
   (≈21,4 Gbps con las hipótesis por defecto) supera el techo oficial de la familia
   (EC-10150, 12 Gbps publicados). Antes de la corrección el veredicto era un callejón
   sin salida; ahora debe:
     1. Declarar el techo oficial y cuantificar el exceso.
     2. Ofrecer las vías que sí sostiene la fuente oficial (EC-V por licencia/vCPU,
        reparto del fabric, revisión de hipótesis, selección deliberada del EC-10150).
     3. Mantener el EC-10150 seleccionable a mano en el combo (se cotiza con la revisión
        de diseño en rojo — nunca como recomendación).
     4. No romper el resto: con «Indiferente» los gateways siguen respondiendo, y con las
        hipótesis del motor al mínimo (IMIX 1,00 · FEC off · margen 0) el EC-10150 SÍ
        queda recomendado — la prueba viva de que la vía «revisar hipótesis» funciona. */
const { cargarPlaywright, abrirDimensionador, contador } = require('./ayuda');

async function enlazar5000mas5000(page) {
  await page.locator('.wan-fila').first().locator('select[data-campo=tipo]').selectOption('MPLS L3');
  await page.locator('.wan-fila').first().locator('input[data-campo=down]').fill('5000');
  await page.click('#btnAddWan');
  await page.waitForTimeout(300);
  const filas = page.locator('.wan-fila');
  await filas.nth(1).locator('select[data-campo=tipo]').selectOption('DIA');
  await filas.nth(1).locator('input[data-campo=down]').fill('5000');
  await page.waitForTimeout(900);
}

(async () => {
  const { chromium } = cargarPlaywright();
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on('dialog', (d) => d.accept());
  const t = contador();

  await abrirDimensionador(page);
  await enlazar5000mas5000(page);

  // ── 0 · Regla HA del dueño (2026-09-17): ≥2 enlaces de ≥5 Gbps ⇒ HA pre-marcado ──
  t.ok(await page.isChecked('#chkHa'), 'con 2 enlaces de 5 Gbps, HA 1+1 queda pre-marcado por la regla de la casa');
  t.ok(await page.isVisible('#haAutoHint'), 'el hint declara por qué se pre-marcó (EdgeHA, disponibilidad ≠ caudal)');

  // ── 1 · famSeg = EdgeConnect SD-WAN: el desbordamiento guiado ──────────────
  await page.click('#famSeg button[data-v=ec]');
  await page.waitForTimeout(900);
  let verdict = (await page.textContent('#verdict')) || '';
  t.ok(/Ningún modelo cumple/.test(verdict), 'con 21,4 Gbps de requerimiento no hay appliance EC que cumpla (no se inventa capacidad)');
  t.ok(/supera el techo oficial de toda la línea EdgeConnect/.test(verdict), 'el veredicto declara el desbordamiento de la línea');
  t.ok(/EC-10150/.test(verdict) && /12(\.|,)0?00\s*0*\s*(Mbps|Gbps)|12 Gbps/.test(verdict), 'nombra el EC-10150 y su techo publicado');
  t.ok(/EC-V/.test(verdict), 'ofrece la vía EC-V (licencia + vCPU, sin techo de hardware publicado)');
  t.ok(/Repartir el fabric/.test(verdict), 'ofrece el reparto del fabric entre varios appliances');
  t.ok(/hipótesis del motor/.test(verdict), 'señala las hipótesis del motor (IMIX/FEC/margen) como palanca');
  t.ok(/Selección deliberada/.test(verdict) && /S2N65A/.test(verdict), 'deja la selección deliberada del EC-10150 con su SKU real');
  t.ok(/disponibilidad, no caudal/.test(verdict), 'el bloque declara que el par HA no divide el dimensionado (activo/standby, VSG)');
  t.ok(!/Por encima del catálogo: repartir/.test(verdict), 'la salida genérica queda absorbida por el bloque completo');

  // El combo mantiene el EC-10150 como selección deliberada posible.
  const opEC10150 = await page.locator('#pickModel option[value="EC-10150"]').count();
  t.ok(opEC10150 === 1, 'el EC-10150 sigue seleccionable a mano en el combo');

  // Elegirlo cotiza el BOM y la revisión del diseño marca el exceso en rojo.
  // OJO: la «REVISIÓN DEL DISEÑO» viaja en meta.notas → BOM.comoTexto → el textarea
  // #bomOut; su .value programático NO aparece en el textContent del panel.
  await page.selectOption('#pickModel', 'EC-10150');
  await page.waitForTimeout(900);
  await page.click('[data-tab=bom]');
  await page.waitForTimeout(700);
  const bomTxt = (await page.inputValue('#bomOut')) || '';
  t.ok(/Caudal WAN insuficiente/.test(bomTxt), 'con el EC-10150 elegido a mano, la revisión del diseño marca el exceso en rojo');
  t.ok(/Par HA 1\+1/.test(bomTxt), 'con HA pre-marcado, el BOM cotiza el par (1× estándar + 1× SKU HA del mismo tier)');

  // Desmarcar HA contra la regla: se respeta (no se re-marca) y la revisión lo declara.
  await page.click('[data-tab=calc]');
  await page.waitForTimeout(400);
  await page.click('#chkHa');
  await page.waitForTimeout(700);
  t.ok(!(await page.isChecked('#chkHa')), 'desmarcar HA a mano se respeta aunque la regla siga activa');
  t.ok(!(await page.isVisible('#haAutoHint')), 'el hint de auto-marcado se oculta al desmarcar');
  await page.click('[data-tab=bom]');
  await page.waitForTimeout(700);
  const bomSinHa = (await page.inputValue('#bomOut')) || '';
  t.ok(/SIN par HA/.test(bomSinHa) && !/Par HA 1\+1: 1x/.test(bomSinHa),
    'la revisión del diseño registra el sitio de 10 Gbps sin par HA (y ya no cotiza el segundo nodo)');
  await page.click('[data-tab=calc]');
  await page.waitForTimeout(400);
  await page.click('#chkHa');
  await page.waitForTimeout(500);

  // ── 2 · famSeg = Indiferente: los gateways siguen respondiendo ─────────────
  await page.click('#famSeg button[data-v=any]');
  await page.waitForTimeout(900);
  verdict = (await page.textContent('#verdict')) || '';
  const pickAny = await page.inputValue('#pickModel');
  t.ok(!/Ningún modelo cumple/.test(verdict) && !!pickAny,
    'con «Indiferente» los gateways responden al escenario (' + pickAny + ')');

  // ── 3 · Hipótesis al mínimo: el EC-10150 sí queda recomendado ─────────────
  // Esta sección pescó un defecto REAL del motor (2026-09-16): `headroom_pct || 20`
  // se tragaba el 0 del slider y aplicaba un 20 % fantasma (12,6 Gbps en vez de los
  // 10,5 prometidos por el propio veredicto). La guardia queda: el requerimiento
  // visible debe caer a ≈10,5 Gbps y entrar en el EC-10150.
  await page.click('#famSeg button[data-v=ec]');
  await page.selectOption('#selTrafico', 'BULK_BACKUP');
  await page.selectOption('#fecMode', 'off');
  // $eval ejecuta la función EN la página (ahí Event existe); se toma del propio
  // documento del elemento para no declarar un global que en Node no significa nada.
  await page.$eval('#head', (el) => {
    el.value = '0';
    el.dispatchEvent(new el.ownerDocument.defaultView.Event('input', { bubbles: true }));
  });
  await page.waitForTimeout(900);
  verdict = (await page.textContent('#verdict')) || '';
  const needMin = (await page.textContent('#needLbl')) || '';
  t.ok(/10[.,]5 Gbps/.test(needMin), 'el requerimiento baja a ≈10,5 Gbps con las hipótesis al mínimo (' + needMin.trim() + ')');
  const pickMin = await page.inputValue('#pickModel');
  t.ok(pickMin === 'EC-10150' && !/Ningún modelo cumple/.test(verdict),
    'con IMIX 1,00 + FEC off + margen 0 el requerimiento (≈10,5 Gbps) entra en el EC-10150 (' + pickMin + ')');

  // ── 3b · Asistente de cableado EdgeHA (mejora propuesta y aceptada, 2026-09-17) ──
  // Aquí SÍ hay ficha (el EC-10150 quedó recomendado), con HA marcado y los dos enlaces
  // de 5 Gbps: la ficha pinta qué enlace va a qué chasis del par, con la interconexión
  // EdgeHA declarada. En el escenario de desbordamiento NO se puede probar: allí el
  // veredicto honesto («ningún modelo cumple») sustituye a la ficha a propósito.
  let fichaHa = (await page.textContent('#verdict')) || '';
  t.ok(/Cableado del par EdgeHA/.test(fichaHa), 'con HA y 2 enlaces la ficha pinta «Cableado del par EdgeHA»');
  t.ok(/Nodo A/.test(fichaHa) && /Nodo B/.test(fichaHa), 'asigna cada enlace a un chasis del par (A/B)');
  t.ok(/Enlace EdgeHA/.test(fichaHa) && /sin switch/.test(fichaHa), 'declara la interconexión directa entre chasis, sin switch');
  t.ok(/MPLS L3/.test(fichaHa) && /DIA/.test(fichaHa), 'nombra los transportes declarados en el escenario');
  // Dedup «Interfaces» (validación del dueño, 2026-09-17): la misma cadena se pintaba en
  // «Características del equipo» Y en «Configuración de puertos». Ahora, una sola vez.
  t.ok((fichaHa.match(/Interfaces/g) || []).length === 1,
    '«Interfaces» aparece UNA sola vez en la ficha (solo en «Configuración de puertos»)');
  // Y al apagar HA con la ficha pintada, la sección desaparece (no es decoración fija).
  await page.click('#chkHa');
  await page.waitForTimeout(700);
  fichaHa = (await page.textContent('#verdict')) || '';
  t.ok(!/Cableado del par EdgeHA/.test(fichaHa), 'al desmarcar HA con la ficha pintada, la sección EdgeHA desaparece');
  await page.click('#chkHa');
  await page.waitForTimeout(500);

  // ── 4 · Regresión: escenario pequeño sigue recomendando EC pequeño ────────
  await page.click('#btnLimpiarEscenario');
  await page.waitForSelector('#users', { timeout: 20000 });
  await page.waitForTimeout(700);
  await page.click('#famSeg button[data-v=ec]');
  await page.locator('.wan-fila').first().locator('input[data-campo=down]').fill('200');
  await page.waitForTimeout(900);
  const pickPeq = await page.inputValue('#pickModel');
  t.ok(/^EC-/.test(pickPeq), 'escenario pequeño: recomienda un EdgeConnect (' + pickPeq + ')');
  t.ok(!(await page.isChecked('#chkHa')), 'escenario pequeño: la regla HA no se dispara (un solo enlace de 200 Mbps)');

  await browser.close();
  process.exit(t.resumen('e2e-desbordamiento-ec'));
})().catch((e) => { console.error('ERROR E2E:', e.message); process.exit(2); });
