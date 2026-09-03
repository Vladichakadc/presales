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
  function renderTabla(filas, opciones) {
    const o = opciones || {};
    const { suma, sinPrecio } = totales(filas);

    const grupos = [];
    for (const f of filas) {
      const ultimo = grupos[grupos.length - 1];
      if (ultimo && ultimo.cat === f.cat) ultimo.filas.push(f);
      else grupos.push({ cat: f.cat, filas: [f] });
    }

    let html = '<div class="scroll"><table class="bom-tabla">'
      + '<thead><tr>'
      + '<th>Descripción</th><th>SKU / Código</th><th class="r">Cant.</th>'
      + '<th class="r">Precio unit.</th><th class="r">Subtotal</th>'
      + '</tr></thead><tbody>';

    for (const g of grupos) {
      html += `<tr class="bom-grupo"><td colspan="5">${esc(g.cat)}</td></tr>`;
      for (const f of g.filas) {
        const s = subtotal(f);
        html += '<tr>'
          + `<td><b>${esc(f.desc)}</b>${f.nota ? `<span class="bom-nota">${esc(f.nota)}</span>` : ''}</td>`
          + `<td class="n">${f.sku ? `<code>${esc(f.sku)}</code>` : '<span class="bom-nd">—</span>'}</td>`
          + `<td class="n r">${f.qty == null ? '—' : f.qty}</td>`
          + `<td class="n r">${f.unit == null ? '<span class="bom-nd">consultar</span>' : esc(money(f.unit))}</td>`
          + `<td class="n r">${s == null ? '<span class="bom-nd">—</span>' : esc(money(s))}</td>`
          + '</tr>';
      }
    }

    // Un total con líneas sin cotizar no se presenta como total: se etiqueta como parcial.
    // Si además falta el precio del propio equipo, la suma restante engaña más de lo que
    // informa — un BOM cuyo router no tiene precio no "cuesta" lo que sumen sus accesorios.
    const faltaEquipo = filas.some((f) => f.unit == null && /equipo|hardware|chasis/i.test(f.cat || ''));
    const etiqueta = sinPrecio === 0 ? 'Total de referencia' : 'Total parcial — faltan líneas por cotizar';
    html += `<tr class="bom-total"><td colspan="4">${etiqueta}</td>`
      + `<td class="n r">${faltaEquipo ? '<span class="bom-nd">sin cotizar</span>' : esc(money(suma))}</td></tr>`;
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

  async function exportarExcel(filas, meta) {
    const m = meta || {};
    await cargarSheetJS();
    const { suma, sinPrecio } = totales(filas);

    const aoa = [];
    aoa.push([m.titulo || 'Lista de materiales']);
    if (m.subtitulo) aoa.push([m.subtitulo]);
    aoa.push([`Generado ${new Date().toLocaleString('es')}`]);
    aoa.push([]);
    aoa.push(['Categoría', 'Descripción', 'SKU / Código', 'Cantidad', 'Precio unit.', 'Subtotal', 'Notas']);

    for (const f of filas) {
      aoa.push([
        f.cat || '',
        f.desc || '',
        f.sku || '',
        f.qty == null ? '' : f.qty,
        f.unit == null ? '' : f.unit,     // numérico: Excel puede sumar y formatear
        subtotal(f) == null ? '' : subtotal(f),
        f.nota || '',
      ]);
    }

    const faltaEquipoX = filas.some((f) => f.unit == null && /equipo|hardware|chasis/i.test(f.cat || ''));
    aoa.push([]);
    aoa.push(['', '', '', '', sinPrecio === 0 ? 'Total de referencia' : 'Total parcial', faltaEquipoX ? 'sin cotizar' : suma, '']);
    if (faltaEquipoX) {
      aoa.push(['', 'El equipo principal no tiene precio de lista publicado: la suma de los accesorios no representa el costo del BOM.']);
    } else if (sinPrecio > 0) {
      aoa.push(['', `${sinPrecio} linea(s) sin precio de lista publicado — no incluidas en el total.`]);
    }
    for (const n of (m.notas || [])) aoa.push(['', n]);

    const hoja = global.XLSX.utils.aoa_to_sheet(aoa);
    hoja['!cols'] = [{ wch: 14 }, { wch: 46 }, { wch: 26 }, { wch: 9 }, { wch: 14 }, { wch: 14 }, { wch: 52 }];
    const libro = global.XLSX.utils.book_new();
    global.XLSX.utils.book_append_sheet(libro, hoja, 'BOM');
    global.XLSX.writeFile(libro, nombreArchivo(m.archivo || m.titulo));
  }

  // Texto plano para pegar en un correo o un ticket. Se conserva porque sigue siendo la vía
  // más rápida de compartir un BOM sin adjuntar nada.
  function comoTexto(filas, meta) {
    const m = meta || {};
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

  function enviarACotizador(item) {
    try {
      const cola = JSON.parse(localStorage.getItem(ENTRADA) || '[]');
      cola.push({ modelo: item.modelo, qty: item.qty || 1, nota: item.nota || '', de: item.de || '' });
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

  global.BOM = { renderTabla, exportarExcel, comoTexto, money, esc,
    enviarACotizador, recogerEntrada, montarBotonCotizador, normalizar,
    sincronizar, soltarManual, avisoDesvio };
})(window);
