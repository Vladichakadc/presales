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
  function colocar(der, panel) {
    const cab = der.querySelector(':scope > .res-cab');
    const ref = cab ? cab.nextSibling : der.firstChild;
    if (ref === panel) return;
    der.insertBefore(panel, ref);
  }

  const rejillas = [];

  function pintar(r) {
    const activas = r.casillas().filter((cb) => cb.checked);
    const firma = activas.map((cb) => `${cb.id}|${cb.disabled ? 1 : 0}|${nombreDe(cb)}`).join('§');
    colocar(r.der, r.panel);
    if (firma === r.firma) return;
    r.firma = firma;
    const lista = activas.map((cb) => {
      const n = nombreDe(cb);
      const fija = cb.disabled ? ' fa-fija' : '';
      const dest = cb.id ? ` data-para="${esc(cb.id)}"` : '';
      return `<li><button type="button" class="fa-pastilla${fija}"${dest} title="${esc(n)}${cb.disabled ? ' (la fija la página)' : ''} — ir a la casilla">${esc(n)}</button></li>`;
    }).join('');
    r.panel.innerHTML = `<p class="fa-tit">Funciones activadas <span class="fa-n">${activas.length}</span></p>`
      + (activas.length
        ? `<ul class="fa-lista">${lista}</ul>`
        : '<p class="fa-vacio">Ninguna. Las que marques en los parámetros aparecen aquí, resaltadas.</p>');
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
      panel.addEventListener('click', (e) => {
        const b = e.target.closest('.fa-pastilla[data-para]');
        const cb = b && document.getElementById(b.dataset.para);
        if (!cb) return;
        cb.parentElement.scrollIntoView({ block: 'center', behavior: 'smooth' });
        cb.focus({ preventScroll: true });
      });
      const r = { izq, der, panel, firma: null, casillas: () => casillasDe(izq) };
      rejillas.push(r);
      pintar(r);
      // La derecha se repinta tras cada recálculo; la izquierda muestra u oculta bloques.
      new MutationObserver(() => pintar(r)).observe(der, { childList: true, subtree: true });
      new MutationObserver(() => pintar(r)).observe(izq, { subtree: true, attributes: true, attributeFilter: ['hidden', 'class', 'disabled'] });
    });
    if (!rejillas.length) return;
    document.addEventListener('change', pintarTodo, true);
    document.addEventListener('input', pintarTodo, true);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', montar);
  else montar();
})();
