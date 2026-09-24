'use strict';
// Dimensionador HPE Aruba Networking.
//
// El motor NO copia el de Fortinet, porque lo que publica HPE es otra cosa. Para
// EdgeConnect la cifra oficial es el RANGO DE CAUDAL WAN de cada appliance; para los
// gateways de las series 9000/9200 es el THROUGHPUT DE FIREWALL mas la capacidad de
// clientes y APs. Se dimensiona con lo que existe publicado en vez de inventar una
// escalera de capas homogenea.
let MODELS = [], BUNDLES = {}, CARE = {}, CARE_SKU = {}, LICENSES = {}, LICENSES_HA = {},
    SIZING = {}, SOFTWARE = [], CENTRAL = {}, DATASHEETS = {}, OS_MATRIX = null;
// SKU de Central por serie de gateway (A3, 2026-09-24): ver CENTRAL_POR_SERIE en aruba.js.
let CENTRAL_SERIE = {};
// M5 (auditoria 2026-09-17, corregido 2026-09-24): al abrir un enlace, ESTADO repone los
// grupos `.seg` con click() en DOMContentLoaded, y sus manejadores llaman a render() ANTES de
// que llegue /api/dimensionador/aruba — `SIZING.fec` no existe todavia y la pagina lanzaba
// «Cannot read properties of undefined (reading 'auto')». Hasta que los datos estan, no hay
// nada que dimensionar: render() y renderBom() esperan, e initApp pinta al llegar.
let datosListos = false;
// SPEC parte B (2026-09-13): el frente DATOS añade `sse` ({sku:'R8M36AAE', precio:null,
// nota}) y `microbranch` ({usuarios:10, caudalMbps:50}) a la respuesta del API. Se leen
// DINÁMICAMENTE y se tolera su ausencia con fallback — la página no debe romper antes del
// merge de DATOS: SSE null (la línea entra en «consultar» con el SKU documentado en el
// contrato) y umbrales Microbranch 10 usuarios / 50 Mbps.
let SSE = null;
let MICROBRANCH = { usuarios: 10, caudalMbps: 50 };
// DTD (pendiente #31, 2026-09-14): escalera PLANA por appliance de la lista vigente
// (PLC GA, vigencia 2026-06-01) — modalidad × término, sin tiers de caudal. Se lee
// DINÁMICAMENTE y se tolera su ausencia con fallback «consultar», como SSE.
let DTD = null;

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
  // Lista clicable de candidatos (petición directa del dueño, 2026-09-15): «solo se
  // muestra 1 equipo recomendado pero hay varios que cumplen y el usuario no tiene cómo
  // seleccionar otro». Opt-in de ficha.js — el resto de dimensionadores se pinta igual.
  listaCandidatos:true,
  // Panel fijo + foto oficial del equipo (petición directa del dueño, 2026-09-16): la
  // tarjeta «Equipos que cumplen» se queda clavada SIN scroll interno —por eso el
  // las características se despliegan DENTRO de la propia tarjeta con el conmutador
  // «Ver características del equipo ↓» (petición directa del dueño, 2026-09-16: en el
  // mismo cuadro que recomienda el equipo, sin otra página) — y la corona la foto del
  // modelo elegido, con vistas frontal/trasera cuando el documento de origen publica
  // ambas. `vistas` se rellena en initApp desde /data/aruba-vistas-equipos.json (mapa
  // id→foto con procedencia y tamaño). Ambos son opt-ins de ficha.js: los demás
  // dimensionadores no los declaran y no cambian.
  panelFijo:true, detalleExpandible:true, vistas:null,
  refsNota:'Las referencias de pedido de este equipo —y de todo el catálogo de Aruba: hardware, remanufacturados, suscripciones EdgeConnect, Boost, Central y licencias perpetuas— están integradas en la lista de materiales. Allí se añaden y se quitan con su SKU y su List Price.'};

// El modelo viaja en la URL como parte del escenario compartible, pero ESTADO reescribe el
// querystring al vincular —cuando el desplegable aun no tiene opciones y no puede
// reponerlo— y el parametro se pierde. Se captura aqui, al cargar el script (antes de que
// ESTADO corra en DOMContentLoaded), y se reaplica en initApp con el catalogo ya puesto.
const QMODEL_URL=new URLSearchParams(location.search).get('pickModel');
// Mismo motivo, mismo patrón: ?ficha=abierta (deep-link de las características,
// 2026-09-16) se captura al cargar el script y se reaplica tras el primer render.
const FICHA_ABIERTA_URL=new URLSearchParams(location.search).get('ficha')==='abierta';

const $=id=>document.getElementById(id);
// Campos del escenario: la misma lista que persiste ESTADO y que capturan los perfiles
// multi-sede para poder restaurar un escenario guardado.
// ESTADO V2 (SPEC parte B, 2026-09-13): los inputs WAN estáticos (bw/unit/mplsType/bwMpls/
// inetType/bwInet) salen del flujo y los sustituye el Multi-Underlay Builder — los enlaces
// viajan serializados como JSON {v:2, wanLinks:[...]} en el input oculto #wanLinksData.
// La migración v1→v2 de enlaces antiguos vive en migrarEstadoV1().
const CAMPOS_ESCENARIO=['wanLinksData','users','aps','perUser','head','fecMode','selTrafico','boostProfile','perfilEntorno','chkBoost','chkSeg','chkTopo','chkAiops','chkHa','chkDualPsu','famSeg','segSeg','destSeg','soSeg','pickModel','personaSeg','selSeguridad','selTier','chkBreakout','selDescuento','dtoCustom',
  // Contexto MSP del escenario (etapa A / #39, 2026-09-14): viajan en la URL y en los
  // perfiles multi-sede como un campo más, y encabezan la lista de materiales y el Excel.
  'nombreCliente','refProyecto',
  // Ópticas elegidas en #sfpChooser (2026-09-15): JSON {medio: sku} en el oculto
  // #sfpPickData — viaja en la URL y en los perfiles como un campo más.
  'sfpPickData',
  // Líneas retiradas de la lista de materiales (BOM editable, petición del dueño
  // 2026-09-15): JSON de claves en el oculto #bomOmitidas. La clave la define
  // BOM.claveFila (con el SKU si lo hay, o categoría|descripción). Viaja en la URL:
  // quien abre el enlace ve la misma lista, con las mismas líneas retiradas.
  // OJO: nada de literales entrecomillados en este comentario — catalogo-check extrae
  // los ids del array con una expresión sobre comillas y los tomaría por campos.
  'bomOmitidas',
  // Cantidades ajustadas a mano (mejora aprobada por el dueño, 2026-09-16): JSON
  // clave → cantidad en el oculto #bomAjustes, con la misma convención de clave que
  // las retiradas. También viaja en la URL y en los perfiles multi-sede.
  // OJO: misma trampa que arriba — nada de literales entrecomillados aquí.
  'bomAjustes'];
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
let famMode='any', segMode='branch', destMode='hibrido', lastPick=null;
// Arquetipo de sede y estrategia de seguridad como variables de estado del dimensionador
// — restringen el catalogo y alimentan el BOM. La estrategia pasa a ser un <select>
// (#selSeguridad, SPEC parte B) con valores none/dtd/sse.
let personaMode='auto', secMode='none';
// Sistema operativo de los gateways (C2/C3 de la auditoria 2026-09-17): AOS 10 por
// defecto — la arquitectura que gestiona Central y la que usa este catalogo. Cambia las
// cifras de APs, clientes y licencia de capacidad (ver aplicarSo).
let soMode='aos10';
// Hint del selector y nombre legible de cada SO (lo usan la ficha, el BOM y el veredicto).
const SO_HINT={
  aos10:'<b>AOS 10</b>: gateways gestionados por HPE Aruba Networking Central. Serie 9000 hasta 128 APs (9004) / 256 (9012); 9240 Base 4.000 APs y 32.000 clientes, con licencias Silver/Gold AOS 10 (R8R41AAE/R8R42AAE). Las series 7000/7200 no se dimensionan aquí: sus cifras son de AOS 8. Solo afecta a los gateways; EdgeConnect corre ECOS.',
  aos8:'<b>AOS 8</b>: Mobility Conductor / controladoras. Serie 9000 hasta 32 APs; 9240 Base 512 APs y 16.000 clientes, con licencias Silver/Gold AOS 8 (R8R13AAE/R8R14AAE, sin List Price en la lista: van en «consultar»). El 9114 no corre AOS 8; el 9106 sí, con 256 APs y 8.000 clientes (QuickSpecs 9100, tabla AOS-8). Solo afecta a los gateways; EdgeConnect corre ECOS.',
};
const SO_NOMBRE={aos10:'AOS 10 (Central)', aos8:'AOS 8 (Mobility Conductor)'};
let bomFilas=[], bomMeta={};

/* ══ M1 · MULTI-UNDERLAY BUILDER (SPEC parte B, 2026-09-13; rediseño carrier-grade de
   la etapa A, 2026-09-14) ══
   Los enlaces WAN del sitio se declaran como filas TARJETA (.wan-fila) con cabecera
   (Enlace N + badge de familia + duplicar/quitar), grid de campos que colapsa en móvil,
   toggle «Simétrico» por enlace, validación inline y sufijo «Mbps» visible. Controles
   data-campo: tipo, medio, down, up y simetrico.
   El array estado.wanLinks = [{id, tipo, medio, down, up, simetrico}] es la fuente del
   motor (caudalTotal, mplsMbps, inetMbps) y de la auditoría de puertos del chasis.
   Compatibilidad hacia atrás: si una fila no declara `simetrico`, se asume por
   comparación down===up (un enlace declarado igual en ambos sentidos ES simétrico). */
const TIPOS_WAN=['MPLS L3','MPLS L2','DIA','Banda Ancha','4G/5G'];
// A7 (2026-09-24): SFP28 25G entra como medio. El catálogo de accesorios ya traía las
// ópticas 25G con su velocidad y su compatibilidad oficial por modelo (EC-10108 según el
// VSG, EC-10150 y 9240): faltaba poder declarar el enlace.
const MEDIOS_WAN=['RJ45','SFP 1G','SFP+ 10G','SFP28 25G'];
let wanSeq=0; // ids únicos de fila dentro de la sesión
// Familia del transporte para el badge de la tarjeta (MPLS / Internet / celular).
function familiaTipoWan(tipo){
  if(/^MPLS/.test(tipo)) return {cls:'mpls', n:'MPLS'};
  if(/^4G\/5G/.test(tipo)) return {cls:'cel', n:'Celular'};
  return {cls:'inet', n:'Internet'};
}
// Medio típico por transporte (regla de preventa declarada, NO fuente oficial): se usa
// SOLO como default inteligente — si el ingeniero tocó el medio a mano, no se impone.
// MPLS y Banda Ancha entran por RJ-45; el DIA de 1 Gbps o más suele entregarse en
// óptica (SFP 1G); el celular 4G/5G entra por RJ-45 (módem integrado o módem externo).
function medioSugerido(tipo, down){
  if(tipo==='DIA'&&down>=1000) return 'SFP 1G';
  return 'RJ45';
}
// Lee las filas del builder tal como están pintadas: es la única fuente de wanLinks,
// así el motor, la serialización y los perfiles ven exactamente lo mismo.
function leerWanLinks(){
  return [...document.querySelectorAll('#wanBuilderFilas .wan-fila')].map(f=>{
    const down=Math.max(0,parseFloat(f.querySelector('[data-campo=down]').value)||0);
    const up=Math.max(0,parseFloat(f.querySelector('[data-campo=up]').value)||0);
    const sim=f.querySelector('[data-campo=simetrico]');
    const med=f.querySelector('[data-campo=medio]');
    const rol=f.querySelector('[data-campo=rol]');
    return {
      id:parseInt(f.dataset.id)||0,
      tipo:f.querySelector('[data-campo=tipo]').value,
      medio:med.value,
      down, up,
      simetrico:sim?!!sim.checked:down===up,
      medioManual:med.dataset.manual==='1',
      // R11/M9 (2026-09-24): activo o respaldo. Un respaldo ocupa puerto y óptica —los
      // lleva el chasis— pero no suma caudal en operación normal (ArubaReglas.escenariosUnderlay).
      rol:rol&&rol.value==='respaldo'?'respaldo':'activo',
    };
  });
}
function wanFilaHtml(l,idx){
  const ops=(lista,v)=>lista.map(x=>`<option value="${esc(x)}"${x===v?' selected':''}>${esc(x)}</option>`).join('');
  const sim=l.simetrico!==false, fam=familiaTipoWan(l.tipo);
  const n=idx==null?'?':idx+1;
  const rol=l.rol==='respaldo'?'respaldo':'activo';
  return `<div class="wan-fila" data-id="${l.id}">`
    +`<div class="wan-cab"><span class="wan-num">Enlace ${n}</span><span class="wan-badge ${fam.cls}" data-wan-badge>${fam.n}</span>`
    +`<span class="wan-acc">`
    +`<button type="button" class="wan-iconbtn" data-wan-duplicar="${l.id}" title="Duplicar este enlace" aria-label="Duplicar este enlace">⧉</button>`
    +`<button type="button" class="wan-iconbtn" data-wan-quitar="${l.id}" title="Quitar este enlace" aria-label="Quitar este enlace">&times;</button>`
    +`</span></div>`
    +`<div class="wan-grid">`
    +`<div class="wan-campo"><label>Transporte</label><select data-campo="tipo" aria-label="Tipo de transporte WAN del enlace ${n}">${ops(TIPOS_WAN,l.tipo)}</select></div>`
    +`<div class="wan-campo"><label>Medio del puerto</label><select data-campo="medio" aria-label="Medio del puerto del enlace ${n}"${l.medioManual?' data-manual="1"':''}>${ops(MEDIOS_WAN,l.medio)}</select></div>`
    +`<div class="wan-campo"><label>Bajada</label><span class="wan-bw"><input type="number" data-campo="down" min="0" step="any" placeholder="100" value="${l.down||''}" aria-label="Caudal de bajada en Mbps del enlace ${n}" autocomplete="off"><span class="wan-sufijo">Mbps</span></span></div>`
    +`<div class="wan-campo"><label>Subida</label><span class="wan-bw"><input type="number" data-campo="up" min="0" step="any" placeholder="100" value="${(sim?l.down:l.up)||''}" aria-label="Caudal de subida en Mbps del enlace ${n}" autocomplete="off"${sim?' disabled':''}><span class="wan-sufijo">Mbps</span></span></div>`
    +`<div class="wan-campo"><label>Rol</label><select data-campo="rol" aria-label="Rol del enlace ${n}">`
    +`<option value="activo"${rol==='activo'?' selected':''}>Activo</option>`
    +`<option value="respaldo"${rol==='respaldo'?' selected':''}>Respaldo (entra si cae otro)</option></select></div>`
    +`<label class="wan-sim"><input type="checkbox" data-campo="simetrico"${sim?' checked':''} aria-label="Enlace simétrico: la subida sigue a la bajada"> Simétrico</label>`
    +`</div>`
    +`<p class="wan-msg" data-wan-msg hidden></p>`
    +`</div>`;
}
function pintarWanFilas(links){
  $('wanBuilderFilas').innerHTML=links.map(wanFilaHtml).join('');
  validarWanFilas();
}
// Serialización v2: el escenario viaja en la URL como JSON {v:2, wanLinks:[...]} dentro
// del input oculto #wanLinksData (que ESTADO persiste como un campo más). El evento
// input despierta el volcado de ESTADO para que el enlace compartible se actualice solo.
function sincronizarWanHidden(){
  const h=$('wanLinksData');
  // Solo viajan los campos del contrato v2: `medioManual` es detalle de UI que la
  // restauración deduce sola (medio ≠ sugerido ⇒ elegido a mano) — no ensucia la URL.
  // El rol solo viaja cuando es «respaldo»: así un enlace compartido antes de que existiera
  // (y cualquier sitio sin respaldos) sigue produciendo exactamente la misma URL.
  const links=leerWanLinks().map(l=>Object.assign({id:l.id, tipo:l.tipo, medio:l.medio, down:l.down, up:l.up, simetrico:l.simetrico},
    l.rol==='respaldo'?{rol:'respaldo'}:{}));
  h.value=JSON.stringify({v:2, wanLinks:links});
  h.dispatchEvent(new Event('input',{bubbles:true}));
}
// Reconstruye las filas desde el input oculto (restauración de enlace o de perfil).
// Tolerante con JSON roto o v1: cae a una fila DIA vacía en vez de romper la página.
function reconstruirWanDesdeHidden(){
  let links=null;
  try{
    const d=JSON.parse($('wanLinksData').value||'null');
    if(d&&Array.isArray(d.wanLinks)&&d.wanLinks.length) links=d.wanLinks;
  }catch{ links=null; }
  if(!links) links=[{id:++wanSeq, tipo:'DIA', medio:'RJ45', down:0, up:0}];
  links.forEach(l=>{
    if(!l.id) l.id=++wanSeq; wanSeq=Math.max(wanSeq,l.id);
    // Compatibilidad v2 temprana: si el estado no declara `simetrico`, se asume por
    // comparación down===up. Y si el medio no es el típico de su transporte, se marca
    // como elegido a mano para que la sugerencia por tipo no lo pise después.
    if(l.simetrico==null) l.simetrico=l.down===l.up;
    l.medioManual=!!l.medio&&l.medio!==medioSugerido(l.tipo,l.down||0);
  });
  pintarWanFilas(links);
}
// Validación inline de la tarjeta: NO bloquea el cálculo — pinta borde rojo (error:
// sin bajada el enlace no cuenta en el agregado) o aviso ámbar (sospechoso pero
// posible: subida mayor que bajada, o fibra en un enlace celular) con mensaje corto.
function validarWanFila(f){
  const downEl=f.querySelector('[data-campo=down]');
  const down=parseFloat(downEl.value), up=parseFloat(f.querySelector('[data-campo=up]').value);
  const tipo=f.querySelector('[data-campo=tipo]').value, medio=f.querySelector('[data-campo=medio]').value;
  const msg=f.querySelector('[data-wan-msg]');
  const downMalo=!(down>0);
  downEl.classList.toggle('wan-invalido',downMalo);
  downEl.setAttribute('aria-invalid',downMalo?'true':'false');
  const rolEl=f.querySelector('[data-campo=rol]');
  const respaldo=!!rolEl&&rolEl.value==='respaldo';
  // Un respaldo sin ningún activo no lleva tráfico nunca: el sitio se queda sin caudal de
  // operación normal y la página pide valores. Se dice en la fila, que es donde se arregla.
  const hayActivo=[...document.querySelectorAll('#wanBuilderFilas [data-campo=rol]')].some(s=>s.value!=='respaldo');
  let txt='', cls='';
  if(downMalo){ txt='Declara el caudal de bajada (Mbps): sin él, este enlace no cuenta en el agregado del sitio.'; cls='err'; }
  else if(respaldo&&!hayActivo){ txt='Ningún enlace está marcado como activo: un respaldo solo lleva tráfico cuando cae un activo. Marca al menos uno como activo.'; cls='warn'; }
  else if(up>down){ txt='Bajada < subida declarada: verifica el contrato (hay enlaces asíncronos al revés, pero es raro).'; cls='warn'; }
  else if(/^SFP/.test(medio)&&/^4G\/5G/.test(tipo)){ txt='Un enlace celular 4G/5G no va por fibra: el medio típico es RJ-45 (módem integrado o externo). Revisa el medio declarado.'; cls='warn'; }
  else if(respaldo){ txt='Respaldo: no suma al caudal ni al tier de la suscripción en operación normal; entra, hasta su caudal, si cae un enlace activo. Ocupa su puerto igual que los demás.'; }
  msg.hidden=!txt; msg.textContent=txt; msg.className='wan-msg'+(cls?' '+cls:'');
}
function validarWanFilas(){ document.querySelectorAll('#wanBuilderFilas .wan-fila').forEach(validarWanFila); }
// Barra agregada viva bajo el builder (#wanResumen, etapa A): Σ de caudales, desglose
// por familia, puertos WAN ocupados y semáforo de densidad contra el modelo
// seleccionado. La regla del semáforo NO se duplica aquí: es evaluarPuertos(), la
// misma que gobierna el descarte/escalado del EC-10104 y el aviso de ópticas.
function pintarWanResumen(){
  const box=$('wanResumen'); if(!box) return;
  const links=leerWanLinks();
  if(!links.length){ box.hidden=true; box.innerHTML=''; return; }
  // El Σ es el de la operación normal (solo activos): es el que dimensiona y tasa el tier.
  // Los respaldos se cuentan aparte, porque ocupan puerto aunque no sumen caudal.
  const operan=links.filter(l=>l.rol!=='respaldo');
  const resp=links.filter(l=>l.rol==='respaldo'&&(l.down>0||l.up>0));
  const sumD=operan.reduce((s,l)=>s+l.down,0), sumU=operan.reduce((s,l)=>s+l.up,0);
  const act=links.filter(l=>l.down>0||l.up>0);
  let html=`<span>Σ <b>${sumD} Mbps ↓</b> / <b>${sumU} Mbps ↑</b></span><span class="wan-res-sep">·</span>`;
  if(resp.length) html+=`<span>${resp.length} de respaldo (<b>${resp.reduce((s,l)=>s+l.down,0)} Mbps</b>), fuera de la operación normal</span><span class="wan-res-sep">·</span>`;
  if(act.length){
    const nM=act.filter(l=>/^MPLS/.test(l.tipo)).length;
    const nC=act.filter(l=>/^4G\/5G/.test(l.tipo)).length;
    const nI=act.length-nM-nC;
    const fam=[];
    if(nM) fam.push(`${nM} MPLS`);
    if(nI) fam.push(`${nI} Internet`);
    if(nC) fam.push(`${nC} celular`);
    html+=`<span>${act.length} enlace${act.length===1?'':'s'} (${fam.join(', ')})</span><span class="wan-res-sep">·</span>`
      +`<span>Puertos WAN: ${act.length} (+2 LAN) = ${act.length+2}</span>`;
    const m=typeof modeloActual==='function'&&MODELS.length?modeloActual():null;
    if(m){
      const ev=evaluarPuertos(m,links);
      const etq={verde:`cabe en ${m.id}`, ambar:`aviso de densidad en ${m.id}`, rojo:`no cabe en ${m.id}`}[ev.nivel];
      html+=` <span class="wan-sem ${ev.nivel}" title="${esc(ev.motivo||'La densidad de puertos del escenario entra en el chasis')}"><i></i>${etq}</span>`;
    }
  }else{
    html+='<span>sin enlaces activos — declara el caudal de cada fila</span>';
  }
  box.innerHTML=html;
  box.hidden=false;
}
// Los parámetros del escenario ANTERIOR al Multi-Underlay Builder. Viven en una sola
// constante porque los usan dos cosas distintas: `migrarEstadoV1()` para convertirlos, y
// `ESTADO.vincular({migrados})` para NO denunciarlos como parámetros que esta pantalla no
// entiende. Dos listas iguales en dos sitios es como se desincronizan — el mismo error que
// `llevarABom` tuvo en seis copias.
const PARAMS_V1=['bw','unit','mplsType','bwMpls','inetType','bwInet'];
// Migración v1→v2 (SPEC B.1): un enlace antiguo (?bw=…&mplsType=…&bwMpls=…&inetType=…&
// bwInet=…) se convierte en 1-2 filas equivalentes del builder y se avisa por consola.
// Devuelve true si migró algo.
function migrarEstadoV1(){
  const p=new URLSearchParams(location.search);
  if(p.has('wanLinksData')) return false; // ya es v2
  if(!PARAMS_V1.some(k=>p.has(k))) return false;
  const links=[];
  const bwM=parseFloat(p.get('bwMpls'))||0, bwI=parseFloat(p.get('bwInet'))||0;
  const mplsT=p.get('mplsType')||'none', inetT=p.get('inetType')||'none';
  if(mplsT!=='none'&&bwM>0) links.push({id:++wanSeq, tipo:mplsT==='l2'?'MPLS L2':'MPLS L3', medio:'RJ45', down:bwM, up:bwM});
  if(inetT!=='none'&&bwI>0) links.push({id:++wanSeq, tipo:inetT==='bb'?'Banda Ancha':inetT==='lte'?'4G/5G':'DIA', medio:inetT==='lte'?'RJ45':'RJ45', down:bwI, up:bwI});
  // El antiguo «ancho de banda de aplicación» (bw) sin enlaces declarados se conserva
  // como un acceso DIA del mismo caudal: es la lectura más fiel del escenario v1.
  if(!links.length){
    const bw=(parseFloat(p.get('bw'))||0)*(parseFloat(p.get('unit'))||1);
    if(bw>0) links.push({id:++wanSeq, tipo:'DIA', medio:'RJ45', down:bw, up:bw});
  }
  if(!links.length) return false;
  console.warn('[dimensionador-aruba] Migración de estado v1→v2: los parámetros WAN estáticos'
    +' (bw/mplsType/bwMpls/inetType/bwInet) se convirtieron en', links.length,
    'fila(s) del Multi-Underlay Builder.', links);
  $('wanLinksData').value=JSON.stringify({v:2, wanLinks:links});
  return true;
}
$('btnAddWan').addEventListener('click',()=>{
  const links=leerWanLinks();
  links.push({id:++wanSeq, tipo:'DIA', medio:'RJ45', down:0, up:0, simetrico:true});
  pintarWanFilas(links);
  sincronizarWanHidden();
  render();
});
// Delegación: cualquier cambio en una fila (tipo, medio, down, up, simetrico) se aplica
// SOBRE LA PROPIA TARJETA (sin repintarla — se conserva el foco), valida en línea,
// reserializa el estado v2 y repinta el resto de la página.
$('wanBuilder').addEventListener('input',e=>{
  const t=e.target;
  if(!t.dataset||!t.dataset.campo) return;
  const fila=t.closest('.wan-fila');
  // Toggle «Simétrico»: la subida sigue a la bajada y queda deshabilitada; al soltarlo,
  // la subida vuelve a ser editable con el último valor heredado.
  if(t.dataset.campo==='simetrico'&&fila){
    const upEl=fila.querySelector('[data-campo=up]');
    upEl.disabled=t.checked;
    if(t.checked) upEl.value=fila.querySelector('[data-campo=down]').value;
  }
  // Con el enlace simétrico, la bajada arrastra el valor de la subida.
  if(t.dataset.campo==='down'&&fila&&fila.querySelector('[data-campo=simetrico]').checked){
    fila.querySelector('[data-campo=up]').value=t.value;
  }
  // El medio elegido a mano queda marcado: las sugerencias por tipo ya no lo tocan.
  if(t.dataset.campo==='medio') t.dataset.manual='1';
  // Cambio de transporte: badge de familia al momento + medio típico como default
  // inteligente SOLO si nadie eligió el medio a mano (no se impone).
  if(t.dataset.campo==='tipo'&&fila){
    const badge=fila.querySelector('[data-wan-badge]');
    const fam=familiaTipoWan(t.value);
    badge.className='wan-badge '+fam.cls; badge.textContent=fam.n;
    const med=fila.querySelector('[data-campo=medio]');
    if(med.dataset.manual!=='1') med.value=medioSugerido(t.value,parseFloat(fila.querySelector('[data-campo=down]').value)||0);
  }
  // Cambiar el rol de una fila cambia si las DEMÁS tienen un activo al que respaldar: se
  // revalidan todas. El resto de cambios solo tocan su propia tarjeta.
  if(t.dataset.campo==='rol') validarWanFilas();
  else if(fila) validarWanFila(fila);
  sincronizarWanHidden();
  render();
});
$('wanBuilder').addEventListener('click',e=>{
  // Duplicar (etapa A): copia exacta de la fila con id nuevo, insertada a continuación.
  const dup=e.target.closest('[data-wan-duplicar]');
  if(dup){
    const links=leerWanLinks();
    const i=links.findIndex(l=>l.id===parseInt(dup.dataset.wanDuplicar));
    if(i>=0) links.splice(i+1,0,{...links[i], id:++wanSeq});
    pintarWanFilas(links);
    sincronizarWanHidden();
    render();
    return;
  }
  const b=e.target.closest('[data-wan-quitar]');
  if(!b) return;
  let links=leerWanLinks().filter(l=>l.id!==parseInt(b.dataset.wanQuitar));
  // La última fila no se quita: se queda vacía.
  if(!links.length) links=[{id:++wanSeq, tipo:'DIA', medio:'RJ45', down:0, up:0, simetrico:true}];
  pintarWanFilas(links);
  sincronizarWanHidden();
  render();
});

// «Copiar enlace del escenario» (etapa A / pendiente #39, 2026-09-14): la URL ya lleva
// el estado v2 serializado (ESTADO se vuelca en cada input) — el botón la copia entera
// al portapapeles con fallback para contextos no seguros y confirma con un texto vivo.
$('btnCopiarEscenario').addEventListener('click',async()=>{
  const msg=$('copiadoMsg');
  try{
    await navigator.clipboard.writeText(location.href);
    msg.textContent='Enlace copiado';
  }catch{
    // Fallback sin contexto seguro (http local, permisos denegados): textarea temporal.
    const t=document.createElement('textarea');
    t.value=location.href;
    document.body.appendChild(t);
    t.select();
    try{ document.execCommand('copy'); msg.textContent='Enlace copiado'; }
    catch{ msg.textContent='No se pudo copiar: usa la barra de direcciones'; }
    t.remove();
  }
  setTimeout(()=>{ msg.textContent=''; },2500);
});

// «Limpiar escenario» (petición del dueño, 2026-09-15): para dimensionar otro equipo
// desde cero. El estado vive SOLO en la URL (estado v2 — no se guarda entre sesiones),
// así que limpiar es volver a la URL desnuda y recargar: cada campo cae a su defecto.
// Pide confirmación porque borra TODO lo declarado, incluida la lista de materiales.
$('btnLimpiarEscenario').addEventListener('click',()=>{
  if(!window.confirm('¿Limpiar el escenario completo? Se pierden los enlaces WAN, las opciones y la lista de materiales actuales y se vuelve a los valores por defecto.')) return;
  history.replaceState(null,'',location.pathname);
  location.reload();
});

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
// Estrategia de seguridad (selector #selSeguridad, SPEC parte B): SSE = inspeccion en la
// nube (suscripcion por usuario); DTD = IDS/IPS en el propio chasis EdgeConnect, con un
// sobrecoste de proceso que el dimensionador descuenta de la capacidad.
// DTD NO fuerza Advanced: es licencia opcional APARTE de Foundation y Advanced
// (QuickSpecs p.32) — no alimenta la deducción de nivel de nivelAutoEC().
const SEC_HINT={
  none:'El NGFW y la clasificación de aplicaciones (AppRF, ~3.500 apps) ya van en Foundation. Activa una estrategia solo si el diseño exige IDS/IPS o inspección en la nube.',
  sse:'HPE Aruba Networking SSE (ex-Axis): ZTNA, SWG, CASB y DEM en suscripción POR USUARIO — paquetes oficiales Foundation ZTNA / Foundation SWG / Foundation Plus / Advanced / Advanced Plus (QuickSpecs SSE a50009212enw). EdgeConnect monta los túneles IPsec orquestados y AppExpress elige el mejor PoP. Entra en la lista como «consultar»: HPE no publica List Price de SSE.',
  gwsec:'IDS/IPS, antimalware y panel de seguridad EN el gateway SD-Branch: la suscripción de Central pasa a su nivel «+ Security» (Foundation o Advanced), que HPE publica para las series 9000, 9100 y 9200 — no para 7000/7200 ni para EdgeConnect, donde la vía es Dynamic Threat Defense. El gateway se dimensiona contra su throughput de IDS/IPS oficial (VSG SD-Branch, sep-2026: 9004/9012 1,1 Gbps, 9106 2,5, 9114 4 y 9240 6 Gbps), no contra el de firewall; el 9004-LTE no publica esa cifra y se aparta. Los SKU son los oficiales de cada serie; su precio se confirma con el distribuidor (la lista cargada no los trae).',
  dtd:'Dynamic Threat Defense: IDS/IPS, DDoS adaptativo y clasificación web EN el chasis EdgeConnect — licencia opcional aparte de Foundation/Advanced (QuickSpecs p.32), con SKU y List Price en la lista vigente (escalera plana por appliance, 2026-06-01): se cotiza por appliance y término. Regla de dimensionado del arquitecto (SIN FUENTE oficial): reserva un 35 % adicional de capacidad de proceso para la inspección. No corre en EC-XS (doc oficial) y exige familia EdgeConnect.',
};
// Factor IMIX (brief del duenyo 2026-09-13, SIN FUENTE oficial): el throughput nominal de
// datasheet se mide en laboratorio (UDP de paquete grande); con mezcla real de Internet
// (IMIX) la capacidad efectiva baja. La investigacion web de 2026-09-13 no encontro delta
// oficial HPE (referencias de industria: ~40 % en Cisco Cat 8500; HPE solo publica cifras
// IDS/IPS ya medidas con iMix) — se adopta el 70 % como regla de trabajo declarada del
// duenyo. El filtro de candidatos compara el requerimiento contra la capacidad ya
// degradada, asi la holgura va dentro del modelo.
const IMIX_FACTOR=0.70;

/* ══ ÓPTICAS Y ACCESORIOS (fase 12, 2026-09-13) ══
   Catálogo MAESTRO del dueño (ARUBA_ACCESSORY_CATALOG + ACCESSORY_COMPAT en aruba.js),
   servido por la proyección del dimensionador — la página ya no mantiene precios ni
   matriz propios. La compatibilidad sigue anclada al VSG oficial (1G solo EC-10106;
   10G/DAC en 10106/10108/10150; EC-10104 sin SFP; 9240 = 4x SFP28) y a lo declarado en
   el brief (25G → EC-10150/9240; NVMe Boost → S2N67A; PSU 9240 → R1C72A; racks 9004/
   9012). Sustituye a los precios provisionales de partner de la fase 11 (E3). */
let ACCESSORY_CATALOG={}, ACCESSORY_COMPAT={};
// Selección viva del modal: sku → cantidad. Se depura al cambiar de modelo para no
// cotizar una óptica incompatible con el equipo elegido.
let accesoriosElegidos={};
/* ══ ÓPTICAS SFP DE LOS ENLACES WAN (petición directa del dueño, 2026-09-15) ══
   Cada enlace declarado con medio «SFP 1G» o «SFP+ 10G» necesita UNA óptica en el
   extremo local (× unidades del sitio — en HA 1+1 son dos appliances). Reglas:
   · Candidatas = ACCESSORY_COMPAT[modelo].items ∩ catálogo maestro con la velocidad
     del medio, EXCLUYENDO: DAC (interconexión corta de sala, no underlay WAN), TAA
     (se ofertan desde el toggle de Cumplimiento Especial de la pestaña BOM, no aquí)
     y PLC «ES» (fin de venta nunca se oferta).
   · 0 candidatas → aviso (el modelo no admite ese medio). 1 → auto-seleccionada.
   · >1 → mensaje + select SIN opción por defecto: es el usuario quien elige el tipo
     (alcance y medio) — cotizar una óptica por él sería apostar el pedido.
   · La elección viaja en el escenario compartible (#sfpPickData, JSON {medio: sku}),
     un campo oculto más como #wanLinksData, y el BOM la cotiza (o declara la
     «PENDIENTE DE SELECCIÓN» sin precio — jamás una óptica inventada).
   · RJ45 no necesita óptica: el puerto cobre es nativo. */
const MEDIOS_OPTICA={'SFP 1G':'1G','SFP+ 10G':'10G','SFP28 25G':'25G'};
// Ópticas compatibles con un modelo a una velocidad dada: el filtro vive UNA vez aquí
// (lo comparten los enlaces WAN y la interconexión EdgeHA, pendiente #7 del dueño).
function opticasPorVelocidad(modeloId, speed){
  if(!speed||!modeloId) return [];
  const cfg=ACCESSORY_COMPAT[modeloId]; if(!cfg) return [];
  return cfg.items.map(sku=>({sku, a:ACCESSORY_CATALOG[sku]}))
    .filter(x=>x.a&&x.a.speed===speed&&x.a.media!=='DAC'&&!/_TAA$/.test(x.a.media||'')&&x.a.plc!=='ES');
}
// A7 (2026-09-24): «no admite ópticas» era falso en dos de los tres casos en que salía. Un
// chasis sin jaulas SFP no admite ninguna; pero el 9106 SÍ tiene jaulas y lo que falta es que
// la lista oficial le asigne ópticas, y en el EC-10108/10150 el 1G está en conflicto documental
// (pendiente 24). Son tres respuestas distintas que mandan a sitios distintos.
function motivoSinOptica(m, medio){
  if(sinJaulasSfp(m)) return `El ${m.id} no tiene jaulas SFP según su ficha (${m.ifaces}): el enlace ${medio} no cabe — cambia el medio a RJ-45 o el modelo.`;
  const nota=((ACCESSORY_COMPAT||{})[m.id]||{}).nota||'';
  if(medio==='SFP 1G'&&/1G.*conflicto documental/i.test(nota))
    return `1G en el ${m.id} está en conflicto documental oficial (el VSG dice que no; el Hardware Reference, que sí con restricciones): no se oferta hasta que HPE o el distribuidor lo desempate. Declara ese enlace en 10G o en RJ-45.`;
  return `El catálogo no trae ninguna óptica ${medio} compatible con el ${m.id} en la lista oficial: la línea no se cotiza. Confírmala con el distribuidor antes de emitir la propuesta.`;
}
function opticasPara(modeloId, medio){
  return opticasPorVelocidad(modeloId, MEDIOS_OPTICA[medio]);
}
// Enlaces activos (con caudal) que necesitan óptica, agrupados por medio: {medio: n}.
function necesidadesOptica(links){
  const n={};
  (links||[]).filter(l=>l.down>0||l.up>0).forEach(l=>{ if(MEDIOS_OPTICA[l.medio]) n[l.medio]=(n[l.medio]||0)+1; });
  return n;
}

/* ══ INTERCONEXIÓN EdgeHA (pendiente #7 del dueño, 2026-09-17 — mejora propuesta y
   aprobada: «línea declarada en la lista de materiales, sin precio inventado») ══
   El enlace directo entre los dos chasis del par —por él viajan los túneles de cada
   underlay hacia ambos appliances (VSG SD-Branch, fig. «EC HA»)— necesita UN PUERTO
   POR CHASIS. Si queda cobre libre basta un latiguillo (no se cotiza desde el
   catálogo); si no, son 2 ópticas. Tres cosas se comparten entre el asistente de
   cableado de la ficha, el chooser y el BOM: el PREDICADO (parEdgeHA), la VELOCIDAD
   recomendada (velocidadEdgeHA) y la clave de la elección (sfpPickData['EdgeHA']). */
// El predicado, una sola vez: EdgeConnect, par HA marcado y ≥2 enlaces WAN activos.
// Devuelve los enlaces activos (ya filtrados) o null — así el llamador no repite el
// filtro ni arriesga una condición distinta en cada sitio.
function parEdgeHA(esEC, unidades, links){
  const act=(links||[]).filter(l=>l.down>0||l.up>0);
  return (esEC&&unidades===2&&act.length>=2)?act:null;
}
// Velocidad de las ópticas del catálogo, en Mbps por dirección (full-duplex).
const VELOCIDAD_OPTICA={'1G':1000,'10G':10000,'25G':25000};
// Regla de ingeniería de la casa (2026-09-17, DECLARADA — el VSG no fija la velocidad
// del enlace EdgeHA): por la interconexión cruza el tráfico de los underlays que NO
// aterrizan en el chasis activo, así que dimensionarla al AGREGADO WAN del sitio deja
// la asignación de enlaces a chasis libre y el failover sin cuello de botella. Se
// recomienda la MENOR velocidad de óptica compatible con el modelo que cubre ese
// agregado; null si ninguna la cubre (o el modelo no tiene jaulas: entonces la salida
// honesta es cobre directo o confirmar con HPE — se declara, no se inventa).
function velocidadEdgeHA(modeloId, agregadoMbps){
  const cfg=ACCESSORY_COMPAT[modeloId]; if(!cfg) return null;
  const speeds=[...new Set(cfg.items.map(s=>ACCESSORY_CATALOG[s]&&ACCESSORY_CATALOG[s].speed).filter(Boolean))];
  const caben=speeds.filter(s=>(VELOCIDAD_OPTICA[s]||0)>=agregadoMbps)
    .sort((a,b)=>VELOCIDAD_OPTICA[a]-VELOCIDAD_OPTICA[b]);
  return caben[0]||null;
}
// Unidades del sitio (petición del dueño, 2026-09-15): SIN campo de cantidad — en
// EdgeConnect un sitio lleva un appliance o un par HA 1+1 (arquitectura oficial), así
// que las unidades se deducen de la casilla HA: marcada → 2, sin marcar → 1.
function unidadesSitio(){ return ($('chkHa')&&$('chkHa').checked)?2:1; }

/* ══ HA PRE-MARCADO POR CAPACIDAD DEL SITIO (regla de preventa del dueño, 2026-09-17) ══
   Regla: ≥2 enlaces WAN activos y TODOS de ≥5 Gbps ⇒ el sitio concentra ≥10 Gbps y un
   chasis único es un punto único de fallo, así que HA 1+1 se pre-marca y se declara
   (#haAutoHint). Es una decisión de negocio del dueño (SIN FUENTE oficial — HPE no
   publica umbrales; el DISEÑO sí es oficial: EdgeHA es la respuesta de sucursal del VSG
   SD-Branch, fig. «EC HA»: cada transporte aterriza en un chasis del par y el enlace
   EdgeHA lleva los túneles de cada underlay a ambos, sin switches WAN).
   OJO — lo que la regla NO hace: dividir el dimensionado entre los dos chasis. El VRRP
   manda todo el tráfico al activo y el standby solo toma el relevo en fallo («traffic
   is sent there only during an outage», VSG — por eso ECMP hay que evitarlo), así que
   cada chasis del par se dimensiona al AGREGADO completo. HA suma disponibilidad, no
   caudal.
   El auto-marcado es DE FLANCO: se aplica al entrar en la regla, no en cada repintado,
   para no pelear con quien la desmarca a mano (queda registrado en data-ha-manual y la
   revisión del diseño lo declara como aviso). Al salir de la regla se limpia todo. */
const HA_AUTO_MBPS=5000;
let haAutoVigente=false; // la regla se evalúa en cada render; true mientras aplique
// ¿Se cumple la regla del dueño sobre estos enlaces? (También la usa estadoDerivado
// para que la revisión del diseño la vea como dato, no como DOM.)
function reglaHaActiva(wanLinks){
  const enlaces=(wanLinks||[]).filter(l=>l.down>0||l.up>0);
  return enlaces.length>=2&&enlaces.every(l=>l.down>=HA_AUTO_MBPS);
}
function sincronizarHaAuto(){
  const chk=$('chkHa'); if(!chk) return;
  const aplica=reglaHaActiva(leerWanLinks().filter(l=>l.rol!=='respaldo'));
  if(aplica){
    if(!haAutoVigente){
      haAutoVigente=true;
      if(!chk.checked&&chk.dataset.haManual!=='1') chk.checked=true;
    }
  }else{
    haAutoVigente=false;
    delete chk.dataset.haManual; // fuera de la regla, la próxima entrada auto-marca de nuevo
  }
  const hint=$('haAutoHint');
  if(hint) hint.hidden=!(aplica&&chk.checked);
}
function leerSfpPick(){ try{ return JSON.parse(($('sfpPickData')||{}).value||'{}')||{}; }catch{ return {}; } }
// Escribir el value de un oculto NO dispara «input» y ESTADO volcaría sin verlo: hay
// que emitirlo a mano o la elección no viajaría al enlace hasta el próximo tecleo.
function escribirSfpPick(p){ const n=$('sfpPickData'); if(!n) return; n.value=JSON.stringify(p); n.dispatchEvent(new Event('input',{bubbles:true})); }

/* ══ BOM EDITABLE: LÍNEAS RETIRADAS (petición del dueño, 2026-09-15) ══
   Cualquier línea de la lista —la calcule el dimensionador o la añada la mano— se puede
   RETIRAR con su botón ✕: no se borra, se mueve a «Líneas retiradas» (restaurable con un
   clic) y sale de totales, Excel y texto. La omisión viaja en la URL (#bomOmitidas).
   Retirar es una decisión de ALCANCE («este sitio no lleva Central») que el motor no
   puede adivinar — por eso la admite y la declara. */
function leerOmitidas(){ try{ const v=JSON.parse(($('bomOmitidas')||{}).value||'[]'); return Array.isArray(v)?v:[]; }catch{ return []; } }
function escribirOmitidas(a){ const n=$('bomOmitidas'); if(!n) return; n.value=JSON.stringify(a); n.dispatchEvent(new Event('input',{bubbles:true})); }

/* ══ BOM EDITABLE: CANTIDADES AJUSTADAS A MANO (mejora propuesta y aprobada por el
   dueño, 2026-09-16) ══
   El complemento de retirar: ajustar la CANTIDAD es una decisión de ingeniería («dos
   enlaces de reserva que el escenario no modela», «una óptica de repuesto en caja»).
   Hasta el 2026-09-15 no se admitía porque el siguiente repintado la pisaría en
   silencio; la solución no es prohibirla sino hacerla parte del estado: la divergencia
   contra la cifra del motor se guarda en #bomAjustes, sobrevive al repintado, viaja en
   el enlace y SE DECLARA en pantalla, texto y Excel con la cifra que el motor calculó.
   Reglas:
   - Ajustar al valor que el motor calcula PODA el ajuste (ya no diverge: no hay nada
     que declarar y la línea vuelve a seguir al escenario).
   - Los ajustes cuya línea no está en el escenario actual se conservan, igual que las
     retiradas: si la línea vuelve (otro modelo que usa el mismo SKU), se re-aplican.
   - Líneas sin cantidad calculada (qty null — la SSE pendiente de usuarios) no llevan
     control: lo que falta ahí es el dato, no una cifra que pisar. */
function leerAjustes(){ try{ const v=JSON.parse(($('bomAjustes')||{}).value||'{}'); return v&&typeof v==='object'&&!Array.isArray(v)?v:{}; }catch{ return {}; } }
function escribirAjustes(a){ const n=$('bomAjustes'); if(!n) return; n.value=JSON.stringify(a); n.dispatchEvent(new Event('input',{bubbles:true})); }
// Devuelve una COPIA de las filas con los ajustes aplicados (las originales conservan la
// cifra del motor) y poda del mapa los que ya no divergen; informa de si podó algo.
function aplicarAjustes(filas, ajustes){
  let podo=false;
  const out=(filas||[]).map(f=>{
    if(typeof f.qty!=='number'||!isFinite(f.qty)) return f;
    const clave=BOM.claveFila(f), a=ajustes[clave];
    if(a==null) return f;
    if(a===f.qty){ delete ajustes[clave]; podo=true; return f; }
    return {...f, qty:a, ajuste:f.qty};
  });
  return {filas:out, podo};
}
// La caja de retiradas se pinta tras la tabla: líneas tachadas con su botón de restaurar.
function pintarRetiradas(filas, omitidas){
  const box=$('bomRetiradas'); if(!box) return;
  const retiradas=(filas||[]).filter(f=>omitidas.has(BOM.claveFila(f)));
  if(!retiradas.length){ box.innerHTML=''; return; }
  box.innerHTML=`<details class="bom-retiradas"><summary>Líneas retiradas de la cotización · ${retiradas.length}</summary>`
    +retiradas.map(f=>`<div class="bom-retirada"><s>${esc(f.desc)}${f.sku?` — <code>${esc(f.sku)}</code>`:''}</s>`
      +`<button type="button" class="bom-restaurar" data-bom-restaurar="${esc(BOM.claveFila(f))}">Restaurar</button></div>`).join('')
    +'</details>';
}
// Óptica resuelta para un medio: la elegida si sigue siendo compatible; la única si no
// hay alternativa; null si hay varias y el usuario aún no elige.
function opticaResuelta(modeloId, medio, pick){
  const ops=opticasPara(modeloId, medio);
  if(!ops.length) return {ops, sku:null};
  if(pick[medio]&&ops.some(o=>o.sku===pick[medio])) return {ops, sku:pick[medio]};
  if(ops.length===1) return {ops, sku:ops[0].sku};
  return {ops, sku:null};
}
function pintarSfpChooser(){
  const box=$('sfpChooser'); if(!box) return;
  const enlaces=leerWanLinks();
  const nec=necesidadesOptica(enlaces);
  const medios=Object.keys(nec);
  const m=typeof modeloActual==='function'&&MODELS.length?modeloActual():null;
  const und=unidadesSitio();
  // Interconexión EdgeHA (pendiente #7): se pinta aunque no haya ópticas WAN que elegir
  // — dos enlaces RJ45 en par HA siguen necesitando el puerto de interconexión.
  const actHA=m?parEdgeHA(m.fam==='ec', und, enlaces):null;
  if(!m||(!medios.length&&!actHA)){ box.hidden=true; box.innerHTML=''; return; }
  const pick=leerSfpPick();
  // EdgeHA (2026-09-17): con el par marcado, cada enlace aterriza en UN chasis — la
  // óptica es 1 por enlace, no 1 por enlace y por unidad (eso es el patrón de hub).
  const esParEdgeHA=m.fam==='ec'&&und===2;
  let dirty=false;
  const filas=medios.map(medio=>{
    const ops=opticasPara(m.id, medio);
    const qty=esParEdgeHA?nec[medio]:nec[medio]*und;
    if(!ops.length)
      return `<div class="sfp-fila"><span class="warn">${esc(motivoSinOptica(m, medio))}</span></div>`;
    // La elección guardada deja de valer si el modelo nuevo no la admite.
    if(pick[medio]&&!ops.some(o=>o.sku===pick[medio])){ delete pick[medio]; dirty=true; }
    if(ops.length===1&&pick[medio]!==ops[0].sku){ pick[medio]=ops[0].sku; dirty=true; }
    const sel=ops.length===1
      ?`<span class="sfp-auto"><code>${ops[0].sku}</code> — ${esc(accEtiquetas(ops[0].a))} · única compatible</span>`
      :`<select data-sfp-medio="${esc(medio)}" aria-label="Óptica para los enlaces ${esc(medio)}">`
        +`<option value="">— Selecciona la óptica…</option>`
        +ops.map(o=>`<option value="${o.sku}"${pick[medio]===o.sku?' selected':''}>${o.sku} — ${esc(accEtiquetas(o.a))} · ${o.a.listPrice!=null?'$'+o.a.listPrice.toLocaleString('en-US'):'consultar'}</option>`).join('')
        +`</select>`;
    const aviso=ops.length>1?`<p class="hint" style="margin:0 0 6px">Hay ${ops.length} ópticas ${esc(medio)} compatibles con ${esc(m.id)} — selecciona el tipo que requiere el enlace (alcance y medio).</p>`:'';
    return `<div class="sfp-fila"><div class="sfp-fila-top"><b>${esc(medio)}</b> × ${qty} — ${nec[medio]} enlace${nec[medio]===1?'':'s'}${esParEdgeHA?' · 1 por enlace — EdgeHA: cada enlace a un chasis del par':und>1?` × ${und} unidades`:''}</div>${aviso}${sel}</div>`;
  });
  // La fila de la interconexión del par: 1 puerto por chasis, velocidad recomendada ≥
  // agregado del sitio (regla declarada de la casa — el VSG no la fija). Misma mecánica
  // que los enlaces WAN: la elección viaja en sfpPickData['EdgeHA'] y el BOM la cotiza.
  if(actHA){
    const agregado=actHA.reduce((s,l)=>s+l.down,0);
    const vel=velocidadEdgeHA(m.id, agregado);
    const ops=vel?opticasPorVelocidad(m.id, vel):[];
    if(!vel||!ops.length){
      filas.push(`<div class="sfp-fila"><div class="sfp-fila-top"><b>Interconexión EdgeHA</b> × 2 — 1 puerto por chasis</div>`
        +`<span class="warn">${vel?`No hay óptica ${esc(vel)} compatible con ${esc(m.id)} en el catálogo`:`El agregado del sitio (${fmt(agregado)}) supera las ópticas del catálogo para ${esc(m.id)}`} — salida honesta: cobre directo si quedan puertos libres, o confirmar la óptica con HPE. Se declara en la lista de materiales, sin SKU inventado.</span></div>`);
    }else{
      if(pick.EdgeHA&&!ops.some(o=>o.sku===pick.EdgeHA)){ delete pick.EdgeHA; dirty=true; }
      if(ops.length===1&&pick.EdgeHA!==ops[0].sku){ pick.EdgeHA=ops[0].sku; dirty=true; }
      const sel=ops.length===1
        ?`<span class="sfp-auto"><code>${ops[0].sku}</code> — ${esc(accEtiquetas(ops[0].a))} · única compatible</span>`
        :`<select data-sfp-medio="EdgeHA" aria-label="Óptica de la interconexión EdgeHA">`
          +`<option value="">— Selecciona la óptica…</option>`
          +ops.map(o=>`<option value="${o.sku}"${pick.EdgeHA===o.sku?' selected':''}>${o.sku} — ${esc(accEtiquetas(o.a))} · ${o.a.listPrice!=null?'$'+o.a.listPrice.toLocaleString('en-US'):'consultar'}</option>`).join('')
          +`</select>`;
      filas.push(`<div class="sfp-fila"><div class="sfp-fila-top"><b>Interconexión EdgeHA</b> × 2 — 1 puerto por chasis · velocidad recomendada <b>${esc(vel)}</b> (≥ agregado del sitio, ${fmt(agregado)})</div>`
        +`<p class="hint" style="margin:0 0 6px">El enlace directo entre los dos chasis lleva los túneles de cada underlay a ambos (VSG SD-Branch, fig. «EC HA»). Si queda un puerto cobre libre en cada chasis, un latiguillo lo resuelve sin ópticas — decisión de despliegue; si se opta por fibra, se cotizan 2.</p>${sel}</div>`);
    }
  }
  if(dirty) escribirSfpPick(pick);
  const cabecera=medios.length?'Ópticas de los enlaces WAN':'Óptica de la interconexión EdgeHA';
  box.innerHTML=`<p class="mono-lbl" style="margin:0 0 8px">${cabecera}</p>`+filas.join('');
  box.hidden=false;
}

function modeloActual(){ return MODELS.find(x=>x.id===$('pickModel').value)||null; }
// Etiquetas técnicas del accesorio: velocidad · medio · alcance, o su categoría
// funcional (módulo, SSD, 2ª PSU, rack, consola). TAA se destaca porque condiciona la
// compra pública (Trade Agreements Act); un PLC «ES» se marca aunque la matriz ya los
// excluye — defensa en profundidad.
function accEtiquetas(a){
  const t=[];
  if(a.speed) t.push(a.speed);
  if(a.media){ t.push(a.media.replace('_TAA','')); if(a.media.endsWith('_TAA')) t.push('TAA'); }
  if(a.reach) t.push(a.reach);
  if(a.category) t.push({MODULE:'módulo',STORAGE:'SSD',PSU:'fuente / adaptador',MOUNT:'rack 19"',KIT:'kit accesorios',FAN:'ventilador',CABLE:'consola'}[a.category]||a.category);
  if(a.plc==='ES') t.push('FIN DE VENTA');
  return t.join(' · ');
}
function pintarAccModal(m){
  const cfg=ACCESSORY_COMPAT[m.id];
  if(!cfg) return;
  $('accModelo').textContent=m.id;
  $('accHint').textContent=cfg.nota;
  $('accLista').innerHTML=cfg.items.map(sku=>{
    const a=ACCESSORY_CATALOG[sku];
    if(!a) return '';
    const qty=accesoriosElegidos[sku]||0;
    return `<div class="acc-fila"><span class="acc-d"><code>${sku}</code> — ${esc(a.name)}`
      +`<span class="sku" style="display:block;margin-top:2px">${esc(accEtiquetas(a))}</span></span>`
      +`<span class="acc-p">${a.listPrice!=null?('$ '+a.listPrice.toLocaleString('en-US')):'consultar'}</span>`
      +`<input type="number" min="0" step="1" value="${qty}" data-acc="${sku}" aria-label="Cantidad ${sku}"></div>`;
  }).join('');
}
$('accBtn').addEventListener('click',()=>{
  const m=modeloActual();
  if(!m||!ACCESSORY_COMPAT[m.id]) return;
  pintarAccModal(m);
  $('accModal').hidden=false;
});
$('accCerrar').addEventListener('click',()=>{ $('accModal').hidden=true; });
$('accModal').addEventListener('click',e=>{ if(e.target===$('accModal')) $('accModal').hidden=true; });
$('accLista').addEventListener('input',e=>{
  const sku=e.target.dataset&&e.target.dataset.acc;
  if(!sku) return;
  const n=Math.max(0,parseInt(e.target.value)||0);
  if(n>0) accesoriosElegidos[sku]=n; else delete accesoriosElegidos[sku];
  renderBom();
});
// SIMULADOR DE PRECIO NETO. El control y sus tramos los construye `BOM.simuladorDescuento`:
// no dependen de ningun dato de fabricante, asi que copiarlos en cada pagina era exactamente
// el patron que este repositorio ya pago con `llevarABom` en seis copias. Aqui solo se dice
// donde va y que hacer cuando cambia.
const DTO=BOM.simuladorDescuento('cajaDescuento',()=>renderBom());
const dtoActual=()=>DTO?DTO.valor():0;
const dtoEtiqueta=()=>DTO?DTO.etiqueta():'Lista (0 %)';

/* ══ CALCULADORA DE POOL BOOST (fase 11, §3.2) ══
   Proyecta los bloques por sede del dimensionador al fabric: el pool se licencia una
   sola vez y Orchestrator lo reparte entre las sedes que lo aprovechan. */
function pintarPoolBoost(){
  const n=Math.max(0,parseInt($('poolSedes').value)||0);
  const D=estadoDerivado();
  const out=$('poolOut');
  if(!n){ out.innerHTML=''; return; }
  if(!D.bloques){
    out.innerHTML='<p class="hint">El escenario actual no licencia Boost (no está marcado o la suscripción está excluida): marca Boost en el dimensionador para proyectar el pool.</p>';
    return;
  }
  const cfg=D.bundle==='onprem'?SIZING.boost.onprem:SIZING.boost.saas;
  const blk=cfg?cfg.bloque100:null;
  const totalBloques=D.bloques*n, totalMbps=totalBloques*SIZING.boost.bloque;
  const precio=tierPrice(blk,D.termYrs);
  out.innerHTML=`<table class="tco-tabla"><thead><tr><th>Pool del fabric</th><th>Por sede</th><th>× ${n} sedes</th><th>Total</th></tr></thead><tbody>`
    +`<tr><td><b>Bloques de ${SIZING.boost.bloque} Mbps</b></td><td>${D.bloques}</td><td>${totalBloques}</td><td><b>${totalMbps.toLocaleString('en-US')} Mbps</b></td></tr>`
    +(blk?`<tr><td>SKU (término ${D.termYrs} años)</td><td colspan="2"><code>${tierSku(blk,D.termYrs)||'—'}</code></td><td><b>${precio!=null?BOM.money(precio*totalBloques):'consultar'}</b> LIST</td></tr>`:'')
    +`</tbody></table><p class="hint">Es un pool único del fabric: no multiplica por unidad ni por appliance, y Orchestrator lo reasigna entre sedes sin tocar hardware. Misma línea que el BOM global consolidado agrega por perfil.</p>`;
}
$('poolSedes').addEventListener('input',pintarPoolBoost);

/* ══ M6 · PERFILES MULTI-SEDE (SPEC B.7) ══
   «Tienda x50»: el escenario actual se guarda como {nombre, sedes, estado v2} con su
   número de sedes idénticas, y el botón «Consolidar» abre el BOM agregado
   Σ(BOM del perfil × sedes) en #modalConsolidado — equipo y suscripciones multiplican
   por sede, el pool de Boost agrega en una sola línea del fabric y el Orchestrator va
   una sola vez. Los perfiles viven en localStorage (clave arubaPerfilesV1) y conservan
   los precios del día en que se guardaron (snapshot de filas, para que el consolidado
   no cambie si la lista de precios se actualiza después). */
// EL ALMACEN VIVE EN bom.js, NO AQUI (2026-09-13). Nacio como `arubaPerfilesV1`, una clave
// por fabricante, y un despliegue real de 50 sedes MEZCLA fabricantes — spokes Fortinet contra
// un core Nokia. Con una clave por pagina, el consolidado de cada fabricante ignoraria al resto
// en silencio: el mismo fallo que ya tuvo `presales-bom-refs:<pathname>`. `BOM` migra lo que
// hubiera guardado bajo la clave vieja y lo estampa como de Aruba.
//
// Cargar es del fabricante (los `campos` son los ids de ESTA pagina, aplicar un perfil de
// Fortinet aqui no significa nada) pero consolidar cruza fabricantes, porque `filas` es la
// forma neutra que los siete comparten.
const VENDOR='aruba';
const cargarPerfiles=()=>BOM.perfilesDe(VENDOR);
// Captura/restauracion de campos del escenario (la misma lista que persiste ESTADO).
// #wanLinksData viaja como un campo más: es la serialización v2 de los enlaces WAN.
function capturarCampos(){
  const v={};
  CAMPOS_ESCENARIO.forEach(id=>{
    const n=$(id); if(!n) return;
    if(n.classList&&n.classList.contains('seg')){
      const a=n.querySelector('[aria-pressed="true"]'); v[id]=a?a.dataset.v:null;
    }else if(n.type==='checkbox'){ v[id]=n.checked; }
    else v[id]=n.value;
  });
  return v;
}
function aplicarCampos(v){
  CAMPOS_ESCENARIO.forEach(id=>{
    const n=$(id); if(!n||v[id]==null) return;
    if(n.classList&&n.classList.contains('seg')){
      const b=[...n.children].find(x=>x.dataset.v===v[id]); if(b) b.click();
    }else if(n.type==='checkbox'){ n.checked=!!v[id]; }
    else n.value=v[id];
  });
  // Las filas del builder se reconstruyen desde la serialización v2 ya aplicada.
  reconstruirWanDesdeHidden();
  // El select de seguridad guarda su valor en una variable del motor, no solo en el DOM.
  secMode=$('selSeguridad').value||'none';
  $('secHint').innerHTML=SEC_HINT[secMode]||SEC_HINT.none;
  render();
}
$('btnGuardarPerfil').addEventListener('click',()=>{
  const nombre=$('nombrePerfil').value.trim();
  const sedes=Math.max(0,parseInt($('perfilSedes').value)||0);
  if(!nombre||!sedes){ $('nombrePerfil').focus(); return; }
  const m=MODELS.find(x=>x.id===$('pickModel').value);
  if(!m||!bomFilas.length) return;
  BOM.guardarPerfil({nombre, sedes, modelo:m.id, vendor:VENDOR,
    fecha:new Date().toISOString().slice(0,10),
    version:2, campos:capturarCampos(), filas:JSON.parse(JSON.stringify(bomFilas))});
  $('nombrePerfil').value=''; $('perfilSedes').value='';
  pintarPerfiles();
});
function pintarPerfiles(){
  const l=cargarPerfiles();
  $('listaPerfiles').innerHTML=l.length
    ?`<table class="tco-tabla"><thead><tr><th>Perfil</th><th>Sedes</th><th>Modelo</th><th>Guardado</th><th></th></tr></thead><tbody>`
      +l.map(p=>`<tr><td><b>${esc(p.nombre)}</b></td><td>${p.sedes}</td><td>${esc(p.modelo)}</td><td>${p.fecha||'—'}</td>`
        +`<td><button type="button" class="btn ghost" data-perfil-cargar="${esc(p.id)}" style="font-size:10px;padding:3px 8px">Cargar</button> `
        +`<button type="button" class="btn ghost" data-perfil-borrar="${esc(p.id)}" style="font-size:10px;padding:3px 8px">Eliminar</button></td></tr>`).join('')
      +'</tbody></table>'
    :'<p class="hint">Sin perfiles guardados todavía.</p>';
  $('btnConsolidar').disabled=!l.length;
}
$('listaPerfiles').addEventListener('click',e=>{
  const b=e.target.closest('button'); if(!b) return;
  if(b.dataset.perfilCargar!=null){
    const p=cargarPerfiles().find(x=>x.id===b.dataset.perfilCargar);
    if(p&&p.campos) aplicarCampos(p.campos);
  }else if(b.dataset.perfilBorrar!=null){
    BOM.quitarPerfil(b.dataset.perfilBorrar); pintarPerfiles();
  }
});
// M8 (2026-09-24): túneles SD-WAN que una sede abre hacia CADA VPNC. El orquestador levanta
// un túnel por enlace WAN de la sucursal hacia cada headend (VSG SD-Branch, «Overlay Tunnel
// Orchestrator» y «Headend Redundancy»), también por el de respaldo.
function tunelesSede(wanLinks){ return (wanLinks||[]).filter(l=>l.down>0||l.up>0).length; }
// `miles` se declara más abajo (const): este bloque lleva su propio formateador para no
// depender del orden de declaración.
const milesVpnc=n=>Number(n).toLocaleString('en-US');
// El headend más pequeño del catálogo cuya escala oficial de túneles (VSG, p. 63) sostiene el
// total. Es un MÍNIMO por túneles: el throughput cifrado agregado y el crecimiento también
// cuentan, y la redundancia pide un par (cada VPNC recibe todos los túneles).
function sugerirVpnc(perfiles){
  let tuneles=0, sedes=0;
  const detalle=[];
  for(const p of perfiles){
    if(String(p.vendor||'').toLowerCase()!=='aruba') continue;
    const m=MODELS.find(x=>x.id===p.modelo);
    if(!m||m.fam!=='gw'||m.rol!=='sucursal') continue;
    let links=[];
    try{ const d=JSON.parse((p.campos||{}).wanLinksData||'null'); links=(d&&d.wanLinks)||[]; }catch{ links=[]; }
    const n=tunelesSede(links)*(Number(p.sedes)||0);
    tuneles+=n; sedes+=Number(p.sedes)||0;
    detalle.push(`${p.nombre}: ${tunelesSede(links)} × ${p.sedes} sedes`);
  }
  if(!sedes) return null;
  // Generación actual primero: la línea anterior (7240XM) solo si nada vigente llega — la
  // misma regla con la que se ordenan los candidatos del dimensionador.
  const headends=MODELS.filter(m=>m.vpncTuneles!=null)
    .sort((a,b)=>(a.legacy?1:0)-(b.legacy?1:0)||a.vpncTuneles-b.vpncTuneles);
  const elegido=headends.find(m=>m.vpncTuneles>=tuneles)||null;
  return {tuneles, sedes, detalle, elegido, headends};
}
// BOM global consolidado Σ(BOM del perfil × sedes): suma linea a linea (cat+desc+sku)
// con qty × sedes. Excepciones del fabric: el pool de Boost agrega en UNA linea y el
// Orchestrator on-prem va una vez. Se pinta dentro de #modalConsolidado (SPEC B.7).
function consolidarPerfiles(){
  // TODOS los perfiles, no solo los de Aruba: una cotizacion de 50 sedes puede llevar dos
  // marcas dentro, y ese es justamente el caso que esta pantalla existe para armar.
  const l=BOM.perfiles();
  // Las dos excepciones son el modelo COMERCIAL de Aruba, no una regla universal, asi que se
  // declaran aqui y no dentro de bom.js. Un fabricante que no declare nada multiplica todo por
  // sedes, que es lo correcto por defecto.
  const {filas,totalSedes,fabricantes}=BOM.consolidar(l,{
    agregadas:['Aceleración'],
    unicas:['Orquestación'],
    notaAgregada:'Pool agregado del fabric: suma de los bloques por sede de cada perfil × sus sedes. Orchestrator lo reparte y lo reasigna sin tocar hardware.',
    notaUnica:'Una sola instancia por fabric, no por sede.',
  });
  const dto=dtoActual();
  const multi=fabricantes.length>1;
  const meta={
    titulo:`BOM global consolidado — ${l.length} perfil(es), ${totalSedes} sedes`,
    subtitulo:l.map(p=>`${p.nombre} ×${p.sedes} (${p.modelo})`).join(' · '),
    archivo:multi?'BOM_global_multifabricante':'BOM_global_aruba', sinRefs:true,
    notas:[
      'REGLAS DE CONSOLIDACION (SPEC parte B, M6):',
      '  Equipo, suscripciones y soporte: cantidad por sede x numero de sedes del perfil.',
      '  Pool de Boost: UNA sola linea del fabric con la suma de bloques por sede.',
      '  Orchestrator on-prem: una sola instancia por fabric, no por sede.',
      '  Precios: los vigentes el dia en que se guardo cada perfil (declarado en cada uno).',
      '  Lineas «consultar» (SSE, EC-V): se consolidan en cantidad, sin precio.',
    ],
  };
  // Contexto MSP del escenario actual (etapa A / #39): encabeza el consolidado y su Excel.
  const cliCons=$('nombreCliente').value.trim(), refCons=$('refProyecto').value.trim();
  if(cliCons) meta.cliente=cliCons;
  if(refCons) meta.referencia=refCons;
  // Si hay mas de un fabricante se dice, porque las reglas de agregacion de arriba son de
  // Aruba y no aplican a las lineas de los demas.
  if(multi) meta.notas.push(`  MULTI-FABRICANTE: ${fabricantes.join(', ')}. Las dos reglas de agregacion son de Aruba; las lineas de otros fabricantes se multiplican por sedes.`);
  if(dto>0){ meta.dto=dto; meta.dtoEtq=dtoEtiqueta(); }
  // M8: el headend VPNC que las sucursales SD-Branch necesitan, por túneles (VSG).
  const vpnc=sugerirVpnc(l);
  if(vpnc){
    meta.notas.push('', 'HEADEND VPNC (SD-Branch) — no incluido en las lineas de arriba:',
      `  ${vpnc.sedes} sedes con gateway de sucursal abren ${milesVpnc(vpnc.tuneles)} tuneles SD-WAN hacia cada VPNC (${vpnc.detalle.join('; ')}).`,
      vpnc.elegido
        ?`  Minimo por tuneles: ${vpnc.elegido.id} (${milesVpnc(vpnc.elegido.vpncTuneles)} tuneles, VSG SD-Branch sep-2026); en par redundante, 2 unidades.`
        :'  Ningun headend del catalogo llega a esa cifra: repartir en varios VPNC o regiones SD-WAN (VSG).',
      '  El throughput cifrado agregado y el crecimiento tambien cuentan: es un minimo, no el diseno del DC.');
  }
  return {filas, meta, totalSedes, fabricantes, vpnc};
}

$('btnConsolidar').addEventListener('click',()=>{
  const {filas, meta, totalSedes, fabricantes, vpnc}=consolidarPerfiles();
  if(!totalSedes) return;
  // SI HAY MAS DE UNA MARCA, SE DICE EN PANTALLA Y NO SOLO EN EL EXCEL. Las dos reglas de
  // agregacion de arriba (pool de Boost, Orchestrator unico) son el modelo comercial de Aruba;
  // las lineas de otro fabricante se multiplican por sedes como cualquier otra. Un consolidado
  // que mezcla marcas sin declararlo invita a leer esas reglas como si aplicaran a todo.
  const aviso=fabricantes.length>1
    ? `<p class="bom-aviso">Consolidado <b>multi-fabricante</b> (${fabricantes.join(', ')}). `
      +'Las reglas de agregación de Aruba —pool de Boost en una línea, Orchestrator una vez por '
      +'fabric— aplican solo a sus líneas; las de los demás fabricantes se multiplican por sedes.</p>'
    : '';
  $('consolidadoSub').textContent=meta.subtitulo+` — ${totalSedes} sedes en total`;
  const avisoVpnc=vpnc
    ?`<p class="bom-aviso" id="avisoVpnc"><b>Headend VPNC (SD-Branch), no incluido en la lista:</b> ${vpnc.sedes} sedes con gateway de sucursal abren <b>${milesVpnc(vpnc.tuneles)} túneles</b> SD-WAN hacia cada VPNC. `
      +(vpnc.elegido
        ?`El mínimo por túneles es el <b>${esc(vpnc.elegido.id)}</b> (${milesVpnc(vpnc.elegido.vpncTuneles)} túneles según el VSG SD-Branch); en par redundante, 2 unidades. `
        :'Ningún headend del catálogo llega a esa cifra: hay que repartir en varios VPNC o regiones SD-WAN. ')
      +'El throughput cifrado agregado y el crecimiento también cuentan: es un mínimo, no el diseño del datacenter.</p>'
    :'';
  $('consolidadoTabla').innerHTML=aviso+avisoVpnc+BOM.renderTabla(filas,{dto:dtoActual(), sinRefs:true});
  $('modalConsolidado').hidden=false;
  $('xlsConsolidadoBtn').onclick=()=>BOM.exportarExcel(filas,meta);
});
$('consolidadoCerrar').addEventListener('click',()=>{ $('modalConsolidado').hidden=true; });
$('modalConsolidado').addEventListener('click',e=>{ if(e.target===$('modalConsolidado')) $('modalConsolidado').hidden=true; });

// Texto del destino de tráfico (2026-09-13, refactor arquitectónico): la estrategia de
// aplicaciones sustituye a los campos abstractos. Cloud-First usa First-packet iQ para
// sacar el tráfico SaaS de confianza directo a Internet o al SSE; Híbrido concentra el
// tráfico en los overlays con Path Conditioning hacia el datacenter privado.
// Cada opción declara SU cálculo (petición del dueño, 2026-09-15): el destino mueve el
// «featurePenalty» del motor — +0 % en híbrido (el túnel al DC es el caso base) y +5 %
// en Cloud-First, porque clasificar cada primer paquete (First-packet iQ) para decidir
// DIA/SSE es trabajo extra del appliance. La cifra se aplica sobre el throughput de
// diseño del motor de ingeniería y se ve en la ficha («por qué este equipo»).
const DEST_HINT={
  hibrido:'Tráfico intensivo en túneles del fabric hacia el datacenter propio, con Path Conditioning (FEC y corrección de orden de paquetes) sosteniendo el SLA de aplicación. Cálculo: sin sobrecoste — el throughput de diseño sale del motor de ingeniería tal cual (penalización de función ×1,00).',
  cloud:'Office 365, Teams, Salesforce y web salen directos a Internet (DIA) o hacia la nube SSE: First-packet iQ clasifica la aplicación en el primer paquete y decide el breakout. Menos carga cifrada en el túnel corporativo. Cálculo: +5 % sobre el throughput de diseño (×1,05) — clasificar cada primer paquete es trabajo del appliance.',
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

// Conmutador «Ver características…» de la tarjeta (delegado: ficha.js repinta el
// enlace en cada render). ficha.js ya hizo el toggle en su listener de destino; aquí,
// en burbuja, la página: (a) SUELTA el sticky cuando la tarjeta se expande —una
// tarjeta clavada más alta que el viewport deja su parte inferior inalcanzable— y lo
// repone al plegar; (b) compensa el scroll para que la tarjeta no «salte» al soltar
// el sticky (su posición natural puede quedar muy por encima del scroll actual);
// (c) lleva el estado a la URL (?ficha=abierta) para compartir el escenario con las
// características ya desplegadas — la mejora de deep-link, adaptada: la pestaña
// «Equipo» desapareció y el estado que interesa compartir es ESTE.
document.addEventListener('click',(e)=>{
  if(e.target&&e.target.id==='verdict-salto'){
    const col=document.querySelector('.cols>.col-fijo');
    const det=document.getElementById('verdict-det');
    if(!col||!det)return;
    const abierto=!det.hidden;
    col.classList.toggle('expandida',abierto);
    if(abierto){
      const y=col.getBoundingClientRect().top+window.scrollY;
      window.scrollTo(0,Math.max(0,y-16));
    }
    const u=new URL(window.location.href);
    if(abierto)u.searchParams.set('ficha','abierta');else u.searchParams.delete('ficha');
    window.history.replaceState(null,'',u);
  }
});

document.querySelectorAll('.tabs button').forEach(b=>b.addEventListener('click',()=>{
  document.querySelectorAll('.tabs button').forEach(x=>x.setAttribute('aria-selected',x===b));
  ['calc','bom','lic','cat','src'].forEach(t=>$('pane-'+t).hidden=(t!==b.dataset.tab));
}));

// A2 (auditoría 2026-09-17, corregido 2026-09-24): Dynamic Threat Defense y Boost solo
// existen en EdgeConnect, así que pedirlos con el filtro en «Gateways sucursal/campus» movía
// la familia a EdgeConnect SIN AVISAR, y al quitarlos no volvía: quien probaba DTD y lo
// descartaba se quedaba mirando EdgeConnect sin saber por qué. Ahora el salto se DECLARA bajo
// el selector de familia y se DESHACE solo cuando ya no queda nada que lo exija — salvo que
// entretanto alguien haya elegido familia a mano, que es una decisión y manda.
const FAM_NOMBRE={any:'Indiferente', ec:'EdgeConnect SD-WAN', sucursal:'Gateways sucursal', campus:'Gateways campus'};
let famAntesDeForzar=null;
function marcarFamilia(v){ [...$('famSeg').children].forEach(x=>x.setAttribute('aria-pressed',x.dataset.v===v)); }
function avisoFamilia(txt){ const n=$('famAviso'); if(!n) return; n.hidden=!txt; n.textContent=txt; }
function forzarFamiliaEc(motivo){
  if(famMode==='ec'||famMode==='any') return;
  if(famAntesDeForzar==null) famAntesDeForzar=famMode;
  famMode='ec'; marcarFamilia('ec');
  avisoFamilia(`La familia pasó a EdgeConnect SD-WAN porque ${motivo} solo existe en EdgeConnect. Si lo quitas, vuelve a «${FAM_NOMBRE[famAntesDeForzar]||famAntesDeForzar}». Para IDS/IPS en un gateway, elige «En el gateway — Central + Security» en la estrategia de seguridad.`);
}
// IDS/IPS en el gateway (gwsec) es lo simétrico: con la familia en EdgeConnect no hay ningún
// gateway que elegir, así que se abre a «Indiferente» (el filtro ya deja solo los gateways).
function forzarFamiliaGateways(motivo){
  if(famMode!=='ec') return;
  if(famAntesDeForzar==null) famAntesDeForzar=famMode;
  famMode='any'; marcarFamilia('any');
  avisoFamilia(`La familia pasó a «Indiferente» porque ${motivo} solo existe en los gateways SD-Branch. Si lo quitas, vuelve a «${FAM_NOMBRE[famAntesDeForzar]||famAntesDeForzar}».`);
}
function restaurarFamiliaSiProcede(){
  if(famAntesDeForzar==null) return;
  if(secMode==='dtd'||$('chkBoost').checked) return; // algo sigue exigiendo EdgeConnect
  if(secMode==='gwsec') return;                       // algo sigue exigiendo un gateway
  famMode=famAntesDeForzar; famAntesDeForzar=null;
  marcarFamilia(famMode); avisoFamilia('');
}
$('famSeg').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;[...$('famSeg').children].forEach(x=>x.setAttribute('aria-pressed',x===b));famMode=b.dataset.v;
  // Elegir familia a mano es una decisión: el salto automático deja de tener nada que deshacer.
  if(e.isTrusted){ famAntesDeForzar=null; avisoFamilia(''); }
  render();});
$('segSeg').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;[...$('segSeg').children].forEach(x=>x.setAttribute('aria-pressed',x===b));segMode=b.dataset.v;render();});
$('destSeg').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;[...$('destSeg').children].forEach(x=>x.setAttribute('aria-pressed',x===b));destMode=b.dataset.v;$('destHint').textContent=DEST_HINT[destMode]||'';render();});
$('soSeg').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;[...$('soSeg').children].forEach(x=>x.setAttribute('aria-pressed',x===b));soMode=b.dataset.v;$('soHint').innerHTML=SO_HINT[soMode]||'';render();});
['users','aps','perUser','head','fecMode','selTrafico','boostProfile','perfilEntorno','chkBoost','chkSeg','chkTopo','chkAiops','chkHa','chkDualPsu','chkBreakout','selTier',
  // Cliente/referencia (etapa A / #39): también repintan — la cabecera MSP del BOM se
  // escribe en el render y sin este binding no aparecía hasta que cambiara otro campo.
  'nombreCliente','refProyecto'].forEach(id=>$(id).addEventListener('input',render));

// Arquetipo de sede (fase 11): restringe el catalogo a los modelos del VSG para ese
// tamanyo de sitio; el hint declara que hace cada persona.
$('personaSeg').addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b)return;
  [...$('personaSeg').children].forEach(x=>x.setAttribute('aria-pressed',x===b));
  personaMode=b.dataset.v;
  $('personaHint').textContent=PERSONA_HINT[personaMode]||PERSONA_HINT.auto;
  render();
});
// Estrategia de seguridad (#selSeguridad, SPEC B.4): select none/dtd/sse. DTD es funcion
// EdgeConnect (QuickSpecs p.32), no de los gateways: elegirla mueve el filtro de familia,
// igual que Boost. SSE no mueve el filtro: es suscripcion por usuario independiente del
// chasis, y el tunnel IPsec orquestado lo montan tanto EdgeConnect como los gateways.
$('selSeguridad').addEventListener('change',()=>{
  secMode=$('selSeguridad').value||'none';
  $('secHint').innerHTML=SEC_HINT[secMode]||SEC_HINT.none;
  if(secMode==='dtd') forzarFamiliaEc('Dynamic Threat Defense');
  else if(secMode==='gwsec') forzarFamiliaGateways('IDS/IPS con Central + Security');
  else restaurarFamiliaSiProcede();
  render();
});

// Boost solo existe en EdgeConnect: pedirlo con el filtro en gateways daria una lista
// vacia sin explicar por que, asi que se mueve el filtro tambien.
$('chkBoost').addEventListener('change',()=>{
  if($('chkBoost').checked) forzarFamiliaEc('Boost');
  else restaurarFamiliaSiProcede();
  render();
});
// Dynamic Threat Defense vive en el selector de estrategia de seguridad (#selSeguridad,
// SPEC B.4): el movimiento del filtro de familia se hace en su listener de arriba.
$('chkHa').addEventListener('change',()=>{
  // Si la regla de auto-marcado del dueño (2026-09-17) está activa y el usuario la
  // contradice a mano, se respeta: no se vuelve a marcar mientras la regla siga y la
  // revisión del diseño declara el sitio de gran capacidad sin par HA. Marcarla a mano
  // limpia el registro.
  if(haAutoVigente) $('chkHa').dataset.haManual=$('chkHa').checked?'':'1';
  // Las unidades se deducen de esta casilla (1 ó 2 — sin campo de cantidad desde
  // 2026-09-15). render() entero: la ficha declara el par HA en «Unidades a licenciar»
  // y el BOM parte la suscripción en 1× estándar + 1× SKU de alta disponibilidad.
  render();
});
// Estos campos disparan render() y no solo renderBom: con la unificacion de 2026-09-13 la
// ficha misma muestra la suscripcion, las licencias y el soporte elegidos (incluidos los
// «No incluir»), asi que hay que repintarla entera, no solo la lista de materiales.
// Desde el refactor de 2026-09-13 el nivel de suscripcion, el tier de caudal, los bloques
// de Boost y el nivel de capacidad del 9240 se DEDUCEN (no hay selectores manuales): lo
// que queda aqui es el termino, el soporte y las exclusiones («No incluir», pedido
// explicito del dueno que se conserva) mas la modalidad On-Premises del menu avanzado.
['termYears','careLevel','chkNoSub','chkNoCentral','chkSoloHw','chkOnprem']
  .forEach(id=>$(id).addEventListener('input',render));
// El modelo es el selector UNICO de la pagina: cambiarlo a mano mueve ficha, resumen,
// escalera y BOM, no solo la lista. La marca de eleccion manual se fija ANTES de render,
// porque render podria reponer el recomendado si la tomara por heredada.
$('pickModel').addEventListener('change',()=>{ $('pickModel').dataset.bomManual='1'; render(); });

// Selector de óptica SFP por medio (SPEC B.1, 2026-09-15): cuando hay varias ópticas
// compatibles con el modelo, la elección es del USUARIO (alcance/medio del enlace — el
// dimensionador no puede inferirlo). La elección viaja en #sfpPickData (JSON {medio:sku},
// dentro de CAMPOS_ESCENARIO, así que sobrevive a la URL compartida). Al cambiarla basta
// repintar el BOM… salvo la de la interconexión EdgeHA (pendiente #7, 2026-09-17): su SKU
// sí se muestra en la ficha (asistente de cableado), así que esa repinta todo.
$('sfpChooser').addEventListener('change',e=>{
  const medio=e.target.dataset&&e.target.dataset.sfpMedio;
  if(!medio) return;
  const pick=leerSfpPick();
  if(e.target.value) pick[medio]=e.target.value; else delete pick[medio];
  escribirSfpPick(pick);
  if(medio==='EdgeHA') render(); else renderBom();
});

// BOM editable (petición del dueño, 2026-09-15): retirar y restaurar líneas. Delegado en
// document porque la tabla se repinta entera en cada render — un listener colgado del
// botón moriría con el primer repintado (misma razón que el data-bom-quitar de bom.js).
// Solo se repinta el BOM: la omisión no cambia el dimensionamiento, solo la cotización.
document.addEventListener('click',e=>{
  const b=e.target.closest&&e.target.closest('[data-bom-omitir],[data-bom-restaurar]');
  if(!b) return;
  const omit=leerOmitidas();
  if(b.dataset.bomOmitir){ if(!omit.includes(b.dataset.bomOmitir)) omit.push(b.dataset.bomOmitir); }
  else{
    const i=omit.indexOf(b.dataset.bomRestaurar);
    if(i>=0) omit.splice(i,1);
  }
  escribirOmitidas(omit);
  renderBom();
});

// Ajuste de cantidad de una línea calculada (mejora, 2026-09-16): delegado en document
// por la misma razón que el click de arriba. Se guarda la DIVERGENCIA contra la cifra
// del motor (data-bom-calc): devolverla a esa cifra poda el ajuste y la línea vuelve a
// seguir al escenario; fuera de rango (vacío, 0, negativo) se repone la cifra calculada
// sin guardar nada — un ajuste inválido no puede quedar escrito en el enlace.
document.addEventListener('change',e=>{
  const b=e.target.closest&&e.target.closest('[data-bom-ajustar]');
  if(!b) return;
  const clave=b.getAttribute('data-bom-ajustar');
  const calc=parseInt(b.getAttribute('data-bom-calc'),10);
  const v=parseInt(b.value,10);
  if(!isFinite(v)||v<1){ b.value=isFinite(calc)&&calc>0?calc:1; return; }
  const ajustes=leerAjustes();
  if(isFinite(calc)&&v===calc) delete ajustes[clave]; else ajustes[clave]=v;
  escribirAjustes(ajustes);
  renderBom();
});

function fmt(m){
  if(m==null) return '—';
  if(m>=1000)return (m/1000).toFixed(m%1000?1:0)+' Gbps';
  return Math.round(m)+' Mbps';
}
const miles=n=>n==null?'—':n.toLocaleString('en-US');

/* ══ Trazas aritméticas vivas (mejora 2026-09-17, plan 16) ══════════════════════
   Toda cifra del veredicto debe ser auditable factor a factor — la lección del falso
   diagnóstico de «bug de filtrado» sobre el desbordamiento (plan 15): quien ve la
   cuenta no confunde ingeniería declarada con un error. Dos trazas, ambas desde los
   DATOS del escenario, nunca de literales:
   · trazaMotorHtml — la del motor de ingeniería, para el requerimiento WAN del
     appliance EdgeConnect (los factores salen del propio motor, D.ing.traza).
   · trazaProcesoHtml — la de la fórmula histórica de PROCESO con la que se
     dimensionan los gateways: máx(caudal físico, usuarios × Mbps/usuario) × margen
     × penalización de función. */
const fmtF=n=>(Math.round(n*100)/100).toFixed(2).replace('.',',');
// Núcleo PLANO de cada traza (sin intro ni <b>): la ficha lo envuelve en HTML y la
// lista de materiales exportada lo antepone con «Dimensionado:» (plan 17) — una sola
// fuente para las dos superficies, imposible que deriven.
function cuentaMotorPlana(D,wanNeed){
  const tz=D.ing&&D.ing.traza;
  if(!(D.caudalTotal>0&&tz)) return '';
  return `${miles(tz.bwFisico)} Mbps físicos ÷ IMIX ${fmtF(tz.factorIMIX)} × ${fmtF(1+tz.overheadFEC)} FEC × ${fmtF(1+tz.factorSeguridad)} seguridad × ${fmtF(1+tz.factorHeadroom)} margen${D.featurePenalty!==1?` × ${fmtF(D.featurePenalty)} función`:''} ≈ ${miles(Math.round(wanNeed))} Mbps`;
}
function trazaMotorHtml(D,wanNeed){
  const c=cuentaMotorPlana(D,wanNeed);
  return c?` La cuenta, con las hipótesis vivas del motor: <b>${c}</b> de diseño.`:'';
}
function cuentaProcesoPlana(D){
  if(!(D.needProc>0)) return '';
  const base=D.caudalTotal>0&&D.users>0
    ?`máx(${miles(D.caudalTotal)} Mbps de enlaces, ${miles(D.users)} usuarios × ${D.perUser} Mbps)`
    :D.caudalTotal>0?`${miles(D.caudalTotal)} Mbps de enlaces`
    :`${miles(D.users)} usuarios × ${D.perUser} Mbps`;
  return `${base} × ${fmtF(1+D.head)} margen${D.featurePenalty!==1?` × ${fmtF(D.featurePenalty)} función`:''} = ${miles(Math.round(D.needProc))} Mbps`;
}
function trazaProcesoHtml(D){
  const c=cuentaProcesoPlana(D);
  return c?` La cuenta: <b>${c}</b>.`:'';
}

// Catálogo Aruba, con la misma tabla que antes vivía en la vista de Aruba del portal (ver
// CLAUDE.md, 2026-09-10): se pinta desde MODELS, ya cargado para el propio dimensionador.
// EdgeConnect (rol sdwan) publica un RANGO de caudal WAN, no una cifra única; los gateways
// (sucursal/campus) publican throughput de firewall — son dos medidas distintas, así que la
// columna "Capacidad" declara cuál está mostrando en vez de fundirlas en un solo número.
// SEMAFORO DE CICLO DE VIDA — LA REGLA YA NO VIVE AQUI (pendiente 34, 2026-09-16).
// Esta copia tenia dos defectos que solo se ven al intentar portarla a los otros seis:
//
//  1. SU RAMA POR DEFECTO ERA VERDE. Todo modelo sin marca salia «Generacion actual», asi que
//     afirmaba que se puede pedir sobre equipos que nadie ha contrastado contra un boletin.
//     Ninguna fuente declarada de Aruba respalda `eolAnnounced` (ver `campos` en fuentes.js),
//     asi que esa afirmacion no tenia detras mas que la ausencia de una marca. Los 23 modelos
//     de Aruba sin marca pasan ahora al TERCER ESTADO, que es lo que de verdad se sabe.
//  2. PINTABA DE ROJO UN FIN DE VENTA ANUNCIADO QUE TODAVIA NO HA VENCIDO. Hasta su fecha de
//     ultimo pedido el equipo SE PIDE CON NORMALIDAD — `FICHA.rango()` ya hacia esa
//     distincion y este semaforo no, asi que la misma pagina se contradecia.
//
// La implementacion unica esta en `FICHA.cicloHtml`, como `FICHA.rango` es la unica del fin
// de venta. Aqui solo queda la llamada.
const semaforoCiclo=m=>FICHA.cicloHtml(m);

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
    <td class="sem-cel">${semaforoCiclo(m)}</td>
  </tr>`;
  }).join('');
}

// La etiqueta de familia sale de la serie comercial, que es como el cliente nombra el
// equipo; `rol` es lo que de verdad filtra en preventa.
const famLabel=m=>m.serie+(m.fam==='ec'?' SD-WAN':' · gateway');
const SEG_MATCH={branch:/Sucursal|remota|peq|med/i,campus:/Campus|Hub/i,dc:/Datacenter|Head-end|Virtual/i};

/* ══ SISTEMA OPERATIVO DE LOS GATEWAYS (C2/C3 de la auditoria 2026-09-17) ══
   Las cifras de APs, clientes y licencia de capacidad de un gateway dependen de su
   sistema operativo: el 9004 gestiona 128 APs en AOS 10 y 32 en AOS 8; el 9240 Base
   4.000 APs / 32.000 clientes en AOS 10 y 512 / 16.000 en AOS 8, con SKU de licencia
   distintos. El catalogo trae la cifra base y `porSo` con lo que cambia por SO
   (legacyData/aruba.js); aplicarSo() la superpone sobre MODELS antes de cada render, asi
   que el filtro, la ficha, la escalera de la 9200 y el BOM leen la MISMA cifra. La regla
   pura vive en aruba-reglas.js (capacidadSo), probada en Node. */

function aplicarSo(){
  for(const m of MODELS){
    if(!m.porSo) continue;
    if(!m._base) m._base={aps:m.aps, clients:m.clients, fw:m.fw, licCap:m.licCap};
    const ov=ArubaReglas.capacidadSo(m,soMode);
    Object.assign(m,m._base);
    m.sinCifraSo=!!ov.sinCifra;
    m.motivoSo=ov.sinCifra?ov.motivo:null;
    if(!ov.sinCifra){
      for(const k of ['aps','clients','fw','licCap']) if(k in ov) m[k]=ov[k];
    }
  }
}

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
/* Capacidad con la que se compara el requerimiento (brief carrier-grade 2026-09-13,
   SECCIÓN 1.B.4 — SIN DOBLE CONTEO IMIX). El requerimiento EdgeConnect (wanNeed) YA
   viene dividido por el factor IMIX dentro del motor de ingeniería, así que se compara
   contra el throughput NOMINAL publicado: degradar además la capacidad con ×0,70
   contaría el IMIX dos veces. Los gateways 9000/9200 NO entran en la regla (van por
   throughput de firewall/clientes) y su comparación conserva la degradación histórica
   ×IMIX_FACTOR del lado capacidad. */
function capacidadComparable(m){
  const cap=capacidadMax(m);
  return cap==null?null:(m.fam==='ec'?cap:cap*IMIX_FACTOR);
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

// C1 de la auditoria 2026-09-17: el tier se elige SOLO entre los que existen para el
// nivel deducido. Antes recorria los 8 tiers de SIZING.bwTiers sin mirar el nivel y
// proponia «Foundation 200 Mbps» (o 20/50/500 Mbps, 2 Gbps), que HPE no vende: la
// suscripcion quedaba en «consultar» y fuera del total. La regla vive en aruba-reglas.js
// (probada en Node); aqui solo se le pasan los datos del API.
function tierParaCaudal(mbps,nivel){
  return ArubaReglas.tierParaCaudal(SIZING.bwTiers,LICENSES,mbps,nivel);
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

// Mbps de Boost necesarios (C4 de la auditoria 2026-09-17): el 30 % del trafico WAN
// PRIVADO que viaja por los tuneles — ArubaReglas.boostMbpsSitio. Antes se calculaba sobre
// needProc (con margen de crecimiento, penalizacion de funcion y demanda por usuario) y
// una cuota de breakout invertida (MPLS + 0,70 x Internet, cuando la regla que muestra la
// pagina es que el 70 % sale local): en un hub MPLS 1G + DIA 1G pedia 10 bloques
// (US$196.560 a 3 anos) donde su propia regla da 2. Ahora usa bwTunelesPrivados del motor
// de ingenieria — la MISMA cifra que el hint del breakout declara como «el tunel al DC
// sostiene ≈N» — y se valida contra el Boost recomendado por HPE de cada appliance.

/* ══ M2 · AUDITORÍA DE PUERTOS (SPEC B.3) ══
   Cada enlace WAN declarado ocupa un puerto del chasis y el appliance necesita además
   2 puertos LAN. El EC-10104 tiene 4 puertos RJ-45 y NINGÚN SFP (VSG oficial): si los
   enlaces no caben o alguno es óptico, el modelo queda descartado y el dimensionador
   escala al escalón superior (#alertaEscalado). Para el resto de chasis la densidad de
   ópticas tiene límite de jaulas: aviso si se supera (no descarte — hay DAC y RJ-45). */
// ¿El chasis no declara ninguna jaula SFP? Se lee del texto de interfaces del catálogo
// (`ifaces`), que es donde HPE lo publica; sin ese texto no se afirma nada (null ≠ sin SFP).
function sinJaulasSfp(modelo){
  if(!modelo||!modelo.ifaces||modelo.fam==='ec'&&modelo.wanMax==null) return false; // EC-V: virtual
  return !/SFP/i.test(modelo.ifaces);
}
// ¿Termina 25G? Por la ficha (SFP28/25G en `ifaces`) o por la matriz oficial de ópticas.
function admite25g(modelo){
  if(!modelo) return false;
  return /SFP28|25G/i.test(modelo.ifaces||'')||opticasPorVelocidad(modelo.id,'25G').length>0;
}
function auditarPuertos(modelo, wanLinks){
  const enlaces=(wanLinks||[]).filter(l=>l.down>0||l.up>0);
  const sfp=enlaces.filter(l=>/^SFP/.test(l.medio)).length;
  const sfp28=enlaces.filter(l=>l.medio==='SFP28 25G').length;
  return {
    puertosNecesarios:enlaces.length+2, // +2 puertos LAN
    hayFibra:sfp>0,
    sfp,
    sfp28,
  };
}
// Límite de jaulas SFP por chasis para el aviso de densidad (SPEC B.3): EC-10106/10108
// (2 jaulas SFP+), EC-10150 (8 jaulas SFP+/SFP28) y Gateway 9240 (4 jaulas SFP28).
const SFP_DENSIDAD={'EC-10106':2,'EC-10108':2,'EC-10150':8,'Gateway 9240':4};
// Semáforo de densidad de puertos (etapa A, 2026-09-14): UNA SOLA regla con tres
// niveles, usada tanto por el escalado del dimensionador (rojo = el modelo queda
// descartado y se escala) como por la barra agregada #wanResumen. Así el aviso que ve
// el ingeniero mientras teclea es exactamente el que luego manda en el cálculo.
//   rojo  → no cabe: el EC-10104 (4× RJ-45, sin SFP) no cubre los enlaces declarados.
//   ámbar → cabe, pero la densidad de ópticas supera las jaulas del chasis.
//   verde → cabe sin condiciones.
function evaluarPuertos(modelo, wanLinks){
  const a=auditarPuertos(modelo,wanLinks);
  let nivel='verde', motivo='';
  if(modelo&&modelo.id==='EC-10104'&&(a.puertosNecesarios>4||a.hayFibra)){
    nivel='rojo';
    motivo='El EC-10104 tiene 4 puertos RJ-45 y ningún SFP (VSG oficial): los enlaces declarados no caben — el dimensionador escala al escalón superior.';
  }else if(a.hayFibra&&sinJaulasSfp(modelo)){
    // A7 (2026-09-24): la misma regla para todo chasis cuyo catálogo no declara ninguna
    // jaula SFP (Gateway 9004/9012, EC-XS…). Se recomendaba un 9012 para enlaces de fibra
    // y el selector de ópticas contestaba «no admite ópticas SFP» debajo de la recomendación.
    nivel='rojo';
    motivo=`El ${modelo.id} no tiene jaulas SFP (${modelo.ifaces}): los enlaces de fibra declarados no caben — el dimensionador pasa a un modelo que las tenga.`;
  }else if(a.sfp28>0&&!admite25g(modelo)){
    // Un enlace de 25G no entra en una jaula SFP+: hace falta SFP28, declarada en la ficha o
    // certificada por la matriz oficial de ópticas del modelo.
    nivel='rojo';
    motivo=`El ${modelo.id} no tiene jaulas SFP28 (${modelo.ifaces}) ni ópticas de 25G en su matriz oficial: los enlaces de 25G declarados no caben.`;
  }else if(modelo&&SFP_DENSIDAD[modelo.id]!=null&&a.sfp>SFP_DENSIDAD[modelo.id]){
    nivel='ambar';
    motivo=`Densidad de ópticas: ${a.sfp} enlaces SFP sobre ${SFP_DENSIDAD[modelo.id]} jaulas del chasis — recablea algún enlace a RJ-45/DAC o revisa el medio declarado.`;
  }
  return {...a, nivel, motivo};
}

// Estado derivado del escenario (refactor SPEC parte B, 2026-09-13): el caudal de
// proceso, el de WAN, el tier de suscripción, el nivel de licencia y los bloques de
// Boost se DEDUCEN del formulario. Es una función pura de los campos: render(), la
// ficha (seccionesDe) y el BOM (renderBom) la llaman por separado y ven exactamente lo
// mismo, sin pasarse variables.
function estadoDerivado(){
  const users=parseInt($('users').value)||0;
  const aps=parseInt($('aps').value)||0;
  const perUser=Math.max(0,parseFloat($('perUser').value)||0);
  const head=(parseFloat($('head').value)||0)/100;
  const boost=$('chkBoost').checked;
  // featurePenalty conserva SOLO los multiplicadores de función que el brief
  // carrier-grade (2026-09-13) no mueve al motor de ingeniería: +5 % por segmentación
  // multi-overlay y +5 % por Cloud-First (clasificar cada primer paquete para decidir
  // DIA/SSE es trabajo del appliance). Se aplican SOBRE el throughputDiseno del motor
  // (composición: wanNeed = ing.throughputDisenoMbps × featurePenalty).
  let featurePenalty=1.0;
  if($('chkSeg').checked) featurePenalty+=0.05;
  if(destMode==='cloud') featurePenalty+=0.05;
  // El +35 % de Dynamic Threat Defense SALE de featurePenalty (brief carrier-grade):
  // ahora vive en el motor como factorSeguridad LOCAL_NGFW_DPI 0,35 — no duplicar.
  // M2 · motor multi-underlay (SPEC B.3): los enlaces del builder son la fuente del
  // caudal. caudalTotal = Σ down; mplsMbps = Σ down de los transportes MPLS; el resto
  // es Internet. caudalEfectivo (MPLS + 0,70×Inet) se conserva para la cuota del overlay
  // que usa el dimensionado de Boost (share) — el tier ya NO lo usa (ver abajo).
  // R11/M9 (2026-09-24): el caudal es el de la OPERACIÓN NORMAL — solo los enlaces
  // activos. Un respaldo sigue en `wanLinks` porque ocupa puerto, óptica y la
  // interconexión EdgeHA, pero no suma caudal ni tier: solo entra si cae un activo, y
  // ninguna falla supera a la operación normal en caudal (ver ArubaReglas.escenariosUnderlay).
  // El Boost es otro eje y toma el máximo entre escenarios (ArubaReglas.escenarioBoost, más
  // abajo). Sin respaldos declarados solo existe la normal y las cifras son las de antes.
  const wanLinks=leerWanLinks();
  const escenarios=ArubaReglas.escenariosUnderlay(wanLinks);
  const normal=escenarios[0];
  const caudalTotal=normal.total;
  const mplsMbps=normal.mpls;
  const inetMbps=normal.inet;
  const respaldoMbps=normal.respaldo;
  const breakout=$('chkBreakout').checked;
  const caudalEfectivo=breakout?mplsMbps+inetMbps*0.70:caudalTotal;
  const fec=SIZING.fec[$('fecMode').value]||SIZING.fec.auto;
  const perfil=SIZING.boost.reduccion[$('boostProfile').value]||SIZING.boost.reduccion.generico;
  // needProc (proceso lado LAN: gateways 9000/9200, Boost y el nivel de licencia de
  // capacidad) conserva su fórmula histórica — el dimensionado de gateways va por
  // throughput de firewall/clientes y NO entra en la regla carrier-grade de EdgeConnect.
  const caudalBase=caudalTotal*(1+head)*featurePenalty;
  const userBase=users*perUser*(1+head)*featurePenalty;
  const needProc=Math.max(caudalBase,userBase);

  /* ══ MOTOR DE INGENIERÍA CARRIER-GRADE (brief del dueño 2026-09-13, SECCIÓN 1) ══
     UNA fórmula para el throughput de diseño del appliance EdgeConnect:
     (bwFísico / IMIX) × (1 + overheadFEC) × (1 + factorSeguridad) × (1 + headroom).
     Mapeo de los controles a los parámetros del motor:
       · fecMode off → fec_activo=false (overhead base 0,05); auto → true con calidad
         normal (0,15); alto → true + ALTA_PERDIDA_LTE (0,25).
       · secMode: dtd → LOCAL_NGFW_DPI (0,35) · sse → CLOUD_SASE_SSE (0,05) · none → 0.
       · headroom_pct ← slider #head. Conserva su default 30 %: es el ancla oficial del
         SLA de enlace al 75 % de la guía SD-Branch, que el brief mantiene como referencia.
       · densidad_usuarios ← #perfilEntorno (intensivo → INTENSIVO_SAAS, 150 flujos/usuario). */
  const fecMode=$('fecMode').value;
  // Los mismos parámetros para cualquier reparto MPLS/Internet: la operación normal y, para
  // el eje Boost, cada escenario de falla.
  const motorDe=(mpls,inet)=>MotorIngenieria.calcularRequerimientosIngenieria({
    bw_mpls_mbps:mpls,
    bw_internet_mbps:inet,
    local_breakout_activo:breakout,
    perfil_trafico:($('selTrafico')&&$('selTrafico').value)||'ENTERPRISE_MIX',
    fec_activo:fecMode!=='off',
    enlace_calidad:fecMode==='alto'?'ALTA_PERDIDA_LTE':'NORMAL',
    modelo_seguridad:secMode==='dtd'?'LOCAL_NGFW_DPI':secMode==='sse'?'CLOUD_SASE_SSE':'NINGUNO',
    headroom_pct:parseFloat($('head').value)||0,
    total_usuarios:users,
    densidad_usuarios:$('perfilEntorno').value==='intensivo'?'INTENSIVO_SAAS':'ESTANDAR',
  });
  const ing=motorDe(mplsMbps,inetMbps);
  // Requerimiento de caudal del APPLIANCE EdgeConnect: con enlaces declarados manda el
  // motor — throughputDiseno YA viene dividido por IMIX y cargado con FEC, seguridad y
  // margen— multiplicado por los penalties de función que quedan fuera del motor. El
  // chasis sostiene todo el underlay, también lo que el breakout descarga del overlay
  // (la descarga alivia el túnel, no el hardware — regla oficial VSG). Sin enlaces, se
  // deriva del tráfico estimado con la paridad FEC y la reducción de Boost, como siempre,
  // pero dividido por el factor IMIX porque la comparación contra el modelo se hace ahora
  // contra el throughput NOMINAL (sin degradar la capacidad — ver capacidadComparable).
  // M3 (auditoría 2026-09-17, corregido 2026-09-24): el camino SIN enlaces usaba la paridad
  // del catálogo (ancla VSG: 0 % / 10 % / 25 %) y el camino CON enlaces la reserva del motor
  // (brief del dueño: 5 % / 15 % / 25 %) — dos reglas para el mismo requerimiento según hubiera
  // o no enlaces declarados. Ahora los dos usan la del motor, que es la regla de diseño; el
  // ancla VSG se sigue mostrando, rotulada como tal, en la barra de capacidad útil del widget.
  const wanNeed=caudalTotal>0?ing.throughputDisenoMbps*featurePenalty
    :needProc*(1+ing.traza.overheadFEC)/(boost?perfil.factor:1)/IMIX_FACTOR;
  // El TIER de suscripción: el brief carrier-grade tasa la licencia por el ancho de banda
  // FÍSICO AGREGADO del sitio (tierLicenciaBwRequerido = Σ down de los enlaces), no por
  // el caudal efectivo tras el breakout — es lo que se contrata al operador. Sin enlaces
  // declarados, por el derivado del tráfico estimado.
  const tierCaudal=caudalTotal>0?ing.tierLicenciaBwRequerido:wanNeed;
  // Flujos simultáneos: la misma regla 80/150 de siempre, ahora calculada por el motor.
  const tasaFlujos=FLUJOS_POR_USUARIO[$('perfilEntorno').value]||FLUJOS_POR_USUARIO.estandar;
  const flujosReq=ing.flujosRequeridos;
  // Licenciamiento 100 % automático: el nivel sale de las funciones marcadas (matriz
  // oficial QuickSpecs p.31) y la modalidad On-Premises del menú avanzado. Los «No
  // incluir» (chkNoSub/chkNoCentral/chkSoloHw) son la exclusión explícita que el dueño
  // pidió conservar: '' = la línea se excluye y el panel declara el estado.
  const onprem=$('chkOnprem').checked;
  const bundle=$('chkNoSub').checked?'':(onprem?'onprem':nivelAutoEC());
  const central=$('chkNoCentral').checked?'':nivelAutoCentral();
  // M3 · tier: «Automático» lo deduce del caudal; una elección manual en #selTier manda,
  // pero solo si el tier existe para el nivel deducido — con Foundation los intermedios
  // no existen en la lista oficial (restricción declarada en el propio select, que los
  // bloquea con title explicativo). Se lee DINÁMICAMENTE de LICENSES: cuando DATOS
  // amplíe la lista a 8 tiers, el filtro se actualiza solo.
  // El nivel se deduce ANTES que el tier (C1): el tier automatico solo puede elegir entre
  // los que existen para ese nivel — con Foundation, 100 Mbps / 1 Gbps / ilimitado.
  const nivelTier=bundle==='onprem'?'onprem':nivelAutoEC();
  const tierAuto=tierParaCaudal(tierCaudal,nivelTier);
  // Sincronización visible con el módulo 2 (petición del dueño, 2026-09-15): la opción
  // «Automático» declara QUÉ tier está deduciendo del agregado WAN en este momento —
  // antes el usuario veía que variaba pero no cómo se calculaba.
  const opAuto=$('selTier')&&$('selTier').options[0];
  if(opAuto) opAuto.textContent=tierAuto
    ?`Automático — ${tierAuto.n} (Σ enlaces WAN del módulo 2)`
    :'Automático — deducido del caudal del sitio';
  const tManual=(SIZING.bwTiers||[]).find(t=>t.code===$('selTier').value);
  const tier=(tManual&&(!LICENSES[tManual.code]||LICENSES[tManual.code][nivelTier]))?tManual:tierAuto;
  const termYrs=parseInt($('termYears').value)||3;
  const care=$('careLevel').value;
  const qty=unidadesSitio(); // 1 ó 2 — deducido de HA, sin campo de cantidad (2026-09-15)
  // Regla HA del dueño (2026-09-17, sincronizarHaAuto): ≥2 enlaces activos, todos
  // ≥5 Gbps. Viaja en el estado para que la revisión del diseño la evalúe como DATO.
  // Solo cuentan los activos: la regla habla de enlaces que llevan tráfico a la vez, y un
  // respaldo de 5 Gbps no convierte un sitio de un enlace en uno que pide par HA.
  const haRegla=reglaHaActiva(wanLinks.filter(l=>l.rol!=='respaldo'));
  // Boost auto-dimensionado: 30 % del tráfico WAN privado, en bloques de 100 Mbps.
  // Sin suscripción no hay Boost (es un add-on suyo, no un producto independiente).
  const share=(caudalTotal>0&&breakout)?caudalEfectivo/caudalTotal:1;
  // Eje Boost: el escenario que más túnel privado pide. Sin respaldos solo existe la
  // normal, así que la cifra es la de siempre.
  const eb=ArubaReglas.escenarioBoost(escenarios,e=>motorDe(e.mpls,e.inet).distribucion.bwTunelesPrivados);
  const boostMbps=(boost&&bundle)?ArubaReglas.boostMbpsSitio({
    bwTunelesPrivados:eb.mbps, caudalTotal, users, perUser}):0;
  const bloques=(boost&&bundle)?bloquesBoost(boostMbps):0;
  return {users,aps,perUser,head,boost,fec,perfil,needProc,wanNeed,tierCaudal,
    tasaFlujos,flujosReq,tier,tierAuto,onprem,bundle,central,termYrs,care,qty,bloques,
    wanLinks,caudalTotal,mplsMbps,inetMbps,breakout,caudalEfectivo,share,boostMbps,
    ing,featurePenalty,haRegla,escenarios,respaldoMbps,escBoost:eb.escenario,tunelBoost:eb.mbps};
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
   texto:(D,m)=>`Caudal WAN insuficiente: ${m.id} publica hasta ${fmt(m.wanMax)} y el requerimiento de diseño del motor de ingeniería es ${fmt(D.wanNeed)} (ya con IMIX, FEC, seguridad y margen).`},
  // Fase 1 de la auditoria 2026-09-17 — un equipo elegido A MANO fuera de lo que el
  // dimensionador descarta se sigue cotizando, pero la revision lo dice en rojo.
  {nivel:'rojo', cuando:(D,m)=>m.fam==='ec'&&D.boost&&D.boostMbps>0&&ArubaReglas.boostRecMbps(m)!=null&&D.boostMbps>ArubaReglas.boostRecMbps(m),
   texto:(D,m)=>`Boost insuficiente: HPE recomienda optimizar hasta ${fmt(ArubaReglas.boostRecMbps(m))} en ${m.id} y la sede necesita ${fmt(D.boostMbps)} (30 % del tráfico por los túneles).`},
  {nivel:'rojo', cuando:(D,m)=>m.fam==='gw'&&!!m.sinCifraSo,
   texto:(D,m)=>`Sistema operativo: el diseño está en ${SO_NOMBRE[soMode]||soMode} y ${m.id} no tiene cifras para él — ${m.motivoSo}.`},
  {nivel:'rojo', cuando:(D,m)=>m.fam!=='ec'&&m.fw!=null&&D.needProc>m.fw,
   texto:(D,m)=>`Proceso insuficiente: ${m.id} publica ${fmt(m.fw)} de firewall y el escenario necesita ${fmt(D.needProc)}.`},
  // (La antigua alerta «HA exige exactamente 2 unidades y la cantidad es N» desapareció
  // el 2026-09-15: sin campo de cantidad, las unidades se deducen de HA — 1 ó 2 — y la
  // contradicción ya no es alcanzable.)
  // IDS/IPS no corre en EC-XS (doc oficial Orchestrator/IDS: PN 200889/200900 sin soporte;
  // en EC-V exige min. 4 vCPU y 16 GB RAM). Marcar DTD con un EC-XS seleccionado es un
  // diseno imposible — hay que subir de modelo o quitar la funcion.
  {nivel:'rojo', cuando:(D,m)=>m.fam==='ec'&&secMode==='dtd'&&!ArubaReglas.admiteDtd(m),
   texto:()=>'Dynamic Threat Defense (IDS/IPS) NO corre en EC-XS segun la documentacion oficial de HPE: sube de modelo (EC-10104 en adelante) o cambia la estrategia de seguridad.'},
  {nivel:'aviso', cuando:(D,m)=>m.fam==='ec'&&D.boost&&!D.bundle,
   texto:()=>'Boost marcado pero EXCLUIDO: es un add-on de la suscripcion EdgeConnect — sin ella no hay fabric que optimizar.'},
  {nivel:'aviso', cuando:(D,m)=>m.fam==='ec'&&secMode==='dtd'&&!D.bundle,
   texto:()=>'Dynamic Threat Defense elegido pero suscripcion EXCLUIDA: es licencia aparte, pero DE la suscripcion — sin ella no se licencia.'},
  // Fase 11: la regla de trabajo del duenyo reserva +35 % de proceso para DTD, pero HPE
  // publica para los gateways SD-Branch un throughput IDS/IPS de solo el 18-30 % (VSG SD-Branch, sep-2026) del de
  // firewall (datasheet oficial, medido con iMix). En EdgeConnect no hay cifra oficial:
  // el dimensionado ya va cargado con el 35 %, y este aviso pide no prometer de mas.
  {nivel:'aviso', cuando:(D,m)=>m.fam==='ec'&&secMode==='dtd',
   texto:()=>'DTD dimensionado con +35 % de proceso (regla de trabajo declarada). Ojo: en gateways SD-Branch HPE publica throughput IDS/IPS de solo el 18-30 % del nominal de firewall (VSG SD-Branch, sep-2026); en EdgeConnect no hay cifra oficial — si la inspeccion sera intensiva, considera un escalon mas de chasis.'},
  // Local Breakout sin Internet es una incoherencia de diseno: no hay salida local.
  {nivel:'aviso', cuando:(D,m)=>D.breakout&&D.inetMbps<=0&&D.caudalTotal>0,
   texto:()=>'Local Breakout activo pero el sitio no tiene enlace de Internet declarado: no hay salida local para el trafico SaaS — declara un DIA/banda ancha o desmarca el breakout.'},
  // M4 (auditoría 2026-09-17): la regla del brief descarga el 70 % del caudal TOTAL, MPLS
  // incluido. Cuando eso supera la capacidad de los enlaces de Internet, la descarga declarada
  // no cabe físicamente por ellos. La regla es decisión del dueño y no se toca aquí; lo que sí
  // se hace es decirlo, con las dos cifras, para que la propuesta no lo prometa.
  {nivel:'aviso', cuando:(D,m)=>D.breakout&&D.inetMbps>0&&D.ing&&D.ing.distribucion.bwLocalInternet>D.inetMbps,
   texto:(D,m)=>`Breakout por encima de Internet: el criterio de diseño 70/30 descarga ${fmt(D.ing.distribucion.bwLocalInternet)} (70 % del caudal total, MPLS incluido) y los enlaces de Internet del sitio suman ${fmt(D.inetMbps)}. El exceso (${fmt(D.ing.distribucion.bwLocalInternet-D.inetMbps)}) seguiría por el túnel: revisa la mezcla de tráfico antes de dimensionar el Boost con esta regla.`},
  // SSE con todo el trafico tunelizado al DC: el breakout es precisamente lo que da
  // sentido a la inspeccion en la nube (el trafico sale local hacia el PoP SSE).
  {nivel:'aviso', cuando:(D,m)=>secMode==='sse'&&!(D.breakout&&D.inetMbps>0),
   texto:()=>'SSE sin Local Breakout con Internet: la inspeccion en la nube rinde cuando el trafico de Internet sale LOCAL hacia el PoP SSE (tunel IPsec orquestado). Con full backhaul al DC la salida la inspeccionaria el DC, no el SSE.'},
  // El underlay declarado por debajo del trafico de aplicacion: el enlace no sostiene lo
  // que la LAN quiere enviar — hay que subir el caudal contratado o revisar el trafico.
  // M1 (auditoria 2026-09-17, corregido 2026-09-24): se comparaba contra `needProc`, que YA
  // lleva el margen de crecimiento y las penalizaciones de proceso del appliance, asi que el
  // aviso saltaba en todo escenario con margen aunque los enlaces sobraran. La demanda del
  // enlace es la de hoy: usuarios x Mbps por usuario, sin margen ni proceso.
  {nivel:'aviso', cuando:(D,m)=>D.caudalTotal>0&&D.users*D.perUser>D.caudalTotal,
   texto:(D,m)=>`El underlay en operacion normal (${fmt(D.caudalTotal)}) queda por debajo del trafico de aplicacion estimado hoy (${fmt(D.users*D.perUser)} = ${miles(D.users)} usuarios x ${D.perUser} Mbps): el enlace contratado no sostiene la demanda — sube el caudal o revisa la estimacion.`},
  // A4 (auditoría 2026-09-17): para sedes pequeñas en 9004/9012 existe Central Foundation Base
  // (JZ124AAE/JZ125AAE/JZ126AAE, documentado en aruba.js), más barata que la Foundation que se
  // cotiza. Su precio no está en la lista cargada, así que no se sustituye sola: se ofrece.
  {nivel:'aviso', cuando:(D,m)=>m.fam==='gw'&&D.central==='foundation'&&D.users>0&&!!baseParaModelo(m,D),
   texto:(D,m)=>{
     const b=baseParaModelo(m,D);
     return `Sede pequeña (${miles(D.users)} usuarios): el ${m.id} admite ${b.n}${b.sku?` (${b.sku} a ${D.termYrs} año${D.termYrs>1?'s':''})`:''}, el nivel de Central para sucursales de hasta ${b.maxClientes} dispositivos cliente y más económico que la Foundation cotizada (documento oficial de suscripciones de Central). Su precio no está en la lista cargada: confírmalo con el distribuidor antes de sustituir la línea.`;
   }},
  // M8 (auditoría 2026-09-17): el diseño SD-Branch cierra en un concentrador (VPNC) en el DC y
  // el de campus en un clúster N+1, y ninguno de los dos estaba en la propuesta ni se decía.
  // Dimensionarlos pide el agregado de todas las sedes y las cifras de túneles del VSG, que
  // este catálogo no trae: se declaran para que la propuesta de una sede no se lea como el
  // diseño completo.
  {nivel:'aviso', cuando:(D,m)=>m.fam==='gw'&&m.rol==='sucursal',
   texto:(D,m)=>{
     const n=tunelesSede(D.wanLinks);
     return `SD-Branch: los gateways de sucursal cierran sus túneles en un concentrador VPNC del datacenter, que esta lista no incluye. Esta sede abre ${n} túnel${n===1?'':'es'} SD-WAN hacia cada VPNC (uno por enlace WAN, también el de respaldo). El VPNC se elige por túneles con el agregado de todas las sedes: guarda esta sede como perfil y el consolidado lo calcula con la tabla oficial de headends del VSG.`;
   }},
  {nivel:'aviso', cuando:(D,m)=>m.fam==='gw'&&m.rol==='campus'&&D.qty<2,
   texto:(D,m)=>`Campus sin clúster: con una sola unidad no hay N+1. El diseño de campus de HPE agrupa los gateways en clúster con una unidad de reserva; marca HA para cotizar la segunda o declara que el sitio acepta el punto único de fallo.`},
  // R11/M9 (2026-09-24): el respaldo no alcanza a cubrir la caída de un activo. No bloquea —
  // un sitio puede aceptar funcionar degradado—, pero la propuesta tiene que poder decir
  // cuánto se pierde y en qué falla.
  {nivel:'aviso', cuando:(D,m)=>(D.escenarios||[]).some(e=>e.perdida>0),
   texto:(D,m)=>{
     const peor=D.escenarios.filter(e=>e.perdida>0).sort((a,b)=>b.perdida-a.perdida)[0];
     return `Continuidad parcial: si cae el enlace ${peor.enlace} (${fmt(peor.caidoMbps)}), los respaldos declarados recogen ${fmt(peor.caidoMbps-peor.perdida)} y quedan ${fmt(peor.perdida)} sin cursar hasta que vuelva. Es lo habitual con un 4G de respaldo; si el sitio necesita continuidad completa, amplía el respaldo o márcalo como activo.`;
   }},
  // M2 · Avisos de densidad de ópticas (SPEC B.3): superar las jaulas SFP del chasis no
  // descarta el modelo (siempre se puede recablear un enlace a RJ-45 o DAC), pero hay que
  // verlo antes de cotizar las ópticas.
  {nivel:'aviso', cuando:(D,m)=>SFP_DENSIDAD[m.id]!=null&&auditarPuertos(m,D.wanLinks).sfp>SFP_DENSIDAD[m.id],
   texto:(D,m)=>`Densidad de ópticas: el escenario declara ${auditarPuertos(m,D.wanLinks).sfp} enlaces SFP y ${m.id} tiene ${SFP_DENSIDAD[m.id]} jaulas — recablea algún enlace a RJ-45/DAC o revisa el medio declarado en el builder.`},
  {nivel:'aviso', cuando:(D,m)=>m.fam==='ec'&&D.bundle==='onprem',
   texto:()=>'Modalidad On-Premises: el software de Orchestrator va incluido en la suscripcion, pero el ALOJAMIENTO (VM, uptime, backup y upgrades) corre por cuenta del cliente — dimensionarlo en la propuesta.'},
  {nivel:'ok', cuando:(D,m)=>m.fam==='ec'&&D.onprem&&$('chkHa').checked&&D.qty===2,
   texto:()=>'Par HA on-prem con SKU propio: el segundo nodo lleva la suscripción HA E-STU del QuickSpecs (sección «On-Premises High Availability»); la lista la tarifa igual que la estándar (invariante verificada 2026-09-16 — pendiente #17 cerrado).'},
  // Regla HA del dueño (2026-09-17): ≥2 enlaces de ≥5 Gbps ⇒ la casa pre-marca HA 1+1.
  // Desmarcarlo es legítimo (el dueño manda), pero la decisión queda registrada aquí.
  {nivel:'aviso', cuando:(D,m)=>D.haRegla&&!$('chkHa').checked,
   texto:(D,m)=>`Sitio de ${fmt(D.caudalTotal)} agregados SIN par HA: la regla de preventa de la casa pre-marca HA 1+1 con ≥2 enlaces de ≥5 Gbps y se ha desmarcado a mano. Un único chasis es punto único de fallo para todo ese caudal — decisión aceptable si el negocio la firma, pero queda registrada.`},
  {nivel:'ok', cuando:(D,m)=>m.fam==='ec'&&D.haRegla&&$('chkHa').checked&&D.qty===2,
   texto:()=>'Par HA 1+1 (EdgeHA, diseño oficial de sucursal del VSG SD-Branch): cada transporte aterriza en un chasis del par y el enlace EdgeHA lleva los túneles de cada underlay a ambos, sin switches WAN. Ojo: HA suma disponibilidad, no caudal — el activo procesa el agregado completo y el standby solo toma el relevo en fallo, así que cada chasis está dimensionado al total del sitio.'},
  {nivel:'aviso', cuando:(D,m)=>m.id==='EC-V',
   texto:()=>'EC-V es un appliance virtual: sin soporte de hardware (el hipervisor corre por cuenta del cliente) y su caudal lo fijan la licencia y los vCPU asignados.'},
  {nivel:'aviso', cuando:(D,m)=>m.fam==='ec'&&m.wanMin!=null&&D.wanNeed>0&&D.wanNeed<m.wanMin,
   texto:(D,m)=>`Sobredimensionamiento: ${m.id} publica un suelo de ${fmt(m.wanMin)} y el requerimiento de diseño es ${fmt(D.wanNeed)} — un modelo menor sostiene el sitio y baja el tier de la suscripcion.`},
];
function revisionDiseno(D,m){
  const h=REGLAS_DISENO.filter(r=>r.cuando(D,m)).map(r=>({nivel:r.nivel,texto:r.texto(D,m)}));
  h.sort((a,b)=>(a.nivel==='rojo'?0:1)-(b.nivel==='rojo'?0:1));
  if(!h.length) h.push({nivel:'ok',texto:'Diseno coherente: cada funcion activada tiene su licencia y su calculo, y el modelo cubre el caudal y los flujos estimados.'});
  return h;
}

/* ══ M5 · WIDGET DE RENDIMIENTO #widgetPerf (SPEC B.6) ══
   Tres barras a escala común con etiquetas en Mbps: «Capacidad física» (caudalTotal de
   los enlaces declarados), «Útil tras overhead» (la paridad FEC descuenta transporte) y
   —con Boost— «Percibida con Boost» (útil × factor del perfil de datos). Los factores se
   leen de SIZING.boost.reduccion (1,3 genérico / 2,0 oficina / 1,8 repetido): el ×3,5 del
   brief quedó REFUTADO por el caso oficial HPE (Universal Health Services: ~1,8:1 para
   Veeam/CIFS) — ver el comentario de `reduccion` en aruba.js. */
function pintarWidgetPerf(D){
  const fld=$('widgetPerf'), box=$('widgetPerfBarras');
  // Ahorro del overlay por Local Breakout (M2): el hint vive siempre bajo la casilla.
  const ah=$('ahorroMpls');
  if(D.breakout&&D.inetMbps>0&&D.caudalTotal>0){
    // Distribución 70/30 sobre el caudal TOTAL (brief carrier-grade 2026-09-13): la calcula
    // el motor de ingeniería — 70 % SaaS/navegación sale local, 30 % interno hacia el DC.
    ah.innerHTML=`El breakout local descarga ≈<b>${fmt(D.ing.distribucion.bwLocalInternet)}</b> del overlay (70 % del caudal total sale local — regla del brief carrier-grade); el túnel al DC sostiene ≈<b>${fmt(D.ing.distribucion.bwTunelesPrivados)}</b>.`;
  }else if(D.breakout&&D.inetMbps<=0&&D.caudalTotal>0){
    ah.textContent='Breakout activo pero sin enlace de Internet declarado: no hay salida local — añade un DIA/banda ancha en el builder.';
  }else{
    ah.textContent='Breakout desactivado: todo el tráfico se tuneliza al datacenter (full backhaul).';
  }
  // Banner Microbranch (M1): sitio pequeño sin MPLS → la respuesta Aruba puede ser
  // Central + AP/9004 (persona Microbranch de AOS-10) en vez de un EdgeConnect dedicado.
  // Umbrales del global `microbranch` del API, con fallback 10 usuarios / 50 Mbps.
  const mb=MICROBRANCH||{usuarios:10, caudalMbps:50};
  $('bannerMicrobranch').hidden=!(D.users>0&&D.users<=mb.usuarios
    &&D.caudalTotal>0&&D.caudalTotal<=mb.caudalMbps&&D.mplsMbps===0);
  const fisico=D.caudalTotal;
  if(fisico<=0){ fld.hidden=true; box.innerHTML=''; $('widgetPerfImix').textContent=''; return; }
  const fecActivo=D.fec.pct>0;
  const util=fecActivo?fisico/(1+D.fec.pct):fisico;
  const filas=[
    {cls:'b1', lbl:D.respaldoMbps>0?'Capacidad física en operación normal (enlaces activos; el respaldo no suma)':'Capacidad física (enlaces declarados)', val:fisico},
    {cls:'b2', lbl:fecActivo?`Útil tras paridad FEC (${Math.round(D.fec.pct*100)} % — ancla VSG, FEC adaptativo)`:'Útil tras overhead (FEC desactivado)', val:util},
  ];
  if(D.boost) filas.push({cls:'b3', lbl:`Percibida con Boost (${D.perfil.factor}:1 — ${D.perfil.n.toLowerCase()})`, val:util*D.perfil.factor});
  const max=Math.max(...filas.map(f=>f.val));
  box.innerHTML=filas.map(f=>
    `<div class="bw-row ${f.cls}"><span class="bw-lbl">${f.lbl}</span>`
    +`<span class="bw-track"><i style="width:${Math.max(2,Math.round(f.val/max*100))}%"></i></span>`
    +`<span class="bw-val">${fmt(f.val)}</span></div>`).join('');
  // Requerimiento de diseño del motor de ingeniería (brief carrier-grade 2026-09-13) —
  // la nota IMIX del widget ya NO es una estimación aparte: ES la fórmula única que
  // dimensiona el appliance, declarada con sus componentes vivos:
  //   throughputDiseno = (caudal ÷ IMIX) × (1 + FEC) × (1 + seguridad) × (1 + margen).
  const TRAFICO_TXT={ENTERPRISE_MIX:'IMIX 0,70 (mezcla empresarial)',VOIP_INTENSIVE:'IMIX 0,55 (voz intensiva, paquetes pequeños)',BULK_BACKUP:'IMIX 1,00 (backup/réplica masiva)'};
  const traficoV=($('selTrafico')&&$('selTrafico').value)||'ENTERPRISE_MIX';
  const fecV=$('fecMode').value;
  const fecTxt=fecV==='off'?'FEC 5 % (base, sin paridad)':fecV==='alto'?'FEC 25 % (alta pérdida LTE/satélite)':'FEC 15 % (activo)';
  const segTxt=secMode==='dtd'?'+35 % NGFW/DPI local (DTD)':secMode==='sse'?'+5 % SSE en la nube':'+0 % (sin inspección extra)';
  const margenTxt=`margen ${Math.round(parseFloat($('head').value)||0)} %`;
  const imix=D.ing.throughputDisenoMbps;
  $('widgetPerfImix').innerHTML=`Motor de ingeniería (fórmula única del brief carrier-grade): el chasis debería sostener ≈<b>${fmt(imix)}</b> `
    +`= caudal ÷ ${TRAFICO_TXT[traficoV]||TRAFICO_TXT.ENTERPRISE_MIX} × (1 + ${fecTxt}) × (1 ${segTxt}) × (1 + ${margenTxt})`
    +(D.featurePenalty>1?`, más los multiplicadores de función (×${D.featurePenalty.toFixed(2)}): requerimiento final ≈<b>${fmt(D.wanNeed)}</b>`:'')
    +`. El throughput así obtenido se compara contra el NOMINAL publicado del modelo — el IMIX ya va dentro (sin doble conteo).`
    +` La reserva FEC del motor (${Math.round(D.ing.traza.overheadFEC*100)} %) es la del brief y va por encima del ancla VSG de la barra «Útil» a propósito: la paridad real depende de la pérdida medida en cada enlace.`;
  fld.hidden=false;
}

function render(){
  if(!datosListos) return; // M5: sin catálogo no hay nada que dimensionar (ver datosListos)
  // HA pre-marcado PRIMERO (regla del dueño, 2026-09-17): las unidades, la revisión del
  // diseño y el BOM se derivan de la casilla ya ajustada — si se aplicara después del
  // estado derivado, el primer repintado cotizaría 1 unidad con la casilla marcada.
  sincronizarHaAuto();
  // Sistema operativo de los gateways (C2/C3): se superpone ANTES de derivar nada — la
  // capacidad que ven el filtro, la ficha y el BOM es la del SO elegido.
  aplicarSo();
  // Todo lo calculable sale del estado derivado: una sola fuente para el dimensionador,
  // la ficha y el BOM (2026-09-13, refactor arquitectónico).
  const D=estadoDerivado();
  const {users,aps,head,boost,fec,perfil,needProc,wanNeed,tasaFlujos,flujosReq,tier}=D;
  // Barra agregada del underlay (etapa A): viva en cada cambio, aunque no haya
  // recomendación todavía — es el espejo de lo que el builder está declarando.
  pintarWanResumen();
  // El chooser de ópticas NO se pinta aquí: lee el modelo de #pickModel y el combo se
  // repuebla al final de cada rama del render (poblarPickModel) — pintarlo antes lo
  // dejaba un render ATRÁS (con el modelo del render anterior; lo pescó la fila de la
  // interconexión EdgeHA, 2026-09-17). Vive al final de poblarPickModel.
  // SSE licencia POR USUARIO (petición del dueño, 2026-09-15): con esa estrategia, el
  // campo de usuarios deja de ser opcional — se marca en ámbar mientras esté vacío y la
  // línea del BOM queda «PENDIENTE» en vez de cotizar una licencia inventada.
  {
    const faltaUsers=secMode==='sse'&&!(parseInt($('users').value)>0);
    const fldUsers=$('users').closest('.field');
    if(fldUsers) fldUsers.classList.toggle('req-sse',faltaUsers);
    const tag=$('usersReqTag');
    if(tag) tag.hidden=!faltaUsers;
  }
  // M5 · Widget de rendimiento + hint de ahorro por breakout + banner Microbranch: se
  // pinta siempre que haya cifras, y se oculta solo cuando no hay nada que mostrar.
  pintarWidgetPerf(D);
  // Sin enlaces declarados Y sin estimación por usuarios no hay recomendación (regla de
  // preventa): el underlay WAN o el tráfico estimado son el dato mínimo; sin ninguno de
  // los dos la página pide valores en vez de proponer a ciegas.
  if(D.caudalTotal<=0&&needProc<=0){
    lastPick=null; sincronizarConBom(null);
    poblarPickModel([], null);
    $('alertaEscalado').hidden=true;
    const need=$('need'); need.style.left='0%'; $('needLbl').textContent='—';
    $('track').querySelectorAll('.dot,.tick,.pickLabel').forEach(e=>e.remove());
    FICHA.render({...FICHA_CFG, contenedor:'verdict', candidatos:[], recomendado:null,
      vacioTitulo:'Ingrese valores para recomendar un equipo',
      vacioDetalle:'<p style="margin:0;font-size:13.5px">Declare los <b>enlaces WAN</b> del sitio en el builder (y si aplica, usuarios y APs) para que el dimensionador proponga los modelos que cumplen.</p>'});
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
  // M3: el hint dice las dos cifras — la paridad del ancla VSG y la reserva del motor que dimensiona.
  $('fecHint').textContent=`${fec.d} Para dimensionar, el motor reserva ${Math.round(D.ing.traza.overheadFEC*100)} % (regla del brief carrier-grade).`;

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
    // Semáforo del punto: ver capacidadComparable — EdgeConnect compara contra el
    // nominal (el requerimiento ya trae el IMIX del motor), gateways con ×0,70.
    dot.className='dot'+(capacidadComparable(m)>=needDe(m)?' ok':'');
    if(lastPick&&m.id===lastPick.id)dot.className='dot pick';
    dot.style.left=pct+'%';dot.title=m.id+': '+fmt(cap);
    track.appendChild(dot);
  });

  let outByBoost=0,outByClients=0,outByAps=0,outBySinDato=0,outByFlujos=0,outByPersona=0,outByPuertos=0,sobrado=[];
  // Fase 1 de la auditoria 2026-09-17: tres descartes nuevos, cada uno con su porque.
  const outBySo=[], outByDtd=[], outByBoostRec=[];
  // A7 (2026-09-24): chasis sin jaulas SFP ante enlaces de fibra (fuera del caso EC-10104).
  const outBySinSfp=[];
  // gwsec (2026-09-24): gateways sin nivel «+ Security» en el documento oficial (7000/7200),
  // y los que no llegan (o no publican) el throughput de IDS/IPS del VSG.
  const outBySinSec=[], outByIds=[];
  // M2 · Auditoría de puertos (SPEC B.3): el EC-10104 (4× RJ-45, sin SFP) queda descartado
  // si los enlaces declarados no caben en sus puertos o alguno es óptico. Se anota si el
  // modelo habría sido candidato sin esta regla: es lo que dispara #alertaEscalado.
  let ec10104Descartado=false;
  const candidates=MODELS.filter(m=>{
    if(!coincideFiltro(m,famMode)) return false;
    // Arquetipo de sede (fase 11): restringe el catalogo a los modelos que el VSG
    // posiciona para ese tamanyo de sitio. Libre = no restringe.
    if(personaMode!=='auto'&&personaMode!=='micro'&&PERSONA_MODELOS[personaMode]
      &&!PERSONA_MODELOS[personaMode].includes(m.id)){ outByPersona++; return false; }
    if(boost&&m.boostMax==null){ outByBoost++; return false; }
    // A1: Dynamic Threat Defense solo corre en EdgeConnect y NO en EC-XS (`dtd:false`, doc
    // oficial de IDS/IPS). Antes era un aviso rojo debajo de un EC-XS que seguía saliendo
    // RECOMENDADO y cotizaba la licencia DTD.
    if(secMode==='dtd'&&!ArubaReglas.admiteDtd(m)){ if(m.fam==='ec') outByDtd.push(m.id); return false; }
    // IDS/IPS en el gateway (gwsec, 2026-09-24): solo los gateways cuya serie tiene nivel
    // «+ Security» en el documento oficial de Central (9000, 9100, 9200). EdgeConnect lo hace
    // con DTD y la línea 7000/7200 no tiene ese nivel.
    if(secMode==='gwsec'&&(m.fam==='ec'||!centralParaModelo(m, 'foundation', 1, true))){ if(m.fam!=='ec') outBySinSec.push(m.id); return false; }
    // Y el eje de IDS/IPS con la cifra oficial del VSG (idsMbps), con la misma degradación
    // IMIX que el firewall del gateway. Sin cifra publicada (9004-LTE) no se afirma que cumpla:
    // se aparta con su motivo, nunca con la cifra de firewall ni con la de su hermano.
    if(secMode==='gwsec'&&m.fam==='gw'){
      if(m.idsMbps==null){ outByIds.push({id:m.id, motivo:'sin cifra de IDS/IPS en el VSG'}); return false; }
      if(m.idsMbps*IMIX_FACTOR<needProc){ outByIds.push({id:m.id, motivo:`IDS/IPS ${fmt(m.idsMbps)} (×${IMIX_FACTOR} IMIX) por debajo de ${fmt(needProc)}`}); return false; }
    }
    // C2/C3: un gateway sin cifras para el SO elegido (9114 en AOS 8, series 7000/7200 en
    // AOS 10) no puede afirmarse que cumpla — se descarta y se dice por qué.
    if(m.sinCifraSo){ outBySo.push(m); return false; }
    // EC-V no publica rango: se dimensiona por licencia y vCPU, no por hardware.
    if(m.fam==='ec'&&m.wanMax==null) return false;
    const cap=capacidadMax(m);
    // Sin cifra publicada no se puede afirmar que cumpla: se descarta y se explica, en
    // vez de colarlo con un numero inventado o de omitirlo en silencio.
    if(cap==null){ outBySinDato++; return false; }
    // Factor IMIX (regla de trabajo del duenyo): la mezcla real de trafico rinde menos
    // que el UDP de laboratorio. En EdgeConnect la degradación vive YA en el
    // requerimiento del motor de ingeniería (÷IMIX según perfil) y se compara contra el
    // nominal; en gateways se conserva el ×0,70 del lado capacidad (ver
    // capacidadComparable — brief carrier-grade 2026-09-13, sin doble conteo).
    if(capacidadComparable(m)<needDe(m)) return false;
    const cMax=clientesMax(m), aMax=apsMax(m);
    if(cMax!=null&&users&&cMax<users){ outByClients++; return false; }
    if(aMax!=null&&aps&&aMax<aps){ outByAps++; return false; }
    // Flujos simultáneos: el chasis debe soportar con holgura los flujos calculados.
    // null (EC-V, 9240) = la fuente no publica el dato: no descarta, se declara.
    const fl=flujosDe(m);
    if(flujosReq>0&&fl!=null&&fl<flujosReq){ outByFlujos++; return false; }
    // C4: el Boost que necesita la sede no puede superar el que HPE recomienda optimizar
    // en ese appliance (EC-10104 200 Mbps, EC-S 500 Mbps, EC-M 1 Gbps…). null = sin dato
    // publicado: no descarta, se declara.
    if(boost&&m.fam==='ec'&&D.boostMbps>0){
      const rec=ArubaReglas.boostRecMbps(m);
      if(rec!=null&&D.boostMbps>rec){ outByBoostRec.push(m.id); return false; }
    }
    // Auditoría de puertos EC-10104: la regla se evalúa AL FINAL para saber si el modelo
    // habría cumplido todo lo demás (y por tanto el dimensionador está escalando por
    // densidad de puertos u ópticas, no por capacidad).
    if(m.id==='EC-10104'){
      // La MISMA regla del semáforo de #wanResumen (evaluarPuertos), no una copia.
      if(evaluarPuertos(m,D.wanLinks).nivel==='rojo'){ outByPuertos++; ec10104Descartado=true; return false; }
    }else if(evaluarPuertos(m,D.wanLinks).nivel==='rojo'){ outBySinSfp.push(m.id); return false; }
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
    /* Desbordamiento de la línea EdgeConnect (reporte del dueño, 2026-09-16): con enlaces
       de gran capacidad (p. ej. 5000+5000 Mbps) el requerimiento de diseño del motor —ya
       con IMIX, FEC, seguridad y margen— supera el techo que HPE publica para TODA la
       familia. No es un hueco del catálogo: las cifras wanMin/wanMax se reverificaron
       contra el QuickSpecs oficial a50004289enw V18 (06-jul-2026, p.30 y fichas por
       modelo) y coinciden — EC-10108 «2-2000 Mbps», EC-10150 «Up to 12 Gbps». Proponer un
       appliance igualmente sería afirmar una capacidad que la fuente oficial no publica;
       lo que corresponde es declarar la salida de arquitectura completa, con las vías que
       sí sostiene la documentación. El texto toma el modelo y el techo de los DATOS
       (guardia en test/aruba-techo-ec.test.js), no de literales escritos a mano. */
    const topeEC=MODELS.filter(m=>m.fam==='ec'&&m.wanMax!=null).sort((a,b)=>b.wanMax-a.wanMax)[0]||null;
    const techoEC=topeEC?topeEC.wanMax:0;
    const desbordaLineaEC=wanNeed>0&&techoEC>0&&wanNeed>techoEC&&(famMode==='ec'||famMode==='any');
    if(desbordaLineaEC){
      // Con las hipótesis del motor al mínimo (perfil «backup/réplica» → IMIX 1,00; FEC
      // desactivado → overhead base 5 %; margen 0 %) el requerimiento baja a ≈ caudal
      // físico × 1,05 × penalización de función. Solo si ESA cifra entra en el techo se
      // señala el EC-10150 como viable tras revisar hipótesis — nunca por omisión.
      const reqMin=Math.ceil(D.caudalTotal*1.05)*D.featurePenalty;
      const salidas=[
        '<b>EC-V en el hub o datacenter:</b> sin techo de hardware publicado — el caudal lo fijan el tier de la suscripción (la escalera oficial llega a «Sin límite de caudal») y los vCPU del hipervisor; la guía oficial de despliegue exige Accelerated Networking (SR-IOV) para alcanzar el throughput máximo. El dimensionado exacto se confirma con HPE.',
        '<b>Repartir el fabric entre varios appliances:</b> cada chasis sostiene el underlay que termina en él — dos EC-10150 repartiendo enlaces u overlays cubren el sitio sin violar ninguna cifra publicada.',
        // Lo que NO es salida (2026-09-17, validación de arquitectura pedida por el
        // dueño): el par HA. EdgeHA es el diseño oficial de sucursal —cada transporte
        // aterriza en un chasis y el enlace EdgeHA lleva los túneles de cada underlay a
        // ambos (VSG SD-Branch, fig. «EC HA»)—, pero el VRRP manda TODO el tráfico al
        // activo y el standby solo toma el relevo en fallo («traffic is sent there only
        // during an outage», mismo VSG): cada chasis del par se dimensiona al agregado
        // completo. HA suma disponibilidad, no caudal — no divide el requerimiento.
        '<b>Lo que NO resuelve el desbordamiento: el par HA.</b> EdgeHA (cada WAN a un chasis, enlace EdgeHA entre ellos — diseño oficial de sucursal del VSG SD-Branch) suma <b>disponibilidad, no caudal</b>: el tráfico lo procesa el activo y el standby solo toma el relevo en fallo, así que cada chasis del par debe sostener el agregado completo. Con HA marcado la lista cotiza las 2 unidades con su SKU HA, pero el dimensionado no se divide entre los dos.',
        reqMin<=techoEC
          ?`<b>Revisar las hipótesis del motor:</b> perfil «backup/réplica masiva» (IMIX 1,00), FEC desactivado (enlaces limpios) y margen 0 % dejarían el requerimiento en ≈<b>${fmt(reqMin)}</b> — dentro de los ${fmt(techoEC)} publicados. Cada hipótesis relajada es una decisión de riesgo que hay que saber defender: el margen es el ancla del SLA de enlace al 75 % de la guía SD-Branch.`
          :'<b>Revisar las hipótesis del motor</b> (perfil de tráfico, FEC, margen) reduce el requerimiento, pero ni con todo al mínimo entra en el techo publicado — la salida es EC-V o el reparto del fabric, no un solo appliance.',
        `<b>Selección deliberada:</b> el ${topeEC.id} sigue en el selector de modelo — elegirlo cotiza la lista de materiales con su SKU (${topeEC.hwSku||'consultar'}) y la revisión del diseño marca el exceso de caudal en rojo, con las cifras encima de la mesa.`,
      ];
      /* Traza aritmética VIVA (plan 15, generalizada en el 16): la cuenta del motor,
         factor a factor, para que el veredicto se lea como ingeniería declarada y no
         como «no hay equipos disponibles» — la confusión real que generó un
         diagnóstico de «bug de filtrado por tipo de despliegue» sobre este mismo
         veredicto. La construye el helper compartido `trazaMotorHtml` (mismo texto
         en la ficha del camino feliz); sin enlaces declarados el requerimiento sale
         de la fórmula histórica y la traza no corresponde. */
      const trazaMotor=trazaMotorHtml(D,wanNeed);
      why.push(`<li><b>El requerimiento (${fmt(wanNeed)}) supera el techo oficial de toda la línea EdgeConnect.</b>${trazaMotor} El modelo más capaz, el <b>${topeEC.id}</b>, publica <b>${fmt(techoEC)}</b> de caudal WAN («Up to 12 Gbps», QuickSpecs a50004289enw V18, p.30 — cifra bidireccional según la nota 3 de la propia tabla). Ningún appliance EdgeConnect lo cubre en solitario. Las salidas que sí sostiene la fuente oficial:<ul style="margin:6px 0 0;padding-left:18px">${salidas.map(s=>`<li>${s}</li>`).join('')}</ul></li>`);
    }
    // Cumplir por capacidad no basta si el equipo ya no se puede pedir: es el caso del
    // EC-XL (fin de venta 2026-03-31, política oficial de ciclo de vida de EdgeConnect).
    // Se nombra y se deja como referencia, no se cuela como propuesta.
    const eolQueCumplen=candidates.filter(m=>FICHA.recomendable&&!FICHA.recomendable(m));
    if(eolQueCumplen.length) why.push(`<li><b>${eolQueCumplen.map(m=>m.id).join(', ')}</b> cumple${eolQueCumplen.length>1?'n':''} por capacidad pero está${eolQueCumplen.length>1?'n':''} <b>fuera de venta</b> (último pedido ${eolQueCumplen.map(m=>m.eolAnnounced&&m.eolAnnounced.lastOrder?m.eolAnnounced.lastOrder:'declarado').join(', ')}). Queda en el selector como referencia para parque instalado; la notificación oficial de fin de venta nombra el reemplazo — confirmarlo con el distribuidor.</li>`);
    if(outByPersona) why.push(`<li><b>${outByPersona}</b> modelo(s) fuera del arquetipo de sede elegido: el VSG posiciona otros modelos para este tamaño de sitio. Cambia el arquetipo a «Libre» para recorrer todo el catálogo.</li>`);
    if(outByDtd.length) why.push(`<li><b>${outByDtd.join(', ')}</b> descartado(s): Dynamic Threat Defense (IDS/IPS en el chasis) no corre en ese modelo según la documentación oficial de HPE.</li>`);
    if(outByBoostRec.length) why.push(`<li><b>${outByBoostRec.join(', ')}</b> descartado(s) por Boost: la sede necesita optimizar <b>${fmt(D.boostMbps)}</b> y HPE recomienda menos en ese appliance.</li>`);
    if(outBySo.length) why.push(`<li><b>${outBySo.length}</b> gateway(s) sin cifras para ${esc(SO_NOMBRE[soMode]||soMode)}: ${outBySo.map(m=>`<b>${esc(m.id)}</b> (${esc(m.motivoSo)})`).join('; ')}. Cambia el sistema operativo en el panel 1 si el diseño es para la otra arquitectura.</li>`);
    if(outByBoost) why.push(`<li><b>${outByBoost}</b> modelo(s) descartado(s) por pedir Boost: la optimización WAN es exclusiva de EdgeConnect, los gateways de las series 9000, 9100 y 9200 no la hacen.</li>`);
    if(outByClients) why.push(`<li><b>${outByClients}</b> gateway(s) descartado(s) por capacidad de clientes: hacen falta ${miles(users)}.</li>`);
    if(outByAps) why.push(`<li><b>${outByAps}</b> gateway(s) descartado(s) por número de APs: hacen falta ${miles(aps)}.</li>`);
    if(outByFlujos) why.push(`<li><b>${outByFlujos}</b> modelo(s) descartado(s) por flujos simultáneos: el perfil de entorno estima ${miles(flujosReq)} flujos activos (${miles(users)} usuarios × ${tasaFlujos}/usuario). Bajar el perfil o repartir la carga entre dos sitios son las salidas.</li>`);
    if(outByPuertos) why.push(`<li><b>EC-10104</b> descartado por la auditoría de puertos: los enlaces declarados necesitan más de 4 puertos o alguno es óptico (SFP) y el 10104 solo trae 4× RJ-45. El escalón superior (EC-10106) ya añade jaulas SFP+.</li>`);
    if(outBySinSec.length) why.push(`<li><b>${outBySinSec.map(esc).join(', ')}</b> descartado${outBySinSec.length>1?'s':''} para IDS/IPS en el gateway: su serie no tiene nivel «+ Security» de Central en el documento oficial de HPE (solo 9000, 9100 y 9200).</li>`);
    if(outByIds.length) why.push(`<li>Por el eje de IDS/IPS (cifra oficial del VSG SD-Branch): ${outByIds.map(x=>`<b>${esc(x.id)}</b> — ${esc(x.motivo)}`).join('; ')}.</li>`);
    if(secMode==='gwsec'&&famMode==='ec') why.push('<li>IDS/IPS en el gateway no aplica a EdgeConnect (allí la vía es Dynamic Threat Defense): con la familia en EdgeConnect no queda ningún candidato.</li>');
    if(outBySinSfp.length) why.push(`<li><b>${outBySinSfp.map(esc).join(', ')}</b> descartado${outBySinSfp.length>1?'s':''} por la auditoría de puertos: los enlaces de fibra declarados no caben en sus jaulas — sin SFP, o sin SFP28 para los de 25G — según su ficha y su matriz oficial de ópticas.</li>`);
    if(outBySinDato) why.push(`<li><b>${outBySinDato}</b> modelo(s) sin cifra de throughput publicada en las fuentes consultadas (serie 9100). Aparecen en la pestaña "Equipo y BOM" y su capacidad hay que confirmarla en las QuickSpecs.</li>`);
    // La salida genérica «por encima del catálogo» queda absorbida por el bloque de
    // desbordamiento cuando es ese el caso — repetirla sería ruido debajo de la versión
    // completa, con cifras y vías oficiales.
    if(!desbordaLineaEC) why.push('<li>Por encima del catálogo: repartir el fabric en varios head-ends, o escalar en el datacenter con EC-V, cuyo caudal lo fija la licencia y los vCPU asignados y no el hardware.</li>');
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
      // La traza del motor sustituye a la enumeración en prosa cuando hay enlaces
      // declarados (plan 16): la MISMA cuenta, con los factores vivos, que pinta el
      // veredicto de desbordamiento. Sin enlaces se conserva la prosa (la fórmula
      // histórica no tiene traza del motor que mostrar).
      flags.push(`<b>Caudal WAN a contratar:</b> ${fmt(D.ing.tierLicenciaBwRequerido||wanNeed)} — el tier de la suscripción se tasa por el ancho de banda físico agregado (brief carrier-grade). El requerimiento de diseño del appliance es ${fmt(wanNeed)}.${trazaMotorHtml(D,wanNeed)||' El motor de ingeniería aplica el IMIX del perfil de tráfico, la paridad FEC del modo elegido, la estrategia de seguridad y el margen de crecimiento.'}${boost?` Con la reducción ${perfil.factor}:1 de Boost sobre ${esc(perfil.n.toLowerCase())} en el caudal derivado.`:''} Tier de suscripción: <b>${tier?esc(tier.n):'—'}</b>.`);
      if(boost&&D.bloques){
        const rec=ArubaReglas.boostRecMbps(m);
        flags.push(`<b>Boost auto-dimensionado:</b> se licencia el 30 % del tráfico WAN privado que viaja por los túneles (${D.caudalTotal>0?`${fmt(D.tunelBoost)}${D.escBoost.id!=='normal'?` si cae el enlace ${D.escBoost.enlace}: su carga la recoge el respaldo y, sin Internet, el breakout ya no descarga el túnel — es el escenario que más túnel pide`:D.breakout&&D.inetMbps>0?' tras la descarga del breakout — regla 70/30 del brief':''}`:`${fmt(D.users*D.perUser)} de demanda estimada`}) = <b>${fmt(D.boostMbps)}</b>, en bloques de ${SIZING.boost.bloque} Mbps que forman un pool del fabric — para esta sede, <b>${D.bloques} bloque(s)</b>. Es tráfico actual: el pool se reasigna en minutos, así que no lleva margen de crecimiento.${rec!=null?` HPE recomienda Boost hasta <b>${fmt(rec)}</b> en el ${esc(m.id)}.`:''}`);
      }
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
    if(secMode==='dtd') flags.push('<b>Dynamic Threat Defense:</b> IDS/IPS, DDoS adaptativo y clasificación web son una licencia opcional APARTE de Foundation y Advanced (QuickSpecs p.32). Está en la lista de precios vigente (escalera plana por appliance, 1/3/5 años — verificada 2026-09-14): entra en la lista de materiales con su SKU y su List Price. El dimensionado reserva un 35 % adicional de proceso para la inspección (regla de trabajo declarada — ver la revisión del diseño).');
    if(secMode==='gwsec') flags.push('<b>IDS/IPS en el gateway:</b> la suscripción de Central pasa a «+ Security» (IDS/IPS, antimalware y panel de seguridad), con el SKU oficial de la serie del gateway. El equipo se dimensiona contra su throughput de IDS/IPS oficial (VSG SD-Branch, sep-2026), con la misma degradación IMIX que el firewall — en estos gateways la inspección rinde entre el 18 % y el 30 % del firewall publicado.');
    if(secMode==='sse') flags.push('<b>HPE Aruba Networking SSE:</b> la inspección se hace en la nube — ZTNA, SWG, CASB y DEM en suscripción <b>por usuario</b> (paquetes oficiales Foundation ZTNA / Foundation SWG / Foundation Plus / Advanced / Advanced Plus, QuickSpecs SSE a50009212enw). El appliance monta los túneles IPsec orquestados hacia el SSE y AppExpress elige el mejor PoP. Entra en la lista como «consultar»: HPE no publica List Price de SSE.');
    if(cap!=null) flags.push(m.fam==='ec'
      ?`<b>Mezcla de tráfico (IMIX):</b> el requerimiento ya viene degradado por el motor de ingeniería (÷IMIX según el perfil de tráfico, más FEC, seguridad y margen), así que se compara contra el throughput NOMINAL publicado — sin volver a aplicar un 70 % al chasis (regla única del brief carrier-grade 2026-09-13; HPE no publica el delta entre laboratorio y mezcla real). Este modelo queda al ${Math.round(req/cap*100)} % de su capacidad nominal.`
      :`<b>Capacidad efectiva (IMIX):</b> el dimensionador exige que el requerimiento quepa en el 70 % del throughput nominal (regla de trabajo declarada — HPE no publica el delta entre laboratorio y mezcla real de Internet). Este modelo queda al ${Math.round(req/(cap*IMIX_FACTOR)*100)} % de su capacidad efectiva.`);
    if(m.legacy) flags.push('<b class="warn">Línea anterior (AOS 8):</b> las series 7000 y 7200 siguen en canal y son la respuesta natural para <b>ampliar un parque ya instalado</b>, pero para un despliegue nuevo conviene contrastar con la generación actual (series 9000/9100/9200 sobre AOS 10).');
    if(m.fam==='gw'&&m.rol==='sucursal'&&!m.legacy) flags.push(`<b>Sucursal:</b> el mismo equipo termina la WAN y hace de controladora de APs (hasta ${miles(m.aps)}), aplicando Dynamic Segmentation con el rol que traen el switch CX o el AP. No hace optimización WAN.`);
    if(m.fam==='gw') flags.push(`<b>Central ${nivelAutoCentral()==='advanced'?'Advanced':'Foundation'}:</b> ${nivelAutoCentral()==='advanced'?'deducido de las funciones marcadas (segmentación de extremo a extremo o AIOps ampliada)':'gestión SD-Branch completa — firewall, VPN y políticas por aplicación ya son Foundation, sin funciones que fuercen el nivel superior'}.`);
    if(m.licCap&&nivel) flags.push(`<b>Capacidad por licencia (${esc(SO_NOMBRE[soMode]||soMode)}):</b> escala sin cambiar de hardware. Para ${fmt(req)} hace falta el nivel <b>${esc(nivel.n)}</b> (${fmt(nivel.fw)}, ${miles(nivel.aps)} APs, ${miles(nivel.clients)} dispositivos).${soMode==='aos10'&&nivel.code!=='hw'?' En AOS 10 las licencias Silver y Gold no admiten IDPS (HPE, «AOS 10 Capacity Licenses»).':''}`);
    // M2 · Aviso de densidad de ópticas (SPEC B.3), visible en la ficha — la misma regla
    // va además a la «revisión del diseño» de la exportación (REGLAS_DISENO).
    const sfpN=auditarPuertos(m,D.wanLinks).sfp;
    if(SFP_DENSIDAD[m.id]!=null&&sfpN>SFP_DENSIDAD[m.id])
      flags.push(`<b class="warn">Densidad de ópticas:</b> el escenario declara ${sfpN} enlaces SFP y ${m.id} tiene ${SFP_DENSIDAD[m.id]} jaulas — recablea algún enlace a RJ-45/DAC o revisa el medio declarado en el builder.`);
    // M4 · EC-10150: doble PSU de fábrica (texto informativo, SPEC B.5) — no hay segunda
    // fuente que cotizar, a diferencia del Gateway 9240, que sí la ofrece (#chkDualPsu).
    if(m.id==='EC-10150') flags.push('<b>Alimentación:</b> el EC-10150 lleva <b>doble PSU redundante de fábrica</b> — no hay segunda fuente que cotizar. Lo que sí puede necesitar es el kit Network Memory S2N67A si se licencia Boost por encima de 1 Gbps (el motor lo añade solo).');
    if($('chkHa').checked) flags.push(m.fam==='ec'&&!D.onprem
      ?'<b>HA 1+1:</b> el par se cotiza 1× suscripción estándar + 1× suscripción de alta disponibilidad para el segundo nodo (SKU «HA» propio del QuickSpecs; la lista de precios documentada lo tarifa igual que el estándar).'
      :'<b>HA:</b> se cotizan 2 unidades y cada una lleva su propia suscripción de sitio.');
    return `<ul style="margin:8px 0 0;padding-left:18px;font-size:13.5px">
      <li>Requerimiento <b>${fmt(req)}</b> contra capacidad <b>${fmt(cap)}</b> — headroom ${Math.round((1-req/cap)*100)}%.${m.fam==='gw'?trazaProcesoHtml(D):''}</li>
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
      // C4: la barra de Boost muestra el Boost RECOMENDADO por HPE (spec.boostRec), no el
      // techo WAN que guardaba boostMax — el EC-S decía «3 Gbps con Boost» cuando HPE
      // recomienda optimizar hasta 500 Mbps.
      {const rec=ArubaReglas.boostRecMbps(m); if(rec!=null) html+=barra('Boost recomendado por HPE',rec,tope,boost);}
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
    // «Interfaces» sale de esta sección (2026-09-17, validación del dueño — información
    // redundante): la misma cadena m.ifaces la pintaba OTRA VEZ la sección dedicada
    // «Configuración de puertos» (FICHA.seccionPuertos, rama de texto libre), que además
    // declara la procedencia del dato. Una sola vez y en su sección.
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

    /* ══ ASISTENTE DE CABLEADO DEL PAR EdgeHA (mejora propuesta y aceptada por el dueño,
       2026-09-17) ══
       Con HA marcado y ≥2 enlaces WAN activos, la ficha pinta QUÉ enlace va a QUÉ chasis.
       El patrón es el diseño oficial de sucursal del VSG SD-Branch (fig. «EC HA», copia
       local en el repo): «two EdgeConnect instances, each connected with a single WAN
       link to two different underlay networks… The EdgeConnect appliances are
       interconnected with an EdgeHA link that enables tunnels for each underlay network
       to connect to both appliances» — sin switches WAN. Con más de dos transportes el
       reparto A/B alterno EXTIENDE el patrón (no hay figura oficial para tres o más) y
       la nota lo declara. Lo que NO hace: proponer SKU para la interconexión — el VSG
       no lo fija y aquí no se inventa (regla de las ópticas pendientes de siempre). */
    const seccionEdgeHA=()=>{
      const enlaces=parEdgeHA(esEC, unidades, leerWanLinks()); // predicado único, ver arriba
      if(!enlaces) return [];
      const pickSfp=leerSfpPick();
      const filas=enlaces.map((l,i)=>{
        const nodo=i%2===0?'Nodo A':'Nodo B';
        let medioTxt;
        if(MEDIOS_OPTICA[l.medio]){
          const {ops,sku}=opticaResuelta(m.id,l.medio,pickSfp);
          medioTxt=!ops.length
            ?`<span class="warn">${esc(m.id)} no admite ópticas ${esc(l.medio)} — revisar el medio declarado o el modelo</span>`
            :(sku
              ?`óptica ${esc(l.medio)} <code>${esc(sku)}</code> ×1${ops.length>1?' (la elegida en el builder WAN)':' (única compatible)'}`
              :`óptica ${esc(l.medio)} <span class="warn">por elegir en el builder WAN</span> — hay ${ops.length} compatibles`);
        }else{
          medioTxt=`puerto ${esc(l.medio)} del chasis (cobre — sin óptica que pedir)`;
        }
        return [`WAN ${i+1} · ${esc(l.tipo)} ↓${fmt(l.down)}`, `<b>${nodo}</b> — ${medioTxt}`, true];
      });
      // La interconexión refleja lo que la lista de materiales cotiza (pendiente #7):
      // óptica elegida, pendiente de elegir, o declarada sin SKU cuando el catálogo no
      // cubre el agregado. La velocidad recomendada es la regla declarada de la casa.
      const agregado=enlaces.reduce((s,l)=>s+l.down,0);
      const velHA=velocidadEdgeHA(m.id, agregado);
      const opsHA=velHA?opticasPorVelocidad(m.id, velHA):[];
      const pickHA=pickSfp.EdgeHA;
      const skuHA=pickHA&&opsHA.some(o=>o.sku===pickHA)?pickHA:(opsHA.length===1?opsHA[0].sku:null);
      filas.push(['Enlace EdgeHA (interconexión del par)',
        'Puerto libre en <b>cada</b> chasis, cableado directo entre ambos (sin switch): por él viajan los túneles de CADA underlay hacia los dos appliances. '
        +(skuHA
          ?`Óptica <code>${esc(skuHA)}</code> ×2 — la elegida en el builder WAN, ya cotizada en la lista de materiales.`
          :(velHA&&opsHA.length
            ?`Velocidad recomendada <b>${esc(velHA)}</b> (≥ agregado del sitio, ${fmt(agregado)} — regla declarada de la casa): <span class="warn">óptica por elegir en el builder WAN</span>; la línea ya está declarada en la lista de materiales. Si queda cobre libre, un latiguillo la resuelve sin ópticas.`
            :`<span class="warn">El agregado del sitio (${fmt(agregado)}) supera las ópticas del catálogo para este modelo</span> — cobre directo si quedan puertos libres, o confirmar la óptica con HPE; la línea está declarada en la lista de materiales. Sin SKU inventado.`)), true]);
      return [{titulo:'Cableado del par EdgeHA', filas,
        nota:'Diseño oficial de sucursal del VSG SD-Branch (fig. «EC HA»): cada transporte aterriza en un chasis del par — «no WAN-side switches are required». Activo/standby: el activo procesa el agregado completo y el standby toma el relevo en fallo (métrica OSPF mayor en el standby, para evitar ECMP). HA suma <b>disponibilidad, no caudal</b>.'
        +(enlaces.length>2?' Con más de dos transportes, el reparto A/B alterno <b>extiende</b> el patrón de la figura — asignación propuesta, no prescrita por el VSG.':'')}];
    };

    return [
      capacidadPublicadaDe(m),
      {titulo:'Características del equipo', filas:caract},
      {titulo:'Ficha técnica', filas:tecnica},
      FICHA.seccionPuertos(m),
      FICHA.seccionAlimentacion(m),
      ...seccionEdgeHA(),
      {titulo:'Suscripción y licencias',
       filas:[['Unidades a licenciar', unidades===2
         ?(esEC
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
  let mManual=$('pickModel').dataset.bomManual==='1'
    ?(MODELS.find(x=>x.id===$('pickModel').value)||null):null;
  // M2 · Escalado por auditoría de puertos (SPEC B.3): si el EC-10104 habría cumplido por
  // capacidad pero los enlaces no le caben, el dimensionador escala al escalón superior.
  // La alerta solo se muestra cuando el escalado es real: el 10104 era la elección manual
  // o habría sido el recomendado (no hay candidato de menor capacidad que cumpla). Si era
  // la elección manual, se suelta y el selector sigue al nuevo recomendado.
  const cap10104=(()=>{ const x=MODELS.find(m=>m.id==='EC-10104'); return x?capacidadMax(x):null; })();
  const hayMenorQueCumple=cap10104!=null&&candidates.some(m=>capacidadMax(m)<cap10104);
  if(ec10104Descartado&&((mManual&&mManual.id==='EC-10104')||!hayMenorQueCumple)){
    $('alertaEscalado').hidden=false;
    if(mManual&&mManual.id==='EC-10104'){
      BOM.soltarManual('pickModel');
      delete $('pickModel').dataset.bomManual;
      $('pickModel').value=pick.id;
      mManual=null;
    }
  }else{
    $('alertaEscalado').hidden=true;
  }
  const elegidoId=FICHA.render({...FICHA_CFG,
    contenedor:'verdict',
    candidatos:candidates,
    recomendado:pick.id,
    seleccionado:mManual?mManual.id:undefined,
    incluir:mManual||undefined,
    etiqueta:m=>`${m.id} — ${m.serie} · ${fmt(capacidadMax(m))}`,
    // Detalle de cada fila de la lista de candidatos: segmento y capacidad ya sin el id
    // (la fila lo pone en negrita ella misma).
    etiquetaCand:m=>`${m.seg} · ${fmt(capacidadMax(m))}`,
    titulo:m=>m.id,
    subtitulo:m=>m.seg+' · '+famLabel(m),
    medidores:medidoresDe,
    porQue:porQueDe,
    secciones:seccionesDe,
    alCambiar:(id, origen)=>{
      // Clic en la lista de candidatos de la ficha (2026-09-15): equivale a mover el
      // selector único a mano — elección deliberada, con su marca y su aviso de desvío.
      // El render completo reconstruye candidatos, ficha, escalera y BOM con el elegido.
      if(origen==='candidato'){
        if($('pickModel').value!==id) $('pickModel').value=id;
        $('pickModel').dataset.bomManual='1';
        render();
        return;
      }
      // «Volver al recomendado»: se suelta la eleccion manual y toda la pagina vuelve a
      // seguir al dimensionamiento.
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
      // capacidad no es proponible si ya no se puede pedir. 2026-09-16: se usa la marca
      // de ficha.js, que distingue «fuera de venta» (eol declarado) de «fin de venta
      // vencido» (la fecha de último pedido ya pasó) — antes ambos decían «fin de
      // venta», que con la fecha en pasado subestimaba la condición.
      const mc=FICHA.marca?FICHA.marca(m):null;
      const marca=mc&&mc.fuera?' · '+mc.t:m.id===recomendado?' · recomendado':(ids.has(m.id)?' · cumple':'');
      return `<option value="${esc(m.id)}">${esc(m.id)} — ${esc(m.seg)}${marca}</option>`;
    }).join('')+'</optgroup>').join('');
  if(actual&&[...sel.options].some(o=>o.value===actual)) sel.value=actual;
  // El chooser de ópticas se repinta con el combo YA poblado (2026-09-17): lee el modelo
  // de #pickModel, así que solo aquí ve el pick del render ACTUAL — antes se pintaba al
  // principio del render y quedaba un ciclo atrás (la fila de interconexión EdgeHA no
  // aparecía hasta el siguiente cambio de cualquier campo).
  pintarSfpChooser();
}

function populateSelects(){
  poblarPickModel([], null);
  // Licenciamiento 100 % automático (2026-09-13, refactor arquitectónico): nivel de
  // suscripción, tier de caudal, bloques de Boost y nivel de capacidad del 9240 se
  // DEDUCEN — ya no hay selectores manuales que poblar para ellos. Lo único que sigue
  // siendo elección comercial es el nivel de soporte (y los «No incluir», que viven
  // como casillas junto a cada deducción del panel 4).
  $('careLevel').innerHTML='<option value="">No incluir</option>'+Object.entries(CARE).map(([k,c])=>`<option value="${esc(k)}"${k==='fc247'?' selected':''}>${esc(c.n)}</option>`).join('');
  // M3 · Selector de tier (SPEC B.4): se puebla DINÁMICAMENTE de SIZING.bwTiers — nunca
  // una lista escrita a mano—, así los 8 niveles que añade el frente DATOS aparecen solos.
  // «Automático» deja el tier al motor (deducido del caudal WAN agregado del sitio).
  $('selTier').innerHTML='<option value="auto" selected>Automático — deducido del caudal del sitio</option>'
    +(SIZING.bwTiers||[]).map(t=>`<option value="${esc(t.code)}">${esc(t.n)}</option>`).join('');
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
/* ══ M4 · INYECCIÓN AUTOMÁTICA DE HARDWARE (SPEC B.5) ══
   Accesorios que el diseño exige por regla de fábrica, no por elección en el modal:
   · Boost > 0 en EC-10150 → kit Network Memory S2N67A, qty mínima 1. De fábrica el
     EC-10150 rinde 1 Gbps de Boost sin el kit; con él llega a 8 Gbps (QuickSpecs).
     La línea la pone el motor y NO es removible desde el modal: solo desaparece si
     Boost vuelve a 0 (es la condición que la genera).
   · #chkDualPsu en Gateway 9240 → segunda PSU 550W AC R7J63A, qty 1.
   Los precios salen SIEMPRE del ACCESSORY_CATALOG del servidor (S2N67A $9.096,
   R7J63A $747 en la lista oficial del distribuidor). */
function accesoriosInyectados(m,D){
  const out=[];
  if(m.id==='EC-10150'&&D.bloques>0) out.push({sku:'S2N67A', qty:1,
    nota:'Requerido para Boost > 1 Gbps (de fábrica el EC-10150 rinde 1 Gbps sin el kit) — auto-añadido por el motor; removible solo si Boost vuelve a 0. List Price del catálogo maestro de accesorios.'});
  if(m.id==='Gateway 9240'&&$('chkDualPsu').checked) out.push({sku:'R7J63A', qty:1,
    nota:'Segunda fuente de alimentación 550W AC para el Gateway 9240 (alimentación 1+1) — opción de diseño marcada en el panel 4. List Price del catálogo maestro de accesorios.'});
  return out;
}
// Término genérico y1/y3/y5/y7 (2026-09-15, pendiente #28): antes y=7 caía al else de
// y3 y cotizaba 7 años A PRECIO DE 3 — una subcotización silenciosa. Clave directa y
// null cuando el peldaño no publica ese término (la interfaz muestra «consultar»).
function tierPrice(t,y){ if(!t) return null; const v=t['y'+y]; return v==null?null:v; }
// El SKU de una suscripción depende de la duración (1/3/5/7 años — y7 desde el
// 2026-09-15, pendiente #28): `sku` puede ser un objeto {y1,y3,y5,y7}. Se acepta
// también la forma plana por compatibilidad. Misma corrección que tierPrice: clave
// directa, sin else que cotizara 7 años a precio de 3.
function tierSku(t,y){ if(!t||t.sku==null) return null; if(typeof t.sku==='string') return t.sku; return t.sku['y'+y]||null; }
// A3 (2026-09-24): la suscripción de Central que corresponde a ESTE gateway — por su serie, su
// nivel (foundation/advanced), el término y si lleva «+ Security» (IDS/IPS, estrategia gwsec).
// El SKU sale de CENTRAL_SERIE (documento oficial de HPE); el precio, solo de lo verificado:
// CENTRAL_TIERS cuando es el mismo SKU, o la lista cargada (SKU_CAT). Nunca de otra serie.
// Devuelve null si el documento no publica ese nivel para esa serie (p. ej. Security en 70xx).
// A4: el nivel Foundation Base (o Base + Security con gwsec) que aplica a este gateway y a
// este número de usuarios, o null. Modelos y tope de clientes, del documento oficial.
function baseParaModelo(m, D){
  const fam=Object.values(CENTRAL_SERIE).find(f=>(f.series||[]).includes(m.serie));
  const t=fam&&fam[secMode==='gwsec'?'foundationBaseSec':'foundationBase'];
  if(!t||!(t.modelos||[]).includes(m.id)||!(D.users<=t.maxClientes)) return null;
  return {n:t.n, sku:(t.sku&&t.sku['y'+D.termYrs])||null, maxClientes:t.maxClientes};
}
function centralParaModelo(m, nivel, termYrs, conSeguridad){
  if(!m||!nivel) return null;
  const fam=Object.values(CENTRAL_SERIE).find(f=>(f.series||[]).includes(m.serie));
  if(!fam) return null;
  const t=fam[nivel+(conSeguridad?'Sec':'')];
  if(!t||(t.soloSeries&&!t.soloSeries.includes(m.serie))) return null;
  const sku=(t.sku&&t.sku['y'+termYrs])||null;
  let precio=null;
  const base=CENTRAL[nivel];
  if(sku&&base&&tierSku(base,termYrs)===sku) precio=tierPrice(base,termYrs);
  else if(sku){ const f=(SKU_CAT||[]).find(x=>x.sku===sku); if(f&&f.p!=null) precio=f.p; }
  return {n:t.n, sku, precio};
}

// M6 (auditoría 2026-09-17, corregido 2026-09-24): con la página vacía el desplegable cae a
// su primera opción (EC-XS) y el BOM cotizaba ese equipo con precio y «[OK] Diseño coherente»
// mientras «Dimensionar» decía «SIN CANDIDATO». Sin escenario y sin una elección hecha a mano
// no hay equipo que cotizar, y eso es lo que se pinta: nunca un equipo por defecto. Las
// referencias añadidas a mano sí se conservan (las pega BOM.renderTabla), porque son una
// decisión de quien cotiza y no del motor.
function pintarBomSinEscenario(){
  const txt='Sin equipo que cotizar: el dimensionamiento todavía no tiene escenario. Declara los enlaces WAN del sitio (o los usuarios) en «Dimensionar», o elige un equipo a mano en el paso 3 para cotizarlo igualmente.';
  // Sin referencias añadidas tampoco hay tabla: un «Total de referencia $0» sobre una lista
  // vacía se lee como una cotización que da cero, no como una que no existe.
  const hayRefs=(BOM.refsExtra()||[]).some(r=>!r.v||String(r.v).toLowerCase()==='aruba');
  $('bomTabla').innerHTML=`<p class="bom-desvio"><b>Sin equipo que cotizar.</b> ${esc(txt.replace(/^Sin equipo que cotizar: /,''))}</p>`
    +(hayRefs?BOM.renderTabla([],{dto:dtoActual(), editable:true, ajustable:true}):'');
  const meta={titulo:'Lista de materiales — sin equipo', archivo:'BOM_sin_equipo', notas:[txt]};
  pintarRetiradas([], leerOmitidas());
  $('bomOut').value=hayRefs?BOM.comoTexto([],meta):`Lista de materiales — sin equipo\n\n${txt}`;
  bomMeta=meta; bomFilas=[];
  $('tcoFin').innerHTML='<p class="hint">Sin equipo que cotizar: todavía no hay CAPEX, OPEX ni TCO que calcular.</p>';
  pintarPoolBoost();
  pintarCatalogoSku();
}
function renderBom(){
  if(!datosListos) return; // M5: sin catálogo no hay nada que cotizar
  // Licenciamiento 100 % automático (2026-09-13, refactor arquitectónico): nivel de
  // suscripción, tier de caudal, bloques de Boost y nivel de capacidad se DEDUCEN del
  // escenario — estadoDerivado es la misma fuente que alimenta el dimensionador y la
  // ficha, así que la lista de materiales nunca diverge de lo dimensionado.
  const D=estadoDerivado();
  const sel=$('pickModel');
  const manual=!!sel&&sel.dataset.bomManual==='1';
  if(!lastPick&&!manual&&D.caudalTotal<=0&&D.needProc<=0){ pintarBomSinEscenario(); return; }
  const m=MODELS.find(x=>x.id===sel.value)||MODELS[0];
  if(!m) return;
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
  // M4 · Segunda PSU del Gateway 9240 (SPEC B.5): la casilla solo se ofrece con ese
  // chasis (el EC-10150 lleva doble PSU de fábrica — no hay nada que cotizar).
  $('fldDualPsu').hidden=m.id!=='Gateway 9240';
  // M3 · Badge Advanced (SPEC B.4): visible cuando el motor DEDUCE Advanced de las
  // funciones marcadas (segmentación >3 BIOs/VRFs, topología ilimitada/Dynamic Mesh o
  // retención ampliada — reglas existentes de nivelAutoEC, matriz QuickSpecs p.31).
  $('badgeAdvanced').hidden=!(esEC&&nivelAutoEC()==='advanced');
  // M3 · Selector de tier filtrado por nivel (SPEC B.4): con Foundation, los tiers
  // intermedios quedan disabled con title explicativo — la lista oficial solo publica
  // 100 Mbps / 1 Gbps / ilimitado para Foundation. Se evalúa dinámicamente contra
  // LICENSES, así la ampliación de DATOS (8 tiers en advanced/onprem) se refleja sola.
  {
    const nivelSel=D.bundle==='onprem'?'onprem':nivelAutoEC();
    let resetear=false;
    [...$('selTier').options].forEach(o=>{
      if(o.value==='auto'){ o.disabled=false; o.title=''; return; }
      const lic=LICENSES[o.value];
      const ok=!lic||!!lic[nivelSel];
      o.disabled=!ok;
      o.title=ok?'':'Foundation solo ofrece 100M/1G/UL — restricción oficial de la lista';
      if(!ok&&o.selected) resetear=true;
    });
    if(resetear){ $('selTier').value='auto'; renderBom(); return; }
  }

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
        +(bloques?`<br>Boost: <b>${bloques} bloque(s) de ${SIZING.boost.bloque} Mbps</b> = 30 % del tráfico WAN privado por los túneles (${fmt(D.boostMbps)})`:'')
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
      ?`<b>${esc(capTier.n)}</b><br><span class="lic-auto-porque">deducido del dimensionamiento en ${esc(SO_NOMBRE[soMode]||soMode)}: ${fmt(D.needProc)} de proceso, ${miles(D.users)} dispositivos y ${miles(D.aps)} APs — el nivel ${esc(capTier.n)} es el primero que cubre las tres cifras${soMode==='aos10'?' · en AOS 10 las licencias Silver y Gold no admiten IDPS (HPE, «AOS 10 Capacity Licenses»)':''}</span>`
      :(()=>{ const b=m.licCap&&m.licCap[0]; return `<b>Solo hardware (${b?fmt(b.fw):'—'})</b><br><span class="lic-auto-porque">sin licencia de capacidad en ${esc(SO_NOMBRE[soMode]||soMode)}: la serie 9200 entrega ${b?fmt(b.fw):'—'}, ${b?miles(b.aps):'—'} APs y ${b?miles(b.clients):'—'} dispositivos sin ella</span>`; })();
  }

  const lic=LICENSES[bwCode]||null;
  const licTier=lic&&bundle?(lic[bundle]||null):null;
  // Par HA 1+1: HPE publica un juego de SKU propio para el SEGUNDO nodo (LICENSES_HA),
  // con el mismo precio que el estándar — lo que cambia es el SKU de pedido. Aplica a
  // las TRES modalidades desde el 2026-09-16 (pendiente #17 cerrado): el QuickSpecs
  // vigente (a50004289enw) publica la escalera «On-Premises High Availability E-STU» y
  // la lista la tarifa con la misma invariante (HA == estándar, verificada 32/32).
  const haPar=esEC&&$('chkHa').checked&&qty===2;
  const licHa=haPar&&bundle?((LICENSES_HA[bwCode]||{})[bundle]||null):null;
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

  // Los paneles de detalle del equipo («Ficha del equipo», «Capacidad por nivel», «Suscripción»
  // y «Soporte HPE») ya NO se pintan aquí: desde 2026-09-13 viven unificados en la ficha del
  // dimensionador (seccionesDe), una sola tarjeta sin cifras repetidas. Esta función solo
  // mantiene la visibilidad de los campos y construye las filas de la lista de materiales.

  // El pool de Boost NO multiplica por unidad: es un caudal agregado del fabric.
  const filas=[
    {cat:'Equipo', desc:m.id, sku:m.hwSku||null, qty, unit:m.elpN!=null?m.elpN:null,
     nota:`${m.seg} · ${famLabel(m)} · ${m.ifaces}`},
  ];
  // Ópticas y accesorios (fase 12): catálogo maestro del servidor, con precios de la
  // lista oficial del distribuidor; solo los compatibles con el modelo elegido — la
  // selección se depura al cambiar de equipo para no cotizar una óptica incompatible.
  const cfgAcc=ACCESSORY_COMPAT[m.id]||null;
  Object.keys(accesoriosElegidos).forEach(sku=>{
    if(!cfgAcc||!cfgAcc.items.includes(sku)) delete accesoriosElegidos[sku];
  });
  $('accBtn').hidden=!cfgAcc;
  Object.entries(accesoriosElegidos).forEach(([sku,n])=>{
    const a=ACCESSORY_CATALOG[sku];
    if(!a||n<=0) return;
    filas.push({cat:'Accesorios', desc:a.name, sku, qty:n, unit:a.listPrice!=null?a.listPrice:null,
      nota:'List Price de la lista oficial del distribuidor (vigencia '+(a.vigencia||'s/f')+') — catálogo maestro de accesorios; confirmar precio firme antes de cotizar'});
  });
  // M4 · Inyección automática de hardware (SPEC B.5): accesorios que el DISEÑO exige y
  // que no dependen de la selección manual del modal. El precio sale del catálogo maestro
  // (ACCESSORY_CATALOG: S2N67A $9.096, R7J63A $747 — lista oficial del distribuidor).
  const inyectados=accesoriosInyectados(m,D);
  inyectados.forEach(({sku,qty:qIny,nota})=>{
    // Si además se eligió a mano en el modal, la línea inyectada manda y la manual se
    // suelta: duplicar el kit en la cotización sería un error de pedido.
    if(accesoriosElegidos[sku]) delete accesoriosElegidos[sku];
    const a=ACCESSORY_CATALOG[sku]||null;
    filas.push({cat:'Accesorios', desc:a?a.name:sku, sku, qty:qIny,
      unit:a&&a.listPrice!=null?a.listPrice:null, nota});
  });
  // Ópticas SFP de los enlaces WAN (petición del dueño, 2026-09-15): una por enlace
  // declarado con medio SFP. En EdgeConnect NO se multiplica por las unidades del par
  // HA (2026-09-17, asistente de cableado EdgeHA): en el diseño oficial de sucursal del
  // VSG SD-Branch (fig. «EC HA») cada enlace aterriza en UN chasis del par y el enlace
  // EdgeHA lleva sus túneles a ambos — el ×2 cotizaba el patrón de HUB («each WAN
  // transport is brought into each appliance») en una sucursal. Los gateways de campus
  // conservan el ×unidades: su cableado HA no se ha validado contra fuente oficial.
  const pickSfp=leerSfpPick();
  Object.entries(necesidadesOptica(D.wanLinks)).forEach(([medio,nLinks])=>{
    const {ops, sku}=opticaResuelta(m.id, medio, pickSfp);
    if(!ops.length) return; // el aviso «este modelo no admite ese medio» vive en #sfpChooser
    const qtyO=esEC?nLinks:nLinks*qty;
    if(!sku){
      filas.push({cat:'Accesorios', desc:`Óptica ${medio} para ${nLinks} enlace${nLinks===1?'':'s'} WAN — PENDIENTE DE SELECCIÓN en el builder`, sku:null, qty:qtyO, unit:null,
        nota:`El escenario declara ${nLinks} enlace${nLinks===1?'':'s'} con medio ${medio} y hay ${ops.length} ópticas compatibles con ${m.id}: selecciona el tipo en la sección de enlaces WAN (pestaña Dimensionar). No entra en el total hasta elegirla.`});
      return;
    }
    // Misma regla anti-duplicado que los inyectados: si esa óptica ya se metió a mano
    // en el modal, la línea del builder manda y la manual se suelta.
    if(accesoriosElegidos[sku]) delete accesoriosElegidos[sku];
    const a=ACCESSORY_CATALOG[sku];
    filas.push({cat:'Accesorios', desc:a.name, sku, qty:qtyO, unit:a.listPrice!=null?a.listPrice:null,
      nota:`Óptica ${medio} × ${qtyO} (${nLinks} enlace${nLinks===1?'':'s'}${esEC&&qty>1?' — EdgeHA: cada enlace aterriza en UN chasis del par (VSG SD-Branch, fig. «EC HA»)':qty>1?` × ${qty} unidades`:''}) — List Price de la lista oficial (vigencia ${a.vigencia||'s/f'}); tipo seleccionado en el builder WAN`});
  });
  // Interconexión EdgeHA (pendiente #7 del dueño, 2026-09-17 — mejora aprobada): el
  // enlace directo entre los dos chasis del par necesita 1 puerto por chasis. Si hay
  // cobre libre lo resuelve un latiguillo (no cotizable desde el catálogo); si va por
  // fibra son 2 ópticas de la velocidad recomendada (≥ agregado — regla declarada de
  // la casa, ver velocidadEdgeHA). Sin elección del usuario la línea queda PENDIENTE
  // DE SELECCIÓN sin precio: declarada, nunca una óptica inventada.
  const enlacesHA=parEdgeHA(esEC, qty, D.wanLinks);
  if(enlacesHA){
    const agregadoHA=enlacesHA.reduce((s,l)=>s+l.down,0);
    const velHA=velocidadEdgeHA(m.id, agregadoHA);
    const opsHA=velHA?opticasPorVelocidad(m.id, velHA):[];
    const pickHA=leerSfpPick().EdgeHA;
    const skuHA=pickHA&&opsHA.some(o=>o.sku===pickHA)?pickHA:(opsHA.length===1?opsHA[0].sku:null);
    if(!skuHA){
      filas.push({cat:'Accesorios', desc:'Interconexión EdgeHA — 2 puertos (1 por chasis) — PENDIENTE DE SELECCIÓN en el builder', sku:null, qty:2, unit:null,
        nota:!velHA||!opsHA.length
          ?`El agregado del sitio (${fmt(agregadoHA)}) supera las ópticas del catálogo para ${m.id}, o el modelo no tiene jaulas: la salida honesta es cobre directo (latiguillo entre puertos libres) o confirmar la óptica con HPE. No entra en el total — se declara para que la propuesta no salga sin el enlace del par.`
          :`La interconexión del par lleva los túneles de cada underlay a ambos chasis (VSG SD-Branch, fig. «EC HA»). Velocidad recomendada ${velHA} (≥ agregado del sitio, ${fmt(agregadoHA)} — regla declarada de la casa); hay ${opsHA.length} ópticas compatibles: selecciona el tipo en la sección de enlaces WAN (pestaña Dimensionar). Si se resuelve por cobre, retira esta línea. No entra en el total hasta elegirla.`});
    }else{
      // Misma regla anti-duplicado que el resto de ópticas: si ya se metió a mano en el
      // modal, la línea del builder manda y la manual se suelta.
      if(accesoriosElegidos[skuHA]) delete accesoriosElegidos[skuHA];
      const aHA=ACCESSORY_CATALOG[skuHA];
      filas.push({cat:'Accesorios', desc:`${aHA.name} — interconexión EdgeHA del par`, sku:skuHA, qty:2, unit:aHA.listPrice!=null?aHA.listPrice:null,
        nota:`Óptica ${velHA} × 2 (1 por chasis) para el enlace EdgeHA — recomendada ≥ agregado del sitio (${fmt(agregadoHA)}), regla declarada de la casa. List Price de la lista oficial (vigencia ${aHA.vigencia||'s/f'}); tipo seleccionado en el builder WAN`});
    }
  }
  if(esEC){
    if(bundle){
      if(licHa){
        // Par HA 1+1: 1× suscripción estándar (nodo primario) + 1× suscripción de alta
        // disponibilidad (segundo nodo, SKU «HA» del QuickSpecs). Misma forma en SaaS
        // (Foundation/Advanced HA) y en On-Premises (E-STU HA, desde el 2026-09-16).
        filas.push({cat:'Suscripción SD-WAN', desc:`${BUNDLES[bundle].n} — ${bwTier?bwTier.n:'tier por definir'} · nodo primario`,
          sku:tierSku(licTier,termYrs), qty:1, unit:licPrice,
          nota:`${termino} · suscripción por caudal del sitio, no por modelo de appliance`});
        filas.push({cat:'Suscripción SD-WAN', desc:`${BUNDLES[bundle].n} HA — ${bwTier?bwTier.n:'tier por definir'} · segundo nodo del par 1+1`,
          sku:tierSku(licHa,termYrs), qty:1, unit:licHaPrice,
          nota:`${termino} · ${D.onprem
            ?'SKU HA E-STU del QuickSpecs (sección «On-Premises High Availability», verificada 2026-09-16)'
            :'SKU de alta disponibilidad del QuickSpecs (existencia y regla «match tier, bandwidth, term»)'}; la lista de precios documentada lo tarifa igual que el estándar`});
      }else{
        filas.push({cat:'Suscripción SD-WAN', desc:`${BUNDLES[bundle].n} — ${bwTier?bwTier.n:'tier por definir'}`,
          sku:tierSku(licTier,termYrs), qty, unit:licPrice,
          nota:`${termino} · suscripción por caudal del sitio, no por modelo de appliance`
            +(haPar&&D.onprem?' · par HA on-prem: la escalera de SKU HA E-STU no llegó del servidor — consultar':'' )});
      }
      if(bloques){
        filas.push({cat:'Aceleración', desc:`${SIZING.boost.n} — bloque de ${SIZING.boost.bloque} Mbps`,
          sku:tierSku(boostBlk,termYrs), qty:bloques, unit:boostPrice,
          nota:`Pool agregado del fabric (${fmt(bloques*SIZING.boost.bloque)} = 30 % del tráfico WAN privado estimado). Orchestrator lo reparte entre sedes; no multiplica por unidad.`});
      }
      // Dynamic Threat Defense (pendiente #31, 2026-09-14): licencia opcional APARTE de
      // Foundation y Advanced (QuickSpecs p.32) pero DE la suscripción — sin ella no se
      // cotiza (igual que Boost; lo declara la revisión del diseño). SÍ está en la lista
      // de precios vigente: escalera PLANA por appliance (sin tiers de caudal), con SKU
      // por modalidad × término. Con HA 1+1, dos líneas como el resto de licencias:
      // 1× estándar (nodo primario) + 1× SKU de alta disponibilidad (segundo nodo) — la
      // lista lo tarifa igual que el estándar, invariante verificada 2026-09-14.
      if(secMode==='dtd'){
        // La lista también publica término de 7 años: por alcance se modela a 5 (#28).
        const yrs=termYrs>=7?5:termYrs;
        const nota7=termYrs>=7?' · la lista publica también 7 años: se modela a 5 por alcance (#28)':'';
        const notaBase=`${termino} · licencia opcional aparte de Foundation/Advanced (QuickSpecs p.32) · List Price de la lista vigente (2026-06-01)${nota7}`;
        const dtdMod=D.onprem?'onprem':'saas';
        const dtdStd=DTD?DTD[dtdMod]:null, dtdHa=DTD?DTD[dtdMod+'Ha']:null;
        if(!dtdStd){
          // Fallback pre-merge de DATOS: sin la escalera en el API, «consultar».
          filas.push({cat:'Seguridad', desc:'Dynamic Threat Defense — IDS/IPS, DDoS adaptativo, clasificación web',
            sku:null, qty, unit:null,
            nota:`${termino} · licencia opcional aparte de Foundation/Advanced (QuickSpecs p.32) · la escalera de precios no llegó del servidor — consultar`});
        }else if(haPar&&dtdHa){
          filas.push({cat:'Seguridad', desc:'Dynamic Threat Defense — IDS/IPS, DDoS adaptativo, clasificación web · nodo primario',
            sku:tierSku(dtdStd,yrs), qty:1, unit:tierPrice(dtdStd,yrs), nota:notaBase});
          filas.push({cat:'Seguridad', desc:'Dynamic Threat Defense HA — IDS/IPS del segundo nodo del par 1+1',
            sku:tierSku(dtdHa,yrs), qty:1, unit:tierPrice(dtdHa,yrs),
            nota:`${termino} · SKU de alta disponibilidad del segundo nodo; la lista lo tarifa igual que el estándar (invariante verificada 2026-09-14)${nota7}`});
        }else{
          filas.push({cat:'Seguridad', desc:'Dynamic Threat Defense — IDS/IPS, DDoS adaptativo, clasificación web',
            sku:tierSku(dtdStd,yrs), qty, unit:tierPrice(dtdStd,yrs), nota:notaBase});
        }
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
      // A3 (auditoría 2026-09-17, corregido 2026-09-24): los SKU de Central cargados
      // (JZ118–JZ123AAE) son los de la lista con descripción literal «Aruba 7/90xx Gtwy», y se
      // aplicaban a TODO gateway — también a los 9106/9114 (serie 9100), al 9240 (serie 9200)
      // y a la serie 7200. Para esas series la lista cargada no trae su SKU (la 72xx tiene su
      // propia familia, documentada en aruba.js sin precio cargado; la 91xx/92xx está por
      // confirmar con HPE): la línea queda en «consultar» con el motivo, nunca con el SKU y el
      // precio de otra serie.
      const conSeg=secMode==='gwsec';
      const c=centralParaModelo(m, central, termYrs, conSeg);
      filas.push({cat:'Suscripción de gestión', desc:c?c.n:(CENTRAL[central]||{}).n||'Central',
        sku:c?c.sku:null, qty, unit:c?c.precio:null,
        nota:!c
          ?`${termino} · HPE Aruba Networking Central, suscripción por dispositivo · CONSULTAR: el documento oficial no publica el nivel ${conSeg?'«+ Security» ':''}para la ${m.serie}`
          :c.precio!=null
            ?`${termino} · HPE Aruba Networking Central, suscripción por dispositivo`
            :`${termino} · HPE Aruba Networking Central, suscripción por dispositivo · SKU oficial de la ${m.serie}; precio a confirmar con el distribuidor`});
    }
    if(capTier&&capTier.code!=='hw'){
      filas.push({cat:'Licencia perpetua', desc:`Capacidad ${capTier.n}`, sku:capTier.sku||null, qty, unit:capTier.elp!=null?capTier.elp:null,
        nota:`Amplía el mismo hardware a ${fmt(capTier.fw)} · ${miles(capTier.aps)} APs · ${miles(capTier.clients)} dispositivos`});
    }
  }
  // A5 (auditoría 2026-09-17, corregido 2026-09-24): los APs solo limitaban el modelo — ni su
  // hardware ni su suscripción de Central por AP aparecían en la lista, y la propuesta salía
  // corta sin decirlo. Este catálogo no trae modelos de AP: la línea entra DECLARADA, con la
  // cantidad del escenario y sin SKU ni precio, que es lo que la cuenta como «sin cotizar».
  if(D.aps>0){
    filas.push({cat:'Acceso inalámbrico', desc:`Puntos de acceso — hardware y suscripción de Central por AP`, sku:null, qty:D.aps, unit:null,
      nota:'Fuera del catálogo de este dimensionador: el modelo de AP y su suscripción de Central se eligen y cotizan aparte. Se declara para que la propuesta no salga corta.'});
  }
  // HPE Aruba Networking SSE (SPEC B.4): suscripcion POR USUARIO (ZTNA, SWG, CASB, DEM —
  // paquetes oficiales Foundation ZTNA / Foundation SWG / Foundation Plus / Advanced /
  // Advanced Plus, QuickSpecs SSE a50009212enw). SKU y precio del global `sse` del API
  // (R8M36AAE, precio null → «consultar», EXCLUIDA de los totales con nota al pie);
  // co-terminada con la suscripción del sitio (mismo término). Si el frente DATOS aún no
  // sirve el global, la línea entra igualmente con el SKU del contrato y «consultar».
  if(secMode==='sse'){
    const sseSku=(SSE&&SSE.sku)||'R8M36AAE';
    const ssePrecio=SSE&&SSE.precio!=null?SSE.precio:null;
    // Usuarios = cantidad de licencias (petición del dueño, 2026-09-15): sin la cifra la
    // línea NO se cotiza con un «1» inventado — queda PENDIENTE y el campo #users se
    // marca como requerido en el formulario (ver marcarUsersReq en render).
    const nUsers=parseInt(D.users)>0?parseInt(D.users):null;
    filas.push({cat:'Seguridad SASE', desc:'HPE Aruba Networking SSE — suscripción por usuario (ZTNA, SWG, CASB, DEM)'
        +(nUsers?'':' — PENDIENTE: declara los usuarios del sitio'),
      sku:sseSku, qty:nUsers, unit:ssePrecio,
      nota:nUsers
        ?`${termino} · co-terminada con la suscripción del sitio · por usuario (${miles(nUsers)} usuarios) · paquetes Foundation ZTNA / Foundation SWG / Foundation Plus / Advanced / Advanced Plus (QuickSpecs SSE)${SSE&&SSE.nota?' · '+SSE.nota:''} · HPE no publica List Price — consultar`
        :`SSE se suscribe POR USUARIO (QuickSpecs SSE) y el escenario no declara usuarios: la cantidad de licencias no se puede fijar. Rellena «Usuarios / dispositivos concurrentes» en el módulo 2.`});
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
  // BOM editable (petición del dueño, 2026-09-15): las líneas retiradas se excluyen de la
  // tabla, del texto, del Excel, del TCO y también del aviso de fin de venta — una línea
  // retirada no puede seguir condicionando la propuesta.
  const omitidas=new Set(leerOmitidas());
  const filasVivas=filas.filter(f=>!omitidas.has(BOM.claveFila(f)));
  // Cantidades ajustadas a mano (mejora, 2026-09-16): se aplican DESPUÉS de filtrar las
  // retiradas y ANTES de todos los consumidores (tabla, texto, Excel, TCO y aviso de fin
  // de venta), para que la cifra que cotiza sea la que el usuario ve en todas partes —
  // y declarada con la cifra del motor. Si al aplicar se podó algún ajuste que ya no
  // divergía, el mapa se reescribe para que el enlace quede limpio.
  const ajustes=leerAjustes();
  const rAj=aplicarAjustes(filasVivas,ajustes);
  if(rAj.podo) escribirAjustes(ajustes);
  const filasFin=rAj.filas;
  const enEs=[...filasFin.map(f=>({sku:f.sku,desc:f.desc})), ...refsPagina.map(r=>({sku:r.sku,desc:r.d}))]
    .filter((x,i,l)=>x.sku&&PLC_POR_SKU[x.sku]==='ES'&&l.findIndex(y=>y.sku===x.sku)===i);

  // Contexto MSP del escenario (etapa A / #39, 2026-09-14): cliente y referencia
  // encabezan la lista de materiales, el texto plano y la primera hoja del Excel.
  const cliente=$('nombreCliente').value.trim(), refProy=$('refProyecto').value.trim();
  // La traza del dimensionado viaja con la propuesta (plan 17, 2026-09-17): la MISMA
  // cuenta que pinta la ficha (plan 16) abre la revisión del diseño de la lista
  // exportada — quien recibe el BOM audita de dónde sale el requerimiento sin abrir
  // la herramienta. Mismo núcleo plano que la ficha: una sola fuente.
  const cuentaBom=esEC
    ?(cuentaMotorPlana(D,D.wanNeed)?`${cuentaMotorPlana(D,D.wanNeed)} de diseño`:'')
    :cuentaProcesoPlana(D);
  // La foto oficial viaja con la propuesta (plan 20, 2026-09-18): las vistas que la ficha
  // pinta en pantalla (misma fuente, FICHA_CFG.vistas) se incrustan en el Excel en la hoja
  // «Fotos del equipo», con el mismo pie de tamaño y fuente documental — quien recibe la
  // cotización ve el equipo real sin abrir la herramienta. Regla del piloto: solo Aruba
  // declara vistas, así que ningún otro fabricante emite `fotos` hasta que su catálogo
  // las declare. Modelo sin foto declarada (7000/7200, EC-V): no hay hoja — el hueco es
  // honesto, no se inventa una imagen.
  const vBom=(FICHA_CFG.vistas||{})[m.id];
  const fotosBom=vBom&&vBom.front
    ?{modelo:m.id, front:vBom.front, rear:vBom.rear||null,
      pie:[vBom.tamano,vBom.fuente].filter(Boolean).join(' · ')}
    :null;
  const meta={
    titulo:`Lista de materiales — ${m.id}`,
    subtitulo:`${m.seg} · ${famLabel(m)} · ${termino}`,
    archivo:`BOM_${m.id}`,
    ...(fotosBom?{fotos:fotosBom}:{}),
    ...(cliente?{cliente}:{}),
    ...(refProy?{referencia:refProy}:{}),
    notas:[
      enEs.length?'FIN DE VENTA (estado PLC «ES» en la lista de precios):':null,
      ...enEs.map(f=>`  ${f.sku} — ${f.desc}. HPE ya no lo vende: confirmar el sucesor antes de cotizar.`),
      '',
      'CAPACIDAD PUBLICADA POR HPE',
      esEC?`  Rango de caudal WAN:  ${m.wanMin!=null?fmt(m.wanMin)+' - '+fmt(m.wanMax):'sin minimo publicado'}`
          :`  Throughput firewall:  ${m.fw!=null?fmt(m.fw):'no publicado en las fuentes consultadas'}`,
      m.clients!=null?`  Clientes / APs:       ${miles(m.clients)} / ${miles(m.aps)}`:null,
      // C2/C3: las cifras de un gateway dependen del SO — la propuesta lo declara.
      m.fam==='gw'?`  Sistema operativo:    ${SO_NOMBRE[soMode]||soMode}`:null,
      // Sesiones IPsec y tuneles GRE salen de la exportacion (2026-09-13, refactor
      // arquitectonico): el orquestador gestiona los tuneles dinamicamente y no son
      // metrica de dimensionamiento. Los flujos simultaneos si lo son.
      flujosDe(m)!=null?`  Flujos simultaneos:   ${miles(flujosDe(m))}`:null,
      `  Interfaces:           ${m.ifaces}`,
      `  Referencias:          ${(m.skus||[]).map(r=>(r.sku||'sin SKU')+' '+r.d).join(' | ')||'-'}`,
      `  Datasheet:            ${m.ds||'sin URL oficial confirmada'}`,
      // M7 (2026-09-24): la copia local vive detrás del login y no le sirve a quien recibe el
      // documento; el enlace oficial de arriba sí. Fuera del exportable.
      // Transporte WAN del sitio (M1/M2, estado v2): cuando el preventa declara los
      // enlaces en el builder, la exportacion los documenta uno a uno; el appliance se
      // dimensiona por el throughputDiseno del motor de ingenieria y el tier se tasa por
      // el ancho de banda fisico agregado (brief carrier-grade 2026-09-13).
      D.caudalTotal>0?'':'',
      D.caudalTotal>0?'TRANSPORTE WAN DEL SITIO (multi-underlay, estado v2)':null,
      ...D.wanLinks.filter(l=>l.down>0||l.up>0).map((l,i)=>
        `  Enlace ${i+1}:  ${l.tipo} · ${l.medio} · ${fmt(l.down)} down / ${fmt(l.up)} up${l.rol==='respaldo'?' · RESPALDO (entra si cae un activo; no suma en operacion normal)':''}`),
      D.caudalTotal>0?`  Agregado en operacion normal: ${fmt(D.caudalTotal)} (MPLS ${fmt(D.mplsMbps)} + Internet ${fmt(D.inetMbps)})${D.respaldoMbps>0?' + '+fmt(D.respaldoMbps)+' de respaldo fuera del agregado':''} · Local Breakout ${D.breakout?'ACTIVO — el 70 % del caudal total sale local y el tunel al DC sostiene ≈'+fmt(D.ing.distribucion.bwTunelesPrivados)+' (criterio de diseño declarado); la suscripcion se tasa por el ancho de banda fisico agregado':'desactivado (full backhaul)'}`:null,
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
      // M7 (2026-09-24): el exportable lo lee el cliente o el distribuidor — sin nombres de
      // archivo ni de constantes del repositorio.
      '  tomado de la lista de precios vigente de HPE (List Price, sin descuento).',
      '  El soporte Foundational Care se cotiza por variante de hardware. Lo que',
      '  sigue sin precio (EC-V, FC de software y FC de gateways) va en consultar',
      '  a proposito. Confirmar la fila exacta del datasheet antes de emitir la propuesta.',
      '',
      'REVISION DEL DISENO (par tecnico automatico)',
      cuentaBom?`  Dimensionado ${esEC?'(motor de ingeniería)':'(proceso, fórmula histórica)'}: ${cuentaBom}.`:null,
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
  // Simulador de precio neto (fase 11): las columnas NET van en paralelo a las LIST, en
  // la tabla, en el texto y en el Excel.
  const dto=dtoActual();
  if(dto>0){ meta.dto=dto; meta.dtoEtq=dtoEtiqueta(); }
  // Cabecera MSP sobre la lista (etapa A / #39): quien recibe el BOM ve de qué cliente
  // y proyecto es sin abrir el Excel.
  const cabCtx=(cliente||refProy)
    ?`<p class="bom-ctx">${cliente?`<b>${esc(cliente)}</b>`:''}${cliente&&refProy?' · ':''}${refProy?`Ref. ${esc(refProy)}`:''}</p>`
    :'';
  $('bomTabla').innerHTML=cabCtx+avisoEs+BOM.avisoDesvio({elegido:FICHA.elegido('verdict'), enBom:m.id, hayCandidato:!!lastPick})
    +BOM.renderTabla(filasFin,{
    aviso:'List Price de HPE (sin descuento de distribuidor) — hardware, suscripciones EdgeConnect/Boost/Central, licencias perpetuas 9240 y Foundational Care de EdgeConnect verificados el 2026-09-13 contra la lista de precios vigente. Lo que no tiene precio verificado figura en "consultar" a propósito.',
    dto,
    editable:true,
    ajustable:true,
  });
  pintarRetiradas(filas, omitidas);
  $('bomOut').value=BOM.comoTexto(filasFin,meta);
  bomMeta=meta; bomFilas=filasFin;
  // SPEC B.4: la línea SSE de la tabla lleva el id de contrato #filaSse (la tabla la
  // genera bom.js, que no pone ids — se etiqueta aquí tras el repintado).
  if(secMode==='sse'){
    const sseSku=(SSE&&SSE.sku)||'R8M36AAE';
    const tr=[...document.querySelectorAll('#bomTabla tr')].find(x=>x.textContent.includes(sseSku));
    if(tr) tr.id='filaSse';
  }

  /* ══ M6 · CAPEX / OPEX ANUAL / TCO ══
     La matematica vive en `BOM.tco` y se calcula sobre las FILAS del BOM, que ya son la forma
     neutra que los siete fabricantes comparten. Antes se calculaba aqui a partir de los objetos
     de licenciamiento de Aruba (`capTier`, `licHa`, `boostBlk`, `tierPrice`...), y eso era lo
     que ataba el calculo a esta unica pagina.

     LO QUE ESTA PAGINA DECLARA ES QUE CUENTA COMO OPEX, no como se suma: que una suscripcion
     sea recurrente y una licencia perpetua no lo sea es el modelo COMERCIAL de Aruba, no una
     propiedad de la fila. Un catalogo que solo venda hardware no declara nada y todo es CAPEX.
     Criterio, el mismo de siempre: CAPEX = hardware + accesorios + licencia perpetua (one-time);
     OPEX = suscripciones (SD-WAN, gestion, Boost, seguridad) + soporte del termino, prorrateado.

     Se comprobo contra el calculo anterior antes de cambiarlo, en siete escenarios —incluidos
     Boost y DTD, que son los que traen las categorias del camino largo— y las tres cifras
     coincidieron en todos. */
  const OPEX_ARUBA=['Suscripción SD-WAN','Suscripción de gestión','Soporte','Aceleración','Seguridad','Seguridad SASE'];
  const fin=BOM.tco(filasFin,{opex:OPEX_ARUBA, anios:termYrs});
  const capexList=fin.capex, opexAnual=fin.opexAnual, tco=fin.tco;
  const hayPrecios=capexList>0||fin.opexTermino>0;
  const celdaNet=v=>dto>0?`<td><b>${BOM.money(v*(1-dto))}</b></td>`:'';
  $('tcoFin').innerHTML=hayPrecios
    ?`<table class="tco-tabla"><thead><tr><th>Pie de la lista de materiales</th><th>Subtotal Lista</th>${dto>0?'<th>Subtotal Neto</th>':''}</tr></thead><tbody>`
      +`<tr><td><b>CAPEX</b> — hardware + accesorios + licencia perpetua (one-time)</td><td>${BOM.money(capexList)}</td>${celdaNet(capexList)}</tr>`
      +`<tr><td><b>OPEX anual</b> — suscripciones y soporte del término ÷ ${termYrs} año${termYrs>1?'s':''}</td><td>${BOM.money(opexAnual)}</td>${celdaNet(opexAnual)}</tr>`
      +`<tr><td><b>TCO a ${termYrs} año${termYrs>1?'s':''}</b> — CAPEX + OPEX anual × ${termYrs}</td><td><b>${BOM.money(tco)}</b></td>${celdaNet(tco)}</tr>`
      +`</tbody></table><p class="hint" style="margin-top:8px">CAPEX = hardware + accesorios + licencia perpetua de capacidad (criterio declarado); OPEX anual = suscripciones y soporte del término prorrateados. Las líneas en «consultar» no entran en la suma: <b>HPE Aruba SSE (precio null — suscripción por usuario a cotizar)</b>, EC-V y Foundational Care de gateways. Los precios de suscripción de la lista son lineales al término (3 años = 3 × 1 año). El neto es un <b>simulador genérico de tramos partner — no refleja el descuento real del distribuidor</b>.</p>`
    :'<p class="hint">Sin precios suficientes para calcular el TCO: el equipo o las suscripciones están en «consultar».</p>';
  // La calculadora de pool Boost (tab de licencias) proyecta los bloques del escenario:
  // se repinta con cada cambio para no quedarse con cifras de un escenario anterior.
  pintarPoolBoost();
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
  // Dynamic Threat Defense (2026-09-14, #31): cuatro familias CSV (SaaS / SaaS HA /
  // On-Premises / On-Premises HA) bajo una sola categoría del panel.
  if(/^Dynamic Threat Defense/.test(mod)) return 'Dynamic Threat Defense';
  if(/^Central/.test(mod)) return 'HPE Aruba Networking Central';
  if(/AR$/.test(sku)) return 'Hardware remanufacturado (serie 7000/7200)';
  if(/AAE$/.test(sku)) return 'Licencias perpetuas 9240';
  return 'Hardware — EdgeConnect y gateways';
}
const SKU_CAT_ORDEN=['Hardware — EdgeConnect y gateways','Hardware remanufacturado (serie 7000/7200)',
  'Suscripción EdgeConnect Foundation','Suscripción EdgeConnect Advanced',
  'Suscripción EdgeConnect Foundation HA','Suscripción EdgeConnect Advanced HA',
  'Suscripción EdgeConnect On-Premises','Boost EdgeConnect (SaaS)','Boost EdgeConnect (On-Premises)',
  'Dynamic Threat Defense','HPE Aruba Networking Central','Licencias perpetuas 9240'];
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
    pintarSkuTaa();
    pintarCatalogoSku();
    // El BOM se pintó antes de que llegara el CSV: se repinta para que el aviso de fin de
    // venta aparezca sin que quien opera tenga que tocar nada.
    renderBom();
  }catch{
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

// El botón vive dentro del submenú colapsable «Cumplimiento Especial / Sector Público»
// (brief 1.1c, 2026-09-13): las variantes solo se ofrecen al abrir el submenú y activar
// el toggle. El contador declara cuántas variantes TAA/NAL/FIPS hay en el catálogo.
function pintarSkuTaa(){
  const n=SKU_CAT.filter(x=>TAA_RE.test(x.d||'')).length;
  $('skuTaa').setAttribute('aria-pressed',String(skuTaaOn));
  $('skuTaa').textContent=`Variantes gubernamentales (TAA / NAL) — ${n} en el catálogo · ${skuTaaOn?'ocultar':'mostrar'}`;
}
$('skuTaa').addEventListener('click',()=>{
  skuTaaOn=!skuTaaOn;
  pintarSkuTaa();
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

/* ══ FASE 11 · E5 — madurez del catálogo ══
   Tres utilidades de la pestaña «Fuentes»: matriz de versiones mínimas de SO, salud de
   las fuentes (vigía bajo demanda) y delta de precios contra una lista nueva. */

// Matriz de versiones mínimas: dos tablas (ECOS para EdgeConnect, AOS 8/10 para gateways).
// El dato llega del servidor (OS_MATRIX en aruba.js) — la página solo lo pinta.
function pintarOsMatrix(){
  const caja=$('osMatrix');
  if(!caja) return;
  if(!OS_MATRIX){ caja.innerHTML='<p class="hint">La matriz de versiones no llegó del servidor.</p>'; return; }
  const filasEcos=Object.entries(OS_MATRIX.ecos||{}).map(([plataforma,v])=>
    `<tr><td><code>${esc(plataforma)}</code></td><td class="n">${v.min?esc(v.min):'—'}</td><td>${esc(v.nota||'')}</td></tr>`).join('');
  const filasAos=Object.entries(OS_MATRIX.aos||{}).map(([serie,v])=>
    `<tr><td><code>${esc(serie)}</code></td><td class="n">${esc(v.a8||'—')}</td><td class="n">${esc(v.a10||'—')}</td></tr>`).join('');
  caja.innerHTML=`
  <h3 style="font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--steel);margin:14px 0 6px">EdgeConnect — ECOS mínimo</h3>
  <div class="scroll"><table class="tco-tabla"><thead><tr><th>Plataforma</th><th>ECOS mínimo</th><th>Notas de tren</th></tr></thead><tbody>${filasEcos}</tbody></table></div>
  <h3 style="font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--steel);margin:14px 0 6px">Gateways — trenes AOS soportados</h3>
  <div class="scroll"><table class="tco-tabla"><thead><tr><th>Serie</th><th>AOS 8</th><th>AOS 10</th></tr></thead><tbody>${filasAos}</tbody></table></div>
  <p class="hint" style="margin-top:8px">SSR = tren de soporte estándar · LSR = tren de soporte largo. Las series 7000/7200 están RETIRED pero alcanzan AOS 10.3.1.1 — un tech refresh no las obliga a quedarse en AOS 8, aunque la recomendación de preventa sigue siendo la generación actual.</p>`;
}

// Salud de las fuentes: corre el vigía contra cada URL pública y pinta el resultado.
// Es bajo demanda (botón) porque cada revisión pega contra los servidores del fabricante.
async function comprobarSaludFuentes(){
  const btn=$('saludBtn'), out=$('saludOut');
  if(!btn||!out) return;
  btn.disabled=true;
  out.innerHTML='<p class="hint">Comprobando fuentes una a una…</p>';
  try{
    const res=await fetch('/api/fuentes/aruba/salud');
    const data=await res.json();
    if(!res.ok) throw new Error(data.error||'error del servidor');
    const filas=(data.fuentes||[]).map(f=>{
      let clase='salud-na', texto=f.estado;
      if(f.estado==='leido'){ clase='salud-ok'; texto=`leído · ${f.bytes?miles(f.bytes)+' bytes':''}${f.tipo?' · '+esc(f.tipo):''}`; }
      else if(f.estado==='inalcanzable'){ clase='salud-mal'; texto=`inalcanzable${f.detalle?' — '+esc(f.detalle):''}`; }
      else if(f.estado==='sin-url'){ texto='sin URL pública — se vigila por commit'; }
      return `<tr><td>${esc(f.documento)}</td><td class="${clase}">${texto}</td></tr>`;
    }).join('');
    out.innerHTML=`<table class="tco-tabla"><thead><tr><th>Documento</th><th>Estado (revisado ${esc((data.revisadoEn||'').slice(0,19).replace('T',' '))} UTC)</th></tr></thead><tbody>${filas}</tbody></table>`;
  }catch(err){
    out.innerHTML=`<p class="hint salud-mal">No se pudo comprobar la salud: ${esc(err.message)}</p>`;
  }finally{
    btn.disabled=false;
  }
}

// Parser CSV mínimo con soporte de campos entrecomillados (comas y comillas dobles).
function parseCsv(texto){
  const filas=[];
  let campo='', fila=[], enComillas=false;
  for(let i=0;i<texto.length;i++){
    const c=texto[i];
    if(enComillas){
      if(c==='"'){ if(texto[i+1]==='"'){ campo+='"'; i++; } else enComillas=false; }
      else campo+=c;
    }else if(c==='"'){ enComillas=true; }
    else if(c===','){ fila.push(campo); campo=''; }
    else if(c==='\n'||c==='\r'){
      if(c==='\r'&&texto[i+1]==='\n') i++;
      fila.push(campo); campo='';
      if(fila.length>1||fila[0]!=='') filas.push(fila);
      fila=[];
    }else campo+=c;
  }
  if(campo!==''||fila.length){ fila.push(campo); filas.push(fila); }
  return filas;
}

function csvAPrecios(texto){
  const filas=parseCsv(texto);
  const mapa={};
  for(let i=1;i<filas.length;i++){
    const [sku,,desc,precio,vigencia,plc]=filas[i];
    if(!sku) continue;
    mapa[sku.trim()]={ desc:(desc||'').trim(), precio:parseFloat(precio)||0, vigencia:(vigencia||'').trim(), plc:(plc||'').trim() };
  }
  return mapa;
}

// Delta de precios: compara una lista subida contra la vigente. Nada se persiste — es
// una comparación en memoria para decidir si conviene actualizar la lista gobernante.
async function compararListaPrecios(archivo){
  const out=$('deltaOut');
  if(!out) return;
  out.innerHTML='<p class="hint">Comparando contra la lista vigente…</p>';
  try{
    const [nueva, vigenteRes]=await Promise.all([
      archivo.text(),
      fetch('/datasheets/aruba-lista-precios-hpe.csv'),
    ]);
    if(!vigenteRes.ok) throw new Error('no se pudo leer la lista vigente del servidor');
    const mapaNueva=csvAPrecios(nueva);
    const mapaVigente=csvAPrecios(await vigenteRes.text());
    const alzas=[], bajas=[], nuevos=[], desaparecidos=[], plcEs=[];
    for(const [sku,n] of Object.entries(mapaNueva)){
      const v=mapaVigente[sku];
      if(!v){ nuevos.push({sku,n}); continue; }
      if(n.precio>v.precio) alzas.push({sku,v,n,delta:(n.precio-v.precio)/v.precio});
      else if(n.precio<v.precio) bajas.push({sku,v,n,delta:(n.precio-v.precio)/v.precio});
      if(v.plc!=='ES'&&n.plc==='ES') plcEs.push({sku,n});
    }
    for(const [sku,v] of Object.entries(mapaVigente)){
      if(!mapaNueva[sku]) desaparecidos.push({sku,v});
    }
    const dinero=x=>BOM.money?BOM.money(x):('$ '+miles(Math.round(x)));
    const cabecera=(titulo,n)=>`<h3 style="font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--steel);margin:14px 0 6px">${titulo} (${n})</h3>`;
    const tabla=(thead,filas)=>`<div class="scroll"><table class="tco-tabla"><thead>${thead}</thead><tbody>${filas}</tbody></table></div>`;
    const filaCambio=(e,clase)=>`<tr><td><code>${esc(e.sku)}</code></td><td>${esc(e.n.desc||e.v.desc)}</td><td class="n">${dinero(e.v.precio)}</td><td class="n">${dinero(e.n.precio)}</td><td class="n ${clase}">${e.delta>0?'+':''}${(e.delta*100).toFixed(1)}%</td></tr>`;
    const theadCambio='<tr><th>SKU</th><th>Descripción</th><th>Vigente</th><th>Nueva</th><th>Δ</th></tr>';
    let html=`<p class="hint">Lista nueva: <b>${Object.keys(mapaNueva).length}</b> SKUs · lista vigente: <b>${Object.keys(mapaVigente).length}</b> SKUs. Comparación solo en memoria — nada se ha guardado.</p>`;
    if(alzas.length)
      html+=cabecera('Subidas de precio',alzas.length)+tabla(theadCambio,alzas.sort((a,b)=>b.delta-a.delta).map(e=>filaCambio(e,'delta-alza')).join(''));
    if(bajas.length)
      html+=cabecera('Bajadas de precio',bajas.length)+tabla(theadCambio,bajas.sort((a,b)=>a.delta-b.delta).map(e=>filaCambio(e,'delta-baja')).join(''));
    if(nuevos.length)
      html+=cabecera('SKUs nuevos',nuevos.length)+tabla('<tr><th>SKU</th><th>Descripción</th><th>Precio</th><th></th></tr>',
        nuevos.map(e=>`<tr><td><code>${esc(e.sku)}</code></td><td>${esc(e.n.desc)}</td><td class="n delta-nuevo">${dinero(e.n.precio)}</td><td class="delta-nuevo">nuevo</td></tr>`).join(''));
    if(desaparecidos.length)
      html+=cabecera('SKUs que desaparecen',desaparecidos.length)+tabla('<tr><th>SKU</th><th>Descripción</th><th>Vigente</th><th></th></tr>',
        desaparecidos.map(e=>`<tr><td><code>${esc(e.sku)}</code></td><td>${esc(e.v.desc)}</td><td class="n">${dinero(e.v.precio)}</td><td class="salud-mal">ya no está</td></tr>`).join(''));
    if(plcEs.length)
      html+=cabecera('Pasan a End of Sale (PLC → ES)',plcEs.length)+tabla('<tr><th>SKU</th><th>Descripción</th><th></th><th></th></tr>',
        plcEs.map(e=>`<tr><td><code>${esc(e.sku)}</code></td><td>${esc(e.n.desc)}</td><td></td><td class="salud-mal">PLC → ES</td></tr>`).join(''));
    if(!alzas.length&&!bajas.length&&!nuevos.length&&!desaparecidos.length&&!plcEs.length)
      html+='<p class="hint salud-ok">Sin diferencias: la lista nueva coincide con la vigente en SKUs, precios y estados PLC.</p>';
    out.innerHTML=html;
  }catch(err){
    out.innerHTML=`<p class="hint salud-mal">No se pudo comparar: ${esc(err.message)}</p>`;
  }
}

(async function initApp(){
  const res = await fetch('/api/dimensionador/aruba');
  const data = await res.json();
  // Pendiente 34: el respaldo de ciclo de vida de ESTE fabricante, tal como lo declara
  // `legacyData/fuentes.js` con sus `campos`. Sin el, la ficha dice «el catalogo no trae el
  // ciclo de vida» en vez de afirmar vigencia por omision.
  FICHA.fijarCicloVida(data.cicloVida);
  MODELS = data.models;
  BUNDLES = data.bundles;
  CARE = data.care;
  CARE_SKU = data.careSkus || {};
  LICENSES = data.licenses;
  LICENSES_HA = data.licensesHa || {};
  SIZING = data.sizing;
  SOFTWARE = data.software || [];
  CENTRAL = data.centralTiers || {};
  CENTRAL_SERIE = data.centralPorSerie || {};
  DATASHEETS = data.datasheets || {};
  OS_MATRIX = data.osMatrix || null;
  ACCESSORY_CATALOG = data.accessories || {};
  ACCESSORY_COMPAT = data.accessoryCompat || {};
  // SPEC parte B: globals nuevos del frente DATOS, con fallback para no romper antes del
  // merge — SSE null (la línea entra en «consultar» con el SKU del contrato) y umbrales
  // Microbranch 10 usuarios / 50 Mbps.
  SSE = data.sse || null;
  MICROBRANCH = data.microbranch || { usuarios: 10, caudalMbps: 50 };
  DTD = data.dtd || null;
  datosListos = true;

  // Fotos oficiales de los equipos para la tarjeta gráfica de la ficha (opt-in
  // `vistas`, 2026-09-16). Se cargan ANTES del primer render para que la tarjeta
  // ya salga con imagen; si el fetch falla, la página sigue operativa y la ficha
  // declara el hueco en vez de inventar una foto.
  try{
    const rv=await fetch('/data/aruba-vistas-equipos.json');
    if(rv.ok) FICHA_CFG.vistas=await rv.json();
  }catch{ /* sin fotos: la ficha declara el hueco, nunca inventa */ }

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
  // Deep-link: ?ficha=abierta abre las características al cargar. El clic pasa por el
  // mismo cauce que el del usuario (toggle de ficha.js + soltar sticky + reponer el
  // parámetro en la URL), así que no hay nada más que sincronizar; sin candidato no
  // hay conmutador y el enlace simplemente abre la página normal.
  if(FICHA_ABIERTA_URL){
    const s=document.getElementById('verdict-salto');
    if(s)s.click();
  }
  renderBom();
  renderCatalogo();
  cargarCatalogoSku();
  pintarOsMatrix();
  PROCEDENCIA.registrarModelos('aruba', () => MODELS.map(m => ({ model: m.id, ...m })));
})();

// E5: salud de fuentes y delta de precios (pestaña «Fuentes»). Se enlazan aquí y no con
// onclick= en el HTML por la misma CSP que el resto de la página.
document.addEventListener('DOMContentLoaded', () => {
  const salud=$('saludBtn');
  if(salud) salud.addEventListener('click', comprobarSaludFuentes);
  const delta=$('deltaCsv');
  if(delta) delta.addEventListener('change', () => {
    if(delta.files&&delta.files[0]) compararListaPrecios(delta.files[0]);
  });
});

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
  // Estado v2 (SPEC B.1): primero se deja el builder con su fila por defecto; ESTADO
  // restaura #wanLinksData si el enlace es v2; si el enlace es v1 (bw/mplsType/inetType…)
  // se migra a filas equivalentes con aviso por consola; y al final se reconstruyen las
  // filas desde la serialización que haya quedado.
  reconstruirWanDesdeHidden();
  const st = ESTADO.vincular({ campos: CAMPOS_ESCENARIO, migrados: PARAMS_V1 });
  // Migración v1→v2: migrarEstadoV1 escribe la serialización en el input oculto; hay que
  // reconstruir las filas DESPUÉS y entonces avisar a ESTADO (sincronizarWanHidden leería
  // las filas viejas y pisaría lo migrado — orden importa).
  if (migrarEstadoV1()) {
    reconstruirWanDesdeHidden();
    $('wanLinksData').dispatchEvent(new Event('input', { bubbles: true }));
  } else {
    reconstruirWanDesdeHidden();
  }
  // Bug de round-trip corregido (etapa A, 2026-09-14): los botones seg se restauran con
  // click() y su listener corre, pero los <select> solo cambian de valor — la estrategia
  // de seguridad restaurada del enlace (#selSeguridad) no llegaba a la variable del motor
  // y el BOM se generaba SIN la línea DTD/SSE que el enlace declaraba.
  secMode=$('selSeguridad').value||'none';
  $('secHint').innerHTML=SEC_HINT[secMode]||SEC_HINT.none;
  if(secMode==='dtd') forzarFamiliaEc('Dynamic Threat Defense');
  else if(secMode==='gwsec') forzarFamiliaGateways('IDS/IPS con Central + Security');
  const anclaje = document.querySelector('.tabs') || document.querySelector('.masthead');
  if (anclaje && anclaje.parentNode) {
    const caja = document.createElement('div');
    caja.className = 'estado-barra';
    caja.style.cssText = 'display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:0 0 14px';
    anclaje.parentNode.insertBefore(caja, anclaje.nextSibling);
    // SIN ESTADO.botonEnlace aquí (2026-09-15, petición del dueño): esta página ya tiene
    // su propio «Copiar enlace del escenario» en la barra MSP (#btnCopiarEscenario, etapa
    // A) y tener los dos era duplicación visible. Las otras seis páginas siguen usando el
    // botón compartido de estado.js, que para ellas es el único.
    ESTADO.avisoOrigen(caja, st);
  }
  // Perfiles multi-sede guardados en este navegador (arubaPerfilesV1): se pintan al arrancar.
  pintarPerfiles();
  // Si el fetch del catálogo llegó ANTES que DOMContentLoaded, initApp ya pintó con el
  // builder vacío: se repinta con las filas restauradas/migradas. Si llegó después, el
  // render de initApp ya lee las filas correctas y esta llamada no cambia nada.
  if (MODELS.length) render();
});

/* ══ ENVIAR AL COTIZADOR ══
   Solo esta pagina sabe que equipo esta elegido ahora mismo; el cotizador pone el precio y
   el resto de la linea desde su propio catalogo. Ver bom.js. */
document.addEventListener('DOMContentLoaded', () => {
  BOM.montarBotonCotizador(() => {
    // M6: sin candidato y sin elección hecha a mano, el valor del desplegable es solo su
    // primera opción (EC-XS), no un equipo que alguien haya decidido cotizar.
    const sel = $('pickModel');
    if (!lastPick && !(sel && sel.dataset.bomManual === '1')) return null;
    const elegido = (sel && sel.value) || (lastPick && lastPick.id) || null;
    if (!elegido) return null;
    return { modelo: elegido, qty: unidadesSitio(),
             de: document.title.split('—')[0].trim() };
  });
});
