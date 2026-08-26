'use strict';
/* ═══════════════════════════════════════════
   DATA
   ═══════════════════════════════════════════ */
const VENDORS=[
  {id:'huawei',name:'Huawei',accent:'#C7000B',icon:'HW',iconCls:'hw',
   desc:'Routers AR SD-WAN, plataformas A800 E y core NE8000. iMaster NCE, SRv6, FlexE, slicing de red.',
   series:['AR610','AR650','AR5710-S','AR5710-SE','AR6700-L','AR6700','AR8700','A800 E','NE8000 M','NE8000 F','NE8000 X'],
   tools:['Dimensionador BOM','Catálogo ópticas'],live:true},
  {id:'cisco',name:'Cisco',accent:'#049FD9',icon:'CS',iconCls:'cs',
   desc:'ISR 1000/4000, ASR 1000, Catalyst 8000. SD-WAN Viptela, Meraki, DNA Center automación.',
   series:['ISR 1000','ISR 4000','ASR 1000','Catalyst 8200','Catalyst 8300','Catalyst 8500'],
   tools:['Catálogo de equipos','Guía de selección'],live:false},
  {id:'nokia',name:'Nokia',accent:'#124191',icon:'NK',iconCls:'nk',
   desc:'7750 SR core/edge, 7210 SAS acceso, 7250 IXR datacenter. SR OS con SR-MPLS, SRv6, EVPN.',
   series:['7750 SR-s','7750 SR-1','7750 SR-7/12/14','7210 SAS','7250 IXR'],
   tools:['Catálogo de equipos'],live:false},
  {id:'fortinet',name:'Fortinet',accent:'#EE3124',icon:'FT',iconCls:'ft',
   desc:'FortiGate NGFW con SD-WAN integrado. Desde 40F hasta 7000. Security Fabric y FortiOS.',
   series:['40F–80F','100F–200F','400F–900F','1000F–3000F','4400F–7000F'],
   tools:['Catálogo de equipos','Sizing NGFW'],live:false},
  {id:'juniper',name:'Juniper',accent:'#84B135',icon:'JN',iconCls:'jn',
   desc:'MX edge/core, SRX NGFW, EX/QFX switching. Junos OS, Mist AI, Apstra intent-based networking.',
   series:['SRX 300','SRX 1500','SRX 4000','MX 204/304','MX 480/960','QFX 5000/10000'],
   tools:['Catálogo de equipos'],live:false},
  {id:'mikrotik',name:'MikroTik',accent:'#C8102E',icon:'MT',iconCls:'mt',
   desc:'RouterOS v7: WireGuard, IPsec, BGP, MPLS, CAPsMAN. hEX SOHO → CCR2216 Core 100G. Precio-rendimiento líder.',
   series:['hEX','RB4011','RB5009','CCR2004','CCR2116','CCR2216','CHR'],
   tools:['Catálogo de equipos','RouterOS Features'],live:true},
  {id:'aruba',name:'Aruba',accent:'#01A982',icon:'AB',iconCls:'ab',
   desc:'HPE Aruba Networking: EdgeConnect SD-WAN con Boost (optimización WAN en bloques de 100 Mbps agrupados como pool del fabric), gateways SD-Branch serie 9000 y campus serie 9200 con capacidad escalable por licencia.',
   series:['EdgeConnect EC-XS/S/M','EdgeConnect EC-L/XL','EC-V virtual','Serie 9000 SD-Branch','Serie 9200 campus'],
   tools:['Dimensionador y BOM','Guía de licencias'],live:true}
];

let PR = {};

/* ═══════ UNIFIED DEVICE LIST ═══════ */
const ALL=[];
function parseCap(s){
  if(!s) return 0;
  if(typeof s==='number') return s;
  const n=parseFloat(s.replace(/[^0-9.]/g,''));
  if(s.includes('Tbps')) return n*1e6;
  if(s.includes('Gbps')) return n*1000;
  return n;
}
function parseRange(s){
  if(!s) return 0;
  if(typeof s==='number') return s;
  const parts=String(s).split(/[–\-]/);
  const last=parts[parts.length-1];
  const n=parseFloat(last.replace(/[^0-9.]/g,''));
  if(s.includes('Tbps')) return n*1e6;
  if(s.includes('Gbps')) return n*1000;
  if(s.includes('Mbps')) return n;
  return n;
}
function fmtMbps(m){
  if(!m) return '—';
  if(m>=1e6) return (m/1e6).toFixed(m%1e6?1:0).replace(/\.0$/,'')+' Tbps';
  if(m>=1000) return (m/1000).toFixed(m%1000?1:0)+' Gbps';
  return Math.round(m)+' Mbps';
}
const esc=s=>String(s).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));

function buildAll(){
  PR.hw_ar.forEach(p=>ALL.push({vendor:'Huawei',model:p.model,series:p.ser,seg:p.seg,
    tp:p.fwd||0,tpL:fmtMbps(p.fwd),ipsec:p.ipsec||0,ipsecL:p.ipsec?fmtMbps(p.ipsec):'—',
    sdwan:p.sdwan,ports:p.ports,color:'#C7000B'}));
  PR.hw_wan.forEach(p=>ALL.push({vendor:'Huawei',model:p.model,series:p.ser,seg:p.seg,
    tp:parseCap(p.cap),tpL:p.cap,ipsec:0,ipsecL:'N/A',sdwan:'N/A',ports:p.ports,color:'#C7000B'}));
  PR.cisco.forEach(p=>ALL.push({vendor:'Cisco',model:p.model,series:p.ser,seg:p.seg,
    tp:parseRange(p.fwd),tpL:p.fwd,ipsec:parseRange(p.ipsec),ipsecL:p.ipsec,
    sdwan:p.sdwan,ports:p.ports,color:'#049FD9'}));
  PR.nokia.forEach(p=>ALL.push({vendor:'Nokia',model:p.model,series:p.ser,seg:p.seg,
    tp:parseCap(p.cap),tpL:p.cap,ipsec:0,ipsecL:'N/A (SP)',sdwan:'N/A',ports:p.ports,color:'#124191'}));
  PR.fortinet.forEach(p=>ALL.push({vendor:'Fortinet',model:p.model,series:p.model.match(/\d+/)?p.model.replace(/FortiGate\s+(\d+\w+).*/,'$1 series'):'Fortinet',seg:p.seg,
    tp:parseRange(p.fw),tpL:'FW: '+p.fw,ipsec:parseRange(p.vpn),ipsecL:p.vpn,
    sdwan:'Sí (FortiOS nativo)',ports:p.ifaces,color:'#EE3124'}));
  PR.juniper.forEach(p=>ALL.push({vendor:'Juniper',model:p.model,series:p.ser,seg:p.seg,
    tp:parseCap(p.cap),tpL:p.cap,ipsec:0,ipsecL:'—',
    sdwan:p.use.includes('SD-WAN')?'Sí':'—',ports:p.ports,color:'#84B135'}));
  (PR.mikrotik||[]).forEach(p=>ALL.push({vendor:'MikroTik',model:p.model,series:p.ser,seg:p.seg,
    tp:p.fwd||0,tpL:fmtMbps(p.fwd),ipsec:p.ipsec||0,ipsecL:p.ipsec?fmtMbps(p.ipsec):'—',
    sdwan:p.sdwan,ports:p.ports,color:'#C8102E'}));
  (PR.aruba||[]).forEach(p=>ALL.push({vendor:'Aruba',model:p.model,series:p.ser,seg:p.seg,
    tp:p.fwd||0,tpL:fmtMbps(p.fwd),ipsec:p.ipsec||0,ipsecL:p.ipsec?fmtMbps(p.ipsec):'—',
    sdwan:p.sdwan,ports:p.ports,color:'#01A982'}));
}

/* ═══════ NAV ═══════ */
function go(page){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));
  const el=document.getElementById('page-'+page);
  if(el) el.classList.add('active');
  const btn=document.querySelector(`.nav-btn[data-page="${page}"]`);
  if(btn) btn.classList.add('active');
  document.getElementById('sidebar').classList.remove('open');
  window.scrollTo(0,0);
}

/* ═══════ RENDER DASHBOARD ═══════ */

function switchTab(vendor, tabId) {
  document.querySelectorAll('#page-'+vendor+' .tab-btn').forEach(b=>b.classList.remove('active'));
  document.querySelectorAll('#page-'+vendor+' .tab-content').forEach(c=>c.classList.remove('active'));
  document.querySelector('#page-'+vendor+' .btn-'+tabId).classList.add('active');
  document.getElementById('tab-'+tabId+'-'+vendor).classList.add('active');
}

function renderDash(){
  document.getElementById('dashGrid').innerHTML=VENDORS.map(v=>{
    const n=v.id==='huawei'
      ?PR.hw_ar.length+PR.hw_wan.length
      :(PR[v.id]||[]).length; // mikrotik → PR.mikrotik.length
    return `<div class="vendor-card" data-ir="${v.id}">
      <div class="card-accent" style="background:${v.accent}"></div>
      <div class="card-body">
        <div class="card-brand">
          <div class="card-icon" style="background:${v.accent}">${v.icon}</div>
          <div class="card-name">${v.name}</div>
        </div>
        <div class="card-desc">${v.desc}</div>
        <div class="card-stats">
          <div class="stat"><b>${n}</b>Equipos</div>
          <div class="stat"><b>${v.series.length}</b>Series</div>
          <div class="stat"><b>${v.tools.length}</b>Herram.</div>
        </div>
      </div>
      <div class="card-tools">
        ${v.tools.map(t=>`<span class="t-pill${v.live?' live':''}">${t}</span>`).join('')}
      </div>
    </div>`;
  }).join('');
}

/* ═══════ RENDER TABLES ═══════ */
function renderTables(){
  const q=(id,rows)=>document.querySelector('#'+id+' tbody').innerHTML=rows;

  q('tbl-hw-ar',PR.hw_ar.map(p=>`<tr>
    <td><code>${esc(p.model)}</code></td><td>${p.ser}</td><td>${p.seg}</td>
    <td class="n">${fmtMbps(p.fwd)}</td><td class="n">${p.ipsec?fmtMbps(p.ipsec):'—'}</td>
    <td class="n">${p.sdwan}</td><td class="n">${p.lan}</td><td>${p.ports}</td>
  </tr>`).join(''));

  q('tbl-hw-wan',PR.hw_wan.map(p=>`<tr>
    <td><code>${esc(p.model)}</code></td><td>${p.ser}</td><td>${p.seg}</td>
    <td class="n">${p.cap}</td><td class="n">${p.mpps}</td><td>${p.ports}</td>
  </tr>`).join(''));

  q('tbl-cisco',PR.cisco.map(p=>`<tr>
    <td><code>${esc(p.model)}</code></td><td>${p.ser}</td><td>${p.seg}</td>
    <td class="n">${p.fwd}</td><td class="n">${p.ipsec}</td><td>${p.ports}</td><td>${p.sdwan}</td>
    <td class="n" style="color:var(--amber);white-space:nowrap">${p.elp||'—'}</td>
  </tr>`).join(''));

  q('tbl-nokia',PR.nokia.map(p=>`<tr>
    <td><code>${esc(p.model)}</code></td><td>${p.ser}</td><td>${p.seg}</td>
    <td class="n">${p.cap}</td><td>${p.ports}</td><td>${p.protos}</td>
  </tr>`).join(''));

  q('tbl-fortinet',PR.fortinet.map(p=>`<tr>
    <td><code>${esc(p.model)}</code></td><td>${p.seg}</td>
    <td class="n">${p.fw}</td><td class="n">${p.ips}</td><td class="n">${p.ngfw}</td>
    <td class="n">${p.vpn}</td><td>${p.ifaces}</td>
    <td class="n" style="color:var(--amber);white-space:nowrap">${p.elp||'—'}</td>
  </tr>`).join(''));

  q('tbl-juniper',PR.juniper.map(p=>`<tr>
    <td><code>${esc(p.model)}</code></td><td>${p.ser}</td><td>${p.seg}</td>
    <td class="n">${p.cap}</td><td>${p.ports}</td><td>${p.use}</td>
  </tr>`).join(''));

  if(PR.mikrotik&&document.querySelector('#tbl-mikrotik tbody')){
    q('tbl-mikrotik',(PR.mikrotik||[]).map(p=>`<tr>
      <td><code>${esc(p.model)}</code></td><td>${p.ser}</td><td>${p.seg}</td>
      <td class="n">${fmtMbps(p.fwd)}</td><td class="n">${p.ipsec?fmtMbps(p.ipsec):'—'}</td>
      <td>${p.sdwan}</td><td>${p.ports}</td>
      <td class="n" style="color:var(--amber);white-space:nowrap">${p.elp||'—'}</td>
    </tr>`).join(''));
  }

  if(PR.aruba&&document.querySelector('#tbl-aruba tbody')){
    q('tbl-aruba',(PR.aruba||[]).map(p=>`<tr>
      <td><code>${esc(p.model)}</code></td><td>${p.ser}</td><td>${p.seg}</td>
      <td class="n">${fmtMbps(p.fwd)}</td><td class="n">${p.ipsec?fmtMbps(p.ipsec):'—'}</td>
      <td>${p.sdwan}</td><td>${p.ports}</td>
      <td class="n" style="color:var(--amber);white-space:nowrap">${p.elp||'—'}</td>
    </tr>`).join(''));
  }
}

/* ═══════ COMPARATOR ═══════ */
function populateCmp(){
  const base='<option value="">— Ninguno —</option>';
  const opts=VENDORS.map(v=>{
    const devs=ALL.filter(d=>d.vendor===v.name);
    return `<optgroup label="${v.name}">`+
      devs.map((d,i)=>`<option value="${v.id}_${i}">${esc(d.model)} — ${d.seg}</option>`).join('')+
      '</optgroup>';
  }).join('');
  ['cmp1','cmp2','cmp3','cmp4'].forEach((id,i)=>{
    document.getElementById(id).innerHTML=(i<2?'<option value="">— Seleccionar —</option>':base)+opts;
  });
}

function runCompare(){
  const ids=['cmp1','cmp2','cmp3','cmp4']
    .map(id=>document.getElementById(id).value).filter(Boolean);
  if(ids.length<2){alert('Selecciona al menos 2 equipos.');return;}
  const devs=ids.map(id=>{
    const[vid,idx]=id.split('_');
    return ALL.filter(d=>d.vendor===VENDORS.find(v=>v.id===vid).name)[+idx];
  }).filter(Boolean);
  document.getElementById('compareOut').innerHTML=devs.map(d=>`
    <div class="compare-col">
      <div class="col-head" style="background:${d.color}">${d.vendor} &middot; ${esc(d.model)}</div>
      <div class="col-body">
        <div class="col-row"><span class="lbl">Serie</span><span class="val">${d.series||'—'}</span></div>
        <div class="col-row"><span class="lbl">Segmento</span><span class="val">${d.seg}</span></div>
        <div class="col-row"><span class="lbl">Throughput</span><span class="val">${d.tpL}</span></div>
        <div class="col-row"><span class="lbl">IPsec</span><span class="val">${d.ipsecL}</span></div>
        <div class="col-row"><span class="lbl">SD-WAN</span><span class="val">${d.sdwan}</span></div>
        <div class="col-row"><span class="lbl">Puertos</span><span class="val">${d.ports}</span></div>
      </div>
    </div>`).join('');
}

/* ═══════ CALCULATOR ═══════ */
function runCalc(){
  const bw=parseFloat(document.getElementById('calcBw').value)||0;
  const unit=parseFloat(document.getElementById('calcUnit').value);
  const profile=document.getElementById('calcProfile').value;
  const margin=(parseFloat(document.getElementById('calcMargin').value)||0)/100;
  const dir=parseFloat(document.getElementById('calcDir').value);
  const needMbps=bw*unit*dir*(1+margin);

  const profileLabel={fwd:'Forwarding (NAT+ACL+QoS)',ipsec:'IPsec VPN',sdwan:'SD-WAN / NGFW'}[profile];

  const candidates=ALL.filter(d=>{
    const cap=profile==='ipsec'&&d.ipsec>0?d.ipsec:d.tp;
    return cap>=needMbps;
  }).sort((a,b)=>{
    const ca=profile==='ipsec'&&a.ipsec>0?a.ipsec:a.tp;
    const cb=profile==='ipsec'&&b.ipsec>0?b.ipsec:b.tp;
    return ca-cb;
  });

  const byVendor={};
  candidates.forEach(d=>{ if(!byVendor[d.vendor]) byVendor[d.vendor]=[]; byVendor[d.vendor].push(d); });

  let html=`<div class="calc-result">
    <p class="tag">Requerimiento calculado</p>
    <div class="big-num">${fmtMbps(needMbps)}</div>
    <p style="color:var(--steel);font-size:13px;margin:4px 0 0">
      ${fmtMbps(bw*unit)} &times; ${dir===2?'bidireccional (&times;2)':'agregado'} + ${Math.round(margin*100)}% margen · Perfil: ${profileLabel}
    </p>
  </div>`;

  if(!Object.keys(byVendor).length){
    html+='<div class="panel" style="margin-top:16px"><p style="color:var(--amber);font-weight:600">No se encontraron equipos que cumplan este requerimiento en el catálogo actual.</p></div>';
  }else{
    html+='<div style="margin-top:16px">';
    ['Huawei','Cisco','Fortinet','Nokia','Juniper','MikroTik','Aruba'].forEach(vName=>{
      const devs=byVendor[vName]; if(!devs||!devs.length) return;
      const best=devs[0];
      const alts=devs.slice(1,4).map(d=>d.model).join(', ');
      const v=VENDORS.find(x=>x.name===vName);
      html+=`<div class="panel">
        <h2><span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:${v.accent};margin-right:8px;vertical-align:2px"></span>${vName} — Opción recomendada
          <span class="badge live">Cumple</span>
        </h2>
        <div style="display:flex;align-items:baseline;gap:12px;flex-wrap:wrap;margin-bottom:8px">
          <span style="font-family:'Barlow Condensed',sans-serif;font-weight:700;font-size:22px;text-transform:uppercase">${esc(best.model)}</span>
          <span style="color:var(--steel);font-size:13px">${best.series||''} · ${best.seg}</span>
        </div>
        <div style="font-size:13px;margin-bottom:4px">
          <b>Throughput:</b> ${best.tpL} &nbsp;·&nbsp; <b>IPsec:</b> ${best.ipsecL} &nbsp;·&nbsp; <b>SD-WAN:</b> ${best.sdwan}
        </div>
        <div style="font-size:12px;color:var(--steel)">${best.ports}</div>
        ${alts?`<p style="font-size:11.5px;color:var(--steel);margin-top:10px;border-top:1px solid var(--rule);padding-top:8px"><b>Alternativas:</b> ${alts}</p>`:''}
      </div>`;
    });
    html+='</div>';
  }
  document.getElementById('calcOut').innerHTML=html;
  document.getElementById('csvBtn').style.display=Object.keys(byVendor).length?'block':'none';
}


/* ═══════ EXPORT CSV ═══════ */
function exportCSV(){
  const rows=[['Fabricante','Modelo','Serie','Segmento','Throughput','IPsec','SD-WAN','Puertos']];
  // collect visible results from calcOut panels
  const panels=document.querySelectorAll('#calcOut .panel');
  panels.forEach(p=>{
    const header=p.querySelector('h2');
    if(!header) return;
    // extract vendor name from h2 — matches "Huawei —", "Cisco —", etc.
    const vendor=(header.textContent.match(/^([A-Za-z]+)/)||['','?'])[1];
    // find model name in bold span
    const modelEl=p.querySelector('span[style*="Barlow Condensed"]');
    const model=modelEl?modelEl.textContent.trim():'';
    const lines=p.querySelectorAll('div[style*="font-size:13px"]');
    let tp='',ipsec='',sdwan='',ports='';
    lines.forEach(l=>{
      const t=l.textContent;
      if(t.includes('Throughput:')) tp=t.split('Throughput:')[1].split('·')[0].trim();
      if(t.includes('IPsec:')) ipsec=t.split('IPsec:')[1].split('·')[0].trim();
      if(t.includes('SD-WAN:')) sdwan=t.split('SD-WAN:')[1].split('·')[0].trim();
    });
    const portsEl=p.querySelector('div[style*="font-size:12px"]');
    if(portsEl) ports=portsEl.textContent.trim();
    const serEl=p.querySelector('span[style*="color:var(--steel)"]');
    const serText=serEl?serEl.textContent.trim():'';
    const ser=serText.split('·')[0].trim();
    const seg=serText.includes('·')?serText.split('·').slice(1).join('·').trim():'';
    if(model) rows.push([vendor,model,ser,seg,tp,ipsec,sdwan,ports]);
  });
  if(rows.length<2){alert('Calcula primero para tener datos que exportar.');return;}
  const csv=rows.map(r=>r.map(c=>'"'+String(c).replace(/"/g,'""')+'"').join(',')).join('\r\n');
  const blob=new Blob(['﻿'+csv],{type:'text/csv;charset=utf-8;'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  const d=new Date();
  const ds=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  a.href=url;a.download='presales-recomendacion-'+ds+'.csv';
  document.body.appendChild(a);a.click();document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
/* ═══════ GLOBAL SEARCH ═══════ */
function globalFilter(q){
  if(!q||q.length<2) return;
  q=q.toLowerCase();
  const match=ALL.find(d=>
    d.model.toLowerCase().includes(q)||
    (d.series||'').toLowerCase().includes(q)||
    d.vendor.toLowerCase().includes(q)||
    d.seg.toLowerCase().includes(q)
  );
  if(match){const v=VENDORS.find(x=>x.name===match.vendor);if(v) go(v.id);}
}
/* ═══════ AI SYNC ═══════ */
let pendingChanges = [];

function escapeHtml(v) {
  return String(v ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}

function openSyncModal() {
  document.getElementById('syncModal').style.display = 'flex';
  document.getElementById('syncResult').innerHTML = '<p>Selecciona un fabricante y haz clic en Analizar.</p>';
}

function closeSyncModal() {
  document.getElementById('syncModal').style.display = 'none';
  pendingChanges = [];
}

async function analyzeSync() {
  const vendor = document.getElementById('syncVendor').value;
  const fileInput = document.getElementById('syncFile');
  const resultDiv = document.getElementById('syncResult');
  const btn = document.getElementById('btnApplySync');
  
  resultDiv.innerHTML = '<p>Analizando catálogo con IA (esto puede tardar unos segundos o minutos si el archivo es grande)...</p>';
  btn.style.display = 'none';
  
  try {
    const formData = new FormData();
    formData.append('vendor', vendor);
    if (fileInput.files.length > 0) {
      formData.append('datasheet', fileInput.files[0]);
    }

    const res = await fetch('/api/sync/analyze', {
      method: 'POST',
      body: formData
    });
    
    // Se lee el mensaje del servidor en vez de mostrar un error genérico: en producción
    // esta ruta responde 503 explicando que la sincronización se ejecuta en local.
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Error en el servidor');
    }
    const data = await res.json();
    pendingChanges = data.changes;
    
    if (pendingChanges.length === 0) {
      resultDiv.innerHTML = '<p>El catálogo parece estar actualizado. No se encontraron discrepancias obvias.</p>';
      return;
    }
    
    const TARGET_LABELS = { product: 'Equipo', license: 'Licencia', supportTier: 'Soporte', part: 'SKU' };
    let html = '<table class="diff-table"><tr><th>Categoría</th><th>Tipo</th><th>Modelo</th><th>Campo</th><th>Valor Anterior</th><th>Valor Nuevo Propuesto</th><th>Razón</th><th>Fuente</th></tr>';
    pendingChanges.forEach(c => {
      const typeBadge = c.type === 'NEW'
        ? '<span style="background:var(--green);color:#fff;padding:2px 6px;border-radius:3px;font-size:11px">NUEVO</span>'
        : '<span style="background:var(--steel);color:#fff;padding:2px 6px;border-radius:3px;font-size:11px">UPDATE</span>';
      const targetLabel = TARGET_LABELS[c.target] || TARGET_LABELS.product;

      // c.* viene del modelo de IA (que puede haber leído un datasheet subido por el usuario) — nunca confiar, siempre escapar antes de insertar en el DOM
      const isSafeUrl = typeof c.sourceUrl === 'string' && /^https?:\/\//i.test(c.sourceUrl);
      const sourceLink = isSafeUrl ? `<a href="${escapeHtml(c.sourceUrl)}" target="_blank" rel="noopener noreferrer" style="color:var(--red);text-decoration:underline">Enlace</a>` : 'N/A';

      html += `<tr>
        <td>${escapeHtml(targetLabel)}</td>
        <td>${typeBadge}</td>
        <td><strong>${escapeHtml(c.id)}</strong></td>
        <td>${escapeHtml(c.field)}</td>
        <td class="diff-old">${escapeHtml(c.oldValue)}</td>
        <td class="diff-new">${escapeHtml(c.newValue)}</td>
        <td>${escapeHtml(c.reason)}</td>
        <td>${sourceLink}</td>
      </tr>`;
    });
    html += '</table>';
    
    resultDiv.innerHTML = html;
    btn.style.display = 'inline-block';
  } catch (err) {
    // Se escapa con el helper que ya usa esta pagina: el mensaje puede venir del servidor,
    // y concatenarlo crudo en innerHTML seria una via de XSS en cuanto alguien incluya en
    // un error algun dato de la peticion o del modelo.
    resultDiv.innerHTML = `<p style="color:var(--red)">${escapeHtml(err.message || 'Ocurrió un error al analizar el catálogo.')}</p>`;
  }
}

async function applySync() {
  const vendor = document.getElementById('syncVendor').value;
  const resultDiv = document.getElementById('syncResult');
  const btn = document.getElementById('btnApplySync');
  
  btn.innerHTML = 'Aplicando...';
  btn.disabled = true;
  
  try {
    const res = await fetch('/api/sync/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vendor, changes: pendingChanges })
    });
    
    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      throw new Error(e.error || 'Error aplicando');
    }
    const data = await res.json();

    const skippedNote = data.skippedCount > 0 ? ` (${data.skippedCount} cambios se saltaron por datos inválidos, ver logs del servidor)` : '';
    resultDiv.innerHTML = `<p style="color:var(--green);font-weight:600">Se actualizaron ${data.appliedCount} registros en la base local${skippedNote}.</p>`
      + '<p style="font-size:13px;color:var(--steel)">Estos cambios viven solo en tu base local. Para que lleguen a producción, trasládalos a los archivos de <code>server/seed/legacyData/</code> y despliega — el catálogo de producción se resiembra desde ahí en cada despliegue.</p>';
    btn.style.display = 'none';
    btn.innerHTML = 'Aprobar e Impactar DB';
    btn.disabled = false;
  } catch (err) {
    resultDiv.innerHTML += `<p style="color:var(--red)">${escapeHtml(err.message || 'Error al aplicar los cambios.')}</p>`;
    btn.innerHTML = 'Aprobar e Impactar DB';
    btn.disabled = false;
  }
}
/* ═══════ INIT ═══════ */
(async function initApp(){
  const res = await fetch('/api/catalog');
  PR = await res.json();
  buildAll();
  renderDash();
  renderTables();
  populateCmp();
})();

/* ══════ ENLACE DE EVENTOS ══════
   Los manejadores vivian como onclick= en el HTML. Se movieron aqui para poder activar
   una CSP con script-src 'self': una politica asi bloquea el codigo en linea, que es
   precisamente por donde entra un XSS inyectado. Se usa delegacion en document en vez de
   un listener por boton, para que los elementos que se pintan despues tambien funcionen. */
document.addEventListener('click', (e) => {
  const ir = e.target.closest('[data-ir]');
  if (ir) { go(ir.dataset.ir); return; }

  const tab = e.target.closest('[data-tabgrupo]');
  if (tab) { switchTab(tab.dataset.tabgrupo, tab.dataset.tab); return; }

  const abrir = e.target.closest('[data-abrir]');
  if (abrir) { window.open(abrir.dataset.abrir, '_blank'); return; }

  if (e.target.closest('[data-cerrar-sync]')) { closeSyncModal(); return; }

  const id = e.target.closest('button,[id]')?.id;
  if (id === 'menuToggle') document.getElementById('sidebar').classList.toggle('open');
  else if (id === 'btnAbrirSync') openSyncModal();
  else if (id === 'btnAnalizarSync') analyzeSync();
  else if (id === 'btnApplySync') applySync();
  else if (id === 'btnComparar') runCompare();
  else if (id === 'btnCalcular') runCalc();
  else if (id === 'csvBtn') exportCSV();
});

document.addEventListener('input', (e) => {
  const fn = e.target.dataset && e.target.dataset.oninput;
  if (fn === 'globalFilter') globalFilter(e.target.value);
});

/* ══ ACCESO ══
   El enlace de administracion aparece segun el permiso que informa el servidor. No decide
   nada: /usuarios exige el permiso en la ruta y responde 403 a quien no lo tenga. */
fetch('/api/cuenta/estado')
  .then(r => r.ok ? r.json() : null)
  .then(d => { if (d && d.puedeUsuarios) document.getElementById('navUsuarios').style.display = ''; })
  .catch(() => {});
