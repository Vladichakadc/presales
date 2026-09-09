'use strict';
/* Procedencia de cada fabricante (documentos verificados), carga de fuente oficial y
   contraste en el acto contra el catálogo — sin IA, en el navegador. Vivía embebido en
   index.js, atado a las siete cajas `[data-procedencia]` del portal; se compartió porque el
   dimensionador de Fortinet pasó a tener su propia pestaña "Fuentes" (2026-09-09) y
   duplicarlo ahí lo habría hecho divergir del portal, la misma razón por la que bom.js,
   ficha.js y estado.js ya son módulos compartidos entre páginas.

   Cada página registra de dónde salen los modelos de un fabricante para el contraste
   (`PROCEDENCIA.registrarModelos`), porque cada una los guarda distinto: el portal tiene los
   siete en PR tras /api/catalog, un dimensionador solo tiene el suyo en MODELS tras
   /api/dimensionador/<vendor>. El resto — leer /api/fuentes, pintar la tabla, subir, borrar,
   contrastar — es idéntico en ambas y no depende de esa forma.

   Requiere que window.CONTRASTE (js/contraste.js) y SheetJS (/vendor/xlsx.js, cargado bajo
   demanda) estén disponibles; se autoinicia al cargar, igual que js/tabla.js y
   js/navegacion.js — no hace falta llamarlo desde la página. */
(function (global) {
  function escapeHtml(v) {
    return String(v ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  }

  const ESTADO_FUENTE = {
    vigente: { etiqueta: 'Vigente', color: 'var(--green)' },
    vieja: { etiqueta: 'Conviene revisar', color: 'var(--amber)' },
    'sin fecha': { etiqueta: 'Sin fecha', color: 'var(--amber)' },
    cargada: { etiqueta: 'Cargada', color: 'var(--green)' },
    historico: { etiqueta: 'Sustituida', color: 'var(--steel)' },
  };

  let puedeSync = false;
  const fuenteModelos = {}; // code -> () => [{model, ...specs}]

  function registrarModelos(code, fn) { fuenteModelos[code] = fn; }
  function modelosDeVendor(code) { return fuenteModelos[code] ? fuenteModelos[code]() : []; }

  function filaProcedencia(f, code) {
    const est = ESTADO_FUENTE[f.estado] || ESTADO_FUENTE['sin fecha'];
    const antiguedad = f.meses === null ? '—' : `${f.meses} mes(es)`;
    const enlace = /^(https?:\/\/|\/)/i.test(f.url || '')
      ? `<a href="${escapeHtml(f.url)}" target="_blank" rel="noopener noreferrer" style="color:var(--red)">${escapeHtml(f.documento)}</a>`
      : escapeHtml(f.documento);
    const accion = f.subida && f.id
      ? `<button class="btn" style="padding:3px 9px;font-size:11px;background:#fff;color:var(--red);border:1px solid var(--rule)"
           data-borrar-fuente="${escapeHtml(code)}" data-fuente-id="${escapeHtml(f.id)}"
           title="Borra este documento cargado y su fila de procedencia">Borrar</button>`
      : '<span style="color:var(--steel);font-size:11px" title="Esta fuente viene del catálogo (server/seed/legacyData/fuentes.js): se quita con un commit, no desde aquí">en el código</span>';
    const cols = puedeSync ? 6 : 5;
    return `<tr>
      <td>${enlace}</td>
      <td style="white-space:nowrap">${escapeHtml(f.fecha || 'sin fecha')}</td>
      <td style="white-space:nowrap">${escapeHtml(antiguedad)}</td>
      <td style="color:${est.color};font-weight:600;white-space:nowrap">${escapeHtml(est.etiqueta)}</td>
      <td>${escapeHtml(f.cubre || '')}</td>
      ${puedeSync ? `<td style="white-space:nowrap;text-align:center">${accion}</td>` : ''}
    </tr>${f.nota ? `<tr><td colspan="${cols}" style="color:var(--steel);font-size:12px;padding-top:0">${escapeHtml(f.nota)}</td></tr>` : ''}`;
  }

  function barraProcedencia(code) {
    return `<div style="display:flex;gap:10px;align-items:center;justify-content:flex-end;margin-bottom:8px">
      <span id="refresco-${escapeHtml(code)}" style="font-size:11.5px;color:var(--steel)"></span>
      <button class="btn" style="padding:5px 12px;font-size:12px;background:#fff;color:var(--ink);border:1px solid var(--rule)"
        data-refrescar-fuentes="${escapeHtml(code)}" title="Vuelve a leer la procedencia del servidor y repinta la tabla">&#8635; Actualizar</button>
    </div>`;
  }

  function controlCargaFuente(code) {
    return `<div class="carga-fuente" style="margin-top:12px;padding:11px 13px;background:var(--bg);border:1px dashed var(--rule);border-radius:6px">
      <p style="margin:0 0 8px;font-size:12.5px;color:var(--ink)"><b>Cargar fuente oficial</b> (PDF, Excel/CSV o texto). Actualiza la procedencia de este fabricante al instante; no reescribe las cifras del catálogo.</p>
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
        <input type="file" id="file-fuente-${escapeHtml(code)}" accept=".pdf,.xlsx,.csv,.tsv,.txt" style="font-size:12px">
        <button class="btn" style="padding:6px 14px;background:var(--ink);color:#fff" data-subir-fuente="${escapeHtml(code)}">Subir</button>
        <span id="estado-fuente-${escapeHtml(code)}" style="font-size:12px;color:var(--steel)"></span>
      </div>
    </div>`;
  }

  async function renderProcedencia() {
    const cajas = document.querySelectorAll('[data-procedencia]');
    if (!cajas.length) return;
    let datos;
    try {
      const res = await fetch('/api/fuentes');
      if (!res.ok) throw new Error('respuesta no válida');
      datos = await res.json();
    } catch {
      cajas.forEach((c) => { c.textContent = 'No se pudo cargar la procedencia del catálogo.'; });
      return;
    }
    cajas.forEach((caja) => {
      const code = caja.dataset.procedencia;
      const v = datos[code];
      const todas = (v && v.fuentes) || [];
      const activas = todas.filter((f) => f.estado !== 'historico');
      const historicas = todas.filter((f) => f.estado === 'historico');
      const cab = `<thead><tr>
            <th>Documento</th><th>Fecha</th><th>Antigüedad</th><th>Estado</th><th>Qué cubre</th>${puedeSync ? '<th style="text-align:center">Acciones</th>' : ''}
          </tr></thead>`;
      const tabla = activas.length
        ? `<table>${cab}<tbody>${activas.map((f) => filaProcedencia(f, code)).join('')}</tbody></table>`
        : '<p style="color:var(--steel);font-size:13px">Sin procedencia registrada para este fabricante.</p>';
      const previas = historicas.length
        ? `<details style="margin-top:10px">
            <summary style="cursor:pointer;font-size:12.5px;color:var(--steel)">${historicas.length} versión(es) anterior(es) de documentos cargados</summary>
            <table style="margin-top:8px">${cab}<tbody>${historicas.map((f) => filaProcedencia(f, code)).join('')}</tbody></table>
          </details>`
        : '';
      caja.innerHTML = barraProcedencia(code) + tabla + previas + (puedeSync ? controlCargaFuente(code) : '');
    });
  }

  async function refrescarFuentes(code) {
    const antes = document.getElementById(`refresco-${code}`);
    if (antes) antes.textContent = 'Actualizando…';
    await renderProcedencia();
    const span = document.getElementById(`refresco-${code}`);
    if (span) {
      const h = new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      span.textContent = `Actualizado a las ${h}`;
    }
  }

  async function subirFuenteOficial(code) {
    const input = document.getElementById(`file-fuente-${code}`);
    const estado = document.getElementById(`estado-fuente-${code}`);
    if (!input || !input.files.length) { if (estado) estado.textContent = 'Elige un archivo primero.'; return; }
    const archivo = input.files[0];
    if (estado) { estado.style.color = 'var(--steel)'; estado.textContent = 'Subiendo…'; }
    try {
      const fd = new FormData();
      fd.append('documento', archivo);
      const res = await fetch(`/api/fuentes/${encodeURIComponent(code)}`, { method: 'POST', body: fd });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'No se pudo subir el documento');
      }
      await renderProcedencia();
      const estado2 = document.getElementById(`estado-fuente-${code}`);
      if (estado2) { estado2.style.color = 'var(--green)'; estado2.textContent = 'Fuente cargada.'; }
      await mostrarContraste(code, archivo);
    } catch (err) {
      if (estado) { estado.style.color = 'var(--red)'; estado.textContent = err.message; }
    }
  }

  async function borrarFuente(code, id) {
    const span = document.getElementById(`refresco-${code}`);
    if (!confirm('¿Borrar este documento cargado?\n\nSe elimina el archivo del servidor y su fila de procedencia. No se puede deshacer.')) return;
    if (span) { span.style.color = 'var(--steel)'; span.textContent = 'Borrando…'; }
    try {
      const res = await fetch(`/api/fuentes/${encodeURIComponent(code)}/documento/${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'No se pudo borrar el documento');
      }
      await renderProcedencia();
      const s2 = document.getElementById(`refresco-${code}`);
      if (s2) { s2.style.color = 'var(--steel)'; s2.textContent = 'Documento borrado.'; }
    } catch (err) {
      const s2 = document.getElementById(`refresco-${code}`);
      if (s2) { s2.style.color = 'var(--red)'; s2.textContent = err.message; }
    }
  }

  /* ══ CONTRASTE DEL DOCUMENTO CARGADO ══
     La regla de qué cuenta como cambio vive en js/contraste.js (window.CONTRASTE); aquí está
     el parseo del archivo y el pintado. Ver ese archivo para el porqué (sin IA, columna
     reconocida solo si casa con un campo real, altas nunca se aplican solas). */
  let contrasteActual = null;
  let xlsxPromesa = null;
  function cargarXLSX() {
    if (global.XLSX) return Promise.resolve(global.XLSX);
    if (xlsxPromesa) return xlsxPromesa;
    xlsxPromesa = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = '/vendor/xlsx.js';
      s.onload = () => (global.XLSX ? resolve(global.XLSX) : reject(new Error('El lector de hojas no se inicializó.')));
      s.onerror = () => reject(new Error('No se pudo cargar el lector de hojas de cálculo.'));
      document.head.appendChild(s);
    });
    return xlsxPromesa;
  }

  async function parsearTabular(archivo) {
    const XLSX = await cargarXLSX();
    const buf = await archivo.arrayBuffer();
    const wb = XLSX.read(buf, { type: 'array' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    if (!ws) return [];
    return XLSX.utils.sheet_to_json(ws, { defval: '' });
  }

  function mensajeNoTabular(motivo) {
    return `<div style="padding:12px;background:var(--bg);border-radius:6px;font-size:13px;line-height:1.6">
      <p style="margin:0 0 6px"><b>${escapeHtml(motivo)}.</b> El contraste automático necesita una tabla (Excel/CSV) con una columna de modelo y cabeceras que casen con los campos del catálogo.</p>
      <p style="margin:0;color:var(--steel)">La fuente quedó registrada en la procedencia. Para convertir un PDF o un texto libre en cambios está el <b>análisis por IA</b> (botón «Sincronizar», si esta página lo tiene) o los importadores (<code>npm run cps / juniper / huawei / propuesta</code>), que contrastan con doble anclaje antes de escribir.</p>
    </div>`;
  }

  async function mostrarContraste(code, archivo) {
    asegurarModal();
    const modal = document.getElementById('contrasteModal');
    const resumen = document.getElementById('contrasteResumen');
    const result = document.getElementById('contrasteResult');
    const fuente = document.getElementById('contrasteFuente');
    const btnDesc = document.getElementById('btnDescargarContraste');
    contrasteActual = null;
    btnDesc.style.display = 'none';
    fuente.style.display = 'none';
    resumen.innerHTML = '';
    result.innerHTML = '<p>Contrastando el documento con el catálogo…</p>';
    modal.style.display = 'flex';

    const nombre = archivo.name || 'documento';
    if (/\.pdf$/i.test(nombre)) { result.innerHTML = mensajeNoTabular('Es un PDF'); return; }

    let filas;
    try {
      filas = await parsearTabular(archivo);
    } catch (err) {
      result.innerHTML = `<p style="color:var(--red)">${escapeHtml(err.message)}</p>`;
      return;
    }
    const r = global.CONTRASTE.contrastar({ modelos: modelosDeVendor(code), filas });
    if (r.error) { result.innerHTML = mensajeNoTabular(r.error); return; }
    contrasteActual = Object.assign({ vendor: code, documento: nombre }, r);
    renderContraste();
  }

  function renderContraste() {
    const r = contrasteActual;
    const resumen = document.getElementById('contrasteResumen');
    const result = document.getElementById('contrasteResult');
    const fuente = document.getElementById('contrasteFuente');
    const btnDesc = document.getElementById('btnDescargarContraste');

    const porSku = r.modo === 'sku';
    const clave = porSku
      ? `casado por SKU (columna «${escapeHtml(r.columnaClave)}») contra el SKU de hardware del catálogo`
      : `casado por nombre de modelo (columna «${escapeHtml(r.columnaClave)}»)`;
    resumen.innerHTML = `<b>${escapeHtml(r.documento)}</b> — ${r.cambios.length} cambio(s), `
      + `${porSku ? `${r.sinCasar} fila(s) sin equivalencia` : `${r.altas.length} alta(s)`}, ${r.sinCambio} sin cambio. `
      + `${clave}. Columnas reconocidas: ${r.columnasUsadas.length ? r.columnasUsadas.map(escapeHtml).join(', ') : '—'}.`;

    let html = '';
    if (r.cambios.some((c) => c.field === 'elp')) {
      html += '<div style="margin:0 0 10px;padding:9px 11px;background:#FFFBEB;border:1px solid #FDE68A;border-left:3px solid var(--amber);border-radius:4px;font-size:12px;line-height:1.5;color:#78350f">'
        + '<b>Los cambios de precio se listan para revisar, no se publican por aquí.</b> Los precios viven en <code>cotizadorCatalog.js</code>, no en los ficheros de especificaciones, y <code>npm run propuesta</code> los aparta a propósito. Sirven para ver qué se movió respecto a la lista vigente; llevarlos al catálogo sigue siendo un cambio a mano.'
        + '</div>';
    }
    if (r.cambios.length) {
      html += '<h4 style="margin:12px 0 6px;font-size:14px">Cambios propuestos</h4>';
      html += '<table class="diff-table"><tr><th><input type="checkbox" id="contrasteTodos" checked></th><th>Modelo</th><th>Campo</th><th>Valor actual</th><th>Valor del documento</th></tr>';
      r.cambios.forEach((c, i) => {
        html += `<tr>
          <td style="text-align:center"><input type="checkbox" class="contraste-check" data-idx="${i}" checked></td>
          <td><strong>${escapeHtml(c.id)}</strong></td>
          <td>${escapeHtml(c.field)}</td>
          <td class="diff-old">${escapeHtml(c.oldValue === null ? 'N/A' : c.oldValue)}</td>
          <td class="diff-new">${escapeHtml(c.newValue)}</td>
        </tr>`;
      });
      html += '</table>';
    } else {
      html += '<p style="color:var(--steel)">El documento no trae ningún valor distinto del catálogo vigente en las columnas reconocidas.</p>';
    }

    if (r.altas.length) {
      html += '<h4 style="margin:16px 0 6px;font-size:14px">Modelos no encontrados en el catálogo</h4>';
      html += '<p style="font-size:12px;color:var(--steel);margin:0 0 6px">Se reportan pero <b>nunca</b> se aplican solos: dar de alta un modelo se hace a mano, porque es justo donde entra un dato inventado.</p>';
      html += '<ul style="margin:0;padding-left:20px;font-size:13px">' + r.altas.map((a) => `<li>${escapeHtml(a.id)}</li>`).join('') + '</ul>';
    }
    if (porSku && r.sinCasar) {
      html += `<p style="margin:16px 0 0;font-size:12px;color:var(--steel)"><b>${r.sinCasar} fila(s) del documento no corresponden a ningún equipo del catálogo</b> y no se listan: en una lista de precios son licencias, soporte y accesorios. Solo se contrastan las referencias que casan con el SKU de hardware de un equipo.</p>`;
    }
    if (r.columnasIgnoradas.length) {
      html += `<p style="margin:16px 0 0;font-size:12px;color:var(--steel)"><b>Columnas ignoradas</b> (no casan con ningún campo del catálogo): ${r.columnasIgnoradas.map(escapeHtml).join(', ')}.</p>`;
    }

    result.innerHTML = html;
    fuente.style.display = r.cambios.length ? 'block' : 'none';
    btnDesc.style.display = r.cambios.length ? 'inline-block' : 'none';
  }

  function closeContrasteModal() {
    const modal = document.getElementById('contrasteModal');
    if (modal) modal.style.display = 'none';
    contrasteActual = null;
  }

  function descargarContraste() {
    if (!contrasteActual) return;
    const url = document.getElementById('contrasteUrl').value.trim();
    const elegidos = [];
    document.querySelectorAll('#contrasteResult .contraste-check').forEach((ch) => {
      if (ch.checked) elegidos.push(contrasteActual.cambios[Number(ch.dataset.idx)]);
    });
    if (!elegidos.length) { alert('Marca al menos un cambio para descargar.'); return; }
    const propuesta = global.CONTRASTE.comoPropuesta(contrasteActual.vendor, elegidos, url);
    const blob = new Blob([JSON.stringify(propuesta, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `propuesta-${contrasteActual.vendor}-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
  }

  /* El modal y su CSS los trae este módulo: así una página solo necesita la caja
     `[data-procedencia]` y este <script>, sin copiar marcado. index.html define las mismas
     reglas para su propio modal de Sincronizar (comparten `.modal-overlay`/`.diff-table`);
     que queden declaradas dos veces ahí no cambia nada visualmente. */
  function asegurarModal() {
    if (document.getElementById('contrasteModal')) return;
    const style = document.createElement('style');
    style.textContent = `
      .modal-overlay{display:none;position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(14,26,43,0.8);z-index:999;align-items:center;justify-content:center}
      .modal{background:#fff;border-radius:6px;width:90%;max-width:800px;max-height:90vh;display:flex;flex-direction:column;box-shadow:0 10px 30px rgba(0,0,0,0.3)}
      .modal-header{padding:16px 20px;border-bottom:1px solid var(--rule);display:flex;justify-content:space-between;align-items:center}
      .modal-title{font-size:18px;font-weight:600;margin:0}
      .modal-close{background:none;border:none;font-size:24px;cursor:pointer;color:var(--steel)}
      .modal-body{padding:20px;overflow-y:auto;flex:1}
      .modal-footer{padding:16px 20px;border-top:1px solid var(--rule);display:flex;justify-content:flex-end;gap:10px}
      .diff-table{width:100%;border-collapse:collapse;margin-top:10px;font-size:13.5px}
      .diff-table th,.diff-table td{padding:8px 10px;border:1px solid var(--rule);text-align:left}
      .diff-table th{background:var(--paper)}
      .diff-old{color:var(--red);text-decoration:line-through}
      .diff-new{color:var(--green);font-weight:600}
    `;
    document.head.appendChild(style);

    const div = document.createElement('div');
    div.className = 'modal-overlay';
    div.id = 'contrasteModal';
    div.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">&#9878; Contraste del documento con el catálogo</h3>
          <button class="modal-close" data-cerrar-contraste>&times;</button>
        </div>
        <div class="modal-body">
          <div style="margin-bottom:14px;padding:11px 13px;background:#F0F9FF;border:1px solid #BAE6FD;border-left:3px solid var(--steel);border-radius:4px;font-size:12.5px;line-height:1.5;color:#0c4a6e">
            Esto compara el documento que subiste con el catálogo vigente <b>sin IA y en el navegador</b>: reconoce una columna solo si su cabecera casa con un campo real del catálogo, y lo que no reconoce lo <b>lista</b> en vez de adivinar. Es una vista previa: <b>no</b> reescribe el catálogo. Para publicar los cambios se descarga la propuesta y el workflow <code>aplicar-propuesta</code> la aplica sobre <code>legacyData/</code> con anclaje y abre un PR revisable.
          </div>
          <div id="contrasteResumen" style="font-size:13px;margin-bottom:12px;"></div>
          <div id="contrasteResult"></div>
          <div id="contrasteFuente" style="margin-top:16px;display:none">
            <p style="margin:0 0 5px 0;font-size:12.5px;font-weight:600;">URL de la fuente oficial (obligatoria para el PR)</p>
            <p style="margin:0 0 8px 0;font-size:11px;color:var(--steel);">El importador solo acepta un cambio con URL de fuente oficial (<code>https://…</code>) y si su valor anterior casa con lo que el catálogo dice hoy. Sin ella, la descarga sirve para revisar pero el workflow la rechazará.</p>
            <input type="url" id="contrasteUrl" placeholder="https://…" style="width:100%;box-sizing:border-box;padding:7px 9px;font-size:12.5px;border:1px solid var(--rule);border-radius:5px" />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn" style="background:#fff;color:var(--ink);border:1px solid var(--rule)" data-cerrar-contraste>Cerrar</button>
          <button id="btnDescargarContraste" class="btn" style="background:var(--ink);border:none;color:#fff;display:none">&#8681; Descargar propuesta (para PR)</button>
        </div>
      </div>`;
    document.body.appendChild(div);
  }

  document.addEventListener('click', (e) => {
    const subir = e.target.closest('[data-subir-fuente]');
    if (subir) { subirFuenteOficial(subir.dataset.subirFuente); return; }
    const refrescar = e.target.closest('[data-refrescar-fuentes]');
    if (refrescar) { refrescarFuentes(refrescar.dataset.refrescarFuentes); return; }
    const borrar = e.target.closest('[data-borrar-fuente]');
    if (borrar) { borrarFuente(borrar.dataset.borrarFuente, borrar.dataset.fuenteId); return; }
    if (e.target.closest('[data-cerrar-contraste]')) { closeContrasteModal(); return; }
    if (e.target.id === 'btnDescargarContraste') { descargarContraste(); return; }
  });

  document.addEventListener('change', (e) => {
    if (e.target.id === 'contrasteTodos') {
      document.querySelectorAll('#contrasteResult .contraste-check').forEach((ch) => { ch.checked = e.target.checked; });
    }
  });

  renderProcedencia();
  fetch('/api/cuenta/estado')
    .then((r) => (r.ok ? r.json() : null))
    .then((d) => { if (d && d.puedeSync) { puedeSync = true; renderProcedencia(); } })
    .catch(() => {});

  global.PROCEDENCIA = { registrarModelos };
})(window);
