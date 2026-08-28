// Catálogo Juniper para el dimensionador. Verificado contra material oficial de Juniper
// (agosto 2026) — ver PROCEDENCIA más abajo, que es lo que hay que leer antes de tocar una
// cifra.
//
// LAS TRES BASES DE MEDICIÓN, Y POR QUÉ IMPORTAN TANTO COMO EN FORTINET
// Juniper publica el rendimiento de firewall de la línea SRX en más de una base, y la que
// aparece en la portada NO es la que sirve para dimensionar:
//
//   fw       Firewall throughput con PAQUETES GRANDES. Es la cifra de "up to" del material
//            comercial, medida en el mejor caso posible. No representa tráfico real.
//   fwImix   Firewall throughput con IMIX (mezcla de tamaños de paquete parecida al tráfico
//            de verdad). En la línea de sucursal es entre 1,7x y 3x MENOR que la anterior.
//   vpn      IPsec VPN con paquetes grandes; `vpnImix`, el mismo con IMIX.
//   ips      IPS throughput — el motor de inspección de intrusiones.
//   atp      Threat Prevention / ATP Cloud — el stack completo. Es el número realista de una
//            sucursal con seguridad avanzada activa.
//
// El salto es del mismo orden que el fw -> tp de FortiGate: el SRX380 pasa de 20 Gbps de
// portada a 6,5 Gbps en IMIX y a 2 Gbps con IPS. Un factor 10 entre la cifra que se cita en
// una reunión y la que aguanta el equipo. Ese es exactamente el error de preventa que la
// auditoría del dimensionador FortiGate documentó, y por eso este catálogo separa las bases
// en campos distintos en vez de guardar "la cifra de firewall".
//
// PROCEDENCIA Y CÓMO SE ACEPTÓ CADA NÚMERO
// El documento que lo trae todo junto es la "SRX Series and vSRX Performance and Features
// Matrix" (juniper.net/content/dam/www/assets/datasheets/us/en/security/
// security-products-comparison-chart.pdf). NO es accesible desde el entorno donde se edita
// este repositorio: el proxy de egreso responde 403 a juniper.net, igual que a fortinet.com.
// Así que estas cifras se reconstruyeron por búsqueda y solo se aceptaron cuando formaban
// una SERIE INTERNAMENTE COHERENTE a lo largo de la línea de producto — que es lo que
// distingue una fila de tabla auténtica de un número suelto mal copiado.
//
// Ejemplo de por qué hace falta ese filtro: para el SRX380 aparecieron 10 y 20 Gbps de
// firewall, 3,5 / 4,4 / 5 Gbps de IPsec y 2 y 4 Gbps de IPS, todos presentados como "la"
// cifra. La serie IMIX (600 / 600 / 1.100 / 1.500 / 6.500 Mbps) y la de IPS
// (200 / 200 / 400 / 600 / 2.000 Mbps) son monótonas y proporcionadas a lo largo de los
// cinco modelos: son tabla. Los valores sueltos que no encajan en ninguna serie quedaron
// fuera, y donde no hubo serie el campo quedó en `null`.
//
// `null` SIGNIFICA "EL CATÁLOGO NO TRAE EL DATO", NO "SIN LÍMITE". El motor no filtra por un
// eje sin dato, y donde la capa que se está dimensionando no tiene cifra el modelo se
// DESCARTA con su motivo, en vez de colarse con la cifra de otra capa.
//
// PARA COMPLETARLO HAY `npm run juniper` (scripts/importar-juniper.js), el equivalente del
// `npm run cps` de Fortinet: se corre desde una máquina con acceso a la matriz, acepta
// CSV/TSV/XLSX, reconoce las columnas por su cabecera, resuelve Gbps frente a Mbps sin que
// haya que multiplicar a ojo, y **solo acepta una fila si al menos dos de sus columnas casan
// con lo que este catálogo ya trae verificado y ninguna lo contradice**. Ese doble anclaje
// es lo que caza la fila desplazada, que es el modo de fallo real de transcribir 96 números
// a mano: una cifra suelta siempre parece plausible, el resto de su fila no. Los cuatro
// modelos que hoy solo tienen `fw` (SRX4300, SRX4700, SRX4100, SRX4200) no llegan a ese
// anclaje y el importador los aparta hasta que se pasa `--sin-contraste` a propósito.
// `npm run juniper -- --check` imprime la cobertura casilla por casilla.
//
// PRECIOS: TODOS `null`. No hay lista de precios de Juniper en el material disponible. El
// BOM cuenta las líneas sin cotizar y avisa, en vez de mostrar un total que parece completo.
// Inventar un precio plausible es el fallo que este catálogo ya cometió una vez con Aruba.

const MODELS = [
  // ── Línea SRX300: sucursal ────────────────────────────────────────────────
  // Serie completa y coherente en las cuatro bases. Sesiones concurrentes sin confirmar:
  // para el SRX380 aparecieron 380.000 y 4.000.000, y 4 M en una caja de sucursal es
  // implausible frente a los 512.000 del SRX1500, que es muy superior. Quedan en null.
  {id:'SRX300', ser:'SRX 300', seg:'SOHO / Teletrabajo',
   fw:1000, fwImix:600, vpn:300, vpnImix:116, ips:200, atp:null, sess:null, cps:null,
   ifaces:'8x GE (6 RJ45 + 2 SFP)'},
  {id:'SRX320', ser:'SRX 300', seg:'Sucursal pequeña',
   fw:1000, fwImix:600, vpn:300, vpnImix:116, ips:200, atp:null, sess:null, cps:null,
   ifaces:'8x GE + 2 ranuras MPIM'},
  {id:'SRX340', ser:'SRX 300', seg:'Sucursal mediana',
   fw:3000, fwImix:1100, vpn:600, vpnImix:239, ips:400, atp:null, sess:null, cps:null,
   ifaces:'16x GE + 4 ranuras MPIM'},
  {id:'SRX345', ser:'SRX 300', seg:'Sucursal grande',
   fw:5000, fwImix:1500, vpn:800, vpnImix:325, ips:600, atp:null, sess:null, cps:null,
   ifaces:'16x GE + 4 ranuras MPIM'},
  {id:'SRX380', ser:'SRX 300', seg:'Sucursal grande / PoE',
   fw:20000, fwImix:6500, vpn:4400, vpnImix:1400, ips:2000, atp:null, sess:null, cps:null,
   ifaces:'16x GE PoE+ + 4x 10GE SFP+ · fuente redundante',
   redund:true, psu:{texto:'Fuente redundante, según el datasheet Juniper del SRX380.'}},

  // ── SRX1500: el único modelo con la fila completa, ATP incluida ────────────
  {id:'SRX1500', ser:'SRX 1500', seg:'Campus / DC pequeño',
   fw:9000, fwImix:5000, vpn:3000, vpnImix:null, ips:3000, atp:1600, sess:512000, cps:null,
   ifaces:'16x GE + 4x 10GE SFP+ · 1U'},

  // ── Generación 2024 ───────────────────────────────────────────────────────
  // Traen sesiones y conexiones por segundo publicadas, que la línea de sucursal no tiene.
  // Las cifras de inspección (IPS, ATP) NO se pudieron confirmar: para el SRX1600 apareció
  // "21 Gbps de IPS" sobre un firewall de 24 Gbps, lo que contradice de plano la premisa de
  // que inspeccionar cuesta capacidad. Un dato que se contradice con la física del producto
  // no se registra: queda en null y el motor lo declara sin comprobar.
  {id:'SRX1600', ser:'SRX 1600', seg:'Campus / DC empresarial',
   fw:24000, fwImix:null, vpn:18000, vpnImix:5500, ips:null, atp:null, sess:2000000, cps:95000,
   ifaces:'25GE · MACsec a velocidad de línea · 1U'},
  {id:'SRX2300', ser:'SRX 2300', seg:'Campus grande / DC',
   fw:39000, fwImix:null, vpn:36000, vpnImix:null, ips:null, atp:null, sess:5000000, cps:320000,
   ifaces:'100GE · MACsec a velocidad de línea · 1U'},
  {id:'SRX4300', ser:'SRX 4000', seg:'DC Edge',
   fw:90000, fwImix:null, vpn:null, vpnImix:null, ips:null, atp:null, sess:null, cps:null,
   ifaces:'100GE · MACsec a velocidad de línea · 1U'},
  {id:'SRX4700', ser:'SRX 4000', seg:'Cloud / Service Provider',
   fw:1400000, fwImix:null, vpn:null, vpnImix:null, ips:null, atp:null, sess:null, cps:null,
   ifaces:'400GE · MACsec a velocidad de línea · 1U'},

  // ── Generación anterior de datacenter ─────────────────────────────────────
  // Siguen en catálogo: la generación 2024 los sustituye en POSICIONAMIENTO, pero no se
  // encontró boletín oficial de fin de venta, así que no se marcan (ver PENDIENTES.md).
  {id:'SRX4100', ser:'SRX 4000', seg:'DC Edge',
   fw:40000, fwImix:null, vpn:null, vpnImix:null, ips:null, atp:null, sess:null, cps:null,
   ifaces:'8x 10GE + 2x 40GE'},
  {id:'SRX4200', ser:'SRX 4000', seg:'DC Edge grande',
   fw:80000, fwImix:null, vpn:null, vpnImix:null, ips:null, atp:null, sess:null, cps:null,
   ifaces:'16x 10GE + 4x 40GE'},
];

// Session Smart Router: la respuesta SD-WAN vigente de Juniper. Se dimensiona por una sola
// cifra de throughput, no por capas de inspección, porque NO es un firewall: enruta por
// sesión sin túneles y la seguridad avanzada, si hace falta, va en un SRX aparte. Por eso
// vive en su propia lista y el motor lo trata como un modo distinto en vez de mezclarlo en
// la misma comparación — que es justo el error que se corrigió en el dimensionador de Cisco.
const SDWAN = [
  {id:'SSR120',  ser:'SSR 100',  seg:'Sucursal pequeña',        cap:1500,  ifaces:'GE'},
  {id:'SSR130',  ser:'SSR 100',  seg:'Sucursal mediana',        cap:2000,  ifaces:'GE a velocidad de línea'},
  {id:'SSR1200', ser:'SSR 1000', seg:'Sucursal grande / DC peq', cap:10000, ifaces:'GE / 10GE'},
  {id:'SSR1300', ser:'SSR 1000', seg:'DC / Campus mediano',     cap:20000, ifaces:'10GE en NIC'},
  {id:'SSR1400', ser:'SSR 1000', seg:'DC / Campus grande',      cap:40000, ifaces:'10/25GE en NIC'},
];

// Suscripciones de seguridad. Los nombres de los niveles están verificados; el contenido
// exacto de Advanced 1/2 no se pudo confirmar servicio por servicio y se declara como tal
// en vez de repartir funciones a ojo. Sin SKU ni precio: no hay lista de precios.
const BUNDLES = {
  adv1: {n:'Advanced 1', svcs:'Controles de nueva generación de nivel de entrada. El desglose exacto por servicio no está confirmado en el material consultado — verificar en la lista de precios antes de cotizar.'},
  adv2: {n:'Advanced 2', svcs:'Añade capacidades sobre Advanced 1. Desglose exacto sin confirmar.'},
  pre1: {n:'Premium 1',  svcs:'Incorpora ATP Cloud y capacidades de amenaza avanzada sobre los niveles Advanced. Desglose exacto sin confirmar.'},
  pre2: {n:'Premium 2',  svcs:'AppSecure (visibilidad y control de aplicaciones), IPS, AI-Predictive Threat Prevention, antivirus avanzado, Security Intelligence, URL Filtering, ATP Cloud, DNS Security, Encrypted Traffic Insights y Advanced Threat Profiling.'},
};

// Soporte. Juniper Care existe como programa, pero los nombres y el alcance de cada nivel no
// se pudieron verificar contra material oficial desde este entorno. Se deja un único nivel
// declarado como "sin verificar" antes que inventar una tabla de SLA: una cifra de SLA
// inventada en una herramienta de preventa es peor que no tenerla.
const CARE = {
  jcare: {n:'Juniper Care', sla:'Niveles y SLA sin verificar — confirmar con el distribuidor antes de cotizar.'},
};

module.exports = { MODELS, SDWAN, BUNDLES, CARE };
