// Tabla de BOM y exportación a Excel, compartidas por los cuatro dimensionadores.
//
// Cada página construye un array de filas con esta forma y el resto lo resuelve este
// módulo, para que la tabla y el Excel se vean igual en Huawei, Cisco, Fortinet y MikroTik:
//
//   { cat, desc, sku, qty, unit, nota }
//
//   cat   Agrupador visible: 'Equipo', 'Óptica', 'Licencia', 'Soporte'...
//   desc  Qué es la línea, en lenguaje de cotización.
//   sku   Código de pedido. null cuando el fabricante no lo publica.
//   qty   Cantidad. Puede ser null en líneas informativas (avisos, notas de licencia).
//   unit  Precio unitario numérico, o null si hay que consultarlo. El subtotal se calcula.
//   nota  Detalle secundario: puertos, término, SLA, advertencias.
//
// Una fila sin `unit` no rompe el total: se suma lo que tiene precio y se avisa de cuántas
// líneas quedaron sin cotizar, en vez de mostrar un total que aparenta estar completo.

(function (global) {
  'use strict';

  // El estilo viaja con el módulo para que cada página solo incluya un archivo. Usa las
  // variables de color que las cuatro páginas ya declaran en :root, así que cada
  // dimensionador conserva su acento de fabricante sin configurar nada.
  const CSS = `
.bom-tabla{width:100%;border-collapse:collapse;font-size:12.5px}
.bom-tabla th{text-align:left;font-family:'IBM Plex Mono',monospace;font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--steel);font-weight:500;padding:0 8px 7px 0;border-bottom:1px solid var(--rule);white-space:nowrap}
.bom-tabla td{padding:8px 8px 8px 0;border-bottom:1px solid var(--paper);vertical-align:top}
.bom-tabla th.r,.bom-tabla td.r{text-align:right}
.bom-tabla td.n,.bom-tabla code{font-family:'IBM Plex Mono',monospace;font-size:11.5px}
.bom-tabla code{background:var(--paper);padding:1px 5px;border-radius:2px;white-space:nowrap}
.bom-tabla tr.bom-grupo td{font-family:'IBM Plex Mono',monospace;font-size:9.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--steel);font-weight:600;padding-top:14px;border-bottom:0}
.bom-tabla tr.bom-total td{border-top:2px solid var(--ink);border-bottom:0;font-weight:600;padding-top:10px;font-size:13px}
.bom-nota{display:block;font-size:11px;color:var(--steel);margin-top:2px;font-family:'Barlow',sans-serif}
.bom-nd{color:var(--steel)}
.bom-cant{width:58px;padding:2px 4px;border:1px solid var(--rule);border-radius:3px;background:var(--card);color:var(--ink);font-family:'IBM Plex Mono',monospace;font-size:11.5px;text-align:right}
.bom-cant:focus{outline:2px solid var(--red);outline-offset:1px}
.bom-quitar{margin-left:6px;border:1px solid var(--rule);background:var(--card);color:var(--steel);border-radius:3px;cursor:pointer;font-size:12px;line-height:1;padding:1px 5px}
.bom-quitar:hover{border-color:var(--red);color:var(--red-txt,var(--red))}
.bom-aviso{font-size:11.5px;color:var(--amber);margin:10px 0 0;line-height:1.45}
.bom-ctx{font-size:12.5px;color:var(--steel);margin:0 0 10px;padding-bottom:8px;border-bottom:1px solid var(--rule)}
.bom-pend{display:inline-block;font-family:'IBM Plex Mono',monospace;font-size:9px;letter-spacing:.06em;text-transform:uppercase;padding:1px 5px;border-radius:2px;border:1px solid var(--amber);color:var(--amber);margin-left:6px;vertical-align:1px;white-space:nowrap}
.bom-cant-calc{border-style:dashed}
.bom-ajuste{display:block;font-family:'IBM Plex Mono',monospace;font-size:9px;letter-spacing:.05em;text-transform:uppercase;color:var(--amber);margin-top:2px}
.bom-acciones{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
.bom-desvio{font-size:12.5px;line-height:1.5;color:var(--steel);border-left:2px solid var(--amber);padding:6px 0 6px 10px;margin:0 0 12px}
.bom-desvio b.warn{color:var(--amber)}
`;

  if (!document.getElementById('bom-estilos')) {
    const st = document.createElement('style');
    st.id = 'bom-estilos';
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));

  // Los centavos se muestran completos o no se muestran: "$178.2" se lee como un importe
  // truncado en una cotización.
  const money = (n) => {
    if (n == null) return null;
    const v = Number(n);
    const dec = Number.isInteger(v) ? 0 : 2;
    return '$' + v.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: 2 });
  };

  function subtotal(fila) {
    if (fila.unit == null) return null;
    return fila.unit * (fila.qty == null ? 1 : fila.qty);
  }

  function totales(filas) {
    let suma = 0;
    let sinPrecio = 0;
    for (const f of filas) {
      const s = subtotal(f);
      if (s == null) sinPrecio++; else suma += s;
    }
    return { suma, sinPrecio };
  }

  // Tabla agrupada por categoría. Se mantiene el orden en que la página añadió las filas:
  // refleja el orden de lectura de una cotización (equipo, luego accesorios, luego servicios).
  /* ── REFERENCIAS ANADIDAS A MANO ───────────────────────────────────────────
     La ficha lista todas las referencias de pedido de un equipo (bundles de soporte,
     licencias, accesorios). Verlas no basta: lo que hace falta es poder meter UNA concreta en
     la cotizacion — un FortiGate se vende casi siempre con su bundle de FortiCare, y hasta
     ahora esa linea habia que teclearla a mano en el cotizador.

     POR QUE VIVEN AQUI Y NO EN CADA PAGINA. `renderTabla` es el punto unico por el que pasan
     los siete dimensionadores, asi que gestionarlas en este modulo las da a las siete sin
     tocar ninguna — la misma razon por la que `sincronizar` y `avisoDesvio` acabaron aqui.

     SOBREVIVEN AL REPINTADO, QUE ES TODO EL PUNTO. El BOM se repinta cada vez que cambia el
     dimensionamiento; si las referencias anadidas vivieran en el array de filas que la pagina
     construye, el siguiente movimiento del caudal las borraria sin avisar. Se guardan aparte y
     se vuelven a pegar en cada render.

     UNA SOLA CLAVE PARA LOS SIETE, Y NO UNA POR PAGINA (2026-09-09). La primera version
     guardaba en `presales-bom-refs:<pathname>`, asi que cada dimensionador solo veia lo suyo:
     anadias un bundle de Fortinet, ibas a Aruba, y al enviar al cotizador desde alli el de
     Fortinet se quedaba atras — una perdida silenciosa, justo en la pantalla que existe para
     armar una cotizacion MULTI-fabricante. Ahora la clave es unica y el fabricante que cada
     referencia ya llevaba dentro (`v`) es lo que las separa: el BOM de cada dimensionador
     muestra SOLO las de su fabricante —las de otro no corresponden a ese equipo— pero
     `enviarACotizador` manda TODAS, porque el cotizador si es multi-fabricante.

     LA CLAVE DE UNA REFERENCIA ES `fabricante|sku`, no el sku suelto: con una sola lista
     compartida, dos fabricantes podrian traer el mismo codigo y quitar uno habria quitado el
     otro. */
  const CLAVE_REFS = 'presales-bom-refs';
  let repintar = null;   // lo deja `sincronizar`: es como se refresca el BOM tras anadir o quitar
  let vendorPagina = ''; // lo deja `ficha.js`: de que fabricante es la pagina que se esta viendo
  // Las filas que el motor de la pagina calculo en su ultimo render PROPIO. `renderTabla` ya
  // las recibia y las tiraba; se guardan porque son lo unico que sabe que lleva la cotizacion
  // ademas del hardware. Ver `acompanantes()`.
  let filasCalculadas = [];

  const claveDe = (r) => `${(r.v || '').toLowerCase()}|${r.sku || r.d || ''}`;

  function leerCrudo(k) {
    try {
      const v = JSON.parse(localStorage.getItem(k) || '[]');
      return Array.isArray(v) ? v : [];
    } catch { return []; }
  }
  function guardarRefs(lista) {
    try { localStorage.setItem(CLAVE_REFS, JSON.stringify(lista)); } catch { /* almacenamiento off */ }
  }

  // MIGRACION DE LA CLAVE VIEJA. Quien ya tuviera referencias guardadas bajo
  // `presales-bom-refs:<pathname>` las veria desaparecer al desplegar esto — una perdida de
  // datos silenciosa, que es el fallo que este cambio venia justamente a evitar. Se leen una
  // vez, se funden con las nuevas y la clave vieja se borra.
  let migrado = false;
  function migrar() {
    if (migrado || !global.location) return;
    migrado = true;
    const vieja = 'presales-bom-refs:' + global.location.pathname;
    const previas = leerCrudo(vieja);
    if (!previas.length) return;
    const lista = leerCrudo(CLAVE_REFS);
    for (const r of previas) {
      const ya = lista.find((x) => claveDe(x) === claveDe(r));
      if (ya) ya.qty = (ya.qty || 1) + (r.qty || 1);
      else lista.push(r);
    }
    guardarRefs(lista);
    try { localStorage.removeItem(vieja); } catch { /* almacenamiento off */ }
  }

  // TODAS las referencias, de cualquier fabricante. Es lo que viaja al cotizador.
  function refsExtra() {
    migrar();
    return leerCrudo(CLAVE_REFS);
  }

  // Solo las del fabricante de esta pagina. Es lo que se pinta en su BOM: una referencia de
  // Aruba en el BOM de un FortiGate no corresponde a ese equipo. Mientras la pagina no declare
  // fabricante se muestran todas, que es como se comportaba antes de existir el filtro.
  function refsDeLaPagina() {
    const refs = refsExtra();
    if (!vendorPagina) return refs;
    return refs.filter((r) => !r.v || String(r.v).toLowerCase() === vendorPagina);
  }

  function fijarVendor(v) { vendorPagina = String(v || '').toLowerCase(); }

  // Anade una referencia. Si ya estaba, SUMA cantidad en vez de duplicar la linea: pedir dos
  // veces el mismo bundle es pedir dos unidades, no dos renglones iguales.
  function agregarRef(ref) {
    if (!ref || (!ref.sku && !ref.d)) return false;
    const lista = refsExtra();
    const nueva = { sku: ref.sku || null, d: ref.d || '', p: (ref.p == null ? null : ref.p), qty: 1, de: ref.de || '', v: ref.v || '' };
    const ya = lista.find((x) => claveDe(x) === claveDe(nueva));
    if (ya) ya.qty = (ya.qty || 1) + 1;
    else lista.push(nueva);
    guardarRefs(lista);
    if (repintar) repintar();
    return true;
  }

  // Fija la cantidad de una referencia. Menos de 1 no es una cantidad: se trata como quitarla,
  // que es lo que alguien quiere decir al escribir 0.
  function cantidadRef(clave, n) {
    const q = Math.floor(Number(n));
    if (!Number.isFinite(q) || q < 1) { quitarRef(clave); return; }
    const lista = refsExtra();
    const ya = lista.find((x) => claveDe(x) === clave);
    if (!ya) return;
    ya.qty = q;
    guardarRefs(lista);
    if (repintar) repintar();
  }

  function quitarRef(clave) {
    guardarRefs(refsExtra().filter((x) => claveDe(x) !== clave));
    if (repintar) repintar();
  }

  // Las referencias de ESTA pagina como filas de BOM, en su propio grupo.
  /* ══ PERFILES MULTI-SEDE ═══════════════════════════════════════════════════════
     Un perfil guarda un escenario completo (los campos del formulario mas una foto de las
     filas del BOM) y CUANTAS SEDES identicas se cotizan con el. Es la funcion que existe para
     armar la cotizacion de un despliegue de 50 sucursales.

     POR QUE UNA SOLA CLAVE Y NO UNA POR FABRICANTE. Nacieron en `arubaPerfilesV1`, y un
     despliegue real de 50 sedes MEZCLA fabricantes: spokes Fortinet contra un core Nokia,
     EdgeConnect en sucursal con Catalyst en el datacenter. Con una clave por pagina, el
     consolidado de cada fabricante ignoraria al resto en silencio — exactamente el fallo que
     `presales-bom-refs:<pathname>` ya tuvo aqui arriba y que se corrigio el 2026-09-09. Se
     arregla ANTES de portar la funcion a los otros siete, porque despues cuesta siete veces.

     CARGAR ES DEL FABRICANTE; CONSOLIDAR NO. `campos` son los ids del formulario de ESA
     pagina, asi que aplicar un perfil de Fortinet al de Aruba no significa nada: la lista de
     cada dimensionador muestra solo los suyos. Pero `filas` es la forma neutra que los siete
     comparten, asi que el BOM global suma todos. */
  const CLAVE_PERFILES = 'presales-perfiles';
  const CLAVE_PERFILES_VIEJA = 'arubaPerfilesV1';

  function guardarLista(lista) {
    try { localStorage.setItem(CLAVE_PERFILES, JSON.stringify(lista)); } catch { /* almacenamiento off */ }
  }

  // Id propio y no la posicion en el array: en una lista compartida entre fabricantes el
  // indice deja de ser estable, y borrar por indice borraria el perfil del vecino.
  let seq = 0;
  function nuevoId() { seq += 1; return `p${Date.now().toString(36)}${seq}`; }

  // Misma migracion que la de las referencias, y por el mismo motivo: quien ya tuviera
  // perfiles guardados los veria desaparecer al desplegar esto. Se leen una vez, se les
  // estampa el fabricante y un id, y la clave vieja se borra.
  let perfilesMigrados = false;
  function migrarPerfiles() {
    if (perfilesMigrados) return;
    perfilesMigrados = true;
    const previos = leerCrudo(CLAVE_PERFILES_VIEJA);
    if (!previos.length) return;
    const lista = leerCrudo(CLAVE_PERFILES);
    for (const p of previos) lista.push({ ...p, vendor: p.vendor || 'aruba', id: p.id || nuevoId() });
    guardarLista(lista);
    try { localStorage.removeItem(CLAVE_PERFILES_VIEJA); } catch { /* almacenamiento off */ }
  }

  function perfiles() { migrarPerfiles(); return leerCrudo(CLAVE_PERFILES); }
  function perfilesDe(vendor) {
    const v = String(vendor || '').toLowerCase();
    if (!v) return perfiles();
    return perfiles().filter((p) => String(p.vendor || '').toLowerCase() === v);
  }
  function guardarPerfil(perfil) {
    if (!perfil || !perfil.nombre || !perfil.sedes) return null;
    const lista = perfiles();
    const nuevo = { ...perfil, id: perfil.id || nuevoId(), vendor: String(perfil.vendor || vendorPagina || '').toLowerCase() };
    lista.push(nuevo);
    guardarLista(lista);
    return nuevo;
  }
  function quitarPerfil(id) {
    guardarLista(perfiles().filter((p) => p.id !== id));
  }

  /* CONSOLIDADO Σ(BOM del perfil × sedes), sobre TODOS los perfiles guardados.

     LAS EXCEPCIONES DE AGREGACION LAS DECLARA LA PAGINA, no este modulo. Aruba agrega el pool
     de Boost en una sola linea (`agregadas`) y deja el Orchestrator en cantidad 1 por fabric
     (`unicas`), pero eso es su modelo COMERCIAL, no una regla universal: escribirlo aqui a
     fuego haria que cualquier fabricante que algun dia use esos nombres de categoria heredara
     la semantica de precios de Aruba sin que nadie lo decidiera — el mismo error que el
     `noAplica` deducido del comparador, que llego a decir «IPS: no aplica» de un Catalyst 8300.
     Quien no declare nada multiplica todo por sedes, que es el comportamiento correcto.

     Y SE AGRUPA POR FABRICANTE ADEMAS DE POR SKU: con una sola lista compartida, dos marcas
     podrian traer el mismo codigo y agrupar solo por cat+desc+sku las fundiria en un renglon.
     Es la misma razon por la que la clave de una referencia es `fabricante|sku`. */
  function consolidar(lista, opciones) {
    const o = opciones || {};
    const agregadas = (o.agregadas || []).map((c) => String(c));
    const unicas = (o.unicas || []).map((c) => String(c));
    const acum = new Map();
    const pools = new Map();
    let totalSedes = 0;
    const fabricantes = new Set();
    for (const p of (lista || [])) {
      const sedes = Math.max(0, parseInt(p.sedes, 10) || 0);
      totalSedes += sedes;
      const v = String(p.vendor || '').toLowerCase();
      if (v) fabricantes.add(v);
      for (const f of (p.filas || [])) {
        if (agregadas.includes(f.cat)) {
          const k = `${v}|${f.cat}`;
          if (!pools.has(k)) pools.set(k, { ...f, v, qty: 0, nota: o.notaAgregada || f.nota });
          pools.get(k).qty += (f.qty || 0) * sedes;
          continue;
        }
        if (unicas.includes(f.cat)) {
          const k = `${v}|UNICA|${f.cat}|${f.sku || f.desc}`;
          if (!acum.has(k)) acum.set(k, { ...f, v, qty: 1, nota: o.notaUnica || f.nota });
          continue;
        }
        const k = [v, f.cat, f.desc, f.sku || ''].join('|');
        if (!acum.has(k)) acum.set(k, { ...f, v, qty: 0 });
        acum.get(k).qty += (f.qty || 1) * sedes;
      }
    }
    const filas = [...acum.values()];
    for (const pool of pools.values()) if (pool.qty > 0) filas.push(pool);
    return { filas, totalSedes, perfiles: (lista || []).length, fabricantes: [...fabricantes] };
  }

  /* ══ SIMULADOR DE PRECIO NETO ══════════════════════════════════════════════════
     Títulos de columna unificados al criterio del pie de TCO («Subtotal Lista/Neto»)
     el 2026-09-15 — pendiente #32: antes esta tabla decía «LIST/NET» y el pie
     «Lista/Neto»; un solo criterio en los 7 fabricantes que comparten este módulo.
     Los tramos del programa de canal NO son publicos: son niveles de trabajo del equipo de
     preventa, y la pantalla lo declara. El calculo es puro —lee un select y un numero— asi
     que no depende de ningun fabricante, y `renderTabla`/`exportarExcel` ya saben pintar las
     columnas NET en paralelo con `o.dto`.

     EL CONTROL SE CONSTRUYE AQUI, NO SE COPIA EN CADA HTML. Es la misma decision que
     `ESTADO.botonEnlace`: anadirlo a una pantalla nueva tiene que ser una linea, no doce de
     marcado repetido en siete archivos que luego divergen. Los ids se conservan
     (`selDescuento`, `dtoCustom`) porque `estado.js` ya los serializa en el enlace
     compartido. */
  const TRAMOS_DTO = [
    { v: '0', etq: 'Lista (0 %) — precio de referencia del fabricante' },
    { v: '0.35', etq: 'Business Partner (35 %)' },
    { v: '0.45', etq: 'Silver (45 %)' },
    { v: '0.50', etq: 'Gold (50 %)' },
    { v: '0.55', etq: 'Platinum (55 %)' },
    { v: 'opg', etq: 'Personalizado…' },
  ];
  const AVISO_DTO = '<b>Simulador genérico de tramos partner — no refleja el descuento real '
    + 'del distribuidor.</b> Los descuentos del programa de canal no son públicos: estos tramos '
    + 'son niveles de trabajo del equipo de preventa. Se muestran las columnas Subtotal Lista y '
    + 'Subtotal Neto en paralelo y se llevan al Excel; la cotización firme la cierra tu distribuidor.';

  function simuladorDescuento(contenedor, alCambiar) {
    const host = typeof contenedor === 'string' ? document.getElementById(contenedor) : contenedor;
    if (!host) return null;
    host.innerHTML = '<label for="selDescuento">Nivel de descuento sobre List Price</label>'
      + '<div class="row">'
      + `<select id="selDescuento" style="width:60%">${TRAMOS_DTO.map((x) => `<option value="${x.v}">${esc(x.etq)}</option>`).join('')}</select>`
      + '<input type="number" id="dtoCustom" min="0" max="90" step="0.5" placeholder="% personalizado" hidden autocomplete="off">'
      + `</div><p class="hint">${AVISO_DTO}</p>`;
    const sel = host.querySelector('#selDescuento');
    const custom = host.querySelector('#dtoCustom');
    // Un descuento fuera de [0,90] no es un descuento: por encima regalaria el equipo y por
    // debajo subiria el precio de lista, que no es lo que este control significa.
    const valor = () => {
      if (sel.value === 'opg') return Math.min(0.9, Math.max(0, (parseFloat(custom.value) || 0) / 100));
      return parseFloat(sel.value) || 0;
    };
    const etiqueta = () => {
      if (sel.value === 'opg') return `Personalizado (${(valor() * 100).toFixed(1)} %)`;
      const opt = sel.selectedOptions[0];
      return opt ? opt.textContent.trim() : 'Lista (0 %)';
    };
    sel.addEventListener('input', () => {
      custom.hidden = sel.value !== 'opg';
      if (alCambiar) alCambiar();
    });
    custom.addEventListener('input', () => { if (alCambiar) alCambiar(); });
    return { valor, etiqueta };
  }

  /* ══ CAPEX / OPEX ANUAL / TCO ══════════════════════════════════════════════════
     Se calcula sobre las FILAS del BOM, que ya son la forma neutra que los siete comparten
     —no sobre los objetos de licenciamiento de ningun fabricante, que es lo que ataba este
     calculo a una sola pagina.

     QUE ES OPEX LO DECLARA LA PAGINA, por la misma razon que las reglas de agregacion: que
     una suscripcion sea recurrente y una licencia perpetua no lo sea es el modelo COMERCIAL
     de cada fabricante, no una propiedad de la fila. Sin declarar nada, todo es CAPEX — que
     es lo correcto para un catalogo que solo vende hardware.

     Las lineas sin precio NO se reparten ni se estiman: se cuentan y se declaran, igual que
     hace `renderTabla` con su total parcial. Un TCO que aparenta estar completo es peor que
     uno que dice cuanto le falta. */
  function tco(filas, opciones) {
    const o = opciones || {};
    const cats = (o.opex || []).map((c) => String(c));
    const anios = Math.max(1, parseInt(o.anios, 10) || 1);
    let capex = 0;
    let opexTermino = 0;
    let sinPrecio = 0;
    for (const f of (filas || [])) {
      const s = subtotal(f);
      if (s == null) { sinPrecio++; continue; }
      if (cats.includes(f.cat)) opexTermino += s; else capex += s;
    }
    const opexAnual = opexTermino / anios;
    return { capex, opexTermino, opexAnual, tco: capex + opexAnual * anios, anios, sinPrecio };
  }

  function filasDeRefs() {
    return refsDeLaPagina().map((r) => ({
      cat: 'Referencias añadidas',
      desc: r.d || r.sku,
      sku: r.sku || null,
      qty: r.qty || 1,
      unit: r.p == null ? null : r.p,
      nota: r.de ? `Añadida desde la ficha de ${r.de}` : 'Añadida desde la ficha del equipo',
      _ref: claveDe(r),
    }));
  }

  // Clave estable de una línea del BOM (petición del dueño en Aruba, 2026-09-15 —
  // BOM editable): con SKU es 'sku:XXX'; sin SKU (líneas informativas/pendientes) es
  // 'desc:categoría|descripción'. La página la usa para filtrar las líneas retiradas y
  // este módulo para pintar el botón de retirar — una sola convención en los dos lados.
  function claveFila(f) {
    return f && f.sku ? 'sku:' + f.sku : 'desc:' + ((f && f.cat) || '') + '|' + ((f && f.desc) || '');
  }

  function renderTabla(filasBase, opciones) {
    const o = opciones || {};
    // Las referencias anadidas se pegan aqui, no en la pagina, y entran ANTES de los totales:
    // un bundle en la cotizacion que no sume al total seria un numero que no corresponde a lo
    // que la cotizacion lleva dentro. `o.sinRefs` (fase 11) las omite: el BOM global
    // consolidado de perfiles multi-sede no debe arrastrar las refs manuales de la pagina.
    const filas = (filasBase || []).concat(o.sinRefs ? [] : filasDeRefs());

    // SE GUARDA EL BOM PROPIO DE ESTA PANTALLA, NO CUALQUIER TABLA QUE PASE POR AQUI.
    // `o.sinRefs` marca hoy la tabla consolidada multi-sede, que no es el BOM de este equipo
    // sino la suma de varias sedes: guardarla haria que «Enviar al cotizador» mandase las
    // filas de todas las sedes como si fueran las de esta pantalla. Es la misma propiedad que
    // dice «estas filas no son las de esta pagina», por eso decide las dos cosas y no hay un
    // segundo interruptor que se desincronice. `test/bom-traspaso.test.js` lo fija.
    // Se guarda `filasBase` y NO `filas`: las referencias anadidas a mano ya viajan por su
    // propio canal (`refsExtra`), y meterlas aqui las duplicaria.
    if (!o.sinRefs) filasCalculadas = (filasBase || []).slice();

    // UN SKU QUE YA ESTA EN LA COTIZACION SE DICE, NO SE IMPIDE.
    //
    // Medido en la pagina de Fortinet el 2026-09-16: su ficha publica 71 referencias de
    // pedido para el FortiGate 200G y la PRIMERA es el propio SKU del hardware (FG-200G).
    // Anadirla duplicaba la linea de Equipo sin una sola senal y el total pasaba de
    // $38.088,20 a $49.565,20 -- el mismo cortafuegos cotizado dos veces. Es el modo de
    // fallo peor de este repositorio: no falla, miente.
    //
    // No se bloquea porque duplicar puede ser deliberado (una unidad de repuesto, un
    // segundo nodo que no se cotiza por cantidad). Se avisa, que es lo que convierte un
    // numero equivocado en una decision de quien cotiza.
    const skusCalculados = new Set((filasBase || []).map((f) => f.sku).filter(Boolean));
    const duplicados = [...new Set((o.sinRefs ? [] : filasDeRefs())
      .map((f) => f.sku).filter((k) => k && skusCalculados.has(k)))];

    const { suma, sinPrecio } = totales(filas);

    const grupos = [];
    for (const f of filas) {
      const ultimo = grupos[grupos.length - 1];
      if (ultimo && ultimo.cat === f.cat) ultimo.filas.push(f);
      else grupos.push({ cat: f.cat, filas: [f] });
    }

    // Simulador de precio neto (2026-09-13, fase 11 — opt-in): si la pagina pasa
    // `o.dto` (0..1), la tabla muestra en paralelo las columnas NET (unit y subtotal con
    // el descuento aplicado). Las paginas que no lo pasan ven exactamente lo de siempre.
    const dto = (o.dto != null && o.dto > 0 && o.dto < 1) ? o.dto : 0;
    const nCols = dto > 0 ? 7 : 5;
    let html = '<div class="scroll"><table class="bom-tabla">'
      + '<thead><tr>'
      + '<th>Descripción</th><th>SKU / Código</th><th class="r">Cant.</th>'
      + '<th class="r">Precio unit.</th><th class="r">Subtotal Lista</th>'
      + (dto > 0 ? '<th class="r">Unit. Neto</th><th class="r">Subtotal Neto</th>' : '')
      + '</tr></thead><tbody>';

    for (const g of grupos) {
      html += `<tr class="bom-grupo"><td colspan="${nCols}">${esc(g.cat)}</td></tr>`;
      for (const f of g.filas) {
        const s = subtotal(f);
        html += '<tr>'
          + `<td><b>${esc(f.desc)}</b>${f.nota ? `<span class="bom-nota">${esc(f.nota)}</span>` : ''}`
          // Ajuste manual de cantidad (mejora 2026-09-16, Aruba): la PÁGINA es quien aplica
          // el ajuste y deja la cifra del motor en `f.ajuste`; aquí solo se declara. Un
          // ajuste sin esta marca parecería un error de cálculo cuando es una decisión.
          + `${f.ajuste != null ? `<span class="bom-ajuste">Cantidad ajustada a mano — el cálculo decía ${esc(String(f.ajuste))}</span>` : ''}</td>`
          + `<td class="n">${f.sku ? `<code>${esc(f.sku)}</code>` : '<span class="bom-nd">—</span>'}</td>`
          // La cantidad se edita a mano en dos casos, y solo en dos:
          //  - lo que se ANADIO a mano (`f._ref`): su cifra no la recalcula nadie;
          //  - `o.ajustable` (opt-in, 2026-09-16 — Aruba): las líneas calculadas llevan un
          //    input cuya divergencia contra la cifra del motor (data-bom-calc) guarda la
          //    PÁGINA en su estado (#bomAjustes), de modo que sobrevive al repintado y
          //    viaja en el enlace. Sin el flag, las calculadas se pintan igual que siempre
          //    (los otros seis dimensionadores no cambian). Una línea sin cantidad
          //    calculada (qty null: p.ej. la SSE pendiente de usuarios) no lleva control:
          //    lo que falta ahí es el dato, no una cifra que pisar.
          + `<td class="n r">${f._ref
            ? `<input type="number" class="bom-cant" min="1" step="1" value="${Number(f.qty) || 1}" data-bom-cant="${esc(f._ref)}" aria-label="Cantidad">`
            : (f.qty == null ? '—'
              : (o.ajustable
                ? `<input type="number" class="bom-cant bom-cant-calc" min="1" step="1" value="${Number(f.qty)}" data-bom-ajustar="${esc(claveFila(f))}" data-bom-calc="${f.ajuste != null ? Number(f.ajuste) : Number(f.qty)}" aria-label="Cantidad (ajustable a mano)">`
                : f.qty))}</td>`
          // Líneas sin precio (2026-09-14, pendiente #29): además del «consultar» llevan
          // el badge operativo que cierra el ciclo — hay que pedirlas al distribuidor.
          + `<td class="n r">${f.unit == null ? '<span class="bom-nd">consultar</span><br><span class="bom-pend">Pendiente de cotización</span>' : esc(money(f.unit))}</td>`
          + `<td class="n r">${s == null ? '<span class="bom-nd">—</span>' : esc(money(s))}`
          + (dto > 0
            ? `<td class="n r">${f.unit == null ? '<span class="bom-nd">—</span>' : esc(money(f.unit * (1 - dto)))}</td>`
              + `<td class="n r">${s == null ? '<span class="bom-nd">—</span>' : esc(money(s * (1 - dto)))}</td>`
            : '')
          // Lo que se anade a mano se tiene que poder quitar a mano: sin salida, anadir una
          // referencia por error obligaria a vaciar el almacenamiento del navegador.
          // `o.editable` (opt-in, 2026-09-15 — Aruba): TAMBIÉN las líneas calculadas llevan
          // su botón de retirar; no las borra el motor — la página las mueve a «Líneas
          // retiradas» (restaurables) y las excluye de totales, Excel y texto. Sin el flag,
          // la tabla se pinta igual que siempre (los otros seis dimensionadores no cambian).
          + (f._ref ? ` <button type="button" class="bom-quitar" data-bom-quitar="${esc(f._ref)}" title="Quitar de la cotización">&times;</button>`
            : (o.editable ? ` <button type="button" class="bom-quitar" data-bom-omitir="${esc(claveFila(f))}" title="Retirar de la cotización (restaurable)">&times;</button>` : ''))
          + '</td>'
          + '</tr>';
      }
    }

    // Un total con líneas sin cotizar no se presenta como total: se etiqueta como parcial.
    // Si además falta el precio del propio equipo, la suma restante engaña más de lo que
    // informa — un BOM cuyo router no tiene precio no "cuesta" lo que sumen sus accesorios.
    const faltaEquipo = filas.some((f) => f.unit == null && /equipo|hardware|chasis/i.test(f.cat || ''));
    const etiqueta = sinPrecio === 0 ? 'Total de referencia' : 'Total parcial — faltan líneas por cotizar';
    html += `<tr class="bom-total"><td colspan="4">${etiqueta}</td>`
      + `<td class="n r">${faltaEquipo ? '<span class="bom-nd">sin cotizar</span>' : esc(money(suma))}</td>`
      + (dto > 0 ? `<td class="n r"></td><td class="n r">${faltaEquipo ? '<span class="bom-nd">—</span>' : esc(money(suma * (1 - dto)))}</td>` : '')
      + '</tr>';
    html += '</tbody></table></div>';

    if (duplicados.length) {
      html += '<p class="bom-aviso">'
        + (duplicados.length === 1 ? 'El SKU <code>' : 'Los SKU <code>')
        + duplicados.map(esc).join('</code>, <code>') + '</code> '
        + (duplicados.length === 1 ? 'ya está' : 'ya están')
        + ' en las líneas que calcula el dimensionador, y la referencia añadida <b>vuelve a sumar</b> '
        + 'en el total. Si no es un equipo adicional a propósito, quítala o ajusta la cantidad del equipo.'
        + '</p>';
    }

    if (faltaEquipo) {
      html += '<p class="bom-aviso">El equipo principal no tiene precio de lista publicado, así que no se'
        + ' muestra un total: sumar solo los accesorios daría una cifra que parece el costo del BOM y no lo es.'
        + ' Pide el precio del equipo a tu distribuidor para cerrar la cotización.</p>';
    } else if (sinPrecio > 0) {
      html += `<p class="bom-aviso">${sinPrecio} línea(s) sin precio de lista publicado — el total no las incluye.`
        + ' Complétalas con tu distribuidor antes de cotizar en firme.</p>';
    }
    // Nota al pie que ENUMERA las líneas pendientes (2026-09-14, pendiente #29): no basta
    // saber cuántas faltan — quien cierra la cotización necesita la lista exacta para
    // pedirla al distribuidor de una sola pasada. Aplica a cualquier línea con unit null.
    if (sinPrecio > 0) {
      const pendientes = filas.filter((f) => f.unit == null);
      html += `<p class="bom-aviso"><b>Pendiente de cotización con el distribuidor:</b> `
        + pendientes.map((f) => `${esc(f.desc)}${f.sku ? ` <code>${esc(f.sku)}</code>` : ''}`).join(' · ')
        + '.</p>';
    }
    if (o.aviso) html += `<p class="bom-aviso">${esc(o.aviso)}</p>`;

    return html;
  }

  // ExcelJS se carga solo al primer export. Se sirve desde node_modules vía
  // /vendor/exceljs.js, así que sigue la versión de package.json y no hay copia que se
  // desincronice. (Plan 20, 2026-09-18: antes se escribía con SheetJS, pero su edición
  // comunitaria no incrusta imágenes y las fotos oficiales del equipo viajan ahora con
  // la propuesta; la LECTURA de xlsx en procedencia.js sigue con SheetJS.)
  let cargando = null;
  function cargarExcelJS() {
    if (global.ExcelJS) return Promise.resolve();
    if (cargando) return cargando;
    cargando = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = '/vendor/exceljs.js';
      s.onload = () => resolve();
      s.onerror = () => { cargando = null; reject(new Error('No se pudo cargar el componente de Excel.')); };
      document.head.appendChild(s);
    });
    return cargando;
  }

  // Nombre de archivo seguro: sin separadores de ruta ni caracteres que Excel rechaza.
  function nombreArchivo(base) {
    const limpio = String(base || 'BOM').replace(/[\\/:*?"<>|]+/g, '-').replace(/\s+/g, '_').slice(0, 60);
    const hoy = new Date().toISOString().slice(0, 10);
    return `${limpio}_${hoy}.xlsx`;
  }

  // NÚCLEO PURO del Excel (plan 20, 2026-09-18): construye la matriz de filas, los anchos
  // de columna y las posiciones destacadas SIN tocar red ni disco. Es la única fuente del
  // contenido — exportarExcel solo lo vierte con ExcelJS, y las pruebas unitarias lo
  // afirman directamente, sin navegador ni dobles del escritor.
  // Devuelve { aoa, cols, dto, filaCabecera, filaTotal } (índices 0-based dentro de aoa).
  function matrizExcel(filasBase, meta) {
    const m = meta || {};
    // Igual que en renderTabla: lo anadido a mano tambien viaja al Excel. Exportar sin esas
    // lineas daria un documento que no corresponde a lo que se ve en pantalla (2026-09-13).
    // `meta.sinRefs` (fase 11) las omite para el BOM global consolidado de perfiles.
    const filas = (filasBase || []).concat(m.sinRefs ? [] : filasDeRefs());
    const { suma, sinPrecio } = totales(filas);

    // Simulador de precio neto (fase 11, opt-in via meta.dto): columnas NET en paralelo.
    const dtoX = (m.dto != null && m.dto > 0 && m.dto < 1) ? m.dto : 0;
    const aoa = [];
    aoa.push([m.titulo || 'Lista de materiales']);
    if (m.subtitulo) aoa.push([m.subtitulo]);
    // Contexto MSP (2026-09-14, pendiente #39): cliente y referencia del proyecto en la
    // cabecera de la primera hoja, cuando la página los declara.
    if (m.cliente) aoa.push([`Cliente: ${m.cliente}`]);
    if (m.referencia) aoa.push([`Referencia del proyecto: ${m.referencia}`]);
    aoa.push([`Generado ${new Date().toLocaleString('es')}`]);
    if (dtoX > 0 && m.dtoEtq) aoa.push([`Precio neto simulado: ${m.dtoEtq}`]);
    aoa.push([]);
    const filaCabecera = aoa.length;
    aoa.push(dtoX > 0
      ? ['Categoría', 'Descripción', 'SKU / Código', 'Cantidad', 'Precio unit. Lista', 'Subtotal Lista', 'Unit. Neto', 'Subtotal Neto', 'Notas']
      : ['Categoría', 'Descripción', 'SKU / Código', 'Cantidad', 'Precio unit.', 'Subtotal', 'Notas']);

    for (const f of filas) {
      const base = [
        f.cat || '',
        f.desc || '',
        f.sku || '',
        f.qty == null ? '' : f.qty,
        f.unit == null ? '' : f.unit,     // numérico: Excel puede sumar y formatear
        subtotal(f) == null ? '' : subtotal(f),
      ];
      if (dtoX > 0) {
        base.push(f.unit == null ? '' : Math.round(f.unit * (1 - dtoX) * 100) / 100);
        base.push(subtotal(f) == null ? '' : Math.round(subtotal(f) * (1 - dtoX) * 100) / 100);
      }
      // Ajuste manual de cantidad (2026-09-16): va en la columna Notas, junto a la fila
      // que lo lleva — una cifra distinta de la del motor sin esta nota parecería un error.
      base.push((f.nota || '') + (f.ajuste != null ? `${f.nota ? ' · ' : ''}Cantidad ajustada a mano — el cálculo del dimensionador decía ${f.ajuste}` : ''));
      aoa.push(base);
    }

    const faltaEquipoX = filas.some((f) => f.unit == null && /equipo|hardware|chasis/i.test(f.cat || ''));
    aoa.push([]);
    const filaTotal = aoa.length;
    if (dtoX > 0) {
      aoa.push(['', '', '', '', sinPrecio === 0 ? 'Total Lista de referencia' : 'Total Lista parcial', faltaEquipoX ? 'sin cotizar' : suma, sinPrecio === 0 ? 'Total Neto' : 'Total Neto parcial', faltaEquipoX ? 'sin cotizar' : Math.round(suma * (1 - dtoX) * 100) / 100, '']);
    } else {
      aoa.push(['', '', '', '', sinPrecio === 0 ? 'Total de referencia' : 'Total parcial', faltaEquipoX ? 'sin cotizar' : suma, '']);
    }
    if (faltaEquipoX) {
      aoa.push(['', 'El equipo principal no tiene precio de lista publicado: la suma de los accesorios no representa el costo del BOM.']);
    } else if (sinPrecio > 0) {
      aoa.push(['', `${sinPrecio} linea(s) sin precio de lista publicado — no incluidas en el total.`]);
    }
    // Sección «Pendiente de cotización con el distribuidor» (2026-09-14, pendiente #29):
    // enumera en el propio Excel TODAS las líneas sin precio (unit null), no solo su
    // cuenta — es la lista de la compra que hay que cerrar con el distribuidor.
    if (sinPrecio > 0) {
      aoa.push([]);
      aoa.push(['', 'PENDIENTE DE COTIZACION CON EL DISTRIBUIDOR (sin precio de lista — no entran en el total):']);
      for (const f of filas) {
        if (f.unit != null) continue;
        aoa.push([f.cat || '', `${f.desc || ''}${f.sku ? ` (${f.sku})` : ''}`, f.sku || '', f.qty == null ? '' : f.qty, '', '',
          ...(dtoX > 0 ? ['', ''] : []), 'Pendiente de cotización con el distribuidor']);
      }
    }
    // Seccion propia (2026-09-16), espejo del texto plano: enumera TODOS los ajustes de
    // cantidad hechos a mano con la cifra que el motor había calculado.
    const ajustadasX = filas.filter((f) => f.ajuste != null);
    if (ajustadasX.length) {
      aoa.push([]);
      aoa.push(['', 'CANTIDADES AJUSTADAS A MANO (el dimensionador calculó otra cifra — son decisiones declaradas, no errores):']);
      for (const f of ajustadasX) {
        aoa.push([f.cat || '', `${f.desc || ''}${f.sku ? ` (${f.sku})` : ''}`, f.sku || '', f.qty == null ? '' : f.qty, '', '',
          ...(dtoX > 0 ? ['', ''] : []), `El cálculo del dimensionador decía ${f.ajuste}`]);
      }
    }
    for (const n of (m.notas || [])) aoa.push(['', n]);

    // Col E (Precio unit.) a 20: con 14 el encabezado «Precio unit. Lista» y la
    // etiqueta «Total de referencia» quedaban cortados al imprimir (visto 2026-09-18).
    const cols = dtoX > 0
      ? [{ wch: 14 }, { wch: 46 }, { wch: 26 }, { wch: 9 }, { wch: 20 }, { wch: 14 }, { wch: 13 }, { wch: 14 }, { wch: 52 }]
      : [{ wch: 14 }, { wch: 46 }, { wch: 26 }, { wch: 9 }, { wch: 20 }, { wch: 14 }, { wch: 52 }];
    return { aoa, cols, dto: dtoX, filaCabecera, filaTotal };
  }

  // webp → PNG sin pérdida (plan 20): los webp del repo son los ORIGINALES extraídos de
  // los documentos oficiales de HPE y Excel no admite webp, así que se re-codifican a PNG
  // a su resolución natural vía canvas — la propuesta lleva la máxima calidad disponible.
  async function fotoPng(src) {
    const resp = await fetch(src);
    if (!resp.ok) throw new Error(`HTTP ${resp.status} al leer ${src}`);
    const bmp = await global.createImageBitmap(await resp.blob());
    const cv = document.createElement('canvas');
    cv.width = bmp.width; cv.height = bmp.height;
    cv.getContext('2d').drawImage(bmp, 0, 0);
    return { b64: cv.toDataURL('image/png').split(',')[1], w: bmp.width, h: bmp.height };
  }

  // Hoja «Fotos del equipo» (plan 20): modelo, pie con tamaño y fuente documental (regla
  // de procedencia, el mismo que la ficha en pantalla) y las vistas declaradas, a lo sumo
  // 860 px de ancho para que la hoja se maneje cómoda — el PNG incrustado conserva la
  // resolución natural completa. Devuelve cuántas fotos se incrustaron de verdad.
  async function hojaDeFotos(libro, fotos) {
    const h = libro.addWorksheet('Fotos del equipo');
    h.getColumn(1).width = 110;
    // La propuesta se imprime o se pasa a PDF: sin este ajuste la foto se corta en el
    // margen de la página (visto al convertir con LibreOffice, 2026-09-18).
    h.pageSetup = { orientation: 'landscape', fitToWidth: 1, fitToHeight: 0 };
    let r = 1;
    const pon = (txt, bold) => {
      const c = h.getCell(`A${r}`);
      c.value = txt;
      if (bold) c.font = { bold: true };
      r++;
    };
    pon('FOTOS OFICIALES DEL EQUIPO RECOMENDADO', true);
    pon(`Modelo: ${fotos.modelo}`);
    if (fotos.pie) pon(fotos.pie);
    pon('Extraídas de los documentos oficiales de HPE versionados en la herramienta — la misma fuente que la ficha en pantalla.');
    r++;
    let incrustadas = 0;
    for (const [cara, src] of [['frontal', fotos.front], ['trasera', fotos.rear]]) {
      if (!src) continue;
      pon(`Vista ${cara}`, true);
      try {
        const f = await fotoPng(src);
        const W = Math.min(f.w, 860);
        const H = Math.round(f.h * W / f.w);
        const id = libro.addImage({ base64: f.b64, extension: 'png' });
        h.addImage(id, { tl: { col: 0, row: r - 1 }, ext: { width: W, height: H } });
        r += Math.ceil(H / 20) + 2;
        incrustadas++;
      } catch (e) {
        // Honestidad antes que silencio: la foto declarada que no se pudo incrustar
        // deja constancia en la hoja, con su causa y dónde verla.
        pon(`La foto ${cara} no se pudo incrustar (${e.message}) — está disponible en la ficha del equipo dentro de la herramienta.`);
      }
    }
    return incrustadas;
  }

  async function exportarExcel(filasBase, meta) {
    const m = meta || {};
    await cargarExcelJS();
    const { aoa, cols, filaCabecera, filaTotal } = matrizExcel(filasBase, meta);

    const libro = new global.ExcelJS.Workbook();
    // La cabecera de columnas queda fijada al desplazarse: en un BOM largo, la columna
    // que se está leyendo deja de ser una adivinanza (plan 20).
    const hoja = libro.addWorksheet('BOM', { views: [{ state: 'frozen', ySplit: filaCabecera + 1 }] });
    // La tabla (7-9 columnas anchas) tampoco cabía en un A4 vertical al imprimirla:
    // apaisada y ajustada al ancho, la propuesta sale legible a papel o PDF (plan 20).
    hoja.pageSetup = { orientation: 'landscape', fitToWidth: 1, fitToHeight: 0 };
    hoja.columns = cols.map((c) => ({ width: c.wch }));
    for (const fila of aoa) hoja.addRow(fila);
    // Jerarquía mínima, la misma de la tabla en pantalla: título, cabecera y total.
    hoja.getRow(1).font = { bold: true, size: 13 };
    const filaCab = hoja.getRow(filaCabecera + 1);
    filaCab.font = { bold: true };
    filaCab.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEDF0F4' } };
    hoja.getRow(filaTotal + 1).font = { bold: true };
    // Las columnas de dinero se muestran con separador de miles, conservando su tipo
    // numérico (Excel puede seguir sumando y filtrando).
    hoja.eachRow((row, n) => {
      if (n <= filaCabecera + 1) return;
      for (const c of [5, 6, 7, 8]) {
        const cel = row.getCell(c);
        if (typeof cel.value === 'number') cel.numFmt = '#,##0.00';
      }
    });

    // Fotos oficiales del equipo (plan 20): solo viajan cuando la página las declara en
    // meta.fotos — hoy únicamente Aruba, por la regla del piloto.
    if (m.fotos && m.fotos.front) {
      const incrustadas = await hojaDeFotos(libro, m.fotos);
      if (incrustadas > 0) {
        hoja.addRow(['', 'Las fotos oficiales del equipo recomendado viajan en la hoja «Fotos del equipo».']);
      }
    }

    const buf = await libro.xlsx.writeBuffer();
    const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = nombreArchivo(m.archivo || m.titulo);
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 800);
  }

  // Texto plano para pegar en un correo o un ticket. Se conserva porque sigue siendo la vía
  // más rápida de compartir un BOM sin adjuntar nada.
  function comoTexto(filasBase, meta) {
    const m = meta || {};
    // Mismo criterio que exportarExcel: las referencias anadidas a mano son parte del BOM
    // y tienen que salir en el texto, no solo en la tabla pintada.
    // `meta.sinRefs` (fase 11) las omite para el BOM global consolidado de perfiles.
    const filas = (filasBase || []).concat(m.sinRefs ? [] : filasDeRefs());
    const { suma, sinPrecio } = totales(filas);
    const pad = (s, n) => String(s ?? '').padEnd(n);
    const L = [];
    L.push(m.titulo || 'LISTA DE MATERIALES');
    if (m.subtitulo) L.push(m.subtitulo);
    if (m.cliente) L.push(`Cliente: ${m.cliente}`);
    if (m.referencia) L.push(`Referencia del proyecto: ${m.referencia}`);
    L.push('');
    let catActual = null;
    for (const f of filas) {
      if (f.cat !== catActual) { catActual = f.cat; L.push(String(catActual).toUpperCase()); }
      const s = subtotal(f);
      L.push(`  ${pad(f.qty == null ? '' : f.qty + ' x', 6)} ${pad(f.desc, 42)} ${pad(f.sku || '', 26)} ${s == null ? 'consultar' : money(s)}`);
      if (f.nota) L.push(`         ${f.nota}`);
      // Ajuste manual de cantidad (2026-09-16): la fila muestra la cifra ajustada y aquí
      // se declara la del motor — en un correo, un ajuste sin declarar parece un error.
      if (f.ajuste != null) L.push(`         (cantidad ajustada a mano — el cálculo del dimensionador decía ${f.ajuste})`);
    }
    const faltaEquipoT = filas.some((f) => f.unit == null && /equipo|hardware|chasis/i.test(f.cat || ''));
    L.push('');
    if (faltaEquipoT) {
      L.push('TOTAL: sin cotizar — el equipo principal no tiene precio de lista publicado.');
      L.push('(sumar solo los accesorios no representa el costo del BOM)');
    } else {
      L.push(`${sinPrecio === 0 ? 'TOTAL DE REFERENCIA' : 'TOTAL PARCIAL'}: ${money(suma)}`);
      if (sinPrecio > 0) L.push(`(${sinPrecio} linea(s) sin precio publicado, no incluidas)`);
      // Simulador de precio neto (fase 11, opt-in via meta.dto): total NET en paralelo.
      if (m.dto != null && m.dto > 0 && m.dto < 1) {
        L.push(`${sinPrecio === 0 ? 'TOTAL NETO SIMULADO' : 'TOTAL NETO PARCIAL'}${m.dtoEtq ? ' (' + m.dtoEtq + ')' : ''}: ${money(suma * (1 - m.dto))}`);
      }
    }
    // Las pendientes se enumeran por su nombre (2026-09-14, pendiente #29): el texto
    // plano es lo que se pega en el correo al distribuidor — tiene que servir de lista.
    if (sinPrecio > 0) {
      L.push('PENDIENTE DE COTIZACION CON EL DISTRIBUIDOR:');
      for (const f of filas) if (f.unit == null) L.push(`  - ${f.desc}${f.sku ? ` (${f.sku})` : ''}${f.qty != null ? ` x${f.qty}` : ''}`);
    }
    // Y la seccion que las enumera cierra el ciclo: quien recibe el texto ve de un vistazo
    // que las divergencias contra el motor son decisiones declaradas, no errores.
    const ajustadasT = filas.filter((f) => f.ajuste != null);
    if (ajustadasT.length) {
      L.push('CANTIDADES AJUSTADAS A MANO (el dimensionador calculó otra cifra):');
      for (const f of ajustadasT) L.push(`  - ${f.desc}${f.sku ? ` (${f.sku})` : ''}: ${f.qty} uds — el cálculo decía ${f.ajuste}`);
    }
    for (const n of (m.notas || [])) L.push(n);
    return L.join('\n');
  }

  // ── TRASPASO AL COTIZADOR ────────────────────────────────────────────────
  //
  // El hueco que cierra: dimensionabas un FortiGate 200G y luego lo buscabas A MANO entre
  // los 154 equipos del cotizador. Dos herramientas que trabajan sobre el mismo equipo y no
  // se hablaban.
  //
  // EL DIMENSIONADOR NO CONSTRUYE LA LINEA DEL COTIZADOR, SOLO DICE QUE EQUIPO. El precio,
  // el color del fabricante y el texto comercial viven en el catalogo del cotizador, que es
  // su fuente de verdad. Si el dimensionador los rellenara, habria dos sitios con el mismo
  // dato y el dia que cambie un precio solo se actualizaria uno.
  const ENTRADA = 'presales:cotizador:entrada';

  // Los dos catalogos nombran los equipos distinto: el dimensionador de Juniper dice
  // "SRX320" y el cotizador "Juniper SRX 320"; Aruba dice "EC-XS" y el cotizador
  // "Aruba EC-XS". Se normaliza quitando espacios, guiones y el prefijo del fabricante, en
  // vez de mantener a mano una tabla de equivalencias que se desincronizaria.
  const PREFIJOS = /^(juniper|aruba|netengine|cisco|fortinet|mikrotik|nokia|huawei)/;
  function normalizar(nombre) {
    const s = String(nombre || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    return s.replace(PREFIJOS, '') || s;
  }

  /* LO QUE ACOMPANA AL EQUIPO: EL RESTO DEL BOM (A6, 2026-09-18).
     El hueco medido en Chromium ese dia sobre el dimensionador de Fortinet: un FortiGate 200G
     a 2.500 Mbps produce un BOM de cuatro lineas por $38.088,20 —equipo $11.477, bundle
     Enterprise Protection $21.205,80, FortiCare Premium $4.989,60 y FortiConverter $415,80— y
     al cotizador viajaba UNICAMENTE el equipo. El 70 % de la cotizacion se volvia a teclear a
     mano, que es el mismo hueco que «Enviar al cotizador» existe para cerrar. Lo mismo con la
     suscripcion y el Boost de Aruba, las opticas de Huawei o el soporte de cualquiera.

     NO HACE FALTA UN CANAL NUEVO: el cotizador ya acepta lineas que no estan en `CATALOG` por
     la via de las referencias (`e.ref`), que se construyo para los bundles anadidos desde la
     ficha. Una linea de licencia calculada por el dimensionador es exactamente eso: algo que
     no vive en `CATALOG` y viaja con su SKU, su descripcion y su precio.

     EL EQUIPO SIGUE VIAJANDO SOLO COMO NOMBRE. La regla de este repositorio no cambia: el
     dimensionador dice QUE equipo y `CATALOG` pone su precio y su texto comercial. Por eso la
     fila `cat:'Equipo'` se EXCLUYE de lo que viaja como referencia — si viajara, el hardware
     se cotizaria dos veces, que es el fallo de los $38.088,20 → $49.565,20 ya documentado en
     `renderTabla`.

     FALLA CERRADO. Solo se manda el resto del BOM cuando se puede PROBAR que ese BOM es el
     del equipo que viaja:
       - sin ninguna fila `cat:'Equipo'` no hay forma de saber cual de las filas es el
         hardware, y mandarlas todas lo cotizaria dos veces;
       - si la fila de equipo del BOM no es el modelo que manda la pagina, el BOM esta
         cotizando otra caja (el desplegable del BOM cotiza cualquier equipo a proposito, ver
         `avisoDesvio`) y sus licencias no corresponden a este.
     En los dos casos viaja solo el equipo — lo de hoy— y se dice por que, en vez de armar una
     cotizacion incoherente en silencio.

     LO QUE NO VIAJA, Y ES UNA DECISION: la `nota` de cada fila. Esas notas llevan texto
     interno del dimensionador (rutas de `/datasheets/`, referencias a constantes del catalogo)
     y la cotizacion es el documento que ve el cliente. */
  function acompanantes(modelo, opciones) {
    const o = opciones || {};
    /* RENOVACION Y CO-TERM (Fortinet, 2026-09-23). La caja ya esta instalada y el BOM, a
       proposito, no trae fila de equipo: se compran SOLO los servicios. Aqui no hay hardware
       que excluir, asi que todo viaja como referencia — y el equipo NO viaja por su nombre,
       porque el cotizador le pondria el precio del hardware a una renovacion. */
    if (o.sinEquipo) {
      const filas = filasCalculadas.filter((f) => f && f.cat !== 'Equipo' && (f.sku || f.desc));
      return { filas, motivo: '', sinEquipo: true };
    }
    const equipo = filasCalculadas.filter((f) => f && f.cat === 'Equipo');
    if (!equipo.length) return { filas: [], motivo: 'sin-equipo' };
    const propio = equipo.filter((f) => normalizar(f.desc) === normalizar(modelo));
    if (!propio.length) return { filas: [], motivo: 'otro-equipo' };
    // Defensa de segundo orden: si una fila de otra categoria repite el SKU del hardware
    // (una variante, un repuesto listado aparte), no se manda — el cotizador la sumaria al
    // equipo que ya viaja por su nombre.
    const skusEquipo = new Set(equipo.map((f) => f.sku).filter(Boolean));
    const filas = filasCalculadas.filter((f) => f && f.cat !== 'Equipo'
      && (f.sku || f.desc)                       // una fila sin SKU ni descripcion no es una linea
      && !(f.sku && skusEquipo.has(f.sku)));
    /* SKU COMBINADO (BDL) DE COMPRA NUEVA. Fortinet publica el equipo y su primer bundle en
       UNA referencia (FG-90G-BDL-809-36 = equipo + Enterprise + FortiCare Premium). Esa fila
       es el equipo, pero su precio NO es el del hardware: si viajara solo el nombre, el
       cotizador pondria el precio de la caja desde `CATALOG` y la licencia y el soporte que
       el BDL incluye desaparecerian de la cotizacion. Por eso viaja COMO REFERENCIA, con su
       SKU y su precio, y el nombre suelto no viaja — si viajaran los dos, el hardware se
       cotizaria dos veces. La descripcion sigue siendo el modelo: es lo que identifica la
       linea del equipo en la cotizacion. */
    const bdl = propio.find((f) => f.bdl && f.sku);
    if (bdl) return { filas: [bdl].concat(filas), motivo: '', equipoComoRef: true };
    return { filas, motivo: '' };
  }

  // Manda al cotizador el equipo, el resto de su BOM y las referencias anadidas a mano.
  //
  // LAS DOS COSAS VIAJAN DISTINTO A PROPOSITO. El EQUIPO viaja solo como nombre: el precio y
  // el texto comercial los pone `CATALOG`, que es la fuente de verdad del cotizador — si los
  // mandara el dimensionador habria dos sitios con el mismo dato. Una REFERENCIA no puede
  // hacer eso porque no esta en `CATALOG` (son 6.849 solo de Fortinet, frente a sus 54
  // equipos), asi que viaja con su SKU, su descripcion y su precio, y la fuente de verdad de
  // esos tres es la price list de la que se extrajeron.
  //
  // Devuelve `{ok, lineas, motivo}` y no un booleano: el boton necesita decir cuantas lineas
  // viajaron y, cuando solo viajo el equipo, por que — un «Enviado» a secas ocultaria
  // exactamente el caso que esta funcion existe para no ocultar.
  function enviarACotizador(item) {
    try {
      const cola = JSON.parse(localStorage.getItem(ENTRADA) || '[]');
      const acomp = acompanantes(item.modelo, { sinEquipo: !!item.sinEquipo });
      // El equipo viaja por su nombre salvo en dos casos: ya viaja como referencia (SKU
      // combinado) o no se compra (renovacion, co-term).
      if (!acomp.equipoComoRef && !acomp.sinEquipo) {
        cola.push({ modelo: item.modelo, qty: item.qty || 1, nota: item.nota || '', de: item.de || '' });
      }
      for (const f of acomp.filas) {
        // `cat` viaja para que la cotizacion agrupe la linea por lo que es (Licencias, Soporte,
        // Opticas) en vez de por «Referencia de pedido», que es de donde venia el canal.
        cola.push({ ref: { sku: f.sku || null, d: f.desc || '', p: (f.unit == null ? null : f.unit), v: vendorPagina,
          cat: f.bdl ? 'Equipo · SKU combinado (BDL)' : (f.cat || '') },
                    qty: f.qty || 1, de: item.de || '' });
      }
      const manuales = refsExtra();
      for (const r of manuales) {
        cola.push({ ref: { sku: r.sku, d: r.d, p: r.p, v: r.v || '' }, qty: r.qty || 1, de: item.de || '' });
      }
      localStorage.setItem(ENTRADA, JSON.stringify(cola));
      if (acomp.motivo) {
        console.warn('[BOM] Al cotizador viaja solo el equipo: '
          + (acomp.motivo === 'sin-equipo'
            ? 'el BOM de esta pantalla no declara ninguna fila de categoria «Equipo».'
            : 'el BOM esta cotizando otro equipo distinto del que se manda.'));
      }
      const lineas = (acomp.equipoComoRef || acomp.sinEquipo ? 0 : 1) + acomp.filas.length + manuales.length;
      return { ok: true, lineas, motivo: acomp.motivo };
    } catch {
      return { ok: false, lineas: 0, motivo: '' }; // almacenamiento deshabilitado: se avisa, no se finge que funciono
    }
  }

  function recogerEntrada() {
    try {
      const cola = JSON.parse(localStorage.getItem(ENTRADA) || '[]');
      localStorage.removeItem(ENTRADA);
      return Array.isArray(cola) ? cola : [];
    } catch {
      return [];
    }
  }

  /* ── Sincronizacion con el dimensionamiento ────────────────────────────────
     POR QUE ESTO VIVE AQUI Y NO EN CADA PAGINA. Cada dimensionador tenia su propia copia de
     `llevarABom`, y las copias se comportaban distinto: medido en el navegador el 2026-09-03,
     Fortinet, MikroTik y Aruba seguian al dimensionamiento, pero Cisco y Huawei se quedaban
     cotizando el equipo anterior y Juniper solo repintaba su BOM al abrir la pestaña. Tres
     comportamientos para la misma pregunta.

     LA CAUSA ERA UNA SOLA, y estaba en la copia: `llevarABom(id)` empezaba con
     `if(!id) return;`, asi que cuando el dimensionamiento se quedaba SIN CANDIDATO —el caso
     que mas importa— el BOM no se enteraba de nada y seguia mostrando el ultimo equipo que si
     cumplia. Medido: en Cisco a 20 Gbps no hay candidato y el BOM seguia cotizando un
     Catalyst 8200L de 1 Gbps, en silencio. Eso es una cotizacion exportable que no
     corresponde al diseño.

     ELEGIDO A MANO Y HEREDADO NO SON LO MISMO, la misma distincion que `ficha.js` hace con el
     equipo recomendado. El desplegable del BOM cotiza CUALQUIER equipo a proposito —para eso
     esta—, asi que si alguien lo toca, su eleccion manda y no se le pisa. Lo que no puede
     pasar es que una eleccion HEREDADA (la que dejo el render anterior) se quede fija: esa
     sigue siempre al dimensionamiento. Se distinguen por el evento `change`, que solo dispara
     la interaccion humana y nunca una asignacion por codigo. */

  function sincronizar(cfg) {
    const c = cfg || {};
    const sel = document.getElementById(c.selector || 'pickModel');
    if (typeof c.render !== 'function') return;
    // Se recuerda como repinta esta pagina su BOM: es lo que permite que anadir o quitar una
    // referencia se vea al instante sin que cada pagina tenga que cablear nada.
    repintar = c.render;
    if (!sel) { c.render(); return; }

    if (!sel.dataset.bomVigilado) {
      sel.dataset.bomVigilado = '1';
      sel.addEventListener('change', () => { sel.dataset.bomManual = '1'; });
    }

    const id = c.elegido || null;
    if (id && sel.dataset.bomManual !== '1' && sel.value !== id
        && Array.prototype.some.call(sel.options, (o) => o.value === id)) {
      sel.value = id;
    }
    // Se repinta SIEMPRE, tambien cuando el modelo no cambia: el aviso de desvio, el de "sin
    // candidato" y todo lo que el BOM derive del escenario dependen de mas cosas que el id.
    c.render();
  }

  // Como repinta la pagina su BOM tras anadir o quitar una referencia, para las paginas que
  // no pasan por `sincronizar` (Fortinet desde la etapa 7: su BOM sale del motor, no de un
  // desplegable propio).
  function fijarRepintado(fn) { repintar = typeof fn === 'function' ? fn : null; }

  // Suelta la eleccion manual: la usa el boton de volver al recomendado de cada pagina, y
  // hace falta al recargar un escenario desde la URL, porque reponer no es elegir.
  function soltarManual(selector) {
    const sel = document.getElementById(selector || 'pickModel');
    if (sel) delete sel.dataset.bomManual;
  }

  // El aviso que declara que el BOM no corresponde al dimensionamiento. Existia solo en la
  // pagina de Fortinet; al vivir aqui lo heredan los siete fabricantes.
  function avisoDesvio(cfg) {
    const c = cfg || {};
    if (c.hayCandidato === false) {
      return '<p class="bom-desvio"><b class="warn">Este BOM no corresponde al dimensionamiento.</b> '
        + 'Con los parámetros actuales <b>ningún modelo cumple</b> las restricciones, así que esta '
        + 'cotización es la del último equipo que sí cumplía. Revisa la pestaña de cálculo antes de exportar.</p>';
    }
    if (c.elegido && c.enBom && c.elegido !== c.enBom) {
      return `<p class="bom-desvio">Estás cotizando el <b>${esc(c.enBom)}</b>, pero en el dimensionamiento `
        + `tienes elegido el <b>${esc(c.elegido)}</b>. Es legítimo —el desplegable de arriba cotiza `
        + 'cualquier equipo— pero no es lo que salió del cálculo.</p>';
    }
    return '';
  }

  // Inyecta el boton en la barra de acciones del BOM que las seis paginas ya comparten.
  // `obtener` lo aporta cada pagina porque solo ella sabe que equipo esta elegido ahora.
  //
  // `opciones` (Fortinet, 2026-09-23) es opt-in y no cambia nada para las demas paginas:
  //   · `id`    le da al boton un id propio, para que la PUERTA de la pagina lo pueda
  //             deshabilitar. Sin id, la puerta de Fortinet deshabilitaba `#btnACotizador`
  //             y el boton no lo tenia: el envio al cotizador no obedecia a la puerta (F04).
  //   · `antes` es una comprobacion ASINCRONA que decide si el envio puede salir (la pagina
  //             de Fortinet la confirma con el servidor). Si responde `{ok:false}`, no se
  //             escribe nada en la cola y el boton dice por que.
  function montarBotonCotizador(obtener, opciones) {
    const o = opciones || {};
    const barra = document.querySelector('.bom-acciones');
    if (!barra || barra.querySelector('.btn-cotizador')) return null;
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'btn ghost btn-cotizador';
    if (o.id) b.id = o.id;
    b.style.cssText = 'font-size:11px;padding:5px 11px';
    b.textContent = 'Enviar al cotizador';
    const decir = (txt, ms) => { b.textContent = txt; setTimeout(() => { b.textContent = 'Enviar al cotizador'; }, ms); };
    b.addEventListener('click', async () => {
      if (b.disabled) return;
      const item = obtener();
      if (!item || !item.modelo) { decir('Sin equipo elegido', 1800); return; }
      if (typeof o.antes === 'function') {
        b.disabled = true;
        b.textContent = 'Confirmando…';
        let v;
        try { v = await o.antes(item); } catch { v = { ok: false, motivo: 'No se pudo confirmar' }; }
        b.disabled = false;
        if (!v || !v.ok) { decir((v && v.motivo) || 'Envío no permitido', 2600); return; }
      }
      const r = enviarACotizador(item);
      if (!r.ok) { decir('No se pudo guardar', 2200); return; }
      // EL BOTON DICE CUANTO VIAJO, Y CUANDO VIAJO MENOS, POR QUE. Un «Enviado» a secas
      // ocultaria justo el caso en que la cotizacion sale incompleta — el mismo vicio que
      // `avisoDesvio` existe para evitar en la pantalla.
      b.textContent = r.motivo
        ? (r.motivo === 'otro-equipo' ? 'Enviado solo el equipo — el BOM cotiza otro' : 'Enviado solo el equipo')
        : `Enviado — ${r.lineas} línea${r.lineas === 1 ? '' : 's'}…`;
      // Cuando la cotizacion sale recortada se da tiempo a leer por que antes de navegar.
      setTimeout(() => { location.href = '/cotizador.html'; }, r.motivo ? 2200 : 500);
    });
    barra.appendChild(b);
    return b;
  }

  // Delegacion en document y no en la tabla: el BOM se repinta entero en cada cambio de
  // escenario, asi que un listener colgado del nodo moriria con el primer repintado.
  if (global.document && !global.document.__bomQuitarCableado) {
    global.document.__bomQuitarCableado = true;
    global.document.addEventListener('click', (e) => {
      const b = e.target.closest && e.target.closest('[data-bom-quitar]');
      if (b) quitarRef(b.dataset.bomQuitar);
    });
    // `change` y NO `input`: guardar repinta la tabla entera, asi que reaccionar a cada
    // pulsacion destruiria el campo a medio teclear — escribir «12» pasa por «1», y con
    // `input` esa cantidad intermedia ya se habria guardado y el foco perdido.
    global.document.addEventListener('change', (e) => {
      const c = e.target.closest && e.target.closest('[data-bom-cant]');
      if (c) cantidadRef(c.dataset.bomCant, c.value);
    });
  }

  global.BOM = { renderTabla, exportarExcel, comoTexto, matrizExcel, money, esc, claveFila,
    enviarACotizador, recogerEntrada, montarBotonCotizador, normalizar,
    sincronizar, soltarManual, avisoDesvio, fijarRepintado,
    agregarRef, quitarRef, cantidadRef, refsExtra, fijarVendor,
    perfiles, perfilesDe, guardarPerfil, quitarPerfil, consolidar,
    simuladorDescuento, tco };
})(window);
