'use strict';

/* ══════════════════════════════════════════════
   CATALOG DATA — active products only (no EOL/EOS)
   EOL removed: ISR 4221/4331/4351/4431/4451/4461 (EoS Nov 2023)
                ASR 1001-X (EoS Ago 2022), ASR 1002-HX (EoS Mar 2025),
                ASR 1006-X (EoS Jul 2026)
   El criterio de que entra aqui lo aplica el servidor: toCotizadorCatalog() salta los
   Product con eol. Esta nota queda como registro de que se retiro y cuando.
   ══════════════════════════════════════════════ */
let CATALOG = [];

// Los filtros salen del propio catalogo, no de una lista escrita a mano. La lista fija se
// quedo en seis fabricantes: Aruba y MikroTik aparecian en el listado agrupado —porque eso
// si se construye con los datos— pero no tenian boton de filtro, asi que en un catalogo de
// 139 equipos no habia forma de acotar a ellos. Derivarla evita que el proximo fabricante
// vuelva a entrar a medias.
let activeVendor = 'Todos';
let bom = []; // {id, vendor, color, model, seg, spec, elp, elpN, qty, note}
let nextId = 1;

const $=id=>document.getElementById(id);
const esc=s=>String(s||'').replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));

/* ══ INIT ══ */
(async function init(){
  const res = await fetch('/api/cotizador/catalog');
  CATALOG = await res.json();
  const VENDORS = ['Todos', ...[...new Set(CATALOG.map(i => i.vendor))].sort((a, b) => a.localeCompare(b, 'es'))];
  // Set today's date
  $('quoteDate').value = new Date().toISOString().slice(0,10);
  // Render filter buttons
  $('filterRow').innerHTML = VENDORS.map(v=>`
    <button class="filter-btn${v===activeVendor?' on':''}" data-v="${v}">${v}</button>`).join('');
  $('filterRow').querySelectorAll('.filter-btn').forEach(b=>{
    b.addEventListener('click',()=>{
      activeVendor = b.dataset.v;
      $('filterRow').querySelectorAll('.filter-btn').forEach(x=>x.classList.toggle('on',x===b));
      renderCatalog();
    });
  });
  renderCatalog();

  // Equipos que llegan de un dimensionador. El dimensionador solo dice QUE equipo; el
  // precio, el fabricante y el texto salen de CATALOG, que es la fuente de verdad de esta
  // pantalla. Si el nombre no casa con nada se dice — no se inventa una linea.
  const entrantes = BOM.recogerEntrada();
  const noEncontrados = [];
  /* QUE CUENTA COMO «LA MISMA LINEA», EN UN SOLO SITIO (2026-09-18).
     Tres puntos de este archivo deciden si una linea que llega ya estaba: la ingesta de
     referencias, la de equipos y la fusion con el BOM restaurado. Los tres tenian su propia
     regla, y la de la fusion comparaba `model + vendor`. Eso valia cuando del dimensionador
     solo venia el equipo (`model` es el nombre unico de la caja), pero desde que viaja el BOM
     entero `model` de una referencia es el nombre COMERCIAL del bundle: «Enterprise
     Protection» es el mismo texto en un FortiGate 30G que en un 200G. Medido en Chromium:
     cotizar un 200G y despues un 30G fundia la licencia de $1.147,50 dentro de la de
     $21.205,80 y la dejaba en cantidad 2 — una cotizacion con un equipo que no tenia su
     licencia y otro con el doble de la que no era. La identidad de una referencia es su SKU,
     que es lo que se pide al distribuidor; la de un equipo, su fabricante y su modelo. */
  const identidadLinea = (l) => (l.refSku ? 'ref:' + l.refSku : 'eq:' + l.vendor + '|' + l.model);
  for(const e of entrantes){
    // Una REFERENCIA (bundle de soporte, licencia, accesorio) no esta en CATALOG y no puede
    // estarlo: son 6.849 solo de Fortinet frente a sus 54 equipos. Viaja con su SKU, su
    // descripcion y su precio, que salen de la misma price list que respalda los precios de
    // esta pantalla, y se marca como tal para que se vea de donde vino.
    if(e.ref){
      const r = e.ref;
      const clave = r.sku || r.d;
      const yaRef = bom.find(b2 => identidadLinea(b2) === 'ref:' + clave);
      if(yaRef){ yaRef.qty += (e.qty || 1); continue; }
      // El fabricante viaja con la referencia y su color sale de CATALOG. Fijarlos aqui
      // habria pintado de Fortinet una referencia de Aruba — un dato inventado, y de los que
      // no fallan: solo mienten.
      const vend = r.v || 'Referencia';
      const hermano = CATALOG.find(x => BOM.normalizar(x.vendor) === BOM.normalizar(vend));
      // `r.cat` solo lo traen las lineas calculadas por el dimensionador (A6, 2026-09-18):
      // una licencia se presenta como «Licencias FortiGuard» y no como «Referencia de
      // pedido», que es de donde venia este canal. Distingue tambien la nota, porque las dos
      // procedencias no son la misma cosa: una la calculo el motor, la otra la anadio alguien.
      // Sin hermano en CATALOG (Starlink) el nombre llega en minusculas, porque `bom.js` lo
      // guarda asi para separar las referencias por fabricante: se pinta con mayuscula inicial.
      bom.push({id: nextId++, vendor: hermano ? hermano.vendor : vend.charAt(0).toUpperCase() + vend.slice(1),
        color: hermano ? hermano.color : 'var(--steel)', model: r.d || r.sku,
        seg: r.cat || 'Referencia de pedido', spec: r.sku || '', refSku: clave,
        elp: r.p == null ? 'Consultar' : ('~ $' + Number(r.p).toLocaleString('en-US')),
        elpN: r.p == null ? 0 : r.p,
        qty: e.qty || 1,
        note: r.cat
          ? (e.de ? `Dimensionado en ${e.de}` : 'Calculada por el dimensionador')
          : (e.de ? `Añadida desde la ficha de ${e.de}` : 'Añadida desde la ficha del equipo')});
      continue;
    }
    const item = CATALOG.find(x => BOM.normalizar(x.model) === BOM.normalizar(e.modelo));
    if(!item){ noEncontrados.push(e.modelo); continue; }
    const ya = bom.find(b2 => identidadLinea(b2) === 'eq:' + item.vendor + '|' + item.model);
    if(ya){ ya.qty += (e.qty || 1); continue; }
    bom.push({id: nextId++, vendor: item.vendor, color: item.color, model: item.model,
      seg: item.seg, spec: item.spec, elp: item.elp, elpN: item.elpN,
      qty: e.qty || 1, note: e.de ? `Dimensionado en ${e.de}` : ''});
  }

  // Se restaura ANTES del primer renderBom para que la tabla salga ya con el trabajo previo.
  // Si llegaron equipos de un dimensionador, se suman a lo que ya hubiera guardado en vez
  // de sustituirlo: entrar desde el dimensionador no debe borrar el BOM en curso.
  //
  // LA FUSION SOLO CORRE SI DE VERDAD SE RESTAURO ALGO (2026-09-18). `restaurarBom()`
  // SUSTITUYE `bom` por lo guardado; cuando no hay nada guardado lo deja como estaba, o sea
  // siendo exactamente `traidos`. Sin esta guarda el bucle buscaba cada linea traida dentro
  // del array que ya la contenia, se encontraba a SI MISMA y hacia `ya.qty += t.qty`: toda
  // cotizacion empezada desde un dimensionador salia al DOBLE. Medido en Chromium ese dia
  // con un FortiGate 200G: llegaba con cantidad 2 y $22.954 en vez de $11.477. Es el modo de
  // fallo peor de este repositorio — no falla, miente, y encima en la cifra que se pone
  // delante de un cliente.
  const traidos = bom.slice();
  const guardado = restaurarBom();
  if(guardado){
    for(const t of traidos){
      const ya = bom.find(b2 => identidadLinea(b2) === identidadLinea(t));
      if(ya) ya.qty += t.qty; else { t.id = nextId++; bom.push(t); }
    }
  }
  renderBom();
  if(guardado){
    const host = document.getElementById('bomAviso') || $('sumVendors') && $('sumVendors').closest('section');
    const p = document.createElement('p');
    p.className = 'hint';
    p.style.cssText = 'margin:10px 0 0;display:flex;gap:10px;align-items:center;flex-wrap:wrap';
    const cuando = typeof guardado === 'string'
      ? new Date(guardado).toLocaleString('es', {day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit'})
      : null;
    p.innerHTML = `<span>Se recuperaron <b>${bom.length}</b> línea(s) de tu cotización anterior${cuando ? ` (${cuando})` : ''}.</span>`;
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'btn ghost'; b.textContent = 'Empezar una nueva';
    b.style.cssText = 'font-size:11px;padding:4px 10px';
    b.addEventListener('click', () => { vaciarBom(); p.remove(); });
    p.appendChild(b);
    if(host) host.appendChild(p);
  }

  if(entrantes.length || noEncontrados.length){
    const host = $('sumVendors') && $('sumVendors').closest('section');
    const av = document.createElement('p');
    av.className = 'hint';
    av.style.cssText = 'margin:10px 0 0';
    const ok = entrantes.length - noEncontrados.length;
    av.innerHTML = (ok ? `Se añadió <b>${ok}</b> equipo(s) desde el dimensionador. ` : '')
      + (noEncontrados.length
        ? `<span class="warn">No está en el catálogo del cotizador: <b>${noEncontrados.map(esc).join(', ')}</b>.</span> `
          + 'La causa más probable es que esté <b>fuera de venta</b>: el cotizador solo lista lo vigente, '
          + 'mientras que el dimensionador sí lo muestra como referencia para ampliar un parque instalado. '
          + 'Si el diseño es nuevo, elige el sucesor; si es una ampliación, añádelo a mano.'
        : '');
    if(host) host.appendChild(av);
  }
})();

/* ══ CATALOG ══ */
function renderCatalog(){
  const q = ($('searchBox').value||'').toLowerCase();
  const items = CATALOG.filter(item=>{
    const vOk = activeVendor==='Todos' || item.vendor===activeVendor;
    const sOk = !q || item.model.toLowerCase().includes(q) || item.seg.toLowerCase().includes(q) || item.vendor.toLowerCase().includes(q);
    return vOk && sOk;
  });

  // Group by vendor
  const groups = {};
  items.forEach(item=>{ (groups[item.vendor]=groups[item.vendor]||[]).push(item); });

  $('catalogList').innerHTML = Object.keys(groups).map(vendor=>`
    <div class="cat-group">
      <div class="cat-group-head">${vendor}</div>
      ${groups[vendor].map((item,i)=>`
        <div class="cat-item" data-idx="${CATALOG.indexOf(item)}">
          <div class="cat-badge" style="background:${item.color}">${item.vendor.slice(0,2).toUpperCase()}</div>
          <div class="cat-info">
            <div class="cat-model">${esc(item.model)}</div>
            <div class="cat-seg">${esc(item.seg)}</div>
            <div class="cat-elp">${item.elp}</div>
          </div>
          <button class="cat-add" data-idx="${CATALOG.indexOf(item)}">+ Agregar</button>
        </div>`).join('')}
    </div>`).join('');

  $('catalogList').querySelectorAll('.cat-add, .cat-item').forEach(el=>{
    el.addEventListener('click', e=>{
      e.stopPropagation();
      const idx = parseInt(el.closest('[data-idx]').dataset.idx);
      addItem(CATALOG[idx]);
    });
  });
}

/* ══ ADD / REMOVE ══ */
function addItem(item){
  // Check if already in BOM and increment qty instead
  const existing = bom.find(b=>b.model===item.model && b.vendor===item.vendor);
  if(existing){ existing.qty++; renderBom(); return; }
  bom.push({id:nextId++, vendor:item.vendor, color:item.color, model:item.model,
            seg:item.seg, spec:item.spec, elp:item.elp, elpN:item.elpN, qty:1, note:''});
  renderBom();
}

function addCustomItem(){
  bom.push({id:nextId++, vendor:'—', color:'#5C6E85', model:'Ítem personalizado', seg:'—', spec:'Editar en campo Nota', elp:'—', elpN:0, qty:1, note:''});
  renderBom();
}

function removeItem(id){ bom = bom.filter(b=>b.id!==id); renderBom(); }
function setQty(id, delta){
  const item = bom.find(b=>b.id===id);
  if(!item) return;
  item.qty = Math.max(1, item.qty+delta);
  renderBom();
}
function setNote(id, val){ const item=bom.find(b=>b.id===id); if(item) item.note=val; }

function clearQuote(){
  if(bom.length && !confirm('¿Limpiar el BOM completo?')) return;
  bom=[]; renderBom();
}

/* ══ RENDER BOM ══ */
/* ══ EL BOM SOBREVIVE A UNA RECARGA ══
   Medido antes de escribir esto: se anadian equipos, se recargaba la pagina y el BOM volvia
   a cero. En una herramienta de cotizacion eso es perder trabajo por un F5 o por un cierre
   accidental de pestana. Se guarda en el navegador —no en el servidor— porque un BOM a medias
   es un borrador personal, no un documento compartido: subirlo al servidor obligaria a
   decidir de quien es, quien lo ve y cuando caduca, que es otro proyecto. */
const BOM_CLAVE = 'presales:cotizador:bom';

function guardarBom(){
  try{
    localStorage.setItem(BOM_CLAVE, JSON.stringify({
      bom, nextId,
      cliente: $('quoteClient') ? $('quoteClient').value : '',
      fecha: $('quoteDate') ? $('quoteDate').value : '',
      guardado: new Date().toISOString(),
    }));
  }catch{ /* sin espacio o almacenamiento deshabilitado: no es motivo para romper la pagina */ }
}

function restaurarBom(){
  let d;
  try{ d = JSON.parse(localStorage.getItem(BOM_CLAVE) || 'null'); }catch{ return null; }
  if(!d || !Array.isArray(d.bom) || !d.bom.length) return null;
  bom = d.bom;
  // nextId tiene que quedar por encima de todos los ids restaurados o dos lineas distintas
  // compartirian id y borrar una borraria la otra.
  nextId = Math.max(d.nextId || 0, ...bom.map(x => (x.id || 0) + 1), 1);
  if(d.cliente && $('quoteClient')) $('quoteClient').value = d.cliente;
  return d.guardado || true;
}

function vaciarBom(){
  bom = [];
  try{ localStorage.removeItem(BOM_CLAVE); }catch{ /* ignorado */ }
  renderBom();
}

function renderBom(){
  guardarBom();
  const empty = bom.length===0;
  $('emptyState').style.display = empty ? 'flex' : 'none';
  $('tableWrap').style.display = empty ? 'none' : 'block';
  $('summaryBar').style.display = empty ? 'none' : 'flex';

  if(!empty){
    $('bomBody').innerHTML = bom.map(item=>`
      <tr data-id="${item.id}">
        <td><div class="td-vendor"><span class="v-dot" style="background:${item.color}"></span>${esc(item.vendor)}</div></td>
        <td><div class="td-model">${esc(item.model)}</div></td>
        <td><div class="td-seg">${esc(item.seg)}</div></td>
        <td><div class="td-spec">${esc(item.spec)}</div></td>
        <td class="td-elp">${esc(item.elp)}</td>
        <td>
          <div class="qty-ctrl">
            <button class="qty-btn" data-act="dec" data-id="${item.id}">−</button>
            <span class="qty-val">${item.qty}</span>
            <button class="qty-btn" data-act="inc" data-id="${item.id}">+</button>
          </div>
        </td>
        <td class="td-total">${item.elpN>0 ? fmtUSD(item.elpN*item.qty) : '—'}</td>
        <td><input type="text" class="notes-input" data-id="${item.id}" placeholder="Nota…" value="${esc(item.note)}"></td>
        <td><button class="del-btn" data-id="${item.id}" title="Eliminar">&#10005;</button></td>
      </tr>`).join('');

    // Event listeners
    $('bomBody').querySelectorAll('.qty-btn').forEach(btn=>{
      btn.addEventListener('click',()=>{ setQty(+btn.dataset.id, btn.dataset.act==='inc'?1:-1); });
    });
    $('bomBody').querySelectorAll('.del-btn').forEach(btn=>{
      btn.addEventListener('click',()=>removeItem(+btn.dataset.id));
    });
    $('bomBody').querySelectorAll('.notes-input').forEach(inp=>{
      inp.addEventListener('input',()=>setNote(+inp.dataset.id, inp.value));
    });
  }
  renderSummary();
}

function fmtUSD(n){ return '~ $'+n.toLocaleString('en-US'); }

function renderSummary(){
  if(bom.length===0) return;
  const lines = bom.length;
  const units = bom.reduce((s,b)=>s+b.qty, 0);
  const total = bom.reduce((s,b)=>s+(b.elpN*b.qty),0);
  const vendors = [...new Set(bom.map(b=>b.vendor).filter(v=>v!=='—'))];
  $('sumLines').textContent = lines;
  $('sumUnits').textContent = units;
  $('sumTotal').textContent = total>0 ? fmtUSD(total) : '—';
  $('sumVendors').textContent = vendors.length ? vendors.join(' · ') : '—';
}

/* ══ EXPORT CSV ══ */
function exportCSV(){
  if(!bom.length){ alert('El BOM está vacío.'); return; }
  const proj = $('quoteTitle').value || 'Proyecto';
  const client = $('quoteClient').value || '';
  const date = $('quoteDate').value || '';
  const owner = $('quoteOwner').value || '';

  const rows = [
    ['PRESALES — BOM Multi-fabricante'],
    ['Proyecto','Cliente','Fecha','Responsable'],
    [proj, client, date, owner],
    [],
    ['Fabricante','Modelo','Segmento / Rol','Especificaciones','Precio ref. USD','Cantidad','Total ref. USD','Nota'],
    ...bom.map(item=>[
      item.vendor, item.model, item.seg, item.spec,
      item.elp, item.qty,
      item.elpN>0?'~ $'+(item.elpN*item.qty).toLocaleString('en-US'):'—',
      item.note
    ]),
    [],
    ['DISCLAIMER','Precios de lista estimados (referencias públicas de mercado). No incluyen descuentos de canal IVA licencias ni soporte. Verificar con distribuidor autorizado de cada fabricante.'],
  ];

  const csv = rows.map(r=>r.map(c=>'"'+String(c||'').replace(/"/g,'""')+'"').join(',')).join('\r\n');
  const blob = new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const d = date || new Date().toISOString().slice(0,10);
  a.href=url; a.download=`bom-presales-${proj.replace(/\s+/g,'-').toLowerCase()}-${d}.csv`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ══════ ENLACE DE EVENTOS ══════
   Movidos desde onclick=/oninput= en el HTML para permitir una CSP con script-src 'self',
   que bloquea todo codigo en linea. */
document.addEventListener('click', (e) => {
  const id = e.target.closest('button,[id]')?.id;
  if (id === 'btnLimpiar') clearQuote();
  else if (id === 'btnCsv') exportCSV();
  else if (id === 'btnLineaLibre') addCustomItem();
  else if (id === 'btnImprimir') window.print();

  const abrir = e.target.closest('[data-abrir]');
  if (abrir) window.open(abrir.dataset.abrir, '_blank');
});

document.addEventListener('input', (e) => {
  const fn = e.target.dataset && e.target.dataset.oninput;
  if (fn === 'renderCatalog') renderCatalog();
  else if (fn === 'renderSummary') renderSummary();
});
