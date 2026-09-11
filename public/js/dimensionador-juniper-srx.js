'use strict';
// Dimensionador Juniper. Dos plataformas separadas y un principio prestado de la auditoría
// del dimensionador FortiGate:
//
//   ACTIVAR INSPECCIÓN NO ENCARECE UN PORCENTAJE, CAMBIA LA CIFRA QUE APLICA.
//
// Juniper publica el firewall de la línea SRX en dos bases —paquetes grandes e IMIX— y
// además IPS y Threat Prevention por separado. Son mediciones de rutas de procesamiento
// distintas, no escenarios del mismo número. La de portada (paquetes grandes) es la mejor de
// todas y la que se cita en las reuniones: en el SRX380 son 20 Gbps frente a 6,5 en IMIX y
// 2 con IPS. Un factor 10. Por eso esta herramienta NUNCA elige con la cifra de portada: la
// muestra como referencia y dimensiona con la capa efectiva.
//
// SRX Y SSR NO SE COMPARAN ENTRE SÍ. El Session Smart Router enruta por sesión sin túneles y
// no hace inspección de contenido; el SRX es un cortafuegos. Compararlos por Mbps invitaría
// a proponer uno donde hace falta el otro — el mismo error que se corrigió en el
// dimensionador de Cisco acotando la plataforma antes que el caudal.

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s == null ? '' : s)
  .replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const fmt = (m) => (m == null ? 'sin dato' : (m >= 1000 ? `${(m / 1000).toFixed(m % 1000 ? 1 : 0)} Gbps` : `${m} Mbps`));
const miles = (n) => (n == null ? 'sin dato' : n.toLocaleString('en-US'));

let MODELS = [], SDWAN = [], BUNDLES = {}, CARE = {};

// Catálogo Juniper, con la misma tabla que antes vivía en la vista de Juniper del portal
// (ver CLAUDE.md, 2026-09-10): SRX y SD-WAN son dos productos que no se comparan entre sí
// (misma regla que el resto de la página), así que se listan en tablas separadas.
function renderCatalogo() {
  const tbodySrx = document.querySelector('#tbl-juniper-srx-cat tbody');
  const tbodySdwan = document.querySelector('#tbl-juniper-sdwan-cat tbody');
  if (!tbodySrx || !tbodySdwan) return;
  tbodySrx.innerHTML = MODELS.map((m) => `<tr>
    <td><code>${esc(m.id)}</code></td><td>${esc(m.ser)}</td><td>${esc(m.seg)}</td>
    <td class="n">${fmt(m.fw)}</td><td>${esc(m.ifaces)}</td>
  </tr>`).join('');
  tbodySdwan.innerHTML = SDWAN.map((m) => `<tr>
    <td><code>${esc(m.id)}</code></td><td>${esc(m.ser)}</td><td>${esc(m.seg)}</td>
    <td class="n">${fmt(m.cap)}</td><td>${esc(m.ifaces)}</td>
  </tr>`).join('');
}
let plat = 'srx', capa = 'ips', lastPick = null;
// Si el dimensionamiento se queda sin candidato, el BOM tiene que DECIRLO en vez de seguir
// mostrando el ultimo equipo que si cumplia.
let hayCandidato = true;
let bomFilas = [], bomMeta = {};

// Orden de profundidad creciente de inspección y throughput decreciente. `fw` (paquetes
// grandes) queda deliberadamente FUERA de esta escala: no es una capa de inspección, es la
// misma capa medida en el mejor caso.
const CAPAS = ['fwImix', 'vpn', 'ips', 'atp'];
const CAPA_INFO = {
  fwImix: { n: 'Firewall (IMIX)', d: 'Sin inspección de contenido, con una mezcla de tamaños de paquete parecida al tráfico real. Es el techo honesto de un SRX que solo enruta y filtra por estado.' },
  vpn:    { n: 'IPsec VPN',       d: 'Cifrado de sede a sede. Se mide aparte porque el motor criptográfico es otra ruta de procesamiento.' },
  ips:    { n: 'IPS',             d: 'Motor de prevención de intrusiones. Saca la sesión del camino rápido y por eso la cifra cae respecto al firewall.' },
  atp:    { n: 'Threat Prevention', d: 'Stack completo: IPS, AppSecure, antivirus y ATP Cloud. Es el número realista de una sucursal con seguridad avanzada activa, y con el que se debe dimensionar de verdad.' },
};
// Cada función impone un PISO de capa. La elección del usuario vale como punto de partida:
// puede pedir una capa más exigente que la que obligan sus funciones, no una más liviana.
const PISO_POR_FUNCION = [
  { id: 'chkIps', capa: 'ips', n: 'IPS / AppSecure' },
  { id: 'chkAtp', capa: 'atp', n: 'ATP Cloud, antivirus o URL Filtering' },
  { id: 'chkVpn', capa: 'vpn', n: 'túnel IPsec' },
];

function capaEfectiva() {
  const base = CAPAS.indexOf(capa);
  let idx = base; const elevan = [];
  for (const f of PISO_POR_FUNCION) {
    const nodo = $(f.id);
    if (!nodo || !nodo.checked) continue;
    const i = CAPAS.indexOf(f.capa);
    if (i > base) elevan.push(f);
    if (i > idx) idx = i;
  }
  return { k: CAPAS[idx], elevan, elevada: idx > base };
}

/* ══ Carga ══ */
(async function init() {
  try {
    const r = await fetch('/api/dimensionador/juniper');
    const d = await r.json();
    MODELS = d.models || []; SDWAN = d.sdwan || [];
    BUNDLES = d.bundles || {}; CARE = d.care || {};
  } catch {
    $('verdict').innerHTML = '<p class="warn">No se pudo cargar el catálogo Juniper.</p>';
    return;
  }
  $('licTier').innerHTML = Object.keys(BUNDLES)
    .map((k, i) => `<option value="${esc(k)}"${i === Object.keys(BUNDLES).length - 1 ? ' selected' : ''}>${esc(BUNDLES[k].n)}</option>`).join('');
  render();
  renderCatalogo();
  PROCEDENCIA.registrarModelos('juniper', () => [...MODELS, ...SDWAN].map((m) => ({ model: m.id, ...m })));
}());

/* ══ Controles ══ */
document.querySelectorAll('.tabs button').forEach((b) => b.addEventListener('click', () => {
  document.querySelectorAll('.tabs button').forEach((x) => x.setAttribute('aria-selected', x === b));
  document.querySelectorAll('.tabpane').forEach((p) => { p.hidden = p.id !== `pane-${b.dataset.tab}`; });
  if (b.dataset.tab === 'bom') renderBom();
}));
$('platSeg').addEventListener('click', (e) => {
  const b = e.target.closest('button'); if (!b) return;
  [...$('platSeg').children].forEach((x) => x.setAttribute('aria-pressed', x === b));
  plat = b.dataset.v;
  $('panelSrx').style.display = plat === 'srx' ? '' : 'none';
  $('panelSsr').style.display = plat === 'ssr' ? '' : 'none';
  render();
});
$('capaSeg').addEventListener('click', (e) => {
  const b = e.target.closest('button'); if (!b) return;
  [...$('capaSeg').children].forEach((x) => x.setAttribute('aria-pressed', x === b));
  capa = b.dataset.v; render();
});
['bw', 'unit', 'head', 'users', 'sesUser', 'chkIps', 'chkAtp', 'chkVpn']
  .forEach((id) => $(id).addEventListener('input', render));
['pickModel', 'qty', 'licTier', 'termYears', 'chkHa'].forEach((id) => $(id).addEventListener('input', renderBom));

// La lista SI se reconstruye aqui, y solo aqui: cambia con la plataforma (los SRX y los
// Session Smart Router son catalogos distintos). Lo que ya no se decide aqui es a que equipo
// apunta — de eso se encarga `BOM.sincronizar`, igual que en los otros cinco dimensionadores.
function sincronizarConBom(m) {
  const lista = plat === 'srx' ? MODELS : SDWAN;
  const sel = $('pickModel');
  const antes = sel.value;
  sel.innerHTML = lista.map((x) => `<option value="${esc(x.id)}">${esc(x.id)} — ${esc(x.seg)}</option>`).join('');
  // Al reconstruir la lista se pierde el valor: se repone si ese equipo sigue existiendo en
  // la plataforma actual, para no tirar una eleccion manual al mover cualquier parametro.
  if (antes && lista.some((x) => x.id === antes)) sel.value = antes;
  BOM.sincronizar({ elegido: m ? m.id : null, render: renderBom });
}

/* ══ Motor ══ */
function render() {
  const head = (parseFloat($('head').value) || 0) / 100;
  $('headVal').textContent = `${Math.round(head * 100)} %`;
  const need = Math.round((parseFloat($('bw').value) || 0) * (parseFloat($('unit').value) || 1) * (1 + head));

  if (plat === 'ssr') return renderSsr(need);

  const ef = capaEfectiva();
  $('capaHint').innerHTML = `<b>${esc(CAPA_INFO[capa].n)}:</b> ${CAPA_INFO[capa].d}`;

  // Sesiones concurrentes derivadas, como en Fortinet: nadie estima un total absoluto, pero
  // todo el mundo estima cuántas abre un usuario.
  const users = Math.max(0, parseInt($('users').value, 10) || 0);
  const sesUser = Math.max(0, parseInt($('sesUser').value, 10) || 0);
  const sessNeed = users && sesUser ? Math.round(users * sesUser * (1 + head)) : 0;

  // Un modelo sin cifra en la capa efectiva NO se cuela con la de otra capa: se descarta y
  // se explica. Sustituir una medición por otra es exactamente lo que produce el error de
  // factor 10 que esta herramienta existe para evitar.
  let sinCifra = 0, outBySess = 0;
  const candidatos = MODELS.filter((m) => {
    if (m[ef.k] == null) { sinCifra++; return false; }
    if (m[ef.k] < need) return false;
    if (sessNeed && m.sess != null && m.sess < sessNeed) { outBySess++; return false; }
    return true;
  });
  const ordenados = FICHA.ordenar(candidatos, (a, b) => a[ef.k] - b[ef.k]);
  const pick = FICHA.recomendar(ordenados);
  lastPick = pick;
  hayCandidato = !!pick;
  sincronizarConBom(pick);

  if (!pick) {
    const why = [];
    why.push(`<li>Requerimiento de <b>${fmt(need)}</b> en la capa <b>${esc(CAPA_INFO[ef.k].n)}</b>.</li>`);
    if (ef.elevada) why.push(`<li>La capa se elevó de <b>${esc(CAPA_INFO[capa].n)}</b> a <b>${esc(CAPA_INFO[ef.k].n)}</b> por ${ef.elevan.map((f) => esc(f.n)).join(', ')}.</li>`);
    if (sinCifra) why.push(`<li><b>${sinCifra}</b> modelo(s) quedaron fuera porque <b>el catálogo no publica su cifra en esta capa</b>. No se sustituye por la de otra capa: son mediciones distintas y hacerlo es lo que produce propuestas que se quedan cortas por un orden de magnitud. Se pueden consultar en la pestaña de BOM.</li>`);
    if (outBySess) why.push(`<li><b>${outBySess}</b> modelo(s) descartado(s) por sesiones concurrentes: hacen falta ${miles(sessNeed)}.</li>`);
    why.push('<li>Si el diseño no exige inspección avanzada sobre todo el tráfico, evaluar una capa menos profunda o segmentar qué tráfico se inspecciona — es la palanca que más capacidad libera.</li>');
    FICHA.render({vendor:'juniper', 
      contenedor: 'verdict', candidatos: [], recomendado: null,
      vacioTitulo: 'Ningún modelo del catálogo cumple en esta capa',
      vacioDetalle: `<ul style="margin:0;padding-left:18px;font-size:13.5px">${why.join('')}</ul>`,
    });
    $('perfTiers').innerHTML = '';
    $('sizingBox').innerHTML = '<p style="font-size:13.5px;color:var(--steel)">Sin candidato para los parámetros actuales.</p>';
    return;
  }

  FICHA.render({vendor:'juniper', 
    contenedor: 'verdict',
    candidatos: ordenados,
    recomendado: pick.id,
    etiqueta: (m) => `${m.id} — ${m.seg} · ${fmt(m[ef.k])}`,
    titulo: (m) => m.id,
    subtitulo: (m) => `${m.ser} · ${m.seg}`,
    medidores: (m) => medidoresDe(m, ef.k, need, sessNeed),
    porQue: (m) => porQueDe(m, ef, need, sessNeed, sinCifra),
    secciones: (m) => seccionesDe(m),
    alCambiar: (id) => {
      const m = MODELS.find((x) => x.id === id);
      if (!m) return;
      pintarPerf(m, ef.k); pintarResumen(m, ef, need, sessNeed);
      $('pickModel').value = id; renderBom();
    },
  });
  const elegido = MODELS.find((m) => m.id === FICHA.elegido('verdict')) || pick;
  pintarPerf(elegido, ef.k);
  pintarResumen(elegido, ef, need, sessNeed);
}

function medidoresDe(m, k, need, sessNeed) {
  const med = [{ etq: CAPA_INFO[k].n, val: need, tope: m[k], txt: `${fmt(need)} / ${fmt(m[k])}` }];
  if (m.sess != null) {
    med.push({ etq: 'Sesiones concurrentes', val: sessNeed, tope: m.sess,
      txt: `${sessNeed ? `${miles(sessNeed)} / ` : ''}${miles(m.sess)}` });
  }
  return med;
}

function porQueDe(m, ef, need, sessNeed, sinCifra) {
  const f = [];
  if (ef.elevada) {
    f.push(`<b class="warn">Capa elevada:</b> elegiste <b>${esc(CAPA_INFO[capa].n)}</b>, pero ${ef.elevan.map((x) => esc(x.n)).join(' y ')} obliga${ef.elevan.length > 1 ? 'n' : ''} a dimensionar contra <b>${esc(CAPA_INFO[ef.k].n)}</b>. Activar inspección saca la sesión del camino rápido: no es un recargo porcentual, es otra cifra del datasheet.`);
  }
  if (m.fw != null && m[ef.k] != null && m.fw / m[ef.k] >= 2) {
    f.push(`<b class="warn">Ojo con la cifra de portada:</b> el material comercial cita <b>${fmt(m.fw)}</b> de firewall con paquetes grandes, <b>${Math.round(m.fw / m[ef.k])}x</b> por encima de los ${fmt(m[ef.k])} que aplican aquí. Es la misma caja medida en el mejor caso posible; no es lo que aguanta con este perfil.`);
  }
  if (m.fwImix != null && m.fw != null) {
    f.push(`Referencia de las dos bases del firewall: <b>${fmt(m.fw)}</b> con paquetes grandes y <b>${fmt(m.fwImix)}</b> con IMIX.`);
  }
  if (m.atp == null) {
    f.push('<b class="warn">Sin cifra de Threat Prevention publicada</b> para este modelo en el catálogo: si el diseño lleva ATP Cloud o antivirus en línea, confirmarla antes de cerrar la propuesta.');
  }
  if (m.sess == null) {
    f.push('<b class="warn">Sesiones concurrentes sin dato</b> en el catálogo, así que ese eje <b>no se comprobó</b> para este modelo. No significa que no tenga límite.');
  } else if (sessNeed) {
    const oTh = need / m[ef.k], oSe = sessNeed / m.sess;
    f.push(oSe > oTh
      ? `<b class="warn">Manda la tabla de sesiones:</b> ${Math.round(oSe * 100)} % frente al ${Math.round(oTh * 100)} % de throughput. Perfil de muchas sesiones y poco caudal.`
      : `El throughput manda sobre las sesiones: ${Math.round(oTh * 100)} % de la capa frente a ${(oSe * 100).toFixed(2)} % de la tabla de sesiones.`);
  }
  if (m.cps != null) f.push(`Conexiones nuevas por segundo publicadas: <b>${miles(m.cps)}</b>.`);
  if (sinCifra) f.push(`<b>${sinCifra}</b> modelo(s) del catálogo no aparecen en esta lista porque no publican cifra en la capa <b>${esc(CAPA_INFO[ef.k].n)}</b>. Están en la pestaña de BOM para consulta.`);
  return `<ul style="margin:8px 0 0;padding-left:18px;font-size:13.5px">
    <li>Requerimiento <b>${fmt(need)}</b> en <b>${esc(CAPA_INFO[ef.k].n)}</b> contra capacidad <b>${fmt(m[ef.k])}</b> — holgura ${Math.round((1 - need / m[ef.k]) * 100)} %</li>
    <li>Interfaces: ${esc(m.ifaces)}</li>
    ${f.map((x) => `<li>${x}</li>`).join('')}
  </ul>`;
}

function seccionesDe(m) {
  const tier = $('licTier').value || Object.keys(BUNDLES)[0];
  const b = BUNDLES[tier] || {};
  const c = CARE[Object.keys(CARE)[0]] || {};
  return [
    { titulo: 'Características',
      filas: [
        ['Serie', esc(m.ser)],
        ['Segmento', esc(m.seg)],
        ['Firewall (paquetes grandes)', `${fmt(m.fw)} <span class="warn">— cifra de portada</span>`],
        ['Firewall (IMIX)', fmt(m.fwImix)],
        ['IPsec VPN', fmt(m.vpn)],
        ['IPS', fmt(m.ips)],
        ['<b>Threat Prevention</b>', m.atp != null ? `<b>${fmt(m.atp)}</b>` : '<span class="warn">no está en el catálogo</span>'],
        ['Sesiones concurrentes', m.sess != null ? miles(m.sess) : '<span class="warn">no está en el catálogo</span>'],
        ['Conexiones nuevas / s', m.cps != null ? miles(m.cps) : '<span class="warn">no está en el catálogo</span>'],
        ['Interfaces', esc(m.ifaces), true],
        ['Precio de lista ref.', '<span class="warn">sin lista de precios Juniper</span>'],
      ] },
    FICHA.seccionAlimentacion(m),
    { titulo: 'Licenciamiento propuesto',
      filas: [[esc(b.n || tier), esc(b.svcs || '')]],
      nota: 'Los niveles de suscripción están verificados por nombre; el desglose exacto de servicios de los niveles Advanced no se pudo confirmar y se declara como tal en vez de repartirlo a ojo. Sin SKU ni precio: no hay lista de precios de Juniper en el material disponible.' },
    { titulo: 'Software y soporte',
      filas: [['Junos OS', 'Sistema operativo de la serie SRX, común con la línea de routing.'],
        [esc(c.n || 'Soporte'), esc(c.sla || '')]] },
  ];
}

function pintarPerf(m, k) {
  $('perfModel').textContent = `— ${m.id}`;
  const filas = [
    ['Firewall (paquetes grandes)', m.fw, false],
    ['Firewall (IMIX)', m.fwImix, k === 'fwImix'],
    ['IPsec VPN', m.vpn, k === 'vpn'],
    ['IPS', m.ips, k === 'ips'],
    ['Threat Prevention', m.atp, k === 'atp'],
  ];
  const max = Math.max(...filas.map((f) => f[1] || 0), 1);
  $('perfTiers').innerHTML = filas.map(([n, v, activa]) => {
    const pct = v ? Math.max((v / max) * 100, 1.5) : 0;
    return `<div class="meter"><b>${esc(n)}${activa ? ' <em>capa efectiva</em>' : ''} <em>${v == null ? 'sin dato en el catálogo' : fmt(v)}</em></b>
      <div class="bar"><i class="${activa ? 'tight' : 'good'}" style="width:${pct}%"></i></div></div>`;
  }).join('');
  $('perfNote').innerHTML = 'La primera fila es la cifra de portada, medida con paquetes grandes. Las demás son rutas de procesamiento distintas, no escenarios del mismo número: la herramienta elige con la capa efectiva, nunca con la primera.';
}

function pintarResumen(m, ef, need, sessNeed) {
  $('sizingBox').innerHTML = `<table class="ficha-tabla"><tbody>
    <tr><td>Capa efectiva</td><td class="n">${esc(CAPA_INFO[ef.k].n)}${ef.elevada ? ' <span class="warn">(elevada)</span>' : ''}</td></tr>
    <tr><td>Requerimiento final</td><td class="n"><b>${fmt(need)}</b></td></tr>
    <tr><td>Capacidad del modelo</td><td class="n">${fmt(m[ef.k])}</td></tr>
    <tr><td>Holgura</td><td class="n">${Math.round((1 - need / m[ef.k]) * 100)} %</td></tr>
    <tr><td>Sesiones concurrentes</td><td class="n">${sessNeed ? `${miles(sessNeed)} / ` : ''}${m.sess != null ? miles(m.sess) : '<span class="warn">sin dato</span>'}</td></tr>
    <tr><td>Unidades a cotizar</td><td class="n">${$('chkHa').checked ? '2 (HA)' : '1'}</td></tr>
  </tbody></table>`;
}

/* ══ SSR ══ */
function renderSsr(need) {
  const ordenados = FICHA.ordenar(SDWAN.filter((m) => m.cap >= need), (a, b) => a.cap - b.cap);
  const pick = FICHA.recomendar(ordenados);
  lastPick = pick;
  hayCandidato = !!pick;
  sincronizarConBom(pick);
  $('perfTiers').innerHTML = '';
  $('perfModel').textContent = '';
  if (!pick) {
    FICHA.render({vendor:'juniper',  contenedor: 'verdict', candidatos: [], recomendado: null,
      vacioTitulo: `Ningún Session Smart Router del catálogo llega a ${fmt(need)}`,
      vacioDetalle: '<p class="warn">Por encima del SSR1400 (40 Gbps) hay que evaluar varias unidades o la versión virtual sobre servidor.</p>' });
    $('sizingBox').innerHTML = '<p style="font-size:13.5px;color:var(--steel)">Sin candidato.</p>';
    return;
  }
  FICHA.render({vendor:'juniper', 
    contenedor: 'verdict', candidatos: ordenados, recomendado: pick.id,
    etiqueta: (m) => `${m.id} — ${m.seg} · ${fmt(m.cap)}`,
    titulo: (m) => m.id,
    subtitulo: (m) => `${m.ser} · ${m.seg}`,
    medidores: (m) => [{ etq: 'Caudal del sitio', val: need, tope: m.cap, txt: `${fmt(need)} / ${fmt(m.cap)}` }],
    porQue: (m) => `<ul style="margin:8px 0 0;padding-left:18px;font-size:13.5px">
      <li>Requerimiento <b>${fmt(need)}</b> contra <b>${fmt(m.cap)}</b> — holgura ${Math.round((1 - need / m.cap) * 100)} %</li>
      <li>Interfaces: ${esc(m.ifaces)}</li>
      <li><b>SD-WAN sin túneles:</b> el enrutado por sesión evita el encapsulado, así que no hay que descontar overhead de ESP como en un overlay IPsec. La contrapartida es que <b>no inspecciona contenido</b>: si el diseño necesita IPS o antivirus, va en un SRX o en el servicio cloud.</li>
      <li><b>Gestión desde Mist.</b> La suscripción es por dispositivo y no está en este catálogo: confirmarla con el distribuidor.</li>
    </ul>`,
    secciones: (m) => [{ titulo: 'Características',
      filas: [['Serie', esc(m.ser)], ['Segmento', esc(m.seg)], ['Caudal', fmt(m.cap)],
        ['Interfaces', esc(m.ifaces), true],
        ['Precio de lista ref.', '<span class="warn">sin lista de precios Juniper</span>']] },
      FICHA.seccionAlimentacion(m)],
    alCambiar: (id) => { $('pickModel').value = id; renderBom(); },
  });
  const m = SDWAN.find((x) => x.id === FICHA.elegido('verdict')) || pick;
  $('sizingBox').innerHTML = `<table class="ficha-tabla"><tbody>
    <tr><td>Caudal del sitio</td><td class="n"><b>${fmt(need)}</b></td></tr>
    <tr><td>Capacidad del modelo</td><td class="n">${fmt(m.cap)}</td></tr>
    <tr><td>Holgura</td><td class="n">${Math.round((1 - need / m.cap) * 100)} %</td></tr>
  </tbody></table>`;
}

/* ══ BOM ══ */
function renderBom() {
  const lista = plat === 'srx' ? MODELS : SDWAN;
  const id = $('pickModel').value || (lastPick && lastPick.id);
  const m = lista.find((x) => x.id === id) || lastPick;
  if (!m) {
    $('bomTabla').innerHTML = BOM.avisoDesvio({ hayCandidato: false })
      || '<p class="bom-desvio">Sin equipo elegido.</p>';
    return;
  }
  const qty = Math.max(1, parseInt($('qty').value, 10) || 1) * ($('chkHa').checked ? 2 : 1);
  const tier = $('licTier').value || Object.keys(BUNDLES)[0];
  const term = $('termYears').value;

  // Todas las líneas van sin precio: no hay lista de precios de Juniper. bom.js las cuenta
  // y lo avisa, en vez de totalizar como si estuviera completo.
  const filas = [
    { cat: 'Equipo', desc: m.id, sku: null, qty, unit: null,
      nota: `${m.ser} · ${m.seg} · ${m.ifaces}` },
  ];
  if (plat === 'srx') {
    filas.push({ cat: 'Suscripción', desc: `${(BUNDLES[tier] || {}).n || tier} — ${term} año(s)`, sku: null, qty, unit: null,
      nota: 'Una suscripción por unidad: en un par HA la licencia no se comparte entre nodos.' });
  } else {
    filas.push({ cat: 'Suscripción', desc: `Gestión Mist — ${term} año(s)`, sku: null, qty, unit: null,
      nota: 'Suscripción por dispositivo, no incluida en este catálogo.' });
  }
  filas.push({ cat: 'Soporte', desc: `${(CARE[Object.keys(CARE)[0]] || {}).n || 'Soporte'} — ${term} año(s)`, sku: null, qty, unit: null,
    nota: 'Niveles y SLA sin verificar: confirmar con el distribuidor.' });

  const meta = {
    titulo: `Lista de materiales — ${m.id}`,
    subtitulo: `${m.ser} · término ${term} año(s)`,
    archivo: `BOM_${m.id}`,
    notas: ['', 'NOTAS DE PREVENTA',
      '  Ninguna linea lleva precio: no hay lista de precios de Juniper en el material',
      '  disponible. Confirmar SKU, nivel de suscripcion y precio con el distribuidor.',
      '  Las cifras de rendimiento son por capa de inspeccion: la de portada (paquetes',
      '  grandes) no sirve para dimensionar.'],
  };
  $('bomTabla').innerHTML = BOM.avisoDesvio({ elegido: FICHA.elegido('verdict'), enBom: m.id, hayCandidato })
    + BOM.renderTabla(filas, {
      aviso: qty > 1 ? 'Par en HA: cada nodo lleva su propia suscripción y su propio contrato de soporte.' : null,
    });
  $('bomOut').value = BOM.comoTexto(filas, meta);
  bomFilas = filas; bomMeta = meta;
}

$('copyBtn').addEventListener('click', async () => {
  const t = $('bomOut');
  try { await navigator.clipboard.writeText(t.value); $('copyBtn').textContent = 'Copiado'; } catch {
    t.classList.remove('hidden'); t.select(); document.execCommand('copy');
    t.classList.add('hidden'); $('copyBtn').textContent = 'Copiado';
  }
  setTimeout(() => { $('copyBtn').textContent = 'Copiar como texto'; }, 1600);
});

$('xlsBtn').addEventListener('click', async () => {
  const b = $('xlsBtn'); b.disabled = true; b.textContent = 'Generando…';
  try { await BOM.exportarExcel(bomFilas, bomMeta); b.textContent = 'Exportar a Excel'; } catch (e) {
    b.textContent = 'Error al exportar'; console.error(e);
    setTimeout(() => { b.textContent = 'Exportar a Excel'; }, 2200);
  }
  b.disabled = false;
});

/* ══ ESTADO ENLAZABLE Y PERSISTENTE ══
   Antes, poner 2.500 Mbps y copiar la URL no servia de nada: quien la abria veia 500 Mbps y
   otra recomendacion. Ahora el escenario viaja en la URL; ya no se guarda entre sesiones
   (ver /js/estado.js). */
document.addEventListener('DOMContentLoaded', () => {
  const st = ESTADO.vincular({ campos: ['bw','unit','head','users','sesUser','chkIps','chkAtp','chkVpn','platSeg','capaSeg','verdict-sel'] });
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
