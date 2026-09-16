'use strict';
/* CONTRASTE ANTES/DESPUES DEL MULTI-UNDERLAY BUILDER DE FORTINET (2026-09-16).
 *
 * El builder sustituye el par «caudal unico + deslizador de % por el overlay» por filas de
 * enlaces declarados. Es un cambio de ENTRADA DE DATOS, no de dimensionamiento: el motor
 * sigue leyendo #bw y #pctOverlay, que ahora son espejos ocultos que el builder calcula.
 * Esa afirmacion hay que PROBARLA, no declararla — asi que este script conduce los mismos
 * ocho escenarios que se midieron sobre la pagina anterior y exige la MISMA recomendacion,
 * el mismo requerimiento y el mismo numero de candidatos.
 *
 * La linea base va EMBEBIDA y no en un archivo aparte a proposito: se midio sobre el commit
 * 2147588 (la pagina con el deslizador) y es un hecho historico, no un dato que se regenere
 * — un fichero regenerable se regeneraria justo cuando el contraste fallara.
 *
 * Los ocho escenarios cubren los dos techos que el motor puede aplicar (inspeccion y
 * overlay) y los tres roles, porque el rol es lo que activa el segundo techo.
 *
 * Playwright va FUERA de package.json, igual que en scripts/generar-manual-usuario.js: es
 * una dependencia pesada para un script que se corre pocas veces. Se busca donde ya vive en
 * el entorno de trabajo y se dice exactamente que instalar si no esta.
 *
 *   node scripts/contraste-fortinet.js [http://127.0.0.1:4000]
 */
const RUTA_PW = process.env.PLAYWRIGHT_PATH || '/opt/node22/lib/node_modules/playwright';
let chromium;
try { ({ chromium } = require(RUTA_PW)); }
catch {
  console.error(`No se encontro Playwright en ${RUTA_PW}.`);
  console.error('Instalalo con:  npm i -g playwright   (o exporta PLAYWRIGHT_PATH al modulo)');
  process.exit(2);
}
const EJECUTABLE = process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const BASE = process.argv[2] || 'http://127.0.0.1:4000';
const USUARIO = process.env.AUTH_USER || 'presales';
const CLAVE = process.env.AUTH_PASSWORD || 'prueba-local-1234';

// Linea base medida en Chromium sobre el commit 2147588, con el deslizador de overlay.
const BASE_LINEA = [
  { n: 'sin sdwan, 500 Mbps',          bw: 500,   rol: 'none',  pct: 100, recomendado: 'FortiGate 60F',  need: '650 Mbps', nCandidatos: 55 },
  { n: 'sin sdwan, 2.5 Gbps',          bw: 2500,  rol: 'none',  pct: 100, recomendado: 'FortiGate 200G', need: '3.3 Gbps', nCandidatos: 39 },
  { n: 'spoke 100% overlay, 500',      bw: 500,   rol: 'spoke', pct: 100, recomendado: 'FortiGate 60F',  need: '689 Mbps', nCandidatos: 55 },
  { n: 'spoke 70% overlay, 500',       bw: 500,   rol: 'spoke', pct: 70,  recomendado: 'FortiGate 60F',  need: '677 Mbps', nCandidatos: 55 },
  { n: 'spoke 30% overlay, 2.5 Gbps',  bw: 2500,  rol: 'spoke', pct: 30,  recomendado: 'FortiGate 200G', need: '3.3 Gbps', nCandidatos: 39 },
  { n: 'spoke 100% overlay, 2.5 Gbps', bw: 2500,  rol: 'spoke', pct: 100, recomendado: 'FortiGate 200G', need: '3.4 Gbps', nCandidatos: 39 },
  { n: 'hub 100% overlay, 10 Gbps',    bw: 10000, rol: 'hub',   pct: 100, recomendado: 'FortiGate 200G', need: '4.8 Gbps', nCandidatos: 39 },
  { n: 'hub 50% overlay, 10 Gbps',     bw: 10000, rol: 'hub',   pct: 50,  recomendado: 'FortiGate 200G', need: '4.7 Gbps', nCandidatos: 39 },
];

const pausa = (p, ms) => p.waitForTimeout(ms);

// Traduce un escenario de la linea base a filas del builder: la fraccion cifrada deja de
// declararse como porcentaje y pasa a ser un enlace de overlay mas otro de breakout local.
function filasDe(e) {
  const ovl = Math.round(e.bw * e.pct / 100), resto = e.bw - ovl;
  const f = [];
  if (ovl > 0) f.push({ tipo: 'MPLS L3', down: ovl, overlay: e.rol !== 'none' });
  if (resto > 0) f.push({ tipo: 'DIA', down: resto, overlay: false });
  return f;
}

async function declarar(p, filas) {
  // Se escriben las filas por el builder mismo (boton + campos), no inyectando el estado:
  // un contraste que evita la interfaz no prueba la interfaz.
  for (let i = 1; i < filas.length; i++) { await p.click('#btnAddWan'); await pausa(p, 150); }
  for (let i = 0; i < filas.length; i++) {
    const f = filas[i];
    await p.selectOption(`#wanBuilderFilas .wan-fila >> nth=${i} >> [data-campo=tipo]`, f.tipo);
    await pausa(p, 120);
    await p.fill(`#wanBuilderFilas .wan-fila >> nth=${i} >> [data-campo=down]`, String(f.down));
    await p.dispatchEvent(`#wanBuilderFilas .wan-fila >> nth=${i} >> [data-campo=down]`, 'input');
    await pausa(p, 120);
    const ov = await p.$(`#wanBuilderFilas .wan-fila >> nth=${i} >> [data-campo=overlay]`);
    if (ov && !(await ov.isDisabled()) && (await ov.isChecked()) !== f.overlay) {
      await ov.click(); await pausa(p, 120);
    }
  }
}

// Se lee control a control con $eval en vez de un page.evaluate con `document`: es el mismo
// idioma que usa scripts/verificar-pantallas.js y evita un global de navegador dentro de un
// archivo de Node, que el linter de este repositorio rechaza con motivo.
async function leer(p) {
  const sel = await p.$('#verdict-sel');
  return {
    recomendado: sel ? await sel.evaluate((e) => e.value) : '(sin selector)',
    nCandidatos: sel ? await sel.evaluate((e) => e.options.length) : 0,
    need: await p.$eval('#needLbl', (e) => e.textContent),
    bwEspejo: await p.$eval('#bw', (e) => e.value),
    pctEspejo: await p.$eval('#pctOverlay', (e) => e.value),
    filas: await p.$$eval('#wanBuilderFilas .wan-fila', (es) => es.length),
  };
}

(async () => {
  const b = await chromium.launch({ executablePath: EJECUTABLE });
  const p = await b.newPage({ viewport: { width: 1440, height: 1200 } });
  await p.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
  await p.fill('#usuario', USUARIO); await p.fill('#password', CLAVE);
  await Promise.all([
    p.waitForURL((u) => !u.pathname.endsWith('/login'), { waitUntil: 'domcontentloaded' }),
    p.click('button[type=submit]'),
  ]);

  let fallos = 0;
  console.log('ESCENARIO'.padEnd(32) + 'ESPERADO'.padEnd(16) + 'OBTENIDO'.padEnd(16) + 'REQ.'.padEnd(11) + 'CAND.  ESPEJOS');
  for (const e of BASE_LINEA) {
    await p.goto(`${BASE}/dimensionador-fortinet-fortigate.html`, { waitUntil: 'domcontentloaded' });
    await pausa(p, 1300);
    if (e.rol !== 'none') { await p.click(`#rolSeg button[data-v="${e.rol}"]`); await pausa(p, 300); }
    await declarar(p, filasDe(e));
    await pausa(p, 900);
    const r = await leer(p);
    const ok = r.recomendado === e.recomendado && r.need === e.need && r.nCandidatos === e.nCandidatos;
    if (!ok) fallos++;
    console.log(`${(ok ? '  ' : '✗ ') + e.n.padEnd(30)}${e.recomendado.padEnd(16)}${String(r.recomendado).padEnd(16)}`
      + `${String(r.need).padEnd(11)}${String(r.nCandidatos).padEnd(7)}bw=${r.bwEspejo} pct=${r.pctEspejo} (${r.filas} filas)`);
    if (!ok) console.log(`    esperado: req=${e.need} cand=${e.nCandidatos}`);
  }

  // MIGRACION v1→v2. Un enlace ya pegado en un chat trae ?bw=…&unit=…&pctOverlay=…; si
  // aterrizara con los valores por defecto seria peor que un 404, porque no se nota.
  console.log('\nMIGRACION DE ENLACES v1');
  for (const e of BASE_LINEA.filter((x) => x.rol !== 'none')) {
    const url = `${BASE}/dimensionador-fortinet-fortigate.html?bw=${e.bw}&unit=1&pctOverlay=${e.pct}`;
    await p.goto(url, { waitUntil: 'domcontentloaded' });
    await pausa(p, 1400);
    await p.click(`#rolSeg button[data-v="${e.rol}"]`);
    await pausa(p, 900);
    const r = await leer(p);
    const ok = r.recomendado === e.recomendado && String(r.bwEspejo) === String(e.bw) && Number(r.pctEspejo) === e.pct;
    if (!ok) fallos++;
    console.log(`${(ok ? '  ' : '✗ ') + e.n.padEnd(30)}bw=${r.bwEspejo} pct=${r.pctEspejo} filas=${r.filas} -> ${r.recomendado}`);
  }

  await b.close();
  console.log(fallos ? `\n${fallos} discrepancia(s): el builder CAMBIO el dimensionamiento.` : '\nSin discrepancias: el builder no cambia el dimensionamiento.');
  process.exit(fallos ? 1 : 0);
})();
