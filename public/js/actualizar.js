'use strict';
// BOTÓN «ACTUALIZAR» EN TODOS LOS DIMENSIONADORES (petición del dueño, 2026-10-29: «incluye un
// botón en todos los dimensionadores que diga actualizar y, cuando se dé clic en este botón,
// realice los cálculos o las validaciones correspondientes, ya que no se está actualizando en
// línea como se pretende»).
//
// El recálculo en línea sigue igual: cada página escucha sus campos. Pero cada página escucha una
// LISTA de campos, y un campo que quedó fuera de la lista (o que la página cambia por programa
// sin disparar eventos) deja la derecha desfasada de la izquierda sin que nadie lo note. Este
// botón es la salida segura: recalcula TODO desde lo que dicen los campos ahora mismo.
//
// QUÉ HACE AL PULSARLO, en este orden:
//   1. Valida los parámetros visibles con las reglas que ya declaran en el HTML (min, max, step,
//      required): los fuera de regla se marcan en rojo y el primero se enfoca con su mensaje.
//   2. Recalcula con la función que la página registra en `window.DIMENSIONADOR_ACTUALIZAR`
//      (su render + BOM; en Fortinet, la evaluación del motor). La página decide qué es
//      «recalcular todo»: este módulo no conoce el motor de nadie. Si devuelve `false`, el
//      catálogo todavía no ha llegado y se dice eso en vez de fingir un cálculo.
//   3. Dice el resultado junto al botón (región `role="status"`, la lee el lector de pantalla).
//
// UNA SOLA PIEZA PARA LAS NUEVE PÁGINAS. Pone una barra con el botón arriba de la columna de
// parámetros de cada rejilla (`.cols`; Fortinet, `.dim`) que tenga campos, y en Starlink en la
// cabecera del panel de configuración. La barra es sticky: acompaña al usuario mientras baja por
// los parámetros.
(function () {
  const CAMPOS = 'input:not([type="hidden"]):not([type="button"]):not([type="submit"]), select, textarea';

  function visible(el) { return !!(el.getClientRects && el.getClientRects().length); }

  function hora() {
    const d = new Date();
    return [d.getHours(), d.getMinutes(), d.getSeconds()].map((n) => String(n).padStart(2, '0')).join(':');
  }

  // Columnas de parámetros de la página: la primera hija de cada rejilla con campos, y el panel
  // de configuración de Starlink.
  function columnas() {
    const cols = [];
    document.querySelectorAll('.cols, .dim').forEach((g) => {
      const izq = g.firstElementChild;
      if (izq && g.children.length > 1 && izq.querySelector(CAMPOS)) cols.push(izq);
    });
    document.querySelectorAll('.config-panel').forEach((p) => cols.push(p));
    return cols;
  }

  // Paso 1: validación nativa de los campos visibles y habilitados.
  function validar(cols) {
    const malos = [];
    cols.forEach((c) => c.querySelectorAll(CAMPOS).forEach((el) => {
      if (el.disabled || !visible(el) || typeof el.checkValidity !== 'function') return;
      const ok = el.checkValidity();
      el.classList.toggle('act-invalido', !ok);
      if (ok) el.removeAttribute('aria-invalid'); else { el.setAttribute('aria-invalid', 'true'); malos.push(el); }
    }));
    if (malos.length) {
      malos[0].scrollIntoView({ block: 'center', behavior: 'smooth' });
      malos[0].focus({ preventScroll: true });
      if (typeof malos[0].reportValidity === 'function') malos[0].reportValidity();
    }
    return malos;
  }

  const estados = [];
  function decir(texto, tipo) {
    estados.forEach((s) => { s.textContent = texto; s.dataset.tipo = tipo; });
  }

  function actualizar(boton) {
    const cols = columnas();
    const malos = validar(cols);
    const fn = window.DIMENSIONADOR_ACTUALIZAR;
    if (typeof fn !== 'function') {
      decir('Esta página aún no termina de cargar; inténtalo en un momento.', 'aviso');
      return;
    }
    boton.disabled = true;
    try {
      if (fn() === false) {
        decir('El catálogo aún está cargando; vuelve a pulsar en un momento.', 'aviso');
        return;
      }
    } catch (err) {
      console.error('[actualizar]', err);
      decir('No se pudo recalcular: revisa los parámetros.', 'error');
      return;
    } finally {
      boton.disabled = false;
    }
    if (malos.length) {
      decir(`Recalculado a las ${hora()}, pero ${malos.length === 1 ? 'un campo está' : `${malos.length} campos están`} fuera de rango (en rojo).`, 'aviso');
    } else {
      decir(`Actualizado a las ${hora()}.`, 'ok');
    }
  }

  function barra() {
    const b = document.createElement('div');
    b.className = 'barra-actualizar';
    b.innerHTML = '<button type="button" class="btn-actualizar" title="Recalcula el resultado y valida los parámetros con los valores actuales">Actualizar</button>'
      + '<span class="act-estado" role="status" aria-live="polite"></span>';
    estados.push(b.querySelector('.act-estado'));
    b.querySelector('button').addEventListener('click', (e) => actualizar(e.currentTarget));
    return b;
  }

  function montar() {
    // Starlink: en la cabecera de su panel, junto a «Cálculo en vivo».
    document.querySelectorAll('.config-panel').forEach((p) => {
      const cab = p.querySelector('.config-header');
      if (cab) cab.after(barra()); else p.prepend(barra());
    });
    document.querySelectorAll('.cols, .dim').forEach((g) => {
      const izq = g.firstElementChild;
      if (!izq || g.children.length < 2 || !izq.querySelector(CAMPOS)) return;
      izq.prepend(barra());
    });
    // Un campo corregido deja de estar en rojo en cuanto vuelve a cumplir su regla.
    document.addEventListener('input', (e) => {
      const el = e.target;
      if (el && el.classList && el.classList.contains('act-invalido') && el.checkValidity()) {
        el.classList.remove('act-invalido');
        el.removeAttribute('aria-invalid');
      }
    }, true);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', montar);
  else montar();
})();
