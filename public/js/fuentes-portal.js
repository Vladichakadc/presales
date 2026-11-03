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
   no la tiene: sus fuentes las vigila el vigía de los lunes.

   LA VIGILANCIA DEL LUNES, ANTES DE COMPROBAR NADA (2026-11-02, la mejora propuesta al cerrar el PR
   #118). La columna «Vigía semanal» dice lo que dejó el vigía en el lock: `/api/fuentes` lo trae para
   los siete en una sola petición y sin salir a la red. Se pide al abrir esta sección, nunca al cargar el
   portal (unos 57 KB comprimida, medido en el PR #119), y una sola vez. Lo del lunes y lo de ahora van en
   columnas distintas, y cada uno dice de cuándo es: el vigía, la fecha de su lectura; la comprobación, su
   hora. */
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

  // El vigía de un fabricante, de la respuesta de `/api/fuentes` (`{fuentes: [{vigilancia}]}`, la que pinta
  // la columna «Vigilancia» de cada pestaña). Sin las cargadas a mano, que no vigila nadie: así cuenta los
  // mismos documentos que la comprobación en vivo. `medido` es la lectura más reciente en la que un
  // documento salió igual al contrastado (el `medido` del lock); `pendienteDesde`, el cambio más antiguo
  // sin contrastar.
  function resumenVigilancia(v) {
    const fuentes = ((v && v.fuentes) || []).filter((f) => !f.subida);
    const c = { documentos: fuentes.length, sinCambios: 0, cambiaron: 0, noComprobadas: 0, medido: null, pendienteDesde: null };
    for (const f of fuentes) {
      const g = f.vigilancia || {};
      const dia = g.desde ? String(g.desde).slice(0, 10) : null;
      if (g.estado === 'verificada') {
        c.sinCambios += 1;
        if (dia && (!c.medido || dia > c.medido)) c.medido = dia;
      } else if (g.estado === 'cambió') {
        c.cambiaron += 1;
        if (dia && (!c.pendienteDesde || dia < c.pendienteDesde)) c.pendienteDesde = dia;
      } else c.noComprobadas += 1;
    }
    return c;
  }

  function celdaVigia(v) {
    if (!v) return '<span class="fp-neutro">—</span>';
    if (v.estado === 'cargando') return '<span class="fp-neutro">Leyendo…</span>';
    if (v.estado === 'error') return `<span class="fp-mal">No se pudo leer: ${esc(v.error)}</span>`;
    if (!v.resumen) return '<span class="fp-neutro">Sin datos del vigía</span>';
    const c = v.resumen;
    const partes = [`<span class="fp-${c.sinCambios ? 'bien' : 'neutro'}">${c.sinCambios} sin cambios</span>`];
    if (c.cambiaron) partes.push(`<span class="fp-aviso">${c.cambiaron} ${c.cambiaron === 1 ? 'cambió' : 'cambiaron'} sin contrastar</span>`);
    if (c.noComprobadas) partes.push(`<span class="fp-neutro">${c.noComprobadas} no ${c.noComprobadas === 1 ? 'comprobada' : 'comprobadas'}</span>`);
    const fechas = [];
    if (c.medido) fechas.push(`leído sin cambios por última vez el ${esc(c.medido)}`);
    if (c.pendienteDesde) fechas.push(`cambio pendiente desde el ${esc(c.pendienteDesde)}`);
    return partes.join(' · ') + (fechas.length ? `<br><span class="fp-neutro fp-fecha">${fechas.join(' · ')}</span>` : '');
  }

  // LA ÚLTIMA CORRIDA DEL VIGÍA QUE LLEGÓ A MAIN (2026-11-02, la mejora propuesta al cerrar el PR #122).
  // Las fechas de la columna son de cada documento: un documento contrastado a mano un martes la hace
  // parecer reciente, y un vigía que dejara de llegar a main no se vería. `vigiaRevisado` es el
  // `revisado` del lock: la corrida del vigía de los lunes que se fusionó por última vez (el vigía deja su
  // lock en la rama `vigia/fuentes` y una persona lo fusiona). Pasados 8 días, lo que deja pasar el lunes
  // siguiente con margen, la línea avisa.
  const DIAS_AVISO = 8;
  function lineaCorrida(revisado, ahoraMs) {
    const t = revisado ? Date.parse(revisado) : NaN;
    if (Number.isNaN(t)) return { aviso: true, texto: 'No consta cuándo llegó a main la última corrida del vigía: el lock no lo dice.' };
    const dias = Math.max(0, Math.floor((ahoraMs - t) / 86400000));
    const hace = dias === 0 ? 'hoy' : `hace ${dias} ${dias === 1 ? 'día' : 'días'}`;
    const base = `«Vigía semanal» es la corrida del ${String(revisado).slice(0, 10)} (${hace}), la última que se fusionó en main.`;
    if (dias <= DIAS_AVISO) return { aviso: false, dias, texto: base };
    return { aviso: true, dias, texto: `${base} Pasa de una semana: la corrida siguiente no corrió o espera en la rama vigia/fuentes a que alguien la fusione, y esta columna puede ir atrasada.` };
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

  function fila(fab, r, v) {
    const enlace = `<a href="/${esc(fab.dim)}?tab=src">Ver sus fuentes<span class="fp-oculto"> de ${esc(fab.nombre)}</span></a>`;
    let docs = v && v.resumen ? String(v.resumen.documentos) : '—';
    let resultado = '<span class="fp-neutro">Sin comprobar</span>';
    let cuando = '—';
    if (r && r.estado === 'en-curso') resultado = '<span class="fp-neutro">Comprobando…</span>';
    else if (r && r.estado === 'error') resultado = `<span class="fp-mal">No se pudo comprobar: ${esc(r.error)}</span>`;
    else if (r && r.estado === 'ok') {
      docs = String((r.datos.fuentes || []).length);
      resultado = partesDe(r.datos).map((p) => `<span class="fp-${p.tono}">${p.n} ${esc(p.texto)}</span>`).join(' · ');
      cuando = `${esc(hora(r.datos.revisadoEn))}${r.datos.deCache ? ' <span class="fp-neutro">(de hace menos de 10 min)</span>' : ''}`;
    }
    return `<tr data-fp-fab="${esc(fab.id)}"><th scope="row">${esc(fab.nombre)}</th><td class="fp-num">${docs}</td><td class="fp-vigia">${celdaVigia(v)}</td><td>${resultado}</td><td class="fp-hora">${cuando}</td><td>${enlace}</td></tr>`;
  }

  function fabricantes() {
    return ((global.NAVFAB && global.NAVFAB.FABRICANTES) || []).filter((f) => f.dim);
  }

  // Lo que la tabla sabe: la comprobación en vivo de cada fabricante y lo que dijo el vigía.
  const ultimo = {};
  const vigia = {};
  function pintar() {
    const cuerpo = document.getElementById('fpCuerpo');
    if (cuerpo) cuerpo.innerHTML = fabricantes().map((f) => fila(f, ultimo[f.id], vigia[f.id])).join('');
  }

  let vigiaPedido = false;
  async function cargarVigilancia() {
    if (vigiaPedido) return;
    vigiaPedido = true;
    const lista = fabricantes();
    lista.forEach((f) => { vigia[f.id] = { estado: 'cargando' }; });
    pintar();
    try {
      const res = await global.fetch('/api/fuentes');
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || `HTTP ${res.status}`);
      lista.forEach((f) => { vigia[f.id] = d[f.id] ? { estado: 'ok', resumen: resumenVigilancia(d[f.id]) } : { estado: 'ok' }; });
      const conDato = lista.map((f) => d[f.id]).find((v) => v && 'vigiaRevisado' in v);
      const linea = document.getElementById('fpVigiaCorrida');
      if (linea && conDato) {
        const l = lineaCorrida(conDato.vigiaRevisado, Date.now());
        linea.textContent = l.texto;
        linea.classList.toggle('fp-alerta', l.aviso);
        linea.hidden = false;
      }
    } catch (err) {
      const error = (err && err.message) || String(err);
      lista.forEach((f) => { vigia[f.id] = { estado: 'error', error }; });
    }
    pintar();
  }

  let corriendo = false;
  async function comprobarTodas() {
    const cuerpo = document.getElementById('fpCuerpo');
    const estado = document.getElementById('fpEstado');
    const boton = document.getElementById('fpComprobar');
    if (corriendo || !cuerpo) return null;
    corriendo = true;
    const lista = fabricantes();
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
    pintar();
    const boton = document.getElementById('fpComprobar');
    if (boton) boton.addEventListener('click', () => { comprobarTodas(); });
    // La sección se abre con `go('fuentes')` de index.js, que le pone la clase `active`: se mira esa
    // clase, no un botón concreto, para que valga cualquier camino que la abra.
    const pagina = document.getElementById('page-fuentes');
    if (!pagina) return;
    const alAbrir = () => { if (pagina.classList.contains('active')) cargarVigilancia(); };
    alAbrir();
    if (!vigiaPedido) {
      const obs = new global.MutationObserver(() => { alAbrir(); if (vigiaPedido) obs.disconnect(); });
      obs.observe(pagina, { attributes: true, attributeFilter: ['class'] });
    }
  }

  global.FUENTES_PORTAL = { comprobarEnSerie, pedirSalud, partesDe, conclusion, fila, fabricantes, comprobarTodas, resumenVigilancia, celdaVigia, cargarVigilancia, lineaCorrida, DIAS_AVISO };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', montar);
  else montar();
})(window);
