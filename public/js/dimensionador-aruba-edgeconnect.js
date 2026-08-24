'use strict';
let MODELS = [], BUNDLES = {}, CARE = {}, LICENSES = {}, SIZING = {};

const $=id=>document.getElementById(id);
let profile='ipsec', famMode='any', segMode='branch', lastPick=null;
let bomFilas=[], bomMeta={};

// El modelo recomendado se lleva solo a la pestaña de BOM, y solo cuando la recomendacion
// CAMBIA: asi, si alguien elige otro modelo a mano para compararlo, no se lo pisamos en
// cuanto mueva un parametro del dimensionamiento. (Mismo criterio que en Fortinet.)
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

document.querySelectorAll('.tabs button').forEach(b=>b.addEventListener('click',()=>{
  document.querySelectorAll('.tabs button').forEach(x=>x.setAttribute('aria-selected',x===b));
  ['calc','bom','lic'].forEach(t=>$('pane-'+t).hidden=(t!==b.dataset.tab));
}));

$('profileSeg').addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b)return;
  [...$('profileSeg').children].forEach(x=>x.setAttribute('aria-pressed',x===b));
  profile=b.dataset.v;
  $('profileHint').textContent=TIER_BY_K[profile].d;
  render();
});
$('famSeg').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;[...$('famSeg').children].forEach(x=>x.setAttribute('aria-pressed',x===b));famMode=b.dataset.v;render();});
$('segSeg').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;[...$('segSeg').children].forEach(x=>x.setAttribute('aria-pressed',x===b));segMode=b.dataset.v;render();});
['bw','unit','users','head','sites','fecMode','boostProfile','chkBoost','chkSeg','chkBreakout','chkHa'].forEach(id=>$(id).addEventListener('input',render));

// Boost solo existe en EdgeConnect: activarlo con el filtro puesto en SD-Branch daria una
// lista de candidatos vacia sin explicar por que, asi que se mueve el filtro tambien.
$('chkBoost').addEventListener('change',()=>{
  if($('chkBoost').checked&&famMode==='gw'){
    famMode='ec';
    [...$('famSeg').children].forEach(x=>x.setAttribute('aria-pressed',x.dataset.v==='ec'));
  }
  render();
});
// En HA se compran 2 unidades y cada una lleva su propia suscripcion: enlazar la casilla
// con la cantidad del BOM evita cotizar un par con una sola licencia.
$('chkHa').addEventListener('change',()=>{
  const q=$('qty');
  if($('chkHa').checked){ if((parseInt(q.value)||1)<2) q.value=2; }
  else if((parseInt(q.value)||1)===2){ q.value=1; }
  renderBom();
});
['pickModel','qty','termYears','licBundle','bwTier','boostPool','careLevel'].forEach(id=>$(id).addEventListener('input',renderBom));

function fmt(m){
  if(m==null) return '—';
  if(m>=1000000)return (m/1e6).toFixed(1).replace(/\.0$/,'')+' Tbps';
  if(m>=1000)return (m/1000).toFixed(m%1000?1:0)+' Gbps';
  return Math.round(m)+' Mbps';
}
const esc=s=>String(s==null?'':s).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
const miles=n=>n==null?'—':n.toLocaleString('en-US');

/* ── Motor de dimensionamiento ─────────────────────────────────────────────── */

// Las capas de EdgeConnect, de menor a mayor coste de proceso. La diferencia con FortiGate
// es donde esta el salto: alli la caida grande ocurre al salir del offload del ASIC hacia
// la inspeccion de contenido; aqui ocurre al activar Boost, porque deduplicar y acelerar
// TCP cuesta CPU y no se descarga a silicio dedicado.
const TIERS=[
  {k:'sys',   n:'Sistema',         d:'Tráfico SD-WAN sin cifrar. Cifra de portada del datasheet — casi nunca es el escenario real, porque el overlay va en túnel.'},
  {k:'ipsec', n:'IPsec del fabric',d:'Con los túneles IPsec del overlay activos. En EdgeConnect esta es la cifra que aplica de verdad: todo el tráfico del fabric va cifrado, no es un caso de uso opcional.'},
  {k:'fw',    n:'Firewall / segmentación', d:'Con firewall de zonas y segmentación por overlay aplicados.'},
  {k:'boost', n:'Boost (optimización WAN)', d:'Con deduplicación Network Memory, compresión y aceleración TCP. Es el techo más bajo del equipo — y a la vez lo que menos caudal WAN necesita.'},
];
const TIER_BY_K=Object.fromEntries(TIERS.map(t=>[t.k,t]));

const SEG_MATCH={
  branch:/Sucursal|Teletrabajo/i,
  campus:/Campus|Hub/i,
  dc:/DC|Head-end|Virtual/i,
};

const FAM_LABEL={ec:'EdgeConnect Enterprise',gw:'Gateway SD-Branch serie 9000'};

// Capacidad del modelo en la capa elegida. Con Boost activo el techo es SIEMPRE el de Boost,
// aunque se haya seleccionado una capa mas liviana: no se puede optimizar por encima de lo
// que el appliance puede deduplicar.
function getCap(m){
  const boost=$('chkBoost').checked;
  if(boost) return m.boost;
  const v=m[profile];
  return v!=null?v:m.sys;
}

// Devuelve el tier de suscripcion mas pequeno que cubre el caudal WAN calculado. El
// licenciamiento de EdgeConnect va por ancho de banda del sitio, no por modelo, asi que
// esta es la pieza que conecta el dimensionamiento con la cotizacion.
function tierParaCaudal(mbps){
  const tiers=SIZING.bwTiers||[];
  for(const t of tiers){ if(t.mbps!=null&&t.mbps>=mbps) return t; }
  return tiers[tiers.length-1]||null;
}

function render(){
  const bw=parseFloat($('bw').value)||0;
  const unit=parseFloat($('unit').value);
  const users=parseInt($('users').value)||0;
  const head=(parseFloat($('head').value)||0)/100;
  const sites=parseInt($('sites').value)||0;
  const boost=$('chkBoost').checked;
  $('headVal').textContent=Math.round(head*100)+' %';

  let featurePenalty=1.0;
  if($('chkSeg').checked) featurePenalty+=0.05;
  if($('chkBreakout').checked) featurePenalty+=0.05;

  // needProc: lo que el equipo tiene que PROCESAR (lado LAN, trafico de aplicacion).
  // wanNeed:  lo que tienen que CARGAR los enlaces WAN — y lo que se contrata al operador
  //           y fija el tier de licencia. No son el mismo numero, y confundirlos es el
  //           error de dimensionamiento propio de EdgeConnect:
  //             · Path Conditioning SUMA overhead de paridad FEC sobre el enlace.
  //             · Boost RESTA caudal, porque deduplica y comprime antes de salir.
  const bwBaseMbps=bw*unit*(1+head)*featurePenalty;
  const userBaseMbps=users*3*(1+head)*featurePenalty;
  const needProc=Math.max(bwBaseMbps,userBaseMbps);

  const fec=SIZING.fec[$('fecMode').value]||SIZING.fec.auto;
  const perfil=SIZING.boost.reduccion[$('boostProfile').value]||SIZING.boost.reduccion.generico;
  const factorBoost=boost?perfil.factor:1;
  const wanNeed=needProc*(1+fec.pct)/factorBoost;
  $('fecHint').textContent=fec.d;

  // escala logaritmica
  const maxCap=Math.max(...MODELS.map(m=>m.sys));
  const logP=v=>Math.log10(Math.max(v,10));
  const logMin=Math.log10(10),logMax=logP(maxCap*1.2);
  const xPct=v=>(logP(v)-logMin)/(logMax-logMin)*100;
  const needPct=Math.min(xPct(needProc),99);

  const need=$('need');
  need.style.left=needPct+'%';
  $('needLbl').textContent=fmt(needProc);
  need.classList.toggle('flip',needPct>60);

  const track=$('track');
  track.querySelectorAll('.dot,.tick,.pickLabel').forEach(e=>e.remove());
  const pickLbl=document.createElement('div');
  pickLbl.className='pickLabel'; pickLbl.id='pickLbl'; pickLbl.style.display='none';
  track.appendChild(pickLbl);
  [10,50,100,500,1000,5000,10000,50000].forEach(v=>{
    const pct=xPct(v);if(pct<0||pct>100)return;
    const tick=document.createElement('div');tick.className='tick';tick.style.left=pct+'%';
    tick.innerHTML=`<i></i><b>${v>=1000?v/1000+'G':v+'M'}</b>`;track.appendChild(tick);
  });
  MODELS.forEach(m=>{
    const cap=getCap(m);if(cap==null)return;
    const pct=xPct(cap);if(pct<0||pct>100)return;
    const dot=document.createElement('div');
    dot.className='dot'+(cap>=needProc?' ok':'');
    if(lastPick&&m.id===lastPick.id)dot.className='dot pick';
    dot.style.left=pct+'%';dot.title=m.id+': '+fmt(cap);
    track.appendChild(dot);
  });

  // Candidatos: capacidad de proceso, escala de tuneles del fabric y familia pedida.
  let outByTuns=0,outByBoost=0;
  const candidates=MODELS.filter(m=>{
    if(m.eol) return false;
    if(famMode!=='any'&&m.fam!==famMode) return false;
    if(boost&&m.boost==null){ outByBoost++; return false; }
    const cap=getCap(m);
    if(cap==null||cap<needProc) return false;
    if(sites&&m.tuns<sites){ outByTuns++; return false; }
    return true;
  }).sort((a,b)=>getCap(a)-getCap(b));
  const rx=SEG_MATCH[segMode];
  const pick=(rx&&candidates.find(m=>rx.test(m.seg)))||candidates[0]||null;
  lastPick=pick;
  sincronizarConBom(pick);

  const tier=tierParaCaudal(wanNeed);
  if(tier&&$('bwTier').value!==tier.code&&!$('bwTier').dataset.tocado) $('bwTier').value=tier.code;

  if(!pick){
    $('vModel').textContent='Sin candidato';
    $('verdict').style.borderLeftColor='var(--amber)';
    const why=[];
    why.push(`<li>Requerimiento de proceso <b>${fmt(needProc)}</b> en la capa <b>${esc(TIER_BY_K[boost?'boost':profile].n)}</b>.</li>`);
    if(outByBoost) why.push(`<li><b>${outByBoost}</b> modelo(s) descartado(s) por pedir Boost: los gateways SD-Branch de la serie 9000 no hacen optimización WAN. Boost es exclusivo de EdgeConnect Enterprise.</li>`);
    if(outByTuns) why.push(`<li><b>${outByTuns}</b> modelo(s) descartado(s) por escala de fabric: hacen falta ${miles(sites)} túneles.</li>`);
    if(boost) why.push('<li>Estás dimensionando contra el techo de Boost, que es el más bajo del equipo. Si la optimización no hace falta en todas las sedes, licenciar el pool solo donde el tráfico lo justifique y dimensionar el resto sin Boost.</li>');
    why.push('<li>Por encima del catálogo: repartir el fabric en varios head-ends o escalar con EC-V en el datacenter.</li>');
    $('vFamily').textContent='Ningún modelo cumple todas las restricciones';
    $('vWhy').innerHTML=`<ul style="margin:0;padding-left:18px;font-size:13.5px">${why.join('')}</ul>`;
    $('perfTiers').innerHTML='';
    $('sizingBox').innerHTML='<p style="font-size:13.5px;color:var(--steel)">Sin candidato para los parámetros actuales.</p>';
    return;
  }
  $('verdict').style.borderLeftColor='var(--red)';
  $('vModel').textContent=pick.id;
  $('vFamily').textContent=pick.seg+' · '+FAM_LABEL[pick.fam];
  $('pickLbl').textContent=pick.id;$('pickLbl').style.display='block';
  $('pickLbl').style.left=xPct(getCap(pick))+'%';

  const setPct=(id,val,cap)=>{const pct=cap>0?Math.min(val/cap*100,100):0;const bar=$(id);bar.style.width=pct+'%';bar.className=pct>90?'tight':pct<70?'good':'';};
  $('mCapLbl').innerHTML=`Capa ${esc(TIER_BY_K[boost?'boost':profile].n)} <em id="mCapVal"></em>`;
  $('mCapVal').textContent=fmt(needProc)+' / '+fmt(getCap(pick));
  setPct('mCapBar',needProc,getCap(pick));
  $('mSessVal').textContent=(sites?miles(sites)+' / ':'')+miles(pick.tuns)+' túneles';
  setPct('mSessBar',sites,pick.tuns);
  renderTiers(pick,needProc);

  const flags=[];
  flags.push(`<b>Caudal WAN a contratar:</b> ${fmt(wanNeed)}${fec.pct?` (incluye ${Math.round(fec.pct*100)}% de paridad FEC)`:''}${boost?` tras la reducción ${perfil.factor}:1 de Boost sobre ${esc(perfil.n.toLowerCase())}`:''}. Tier de suscripción sugerido: <b>${tier?esc(tier.n):'—'}</b>.`);
  if(boost)flags.push(`<b>Boost:</b> el techo de proceso baja a ${fmt(pick.boost)}, pero el enlace transporta ${fmt(wanNeed)} en vez de ${fmt(needProc*(1+fec.pct))}. El pool se licencia a nivel de fabric y Orchestrator lo reparte, así que se compra para las sedes que lo aprovechan, no para todas.`);
  else if(pick.boost!=null)flags.push(`Este modelo admite Boost hasta ${fmt(pick.boost)}. Merece evaluarse si el tráfico es repetitivo (réplicas, backups, VDI, CIFS/SMB): reduce el caudal WAN contratado, que suele pesar más en el TCO que el propio equipo.`);
  if(pick.fam==='gw')flags.push('<b>SD-Branch:</b> el mismo equipo termina la WAN y actúa de controladora de APs, aplicando Dynamic Segmentation con el rol de usuario que traen el switch CX o el AP. No hace optimización WAN — si hace falta Boost, la respuesta es EdgeConnect.');
  if($('chkSeg').checked)flags.push('La segmentación multi-overlay (una VRF por intención de negocio) requiere <b>EdgeConnect Advanced</b>: Base no la incluye.');
  if($('chkBreakout').checked)flags.push('La salida directa a Internet con First-packet iQ y el service chaining hacia un SSE (Zscaler, Netskope) también son de <b>Advanced</b>.');
  if($('chkHa').checked)flags.push('<b>HA:</b> se cotizan 2 unidades y cada una lleva su propia suscripción — la licencia de sitio no se comparte entre el par.');
  const alts=candidates.filter(m=>m.id!==pick.id).slice(0,3).map(m=>m.id);

  $('vWhy').innerHTML=`<ul style="margin:8px 0 0;padding-left:18px;font-size:13.5px">
    <li>Proceso requerido <b>${fmt(needProc)}</b> contra capacidad <b>${fmt(getCap(pick))}</b> — headroom ${Math.round((1-needProc/getCap(pick))*100)}%</li>
    <li>Túneles del fabric: <b>${miles(pick.tuns)}</b> | Flujos: <b>${miles(pick.flows)}</b> | Interfaces: ${esc(pick.ifaces)}</li>
    ${flags.map(f=>`<li>${f}</li>`).join('')}
    ${alts.length?`<li>Alternativas que también cumplen: <b>${esc(alts.join(', '))}</b></li>`:''}
  </ul>`;

  $('sizingBox').innerHTML=`
    <table><tbody>
      <tr><td>Capa dimensionada</td><td class="n">${esc(TIER_BY_K[boost?'boost':profile].n)}</td></tr>
      <tr><td>Optimización WAN (Boost)</td><td class="n">${boost?`Activa — reducción ${perfil.factor}:1 (${esc(perfil.n)})`:'No'}</td></tr>
      <tr><td>Path Conditioning (FEC)</td><td class="n">${esc(fec.n)}${fec.pct?` — +${Math.round(fec.pct*100)}% de overhead`:''}</td></tr>
      <tr><td>Ancho de banda de aplicación</td><td class="n">${fmt(bw*unit)}</td></tr>
      <tr><td>Usuarios estimados</td><td class="n">${users}</td></tr>
      <tr><td><b>Proceso requerido en el equipo</b></td><td class="n"><b>${fmt(needProc)}</b></td></tr>
      <tr><td><b>Caudal WAN a contratar</b></td><td class="n"><b>${fmt(wanNeed)}</b></td></tr>
      <tr><td>Tier de suscripción sugerido</td><td class="n">${tier?esc(tier.n):'—'}</td></tr>
      <tr><td>Sitios en el fabric</td><td class="n">${sites?miles(sites)+' / '+miles(pick.tuns)+' túneles':'sin restricción'}</td></tr>
      <tr><td>Unidades a cotizar</td><td class="n">${$('chkHa').checked?'2 (HA) — licencia por unidad':'1'}</td></tr>
    </tbody></table>`;
}

// Escalera de capas: las cuatro cifras del modelo a la vez, en escala relativa al sistema.
// Hace visible donde esta el salto real de EdgeConnect — al activar Boost, no al cifrar.
function renderTiers(m,need){
  const boost=$('chkBoost').checked;
  const top=m.sys||1;
  const activeK=boost?'boost':profile;
  $('perfModel').textContent='— '+m.id;
  $('perfTiers').innerHTML=TIERS.map((t,i)=>{
    const v=m[t.k];
    if(v==null) return t.k==='boost'
      ? `<div class="tierRow off" title="Los gateways SD-Branch no hacen optimización WAN."><span class="tn">${esc(t.n)}</span><span class="tb"></span><span class="tv">no aplica</span></div>`
      : '';
    const on=t.k===activeK;
    const prev=i>0?m[TIERS[i-1].k]:null;
    const drop=prev&&v&&prev>v?Math.round((1-v/prev)*100):0;
    return `${drop>=50?`<div class="tierDrop">&#8595; ${drop}% al activar la optimización WAN</div>`:''}
      <div class="tierRow ${on?'on':'off'}" title="${esc(t.d)}">
        <span class="tn">${esc(t.n)}</span>
        <span class="tb"><i style="width:${Math.max(2,v/top*100)}%"></i></span>
        <span class="tv">${fmt(v)}</span>
      </div>`;
  }).join('');
  const ratio=m.boost?Math.round(m.sys/m.boost):0;
  $('perfNote').innerHTML=m.boost
    ? `Del throughput de sistema a Boost hay un factor <b>${ratio}x</b> en este modelo (${fmt(m.sys)} &rarr; ${fmt(m.boost)}). `
      + 'Es el compromiso central de EdgeConnect: se paga capacidad de proceso a cambio de caudal WAN, que suele ser el recurso caro. '
      + `Requerimiento actual: <b>${fmt(need)}</b>.`
    : `Este modelo es un gateway SD-Branch: no hace optimización WAN. Su ventaja está en la convergencia del acceso `
      + `—WAN, LAN y WLAN en el mismo equipo, con Dynamic Segmentation extremo a extremo— no en el ahorro de caudal. `
      + `Requerimiento actual: <b>${fmt(need)}</b>.`;
}

/* BOM */
function populateSelects(){
  $('pickModel').innerHTML=MODELS.map(m=>`<option value="${esc(m.id)}">${esc(m.id)} — ${esc(m.seg)}</option>`).join('');
  $('bwTier').innerHTML=(SIZING.bwTiers||[]).map(t=>`<option value="${esc(t.code)}">${esc(t.n)}</option>`).join('');
  $('boostPool').innerHTML='<option value="">Sin Boost</option>'
    +(SIZING.boost.pools||[]).map(p=>`<option value="${esc(p.code)}">${esc(p.n)}</option>`).join('');
  $('licBundle').innerHTML=Object.entries(BUNDLES).map(([k,b])=>`<option value="${esc(k)}"${k==='advanced'?' selected':''}>${esc(b.n)}</option>`).join('');
  $('careLevel').innerHTML=Object.entries(CARE).map(([k,c])=>`<option value="${esc(k)}"${k==='tcess'?' selected':''}>${esc(c.n)}</option>`).join('');
  $('bwTier').addEventListener('change',()=>{$('bwTier').dataset.tocado='1';});
}

const money=n=>n==null?null:'$'+n.toLocaleString('en-US',{maximumFractionDigits:2});
function tierPrice(t,termYrs){
  if(!t) return null;
  const v=termYrs===1?t.y1:termYrs===5?t.y5:t.y3;
  return v==null?null:v;
}

function renderBom(){
  const m=MODELS.find(x=>x.id===$('pickModel').value)||MODELS[0];
  if(!m) return;
  const qty=Math.max(1,parseInt($('qty').value)||1);
  const termYrs=parseInt($('termYears').value)||3;
  const bundle=$('licBundle').value||'advanced';
  const care=$('careLevel').value||'tcess';
  const bwCode=$('bwTier').value;
  const bwTier=(SIZING.bwTiers||[]).find(t=>t.code===bwCode)||null;
  const poolCode=$('boostPool').value;
  const pool=poolCode?(SIZING.boost.pools||[]).find(p=>p.code===poolCode):null;

  const lic=LICENSES[bwCode]||null;
  const licTier=lic?lic[bundle]:null;
  const careTier=lic?lic.care[care]:null;
  const licPrice=tierPrice(licTier,termYrs);
  const carePrice=tierPrice(careTier,termYrs);
  const termino=`término ${termYrs} año${termYrs>1?'s':''}`;

  let html=`<section class="panel"><h2>Ficha del equipo</h2>
    <div class="model" style="font-size:28px">${esc(m.id)}</div>
    <p class="family">${esc(m.seg)} · ${esc(FAM_LABEL[m.fam])}</p>
    <div class="scroll"><table><thead><tr><th>Métrica</th><th>Valor</th></tr></thead><tbody>
    <tr><td>SKU hardware</td><td class="n">${m.hwSku?`<code>${esc(m.hwSku)}</code>`:'<span class="warn">Sin SKU verificado — confirmar con el distribuidor</span>'}</td></tr>
    <tr><td>Precio de lista ref. (equipo)</td><td class="n">${m.elpN!=null?esc(m.elp):'Consultar distribuidor'}</td></tr>
    <tr><td>Throughput de sistema</td><td class="n">${fmt(m.sys)}</td></tr>
    <tr><td><b>IPsec del fabric</b></td><td class="n"><b>${fmt(m.ipsec)}</b> <span class="warn">(la cifra que aplica en un overlay real)</span></td></tr>
    <tr><td>Firewall / segmentación</td><td class="n">${fmt(m.fw)}</td></tr>
    <tr><td>Boost (optimización WAN)</td><td class="n">${m.boost!=null?fmt(m.boost):'<span class="warn">No aplica — los gateways SD-Branch no optimizan WAN</span>'}</td></tr>
    <tr><td>Túneles del fabric</td><td class="n">${miles(m.tuns)}</td></tr>
    <tr><td>Flujos concurrentes</td><td class="n">${miles(m.flows)}</td></tr>
    <tr><td>Interfaces</td><td>${esc(m.ifaces)}</td></tr>
    </tbody></table></div>
    </section>`;

  html+=`<section class="panel"><h2>Suscripción EdgeConnect</h2><ul class="clean">
    <li class="on"><b>${esc(BUNDLES[bundle].n)}</b><span class="req">Requerida</span><span class="sku">${esc(BUNDLES[bundle].svcs)}<br>Tier de caudal: <b>${bwTier?esc(bwTier.n):'—'}</b> · ${termino}${licPrice!=null?' · '+money(licPrice):' · <span class="warn">precio no verificado — consultar distribuidor</span>'}</span></li>
    <li${pool?' class="on"':''}><b>${esc(SIZING.boost.n)}</b><span class="req${pool?'':' opt'}">${pool?'Incluido':'Opcional'}</span><span class="sku">${esc(SIZING.boost.svcs)}${pool?`<br>Pool seleccionado: <b>${esc(pool.n)}</b> — se licencia una vez para todo el fabric, no por sede.`:''}</span></li>
    <li><b>EdgeConnect Orchestrator</b><span class="req opt">Incluido</span><span class="sku">Gestión centralizada del fabric, Business Intent Overlays y ZTP. No se licencia por dispositivo gestionado.</span></li>
  </ul></section>`;

  html+=`<section class="panel"><h2>Soporte HPE</h2><div class="scroll"><table>
    <thead><tr><th>Servicio</th><th>SLA</th><th>SKU</th><th>Término</th><th>Precio ref. c/u</th><th>Qty</th></tr></thead><tbody>
    <tr><td>${esc(CARE[care].n)}</td><td class="n">${esc(CARE[care].sla)}</td><td class="n">${careTier&&careTier.sku?`<code>${esc(careTier.sku)}</code>`:'<span class="warn">Sin SKU verificado</span>'}</td><td class="n">${termYrs} años</td><td class="n">${carePrice!=null?money(carePrice):'—'}</td><td class="n">${qty}</td></tr>
    </tbody></table></div>
    <p class="hint" style="margin-top:8px">${esc(CARE[care].d)}</p></section>`;

  $('bomBody').innerHTML=html;

  // Filas del BOM en el formato compartido de /js/bom.js. La suscripcion de sitio y el
  // soporte multiplican por la cantidad igual que el hardware —en HA cada nodo lleva la
  // suya—, pero el pool de Boost NO: es un caudal agregado del fabric, se compra una vez.
  const filas=[
    {cat:'Equipo', desc:m.id, sku:m.hwSku||null, qty, unit:m.elpN!=null?m.elpN:null,
     nota:`${m.seg} · ${FAM_LABEL[m.fam]} · ${m.ifaces}`},
    {cat:'Suscripción SD-WAN', desc:`${BUNDLES[bundle].n} — ${bwTier?bwTier.n:'tier por definir'}`, sku:licTier&&licTier.sku?licTier.sku:null, qty, unit:licPrice,
     nota:`${termino} · suscripción por sitio y caudal, no por modelo de appliance`},
  ];
  if(pool){
    filas.push({cat:'Aceleración', desc:`${SIZING.boost.n} — ${pool.n}`, sku:null, qty:1, unit:null,
      nota:'Pool agregado del fabric: se compra una vez y Orchestrator lo reparte entre sedes. No multiplica por unidad.'});
  }
  filas.push({cat:'Soporte', desc:CARE[care].n, sku:careTier&&careTier.sku?careTier.sku:null, qty, unit:carePrice,
    nota:`${termino} · ${CARE[care].sla}`});

  const meta={
    titulo:`Lista de materiales — ${m.id}`,
    subtitulo:`${m.seg} · ${FAM_LABEL[m.fam]} · ${termino}`,
    archivo:`BOM_${m.id}`,
    notas:[
      '',
      'CAPACIDAD POR CAPA',
      `  Throughput de sistema:        ${fmt(m.sys)}`,
      `  IPsec del fabric:             ${fmt(m.ipsec)}   <- dimensionar con este valor`,
      `  Firewall / segmentacion:      ${fmt(m.fw)}`,
      `  Boost (optimizacion WAN):     ${m.boost!=null?fmt(m.boost):'no aplica'}`,
      `  Tuneles del fabric:           ${miles(m.tuns)}`,
      `  Flujos concurrentes:          ${miles(m.flows)}`,
      '',
      'COMO SE LICENCIA EDGECONNECT',
      '  La suscripcion va por CAUDAL DEL SITIO, no por modelo de appliance: subir de tier',
      '  no obliga a cambiar el hardware mientras el equipo de la talla. Boost es un add-on',
      '  licenciado como POOL agregado del fabric y repartido por Orchestrator, asi que se',
      '  compra solo para las sedes que lo aprovechan.',
      '',
      'ADVERTENCIA DE DATOS',
      '  SKU y precios de Aruba NO estan verificados contra un price list firmado. Las cifras',
      '  de throughput provienen de datasheet publico y sirven para descartar modelos cortos,',
      '  no para comprometer un numero. Confirmar todo con el distribuidor HPE autorizado',
      '  antes de emitir la propuesta.',
      qty>1?`Par de ${qty} unidades: la suscripcion de sitio no se comparte, cada nodo lleva la suya.`:null,
    ].filter((n)=>n!==null),
  };

  $('bomTabla').innerHTML=BOM.renderTabla(filas,{
    aviso:'Precios y SKU de Aruba pendientes de verificación contra price list — las líneas figuran sin cotizar a propósito.',
  });
  $('bomOut').value=BOM.comoTexto(filas,meta);
  bomMeta=meta; bomFilas=filas;
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
  const res = await fetch('/api/dimensionador/aruba');
  const data = await res.json();
  MODELS = data.models;
  BUNDLES = data.bundles;
  CARE = data.care;
  LICENSES = data.licenses;
  SIZING = data.sizing;

  populateSelects();
  render();
  renderBom();
})();

/* Enlace de eventos movido desde onclick= en el HTML, para permitir una CSP con
   script-src 'self' que bloquea todo codigo en linea. */
document.addEventListener('click', (e) => {
  const abrir = e.target.closest('[data-abrir]');
  if (abrir) { window.open(abrir.dataset.abrir, '_blank'); return; }
  const id = e.target.closest('button,[id]')?.id;
  if (id === 'btnImprimir') window.print();
});
