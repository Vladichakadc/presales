'use strict';
// El atajo del DOM, arriba del todo: lo usan funciones declaradas antes de donde estaba.
const $ = id => document.getElementById(id);
/* ═══════════════════════════════════════
   DIMENSIONADOR CISCO (rediseño 2026-10-20)

   Todo cálculo vive en /js/cisco-motor.js (puro, probado en test/cisco-motor.test.js); esta
   página lee el formulario, le pasa el escenario y pinta. Las figuras oficiales de cada equipo
   (frontal y trasera, sin pérdida, con su pie) están en /data/cisco-vistas-equipos.json y las
   pinta FICHA con el opt-in `vistas`, como en Aruba, Fortinet, Huawei y MikroTik.
   ═══════════════════════════════════════ */
const M = window.CiscoMotor;
const VENDOR = 'cisco';
let bomFilas = [], bomMeta = {};

let MODELS = [];
let OPTICS = {};
let OPTIC_LABEL = {};
let PARTS_DESC = {};
let SMARTNET = {};
let LIC_G2 = {};
// Tiers, términos y reglas de la suscripción DNA (FAQ de DNA y guías de pedido): `LICENCIAS_DNA`.
let LIC_DNA = null;
let MOD_G2 = [];
let MOD_C8K = [];
// Cisco Secure Access (guía de pedido): `SECURE_ACCESS`.
let SA = null;
// Cisco Secure Firewall para el firewall dedicado: `SECURE_FIREWALL`.
let SFW = null;
// Categoría y ancho de banda de cada módulo celular (ficha de los módulos): `CELULAR`.
let CELULAR = {};
// Recursos de los componentes de control de SD-WAN: `CONTROLADORES_SDWAN`.
let CTRL = null;
let VISTAS = null;

let dirMult = 2, mode = 'link', crit = 'low', lastPick = null, ultimaEval = null;
// Si el dimensionamiento se quedo sin candidato, el BOM tiene que DECIRLO: hasta el 2026-09
// seguia cotizando el ultimo equipo que si cumplia, en silencio.
let hayCandidato = true;

// Fin de venta VENCIDO frente a ANUNCIADO lo decide la misma regla que ordena y filtra los
// candidatos (ficha.js), para que la ficha, el BOM y la exportacion no puedan discrepar.
const vencido = m => !!(m && FICHA.rango(m) === 2);

// El equipo del dimensionamiento se lleva solo al BOM. La regla vive en js/bom.js.
function sincronizarConBom(elegido){
  BOM.sincronizar({elegido:elegido ? elegido.id : null, render:renderBom});
}
function llevarABom(id){
  BOM.sincronizar({elegido:id || null, render:renderBom});
}

/* ── Pestañas y grupos ── */
document.querySelectorAll('.tabs button').forEach(b => b.addEventListener('click', () => {
  document.querySelectorAll('.tabs button').forEach(x => x.setAttribute('aria-selected', x === b));
  ['calc', 'bom', 'optics', 'cat', 'src'].forEach(t => $('pane-' + t).hidden = (t !== b.dataset.tab));
}));
function grupo(id, alElegir){
  $(id).addEventListener('click', e => {
    const b = e.target.closest('button'); if(!b) return;
    [...$(id).children].forEach(x => x.setAttribute('aria-pressed', x === b));
    alElegir(b.dataset.v);
    render();
  });
}
grupo('modeSeg', v => { mode = v; });
grupo('dirSeg', v => { dirMult = +v; });
grupo('critSeg', v => { crit = v; });

const ENTRADAS = ['bw', 'unit', 'sites', 'conc', 'head', 'profile', 'plataforma', 'diaPct', 'seguridad', 'chkTls',
  'chkFec', 'fecPct', 'dupPct', 'tuneles', 'rutas', 'sesiones', 'dispositivos', 'cgnatUsuarios', 'cgnatBloque',
  'chkRedund', 'chk4g', 'chkNim', 'chkSm', 'chkMacsec', 'chkPoe', 'poeW', 'chkHa', 'chkHaTloc', 'chkAppqoe', 'appqoeCon',
  'topologia', 'topoSedes', 'topoHubs', 'topoColores', 'topoColoresHub', 'topoVen', 'enlacesData', 'fwCapa'];
ENTRADAS.forEach(id => $(id).addEventListener('input', render));
// Las licencias se pintan en las dos pestañas: el centro del dimensionamiento y el BOM.
const CAMPOS_SA = ['saLic', 'saNivel', 'saUsuarios', 'saPrivado', 'saIps', 'ctrlEquipos', 'ctrlSaie'];
['licGestion', 'licNivel', 'licVpns', 'secUrl', 'secMalware', 'termYears', ...CAMPOS_SA].forEach(id => $(id).addEventListener('input', () => { render(); }));
['pickModel', 'qty', 'modNim', 'modSm', 'modPim', 'optSel', 'optQty'].forEach(id => $(id).addEventListener('input', renderBom));

/* ── Ayudas de presentación ── */
const fmt = M.fmt;
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;'}[c]));
const miles = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
const base = b => `<span class="base">${b ? esc(b) : 'base no consta'}</span>`;
function cifraHtml(m, k){
  const c = M.cifra(m, k);
  return c.v == null ? 'sin dato' : `${fmt(c.v)}${base(c.base)}`;
}
const numDe = id => { const v = parseFloat($(id).value); return Number.isFinite(v) && v > 0 ? v : 0; };
// La referencia de pedido: la del catálogo, el nombre del modelo en la G2 (la guía de pedido los
// pide así) o el PID que cita el boletín de fin de venta. Si no consta, se consulta en CCW.
const pidDe = m => m.hwSku || (/Secure Router \(G2\)/.test(m.ser) ? m.id.replace(/^Cisco Secure Router /, '') : null)
  || (m.eolAnnounced && m.eolAnnounced.pid) || null;

function parametros(){
  return {
    modo:mode, bwMbps:(parseFloat($('bw').value) || 0) * parseFloat($('unit').value), dirMult,
    sedes:Math.max(1, parseInt($('sites').value, 10) || 1), concPct:+$('conc').value,
    headPct:+$('head').value, diaPct:mode === 'hub' ? 0 : +$('diaPct').value,
    fecPct:$('chkFec').checked ? numDe('fecPct') : 0, dupPct:numDe('dupPct'),
    perfil:$('profile').value, plataforma:$('plataforma').value,
    seguridad:mode === 'link' ? $('seguridad').value : 'ninguna', tls:mode === 'link' && $('chkTls').checked,
    escala:{tuneles:numDe('tuneles'), rutas:numDe('rutas'), sesiones:numDe('sesiones'), dispositivos:numDe('dispositivos')},
    enlaces:leerEnlaces(), catalogo:catalogoPuertos(),
    topologia:{topologia:$('topologia').value, sedes:$('topoSedes').value, hubs:$('topoHubs').value,
      colores:$('topoColores').value, coloresHub:$('topoColoresHub').value, ven:$('topoVen').checked},
    requisitos:{dualPsu:$('chkRedund').checked, celular:$('chk4g').checked, nim:$('chkNim').checked, sm:$('chkSm').checked,
      macsec:$('chkMacsec').checked, poe:$('chkPoe').checked, poeW:numDe('poeW'),
      appqoe:$('chkAppqoe').checked, appqoeConexiones:numDe('appqoeCon')},
    ha:mode === 'link' && $('chkHa').checked, haTloc:mode === 'link' && $('chkHa').checked && $('chkHaTloc').checked,
  };
}
// El tier DNA sale del tráfico del escenario (todo el WAN en SD-WAN, solo el cifrado en
// autónomo), y los módulos de voz piden Advantage: solo cuentan los del equipo que está en el BOM.
/* ── ENLACES WAN Y PUERTOS (2026-10-21) ──
   Filas {tipo, rol, entrega, fibra, km} en el campo oculto #enlacesData (JSON), que viaja en el
   enlace compartido y en los perfiles. La fibra y el tramo solo se piden en una entrega de fibra: con
   los dos, el motor elige la óptica por el alcance de su ficha. Vacío es el caso de siempre: sin enlaces no se comprueban puertos.
   Las filas se repintan solo cuando el campo cambia por fuera (un enlace o un perfil cargado), para
   no perder el foco al editar una. */
const ENLACE_NUEVO = {tipo:'internet', rol:'principal', entrega:'cobre-1g'};
let enlacesPintados = null;
function leerEnlaces(){
  try{ const v = JSON.parse($('enlacesData').value || '[]'); return Array.isArray(v) ? v : []; }
  catch { return []; }
}
function escribirEnlaces(l){
  $('enlacesData').value = l.length ? JSON.stringify(l) : '';
  enlacesPintados = $('enlacesData').value;
  // El evento despierta el volcado de ESTADO y el repintado (el campo está en ENTRADAS).
  $('enlacesData').dispatchEvent(new Event('input', {bubbles:true}));
}
function catalogoPuertos(){ return {optics:OPTICS, modulosG2:MOD_G2, modulosC8k:MOD_C8K}; }
const medioDe = e => (e.tipo !== 'celular' && M.ENTREGAS[e.entrega] ? M.ENTREGAS[e.entrega].medio : null);
const esFibra = e => medioDe(e) === 'fibra';
// El tramo se declara en fibra y en cobre (el cobre llega a 100 m, o a 30 m con un SFP-10G-T-X).
const conTramo = e => medioDe(e) === 'fibra' || medioDe(e) === 'cobre';
function pintarEnlaces(){
  const l = leerEnlaces();
  enlacesPintados = $('enlacesData').value || '';
  const opt = (mapa, v) => Object.entries(mapa).map(([k, t]) => `<option value="${esc(k)}"${k === v ? ' selected' : ''}>${esc(t)}</option>`).join('');
  const entregas = Object.fromEntries(Object.entries(M.ENTREGAS).map(([k, e]) => [k, `Entrega: ${e.n}`]));
  const fibras = {'':'Fibra sin definir', ...Object.fromEntries(Object.entries(M.FIBRAS).map(([k, t]) => [k, t[0].toUpperCase() + t.slice(1)]))};
  $('enlacesBox').innerHTML = l.length ? l.map((e, i) => `<div class="enlace-fila" data-i="${i}">
    <span class="enl-n" aria-hidden="true">${i + 1}</span>
    <select data-k="tipo" aria-label="Tipo del enlace ${i + 1}">${opt(M.TIPOS_ENLACE, e.tipo)}</select>
    <select data-k="rol" aria-label="Rol del enlace ${i + 1}">${opt(M.ROLES_ENLACE, e.rol)}</select>
    ${e.tipo === 'celular' ? `<input type="number" data-k="bajada" min="0" step="any" value="${esc(e.bajada ?? '')}" placeholder="Bajada Mbps" aria-label="Bajada que pide el enlace ${i + 1} en Mbps" autocomplete="off">
    <input type="number" data-k="subida" min="0" step="any" value="${esc(e.subida ?? '')}" placeholder="Subida Mbps" aria-label="Subida que pide el enlace ${i + 1} en Mbps" autocomplete="off">`
      : `<select data-k="entrega" aria-label="Entrega del enlace ${i + 1}">${opt(entregas, e.entrega)}</select>`}
    ${esFibra(e) ? `<select data-k="fibra" aria-label="Tipo de fibra del enlace ${i + 1}">${opt(fibras, e.fibra || '')}</select>` : ''}
    ${conTramo(e) ? `<input type="number" data-k="km" min="0" step="any" value="${esc(e.km ?? '')}" placeholder="Tramo km" aria-label="Distancia del tramo del enlace ${i + 1} en km" autocomplete="off">` : ''}
    <button type="button" class="btn ghost enl-quitar" data-quitar="${i}" aria-label="Quitar el enlace ${i + 1}">×</button>
  </div>`).join('') : '<p class="hint" style="margin:0">Sin enlaces declarados: los puertos no se comprueban.</p>';
  $('btnAddEnlace').disabled = l.length >= M.MAX_ENLACES;
}
$('enlacesBox').addEventListener('input', e => {
  const f = e.target.closest('.enlace-fila'); const k = e.target.dataset.k;
  if(!f || !k) return;
  const l = leerEnlaces(), fila = l[+f.dataset.i];
  const antes = medioDe(fila);
  fila[k] = e.target.value;
  if(k === 'tipo' && e.target.value !== 'celular' && !fila.entrega) fila.entrega = ENLACE_NUEVO.entrega;
  // Lo que no significa nada en esta entrega no viaja en el enlace: la fibra fuera de una fibra y
  // el tramo en un DSL o un celular.
  if(!esFibra(fila)) delete fila.fibra;
  if(!conTramo(fila)) delete fila.km;
  if(fila.tipo !== 'celular'){ delete fila.bajada; delete fila.subida; }
  for(const c of ['fibra', 'km', 'bajada', 'subida']) if(fila[c] === '') delete fila[c];
  escribirEnlaces(l);
  // Pasar a celular o cambiar de medio cambia la fila: se repinta y el foco vuelve al campo.
  if(k === 'tipo' || (k === 'entrega' && antes !== medioDe(fila))){
    pintarEnlaces();
    const t = $('enlacesBox').querySelector(`.enlace-fila[data-i="${f.dataset.i}"] [data-k="${k}"]`); if(t) t.focus();
  }
});
$('enlacesBox').addEventListener('click', e => {
  const b = e.target.closest('[data-quitar]'); if(!b) return;
  const l = leerEnlaces(); l.splice(+b.dataset.quitar, 1); escribirEnlaces(l); pintarEnlaces();
  $('btnAddEnlace').focus();
});
$('btnAddEnlace').addEventListener('click', () => {
  const l = leerEnlaces(); if(l.length >= M.MAX_ENLACES) return;
  // El primero es el principal; los siguientes, respaldo del otro tipo: el caso habitual.
  l.push(l.length ? {...ENLACE_NUEVO, tipo:l.some(x => x.tipo === 'mpls') ? 'internet' : 'mpls', rol:'respaldo'} : {...ENLACE_NUEVO});
  escribirEnlaces(l); pintarEnlaces();
  const ult = $('enlacesBox').querySelector('.enlace-fila:last-child select'); if(ult) ult.focus();
});

function modulosElegidos(m){
  if(!m || $('pickModel').value !== m.id) return [];
  const lista = modulosDe(m).lista;
  return ['modNim', 'modSm', 'modPim'].map(id => lista.find(x => x.sku === $(id).value)).filter(Boolean);
}
function opcionesLicencia(p, m){
  return {gestion:$('licGestion').value, nivel:$('licNivel').value, seguridad:p.seguridad,
    url:$('secUrl').checked, malware:$('secMalware').checked, anios:+$('termYears').value || 1,
    trafico:M.traficoLicencia(M.demanda(p), p), vpns:numDe('licVpns'), modulos:modulosElegidos(m)};
}
const filaDe = id => (ultimaEval ? ultimaEval.filas.find(f => f.m.id === id) : null) || null;
// La suscripción de Secure Access, solo con la salida a Internet hacia un SSE.
// El firewall dedicado (propuesta 3.2): solo con «Firewall dedicado aparte» y salida a Internet.
function firewallDe(p){
  if(p.seguridad !== 'desacoplada') return null;
  return M.firewallDedicado(M.demanda(p), {capa:$('fwCapa').value, tls:p.tls, sesiones:(p.escala || {}).sesiones}, SFW);
}
function lineasSecureAccess(p){
  if(p.seguridad !== 'sse') return {filas:[], avisos:[]};
  return M.secureAccess({licencia:$('saLic').value, nivel:$('saNivel').value, usuarios:numDe('saUsuarios'),
    privado:$('saPrivado').checked, ips:$('saIps').checked}, M.demanda(p), SA);
}

// Precio neto: el simulador de tramos partner es de bom.js, compartido por los siete fabricantes.
const OPEX_CISCO = ['Licencias', 'Soporte', 'Seguridad en la nube'];
const DTO = BOM.simuladorDescuento('cajaDescuento', () => renderBom());
const dtoActual = () => (DTO ? DTO.valor() : 0);
const dtoEtiqueta = () => (DTO ? DTO.etiqueta() : null);

// Lo que cambia de forma según el modo: la salida local solo existe en una sede; en un agregado
// es lo que NO llega al hub, y en un hub no aplica. Su seguridad, solo donde se procesa.
function pintarControles(){
  $('headVal').textContent = $('head').value + ' %';
  $('concVal').textContent = $('conc').value + ' %';
  $('diaVal').textContent = $('diaPct').value + ' %';
  $('aggBlock').classList.toggle('hidden', mode !== 'agg');
  $('diaBlock').classList.toggle('hidden', mode === 'hub');
  $('segBlock').classList.toggle('hidden', mode !== 'link');
  $('bwLabel').textContent = mode === 'agg' ? 'Ancho de banda por sucursal' : mode === 'hub' ? 'Tráfico agregado del hub' : 'Ancho de banda contratado';
  $('modeHint').textContent = mode === 'agg'
    ? 'Suma lo que las sucursales mandan por el overlay con su simultaneidad; la salida local de cada una no llega aquí.'
    : mode === 'hub' ? 'Capacidad total que procesa el hub o el borde del datacenter: todo llega por el overlay.'
    : 'Todo el tráfico de la sede pasa por el router: el que viaja por el overlay y el que sale en local a Internet.';
  $('diaHint').textContent = mode === 'agg'
    ? 'Parte del tráfico de cada sucursal que sale en local y no llega al hub.'
    : 'Parte del tráfico de la sede que sale directo a Internet y no viaja por el overlay.';
  $('segHint').textContent = (M.SEGURIDAD[$('seguridad').value] || M.SEGURIDAD.ninguna).d;
  // La capa del firewall dedicado solo cuenta (y viaja en el enlace) con «Firewall dedicado aparte».
  const conFw = mode === 'link' && $('seguridad').value === 'desacoplada';
  $('fwBlock').classList.toggle('hidden', !conFw);
  $('fwBlock').toggleAttribute('data-inactivo', !conFw);
  $('fecPct').disabled = !$('chkFec').checked;
  $('poeW').disabled = !$('chkPoe').checked;
  // La extensión TLOC solo tiene sentido con dos routers.
  $('chkHaTloc').disabled = !$('chkHa').checked;
  $('appqoeCon').disabled = !$('chkAppqoe').checked;
  // Sin topología, sus campos no cuentan ni viajan en el enlace (estado.js salta `data-inactivo`).
  const conTopo = !!$('topologia').value;
  $('topoBlock').classList.toggle('hidden', !conTopo);
  $('topoBlock').toggleAttribute('data-inactivo', !conTopo);
}

// Cuántos túneles levanta el equipo según la topología, con la cuenta escrita entera.
function pintarTopologia(ev){
  const t = ev && ev.topo, box = $('topoRes');
  if(!t){
    box.textContent = $('topologia').value
      ? 'Falta el número de sedes de la red para calcular los túneles.'
      : 'Cada par de transportes que se ven entre sí es un túnel. Es aritmética, no una cifra de Cisco: se compara con los túneles que publica cada ficha.';
    return;
  }
  const meraki = ev.plataforma && /Meraki/.test(ev.plataforma.n);
  box.innerHTML = `Como <b>${t.rol}</b> de una ${t.topologia === 'malla' ? 'malla completa' : 'red de hub y radios'}: `
    + `${t.pasos.map(x => `${esc(x.n)}`).join(' + ') || 'ningún túnel'} = <b>${miles(t.total)} túneles</b>`
    + `${meraki ? '' : `, y una sesión BFD por túnel (${miles(t.total)}; el catálogo no trae un tope de BFD por equipo)`}.`
    + (ev.tunelesManual ? ' <span class="warn">Manda la cifra escrita en «Túneles simultáneos»: bórrala para usar esta.</span>' : '');
}

/* ── RENDER DEL DIMENSIONAMIENTO ── */
function render(){
  pintarControles();
  if(($('enlacesData').value || '') !== enlacesPintados) pintarEnlaces();
  const p = parametros();
  // Sin ancho de banda no hay recomendación (regla de preventa 2026-09-13): es el dato mínimo
  // del dimensionamiento; sin él la página pide valores en vez de proponer un equipo a ciegas.
  if(!(p.bwMbps > 0) || !MODELS.length){
    lastPick = null; hayCandidato = false; ultimaEval = null; sincronizarConBom(null);
    $('need').style.left = '0%'; $('needLbl').textContent = '—';
    $('track').querySelectorAll('.dot,.tick,.pickLabel').forEach(e => e.remove());
    ['avisosMotor', 'apartados', 'tbody'].forEach(id => { $(id).innerHTML = ''; });
    $('distrib').hidden = true; $('cgnatBox').hidden = true;
    // Los túneles por topología no dependen del caudal: se calculan igual.
    pintarTopologia({topo:M.tunelesTopologia(p.topologia, p.modo), plataforma:M.PLATAFORMAS[p.plataforma], tunelesManual:p.escala.tuneles > 0});
    FICHA.render({vendor:VENDOR, contenedor:'verdict', candidatos:[], recomendado:null,
      vacioTitulo:'Ingrese valores para recomendar un equipo',
      vacioDetalle:'<p style="margin:0;font-size:13.5px">Escriba el <b>ancho de banda</b> del sitio para que el dimensionador proponga los modelos que cumplen.</p>'});
    $('verdict').style.borderLeftColor = 'var(--steel)';
    return;
  }

  const ev = M.evaluar(MODELS, p);
  ultimaEval = ev;
  const d = ev.demanda;
  const capEq = m => { const f = filaDe(m.id); return f && f.capEq != null ? f.capEq : Infinity; };
  const candidatos = FICHA.ordenar(ev.candidatos.map(f => f.m), (a, b) => capEq(a) - capEq(b));
  const pick = FICHA.recomendar(candidatos);
  lastPick = pick;
  hayCandidato = !!pick;

  pintarAvisos(ev, p);
  pintarDistribucion(ev);
  pintarCgnat();
  pintarTopologia(ev);

  if(!pick){
    sincronizarConBom(null);
    pintarEscala(ev, null);
    pintarEvaluados(ev, null);
    // «No hay equipo» y «no hay equipo EN ESTA PLATAFORMA» son conclusiones distintas: la
    // segunda se resuelve cambiando un desplegable.
    const otras = M.evaluar(MODELS, {...p, plataforma:'all'}).candidatos
      .filter(f => !ev.plataforma.es(f.m) && FICHA.recomendable(f.m)).map(f => f.m.id);
    const fuera = ev.candidatos.map(f => f.m.id);
    FICHA.render({vendor:VENDOR, contenedor:'verdict', candidatos:[], recomendado:null,
      vacioTitulo:otras.length ? `Ningún equipo vigente de ${ev.plataforma.n} cumple el escenario` : 'Ningún equipo del catálogo cumple el escenario',
      vacioDetalle:(fuera.length ? `<p class="warn">Cumplen ${fuera.map(esc).join(', ')}, pero están fuera de venta: solo sirven como referencia de parque instalado.</p>` : '')
        + (otras.length ? `<p class="warn">Sí cumplen equipos vigentes de <b>otra plataforma</b> (${otras.slice(0, 4).map(esc).join(', ')}${otras.length > 4 ? '…' : ''}). Cambiar de plataforma es una decisión de arquitectura, no de caudal: cambia el plano de gestión, el licenciamiento y quién opera la red.</p>` : '')
        + '<p style="font-size:13px">La tabla «Modelos evaluados» dice por qué se aparta cada uno.</p>'});
    $('verdict').style.borderLeftColor = 'var(--amber)';
    pintarLicencias(null, p);
    return;
  }
  $('verdict').style.borderLeftColor = 'var(--red)';

  const medidoresDe = m => {
    const f = filaDe(m.id);
    if(!f) return [];
    const L = [];
    if(d.overlayNeed > 0 && f.co.v != null) L.push({etq:`Overlay — ${f.co.n}${f.co.cae ? ' (cifra IPsec)' : ''}`, val:d.overlayNeed, tope:f.co.v, txt:`${fmt(d.overlayNeed)} / ${fmt(f.co.v)}`});
    if(d.diaNeed > 0 && f.cd && f.cd.v != null) L.push({etq:`Salida local — ${f.cd.n}`, val:d.diaNeed, tope:f.cd.v, txt:`${fmt(d.diaNeed)} / ${fmt(f.cd.v)}`});
    if(f.u != null && d.overlayNeed > 0 && d.diaNeed > 0) L.push({etq:'Utilización combinada (suma de las dos fracciones)', val:Math.round(f.u * 100), tope:100, txt:`${Math.round(f.u * 100)} %`});
    const esc_ = p.escala;
    if(esc_.tuneles && typeof m.tuneles === 'number') L.push({etq:'Túneles', val:esc_.tuneles, tope:m.tuneles, txt:`${miles(esc_.tuneles)} / ${miles(m.tuneles)}`});
    if(esc_.rutas && typeof m.rutas === 'number') L.push({etq:'Rutas', val:esc_.rutas, tope:m.rutas, txt:`${miles(esc_.rutas)} / ${miles(m.rutas)}`});
    if(esc_.sesiones && typeof m.nat === 'number') L.push({etq:'Sesiones de NAT', val:esc_.sesiones, tope:m.nat, txt:`${miles(esc_.sesiones)} / ${miles(m.nat)}`});
    return L;
  };

  const porQueDe = m => {
    const f = filaDe(m.id);
    if(!f) return '';
    const L = [];
    L.push(`Demanda de diseño: overlay <b>${fmt(d.overlayNeed)}</b>${d.diaNeed ? ` + salida local <b>${fmt(d.diaNeed)}</b>` : ''}. Para esta mezcla el equipo equivale a <b>${fmt(f.capEq)}</b>${f.u != null ? ` (utilización del ${Math.round(f.u * 100)} %)` : ''}.`);
    L.push(`Puertos: ${esc(m.ports || 'no consta')}`);
    for(const pz of f.piezas) L.push(`Se añade al BOM: <b>${esc(pz.desc)}</b>${pz.sku ? ` <code>${esc(pz.sku)}</code>` : ''}.`);
    for(const a of f.avisos) L.push(`<span class="warn">${esc(a)}</span>`);
    return `<ul style="margin:8px 0 0;padding-left:18px;font-size:13.5px">${L.map(x => `<li>${x}</li>`).join('')}</ul>`;
  };

  // A qué puerto va cada enlace declarado, en el equipo de la ficha.
  const seccionEnlaces = m => {
    const f = filaDe(m.id), en = f && f.enlaces;
    const filas = ev.enlaces.map(x => {
      const rot = `Enlace ${x.n} · ${M.TIPOS_ENLACE[x.tipo]}, ${M.ROLES_ENLACE[x.rol].toLowerCase()}${x.e ? ` · ${x.e.n}` : ''}`;
      const a = en && en.asignados.find(y => y.enlace === x.n), s = en && en.sinAsignar.find(y => y.enlace === x.n);
      const al = a && a.alcance, mo = a && M.motivoOptica(a);
      const tc = a && a.tramoCobre;
      const optica = al && al.elegida ? ` · ${esc(al.elegida.bom || al.elegida.sku)} (${esc(M.fmtKm(al.km))} en ${esc(M.FIBRAS[al.fibra])})`
        : mo ? ` · <span class="warn">${esc(mo)}</span>`
        : tc ? ` · tramo de ${esc(M.fmtKm(tc.km))}, llega a ${tc.llega} m${tc.supuesto ? ' (norma 802.3)' : ''}` : '';
      const v = x.tipo === 'celular' ? (m.lte ? 'Módem celular integrado' : m.pim ? 'Módulo PIM (va al BOM)' : '<span class="warn">sin módem celular</span>')
        : a ? `${esc(M.rotuloPuerto(a))}${a.via === 'transceptor' ? ' · con transceptor de cobre' : a.via === 'ont' ? ` · con la ONT ${esc(a.ont[0] ? a.ont[0].sku : 'XGS-PON')}` : ''}${optica}`
        : s ? `<span class="warn">${esc(s.motivo)}</span>`
        : en && en.modular ? 'Chasis modular: lo deciden las tarjetas (consultar)' : 'Puertos no contados: sin comprobar';
      return [esc(rot), v, true];
    });
    const mods = en && en.modulos.length ? `Los puertos fijos no bastan: se propone ${en.modulos.map(x => `${esc(x.sku)} (${esc(x.d)})`).join(' y ')}, de la guía de pedido de su familia.` : null;
    return {titulo:'Enlaces WAN y puertos', filas, nota:[mods, m.notaPuertos ? esc(m.notaPuertos) : null].filter(Boolean).join(' ') || null};
  };

  const seccionesDe = m => {
    const s = SMARTNET[crit] || {};
    const amen = M.cifra(m, 'amenazas');
    const filasRend = [
      ['Reenvío', cifraHtml(m, 'fwd')],
      ['IPsec', cifraHtml(m, 'ipsec')],
      ['SD-WAN', m.sdwan != null ? cifraHtml(m, 'sdwan') : `sin cifra propia: se dimensiona con su IPsec${m.sdwanDesde ? '' : ''}`],
      [amen.n === 'Threat Protection' ? 'Threat Protection' : `${amen.n} (Meraki)`, cifraHtml(m, 'amenazas')],
    ];
    if(typeof m.amenazasDet === 'number') filasRend.push(['NGFW en modo detección', `${fmt(m.amenazasDet)}${base('IDS, sin bloquear')}`]);
    if(m.sdwanDesde) filasRend.push(['SD-WAN disponible desde', esc(m.sdwanDesde)]);
    const filasEscala = [
      ['Túneles', typeof m.tuneles === 'number' ? miles(m.tuneles) + (m.tunelesNota ? ` <span class="sku">${esc(m.tunelesNota)}</span>` : '') : 'no lo publica'],
      ['Rutas', typeof m.rutas === 'number' ? miles(m.rutas) : 'no lo publica'],
      ['Sesiones de NAT', typeof m.nat === 'number' ? miles(m.nat) : 'no lo publica'],
    ];
    if(m.ser === 'Meraki MX') filasEscala.push(['Dispositivos recomendados', typeof m.clientes === 'number' ? miles(m.clientes) : 'no lo publica']);
    if(m.clase) filasEscala.push(['Clase de plataforma (licencias)', `<code>${esc(m.clase)}</code>`]);
    const ranuras = [m.nim ? `${m.nim} NIM` : null, m.sm ? `${m.sm} SM` : null, m.pim ? '1 PIM (celular)' : null].filter(Boolean).join(' · ');
    const lic = M.licencias(m, opcionesLicencia(p, m), LIC_G2, LIC_DNA);
    return [
      {titulo:'Rendimiento publicado', filas:filasRend,
        nota:'Cada cifra con su base de medida: no se comparan cifras de bases distintas entre sí.'},
      {titulo:'Escala publicada', filas:filasEscala},
      {titulo:'Características del equipo', filas:[
        ['Familia / Serie', `${esc(m.fam)} · ${esc(m.ser)}`],
        ['Referencia de pedido', pidDe(m) ? `<code>${esc(pidDe(m))}</code>` : 'consultar en CCW'],
        ['Celular', m.lte ? 'Integrado' : (m.pim ? 'Por módulo PIM (se pide aparte)' : 'No')],
        ['Ranuras', ranuras || 'Ninguna'],
        ['MACsec', m.macsec === 'integrado' ? 'En todos sus puertos' : (m.macsec === 'nim' ? 'Con una NIM WAN con MACsec' : 'No consta')],
        ['PoE', typeof m.poe === 'number' ? `${m.poe} W${m.poeNota ? ` <span class="sku">${esc(m.poeNota)}</span>` : ''}` : 'No consta'],
        ['Puertos', esc(m.ports), true],
        ['Precio de lista ref.', m.elp ? `${esc(m.elp)} (CCW, 17-ago-2026)` : 'Consultar CCW'],
        ...(m.datasheet ? [['Ficha oficial', `<a href="${esc(m.datasheet)}" target="_blank" rel="noopener">abrir la ficha de Cisco</a>`, true]] : []),
      ]},
      FICHA.seccionPuertos(m),
      ...(ev.enlaces.length ? [seccionEnlaces(m)] : []),
      FICHA.seccionAlimentacion(m),
      FICHA.seccionPqc(m),
      {titulo:'Licenciamiento propuesto', filas:lic.filas.map(x => [esc(x.desc), x.sku ? `<code>${esc(x.sku)}</code>` : 'referencia en CCW', true]),
        nota:lic.avisos.length ? `<span class="warn">${lic.avisos.map(esc).join(' ')}</span>` : (m.lic === 'cswan' ? 'En la G2 la referencia sale de la clase de la plataforma; el término y el precio, de CCW.' : null)},
      {titulo:'Software y gestión', filas:m.lic === 'meraki'
        ? [['Meraki Dashboard', 'Gestión en la nube, incluida en la licencia del equipo', true]]
        : [['Catalyst SD-WAN Manager', 'Controlador SD-WAN, en la nube o local', true], ['ThousandEyes', 'Visibilidad de camino y experiencia de aplicación, suscripción aparte', true]]},
      {titulo:'Soporte', filas:[[esc(s.n || 'SMARTnet'), esc(s.sla || '')], ['Alcance', esc(s.d || ''), true]],
        nota:'Nivel según la criticidad del sitio; término en la pestaña de BOM.'},
    ];
  };

  const pintarDependientes = m => {
    pintarEscala(ev, m);
    pintarEvaluados(ev, m);
    pintarLicencias(m, p);
    const s = SMARTNET[crit] || {};
    $('suppBox').innerHTML = `
      <div style="font-family:'Barlow Condensed',sans-serif;font-weight:700;font-size:22px;text-transform:uppercase;margin-bottom:4px">${esc(s.n)}</div>
      <p style="font-family:'IBM Plex Mono',monospace;font-size:11px;margin-bottom:10px"><span class="pillc">${esc(s.sla)}</span> · ${esc(m.id)}</p>
      <p style="font-size:13.5px;margin:0">${esc(s.d)}</p>`;
  };

  const elegidoId = FICHA.render({vendor:VENDOR,
    contenedor:'verdict',
    candidatos,
    recomendado:pick.id,
    vistas:VISTAS || {},
    // En SD-WAN, un modelo sin cifra propia cae a IPsec: la lista lo marca para que dos cifras
    // de mediciones distintas no parezcan la misma.
    etiqueta:m => { const f = filaDe(m.id); return `${m.id} — ${m.ser} · ${fmt(capEq(m))}${f && f.co.cae ? ' (cifra IPsec)' : ''}`; },
    // Escalón N+1 (ficha.js) con la capacidad equivalente para esta mezcla. Solo se comparan
    // equipos medidos igual: misma base en la capa del overlay.
    escalon:{metrica:capEq, fmt, nombre:'capacidad para esta mezcla',
      precio:m => m.elpN ?? null,
      comparable:(a, b) => { const fa = filaDe(a.id), fb = filaDe(b.id); return !!(fa && fb && fa.co.base === fb.co.base && fa.co.cae === fb.co.cae); }},
    titulo:m => m.id,
    subtitulo:m => `${m.fam} · Serie ${m.ser}`,
    medidores:medidoresDe,
    porQue:porQueDe,
    secciones:seccionesDe,
    alCambiar:id => {
      const m = candidatos.find(x => x.id === id);
      if(!m) return;
      pintarDependientes(m);
      llevarABom(m.id);
    },
  });
  const elegido = candidatos.find(m => m.id === elegidoId) || pick;
  pintarDependientes(elegido);
  sincronizarConBom(elegido);
}

// Avisos que no son de un equipo sino del escenario.
function pintarAvisos(ev, p){
  const L = [];
  if(ev.tlsEnRouter) L.push('<div class="callout" role="note"><p><b>Descifrado TLS en el router: ninguna ficha lo publica.</b> Ningún Secure Router, Catalyst ni Meraki de este catálogo publica caudal con inspección TLS, así que no se deriva de otra cifra. Si la salida a Internet necesita descifrado, va en un <b>firewall dedicado</b> o en un servicio <b>SSE en la nube</b>: cambia «Seguridad de la salida a Internet».</p></div>');
  if(p.seguridad === 'desacoplada' && ev.demanda.diaNeed > 0){
    const fw = firewallDe(p);
    const fila = f => `<tr><td>${esc(f.m.id)}</td><td class="n">${fmt(f.m[fw.k])}</td><td class="n">${Math.round(f.u * 100)} %</td><td><code>${esc(f.m.pid)}</code></td></tr>`;
    L.push(`<div class="callout info" role="note"><p><b>Firewall dedicado: Cisco Secure Firewall.</b> El router solo enruta la salida local; la inspecciona un firewall aparte, dimensionado con su cifra de <b>${esc(fw.n)}</b> (${esc(fw.base)}) frente a ${fmt(fw.need)} con margen, los dos sentidos.
      ${fw.elegido ? `Se propone el <b>${esc(fw.elegido.m.id)}</b>, que va al BOM con su licencia de Threat, Malware y URL.` : '<b>Ninguno de las series 1200, 3100 y 4200 llega</b>: varios equipos en clúster o consultar con Cisco.'}
      ${fw.apartados.length ? ` ${fw.apartados.length} se apartan (${esc(fw.apartados[0].motivos[0])}${fw.apartados.length > 1 ? '…' : ''}).` : ''} Otra opción, el <a href="/dimensionador-fortinet-fortigate.html">dimensionador Fortinet</a>.</p>
      ${fw.candidatos.length ? `<div class="scroll"><table><thead><tr><th>Equipo</th><th>${esc(fw.n)}</th><th>Uso</th><th>Referencia</th></tr></thead><tbody>${fw.candidatos.slice(0, 3).map(fila).join('')}</tbody></table></div>` : ''}</div>`);
  }
  if(p.seguridad === 'sse' && ev.demanda.diaNeed > 0) L.push('<div class="callout info" role="note"><p><b>Seguridad en la nube.</b> La salida a Internet viaja cifrada hasta el servicio SSE, así que el router la cuenta en su capa IPsec. La suscripción de Cisco Secure Access (por usuario o por sede) va en las licencias y en el BOM, de su guía de pedido; cada túnel lleva 1 Gbps y pide otro de respaldo.</p></div>');
  if(ev.ha) L.push(`<div class="callout info" role="note"><p><b>Sede con dos routers.</b> Si uno cae, el otro lleva el enrutamiento de toda la sede (guía de diseño de Catalyst SD-WAN): cada router se dimensiona para todo el tráfico y el BOM lleva dos, con sus licencias y su soporte.${ev.ha.tloc ? ' Con extensión TLOC, los enlaces se alternan entre los dos routers y cada uno suma una interfaz hacia el otro (cobre de 1G, supuesto).' : ' Cada router va a todos los transportes, que es lo habitual: cada enlace ocupa un puerto en los dos.'}${ev.ha.tloc && ev.ha.celular ? ' <b>Un enlace celular no se puede extender por TLOC</b>: cada router necesita su propio módem.' : ''}</p></div>`);
  if(ev.enlacesCaudal) L.push(`<div class="callout" role="note"><p><b>El caudal no cabe en la entrega de los enlaces principales.</b> Se declaran ${fmt(ev.enlacesCaudal.bw)} por sentido y los principales entregan ${fmt(ev.enlacesCaudal.cabe)}: revisar la entrega de los enlaces o el caudal.</p></div>`);
  if(p.plataforma === 'asr') L.push('<div class="callout" role="note"><p><b>ASR 1000: fuera de venta.</b> Los tres modelos pasaron su último día de pedido; se evalúan como referencia de parque instalado y nunca se recomiendan.</p></div>');
  $('avisosMotor').innerHTML = L.join('');
}

// Barra proporcional: overlay, salida local y sobrecarga (FEC, duplicación y margen).
function pintarDistribucion(ev){
  const box = $('distrib');
  const t = ev.demanda.distribucion, total = t.overlay + t.dia + t.sobrecarga;
  if(!(total > 0)){ box.hidden = true; box.innerHTML = ''; return; }
  const pc = v => (v / total * 100);
  box.hidden = false;
  box.innerHTML = `<h2>Distribución del caudal de diseño</h2>
    <div class="dist" role="img" aria-label="Distribución del caudal: ${fmt(t.overlay)} por el overlay, ${fmt(t.dia)} de salida local, ${fmt(t.sobrecarga)} de sobrecarga">
      <i class="d-tun" style="width:${pc(t.overlay)}%"></i>${t.dia > 0 ? `<i class="d-dia" style="width:${pc(t.dia)}%"></i>` : ''}${t.sobrecarga > 0 ? `<i class="d-over" style="width:${pc(t.sobrecarga)}%"></i>` : ''}
    </div>
    <div class="dist-leyenda">
      <span class="l-tun">Overlay · ${esc((M.PERFILES[$('profile').value] || M.PERFILES.sdwan).n)}: <b>${fmt(t.overlay)}</b></span>
      ${t.dia > 0 ? `<span class="l-dia">Salida local a Internet: <b>${fmt(t.dia)}</b></span>` : ''}
      ${t.sobrecarga > 0 ? `<span class="l-over">Sobrecarga (margen${ev.demanda.fec ? ', FEC' : ''}${ev.demanda.dup ? ', duplicación' : ''}): <b>${fmt(t.sobrecarga)}</b></span>` : ''}
    </div>
    <ul style="margin:10px 0 0;padding-left:18px;font-size:12.5px">${ev.demanda.pasos.map(x => `<li>${esc(x.n)}: <b>${fmt(x.v)}</b></li>`).join('')}</ul>`;
}

function pintarCgnat(){
  const r = M.poolCgnat({usuarios:numDe('cgnatUsuarios'), bloque:numDe('cgnatBloque') || 512});
  const box = $('cgnatBox');
  if(!r){ box.hidden = true; box.innerHTML = ''; return; }
  box.hidden = false;
  box.innerHTML = `<h2>Pool de NAT por bloques de puertos</h2>
    <p style="font-size:13.5px;margin:0">${miles(r.usuarios)} usuarios con bloques de ${miles(r.bloque)} puertos: <b>${miles(r.porIp)}</b> usuarios por dirección y <b>${miles(r.ips)}</b> IPv4 públicas, un <b>/${r.prefijo}</b> (${miles(r.enPrefijo)} direcciones).</p>
    <p class="hint">Aritmética sobre los ${miles(M.PUERTOS_UTILES)} puertos útiles de una dirección (1.024-65.535); no depende del equipo.</p>`;
}

function pintarLicencias(m, p){
  if(!m){ $('licBox').innerHTML = '<p style="font-size:13.5px;color:var(--steel)">Sin equipo elegido no hay licencias que proponer.</p>'; return; }
  const lic = M.licencias(m, opcionesLicencia(p, m), LIC_G2, LIC_DNA);
  const sa = lineasSecureAccess(p);
  lic.filas.push(...sa.filas); lic.avisos.push(...sa.avisos);
  $('licBox').innerHTML = `<ul class="clean">${lic.filas.map(x => `<li class="on"><b>${esc(x.desc)}</b>${x.incluida ? '<span class="req opt">Incluida</span>' : x.opcional ? '<span class="req opt">Opcional</span>' : '<span class="req">Requerida</span>'}<span class="sku">${x.sku ? `<code>${esc(x.sku)}</code> · ` : ''}${esc(x.nota || '')}</span></li>`).join('')}
    ${lic.avisos.map(a => `<li><span class="warn">${esc(a)}</span></li>`).join('')}</ul>
    <p class="hint">Gestión y nivel se eligen en la pestaña «Equipo y BOM».</p>`;
  $('licHint').textContent = m.lic === 'cswan' ? `${m.id}: clase ${m.clase || 'no consta'}; la referencia sale de la clase.`
    : m.lic === 'meraki' ? 'Meraki: una licencia por equipo, de la clase del equipo.'
      : 'Catalyst 8000, ISR y ASR: suscripción DNA de 3, 5 o 7 años; el tier sale del tráfico (todo el WAN en SD-WAN, solo el cifrado en autónomo).';
  $('secExtras').classList.toggle('hidden', !(m.lic === 'cswan' && p.seguridad === 'onbox'));
  // Controladores: solo con un overlay de Catalyst SD-WAN (IOS XE gestionado por el SD-WAN Manager).
  const conCtrl = m.lic !== 'meraki' && $('licGestion').value !== 'autonomo';
  $('ctrlBlock').classList.toggle('hidden', !conCtrl);
  $('ctrlBlock').toggleAttribute('data-inactivo', !conCtrl);
  pintarControladores();
  // Sin SSE, los campos de Secure Access no cuentan ni viajan en el enlace.
  $('saBlock').classList.toggle('hidden', p.seguridad !== 'sse');
  $('saBlock').toggleAttribute('data-inactivo', p.seguridad !== 'sse');
}

// Componentes de control para el número de equipos del overlay (propuesta 2.2).
function pintarControladores(){
  const r = M.controladoresSdwan(numDe('ctrlEquipos'), $('ctrlSaie').checked, CTRL);
  if(!r){ $('ctrlBox').innerHTML = ''; return; }
  if(r.fuera){ $('ctrlBox').innerHTML = `<p class="hint warn" style="margin:0">Más de ${miles(r.max)} equipos: la guía (${esc(r.version)}) pide varios overlays.</p>`; return; }
  const v = r.validadores, c = r.controladores;
  $('ctrlBox').innerHTML = `<ul class="clean" style="font-size:13.5px">
    <li><b>SD-WAN Manager</b>${r.manager.map(x => `<span class="sku">${esc(x.n)} · ${esc(x.recursos)} por nodo${x.dr ? ' · admite recuperación ante desastres' : ''}</span>`).join('')}</li>
    ${v ? `<li><b>${v.n} Validators</b><span class="sku">${v.vcpu} vCPU y ${v.ram} GB de RAM cada uno</span></li>` : ''}
    ${c ? `<li><b>${c.n} Controllers</b><span class="sku">${c.vcpu} vCPU y ${c.ram} GB de RAM cada uno</span></li>` : ''}
  </ul>`;
}

// Escala logarítmica: la capacidad equivalente de cada equipo de la plataforma para esta mezcla
// de tráfico frente a la demanda total.
function pintarEscala(ev, elegido){
  const track = $('track');
  track.querySelectorAll('.dot,.tick,.pickLabel').forEach(e => e.remove());
  const total = ev.demanda.total;
  const caps = ev.filas.map(f => f.capEq).filter(v => v != null && Number.isFinite(v));
  const maxCap = Math.max(total, ...caps);
  const logP = v => Math.log10(Math.max(v, 10));
  const logMin = Math.log10(10), logMax = logP(maxCap * 1.2);
  const xPct = v => (logP(v) - logMin) / (logMax - logMin) * 100;
  const needPct = Math.min(xPct(total), 99);
  $('need').style.left = needPct + '%';
  $('needLbl').textContent = fmt(total);
  $('need').classList.toggle('flip', needPct > 60);
  [10, 100, 1000, 2000, 5000, 10000, 20000, 50000, 100000, 500000].forEach(v => {
    const pct = xPct(v); if(pct < 0 || pct > 100) return;
    const tick = document.createElement('div'); tick.className = 'tick';
    tick.style.left = pct + '%';
    tick.innerHTML = `<i></i><b>${v >= 1000 ? v / 1000 + 'G' : v + 'M'}</b>`;
    track.appendChild(tick);
  });
  for(const f of ev.filas){
    if(f.capEq == null || !Number.isFinite(f.capEq)) continue;
    const dot = document.createElement('div');
    dot.className = 'dot' + (f.ok ? ' ok' : '') + (elegido && f.m.id === elegido.id ? ' pick' : '');
    dot.style.left = xPct(f.capEq) + '%';
    dot.title = `${f.m.id}: ${fmt(f.capEq)}`;
    track.appendChild(dot);
  }
  if(elegido){
    const f = ev.filas.find(x => x.m.id === elegido.id);
    const lbl = document.createElement('div');
    lbl.className = 'pickLabel'; lbl.id = 'pickLbl';
    lbl.textContent = elegido.id.replace(/^Cisco Secure Router /, '');
    lbl.style.left = (f && f.capEq ? xPct(f.capEq) : 0) + '%';
    track.appendChild(lbl);
  }
}

// Todos los modelos de la plataforma, con su cifra en cada capa y por qué se aparta el que se aparta.
function pintarEvaluados(ev, elegido){
  const d = ev.demanda;
  const capa = (M.PERFILES[$('profile').value] || M.PERFILES.sdwan).n;
  const res = M.resumenApartados(ev.apartados);
  $('apartados').innerHTML = `<p>En <b>${esc(ev.plataforma.n)}</b> cumplen <b>${ev.candidatos.length}</b> de ${ev.filas.length} modelos. Se exigen <b>${fmt(d.overlayNeed)}</b> en «${esc(capa)}»${d.diaNeed ? ` y <b>${fmt(d.diaNeed)}</b> de salida local en «${esc(ev.seguridad.n)}»` : ''}.</p>`
    + (res.length ? `<ul>${res.map(g => `<li><details><summary><b>${g.ids.length}</b> ${esc(g.motivo)}</summary><div>${g.ids.map(esc).join(' · ')}</div></details></li>`).join('')}</ul>` : '');
  const filas = [...ev.candidatos, ...ev.apartados];
  $('tbody').innerHTML = filas.map(f => {
    const r = FICHA.rango(f.m);
    const estado = f.ok ? (r === 2 ? '<span class="warn">Cumple, fuera de venta</span>' : 'Cumple') : `<span class="warn">${f.motivos.map(esc).join('; ')}</span>`;
    return `<tr${elegido && f.m.id === elegido.id ? ' class="sel"' : ''}><td><code>${esc(f.m.id.replace(/^Cisco Secure Router /, ''))}</code></td>`
      + `<td class="n">${f.co.v == null ? '—' : fmt(f.co.v)}${f.co.cae ? ' <span class="pillc">IPsec</span>' : ''}</td>`
      + `<td class="n">${f.cd ? (f.cd.v == null ? '—' : fmt(f.cd.v)) : '—'}</td>`
      + `<td class="n">${f.u == null ? '—' : Math.round(f.u * 100) + ' %'}</td><td>${estado}</td></tr>`;
  }).join('');
}

// Catálogo completo, con la base de cada cifra debajo de ella. Incluye los fuera de venta,
// marcados, porque ampliar un parque instalado es justo cuando hace falta consultarlos.
function renderCatalogo(){
  const tbody = document.querySelector('#tbl-cisco-cat tbody');
  if(!tbody) return;
  const celda = (m, k) => { const c = M.cifra(m, k); return c.v == null ? '—' : `${fmt(c.v)}<span class="sku">${esc(c.base || 'base no consta')}</span>`; };
  tbody.innerHTML = MODELS.map(m => {
    const r = FICHA.rango(m);
    const marca = r === 2 ? ' <span class="pillc" style="color:var(--red-txt)">Fuera de venta</span>'
      : r === 1 ? ' <span class="pillc">Línea anterior</span>' : (m.eolAnnounced ? ' <span class="pillc">Fin de venta anunciado</span>' : '');
    return `<tr>
    <td><code>${esc(m.id.replace(/^Cisco Secure Router /, ''))}</code>${marca}</td><td>${esc(m.ser)}</td><td>${esc(m.fam)}</td>
    <td class="n">${celda(m, 'fwd')}</td><td class="n">${celda(m, 'ipsec')}</td><td class="n">${celda(m, 'sdwan')}</td><td class="n">${celda(m, 'amenazas')}</td>
    <td class="n">${typeof m.tuneles === 'number' ? miles(m.tuneles) : '—'}</td><td>${esc(m.ports)}</td>
    <td class="n" style="color:var(--amber);white-space:nowrap">${m.elp ? esc(m.elp) : 'Consultar CCW'}</td>
  </tr>`;
  }).join('');
}

/* ── RENDER DEL BOM ── */
// Opciones de un desplegable, conservando lo elegido si sigue siendo válido.
function opciones(id, lista, vacio){
  const sel = $(id), antes = sel.value;
  sel.innerHTML = `<option value="">${esc(vacio)}</option>` + lista.map(o => `<option value="${esc(o.v)}">${esc(o.t)}</option>`).join('');
  if(lista.some(o => o.v === antes)) sel.value = antes;
}
const PIM_SKUS = () => new Set([...MOD_G2, ...MOD_C8K].filter(x => x.en === 'pim').map(x => x.sku));

// Módulos que admite el equipo, de la guía de pedido de su familia: la de la G2 (tablas 7 y 8) o
// la de los Catalyst 8300/8200 (tabla 5), filtrada por lo que la tabla limita (solo 8300, SM de
// doble ancho solo en el 2N2S). El ISR, el 8500 y el ASR no traen lista: «consultar».
function modulosDe(m){
  return M.modulosEquipo(m, catalogoPuertos());
}

function renderBom(){
  const m = MODELS.find(x => x.id === $('pickModel').value) || MODELS[0];
  // Sin catálogo todavía no hay nada que pintar: un enlace compartido repone los .seg con un
  // click que llega antes que el fetch, y aquí reventaba.
  if(!m) return;
  const p = parametros();
  // Con dos routers por sede (propuesta 1.3), todo lo que va por equipo se duplica; lo que el reparto
  // con TLOC ya asigna a un router (`porRouter`) no.
  const sedesQty = Math.max(1, parseInt($('qty').value, 10) || 1);
  const qty = sedesQty * (p.ha ? 2 : 1);
  const anios = +$('termYears').value || 3;
  const optQty = Math.max(0, parseInt($('optQty').value, 10) || 0);
  const g2 = m.lic === 'cswan';

  // Módulos: solo los de la guía de pedido de su familia, y solo en el equipo que tiene la ranura.
  const mods = modulosDe(m);
  const conLista = mods.lista.length > 0;
  const deTipo = en => mods.lista.filter(x => x.en === en).map(x => ({v:x.sku, t:`${x.sku} — ${x.d}${x.finVenta ? ` · FIN DE VENTA (último pedido ${x.finVenta.ultimoPedido}, ${x.finVenta.boletin})` : ''}`}));
  opciones('modNim', conLista && m.nim ? deTipo('nim') : [], '— ninguno —');
  opciones('modSm', conLista && m.sm ? deTipo('sm') : [], '— ninguno —');
  opciones('modPim', conLista && m.pim ? deTipo('pim') : [], '— ninguno —');
  $('modNimBlock').classList.toggle('hidden', !(conLista && m.nim));
  $('modSmBlock').classList.toggle('hidden', !(conLista && m.sm));
  $('modPimBlock').classList.toggle('hidden', !(conLista && m.pim));
  $('modHint').textContent = !(m.nim || m.sm || m.pim) ? 'Este equipo no tiene ranuras de expansión.'
    : conLista ? `De ${mods.fuente}: uno por ranura.` : 'Los módulos de esta familia salen de su propia guía de pedido: consultar en CCW.';
  const optLista = (m.optics || []).flatMap(k => (OPTICS[k] || []).map(o => ({v:`${k}|${o.sku}`, t:`${OPTIC_LABEL[k] || k} — ${o.sku} · ${o.d}`})));
  opciones('optSel', optLista, optLista.length ? '— elegir óptica —' : 'Este equipo no lista ópticas');

  const filas = [
    {cat:'Equipo', desc:m.id, sku:pidDe(m), qty, unit:m.elpN != null ? m.elpN : null,
     nota:`${m.fam} · Serie ${m.ser} · ${m.ports}${m.eolAnnounced ? (vencido(m) ? ' · FIN DE VENTA VENCIDO' : ' · FIN DE VENTA ANUNCIADO') : ''}`},
  ];
  const rq = M.requisitos(m, M.requisitosConEnlaces(p));
  for(const pz of rq.piezas){
    if(pz.pim){
      if($('modPim').value) continue;
      // Por categoría (propuesta 1.2): con la bajada y la subida del enlace celular, solo los PIM de
      // su guía cuya categoría llega; es un pico teórico, no el caudal del operador.
      const pc = M.pimsCelular(mods.lista.filter(x => x.en === 'pim'), CELULAR, pz.need);
      const rot = o => `${o.sku}${o.red ? ` (${o.red}, ${miles(o.bajada)}/${miles(o.subida)} Mbps)` : ' (categoría sin dato)'}`;
      const need = pz.need && (pz.need.bajada || pz.need.subida) ? `${miles(pz.need.bajada || 0)}/${miles(pz.need.subida || 0)} Mbps de bajada/subida` : null;
      if(!pc.opciones.length){
        filas.push({cat:'Módulos', desc:'Módulo celular (PIM) — elegir uno', sku:null, qty, unit:null, nota:'Referencia en la guía de pedido de esta familia: consultar en CCW.'});
      } else if(!pc.elegibles.length){
        filas.push({cat:'Módulos', desc:'Módulo celular (PIM) — consultar', sku:null, qty, unit:null,
          nota:`Ningún PIM de su guía de pedido llega por categoría a ${need}${pc.max ? ` (el mayor, ${rot(pc.max)})` : ''}: consultar.`});
      } else {
        filas.push({cat:'Módulos', desc:`Módulo celular (PIM)${pc.elegibles.length > 1 ? ' — elegir uno' : ''}`, sku:pc.elegibles.length === 1 ? pc.elegibles[0].sku : null, qty, unit:null,
          nota:`${pc.falta ? 'Según la región y el operador' : `Llegan a ${need} por categoría; según la región y el operador`}: ${pc.elegibles.map(rot).join(', ')} (guía de pedido, ${mods.pim}). La categoría da el pico de la norma, no el caudal del operador.`});
      }
    } else if(pz.macsec){
      if(/^C-NIM-WAN/.test($('modNim').value)) continue;
      filas.push({cat:'Módulos', desc:'NIM WAN con MACsec — elegir una', sku:null, qty, unit:null,
        nota:g2 ? 'C-NIM-WAN-2X (2 × 1/10G SFP+) o C-NIM-WAN-4S (4 × 1G SFP), guía de pedido, tabla 7.' : 'Referencia en la guía de pedido de esta familia.'});
    } else {
      filas.push({cat:pz.cat, desc:pz.desc, sku:pz.sku, qty, unit:null, nota:pz.nota || ''});
    }
  }
  for(const id of ['modNim', 'modSm', 'modPim']){
    const sku = $(id).value;
    const x = sku && mods.lista.find(y => y.sku === sku);
    if(x) filas.push({cat:'Módulos', desc:x.d, sku:x.sku, qty, unit:null, nota:`Guía de pedido ${g2 ? 'de la G2' : 'de los Catalyst 8300/8200'}; precio en CCW.`});
  }
  // Piezas de hardware del catálogo que no son licencias ni celulares (los bundles HA del ASR).
  const pims = PIM_SKUS();
  (m.parts || []).filter(x => !/^(LIC|DNA)/.test(x) && !pims.has(x))
    .forEach(x => filas.push({cat:'Módulos', desc:x, sku:x, qty, unit:null, nota:PARTS_DESC[x] || ''}));
  if(optQty > 0){
    const [k, sku] = ($('optSel').value || '|').split('|');
    const o = k && (OPTICS[k] || []).find(y => y.sku === sku);
    filas.push(o
      ? {cat:'Ópticas', desc:`${OPTIC_LABEL[k] || k} — ${o.sku}`, sku:o.bom || o.sku, qty:optQty * qty, unit:null, nota:o.d}
      : {cat:'Ópticas', desc:'Óptica — elegir el modelo', sku:null, qty:optQty * qty, unit:null, nota:'Elige la óptica en «Módulos y ópticas».'});
  }
  // Lo que pide el reparto de los enlaces: módulos, ópticas y transceptores. Un módulo que ya se
  // eligió a mano no se repite.
  const enl = M.repartoHa(m, p);
  const aMano = new Set(['modNim', 'modSm', 'modPim'].map(id => $(id).value).filter(Boolean));
  M.piezasEnlaces(enl).filter(pz => !(pz.moduloEnlace && aMano.has(pz.sku))).forEach(pz => filas.push({...pz, qty:pz.porRouter ? sedesQty : qty, unit:null}));
  const avisosPuertos = [
    ...enl.sinAsignar.map(x => x.motivo[0].toUpperCase() + x.motivo.slice(1) + '.'),
    ...enl.asignados.filter(a => M.motivoOptica(a)).map(a => `Enlace ${a.enlace}: ${M.motivoOptica(a)}; consultar con Cisco.`),
    ...(M.motivoCombinacion(enl) ? [`${M.motivoCombinacion(enl)[0].toUpperCase()}${M.motivoCombinacion(enl).slice(1)}.`] : []),
    ...(enl.modular ? ['Chasis modular: los puertos de los enlaces dependen de las tarjetas que se pidan (consultar).'] : []),
    ...(m.notaPuertos && enl.asignados.length ? [m.notaPuertos] : []),
  ];
  const lic = M.licencias(m, opcionesLicencia(p, m), LIC_G2, LIC_DNA);
  lic.filas.forEach(x => filas.push({...x, qty:x.qty * qty, nota:x.incluida ? `${x.nota} Incluida con el equipo.` : x.nota}));
  // El firewall dedicado, uno por sede (su cifra ya es la de toda la salida a Internet).
  const pf = M.piezasFirewall(firewallDe(p), anios);
  pf.filas.forEach(x => filas.push({...x, qty:sedesQty, unit:null}));
  lic.avisos.push(...pf.avisos);
  // Secure Access va por cliente y por usuario, no por equipo: su cantidad no se multiplica.
  const sa = lineasSecureAccess(p);
  sa.filas.forEach(x => filas.push({...x, unit:null}));
  lic.avisos.push(...sa.avisos);
  const sn = SMARTNET[crit];
  if(sn) filas.push({cat:'Soporte', desc:sn.n, sku:null, qty, unit:null, nota:`${sn.sla || ''} · término ${anios} año(s)`});

  // Ficha resumida del equipo en el BOM.
  $('bomBody').innerHTML = `${BOM.avisoDesvio({elegido:FICHA.elegido('verdict'), enBom:m.id, hayCandidato})}<section class="panel"><h2>Ficha del equipo</h2>
    <div class="model" style="font-size:28px">${esc(m.id)}</div>
    <p class="family">${esc(m.fam)} · Serie ${esc(m.ser)}</p>
    <div class="scroll"><table><thead><tr><th>Concepto</th><th>Valor</th></tr></thead><tbody>
    <tr><td>Referencia de pedido</td><td>${pidDe(m) ? `<code>${esc(pidDe(m))}</code>` : 'consultar en CCW'}</td></tr>
    <tr><td>Precio de lista ref. (equipo)</td><td class="n">${m.elp ? esc(m.elp) + ' (CCW)' : 'Consultar CCW'}</td></tr>
    <tr><td>Reenvío</td><td class="n">${cifraHtml(m, 'fwd')}</td></tr>
    <tr><td>IPsec</td><td class="n">${cifraHtml(m, 'ipsec')}</td></tr>
    <tr><td>SD-WAN</td><td class="n">${cifraHtml(m, 'sdwan')}</td></tr>
    <tr><td>${esc(M.cifra(m, 'amenazas').n)}</td><td class="n">${cifraHtml(m, 'amenazas')}</td></tr>
    <tr><td>Puertos y ranuras</td><td>${esc(m.ports)}</td></tr>
    </tbody></table></div>
    ${lic.avisos.length || avisosPuertos.length ? `<ul class="hint" style="margin:10px 0 0;padding-left:18px">${[...avisosPuertos, ...lic.avisos].map(a => `<li class="warn">${esc(a)}</li>`).join('')}</ul>` : ''}
    ${m.eolAnnounced ? `<p class="hint warn" style="margin-top:10px">${vencido(m) ? '<b>Fin de venta VENCIDO</b>' : 'Fin de venta anunciado'} (PID <code>${esc(m.eolAnnounced.pid)}</code>) — último día de pedido: <b>${esc(m.eolAnnounced.lastOrder)}</b>${vencido(m) ? ', ya pasado: solo referencia para parque instalado' : ''}.${m.eolAnnounced.sucesor ? ` Sucesor según el boletín: <b>${esc(m.eolAnnounced.sucesor)}</b>.` : ' El boletín no nombra un PID de reemplazo directo.'}${m.eolAnnounced.url ? ` <a href="${esc(m.eolAnnounced.url)}" target="_blank" rel="noopener">Boletín oficial</a>.` : ''}</p>` : ''}
    </section>`;

  const f = filaDe(m.id);
  const meta = {
    titulo:`Lista de materiales — ${m.id}`,
    supuestos:{vendor:VENDOR, fabricante:'Cisco', plataforma:ultimaEval ? ultimaEval.plataforma.n : null, modelo:m.id, serie:m.ser,
      resumen:ultimaEval ? `Overlay ${fmt(ultimaEval.demanda.overlayNeed)}${ultimaEval.demanda.diaNeed ? ` + salida local ${fmt(ultimaEval.demanda.diaNeed)}` : ''}${f && f.u != null ? `; utilización del ${Math.round(f.u * 100)} %` : ''}` : null},
    subtitulo:`${m.fam} · Serie ${m.ser} · término ${anios} años`,
    archivo:`BOM_${m.id}`,
    notas:[
      '',
      'NOTAS DE PREVENTA',
      '  Referencias de la guia de pedido oficial; precios de lista del export de CCW donde constan.',
      '  Verificar referencia, termino y precio final en Cisco Commerce Workspace antes de cotizar.',
      m.eolAnnounced ? `  AVISO: fin de venta ${vencido(m) ? 'VENCIDO' : 'anunciado'} (${m.eolAnnounced.pid}), ultimo dia de pedido ${m.eolAnnounced.lastOrder}.` : null,
      m.eolAnnounced && m.eolAnnounced.sucesor ? `  Sucesor segun el boletin: ${m.eolAnnounced.sucesor}.` : null,
      ...avisosPuertos.map(a => `  PUERTOS: ${a}`),
      ...lic.avisos.map(a => `  LICENCIAS: ${a}`),
    ].filter(n => n !== null),
  };
  const d = dtoActual();
  if(d > 0){ meta.dto = d; meta.dtoEtq = dtoEtiqueta(); }
  $('bomTabla').innerHTML = BOM.renderTabla(filas, {dto:d});
  $('bomOut').value = BOM.comoTexto(filas, meta);
  bomFilas = filas; bomMeta = meta;
  pintarTco(filas);
  // Un módulo de voz elegido aquí cambia lo que pide la licencia DNA: el panel de licencias del
  // dimensionamiento se repinta si el equipo del BOM es el de la ficha.
  if(FICHA.elegido('verdict') === m.id) pintarLicencias(m, p);
}

/* ── PRECIO NETO, TCO Y CUOTA MENSUAL ── */
['plazoMrr', 'margenFin', 'feeMsp'].forEach(id => $(id).addEventListener('input', () => pintarTco(bomFilas)));

function pintarTco(filas){
  const anios = +$('termYears').value || 3, dto = dtoActual();
  const fin = BOM.tco(filas, {opex:OPEX_CISCO, anios});
  const hayPrecios = fin.capex > 0 || fin.opexTermino > 0;
  const net = v => (dto > 0 ? `<td><b>${BOM.money(v * (1 - dto))}</b></td>` : '');
  $('tcoFin').innerHTML = hayPrecios
    ? `<table class="tco-tabla"><thead><tr><th>Pie de la lista de materiales</th><th>Subtotal Lista</th>${dto > 0 ? '<th>Subtotal Neto</th>' : ''}</tr></thead><tbody>`
      + `<tr><td><b>CAPEX</b> — equipo, módulos y ópticas</td><td>${BOM.money(fin.capex)}</td>${net(fin.capex)}</tr>`
      + `<tr><td><b>OPEX anual</b> — licencias y soporte ÷ ${anios} año${anios > 1 ? 's' : ''}</td><td>${BOM.money(fin.opexAnual)}</td>${net(fin.opexAnual)}</tr>`
      + `<tr><td><b>TCO a ${anios} año${anios > 1 ? 's' : ''}</b>${fin.sinPrecio ? ' (parcial)' : ''}</td><td><b>${BOM.money(fin.tco)}</b></td>${net(fin.tco)}</tr></tbody></table>`
      + `<p class="hint" style="margin-top:8px">${fin.sinPrecio ? `<b>TCO parcial:</b> ${fin.sinPrecio} línea(s) sin precio no entran en la suma. ` : ''}El neto es un simulador genérico de tramos partner, no el descuento real del distribuidor.</p>`
    : '<p class="hint">Sin precios suficientes para calcular el TCO: este equipo no trae precio de lista del export de CCW.</p>';
  pintarMrr(fin, dto);
}
// Cuota mensual de servicio gestionado. Los porcentajes son entradas del usuario; sin precios no
// hay cuota: se dice cuántas líneas faltan en vez de mostrar una cifra que aparenta estar completa.
function pintarMrr(fin, dto){
  const r = BOM.mrr({capexNeto:fin.capex * (1 - dto), opexMensual:fin.opexAnual * (1 - dto) / 12,
    meses:$('plazoMrr').value, margenFin:$('margenFin').value, feeMsp:$('feeMsp').value, sinPrecio:fin.sinPrecio});
  const hay = fin.capex > 0 || fin.opexTermino > 0;
  $('mrrBox').innerHTML = !hay
    ? '<p class="hint">Sin precios no hay cuota: este equipo no trae precio de lista del export de CCW.</p>'
    : `<table class="tco-tabla"><tbody>
      <tr><td>CAPEX neto a financiar${dto > 0 ? ' (con el descuento del simulador)' : ''}</td><td>${BOM.money(r.capexNeto)}</td></tr>
      <tr><td>Cuota de hardware (${r.meses} meses${r.margenFin ? `, +${r.margenFin} % de financiación` : ''})</td><td>${BOM.money(r.cuotaHardware)}</td></tr>
      <tr><td>OPEX mensual (licencias y soporte)</td><td>${BOM.money(r.opexMensual)}</td></tr>
      <tr><td>Fee de gestión MSP (${r.feeMsp} % de lo anterior)</td><td>${BOM.money(r.fee)}</td></tr>
      <tr><td><b>Cuota mensual (MRR)${r.completo ? '' : ' — parcial'}</b></td><td><b>${BOM.money(r.mrr)}</b></td></tr>
      <tr><td><b>Valor total del contrato (TCV)</b> a ${r.meses} meses</td><td><b>${BOM.money(r.tcv)}</b></td></tr></tbody></table>
      <p class="hint" style="margin-top:8px">${r.sinPrecio ? `<b>Parcial:</b> ${r.sinPrecio} línea(s) sin precio no entran en la cuota. ` : ''}Los porcentajes de financiación, fee y descuento los pone quien cotiza: no son cifras de Cisco.</p>`;
}

/* ── Acciones del BOM ── */
$('copyBtn').addEventListener('click', async () => {
  const t = $('bomOut');
  try { await navigator.clipboard.writeText(t.value); $('copyBtn').textContent = 'Copiado'; }
  catch { t.classList.remove('hidden'); t.select(); document.execCommand('copy'); t.classList.add('hidden'); $('copyBtn').textContent = 'Copiado'; }
  setTimeout(() => $('copyBtn').textContent = 'Copiar como texto', 1600);
});
$('xlsBtn').addEventListener('click', async () => {
  const b = $('xlsBtn'); b.disabled = true; b.textContent = 'Generando…';
  try { await BOM.exportarExcel(bomFilas, bomMeta); b.textContent = 'Exportar a Excel'; }
  catch(e){ b.textContent = 'Error al exportar'; console.error(e);
    setTimeout(() => b.textContent = 'Exportar a Excel', 2200); }
  b.disabled = false;
});
// Memoria técnica: Markdown con el escenario, la memoria de cálculo (supuestos rotulados), el
// equipo con sus cifras y bases, lo apartado y el BOM. El contenido lo arma el motor.
$('memoriaBtn').addEventListener('click', () => {
  if(!ultimaEval) return;
  const m = MODELS.find(x => x.id === $('pickModel').value);
  const md = M.memoria(ultimaEval, {fila:m ? filaDe(m.id) : null, perfil:$('profile').value, filas:bomFilas, fecha:new Date().toISOString().slice(0, 10)});
  const url = URL.createObjectURL(new Blob([md], {type:'text/markdown;charset=utf-8'}));
  const a = document.createElement('a');
  a.href = url; a.download = `Memoria_tecnica_${m ? m.id.replace(/\s+/g, '_') : 'cisco'}.md`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

/* ── PERFILES MULTI-SEDE ──
   Misma clave compartida que los demás fabricantes (`BOM.perfiles`): un despliegue real mezcla
   marcas. Cargar es de Cisco (los campos son ids de ESTA página); consolidar no. */
const CAMPOS_PERFIL = [...ENTRADAS, 'qty', 'termYears', 'licGestion', 'licNivel', 'licVpns', 'secUrl', 'secMalware', ...CAMPOS_SA, 'optQty'];
const SEGS_PERFIL = ['modeSeg', 'dirSeg', 'critSeg'];
function capturarCampos(){
  const v = {};
  CAMPOS_PERFIL.forEach(id => { const n = $(id); if(n) v[id] = n.type === 'checkbox' ? n.checked : n.value; });
  SEGS_PERFIL.forEach(id => { const a = $(id).querySelector('[aria-pressed="true"]'); v[id] = a ? a.dataset.v : null; });
  return v;
}
function aplicarCampos(v){
  CAMPOS_PERFIL.forEach(id => {
    const n = $(id);
    if(!n || v[id] == null) return;
    if(n.type === 'checkbox') n.checked = !!v[id]; else n.value = v[id];
  });
  // Los grupos .seg guardan su valor en una variable de la página: solo su manejador la actualiza.
  SEGS_PERFIL.forEach(id => { const b = v[id] != null && $(id).querySelector(`[data-v="${v[id]}"]`); if(b) b.click(); });
  render();
}
function pintarPerfiles(){
  const caja = $('listaPerfiles');
  const l = BOM.perfilesDe(VENDOR);
  caja.innerHTML = l.length
    ? '<table class="tco-tabla"><thead><tr><th>Perfil</th><th>Sedes</th><th>Modelo</th><th>Guardado</th><th></th></tr></thead><tbody>'
      + l.map(x => `<tr><td><b>${esc(x.nombre)}</b></td><td>${x.sedes}</td><td>${esc(x.modelo)}</td><td>${esc(x.fecha || '—')}</td>`
        + `<td><button type="button" class="btn ghost" data-perfil-cargar="${esc(x.id)}" style="font-size:10px;padding:3px 8px">Cargar</button> `
        + `<button type="button" class="btn ghost" data-perfil-borrar="${esc(x.id)}" style="font-size:10px;padding:3px 8px">Eliminar</button></td></tr>`).join('')
      + '</tbody></table>'
    : '<p class="hint">Sin perfiles guardados todavía.</p>';
  const hay = BOM.perfiles().length > 0;
  $('btnConsolidar').disabled = !hay;
  $('btnConsolidar').title = hay ? '' : 'Guarda al menos un perfil de sede para consolidar el BOM global.';
}
$('btnGuardarPerfil').addEventListener('click', () => {
  const nombre = $('nombrePerfil').value.trim();
  const sedes = Math.max(0, parseInt($('perfilSedes').value, 10) || 0);
  if(!nombre || !sedes){ $('perfilMsg').textContent = 'Pon un nombre y el número de sedes idénticas.'; $('nombrePerfil').focus(); return; }
  if(!bomFilas.length || !hayCandidato){ $('perfilMsg').textContent = 'No hay un equipo dimensionado que guardar: ajusta el escenario primero.'; return; }
  BOM.guardarPerfil({nombre, sedes, modelo:$('pickModel').value, vendor:VENDOR, fecha:new Date().toISOString().slice(0, 10),
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
$('btnConsolidar').addEventListener('click', () => {
  const l = BOM.perfiles();
  const {filas, totalSedes, fabricantes} = BOM.consolidar(l, {agregadas:[], unicas:[]});
  if(!totalSedes) return;
  const multi = fabricantes.length > 1;
  const meta = {
    titulo:`BOM global consolidado — ${l.length} perfil(es), ${totalSedes} sedes`,
    subtitulo:l.map(x => `${x.nombre} ×${x.sedes} (${x.modelo})`).join(' · '),
    archivo:multi ? 'BOM_global_multifabricante' : 'BOM_global_cisco',
    sinRefs:true,
    notas:['REGLAS DE CONSOLIDACION (Cisco):',
      '  Equipo, modulos, licencias y soporte: cantidad del perfil x sedes del perfil.',
      '  Precios de lista solo donde los trajo el export de CCW; el resto, consultar.'],
  };
  if(multi) meta.notas.push(`  MULTI-FABRICANTE: ${fabricantes.join(', ')}.`);
  const d = dtoActual();
  if(d > 0){ meta.dto = d; meta.dtoEtq = dtoEtiqueta(); }
  $('consolidadoSub').textContent = `${meta.subtitulo} — ${totalSedes} sedes en total`;
  $('consolidadoTabla').innerHTML = (multi ? `<p class="bom-aviso">Consolidado <b>multi-fabricante</b> (${esc(fabricantes.join(', '))}).</p>` : '')
    + BOM.renderTabla(filas, {dto:d, sinRefs:true});
  $('modalConsolidado').hidden = false;
  $('xlsConsolidadoBtn').onclick = () => BOM.exportarExcel(filas, meta);
  $('consolidadoCerrar').focus();
});
$('consolidadoCerrar').addEventListener('click', () => { $('modalConsolidado').hidden = true; $('btnConsolidar').focus(); });

/* ── ARRANQUE ── */
(async function initApp(){
  const res = await fetch('/api/dimensionador/cisco');
  const data = await res.json();
  // Pendiente 34: el respaldo de ciclo de vida de ESTE fabricante, tal como lo declara
  // `legacyData/fuentes.js` con sus `campos`.
  FICHA.fijarCicloVida(data.cicloVida);
  MODELS = data.models;
  OPTICS = data.optics;
  OPTIC_LABEL = data.opticLabel;
  PARTS_DESC = data.partsDesc;
  SMARTNET = data.smartnet;
  LIC_G2 = data.licenciasG2 || {};
  LIC_DNA = data.licenciasDna || null;
  MOD_G2 = data.modulosG2 || [];
  MOD_C8K = data.modulosC8k || [];
  SA = data.secureAccess || null;
  SFW = data.secureFirewall || null;
  CELULAR = data.celular || {};
  CTRL = data.controladoresSdwan || null;
  // Sin el mapa la página funciona igual: la ficha no pinta la tarjeta gráfica.
  try {
    const rv = await fetch('/data/cisco-vistas-equipos.json');
    if(rv.ok) VISTAS = await rv.json();
  } catch { VISTAS = null; }

  // Selector del BOM: series por su modelo de entrada y, dentro de cada una, de menor a mayor
  // reenvío. La API puede servir el catálogo en cualquier orden y el combo no depende de eso.
  $('pickModel').innerHTML = (() => {
    const capDe = m => m.fwd || m.ipsec || 0;
    const groups = {};
    MODELS.forEach(m => { (groups[m.ser] = groups[m.ser] || []).push(m); });
    const ordenadas = Object.entries(groups);
    for(const [, arr] of ordenadas) arr.sort((a, b) => capDe(a) - capDe(b));
    ordenadas.sort((a, b) => Math.min(...a[1].map(capDe)) - Math.min(...b[1].map(capDe)));
    return ordenadas.map(([g, arr]) =>
      `<optgroup label="${esc(g)}">${arr.map(m => `<option value="${esc(m.id)}">${esc(m.id)} — ${esc(m.fam)}</option>`).join('')}</optgroup>`).join('');
  })();

  $('opticsAll').innerHTML = Object.keys(OPTICS).map(k => `
    <div class="grp"><h3>${esc(OPTIC_LABEL[k])}</h3>
    <div class="scroll"><table><thead><tr><th>PID Cisco</th><th>SKU legacy</th><th>Descripción</th></tr></thead><tbody>
    ${OPTICS[k].map(o => `<tr><td><code>${esc(o.bom)}</code></td><td><code>${esc(o.sku)}</code></td><td>${esc(o.d)}</td></tr>`).join('')}
    </tbody></table></div></div>`).join('');

  render();
  renderBom();
  renderCatalogo();
  pintarPerfiles();
  PROCEDENCIA.registrarModelos('cisco', () => MODELS.map(m => ({ model:m.id, ...m })));
})();

/* Enlace de eventos movido desde onclick= en el HTML, para permitir una CSP con
   script-src 'self' que bloquea todo código en línea. */
document.addEventListener('click', (e) => {
  const abrir = e.target.closest('[data-abrir]');
  if (abrir) { window.open(abrir.dataset.abrir, '_blank'); return; }
  const id = e.target.closest('button,[id]')?.id;
  if (id === 'btnImprimir') window.print();
});

/* ══ ESTADO ENLAZABLE ══
   El escenario viaja en la URL (ver /js/estado.js). Los enlaces de antes del rediseño traían
   tres casillas de recargo que ya no existen: dos se traducen a la seguridad de la salida a
   Internet (ZBF → inspección en el router, Umbrella → SSE) y el nivel DNA pasa a «Nivel»; las
   demás (voz, AppX, APs) no tienen equivalente y el aviso del enlace lo dice. */
document.addEventListener('DOMContentLoaded', () => {
  const MIGRADOS = ['sNgfw', 'sUmbrella', 'dnaTier'];
  const st = ESTADO.vincular({ campos:[...ENTRADAS, 'critSeg', 'dirSeg', 'modeSeg', 'qty', 'termYears', 'licGestion', 'licNivel', 'licVpns', 'secUrl', 'secMalware', ...CAMPOS_SA, 'optQty', 'verdict-sel'],
    migrados:MIGRADOS });
  const q = new URLSearchParams(location.search);
  const si = k => ['1', 'true', 'on'].includes(String(q.get(k)).toLowerCase());
  if(!q.has('seguridad') && (si('sNgfw') || si('sUmbrella'))) $('seguridad').value = si('sUmbrella') ? 'sse' : 'onbox';
  if(!q.has('licNivel') && q.has('dnaTier')) {
    const n = {ess:'E', adv:'A', pre:'P'}[q.get('dnaTier')];
    if(n) $('licNivel').value = n;
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
  render();
});

/* ══ ENVIAR AL COTIZADOR ══
   Solo esta página sabe qué equipo está elegido ahora mismo; el cotizador pone el precio y el
   resto de la línea desde su propio catálogo. Ver bom.js. */
document.addEventListener('DOMContentLoaded', () => {
  BOM.montarBotonCotizador(() => {
    const sel = document.getElementById('verdict-sel');
    const elegido = (sel && sel.value) || (lastPick && lastPick.id) || null;
    if (!elegido) return null;
    const cant = document.getElementById('qty');
    return { modelo:elegido, qty:Math.max(1, parseInt(cant && cant.value, 10) || 1),
             de:document.title.split('—')[0].trim() };
  });
});
