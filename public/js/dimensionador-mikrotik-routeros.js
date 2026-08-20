'use strict';
let MODELS=[], OPTICS={}, OPTIC_LABEL={}, APS=[], SUPPORT={}, SIZING={};

const $=id=>document.getElementById(id);
let profile='fwd', media='any', lastPick=null;
let bomFilas=[], bomMeta={};

// El modelo recomendado se lleva solo a la pestaña de BOM, y solo cuando la recomendación
// CAMBIA: así una elección manual para comparar no se pisa al mover un parámetro.
let ultimaRecomendacion=null;
function sincronizarConBom(pick){
  const id=pick?pick.id:null;
  if(id===ultimaRecomendacion) return;
  ultimaRecomendacion=id;
  if(!id) return;
  const sel=$('pickModel');
  if(!sel||sel.value===id) return;
  sel.value=id;
  if(sel.value===id) renderBom();
}

// RouterOS 7 no acelera WireGuard por hardware y lo procesa mayormente en un hilo por
// tunel, a diferencia de IPsec que usa el motor criptografico del SoC. Estimacion
// conservadora hasta tener cifras publicadas por modelo.
// ponytail: factor unico; reemplazar por campo `wg` por modelo cuando MikroTik lo publique.
const WG_FACTOR=0.45;

document.querySelectorAll('.tabs button').forEach(b=>b.addEventListener('click',()=>{
  document.querySelectorAll('.tabs button').forEach(x=>x.setAttribute('aria-selected',x===b));
  ['calc','bom','lic'].forEach(t=>$('pane-'+t).hidden=(t!==b.dataset.tab));
}));

const PROFILE_HINT={
  fwd:'Throughput de NAT/ruteo. Las cifras publicadas por MikroTik asumen FastTrack activo y tramas de 1518 B.',
  ipsec:'IPsec AES-128 con el motor criptográfico del SoC. FastTrack no aplica: el tráfico cifrado nunca toma el camino rápido.',
  wg:'WireGuard es software puro en RouterOS 7 y mayormente single-thread por túnel. Estimado en 45 % del IPsec del mismo equipo.',
};
$('profileSeg').addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b)return;
  [...$('profileSeg').children].forEach(x=>x.setAttribute('aria-pressed',x===b));
  profile=b.dataset.v; $('profileHint').textContent=PROFILE_HINT[profile]; render();
});
$('mediaSeg').addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b)return;
  [...$('mediaSeg').children].forEach(x=>x.setAttribute('aria-pressed',x===b));
  media=b.dataset.v; render();
});
// Los sub-campos solo existen mientras su opcion este activa.
[['chkBgp','bgpBox'],['chkPppoe','pppoeBox'],['chkCapsman','capsBox']].forEach(([chk,box])=>{
  $(chk).addEventListener('change',()=>$(box).classList.toggle('hidden',!$(chk).checked));
});
['bw','unit','head','chkVirtual','chkQos','chkBgp','bgpFeeds','chkPppoe','pppoeSess','chkCapsman','apCount','chkPoe','chkHa']
  .forEach(id=>$(id).addEventListener('input',render));
['pickModel','qty','supportTier','chkTraining','bomApModel','bomApQty'].forEach(id=>$(id).addEventListener('input',renderBom));

function fmt(v){
  if(v==null||v===0) return '—';
  if(v>=999999) return 'Sin tope';
  if(v>=1000) return (v/1000).toFixed(v%1000?1:0)+' Gbps';
  return Math.round(v)+' Mbps';
}
const esc=s=>String(s).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
const money=n=>n==null?'—':'$'+Number(n).toLocaleString('en-US',{maximumFractionDigits:2});

/* ── Motor de dimensionamiento ─────────────────────────────────────────────── */

// FastTrack solo aplica al forwarding en claro. Habilitar colas lo desactiva y obliga a
// pasar por conntrack + firewall completo, que es donde se pierde el rendimiento.
function fastTrackFactor(m){
  if(!$('chkQos').checked || profile!=='fwd') return 1;
  return SIZING.fasttrack[m.arch] ?? SIZING.fasttrack.arm;
}
function capOf(m){
  const base = profile==='fwd' ? m.fwd : profile==='ipsec' ? m.ipsec : m.ipsec*WG_FACTOR;
  return base*fastTrackFactor(m);
}
// Feeds BGP full table que caben en RAM. No es lineal: el FIB se comparte entre feeds, así
// que solo el primero paga el costo completo. CHR (ram null) depende del hipervisor.
function maxFeeds(m){
  if(m.ram==null) return Infinity;
  const {baseMb,firstFeedMb,extraFeedMb}=SIZING.bgpRam;
  const free=m.ram-baseMb;
  if(free<firstFeedMb) return 0;
  return 1+Math.floor((free-firstFeedMb)/extraFeedMb);
}
// RAM necesaria para n feeds — para decirle al usuario cuánto le falta, no solo que no cabe.
function ramForFeeds(n){
  const {baseMb,firstFeedMb,extraFeedMb}=SIZING.bgpRam;
  return baseMb+firstFeedMb+Math.max(0,n-1)*extraFeedMb;
}
function sessCap(m){
  const lvl=SIZING.licenseLevels[m.lvl];
  return lvl && lvl.sess!=null ? lvl.sess : Infinity;
}
const fiberCages=m=>Object.values(m.cages||{}).reduce((a,b)=>a+b,0);

function requirements(){
  const bw=parseFloat($('bw').value)||0;
  const unit=parseFloat($('unit').value);
  const head=(parseFloat($('head').value)||0)/100;
  return {
    mbps: bw*unit*(1+head),
    feeds: $('chkBgp').checked ? (parseInt($('bgpFeeds').value)||1) : 0,
    sess:  $('chkPppoe').checked ? (parseInt($('pppoeSess').value)||0) : 0,
    aps:   $('chkCapsman').checked ? (parseInt($('apCount').value)||0) : 0,
    poe:   $('chkCapsman').checked && $('chkPoe').checked,
  };
}

// Devuelve los candidatos que cumplen TODAS las restricciones duras, junto con el motivo
// por el que cada descartado quedo fuera — para poder explicar una lista vacia.
function selectCandidates(req){
  const virtual=$('chkVirtual').checked;
  const apDraw=(APS[0] && APS[0].poeDraw) || 12;
  const poeNeed=req.poe ? req.aps*apDraw : 0;
  const reasons={cap:0,ram:0,sess:0,poe:0};

  const ok=MODELS.filter(m=>{
    if(m.eol||m.legacy) return false;
    if(virtual !== (m.ser==='CHR')) return false;
    if(capOf(m) < req.mbps){ reasons.cap++; return false; }
    if(req.feeds && maxFeeds(m) < req.feeds){ reasons.ram++; return false; }
    if(req.sess && sessCap(m) < req.sess){ reasons.sess++; return false; }
    if(poeNeed && !(m.poe>=poeNeed)){ reasons.poe++; return false; }
    return true;
  });

  // Right-sizing por costo, no por capacidad: ordenar por capacidad ascendente elegia el
  // RB4011 ($200 / 5.6 G) antes que el RB5009 ($190 / 8.8 G) — mas caro y mas lento.
  ok.sort((a,b)=>(a.elpN??Infinity)-(b.elpN??Infinity) || capOf(a)-capOf(b));
  return {ok,reasons,poeNeed};
}

function preferByMedia(list){
  if(media==='any'||!list.length) return list[0];
  const sorted=[...list].sort((a,b)=>media==='fiber'
    ? fiberCages(b)-fiberCages(a) || (a.elpN??0)-(b.elpN??0)
    : fiberCages(a)-fiberCages(b) || (a.elpN??0)-(b.elpN??0));
  return sorted[0];
}

function render(){
  $('headVal').textContent=Math.round((parseFloat($('head').value)||0))+' %';
  const req=requirements();
  const {ok,reasons,poeNeed}=selectCandidates(req);
  const pick=preferByMedia(ok);
  lastPick=pick;
  sincronizarConBom(pick);

  // Escala: se excluye el centinela de CHR P-Unlimited para no aplastar el resto.
  const maxCap=Math.max(...MODELS.filter(m=>m.fwd<999999).map(m=>m.fwd));
  const logP=v=>Math.log10(Math.max(v,10));
  const logMin=Math.log10(10),logMax=logP(maxCap*1.2);
  const xPct=v=>(logP(v)-logMin)/(logMax-logMin)*100;

  $('ladderLbl').textContent=$('chkQos').checked&&profile==='fwd'
    ? 'Capacidad efectiva SIN FastTrack (shaping activo) vs. requerimiento — escala logarítmica'
    : 'Capacidad efectiva del modelo vs. requerimiento (escala logarítmica)';

  const need=$('need');
  need.style.left=Math.min(xPct(req.mbps),99)+'%';
  $('needLbl').textContent=fmt(req.mbps);
  need.classList.toggle('flip',xPct(req.mbps)>60);

  const track=$('track');
  track.querySelectorAll('.dot,.tick,.pickLabel').forEach(e=>e.remove());
  [10,50,100,500,1000,5000,10000,50000,100000].forEach(v=>{
    const pct=xPct(v);if(pct<0||pct>100)return;
    const tick=document.createElement('div');tick.className='tick';tick.style.left=pct+'%';
    tick.innerHTML=`<i></i><b>${v>=1000?v/1000+'G':v+'M'}</b>`;track.appendChild(tick);
  });
  MODELS.filter(m=>!m.legacy).forEach(m=>{
    const cap=capOf(m);const pct=xPct(cap);if(pct<0||pct>100)return;
    const dot=document.createElement('div');
    dot.className='dot'+(pick&&m.id===pick.id?' pick':cap>=req.mbps?' ok':'');
    dot.style.left=pct+'%';dot.title=m.id+': '+fmt(cap);
    track.appendChild(dot);
  });

  if(!pick){
    $('vModel').textContent='Sin candidato';
    $('verdict').style.borderLeftColor='var(--amber)';
    const why=[];
    if(reasons.cap)  why.push(`<li><b>${reasons.cap}</b> modelo(s) descartado(s) por throughput insuficiente${$('chkQos').checked&&profile==='fwd'?' — el shaping activo reduce la capacidad efectiva':''}.</li>`);
    if(reasons.ram)  why.push(`<li><b>${reasons.ram}</b> por RAM insuficiente para ${req.feeds} feed(s) BGP full table: harían falta ~${(ramForFeeds(req.feeds)/1024).toFixed(1)} GB. Este límite es de <b>memoria, no de throughput</b> — si el equipo alcanza en Gbps pero no en RAM, el diseño correcto suele ser ruta default o un feed parcial filtrado, no un equipo más grande.</li>`);
    if(reasons.sess) why.push(`<li><b>${reasons.sess}</b> por el tope de sesiones de su nivel de licencia (necesitas ${req.sess}).</li>`);
    if(reasons.poe)  why.push(`<li><b>${reasons.poe}</b> por presupuesto PoE insuficiente (${poeNeed} W). Ningún router MikroTik entrega tanto PoE: la solución correcta es un switch PoE dedicado (serie CRS...P) alimentando los APs.</li>`);
    $('vFamily').textContent='Ningún modelo del catálogo cumple todas las restricciones';
    $('vWhy').innerHTML=`<p class="warn" style="margin:0 0 8px"><b>Motivo del descarte:</b></p><ul style="margin:0;padding-left:18px;font-size:13.5px">${why.join('')}</ul>`;
    ['mCapVal','mRamVal','mSessVal'].forEach(id=>$(id).textContent='—');
    ['mCapBar','mRamBar','mSessBar'].forEach(id=>{$(id).style.width='0%';});
    $('sizingBox').innerHTML='<p style="font-size:13.5px;color:var(--steel)">Ajusta las restricciones para obtener una recomendación.</p>';
    return;
  }

  $('verdict').style.borderLeftColor='var(--red)';
  $('vModel').textContent=pick.id;
  $('vFamily').textContent=`${pick.seg} · RouterOS 7.x · licencia nivel ${pick.lvl}${pick.elp?' · '+pick.elp:''}`;
  const pl=document.createElement('div');
  pl.className='pickLabel';pl.textContent=pick.id;pl.style.left=xPct(capOf(pick))+'%';
  track.appendChild(pl);

  const setBar=(id,val,cap)=>{
    const pct=(cap===Infinity||!cap)?6:Math.min(val/cap*100,100);
    const bar=$(id);bar.style.width=pct+'%';
    bar.className=pct>90?'tight':pct<70?'good':'';
  };
  $('mCapVal').textContent=fmt(req.mbps)+' / '+fmt(capOf(pick));
  setBar('mCapBar',req.mbps,capOf(pick));
  const feeds=maxFeeds(pick);
  $('mRamVal').textContent=pick.ram==null?'Según hipervisor'
    :`${req.feeds||0} / ${feeds===Infinity?'∞':feeds} feeds · ${(pick.ram/1024).toFixed(pick.ram<1024?2:0)} GB`;
  setBar('mRamBar',req.feeds||0,feeds);
  const sc=sessCap(pick);
  $('mSessVal').textContent=`${req.sess||0} / ${sc===Infinity?'ilimitadas (nivel 6)':sc}`;
  setBar('mSessBar',req.sess||0,sc);

  const flags=[];
  if($('chkQos').checked&&profile==='fwd'){
    const f=SIZING.fasttrack[pick.arch]??SIZING.fasttrack.arm;
    flags.push(`<b class="warn">FastTrack desactivado por el shaping:</b> capacidad efectiva ${fmt(capOf(pick))} en lugar de ${fmt(pick.fwd)} publicados (factor ${f} para arquitectura ${pick.arch.toUpperCase()}).`);
  }
  if(profile==='wg') flags.push(`<b>WireGuard estimado</b> en ${fmt(capOf(pick))} (45 % del IPsec del equipo). Sin aceleración por hardware y mayormente single-thread por túnel: distribuir en varios túneles para aprovechar los ${pick.cores??'n'} núcleos.`);
  if(profile==='ipsec'&&pick.cores) flags.push(`IPsec acelerado por el motor criptográfico del SoC (${pick.cpu}, ${pick.cores} núcleo${pick.cores>1?'s':''}).`);
  if(req.feeds) flags.push(pick.ram==null
    ? `CHR: dimensionar la instancia con ≥ <b>${(ramForFeeds(req.feeds)/1024).toFixed(1)} GB</b> de RAM para ${req.feeds} feed(s) full table.`
    : `Soporta hasta <b>${feeds}</b> feed(s) full table con sus ${(pick.ram/1024).toFixed(0)} GB de RAM (el primero cuesta ~${(SIZING.bgpRam.firstFeedMb/1024).toFixed(1)} GB, cada adicional ~${(SIZING.bgpRam.extraFeedMb/1024).toFixed(1)} GB porque el FIB se comparte).`);
  if(req.sess) flags.push(`Licencia <b>nivel ${pick.lvl}</b>: ${sc===Infinity?'sin tope de sesiones':`tope de ${sc} sesiones`}. ${SIZING.licenseLevels[pick.lvl].d}`);
  if(req.aps) flags.push(`${req.aps} AP(s) por CAPsMAN — incluidos en el BOM. ${req.poe?`PoE-out del router: ${pick.poe} W disponibles para ${poeNeed} W requeridos.`:'Alimentación de los APs por inyector o switch PoE aparte.'}`);
  if($('chkHa').checked) flags.push('<b>VRRP:</b> duplicar unidades — cada nodo lleva su propia licencia embebida.');
  if(pick.note) flags.push(`<span class="warn">${esc(pick.note)}</span>`);
  const alts=ok.filter(m=>m.id!==pick.id).slice(0,3);

  $('vWhy').innerHTML=`<ul style="margin:8px 0 0;padding-left:18px;font-size:13.5px">
    <li>Requerimiento <b>${fmt(req.mbps)}</b> (${profile==='fwd'?'forwarding':profile==='ipsec'?'IPsec':'WireGuard'}) contra capacidad efectiva <b>${fmt(capOf(pick))}</b></li>
    <li>${esc(pick.ports)}</li>
    ${flags.map(f=>`<li>${f}</li>`).join('')}
    ${alts.length?`<li>Alternativas que también cumplen: <b>${alts.map(a=>`${a.id} (${a.elp||'s/p'})`).join(', ')}</b></li>`:''}
  </ul>`;

  $('sizingBox').innerHTML=`
    <table><tbody>
      <tr><td>Perfil</td><td class="n r">${profile==='fwd'?'Forwarding / Routing':profile==='ipsec'?'IPsec acelerado':'WireGuard (software)'}</td></tr>
      <tr><td>Despliegue</td><td class="n r">${$('chkVirtual').checked?'Virtual (CHR)':'Hardware físico'}</td></tr>
      <tr><td>Requerimiento con margen</td><td class="n r"><b>${fmt(req.mbps)}</b></td></tr>
      <tr><td>FastTrack</td><td class="n r">${$('chkQos').checked&&profile==='fwd'?'<span class="warn">Desactivado (shaping)</span>':profile==='fwd'?'Activo':'No aplica'}</td></tr>
      <tr><td>Capacidad efectiva del modelo</td><td class="n r">${fmt(capOf(pick))}</td></tr>
      <tr><td>Headroom</td><td class="n r">${capOf(pick)>=999999?'—':Math.round((1-req.mbps/capOf(pick))*100)+'%'}</td></tr>
      <tr><td>CPU / RAM</td><td class="n r">${pick.cores?pick.cores+' núcleos':'—'} / ${pick.ram?(pick.ram/1024).toFixed(pick.ram<1024?2:0)+' GB':'hipervisor'}</td></tr>
      <tr><td>Nivel de licencia</td><td class="n r">Nivel ${pick.lvl}</td></tr>
      <tr><td>Unidades a cotizar</td><td class="n r">${$('chkHa').checked?'2 (VRRP)':'1'}</td></tr>
    </tbody></table>`;
}

/* ── BOM ───────────────────────────────────────────────────────────────────── */
function populateSelects(){
  $('pickModel').innerHTML=MODELS.map(m=>`<option value="${esc(m.id)}">${esc(m.id)} — ${esc(m.seg)}${m.eol?' (EOL)':m.legacy?' (legacy)':''}</option>`).join('');
  $('supportTier').innerHTML=Object.entries(SUPPORT).filter(([c])=>c!=='training')
    .map(([c,t])=>`<option value="${c}">${esc(t.n)}</option>`).join('');
  $('bomApModel').innerHTML=APS.map(a=>`<option value="${esc(a.sku)}">${esc(a.sku)} — ${money(a.price)}</option>`).join('');
}

// Un CCR2216 son 12 jaulas SFP28 + 2 QSFP28 vacias: sin estas lineas el equipo no es
// instalable. Se reconstruye al cambiar de modelo porque las jaulas cambian con el.
function renderOpticsPicker(m){
  const cages=m.cages||{};
  const codes=Object.keys(cages).filter(c=>OPTICS[c]&&OPTICS[c].length);
  $('opticsPanel').classList.toggle('hidden',!codes.length);
  if(!codes.length){$('opticsPicker').innerHTML='';return;}
  $('opticsPicker').innerHTML=codes.map(c=>`
    <div class="field">
      <label>${esc(OPTIC_LABEL[c]||c)} <span style="font-weight:400;color:var(--steel)">— ${cages[c]} jaula${cages[c]>1?'s':''}</span></label>
      <div class="opticRow">
        <select class="opticSel" data-cat="${c}">${OPTICS[c].map((o,i)=>`<option value="${i}">${esc(o.sku)} — ${money(o.price)}</option>`).join('')}</select>
        <input type="number" class="opticQty" data-cat="${c}" value="0" min="0" max="${cages[c]}">
      </div>
      <p class="hint">${esc(OPTICS[c][0].d)}</p>
    </div>`).join('');
  $('opticsPicker').querySelectorAll('.opticSel,.opticQty').forEach(el=>el.addEventListener('input',renderBom));
}

function selectedOptics(){
  return [...document.querySelectorAll('.opticQty')].map(q=>{
    const cat=q.dataset.cat;
    const qty=Math.max(0,parseInt(q.value)||0);
    if(!qty) return null;
    const sel=document.querySelector(`.opticSel[data-cat="${cat}"]`);
    const optic=OPTICS[cat][parseInt(sel.value)||0];
    return {cat,qty,optic};
  }).filter(Boolean);
}

function renderBom(){
  const m=MODELS.find(x=>x.id===$('pickModel').value)||MODELS[0];
  if(!m) return;
  if($('pickModel').dataset.built!==m.id){ renderOpticsPicker(m); $('pickModel').dataset.built=m.id; }

  const qty=Math.max(1,parseInt($('qty').value)||1);
  const support=SUPPORT[$('supportTier').value];
  const optics=selectedOptics();
  const apQty=Math.max(0,parseInt($('bomApQty').value)||0);
  const ap=APS.find(a=>a.sku===$('bomApModel').value)||APS[0];
  const isChr=m.ser==='CHR';
  const lvl=SIZING.licenseLevels[m.lvl];

  const lines=[
    {d:m.id, sub:m.ports, qty, unit:m.elpN, kind:'Equipo'},
    ...optics.map(o=>({d:o.optic.sku, sub:o.optic.d, qty:o.qty*qty, unit:o.optic.price, kind:'Óptica'})),
  ];
  if(apQty&&ap) lines.push({d:ap.sku, sub:ap.d, qty:apQty, unit:ap.price, kind:'AP'});
  const total=lines.reduce((s,l)=>s+(l.unit!=null?l.unit*l.qty:0),0);

  let html=`<section class="panel"><h2>Ficha del equipo</h2>
    <div class="model" style="font-size:28px">${esc(m.id)}</div>
    <p class="family">${esc(m.seg)} · RouterOS 7.x</p>
    <div class="scroll"><table><thead><tr><th>Métrica</th><th>Valor</th></tr></thead><tbody>
    <tr><td>Precio de lista ref.</td><td class="n">${m.elp?esc(m.elp):'Consultar distribuidor'}</td></tr>
    <tr><td>Forwarding (FastTrack, 1518 B)</td><td class="n">${fmt(m.fwd)}</td></tr>
    <tr><td>Forwarding con shaping (sin FastTrack)</td><td class="n warn">${fmt(m.fwd*(SIZING.fasttrack[m.arch]??SIZING.fasttrack.arm))}</td></tr>
    <tr><td>IPsec acelerado</td><td class="n">${fmt(m.ipsec)}</td></tr>
    <tr><td>WireGuard (estimado)</td><td class="n">${fmt(m.ipsec*WG_FACTOR)}</td></tr>
    <tr><td>CPU</td><td class="n">${esc(m.cpu||'—')}${m.cores?` · ${m.cores} núcleo${m.cores>1?'s':''}`:''}</td></tr>
    <tr><td>RAM</td><td class="n">${m.ram?(m.ram/1024).toFixed(m.ram<1024?2:0)+' GB':'Según hipervisor'}</td></tr>
    <tr><td>BGP full table</td><td class="n">${m.ram==null?'Según RAM de la instancia'
      :maxFeeds(m)?`hasta ${maxFeeds(m)} feed(s) completos`
      :'<span class="warn">No sostiene una tabla completa — usar ruta default o feed parcial filtrado</span>'}</td></tr>
    <tr><td>Nivel de licencia</td><td class="n">Nivel ${m.lvl} — ${lvl.sess==null?'sin tope de sesiones':lvl.sess+' sesiones/túneles'}</td></tr>
    <tr><td>PoE-out</td><td class="n">${m.poe?m.poe+' W':'No entrega PoE'}</td></tr>
    <tr><td>Puertos</td><td>${esc(m.ports)}</td></tr>
    </tbody></table></div>
    ${m.note?`<p class="hint warn" style="margin-top:10px">${esc(m.note)}</p>`:''}
    ${m.eol?'<p class="hint bad" style="margin-top:10px">Modelo descontinuado (EOL) — no usar en diseños nuevos.</p>':''}
    ${m.legacy?'<p class="hint warn" style="margin-top:10px">Modelo legacy — solo para reemplazo de equipos ya instalados.</p>':''}
    </section>`;

  html+=`<section class="panel"><h2>Lista de materiales <span style="font-weight:400;text-transform:none;letter-spacing:0">${money(total)} total ref.</span></h2><div class="scroll"><table>
    <thead><tr><th>Tipo</th><th>Ítem</th><th>Cant.</th><th>Precio ref. c/u</th><th>Subtotal</th></tr></thead><tbody>
    ${lines.map(l=>`<tr><td>${esc(l.kind)}</td><td><b>${esc(l.d)}</b><span class="sku">${esc(l.sub||'')}</span></td><td class="n">${l.qty}</td><td class="n r">${money(l.unit)}</td><td class="n r">${l.unit!=null?money(l.unit*l.qty):'—'}</td></tr>`).join('')}
    <tr class="total"><td colspan="4">Total de referencia (sin impuestos ni descuento de canal)</td><td class="n r">${money(total)}</td></tr>
    </tbody></table></div>
    ${optics.length?'':'<p class="hint warn" style="margin-top:10px">Aún no seleccionaste ópticas. Un equipo con jaulas SFP/QSFP no es instalable sin transceivers o DACs.</p>'}
    </section>`;

  html+=`<section class="panel"><h2>Licencia y soporte</h2><ul class="clean">
    ${isChr
      ?`<li class="on"><b>Licencia CHR ${esc(m.id.replace('CHR ',''))}</b><span class="req">Requerida</span><span class="sku">Tope de ${fmt(m.fwd)} por interfaz. Nivel 6, sin límite de sesiones. Dimensionar vCPU y RAM del hipervisor aparte.</span></li>`
      :`<li class="on"><b>RouterOS nivel ${m.lvl} — perpetua</b><span class="req">Incluida</span><span class="sku">Embebida en el hardware, sin costo recurrente. ${esc(lvl.d)}</span></li>`}
    <li><b>CAPsMAN</b><span class="req opt">Incluido</span><span class="sku">Controlador WiFi centralizado, parte de RouterOS — sin licencia adicional.</span></li>
    <li><b>${esc(support?support.n:'')}</b><span class="req ${support&&support.n.includes('Comunidad')?'opt':''}">Soporte</span><span class="sku">${esc(support?support.sla:'')} — ${esc(support?support.d:'')}</span></li>
    ${$('chkTraining').checked?`<li><b>${esc(SUPPORT.training.n)}</b><span class="req opt">Capacitación</span><span class="sku">${esc(SUPPORT.training.d)}</span></li>`:''}
  </ul></section>`;

  $('bomBody').innerHTML=html;

  // Filas del BOM en el formato compartido de /js/bom.js. Las opticas multiplican por la
  // cantidad de routers: cada equipo necesita las suyas.
  const filas=[
    {cat:'Equipo', desc:m.id, sku:null, qty, unit:m.elpN!=null?m.elpN:null,
     nota:`${m.seg} · ${m.ports}${m.eol?' · DESCONTINUADO':''}${m.legacy?' · legacy':''}`},
  ];
  optics.forEach(o=>filas.push({cat:'Ópticas y cables', desc:o.optic.sku, sku:o.optic.sku,
    qty:o.qty*qty, unit:o.optic.price, nota:o.optic.d}));
  if(apQty&&ap) filas.push({cat:'Puntos de acceso', desc:ap.sku, sku:ap.hwModel||null,
    qty:apQty, unit:ap.price, nota:ap.d});
  filas.push({cat:'Licencia', desc:isChr?`Licencia CHR ${m.id.replace('CHR ','')}`:`RouterOS nivel ${m.lvl} — perpetua`,
    sku:null, qty:isChr?qty:null, unit:null,
    nota:isChr?`Tope de ${fmt(m.fwd)} por interfaz. Dimensionar vCPU y RAM del hipervisor aparte.`
              :`Incluida en el hardware, sin costo recurrente. ${lvl.d}`});
  filas.push({cat:'Soporte', desc:support?support.n:'', sku:null, qty:null, unit:null,
    nota:support?support.sla:''});
  if($('chkTraining').checked) filas.push({cat:'Soporte', desc:SUPPORT.training.n, sku:null, qty:null, unit:null,
    nota:SUPPORT.training.d});

  const meta={
    titulo:`Lista de materiales — ${m.id}`,
    subtitulo:`${m.seg} · RouterOS 7.x · licencia nivel ${m.lvl}`,
    archivo:`BOM_${m.id}`,
    notas:[
      '',
      'ESPECIFICACIONES',
      `  Forwarding (FastTrack, 1518 B): ${fmt(m.fwd)}`,
      `  Forwarding con shaping activo:  ${fmt(m.fwd*(SIZING.fasttrack[m.arch]??SIZING.fasttrack.arm))}  <- FastTrack desactivado por las colas`,
      `  IPsec acelerado:                ${fmt(m.ipsec)}`,
      `  WireGuard (estimado):           ${fmt(m.ipsec*WG_FACTOR)}`,
      `  CPU / RAM:                      ${m.cpu||'—'}${m.cores?' · '+m.cores+' nucleos':''} / ${m.ram?(m.ram/1024).toFixed(m.ram<1024?2:0)+' GB':'segun hipervisor'}`,
      m.ram?`  BGP full table:                 hasta ${maxFeeds(m)} feed(s) completos en RAM`:null,
      '',
      'NOTAS DE PREVENTA',
      '  Precios MSRP publico de mikrotik.com, sin impuestos, aranceles ni descuento de canal.',
      '  MikroTik no publica price list regional firmado: confirmar con distribuidor autorizado.',
      '  Las cifras de forwarding asumen FastTrack activo; cualquier queue tree lo desactiva.',
      '  El nivel de licencia viene grabado en el hardware y no se puede subir por software.',
    ].filter((n)=>n!==null),
  };

  $('bomTabla').innerHTML=BOM.renderTabla(filas,{});
  $('bomOut').value=BOM.comoTexto(filas,meta);
  bomFilas=filas; bomMeta=meta;
}

function renderLicTables(){
  const byLvl={};
  MODELS.forEach(m=>{(byLvl[m.lvl]=byLvl[m.lvl]||[]).push(m.id);});
  $('lvlTable').innerHTML=Object.entries(SIZING.licenseLevels).map(([lvl,v])=>`<tr>
    <td><b>Nivel ${lvl}</b></td>
    <td class="n">${v.sess==null?'Sin tope':v.sess+' sesiones / túneles'}</td>
    <td>${(byLvl[lvl]||[]).map(esc).join(', ')||'—'}</td></tr>`).join('');

  $('chrTable').innerHTML=MODELS.filter(m=>m.ser==='CHR')
    .sort((a,b)=>a.fwd-b.fwd)
    .map(m=>`<tr><td><b>${esc(m.id)}</b></td><td class="n">${fmt(m.fwd)}</td><td class="n">${m.elp?esc(m.elp):'—'}</td></tr>`).join('');

  $('supportTable').innerHTML=Object.entries(SUPPORT).filter(([c])=>c!=='training')
    .map(([,t])=>`<tr><td><b>${esc(t.n)}</b></td><td class="n">${esc(t.sla)}</td><td>${esc(t.d||'')}</td></tr>`).join('');
}

$('copyBtn').addEventListener('click',async()=>{
  const t=$('bomOut');
  try{await navigator.clipboard.writeText(t.value);$('copyBtn').textContent='Copiado';}
  catch{t.classList.remove('hidden');t.select();document.execCommand('copy');t.classList.add('hidden');$('copyBtn').textContent='Copiado';}
  setTimeout(()=>$('copyBtn').textContent='Copiar como texto',1600);
});

$('xlsBtn').addEventListener('click',async()=>{
  const b=$('xlsBtn');b.disabled=true;b.textContent='Generando…';
  try{ await BOM.exportarExcel(bomFilas,bomMeta); b.textContent='Exportar a Excel'; }
  catch(e){ b.textContent='Error al exportar'; console.error(e);
    setTimeout(()=>b.textContent='Exportar a Excel',2200); }
  b.disabled=false;
});

(async function initApp(){
  const res=await fetch('/api/dimensionador/mikrotik');
  const data=await res.json();
  MODELS=data.models; OPTICS=data.optics; OPTIC_LABEL=data.opticLabel;
  APS=data.accessPoints; SUPPORT=data.support; SIZING=data.sizing;

  populateSelects();
  renderLicTables();
  render();
  renderBom();
})();

/* Enlace de eventos movido desde onclick= en el HTML, para permitir una CSP con
   script-src 'self' que bloquea todo codigo en linea. */
document.addEventListener('click', (e) => {
  const abrir = e.target.closest('[data-abrir]');
  if (abrir) { window.open(abrir.dataset.abrir, '_blank'); return; }
  const id = e.target.closest('button,[id]')?.id;
  if (id === 'btnCsv' && typeof exportCSV === 'function') exportCSV();
  else if (id === 'btnImprimir') window.print();
});
