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
.bom-quitar:hover{border-color:var(--red);color:var(--red)}
.bom-aviso{font-size:11.5px;color:var(--amber);margin:10px 0 0;line-height:1.45}
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

  function renderTabla(filasBase, opciones) {
    const o = opciones || {};
    // Las referencias anadidas se pegan aqui, no en la pagina, y entran ANTES de los totales:
    // un bundle en la cotizacion que no sume al total seria un numero que no corresponde a lo
    // que la cotizacion lleva dentro. `o.sinRefs` (fase 11) las omite: el BOM global
    // consolidado de perfiles multi-sede no debe arrastrar las refs manuales de la pagina.
    const filas = (filasBase || []).concat(o.sinRefs ? [] : filasDeRefs());
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
      + '<th class="r">Precio unit.</th><th class="r">Subtotal LIST</th>'
      + (dto > 0 ? '<th class="r">Unit. NET</th><th class="r">Subtotal NET</th>' : '')
      + '</tr></thead><tbody>';

    for (const g of grupos) {
      html += `<tr class="bom-grupo"><td colspan="${nCols}">${esc(g.cat)}</td></tr>`;
      for (const f of g.filas) {
        const s = subtotal(f);
        html += '<tr>'
          + `<td><b>${esc(f.desc)}</b>${f.nota ? `<span class="bom-nota">${esc(f.nota)}</span>` : ''}</td>`
          + `<td class="n">${f.sku ? `<code>${esc(f.sku)}</code>` : '<span class="bom-nd">—</span>'}</td>`
          // La cantidad se edita SOLO en lo que se anadio a mano: las filas que calcula el
          // dimensionador (unidades, opticas, licencias) salen del motor de la pagina, y
          // dejarlas editables invitaria a cambiar a mano una cifra que el proximo repintado
          // va a pisar sin avisar.
          + `<td class="n r">${f._ref
            ? `<input type="number" class="bom-cant" min="1" step="1" value="${Number(f.qty) || 1}" data-bom-cant="${esc(f._ref)}" aria-label="Cantidad">`
            : (f.qty == null ? '—' : f.qty)}</td>`
          + `<td class="n r">${f.unit == null ? '<span class="bom-nd">consultar</span>' : esc(money(f.unit))}</td>`
          + `<td class="n r">${s == null ? '<span class="bom-nd">—</span>' : esc(money(s))}`
          + (dto > 0
            ? `<td class="n r">${f.unit == null ? '<span class="bom-nd">—</span>' : esc(money(f.unit * (1 - dto)))}</td>`
              + `<td class="n r">${s == null ? '<span class="bom-nd">—</span>' : esc(money(s * (1 - dto)))}</td>`
            : '')
          // Lo que se anade a mano se tiene que poder quitar a mano: sin salida, anadir una
          // referencia por error obligaria a vaciar el almacenamiento del navegador.
          + (f._ref ? ` <button type="button" class="bom-quitar" data-bom-quitar="${esc(f._ref)}" title="Quitar de la cotización">&times;</button>` : '')
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

    if (faltaEquipo) {
      html += '<p class="bom-aviso">El equipo principal no tiene precio de lista publicado, así que no se'
        + ' muestra un total: sumar solo los accesorios daría una cifra que parece el costo del BOM y no lo es.'
        + ' Pide el precio del equipo a tu distribuidor para cerrar la cotización.</p>';
    } else if (sinPrecio > 0) {
      html += `<p class="bom-aviso">${sinPrecio} línea(s) sin precio de lista publicado — el total no las incluye.`
        + ' Complétalas con tu distribuidor antes de cotizar en firme.</p>';
    }
    if (o.aviso) html += `<p class="bom-aviso">${esc(o.aviso)}</p>`;

    return html;
  }

  // SheetJS se carga solo al primer export. Se sirve desde node_modules vía /vendor/xlsx.js,
  // asi que sigue la version de package.json y no hay copia que se desincronice.
  let cargando = null;
  function cargarSheetJS() {
    if (global.XLSX) return Promise.resolve();
    if (cargando) return cargando;
    cargando = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = '/vendor/xlsx.js';
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

  async function exportarExcel(filasBase, meta) {
    const m = meta || {};
    await cargarSheetJS();
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
    aoa.push([`Generado ${new Date().toLocaleString('es')}`]);
    if (dtoX > 0 && m.dtoEtq) aoa.push([`Precio neto simulado: ${m.dtoEtq}`]);
    aoa.push([]);
    aoa.push(dtoX > 0
      ? ['Categoría', 'Descripción', 'SKU / Código', 'Cantidad', 'Precio unit. LIST', 'Subtotal LIST', 'Unit. NET', 'Subtotal NET', 'Notas']
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
      base.push(f.nota || '');
      aoa.push(base);
    }

    const faltaEquipoX = filas.some((f) => f.unit == null && /equipo|hardware|chasis/i.test(f.cat || ''));
    aoa.push([]);
    if (dtoX > 0) {
      aoa.push(['', '', '', '', sinPrecio === 0 ? 'Total LIST de referencia' : 'Total LIST parcial', faltaEquipoX ? 'sin cotizar' : suma, sinPrecio === 0 ? 'Total NET' : 'Total NET parcial', faltaEquipoX ? 'sin cotizar' : Math.round(suma * (1 - dtoX) * 100) / 100, '']);
    } else {
      aoa.push(['', '', '', '', sinPrecio === 0 ? 'Total de referencia' : 'Total parcial', faltaEquipoX ? 'sin cotizar' : suma, '']);
    }
    if (faltaEquipoX) {
      aoa.push(['', 'El equipo principal no tiene precio de lista publicado: la suma de los accesorios no representa el costo del BOM.']);
    } else if (sinPrecio > 0) {
      aoa.push(['', `${sinPrecio} linea(s) sin precio de lista publicado — no incluidas en el total.`]);
    }
    for (const n of (m.notas || [])) aoa.push(['', n]);

    const hoja = global.XLSX.utils.aoa_to_sheet(aoa);
    hoja['!cols'] = dtoX > 0
      ? [{ wch: 14 }, { wch: 46 }, { wch: 26 }, { wch: 9 }, { wch: 14 }, { wch: 14 }, { wch: 13 }, { wch: 14 }, { wch: 52 }]
      : [{ wch: 14 }, { wch: 46 }, { wch: 26 }, { wch: 9 }, { wch: 14 }, { wch: 14 }, { wch: 52 }];
    const libro = global.XLSX.utils.book_new();
    global.XLSX.utils.book_append_sheet(libro, hoja, 'BOM');
    global.XLSX.writeFile(libro, nombreArchivo(m.archivo || m.titulo));
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
    L.push('');
    let catActual = null;
    for (const f of filas) {
      if (f.cat !== catActual) { catActual = f.cat; L.push(String(catActual).toUpperCase()); }
      const s = subtotal(f);
      L.push(`  ${pad(f.qty == null ? '' : f.qty + ' x', 6)} ${pad(f.desc, 42)} ${pad(f.sku || '', 26)} ${s == null ? 'consultar' : money(s)}`);
      if (f.nota) L.push(`         ${f.nota}`);
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
        L.push(`${sinPrecio === 0 ? 'TOTAL NET SIMULADO' : 'TOTAL NET PARCIAL'}${m.dtoEtq ? ' (' + m.dtoEtq + ')' : ''}: ${money(suma * (1 - m.dto))}`);
      }
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

  // Manda al cotizador el equipo y, con el, las referencias anadidas a mano.
  //
  // LAS DOS COSAS VIAJAN DISTINTO A PROPOSITO. El EQUIPO viaja solo como nombre: el precio y
  // el texto comercial los pone `CATALOG`, que es la fuente de verdad del cotizador — si los
  // mandara el dimensionador habria dos sitios con el mismo dato. Una REFERENCIA no puede
  // hacer eso porque no esta en `CATALOG` (son 6.849 solo de Fortinet, frente a sus 54
  // equipos), asi que viaja con su SKU, su descripcion y su precio, y la fuente de verdad de
  // esos tres es la price list de la que se extrajeron.
  function enviarACotizador(item) {
    try {
      const cola = JSON.parse(localStorage.getItem(ENTRADA) || '[]');
      cola.push({ modelo: item.modelo, qty: item.qty || 1, nota: item.nota || '', de: item.de || '' });
      for (const r of refsExtra()) {
        cola.push({ ref: { sku: r.sku, d: r.d, p: r.p, v: r.v || '' }, qty: r.qty || 1, de: item.de || '' });
      }
      localStorage.setItem(ENTRADA, JSON.stringify(cola));
      return true;
    } catch {
      return false; // almacenamiento deshabilitado: se avisa, no se finge que funciono
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
  function montarBotonCotizador(obtener) {
    const barra = document.querySelector('.bom-acciones');
    if (!barra || barra.querySelector('.btn-cotizador')) return;
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'btn ghost btn-cotizador';
    b.style.cssText = 'font-size:11px;padding:5px 11px';
    b.textContent = 'Enviar al cotizador';
    b.addEventListener('click', () => {
      const item = obtener();
      if (!item || !item.modelo) { b.textContent = 'Sin equipo elegido'; setTimeout(() => { b.textContent = 'Enviar al cotizador'; }, 1800); return; }
      b.textContent = enviarACotizador(item) ? 'Enviado — abriendo…' : 'No se pudo guardar';
      if (b.textContent.startsWith('Enviado')) setTimeout(() => { location.href = '/cotizador.html'; }, 500);
      else setTimeout(() => { b.textContent = 'Enviar al cotizador'; }, 2200);
    });
    barra.appendChild(b);
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

  global.BOM = { renderTabla, exportarExcel, comoTexto, money, esc,
    enviarACotizador, recogerEntrada, montarBotonCotizador, normalizar,
    sincronizar, soltarManual, avisoDesvio,
    agregarRef, quitarRef, cantidadRef, refsExtra, fijarVendor };
})(window);
