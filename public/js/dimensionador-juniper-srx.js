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
//
// SD-WAN COMO SUCURSAL O COMO HUB, Y SEGURIDAD DESACOPLADA (2026-10-19). La cuenta del SSR y
// el filtro del SRX viven en `juniper-motor.js` (puro, con pruebas): de ahí sale la demanda
// del SSR (por capa de cifrado, con las cifras IMIX de sus fichas; duplicación; breakout que
// descarga el hub y no la sucursal) y el SRX que inspecciona lo que el SSR no puede, elegido
// por capa con el mismo filtro que la plataforma SRX. Es lo que se integró de la herramienta
// externa que trajo el dueño; sus cifras no entraron (ver la cabecera del motor).

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s == null ? '' : s)
  .replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const fmt = (m) => (m == null ? 'sin dato' : (m >= 1000 ? `${(m / 1000).toFixed(m % 1000 ? 1 : 0)} Gbps` : `${m} Mbps`));
const miles = (n) => (n == null ? 'sin dato' : n.toLocaleString('en-US'));

let MODELS = [], SDWAN = [], BUNDLES = {}, CARE = {};

// Config común de la ficha, la misma distribución que Aruba (petición del dueño, 2026-10-19):
// tarjeta clavada y compacta con la foto oficial del equipo (frontal y trasera, de su guía de
// hardware), la lista clicable de los que cumplen y las características desplegables dentro de
// la propia tarjeta. ficha.js REEMPLAZA la config en cada render, así que va en todas las
// llamadas. `vistas` se rellena al cargar desde /data/juniper-vistas-equipos.json.
const FICHA_CFG = { vendor: 'juniper', listaCandidatos: true, panelFijo: true, detalleExpandible: true, vistas: null };
// El respaldo de ciclo de vida de Juniper es la tabla «SRX Series Hardware Dates & Milestones»:
// cubre los SRX y no dice nada de los Session Smart Router. Pintar «vigente» en un SSR por no
// salir en una tabla de SRX era afirmar vigencia por omisión (encontrado el 2026-10-19).
const CICLO_SSR = { respaldado: false, motivo: 'la fuente de ciclo de vida de Juniper (tabla de hitos de la serie SRX) no cubre los Session Smart Router' };

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
    <td class="n">${fmt(m.cap)}</td><td class="n">${fmt(m.capHmac)}</td><td>${esc(m.ifaces)}</td>
  </tr>`).join('');
}
let plat = 'srx', capa = 'ips', lastPick = null;
// Si el dimensionamiento se queda sin candidato, el BOM tiene que DECIRLO en vez de seguir
// mostrando el ultimo equipo que si cumplia.
let hayCandidato = true;
let bomFilas = [], bomMeta = {};
// Seguridad desacoplada del modo SSR: `{ modo: 'srx'|'sse'|'ninguna', pick, need, k }`.
// La lee el BOM para añadir el SRX o la línea del servicio cloud.
let companero = { modo: 'ninguna' };
const JM = window.JuniperMotor;
// Un número vacío vale su valor por defecto (el que enseña su placeholder): estado.js vacía
// los campos tecleables al arrancar sin enlace, así que un `value=` en el HTML no sobrevive.
const numOr = (id, def) => {
  const v = $(id) ? $(id).value : '';
  return v === '' || v == null ? def : (parseFloat(v) || 0);
};

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
    // Pendiente 34: el respaldo de ciclo de vida de ESTE fabricante, tal como lo declara
    // `legacyData/fuentes.js` con sus `campos`. Sin el, la ficha dice «el catalogo no trae el
    // ciclo de vida» en vez de afirmar vigencia por omision.
    FICHA.fijarCicloVida(d.cicloVida);
    MODELS = d.models || []; SDWAN = d.sdwan || [];
    // Las figuras son un adorno de la tarjeta: si el mapa no llega, la ficha declara el hueco
    // («sin foto oficial») y el dimensionamiento sigue igual.
    try {
      const rv = await fetch('/data/juniper-vistas-equipos.json');
      if (rv.ok) FICHA_CFG.vistas = await rv.json();
    } catch { /* sin figuras: la ficha lo dice */ }
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
// Conmutador «Ver características del equipo» de la tarjeta clavada (como Aruba): al desplegar,
// la columna suelta el sticky —una tarjeta más alta que la pantalla dejaría su final
// inalcanzable— y vuelve a clavarse al plegar.
document.addEventListener('click', (e) => {
  if (!e.target || e.target.id !== 'verdict-salto') return;
  const col = document.querySelector('.cols>.col-fijo');
  const det = document.getElementById('verdict-det');
  if (!col || !det) return;
  col.classList.toggle('expandida', !det.hidden);
  if (!det.hidden) window.scrollTo(0, Math.max(0, col.getBoundingClientRect().top + window.scrollY - 16));
});
document.querySelectorAll('.tabs button').forEach((b) => b.addEventListener('click', () => {
  document.querySelectorAll('.tabs button').forEach((x) => x.setAttribute('aria-selected', x === b));
  document.querySelectorAll('.tabpane').forEach((p) => { p.hidden = p.id !== `pane-${b.dataset.tab}`; });
  if (b.dataset.tab === 'bom') renderBom();
}));
$('platSeg').addEventListener('click', (e) => {
  const b = e.target.closest('button'); if (!b) return;
  [...$('platSeg').children].forEach((x) => x.setAttribute('aria-pressed', x === b));
  plat = b.dataset.v;
  render();
});
$('capaSeg').addEventListener('click', (e) => {
  const b = e.target.closest('button'); if (!b) return;
  [...$('capaSeg').children].forEach((x) => x.setAttribute('aria-pressed', x === b));
  capa = b.dataset.v; render();
});
['bw', 'unit', 'head', 'users', 'sesUser', 'chkIps', 'chkAtp', 'chkVpn', 'natUsers', 'natBloque',
  'ssrRol', 'ssrSpokes', 'ssrSimult', 'ssrBreakout', 'ssrCifrado', 'ssrDup', 'ssrSeg', 'ssrCapa', 'ssrAlcance']
  .forEach((id) => $(id).addEventListener('input', render));

// Lo que no aplica se oculta Y se marca `data-inactivo`: estado.js no lo manda en el enlace,
// porque un parámetro que no cuenta no puede viajar como si contara.
function marcar(id, activo) {
  const n = $(id); if (!n) return;
  n.style.display = activo ? '' : 'none';
  n.toggleAttribute('data-inactivo', !activo);
}
function aplicarDependencias() {
  const ssr = plat === 'ssr';
  const hub = $('ssrRol').value === 'hub';
  const srxComp = $('ssrSeg').value === 'srx';
  marcar('panelSrx', !ssr);
  marcar('panelSsr', ssr);
  marcar('campoSpokes', ssr && hub);
  marcar('campoSrxComp', ssr && srxComp);
  marcar('campoAlcance', ssr && srxComp && !hub);
  $('bwLbl').textContent = !ssr ? 'Ancho de banda a proteger' : (hub ? 'Caudal de cada sucursal' : 'Caudal del sitio');
  $('companeroPanel').hidden = !ssr;
  // La escalera de capas es del SRX: en el SSR no hay capas que pintar.
  $('perfPanel').hidden = ssr;
}
['pickModel', 'qty', 'licTier', 'termYears', 'chkHa'].forEach((id) => $(id).addEventListener('input', renderBom));

// La lista SI se reconstruye aqui, y solo aqui: cambia con la plataforma (los SRX y los
// Session Smart Router son catalogos distintos). Lo que ya no se decide aqui es a que equipo
// apunta — de eso se encarga `BOM.sincronizar`, igual que en los otros cinco dimensionadores.
function sincronizarConBom(m) {
  const lista = plat === 'srx' ? MODELS : SDWAN;
  const sel = $('pickModel');
  const antes = sel.value;
  // Combo agrupado por familia (ser): SRX 300, SRX 1500, SRX 1600, SRX 2300, SRX 4000
  // en la plataforma SRX; SSR 100 y SSR 1000 en la Session Smart. Orden determinista por
  // capacidad (fw en SRX, cap en SSR): la API puede servir el catalogo en cualquier orden.
  const capDe = (x) => (x.fw != null ? x.fw : (x.cap || 0));
  const grupos = new Map();
  for (const x of lista) {
    const g = x.ser || 'Otros';
    if (!grupos.has(g)) grupos.set(g, []);
    grupos.get(g).push(x);
  }
  const ordenados = [...grupos.entries()];
  for (const [, ms] of ordenados) ms.sort((a, b) => capDe(a) - capDe(b));
  ordenados.sort((a, b) => Math.min(...a[1].map(capDe)) - Math.min(...b[1].map(capDe)));
  sel.innerHTML = ordenados.map(([g, ms]) =>
    `<optgroup label="${esc(g)}">` + ms.map((x) => `<option value="${esc(x.id)}">${esc(x.id)} — ${esc(x.seg)}</option>`).join('') + `</optgroup>`
  ).join('');
  // Al reconstruir la lista se pierde el valor: se repone si ese equipo sigue existiendo en
  // la plataforma actual, para no tirar una eleccion manual al mover cualquier parametro.
  if (antes && lista.some((x) => x.id === antes)) sel.value = antes;
  BOM.sincronizar({ elegido: m ? m.id : null, render: renderBom });
}

/* ══ Motor ══ */
function render() {
  aplicarDependencias();
  const head = (parseFloat($('head').value) || 0) / 100;
  $('headVal').textContent = `${Math.round(head * 100)} %`;
  const bwMbps = (parseFloat($('bw').value) || 0) * (parseFloat($('unit').value) || 1);
  const need = Math.round(bwMbps * (1 + head));

  // Sin ancho de banda no hay recomendación (regla de preventa 2026-09-13): es el dato
  // mínimo del dimensionamiento; sin él la página pide valores en vez de proponer un
  // equipo a ciegas. Aplica a las dos plataformas (SRX y Session Smart).
  if (need <= 0) {
    lastPick = null; hayCandidato = false; companero = { modo: 'ninguna' };
    limpiarEscala();
    $('companero').innerHTML = '';
    sincronizarConBom(null);
    FICHA.render({ ...FICHA_CFG, contenedor: 'verdict', candidatos: [], recomendado: null,
      vacioTitulo: 'Ingrese valores para recomendar un equipo',
      vacioDetalle: '<p style="margin:0;font-size:13.5px">Escriba el <b>ancho de banda</b> del sitio (y si aplica, usuarios y sesiones) para que el dimensionador proponga los modelos que cumplen.</p>',
    });
    $('perfTiers').innerHTML = '';
    if ($('perfModel')) $('perfModel').textContent = '';
    $('sizingBox').innerHTML = '<p style="font-size:13.5px;color:var(--steel)">Ingrese valores para recomendar un equipo.</p>';
    return;
  }

  if (plat === 'ssr') return renderSsr(bwMbps, head);

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
  const { candidatos, sinCifra, outBySess } = JM.candidatosSrx(MODELS, ef.k, need, sessNeed);
  const ordenados = FICHA.ordenar(candidatos, (a, b) => a[ef.k] - b[ef.k]);
  const pick = FICHA.recomendar(ordenados);
  lastPick = pick;
  hayCandidato = !!pick;
  sincronizarConBom(pick);
  pintarEscala(MODELS, ef.k, need, pick, CAPA_INFO[ef.k].n);

  if (!pick) {
    const why = [];
    why.push(`<li>Requerimiento de <b>${fmt(need)}</b> en la capa <b>${esc(CAPA_INFO[ef.k].n)}</b>.</li>`);
    if (ef.elevada) why.push(`<li>La capa se elevó de <b>${esc(CAPA_INFO[capa].n)}</b> a <b>${esc(CAPA_INFO[ef.k].n)}</b> por ${ef.elevan.map((f) => esc(f.n)).join(', ')}.</li>`);
    if (sinCifra) why.push(`<li><b>${sinCifra}</b> modelo(s) quedaron fuera porque <b>el catálogo no publica su cifra en esta capa</b>. No se sustituye por la de otra capa: son mediciones distintas y hacerlo es lo que produce propuestas que se quedan cortas por un orden de magnitud. Se pueden consultar en la pestaña de BOM.</li>`);
    if (outBySess) why.push(`<li><b>${outBySess}</b> modelo(s) descartado(s) por sesiones concurrentes: hacen falta ${miles(sessNeed)}.</li>`);
    why.push('<li>Si el diseño no exige inspección avanzada sobre todo el tráfico, evaluar una capa menos profunda o segmentar qué tráfico se inspecciona — es la palanca que más capacidad libera.</li>');
    FICHA.render({ ...FICHA_CFG, contenedor: 'verdict', candidatos: [], recomendado: null,
      vacioTitulo: 'Ningún modelo del catálogo cumple en esta capa',
      vacioDetalle: `<ul style="margin:0;padding-left:18px;font-size:13.5px">${why.join('')}</ul>`,
    });
    $('perfTiers').innerHTML = '';
    $('sizingBox').innerHTML = '<p style="font-size:13.5px;color:var(--steel)">Sin candidato para los parámetros actuales.</p>';
    return;
  }

  FICHA.render({ ...FICHA_CFG, contenedor: 'verdict',
    candidatos: ordenados,
    recomendado: pick.id,
    etiqueta: (m) => `${m.id} — ${m.seg} · ${fmt(m[ef.k])}`,
    etiquetaCand: (m) => `${m.seg} · ${fmt(m[ef.k])}`,
    // Escalón N+1 (ficha.js): la cifra de la capa que dimensiona. Juniper no tiene lista de precios.
    escalon: { metrica: (m) => m[ef.k] ?? null, fmt, nombre: CAPA_INFO[ef.k].n, precio: () => null },
    titulo: (m) => m.id,
    subtitulo: (m) => `${m.ser} · ${m.seg}`,
    medidores: (m) => medidoresDe(m, ef.k, need, sessNeed),
    porQue: (m) => porQueDe(m, ef, need, sessNeed, sinCifra),
    secciones: (m) => seccionesDe(m),
    alCambiar: (id) => {
      const m = MODELS.find((x) => x.id === id);
      if (!m) return;
      pintarPerf(m, ef.k); pintarResumen(m, ef, need, sessNeed);
      pintarEscala(MODELS, ef.k, need, m, CAPA_INFO[ef.k].n);
      $('pickModel').value = id; renderBom();
    },
  });
  const elegido = MODELS.find((m) => m.id === FICHA.elegido('verdict')) || pick;
  if (elegido !== pick) pintarEscala(MODELS, ef.k, need, elegido, CAPA_INFO[ef.k].n);
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
    FICHA.seccionPuertos(m),
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
    ${filaNat()}
  </tbody></table>`;
}

// Pool de NAT por bloques de puertos: aritmética, no un eje del equipo (el catálogo no publica
// una cifra de NAT por modelo, así que no elige ni descarta nada).
function filaNat() {
  const r = JM.poolCgnat({ usuarios: numOr('natUsers', 0), bloque: parseInt($('natBloque').value, 10) || 1024 });
  if (!r) return '';
  return `<tr><td>Pool NAT (PBA)</td><td class="n"><b>${miles(r.ips)}</b> IPv4 públicas · /${r.prefijo} (${miles(r.enPrefijo)})</td></tr>
    <tr><td>Usuarios por IPv4</td><td class="n">${miles(r.porIp)} con ${miles(r.bloque)} puertos cada uno</td></tr>`;
}

/* ══ SSR ══ */
function escenarioSsr(bwMbps, head) {
  return {
    rol: $('ssrRol').value,
    bwMbps,
    spokes: numOr('ssrSpokes', 0),
    simultPct: numOr('ssrSimult', 100),
    breakoutPct: numOr('ssrBreakout', 70),
    cifrado: $('ssrCifrado').value,
    dupPct: numOr('ssrDup', 0),
    headroomPct: head * 100,
    alcance: $('ssrAlcance').value,
  };
}

function renderSsr(bwMbps, head) {
  const esc0 = escenarioSsr(bwMbps, head);
  const d = JM.demandaSsr(esc0);
  const need = d.need;
  const hub = esc0.rol === 'hub';
  $('perfTiers').innerHTML = '';
  $('perfModel').textContent = '';
  renderCompanero(esc0);

  if (need <= 0) {
    lastPick = null; hayCandidato = false; sincronizarConBom(null); limpiarEscala();
    FICHA.render({ ...FICHA_CFG, cicloVida: CICLO_SSR, contenedor: 'verdict', candidatos: [], recomendado: null,
      vacioTitulo: hub ? 'Ingrese las sucursales que llegan al hub' : 'Ingrese valores para recomendar un equipo',
      vacioDetalle: hub
        ? '<p style="margin:0;font-size:13.5px">El hub se dimensiona con el overlay de sus sucursales: hace falta cuántas son, su caudal y qué parte sale en local. Con un breakout del 100 % no llega nada al hub.</p>'
        : '<p style="margin:0;font-size:13.5px">Escriba el <b>caudal del sitio</b> para que el dimensionador proponga los modelos que cumplen.</p>' });
    $('sizingBox').innerHTML = '<p style="font-size:13.5px;color:var(--steel)">Sin demanda que dimensionar.</p>';
    return;
  }

  // Se dimensiona con la cifra IMIX de la capa de cifrado; un modelo sin ella se aparta.
  const k = d.capa.k;
  const { candidatos, sinCifra } = JM.candidatosSsr(SDWAN, k, need);
  const ordenados = FICHA.ordenar(candidatos, (a, b) => a[k] - b[k]);
  const pick = FICHA.recomendar(ordenados);
  lastPick = pick;
  hayCandidato = !!pick;
  sincronizarConBom(pick);
  pintarEscala(SDWAN, k, need, pick, `${d.capa.n} (IMIX)`);
  if (!pick) {
    const tope = SDWAN.reduce((t, m) => (m[k] != null && m[k] > (t ? t[k] : -1) ? m : t), null);
    FICHA.render({ ...FICHA_CFG, cicloVida: CICLO_SSR, contenedor: 'verdict', candidatos: [], recomendado: null,
      vacioTitulo: `Ningún Session Smart Router del catálogo llega a ${fmt(need)} ${d.capa.n.toLowerCase()}`,
      vacioDetalle: `<p class="warn">${tope ? `El mayor del catálogo en esta capa es el ${esc(tope.id)} con ${fmt(tope[k])}. ` : ''}Opciones: otra capa de cifrado si el diseño lo admite, repartir la carga en varias unidades o evaluar la versión virtual sobre servidor.${sinCifra ? ` ${sinCifra} modelo(s) no publican cifra en esta capa y se apartan.` : ''}</p>${desgloseSsr(d)}` });
    $('sizingBox').innerHTML = desgloseSsr(d);
    return;
  }
  FICHA.render({ ...FICHA_CFG, cicloVida: CICLO_SSR, contenedor: 'verdict', candidatos: ordenados, recomendado: pick.id,
    etiqueta: (m) => `${m.id} — ${m.seg} · ${fmt(m[k])}`,
    etiquetaCand: (m) => `${m.seg} · ${fmt(m[k])}`,
    escalon: { metrica: (m) => m[k] ?? null, fmt, nombre: d.capa.n, precio: () => null },
    titulo: (m) => m.id,
    subtitulo: (m) => `${m.ser} · ${m.seg}`,
    medidores: (m) => [{ etq: `${hub ? 'Overlay' : 'Caudal'} · ${d.capa.n} (IMIX)`, val: need, tope: m[k], txt: `${fmt(need)} / ${fmt(m[k])}` }],
    porQue: (m) => porQueSsr(m, d, esc0),
    secciones: (m) => [{ titulo: 'Características',
      filas: [['Serie', esc(m.ser)], ['Segmento', esc(m.seg)],
        ['Sin cifrar (IMIX)', `${fmt(m.cap)} · ${fmt(m.cap1500)} con 1.500 B`],
        ['Solo cifrado (IMIX)', `${fmt(m.capCif)} · ${fmt(m.capCif1500)} con 1.500 B`],
        ['Cifrado + HMAC (IMIX)', `${fmt(m.capHmac)} · ${fmt(m.capHmac1500)} con 1.500 B`],
        ['Inspección de contenido', '<span class="warn">la ficha no publica IDP ni filtrado URL: va desacoplada</span>'],
        ['Interfaces', esc(m.ifaces), true],
        ['Precio de lista ref.', '<span class="warn">sin lista de precios Juniper</span>']] },
    FICHA.seccionPuertos(m), FICHA.seccionAlimentacion(m)],
    alCambiar: (id) => {
      pintarEscala(SDWAN, k, need, SDWAN.find((x) => x.id === id) || pick, `${d.capa.n} (IMIX)`);
      $('pickModel').value = id; renderBom();
    },
  });
  const elegidoSsr = SDWAN.find((m) => m.id === FICHA.elegido('verdict'));
  if (elegidoSsr && elegidoSsr !== pick) pintarEscala(SDWAN, k, need, elegidoSsr, `${d.capa.n} (IMIX)`);
  $('sizingBox').innerHTML = desgloseSsr(d);
}

/* ══ ESCALA DE CAPACIDAD ══
   La misma escala logarítmica que Aruba y Cisco, con la cifra que DIMENSIONA (capa de
   inspección del SRX o capa de cifrado del SSR, nunca la portada). Un modelo sin esa cifra no
   se pinta: no hay dónde ponerlo sin inventarla. */
function limpiarEscala() {
  const need = $('need'); if (!need) return;
  need.style.left = '0%'; $('needLbl').textContent = '—';
  $('track').querySelectorAll('.dot,.tick,.pickLabel').forEach((e) => e.remove());
}
function pintarEscala(lista, k, needMbps, elegido, nombre) {
  const track = $('track'); if (!track) return;
  limpiarEscala();
  const caps = lista.map((m) => m[k]).filter((v) => typeof v === 'number' && v > 0);
  if (!caps.length || !(needMbps > 0)) return;
  $('ladderLbl').textContent = `Escala de capacidad — ${nombre} de cada modelo vs. requerimiento (logarítmica)`;
  const lo = Math.log10(Math.max(10, Math.min(...caps, needMbps) / 2));
  const hi = Math.log10(Math.max(...caps, needMbps) * 1.3);
  const x = (v) => ((Math.log10(Math.max(v, 1)) - lo) / (hi - lo)) * 100;
  const need = $('need');
  need.style.left = `${Math.min(Math.max(x(needMbps), 0), 99)}%`;
  $('needLbl').textContent = fmt(needMbps);
  need.classList.toggle('flip', x(needMbps) > 60);
  [10, 100, 1000, 10000, 100000, 1000000].forEach((v) => {
    const pct = x(v); if (pct < 0 || pct > 100) return;
    const t = document.createElement('div'); t.className = 'tick'; t.style.left = `${pct}%`;
    t.innerHTML = `<i></i><b>${v >= 1e6 ? `${v / 1e6}T` : v >= 1000 ? `${v / 1000}G` : `${v}M`}</b>`;
    track.appendChild(t);
  });
  const lbl = document.createElement('div'); lbl.className = 'pickLabel'; lbl.id = 'pickLbl'; lbl.style.display = 'none';
  track.appendChild(lbl);
  for (const m of lista) {
    if (typeof m[k] !== 'number') continue;
    const d = document.createElement('div');
    d.className = `dot${m[k] >= needMbps ? ' ok' : ''}${elegido && m.id === elegido.id ? ' pick' : ''}`;
    d.style.left = `${x(m[k])}%`; d.title = `${m.id}: ${fmt(m[k])}`;
    track.appendChild(d);
    if (elegido && m.id === elegido.id) { lbl.textContent = m.id; lbl.style.left = `${x(m[k])}%`; lbl.style.display = 'block'; }
  }
}

function porQueSsr(m, d, e) {
  const hub = e.rol === 'hub';
  const f = [];
  const k = d.capa.k;
  f.push(`Demanda de diseño <b>${fmt(d.need)}</b> contra <b>${fmt(m[k])}</b> de <b>${esc(d.capa.n)}</b> en IMIX — holgura ${Math.round((1 - d.need / m[k]) * 100)} %.`);
  const portada = m[d.capa.k1500];
  if (portada != null && portada / m[k] >= 1.5) f.push(`<b class="warn">Cifra de portada:</b> con paquetes de 1.500 B la ficha da <b>${fmt(portada)}</b> en esta capa, ${(portada / m[k]).toFixed(1)}x lo que aplica con tráfico mezclado. No dimensiona.`);
  if (k !== 'cap' && m.cap != null) f.push(`Sin cifrar, el mismo equipo daría ${fmt(m.cap)}: el cifrado es la capa que más capacidad consume en el SSR. Lo que ya viaja en HTTPS o IPsec no se vuelve a cifrar.`);
  f.push(hub
    ? `<b>Hub:</b> ${miles(Math.floor(e.spokes))} sucursales de ${fmt(e.bwMbps)}, con un ${Math.round(e.breakoutPct)} % de salida local y un ${Math.round(e.simultPct)} % de simultaneidad: al hub llegan <b>${fmt(Math.round(d.base))}</b> de overlay.`
    : `<b>Sucursal:</b> la salida local (${Math.round(e.breakoutPct)} %) no descarga el equipo, porque ese tráfico también lo enruta el SSR. Lo que cambia es qué parte viaja por el overlay.`);
  if (d.duplicacion > 0) f.push(`<b>Duplicación de paquetes</b> sobre el ${Math.round(d.duplicacion * 100)} % del tráfico: esa parte sale dos veces y cuenta doble.`);
  f.push(`Interfaces: ${esc(m.ifaces)}.`);
  f.push('<b>Gestión desde Mist.</b> La suscripción es por dispositivo y no está en este catálogo: confirmarla con el distribuidor.');
  f.push('Cifras de las fichas de las líneas SSR100 y SSR1000 (Session Smart v5.4). <b>Breakout, simultaneidad y duplicación</b> son decisiones de diseño declaradas; el desglose enseña cada paso.');
  return `<ul style="margin:8px 0 0;padding-left:18px;font-size:13.5px">${f.map((x) => `<li>${x}</li>`).join('')}</ul>`;
}

function desgloseSsr(d) {
  return `<table class="ficha-tabla"><tbody>
    ${d.pasos.map((p, i) => `<tr><td>${esc(p.n)}</td><td class="n">${i === d.pasos.length - 1 ? `<b>${fmt(Math.round(p.v))}</b>` : fmt(Math.round(p.v))}</td></tr>`).join('')}
  </tbody></table>
  <p class="hint" style="margin-top:8px">need = ⌈ base × (1 + duplicación) × (1 + margen) ⌉, contra la cifra IMIX de «${esc(d.capa.n)}». Sin factor IMIX ni recargo por seguridad: la cifra ya es IMIX y la inspección no va en el SSR.</p>`;
}

// Seguridad desacoplada. El SRX se elige con el MISMO filtro que la plataforma SRX: un modelo
// sin cifra en la capa se aparta con su motivo y el fin de venta lo decide FICHA.recomendar.
function renderCompanero(e) {
  const modo = $('ssrSeg').value;
  const caja = $('companero');
  if (modo === 'ninguna') {
    companero = { modo };
    caja.innerHTML = '<p style="font-size:13.5px;margin:0">Sin inspección de contenido. El SSR aplica <b>zero-trust por sesión</b> (solo pasa lo que una política de servicio permite) y firewall de estado; no hay IPS, antimalware ni filtrado de URL en este diseño.</p>';
    return;
  }
  if (modo === 'sse') {
    companero = { modo };
    caja.innerHTML = `<p style="font-size:13.5px;margin:0"><b>Inspección en la nube (Juniper Secure Edge).</b> El tráfico de salida local se encamina al servicio, que se contrata por usuario: no hay cifra de equipo que dimensionar y el SSR no carga inspección. El BOM añade la línea <b>sin SKU ni precio</b>, porque ninguno de los dos está en el material disponible.</p>`;
    return;
  }
  const insp = JM.inspeccionSrx(e);
  const k = $('ssrCapa').value;
  if (insp.need <= 0) {
    companero = { modo, pick: null, need: 0, k };
    caja.innerHTML = '<p style="font-size:13.5px;margin:0;color:var(--steel)">Sin tráfico que inspeccionar con los parámetros actuales.</p>';
    return;
  }
  const { candidatos, sinCifra } = JM.candidatosSrx(MODELS, k, insp.need, 0);
  const ordenados = FICHA.ordenar(candidatos, (a, b) => a[k] - b[k]);
  const pick = FICHA.recomendar(ordenados);
  companero = { modo, pick, need: insp.need, k };
  const que = insp.soloDia ? 'la salida local a Internet' : (e.rol === 'hub' ? 'todo el overlay que llega al hub' : 'todo el tráfico del sitio');
  const apartados = sinCifra ? `<li><b>${sinCifra}</b> modelo(s) no publican cifra de <b>${esc(CAPA_INFO[k].n)}</b> y se apartan: no se rellena con la de otra capa.</li>` : '';
  if (!pick) {
    caja.innerHTML = `<p class="warn" style="margin:0 0 6px"><b>Ningún SRX del catálogo inspecciona ${fmt(insp.need)} en ${esc(CAPA_INFO[k].n)}.</b></p>
      <ul style="margin:0;padding-left:18px;font-size:13.5px"><li>Se inspecciona ${que}.</li>${apartados}
      <li>Opciones: inspeccionar solo la salida local, bajar de capa o repartir en un clúster.</li></ul>`;
    return;
  }
  const foto = FICHA_CFG.vistas && FICHA_CFG.vistas[pick.id] && FICHA_CFG.vistas[pick.id].front;
  caja.innerHTML = (foto ? `<figure class="comp-foto"><img src="${esc(foto)}" alt="Vista frontal del ${esc(pick.id)}, de su guía de hardware" loading="lazy"></figure>` : '')
    + `<p class="model" style="font-size:26px;margin:0 0 2px">${esc(pick.id)}</p>
    <p class="family" style="margin-bottom:10px">${esc(pick.ser)} · ${esc(pick.seg)}</p>
    <div class="meter"><b>${esc(CAPA_INFO[k].n)} <em>${fmt(insp.need)} / ${fmt(pick[k])}</em></b>
      <div class="bar"><i class="${insp.need / pick[k] > 0.8 ? 'tight' : 'good'}" style="width:${Math.min(100, (insp.need / pick[k]) * 100)}%"></i></div></div>
    <ul style="margin:8px 0 0;padding-left:18px;font-size:13.5px">
      <li>Inspecciona ${que}: <b>${fmt(Math.round(insp.mbps))}</b> más el margen, contra la cifra de <b>${esc(CAPA_INFO[k].n)}</b>. Sin factor IMIX ni recargo: la cifra de la capa ya es la medida que aplica.</li>
      ${pick.fw != null && pick[k] && pick.fw / pick[k] >= 2 ? `<li><b class="warn">Cifra de portada:</b> ${fmt(pick.fw)} con paquetes grandes, ${Math.round(pick.fw / pick[k])}x lo que aplica aquí.</li>` : ''}
      ${apartados}
      ${ordenados.length > 1 ? `<li>Otros que cumplen: ${ordenados.filter((m) => m !== pick).slice(0, 4).map((m) => `${esc(m.id)} (${fmt(m[k])})`).join(', ')}.</li>` : ''}
      <li>Va en el BOM como «Firewall desacoplado», con su suscripción.</li>
    </ul>`;
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
  // Seguridad desacoplada del modo SSR. No es `cat: 'Equipo'` a propósito: el traspaso al
  // cotizador manda el equipo principal por su nombre y el resto como referencias; con esa
  // categoría el SRX se perdería en el camino (bom.js excluye las filas de equipo).
  if (plat === 'ssr' && companero.modo === 'srx' && companero.pick) {
    const c = companero.pick;
    filas.push({ cat: 'Firewall desacoplado', desc: c.id, sku: null, qty, unit: null,
      nota: `${c.ser} · inspección ${CAPA_INFO[companero.k].n} de ${fmt(companero.need)} contra ${fmt(c[companero.k])}` });
    filas.push({ cat: 'Firewall desacoplado', desc: `${(BUNDLES[tier] || {}).n || tier} para ${c.id} — ${term} año(s)`, sku: null, qty, unit: null,
      nota: 'Suscripción de seguridad del SRX, una por unidad.' });
  }
  if (plat === 'ssr' && companero.modo === 'sse') {
    filas.push({ cat: 'Seguridad cloud', desc: `Juniper Secure Edge (SSE) — ${term} año(s)`, sku: null, qty: 1, unit: null,
      nota: 'Se contrata por usuario: confirmar cantidad, SKU y precio con el distribuidor.' });
  }

  const meta = {
    titulo: `Lista de materiales — ${m.id}`,
    supuestos: { vendor: 'juniper', fabricante: 'Juniper', modelo: m.id, serie: m.ser },
    subtitulo: `${m.ser} · término ${term} año(s)`,
    archivo: `BOM_${m.id}`,
    notas: ['', 'NOTAS DE PREVENTA',
      '  Ninguna linea lleva precio: no hay lista de precios de Juniper en el material',
      '  disponible. Confirmar SKU, nivel de suscripcion y precio con el distribuidor.',
      '  Las cifras de rendimiento son por capa de inspeccion: la de portada (paquetes',
      '  grandes) no sirve para dimensionar.',
      ...(plat === 'ssr' ? ['  SD-WAN: capacidades por capa de cifrado de las fichas SSR100/SSR1000;',
        '  breakout, simultaneidad y duplicacion son decisiones de diseno declaradas.'] : [])],
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
  const st = ESTADO.vincular({ campos: ['bw','unit','head','users','sesUser','chkIps','chkAtp','chkVpn','natUsers','natBloque',
    'ssrRol','ssrSpokes','ssrSimult','ssrBreakout','ssrCifrado','ssrDup','ssrSeg','ssrCapa','ssrAlcance',
    'platSeg','capaSeg','verdict-sel'] });
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
