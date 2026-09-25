'use strict';
/* global window, document, Response, MutationObserver, requestAnimationFrame */
/* Ayuda compartida de los E2E (pendiente #40, 2026-09-15): cargar Playwright esté donde
   esté, abrir sesión y llevar la cuenta de comprobaciones. Un solo sitio — la alternativa
   era copiar el bloque en cada script, que es como `llevarABom` tuvo seis copias. */

// Playwright NO es dependencia del paquete: pesa ~300 MB de navegadores y Railway
// construiría más lento por algo que producción nunca usa. Se resuelve en este orden:
// dependencia local (npm i -D playwright), instalación global (npm i -g playwright —
// `npm root -g` la encuentra aunque NODE_PATH no venga en el entorno) o error claro.
function cargarPlaywright() {
  try { return require('playwright'); } catch { /* sigue */ }
  try {
    const { execSync } = require('child_process');
    const path = require('path');
    return require(path.join(execSync('npm root -g').toString().trim(), 'playwright'));
  } catch { /* cae al mensaje */ }
  console.error('Playwright no está disponible. Instálalo con:');
  console.error('  npm i -D playwright && npx playwright install chromium');
  console.error('o global: npm i -g playwright && npx playwright install chromium');
  process.exit(2);
}

const BASE = process.env.E2E_BASE || 'http://localhost:4131';
const USUARIO = process.env.E2E_USER || 'presales';
const CLAVE = process.env.E2E_PASSWORD || 'e2e-local';

/* ══ ESPERAR A UNA CONDICIÓN, NO A UN RELOJ (2026-09-24) ════════════════════════════════════
   Hasta este día cada script esperaba con pausas fijas —219 `waitForTimeout(300…3500)`—
   calibradas a ojo en la máquina donde se escribieron. Una pausa fija es una apuesta sobre
   cuánto tarda la página: en una máquina más lenta pierde, y el rojo que sale no dice nada
   del código. MEDIDO al cambiarlo, y corrigió la propuesta que lo pidió: con la CPU del
   navegador ralentizada 4x y 10x (E2E_LENTITUD) la batería de pausas fijas pasaba entera
   —tenían margen—. Lo que no tenían era economía ni diagnóstico: esperaban 336 s donde bastan
   114, y cuando algo no llegaba dejaban una aserción roja sin decir qué faltó.

   `asentar(page)` espera a que la página TERMINE lo que empezó, midiéndolo en vez de
   suponerlo. Un rastreador que se instala en cada documento antes que sus scripts cuenta la
   obra pendiente:
     · red y E/S: fetch, la lectura de cada cuerpo (json/text/blob…), Blob/File leídos,
       createImageBitmap, el portapapeles y los <script> que la página inyecta después de
       cargar (SheetJS se carga así, bajo demanda);
     · temporizadores CORTOS (≤ UMBRAL_TEMPORIZADOR_MS): el render diferido de Fortinet
       (140 ms), el volcado del escenario a la URL de estado.js (0 ms), el historial de
       deshacer (500 ms). Los largos se excluyen a propósito: son rótulos que vuelven a su
       texto («Copiado» → «Copiar», 1,6-2,5 s) y la red de seguridad de 8 s de estado.js —
       esperarlos alargaría cada paso sin afirmar nada. El umbral es la parte discutible y
       va declarado, como SEMANAS_TOLERADAS o el `rozado` del contraste;
     · cuadros de animación pedidos, transiciones CSS en curso (las de duración finita),
       imágenes que están cargando y el desplazamiento de la página.
   Quieta = todo a cero en DOS cuadros seguidos (lo que un observador de intersección o de
   tamaño programe en un cuadro se ve en el siguiente). La espera no tiene duración: en una
   máquina lenta tarda más y sigue siendo correcta. Si no llega en `timeout`, falla DICIENDO
   qué quedó pendiente, que es lo que una pausa fija nunca podía decir.

   Lo que el rastreador NO ve, y se dice: una promesa del propio motor de la página que no
   pase por ninguna de esas vías. Las páginas de este repositorio no tienen ninguna (se
   revisó: el motor de Fortinet es síncrono a propósito, sin crypto.subtle). Si alguna vez
   aparece, se añade aquí —un solo sitio— y no con otra pausa en el script.

   El rastreador va por addInitScript, que usa el protocolo de depuración: la CSP de la
   aplicación (script-src 'self') no lo bloquea, igual que no bloquea el axe inyectado. */
const UMBRAL_TEMPORIZADOR_MS = 1000;

function rastreador(umbralMs) {
  if (window.__e2e) return;
  const e = { red: 0, timers: new Set(), rafs: new Set(), scroll: null };
  Object.defineProperty(window, '__e2e', { value: e });

  // Red y E/S: se cuenta al pedir y se descuenta al resolver o rechazar. `this` se conserva:
  // Response.prototype.json y compañía son métodos del objeto.
  const envolver = (obj, nombre) => {
    const original = obj && obj[nombre];
    if (typeof original !== 'function') return;
    obj[nombre] = function envuelta(...args) {
      e.red += 1;
      let p;
      try { p = original.apply(this, args); } catch (err) { e.red -= 1; throw err; }
      return Promise.resolve(p).finally(() => { e.red -= 1; });
    };
  };
  envolver(window, 'fetch');
  for (const m of ['json', 'text', 'blob', 'arrayBuffer', 'formData']) envolver(Response.prototype, m);
  for (const m of ['text', 'arrayBuffer']) envolver(Blob.prototype, m);
  envolver(window, 'createImageBitmap');
  if (window.Clipboard) { envolver(window.Clipboard.prototype, 'writeText'); envolver(window.Clipboard.prototype, 'readText'); }

  // <script src> que la página inserta DESPUÉS de cargar. Los del HTML no se siguen: el
  // parser los ejecuta antes de que el documento deje de estar «loading», que ya se exige.
  new MutationObserver((mutaciones) => {
    if (document.readyState === 'loading') return;
    for (const m of mutaciones) {
      for (const n of m.addedNodes) {
        if (n.nodeType !== 1 || n.tagName !== 'SCRIPT' || !n.src || n.__e2eVisto) continue;
        n.__e2eVisto = true;
        e.red += 1;
        const fin = () => { e.red -= 1; n.removeEventListener('load', fin); n.removeEventListener('error', fin); };
        n.addEventListener('load', fin);
        n.addEventListener('error', fin);
      }
    }
  }).observe(document, { childList: true, subtree: true });

  // Temporizadores cortos: el identificador sale del conjunto DESPUÉS de correr la función,
  // así que lo que ella programe entra antes de que lo suyo salga y no hay hueco que leer.
  const setT = window.setTimeout;
  const clearT = window.clearTimeout;
  window.setTimeout = function setTimeoutContado(fn, ms, ...args) {
    if (typeof fn !== 'function' || Number(ms) > umbralMs) return setT.call(window, fn, ms, ...args);
    let id = null;
    id = setT.call(window, function tarea(...a) {
      try { return fn.apply(this, a); } finally { e.timers.delete(id); }
    }, ms, ...args);
    e.timers.add(id);
    return id;
  };
  window.clearTimeout = function clearTimeoutContado(id) { e.timers.delete(id); return clearT.call(window, id); };

  const rafO = window.requestAnimationFrame;
  const cafO = window.cancelAnimationFrame;
  window.requestAnimationFrame = function rafContado(fn) {
    let id = null;
    id = rafO.call(window, (ts) => { try { return fn(ts); } finally { e.rafs.delete(id); } });
    e.rafs.add(id);
    return id;
  };
  window.cancelAnimationFrame = function cafContado(id) { e.rafs.delete(id); return cafO.call(window, id); };

  e.estado = () => {
    const motivos = [];
    if (document.readyState === 'loading') motivos.push('el documento sigue cargando');
    if (e.red) motivos.push(`${e.red} operación(es) de red o E/S en vuelo`);
    if (e.timers.size) motivos.push(`${e.timers.size} temporizador(es) corto(s) pendiente(s)`);
    if (e.rafs.size) motivos.push(`${e.rafs.size} cuadro(s) de animación pedido(s)`);
    const animando = document.getAnimations().filter((a) => a.playState === 'running'
      && a.effect && Number.isFinite(a.effect.getComputedTiming().endTime)).length;
    if (animando) motivos.push(`${animando} transición(es) o animación(es) en curso`);
    // Una imagen diferida (loading=lazy) solo carga cuando cruza la vista. Fuera de ella —por
    // debajo O POR ENCIMA, si la página ya bajó— o sin caja (display:none) no va a cargar, y
    // contarla haría esperar algo que no va a pasar. La primera versión solo miraba el borde
    // de arriba y esperó 30 s a la foto de un 50G que había quedado 5.000 px por encima.
    const cargando = [...document.images].filter((i) => {
      if (i.complete) return false;
      if (i.loading !== 'lazy') return true;
      if (!i.getClientRects().length) return false;
      const r = i.getBoundingClientRect();
      return r.bottom >= 0 && r.top <= window.innerHeight && r.right >= 0 && r.left <= window.innerWidth;
    }).length;
    if (cargando) motivos.push(`${cargando} imagen(es) cargando`);
    const scroll = `${Math.round(window.scrollX)},${Math.round(window.scrollY)}`;
    if (e.scroll !== null && scroll !== e.scroll) motivos.push('la página se está desplazando');
    e.scroll = scroll;
    return { quieto: !motivos.length, motivo: motivos.join('; ') };
  };
}

// E2E_LENTITUD=4 ralentiza la CPU de cada página 4x (Emulation.setCPUThrottlingRate): es como
// se comprueba que la batería no depende de la velocidad de la máquina —la de un ejecutor
// de CI puede ser la mitad de rápida que la de quien escribió el script—. Sin la variable,
// velocidad normal.
const LENTITUD = Number(process.env.E2E_LENTITUD || 0);
const instrumentadas = new WeakSet();

// Las tipografías de Google se cortan en la batería, a propósito: el resultado de una prueba
// de maquetación (el panel fijo, el reflujo a 640 px) no puede depender de si un tercero
// respondió a tiempo. Así corre igual aquí —donde ese dominio está bloqueado— que en un
// ejecutor de CI —donde responde—. Las capturas con las tipografías reales son de `pantallas`.
const TIPOGRAFIAS_EXTERNAS = /^https:\/\/fonts\.(googleapis|gstatic)\.com\//;

async function instrumentar(page) {
  if (instrumentadas.has(page)) return;
  instrumentadas.add(page);
  await page.addInitScript(rastreador, UMBRAL_TEMPORIZADOR_MS);
  await page.route(TIPOGRAFIAS_EXTERNAS, (r) => r.abort());
  if (LENTITUD > 1) {
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: LENTITUD });
  }
}

async function asentar(page, { timeout = 30000 } = {}) {
  const limite = Date.now() + timeout;
  let seguidas = 0;
  let motivo = 'sin lectura todavía';
  while (Date.now() < limite) {
    let r;
    try {
      // La lectura va en una microtarea tras un cuadro: para entonces el cuadro propio ya
      // salió del conjunto y lo que queda es de la página.
      r = await page.evaluate(() => new Promise((ok) => {
        if (!window.__e2e) { ok(null); return; }
        requestAnimationFrame(() => { Promise.resolve().then(() => ok(window.__e2e.estado())); });
      }));
    } catch (err) {
      // Una navegación a mitad de lectura destruye el contexto: se vuelve a leer en el
      // documento nuevo, que trae su propio rastreador.
      if (!/context was destroyed|navigat|Target closed/i.test(err.message)) throw err;
      seguidas = 0;
      motivo = 'navegando';
      await new Promise((ok) => { setTimeout(ok, 50); });
      continue;
    }
    if (r === null) {
      throw new Error('asentar(): esta página no lleva el rastreador — ábrela con abrirSesion() de test/e2e/ayuda.js');
    }
    if (r.quieto) {
      seguidas += 1;
      if (seguidas >= 2) return;
    } else {
      seguidas = 0;
      motivo = r.motivo;
    }
  }
  throw new Error(`asentar(): la página no quedó quieta en ${timeout / 1000} s — pendiente: ${motivo}`);
}

// Una acción que NAVEGA (location.reload, un enlace) se espera como navegación y no como
// quietud: el documento viejo sigue vivo y quieto hasta que llega el nuevo, y asentar() podría
// leerlo a él. «Limpiar escenario» de Aruba es eso —replaceState + reload—, y el
// waitForSelector('#users') que lo seguía se cumplía en la página VIEJA, que también lo tiene.
async function trasNavegar(page, accion, { selector } = {}) {
  await Promise.all([page.waitForEvent('domcontentloaded', { timeout: 20000 }), accion()]);
  if (selector) await page.waitForSelector(selector, { timeout: 20000 });
  await asentar(page);
}

// Las navegaciones NO esperan al evento load (2026-09-16, misma lección que la navegación
// del portal en verificar-pantallas.js): la página carga Google Fonts, y en un entorno sin
// salida a ese dominio la petición puede quedarse colgada 30 s y tumbar el goto aunque la
// app esté lista en 100 ms. Lo que se afirma aquí es que la pantalla CARGA, así que basta
// domcontentloaded + el control de contrato (#users), que es la señal real de «lista».
// Toda página de la batería pasa por aquí antes de su primera navegación —el muro de acceso
// lo exige—, y por eso es aquí donde se instala el rastreador de asentar().
async function abrirSesion(page) {
  await instrumentar(page);
  await page.goto(BASE + '/login', { waitUntil: 'domcontentloaded' });
  await page.fill('input[name=usuario]', USUARIO);
  await page.fill('input[name=password]', CLAVE);
  await page.click('button[type=submit]');
  // waitForURL también espera load por defecto: sin el waitUntil, el login cae con 30 s
  // aunque el portal ya esté pintado — el fallo intermitente del 2026-09-16 era ESTE.
  await page.waitForURL('**/', { waitUntil: 'domcontentloaded' });
}

async function abrirDimensionador(page) {
  await abrirSesion(page);
  await page.goto(BASE + '/dimensionador-aruba-edgeconnect.html', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#users', { timeout: 20000 });
  await asentar(page);
}

// Contador de comprobaciones con salida uniforme: «ok - ...» / «FALLO - ...» y código de
// salida al final. Cada script crea el suyo y lo cierra con resumen().
function contador() {
  const fallos = [];
  return {
    fallos,
    ok(cond, msg) {
      console.log((cond ? 'ok' : 'FALLO') + ' - ' + msg);
      if (!cond) fallos.push(msg);
    },
    resumen(nombre) {
      console.log(fallos.length
        ? `\n[${nombre}] RESULTADO: ${fallos.length} FALLO(S)`
        : `\n[${nombre}] RESULTADO: TODO VERDE`);
      // El código de salida se fija AQUÍ además de devolverse (2026-09-24): tres baterías
      // nuevas cerraban con `t.resumen(...)` sin `process.exit(...)`, y el runner las contaba
      // en verde con 13 fallos impresos. Un comprobador que no comprueba se porta igual que
      // uno que pasa; así el olvido ya no puede enmascarar un rojo.
      if (fallos.length) process.exitCode = 1;
      return fallos.length ? 1 : 0;
    },
  };
}

module.exports = {
  cargarPlaywright, BASE, USUARIO, CLAVE, abrirSesion, abrirDimensionador, asentar, trasNavegar, contador,
  UMBRAL_TEMPORIZADOR_MS,
};
