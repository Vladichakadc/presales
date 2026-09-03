'use strict';
// Dimensionador Nokia de agregación, borde y core IP/MPLS — 7250 IXR, 7250 IXR-X,
// 7250 IXR-R, 7750 SR / SR-s / SR-1x. Los catorce modelos Nokia que NO son fabric.
//
// POR QUÉ ES UNA SEGUNDA PÁGINA Y NO MÁS FILAS EN LA PRIMERA
// El dimensionador 7220 IXR responde «cuántos leafs y cuántos spines», y el resultado son dos
// equipos con sus cantidades. Aquí la pregunta es «cuál de estos catorce aguanta el enlace», y
// el resultado es UN equipo — así que esta página sí reutiliza `js/ficha.js`, igual que los
// otros cinco dimensionadores, con su desplegable de candidatos y su ficha completa. Meter las
// dos preguntas en una sola pantalla habría dejado las dos a medias.
//
// LA PLATAFORMA SE ELIGE ANTES QUE EL CAUDAL, la misma regla que el dimensionador Cisco. Un
// router de cell site, un agregador de datacenter y un PE de core IP/MPLS no son
// intercambiables aunque coincidan en Tbps: cambian el sistema operativo, el papel en la red y
// quién la opera. `platSeg` acota por familia y dentro de ella se aplica el más pequeño que
// cumple. Ordenar por capacidad sin acotar la familia haría saltar de un 7750 SR a un 7250 IXR
// por unos cientos de Gbps, que es cambiar de conversación, no de modelo.
//
// LAS CONFIGURACIONES DE PUERTOS SON ALTERNATIVAS, NO ACUMULABLES. «36x100GE o 12x400GE» son
// dos formas distintas de pedir el mismo equipo, nunca las dos a la vez: sumarlas prometería
// 48 interfaces donde hay 36. Por eso `cumplePuertos` comprueba si ALGUNA configuración
// satisface lo pedido, y reporta cuál.
//
// UN CHASIS MODULAR NO TIENE DENSIDAD PUBLICADA, y eso no es lo mismo que no tener puertos.
// «7 slots IOM · hasta 400GE» dice cuántas tarjetas caben, no cuántos puertos salen: depende
// de qué IOM se pida, y este catálogo no tiene el catálogo de IOM. Esos modelos se dimensionan
// por caudal y se APARTAN con su motivo cuando se pide una densidad concreta, en vez de
// descartarse en silencio (que los haría parecer insuficientes) o de colarse con una densidad
// inventada (que es peor). Es el mismo trato que `ficha.js` da a una capa sin cifra.

(function () {
  const $ = (id) => document.getElementById(id);
  const esc = (s) => (window.BOM ? BOM.esc(s) : String(s == null ? '' : s));

  let CATALOGO = { models: [], plataformas: {} };
  let plat = 'all';
  let lastPick = null;

  const fmt = (g) => (g >= 1000 ? `${(g / 1000).toFixed(g % 1000 === 0 ? 0 : 1)} Tbps` : `${g} Gbps`);

  // ── Motor puro ──────────────────────────────────────────────────────────────
  // Sin estado ni DOM: recibe todo por parametro y se expone abajo como `window.NOKIA_SR`
  // para poder probarlo, igual que BOM, FICHA y ESTADO exponen el suyo.
  function enPlataforma(m, familia) {
    return !familia || familia === 'all' || m.plat === familia;
  }

  // ¿Alguna configuración del modelo da al menos `qty` puertos a `veloc`? Devuelve la
  // configuración que cumple, o null. No suma entre configuraciones: son alternativas.
  function configQueCumple(m, qty, veloc) {
    if (!qty) return null;
    if (!m.configs) return null;
    for (const c of m.configs) {
      const total = c.puertos
        .filter((p) => p.veloc === veloc)
        .reduce((s, p) => s + p.cantidad, 0);
      if (total >= qty) return { config: c, total };
    }
    return null;
  }

  // Un modelo sin `configs` no es un modelo sin puertos: es un chasis modular o una entrada
  // que publica velocidades sin densidad. No se puede comprobar, y decirlo es la respuesta.
  function sinDensidad(m) {
    return !m.configs;
  }

  function evaluar({ models, need, portQty, portVel, familia: plataforma }) {
    const familia = models.filter((m) => enPlataforma(m, plataforma));
    const cumplenCaudal = familia.filter((m) => m.cap >= need);

    const candidatos = [];
    const apartados = [];
    for (const m of cumplenCaudal) {
      if (!portQty) { candidatos.push(m); continue; }
      if (sinDensidad(m)) {
        apartados.push({ m, motivo: m.notaPuertos });
        continue;
      }
      const ok = configQueCumple(m, portQty, portVel);
      if (ok) candidatos.push(Object.assign({}, m, { __config: ok }));
    }
    return { familia, candidatos, apartados };
  }

  function requerimiento() {
    const bw = (parseFloat($('bw').value) || 0) * (parseFloat($('unit').value) || 1);
    const head = (parseFloat($('head').value) || 0) / 100;
    return Math.round(bw * (1 + head));
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  function render() {
    const need = requerimiento();
    const portQty = Math.max(0, Math.round(parseFloat($('portQty').value) || 0));
    const portVel = parseFloat($('portVel').value) || 100;

    $('platHint').textContent = plat === 'all'
      ? 'Con «Todas» se listan las cinco familias juntas: sirve para comparar, no para decidir.'
      : ((CATALOGO.plataformas[plat] || {}).d || '');

    const { candidatos, apartados } = evaluar({ models: CATALOGO.models, need, portQty, portVel, familia: plat });
    const ordenados = FICHA.ordenar(candidatos, (a, b) => a.cap - b.cap);
    const pick = FICHA.recomendar(ordenados);
    lastPick = pick;

    renderApartados(apartados, portQty, portVel);

    if (!pick) {
      FICHA.render({
        contenedor: 'verdict',
        candidatos: [],
        recomendado: null,
        vacioTitulo: `Ningún modelo de esta selección cumple ${fmt(need)}${portQty ? ` con ${portQty} puertos de ${portVel}GE` : ''}`,
        vacioDetalle: mensajeVacio(need, portQty, portVel, apartados),
      });
      $('sizingBox').innerHTML = '<p style="font-size:13.5px;color:var(--steel)">Sin candidato.</p>';
      renderBom(null);
      return;
    }

    FICHA.render({
      contenedor: 'verdict',
      candidatos: ordenados,
      recomendado: pick.id,
      etiqueta: (m) => `${m.id} — ${m.ser} · ${fmt(m.cap)}`,
      titulo: (m) => m.id,
      subtitulo: (m) => `${m.ser} · ${m.seg}`,
      medidores: (m) => [{ etq: 'Caudal del enlace', val: need, tope: m.cap, txt: `${fmt(need)} / ${fmt(m.cap)}` }],
      porQue: (m) => porQueDe(m, need, portQty, portVel),
      secciones: (m) => seccionesDe(m),
      alCambiar: () => { renderSizing(need, portQty, portVel); renderBom(modeloElegido()); },
    });

    renderSizing(need, portQty, portVel);
    renderBom(modeloElegido());
  }

  function modeloElegido() {
    const id = FICHA.elegido('verdict');
    return CATALOGO.models.find((m) => m.id === id) || lastPick;
  }

  function mensajeVacio(need, portQty, portVel, apartados) {
    const partes = [];
    const techo = CATALOGO.models.filter((m) => enPlataforma(m, plat)).reduce((mx, m) => Math.max(mx, m.cap), 0);
    if (techo && need > techo) {
      partes.push(`<p class="warn">El modelo más grande de esta selección llega a <b>${fmt(techo)}</b>. Por encima de eso hay que repartir el tráfico en varios equipos, que es una decisión de diseño y no la toma esta calculadora.</p>`);
    } else if (portQty) {
      partes.push(`<p class="warn">Hay modelos con caudal suficiente, pero ninguna de sus configuraciones de puertos publicadas llega a <b>${portQty} × ${portVel}GE</b>. Recuerda que las configuraciones son alternativas: un equipo de «36x100GE o 12x400GE» no da las dos cosas a la vez.</p>`);
    }
    if (apartados.length) {
      partes.push(`<p>Además, ${apartados.length} chasis modular(es) sí cumplen el caudal pero no publican densidad de puertos — se listan abajo.</p>`);
    }
    return partes.join('') || '<p class="warn">Sin candidatos con estos parámetros.</p>';
  }

  function porQueDe(m, need, portQty, portVel) {
    const li = [];
    li.push(`<li>Requerimiento <b>${fmt(need)}</b> contra una capacidad de conmutación de <b>${fmt(m.cap)}</b> — holgura ${Math.round((1 - need / m.cap) * 100)} %</li>`);
    li.push(`<li>Familia <b>${esc((CATALOGO.plataformas[m.plat] || {}).n || m.ser)}</b>: ${esc((CATALOGO.plataformas[m.plat] || {}).d || m.seg)}</li>`);
    if (portQty) {
      const ok = configQueCumple(m, portQty, portVel);
      if (ok) {
        li.push(`<li>Puertos: la configuración <b>${esc(ok.config.n)}</b> da ${ok.total} × ${portVel}GE, y hacen falta ${portQty}.</li>`);
      }
    } else if (m.configs) {
      li.push(`<li>Configuraciones publicadas: ${m.configs.map((c) => `<b>${esc(c.n)}</b>`).join(' o ')} — son alternativas, no acumulables.</li>`);
    }
    if (m.notaPuertos) {
      li.push(`<li class="warn">${esc(m.notaPuertos)}</li>`);
    }
    li.push('<li><b>La capacidad es de conmutación</b>, no un caudal con servicios activos: Nokia no publica para esta línea el desglose por función que sí traen los firewalls de este catálogo.</li>');
    li.push('<li class="warn">Sin lista de precios Nokia: la línea del BOM va «Consultar».</li>');
    return `<ul style="margin:8px 0 0;padding-left:18px;font-size:13.5px">${li.join('')}</ul>`;
  }

  function seccionesDe(m) {
    const filas = [
      ['Familia', esc((CATALOGO.plataformas[m.plat] || {}).n || m.ser)],
      ['Segmento', esc(m.seg)],
      ['Capacidad de conmutación', fmt(m.cap)],
      ['Interfaces', esc(m.ifaces), true],
      ['Protocolos', esc(m.protos), true],
      ['Formato', m.ru ? `${m.ru}U` : '<span class="warn">el catálogo no lo especifica</span>'],
      ['Precio de lista ref.', '<span class="warn">sin lista de precios Nokia</span>'],
    ];
    const secciones = [{ titulo: 'Características', filas }];

    secciones.push({
      titulo: 'Densidad de puertos',
      filas: m.configs
        ? m.configs.map((c) => [`Configuración «${esc(c.n)}»`,
          c.puertos.map((p) => `${p.cantidad} × ${p.veloc}GE`).join(' + ')])
        : [['Densidad publicada', `<span class="warn">${esc(m.notaPuertos || 'el catálogo no la publica')}</span>`, true]]
          .concat(m.slots ? [['Slots', `${m.slots.cantidad} × ${esc(m.slots.tipo)}, interfaces de hasta ${m.slots.hasta}GE`]] : []),
    });

    // La sección de alimentación aparece igual que en las otras páginas, aunque hoy salga
    // entera sin dato: la pregunta merece hacerse, y ficha.js la declara sin rodeos en vez
    // de leer el hueco como «fuente única».
    secciones.push(FICHA.seccionAlimentacion(m));
    return secciones;
  }

  function renderApartados(apartados, portQty, portVel) {
    const caja = $('sinDensidad');
    if (!portQty) {
      caja.innerHTML = '<p style="font-size:13px;color:var(--steel)">Pide una cantidad de puertos para que aquí aparezcan los equipos cuya densidad este catálogo no puede comprobar.</p>';
      return;
    }
    if (!apartados.length) {
      caja.innerHTML = '<p style="font-size:13px;color:var(--steel)">Ninguno: todos los modelos con caudal suficiente publican su densidad de puertos.</p>';
      return;
    }
    caja.innerHTML = `<p style="font-size:13px;color:var(--steel)">Estos cumplen el caudal, pero el catálogo no publica cuántos puertos de ${portVel}GE dan, así que no se pueden comparar contra los ${portQty} pedidos. No están descartados — están sin comprobar.</p>
      <table><thead><tr><th>Modelo</th><th>Capacidad</th><th>Por qué no se comprueba</th></tr></thead><tbody>
      ${apartados.map((a) => `<tr><td class="n">${esc(a.m.id)}</td><td class="n">${fmt(a.m.cap)}</td><td>${esc(a.motivo)}</td></tr>`).join('')}
      </tbody></table>`;
  }

  function renderSizing(need, portQty, portVel) {
    const m = modeloElegido();
    if (!m) return;
    const ok = configQueCumple(m, portQty, portVel);
    $('sizingBox').innerHTML = `<table><tbody>
      <tr><td>Caudal pedido con margen</td><td class="n r"><b>${fmt(need)}</b></td></tr>
      <tr><td>Capacidad del modelo</td><td class="n r">${fmt(m.cap)}</td></tr>
      <tr><td>Holgura</td><td class="n r">${Math.round((1 - need / m.cap) * 100)} %</td></tr>
      <tr><td>Puertos pedidos</td><td class="n r">${portQty ? `${portQty} × ${portVel}GE` : 'no se filtró por puertos'}</td></tr>
      <tr><td>Configuración que cumple</td><td class="n r">${ok ? esc(ok.config.n) : (portQty ? '<span class="warn">no comprobable</span>' : '—')}</td></tr>
      <tr><td>Unidades a cotizar</td><td class="n r">${$('chkHa').checked ? '2 (par redundante)' : '1'}</td></tr>
    </tbody></table>`;
  }

  // ── BOM ──────────────────────────────────────────────────────────────────────
  function renderBom(m) {
    if (!m) { $('bomTabla').innerHTML = '<p style="font-size:13px;color:var(--steel)">Sin equipo elegido.</p>'; return; }
    const qty = $('chkHa').checked ? 2 : 1;
    const filas = [
      { cat: 'Equipo', desc: `Nokia ${m.id} — ${m.seg}`, sku: null, qty, unit: m.elpN || null, nota: m.ifaces },
    ];
    $('bomTabla').innerHTML = BOM.renderTabla(filas, {
      aviso: 'Transceptores, tarjetas IOM de los chasis modulares, licencias y soporte no están incluidos: dependen de la configuración exacta.',
    });
    $('xlsBtn').onclick = () => BOM.exportarExcel(filas, {
      titulo: `Nokia ${m.id}`, subtitulo: `${m.ser} · ${m.seg}`, archivo: 'nokia-agregacion-core',
    });
    $('copyBtn').onclick = () => {
      const out = $('bomOut');
      out.value = BOM.comoTexto(filas, { titulo: `NOKIA ${m.id}` });
      out.classList.remove('hidden');
      out.select();
      document.execCommand('copy');
    };
    $('cotizarBtn').onclick = () => {
      BOM.enviarACotizador({ modelo: `Nokia ${m.id}`, qty, de: 'Dimensionador Nokia 7250 IXR / 7750 SR' });
      location.href = '/cotizador.html';
    };
  }

  // ── Pestañas y selector de plataforma ────────────────────────────────────────
  function montarTabs() {
    const tabs = document.querySelectorAll('.tabs button');
    tabs.forEach((b) => b.addEventListener('click', () => {
      tabs.forEach((x) => x.setAttribute('aria-selected', String(x === b)));
      document.querySelectorAll('.tabpane').forEach((p) => { p.hidden = p.id !== `pane-${b.dataset.tab}`; });
    }));
  }

  function montarSeg() {
    const grupo = $('platSeg');
    grupo.addEventListener('click', (ev) => {
      const b = ev.target.closest('button');
      if (!b) return;
      plat = b.dataset.v;
      grupo.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      render();
    });
  }

  // ── Arranque ─────────────────────────────────────────────────────────────────
  async function iniciar() {
    montarTabs();
    montarSeg();
    const res = await fetch('/api/dimensionador/nokia-sr');
    CATALOGO = await res.json();

    ['bw', 'unit', 'head', 'portQty', 'portVel'].forEach((id) => $(id).addEventListener('input', render));
    $('chkHa').addEventListener('change', render);

    const st = ESTADO.vincular({
      clave: 'dimensionador-nokia-7750sr',
      campos: ['bw', 'unit', 'head', 'portQty', 'portVel', 'chkHa', 'platSeg', 'verdict-sel'],
    });
    const anclaje = document.querySelector('.tabs') || document.querySelector('.masthead');
    if (anclaje && anclaje.parentNode) {
      const caja = document.createElement('div');
      caja.className = 'estado-barra';
      caja.style.cssText = 'display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:0 0 14px';
      anclaje.parentNode.insertBefore(caja, anclaje.nextSibling);
      ESTADO.botonEnlace(caja);
      ESTADO.avisoOrigen(caja, st.origen);
    }

    render();
  }

  // Se expone el motor -no el render- para que las reglas que de verdad importan se puedan
  // probar sin navegador: que las configuraciones de puertos son alternativas y no se suman,
  // y que un chasis modular se aparta con su motivo en vez de descartarse.
  window.NOKIA_SR = { configQueCumple, sinDensidad, evaluar };

  // Solo arranca sobre su propia pagina. Sin esta guarda, cargar el fichero en cualquier otro
  // sitio -las pruebas lo hacen, para poder ejercitar el motor sin navegador- lanzaba un fetch
  // y un addEventListener sobre null que reventaban de forma asincrona, despues del test.
  const suPagina = () => !!document.getElementById('platSeg');
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { if (suPagina()) iniciar(); });
  } else if (suPagina()) {
    iniciar();
  }
})();
