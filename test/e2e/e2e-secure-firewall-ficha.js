'use strict';
/* La ficha del firewall dedicado (2026-10-31, «Secure Firewall en el catálogo, ficha completa»).
   Con «Firewall dedicado aparte» y salida local a Internet, el dimensionador Cisco pinta debajo de la
   ficha del router la del Secure Firewall que va al BOM: su figura oficial con su pie (o la nota de
   por qué falta la trasera), su hardware y su alimentación, y el enlace a su ficha de Cisco. Elegir
   otro en su desplegable cambia el BOM; «Volver al recomendado» lo devuelve. Sin firewall dedicado,
   la ficha no existe. Se conduce lo que sirve el servidor (proyección del catálogo incluida). */
const { cargarPlaywright, BASE, abrirSesion, asentar, trasNavegar, contador } = require('./ayuda');

const PAGINA = `${BASE}/dimensionador-cisco-catalyst8k.html?bw=1000&diaPct=60&seguridad=desacoplada`;
const texto = (page, sel) => page.evaluate((s) => {
  const n = globalThis.document.querySelector(s);
  return n ? (n.textContent || '').replace(/\s+/g, ' ') : '';
}, sel);

(async () => {
  const { chromium } = cargarPlaywright();
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errores = [];
  page.on('pageerror', (e) => errores.push(e.message));
  const t = contador();

  await abrirSesion(page);
  await trasNavegar(page, () => page.goto(PAGINA, { waitUntil: 'domcontentloaded' }), { selector: '#fichaFw-sel' });
  await asentar(page);

  const visible = await page.evaluate(() => !globalThis.document.getElementById('fichaFw').hidden);
  t.ok(visible, 'con firewall dedicado y salida local, la ficha del firewall está a la vista');
  const rec = await page.evaluate(() => globalThis.document.getElementById('fichaFw-sel').value);
  t.ok(/^Secure Firewall /.test(rec), `el desplegable propone un Secure Firewall (${rec})`);

  const ficha = await texto(page, '#fichaFw');
  t.ok(/Firewall dedicado · Cisco Secure Firewall, serie/.test(ficha), 'con su subtítulo de firewall dedicado');
  t.ok(/FW \+ AVC \+ IPS/.test(ficha) && /Descifrado TLS/.test(ficha), 'con sus cifras publicadas por capa');
  t.ok(/Alimentación eléctrica/.test(ficha) && /Fuente redundante/.test(ficha), 'con la sección de alimentación');
  t.ok(/ninguna fuente del catálogo respalda el fin de venta de los Secure Firewall/.test(ficha), 'sin afirmar un ciclo de vida que el catálogo no respalda: lo dice');

  const img = await page.evaluate(() => {
    const i = globalThis.document.querySelector('#fichaFw .ficha-vista-img img');
    return i ? { src: i.getAttribute('src') || '' } : null;
  });
  // La tarjeta carga la figura en diferido (`loading="lazy"`): se pide al servidor, como el navegador.
  if (img) {
    img.ok = await page.evaluate(async (src) => {
      const r = await globalThis.fetch(src);
      const b = new Uint8Array(await r.arrayBuffer());
      return r.ok && String.fromCharCode(...b.slice(8, 12)) === 'WEBP';
    }, img.src);
  }
  t.ok(!!img && /\/img\/equipos\/cs-sf[a-z0-9-]+-front(\.prev)?\.webp$/.test(img.src), `la tarjeta pinta la figura oficial (${img ? img.src : 'ninguna'})`);
  t.ok(!!img && img.ok, 'y el servidor sirve la figura como WebP');

  const enlace = await page.evaluate(() => {
    const a = [...globalThis.document.querySelectorAll('#fichaFw a')].find((x) => /secure-firewall-/.test(x.getAttribute('href') || ''));
    return a ? a.getAttribute('href') : null;
  });
  t.ok(!!enlace && enlace.startsWith('https://www.cisco.com/'), 'con el enlace a su ficha oficial');

  // Otro firewall a mano: va al BOM y el aviso lo dice.
  const otro = await page.evaluate((r) => {
    const ops = [...globalThis.document.querySelectorAll('#fichaFw-sel option')].map((o) => o.value);
    return ops.find((v) => v !== r && /^Secure Firewall 3/.test(v)) || ops.find((v) => v !== r) || null;
  }, rec);
  t.ok(!!otro, 'el desplegable ofrece más de un firewall que cumple');
  if (otro) {
    await page.selectOption('#fichaFw-sel', otro);
    await asentar(page);
    const bom = await texto(page, '#bomTabla');
    t.ok(bom.length > 0, 'la tabla del BOM está pintada');
    t.ok(bom.includes(`${otro} — firewall dedicado`), `el BOM lleva el ${otro} elegido a mano`);
    t.ok(!bom.includes(`${rec} — firewall dedicado`), 'y ya no el recomendado');
    const aviso = await texto(page, '#avisosMotor');
    t.ok(/elegido a mano en su ficha/.test(aviso), 'el aviso del firewall dice que se eligió a mano');

    const volver = await page.$('#fichaFw .ficha-volver');
    t.ok(!!volver, 'la ficha ofrece «Volver al recomendado»');
    if (volver) {
      await volver.click();
      await asentar(page);
      const bom2 = await texto(page, '#bomTabla');
      t.ok(bom2.includes(`${rec} — firewall dedicado`) && !bom2.includes(`${otro} — firewall dedicado`), 'y al volver, el BOM lleva otra vez el recomendado');
    }
  }

  // Sin firewall dedicado, la ficha desaparece.
  await page.selectOption('#seguridad', 'onbox');
  await asentar(page);
  const oculta = await page.evaluate(() => globalThis.document.getElementById('fichaFw').hidden);
  t.ok(oculta, 'con la seguridad en el router, no hay ficha de firewall');

  t.ok(errores.length === 0, 'sin errores de JS' + (errores.length ? ': ' + errores.join(' | ') : ''));
  await browser.close();
  process.exit(t.resumen('e2e-secure-firewall-ficha'));
})().catch((e) => { console.error('ERROR E2E:', e.message); process.exit(2); });
