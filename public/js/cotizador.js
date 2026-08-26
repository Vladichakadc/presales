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
  renderBom();
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
function renderBom(){
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
