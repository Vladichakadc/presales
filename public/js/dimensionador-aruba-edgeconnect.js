'use strict';
// Dimensionador HPE Aruba Networking.
//
// El motor NO copia el de Fortinet, porque lo que publica HPE es otra cosa. Para
// EdgeConnect la cifra oficial es el RANGO DE CAUDAL WAN de cada appliance; para los
// gateways de las series 9000/9200 es el THROUGHPUT DE FIREWALL mas la capacidad de
// clientes y APs. Se dimensiona con lo que existe publicado en vez de inventar una
// escalera de capas homogenea.
let MODELS = [], BUNDLES = {}, CARE = {}, LICENSES = {}, SIZING = {},
    SOFTWARE = [], CENTRAL = {}, DATASHEETS = {};

const $=id=>document.getElementById(id);
let famMode='any', segMode='branch', lastPick=null;
let bomFilas=[], bomMeta={};

let ultimaRecomendacion=null;
function sincronizarConBom(elegido){
  const id=elegido?elegido.id:null;
  if(id===ultimaRecomendacion) return;
  ultimaRecomendacion=id;
  llevarABom(id);
}
// Eleccion explicita en el desplegable: se lleva al BOM siempre, sin el filtro de "solo
// si cambio la recomendacion" — aqui el usuario ya dijo que quiere ver ese equipo.
function llevarABom(id){
  if(!id) return;
  ultimaRecomendacion=id;
  const sel=$('pickModel');
  if(!sel||sel.value===id) return;
  sel.value=id;
  if(sel.value===id) renderBom();
}

document.querySelectorAll('.tabs button').forEach(b=>b.addEventListener('click',()=>{
  document.querySelectorAll('.tabs button').forEach(x=>x.setAttribute('aria-selected',x===b));
  ['calc','bom','lic'].forEach(t=>$('pane-'+t).hidden=(t!==b.dataset.tab));
}));

$('famSeg').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;[...$('famSeg').children].forEach(x=>x.setAttribute('aria-pressed',x===b));famMode=b.dataset.v;render();});
$('segSeg').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;[...$('segSeg').children].forEach(x=>x.setAttribute('aria-pressed',x===b));segMode=b.dataset.v;render();});
['bw','unit','users','aps','perUser','head','fecMode','boostProfile','chkBoost','chkSeg','chkBreakout','chkHa'].forEach(id=>$(id).addEventListener('input',render));

// Boost solo existe en EdgeConnect: pedirlo con el filtro en gateways daria una lista
// vacia sin explicar por que, asi que se mueve el filtro tambien.
$('chkBoost').addEventListener('change',()=>{
  if($('chkBoost').checked&&famMode!=='ec'&&famMode!=='any'){
    famMode='ec';
    [...$('famSeg').children].forEach(x=>x.setAttribute('aria-pressed',x.dataset.v==='ec'));
  }
  render();
});
$('chkHa').addEventListener('change',()=>{
  const q=$('qty');
  if($('chkHa').checked){ if((parseInt(q.value)||1)<2) q.value=2; }
  else if((parseInt(q.value)||1)===2){ q.value=1; }
  renderBom();
});
['pickModel','qty','termYears','licBundle','bwTier','boostBlocks','careLevel','centralTier','licCapTier']
  .forEach(id=>$(id).addEventListener('input',renderBom));

function fmt(m){
  if(m==null) return '—';
  if(m>=1000)return (m/1000).toFixed(m%1000?1:0)+' Gbps';
  return Math.round(m)+' Mbps';
}
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const miles=n=>n==null?'—':n.toLocaleString('en-US');

// La etiqueta de familia sale de la serie comercial, que es como el cliente nombra el
// equipo; `rol` es lo que de verdad filtra en preventa.
const famLabel=m=>m.serie+(m.fam==='ec'?' SD-WAN':' · gateway');
const SEG_MATCH={branch:/Sucursal|remota|peq|med/i,campus:/Campus|Hub/i,dc:/Datacenter|Head-end|Virtual/i};

// El filtro de plataforma combina familia y rol: 'ec' es EdgeConnect, y 'sucursal'/'campus'
// agrupan los gateways por para que sirven, no por su numero de serie.
function coincideFiltro(m,modo){
  if(modo==='any') return true;
  if(modo==='ec') return m.fam==='ec';
  return m.fam==='gw'&&m.rol===modo;
}

// Capacidad con la que compite cada modelo, en su propia unidad publicada.
//   EdgeConnect  -> tope del rango de caudal WAN
//   Gateways     -> throughput de firewall (en el 9240, el del nivel de licencia elegido)
function capacidad(m){
  if(m.fam==='ec') return m.wanMax;
  return m.fw;
}
// El 9240 escala por licencia perpetua sobre el mismo hardware: para decidir si cumple se
// mira su techo maximo, y luego se informa que nivel hace falta.
function capacidadMax(m){
  if(m.licCap&&m.licCap.length) return m.licCap[m.licCap.length-1].fw;
  return capacidad(m);
}
// En la serie 9200 la licencia perpetua amplia tambien clientes y APs, no solo el
// throughput: filtrar por la cifra de solo-hardware descartaba un 9240 que si cumple con
// Gold. Se compara contra el techo alcanzable y luego se informa que nivel hace falta.
function clientesMax(m){
  if(m.licCap&&m.licCap.length) return Math.max(...m.licCap.map(t=>t.clients));
  return m.clients;
}
function apsMax(m){
  if(m.licCap&&m.licCap.length) return Math.max(...m.licCap.map(t=>t.aps));
  return m.aps;
}
// Nivel de licencia que cubre a la vez throughput, clientes y APs.
function nivelLicenciaNecesario(m,need,users,aps){
  if(!m.licCap) return null;
  return m.licCap.find(t=>t.fw>=need&&t.clients>=(users||0)&&t.aps>=(aps||0))
    ||m.licCap[m.licCap.length-1];
}

function tierParaCaudal(mbps){
  const tiers=SIZING.bwTiers||[];
  for(const t of tiers){ if(t.mbps!=null&&t.mbps>=mbps) return t; }
  return tiers[tiers.length-1]||null;
}
// Boost se licencia en bloques de 100 Mbps que forman un pool del fabric.
function bloquesBoost(mbps){
  const b=(SIZING.boost&&SIZING.boost.bloque)||100;
  return Math.max(1,Math.ceil(mbps/b));
}

function render(){
  const bw=parseFloat($('bw').value)||0;
  const unit=parseFloat($('unit').value);
  const users=parseInt($('users').value)||0;
  const aps=parseInt($('aps').value)||0;
  // Mbps por usuario: es un supuesto, no un dato, y en campus grandes la regla de 3 Mbps
  // aplicada a decenas de miles de dispositivos da cifras que ningun equipo cumple. Por eso
  // es un control visible y no una constante escondida.
  const perUser=Math.max(0,parseFloat($('perUser').value)||0);
  const head=(parseFloat($('head').value)||0)/100;
  const boost=$('chkBoost').checked;
  $('headVal').textContent=Math.round(head*100)+' %';

  let featurePenalty=1.0;
  if($('chkSeg').checked) featurePenalty+=0.05;
  if($('chkBreakout').checked) featurePenalty+=0.05;

  // needProc: lo que el equipo PROCESA (trafico de aplicacion, lado LAN).
  // wanNeed:  lo que los enlaces TRANSPORTAN, que es lo que se contrata al operador y lo
  //           que fija el tier de suscripcion. Path Conditioning lo sube (la paridad FEC
  //           ocupa ancho de banda) y Boost lo baja (deduplica antes de salir).
  const bwBase=bw*unit*(1+head)*featurePenalty;
  const userBase=users*perUser*(1+head)*featurePenalty;
  const needProc=Math.max(bwBase,userBase);

  const fec=SIZING.fec[$('fecMode').value]||SIZING.fec.auto;
  const perfil=SIZING.boost.reduccion[$('boostProfile').value]||SIZING.boost.reduccion.generico;
  const wanNeed=needProc*(1+fec.pct)/(boost?perfil.factor:1);
  $('fecHint').textContent=fec.d;

  // La unidad en la que se compara depende de la familia, asi que el requerimiento tambien.
  const needDe=m=>(m.fam==='ec'?wanNeed:needProc);

  const maxCap=Math.max(...MODELS.map(m=>capacidadMax(m)||0));
  const logP=v=>Math.log10(Math.max(v,10));
  const logMin=Math.log10(10),logMax=logP(maxCap*1.2);
  const xPct=v=>(logP(v)-logMin)/(logMax-logMin)*100;

  const need=$('need');
  need.style.left=Math.min(xPct(wanNeed),99)+'%';
  $('needLbl').textContent=fmt(wanNeed);
  need.classList.toggle('flip',xPct(wanNeed)>60);

  const track=$('track');
  track.querySelectorAll('.dot,.tick,.pickLabel').forEach(e=>e.remove());
  const pickLbl=document.createElement('div');
  pickLbl.className='pickLabel'; pickLbl.id='pickLbl'; pickLbl.style.display='none';
  track.appendChild(pickLbl);
  [10,50,100,500,1000,5000,10000,40000].forEach(v=>{
    const pct=xPct(v);if(pct<0||pct>100)return;
    const tick=document.createElement('div');tick.className='tick';tick.style.left=pct+'%';
    tick.innerHTML=`<i></i><b>${v>=1000?v/1000+'G':v+'M'}</b>`;track.appendChild(tick);
  });
  MODELS.forEach(m=>{
    const cap=capacidadMax(m);if(cap==null)return;
    const pct=xPct(cap);if(pct<0||pct>100)return;
    const dot=document.createElement('div');
    dot.className='dot'+(cap>=needDe(m)?' ok':'');
    if(lastPick&&m.id===lastPick.id)dot.className='dot pick';
    dot.style.left=pct+'%';dot.title=m.id+': '+fmt(cap);
    track.appendChild(dot);
  });

  let outByBoost=0,outByClients=0,outByAps=0,outBySinDato=0,sobrado=[];
  const candidates=MODELS.filter(m=>{
    if(!coincideFiltro(m,famMode)) return false;
    if(boost&&m.boostMax==null){ outByBoost++; return false; }
    // EC-V no publica rango: se dimensiona por licencia y vCPU, no por hardware.
    if(m.fam==='ec'&&m.wanMax==null) return false;
    const cap=capacidadMax(m);
    // Sin cifra publicada no se puede afirmar que cumpla: se descarta y se explica, en
    // vez de colarlo con un numero inventado o de omitirlo en silencio.
    if(cap==null){ outBySinDato++; return false; }
    if(cap<needDe(m)) return false;
    const cMax=clientesMax(m), aMax=apsMax(m);
    if(cMax!=null&&users&&cMax<users){ outByClients++; return false; }
    if(aMax!=null&&aps&&aMax<aps){ outByAps++; return false; }
    return true;
  });
  // Generacion actual primero: entre dos que cumplen, la linea AOS 8 (series 7000/7200)
  // solo se propone si no hay un equivalente vigente. Sigue apareciendo como alternativa y
  // en el BOM, que es donde tiene sentido para ampliar un parque ya instalado. El criterio
  // pasa a ser el comun de ficha.js, que ademas deja fuera de la recomendacion lo que ya
  // no se vende, en vez de tener aqui una version propia de la misma regla.
  const ordenados=FICHA.ordenar(candidates,(a,b)=>capacidadMax(a)-capacidadMax(b));
  candidates.length=0; candidates.push(...ordenados);

  // Sobredimensionamiento: en EdgeConnect el rango publicado tiene suelo, y quedar por
  // debajo significa que hay un modelo mas barato que cumple. Es informacion de preventa
  // tan util como el techo.
  candidates.forEach(m=>{ if(m.fam==='ec'&&m.wanMin!=null&&wanNeed<m.wanMin) sobrado.push(m.id); });

  const rx=SEG_MATCH[segMode];
  const pick=FICHA.recomendar(candidates, rx?(m=>rx.test(m.seg)):null);
  lastPick=pick;
  sincronizarConBom(pick);

  const tier=tierParaCaudal(wanNeed);
  if(tier&&!$('bwTier').dataset.tocado) $('bwTier').value=tier.code;

  // ── Presentacion ──────────────────────────────────────────────────────────
  // El veredicto deja de ser un unico equipo fijo y pasa a ser un desplegable con TODOS
  // los que cumplen. Todo lo que se pinta debajo —medidores, escalera de capacidad,
  // resumen y BOM— sigue al equipo ELEGIDO, no al recomendado: en preventa casi nunca se
  // cotiza el primero de la lista a ciegas, se compara con el escalon siguiente.
  if(!pick){
    const why=[`<li>Caudal WAN requerido <b>${fmt(wanNeed)}</b> · proceso requerido <b>${fmt(needProc)}</b>.</li>`];
    if(outByBoost) why.push(`<li><b>${outByBoost}</b> modelo(s) descartado(s) por pedir Boost: la optimización WAN es exclusiva de EdgeConnect, los gateways de las series 9000, 9100 y 9200 no la hacen.</li>`);
    if(outByClients) why.push(`<li><b>${outByClients}</b> gateway(s) descartado(s) por capacidad de clientes: hacen falta ${miles(users)}.</li>`);
    if(outByAps) why.push(`<li><b>${outByAps}</b> gateway(s) descartado(s) por número de APs: hacen falta ${miles(aps)}.</li>`);
    if(outBySinDato) why.push(`<li><b>${outBySinDato}</b> modelo(s) sin cifra de throughput publicada en las fuentes consultadas (serie 9100). Aparecen en la pestaña "Equipo y BOM" y su capacidad hay que confirmarla en las QuickSpecs.</li>`);
    why.push('<li>Por encima del catálogo: repartir el fabric en varios head-ends, o escalar en el datacenter con EC-V, cuyo caudal lo fija la licencia y los vCPU asignados y no el hardware.</li>');
    FICHA.render({contenedor:'verdict', candidatos:[], recomendado:null,
      vacioTitulo:'Ningún modelo cumple todas las restricciones',
      vacioDetalle:`<ul style="margin:0;padding-left:18px;font-size:13.5px">${why.join('')}</ul>`});
    $('verdict').style.borderLeftColor='var(--amber)';
    $('perfTiers').innerHTML=''; $('perfNote').textContent='';
    $('sizingBox').innerHTML='<p style="font-size:13.5px;color:var(--steel)">Sin candidato para los parámetros actuales.</p>';
    return;
  }
  $('verdict').style.borderLeftColor='var(--red)';

  const medidoresDe=m=>{
    const cap=capacidadMax(m), req=needDe(m), out=[];
    out.push({etq:(m.fam==='ec'?'Caudal WAN vs. rango publicado':'Throughput de firewall'),
      val:req, tope:cap||0, txt:fmt(req)+' / '+fmt(cap)});
    if(m.clients!=null) out.push({etq:'Clientes soportados', val:users, tope:clientesMax(m)||0,
      txt:(users?miles(users)+' / ':'')+miles(clientesMax(m))});
    else out.push({etq:'Suelo del rango publicado', val:m.wanMin||0, tope:cap||0,
      txt:m.wanMin!=null?fmt(m.wanMin)+' mínimo':'según licencia'});
    return out;
  };

  const porQueDe=m=>{
    const cap=capacidadMax(m), req=needDe(m), nivel=nivelLicenciaNecesario(m,req,users,aps), flags=[];
    if(m.fam==='ec'){
      flags.push(`<b>Caudal WAN a contratar:</b> ${fmt(wanNeed)}${fec.pct?` (incluye ${Math.round(fec.pct*100)}% de paridad FEC)`:''}${boost?` tras la reducción ${perfil.factor}:1 de Boost sobre ${esc(perfil.n.toLowerCase())}`:''}. Tier de suscripción: <b>${tier?esc(tier.n):'—'}</b>.`);
      if(boost) flags.push(`<b>Boost:</b> el enlace transporta ${fmt(wanNeed)} en vez de ${fmt(needProc*(1+fec.pct))}. Se licencia en bloques de ${SIZING.boost.bloque} Mbps que forman un pool del fabric — para esta sede, <b>${bloquesBoost(needProc)} bloque(s)</b>.`);
      else flags.push('Admite Boost. Merece evaluarse si el tráfico es repetitivo (réplicas, backups, VDI, CIFS/SMB): reduce el caudal contratado, que a 3–5 años suele pesar más en el TCO que el propio equipo.');
      if(sobrado.includes(m.id)) flags.push(`<b class="warn">Sobredimensionado:</b> el requerimiento (${fmt(wanNeed)}) queda por debajo del suelo del rango publicado (${fmt(m.wanMin)}). Revisar el escalón inferior antes de cotizar.`);
    }
    if(m.legacy) flags.push('<b class="warn">Línea anterior (AOS 8):</b> las series 7000 y 7200 siguen en canal y son la respuesta natural para <b>ampliar un parque ya instalado</b>, pero para un despliegue nuevo conviene contrastar con la generación actual (series 9000/9100/9200 sobre AOS 10).');
    if(m.fam==='gw'&&m.rol==='sucursal'&&!m.legacy) flags.push(`<b>Sucursal:</b> el mismo equipo termina la WAN y hace de controladora de APs (hasta ${miles(m.aps)}), aplicando Dynamic Segmentation con el rol que traen el switch CX o el AP. No hace optimización WAN.`);
    if(m.licCap&&nivel) flags.push(`<b>Capacidad por licencia:</b> escala sin cambiar de hardware. Para ${fmt(req)} hace falta el nivel <b>${esc(nivel.n)}</b> (${fmt(nivel.fw)}, ${miles(nivel.aps)} APs, ${miles(nivel.clients)} dispositivos).`);
    if($('chkSeg').checked) flags.push('La segmentación multi-overlay requiere <b>EdgeConnect Advanced</b>: Foundation no la incluye.');
    if($('chkBreakout').checked) flags.push('La salida directa a Internet con First-packet iQ y el service chaining hacia un SSE también son de <b>Advanced</b>.');
    if($('chkHa').checked) flags.push('<b>HA:</b> se cotizan 2 unidades y cada una lleva su propia suscripción de sitio.');
    return `<ul style="margin:8px 0 0;padding-left:18px;font-size:13.5px">
      <li>Requerimiento <b>${fmt(req)}</b> contra capacidad <b>${fmt(cap)}</b> — headroom ${Math.round((1-req/cap)*100)}%</li>
      ${flags.map(f=>`<li>${f}</li>`).join('')}
    </ul>`;
  };

  // Ficha completa del equipo elegido: caracteristicas, licenciamiento propuesto para el
  // dimensionamiento actual, software del portafolio y soporte.
  const seccionesDe=m=>{
    const req=needDe(m), nivel=nivelLicenciaNecesario(m,req,users,aps);
    const nivelSub=($('chkSeg').checked||$('chkBreakout').checked)?'advanced':'foundation';
    const unidades=$('chkHa').checked?2:1;
    const caract=[
      ['Serie', esc(m.serie)],
      ['Segmento', esc(m.seg)],
    ];
    if(m.fam==='ec'){
      caract.push(['Rango de caudal WAN', m.wanMin!=null?`${fmt(m.wanMin)} – ${fmt(m.wanMax)}`:'según licencia y vCPU']);
      caract.push(['Optimización WAN (Boost)', m.boostMax!=null?`hasta ${fmt(m.boostMax)}`:'—']);
    }else{
      caract.push(['Throughput de firewall', m.fw!=null?fmt(m.fw):'<span class="warn">no publicado</span>']);
      if(m.clients!=null) caract.push(['Clientes / APs', `${miles(m.clients)} / ${miles(m.aps)}`]);
      if(m.fwSess!=null) caract.push(['Sesiones de firewall', miles(m.fwSess)]);
      if(m.ipsecSess!=null) caract.push(['Sesiones IPsec', miles(m.ipsecSess)]);
      if(m.greTuns!=null) caract.push(['Túneles GRE', miles(m.greTuns)]);
    }
    caract.push(['Interfaces', esc(m.ifaces), true]);
    caract.push(['Referencias pedibles',
      (m.skus||[]).map(r=>`${r.sku?`<code>${esc(r.sku)}</code>`:'<span class="bom-nd">sin SKU</span>'} ${esc(r.d)}`).join('<br>')||'—', true]);
    caract.push(['Datasheet', (m.dsLocal||m.ds)
      ?`<a href="${esc(m.dsLocal||m.ds)}" target="_blank" rel="noopener">Abrir documento</a>${m.dsLocal?' (copia local)':''}`
      :'<span class="warn">Sin URL oficial confirmada</span>', true]);
    caract.push(['Precio de lista', m.elpN!=null?esc(m.elp):'Consultar distribuidor']);

    const lic=[];
    if(m.fam==='ec'){
      lic.push(['Nivel de suscripción', esc(BUNDLES[nivelSub].n)]);
      lic.push(['Tier de caudal del sitio', tier?esc(tier.n):'—']);
      lic.push(['Boost', boost?`${bloquesBoost(needProc)} bloque(s) de ${SIZING.boost.bloque} Mbps (pool del fabric)`:'No incluido']);
    }else{
      lic.push(['Suscripción de gestión', esc(CENTRAL.advanced?CENTRAL.advanced.n:'Central')]);
      if(m.licCap) lic.push(['Licencia perpetua de capacidad', nivel?esc(nivel.n):'—']);
    }
    lic.push(['Unidades a licenciar', unidades===2?'2 — cada nodo del par lleva la suya':'1']);

    const soft=(SOFTWARE||[]).map(sw=>[esc(sw.id), esc(sw.cat)]);
    const care=CARE[$('careLevel')&&$('careLevel').value?$('careLevel').value:'fc247']||Object.values(CARE)[0];

    return [
      {titulo:'Características del equipo', filas:caract},
      {titulo:'Licenciamiento propuesto', filas:lic,
       nota:m.fam==='ec'?'La suscripción de EdgeConnect va por <b>caudal del sitio</b>, no por modelo de appliance.'
                        :'Los gateways se gestionan por suscripción de Central; la serie 9200 escala su capacidad por licencia perpetua sobre el mismo hardware.'},
      {titulo:'Software del portafolio', filas:soft,
       nota:'Orchestrator no se licencia por dispositivo gestionado.'},
      {titulo:'Soporte', filas:[[esc(care.n), esc(care.sla)]], nota:esc(care.d)},
    ];
  };

  const pintarDependientes=m=>{
    const req=needDe(m), nivel=nivelLicenciaNecesario(m,req,users,aps);
    $('pickLbl').textContent=m.id; $('pickLbl').style.display='block';
    $('pickLbl').style.left=xPct(capacidadMax(m))+'%';
    renderFicha(m,req,users,aps);
    $('sizingBox').innerHTML=`
      <table><tbody>
        <tr><td>Equipo evaluado</td><td class="n">${esc(m.id)}${m.id===pick.id?'':' (elegido a mano)'}</td></tr>
        <tr><td>Familia</td><td class="n">${esc(famLabel(m))}</td></tr>
        <tr><td>Optimización WAN (Boost)</td><td class="n">${boost?`Activa — reducción ${perfil.factor}:1 (${esc(perfil.n)})`:'No'}</td></tr>
        <tr><td>Path Conditioning (FEC)</td><td class="n">${esc(fec.n)}${fec.pct?` — +${Math.round(fec.pct*100)}%`:''}</td></tr>
        <tr><td>Ancho de banda de aplicación</td><td class="n">${fmt(bw*unit)}</td></tr>
        <tr><td>Usuarios / dispositivos</td><td class="n">${miles(users)}${perUser?` x ${perUser} Mbps`:' (sin tráfico por usuario)'}</td></tr>
        ${aps?`<tr><td>APs a gestionar</td><td class="n">${miles(aps)}</td></tr>`:''}
        <tr><td><b>Proceso requerido en el equipo</b></td><td class="n"><b>${fmt(needProc)}</b></td></tr>
        <tr><td><b>Caudal WAN a contratar</b></td><td class="n"><b>${fmt(wanNeed)}</b></td></tr>
        ${m.fam==='ec'?`<tr><td>Tier de suscripción</td><td class="n">${tier?esc(tier.n):'—'}</td></tr>`:''}
        ${boost?`<tr><td>Bloques de Boost para esta sede</td><td class="n">${bloquesBoost(needProc)} x ${SIZING.boost.bloque} Mbps</td></tr>`:''}
        ${nivel?`<tr><td>Nivel de licencia perpetua</td><td class="n">${esc(nivel.n)}</td></tr>`:''}
        <tr><td>Unidades a cotizar</td><td class="n">${$('chkHa').checked?'2 (HA) — licencia por unidad':'1'}</td></tr>
      </tbody></table>`;
  };

  const elegidoId=FICHA.render({
    contenedor:'verdict',
    candidatos:candidates,
    recomendado:pick.id,
    etiqueta:m=>`${m.id} — ${m.serie} · ${fmt(capacidadMax(m))}`,
    titulo:m=>m.id,
    subtitulo:m=>m.seg+' · '+famLabel(m),
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

// Ficha de capacidad del modelo elegido, con las cifras que HPE realmente publica para su
// familia. No se fuerza una escalera comun: cada familia se describe con lo suyo.
function renderFicha(m,need,users,aps){
  $('perfModel').textContent='— '+m.id;
  let filas='';
  const barra=(etq,val,tope,activo)=>`<div class="tierRow ${activo?'on':'off'}">
      <span class="tn">${esc(etq)}</span>
      <span class="tb"><i style="width:${Math.max(2,Math.min(100,val/tope*100))}%"></i></span>
      <span class="tv">${fmt(val)}</span></div>`;

  if(m.fam==='ec'){
    const tope=m.wanMax||1;
    filas+=barra('Suelo del rango',m.wanMin,tope,false);
    filas+=barra('Techo del rango',m.wanMax,tope,true);
    if(m.boostMax!=null) filas+=barra('Con Boost (máx.)',m.boostMax,tope,$('chkBoost').checked);
  }else if(m.licCap){
    const tope=m.licCap[m.licCap.length-1].fw;
    const nivel=nivelLicenciaNecesario(m,need,users,aps);
    m.licCap.forEach(t=>{ filas+=barra(t.n,t.fw,tope,nivel&&t.code===nivel.code); });
  }else if(m.fw!=null){
    filas+=barra('Firewall',m.fw,m.fw,true);
  }else{
    filas+='<div class="tierRow off"><span class="tn">Firewall</span><span class="tb"></span>'
      +'<span class="tv">no publicado</span></div>';
  }
  $('perfTiers').innerHTML=filas;

  const extra=[];
  if(m.clients!=null) extra.push(`${miles(m.clients)} clientes`);
  if(m.aps!=null) extra.push(`${miles(m.aps)} APs`);
  if(m.ipsecSess!=null) extra.push(`${miles(m.ipsecSess)} sesiones IPsec`);
  if(m.greTuns!=null) extra.push(`${miles(m.greTuns)} túneles GRE`);

  $('perfNote').innerHTML=(m.fam==='ec'
    ? 'HPE publica para EdgeConnect un <b>rango de caudal WAN</b>, no un throughput único: por eso el dimensionamiento usa ese rango. '
      + 'Quedar por debajo del suelo indica sobredimensionamiento, y es tan accionable como pasarse del techo. '
    : m.licCap
      ? 'La capacidad de este equipo la fija la <b>licencia perpetua</b>, no el hardware: el mismo chasis entrega 20, 30 o 40 Gbps según el nivel. '
        + 'En una comparativa contra un competidor que vende la capacidad cerrada en el equipo, esto es lo que hay que poner sobre la mesa. '
      : m.fw==null
        ? 'HPE no publica el throughput de firewall de esta serie en las fuentes consultadas, asi que no se dimensiona por capacidad: hay que confirmarlo en las QuickSpecs enlazadas. '
        : 'Gateway de sucursal: termina la WAN y hace de controladora de APs en el mismo equipo. No hace optimización WAN. ')
    + (extra.length?`Capacidad publicada: ${extra.join(' · ')}. `:'')
    + `Referencias: ${esc((m.skus||[]).map(r=>r.sku||r.d).join(' · ')||'—')}. Requerimiento actual: <b>${fmt(need)}</b>.`;
}

/* BOM */
function populateSelects(){
  const series=[...new Set(MODELS.map(m=>m.serie))];
  $('pickModel').innerHTML=series.map(se=>`<optgroup label="${esc(se)}">`
    +MODELS.filter(m=>m.serie===se).map(m=>`<option value="${esc(m.id)}">${esc(m.id)} — ${esc(m.seg)}</option>`).join('')
    +'</optgroup>').join('');
  $('bwTier').innerHTML=(SIZING.bwTiers||[]).map(t=>`<option value="${esc(t.code)}">${esc(t.n)}</option>`).join('');
  $('licBundle').innerHTML=Object.entries(BUNDLES).map(([k,b])=>`<option value="${esc(k)}"${k==='advanced'?' selected':''}>${esc(b.n)}</option>`).join('');
  $('careLevel').innerHTML=Object.entries(CARE).map(([k,c])=>`<option value="${esc(k)}"${k==='fc247'?' selected':''}>${esc(c.n)}</option>`).join('');
  $('centralTier').innerHTML=Object.entries(CENTRAL).map(([k,c])=>`<option value="${esc(k)}"${k==='advanced'?' selected':''}>${esc(c.n)}</option>`).join('');
  $('bwTier').addEventListener('change',()=>{$('bwTier').dataset.tocado='1';});
  // Documentos oficiales, para llegar al PDF sin buscarlo.
  // Se prefiere la copia local (servida detras del login, sin depender de que HPE
  // mantenga la URL) y se cae a la oficial si ese PDF no esta descargado.
  $('dsList').innerHTML=Object.values(DATASHEETS).map(d=>{
    const local=!!d.local;
    return `<li><a href="${esc(local?d.local:d.url)}" target="_blank" rel="noopener">${esc(d.n)}</a>`
      +(local?' <span class="pillc">copia local</span>'
             :` <span class="sku" style="display:inline">— <a href="${esc(d.url)}" target="_blank" rel="noopener">en hpe.com</a></span>`)
      +'</li>';
  }).join('');
  // Software del portafolio.
  $('swTabla').innerHTML=SOFTWARE.map(s=>`<tr><td><b>${esc(s.id)}</b><br><span class="sku">${esc(s.cat)}</span></td>
    <td>${esc(s.d)}</td><td class="n"><a href="${esc(s.ds)}" target="_blank" rel="noopener">Documento</a></td></tr>`).join('');
}

const money=n=>n==null?null:'$'+n.toLocaleString('en-US',{maximumFractionDigits:2});
function tierPrice(t,y){ if(!t) return null; const v=y===1?t.y1:y===5?t.y5:t.y3; return v==null?null:v; }

function renderBom(){
  const m=MODELS.find(x=>x.id===$('pickModel').value)||MODELS[0];
  if(!m) return;
  const qty=Math.max(1,parseInt($('qty').value)||1);
  const termYrs=parseInt($('termYears').value)||3;
  const bundle=$('licBundle').value||'advanced';
  const care=$('careLevel').value||'fc247';
  const central=$('centralTier').value||'advanced';
  const bwCode=$('bwTier').value;
  const bwTier=(SIZING.bwTiers||[]).find(t=>t.code===bwCode)||null;
  const bloques=Math.max(0,parseInt($('boostBlocks').value)||0);
  const capTierCode=$('licCapTier').value;

  const esEC=m.fam==='ec', esGwc=!!m.licCap;
  // Los controles que no aplican a la familia elegida se ocultan, en vez de dejar que
  // alguien cotice un pool de Boost sobre un gateway que no lo soporta.
  $('fldBw').hidden=!esEC; $('fldBundle').hidden=!esEC; $('fldBoost').hidden=!esEC;
  $('fldCentral').hidden=esEC; $('fldCapTier').hidden=!esGwc;

  const lic=LICENSES[bwCode]||null;
  const licTier=lic?lic[bundle]:null;
  const careTier=lic?lic.care[care]:null;
  const licPrice=tierPrice(licTier,termYrs);
  const carePrice=tierPrice(careTier,termYrs);
  const termino=`término ${termYrs} año${termYrs>1?'s':''}`;
  const capTier=esGwc&&m.licCap?(m.licCap.find(t=>t.code===capTierCode)||m.licCap[0]):null;

  let html=`<section class="panel"><h2>Ficha del equipo</h2>
    <div class="model" style="font-size:28px">${esc(m.id)}</div>
    <p class="family">${esc(m.seg)} · ${esc(famLabel(m))}</p>
    <div class="scroll"><table><thead><tr><th>Métrica</th><th>Valor</th></tr></thead><tbody>
    <tr><td>SKU de hardware</td><td class="n">${m.hwSku?`<code>${esc(m.hwSku)}</code>`:'<span class="warn">Sin SKU confirmado — ver variantes</span>'}</td></tr>
    <tr><td>Referencias pedibles</td><td>${(m.skus||[]).map(r=>`${r.sku?`<code>${esc(r.sku)}</code>`:'<span class="bom-nd">sin SKU confirmado</span>'} — ${esc(r.d)}`).join('<br>')||'—'}</td></tr>
    <tr><td>Precio de lista ref.</td><td class="n">${m.elpN!=null?esc(m.elp):'Consultar distribuidor'}</td></tr>
    ${esEC?`<tr><td><b>Rango de caudal WAN publicado</b></td><td class="n"><b>${m.wanMin!=null?fmt(m.wanMin)+' – '+fmt(m.wanMax):'según licencia y vCPU'}</b></td></tr>
    <tr><td>Optimización WAN (Boost)</td><td class="n">${m.boostMax!=null?'Soportada · bloques de '+SIZING.boost.bloque+' Mbps':'—'}</td></tr>`
    :`<tr><td><b>Throughput de firewall</b></td><td class="n">${m.fw!=null?`<b>${fmt(m.fw)}</b>${esGwc?' (solo hardware)':''}`:'<span class="warn">No publicado en las fuentes consultadas</span>'}</td></tr>
    ${m.fwSess!=null?`<tr><td>Sesiones de firewall activas</td><td class="n">${miles(m.fwSess)}</td></tr>`:''}
    <tr><td>Clientes / APs</td><td class="n">${miles(m.clients)} / ${miles(m.aps)}</td></tr>
    ${m.ipsecSess!=null?`<tr><td>Sesiones IPsec concurrentes</td><td class="n">${miles(m.ipsecSess)}</td></tr>`:''}
    ${m.greTuns!=null?`<tr><td>Túneles GRE</td><td class="n">${miles(m.greTuns)}</td></tr>`:''}`}
    <tr><td>Interfaces</td><td>${esc(m.ifaces)}</td></tr>
    <tr><td>Datasheet oficial</td><td class="n">${(m.dsLocal||m.ds)?`<a href="${esc(m.dsLocal||m.ds)}" target="_blank" rel="noopener">Abrir documento</a>${m.dsLocal?' <span class="pillc">local</span>':''}`:'<span class="warn">Sin URL oficial confirmada</span>'}</td></tr>
    </tbody></table></div></section>`;

  if(esGwc&&m.licCap){
    html+=`<section class="panel"><h2>Capacidad por nivel de licencia</h2>
      <p class="hint" style="margin:0 0 10px">El mismo hardware entrega tres capacidades distintas según la licencia perpetua. Ampliar no exige cambiar el equipo.</p>
      <div class="scroll"><table><thead><tr><th>Nivel</th><th>Throughput</th><th>APs</th><th>Dispositivos</th></tr></thead><tbody>
      ${m.licCap.map(t=>`<tr${capTier&&t.code===capTier.code?' style="font-weight:600"':''}><td>${esc(t.n)}</td><td class="n">${fmt(t.fw)}</td><td class="n">${miles(t.aps)}</td><td class="n">${miles(t.clients)}</td></tr>`).join('')}
      </tbody></table></div></section>`;
  }

  html+=`<section class="panel"><h2>${esEC?'Suscripción EdgeConnect':'Suscripción y licencias'}</h2><ul class="clean">
    ${esEC?`<li class="on"><b>${esc(BUNDLES[bundle].n)}</b><span class="req">Requerida</span><span class="sku">${esc(BUNDLES[bundle].svcs)}<br>Tier de caudal: <b>${bwTier?esc(bwTier.n):'—'}</b> · ${termino}${licPrice!=null?' · '+money(licPrice):' · <span class="warn">precio no verificado</span>'}</span></li>
    <li${bloques?' class="on"':''}><b>${esc(SIZING.boost.n)}</b><span class="req${bloques?'':' opt'}">${bloques?'Incluido':'Opcional'}</span><span class="sku">${esc(SIZING.boost.svcs)}${bloques?`<br>Pool: <b>${bloques} bloque(s) de ${SIZING.boost.bloque} Mbps = ${fmt(bloques*SIZING.boost.bloque)}</b> — se licencia una vez para todo el fabric, no por sede.`:''}</span></li>`
    :`<li class="on"><b>${esc(CENTRAL[central].n)}</b><span class="req">Requerida</span><span class="sku">${esc(CENTRAL[central].d)} · suscripción por dispositivo · ${termino}</span></li>
    ${capTier&&capTier.code!=='hw'?`<li class="on"><b>Licencia perpetua ${esc(capTier.n)}</b><span class="req">Requerida</span><span class="sku">Amplía el mismo hardware a ${fmt(capTier.fw)}, ${miles(capTier.aps)} APs y ${miles(capTier.clients)} dispositivos.</span></li>`:''}`}
    <li><b>EdgeConnect Orchestrator</b><span class="req opt">Incluido</span><span class="sku">Gestión del fabric, Business Intent Overlays y ZTP. No se licencia por dispositivo gestionado.</span></li>
  </ul></section>`;

  html+=`<section class="panel"><h2>Soporte HPE</h2><div class="scroll"><table>
    <thead><tr><th>Servicio</th><th>SLA</th><th>SKU</th><th>Término</th><th>Precio ref.</th><th>Qty</th></tr></thead><tbody>
    <tr><td>${esc(CARE[care].n)}</td><td class="n">${esc(CARE[care].sla)}</td><td class="n">${careTier&&careTier.sku?`<code>${esc(careTier.sku)}</code>`:'<span class="warn">Sin SKU verificado</span>'}</td><td class="n">${termYrs} años</td><td class="n">${carePrice!=null?money(carePrice):'—'}</td><td class="n">${qty}</td></tr>
    </tbody></table></div><p class="hint" style="margin-top:8px">${esc(CARE[care].d)}</p></section>`;

  $('bomBody').innerHTML=html;

  // El pool de Boost NO multiplica por unidad: es un caudal agregado del fabric.
  const filas=[
    {cat:'Equipo', desc:m.id, sku:m.hwSku||null, qty, unit:m.elpN!=null?m.elpN:null,
     nota:`${m.seg} · ${famLabel(m)} · ${m.ifaces}`},
  ];
  if(esEC){
    filas.push({cat:'Suscripción SD-WAN', desc:`${BUNDLES[bundle].n} — ${bwTier?bwTier.n:'tier por definir'}`,
      sku:licTier&&licTier.sku?licTier.sku:null, qty, unit:licPrice,
      nota:`${termino} · suscripción por caudal del sitio, no por modelo de appliance`});
    if(bloques){
      filas.push({cat:'Aceleración', desc:`${SIZING.boost.n} — ${bloques} bloque(s) de ${SIZING.boost.bloque} Mbps`,
        sku:null, qty:1, unit:null,
        nota:`Pool agregado del fabric (${fmt(bloques*SIZING.boost.bloque)}). Orchestrator lo reparte entre sedes; no multiplica por unidad.`});
    }
  }else{
    filas.push({cat:'Suscripción de gestión', desc:CENTRAL[central].n, sku:null, qty, unit:null,
      nota:`${termino} · HPE Aruba Networking Central, suscripción por dispositivo`});
    if(capTier&&capTier.code!=='hw'){
      filas.push({cat:'Licencia perpetua', desc:`Capacidad ${capTier.n}`, sku:null, qty, unit:null,
        nota:`Amplía el mismo hardware a ${fmt(capTier.fw)} · ${miles(capTier.aps)} APs · ${miles(capTier.clients)} dispositivos`});
    }
  }
  filas.push({cat:'Soporte', desc:CARE[care].n, sku:careTier&&careTier.sku?careTier.sku:null, qty, unit:carePrice,
    nota:`${termino} · ${CARE[care].sla}`});

  const meta={
    titulo:`Lista de materiales — ${m.id}`,
    subtitulo:`${m.seg} · ${famLabel(m)} · ${termino}`,
    archivo:`BOM_${m.id}`,
    notas:[
      '',
      'CAPACIDAD PUBLICADA POR HPE',
      esEC?`  Rango de caudal WAN:  ${m.wanMin!=null?fmt(m.wanMin)+' - '+fmt(m.wanMax):'segun licencia y vCPU'}`
          :`  Throughput firewall:  ${m.fw!=null?fmt(m.fw):'no publicado en las fuentes consultadas'}`,
      m.clients!=null?`  Clientes / APs:       ${miles(m.clients)} / ${miles(m.aps)}`:null,
      m.ipsecSess!=null?`  Sesiones IPsec:       ${miles(m.ipsecSess)}`:null,
      m.greTuns!=null?`  Tuneles GRE:          ${miles(m.greTuns)}`:null,
      `  Interfaces:           ${m.ifaces}`,
      `  Referencias:          ${(m.skus||[]).map(r=>(r.sku||'sin SKU')+' '+r.d).join(' | ')||'-'}`,
      `  Datasheet:            ${m.ds||'sin URL oficial confirmada'}`,
      m.dsLocal?`  Copia local:          ${m.dsLocal}`:null,
      '',
      esEC?'COMO SE LICENCIA EDGECONNECT':'COMO SE LICENCIA ESTE GATEWAY',
      esEC?'  La suscripcion va por CAUDAL DEL SITIO (100 Mbps, 1 Gbps o ilimitado), no por modelo'
          :'  Gestion por suscripcion de Central (Foundation o Advanced) por dispositivo.',
      esEC?'  de appliance: subir de caudal no obliga a cambiar el hardware mientras el equipo de'
          :(esGwc?'  En la serie 9200 la CAPACIDAD la fija la licencia perpetua (Silver/Gold) sobre el':'  La serie 9000 no hace optimizacion WAN: su ventaja es unificar WAN, LAN y WLAN.'),
      esEC?'  la talla. Boost es un add-on en bloques de 100 Mbps que forman un POOL del fabric,'
          :(esGwc?'  mismo hardware, sin cambiar de equipo.':''),
      esEC?'  repartido por Orchestrator, asi que se compra solo para las sedes que lo aprovechan.':'',
      '',
      'ADVERTENCIA DE DATOS',
      '  Cifras tomadas de paginas de producto y tienda oficiales de HPE/Aruba. Los SKU de',
      '  hardware son reales; NO hay price list verificado, por eso las lineas van sin importe.',
      '  Abrir el datasheet enlazado y confirmar la fila exacta antes de emitir la propuesta.',
      qty>1?`  Par de ${qty} unidades: la suscripcion de sitio no se comparte, cada nodo lleva la suya.`:null,
    ].filter(n=>n!==null&&n!==''),
  };

  $('bomTabla').innerHTML=BOM.renderTabla(filas,{
    aviso:'Precios de Aruba pendientes de verificación contra price list — las líneas figuran sin cotizar a propósito. Los SKU de hardware sí están tomados de la tienda oficial de HPE.',
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
  SOFTWARE = data.software || [];
  CENTRAL = data.centralTiers || {};
  DATASHEETS = data.datasheets || {};

  populateSelects();
  render();
  renderBom();
})();

/* Enlace de eventos movido desde onclick= en el HTML, para permitir una CSP con
   script-src 'self' que bloquea todo codigo en linea. */
document.addEventListener('click', (e) => {
  const id = e.target.closest('button,[id]')?.id;
  if (id === 'btnImprimir') window.print();
});

/* ══ ESTADO ENLAZABLE Y PERSISTENTE ══
   Antes, poner 2.500 Mbps y copiar la URL no servia de nada: quien la abria veia 500 Mbps y
   otra recomendacion. Ahora el escenario viaja en la URL y sobrevive a una recarga. Ver
   /js/estado.js para por que hacen falta la URL Y el almacenamiento local, y no uno solo. */
document.addEventListener('DOMContentLoaded', () => {
  const st = ESTADO.vincular({ clave: 'dimensionador-aruba-edgeconnect', campos: ['bw','unit','users','aps','perUser','head','fecMode','boostProfile','chkBoost','chkBreakout','chkHa','famSeg','segSeg','verdict-sel'] });
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
