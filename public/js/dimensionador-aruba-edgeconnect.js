'use strict';
// Dimensionador HPE Aruba Networking.
//
// El motor NO copia el de Fortinet, porque lo que publica HPE es otra cosa. Para
// EdgeConnect la cifra oficial es el RANGO DE CAUDAL WAN de cada appliance; para los
// gateways de las series 9000/9200 es el THROUGHPUT DE FIREWALL mas la capacidad de
// clientes y APs. Se dimensiona con lo que existe publicado en vez de inventar una
// escalera de capas homogenea.
let MODELS = [], BUNDLES = {}, CARE = {}, CARE_SKU = {}, LICENSES = {}, SIZING = {},
    SOFTWARE = [], CENTRAL = {}, DATASHEETS = {};

// Catálogo pedible completo (hardware, remanufacturados, suscripciones, servicios) cargado
// del CSV público de lista de precios. Es la fuente del panel "Añadir a la lista de
// materiales": todas las referencias de pedido de la página viven integradas en el BOM.
let SKU_CAT = [];        // [{sku, d, p, vig, plc, cat}]
let skuFiltro = '', skuCatActiva = null;

// Config comun de la ficha en esta pagina (ficha.js la REEMPLAZA entera en cada render,
// asi que hay que pasarla siempre): sin selector propio —el unico es pickModel, unificado
// 2026-09-13— y sin tabla de referencias —integradas en la lista de materiales—.
const FICHA_CFG={vendor:'aruba', refs:false, selector:false,
  refsNota:'Las referencias de pedido de este equipo —y de todo el catálogo de Aruba: hardware, remanufacturados, suscripciones EdgeConnect, Boost, Central y licencias perpetuas— están integradas en la lista de materiales. Allí se añaden y se quitan con su SKU y su List Price.'};

// El modelo viaja en la URL como parte del escenario compartible, pero ESTADO reescribe el
// querystring al vincular —cuando el desplegable aun no tiene opciones y no puede
// reponerlo— y el parametro se pierde. Se captura aqui, al cargar el script (antes de que
// ESTADO corra en DOMContentLoaded), y se reaplica en initApp con el catalogo ya puesto.
const QMODEL_URL=new URLSearchParams(location.search).get('pickModel');

const $=id=>document.getElementById(id);
let famMode='any', segMode='branch', lastPick=null;
let bomFilas=[], bomMeta={};

// El equipo del dimensionamiento se lleva solo al BOM. La regla vive en js/bom.js —
// `BOM.sincronizar` distingue lo heredado de lo elegido a mano y repinta siempre, para
// que un cambio de escenario no deje el BOM cotizando el equipo anterior.
function sincronizarConBom(elegido){
  BOM.sincronizar({elegido:elegido?elegido.id:null, render:renderBom});
}
// Eleccion explicita en el desplegable: se lleva al BOM siempre.
function llevarABom(id){
  BOM.sincronizar({elegido:id||null, render:renderBom});
}

document.querySelectorAll('.tabs button').forEach(b=>b.addEventListener('click',()=>{
  document.querySelectorAll('.tabs button').forEach(x=>x.setAttribute('aria-selected',x===b));
  ['calc','bom','lic','cat','src'].forEach(t=>$('pane-'+t).hidden=(t!==b.dataset.tab));
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
// Estos campos disparan render() y no solo renderBom: con la unificacion de 2026-09-13 la
// ficha misma muestra la suscripcion, las licencias y el soporte elegidos (incluidos los
// «No incluir»), asi que hay que repintarla entera, no solo la lista de materiales. El tier
// manual se conserva: render solo lo propone si el campo no esta «tocado».
['qty','termYears','licBundle','bwTier','boostBlocks','careLevel','centralTier','licCapTier']
  .forEach(id=>$(id).addEventListener('input',render));
// El modelo es el selector UNICO de la pagina: cambiarlo a mano mueve ficha, resumen,
// escalera y BOM, no solo la lista. La marca de eleccion manual se fija ANTES de render,
// porque render podria reponer el recomendado si la tomara por heredada.
$('pickModel').addEventListener('change',()=>{ $('pickModel').dataset.bomManual='1'; render(); });

function fmt(m){
  if(m==null) return '—';
  if(m>=1000)return (m/1000).toFixed(m%1000?1:0)+' Gbps';
  return Math.round(m)+' Mbps';
}
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const miles=n=>n==null?'—':n.toLocaleString('en-US');

// Catálogo Aruba, con la misma tabla que antes vivía en la vista de Aruba del portal (ver
// CLAUDE.md, 2026-09-10): se pinta desde MODELS, ya cargado para el propio dimensionador.
// EdgeConnect (rol sdwan) publica un RANGO de caudal WAN, no una cifra única; los gateways
// (sucursal/campus) publican throughput de firewall — son dos medidas distintas, así que la
// columna "Capacidad" declara cuál está mostrando en vez de fundirlas en un solo número.
function renderCatalogo(){
  const tbody=document.querySelector('#tbl-aruba-cat tbody');
  if(!tbody) return;
  tbody.innerHTML=MODELS.map(m=>{
    const cap=m.rol==='sdwan'
      ? `${fmt(m.wanMin)} – ${fmt(m.wanMax)} (rango WAN)`
      : `${fmt(m.fw)} (firewall)`;
    return `<tr>
    <td><code>${esc(m.id)}</code></td><td>${esc(m.serie)}</td><td>${esc(m.seg)}</td>
    <td class="n">${cap}</td><td>${esc(m.ifaces)}</td>
  </tr>`;
  }).join('');
}

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
// Ficha técnica de datasheet (campo `spec` del catálogo, 2026-09-13): pares clave →
// etiqueta en el orden en que deben aparecer. Claves ausentes = HPE no publica el dato
// para ese modelo y la fila simplemente no se pinta (nunca se inventa un valor).
const SPEC_LABELS=[
  ['conexiones','Conexiones simultáneas'],
  ['boostRec','Boost recomendado por HPE'],
  ['idsips','IDS/IPS integrado'],
  ['encTput','Throughput cifrado'],
  ['ssl','Sesiones SSL concurrentes'],
  ['tuneles','Túneles / puertos tunelizados'],
  ['peers','Peers de fabric máx.'],
  ['prefijos','Prefijos de ruteo'],
  ['vlanMax','VLANs máx.'],
  ['ospf','Rutas OSPF'],
  ['acls','ACLs'],
  ['dhcp','Clientes DHCP'],
  ['bridge','Tabla de bridge'],
  ['cps','Sesiones nuevas por segundo'],
  ['cluster','Clustering'],
  ['aps10','APs máx. (AOS 10)'],
  ['lte','Módem LTE integrado'],
  ['ram','Memoria RAM'],
  ['disco','Almacenamiento'],
  ['fru','Componentes reemplazables en campo (FRU)'],
  ['certs','Certificaciones'],
  ['mtbf','MTBF'],
  ['watts','Alimentación / consumo'],
  ['btu','Disipación térmica'],
  ['ruido','Ruido acústico'],
  ['dims','Dimensiones (Al × An × Pr)'],
  ['peso','Peso'],
  ['extra','Notas del datasheet'],
];
// Condiciones ambientales de TODA la línea EdgeConnect (Hardware Reference p.33): no se
// repiten en cada modelo porque el documento las declara a nivel de línea.
const EC_AMBIENTE='Operación 0 – 40 °C · almacenamiento -40 – 65 °C · altitud 3.048 m operando / 12.192 m almacenado · humedad 5 – 95 % sin condensar';
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
  // Sin ancho de banda no hay recomendación (regla de preventa 2026-09-13): el campo es
  // el dato mínimo del dimensionamiento; sin él la página pide valores en vez de proponer
  // un equipo a ciegas.
  if(bw<=0){
    lastPick=null; sincronizarConBom(null);
    poblarPickModel([], null);
    const need=$('need'); need.style.left='0%'; $('needLbl').textContent='—';
    $('track').querySelectorAll('.dot,.tick,.pickLabel').forEach(e=>e.remove());
    FICHA.render({...FICHA_CFG, contenedor:'verdict', candidatos:[], recomendado:null,
      vacioTitulo:'Ingrese valores para recomendar un equipo',
      vacioDetalle:'<p style="margin:0;font-size:13.5px">Escriba el <b>ancho de banda</b> del sitio (y si aplica, usuarios y APs) para que el dimensionador proponga los modelos que cumplen.</p>'});
    $('verdict').style.borderLeftColor='var(--steel)';
    return;
  }
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
    poblarPickModel([], null);
    FICHA.render({...FICHA_CFG, contenedor:'verdict', candidatos:[], recomendado:null,
      vacioTitulo:'Ningún modelo cumple todas las restricciones',
      vacioDetalle:`<ul style="margin:0;padding-left:18px;font-size:13.5px">${why.join('')}</ul>`});
    $('verdict').style.borderLeftColor='var(--amber)';
    return;
  }
  $('verdict').style.borderLeftColor='var(--red)';

  const medidoresDe=m=>{
    const cap=capacidadMax(m), req=needDe(m), out=[];
    out.push({etq:(m.fam==='ec'?'Caudal WAN vs. rango publicado':'Throughput de firewall'),
      val:req, tope:cap||0, txt:fmt(req)+' / '+fmt(cap)});
    // El suelo del rango ya no va aqui: vive en la escalera de «Capacidad publicada» de la
    // propia ficha (2026-09-13, unificacion), y repetirlo era la redundancia que se vino a
    // cerrar. Clientes si se queda: es requerimiento contra tope, no un escalon publicado.
    if(m.clients!=null) out.push({etq:'Clientes soportados', val:users, tope:clientesMax(m)||0,
      txt:(users?miles(users)+' / ':'')+miles(clientesMax(m))});
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

  // Escalera de capacidad publicada del modelo elegido, con las cifras que HPE realmente
  // publica para su familia. Antes era un panel aparte («Capacidad publicada») y repetia en
  // barras lo que la ficha ya decia en texto; desde 2026-09-13 vive DENTRO de la ficha como
  // seccion propia, y las filas de texto que lo duplicaban salieron de «Caracteristicas».
  // No se fuerza una escalera comun: cada familia se describe con lo suyo.
  const capacidadPublicadaDe=m=>{
    const barra=(etq,val,tope,activo)=>`<div class="tierRow ${activo?'on':'off'}">
        <span class="tn">${esc(etq)}</span>
        <span class="tb"><i style="width:${Math.max(2,Math.min(100,val/tope*100))}%"></i></span>
        <span class="tv">${fmt(val)}</span></div>`;
    let html='', nota='';
    if(m.fam==='ec'){
      const tope=m.wanMax||1;
      html+=barra('Suelo del rango',m.wanMin,tope,false);
      html+=barra('Techo del rango',m.wanMax,tope,true);
      if(m.boostMax!=null) html+=barra('Con Boost (máx.)',m.boostMax,tope,boost);
      nota='HPE publica para EdgeConnect un <b>rango de caudal WAN</b>, no un throughput único: por eso el dimensionamiento usa ese rango. '
        + 'Quedar por debajo del suelo indica sobredimensionamiento, y es tan accionable como pasarse del techo.';
    }else if(m.licCap){
      // En la 9200 la «escalera» es la tabla de niveles: misma cifra que antes pintaba un
      // panel aparte de bomBody, ahora dentro de la ficha. Se marca el nivel elegido en el
      // panel 4, que es el que se cotiza.
      const marcado=$('licCapTier').value;
      html+=`<div class="scroll"><table><thead><tr><th>Nivel</th><th>Throughput</th><th>APs</th><th>Dispositivos</th></tr></thead><tbody>`
        +m.licCap.map(t=>`<tr${t.code===marcado?' style="font-weight:600"':''}><td>${esc(t.n)}</td><td class="n">${fmt(t.fw)}</td><td class="n">${miles(t.aps)}</td><td class="n">${miles(t.clients)}</td></tr>`).join('')
        +`</tbody></table></div>`;
      nota='La capacidad de este equipo la fija la <b>licencia perpetua</b>, no el hardware: el mismo chasis entrega 20, 30 o 40 Gbps según el nivel (en negrita, el elegido para cotizar). '
        + 'En una comparativa contra un competidor que vende la capacidad cerrada en el equipo, esto es lo que hay que poner sobre la mesa.';
    }else if(m.fw!=null){
      html+=barra('Firewall',m.fw,m.fw,true);
      nota='Gateway de sucursal: termina la WAN y hace de controladora de APs en el mismo equipo. No hace optimización WAN.';
    }else{
      html+='<div class="tierRow off"><span class="tn">Firewall</span><span class="tb"></span>'
        +'<span class="tv">no publicado</span></div>';
      nota='HPE no publica el throughput de firewall de esta serie en las fuentes consultadas, asi que no se dimensiona por capacidad: hay que confirmarlo en las QuickSpecs enlazadas.';
    }
    return {titulo:'Capacidad publicada', html, nota};
  };

  // Ficha completa del equipo elegido: capacidad publicada, caracteristicas, ficha tecnica
  // profunda, alimentacion, suscripcion y licencias, software del portafolio y soporte.
  // UNIFICACION 2026-09-13 (peticion del dueno): lo que antes pintaba bomBody en paneles
  // aparte —«Ficha del equipo», «Capacidad por nivel de licencia», «Suscripcion» y
  // «Soporte HPE»— vive ahora AQUI, una sola tarjeta sin cifras repetidas. Y la ficha
  // refleja el estado REAL de los selectores del panel 4, incluidos los «No incluir»:
  // antes proponia un licenciamiento que el detalle de abajo declaraba excluido.
  const seccionesDe=m=>{
    const esEC=m.fam==='ec', esGwc=!!m.licCap;
    const unidades=$('chkHa').checked?2:1;
    const bundle=$('licBundle').value, care=$('careLevel').value, central=$('centralTier').value;
    const termYrs=parseInt($('termYears').value)||3;
    const termino=`término ${termYrs} año${termYrs>1?'s':''}`;
    const bwTier=(SIZING.bwTiers||[]).find(t=>t.code===$('bwTier').value)||null;
    const bloques=bundle?Math.max(0,parseInt($('boostBlocks').value)||0):0;
    const capTier=esGwc&&m.licCap?(m.licCap.find(t=>t.code===$('licCapTier').value)||m.licCap[0]):null;

    const caract=[
      ['Serie', esc(m.serie)],
      ['Segmento', esc(m.seg)],
    ];
    // Las cifras de capacidad (rango WAN, Boost, throughput) NO van como texto: las pinta
    // la escalera de «Capacidad publicada» de arriba. Aqui solo lo que la escalera no dice.
    if(!esEC){
      if(m.clients!=null) caract.push(['Clientes / APs', `${miles(m.clients)} / ${miles(m.aps)}`]);
      if(m.fwSess!=null) caract.push(['Sesiones de firewall', miles(m.fwSess)]);
    }
    if(m.ipsecSess!=null) caract.push(['Sesiones IPsec', miles(m.ipsecSess)]);
    if(m.greTuns!=null) caract.push(['Túneles GRE', miles(m.greTuns)]);
    caract.push(['Interfaces', esc(m.ifaces), true]);
    // Las referencias de pedido NO van en la ficha: están integradas en la lista de
    // materiales (pestaña Equipo y BOM), única fuente de SKU de la página (2026-09-13).
    caract.push(['Datasheet', (m.dsLocal||m.ds)
      ?`<a href="${esc(m.dsLocal||m.ds)}" target="_blank" rel="noopener">Abrir documento</a>${m.dsLocal?' (copia local)':''}`
      :'<span class="warn">Sin URL oficial confirmada</span>', true]);
    caract.push(['Precio de lista', m.elpN!=null?esc(m.elp):'Consultar distribuidor']);

    // Ficha tecnica profunda: las cifras del datasheet (SPEC_LABELS). El consumo electrico
    // se salta cuando la seccion de alimentacion ya lo da (m.psu.watts), para no repetirlo.
    const tecnica=SPEC_LABELS
      .filter(([k])=>m.spec&&m.spec[k]!=null&&!(k==='watts'&&m.psu&&m.psu.watts!=null))
      .map(([k,label])=>[label, esc(m.spec[k])]);
    if(esEC) tecnica.push(['Condiciones ambientales (línea EdgeConnect)', esc(EC_AMBIENTE), true]);

    // Suscripcion y licencias con sus estados reales (Requerida / Opcional / No incluida).
    // Orchestrator NO se repite aqui: ya figura en «Software del portafolio» de abajo.
    const licUl=esEC
      ?(bundle
        ?`<li class="on"><b>${esc(BUNDLES[bundle].n)}</b><span class="req">Requerida</span><span class="sku">${esc(BUNDLES[bundle].svcs)}<br>Tier de caudal: <b>${bwTier?esc(bwTier.n):'—'}</b> · ${termino}</span></li>`
          +`<li${bloques?' class="on"':''}><b>${esc(SIZING.boost.n)}</b><span class="req${bloques?'':' opt'}">${bloques?'Incluido':'Opcional'}</span><span class="sku">${esc(SIZING.boost.svcs)}${bloques?`<br>Pool: <b>${bloques} bloque(s) de ${SIZING.boost.bloque} Mbps = ${fmt(bloques*SIZING.boost.bloque)}</b> — se licencia una vez para todo el fabric, no por sede.`:''}</span></li>`
        :`<li><b>Suscripción EdgeConnect</b><span class="req opt">No incluida</span><span class="sku">Sin suscripción el equipo no se incorpora al fabric gestionado por Orchestrator: queda standalone, sin Business Intent Overlays ni ZTP. Actívala eligiendo un nivel.<br>Boost es un add-on de la suscripción — sin ella tampoco se licencia.</span></li>`)
      :(central
        ?`<li class="on"><b>${esc(CENTRAL[central].n)}</b><span class="req">Requerida</span><span class="sku">${esc(CENTRAL[central].d)} · suscripción por dispositivo · ${termino}</span></li>`
        :`<li><b>HPE Aruba Networking Central</b><span class="req opt">No incluida</span><span class="sku">Sin suscripción de Central el gateway se queda en gestión local, sin la nube de HPE ni apertura de casos. Actívala eligiendo un nivel.</span></li>`)
      +(capTier&&capTier.code!=='hw'
        ?`<li class="on"><b>Licencia perpetua ${esc(capTier.n)}</b><span class="req">Requerida</span><span class="sku">Amplía el mismo hardware a ${fmt(capTier.fw)}, ${miles(capTier.aps)} APs y ${miles(capTier.clients)} dispositivos.</span></li>`
        :'');

    const soft=(SOFTWARE||[]).map(sw=>[esc(sw.id), esc(sw.cat)]);

    const soporte=care
      ?{titulo:'Soporte', filas:[[esc(CARE[care].n), esc(CARE[care].sla)]],
        nota:`${esc(CARE[care].d)} ${termino} · ${unidades===2?'2 unidades (par HA)':'1 unidad'}. Su SKU y su precio están integrados en la lista de materiales.`}
      :{titulo:'Soporte', filas:[],
        nota:'<b>No incluido.</b> Sin soporte activo no hay repuestos con SLA ni acceso al TAC de HPE — elige un nivel para añadirlo a la lista de materiales.'};

    return [
      capacidadPublicadaDe(m),
      {titulo:'Características del equipo', filas:caract},
      {titulo:'Ficha técnica', filas:tecnica},
      FICHA.seccionAlimentacion(m),
      {titulo:'Suscripción y licencias',
       filas:[['Unidades a licenciar', unidades===2?'2 — cada nodo del par lleva la suya':'1']],
       html:`<ul class="clean">${licUl}</ul>`,
       nota:esEC?'La suscripción de EdgeConnect va por <b>caudal del sitio</b>, no por modelo de appliance.'
                :'Los gateways se gestionan por suscripción de Central; la serie 9200 escala su capacidad por licencia perpetua sobre el mismo hardware.'},
      {titulo:'Software del portafolio', filas:soft,
       nota:'Orchestrator no se licencia por dispositivo gestionado.'},
      soporte,
    ];
  };

  const pintarDependientes=m=>{
    $('pickLbl').textContent=m.id; $('pickLbl').style.display='block';
    $('pickLbl').style.left=xPct(capacidadMax(m))+'%';
  };

  // El selector unico (pickModel) manda sobre la ficha: una eleccion manual se le pasa
  // como deliberada y, si no esta entre los candidatos, se incluye con el aviso de desvio
  // en vez de dejar que la ficha salte al recomendado mientras el selector dice otra cosa.
  poblarPickModel(candidates, pick.id);
  const mManual=$('pickModel').dataset.bomManual==='1'
    ?(MODELS.find(x=>x.id===$('pickModel').value)||null):null;
  const elegidoId=FICHA.render({...FICHA_CFG,
    contenedor:'verdict',
    candidatos:candidates,
    recomendado:pick.id,
    seleccionado:mManual?mManual.id:undefined,
    incluir:mManual||undefined,
    etiqueta:m=>`${m.id} — ${m.serie} · ${fmt(capacidadMax(m))}`,
    titulo:m=>m.id,
    subtitulo:m=>m.seg+' · '+famLabel(m),
    medidores:medidoresDe,
    porQue:porQueDe,
    secciones:seccionesDe,
    alCambiar:id=>{
      // Con el selector fuera de la ficha, esto solo puede ser «Volver al recomendado»:
      // se suelta la eleccion manual y toda la pagina vuelve a seguir al dimensionamiento.
      BOM.soltarManual('pickModel');
      if($('pickModel').value!==id) $('pickModel').value=id;
      const m=MODELS.find(x=>x.id===id);
      if(!m) return;
      pintarDependientes(m);
      llevarABom(m.id);
    },
  });
  const elegido=candidates.find(m=>m.id===elegidoId)||mManual||pick;
  pintarDependientes(elegido);
  sincronizarConBom(elegido);
}

/* BOM */
// El selector de equipo es UNICO en toda la pagina (2026-09-13, unificacion pedida por el
// dueno): la ficha ya no pinta el suyo. Marca los modelos que cumplen el dimensionamiento
// y el recomendado, y se reconstruye en cada render para que esas marcas sigan al calculo
// sin soltar la seleccion que hubiera.
function poblarPickModel(cumplen, recomendado){
  const sel=$('pickModel'); if(!sel) return;
  const actual=sel.value;
  const ids=new Set((cumplen||[]).map(m=>m.id));
  // Orden determinista por capacidad (wanMax en EdgeConnect, fw en gateways): la API
  // puede servir el catalogo en cualquier orden y el combo no puede depender de eso.
  // Series por su modelo de entrada; dentro de cada serie, de menor a mayor. Sin cifra
  // publicada (EC-V, que se dimensiona por licencia y vCPU) va al final de su serie.
  const capDe=m=>m.wanMax!=null?m.wanMax:(m.fw!=null?m.fw:Infinity);
  const series=[...new Set(MODELS.map(m=>m.serie))];
  series.sort((a,b)=>{
    const ca=Math.min(...MODELS.filter(m=>m.serie===a).map(m=>capDe(m)===Infinity?0:capDe(m)));
    const cb=Math.min(...MODELS.filter(m=>m.serie===b).map(m=>capDe(m)===Infinity?0:capDe(m)));
    return ca-cb;
  });
  sel.innerHTML=series.map(se=>`<optgroup label="${esc(se)}">`
    +MODELS.filter(m=>m.serie===se).sort((a,b)=>capDe(a)-capDe(b)).map(m=>{
      const marca=m.id===recomendado?' · recomendado':(ids.has(m.id)?' · cumple':'');
      return `<option value="${esc(m.id)}">${esc(m.id)} — ${esc(m.seg)}${marca}</option>`;
    }).join('')+'</optgroup>').join('');
  if(actual&&[...sel.options].some(o=>o.value===actual)) sel.value=actual;
}

function populateSelects(){
  poblarPickModel([], null);
  $('bwTier').innerHTML=(SIZING.bwTiers||[]).map(t=>`<option value="${esc(t.code)}">${esc(t.n)}</option>`).join('');
  // «No incluir» (2026-09-13, peticion del dueno): cualquier linea de la cotizacion se
  // puede excluir — la lista de materiales declara entonces su estado, no la inventa.
  // El tier de caudal NO tiene «No incluir»: la suscripcion no tiene SKU sin tier, asi
  // que excluir la suscripcion (nivel vacio) es lo que oculta tier y Boost — Boost es
  // un add-on de la suscripcion EdgeConnect y sin ella no se licencia.
  $('licBundle').innerHTML='<option value="">No incluir</option>'+Object.entries(BUNDLES).map(([k,b])=>`<option value="${esc(k)}"${k==='advanced'?' selected':''}>${esc(b.n)}</option>`).join('');
  $('careLevel').innerHTML='<option value="">No incluir</option>'+Object.entries(CARE).map(([k,c])=>`<option value="${esc(k)}"${k==='fc247'?' selected':''}>${esc(c.n)}</option>`).join('');
  $('centralTier').innerHTML='<option value="">No incluir</option>'+Object.entries(CENTRAL).map(([k,c])=>`<option value="${esc(k)}"${k==='advanced'?' selected':''}>${esc(c.n)}</option>`).join('');
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
// El SKU de una suscripción depende de la duración (1/3/5 años): desde el 2026-09-13
// `sku` puede ser un objeto {y1,y3,y5}. Se acepta también la forma plana por compatibilidad.
function tierSku(t,y){ if(!t||t.sku==null) return null; if(typeof t.sku==='string') return t.sku; const v=y===1?t.sku.y1:y===5?t.sku.y5:t.sku.y3; return v||null; }

function renderBom(){
  const m=MODELS.find(x=>x.id===$('pickModel').value)||MODELS[0];
  if(!m) return;
  const qty=Math.max(1,parseInt($('qty').value)||1);
  const termYrs=parseInt($('termYears').value)||3;
  // '' = «No incluir» (2026-09-13, peticion del dueno): la linea se excluye de la lista y
  // su panel declara el estado en vez de inventarla. Sin suscripcion EdgeConnect tampoco
  // hay Boost: es un add-on suyo, no un producto independiente.
  const bundle=$('licBundle').value;
  const care=$('careLevel').value;
  const central=$('centralTier').value;
  const bwCode=$('bwTier').value;
  const bwTier=(SIZING.bwTiers||[]).find(t=>t.code===bwCode)||null;
  const bloques=bundle?Math.max(0,parseInt($('boostBlocks').value)||0):0;
  const capTierCode=$('licCapTier').value;

  const esEC=m.fam==='ec', esGwc=!!m.licCap;
  // Los controles que no aplican a la familia elegida se ocultan, en vez de dejar que
  // alguien cotice un pool de Boost sobre un gateway que no lo soporta. Y con la
  // suscripcion excluida se ocultan tier y Boost, que dependen de ella.
  $('fldBw').hidden=!esEC||!bundle; $('fldBundle').hidden=!esEC; $('fldBoost').hidden=!esEC||!bundle;
  $('fldCentral').hidden=esEC; $('fldCapTier').hidden=!esGwc;

  const lic=LICENSES[bwCode]||null;
  const licTier=lic&&bundle?(lic[bundle]||null):null;
  // El soporte se cotiza por MODELO (CARE_SKU, servicio atado a la variante de hardware),
  // no por tier de caudal — desde 2026-09-13 sale de la lista de precios documentada en
  // aruba.js. Lo que la lista no cubre (fcsw, gateways, 4HR del 10150) sigue en consultar.
  const cs=care&&CARE_SKU[m.id]?CARE_SKU[m.id][care]:null;
  const careTier=cs?{sku:{y1:cs.y1[0],y3:cs.y3[0],y5:cs.y5[0]},y1:cs.y1[1],y3:cs.y3[1],y5:cs.y5[1]}:null;
  const licPrice=tierPrice(licTier,termYrs);
  const carePrice=tierPrice(careTier,termYrs);
  // Boost se licencia como SaaS sobre Foundation/Advanced y como E-STU sobre On-Premises:
  // cada modalidad tiene su propio juego de SKUs (2026-09-13, ver aruba.js).
  const boostCfg=bloques&&SIZING.boost?(bundle==='onprem'?SIZING.boost.onprem:SIZING.boost.saas):null;
  const boostBlk=boostCfg?boostCfg.bloque100:null;
  const boostPrice=tierPrice(boostBlk,termYrs);
  const centralTier=CENTRAL[central]||null;
  const centralPrice=tierPrice(centralTier,termYrs);
  const termino=`término ${termYrs} año${termYrs>1?'s':''}`;
  const capTier=esGwc&&m.licCap?(m.licCap.find(t=>t.code===capTierCode)||m.licCap[0]):null;

  // Los paneles de detalle del equipo («Ficha del equipo», «Capacidad por nivel», «Suscripción»
  // y «Soporte HPE») ya NO se pintan aquí: desde 2026-09-13 viven unificados en la ficha del
  // dimensionador (seccionesDe), una sola tarjeta sin cifras repetidas. Esta función solo
  // mantiene la visibilidad de los campos y construye las filas de la lista de materiales.

  // El pool de Boost NO multiplica por unidad: es un caudal agregado del fabric.
  const filas=[
    {cat:'Equipo', desc:m.id, sku:m.hwSku||null, qty, unit:m.elpN!=null?m.elpN:null,
     nota:`${m.seg} · ${famLabel(m)} · ${m.ifaces}`},
  ];
  if(esEC){
    if(bundle){
      filas.push({cat:'Suscripción SD-WAN', desc:`${BUNDLES[bundle].n} — ${bwTier?bwTier.n:'tier por definir'}`,
        sku:tierSku(licTier,termYrs), qty, unit:licPrice,
        nota:`${termino} · suscripción por caudal del sitio, no por modelo de appliance`});
      if(bloques){
        filas.push({cat:'Aceleración', desc:`${SIZING.boost.n} — bloque de ${SIZING.boost.bloque} Mbps`,
          sku:tierSku(boostBlk,termYrs), qty:bloques, unit:boostPrice,
          nota:`Pool agregado del fabric (${fmt(bloques*SIZING.boost.bloque)}). Orchestrator lo reparte entre sedes; no multiplica por unidad.`});
      }
    }
  }else{
    if(central){
      filas.push({cat:'Suscripción de gestión', desc:CENTRAL[central].n, sku:tierSku(centralTier,termYrs), qty, unit:centralPrice,
        nota:`${termino} · HPE Aruba Networking Central, suscripción por dispositivo`});
    }
    if(capTier&&capTier.code!=='hw'){
      filas.push({cat:'Licencia perpetua', desc:`Capacidad ${capTier.n}`, sku:capTier.sku||null, qty, unit:capTier.elp!=null?capTier.elp:null,
        nota:`Amplía el mismo hardware a ${fmt(capTier.fw)} · ${miles(capTier.aps)} APs · ${miles(capTier.clients)} dispositivos`});
    }
  }
  if(care){
    filas.push({cat:'Soporte', desc:CARE[care].n, sku:tierSku(careTier,termYrs), qty, unit:carePrice,
      nota:`${termino} · ${CARE[care].sla}`});
  }

  const meta={
    titulo:`Lista de materiales — ${m.id}`,
    subtitulo:`${m.seg} · ${famLabel(m)} · ${termino}`,
    archivo:`BOM_${m.id}`,
    notas:[
      '',
      'CAPACIDAD PUBLICADA POR HPE',
      esEC?`  Rango de caudal WAN:  ${m.wanMin!=null?fmt(m.wanMin)+' - '+fmt(m.wanMax):'sin minimo publicado'}`
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
      '  List Price de HPE (sin descuento de distribuidor) para hardware y suscripciones,',
      '  tomado del export de lista de precios documentado en aruba-lista-precios-hpe.csv.',
      '  El soporte Foundational Care se cotiza por modelo (CARE_SKU en aruba.js). Lo que',
      '  sigue sin precio (EC-V, DTD, FC de software y FC de gateways) va en consultar',
      '  a proposito. Confirmar la fila exacta del datasheet antes de emitir la propuesta.',
      qty>1?`  Par de ${qty} unidades: la suscripcion de sitio no se comparte, cada nodo lleva la suya.`:null,
    ].filter(n=>n!==null&&n!==''),
  };

  // El aviso de desvío vive sobre la lista: con la ficha unificada (2026-09-13) ya no hay
  // paneles de detalle en «Dimensionar» donde pintarlo, y su sitio natural es la cotización
  // misma — si la lista cotiza un equipo distinto del elegido, o ya ninguno cumple, es aquí
  // donde quien exporta tiene que verlo.
  $('bomTabla').innerHTML=BOM.avisoDesvio({elegido:FICHA.elegido('verdict'), enBom:m.id, hayCandidato:!!lastPick})
    +BOM.renderTabla(filas,{
    aviso:'List Price de HPE (sin descuento de distribuidor) — hardware, suscripciones EdgeConnect/Boost/Central, licencias perpetuas 9240 y Foundational Care de EdgeConnect verificados el 2026-09-13 (ver aruba-lista-precios-hpe.csv y CARE_SKU en aruba.js). Lo que no tiene precio verificado figura en "consultar" a propósito.',
  });
  $('bomOut').value=BOM.comoTexto(filas,meta);
  bomMeta=meta; bomFilas=filas;
  // Las marcas "En el BOM" del catálogo dependen de lo que el motor acaba de poner en la
  // lista: se repinta con cada cambio de modelo, término o tier.
  pintarCatalogoSku();
}

/* ══ CATÁLOGO PEDIBLE → LISTA DE MATERIALES ══
   Toda referencia de pedido de Aruba vive en UN sitio: la lista de materiales. Este panel
   es la puerta de entrada — busca en los 76 SKU de la lista de precios pública
   (public/datasheets/aruba-lista-precios-hpe.csv: hardware y sus variantes TAA/NAL,
   remanufacturados, suscripciones EdgeConnect/Boost/Central y licencias perpetuas 9240).
   Añadir mete la línea en el BOM (BOM.agregarRef la guarda, la pinta con stepper de
   cantidad y botón de quitar, la exporta al Excel y la manda al cotizador); las que el
   motor ya puso en el BOM se marcan "En el BOM" para no meter dos veces la misma línea.
   2026-09-13: ya NO se mezclan las variantes declaradas en el catálogo (m.skus) — las 7
   que tienen SKU y precio están en el CSV y las 14 sin SKU confirmado eran ruido
   inpedible ("sin número de parte" / "consultar" duplicado). */

// La categoría sale de las propias columnas del CSV, no de una lista de SKU escrita a mano:
// si la lista de precios trae una familia nueva, aparece sola en el panel.
function categoriaDeFilaCsv(mod, sku){
  if(/^Suscripcion EdgeConnect/.test(mod)) return mod.replace(/^Suscripcion/,'Suscripción');
  if(/^Boost EdgeConnect/.test(mod)) return mod;
  if(/^Central/.test(mod)) return 'HPE Aruba Networking Central';
  if(/AR$/.test(sku)) return 'Hardware remanufacturado (serie 7000/7200)';
  if(/AAE$/.test(sku)) return 'Licencias perpetuas 9240';
  return 'Hardware — EdgeConnect y gateways';
}
const SKU_CAT_ORDEN=['Hardware — EdgeConnect y gateways','Hardware remanufacturado (serie 7000/7200)',
  'Suscripción EdgeConnect Foundation','Suscripción EdgeConnect Advanced',
  'Suscripción EdgeConnect On-Premises','Boost EdgeConnect (SaaS)','Boost EdgeConnect (On-Premises)',
  'HPE Aruba Networking Central','Licencias perpetuas 9240'];

// El CSV no trae campos entrecomillados ni comas dentro de los valores (verificado
// 2026-09-13), así que basta split — un parser completo no añadiría nada.
function parseCsvCatalogo(txt){
  return txt.trim().split(/\r?\n/).slice(1).map(l=>l.split(',')).filter(c=>c.length>=6&&c[0])
    .map(c=>({sku:c[0], d:c[2], p:c[3]===''?null:Number(c[3]), vig:c[4], plc:c[5],
      cat:categoriaDeFilaCsv(c[1]||'', c[0]||'')}));
}

async function cargarCatalogoSku(){
  const caja=$('skuCatalogo'); if(!caja) return;
  try{
    const res=await fetch('/datasheets/aruba-lista-precios-hpe.csv');
    if(!res.ok) throw new Error('http '+res.status);
    SKU_CAT=parseCsvCatalogo(await res.text());
    pintarCatalogoSku();
  }catch(e){
    caja.innerHTML='<p class="hint">No se pudo cargar el catálogo de SKUs (lista de precios). La lista de materiales sigue disponible.</p>';
  }
}

// SKUs que el motor ya puso en el BOM: señalarlos evita meter dos veces la misma línea.
function skusAutoEnBom(){ return new Set((bomFilas||[]).map(f=>f.sku).filter(Boolean)); }

function pintarCatalogoSku(){
  const caja=$('skuCatalogo'); if(!caja||!SKU_CAT.length) return;
  const q=skuFiltro.trim().toLowerCase();
  const auto=skusAutoEnBom();
  const cats=SKU_CAT_ORDEN.map(c=>[c,SKU_CAT.filter(x=>x.cat===c)]).filter(([,l])=>l.length);
  const chips=cats.map(([c,l])=>`<button type="button" class="sku-chip${skuCatActiva===c?' on':''}" data-sku-cat="${esc(c)}">${esc(c)} <span class="sku-chip-n">${l.length}</span></button>`).join('');
  let body='';
  for(const [c,lista] of cats){
    if(skuCatActiva&&skuCatActiva!==c) continue;
    const filas=lista.filter(x=>!q||(x.sku||'').toLowerCase().includes(q)||(x.d||'').toLowerCase().includes(q));
    if(!filas.length) continue;
    body+=`<div class="sku-grupo">${esc(c)}</div>`+filas.map(x=>{
      const ya=x.sku&&auto.has(x.sku);
      return `<div class="sku-fila${ya?' ya':''}">`
        +`<span class="sku-fila-sku">${x.sku?`<code>${esc(x.sku)}</code>`:'<span class="bom-nd">sin SKU confirmado</span>'}</span>`
        +`<span class="sku-fila-d">${esc(x.d)}${x.vig?`<span class="sku-fila-meta">List Price vigente ${esc(x.vig)}${x.plc?` · ${esc(x.plc)}`:''}</span>`:''}</span>`
        +`<span class="sku-fila-p">${x.p!=null?esc(money(x.p)):'<span class="bom-nd">consultar</span>'}</span>`
        +`<span class="sku-fila-a">${ya?'<span class="sku-enbom">En el BOM</span>'
          :`<button type="button" class="sku-add" data-sku-add="${esc(x.sku||x.d)}">Añadir</button>`}</span></div>`;
    }).join('');
  }
  caja.innerHTML=`<div class="sku-chips">${chips}</div>`
    +(body?`<div class="sku-lista">${body}</div>`:'<p class="hint" style="margin:8px 0 0">Ninguna referencia coincide con la búsqueda.</p>');
  caja.querySelectorAll('[data-sku-cat]').forEach(b=>b.addEventListener('click',()=>{
    skuCatActiva=skuCatActiva===b.dataset.skuCat?null:b.dataset.skuCat; pintarCatalogoSku();
  }));
  caja.querySelectorAll('[data-sku-add]').forEach(b=>b.addEventListener('click',()=>{
    const x=SKU_CAT.find(y=>(y.sku||y.d)===b.dataset.skuAdd);
    if(!x) return;
    // agregarRef repinta el BOM (repintar=renderBom), y renderBom repinta este panel con
    // las marcas "En el BOM" ya actualizadas — no hace falta tocar nada más aquí.
    BOM.agregarRef({sku:x.sku, d:x.d, p:x.p, de:'catálogo de precios Aruba', v:'aruba'});
  }));
}

$('skuBuscar').addEventListener('input',e=>{ skuFiltro=e.target.value; pintarCatalogoSku(); });

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
  CARE_SKU = data.careSkus || {};
  LICENSES = data.licenses;
  SIZING = data.sizing;
  SOFTWARE = data.software || [];
  CENTRAL = data.centralTiers || {};
  DATASHEETS = data.datasheets || {};

  // La ficha ya no pide referencias (van integradas en el BOM), así que el fabricante se
  // declara aquí: es lo que permite que la lista de materiales muestre solo lo de Aruba.
  if(BOM.fijarVendor) BOM.fijarVendor('aruba');
  populateSelects();
  // Reponer desde un enlace ES elegir: queda como seleccion manual, igual que hacia el
  // antiguo desplegable de la ficha (capturado al cargar el script, ver QMODEL_URL).
  if(QMODEL_URL&&[...$('pickModel').options].some(o=>o.value===QMODEL_URL)){
    $('pickModel').value=QMODEL_URL;
    $('pickModel').dataset.bomManual='1';
  }
  render();
  renderBom();
  renderCatalogo();
  cargarCatalogoSku();
  PROCEDENCIA.registrarModelos('aruba', () => MODELS.map(m => ({ model: m.id, ...m })));
})();

/* Enlace de eventos movido desde onclick= en el HTML, para permitir una CSP con
   script-src 'self' que bloquea todo codigo en linea. */
document.addEventListener('click', (e) => {
  const id = e.target.closest('button,[id]')?.id;
  if (id === 'btnImprimir') window.print();
});

/* ══ ESTADO ENLAZABLE Y PERSISTENTE ══
   Antes, poner 2.500 Mbps y copiar la URL no servia de nada: quien la abria veia 500 Mbps y
   otra recomendacion. Ahora el escenario viaja en la URL; ya no se guarda entre sesiones
   (ver /js/estado.js). */
document.addEventListener('DOMContentLoaded', () => {
  const st = ESTADO.vincular({ campos: ['bw','unit','users','aps','perUser','head','fecMode','boostProfile','chkBoost','chkBreakout','chkHa','famSeg','segSeg','pickModel'] });
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
    const elegido = ($('pickModel') && $('pickModel').value) || (lastPick && lastPick.id) || null;
    if (!elegido) return null;
    const cant = document.getElementById('qty');
    return { modelo: elegido, qty: Math.max(1, parseInt(cant && cant.value, 10) || 1),
             de: document.title.split('—')[0].trim() };
  });
});
