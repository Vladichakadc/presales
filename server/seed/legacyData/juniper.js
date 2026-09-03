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
// LA GENERACIÓN 2024, Y EL MÉTODO DE MEDIDA QUE LO EXPLICABA TODO (2026-09-03)
// SRX1600, SRX2300 y SRX4300 se habían quedado solo con `fw` porque la matriz de 2020 no
// alcanza esa generación. Sus fichas POR MODELO sí las publican, y traídas vía Actions
// completaron fwImix, ips y atp en los tres.
//
// Y de paso resolvieron el enigma que esta cabecera llevaba anotado como dato imposible: el
// «21 Gbps de IPS sobre un firewall de 24 Gbps» del SRX1600, que parecía contradecir que
// inspeccionar cueste capacidad. No lo contradecía: **son dos métodos de medida distintos**,
// y la propia ficha los define al pie —
//   #TPS Method: Throughput performance of average HTTP sessions
//   **CPS Method: Short-lived sessions
// El SRX1600 da 19 Gbps de NGFW por TPS y 4,5 por CPS. Las dos cifras son reales; miden cosas
// distintas. **Se transcribe SIEMPRE el método CPS**, y no por prudencia sino porque es el
// único en el que Juniper publica también las capas profundas: «Secure Web Access Firewall» y
// «Advanced Threat» vienen solo en CPS. Mezclar los dos daría una escalera que no compara.
//
// El mapeo a los campos de este catálogo sale de las notas al pie de la propia ficha:
//   ips  <- «Next-generation firewall»  (nota 3: firewall + application security + IPS)
//   atp  <- «Advanced Threat»           (nota 5: lo anterior + SecIntel + URL filtering +
//                                        malware protection) — el stack completo
// Comprobación de coherencia que pasaron los tres: fw > fwImix > ips > atp, monótona.
//
// ANCLAJE: los tres entraron por campos que YA coincidían — SRX1600 (fw 24, vpn 18, sess 2M),
// SRX2300 (fw 39, vpn 36, sess 5M). El SRX4300 no tenía con qué anclar (solo traía `fw`), pero
// aquí el doble anclaje no aplica igual: **es una ficha de UN SOLO MODELO, no una matriz**, y
// el modo de fallo que ese anclaje protege —la fila desplazada— no existe cuando el documento
// no tiene filas de otros equipos. Se comprobó igualmente la identidad del documento por tres
// sitios (banda de cabecera, columna de la tabla y título de la Tabla 1), que es la lección
// del `fortigate-70f-series.pdf` que resultó ser la ficha del 71F.
//
// LO QUE NO SE TOCÓ, Y ES DELIBERADO. Las fichas contradicen cuatro valores ya guardados:
// `vpnImix` y `cps` del SRX1600 (5.500 y 95.000 frente a 8.000 y 170.000), `cps` del SRX2300
// (320.000 frente a 450.000) y `fw` del SRX4300 (90.000 frente a 98.000). Pisar un dato
// existente es decisión de quien lleva el catálogo, igual que en el SRX380 — y lo que hace que
// puedan esperar es que **los cuatro están fuera de la escala de dimensionamiento**: `fw` está
// deliberadamente fuera de `CAPAS`, y ni `vpnImix` ni `cps` filtran en la página Juniper.
// `sess`, que sí filtra, coincide en los tres modelos. Ver PENDIENTES.md, sección «Conflictos
// abiertos».
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

// PROCEDENCIA DE `redund` / `psu` (pendiente 15) — 2026-09-03, los 12 de 12 modelos.
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
//
// SEGUNDA TANDA, 2026-09-03: los cinco que faltaban (SRX320, SRX340, SRX345, SRX4200 y
// SRX4700), con sus cinco guias de hardware traidas por el mismo camino. No cambian la regla,
// pero anaden dos casos que merecen quedar escritos:
//
//   - El SRX345 es el quinto 'opcional': se vende con una fuente o con dos (RE-SRX345-DUAL-AC),
//     y con las dos instaladas la que queda asume la carga sin interrupcion. El SRX340, en
//     cambio, es `false` duro: su fuente va FIJA en el chasis, no es reemplazable en campo y
//     tiene una sola entrada AC. Dos modelos consecutivos de la misma serie, respuestas
//     opuestas: por eso esto se lee modelo por modelo y no se deduce de la gama.
//   - El SRX320 se queda SIN `watts` aunque su guia si publique consumo medio, porque publica
//     DOS: 46 W el modelo sin PoE y 221 W el modelo PoE, un factor 4,8. Este catalogo tiene una
//     sola entrada 'SRX320', asi que elegir una de las dos cifras seria correcto para la mitad
//     de los pedidos y falso para la otra mitad. Las dos van en el texto y `watts` queda vacio:
//     el mismo tercer estado que protege a `redund` y a las fuentes sin fecha.
//
// SRX4200 y SRX4700 son `true` sin matices -«shipped with two AC or two DC power supply units
// preinstalled» y «ships with two AC or two DC PSUs (1+1 redundancy) preinstalled»-, y ninguno
// de los dos lleva `watts`: los 650 W y los 2200 W que publican son capacidad POR FUENTE, no
// consumo, y sus tablas ambientales no traen ni consumo medio ni disipacion.
//
// FIN DE VENTA (pendiente 8) — 2026-09-03, de la tabla oficial «SRX Series Hardware Dates &
// Milestones» (support.juniper.net/support/eol/product/srx_series/), traida por el mismo
// camino. De los 12 modelos, exactamente DOS tienen fin de venta del propio equipo: el SRX1500
// (TSB101240) y el SRX4100 (TSB101895), ambos con ultimo pedido el 2026-04-15 -ya vencido- y
// soporte hasta 2031-04-15. Se marcan con `eolAnnounced` y `FICHA.rango()` los degrada solo,
// sin que nadie tenga que volver a editar el catalogo.
//
// LO QUE COSTO TRABAJO FUE NO MARCAR DE MAS. Esa tabla mezcla en las mismas filas el fin de
// vida de PAQUETES DE SOFTWARE (S-SRX1500DP-A1-7 y companyia, «7-year security software
// bundles») con el del hardware, y varios modelos aparecen solo por ahi. Retirar un paquete de
// licencias no retira el equipo: aplicar esas filas habria sacado de la recomendacion a
// aparatos que Juniper sigue vendiendo. El criterio que se uso es el SKU: solo cuenta la fila
// que lista el chasis o el sistema del propio modelo -SRX1500-CHAS, SRX1500-SYS-JB-AC,
// SRX4100-CHAS, SRX4100-SYS-JB-AC-, y con ese filtro los 12 modelos dan exactamente 2. El
// SRX4200 es el caso que mejor lo ilustra: SI aparece en la tabla, pero su unica fila es la del
// kit de rack SRX4200-RMK2, y un accesorio retirado no retira el equipo.
//
// `sucesor` va VACIO en los dos. El SRX1600 y el SRX4300 son los reemplazos evidentes por
// posicionamiento, pero la tabla de hitos no nombra ninguno, y «evidente» es exactamente como
// entro el FortiGate 2000F inexistente que este catalogo ya sufrio. La ficha ya dice «el
// boletin no nombra un PID de reemplazo directo» cuando el campo falta.

const MODELS = [
  // ── Línea SRX300: sucursal ────────────────────────────────────────────────
  // 300/320/340/345 verificados contra el documento real 2026-09-02 (ver PROCEDENCIA):
  // fw/vpn/ips ya estaban bien, fwImix se corrigió y sess/cps/atp se completaron. El SRX380
  // de esta misma línea SÍ tiene fila en el documento pero queda sin tocar: ver la nota de
  // PROCEDENCIA sobre por qué su fw/fwImix/vpn no supera el doble anclaje.
  {id:'SRX300', redund:false, psu:{tipo:'adaptador de corriente externo, único', volts:'100-240 V AC, 50-60 Hz', amps:'1 A máximo (pico de arranque 7 A a 220 V)', texto:'Se alimenta con el adaptador que viene con el equipo, sin opción de una segunda fuente. La guía de hardware no publica consumo para este modelo.'}, ser:'SRX 300', seg:'SOHO / Teletrabajo',
   fw:1000, fwImix:500, vpn:300, vpnImix:116, ips:200, atp:null, sess:64000, cps:5000,
   ifaces:'8x GE (6 RJ45 + 2 SFP)'},
  {id:'SRX320', redund:false, psu:{tipo:'adaptador de corriente externo, único', volts:'100-240 V AC, 50-60 Hz', amps:'1,3 A máximo (modelo sin PoE) o 3,25 A (modelo PoE)', texto:'Adaptador externo, sin opción de una segunda fuente. La guía publica dos consumos medios según la variante — 46 W sin PoE y 221 W con PoE — y como este catálogo tiene una sola entrada SRX320 no se declara ninguno como el consumo típico del modelo.'}, ser:'SRX 300', seg:'Sucursal pequeña',
   fw:1000, fwImix:500, vpn:300, vpnImix:116, ips:200, atp:null, sess:64000, cps:5000,
   ifaces:'8x GE + 2 ranuras MPIM'},
  {id:'SRX340', redund:false, psu:{watts:122, tipo:'fuente interna fija, única, no reemplazable en campo', volts:'100-240 V AC, 50-60 Hz, 1 a 1,5 A', texto:'Consumo medio 122 W. La fuente va fija en el chasis con una sola entrada AC, así que no admite una segunda.'}, ser:'SRX 300', seg:'Sucursal mediana',
   fw:3000, fwImix:1000, vpn:600, vpnImix:239, ips:400, atp:180, sess:256000, cps:10000,
   ifaces:'16x GE + 4 ranuras MPIM'},
  {id:'SRX345', redund:'opcional', psu:{watts:122, tipo:'una fuente AC de serie, admite dos (RE-SRX345-DUAL-AC)', volts:'100-240 V AC, 50-60 Hz, 1 a 1,5 A', texto:'Consumo medio 122 W. Se vende con una sola fuente o con dos; con las dos instaladas, si una falla la otra asume la carga sin interrupción.'}, ser:'SRX 300', seg:'Sucursal grande',
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
   eolAnnounced:{pid:'SRX1500-SYS-JB-AC', lastOrder:'2026-04-15', url:'https://supportportal.juniper.net/s/article/End-Of-Life-Notification-SRX1500-Transform'},
   ifaces:'16x GE + 4x 10GE SFP+ · 1U'},

  // ── Generación 2024 ───────────────────────────────────────────────────────
  // Traen sesiones y conexiones por segundo publicadas, que la línea de sucursal no tiene.
  // Las cifras de inspección (IPS, ATP) NO se pudieron confirmar: para el SRX1600 apareció
  // "21 Gbps de IPS" sobre un firewall de 24 Gbps, lo que contradice de plano la premisa de
  // que inspeccionar cuesta capacidad. Un dato que se contradice con la física del producto
  // no se registra: queda en null y el motor lo declara sin comprobar.
  {id:'SRX1600', redund:'opcional', psu:{watts:137, tipo:'una fuente de serie, admite una segunda (1+1)', volts:'100-127 V AC (5,5 A) o 200-240 V AC (3 A), 50-60 Hz', texto:'Consumo medio 137 W y máximo 162 W, sobre fuentes de 450 W. Juniper lo envía con una sola fuente y la segunda se pide aparte. Cada fuente necesita su propio interruptor.'}, ser:'SRX 1600', seg:'Campus / DC empresarial',
   fw:24000, fwImix:12000, vpn:18000, vpnImix:5500, ips:4500, atp:2000, sess:2000000, cps:95000,
   ifaces:'25GE · MACsec a velocidad de línea · 1U'},
  {id:'SRX2300', redund:'opcional', psu:{watts:186, tipo:'una fuente de serie, ranura libre para la segunda (1+1)', volts:'100-127 V AC (5,5 A) o 200-240 V AC (3 A), 50-60 Hz', texto:'Consumo medio 186 W y máximo 229 W, sobre fuentes de 450 W. Se envía con una sola fuente y la ranura de la segunda va vacía.'}, ser:'SRX 2300', seg:'Campus grande / DC',
   fw:39000, fwImix:28000, vpn:36000, vpnImix:18000, ips:12000, atp:6000, sess:5000000, cps:320000,
   ifaces:'100GE · MACsec a velocidad de línea · 1U'},
  {id:'SRX4300', redund:'opcional', psu:{watts:327, tipo:'una fuente de serie, ranura libre para la segunda (1+1)', volts:'100-127 V AC (10,52 A) o 200-240 V AC (5,26 A), 50/60 Hz', texto:'Consumo típico 327 W y máximo 393 W, sobre fuentes de 850 W. Se envía con una sola fuente; la segunda se pide aparte y cada una necesita un interruptor de 16 A.'}, ser:'SRX 4000', seg:'DC Edge',
   fw:90000, fwImix:70000, vpn:94000, vpnImix:40000, ips:24000, atp:11000, sess:10000000, cps:800000,
   ifaces:'100GE · MACsec a velocidad de línea · 1U'},
  {id:'SRX4700', redund:true, psu:{tipo:'dos fuentes de serie (AC o DC) preinstaladas en 1+1', texto:'Sale de fábrica con las dos fuentes en las ranuras 0 y 1, intercambiables en caliente, y cada una necesita su propia alimentación e interruptor (se recomienda 16 A). Las fuentes son de 2200 W — es capacidad, no consumo, y la guía no publica un consumo típico.'}, ser:'SRX 4000', seg:'Cloud / Service Provider',
   fw:1400000, fwImix:null, vpn:null, vpnImix:null, ips:null, atp:null, sess:null, cps:null,
   ifaces:'400GE · MACsec a velocidad de línea · 1U'},

  // ── Generación anterior de datacenter ─────────────────────────────────────
  // El SRX4100 SÍ tiene boletín (TSB101895) y queda marcado abajo. El SRX4200 no: en la
  // tabla oficial de hitos su única fila es la del kit de rack SRX4200-RMK2, no el equipo,
  // y un accesorio retirado no retira el chasis — así que se deja sin marcar a propósito.
  {id:'SRX4100', redund:true, psu:{tipo:'dos fuentes de serie (AC o DC), intercambiables en caliente', volts:'100-127 V AC o 200-240 V AC, 50-60 Hz', texto:'Sale de fábrica con las dos fuentes instaladas. El requerimiento máximo del sistema es de 440 W — es un máximo, no un consumo típico, así que no se declara como tal.'}, ser:'SRX 4000', seg:'DC Edge',
   fw:40000, fwImix:null, vpn:null, vpnImix:null, ips:null, atp:null, sess:null, cps:null,
   eolAnnounced:{pid:'SRX4100-SYS-JB-AC', lastOrder:'2026-04-15', url:'https://supportportal.juniper.net/s/article/End-Of-Life-Notification-SRX4100-Transform'},
   ifaces:'8x 10GE + 2x 40GE'},
  {id:'SRX4200', redund:true, psu:{tipo:'dos fuentes de serie (AC o DC) preinstaladas, intercambiables en caliente', volts:'100-127 V AC o 200-240 V AC, 50-60 Hz', texto:'Sale de fábrica con las dos fuentes instaladas y si una falla la otra reparte la carga sin interrupción. Cada fuente entrega 650 W — es capacidad, no consumo, y la guía no publica un consumo típico.'}, ser:'SRX 4000', seg:'DC Edge grande',
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
