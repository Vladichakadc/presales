'use strict';
/* LAS FUENTES DE LOS SIETE FABRICANTES, DESDE EL PORTAL (2026-11-01, la mejora propuesta al cerrar el
   PR #71). «↻ Actualizar fuentes» vive en la pestaña «Fuentes» de cada dimensionador: saber si algún
   documento oficial de cualquier fabricante cambió pedía abrir siete páginas. Esta página del portal
   llama a la misma ruta (`GET /api/fuentes/<fabricante>/salud`, server/vigiaEnVivo.js) para los siete
   y enseña una fila por fabricante, con enlace a su pestaña.

   DE UNO EN UNO, a propósito. Cada comprobación vuelve a leer los documentos en el sitio del
   fabricante (cuatro a la vez dentro de un fabricante, 20 s por documento). Siete a la vez serían
   veintiocho descargas simultáneas contra los fabricantes; en serie, el siguiente se pide cuando el
   anterior respondió (`comprobarEnSerie`, que `test/fuentes-portal.test.js` fija). La caché de 10
   minutos de cada fabricante la pone el servidor: aquí no se guarda nada.

   SOLO LEE, como el botón de cada pestaña: no cambia el catálogo ni el lock del vigía. Un documento que
   cambió sale «cambió · sin contrastar»; quien lo vea abre la pestaña de su fabricante.

   Los siete son los de `NAVFAB.FABRICANTES` (navegacion.js), los que tienen pestaña «Fuentes». Starlink
   no la tiene: sus fuentes las vigila el vigía de los lunes. */
(function (global) {
  function esc(v) {
    return String(v ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  }

  // El núcleo: un fabricante detrás de otro. `pedir(id)` devuelve la respuesta de la ruta o lanza; un
  // fabricante que falla no para a los demás. `alAvanzar` recibe cada paso (empieza y termina).
  async function comprobarEnSerie(fabricantes, pedir, alAvanzar) {
    const avisar = typeof alAvanzar === 'function' ? alAvanzar : () => {};
    const resultados = [];
    for (let i = 0; i < fabricantes.length; i++) {
      const fab = fabricantes[i];
      avisar({ fab, indice: i, estado: 'en-curso' });
      let r;
      try {
        r = { fab, indice: i, estado: 'ok', datos: await pedir(fab.id) };
      } catch (err) {
        r = { fab, indice: i, estado: 'error', error: (err && err.message) || String(err) };
      }
      resultados.push(r);
      avisar(r);
    }
    return resultados;
  }

  async function pedirSalud(id) {
    const res = await global.fetch(`/api/fuentes/${encodeURIComponent(id)}/salud`);
    const d = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(d.error || `HTTP ${res.status}`);
    return d;
  }

  // El resumen de un fabricante en partes, con las mismas palabras que la pestaña «Fuentes» de cada
  // dimensionador (procedencia.js). `tono` es para el color; el texto lo dice igual sin él.
  function partesDe(d) {
    const c = (d && d.resumen) || {};
    // Un cero no es buena noticia: «0 sin cambios» va en gris, no en verde.
    const partes = [{ n: c.sinCambios || 0, texto: 'sin cambios', tono: c.sinCambios ? 'bien' : 'neutro' }];
    if (c.cambiaron) partes.push({ n: c.cambiaron, texto: c.cambiaron === 1 ? 'cambió sin contrastar' : 'cambiaron sin contrastar', tono: 'aviso' });
    if (c.varian) partes.push({ n: c.varian, texto: c.varian === 1 ? 'página dinámica que varía' : 'páginas dinámicas que varían', tono: 'neutro' });
    if (c.primera) partes.push({ n: c.primera, texto: 'sin medición previa', tono: 'neutro' });
    if (c.inalcanzables) partes.push({ n: c.inalcanzables, texto: c.inalcanzables === 1 ? 'inalcanzable' : 'inalcanzables', tono: 'mal' });
    if (c.otras) partes.push({ n: c.otras, texto: 'sin URL pública o sin vigilancia', tono: 'neutro' });
    return partes;
  }

  // La línea final: qué fabricantes tienen algo que mirar.
  function conclusion(resultados) {
    const con = (k) => resultados.filter((r) => r.estado === 'ok' && ((r.datos.resumen || {})[k] || 0) > 0).map((r) => r.fab.nombre);
    const fallidos = resultados.filter((r) => r.estado === 'error').map((r) => r.fab.nombre);
    const cambiaron = con('cambiaron');
    const inalcanzables = con('inalcanzables');
    const frases = [];
    if (cambiaron.length) frases.push(`cambiaron documentos sin contrastar en ${cambiaron.join(', ')}`);
    if (inalcanzables.length) frases.push(`hay documentos inalcanzables en ${inalcanzables.join(', ')}`);
    if (fallidos.length) frases.push(`no se pudo comprobar ${fallidos.join(', ')}`);
    return frases.length ? `${frases.join('; ')}.` : 'ningún documento cambió y todos se alcanzaron.';
  }

  const hora = (iso) => {
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? '—' : d.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
  };

  function fila(fab, r) {
    const enlace = `<a href="/${esc(fab.dim)}?tab=src">Ver sus fuentes<span class="fp-oculto"> de ${esc(fab.nombre)}</span></a>`;
    let docs = '—';
    let resultado = '<span class="fp-neutro">Sin comprobar</span>';
    let cuando = '—';
    if (r && r.estado === 'en-curso') resultado = '<span class="fp-neutro">Comprobando…</span>';
    else if (r && r.estado === 'error') resultado = `<span class="fp-mal">No se pudo comprobar: ${esc(r.error)}</span>`;
    else if (r && r.estado === 'ok') {
      docs = String((r.datos.fuentes || []).length);
      resultado = partesDe(r.datos).map((p) => `<span class="fp-${p.tono}">${p.n} ${esc(p.texto)}</span>`).join(' · ');
      cuando = `${esc(hora(r.datos.revisadoEn))}${r.datos.deCache ? ' <span class="fp-neutro">(de hace menos de 10 min)</span>' : ''}`;
    }
    return `<tr data-fp-fab="${esc(fab.id)}"><th scope="row">${esc(fab.nombre)}</th><td class="fp-num">${docs}</td><td>${resultado}</td><td class="fp-hora">${cuando}</td><td>${enlace}</td></tr>`;
  }

  function fabricantes() {
    return ((global.NAVFAB && global.NAVFAB.FABRICANTES) || []).filter((f) => f.dim);
  }

  let corriendo = false;
  async function comprobarTodas() {
    const cuerpo = document.getElementById('fpCuerpo');
    const estado = document.getElementById('fpEstado');
    const boton = document.getElementById('fpComprobar');
    if (corriendo || !cuerpo) return null;
    corriendo = true;
    const lista = fabricantes();
    const ultimo = {};
    const pintar = () => { cuerpo.innerHTML = lista.map((f) => fila(f, ultimo[f.id])).join(''); };
    if (boton) boton.disabled = true;
    cuerpo.closest('table').setAttribute('aria-busy', 'true');
    try {
      const resultados = await comprobarEnSerie(lista, pedirSalud, (r) => {
        ultimo[r.fab.id] = r;
        pintar();
        if (r.estado === 'en-curso' && estado) estado.textContent = `Comprobando ${r.fab.nombre} (${r.indice + 1} de ${lista.length})…`;
      });
      if (estado) estado.textContent = `Comprobados los ${lista.length} fabricantes: ${conclusion(resultados)}`;
      return resultados;
    } finally {
      corriendo = false;
      if (boton) boton.disabled = false;
      cuerpo.closest('table').removeAttribute('aria-busy');
    }
  }

  function montar() {
    const cuerpo = document.getElementById('fpCuerpo');
    if (!cuerpo) return;
    cuerpo.innerHTML = fabricantes().map((f) => fila(f, null)).join('');
    const boton = document.getElementById('fpComprobar');
    if (boton) boton.addEventListener('click', () => { comprobarTodas(); });
  }

  global.FUENTES_PORTAL = { comprobarEnSerie, pedirSalud, partesDe, conclusion, fila, fabricantes, comprobarTodas };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', montar);
  else montar();
})(window);
