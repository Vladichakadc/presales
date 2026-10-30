'use strict';
// «POR <FUNCIÓN>» EN LA FILA DEL BOM (mejora propuesta al cerrar el PR #61, aprobada por el dueño
// el 2026-10-29, complementaria del PR #66).
//
// El PR #66 resalta lo que APARECIÓ en el resultado justo al marcar una casilla; esa marca es de un
// momento y se borra con el siguiente cambio. Esto es la otra mitad: la PROCEDENCIA de cada línea del
// BOM, fija. Una fila que existe solo porque se pidió una función lleva la etiqueta «por <función>»
// mientras la función siga pedida; quien vuelve al BOM más tarde, o abre un enlace guardado, sigue
// sabiendo de qué requisito sale cada línea antes de quitarla o defenderla.
//
// EL CONTRATO. La fila trae `por: '<id de su casilla>'` (o una lista), puesto por la página en el
// MISMO `if` que crea la fila —o traducido del `req` que el motor puso en ese `if`—, nunca desde un
// mapa aparte: una marca equivocada engaña más que ninguna. `bom.js` pide aquí la etiqueta (`chip`) y
// el atributo de la fila (`atributo`). Un id que no es una casilla de la página no pinta nada (falla
// cerrado). Un clic en la etiqueta lleva a la casilla, también si está en otra pestaña.
//
// SE CARGA SIN `defer` Y ANTES DEL <body>: la página pinta su BOM desde su propio script del final, y
// esta API tiene que existir para entonces. No toca el DOM al cargar.
(function () {
  const EXPLICACION = '.sku, .hint';
  const ids = (por) => (Array.isArray(por) ? por : String(por || '').split(/\s+/)).filter(Boolean);
  const casilla = (id) => {
    const cb = document.getElementById(id);
    return cb && cb.type === 'checkbox' && cb.parentElement && cb.parentElement.tagName === 'LABEL' ? cb : null;
  };
  // El nombre de la función: el texto de su etiqueta sin la explicación que la acompaña (la misma
  // lectura que el panel «Funciones activadas»).
  function nombre(id) {
    const cb = casilla(id);
    if (!cb) return null;
    const c = cb.parentElement.cloneNode(true);
    c.querySelectorAll('input, ' + EXPLICACION).forEach((x) => x.remove());
    return c.textContent.replace(/\s+/g, ' ').trim() || id;
  }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  }
  const validos = (por) => [...new Set(ids(por).filter((id) => casilla(id)))];

  // La etiqueta «por <función>» de una fila. Solo con casillas que existen y están marcadas: una fila
  // que la página sigue pintando sin la función pedida no se atribuye a ella.
  function chip(por) {
    const v = validos(por).filter((id) => casilla(id).checked);
    if (!v.length) return '';
    return '<span class="fa-por">por '
      + v.map((id) => `<button type="button" class="fa-por-b" data-para="${esc(id)}" title="Ir a la casilla de esta función">${esc(nombre(id))}</button>`).join(', ')
      + '</span>';
  }
  function atributo(por) { return validos(por).filter((id) => casilla(id).checked).join(' '); }

  const sel = (v) => (window.CSS && CSS.escape ? CSS.escape(v) : String(v).replace(/["\\]/g, '\\$&'));
  // Lleva a la casilla: si vive en otra pestaña (`pane-X`), la abre con su propio botón
  // (`[role=tab][data-tab=X]`, la convención de las páginas), para que la página haga lo suyo.
  function irA(id) {
    const cb = casilla(id);
    if (!cb) return false;
    const pane = cb.closest('.tabpane');
    if (pane && pane.hidden) {
      const tab = document.querySelector(`[role="tab"][data-tab="${sel(pane.id.replace(/^pane-/, ''))}"]`);
      if (tab) tab.click();
    }
    const ir = () => {
      const l = cb.parentElement;
      l.scrollIntoView({ block: 'center', behavior: 'smooth' });
      cb.focus({ preventScroll: true });
      l.classList.add('fa-por-destino');
      setTimeout(() => l.classList.remove('fa-por-destino'), 1600);
    };
    if (window.requestAnimationFrame) requestAnimationFrame(ir); else ir();
    return true;
  }

  document.addEventListener('click', (e) => {
    const b = e.target && e.target.closest && e.target.closest('.fa-por [data-para]');
    if (b) irA(b.dataset.para);
  });

  window.POR_FUNCION = { chip, atributo, nombre, irA };
})();
