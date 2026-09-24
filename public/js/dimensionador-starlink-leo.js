'use strict';
// Dimensionador de enlace satelital Starlink (órbita baja, LEO).
//
// QUÉ PREGUNTA RESPONDE. No «qué equipo aguanta N Gbps», como los demás dimensionadores:
// Starlink no publica un caudal garantizado por terminal. La pregunta es qué KIT sirve para
// las condiciones del sitio (fijo, portátil, en movimiento, marítimo; AC o DC; presupuesto
// de potencia) y CUÁNTOS terminales hacen falta por sitio para el caudal pedido, contando
// con una cifra de planificación por terminal que es un SUPUESTO de la herramienta, editable
// y declarado en pantalla. Por eso esta página no usa ficha.js (asume una capacidad
// publicada contra la que comparar) y sí usa bom.js y estado.js.
//
// UN DATO QUE FALTA APARTA, NUNCA APRUEBA. El catálogo (legacyData/starlink.js) sale de las
// fichas oficiales en PDF y trae `null` donde la ficha no dice nada. Si el escenario pide un
// eje y el kit no lo declara —en movimiento, marítimo, DC, consumo, cable—, el kit se aparta
// con su motivo en vez de darse por bueno: recomendar un kit para un barco porque ninguna
// ficha dice que no sirve es el dato inventado que este catálogo prohíbe.

(function () {
  const $ = (id) => document.getElementById(id);
  const esc = (s) => (window.BOM ? BOM.esc(s) : String(s == null ? '' : s));

  let CATALOGO = { models: [], fuente: null };

  const MOVILIDAD = {
    fijo: 'sitio fijo',
    portatil: 'portátil',
    movimiento: 'en movimiento (terrestre)',
    maritimo: 'marítimo',
  };

  // ── Motor puro ──────────────────────────────────────────────────────────────
  // Devuelve si un kit es elegible para el escenario y, si no, POR QUÉ. Los motivos
  // distinguen «no lo soporta» (false) de «el catálogo no lo dice» (null): son dos
  // conclusiones distintas, y la segunda manda a mirar la ficha, no a descartar el kit.
  function elegibilidad(kit, e) {
    const motivos = [];
    if (e.movilidad === 'movimiento' || e.movilidad === 'maritimo') {
      if (kit.enMovimiento === false) motivos.push('no está soportado en movimiento');
      else if (kit.enMovimiento == null) motivos.push('el catálogo no consta que se soporte en movimiento');
    }
    if (e.movilidad === 'maritimo') {
      if (kit.maritimo === false) motivos.push('no está soportado en uso marítimo');
      else if (kit.maritimo == null) motivos.push('el catálogo no consta que se soporte en uso marítimo');
    }
    if (e.energia === 'dc') {
      if (kit.dc === false) motivos.push('no se alimenta en DC sin adaptadores de terceros');
      else if (kit.dc == null) motivos.push('el catálogo no consta que acepte alimentación DC');
    }
    if (e.presupuestoW > 0) {
      if (!kit.watts) motivos.push('el catálogo no trae su consumo y hay un presupuesto de potencia');
      else if (kit.watts.max > e.presupuestoW) motivos.push(`consume hasta ${kit.watts.max} W y el presupuesto es de ${e.presupuestoW} W`);
    }
    // El tendido es un eje más. Un cable más largo que el de la caja solo salva el kit si la
    // ficha documenta uno (`cableMaxM`); hoy ninguna lo hace, así que el tendido largo lleva
    // al kit que trae el cable largo (Enterprise, 50 m) en vez de a un accesorio supuesto.
    if (e.cableM > 0) {
      if (kit.cableIncluidoM == null) motivos.push('el catálogo no trae la longitud de su cable');
      else if (e.cableM > kit.cableIncluidoM && !(kit.cableMaxM != null && e.cableM <= kit.cableMaxM)) {
        motivos.push(`el tendido de ${e.cableM} m supera los ${kit.cableIncluidoM} m de cable que trae y la ficha no documenta uno más largo`);
      }
    }
    return { ok: motivos.length === 0, motivos };
  }

  // Vigente antes que línea anterior; en portátil, el de menor consumo; si no, el orden
  // declarado del catálogo (el kit de sitio fijo primero).
  function ordenar(kits, e) {
    return kits.slice().sort((a, b) => {
      if (!!a.legacy !== !!b.legacy) return a.legacy ? 1 : -1;
      if (e.movilidad === 'portatil') {
        const wa = a.watts ? a.watts.max : Infinity;
        const wb = b.watts ? b.watts.max : Infinity;
        if (wa !== wb) return wa - wb;
      }
      return (a.orden || 99) - (b.orden || 99);
    });
  }

  // Terminales por sitio: el máximo entre lo que pide la bajada y lo que pide la subida
  // contra la cifra de planificación por terminal, más uno si se pide N+1. Varios
  // terminales en un mismo sitio no se suman solos: hace falta un equipo que los agregue.
  function terminalesPorSitio(e) {
    const porBajada = e.planDown > 0 ? Math.ceil(e.downMbps / e.planDown) : 1;
    const porSubida = e.planUp > 0 ? Math.ceil(e.upMbps / e.planUp) : 1;
    const base = Math.max(1, porBajada, porSubida);
    return { base, total: base + (e.redundancia ? 1 : 0), manda: porSubida > porBajada ? 'subida' : 'bajada' };
  }

  function calcular(kits, e) {
    const evaluados = ordenar(kits, e).map((k) => ({ kit: k, ...elegibilidad(k, e) }));
    const elegibles = evaluados.filter((x) => x.ok);
    const recomendado = elegibles.length ? elegibles[0].kit : null;
    const elegido = e.kitSel ? (kits.find((k) => k.id === e.kitSel) || null) : recomendado;
    const evElegido = elegido ? evaluados.find((x) => x.kit.id === elegido.id) : null;
    const term = terminalesPorSitio(e);
    const sitios = Math.max(1, Math.round(e.sitios) || 1);
    return {
      evaluados, recomendado, elegido,
      manual: !!e.kitSel && !!elegido,
      elegidoCumple: !!(evElegido && evElegido.ok),
      terminalesSitio: term.total, terminalesBase: term.base, manda: term.manda,
      sitios, terminalesTotal: term.total * sitios,
      gbPorTerminal: term.total ? Math.ceil(e.gbMes / term.total) : 0,
    };
  }

  // Filas del BOM. Precios y SKU en null a propósito: Starlink tarifica por país y este
  // repositorio no tiene lista firmada (ver legacyData/starlink.js).
  function filasBom(r, e) {
    const k = r.elegido;
    if (!k) return [];
    const filas = [{
      cat: 'Equipo', desc: `${k.nombre} (kit)`, sku: k.sku, qty: r.terminalesTotal, unit: k.elpN,
      nota: `${r.terminalesSitio} por sitio × ${r.sitios} sitio(s)`,
    }];
    filas.push({
      cat: 'Servicio', desc: `Plan de servicio Starlink Business — ${MOVILIDAD[e.movilidad]}, ${e.rol === 'respaldo' ? 'respaldo' : 'enlace principal'}`,
      sku: null, qty: r.terminalesTotal, unit: null,
      nota: `mensual por terminal · ${e.gbMes ? `~${r.gbPorTerminal} GB/mes de datos prioritarios por terminal` : 'volumen de datos sin declarar'} · varía por país`,
    });
    const soporte = (e.movilidad === 'movimiento' || e.movilidad === 'maritimo')
      ? 'Montaje para vehículo / embarcación' : 'Soporte de montaje (mástil, pared o tejado)';
    if (e.movilidad !== 'portatil') {
      filas.push({ cat: 'Accesorios', desc: soporte, sku: null, qty: r.terminalesTotal, unit: null, nota: 'según superficie del sitio' });
    }
    if (k.cableIncluidoM != null && e.cableM > k.cableIncluidoM && k.cableMaxM != null && e.cableM <= k.cableMaxM) {
      filas.push({ cat: 'Accesorios', desc: `Cable Starlink ${k.cableMaxM} m`, sku: null, qty: r.terminalesTotal, unit: null,
        nota: `el kit trae ${k.cableIncluidoM} m y el tendido es de ${e.cableM} m` });
    }
    if (r.terminalesSitio > 1) {
      filas.push({ cat: 'Integración', desc: `Router multi-WAN / SD-WAN para agregar ${r.terminalesSitio} terminales`, sku: null,
        qty: r.sitios, unit: null, nota: 'se dimensiona en el dimensionador del fabricante elegido' });
    } else if (k.routerIncluido === false) {
      filas.push({ cat: 'Integración', desc: 'Router para el sitio (el kit no trae router Wi-Fi)', sku: null,
        qty: r.sitios, unit: null, nota: 'router del cliente, de Starlink o de otro fabricante' });
    }
    return filas;
  }

  function avisos(r, e) {
    const k = r.elegido;
    const out = [];
    if (!k) return out;
    if (r.manual && !r.elegidoCumple) out.push({ c: 'bad', t: `El ${k.nombre} elegido a mano no cumple este escenario: ${r.evaluados.find((x) => x.kit.id === k.id).motivos.join('; ')}.` });
    if (k.legacy) out.push({ c: 'warn', t: `El ${k.nombre} es una línea anterior: sirve para ampliar parque instalado, no para un diseño nuevo.` });
    // Sin router en la caja y un solo terminal por sitio, alguien tiene que poner uno: con
    // varios terminales ya lo cubre la línea del agregador multi-WAN.
    if (k.routerIncluido === false && r.terminalesSitio === 1) {
      out.push({ c: 'warn', t: `El ${k.nombre} no trae router Wi-Fi: se conecta por Ethernet a un router del cliente o a uno de Starlink, que se cotiza aparte.` });
    }
    if (r.terminalesSitio > 1) out.push({ c: 'warn', t: `Varios terminales por sitio no suman caudal solos: hace falta un router multi-WAN o SD-WAN que balancee entre ellos, y el caudal agregado depende de la celda.` });
    if (e.rol === 'respaldo') out.push({ c: '', t: 'En respaldo, el caudal pedido es el que debe sostenerse durante la caída del enlace principal, no el habitual.' });
    return out;
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  // Los supuestos de planificación por terminal. La página arranca en blanco (estado.js
  // vacía los campos tecleables en cada visita), así que un supuesto vacío vale su valor
  // declarado —el mismo que muestra el placeholder— en vez de 0, que daría división por cero.
  const SUPUESTO = { planDown: 100, planUp: 10 };

  function leerEntrada() {
    const num = (id) => Math.max(0, Number($(id).value) || 0);
    return {
      sitios: num('sitios') || 1,
      downMbps: num('downMbps'),
      upMbps: num('upMbps'),
      rol: $('rol').value,
      movilidad: $('movilidad').value,
      energia: $('energia').value,
      presupuestoW: num('presupuestoW'),
      redundancia: $('chkRedund').checked,
      planDown: num('planDown') || SUPUESTO.planDown,
      planUp: num('planUp') || SUPUESTO.planUp,
      gbMes: num('gbMes'),
      cableM: num('cableM'),
      kitSel: $('kitSel').value,
    };
  }

  const cifra = (v, suf) => (v == null ? '<span class="nd">no consta</span>' : `${esc(v)}${suf || ''}`);

  function render() {
    const e = leerEntrada();
    const r = calcular(CATALOGO.models, e);
    const k = r.elegido;

    if (!k) {
      $('verdict').innerHTML = '<p class="tag bad">Sin kit elegible</p>'
        + '<p class="cifra">Ningún kit del catálogo cumple este escenario.</p>'
        + '<p>Revisa los motivos de cada kit en la tabla: un «no consta» es un hueco del catálogo, no del equipo.</p>';
      $('fichaKit').innerHTML = '';
      $('bomTabla').innerHTML = BOM.avisoDesvio({ hayCandidato: false });
    } else {
      $('verdict').innerHTML = `<p class="tag">${r.manual ? 'Kit elegido a mano' : 'Kit recomendado'}</p>`
        + `<p class="cifra"><em>${esc(k.nombre)}</em> × ${r.terminalesTotal}</p>`
        + (e.downMbps || e.upMbps
          ? `<p>${r.terminalesSitio} terminal(es) por sitio (manda la ${r.manda}${e.redundancia ? ', +1 por N+1' : ''}) en ${r.sitios} sitio(s) · ${esc(MOVILIDAD[e.movilidad])}.</p>`
          : `<p>Kit elegido por las condiciones del sitio · ${esc(MOVILIDAD[e.movilidad])}. <b>Declara el caudal por sitio</b> para calcular cuántos terminales hacen falta; sin él se cuenta ${r.terminalesSitio} por sitio.</p>`);
      const siNo = (v) => (v == null ? cifra(null) : (v ? 'sí' : 'no'));
      // Una URL que no es https no se pinta como enlace: el catálogo es de este repositorio,
      // pero la ficha es el sitio donde un dato ajeno acabaría ejecutándose.
      const pdf = /^https:\/\//.test(k.fuenteUrl || '')
        ? `<a href="${esc(k.fuenteUrl)}" target="_blank" rel="noopener">ficha oficial (PDF)</a>` : cifra(null);
      $('fichaKit').innerHTML = `<h2>${esc(k.nombre)}</h2><table><tbody>
        <tr><td>Uso</td><td>${esc(k.uso)}</td></tr>
        <tr><td>Consumo medio</td><td class="n">${k.watts ? `${k.watts.min}–${k.watts.max} W` : cifra(null)}</td></tr>
        <tr><td>Alimentación DC</td><td>${siNo(k.dc)}</td></tr>
        <tr><td>En movimiento</td><td>${siNo(k.enMovimiento)}</td></tr>
        <tr><td>Marítimo</td><td>${siNo(k.maritimo)}</td></tr>
        <tr><td>Campo de visión</td><td class="n">${cifra(k.campoVision)}</td></tr>
        <tr><td>Protección</td><td class="n">${cifra(k.ip)}</td></tr>
        <tr><td>Temperatura de operación</td><td class="n">${cifra(k.temperatura)}</td></tr>
        <tr><td>Dimensiones</td><td class="n">${cifra(k.dimensiones)}</td></tr>
        <tr><td>Peso de la antena</td><td class="n">${cifra(k.pesoKg, ' kg')}</td></tr>
        <tr><td>Router</td><td>${cifra(k.router)}</td></tr>
        <tr><td>Cable incluido</td><td>${k.cableIncluidoM == null ? cifra(null) : `<span class="n">${esc(k.cableIncluidoM)} m</span> · ${esc(k.cableTipo || '')}`}</td></tr>
        <tr><td>Velocidad publicada</td><td>${k.velocidad ? esc(k.velocidad) : '<span class="nd">la ficha no publica una</span>'}</td></tr>
        <tr><td>Fuente</td><td>${pdf}</td></tr>
      </tbody></table>${k.nota ? `<p class="hint">${esc(k.nota)}</p>` : ''}`;
    }

    $('kitsTabla').innerHTML = `<table><thead><tr><th>Kit</th><th>Estado</th><th>Motivo</th></tr></thead><tbody>${
      r.evaluados.map((x) => `<tr${k && x.kit.id === k.id ? ' class="sel"' : ''}><td>${esc(x.kit.nombre)}${x.kit.legacy ? ' <span class="nd">(línea anterior)</span>' : ''}</td>`
        + `<td class="${x.ok ? 'ok' : 'bad'}">${x.ok ? 'cumple' : 'apartado'}</td>`
        + `<td>${x.ok ? (r.recomendado && x.kit.id === r.recomendado.id ? 'recomendado' : '') : esc(x.motivos.join('; '))}</td></tr>`).join('')
    }</tbody></table>`;

    const av = avisos(r, e);
    $('avisosBox').innerHTML = av.length ? `<ul>${av.map((a) => `<li class="${a.c}">${esc(a.t)}</li>`).join('')}</ul>` : '';

    $('sizingBox').innerHTML = `<table><tbody>
      <tr><td>Caudal pedido por sitio</td><td class="n r">${e.downMbps || e.upMbps ? `${e.downMbps} / ${e.upMbps} Mbps` : '<span class="nd">sin declarar</span>'}</td></tr>
      <tr><td>Planificación por terminal (supuesto)</td><td class="n r">${e.planDown} / ${e.planUp} Mbps</td></tr>
      <tr><td>Terminales por sitio</td><td class="n r">${r.terminalesSitio}</td></tr>
      <tr><td>Terminales totales</td><td class="n r">${r.terminalesTotal}</td></tr>
      <tr><td>Datos prioritarios por terminal</td><td class="n r">${e.gbMes ? `~${r.gbPorTerminal} GB/mes` : '<span class="nd">sin declarar</span>'}</td></tr>
    </tbody></table>`;

    if (k) renderBom(r, e);
  }

  function renderBom(r, e) {
    const filas = filasBom(r, e);
    $('bomTabla').innerHTML = BOM.renderTabla(filas, {
      aviso: 'Starlink tarifica kit y plan por país: todas las líneas van «Consultar» hasta confirmar con el canal autorizado.',
    });
    const titulo = `Enlace Starlink — ${r.terminalesTotal} × ${r.elegido.nombre}`;
    $('xlsBtn').onclick = () => BOM.exportarExcel(filas, { titulo: 'Dimensionador Starlink LEO', subtitulo: titulo, archivo: 'starlink-leo' });
    $('copyBtn').onclick = () => {
      const out = $('bomOut');
      out.value = BOM.comoTexto(filas, { titulo: 'ENLACE STARLINK LEO' });
      out.classList.remove('hidden');
      out.select();
      document.execCommand('copy');
    };
    window.__starlinkResultado = r;
  }

  // ── Pestañas ─────────────────────────────────────────────────────────────────
  function montarTabs() {
    const tabs = document.querySelectorAll('.tabs button');
    tabs.forEach((b) => b.addEventListener('click', () => {
      tabs.forEach((x) => x.setAttribute('aria-selected', String(x === b)));
      document.querySelectorAll('.tabpane').forEach((p) => { p.hidden = p.id !== `pane-${b.dataset.tab}`; });
    }));
  }

  // ── Arranque ─────────────────────────────────────────────────────────────────
  const CAMPOS = ['sitios', 'downMbps', 'upMbps', 'rol', 'movilidad', 'energia', 'presupuestoW',
    'chkRedund', 'planDown', 'planUp', 'gbMes', 'cableM', 'kitSel'];

  async function iniciar() {
    montarTabs();
    const res = await fetch('/api/dimensionador/starlink');
    CATALOGO = await res.json();

    $('kitSel').insertAdjacentHTML('beforeend', CATALOGO.models
      .map((k) => `<option value="${esc(k.id)}">${esc(k.nombre)}${k.legacy ? ' (línea anterior)' : ''}</option>`).join(''));

    CAMPOS.forEach((id) => {
      const el = $(id);
      el.addEventListener(el.type === 'checkbox' || el.tagName === 'SELECT' ? 'change' : 'input', render);
    });

    BOM.fijarVendor('Starlink');
    BOM.montarBotonCotizador(() => {
      const r = window.__starlinkResultado;
      return r && r.elegido ? { modelo: r.elegido.nombre, qty: r.terminalesTotal, de: 'Dimensionador Starlink LEO', todoComoRef: true } : null;
    }, { id: 'btnACotizador' });

    const st = ESTADO.vincular({ campos: CAMPOS });
    const anclaje = document.querySelector('.tabs');
    if (anclaje && anclaje.parentNode) {
      const caja = document.createElement('div');
      caja.className = 'estado-barra';
      caja.style.cssText = 'display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:0 0 14px';
      anclaje.parentNode.insertBefore(caja, anclaje.nextSibling);
      ESTADO.botonEnlace(caja);
      ESTADO.avisoOrigen(caja, st);
    }

    render();
  }

  // La pieza pura se expone para probarla en Node sin navegador.
  window.STARLINK = { calcular, elegibilidad, terminalesPorSitio, filasBom };

  const suPagina = () => !!document.getElementById('movilidad');
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { if (suPagina()) iniciar(); });
  } else if (suPagina()) {
    iniciar();
  }
})();
