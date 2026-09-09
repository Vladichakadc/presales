'use strict';
// Barra de navegación por fabricante, compartida por el portal y los ocho dimensionadores.
//
// EL PROBLEMA QUE RESUELVE. Las herramientas de un fabricante están repartidas entre el portal
// (catálogo y fuentes) y su propia página (dimensionador y BOM), y no había forma de pasar de
// un fabricante al siguiente sin volver al portal y buscarlo en la barra lateral. Comparar el
// FortiGate que acabas de dimensionar con el Catalyst equivalente eran cuatro clics y perder
// de vista dónde estabas.
//
// POR QUE UNA BARRA COMPARTIDA Y NO UNA PAGINA UNICA. Fusionar los ocho dimensionadores en
// index.html habría metido ocho motores de dimensionamiento en la misma página, con sus
// formularios compartiendo espacio de identificadores —los ocho tienen un `#bw`, un
// `#verdict`, un `#pane-bom`— y un estado global que hoy cada página tiene para ella sola. La
// continuidad que hacía falta es de NAVEGACION, no de archivo: esta barra la da sin tocar
// ningún motor, y por eso el riesgo es una barra que se pinta mal, no un dimensionador que
// calcula mal.
//
// SE PINTA SOLA. Cada página solo tiene que cargar este script; detecta dónde está por su
// propia URL. Sin configuración que se desincronice.
(function (global) {
  'use strict';

  // El orden es el del portal, para que «siguiente» signifique lo mismo en las dos pantallas.
  // `dim` es null donde ese fabricante no tiene dimensionador: se muestra el paso, apagado y
  // con su motivo, en vez de esconderlo — igual que el catálogo declara lo que no publica.
  const FABRICANTES = [
    { id: 'huawei', nombre: 'Huawei', acento: '#C7000B', dim: 'dimensionador-huawei-netengine.html' },
    { id: 'cisco', nombre: 'Cisco', acento: '#049FD9', dim: 'dimensionador-cisco-catalyst8k.html' },
    { id: 'fortinet', nombre: 'Fortinet', acento: '#EE3124', dim: 'dimensionador-fortinet-fortigate.html' },
    { id: 'juniper', nombre: 'Juniper', acento: '#84B135', dim: 'dimensionador-juniper-srx.html' },
    { id: 'mikrotik', nombre: 'MikroTik', acento: '#C8102E', dim: 'dimensionador-mikrotik-routeros.html' },
    { id: 'aruba', nombre: 'Aruba', acento: '#01A982', dim: 'dimensionador-aruba-edgeconnect.html' },
    // Nokia tiene dos: el de agregación/core es el que elige un equipo, así que es el que
    // sigue el recorrido; el fabric 7220 se enlaza aparte porque responde otra pregunta.
    { id: 'nokia', nombre: 'Nokia', acento: '#124191', dim: 'dimensionador-nokia-7750sr.html',
      extra: { url: 'dimensionador-nokia-7220ixr.html', txt: 'Fabric 7220 IXR' } },
  ];

  const CSS = `
.navfab{position:sticky;top:0;z-index:40;display:flex;align-items:stretch;gap:0;
  background:var(--card,#fff);border-bottom:1px solid var(--rule,#C6CFDA);
  font-family:'Barlow',sans-serif;box-shadow:0 1px 0 rgba(14,26,43,.04)}
.navfab-lado{display:flex;align-items:center;gap:7px;padding:0 13px;background:none;border:0;
  cursor:pointer;color:var(--steel,#5C6E85);font-family:inherit;font-size:12.5px;
  border-right:1px solid var(--rule,#C6CFDA);transition:background .13s,color .13s;white-space:nowrap}
.navfab-lado:last-child{border-right:0;border-left:1px solid var(--rule,#C6CFDA)}
.navfab-lado:hover{background:var(--paper,#EDF0F4);color:var(--ink,#0E1A2B)}
.navfab-lado b{font-weight:600}
.navfab-flecha{font-family:'IBM Plex Mono',monospace;font-size:14px;opacity:.65}
.navfab-centro{flex:1;display:flex;align-items:center;gap:12px;padding:7px 15px;min-width:0}
.navfab-quien{display:flex;align-items:center;gap:9px;flex-shrink:0}
.navfab-punto{width:9px;height:9px;border-radius:2px;transform:rotate(45deg);flex-shrink:0}
.navfab-nombre{font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:.15em;
  text-transform:uppercase;font-weight:600;color:var(--ink,#0E1A2B)}
.navfab-pasos{display:flex;gap:4px;flex-wrap:wrap;min-width:0}
.navfab-paso{padding:4px 11px;border:1px solid var(--rule,#C6CFDA);border-radius:12px;
  background:none;cursor:pointer;color:var(--steel,#5C6E85);font-family:inherit;font-size:12px;
  transition:all .13s;white-space:nowrap}
.navfab-paso:hover{border-color:var(--ink,#0E1A2B);color:var(--ink,#0E1A2B)}
.navfab-paso.aqui{background:var(--ink,#0E1A2B);border-color:var(--ink,#0E1A2B);color:#fff;font-weight:600}
.navfab-paso[disabled]{opacity:.42;cursor:not-allowed}
.navfab-paso[disabled]:hover{border-color:var(--rule,#C6CFDA);color:var(--steel,#5C6E85)}
.navfab-conteo{font-family:'IBM Plex Mono',monospace;font-size:10.5px;color:var(--steel,#5C6E85);
  flex-shrink:0;margin-left:auto;padding-left:10px}
@media(max-width:720px){
  .navfab-lado span:not(.navfab-flecha){display:none}
  .navfab-centro{flex-wrap:wrap;gap:8px}
  .navfab-conteo{display:none}
}
`;

  // Dónde estamos: qué fabricante y qué paso. Se deduce de la URL, no de una marca que cada
  // página tendría que poner y que se desincronizaría al renombrar un archivo.
  function situacion() {
    const ruta = (global.location.pathname || '').replace(/^\//, '');
    const enPortal = !ruta || /^index\.html$/.test(ruta);
    if (enPortal) {
      const activa = document.querySelector('.page.active');
      const id = activa ? String(activa.id || '').replace(/^page-/, '') : '';
      const fab = FABRICANTES.find((f) => f.id === id);
      return { fab, paso: fab ? 'cat' : null, enPortal: true };
    }
    const fab = FABRICANTES.find((f) => f.dim === ruta
      || (f.extra && f.extra.url === ruta));
    if (fab) return { fab, paso: 'dim', enPortal: false };
    return { fab: null, paso: /^cotizador/.test(ruta) ? 'cot' : null, enPortal: false };
  }

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  function pintar() {
    const { fab, paso } = situacion();
    const host = document.getElementById('navfab');
    if (!host) return;
    // Sin fabricante (el panel, el comparador, la calculadora) la barra se VACIA. Dejarla como
    // estaba haría que el comparador siguiera anunciando el fabricante del que vienes.
    if (!fab) { host.innerHTML = ''; return; }

    const i = FABRICANTES.indexOf(fab);
    const ant = FABRICANTES[(i - 1 + FABRICANTES.length) % FABRICANTES.length];
    const sig = FABRICANTES[(i + 1) % FABRICANTES.length];

    const pasos = [
      { k: 'cat', txt: 'Catálogo', ok: true },
      { k: 'src', txt: 'Fuentes', ok: true },
      { k: 'dim', txt: 'Dimensionador y BOM', ok: !!fab.dim,
        no: 'Este fabricante todavía no tiene dimensionador' },
    ];
    if (fab.extra) pasos.push({ k: 'extra', txt: fab.extra.txt, ok: true });
    pasos.push({ k: 'cot', txt: 'Cotizador', ok: true });

    host.innerHTML = `<nav class="navfab" aria-label="Navegación por fabricante">
      <button type="button" class="navfab-lado" data-navfab-ir="${esc(ant.id)}" title="Fabricante anterior (Alt + ←)">
        <span class="navfab-flecha">&#8592;</span><span><b>${esc(ant.nombre)}</b></span>
      </button>
      <div class="navfab-centro">
        <span class="navfab-quien">
          <i class="navfab-punto" style="background:${esc(fab.acento)}"></i>
          <span class="navfab-nombre">${esc(fab.nombre)}</span>
        </span>
        <span class="navfab-pasos">${pasos.map((p) => `<button type="button"
          class="navfab-paso${p.k === paso ? ' aqui' : ''}" data-navfab-paso="${esc(p.k)}"
          ${p.ok ? '' : `disabled title="${esc(p.no || '')}"`}>${esc(p.txt)}</button>`).join('')}</span>
        <span class="navfab-conteo">${i + 1} / ${FABRICANTES.length}</span>
      </div>
      <button type="button" class="navfab-lado" data-navfab-ir="${esc(sig.id)}" title="Fabricante siguiente (Alt + →)">
        <span><b>${esc(sig.nombre)}</b></span><span class="navfab-flecha">&#8594;</span>
      </button>
    </nav>`;
  }

  // Ir a un fabricante conservando el paso en el que estás: si vienes del dimensionador de
  // Fortinet, «siguiente» te deja en el dimensionador de Juniper y no en su portada. Eso es lo
  // que convierte la barra en un recorrido y no en un menú.
  function irA(idFab, pasoDeseado) {
    const destino = FABRICANTES.find((f) => f.id === idFab);
    if (!destino) return;
    const { paso, enPortal } = situacion();
    const p = pasoDeseado || paso || 'cat';

    if (p === 'cot') { global.location.href = '/cotizador.html'; return; }
    if (p === 'extra' && destino.extra) { global.location.href = '/' + destino.extra.url; return; }
    if (p === 'dim') {
      // Sin dimensionador se cae al catálogo del portal en vez de a un 404.
      if (destino.dim) { global.location.href = '/' + destino.dim; return; }
      global.location.href = '/index.html#' + destino.id;
      return;
    }
    // Catálogo o fuentes: viven en el portal.
    if (enPortal && typeof global.go === 'function') {
      global.go(destino.id);
      if (typeof global.switchTab === 'function') global.switchTab(destino.id, p === 'src' ? 'src' : 'cat');
      pintar();
      return;
    }
    global.location.href = `/index.html?fab=${encodeURIComponent(destino.id)}&paso=${encodeURIComponent(p)}`;
  }

  function montar() {
    if (!document.getElementById('navfab')) {
      const host = document.createElement('div');
      host.id = 'navfab';
      // Se inserta al principio del contenido, no del body: en el portal el body lleva la
      // barra lateral y la cabecera fija, y colgarla ahí la sacaría de la columna de trabajo.
      const main = document.querySelector('main') || document.body;
      main.insertBefore(host, main.firstChild);
    }
    const estilo = document.createElement('style');
    estilo.textContent = CSS;
    document.head.appendChild(estilo);
    pintar();

    document.addEventListener('click', (e) => {
      const f = e.target.closest && e.target.closest('[data-navfab-ir]');
      if (f) { irA(f.dataset.navfabIr); return; }
      const p = e.target.closest && e.target.closest('[data-navfab-paso]');
      if (p && !p.disabled) {
        const { fab } = situacion();
        if (fab) irA(fab.id, p.dataset.navfabPaso);
      }
    });

    // Alt + flechas. Con Alt a propósito: las flechas solas las usan los campos numéricos y
    // los desplegables de todas estas pantallas.
    document.addEventListener('keydown', (e) => {
      if (!e.altKey || e.ctrlKey || e.metaKey) return;
      const { fab } = situacion();
      if (!fab) return;
      const i = FABRICANTES.indexOf(fab);
      if (e.key === 'ArrowLeft') { e.preventDefault(); irA(FABRICANTES[(i - 1 + FABRICANTES.length) % FABRICANTES.length].id); }
      if (e.key === 'ArrowRight') { e.preventDefault(); irA(FABRICANTES[(i + 1) % FABRICANTES.length].id); }
    });

    // EL PORTAL CAMBIA DE SECCION SIN RECARGAR, asi que la barra tiene que enterarse. Se
    // observa la clase de las secciones en vez de envolver `go()`: parchear una funcion de
    // otra pagina se rompe en cuanto alguien la renombra, y esto no depende de su nombre.
    const paginas = document.querySelectorAll('.page');
    if (paginas.length && global.MutationObserver) {
      const obs = new global.MutationObserver(() => pintar());
      paginas.forEach((el) => obs.observe(el, { attributes: true, attributeFilter: ['class'] }));
    }

    // Al llegar al portal con ?fab=&paso= desde otra página, se abre justo ahí.
    if (situacion().enPortal) {
      const q = new URLSearchParams(global.location.search);
      const fabQ = q.get('fab');
      if (fabQ && FABRICANTES.some((f) => f.id === fabQ)) {
        setTimeout(() => irA(fabQ, q.get('paso') || 'cat'), 0);
      }
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', montar);
  else montar();

  global.NAVFAB = { FABRICANTES, situacion, irA, pintar };
}(window));
