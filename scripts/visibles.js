'use strict';
// LO VISIBLE, CONTRA LA BASE (2026-11-03, mejora propuesta al cerrar el PR #127).
//
// POR QUÉ. Para cerrar el PR #127 (una sola forma de ocultar) se condujo la misma secuencia de clics
// contra `main` y contra la rama, y se contaron los id visibles en cada paso: 0 diferencias en 8.228.
// Ninguna otra comprobación mira eso. `contraste` compara lo que se recomienda en los escenarios con
// caso, `e2e` afirma flujos concretos y `pantallas`, que nada explota. Un `hidden` de más, un
// `display:none` en línea que quitar el atributo ya no deshace (el `#panelSsr` de Juniper, en ese PR)
// o una pestaña que deja de abrir su panel no los ve nadie si nadie escribió una prueba para ESA
// pantalla.
//
// QUÉ FRENA, paso a paso:
//   · lo que la base mostraba y aquí no se ve, o ya no está en la página;
//   · lo que la base tenía en la página, pero oculto, y aquí se ve.
// Un id que la base no tenía y aquí se ve solo AVISA: es lo normal de una función nueva. Un cambio
// hecho a propósito se acepta en la descripción del PR (variable PR_BODY en CI), con una línea:
//   visibles-acepta: #<id>: <motivo de al menos diez caracteres>
//
// CÓMO. Cada paso parte del estado de entrada de su página: se marca una casilla, se mira y se
// desmarca; si al deshacer no vuelve lo de antes, se recarga. Así una casilla nueva no arrastra a las
// siguientes. Se espera con `asentar()` de las baterías e2e, nunca con pausas fijas: una diferencia
// falsa por tiempo enseña a ignorar la herramienta, que es peor que no tenerla. La MUTACIÓN DE
// CONTROL es obligatoria, como en `npm run equivalencia`: en el recorrido del árbol se oculta un
// elemento visible, y la comparación tiene que verlo; si no lo ve, sale con 2 en vez de dar «igual».
//
// USO
//   npm run visibles                              el árbol de trabajo contra origin/main (en un worktree)
//   npm run visibles -- --ref=<rama o commit>      contra otra base
//   npm run visibles -- --base=URL --contra=URL    dos servidores ya en marcha, con la misma clave
//                                                   (VISIBLES_USER y VISIBLES_PASSWORD)
//   --solo=<texto>                                  solo las páginas cuyo nombre lo contiene (para depurar):
//                                                   portal, cuenta, usuarios, guía, cotizador o un dimensionador
//   --acepta="#id: motivo"                          lo mismo que una línea visibles-acepta del PR
// Sale con 0 si nada frena (o está aceptado), 1 si algo frena y 2 si la mutación no se ve o algo no
// arranca.
const { execFileSync, spawn } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const http = require('http');
const net = require('net');
const os = require('os');
const path = require('path');

const RAIZ = path.join(__dirname, '..');

// Los dimensionadores, en el orden del portal; Starlink al final.
const DIMENSIONADORES = [
  'huawei-netengine', 'cisco-catalyst8k', 'fortinet-fortigate', 'juniper-srx', 'mikrotik-routeros',
  'aruba-edgeconnect', 'nokia-7750sr', 'nokia-7220ixr', 'starlink-leo',
];

// ── La regla, pura (test/visibles.test.js) ────────────────────────────────────────────────────

// Las aceptaciones declaradas en un texto (la descripción del PR): { id: motivo }.
function aceptaciones(texto) {
  const out = {};
  for (const m of String(texto || '').matchAll(/^\s*visibles-acepta:\s*#?([\w:.-]+)\s*:\s*(.+?)\s*$/gm)) {
    if (m[2].length >= 10) out[m[1]] = m[2];
  }
  return out;
}

// De un conjunto de id, los de arriba: cada uno con cuántos del conjunto lleva dentro. Un panel que se
// oculta entero es UNA diferencia, no una por cada id que contiene. `padres` es el id ancestro más
// cercano de cada id visible (en la foto de la que sale el conjunto).
function cimas(conjunto, padres = {}) {
  const out = new Map();
  for (const id of conjunto) {
    let cima = id;
    for (let p = padres[id], n = 0; p && n < 200; p = padres[p], n += 1) if (conjunto.has(p)) cima = p;
    out.set(cima, (out.get(cima) || 0) + (cima === id ? 0 : 1));
  }
  return out;
}

// Compara dos recorridos ([{ nombre, visibles, presentes, padres } | { nombre, error }]) paso a paso.
// Devuelve una lista de hallazgos { tipo: 'frena'|'aviso'|'aceptado', paso, id?, que, dentro? }.
function comparar(pasosBase, pasosContra, acepta = {}) {
  const B = new Map(pasosBase.map((p) => [p.nombre, p]));
  const C = new Map(pasosContra.map((p) => [p.nombre, p]));
  const out = [];
  const anotar = (tipo, paso, id, que, dentro) => out.push({ tipo: tipo === 'frena' && acepta[id] ? 'aceptado' : tipo, paso, id, que, dentro });
  for (const [paso, b] of B) {
    const c = C.get(paso);
    if (!c) { out.push({ tipo: 'aviso', paso, que: 'paso que la base tiene y aquí no (¿se quitó o se renombró el control?)' }); continue; }
    if (c.error && !b.error) { out.push({ tipo: 'frena', paso, que: `el paso falla aquí y en la base no: ${c.error}` }); continue; }
    if (b.error) {
      out.push({ tipo: 'aviso', paso, que: c.error ? `el paso falla también en la base (recorrido viejo): ${c.error}` : `el paso falla en la base y aquí no: ${b.error}` });
      continue;
    }
    const vb = new Set(b.visibles);
    const vc = new Set(c.visibles);
    const pb = new Set(b.presentes);
    const pc = new Set(c.presentes);
    // Lo que deja de verse, agrupado por lo de arriba según la foto de la base.
    const fuera = new Set(b.visibles.filter((id) => !vc.has(id)));
    for (const [id, dentro] of cimas(fuera, b.padres)) {
      anotar('frena', paso, id, pc.has(id) ? 'deja de verse' : 'ya no está en la página', dentro);
    }
    // Lo que aparece, agrupado según la foto de aquí: lo que la base ocultaba frena, lo nuevo avisa.
    const aparecen = c.visibles.filter((id) => !vb.has(id));
    const ocultos = new Set(aparecen.filter((id) => pb.has(id)));
    const nuevos = new Set(aparecen.filter((id) => !pb.has(id)));
    for (const [id, dentro] of cimas(ocultos, c.padres)) anotar('frena', paso, id, 'se ve, y en la base estaba en la página pero oculto', dentro);
    for (const [id, dentro] of cimas(nuevos, c.padres)) anotar('aviso', paso, id, 'nuevo: se ve, y la base no lo tenía', dentro);
  }
  for (const [paso] of C) {
    if (!B.has(paso)) out.push({ tipo: 'aviso', paso, que: 'paso nuevo, sin base con la que comparar' });
  }
  for (const id of Object.keys(acepta)) {
    if (!out.some((h) => h.id === id && h.tipo === 'aceptado')) {
      out.push({ tipo: 'aviso', paso: '(descripción del PR)', id, que: 'aceptación que no casa con ninguna diferencia: sobra' });
    }
  }
  return out;
}

// Agrupa por (tipo, id, qué): un id que deja de verse en 30 pasos es UNA línea, con el primer paso.
function agrupar(hallazgos) {
  const grupos = new Map();
  for (const h of hallazgos) {
    const k = `${h.tipo}\u0000${h.id || ''}\u0000${h.que}`;
    const g = grupos.get(k) || { tipo: h.tipo, id: h.id, que: h.que, pasos: [], dentro: 0 };
    g.pasos.push(h.paso);
    g.dentro = Math.max(g.dentro, h.dentro || 0);
    grupos.set(k, g);
  }
  const orden = { frena: 0, aceptado: 1, aviso: 2 };
  return [...grupos.values()].sort((a, b) => orden[a.tipo] - orden[b.tipo] || b.pasos.length - a.pasos.length);
}

function lineaDe(g, acepta = {}) {
  const quien = g.id ? `#${g.id}${g.dentro ? ` (y ${g.dentro} id dentro)` : ''} ` : '';
  const donde = g.pasos.length === 1 ? `en «${g.pasos[0]}»` : `en ${g.pasos.length} pasos (el primero, «${g.pasos[0]}»)`;
  const motivo = g.tipo === 'aceptado' ? ` · aceptado en el PR: ${acepta[g.id]}` : '';
  return `${quien}${g.que} ${donde}${motivo}`;
}

// ── El recorrido, en el navegador (proceso hijo: ayuda.js lee E2E_BASE al cargarse) ─────────

/* global document, getComputedStyle, localStorage */
// Lo que se ve y lo que está, por id. Visible: con caja, sin display:none ni visibility:hidden
// (un hijo de algo oculto no tiene caja). No mira si está dentro de la ventana: lo que hay más abajo
// también se ve al desplazarse. De cada visible, su id ancestro más cercano, para agrupar.
function fotoDeLaPagina() {
  const visibles = new Set();
  const presentes = new Set();
  const padres = {};
  for (const e of document.querySelectorAll('[id]')) {
    if (!e.id) continue;
    presentes.add(e.id);
    const cs = getComputedStyle(e);
    const r = e.getBoundingClientRect();
    if (cs.display !== 'none' && cs.visibility !== 'hidden' && (r.width > 0 || r.height > 0)) {
      visibles.add(e.id);
      const p = e.parentElement && e.parentElement.closest('[id]');
      if (p && p.id && !(e.id in padres)) padres[e.id] = p.id;
    }
  }
  return { visibles: [...visibles].sort(), presentes: [...presentes].sort(), padres };
}

async function recorrer({ solo = '', control = false } = {}) {
  const { cargarPlaywright, abrirSesion, asentar, BASE } = require('../test/e2e/ayuda');
  const { chromium } = cargarPlaywright();
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.on('dialog', (d) => d.dismiss().catch(() => {}));
  const pasos = [];
  const usados = new Set();
  let mutacion = null;
  const nombreUnico = (n) => { let x = n; for (let i = 2; usados.has(x); i += 1) x = `${n} (${i})`; usados.add(x); return x; };
  const quiere = (pagina) => !solo || pagina.includes(solo);
  const foto = async () => { await asentar(page); return page.evaluate(fotoDeLaPagina); };
  const ir = async (ruta) => { await page.goto(BASE + ruta, { waitUntil: 'domcontentloaded' }); await asentar(page); };
  // Un paso: una acción y la foto de después. Si la acción falla, el paso lo dice (y en la base se
  // verá si también fallaba): no tumba el recorrido.
  const paso = async (nombre, accion) => {
    const n = nombreUnico(nombre);
    try {
      await accion();
      pasos.push({ nombre: n, ...(await foto()) });
    } catch (e) {
      pasos.push({ nombre: n, error: String(e.message).split('\n')[0].slice(0, 200) });
    }
  };

  await abrirSesion(page);

  // El portal: la entrada y cada sección de la barra lateral; la ventana de sincronizar y la calculadora.
  if (quiere('portal')) {
    await paso('portal', () => ir('/'));
    const secciones = await page.$$eval('.nav-btn[data-page]', (bs) => bs.map((b) => b.dataset.page));
    for (const s of secciones) {
      await paso(`portal · sección ${s}`, async () => { await ir('/'); await page.click(`.nav-btn[data-page="${s}"]`); });
    }
    await paso('portal · calculadora calculada', async () => {
      await ir('/'); await page.click('.nav-btn[data-page="calculadora"]'); await page.click('#btnCalcular');
    });
    await paso('portal · ventana de sincronizar', async () => { await ir('/'); await page.click('#btnAbrirSync'); });
  }
  if (quiere('cuenta')) await paso('cuenta', () => ir('/cuenta'));
  if (quiere('usuarios')) await paso('usuarios', () => ir('/usuarios'));
  if (quiere('guía')) {
    await paso('guía', () => ir('/guia-diseno-interactiva.html'));
    await paso('guía · un nodo', async () => { await ir('/guia-diseno-interactiva.html'); await page.click('.node-box >> nth=0'); });
  }
  if (quiere('cotizador')) {
    const cotizadorVacio = async () => { await ir('/cotizador.html'); await page.evaluate(() => localStorage.clear()); await ir('/cotizador.html'); };
    await paso('cotizador', cotizadorVacio);
    await paso('cotizador · una línea', async () => { await cotizadorVacio(); await page.click('.cat-add >> nth=0'); });
  }

  for (const pg of DIMENSIONADORES.filter(quiere)) {
    const ruta = `/dimensionador-${pg}.html`;
    const entrar = async () => { await ir(ruta); await page.evaluate(() => localStorage.clear()); await ir(ruta); };
    let inicial = null;
    await paso(pg, async () => { await entrar(); });
    try { inicial = await foto(); } catch { inicial = null; }
    // Vuelve al estado de entrada: deshacer y, si no basta, recargar.
    const volver = async (deshacer) => {
      try { if (deshacer) await deshacer(); } catch { /* se recarga */ }
      const ahora = await foto();
      if (!inicial || ahora.visibles.join() !== inicial.visibles.join()) await entrar();
    };

    // La mutación de control: en el árbol, se oculta un elemento visible y la foto tiene que verlo.
    if (control && !mutacion && inicial) {
      const oculto = await page.evaluate(() => {
        // El primero, en el orden del documento, que se ve y no contiene otro id: una hoja.
        const e = [...document.querySelectorAll('[id]')]
          .find((x) => x.id && x !== document.body && x.getClientRects().length && !x.querySelector('[id]'));
        if (!e) return null;
        e.hidden = true;
        return e.id;
      });
      if (oculto) {
        const despues = await foto();
        mutacion = { paso: pg, oculto, antes: inicial, despues };
        await page.evaluate((id) => { document.getElementById(id).hidden = false; }, oculto);
        await asentar(page);
      }
    }

    // Las pestañas: cada una que no está abierta, y de vuelta a la de entrada.
    const pestanas = await page.$$eval('.tabs button[data-tab]', (bs) => bs.map((b) => ({
      tab: b.dataset.tab, abierta: b.getAttribute('aria-selected') === 'true', vis: !!b.getClientRects().length,
    }))).catch(() => []);
    const deEntrada = (pestanas.find((t) => t.abierta) || {}).tab;
    for (const t of pestanas.filter((x) => x.vis && !x.abierta)) {
      await paso(`${pg} · pestaña ${t.tab}`, () => page.click(`.tabs button[data-tab="${t.tab}"]`));
      await volver(deEntrada ? () => page.click(`.tabs button[data-tab="${deEntrada}"]`) : null);
    }

    // Los botones segmentados: cada opción que no está elegida, y de vuelta a la de entrada.
    const segs = await page.$$eval('.seg', (gs) => gs.map((g, gi) => ({
      gi,
      grupo: (g.id || (g.closest('[id]') || {}).id || 'seg'),
      botones: [...g.querySelectorAll('button')].map((b, bi) => ({
        bi,
        texto: b.textContent.replace(/\s+/g, ' ').trim().slice(0, 30),
        vis: !!b.getClientRects().length && !b.disabled,
        elegido: b.getAttribute('aria-pressed') === 'true' || b.getAttribute('aria-checked') === 'true'
          || /\b(on|active|activo|sel|selected)\b/.test(b.className),
      })),
    }))).catch(() => []);
    for (const g of segs) {
      const elegido = g.botones.find((b) => b.elegido);
      for (const b of g.botones.filter((x) => x.vis && !x.elegido)) {
        const sel = (i) => page.locator('.seg').nth(g.gi).locator('button').nth(i);
        await paso(`${pg} · ${g.grupo} · ${b.texto}`, () => sel(b.bi).click());
        await volver(elegido ? () => sel(elegido.bi).click() : null);
      }
    }

    // Las casillas con id: la visible o la que tiene una etiqueta visible (los interruptores de
    // Starlink esconden la suya). Se pulsa desde la página, como el clic del usuario: dispara change.
    const casillas = await page.$$eval('input[type=checkbox][id]', (xs) => xs
      .filter((x) => !x.disabled && (x.getClientRects().length || [...(x.labels || [])].some((l) => l.getClientRects().length)))
      .map((x) => x.id)).catch(() => []);
    for (const id of casillas) {
      const pulsar = () => page.evaluate((i) => { document.getElementById(i).click(); }, id);
      await paso(`${pg} · casilla #${id}`, pulsar);
      await volver(pulsar);
    }
  }

  await browser.close();
  return { pasos, mutacion };
}

// ── Los servidores y el orquestador ──────────────────────────────────────────────────────────

const git = (args, cwd = RAIZ) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();

function puertoLibre() {
  return new Promise((ok, mal) => {
    const s = net.createServer();
    s.once('error', mal);
    s.listen(0, '127.0.0.1', () => { const { port } = s.address(); s.close(() => ok(port)); });
  });
}

function esperar(url, intentos = 120) {
  return new Promise((ok, mal) => {
    function probar(n) {
      const req = http.get(url + '/login', (res) => { res.resume(); if (res.statusCode === 200) ok(); else otra(n); });
      req.on('error', () => otra(n));
      req.setTimeout(2000, () => { req.destroy(); otra(n); });
    }
    function otra(n) {
      if (n <= 0) { mal(new Error(`${url} no respondió 200 en /login a tiempo`)); return; }
      setTimeout(() => probar(n - 1), 500);
    }
    probar(intentos);
  });
}

// Un servidor de usar y tirar, en modo producción (como `pantallas`), con base y estado propios.
async function levantar(dir, usuario, clave) {
  const puerto = await puertoLibre();
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'visibles-'));
  const hijo = spawn(process.execPath, ['server/server.js'], {
    cwd: dir,
    detached: true,
    env: {
      ...process.env,
      NODE_ENV: 'production',
      PORT: String(puerto),
      AUTH_USER: usuario,
      AUTH_PASSWORD: clave,
      SESSION_SECRET: crypto.randomBytes(24).toString('hex'),
      AUTH_STATE_DIR: path.join(tmp, 'auth'),
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let log = '';
  hijo.stdout.on('data', (d) => { log += d; });
  hijo.stderr.on('data', (d) => { log += d; });
  const url = `http://127.0.0.1:${puerto}`;
  const apagar = () => {
    try { process.kill(-hijo.pid, 'SIGTERM'); } catch { /* ya muerto */ }
    try { fs.rmSync(tmp, { recursive: true, force: true }); } catch { /* nada */ }
  };
  try {
    await esperar(url);
  } catch (e) {
    apagar();
    throw new Error(`${e.message} (servidor de ${dir}):\n${log.slice(-1500)}`);
  }
  return { url, apagar };
}

// La base en un worktree aparte, con los node_modules del árbol (las dependencias de la base son
// las mismas salvo que el PR las cambie; si no arranca, se dice y sale con 2).
function worktreeDe(ref) {
  try { git(['rev-parse', '--verify', `${ref}^{commit}`]); } catch {
    throw new Error(`la referencia «${ref}» no existe aquí (¿falta git fetch?)`);
  }
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'visibles-base-'));
  git(['worktree', 'add', '--detach', '--force', dir, ref]);
  fs.symlinkSync(path.join(RAIZ, 'node_modules'), path.join(dir, 'node_modules'), 'dir');
  return { dir, quitar: () => { try { git(['worktree', 'remove', '--force', dir]); } catch { /* se queda en tmp */ } } };
}

// Lanza el recorrido en un proceso propio contra una URL y devuelve su JSON.
function recorrerEn(url, { usuario, clave, solo, control }) {
  const salida = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'visibles-foto-')), 'foto.json');
  const args = [__filename, '--recorrer', `--salida=${salida}`];
  if (solo) args.push(`--solo=${solo}`);
  if (control) args.push('--control');
  return new Promise((ok, mal) => {
    let err = '';
    const h = spawn(process.execPath, args, {
      cwd: RAIZ,
      env: { ...process.env, E2E_BASE: url, E2E_USER: usuario, E2E_PASSWORD: clave },
      stdio: ['ignore', 'inherit', 'pipe'],
    });
    h.stderr.on('data', (d) => { err += d; });
    h.on('close', (code) => {
      if (code !== 0) { mal(new Error(`el recorrido contra ${url} salió con ${code}:\n${err.slice(-1500)}`)); return; }
      ok(JSON.parse(fs.readFileSync(salida, 'utf8')));
    });
  });
}

function opciones(argv) {
  const o = { acepta: [] };
  for (const a of argv) {
    const m = a.match(/^--([\w-]+)(?:=(.*))?$/);
    if (!m) continue;
    if (m[1] === 'acepta') o.acepta.push(m[2] || '');
    else o[m[1]] = m[2] === undefined ? true : m[2];
  }
  return o;
}

const enCI = process.env.GITHUB_ACTIONS === 'true';
const anotar = (nivel, texto) => { if (enCI) console.log(`::${nivel} title=visibles::${texto.replace(/\r?\n/g, ' ')}`); };

async function principal(argv) {
  const o = opciones(argv);
  if (o.recorrer) {
    const r = await recorrer({ solo: o.solo || '', control: !!o.control });
    fs.writeFileSync(o.salida, JSON.stringify(r));
    return 0;
  }

  const acepta = aceptaciones([process.env.PR_BODY || '', ...o.acepta.map((x) => `visibles-acepta: ${x}`)].join('\n'));
  const usuario = process.env.VISIBLES_USER || 'visibles';
  const clave = process.env.VISIBLES_PASSWORD || crypto.randomBytes(18).toString('base64url');
  const limpiar = [];
  try {
    let base = o.base;
    let contra = o.contra;
    if (!(base && contra)) {
      if (base || contra) throw new Error('--base y --contra van juntos (o ninguno, y se levantan los dos)');
      const ref = o.ref || 'origin/main';
      const wt = worktreeDe(ref);
      limpiar.push(wt.quitar);
      console.log(`[visibles] base: ${ref} (${git(['rev-parse', '--short', ref])}) · árbol: ${git(['rev-parse', '--short', 'HEAD'])}${git(['status', '--porcelain']) ? ' con cambios sin commit' : ''}`);
      const [sb, sc] = await Promise.all([levantar(wt.dir, usuario, clave), levantar(RAIZ, usuario, clave)]);
      limpiar.push(sb.apagar, sc.apagar);
      base = sb.url;
      contra = sc.url;
    }
    const t0 = Date.now();
    const [rb, rc] = await Promise.all([
      recorrerEn(base, { usuario, clave, solo: o.solo }),
      recorrerEn(contra, { usuario, clave, solo: o.solo, control: true }),
    ]);

    // La mutación de control: si ocultar un elemento no da diferencia, la comparación no ve.
    const m = rc.mutacion;
    const vista = m && comparar([{ nombre: m.paso, ...m.antes }], [{ nombre: m.paso, ...m.despues }])
      .some((h) => h.tipo === 'frena' && h.id === m.oculto);
    if (!vista) {
      const msg = m ? `ocultar #${m.oculto} en «${m.paso}» no dio ninguna diferencia: la comparación no ve` : 'no se pudo aplicar la mutación de control';
      console.error(`[visibles] MUTACIÓN DE CONTROL: ${msg}`);
      anotar('error', `mutación de control: ${msg}`);
      return 2;
    }

    const hallazgos = comparar(rb.pasos, rc.pasos, acepta);
    const grupos = agrupar(hallazgos);
    const n = (t) => grupos.filter((g) => g.tipo === t).length;
    const ids = rc.pasos.reduce((s, p) => s + (p.visibles ? p.visibles.length : 0), 0);
    for (const g of grupos) console.log(`${g.tipo === 'frena' ? 'FRENA' : g.tipo === 'aceptado' ? 'ACEPTADO' : 'AVISO'} - ${lineaDe(g, acepta)}`);
    let anotadas = 0;
    for (const g of grupos.filter((x) => x.tipo !== 'aceptado')) {
      if (anotadas >= 9) break;
      anotar(g.tipo === 'frena' ? 'error' : 'warning', lineaDe(g, acepta));
      anotadas += 1;
    }
    const resumen = `RESUMEN - visibles: ${rc.pasos.length} pasos (base ${rb.pasos.length}), ${ids} id visibles contados, `
      + `${n('frena')} que frenan, ${n('aceptado')} aceptados, ${n('aviso')} avisos · mutación de control vista (#${m.oculto}) · `
      + `${((Date.now() - t0) / 1000).toFixed(0)} s`;
    console.log(resumen);
    anotar(n('frena') ? 'error' : 'notice', resumen.replace(/^RESUMEN - /, ''));
    if (n('frena')) {
      console.log('Si un cambio es a propósito, decláralo en la descripción del PR:\n  visibles-acepta: #<id>: <motivo>');
      return 1;
    }
    return 0;
  } catch (e) {
    console.error(`[visibles] ${e.message}`);
    anotar('error', e.message.split('\n')[0]);
    return 2;
  } finally {
    for (const f of limpiar.reverse()) f();
  }
}

if (require.main === module) {
  principal(process.argv.slice(2)).then((rc) => { process.exitCode = rc; }, (e) => { console.error(e); process.exitCode = 2; });
}

module.exports = { aceptaciones, cimas, comparar, agrupar, lineaDe, fotoDeLaPagina, DIMENSIONADORES };
