/* ════════ CATÁLOGO DE COMPONENTES ════════
   sku = designación oficial de Huawei · bom = código de 8 dígitos verificado, o null */
let OPTICS = {};
let OPTIC_LABEL = {};
let PARTS = {};
let MODELS = [];

const PROFILE = {fwd:'Forwarding (NAT+ACL+QoS, IMIX)', ipsec:'IPsec (IMIX)', typ:'SD-WAN típico (IPsec+QoS+SA+AppFlow, IMIX)'};
let HICARE = {};

const $ = id => document.getElementById(id);
let dirMult = 2, mode = 'link', lastPick = null;
// Si el dimensionamiento se quedo sin candidato, el BOM tiene que DECIRLO.
let hayCandidato = true;
let bomFilas = [], bomMeta = {};

/* ---- tabs ---- */
document.querySelectorAll('.tabs button').forEach(b => b.addEventListener('click', () => {
  document.querySelectorAll('.tabs button').forEach(x => x.setAttribute('aria-selected', x === b));
  ['calc','bom','optics','cat','src'].forEach(t => $('pane-' + t).hidden = (t !== b.dataset.tab));
}));

$('modeSeg').addEventListener('click', e => {
  const b = e.target.closest('button'); if(!b) return;
  [...$('modeSeg').children].forEach(x => x.setAttribute('aria-pressed', x === b));
  mode = b.dataset.v;
  $('aggBlock').classList.toggle('hidden', mode !== 'agg');
  $('bwLabel').textContent = mode === 'agg' ? 'Ancho de banda por sede' : mode === 'core' ? 'Tráfico agregado del nodo' : 'Ancho de banda contratado';
  $('modeHint').textContent = mode === 'agg'
    ? 'Suma los enlaces de todas las sucursales que terminan en este equipo, aplicando simultaneidad.'
    : mode === 'core' ? 'Capacidad total que debe conmutar el nodo. Se contrasta contra capacidad de conmutación y Mpps.'
    : 'Un solo enlace WAN terminando en el equipo.';
  render();
});
$('dirSeg').addEventListener('click', e => {
  const b = e.target.closest('button'); if(!b) return;
  [...$('dirSeg').children].forEach(x => x.setAttribute('aria-pressed', x === b));
  dirMult = +b.dataset.v; render();
});
['bw','unit','sites','conc','head','frame','profile','lan','aps','sSdwan','sUtm','sSlice','rPoe','rWan','rWifi','crit','onsite','remote']
  .forEach(id => $(id).addEventListener('input', render));
['pickModel','qty','optQty'].forEach(id => $(id).addEventListener('input', renderBom));

function fmt(m){
  if(m == null) return '—';
  if(m >= 1000000) return (m/1000000).toFixed(m % 1000000 ? 2 : 0).replace(/\.00$/,'') + ' Tbps';
  if(m >= 1000) return (m/1000).toFixed(m % 1000 ? 1 : 0) + ' Gbps';
  return Math.round(m) + ' Mbps';
}
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
    return r === 2 ? ' <span class="pillc" style="color:var(--red)">Fuera de venta</span>'
      : r === 1 ? ' <span class="pillc">Línea anterior</span>' : '';
  };
  tbodyAr.innerHTML = MODELS.filter(m => m.cls === 'AR').map(m => `<tr>
    <td><code>${esc(m.id)}</code>${marca(m)}</td><td>${esc(m.ser)}</td><td>${esc(m.fam)}</td>
    <td class="n">${fmt(m.fwd)}</td><td class="n">${m.ipsec ? fmt(m.ipsec) : '—'}</td>
    <td class="n">${m.lan}</td><td>${esc(m.ports)}</td>
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
  const raw = (parseFloat($('bw').value) || 0) * (+$('unit').value);
  const conc = +$('conc').value; $('concVal').textContent = conc + ' %';
  const head = +$('head').value; $('headVal').textContent = head + ' %';
  const sites = parseInt($('sites').value) || 1;
  const base = mode === 'agg' ? raw * sites * conc/100 : raw;
  const need = base * dirMult * (1 + head/100);
  const frame = +$('frame').value, needMpps = need / (frame * 8);
  const pk = $('profile').value;
  const minLan = parseInt($('lan').value) || 0, aps = parseInt($('aps').value) || 0;
  const svc = {sdwan:$('sSdwan').checked, utm:$('sUtm').checked, slice:$('sSlice').checked};
  const want = {poe:$('rPoe').checked, wan:$('rWan').checked, wifi:$('rWifi').checked};
  const wanOk = (pk === 'fwd') && !svc.sdwan && !svc.utm && aps === 0 && !want.poe && !want.wan && !want.wifi;

  const rows = MODELS.map(m => {
    const isWan = m.cls === 'WAN', cap = isWan ? m.cap : m[pk], miss = [];
    if(isWan && !wanOk) miss.push('serie de transporte: no hace SD-WAN, UTM ni WAC');
    if(cap == null) miss.push('sin cifra publicada para este perfil');
    else if(cap < need) miss.push('capacidad insuficiente');
    if(isWan && m.mpps != null && m.mpps < needMpps) miss.push(`límite de paquetes: ${m.mpps} Mpps`);
    if(want.poe && !m.poe) miss.push('sin PoE');
    if(want.wan && !m.wan) miss.push('sin 4G/5G integrado');
    if(want.wifi && !m.wifi) miss.push('sin Wi-Fi');
    if((m.lan||0) < minLan) miss.push(`${m.lan||0} puertos LAN`);
    if(!isWan && aps > (m.apsMax||0)) miss.push(`gestiona ${m.apsMax||0} APs`);
    return {m, cap, miss, isWan};
  });
  // Mismo criterio que el resto de dimensionadores (regla comun en ficha.js): lo vigente
  // primero, lo que este fuera de venta al final y nunca como recomendacion. Hoy ningun
  // modelo Huawei de este catalogo lleva esa marca; queda aplicado para que marcarlo en
  // los datos sea suficiente, sin volver a tocar esta pagina.
  // Se ordena por el rango del MODELO, no de la fila: aqui los candidatos viajan envueltos
  // en {m, cap, miss}, y pasarle la fila a la regla la dejaria mirando un objeto sin marcas.
  const fit = rows.filter(r => !r.miss.length)
    .sort((a, b) => FICHA.rango(a.m) - FICHA.rango(b.m) || a.cap - b.cap);
  const pick = fit.find(r => FICHA.recomendable(r.m)) || null;
  const next = fit.filter(r => FICHA.recomendable(r.m))[1] || null;

  drawLadder(need, pick, pk);

  // ── Presentacion ──────────────────────────────────────────────────────────
  // El veredicto pasa a ser un desplegable con todos los que cumplen; licencias, soporte
  // y BOM siguen al equipo ELEGIDO. Ver /js/ficha.js.
  const ctx = {need, needMpps, raw, base, head, conc, sites, frame, pk, rows, wanOk};
  const licCtx = {need, aps, svc, pk};
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
  MODELS.forEach(m => {
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
    v.innerHTML = `<p class="tag">Sin coincidencias</p><div class="model">${over ? 'Fuera del catálogo' : 'Ajusta los filtros'}</div>
      <p class="family">${over ? `El requerimiento de ${fmt(c.need)} supera al NE8000 X16. A este nivel se resuelve con varios chasis en paralelo.`
      : c.wanOk ? 'Ningún modelo cumple capacidad y requisitos a la vez.'
      : 'Con SD-WAN, UTM o WAC habilitados solo compite la serie AR, y ninguno cubre este caudal. Para transporte puro desmarca esas funciones.'}</p>
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

function licensesFor(pick, c){
  const m = pick.m, L = [];
  if(m.boost && c.need > m.boost) L.push({on:1, t:'Licencia de rendimiento (Boost)', d:`Sin ella el ${m.id} entrega ${fmt(m.boost)}. La licencia lo lleva a ${fmt(m.fwd)}.`});
  if(!pick.isWan){
    if(c.pk !== 'fwd' || c.svc.sdwan){
      L.push({on:1, t:'Licencia de función SD-WAN por equipo', d:'Habilita identificación de aplicaciones, selección inteligente de ruta y túneles gestionados.'});
      L.push({on:1, t:'Suscripción iMaster NCE-WAN — 12 meses', d:'Controlador y gestión del overlay. Se licencia por nodo administrado.'});
    }
    if(c.svc.utm){
      L.push({on:1, t:'Licencia de seguridad: IPS, filtrado URL y antivirus', d:'Funciones licenciadas aparte en la serie AR, no vienen activas.'});
      L.push({on:1, t:'Suscripción de bases de firmas — 12 meses', d:'Sin firmas vigentes el IPS y el antivirus quedan sin actualizar.'});
    }
    if(c.aps > 0){
      const extra = Math.max(0, c.aps - (m.apsFree||0));
      L.push({on: extra > 0 ? 1 : 0, t: extra > 0 ? `Licencia de recursos AP — ${extra} APs adicionales` : 'Licencia de recursos AP no requerida',
        d: extra > 0 ? `El ${m.id} gestiona ${m.apsFree} APs sin costo y llega a ${m.apsMax}.` : `Los ${c.aps} APs caben en los ${m.apsFree} gratuitos.`});
    }
  } else {
    L.push({on:1, t:'Licencia base del sistema VRP por chasis', d:'Habilita el conjunto de funciones de la plataforma.'});
    L.push({on:1, t:'Licencias de función de transporte: L3VPN, EVPN, SRv6', d:'Se licencian por funcionalidad activada.'});
    if(c.svc.slice) L.push({on:1, t:'Licencia de slicing FlexE / SRv6', d:'Aislamiento duro de red y ajuste de ancho de banda por rebanada.'});
    L.push({on:1, t:'Licencia de capacidad por puerto y tarjeta', d:'La capacidad se habilita por incrementos. Cotiza la densidad del año 1 y crece por licencia.'});
    L.push({on:1, t:'Suscripción iMaster NCE — 12 meses', d:'Gestión, automatización y O&M proactiva del nodo.'});
  }
  L.push({on:1, t:'SnS — Software Subscription and Support, 12 meses', d:'Vía para actualizaciones y parches de VRP. Va separada del paquete de hardware.'});
  L.push({on:0, t:'Registro de ESN', d:'Todas las licencias se emiten contra el ESN del equipo y se descargan del portal ESDP de Huawei.'});
  return L;
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
    <p class="family" style="margin-bottom:14px"><span class="pillc">${s.sla}</span> · término 12 meses · ${pick.m.id}</p>
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

function renderBom(){
  const m = MODELS.find(x => x.id === $('pickModel').value) || MODELS[0];
  const qty = Math.max(1, parseInt($('qty').value) || 1);
  const optQty = Math.max(0, parseInt($('optQty').value) || 0);
  const isWan = m.cls === 'WAN';
  const pick = {m, isWan, cap: isWan ? m.cap : (m.typ ?? m.ipsec ?? m.fwd)};
  const lics = licensesFor(pick, {need:0, aps:parseInt($('aps').value)||0, svc:{sdwan:$('sSdwan').checked, utm:$('sUtm').checked, slice:$('sSlice').checked}, pk:$('profile').value});
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

  // Componentes de hardware
  const parts = (m.parts || []).map(k => PARTS[k]).filter(Boolean);
  if(parts.length){
    html += `<section class="panel"><h2>Componentes de hardware</h2><div class="scroll"><table>
      <thead><tr><th>Designación</th><th>Código BOM</th><th>Descripción</th></tr></thead><tbody>
      ${parts.map(p => `<tr><td><code>${esc(p.sku)}</code></td><td>${bomTag(p.bom)}</td><td>${esc(p.d)}</td></tr>`).join('')}
    </tbody></table></div>
    <p class="hint">Las fuentes y ventiladores redundantes se piden por separado del chasis. En equipos con esquema 1+1 o N+1 cotiza siempre el módulo de respaldo: es el componente que más falla en campo.</p></section>`;
  }

  // Ópticas
  html += `<section class="panel"><h2>Módulos ópticos compatibles</h2>`;
  (m.optics || []).forEach(k => {
    html += `<div class="grp"><h3>${OPTIC_LABEL[k]}</h3>
      <p class="gd">Cantidad estimada: <b>${optQty * qty}</b> módulos (${optQty} por equipo x ${qty}). Recuerda que cada extremo del enlace necesita el suyo.</p>
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
    <tr><td>${s.n}</td><td class="n">${s.sla}</td><td class="n">12 meses</td><td class="n">${qty}</td></tr>
    <tr><td>SnS — Software Subscription and Support</td><td class="n">Actualizaciones de VRP</td><td class="n">12 meses</td><td class="n">${qty}</td></tr>
  </tbody></table></div></section>`;

  $('bomBody').innerHTML = html;

  const filas = filasBom(m, qty, optQty, parts, lics, s);
  const meta = metaBom(m);
  $('bomTabla').innerHTML = BOM.renderTabla(filas, {});
  $('bomOut').value = BOM.comoTexto(filas, meta);
  bomFilas = filas; bomMeta = meta;
}

// Filas del BOM en el formato compartido de /js/bom.js. Huawei no publica precios de lista
// abiertos, asi que casi todas las lineas salen sin cotizar a proposito: el modulo compartido
// lo detecta y no finge un total.
function filasBom(m, qty, optQty, parts, lics, s){
  const filas=[
    {cat:'Equipo', desc:m.id, sku:null, qty, unit:null, nota:`Serie ${m.ser} · ${m.fam} · ${m.ports}`},
  ];
  parts.forEach(p=>filas.push({cat:'Componentes de hardware', desc:p.sku, sku:p.bom||null,
    qty, unit:null, nota:p.d||''}));
  if(optQty>0){
    (m.optics||[]).forEach(k=>(OPTICS[k]||[]).slice(0,1).forEach(o=>filas.push({
      cat:'Ópticas', desc:`${OPTIC_LABEL[k]||k} — ${o.sku}`,
      sku:(o.bom&&o.bom.length)?o.bom.join(' / '):null,
      qty:optQty*qty, unit:null, nota:o.d||''})));
  }
  lics.filter(l=>l.on).forEach(l=>filas.push({cat:'Licencias', desc:l.t, sku:null, qty, unit:null, nota:l.d||''}));
  filas.push({cat:'Soporte', desc:s.n, sku:null, qty, unit:null, nota:`${s.sla} · 12 meses`});
  filas.push({cat:'Soporte', desc:'SnS — Software Subscription and Support', sku:null, qty, unit:null,
    nota:'Actualizaciones y parches de VRP. Va separada del paquete de hardware. 12 meses.'});
  return filas;
}

function metaBom(m){
  return {
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

/* ════════ CATÁLOGO DE ÓPTICAS ════════ */
(async function initApp(){
  const res = await fetch('/api/dimensionador/huawei');
  const data = await res.json();
  OPTICS = data.optics;
  OPTIC_LABEL = data.opticLabel;
  PARTS = data.parts;
  MODELS = data.models;
  HICARE = data.hicare;

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
  const st = ESTADO.vincular({ campos: ['bw','unit','sites','conc','head','frame','profile','lan','aps','sSdwan','sUtm','sSlice','rPoe','rWan','rWifi','crit','onsite','remote','dirSeg','modeSeg','verdict-sel'] });
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
   Ojo: aqui `lastPick` es una CADENA con el id del equipo, no un objeto como en las otras
   paginas. Leerlo con .id devolveria undefined y el boton diria "sin equipo elegido" con un
   equipo elegido en pantalla. */
document.addEventListener('DOMContentLoaded', () => {
  BOM.montarBotonCotizador(() => {
    const sel = document.getElementById('verdict-sel');
    const elegido = (sel && sel.value) || lastPick || null;
    if (!elegido) return null;
    const cant = document.getElementById('qty');
    return { modelo: elegido, qty: Math.max(1, parseInt(cant && cant.value, 10) || 1),
             de: document.title.split('—')[0].trim() };
  });
});
