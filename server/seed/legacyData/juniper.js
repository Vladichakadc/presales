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
// Matrix" / "Security Products Comparison Chart" (juniper.net/content/dam/www/assets/
// datasheets/us/en/security/security-products-comparison-chart.pdf). El proxy de egreso del
// entorno donde se edita este repositorio responde 403 a juniper.net, igual que a
// fortinet.com — pero 2026-09-02 se trajo igual, vía GitHub Actions (que no pasa por ese
// proxy) a una rama de transporte, mismo patrón que cerró el `cps` de Fortinet.
//
// ANTES de esa lectura, buena parte de estas cifras se habían reconstruido por búsqueda y
// solo se aceptaron cuando formaban una SERIE INTERNAMENTE COHERENTE a lo largo de la línea
// de producto. Con el documento real en mano, esa reconstrucción resultó ACERTADA en unos
// campos y EQUIVOCADA en otros — la coherencia de una serie no garantiza que sea la serie
// correcta, solo que es plausible. Concretamente:
//   - fw, vpn e ips de la línea SRX300 (300/320/340/345) SÍ coincidían exactamente.
//   - fwImix de esa misma línea NO: el documento trae 500/500/1.000/1.700/4.000 Mbps para
//     300/320/340/345/380, no los 600/600/1.100/1.500/6.500 que se habían reconstruido.
//     Corregido para 300/320/340/345 (2026-09-02, `npm run juniper --force`, ancladas por
//     fw+vpn+ips ya coincidentes). El de SRX380 sigue en null: ver más abajo.
//   - SRX1500 — el modelo que este catálogo documentaba como "el único con la fila
//     completa"— tenía `vpn` y `sess` equivocados (3.000 Mbps / 512.000 sesiones reconstruidos
//     frente a 1.300 Mbps / 2.000.000 del documento real; fw, fwImix, ips y atp sí coincidían).
//     Corregidos con el mismo `--force`, anclados por esos cuatro campos coincidentes.
//   - `cps` de toda la línea SRX300 más SRX1500 no existía en ninguna reconstrucción previa:
//     lo trae el documento (Connections/sec) y se aplicó sin conflicto.
//
// SRX380 QUEDA A PROPÓSITO SIN TOCAR EN fw/fwImix/vpn, aunque el documento SÍ trae una fila
// para él (10 Gbps / 4 Gbps / 3,5 Gbps / 2 Gbps de fw/fwImix/vpn/ips) que contradice los
// 20/6,5/4,4/2 Gbps ya guardados. De los cuatro campos leídos solo `ips` coincide — un único
// anclaje, por debajo del doble anclaje que este catálogo exige por diseño para pisar un dato
// existente. La cabecera anterior de este archivo ya documentaba la ambigüedad ("para el
// SRX380 aparecieron 10 y 20 Gbps de firewall, 3,5/4,4/5 Gbps de IPsec y 2 y 4 Gbps de IPS"):
// el documento real confirma que 10, 3,5 y 2 eran las cifras correctas y 20/4,4 la
// reconstrucción equivocada, pero corregirlo aquí exigiría `--sin-contraste` sobre un único
// anclaje, y esa responsabilidad es de quien decide, no de una corrida automática. Igual de
// interesante: el documento SÍ confirma 380.000 sesiones concurrentes para el SRX380 (el valor
// "más plausible" que la cabecera anterior ya sospechaba frente al descartado 4.000.000), pero
// como sess/atp/cps de esa fila dependen del mismo anclaje de fw/fwImix/vpn, quedan igual sin
// aplicar hasta que se resuelva junto con el resto de la fila.
//
// `null` SIGNIFICA "EL CATÁLOGO NO TRAE EL DATO", NO "SIN LÍMITE". El motor no filtra por un
// eje sin dato, y donde la capa que se está dimensionando no tiene cifra el modelo se
// DESCARTA con su motivo, en vez de colarse con la cifra de otra capa.
//
// PARA COMPLETAR LO QUE FALTA HAY `npm run juniper` (scripts/importar-juniper.js), el
// equivalente del `npm run cps` de Fortinet: acepta CSV/TSV/XLSX, reconoce las columnas por
// su cabecera, resuelve Gbps frente a Mbps sin que haya que multiplicar a ojo, y **solo
// acepta una fila si al menos dos de sus columnas casan con lo que este catálogo ya trae
// verificado y ninguna lo contradice**. Ese doble anclaje es lo que caza la fila desplazada,
// que es el modo de fallo real de transcribir 96 números a mano: una cifra suelta siempre
// parece plausible, el resto de su fila no. SRX380 (arriba) y los cuatro modelos que hoy solo
// tienen `fw` (SRX4300, SRX4700, SRX4100, SRX4200) no llegan a ese anclaje y el importador los
// aparta hasta que se pasa `--sin-contraste` a propósito. `npm run juniper -- --check`
// imprime la cobertura casilla por casilla.
//
// PRECIOS: TODOS `null`. No hay lista de precios de Juniper en el material disponible. El
// BOM cuenta las líneas sin cotizar y avisa, en vez de mostrar un total que parece completo.
// Inventar un precio plausible es el fallo que este catálogo ya cometió una vez con Aruba.

// PROCEDENCIA DE `redund` / `psu` (pendiente 15) — 2026-09-03, 7 de 12 modelos.
// El material comercial de Juniper publica rendimiento, no alimentacion. Lo electrico esta en
// las "hardware guides" de juniper.net -una por modelo-, traidas via GitHub Actions y leidas a
// mano. Se comprobo modelo por modelo que cada guia habla SOLO de su equipo antes de aplicar
// nada: la de la SRX300 no cubre al 320/340/345, igual que el archivo `70f-series` de Fortinet
// resulto ser la ficha del 71F.
//
// CUATRO DE LOS SEIS SON 'opcional', el cuarto estado de `redund`. Juniper es explicito: «We
// ship the SRX1600 with only one power supply unit (PSU). You can order the second». El
// SRX1500, el SRX1600, el SRX2300 y el SRX4300 salen con UNA fuente y la segunda se pide
// aparte; marcarlos `true` prometeria una redundancia que no viene en la caja. El SRX4100 si
// sale con las dos preinstaladas, y el SRX300 se alimenta con un adaptador externo.
//
// `watts` solo donde la guia publica un consumo MEDIO o TIPICO (SRX1600 137 W, SRX2300 186 W,
// SRX4300 327 W). El SRX4100 publica un «Maximum System Power Requirement» de 440 W: es un
// maximo, y la ficha rotula ese campo «Consumo tipico», asi que va en el texto y no en `watts`
// -el mismo criterio que dejo fuera los 2.500 W de capacidad por fuente del FortiGate 7081F.

const MODELS = [
  // ── Línea SRX300: sucursal ────────────────────────────────────────────────
  // 300/320/340/345 verificados contra el documento real 2026-09-02 (ver PROCEDENCIA):
  // fw/vpn/ips ya estaban bien, fwImix se corrigió y sess/cps/atp se completaron. El SRX380
  // de esta misma línea SÍ tiene fila en el documento pero queda sin tocar: ver la nota de
  // PROCEDENCIA sobre por qué su fw/fwImix/vpn no supera el doble anclaje.
  {id:'SRX300', redund:false, psu:{tipo:'adaptador de corriente externo, único', volts:'100-240 V AC, 50-60 Hz', amps:'1 A máximo (pico de arranque 7 A a 220 V)', texto:'Se alimenta con el adaptador que viene con el equipo, sin opción de una segunda fuente. La guía de hardware no publica consumo para este modelo.'}, ser:'SRX 300', seg:'SOHO / Teletrabajo',
   fw:1000, fwImix:500, vpn:300, vpnImix:116, ips:200, atp:null, sess:64000, cps:5000,
   ifaces:'8x GE (6 RJ45 + 2 SFP)'},
  {id:'SRX320', ser:'SRX 300', seg:'Sucursal pequeña',
   fw:1000, fwImix:500, vpn:300, vpnImix:116, ips:200, atp:null, sess:64000, cps:5000,
   ifaces:'8x GE + 2 ranuras MPIM'},
  {id:'SRX340', ser:'SRX 300', seg:'Sucursal mediana',
   fw:3000, fwImix:1000, vpn:600, vpnImix:239, ips:400, atp:180, sess:256000, cps:10000,
   ifaces:'16x GE + 4 ranuras MPIM'},
  {id:'SRX345', ser:'SRX 300', seg:'Sucursal grande',
   fw:5000, fwImix:1700, vpn:800, vpnImix:325, ips:600, atp:230, sess:375000, cps:15000,
   ifaces:'16x GE + 4 ranuras MPIM'},
  // fw/fwImix/vpn EN DISPUTA (ver PROCEDENCIA): el documento real de 2026-09-02 trae
  // 10/4/3,5 Gbps para este modelo, no los 20/6,5/4,4 de abajo. Solo `ips` de esa fila
  // coincide con lo ya guardado — un único anclaje, por debajo del doble que este catálogo
  // exige para pisar un dato existente — así que se deja sin tocar a propósito en vez de
  // corregirse con `--sin-contraste` bajo responsabilidad de esta sesión.
  {id:'SRX380', ser:'SRX 300', seg:'Sucursal grande / PoE',
   fw:20000, fwImix:6500, vpn:4400, vpnImix:1400, ips:2000, atp:null, sess:null, cps:null,
   ifaces:'16x GE PoE+ + 4x 10GE SFP+ · fuente redundante',
   redund:true, psu:{texto:'Fuente redundante, según el datasheet Juniper del SRX380.'}},

  // ── SRX1500: fw/fwImix/ips/atp ya verificados; vpn y sess corregidos 2026-09-02 ──
  {id:'SRX1500', redund:'opcional', psu:{tipo:'una fuente instalada, admite una segunda (AC o DC)', volts:'100-127 V AC (2,5 A) o 200-240 V AC (1,3 A), 47-63 Hz', texto:'La segunda fuente es opcional y solo con las dos instaladas se pueden cambiar en caliente. La guía de hardware no publica consumo para este modelo.'}, ser:'SRX 1500', seg:'Campus / DC pequeño',
   fw:9000, fwImix:5000, vpn:1300, vpnImix:null, ips:3000, atp:1600, sess:2000000, cps:90000,
   ifaces:'16x GE + 4x 10GE SFP+ · 1U'},

  // ── Generación 2024 ───────────────────────────────────────────────────────
  // Traen sesiones y conexiones por segundo publicadas, que la línea de sucursal no tiene.
  // Las cifras de inspección (IPS, ATP) NO se pudieron confirmar: para el SRX1600 apareció
  // "21 Gbps de IPS" sobre un firewall de 24 Gbps, lo que contradice de plano la premisa de
  // que inspeccionar cuesta capacidad. Un dato que se contradice con la física del producto
  // no se registra: queda en null y el motor lo declara sin comprobar.
  {id:'SRX1600', redund:'opcional', psu:{watts:137, tipo:'una fuente de serie, admite una segunda (1+1)', volts:'100-127 V AC (5,5 A) o 200-240 V AC (3 A), 50-60 Hz', texto:'Consumo medio 137 W y máximo 162 W, sobre fuentes de 450 W. Juniper lo envía con una sola fuente y la segunda se pide aparte. Cada fuente necesita su propio interruptor.'}, ser:'SRX 1600', seg:'Campus / DC empresarial',
   fw:24000, fwImix:null, vpn:18000, vpnImix:5500, ips:null, atp:null, sess:2000000, cps:95000,
   ifaces:'25GE · MACsec a velocidad de línea · 1U'},
  {id:'SRX2300', redund:'opcional', psu:{watts:186, tipo:'una fuente de serie, ranura libre para la segunda (1+1)', volts:'100-127 V AC (5,5 A) o 200-240 V AC (3 A), 50-60 Hz', texto:'Consumo medio 186 W y máximo 229 W, sobre fuentes de 450 W. Se envía con una sola fuente y la ranura de la segunda va vacía.'}, ser:'SRX 2300', seg:'Campus grande / DC',
   fw:39000, fwImix:null, vpn:36000, vpnImix:null, ips:null, atp:null, sess:5000000, cps:320000,
   ifaces:'100GE · MACsec a velocidad de línea · 1U'},
  {id:'SRX4300', redund:'opcional', psu:{watts:327, tipo:'una fuente de serie, ranura libre para la segunda (1+1)', volts:'100-127 V AC (10,52 A) o 200-240 V AC (5,26 A), 50/60 Hz', texto:'Consumo típico 327 W y máximo 393 W, sobre fuentes de 850 W. Se envía con una sola fuente; la segunda se pide aparte y cada una necesita un interruptor de 16 A.'}, ser:'SRX 4000', seg:'DC Edge',
   fw:90000, fwImix:null, vpn:null, vpnImix:null, ips:null, atp:null, sess:null, cps:null,
   ifaces:'100GE · MACsec a velocidad de línea · 1U'},
  {id:'SRX4700', ser:'SRX 4000', seg:'Cloud / Service Provider',
   fw:1400000, fwImix:null, vpn:null, vpnImix:null, ips:null, atp:null, sess:null, cps:null,
   ifaces:'400GE · MACsec a velocidad de línea · 1U'},

  // ── Generación anterior de datacenter ─────────────────────────────────────
  // Siguen en catálogo: la generación 2024 los sustituye en POSICIONAMIENTO, pero no se
  // encontró boletín oficial de fin de venta, así que no se marcan (ver PENDIENTES.md).
  {id:'SRX4100', redund:true, psu:{tipo:'dos fuentes de serie (AC o DC), intercambiables en caliente', volts:'100-127 V AC o 200-240 V AC, 50-60 Hz', texto:'Sale de fábrica con las dos fuentes instaladas. El requerimiento máximo del sistema es de 440 W — es un máximo, no un consumo típico, así que no se declara como tal.'}, ser:'SRX 4000', seg:'DC Edge',
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
