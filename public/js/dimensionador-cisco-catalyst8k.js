'use strict';
/* ═══════════════════════════════════════
   DATA
   ═══════════════════════════════════════ */
let bomFilas=[], bomMeta={};

// El modelo recomendado se lleva solo a la pestana de BOM, y solo cuando la recomendacion
// CAMBIA: asi una eleccion manual para comparar no se pisa al mover un parametro.
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

let MODELS = [];
let OPTICS = {};
let OPTIC_LABEL = {};
let PARTS_DESC = {};
let SMARTNET = {};
let DNA_DESC = {};

const $ = id => document.getElementById(id);
let dirMult=2, mode='link', crit='low', lastPick=null;

/* ── Tabs ── */
document.querySelectorAll('.tabs button').forEach(b => b.addEventListener('click', () => {
  document.querySelectorAll('.tabs button').forEach(x => x.setAttribute('aria-selected', x===b));
  ['calc','bom','optics'].forEach(t => $('pane-'+t).hidden = (t !== b.dataset.tab));
}));

/* ── Mode ── */
$('modeSeg').addEventListener('click', e => {
  const b=e.target.closest('button'); if(!b) return;
  [...$('modeSeg').children].forEach(x=>x.setAttribute('aria-pressed',x===b));
  mode=b.dataset.v;
  $('aggBlock').classList.toggle('hidden', mode!=='agg');
  $('bwLabel').textContent = mode==='agg' ? 'Ancho de banda por sucursal' : mode==='hub' ? 'Tráfico agregado del hub' : 'Ancho de banda contratado';
  $('modeHint').textContent = mode==='agg' ? 'Suma los enlaces de todas las sucursales con su factor de simultaneidad.' : mode==='hub' ? 'Capacidad total que debe procesar el hub o DC edge.' : 'Un solo enlace WAN terminando en el equipo.';
  render();
});
$('dirSeg').addEventListener('click', e => {
  const b=e.target.closest('button'); if(!b) return;
  [...$('dirSeg').children].forEach(x=>x.setAttribute('aria-pressed',x===b));
  dirMult=+b.dataset.v; render();
});
$('critSeg').addEventListener('click', e => {
  const b=e.target.closest('button'); if(!b) return;
  [...$('critSeg').children].forEach(x=>x.setAttribute('aria-pressed',x===b));
  crit=b.dataset.v; render();
});
['bw','unit','sites','conc','head','profile','aps','sNgfw','sVoice','sAppx','sUmbrella','chkRedund','chk4g']
  .forEach(id => $(id).addEventListener('input', render));
['pickModel','qty','nimQty','optQty','termYears','dnaTier'].forEach(id => $(id).addEventListener('input', renderBom));

/* ── Helpers ── */
function fmt(m){
  if(m==null||m===0) return '—';
  if(m>=1000000) return (m/1e6).toFixed(1).replace(/\.0$/,'')+' Tbps';
  if(m>=1000) return (m/1000).toFixed(m%1000?1:0)+' Gbps';
  return Math.round(m)+' Mbps';
}
const esc=s=>String(s).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));

/* ── RENDER CALC ── */
function render(){
  const bw=parseFloat($('bw').value)||0;
  const unit=parseFloat($('unit').value);
  const head=(parseFloat($('head').value)||0)/100;
  const conc=(parseFloat($('conc').value)||40)/100;
  const sites=parseInt($('sites').value)||1;
  const profile=$('profile').value;

  $('headVal').textContent=Math.round(head*100)+' %';
  $('concVal').textContent=Math.round(conc*100)+' %';

  // base throughput
  let baseMbps = bw * unit;
  if(mode==='agg') baseMbps = bw * unit * sites * conc;
  let needMbps = baseMbps * dirMult * (1+head);

  // service penalties
  let penalty = 1.0;
  if($('sNgfw').checked) penalty += 0.15;
  if($('sVoice').checked) penalty += 0.10;
  if($('sAppx').checked) penalty += 0.08;
  if($('sUmbrella').checked) penalty += 0.12;
  needMbps *= penalty;

  // update needle
  const allCaps = MODELS.map(m => profile==='ipsec' ? m.ipsec : profile==='sdwan' ? (m.sdwan||m.ipsec) : m.fwd);
  const maxCap = Math.max(...allCaps);
  const logP = v => Math.log10(Math.max(v,10));
  const logMin=Math.log10(10), logMax=logP(maxCap*1.2);
  const xPct = v => (logP(v)-logMin)/(logMax-logMin)*100;
  const needPct = Math.min(xPct(needMbps),99);
  const need=$('need');
  need.style.left=needPct+'%';
  $('needLbl').textContent=fmt(needMbps);
  need.classList.toggle('flip', needPct>60);

  // build track
  renderTrack(profile, needMbps, xPct, needPct);

  // pick model
  const candidates = MODELS.filter(m => {
    const cap = profile==='ipsec' ? m.ipsec : profile==='sdwan' ? (m.sdwan||m.ipsec) : m.fwd;
    return cap >= needMbps;
  });
  const pick = candidates.length ? candidates[0] : null;
  lastPick = pick;
  sincronizarConBom(pick);

  const verdict=$('verdict');
  if(!pick){
    $('vModel').textContent='Supera el catálogo';
    $('vFamily').textContent='Considerar ASR 9000 o Catalyst 9800 con capacidad adicional';
    verdict.style.borderLeftColor='var(--amber)';
    $('vWhy').innerHTML='<p class="warn">El requerimiento supera la capacidad máxima del catálogo configurado. Escalar a ASR 9000 o consultar solución personalizada.</p>';
    ['mFwd','mIpsec','mSdwan'].forEach(id => { $('m'+id.slice(1)+'Bar').style.width='0%'; });
    return;
  }
  verdict.style.borderLeftColor='var(--red)';
  $('vModel').textContent=pick.id;
  $('vFamily').textContent=pick.fam+' · Serie '+pick.ser;
  $('pickLbl').textContent=pick.id; $('pickLbl').style.display='block';
  $('pickLbl').style.left=xPct(profile==='ipsec'?pick.ipsec:profile==='sdwan'?(pick.sdwan||pick.ipsec):pick.fwd)+'%';

  const setPct=(id,val,cap)=>{
    const pct=cap>0?Math.min(val/cap*100,100):0;
    const bar=$(id);
    bar.style.width=pct+'%';
    bar.className=pct>90?'tight':pct<70?'good':'';
  };
  $('mFwdVal').textContent=fmt(needMbps)+' / '+fmt(pick.fwd);
  setPct('mFwdBar', needMbps, pick.fwd);
  $('mIpsecVal').textContent=fmt(profile==='ipsec'?needMbps:0)+' / '+fmt(pick.ipsec);
  setPct('mIpsecBar', profile==='ipsec'?needMbps:0, pick.ipsec);
  const sdwanCap=pick.sdwan||pick.ipsec;
  $('mSdwanVal').textContent=fmt(profile==='sdwan'?needMbps:0)+' / '+fmt(sdwanCap);
  setPct('mSdwanBar', profile==='sdwan'?needMbps:0, sdwanCap);

  const flags=[];
  if($('sNgfw').checked) flags.push('Zona-Based Firewall añade ~15% de carga de procesamiento.');
  if($('sVoice').checked) flags.push('CUBE/SIP añade ~10% por procesamiento de señalización de voz.');
  if($('sAppx').checked) flags.push('NBAR/AppX añade ~8% por clasificación de tráfico.');
  if($('sUmbrella').checked) flags.push('Umbrella SIG añade ~12% por encapsulación de túneles.');
  if($('chkRedund').checked && !pick.redund) flags.push('<span class="warn">Este modelo no tiene redundancia de fuente de serie — verificar disponibilidad de kit de expansión.</span>');
  if($('chk4g').checked && !pick.lte) flags.push('Se requiere módulo NIM LTE adicional (NIM-4G-LTE-LA o similar).');

  const alts = candidates.slice(1,4).map(m=>m.id);
  $('vWhy').innerHTML = `
    <ul style="margin:8px 0 0;padding-left:18px;font-size:13.5px">
      <li>Requerimiento con margen: <b>${fmt(needMbps)}</b> | Capacidad del equipo: <b>${fmt(profile==='ipsec'?pick.ipsec:profile==='sdwan'?(pick.sdwan||pick.ipsec):pick.fwd)}</b></li>
      <li>Puertos: ${pick.ports}</li>
      ${flags.map(f=>`<li>${f}</li>`).join('')}
      ${alts.length ? '<li>Alternativas a evaluar: <b>'+alts.join(', ')+'</b></li>' : ''}
    </ul>`;

  // Support
  const s=SMARTNET[crit];
  $('suppBox').innerHTML=`
    <div style="font-family:'Barlow Condensed',sans-serif;font-weight:700;font-size:22px;text-transform:uppercase;margin-bottom:4px">${s.n}</div>
    <p style="font-family:'IBM Plex Mono',monospace;font-size:11px;margin-bottom:10px"><span class="pillc">${s.sla}</span> · término 12 meses · ${pick.id}</p>
    <p style="font-size:13.5px;margin:0">${s.d}</p>`;

  // DNA
  const dnaSel=$('dnaTier').value||'adv';
  const dnaLetter={ess:'E',adv:'A',pre:'P'}[dnaSel];
  const dnaWarn = (dnaSel==='ess' && pick.id.includes('8500')) ? '<li><span class="warn">Catalyst 8500 no soporta DNA Essentials — requiere Advantage como mínimo.</span></li>' : '';
  $('licBox').innerHTML=`
    <ul class="clean">
      <li class="on"><b>${{'ess':'DNA Essentials','adv':'DNA Advantage','pre':'DNA Premier'}[dnaSel]}</b><span class="req">Requerida</span><span class="sku">${DNA_DESC[dnaSel]}<br>SKU real: <code>DNA-C-T&lt;n&gt;-${dnaLetter}-${$('termYears')?$('termYears').value:3}Y</code> (n = tier de ancho de banda, confirmar en CCW)</span></li>
      ${dnaWarn}
      <li><b>HSEC (High Security)</b><span class="req opt">Según país</span><span class="sku">Requerida para exportación de criptografía fuerte en países restringidos. Verificar con Cisco GSSO.</span></li>
      <li><b>IP Base → IP Services (IOS XE)</b><span class="req opt">Nota</span><span class="sku">En ISR 4000 el throughput máximo se alcanza solo con licencia IP Services o AppX habilitada.</span></li>
    </ul>`;
}

function renderTrack(profile, needMbps, xPct, needPct){
  const track=$('track');
  // clear old dots
  track.querySelectorAll('.dot,.tick,.pickLabel').forEach(e=>e.remove());
  const pickLbl=document.createElement('div');
  pickLbl.className='pickLabel'; pickLbl.id='pickLbl'; pickLbl.style.display='none';
  track.appendChild(pickLbl);
  const axis=track.querySelector('.axis');

  const ticks=[10,100,1000,2000,5000,10000,20000,50000,100000];
  ticks.forEach(v=>{
    const pct=xPct(v); if(pct<0||pct>100) return;
    const tick=document.createElement('div'); tick.className='tick';
    tick.style.left=pct+'%';
    tick.innerHTML=`<i></i><b>${v>=1000?v/1000+'G':v+'M'}</b>`;
    track.appendChild(tick);
  });

  const shapes={isr1000:'dot', isr4000:'dot', cat8000:'dot wan', asr1000:'dot'};
  MODELS.forEach(m=>{
    const cap=profile==='ipsec'?m.ipsec:profile==='sdwan'?(m.sdwan||m.ipsec):m.fwd;
    const pct=xPct(cap); if(pct<0||pct>100) return;
    const dot=document.createElement('div');
    const isWan=m.ser.includes('ASR');
    dot.className='dot'+(isWan?' wan':'')+(cap>=needMbps?' ok':'');
    if(lastPick&&m.id===lastPick.id) dot.className='dot pick';
    dot.style.left=pct+'%';
    dot.title=m.id+': '+fmt(cap);
    track.appendChild(dot);
  });
}

/* ── RENDER BOM ── */
function renderBom(){
  const m=MODELS.find(x=>x.id===$('pickModel').value)||MODELS[0];
  const qty=Math.max(1,parseInt($('qty').value)||1);
  const nimQty=Math.max(0,parseInt($('nimQty').value)||0);
  const optQty=Math.max(0,parseInt($('optQty').value)||0);
  const termYrs=parseInt($('termYears').value)||3;
  const dnaTier=$('dnaTier').value||'adv';

  let html=`<section class="panel"><h2>Ficha del equipo</h2>
    <div class="model" style="font-size:28px">${m.id}</div>
    <p class="family">${m.fam} · Serie ${m.ser}</p>
    <div class="scroll"><table><thead><tr><th>Concepto</th><th>Valor</th></tr></thead><tbody>
    <tr><td>Designación de pedido</td><td><code>${esc(m.id)}</code>${m.hwSku?` <code>${esc(m.hwSku)}</code>`:''}</td></tr>
    <tr><td>Precio de lista ref. (equipo)</td><td class="n">${m.elp?esc(m.elp)+' (CCW)':'Consultar CCW'}</td></tr>
    <tr><td>Forwarding (bidireccional IMIX)</td><td class="n">${fmt(m.fwd)}</td></tr>
    <tr><td>IPsec VPN (IMIX)</td><td class="n">${fmt(m.ipsec)}</td></tr>
    <tr><td>SD-WAN (IPsec + AppFlow, IMIX)</td><td class="n">${m.sdwan?fmt(m.sdwan):(m.ser.includes('ISR')?'N/A — usar ISR+DNA Advantage':fmt(m.ipsec)+' (cifra IPsec — sin throughput SD-WAN diferenciado publicado)')}</td></tr>
    <tr><td>Puertos y slots</td><td>${m.ports}</td></tr>
    <tr><td>Slots NIM disponibles</td><td class="n">${m.nim}</td></tr>
    <tr><td>Slots SM disponibles</td><td class="n">${m.sm||0}</td></tr>
    <tr><td>Redundancia de fuente de serie</td><td>${m.redund?'Sí':'No (kit opcional)'}</td></tr>
    <tr><td>LTE integrado</td><td>${m.lte?'Sí':'No (NIM-4G-LTE-LA)'}</td></tr>
    </tbody></table></div>
    ${m.eolAnnounced?`<p class="hint warn" style="margin-top:10px">Fin de venta anunciado (PID <code>${esc(m.eolAnnounced.pid)}</code>) — último día de pedido: <b>${esc(m.eolAnnounced.lastOrder)}</b>. Sucesor confirmado: <b>Cisco Secure Router (G2)</b> — mismo IOS XE SD-WAN, ver familia "Secure Router (G2)" en el selector de equipo.</p>`:''}
    </section>`;

  // Parts
  const parts=(m.parts||[]);
  if(parts.length){
    html+=`<section class="panel"><h2>Componentes y módulos</h2><div class="scroll"><table>
    <thead><tr><th>PID / Descripción</th><th>Tipo</th></tr></thead><tbody>
    ${parts.map(p=>`<tr><td><code>${esc(p)}</code><span class="sku">${PARTS_DESC[p]||''}</span></td>
    <td>${p.startsWith('LIC')||p.startsWith('DNA')?'Licencia':'Módulo hardware'}</td></tr>`).join('')}
    </tbody></table></div></section>`;
  }

  // Optics
  html+=`<section class="panel"><h2>Módulos ópticos compatibles</h2>`;
  (m.optics||[]).forEach(k=>{
    html+=`<div class="grp"><h3>${OPTIC_LABEL[k]}</h3>
    <p class="gd">Cantidad estimada: <b>${optQty*qty}</b> módulos (${optQty} por equipo × ${qty}).</p>
    <div class="scroll"><table><thead><tr><th>PID Cisco</th><th>SKU legacy</th><th>Descripción</th></tr></thead><tbody>
    ${OPTICS[k].map(o=>`<tr><td><code>${esc(o.bom)}</code></td><td><code>${esc(o.sku)}</code></td><td>${esc(o.d)}</td></tr>`).join('')}
    </tbody></table></div></div>`;
  });
  html+=`<p class="hint">Para entornos con SD-WAN y vManage, se recomienda usar únicamente ópticas genuinas Cisco para evitar alertas en inventario y soporte TAC sin restricciones.</p></section>`;

  // Licenses
  const dnaLetterBom={ess:'E',adv:'A',pre:'P'}[dnaTier];
  html+=`<section class="panel"><h2>Licencias DNA y suscripciones</h2><ul class="clean">
    <li class="on"><b>Cisco DNA ${{'ess':'Essentials','adv':'Advantage','pre':'Premier'}[dnaTier]}</b><span class="req">Requerida</span><span class="sku">${DNA_DESC[dnaTier]} · término ${termYrs} años<br>SKU real: <code>DNA-C-T&lt;n&gt;-${dnaLetterBom}-${termYrs}Y</code> (n = tier de ancho de banda T0–T3+ según throughput del modelo, confirmar en CCW/ordering guide)</span></li>
    ${(dnaTier==='ess' && m.id.includes('8500'))?'<li><span class="warn">Catalyst 8500 no soporta DNA Essentials — requiere Advantage como mínimo.</span></li>':''}
    <li class="on"><b>IOS XE SD-WAN</b><span class="req">Requerida</span><span class="sku">Sistema operativo base incluido con DNA license. Validar versión mínima para Catalyst 8000: IOS XE 17.x SD-WAN mode.</span></li>
    <li><b>HSEC — High Security</b><span class="req opt">Según país</span><span class="sku">Requerida para exportaciones a países con control criptográfico. Verificar con Cisco Global Security Sales Operations.</span></li>
    <li><b>AppX / Application Experience</b><span class="req opt">Opcional</span><span class="sku">Para ISR 4000: habilita NBAR2, PfR, AppFlow y Performance Routing. Incluida en DNA Advantage.</span></li>
  </ul></section>`;

  // Support
  const s=SMARTNET['med'];
  html+=`<section class="panel"><h2>Soporte — SMARTnet</h2><div class="scroll"><table>
    <thead><tr><th>Servicio</th><th>SLA</th><th>Término</th><th>Cantidad</th></tr></thead><tbody>
    <tr><td>${s.n}</td><td class="n">${s.sla}</td><td class="n">${termYrs} años</td><td class="n">${qty}</td></tr>
    <tr><td>SW Support (SWSS)</td><td class="n">Actualizaciones IOS XE</td><td class="n">${termYrs} años</td><td class="n">${qty}</td></tr>
    </tbody></table></div></section>`;

  $('bomBody').innerHTML=html;

  // Plain BOM
  // Filas del BOM en el formato compartido de /js/bom.js. Cisco publica PID pero el precio
  // definitivo vive en CCW, asi que muchas lineas salen deliberadamente sin cotizar.
  const filas=[
    {cat:'Equipo', desc:m.id, sku:m.hwSku||null, qty, unit:m.elpN!=null?m.elpN:null,
     nota:`${m.fam} · Serie ${m.ser} · ${m.ports}${m.eolAnnounced?' · FIN DE VENTA ANUNCIADO':''}`},
  ];
  (m.parts||[]).forEach(p=>filas.push({cat:'Módulos', desc:p, sku:p, qty, unit:null,
    nota:PARTS_DESC[p]||''}));
  if(optQty>0){
    (m.optics||[]).forEach(k=>(OPTICS[k]||[]).slice(0,1).forEach(o=>filas.push({
      cat:'Ópticas', desc:`${OPTIC_LABEL[k]||k} — ${o.sku}`, sku:o.bom||null,
      qty:optQty*qty, unit:null, nota:o.d})));
  }
  filas.push({cat:'Licencias', desc:`Cisco DNA ${{'ess':'Essentials','adv':'Advantage','pre':'Premier'}[dnaTier]}`,
    sku:`DNA-C-T<n>-${{'ess':'E','adv':'A','pre':'P'}[dnaTier]}-${termYrs}Y`, qty, unit:null,
    nota:`Término ${termYrs} años. El tier de ancho de banda (T0-T3+) se confirma en CCW segun throughput.`});
  filas.push({cat:'Licencias', desc:'IOS XE SD-WAN Mode', sku:null, qty, unit:null,
    nota:'Modo de operación del router. Alternativa: IOS XE autónomo.'});
  // La pagina no expone selector de SmartNet: usa el nivel medio como referencia, igual
  // que la ficha del equipo mas arriba.
  const sn=SMARTNET['med'];
  if(sn) filas.push({cat:'Soporte', desc:sn.n, sku:null, qty, unit:null, nota:sn.sla||''});

  const meta={
    titulo:`Lista de materiales — ${m.id}`,
    subtitulo:`${m.fam} · Serie ${m.ser} · término ${termYrs} años`,
    archivo:`BOM_${m.id}`,
    notas:[
      '',
      'NOTAS DE PREVENTA',
      '  Precios de referencia tomados de exports de CCW. Verificar PID, tier y precio final',
      '  en Cisco Commerce Workspace antes de cotizar en firme.',
      m.eolAnnounced?`  AVISO: fin de venta anunciado (${m.eolAnnounced.pid}), ultimo dia de pedido ${m.eolAnnounced.lastOrder}.`:null,
      m.eolAnnounced?'  Sucesor confirmado: Cisco Secure Router (G2), mismo IOS XE SD-WAN.':null,
    ].filter((n)=>n!==null),
  };

  $('bomTabla').innerHTML=BOM.renderTabla(filas,{});
  $('bomOut').value=BOM.comoTexto(filas,meta);
  bomFilas=filas; bomMeta=meta;
}

// Copy BOM
$('copyBtn').addEventListener('click', async()=>{
  const t=$('bomOut');
  try{ await navigator.clipboard.writeText(t.value); $('copyBtn').textContent='Copiado'; }
  catch{ t.classList.remove('hidden'); t.select(); document.execCommand('copy'); t.classList.add('hidden'); $('copyBtn').textContent='Copiado'; }
  setTimeout(()=>$('copyBtn').textContent='Copiar como texto',1600);
});

$('xlsBtn').addEventListener('click', async()=>{
  const b=$('xlsBtn'); b.disabled=true; b.textContent='Generando…';
  try{ await BOM.exportarExcel(bomFilas,bomMeta); b.textContent='Exportar a Excel'; }
  catch(e){ b.textContent='Error al exportar'; console.error(e);
    setTimeout(()=>b.textContent='Exportar a Excel',2200); }
  b.disabled=false;
});

(async function initApp(){
  const res = await fetch('/api/dimensionador/cisco');
  const data = await res.json();
  MODELS = data.models;
  OPTICS = data.optics;
  OPTIC_LABEL = data.opticLabel;
  PARTS_DESC = data.partsDesc;
  SMARTNET = data.smartnet;
  DNA_DESC = data.dnaDesc;

  // Populate BOM model selector
  $('pickModel').innerHTML = (() => {
    const groups={};
    MODELS.forEach(m=>{ (groups[m.ser]=groups[m.ser]||[]).push(m); });
    return Object.entries(groups).map(([g,arr])=>
      `<optgroup label="${g}">${arr.map(m=>`<option value="${m.id}">${m.id} — ${m.fam}</option>`).join('')}</optgroup>`).join('');
  })();

  // Optics catalog
  $('opticsAll').innerHTML=Object.keys(OPTICS).map(k=>`
    <div class="grp"><h3>${OPTIC_LABEL[k]}</h3>
    <div class="scroll"><table><thead><tr><th>PID Cisco</th><th>SKU legacy</th><th>Descripción</th></tr></thead><tbody>
    ${OPTICS[k].map(o=>`<tr><td><code>${esc(o.bom)}</code></td><td><code>${esc(o.sku)}</code></td><td>${esc(o.d)}</td></tr>`).join('')}
    </tbody></table></div></div>`).join('');

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
