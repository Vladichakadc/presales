'use strict';
let MODELS = [];
let BUNDLES = {};
let CARE = {};

const $=id=>document.getElementById(id);
let profile='tp', modoCaudal='link', rolSdwan='none', segMode='branch', lastPick=null;
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
['bw','unit','users','perUser','head','sesUser','sessNeed','vidaSes','sites','conc','pctOverlay',
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
  $('bwLbl').textContent=agg?'Caudal por sede':'Ancho de banda de Internet / WAN';
  $('modoHint').textContent=agg
    ? 'Caudal de UNA sede por el número de sedes y por el factor de simultaneidad. Es el modo del concentrador.'
    : 'Un solo caudal, para dimensionar una sede o un perímetro de Internet.';
  $('fldOverlay').hidden=(rolSdwan==='none');
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
  $('pctOverlayVal').textContent=Math.round(frac*100)+' %';
  const effectiveNeed=baseNeed*(1+frac*OVERHEAD_ESP);

  const capa=capaEfectiva();
  pintarHintCapa(capa);
  pintarControlesTopologia();

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
  sincronizarConBom(pick);

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
    FICHA.render({contenedor:'verdict', candidatos:[], recomendado:null,
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

/* ══ ESTADO ENLAZABLE Y PERSISTENTE ══
   Antes, poner 2.500 Mbps y copiar la URL no servia de nada: quien la abria veia 500 Mbps y
   otra recomendacion. Ahora el escenario viaja en la URL y sobrevive a una recarga. Ver
   /js/estado.js para por que hacen falta la URL Y el almacenamiento local, y no uno solo. */
document.addEventListener('DOMContentLoaded', () => {
  const st = ESTADO.vincular({ clave: 'dimensionador-fortinet-fortigate', campos: ['bw','unit','users','perUser','head','sesUser','sessNeed','vidaSes','sites','conc','pctOverlay','chkSsl','chkAv','chkWeb','chkSandbox','chkIotDlp','chkHa','modoSeg','profileSeg','rolSeg','segSeg','verdict-sel'] });
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
