'use strict';
// Equivalencia entre el nivel de soporte que elige la pagina y la clave con la que el
// catalogo guarda su precio. Vivia 120 lineas por debajo de su primer uso: funcionaba
// porque quien lo lee corre despues, pero es la misma forma del fallo que dejo el
// dimensionador de Cisco en blanco al usar `capDe` antes de su declaracion.
const CARE_LIC_KEY={fc247:'essential',fcpre:'premium',fcelite:'elite'};
let MODELS = [];
let BUNDLES = {};
let CARE = {};

const $=id=>document.getElementById(id);
let profile='tp', modoCaudal='link', rolSdwan='none', segMode='branch', lastPick=null;
// Ultimo rol con el que se pintaron las filas del builder: la casilla de overlay se
// habilita o deshabilita segun el rol, y repintar en cada render destruiria el campo a
// medio teclear (el mismo motivo por el que BOM.cantidadRef escucha change y no input).
let wanRolPintado=null;
let bomFilas=[], bomMeta={};
// Si el dimensionamiento se queda sin candidatos, el BOM conservaba intacta la cotizacion
// del ultimo equipo que si cumplia: el veredicto decia "Sin candidato" y la pestana de BOM
// seguia ofreciendo un FortiGate 60F completo, exportable a Excel. El BOM no se vacia —se
// puede querer cotizar cualquier equipo a mano— pero tiene que DECIR que ya no corresponde
// a lo que salio del dimensionamiento.
let hayCandidato=true;

// El modelo recomendado se lleva solo a la pestaña de BOM. Se sincroniza unicamente cuando
// la recomendacion CAMBIA, no en cada render: asi, si alguien elige otro modelo a mano para
// compararlo, no se lo pisamos en cuanto mueva un parametro del dimensionamiento.
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

document.querySelectorAll('.tabs button').forEach(b=>b.addEventListener('click',()=>{
  document.querySelectorAll('.tabs button').forEach(x=>x.setAttribute('aria-selected',x===b));
  ['calc','bom','lic','cat','src'].forEach(t=>$('pane-'+t).hidden=(t!==b.dataset.tab));
}));

// Catálogo FortiGate, con la misma tabla que antes vivía en la vista de Fortinet del portal
// (ver CLAUDE.md, 2026-09-09): se pinta desde MODELS, ya cargado para el propio
// dimensionador, en vez de repetir el fetch a /api/catalog para mostrar lo mismo dos veces.
// Se incluyen los modelos fuera de venta (con su marca), a diferencia del portal, que los
// oculta del todo: aquí la filosofía es la de FICHA.rango — se muestran, no se recomiendan.
function renderCatalogo(){
  const tbody=document.querySelector('#tbl-fortinet-cat tbody');
  if(!tbody) return;
  tbody.innerHTML=MODELS.map(m=>`<tr>
    <td><code>${m.id}</code>${m.eol?' <span class="pillc" style="color:var(--red)">Fuera de venta</span>':''}</td><td>${m.seg}</td>
    <td class="n">${m.fw}</td><td class="n">${m.ips}</td><td class="n">${m.ngfw}</td>
    <td class="n">${m.vpn}</td><td>${m.ifaces}</td>
    <td class="n" style="color:var(--amber);white-space:nowrap">${m.elp||'—'}</td>
  </tr>`).join('');
}

$('profileSeg').addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b)return;
  [...$('profileSeg').children].forEach(x=>x.setAttribute('aria-pressed',x===b));
  profile=b.dataset.v;
  render();
});
$('modoSeg').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;[...$('modoSeg').children].forEach(x=>x.setAttribute('aria-pressed',x===b));modoCaudal=b.dataset.v;render();});
$('rolSeg').addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b)return;
  [...$('rolSeg').children].forEach(x=>x.setAttribute('aria-pressed',x===b));
  rolSdwan=b.dataset.v;
  // Un hub concentra sedes: el modo agregado es el que corresponde, y dejarlo en enlace
  // unico es justamente como se dimensiona de menos un concentrador.
  if(rolSdwan==='hub'&&modoCaudal!=='agg'){
    modoCaudal='agg';
    [...$('modoSeg').children].forEach(x=>x.setAttribute('aria-pressed',x.dataset.v==='agg'));
  }
  render();
});
$('segSeg').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;[...$('segSeg').children].forEach(x=>x.setAttribute('aria-pressed',x===b));segMode=b.dataset.v;render();});
// bw/unit/pctOverlay ya no estan aqui: son espejos ocultos que escribe el builder, y este
// dispara render() por su cuenta al cambiar una fila.
['users','perUser','head','sesUser','sessNeed','vidaSes','sites','conc',
 'chkSsl','chkAv','chkWeb','chkSandbox','chkIotDlp','chkHa'].forEach(id=>$(id).addEventListener('input',render));
// En HA se compran 2 unidades y cada una lleva su propia suscripcion FortiGuard: enlazar la
// casilla con la cantidad del BOM evita cotizar un clúster con una sola licencia.
$('chkHa').addEventListener('change',()=>{
  const q=$('qty');
  if($('chkHa').checked){ if((parseInt(q.value)||1)<2) q.value=2; }
  else if((parseInt(q.value)||1)===2){ q.value=1; }
  renderBom();
});
['pickModel','qty','termYears','licBundle','careLevel'].forEach(id=>$(id).addEventListener('input',renderBom));
// La identidad de la propuesta no cambia ningun calculo, pero viaja en el enlace y encabeza
// el Excel, asi que basta con que el BOM se entere.
['nombreCliente','refProyecto'].forEach(id=>{const n=$(id); if(n) n.addEventListener('input',renderBom);});

function fmt(m){
  if(!m) return '—';
  if(m>=1000000)return (m/1e6).toFixed(1).replace(/\.0$/,'')+' Tbps';
  if(m>=1000)return (m/1000).toFixed(m%1000?1:0)+' Gbps';
  return Math.round(m)+' Mbps';
}
const esc=s=>String(s).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));

/* == M1 · MULTI-UNDERLAY BUILDER (2026-09-16) ==
   Sustituye al par «caudal unico + deslizador de % por el overlay». El deslizador era
   una ESTIMACION a ojo justo del numero que fija el segundo techo del motor IPsec:
   capacidad efectiva = min(capa de inspeccion, IPsec / fraccion del overlay). Ahora los
   enlaces del sitio se DECLARAN y la fraccion SALE de ellos.

   LA FILA DE FORTIGATE ES MAS CORTA QUE LA DE ARUBA, A PROPOSITO. Alli es
   {tipo, medio, down, up}; aqui es {tipo, down, overlay}:
     · sin `medio` — este catalogo no trae opticas de Fortinet, asi que una auditoria de
       puertos del chasis seria un dato inventado (el mismo vicio del `noAplica` deducido);
     · sin `up` — el motor consume UN caudal, y un campo que nadie lee es peor que uno
       ausente: invita a creer que se tuvo en cuenta;
     · con `overlay`, que Aruba no necesita — en EdgeConnect el appliance se dimensiona
       por el agregado del sitio, mientras que en FortiGate la fraccion cifrada ES el
       segundo techo. Es el campo propio de este fabricante.

   EL MOTOR NO CAMBIA. Este builder solo CALCULA los dos numeros que render() ya leia
   —#bw (con #unit fijo en Mbps) y #pctOverlay—, que pasan a ser espejos ocultos. Por
   construccion, un escenario equivalente tiene que dar el mismo equipo que antes: eso es
   lo que contrasta scripts/contraste-fortinet.js contra la linea base medida. */
const TIPOS_WAN=['MPLS L3','MPLS L2','DIA','Banda Ancha','4G/5G'];
let wanSeq=0; // ids unicos de fila dentro de la sesion
// Familia del transporte para el badge de la tarjeta (MPLS / Internet / celular).
function familiaTipoWan(tipo){
  if(/^MPLS/.test(tipo)) return {cls:'mpls', n:'MPLS'};
  if(/^4G\/5G/.test(tipo)) return {cls:'cel', n:'Celular'};
  return {cls:'inet', n:'Internet'};
}
// Por defecto va por el overlay lo que no es salida directa a Internet: MPLS y celular
// son transporte del fabric. Es solo un DEFAULT — la casilla manda, y por eso el default
// no se recalcula cuando alguien ya la toco.
function overlaySugerido(tipo){ return /^MPLS|^4G\/5G/.test(tipo); }
// Lee las filas tal como estan pintadas: es la unica fuente de los enlaces, asi el motor,
// la serializacion y los perfiles ven exactamente lo mismo.
function leerWanLinks(){
  return [...document.querySelectorAll('#wanBuilderFilas .wan-fila')].map(f=>{
    const ov=f.querySelector('[data-campo=overlay]');
    return {
      id:parseInt(f.dataset.id)||0,
      tipo:f.querySelector('[data-campo=tipo]').value,
      down:Math.max(0,parseFloat(f.querySelector('[data-campo=down]').value)||0),
      overlay:!!ov.checked,
      overlayManual:ov.dataset.manual==='1',
    };
  });
}
function wanFilaHtml(l,idx){
  const ops=(lista,v)=>lista.map(x=>`<option value="${esc(x)}"${x===v?' selected':''}>${esc(x)}</option>`).join('');
  const fam=familiaTipoWan(l.tipo), n=idx==null?'?':idx+1;
  // Sin rol SD-WAN la casilla del overlay no significa nada: se deshabilita y se dice,
  // en vez de dejarla activa sin efecto (un control que no hace nada invita a creer que
  // se tuvo en cuenta).
  const naOv=rolSdwan==='none';
  return `<div class="wan-fila" data-id="${l.id}">`
    +`<div class="wan-cab"><span class="wan-num">Enlace ${n}</span><span class="wan-badge ${fam.cls}" data-wan-badge>${fam.n}</span>`
    +`<span class="wan-acc">`
    +`<button type="button" class="wan-iconbtn" data-wan-duplicar="${l.id}" title="Duplicar este enlace" aria-label="Duplicar este enlace">&#10697;</button>`
    +`<button type="button" class="wan-iconbtn" data-wan-quitar="${l.id}" title="Quitar este enlace" aria-label="Quitar este enlace">&times;</button>`
    +`</span></div>`
    +`<div class="wan-grid">`
    +`<div class="wan-campo"><label>Transporte</label><select data-campo="tipo" aria-label="Tipo de transporte WAN del enlace ${n}">${ops(TIPOS_WAN,l.tipo)}</select></div>`
    +`<div class="wan-campo"><label>Caudal</label><span class="wan-bw"><input type="number" data-campo="down" min="0" step="any" placeholder="100" value="${l.down||''}" aria-label="Caudal del enlace ${n} en Mbps" autocomplete="off"><span class="wan-sufijo">Mbps</span></span></div>`
    +`<label class="wan-ov${naOv?' na':''}"><input type="checkbox" data-campo="overlay"${l.overlay?' checked':''}${naOv?' disabled':''}${l.overlayManual?' data-manual="1"':''} aria-label="El trafico de este enlace va por el overlay SD-WAN"> ${naOv?'Overlay SD-WAN (sin rol SD-WAN no aplica)':'Va por el overlay SD-WAN'}</label>`
    +`</div>`
    +`<p class="wan-msg" data-wan-msg hidden></p>`
    +`</div>`;
}
function pintarWanFilas(links){
  $('wanBuilderFilas').innerHTML=links.map(wanFilaHtml).join('');
  validarWanFilas();
}
// Validacion en linea: NO bloquea el calculo. Un enlace sin caudal no cuenta en el
// agregado y hay que decirlo; declarar el overlay por un enlace celular es posible pero
// sospechoso y se avisa en ambar.
function validarWanFila(f){
  const downEl=f.querySelector('[data-campo=down]');
  const down=parseFloat(downEl.value);
  const tipo=f.querySelector('[data-campo=tipo]').value;
  const ov=f.querySelector('[data-campo=overlay]').checked;
  const msg=f.querySelector('[data-wan-msg]');
  const malo=!(down>0);
  downEl.classList.toggle('wan-invalido',malo);
  let txt='', cls='';
  if(malo){ txt='Declara el caudal (Mbps): sin el, este enlace no cuenta en el agregado del sitio.'; cls='err'; }
  else if(ov&&/^4G\/5G/.test(tipo)){ txt='Overlay sobre 4G/5G: es normal como respaldo, pero su caudal entra en la fraccion cifrada y por tanto en el techo del motor IPsec. Revisa si de verdad transporta trafico en regimen normal.'; cls='warn'; }
  msg.hidden=!txt; msg.textContent=txt; msg.className='wan-msg'+(cls?' '+cls:'');
}
function validarWanFilas(){ document.querySelectorAll('#wanBuilderFilas .wan-fila').forEach(validarWanFila); }
// LOS ESPEJOS DEL MOTOR. Aqui, y solo aqui, las filas se convierten en los dos numeros
// que render() lee. #unit se fija en 1 porque el builder declara siempre Mbps.
function actualizarEspejos(){
  const links=leerWanLinks();
  const total=links.reduce((a,l)=>a+l.down,0);
  const ovl=links.filter(l=>l.overlay).reduce((a,l)=>a+l.down,0);
  $('bw').value=total?String(total):'';
  $('unit').value='1';
  // Sin caudal declarado la fraccion no se puede calcular: se deja el 100 %, que es el
  // supuesto conservador (todo el trafico paga IPsec) y ademas el valor por defecto de
  // antes. Con caudal, sale de los enlaces.
  $('pctOverlay').value=total?String(Math.round(ovl/total*100)):'100';
  return {links, total, ovl};
}
// Serializacion v2: el escenario viaja en la URL como JSON {v:2, wanLinks:[...]} dentro
// del input oculto #wanLinksData, que ESTADO persiste como un campo mas.
function sincronizarWanHidden(){
  const {links}=actualizarEspejos();
  const h=$('wanLinksData');
  // `overlayManual` es detalle de UI (la restauracion lo deduce: overlay != sugerido ⇒
  // elegido a mano), asi que no ensucia la URL.
  h.value=JSON.stringify({v:2, wanLinks:links.map(l=>({id:l.id, tipo:l.tipo, down:l.down, overlay:l.overlay}))});
  h.dispatchEvent(new Event('input',{bubbles:true}));
}
// Reconstruye las filas desde el input oculto (enlace compartido o perfil guardado).
// Tolerante con JSON roto: cae a una fila DIA vacia en vez de romper la pagina.
function reconstruirWanDesdeHidden(){
  let links=null;
  try{
    const d=JSON.parse($('wanLinksData').value||'null');
    if(d&&Array.isArray(d.wanLinks)&&d.wanLinks.length) links=d.wanLinks;
  }catch{ links=null; }
  if(!links) links=[{id:++wanSeq, tipo:'DIA', down:0, overlay:false}];
  links.forEach(l=>{
    if(!l.id) l.id=++wanSeq; wanSeq=Math.max(wanSeq,l.id);
    if(l.overlay==null) l.overlay=overlaySugerido(l.tipo);
    l.overlayManual=l.overlay!==overlaySugerido(l.tipo);
  });
  pintarWanFilas(links);
  actualizarEspejos();
}
// Barra agregada viva bajo el builder: caudal del sitio, desglose por familia y la
// fraccion cifrada que sale de las casillas — el numero que antes se estimaba a ojo.
function pintarWanResumen(){
  const box=$('wanResumen'); if(!box) return;
  const {links,total,ovl}=actualizarEspejos();
  if(!links.length){ box.hidden=true; box.innerHTML=''; return; }
  const act=links.filter(l=>l.down>0);
  let html=`<span>Caudal del sitio <b>${fmt(total)}</b></span><span class="wan-res-sep">·</span>`;
  if(act.length){
    const nM=act.filter(l=>/^MPLS/.test(l.tipo)).length;
    const nC=act.filter(l=>/^4G\/5G/.test(l.tipo)).length;
    const nI=act.length-nM-nC;
    const fam=[];
    if(nM) fam.push(`${nM} MPLS`);
    if(nI) fam.push(`${nI} Internet`);
    if(nC) fam.push(`${nC} celular`);
    html+=`<span>${act.length} enlace${act.length===1?'':'s'} (${fam.join(', ')})</span>`;
    if(rolSdwan!=='none'){
      const pct=total?Math.round(ovl/total*100):100;
      html+=`<span class="wan-res-sep">·</span><span>Por el overlay <b>${fmt(ovl)}</b> = <b>${pct} %</b>`
        +`${pct<100?` · breakout local <b>${fmt(total-ovl)}</b>`:''}</span>`;
    }
  }else{
    html+='<span>sin enlaces con caudal — declara los Mbps de cada fila</span>';
  }
  box.innerHTML=html;
  box.hidden=false;
}
// Los parametros del escenario ANTERIOR al builder. Viven en UNA constante porque los usan
// dos cosas distintas —`migrarEstadoV1()` para convertirlos y `ESTADO.vincular({migrados})`
// para no denunciarlos como parametros que esta pantalla no entiende— y dos listas iguales
// en dos sitios se desincronizan.
const PARAMS_V1=['bw','unit','pctOverlay'];
// Migracion v1→v2: un enlace antiguo (?bw=2500&unit=1&pctOverlay=70) se convierte en las
// filas equivalentes y se avisa por consola. UN ENLACE VIEJO QUE ATERRIZA CON LOS VALORES
// POR DEFECTO ES PEOR QUE UN 404: no se nota. Con una fraccion intermedia hacen falta DOS
// filas para conservarla —la cifrada y la de breakout—, que es exactamente lo que el
// escenario v1 describia.
function migrarEstadoV1(){
  const p=new URLSearchParams(location.search);
  if(p.has('wanLinksData')) return false; // ya es v2
  if(!PARAMS_V1.some(k=>p.has(k))) return false;
  const bw=(parseFloat(p.get('bw'))||0)*(parseFloat(p.get('unit'))||1);
  if(!(bw>0)) return false;
  const pct=p.has('pctOverlay')?Math.max(0,Math.min(100,parseFloat(p.get('pctOverlay'))||0)):100;
  const ovl=Math.round(bw*pct/100), resto=bw-ovl;
  const links=[];
  if(ovl>0) links.push({id:++wanSeq, tipo:'MPLS L3', down:ovl, overlay:true});
  if(resto>0) links.push({id:++wanSeq, tipo:'DIA', down:resto, overlay:false});
  if(!links.length) links.push({id:++wanSeq, tipo:'DIA', down:bw, overlay:false});
  console.warn('[dimensionador-fortinet] Migracion de estado v1→v2: el caudal unico y el'
    +' porcentaje de overlay (bw/unit/pctOverlay) se convirtieron en', links.length,
    'fila(s) del Multi-Underlay Builder.', links);
  $('wanLinksData').value=JSON.stringify({v:2, wanLinks:links});
  return true;
}
$('btnAddWan').addEventListener('click',()=>{
  const links=leerWanLinks();
  links.push({id:++wanSeq, tipo:'DIA', down:0, overlay:overlaySugerido('DIA')});
  pintarWanFilas(links);
  sincronizarWanHidden();
  render();
});
// Delegacion: un cambio en una fila se aplica SOBRE LA PROPIA TARJETA (sin repintarla, para
// no perder el foco a media cifra), valida en linea, reserializa y repinta el resto.
$('wanBuilder').addEventListener('input',e=>{
  const t=e.target;
  if(!t.dataset||!t.dataset.campo) return;
  const fila=t.closest('.wan-fila');
  if(t.dataset.campo==='overlay') t.dataset.manual='1';
  if(t.dataset.campo==='tipo'&&fila){
    const badge=fila.querySelector('[data-wan-badge]');
    const fam=familiaTipoWan(t.value);
    badge.className='wan-badge '+fam.cls; badge.textContent=fam.n;
    // Default inteligente que NO se impone: si alguien ya toco la casilla, se respeta.
    const ov=fila.querySelector('[data-campo=overlay]');
    if(ov.dataset.manual!=='1') ov.checked=overlaySugerido(t.value);
  }
  if(fila) validarWanFila(fila);
  sincronizarWanHidden();
  render();
});
$('wanBuilder').addEventListener('click',e=>{
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
  // La ultima fila no se quita: se queda vacia.
  if(!links.length) links=[{id:++wanSeq, tipo:'DIA', down:0, overlay:false}];
  pintarWanFilas(links);
  sincronizarWanHidden();
  render();
});


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

// Sobrecarga de encapsulacion del overlay SD-WAN. Un tunel IPsec anade cabecera ESP, IV,
// relleno y trailer; con AES-GCM y MTU de 1500 ronda el 5-8%, y sube si el diseno reduce
// la MTU para evitar fragmentacion. Es un SUPUESTO de esta herramienta, no una cifra que
// Fortinet publique, y solo se aplica a la fraccion de trafico que va por el overlay.
const OVERHEAD_ESP=0.06;

// Software del portafolio Fortinet que acompana al FortiGate en una propuesta. Mismos
// productos y SKU que la tabla de la pestana "Licencias", como datos y no como markup.
const SOFTWARE=[
  {n:'FortiManager', d:'Orquestacion de politicas y SD-WAN. Appliance de entrada FMG-200G: hasta 30 dispositivos/VDOMs.'},
  {n:'FortiAnalyzer', d:'Correlacion y retencion de logs. Appliance de entrada FAZ-150G: hasta 25 GB/dia.'},
  {n:'FortiSandbox', d:'Analisis dinamico de archivos zero-day. Add-on independiente del bundle.'},
  {n:'FortiClient EMS', d:'Gestion de endpoints ZTNA + VPN, licenciado por numero de endpoints.'},
  {n:'FortiSASE', d:'SASE, ZTNA y EPP como servicio, licenciado por usuario.'},
];

// ── PISO DE CAPA POR FUNCION ACTIVA ────────────────────────────────────────
//
// Activar una funcion de inspeccion NO encarece un porcentaje la capa elegida: cambia la
// capa que aplica. El antivirus no suma "un 8% al firewall" — saca la sesion del fast path
// del NP y la cifra que rige pasa a ser Threat Protection, que en gama de sucursal es un
// orden de magnitud menor (FortiGate 60F: 10 Gbps de firewall frente a 700 Mbps de TP).
//
// El motor anterior sumaba recargos al REQUERIMIENTO y dejaba la capa a criterio del
// usuario. Eso rompia en las dos direcciones: con la capa en "firewall puro" y antivirus
// marcado declaraba 93% de holgura sobre un equipo que iba al 100% (factor 14,3x), y con
// la capa ya en Threat Protection contaba dos veces lo mismo, porque TP YA ES
// NGFW + antivirus + logging medido con Enterprise Mix.
//
// Ahora cada funcion impone un PISO y se aplica la capa mas profunda de todas las activas.
// La eleccion del usuario sigue valiendo como base: puede dimensionar contra una capa mas
// exigente de la que sus funciones obligan, pero no contra una mas liviana.
// CAMPOS DEL ESCENARIO. Una sola lista para el enlace compartido y para los perfiles
// multi-sede. Incluye ahora la IDENTIDAD de la propuesta (cliente y referencia) y la
// CONFIGURACION DE LA COTIZACION (modelo, cantidad, termino, bundle y soporte): al subir el
// paso «Equipo y cotizacion» a la escalera, un enlace que no los llevara aterrizaria en el
// escenario correcto con otra cotizacion, que es peor que no llevar nada porque no se nota.
const CAMPOS_ESCENARIO=['nombreCliente','refProyecto',
  // #wanLinksData es la serializacion v2 de los enlaces WAN; sustituye a bw/unit/pctOverlay,
  // que ahora son espejos que el builder calcula y por tanto no viajan (viajarian dos veces
  // el mismo dato, y el desincronizado ganaria segun el orden de restauracion).
  'wanLinksData','users','perUser','head','sesUser','sessNeed','vidaSes','sites','conc',
  'chkSsl','chkAv','chkWeb','chkSandbox','chkIotDlp','chkHa',
  'modoSeg','profileSeg','rolSeg','segSeg',
  'pickModel','qty','termYears','licBundle','careLevel','selDescuento','dtoCustom','verdict-sel'];

const VENDOR='fortinet';
// Que cuenta como OPEX en FortiGate, DECLARADO por esta pagina y no deducido: el bundle
// FortiGuard y el soporte FortiCare son suscripciones por termino; el equipo y los servicios
// unicos (FortiConverter) son CAPEX. BOM.tco suma el precio TAL COMO VIENE y usa los anios
// solo para derivar el anual, que es exactamente la semantica de tierPrice(tier, termYrs)
// -- comprobada leyendola antes de elegir estas categorias, no supuesta.
const OPEX_FORTINET=['Licencias FortiGuard','Soporte'];

const ORDEN_CAPAS=['fw','vpn','ips','ngfw','tp'];
const PISO_POR_FUNCION=[
  {id:'chkAv',     capa:'tp',   n:'Antivirus / Antimalware'},
  {id:'chkWeb',    capa:'ngfw', n:'Web Filtering / Application Control'},
  {id:'chkIotDlp', capa:'tp',   n:'IoT Detection + DLP'},
  {id:'chkSsl',    capa:'tp',   n:'Inspección profunda SSL/TLS'},
];
// FortiSandbox no figura arriba a proposito: analiza FUERA DE BANDA. No consume throughput
// del FortiGate, solo anade latencia al primer encuentro de un archivo. El +10% que se le
// aplicaba antes no correspondia a ninguna cifra medible.

function capaEfectiva(){
  const base=ORDEN_CAPAS.indexOf(profile);
  let idx=base;
  const elevan=[];
  for(const f of PISO_POR_FUNCION){
    const nodo=$(f.id);
    if(!nodo||!nodo.checked) continue;
    const i=ORDEN_CAPAS.indexOf(f.capa);
    if(i>base) elevan.push(f);
    if(i>idx) idx=i;
  }
  return {k:ORDEN_CAPAS[idx], elevan, elevada:idx>base};
}

// La inspección TLS profunda exige el stack completo, así que su piso es Threat Protection
// aunque se haya elegido una capa más liviana. El derate se aplica UNA vez y sobre la
// capacidad — nunca sobre el requerimiento, que sobredimensionaría.
// Fraccion del trafico que viaja cifrada por el fabric. 0 sin SD-WAN.
function fraccionOverlay(){
  if(rolSdwan==='none') return 0;
  const nodo=$('pctOverlay');
  return nodo?Math.max(0,Math.min(100,parseFloat(nodo.value)||0))/100:1;
}

// En un despliegue SD-WAN el trafico del overlay va DENTRO de tuneles IPsec, asi que hay
// dos restricciones simultaneas y no una:
//
//   1. todo el trafico atraviesa la capa de inspeccion elegida;
//   2. la fraccion que va por el overlay atraviesa ademas el motor IPsec.
//
// La capacidad efectiva es el menor de los dos techos. Con el 100% por el overlay eso
// equivale a min(inspeccion, IPsec); con breakout local parcial el techo de IPsec se
// reparte entre menos trafico y deja de ser el limitante — que es exactamente por que una
// sucursal con salida directa a SaaS no necesita subir de gama.
//
// Salvedad de medicion, que conviene decir en una propuesta: Fortinet mide el firewall a
// 1518 bytes y el IPsec a 512, asi que las dos cifras no son estrictamente comparables.
// Tomar el minimo es la lectura conservadora.
function getCap(m){
  const {k}=capaEfectiva();
  const base=m[k]!=null?m[k]:m.ngfw;
  const insp=$('chkSsl').checked?base*SSL_DERATE:base;
  const frac=fraccionOverlay();
  if(!frac||m.vpn==null) return insp;
  return Math.min(insp, m.vpn/frac);
}
// Cual de las dos restricciones manda en este modelo — para poder explicarlo.
function techoQueManda(m){
  const {k}=capaEfectiva();
  const base=m[k]!=null?m[k]:m.ngfw;
  const insp=$('chkSsl').checked?base*SSL_DERATE:base;
  const frac=fraccionOverlay();
  if(!frac||m.vpn==null) return {cual:'inspeccion', insp, ipsec:null};
  return {cual:(m.vpn/frac)<insp?'overlay':'inspeccion', insp, ipsec:m.vpn/frac};
}

// Coincidencia por subcadena en lugar de lista exacta: los `seg` del catálogo son 21 cadenas
// distintas ('SOHO / Teletrabajo', 'DC edge / Enterprise', 'Hyperscale DC'...) y la lista
// exacta anterior dejaba fuera toda la serie G de entrada y 8 variantes de datacenter.
const SEG_MATCH={
  branch:/SOHO|Sucursal|Teletrabajo/i,
  campus:/Campus/i,
  dc:/DC|Carrier|Hyperscale/i,
};

// El texto bajo el selector explica la capa que REALMENTE se va a usar, que no siempre es
// la que el usuario pulsó: si una función la eleva, hay que decirlo donde se elige.
function pintarHintCapa(capa){
  const nodo=$('profileHint');
  if(!nodo) return;
  nodo.innerHTML=capa.elevada
    ? `<b class="warn">Capa elevada a ${esc(TIER_BY_K[capa.k].n)}</b> por ${capa.elevan.map(f=>esc(f.n)).join(', ')}. `
      + `${esc(TIER_BY_K[capa.k].d)} Elegiste ${esc(TIER_BY_K[profile].n)}, pero activar inspección cambia la cifra del datasheet que aplica, no le suma un porcentaje.`
    : esc(TIER_BY_K[capa.k].d);
}

// Los campos que no aplican se ocultan en vez de quedar visibles sin efecto: un control
// que no hace nada es peor que uno ausente, porque invita a creer que se tuvo en cuenta.
function pintarControlesTopologia(){
  const agg=modoCaudal==='agg';
  $('fldAgg').hidden=!agg; $('fldConc').hidden=!agg;
  $('bwLbl').textContent=agg?'Enlaces WAN de UNA sede (underlay)':'Enlaces WAN del sitio (underlay)';
  $('modoHint').textContent=agg
    ? 'Caudal de UNA sede por el número de sedes y por el factor de simultaneidad. Es el modo del concentrador.'
    : 'Un solo caudal, para dimensionar una sede o un perímetro de Internet.';
  // La casilla de overlay de cada fila solo significa algo con rol SD-WAN: se repintan las
  // filas para habilitarla o deshabilitarla, conservando lo declarado.
  if(wanRolPintado!==rolSdwan){ wanRolPintado=rolSdwan; pintarWanFilas(leerWanLinks()); }
  $('rolHint').innerHTML={
    none:'Solo perímetro: el tráfico no viaja por túneles del overlay, así que el techo lo fija únicamente la capa de inspección.',
    spoke:'Sucursal del fabric: el tráfico hacia el hub va cifrado, así que el <b>throughput IPsec del modelo también es un techo</b>, no solo la capa de inspección.',
    hub:'Concentrador: agrega el tráfico de las sedes y termina un túnel por cada una. Se dimensiona con el caudal agregado y con el techo del motor IPsec.',
  }[rolSdwan];
}

function render(){
  const bw=parseFloat($('bw').value)||0;
  const unit=parseFloat($('unit').value);
  const users=parseInt($('users').value)||0;
  const head=(parseFloat($('head').value)||0)/100;
  $('headVal').textContent=Math.round(head*100)+' %';

  // Sin ancho de banda no hay recomendación (regla de preventa 2026-09-13): es el dato
  // mínimo del dimensionamiento; sin él la página pide valores en vez de proponer un
  // equipo a ciegas.
  if(bw<=0){
    lastPick=null;
    const habiaCandidato=hayCandidato;
    hayCandidato=false;
    if(habiaCandidato!==hayCandidato) renderBom();
    const need=$('need'); need.style.left='0%'; $('needLbl').textContent='—';
    $('track').querySelectorAll('.dot,.tick,.pickLabel').forEach(e=>e.remove());
    FICHA.render({vendor:'fortinet', contenedor:'verdict', candidatos:[], recomendado:null,
      vacioTitulo:'Declare los enlaces WAN para recomendar un equipo',
      vacioDetalle:'<p style="margin:0;font-size:13.5px">Ponga el <b>caudal</b> de al menos un enlace del sitio en el paso 3 (y si aplica, usuarios y sesiones) para que el dimensionador proponga los modelos que cumplen.</p>'});
    $('verdict').style.borderLeftColor='var(--steel)';
    $('perfTiers').innerHTML='';
    $('perfNote').textContent='';
    $('sesCalc').textContent='';
    $('cpsCalc').textContent='';
    pintarControlesTopologia();
    pintarWanResumen();
    return;
  }

  // Caudal declarado: una sede, o el agregado de varias con su factor de simultaneidad.
  // Sumar linealmente las sedes de un concentrador sobredimensiona y encarece la
  // propuesta; tomar el caudal de una sola lo deja corto. El factor es el que decide.
  const sites=Math.max(1,parseInt($('sites').value)||1);
  const conc=Math.max(0,Math.min(100,parseFloat($('conc').value)||0))/100;
  $('concVal').textContent=Math.round(conc*100)+' %';
  const caudal = modoCaudal==='agg' ? bw*unit*sites*conc : bw*unit;

  // Sin recargo por funciones: lo que cambia al activarlas es la CAPA contra la que se
  // compara (ver capaEfectiva), no el requerimiento. Sumar ademas un porcentaje contaria
  // dos veces lo mismo, porque las cifras de Enterprise Mix de Fortinet ya incluyen esas
  // funciones activas. El unico factor de seguridad es el margen de crecimiento.
  const perUser=Math.max(0,parseFloat($('perUser').value)||0);
  const bwBaseMbps=caudal*(1+head);
  const userBaseMbps=users*perUser*(1+head);
  const baseNeed=Math.max(bwBaseMbps,userBaseMbps);

  // La fraccion que va por el overlay paga la encapsulacion ESP.
  const frac=fraccionOverlay();
  const effectiveNeed=baseNeed*(1+frac*OVERHEAD_ESP);

  const capa=capaEfectiva();
  pintarHintCapa(capa);
  pintarControlesTopologia();
  pintarWanResumen();

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
  // ── SESIONES CONCURRENTES, DERIVADAS DE LOS USUARIOS ──────────────────────
  //
  // Pedir un total absoluto era pedir un dato que nadie sabe estimar. Lo que si se estima
  // es cuantas sesiones abre un usuario, asi que el total se deriva: usuarios x sesiones.
  // El campo absoluto queda como anulacion para escenarios donde la cifra agregada ya se
  // conoce (CGNAT, portales cautivos).
  //
  // HALLAZGO DE INGENIERIA, contraintuitivo y util: con las densidades de este catalogo
  // —entre 577 y 2121 sesiones concurrentes por Mbps de Threat Protection— la tabla de
  // sesiones NO limita nunca antes que el throughput en un perfil de usuario humano. Con
  // 3 Mbps por usuario harian falta entre 1.700 y 5.500 sesiones POR USUARIO para que
  // empatara. En 500 usuarios con 20 sesiones el eje de sesiones queda a 300x de
  // distancia. Solo empieza a competir cuando el ancho de banda por dispositivo es muy
  // bajo y las sesiones muchas: flotas IoT y CGNAT, a partir de ~50-100 sesiones por
  // dispositivo con menos de 0,1 Mbps cada uno.
  //
  // Lo anterior vale para sesiones CONCURRENTES, que consumen memoria. El eje que si
  // aprieta en campus grandes es el de sesiones NUEVAS POR SEGUNDO, que consume CPU y se
  // desploma con inspeccion proxy: se dimensiona justo debajo, a partir de estas mismas
  // sesiones y de su vida media.
  const sesUser=Math.max(0,parseInt($('sesUser').value)||0);
  const sessOverride=parseInt($('sessNeed').value)||0;
  const sessNeed=sessOverride||Math.round(users*sesUser*(1+head));
  $('sesCalc').innerHTML=sessOverride
    ? `Forzado a <b>${sessOverride.toLocaleString('en-US')}</b> sesiones. Se ignora el cálculo por usuario.`
    : (sesUser&&users
        ? `Calculado: ${users} usuarios x ${sesUser} sesiones + ${Math.round(head*100)} % de margen = <b>${sessNeed.toLocaleString('en-US')}</b> sesiones concurrentes.`
        : 'Sin restricción de sesiones: pon un valor por usuario o un total.');

  // ── SESIONES NUEVAS POR SEGUNDO (CPS) ─────────────────────────────────────
  //
  // Cierra el hallazgo 05 de la auditoria. Son dos ejes distintos y se confundian en uno:
  // una sesion ABIERTA cuesta memoria (la mide `sess`), ABRIRLA cuesta CPU (la mide `cps`).
  // Un perfil puede ir holgado en la tabla de sesiones y estrangulado en el caudal de
  // sesiones nuevas — es lo que pasa con trafico de APIs, escaneos y portales.
  //
  // No se pide como dato suelto: se DERIVA de lo que ya se declaro. Si un usuario sostiene
  // N sesiones y cada una vive V segundos, en regimen estacionario abre N/V por segundo.
  // Asi el modelo queda coherente con el eje de concurrentes en vez de pedir dos cifras
  // que el preventa tendria que inventar por separado.
  //
  // La vida media por defecto (30 s) es un supuesto de esta herramienta, no una cifra
  // publicada, y se declara como tal en la pagina.
  const vidaSes=Math.max(1,parseInt($('vidaSes').value)||30);
  const cpsNeed=sessNeed?Math.round(sessNeed/vidaSes):0;
  $('cpsCalc').innerHTML=cpsNeed
    ? `${sessNeed.toLocaleString('en-US')} sesiones sostenidas / ${vidaSes} s de vida media = <b>${cpsNeed.toLocaleString('en-US')} sesiones nuevas por segundo</b>. La tabla de sesiones es el eje de memoria; éste es el de CPU.`
    : 'Sin sesiones declaradas no se puede derivar el caudal de sesiones nuevas por segundo.';

  // Un unico lugar decide que eje limita, para que la ficha, el resumen y la exportacion no
  // puedan contradecirse. Un eje sin dato en el catalogo no entra: no se puede declarar
  // ganador ni perdedor a algo que no se midio.
  const ejesDe=m=>{
    const e=[{n:'Throughput', frase:'el throughput', o:effectiveNeed/getCap(m)}];
    if(sessNeed&&m.sess) e.push({n:'Tabla de sesiones', frase:'la tabla de sesiones', o:sessNeed/m.sess});
    if(cpsNeed&&m.cps!=null) e.push({n:'Sesiones nuevas / s', frase:'las sesiones nuevas por segundo', o:cpsNeed/m.cps});
    return e;
  };
  const ejeQueManda=m=>ejesDe(m).reduce((x,y)=>y.o>x.o?y:x);
  const ejeQueLimita=m=>{
    const g=ejeQueManda(m);
    return g.n==='Throughput'?'Throughput':`<b class="warn">${g.n}</b>`;
  };

  let outBySess=0, outByCps=0;
  // Los descontinuados YA NO se borran de la lista: antes desaparecian, asi que no habia
  // forma de consultarlos aqui cuando lo que se cotiza es ampliar un parque instalado.
  // Ahora entran, van al final y no pueden salir recomendados — ver la regla en ficha.js.
  const candidates=FICHA.ordenar(MODELS.filter(m=>{
    if(getCap(m)<effectiveNeed) return false;
    if(sessNeed&&m.sess<sessNeed){ outBySess++; return false; }
    // m.cps==null no es "no tiene limite", es "el catalogo no trae el dato": no se filtra
    // por el, y la ficha del modelo lo declara ausente en vez de dejarlo pasar en silencio.
    if(cpsNeed&&m.cps!=null&&m.cps<cpsNeed){ outByCps++; return false; }
    return true;
  }), (a,b)=>getCap(a)-getCap(b));
  const rx=SEG_MATCH[segMode];
  let pick=FICHA.recomendar(candidates, rx?(m=>rx.test(m.seg)):null);
  lastPick=pick;
  // El BOM se sincroniza UNA vez, al final, con el equipo ELEGIDO. Aqui habia una segunda
  // llamada con el recomendado: repintaba el BOM entero con un equipo y acto seguido lo
  // repintaba con otro en cada pulsacion de tecla.
  //
  // El aviso de desajuste solo aparece si el BOM se vuelve a pintar, y quedarse sin
  // candidatos no cambia el modelo cotizado — asi que hay que forzarlo en la transicion.
  const habiaCandidato=hayCandidato;
  hayCandidato=!!pick;
  if(habiaCandidato!==hayCandidato) renderBom();

  // ── Presentacion ──────────────────────────────────────────────────────────
  // El veredicto pasa de un unico equipo fijo a un desplegable con todos los que cumplen;
  // la escalera de capas, el resumen y el BOM siguen al equipo ELEGIDO. Ver /js/ficha.js.
  if(!pick){
    const why=[];
    why.push(`<li>Requerimiento de <b>${fmt(effectiveNeed)}</b> en la capa <b>${TIER_BY_K[capa.k].n}</b>${$('chkSsl').checked?' con inspección SSL profunda':''}.</li>`);
    if(capa.elevada) why.push(`<li>La capa se elevó de <b>${TIER_BY_K[profile].n}</b> a <b>${TIER_BY_K[capa.k].n}</b> por ${capa.elevan.map(f=>esc(f.n)).join(', ')}.</li>`);
    if(outBySess) why.push(`<li><b>${outBySess}</b> modelo(s) descartado(s) por tabla de sesiones: necesitas ${sessNeed.toLocaleString('en-US')} concurrentes.</li>`);
    // Caso raro pero posible: hay equipos que cumplen, pero todos estan fuera de venta.
    // Decirlo es mas util que decir "ningun modelo cumple", que seria falso.
    if(candidates.length) why.push(`<li><b>${candidates.length}</b> equipo(s) cumplen las restricciones pero están <b>fuera de venta</b> (${candidates.map(m=>esc(m.id)).join(', ')}): sirven como referencia para un parque ya instalado, no como propuesta para un diseño nuevo.</li>`);
    if(outByCps) why.push(`<li><b>${outByCps}</b> modelo(s) descartado(s) por sesiones nuevas por segundo: necesitas ${cpsNeed.toLocaleString('en-US')} cps y el catálogo publica esa cifra para ellos.</li>`);
    if(capa.k==='tp'||$('chkSsl').checked) why.push('<li>Estás dimensionando contra la capa más exigente. Si el diseño no requiere antivirus en línea sobre todo el tráfico, evaluar la capa <b>NGFW</b> o segmentar por política qué tráfico se inspecciona a fondo — es la palanca que más capacidad libera en FortiGate.</li>');
    why.push('<li>Por encima del catálogo: evaluar chasis FortiGate 7000F o distribuir la carga en varias unidades.</li>');
    FICHA.render({vendor:'fortinet', contenedor:'verdict', candidatos:[], recomendado:null,
      vacioTitulo:'Ningún modelo vigente cumple todas las restricciones',
      vacioDetalle:`<ul style="margin:0;padding-left:18px;font-size:13.5px">${why.join('')}</ul>`});
    $('verdict').style.borderLeftColor='var(--amber)';
    $('perfTiers').innerHTML='';
    return;
  }
  $('verdict').style.borderLeftColor='var(--red)';

  const medidoresDe=m=>[
    {etq:`Capa ${TIER_BY_K[capa.k].n}${$('chkSsl').checked?' + SSL':''}`,
     val:effectiveNeed, tope:getCap(m), txt:fmt(effectiveNeed)+' / '+fmt(getCap(m))},
    {etq:'Sesiones concurrentes', val:sessNeed, tope:m.sess,
     txt:(sessNeed?sessNeed.toLocaleString('en-US')+' / ':'')+(m.sess/1000).toFixed(0)+'K'},
  ].concat(m.cps!=null?[
    {etq:'Sesiones nuevas / s', val:cpsNeed, tope:m.cps,
     txt:(cpsNeed?cpsNeed.toLocaleString('en-US')+' / ':'')+m.cps.toLocaleString('en-US')},
  ]:[]);

  const porQueDe=m=>{
    const flags=[];
    if($('chkSsl').checked)flags.push(`<b class="warn">Inspección SSL profunda:</b> capacidad estimada en ${fmt(getCap(m))} sobre los ${fmt(m.tp)} de Threat Protection. Fortinet ya no publica esta cifra por modelo — validar con una PoC antes de comprometerla.`);
    if($('chkAv').checked)flags.push('El antivirus en línea es lo que fija el piso en Threat Protection: esa cifra ya lo incluye, junto con el logging. El content processor (CP9/CP10) asiste la inspección.');
    if($('chkSandbox').checked)flags.push('FortiSandbox analiza <b>fuera de banda</b>: se cotiza aparte y <b>no consume throughput del FortiGate</b>, solo añade latencia al primer encuentro de un archivo. Por eso no eleva la capa de dimensionamiento.');
    if($('chkIotDlp').checked)flags.push('IoT Security y DLP requieren el bundle <b>Enterprise Protection</b> (UTP y ATP no los incluyen) y elevan el piso a Threat Protection, porque corren sobre el stack completo.');
    if($('chkHa').checked)flags.push('<b>HA:</b> se cotizan 2 unidades y <b>cada una necesita su propia suscripción FortiGuard</b> — la licencia no se comparte entre nodos del clúster.');
    if(rolSdwan!=='none'){
      const t=techoQueManda(m);
      flags.push(t.cual==='overlay'
        ? `<b class="warn">Manda el overlay:</b> con ${Math.round(frac*100)} % del tráfico cifrado, el motor IPsec (${fmt(m.vpn)}) limita antes que la capa de inspección (${fmt(t.insp)}). El techo efectivo es ${fmt(getCap(m))}.`
        : `El techo lo fija la capa de inspección (${fmt(t.insp)}); el motor IPsec da de sobra para el ${Math.round(frac*100)} % que va cifrado.`);
      flags.push(`Sobre el requerimiento se suma un ${Math.round(OVERHEAD_ESP*100)} % de encapsulación ESP sobre la fracción del overlay — supuesto de esta herramienta, no una cifra publicada por Fortinet.`);
      flags.push('<b>SD-WAN sin costo de licencia:</b> el balanceo por SLA, ADVPN y la selección dinámica de camino vienen en FortiOS. No hay suscripción por dispositivo como en Cisco Catalyst SD-WAN o Meraki.');
    }
    if(rolSdwan==='hub'&&modoCaudal==='agg') flags.push(`<b>Escala del fabric:</b> ${sites} túnel(es) del overlay a terminar. <b class="warn">El límite de túneles por modelo no está en este catálogo</b> — confirmarlo en el datasheet del ${esc(m.id)} antes de cotizar. Con ADVPN los shortcuts spoke-a-spoke son dinámicos y no cuentan contra el hub.`);
    if($('chkHa').checked) flags.push('En <b>activo-pasivo el clúster no suma capacidad</b>: el throughput sigue siendo el de una unidad. El par se cotiza por disponibilidad, no por rendimiento.');
    // Que eje manda, y a que distancia esta el otro: es lo que evita subir de gama por un
    // limite que en realidad esta a dos ordenes de magnitud.
    if(sessNeed&&m.sess){
      const pc=o=>(o*100)<1?(o*100).toFixed(2)+' %':Math.round(o*100)+' %';
      // `manda` tiene que salir de ESTE array: si se pide a ejeQueManda() devuelve otro
      // objeto equivalente y el filtro por identidad deja dentro al propio eje ganador.
      const ejes=ejesDe(m);
      const manda=ejes.reduce((x,y)=>y.o>x.o?y:x);
      const otros=ejes.filter(e=>e!==manda);
      flags.push(`<b${manda.n==='Throughput'?'':' class="warn"'}>Manda ${manda.frase}</b>: ${pc(manda.o)} de lo que da el modelo.`+
        (otros.length?` Los demás ejes van en ${otros.map(e=>`${e.frase} ${pc(e.o)}`).join(' y ')} — el más cercano queda a <b>${(manda.o/Math.max(...otros.map(e=>e.o))).toFixed(1)}x</b> del que manda. Subir de gama por un eje que no es el que limita no compra nada.`:''));
      if(m.cps==null){
        flags.push(`<b class="warn">Sesiones nuevas por segundo sin dato:</b> el catálogo no trae la cifra del ${esc(m.id)}, así que ese eje <b>no se comprobó</b> para este modelo (se necesitarían ${cpsNeed?cpsNeed.toLocaleString('en-US'):'—'} cps). Es el eje de CPU y es el que aprieta con sesiones cortas y masivas: confirmarlo en el Product Matrix antes de cerrar el diseño.`);
      }else{
        flags.push(`Los <b>${m.cps.toLocaleString('en-US')} cps</b> del ${esc(m.id)} son la cifra en <b>modo flow</b>. Con inspección <b>proxy</b> (antivirus en modo proxy, inspección SSL profunda) el caudal de sesiones nuevas cae, y <b>Fortinet no publica cuánto</b>: con este perfil al ${pc(cpsNeed/m.cps)} conviene dejar margen o validar con PoC.`);
      }
    }
    return `<ul style="margin:8px 0 0;padding-left:18px;font-size:13.5px">
      <li>Requerimiento <b>${fmt(effectiveNeed)}</b> en capa <b>${esc(TIER_BY_K[capa.k].n)}</b> contra capacidad <b>${fmt(getCap(m))}</b> — headroom ${Math.round((1-effectiveNeed/getCap(m))*100)}%</li>
      ${capa.elevada?`<li><b class="warn">Capa elevada:</b> elegiste <b>${esc(TIER_BY_K[profile].n)}</b>, pero ${capa.elevan.map(f=>esc(f.n)).join(' y ')} obliga${capa.elevan.length>1?'n':''} a dimensionar contra <b>${esc(TIER_BY_K[capa.k].n)}</b>. Activar inspección saca la sesión del fast path del ASIC: no es un recargo porcentual, es otra cifra del datasheet.</li>`:''}
      <li>Sesiones concurrentes: <b>${(m.sess/1000).toFixed(0)}K</b> | Sesiones nuevas/s: <b>${m.cps!=null?m.cps.toLocaleString('en-US'):'<span class="warn">sin dato en el catálogo</span>'}</b> | Interfaces: ${esc(m.ifaces)}</li>
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
        ['Sesiones nuevas / s (TCP)', m.cps!=null?m.cps.toLocaleString('en-US'):'<span class="warn">no está en el catálogo — ver Product Matrix</span>'],
        ['Procesadores de seguridad', m.asic?esc(m.asic):'<span class="warn">sin dato publicado</span>'],
        ['Interfaces', esc(m.ifaces), true],
        ['SKU de hardware', m.hwSku?`<code>${esc(m.hwSku)}</code>`:'<span class="warn">Descontinuado — sin SKU nuevo</span>'],
        ['Precio de lista ref.', m.elp?esc(m.elp):'Consultar distribuidor'],
      ]},
      FICHA.seccionAlimentacion(m),
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
        <tr><td>Capa seleccionada</td><td class="n">${esc(TIER_BY_K[profile].n)}</td></tr>
        <tr><td><b>Capa efectiva</b></td><td class="n"><b>${esc(TIER_BY_K[capa.k].n)}</b>${capa.elevada?' <span class="warn">(elevada)</span>':''}</td></tr>
        ${capa.elevada?`<tr><td>Motivo de la elevación</td><td class="n">${capa.elevan.map(f=>esc(f.n)).join(', ')}</td></tr>`:''}
        <tr><td>Inspección SSL profunda</td><td class="n">${$('chkSsl').checked?`Sí — piso Threat Protection x${SSL_DERATE} (estimado)`:'No'}</td></tr>
        <tr><td>Modo de caudal</td><td class="n">${modoCaudal==='agg'?`Agregado — ${sites} sedes x ${fmt(bw*unit)} x ${Math.round(conc*100)} %`:'Enlace único'}</td></tr>
        <tr><td>Caudal resultante</td><td class="n">${fmt(caudal)}</td></tr>
        <tr><td>Usuarios estimados</td><td class="n">${users}${perUser?` x ${perUser} Mbps`:' (sin tráfico por usuario)'}</td></tr>
        <tr><td>Rol SD-WAN</td><td class="n">${{none:'Sin SD-WAN',spoke:'Spoke (sucursal)',hub:'Hub (concentrador)'}[rolSdwan]}</td></tr>
        ${frac?`<tr><td>Tráfico por el overlay</td><td class="n">${Math.round(frac*100)} % · +${Math.round(OVERHEAD_ESP*100)} % ESP</td></tr>`:''}
        <tr><td>Requerimiento final</td><td class="n"><b>${fmt(effectiveNeed)}</b></td></tr>
        <tr><td>Capacidad efectiva</td><td class="n">${fmt(getCap(m))}${rolSdwan!=='none'&&techoQueManda(m).cual==='overlay'?' <span class="warn">(limita el overlay)</span>':''}</td></tr>
        <tr><td>Headroom disponible</td><td class="n">${Math.round((1-effectiveNeed/getCap(m))*100)}%</td></tr>
        <tr><td>Sesiones por usuario</td><td class="n">${sessOverride?'—  (total forzado)':sesUser||'—'}</td></tr>
        <tr><td>Sesiones concurrentes</td><td class="n">${sessNeed?sessNeed.toLocaleString('en-US')+' / ':''}${m.sess.toLocaleString('en-US')}</td></tr>
        <tr><td>Vida media de sesión</td><td class="n">${vidaSes} s</td></tr>
        <tr><td>Sesiones nuevas / s</td><td class="n">${cpsNeed?cpsNeed.toLocaleString('en-US')+' / ':''}${m.cps!=null?m.cps.toLocaleString('en-US'):'<span class="warn">sin dato</span>'}</td></tr>
        ${sessNeed&&m.sess?`<tr><td>Eje que limita</td><td class="n">${ejeQueLimita(m)}</td></tr>`:''}
        <tr><td>Unidades a cotizar</td><td class="n">${$('chkHa').checked?'2 (HA) — licencia por unidad':'1'}</td></tr>
      </tbody></table>`;
  };

  const elegidoId=FICHA.render({vendor:'fortinet', 
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
  const activeK=capaEfectiva().k;
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
// El catalogo Fortinet no tiene campo de serie: se deriva del propio id
// ("FortiGate 120G" -> familia G, numero 120). Los cortes por numero siguen el
// posicionamiento de Fortinet: G/F de 2-3 cifras son sucursal, F de 4 cifras es
// gama alta/DC y 7xxxF es chasis de operador.
function serieFortinet(id){
  const mm=/(\d+)([GF])/.exec(id);
  if(!mm) return 'Otros';
  const n=parseInt(mm[1]), fam=mm[2];
  if(fam==='G') return n>=1000 ? 'FortiGate G — Data Center / Operador' : 'FortiGate G — Sucursal / SOHO';
  if(n>=7000) return 'FortiGate F — Chasis / Operador';
  return n>=1000 ? 'FortiGate F — Gama alta / Data Center' : 'FortiGate F — Sucursal / Mediana empresa';
}
function populatePickModel(){
  // Orden fijo de familia y de modelo dentro de la familia (numerico por el id): la API
  // puede servir el catalogo en cualquier orden y el combo no puede depender de eso.
  const ORDEN=['FortiGate G — Sucursal / SOHO','FortiGate G — Data Center / Operador',
    'FortiGate F — Sucursal / Mediana empresa','FortiGate F — Gama alta / Data Center',
    'FortiGate F — Chasis / Operador','Otros'];
  const numDe=id=>{const mm=/(\d+)/.exec(id);return mm?parseInt(mm[1]):0;};
  const grupos=new Map();
  for(const m of MODELS){
    const g=serieFortinet(m.id);
    if(!grupos.has(g)) grupos.set(g,[]);
    grupos.get(g).push(m);
  }
  const ordenados=[...grupos.entries()].sort((a,b)=>ORDEN.indexOf(a[0])-ORDEN.indexOf(b[0]));
  for(const [,ms] of ordenados) ms.sort((a,b)=>numDe(a.id)-numDe(b.id));
  $('pickModel').innerHTML=ordenados.map(([g,ms])=>
    `<optgroup label="${g}">`+ms.map(m=>`<option value="${m.id}">${m.id} — ${m.seg}${m.eol?' (EOL)':''}</option>`).join('')+`</optgroup>`
  ).join('');
}

const money=n=>n==null?null:'$'+n.toLocaleString('en-US',{maximumFractionDigits:2});
function tierPrice(tier,termYrs){
  if(!tier) return null;
  const v=termYrs===1?tier.y1:termYrs===5?tier.y5:tier.y3;
  return v==null?null:v;
}


// CAPA COMERCIAL (2026-09-16). Los tres bloques —simulador de precio neto, TCO y perfiles
// multi-sede— ya vivian en js/bom.js desde el 2026-09-13, construidos al sacarlos del
// archivo de Aruba. Esta pagina no los usaba: de las 20 funciones de BOM que usa Aruba,
// Fortinet usaba 6. No hace falta un dato nuevo para encenderlos, solo declarar lo que es
// del fabricante.
const DTO=BOM.simuladorDescuento('cajaDescuento',()=>renderBom());
const dtoActual=()=>DTO?DTO.valor():0;
const dtoEtiqueta=()=>DTO?DTO.etiqueta():null;
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

  // Coherencia con el dimensionamiento, declarada en vez de supuesta. Son dos desajustes
  // distintos y conviene no confundirlos: que el dimensionamiento no tenga candidato, y que
  // este cotizando un equipo distinto del que hay elegido en la pestana de calculo.
  // El aviso de desvio ya no se escribe aqui: lo da js/bom.js, para que los siete
  // fabricantes digan lo mismo con las mismas palabras.
  const aviso=BOM.avisoDesvio({elegido:FICHA.elegido('verdict'), enBom:m.id, hayCandidato});


  let html=`<section class="panel"><h2>Ficha del equipo</h2>
    <div class="model" style="font-size:28px">${m.id}</div>
    <p class="family">${m.seg} · FortiOS · Security Fabric</p>${aviso}
    <div class="scroll"><table><thead><tr><th>Métrica</th><th>Valor</th></tr></thead><tbody>
    <tr><td>SKU hardware</td><td class="n">${m.hwSku?`<code>${esc(m.hwSku)}</code>`:'<span class="warn">Descontinuado — sin SKU nuevo vigente</span>'}</td></tr>
    <tr><td>Precio de lista ref. (equipo)</td><td class="n">${m.elp?esc(m.elp):'Consultar distribuidor'}</td></tr>
    <tr><td>Firewall (1518 B, offload ASIC)</td><td class="n">${fmt(m.fw)}</td></tr>
    <tr><td>IPsec VPN (512 B, offload ASIC)</td><td class="n">${fmt(m.vpn)}</td></tr>
    <tr><td>IPS (Enterprise Mix)</td><td class="n">${fmt(m.ips)}</td></tr>
    <tr><td>NGFW (IPS + App Control)</td><td class="n">${fmt(m.ngfw)}</td></tr>
    <tr><td><b>Threat Protection</b> (NGFW + AV + log)</td><td class="n"><b>${m.tp?fmt(m.tp):'Consultar datasheet'}</b>${m.tp&&m.fw?` <span class="warn">(${Math.round(m.fw/m.tp)}x menos que el firewall puro)</span>`:''}</td></tr>
    <tr><td>Sesiones concurrentes</td><td class="n">${m.sess.toLocaleString('en-US')}</td></tr>
    <tr><td>Sesiones nuevas / s (TCP, modo flow)</td><td class="n">${m.cps!=null?m.cps.toLocaleString('en-US'):'<span class="warn">no está en el catálogo</span>'}</td></tr>
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
      `  Sesiones nuevas / s (flow):      ${m.cps!=null?m.cps.toLocaleString('en-US'):'no esta en el catalogo - ver Product Matrix'}`,
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

  const dto=dtoActual();
  $('bomTabla').innerHTML=BOM.renderTabla(filas,{
    dto,
    aviso:qty>1?'Clúster HA: cada nodo lleva su propia suscripción FortiGuard y su propio contrato FortiCare.':null,
  });

  // TCO. El calculo vive en BOM.tco y se hace sobre las FILAS, que ya son la forma neutra
  // que los siete comparten; esta pagina solo declara QUE cuenta como OPEX, porque que una
  // suscripcion sea recurrente es el modelo comercial del fabricante y no una propiedad de
  // la fila. Las lineas sin precio no se estiman: se cuentan y se dicen.
  const fin=BOM.tco(filas,{opex:OPEX_FORTINET, anios:termYrs});
  const hayPrecios=fin.capex>0||fin.opexTermino>0;
  const celdaNet=v=>dto>0?`<td><b>${BOM.money(v*(1-dto))}</b></td>`:'';
  $('tcoFin').innerHTML=hayPrecios
    ?`<table class="tco-tabla"><thead><tr><th>Pie de la lista de materiales</th><th>Subtotal Lista</th>${dto>0?'<th>Subtotal Neto</th>':''}</tr></thead><tbody>`
      +`<tr><td><b>CAPEX</b> — equipo y servicios únicos (one-time)</td><td>${BOM.money(fin.capex)}</td>${celdaNet(fin.capex)}</tr>`
      +`<tr><td><b>OPEX anual</b> — FortiGuard + FortiCare del término ÷ ${termYrs} año${termYrs>1?'s':''}</td><td>${BOM.money(fin.opexAnual)}</td>${celdaNet(fin.opexAnual)}</tr>`
      +`<tr><td><b>TCO a ${termYrs} año${termYrs>1?'s':''}</b> — CAPEX + OPEX anual × ${termYrs}</td><td><b>${BOM.money(fin.tco)}</b></td>${celdaNet(fin.tco)}</tr>`
      +'</tbody></table>'
      +(fin.sinPrecio?`<p class="hint" style="margin-top:8px">${fin.sinPrecio} línea(s) sin precio no entran en la suma: están en «consultar» a propósito, no estimadas.</p>`:'')
      +'<p class="hint" style="margin-top:8px">El neto es un <b>simulador genérico de tramos partner — no refleja el descuento real del distribuidor Fortinet</b>. Precios de lista AMER, sin impuestos.</p>'
    :'<p class="hint">Sin precios suficientes para calcular el TCO: el equipo o las licencias están en «consultar».</p>';

  pintarPerfiles();
  $('bomOut').value=BOM.comoTexto(filas,meta);
  bomMeta=meta; bomFilas=filas;

}


/* ── PERFILES MULTI-SEDE ───────────────────────────────────────────────────
   Un perfil guarda el escenario completo mas cuantas sedes identicas se cotizan con el.
   El almacen es UNO SOLO para los siete fabricantes (js/bom.js, clave `presales-perfiles`):
   un despliegue real de 50 sedes mezcla marcas —spokes FortiGate contra un core Nokia— y
   una clave por pagina hacia que el consolidado de cada fabricante ignorara al resto en
   silencio.

   CARGAR ES DEL FABRICANTE; CONSOLIDAR NO. `campos` son los ids del formulario de ESTA
   pagina, asi que aplicar un perfil de Aruba aqui no significa nada; `filas` es la forma
   neutra que los siete comparten, y por eso el BOM global suma todos. */
const cargarPerfiles=()=>BOM.perfilesDe(VENDOR);

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
  // PERFILES GUARDADOS ANTES DEL BUILDER. Viven en localStorage y llevan bw/unit/pctOverlay
  // pero no wanLinksData: aplicarlos tal cual dejaria el escenario SIN caudal y en silencio
  // —la misma perdida muda que la clave por pagina de `presales-bom-refs`—. Se convierten
  // con la misma regla que migrarEstadoV1().
  if(v.wanLinksData==null&&v.bw!=null){
    const bw=(parseFloat(v.bw)||0)*(parseFloat(v.unit)||1);
    if(bw>0){
      const pct=v.pctOverlay!=null?Math.max(0,Math.min(100,parseFloat(v.pctOverlay)||0)):100;
      const ovl=Math.round(bw*pct/100), resto=bw-ovl, links=[];
      if(ovl>0) links.push({id:++wanSeq, tipo:'MPLS L3', down:ovl, overlay:true});
      if(resto>0) links.push({id:++wanSeq, tipo:'DIA', down:resto, overlay:false});
      v={...v, wanLinksData:JSON.stringify({v:2, wanLinks:links})};
      console.warn('[dimensionador-fortinet] Perfil anterior al builder: su caudal y su'
        +' porcentaje de overlay se convirtieron en', links.length, 'enlace(s).', links);
    }
  }
  CAMPOS_ESCENARIO.forEach(id=>{
    const n=$(id); if(!n||v[id]==null) return;
    if(n.classList&&n.classList.contains('seg')){
      const b=[...n.children].find(x=>x.dataset.v===v[id]); if(b) b.click();
    }else if(n.type==='checkbox'){ n.checked=!!v[id]; }
    else n.value=v[id];
  });
  // Las filas se reconstruyen DESPUES de restaurar el campo oculto: leerlas antes daria las
  // del escenario anterior y pisaria lo que el perfil trae.
  reconstruirWanDesdeHidden();
  render(); renderBom();
}

$('btnGuardarPerfil').addEventListener('click',()=>{
  const nombre=$('nombrePerfil').value.trim();
  const sedes=Math.max(0,parseInt($('perfilSedes').value)||0);
  if(!nombre||!sedes){ $('nombrePerfil').focus(); return; }
  const m=MODELS.find(x=>x.id===$('pickModel').value);
  if(!m||!bomFilas.length) return;
  BOM.guardarPerfil({nombre, sedes, modelo:m.id, vendor:VENDOR,
    fecha:new Date().toISOString().slice(0,10),
    version:1, campos:capturarCampos(), filas:JSON.parse(JSON.stringify(bomFilas))});
  $('nombrePerfil').value=''; $('perfilSedes').value='';
  pintarPerfiles();
});

function pintarPerfiles(){
  const caja=$('listaPerfiles'); if(!caja) return;
  const l=cargarPerfiles();
  caja.innerHTML=l.length
    ?'<table class="tco-tabla"><thead><tr><th>Perfil</th><th>Sedes</th><th>Modelo</th><th>Guardado</th><th></th></tr></thead><tbody>'
      +l.map(x=>`<tr><td><b>${esc(x.nombre)}</b></td><td>${x.sedes}</td><td>${esc(x.modelo)}</td><td>${x.fecha||'—'}</td>`
        +`<td><button type="button" class="btn ghost" data-perfil-cargar="${esc(x.id)}" style="font-size:10px;padding:3px 8px">Cargar</button> `
        +`<button type="button" class="btn ghost" data-perfil-borrar="${esc(x.id)}" style="font-size:10px;padding:3px 8px">Eliminar</button></td></tr>`).join('')
      +'</tbody></table>'
    :'<p class="hint">Sin perfiles guardados todavía.</p>';
  $('btnConsolidar').disabled=!l.length;
}

$('listaPerfiles').addEventListener('click',e=>{
  const b=e.target.closest('button'); if(!b) return;
  if(b.dataset.perfilCargar!=null){
    const x=cargarPerfiles().find(y=>y.id===b.dataset.perfilCargar);
    if(x&&x.campos) aplicarCampos(x.campos);
  }else if(b.dataset.perfilBorrar!=null){
    BOM.quitarPerfil(b.dataset.perfilBorrar); pintarPerfiles();
  }
});

// EN FORTIGATE NO HAY EXCEPCIONES DE AGREGACION, Y ESO SE DECLARA EN VEZ DE OMITIRSE.
// Aruba agrega el pool de Boost en una linea y deja el Orchestrator una vez por fabric
// porque es SU modelo comercial. Aqui cada nodo paga su propia suscripcion FortiGuard y su
// propio FortiCare, incluso en HA, asi que TODO multiplica por sedes -- que es el
// comportamiento por defecto de BOM.consolidar. Pasar los objetos vacios es la forma de
// dejar constancia de que se miro y se decidio, no de que se olvido.
function consolidarPerfiles(){
  const l=BOM.perfiles();
  const {filas,totalSedes,fabricantes}=BOM.consolidar(l,{agregadas:[], unicas:[]});
  const multi=fabricantes.length>1;
  const meta={
    titulo:`BOM global consolidado — ${l.length} perfil(es), ${totalSedes} sedes`,
    subtitulo:l.map(x=>`${x.nombre} ×${x.sedes} (${x.modelo})`).join(' · '),
    archivo:multi?'BOM_global_multifabricante':'BOM_global_fortinet', sinRefs:true,
    notas:[
      'REGLAS DE CONSOLIDACION (FortiGate):',
      '  Equipo, licencias FortiGuard y soporte FortiCare: cantidad por sede x sedes del perfil.',
      '  No hay lineas agregadas ni unicas: en HA cada nodo lleva su propia suscripcion.',
      '  Precios: los vigentes el dia en que se guardo cada perfil.',
    ],
  };
  const cli=$('nombreCliente').value.trim(), ref=$('refProyecto').value.trim();
  if(cli) meta.cliente=cli;
  if(ref) meta.referencia=ref;
  if(multi) meta.notas.push(`  MULTI-FABRICANTE: ${fabricantes.join(', ')}. Las lineas de cada marca siguen sus propias reglas.`);
  const d=dtoActual();
  if(d>0){ meta.dto=d; meta.dtoEtq=dtoEtiqueta(); }
  return {filas, meta, totalSedes, fabricantes};
}

$('btnConsolidar').addEventListener('click',()=>{
  const {filas, meta, totalSedes, fabricantes}=consolidarPerfiles();
  if(!totalSedes) return;
  const aviso=fabricantes.length>1
    ? `<p class="bom-aviso">Consolidado <b>multi-fabricante</b> (${fabricantes.join(', ')}). En FortiGate todo multiplica por sedes; las líneas de otras marcas siguen las reglas que declare su página.</p>`
    : '';
  $('consolidadoSub').textContent=meta.subtitulo+` — ${totalSedes} sedes en total`;
  $('consolidadoTabla').innerHTML=aviso+BOM.renderTabla(filas,{dto:dtoActual(), sinRefs:true});
  $('modalConsolidado').hidden=false;
  $('xlsConsolidadoBtn').onclick=()=>BOM.exportarExcel(filas,meta);
});
$('consolidadoCerrar').addEventListener('click',()=>{ $('modalConsolidado').hidden=true; });
$('modalConsolidado').addEventListener('click',e=>{ if(e.target===$('modalConsolidado')) $('modalConsolidado').hidden=true; });
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
  renderCatalogo();
  // El contraste al subir una fuente oficial (pestaña "Fuentes", js/procedencia.js) necesita
  // saber de dónde sacar los modelos de este fabricante para comparar.
  PROCEDENCIA.registrarModelos('fortinet', () => MODELS.map(m => ({ model: m.id, ...m })));
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
  // Estado v2: primero el builder queda con su fila por defecto; ESTADO repone
  // #wanLinksData si el enlace es v2; si el enlace es v1 (?bw=…&pctOverlay=…) se migra a
  // filas equivalentes avisando por consola; y al final se reconstruyen las filas desde la
  // serializacion que haya quedado. El orden importa: sincronizarWanHidden() leeria las
  // filas viejas y pisaria lo migrado.
  reconstruirWanDesdeHidden();
  const st = ESTADO.vincular({ campos: CAMPOS_ESCENARIO, migrados: PARAMS_V1 });
  const migrado = migrarEstadoV1();
  reconstruirWanDesdeHidden();
  if (migrado) $('wanLinksData').dispatchEvent(new Event('input', { bubbles: true }));
  const anclaje = document.querySelector('.tabs') || document.querySelector('.masthead');
  if (anclaje && anclaje.parentNode) {
    const caja = document.createElement('div');
    caja.className = 'estado-barra';
    caja.style.cssText = 'display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:0 0 14px';
    anclaje.parentNode.insertBefore(caja, anclaje.nextSibling);
    ESTADO.botonEnlace(caja);
    ESTADO.avisoOrigen(caja, st);
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
