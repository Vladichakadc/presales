'use strict';
let MODELS = [];
let BUNDLES = {};
let CARE = {};

const $=id=>document.getElementById(id);
let profile='tp', wanMode='single', segMode='branch', lastPick=null;
let bomFilas=[], bomMeta={};

// El modelo recomendado se lleva solo a la pestaña de BOM. Se sincroniza unicamente cuando
// la recomendacion CAMBIA, no en cada render: asi, si alguien elige otro modelo a mano para
// compararlo, no se lo pisamos en cuanto mueva un parametro del dimensionamiento.
let ultimaRecomendacion=null;
function sincronizarConBom(elegido){
  const id=elegido?elegido.id:null;
  if(id===ultimaRecomendacion) return;
  ultimaRecomendacion=id;
  llevarABom(id);
}
// Eleccion explicita en el desplegable de equipos: se lleva al BOM siempre.
function llevarABom(id){
  if(!id) return;
  ultimaRecomendacion=id;
  const sel=$('pickModel');
  if(!sel||sel.value===id) return;
  sel.value=id;
  if(sel.value===id) renderBom(); // solo si el modelo existe en el desplegable
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
$('wanSeg').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;[...$('wanSeg').children].forEach(x=>x.setAttribute('aria-pressed',x===b));wanMode=b.dataset.v;render();});
$('segSeg').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;[...$('segSeg').children].forEach(x=>x.setAttribute('aria-pressed',x===b));segMode=b.dataset.v;render();});
['bw','unit','users','head','sessNeed','chkSsl','chkAv','chkWeb','chkSandbox','chkIotDlp','chkHa'].forEach(id=>$(id).addEventListener('input',render));
// En HA se compran 2 unidades y cada una lleva su propia suscripcion FortiGuard: enlazar la
// casilla con la cantidad del BOM evita cotizar un clúster con una sola licencia.
$('chkHa').addEventListener('change',()=>{
  const q=$('qty');
  if($('chkHa').checked){ if((parseInt(q.value)||1)<2) q.value=2; }
  else if((parseInt(q.value)||1)===2){ q.value=1; }
  renderBom();
});
['pickModel','qty','termYears','licBundle','careLevel'].forEach(id=>$(id).addEventListener('input',renderBom));

function fmt(m){
  if(!m) return '—';
  if(m>=1000000)return (m/1e6).toFixed(1).replace(/\.0$/,'')+' Tbps';
  if(m>=1000)return (m/1000).toFixed(m%1000?1:0)+' Gbps';
  return Math.round(m)+' Mbps';
}
const esc=s=>String(s).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));

/* ── Motor de dimensionamiento ─────────────────────────────────────────────── */

// Las 5 capas que Fortinet publica, de menor a mayor profundidad de inspección. Elegir la
// capa correcta ES el dimensionamiento: entre `fw` y `tp` hay un orden de magnitud, porque
// la primera va descargada al ASIC de red y la última atraviesa el stack completo.
const TIERS=[
  {k:'fw',  n:'Firewall',          d:'Firewall stateful, 1518 B UDP. Sesión descargada al ASIC de red (NP7/SP5), sin inspección de contenido.'},
  {k:'vpn', n:'IPsec VPN',         d:'Túnel IPsec, 512 B. Criptografía descargada al ASIC.'},
  {k:'ips', n:'IPS',               d:'IPS sobre Enterprise Mix. La sesión sale del offload de red; el content processor (CP9/CP10) asiste el pattern matching.'},
  {k:'ngfw',n:'NGFW',              d:'IPS + Application Control sobre Enterprise Mix.'},
  {k:'tp',  n:'Threat Protection', d:'NGFW + antivirus + logging. Stack de seguridad completo — el número realista de una sucursal.'},
];
const TIER_BY_K=Object.fromEntries(TIERS.map(t=>[t.k,t]));

// Fortinet dejó de publicar SSL Inspection Throughput por modelo en el Product Matrix.
// Estimación conservadora sobre Threat Protection, declarada como estimación en la UI.
// ponytail: factor único; sustituir por cifra por modelo si Fortinet vuelve a publicarla.
const SSL_DERATE=0.65;

// Software del portafolio Fortinet que acompana al FortiGate en una propuesta. Mismos
// productos y SKU que la tabla de la pestana "Licencias", como datos y no como markup.
const SOFTWARE=[
  {n:'FortiManager', d:'Orquestacion de politicas y SD-WAN. Appliance de entrada FMG-200G: hasta 30 dispositivos/VDOMs.'},
  {n:'FortiAnalyzer', d:'Correlacion y retencion de logs. Appliance de entrada FAZ-150G: hasta 25 GB/dia.'},
  {n:'FortiSandbox', d:'Analisis dinamico de archivos zero-day. Add-on independiente del bundle.'},
  {n:'FortiClient EMS', d:'Gestion de endpoints ZTNA + VPN, licenciado por numero de endpoints.'},
  {n:'FortiSASE', d:'SASE, ZTNA y EPP como servicio, licenciado por usuario.'},
];

// La inspección TLS profunda exige el stack completo, así que su piso es Threat Protection
// aunque se haya elegido una capa más liviana. El castigo se aplica UNA vez y sobre la
// capacidad — antes se aplicaba al requerimiento Y a la capacidad, sobredimensionando.
function getCap(m){
  const ssl=$('chkSsl').checked;
  const base=m[ssl?'tp':profile];
  const v=base!=null?base:m.ngfw;
  return ssl?v*SSL_DERATE:v;
}

// Coincidencia por subcadena en lugar de lista exacta: los `seg` del catálogo son 21 cadenas
// distintas ('SOHO / Teletrabajo', 'DC edge / Enterprise', 'Hyperscale DC'...) y la lista
// exacta anterior dejaba fuera toda la serie G de entrada y 8 variantes de datacenter.
const SEG_MATCH={
  branch:/SOHO|Sucursal|Teletrabajo/i,
  campus:/Campus/i,
  dc:/DC|Carrier|Hyperscale/i,
};

function render(){
  const bw=parseFloat($('bw').value)||0;
  const unit=parseFloat($('unit').value);
  const users=parseInt($('users').value)||0;
  const head=(parseFloat($('head').value)||0)/100;
  $('headVal').textContent=Math.round(head*100)+' %';

  let featurePenalty=1.0;
  if($('chkAv').checked) featurePenalty+=0.08;
  if($('chkWeb').checked) featurePenalty+=0.04;
  if($('chkSandbox').checked) featurePenalty+=0.10;
  if($('chkIotDlp').checked) featurePenalty+=0.06;

  // base need: max of BW-based and user-based
  const bwBaseMbps=bw*unit*(1+head)*featurePenalty;
  const userBaseMbps=users*3*(1+head)*featurePenalty; // 3 Mbps/user avg
  const effectiveNeed=Math.max(bwBaseMbps,userBaseMbps);

  // scale
  const allCaps=MODELS.map(m=>m.fw);
  const maxCap=Math.max(...allCaps);
  const logP=v=>Math.log10(Math.max(v,10));
  const logMin=Math.log10(10),logMax=logP(maxCap*1.2);
  const xPct=v=>(logP(v)-logMin)/(logMax-logMin)*100;
  const needPct=Math.min(xPct(effectiveNeed),99);

  const need=$('need');
  need.style.left=needPct+'%';
  $('needLbl').textContent=fmt(effectiveNeed);
  need.classList.toggle('flip',needPct>60);

  // draw track
  const track=$('track');
  track.querySelectorAll('.dot,.tick,.pickLabel').forEach(e=>e.remove());
  const pickLbl=document.createElement('div');
  pickLbl.className='pickLabel'; pickLbl.id='pickLbl'; pickLbl.style.display='none';
  track.appendChild(pickLbl);
  [10,50,100,500,1000,5000,10000,50000,100000,500000,1000000].forEach(v=>{
    const pct=xPct(v);if(pct<0||pct>100)return;
    const tick=document.createElement('div');tick.className='tick';tick.style.left=pct+'%';
    const lbl=v>=1000000?v/1e6+'T':v>=1000?v/1000+'G':v+'M';
    tick.innerHTML=`<i></i><b>${lbl}</b>`;track.appendChild(tick);
  });
  MODELS.forEach(m=>{
    const cap=getCap(m);const pct=xPct(cap);if(pct<0||pct>100)return;
    const dot=document.createElement('div');
    dot.className='dot'+(cap>=effectiveNeed?' ok':'');
    if(lastPick&&m.id===lastPick.id)dot.className='dot pick';
    dot.style.left=pct+'%';dot.title=m.id+': '+fmt(cap);
    track.appendChild(dot);
  });

  // Candidatos: modelos vigentes que cumplen throughput Y sesiones concurrentes.
  const sessNeed=parseInt($('sessNeed').value)||0;
  let outBySess=0;
  const candidates=MODELS.filter(m=>{
    if(m.eol||getCap(m)<effectiveNeed) return false;
    if(sessNeed&&m.sess<sessNeed){ outBySess++; return false; }
    return true;
  }).sort((a,b)=>getCap(a)-getCap(b));
  const rx=SEG_MATCH[segMode];
  let pick=(rx&&candidates.find(m=>rx.test(m.seg)))||candidates[0]||null;
  lastPick=pick;
  sincronizarConBom(pick);

  // ── Presentacion ──────────────────────────────────────────────────────────
  // El veredicto pasa de un unico equipo fijo a un desplegable con todos los que cumplen;
  // la escalera de capas, el resumen y el BOM siguen al equipo ELEGIDO. Ver /js/ficha.js.
  if(!pick){
    const why=[];
    why.push(`<li>Requerimiento de <b>${fmt(effectiveNeed)}</b> en la capa <b>${TIER_BY_K[profile].n}</b>${$('chkSsl').checked?' con inspección SSL profunda':''}.</li>`);
    if(outBySess) why.push(`<li><b>${outBySess}</b> modelo(s) descartado(s) por tabla de sesiones: necesitas ${sessNeed.toLocaleString('en-US')} concurrentes.</li>`);
    if(profile==='tp'||$('chkSsl').checked) why.push('<li>Estás dimensionando contra la capa más exigente. Si el diseño no requiere antivirus en línea sobre todo el tráfico, evaluar la capa <b>NGFW</b> o segmentar por política qué tráfico se inspecciona a fondo — es la palanca que más capacidad libera en FortiGate.</li>');
    why.push('<li>Por encima del catálogo: evaluar chasis FortiGate 7000F o distribuir la carga en varias unidades.</li>');
    FICHA.render({contenedor:'verdict', candidatos:[], recomendado:null,
      vacioTitulo:'Ningún modelo vigente cumple todas las restricciones',
      vacioDetalle:`<ul style="margin:0;padding-left:18px;font-size:13.5px">${why.join('')}</ul>`});
    $('verdict').style.borderLeftColor='var(--amber)';
    $('perfTiers').innerHTML='';
    return;
  }
  $('verdict').style.borderLeftColor='var(--red)';

  const medidoresDe=m=>[
    {etq:`Capa ${TIER_BY_K[profile].n}${$('chkSsl').checked?' + SSL':''}`,
     val:effectiveNeed, tope:getCap(m), txt:fmt(effectiveNeed)+' / '+fmt(getCap(m))},
    {etq:'Sesiones concurrentes', val:sessNeed, tope:m.sess,
     txt:(sessNeed?sessNeed.toLocaleString('en-US')+' / ':'')+(m.sess/1000).toFixed(0)+'K'},
  ];

  const porQueDe=m=>{
    const flags=[];
    if($('chkSsl').checked)flags.push(`<b class="warn">Inspección SSL profunda:</b> capacidad estimada en ${fmt(getCap(m))} sobre los ${fmt(m.tp)} de Threat Protection. Fortinet ya no publica esta cifra por modelo — validar con una PoC antes de comprometerla.`);
    if($('chkAv').checked)flags.push('Antivirus en línea ya está contemplado dentro de Threat Protection; el content processor (CP9/CP10) asiste la inspección.');
    if($('chkSandbox').checked)flags.push('FortiSandbox se cotiza aparte (appliance o suscripción cloud) — no consume throughput del FortiGate, pero sí añade latencia al primer encuentro de un archivo.');
    if($('chkIotDlp').checked)flags.push('IoT Security y DLP requieren el bundle <b>Enterprise Protection</b>: UTP y ATP no los incluyen.');
    if($('chkHa').checked)flags.push('<b>HA:</b> se cotizan 2 unidades y <b>cada una necesita su propia suscripción FortiGuard</b> — la licencia no se comparte entre nodos del clúster.');
    if(wanMode==='dual')flags.push('<b>SD-WAN sin costo de licencia:</b> el balanceo por SLA, ADVPN y la selección dinámica de camino vienen en FortiOS. No hay suscripción por dispositivo como en Cisco Catalyst SD-WAN o Meraki.');
    if(m.eol)flags.push('<b class="warn">Modelo descontinuado (EOL)</b> — solo referencia para equipos ya instalados, no para diseños nuevos.');
    return `<ul style="margin:8px 0 0;padding-left:18px;font-size:13.5px">
      <li>Requerimiento <b>${fmt(effectiveNeed)}</b> en capa <b>${esc(TIER_BY_K[profile].n)}</b> contra capacidad <b>${fmt(getCap(m))}</b> — headroom ${Math.round((1-effectiveNeed/getCap(m))*100)}%</li>
      <li>Sesiones concurrentes: <b>${(m.sess/1000).toFixed(0)}K</b> | Interfaces: ${esc(m.ifaces)}</li>
      ${flags.map(f=>`<li>${f}</li>`).join('')}
    </ul>`;
  };

  const seccionesDe=m=>{
    const bundle=$('licBundle').value||'ent';
    const care=$('careLevel').value||'fcpre';
    const termYrs=parseInt($('termYears').value)||3;
    const lt=m.lic?m.lic[bundle]:null;
    const ct=m.lic?m.lic.care[CARE_LIC_KEY[care]]:null;
    return [
      {titulo:'Características del equipo', filas:[
        ['Segmento', esc(m.seg)],
        ['Firewall (1518 B, offload ASIC)', fmt(m.fw)],
        ['IPsec VPN (512 B, offload ASIC)', fmt(m.vpn)],
        ['IPS (Enterprise Mix)', fmt(m.ips)],
        ['NGFW (IPS + App Control)', fmt(m.ngfw)],
        ['<b>Threat Protection</b>', m.tp?`<b>${fmt(m.tp)}</b>`:'Consultar datasheet'],
        ['Sesiones concurrentes', m.sess.toLocaleString('en-US')],
        ['Procesadores de seguridad', m.asic?esc(m.asic):'<span class="warn">sin dato publicado</span>'],
        ['Interfaces', esc(m.ifaces), true],
        ['SKU de hardware', m.hwSku?`<code>${esc(m.hwSku)}</code>`:'<span class="warn">Descontinuado — sin SKU nuevo</span>'],
        ['Precio de lista ref.', m.elp?esc(m.elp):'Consultar distribuidor'],
      ]},
      {titulo:'Licenciamiento propuesto', filas:[
        ['Bundle FortiGuard', esc(BUNDLES[bundle].n)],
        ['Servicios incluidos', esc(BUNDLES[bundle].svcs), true],
        ['SKU del bundle', lt&&lt.sku?`<code>${esc(lt.sku)}</code>`:'<span class="warn">Sin SKU vigente para este modelo</span>'],
        ['Término', `${termYrs} año${termYrs>1?'s':''}`],
        ['Unidades a licenciar', $('chkHa').checked?'2 — la licencia no se comparte en HA':'1'],
      ], nota:'En FortiGate el SKU lleva el código del modelo embebido: la licencia va atada al equipo, no al ancho de banda.'},
      {titulo:'Software del portafolio', filas:SOFTWARE.map(sw=>[esc(sw.n), esc(sw.d), true]),
       nota:'SKU y precios de referencia del price list AMER — no escalan con el modelo de FortiGate elegido.'},
      {titulo:'Soporte', filas:[
        [esc(CARE[care].n), esc(CARE[care].sla)],
        ['SKU', ct&&ct.sku?`<code>${esc(ct.sku)}</code>`:'<span class="warn">No disponible para este modelo</span>'],
      ]},
    ];
  };

  const pintarDependientes=m=>{
    $('pickLbl').textContent=m.id;$('pickLbl').style.display='block';
    $('pickLbl').style.left=xPct(getCap(m))+'%';
    renderTiers(m,effectiveNeed);
    $('sizingBox').innerHTML=`
      <table><tbody>
        <tr><td>Equipo evaluado</td><td class="n">${esc(m.id)}${m.id===pick.id?'':' (elegido a mano)'}</td></tr>
        <tr><td>Capa dimensionada</td><td class="n">${esc(TIER_BY_K[profile].n)}</td></tr>
        <tr><td>Inspección SSL profunda</td><td class="n">${$('chkSsl').checked?`Sí — piso Threat Protection x${SSL_DERATE} (estimado)`:'No'}</td></tr>
        <tr><td>Ancho de banda WAN</td><td class="n">${fmt(bw*unit)}</td></tr>
        <tr><td>Usuarios estimados</td><td class="n">${users}</td></tr>
        <tr><td>Requerimiento final</td><td class="n"><b>${fmt(effectiveNeed)}</b></td></tr>
        <tr><td>Capacidad en esa capa</td><td class="n">${fmt(getCap(m))}</td></tr>
        <tr><td>Headroom disponible</td><td class="n">${Math.round((1-effectiveNeed/getCap(m))*100)}%</td></tr>
        <tr><td>Sesiones concurrentes</td><td class="n">${sessNeed?sessNeed.toLocaleString('en-US')+' / ':''}${m.sess.toLocaleString('en-US')}</td></tr>
        <tr><td>Unidades a cotizar</td><td class="n">${$('chkHa').checked?'2 (HA) — licencia por unidad':'1'}</td></tr>
      </tbody></table>`;
  };

  const elegidoId=FICHA.render({
    contenedor:'verdict',
    candidatos:candidates,
    recomendado:pick.id,
    etiqueta:m=>`${m.id} — ${m.seg} · ${fmt(getCap(m))}`,
    titulo:m=>m.id,
    subtitulo:m=>m.seg+' · FortiOS Security Fabric',
    medidores:medidoresDe,
    porQue:porQueDe,
    secciones:seccionesDe,
    alCambiar:id=>{
      const m=candidates.find(x=>x.id===id);
      if(!m) return;
      pintarDependientes(m);
      llevarABom(m.id);
    },
  });
  const elegido=candidates.find(m=>m.id===elegidoId)||pick;
  pintarDependientes(elegido);
  sincronizarConBom(elegido);
}

// Escalera de capas: muestra las 5 cifras publicadas del modelo a la vez, en escala relativa
// al firewall puro. Hace visible de un vistazo el salto de un orden de magnitud entre lo que
// va descargado al ASIC y lo que atraviesa el stack de inspección — que es exactamente el
// malentendido que produce los FortiGate subdimensionados.
function renderTiers(m,need){
  const ssl=$('chkSsl').checked;
  const top=m.fw||1;
  const activeK=ssl?'tp':profile;
  $('perfModel').textContent='— '+m.id;
  $('perfTiers').innerHTML=TIERS.map((t,i)=>{
    const v=m[t.k];
    if(v==null) return '';
    const on=t.k===activeK;
    const prev=i>0?m[TIERS[i-1].k]:null;
    const drop=prev&&v&&prev>v?Math.round((1-v/prev)*100):0;
    return `${drop>=50?`<div class="tierDrop">&#8595; ${drop}% al salir del offload de red</div>`:''}
      <div class="tierRow ${on?'on':'off'}" title="${esc(t.d)}">
        <span class="tn">${esc(t.n)}</span>
        <span class="tb"><i style="width:${Math.max(2,v/top*100)}%"></i></span>
        <span class="tv">${fmt(v)}</span>
      </div>`;
  }).join('');
  if(ssl){
    const v=m.tp*SSL_DERATE;
    $('perfTiers').insertAdjacentHTML('beforeend',
      `<div class="tierRow on" title="Estimación: Fortinet ya no publica SSL Inspection por modelo.">
        <span class="tn">+ SSL profundo</span>
        <span class="tb"><i style="width:${Math.max(2,v/top*100)}%"></i></span>
        <span class="tv">~${fmt(v)}</span>
      </div>`);
  }
  const ratio=m.tp?Math.round(m.fw/m.tp):0;
  const asic=m.asic
    ? `Silicio: <b>${esc(m.asic)}</b>. El ${esc(m.np||'procesador de red')} es el que sostiene las dos primeras cifras${m.cp?`; el ${esc(m.cp)} asiste el pattern matching de IPS y antivirus en las tres últimas`:''}.`
    : `<span class="warn">Fortinet no publica página de fast path architecture para este modelo — sin dato de ASIC verificado.</span>`;
  $('perfNote').innerHTML=`Del firewall puro a Threat Protection hay un factor <b>${ratio}x</b> en este modelo (${fmt(m.fw)} &rarr; ${fmt(m.tp)}). `+
    `La cifra de portada solo aplica a sesiones descargadas al procesador de red; cualquier perfil de inspección saca la sesión del fast path. ${asic} Requerimiento actual: <b>${fmt(need)}</b>.`;
}

/* BOM */
function populatePickModel(){
  $('pickModel').innerHTML=MODELS.map(m=>`<option value="${m.id}">${m.id} — ${m.seg}${m.eol?' (EOL)':''}</option>`).join('');
}

const CARE_LIC_KEY={fc247:'essential',fcpre:'premium',fcelite:'elite'};
const money=n=>n==null?null:'$'+n.toLocaleString('en-US',{maximumFractionDigits:2});
function tierPrice(tier,termYrs){
  if(!tier) return null;
  const v=termYrs===1?tier.y1:termYrs===5?tier.y5:tier.y3;
  return v==null?null:v;
}

function renderBom(){
  const m=MODELS.find(x=>x.id===$('pickModel').value)||MODELS[0];
  const qty=Math.max(1,parseInt($('qty').value)||1);
  const termYrs=parseInt($('termYears').value)||3;
  const bundle=$('licBundle').value||'ent';
  const care=$('careLevel').value||'fcpre';
  const lic=m.lic;
  const licTier=lic?lic[bundle]:null;
  const careTier=lic?lic.care[CARE_LIC_KEY[care]]:null;
  const licPrice=tierPrice(licTier,termYrs);
  const carePrice=tierPrice(careTier,termYrs);

  let html=`<section class="panel"><h2>Ficha del equipo</h2>
    <div class="model" style="font-size:28px">${m.id}</div>
    <p class="family">${m.seg} · FortiOS · Security Fabric</p>
    <div class="scroll"><table><thead><tr><th>Métrica</th><th>Valor</th></tr></thead><tbody>
    <tr><td>SKU hardware</td><td class="n">${m.hwSku?`<code>${esc(m.hwSku)}</code>`:'<span class="warn">Descontinuado — sin SKU nuevo vigente</span>'}</td></tr>
    <tr><td>Precio de lista ref. (equipo)</td><td class="n">${m.elp?esc(m.elp):'Consultar distribuidor'}</td></tr>
    <tr><td>Firewall (1518 B, offload ASIC)</td><td class="n">${fmt(m.fw)}</td></tr>
    <tr><td>IPsec VPN (512 B, offload ASIC)</td><td class="n">${fmt(m.vpn)}</td></tr>
    <tr><td>IPS (Enterprise Mix)</td><td class="n">${fmt(m.ips)}</td></tr>
    <tr><td>NGFW (IPS + App Control)</td><td class="n">${fmt(m.ngfw)}</td></tr>
    <tr><td><b>Threat Protection</b> (NGFW + AV + log)</td><td class="n"><b>${m.tp?fmt(m.tp):'Consultar datasheet'}</b>${m.tp&&m.fw?` <span class="warn">(${Math.round(m.fw/m.tp)}x menos que el firewall puro)</span>`:''}</td></tr>
    <tr><td>Sesiones concurrentes</td><td class="n">${m.sess.toLocaleString('en-US')}</td></tr>
    <tr><td>Procesadores de seguridad</td><td class="n">${m.asic?`${esc(m.asic)}${m.soc?' <span class="pillc">SoC</span>':''}<span class="sku">${esc(m.asicSrc||'')}</span>`:'<span class="warn">Sin página de fast path architecture publicada</span>'}</td></tr>
    <tr><td>Interfaces</td><td>${m.ifaces}</td></tr>
    </tbody></table></div>
    ${m.eol?'<p class="hint warn" style="margin-top:10px">Modelo descontinuado (EOL) — no disponible para diseños nuevos, solo referencia para equipos ya instalados.</p>':''}
    </section>`;

  html+=`<section class="panel"><h2>Licencias FortiGuard</h2><ul class="clean">
    ${licTier?`<li class="on"><b>${BUNDLES[bundle].n}</b><span class="req">Requerida</span><span class="sku">${BUNDLES[bundle].svcs}<br><code>${esc(licTier.sku)}</code> · término ${termYrs} año${termYrs>1?'s':''}${licPrice!=null?' · '+money(licPrice)+' c/u':' · precio no disponible a '+termYrs+' años para este modelo'}</span></li>`
      :`<li><b>${BUNDLES[bundle].n}</b><span class="req opt">No disponible</span><span class="sku">Este bundle no tiene SKU vigente para ${m.id} en el price list actual${m.eol?' (equipo EOL, sin renovación de Enterprise Protection)':''}.</span></li>`}
    <li><b>FortiConverter</b><span class="req opt">Opcional</span><span class="sku">${lic&&lic.converter?`Migración de configuración desde Cisco ASA, Check Point, Palo Alto. <code>${esc(lic.converter.sku)}</code> · ${money(lic.converter.fee)} (servicio único)`:'Incluido dentro de Enterprise Protection en modelos vigentes.'}</span></li>
    <li><b>FortiSandbox</b><span class="req opt">Opcional</span><span class="sku">Análisis dinámico de archivos zero-day (add-on independiente del bundle). SKU de referencia: <code>FC-10-FS5HG-499-02-DD</code>.</span></li>
    <li><b>FortiClient EMS</b><span class="req opt">Opcional</span><span class="sku">Gestión de endpoints ZTNA + VPN, licenciado por número de endpoints. SKU de referencia (25 endpoints): <code>FC1-10-EMS05-428-01-DD</code>.</span></li>
  </ul></section>`;

  html+=`<section class="panel"><h2>Soporte FortiCare</h2><div class="scroll"><table>
    <thead><tr><th>Servicio</th><th>SLA</th><th>SKU</th><th>Término</th><th>Precio ref. c/u</th><th>Qty</th></tr></thead><tbody>
    <tr><td>${CARE[care].n}</td><td class="n">${CARE[care].sla}</td><td class="n">${careTier?`<code>${esc(careTier.sku)}</code>`:'<span class="warn">No disponible para este modelo</span>'}</td><td class="n">${termYrs} años</td><td class="n">${carePrice!=null?money(carePrice):'—'}</td><td class="n">${qty}</td></tr>
    </tbody></table></div></section>`;

  $('bomBody').innerHTML=html;

  // Filas del BOM en el formato compartido de /js/bom.js. En HA cada nodo paga su propia
  // suscripcion FortiGuard y su propio FortiCare, por eso licencias y soporte multiplican
  // por la cantidad igual que el hardware.
  const termino=`término ${termYrs} año${termYrs>1?'s':''}`;
  const filas=[
    {cat:'Equipo', desc:m.id, sku:m.hwSku||null, qty, unit:m.elpN!=null?m.elpN:null,
     nota:`${m.seg} · ${m.ifaces}${m.eol?' · DESCONTINUADO (EOL)':''}`},
    {cat:'Licencias FortiGuard', desc:BUNDLES[bundle].n, sku:licTier?licTier.sku:null, qty, unit:licPrice,
     nota:`${termino} · ${BUNDLES[bundle].svcs}`},
    {cat:'Soporte', desc:CARE[care].n, sku:careTier?careTier.sku:null, qty, unit:carePrice,
     nota:`${termino} · ${CARE[care].sla}`},
  ];
  if(lic&&lic.converter){
    filas.push({cat:'Servicios opcionales', desc:'FortiConverter — migración de configuración', sku:lic.converter.sku, qty:1, unit:lic.converter.fee,
      nota:'Servicio único. Migra desde Cisco ASA, Check Point o Palo Alto.'});
  }

  const meta={
    titulo:`Lista de materiales — ${m.id}`,
    subtitulo:`${m.seg} · FortiOS · Security Fabric · ${termino}`,
    archivo:`BOM_${m.id}`,
    notas:[
      '',
      'RENDIMIENTO POR CAPA DE INSPECCION',
      `  Firewall (1518 B, offload ASIC): ${fmt(m.fw)}`,
      `  IPsec VPN (512 B, offload ASIC): ${fmt(m.vpn)}`,
      `  IPS (Enterprise Mix):            ${fmt(m.ips)}`,
      `  NGFW (IPS + App Control):        ${fmt(m.ngfw)}`,
      `  Threat Protection (+ AV + log):  ${fmt(m.tp)}   <- dimensionar con este valor`,
      `  Sesiones concurrentes:           ${m.sess.toLocaleString('en-US')}`,
      `  Procesadores de seguridad:       ${m.asic||'sin dato publicado por Fortinet'}`,
      '',
      'INCLUIDO EN FORTIOS SIN LICENCIA ADICIONAL',
      '  SD-WAN (seleccion de camino por SLA, ADVPN), ZTNA, IPsec/SSL-VPN, VDOMs base, y',
      '  gestion de FortiSwitch/FortiAP por FortiLink sin controladora ni licencia por dispositivo.',
      '',
      'Precios de lista (list price) AMER, sin descuentos de canal ni impuestos.',
      'Confirmar SKU exacto, termino y precio final con el distribuidor Fortinet autorizado.',
      qty>1?`Cluster de ${qty} unidades: la licencia no se comparte en HA, cada nodo lleva la suya.`:null,
    ].filter((n)=>n!==null),
  };

  $('bomTabla').innerHTML=BOM.renderTabla(filas,{
    aviso:qty>1?'Clúster HA: cada nodo lleva su propia suscripción FortiGuard y su propio contrato FortiCare.':null,
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
  const res = await fetch('/api/dimensionador/fortinet');
  const data = await res.json();
  MODELS = data.models;
  BUNDLES = data.bundles;
  CARE = data.care;

  populatePickModel();
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
