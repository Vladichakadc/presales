/* ════════ CATÁLOGO DE COMPONENTES ════════
   sku = designación oficial de Huawei · bom = código de 8 dígitos verificado, o null */
let OPTICS = {};
let OPTIC_LABEL = {};
let PARTS = {};
let MODELS = [];

const PROFILE = HuaweiMotor.PROFILE;
let ultimaEval = null;
const licensesFor = (pick, c) => HuaweiMotor.licencias(pick, c);
let HICARE = {};

const $ = id => document.getElementById(id);
// Plazo de suscripciones y soporte (1, 3 o 5 anos), del selector #anios.
const aniosSel = () => Math.max(1, parseInt($('anios').value, 10) || 1);
let dirMult = 2, mode = 'link', lastPick = null;
// Plataforma elegida ANTES que el caudal (etapa H3): ar | a800 | ne8000.
let plataforma = 'ar';
// Si el dimensionamiento se quedo sin candidato, el BOM tiene que DECIRLO.
let hayCandidato = true;
let bomFilas = [], bomMeta = {};

/* ---- tabs ---- */
document.querySelectorAll('.tabs button').forEach(b => b.addEventListener('click', () => {
  document.querySelectorAll('.tabs button').forEach(x => x.setAttribute('aria-selected', x === b));
  ['calc','bom','optics','cat','src'].forEach(t => $('pane-' + t).hidden = (t !== b.dataset.tab));
}));

// Rotulos que dependen de la plataforma y del modo: el mismo numero significa cosas distintas
// en un AR de sucursal (enlace contratado) y en un NE8000 (trafico que conmuta el nodo).
const PLAT_HINT = {
  ar:'Router empresarial y SD-WAN: se dimensiona por throughput de servicio IMIX de la capa que pida el tráfico.',
  a800:'Acceso de operador (CPE y cell site): se dimensiona por capacidad de conmutación y Mpps. SD-WAN, UTM y WAC no aplican.',
  ne8000:'Agregación y núcleo IP/MPLS: se dimensiona por capacidad de conmutación y Mpps. El techo real lo fijan las tarjetas de línea.',
};
function rotular(){
  const transporte = plataforma !== 'ar';
  $('aggBlock').classList.toggle('hidden', mode !== 'agg');
  $('bwLabel').textContent = mode === 'agg' ? 'Ancho de banda por sede' : transporte ? 'Tráfico que debe conmutar el nodo' : 'Ancho de banda contratado';
  $('modeHint').textContent = mode === 'agg'
    ? (transporte ? 'Suma el tráfico de las sedes que agrega este nodo, aplicando simultaneidad.' : 'Suma los enlaces de todas las sucursales que terminan en este equipo, aplicando simultaneidad.')
    : transporte ? 'Tráfico total del nodo. Se contrasta contra capacidad de conmutación y Mpps.' : 'Un solo enlace WAN terminando en el equipo.';
  $('platHint').textContent = PLAT_HINT[plataforma];
  // Lo que no aplica a la plataforma se oculta y se marca `data-inactivo`: conserva su valor,
  // sale del calculo (el motor lo normaliza) y estado.js no lo pone en el enlace.
  const ar = $('grpAr'), tr = $('grpTransporte');
  ar.hidden = transporte; tr.hidden = !transporte;
  if(transporte){ ar.setAttribute('data-inactivo', '1'); tr.removeAttribute('data-inactivo'); }
  else { tr.setAttribute('data-inactivo', '1'); ar.removeAttribute('data-inactivo'); }
  $('serviciosHint').hidden = !transporte;
}
$('platSeg').addEventListener('click', e => {
  const b = e.target.closest('button'); if(!b) return;
  [...$('platSeg').children].forEach(x => x.setAttribute('aria-pressed', x === b));
  plataforma = b.dataset.v;
  rotular();
  render();
});
$('modeSeg').addEventListener('click', e => {
  const b = e.target.closest('button'); if(!b) return;
  [...$('modeSeg').children].forEach(x => x.setAttribute('aria-pressed', x === b));
  mode = b.dataset.v;
  rotular();
  render();
});
$('dirSeg').addEventListener('click', e => {
  const b = e.target.closest('button'); if(!b) return;
  [...$('dirSeg').children].forEach(x => x.setAttribute('aria-pressed', x === b));
  dirMult = +b.dataset.v; render();
});
['bw','unit','sites','conc','head','frame','profile','lan','aps','sSdwan','sUtm','sSlice','rPoe','rWan','rWifi','crit','onsite','remote','chkHa','anios']
  .forEach(id => $(id).addEventListener('input', render));
['pickModel','qty'].forEach(id => $(id).addEventListener('input', renderBom));

const fmt = HuaweiMotor.fmt;
const esc = s => String(s).replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));

// Catálogo Huawei, con las mismas dos tablas que antes vivían en la vista de Huawei del
// portal (ver CLAUDE.md, 2026-09-10): se pintan desde MODELS, ya cargado para el propio
// dimensionador — los 40 modelos traen `cls` ('AR' o 'WAN'), así que un solo fetch cubre
// las dos tablas que el portal mostraba por separado.
function renderCatalogo(){
  const tbodyAr = document.querySelector('#tbl-hw-ar-cat tbody');
  const tbodyWan = document.querySelector('#tbl-hw-wan-cat tbody');
  if (!tbodyAr || !tbodyWan) return;
  const marca = m => {
    const r = FICHA.rango(m);
    return r === 2 ? ' <span class="pillc" style="color:var(--red-txt,var(--red))">Fuera de venta</span>'
      : r === 1 ? ' <span class="pillc">Línea anterior</span>' : '';
  };
  tbodyAr.innerHTML = MODELS.filter(m => m.cls === 'AR').map(m => `<tr>
    <td><code>${esc(m.id)}</code>${marca(m)}</td><td>${esc(m.ser)}</td><td>${esc(m.fam)}</td>
    <td class="n">${fmt(m.fwd)}</td><td class="n">${m.ipsec ? fmt(m.ipsec) : '—'}</td>
    <td class="n">${m.lan ?? '—'}</td><td>${esc(m.ports)}</td>
  </tr>`).join('');
  tbodyWan.innerHTML = MODELS.filter(m => m.cls === 'WAN').map(m => `<tr>
    <td><code>${esc(m.id)}</code>${marca(m)}</td><td>${esc(m.ser)}</td><td>${esc(m.fam)}</td>
    <td class="n">${fmt(m.cap)}</td><td class="n">${m.mpps ?? '—'}</td><td>${esc(m.ports)}</td>
  </tr>`).join('');
}

const bomTag = arr => (arr && arr.length)
  ? arr.map(b => `<code>${b}</code>`).join(' ')
  : `<code class="pend">por confirmar</code>`;

/* ════════ CALCULADORA ════════ */
function render(){
  const conc = +$('conc').value; $('concVal').textContent = conc + ' %';
  const head = +$('head').value; $('headVal').textContent = head + ' %';
  // Toda la decision sale de HuaweiMotor.evaluar (js/huawei-motor.js): la pagina y el BOM
  // consumen el MISMO resultado en vez de releer el formulario cada uno por su lado.
  const ev = HuaweiMotor.evaluar({
    bw:$('bw').value, unit:$('unit').value, mode, sites:$('sites').value, conc, head, dirMult,
    frame:$('frame').value, profile:$('profile').value, lan:$('lan').value, aps:$('aps').value,
    svc:{sdwan:$('sSdwan').checked, utm:$('sUtm').checked, slice:$('sSlice').checked},
    want:{poe:$('rPoe').checked, wan:$('rWan').checked, wifi:$('rWifi').checked},
    ha:$('chkHa').checked, crit:$('crit').value, plataforma,
  }, MODELS, {rango:FICHA.rango, recomendable:FICHA.recomendable});
  ultimaEval = ev;
  const {raw, base, need, needMpps, frame, pk, aps, svc, wanOk, rows, fit, pick, next} = ev;
  const sites = ev.sites;
  $('avisosMotor').innerHTML = ev.avisos.map(a => `<p class="hint warn">${esc(a)}</p>`).join('');

  drawLadder(need, pick, pk);

  // ── Presentacion ──────────────────────────────────────────────────────────
  // El veredicto pasa a ser un desplegable con todos los que cumplen; licencias, soporte
  // y BOM siguen al equipo ELEGIDO. Ver /js/ficha.js.
  const ctx = {need, needMpps, raw, base, head, conc, sites, frame, pk, rows, wanOk, plataforma:ev.plataforma};
  const licCtx = {need, aps, svc, pk, anios:aniosSel()};
  if(!raw || !fit.length || !pick){
    // Sin ancho de banda no hay recomendación (regla de preventa 2026-09-13): ni veredicto
    // ni licencias ni soporte ni escalera se pintan con un equipo — todo queda en estado
    // vacío hasta que el usuario ingrese valores.
    drawVerdict(raw ? pick : null, next, ctx);
    drawLicenses(raw ? pick : null, licCtx);
    drawSupport(raw ? pick : null);
    if(!raw){
      drawLadder(need, null, pk);
      $('need').style.left='0%'; $('needLbl').textContent='—';
    }
  } else {
    // Se adjunta la capacidad calculada al modelo para que la ficha no recalcule nada.
    const candidatos = fit.map(r => Object.assign({}, r.m, {__cap:r.cap, __isWan:r.isWan}));
    const filaDe = id => fit.find(r => r.m.id === id) || pick;
    const pintarDependientes = m => {
      const r = filaDe(m.id);
      drawLicenses(r, licCtx);
      drawSupport(r);
      drawLadder(need, r, pk);
    };
    const elegidoId = FICHA.render({vendor:'huawei', 
      contenedor:'verdict',
      candidatos,
      recomendado: pick.m.id,
      etiqueta: m => `${m.id} — serie ${m.ser} · ${fmt(m.__cap)}`,
      titulo: m => m.id,
      subtitulo: m => `${m.fam} · serie ${m.ser}`,
      medidores: m => medidoresHuawei(m, ctx),
      porQue: m => porQueHuawei(m, ctx, next),
      secciones: m => seccionesHuawei(m, licCtx),
      alCambiar: id => {
        const m = candidatos.find(x => x.id === id);
        if(!m) return;
        pintarDependientes(m);
        llevarABom(id);
      },
    });
    const elegido = candidatos.find(m => m.id === elegidoId) || candidatos[0];
    pintarDependientes(elegido);
  }
  $('tbody').innerHTML = rows.map(r => {
    const sel = raw > 0 && pick && pick.m.id === r.m.id;
    return `<tr class="${sel ? 'sel' : ''}"><td>${r.m.id}</td><td><span class="pillc">${r.m.ser}</span></td>
      <td class="n">${fmt(r.isWan ? r.m.cap : r.m[pk])}</td><td class="n">${r.m.mpps != null ? r.m.mpps + ' Mpps' : '—'}</td>
      <td class="n">${r.m.lan || '—'}</td><td>${r.miss.length ? `<span style="color:var(--steel)">${r.miss[0]}</span>` : `<span style="color:var(--green);font-weight:600">Cumple</span>`}</td></tr>`;
  }).join('');

  hayCandidato = !!pick;
  llevarABom(pick ? pick.m.id : null);
}

// El equipo del dimensionamiento se lleva solo al BOM. La regla vive en js/bom.js —
// `BOM.sincronizar` distingue lo heredado de lo elegido a mano y repinta siempre.
function llevarABom(id){
  if(id) lastPick = id;
  BOM.sincronizar({elegido:id||null, render:renderBom});
}

/* ── Ficha del equipo elegido ───────────────────────────────────────────────
   Las tres funciones alimentan /js/ficha.js: medidores de holgura, el razonamiento del
   dimensionamiento y la ficha completa con licenciamiento, software y soporte. */
function medidoresHuawei(m, c){
  const cap = m.__cap, use = Math.min(100, c.need / cap * 100);
  const metric = m.__isWan ? 'Capacidad de conmutación' : PROFILE[c.pk];
  const out = [{etq:metric, val:c.need, tope:cap, txt:`${use.toFixed(0)} % de ${fmt(cap)}`}];
  if(m.mpps != null) out.push({etq:`Reenvío a ${c.frame} bytes`, val:c.needMpps, tope:m.mpps,
    txt:`${Math.min(100, c.needMpps / m.mpps * 100).toFixed(0)} % de ${m.mpps} Mpps`});
  return out;
}

function porQueHuawei(m, c, next){
  const cap = m.__cap, use = Math.min(100, c.need / cap * 100);
  const metric = m.__isWan ? 'Capacidad de conmutación' : PROFILE[c.pk];
  const usePps = (m.mpps != null) ? Math.min(100, c.needMpps / m.mpps * 100) : null;
  return `<b>Cómo se llegó a ${fmt(c.need)}</b><ul>
      ${mode === 'agg' ? `<li>${c.sites} sedes x ${fmt(c.raw)} x ${c.conc} % de simultaneidad = <b>${fmt(c.base)}</b> agregados.</li>` : `<li>Caudal base: <b>${fmt(c.raw)}</b>.</li>`}
      ${dirMult === 2 ? `<li>Medido por dirección, se dimensiona contra la suma bidireccional: <b>${fmt(c.base*2)}</b>.</li>` : `<li>Tomado como total agregado, sin duplicar.</li>`}
      <li>Más ${c.head} % de margen: <b>${fmt(c.need)}</b> · <b>${c.needMpps.toFixed(2)} Mpps</b>.</li>
      <li>${m.id} publica <b>${fmt(cap)}</b> en ${metric.toLowerCase()}.</li>
      <li>${m.ports}</li>
      ${next ? `<li>Siguiente escalón: <b>${next.m.id}</b> con ${fmt(next.cap)}.</li>` : ''}
      ${use > 85 ? `<li class="warn"><b>Atención:</b> sobre el 85 % de ocupación. Sube el margen o pasa al siguiente modelo.</li>` : ''}
      ${usePps != null && usePps > 85 ? `<li class="warn"><b>Atención:</b> el cuello de botella son los paquetes por segundo, no los bits.</li>` : ''}
      ${m.__isWan ? `<li class="warn">La capacidad de conmutación es del sistema completo. El techo real lo fija la tarjeta de línea y la densidad de puertos.</li>` : ''}
    </ul>`;
}

function seccionesHuawei(m, c){
  const fila = {m, cap:m.__cap, isWan:m.__isWan};
  const lic = licensesFor(fila, c).map(x => [x.t, x.d, true]);
  const {s} = supportFor();
  const caract = [
    ['Serie', m.ser],
    ['Familia', m.fam],
    ['Capacidad en el perfil', fmt(m.__cap)],
  ];
  if(m.mpps != null) caract.push(['Reenvío', m.mpps + ' Mpps']);
  if(m.boost) caract.push(['Con licencia Boost', `${fmt(m.boost)} sin licencia → ${fmt(m.fwd)} con ella`]);
  if(!m.__isWan){
    caract.push(['Puertos LAN', m.lan || '—']);
    caract.push(['PoE', m.poe ? 'Sí' : 'No']);
    caract.push(['4G / 5G integrado', m.wan ? 'Sí' : 'No']);
    caract.push(['Wi-Fi', m.wifi ? 'Sí' : 'No']);
    if(m.apsMax) caract.push(['APs gestionables', `${m.apsFree || 0} incluidos · hasta ${m.apsMax}`]);
  }
  caract.push(['Puertos', m.ports, true]);
  if(m.elp) caract.push(['Precio de lista ref.', m.elp]);
  return [
    {titulo:'Características del equipo', filas:caract},
    FICHA.seccionPuertos(m),
    FICHA.seccionAlimentacion(m),
    {titulo:'Licenciamiento propuesto', filas:lic,
     nota:'Todas las licencias se emiten contra el ESN del equipo y se descargan del portal ESDP de Huawei.'},
    {titulo:'Software y gestión', filas:[
      ['iMaster NCE-WAN', 'Controlador y gestión del overlay SD-WAN, licenciado por nodo administrado', true],
      ['iMaster NCE-Campus', 'Automatización y O&M del campus y de los APs gestionados', true],
      ['eSight / NetEco', 'Gestión de red y monitorización de infraestructura', true],
    ]},
    {titulo:'Soporte', filas:[[s.n, s.sla]], nota:s.d},
  ];
}

const LO = 100, HI = 700000000;
const pos = v => Math.max(0, Math.min(100, (Math.log10(Math.max(v, LO)) - Math.log10(LO)) / (Math.log10(HI) - Math.log10(LO)) * 100));

function drawLadder(need, pick, pk){
  const t = $('track');
  t.querySelectorAll('.tick,.dot').forEach(n => n.remove());
  [[100,'100M'],[1000,'1G'],[10000,'10G'],[100000,'100G'],[1000000,'1T'],[10000000,'10T'],[100000000,'100T']].forEach(([v,l]) => {
    const d = document.createElement('div'); d.className = 'tick'; d.style.left = pos(v) + '%';
    d.innerHTML = `<i></i><b>${l}</b>`; t.appendChild(d);
  });
  MODELS.filter(HuaweiMotor.PLATAFORMAS[plataforma].de).forEach(m => {
    const c = m.cls === 'WAN' ? m.cap : m[pk]; if(c == null) return;
    const d = document.createElement('div');
    d.className = 'dot' + (m.cls === 'WAN' ? ' wan' : '') + (pick && pick.m.id === m.id ? ' pick' : (c >= need ? ' ok' : ''));
    d.style.left = pos(c) + '%'; d.title = `${m.id} — ${fmt(c)}`; t.appendChild(d);
  });
  const p = pos(need), n = $('need');
  n.style.left = p + '%'; n.classList.toggle('flip', p > 62);
  $('needLbl').textContent = 'Requiere ' + fmt(need);
  const lbl = $('pickLbl');
  if(pick){
    lbl.style.display = 'block'; lbl.textContent = pick.m.id;
    const lp = pos(pick.cap); lbl.style.left = lp + '%';
    lbl.style.transform = lp > 80 ? 'translateX(-90%)' : (lp < 12 ? 'translateX(-10%)' : 'translateX(-50%)');
  } else lbl.style.display = 'none';
}

function drawVerdict(pick, next, c){
  const v = $('verdict');
  if(!c.raw){ v.innerHTML = `<p class="tag">Sin datos</p><div class="model">Ingrese valores para recomendar un equipo</div><p class="family">Escriba el <b>ancho de banda</b> del sitio para que el dimensionador proponga los modelos que cumplen.</p>`; return; }
  if(!pick){
    const over = c.rows.every(r => r.cap == null || r.cap < c.need);
    const P = HuaweiMotor.PLATAFORMAS[c.plataforma] || {n:'la plataforma'};
    const mayor = c.rows.filter(r => r.cap != null).sort((a, b) => b.cap - a.cap)[0];
    v.innerHTML = `<p class="tag">Sin coincidencias</p><div class="model">${over ? 'Fuera de la plataforma' : 'Ajusta los filtros'}</div>
      <p class="family">${over ? `El requerimiento de ${fmt(c.need)} supera al mayor equipo de ${esc(P.n)}${mayor ? ` (${esc(mayor.m.id)}, ${fmt(mayor.cap)})` : ''}. ${c.plataforma === 'ne8000' ? 'A este nivel se resuelve con varios chasis en paralelo.' : 'Revisa si corresponde otra plataforma o repartir el tráfico entre varios equipos.'}`
      : `Ningún modelo de ${esc(P.n)} cumple capacidad y requisitos a la vez.`}</p>
      <div class="why"><b>Requerimiento:</b> ${fmt(c.need)} · ${c.needMpps.toFixed(2)} Mpps a ${c.frame} bytes.</div>`;
    return;
  }
  const m = pick.m, cap = pick.cap, use = Math.min(100, c.need / cap * 100);
  const cls = use > 85 ? 'tight' : (use < 55 ? 'good' : '');
  const usePps = (m.mpps != null) ? Math.min(100, c.needMpps / m.mpps * 100) : null;
  const ppsCls = usePps == null ? '' : (usePps > 85 ? 'tight' : (usePps < 55 ? 'good' : ''));
  const metric = pick.isWan ? 'Capacidad de conmutación' : PROFILE[c.pk];
  v.innerHTML = `
    <p class="tag">Modelo recomendado · serie ${m.ser}</p>
    <div class="model">${m.id}</div><p class="family">${m.fam}</p>
    <div class="meter"><b><span>${metric}</span><em>${use.toFixed(0)} % de ${fmt(cap)}</em></b><div class="bar"><i class="${cls}" style="width:${use}%"></i></div></div>
    ${usePps != null ? `<div class="meter"><b><span>Reenvío a ${c.frame} bytes</span><em>${usePps.toFixed(0)} % de ${m.mpps} Mpps</em></b><div class="bar"><i class="${ppsCls}" style="width:${usePps}%"></i></div></div>` : ''}
    <div class="why"><b>Cómo se llegó a ${fmt(c.need)}</b><ul>
      ${mode === 'agg' ? `<li>${c.sites} sedes x ${fmt(c.raw)} x ${c.conc} % de simultaneidad = <b>${fmt(c.base)}</b> agregados.</li>` : `<li>Caudal base: <b>${fmt(c.raw)}</b>.</li>`}
      ${dirMult === 2 ? `<li>Medido por dirección, se dimensiona contra la suma bidireccional: <b>${fmt(c.base*2)}</b>.</li>` : `<li>Tomado como total agregado, sin duplicar.</li>`}
      <li>Más ${c.head} % de margen: <b>${fmt(c.need)}</b> · <b>${c.needMpps.toFixed(2)} Mpps</b>.</li>
      <li>${m.id} publica <b>${fmt(cap)}</b> en ${metric.toLowerCase()}.</li>
      <li>${m.ports}</li>
      ${next ? `<li>Siguiente escalón: <b>${next.m.id}</b> con ${fmt(next.cap)}.</li>` : ''}
      ${use > 85 ? `<li class="warn"><b>Atención:</b> sobre el 85 % de ocupación. Sube el margen o pasa al siguiente modelo.</li>` : ''}
      ${usePps != null && usePps > 85 ? `<li class="warn"><b>Atención:</b> el cuello de botella son los paquetes por segundo, no los bits.</li>` : ''}
      ${pick.isWan ? `<li class="warn">La capacidad de conmutación es del sistema completo. El techo real lo fija la tarjeta de línea y la densidad de puertos.</li>` : ''}
    </ul></div>`;
}

function drawLicenses(pick, c){
  const ul = $('licList');
  if(!pick){ ul.innerHTML = '<li>Selecciona un escenario válido.</li>'; return; }
  ul.innerHTML = licensesFor(pick, c).map(x =>
    `<li class="${x.on ? 'on' : ''}"><b>${x.t}</b>${x.on ? '<span class="req">Requerida</span>' : '<span class="req opt">Nota</span>'}<span class="sku">${x.d}</span></li>`).join('');
}

function supportFor(){
  const crit = +$('crit').value, onsite = $('onsite').checked, remote = $('remote').checked;
  let key;
  if(crit >= 4) key = onsite ? 'onsitePre' : 'premier';
  else if(crit === 3) key = onsite ? 'onsiteStd' : 'premier';
  else if(crit === 2) key = onsite ? 'onsiteStd' : 'standard';
  else key = remote ? 'basic' : 'essential';
  if(remote && (key === 'essential' || key === 'basic') && crit >= 2) key = 'standard';
  return {key, s:HICARE[key], alt: key === 'premier' ? HICARE.standard : key === 'onsitePre' ? HICARE.premier : key === 'standard' ? HICARE.premier : HICARE.standard};
}
function drawSupport(pick){
  const box = $('supBox');
  if(!pick){ box.innerHTML = '<p style="font-size:13.5px;color:var(--steel)">Selecciona un escenario válido.</p>'; return; }
  const {s, alt} = supportFor();
  box.innerHTML = `
    <div class="model" style="font-size:26px;margin-bottom:2px">${s.n}</div>
    <p class="family" style="margin-bottom:14px"><span class="pillc">${s.sla}</span> · término ${aniosSel() * 12} meses · ${pick.m.id}</p>
    <p style="font-size:13.5px;margin:0 0 14px">${s.d}</p>
    <ul class="clean" style="font-size:13.5px">
      <li class="on"><b>Alternativa a evaluar:</b> ${alt.n} (${alt.sla})<span class="sku">Compara el diferencial contra el costo por hora de indisponibilidad del sitio.</span></li>
      <li><b>Qué no cubre la garantía estándar</b><span class="sku">Reemplaza hardware defectuoso, pero Huawei gestiona el RMA sin asistencia de troubleshooting, configuración ni instalación.</span></li>
      <li><b>Alinea las fechas</b><span class="sku">Haz coincidir Hi-Care, SnS, suscripción NCE y bases de firmas en la misma fecha de inicio.</span></li>
      <li><b>Co-Care como opción de canal</b><span class="sku">Si tu organización entrega el primer nivel, Co-Care traslada nivel 1 y 2 al partner con respaldo de Huawei detrás.</span></li>
    </ul>`;
}

/* ════════ BOM ════════ */
function populatePickModel(){
  // Orden determinista por capacidad (fwd; cap en la serie WAN): la API puede servir el
  // catalogo en cualquier orden y el combo no puede depender de eso. Series por su modelo
  // de entrada; dentro de cada serie, de menor a mayor.
  $('pickModel').innerHTML = (() => {
    const capDe = m => m.fwd || m.cap || 0;
    const groups = {};
    MODELS.forEach(m => { (groups[m.ser] = groups[m.ser] || []).push(m); });
    const ordenadas = Object.entries(groups);
    for (const [, arr] of ordenadas) arr.sort((a, b) => capDe(a) - capDe(b));
    ordenadas.sort((a, b) => Math.min(...a[1].map(capDe)) - Math.min(...b[1].map(capDe)));
    return ordenadas.map(([g, arr]) =>
      `<optgroup label="${g}">${arr.map(m => `<option value="${m.id}">${m.id} — ${m.fam}</option>`).join('')}</optgroup>`).join('');
  })();
}

/* ── CAPA COMERCIAL (bom.js) ──────────────────────────────────────────────────────────────
   El precio del EQUIPO sale del cotizador (`/api/cotizador/catalog`, fuente unica de precios),
   casado por nombre normalizado; no se copia a este catalogo. Es una estimacion de referencia
   sin descuentos ni impuestos, y lo dice cada fila. Licencias, suscripciones y soporte no
   tienen precio publicado: salen «consultar» y el TCO se declara parcial. */
let PRECIO_REF = {};
async function cargarPreciosRef(){
  try {
    const r = await fetch('/api/cotizador/catalog');
    if(!r.ok) return;
    const lista = await r.json();
    PRECIO_REF = {};
    (lista || []).filter(x => x.vendor === 'Huawei' && x.elpN > 0).forEach(x => { PRECIO_REF[BOM.normalizar(x.model)] = x.elpN; });
  } catch { /* sin precios de referencia: el BOM sigue, con el equipo en «consultar» */ }
}
const OPEX_HUAWEI = ['Soporte'];
const VENDOR = 'huawei';
const DTO = BOM.simuladorDescuento('cajaDescuento', () => renderBom());
const dtoActual = () => (DTO ? DTO.valor() : 0);
const dtoEtiqueta = () => (DTO ? DTO.etiqueta() : null);

function pintarTco(filas){
  const anios = aniosSel(), dto = dtoActual();
  const fin = BOM.tco(filas, {opex:OPEX_HUAWEI, anios});
  const hayPrecios = fin.capex > 0 || fin.opexTermino > 0;
  const net = v => (dto > 0 ? `<td><b>${BOM.money(v * (1 - dto))}</b></td>` : '');
  $('tcoFin').innerHTML = hayPrecios
    ? `<table class="tco-tabla"><thead><tr><th>Pie de la lista de materiales</th><th>Subtotal Lista</th>${dto > 0 ? '<th>Subtotal Neto</th>' : ''}</tr></thead><tbody>`
      + `<tr><td><b>CAPEX</b> — equipo y lo que no es recurrente</td><td>${BOM.money(fin.capex)}</td>${net(fin.capex)}</tr>`
      + `<tr><td><b>OPEX anual</b> — soporte ÷ ${anios} año${anios > 1 ? 's' : ''}</td><td>${BOM.money(fin.opexAnual)}</td>${net(fin.opexAnual)}</tr>`
      + `<tr><td><b>TCO a ${anios} año${anios > 1 ? 's' : ''}</b> (parcial)</td><td><b>${BOM.money(fin.tco)}</b></td>${net(fin.tco)}</tr></tbody></table>`
      + `<p class="hint" style="margin-top:8px"><b>TCO parcial:</b> ${fin.sinPrecio} línea(s) sin precio no entran en la suma. El neto es un simulador genérico de tramos partner, no el descuento real del distribuidor Huawei.</p>`
    : '<p class="hint">Sin precios suficientes para calcular el TCO: este equipo no tiene precio de referencia en el cotizador.</p>';
}


/* ── OPTICAS POR ENLACE: estado y constructor ─────────────────────────────────────────────
   El estado vive en #opticasData (JSON [{fam, sku, qty}]) para que viaje en el enlace
   compartido, como el `sfpPickData` de Aruba. El constructor se repinta solo cuando cambia
   el equipo o se anade/quita una fila; editar una celda no destruye el foco. */
let opticasModelo = null;
function leerOpticas(){
  try { const v = JSON.parse($('opticasData').value || '[]'); return Array.isArray(v) ? v : []; } catch { return []; }
}
function escribirOpticas(a){ $('opticasData').value = JSON.stringify(a); }
function pintarOpticasFilas(m){
  const filas = leerOpticas();
  const caja = $('opticasFilas');
  const firma = m.id + '|' + JSON.stringify(filas);
  if(opticasModelo === firma) return;
  opticasModelo = firma;
  const fams = m.optics || [];
  caja.innerHTML = filas.length ? filas.map((f, i) => {
    const ok = fams.includes(f.fam);
    return `<div class="row" data-optica="${i}" style="gap:8px;flex-wrap:wrap;margin-bottom:8px;align-items:center">
      <select data-campo="fam" aria-label="Familia de la óptica ${i + 1}">${[...new Set([...fams, f.fam])].map(k => `<option value="${esc(k)}"${k === f.fam ? ' selected' : ''}>${esc(OPTIC_LABEL[k] || k)}</option>`).join('')}</select>
      <select data-campo="sku" aria-label="Modelo de la óptica ${i + 1}">${(OPTICS[f.fam] || []).map(o => `<option value="${esc(o.sku)}"${o.sku === f.sku ? ' selected' : ''}>${esc(o.sku)} — ${esc(o.d)}</option>`).join('')}</select>
      <input type="number" data-campo="qty" min="1" step="1" value="${Number(f.qty) || 1}" style="width:80px" aria-label="Cantidad por equipo de la óptica ${i + 1}">
      <button type="button" class="btn ghost" data-quitar-optica="${i}" style="font-size:10px;padding:3px 8px">Quitar</button>
      ${ok ? '' : `<span class="warn" style="font-size:12px">${esc(m.id)} no lista esta familia</span>`}
    </div>`;
  }).join('') : '<p class="hint">Sin ópticas declaradas: el BOM no pide ninguna.</p>';
}
$('btnAddOptica').addEventListener('click', () => {
  const m = MODELS.find(x => x.id === $('pickModel').value) || MODELS[0];
  if(!m) return;
  const fam = (m.optics || [])[0];
  if(!fam){ return; }
  const filas = leerOpticas();
  filas.push({fam, sku:(OPTICS[fam] || [])[0].sku, qty:1});
  escribirOpticas(filas);
  renderBom();
});
$('opticasFilas').addEventListener('click', e => {
  const b = e.target.closest('[data-quitar-optica]');
  if(!b) return;
  const filas = leerOpticas();
  filas.splice(+b.dataset.quitarOptica, 1);
  escribirOpticas(filas);
  renderBom();
});
$('opticasFilas').addEventListener('change', e => {
  const fila = e.target.closest('[data-optica]');
  if(!fila) return;
  const filas = leerOpticas();
  const f = filas[+fila.dataset.optica];
  if(!f) return;
  const campo = e.target.dataset.campo;
  if(campo === 'fam'){ f.fam = e.target.value; f.sku = (OPTICS[f.fam] || [])[0].sku; }
  else if(campo === 'sku') f.sku = e.target.value;
  else if(campo === 'qty') f.qty = Math.max(1, parseInt(e.target.value, 10) || 1);
  escribirOpticas(filas);
  renderBom();
});

function renderBom(){
  const m = MODELS.find(x => x.id === $('pickModel').value) || MODELS[0];
  // Sin catálogo todavía no hay nada que pintar (MikroTik y Aruba ya lo guardaban): un enlace
  // compartido repone los .seg con un click que llega antes que el fetch, y aquí reventaba.
  if(!m) return;
  // Sitios x unidades por sitio: con HA 1+1 se cotizan dos equipos por sitio (motor: `unidades`).
  const qty = Math.max(1, parseInt($('qty').value) || 1) * (ultimaEval ? ultimaEval.unidades : 1);
  pintarOpticasFilas(m);
  const opt = HuaweiMotor.opticasBom(m, leerOpticas(), OPTICS);
  const isWan = m.cls === 'WAN';
  const pick = {m, isWan, cap: isWan ? m.cap : (m.typ ?? m.ipsec ?? m.fwd)};
  // H-08: la necesidad y la capa son las del escenario evaluado; con need:0 la licencia de
  // rendimiento (Boost) que el calculo exigia desaparecia del BOM y del Excel.
  const ev = ultimaEval;
  const lics = licensesFor(pick, {anios:aniosSel(), need:ev ? ev.need : 0, aps:ev ? ev.aps : 0,
    svc:ev ? ev.svc : {sdwan:false, utm:false, slice:false}, pk:ev ? ev.pk : $('profile').value});
  const {s} = supportFor();

  let html = `${BOM.avisoDesvio({elegido:FICHA.elegido('verdict'), enBom:m.id, hayCandidato})}<section class="panel">
    <h2>Ficha del equipo</h2>
    <div class="model" style="font-size:30px">${m.id}</div>
    <p class="family">${m.fam} · serie ${m.ser}</p>
    <div class="scroll"><table>
      <thead><tr><th>Concepto</th><th>Valor</th></tr></thead><tbody>
      <tr><td>Designación de pedido</td><td><code>${m.id}</code></td></tr>
      <tr><td>Código BOM del chasis</td><td>${bomTag(null)} <span style="color:var(--steel);font-size:11.5px">— obtener del configurador Huawei o del distribuidor</span></td></tr>
      <tr><td>${isWan ? 'Capacidad de conmutación' : 'Forwarding (NAT+ACL+QoS, IMIX)'}</td><td class="n">${fmt(isWan ? m.cap : m.fwd)}</td></tr>
      ${!isWan ? `<tr><td>IPsec (IMIX)</td><td class="n">${fmt(m.ipsec)}</td></tr><tr><td>SD-WAN típico (IMIX)</td><td class="n">${fmt(m.typ)}</td></tr>` : ''}
      ${m.mpps != null ? `<tr><td>Reenvío de paquetes</td><td class="n">${m.mpps} Mpps</td></tr>` : ''}
      <tr><td>Puertos y slots</td><td>${m.ports}</td></tr>
      ${!isWan && m.apsMax ? `<tr><td>Gestión de APs (WAC)</td><td class="n">${m.apsFree} gratuitos / ${m.apsMax} máximo</td></tr>` : ''}
    </tbody></table></div>
  </section>`;

  // Componentes de hardware: compatibles frente a lo que se pide (H-06)
  const piezas = HuaweiMotor.piezasBom(m, PARTS, ultimaEval || {want:{}});
  const fila = (p, estado) => `<tr><td><code>${esc(PARTS[p.codigo||p].sku)}</code></td><td>${bomTag(PARTS[p.codigo||p].bom)}</td><td>${esc(PARTS[p.codigo||p].d)}</td><td>${estado}</td></tr>`;
  const compat = [
    ...piezas.pedir.map(p => fila(p, 'Se pide' + ((p.qty||1) > 1 ? ` (x${p.qty})` : ''))),
    ...piezas.elegir.flatMap(g => g.opciones.map(k => fila(k, `Elegir una — ${g.nombre.toLowerCase()}`))),
    ...piezas.opcionales.map(p => fila(p, `Opcional: ${esc(p.motivo)}`)),
    ...piezas.noAplican.map(p => fila(p, `No aplica: ${esc(p.motivo)}`)),
  ];
  if(compat.length){
    html += `<section class="panel"><h2>Componentes de hardware</h2><div class="scroll"><table>
      <thead><tr><th>Designación</th><th>Código BOM</th><th>Descripción</th><th>En el BOM</th></tr></thead><tbody>
      ${compat.join('')}
    </tbody></table></div>
    <p class="hint">La lista es lo <b>compatible</b> con el chasis; el BOM solo pide lo marcado «Se pide» y deja una línea por cada alternativa a elegir. En equipos con esquema 1+1 o N+1 cotiza siempre el módulo de respaldo: es el componente que más falla en campo.</p></section>`;
  }

  // Ópticas
  html += `<section class="panel"><h2>Módulos ópticos compatibles</h2>`;
  if(opt.invalidas.length) html += `<p class="warn" style="font-size:12.5px">${opt.invalidas.map(i => esc(i.motivo)).join(' · ')}: esa fila no entra en el BOM hasta que la cambies.</p>`;
  (m.optics || []).forEach(k => {
    const n = opt.validas.filter(v => v.fam === k).reduce((t, v) => t + v.qty, 0);
    html += `<div class="grp"><h3>${OPTIC_LABEL[k]}</h3>
      <p class="gd">${n ? `Declaradas: <b>${n * qty}</b> módulos (${n} por equipo x ${qty}).` : 'Ninguna declarada para esta familia.'}</p>
      <div class="scroll"><table><thead><tr><th>Designación</th><th>Código BOM</th><th>Descripción</th></tr></thead><tbody>
      ${OPTICS[k].map(o => `<tr><td><code>${esc(o.sku)}</code></td><td>${bomTag(o.bom)}</td><td>${esc(o.d)}</td></tr>`).join('')}
      </tbody></table></div></div>`;
  });
  html += `<p class="hint">Los módulos bidireccionales (BIDI) se piden en pareja de códigos distintos, uno por extremo. Los puertos combo aceptan óptica o cobre, pero no ambos a la vez.</p></section>`;

  // Licencias
  html += `<section class="panel"><h2>Licencias y suscripciones</h2><ul class="clean">
    ${lics.map(x => `<li class="${x.on ? 'on':''}"><b>${x.t}</b>${x.on ? '<span class="req">Requerida</span>':'<span class="req opt">Nota</span>'}<span class="sku">${x.d}</span></li>`).join('')}
  </ul></section>`;

  // Soporte
  html += `<section class="panel"><h2>Servicio de soporte</h2><div class="scroll"><table>
    <thead><tr><th>Servicio</th><th>SLA</th><th>Término</th><th>Cantidad</th></tr></thead><tbody>
    <tr><td>${s.n}</td><td class="n">${s.sla}</td><td class="n">${aniosSel() * 12} meses</td><td class="n">${qty}</td></tr>
    <tr><td>SnS — Software Subscription and Support</td><td class="n">Actualizaciones de VRP</td><td class="n">${aniosSel() * 12} meses</td><td class="n">${qty}</td></tr>
  </tbody></table></div></section>`;

  $('bomBody').innerHTML = html;

  const filas = filasBom(m, qty, opt.validas, piezas, lics, s);
  const meta = metaBom(m);
  $('bomTabla').innerHTML = BOM.renderTabla(filas, {dto:dtoActual()});
  pintarTco(filas);
  $('bomOut').value = BOM.comoTexto(filas, meta);
  bomFilas = filas; bomMeta = meta;
  pintarPerfiles();
}

// Filas del BOM en el formato compartido de /js/bom.js. Huawei no publica precios de lista
// abiertos, asi que casi todas las lineas salen sin cotizar a proposito: el modulo compartido
// lo detecta y no finge un total.
function filasBom(m, qty, opticas, piezas, lics, s){
  const filas=[
    {cat:'Equipo', desc:m.id, sku:null, qty, unit:PRECIO_REF[BOM.normalizar(m.id)] ?? null,
      nota:`Serie ${m.ser} · ${m.fam} · ${m.ports}`+(PRECIO_REF[BOM.normalizar(m.id)] != null ? ' · Precio de referencia estimado del cotizador, sin descuentos ni impuestos.' : '')},
  ];
  // H-06: solo lo que se PIDE; lo que es una alternativa va en una sola linea «elegir una»
  // (sin codigo, marcada por confirmar) y lo condicional o de ampliacion no se cotiza solo.
  piezas.pedir.forEach(p=>{ const c=PARTS[p.codigo];
    filas.push({cat:'Componentes de hardware', desc:c.sku, sku:c.bom||null, qty:qty*(p.qty||1), unit:null, nota:c.d||''}); });
  piezas.elegir.forEach(g=>filas.push({cat:'Componentes de hardware', desc:`${g.nombre} — elegir una`, sku:null,
    qty:qty*g.qty, unit:null, nota:'Opciones: '+g.opciones.map(k=>PARTS[k].sku).join(' · ')}));
  // H-07: una linea por optica DECLARADA (familia, modelo, cantidad por equipo), con su codigo.
  opticas.forEach(v => filas.push({cat:'Ópticas', desc:`${OPTIC_LABEL[v.fam] || v.fam} — ${v.o.sku}`,
    sku:(v.o.bom && v.o.bom.length) ? v.o.bom.join(' / ') : null, qty:v.qty*qty, unit:null,
    nota:`${v.o.d || ''} · cada extremo del enlace necesita el suyo`}));
  // SnS ya sale en Soporte: dejarlo tambien como licencia lo cotizaba dos veces.
  lics.filter(l=>l.on && !/^SnS/.test(l.t)).forEach(l=>filas.push({cat:'Licencias', desc:l.t, sku:null, qty, unit:null, nota:l.d||''}));
  filas.push({cat:'Soporte', desc:s.n, sku:null, qty, unit:null, nota:`${s.sla} · ${aniosSel() * 12} meses`});
  filas.push({cat:'Soporte', desc:'SnS — Software Subscription and Support', sku:null, qty, unit:null,
    nota:'Actualizaciones y parches de VRP. Va separada del paquete de hardware. '+(aniosSel() * 12)+' meses.'});
  return filas;
}

function metaBom(m){
  const d = dtoActual();
  return {
    ...(d > 0 ? {dto:d, dtoEtq:dtoEtiqueta()} : {}),
    titulo:`Lista de materiales — ${m.id}`,
    subtitulo:`Serie ${m.ser} · ${m.fam}`,
    archivo:`BOM_${m.id}`,
    notas:[
      '',
      'NOTAS DE PREVENTA',
      '  Generado como preseleccion de preventa. Confirmar los codigos BOM de 8 digitos antes',
      '  de cotizar: Huawei no publica precios de lista abiertos y el precio final depende del',
      '  acuerdo de canal.',
      '  Todas las licencias se emiten contra el ESN del equipo y se descargan del portal ESDP.',
    ],
  };
}

$('xlsBtn').addEventListener('click', async () => {
  const b = $('xlsBtn'); b.disabled = true; b.textContent = 'Generando…';
  try { await BOM.exportarExcel(bomFilas, bomMeta); b.textContent = 'Exportar a Excel'; }
  catch(e){ b.textContent = 'Error al exportar'; console.error(e);
    setTimeout(() => b.textContent = 'Exportar a Excel', 2200); }
  b.disabled = false;
});

$('copyBtn').addEventListener('click', async () => {
  const t = $('bomOut'); t.select();
  try { await navigator.clipboard.writeText(t.value); $('copyBtn').textContent = 'Copiado'; }
  catch { document.execCommand('copy'); $('copyBtn').textContent = 'Copiado'; }
  setTimeout(() => $('copyBtn').textContent = 'Copiar como texto', 1600);
});


/* ── PERFILES MULTI-SEDE ────────────────────────────────────────────────────────────────
   Misma clave compartida que los demas fabricantes (`BOM.perfiles`): un despliegue real mezcla
   marcas. Cargar es de Huawei (los campos son ids de ESTA pagina); consolidar no. Aqui todo se
   multiplica por sedes: el modelo comercial de Huawei no declara pools ni lineas unicas. */
const CAMPOS_PERFIL = ['bw','unit','sites','conc','head','frame','profile','lan','aps','sSdwan','sUtm','sSlice','rPoe','rWan','rWifi','crit','onsite','remote','chkHa','anios','qty','opticasData'];
const SEGS_PERFIL = ['platSeg','modeSeg','dirSeg'];
function capturarCampos(){
  const v = {};
  CAMPOS_PERFIL.forEach(id => { const n = $(id); if(n) v[id] = n.type === 'checkbox' ? n.checked : n.value; });
  SEGS_PERFIL.forEach(id => { const a = $(id).querySelector('[aria-pressed="true"]'); v[id] = a ? a.dataset.v : null; });
  return v;
}
function aplicarCampos(v0){
  // Un perfil de antes de H3 con «nodo de núcleo» se carga como plataforma NE8000.
  const v = v0 && v0.modeSeg === 'core' ? {...v0, modeSeg:'link', platSeg:v0.platSeg || 'ne8000'} : (v0 || {});
  CAMPOS_PERFIL.forEach(id => {
    const n = $(id);
    if(!n || v[id] == null) return;
    if(n.type === 'checkbox') n.checked = !!v[id]; else n.value = v[id];
  });
  // Los grupos .seg guardan su valor en una variable de la pagina: solo su manejador la actualiza.
  SEGS_PERFIL.forEach(id => { const b = v[id] != null && $(id).querySelector(`[data-v="${v[id]}"]`); if(b) b.click(); });
  render();
}
function pintarPerfiles(){
  const caja = $('listaPerfiles');
  if(!caja) return;
  const l = BOM.perfilesDe(VENDOR);
  caja.innerHTML = l.length
    ? '<table class="tco-tabla"><thead><tr><th>Perfil</th><th>Sedes</th><th>Modelo</th><th>Guardado</th><th></th></tr></thead><tbody>'
      + l.map(x => `<tr><td><b>${esc(x.nombre)}</b></td><td>${x.sedes}</td><td>${esc(x.modelo)}</td><td>${esc(x.fecha || '—')}</td>`
        + `<td><button type="button" class="btn ghost" data-perfil-cargar="${esc(x.id)}" style="font-size:10px;padding:3px 8px">Cargar</button> `
        + `<button type="button" class="btn ghost" data-perfil-borrar="${esc(x.id)}" style="font-size:10px;padding:3px 8px">Eliminar</button></td></tr>`).join('')
      + '</tbody></table>'
    : '<p class="hint">Sin perfiles guardados todavía.</p>';
  $('btnConsolidar').disabled = !BOM.perfiles().length;
}
$('btnGuardarPerfil').addEventListener('click', () => {
  const nombre = $('nombrePerfil').value.trim();
  const sedes = Math.max(0, parseInt($('perfilSedes').value, 10) || 0);
  if(!nombre || !sedes){ $('perfilMsg').textContent = 'Pon un nombre y el número de sedes idénticas.'; $('nombrePerfil').focus(); return; }
  if(!bomFilas.length || !hayCandidato){ $('perfilMsg').textContent = 'No hay un equipo dimensionado que guardar: ajusta el escenario primero.'; return; }
  const m = MODELS.find(x => x.id === $('pickModel').value);
  BOM.guardarPerfil({nombre, sedes, modelo:m ? m.id : $('pickModel').value, vendor:VENDOR, fecha:new Date().toISOString().slice(0, 10),
    version:1, campos:capturarCampos(), filas:JSON.parse(JSON.stringify(bomFilas))});
  $('nombrePerfil').value = ''; $('perfilSedes').value = '';
  $('perfilMsg').textContent = `Perfil «${nombre}» guardado con ${sedes} sede(s).`;
  pintarPerfiles();
});
$('listaPerfiles').addEventListener('click', e => {
  const b = e.target.closest('button');
  if(!b) return;
  if(b.dataset.perfilCargar != null){
    const x = BOM.perfilesDe(VENDOR).find(y => y.id === b.dataset.perfilCargar);
    if(x && x.campos) aplicarCampos(x.campos);
  } else if(b.dataset.perfilBorrar != null){
    BOM.quitarPerfil(b.dataset.perfilBorrar);
    pintarPerfiles();
  }
});
function consolidarPerfiles(){
  const l = BOM.perfiles();
  const {filas, totalSedes, fabricantes} = BOM.consolidar(l, {agregadas:[], unicas:[]});
  const multi = fabricantes.length > 1;
  const meta = {
    titulo:`BOM global consolidado — ${l.length} perfil(es), ${totalSedes} sedes`,
    subtitulo:l.map(x => `${x.nombre} ×${x.sedes} (${x.modelo})`).join(' · '),
    archivo:multi ? 'BOM_global_multifabricante' : 'BOM_global_huawei',
    sinRefs:true,
    notas:['REGLAS DE CONSOLIDACION (Huawei):',
      '  Equipo, componentes, licencias y soporte: cantidad del perfil x sedes del perfil.',
      '  Los codigos BOM de 8 digitos siguen por confirmar; el precio del equipo es una referencia estimada.'],
  };
  if(multi) meta.notas.push(`  MULTI-FABRICANTE: ${fabricantes.join(', ')}.`);
  const d = dtoActual();
  if(d > 0){ meta.dto = d; meta.dtoEtq = dtoEtiqueta(); }
  return {filas, meta, totalSedes, fabricantes};
}
$('btnConsolidar').addEventListener('click', () => {
  const {filas, meta, totalSedes, fabricantes} = consolidarPerfiles();
  if(!totalSedes) return;
  $('consolidadoSub').textContent = `${meta.subtitulo} — ${totalSedes} sedes en total`;
  $('consolidadoTabla').innerHTML = (fabricantes.length > 1 ? `<p class="bom-aviso">Consolidado <b>multi-fabricante</b> (${esc(fabricantes.join(', '))}).</p>` : '')
    + BOM.renderTabla(filas, {dto:dtoActual(), sinRefs:true});
  $('modalConsolidado').hidden = false;
  $('xlsConsolidadoBtn').onclick = () => BOM.exportarExcel(filas, meta);
  $('consolidadoCerrar').focus();
});
$('consolidadoCerrar').addEventListener('click', () => { $('modalConsolidado').hidden = true; $('btnConsolidar').focus(); });
$('modalConsolidado').addEventListener('click', e => { if(e.target === $('modalConsolidado')) $('modalConsolidado').hidden = true; });
document.addEventListener('keydown', e => { if(e.key === 'Escape' && !$('modalConsolidado').hidden) $('modalConsolidado').hidden = true; });

/* ════════ CATÁLOGO DE ÓPTICAS ════════ */
(async function initApp(){
  const res = await fetch('/api/dimensionador/huawei');
  const data = await res.json();
  // Pendiente 34: el respaldo de ciclo de vida de ESTE fabricante, tal como lo declara
  // `legacyData/fuentes.js` con sus `campos`. Sin el, la ficha dice «el catalogo no trae el
  // ciclo de vida» en vez de afirmar vigencia por omision.
  FICHA.fijarCicloVida(data.cicloVida);
  OPTICS = data.optics;
  OPTIC_LABEL = data.opticLabel;
  PARTS = data.parts;
  MODELS = data.models;
  HICARE = data.hicare;

  await cargarPreciosRef();
  populatePickModel();
  $('opticsAll').innerHTML = Object.keys(OPTICS).map(k => `
    <div class="grp"><h3>${OPTIC_LABEL[k]}</h3>
    <div class="scroll"><table><thead><tr><th>Designación</th><th>Códigos BOM</th><th>Descripción</th></tr></thead><tbody>
    ${OPTICS[k].map(o => `<tr><td><code>${esc(o.sku)}</code></td><td>${bomTag(o.bom)}</td><td>${esc(o.d)}</td></tr>`).join('')}
    </tbody></table></div></div>`).join('');

  render();
  renderBom();
  renderCatalogo();
  PROCEDENCIA.registrarModelos('huawei', () => MODELS.map(m => ({ model: m.id, ...m })));
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
  // La clave conserva el nombre viejo del archivo A PROPOSITO. No es el nombre de la pagina:
  // es la identidad bajo la que ya hay escenarios guardados en el navegador de quien usa
  // esto. Renombrarla por coherencia cosmetica le borraria el trabajo guardado a cambio de
  // nada, porque nadie ve esta cadena. El archivo se llama dimensionador-huawei-netengine.
  // Enlaces anteriores a la etapa H3: `modeSeg=core` era «nodo de núcleo», que ahora es la
  // plataforma NE8000 con cálculo de enlace. Se traduce en vez de dejar el enlace mudo.
  const qs0 = new URLSearchParams(location.search);
  const veniaDeCore = qs0.get('modeSeg') === 'core' && !qs0.has('platSeg');
  const st = ESTADO.vincular({ campos: ['bw','unit','sites','conc','head','frame','profile','lan','aps','sSdwan','sUtm','sSlice','rPoe','rWan','rWifi','crit','onsite','remote','chkHa','anios','opticasData','selDescuento','dtoCustom','platSeg','dirSeg','modeSeg','verdict-sel'] });
  if (veniaDeCore) {
    $('platSeg').querySelector('[data-v="ne8000"]').click();
    $('modeSeg').querySelector('[data-v="link"]').click();
    console.info('[huawei] enlace con modeSeg=core traducido a la plataforma NE8000.');
  }
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
   Ojo: aqui `lastPick` es una CADENA con el id del equipo, no un objeto como en las otras
   paginas. Leerlo con .id devolveria undefined y el boton diria "sin equipo elegido" con un
   equipo elegido en pantalla. */
document.addEventListener('DOMContentLoaded', () => {
  BOM.montarBotonCotizador(() => {
    const sel = document.getElementById('verdict-sel');
    const elegido = (sel && sel.value) || lastPick || null;
    if (!elegido) return null;
    const cant = document.getElementById('qty');
    return { modelo: elegido, qty: Math.max(1, parseInt(cant && cant.value, 10) || 1) * (ultimaEval ? ultimaEval.unidades : 1),
             de: document.title.split('—')[0].trim() };
  });
});
