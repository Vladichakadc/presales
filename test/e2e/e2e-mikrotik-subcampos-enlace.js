'use strict';
/* Los bloques de BGP, PPPoE y CAPsMAN de MikroTik se ven al abrir un enlace (pendiente anotado al
   cerrar el PR #77, ejecutado por encargo del dueño el 2026-11-11: «ejecuta pendiente y ciérralo»).
   ESTADO restaura la casilla sin disparar su `change`, y el bloque solo se abría en ese `change`: con
   la opción marcada, sus campos quedaban ocultos aunque el cálculo los contaba. Lo que fija:
   - un enlace con las tres casillas abre sus tres bloques, con los valores del enlace;
   - sin ellas, los tres siguen ocultos;
   - desmarcar a mano vuelve a ocultar el suyo. */
const { cargarPlaywright, abrirSesion, asentar, contador, BASE } = require('./ayuda');

const RUTA = '/dimensionador-mikrotik-routeros.html';
const BLOQUES = [['chkBgp', 'bgpBox'], ['chkPppoe', 'pppoeBox'], ['chkCapsman', 'capsBox']];

(async () => {
  const { chromium } = cargarPlaywright();
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errores = [];
  page.on('pageerror', (e) => errores.push(e.message));
  const t = contador();
  await abrirSesion(page);

  const abrir = async (qs) => {
    await page.goto(BASE + RUTA + qs, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#apModel option:nth-child(2)', { state: 'attached', timeout: 20000 });
    await asentar(page);
  };
  const visible = (id) => page.$eval(`#${id}`, (n) => !n.hidden && n.offsetParent !== null);

  await abrir('?chkBgp=1&bgpFeeds=2&chkPppoe=1&pppoeSess=300&chkCapsman=1&apCount=6');
  for (const [chk, box] of BLOQUES) {
    t.ok(await page.isChecked(`#${chk}`), `un enlace con ${chk} la deja marcada`);
    t.ok(await visible(box), `y abre su bloque (#${box})`);
  }
  t.ok((await page.inputValue('#apCount')) === '6', 'el bloque abierto trae el valor del enlace (6 AP)');

  await page.click('#chkCapsman');
  await asentar(page);
  t.ok(!(await visible('capsBox')), 'desmarcar CAPsMAN a mano vuelve a ocultar su bloque');

  await abrir('?bw=150');
  for (const [, box] of BLOQUES) t.ok(!(await visible(box)), `sin la casilla, #${box} sigue oculto`);

  t.ok(errores.length === 0, 'sin errores de JS' + (errores.length ? ': ' + errores.join(' | ') : ''));
  await browser.close();
  process.exit(t.resumen('e2e-mikrotik-subcampos-enlace'));
})().catch((e) => { console.error('ERROR E2E (e2e-mikrotik-subcampos-enlace):', e.message); process.exit(2); });
