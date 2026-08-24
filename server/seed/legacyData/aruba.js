// ── HPE Aruba Networking · datos de dimensionamiento EdgeConnect SD-WAN ──────
//
// Fuente autoritativa de Aruba para el dimensionador, con la misma estructura que
// fortinet.js: una escalera de capas de throughput + licencias por modelo + soporte.
// Lo que cambia respecto a Fortinet no es el formato sino la física del producto, y
// entender esa diferencia es el 80% del dimensionamiento correcto en EdgeConnect.
//
// PROCEDENCIA DE LOS DATOS — LEER ANTES DE COTIZAR EN FIRME
// Este archivo NO está verificado contra un price list firmado, a diferencia de
// fortinet.js (2026Q3 Main Price list AMER). Se sitúa en el mismo nivel de confianza que
// mikrotik.js: cifras de datasheet público y arquitectura de licenciamiento documentada,
// sin SKU ni precio de lista confirmados. En consecuencia, y a propósito:
//   · hwSku = null en todos los modelos y precio = null (la página muestra "Consultar").
//     Es preferible una línea de BOM declarada "sin cotizar" —bom.js lo soporta y avisa—
//     que un SKU inventado con apariencia legítima. El catálogo ya arrastró una vez un
//     modelo inexistente (FortiGate 2000F, ver fortinet.js) y costó tres fuentes oficiales
//     desmentirlo; el modo de fallo se conoce y aquí se evita por construcción.
//   · Las cifras de `sys` (throughput de sistema) son las de portada del datasheet de
//     EdgeConnect y son las más sólidas. `ipsec`, `fw`, `boost`, `flows` y `tuns` son
//     cifras de escala para filtrar candidatos: sirven para descartar un modelo corto,
//     no para comprometer un número con el cliente.
//   · La serie 9000 (SD-Branch) se incluye porque es la respuesta de Aruba cuando el
//     requerimiento no es SD-WAN puro sino sucursal con LAN/WLAN integrados; sus cifras
//     tienen la misma advertencia.
// VERIFICAR contra el "HPE Aruba Networking EdgeConnect Enterprise Data Sheet" vigente y
// contra la lista de precios del distribuidor autorizado antes de emitir una propuesta.
//
// CAMPOS Y CÓMO INTERPRETARLOS
//   sys    Throughput del sistema en Mbps, tráfico SD-WAN sin cifrar. Cifra de portada.
//   ipsec  Throughput con los túneles IPsec del fabric activos. En EdgeConnect esta es la
//          cifra que aplica de verdad: TODO el tráfico del overlay va en túnel, no es un
//          escenario opcional como en un router donde el IPsec es un caso de uso más.
//   fw     Throughput con el firewall de zonas / segmentación aplicada.
//   boost  Techo del appliance con Boost activo (optimización WAN). Es el número más bajo
//          de la escalera y el más incomprendido — ver BOOST abajo.
//   flows  Flujos concurrentes.
//   tuns   Túneles del fabric que sostiene el equipo. Es el límite que decide si un modelo
//          sirve de HUB: un hub de 400 sucursales necesita 400+ túneles aunque le sobre
//          throughput. Ninguna cifra de Gbps anticipa este muro.
//   ifaces Interfaces físicas.
//   fam    'ec' = EdgeConnect Enterprise (SD-WAN puro, admite Boost)
//          'gw' = Gateway SD-Branch serie 9000 (sucursal con LAN/WLAN unificados, sin Boost)
const MODELS = [
  // ─── EdgeConnect Enterprise — SD-WAN con optimización WAN (Boost) ──────────
  {id:'EC-XS',  fam:'ec', seg:'Sucursal peq / Teletrabajo', sys:200,   ipsec:200,   fw:200,   boost:50,   flows:128000,  tuns:90,   ifaces:'4x GE RJ45'},
  {id:'EC-S',   fam:'ec', seg:'Sucursal',                   sys:500,   ipsec:500,   fw:500,   boost:100,  flows:256000,  tuns:250,  ifaces:'4x GE RJ45 + 2x GE SFP'},
  {id:'EC-M',   fam:'ec', seg:'Sucursal med / gde',         sys:1000,  ipsec:1000,  fw:1000,  boost:200,  flows:512000,  tuns:500,  ifaces:'6x GE RJ45 + 2x 10GE SFP+'},
  {id:'EC-L',   fam:'ec', seg:'Campus / Hub regional',      sys:2000,  ipsec:2000,  fw:2000,  boost:500,  flows:1000000, tuns:1000, ifaces:'8x GE RJ45 + 4x 10GE SFP+'},
  {id:'EC-XL',  fam:'ec', seg:'Hub / DC edge',              sys:5000,  ipsec:5000,  fw:5000,  boost:1000, flows:2000000, tuns:2000, ifaces:'4x 10GE SFP+ + 2x 25GE SFP28'},
  {id:'EC-2XL', fam:'ec', seg:'DC / Head-end de fabric',    sys:10000, ipsec:10000, fw:10000, boost:2000, flows:4000000, tuns:4000, ifaces:'8x 10GE SFP+ + 2x 25GE SFP28'},
  // EC-V: mismo software sobre VMware/KVM/Hyper-V/AWS/Azure. El throughput no lo fija el
  // hardware sino la licencia contratada y los vCPU asignados — las cifras de abajo son el
  // punto de dimensionamiento habitual (4 vCPU). Vale la pena tenerlo en el catálogo: la
  // licencia de EdgeConnect es portable entre appliance físico y virtual, lo que permite
  // empezar virtual en un DC y migrar a hardware sin recomprar la suscripción.
  {id:'EC-V',   fam:'ec', seg:'Virtual / Cloud (IaaS)',     sys:2000,  ipsec:2000,  fw:2000,  boost:500,  flows:1000000, tuns:1000, ifaces:'vNIC (según hipervisor) · 4 vCPU de referencia'},
  // ─── Gateways SD-Branch serie 9000 — sucursal con LAN/WLAN unificados ──────
  // No hacen optimización WAN (boost:null): su ventaja es otra, la convergencia del acceso
  // — el mismo equipo termina la WAN, actúa de controladora de APs y aplica Dynamic
  // Segmentation con el rol de usuario que trae el switch o el AP desde ClearPass/Central.
  {id:'Gateway 9004', fam:'gw', seg:'Sucursal peq',           sys:4000,  ipsec:1000, fw:4000,  boost:null, flows:64000,  tuns:64,   ifaces:'4x GE RJ45'},
  {id:'Gateway 9012', fam:'gw', seg:'Sucursal med',           sys:8000,  ipsec:2000, fw:8000,  boost:null, flows:128000, tuns:128,  ifaces:'12x GE RJ45'},
  {id:'Gateway 9106', fam:'gw', seg:'Sucursal gde / Campus',  sys:10000, ipsec:4000, fw:10000, boost:null, flows:256000, tuns:256,  ifaces:'4x GE RJ45 + 2x 10GE SFP+'},
  {id:'Gateway 9240', fam:'gw', seg:'Campus / Hub regional',  sys:40000, ipsec:20000,fw:40000, boost:null, flows:2000000,tuns:1024, ifaces:'4x 10GE SFP+ + 4x GE RJ45'},
];

// ── Licenciamiento EdgeConnect ───────────────────────────────────────────────
//
// DIFERENCIA ESTRUCTURAL CON FORTINET, y es la que más confunde en preventa:
// en FortiGate la licencia va atada al MODELO (cada SKU lleva el código del equipo
// embebido). En EdgeConnect la suscripción va atada al ANCHO DE BANDA del sitio, no al
// appliance. Dos sedes con el mismo EC-M pueden llevar suscripciones distintas si
// contratan caudal distinto, y subir de caudal no obliga a cambiar el hardware mientras
// el appliance dé la talla. Por eso aquí las licencias se indexan por tier de ancho de
// banda y no por modelo.
const BW_TIERS = [
  {code:'bw50',   n:'Hasta 50 Mbps',   mbps:50},
  {code:'bw100',  n:'Hasta 100 Mbps',  mbps:100},
  {code:'bw200',  n:'Hasta 200 Mbps',  mbps:200},
  {code:'bw500',  n:'Hasta 500 Mbps',  mbps:500},
  {code:'bw1g',   n:'Hasta 1 Gbps',    mbps:1000},
  {code:'bw2g',   n:'Hasta 2 Gbps',    mbps:2000},
  {code:'bw5g',   n:'Hasta 5 Gbps',    mbps:5000},
  {code:'bw10g',  n:'Hasta 10 Gbps',   mbps:10000},
  {code:'bwunl',  n:'Sin límite de caudal', mbps:null},
];

// Los dos niveles de suscripción SD-WAN. Se elige uno: Advanced incluye todo Base.
const BUNDLES = {
  base: {
    n: 'EdgeConnect Base',
    svcs: 'SD-WAN esencial: Dynamic Path Control por SLA, tunnel bonding de todos los enlaces WAN, '
      + 'Path Conditioning (FEC + corrección de orden de paquetes), firewall de zonas con estado, '
      + 'ZTP y orquestación centralizada desde EdgeConnect Orchestrator.',
  },
  advanced: {
    n: 'EdgeConnect Advanced',
    svcs: 'Todo Base + routing dinámico (BGP/OSPF), segmentación multi-overlay (VRF por intención de negocio), '
      + 'salida directa a Internet con First-packet iQ, service chaining hacia SSE/SASE de terceros, '
      + 'WAN hardening y políticas de seguridad avanzadas. Es el requisito para un despliegue con '
      + 'segmentación real o integración con un SSE (Zscaler, Netskope, Check Point).',
  },
};

// BOOST — la licencia de aceleración. Es lo más particular de Aruba y merece explicación,
// porque tiene un efecto CONTRA-INTUITIVO en el dimensionamiento:
//
//   1. BAJA el techo del appliance. Con Boost activo, el equipo procesa bastante menos que
//      su cifra de portada (columna `boost` arriba): la deduplicación y la aceleración de
//      TCP no se descargan a silicio dedicado como el cripto de un ASIC, cuestan CPU.
//   2. Pero REDUCE el tráfico que sale a la WAN. Network Memory deduplica patrones ya vistos
//      y comprime el resto, así que 100 Mbps de tráfico de aplicación pueden viajar como 40.
//
// El error de preventa es tratar solo el efecto (1) y descartar Boost por "costar
// rendimiento", o solo el (2) y prometer una reducción que el appliance no puede sostener.
// El dimensionador modela los dos a la vez.
//
// Y la característica que no tiene ningún competidor directo: Boost se licencia como un
// POOL de ancho de banda a nivel de fabric, no por sitio. Se compra un caudal agregado y
// Orchestrator lo reparte entre las sedes que lo necesitan, se puede reasignar sin tocar
// el hardware. En una red con 60 sucursales de las que solo 8 mueven ficheros pesados, se
// licencia para esas 8 y no para 60 — ahí está el argumento económico.
const BOOST = {
  n: 'EdgeConnect Boost',
  svcs: 'Optimización WAN: deduplicación Network Memory, compresión, aceleración TCP y de protocolos '
    + '(CIFS/SMB, NFS, SSL). Add-on sobre Base o Advanced, licenciado como pool de ancho de banda '
    + 'agregado del fabric y repartido por Orchestrator entre los sitios que lo necesiten.',
  // Incrementos habituales de pool. Precio null: no verificado (ver cabecera del archivo).
  pools: [
    {code:'boost100', n:'Pool 100 Mbps',  mbps:100},
    {code:'boost200', n:'Pool 200 Mbps',  mbps:200},
    {code:'boost500', n:'Pool 500 Mbps',  mbps:500},
    {code:'boost1g',  n:'Pool 1 Gbps',    mbps:1000},
    {code:'boost2g',  n:'Pool 2 Gbps',    mbps:2000},
    {code:'boost5g',  n:'Pool 5 Gbps',    mbps:5000},
  ],
  // Reducción de tráfico WAN observada según el perfil de datos. Rango conservador: HPE
  // publica casos de hasta 20:1 en réplicas de backup, pero prometer eso en una propuesta
  // sin una prueba con el tráfico real del cliente es exponerse.
  reduccion: {
    generico: {n:'Tráfico genérico mixto (web, SaaS)', factor:1.3},
    oficina:  {n:'Ficheros de oficina y correo interno', factor:2.0},
    repetido: {n:'Réplicas, backups, VDI, CIFS/SMB', factor:3.5},
  },
};

// Path Conditioning: el FEC envía paquetes de paridad para reconstruir pérdidas sin esperar
// retransmisión. Es lo que permite sustituir MPLS por banda ancha con SLA de aplicación,
// y la ventaja de conectividad más citada de EdgeConnect. Cuesta ancho de banda: hay que
// sumarlo al requerimiento, no descontarlo.
const FEC_OVERHEAD = {
  off:  {n:'Desactivado', pct:0,    d:'Enlaces limpios (MPLS dedicado, fibra sin pérdida medida).'},
  auto: {n:'Automático',  pct:0.10, d:'Orchestrator ajusta la paridad según la pérdida medida. Recomendado.'},
  alto: {n:'Agresivo',    pct:0.25, d:'Enlaces con pérdida alta o variable: LTE/5G, satelital, banda ancha residencial.'},
};

// Soporte HPE. Tech Care sustituyó a Foundation Care como oferta estándar; se mantienen los
// tres niveles equivalentes. SLA orientativos — confirmar cobertura regional y tiempos de
// RMA con HPE antes de comprometerlos.
const CARE = {
  tcbasic: {n:'HPE Pointnext Tech Care Basic',     sla:'9x5 · respuesta 2 h · repuesto NBD',
            d:'Soporte en horario laboral. Adecuado para sedes con redundancia y sin criticidad horaria.'},
  tcess:   {n:'HPE Pointnext Tech Care Essential', sla:'24x7 · respuesta 15 min · repuesto 4 h',
            d:'Estándar para producción. Acceso directo a especialista de producto sin triaje previo.'},
  tccrit:  {n:'HPE Pointnext Tech Care Critical',  sla:'24x7 · respuesta 15 min · repuesto 6 h con reparación gestionada',
            d:'Añade gestión proactiva del incidente y análisis de causa raíz. Para hubs y head-ends del fabric.'},
};

// Licencias por tier de ancho de banda. sku/precio en null a propósito: sin price list
// verificado (ver cabecera). La estructura queda lista para rellenarla cuando se disponga
// de la lista del distribuidor, sin tocar la página ni la proyección.
function tierVacio() {
  return {sku:null, y1:null, y3:null, y5:null};
}
const LICENSES = {};
for (const t of BW_TIERS) {
  LICENSES[t.code] = {
    base: tierVacio(),
    advanced: tierVacio(),
    care: {tcbasic: tierVacio(), tcess: tierVacio(), tccrit: tierVacio()},
  };
}

module.exports = {
  MODELS, BUNDLES, CARE, LICENSES, BW_TIERS, BOOST, FEC_OVERHEAD,
};
