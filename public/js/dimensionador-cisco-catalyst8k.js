'use strict';
// El atajo del DOM, arriba del todo: lo usan funciones declaradas antes de donde estaba.
const $ = id => document.getElementById(id);
/* ═══════════════════════════════════════
   DATA
   ═══════════════════════════════════════ */
let bomFilas=[], bomMeta={};

// El equipo del dimensionamiento se lleva solo al BOM. La regla vive en js/bom.js —
// `BOM.sincronizar` distingue lo heredado de lo elegido a mano y repinta siempre, para
// que un cambio de escenario no deje el BOM cotizando el equipo anterior.
function sincronizarConBom(elegido){
  BOM.sincronizar({elegido:elegido?elegido.id:null, render:renderBom});
}
// Eleccion explicita en el desplegable de equipos: se lleva al BOM siempre.
function llevarABom(id){
  BOM.sincronizar({elegido:id||null, render:renderBom});
}

let MODELS = [];
let OPTICS = {};
let OPTIC_LABEL = {};
let PARTS_DESC = {};
let SMARTNET = {};
let DNA_DESC = {};

// Que familia del catalogo pertenece a cada plataforma. Se decide por `ser`, que es el campo
// que ya trae cada modelo, en vez de anadir una marca nueva al catalogo.
const PLATAFORMAS = {
  xe:     m => /Catalyst 8000|Secure Router/.test(m.ser),
  isr:    m => /ISR 1000/.test(m.ser),
  meraki: m => /Meraki/.test(m.ser),
  asr:    m => /ASR 1000/.test(m.ser),
  all:    () => true,
};
// Fin de venta VENCIDO frente a ANUNCIADO lo decide la misma regla que ordena y filtra los
// candidatos (ficha.js), para que la ficha, el BOM y la exportacion no puedan discrepar de
// lo que muestra la lista.
const vencido = m => !!(m && FICHA.rango(m) === 2);
let dirMult=2, mode='link', crit='low', lastPick=null;
// Si el dimensionamiento se quedo sin candidato, el BOM tiene que DECIRLO: hasta ahora
// seguia cotizando el ultimo equipo que si cumplia, en silencio.
let hayCandidato=true;

/* ── Tabs ── */
document.querySelectorAll('.tabs button').forEach(b => b.addEventListener('click', () => {
  document.querySelectorAll('.tabs button').forEach(x => x.setAttribute('aria-selected', x===b));
  ['calc','bom','optics','cat','src'].forEach(t => $('pane-'+t).hidden = (t !== b.dataset.tab));
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
['bw','unit','sites','conc','head','profile','plataforma','aps','sNgfw','sVoice','sAppx','sUmbrella','chkRedund','chk4g']
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

// Catálogo Cisco, con la misma tabla que antes vivía en la vista de Cisco del portal (ver
// CLAUDE.md, 2026-09-10): se pinta desde MODELS, ya cargado para el propio dimensionador.
// Se incluyen los modelos fuera de venta o de línea anterior (con su marca, misma regla de
// FICHA.rango que ya usa esta página para vencido()), a diferencia del portal, que los ocultaba.
function renderCatalogo(){
  const tbody=document.querySelector('#tbl-cisco-cat tbody');
  if(!tbody) return;
  tbody.innerHTML=MODELS.map(m=>{
    const r=FICHA.rango(m);
    const marca=r===2?' <span class="pillc" style="color:var(--red)">Fuera de venta</span>'
      :r===1?' <span class="pillc">Línea anterior</span>':'';
    return `<tr>
    <td><code>${esc(m.id)}</code>${marca}</td><td>${esc(m.ser)}</td><td>${esc(m.fam)}</td>
    <td class="n">${fmt(m.fwd)}</td><td class="n">${fmt(m.ipsec)}</td><td>${esc(m.ports)}</td>
    <td>${m.sdwan?fmt(m.sdwan):'—'}</td>
    <td class="n" style="color:var(--amber);white-space:nowrap">${m.elp?esc(m.elp):'Consultar CCW'}</td>
  </tr>`;
  }).join('');
}

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

  // Sin ancho de banda no hay recomendación (regla de preventa 2026-09-13): es el dato
  // mínimo del dimensionamiento; sin él la página pide valores en vez de proponer un
  // equipo a ciegas.
  if(bw<=0){
    lastPick=null; hayCandidato=false; sincronizarConBom(null);
    const need=$('need'); need.style.left='0%'; $('needLbl').textContent='—';
    $('track').querySelectorAll('.dot,.tick,.pickLabel').forEach(e=>e.remove());
    FICHA.render({vendor:'cisco', contenedor:'verdict', candidatos:[], recomendado:null,
      vacioTitulo:'Ingrese valores para recomendar un equipo',
      vacioDetalle:'<p style="margin:0;font-size:13.5px">Escriba el <b>ancho de banda</b> del sitio para que el dimensionador proponga los modelos que cumplen.</p>'});
    $('verdict').style.borderLeftColor='var(--steel)';
    return;
  }

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
  // La escala se calcula sobre la plataforma elegida: con todo el catalogo dentro, el chasis
  // mas grande aplastaba la aguja contra el extremo izquierdo en cuanto se miraba sucursal.
  const platEscala = $('plataforma').value;
  const enPlatEscala = m => PLATAFORMAS[platEscala] ? PLATAFORMAS[platEscala](m) : true;
  const modelosEscala = MODELS.filter(enPlatEscala).length ? MODELS.filter(enPlatEscala) : MODELS;
  const allCaps = modelosEscala.map(m => profile==='ipsec' ? m.ipsec : profile==='sdwan' ? (m.sdwan||m.ipsec) : m.fwd);
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
  // La capacidad depende del perfil elegido (forwarding, IPsec o SD-WAN), asi que se define
  // una sola vez aqui y la usan tanto el filtro de candidatos como los medidores.
  const capDe=m=>profile==='ipsec'?m.ipsec:profile==='sdwan'?(m.sdwan||m.ipsec):m.fwd;
  // Esta pagina dejaba competir de igual a igual a los equipos descontinuados, asi que
  // podia recomendar para un diseno nuevo un equipo que ya no se vende. La regla comun
  // (ficha.js) los deja visibles pero fuera de la recomendacion. Un fin de venta ANUNCIADO
  // no cuenta como fuera de venta hasta que pasa su fecha de ultimo pedido: hasta entonces
  // se pide con normalidad y solo se marca.
  // DOS COSAS QUE ESTABAN MAL Y SE ARREGLAN JUNTAS, PORQUE POR SEPARADO CADA UNA EMPEORA
  // LO QUE ARREGLA LA OTRA.
  //
  // 1. Esta pagina no elegia el mas pequeno que cumple sino el PRIMERO DEL CATALOGO que
  //    cumple, y el catalogo esta ordenado por familia, no por tamano. Para una sede de
  //    3 Gbps proponia el chasis 8500-12X4QC de 31,9 Gbps.
  // 2. El catalogo mezcla cinco plataformas que NO son intercambiables aunque coincida el
  //    caudal: IOS XE SD-WAN (Catalyst 8000 y Secure Router G2), ISR 1000, Meraki MX y
  //    ASR 1000. Cambia el plano de gestion, el licenciamiento y el equipo que opera la
  //    red. Ordenar por capacidad sin filtrar hacia saltar de un Catalyst a un Meraki por
  //    unos Mbps, que como propuesta de preventa es peor que el defecto original.
  //
  // Asi que primero se acota la plataforma —el criterio que un preventa de Cisco fija ANTES
  // de mirar caudal— y dentro de ella si se aplica el mas pequeno que cumple, igual que en
  // los otros cuatro dimensionadores. Por defecto IOS XE, que es de lo que trata la pagina.
  const plat = $('plataforma').value;
  const enPlataforma = m => PLATAFORMAS[plat] ? PLATAFORMAS[plat](m) : true;
  const candidates = FICHA.ordenar(MODELS.filter(m => enPlataforma(m) && capDe(m) >= needMbps),
    (a, b) => capDe(a) - capDe(b));
  const pick = FICHA.recomendar(candidates);
  lastPick = pick;
  hayCandidato = !!pick;
  sincronizarConBom(pick);

  // ── Presentacion ──────────────────────────────────────────────────────────
  // Desplegable con todos los que cumplen; medidores, soporte, licencias y BOM siguen al
  // equipo ELEGIDO. Ver /js/ficha.js.
  const verdict=$('verdict');
  if(!pick){
    // Se distingue "no hay equipo" de "no hay equipo EN ESTA PLATAFORMA", que es una
    // conclusion muy distinta: la segunda se resuelve cambiando un desplegable.
    const hayEnOtras = MODELS.some(m => !enPlataforma(m) && capDe(m) >= needMbps && FICHA.recomendable(m));
    const fueraDeVenta = MODELS.filter(m => enPlataforma(m) && capDe(m) >= needMbps);
    FICHA.render({vendor:'cisco', contenedor:'verdict', candidatos:[], recomendado:null,
      vacioTitulo: hayEnOtras
        ? `Ningún equipo vigente de la plataforma elegida llega a ${fmt(needMbps)}`
        : 'El requerimiento supera la capacidad del catálogo',
      vacioDetalle: hayEnOtras
        ? `<p class="warn">Sí hay equipos vigentes que cumplen en <b>otra plataforma</b>. Cambia «Plataforma / modelo operativo» para verlos — pero es una decisión de arquitectura, no de caudal: cambia el plano de gestión, el licenciamiento y quién opera la red.</p>${fueraDeVenta.length?`<p class="warn">Dentro de esta plataforma cumplen ${fueraDeVenta.map(m=>m.id).join(', ')}, pero están fuera de venta: solo sirven como referencia de parque instalado.</p>`:''}`
        : '<p class="warn">El requerimiento supera la capacidad máxima del catálogo configurado. Escalar a ASR 9000 o Catalyst 9800, o consultar solución personalizada.</p>'});
    verdict.style.borderLeftColor='var(--amber)';
    return;
  }
  verdict.style.borderLeftColor='var(--red)';

  const medidoresDe=m=>[
    {etq:'Forwarding (bidireccional)', val:needMbps, tope:m.fwd, txt:fmt(needMbps)+' / '+fmt(m.fwd)},
    {etq:'IPsec VPN', val:profile==='ipsec'?needMbps:0, tope:m.ipsec,
     txt:fmt(profile==='ipsec'?needMbps:0)+' / '+fmt(m.ipsec)},
    {etq:'SD-WAN (IPsec + AppFlow)', val:profile==='sdwan'?needMbps:0, tope:m.sdwan||m.ipsec,
     txt:fmt(profile==='sdwan'?needMbps:0)+' / '+fmt(m.sdwan||m.ipsec)},
  ];

  const porQueDe=m=>{
    const flags=[];
    if($('sNgfw').checked) flags.push('Zona-Based Firewall añade ~15% de carga de procesamiento.');
    if($('sVoice').checked) flags.push('CUBE/SIP añade ~10% por procesamiento de señalización de voz.');
    if($('sAppx').checked) flags.push('NBAR/AppX añade ~8% por clasificación de tráfico.');
    if($('sUmbrella').checked) flags.push('Umbrella SIG añade ~12% por encapsulación de túneles.');
    // Los dos avisos distinguen si el equipo ADMITE la ampliacion o no. Antes daban por hecho
    // que si -uno hablaba de «kit de expansion» y el otro mandaba pedir una NIM LTE- incluso
    // para los Meraki MX, que tienen `nim: 0` y son de sobremesa: una referencia de pedido
    // para un equipo que no la acepta es dato inventado, igual que un SKU que no existe.
    if($('chkRedund').checked && !m.redund) flags.push(m.nim>0
      ? '<span class="warn">Este modelo no trae doble fuente de serie — confirmar en el datasheet si admite una segunda.</span>'
      : '<span class="warn">Este modelo no trae doble fuente de serie y es de fuente fija: si la redundancia es un requisito, hay que subir de gama.</span>');
    if($('chk4g').checked && !m.lte) flags.push(m.nim>0
      ? 'Se requiere una NIM de LTE adicional — confirmar el PID vigente en CCW.'
      : 'Este modelo no lleva LTE integrado y no admite NIM: la conectividad celular tendría que ser externa.');
    return `<ul style="margin:8px 0 0;padding-left:18px;font-size:13.5px">
      <li>Requerimiento con margen: <b>${fmt(needMbps)}</b> | Capacidad del equipo: <b>${fmt(capDe(m))}</b></li>
      <li>Puertos: ${esc(m.ports)}</li>
      ${flags.map(f=>`<li>${f}</li>`).join('')}
    </ul>`;
  };

  const seccionesDe=m=>{
    const dnaSel=$('dnaTier').value||'adv';
    const dnaNom={ess:'DNA Essentials',adv:'DNA Advantage',pre:'DNA Premier'}[dnaSel];
    const s=SMARTNET[crit];
    return [
      {titulo:'Características del equipo', filas:[
        ['Familia / Serie', `${esc(m.fam)} · ${esc(m.ser)}`],
        ['Forwarding (bidireccional)', fmt(m.fwd)],
        ['IPsec VPN', fmt(m.ipsec)],
        ['SD-WAN (IPsec + AppFlow)', m.sdwan?fmt(m.sdwan):`${fmt(m.ipsec)} (cifra IPsec — sin throughput SD-WAN diferenciado publicado)`],
        // Tercera aparicion del mismo error: «Requiere NIM LTE» tambien se lo decia a los
        // Meraki MX, que tienen `nim: 0`. Un equipo sin ranuras no admite ese modulo, y
        // ofrecerlo igualmente manda a alguien a cotizar una pieza que no encaja.
        ['LTE integrado', m.lte?'Sí':(m.nim>0?'No — requiere una NIM de LTE':'No — y no admite NIM')],
        ['Puertos', esc(m.ports), true],
        ['Precio de lista ref.', m.elp?esc(m.elp):'Consultar CCW'],
      ]},
      FICHA.seccionAlimentacion(m),
      {titulo:'Licenciamiento propuesto', filas:[
        ['Suscripción DNA', esc(dnaNom)],
        ['Alcance', esc(DNA_DESC[dnaSel]), true],
        ['SKU de referencia', `<code>DNA-C-T&lt;n&gt;-${{ess:'E',adv:'A',pre:'P'}[dnaSel]}-${$('termYears')?$('termYears').value:3}Y</code> — n = tier de ancho de banda, confirmar en CCW`, true],
        ['HSEC (High Security)', 'Requerida para exportación de criptografía fuerte en países restringidos. Verificar con Cisco GSSO.', true],
        ['Unidades a licenciar', $('chkRedund').checked?'2 — la licencia no se comparte':'1'],
      ], nota:(dnaSel==='ess'&&m.id.includes('8500'))?'<span class="warn">Catalyst 8500 no soporta DNA Essentials — requiere Advantage como mínimo.</span>':'En Cisco la suscripción DNA va por tier de ancho de banda y término, y es la que habilita SD-WAN.'},
      {titulo:'Software y gestión', filas:[
        ['Catalyst SD-WAN Manager (vManage)', 'Controlador SD-WAN, cloud u on-prem', true],
        ['Cisco DNA Center', 'Automatización y garantía de campus, licenciado por dispositivo', true],
        ['ThousandEyes', 'Visibilidad de camino y experiencia de aplicación, suscripción aparte', true],
        ['Umbrella SIG', 'Seguridad DNS y SWG en la nube, licenciada por usuario', true],
      ]},
      {titulo:'Soporte', filas:[
        [esc(s.n), esc(s.sla)],
        ['Alcance', esc(s.d), true],
      ], nota:'Término de 12 meses sobre el equipo seleccionado.'},
    ];
  };

  const pintarDependientes=m=>{
    $('pickLbl').textContent=m.id; $('pickLbl').style.display='block';
    $('pickLbl').style.left=xPct(capDe(m))+'%';
    const s=SMARTNET[crit];
    $('suppBox').innerHTML=`
      <div style="font-family:'Barlow Condensed',sans-serif;font-weight:700;font-size:22px;text-transform:uppercase;margin-bottom:4px">${esc(s.n)}</div>
      <p style="font-family:'IBM Plex Mono',monospace;font-size:11px;margin-bottom:10px"><span class="pillc">${esc(s.sla)}</span> · término 12 meses · ${esc(m.id)}</p>
      <p style="font-size:13.5px;margin:0">${esc(s.d)}</p>`;
    const dnaSel=$('dnaTier').value||'adv';
    const dnaLetter={ess:'E',adv:'A',pre:'P'}[dnaSel];
    const dnaWarn=(dnaSel==='ess'&&m.id.includes('8500'))?'<li><span class="warn">Catalyst 8500 no soporta DNA Essentials — requiere Advantage como mínimo.</span></li>':'';
    $('licBox').innerHTML=`
      <ul class="clean">
        <li class="on"><b>${{'ess':'DNA Essentials','adv':'DNA Advantage','pre':'DNA Premier'}[dnaSel]}</b><span class="req">Requerida</span><span class="sku">${DNA_DESC[dnaSel]}<br>SKU real: <code>DNA-C-T&lt;n&gt;-${dnaLetter}-${$('termYears')?$('termYears').value:3}Y</code> (n = tier de ancho de banda, confirmar en CCW)</span></li>
        ${dnaWarn}
        <li><b>HSEC (High Security)</b><span class="req opt">Según país</span><span class="sku">Requerida para exportación de criptografía fuerte en países restringidos. Verificar con Cisco GSSO.</span></li>
        <li><b>IP Base → IP Services (IOS XE)</b><span class="req opt">Nota</span><span class="sku">En ISR 4000 el throughput máximo se alcanza solo con licencia IP Services o AppX habilitada.</span></li>
      </ul>`;
  };

  const elegidoId=FICHA.render({vendor:'cisco', 
    contenedor:'verdict',
    candidatos:candidates,
    recomendado:pick.id,
    // En perfil SD-WAN, un modelo sin cifra propia cae a su numero de IPsec. Son dos
    // mediciones distintas, asi que la sustitucion se marca aqui y no solo en la ficha: sin
    // eso, un equipo cuya cifra SD-WAN nadie publico puede aparecer por delante de otro que
    // si la publica, y en la lista los dos numeros parecen lo mismo.
    etiqueta:m=>`${m.id} — ${m.ser} · ${fmt(capDe(m))}${profile==='sdwan'&&!m.sdwan&&m.ipsec?' (cifra IPsec)':''}`,
    titulo:m=>m.id,
    subtitulo:m=>m.fam+' · Serie '+m.ser,
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

function renderTrack(profile, needMbps, xPct, needPct){
  const track=$('track');
  // clear old dots
  track.querySelectorAll('.dot,.tick,.pickLabel').forEach(e=>e.remove());
  const pickLbl=document.createElement('div');
  pickLbl.className='pickLabel'; pickLbl.id='pickLbl'; pickLbl.style.display='none';
  track.appendChild(pickLbl);

  const ticks=[10,100,1000,2000,5000,10000,20000,50000,100000];
  ticks.forEach(v=>{
    const pct=xPct(v); if(pct<0||pct>100) return;
    const tick=document.createElement('div'); tick.className='tick';
    tick.style.left=pct+'%';
    tick.innerHTML=`<i></i><b>${v>=1000?v/1000+'G':v+'M'}</b>`;
    track.appendChild(tick);
  });

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

  let html=`${BOM.avisoDesvio({elegido:FICHA.elegido('verdict'), enBom:m.id, hayCandidato})}<section class="panel"><h2>Ficha del equipo</h2>
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
    <!-- La fila de redundancia de fuente se quito el 2026-09-03: decia dos cosas distintas
         sobre el mismo campo en la MISMA pantalla. Aqui afirmaba que existia un kit de redundancia y la
         seccion «Alimentacion electrica» de FICHA.seccionAlimentacion -que esta pagina ya
         pinta, mas abajo- decia «No — fuente unica». Ademas lo afirmaba
         como un hecho, para los ONCE modelos con redund:false,
         entre ellos los Meraki MX67/68/75/85, que son de sobremesa. Inventar una opcion de
         pedido es el mismo fallo que el FortiGate 2000F y el EC-2XL de Aruba. La regla vive
         en un solo sitio: ficha.js. -->
    <tr><td>LTE integrado</td><td>${m.lte?'Sí':(m.nim>0?'No — se añade con una NIM de LTE (confirmar el PID vigente en CCW)':'No')}</td></tr>
    </tbody></table></div>
    ${m.eolAnnounced?`<p class="hint warn" style="margin-top:10px">${vencido(m)?'<b>Fin de venta VENCIDO</b>':'Fin de venta anunciado'} (PID <code>${esc(m.eolAnnounced.pid)}</code>) — último día de pedido: <b>${esc(m.eolAnnounced.lastOrder)}</b>${vencido(m)?', ya pasado: solo referencia para parque instalado':''}.${m.eolAnnounced.sucesor?` Sucesor confirmado: <b>${esc(m.eolAnnounced.sucesor)}</b> — mismo IOS XE SD-WAN, ver esa familia en el selector de equipo.`:' El boletín no nombra un PID de reemplazo directo.'}${m.eolAnnounced.url?` <a href="${esc(m.eolAnnounced.url)}" target="_blank" rel="noopener">Boletín oficial</a>.`:''}</p>`:''}
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
     nota:`${m.fam} · Serie ${m.ser} · ${m.ports}${m.eolAnnounced?(vencido(m)?' · FIN DE VENTA VENCIDO':' · FIN DE VENTA ANUNCIADO'):''}`},
  ];
  (m.parts||[]).forEach(p=>filas.push({cat:'Módulos', desc:p, sku:p, qty, unit:null,
    nota:PARTS_DESC[p]||''}));
  // "Módulos NIM adicionales a cotizar" se leia del formulario y no llegaba a ninguna parte:
  // el usuario escribia 3 y el BOM salia sin ellos. Lo encontro el linter al marcar la
  // variable como no usada. No se inventa una referencia —el catalogo trae el numero de
  // slots, no una lista de NIM por modelo—, asi que la linea sale sin SKU y sin precio, que
  // es como este BOM declara lo que no tiene confirmado: bom.js las cuenta y avisa.
  if(nimQty>0){
    filas.push({cat:'Módulos', desc:'Módulos NIM adicionales', sku:null, qty:nimQty*qty, unit:null,
      nota:`${nimQty} por equipo × ${qty}. El equipo tiene ${m.nim} slot(s) NIM. `
        +'Referencia y precio a confirmar en CCW segun la interfaz que se necesite.'});
  }
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
      m.eolAnnounced?`  AVISO: fin de venta ${vencido(m)?'VENCIDO':'anunciado'} (${m.eolAnnounced.pid}), ultimo dia de pedido ${m.eolAnnounced.lastOrder}.`:null,
      m.eolAnnounced&&vencido(m)?'  Ya pasado: este equipo solo sirve como referencia de parque instalado.':null,
      m.eolAnnounced&&m.eolAnnounced.sucesor?`  Sucesor confirmado: ${m.eolAnnounced.sucesor}, mismo IOS XE SD-WAN.`:null,
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

  // Populate BOM model selector — orden determinista por capacidad (fwd): la API puede
  // servir el catalogo en cualquier orden y el combo no puede depender de eso. Series por
  // su modelo de entrada; dentro de cada serie, de menor a mayor.
  $('pickModel').innerHTML = (() => {
    const capDe=m=>m.fwd||m.ipsec||0;
    const groups={};
    MODELS.forEach(m=>{ (groups[m.ser]=groups[m.ser]||[]).push(m); });
    const ordenadas=Object.entries(groups);
    for(const [,arr] of ordenadas) arr.sort((a,b)=>capDe(a)-capDe(b));
    ordenadas.sort((a,b)=>Math.min(...a[1].map(capDe))-Math.min(...b[1].map(capDe)));
    return ordenadas.map(([g,arr])=>
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
  renderCatalogo();
  PROCEDENCIA.registrarModelos('cisco', () => MODELS.map(m => ({ model: m.id, ...m })));
})();

/* Enlace de eventos movido desde onclick= en el HTML, para permitir una CSP con
   script-src 'self' que bloquea todo codigo en linea. */
document.addEventListener('click', (e) => {
  const abrir = e.target.closest('[data-abrir]');
  if (abrir) { window.open(abrir.dataset.abrir, '_blank'); return; }
  const id = e.target.closest('button,[id]')?.id;
  // El boton #btnCsv desaparecio cuando js/bom.js centralizo la exportacion a Excel; la
  // rama que lo atendia sobrevivio detras de un `typeof ... === 'function'` que jamas era
  // cierto. La encontro el linter, no la vista: una rama muerta no se nota mirando.
  if (id === 'btnImprimir') window.print();
});

/* ══ ESTADO ENLAZABLE Y PERSISTENTE ══
   Antes, poner 2.500 Mbps y copiar la URL no servia de nada: quien la abria veia 500 Mbps y
   otra recomendacion. Ahora el escenario viaja en la URL; ya no se guarda entre sesiones
   (ver /js/estado.js). */
document.addEventListener('DOMContentLoaded', () => {
  const st = ESTADO.vincular({ campos: ['bw','unit','sites','conc','head','profile','plataforma','aps','sNgfw','sVoice','sAppx','sUmbrella','chkRedund','chk4g','critSeg','dirSeg','modeSeg','verdict-sel'] });
  const anclaje = document.querySelector('.tabs') || document.querySelector('.masthead');
  if (anclaje && anclaje.parentNode) {
    const caja = document.createElement('div');
    caja.className = 'estado-barra';
    caja.style.cssText = 'display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:0 0 14px';
    anclaje.parentNode.insertBefore(caja, anclaje.nextSibling);
    ESTADO.botonEnlace(caja);
    ESTADO.avisoOrigen(caja, st.origen);
  }
});

/* ══ ENVIAR AL COTIZADOR ══
   Solo esta pagina sabe que equipo esta elegido ahora mismo; el cotizador pone el precio y
   el resto de la linea desde su propio catalogo. Ver bom.js. */
document.addEventListener('DOMContentLoaded', () => {
  BOM.montarBotonCotizador(() => {
    const sel = document.getElementById('verdict-sel');
    const elegido = (sel && sel.value) || (lastPick && lastPick.id) || null;
    if (!elegido) return null;
    const cant = document.getElementById('qty');
    return { modelo: elegido, qty: Math.max(1, parseInt(cant && cant.value, 10) || 1),
             de: document.title.split('—')[0].trim() };
  });
});
