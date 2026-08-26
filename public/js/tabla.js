'use strict';
// Ordenación por columna para cualquier tabla del sitio.
//
// POR QUÉ HACE FALTA. El cotizador lista 154 equipos y los catálogos del portal entre 15 y
// 58 por fabricante, todos en orden de catálogo. Comparar dos modelos por precio o por
// throughput obligaba a recorrer la tabla con el dedo. Una tabla que no se puede ordenar es
// una foto de una tabla.
//
// CÓMO SE ACTIVA: `<table data-ordenable>`. Nada más — ni configurar columnas ni declarar
// tipos. Se marca la tabla y el módulo hace el resto al cargar la página, incluidas las
// tablas que se pintan después (el portal rellena las suyas tras un fetch), porque observa
// el DOM en vez de asumir que ya está todo puesto.
//
// EL TIPO DE CADA COLUMNA SE DEDUCE DEL CONTENIDO, NO SE DECLARA. Es lo que permite que
// funcione en tablas cuyo HTML no se toca. "~ $5,999", "12 Gbps", "1.5 Tbps" y "512,000" son
// todos números para efectos de orden — y las unidades se normalizan, porque ordenar
// "900 Mbps" y "1.5 Gbps" como texto pone el 900 primero, que es exactamente el error que
// esta herramienta existe para no cometer.

(function (global) {
  'use strict';

  const MULT = { k: 1e3, m: 1e6, g: 1e9, t: 1e12 };

  // Devuelve un número comparable, o null si la celda no es numérica.
  function valorNumerico(txt) {
    const s = String(txt || '').trim().toLowerCase();
    if (!s || s === '—' || s === '-') return null;
    // Captura el primer número, con separadores de miles o decimales, y su unidad si la hay.
    // La primera alternativa cubre los miles REPETIDOS ("1,400,000"): con un solo grupo, el
    // patrón se quedaba en "1,400" y esa celda se ordenaba como 1.400 en vez de 1.400.000 —
    // tres órdenes de magnitud, y hacia abajo, así que el equipo más grande de la tabla
    // aparecía entre los más pequeños. Lo encontró una prueba, no la vista.
    const m = s.match(/(-?\d+(?:,\d{3})+(?:\.\d+)?|-?\d+(?:[.,]\d+)?)\s*(k|m|g|t)?(?:bps|b\/s|hz)?/);
    if (!m) return null;
    // Un texto que empieza por letra y solo contiene un número suelto (un modelo como
    // "RB4011iGS+") no es una cantidad: se ordena como texto.
    if (!/^[^a-z]*\d/.test(s.replace(/^[~$€\s]+/, ''))) return null;
    // La COMA es separador de miles y el PUNTO es decimal, que es como está escrito todo
    // este catálogo: "~ $5,999", "512,000" sesiones, "6.4 Tbps", "1.5 Gbps". Interpretarlo al
    // revés hacía que 5.999 dólares valieran menos que 29 y el orden por precio saliera
    // invertido — comprobado en la tabla de MikroTik antes de corregirlo.
    const n = parseFloat(m[1].replace(/,/g, ''));
    if (!Number.isFinite(n)) return null;
    return m[2] ? n * MULT[m[2]] : n;
  }

  function celdas(tabla) {
    const cuerpo = tabla.tBodies[0];
    return cuerpo ? [...cuerpo.rows] : [];
  }

  function ordenar(tabla, idx, asc) {
    const filas = celdas(tabla);
    if (filas.length < 2) return;
    const texto = (f) => (f.cells[idx] ? f.cells[idx].innerText.trim() : '');
    // Una columna es numérica si la MAYORÍA de sus celdas lo son. Con "la primera" bastaría
    // para equivocarse en cuanto una fila trae "Consultar" en el precio.
    const nums = filas.map((f) => valorNumerico(texto(f)));
    const esNum = nums.filter((n) => n != null).length > filas.length / 2;
    const orden = filas.map((f, i) => ({ f, n: nums[i], t: texto(f) }));
    orden.sort((a, b) => {
      if (esNum) {
        // Las celdas sin número van SIEMPRE al final, suba o baje el orden: "sin dato" no es
        // ni el más grande ni el más pequeño, y colocarlo como cero mentiría.
        if (a.n == null && b.n == null) return 0;
        if (a.n == null) return 1;
        if (b.n == null) return -1;
        return asc ? a.n - b.n : b.n - a.n;
      }
      return asc ? a.t.localeCompare(b.t, 'es') : b.t.localeCompare(a.t, 'es');
    });
    const cuerpo = tabla.tBodies[0];
    for (const o of orden) cuerpo.appendChild(o.f);
  }

  function activar(tabla) {
    if (tabla.dataset.ordenableListo) return;
    const cab = tabla.tHead && tabla.tHead.rows[0];
    if (!cab || !celdas(tabla).length) return;
    tabla.dataset.ordenableListo = '1';

    [...cab.cells].forEach((th, idx) => {
      th.classList.add('th-ord');
      th.tabIndex = 0;
      th.setAttribute('role', 'button');
      th.setAttribute('aria-sort', 'none');
      const alPulsar = () => {
        const asc = th.getAttribute('aria-sort') !== 'ascending';
        [...cab.cells].forEach((o) => { o.setAttribute('aria-sort', 'none'); o.classList.remove('ord-asc', 'ord-desc'); });
        th.setAttribute('aria-sort', asc ? 'ascending' : 'descending');
        th.classList.add(asc ? 'ord-asc' : 'ord-desc');
        ordenar(tabla, idx, asc);
      };
      th.addEventListener('click', alPulsar);
      // Teclado: una cabecera con role=button que no responde a Enter es una trampa de
      // accesibilidad, no una mejora.
      th.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); alPulsar(); }
      });
    });
  }

  const CSS = `
.th-ord{cursor:pointer;user-select:none;position:relative;padding-right:14px}
.th-ord:hover{color:var(--ink,#0E1A2B)}
.th-ord:focus-visible{outline:2px solid var(--red,#C7000B);outline-offset:1px}
.th-ord::after{content:'';position:absolute;right:3px;top:50%;margin-top:-2px;border:3px solid transparent;opacity:.28;border-top-color:currentColor}
.th-ord.ord-asc::after{margin-top:-5px;border-top-color:transparent;border-bottom-color:currentColor;opacity:1}
.th-ord.ord-desc::after{opacity:1}
`;

  function init() {
    if (!document.getElementById('tabla-estilos')) {
      const st = document.createElement('style');
      st.id = 'tabla-estilos';
      st.textContent = CSS;
      document.head.appendChild(st);
    }
    document.querySelectorAll('table[data-ordenable]').forEach(activar);
    // Las tablas del portal se rellenan tras un fetch, así que hay que volver a intentarlo
    // cuando aparezcan filas. Un observador es más fiable que un setTimeout a ojo.
    const obs = new MutationObserver(() => {
      document.querySelectorAll('table[data-ordenable]:not([data-ordenable-listo])').forEach(activar);
    });
    obs.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  global.TABLA = { activar, valorNumerico };
}(window));
