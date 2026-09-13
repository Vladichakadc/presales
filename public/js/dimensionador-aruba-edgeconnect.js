'use strict';
// Dimensionador HPE Aruba Networking.
//
// El motor NO copia el de Fortinet, porque lo que publica HPE es otra cosa. Para
// EdgeConnect la cifra oficial es el RANGO DE CAUDAL WAN de cada appliance; para los
// gateways de las series 9000/9200 es el THROUGHPUT DE FIREWALL mas la capacidad de
// clientes y APs. Se dimensiona con lo que existe publicado en vez de inventar una
// escalera de capas homogenea.
let MODELS = [], BUNDLES = {}, CARE = {}, CARE_SKU = {}, LICENSES = {}, LICENSES_HA = {},
    SIZING = {}, SOFTWARE = [], CENTRAL = {}, DATASHEETS = {};

// Catálogo pedible completo (hardware, remanufacturados, suscripciones, servicios) cargado
// del CSV público de lista de precios. Es la fuente del panel "Añadir a la lista de
// materiales": todas las referencias de pedido de la página viven integradas en el BOM.
let SKU_CAT = [];        // [{sku, d, p, vig, plc, cat}]
let PLC_POR_SKU = {};    // sku → estado PLC del export (GA/ES); lo usa el aviso de fin de venta
let skuFiltro = '', skuCatActiva = null, skuTaaOn = false;

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
let famMode='any', segMode='branch', destMode='hibrido', lastPick=null;
// Fase 11 (2026-09-13): arquetipo de sede y estrategia de seguridad pasan a ser
// variables de estado del dimensionador — restringen el catalogo y alimentan el BOM.
let personaMode='auto', secMode='ninguna';
let bomFilas=[], bomMeta={};

// Arquetipos de sede (personas Aruba, brief del duenyo 2026-09-13): restringen el
// catalogo a los modelos que el VSG posiciona para ese tamanyo de sitio. Libre = el
// calculo manda sobre todo el catalogo, como hasta ahora.
const PERSONA_MODELOS={
  peq:['Gateway 9004','EC-10104'],
  med:['Gateway 9012','EC-10106','EC-10108'],
  campus:['Gateway 9240','EC-10150','EC-V'],
};
const PERSONA_HINT={
  auto:'Sin arquetipo: el dimensionador recorre todo el catálogo y manda el cálculo.',
  micro:'Micro-Sucursal / teletrabajador: la respuesta Aruba es EdgeConnect Microbranch — el túnel IPsec corre en el propio AP AOS-10 (series 50x/51x/53x/55x/6xx; los 500H/600R son los posicionados para teletrabajo), sin appliance dedicado en el sitio. Va incluido en la licencia Central del AP y exige un VPNC headend. Se declara la arquitectura; no hay chasis que recomendar aquí.',
  peq:'Sucursal pequeña / retail: Gateway 9004 o EdgeConnect 10104 — hasta ~1 Gbps agregado, PoE en el 10108 si se sube un escalón.',
  med:'Sucursal mediana / regional: Gateway 9012 o EdgeConnect 10106/10108 — 1-2 Gbps agregado con SFP+ 10G en los EdgeConnect.',
  campus:'Campus / DC Hub: Gateway 9240 o EdgeConnect 10150/EC-V — 4-40 Gbps con licencias de capacidad o por vCPU.',
};
// Estrategia de seguridad (fase 11): sustituye a la casilla DTD. SSE = inspeccion en la
// nube (suscripcion por usuario); DTD = IDS/IPS en el propio chasis EdgeConnect, con un
// sobrecoste de proceso que el dimensionador descuenta de la capacidad.
const SEC_HINT={
  ninguna:'El NGFW y la clasificación de aplicaciones (AppRF, ~3.500 apps) ya van en Foundation. Activa una estrategia solo si el diseño exige IDS/IPS o inspección en la nube.',
  sse:'HPE Aruba Networking SSE (ex-Axis): ZTNA, SWG, CASB y DEM en suscripción POR USUARIO — paquetes oficiales Foundation ZTNA / Foundation SWG / Foundation Plus / Advanced / Advanced Plus (QuickSpecs SSE a50009212enw). EdgeConnect monta los túneles IPsec orquestados y AppExpress elige el mejor PoP. Entra en la lista como «consultar»: HPE no publica List Price de SSE.',
  dtd:'Dynamic Threat Defense: IDS/IPS, DDoS adaptativo y clasificación web EN el chasis EdgeConnect — licencia opcional aparte de Foundation/Advanced (QuickSpecs p.32), sin SKU en la lista de precios («consultar»). Regla de dimensionado del arquitecto (SIN FUENTE oficial): reserva un 35 % adicional de capacidad de proceso para la inspección. No corre en EC-XS (doc oficial) y exige familia EdgeConnect.',
};
// Factor IMIX (brief del duenyo 2026-09-13, SIN FUENTE oficial): el throughput nominal de
// datasheet se mide en laboratorio (UDP de paquete grande); con mezcla real de Internet
// (IMIX) la capacidad efectiva baja. La investigacion web de 2026-09-13 no encontro delta
// oficial HPE (referencias de industria: ~40 % en Cisco Cat 8500; HPE solo publica cifras
// IDS/IPS ya medidas con iMix) — se adopta el 70 % como regla de trabajo declarada del
// duenyo. El filtro de candidatos compara el requerimiento contra la capacidad ya
// degradada, asi la holgura va dentro del modelo.
const IMIX_FACTOR=0.70;

// Texto del destino de tráfico (2026-09-13, refactor arquitectónico): la estrategia de
// aplicaciones sustituye a los campos abstractos. Cloud-First usa First-packet iQ para
// sacar el tráfico SaaS de confianza directo a Internet o al SSE; Híbrido concentra el
// tráfico en los overlays con Path Conditioning hacia el datacenter privado.
const DEST_HINT={
  hibrido:'Tráfico intensivo en túneles del fabric hacia el datacenter propio, con Path Conditioning (FEC y corrección de orden de paquetes) sosteniendo el SLA de aplicación.',
  cloud:'Office 365, Teams, Salesforce y web salen directos a Internet (DIA) o hacia la nube SSE: First-packet iQ clasifica la aplicación en el primer paquete y decide el breakout. Menos carga cifrada en el túnel corporativo.',
};

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
$('destSeg').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;[...$('destSeg').children].forEach(x=>x.setAttribute('aria-pressed',x===b));destMode=b.dataset.v;$('destHint').textContent=DEST_HINT[destMode]||'';render();});
['bw','unit','users','aps','perUser','head','fecMode','boostProfile','perfilEntorno','chkBoost','chkSeg','chkTopo','chkAiops','chkHa','mplsType','bwMpls','inetType','bwInet','chkBreakout'].forEach(id=>$(id).addEventListener('input',render));

// Arquetipo de sede (fase 11): restringe el catalogo a los modelos del VSG para ese
// tamanyo de sitio; el hint declara que hace cada persona.
$('personaSeg').addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b)return;
  [...$('personaSeg').children].forEach(x=>x.setAttribute('aria-pressed',x===b));
  personaMode=b.dataset.v;
  $('personaHint').textContent=PERSONA_HINT[personaMode]||PERSONA_HINT.auto;
  render();
});
// Estrategia de seguridad (fase 11): sustituye a la casilla DTD. DTD es funcion
// EdgeConnect (QuickSpecs p.32), no de los gateways: elegirla mueve el filtro de familia,
// igual que Boost. SSE no mueve el filtro: es suscripcion por usuario independiente del
// chasis, y el tunnel IPsec orquestado lo montan tanto EdgeConnect como los gateways.
$('secSeg').addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b)return;
  [...$('secSeg').children].forEach(x=>x.setAttribute('aria-pressed',x===b));
  secMode=b.dataset.v;
  $('secHint').innerHTML=SEC_HINT[secMode]||SEC_HINT.ninguna;
  if(secMode==='dtd'&&famMode!=='ec'&&famMode!=='any'){
    famMode='ec';
    [...$('famSeg').children].forEach(x=>x.setAttribute('aria-pressed',x.dataset.v==='ec'));
  }
  render();
});

// Boost solo existe en EdgeConnect: pedirlo con el filtro en gateways daria una lista
// vacia sin explicar por que, asi que se mueve el filtro tambien.
$('chkBoost').addEventListener('change',()=>{
  if($('chkBoost').checked&&famMode!=='ec'&&famMode!=='any'){
    famMode='ec';
    [...$('famSeg').children].forEach(x=>x.setAttribute('aria-pressed',x.dataset.v==='ec'));
  }
  render();
});
// Dynamic Threat Defense vive ahora en el radio de estrategia de seguridad (secSeg,
// fase 11): el movimiento del filtro de familia se hace en su listener de arriba.
$('chkHa').addEventListener('change',()=>{
  const q=$('qty');
  if($('chkHa').checked){ if((parseInt(q.value)||1)<2) q.value=2; }
  else if((parseInt(q.value)||1)===2){ q.value=1; }
  // render() entero: la ficha declara el par HA en «Unidades a licenciar» y el BOM
  // parte la suscripción en 1× estándar + 1× SKU de alta disponibilidad (2026-09-13).
  render();
});
// Estos campos disparan render() y no solo renderBom: con la unificacion de 2026-09-13 la
// ficha misma muestra la suscripcion, las licencias y el soporte elegidos (incluidos los
// «No incluir»), asi que hay que repintarla entera, no solo la lista de materiales.
// Desde el refactor de 2026-09-13 el nivel de suscripcion, el tier de caudal, los bloques
// de Boost y el nivel de capacidad del 9240 se DEDUCEN (no hay selectores manuales): lo
// que queda aqui es el termino, el soporte y las exclusiones («No incluir», pedido
// explicito del dueno que se conserva) mas la modalidad On-Premises del menu avanzado.
['qty','termYears','careLevel','chkNoSub','chkNoCentral','chkSoloHw','chkOnprem']
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
  // 'tuneles' se retira de la ficha (2026-09-13, refactor arquitectónico): los túneles
  // los gestiona el orquestador dinámicamente y no son métrica de dimensionamiento.
  ['peers','Peers de fabric máx.'],
  ['prefijos','Prefijos de ruteo'],
  ['vlanMax','VLANs máx.'],
  ['ospf','Rutas OSPF'],
  ['acls','ACLs'],
  ['dhcp','Clientes DHCP'],
  ['bridge','Tabla de bridge'],
  ['cps','Sesiones nuevas por segundo'],
  ['fwSessSdwan','Sesiones de firewall en modo SD-WAN'],
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

/* ══ REFACTOR ARQUITECTÓNICO 2026-09-13 (petición del dueño, documento «Actúa como un
   Arquitecto de Soluciones de Redes») ══
   SD-WAN de Aruba no se rige por túneles IPsec estáticos (el orquestador los gestiona
   dinámicamente según los overlays) sino por FLUJOS SIMULTÁNEOS y la clasificación de
   aplicaciones (First-packet iQ / Business Intent Overlays). De aquí salen tres piezas:
   el cálculo de flujos, la deducción del nivel de licencia y el Boost auto-dimensionado. */

// Flujos simultáneos que publica cada fuente: EdgeConnect los da como «conexiones
// simultáneas» del datasheet (spec.conexiones, texto con miles); los gateways como
// sesiones de firewall (fwSess, ya numérico). null = la fuente no lo publica para ese
// modelo (EC-V, 9240) y el motor lo declara en vez de inventarlo.
function flujosDe(m){
  if(m.fam==='ec'){
    const s=m.spec&&m.spec.conexiones;
    const n=s?parseInt(String(s).replace(/\D/g,''),10):NaN;
    return Number.isFinite(n)?n:null;
  }
  return m.fwSess!=null?m.fwSess:null;
}
// Tasa de flujos por usuario según el perfil de entorno. Brief del duenyo 2026-09-13
// (fase 11): 80 estandar / 150 intensivo — punto medio del rango 80-100 / 150-200 que la
// arquitectura declaro en fase 9. SIN FUENTE oficial: HPE no publica flujos por usuario;
// es regla de trabajo de preventa, declarada como tal en la interfaz.
const FLUJOS_POR_USUARIO={estandar:80, intensivo:150};

// Nivel de suscripción DEDUCIDO de las funciones elegidas (matriz oficial QuickSpecs v18
// p.31, transcrita en aruba.js): Advanced solo si el diseño pide segmentación
// multi-overlay (>3 BIOs / VRFs), topología ilimitada o retención ampliada de datos.
// El steering por SLA y las funciones NGFW ya son de Foundation — no fuerzan el nivel.
function nivelAutoEC(){
  return ($('chkSeg').checked||$('chkTopo').checked||$('chkAiops').checked)?'advanced':'foundation';
}
// En gateways el nivel lo fija Central: Advanced añade analítica/AIOps y retención
// ampliada sobre la gestión completa que ya trae Foundation (SD-WAN Gateways Ordering
// Guide, ver CENTRAL_TIERS). Dynamic Threat Defense NO alimenta esta deducción desde
// 2026-09-13 (fase 10): es una licencia EdgeConnect (QuickSpecs p.32), no de gateway —
// marcarla mueve el filtro de familia a EdgeConnect.
function nivelAutoCentral(){
  return ($('chkSeg').checked||$('chkAiops').checked)?'advanced':'foundation';
}
// Por qué se dedujo ese nivel, en lenguaje de preventa (lo muestra el panel 4 y la ficha).
function porqueNivelEC(nivel){
  const f=[];
  if($('chkSeg').checked) f.push('segmentación multi-overlay (>3 BIOs / VRFs)');
  if($('chkTopo').checked) f.push('topología ilimitada');
  if($('chkAiops').checked) f.push('retención ampliada de datos / analítica');
  return f.length
    ?`deducido de las funciones marcadas: ${f.join(' · ')}`
    :'sin funciones avanzadas marcadas: gestión centralizada, monitorización e interconexión SD-WAN con SLA — Foundation basta';
}

// Mbps de Boost necesarios: el 30 % del tráfico WAN PRIVADO (regla de preventa declarada
// por la arquitectura, 2026-09-13 — HPE no publica porcentaje guía; la única regla de
// campo localizada, no oficial, sugiere 40 %: queda documentada la discrepancia y manda
// la regla declarada del dueño). Como tráfico WAN privado se toma el caudal que los
// enlaces transportan ANTES de la reducción de Boost —que es el tráfico que el motor de
// optimización procesa—: needProc con la paridad FEC. Desde fase 11 se multiplica por la
// cuota privada del Local Breakout (privateShare): con DIA y breakout activo solo el
// 30 % del tráfico sigue tunelizado al DC (regla 70/30 del brief del duenyo, SIN FUENTE
// oficial — la literatura de partners apunta mas bien a 80/20; queda documentado).
function boostMbpsAuto(needProc,fec,share){
  return Math.round(0.30*needProc*(1+(fec?fec.pct:0))*(share!=null?share:1));
}

// Estado derivado del escenario (2026-09-13, refactor arquitectónico): el caudal de
// proceso, el de WAN, el tier de suscripción, el nivel de licencia y los bloques de
// Boost se DEDUCEN del formulario — ya no hay selectores manuales para ellos. Es una
// función pura de los campos: render(), la ficha (seccionesDe) y el BOM (renderBom) la
// llaman por separado y ven exactamente lo mismo, sin pasarse variables.
function estadoDerivado(){
  const bw=parseFloat($('bw').value)||0;
  const unit=parseFloat($('unit').value);
  const users=parseInt($('users').value)||0;
  const aps=parseInt($('aps').value)||0;
  const perUser=Math.max(0,parseFloat($('perUser').value)||0);
  const head=(parseFloat($('head').value)||0)/100;
  const boost=$('chkBoost').checked;
  let featurePenalty=1.0;
  if($('chkSeg').checked) featurePenalty+=0.05;
  // Cloud-First hereda el coste de proceso que antes llevaba la casilla de breakout:
  // clasificar cada primer paquete para decidir DIA/SSE es trabajo del appliance.
  if(destMode==='cloud') featurePenalty+=0.05;
  // Dynamic Threat Defense (fase 11): IDS/IPS en el chasis reserva capacidad de proceso.
  // Regla de trabajo del duenyo: +35 % (SIN FUENTE oficial para EdgeConnect — en gateways
  // SD-Branch HPE publica throughput IDS/IPS de solo el 17-30 % del de firewall, medido
  // con iMix; la revision del diseno lo declara como aviso para no prometer de mas).
  if(secMode==='dtd') featurePenalty+=0.35;
  const bwBase=bw*unit*(1+head)*featurePenalty;
  const userBase=users*perUser*(1+head)*featurePenalty;
  const needProc=Math.max(bwBase,userBase);
  const fec=SIZING.fec[$('fecMode').value]||SIZING.fec.auto;
  const perfil=SIZING.boost.reduccion[$('boostProfile').value]||SIZING.boost.reduccion.generico;
  // Transporte WAN dual (fase 11): si el preventa declara los enlaces del sitio, el tier
  // de suscripcion se licencia por el caudal WAN AGREGADO (MPLS + Internet — VSG oficial)
  // y ese es el caudal que el chasis debe sostener. Si ambos quedan en 0, se deriva del
  // trafico de aplicacion como hasta ahora (con FEC y la reduccion de Boost).
  const mplsMbps=$('mplsType').value!=='none'?(parseFloat($('bwMpls').value)||0):0;
  const inetMbps=$('inetType').value!=='none'?(parseFloat($('bwInet').value)||0):0;
  const underlay=mplsMbps+inetMbps;
  const breakout=$('chkBreakout').checked;
  // Local Breakout (regla 70/30 del brief del duenyo, SIN FUENTE oficial): con DIA
  // disponible, ~70 % del trafico de aplicacion sale local y ~30 % sigue tunelizado al
  // DC. La cuota privada reduce lo que Boost debe optimizar y lo que el MPLS sostiene.
  const privateShare=(breakout&&inetMbps>0)?0.30:1;
  const wanNeed=underlay>0?underlay:needProc*(1+fec.pct)/(boost?perfil.factor:1);
  const tasaFlujos=FLUJOS_POR_USUARIO[$('perfilEntorno').value]||FLUJOS_POR_USUARIO.estandar;
  const flujosReq=users>0?users*tasaFlujos:0;
  const tier=tierParaCaudal(wanNeed);
  // Licenciamiento 100 % automático: el nivel sale de las funciones marcadas (matriz
  // oficial QuickSpecs p.31) y la modalidad On-Premises del menú avanzado. Los «No
  // incluir» (chkNoSub/chkNoCentral/chkSoloHw) son la exclusión explícita que el dueño
  // pidió conservar: '' = la línea se excluye y el panel declara el estado.
  const onprem=$('chkOnprem').checked;
  const bundle=$('chkNoSub').checked?'':(onprem?'onprem':nivelAutoEC());
  const central=$('chkNoCentral').checked?'':nivelAutoCentral();
  const termYrs=parseInt($('termYears').value)||3;
  const care=$('careLevel').value;
  const qty=Math.max(1,parseInt($('qty').value)||1);
  // Boost auto-dimensionado: 30 % del tráfico WAN privado, en bloques de 100 Mbps.
  // Sin suscripción no hay Boost (es un add-on suyo, no un producto independiente).
  const bloques=(boost&&bundle)?bloquesBoost(boostMbpsAuto(needProc,fec,privateShare)):0;
  return {bw,unit,users,aps,perUser,head,boost,fec,perfil,needProc,wanNeed,
    tasaFlujos,flujosReq,tier,onprem,bundle,central,termYrs,care,qty,bloques,
    mplsMbps,inetMbps,underlay,breakout,privateShare};
}

/* ══ REVISIÓN DEL DISEÑO (par técnico automático, 2026-09-13 fase 10) ══
   Reglas declarativas de coherencia: cada función activable del formulario llama su
   licencia y su cálculo, y las combinaciones imposibles o que hay que saber defender se
   declaran en la lista de materiales — el portal no solo cotiza, revisa el diseño como
   lo haría un arquitecto de soluciones antes de que la propuesta salga al cliente.
   ROJO = incoherencia que hay que corregir; AVISO = decisión legítima que hay que poder
   defender; si no hay hallazgos, el diseño se declara coherente. */
const REGLAS_DISENO=[
  {nivel:'rojo', cuando:(D,m)=>m.fam==='ec'&&D.flujosReq>0&&flujosDe(m)!=null&&flujosDe(m)<D.flujosReq,
   texto:(D,m)=>`Flujos insuficientes: ${m.id} publica ${miles(flujosDe(m))} flujos simultaneos y el escenario estima ${miles(D.flujosReq)} (${miles(D.users)} usuarios x ${D.tasaFlujos}/usuario). El recomendado del dimensionador si los cumple.`},
  {nivel:'rojo', cuando:(D,m)=>m.fam==='ec'&&m.wanMax!=null&&D.wanNeed>m.wanMax,
   texto:(D,m)=>`Caudal WAN insuficiente: ${m.id} publica hasta ${fmt(m.wanMax)} y los enlaces necesitan ${fmt(D.wanNeed)}.`},
  {nivel:'rojo', cuando:(D,m)=>m.fam!=='ec'&&m.fw!=null&&D.needProc>m.fw,
   texto:(D,m)=>`Proceso insuficiente: ${m.id} publica ${fmt(m.fw)} de firewall y el escenario necesita ${fmt(D.needProc)}.`},
  {nivel:'rojo', cuando:(D,m)=>m.fam==='ec'&&$('chkHa').checked&&D.qty!==2,
   texto:(D,m)=>`HA 1+1 exige exactamente 2 unidades identicas y la cantidad es ${D.qty}: ajusta la cantidad o desmarca HA.`},
  // IDS/IPS no corre en EC-XS (doc oficial Orchestrator/IDS: PN 200889/200900 sin soporte;
  // en EC-V exige min. 4 vCPU y 16 GB RAM). Marcar DTD con un EC-XS seleccionado es un
  // diseno imposible — hay que subir de modelo o quitar la funcion.
  {nivel:'rojo', cuando:(D,m)=>m.id==='EC-XS'&&secMode==='dtd',
   texto:()=>'Dynamic Threat Defense (IDS/IPS) NO corre en EC-XS segun la documentacion oficial de HPE: sube de modelo (EC-10104 en adelante) o cambia la estrategia de seguridad.'},
  {nivel:'aviso', cuando:(D,m)=>m.fam==='ec'&&D.boost&&!D.bundle,
   texto:()=>'Boost marcado pero EXCLUIDO: es un add-on de la suscripcion EdgeConnect — sin ella no hay fabric que optimizar.'},
  {nivel:'aviso', cuando:(D,m)=>m.fam==='ec'&&secMode==='dtd'&&!D.bundle,
   texto:()=>'Dynamic Threat Defense elegido pero suscripcion EXCLUIDA: es licencia aparte, pero DE la suscripcion — sin ella no se licencia.'},
  // Fase 11: la regla de trabajo del duenyo reserva +35 % de proceso para DTD, pero HPE
  // publica para los gateways SD-Branch un throughput IDS/IPS de solo el 17-30 % del de
  // firewall (datasheet oficial, medido con iMix). En EdgeConnect no hay cifra oficial:
  // el dimensionado ya va cargado con el 35 %, y este aviso pide no prometer de mas.
  {nivel:'aviso', cuando:(D,m)=>m.fam==='ec'&&secMode==='dtd',
   texto:()=>'DTD dimensionado con +35 % de proceso (regla de trabajo declarada). Ojo: en gateways SD-Branch HPE publica throughput IDS/IPS de solo el 17-30 % del nominal de firewall; en EdgeConnect no hay cifra oficial — si la inspeccion sera intensiva, considera un escalon mas de chasis.'},
  // Local Breakout sin Internet es una incoherencia de diseno: no hay salida local.
  {nivel:'aviso', cuando:(D,m)=>D.breakout&&D.inetMbps<=0&&D.underlay>0,
   texto:()=>'Local Breakout activo pero el sitio no tiene enlace de Internet declarado: no hay salida local para el trafico SaaS — declara un DIA/banda ancha o desmarca el breakout.'},
  // SSE con todo el trafico tunelizado al DC: el breakout es precisamente lo que da
  // sentido a la inspeccion en la nube (el trafico sale local hacia el PoP SSE).
  {nivel:'aviso', cuando:(D,m)=>secMode==='sse'&&!(D.breakout&&D.inetMbps>0),
   texto:()=>'SSE sin Local Breakout con Internet: la inspeccion en la nube rinde cuando el trafico de Internet sale LOCAL hacia el PoP SSE (tunel IPsec orquestado). Con full backhaul al DC la salida la inspeccionaria el DC, no el SSE.'},
  // El underlay declarado por debajo del trafico de aplicacion: el enlace no sostiene lo
  // que la LAN quiere enviar — hay que subir el caudal contratado o revisar el trafico.
  {nivel:'aviso', cuando:(D,m)=>D.underlay>0&&D.underlay<D.needProc,
   texto:(D,m)=>`El underlay declarado (${fmt(D.underlay)}) queda por debajo del trafico de aplicacion estimado (${fmt(D.needProc)}): el enlace contratado no sostiene la demanda — sube el caudal o revisa la estimacion.`},
  {nivel:'aviso', cuando:(D,m)=>m.fam==='ec'&&D.bundle==='onprem',
   texto:()=>'Modalidad On-Premises: el software de Orchestrator va incluido en la suscripcion, pero el ALOJAMIENTO (VM, uptime, backup y upgrades) corre por cuenta del cliente — dimensionarlo en la propuesta.'},
  {nivel:'aviso', cuando:(D,m)=>m.fam==='ec'&&D.onprem&&$('chkHa').checked&&D.qty===2,
   texto:()=>'Par HA on-prem cotizado 2x estandar: la equivalencia de los SKU HA E-STU no esta confirmada en las fuentes consultadas (PENDIENTES #17).'},
  {nivel:'aviso', cuando:(D,m)=>m.id==='EC-V',
   texto:()=>'EC-V es un appliance virtual: sin soporte de hardware (el hipervisor corre por cuenta del cliente) y su caudal lo fijan la licencia y los vCPU asignados.'},
  {nivel:'aviso', cuando:(D,m)=>m.fam==='ec'&&m.wanMin!=null&&D.wanNeed>0&&D.wanNeed<m.wanMin,
   texto:(D,m)=>`Sobredimensionamiento: ${m.id} publica un suelo de ${fmt(m.wanMin)} y los enlaces solo necesitan ${fmt(D.wanNeed)} — un modelo menor sostiene el sitio y baja el tier de la suscripcion.`},
];
function revisionDiseno(D,m){
  const h=REGLAS_DISENO.filter(r=>r.cuando(D,m)).map(r=>({nivel:r.nivel,texto:r.texto(D,m)}));
  h.sort((a,b)=>(a.nivel==='rojo'?0:1)-(b.nivel==='rojo'?0:1));
  if(!h.length) h.push({nivel:'ok',texto:'Diseno coherente: cada funcion activada tiene su licencia y su calculo, y el modelo cubre el caudal y los flujos estimados.'});
  return h;
}

/* ══ Widget de barras WAN (fase 11, 2026-09-13) ══
   Tres barras: caudal contratado (underlay declarado o derivado), caudal util tras la
   paridad FEC, y —con Boost— el caudal de aplicacion equivalente que se percibe tras la
   reduccion. Se pinta solo cuando hay cifras que mostrar. */
function pintarBarrasWan(D){
  const fld=$('fldBarras'), box=$('barrasWan');
  // Ahorro MPLS por Local Breakout: el hint vive siempre bajo la casilla.
  const ah=$('breakoutAhorro');
  if(D.breakout&&D.inetMbps>0&&D.needProc>0){
    ah.innerHTML=`Con Local Breakout, ~70 % del tráfico de aplicación (≈<b>${fmt(0.70*D.needProc)}</b>) sale directo por Internet; el túnel al DC/MPLS sostiene ≈<b>${fmt(0.30*D.needProc)}</b> (regla 70/30 declarada, sin fuente oficial).`;
  }else if(D.breakout&&D.inetMbps<=0){
    ah.textContent='Breakout activo pero sin enlace de Internet declarado: no hay salida local — declara un DIA/banda ancha arriba.';
  }else{
    ah.textContent='Breakout desactivado: todo el tráfico se tuneliza al datacenter (full backhaul).';
  }
  const fisico=D.underlay>0?D.underlay:D.wanNeed;
  if(fisico<=0){ fld.hidden=true; box.innerHTML=''; return; }
  const util=fisico/(1+D.fec.pct);
  const filas=[
    {cls:'b1', lbl:'Caudal WAN contratado'+(D.underlay>0?' (MPLS + Internet)':' (derivado del tráfico)'), val:fisico},
    {cls:'b2', lbl:`Útil tras FEC (${Math.round(D.fec.pct*100)} % paridad)`, val:util},
  ];
  if(D.boost) filas.push({cls:'b3', lbl:`Equivalente percibido con Boost (${D.perfil.factor}:1)`, val:util*D.perfil.factor});
  const max=Math.max(...filas.map(f=>f.val));
  box.innerHTML=filas.map(f=>
    `<div class="bw-row ${f.cls}"><span class="bw-lbl">${f.lbl}</span>`
    +`<span class="bw-track"><i style="width:${Math.max(2,Math.round(f.val/max*100))}%"></i></span>`
    +`<span class="bw-val">${fmt(f.val)}</span></div>`).join('');
  fld.hidden=false;
}

function render(){
  // Todo lo calculable sale del estado derivado: una sola fuente para el dimensionador,
  // la ficha y el BOM (2026-09-13, refactor arquitectónico).
  const D=estadoDerivado();
  const {bw,users,aps,head,boost,fec,perfil,needProc,wanNeed,tasaFlujos,flujosReq,tier}=D;
  // Widget de barras WAN + hint de ahorro por breakout (fase 11): se pinta siempre que
  // haya cifras, y se oculta solo cuando no hay nada que mostrar.
  pintarBarrasWan(D);
  // Sin ancho de banda Y sin enlaces declarados no hay recomendación (regla de preventa
  // 2026-09-13, ampliada en fase 11): el tráfico de aplicación o el underlay WAN son el
  // dato mínimo; sin ninguno de los dos la página pide valores en vez de proponer a ciegas.
  if(bw<=0&&D.underlay<=0){
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
  // Arquetipo Micro-Sucursal (fase 11): la respuesta Aruba es EdgeConnect Microbranch —
  // SD-WAN-lite en el propio AP AOS-10, sin appliance dedicado (VSG SD-Branch y doc de
  // personas de Central). No hay chasis que recomendar: se declara la arquitectura y lo
  // que hay que cotizar (AP + licencia Central + VPNC headend).
  if(personaMode==='micro'){
    lastPick=null; sincronizarConBom(null);
    poblarPickModel([], null);
    const need=$('need'); need.style.left='0%'; $('needLbl').textContent='—';
    $('track').querySelectorAll('.dot,.tick,.pickLabel').forEach(e=>e.remove());
    FICHA.render({...FICHA_CFG, contenedor:'verdict', candidatos:[], recomendado:null,
      vacioTitulo:'Micro-Sucursal: EdgeConnect Microbranch (SD-WAN en el propio AP)',
      vacioDetalle:`<div style="font-size:13.5px;line-height:1.55">
        <p style="margin:0 0 8px">Para una micro-sucursal o teletrabajador, Aruba no propone un appliance: el <b>túnel IPsec corre en el punto de acceso</b> (persona Microbranch de AOS-10 — cualquier AP de las series 50x/51x/53x/55x/6xx; los 500H/600R son los posicionados para teletrabajo). El AP-505H, referencia hospitality, publica 500 Mbps de IPsec.</p>
        <ul style="margin:0;padding-left:18px">
          <li><b>Sin appliance dedicado en el sitio:</b> el AP construye el túnel IPsec a un <b>VPNC headend</b> (gateway 72xx/9xxx/91xx/92xx, vGW o EdgeConnect vía Unified Fabric) — dimensiona ese headend con el arquetipo «Campus / DC Hub».</li>
          <li><b>Licenciamiento:</b> Microbranch va incluido en la suscripción Central del AP — Foundation ya trae túneles L2/L3, redundancia de DC/WAN y monitorización Microbranch; Advanced añade visibilidad de salud WAN y Cloud Connect (doc oficial de licenciamiento Central).</li>
          <li><b>Solo AOS-10:</b> la persona Microbranch no existe en AOS-8.</li>
        </ul>
        <p style="margin:8px 0 0">Si prefieres forzar un appliance en el sitio, cambia el arquetipo a «Libre» o «Sucursal pequeña».</p>
      </div>`});
    $('verdict').style.borderLeftColor='var(--red)';
    return;
  }
  $('headVal').textContent=Math.round(head*100)+' %';
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
    dot.className='dot'+(cap*IMIX_FACTOR>=needDe(m)?' ok':'');
    if(lastPick&&m.id===lastPick.id)dot.className='dot pick';
    dot.style.left=pct+'%';dot.title=m.id+': '+fmt(cap);
    track.appendChild(dot);
  });

  let outByBoost=0,outByClients=0,outByAps=0,outBySinDato=0,outByFlujos=0,outByPersona=0,sobrado=[];
  const candidates=MODELS.filter(m=>{
    if(!coincideFiltro(m,famMode)) return false;
    // Arquetipo de sede (fase 11): restringe el catalogo a los modelos que el VSG
    // posiciona para ese tamanyo de sitio. Libre = no restringe.
    if(personaMode!=='auto'&&personaMode!=='micro'&&PERSONA_MODELOS[personaMode]
      &&!PERSONA_MODELOS[personaMode].includes(m.id)){ outByPersona++; return false; }
    if(boost&&m.boostMax==null){ outByBoost++; return false; }
    // EC-V no publica rango: se dimensiona por licencia y vCPU, no por hardware.
    if(m.fam==='ec'&&m.wanMax==null) return false;
    const cap=capacidadMax(m);
    // Sin cifra publicada no se puede afirmar que cumpla: se descarta y se explica, en
    // vez de colarlo con un numero inventado o de omitirlo en silencio.
    if(cap==null){ outBySinDato++; return false; }
    // Factor IMIX (fase 11, regla de trabajo del duenyo): la capacidad efectiva con
    // mezcla real de trafico es el 70 % del nominal de laboratorio — el requerimiento se
    // compara contra la cifra ya degradada y la holgura queda dentro del modelo.
    if(cap*IMIX_FACTOR<needDe(m)) return false;
    const cMax=clientesMax(m), aMax=apsMax(m);
    if(cMax!=null&&users&&cMax<users){ outByClients++; return false; }
    if(aMax!=null&&aps&&aMax<aps){ outByAps++; return false; }
    // Flujos simultáneos: el chasis debe soportar con holgura los flujos calculados.
    // null (EC-V, 9240) = la fuente no publica el dato: no descarta, se declara.
    const fl=flujosDe(m);
    if(flujosReq>0&&fl!=null&&fl<flujosReq){ outByFlujos++; return false; }
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

  // ── Presentacion ──────────────────────────────────────────────────────────
  // El veredicto deja de ser un unico equipo fijo y pasa a ser un desplegable con TODOS
  // los que cumplen. Todo lo que se pinta debajo —medidores, escalera de capacidad,
  // resumen y BOM— sigue al equipo ELEGIDO, no al recomendado: en preventa casi nunca se
  // cotiza el primero de la lista a ciegas, se compara con el escalon siguiente.
  if(!pick){
    const why=[`<li>Caudal WAN requerido <b>${fmt(wanNeed)}</b> · proceso requerido <b>${fmt(needProc)}</b>.</li>`];
    // Cumplir por capacidad no basta si el equipo ya no se puede pedir: es el caso del
    // EC-XL (fin de venta 2026-03-31, política oficial de ciclo de vida de EdgeConnect).
    // Se nombra y se deja como referencia, no se cuela como propuesta.
    const eolQueCumplen=candidates.filter(m=>FICHA.recomendable&&!FICHA.recomendable(m));
    if(eolQueCumplen.length) why.push(`<li><b>${eolQueCumplen.map(m=>m.id).join(', ')}</b> cumple${eolQueCumplen.length>1?'n':''} por capacidad pero está${eolQueCumplen.length>1?'n':''} <b>fuera de venta</b> (último pedido ${eolQueCumplen.map(m=>m.eolAnnounced&&m.eolAnnounced.lastOrder?m.eolAnnounced.lastOrder:'declarado').join(', ')}). Queda en el selector como referencia para parque instalado; la notificación oficial de fin de venta nombra el reemplazo — confirmarlo con el distribuidor.</li>`);
    if(outByPersona) why.push(`<li><b>${outByPersona}</b> modelo(s) fuera del arquetipo de sede elegido: el VSG posiciona otros modelos para este tamaño de sitio. Cambia el arquetipo a «Libre» para recorrer todo el catálogo.</li>`);
    if(outByBoost) why.push(`<li><b>${outByBoost}</b> modelo(s) descartado(s) por pedir Boost: la optimización WAN es exclusiva de EdgeConnect, los gateways de las series 9000, 9100 y 9200 no la hacen.</li>`);
    if(outByClients) why.push(`<li><b>${outByClients}</b> gateway(s) descartado(s) por capacidad de clientes: hacen falta ${miles(users)}.</li>`);
    if(outByAps) why.push(`<li><b>${outByAps}</b> gateway(s) descartado(s) por número de APs: hacen falta ${miles(aps)}.</li>`);
    if(outByFlujos) why.push(`<li><b>${outByFlujos}</b> modelo(s) descartado(s) por flujos simultáneos: el perfil de entorno estima ${miles(flujosReq)} flujos activos (${miles(users)} usuarios × ${tasaFlujos}/usuario). Bajar el perfil o repartir la carga entre dos sitios son las salidas.</li>`);
    if(outBySinDato) why.push(`<li><b>${outBySinDato}</b> modelo(s) sin cifra de throughput publicada en las fuentes consultadas (serie 9100). Aparecen en la pestaña "Equipo y BOM" y su capacidad hay que confirmarla en las QuickSpecs.</li>`);
    why.push('<li>Por encima del catálogo: repartir el fabric en varios head-ends, o escalar en el datacenter con EC-V, cuyo caudal lo fija la licencia y los vCPU asignados y no el hardware.</li>');
    poblarPickModel(candidates, null);
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
    // Flujos simultáneos: la métrica que de verdad gobierna el SD-WAN de Aruba (refactor
    // arquitectónico 2026-09-13). null en la fuente (EC-V, 9240) = no se pinta el medidor,
    // se declara en el «por qué» en vez de inventar la cifra.
    const fl=flujosDe(m);
    if(flujosReq>0&&fl!=null) out.push({etq:'Flujos simultáneos', val:flujosReq, tope:fl,
      txt:miles(flujosReq)+' / '+miles(fl)});
    return out;
  };

  const porQueDe=m=>{
    const cap=capacidadMax(m), req=needDe(m), nivel=nivelLicenciaNecesario(m,req,users,aps), flags=[];
    if(m.fam==='ec'){
      flags.push(`<b>Caudal WAN a contratar:</b> ${fmt(wanNeed)}${fec.pct?` (incluye ${Math.round(fec.pct*100)}% de paridad FEC)`:''}${boost?` tras la reducción ${perfil.factor}:1 de Boost sobre ${esc(perfil.n.toLowerCase())}`:''}. Tier de suscripción: <b>${tier?esc(tier.n):'—'}</b>.`);
      if(boost&&D.bloques) flags.push(`<b>Boost auto-dimensionado:</b> el enlace transporta ${fmt(wanNeed)} en vez de ${fmt(needProc*(1+fec.pct))}. Se licencia el 30 % del tráfico WAN privado estimado (${fmt(boostMbpsAuto(needProc,fec,D.privateShare))}${D.privateShare<1?' — ya descontada la salida local del breakout (cuota privada 30 %)':''}) en bloques de ${SIZING.boost.bloque} Mbps que forman un pool del fabric — para esta sede, <b>${D.bloques} bloque(s)</b>.`);
      else if(!boost) flags.push('Admite Boost. Merece evaluarse si el tráfico es repetitivo (réplicas, backups, VDI, CIFS/SMB): reduce el caudal contratado, que a 3–5 años suele pesar más en el TCO que el propio equipo.');
      if(sobrado.includes(m.id)) flags.push(`<b class="warn">Sobredimensionado:</b> el requerimiento (${fmt(wanNeed)}) queda por debajo del suelo del rango publicado (${fmt(m.wanMin)}). Revisar el escalón inferior antes de cotizar.`);
      // Nivel deducido de las funciones marcadas (matriz oficial QuickSpecs p.31): se
      // declara el porqué para que la propuesta sea defendible ante el cliente.
      flags.push(`<b>Suscripción ${nivelAutoEC()==='advanced'?'Advanced':'Foundation'}:</b> ${porqueNivelEC(nivelAutoEC())}.`);
    }
    if(flujosReq>0){
      const fl=flujosDe(m);
      flags.push(fl!=null
        ?`<b>Flujos simultáneos:</b> el perfil de entorno estima ${miles(flujosReq)} flujos activos (${miles(users)} usuarios × ${tasaFlujos}/usuario) contra los ${miles(fl)} que publica la ficha — el chasis los soporta con holgura.`
        :`<b>Flujos simultáneos:</b> el perfil estima ${miles(flujosReq)} flujos activos, pero HPE no publica la cifra para este modelo — confirmarla en las QuickSpecs antes de comprometer el diseño.`);
    }
    if(destMode==='cloud') flags.push('<b>Cloud-First/SaaS:</b> First-packet iQ clasifica la aplicación en el primer paquete y rompe al Internet local o a la nube SSE; el túnel cifrado al datacenter se reserva para el tráfico privado. Son capacidades de plataforma — no fuerzan el nivel de suscripción.');
    if(secMode==='dtd') flags.push('<b>Dynamic Threat Defense:</b> IDS/IPS, DDoS adaptativo y clasificación web son una licencia opcional APARTE de Foundation y Advanced (QuickSpecs p.32). Entra en la lista de materiales como «consultar»: no está en la lista de precios. El dimensionado reserva un 35 % adicional de proceso para la inspección (regla de trabajo declarada — ver la revisión del diseño).');
    if(secMode==='sse') flags.push('<b>HPE Aruba Networking SSE:</b> la inspección se hace en la nube — ZTNA, SWG, CASB y DEM en suscripción <b>por usuario</b> (paquetes oficiales Foundation ZTNA / Foundation SWG / Foundation Plus / Advanced / Advanced Plus, QuickSpecs SSE a50009212enw). El appliance monta los túneles IPsec orquestados hacia el SSE y AppExpress elige el mejor PoP. Entra en la lista como «consultar»: HPE no publica List Price de SSE.');
    if(cap!=null) flags.push(`<b>Capacidad efectiva (IMIX):</b> el dimensionador exige que el requerimiento quepa en el 70 % del throughput nominal (regla de trabajo declarada — HPE no publica el delta entre laboratorio y mezcla real de Internet). Este modelo queda al ${Math.round(req/(cap*IMIX_FACTOR)*100)} % de su capacidad efectiva.`);
    if(m.legacy) flags.push('<b class="warn">Línea anterior (AOS 8):</b> las series 7000 y 7200 siguen en canal y son la respuesta natural para <b>ampliar un parque ya instalado</b>, pero para un despliegue nuevo conviene contrastar con la generación actual (series 9000/9100/9200 sobre AOS 10).');
    if(m.fam==='gw'&&m.rol==='sucursal'&&!m.legacy) flags.push(`<b>Sucursal:</b> el mismo equipo termina la WAN y hace de controladora de APs (hasta ${miles(m.aps)}), aplicando Dynamic Segmentation con el rol que traen el switch CX o el AP. No hace optimización WAN.`);
    if(m.fam==='gw') flags.push(`<b>Central ${nivelAutoCentral()==='advanced'?'Advanced':'Foundation'}:</b> ${nivelAutoCentral()==='advanced'?'deducido de las funciones marcadas (segmentación de extremo a extremo o AIOps ampliada)':'gestión SD-Branch completa — firewall, VPN y políticas por aplicación ya son Foundation, sin funciones que fuercen el nivel superior'}.`);
    if(m.licCap&&nivel) flags.push(`<b>Capacidad por licencia:</b> escala sin cambiar de hardware. Para ${fmt(req)} hace falta el nivel <b>${esc(nivel.n)}</b> (${fmt(nivel.fw)}, ${miles(nivel.aps)} APs, ${miles(nivel.clients)} dispositivos).`);
    if($('chkHa').checked) flags.push(m.fam==='ec'&&!D.onprem
      ?'<b>HA 1+1:</b> el par se cotiza 1× suscripción estándar + 1× suscripción de alta disponibilidad para el segundo nodo (SKU «HA» propio del QuickSpecs; la lista de precios documentada lo tarifa igual que el estándar).'
      :'<b>HA:</b> se cotizan 2 unidades y cada una lleva su propia suscripción de sitio.');
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
      // panel aparte de bomBody, ahora dentro de la ficha. Se marca el nivel DEDUCIDO del
      // dimensionamiento (o «solo hardware» si se pidió cotizar sin licencia de capacidad).
      const marcado=$('chkSoloHw').checked?'hw':(nivelLicenciaNecesario(m,needProc,users,aps)||m.licCap[0]).code;
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
    // Suscripción, tier, Boost y nivel de capacidad: DEDUCIDOS (estadoDerivado), no
    // elegidos a mano — el panel 4 muestra la deducción y su porqué (2026-09-13).
    const bundle=D.bundle, care=D.care, central=D.central;
    const termYrs=D.termYrs;
    const termino=`término ${termYrs} año${termYrs>1?'s':''}`;
    const bwTier=D.tier;
    const bloques=D.bloques;
    const capTier=esGwc&&m.licCap
      ?($('chkSoloHw').checked?m.licCap[0]:(nivelLicenciaNecesario(m,needProc,users,aps)||m.licCap[0]))
      :null;

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
    // Sesiones IPsec y túneles GRE salen de la ficha (2026-09-13, refactor arquitectónico):
    // el SD-WAN de Aruba no se rige por túneles estáticos — el orquestador los gestiona
    // dinámicamente según los overlays— y mostrarlos como métrica de dimensionamiento
    // inducía el error conceptual que este refactor cierra. El dato sigue en el catálogo.
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

    // EC-V es virtual (fase 10): el soporte de hardware no aplica — la suscripción ya
    // incluye el soporte de software y el hipervisor corre por cuenta del cliente.
    const soporte=m.id==='EC-V'
      ?{titulo:'Soporte', filas:[],
        nota:'<b>No aplica el soporte de hardware.</b> EC-V es un appliance virtual: la suscripción incluye el soporte de software (TAC y actualizaciones) y el hipervisor corre por cuenta del cliente.'}
      :(care
        ?{titulo:'Soporte', filas:[[esc(CARE[care].n), esc(CARE[care].sla)]],
          nota:`${esc(CARE[care].d)} ${termino} · ${unidades===2?'2 unidades (par HA)':'1 unidad'}. Su SKU y su precio están integrados en la lista de materiales.`}
        :{titulo:'Soporte', filas:[],
          nota:'<b>No incluido.</b> Sin soporte activo no hay repuestos con SLA ni acceso al TAC de HPE — elige un nivel para añadirlo a la lista de materiales.'});

    return [
      capacidadPublicadaDe(m),
      {titulo:'Características del equipo', filas:caract},
      {titulo:'Ficha técnica', filas:tecnica},
      FICHA.seccionAlimentacion(m),
      {titulo:'Suscripción y licencias',
       filas:[['Unidades a licenciar', unidades===2
         ?(esEC&&!D.onprem
           ?'2 — 1× suscripción estándar + 1× SKU de alta disponibilidad para el segundo nodo (la lista de precios documentada lo tarifa igual que el estándar)'
           :'2 — cada nodo del par lleva la suya')
         :'1']],
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
      // Fuera de venta se nombra como tal en el combo (2026-09-13, EC-XL): «cumple» por
      // capacidad no es proponible si ya no se puede pedir.
      const mc=FICHA.marca?FICHA.marca(m):null;
      const marca=mc&&mc.fuera?' · fin de venta':m.id===recomendado?' · recomendado':(ids.has(m.id)?' · cumple':'');
      return `<option value="${esc(m.id)}">${esc(m.id)} — ${esc(m.seg)}${marca}</option>`;
    }).join('')+'</optgroup>').join('');
  if(actual&&[...sel.options].some(o=>o.value===actual)) sel.value=actual;
}

function populateSelects(){
  poblarPickModel([], null);
  // Licenciamiento 100 % automático (2026-09-13, refactor arquitectónico): nivel de
  // suscripción, tier de caudal, bloques de Boost y nivel de capacidad del 9240 se
  // DEDUCEN — ya no hay selectores manuales que poblar para ellos. Lo único que sigue
  // siendo elección comercial es el nivel de soporte (y los «No incluir», que viven
  // como casillas junto a cada deducción del panel 4).
  $('careLevel').innerHTML='<option value="">No incluir</option>'+Object.entries(CARE).map(([k,c])=>`<option value="${esc(k)}"${k==='fc247'?' selected':''}>${esc(c.n)}</option>`).join('');
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
  // Licenciamiento 100 % automático (2026-09-13, refactor arquitectónico): nivel de
  // suscripción, tier de caudal, bloques de Boost y nivel de capacidad se DEDUCEN del
  // escenario — estadoDerivado es la misma fuente que alimenta el dimensionador y la
  // ficha, así que la lista de materiales nunca diverge de lo dimensionado.
  const D=estadoDerivado();
  const qty=D.qty, termYrs=D.termYrs;
  // '' = «No incluir» (peticion del dueno, conservada): la linea se excluye de la lista
  // y su panel declara el estado en vez de inventarla. Sin suscripcion EdgeConnect
  // tampoco hay Boost: es un add-on suyo, no un producto independiente.
  const bundle=D.bundle, care=D.care, central=D.central;
  const bwTier=D.tier, bwCode=bwTier?bwTier.code:null;
  const bloques=D.bloques;

  const esEC=m.fam==='ec', esGwc=!!m.licCap;
  // EC-V es un appliance virtual (2026-09-13, fase 10): el soporte de hardware no aplica
  // —el hipervisor corre por cuenta del cliente y la suscripción ya incluye el soporte de
  // software—, así que el nivel CARE se oculta y su fila no entra en la lista.
  const esVirtual=m.id==='EC-V';
  // Los paneles de licenciamiento que no aplican a la familia elegida se ocultan, en vez
  // de dejar que alguien cotice una suscripción EdgeConnect sobre un gateway.
  $('fldSub').hidden=!esEC; $('fldCentral').hidden=esEC; $('fldCapTier').hidden=!esGwc;
  $('fldCare').hidden=esVirtual;

  const termino=`término ${termYrs} año${termYrs>1?'s':''}`;
  const capTier=esGwc&&m.licCap
    ?($('chkSoloHw').checked?m.licCap[0]:(nivelLicenciaNecesario(m,D.needProc,D.users,D.aps)||m.licCap[0]))
    :null;

  // Panel 4: la deducción se MUESTRA con su porqué — la propuesta tiene que ser
  // defendible ante el cliente sin que el preventa rehaga el razonamiento a mano.
  if(esEC){
    $('licAutoTxt').innerHTML=bundle
      ?`<b>${esc(BUNDLES[bundle].n)}</b> — tier <b>${bwTier?esc(bwTier.n):'—'}</b> · ${termino}`
        +`<br><span class="lic-auto-porque">${bundle==='onprem'
            ?'modalidad On-Premises (E-STU) elegida en opciones avanzadas: el Orchestrator vive en la infraestructura del cliente'
            :esc(porqueNivelEC(nivelAutoEC()))}</span>`
        +(bloques?`<br>Boost: <b>${bloques} bloque(s) de ${SIZING.boost.bloque} Mbps</b> = 30 % del tráfico WAN privado estimado (${fmt(boostMbpsAuto(D.needProc,D.fec,D.privateShare))})`:'')
      :'<b>Suscripción excluida</b><br><span class="lic-auto-porque">El equipo queda standalone, sin fabric gestionado ni ZTP — y tampoco se licencia Boost, que es un add-on de la suscripción.</span>';
  }else{
    $('centralAutoTxt').innerHTML=central
      ?`<b>${esc(CENTRAL[central].n)}</b> · ${termino}`
        +`<br><span class="lic-auto-porque">${central==='advanced'
            ?'deducido de las funciones marcadas: segmentación de extremo a extremo o analítica/AIOps ampliada (la retención de datos es la misma en ambos niveles — tabla oficial de Central)'
            :'gestión completa SD-Branch: firewall, VPN, orquestación y políticas por aplicación ya son Foundation — sin funciones que fuercen el nivel superior'}</span>`
      :'<b>Central excluido</b><br><span class="lic-auto-porque">El gateway se queda en gestión local, sin la nube de HPE ni apertura de casos.</span>';
  }
  if(esGwc){
    $('capAutoTxt').innerHTML=capTier&&capTier.code!=='hw'
      ?`<b>${esc(capTier.n)}</b><br><span class="lic-auto-porque">deducido del dimensionamiento: ${fmt(D.needProc)} de proceso, ${miles(D.users)} dispositivos y ${miles(D.aps)} APs — el nivel ${esc(capTier.n)} es el primero que cubre las tres cifras</span>`
      :'<b>Solo hardware (20 Gbps)</b><br><span class="lic-auto-porque">sin licencia de capacidad: la serie 9200 entrega 20 Gbps, 512 APs y 16.000 dispositivos sin ella</span>';
  }

  const lic=LICENSES[bwCode]||null;
  const licTier=lic&&bundle?(lic[bundle]||null):null;
  // Par HA 1+1: HPE publica un juego de SKU propio para el SEGUNDO nodo (LICENSES_HA),
  // con el mismo precio que el estándar — lo que cambia es el SKU de pedido. Solo aplica
  // a la modalidad SaaS: la equivalencia de los SKU HA E-STU (on-prem) no está confirmada
  // en las fuentes consultadas, así que el par on-prem se cotiza 2× estándar y se declara.
  const haPar=esEC&&$('chkHa').checked&&qty===2;
  const licHa=haPar&&!D.onprem&&bundle&&bundle!=='onprem'
    ?((LICENSES_HA[bwCode]||{})[bundle]||null):null;
  // El soporte se cotiza por MODELO (CARE_SKU, servicio atado a la variante de hardware),
  // no por tier de caudal — desde 2026-09-13 sale de la lista de precios documentada en
  // aruba.js. Lo que la lista no cubre (fcsw, gateways, 4HR del 10150) sigue en consultar.
  const cs=care&&CARE_SKU[m.id]?CARE_SKU[m.id][care]:null;
  const careTier=cs?{sku:{y1:cs.y1[0],y3:cs.y3[0],y5:cs.y5[0]},y1:cs.y1[1],y3:cs.y3[1],y5:cs.y5[1]}:null;
  const licPrice=tierPrice(licTier,termYrs);
  const licHaPrice=tierPrice(licHa,termYrs);
  const carePrice=tierPrice(careTier,termYrs);
  // Boost se licencia como SaaS sobre Foundation/Advanced y como E-STU sobre On-Premises:
  // cada modalidad tiene su propio juego de SKUs (2026-09-13, ver aruba.js).
  const boostCfg=bloques&&SIZING.boost?(bundle==='onprem'?SIZING.boost.onprem:SIZING.boost.saas):null;
  const boostBlk=boostCfg?boostCfg.bloque100:null;
  const boostPrice=tierPrice(boostBlk,termYrs);
  const centralTier=CENTRAL[central]||null;
  const centralPrice=tierPrice(centralTier,termYrs);

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
      if(licHa){
        // Par HA 1+1 en modalidad SaaS: 1× suscripción estándar (nodo primario) + 1×
        // suscripción de alta disponibilidad (segundo nodo, SKU «HA» del QuickSpecs).
        filas.push({cat:'Suscripción SD-WAN', desc:`${BUNDLES[bundle].n} — ${bwTier?bwTier.n:'tier por definir'} · nodo primario`,
          sku:tierSku(licTier,termYrs), qty:1, unit:licPrice,
          nota:`${termino} · suscripción por caudal del sitio, no por modelo de appliance`});
        filas.push({cat:'Suscripción SD-WAN', desc:`${BUNDLES[bundle].n} HA — ${bwTier?bwTier.n:'tier por definir'} · segundo nodo del par 1+1`,
          sku:tierSku(licHa,termYrs), qty:1, unit:licHaPrice,
          nota:`${termino} · SKU de alta disponibilidad del QuickSpecs (existencia y regla «match tier, bandwidth, term»); la lista de precios documentada lo tarifa igual que el estándar`});
      }else{
        filas.push({cat:'Suscripción SD-WAN', desc:`${BUNDLES[bundle].n} — ${bwTier?bwTier.n:'tier por definir'}`,
          sku:tierSku(licTier,termYrs), qty, unit:licPrice,
          nota:`${termino} · suscripción por caudal del sitio, no por modelo de appliance`
            +(haPar&&D.onprem?' · par HA on-prem cotizado 2× estándar: la equivalencia de los SKU HA E-STU no está confirmada en las fuentes consultadas':'')});
      }
      if(bloques){
        filas.push({cat:'Aceleración', desc:`${SIZING.boost.n} — bloque de ${SIZING.boost.bloque} Mbps`,
          sku:tierSku(boostBlk,termYrs), qty:bloques, unit:boostPrice,
          nota:`Pool agregado del fabric (${fmt(bloques*SIZING.boost.bloque)} = 30 % del tráfico WAN privado estimado). Orchestrator lo reparte entre sedes; no multiplica por unidad.`});
      }
      // Dynamic Threat Defense: licencia opcional APARTE de Foundation y Advanced
      // (QuickSpecs p.32). Sin SKU en la lista de precios: entra como «consultar».
      if(secMode==='dtd'){
        filas.push({cat:'Seguridad', desc:'Dynamic Threat Defense — IDS/IPS, DDoS adaptativo, clasificación web',
          sku:null, qty, unit:null,
          nota:`${termino} · licencia opcional aparte de Foundation/Advanced (QuickSpecs p.32) · sin SKU en la lista de precios — consultar`});
      }
      // Modalidad On-Premises (E-STU): la suscripcion INCLUYE el software de Orchestrator
      // on-prem (data sheet oficial a50010073enw); lo que corre por cuenta del cliente es
      // el ALOJAMIENTO — VM, disponibilidad, backup y actualizaciones. La linea lo declara
      // para que la propuesta no olvide dimensionar esa infraestructura (2026-09-13, fase 10).
      if(D.onprem){
        filas.push({cat:'Orquestación', desc:'Orchestrator auto-alojado — software incluido en la suscripción On-Premises',
          sku:null, qty:1, unit:null,
          nota:'Sin coste de licencia (incluido en E-STU) · el alojamiento —VM, uptime, backup y upgrades— corre por cuenta del cliente'});
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
  // HPE Aruba Networking SSE (fase 11): suscripcion POR USUARIO (ZTNA, SWG, CASB, DEM —
  // paquetes oficiales Foundation ZTNA / Foundation SWG / Foundation Plus / Advanced /
  // Advanced Plus, QuickSpecs SSE a50009212enw). HPE no publica List Price de SSE: entra
  // como «consultar». Es independiente del chasis — el tunel IPsec orquestado lo montan
  // tanto EdgeConnect como los gateways SD-Branch.
  if(secMode==='sse'){
    filas.push({cat:'Seguridad SASE', desc:'HPE Aruba Networking SSE — suscripción por usuario (ZTNA, SWG, CASB, DEM)',
      sku:null, qty:Math.max(1,D.users||1), unit:null,
      nota:`${termino} · por usuario (${miles(Math.max(1,D.users||1))} usuarios) · paquetes Foundation ZTNA / Foundation SWG / Foundation Plus / Advanced / Advanced Plus (QuickSpecs SSE) · HPE no publica List Price — consultar`});
  }
  if(care&&!esVirtual){
    filas.push({cat:'Soporte', desc:CARE[care].n, sku:tierSku(careTier,termYrs), qty, unit:carePrice,
      nota:`${termino} · ${CARE[care].sla}`});
  }

  // Fin de venta: cualquier línea cuyo SKU figure en la lista con PLC «ES» (End of Sale)
  // se declara aquí y en la exportación — tanto las que pone el motor como las añadidas a
  // mano desde el catálogo (viven en BOM.refsExtra, filtradas al fabricante de la página).
  // Cotizar hardware en fin de venta deja al cliente sin contrato de soporte vendible
  // antes de que acabe el plazo — hay que verlo, no descubrirlo en la entrega.
  const refsPagina=(BOM.refsExtra?BOM.refsExtra():[]).filter(r=>!r.v||String(r.v).toLowerCase()==='aruba');
  const enEs=[...filas.map(f=>({sku:f.sku,desc:f.desc})), ...refsPagina.map(r=>({sku:r.sku,desc:r.d}))]
    .filter((x,i,l)=>x.sku&&PLC_POR_SKU[x.sku]==='ES'&&l.findIndex(y=>y.sku===x.sku)===i);

  const meta={
    titulo:`Lista de materiales — ${m.id}`,
    subtitulo:`${m.seg} · ${famLabel(m)} · ${termino}`,
    archivo:`BOM_${m.id}`,
    notas:[
      enEs.length?'FIN DE VENTA (estado PLC «ES» en la lista de precios):':null,
      ...enEs.map(f=>`  ${f.sku} — ${f.desc}. HPE ya no lo vende: confirmar el sucesor antes de cotizar.`),
      '',
      'CAPACIDAD PUBLICADA POR HPE',
      esEC?`  Rango de caudal WAN:  ${m.wanMin!=null?fmt(m.wanMin)+' - '+fmt(m.wanMax):'sin minimo publicado'}`
          :`  Throughput firewall:  ${m.fw!=null?fmt(m.fw):'no publicado en las fuentes consultadas'}`,
      m.clients!=null?`  Clientes / APs:       ${miles(m.clients)} / ${miles(m.aps)}`:null,
      // Sesiones IPsec y tuneles GRE salen de la exportacion (2026-09-13, refactor
      // arquitectonico): el orquestador gestiona los tuneles dinamicamente y no son
      // metrica de dimensionamiento. Los flujos simultaneos si lo son.
      flujosDe(m)!=null?`  Flujos simultaneos:   ${miles(flujosDe(m))}`:null,
      `  Interfaces:           ${m.ifaces}`,
      `  Referencias:          ${(m.skus||[]).map(r=>(r.sku||'sin SKU')+' '+r.d).join(' | ')||'-'}`,
      `  Datasheet:            ${m.ds||'sin URL oficial confirmada'}`,
      m.dsLocal?`  Copia local:          ${m.dsLocal}`:null,
      // Transporte WAN del sitio (fase 11): cuando el preventa declara los enlaces, el
      // tier se licencia por el caudal agregado y la exportacion lo documenta.
      D.underlay>0?'':'',
      D.underlay>0?'TRANSPORTE WAN DEL SITIO (tier licenciado por caudal agregado — VSG)':null,
      D.underlay>0?`  MPLS:     ${D.mplsMbps>0?fmt(D.mplsMbps)+' ('+$('mplsType').selectedOptions[0].text+')':'sin MPLS'}`:null,
      D.underlay>0?`  Internet: ${D.inetMbps>0?fmt(D.inetMbps)+' ('+$('inetType').selectedOptions[0].text+')':'sin Internet'}`:null,
      D.underlay>0?`  Agregado: ${fmt(D.underlay)} · Local Breakout ${D.breakout?'ACTIVO'+' (cuota privada ~30 % — regla 70/30 declarada)':'desactivado (full backhaul)'}`:null,
      '',
      esEC?'COMO SE LICENCIA EDGECONNECT':'COMO SE LICENCIA ESTE GATEWAY',
      esEC?'  Nivel (Foundation/Advanced) DEDUCIDO de las funciones del diseno segun la'
          :'  Gestion por suscripcion de Central (Foundation o Advanced) por dispositivo,',
      esEC?'  matriz oficial (QuickSpecs p.31); el tier va por CAUDAL DEL SITIO (100 Mbps,'
          :(esGwc?'  con el nivel deducido de las funciones marcadas. En la serie 9200 la':''),
      esEC?'  1 Gbps o ilimitado), no por modelo de appliance. Boost es un add-on en'
          :(esGwc?'  CAPACIDAD la fija la licencia perpetua (Silver/Gold) sobre el mismo':''),
      esEC?'  bloques de 100 Mbps = 30% del trafico WAN privado, en POOL del fabric.'
          :(esGwc?'  hardware, sin cambiar de equipo.':'  La serie 9000 no hace optimizacion WAN: unifica WAN, LAN y WLAN.'),
      '',
      'ADVERTENCIA DE DATOS',
      '  List Price de HPE (sin descuento de distribuidor) para hardware y suscripciones,',
      '  tomado del export de lista de precios documentado en aruba-lista-precios-hpe.csv.',
      '  El soporte Foundational Care se cotiza por modelo (CARE_SKU en aruba.js). Lo que',
      '  sigue sin precio (EC-V, DTD, FC de software y FC de gateways) va en consultar',
      '  a proposito. Confirmar la fila exacta del datasheet antes de emitir la propuesta.',
      '',
      'REVISION DEL DISENO (par tecnico automatico)',
      ...revisionDiseno(D,m).map(h=>`  [${h.nivel==='rojo'?'ROJO':h.nivel==='aviso'?'AVISO':'OK'}] ${h.texto}`),
      licHa?'  Par HA 1+1: 1x suscripcion estandar (nodo primario) + 1x suscripcion de'
          :null,
      licHa?'  alta disponibilidad (segundo nodo, SKU «HA» del QuickSpecs; la lista de'
          :null,
      licHa?'  precios documentada lo tarifa igual que el estandar).'
          :null,
      qty>1&&!licHa?`  Par de ${qty} unidades: la suscripcion de sitio no se comparte, cada nodo lleva la suya.`:null,
    ].filter(n=>n!==null&&n!==''),
  };

  // El aviso de desvío vive sobre la lista: con la ficha unificada (2026-09-13) ya no hay
  // paneles de detalle en «Dimensionar» donde pintarlo, y su sitio natural es la cotización
  // misma — si la lista cotiza un equipo distinto del elegido, o ya ninguno cumple, es aquí
  // donde quien exporta tiene que verlo.
  const avisoEs=enEs.length
    ?`<p class="bom-eos"><b>Fin de venta.</b> ${enEs.map(f=>`<b>${esc(f.sku)}</b>`).join(', ')} figura${enEs.length>1?'n':''} en la lista de precios con estado PLC «ES» (End of Sale): HPE ya no lo vende y el soporte deja de contratarse años antes de que acabe el plazo. Confirma el sucesor antes de emitir la propuesta.</p>`
    :'';
  $('bomTabla').innerHTML=avisoEs+BOM.avisoDesvio({elegido:FICHA.elegido('verdict'), enBom:m.id, hayCandidato:!!lastPick})
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
   es la puerta de entrada — busca en los 94 SKU de la lista de precios pública
   (public/datasheets/aruba-lista-precios-hpe.csv: hardware y sus variantes TAA/NAL,
   remanufacturados, suscripciones EdgeConnect/Boost/Central —incluidos los SKU de alta
   disponibilidad del segundo nodo— y licencias perpetuas 9240).
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
  'Suscripción EdgeConnect Foundation HA','Suscripción EdgeConnect Advanced HA',
  'Suscripción EdgeConnect On-Premises','Boost EdgeConnect (SaaS)','Boost EdgeConnect (On-Premises)',
  'HPE Aruba Networking Central','Licencias perpetuas 9240'];
// Variantes gubernamentales (TAA / NAL / FIPS): se ocultan por defecto y se muestran solo
// cuando quien cotiza las pide con el botón «Variantes gubernamentales» del panel.
const TAA_RE=/\b(TAA|NAL|FIPS)\b/;

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
    // Estado del ciclo de vida por SKU (columna PLC del export): «ES» = End of Sale —
    // HPE ya no lo vende. Lo cruzan el panel (chip ámbar) y el BOM (aviso de fin de venta).
    PLC_POR_SKU={}; for(const x of SKU_CAT) if(x.sku&&x.plc) PLC_POR_SKU[x.sku]=x.plc;
    pintarCatalogoSku();
    // El BOM se pintó antes de que llegara el CSV: se repinta para que el aviso de fin de
    // venta aparezca sin que quien opera tenga que tocar nada.
    renderBom();
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
  const visibles=SKU_CAT.filter(x=>skuTaaOn||!TAA_RE.test(x.d||''));
  const cats=SKU_CAT_ORDEN.map(c=>[c,visibles.filter(x=>x.cat===c)]).filter(([,l])=>l.length);
  const chips=cats.map(([c,l])=>`<button type="button" class="sku-chip${skuCatActiva===c?' on':''}" data-sku-cat="${esc(c)}">${esc(c)} <span class="sku-chip-n">${l.length}</span></button>`).join('');
  let body='';
  for(const [c,lista] of cats){
    if(skuCatActiva&&skuCatActiva!==c) continue;
    const filas=lista.filter(x=>!q||(x.sku||'').toLowerCase().includes(q)||(x.d||'').toLowerCase().includes(q));
    if(!filas.length) continue;
    body+=`<div class="sku-grupo">${esc(c)}</div>`+filas.map(x=>{
      const ya=x.sku&&auto.has(x.sku);
      return `<div class="sku-fila${ya?' ya':''}${x.plc==='ES'?' es':''}">`
        +`<span class="sku-fila-sku">${x.sku?`<code>${esc(x.sku)}</code>`:'<span class="bom-nd">sin SKU confirmado</span>'}</span>`
        +`<span class="sku-fila-d">${esc(x.d)}${x.vig?`<span class="sku-fila-meta">List Price vigente ${esc(x.vig)}${x.plc==='ES'?` · <span class="sku-plc-es">ES · fin de venta</span>`:x.plc?` · ${esc(x.plc)}`:''}</span>`:''}</span>`
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

$('skuTaa').addEventListener('click',()=>{
  skuTaaOn=!skuTaaOn;
  $('skuTaa').setAttribute('aria-pressed',String(skuTaaOn));
  $('skuTaa').textContent=`Variantes gubernamentales (TAA / NAL) · ${skuTaaOn?'ocultar':'mostrar'}`;
  pintarCatalogoSku();
});

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
  LICENSES_HA = data.licensesHa || {};
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
  const st = ESTADO.vincular({ campos: ['bw','unit','users','aps','perUser','head','fecMode','boostProfile','perfilEntorno','chkBoost','chkSeg','chkTopo','chkAiops','chkHa','famSeg','segSeg','destSeg','pickModel','personaSeg','secSeg','mplsType','bwMpls','inetType','bwInet','chkBreakout'] });
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
