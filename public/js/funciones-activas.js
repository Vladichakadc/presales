'use strict';
// LAS FUNCIONES ACTIVADAS, TAMBIÉN A LA DERECHA (petición del dueño, 2026-10-28: «cuando se
// seleccione una opción de cualquier dimensionador, como ya se está resaltando en la parte de la
// izquierda, también se resalte en la parte de la derecha de todos los dimensionadores»).
//
// La izquierda ya resalta la fila de cada casilla de función marcada (controles.css, sección 2).
// La derecha es la de los resultados: el equipo recomendado, las licencias, el BOM. Quien mira el
// resultado no ve la izquierda a la vez (en un portátil, la columna de parámetros queda arriba,
// fuera de pantalla), y no tiene manera de saber con qué funciones se calculó lo que lee. Este
// módulo pone, arriba de la columna derecha, el mismo resaltado: una pastilla por cada función
// activada, con el acento de la página y la barra de la izquierda. Un clic en la pastilla lleva a
// su casilla.
//
// UNA SOLA PIEZA PARA LAS OCHO PÁGINAS, SIN TOCAR SU CÓDIGO. Todas montan sus parámetros en una
// rejilla de dos columnas (`.cols`; Fortinet, `.dim`) con los parámetros en la primera hija y los
// resultados en la segunda. El módulo busca esas rejillas, lee las casillas de la primera y
// escribe en la segunda. Una rejilla sin casillas de función a la izquierda (el BOM de Nokia) no
// lleva panel.
//
// LA MISMA REGLA QUE LA IZQUIERDA. Cuenta lo que la izquierda resalta: casillas dentro de su
// `<label>`, menos las compactas de las filas de enlaces (`.wan-sim`, `.wan-ov`) y los
// interruptores (`.switch`). Una casilla dentro de un bloque oculto no cuenta: lo oculto no entra
// en el cálculo. Una marcada y bloqueada (la fija la página) sí cuenta, con la barra en gris como
// a la izquierda.
//
// LO QUE TRAJO LA FUNCIÓN (petición del dueño, 2026-10-29: «cuando se active una función también
// debes resaltar la descripción en el panel derecho para que los usuarios puedan observar en donde
// apareció dicha descripción»). Al marcar una casilla de función se toma una foto del texto de la
// columna de resultados; cuando la página termina de recalcular, lo que no estaba antes (una fila
// del BOM, un aviso, una cifra que cambió) se resalta con el mismo acento, con «Apareció al activar
// «X»» en su `title`, y el panel dice cuántos puntos cambiaron y lleva al primero. La marca sale de
// lo que de verdad cambió en la pantalla, no de un mapa función→fila escrito a mano que pudiera
// mentir; por eso tampoco toca el código de ninguna página. Se borra con el siguiente cambio de
// cualquier control; al desmarcar no se marca nada.
//
// TAMBIÉN EN LA LISTA DE MATERIALES (2026-10-31, fase 2.2 del plan de mejora de los dimensionadores;
// la mejora propuesta al cerrar el PR #66). En las páginas con BOM, la tabla `#bomTabla` vive en su
// propia pestaña, fuera de la columna de resultados: la línea que una función añade (el PIM del
// respaldo celular, la segunda fuente) no se resaltaba. Sus filas entran en la misma foto —solo las
// líneas, no los rótulos de grupo ni el total— y el panel las cuenta aparte. La tabla se repinta al
// recalcular aunque su pestaña esté cerrada (`BOM.sincronizar` repinta siempre), así que la foto
// del `click` es la de antes; «Ver» abre la pestaña si lo primero resaltado está en ella.
//
// CUÁNDO SE ACTUALIZA. Con cada `change` o `input` de la página y, además, cada vez que la
// columna de resultados cambia: las páginas marcan casillas por programa (un perfil guardado, el
// pliego, «restablecer») sin disparar eventos, pero siempre recalculan y repintan la derecha. El
// panel solo se reescribe si lo activado cambió, así que su propia escritura no vuelve a
// dispararlo.
(function () {
  const EXCLUIDAS = '.wan-sim, .wan-ov, .switch';
  const EXPLICACION = '.sku, .hint';

  function casillasDe(col) {
    return [...col.querySelectorAll('label > input[type="checkbox"]')].filter((cb) => {
      const l = cb.parentElement;
      if (l.matches(EXCLUIDAS)) return false;
      // Oculto dentro de la columna (bloque condicional): no aplica al cálculo.
      for (let n = l; n && n !== col; n = n.parentElement) {
        if (n.hidden || n.classList.contains('hidden')) return false;
      }
      return true;
    });
  }

  // El nombre de la función: el texto de su etiqueta sin la explicación que la acompaña.
  function nombreDe(cb) {
    const c = cb.parentElement.cloneNode(true);
    c.querySelectorAll('input, ' + EXPLICACION).forEach((x) => x.remove());
    return c.textContent.replace(/\s+/g, ' ').trim() || cb.id || 'Función';
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  }

  // Donde va el panel: arriba de la columna de resultados; si la columna abre con su cabecera
  // (el panel de resultados de Fortinet), justo debajo de ella.
  // Solo mueve el panel si no está ya en su sitio: así su propia colocación no se repite.
  //
  // LA TARJETA CLAVADA (Aruba y Juniper: `.col-fijo`, sticky y sin scroll interno, petición del
  // dueño del 2026-09-16) ya ocupa casi todo el alto de la pantalla: un panel DENTRO la alargaría y
  // se soltaría antes del fondo (e2e-sticky.js lo frena). Ahí el panel va FUERA de la tarjeta, como
  // otra pieza de la rejilla en la columna derecha, encima de ella (controles.css le da su fila):
  // la tarjeta conserva su alto y su área hasta el fondo, y el panel se desplaza con la página.
  function colocar(der, panel) {
    if (der.classList.contains('col-fijo')) {
      if (panel.nextSibling !== der) der.parentElement.insertBefore(panel, der);
      return;
    }
    const cab = der.querySelector(':scope > .res-cab');
    const ref = cab ? cab.nextSibling : der.firstChild;
    if (ref === panel) return;
    der.insertBefore(panel, ref);
  }

  const rejillas = [];

  // La unidad que se resalta: la fila, el párrafo, el elemento de lista o el título que contiene el
  // texto; sin ninguna de ellas, el propio elemento. Nunca el panel de funciones.
  const UNIDAD = 'tr, li, p, dt, dd, h1, h2, h3, h4, h5, h6, caption, figcaption, summary, .bom-aviso';
  const clave = (el) => el.textContent.replace(/\s+/g, ' ').trim();
  function unidades(r) {
    const vistas = new Set();
    r.der.querySelectorAll('*').forEach((el) => {
      if (r.panel.contains(el) || el.closest('script, style, template')) return;
      if (![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) return;
      const u = el.closest(UNIDAD);
      vistas.add(u && r.der.contains(u) && !r.panel.contains(u) ? u : el);
    });
    return [...vistas];
  }
  // Las líneas del BOM, si su tabla no está ya dentro de la columna de resultados.
  function bomDe(r) {
    const t = document.getElementById('bomTabla');
    return t && !r.der.contains(t) ? t : null;
  }
  function lineasBom(r) {
    const t = bomDe(r);
    return t ? [...t.querySelectorAll('tbody tr:not(.bom-grupo)')] : [];
  }
  const todas = (r) => unidades(r).concat(lineasBom(r));
  const enBom = (r, el) => { const t = bomDe(r); return !!t && t.contains(el); };
  function foto(r) {
    const cuenta = new Map();
    for (const u of todas(r)) { const k = clave(u); if (k) cuenta.set(k, (cuenta.get(k) || 0) + 1); }
    return cuenta;
  }
  function limpiar(r) {
    if (!r.cambio) return;
    r.cambio.els.forEach((el) => { el.classList.remove('fa-nuevo'); if (el.dataset.faTitulo != null) { el.title = el.dataset.faTitulo; delete el.dataset.faTitulo; } else el.removeAttribute('title'); });
    r.cambio = null;
    r.firma = null;
  }
  // Lo que no estaba en la foto de antes, sin repetir una unidad dentro de otra ya marcada.
  function marcar(r, antes, cb) {
    const quedan = new Map(antes);
    const nuevas = [];
    for (const u of todas(r)) {
      const k = clave(u);
      if (!k) continue;
      const n = quedan.get(k) || 0;
      if (n > 0) quedan.set(k, n - 1); else nuevas.push(u);
    }
    const els = nuevas.filter((u) => !nuevas.some((o) => o !== u && o.contains(u)));
    r.cambio = { id: cb.id, nombre: nombreDe(cb), els: [], claves: els.map(clave) };
    poner(r, els);
  }
  function poner(r, els) {
    const c = r.cambio;
    els.forEach((el) => {
      if (el.hasAttribute('title') && el.dataset.faTitulo == null) el.dataset.faTitulo = el.title;
      el.classList.add('fa-nuevo');
      el.title = `Apareció al activar «${c.nombre}»`;
    });
    c.els = els;
    r.firma = null;
    pintar(r);
  }
  // La página repintó la derecha después de marcar (un segundo recálculo, la confirmación del
  // servidor): las marcas se fueron con los nodos viejos. Se vuelven a poner en lo que tenga el
  // mismo texto que se marcó, que es lo que la función trajo; nunca en otra cosa.
  function reponer(r) {
    const c = r.cambio;
    if (!c || c.els.every((el) => el.isConnected)) return;
    const faltan = new Map();
    c.claves.forEach((k) => faltan.set(k, (faltan.get(k) || 0) + 1));
    const els = [];
    for (const u of todas(r)) {
      const k = clave(u);
      const n = faltan.get(k) || 0;
      if (n > 0 && !els.some((o) => o.contains(u))) { faltan.set(k, n - 1); els.push(u); }
    }
    // Lo que la función trajo ya no está (la página lo quitó): no queda nada que señalar.
    if (!els.length) { limpiar(r); pintar(r); return; }
    poner(r, els);
  }
  // Espera a que la página termine de repintar la derecha: 300 ms sin cambios (sin contar el panel),
  // y como mucho 4 s. Si no cambia nada en 1,5 s, tampoco cambió nada que resaltar.
  function seguir(r, cb) {
    const antes = foto(r);
    if (r.espera) r.espera.cancelar();
    let quieto = null;
    let hubo = false;
    const obs = new MutationObserver((ms) => {
      if (!ms.some((m) => !r.panel.contains(m.target))) return;
      hubo = true;
      clearTimeout(quieto);
      quieto = setTimeout(fin, 300);
    });
    const tope = setTimeout(fin, 4000);
    const nada = setTimeout(() => { if (!hubo) fin(); }, 1500);
    function cancelar() { obs.disconnect(); clearTimeout(quieto); clearTimeout(tope); clearTimeout(nada); r.espera = null; }
    function fin() { cancelar(); if (cb.checked) marcar(r, antes, cb); }
    r.espera = { cancelar };
    obs.observe(r.der, { childList: true, subtree: true, characterData: true });
    const t = bomDe(r);
    if (t) obs.observe(t, { childList: true, subtree: true, characterData: true });
  }

  function pintar(r) {
    const activas = r.casillas().filter((cb) => cb.checked);
    const c = r.cambio;
    const firma = activas.map((cb) => `${cb.id}|${cb.disabled ? 1 : 0}|${nombreDe(cb)}`).join('§') + (c ? `#${c.id}:${c.els.length}` : '');
    colocar(r.der, r.panel);
    if (firma === r.firma) return;
    r.firma = firma;
    const lista = activas.map((cb) => {
      const n = nombreDe(cb);
      const fija = cb.disabled ? ' fa-fija' : '';
      const dest = cb.id ? ` data-para="${esc(cb.id)}"` : '';
      return `<li><button type="button" class="fa-pastilla${fija}"${dest} title="${esc(n)}${cb.disabled ? ' (la fija la página)' : ''} — ir a la casilla">${esc(n)}</button></li>`;
    }).join('');
    let cambio = '';
    if (c) {
      const nBom = c.els.filter((el) => enBom(r, el)).length;
      const nRes = c.els.length - nBom;
      const partes = [];
      if (nRes) partes.push(nRes === 1 ? '1 punto del resultado' : `${nRes} puntos del resultado`);
      if (nBom) partes.push(nBom === 1 ? '1 línea de la lista de materiales' : `${nBom} líneas de la lista de materiales`);
      const total = c.els.length;
      cambio = total
        ? `<p class="fa-cambio">Al activar <b>${esc(c.nombre)}</b> cambi${total === 1 ? 'ó' : 'aron'} ${partes.join(' y ')}: ${total === 1 ? 'va resaltado' : 'van resaltados'}. <button type="button" class="fa-ver">Ver ${total === 1 ? 'dónde' : 'el primero'}</button></p>`
        : `<p class="fa-cambio">Al activar <b>${esc(c.nombre)}</b> no cambió nada visible del resultado.</p>`;
    }
    r.panel.innerHTML = `<p class="fa-tit">Funciones activadas <span class="fa-n">${activas.length}</span></p>`
      + (activas.length
        ? `<ul class="fa-lista">${lista}</ul>`
        : '<p class="fa-vacio">Ninguna. Las que marques en los parámetros aparecen aquí, resaltadas.</p>')
      + cambio;
  }

  function pintarTodo() { rejillas.forEach(pintar); }

  function montar() {
    document.querySelectorAll('.cols, .dim').forEach((g) => {
      const [izq, der] = g.children;
      if (!izq || !der) return;
      // Sin ninguna casilla de función a la izquierda (aunque hoy esté oculta), no hay panel.
      const tiene = [...izq.querySelectorAll('label > input[type="checkbox"]')].some((cb) => !cb.parentElement.matches(EXCLUIDAS));
      if (!tiene) return;
      const panel = document.createElement('section');
      panel.className = 'funciones-activas';
      panel.setAttribute('aria-label', 'Funciones activadas en los parámetros');
      panel.setAttribute('aria-live', 'polite');
      const r = { izq, der, panel, firma: null, casillas: () => casillasDe(izq) };
      panel.addEventListener('click', (e) => {
        if (e.target.closest('.fa-ver')) {
          // El primero que se ve; si todo lo resaltado está en una pestaña cerrada (la del BOM), se
          // abre con su propio botón (`[role=tab][data-tab=X]`, la convención de las páginas).
          let el = r.cambio && r.cambio.els.find((x) => x.isConnected && x.getClientRects().length);
          if (!el && r.cambio) {
            const oculto = r.cambio.els.find((x) => x.isConnected);
            const pane = oculto && oculto.closest('.tabpane');
            const tab = pane && document.querySelector(`[role="tab"][data-tab="${pane.id.replace(/^pane-/, '')}"]`);
            if (tab) { tab.click(); el = oculto.isConnected && oculto.getClientRects().length ? oculto : null; }
          }
          if (el) {
            el.scrollIntoView({ block: 'center', behavior: 'smooth' });
            if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
            el.focus({ preventScroll: true });
          }
          return;
        }
        const b = e.target.closest('.fa-pastilla[data-para]');
        const cb = b && document.getElementById(b.dataset.para);
        if (!cb) return;
        cb.parentElement.scrollIntoView({ block: 'center', behavior: 'smooth' });
        cb.focus({ preventScroll: true });
      });
      rejillas.push(r);
      pintar(r);
      // La derecha se repinta tras cada recálculo; la izquierda muestra u oculta bloques.
      new MutationObserver(() => { if (!r.espera) reponer(r); pintar(r); }).observe(der, { childList: true, subtree: true });
      const tb = bomDe(r);
      if (tb) new MutationObserver(() => { if (!r.espera) reponer(r); }).observe(tb, { childList: true, subtree: true });
      new MutationObserver(() => pintar(r)).observe(izq, { subtree: true, attributes: true, attributeFilter: ['hidden', 'class', 'disabled'] });
    });
    if (!rejillas.length) return;
    document.addEventListener('change', pintarTodo, true);
    document.addEventListener('input', pintarTodo, true);
    // Lo que trajo cada función. El `click` llega antes que el `input` y el `change` con los que la
    // página recalcula, así que la foto es la del resultado de antes. Cualquier otro control borra
    // las marcas: ya no dicen lo que cambió la última acción.
    document.addEventListener('click', (e) => {
      const cb = e.target;
      if (!cb || cb.tagName !== 'INPUT' || cb.type !== 'checkbox') return;
      const r = rejillas.find((x) => x.casillas().includes(cb));
      rejillas.forEach(limpiar);
      if (r && cb.checked) seguir(r, cb);
    }, true);
    const otro = (e) => {
      const t = e.target;
      if (!t || !t.closest || (t.tagName === 'INPUT' && t.type === 'checkbox')) return;
      if (t.closest('.funciones-activas')) return;
      rejillas.forEach((x) => { if (x.espera) x.espera.cancelar(); limpiar(x); });
    };
    document.addEventListener('change', otro, true);
    document.addEventListener('input', otro, true);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', montar);
  else montar();
})();
