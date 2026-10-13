'use strict';
/* global MikrotikMotor */
let MODELS=[], OPTICS={}, OPTIC_LABEL={}, APS=[], SUPPORT={}, SIZING={};

const $=id=>document.getElementById(id);
const M=MikrotikMotor;
let profile='fwd', media='any', modo='sitio', trama=M.TRAMA_DEFECTO, lastPick=null;
let hayCandidato=true;
let bomFilas=[], bomMeta={}, ultimaEval=null;
// Figuras oficiales de cada equipo (2026-10-13): la galeria «Product images» de su ficha en
// mikrotik.com, en alta resolucion. Mapa y procedencia en /data/mikrotik-vistas-equipos.json;
// las pinta FICHA (opt-in `vistas`, como en Aruba, Fortinet y Huawei) y viajan al Excel.
let VISTAS=null;
const VENDOR='mikrotik';

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
  ['calc','bom','lic','topo','cat','src'].forEach(t=>$('pane-'+t).hidden=(t!==b.dataset.tab));
}));

// `fwd` es el valor historico del boton de ruteo: se conserva para que los enlaces viejos sigan
// abriendo el mismo perfil.
const PERFIL={fwd:'ruteo', ipsec:'ipsec', wg:'wg'};
const PROFILE_HINT={
  fwd:'Ruteo con la fila de la ficha que piden las funciones activas (firewall, colas, L3HW).',
  ipsec:'IPsec con la fila de la ficha: un túnel en un sitio, 256 túneles en un hub, por cifrado.',
  wg:'MikroTik no publica el rendimiento de WireGuard en ninguna ficha: no se recomienda equipo. Valide con una prueba de concepto o dimensione por IPsec.',
};
function segClick(id, fijar){
  $(id).addEventListener('click',e=>{
    const b=e.target.closest('button');if(!b)return;
    [...$(id).children].forEach(x=>x.setAttribute('aria-pressed',x===b));
    fijar(b.dataset.v); render();
  });
}
segClick('profileSeg',v=>{profile=v; $('profileHint').textContent=PROFILE_HINT[v]||'';});
segClick('mediaSeg',v=>{media=v;});
segClick('modoSeg',v=>{modo=v;});
segClick('tramaSeg',v=>{trama=Number(v)||M.TRAMA_DEFECTO;});
// Los sub-campos solo existen mientras su opcion este activa.
[['chkBgp','bgpBox'],['chkPppoe','pppoeBox'],['chkCapsman','capsBox']].forEach(([chk,box])=>{
  $(chk).addEventListener('change',()=>$(box).classList.toggle('hidden',!$(chk).checked));
});
['bw','unit','head','dirMult','sedes','conc','firewall','cifrado','chkVirtual','chkQos','chkL3hw','chkBgp','bgpFeeds',
 'chkPppoe','pppoeSess','ovpnTun','hotspotUsers','chkCapsman','apCount','apModel','chkPoe','chkHa']
  .forEach(id=>$(id).addEventListener('input',render));
['pickModel','qty','supportTier','chkTraining','bomApModel','bomApQty','aniosTco','plazoMrr','margenFin','feeMsp']
  .forEach(id=>$(id).addEventListener('input',renderBom));

const fmt=M.fmt;
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const money=n=>n==null?'—':'$'+Number(n).toLocaleString('en-US',{maximumFractionDigits:2});
const ramTxt=m=>m.ram==null?'según hipervisor':m.ram<1024?`${m.ram} MB`:`${(m.ram/1024).toFixed(0)} GB`;
const lvlTxt=m=>m.lvl==='chr'?'CHR':`nivel ${m.lvl}`;
const celda=(t,b)=>t&&t[b]?t[b][1]:null;
const tope=v=>v==null?'sin tope':String(v);

// Catalogo MikroTik con tres celdas de la matriz: el techo (fast path), la fila de firewall a
// trama mixta, que es la que mas se acerca a un sitio real, e IPsec con un tunel.
function renderCatalogo(){
  const tbody=document.querySelector('#tbl-mikrotik-cat tbody');
  if(!tbody) return;
  tbody.innerHTML=MODELS.map(m=>{
    const r=FICHA.rango(m);
    const marca=r===2?' <span class="pillc" style="color:var(--red-txt,var(--red))">Fuera de venta</span>'
      :r===1?' <span class="pillc">Línea anterior</span>':'';
    const p=m.pruebas;
    return `<tr>
    <td><code>${esc(m.id)}</code>${marca}</td><td>${esc(m.ser)}</td><td>${esc(m.seg)}</td>
    <td class="n">${m.ser==='CHR'?esc(fmt(m.fwd))+' (licencia)':fmt(p?celda(p.ruteo.fastpath,1518):null)}</td>
    <td class="n">${fmt(p?celda(p.ruteo.filtro,512):null)}</td>
    <td class="n">${fmt(m.ipsec)}</td>
    <td>${esc(m.ports)}</td>
    <td class="n" style="color:var(--amber);white-space:nowrap">${m.elp?esc(m.elp):'Consultar'}</td>
  </tr>`;
  }).join('');
}

/* ── Escenario y motor ─────────────────────────────────────────────────────── */
function apElegido(){ return APS.find(a=>a.sku===$('apModel').value)||APS[0]||null; }
function escenario(){
  const ap=apElegido();
  return {
    bw:$('bw').value, unit:$('unit').value, head:$('head').value, dirMult:$('dirMult').value,
    modo, sedes:$('sedes').value, conc:$('conc').value, trama, perfil:PERFIL[profile]||'ruteo',
    firewall:$('firewall').value, qos:$('chkQos').checked, l3hw:$('chkL3hw').checked, cifrado:$('cifrado').value,
    virtual:$('chkVirtual').checked, media, ha:$('chkHa').checked,
    bgpFeeds:$('chkBgp').checked?(parseInt($('bgpFeeds').value,10)||1):0,
    ppp:$('chkPppoe').checked?$('pppoeSess').value:0,
    ovpn:$('chkPppoe').checked?$('ovpnTun').value:0,
    hotspot:$('chkPppoe').checked?$('hotspotUsers').value:0,
    aps:$('chkCapsman').checked?$('apCount').value:0,
    apPoe:$('chkCapsman').checked&&$('chkPoe').checked, apDraw:ap?ap.poeDraw:0,
  };
}
function evaluarEscenario(){
  return M.evaluar(escenario(), MODELS, {rango:FICHA.rango, recomendable:m=>FICHA.rango(m)<2,
    licencias:SIZING.licenseLevels, bgpRam:SIZING.bgpRam});
}

function pintarAvisos(ev){
  const l=ev?ev.avisos:[];
  $('avisosBox').innerHTML=l.length?l.map(a=>`<li>${esc(a)}</li>`).join(''):'<li>Sin avisos.</li>';
}

function render(){
  $('headVal').textContent=Math.round((parseFloat($('head').value)||0))+' %';
  $('hubBox').classList.toggle('hidden',modo!=='hub');
  $('bwLbl').textContent=modo==='hub'?'Caudal por sede (por sentido)':'Caudal del enlace (por sentido)';
  // Lo que no aplica al perfil se marca inactivo: no viaja en el enlace del escenario.
  if(profile==='ipsec') $('cifradoBox').removeAttribute('data-inactivo'); else $('cifradoBox').setAttribute('data-inactivo','');
  $('cifradoBox').classList.toggle('hidden',profile!=='ipsec');
  if(modo==='hub') $('hubBox').removeAttribute('data-inactivo'); else $('hubBox').setAttribute('data-inactivo','');

  const ev=evaluarEscenario();
  ultimaEval=ev;
  pintarAvisos(ev);
  // Sin ancho de banda no hay recomendación (regla de preventa 2026-09-13): es el dato
  // mínimo del dimensionamiento; sin él la página pide valores en vez de proponer un
  // equipo a ciegas.
  if(ev.raw<=0){
    lastPick=null; hayCandidato=false; sincronizarConBom(null);
    const need=$('need'); need.style.left='0%'; $('needLbl').textContent='—';
    $('track').querySelectorAll('.dot,.tick,.pickLabel').forEach(e=>e.remove());
    FICHA.render({vendor:'mikrotik', contenedor:'verdict', candidatos:[], recomendado:null,
      vacioTitulo:'Ingrese valores para recomendar un equipo',
      vacioDetalle:'<p style="margin:0;font-size:13.5px">Escriba el <b>caudal</b> del sitio (y si aplica, los servicios BGP, túneles o CAPsMAN) para que el dimensionador proponga los modelos que cumplen.</p>'});
    $('verdict').style.borderLeftColor='var(--steel)';
    $('sizingBox').innerHTML='<p style="font-size:13.5px;color:var(--steel)">Ingrese valores para recomendar un equipo.</p>';
    return;
  }
  const pick=ev.pick?ev.pick.m:null;
  lastPick=pick;
  hayCandidato=!!pick;
  sincronizarConBom(pick);

  // Escala logaritmica sobre las capacidades del escenario (sin el centinela de CHR ilimitado).
  const caps=ev.rows.map(r=>r.cap).filter(v=>v!=null&&v<999999);
  const maxCap=Math.max(ev.need,...caps,1000);
  const logP=v=>Math.log10(Math.max(v,10));
  const logMin=Math.log10(10),logMax=logP(maxCap*1.2);
  const xPct=v=>(logP(v)-logMin)/(logMax-logMin)*100;
  $('ladderLbl').textContent=`Capacidad oficial en la celda del escenario vs. necesidad agregada (${fmt(ev.need)}) — escala logarítmica`;
  const need=$('need');
  need.style.left=Math.min(xPct(ev.need),99)+'%';
  $('needLbl').textContent=fmt(ev.need);
  need.classList.toggle('flip',xPct(ev.need)>60);
  const track=$('track');
  track.querySelectorAll('.dot,.tick,.pickLabel').forEach(e=>e.remove());
  [10,100,1000,10000,100000].forEach(v=>{
    const pct=xPct(v);if(pct<0||pct>100)return;
    const tick=document.createElement('div');tick.className='tick';tick.style.left=pct+'%';
    tick.innerHTML=`<i></i><b>${v>=1000?v/1000+'G':v+'M'}</b>`;track.appendChild(tick);
  });
  ev.rows.filter(r=>r.cap!=null&&!r.m.legacy).forEach(r=>{
    const pct=xPct(Math.min(r.cap,maxCap*1.2));if(pct<0||pct>100)return;
    const dot=document.createElement('div');
    dot.className='dot'+(pick&&r.m.id===pick.id?' pick':!r.miss.length?' ok':'');
    dot.style.left=pct+'%';dot.title=`${r.m.id}: ${fmt(r.cap)}`;
    track.appendChild(dot);
  });

  if(!pick){
    // Cada modelo apartado dice por que: la lista vacia se explica, no se adivina.
    const motivos=new Map();
    ev.rows.forEach(r=>r.miss.forEach(x=>motivos.set(x,(motivos.get(x)||0)+1)));
    const why=[...motivos.entries()].sort((a,b)=>b[1]-a[1]).slice(0,8)
      .map(([x,n])=>`<li><b>${n}</b> modelo(s): ${esc(x)}.</li>`).join('');
    FICHA.render({vendor:'mikrotik', contenedor:'verdict', candidatos:[], recomendado:null,
      vacioTitulo:'Ningún modelo del catálogo cumple todas las restricciones',
      vacioDetalle:`<p class="warn" style="margin:0 0 8px"><b>Motivos del descarte:</b></p><ul style="margin:0;padding-left:18px;font-size:13.5px">${why}</ul>`});
    $('verdict').style.borderLeftColor='var(--amber)';
    $('sizingBox').innerHTML='<p style="font-size:13.5px;color:var(--steel)">Ajusta las restricciones para obtener una recomendación.</p>';
    return;
  }
  $('verdict').style.borderLeftColor='var(--red)';
  const filaDe=m=>ev.rows.find(r=>r.m.id===m.id);

  const medidoresDe=m=>{
    const r=filaDe(m)||{}, lic=SIZING.licenseLevels[m.lvl]||{};
    const md=[
      {etq:r.fila?`Capacidad oficial — ${r.fila}`:'Capacidad (tope de licencia por interfaz)', val:ev.need, tope:r.cap||0,
       txt:`${fmt(m.ser==='CHR'?ev.porSentido:ev.need)} / ${fmt(r.cap)}`},
    ];
    if(m.wanMax!=null&&m.ser!=='CHR') md.push({etq:'Puerto más rápido (por sentido)', val:ev.porSentido, tope:m.wanMax, txt:`${fmt(ev.porSentido)} / ${fmt(m.wanMax)}`});
    if(ev.req.feeds) md.push({etq:'RAM — feeds BGP full table (supuesto)', val:ev.req.feeds, tope:r.feeds===Infinity?0:r.feeds,
      txt:m.ram==null?'Según hipervisor':`${ev.req.feeds} / ${r.feeds} feeds · ${ramTxt(m)}`});
    if(ev.req.ppp) md.push({etq:'Túneles PPPoE / PPTP / L2TP', val:ev.req.ppp, tope:lic.ppp||0, txt:`${ev.req.ppp} / ${tope(lic.ppp)}`});
    if(ev.req.hotspot) md.push({etq:'Usuarios HotSpot', val:ev.req.hotspot, tope:lic.hotspot||0, txt:`${ev.req.hotspot} / ${tope(lic.hotspot)}`});
    return md;
  };

  const porQueDe=m=>{
    const r=filaDe(m)||{}, flags=[];
    if(m.ser!=='CHR'&&r.fila) flags.push(`Celda oficial: <b>${esc(r.fila)}</b> = ${fmt(r.cap)} (${Math.round((r.ocupacion||0)*100)} % de ocupación).`);
    if(m.wanMax!=null&&m.ser!=='CHR') flags.push(`Puerto más rápido: ${fmt(m.wanMax)} por sentido; el escenario pide ${fmt(ev.porSentido)}.`);
    if(ev.req.feeds) flags.push(m.ram==null
      ? `CHR: dimensionar la instancia con ≥ <b>${(M.ramParaFeeds(ev.req.feeds,SIZING.bgpRam)/1024).toFixed(1)} GB</b> de RAM para ${ev.req.feeds} feed(s) (supuesto de diseño).`
      : `Sostiene hasta <b>${r.feeds}</b> feed(s) completos con ${ramTxt(m)} de RAM (supuesto de diseño).`);
    if(ev.req.ppp||ev.req.ovpn||ev.req.hotspot) flags.push(`Licencia <b>${esc(lvlTxt(m))}</b>: ${esc((SIZING.licenseLevels[m.lvl]||{}).d||'')}`);
    if(ev.req.aps) flags.push(`${ev.req.aps} AP por CAPsMAN — pasan a la lista de materiales.`);
    if(ev.unidades>1) flags.push('<b>VRRP:</b> 2 unidades, cada una al caudal completo y con su licencia embebida.');
    if(m.note) flags.push(`<span class="warn">${esc(m.note)}</span>`);
    return `<ul style="margin:8px 0 0;padding-left:18px;font-size:13.5px">
      <li>Necesidad <b>${fmt(ev.need)}</b> agregada (${fmt(ev.porSentido)} por sentido) contra <b>${fmt(r.cap)}</b></li>
      <li>${esc(m.ports)}</li>
      ${flags.map(f=>`<li>${f}</li>`).join('')}
    </ul>`;
  };

  // La matriz de la ficha en tres columnas por fila: es lo que un arquitecto mira antes de
  // firmar un dimensionamiento, y deja ver cuanto cae cada equipo con paquetes pequenos.
  const matrizDe=m=>{
    const p=m.pruebas;
    if(!p) return {titulo:'Tabla de pruebas de la ficha', filas:[['Sin tabla', m.ser==='CHR'?'CHR: MikroTik no publica cifras; las decide el hipervisor':'sin ficha leída']]};
    const tres=t=>[1518,512,64].map(b=>`${b} B: ${fmt(celda(t,b))}`).join(' · ');
    const tresI=t=>[1400,512,64].map(b=>`${b} B: ${fmt(celda(t,b))}`).join(' · ');
    const filas=Object.entries(p.ruteo).map(([k,t])=>[M.CONFIGS[k]||k, tres(t)]);
    if(p.ipsec){
      const uno=p.ipsec.uno['aes128-sha1'], multi=p.ipsec.multi||{};
      if(uno) filas.push(['IPsec 1 túnel · AES-128-CBC + SHA1', tresI(uno)]);
      Object.entries(multi).forEach(([c,t])=>filas.push([`IPsec 256 túneles · ${M.CIFRADOS[c]||c}`, tresI(t)]));
    } else filas.push(['IPsec', 'la ficha no publica rendimiento IPsec']);
    return {titulo:'Tabla de pruebas de la ficha (RFC 2544, «all port»)', filas,
      nota:m.url?`Fuente: ${esc(m.url)}. Mbps agregados de todos los puertos.`:''};
  };

  const seccionesDe=m=>{
    const sup=SUPPORT[$('supportTier')&&$('supportTier').value?$('supportTier').value:Object.keys(SUPPORT)[0]]||Object.values(SUPPORT)[0];
    const lic=SIZING.licenseLevels[m.lvl]||{};
    return [
      {titulo:'Características del equipo', filas:[
        ['Segmento', esc(m.seg)],
        ['Ruteo fast path (1518 B)', fmt(m.fwd)],
        ['Ruteo con 25 reglas de filtro (1518 B)', fmt(m.fw)],
        ['IPsec 1 túnel (1400 B)', fmt(m.ipsec)],
        ['CPU', esc(m.cpu||'—')+(m.cores?` · ${m.cores} núcleos`:'')],
        ['RAM', ramTxt(m)],
        ['Puerto más rápido', m.wanMax!=null?fmt(m.wanMax):'según hipervisor'],
        ['PoE-out', m.poe!=null?`${m.poe} W`:m.poeA!=null?`${String(m.poeA).replace('.',',')} A (la ficha no da vatios)`:'—'],
        ['Puertos', esc(m.ports), true],
        ['Precio sugerido', m.elp?esc(m.elp):'Consultar distribuidor'],
      ]},
      matrizDe(m),
      FICHA.seccionPuertos(m),
      FICHA.seccionAlimentacion(m),
      {titulo:'Licenciamiento propuesto', filas:[
        ['Licencia RouterOS', m.lvl==='chr'?'CHR — la licencia es el producto':`Nivel ${m.lvl} — embebida en el hardware`],
        ['Túneles PPPoE / PPTP / L2TP', tope(lic.ppp)],
        ['Túneles OpenVPN', tope(lic.ovpn)],
        ['Usuarios HotSpot activos', tope(lic.hotspot)],
        ['Alcance', esc(lic.d||''), true],
        ['Unidades a licenciar', $('chkHa').checked?'2 — cada nodo VRRP lleva la suya':'1'],
      ], nota:'En MikroTik la licencia viene embebida en el equipo: no hay suscripción anual de funciones. En CHR la licencia es aparte y fija el tope de subida por interfaz.'},
      {titulo:'Software y gestión', filas:[
        ['RouterOS v7', 'IPsec, WireGuard, BGP, OSPF, MPLS, CAPsMAN', true],
        ['WinBox / WebFig', 'GUI nativa y GUI web integrada, sin licencia', true],
        ['The Dude', 'NMS gratuito: SNMP, syslog, alertas y mapas', true],
        ['REST API / SSH', 'Automatización con Ansible, Terraform o scripts RouterOS', true],
      ]},
      {titulo:'Soporte', filas:[[esc(sup.n), esc(sup.sla||'—')]], nota:esc(sup.d||'')},
    ];
  };

  const pintarDependientes=m=>{
    const r=filaDe(m)||{};
    track.querySelectorAll('.pickLabel').forEach(e=>e.remove());
    if(r.cap!=null){
      const pl=document.createElement('div');
      pl.className='pickLabel';pl.textContent=m.id;pl.style.left=xPct(Math.min(r.cap,maxCap*1.2))+'%';
      track.appendChild(pl);
    }
    const filaTabla=(k,v)=>`<tr><td>${k}</td><td class="n r">${v}</td></tr>`;
    $('sizingBox').innerHTML=`
      <table><tbody>
        ${filaTabla('Equipo evaluado', esc(m.id)+(m.id===pick.id?'':' (elegido a mano)'))}
        ${filaTabla('Perfil', esc(M.PERFILES[ev.perfil]))}
        ${filaTabla('Caudal base', ev.modo==='hub'?`${ev.sedes} sedes × ${fmt(ev.raw)} × ${ev.conc} %`:fmt(ev.raw))}
        ${filaTabla('Con margen (+'+ev.head+' %)', fmt(ev.porSentido)+' por sentido')}
        ${filaTabla('Necesidad agregada (×'+ev.dirMult+')', '<b>'+fmt(ev.need)+'</b>')}
        ${filaTabla('Celda de la ficha', esc(r.fila||(m.ser==='CHR'?'tope de licencia por interfaz':'—')))}
        ${filaTabla('Capacidad oficial', fmt(r.cap))}
        ${filaTabla('Ocupación', r.ocupacion!=null&&r.cap<999999?Math.round(r.ocupacion*100)+' %':'—')}
        ${filaTabla('CPU / RAM', `${m.cores?m.cores+' núcleos':'—'} / ${ramTxt(m)}`)}
        ${filaTabla('Licencia', esc(lvlTxt(m)))}
        ${filaTabla('Unidades a cotizar', ev.unidades>1?'2 (VRRP)':'1')}
      </tbody></table>`;
  };

  const elegidoId=FICHA.render({vendor:'mikrotik',
    contenedor:'verdict',
    vistas:VISTAS||{},
    candidatos:ev.fit.map(r=>r.m),
    recomendado:pick.id,
    etiqueta:m=>{const r=filaDe(m)||{};return `${m.id} — ${m.seg} · ${fmt(r.cap)}${m.elp?' · '+m.elp:''}`;},
    titulo:m=>m.id,
    subtitulo:m=>`${m.seg} · RouterOS v7 · licencia ${lvlTxt(m)}${m.elp?' · '+m.elp:''}`,
    medidores:medidoresDe,
    porQue:porQueDe,
    secciones:seccionesDe,
    alCambiar:id=>{
      const m=ev.fit.map(r=>r.m).find(x=>x.id===id);
      if(!m) return;
      pintarDependientes(m);
      llevarABom(m.id);
    },
  });
  const elegido=ev.fit.map(r=>r.m).find(m=>m.id===elegidoId)||pick;
  pintarDependientes(elegido);
  sincronizarConBom(elegido);
}

/* ── BOM ───────────────────────────────────────────────────────────────────── */
function populateSelects(){
  // Combo agrupado por familia; dentro de cada una, de menor a mayor capacidad. Orden
  // determinista: la API puede servir el catalogo en cualquier orden. Lo virtual (CHR) va al
  // final, no por capacidad sino por naturaleza: es la opcion cuando no se compra hardware.
  const grupos=new Map();
  for(const m of MODELS){
    const g=m.ser||'Otros';
    if(!grupos.has(g)) grupos.set(g,[]);
    grupos.get(g).push(m);
  }
  const ordenados=[...grupos.entries()];
  for(const [,ms] of ordenados) ms.sort((a,b)=>(a.fwd||0)-(b.fwd||0)||a.id.localeCompare(b.id));
  ordenados.sort((a,b)=>{
    const ca=a[0]==='CHR'?Infinity:Math.min(...a[1].map(m=>m.fwd||0));
    const cb=b[0]==='CHR'?Infinity:Math.min(...b[1].map(m=>m.fwd||0));
    return ca-cb||a[0].localeCompare(b[0]);
  });
  $('pickModel').innerHTML=ordenados.map(([g,ms])=>
    `<optgroup label="${esc(g)}">`+ms.map(m=>`<option value="${esc(m.id)}">${esc(m.id)} — ${esc(m.seg)}${m.eol?' (EOL)':m.legacy?' (línea anterior)':''}</option>`).join('')+`</optgroup>`
  ).join('');
  $('supportTier').innerHTML=Object.entries(SUPPORT).filter(([c])=>c!=='training')
    .map(([c,t])=>`<option value="${c}">${esc(t.n)}</option>`).join('');
  const opcAp=APS.map(a=>`<option value="${esc(a.sku)}">${esc(a.sku)} — ${money(a.price)} · PoE-in ${esc(a.poeIn||'—')}</option>`).join('');
  $('bomApModel').innerHTML=opcAp;
  $('apModel').innerHTML=opcAp;
}

// Un CCR2216 son 12 jaulas SFP28 + 2 QSFP28 vacias: sin estas lineas el equipo no es
// instalable. Se reconstruye al cambiar de modelo porque las jaulas cambian con el.
function renderOpticsPicker(m){
  const cages=m.cages||{};
  const codes=Object.keys(cages).filter(c=>OPTICS[c]&&OPTICS[c].length);
  $('opticsPanel').classList.toggle('hidden',!codes.length);
  if(!codes.length){$('opticsPicker').innerHTML='';return;}
  $('opticsPicker').innerHTML=codes.map(c=>`
    <div class="field">
      <label>${esc(OPTIC_LABEL[c]||c)} <span style="font-weight:400;color:var(--steel)">— ${cages[c]} jaula${cages[c]>1?'s':''}</span></label>
      <div class="opticRow">
        <select class="opticSel" data-cat="${c}" aria-label="Óptica ${esc(OPTIC_LABEL[c]||c)}">${OPTICS[c].map((o,i)=>`<option value="${i}">${esc(o.sku)} — ${money(o.price)}</option>`).join('')}</select>
        <input type="number" class="opticQty" data-cat="${c}" value="0" min="0" max="${cages[c]}" aria-label="Cantidad de ${esc(OPTIC_LABEL[c]||c)}">
      </div>
      <p class="hint opticDesc" data-cat="${c}">${esc(OPTICS[c][0].d)}</p>
    </div>`).join('');
  $('opticsPicker').querySelectorAll('.opticSel,.opticQty').forEach(el=>el.addEventListener('input',renderBom));
}

function selectedOptics(){
  return [...document.querySelectorAll('.opticQty')].map(q=>{
    const cat=q.dataset.cat;
    const sel=document.querySelector(`.opticSel[data-cat="${cat}"]`);
    const optic=OPTICS[cat][parseInt(sel.value)||0];
    const desc=document.querySelector(`.opticDesc[data-cat="${cat}"]`);
    if(desc&&optic) desc.textContent=optic.d;
    const qty=Math.max(0,parseInt(q.value)||0);
    if(!qty) return null;
    return {cat,qty,optic};
  }).filter(Boolean);
}

const OPEX_MIKROTIK=['Soporte'];
const DTO=BOM.simuladorDescuento('cajaDescuento',()=>renderBom());
const dtoActual=()=>(DTO?DTO.valor():0);

function pintarTco(filas){
  const anios=Math.max(1,parseInt($('aniosTco').value,10)||1), dto=dtoActual();
  const fin=BOM.tco(filas,{opex:OPEX_MIKROTIK, anios});
  const net=v=>(dto>0?`<td><b>${BOM.money(v*(1-dto))}</b></td>`:'');
  $('tcoFin').innerHTML=(fin.capex>0||fin.opexTermino>0)
    ? `<table class="tco-tabla"><thead><tr><th>Pie de la lista de materiales</th><th>Subtotal Lista</th>${dto>0?'<th>Subtotal Neto</th>':''}</tr></thead><tbody>`
      +`<tr><td><b>CAPEX</b> — equipo, ópticas y AP</td><td>${BOM.money(fin.capex)}</td>${net(fin.capex)}</tr>`
      +`<tr><td><b>OPEX anual</b> — soporte ÷ ${anios} año${anios>1?'s':''}</td><td>${BOM.money(fin.opexAnual)}</td>${net(fin.opexAnual)}</tr>`
      +`<tr><td><b>TCO a ${anios} año${anios>1?'s':''}</b>${fin.sinPrecio?' (parcial)':''}</td><td><b>${BOM.money(fin.tco)}</b></td>${net(fin.tco)}</tr></tbody></table>`
      +(fin.sinPrecio?`<p class="hint" style="margin-top:8px"><b>TCO parcial:</b> ${fin.sinPrecio} línea(s) sin precio publicado no entran en la suma.</p>`:'')
    : '<p class="hint">Sin precios suficientes para calcular el TCO.</p>';
  const r=BOM.mrr({capexNeto:fin.capex*(1-dto), opexMensual:fin.opexAnual*(1-dto)/12,
    meses:$('plazoMrr').value, margenFin:$('margenFin').value, feeMsp:$('feeMsp').value, sinPrecio:fin.sinPrecio});
  $('mrrBox').innerHTML=!(fin.capex>0||fin.opexTermino>0)
    ? '<p class="hint">Sin precios no hay cuota.</p>'
    : `<table class="tco-tabla"><tbody>
      <tr><td>CAPEX neto a financiar${dto>0?' (con el descuento del simulador)':''}</td><td>${BOM.money(r.capexNeto)}</td></tr>
      <tr><td>Cuota de hardware (${r.meses} meses${r.margenFin?`, +${r.margenFin} % de financiación`:''})</td><td>${BOM.money(r.cuotaHardware)}</td></tr>
      <tr><td>OPEX mensual (soporte)</td><td>${BOM.money(r.opexMensual)}</td></tr>
      <tr><td>Fee de gestión MSP (${r.feeMsp} % de lo anterior)</td><td>${BOM.money(r.fee)}</td></tr>
      <tr><td><b>Cuota mensual (MRR)${r.completo?'':' — parcial'}</b></td><td><b>${BOM.money(r.mrr)}</b></td></tr>
      <tr><td><b>Valor total del contrato (TCV)</b> a ${r.meses} meses</td><td><b>${BOM.money(r.tcv)}</b></td></tr></tbody></table>
      <p class="hint" style="margin-top:8px">${r.sinPrecio?`<b>Parcial:</b> ${r.sinPrecio} línea(s) sin precio no entran en la cuota. `:''}Los porcentajes de financiación, fee y descuento los pone quien cotiza: no son cifras de MikroTik.</p>`;
}

function renderBom(){
  const m=MODELS.find(x=>x.id===$('pickModel').value)||MODELS[0];
  if(!m) return;
  if($('pickModel').dataset.built!==m.id){ renderOpticsPicker(m); $('pickModel').dataset.built=m.id; }

  const qty=Math.max(1,parseInt($('qty').value)||1);
  const supCode=$('supportTier').value;
  const support=SUPPORT[supCode];
  const optics=selectedOptics();
  // Los AP de CAPsMAN del dimensionamiento pasan solos al BOM; la cantidad del BOM manda si se
  // escribio a mano. Antes la ficha decia «incluidos en el BOM» y el BOM los dejaba en cero.
  const apManual=$('bomApQty').value!=='';
  const apQty=apManual?Math.max(0,parseInt($('bomApQty').value)||0)
    :($('chkCapsman').checked?Math.max(0,parseInt($('apCount').value)||0):0);
  const ap=APS.find(a=>a.sku===(apManual?$('bomApModel').value:$('apModel').value))||APS[0];
  const isChr=m.ser==='CHR';
  const lic=SIZING.licenseLevels[m.lvl]||{};
  const p=m.pruebas;

  let html=`${BOM.avisoDesvio({elegido:FICHA.elegido('verdict'), enBom:m.id, hayCandidato})}<section class="panel"><h2>Ficha del equipo</h2>
    <div class="model" style="font-size:28px">${esc(m.id)}</div>
    <p class="family">${esc(m.seg)} · RouterOS v7${m.url?` · <a href="${esc(m.url)}" target="_blank" rel="noopener">ficha oficial</a>`:''}</p>
    <div class="scroll"><table><thead><tr><th>Métrica</th><th>Valor</th></tr></thead><tbody>
    <tr><td>Precio sugerido</td><td class="n">${m.elp?esc(m.elp):'Consultar distribuidor'}</td></tr>
    <tr><td>Ruteo fast path (1518 / 512 / 64 B)</td><td class="n">${p?[1518,512,64].map(b=>fmt(celda(p.ruteo.fastpath,b))).join(' / '):isChr?fmt(m.fwd)+' de licencia':'—'}</td></tr>
    <tr><td>Ruteo con 25 reglas de filtro</td><td class="n">${p?[1518,512,64].map(b=>fmt(celda(p.ruteo.filtro,b))).join(' / '):'—'}</td></tr>
    <tr><td>Ruteo con 25 colas simples</td><td class="n">${p?[1518,512,64].map(b=>fmt(celda(p.ruteo.colas,b))).join(' / '):'—'}</td></tr>
    ${p&&p.ruteo.l3hw?`<tr><td>Ruteo L3HW (offload por hardware)</td><td class="n">${[1518,512,64].map(b=>fmt(celda(p.ruteo.l3hw,b))).join(' / ')}</td></tr>`:''}
    <tr><td>IPsec 1 túnel / 256 túneles (AES-128, 1400 B)</td><td class="n">${p&&p.ipsec?`${fmt(celda(p.ipsec.uno['aes128-sha1'],1400))} / ${fmt(celda(p.ipsec.multi['aes128-sha1'],1400))}`:'<span class="warn">la ficha no publica IPsec</span>'}</td></tr>
    <tr><td>WireGuard</td><td class="n">MikroTik no lo publica</td></tr>
    <tr><td>CPU</td><td class="n">${esc(m.cpu||'—')}${m.cores?` · ${m.cores} núcleo${m.cores>1?'s':''}`:''}</td></tr>
    <tr><td>RAM</td><td class="n">${ramTxt(m)}</td></tr>
    <tr><td>BGP full table (supuesto de diseño)</td><td class="n">${m.ram==null?'Según RAM de la instancia'
      :M.maxFeeds(m,SIZING.bgpRam)?`hasta ${M.maxFeeds(m,SIZING.bgpRam)} feed(s) completos`
      :'<span class="warn">No sostiene una tabla completa — ruta por defecto o feed parcial filtrado</span>'}</td></tr>
    <tr><td>Licencia</td><td class="n">${esc(lvlTxt(m))} — PPPoE/L2TP ${tope(lic.ppp)} · OpenVPN ${tope(lic.ovpn)} · HotSpot ${tope(lic.hotspot)}</td></tr>
    <tr><td>PoE-out</td><td class="n">${m.poe!=null?m.poe+' W':m.poeA!=null?String(m.poeA).replace('.',',')+' A (sin vatios publicados)':'No entrega PoE'}</td></tr>
    <tr><td>Puertos</td><td>${esc(m.ports)}</td></tr>
    </tbody></table></div>
    ${m.note?`<p class="hint warn" style="margin-top:10px">${esc(m.note)}</p>`:''}
    ${m.eol?'<p class="hint bad" style="margin-top:10px">Modelo descontinuado (EOL) — no usar en diseños nuevos.</p>':''}
    ${m.legacy?'<p class="hint warn" style="margin-top:10px">Línea anterior — solo para reemplazo de equipos ya instalados.</p>':''}
    </section>`;

  html+=`<section class="panel"><h2>Licencia y soporte</h2><ul class="clean">
    ${isChr
      ?`<li class="on"><b>Licencia CHR ${esc(m.id.replace('CHR ',''))}</b><span class="req">Requerida</span><span class="sku">Es la línea del equipo. Tope de ${fmt(m.fwd)} de subida por interfaz; sin topes de túneles. Dimensionar vCPU y RAM del hipervisor aparte.</span></li>`
      :`<li class="on"><b>RouterOS ${esc(lvlTxt(m))} — perpetua</b><span class="req">Incluida</span><span class="sku">Embebida en el hardware, sin costo recurrente. ${esc(lic.d||'')}</span></li>`}
    <li><b>CAPsMAN</b><span class="req opt">Incluido</span><span class="sku">Controlador Wi-Fi centralizado, parte de RouterOS — sin licencia adicional.</span></li>
    <li><b>${esc(support?support.n:'')}</b><span class="req ${supCode==='sw-basic'?'opt':''}">Soporte</span><span class="sku">${esc(support?support.sla:'')} — ${esc(support?support.d:'')}</span></li>
    ${$('chkTraining').checked?`<li><b>${esc(SUPPORT.training.n)}</b><span class="req opt">Capacitación</span><span class="sku">${esc(SUPPORT.training.d)}</span></li>`:''}
  </ul></section>`;

  $('bomBody').innerHTML=html;

  // Filas del BOM en el formato compartido de /js/bom.js. Las opticas multiplican por la
  // cantidad de routers: cada equipo necesita las suyas. La licencia embebida y el soporte de
  // comunidad valen 0, que es su precio de verdad; el contrato con partner y la capacitacion
  // no tienen precio publicado y salen «sin cotizar».
  const filas=[
    {cat:'Equipo', desc:m.id, sku:null, qty, unit:m.elpN!=null?m.elpN:null,
     nota:`${m.seg} · ${m.ports}${m.eol?' · DESCONTINUADO':''}${m.legacy?' · línea anterior':''}`},
  ];
  optics.forEach(o=>filas.push({cat:'Ópticas y cables', desc:o.optic.sku, sku:o.optic.sku,
    qty:o.qty*qty, unit:o.optic.price, nota:o.optic.d}));
  if(apQty&&ap) filas.push({cat:'Puntos de acceso', desc:ap.sku, sku:ap.hwModel||null,
    qty:apQty, unit:ap.price, nota:ap.d});
  filas.push({cat:'Licencia', desc:isChr?`Licencia CHR ${m.id.replace('CHR ','')}`:`RouterOS ${lvlTxt(m)} — perpetua`,
    sku:null, qty, unit:0,
    nota:isChr?`Incluida en la línea del equipo. Tope de ${fmt(m.fwd)} de subida por interfaz.`
              :`Incluida en el hardware, sin costo recurrente. ${lic.d||''}`});
  filas.push({cat:'Soporte', desc:support?support.n:'', sku:null, qty:null, unit:supCode==='sw-basic'?0:null,
    nota:support?support.sla:''});
  if($('chkTraining').checked) filas.push({cat:'Capacitación', desc:SUPPORT.training.n, sku:null, qty:null, unit:null,
    nota:SUPPORT.training.d});

  const meta={
    titulo:`Lista de materiales — ${m.id}`,
    subtitulo:`${m.seg} · RouterOS v7 · licencia ${lvlTxt(m)}`,
    archivo:`BOM_${m.id}`,
    notas:[
      '',
      'ESPECIFICACIONES (tabla de pruebas de la ficha oficial, Mbps agregados «all port»)',
      `  Ruteo fast path 1518 B:          ${fmt(m.fwd)}`,
      `  Ruteo con 25 reglas de filtro:   ${fmt(m.fw)} (1518 B)`,
      `  IPsec 1 tunel AES-128 1400 B:    ${fmt(m.ipsec)}`,
      `  CPU / RAM:                       ${m.cpu||'—'}${m.cores?' · '+m.cores+' nucleos':''} / ${ramTxt(m)}`,
      m.url?`  Ficha oficial:                   ${m.url}`:null,
      '',
      'NOTAS DE PREVENTA',
      '  Precio = «Suggested price» de la ficha (USD), sin impuestos, aranceles ni descuento de canal.',
      '  MikroTik no publica price list regional firmado: confirmar con distribuidor autorizado.',
      '  La cifra de fast path no incluye firewall ni colas: el dimensionador usa la fila que pide el escenario.',
      '  El nivel de licencia viene grabado en el hardware y no se puede subir por software.',
    ].filter(n=>n!==null),
  };
  const v=VISTAS&&VISTAS[m.id];
  if(v&&v.front) meta.fotos={modelo:m.id, origen:'De la galería oficial de la ficha de producto en mikrotik.com', front:v.front, rear:v.rear||null,
    pie:[v.tamano,v.fuente].filter(Boolean).join(' · ')};
  const d=dtoActual();
  if(d>0){ meta.dto=d; meta.dtoEtq=DTO.etiqueta(); }

  $('bomTabla').innerHTML=BOM.renderTabla(filas,{dto:d});
  $('bomOut').value=BOM.comoTexto(filas,meta);
  bomFilas=filas; bomMeta=meta;
  pintarTco(filas);
}

function renderLicTables(){
  const porNivel={};
  MODELS.forEach(m=>{(porNivel[m.lvl]=porNivel[m.lvl]||[]).push(m.id);});
  $('lvlTable').innerHTML=Object.entries(SIZING.licenseLevels).map(([lvl,v])=>`<tr>
    <td><b>${lvl==='chr'?'CHR':'Nivel '+lvl}</b></td>
    <td class="n">${tope(v.ppp)}</td><td class="n">${tope(v.ovpn)}</td><td class="n">${tope(v.hotspot)}</td>
    <td>${(porNivel[lvl]||[]).map(esc).join(', ')||'—'}</td></tr>`).join('');

  $('chrTable').innerHTML=MODELS.filter(m=>m.ser==='CHR')
    .sort((a,b)=>a.fwd-b.fwd)
    .map(m=>`<tr><td><b>${esc(m.id)}</b></td><td class="n">${fmt(m.fwd)}</td><td class="n">${m.elp?esc(m.elp):'—'}</td></tr>`).join('');

  $('supportTable').innerHTML=Object.entries(SUPPORT).filter(([c])=>c!=='training')
    .map(([,t])=>`<tr><td><b>${esc(t.n)}</b></td><td class="n">${esc(t.sla)}</td><td>${esc(t.d||'')}</td></tr>`).join('');
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

/* ── PERFILES MULTI-SEDE ────────────────────────────────────────────────────────────────
   Misma clave compartida que los demas fabricantes (`BOM.perfiles`): un despliegue real mezcla
   marcas. Cargar es de MikroTik (los campos son ids de ESTA pagina); consolidar no. Todo se
   multiplica por sedes: MikroTik vende por equipo, sin pools ni licencias por despliegue. */
const CAMPOS_PERFIL=['bw','unit','head','dirMult','sedes','conc','firewall','cifrado','chkVirtual','chkQos','chkL3hw',
  'chkBgp','bgpFeeds','chkPppoe','pppoeSess','ovpnTun','hotspotUsers','chkCapsman','apCount','apModel','chkPoe','chkHa',
  'qty','supportTier','chkTraining','bomApModel','bomApQty'];
const SEGS_PERFIL=['profileSeg','mediaSeg','modoSeg','tramaSeg'];
function capturarCampos(){
  const v={};
  CAMPOS_PERFIL.forEach(id=>{const n=$(id); if(n) v[id]=n.type==='checkbox'?n.checked:n.value;});
  SEGS_PERFIL.forEach(id=>{const a=$(id).querySelector('[aria-pressed="true"]'); v[id]=a?a.dataset.v:null;});
  return v;
}
function aplicarCampos(v){
  CAMPOS_PERFIL.forEach(id=>{
    const n=$(id);
    if(!n||v[id]==null) return;
    if(n.type==='checkbox'){ n.checked=!!v[id]; n.dispatchEvent(new Event('change')); } else n.value=v[id];
  });
  // Los grupos .seg guardan su valor en una variable de la pagina: solo su manejador la actualiza.
  SEGS_PERFIL.forEach(id=>{const b=v[id]!=null&&$(id).querySelector(`[data-v="${v[id]}"]`); if(b) b.click();});
  render(); renderBom();
}
function pintarPerfiles(){
  const l=BOM.perfilesDe(VENDOR);
  $('listaPerfiles').innerHTML=l.length
    ? '<table class="tco-tabla"><thead><tr><th>Perfil</th><th>Sedes</th><th>Modelo</th><th>Guardado</th><th></th></tr></thead><tbody>'
      +l.map(x=>`<tr><td><b>${esc(x.nombre)}</b></td><td>${x.sedes}</td><td>${esc(x.modelo)}</td><td>${esc(x.fecha||'—')}</td>`
        +`<td><button type="button" class="btn ghost" data-perfil-cargar="${esc(x.id)}">Cargar</button> `
        +`<button type="button" class="btn ghost" data-perfil-borrar="${esc(x.id)}">Eliminar</button></td></tr>`).join('')
      +'</tbody></table>'
    : '<p class="hint">Sin perfiles guardados todavía.</p>';
  const hay=BOM.perfiles().length>0;
  $('btnConsolidar').disabled=!hay;
  $('btnConsolidar').title=hay?'':'Guarda al menos un perfil de sede para consolidar el BOM global.';
}
$('btnGuardarPerfil').addEventListener('click',()=>{
  const nombre=$('nombrePerfil').value.trim();
  const sedes=Math.max(0,parseInt($('perfilSedes').value,10)||0);
  if(!nombre||!sedes){ $('perfilMsg').textContent='Pon un nombre y el número de sedes idénticas.'; $('nombrePerfil').focus(); return; }
  if(!bomFilas.length||!hayCandidato){ $('perfilMsg').textContent='No hay un equipo dimensionado que guardar: ajusta el escenario primero.'; return; }
  BOM.guardarPerfil({nombre, sedes, modelo:$('pickModel').value, vendor:VENDOR, fecha:new Date().toISOString().slice(0,10),
    version:1, campos:capturarCampos(), filas:JSON.parse(JSON.stringify(bomFilas))});
  $('nombrePerfil').value=''; $('perfilSedes').value='';
  $('perfilMsg').textContent=`Perfil «${nombre}» guardado con ${sedes} sede(s).`;
  pintarPerfiles();
});
$('listaPerfiles').addEventListener('click',e=>{
  const b=e.target.closest('button');
  if(!b) return;
  if(b.dataset.perfilCargar!=null){
    const x=BOM.perfilesDe(VENDOR).find(y=>y.id===b.dataset.perfilCargar);
    if(x&&x.campos) aplicarCampos(x.campos);
  } else if(b.dataset.perfilBorrar!=null){
    BOM.quitarPerfil(b.dataset.perfilBorrar);
    pintarPerfiles();
  }
});
function consolidarPerfiles(){
  const l=BOM.perfiles();
  const {filas, totalSedes, fabricantes}=BOM.consolidar(l,{agregadas:[], unicas:[]});
  const multi=fabricantes.length>1;
  const meta={
    titulo:`BOM global consolidado — ${l.length} perfil(es), ${totalSedes} sedes`,
    subtitulo:l.map(x=>`${x.nombre} ×${x.sedes} (${x.modelo})`).join(' · '),
    archivo:multi?'BOM_global_multifabricante':'BOM_global_mikrotik',
    sinRefs:true,
    notas:['REGLAS DE CONSOLIDACION (MikroTik):',
      '  Equipo, opticas, AP y soporte: cantidad del perfil x sedes del perfil.',
      '  Precios: «Suggested price» de cada ficha de mikrotik.com, sin descuento de canal ni impuestos.'],
  };
  if(multi) meta.notas.push(`  MULTI-FABRICANTE: ${fabricantes.join(', ')}.`);
  const d=dtoActual();
  if(d>0){ meta.dto=d; meta.dtoEtq=DTO.etiqueta(); }
  return {filas, meta, totalSedes, fabricantes};
}
$('btnConsolidar').addEventListener('click',()=>{
  const {filas, meta, totalSedes, fabricantes}=consolidarPerfiles();
  if(!totalSedes) return;
  $('consolidadoSub').textContent=`${meta.subtitulo} — ${totalSedes} sedes en total`;
  $('consolidadoTabla').innerHTML=(fabricantes.length>1?`<p class="bom-aviso">Consolidado <b>multi-fabricante</b> (${esc(fabricantes.join(', '))}).</p>`:'')
    +BOM.renderTabla(filas,{dto:dtoActual(), sinRefs:true});
  $('modalConsolidado').hidden=false;
  $('xlsConsolidadoBtn').onclick=()=>BOM.exportarExcel(filas,meta);
  $('consolidadoCerrar').focus();
});
$('consolidadoCerrar').addEventListener('click',()=>{ $('modalConsolidado').hidden=true; $('btnConsolidar').focus(); });
$('modalConsolidado').addEventListener('click',e=>{ if(e.target===$('modalConsolidado')) $('modalConsolidado').hidden=true; });

// Memoria tecnica: Markdown con el resumen, la memoria de calculo (la celda de la ficha que
// dimensiona y los supuestos declarados como tales) y el BOM. El contenido lo arma el motor.
$('memoriaBtn').addEventListener('click',()=>{
  if(!ultimaEval) return;
  const m=MODELS.find(x=>x.id===$('pickModel').value)||(ultimaEval.pick&&ultimaEval.pick.m)||null;
  const md=M.memoria(ultimaEval,{m, filas:bomFilas, bgpRam:SIZING.bgpRam, fecha:new Date().toISOString().slice(0,10)});
  const url=URL.createObjectURL(new Blob([md],{type:'text/markdown;charset=utf-8'}));
  const a=document.createElement('a');
  a.href=url; a.download=`Memoria_tecnica_${m?m.id:'mikrotik'}.md`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
});

(async function initApp(){
  const res=await fetch('/api/dimensionador/mikrotik');
  const data=await res.json();
  // Pendiente 34: el respaldo de ciclo de vida de ESTE fabricante, tal como lo declara
  // `legacyData/fuentes.js` con sus `campos`. Sin el, la ficha dice «el catalogo no trae el
  // ciclo de vida» en vez de afirmar vigencia por omision.
  FICHA.fijarCicloVida(data.cicloVida);
  MODELS=data.models; OPTICS=data.optics; OPTIC_LABEL=data.opticLabel;
  APS=data.accessPoints; SUPPORT=data.support; SIZING=data.sizing;
  // Sin el mapa la pagina funciona igual: la ficha declara que no hay figura, nunca inventa una.
  try {
    const rv=await fetch('/data/mikrotik-vistas-equipos.json');
    if(rv.ok) VISTAS=await rv.json();
  } catch { VISTAS=null; }

  populateSelects();
  renderLicTables();
  render();
  renderBom();
  renderCatalogo();
  pintarPerfiles();
  PROCEDENCIA.registrarModelos(VENDOR, () => MODELS.map(m => ({ model: m.id, ...m })));
})();

/* Enlace de eventos movido desde onclick= en el HTML, para permitir una CSP con
   script-src 'self' que bloquea todo codigo en linea. */
document.addEventListener('click', (e) => {
  const abrir = e.target.closest('[data-abrir]');
  if (abrir) { window.open(abrir.dataset.abrir, '_blank'); return; }
  const id = e.target.closest('button,[id]')?.id;
  if (id === 'btnImprimir') window.print();
});

/* ══ ESTADO ENLAZABLE Y PERSISTENTE ══
   El escenario viaja en la URL (ver /js/estado.js). Lo que va dentro de [data-inactivo] (el
   hub en un sitio, el cifrado fuera de IPsec) no viaja. */
document.addEventListener('DOMContentLoaded', () => {
  const st = ESTADO.vincular({ campos: ['bw','unit','head','dirMult','sedes','conc','firewall','cifrado','chkVirtual','chkQos','chkL3hw',
    'chkBgp','bgpFeeds','chkPppoe','pppoeSess','ovpnTun','hotspotUsers','chkCapsman','apCount','chkPoe','chkHa',
    'mediaSeg','profileSeg','modoSeg','tramaSeg','verdict-sel','aniosTco','plazoMrr','margenFin','feeMsp'] });
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
