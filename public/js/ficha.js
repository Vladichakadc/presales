'use strict';
// Selector de equipo candidato + ficha completa, compartido por los cinco dimensionadores.
//
// POR QUE UN MODULO Y NO CINCO COPIAS
// El bloque "Modelo recomendado" era en cada pagina un unico equipo fijo: el que ganaba el
// sizing. Pero en preventa casi nunca se cotiza el primero de la lista a ciegas — se
// compara el que cumple justo con el siguiente escalon, o se descarta uno por plazo de
// entrega. Convertirlo en un desplegable de TODOS los que cumplen, con la ficha completa
// del que se elija, es la diferencia entre una herramienta que decide por ti y una que te
// deja decidir con los datos delante. Va aqui, junto a bom.js, para que las cinco paginas
// lo compartan en vez de divergir.
//
// COMO SE USA
//   FICHA.render({
//     contenedor: 'verdict',        // id del nodo donde se pinta
//     candidatos: [...],            // modelos que cumplen, en orden de recomendacion
//     recomendado: 'ID',            // cual marca el motor como recomendado
//     seleccionado: 'ID',           // cual esta elegido ahora (por defecto, el recomendado)
//     titulo: m => 'nombre',        // titular de la ficha
//     subtitulo: m => 'familia',    // linea secundaria
//     etiqueta: (m,i) => 'texto',   // texto de cada opcion del desplegable
//     medidores: m => [{etq, val, tope, txt}],   // barras de holgura del modelo elegido
//     secciones: m => [{titulo, filas:[[clave, valorHTML]], nota}],
//     vendor: 'fortinet',           // fabricante, para pedir sus referencias de pedido
//     alCambiar: id => {},          // se avisa a la pagina para sincronizar el BOM
//   })
//
// La pagina conserva el motor de dimensionamiento; este modulo solo presenta. Ninguna
// cifra se calcula aqui.

(function (global) {
  'use strict';

  // El estilo viaja con el modulo, como en bom.js, y usa las variables de color que cada
  // pagina ya declara en :root — asi cada fabricante conserva su acento sin configurar nada.
  const CSS = `
.ficha-sel{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:2px 0 12px}
.ficha-sel label{font-family:'IBM Plex Mono',monospace;font-size:9.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--steel);font-weight:600}
.ficha-sel select{flex:1;min-width:220px;padding:7px 9px;border:1px solid var(--rule);border-radius:3px;background:var(--card);color:var(--ink);font-family:'Barlow',sans-serif;font-size:13.5px}
.ficha-sel select:focus{outline:2px solid var(--red);outline-offset:1px}
.ficha-cuenta{font-family:'IBM Plex Mono',monospace;font-size:10.5px;color:var(--steel)}
.ficha-volver{flex:none;padding:7px 11px;border:1px solid var(--rule);border-radius:3px;background:var(--card);color:var(--ink);font-family:'IBM Plex Mono',monospace;font-size:10.5px;letter-spacing:.06em;text-transform:uppercase;cursor:pointer}
.ficha-volver:hover{border-color:var(--red);color:var(--red)}
.ficha-volver:focus-visible{outline:2px solid var(--red);outline-offset:1px}
.ficha-desvio{font-size:12px;color:var(--steel);margin:0 0 10px;line-height:1.45}
.ficha-sec{margin-top:14px}
.ficha-sec h3{font-family:'IBM Plex Mono',monospace;font-size:9.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--steel);font-weight:600;margin:0 0 6px;padding-top:10px;border-top:1px solid var(--rule)}
.ficha-tabla{width:100%;border-collapse:collapse;font-size:13px}
.ficha-tabla td{padding:4px 0;vertical-align:top;border-bottom:1px solid var(--paper)}
.ficha-tabla td:first-child{color:var(--steel);width:44%;padding-right:10px}
.ficha-tabla td:last-child{text-align:right;font-family:'IBM Plex Mono',monospace;font-size:12px}
.ficha-tabla td.libre{text-align:left;font-family:'Barlow',sans-serif;font-size:12.5px}
.ficha-nota{font-size:11.5px;color:var(--steel);margin:6px 0 0;line-height:1.45}
.ficha-vacio{font-size:13.5px;color:var(--steel);margin:0}
.ficha-rec{background:var(--red);color:#fff;border-radius:2px;padding:1px 6px;font-family:'IBM Plex Mono',monospace;font-size:9px;letter-spacing:.08em;text-transform:uppercase;margin-left:7px;vertical-align:2px}
.ficha-ref{border:1px solid var(--rule);color:var(--steel);border-radius:2px;padding:1px 6px;font-family:'IBM Plex Mono',monospace;font-size:9px;letter-spacing:.08em;text-transform:uppercase;margin-left:7px;vertical-align:2px}
.ficha-ref.fuera{background:var(--steel);color:var(--paper);border-color:var(--steel)}
.ficha-aviso{font-size:12.5px;color:var(--steel);border-left:2px solid var(--steel);padding:5px 0 5px 9px;margin:9px 0 0;line-height:1.45}
.ficha-refs{margin-top:18px}
.ficha-refs h3{font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--steel);font-weight:600;margin:0 0 8px}
.ficha-refs-barra{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:8px}
.ficha-refs-barra input{flex:1;min-width:170px;padding:6px 9px;border:1px solid var(--rule);border-radius:3px;background:var(--card);color:var(--ink);font-family:'Barlow',sans-serif;font-size:12.5px}
.ficha-refs-barra input:focus{outline:2px solid var(--red);outline-offset:1px}
.ficha-refs-chip{padding:4px 10px;border:1px solid var(--rule);border-radius:11px;background:var(--card);color:var(--steel);font-family:'IBM Plex Mono',monospace;font-size:10.5px;cursor:pointer}
.ficha-refs-chip.on{background:var(--ink);color:#fff;border-color:var(--ink)}
.ficha-refs-caja{max-height:420px;overflow:auto;border:1px solid var(--rule);border-radius:4px}
.ficha-refs table{width:100%;border-collapse:collapse;font-size:12.5px}
.ficha-refs thead th{position:sticky;top:0;background:var(--bg);text-align:left;padding:6px 9px;font-family:'IBM Plex Mono',monospace;font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--steel);border-bottom:1px solid var(--rule);z-index:1}
.ficha-refs tbody td{padding:5px 9px;border-bottom:1px solid var(--rule);vertical-align:top}
.ficha-refs tbody tr:last-child td{border-bottom:0}
.ficha-refs .sku{font-family:'IBM Plex Mono',monospace;font-size:11.5px;white-space:nowrap;color:var(--ink)}
.ficha-refs .pre{text-align:right;white-space:nowrap;font-family:'IBM Plex Mono',monospace;font-size:11.5px}
.ficha-refs-add{border:1px solid var(--rule);background:var(--card);color:var(--ink);border-radius:3px;cursor:pointer;font-family:'IBM Plex Mono',monospace;font-size:10px;padding:2px 7px;white-space:nowrap}
.ficha-refs-add:hover{border-color:var(--red);color:var(--red)}
.ficha-refs .vacio{padding:10px;color:var(--steel);font-size:12.5px}
`;
  if (!document.getElementById('ficha-estilos')) {
    const st = document.createElement('style');
    st.id = 'ficha-estilos';
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  const esc = (s) => String(s == null ? '' : s)
    .replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // ── REGLA TRANSVERSAL: FUERA DE VENTA SE MUESTRA, PERO NO SE RECOMIENDA ─────
  //
  // Estaba repartida y era contradictoria. Fortinet y MikroTik BORRABAN de la lista de
  // candidatos los equipos descontinuados: no se recomendaban, cierto, pero tampoco se
  // podian consultar, que es justo lo que hace falta cuando se cotiza una ampliacion de un
  // parque ya instalado. Cisco, en cambio, los dejaba competir de igual a igual y podia
  // recomendar como respuesta a un diseno nuevo un equipo que ya no se vende. Tres paginas,
  // tres criterios distintos para la misma pregunta. Aqui queda uno solo:
  //
  //   rango 0 · vigente         se recomienda con normalidad
  //   rango 1 · linea anterior  aparece, y solo se propone si nada vigente cumple
  //   rango 2 · fuera de venta  aparece marcado, y NUNCA se propone
  //
  // Un fin de venta ANUNCIADO no es lo mismo que estar fuera de venta: hasta la fecha de
  // ultimo pedido el equipo se pide con normalidad, asi que sigue siendo recomendable y
  // solo se marca con su fecha. Pasada esa fecha cae solo a rango 2, sin que nadie tenga
  // que acordarse de editar el catalogo — que es como estos avisos se quedan obsoletos.
  function eosVencido(m) {
    const f = m && m.eolAnnounced && m.eolAnnounced.lastOrder;
    if (!f) return false;
    const t = Date.parse(f);
    return Number.isFinite(t) && t < Date.now();
  }
  function rango(m) {
    if (!m) return 0;
    if (m.eol || eosVencido(m)) return 2;
    if (m.legacy) return 1;
    return 0;
  }
  const recomendable = (m) => rango(m) < 2;
  function marca(m) {
    if (!m) return null;
    if (m.eol) return { t: 'fuera de venta', fuera: true };
    if (eosVencido(m)) return { t: 'fin de venta vencido', fuera: true };
    if (m.legacy) return { t: 'línea anterior', fuera: false };
    if (m.eolAnnounced) return { t: 'fin de venta anunciado', fuera: false };
    return null;
  }
  function avisoDe(m) {
    const mk = marca(m);
    if (!mk) return '';
    if (m.eol) return 'Equipo <b>fuera de venta</b>. Se muestra como referencia para ampliar o reemplazar un parque ya instalado; no se propone para un diseño nuevo y por eso nunca sale recomendado.';
    if (eosVencido(m)) return `Su <b>fecha de último pedido (${esc(m.eolAnnounced.lastOrder)}) ya pasó</b>: a efectos de un diseño nuevo está fuera de venta. Queda como referencia para el parque instalado.`;
    if (m.legacy) return 'Pertenece a la <b>línea anterior</b>. Sigue en canal y es la respuesta natural para ampliar un parque instalado, pero solo se recomienda si ningún equipo de la generación actual cumple.';
    return `<b>Fin de venta anunciado</b> — último día de pedido: <b>${esc(m.eolAnnounced.lastOrder)}</b>. Hasta esa fecha se pide con normalidad; después dejará de proponerse solo.`;
  }

  // Estado por contenedor: permite varias fichas en una pagina sin que se pisen.
  const estado = {};

  function medidorHtml(m) {
    const pct = m.tope > 0 ? Math.min((m.val / m.tope) * 100, 100) : 0;
    const cls = pct > 90 ? 'tight' : pct < 70 ? 'good' : '';
    return `<div class="meter"><b>${esc(m.etq)} <em>${esc(m.txt || '')}</em></b>`
      + `<div class="bar"><i class="${cls}" style="width:${pct}%"></i></div></div>`;
  }

  function seccionHtml(sec) {
    const filas = (sec.filas || []).filter((f) => f && f.length);
    if (!filas.length && !sec.nota) return '';
    return `<div class="ficha-sec"><h3>${esc(sec.titulo)}</h3>`
      + (filas.length ? `<table class="ficha-tabla"><tbody>${filas.map(([k, v, libre]) =>
        `<tr><td>${esc(k)}</td><td class="${libre ? 'libre' : ''}">${v == null ? '—' : v}</td></tr>`).join('')}</tbody></table>` : '')
      + (sec.nota ? `<p class="ficha-nota">${sec.nota}</p>` : '')
      + '</div>';
  }

  // ── REFERENCIAS DE PEDIDO ──────────────────────────────────────────────────────────────
  // Que hay que PEDIR, no solo que equipo elegir. La ficha mostraba el rendimiento y ni un
  // solo numero de parte, asi que quien armaba una propuesta tenia el modelo y luego tenia
  // que ir a buscar el SKU a otro sitio.
  //
  // SE PIDE POR MODELO Y BAJO DEMANDA. Las referencias de Fortinet son 6.849 (774 KB): meterlas
  // en el payload del dimensionador cargaria todo eso en cada visita para mostrar, como mucho,
  // las de un equipo. Por modelo son unos 12 KB.
  //
  // SE CACHEA POR equipo porque cambiar de modelo y volver es el gesto normal de comparar dos
  // candidatos, y repetir la peticion cada vez haria parpadear la tabla sin motivo.
  const cacheRefs = new Map();

  const fmtPrecio = (p) => (p == null ? '—' : '$' + Number(p).toLocaleString('en-US'));

  function refsHtml(cid, datos, filtro, tipo) {
    // Solo donde hay un BOM que reciba la linea. En una pagina sin bom.js el boton prometeria
    // algo que no existe.
    const puedeAnadir = !!(global.BOM && global.BOM.agregarRef);
    const q = (filtro || '').trim().toLowerCase();
    const lista = datos.refs.filter((r) => {
      if (tipo && r.t !== tipo) return false;
      if (!q) return true;
      return (r.sku || '').toLowerCase().includes(q) || (r.d || '').toLowerCase().includes(q);
    });

    if (estado[cid]) estado[cid]._refVisibles = lista;

    // Los tipos salen de los datos, no de una lista escrita a mano: si el documento trae una
    // categoria nueva aparece sola, en vez de quedarse invisible por no estar prevista.
    const tipos = [...new Set(datos.refs.map((r) => r.t).filter(Boolean))];
    const chips = tipos.length > 1
      ? tipos.map((t) => `<button type="button" class="ficha-refs-chip${tipo === t ? ' on' : ''}" data-ficha-tipo="${esc(t)}">${esc(t)}</button>`).join('')
        + `<button type="button" class="ficha-refs-chip${tipo ? '' : ' on'}" data-ficha-tipo="">Todas</button>`
      : '';

    const cuerpo = lista.length
      ? `<div class="ficha-refs-caja"><table><thead><tr>`
        + `<th>SKU</th><th>Descripción</th><th style="text-align:right">Precio de lista</th>`
        + `${puedeAnadir ? '<th></th>' : ''}`
        + `</tr></thead><tbody>${lista.map((r, i) => `<tr>`
          + `<td class="sku">${r.sku ? esc(r.sku) : '<span style="color:var(--steel)">sin número de parte</span>'}</td>`
          + `<td>${esc(r.d || '')}</td>`
          + `<td class="pre">${fmtPrecio(r.p)}</td>`
          // Ver la referencia no basta: lo que hace falta es poder meterla en la cotizacion.
          // El indice viaja en el boton porque el SKU puede ser null (las variantes de Aruba).
          + `${puedeAnadir ? `<td class="pre"><button type="button" class="ficha-refs-add" data-ficha-add="${i}">Añadir</button></td>` : ''}`
          + `</tr>`).join('')}</tbody></table></div>`
      : `<p class="vacio">Ninguna referencia coincide con la búsqueda.</p>`;

    return `<h3>Referencias de pedido<span class="ficha-cuenta"> · ${lista.length}`
      + `${lista.length !== datos.refs.length ? ` de ${datos.refs.length}` : ''}</span></h3>`
      + `<div class="ficha-refs-barra">`
      + `<input type="search" id="${cid}-refq" placeholder="Buscar SKU o descripción…" value="${esc(filtro || '')}">`
      + chips + '</div>'
      + cuerpo
      + (datos.nota ? `<p class="ficha-nota">${esc(datos.nota)}` + (datos.fuente ? ` Fuente: ${esc(datos.fuente)}.` : '') + '</p>' : '');
  }

  function pintarRefs(cid) {
    const cfg = estado[cid];
    const caja = document.getElementById(cid + '-refs');
    if (!cfg || !caja) return;
    const datos = cfg._refs;
    if (!datos) return;
    if (!datos.refs.length) {
      // Un fabricante sin referencias lo DICE, en vez de dejar un hueco que se lee como si la
      // pantalla estuviera rota. Es el mismo criterio que «el catalogo no lo especifica».
      caja.innerHTML = '<h3>Referencias de pedido</h3>'
        + `<p class="ficha-nota">${esc(datos.nota || 'El catálogo no trae referencias de pedido para este equipo.')}</p>`;
      return;
    }
    caja.innerHTML = refsHtml(cid, datos, cfg._refFiltro, cfg._refTipo);
    // El boton indexa sobre la lista VISIBLE (ya filtrada), asi que se guarda esa misma: usar
    // la completa haria que con el buscador puesto se anadiera una referencia distinta de la
    // que se pulso.
    const visibles = cfg._refVisibles || [];
    caja.querySelectorAll('[data-ficha-add]').forEach((b) => {
      b.addEventListener('click', () => {
        const r = visibles[Number(b.dataset.fichaAdd)];
        if (!r || !global.BOM || !global.BOM.agregarRef) return;
        global.BOM.agregarRef({ sku: r.sku, d: r.d, p: r.p, de: cfg.seleccionado, v: cfg.vendor });
        b.textContent = 'Añadida';
        setTimeout(() => { b.textContent = 'Añadir'; }, 1400);
      });
    });
    const inp = document.getElementById(cid + '-refq');
    if (inp) {
      inp.addEventListener('input', () => {
        cfg._refFiltro = inp.value;
        pintarRefs(cid);
        // Reponer el foco y el cursor: repintar la tabla no debe echar a quien esta escribiendo.
        const n = document.getElementById(cid + '-refq');
        if (n) { n.focus(); n.setSelectionRange(n.value.length, n.value.length); }
      });
    }
    caja.querySelectorAll('[data-ficha-tipo]').forEach((b) => {
      b.addEventListener('click', () => { cfg._refTipo = b.dataset.fichaTipo || null; pintarRefs(cid); });
    });
  }

  function cargarRefs(cid, vendor, modelo) {
    const cfg = estado[cid];
    if (!cfg || !vendor || !modelo) return;
    // El BOM guarda las referencias de los siete fabricantes en una sola lista, y necesita
    // saber cual es el de esta pagina para pintar solo las suyas. Se lo decimos aqui porque es
    // el unico sitio que ya conoce el fabricante sin que las siete paginas tengan que cablearlo.
    if (global.BOM && global.BOM.fijarVendor) global.BOM.fijarVendor(vendor);
    const clave = vendor + '|' + modelo;
    // Cambiar de equipo limpia el buscador y el filtro de tipo: heredarlos haria que la
    // tabla del equipo nuevo apareciera recortada por una busqueda que era del anterior.
    if (cfg._refClave !== clave) { cfg._refFiltro = ''; cfg._refTipo = null; cfg._refClave = clave; }
    if (cacheRefs.has(clave)) { cfg._refs = cacheRefs.get(clave); pintarRefs(cid); return; }
    const caja = document.getElementById(cid + '-refs');
    if (caja) caja.innerHTML = '<h3>Referencias de pedido</h3><p class="ficha-nota">Cargando…</p>';
    fetch(`/api/referencias/${encodeURIComponent(vendor)}/${encodeURIComponent(modelo)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) throw new Error('respuesta no válida');
        cacheRefs.set(clave, d);
        // Puede haber cambiado de equipo mientras llegaba: solo se pinta si sigue siendo el suyo.
        if (estado[cid] && estado[cid].seleccionado === modelo) { estado[cid]._refs = d; pintarRefs(cid); }
      })
      .catch(() => {
        const c = document.getElementById(cid + '-refs');
        if (c) c.innerHTML = '<h3>Referencias de pedido</h3><p class="ficha-nota">No se pudieron cargar las referencias de este equipo.</p>';
      });
  }

  function pintar(cid) {
    const cfg = estado[cid];
    const cont = document.getElementById(cid);
    if (!cont || !cfg) return;
    const { candidatos, recomendado } = cfg;

    if (!candidatos.length) {
      cont.innerHTML = `<p class="tag">Modelo recomendado</p>`
        + `<p class="model">Sin candidato</p>`
        + `<p class="family">${esc(cfg.vacioTitulo || 'Ningún equipo cumple todas las restricciones')}</p>`
        + `<div class="why">${cfg.vacioDetalle || ''}</div>`;
      return;
    }

    const sel = candidatos.find((m) => m.id === cfg.seleccionado) || candidatos[0];
    cfg.seleccionado = sel.id;

    const opciones = candidatos.map((m, i) => {
      const txt = cfg.etiqueta ? cfg.etiqueta(m, i) : m.id;
      const mk = marca(m);
      return `<option value="${esc(m.id)}"${m.id === sel.id ? ' selected' : ''}>`
        + `${esc(txt)}${mk ? '  ·  ' + mk.t : ''}${m.id === recomendado ? '  ·  recomendado' : ''}</option>`;
    }).join('');
    const mkSel = marca(sel);

    const medidores = (cfg.medidores ? cfg.medidores(sel) : []).map(medidorHtml).join('');
    const secciones = (cfg.secciones ? cfg.secciones(sel) : []).map(seccionHtml).join('');

    // Apartarse del recomendado es legitimo y por eso existe el desplegable, pero tiene que
    // VERSE: la queja que destapo el trinquete era justamente que la pagina mostraba
    // siempre el mismo equipo sin decir que ya no era el que salia del dimensionamiento.
    const desviado = cfg.deliberada && recomendado && sel.id !== recomendado;

    cont.innerHTML = `<p class="tag">Equipos que cumplen`
      + `<span class="ficha-cuenta"> · ${candidatos.length}</span></p>`
      + `<div class="ficha-sel"><label for="${cid}-sel">Equipo</label>`
      + `<select id="${cid}-sel">${opciones}</select>`
      + (desviado ? `<button type="button" class="ficha-volver" id="${cid}-volver">`
        + `Volver al recomendado</button>` : '')
      + '</div>'
      + (desviado ? `<p class="ficha-desvio">Estás viendo un equipo <b>elegido a mano</b>. `
        + `El dimensionamiento propone el <b>${esc(recomendado)}</b>; toda la ficha, el `
        + `resumen y el BOM siguen al que tienes elegido.</p>` : '')
      + `<p class="model">${esc(cfg.titulo ? cfg.titulo(sel) : sel.id)}`
      + `${sel.id === recomendado ? '<span class="ficha-rec">recomendado</span>' : ''}`
      + `${mkSel ? `<span class="ficha-ref${mkSel.fuera ? ' fuera' : ''}">${esc(mkSel.t)}</span>` : ''}</p>`
      + `<p class="family">${esc(cfg.subtitulo ? cfg.subtitulo(sel) : '')}</p>`
      + (mkSel ? `<p class="ficha-aviso">${avisoDe(sel)}</p>` : '')
      + medidores
      + (cfg.porQue ? `<div class="why">${cfg.porQue(sel)}</div>` : '')
      + secciones
      + `<div class="ficha-refs" id="${cid}-refs"></div>`;

    // Sin onchange= en linea: la CSP del sitio prohibe todo codigo inline.
    const nodo = document.getElementById(cid + '-sel');
    if (nodo) {
      nodo.addEventListener('change', () => {
        cfg.seleccionado = nodo.value;
        // Tocar el desplegable es lo unico que convierte una seleccion en deliberada. Ver
        // el comentario de render(): sin esta marca la seleccion heredada se reciclaba y el
        // recomendado no volvia nunca.
        cfg.deliberada = true;
        pintar(cid);
        if (cfg.alCambiar) cfg.alCambiar(nodo.value);
      });
    }
    // Salida del modo manual. Sin esto, apartarse del recomendado era una puerta de un solo
    // sentido: habia que acordarse de cual era y volver a buscarlo en una lista de 58.
    const btn = document.getElementById(cid + '-volver');
    if (btn) {
      btn.addEventListener('click', () => {
        cfg.seleccionado = recomendado;
        cfg.deliberada = false;
        pintar(cid);
        if (cfg.alCambiar) cfg.alCambiar(recomendado);
      });
    }

    // Las referencias del equipo elegido. Solo si la pagina declara su fabricante: sin el no
    // hay a quien preguntar, y es preferible no pintar la seccion a pintarla vacia.
    if (cfg.vendor) cargarRefs(cid, cfg.vendor, sel.id);
  }

  // ── ALIMENTACION ELECTRICA: SI ES DE DOBLE FUENTE Y SUS CARACTERISTICAS ────────────────
  //
  // `m.redund` es el mismo campo que Cisco ya traia (true/false, 100% de su catalogo
  // verificado): se extiende aqui a los otros cinco fabricantes, pero solo donde el propio
  // catalogo lo dice explicitamente — nunca se deduce del tamano o la gama del equipo. Es
  // tres estados, no dos: true (doble fuente confirmada), false (fuente unica confirmada,
  // como en el ISR 1000 o el Catalyst 8200), y ausente/null (el catalogo no lo dice, que es
  // la mayoria de los 190 y tantos modelos de este catalogo). Tratar "no lo dice" como "no
  // tiene" seria inventar un dato negativo, que es tan falso como inventar uno positivo.
  //
  // `m.psu` es opcional y solo aparece donde el catalogo trae ademas la cifra: consumo en
  // vatios, tipo de fuente (AC/DC) o el rango de entrada. Ahora mismo eso es sobre todo
  // Huawei (los "fuentes 1+1 · N W tipicos" de la serie NE8000 y AR8700, transcritos tal
  // cual del propio catalogo) y puntualmente Aruba. El resto queda `null`: no hay una hoja
  // de consumo electrico publicada en el Product Matrix de Fortinet, el datasheet abreviado
  // de MikroTik ni el material de Juniper que ya usa este catalogo — completar esto pediria
  // el datasheet mecanico de cada modelo, no una tabla como las que resuelven npm run cps o
  // npm run juniper.
  function seccionAlimentacion(m) {
    if (!m) return { titulo: 'Alimentación eléctrica', filas: [] };
    const redund = m.redund;
    const psu = m.psu || {};
    // Cuatro estados, no dos. A los tres que ya habia -si, no, y «no lo dice»- se suma
    // 'opcional' (2026-09-03), que aparecio leyendo los datasheets de FortiGate: el 80F y el
    // 90G dicen «Powered by up to 2 External DC Power Adapters (1 adapter included)», o sea
    // que salen de fabrica con una sola fuente pero admiten la segunda. Ninguna de las dos
    // etiquetas anteriores era cierta ahi: «Sí — de serie» promete algo que no viene en la
    // caja, y «No — fuente única» niega una redundancia que el equipo si soporta. Es el mismo
    // motivo por el que existe el tercer estado, aplicado a un caso nuevo.
    // Y 'no-aplica' para lo que no es un equipo: las licencias CHR de MikroTik son software
    // sobre un hipervisor, asi que no tienen fuente ninguna. Dejarlas en «el catalogo no lo
    // especifica» diria que falta un dato que no existe, y es tan enganoso como leer
    // `undefined` como «No»: quien mira la ficha se queda esperando una respuesta.
    const filas = [
      ['Fuente redundante (doble fuente)', redund == null
        ? '<span class="warn">el catálogo no lo especifica</span>'
        : (redund === 'no-aplica'
          ? 'No aplica — es software, la alimentación es la del servidor anfitrión'
          : (redund === 'opcional'
            ? 'Opcional — admite una segunda fuente, no viene de serie'
            : (redund ? 'Sí — de serie' : 'No — fuente única')))],
    ];
    if (psu.watts != null) filas.push(['Consumo típico', `${psu.watts} W`]);
    if (psu.tipo) filas.push(['Tipo de fuente', esc(psu.tipo)]);
    if (psu.volts) filas.push(['Rango de entrada', esc(psu.volts)]);
    if (psu.amps) filas.push(['Corriente', esc(psu.amps)]);
    const nota = psu.texto
      ? esc(psu.texto)
      : (redund == null ? 'Confirmar en el datasheet del fabricante antes de comprometerlo en la propuesta.' : undefined);
    return { titulo: 'Alimentación eléctrica', filas, nota };
  }

  const API = {
    // La regla se expone para que las cinco paginas ordenen y elijan con el mismo criterio
    // en vez de reimplementarlo cada una a su manera, que es como se llego a tres.
    rango,
    recomendable,
    marca,
    seccionAlimentacion,
    // Ordena dejando primero lo vigente y al final lo que esta fuera de venta, conservando
    // el criterio propio de cada pagina (capacidad, precio, medio) como desempate.
    ordenar(lista, desempate) {
      return [...lista].sort((a, b) => rango(a) - rango(b) || (desempate ? desempate(a, b) : 0));
    },
    // El recomendado es el primero que se pueda proponer; `preferir` es el criterio de la
    // pagina (segmento, medio...). Nunca devuelve un equipo fuera de venta.
    recomendar(lista, preferir) {
      const vivos = lista.filter(recomendable);
      return (preferir && vivos.find(preferir)) || vivos[0] || null;
    },
    render(cfg) {
      const cid = cfg.contenedor;
      const previo = estado[cid];
      // ── ELEGIDO A MANO NO ES LO MISMO QUE HEREDADO ────────────────────────
      //
      // Aqui vivia un trinquete. La regla era "conservar la seleccion mientras ese equipo
      // siga cumpliendo", y como cumplir es capacidad >= requerimiento, un equipo grande
      // cumple para TODO requerimiento menor. Resultado medido en el navegador: eliges un
      // 7121F a 20 Gbps, bajas a 50 Mbps y sigue proponiendo el 7121F mientras el
      // recomendado es un 30G. La seleccion solo podia subir, nunca bajar.
      //
      // Y lo peor no era la eleccion manual: era que NO SE DISTINGUIA de la heredada. La
      // seleccion que el propio modulo habia dejado en el render anterior se reciclaba con
      // el mismo criterio, asi que el recomendado solo aparecia en el primerisimo render de
      // la pagina. En un barrido limpio de caudal el equipo ya salia desalineado en la
      // primera lectura. Es exactamente el sintoma de "siempre muestra el mismo equipo".
      //
      // La distincion es la correccion: solo persiste lo que alguien eligio de verdad —el
      // desplegable, o una reposicion desde la URL o el almacenamiento, que tambien es una
      // eleccion de alguien—. Lo heredado sigue siempre al recomendado. La funcion que
      // justificaba conservar la eleccion (comparar el que cumple justo con el siguiente
      // escalon) se mantiene intacta, y ahora tiene salida: `ficha-volver`.
      let sel;
      let deliberada;
      if (cfg.seleccionado) {
        sel = cfg.seleccionado;
        deliberada = true;
      } else if (previo && previo.deliberada) {
        sel = previo.seleccionado;
        deliberada = true;
      } else {
        sel = cfg.recomendado;
        deliberada = false;
      }
      // Si deja de cumplir al mover un parametro se vuelve al recomendado, en vez de dejar
      // en pantalla la ficha de un equipo que ya no sirve.
      if (!cfg.candidatos.some((m) => m.id === sel)) {
        sel = cfg.recomendado;
        deliberada = false;
      }
      estado[cid] = Object.assign({}, cfg, { seleccionado: sel, deliberada });
      pintar(cid);
      return sel;
    },
    // Cual esta elegido ahora — lo usa la pagina para sincronizar la pestana de BOM.
    elegido(cid) {
      return estado[cid] ? estado[cid].seleccionado : null;
    },
  };

  global.FICHA = API;
}(window));
