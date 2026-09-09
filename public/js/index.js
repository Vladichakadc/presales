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
   tools:['Dimensionador y BOM','Catálogo de equipos'],live:true},
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
  PR.hw_ar.forEach(p=>ALL.push({grupo:'hw_ar',raw:p,vendor:'Huawei',model:p.model,series:p.ser,seg:p.seg,
    tp:p.fwd||0,tpL:fmtMbps(p.fwd),ipsec:p.ipsec||0,ipsecL:p.ipsec?fmtMbps(p.ipsec):'—',
    sdwan:p.sdwan,ports:p.ports,color:'#C7000B'}));
  PR.hw_wan.forEach(p=>ALL.push({grupo:'hw_wan',raw:p,vendor:'Huawei',model:p.model,series:p.ser,seg:p.seg,
    tp:parseCap(p.cap),tpL:p.cap,ipsec:0,ipsecL:'N/A',sdwan:'N/A',ports:p.ports,color:'#C7000B'}));
  PR.cisco.forEach(p=>ALL.push({grupo:'cisco',raw:p,vendor:'Cisco',model:p.model,series:p.ser,seg:p.seg,
    tp:parseRange(p.fwd),tpL:p.fwd,ipsec:parseRange(p.ipsec),ipsecL:p.ipsec,
    sdwan:p.sdwan,ports:p.ports,color:'#049FD9'}));
  PR.nokia.forEach(p=>ALL.push({grupo:'nokia',raw:p,vendor:'Nokia',model:p.model,series:p.ser,seg:p.seg,
    tp:parseCap(p.cap),tpL:p.cap,ipsec:0,ipsecL:'N/A (SP)',sdwan:'N/A',ports:p.ports,color:'#124191'}));
  PR.fortinet.forEach(p=>ALL.push({grupo:'fortinet',raw:p,vendor:'Fortinet',model:p.model,series:p.model.match(/\d+/)?p.model.replace(/FortiGate\s+(\d+\w+).*/,'$1 series'):'Fortinet',seg:p.seg,
    tp:parseRange(p.fw),tpL:'FW: '+p.fw,ipsec:parseRange(p.vpn),ipsecL:p.vpn,
    sdwan:'Sí (FortiOS nativo)',ports:p.ifaces,color:'#EE3124'}));
  PR.juniper.forEach(p=>ALL.push({grupo:'juniper',raw:p,vendor:'Juniper',model:p.model,series:p.ser,seg:p.seg,
    tp:parseCap(p.cap),tpL:p.cap,ipsec:0,ipsecL:'—',
    sdwan:p.use.includes('SD-WAN')?'Sí':'—',ports:p.ports,color:'#84B135'}));
  (PR.mikrotik||[]).forEach(p=>ALL.push({grupo:'mikrotik',raw:p,vendor:'MikroTik',model:p.model,series:p.ser,seg:p.seg,
    tp:p.fwd||0,tpL:fmtMbps(p.fwd),ipsec:p.ipsec||0,ipsecL:p.ipsec?fmtMbps(p.ipsec):'—',
    sdwan:p.sdwan,ports:p.ports,color:'#C8102E'}));
  (PR.aruba||[]).forEach(p=>ALL.push({grupo:'aruba',raw:p,vendor:'Aruba',model:p.model,series:p.ser,seg:p.seg,
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

function devsSeleccionados(){
  return ['cmp1','cmp2','cmp3','cmp4']
    .map(id=>document.getElementById(id).value).filter(Boolean)
    .map(id=>{
      const[vid,idx]=id.split('_');
      const v=VENDORS.find(x=>x.id===vid);
      return v?ALL.filter(d=>d.vendor===v.name)[+idx]:null;
    }).filter(Boolean)
    // La serie de Fortinet no viene en el catálogo: `buildAll` la deduce del nombre del
    // modelo. Sin este relleno el comparador la daría por «sin dato» teniéndola calculada,
    // que es decir que falta un dato que sí hay.
    .map(d=>Object.assign({},d,{raw:Object.assign({ser:d.series},d.raw)}));
}

/* Se pinta como MATRIZ —una fila por atributo, una columna por equipo— y no como una
   tarjeta por equipo. Con tarjetas, comparar un dato obligaba a buscarlo en cuatro sitios
   y compararlo de memoria, que es justo lo que un comparador tiene que ahorrar. */
function runCompare(){
  const devs=devsSeleccionados();
  const out=document.getElementById('compareOut');
  if(devs.length<2){
    out.innerHTML='<p class="cmp-vacio">Selecciona al menos dos equipos para compararlos.</p>';
    return;
  }
  const soloDif=document.getElementById('cmpSoloDif').checked;
  const secciones=COMPARADOR.filasVisibles(devs,soloDif);

  const aviso=COMPARADOR.avisoBases(devs);
  const cabeceras=devs.map(d=>`<th scope="col" class="cmp-dev" style="--acento:${d.color}">
      <span class="cmp-fab">${esc(d.vendor)}</span><span class="cmp-mod">${esc(d.model)}</span></th>`).join('');

  let filas='';
  for(const sec of secciones){
    filas+=`<tr class="cmp-sec"><th scope="rowgroup" colspan="${devs.length+1}">${esc(sec.titulo)}`
      +(sec.nota?`<span class="cmp-secnota">${esc(sec.nota)}</span>`:'')+'</th></tr>';
    for(const f of sec.filas){
      const mejores=COMPARADOR.mejores(f,devs);
      const celdas=devs.map((d,i)=>{
        const c=COMPARADOR.celda(f,d);
        if(c.estado==='sinDato') return '<td class="cmp-hueco">sin dato</td>';
        if(c.estado==='noAplica') return `<td class="cmp-na">no aplica${c.txt?`<span class="cmp-namotivo">${esc(c.txt)}</span>`:''}</td>`;
        return `<td class="${mejores.indexOf(i)>=0?'cmp-top':''}">${esc(c.txt)}</td>`;
      }).join('');
      filas+=`<tr><th scope="row">${esc(f.n)}`
        +(f.nota?`<span class="cmp-ayuda" title="${esc(f.nota)}">?</span>`:'')
        +`</th>${celdas}</tr>`;
    }
  }
  if(!filas) filas=`<tr><td colspan="${devs.length+1}" class="cmp-hueco">Estos equipos no se diferencian en ningún dato publicado.</td></tr>`;

  out.innerHTML=(aviso?`<p class="cmp-aviso">${aviso.replace(/\*\*(.+?)\*\*/g,'<b>$1</b>')}</p>`:'')
    +`<div class="cmp-scroll"><table class="cmp-tabla"><thead><tr><th scope="col" class="cmp-esq">Característica</th>${cabeceras}</tr></thead>`
    +`<tbody>${filas}</tbody></table></div>`
    +`<p class="cmp-pie"><b>sin dato</b> es que el catálogo no publica esa cifra para ese modelo; <b>no aplica</b> es que la pregunta no va con ese tipo de equipo. No son lo mismo y por eso se dicen distinto.</p>`;
}

/* ═══════ CALCULATOR ═══════ */
/* La lógica —qué capa mide cada perfil, y qué se hace con los modelos cuya cifra
   de esa capa el catálogo no publica— vive en js/calculadora.js. Aquí solo se
   pinta. El motivo está escrito en la cabecera de ese módulo: esta pantalla
   dimensionaba el perfil «SD-WAN / NGFW» con la cifra de firewall. */
let ultimoCalculo=null;

function ctxCalculo(){
  const bw=parseFloat(document.getElementById('calcBw').value)||0;
  const unit=parseFloat(document.getElementById('calcUnit').value);
  const perfil=document.getElementById('calcProfile').value;
  const margin=parseFloat(document.getElementById('calcMargin').value)||0;
  const dir=parseFloat(document.getElementById('calcDir').value);
  return {bw,unit,perfil,margin,dir,need:CALC.requerimiento({bw,unit,dir,margin})};
}

function calcFila(f,recomendada){
  const h=f.holgura===null?'—':`${f.holgura>=0?'+':''}${Math.round(f.holgura*100)}%`;
  const sobra=f.holgura!==null&&f.holgura>2;
  return `<tr${recomendada?' class="calc-rec"':''}>
    <th scope="row">
      <span class="calc-modelo">${esc(f.d.model)}</span>${recomendada?'<span class="calc-marca">el más pequeño que cumple</span>':''}
      <span class="calc-sub">${esc([f.d.series,f.d.seg].filter(Boolean).join(' · '))}</span>
      ${f.d.ports?`<span class="calc-sub">${esc(f.d.ports)}</span>`:''}
    </th>
    <td><span class="calc-cifra">${CALC.fmt(f.mbps)}</span><span class="calc-sub">${esc(f.capa)}</span></td>
    <td class="calc-holgura">${h}${sobra?'<span class="calc-sub">muy por encima</span>':''}</td>
  </tr>`;
}

function calcPanelFabricante(g,total){
  const filas=g.filas.slice(0,5);
  const resto=g.filas.length-filas.length;
  return `<div class="panel">
    <h2><span class="calc-punto" style="background:${g.color}"></span>${esc(g.vendor)}
      <span class="badge live">${g.filas.length} de ${total[g.vendor]||g.filas.length} cumplen</span></h2>
    <div class="calc-scroll"><table class="calc-tabla">
      <thead><tr><th scope="col">Modelo</th><th scope="col">Cifra dimensionada</th><th scope="col">Holgura</th></tr></thead>
      <tbody>${filas.map((f,i)=>calcFila(f,i===0)).join('')}</tbody>
    </table></div>
    ${resto>0?`<p class="calc-resto">Y ${resto} modelo${resto===1?'':'s'} más de ${esc(g.vendor)} que también cumplen, con más holgura.</p>`:''}
  </div>`;
}

function runCalc(){
  const ctx=ctxCalculo();
  const perfil=CALC.PERFILES[ctx.perfil];
  const res=CALC.evaluar(ALL,ctx.perfil,ctx.need);
  const detalle=`${fmtMbps(ctx.bw*ctx.unit)} × ${ctx.dir===2?'bidireccional (×2)':'agregado'} + ${Math.round(ctx.margin)}% de margen`;
  ultimoCalculo={res,ctx,detalle};

  // Cuántos modelos de cada fabricante SÍ traían cifra de esta capa: sin ese
  // denominador, «3 cumplen» no dice si se comprobaron 3 o 24.
  const comprobados={};
  for(const f of res.candidatos.concat(res.cortos)) comprobados[f.d.vendor]=(comprobados[f.d.vendor]||0)+1;

  let html=`<div class="calc-result">
    <p class="tag">Requerimiento calculado</p>
    <div class="big-num">${fmtMbps(ctx.need)}</div>
    <p class="calc-detalle">${detalle}</p>
    <p class="calc-capa"><b>Se dimensiona contra la capa «${esc(perfil.etq)}».</b> ${esc(perfil.mide)}</p>
  </div>`;

  if(res.candidatos.length){
    const aviso=CALC.avisoBases(res.candidatos);
    if(aviso) html+=`<p class="cmp-aviso">${esc(aviso).replace(/\*\*(.+?)\*\*/g,'<b>$1</b>')}</p>`;
    html+='<div style="margin-top:16px">'
      +CALC.porFabricante(res.candidatos).map(g=>calcPanelFabricante(g,comprobados)).join('')
      +'</div>';
  }else{
    html+='<div class="panel" style="margin-top:16px"><p style="color:var(--amber);font-weight:600;margin:0 0 8px">Ningún equipo del catálogo alcanza esa cifra en esta capa.</p>';
    if(res.cortos.length){
      // Decir cuánto falta es más útil que un «no hay»: separar el tráfico entre
      // varios equipos es una decisión de diseño, y para tomarla hace falta saber
      // por cuánto se queda corto el mayor.
      const top=res.cortos.slice(0,3).map(f=>`<li><b>${esc(f.d.vendor)} ${esc(f.d.model)}</b> — ${CALC.fmt(f.mbps)} de ${esc(f.capa)}, se queda al ${Math.round(f.mbps/ctx.need*100)}% de lo pedido.</li>`).join('');
      html+=`<p class="calc-resto">Lo más grande que hay en esta capa:</p><ul class="calc-lista">${top}</ul>
        <p class="calc-resto">Por encima del mayor del catálogo no se redondea hacia abajo: repartir el tráfico entre varios equipos es una decisión de diseño, no una recomendación automática.</p>`;
    }
    html+='</div>';
  }

  // Lo que NO se pudo comprobar se dice siempre, también cuando hay candidatos:
  // una lista corta sin explicar por qué es corta se lee como catálogo completo.
  const apartados=CALC.apartadosPorFabricante(res.apartados);
  if(apartados.length){
    html+=`<div class="panel calc-apartados">
      <h2>Sin cifra de esta capa en el catálogo <span class="badge soon">${res.apartados.length} modelos</span></h2>
      <p class="calc-resto">Estos modelos <b>no se han comprobado</b> contra el requerimiento. No se dimensionan con la cifra de otra capa: sustituirla es exactamente lo que produce propuestas cortas por un orden de magnitud.</p>
      <ul class="calc-lista">${apartados.map(a=>`<li>
        <span class="calc-punto" style="background:${a.color}"></span><b>${esc(a.vendor)}</b> — ${a.n} modelo${a.n===1?'':'s'} · ${esc(a.motivo)}.
        ${a.tool?`<a href="${a.tool.url}">Ir al ${esc(a.tool.txt)}</a>`:''}
      </li>`).join('')}</ul>
    </div>`;
  }

  document.getElementById('calcOut').innerHTML=html;
  document.getElementById('csvBtn').style.display=res.candidatos.length?'block':'none';
}


/* ═══════ EXPORT CSV ═══════ */
/* Se arma con los datos del último cálculo, no rascando el HTML ya pintado: la
   versión anterior leía los `<div style="font-size:13px">` de la pantalla, así
   que perdía la capa dimensionada —el dato que da sentido a la cifra— y se
   rompía al tocar el maquetado. */
function exportCSV(){
  if(!ultimoCalculo||!ultimoCalculo.res.candidatos.length){alert('Calcula primero para tener datos que exportar.');return;}
  const {res,ctx,detalle}=ultimoCalculo;
  const csv=CALC.csv(res,{perfil:CALC.PERFILES[ctx.perfil].etq,need:ctx.need,detalle});
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

// El entorno lo informa el servidor (/api/sync/estado): no se puede deducir en el cliente, y
// de el dependen dos cosas — que «aplicar a base local» solo aparezca en local (en produccion
// esa escritura no persiste), y que se avise si falta la clave antes de gastar un analisis.
let syncEstado = { produccion: false, tieneClave: true };

async function openSyncModal() {
  document.getElementById('syncModal').style.display = 'flex';
  document.getElementById('syncResult').innerHTML = '<p>Selecciona un fabricante y haz clic en Analizar.</p>';
  document.getElementById('btnApplySync').style.display = 'none';
  document.getElementById('btnDescargarPropuesta').style.display = 'none';
  try {
    const res = await fetch('/api/sync/estado');
    if (res.ok) syncEstado = await res.json();
  } catch { /* si no se puede leer, se asume local: el peor caso es ofrecer un boton de mas */ }

  const analizar = document.getElementById('btnAnalizarSync');
  if (!syncEstado.tieneClave) {
    // Sin clave el analisis falla cerrado con 503; se dice antes en vez de dejar pulsar.
    analizar.disabled = true;
    document.getElementById('syncResult').innerHTML = '<p style="color:var(--amber);font-weight:600">'
      + 'Falta <code>ANTHROPIC_API_KEY</code> en este servidor, así que el análisis con IA no puede correr aquí. '
      + 'Pídele al administrador que la configure, o ejecuta la sincronización en local.</p>';
  } else {
    analizar.disabled = false;
  }
}

function closeSyncModal() {
  document.getElementById('syncModal').style.display = 'none';
  pendingChanges = [];
}

// Descarga la propuesta con la forma exacta que espera `npm run propuesta` y el workflow
// aplicar-propuesta: {vendor, cambios:[...]}. El navegador ya tiene los cambios en memoria,
// asi que esto es puro cliente y funciona igual en produccion — el archivo es lo que viaja
// al PR, no una escritura contra este servicio.
function descargarPropuesta() {
  const vendor = document.getElementById('syncVendor').value;
  const propuesta = { vendor, generado: new Date().toISOString(), cambios: pendingChanges };
  const blob = new Blob([JSON.stringify(propuesta, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `propuesta-${vendor}-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

async function analyzeSync() {
  const vendor = document.getElementById('syncVendor').value;
  const fileInput = document.getElementById('syncFile');
  const resultDiv = document.getElementById('syncResult');
  const btn = document.getElementById('btnApplySync');
  const btnDesc = document.getElementById('btnDescargarPropuesta');

  resultDiv.innerHTML = '<p>Analizando catálogo con IA (esto puede tardar unos segundos o minutos si el archivo es grande)...</p>';
  btn.style.display = 'none';
  btnDesc.style.display = 'none';
  
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
    // Descargar la propuesta es el camino durable y va siempre. Aplicar a la base local solo
    // se ofrece fuera de produccion, donde esa escritura si sirve para iterar.
    btnDesc.style.display = 'inline-block';
    btn.style.display = syncEstado.produccion ? 'none' : 'inline-block';
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
  // El contraste al subir una fuente oficial (js/procedencia.js) necesita saber de dónde
  // sacar los modelos de cada fabricante para comparar: Huawei es dos catálogos (AR+WAN),
  // el resto uno solo. Fortinet no se registra aquí — su pestaña "Fuentes" vive en su propio
  // dimensionador, que se registra con sus propios MODELS.
  PROCEDENCIA.registrarModelos('huawei', () => [...(PR.hw_ar || []), ...(PR.hw_wan || [])]);
  PROCEDENCIA.registrarModelos('cisco', () => PR.cisco || []);
  PROCEDENCIA.registrarModelos('nokia', () => PR.nokia || []);
  PROCEDENCIA.registrarModelos('juniper', () => PR.juniper || []);
  PROCEDENCIA.registrarModelos('mikrotik', () => PR.mikrotik || []);
  PROCEDENCIA.registrarModelos('aruba', () => PR.aruba || []);
})();

/* ══════ ENLACE DE EVENTOS ══════
   Los manejadores vivian como onclick= en el HTML. Se movieron aqui para poder activar
   una CSP con script-src 'self': una politica asi bloquea el codigo en linea, que es
   precisamente por donde entra un XSS inyectado. Se usa delegacion en document en vez de
   un listener por boton, para que los elementos que se pintan despues tambien funcionen. */
document.addEventListener('click', (e) => {
  const ir = e.target.closest('[data-ir]');
  if (ir) {
    // Fortinet ya no tiene vista propia en el portal: su catálogo y sus fuentes viven como
    // pestañas de su dimensionador, que pasó a ser su página principal. El mapa queda listo
    // para sumar los otros fabricantes si el mismo cambio se extiende más adelante.
    const directo = { fortinet: 'dimensionador-fortinet-fortigate.html' }[ir.dataset.ir];
    if (directo) { location.href = directo; return; }
    go(ir.dataset.ir); return;
  }

  const tab = e.target.closest('[data-tabgrupo]');
  if (tab) { switchTab(tab.dataset.tabgrupo, tab.dataset.tab); return; }

  const abrir = e.target.closest('[data-abrir]');
  if (abrir) { window.location.href = abrir.dataset.abrir; return; }

  if (e.target.closest('[data-cerrar-sync]')) { closeSyncModal(); return; }

  const id = e.target.closest('button,[id]')?.id;
  if (id === 'menuToggle') document.getElementById('sidebar').classList.toggle('open');
  else if (id === 'btnAbrirSync') openSyncModal();
  else if (id === 'btnAnalizarSync') analyzeSync();
  else if (id === 'btnApplySync') applySync();
  else if (id === 'btnDescargarPropuesta') descargarPropuesta();
  else if (id === 'btnComparar') runCompare();
  else if (id === 'btnCalcular') runCalc();
  else if (id === 'csvBtn') exportCSV();
});

document.addEventListener('input', (e) => {
  const fn = e.target.dataset && e.target.dataset.oninput;
  if (fn === 'globalFilter') globalFilter(e.target.value);
});

// El comparador se repinta al cambiar cualquiera de sus controles, sin volver a pulsar el
// boton: si alguien cambia un equipo y la tabla sigue mostrando el anterior, esta leyendo
// una comparacion que ya no corresponde a lo que tiene seleccionado. El boton se queda
// porque es la llamada a la accion de la primera vez, cuando aun no hay nada que repintar.
document.addEventListener('change', (e) => {
  if (['cmp1', 'cmp2', 'cmp3', 'cmp4', 'cmpSoloDif'].indexOf(e.target.id) >= 0) {
    if (document.getElementById('compareOut').innerHTML.trim()) runCompare();
  }
  // La calculadora, por el mismo motivo: cambiar el perfil de trafico y seguir
  // viendo la recomendacion del perfil anterior es leer una respuesta a otra
  // pregunta. Solo se repinta si ya se habia calculado una vez; el boton sigue
  // siendo la llamada a la accion de la primera.
  if (['calcBw', 'calcUnit', 'calcProfile', 'calcMargin', 'calcDir'].indexOf(e.target.id) >= 0) {
    if (ultimoCalculo) runCalc();
  }
});

/* ══ ACCESO ══
   El enlace de administracion aparece segun el permiso que informa el servidor. No decide
   nada: /usuarios exige el permiso en la ruta y responde 403 a quien no lo tenga. */
fetch('/api/cuenta/estado')
  .then(r => r.ok ? r.json() : null)
  .then(d => {
    if (!d) return;
    if (d.puedeUsuarios) document.getElementById('navUsuarios').style.display = '';
    // El control para cargar la fuente oficial de cada fabricante (permiso `sync`) lo
    // gobierna js/procedencia.js con su propia lectura de este mismo endpoint.
  })
  .catch(() => {});
