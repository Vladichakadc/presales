'use strict';
// Equivalencia entre el nivel de soporte que elige la pagina y la clave con la que el
// catalogo guarda su precio. Vivia 120 lineas por debajo de su primer uso: funcionaba
// porque quien lo lee corre despues, pero es la misma forma del fallo que dejo el
// dimensionador de Cisco en blanco al usar `capDe` antes de su declaracion.
const CARE_LIC_KEY={fc247:'essential',fcpre:'premium',fcelite:'elite'};
let MODELS = [];
let BUNDLES = {};
let CARE = {};
// Reglas comerciales y de formulario servidas por /api/dimensionador/fortinet, no escritas
// aqui: el catalogo de funciones con su servicio FortiGuard, los servicios avanzados de
// SD-WAN y la equivalencia termino -> sufijo de SKU. Ver legacyData/fortinet.js.
let FUNCIONES = [];
let SERVICIOS_SDWAN = [];
let TERMINOS = {};
// Procedencia del fabricante (/api/fuentes): alimenta el banner de estado de datos y la
// puerta de exportacion, que bloquea si la lista de precios esta vencida.
let FUENTES = null;
/* FOTO OFICIAL DEL EQUIPO (2026-09-22, peticion del dueño: «como esta en Aruba»).
   Mapa {modelo: {front, fuente}} servido desde /data/fortinet-vistas-equipos.json. Se carga
   ANTES del primer render para que la tarjeta no aparezca sin foto y se rellene despues.

   SOLO VISTA FRONTAL, y no es un recorte del trabajo: se revisaron los 28 datasheets por
   serie y NINGUNO publica una trasera -cada uno trae una sola foto de producto, en la
   portada-. Aruba tiene las dos caras porque el Hardware Reference de HPE las publica
   etiquetadas «Front View»/«Rear View»; Fortinet no publica el equivalente en el datasheet.
   `ficha.js` ya sabe pintar una sola cara: sin `rear` no dibuja el conmutador. */
let VISTAS = null;
const R = FortinetReglas;

const $=id=>document.getElementById(id);
let profile='tp', modoCaudal='link', rolSdwan='none', segMode='branch', lastPick=null;
// Ultimo rol con el que se pintaron las filas del builder: la casilla de overlay se
// habilita o deshabilita segun el rol, y repintar en cada render destruiria el campo a
// medio teclear (el mismo motivo por el que BOM.cantidadRef escucha change y no input).
let wanRolPintado=null;
// Controles de LECTURA del gráfico (métrica del eje y ver/ocultar fuera de venta). No son
// escenario: cambian lo que se dibuja, no lo que se dimensiona.
let metricaEje='auto';
let verEol=false;
/* PUERTA DE EXPORTACION (AT-15/16/18).
   `ultimaHuella` resume el escenario TECNICO del ultimo calculo; `huellaDelBom`, la que
   tenia cuando se construyo la lista de materiales.

   EN ESTA PAGINA LAS DOS TIENEN QUE COINCIDIR SIEMPRE, y eso es una afirmacion, no un
   descuido: `BOM.sincronizar` repinta el BOM en CADA render -esa es justamente la regla que
   se escribio el 2026-09-03, cuando cinco de los seis dimensionadores se quedaban cotizando
   el equipo anterior-. La comparacion se mantiene como INVARIANTE: si algun dia falla,
   significa que alguien salto un repintado, y entonces cerrar la puerta es lo correcto.
   Declararla como «detector de escenarios obsoletos» seria venderla como algo que en esta
   arquitectura no puede pasar — la clase de comprobacion inerte que este repositorio ya pago
   con `CISCO_EOL_MODELS`.

   LO QUE LA HUELLA SI HACE TODOS LOS DIAS es identificar la propuesta: se publica en la
   puerta y VIAJA DENTRO del documento exportado, asi que quien recibe un BOM por correo
   puede cruzarlo contra el enlace del escenario y ver si son el mismo.
   `override` guarda el motivo con el que alguien forzo una exportacion. */
let override=null; // {motivo, fecha, usuario}
let ultimaHuella=null, huellaDelBom=null;
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
// Eleccion explicita en el desplegable de equipos de la CALCULADORA: manda sobre el paso 4.
// `BOM.sincronizar` respeta una eleccion hecha a mano en `#pickModel` -es deliberado: ese
// desplegable cotiza cualquier equipo-, pero elegir en la calculadora es una eleccion
// posterior y mas explicita sobre el mismo asunto, asi que suelta el pestillo. Sin esto,
// tocar una vez el modelo del paso 4 dejaba los dos desplegables desincronizados para
// siempre y sin forma de volver, que es lo que el dueno reporto el 2026-09-22.
function llevarABom(id){
  BOM.soltarManual();
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
// Métrica del eje y filtro de ciclo de vida del gráfico. NO entran en CAMPOS_ESCENARIO a
// propósito: son controles de LECTURA —cambian lo que se dibuja, no lo que se dimensiona—
// y meterlos en el enlace compartido haría creer que forman parte del escenario.
$('metricaEje').addEventListener('change',()=>{ metricaEje=$('metricaEje').value; render(); });
$('chkVerEol').addEventListener('change',()=>{ verEol=$('chkVerEol').checked; render(); });
// bw/unit/pctOverlay ya no estan aqui: son espejos ocultos que escribe el builder, y este
// dispara render() por su cuenta al cambiar una fila.
['users','perUser','head','sesUser','sessNeed','vidaSes','sites','conc','interVlan','techoUtil',
 'chkSsl','chkAv','chkWeb','chkSandbox','chkIotDlp','chkHa','chkNoConcurrente',
 'tipoTx'].forEach(id=>$(id).addEventListener('input',render));
// Los servicios avanzados de SD-WAN y FortiConverter no cambian el dimensionamiento -no
// consumen throughput-: solo la cotizacion. Repintar el motor entero por ellos seria gasto
// sin efecto, y peor, haria creer que influyen en la recomendacion.
['chkSdwanMon','chkSdwanOrq','chkSdwanSase','chkConverter'].forEach(id=>$(id).addEventListener('input',renderBom));
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

// EL DERATE DE SSL SE RETIRO EL 2026-09-22 (informe de validacion tecnica, §5.1, P0).
// Aqui vivia `const SSL_DERATE=0.65`, que estimaba la inspeccion SSL como una fraccion de
// Threat Protection. El Product Matrix publica la cifra POR MODELO y el cociente ssl/tp va
// de 0,52 (40F) a 1,18 (50G): no hay constante que lo describa, y en tres de los cinco
// modelos con dato el equipo aguanta MAS SSL que Threat Protection. El factor no era
// conservador -se equivocaba en las dos direcciones- y en el 40F prometia 390 Mbps donde el
// equipo da 310. Ahora SSL es un eje propio de `FortinetReglas`, con la cifra oficial, y un
// modelo sin ella se aparta con su motivo en vez de dimensionarse contra otra capa.

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
  // Añadidos el 2026-09-22: el tráfico inter-VLAN y su regla de simultaneidad, el techo de
  // utilización y el tipo de transacción CAMBIAN la recomendación, así que un enlace que no
  // los llevara aterrizaría en otro escenario sin decirlo — que es peor que un 404 porque no
  // se nota. Los servicios SD-WAN y FortiConverter no cambian el equipo pero sí la
  // cotización, y el enlace se comparte para revisar una propuesta entera.
  'interVlan','chkNoConcurrente','techoUtil','tipoTx',
  'chkSdwanMon','chkSdwanOrq','chkSdwanSase','chkConverter',
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

// El piso de capa por funcion YA NO SE ESCRIBE AQUI: lo declara cada entrada de `FUNCIONES`
// en legacyData/fortinet.js (campo `capa`), junto al servicio FortiGuard que consume. Tener
// la misma funcion descrita en dos sitios -el piso aqui y el bundle alla- es como se
// desincronizan: al anadir IoT/DLP habria que acordarse de tocar los dos.
// FortiSandbox sigue sin elevar capa a proposito y ahora lo dice el propio dato (`capa:null`):
// analiza FUERA DE BANDA, no consume throughput del equipo.

function funcionesActivas(){
  return FUNCIONES.filter(f=>{ const n=$(f.id); return n&&n.checked; }).map(f=>f.id);
}
function capaEfectiva(){
  return R.capaEfectiva(profile, funcionesActivas(), FUNCIONES);
}

// Techo de utilizacion declarado (politica separada del crecimiento, §10.2 del informe).
function techoUtil(){
  const n=$('techoUtil');
  const v=n?parseFloat(n.value):100;
  return (v>0?v:100)/100;
}

// Fraccion del trafico que viaja cifrada por el fabric. 0 sin SD-WAN.
function fraccionOverlay(){
  if(rolSdwan==='none') return 0;
  const nodo=$('pctOverlay');
  return nodo?Math.max(0,Math.min(100,parseFloat(nodo.value)||0))/100:1;
}

// Servicios avanzados de SD-WAN pedidos. La funcion base NO se licencia: tener dos WAN no
// deriva ninguno, y por eso salen de casillas explicitas y no del rol ni del builder.
const CHK_SDWAN={sdwanMon:'chkSdwanMon', sdwanOrq:'chkSdwanOrq', sdwanSase:'chkSdwanSase'};
function serviciosSdwanPedidos(){
  return SERVICIOS_SDWAN.filter(sv=>{ const n=$(CHK_SDWAN[sv.id]); return n&&n.checked; });
}

/* ── DEMANDA POR EJE ─────────────────────────────────────────────────────────────────
   Traduce el escenario a {eje: cantidad}, que es lo unico que el evaluador multieje
   consume. Antes esto no existia: habia UN requerimiento y UNA capacidad efectiva, asi que
   no se podia decir cual de los ocho ejes mandaba ni a que distancia quedaban los demas.

   EQUIVALENCIA CON EL MOTOR ANTERIOR, QUE NO ES CASUAL. El motor viejo comparaba
   `effectiveNeed` contra `min(capa, IPsec/fraccion)`; eso es exactamente lo mismo que pedir
   `effectiveNeed <= capa` Y `effectiveNeed x fraccion <= IPsec`, que son dos ejes
   independientes. La reformulacion no cambia ninguna recomendacion sin SSL -lo prueba
   scripts/contrastes/fortinet.js, cuya linea base se midio antes de este cambio- y ademas
   coincide con la formula del informe (U_ipsec = T_overlay / C_ipsec). */
function demandasDe(effectiveNeed, capa, sessNeed, cpsNeed){
  const d={};
  d[capa.k]=effectiveNeed;
  const frac=fraccionOverlay();
  // El eje IPsec solo entra con rol SD-WAN; si la capa elegida YA es 'vpn', no se pisa con
  // una cifra menor -se queda la mayor de las dos demandas sobre el mismo eje-.
  if(frac>0) d.vpn=Math.max(d.vpn||0, effectiveNeed*frac);
  // SSL como eje propio, con la cifra oficial del modelo. Sin marcar la casilla no entra:
  // un eje que nadie pidio no puede apartar a nadie.
  if($('chkSsl').checked) d.ssl=effectiveNeed;
  if(sessNeed) d.sess=sessNeed;
  if(cpsNeed) d.cps=cpsNeed;
  return d;
}

/* CUANTO REQUERIMIENTO SOPORTA UN MODELO, en las unidades del eje de caudal.
   Sirve para ordenar la lista y para situar el punto del modelo en la escala logaritmica.
   Se deriva de los propios ejes -capacidad dividida por lo que ese eje consume de cada Mbps
   del requerimiento- en vez de repetir la formula del motor: asi, anadir un eje de caudal
   nuevo no deja la escala mintiendo. Un eje sin dato no entra en el minimo; lo que decide si
   ese modelo se aparta es el evaluador, no esta funcion. */
function soporta(m, demandas, effectiveNeed){
  if(!effectiveNeed) return m.fw;
  let tope=Infinity;
  for(const def of R.EJES){
    if(def.unidad) continue; // sesiones y cps no se miden en Mbps
    const req=demandas[def.k];
    if(!req) continue;
    const cap=m[def.campo];
    if(cap==null) continue;
    tope=Math.min(tope, cap/(req/effectiveNeed));
  }
  return tope===Infinity?m.fw:tope;
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

/* ── ESCALA LOGARITMICA Y ALTERNATIVAS ────────────────────────────────────────────────
   §7 del informe: «Modelo elegido y dos alternativas; métrica activa; filtro de lifecycle»
   en lugar de 58 puntos indistinguibles. Los 58 se siguen dibujando -esconder el catalogo
   seria peor que no etiquetarlo- pero se ETIQUETAN el elegido y sus dos vecinos por
   capacidad, que son los que alguien de verdad compara.

   LA METRICA DEL EJE SE ELIGE, y por defecto es «la que dimensiona»: cuanto requerimiento
   soporta cada modelo en este escenario. Fijarla en `fw` -que es lo que hacia antes- pinta
   la cifra de portada, que es justo la que no aplica en cuanto hay inspeccion. */
function pintarEscala(ctx){
  const {effectiveNeed, demandas, candidatos, elegido}=ctx;
  const track=$('track');
  track.querySelectorAll('.dot,.tick,.pickLabel,.altLabel').forEach(e=>e.remove());

  const def=metricaEje==='auto'?null:R.EJE_POR_K[metricaEje];
  const valorDe=m=>def?m[def.campo]:soporta(m,demandas,effectiveNeed);
  const visibles=MODELS.filter(m=>(verEol||!m.eol)&&valorDe(m)!=null);
  $('trackLbl').textContent=def
    ? `Escala de ${def.n} — cifra publicada por modelo (logarítmica)`
    : 'Escala de capacidad — cuánto requerimiento soporta cada modelo en este escenario (logarítmica)';

  const caps=visibles.map(valorDe);
  const maxCap=caps.length?Math.max(...caps):Math.max(...MODELS.map(m=>m.fw));
  const logP=v=>Math.log10(Math.max(v,10));
  const logMin=Math.log10(10),logMax=logP(Math.max(maxCap,effectiveNeed)*1.2);
  const xPct=v=>(logP(v)-logMin)/(logMax-logMin)*100;

  const needPct=Math.min(xPct(effectiveNeed),99);
  const need=$('need');
  need.style.left=needPct+'%';
  $('needLbl').textContent=fmt(effectiveNeed);
  need.classList.toggle('flip',needPct>60);

  const pickLbl=document.createElement('div');
  pickLbl.className='pickLabel'; pickLbl.id='pickLbl'; pickLbl.style.display='none';
  track.appendChild(pickLbl);
  [10,50,100,500,1000,5000,10000,50000,100000,500000,1000000].forEach(v=>{
    const pct=xPct(v);if(pct<0||pct>100)return;
    const tick=document.createElement('div');tick.className='tick';tick.style.left=pct+'%';
    const lbl=v>=1000000?v/1e6+'T':v>=1000?v/1000+'G':v+'M';
    tick.innerHTML=`<i></i><b>${lbl}</b>`;track.appendChild(tick);
  });

  // Las dos alternativas: los candidatos inmediatamente por encima y por debajo del
  // elegido. Se toman de la lista YA ORDENADA por capacidad, asi que son sus vecinos
  // reales y no los dos primeros de la lista -que en una lista de 39 no dicen nada-.
  const idx=elegido?candidatos.findIndex(m=>m.id===elegido.id):-1;
  const alternativas=[];
  if(idx>0) alternativas.push(candidatos[idx-1]);
  if(idx>=0&&idx<candidatos.length-1) alternativas.push(candidatos[idx+1]);

  visibles.forEach(m=>{
    const cap=valorDe(m);const pct=xPct(cap);if(pct<0||pct>100)return;
    const dot=document.createElement('div');
    const esAlt=alternativas.some(a=>a.id===m.id);
    dot.className='dot'+(candidatos.some(c=>c.id===m.id)?' ok':'')+(esAlt?' alt':'');
    if(elegido&&m.id===elegido.id)dot.className='dot pick';
    dot.style.left=pct+'%';dot.title=m.id+': '+fmt(cap)+(m.eol?' (fuera de venta)':'');
    track.appendChild(dot);
    if(esAlt){
      const lbl=document.createElement('div');
      lbl.className='altLabel';lbl.style.left=pct+'%';lbl.textContent=m.id.replace('FortiGate ','');
      track.appendChild(lbl);
    }
  });
  if(elegido){
    $('pickLbl').textContent=elegido.id;
    $('pickLbl').style.display='block';
    $('pickLbl').style.left=xPct(valorDe(elegido))+'%';
  }
  const ocultos=MODELS.length-visibles.length;
  $('trackNota').innerHTML=(alternativas.length
      ? `En ámbar, las dos alternativas inmediatas por capacidad: <b>${alternativas.map(a=>esc(a.id)).join('</b> y <b>')}</b>. `
      : '')
    +(ocultos?`${ocultos} modelo(s) fuera de venta ocultos — se muestran con la casilla de arriba, como referencia de un parque instalado.`
            :'Se muestran también los modelos fuera de venta: sirven como referencia de un parque instalado, nunca como propuesta nueva.');
}

/* ══ VALIDACION POR PASO ════════════════════════════════════════════════════════════════
   §7 del informe: «cuatro pasos plegables y validación por paso». El chip del encabezado
   dice si ese paso esta completo, si tiene una decision que conviene mirar o si BLOQUEA, y
   por eso se puede plegar un paso sin perder de vista que algo falta dentro.

   NO INVENTA ESTADOS: cada chip sale de la misma regla que ya decide el calculo o la
   cotizacion, no de una segunda comprobacion escrita aparte -que es como los dos se
   contradirian-. */
function chip(id,cls,texto,titulo){
  const n=$(id); if(!n) return;
  n.className='paso-chip '+(cls||'');
  n.textContent=texto||'';
  if(titulo) n.title=titulo;
}
// El ultimo contexto de calculo, para que renderBom() pueda refrescar los chips sin
// recalcular el dimensionamiento entero: el bundle y el termino no cambian la recomendacion
// pero SI el estado del paso 4, y sin esto el chip se quedaba diciendo «todo bien» con la
// puerta de exportacion cerrada.
let ultimoCtxPasos=null;
function pintarPasos(ctx){
  if(ctx) ultimoCtxPasos=ctx; else if(ultimoCtxPasos) ctx=ultimoCtxPasos; else return;
  // 1 · Plataforma y rol
  chip('chipPaso1','', `${{branch:'Sucursal',campus:'Campus',dc:'Datacenter'}[segMode]} · ${{none:'sin SD-WAN',spoke:'spoke',hub:'hub'}[rolSdwan]}${$('chkHa').checked?' · HA':''}`,
    'Segmento, rol en la topología, tipo de transacción y alta disponibilidad.');
  // 2 · Capa de inspección: el bundle mínimo se decide aquí aunque se elija en el paso 4.
  const activas=funcionesActivas();
  const min=R.bundleMinimo(activas,FUNCIONES,BUNDLES);
  const elevada=ctx.capa&&ctx.capa.elevada;
  chip('chipPaso2', elevada?'warn':'',
    `${TIER_BY_K[ctx.capa?ctx.capa.k:'tp'].n}${elevada?' (elevada)':''}${min.minimo&&min.minimo!=='atp'?' · mín. '+BUNDLES[min.minimo].n.split(' ')[0]:''}`,
    elevada?`La capa se elevó por ${ctx.capa.elevan.map(f=>f.n).join(', ')}.`:'Capa efectiva contra la que se dimensiona.');
  // 3 · Tráfico: el caudal es el dato mínimo; sin él no hay cálculo.
  const bwOk=(parseFloat($('bw').value)||0)>0;
  chip('chipPaso3', bwOk?(ctx.sinCandidato?'warn':''):'bad',
    bwOk?`${fmt(ctx.trafico?ctx.trafico.previsto:0)} previstos`:'Falta el caudal',
    bwOk?'Requerimiento previsto con crecimiento aplicado.':'Declara el caudal de al menos un enlace WAN.');
  // 4 · Equipo y cotización: manda el bundle mínimo, que es bloqueante.
  const err=R.validarBundle($('licBundle').value||'ent',activas,FUNCIONES,BUNDLES);
  // Excluir el bundle a proposito no es un error del escenario: el chip lo dice sin pintarse
  // en rojo, que es lo que distingue «esto no se puede pedir» de «esto se deja fuera».
  const bloquea=!!(err&&err.bloquea!==false);
  chip('chipPaso4', bloquea?'bad':'', bloquea?'Bundle insuficiente'
      :(err?`Sin bundle · ${$('pickModel').value||'—'}`:`${$('pickModel').value||'—'} · ${$('termYears').value} año(s)`),
    err?err.mensaje:'Modelo, cantidad, término, bundle y soporte de la cotización.');
  // Un paso que BLOQUEA no se puede dejar plegado sin más: se abre para que se vea el motivo.
  if(err){ const d=$('paso4').querySelector('details'); if(d) d.open=true; }
}

/* ══ BANNER DE ESTADO DE DATOS ══════════════════════════════════════════════════════════
   Responde «¿esto tiene grado comercial?» ANTES de mirar una cifra, que es cuando la
   pregunta sirve. La cobertura NO se escribe a mano: se cuenta sobre el catálogo servido,
   así que el día que alguien complete `ssl` en el Product Matrix el banner sube solo. */
function pintarBanner(){
  const caja=$('dataBanner'); if(!caja||!MODELS.length) return;
  const conSsl=MODELS.filter(m=>m.ssl!=null).length;
  const conCps=MODELS.filter(m=>m.cps!=null).length;
  const conPrecio=MODELS.filter(m=>m.elpN!=null&&m.elpN>0).length;
  const precios=FUENTES&&FUENTES.fuentes?FUENTES.fuentes.find(f=>f.dominio==='precio'):null;
  const tecnica=FUENTES&&FUENTES.fuentes?FUENTES.fuentes.find(f=>f.dominio!=='precio'):null;
  const salud=precios?R.saludPrecios(precios):null;
  const cls=!salud?'warn':salud.bloquea?'bad':(conSsl<MODELS.length?'warn':'ok');
  const item=(k,v,t)=>`<span class="db-item" title="${esc(t||'')}"><span class="db-k">${esc(k)}</span><span class="db-v">${v}</span></span>`;
  caja.innerHTML=
    item('Fuente técnica', tecnica?esc(tecnica.documento):'—', tecnica?tecnica.nota||'':'')
    +item('Fecha', tecnica&&tecnica.fecha?esc(tecnica.fecha):'sin fecha')
    +item('Precios', precios?`${esc(precios.fecha||'sin fecha')}${salud?` · ${esc(salud.estado)}`:''}`:'sin lista',
      salud?salud.mensaje:'')
    +item('Región', 'AMER', 'Los precios de lista de este catálogo son de la price list AMER.')
    +item('Cobertura', `precio ${conPrecio}/${MODELS.length} · cps ${conCps}/${MODELS.length} · SSL ${conSsl}/${MODELS.length}`,
      'Cuántos modelos traen cada campo. Se cuenta sobre el catálogo servido, no se declara.')
    +(conSsl<MODELS.length
      ? `<span class="db-item"><span class="db-v warn">La cifra oficial de inspección SSL está en ${conSsl} de ${MODELS.length} modelos: el resto se aparta si se pide ese eje, en vez de estimarse.</span></span>`
      : '');
  caja.className='databanner '+cls;
  caja.hidden=false;
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
    ultimaHuella=R.huella({vacio:true});
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
    $('ejesPanel').innerHTML='';
    $('stickyReco').hidden=true;
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

  // AT-11. El trafico del sitio ya no es un solo camino: la WAN y el inter-VLAN SE SUMAN
  // salvo que alguien declare que sus picos no coinciden. `max` automatico es lo que cambia
  // de familia sin que nadie lo decida -el informe lo demuestra con 600 + 300 Mbps, que dan
  // 750 u 1.125 segun el supuesto, y entre esas dos cifras el equipo pasa de 70G a 90G-.
  const trafico=R.demandaTrafico({
    internet:caudal,
    interVlan:Math.max(0,parseFloat($('interVlan').value)||0),
    crecimiento:head,
    picosNoConcurrentes:$('chkNoConcurrente').checked,
  });
  $('traficoHint').innerHTML=trafico.interVlan
    ? `Caminos declarados: WAN <b>${fmt(trafico.internet)}</b> + inter-VLAN <b>${fmt(trafico.interVlan)}</b>. `
      +`Regla aplicada: <b>${esc(trafico.regla)}</b> = ${fmt(trafico.base)} de base, `
      +`<b>${fmt(trafico.previsto)}</b> con el ${Math.round(head*100)} % de crecimiento.`
    : 'Sin tráfico inter-VLAN declarado: el requerimiento sale solo de los enlaces WAN. '
      +'Declararlo importa cuando el FortiGate también enruta e inspecciona entre segmentos internos.';

  const userBaseMbps=users*perUser*(1+head);
  const baseNeed=Math.max(trafico.previsto,userBaseMbps);

  // La fraccion que va por el overlay paga la encapsulacion ESP.
  const frac=fraccionOverlay();
  const effectiveNeed=baseNeed*(1+frac*OVERHEAD_ESP);

  const capa=capaEfectiva();
  pintarHintCapa(capa);
  pintarControlesTopologia();
  pintarWanResumen();

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

  /* ── EVALUACION MULTIEJE ──────────────────────────────────────────────────────────
     Antes habia UN requerimiento y UNA capacidad efectiva, mas dos filtros sueltos para
     sesiones y cps. Ahora cada eje -capa de inspeccion, IPsec del overlay, SSL, sesiones y
     cps- lleva su demanda y su capacidad OFICIAL, y el maximo de las utilizaciones define
     el cuello de botella. `FortinetReglas.evaluar` es quien decide; esta pagina solo
     traduce el escenario a demandas y presenta el resultado. */
  const demandas=demandasDe(effectiveNeed, capa, sessNeed, cpsNeed);
  const politica={techo:techoUtil()};
  // AT-15. La huella resume el escenario TECNICO con el que se calculo. El BOM guarda la
  // suya al construirse; si dejan de coincidir es que alguien movio un parametro despues, y
  // la lista de materiales que hay en pantalla ya no corresponde. Se cierra la exportacion
  // en vez de entregar una cotizacion de otra pregunta.
  ultimaHuella=R.huella({demandas, techo:politica.techo, capa:capa.k, rol:rolSdwan, seg:segMode});
  const veredicto=R.evaluar(MODELS, demandas, politica);
  const evalPorId={};
  for(const x of veredicto.aptos.concat(veredicto.apartados)) evalPorId[x.eval.id]=x.eval;

  // Los apartados se cuentan POR MOTIVO, no en un solo saco: «no cumple la capacidad» y «el
  // catalogo no trae la cifra» son dos cosas distintas y una lista corta tiene que
  // explicarse. Es la misma regla que la calculadora de throughput del portal.
  const outBySess=veredicto.apartados.filter(x=>{
    const e=x.eval.ejes.find(y=>y.k==='sess'); return e&&e.estado==='excede'&&x.eval.manda&&x.eval.manda.k==='sess';
  }).length;
  const outByCps=veredicto.apartados.filter(x=>{
    const e=x.eval.ejes.find(y=>y.k==='cps'); return e&&e.estado==='excede'&&x.eval.manda&&x.eval.manda.k==='cps';
  }).length;
  const sinSsl=veredicto.apartados.filter(x=>x.eval.estado==='apartado').map(x=>x.modelo);

  // Los descontinuados YA NO se borran de la lista: antes desaparecian, asi que no habia
  // forma de consultarlos aqui cuando lo que se cotiza es ampliar un parque instalado.
  // Ahora entran, van al final y no pueden salir recomendados — ver la regla en ficha.js.
  const candidates=FICHA.ordenar(veredicto.aptos.map(x=>x.modelo),
    (a,b)=>soporta(a,demandas,effectiveNeed)-soporta(b,demandas,effectiveNeed));
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
    // APARTADOS POR FALTA DE DATO, contados aparte de los que no dan la capacidad. Es la
    // diferencia entre «ningún equipo aguanta esto» y «el catálogo no puede afirmarlo»: la
    // segunda es una tarea de datos, no un problema de dimensionamiento, y decir «no cumple»
    // mandaría a subir de gama por un hueco documental.
    if(sinSsl.length) why.push(`<li><b class="warn">${sinSsl.length} modelo(s) apartados por falta de cifra oficial de inspección SSL</b> en el catálogo — no por capacidad. `
      +`Los ${MODELS.filter(m=>m.ssl!=null).length} que sí la traen son los que compiten aquí. `
      +'Completar el resto es leer el <b>SSL Inspection Throughput</b> del Product Matrix; mientras tanto, esta pantalla '
      +'<b>no se sustituye</b> esa cifra por la de Threat Protection, que es lo que hacía antes y lo que producía '
      +'propuestas cortas. Es una <b>tarea de datos, no una falta de capacidad</b>: para comprometer uno de esos '
      +'modelos con inspección TLS hace falta una <b>PoC</b> o revisión senior.</li>');
    if(politica.techo<1) why.push(`<li>Se está aplicando un <b>techo de utilización del ${Math.round(politica.techo*100)} %</b> sobre la cifra publicada. Subirlo a 100 % ensancha la lista de candidatos, a costa de diseñar más cerca del máximo de laboratorio.</li>`);
    if(capa.k==='tp'||$('chkSsl').checked) why.push('<li>Estás dimensionando contra la capa más exigente. Si el diseño no requiere antivirus en línea sobre todo el tráfico, evaluar la capa <b>NGFW</b> o segmentar por política qué tráfico se inspecciona a fondo — es la palanca que más capacidad libera en FortiGate.</li>');
    why.push('<li>Por encima del catálogo: evaluar chasis FortiGate 7000F o distribuir la carga en varias unidades.</li>');
    FICHA.render({vendor:'fortinet', contenedor:'verdict', candidatos:[], recomendado:null,
      vacioTitulo:'Ningún modelo vigente cumple todas las restricciones',
      vacioDetalle:`<ul style="margin:0;padding-left:18px;font-size:13.5px">${why.join('')}</ul>`});
    $('verdict').style.borderLeftColor='var(--amber)';
    $('perfTiers').innerHTML='';
    $('ejesPanel').innerHTML='';
    $('stickyReco').hidden=true;
    pintarEscala({effectiveNeed, demandas, candidatos:[], elegido:null});
    pintarPasos({capa, trafico, sinCandidato:true});
    return;
  }
  $('verdict').style.borderLeftColor='var(--red)';

  // `nMil` formatea sesiones y cps (10.4K), que no se miden en Mbps. Lo usan el panel de
  // ejes y el resumen fijo.
  const nMil=v=>v>=1000?`${(v/1000).toFixed(v%1000?1:0)}K`:String(Math.round(v));
  const pc=u=>R.pct(u);
  const porQueDe=m=>{
    const evalm=evalPorId[m.id]||R.evaluarModelo(m,demandas,politica);
    const flags=[];
    if($('chkSsl').checked){
      const ssl=evalm.ejes.find(e=>e.k==='ssl');
      flags.push(ssl&&ssl.cap!=null
        ? `<b>Inspección SSL profunda:</b> se dimensiona contra los <b>${fmt(ssl.cap)}</b> de `
          +`<b>SSL Inspection Throughput</b> que el Product Matrix publica para el ${esc(m.id)}, que es una `
          +`medición propia y no una fracción de los ${fmt(m.tp)} de Threat Protection `
          +`(aquí el cociente es ${(m.ssl/m.tp).toFixed(2)}). Queda al ${pc(ssl.u)}.`
        : `<b class="warn">Inspección SSL sin cifra oficial para el ${esc(m.id)}:</b> el catálogo no la trae, `
          +'así que este modelo no debería recomendarse contra ese eje sin PoC.');
    }
    if($('chkAv').checked)flags.push('El antivirus en línea es lo que fija el piso en Threat Protection: esa cifra ya lo incluye, junto con el logging. El content processor (CP9/CP10) asiste la inspección.');
    if($('chkSandbox').checked)flags.push('FortiSandbox analiza <b>fuera de banda</b>: se cotiza aparte y <b>no consume throughput del FortiGate</b>, solo añade latencia al primer encuentro de un archivo. Por eso no eleva la capa de dimensionamiento.');
    if($('chkIotDlp').checked)flags.push('IoT Security y DLP <b>fijan el bundle mínimo en Enterprise Protection</b> (UTP y ATP no los incluyen) y elevan el piso a Threat Protection, porque corren sobre el stack completo.');
    if($('chkHa').checked)flags.push('<b>HA:</b> se cotizan 2 unidades y <b>cada una necesita su propia suscripción FortiGuard</b> — la licencia no se comparte entre nodos del clúster.');
    if(rolSdwan!=='none'){
      const ipsec=evalm.ejes.find(e=>e.k==='vpn');
      const insp=evalm.ejes.find(e=>e.k===capa.k);
      const mandaIpsec=evalm.manda&&evalm.manda.k==='vpn';
      if(ipsec&&insp){
        flags.push(mandaIpsec
          ? `<b class="warn">Manda el overlay:</b> con ${Math.round(frac*100)} % del tráfico cifrado, el motor IPsec `
            +`(${fmt(ipsec.cap)}) va al ${pc(ipsec.u)} mientras la capa de inspección va al ${pc(insp.u)}.`
          : `El eje que aprieta es la capa de inspección (${pc(insp.u)}); el motor IPsec queda al ${pc(ipsec.u)} `
            +`para el ${Math.round(frac*100)} % que va cifrado.`);
      }
      flags.push(`Sobre el requerimiento se suma un ${Math.round(OVERHEAD_ESP*100)} % de encapsulación ESP sobre la fracción del overlay — supuesto de esta herramienta, no una cifra publicada por Fortinet.`);
      flags.push('<b>SD-WAN sin costo de licencia:</b> el balanceo por SLA, ADVPN y la selección dinámica de camino vienen en FortiOS. <b>Tener varios enlaces no obliga a ningún bundle</b>: lo que se licencia aparte son los servicios avanzados (monitoreo de underlay, orquestación de overlays, conector FortiSASE), y solo si el diseño los usa.');
    }
    if(rolSdwan==='hub'&&modoCaudal==='agg') flags.push(`<b>Escala del fabric:</b> ${sites} túnel(es) del overlay a terminar. <b class="warn">El límite de túneles por modelo no está en este catálogo</b> — confirmarlo en el datasheet del ${esc(m.id)} antes de cotizar. Con ADVPN los shortcuts spoke-a-spoke son dinámicos y no cuentan contra el hub.`);
    if($('chkHa').checked) flags.push('En <b>activo-pasivo el clúster no suma capacidad</b>: el throughput sigue siendo el de una unidad. El par se cotiza por disponibilidad, no por rendimiento.');

    // QUE EJE MANDA Y A QUE DISTANCIA QUEDA EL SIGUIENTE. Antes esto solo se decia cuando
    // habia sesiones declaradas -estaba dentro de un `if(sessNeed && m.sess)`-, asi que en
    // el escenario mas comun, que es solo caudal, no aparecia nunca.
    const conDato=evalm.ejes.filter(e=>e.u!=null);
    if(evalm.manda&&conDato.length){
      const otros=conDato.filter(e=>e!==evalm.manda);
      flags.push(`<b${evalm.manda.k===capa.k?'':' class="warn"'}>Manda ${evalm.manda.frase}</b>: ${pc(evalm.manda.u)} de lo que da el modelo.`
        +(otros.length?` Los demás ejes van en ${otros.map(e=>`${e.frase} ${pc(e.u)}`).join(', ')} — el más cercano queda a <b>${(evalm.manda.u/Math.max(...otros.map(e=>e.u))).toFixed(1)}x</b> del que manda. Subir de gama por un eje que no es el que limita no compra nada.`:''));
    }
    for(const nombre of evalm.sinComprobar){
      flags.push(`<b class="warn">${esc(nombre)} sin dato:</b> el catálogo no trae esa cifra del ${esc(m.id)}, así que ese eje <b>no se comprobó</b>. Es el eje de CPU y es el que aprieta con sesiones cortas y masivas: confirmarlo en el Product Matrix antes de cerrar el diseño.`);
    }
    if(cpsNeed&&m.cps!=null){
      flags.push(`Los <b>${m.cps.toLocaleString('en-US')} cps</b> del ${esc(m.id)} son la cifra en <b>modo flow</b>. Con inspección <b>proxy</b> (antivirus en modo proxy, inspección SSL profunda) el caudal de sesiones nuevas cae, y <b>Fortinet no publica cuánto</b>: con este perfil al ${pc(cpsNeed/m.cps)} conviene dejar margen o validar con PoC.`);
    }
    if(politica.techo<1) flags.push(`Todos los ejes se comparan contra un <b>techo de utilización del ${Math.round(politica.techo*100)} %</b> de la cifra publicada, declarado en el paso 3. Es una política, no una cifra de Fortinet.`);

    const tope=soporta(m,demandas,effectiveNeed);
    return `<ul style="margin:8px 0 0;padding-left:18px;font-size:13.5px">
      <li>Requerimiento <b>${fmt(effectiveNeed)}</b> en capa <b>${esc(TIER_BY_K[capa.k].n)}</b>; este modelo soporta hasta <b>${fmt(tope)}</b> en este escenario — headroom ${Math.round((1-effectiveNeed/tope)*100)}%</li>
      ${capa.elevada?`<li><b class="warn">Capa elevada:</b> elegiste <b>${esc(TIER_BY_K[profile].n)}</b>, pero ${capa.elevan.map(f=>esc(f.n)).join(' y ')} obliga${capa.elevan.length>1?'n':''} a dimensionar contra <b>${esc(TIER_BY_K[capa.k].n)}</b>. Activar inspección saca la sesión del fast path del ASIC: no es un recargo porcentual, es otra cifra del datasheet.</li>`:''}
      <li>Sesiones concurrentes: <b>${(m.sess/1000).toFixed(0)}K</b> | Sesiones nuevas/s: <b>${m.cps!=null?m.cps.toLocaleString('en-US'):'<span class="warn">sin dato en el catálogo</span>'}</b> | Inspección SSL: <b>${m.ssl!=null?fmt(m.ssl):'<span class="warn">sin dato en el catálogo</span>'}</b> | Interfaces: ${esc(m.ifaces)}</li>
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
        // Sin `<b>` en la etiqueta: ficha.js escapa la columna izquierda (`esc(k)`), asi que
        // el marcado salia LITERAL en pantalla («<b>Threat Protection</b>»). El valor sí admite
        // HTML, que es donde va el enfasis.
        ['Threat Protection', m.tp?`<b>${fmt(m.tp)}</b>`:'Consultar datasheet'],
        ['Inspección SSL', m.ssl!=null?`<b>${fmt(m.ssl)}</b>`:'<span class="warn">no está en el catálogo — ver Product Matrix</span>'],
        ['Sesiones concurrentes', m.sess.toLocaleString('en-US')],
        ['Sesiones nuevas / s (TCP)', m.cps!=null?m.cps.toLocaleString('en-US'):'<span class="warn">no está en el catálogo — ver Product Matrix</span>'],
        ['Procesadores de seguridad', m.asic?esc(m.asic):'<span class="warn">sin dato publicado</span>'],
        ['Interfaces', esc(m.ifaces), true],
        ['SKU de hardware', m.hwSku?`<code>${esc(m.hwSku)}</code>`:'<span class="warn">Descontinuado — sin SKU nuevo</span>'],
        ['Precio de lista ref.', m.elp?esc(m.elp):'Consultar distribuidor'],
      ]},
      FICHA.seccionPuertos(m),
      FICHA.seccionAlimentacion(m),
      // Misma guarda que en la lista de materiales: «no incluir» no es un bundle y leer
      // `BUNDLES['none']` lanzaria al pintar la ficha del equipo.
      {titulo:'Licenciamiento propuesto', filas:[
        ['Bundle FortiGuard', BUNDLES[bundle]?esc(BUNDLES[bundle].n):'<span class="warn">Excluido de la cotización</span>'],
        ['Servicios incluidos', BUNDLES[bundle]?esc(BUNDLES[bundle].svcs):'Ninguno: no se cotiza suscripción de seguridad', true],
        ['SKU del bundle', !BUNDLES[bundle]?'—':lt&&lt.sku?`<code>${esc(lt.sku)}</code>`:'<span class="warn">Sin SKU vigente para este modelo</span>'],
        ['Término', `${termYrs} año${termYrs>1?'s':''}`],
        ['Unidades a licenciar', $('chkHa').checked?'2 — la licencia no se comparte en HA':'1'],
      ], nota:'En FortiGate el SKU lleva el código del modelo embebido: la licencia va atada al equipo, no al ancho de banda.'},
      {titulo:'Software del portafolio', filas:SOFTWARE.map(sw=>[esc(sw.n), esc(sw.d), true]),
       nota:'SKU y precios de referencia del price list AMER — no escalan con el modelo de FortiGate elegido.'},
      {titulo:'Soporte', filas:[
        [CARE[care]?esc(CARE[care].n):'Sin contrato FortiCare',
         CARE[care]?esc(CARE[care].sla):'<span class="warn">Excluido de la cotización — sin RMA ni actualizaciones de FortiOS</span>'],
        ['SKU', !CARE[care]?'—':ct&&ct.sku?`<code>${esc(ct.sku)}</code>`:'<span class="warn">No disponible para este modelo</span>'],
      ]},
    ];
  };

  /* ── PANEL DE UTILIZACION POR EJE ─────────────────────────────────────────────────
     Lo que el informe llama «decisión explicable»: los ocho ejes a la vez, con el que manda
     marcado y el que el catálogo no puede comprobar en su tercer estado -rayado, nunca en
     cero-. Antes esto no existía: había una sola barra de «capa» y dos medidores sueltos. */
  const pintarEjes=m=>{
    const evalm=evalPorId[m.id]||R.evaluarModelo(m,demandas,politica);
    const caja=$('ejesPanel');
    if(!evalm.ejes.length){ caja.innerHTML=''; return; }
    const filas=evalm.ejes.map(e=>{
      const manda=evalm.manda&&e.k===evalm.manda.k;
      const cls=e.estado==='sinDato'?'sindato':manda?'manda':(e.u>0.8?'alto':'');
      const ancho=e.u==null?0:Math.min(100,e.u*100);
      const val=e.estado==='sinDato'
        ? 'sin dato'
        : `${pc(e.u)} <span style="color:var(--steel)">de ${e.unidad==='Mbps'?fmt(e.cap):nMil(e.cap)}</span>`;
      return `<div class="eje ${cls}" title="${esc(e.metodo)}">`
        +`<span class="en">${esc(e.n)}</span>`
        +`<span class="eb"><i style="width:${ancho}%"></i></span>`
        +`<span class="ev">${val}</span></div>`;
    }).join('');
    const pie=(evalm.manda
      ? `Cuello de botella: <b>${esc(evalm.manda.n)}</b> al ${pc(evalm.manda.u)}`
        +(politica.techo<1?` · techo declarado ${Math.round(politica.techo*100)} %`:'')
        +'. Cada eje se compara contra su propia cifra oficial; ninguno se deriva de otro.'
      : 'Sin ejes evaluables con los datos declarados.')
      // UNA LISTA CORTA TIENE QUE EXPLICARSE. Con la inspeccion SSL pedida compiten 9 de 58
      // modelos, y sin decirlo la lista se lee como «el catalogo entero es esto». Es la misma
      // regla con la que la calculadora del portal cuenta sus apartados por fabricante.
      +(sinSsl.length?` <b class="warn">${sinSsl.length} modelo(s) apartados</b> porque el catálogo no trae `
        +'su cifra oficial de inspección SSL — es una tarea de datos, no una falta de capacidad: '
        +'no se sustituye por Threat Protection.':'');
    caja.innerHTML=`<div class="ejes"><h3>Utilización por eje — ${esc(m.id)}</h3>${filas}`
      +`<p class="eje-pie">${pie}</p></div>`;
  };

  /* RESUMEN FIJO: equipo, cuello de botella y las dos alternativas como BOTONES.
     Las alternativas son los vecinos por capacidad en la lista ya ordenada -no los dos
     primeros, que en una lista de 39 no dicen nada-, y se eligen de un clic: una alternativa
     que hay que buscar en un desplegable de 39 entradas no es una alternativa. */
  const pintarSticky=m=>{
    const caja=$('stickyReco'); if(!caja) return;
    const evalm=evalPorId[m.id]||R.evaluarModelo(m,demandas,politica);
    const i=candidates.findIndex(x=>x.id===m.id);
    const alts=[];
    if(i>0) alts.push(candidates[i-1]);
    if(i>=0&&i<candidates.length-1) alts.push(candidates[i+1]);
    const cuello=evalm.manda
      ? `Manda <b>${esc(evalm.manda.n)}</b> &middot; ${pc(evalm.manda.u)} de ${evalm.manda.unidad==='Mbps'?fmt(evalm.manda.cap):nMil(evalm.manda.cap)}`
      : 'Sin ejes evaluables';
    caja.innerHTML=`<span class="sr-modelo">${esc(m.id)}</span>`
      +`<span class="sr-cuello">${cuello}${m.id===pick.id?'':' &middot; elegido a mano'}</span>`
      +(alts.length?`<span class="sr-alts"><span>Alternativas</span>`
        +alts.map(a=>`<button type="button" class="sr-alt" data-alt="${esc(a.id)}">${esc(a.id.replace('FortiGate ',''))}</button>`).join('')
        +'</span>':'');
    caja.hidden=false;
  };

  const pintarDependientes=m=>{
    renderTiers(m,effectiveNeed);
    pintarEjes(m);
    pintarSticky(m);
    pintarEscala({effectiveNeed, demandas, candidatos:candidates, elegido:m});
  };

  const elegidoId=FICHA.render({vendor:'fortinet', 
    contenedor:'verdict',
    candidatos:candidates,
    recomendado:pick.id,
    // La foto oficial corona la ficha y cambia con cada seleccion. Un modelo sin foto
    // declarada (100F, 200F y los dos chasis) muestra el aviso honesto de ficha.js.
    vistas:VISTAS,
    // LAS REFERENCIAS DE PEDIDO NO VAN EN LA FICHA, van en la lista de materiales
    // (peticion del dueno, 2026-09-22). `refsEn` las manda a `#fortiRefs`, la seccion
    // «Anadir a la lista de materiales» del tab de BOM -mismo nombre, misma posicion y
    // mismo orden que en Aruba-, y `refsTitulo:null` suprime el `h3` interno porque el
    // `h2` de esa seccion ya titula el cuadro. La ficha deja de emitir su contenedor,
    // asi que no hay dos elementos con el mismo id.
    refsEn:'fortiRefs', refsTitulo:null,
    etiqueta:m=>`${m.id} — ${m.seg} · soporta ${fmt(soporta(m,demandas,effectiveNeed))}`,
    titulo:m=>m.id,
    subtitulo:m=>m.seg+' · FortiOS Security Fabric',
    // SIN `medidores` A PROPOSITO: las barras de utilizacion viven en `#ejesPanel`, encima
    // de la ficha, que es donde el informe las pide -junto al candidato, sus alternativas y
    // el cuello de botella-. Dejarlas tambien aqui pintaria los mismos cuatro ejes dos veces
    // en la misma pantalla, y el panel de arriba dice mas: los tres estados por eje y los
    // modelos apartados por falta de dato. El resto de dimensionadores las conserva.
    medidores:null,
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
  pintarPasos({capa, trafico, sinCandidato:false});
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
  // LA SEXTA FILA ES UN DATO, NO UNA ESTIMACION. Aqui se pintaba `m.tp x 0,65` con una
  // tilde delante; ahora se pinta la cifra oficial, y donde el catalogo no la trae se dice
  // -que es la informacion util: falta el dato, no falta la capacidad-.
  if(ssl){
    $('perfTiers').insertAdjacentHTML('beforeend', m.ssl!=null
      ? `<div class="tierRow on" title="SSL Inspection Throughput: IPS activo sobre un promedio de sesiones HTTPS. Medicion propia, no derivada de Threat Protection.">
        <span class="tn">Inspección SSL</span>
        <span class="tb"><i style="width:${Math.max(2,m.ssl/top*100)}%"></i></span>
        <span class="tv">${fmt(m.ssl)}</span>
      </div>`
      : `<div class="tierRow off" title="El catalogo no trae SSL Inspection Throughput de este modelo.">
        <span class="tn">Inspección SSL</span>
        <span class="tb"></span>
        <span class="tv warn">sin dato</span>
      </div>`);
  }
  const ratio=m.tp?Math.round(m.fw/m.tp):0;
  const asic=m.asic
    ? `Silicio: <b>${esc(m.asic)}</b>. El ${esc(m.np||'procesador de red')} es el que sostiene las dos primeras cifras${m.cp?`; el ${esc(m.cp)} asiste el pattern matching de IPS y antivirus en las tres últimas`:''}.`
    : `<span class="warn">Fortinet no publica página de fast path architecture para este modelo — sin dato de ASIC verificado.</span>`;
  const notaSsl=m.ssl!=null
    ? ` La inspección SSL de este modelo son <b>${fmt(m.ssl)}</b> oficiales, que es un <b>${(m.ssl/m.tp).toFixed(2)}x</b> de su Threat Protection: por eso no se deriva con un factor — en el catálogo ese cociente va de 0,52 a 1,18.`
    : ' <span class="warn">El catálogo no trae la cifra de inspección SSL de este modelo</span>, así que ese eje no se puede comprobar aquí.';
  $('perfNote').innerHTML=`Del firewall puro a Threat Protection hay un factor <b>${ratio}x</b> en este modelo (${fmt(m.fw)} &rarr; ${fmt(m.tp)}). `+
    `La cifra de portada solo aplica a sesiones descargadas al procesador de red; cualquier perfil de inspección saca la sesión del fast path.${notaSsl} ${asic} Requerimiento actual: <b>${fmt(need)}</b>.`;
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
  const licPrice=tierPrice(licTier,termYrs);

  // Coherencia con el dimensionamiento, declarada en vez de supuesta. Son dos desajustes
  // distintos y conviene no confundirlos: que el dimensionamiento no tenga candidato, y que
  // este cotizando un equipo distinto del que hay elegido en la pestana de calculo.
  // El aviso de desvio ya no se escribe aqui: lo da js/bom.js, para que los siete
  // fabricantes digan lo mismo con las mismas palabras.
  const aviso=BOM.avisoDesvio({elegido:FICHA.elegido('verdict'), enBom:m.id, hayCandidato});

  /* ── LA CAPA COMERCIAL SE CALCULA UNA VEZ, EN `FortinetReglas.lineasComerciales` ─────
     Aqui se montaban las filas a mano, y de esa construccion salian los tres P0 comerciales
     del informe: la linea de FortiCare se anadia SIEMPRE aunque el bundle ya lo incluyera
     (doble cobro), FortiConverter se anadia siempre que el modelo tuviera SKU aunque
     Enterprise ya lo trajera (segundo doble cobro), y el SKU conservaba el marcador `-DD`
     del price list, que no es un codigo pedible. Ahora lo decide el modulo puro, que es lo
     que hace que las veinte pruebas de aceptacion se puedan afirmar sin navegador. */
  const errBundle=R.validarBundle(bundle, funcionesActivas(), FUNCIONES, BUNDLES);
  const comercialActual=R.lineasComerciales({
    modelo:m, bundles:BUNDLES, care:CARE,
    bundle, care_elegido:care, careKey:CARE_LIC_KEY[care],
    qty, anios:termYrs, terminos:TERMINOS,
    converter:$('chkConverter').checked,
    serviciosSdwan:serviciosSdwanPedidos(),
  });
  // El bundle insuficiente es un bloqueo mas, y el primero: cambia QUE se cotiza, no solo
  // si se puede exportar.
  // Solo bloquea lo que de verdad impide pedir la cotizacion. Un bundle EXCLUIDO a
  // proposito viaja como aviso: cierra la puerta de exportacion seria dejar sin salida a
  // quien cotiza solo hardware, y entonces la tabla se copia a mano y la advertencia se
  // pierde — que es el mismo razonamiento por el que el override existe con motivo.
  const bloqueos=(errBundle&&errBundle.bloquea!==false?[errBundle]:[]).concat(comercialActual.bloqueos);
  if(errBundle&&errBundle.bloquea===false) comercialActual.avisos.push(errBundle);


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
    <tr><td><b>Inspección SSL</b> (IPS + HTTPS medio)</td><td class="n">${m.ssl!=null?`<b>${fmt(m.ssl)}</b> <span class="sku">${(m.ssl/m.tp).toFixed(2)}x de su Threat Protection</span>`:'<span class="warn">no está en el catálogo — ver Product Matrix</span>'}</td></tr>
    <tr><td>Procesadores de seguridad</td><td class="n">${m.asic?`${esc(m.asic)}${m.soc?' <span class="pillc">SoC</span>':''}<span class="sku">${esc(m.asicSrc||'')}</span>`:'<span class="warn">Sin página de fast path architecture publicada</span>'}</td></tr>
    <tr><td>Interfaces</td><td>${m.ifaces}</td></tr>
    </tbody></table></div>
    ${m.eol?'<p class="hint warn" style="margin-top:10px">Modelo descontinuado (EOL) — no disponible para diseños nuevos, solo referencia para equipos ya instalados.</p>':''}
    </section>`;

  // «No incluir» no es un bundle: `BUNDLES['none']` no existe. Leerlo sin guarda lanzaba
  // dentro de renderBom, y como la excepción abortaba antes de `$('bomBody').innerHTML`,
  // la lista de materiales se quedaba con el contenido ANTERIOR — que en pantalla se lee
  // como «el combo no hace nada» y no como «la página ha fallado».
  const bDef=BUNDLES[bundle]||null;
  html+=`<section class="panel"><h2>Licencias FortiGuard</h2><ul class="clean">
    ${!bDef?`<li><b>Sin bundle FortiGuard</b><span class="req opt">Excluido</span><span class="sku">Excluido de la cotización a petición: no se cotiza ninguna suscripción de seguridad. La cotización vale para un parque que ya la tiene vigente, o para negociar hardware y servicios por vías distintas.</span></li>`
      :licTier?`<li class="on"><b>${bDef.n}</b><span class="req">Requerida</span><span class="sku">${bDef.svcs}<br><code>${esc(licTier.sku)}</code> · término ${termYrs} año${termYrs>1?'s':''}${licPrice!=null?' · '+money(licPrice)+' c/u':' · precio no disponible a '+termYrs+' años para este modelo'}</span></li>`
      :`<li><b>${bDef.n}</b><span class="req opt">No disponible</span><span class="sku">Este bundle no tiene SKU vigente para ${m.id} en el price list actual${m.eol?' (equipo EOL, sin renovación de Enterprise Protection)':''}.</span></li>`}
    <li><b>FortiConverter</b><span class="req opt">Opcional</span><span class="sku">${lic&&lic.converter?`Migración de configuración desde Cisco ASA, Check Point, Palo Alto. <code>${esc(lic.converter.sku)}</code> · ${money(lic.converter.fee)} (servicio único)`:'Incluido dentro de Enterprise Protection en modelos vigentes.'}</span></li>
    <li><b>FortiSandbox</b><span class="req opt">Opcional</span><span class="sku">Análisis dinámico de archivos zero-day (add-on independiente del bundle). <b>Patrón</b> de SKU: <code>FC-10-FS5HG-499-02-DD</code> — el <code>DD</code> es el marcador del término (12/36/60), no un código pedible.</span></li>
    <li><b>FortiClient EMS</b><span class="req opt">Opcional</span><span class="sku">Gestión de endpoints ZTNA + VPN, licenciado por número de endpoints. <b>Patrón</b> de SKU (25 endpoints): <code>FC1-10-EMS05-428-01-DD</code>.</span></li>
  </ul>
  <p class="hint" style="margin-top:10px">Estos dos son <b>documentación de patrón</b> y no entran en la lista de materiales: se muestran con el marcador <code>DD</code> a propósito. Las líneas que sí se cotizan llevan el término resuelto (<code>-12</code>, <code>-36</code>, <code>-60</code>), porque un SKU con <code>DD</code> no se puede pasar a un distribuidor.</p>
  </section>`;

  // SOPORTE FORTICARE. El panel ya no puede limitarse a pintar el nivel elegido: los tres
  // bundles incluyen FortiCare Premium, asi que lo que hay que decir es si esta linea SE
  // COTIZA o no. Es el AT-04 del informe y era un doble cobro real.
  const soporteEnBom=comercialActual.filas.find(f=>f.cat==='Soporte');
  const cDef=CARE[care]||null;
  html+=`<section class="panel"><h2>Soporte FortiCare</h2><div class="scroll"><table>
    <thead><tr><th>Servicio</th><th>SLA</th><th>SKU</th><th>Término</th><th>Precio ref. c/u</th><th>Qty</th></tr></thead><tbody>
    <tr><td>${cDef?esc(cDef.n):'Sin contrato FortiCare'}</td><td class="n">${cDef?esc(cDef.sla):'—'}</td><td class="n">${soporteEnBom&&soporteEnBom.sku?`<code>${esc(soporteEnBom.sku)}</code>`:'<span class="warn">no se cotiza aparte</span>'}</td><td class="n">${termYrs} años</td><td class="n">${soporteEnBom&&soporteEnBom.unit!=null?money(soporteEnBom.unit):'—'}</td><td class="n">${soporteEnBom?qty:0}</td></tr>
    </tbody></table></div>
    ${!cDef?`<p class="hint warn" style="margin-top:10px"><b>Soporte excluido de la cotización a petición.</b> ${bDef&&comercialActual.soporteIncluido?`${esc(bDef.n)} ya trae FortiCare Premium, así que la cotización no pierde cobertura.`:'Sin bundle que lo incluya, el equipo se cotiza <b>sin contrato de soporte, sin derecho a RMA y sin actualizaciones de FortiOS</b>.'}</p>`
      :comercialActual.soporteIncluido?`<p class="hint" style="margin-top:10px"><b>${esc(bDef.n)} ya incluye FortiCare Premium.</b> ${soporteEnBom?'La línea de arriba es la <b>mejora</b> sobre ese Premium incluido, no un segundo contrato de soporte completo.':'Por eso no se añade una segunda línea de soporte a la lista de materiales: hacerlo cobraba el mismo servicio dos veces.'}</p>`:''}
    </section>`;

  $('bomBody').innerHTML=html;

  const termino=`término ${termYrs} año${termYrs>1?'s':''}`;
  const filas=comercialActual.filas;

  // LA FOTO OFICIAL VIAJA CON LA PROPUESTA (plan 20, extendido a Fortinet el 2026-09-22).
  // Misma fuente que la ficha en pantalla, mismo pie documental: quien recibe la cotizacion
  // ve el equipo real sin abrir la herramienta. Un modelo sin foto declarada exporta SIN
  // hoja de fotos — el hueco honesto tambien viaja, no se rellena con una imagen parecida.
  const vBom=(VISTAS||{})[m.id];
  const fotosBom=vBom&&vBom.front
    ?{modelo:m.id, front:vBom.front, rear:vBom.rear||null,
      pie:[vBom.tamano,vBom.fuente].filter(Boolean).join(' · ')}
    :null;
  const meta={
    titulo:`Lista de materiales — ${m.id}`,
    subtitulo:`${m.seg} · FortiOS · Security Fabric · ${termino}`,
    archivo:`BOM_${m.id}`,
    ...(fotosBom?{fotos:fotosBom}:{}),
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
      '',
      `Huella del escenario: ${ultimaHuella || '—'} (identifica el escenario tecnico que produjo esta lista;`,
      '  se puede cruzar contra el enlace compartido para comprobar que son el mismo).',
      '',
      'DECISIONES COMERCIALES APLICADAS A ESTA LISTA',
      `  Transaccion: ${$('tipoTx').selectedOptions[0].textContent}.`,
      `  Termino ${termYrs} ano(s): los SKU llevan el sufijo ${TERMINOS[termYrs]?TERMINOS[termYrs].sufijo:'?'} (meses), no el marcador DD del patron.`,
      ...comercialActual.avisos.map((a)=>`  · ${a.mensaje.replace(/\s+/g,' ')}`),
      ...(bloqueos.length?['', 'ESTA LISTA NO ESTA HABILITADA PARA COTIZAR EN FIRME:',
        ...bloqueos.map((b)=>`  · ${b.mensaje.replace(/\s+/g,' ')}`)]:[]),
      // Si alguien fuerza la exportacion, el motivo VIAJA con el documento. Una puerta sin
      // salida se rodea copiando la tabla a mano, y entonces el documento sale sin la
      // advertencia; asi sale con ella.
      ...(override?['', `EXPORTACION FORZADA el ${override.fecha}`
        +`${override.usuario?` por ${override.usuario}`:''} — motivo: ${override.motivo}`,
        'Documento de trabajo: NO es una cotizacion en firme.']:[]),
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

  huellaDelBom=ultimaHuella;

  pintarPerfiles();
  $('bomOut').value=BOM.comoTexto(filas,meta);
  bomMeta=meta; bomFilas=filas;

  // La puerta se evalua al final, con las lineas ya construidas: lo que decide si esta
  // propuesta se puede exportar es el conjunto -escenario, bloqueos y vigencia de la fuente
  // comercial-, no ninguna de las tres por separado.
  pintarPuerta({bloqueos, avisos:comercialActual.avisos, meta});
  pintarPasos(null);
}

// El clic en una alternativa escribe en el desplegable de la ficha y dispara su `change`:
// ese manejador ya sabe repintar medidores, razones, BOM y escala, asi que duplicar aqui esa
// cadena seria la segunda implementacion que acaba divergiendo. Se delega en `document`
// porque el sticky se reconstruye entero en cada render y un listener directo se perderia.
document.addEventListener('click',e=>{
  const b=e.target.closest('.sr-alt'); if(!b) return;
  const sel=document.getElementById('verdict-sel');
  if(!sel) return;
  sel.value=b.dataset.alt;
  sel.dispatchEvent(new Event('change',{bubbles:true}));
});

/* ══ PUERTA DE EXPORTACION (§12 y §14 del informe) ═══════════════════════════════════════
   Exportar a Excel, copiar e imprimir se habilitan SOLO cuando el escenario coincide con el
   calculo, no hay bloqueos P0 y cada linea lleva SKU exacto. No es un aviso pasivo: los
   botones se deshabilitan de verdad.

   EL OVERRIDE EXISTE A PROPOSITO, y con motivo obligatorio. A veces hay que mandar un
   borrador tecnico antes de tener el SKU del Ordering Guide, y una puerta sin salida se
   rodea copiando la tabla a mano — que es peor, porque entonces el documento sale SIN la
   advertencia. Asi sale con ella: el motivo, la fecha y el usuario viajan estampados en las
   notas del Excel y del texto copiado. */
function usuarioActual(){ return (window.__usuarioPresales||null); }

function pintarPuerta(ctx){
  const caja=$('exportGate'); if(!caja) return;
  const precios=FUENTES&&FUENTES.fuentes
    ? FUENTES.fuentes.find(f=>f.dominio==='precio')||null : null;
  const salud=precios?R.saludPrecios(precios):{estado:'sin-fuente', bloquea:false,
    mensaje:'No se localizó la lista de precios en la procedencia del fabricante.'};
  const bloqueos=ctx.bloqueos.slice();
  if(salud.bloquea) bloqueos.push({codigo:'precios-vencidos', mensaje:salud.mensaje});

  const st=R.estadoEscenario({
    faltan:[],
    hayCandidato,
    // Invariante, no deteccion: ver el comentario de `ultimaHuella` arriba.
    stale:ultimaHuella!==null&&huellaDelBom!==null&&ultimaHuella!==huellaDelBom,
    bloqueos,
    avisos:ctx.avisos,
  });

  const abierto=st.puedeExportar||!!override;
  ['xlsBtn','copyBtn'].forEach(id=>{ const b=$(id); if(b) b.disabled=!abierto; });
  const cot=document.getElementById('btnACotizador');
  if(cot) cot.disabled=!abierto;

  const cls=st.puedeExportar?'ok':(st.estado==='advertencia'?'warn':'bad');
  // El titular resume; la lista detalla. Se listan TODOS menos el que ya encabeza, porque
  // repetirlo palabra por palabra hace dudar de lo demas que dice la pantalla.
  const lista=bloqueos.length?bloqueos:ctx.avisos;
  let html=`<h3 class="${cls==='bad'?'warn':''}">${esc(st.titulo)}</h3><p style="margin:0">${esc(st.motivo)}</p>`;
  if(lista.length>1) html+=`<ul>${lista.slice(1).map(b=>`<li>${esc(b.mensaje)}</li>`).join('')}</ul>`;
  html+=`<p class="hint" style="margin:8px 0 0">Huella del escenario <code>${esc(huellaDelBom||'—')}</code>`
    +` · ${filasSinSku(ctx.meta)} línea(s) sin SKU exacto · lista de precios: ${esc(salud.mensaje)}</p>`;
  if(!st.puedeExportar){
    html+=override
      ? `<p class="hint" style="margin:8px 0 0"><b class="warn">Exportación forzada</b> por ${esc(override.usuario||'usuario sin identificar')} el ${esc(override.fecha)} — motivo: «${esc(override.motivo)}». Viaja estampado en el documento. <button type="button" class="btn ghost" id="btnOvCancel" style="font-size:10px;padding:3px 8px">Deshacer</button></p>`
      : `<div class="gate-ov"><input type="text" id="ovMotivo" placeholder="Motivo para exportar igualmente (obligatorio)" autocomplete="off">`
        +`<button type="button" class="btn ghost" id="btnOverride" style="font-size:11px;padding:5px 11px">Exportar como borrador</button></div>`;
  }
  caja.className='gate '+cls;
  caja.innerHTML=html;
}

// Cuenta las lineas cotizables que no tienen SKU exacto. El equipo sin SKU cuenta: es lo que
// distingue un borrador tecnico de una cotizacion.
function filasSinSku(){
  return bomFilas.filter(f=>!f.sku).length;
}

$('exportGate').addEventListener('click',e=>{
  if(e.target.id==='btnOverride'){
    const motivo=($('ovMotivo').value||'').trim();
    if(!motivo){ $('ovMotivo').focus(); return; }
    override={motivo, fecha:new Date().toISOString().slice(0,10), usuario:usuarioActual()};
    renderBom();
  }else if(e.target.id==='btnOvCancel'){
    override=null; renderBom();
  }
});


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
  // Pendiente 34: el respaldo de ciclo de vida de ESTE fabricante, tal como lo declara
  // `legacyData/fuentes.js` con sus `campos`. Sin el, la ficha dice «el catalogo no trae el
  // ciclo de vida» en vez de afirmar vigencia por omision.
  FICHA.fijarCicloVida(data.cicloVida);
  MODELS = data.models;
  BUNDLES = data.bundles;
  CARE = data.care;
  // Reglas comerciales servidas con el catalogo, no escritas en esta pagina.
  FUNCIONES = data.funciones || [];
  SERVICIOS_SDWAN = data.serviciosSdwan || [];
  TERMINOS = data.terminos || {};

  // Las vistas se cargan ANTES del primer render: si llegaran despues, la tarjeta se
  // pintaria una vez sin foto y otra con ella, que es justo el parpadeo que hace dudar de
  // si el equipo tiene foto o no. Si el fetch falla, `vistas` queda en null y la ficha
  // declara el hueco -nunca una imagen inventada-.
  try{
    const rv=await fetch('/data/fortinet-vistas-equipos.json');
    if(rv.ok) VISTAS=await rv.json();
  }catch{ VISTAS=null; }

  populatePickModel();
  render();
  renderBom();
  renderCatalogo();

  // La procedencia llega DESPUES del catalogo y en su propia peticion: el banner y la puerta
  // de exportacion la necesitan, pero el dimensionamiento no, asi que no se le hace esperar.
  // Si /api/fuentes falla, el banner dice que no pudo leerla en vez de afirmar vigencia.
  try{
    const rf = await fetch('/api/fuentes');
    const todas = await rf.json();
    FUENTES = (todas && todas.fortinet) ? todas.fortinet : null;
  }catch{ FUENTES = null; }
  pintarBanner();
  renderBom();
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
  // El boton de enlace y el aviso de parametros desconocidos van AHORA dentro de la barra de
  // acciones, con el cliente y la referencia (§7 del informe: «cliente, referencia, copiar,
  // limpiar y estado guardado en una fila»). Antes se inyectaban debajo de las pestanas, en
  // un tercer sitio: reproducir un escenario exigia saber donde mirar.
  const caja = $('accionesEnlace');
  if (caja) {
    ESTADO.botonEnlace(caja);
    ESTADO.avisoOrigen(caja, st);
  }
  actualizarEstadoGuardado(st);
});

/* ══ ESTADO GUARDADO Y «LIMPIAR» ═════════════════════════════════════════════════════════
   El indicador dice de donde salio lo que hay en pantalla -un enlace compartido o los
   valores por defecto-, porque son dos situaciones que se leen muy distinto: con la segunda
   se esta empezando y con la primera se esta revisando lo que mando otra persona. */
function actualizarEstadoGuardado(st){
  const n=$('estadoGuardado'); if(!n) return;
  n.textContent=(st&&st.origen)
    ? 'Escenario repuesto desde un enlace compartido'
    : 'Escenario nuevo — valores por defecto';
}

// «Limpiar» vuelve a los valores por defecto SIN recargar con el querystring puesto: recargar
// repondria el enlace compartido y no limpiaria nada, que es el fallo obvio de hacerlo con
// location.reload().
$('btnLimpiar').addEventListener('click',()=>{
  location.href = location.pathname;
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
