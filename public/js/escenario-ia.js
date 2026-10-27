/* DEL PLIEGO AL ESCENARIO (piloto en el dimensionador Cisco, 2026-10-27).
   La persona pega el texto del pliego; el servidor (POST /api/escenario/desde-texto) devuelve
   propuestas de parámetros con la cita literal que las respalda, ya verificadas contra el texto,
   y las rechazadas con su motivo. Aquí NADA se aplica solo: cada propuesta se acepta a mano, y al
   aceptarla se escribe en el control de la página y se dispara su evento, así que dimensiona el
   motor de siempre. Lo que el pliego no dice se lista para que nadie lo dé por leído.
   Sin JavaScript en línea (CSP): todo va por este archivo. */
(function () {
  'use strict';
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const $ = (id) => document.getElementById(id);

  // Cómo se ve un valor en la página: la opción y el botón con su texto, la casilla como Sí/No.
  function verValor(id, tipo, valor) {
    if (tipo === 'casilla') return valor ? 'Sí' : 'No';
    if (tipo === 'segmento') {
      const b = document.querySelector(`#${id} button[data-v="${valor}"]`);
      return b ? b.textContent.replace(/\s+/g, ' ').trim() : String(valor);
    }
    if (tipo === 'opcion') {
      const o = $(id) && [...$(id).options].find((x) => x.value === String(valor));
      return o ? o.textContent.trim() : String(valor);
    }
    if (id === 'bw') return `${valor} Mbps`;
    return String(valor);
  }

  function valorActual(id, tipo) {
    if (tipo === 'segmento') {
      const b = document.querySelector(`#${id} button[aria-pressed="true"]`);
      return b ? verValor(id, tipo, b.dataset.v) : '—';
    }
    const el = $(id);
    if (!el) return '—';
    if (tipo === 'casilla') return el.checked ? 'Sí' : 'No';
    if (el.value === '') return 'vacío';
    if (id === 'bw') {
      const u = $('unit');
      return `${el.value} ${u && u.value === '1000' ? 'Gbps' : 'Mbps'}`;
    }
    return verValor(id, tipo, el.value);
  }

  function disparar(el) {
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function aplicar(p) {
    if (p.tipo === 'segmento') {
      const b = document.querySelector(`#${p.campo} button[data-v="${p.valor}"]`);
      if (b) b.click();
      return Boolean(b);
    }
    const el = $(p.campo);
    if (!el) return false;
    if (p.tipo === 'casilla') el.checked = Boolean(p.valor);
    else el.value = String(p.valor);
    if (p.campo === 'bw' && $('unit')) { $('unit').value = '1'; disparar($('unit')); }
    disparar(el);
    return true;
  }

  function pintar(caja, datos) {
    const filas = datos.aceptables.map((p, i) => `
      <tr data-i="${i}">
        <td>${esc(p.etiqueta)}</td>
        <td class="ia-actual">${esc(valorActual(p.campo, p.tipo))}</td>
        <td><b>${esc(verValor(p.campo, p.tipo, p.valor))}</b>${p.nota ? `<div class="hint">${esc(p.nota)}</div>` : ''}</td>
        <td><q>${esc(p.cita)}</q></td>
        <td><button type="button" class="btn ghost" data-ia-aceptar="${i}">Aceptar</button></td>
      </tr>`).join('');
    const rech = datos.rechazadas.length ? `
      <p class="hint" style="margin-top:10px"><b>No se usan (${datos.rechazadas.length}):</b>
      ${datos.rechazadas.map((r) => `${esc(r.etiqueta || r.campo)}: ${esc(r.motivo)}`).join(' · ')}</p>` : '';
    const sin = datos.sinDato.length ? `
      <p class="hint"><b>El pliego no lo dice</b> (siguen con su valor; revísalos tú): ${esc(datos.sinDato.join(', '))}.</p>` : '';
    caja.innerHTML = (datos.aceptables.length ? `
      <div style="overflow-x:auto"><table class="ia-tabla">
        <thead><tr><th scope="col">Campo</th><th scope="col">Ahora</th><th scope="col">Propuesto</th><th scope="col">Cita del pliego</th><th scope="col">Acción</th></tr></thead>
        <tbody>${filas}</tbody></table></div>`
      : '<p class="hint">El texto no dice ningún parámetro de este dimensionador con una cita que se pueda comprobar.</p>') + rech + sin;
    caja.querySelectorAll('[data-ia-aceptar]').forEach((b) => b.addEventListener('click', () => {
      const p = datos.aceptables[Number(b.dataset.iaAceptar)];
      if (!aplicar(p)) { b.textContent = 'No se pudo'; return; }
      b.disabled = true;
      b.textContent = 'Aceptado';
      const fila = b.closest('tr');
      fila.querySelector('.ia-actual').textContent = valorActual(p.campo, p.tipo);
    }));
  }

  document.addEventListener('DOMContentLoaded', () => {
    const raiz = $('pliegoIA');
    if (!raiz) return;
    const pagina = raiz.dataset.pagina;
    const boton = $('pliegoEnviar');
    const estado = $('pliegoEstado');
    const salida = $('pliegoSalida');
    boton.addEventListener('click', async () => {
      const texto = $('pliegoTexto').value;
      boton.disabled = true;
      estado.textContent = 'Leyendo el pliego con IA… puede tardar unos segundos.';
      salida.innerHTML = '';
      try {
        const r = await fetch('/api/escenario/desde-texto', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ pagina, texto }),
        });
        const datos = await r.json().catch(() => ({}));
        if (!r.ok) { estado.textContent = datos.error || `No se pudo leer el pliego (${r.status}).`; return; }
        estado.textContent = `${datos.aceptables.length} propuesta(s) con su cita. Acepta solo las que quieras: el motor dimensiona con lo aceptado.`;
        pintar(salida, datos);
      } catch {
        estado.textContent = 'No se pudo contactar con el servidor. Rellena el escenario a mano.';
      } finally {
        boton.disabled = false;
      }
    });
  });

}());
