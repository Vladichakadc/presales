'use strict';
/* ══ DEL PLIEGO AL ESCENARIO — EL LADO DE LA PÁGINA (2026-10-27, piloto en Cisco) ══
   Pide a POST /api/escenario/desde-documento los parámetros que dice el texto pegado y los
   enseña como «actual → propuesto», con la cita literal que el servidor ya comprobó en el texto.
   NADA SE APLICA SOLO: la persona marca cada fila y pulsa «Aplicar»; entonces se escriben los
   controles y se disparan sus eventos, y dimensiona el motor de siempre. Lo que el servidor
   descartó (cita que no está en el texto, valor fuera de rango) se enseña con su motivo.
   El texto no viaja en el enlace del escenario ni se guarda en el almacenamiento local: no es
   un campo de `ESTADO.vincular`. Uso: PLIEGO.montar({ pagina: 'cisco' }). */
(function () {
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // Valor actual de un control, en el mismo tipo que la propuesta.
  function actual(id) {
    const n = $(id);
    if (!n) return null;
    if (n.classList && n.classList.contains('seg')) {
      const b = n.querySelector('[aria-pressed="true"]');
      return b ? b.dataset.v : null;
    }
    if (n.type === 'checkbox') return n.checked;
    if (n.type === 'number' || n.type === 'range') return n.value === '' ? null : Number(n.value);
    return n.value;
  }
  // El texto que se enseña de un valor: la opción de un desplegable o el botón de un grupo.
  function rotulo(id, v) {
    const n = $(id);
    if (v === null || v === undefined || v === '') return 'sin valor';
    if (typeof v === 'boolean') return v ? 'Sí' : 'No';
    if (n && n.tagName === 'SELECT') {
      const o = [...n.options].find((x) => x.value === String(v));
      return o ? o.textContent.trim() : String(v);
    }
    if (n && n.classList && n.classList.contains('seg')) {
      const b = n.querySelector(`[data-v="${CSS.escape(String(v))}"]`);
      return b ? b.textContent.replace(/\s+/g, ' ').trim() : String(v);
    }
    return String(v).replace('.', ',');
  }
  // Escribir un control como lo haría la persona: un grupo se pulsa; el resto cambia de valor y
  // avisa con `input` y `change` (cada página escucha uno u otro).
  function escribir(id, v) {
    const n = $(id);
    if (!n) return false;
    if (n.classList && n.classList.contains('seg')) {
      const b = n.querySelector(`[data-v="${CSS.escape(String(v))}"]`);
      if (!b) return false;
      b.click();
      return true;
    }
    if (n.type === 'checkbox') n.checked = !!v;
    else n.value = String(v);
    n.dispatchEvent(new Event('input', { bubbles: true }));
    n.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  }

  function montar(cfg) {
    const boton = $('btnPliego'), texto = $('pliegoTexto'), estado = $('pliegoEstado'), caja = $('pliegoResultado');
    if (!boton || !texto || !estado || !caja) return;
    let propuestas = [];

    function pintar(r) {
      propuestas = r.propuestas || [];
      const filas = propuestas.map((p, i) => {
        const ahora = actual(p.campo);
        const igual = ahora === p.valor || (ahora !== null && String(ahora) === String(p.valor));
        return `<tr>
          <td><label class="check" style="margin:0"><input type="checkbox" class="pliego-sel" data-i="${i}" ${igual ? 'disabled' : ''}> <span>${esc(p.n)}</span></label></td>
          <td>${esc(rotulo(p.campo, ahora))}</td>
          <td><b>${esc(rotulo(p.campo, p.valor))}</b>${igual ? ' <span class="hint">(ya lo tiene)</span>' : ''}</td>
          <td><q>${esc(p.cita)}</q>${p.nota ? `<div class="hint">${esc(p.nota)}</div>` : ''}</td>
        </tr>`;
      }).join('');
      const descartes = (r.rechazadas || []).map((x) => `<li><b>${esc(x.n)}</b> (${esc(x.valor)}): ${esc(x.motivo)}${x.cita ? ` — <q>${esc(x.cita)}</q>` : ''}</li>`).join('');
      caja.innerHTML = (propuestas.length
        ? `<div class="scroll"><table class="tabla-pliego"><thead><tr><th>Parámetro</th><th>Actual</th><th>Propuesto</th><th>Cita del pliego (comprobada en el texto)</th></tr></thead><tbody>${filas}</tbody></table></div>
           <div class="row" style="gap:8px;margin-top:8px"><button type="button" class="btn ghost" id="btnPliegoTodas">Marcar todas</button><button type="button" class="btn" id="btnPliegoAplicar" disabled>Aplicar las marcadas</button></div>
           <p class="hint">Se aplica solo lo marcado. Lo que el pliego no dice sigue con su valor actual.</p>`
        : '<p class="hint">El texto no dice ninguno de los parámetros de esta página: no hay nada que proponer.</p>')
        + (descartes ? `<details style="margin-top:8px"><summary>Descartadas por el servidor (${(r.rechazadas || []).length})</summary><ul class="clean">${descartes}</ul></details>` : '');
      const aplicar = $('btnPliegoAplicar');
      const marcadas = () => [...caja.querySelectorAll('.pliego-sel:checked')].map((c) => propuestas[+c.dataset.i]);
      caja.querySelectorAll('.pliego-sel').forEach((c) => c.addEventListener('change', () => { aplicar.disabled = !marcadas().length; }));
      const todas = $('btnPliegoTodas');
      if (todas) todas.addEventListener('click', () => { caja.querySelectorAll('.pliego-sel:not(:disabled)').forEach((c) => { c.checked = true; }); aplicar.disabled = !marcadas().length; });
      if (aplicar) aplicar.addEventListener('click', () => {
        const elegidas = marcadas();
        // El modo y la plataforma antes que el resto: cambian qué controles están activos.
        const orden = ['modeSeg', 'plataforma', 'unit'];
        elegidas.sort((a, b) => (orden.indexOf(b.campo) + 1 || 0) - (orden.indexOf(a.campo) + 1 || 0));
        const hechas = elegidas.filter((p) => escribir(p.campo, p.valor));
        estado.innerHTML = `<p class="hint">Aplicados ${hechas.length} parámetro${hechas.length === 1 ? '' : 's'} del pliego: el dimensionador ya recalculó con ellos.</p>`;
        pintar({ propuestas, rechazadas: r.rechazadas });
        if (typeof cfg.alAplicar === 'function') cfg.alAplicar(hechas);
      });
    }

    boton.addEventListener('click', async () => {
      const t = texto.value;
      if (!t.trim()) { estado.innerHTML = '<p class="warn">Pega el texto del pliego.</p>'; return; }
      boton.disabled = true;
      caja.innerHTML = '';
      estado.innerHTML = '<p class="hint">Analizando el pliego… puede tardar unas decenas de segundos.</p>';
      try {
        const res = await fetch('/api/escenario/desde-documento', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pagina: cfg.pagina, texto: t }),
        });
        const r = await res.json().catch(() => ({}));
        if (!res.ok) { estado.innerHTML = `<p class="warn">${esc(r.error || `El servidor respondió ${res.status}.`)}</p>`; return; }
        estado.innerHTML = `<p class="hint">${(r.propuestas || []).length} parámetro${(r.propuestas || []).length === 1 ? '' : 's'} propuesto${(r.propuestas || []).length === 1 ? '' : 's'}, cada uno con su cita comprobada en el texto. Marca los que aceptas.</p>`;
        pintar(r);
      } catch {
        estado.innerHTML = '<p class="warn">No se pudo contactar con el servidor.</p>';
      } finally {
        boton.disabled = false;
      }
    });
  }

  window.PLIEGO = { montar, actual, rotulo, escribir };
})();
