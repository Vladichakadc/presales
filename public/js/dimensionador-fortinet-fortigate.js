'use strict';
/* ══ DIMENSIONADOR FORTIGATE — PAGINA (etapa 7, 2026-09-23) ════════════════════════════════
   Informe de auditoria del 23-sep: el motor multieje acertaba, pero la recomendacion, el
   selector manual, el BOM y los botones de salida vivian en ESTADOS DISTINTOS de esta pagina,
   y por las costuras se colaba una cotizacion invalida (F01 un 40F elegido a mano se cotizaba
   con el panel diciendo 90G; F02 SSL-VPN sin preguntar FortiOS; F03 HA con cantidad 1; F04
   «Enviar al cotizador» fuera de la puerta).

   LA CORRECCION ES ESTRUCTURAL: esta pagina ya no calcula nada. Lee el formulario, se lo da a
   `FortinetMotor.evaluar` y pinta el resultado — el grafico, la ficha, la comparacion, los
   requisitos, la lista de materiales, la puerta y cada exportacion salen de ESE resultado
   (`RES`), el mismo que el servidor recalcula con el mismo archivo antes de dejar salir una
   cotizacion (POST /api/v1/fortinet/evaluations). No hay un segundo sitio donde un numero
   pueda divergir.

   LO QUE SI HACE LA PAGINA, y solo la pagina: el formulario dinamico (mostrar lo que aplica
   segun el esquema de dependencias del propio motor), el Multi-Underlay Builder, las
   correcciones reversibles, el historial para deshacer, la accesibilidad y el enlace. */

const R = FortinetReglas;
const M = FortinetMotor;
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function fmt(m) {
  if (m == null || !Number.isFinite(m)) return '—';
  if (m >= 1000000) return `${(m / 1e6).toFixed(1).replace(/\.0$/, '')} Tbps`;
  if (m >= 1000) return `${(m / 1000).toFixed(m % 1000 ? 1 : 0)} Gbps`;
  return `${Math.round(m)} Mbps`;
}
const nMil = (v) => (v >= 1000 ? `${(v / 1000).toFixed(v % 1000 ? 1 : 0)}K` : String(Math.round(v)));
const cifra = (n) => Number(n).toLocaleString('en-US', { maximumFractionDigits: 1 });
const money = (n) => (n == null ? null : `$${n.toLocaleString('en-US', { maximumFractionDigits: 2 })}`);
const valEje = (e, v) => (e.unidad === 'Mbps' || !e.unidad ? fmt(v) : `${cifra(v)} ${e.unidad}`);

// ── Catalogo ─────────────────────────────────────────────────────────────────────────────
let CAT = null; // lo que consume el motor: la misma forma que usa el servidor
let MODELS = [];
let BUNDLES = {};
let CARE = {};
let FUNCIONES = [];
let SERVICIOS_SDWAN = [];
let TERMINOS = {};
let FUENTES = null; // procedencia del fabricante (/api/fuentes)
let VISTAS = null; // figura oficial del equipo, frontal y trasera

// ── Estado de la pagina que no es un campo del formulario ────────────────────────────────
let profile = 'tp';
let rolSdwan = 'none';
let segMode = 'branch';
// La eleccion manual del equipo. UNA sola variable para los tres sitios desde los que se
// puede elegir (el desplegable del paso 5, el de la ficha y las alternativas): «se elimina la
// separacion entre pickModel y verdict-sel» (§11.1 del informe). No aprueba nada: pide al
// motor que revalide ese equipo.
let seleccionManual = null;
let metricaEje = 'auto';
let verEol = false;
let RES = null; // el ultimo resultado del motor: la unica verdad de la pantalla
let ESC = null; // el escenario que lo produjo, tal cual se manda al servidor
let ST = null; // lo que devuelve ESTADO.vincular (para refrescar el enlace)
let ultimoAnuncio = '';
let ultimaConfirmacion = null; // {accion, ts, hash, gate} de la ultima salida confirmada

const VENDOR = 'fortinet';
const CARE_LIC_KEY = { fc247: 'essential', fcpre: 'premium', fcelite: 'elite' };
const FUNCIONES_ID = ['chkAv', 'chkWeb', 'chkIotDlp', 'chkSsl', 'chkSandbox'];
const CHK_SDWAN = { sdwanMon: 'chkSdwanMon', sdwanOrq: 'chkSdwanOrq', sdwanSase: 'chkSdwanSase' };
const OPEX_FORTINET = ['Licencias FortiGuard', 'Soporte'];
const GATE = {
  READY: { n: 'Lista para cotizar', cls: 'ok' },
  WARNING: { n: 'Cotizable con advertencias', cls: 'warn' },
  DRAFT: { n: 'Solo borrador técnico', cls: 'warn' },
  BLOCKED: { n: 'Bloqueada', cls: 'bad' },
};
const TIERS = [
  { k: 'fw', n: 'Firewall', d: 'Firewall stateful, 1518 B UDP. Sesión descargada al ASIC de red (NP7/SP5), sin inspección de contenido.' },
  { k: 'vpn', n: 'IPsec VPN', d: 'Túnel IPsec, 512 B. Criptografía descargada al ASIC.' },
  { k: 'ips', n: 'IPS', d: 'IPS sobre Enterprise Mix. La sesión sale del offload de red; el content processor (CP9/CP10) asiste el pattern matching.' },
  { k: 'ngfw', n: 'NGFW', d: 'IPS + Application Control sobre Enterprise Mix.' },
  { k: 'tp', n: 'Threat Protection', d: 'NGFW + antivirus + logging. Stack de seguridad completo — el número realista de una sucursal.' },
];
const TIER_BY_K = Object.fromEntries(TIERS.map((t) => [t.k, t]));
const SOFTWARE = [
  { n: 'FortiManager', d: 'Orquestación de políticas y SD-WAN. Appliance de entrada FMG-200G: hasta 30 dispositivos/VDOMs.' },
  { n: 'FortiAnalyzer', d: 'Correlación y retención de logs. Appliance de entrada FAZ-150G: hasta 25 GB/día.' },
  { n: 'FortiSandbox', d: 'Análisis dinámico de archivos zero-day. Ver el paso 2: incluido, servicio del FortiGate o dedicado.' },
  { n: 'FortiClient EMS', d: 'Gestión de endpoints ZTNA + VPN, licenciado por endpoints gestionados.' },
  { n: 'FortiSASE', d: 'SASE, ZTNA y EPP como servicio, licenciado por usuario.' },
];

/* ── EL FORMULARIO, COMO TABLA ──────────────────────────────────────────────────────────
   Ruta del escenario del motor → control de la pagina. De aqui salen tres cosas que antes
   vivian en tres sitios: la lectura del escenario, el campo al que lleva un error o una
   correccion, y el paso al que pertenece cada dato. `vacio` es lo que vale un campo sin
   rellenar: el valor por defecto del propio motor. */
const UI = [
  ['software.fortiOS', 'fortiOS', 'txt'],
  ['software.inspeccion', 'modoInspeccion', 'txt'],
  ['topologia.hubs', 'hubs', 'num', 1],
  ['topologia.spokes', 'sites', 'num', 1],
  ['topologia.simultaneidadPct', 'conc', 'num', 35],
  ['trafico.interVlanMbps', 'interVlan', 'num', 0],
  ['trafico.picosNoConcurrentes', 'chkNoConcurrente', 'chk'],
  ['seguridad.tlsCifradoPct', 'pctCifrado', 'num', 100],
  ['seguridad.tlsExentoPct', 'pctTlsExento', 'num', 0],
  ['remoto.activo', 'chkRemoto', 'chk'],
  ['remoto.metodo', 'vpnTipo', 'txt'],
  ['remoto.usuarios', 'vpnUsers', 'num', 0],
  ['remoto.mbps', 'vpnMbps', 'num', 0],
  ['remoto.mfa', 'chkMfa', 'chk'],
  ['escala.usuarios', 'users', 'num', 0],
  ['escala.sesionesPorUsuario', 'sesUser', 'num', 0],
  ['escala.sesionesMedidas', 'sessNeed', 'num', 0],
  ['escala.vidaSesionS', 'vidaSes', 'num', 30],
  ['escala.cpsMedido', 'cpsMedido', 'num', 0],
  ['escala.vdoms', 'vdoms', 'num', 0],
  ['escala.fortiAps', 'fortiAps', 'num', 0],
  ['escala.fortiSwitches', 'fortiSwitches', 'num', 0],
  ['fisico.poeW', 'poeW', 'num', 0],
  ['fisico.psuRedundante', 'chkPsuRed', 'chk'],
  ['fisico.registro', 'registroDestino', 'txt'],
  ['fisico.registroGbDia', 'registroGbDia', 'num', 0],
  ['fisico.registroDias', 'registroDias', 'num', 0],
  ['politica.crecimientoPct', 'head', 'num', 30],
  ['politica.techoPct', 'techoUtil', 'num', 100],
  ['comercial.motivo', 'motivoCompra', 'txt'],
  ['comercial.anios', 'termYears', 'num', 3],
  ['comercial.bundle', 'licBundle', 'txt'],
  ['comercial.soporte', 'careLevel', 'txt'],
  ['comercial.converter', 'chkConverter', 'chk'],
  ['comercial.emsActivo', 'chkEms', 'chk'],
  ['comercial.emsEndpoints', 'emsEndpoints', 'num', 0],
  ['comercial.sandboxModalidad', 'sandboxModalidad', 'txt'],
  ['comercial.saseUsuarios', 'saseUsuarios', 'num', 0],
  ['comercial.serieInstalada', 'serieInstalada', 'txt'],
  ['comercial.justificacionEol', 'justificacionEol', 'txt'],
];
const PUERTOS_ID = M.TIPOS_PUERTO.map((t) => [t.k, `pt_${t.k}`]);
// Campo del motor → control que lo edita. Lo usan los errores, los obligatorios y las
// correcciones ofrecidas.
const CAMPO_ID = Object.fromEntries(UI.map(([ruta, id]) => [ruta, id]));
Object.assign(CAMPO_ID, {
  'sitio.segmento': 'segSeg', 'topologia.rol': 'rolSeg', 'seguridad.capa': 'profileSeg',
  'comercial.sandbox': 'sandboxModo', 'comercial.sdwan': 'chkSdwanMon', 'seleccion.manual': 'pickModel',
  'disponibilidad.modo': 'chkHa',
});
for (const [k, id] of PUERTOS_ID) CAMPO_ID[`fisico.puertos.${k}`] = id;
// Nombre legible de cada campo del motor, para los inactivos y los errores.
const CAMPO_N = {
  'topologia.hubs': 'hubs a los que cifra', 'topologia.spokes': 'spokes del hub',
  'topologia.simultaneidadPct': 'simultaneidad de los spokes', 'comercial.sdwan': 'servicios avanzados de SD-WAN',
  'comercial.saseUsuarios': 'usuarios de FortiSASE', 'remoto.metodo': 'método de acceso remoto',
  'remoto.usuarios': 'usuarios de acceso remoto', 'remoto.mbps': 'caudal de acceso remoto', 'remoto.mfa': 'doble factor',
  'seguridad.tlsCifradoPct': 'parte cifrada del tráfico', 'seguridad.tlsExentoPct': 'tráfico exento de inspección TLS',
  'fisico.registroGbDia': 'GB/día de registro', 'fisico.registroDias': 'días de retención',
  'comercial.emsEndpoints': 'endpoints de FortiClient EMS', 'comercial.sandbox': 'modo de FortiSandbox',
  'comercial.sandboxModalidad': 'modalidad del FortiSandbox dedicado', 'comercial.serieInstalada': 'serie instalada',
  'comercial.justificacionEol': 'justificación del equipo fuera de venta', 'topologia.enlaces': 'enlaces WAN',
};
// Nombre legible de lo que toca cada regla (`afecta` del motor).
const AFECTA_N = {
  caudal: 'caudal de la capa', tunGw: 'túneles sitio a sitio', tunCli: 'túneles de cliente', vpn: 'eje IPsec',
  sslVpnUsers: 'usuarios SSL-VPN', sslVpn: 'caudal SSL-VPN', sess: 'tabla de sesiones', tokens: 'FortiToken',
  ssl: 'eje de inspección SSL', almacenamiento: 'disco del equipo', bom: 'lista de materiales', puerta: 'puerta de cotización',
};

/* ── CAMPOS DEL ENLACE Y DE LOS PERFILES ────────────────────────────────────────────────
   Una sola lista. Lo que un campo NO APLICA no viaja (estado.js salta los grupos marcados
   `data-inactivo`). `verdict-sel` sale de la lista: el equipo elegido viaja como `pickModel`,
   que es el unico selector; los enlaces viejos que lo traen se leen al arrancar (ver
   `restaurarSeleccionDeUrl`). `qty` sale tambien: se deriva de la alta disponibilidad. */
const CAMPOS_ESCENARIO = ['nombreCliente', 'refProyecto', 'wanLinksData',
  'segSeg', 'rolSeg', 'fortiOS', 'modoInspeccion', 'chkHa', 'haModo',
  'profileSeg', 'chkAv', 'chkWeb', 'chkIotDlp', 'chkSsl', 'pctCifrado', 'pctTlsExento',
  'chkSandbox', 'sandboxModo', 'sandboxModalidad',
  'interVlan', 'chkNoConcurrente', 'sites', 'hubs', 'conc',
  'chkRemoto', 'vpnTipo', 'vpnUsers', 'vpnMbps', 'chkMfa',
  'users', 'sesUser', 'sessNeed', 'vidaSes', 'cpsMedido', 'vdoms', 'fortiAps', 'fortiSwitches',
  'pt_rj45_1g', 'pt_rj45_10g', 'pt_sfp_1g', 'pt_sfpp_10g', 'pt_sfp28_25g', 'pt_qsfp28_100g',
  'poeW', 'chkPsuRed', 'registroDestino', 'registroGbDia', 'registroDias', 'head', 'techoUtil',
  'motivoCompra', 'serieInstalada', 'pickModel', 'justificacionEol', 'termYears', 'licBundle', 'careLevel',
  'chkSdwanMon', 'chkSdwanOrq', 'chkSdwanSase', 'saseUsuarios', 'chkEms', 'emsEndpoints', 'chkConverter',
  'selDescuento', 'dtoCustom'];
// Los parametros del escenario ANTERIOR al builder (v1), que `migrarEstadoV1` convierte.
const PARAMS_V1 = ['bw', 'unit', 'pctOverlay'];
// Parametros viejos que esta pagina sabe leer sin denunciarlos como perdidos.
const PARAMS_CONOCIDOS = PARAMS_V1.concat(['verdict-sel', 'qty']);

/* ══ PESTAÑAS CON ROVING TABINDEX (F17, WCAG 2.2) ════════════════════════════════════════
   Flechas izquierda/derecha, Inicio y Fin mueven el foco y eligen; solo la pestaña activa
   entra en el orden de tabulacion. Mismo codigo para las dos listas de la pagina. */
function cablearTabs(lista, alElegir) {
  if (!lista) return;
  const tabs = () => [...lista.querySelectorAll('[role=tab]')];
  const elegir = (b, foco) => {
    for (const t of tabs()) {
      const on = t === b;
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
      const p = $(t.getAttribute('aria-controls'));
      if (p) p.hidden = !on;
    }
    if (foco) b.focus();
    if (alElegir) alElegir(b);
  };
  lista.addEventListener('click', (e) => { const b = e.target.closest('[role=tab]'); if (b) elegir(b, false); });
  lista.addEventListener('keydown', (e) => {
    const ts = tabs();
    const i = ts.indexOf(document.activeElement);
    if (i < 0) return;
    let j = null;
    if (e.key === 'ArrowRight') j = (i + 1) % ts.length;
    else if (e.key === 'ArrowLeft') j = (i - 1 + ts.length) % ts.length;
    else if (e.key === 'Home') j = 0;
    else if (e.key === 'End') j = ts.length - 1;
    if (j == null) return;
    e.preventDefault();
    elegir(ts[j], true);
  });
  return { elegir: (sel, foco) => { const b = typeof sel === 'string' ? lista.querySelector(sel) : sel; if (b) elegir(b, foco); } };
}
const TABS = cablearTabs(document.querySelector('.tabs'));
cablearTabs(document.querySelector('.res-tabs'));

/* ══ M1 · MULTI-UNDERLAY BUILDER ══════════════════════════════════════════════════════════
   Cada fila es {tipo, down, overlay, rol}. El ROL es nuevo (F05): un enlace de RESPALDO no
   suma en operacion normal y entra en el escenario de falla del enlace que sustituye, donde
   la carga puede cambiar de breakout local a overlay cifrado. #bw y #pctOverlay siguen como
   espejos ocultos de los enlaces ACTIVOS, que es lo que eran antes de que existiera el rol. */
const TIPOS_WAN = M.TIPOS_WAN;
let wanSeq = 0;
let wanRolPintado = null;
function familiaTipoWan(tipo) {
  if (/^MPLS/.test(tipo)) return { cls: 'mpls', n: 'MPLS' };
  if (/^4G\/5G/.test(tipo)) return { cls: 'cel', n: 'Celular' };
  return { cls: 'inet', n: 'Internet' };
}
function overlaySugerido(tipo) { return /^MPLS|^4G\/5G/.test(tipo); }
function leerWanLinks() {
  return [...document.querySelectorAll('#wanBuilderFilas .wan-fila')].map((f) => {
    const ov = f.querySelector('[data-campo=overlay]');
    const rol = f.querySelector('[data-campo=rol]');
    return {
      id: parseInt(f.dataset.id, 10) || 0,
      tipo: f.querySelector('[data-campo=tipo]').value,
      down: Math.max(0, parseFloat(f.querySelector('[data-campo=down]').value) || 0),
      overlay: !!ov.checked,
      overlayManual: ov.dataset.manual === '1',
      rol: rol && rol.value === 'respaldo' ? 'respaldo' : 'activo',
    };
  });
}
function wanFilaHtml(l, idx) {
  const ops = (lista, v) => lista.map((x) => `<option value="${esc(x)}"${x === v ? ' selected' : ''}>${esc(x)}</option>`).join('');
  const fam = familiaTipoWan(l.tipo);
  const n = idx == null ? '?' : idx + 1;
  const naOv = rolSdwan === 'none';
  const rol = l.rol === 'respaldo' ? 'respaldo' : 'activo';
  return `<div class="wan-fila" data-id="${l.id}">`
    + `<div class="wan-cab"><span class="wan-num">Enlace ${n}</span><span class="wan-badge ${fam.cls}" data-wan-badge>${fam.n}</span>`
    + `<span class="wan-acc">`
    + `<button type="button" class="wan-iconbtn" data-wan-duplicar="${l.id}" title="Duplicar este enlace" aria-label="Duplicar el enlace ${n}">&#10697;</button>`
    + `<button type="button" class="wan-iconbtn" data-wan-quitar="${l.id}" title="Quitar este enlace" aria-label="Quitar el enlace ${n}">&times;</button>`
    + '</span></div>'
    + '<div class="wan-grid">'
    + `<div class="wan-campo"><label>Transporte</label><select data-campo="tipo" aria-label="Tipo de transporte del enlace ${n}">${ops(TIPOS_WAN, l.tipo)}</select></div>`
    + `<div class="wan-campo"><label>Caudal</label><span class="wan-bw"><input type="number" data-campo="down" min="0" step="any" placeholder="100" value="${l.down || ''}" aria-label="Caudal del enlace ${n} en Mbps" autocomplete="off"><span class="wan-sufijo">Mbps</span></span></div>`
    + `<div class="wan-campo"><label>Rol</label><select data-campo="rol" aria-label="Rol del enlace ${n}">`
    + `<option value="activo"${rol === 'activo' ? ' selected' : ''}>Activo</option>`
    + `<option value="respaldo"${rol === 'respaldo' ? ' selected' : ''}>Respaldo (entra si cae otro)</option></select></div>`
    + `<label class="wan-ov${naOv ? ' na' : ''}"><input type="checkbox" data-campo="overlay"${l.overlay ? ' checked' : ''}${naOv ? ' disabled' : ''}${l.overlayManual ? ' data-manual="1"' : ''} aria-label="El tráfico del enlace ${n} va por el overlay SD-WAN"> ${naOv ? 'Overlay SD-WAN (sin rol SD-WAN no aplica)' : 'Va por el overlay SD-WAN'}</label>`
    + '</div>'
    + '<p class="wan-msg" data-wan-msg hidden></p>'
    + '</div>';
}
function pintarWanFilas(links) {
  $('wanBuilderFilas').innerHTML = links.map(wanFilaHtml).join('');
  validarWanFilas();
}
function validarWanFila(f) {
  const downEl = f.querySelector('[data-campo=down]');
  const down = parseFloat(downEl.value);
  const tipo = f.querySelector('[data-campo=tipo]').value;
  const ov = f.querySelector('[data-campo=overlay]').checked;
  const respaldo = f.querySelector('[data-campo=rol]').value === 'respaldo';
  const msg = f.querySelector('[data-wan-msg]');
  const malo = !(down > 0);
  downEl.classList.toggle('wan-invalido', malo);
  downEl.setAttribute('aria-invalid', malo ? 'true' : 'false');
  let txt = '';
  let cls = '';
  if (malo) { txt = 'Declara el caudal (Mbps): sin él, este enlace no cuenta.'; cls = 'err'; }
  else if (respaldo) { txt = 'Respaldo: no suma en operación normal. Entra en el escenario de falla de cada enlace activo, hasta su caudal.'; cls = ''; }
  else if (ov && /^4G\/5G/.test(tipo)) { txt = 'Overlay sobre 4G/5G activo: si es un respaldo, márcalo como tal y dejará de sumar en operación normal.'; cls = 'warn'; }
  msg.hidden = !txt;
  msg.textContent = txt;
  msg.className = `wan-msg${cls ? ` ${cls}` : ''}`;
}
function validarWanFilas() { document.querySelectorAll('#wanBuilderFilas .wan-fila').forEach(validarWanFila); }
// Espejos del motor anterior: el caudal y la fraccion cifrada de los enlaces ACTIVOS.
function actualizarEspejos() {
  const links = leerWanLinks();
  const act = links.filter((l) => l.rol !== 'respaldo');
  const total = act.reduce((a, l) => a + l.down, 0);
  const ovl = act.filter((l) => l.overlay).reduce((a, l) => a + l.down, 0);
  $('bw').value = total ? String(total) : '';
  $('unit').value = '1';
  $('pctOverlay').value = total ? String(Math.round((ovl / total) * 100)) : '100';
  return { links, total, ovl };
}
function sincronizarWanHidden() {
  const { links } = actualizarEspejos();
  const h = $('wanLinksData');
  // `overlayManual` es detalle de interfaz y no viaja; el rol solo viaja si no es el de
  // siempre, para que un enlace compartido antes de existir el rol siga siendo identico.
  h.value = JSON.stringify({ v: 2, wanLinks: links.map((l) => Object.assign({ id: l.id, tipo: l.tipo, down: l.down, overlay: l.overlay },
    l.rol === 'respaldo' ? { rol: 'respaldo' } : {})) });
  h.dispatchEvent(new Event('input', { bubbles: true }));
}
function reconstruirWanDesdeHidden() {
  let links = null;
  try {
    const d = JSON.parse($('wanLinksData').value || 'null');
    if (d && Array.isArray(d.wanLinks) && d.wanLinks.length) links = d.wanLinks;
  } catch { links = null; }
  if (!links) links = [{ id: ++wanSeq, tipo: 'DIA', down: 0, overlay: false }];
  links.forEach((l) => {
    if (!l.id) l.id = ++wanSeq;
    wanSeq = Math.max(wanSeq, l.id);
    if (!TIPOS_WAN.includes(l.tipo)) l.tipo = 'DIA';
    if (l.overlay == null) l.overlay = overlaySugerido(l.tipo);
    l.overlayManual = l.overlay !== overlaySugerido(l.tipo);
  });
  pintarWanFilas(links);
  actualizarEspejos();
}
function pintarWanResumen() {
  const box = $('wanResumen');
  if (!box) return;
  const { links, total, ovl } = actualizarEspejos();
  if (!links.length) { box.hidden = true; box.innerHTML = ''; return; }
  const act = links.filter((l) => l.down > 0 && l.rol !== 'respaldo');
  const resp = links.filter((l) => l.down > 0 && l.rol === 'respaldo');
  let html = `<span>Caudal del sitio <b>${fmt(total)}</b></span><span class="wan-res-sep">·</span>`;
  if (act.length) {
    const nM = act.filter((l) => /^MPLS/.test(l.tipo)).length;
    const nC = act.filter((l) => /^4G\/5G/.test(l.tipo)).length;
    const nI = act.length - nM - nC;
    const fam = [];
    if (nM) fam.push(`${nM} MPLS`);
    if (nI) fam.push(`${nI} Internet`);
    if (nC) fam.push(`${nC} celular`);
    html += `<span>${act.length} enlace${act.length === 1 ? '' : 's'} activo${act.length === 1 ? '' : 's'} (${fam.join(', ')})</span>`;
    if (resp.length) html += `<span class="wan-res-sep">·</span><span>${resp.length} de respaldo (<b>${fmt(resp.reduce((a, l) => a + l.down, 0))}</b>), fuera de la operación normal</span>`;
    if (rolSdwan !== 'none') {
      const pct = total ? Math.round((ovl / total) * 100) : 100;
      html += `<span class="wan-res-sep">·</span><span>Por el overlay <b>${fmt(ovl)}</b> = <b>${pct} %</b>`
        + `${pct < 100 ? ` · breakout local <b>${fmt(total - ovl)}</b>` : ''}</span>`;
    }
  } else {
    html += '<span>sin enlaces activos con caudal — declara los Mbps de cada fila</span>';
  }
  box.innerHTML = html;
  box.hidden = false;
}
// Migracion v1→v2: un enlace antiguo (?bw=2500&unit=1&pctOverlay=70) se convierte en filas
// equivalentes. Un enlace viejo que aterriza con los valores por defecto es peor que un 404.
function migrarEstadoV1() {
  const p = new URLSearchParams(location.search);
  if (p.has('wanLinksData')) return false;
  if (!PARAMS_V1.some((k) => p.has(k))) return false;
  const bw = (parseFloat(p.get('bw')) || 0) * (parseFloat(p.get('unit')) || 1);
  if (!(bw > 0)) return false;
  const pct = p.has('pctOverlay') ? Math.max(0, Math.min(100, parseFloat(p.get('pctOverlay')) || 0)) : 100;
  const links = filasV1(bw, pct);
  console.warn('[dimensionador-fortinet] Migracion de estado v1→v2: el caudal unico y el'
    + ' porcentaje de overlay (bw/unit/pctOverlay) se convirtieron en', links.length,
    'fila(s) del Multi-Underlay Builder.', links);
  $('wanLinksData').value = JSON.stringify({ v: 2, wanLinks: links });
  return true;
}
function filasV1(bw, pct) {
  const ovl = Math.round((bw * pct) / 100);
  const resto = bw - ovl;
  const links = [];
  if (ovl > 0) links.push({ id: ++wanSeq, tipo: 'MPLS L3', down: ovl, overlay: true });
  if (resto > 0) links.push({ id: ++wanSeq, tipo: 'DIA', down: resto, overlay: false });
  if (!links.length) links.push({ id: ++wanSeq, tipo: 'DIA', down: bw, overlay: false });
  return links;
}
$('btnAddWan').addEventListener('click', () => {
  const links = leerWanLinks();
  links.push({ id: ++wanSeq, tipo: 'DIA', down: 0, overlay: overlaySugerido('DIA') });
  pintarWanFilas(links);
  sincronizarWanHidden();
  programar(true, 'wan');
});
$('wanBuilder').addEventListener('input', (e) => {
  const t = e.target;
  if (!t.dataset || !t.dataset.campo) return;
  const fila = t.closest('.wan-fila');
  if (t.dataset.campo === 'overlay') t.dataset.manual = '1';
  if (t.dataset.campo === 'tipo' && fila) {
    const badge = fila.querySelector('[data-wan-badge]');
    const fam = familiaTipoWan(t.value);
    badge.className = `wan-badge ${fam.cls}`;
    badge.textContent = fam.n;
    const ov = fila.querySelector('[data-campo=overlay]');
    if (ov.dataset.manual !== '1') ov.checked = overlaySugerido(t.value);
  }
  if (fila) validarWanFila(fila);
  sincronizarWanHidden();
  programar(t.dataset.campo !== 'down', 'wan');
});
$('wanBuilder').addEventListener('click', (e) => {
  const dup = e.target.closest('[data-wan-duplicar]');
  if (dup) {
    const links = leerWanLinks();
    const i = links.findIndex((l) => l.id === parseInt(dup.dataset.wanDuplicar, 10));
    if (i >= 0) links.splice(i + 1, 0, { ...links[i], id: ++wanSeq });
    pintarWanFilas(links);
    sincronizarWanHidden();
    programar(true, 'wan');
    return;
  }
  const b = e.target.closest('[data-wan-quitar]');
  if (!b) return;
  let links = leerWanLinks().filter((l) => l.id !== parseInt(b.dataset.wanQuitar, 10));
  if (!links.length) links = [{ id: ++wanSeq, tipo: 'DIA', down: 0, overlay: false }];
  pintarWanFilas(links);
  sincronizarWanHidden();
  programar(true, 'wan');
});

/* ══ LECTURA DEL ESCENARIO ════════════════════════════════════════════════════════════════
   El formulario se traduce al escenario del motor SIN interpretarlo: un numero se pasa como
   numero y es el esquema del motor el que dice si es valido (un -5 o un 2,5 donde va un
   entero es un error con nombre, no un 0 silencioso). Un campo vacio vale su valor por
   defecto. */
function leerCampo(id, tipo, vacio) {
  const n = $(id);
  if (!n) return vacio;
  if (tipo === 'chk') return !!n.checked;
  if (tipo === 'txt') return n.value;
  const t = String(n.value).trim();
  if (t === '') return vacio;
  const v = Number(t);
  return Number.isFinite(v) ? v : t;
}
function ponerRuta(o, ruta, v) {
  const ks = ruta.split('.');
  const ult = ks.pop();
  let a = o;
  for (const k of ks) { if (!a[k] || typeof a[k] !== 'object') a[k] = {}; a = a[k]; }
  a[ult] = v;
}
function leerEscenario() {
  const s = { esquema: M.ESQUEMA };
  for (const [ruta, id, tipo, vacio] of UI) ponerRuta(s, ruta, leerCampo(id, tipo, vacio));
  s.sitio = { segmento: segMode };
  s.topologia.rol = rolSdwan;
  s.topologia.enlaces = leerWanLinks().map((l) => ({ id: l.id, tipo: l.tipo, down: l.down, overlay: l.overlay, rol: l.rol }));
  s.seguridad.capa = profile;
  s.seguridad.funciones = FUNCIONES_ID.filter((id) => $(id) && $(id).checked);
  s.fisico.puertos = Object.fromEntries(PUERTOS_ID.map(([k, id]) => [k, leerCampo(id, 'num', 0)]));
  s.disponibilidad = { modo: $('chkHa').checked ? $('haModo').value : 'standalone' };
  s.comercial.sdwan = Object.entries(CHK_SDWAN).filter(([, id]) => $(id).checked).map(([k]) => k);
  s.comercial.sandbox = $('chkSandbox').checked ? $('sandboxModo').value : 'ninguno';
  s.seleccion = { manual: seleccionManual };
  return s;
}

/* ══ CORRECCIONES AUTOMATICAS REVERSIBLES (§10.3 del informe) ════════════════════════════
   «Si una seleccion invalida otra, ofrecer correccion automatica reversible y explicar el
   motivo». Solo se corrige AL CAMBIAR EL CAMPO QUE DISPARA el conflicto —marcar DLP con UTP
   elegido, pasar a FortiOS 7.6.3 con SSL-VPN puesto—: si despues alguien elige a mano la
   opcion invalida, eso es una decision y la puerta la bloquea con su motivo, en vez de
   deshacerla por detras. */
let correccion = null; // {id, antes, texto}
function autocorregir(origen) {
  if (!CAT) return;
  if (FUNCIONES_ID.includes(origen) && $(origen).checked) {
    const funciones = FUNCIONES_ID.filter((id) => $(id).checked);
    const err = R.validarBundle($('licBundle').value, funciones, FUNCIONES, BUNDLES);
    if (err && err.bloquea !== false && err.minimo && BUNDLES[err.minimo]) {
      const antes = $('licBundle').value;
      $('licBundle').value = err.minimo;
      const f = FUNCIONES.find((x) => x.id === origen);
      mostrarCorreccion('licBundle', antes, `Se cambió el bundle a <b>${esc(BUNDLES[err.minimo].n)}</b>: `
        + `${esc(f ? f.n : 'la función marcada')} no está en ${esc(BUNDLES[antes] ? BUNDLES[antes].n : antes)}.`);
    }
  }
  if (origen === 'fortiOS' && $('fortiOS').value === '7.6.3+' && $('chkRemoto').checked && $('vpnTipo').value === 'sslvpn') {
    $('vpnTipo').value = 'ipsec';
    mostrarCorreccion('vpnTipo', 'sslvpn', 'El acceso remoto pasó a <b>IPsec</b>: el modo túnel SSL-VPN no existe en FortiOS 7.6.3 o superior.');
  }
}
function mostrarCorreccion(id, antes, texto) {
  correccion = { id, antes, texto };
  const caja = $('autoCorr');
  caja.innerHTML = `<span>${texto}</span><button type="button" class="btn ghost btn-corr" id="btnCorrDeshacer">Deshacer</button>`
    + '<button type="button" class="btn ghost btn-corr" id="btnCorrCerrar" aria-label="Cerrar el aviso">Entendido</button>';
  caja.hidden = false;
  anunciar(caja.textContent.replace(/DeshacerEntendido$/, ''), true);
}
$('autoCorr').addEventListener('click', (e) => {
  if (e.target.id === 'btnCorrDeshacer' && correccion) {
    $(correccion.id).value = correccion.antes;
    $(correccion.id).dispatchEvent(new Event('input', { bubbles: true }));
  }
  if (e.target.id === 'btnCorrDeshacer' || e.target.id === 'btnCorrCerrar') {
    correccion = null;
    $('autoCorr').hidden = true;
    programar(true);
  }
});

/* ══ HISTORIAL PARA DESHACER (§10.3) ══════════════════════════════════════════════════════
   Cada cambio consolidado guarda el escenario anterior; «Deshacer» lo repone entero. Se
   consolida con un respiro de medio segundo para que teclear «2500» sea un cambio y no
   cuatro. */
let historial = [];
let estadoActual = null;
let restaurando = false;
let tHistorial = null;
function registrarHistorial() {
  if (restaurando) return;
  clearTimeout(tHistorial);
  tHistorial = setTimeout(() => {
    const nuevo = JSON.stringify(capturarCampos());
    if (estadoActual && nuevo !== estadoActual) {
      historial.push(estadoActual);
      if (historial.length > 30) historial.shift();
    }
    estadoActual = nuevo;
    $('btnDeshacer').disabled = !historial.length;
  }, 500);
}
$('btnDeshacer').addEventListener('click', () => {
  const previo = historial.pop();
  if (!previo) return;
  restaurando = true;
  aplicarCampos(JSON.parse(previo));
  estadoActual = previo;
  restaurando = false;
  $('btnDeshacer').disabled = !historial.length;
  anunciar('Se deshizo el último cambio del escenario.', true);
});

/* ══ EVALUACION ═══════════════════════════════════════════════════════════════════════════
   «Recalcular en cada cambio mediante un unico reducer; debounce corto solo en campos
   numericos» (§10.3). Todo cambio pasa por aqui. */
let tRender = null;
function programar(inmediato, origen) {
  clearTimeout(tRender);
  if (origen) autocorregir(origen);
  registrarHistorial();
  if (inmediato) evaluarYPintar();
  else tRender = setTimeout(evaluarYPintar, 140);
}
function evaluarYPintar() {
  clearTimeout(tRender);
  if (!CAT) return;
  const escenario = leerEscenario();
  RES = M.evaluar(escenario, CAT, { hoy: new Date().toISOString() });
  ESC = escenario;
  pintarTodo();
}

// ── Enlaces de los controles ─────────────────────────────────────────────────────────────
function segClick(id, alElegir) {
  $(id).addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    [...$(id).children].forEach((x) => x.setAttribute('aria-pressed', x === b ? 'true' : 'false'));
    alElegir(b.dataset.v);
    programar(true, id);
  });
}
segClick('profileSeg', (v) => { profile = v; });
segClick('rolSeg', (v) => { rolSdwan = v; });
segClick('segSeg', (v) => { segMode = v; });
// Numericos con respiro; el resto (casillas, desplegables) al instante.
const NUMERICOS = UI.filter(([, , t]) => t === 'num').map(([, id]) => id).concat(PUERTOS_ID.map(([, id]) => id))
  .filter((id) => $(id) && $(id).tagName === 'INPUT');
for (const id of NUMERICOS) { const n = $(id); if (n) n.addEventListener('input', () => programar(n.type === 'range', id)); }
const INMEDIATOS = ['fortiOS', 'modoInspeccion', 'chkHa', 'haModo', 'chkAv', 'chkWeb', 'chkIotDlp', 'chkSsl', 'pctCifrado',
  'pctTlsExento', 'chkSandbox', 'sandboxModo', 'sandboxModalidad', 'chkNoConcurrente', 'chkRemoto', 'vpnTipo', 'chkMfa',
  'chkPsuRed', 'registroDestino', 'techoUtil', 'motivoCompra', 'termYears', 'licBundle', 'careLevel',
  'chkSdwanMon', 'chkSdwanOrq', 'chkSdwanSase', 'chkEms', 'chkConverter'];
for (const id of INMEDIATOS) { const n = $(id); if (n) n.addEventListener(n.tagName === 'SELECT' ? 'change' : 'input', () => programar(true, id)); }
// Los selects tambien disparan `input` en los navegadores actuales; con `change` basta y
// evita evaluar dos veces.
for (const id of ['serieInstalada', 'justificacionEol']) $(id).addEventListener('input', () => programar(false, id));
for (const id of ['nombreCliente', 'refProyecto']) $(id).addEventListener('input', () => { registrarHistorial(); pintarBom(); });
$('pickModel').addEventListener('change', () => fijarSeleccion($('pickModel').value || null));
$('metricaEje').addEventListener('change', () => { metricaEje = $('metricaEje').value; if (RES) pintarEscala(RES); });
$('chkVerEol').addEventListener('change', () => { verEol = $('chkVerEol').checked; if (RES) pintarEscala(RES); });
$('btnEmsSugerir').addEventListener('click', () => {
  const n = (parseInt($('users').value, 10) || 0) + ($('chkRemoto').checked ? (parseInt($('vpnUsers').value, 10) || 0) : 0);
  $('emsEndpoints').value = n ? String(n) : '';
  $('emsHint').innerHTML = n
    ? `Sugerencia aplicada: <b>${cifra(n)}</b> = usuarios del sitio${$('chkRemoto').checked ? ' + remotos' : ''}. Ajústala a los endpoints que de verdad llevan FortiClient; se licencia en tramos de 25.`
    : 'No hay usuarios declarados de los que partir: escribe la cifra de endpoints gestionados.';
  programar(true, 'emsEndpoints');
});
$('btnRevisarBom').addEventListener('click', () => { if (TABS) TABS.elegir('#tab-bom', true); });

/* La eleccion manual, desde donde venga. Elegir el recomendado es SEGUIR la recomendacion:
   si el escenario cambia despues, se sigue al nuevo recomendado en vez de quedarse fijo. */
function fijarSeleccion(id) {
  const rec = RES && RES.recomendacion ? RES.recomendacion.id : null;
  seleccionManual = id && id !== rec ? id : null;
  $('pickModel').value = seleccionManual || '';
  $('pickModel').dispatchEvent(new Event('input', { bubbles: true }));
  programar(true);
}
document.addEventListener('click', (e) => {
  const alt = e.target.closest('[data-alt]');
  if (alt) { fijarSeleccion(alt.dataset.alt); return; }
  const corr = e.target.closest('[data-corregir]');
  if (corr) aplicarCorreccion(JSON.parse(corr.dataset.corregir));
});
function aplicarCorreccion(c) {
  if (!c) return;
  if (c.accion === 'volver-recomendado') { fijarSeleccion(null); return; }
  if (c.accion === 'cambiar' && CAMPO_ID[c.campo]) {
    const n = $(CAMPO_ID[c.campo]);
    n.value = c.valor;
    n.dispatchEvent(new Event(n.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }));
    const r = $('stickyReco');
    if (r) r.focus();
    return;
  }
  if (c.accion === 'ir' && c.campo) irAlCampo(c.campo);
}
function irAlCampo(campo) {
  const id = CAMPO_ID[campo];
  const n = id ? $(id) : (campo === 'topologia.enlaces' ? document.querySelector('#wanBuilderFilas [data-campo=down]') : null);
  if (!n) return;
  const d = n.closest('details');
  if (d) d.open = true;
  n.scrollIntoView({ block: 'center' });
  n.focus();
}

/* ══ PINTADO ══════════════════════════════════════════════════════════════════════════════ */
function pintarTodo() {
  const r = RES;
  aplicarReglas(r);
  pintarControles(r);
  pintarWanResumen();
  pintarErrores(r);
  pintarHints(r);
  pintarCabecera(r);
  pintarEjes(r);
  pintarFicha(r);
  pintarShortlist(r);
  pintarRequisitos(r);
  pintarEscala(r);
  pintarTiers(r);
  pintarBomPreliminar(r);
  pintarPie(r);
  pintarBom();
  pintarPasos(r);
  pintarFuentesCalculo(r);
  anunciarCambio(r);
  if (ST && ST.volcar) ST.volcar();
}

/* EL FORMULARIO DINAMICO SALE DEL MOTOR (F09, F10). `r.campos` es la misma tabla con la que
   el motor decide que cuenta: visible, obligatorio y si falta. Lo oculto se marca
   `data-inactivo` —estado.js no lo pone en el enlace— y conserva su valor. */
function aplicarReglas(r) {
  const campos = r.campos || {};
  document.querySelectorAll('[data-regla]').forEach((caja) => {
    const regla = caja.dataset.regla;
    let visible;
    let requerido = false;
    let falta = false;
    if (regla === 'ha') visible = $('chkHa').checked;
    else if (campos[regla]) ({ visible, requerido, falta } = campos[regla]);
    else return;
    caja.hidden = !visible;
    if (visible) caja.removeAttribute('data-inactivo'); else caja.setAttribute('data-inactivo', '1');
    caja.classList.toggle('falta', !!falta);
    const input = caja.querySelector('input:not([type=checkbox]),select,textarea');
    if (input) input.setAttribute('aria-required', requerido ? 'true' : 'false');
    const lbl = caja.querySelector('label');
    if (lbl) {
      let marca = lbl.querySelector('.obligatorio');
      if (requerido && !marca) { marca = document.createElement('span'); marca.className = 'obligatorio'; marca.textContent = 'obligatorio'; lbl.appendChild(marca); }
      if (!requerido && marca) marca.remove();
    }
  });
  // El grupo de acceso remoto entero cuenta como inactivo sin la casilla.
  const grp = $('grpRemoto');
  if (grp) { if ($('chkRemoto').checked) grp.removeAttribute('data-inactivo'); else grp.setAttribute('data-inactivo', '1'); }
}

// Lo que cada control dice de si mismo segun el resto del escenario.
function pintarControles(r) {
  const s = r.snapshot;
  // Unidades por sitio: DERIVADAS, nunca editables (F03).
  const nodos = s.disponibilidad.modo === 'standalone' ? 1 : 2;
  $('qty').value = String(nodos);
  $('qtyHint').innerHTML = nodos === 2
    ? `<b>2 nodos</b> por el clúster ${s.disponibilidad.modo === 'ha-aa' ? 'activo-activo' : 'activo-pasivo'}: la cantidad no se puede bajar, y cada nodo lleva su propia suscripción FortiGuard y su FortiCare.`
    : 'Se deriva de la alta disponibilidad: 1 nodo, o 2 en clúster. Varias sedes se cotizan con los perfiles multi-sede de la lista de materiales.';
  // FortiOS decide si SSL-VPN existe (T06): con 7.6.3+ la opcion se deshabilita y se dice.
  const opSsl = $('vpnTipo').querySelector('option[value=sslvpn]');
  const retirado = s.software.fortiOS === '7.6.3+';
  opSsl.disabled = retirado && $('vpnTipo').value !== 'sslvpn';
  opSsl.textContent = retirado ? 'SSL-VPN en modo túnel — retirado en FortiOS 7.6.3+' : 'SSL-VPN en modo túnel';
  $('fortiOSHint').innerHTML = retirado
    ? 'Decide qué funciones existen, no qué cifra aplica. En <b>7.6.3 o superior el modo túnel SSL-VPN ya no existe</b>: el acceso remoto se diseña con IPsec.'
    : `Con ${esc(s.software.fortiOS)} el modo túnel SSL-VPN existe salvo en los modelos que el Product Matrix excluye (serie 90G${s.software.fortiOS === '7.6.0-7.6.2' ? ', y los de 2 GB de RAM' : ''}).`;
  // Tipo de compra.
  const MOTIVO = {
    nueva: 'Compra nueva: equipo y primer bundle en el <b>SKU combinado</b> de la price list; los equipos fuera de venta no se ofrecen.',
    ampliacion: 'Ampliación: el equipo y sus servicios se cotizan por separado. Un modelo fuera de venta se admite solo con justificación escrita.',
    renovacion: 'Renovación: <b>solo servicios</b> del equipo instalado —no se cotiza la caja—. Hace falta su modelo y serie.',
    coterm: 'Co-term: <b>solo servicios</b>, alineados al vencimiento del contrato instalado. Hace falta su modelo y serie.',
  };
  $('motivoHint').innerHTML = MOTIVO[s.comercial.motivo] || '';
  // Bundles que no cubren lo pedido se ROTULAN (T08): elegirlos igual es posible, y la puerta
  // lo bloquea con su correccion, pero no se hace sin saberlo.
  const min = R.bundleMinimo(s.seguridad.funciones, FUNCIONES, BUNDLES);
  for (const op of $('licBundle').options) {
    const b = BUNDLES[op.value];
    if (!b) continue;
    const insuf = min.minimo && !min.validos.includes(op.value);
    const base = { utp: 'UTP — Unified Threat Protection', ent: 'Enterprise Protection', atp: 'ATP — Advanced Threat Protection' }[op.value] || b.n;
    op.textContent = insuf ? `${base} — no cubre lo pedido` : base;
  }
  // Selector de modelo: refleja la eleccion vigente.
  if (($('pickModel').value || null) !== seleccionManual) $('pickModel').value = seleccionManual || '';
  // Rol: rotulo del builder y ayuda.
  const hub = rolSdwan === 'hub';
  $('bwLbl').textContent = hub ? 'Enlaces WAN de UNA sede (underlay)' : 'Enlaces WAN del sitio (underlay)';
  $('rolHint').innerHTML = {
    none: 'Solo perímetro: el tráfico no viaja por túneles del overlay, así que el techo lo fija únicamente la capa de inspección.',
    spoke: 'Sucursal del fabric: el tráfico hacia el hub va cifrado, así que el <b>throughput IPsec del modelo también es un techo</b>, y cada hub es un túnel que se contrasta contra el máximo publicado.',
    hub: 'Concentrador: agrega el tráfico de los spokes y termina un túnel por cada uno. El caudal pasa a ser <b>agregado</b> —caudal de una sede × spokes × simultaneidad— y se evalúa la escala del plano de control.',
  }[rolSdwan];
  if (wanRolPintado !== rolSdwan) { wanRolPintado = rolSdwan; pintarWanFilas(leerWanLinks()); }
}

// Errores de entrada y obligatorios que faltan, junto a su campo (validacion inmediata).
function pintarErrores(r) {
  const porCampo = {};
  for (const e of r.errores) porCampo[e.campo] = e.mensaje;
  for (const f of r.faltan) if (!porCampo[f]) porCampo[f] = `Falta ${CAMPO_N[f] || f}.`;
  document.querySelectorAll('[data-error]').forEach((p) => { p.textContent = porCampo[p.dataset.error] || ''; });
  for (const [ruta, id] of Object.entries(CAMPO_ID)) {
    const n = $(id);
    if (!n || n.type === 'checkbox' || (n.classList && n.classList.contains('seg'))) continue;
    const mal = r.errores.some((e) => e.campo === ruta);
    if (mal) { n.setAttribute('aria-invalid', 'true'); n.title = porCampo[ruta]; }
    else if (n.getAttribute('aria-invalid') === 'true') { n.removeAttribute('aria-invalid'); n.removeAttribute('title'); }
  }
}

function pintarHints(r) {
  const s = r.snapshot;
  $('headVal').textContent = `${Math.round(s.politica.crecimientoPct)} %`;
  $('concVal').textContent = `${Math.round(s.topologia.simultaneidadPct)} %`;
  const d = r.detalle;
  const t = d && d.trafico;
  $('traficoHint').innerHTML = t && t.interVlan
    ? `Caminos declarados: WAN <b>${fmt(t.internet)}</b> + inter-VLAN <b>${fmt(t.interVlan)}</b>. Regla aplicada: <b>${esc(t.regla)}</b> = ${fmt(t.base)} de base, <b>${fmt(t.previsto)}</b> con el ${Math.round(s.politica.crecimientoPct)} % de crecimiento.`
    : 'Sin tráfico inter-VLAN declarado: el requerimiento sale solo de los enlaces WAN.';
  const req = (k) => r.requisitos.find((x) => x.eje === k);
  const sess = req('sess');
  const cps = req('cps');
  const remotos = s.remoto.activo ? s.remoto.usuarios : 0;
  $('sesCalc').innerHTML = !sess
    ? 'Sin restricción de sesiones: pon un valor por usuario o una medición.'
    : s.escala.sesionesMedidas
      ? `Medidas <b>${cifra(s.escala.sesionesMedidas)}</b> + ${Math.round(s.politica.crecimientoPct)} % de crecimiento = <b>${cifra(sess.requerido)}</b> sesiones concurrentes.`
      : `${cifra(s.escala.usuarios)} del sitio${remotos ? ` + ${cifra(remotos)} remotos` : ''} × ${s.escala.sesionesPorUsuario} sesiones + ${Math.round(s.politica.crecimientoPct)} % = <b>${cifra(sess.requerido)}</b> sesiones concurrentes.`;
  $('cpsCalc').innerHTML = !cps
    ? 'Sin sesiones declaradas no se puede derivar el caudal de sesiones nuevas por segundo.'
    : s.escala.cpsMedido
      ? `Medidas <b>${cifra(s.escala.cpsMedido)}</b> + crecimiento = <b>${cifra(cps.requerido)} cps</b>. Eje de CPU; la tabla de sesiones es el de memoria.`
      : `${cifra(sess ? sess.requerido : 0)} sesiones / ${s.escala.vidaSesionS} s de vida media = <b>${cifra(cps.requerido)} sesiones nuevas por segundo</b>.`;
  // El multiplicador conjunto de crecimiento y techo se DICE (§10.2): juntas no suman, multiplican.
  $('multHint').innerHTML = `Crecimiento y techo son dos políticas distintas y <b>se multiplican</b>: ${esc(r.multiplicador.texto)}. `
    + 'Ninguna cifra del datasheet se mide en producción: el techo dice hasta qué fracción se acepta diseñar en los ejes de rendimiento; a los topes de plataforma (túneles, VDOM, FortiAP…) no se les aplica.';
  // La capa que de verdad se usa, que no siempre es la que se pulso.
  if (d && d.capa) {
    const c = d.capa;
    $('profileHint').innerHTML = c.elevada
      ? `<b class="warn">Capa elevada a ${esc(TIER_BY_K[c.k].n)}</b> por ${c.elevan.map((f) => esc(f.n)).join(', ')}. ${esc(TIER_BY_K[c.k].d)}`
      : esc(TIER_BY_K[c.k].d);
  } else {
    $('profileHint').textContent = TIER_BY_K[profile].d;
  }
}

/* ── CABECERA DEL PANEL: siempre visible ─────────────────────────────────────────────── */
function pintarCabecera(r) {
  const caja = $('stickyReco');
  const sel = r.seleccion;
  const g = GATE[r.quoteGate];
  if (!caja.hasAttribute('tabindex')) caja.setAttribute('tabindex', '-1');
  if (!sel) {
    const motivo = r.bloqueos[0] ? r.bloqueos[0].mensaje : 'Declara el caudal de al menos un enlace WAN.';
    caja.innerHTML = '<span class="sr-modelo">Sin modelo validado</span>'
      + `<span class="qg qg-${r.quoteGate}">${esc(g.n)}</span>`
      + `<span class="sr-cuello">${esc(motivo)}</span>`;
    caja.hidden = false;
  } else {
    const ev = sel.eval;
    const conDato = ev.ejes.filter((e) => e.u != null);
    const cumplen = conDato.filter((e) => e.estado === 'ok').length;
    const cuello = ev.manda
      ? `Manda <b>${esc(ev.manda.n)}</b> · ${R.pct(ev.manda.u)} de ${valEje(ev.manda, ev.manda.cap)}`
      : 'Sin ejes evaluables';
    const manual = r.override && r.override.elegible;
    const alts = r.alternativas.filter((a) => a.id !== sel.id);
    const recAlt = manual && r.recomendacion ? [{ id: r.recomendacion.id, rec: true }] : [];
    caja.innerHTML = `<span class="sr-modelo">${esc(sel.id)}</span>`
      + `<span class="qg qg-${r.quoteGate}" title="Confianza ${esc(r.confianza)}">${esc(g.n)}</span>`
      + `<span class="sr-cuello">Cumple ${cumplen}/${conDato.length} ejes · ${cuello}${manual ? ' · <b>elegido a mano</b>' : ''} · confianza ${esc(r.confianza)}</span>`
      + ((alts.length || recAlt.length) ? '<span class="sr-alts"><span>Alternativas</span>'
        + recAlt.map((a) => `<button type="button" class="sr-alt" data-alt="${esc(a.id)}" title="Volver al recomendado">${esc(a.id.replace('FortiGate ', ''))} · recomendado</button>`).join('')
        + alts.map((a) => `<button type="button" class="sr-alt" data-alt="${esc(a.id)}" title="${esc(a.porQue || '')}">${esc(a.id.replace('FortiGate ', ''))}</button>`).join('')
        + '</span>' : '');
    caja.hidden = false;
  }
  // OVERRIDE QUE NO CUMPLE (F01, T02): se conserva la recomendacion, se muestra el deficit y
  // la salida comercial queda bloqueada mientras la eleccion siga en pie.
  const ov = r.override;
  const cajaOv = $('overrideAviso');
  if (ov && !ov.elegible) {
    const filas = ov.deficit.map((d) => `<tr><td>${esc(d.n)}</td><td class="n">${d.requerido == null ? '—' : valEje(d, d.requerido)}</td>`
      + `<td class="n">${d.disponible == null ? 'sin dato' : valEje(d, d.disponible)}</td>`
      + `<td class="n">${d.estado === 'sinDato' ? 'no comprobable' : `${R.pct(d.utilizacion)}${d.deficitPct != null ? ` (+${d.deficitPct} %)` : ''}`}</td></tr>`).join('');
    const otros = (ov.bloqueos || []).map((b) => `<li>${esc(b.mensaje)}</li>`).join('');
    cajaOv.innerHTML = `<b>Elegiste el ${esc(ov.modelo)} y no cumple este escenario.</b> La lista de materiales sigue con el `
      + `<b>${esc(r.seleccion ? r.seleccion.id : 'modelo validado')}</b> y la cotización queda <b>bloqueada</b> mientras mantengas esa elección.`
      + (filas ? `<table><thead><tr><th>Eje</th><th>Requerido</th><th>Disponible</th><th>Utilización</th></tr></thead><tbody>${filas}</tbody></table>` : '')
      + (otros ? `<ul style="margin:6px 0 0;padding-left:18px">${otros}</ul>` : '')
      + `<p style="margin:8px 0 0"><button type="button" class="btn btn-corr" data-corregir='${esc(JSON.stringify({ accion: 'volver-recomendado' }))}'>Volver al recomendado</button></p>`;
    cajaOv.hidden = false;
  } else {
    cajaOv.hidden = true;
    cajaOv.innerHTML = '';
  }
  // BLOQUEOS Y ADVERTENCIAS, con su correccion cuando existe. El override ya tiene su caja.
  const lista = r.bloqueos.filter((b) => b.codigo !== 'override-no-elegible')
    .concat(r.avisos.filter((a) => a.nivel === 'borrador' || a.nivel === 'warning'))
    .slice(0, 6);
  const ul = $('resBloqueos');
  ul.innerHTML = lista.map((b) => {
    const cls = b.nivel === 'bloqueo' ? '' : b.nivel;
    let accion = '';
    const c = b.correccion;
    if (c && c.accion === 'cambiar') {
      const txt = c.campo === 'comercial.bundle' ? `Cambiar a ${BUNDLES[c.valor] ? BUNDLES[c.valor].n : c.valor}`
        : c.campo === 'remoto.metodo' ? 'Cambiar a IPsec' : 'Corregir';
      accion = `<button type="button" class="btn ghost btn-corr" data-corregir='${esc(JSON.stringify(c))}'>${esc(txt)}</button>`;
    } else if (b.campo && (b.codigo === 'dato-requerido' || b.codigo === 'entrada-invalida')) {
      accion = `<button type="button" class="btn ghost btn-corr" data-corregir='${esc(JSON.stringify({ accion: 'ir', campo: b.campo }))}'>Ir al campo</button>`;
    }
    return `<li class="${cls}">${esc(b.mensaje)}${accion}</li>`;
  }).join('');
  ul.hidden = !lista.length;
}

/* ── UTILIZACION POR EJE: la decision explicable ─────────────────────────────────────── */
function resumenDescartes(r) {
  const sinDato = new Map();
  const porCapacidad = new Map();
  const porRestriccion = new Map();
  for (const c of r.descartados) {
    const ev = c.eval;
    if (ev.estado === 'apartado' && ev.apartadoPor) {
      if (!sinDato.has(ev.apartadoPor)) sinDato.set(ev.apartadoPor, { n: ev.apartadoPorN, modelos: [] });
      sinDato.get(ev.apartadoPor).modelos.push(c.id);
    } else if (ev.estado === 'excede' && ev.manda) {
      const k = ev.manda.k;
      if (!porCapacidad.has(k)) porCapacidad.set(k, { n: ev.manda.n, modelos: [] });
      porCapacidad.get(k).modelos.push(c.id);
    } else if (c.bloqueos.length) {
      for (const b of c.bloqueos) {
        if (!porRestriccion.has(b.codigo)) porRestriccion.set(b.codigo, { n: b.codigo, ejemplo: b.mensaje, modelos: [] });
        porRestriccion.get(b.codigo).modelos.push(c.id);
      }
    }
  }
  return { sinDato, porCapacidad, porRestriccion };
}
const RESTRICCION_N = {
  CICLO_VIDA: 'fuera de venta en compra nueva', FORTIOS_INCOMPATIBLE: 'FortiOS no admite la función pedida',
  PROXY_LIMITADO: 'soporte proxy limitado', PUERTOS_INSUFICIENTES: 'puertos insuficientes',
  ALMACENAMIENTO_SIN_DATO: 'disco sin dato', ALMACENAMIENTO_INSUFICIENTE: 'disco insuficiente',
  POE_SIN_DATO: 'PoE sin dato', POE_NO_DISPONIBLE: 'sin PoE en el SKU base',
  PSU_SIN_DATO: 'fuente sin dato', PSU_SIN_REDUNDANCIA: 'sin fuente redundante',
};
function pintarEjes(r) {
  const caja = $('ejesPanel');
  const sel = r.seleccion;
  if (!sel) { caja.innerHTML = ''; return; }
  const ev = sel.eval;
  const conConfig = ev.ejes;
  const filas = conConfig.map((e) => {
    const manda = ev.manda && e.k === ev.manda.k;
    const cls = e.estado === 'sinDato' ? 'sindato' : manda ? 'manda' : (e.u > 0.8 ? 'alto' : '');
    const ancho = e.u == null ? 0 : Math.min(100, e.u * 100);
    const req = r.requisitos.find((x) => x.eje === e.k);
    const gob = req && req.escenario && req.escenario !== 'normal' ? ` · gobierna «${req.escenarioN}»` : '';
    const val = e.estado === 'sinDato' ? 'sin dato'
      : `${R.pct(e.u)} <span style="color:var(--steel)">de ${valEje(e, e.cap)}</span>`;
    return `<div class="eje ${cls}" title="${esc(e.metodo)}${esc(gob)}">`
      + `<span class="en">${esc(e.n)}${e.configuracion ? ' <span class="pillc">tope</span>' : ''}</span>`
      + `<span class="eb" role="img" aria-label="${esc(e.n)}: ${e.u == null ? 'sin dato' : R.pct(e.u)}"><i style="width:${ancho}%"></i></span>`
      + `<span class="ev">${val}</span></div>`;
  }).join('');
  const { sinDato } = resumenDescartes(r);
  const nSinDato = [...sinDato.values()].reduce((a, g) => a + g.modelos.length, 0);
  const techo = r.snapshot.politica.techoPct;
  const pie = (ev.manda
    ? `Cuello de botella: <b>${esc(ev.manda.n)}</b> al ${R.pct(ev.manda.u)}${techo < 100 ? ` · techo declarado ${techo} %` : ''}. Cada eje se compara contra su propia cifra oficial; ninguno se deriva de otro.`
    : 'Sin ejes evaluables con los datos declarados.')
    + (nSinDato ? ` <b class="warn">${nSinDato} modelo(s) apartados</b> porque el catálogo no trae su cifra de `
      + `${[...sinDato.values()].map((g) => esc(g.n)).join(', ')} — es una tarea de datos, no una falta de capacidad: no se sustituye por la de otro eje.` : '');
  caja.innerHTML = `<div class="ejes"><h3>Utilización por eje — ${esc(sel.id)}</h3>${filas}<p class="eje-pie">${pie}</p></div>`;
}

/* ── FICHA DEL EQUIPO VALIDADO (ficha.js) ─────────────────────────────────────────────── */
function pintarFicha(r) {
  if (!r.seleccion) {
    const why = porQueSinCandidato(r);
    FICHA.render({ vendor: VENDOR, contenedor: 'verdict', candidatos: [], recomendado: null,
      vacioTitulo: r.faltan.length || r.errores.length ? 'Faltan datos para recomendar un equipo' : 'Ningún modelo vigente cumple todas las restricciones',
      vacioDetalle: `<ul style="margin:0;padding-left:18px;font-size:13.5px">${why}</ul>` });
    $('verdict').style.borderLeftColor = r.faltan.length || r.errores.length ? 'var(--steel)' : 'var(--amber)';
    return;
  }
  $('verdict').style.borderLeftColor = 'var(--red)';
  // `seleccionado` SIEMPRE es el modelo validado por el motor: ficha.js presenta, no decide.
  const porId = Object.fromEntries(r.candidatos.map((c) => [c.id, c]));
  FICHA.render({
    vendor: VENDOR,
    contenedor: 'verdict',
    candidatos: r.elegibles.map((c) => c.modelo),
    recomendado: r.recomendacion ? r.recomendacion.id : r.seleccion.id,
    seleccionado: r.seleccion.id,
    vistas: VISTAS,
    refsEn: 'fortiRefs',
    refsTitulo: null,
    etiqueta: (m) => `${m.id} — ${m.seg} · soporta ${fmt(porId[m.id] ? porId[m.id].soporta : null)}`,
    titulo: (m) => m.id,
    subtitulo: (m) => `${m.seg} · FortiOS Security Fabric`,
    medidores: null,
    porQue: (m) => porQueDe(r, porId[m.id]),
    secciones: (m) => seccionesDe(r, m),
    alCambiar: (id, origen) => fijarSeleccion(origen === 'volver' ? null : id),
  });
}

function porQueSinCandidato(r) {
  const s = r.snapshot;
  const d = r.detalle;
  const why = [];
  if (r.errores.length || r.faltan.length) {
    for (const e of r.errores) why.push(`<li><b>${esc(CAMPO_N[e.campo] || e.campo)}</b>: ${esc(e.mensaje)}.</li>`);
    for (const f of r.faltan) {
      why.push(f === 'topologia.enlaces'
        ? '<li>Declara el <b>caudal</b> de al menos un enlace activo del sitio en el paso 3 (y si aplica, usuarios y sesiones) para que el dimensionador proponga los modelos que cumplen.</li>'
        : `<li>Falta <b>${esc(CAMPO_N[f] || f)}</b>, que el escenario hace obligatorio.</li>`);
    }
    return why.join('');
  }
  if (d) {
    why.push(`<li>Requerimiento de <b>${fmt(d.effectiveNeed)}</b> en la capa <b>${esc(TIER_BY_K[d.capa.k].n)}</b>`
      + `${s.seguridad.funciones.includes('chkSsl') ? ' con inspección SSL profunda' : ''}`
      + `${d.escenario !== 'normal' ? `, en el escenario «${esc((r.escenarios.find((x) => x.id === d.escenario) || {}).n || d.escenario)}»` : ''}.</li>`);
    if (d.capa.elevada) why.push(`<li>La capa se elevó de <b>${esc(TIER_BY_K[s.seguridad.capa].n)}</b> a <b>${esc(TIER_BY_K[d.capa.k].n)}</b> por ${d.capa.elevan.map((f) => esc(f.n)).join(', ')}.</li>`);
  }
  const { sinDato, porCapacidad, porRestriccion } = resumenDescartes(r);
  for (const [, g] of porCapacidad) why.push(`<li><b>${g.modelos.length}</b> modelo(s) no llegan por <b>${esc(g.n)}</b>.</li>`);
  for (const [k, g] of sinDato) {
    const con = MODELS.filter((m) => m[R.EJE_POR_K[k].campo] != null).length;
    why.push(`<li><b class="warn">${g.modelos.length} modelo(s) apartados porque el catálogo no trae su cifra de ${esc(g.n)}</b> — no por capacidad. `
      + `Los ${con} que sí la traen son los que compiten. Es una <b>tarea de datos, no una falta de capacidad</b>: la pantalla no sustituye esa cifra por la de otro eje; para comprometer uno de esos modelos hace falta una <b>PoC</b>.</li>`);
  }
  for (const [k, g] of porRestriccion) {
    why.push(`<li><b>${g.modelos.length}</b> modelo(s) descartados por <b>${esc(RESTRICCION_N[k] || k)}</b> (p. ej. ${esc(g.ejemplo)})</li>`);
  }
  if (s.politica.techoPct < 100) why.push(`<li>Se aplica un <b>techo de utilización del ${s.politica.techoPct} %</b>: subirlo ensancha la lista a costa de diseñar más cerca del máximo de laboratorio.</li>`);
  if ((d && d.capa.k === 'tp') || s.seguridad.funciones.includes('chkSsl')) why.push('<li>Estás dimensionando contra la capa más exigente: segmentar por política qué tráfico se inspecciona a fondo es la palanca que más capacidad libera en FortiGate.</li>');
  why.push('<li>Por encima del catálogo: chasis FortiGate 7000F con diseño especializado, o repartir la carga en varias unidades.</li>');
  return why.join('');
}

function porQueDe(r, c) {
  if (!c) return '';
  const s = r.snapshot;
  const m = c.modelo;
  const ev = c.eval;
  const d = r.detalle;
  const eje = (k) => ev.ejes.find((e) => e.k === k);
  const flags = [];
  const contraste = (e, que) => (e
    ? (e.estado === 'sinDato'
      ? `<b class="warn">El catálogo no trae ${que} del ${esc(m.id)}</b>, así que ese tope no se comprobó.`
      : `Entra en <b>${cifra(e.cap)}</b> ${esc(e.unidad)} publicados — <b${e.estado === 'excede' ? ' class="warn"' : ''}>${R.pct(e.u)}</b> del tope de plataforma.`)
    : '');
  if (s.seguridad.funciones.includes('chkSsl')) {
    const ssl = eje('ssl');
    flags.push(ssl && ssl.cap != null
      ? `<b>Inspección SSL profunda:</b> se dimensiona contra los <b>${fmt(ssl.cap)}</b> de <b>SSL Inspection Throughput</b> del ${esc(m.id)}, una medición propia y no una fracción de sus ${fmt(m.tp)} de Threat Protection (aquí el cociente es ${(m.ssl / m.tp).toFixed(2)}). Carga: tráfico × ${s.seguridad.tlsCifradoPct} % cifrado × ${100 - s.seguridad.tlsExentoPct} % no exento. Queda al ${R.pct(ssl.u)}.`
      : `<b class="warn">Inspección SSL sin cifra oficial para el ${esc(m.id)}:</b> no debería recomendarse contra ese eje sin PoC.`);
    if (s.seguridad.tlsExentoPct > 0) flags.push(`<b>Excepciones TLS:</b> se descuenta el <b>${s.seguridad.tlsExentoPct} %</b> del eje de inspección SSL. <b class="warn">Es un supuesto declarado en el paso 2, no una cifra de Fortinet</b>: si la política de exclusión cambia, este eje sube.`);
  }
  if (s.seguridad.funciones.includes('chkAv')) flags.push('El antivirus en línea fija el piso en Threat Protection: esa cifra ya lo incluye, junto con el logging.');
  if (s.seguridad.funciones.includes('chkSandbox')) flags.push(`FortiSandbox analiza <b>fuera de banda</b>: no consume throughput del FortiGate. Cobertura elegida: <b>${esc({ incluido: 'incluida en el bundle', ai: 'servicio de sandbox del FortiGate', dedicado: 'FortiSandbox dedicado' }[s.comercial.sandbox] || s.comercial.sandbox)}</b>.`);
  if (s.seguridad.funciones.includes('chkIotDlp')) flags.push('IoT Security y DLP <b>fijan el bundle mínimo en Enterprise Protection</b> y elevan el piso a Threat Protection.');
  if (s.disponibilidad.modo !== 'standalone') flags.push(`<b>HA ${s.disponibilidad.modo === 'ha-aa' ? 'activo-activo' : 'activo-pasivo'}:</b> se cotizan 2 nodos y cada uno lleva su propia suscripción. El clúster <b>no suma capacidad</b>: en el failover un nodo carga con todo, y ese es el escenario contra el que se dimensiona.`);
  if (rolSdwan !== 'none' && d) {
    const ipsec = eje('vpn');
    const insp = eje(d.capa.k);
    if (ipsec && insp) {
      flags.push(ev.manda && ev.manda.k === 'vpn'
        ? `<b class="warn">Manda el overlay:</b> con ${Math.round(d.frac * 100)} % del tráfico cifrado, el motor IPsec (${fmt(ipsec.cap)}) va al ${R.pct(ipsec.u)} mientras la capa de inspección va al ${R.pct(insp.u)}.`
        : `El eje que aprieta es la capa de inspección (${R.pct(insp.u)}); el motor IPsec queda al ${R.pct(ipsec.u)} para el ${Math.round(d.frac * 100)} % que va cifrado.`);
    }
    flags.push(`Se suma un ${Math.round(M.OVERHEAD_ESP * 100)} % de encapsulación ESP sobre la fracción del overlay — supuesto de esta herramienta, no una cifra de Fortinet.`);
    flags.push('<b>SD-WAN sin costo de licencia:</b> el balanceo por SLA y ADVPN vienen en FortiOS; se licencian aparte solo los servicios avanzados, y solo si el diseño los usa.');
  }
  const tun = eje('tunGw');
  if (tun) flags.push(`<b>Escala del overlay:</b> ${cifra(tun.req)} túnel(es) IPsec sitio a sitio — ${rolSdwan === 'hub' ? 'uno por cada spoke que concentra' : 'uno por cada hub al que cifra'}. ${contraste(tun, 'el máximo de túneles sitio a sitio')}${rolSdwan === 'hub' ? ' Con <b>ADVPN</b> los atajos spoke-a-spoke no cuentan contra el hub.' : ''}`);
  if (s.remoto.activo && s.remoto.usuarios > 0) {
    const sslMode = s.remoto.metodo === 'sslvpn';
    flags.push(`<b>Acceso remoto por ${sslMode ? 'SSL-VPN' : 'IPsec dial-up'}:</b> ${cifra(s.remoto.usuarios)} usuario(s) concurrente(s). `
      + contraste(eje(sslMode ? 'sslVpnUsers' : 'tunCli'), sslMode ? 'el máximo de usuarios SSL-VPN concurrentes' : 'el máximo de túneles de cliente')
      + (sslMode ? ` Su caudal <b>no carga el eje IPsec</b>: compite contra el <i>SSL VPN Throughput</i> del modelo.${eje('sslVpn') ? ` ${contraste(eje('sslVpn'), 'el caudal SSL-VPN')}` : ''}`
        : ' Su caudal entra en el eje IPsec junto al overlay, y sus sesiones en la tabla de sesiones.')
      + (s.remoto.mfa ? ` Doble factor: ${contraste(eje('tokens'), 'el máximo de FortiToken')}` : ''));
  }
  const vd = eje('vdom');
  if (vd) flags.push(`<b>Segmentación:</b> ${cifra(vd.req)} VDOM declarados. ${contraste(vd, 'el máximo de dominios virtuales')} Es un tope de plataforma: el techo de utilización no se le aplica.${m.vdomDef != null && vd.req > m.vdomDef ? ` El modelo incluye ${m.vdomDef}: los ${vd.req - m.vdomDef} de más se cotizan como licencia de VDOM adicionales.` : ''}`);
  for (const k of ['aps', 'switches']) { const e = eje(k); if (e) flags.push(`<b>${esc(e.n)}:</b> ${cifra(e.req)} declarados. ${contraste(e, `el máximo de ${e.unidad}`)}`); }
  // Restricciones fisicas: el modelo es elegible, asi que las cumple; se dice contra que dato.
  if (M.TIPOS_PUERTO.some((t) => s.fisico.puertos[t.k] > 0)) {
    flags.push(m.puertos
      ? `<b>Puertos:</b> cubre lo pedido por cantidad, velocidad y medio (${esc(m.puertosFuente || 'catálogo')}).`
      : `<b class="warn">Puertos sin estructurar:</b> el catálogo solo trae «${esc(m.ifaces)}», así que el requerimiento de puertos no se comprobó.`);
  }
  if (s.fisico.registro === 'local') {
    const reqGb = r.requisitos.find((x) => x.eje === 'almacenamiento');
    flags.push(`<b>Registro local:</b> la retención pide ${reqGb ? cifra(Math.ceil(reqGb.requerido)) : '—'} GB y el ${esc(m.id)} publica ${cifra(m.almacenamientoGB)} GB brutos.`);
  }
  if (s.fisico.poeW > 0) flags.push(`<b>PoE:</b> ${cifra(s.fisico.poeW)} W pedidos.`);
  if (s.fisico.psuRedundante) flags.push(`<b>Fuente redundante:</b> ${m.redund === 'opcional' ? 'el equipo admite la segunda fuente como opción, y la línea entra en la cotización.' : 'el equipo trae fuente doble.'}`);
  for (const a of c.avisos) flags.push(`<b class="warn">${esc(a.mensaje)}</b>`);
  // QUE EJE MANDA Y A QUE DISTANCIA QUEDA EL SIGUIENTE.
  const conDato = ev.ejes.filter((e) => e.u != null && !e.configuracion);
  if (ev.manda && conDato.length > 1) {
    const otros = conDato.filter((e) => e.k !== ev.manda.k);
    flags.push(`<b>Manda ${esc(ev.manda.frase)}</b>: ${R.pct(ev.manda.u)} de lo que da el modelo. Los demás ejes de rendimiento van en ${otros.map((e) => `${esc(e.frase)} ${R.pct(e.u)}`).join(', ')}. Subir de gama por un eje que no es el que limita no compra nada.`);
  }
  for (const nombre of ev.sinComprobar) flags.push(`<b class="warn">${esc(nombre)} sin dato:</b> el catálogo no trae esa cifra del ${esc(m.id)}, así que ese eje <b>no se comprobó</b>.`);
  if (s.software.inspeccion === 'proxy') flags.push('<b class="warn">Modo proxy:</b> las cifras publicadas son de flow y Fortinet no publica cuánto caen; validar con PoC.');
  if (s.politica.techoPct < 100) flags.push(`Los ejes de rendimiento se comparan contra un <b>techo del ${s.politica.techoPct} %</b> de la cifra publicada: una política, no una cifra de Fortinet.`);
  const headroom = d && c.soporta ? Math.round((1 - d.effectiveNeed / c.soporta) * 100) : null;
  return `<ul style="margin:8px 0 0;padding-left:18px;font-size:13.5px">`
    + (d ? `<li>Requerimiento <b>${fmt(d.effectiveNeed)}</b> en capa <b>${esc(TIER_BY_K[d.capa.k].n)}</b>${d.escenario !== 'normal' ? ` (escenario «${esc((r.escenarios.find((x) => x.id === d.escenario) || {}).n || d.escenario)}»)` : ''}; este modelo soporta hasta <b>${fmt(c.soporta)}</b> en este escenario${headroom != null ? ` — holgura ${headroom} %` : ''}.</li>` : '')
    + (d && d.capa.elevada ? `<li><b class="warn">Capa elevada:</b> elegiste <b>${esc(TIER_BY_K[s.seguridad.capa].n)}</b>, pero ${d.capa.elevan.map((f) => esc(f.n)).join(' y ')} obliga${d.capa.elevan.length > 1 ? 'n' : ''} a dimensionar contra <b>${esc(TIER_BY_K[d.capa.k].n)}</b>.</li>` : '')
    + `<li>Sesiones concurrentes: <b>${nMil(m.sess)}</b> | Sesiones nuevas/s: <b>${m.cps != null ? cifra(m.cps) : '<span class="warn">sin dato</span>'}</b> | Inspección SSL: <b>${m.ssl != null ? fmt(m.ssl) : '<span class="warn">sin dato</span>'}</b> | Interfaces: ${esc(m.ifaces)}</li>`
    + flags.map((f) => `<li>${f}</li>`).join('')
    + '</ul>';
}

function seccionesDe(r, m) {
  const s = r.snapshot;
  const bundle = s.comercial.bundle;
  const care = s.comercial.soporte;
  const anios = s.comercial.anios;
  const lt = m.lic ? m.lic[bundle] : null;
  const ct = m.lic && m.lic.care ? m.lic.care[CARE_LIC_KEY[care]] : null;
  const tecnica = FUENTES && FUENTES.fuentes ? FUENTES.fuentes.find((f) => f.dominio !== 'precio') : null;
  const precios = FUENTES && FUENTES.fuentes ? FUENTES.fuentes.find((f) => f.dominio === 'precio') : null;
  const sinDato = '<span class="warn">sin dato en el catálogo</span>';
  const v = VISTAS && VISTAS[m.id];
  return [
    { titulo: 'Características del equipo', filas: [
      ['Segmento', esc(m.seg)],
      ['Firewall (1518 B, offload ASIC)', fmt(m.fw)],
      ['IPsec VPN (512 B, offload ASIC)', fmt(m.vpn)],
      ['IPS (Enterprise Mix)', fmt(m.ips)],
      ['NGFW (IPS + App Control)', fmt(m.ngfw)],
      ['Threat Protection', m.tp ? `<b>${fmt(m.tp)}</b>` : 'Consultar datasheet'],
      ['Inspección SSL', m.ssl != null ? `<b>${fmt(m.ssl)}</b>` : `${sinDato} — ver Product Matrix`],
      ['Sesiones concurrentes', cifra(m.sess)],
      ['Sesiones nuevas / s (TCP, flow)', m.cps != null ? cifra(m.cps) : sinDato],
      ['Túneles IPsec sitio a sitio / cliente', `${m.tunGw != null ? cifra(m.tunGw) : '—'} / ${m.tunCli != null ? cifra(m.tunCli) : '—'}`],
      ['SSL-VPN: usuarios / caudal', `${m.sslVpnUsers != null ? cifra(m.sslVpnUsers) : '—'} / ${m.sslVpn != null ? fmt(m.sslVpn) : '—'}`],
      ['Procesadores de seguridad', m.asic ? esc(m.asic) : '<span class="warn">sin dato publicado</span>'],
      ['Interfaces', esc(m.ifaces), true],
      ['SKU de hardware', m.hwSku ? `<code>${esc(m.hwSku)}</code>` : '<span class="warn">Descontinuado — sin SKU nuevo</span>'],
      ['Precio de lista ref.', m.elp ? esc(m.elp) : 'Consultar distribuidor'],
    ] },
    { titulo: 'Plataforma', filas: [
      ['VDOM incluidos / máximo', `${m.vdomDef != null ? m.vdomDef : '—'} / ${m.vdomMax != null ? m.vdomMax : '—'}`],
      ['Disco local', m.almacenamientoGB == null ? sinDato : m.almacenamientoGB ? `${cifra(m.almacenamientoGB)} GB` : 'sin disco (la variante terminada en 1 lo trae)'],
      ['PoE', m.poe == null ? sinDato : m.poe ? 'sí' : (m.poeVariante ? 'no en el SKU base (existe variante -POE)' : 'no')],
      ['FortiAP gestionados (túnel)', m.aps != null ? `${cifra(m.aps)}${m.apsTun != null ? ` (${cifra(m.apsTun)})` : ''}` : sinDato],
      ['FortiSwitch / FortiToken', `${m.switches != null ? cifra(m.switches) : '—'} / ${m.tokens != null ? cifra(m.tokens) : '—'}`],
      ['Formato', m.formato ? esc(m.formato) : '—'],
    ] },
    FICHA.seccionPuertos(m),
    FICHA.seccionAlimentacion(m),
    { titulo: 'Licenciamiento propuesto', filas: [
      ['Tipo de compra', esc({ nueva: 'Compra nueva', ampliacion: 'Ampliación', renovacion: 'Renovación', coterm: 'Co-term' }[s.comercial.motivo])],
      ['Bundle FortiGuard', BUNDLES[bundle] ? esc(BUNDLES[bundle].n) : '<span class="warn">Excluido de la cotización</span>'],
      ['Servicios incluidos', BUNDLES[bundle] ? esc(BUNDLES[bundle].svcs) : 'Ninguno', true],
      ['SKU del bundle', !BUNDLES[bundle] ? '—' : lt && lt.sku ? `<code>${esc(lt.sku)}</code>` : '<span class="warn">Sin SKU vigente para este modelo</span>'],
      ['Término', `${anios} año${anios > 1 ? 's' : ''}`],
      ['Nodos a licenciar', s.disponibilidad.modo === 'standalone' ? '1' : '2 — la licencia no se comparte en HA'],
    ], nota: 'En FortiGate el SKU lleva el código del modelo: la licencia va atada al equipo, no al ancho de banda.' },
    { titulo: 'Software del portafolio', filas: SOFTWARE.map((sw) => [esc(sw.n), esc(sw.d), true]) },
    { titulo: 'Soporte', filas: [
      [CARE[care] ? esc(CARE[care].n) : 'Sin contrato FortiCare', CARE[care] ? esc(CARE[care].sla) : '<span class="warn">Excluido de la cotización</span>'],
      ['SKU', !CARE[care] ? '—' : ct && ct.sku ? `<code>${esc(ct.sku)}</code>` : '<span class="warn">No disponible para este modelo</span>'],
    ] },
    // PROCEDENCIA POR DATO (P2): de que documento sale cada grupo de cifras de ESTE equipo.
    { titulo: 'Procedencia de las cifras de este equipo', filas: [
      ['Rendimiento, sesiones y CPS', tecnica ? `${esc(tecnica.documento)}${tecnica.fecha ? ` (${esc(tecnica.fecha)})` : ''}` : 'Product Matrix'],
      ['Límites de plataforma', m.limitesDe ? esc(m.limitesDe.fuente) : sinDato, true],
      ['Disco, VDOM, PoE y Fabric', m.plataformaFuente ? esc(m.plataformaFuente) : sinDato, true],
      ['Puertos', m.puertosFuente ? esc(m.puertosFuente) : 'texto libre del catálogo (sin estructurar)', true],
      ['Precios y SKU', precios ? `${esc(precios.documento)}${precios.fecha ? ` (${esc(precios.fecha)})` : ''}` : sinDato, true],
      ['Figura del equipo', v && v.fuente ? esc(v.fuente) : 'sin figura oficial declarada', true],
    ] },
  ].filter(Boolean);
}

/* ── COMPARACION: SHORTLIST DE TRES (F16) ────────────────────────────────────────────── */
function pintarShortlist(r) {
  const caja = $('shortlist');
  if (!r.recomendacion) {
    caja.innerHTML = '<p class="hint">Sin modelo recomendado no hay nada que comparar: revisa los bloqueos de arriba.</p>';
    return;
  }
  const filas = [r.recomendacion].concat(r.alternativas);
  if (r.seleccion && !filas.some((c) => c.id === r.seleccion.id)) filas.push(r.seleccion);
  const precio = (c) => (c.modelo.elpN ? money(c.modelo.elpN) : '—');
  caja.innerHTML = '<p class="hint" style="margin:0 0 10px">El recomendado y las dos opciones siguientes con más holgura, primero del mismo segmento. '
    + `Los <b>${r.elegibles.length}</b> que cumplen están en el desplegable de la ficha; el catálogo entero, en su pestaña.</p>`
    + '<div class="scroll"><table class="tabla-comp"><thead><tr><th>Modelo</th><th>Cuello</th><th>Soporta</th><th>Disco</th><th>Precio equipo</th><th>Por qué</th><th></th></tr></thead><tbody>'
    + filas.map((c) => {
      const esRec = c.id === r.recomendacion.id;
      const esSel = r.seleccion && c.id === r.seleccion.id;
      const ev = c.eval;
      return `<tr class="${esRec ? 'rec' : ''}${esSel ? ' sel' : ''}"><td><b>${esc(c.id)}</b><span class="sku">${esc(c.modelo.seg)}${esRec ? ' · recomendado' : ''}</span></td>`
        + `<td>${ev.manda ? `${esc(ev.manda.n)} ${R.pct(ev.manda.u)}` : '—'}</td>`
        + `<td class="n">${fmt(c.soporta)}</td>`
        + `<td class="n">${c.modelo.almacenamientoGB ? `${cifra(c.modelo.almacenamientoGB)} GB` : '—'}</td>`
        + `<td class="n">${precio(c)}</td>`
        + `<td>${esRec ? 'el más pequeño que cumple todo' : esc(c.porQue || (esSel ? 'elegido a mano' : ''))}</td>`
        + `<td>${esSel ? '<span class="pillc">validado</span>' : `<button type="button" class="btn ghost btn-corr" data-alt="${esc(c.id)}">Elegir</button>`}</td></tr>`;
    }).join('')
    + '</tbody></table></div>';
}

/* ── REQUISITOS: que se pide, por que escenario y con que supuestos ───────────────────── */
function pintarRequisitos(r) {
  const caja = $('requisitos');
  const sel = r.seleccion;
  const capDe = (k) => { const e = sel && sel.eval.ejes.find((x) => x.k === k); return e || null; };
  const reqs = r.requisitos.map((q) => {
    const e = capDe(q.eje);
    const cap = q.eje === 'almacenamiento' ? (sel ? sel.modelo.almacenamientoGB : null) : (e ? e.cap : null);
    const u = e ? e.u : (cap ? q.requerido / cap : null);
    return `<tr><td>${esc(q.n)}</td><td class="n">${q.unidad === 'Mbps' ? fmt(q.requerido) : `${cifra(q.unidad === 'GB' ? Math.ceil(q.requerido) : q.requerido)} ${esc(q.unidad)}`}</td>`
      + `<td>${esc(q.escenarioN)}</td><td class="n">${cap == null ? '—' : q.unidad === 'Mbps' ? fmt(cap) : `${cifra(cap)} ${esc(q.unidad)}`}</td>`
      + `<td class="n">${u == null ? '—' : R.pct(u)}</td></tr>`;
  }).join('');
  const escs = r.escenarios.map((e) => `<tr><td>${esc(e.n)}${e.igualANormal ? ' <span class="sku">coincide con la operación normal: el clúster no suma capacidad</span>' : ''}</td>`
    + `<td class="n">${fmt(e.caudal)}</td><td class="n">${rolSdwan === 'none' ? '—' : fmt(e.overlay)}</td>`
    + `<td class="n">${e.perdida ? `<span class="warn">${fmt(e.perdida)} sin camino</span>` : '—'}</td></tr>`).join('');
  const inact = r.inactivos.length
    ? `<p class="hint" style="margin-top:10px"><b>Conservados pero fuera del cálculo</b> (no aplican a este escenario y no viajan en el enlace): ${r.inactivos.map((c) => esc(CAMPO_N[c] || c)).join(', ')}.</p>` : '';
  caja.innerHTML = (reqs
    ? '<h3 class="ficha-det-tit">Requisitos por eje</h3><div class="scroll"><table class="req-tabla"><thead><tr><th>Eje</th><th>Requerido</th><th>Lo gobierna</th>'
      + `<th>${sel ? esc(sel.id) : 'Disponible'}</th><th>Utilización</th></tr></thead><tbody>${reqs}</tbody></table></div>`
    : '<p class="hint">Sin requisitos todavía: declara el caudal de los enlaces WAN.</p>')
    + '<h3 class="ficha-det-tit" style="margin-top:16px">Escenarios de tráfico evaluados</h3>'
    + `<div class="scroll"><table class="esc-tabla"><thead><tr><th>Escenario</th><th>Caudal</th><th>Por el overlay</th><th>Pérdida</th></tr></thead><tbody>${escs}</tbody></table></div>`
    + '<p class="hint" style="margin-top:6px">Cada eje se dimensiona con el <b>peor</b> escenario, no con la suma de los enlaces contratados. El pico de sesiones y la reconexión tras una falla se declaran como medición en el paso 4.</p>'
    + `<h3 class="ficha-det-tit" style="margin-top:16px">Política y supuestos</h3><p class="hint" style="margin:0">Multiplicador conjunto: <b>${esc(r.multiplicador.texto)}</b>.</p>`
    + `<ul class="dl-supuestos">${r.supuestos.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`
    + inact
    + `<p class="hint" style="margin-top:10px">Huella del escenario <code>${esc(r.scenarioHash.slice(0, 23))}…</code> · catálogo <code>${esc(r.datasetVersion || '—')}</code> · motor ${esc(r.motor)}</p>`;
}

/* ── GRAFICO CON NOMBRE ACCESIBLE Y TABLA EQUIVALENTE (F17, T29) ───────────────────────── */
function pintarEscala(r) {
  const track = $('track');
  track.querySelectorAll('.dot,.tick,.pickLabel,.altLabel').forEach((e) => e.remove());
  const d = r.detalle;
  const need = d ? d.effectiveNeed : 0;
  const def = metricaEje === 'auto' ? null : R.EJE_POR_K[metricaEje];
  const porId = Object.fromEntries(r.candidatos.map((c) => [c.id, c]));
  const valorDe = (m) => (def ? m[def.campo] : (porId[m.id] ? porId[m.id].soporta : null));
  const visibles = MODELS.filter((m) => (verEol || !(m.eol || !m.hwSku)) && valorDe(m) != null && valorDe(m) > 0);
  $('trackLbl').textContent = def
    ? `Escala de ${def.n} — cifra publicada por modelo (logarítmica)`
    : 'Escala de capacidad — cuánto requerimiento soporta cada modelo en este escenario (logarítmica)';
  const caps = visibles.map(valorDe);
  const maxCap = caps.length ? Math.max(...caps) : 1000;
  const logP = (v) => Math.log10(Math.max(v, 10));
  const logMin = Math.log10(10);
  const logMax = logP(Math.max(maxCap, need || 0) * 1.2);
  const xPct = (v) => ((logP(v) - logMin) / (logMax - logMin)) * 100;
  const nodoNeed = $('need');
  if (need > 0) {
    const pct = Math.min(xPct(need), 99);
    nodoNeed.style.left = `${pct}%`;
    nodoNeed.classList.toggle('flip', pct > 60);
    $('needLbl').textContent = fmt(need);
  } else {
    nodoNeed.style.left = '0%';
    $('needLbl').textContent = '—';
  }
  const pickLbl = document.createElement('div');
  pickLbl.className = 'pickLabel';
  pickLbl.id = 'pickLbl';
  pickLbl.style.display = 'none';
  track.appendChild(pickLbl);
  [10, 50, 100, 500, 1000, 5000, 10000, 50000, 100000, 500000, 1000000].forEach((v) => {
    const pct = xPct(v);
    if (pct < 0 || pct > 100) return;
    const tick = document.createElement('div');
    tick.className = 'tick';
    tick.style.left = `${pct}%`;
    tick.innerHTML = `<i></i><b>${v >= 1000000 ? `${v / 1e6}T` : v >= 1000 ? `${v / 1000}G` : `${v}M`}</b>`;
    track.appendChild(tick);
  });
  const elegibles = new Set(r.elegibles.map((c) => c.id));
  const alts = new Set(r.alternativas.map((c) => c.id));
  const sel = r.seleccion;
  if (!d) {
    $('trackNota').textContent = 'Sin requerimiento todavía: el gráfico se dibuja al declarar el caudal.';
    $('grafTabla').innerHTML = '';
    track.setAttribute('aria-label', 'Escala de capacidad sin requerimiento declarado');
    track.removeAttribute('aria-labelledby');
    return;
  }
  visibles.forEach((m) => {
    const cap = valorDe(m);
    const pct = xPct(cap);
    if (pct < 0 || pct > 100) return;
    const dot = document.createElement('div');
    dot.className = `dot${elegibles.has(m.id) ? ' ok' : ''}${alts.has(m.id) ? ' alt' : ''}`;
    if (sel && m.id === sel.id) dot.className = 'dot pick';
    dot.style.left = `${pct}%`;
    dot.title = `${m.id}: ${fmt(cap)}${m.eol || !m.hwSku ? ' (fuera de venta)' : ''}`;
    track.appendChild(dot);
    if (alts.has(m.id) && (!sel || m.id !== sel.id)) {
      const lbl = document.createElement('div');
      lbl.className = 'altLabel';
      lbl.style.left = `${pct}%`;
      lbl.textContent = m.id.replace('FortiGate ', '');
      track.appendChild(lbl);
    }
  });
  if (sel) {
    pickLbl.textContent = sel.id;
    pickLbl.style.display = 'block';
    pickLbl.style.left = `${xPct(valorDe(sel.modelo) || need)}%`;
  }
  const ocultos = MODELS.length - visibles.length;
  const nota = `Requerimiento ${fmt(need)}. `
    + (sel ? `${sel.id} soporta ${fmt(valorDe(sel.modelo))} en esta métrica. ` : 'Ningún modelo validado. ')
    + (r.alternativas.length ? `Alternativas: ${r.alternativas.map((a) => a.id).join(' y ')}. ` : '')
    + `${elegibles.size} de ${MODELS.length} modelos cumplen el escenario completo.`
    + (ocultos ? ` ${ocultos} modelo(s) sin cifra en esta métrica o fuera de venta no se dibujan.` : '');
  $('trackNota').textContent = nota;
  track.removeAttribute('aria-label');
  track.setAttribute('aria-labelledby', 'trackLbl');
  // TABLA EQUIVALENTE: la misma informacion que el grafico, en el orden del grafico.
  const orden = visibles.slice().sort((a, b) => valorDe(a) - valorDe(b));
  $('grafTabla').innerHTML = '<div class="scroll"><table><caption class="vh">Capacidad de cada modelo frente al requerimiento</caption>'
    + '<thead><tr><th scope="col">Modelo</th><th scope="col">Capacidad en esta métrica</th><th scope="col">Estado</th></tr></thead><tbody>'
    + orden.map((m) => {
      const estado = sel && m.id === sel.id ? 'validado' : alts.has(m.id) ? 'alternativa' : elegibles.has(m.id) ? 'cumple'
        : (m.eol || !m.hwSku) ? 'fuera de venta' : 'no cumple';
      return `<tr><td>${esc(m.id)}</td><td class="n">${fmt(valorDe(m))}</td><td>${estado}</td></tr>`;
    }).join('')
    + '</tbody></table></div>';
}

// Escalera de capas del modelo validado.
function pintarTiers(r) {
  const sel = r.seleccion;
  if (!sel) { $('perfTiers').innerHTML = ''; $('perfNote').textContent = ''; $('perfModel').textContent = ''; return; }
  const m = sel.modelo;
  const top = m.fw || 1;
  const activeK = r.detalle ? r.detalle.capa.k : 'tp';
  $('perfModel').textContent = `— ${m.id}`;
  $('perfTiers').innerHTML = TIERS.map((t, i) => {
    const v = m[t.k];
    if (v == null) return '';
    const prev = i > 0 ? m[TIERS[i - 1].k] : null;
    const drop = prev && v && prev > v ? Math.round((1 - v / prev) * 100) : 0;
    return `${drop >= 50 ? `<div class="tierDrop">&#8595; ${drop}% al salir del offload de red</div>` : ''}`
      + `<div class="tierRow ${t.k === activeK ? 'on' : 'off'}" title="${esc(t.d)}"><span class="tn">${esc(t.n)}</span>`
      + `<span class="tb"><i style="width:${Math.max(2, (v / top) * 100)}%"></i></span><span class="tv">${fmt(v)}</span></div>`;
  }).join('') + (r.snapshot.seguridad.funciones.includes('chkSsl')
    ? (m.ssl != null
      ? `<div class="tierRow on" title="SSL Inspection Throughput: medición propia, no derivada de Threat Protection."><span class="tn">Inspección SSL</span><span class="tb"><i style="width:${Math.max(2, (m.ssl / top) * 100)}%"></i></span><span class="tv">${fmt(m.ssl)}</span></div>`
      : '<div class="tierRow off"><span class="tn">Inspección SSL</span><span class="tb"></span><span class="tv warn">sin dato</span></div>')
    : '');
  const ratio = m.tp ? Math.round(m.fw / m.tp) : 0;
  $('perfNote').innerHTML = `Del firewall puro a Threat Protection hay un factor <b>${ratio}x</b> en este modelo (${fmt(m.fw)} &rarr; ${fmt(m.tp)}). `
    + `La cifra de portada solo aplica a sesiones descargadas al procesador de red.${m.asic ? ` Silicio: <b>${esc(m.asic)}</b>.` : ''}`
    + ` Requerimiento actual: <b>${fmt(r.detalle ? r.detalle.effectiveNeed : 0)}</b>.`;
}

/* ── BOM PRELIMINAR en el panel (la version completa esta en su pestaña) ──────────────── */
function pintarBomPreliminar(r) {
  const caja = $('bomPreliminar');
  if (!r.bom) {
    caja.innerHTML = '<p class="hint">Sin modelo validado no se construye lista de materiales: el BOM solo sale del equipo que el motor valida.</p>';
    return;
  }
  let total = 0;
  let sinPrecio = 0;
  const filas = r.bom.filas.map((f) => {
    const sub = f.unit == null ? null : f.unit * (f.qty || 1);
    if (sub == null) sinPrecio += 1; else total += sub;
    return `<tr><td>${esc(f.desc)}<span class="sku">${f.sku ? esc(f.sku) : '<span class="warn">sin SKU exacto</span>'}</span></td><td class="n">${f.qty}</td><td class="n">${sub == null ? '—' : money(sub)}</td></tr>`;
  }).join('');
  caja.innerHTML = `<p class="hint" style="margin:0 0 8px">${esc(r.bom.modelo)} · ${r.bom.nodos} nodo(s) · construcción ${r.bom.construccion === 'bdl' ? '<b>SKU combinado (BDL)</b>' : 'equipo y servicios por separado'}</p>`
    + `<div class="scroll"><table><thead><tr><th>Línea</th><th>Cant.</th><th>Subtotal lista</th></tr></thead><tbody>${filas}`
    + `<tr><td><b>Total de lista</b>${sinPrecio ? ` <span class="warn">(${sinPrecio} línea(s) sin precio no suman)</span>` : ''}</td><td></td><td class="n"><b>${money(total)}</b></td></tr></tbody></table></div>`
    + '<p style="margin-top:8px"><button type="button" class="btn ghost" id="btnVerBom" style="font-size:11px">Ver la lista de materiales completa</button></p>';
  $('btnVerBom').addEventListener('click', () => { if (TABS) TABS.elegir('#tab-bom', true); });
}

/* ── PIE: la puerta, siempre visible ─────────────────────────────────────────────────── */
function pintarPie(r) {
  const g = GATE[r.quoteGate];
  const precios = CAT.fuentes && CAT.fuentes.find ? CAT.fuentes.find((f) => f.dominio === 'precio') : null;
  const salud = precios ? R.saludPrecios(precios) : null;
  const nb = r.bloqueos.length;
  const na = r.avisos.filter((a) => a.nivel !== 'info').length;
  $('gateResumen').innerHTML = `<span class="qg qg-${r.quoteGate}">${esc(g.n)}</span> `
    + `${nb ? `${nb} bloqueo(s)` : 'sin bloqueos'}${na ? ` · ${na} advertencia(s)` : ''}`
    + ` · lista de precios ${salud ? esc(salud.estado) : 'sin fecha'}`
    + ` · huella <code>${esc(r.scenarioHash.slice(7, 15))}</code>`;
  const sel = r.seleccion;
  $('resMovilTxt').innerHTML = `<b>${esc(sel ? sel.id : 'Sin modelo validado')}</b> · ${esc(g.n)}`;
}

/* ══ LISTA DE MATERIALES (pestaña) ═══════════════════════════════════════════════════════
   Se construye desde `RES.bom` y SOLO desde el: el modelo validado, su construccion (BDL en
   compra nueva, solo servicios en renovacion), sus nodos y sus lineas. Aqui no se decide
   nada; se presenta y se exporta. */
const DTO = BOM.simuladorDescuento('cajaDescuento', () => pintarBom());
const dtoActual = () => (DTO ? DTO.valor() : 0);
const dtoEtiqueta = () => (DTO ? DTO.etiqueta() : null);
let bomFilas = [];
let bomMeta = {};

function pintarBom() {
  const r = RES;
  if (!r) return;
  BOM.fijarVendor(VENDOR);
  const s = r.snapshot;
  const sel = r.seleccion;
  if (!sel || !r.bom) {
    $('bomBody').innerHTML = `<section class="panel"><h2>Ficha del equipo</h2><p class="hint">Sin modelo validado: no hay lista de materiales que construir. ${esc(r.bloqueos[0] ? r.bloqueos[0].mensaje : '')}</p></section>`;
    BOM.renderTabla([], {});
    $('bomTabla').innerHTML = '<p class="hint">La lista de materiales aparece cuando el motor valida un equipo para el escenario.</p>';
    $('tcoFin').innerHTML = '';
    bomFilas = [];
    bomMeta = {};
    $('bomOut').value = '';
    pintarPuerta(r);
    pintarPerfiles();
    return;
  }
  const m = sel.modelo;
  const anios = s.comercial.anios;
  const bundle = s.comercial.bundle;
  const care = s.comercial.soporte;
  const bDef = BUNDLES[bundle] || null;
  const cDef = CARE[care] || null;
  const filas = r.bom.filas;
  const soporte = filas.find((f) => f.cat === 'Soporte');
  const bdl = filas.find((f) => f.bdl);
  const sinEquipo = ['renovacion', 'coterm'].includes(s.comercial.motivo);
  let html = `<section class="panel"><h2>Equipo validado</h2>
    <div class="model" style="font-size:28px">${esc(m.id)}</div>
    <p class="family">${esc(m.seg)} · ${r.bom.nodos} nodo(s) · ${esc({ nueva: 'compra nueva', ampliacion: 'ampliación', renovacion: 'renovación', coterm: 'co-term' }[s.comercial.motivo])}${r.override && r.override.elegible ? ' · <b>elegido a mano y revalidado</b>' : ''}</p>
    ${sinEquipo ? `<p class="hint"><b>Solo servicios:</b> la caja ya está instalada${s.comercial.serieInstalada ? ` (${esc(s.comercial.serieInstalada)})` : ''} y no se cotiza.</p>` : ''}
    ${bdl ? `<p class="hint">En compra nueva el equipo, ${bDef ? esc(bDef.n) : 'el bundle'} y FortiCare Premium van en el <b>SKU combinado <code>${esc(bdl.sku)}</code></b>: una línea en vez de tres. En la lista de septiembre cuesta exactamente lo mismo que por separado.</p>` : ''}
    <div class="scroll"><table><thead><tr><th>Métrica</th><th>Valor</th></tr></thead><tbody>
    <tr><td>SKU hardware</td><td class="n">${m.hwSku ? `<code>${esc(m.hwSku)}</code>` : '<span class="warn">Descontinuado — sin SKU nuevo vigente</span>'}</td></tr>
    <tr><td>Precio de lista ref. (equipo)</td><td class="n">${m.elp ? esc(m.elp) : 'Consultar distribuidor'}</td></tr>
    <tr><td><b>Threat Protection</b></td><td class="n"><b>${fmt(m.tp)}</b></td></tr>
    <tr><td>Inspección SSL</td><td class="n">${m.ssl != null ? fmt(m.ssl) : '<span class="warn">sin dato</span>'}</td></tr>
    <tr><td>Sesiones concurrentes / nuevas por segundo</td><td class="n">${cifra(m.sess)} / ${m.cps != null ? cifra(m.cps) : '<span class="warn">sin dato</span>'}</td></tr>
    <tr><td>Interfaces</td><td>${esc(m.ifaces)}</td></tr>
    </tbody></table></div></section>`;
  html += `<section class="panel"><h2>Licencias FortiGuard</h2><ul class="clean">
    ${!bDef ? '<li><b>Sin bundle FortiGuard</b><span class="req opt">Excluido</span><span class="sku">No se cotiza ninguna suscripción de seguridad.</span></li>'
    : `<li class="on"><b>${esc(bDef.n)}</b><span class="req">Requerida</span><span class="sku">${esc(bDef.svcs)} · término ${anios} año${anios > 1 ? 's' : ''}${bdl ? ' · dentro del SKU combinado' : ''}</span></li>`}
  </ul></section>`;
  html += `<section class="panel"><h2>Soporte FortiCare</h2><div class="scroll"><table>
    <thead><tr><th>Servicio</th><th>SLA</th><th>SKU</th><th>Precio ref. c/u</th><th>Cant.</th></tr></thead><tbody>
    <tr><td>${cDef ? esc(cDef.n) : 'Sin contrato FortiCare'}</td><td class="n">${cDef ? esc(cDef.sla) : '—'}</td><td class="n">${soporte && soporte.sku ? `<code>${esc(soporte.sku)}</code>` : '<span class="warn">no se cotiza aparte</span>'}</td><td class="n">${soporte && soporte.unit != null ? money(soporte.unit) : '—'}</td><td class="n">${soporte ? soporte.qty : 0}</td></tr>
    </tbody></table></div>
    ${r.bom.soporteIncluido ? `<p class="hint" style="margin-top:10px"><b>${esc(bDef ? bDef.n : 'El bundle')} ya incluye FortiCare Premium.</b> ${soporte ? 'La línea de arriba es la <b>mejora</b> sobre ese Premium, no un segundo contrato.' : 'Por eso no se añade una segunda línea de soporte: cobraría el mismo servicio dos veces.'}</p>` : ''}
    </section>`;
  $('bomBody').innerHTML = html;

  const dto = dtoActual();
  $('bomTabla').innerHTML = BOM.renderTabla(filas, {
    dto,
    aviso: r.bom.nodos > 1 ? 'Clúster HA: cada nodo lleva su propia suscripción FortiGuard y su propio contrato FortiCare.' : null,
  });
  const fin = BOM.tco(filas, { opex: OPEX_FORTINET, anios });
  const hayPrecios = fin.capex > 0 || fin.opexTermino > 0;
  const celdaNet = (v) => (dto > 0 ? `<td><b>${BOM.money(v * (1 - dto))}</b></td>` : '');
  $('tcoFin').innerHTML = hayPrecios
    ? `<table class="tco-tabla"><thead><tr><th>Pie de la lista de materiales</th><th>Subtotal Lista</th>${dto > 0 ? '<th>Subtotal Neto</th>' : ''}</tr></thead><tbody>`
      + `<tr><td><b>CAPEX</b> — equipo y servicios únicos</td><td>${BOM.money(fin.capex)}</td>${celdaNet(fin.capex)}</tr>`
      + `<tr><td><b>OPEX anual</b> — FortiGuard + FortiCare ÷ ${anios} año${anios > 1 ? 's' : ''}</td><td>${BOM.money(fin.opexAnual)}</td>${celdaNet(fin.opexAnual)}</tr>`
      + `<tr><td><b>TCO a ${anios} año${anios > 1 ? 's' : ''}</b></td><td><b>${BOM.money(fin.tco)}</b></td>${celdaNet(fin.tco)}</tr></tbody></table>`
      + (fin.sinPrecio ? `<p class="hint" style="margin-top:8px">${fin.sinPrecio} línea(s) sin precio no entran en la suma.</p>` : '')
      + '<p class="hint" style="margin-top:8px">El neto es un <b>simulador genérico de tramos partner — no refleja el descuento real del distribuidor Fortinet</b>. Precios de lista AMER, sin impuestos.</p>'
    : '<p class="hint">Sin precios suficientes para calcular el TCO.</p>';
  bomFilas = filas;
  bomMeta = documentoMeta(r, null);
  $('bomOut').value = BOM.comoTexto(bomFilas, bomMeta);
  pintarPuerta(r);
  pintarPerfiles();
}

/* El documento que sale (Excel o texto). Lleva dentro TODO lo que permite auditarlo: la
   huella del escenario, la version del catalogo y del motor, la puerta, los supuestos, y si es
   un borrador, lo dice en el titulo y en cada nota. */
function documentoMeta(r, confirmacion) {
  const s = r.snapshot;
  const m = r.seleccion.modelo;
  const borrador = r.quoteGate === 'DRAFT';
  const anios = s.comercial.anios;
  const v = (VISTAS || {})[m.id];
  const cli = $('nombreCliente').value.trim();
  const ref = $('refProyecto').value.trim();
  const meta = {
    titulo: `${borrador ? 'BORRADOR TÉCNICO — ' : ''}Lista de materiales — ${m.id}`,
    subtitulo: `${m.seg} · FortiOS · ${r.bom.nodos} nodo(s) · término ${anios} año${anios > 1 ? 's' : ''}`,
    archivo: `${borrador ? 'BORRADOR_' : ''}BOM_${m.id}`,
    ...(v && v.front ? { fotos: { modelo: m.id, front: v.front, rear: v.rear || null, pie: [v.tamano, v.fuente].filter(Boolean).join(' · ') } } : {}),
    notas: [
      '',
      ...(borrador ? ['BORRADOR TECNICO: NO ES UNA COTIZACION EN FIRME. Falta, para cotizar:',
        ...r.avisos.filter((a) => a.nivel === 'borrador').map((a) => `  · ${a.mensaje.replace(/\s+/g, ' ')}`), ''] : []),
      `PUERTA DE COTIZACION: ${r.quoteGate} (${GATE[r.quoteGate].n}) · confianza ${r.confianza}`,
      `Huella del escenario: ${r.scenarioHash}`,
      `Catalogo: ${r.datasetVersion || '-'} · motor ${r.motor} · esquema ${r.esquema}`,
      confirmacion ? `Confirmado por el servidor el ${confirmacion.ts} para la accion «${confirmacion.accion}».` : 'Pendiente de confirmacion del servidor (se confirma al exportar).',
      '',
      'RENDIMIENTO DEL EQUIPO (cifras publicadas, modo flow)',
      `  Threat Protection: ${fmt(m.tp)} · Inspeccion SSL: ${m.ssl != null ? fmt(m.ssl) : 'sin dato'} · IPsec: ${fmt(m.vpn)}`,
      `  Sesiones concurrentes: ${cifra(m.sess)} · nuevas/s: ${m.cps != null ? cifra(m.cps) : 'sin dato'}`,
      r.seleccion.eval.manda ? `  Cuello de botella: ${r.seleccion.eval.manda.n} al ${R.pct(r.seleccion.eval.manda.u)}` : null,
      '',
      'SUPUESTOS DECLARADOS',
      ...r.supuestos.map((x) => `  · ${x}`),
      `  · Multiplicador: ${r.multiplicador.texto}`,
      ...(r.avisos.filter((a) => a.nivel === 'warning').length ? ['', 'ADVERTENCIAS', ...r.avisos.filter((a) => a.nivel === 'warning').map((a) => `  · ${a.mensaje.replace(/\s+/g, ' ')}`)] : []),
      ...(r.override && r.override.elegible ? ['', `Modelo elegido a mano (${r.override.modelo}) y revalidado por el motor contra el escenario completo.`] : []),
      ...(s.comercial.justificacionEol ? ['', `Justificacion del equipo fuera de venta: ${s.comercial.justificacionEol}`] : []),
      '',
      'Precios de lista AMER, sin descuentos de canal ni impuestos. Confirmar con el distribuidor autorizado.',
    ].filter((n) => n !== null),
  };
  if (cli) meta.cliente = cli;
  if (ref) meta.referencia = ref;
  const d = dtoActual();
  if (d > 0) { meta.dto = d; meta.dtoEtq = dtoEtiqueta(); }
  return meta;
}

/* ══ PUERTA DE COTIZACION (F04, T25) ══════════════════════════════════════════════════════
   Todos los botones comerciales preguntan lo mismo: `FortinetMotor.permite(RES, accion)`. Y
   antes de que salga nada, el servidor lo confirma recalculando el mismo escenario. */
function pintarPuerta(r) {
  const caja = $('exportGate');
  const g = GATE[r.quoteGate];
  const precios = CAT.fuentes && CAT.fuentes.find ? CAT.fuentes.find((f) => f.dominio === 'precio') : null;
  const salud = precios ? R.saludPrecios(precios) : null;
  const titulo = {
    READY: 'Propuesta lista para cotizar',
    WARNING: 'Cotizable: las advertencias viajan estampadas en el documento',
    DRAFT: 'Solo borrador técnico: el diseño es coherente, pero falta algo pedible',
    BLOCKED: 'Cotización bloqueada: ninguna salida comercial',
  }[r.quoteGate];
  const lista = r.bloqueos.concat(r.avisos.filter((a) => a.nivel !== 'info'));
  let html = `<h3>${esc(titulo)} <span class="qg qg-${r.quoteGate}">${esc(g.n)}</span></h3>`;
  if (lista.length) {
    html += `<ul>${lista.map((b) => {
      const c = b.correccion;
      const btn = c && c.accion === 'cambiar'
        ? ` <button type="button" class="btn ghost btn-corr" data-corregir='${esc(JSON.stringify(c))}'>${esc(c.campo === 'comercial.bundle' ? `Cambiar a ${BUNDLES[c.valor] ? BUNDLES[c.valor].n : c.valor}` : c.campo === 'remoto.metodo' ? 'Cambiar a IPsec' : 'Corregir')}</button>`
        : c && c.accion === 'volver-recomendado' ? ` <button type="button" class="btn ghost btn-corr" data-corregir='${esc(JSON.stringify(c))}'>Volver al recomendado</button>` : '';
      return `<li${b.nivel === 'bloqueo' ? ' class="warn"' : ''}>${esc(b.mensaje)}${btn}</li>`;
    }).join('')}</ul>`;
  }
  html += `<p class="hint" style="margin:8px 0 0">Huella del escenario <code>${esc(r.scenarioHash.slice(0, 23))}…</code> · catálogo <code>${esc(r.datasetVersion || '—')}</code>`
    + ` · ${bomFilas.filter((f) => !f.sku).length} línea(s) sin SKU exacto · lista de precios: ${esc(salud ? salud.mensaje : 'sin fuente declarada')}</p>`;
  if (ultimaConfirmacion && ultimaConfirmacion.hash === r.scenarioHash) {
    html += `<p class="hint" style="margin:6px 0 0">Última salida confirmada por el servidor: «${esc(ultimaConfirmacion.accion)}» el ${esc(ultimaConfirmacion.ts.replace('T', ' ').slice(0, 19))}.</p>`;
  }
  caja.className = `gate ${g.cls}`;
  caja.innerHTML = html;
  pintarBotones(r);
}
function pintarBotones(r) {
  const x = $('xlsBtn');
  const c = $('copyBtn');
  const excel = M.permite(r, 'excel') ? 'excel' : M.permite(r, 'excel-borrador') ? 'excel-borrador' : null;
  const copia = M.permite(r, 'copiar') ? 'copiar' : M.permite(r, 'copiar-borrador') ? 'copiar-borrador' : null;
  if (x && !x.dataset.ocupado) { x.disabled = !excel || !r.bom; x.textContent = excel === 'excel-borrador' ? 'Exportar borrador técnico' : 'Exportar a Excel'; x.dataset.accion = excel || ''; }
  if (c && !c.dataset.ocupado) { c.disabled = !copia || !r.bom; c.textContent = copia === 'copiar-borrador' ? 'Copiar borrador' : 'Copiar como texto'; c.dataset.accion = copia || ''; }
  const cot = $('btnACotizador');
  if (cot && cot.textContent === 'Enviar al cotizador') cot.disabled = !M.permite(r, 'cotizador') || !r.bom;
  $('btnGuardarPerfil').disabled = !M.permite(r, 'perfil') || !r.bom;
  $('btnConsolidar').disabled = !M.permite(r, 'consolidar') || !BOM.perfiles().length;
  const motivo = r.quoteGate === 'BLOCKED' ? 'La puerta de cotización está bloqueada: revisa sus motivos.'
    : r.quoteGate === 'DRAFT' ? 'Borrador técnico: no sale al cotizador ni a perfiles.' : '';
  for (const b of [x, c, cot, $('btnGuardarPerfil'), $('btnConsolidar')]) if (b) b.title = b.disabled ? motivo : '';
}

/* CONFIRMACION DEL SERVIDOR. El navegador puede decir que si; quien deja salir la
   cotizacion es el servidor, con el mismo motor, el mismo escenario y su propio catalogo. */
async function confirmar(accion) {
  if (!RES || !ESC) return { ok: false, motivo: 'Sin evaluación vigente.' };
  if (!M.permite(RES, accion)) return { ok: false, motivo: `La puerta está en ${RES.quoteGate}.` };
  const clave = `${accion}-${RES.scenarioHash.slice(7, 19)}-${Date.now().toString(36)}`;
  try {
    const resp = await fetch('/api/v1/fortinet/evaluations', {
      method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario: ESC, accion, scenarioHash: RES.scenarioHash, datasetVersion: CAT.datasetVersion, idempotencyKey: clave }),
    });
    const j = await resp.json().catch(() => ({}));
    if (!resp.ok || !j.permitida) {
      const motivo = j.error || `El servidor no confirmó la acción (${resp.status}).`;
      avisoAccion(motivo);
      return { ok: false, motivo, respuesta: j };
    }
    ultimaConfirmacion = { accion, ts: new Date().toISOString(), hash: j.scenarioHash, gate: j.quoteGate };
    return { ok: true, respuesta: j, confirmacion: ultimaConfirmacion };
  } catch {
    const motivo = 'No se pudo confirmar con el servidor: sin su confirmación no sale ninguna salida comercial.';
    avisoAccion(motivo);
    return { ok: false, motivo };
  }
}
function avisoAccion(texto) {
  const caja = $('exportGate');
  const p = document.createElement('p');
  p.className = 'hint warn';
  p.style.margin = '8px 0 0';
  p.textContent = texto;
  caja.appendChild(p);
  anunciar(texto, true);
}
async function conBoton(b, trabajo) {
  if (!b || b.disabled) return;
  const txt = b.textContent;
  b.dataset.ocupado = '1';
  b.disabled = true;
  b.textContent = 'Confirmando…';
  try { await trabajo((t) => { b.textContent = t; }); } finally {
    delete b.dataset.ocupado;
    b.textContent = txt;
    if (RES) pintarBotones(RES);
  }
}
$('xlsBtn').addEventListener('click', () => conBoton($('xlsBtn'), async (decir) => {
  const accion = $('xlsBtn').dataset.accion;
  if (!accion) return;
  const v = await confirmar(accion);
  if (!v.ok) return;
  decir('Generando…');
  try { await BOM.exportarExcel(bomFilas, documentoMeta(RES, v.confirmacion)); } catch (e) { console.error(e); avisoAccion('Error al generar el Excel.'); }
  pintarPuerta(RES);
}));
$('copyBtn').addEventListener('click', () => conBoton($('copyBtn'), async (decir) => {
  const accion = $('copyBtn').dataset.accion;
  if (!accion) return;
  const v = await confirmar(accion);
  if (!v.ok) return;
  const texto = BOM.comoTexto(bomFilas, documentoMeta(RES, v.confirmacion));
  $('bomOut').value = texto;
  try { await navigator.clipboard.writeText(texto); decir('Copiado'); } catch {
    const t = $('bomOut');
    t.classList.remove('hidden'); t.select(); document.execCommand('copy'); t.classList.add('hidden');
    decir('Copiado');
  }
  await new Promise((res) => { setTimeout(res, 900); });
  pintarPuerta(RES);
}));

/* ── PERFILES MULTI-SEDE ─────────────────────────────────────────────────────────────── */
const cargarPerfiles = () => BOM.perfilesDe(VENDOR);
function capturarCampos() {
  const v = {};
  CAMPOS_ESCENARIO.forEach((id) => {
    const n = $(id);
    if (!n) return;
    if (n.classList && n.classList.contains('seg')) { const a = n.querySelector('[aria-pressed="true"]'); v[id] = a ? a.dataset.v : null; }
    else if (n.type === 'checkbox') v[id] = n.checked;
    else v[id] = n.value;
  });
  return v;
}
function aplicarCampos(v0) {
  let v = v0 || {};
  // Perfiles guardados antes del builder (bw/unit/pctOverlay): se convierten con la misma regla
  // que la migracion de enlaces v1, en vez de aplicarse sin caudal y en silencio.
  if (v.wanLinksData == null && v.bw != null) {
    const bw = (parseFloat(v.bw) || 0) * (parseFloat(v.unit) || 1);
    if (bw > 0) {
      const pct = v.pctOverlay != null ? Math.max(0, Math.min(100, parseFloat(v.pctOverlay) || 0)) : 100;
      v = { ...v, wanLinksData: JSON.stringify({ v: 2, wanLinks: filasV1(bw, pct) }) };
    }
  }
  // Un perfil de antes de la etapa 7 guarda el equipo en `verdict-sel`, no tiene casilla de
  // acceso remoto y deriva los endpoints de EMS de los usuarios: se traduce con la regla de
  // entonces (la misma que `migrarActivadores` aplica a los enlaces).
  if (v.pickModel == null && v['verdict-sel'] != null) v = { ...v, pickModel: v['verdict-sel'] };
  if (v.chkRemoto == null && ((parseFloat(v.vpnUsers) || 0) > 0 || (parseFloat(v.vpnMbps) || 0) > 0)) v = { ...v, chkRemoto: true };
  if (v.chkEms === true && v.emsEndpoints == null) v = { ...v, emsEndpoints: String(Math.round((parseFloat(v.users) || 0) + (parseFloat(v.vpnUsers) || 0))) };
  CAMPOS_ESCENARIO.forEach((id) => {
    const n = $(id);
    if (!n || v[id] == null) return;
    if (n.classList && n.classList.contains('seg')) {
      const b = [...n.children].find((x) => x.dataset.v === v[id]);
      if (b) {
        [...n.children].forEach((x) => x.setAttribute('aria-pressed', x === b ? 'true' : 'false'));
        if (id === 'profileSeg') profile = v[id];
        if (id === 'rolSeg') rolSdwan = v[id];
        if (id === 'segSeg') segMode = v[id];
      }
    } else if (n.type === 'checkbox') n.checked = !!v[id];
    else if (n.tagName === 'SELECT') { if ([...n.options].some((o) => o.value === String(v[id]))) n.value = String(v[id]); }
    else n.value = v[id];
  });
  seleccionManual = $('pickModel').value || null;
  reconstruirWanDesdeHidden();
  wanRolPintado = null;
  evaluarYPintar();
}
$('btnGuardarPerfil').addEventListener('click', () => conBoton($('btnGuardarPerfil'), async () => {
  const nombre = $('nombrePerfil').value.trim();
  const sedes = Math.max(0, parseInt($('perfilSedes').value, 10) || 0);
  if (!nombre || !sedes) { $('perfilMsg').textContent = 'Pon un nombre y el número de sedes idénticas.'; $('nombrePerfil').focus(); return; }
  const v = await confirmar('perfil');
  if (!v.ok) return;
  BOM.guardarPerfil({ nombre, sedes, modelo: RES.seleccion.id, vendor: VENDOR, fecha: new Date().toISOString().slice(0, 10),
    version: 2, huella: RES.scenarioHash, puerta: RES.quoteGate, campos: capturarCampos(), filas: JSON.parse(JSON.stringify(bomFilas)) });
  $('nombrePerfil').value = '';
  $('perfilSedes').value = '';
  $('perfilMsg').textContent = `Perfil «${nombre}» guardado con ${sedes} sede(s).`;
  pintarPerfiles();
}));
function pintarPerfiles() {
  const caja = $('listaPerfiles');
  const l = cargarPerfiles();
  caja.innerHTML = l.length
    ? '<table class="tco-tabla"><thead><tr><th>Perfil</th><th>Sedes</th><th>Modelo</th><th>Guardado</th><th></th></tr></thead><tbody>'
      + l.map((x) => `<tr><td><b>${esc(x.nombre)}</b></td><td>${x.sedes}</td><td>${esc(x.modelo)}</td><td>${esc(x.fecha || '—')}</td>`
        + `<td><button type="button" class="btn ghost" data-perfil-cargar="${esc(x.id)}" style="font-size:10px;padding:3px 8px">Cargar</button> `
        + `<button type="button" class="btn ghost" data-perfil-borrar="${esc(x.id)}" style="font-size:10px;padding:3px 8px">Eliminar</button></td></tr>`).join('')
      + '</tbody></table>'
    : '<p class="hint">Sin perfiles guardados todavía.</p>';
  if (RES) $('btnConsolidar').disabled = !M.permite(RES, 'consolidar') || !BOM.perfiles().length;
}
$('listaPerfiles').addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  if (b.dataset.perfilCargar != null) {
    const x = cargarPerfiles().find((y) => y.id === b.dataset.perfilCargar);
    if (x && x.campos) { aplicarCampos(x.campos); registrarHistorial(); }
  } else if (b.dataset.perfilBorrar != null) {
    BOM.quitarPerfil(b.dataset.perfilBorrar);
    pintarPerfiles();
  }
});
// En FortiGate TODO multiplica por sedes: en HA cada nodo paga su suscripcion. Pasar los
// objetos vacios deja constancia de que se miro y se decidio, no de que se olvido.
function consolidarPerfiles() {
  const l = BOM.perfiles();
  const { filas, totalSedes, fabricantes } = BOM.consolidar(l, { agregadas: [], unicas: [] });
  const multi = fabricantes.length > 1;
  const meta = {
    titulo: `BOM global consolidado — ${l.length} perfil(es), ${totalSedes} sedes`,
    subtitulo: l.map((x) => `${x.nombre} ×${x.sedes} (${x.modelo})`).join(' · '),
    archivo: multi ? 'BOM_global_multifabricante' : 'BOM_global_fortinet',
    sinRefs: true,
    notas: ['REGLAS DE CONSOLIDACION (FortiGate):',
      '  Equipo, licencias y soporte: cantidad por sede x sedes del perfil. En HA cada nodo lleva su propia suscripcion.',
      '  Precios: los vigentes el dia en que se guardo cada perfil; cada perfil lleva la huella de su escenario.'],
  };
  const cli = $('nombreCliente').value.trim();
  const ref = $('refProyecto').value.trim();
  if (cli) meta.cliente = cli;
  if (ref) meta.referencia = ref;
  if (multi) meta.notas.push(`  MULTI-FABRICANTE: ${fabricantes.join(', ')}.`);
  const d = dtoActual();
  if (d > 0) { meta.dto = d; meta.dtoEtq = dtoEtiqueta(); }
  return { filas, meta, totalSedes, fabricantes };
}
$('btnConsolidar').addEventListener('click', () => conBoton($('btnConsolidar'), async () => {
  const v = await confirmar('consolidar');
  if (!v.ok) return;
  const { filas, meta, totalSedes, fabricantes } = consolidarPerfiles();
  if (!totalSedes) return;
  $('consolidadoSub').textContent = `${meta.subtitulo} — ${totalSedes} sedes en total`;
  $('consolidadoTabla').innerHTML = (fabricantes.length > 1 ? `<p class="bom-aviso">Consolidado <b>multi-fabricante</b> (${esc(fabricantes.join(', '))}).</p>` : '')
    + BOM.renderTabla(filas, { dto: dtoActual(), sinRefs: true });
  $('modalConsolidado').hidden = false;
  $('xlsConsolidadoBtn').onclick = () => BOM.exportarExcel(filas, meta);
  $('consolidadoCerrar').focus();
}));
$('consolidadoCerrar').addEventListener('click', () => { $('modalConsolidado').hidden = true; $('btnConsolidar').focus(); });
$('modalConsolidado').addEventListener('click', (e) => { if (e.target === $('modalConsolidado')) $('modalConsolidado').hidden = true; });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('modalConsolidado').hidden) $('modalConsolidado').hidden = true; });

/* ── CHIPS DE LOS PASOS: salen del mismo resultado que el calculo ────────────────────── */
function chip(id, cls, texto, titulo) {
  const n = $(id);
  if (!n) return;
  n.className = `paso-chip ${cls || ''}`;
  n.textContent = texto || '';
  n.title = titulo || '';
}
function pasoDe(campo) {
  const id = CAMPO_ID[campo];
  const n = id ? $(id) : (campo === 'topologia.enlaces' ? $('wanBuilder') : null);
  const sec = n && n.closest('.paso');
  return sec ? sec.id : null;
}
function pintarPasos(r) {
  const s = r.snapshot;
  const faltanEn = {};
  for (const f of r.faltan.concat(r.errores.map((e) => e.campo))) {
    const p = pasoDe(f);
    if (p) (faltanEn[p] = faltanEn[p] || []).push(CAMPO_N[f] || f);
  }
  const conFalta = (paso, def) => (faltanEn[paso] ? ['bad', `Falta ${faltanEn[paso][0]}`, `Revisar: ${faltanEn[paso].join(', ')}`] : def);
  chip('chipPaso1', ...conFalta('paso1', [s.software.inspeccion === 'proxy' ? 'warn' : '',
    `${{ branch: 'Sucursal', campus: 'Campus', dc: 'Datacenter' }[s.sitio.segmento]} · ${{ none: 'sin SD-WAN', spoke: 'spoke', hub: 'hub' }[s.topologia.rol]} · FortiOS ${s.software.fortiOS}${s.disponibilidad.modo !== 'standalone' ? ' · HA' : ''}`,
    'Segmento, rol, versión de FortiOS y alta disponibilidad.']));
  const c = r.detalle && r.detalle.capa;
  const min = R.bundleMinimo(s.seguridad.funciones, FUNCIONES, BUNDLES);
  chip('chipPaso2', ...conFalta('paso2', [c && c.elevada ? 'warn' : '',
    `${TIER_BY_K[c ? c.k : s.seguridad.capa].n}${c && c.elevada ? ' (elevada)' : ''}${min.minimo && min.minimo !== 'atp' ? ` · mín. ${BUNDLES[min.minimo].n.split(' ')[0]}` : ''}`,
    'Capa efectiva contra la que se dimensiona.']));
  const d = r.detalle;
  chip('chipPaso3', ...conFalta('paso3', [!r.seleccion && d ? 'warn' : '', d ? `${fmt(d.trafico.previsto)} previstos${r.escenarios.length > 1 ? ` · ${r.escenarios.length} escenarios` : ''}` : '—',
    'Requerimiento previsto con crecimiento aplicado.']));
  const sess = r.requisitos.find((x) => x.eje === 'sess');
  chip('chipPaso4', ...conFalta('paso4', ['', `${sess ? `${nMil(sess.requerido)} sesiones` : 'sin sesiones'} · techo ${s.politica.techoPct} %`,
    'Escala, hardware físico, registro y política.']));
  const bundleMal = r.bloqueos.find((b) => b.codigo === 'bundle-insuficiente');
  chip('chipPaso5', ...conFalta('paso5', bundleMal ? ['bad', 'Bundle insuficiente', bundleMal.mensaje]
    : [r.quoteGate === 'BLOCKED' ? 'bad' : r.quoteGate === 'READY' ? '' : 'warn',
      `${r.seleccion ? r.seleccion.id.replace('FortiGate ', '') : '—'} · ${s.comercial.anios} año(s) · ${GATE[r.quoteGate].n}`, 'Tipo de compra, modelo, término, bundle y soporte.']));
  // Un paso que bloquea no se queda plegado: se abre para que se vea el motivo.
  for (const p of Object.keys(faltanEn)) { const det = $(p) && $(p).querySelector('details'); if (det) det.open = true; }
  if (bundleMal) { const det = $('paso5').querySelector('details'); if (det) det.open = true; }
}

/* ── ANUNCIOS PARA LECTOR DE PANTALLA (F17, T28) ──────────────────────────────────────
   Solo cuando cambia el equipo o la puerta: anunciar cada tecla seria ruido que se apaga. */
function anunciar(texto, forzar) {
  const n = $('resAnuncio');
  if (!n) return;
  if (!forzar && texto === ultimoAnuncio) return;
  ultimoAnuncio = texto;
  n.textContent = '';
  setTimeout(() => { n.textContent = texto; }, 30);
}
function anunciarCambio(r) {
  const sel = r.seleccion;
  const texto = sel
    ? `${r.override && r.override.elegible ? 'Elegido a mano y validado' : 'Recomendado'}: ${sel.id}. Puerta de cotización: ${GATE[r.quoteGate].n}.`
      + (r.override && !r.override.elegible ? ` ${r.override.modelo} no cumple el escenario: cotización bloqueada.` : '')
      + (r.quoteGate === 'BLOCKED' && r.bloqueos[0] ? ` ${r.bloqueos[0].mensaje}` : '')
    : `Sin modelo validado. ${r.bloqueos[0] ? r.bloqueos[0].mensaje : ''}`;
  anunciar(texto);
}

/* ── FUENTES DE ESTE CALCULO (F13, T24): generadas, nunca escritas a mano ─────────────── */
function pintarFuentesCalculo(r) {
  const caja = $('fuentesCalculo');
  const nota = $('notaFuentes');
  if (!caja) return;
  const fs = FUENTES && FUENTES.fuentes ? FUENTES.fuentes : [];
  const m = r.seleccion ? r.seleccion.modelo : null;
  const cobertura = (campo) => `${MODELS.filter((x) => x[campo] != null).length}/${MODELS.length}`;
  const eol = MODELS.filter((x) => x.eol || !x.hwSku).length;
  caja.innerHTML = (fs.length
    ? `<ul class="fuentes-list">${fs.map((f) => `<li><b>${esc(f.documento)}</b>${f.fecha ? ` — ${esc(f.fecha)}` : ' — sin fecha declarada'}`
      + `${f.url ? ` · <a href="${esc(f.url)}" target="_blank" rel="noopener">documento</a>` : ''}<br>${esc(f.cubre || f.nota || '')}</li>`).join('')}</ul>`
    : '<p class="hint">No se pudo leer la procedencia declarada del fabricante.</p>')
    + `<p class="hint" style="margin-top:8px">Cobertura del catálogo servido, contada y no escrita: SSL ${cobertura('ssl')} · CPS ${cobertura('cps')} · túneles ${cobertura('tunGw')} · VDOM ${cobertura('vdomMax')} · puertos estructurados ${cobertura('puertos')} · disco ${cobertura('almacenamientoGB')}. `
    + `${eol} modelo(s) fuera de venta <b>se muestran</b> como referencia de parque instalado y no se ofrecen en compra nueva.</p>`
    + (m ? `<p class="hint">Procedencia campo a campo del <b>${esc(m.id)}</b>: pestaña «Dimensionar» → ficha → «Procedencia de las cifras de este equipo».</p>` : '');
  if (nota) {
    const tecnica = fs.find((f) => f.dominio !== 'precio');
    const precios = fs.find((f) => f.dominio === 'precio');
    nota.innerHTML = fs.length
      ? `<b>Fuentes declaradas:</b> ${tecnica ? `${esc(tecnica.documento)} (${esc(tecnica.fecha || 'sin fecha')})` : '—'} · ${precios ? `${esc(precios.documento)} (${esc(precios.fecha || 'sin fecha')})` : '—'}. Detalle en la pestaña «Fuentes».`
      : '';
  }
}

/* ── BANNER DE ESTADO DE DATOS ───────────────────────────────────────────────────────── */
function pintarBanner() {
  const caja = $('dataBanner');
  if (!caja || !MODELS.length) return;
  const n = MODELS.length;
  const cuenta = (campo) => MODELS.filter((m) => m[campo] != null && m[campo] !== false).length;
  const conSsl = cuenta('ssl');
  const precios = FUENTES && FUENTES.fuentes ? FUENTES.fuentes.find((f) => f.dominio === 'precio') : null;
  const tecnica = FUENTES && FUENTES.fuentes ? FUENTES.fuentes.find((f) => f.dominio !== 'precio') : null;
  const salud = precios ? R.saludPrecios(precios) : null;
  const cls = !salud ? 'warn' : salud.bloquea ? 'bad' : (conSsl < n ? 'warn' : 'ok');
  const item = (k, v, t) => `<span class="db-item" title="${esc(t || '')}"><span class="db-k">${esc(k)}</span><span class="db-v">${v}</span></span>`;
  caja.innerHTML = item('Fuente técnica', tecnica ? esc(tecnica.documento) : '—', tecnica ? tecnica.nota || '' : '')
    + item('Fecha', tecnica && tecnica.fecha ? esc(tecnica.fecha) : 'sin fecha')
    + item('Precios', precios ? `${esc(precios.fecha || 'sin fecha')}${salud ? ` · ${esc(salud.estado)}` : ''}` : 'sin lista', salud ? salud.mensaje : '')
    + item('Región', 'AMER', 'Los precios de lista de este catálogo son de la price list AMER.')
    + item('Cobertura', `precio ${MODELS.filter((m) => m.elpN > 0).length}/${n} · cps ${cuenta('cps')}/${n} · SSL ${conSsl}/${n} · puertos ${cuenta('puertos')}/${n}`,
      'Cuántos modelos traen cada campo. Se cuenta sobre el catálogo servido, no se declara.')
    + (conSsl < n ? `<span class="db-item"><span class="db-v warn">La cifra oficial de inspección SSL está en ${conSsl} de ${n} modelos: el resto se aparta si se pide ese eje, en vez de estimarse.</span></span>` : '');
  caja.className = `databanner ${cls}`;
  caja.hidden = false;
}

// Catalogo completo (pestaña): se muestran tambien los fuera de venta, marcados.
function renderCatalogo() {
  const tbody = document.querySelector('#tbl-fortinet-cat tbody');
  if (!tbody) return;
  tbody.innerHTML = MODELS.map((m) => `<tr>
    <td><code>${esc(m.id)}</code>${m.eol || !m.hwSku ? ' <span class="pillc" style="color:var(--red)">Fuera de venta</span>' : ''}</td><td>${esc(m.seg)}</td>
    <td class="n">${esc(m.fw)}</td><td class="n">${esc(m.ips)}</td><td class="n">${esc(m.ngfw)}</td>
    <td class="n">${esc(m.vpn)}</td><td>${esc(m.ifaces)}</td>
    <td class="n" style="color:var(--amber);white-space:nowrap">${m.elp ? esc(m.elp) : '—'}</td>
  </tr>`).join('');
}

// Selector de modelo: el catalogo completo por familia, con «seguir la recomendacion» primero.
function serieFortinet(id) {
  const mm = /(\d+)([GF])/.exec(id);
  if (!mm) return 'Otros';
  const n = parseInt(mm[1], 10);
  if (mm[2] === 'G') return n >= 1000 ? 'FortiGate G — Data Center / Operador' : 'FortiGate G — Sucursal / SOHO';
  if (n >= 7000) return 'FortiGate F — Chasis / Operador';
  return n >= 1000 ? 'FortiGate F — Gama alta / Data Center' : 'FortiGate F — Sucursal / Mediana empresa';
}
function populatePickModel() {
  const ORDEN = ['FortiGate G — Sucursal / SOHO', 'FortiGate G — Data Center / Operador', 'FortiGate F — Sucursal / Mediana empresa',
    'FortiGate F — Gama alta / Data Center', 'FortiGate F — Chasis / Operador', 'Otros'];
  const numDe = (id) => { const mm = /(\d+)/.exec(id); return mm ? parseInt(mm[1], 10) : 0; };
  const grupos = new Map();
  for (const m of MODELS) {
    const g = serieFortinet(m.id);
    if (!grupos.has(g)) grupos.set(g, []);
    grupos.get(g).push(m);
  }
  const ordenados = [...grupos.entries()].sort((a, b) => ORDEN.indexOf(a[0]) - ORDEN.indexOf(b[0]));
  for (const [, ms] of ordenados) ms.sort((a, b) => numDe(a.id) - numDe(b.id));
  $('pickModel').innerHTML = '<option value="">Seguir la recomendación del motor</option>'
    + ordenados.map(([g, ms]) => `<optgroup label="${esc(g)}">${ms.map((m) => `<option value="${esc(m.id)}">${esc(m.id)} — ${esc(m.seg)}${m.eol || !m.hwSku ? ' (fuera de venta)' : ''}</option>`).join('')}</optgroup>`).join('');
}
// El equipo elegido de un enlace: `pickModel`, o `verdict-sel` en los de antes de la etapa 7.
function restaurarSeleccionDeUrl() {
  const p = new URLSearchParams(location.search);
  const id = p.get('pickModel') || p.get('verdict-sel');
  if (id && MODELS.some((m) => m.id === id)) {
    seleccionManual = id;
    $('pickModel').value = id;
  }
}

/* ══ ENLACE VERIFICABLE (T30) ══════════════════════════════════════════════════════════════
   El enlace lleva la huella del escenario (`h`) y la version del catalogo (`ds`). Al abrirlo
   se recalcula y se compara: si coinciden, el receptor ve EXACTAMENTE lo que vio el emisor;
   si no, se dice cual de las dos cosas cambio. */
function verificarEnlace() {
  const p = new URLSearchParams(location.search);
  const h = p.get('h');
  const ds = p.get('ds');
  if (!h && !ds) return;
  const caja = $('accionesEnlace');
  const msg = document.createElement('p');
  msg.className = 'hint estado-verificacion';
  msg.style.marginTop = '8px';
  const hashOk = !h || (RES && RES.scenarioHash.slice(7, 7 + h.length) === h);
  const dsOk = !ds || (CAT && CAT.datasetVersion === `fortinet@${ds}`);
  if (hashOk && dsOk) {
    msg.innerHTML = `<b>Enlace verificado:</b> el escenario y el catálogo coinciden con los de quien lo compartió (huella <code>${esc(h || '')}</code>).`;
  } else {
    msg.className += ' warn';
    msg.innerHTML = (!dsOk ? `<b>El catálogo cambió desde que se compartió este enlace</b> (<code>${esc(ds)}</code> → <code>${esc((CAT.datasetVersion || '').replace(/^fortinet@/, ''))}</code>): el resultado puede diferir del que vio el emisor. ` : '')
      + (!hashOk ? `<b>El escenario recalculado no coincide con el que se compartió</b> (huella <code>${esc(h)}</code> → <code>${esc(RES ? RES.scenarioHash.slice(7, 7 + h.length) : '—')}</code>): compruébalo con quien te lo pasó antes de cotizar.` : '');
  }
  if (caja) caja.appendChild(msg);
}

/* ENLACES DE ANTES DE LOS ACTIVADORES (etapa 7). Hasta el 23-sep el acceso remoto no tenia
   casilla: bastaba con poner usuarios o caudal. Y los endpoints de EMS no se pedian: salian de
   usuarios del sitio + remotos. Un enlace de entonces que aterrizara con el acceso remoto
   inactivo, o con EMS pidiendo un dato que no trae, mostraria OTRO escenario sin decirlo —
   peor que un 404—. Se reponen con la regla de entonces y se avisa por consola. */
function migrarActivadores(p) {
  const num = (k) => parseFloat(p.get(k)) || 0;
  if (!p.has('chkRemoto') && (num('vpnUsers') > 0 || num('vpnMbps') > 0)) {
    $('chkRemoto').checked = true;
    $('chkRemoto').dispatchEvent(new Event('input', { bubbles: true }));
    console.warn('[dimensionador-fortinet] Enlace anterior a la etapa 7: traia acceso remoto sin su casilla; se activo.');
  }
  if (p.get('chkEms') === '1' && !p.has('emsEndpoints')) {
    const n = Math.round(num('users') + num('vpnUsers'));
    if (n > 0) {
      $('emsEndpoints').value = String(n);
      $('emsEndpoints').dispatchEvent(new Event('input', { bubbles: true }));
      console.warn('[dimensionador-fortinet] Enlace anterior a la etapa 7: los endpoints de EMS se derivaban de los usuarios;'
        + ' se propuso esa cifra (', n, ') para confirmarla.');
    }
  }
}

/* ══ PANEL ANCLADO: su alto es lo que queda visible (F08, T26) ══════════════════════════ */
let rafPanel = null;
function ajustarPanel() {
  rafPanel = null;
  const p = $('dimRes');
  if (!p) return;
  if (window.matchMedia('(max-width: 880px)').matches || $('pane-calc').hidden) { p.style.height = ''; return; }
  const top = Math.max(p.getBoundingClientRect().top, 12);
  p.style.height = `${Math.max(360, window.innerHeight - top - 12)}px`;
}
const pedirAjuste = () => { if (!rafPanel) rafPanel = requestAnimationFrame(ajustarPanel); };
window.addEventListener('scroll', pedirAjuste, { passive: true });
window.addEventListener('resize', pedirAjuste);
document.querySelector('.tabs').addEventListener('click', () => setTimeout(pedirAjuste, 0));
// En movil los pasos son un acordeon unico: abrir uno pliega los demas (sin scroll anidado).
document.querySelectorAll('.paso > details').forEach((d) => {
  d.addEventListener('toggle', () => {
    if (!d.open || !window.matchMedia('(max-width: 880px)').matches) return;
    document.querySelectorAll('.paso > details').forEach((o) => { if (o !== d) o.open = false; });
  });
});
// Lo que toca cada campo condicional, junto al campo (§10.3).
function pintarAfecta() {
  const porCampo = Object.fromEntries(M.REGLAS.map((r) => [r.campo, r.afecta || []]));
  document.querySelectorAll('[data-afecta]').forEach((p) => {
    const a = porCampo[p.dataset.afecta] || [];
    p.textContent = a.length ? `Afecta a: ${a.map((k) => AFECTA_N[k] || (R.EJE_POR_K[k] ? R.EJE_POR_K[k].n : k)).join(', ')}` : '';
  });
}

/* ══ ARRANQUE ═════════════════════════════════════════════════════════════════════════════ */
(async function initApp() {
  const res = await fetch('/api/dimensionador/fortinet');
  const data = await res.json();
  FICHA.fijarCicloVida(data.cicloVida);
  MODELS = data.models;
  BUNDLES = data.bundles;
  CARE = data.care;
  FUNCIONES = data.funciones || [];
  SERVICIOS_SDWAN = data.serviciosSdwan || [];
  TERMINOS = data.terminos || {};
  CAT = { models: MODELS, bundles: BUNDLES, care: CARE, funciones: FUNCIONES, serviciosSdwan: SERVICIOS_SDWAN,
    terminos: TERMINOS, fortios: data.fortios, datasetVersion: data.datasetVersion, fuentes: [] };
  try {
    const rv = await fetch('/data/fortinet-vistas-equipos.json');
    if (rv.ok) VISTAS = await rv.json();
  } catch { VISTAS = null; }
  populatePickModel();
  restaurarSeleccionDeUrl();
  pintarAfecta();
  renderCatalogo();
  evaluarYPintar();
  // La procedencia llega despues y en su propia peticion: el banner, la vigencia de precios
  // y la puerta la necesitan; el dimensionamiento no, asi que no se le hace esperar.
  try {
    const rf = await fetch('/api/fuentes');
    const todas = await rf.json();
    FUENTES = todas && todas.fortinet ? todas.fortinet : null;
  } catch { FUENTES = null; }
  CAT.fuentes = FUENTES && FUENTES.fuentes ? FUENTES.fuentes : [];
  pintarBanner();
  evaluarYPintar();
  verificarEnlace();
  estadoActual = JSON.stringify(capturarCampos());
  pedirAjuste();
  PROCEDENCIA.registrarModelos('fortinet', () => MODELS.map((m) => ({ model: m.id, ...m })));
}());
// Añadir o quitar una referencia desde la ficha repinta la lista de materiales al momento.
BOM.fijarRepintado(() => pintarBom());

document.addEventListener('DOMContentLoaded', () => {
  // Estado v2: el builder nace con su fila; ESTADO repone #wanLinksData si el enlace es v2; si
  // es v1 se migra; y al final se reconstruyen las filas desde lo que haya quedado.
  reconstruirWanDesdeHidden();
  ST = ESTADO.vincular({
    campos: CAMPOS_ESCENARIO,
    migrados: PARAMS_CONOCIDOS,
    extrasNombres: ['h', 'ds'],
    extras: () => (RES && CAT ? { h: RES.scenarioHash.slice(7, 23), ds: (CAT.datasetVersion || '').replace(/^fortinet@/, '') } : {}),
  });
  const migrado = migrarEstadoV1();
  reconstruirWanDesdeHidden();
  if (migrado) $('wanLinksData').dispatchEvent(new Event('input', { bubbles: true }));
  migrarActivadores(new URLSearchParams(location.search));
  // Las variables de la pagina que viven fuera del DOM se leen de lo repuesto.
  for (const [id, fija] of [['profileSeg', (v) => { profile = v; }], ['rolSeg', (v) => { rolSdwan = v; }], ['segSeg', (v) => { segMode = v; }]]) {
    const a = $(id).querySelector('[aria-pressed="true"]');
    if (a) fija(a.dataset.v);
  }
  const caja = $('accionesEnlace');
  if (caja) {
    ESTADO.botonEnlace(caja);
    ESTADO.avisoOrigen(caja, ST);
  }
  $('estadoGuardado').textContent = ST && ST.origen ? 'Escenario repuesto desde un enlace compartido' : 'Escenario nuevo — valores por defecto';
  // Envio al cotizador: con id propio para que la puerta lo gobierne, y confirmado por el
  // servidor antes de escribir nada en la cola.
  BOM.montarBotonCotizador(() => {
    if (!RES || !RES.seleccion || !RES.bom) return null;
    return { modelo: RES.seleccion.id, qty: RES.bom.nodos, de: 'Fortinet FortiGate',
      sinEquipo: ['renovacion', 'coterm'].includes(RES.snapshot.comercial.motivo) };
  }, { id: 'btnACotizador', antes: () => confirmar('cotizador') });
  if (RES) pintarBotones(RES);
});

// «Limpiar» vuelve a los valores por defecto SIN el querystring: recargar con el enlace
// puesto lo repondria y no limpiaria nada.
$('btnLimpiar').addEventListener('click', () => { location.href = location.pathname; });
