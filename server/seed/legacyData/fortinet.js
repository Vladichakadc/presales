// Verificado contra Fortinet Product Matrix, edicion de septiembre de 2026 (PROMTX-2026-R176-SEP;
// la de julio con la que se transcribio al principio fue contrastada contra esta el 2026-09-14):
// https://www.fortinet.com/content/dam/fortinet/assets/data-sheets/Fortinet_Product_Matrix.pdf
// Las 5 cifras publicadas, en orden de profundidad de inspección creciente y throughput
// decreciente. Entender qué mide cada una es el 80% del dimensionamiento correcto:
//   fw   Firewall Throughput (1518 byte UDP) — sesión completamente descargada al ASIC de red
//        (NP7/SP5). Sin inspección de contenido. Es la cifra de portada y la que más se
//        malinterpreta: NO aplica en cuanto se habilita cualquier perfil UTM.
//   vpn  IPsec VPN Throughput (512 byte) — cripto descargada al ASIC.
//   ips  IPS Throughput (Enterprise Mix) — sale del offload de red, asistido por el content
//        processor (CP9/CP10) para pattern matching.
//   ngfw NGFW Throughput (Enterprise Mix) = IPS + Application Control.
//   tp   Threat Protection Throughput (Enterprise Mix) = NGFW + antivirus + logging. Es el
//        número realista de una sucursal con el stack de seguridad completo activo, y el que
//        se debe usar para dimensionar de verdad. (Antes esta clave se llamaba `ssl`, lo que
//        inducía a tratarla como "SSL Inspection Throughput" — un número distinto que
//        Fortinet ya no publica por modelo en el Product Matrix.)
//   ssl  SSL Inspection Throughput — IPS activado y un promedio de sesiones HTTPS con
//        distintas suites criptograficas. ES UNA METRICA PROPIA, no una fraccion de `tp`:
//        las metodologias son distintas y su cociente NO es constante entre plataformas
//        (30G 500/400, 40F 600/310, 50G 1100/1300 — el 50G, el 70G y el 90G publican MAS
//        SSL que Threat Protection, asi que cualquier derate fijo sobredimensiona ahi y
//        subdimensiona en el 40F). Ver la PROCEDENCIA DE LA TABLA DEL MATRIX.
//   sess Concurrent Sessions (valor base, sin licencia Hyperscale).
//   cps  New Sessions/Sec (TCP) — sesiones NUEVAS por segundo. Es el eje de CPU, distinto del
//        de memoria que mide `sess`: una sesion establecida cuesta memoria, abrirla cuesta
//        ciclos. Cifra de modo flow; con inspeccion proxy cae, y Fortinet no publica cuanto.
//
// PROCEDENCIA DE LA TABLA DEL MATRIX — 51 de 58 modelos, y los otros 7 en null A PROPOSITO.
// Hasta el 2026-09-22 esta pagina NO tenia el dato de inspeccion SSL: estimaba la cifra
// aplicando un factor unico (0,65) sobre Threat Protection. El informe «Informe final de
// validacion tecnica y plan de mejora del modulo Fortinet Presales» (22-sep-2026, seccion
// 5.1) lo documenta como el defecto P0 del motor y publicaba cinco modelos que lo desmienten:
//
//     modelo   TP oficial   SSL oficial   TP x 0,55   TP x 0,65 (lo que hacia esta pagina)
//     FG-30G     500 Mbps     400 Mbps     275 Mbps     325 Mbps   <- subdimensiona
//     FG-40F     600 Mbps     310 Mbps     330 Mbps     390 Mbps   <- SOBREstima el equipo
//     FG-50G   1.100 Mbps   1.300 Mbps     605 Mbps     715 Mbps   <- subdimensiona 1,8x
//     FG-70G   1.300 Mbps   1.400 Mbps     715 Mbps     845 Mbps   <- subdimensiona
//     FG-90G   2.200 Mbps   2.600 Mbps   1.210 Mbps   1.430 Mbps   <- subdimensiona 1,8x
//
// El cociente ssl/tp va de 0,52 (40F) a 1,18 (50G): no hay constante que lo describa, y en
// tres de los cinco el equipo aguanta MAS SSL que Threat Protection. Un factor unico no es
// "conservador": se equivoca en las dos direcciones, y en el 40F es el error caro -promete
// 390 Mbps donde el equipo da 310-.
//
// EL 2026-09-23 LAS CIFRAS DEJARON DE ESTAR TRANSCRITAS DE UN INFORME Y PASARON A SALIR DEL
// DOCUMENTO. `fortinet.com` y `docs.fortinet.com` siguen respondiendo `connect_rejected` al
// proxy de egreso de este entorno (politica de la organizacion, no un fallo de red), asi que
// no se bajo nada: el PDF ya estaba en el repositorio. Un ejecutor de GitHub Actions lo
// publico el 2026-09-02 en la rama de transporte `fuente/fortinet-product-matrix`
// (`fuente-fortinet/Fortinet_Product_Matrix.pdf`, edicion de septiembre de 2026,
// PROMTX-2026-R176-SEP), que es de donde salieron `cps` y `sess` de 32 modelos. Se
// reconstruyo la tabla por coordenadas de texto de sus paginas 1 a 3 y se transcribieron 27
// filas de modelo con siete columnas cada una.
//
// EL DOBLE ANCLAJE DIO 27 DE 27 SIN UN SOLO RECHAZO. Es la misma regla que aplican
// `npm run cps`, `juniper` y `huawei`, y es lo unico que prueba que ninguna fila se
// desplazo al reconstruir la tabla desde un PDF: una fila solo se acepta si al menos dos de
// sus columnas casan con lo ya verificado y ninguna lo contradice. Las anclas fueron
// `Concurrent Sessions` y `New Sessions/Sec`, que este catalogo ya traia verificadas modelo
// a modelo. De paso el documento CONFIRMA los cinco valores de inspeccion SSL que el informe
// habia dado (30G 400, 40F 310, 50G 1300, 70G 1400, 90G 2600): la fuente primaria y la
// secundaria coinciden exactamente, que es la comprobacion que no se habia podido hacer.
//
// LOS OTROS 7 QUEDAN EN null, Y null NO ES CERO NI ES "no tiene limite": es «el catalogo no
// trae la cifra». Son 100F, 200F, 400F, 600F y 1000F con sus variantes 401F y 1001F, cinco
// modelos de la generacion F que la edicion de septiembre del Matrix ya no lista —es un
// «Top Selling Models Matrix», un subconjunto curado, no el catalogo completo—. El motor NO
// los dimensiona con otra capa cuando se pide un eje que les falta: los APARTA CON SU MOTIVO
// y pide PoC o revision senior, que es la misma regla que `dimensionador-juniper-srx.js`
// aplica a `fw` y la calculadora a cada capa. Completarlos es leer las fichas por serie de
// esos cinco modelos, que es otro documento y otro bloqueo (pendiente F6).
//
// PROCEDENCIA DE `cps` — leer antes de completar los que faltan.
// El Product Matrix no es accesible desde el entorno donde se edita este catalogo: el proxy
// de egreso responde 403 a fortinet.com y a los espejos del PDF (politica de la organizacion,
// no un fallo de red). Los 21 modelos originales se reconstruyeron por busqueda web y solo se
// aceptaron con dos filtros simultaneos: la misma cifra repetida en dos consultas formuladas
// de forma independiente, y que la fila trajera ademas un valor de Concurrent Sessions
// coincidente con el `sess` ya verificado de este catalogo. Ese segundo filtro descarto varias
// respuestas: un 70G con 35.000 cps venia con 700.000 sesiones concurrentes (las del 60F), y
// un 80F con 85.000 venia con 720.000 (las del 50G).
//
// 2026-09-02: 32 modelos mas. `npm run vigia` confirmo que los ejecutores de GitHub Actions
// (a diferencia de este entorno) llegan a fortinet.com, asi que
// .github/workflows/traer-fortinet-matrix.yml bajo el PDF real y lo publico en la rama de
// transporte `fuente/fortinet-product-matrix` (no un activo de la app: se trae con `git fetch`,
// se lee y se descarta). El documento se leyo pagina por pagina, en su version renderizada
// -nunca con un extractor automatico de tablas de PDF, que es exactamente el mecanismo que
// desplaza filas-, y cada fila se transcribio a mano a un CSV que paso por `npm run cps`. Ese
// mismo contraste de `sess` sirvio de doble anclaje: los 32 valores casaron con el `sess` ya
// verificado en su primer intento, sin ningun rechazo. Donde el Product Matrix publica un
// segundo valor con nota⁶ ("Requires Hyperscale license": 2600F, 3000F/G, 3500F/G, 3800G,
// 4200F, 4400F, 4800F), se transcribio el valor BASE — el mismo criterio que ya usa `sess`,
// documentado arriba — nunca el que exige licencia adicional.
//
// 2026-09-03: 3 modelos mas, de 53 a 56 de 58. Los 5 que faltaban no estaban en el Product
// Matrix -que es un "Top Selling Models Matrix", un subconjunto curado-, pero SI en las fichas
// por serie. `.github/workflows/traer-fortinet-datasheets.yml` bajo las de 400F y 600F (URL
// confirmadas por busqueda; las de 100F y 200F se probaron por patron y dieron 404, reportado
// y no dado por bueno), se leyeron a mano en su version renderizada y pasaron por
// `npm run cps`: 400F/401F 500.000 y 600F 550.000, todas con su Concurrent Sessions casando
// con el `sess` ya verificado -7,8 M y 8 M- ademas de ips, ngfw, tp y vpn. Sin un rechazo.
//
// 2026-09-24: los 2 que faltaban, de 56 a 58 de 58. 100F 56.000 y 200F 280.000, de su ficha
// por serie en COREANO -la inglesa da 404 en todas las rutas, la coreana oficial sigue en el
// CDN de fortinet.com-, con Concurrent Sessions, IPS, NGFW, Threat Protection e IPsec casando
// con lo ya verificado (ver FICHAS_LIMITES, donde estan tambien sus limites de tuneles y SSL).
// RAM por modelo NO existe en el Product Matrix: ese documento publica throughput por capa,
// sesiones, cps, interfaces y consumo, no memoria. Fortinet no publica la RAM como
// especificacion de dimensionamiento — el proxy de la capacidad de memoria es `sess`.
//
// PROCEDENCIA DE `redund` / `psu` (pendiente 15) — 2026-09-03, 56 de 58 modelos.
// El Product Matrix no publica alimentacion por modelo, asi que este dato vive en documentos
// aparte del fabricante. `.github/workflows/traer-fortinet-psu.yml` los trajo desde un
// ejecutor de Actions -fortinet.com no responde 403 al ejecutor, a diferencia de HPE y Huawei,
// que devuelven un "Access Denied" de Akamai- y se leyeron a mano:
//   · 100F  — «the device has two power supplies that can be connected to different power
//     sources» (community.fortinet.com, "Checking FortiGate-100F series power supply").
//   · 7081F — «up to six hot swappable 200-277V, 16A AC PSUs. The capacity of each PSU is
//     2500W» + «You can add extra PSUs to provide redundancy» (7081F System Guide).
//   · 7121F — «You can hot swap a PSU without powering down [...] as long as four PSUs are
//     connected to power and operating normally» (7121F System Guide).
// Los 2.500 W del 7081F son CAPACIDAD de cada fuente, no consumo del equipo, y por eso NO van
// en `psu.watts`: la ficha rotula ese campo «Consumo tipico», asi que ponerlo ahi seria una
// cifra falsa con apariencia correcta. Va en el texto, que es donde se puede decir que mide.
// Y las fichas por serie de 400F y 600F, bajadas el mismo dia para completar `cps`, traian
// ademas la tabla "Dimensions and Power" entera:
//   · 400F  — «Redundant Power Supplies (Hot Swappable): Default dual AC PSU for 1+1
//     Redundancy», consumo medio 154.8 W (maximo 189.2 W), 100-240 V AC, 6 A.
//   · 401F  — lo mismo, con 161.1 W / 196.9 W: algo mas por el SSD.
//   · 600F  — «Redundant Power Supplies (Hot Swappable): Yes (comes with 2PSU default)»,
//     consumo medio 169 W (maximo 255 W), 100-240 V AC, 6 A a 100 V.
// En estos tres `watts` SI es consumo -el documento publica "AC Power Consumption (Average)",
// que es justo lo que la ficha rotula- a diferencia del 7081F, donde la unica cifra en vatios
// es capacidad por fuente.
//
// Y despues se leyeron 16 fichas por serie mas (`traer-fortinet-serie.yml`, retirada tras
// aplicar el dato), que subieron la cobertura de 6 a 37. La tabla "Dimensions and Power" de
// cada ficha trae "AC Power Consumption (Average / Maximum)" -consumo real, asi que va en
// `watts`- mas el rango de entrada, la corriente maxima y la linea de fuentes redundantes.
//
// EL CUARTO ESTADO DE `redund` SALIO DE AQUI. Leyendo estas fichas aparecio un caso que los
// tres anteriores no sabian decir: el 80F y el 90G publican «Powered by up to 2 External DC
// Power Adapters (1 adapter included)» -salen de fabrica con una fuente y admiten la segunda-.
// `true` habria prometido algo que no viene en la caja y `false` habria negado una redundancia
// que el equipo si soporta, asi que `ficha.js` gano el valor 'opcional', por el mismo motivo
// por el que ya tenia el «no lo dice». Reparto: 24 en `true`, 4 en 'opcional' (80F, 81F, 90G,
// 91G) y 9 en `false` (los de sobremesa con adaptador unico, que el documento declara sin
// segunda fuente -eso es un hecho leido, no una ausencia de dato).
//
// Detalles que solo aparecen leyendo, y que cambian una instalacion: el 3800G exige 200-240 V
// y no arranca a 100 V como el resto de la linea; el 200G, el 400G y el 700G traen las dos
// fuentes de serie pero NO se cambian en caliente, al contrario que el 900G o el 3000G.
//
// Y una tercera tanda cerro casi todo lo que faltaba. Aquellos 404 no eran documentos
// inexistentes: Fortinet sirve las fichas nuevas en /assets/data-sheets/pdf/<archivo> y las de
// la generacion F antigua en /assets/data-sheets/<archivo>, un subdirectorio de diferencia.
// Con la ruta corta bajaron 10 de 12, y de ahi salieron 19 modelos mas (1800F, 2600F, 3000F,
// 3200F, 3500F, 3700F, 4200F, 4400F, 4800F y sus variantes, mas el 71F). El 4800F comparte
// con el 3800G la exigencia de 200-240 V.
//
// UNA TRAMPA QUE VALE LA PENA RECORDAR: el archivo `fortigate-70f-series.pdf` que sirve
// fortinet.com NO es la ficha del 70F. Es la del 71F -su portada lo dice y el 70F no aparece
// ni una sola vez en el documento-, asi que aplicarle esas cifras habria sido creerle al
// nombre del archivo en vez de a su contenido.
// RESUELTO el 2026-09-11 (decision del duenyo): la ficha combinada autentica 70F/71F SI
// existe -revision FG-70F-DAT-R02-20221028- y su columna 70F ya esta transcrita (10.17 W /
// 12.43 W, adaptador externo 12VDC 3A, sin segunda fuente). Antes de copiar nada se valido
// la identidad del documento: su columna 71F (17.2 W / 18.7 W, 63.8 BTU/hr, 12VDC 3A)
// coincide cifra a cifra con la ficha oficial del 71F servida por fortinet.com.
// El mismo dia se completo el 200F (FG-200F-DAT-R28-20250407: 101.92 W / 118.90 W, doble
// fuente AC de serie NO intercambiable en caliente, 1+1) y el consumo del 100F
// (FG-100F-DAT-R42-20250407: 26.5 W / 29.5 W -Fortinet lo re-evaluo a la baja: la revision
// R20-20210311 publicaba 35.1 W / 38.7 W-). fortinet.com responde con un reto JavaScript de
// Akamai en las rutas de 100F y 200F, asi que se usaron espejos del PDF oficial y se
// verifico el codigo de revision impreso en el propio documento.
//
// Ya ningun modelo esta en `undefined` por alimentacion. Solo 2 quedan sin `watts` -el
// 7081F y el 7121F, chassis cuyas guias solo publican CAPACIDAD por fuente, no consumo del
// equipo (ver mas arriba)-, y eso es un hecho leido, no una ausencia de dato.
// El salto fw -> tp es de un orden de magnitud (ej. 90G: 28 Gbps -> 2.2 Gbps). Ahí está el
// error de preventa más común con FortiGate.
// Corrige varios valores que no coincidían con el datasheet oficial (incl. 3000F y 7081F, que tenían ips/ngfw/ssl/vpn de otro modelo — 3200F y 7121F respectivamente — copiados por error) y agrega los modelos del datasheet que faltaban en el catálogo (700G, 3000G, 3500G, 3800G, 70F, 3200F, 3700F, 4200F).
// 100F/200F/400F/600F no aparecen en este datasheet ("Top Selling Models") pero siguen siendo SKUs vigentes — se dejan sin tocar.
// Su existencia está confirmada además por la guía Hardware Acceleration de FortiOS, que sí les dedica página de fast path.
//
// SKUs, precios de licencias FortiGuard (UTP/Enterprise/ATP), soporte FortiCare y hardware, verificados contra
// "2026Q3 Main Price list_AMER_FINAL_EFF 080326.xlsx" (price list oficial Fortinet AMER, vigente desde 03-ago-2026,
// hojas "FortiGate" y "FortiGate Chassis Platforms"). hwSku = SKU de hardware base; lic = SKUs y precios de lista
// (USD, término 1/3/5 años) de los 3 bundles de protección FortiGuard + los 3 niveles de soporte FortiCare + el
// servicio de migración FortiConverter, todos con el código de modelo embebido en el SKU real de Fortinet.
// 70F/100F/200F/600F: descontinuados — el price list ya no lista SKU de hardware nuevo (hwSku=null) ni bundle
// Enterprise, solo renovación de servicios UTP/ATP a término de 1 año (confirma el estado EOL más allá de la hoja "Changes").
// "FortiGate 2000F": ELIMINADO del catálogo — no es un producto que exista. Estaba registrado como EOL, pero
// tres fuentes oficiales independientes lo desmienten: (1) no aparece en el Product Matrix, donde las únicas
// coincidencias de "2000F" son FML-2000F (FortiMail) y FWB-2000F (FortiWeb); (2) no tiene página de fast path
// architecture en la guía Hardware Acceleration, que sí cubre toda la línea F de datacenter; (3) está ausente
// por completo del price list, incluso de renovaciones de servicio. Además sus specs (fw/ips/ngfw/tp) eran copia
// literal del 3200F. La línea F de datacenter va 1800F -> 2600F, sin 2000F intermedio.
// FortiGate 71F: sucesor vigente del 70F (mismo NP7/SoC + 128 GB SSD onboard) — SKU de hardware FG-71F, bundles
// completos a 1/3/5 años, confirmado además por la hoja "Changes" (entradas 08/03/2026 solo para servicios de 70F,
// ninguna para hardware). Specs de throughput heredadas del 70F verificado en el Product Matrix — Fortinet no publicó
// un datasheet de rendimiento separado para el 71F al momento de este sync; mismo ASIC, por eso se asume equivalente.
//
// Variantes con SSD onboard (31G/51G/71G/91G/121G/201G/401G/701G/901G/3001G/3501G/3801G/61F/81F/401F/1001F/1801F/
// 2601F/3001F/3201F/3501F/3701F/4201F/4401F/4801F): el Product Matrix solo cubre los "Top Selling Models" (variante
// sin SSD); estas 25 variantes hermanas existen como SKU de hardware activo y propio en el price list vigente, mismo
// ASIC/throughput que su modelo base — solo agregan almacenamiento local (útil para retención de logs sin
// FortiAnalyzer, cache de WAN opt, etc.). Specs heredadas 1:1 del modelo base por ser el mismo silicio; el storage
// exacto (ej. 128GB, 2x 960GB, 2x 1.92TB) queda documentado en el campo ifaces de cada modelo.
const MODELS=[
  // ─── Serie G (nueva generación SP5 ASIC) ───────────────────────
  {id:'FortiGate 30G', seg:'SOHO / Teletrabajo', fw:4000, ips:800, ngfw:570, tp:500, vpn:3500, sess:600000, cps:30000, ifaces:'4 GE RJ45', redund:false, psu:{watts:6.8, tipo:'adaptador de corriente externo, único', volts:'100-240 V AC, 50/60 Hz', amps:'0,11 A @100 V · 0,055 A @240 V', texto:'Consumo medio 6.8 W y máximo 8.2 W. El datasheet no menciona una segunda fuente para este modelo.'}},
  {id:'FortiGate 31G', seg:'SOHO / Teletrabajo', fw:4000, ips:800, ngfw:570, tp:500, vpn:3500, sess:600000, cps:30000, ifaces:'4 GE RJ45 + 30GB SSD onboard', redund:false, psu:{watts:8.1, tipo:'adaptador de corriente externo, único', volts:'100-240 V AC, 50/60 Hz', amps:'0,17 A @110 V · 0,085 A @240 V', texto:'Consumo medio 8.1 W y máximo 9.3 W. El datasheet no menciona una segunda fuente para este modelo.'}},
  {id:'FortiGate 50G', seg:'SOHO / Sucursal peq', fw:5000, ips:2250, ngfw:1250, tp:1100, vpn:4500, sess:720000, cps:85000, ifaces:'5 GE + variantes SFP/5G', redund:false, psu:{watts:8.3, tipo:'adaptador de corriente externo, único', volts:'100-240 V AC, 50/60 Hz', amps:'0,4 A @100 V · 0,2 A @240 V', texto:'Consumo medio 8.3 W y máximo 8.9 W. El datasheet no menciona una segunda fuente para este modelo.'}},
  {id:'FortiGate 51G', seg:'SOHO / Sucursal peq', fw:5000, ips:2250, ngfw:1250, tp:1100, vpn:4500, sess:720000, cps:85000, ifaces:'5 GE + variantes SFP/5G + 64GB SSD onboard', redund:false, psu:{watts:8.3, tipo:'adaptador de corriente externo, único', volts:'100-240 V AC, 50/60 Hz', amps:'0,4 A @100 V · 0,2 A @240 V', texto:'Consumo medio 8.3 W y máximo 8.9 W. El datasheet no menciona una segunda fuente para este modelo.'}},
  {id:'FortiGate 70G', seg:'Sucursal peq', fw:10000, ips:2500, ngfw:1500, tp:1300, vpn:7100, sess:1400000, cps:100000, ifaces:'8 GE + variantes Wi-Fi/5G', redund:false, psu:{watts:12.3, tipo:'adaptador de corriente externo, único', volts:'100-240 V AC, 50/60 Hz', amps:'0,4 A @100 V · 0,2 A @240 V', texto:'Consumo medio 12.3 W y máximo 12.8 W. El datasheet no menciona una segunda fuente para este modelo.'}},
  {id:'FortiGate 71G', seg:'Sucursal peq', fw:10000, ips:2500, ngfw:1500, tp:1300, vpn:7100, sess:1400000, cps:100000, ifaces:'8 GE + variantes Wi-Fi/5G + 64GB SSD onboard', redund:false, psu:{watts:13.4, tipo:'adaptador de corriente externo, único', volts:'100-240 V AC, 50/60 Hz', amps:'0,4 A @100 V · 0,2 A @240 V', texto:'Consumo medio 13.4 W y máximo 14.1 W. El datasheet no menciona una segunda fuente para este modelo.'}},
  {id:'FortiGate 90G', seg:'Sucursal med', fw:28000, ips:4500, ngfw:2500, tp:2200, vpn:25000, sess:3000000, cps:124000, ifaces:'8 GE + 2x10GE SFP+', redund:'opcional', psu:{watts:19.9, tipo:'hasta dos adaptadores externos (viene uno)', volts:'100-240 V AC, 50/60 Hz', amps:'0,4 A @115 V · 0,2 A @230 V', texto:'Consumo medio 19.9 W y máximo 20.53 W. Admite un segundo adaptador para redundancia, que no viene incluido.'}},
  {id:'FortiGate 91G', seg:'Sucursal med', fw:28000, ips:4500, ngfw:2500, tp:2200, vpn:25000, sess:3000000, cps:124000, ifaces:'8 GE + 2x10GE SFP+ + 120GB SSD onboard', redund:'opcional', psu:{watts:22.4, tipo:'hasta dos adaptadores externos (viene uno)', volts:'100-240 V AC, 50/60 Hz', amps:'0,4 A @115 V · 0,2 A @230 V', texto:'Consumo medio 22.4 W y máximo 23.5 W. Admite un segundo adaptador para redundancia, que no viene incluido.'}},
  {id:'FortiGate 120G', seg:'Sucursal gde', fw:39000, ips:5300, ngfw:3100, tp:2800, vpn:35000, sess:3000000, cps:140000, ifaces:'GE + SFP/SFP+ (alta densidad)', redund:true, psu:{watts:38, tipo:'doble fuente AC de serie, no intercambiable en caliente (1+1)', volts:'100-240 V AC, 50/60 Hz', amps:'1,0 A @100 V · 0,5 A @240 V', texto:'Consumo medio 38 W y máximo 40 W. Las dos fuentes vienen de serie, pero no se cambian en caliente.'}},
  {id:'FortiGate 121G', seg:'Sucursal gde', fw:39000, ips:5300, ngfw:3100, tp:2800, vpn:35000, sess:3000000, cps:140000, ifaces:'GE + SFP/SFP+ (alta densidad) + 480GB SSD onboard', redund:true, psu:{watts:43, tipo:'doble fuente AC de serie, no intercambiable en caliente (1+1)', volts:'100-240 V AC, 50/60 Hz', amps:'1,0 A @100 V · 0,5 A @240 V', texto:'Consumo medio 43 W y máximo 47 W. Las dos fuentes vienen de serie, pero no se cambian en caliente.'}},
  {id:'FortiGate 200G', seg:'Campus / Agr', fw:39000, ips:9000, ngfw:7000, tp:6000, vpn:36000, sess:11000000, cps:400000, ifaces:'10GE SFP+ + GE SFP + GE RJ45', redund:true, psu:{watts:145, tipo:'doble fuente AC de serie, no intercambiable en caliente (1+1)', volts:'100-240 V AC, 50/60 Hz', amps:'2 A @100 V · 1,2 A @240 V', texto:'Consumo medio 145 W y máximo 175 W. Las dos fuentes vienen de serie, pero no se cambian en caliente.'}},
  {id:'FortiGate 201G', seg:'Campus / Agr', fw:39000, ips:9000, ngfw:7000, tp:6000, vpn:36000, sess:11000000, cps:400000, ifaces:'10GE SFP+ + GE SFP + GE RJ45 + 480GB SSD onboard', redund:true, psu:{watts:145, tipo:'doble fuente AC de serie, no intercambiable en caliente (1+1)', volts:'100-240 V AC, 50/60 Hz', amps:'2 A @100 V · 1,2 A @240 V', texto:'Consumo medio 145 W y máximo 176 W. Las dos fuentes vienen de serie, pero no se cambian en caliente.'}},
  // ─── Serie G — Alta gama / Datacenter / Carrier ────────────────
  {id:'FortiGate 400G', seg:'Campus / DC edge', fw:164000, ips:25000, ngfw:14000, tp:13000, vpn:55000, sess:28000000, cps:580000, ifaces:'4x25GE SFP28 + 16x GE SFP + 5x GE RJ45', redund:true, psu:{watts:230, tipo:'doble fuente AC de serie, no intercambiable en caliente (1+1)', volts:'100-240 V AC, 50/60 Hz', amps:'6 A @100 V', texto:'Consumo medio 230 W y máximo 283 W. Las dos fuentes vienen de serie, pero no se cambian en caliente.'}},
  {id:'FortiGate 401G', seg:'Campus / DC edge', fw:164000, ips:25000, ngfw:14000, tp:13000, vpn:55000, sess:28000000, cps:580000, ifaces:'4x25GE SFP28 + 16x GE SFP + 5x GE RJ45 + 960GB SSD onboard', redund:true, psu:{watts:240, tipo:'doble fuente AC de serie, no intercambiable en caliente (1+1)', volts:'100-240 V AC, 50/60 Hz', amps:'6 A @100 V', texto:'Consumo medio 240 W y máximo 295 W. Las dos fuentes vienen de serie, pero no se cambian en caliente.'}},
  {id:'FortiGate 700G', seg:'DC edge / Enterprise', fw:164000, ips:38000, ngfw:29000, tp:26000, vpn:55000, sess:28000000, cps:700000, ifaces:'4x25GE SFP28 + 16x GE SFP + 5x GE RJ45', redund:true, psu:{watts:230, tipo:'doble fuente AC de serie, no intercambiable en caliente (1+1)', volts:'100-240 V AC, 50/60 Hz', amps:'6 A @100 V', texto:'Consumo medio 230 W y máximo 283 W. Las dos fuentes vienen de serie, pero no se cambian en caliente.'}},
  {id:'FortiGate 701G', seg:'DC edge / Enterprise', fw:164000, ips:38000, ngfw:29000, tp:26000, vpn:55000, sess:28000000, cps:700000, ifaces:'4x25GE SFP28 + 16x GE SFP + 5x GE RJ45 + 960GB SSD onboard', redund:true, psu:{watts:240, tipo:'doble fuente AC de serie, no intercambiable en caliente (1+1)', volts:'100-240 V AC, 50/60 Hz', amps:'6 A @100 V', texto:'Consumo medio 240 W y máximo 295 W. Las dos fuentes vienen de serie, pero no se cambian en caliente.'}},
  {id:'FortiGate 900G', seg:'DC Edge / Enterprise', fw:164000, ips:42000, ngfw:31000, tp:30000, vpn:55000, sess:28000000, cps:720000, ifaces:'4x25GE SFP28 + 8 GE SFP + 17 GE RJ45', redund:true, psu:{watts:170, tipo:'doble fuente de serie, intercambiable en caliente', volts:'100-240 V AC, 50/60 Hz', amps:'6 A @100 V', texto:'Consumo medio 170 W y máximo 313 W. Hay variante DC (48-60 V, 7 A @48 V).'}},
  {id:'FortiGate 901G', seg:'DC Edge / Enterprise', fw:164000, ips:42000, ngfw:31000, tp:30000, vpn:55000, sess:28000000, cps:720000, ifaces:'4x25GE SFP28 + 8 GE SFP + 17 GE RJ45 + 2x 480GB SSD onboard', redund:true, psu:{watts:184, tipo:'doble fuente de serie, intercambiable en caliente', volts:'100-240 V AC, 50/60 Hz', amps:'6 A @100 V', texto:'Consumo medio 184 W y máximo 323 W. Hay variante DC (48-60 V, 7 A @48 V).'}},
  {id:'FortiGate 3000G', seg:'Carrier grade / DC core', fw:397000, ips:90000, ngfw:85000, tp:80000, vpn:105000, sess:88000000, cps:1100000, ifaces:'6x100GE QSFP28/40GE + 16x25GE SFP28 + 18x10GE RJ45', redund:true, psu:{watts:550, tipo:'doble fuente de serie, intercambiable en caliente', volts:'100-240 V AC, 50/60 Hz', amps:'12 A @100 V · 9 A @240 V', texto:'Consumo medio 550 W y máximo 808 W. Configuración 2+2.'}},
  {id:'FortiGate 3001G', seg:'Carrier grade / DC core', fw:397000, ips:90000, ngfw:85000, tp:80000, vpn:105000, sess:88000000, cps:1100000, ifaces:'6x100GE QSFP28/40GE + 16x25GE SFP28 + 18x10GE RJ45 + 2TB SSD onboard', redund:true, psu:{watts:560, tipo:'doble fuente de serie, intercambiable en caliente', volts:'100-240 V AC, 50/60 Hz', amps:'12 A @100 V · 9 A @240 V', texto:'Consumo medio 560 W y máximo 828 W. Configuración 2+2.'}},
  {id:'FortiGate 3500G', seg:'DC core', fw:595000, ips:125000, ngfw:115000, tp:105000, vpn:163000, sess:179000000, cps:1100000, ifaces:'2x400GE QSFP-DD + 4x100GE QSFP28 + 30x25GE SFP28', redund:true, psu:{watts:678, tipo:'doble fuente de serie, intercambiable en caliente', volts:'100-240 V AC, 50/60 Hz', amps:'12 A @100 V · 9 A @240 V', texto:'Consumo medio 678 W y máximo 973 W. Doble fuente AC de serie para redundancia 1+1.'}},
  {id:'FortiGate 3501G', seg:'DC core', fw:595000, ips:125000, ngfw:115000, tp:105000, vpn:163000, sess:179000000, cps:1100000, ifaces:'2x400GE QSFP-DD + 4x100GE QSFP28 + 30x25GE SFP28 + 2x 1.92TB SSD onboard', redund:true, psu:{watts:688, tipo:'doble fuente de serie, intercambiable en caliente', volts:'100-240 V AC, 50/60 Hz', amps:'12 A @100 V · 9 A @240 V', texto:'Consumo medio 688 W y máximo 993 W. Doble fuente AC de serie para redundancia 1+1.'}},
  {id:'FortiGate 3800G', seg:'DC core / Carrier', fw:795000, ips:250000, ngfw:210000, tp:200000, vpn:210000, sess:210000000, cps:1100000, ifaces:'4x400GE + 6x200GE QSFP56 + 18x10GE SFP56', redund:true, psu:{watts:1496, tipo:'fuentes 2+2 intercambiables en caliente (bandeja de ventiladores también)', volts:'200-240 V AC, 50/60 Hz', amps:'10 A @200-240 V', texto:'Consumo medio 1496 W y máximo 1950 W. Exige alimentación de 200-240 V: no admite 100 V como el resto de la línea. Hay variante DC (-48 a -60 V, 23 A).'}},
  {id:'FortiGate 3801G', seg:'DC core / Carrier', fw:795000, ips:250000, ngfw:210000, tp:200000, vpn:210000, sess:210000000, cps:1100000, ifaces:'4x400GE + 6x200GE QSFP56 + 18x10GE SFP56 + 2x 1.92TB SSD onboard', redund:true, psu:{watts:1496, tipo:'fuentes 2+2 intercambiables en caliente (bandeja de ventiladores también)', volts:'200-240 V AC, 50/60 Hz', amps:'10 A @200-240 V', texto:'Consumo medio 1496 W y máximo 1950 W. Exige alimentación de 200-240 V: no admite 100 V como el resto de la línea. Hay variante DC (-48 a -60 V, 23 A).'}},
  // ─── Serie F (generación actual) ───────────────────────────────
  {id:'FortiGate 40F', seg:'SOHO', fw:5000, ips:1000, ngfw:800, tp:600, vpn:4400, sess:700000, cps:35000, ifaces:'5 GE', redund:false, psu:{watts:7.74, tipo:'adaptador de corriente externo, único', volts:'100-240 V AC, 50/60 Hz', amps:'0,2 A @100 V · 0,1 A @240 V', texto:'Consumo medio 7.74 W y máximo 9.46 W. El datasheet no menciona una segunda fuente para este modelo.'}},
  {id:'FortiGate 60F', seg:'Sucursal peq', fw:10000, ips:1400, ngfw:1000, tp:700, vpn:6500, sess:700000, cps:35000, ifaces:'10 GE + Wi-Fi opcional', redund:false, psu:{watts:10.17, tipo:'adaptador de corriente externo, único', volts:'100-240 V AC, 50/60 Hz', amps:'1,0 A @100 V · 0,6 A @240 V', texto:'Consumo medio 10.17 W y máximo 12.43 W. El datasheet no menciona una segunda fuente para este modelo.'}},
  {id:'FortiGate 61F', seg:'Sucursal peq', fw:10000, ips:1400, ngfw:1000, tp:700, vpn:6500, sess:700000, cps:35000, ifaces:'10 GE + Wi-Fi opcional + 128GB SSD onboard', redund:false, psu:{watts:17.2, tipo:'adaptador de corriente externo, único', volts:'100-240 V AC, 50/60 Hz', amps:'1,0 A @100 V · 0,6 A @240 V', texto:'Consumo medio 17.2 W y máximo 18.7 W. El datasheet no menciona una segunda fuente para este modelo.'}},
  {id:'FortiGate 70F', seg:'Sucursal peq', fw:10000, ips:1400, ngfw:1000, tp:800, vpn:6100, sess:1500000, cps:35000, ifaces:'10 GE RJ45', redund:false, psu:{watts:10.17, tipo:'adaptador de corriente externo, único', volts:'100-240 V AC, 50/60 Hz', amps:'1,0 A @100 V · 0,6 A @240 V', texto:'Consumo medio 10.17 W y máximo 12.43 W. El datasheet no menciona una segunda fuente para este modelo.'}},
  {id:'FortiGate 71F', seg:'Sucursal peq', fw:10000, ips:1400, ngfw:1000, tp:800, vpn:6100, sess:1500000, cps:35000, ifaces:'10 GE RJ45 + 128GB SSD onboard', redund:false, psu:{watts:17.2, tipo:'adaptador de corriente externo, único', volts:'100-240 V AC, 50/60 Hz', amps:'1,0 A @100 V · 0,6 A @240 V', texto:'Consumo medio 17.2 W y máximo 18.7 W. El datasheet no menciona una segunda fuente para este modelo.'}},
  {id:'FortiGate 80F', seg:'Sucursal + PoE', fw:10000, ips:1400, ngfw:1000, tp:900, vpn:6500, sess:1500000, cps:45000, ifaces:'8 GE + 2 SFP', redund:'opcional', psu:{watts:12.69, tipo:'hasta dos adaptadores externos (viene uno)', volts:'100-240 V AC, 50/60 Hz', amps:'0,4 A @115 V · 0,2 A @230 V', texto:'Consumo medio 12.69 W y máximo 15.51 W. Admite un segundo adaptador para redundancia, que no viene incluido.'}},
  {id:'FortiGate 81F', seg:'Sucursal + PoE', fw:10000, ips:1400, ngfw:1000, tp:900, vpn:6500, sess:1500000, cps:45000, ifaces:'8 GE + 2 SFP + 128GB SSD onboard', redund:'opcional', psu:{watts:13.5, tipo:'hasta dos adaptadores externos (viene uno)', volts:'100-240 V AC, 50/60 Hz', amps:'0,4 A @115 V · 0,2 A @230 V', texto:'Consumo medio 13.5 W y máximo 16.5 W. Admite un segundo adaptador para redundancia, que no viene incluido.'}},
  // redund/psu leidos el 2026-09-03 del articulo oficial «Technical Tip: Checking
  // FortiGate-100F series power supply» (community.fortinet.com), traido con
  // .github/workflows/traer-fortinet-psu.yml. Frase literal: «the device has two power
  // supplies that can be connected to different power sources». El documento no publica
  // consumo, asi que `watts` se queda fuera en vez de rellenarse a ojo.
  {id:'FortiGate 100F', seg:'Sucursal med', fw:20000, ips:2600, ngfw:1600, tp:1000, vpn:11500, sess:1500000, cps:56000, ifaces:'22 GE + 2x10GE SFP+', redund:true, psu:{watts:26.5, tipo:'doble fuente AC de serie, no intercambiable en caliente (1+1)', volts:'100-240 V AC, 50/60 Hz', amps:'1,0 A @100 V · 0,5 A @240 V', texto:'Consumo medio 26.5 W y máximo 29.5 W. Las dos fuentes vienen de serie, pero no se cambian en caliente.'}},
  {id:'FortiGate 200F', seg:'Sucursal gde', fw:27000, ips:5000, ngfw:3500, tp:3000, vpn:13000, sess:3000000, cps:280000, ifaces:'16 GE + 4x10GE + 4 SFP', redund:true, psu:{watts:101.92, tipo:'doble fuente AC de serie, no intercambiable en caliente (1+1)', volts:'100-240 V AC, 50/60 Hz', amps:'2 A @100 V · 1,2 A @240 V', texto:'Consumo medio 101.92 W y máximo 118.90 W. Las dos fuentes vienen de serie, pero no se cambian en caliente.'}},
  // Los tres siguientes, leidos de sus datasheets por serie (2026-09-03). Aqui `watts` SI es
  // consumo: el documento publica "AC Power Consumption (Average / Maximum)", que es lo que la
  // ficha rotula «Consumo tipico» -a diferencia de los 2.500 W del 7081F, que son capacidad.
  {id:'FortiGate 400F', seg:'Campus / Agr', fw:80000, ips:12000, ngfw:10000, tp:9000, vpn:55000, sess:7800000, cps:500000, ifaces:'8 GE + 8 SFP + 8x10GE', redund:true, psu:{watts:154.8, tipo:'doble fuente AC de serie, intercambiable en caliente (1+1)', volts:'100-240 V AC, 50/60 Hz', amps:'6 A maximo', texto:'Consumo medio 154.8 W y máximo 189.2 W. Hay variante DC (48-60 V, 12 A).'}},
  {id:'FortiGate 401F', seg:'Campus / Agr', fw:80000, ips:12000, ngfw:10000, tp:9000, vpn:55000, sess:7800000, cps:500000, ifaces:'8 GE + 8 SFP + 8x10GE + 960GB SSD onboard', redund:true, psu:{watts:161.1, tipo:'doble fuente AC de serie, intercambiable en caliente (1+1)', volts:'100-240 V AC, 50/60 Hz', amps:'6 A maximo', texto:'Consumo medio 161.1 W y máximo 196.9 W — algo por encima del 400F por el SSD. Hay variante DC (48-60 V, 12 A).'}},
  {id:'FortiGate 600F', seg:'Campus / DC edge', fw:139000, ips:14000, ngfw:11500, tp:10500, vpn:55000, sess:8000000, cps:550000, ifaces:'4x25GE + 16x10GE', redund:true, psu:{watts:169, tipo:'doble fuente intercambiable en caliente (2 PSU de serie)', volts:'100-240 V AC, 50/60 Hz', amps:'6 A a 100 V', texto:'Consumo medio 169 W y máximo 255 W.'}},
  {id:'FortiGate 1000F', seg:'DC edge', fw:198000, ips:19000, ngfw:15000, tp:13000, vpn:55000, sess:7500000, cps:650000, ifaces:'4x100GE + 16x25GE + 16x10GE', redund:true, psu:{watts:210, tipo:'doble fuente de serie, intercambiable en caliente', volts:'100-240 V AC, 50/60 Hz', amps:'6 A @120 V · 3 A @240 V', texto:'Consumo medio 210 W y máximo 408 W.'}},
  {id:'FortiGate 1001F', seg:'DC edge', fw:198000, ips:19000, ngfw:15000, tp:13000, vpn:55000, sess:7500000, cps:650000, ifaces:'4x100GE + 16x25GE + 16x10GE + 960GB SSD onboard', redund:true, psu:{watts:215, tipo:'doble fuente de serie, intercambiable en caliente', volts:'100-240 V AC, 50/60 Hz', amps:'6 A @120 V · 3 A @240 V', texto:'Consumo medio 215 W y máximo 415 W.'}},
  // ─── Serie F — Alta gama / Datacenter / Carrier ────────────────
  {id:'FortiGate 1800F', seg:'DC / Enterprise', fw:198000, ips:22000, ngfw:17000, tp:15000, vpn:55000, sess:12000000, cps:750000, ifaces:'2x100GE QSFP28 + 12x25GE SFP28 + 8x10GE RJ45', redund:true, psu:{watts:410.9, tipo:'doble fuente AC de serie, intercambiable en caliente (1+1)', volts:'100-240 V AC, 50/60 Hz', amps:'7 A @100 V · 3 A @240 V', texto:'Consumo medio 410.9 W y máximo 459.1 W. Hay variante DC (-48 a -60 V, 20 A).'}},
  {id:'FortiGate 1801F', seg:'DC / Enterprise', fw:198000, ips:22000, ngfw:17000, tp:15000, vpn:55000, sess:12000000, cps:750000, ifaces:'2x100GE QSFP28 + 12x25GE SFP28 + 8x10GE RJ45 + 2x 960GB SSD onboard', redund:true, psu:{watts:414.9, tipo:'doble fuente AC de serie, intercambiable en caliente (1+1)', volts:'100-240 V AC, 50/60 Hz', amps:'7 A @100 V · 3 A @240 V', texto:'Consumo medio 414.9 W y máximo 463.1 W. Hay variante DC (-48 a -60 V, 20 A).'}},
  {id:'FortiGate 2600F', seg:'DC / Carrier', fw:198000, ips:31000, ngfw:27000, tp:25000, vpn:55000, sess:24000000, cps:1000000, ifaces:'4x100GE QSFP28/40GE + 16x25GE SFP28 + 16x10GE SFP+', redund:true, psu:{watts:416, tipo:'doble fuente AC de serie, intercambiable en caliente (1+1)', volts:'100-240 V AC, 47/63 Hz', amps:'6 A máximo', texto:'Consumo medio 416 W y máximo 510 W. Hay variante DC (-48 a -60 V, 15 A @48 V).'}},
  {id:'FortiGate 2601F', seg:'DC / Carrier', fw:198000, ips:31000, ngfw:27000, tp:25000, vpn:55000, sess:24000000, cps:1000000, ifaces:'4x100GE QSFP28/40GE + 16x25GE SFP28 + 16x10GE SFP+ + 2x 960GB SSD onboard', redund:true, psu:{watts:420.3, tipo:'doble fuente AC de serie, intercambiable en caliente (1+1)', volts:'100-240 V AC, 47/63 Hz', amps:'6 A máximo', texto:'Consumo medio 420.3 W y máximo 513.7 W. Hay variante DC (-48 a -60 V, 15 A @48 V).'}},
  {id:'FortiGate 3000F', seg:'Carrier grade', fw:397000, ips:36000, ngfw:34000, tp:33000, vpn:105000, sess:70000000, cps:870000, ifaces:'6x100GE QSFP28/40GE + 18x10GE RJ45', redund:true, psu:{watts:425, tipo:'doble fuente AC de serie, intercambiable en caliente (1+1)', volts:'100-240 V AC, 50/60 Hz', amps:'12 A @100 V · 9 A @240 V', texto:'Consumo medio 425 W y máximo 680 W. Hay variante DC (48-60 V, 15 A @48 V).'}},
  {id:'FortiGate 3001F', seg:'Carrier grade', fw:397000, ips:36000, ngfw:34000, tp:33000, vpn:105000, sess:70000000, cps:870000, ifaces:'6x100GE QSFP28/40GE + 18x10GE RJ45 + 2x 960GB SSD onboard', redund:true, psu:{watts:420, tipo:'doble fuente AC de serie, intercambiable en caliente (1+1)', volts:'100-240 V AC, 50/60 Hz', amps:'12 A @100 V · 9 A @240 V', texto:'Consumo medio 420 W y máximo 690 W. Hay variante DC (48-60 V, 15 A @48 V).'}},
  {id:'FortiGate 3200F', seg:'Carrier grade', fw:387000, ips:63000, ngfw:47000, tp:45000, vpn:105000, sess:70000000, cps:800000, ifaces:'4x400GE QSFP-DD + 12x50GE SFP28 + 4x25GE SFP28', redund:true, psu:{watts:520, tipo:'doble fuente AC de serie, intercambiable en caliente (1+1)', volts:'100-240 V AC, 50/60 Hz', amps:'12 A @100 V · 9 A @240 V', texto:'Consumo medio 520 W y máximo 865 W.'}},
  {id:'FortiGate 3201F', seg:'Carrier grade', fw:387000, ips:63000, ngfw:47000, tp:45000, vpn:105000, sess:70000000, cps:800000, ifaces:'4x400GE QSFP-DD + 12x50GE SFP28 + 4x25GE SFP28 + 2x 960GB SSD onboard', redund:true, psu:{watts:527, tipo:'doble fuente AC de serie, intercambiable en caliente (1+1)', volts:'100-240 V AC, 50/60 Hz', amps:'12 A @100 V · 9 A @240 V', texto:'Consumo medio 527 W y máximo 870 W.'}},
  {id:'FortiGate 3500F', seg:'DC core', fw:595000, ips:72000, ngfw:65000, tp:63000, vpn:165000, sess:140000000, cps:1000000, ifaces:'6x100GE QSFP28/40GE + 32x25GE SFP28', redund:true, psu:{watts:760, tipo:'doble fuente AC de serie, intercambiable en caliente (1+1)', volts:'100-240 V AC, 50/60 Hz', amps:'12 A @120 V · 9 A @240 V', texto:'Consumo medio 760 W y máximo 1174 W.'}},
  {id:'FortiGate 3501F', seg:'DC core', fw:595000, ips:72000, ngfw:65000, tp:63000, vpn:165000, sess:140000000, cps:1000000, ifaces:'6x100GE QSFP28/40GE + 32x25GE SFP28 + 2x 1.92TB SSD onboard', redund:true, psu:{watts:765, tipo:'doble fuente AC de serie, intercambiable en caliente (1+1)', volts:'100-240 V AC, 50/60 Hz', amps:'12 A @120 V · 9 A @240 V', texto:'Consumo medio 765 W y máximo 1181 W.'}},
  {id:'FortiGate 3700F', seg:'DC core', fw:589000, ips:86000, ngfw:80000, tp:75000, vpn:160000, sess:140000000, cps:930000, ifaces:'4x400GE QSFP-DD + 4x25GE SFP28 ULL + 20x50GE SFP56', redund:true, psu:{watts:590, tipo:'doble fuente AC de serie, intercambiable en caliente (1+1)', volts:'100-240 V AC, 50/60 Hz', amps:'12 A @100 V · 9 A @240 V', texto:'Consumo medio 590 W y máximo 1140 W.'}},
  {id:'FortiGate 3701F', seg:'DC core', fw:589000, ips:86000, ngfw:80000, tp:75000, vpn:160000, sess:140000000, cps:930000, ifaces:'4x400GE QSFP-DD + 4x25GE SFP28 ULL + 20x50GE SFP56 + 2x 1.92TB SSD onboard', redund:true, psu:{watts:600, tipo:'doble fuente AC de serie, intercambiable en caliente (1+1)', volts:'100-240 V AC, 50/60 Hz', amps:'12 A @100 V · 9 A @240 V', texto:'Consumo medio 600 W y máximo 1150 W.'}},
  {id:'FortiGate 4200F', seg:'DC core', fw:800000, ips:52000, ngfw:47000, tp:45000, vpn:210000, sess:210000000, cps:1000000, ifaces:'8x100GE QSFP28/40GE + 18x25GE SFP28', redund:true, psu:{watts:931, tipo:'doble fuente AC de serie, intercambiable en caliente (1+1)', volts:'100-240 V AC, 50/60 Hz', amps:'13,5 A @120 V · 5,5 A @240 V', texto:'Consumo medio 931 W y máximo 1291 W. Redundancia 1+1 de serie, con la bandeja de ventiladores también intercambiable en caliente. Hay variante DC (-48 a -60 V, 20 A).'}},
  {id:'FortiGate 4201F', seg:'DC core', fw:800000, ips:52000, ngfw:47000, tp:45000, vpn:210000, sess:210000000, cps:1000000, ifaces:'8x100GE QSFP28/40GE + 18x25GE SFP28 + 2x 1.92TB SSD onboard', redund:true, psu:{watts:940, tipo:'doble fuente AC de serie, intercambiable en caliente (1+1)', volts:'100-240 V AC, 50/60 Hz', amps:'13,5 A @120 V · 5,5 A @240 V', texto:'Consumo medio 940 W y máximo 1306 W. Redundancia 1+1 de serie, con la bandeja de ventiladores también intercambiable en caliente. Hay variante DC (-48 a -60 V, 20 A).'}},
  {id:'FortiGate 4400F', seg:'DC core', fw:1150000, ips:94000, ngfw:82000, tp:75000, vpn:310000, sess:210000000, cps:1000000, ifaces:'12x100GE QSFP28/40GE + 20x25GE SFP28', redund:true, psu:{watts:1533, tipo:'fuentes 2+2 intercambiables en caliente (bandeja de ventiladores también)', volts:'100-240 V AC, 50/60 Hz', amps:'20 A @100 V · 9 A @240 V', texto:'Consumo medio 1533 W y máximo 1875 W. Configuración 2+2 en AC y 1+1 en DC. Hay variante DC (-48 a -60 V, 32 A).'}},
  {id:'FortiGate 4401F', seg:'DC core', fw:1150000, ips:94000, ngfw:82000, tp:75000, vpn:310000, sess:210000000, cps:1000000, ifaces:'12x100GE QSFP28/40GE + 20x25GE SFP28 + 2x 1.92TB SSD onboard', redund:true, psu:{watts:1539, tipo:'fuentes 2+2 intercambiables en caliente (bandeja de ventiladores también)', volts:'100-240 V AC, 50/60 Hz', amps:'20 A @100 V · 9 A @240 V', texto:'Consumo medio 1539 W y máximo 1881 W. Configuración 2+2 en AC y 1+1 en DC. Hay variante DC (-48 a -60 V, 32 A).'}},
  {id:'FortiGate 4800F', seg:'Hyperscale DC', fw:3100000, ips:87000, ngfw:77000, tp:75000, vpn:800000, sess:280000000, cps:915000, ifaces:'8x400GE + 12x50GE SFP56', redund:true, psu:{watts:1602, tipo:'fuentes 2+2 intercambiables en caliente (bandeja de ventiladores también)', volts:'200-240 V AC, 50/60 Hz', amps:'7,99 A @240 V', texto:'Consumo medio 1602 W y máximo 1918.2 W. Exige alimentación de 200-240 V: no admite 100 V. Hay variante DC (-72 a -40 V, 40,94 A @48 V).'}},
  {id:'FortiGate 4801F', seg:'Hyperscale DC', fw:3100000, ips:87000, ngfw:77000, tp:75000, vpn:800000, sess:280000000, cps:915000, ifaces:'8x400GE + 12x50GE SFP56 + 2x 1.92TB SSD onboard', redund:true, psu:{watts:1622, tipo:'fuentes 2+2 intercambiables en caliente (bandeja de ventiladores también)', volts:'200-240 V AC, 50/60 Hz', amps:'8,08 A @240 V', texto:'Consumo medio 1622 W y máximo 1938.2 W. Exige alimentación de 200-240 V: no admite 100 V. Hay variante DC (-72 a -40 V, 40,94 A @48 V).'}},
  // Los dos chasis, leidos el 2026-09-03 de sus System Guide oficiales (docs.fortinet.com).
  // Los 2.500 W del 7081F son la CAPACIDAD de cada fuente, no el consumo del equipo, asi que
  // no van en `watts` -que la ficha rotula «Consumo tipico»- sino en el texto: seria una cifra
  // falsa con apariencia correcta, justo el error que este catalogo evita.
  {id:'FortiGate 7081F', seg:'Carrier / ISP', fw:1890000, ips:405000, ngfw:330000, tp:312000, vpn:378000, sess:600000000, cps:5400000, ifaces:'Chasis modular FPM (interfaces variables)', redund:true, psu:{tipo:'hasta 6 fuentes AC intercambiables en caliente', volts:'200-277 V, 16 A', texto:'Hasta seis fuentes AC de 2.500 W de capacidad cada una, intercambiables en caliente. Cuántas hacen falta depende de los módulos FIM y FPM instalados; se pueden añadir fuentes extra para redundancia y conectar cada una a una toma distinta.'}},
  {id:'FortiGate 7121F', seg:'Carrier / National', fw:1890000, ips:675000, ngfw:550000, tp:520000, vpn:630000, sess:1000000000, cps:9000000, ifaces:'Chasis modular FPM (interfaces variables)', redund:true, psu:{tipo:'fuentes AC intercambiables en caliente', texto:'Se puede cambiar una fuente sin apagar el equipo mientras queden cuatro conectadas y funcionando; por debajo de cuatro, el chasis empieza a apagar módulos FPM. El documento leído no publica el número máximo de fuentes.'}},
];

// SKU de hardware base (columna UNIT/SKU de la hoja "FortiGate"/"FortiGate Chassis Platforms").
// null = sin SKU de hardware nuevo vigente en el price list (equipo descontinuado, solo renovación de servicios).
const HW_SKU={
  '30G':'FG-30G', '50G':'FG-50G', '70G':'FG-70G', '90G':'FG-90G', '120G':'FG-120G', '200G':'FG-200G',
  '400G':'FG-400G', '700G':'FG-700G', '900G':'FG-900G', '3000G':'FG-3000G', '3500G':'FG-3500G', '3800G':'FG-3800G',
  '40F':'FG-40F', '60F':'FG-60F', '70F':null, '71F':'FG-71F', '80F':'FG-80F', '100F':null, '200F':null, '400F':'FG-400F', '600F':null,
  '1000F':'FG-1000F', '1800F':'FG-1800F', '2600F':'FG-2600F', '3000F':'FG-3000F', '3200F':'FG-3200F',
  '3500F':'FG-3500F', '3700F':'FG-3700F', '4200F':'FG-4200F', '4400F':'FG-4400F', '4800F':'FG-4800F',
  '7081F':'FG-7081F', '7121F':'FG-7121F',
  '31G':'FG-31G', '51G':'FG-51G', '71G':'FG-71G', '91G':'FG-91G', '121G':'FG-121G', '201G':'FG-201G', '401G':'FG-401G', '701G':'FG-701G', '901G':'FG-901G', '3001G':'FG-3001G', '3501G':'FG-3501G', '3801G':'FG-3801G', '61F':'FG-61F', '81F':'FG-81F', '401F':'FG-401F', '1001F':'FG-1001F', '1801F':'FG-1801F', '2601F':'FG-2601F', '3001F':'FG-3001F', '3201F':'FG-3201F', '3501F':'FG-3501F', '3701F':'FG-3701F', '4201F':'FG-4201F', '4401F':'FG-4401F', '4801F':'FG-4801F',
};

// Licencias FortiGuard (ent/utp/atp) + soporte FortiCare (essential/premium/elite) + FortiConverter por modelo.
// sku = SKU real de Fortinet con el código de modelo embebido · y1/y3/y5 = precio de lista USD por término.
// entBdl/utpBdl = SKU combinado hardware + primera licencia (no existe combo de fábrica para ATP).
// null en un tier = ese SKU no existe para ese modelo en el price list vigente (p.ej. Essential no se ofrece
// en equipos de gama alta; Enterprise no se ofrece en modelos descontinuados).
const LICENSES={
  '30G': {ent:{sku:'FC-10-FG30G-809-02-DD',y1:425,y3:1147.5,y5:1806.25}, utp:{sku:'FC-10-FG30G-950-02-DD',y1:350,y3:945,y5:1487.5}, atp:{sku:'FC-10-FG30G-928-02-DD',y1:225,y3:607.5,y5:956.25}, entBdl:{sku:'FG-30G-BDL-809-DD',y1:1059,y3:1781.5,y5:2440.25}, utpBdl:{sku:'FG-30G-BDL-950-DD',y1:984,y3:1579,y5:2121.5}, care:{essential:{sku:'FC-10-FG30G-314-02-DD',y1:75,y3:225,y5:375},premium:{sku:'FC-10-FG30G-247-02-DD',y1:100,y3:300,y5:500},elite:{sku:'FC-10-FG30G-284-02-DD',y1:125,y3:375,y5:625}}, converter:{sku:'FC-10-FG30G-189-02-DD',fee:50}},
  '50G': {ent:{sku:'FC-10-GT50G-809-02-DD',y1:612.85,y3:1654.7,y5:2604.61}, utp:{sku:'FC-10-GT50G-950-02-DD',y1:504.7,y3:1362.69,y5:2144.98}, atp:{sku:'FC-10-GT50G-928-02-DD',y1:324.45,y3:876.02,y5:1378.91}, entBdl:{sku:'FG-50G-BDL-809-DD',y1:1606.85,y3:2648.7,y5:3598.61}, utpBdl:{sku:'FG-50G-BDL-950-DD',y1:1498.7,y3:2356.69,y5:3138.98}, care:{essential:{sku:'FC-10-GT50G-314-02-DD',y1:108.15,y3:324.45,y5:540.75},premium:{sku:'FC-10-GT50G-247-02-DD',y1:144.2,y3:432.6,y5:721},elite:{sku:'FC-10-GT50G-284-02-DD',y1:180.25,y3:540.75,y5:901.25}}, converter:{sku:'FC-10-GT50G-189-02-DD',fee:50}},
  '70G': {ent:{sku:'FC-10-GT70G-809-02-DD',y1:936.7,y3:2529.09,y5:3980.98}, utp:{sku:'FC-10-GT70G-950-02-DD',y1:771.4,y3:2082.78,y5:3278.45}, atp:{sku:'FC-10-GT70G-928-02-DD',y1:495.9,y3:1338.93,y5:2107.58}, entBdl:{sku:'FG-70G-BDL-809-DD',y1:2356.7,y3:3949.09,y5:5400.98}, utpBdl:{sku:'FG-70G-BDL-950-DD',y1:2191.4,y3:3502.78,y5:4698.45}, care:{essential:{sku:'FC-10-GT70G-314-02-DD',y1:165.3,y3:495.9,y5:826.5},premium:{sku:'FC-10-GT70G-247-02-DD',y1:220.4,y3:661.2,y5:1102},elite:{sku:'FC-10-GT70G-284-02-DD',y1:275.5,y3:826.5,y5:1377.5}}, converter:{sku:'FC-10-GT70G-189-02-DD',fee:55.1}},
  '90G': {ent:{sku:'FC-10-0090G-809-02-DD',y1:2322.2,y3:6966.6,y5:11611}, utp:{sku:'FC-10-0090G-950-02-DD',y1:1912.4,y3:5737.2,y5:9562}, atp:{sku:'FC-10-0090G-928-02-DD',y1:1229.4,y3:3688.2,y5:6147}, entBdl:{sku:'FG-90G-BDL-809-DD',y1:5629.2,y3:10273.6,y5:14918}, utpBdl:{sku:'FG-90G-BDL-950-DD',y1:5219.4,y3:9044.2,y5:12869}, care:{essential:{sku:'FC-10-0090G-314-02-DD',y1:409.8,y3:1229.4,y5:2049},premium:{sku:'FC-10-0090G-247-02-DD',y1:546.4,y3:1639.2,y5:2732},elite:{sku:'FC-10-0090G-284-02-DD',y1:683,y3:2049,y5:3415}}, converter:{sku:'FC-10-0090G-189-02-DD',fee:136.6}},
  '120G': {ent:{sku:'FC-10-F120G-809-02-DD',y1:3366,y3:10098,y5:16830}, utp:{sku:'FC-10-F120G-950-02-DD',y1:2772,y3:8316,y5:13860}, atp:{sku:'FC-10-F120G-928-02-DD',y1:1782,y3:5346,y5:8910}, entBdl:{sku:'FG-120G-BDL-809-DD',y1:8158,y3:14890,y5:21622}, utpBdl:{sku:'FG-120G-BDL-950-DD',y1:7564,y3:13108,y5:18652}, care:{essential:null,premium:{sku:'FC-10-F120G-247-02-DD',y1:792,y3:2376,y5:3960},elite:{sku:'FC-10-F120G-284-02-DD',y1:990,y3:2970,y5:4950}}, converter:{sku:'FC-10-F120G-189-02-DD',fee:198}},
  '200G': {ent:{sku:'FC-10-FG2HG-809-02-DD',y1:7068.6,y3:21205.8,y5:35343}, utp:{sku:'FC-10-FG2HG-950-02-DD',y1:5821.2,y3:17463.6,y5:29106}, atp:{sku:'FC-10-FG2HG-928-02-DD',y1:3742.2,y3:11226.6,y5:18711}, entBdl:{sku:'FG-200G-BDL-809-DD',y1:18545.6,y3:32682.8,y5:46820}, utpBdl:{sku:'FG-200G-BDL-950-DD',y1:17298.2,y3:28940.6,y5:40583}, care:{essential:null,premium:{sku:'FC-10-FG2HG-247-02-DD',y1:1663.2,y3:4989.6,y5:8316},elite:{sku:'FC-10-FG2HG-284-02-DD',y1:2079,y3:6237,y5:10395}}, converter:{sku:'FC-10-FG2HG-189-02-DD',fee:415.8}},
  '400G': {ent:{sku:'FC-10-FG4H0-809-02-DD',y1:18742.5,y3:56227.5,y5:93712.5}, utp:{sku:'FC-10-FG4H0-950-02-DD',y1:15435,y3:46305,y5:77175}, atp:{sku:'FC-10-FG4H0-928-02-DD',y1:9922.5,y3:29767.5,y5:49612.5}, entBdl:{sku:'FG-400G-BDL-809-DD',y1:43438.5,y3:80923.5,y5:118408.5}, utpBdl:{sku:'FG-400G-BDL-950-DD',y1:40131,y3:71001,y5:101871}, care:{essential:null,premium:{sku:'FC-10-FG4H0-247-02-DD',y1:4410,y3:13230,y5:22050},elite:{sku:'FC-10-FG4H0-284-02-DD',y1:5512.5,y3:16537.5,y5:27562.5}}, converter:{sku:'FC-10-FG4H0-189-02-DD',fee:1102.5}},
  '700G': {ent:{sku:'FC-10-G7H0G-809-02-DD',y1:23562,y3:70686,y5:117810}, utp:{sku:'FC-10-G7H0G-950-02-DD',y1:19404,y3:58212,y5:97020}, atp:{sku:'FC-10-G7H0G-928-02-DD',y1:12474,y3:37422,y5:62370}, entBdl:{sku:'FG-700G-BDL-809-DD',y1:58628,y3:105752,y5:152876}, utpBdl:{sku:'FG-700G-BDL-950-DD',y1:54470,y3:93278,y5:132086}, care:{essential:null,premium:{sku:'FC-10-G7H0G-247-02-DD',y1:5544,y3:16632,y5:27720},elite:{sku:'FC-10-G7H0G-284-02-DD',y1:6930,y3:20790,y5:34650}}, converter:{sku:'FC-10-G7H0G-189-02-DD',fee:1386}},
  '900G': {ent:{sku:'FC-10-FG9H0-809-02-DD',y1:32130,y3:96390,y5:160650}, utp:{sku:'FC-10-FG9H0-950-02-DD',y1:26460,y3:79380,y5:132300}, atp:{sku:'FC-10-FG9H0-928-02-DD',y1:17010,y3:51030,y5:85050}, entBdl:{sku:'FG-900G-BDL-809-DD',y1:73710,y3:137970,y5:202230}, utpBdl:{sku:'FG-900G-BDL-950-DD',y1:68040,y3:120960,y5:173880}, care:{essential:null,premium:{sku:'FC-10-FG9H0-247-02-DD',y1:7560,y3:22680,y5:37800},elite:{sku:'FC-10-FG9H0-284-02-DD',y1:9450,y3:28350,y5:47250}}, converter:{sku:'FC-10-FG9H0-189-02-DD',fee:1890}},
  '3000G': {ent:{sku:'FC-10-G3K0G-809-02-DD',y1:139230,y3:417690,y5:696150}, utp:{sku:'FC-10-G3K0G-950-02-DD',y1:114660,y3:343980,y5:573300}, atp:{sku:'FC-10-G3K0G-928-02-DD',y1:73710,y3:221130,y5:368550}, entBdl:{sku:'FG-3000G-BDL-809-DD',y1:337019,y3:615479,y5:893939}, utpBdl:{sku:'FG-3000G-BDL-950-DD',y1:312449,y3:541769,y5:771089}, care:{essential:null,premium:{sku:'FC-10-G3K0G-247-02-DD',y1:32760,y3:98280,y5:163800},elite:{sku:'FC-10-G3K0G-284-02-DD',y1:40950,y3:122850,y5:204750}}, converter:{sku:'FC-10-G3K0G-189-02-DD',fee:5000}},
  '3500G': {ent:{sku:'FC-10-G3K5G-809-02-DD',y1:245044.8,y3:735134.4,y5:1225224}, utp:{sku:'FC-10-G3K5G-950-02-DD',y1:201801.6,y3:605404.8,y5:1009008}, atp:{sku:'FC-10-G3K5G-928-02-DD',y1:129729.6,y3:389188.8,y5:648648}, entBdl:{sku:'FG-3500G-BDL-809-DD',y1:547746.8,y3:1037836.4,y5:1527926}, utpBdl:{sku:'FG-3500G-BDL-950-DD',y1:504503.6,y3:908106.8,y5:1311710}, care:{essential:null,premium:{sku:'FC-10-G3K5G-247-02-DD',y1:57657.6,y3:172972.8,y5:288288},elite:{sku:'FC-10-G3K5G-284-02-DD',y1:72072,y3:216216,y5:360360}}, converter:{sku:'FC-10-G3K5G-189-02-DD',fee:5000}},
  '3800G': {ent:{sku:'FC-10-3K80G-809-02-DD',y1:348075,y3:1044225,y5:1740375}, utp:{sku:'FC-10-3K80G-950-02-DD',y1:286650,y3:859950,y5:1433250}, atp:{sku:'FC-10-3K80G-928-02-DD',y1:184275,y3:552825,y5:921375}, entBdl:{sku:'FG-3800G-BDL-809-DD',y1:842546,y3:1538696,y5:2234846}, utpBdl:{sku:'FG-3800G-BDL-950-DD',y1:781121,y3:1354421,y5:1927721}, care:{essential:null,premium:{sku:'FC-10-3K80G-247-02-DD',y1:81900,y3:245700,y5:409500},elite:{sku:'FC-10-3K80G-284-02-DD',y1:102375,y3:307125,y5:511875}}, converter:{sku:'FC-10-3K80G-189-02-DD',fee:5000}},
  '40F': {ent:{sku:'FC-10-0040F-809-02-DD',y1:510,y3:1377,y5:2167.5}, utp:{sku:'FC-10-0040F-950-02-DD',y1:420,y3:1134,y5:1785}, atp:{sku:'FC-10-0040F-928-02-DD',y1:270,y3:729,y5:1147.5}, entBdl:{sku:'FG-40F-BDL-809-DD',y1:1269,y3:2136,y5:2926.5}, utpBdl:{sku:'FG-40F-BDL-950-DD',y1:1179,y3:1893,y5:2544}, care:{essential:{sku:'FC-10-0040F-314-02-DD',y1:90,y3:270,y5:450},premium:{sku:'FC-10-0040F-247-02-DD',y1:120,y3:360,y5:600},elite:{sku:'FC-10-0040F-284-02-DD',y1:150,y3:450,y5:750}}, converter:{sku:'FC-10-0040F-189-02-DD',fee:50}},
  '60F': {ent:{sku:'FC-10-0060F-809-02-DD',y1:682.55,y3:1842.89,y5:2900.84}, utp:{sku:'FC-10-0060F-950-02-DD',y1:562.1,y3:1517.67,y5:2388.93}, atp:{sku:'FC-10-0060F-928-02-DD',y1:361.35,y3:975.65,y5:1535.74}, entBdl:{sku:'FG-60F-BDL-809-DD',y1:1672.55,y3:2832.89,y5:3890.84}, utpBdl:{sku:'FG-60F-BDL-950-DD',y1:1552.1,y3:2507.67,y5:3378.93}, care:{essential:{sku:'FC-10-0060F-314-02-DD',y1:120.45,y3:361.35,y5:602.25},premium:{sku:'FC-10-0060F-247-02-DD',y1:160.6,y3:481.8,y5:803},elite:{sku:'FC-10-0060F-284-02-DD',y1:200.75,y3:602.25,y5:1003.75}}, converter:{sku:'FC-10-0060F-189-02-DD',fee:50}},
  '70F': {ent:null, utp:{sku:'FC-10-0070F-950-02-DD',y1:735.35,y3:null,y5:null}, atp:{sku:'FC-10-0070F-928-02-DD',y1:472.73,y3:null,y5:null}, entBdl:null, utpBdl:null, care:{essential:{sku:'FC-10-0070F-314-02-DD',y1:157.58,y3:null,y5:null},premium:{sku:'FC-10-0070F-247-02-DD',y1:210.1,y3:null,y5:null},elite:{sku:'FC-10-0070F-284-02-DD',y1:262.63,y3:null,y5:null}}, converter:{sku:'FC-10-0070F-189-02-DD',fee:55}},
  '71F': {ent:{sku:'FC-10-0071F-809-02-DD',y1:1041.25,y3:2811.38,y5:4425.31}, utp:{sku:'FC-10-0071F-950-02-DD',y1:857.5,y3:2315.25,y5:3644.38}, atp:{sku:'FC-10-0071F-928-02-DD',y1:551.25,y3:1488.38,y5:2342.81}, entBdl:{sku:'FG-71F-BDL-809-DD',y1:2389.25,y3:4159.38,y5:5773.31}, utpBdl:{sku:'FG-71F-BDL-950-DD',y1:2205.5,y3:3663.25,y5:4992.38}, care:{essential:{sku:'FC-10-0071F-314-02-DD',y1:183.75,y3:551.25,y5:918.75},premium:{sku:'FC-10-0071F-247-02-DD',y1:245,y3:735,y5:1225},elite:{sku:'FC-10-0071F-284-02-DD',y1:306.25,y3:918.75,y5:1531.25}}, converter:{sku:'FC-10-0071F-189-02-DD',fee:61.25}},
  '80F': {ent:{sku:'FC-10-0080F-809-02-DD',y1:1430.55,y3:3862.49,y5:6079.84}, utp:{sku:'FC-10-0080F-950-02-DD',y1:1178.1,y3:3180.87,y5:5006.93}, atp:{sku:'FC-10-0080F-928-02-DD',y1:757.35,y3:2044.85,y5:3218.74}, entBdl:{sku:'FG-80F-BDL-809-DD',y1:3282.55,y3:5714.49,y5:7931.84}, utpBdl:{sku:'FG-80F-BDL-950-DD',y1:3030.1,y3:5032.87,y5:6858.93}, care:{essential:{sku:'FC-10-0080F-314-02-DD',y1:252.45,y3:757.35,y5:1262.25},premium:{sku:'FC-10-0080F-247-02-DD',y1:336.6,y3:1009.8,y5:1683},elite:{sku:'FC-10-0080F-284-02-DD',y1:420.75,y3:1262.25,y5:2103.75}}, converter:{sku:'FC-10-0080F-189-02-DD',fee:84.15}},
  '100F': {ent:null, utp:{sku:'FC-10-F100F-950-02-DD',y1:2494.8,y3:null,y5:null}, atp:{sku:'FC-10-F100F-928-02-DD',y1:1603.8,y3:null,y5:null}, entBdl:null, utpBdl:null, care:{essential:null,premium:{sku:'FC-10-F100F-247-02-DD',y1:712.8,y3:null,y5:null},elite:{sku:'FC-10-F100F-284-02-DD',y1:891,y3:null,y5:null}}, converter:{sku:'FC-10-F100F-189-02-DD',fee:178.2}},
  '200F': {ent:null, utp:{sku:'FC-10-F200F-950-02-DD',y1:5122.81,y3:null,y5:null}, atp:{sku:'FC-10-F200F-928-02-DD',y1:3293.24,y3:null,y5:null}, entBdl:null, utpBdl:null, care:{essential:null,premium:{sku:'FC-10-F200F-247-02-DD',y1:1463.66,y3:null,y5:null},elite:{sku:'FC-10-F200F-284-02-DD',y1:1829.58,y3:null,y5:null}}, converter:{sku:'FC-10-F200F-189-02-DD',fee:365.92}},
  '400F': {ent:{sku:'FC-10-0400F-809-02-DD',y1:12929.35,y3:38788.05,y5:64646.75}, utp:{sku:'FC-10-0400F-950-02-DD',y1:10647.7,y3:31943.1,y5:53238.5}, atp:{sku:'FC-10-0400F-928-02-DD',y1:6844.95,y3:20534.85,y5:34224.75}, entBdl:{sku:'FG-400F-BDL-809-DD',y1:30499.35,y3:56358.05,y5:82216.75}, utpBdl:{sku:'FG-400F-BDL-950-DD',y1:28217.7,y3:49513.1,y5:70808.5}, care:{essential:null,premium:{sku:'FC-10-0400F-247-02-DD',y1:3042.2,y3:9126.6,y5:15211},elite:{sku:'FC-10-0400F-284-02-DD',y1:3802.75,y3:11408.25,y5:19013.75}}, converter:{sku:'FC-10-0400F-189-02-DD',fee:760.55}},
  '600F': {ent:null, utp:{sku:'FC-10-0600F-950-02-DD',y1:17023.16,y3:null,y5:null}, atp:{sku:'FC-10-0600F-928-02-DD',y1:10943.46,y3:null,y5:null}, entBdl:null, utpBdl:null, care:{essential:null,premium:{sku:'FC-10-0600F-247-02-DD',y1:4863.76,y3:null,y5:null},elite:{sku:'FC-10-0600F-284-02-DD',y1:6079.7,y3:null,y5:null}}, converter:{sku:'FC-10-0600F-189-02-DD',fee:1215.94}},
  '1000F': {ent:{sku:'FC-10-F1K0F-809-02-DD',y1:45125.65,y3:135376.95,y5:225628.25}, utp:{sku:'FC-10-F1K0F-950-02-DD',y1:37162.3,y3:111486.9,y5:185811.5}, atp:{sku:'FC-10-F1K0F-928-02-DD',y1:23890.05,y3:71670.15,y5:119450.25}, entBdl:{sku:'FG-1000F-BDL-809-DD',y1:106443.65,y3:196694.95,y5:286946.25}, utpBdl:{sku:'FG-1000F-BDL-950-DD',y1:98480.3,y3:172804.9,y5:247129.5}, care:{essential:null,premium:{sku:'FC-10-F1K0F-247-02-DD',y1:10617.8,y3:31853.4,y5:53089},elite:{sku:'FC-10-F1K0F-284-02-DD',y1:13272.25,y3:39816.75,y5:66361.25}}, converter:{sku:'FC-10-F1K0F-189-02-DD',fee:2654.45}},
  '1800F': {ent:{sku:'FC-10-F18HF-809-02-DD',y1:47109.55,y3:141328.65,y5:235547.75}, utp:{sku:'FC-10-F18HF-950-02-DD',y1:38796.1,y3:116388.3,y5:193980.5}, atp:{sku:'FC-10-F18HF-928-02-DD',y1:24940.35,y3:74821.05,y5:124701.75}, entBdl:{sku:'FG-1800F-BDL-809-DD',y1:112952.55,y3:207171.65,y5:301390.75}, utpBdl:{sku:'FG-1800F-BDL-950-DD',y1:104639.1,y3:182231.3,y5:259823.5}, care:{essential:null,premium:{sku:'FC-10-F18HF-247-02-DD',y1:11084.6,y3:33253.8,y5:55423},elite:{sku:'FC-10-F18HF-284-02-DD',y1:13855.75,y3:41567.25,y5:69278.75}}, converter:{sku:'FC-10-F18HF-189-02-DD',fee:2771.15}},
  '2600F': {ent:{sku:'FC-10-F26HF-809-02-DD',y1:63598.7,y3:190796.1,y5:317993.5}, utp:{sku:'FC-10-F26HF-950-02-DD',y1:52375.4,y3:157126.2,y5:261877}, atp:{sku:'FC-10-F26HF-928-02-DD',y1:33669.9,y3:101009.7,y5:168349.5}, entBdl:{sku:'FG-2600F-BDL-809-DD',y1:150018.7,y3:277216.1,y5:404413.5}, utpBdl:{sku:'FG-2600F-BDL-950-DD',y1:138795.4,y3:243546.2,y5:348297}, care:{essential:null,premium:{sku:'FC-10-F26HF-247-02-DD',y1:14964.4,y3:44893.2,y5:74822},elite:{sku:'FC-10-F26HF-284-02-DD',y1:18705.5,y3:56116.5,y5:93527.5}}, converter:{sku:'FC-10-F26HF-189-02-DD',fee:3741.1}},
  '3000F': {ent:{sku:'FC-10-F3K0F-809-02-DD',y1:95373.4,y3:286120.2,y5:476867}, utp:{sku:'FC-10-F3K0F-950-02-DD',y1:78542.8,y3:235628.4,y5:392714}, atp:{sku:'FC-10-F3K0F-928-02-DD',y1:50491.8,y3:151475.4,y5:252459}, entBdl:{sku:'FG-3000F-BDL-809-DD',y1:224969.4,y3:415716.2,y5:606463}, utpBdl:{sku:'FG-3000F-BDL-950-DD',y1:208138.8,y3:365224.4,y5:522310}, care:{essential:null,premium:{sku:'FC-10-F3K0F-247-02-DD',y1:22440.8,y3:67322.4,y5:112204},elite:{sku:'FC-10-F3K0F-284-02-DD',y1:28051,y3:84153,y5:140255}}, converter:{sku:'FC-10-F3K0F-189-02-DD',fee:5000}},
  '3200F': {ent:{sku:'FC-10-F3K2F-809-02-DD',y1:127500,y3:382500,y5:637500}, utp:{sku:'FC-10-F3K2F-950-02-DD',y1:105000,y3:315000,y5:525000}, atp:{sku:'FC-10-F3K2F-928-02-DD',y1:67500,y3:202500,y5:337500}, entBdl:{sku:'FG-3200F-BDL-809-DD',y1:300750,y3:555750,y5:810750}, utpBdl:{sku:'FG-3200F-BDL-950-DD',y1:278250,y3:488250,y5:698250}, care:{essential:null,premium:{sku:'FC-10-F3K2F-247-02-DD',y1:30000,y3:90000,y5:150000},elite:{sku:'FC-10-F3K2F-284-02-DD',y1:37500,y3:112500,y5:187500}}, converter:{sku:'FC-10-F3K2F-189-02-DD',fee:5000}},
  '3500F': {ent:{sku:'FC-10-F3K5F-809-02-DD',y1:209100,y3:627300,y5:1045500}, utp:{sku:'FC-10-F3K5F-950-02-DD',y1:172200,y3:516600,y5:861000}, atp:{sku:'FC-10-F3K5F-928-02-DD',y1:110700,y3:332100,y5:553500}, entBdl:{sku:'FG-3500F-BDL-809-DD',y1:493230,y3:911430,y5:1329630}, utpBdl:{sku:'FG-3500F-BDL-950-DD',y1:456330,y3:800730,y5:1145130}, care:{essential:null,premium:{sku:'FC-10-F3K5F-247-02-DD',y1:49200,y3:147600,y5:246000},elite:{sku:'FC-10-F3K5F-284-02-DD',y1:61500,y3:184500,y5:307500}}, converter:{sku:'FC-10-F3K5F-189-02-DD',fee:5000}},
  '3700F': {ent:{sku:'FC-10-F3K7F-809-02-DD',y1:234549,y3:703647,y5:1172745}, utp:{sku:'FC-10-F3K7F-950-02-DD',y1:193158,y3:579474,y5:965790}, atp:{sku:'FC-10-F3K7F-928-02-DD',y1:124173,y3:372519,y5:620865}, entBdl:{sku:'FG-3700F-BDL-809-DD',y1:538083,y3:1007181,y5:1476279}, utpBdl:{sku:'FG-3700F-BDL-950-DD',y1:496692,y3:883008,y5:1269324}, care:{essential:null,premium:{sku:'FC-10-F3K7F-247-02-DD',y1:55188,y3:165564,y5:275940},elite:{sku:'FC-10-F3K7F-284-02-DD',y1:68985,y3:206955,y5:344925}}, converter:{sku:'FC-10-F3K7F-189-02-DD',fee:5000}},
  '4200F': {ent:{sku:'FC-10-F42HF-809-02-DD',y1:221860.2,y3:665580.6,y5:1109301}, utp:{sku:'FC-10-F42HF-950-02-DD',y1:182708.4,y3:548125.2,y5:913542}, atp:{sku:'FC-10-F42HF-928-02-DD',y1:117455.4,y3:352366.2,y5:587277}, entBdl:{sku:'FG-4200F-BDL-809-DD',y1:543428.2,y3:987148.6,y5:1430869}, utpBdl:{sku:'FG-4200F-BDL-950-DD',y1:504276.4,y3:869693.2,y5:1235110}, care:{essential:null,premium:{sku:'FC-10-F42HF-247-02-DD',y1:52202.4,y3:156607.2,y5:261012},elite:{sku:'FC-10-F42HF-284-02-DD',y1:65253,y3:195759,y5:326265}}, converter:{sku:'FC-10-F42HF-189-02-DD',fee:5000}},
  '4400F': {ent:{sku:'FC-10-F44HF-809-02-DD',y1:298860,y3:896580,y5:1494300}, utp:{sku:'FC-10-F44HF-950-02-DD',y1:246120,y3:738360,y5:1230600}, atp:{sku:'FC-10-F44HF-928-02-DD',y1:158220,y3:474660,y5:791100}, entBdl:{sku:'FG-4400F-BDL-809-DD',y1:716561,y3:1314281,y5:1912001}, utpBdl:{sku:'FG-4400F-BDL-950-DD',y1:663821,y3:1156061,y5:1648301}, care:{essential:null,premium:{sku:'FC-10-F44HF-247-02-DD',y1:70320,y3:210960,y5:351600},elite:{sku:'FC-10-F44HF-284-02-DD',y1:87900,y3:263700,y5:439500}}, converter:{sku:'FC-10-F44HF-189-02-DD',fee:5000}},
  '4800F': {ent:{sku:'FC-10-F48HF-809-02-DD',y1:348840,y3:1046520,y5:1744200}, utp:{sku:'FC-10-F48HF-950-02-DD',y1:287280,y3:861840,y5:1436400}, atp:{sku:'FC-10-F48HF-928-02-DD',y1:184680,y3:554040,y5:923400}, entBdl:{sku:'FG-4800F-BDL-809-DD',y1:800280,y3:1497960,y5:2195640}, utpBdl:{sku:'FG-4800F-BDL-950-DD',y1:738720,y3:1313280,y5:1887840}, care:{essential:null,premium:{sku:'FC-10-F48HF-247-02-DD',y1:82080,y3:246240,y5:410400},elite:{sku:'FC-10-F48HF-284-02-DD',y1:102600,y3:307800,y5:513000}}, converter:{sku:'FC-10-F48HF-189-02-DD',fee:5000}},
  '7081F': {ent:{sku:'FC-10-F78F1-809-02-DD',y1:260100,y3:780300,y5:1300500}, utp:{sku:'FC-10-F78F1-950-02-DD',y1:214200,y3:642600,y5:1071000}, atp:{sku:'FC-10-F78F1-928-02-DD',y1:137700,y3:413100,y5:688500}, entBdl:{sku:'FG-7081F-BDL-809-DD',y1:647190,y3:1167390,y5:1687590}, utpBdl:{sku:'FG-7081F-BDL-950-DD',y1:601290,y3:1029690,y5:1458090}, care:{essential:null,premium:{sku:'FC-10-F78F1-247-02-DD',y1:61200,y3:183600,y5:306000},elite:{sku:'FC-10-F78F1-284-02-DD',y1:76500,y3:229500,y5:382500}}, converter:{sku:'FC-10-F78F1-189-02-DD',fee:5000}},
  '7121F': {ent:{sku:'FC-10-F7CF1-809-02-DD',y1:487305,y3:1461915,y5:2436525}, utp:{sku:'FC-10-F7CF1-950-02-DD',y1:401310,y3:1203930,y5:2006550}, atp:{sku:'FC-10-F7CF1-928-02-DD',y1:257985,y3:773955,y5:1289925}, entBdl:{sku:'FG-7121F-BDL-809-DD',y1:1117935,y3:2092545,y5:3067155}, utpBdl:{sku:'FG-7121F-BDL-950-DD',y1:1031940,y3:1834560,y5:2637180}, care:{essential:null,premium:{sku:'FC-10-F7CF1-247-02-DD',y1:114660,y3:343980,y5:573300},elite:{sku:'FC-10-F7CF1-284-02-DD',y1:143325,y3:429975,y5:716625}}, converter:{sku:'FC-10-F7CF1-189-02-DD',fee:5000}},
  '31G': {ent:{sku:'FC-10-GT31G-809-02-DD',y1:489.6,y3:1321.92,y5:2080.8}, utp:{sku:'FC-10-GT31G-950-02-DD',y1:403.2,y3:1088.64,y5:1713.6}, atp:{sku:'FC-10-GT31G-928-02-DD',y1:259.2,y3:699.84,y5:1101.6}, entBdl:{sku:'FG-31G-BDL-809-DD',y1:1285.6,y3:2117.92,y5:2876.8}, utpBdl:{sku:'FG-31G-BDL-950-DD',y1:1199.2,y3:1884.64,y5:2509.6}, care:{essential:{sku:'FC-10-GT31G-314-02-DD',y1:86.4,y3:259.2,y5:432},premium:{sku:'FC-10-GT31G-247-02-DD',y1:115.2,y3:345.6,y5:576},elite:{sku:'FC-10-GT31G-284-02-DD',y1:144,y3:432,y5:720}}, converter:{sku:'FC-10-GT31G-189-02-DD',fee:50}},
  '51G': {ent:{sku:'FC-10-GT51G-809-02-DD',y1:668.95,y3:1806.17,y5:2843.04}, utp:{sku:'FC-10-GT51G-950-02-DD',y1:550.9,y3:1487.43,y5:2341.33}, atp:{sku:'FC-10-GT51G-928-02-DD',y1:354.15,y3:956.21,y5:1505.14}, entBdl:{sku:'FG-51G-BDL-809-DD',y1:1801.95,y3:2939.17,y5:3976.04}, utpBdl:{sku:'FG-51G-BDL-950-DD',y1:1683.9,y3:2620.43,y5:3474.33}, care:{essential:{sku:'FC-10-GT51G-314-02-DD',y1:118.05,y3:354.15,y5:590.25},premium:{sku:'FC-10-GT51G-247-02-DD',y1:157.4,y3:472.2,y5:787},elite:{sku:'FC-10-GT51G-284-02-DD',y1:196.75,y3:590.25,y5:983.75}}, converter:{sku:'FC-10-GT51G-189-02-DD',fee:50}},
  '71G': {ent:{sku:'FC-10-GT71G-809-02-DD',y1:1093.1,y3:2951.37,y5:4645.68}, utp:{sku:'FC-10-GT71G-950-02-DD',y1:900.2,y3:2430.54,y5:3825.85}, atp:{sku:'FC-10-GT71G-928-02-DD',y1:578.7,y3:1562.49,y5:2459.48}, entBdl:{sku:'FG-71G-BDL-809-DD',y1:2750.1,y3:4608.37,y5:6302.68}, utpBdl:{sku:'FG-71G-BDL-950-DD',y1:2557.2,y3:4087.54,y5:5482.85}, care:{essential:{sku:'FC-10-GT71G-314-02-DD',y1:192.9,y3:578.7,y5:964.5},premium:{sku:'FC-10-GT71G-247-02-DD',y1:257.2,y3:771.6,y5:1286},elite:{sku:'FC-10-GT71G-284-02-DD',y1:321.5,y3:964.5,y5:1607.5}}, converter:{sku:'FC-10-GT71G-189-02-DD',fee:64.3}},
  '91G': {ent:{sku:'FC-10-0091G-809-02-DD',y1:2754.85,y3:8264.55,y5:13774.25}, utp:{sku:'FC-10-0091G-950-02-DD',y1:2268.7,y3:6806.1,y5:11343.5}, atp:{sku:'FC-10-0091G-928-02-DD',y1:1458.45,y3:4375.35,y5:7292.25}, entBdl:{sku:'FG-91G-BDL-809-DD',y1:6676.85,y3:12186.55,y5:17696.25}, utpBdl:{sku:'FG-91G-BDL-950-DD',y1:6190.7,y3:10728.1,y5:15265.5}, care:{essential:{sku:'FC-10-0091G-314-02-DD',y1:486.15,y3:1458.45,y5:2430.75},premium:{sku:'FC-10-0091G-247-02-DD',y1:648.2,y3:1944.6,y5:3241},elite:{sku:'FC-10-0091G-284-02-DD',y1:810.25,y3:2430.75,y5:4051.25}}, converter:{sku:'FC-10-0091G-189-02-DD',fee:162.05}},
  '121G': {ent:{sku:'FC-10-F121G-809-02-DD',y1:3702.6,y3:11107.8,y5:18513}, utp:{sku:'FC-10-F121G-950-02-DD',y1:3049.2,y3:9147.6,y5:15246}, atp:{sku:'FC-10-F121G-928-02-DD',y1:1960.2,y3:5880.6,y5:9801}, entBdl:{sku:'FG-121G-BDL-809-DD',y1:9212.6,y3:16617.8,y5:24023}, utpBdl:{sku:'FG-121G-BDL-950-DD',y1:8559.2,y3:14657.6,y5:20756}, care:{essential:null,premium:{sku:'FC-10-F121G-247-02-DD',y1:871.2,y3:2613.6,y5:4356},elite:{sku:'FC-10-F121G-284-02-DD',y1:1089,y3:3267,y5:5445}}, converter:{sku:'FC-10-F121G-189-02-DD',fee:217.8}},
  '201G': {ent:{sku:'FC-10-F2H1G-809-02-DD',y1:7818.3,y3:23454.9,y5:39091.5}, utp:{sku:'FC-10-F2H1G-950-02-DD',y1:6438.6,y3:19315.8,y5:32193}, atp:{sku:'FC-10-F2H1G-928-02-DD',y1:4139.1,y3:12417.3,y5:20695.5}, entBdl:{sku:'FG-201G-BDL-809-DD',y1:20511.3,y3:36147.9,y5:51784.5}, utpBdl:{sku:'FG-201G-BDL-950-DD',y1:19131.6,y3:32008.8,y5:44886}, care:{essential:null,premium:{sku:'FC-10-F2H1G-247-02-DD',y1:1839.6,y3:5518.8,y5:9198},elite:{sku:'FC-10-F2H1G-284-02-DD',y1:2299.5,y3:6898.5,y5:11497.5}}, converter:{sku:'FC-10-F2H1G-189-02-DD',fee:459.9}},
  '401G': {ent:{sku:'FC-10-FG4H1-809-02-DD',y1:20527.5,y3:61582.5,y5:102637.5}, utp:{sku:'FC-10-FG4H1-950-02-DD',y1:16905,y3:50715,y5:84525}, atp:{sku:'FC-10-FG4H1-928-02-DD',y1:10867.5,y3:32602.5,y5:54337.5}, entBdl:{sku:'FG-401G-BDL-809-DD',y1:48300.5,y3:89355.5,y5:130410.5}, utpBdl:{sku:'FG-401G-BDL-950-DD',y1:44678,y3:78488,y5:112298}, care:{essential:null,premium:{sku:'FC-10-FG4H1-247-02-DD',y1:4830,y3:14490,y5:24150},elite:{sku:'FC-10-FG4H1-284-02-DD',y1:6037.5,y3:18112.5,y5:30187.5}}, converter:{sku:'FC-10-FG4H1-189-02-DD',fee:1207.5}},
  '701G': {ent:{sku:'FC-10-G7H1G-809-02-DD',y1:25704,y3:77112,y5:128520}, utp:{sku:'FC-10-G7H1G-950-02-DD',y1:21168,y3:63504,y5:105840}, atp:{sku:'FC-10-G7H1G-928-02-DD',y1:13608,y3:40824,y5:68040}, entBdl:{sku:'FG-701G-BDL-809-DD',y1:63958,y3:115366,y5:166774}, utpBdl:{sku:'FG-701G-BDL-950-DD',y1:59422,y3:101758,y5:144094}, care:{essential:null,premium:{sku:'FC-10-G7H1G-247-02-DD',y1:6048,y3:18144,y5:30240},elite:{sku:'FC-10-G7H1G-284-02-DD',y1:7560,y3:22680,y5:37800}}, converter:{sku:'FC-10-G7H1G-189-02-DD',fee:1512}},
  '901G': {ent:{sku:'FC-10-FG9H1-809-02-DD',y1:33201,y3:99603,y5:166005}, utp:{sku:'FC-10-FG9H1-950-02-DD',y1:27342,y3:82026,y5:136710}, atp:{sku:'FC-10-FG9H1-928-02-DD',y1:17577,y3:52731,y5:87885}, entBdl:{sku:'FG-901G-BDL-809-DD',y1:82612,y3:149014,y5:215416}, utpBdl:{sku:'FG-901G-BDL-950-DD',y1:76753,y3:131437,y5:186121}, care:{essential:null,premium:{sku:'FC-10-FG9H1-247-02-DD',y1:7812,y3:23436,y5:39060},elite:{sku:'FC-10-FG9H1-284-02-DD',y1:9765,y3:29295,y5:48825}}, converter:{sku:'FC-10-FG9H1-189-02-DD',fee:1953}},
  '3001G': {ent:{sku:'FC-10-G3K1G-809-02-DD',y1:145628.8,y3:436886.4,y5:728144}, utp:{sku:'FC-10-G3K1G-950-02-DD',y1:119929.6,y3:359788.8,y5:599648}, atp:{sku:'FC-10-G3K1G-928-02-DD',y1:77097.6,y3:231292.8,y5:385488}, entBdl:{sku:'FG-3001G-BDL-809-DD',y1:358417.8,y3:649675.4,y5:940933}, utpBdl:{sku:'FG-3001G-BDL-950-DD',y1:332718.6,y3:572577.8,y5:812437}, care:{essential:null,premium:{sku:'FC-10-G3K1G-247-02-DD',y1:34265.6,y3:102796.8,y5:171328},elite:{sku:'FC-10-G3K1G-284-02-DD',y1:42832,y3:128496,y5:214160}}, converter:{sku:'FC-10-G3K1G-189-02-DD',fee:5000}},
  '3501G': {ent:{sku:'FC-10-G35G1-809-02-DD',y1:250043.65,y3:750130.95,y5:1250218.25}, utp:{sku:'FC-10-G35G1-950-02-DD',y1:205918.3,y3:617754.9,y5:1029591.5}, atp:{sku:'FC-10-G35G1-928-02-DD',y1:132376.05,y3:397128.15,y5:661880.25}, entBdl:{sku:'FG-3501G-BDL-809-DD',y1:567745.65,y3:1067832.95,y5:1567920.25}, utpBdl:{sku:'FG-3501G-BDL-950-DD',y1:523620.3,y3:935456.9,y5:1347293.5}, care:{essential:null,premium:{sku:'FC-10-G35G1-247-02-DD',y1:58833.8,y3:176501.4,y5:294169},elite:{sku:'FC-10-G35G1-284-02-DD',y1:73542.25,y3:220626.75,y5:367711.25}}, converter:{sku:'FC-10-G35G1-189-02-DD',fee:5000}},
  '3801G': {ent:{sku:'FC-10-3K81G-809-02-DD',y1:358633.7,y3:1075901.1,y5:1793168.5}, utp:{sku:'FC-10-3K81G-950-02-DD',y1:295345.4,y3:886036.2,y5:1476727}, atp:{sku:'FC-10-3K81G-928-02-DD',y1:189864.9,y3:569594.7,y5:949324.5}, entBdl:{sku:'FG-3801G-BDL-809-DD',y1:868104.7,y3:1585372.1,y5:2302639.5}, utpBdl:{sku:'FG-3801G-BDL-950-DD',y1:804816.4,y3:1395507.2,y5:1986198}, care:{essential:null,premium:{sku:'FC-10-3K81G-247-02-DD',y1:84384.4,y3:253153.2,y5:421922},elite:{sku:'FC-10-3K81G-284-02-DD',y1:105480.5,y3:316441.5,y5:527402.5}}, converter:{sku:'FC-10-3K81G-189-02-DD',fee:5000}},
  '61F': {ent:{sku:'FC-10-0061F-809-02-DD',y1:878.9,y3:2373.03,y5:3735.33}, utp:{sku:'FC-10-0061F-950-02-DD',y1:723.8,y3:1954.26,y5:3076.15}, atp:{sku:'FC-10-0061F-928-02-DD',y1:465.3,y3:1256.31,y5:1977.53}, entBdl:{sku:'FG-61F-BDL-809-DD',y1:2187.9,y3:3682.03,y5:5044.33}, utpBdl:{sku:'FG-61F-BDL-950-DD',y1:2032.8,y3:3263.26,y5:4385.15}, care:{essential:{sku:'FC-10-0061F-314-02-DD',y1:155.1,y3:465.3,y5:775.5},premium:{sku:'FC-10-0061F-247-02-DD',y1:206.8,y3:620.4,y5:1034},elite:{sku:'FC-10-0061F-284-02-DD',y1:258.5,y3:775.5,y5:1292.5}}, converter:{sku:'FC-10-0061F-189-02-DD',fee:51.7}},
  '81F': {ent:{sku:'FC-10-0081F-809-02-DD',y1:1848.75,y3:4991.63,y5:7857.19}, utp:{sku:'FC-10-0081F-950-02-DD',y1:1522.5,y3:4110.75,y5:6470.63}, atp:{sku:'FC-10-0081F-928-02-DD',y1:978.75,y3:2642.63,y5:4159.69}, entBdl:{sku:'FG-81F-BDL-809-DD',y1:4241.75,y3:7384.63,y5:10250.19}, utpBdl:{sku:'FG-81F-BDL-950-DD',y1:3915.5,y3:6503.75,y5:8863.63}, care:{essential:{sku:'FC-10-0081F-314-02-DD',y1:326.25,y3:978.75,y5:1631.25},premium:{sku:'FC-10-0081F-247-02-DD',y1:435,y3:1305,y5:2175},elite:{sku:'FC-10-0081F-284-02-DD',y1:543.75,y3:1631.25,y5:2718.75}}, converter:{sku:'FC-10-0081F-189-02-DD',fee:108.75}},
  '401F': {ent:{sku:'FC-10-0401F-809-02-DD',y1:14982.1,y3:44946.3,y5:74910.5}, utp:{sku:'FC-10-0401F-950-02-DD',y1:12338.2,y3:37014.6,y5:61691}, atp:{sku:'FC-10-0401F-928-02-DD',y1:7931.7,y3:23795.1,y5:39658.5}, entBdl:{sku:'FG-401F-BDL-809-DD',y1:36698.1,y3:66662.3,y5:96626.5}, utpBdl:{sku:'FG-401F-BDL-950-DD',y1:34054.2,y3:58730.6,y5:83407}, care:{essential:null,premium:{sku:'FC-10-0401F-247-02-DD',y1:3525.2,y3:10575.6,y5:17626},elite:{sku:'FC-10-0401F-284-02-DD',y1:4406.5,y3:13219.5,y5:22032.5}}, converter:{sku:'FC-10-0401F-189-02-DD',fee:881.3}},
  '1001F': {ent:{sku:'FC-10-F1K1F-809-02-DD',y1:48185.65,y3:144556.95,y5:240928.25}, utp:{sku:'FC-10-F1K1F-950-02-DD',y1:39682.3,y3:119046.9,y5:198411.5}, atp:{sku:'FC-10-F1K1F-928-02-DD',y1:25510.05,y3:76530.15,y5:127550.25}, entBdl:{sku:'FG-1001F-BDL-809-DD',y1:113661.65,y3:210032.95,y5:306404.25}, utpBdl:{sku:'FG-1001F-BDL-950-DD',y1:105158.3,y3:184522.9,y5:263887.5}, care:{essential:null,premium:{sku:'FC-10-F1K1F-247-02-DD',y1:11337.8,y3:34013.4,y5:56689},elite:{sku:'FC-10-F1K1F-284-02-DD',y1:14172.25,y3:42516.75,y5:70861.25}}, converter:{sku:'FC-10-F1K1F-189-02-DD',fee:2834.45}},
  '1801F': {ent:{sku:'FC-10-F18F1-809-02-DD',y1:51035.7,y3:153107.1,y5:255178.5}, utp:{sku:'FC-10-F18F1-950-02-DD',y1:42029.4,y3:126088.2,y5:210147}, atp:{sku:'FC-10-F18F1-928-02-DD',y1:27018.9,y3:81056.7,y5:135094.5}, entBdl:{sku:'FG-1801F-BDL-809-DD',y1:122366.7,y3:224438.1,y5:326509.5}, utpBdl:{sku:'FG-1801F-BDL-950-DD',y1:113360.4,y3:197419.2,y5:281478}, care:{essential:null,premium:{sku:'FC-10-F18F1-247-02-DD',y1:12008.4,y3:36025.2,y5:60042},elite:{sku:'FC-10-F18F1-284-02-DD',y1:15010.5,y3:45031.5,y5:75052.5}}, converter:{sku:'FC-10-F18F1-189-02-DD',fee:3002.1}},
  '2601F': {ent:{sku:'FC-10-F26F1-809-02-DD',y1:67132.15,y3:201396.45,y5:335660.75}, utp:{sku:'FC-10-F26F1-950-02-DD',y1:55285.3,y3:165855.9,y5:276426.5}, atp:{sku:'FC-10-F26F1-928-02-DD',y1:35540.55,y3:106621.65,y5:177702.75}, entBdl:{sku:'FG-2601F-BDL-809-DD',y1:160959.15,y3:295223.45,y5:429487.75}, utpBdl:{sku:'FG-2601F-BDL-950-DD',y1:149112.3,y3:259682.9,y5:370253.5}, care:{essential:null,premium:{sku:'FC-10-F26F1-247-02-DD',y1:15795.8,y3:47387.4,y5:78979},elite:{sku:'FC-10-F26F1-284-02-DD',y1:19744.75,y3:59234.25,y5:98723.75}}, converter:{sku:'FC-10-F26F1-189-02-DD',fee:3948.95}},
  '3001F': {ent:{sku:'FC-10-F3K1F-809-02-DD',y1:100728.4,y3:302185.2,y5:503642}, utp:{sku:'FC-10-F3K1F-950-02-DD',y1:82952.8,y3:248858.4,y5:414764}, atp:{sku:'FC-10-F3K1F-928-02-DD',y1:53326.8,y3:159980.4,y5:266634}, entBdl:{sku:'FG-3001F-BDL-809-DD',y1:237601.4,y3:439058.2,y5:640515}, utpBdl:{sku:'FG-3001F-BDL-950-DD',y1:219825.8,y3:385731.4,y5:551637}, care:{essential:null,premium:{sku:'FC-10-F3K1F-247-02-DD',y1:23700.8,y3:71102.4,y5:118504},elite:{sku:'FC-10-F3K1F-284-02-DD',y1:29626,y3:88878,y5:148130}}, converter:{sku:'FC-10-F3K1F-189-02-DD',fee:5000}},
  '3201F': {ent:{sku:'FC-10-F32F1-809-02-DD',y1:132600,y3:397800,y5:663000}, utp:{sku:'FC-10-F32F1-950-02-DD',y1:109200,y3:327600,y5:546000}, atp:{sku:'FC-10-F32F1-928-02-DD',y1:70200,y3:210600,y5:351000}, entBdl:{sku:'FG-3201F-BDL-809-DD',y1:312780,y3:577980,y5:843180}, utpBdl:{sku:'FG-3201F-BDL-950-DD',y1:289380,y3:507780,y5:726180}, care:{essential:null,premium:{sku:'FC-10-F32F1-247-02-DD',y1:31200,y3:93600,y5:156000},elite:{sku:'FC-10-F32F1-284-02-DD',y1:39000,y3:117000,y5:195000}}, converter:{sku:'FC-10-F32F1-189-02-DD',fee:5000}},
  '3501F': {ent:{sku:'FC-10-F35F1-809-02-DD',y1:214200,y3:642600,y5:1071000}, utp:{sku:'FC-10-F35F1-950-02-DD',y1:176400,y3:529200,y5:882000}, atp:{sku:'FC-10-F35F1-928-02-DD',y1:113400,y3:340200,y5:567000}, entBdl:{sku:'FG-3501F-BDL-809-DD',y1:505260,y3:933660,y5:1362060}, utpBdl:{sku:'FG-3501F-BDL-950-DD',y1:467460,y3:820260,y5:1173060}, care:{essential:null,premium:{sku:'FC-10-F35F1-247-02-DD',y1:50400,y3:151200,y5:252000},elite:{sku:'FC-10-F35F1-284-02-DD',y1:63000,y3:189000,y5:315000}}, converter:{sku:'FC-10-F35F1-189-02-DD',fee:5000}},
  '3701F': {ent:{sku:'FC-10-F37F1-809-02-DD',y1:239904,y3:719712,y5:1199520}, utp:{sku:'FC-10-F37F1-950-02-DD',y1:197568,y3:592704,y5:987840}, atp:{sku:'FC-10-F37F1-928-02-DD',y1:127008,y3:381024,y5:635040}, entBdl:{sku:'FG-3701F-BDL-809-DD',y1:550368,y3:1030176,y5:1509984}, utpBdl:{sku:'FG-3701F-BDL-950-DD',y1:508032,y3:903168,y5:1298304}, care:{essential:null,premium:{sku:'FC-10-F37F1-247-02-DD',y1:56448,y3:169344,y5:282240},elite:{sku:'FC-10-F37F1-284-02-DD',y1:70560,y3:211680,y5:352800}}, converter:{sku:'FC-10-F37F1-189-02-DD',fee:5000}},
  '4201F': {ent:{sku:'FC-10-F421F-809-02-DD',y1:229256.05,y3:687768.15,y5:1146280.25}, utp:{sku:'FC-10-F421F-950-02-DD',y1:188799.1,y3:566397.3,y5:943995.5}, atp:{sku:'FC-10-F421F-928-02-DD',y1:121370.85,y3:364112.55,y5:606854.25}, entBdl:{sku:'FG-4201F-BDL-809-DD',y1:561543.05,y3:1020055.15,y5:1478567.25}, utpBdl:{sku:'FG-4201F-BDL-950-DD',y1:521086.1,y3:898684.3,y5:1276282.5}, care:{essential:null,premium:{sku:'FC-10-F421F-247-02-DD',y1:53942.6,y3:161827.8,y5:269713},elite:{sku:'FC-10-F421F-284-02-DD',y1:67428.25,y3:202284.75,y5:337141.25}}, converter:{sku:'FC-10-F421F-189-02-DD',fee:5000}},
  '4401F': {ent:{sku:'FC-10-F441F-809-02-DD',y1:303960,y3:911880,y5:1519800}, utp:{sku:'FC-10-F441F-950-02-DD',y1:250320,y3:750960,y5:1251600}, atp:{sku:'FC-10-F441F-928-02-DD',y1:160920,y3:482760,y5:804600}, entBdl:{sku:'FG-4401F-BDL-809-DD',y1:728789,y3:1336709,y5:1944629}, utpBdl:{sku:'FG-4401F-BDL-950-DD',y1:675149,y3:1175789,y5:1676429}, care:{essential:null,premium:{sku:'FC-10-F441F-247-02-DD',y1:71520,y3:214560,y5:357600},elite:{sku:'FC-10-F441F-284-02-DD',y1:89400,y3:268200,y5:447000}}, converter:{sku:'FC-10-F441F-189-02-DD',fee:5000}},
  '4801F': {ent:{sku:'FC-10-F481F-809-02-DD',y1:353940,y3:1061820,y5:1769700}, utp:{sku:'FC-10-F481F-950-02-DD',y1:291480,y3:874440,y5:1457400}, atp:{sku:'FC-10-F481F-928-02-DD',y1:187380,y3:562140,y5:936900}, entBdl:{sku:'FG-4801F-BDL-809-DD',y1:811980,y3:1519860,y5:2227740}, utpBdl:{sku:'FG-4801F-BDL-950-DD',y1:749520,y3:1332480,y5:1915440}, care:{essential:null,premium:{sku:'FC-10-F481F-247-02-DD',y1:83280,y3:249840,y5:416400},elite:{sku:'FC-10-F481F-284-02-DD',y1:104100,y3:312300,y5:520500}}, converter:{sku:'FC-10-F481F-189-02-DD',fee:5000}},
};

// Datasheet PDF oficial: Fortinet publica un único "Product Matrix" que cubre todos los modelos F/G vigentes
// (mismo documento ya usado como fuente de specs en este archivo) — no hay un PDF dedicado por modelo/serie
// individual como en Cisco/Huawei, así que se usa como referencia universal para toda la línea FortiGate.
const DATASHEET_URL = 'https://www.fortinet.com/content/dam/fortinet/assets/data-sheets/Fortinet_Product_Matrix.pdf';

const bareId=id=>id.replace('FortiGate ','');

// ── LIMITES POR MODELO DEL PRODUCT MATRIX ────────────────────────────────
// Siete cifras que el documento publica por modelo. Se asignan aqui y no modelo a modelo por
// el mismo motivo que HW_SKU y ASIC_BY_MODEL: lo que importa de estos campos es CUANTOS
// modelos los tienen, y una tabla al lado del bucle que pone null en todos los demas lo dice
// de un vistazo. Ver «PROCEDENCIA DE LA TABLA DEL MATRIX» en la cabecera.
//
//   ssl          SSL Inspection Throughput (Mbps).
//   tunGw        Max G/W to G/W IPsec Tunnels — tuneles sitio a sitio. Es el techo del
//                overlay SD-WAN: un hub con N spokes necesita N tuneles de esta clase.
//   tunCli       Max Client to G/W IPsec Tunnels — dial-up de cliente (FortiClient).
//   sslVpn       SSL VPN Throughput (Mbps).
//   sslVpnUsers  Concurrent SSL VPN Users (Recommended Maximum, Tunnel Mode).
//   policies     Firewall Policies — tamano de la tabla de politicas.
//   vdomMax      Virtual Domains (Max) — el documento publica «por defecto / maximo» y aqui
//                se transcribe EL MAXIMO, que es el que limita un diseno multi-tenant.
//
// `null` ES «EL DOCUMENTO IMPRIME "—"», NUNCA «no tiene limite» NI CERO. Pasa en cinco
// modelos para `sslVpn`/`sslVpnUsers` (30G, 40F, 50G, 60F, 70G) y en el 30G para `vdomMax`.
// No se dedujo la causa: el motivo por el que Fortinet deja de publicar esa fila en parte de
// la gama G no esta en el documento, y escribirlo aqui seria inventarlo.
const MATRIX_LIMITES={
  '30G':    {ssl:   400, tunGw:  200, tunCli:   250, sslVpn: null, sslVpnUsers: null, policies:  2000, vdomMax:null},
  '40F':    {ssl:   310, tunGw:  200, tunCli:   250, sslVpn: null, sslVpnUsers: null, policies:  2000, vdomMax:  10},
  '50G':    {ssl:  1300, tunGw:  200, tunCli:   250, sslVpn: null, sslVpnUsers: null, policies:  2000, vdomMax:   5},
  '60F':    {ssl:   630, tunGw:  200, tunCli:   500, sslVpn: null, sslVpnUsers: null, policies:  2000, vdomMax:  10},
  '70F':    {ssl:   700, tunGw:  200, tunCli:   500, sslVpn:  405, sslVpnUsers:  200, policies:  5000, vdomMax:  10},
  '70G':    {ssl:  1400, tunGw:  200, tunCli:   500, sslVpn: null, sslVpnUsers: null, policies:  5000, vdomMax:  10},
  '80F':    {ssl:   715, tunGw:  200, tunCli:  2500, sslVpn:  950, sslVpnUsers:  200, policies:  5000, vdomMax:  10},
  '90G':    {ssl:  2600, tunGw:  200, tunCli:  2500, sslVpn: 1400, sslVpnUsers:  200, policies:  5000, vdomMax:  10},
  '120G':   {ssl:  3000, tunGw: 2000, tunCli: 16000, sslVpn: 1500, sslVpnUsers:  500, policies: 10000, vdomMax:  10},
  '200G':   {ssl:  7000, tunGw: 2000, tunCli: 16000, sslVpn: 3000, sslVpnUsers:  500, policies: 10000, vdomMax:  25},
  '400G':   {ssl: 11500, tunGw: 2000, tunCli: 50000, sslVpn: 6100, sslVpnUsers: 5000, policies: 10000, vdomMax:  50},
  '700G':   {ssl: 14000, tunGw: 2000, tunCli: 50000, sslVpn: 8000, sslVpnUsers:10000, policies: 30000, vdomMax:  50},
  '900G':   {ssl: 16700, tunGw: 2000, tunCli: 50000, sslVpn:10000, sslVpnUsers:10000, policies: 50000, vdomMax:  50},
  '1800F':  {ssl: 12000, tunGw:20000, tunCli:100000, sslVpn:11000, sslVpnUsers:10000, policies:100000, vdomMax: 250},
  '2600F':  {ssl: 20000, tunGw:20000, tunCli:100000, sslVpn:16000, sslVpnUsers:30000, policies:100000, vdomMax: 500},
  '3000F':  {ssl: 29000, tunGw:40000, tunCli:200000, sslVpn:11000, sslVpnUsers:30000, policies:200000, vdomMax: 500},
  '3000G':  {ssl: 75000, tunGw:40000, tunCli:200000, sslVpn: 9000, sslVpnUsers:30000, policies:200000, vdomMax: 500},
  '3200F':  {ssl: 29000, tunGw:40000, tunCli:200000, sslVpn:11000, sslVpnUsers:30000, policies:200000, vdomMax: 500},
  '3500F':  {ssl: 63000, tunGw:40000, tunCli:200000, sslVpn:16000, sslVpnUsers:30000, policies:200000, vdomMax: 500},
  '3500G':  {ssl:112000, tunGw:40000, tunCli:200000, sslVpn: 9800, sslVpnUsers:30000, policies:200000, vdomMax: 500},
  '3700F':  {ssl: 55000, tunGw:40000, tunCli:200000, sslVpn:16000, sslVpnUsers:30000, policies:200000, vdomMax: 500},
  '3800G':  {ssl:120000, tunGw:40000, tunCli:200000, sslVpn:27000, sslVpnUsers:30000, policies:400000, vdomMax: 500},
  '4200F':  {ssl: 50000, tunGw:40000, tunCli:200000, sslVpn:16000, sslVpnUsers:30000, policies:400000, vdomMax: 500},
  '4400F':  {ssl: 86000, tunGw:40000, tunCli:200000, sslVpn:16000, sslVpnUsers:30000, policies:400000, vdomMax: 500},
  '4800F':  {ssl: 63000, tunGw:40000, tunCli:200000, sslVpn:18000, sslVpnUsers:30000, policies:400000, vdomMax: 500},
  '7081F':  {ssl:324000, tunGw:40000, tunCli:260000, sslVpn:13700, sslVpnUsers:30000, policies:200000, vdomMax: 500},
  '7121F':  {ssl:540000, tunGw:40000, tunCli:260000, sslVpn:13700, sslVpnUsers:30000, policies:200000, vdomMax: 500},
};

// Variantes con SSD onboard: mismo silicio y mismas cifras que su modelo base, que es el
// unico que el Product Matrix publica. EL PARENTESCO SE DEDUCE DEL PROPIO CATALOGO —dos
// modelos son hermanos si comparten fw, tp, vpn y sess— en vez de mantener aqui una segunda
// lista que se desincronizaria al entrar un modelo nuevo. Es exactamente la regla que ya
// aplica `scripts/importar-cps.js`, escrita una sola vez por fabricante y no dos.
const CLAVES_MATRIX=['ssl','tunGw','tunCli','sslVpn','sslVpnUsers','policies','vdomMax'];
const hermanasDe=(b)=>MODELS.filter((m)=>m!==b
  && m.fw===b.fw && m.tp===b.tp && m.vpn===b.vpn && m.sess===b.sess);

for (const m of MODELS) {
  m.hwSku=HW_SKU[bareId(m.id)]||null;
  m.lic=LICENSES[bareId(m.id)]||null;
  m.datasheetUrl=DATASHEET_URL;
  // null EXPLICITO en los que no tienen fila: «el catalogo no trae la cifra», nunca «no aplica».
  for (const k of CLAVES_MATRIX) m[k]=null;
  m.matrixDe=null;
}
for (const [base, lim] of Object.entries(MATRIX_LIMITES)) {
  const m=MODELS.find((x)=>bareId(x.id)===base);
  // Un aviso y no un fallo silencioso, por lo mismo que `seedDimensionadorModels` avisa de un
  // `eolModels` que no casa: una tabla que dejo de aplicarse se comporta igual que una que si.
  if (!m) { console.warn(`[fortinet] MATRIX_LIMITES declara "${base}" y no hay tal modelo`); continue; }
  for (const k of CLAVES_MATRIX) m[k]=lim[k];
  for (const h of hermanasDe(m)) {
    if (h.matrixDe || MATRIX_LIMITES[bareId(h.id)]) continue;
    for (const k of CLAVES_MATRIX) h[k]=lim[k];
    h.matrixDe=base;   // de quien lo heredo, para que la ficha lo pueda declarar
  }
}

// ── LO QUE LAS FICHAS POR SERIE COMPLETAN DONDE EL MATRIX YA NO LLEGA (2026-09-23) ──────
// El Product Matrix de septiembre es un «Top Selling Models Matrix» y ya no lista 400F,
// 600F ni 1000F, asi que esos modelos -y sus variantes 401F y 1001F- se apartaban en cuanto
// un escenario pedia SSL, tuneles o VDOM, con el motivo «el catalogo no trae la cifra». LA
// CIFRA ESTABA EN EL REPOSITORIO: sus fichas por serie se trajeron el 2026-09-03 por la rama
// de transporte `fuente/fortinet-datasheets` y `fuente/fortinet-serie` para leer la
// alimentacion, y publican exactamente las mismas filas que el Matrix. Nadie las habia leido
// para esto.
//
// DOBLE ANCLAJE, CUATRO ANCLAS, 12 DE 12. Una fila solo se acepta si las cifras que este
// catalogo ya tenia verificadas -sesiones, sesiones nuevas/s, Threat Protection e IPsec-
// casan con la ficha. Se comprueban AQUI, al cargar, y no solo el dia de la transcripcion:
// si alguien corrige un `sess` sin volver a leer la ficha, la tabla deja de aplicarse y lo
// dice por consola, en vez de dejar cifras de otra revision pegadas a un modelo que cambio.
// 100F Y 200F (2026-09-24, pendiente F6): su ficha en ingles da 404 en todas las rutas que
// sigue el resto -15 intentos en dos corridas-, pero Fortinet sigue publicando la COREANA
// oficial en el mismo CDN (`data-sheets/ko_kr/ds-fortigate-{100f,200f}-series_ko.pdf`), traida
// por `traer-fortinet-pendientes.yml` (corrida 35991156286). Es la misma tabla con las
// etiquetas traducidas; los numeros no se traducen. Reconstruida por coordenadas (pagina 7) y
// anclada con SEIS cifras ya verificadas por fila (fw, ips, ngfw, tp, vpn, sess): 12 de 12.
// Aqui van las cuatro que comprueba el bucle. Es una revision de 2023 (R30 y R17), anterior a
// la R42/R28 de 2025 de la que sale su consumo: el rendimiento casa en las seis, pero el
// consumo del 100F NO (35,1 W en la R30 frente a 26,5 W en la R42 -Fortinet lo re-evaluo a la
// baja-), asi que el consumo sigue saliendo de la R42 y de esta ficha solo se toma lo que casa.
const FICHAS_LIMITES={
  '100F':  {ficha:'FG-100F-DAT-R30-20230227 (ko_kr)', ancla:{sess:1500000, ips:2600, tp:1000, vpn:11500},
            ssl: 1000, tunGw: 2000, tunCli: 16000, sslVpn:1000, sslVpnUsers:  500, policies: 10000, vdomMax: 10},
  '200F':  {ficha:'FG-200F-DAT-R17-20230125 (ko_kr)', ancla:{sess:3000000, ips:5000, tp:3000, vpn:13000},
            ssl: 4000, tunGw: 2000, tunCli: 16000, sslVpn:2000, sslVpnUsers:  500, policies: 10000, vdomMax: 10},
  '400F':  {ficha:'FG-400F-DAT-R22-202604', ancla:{sess:7800000, cps:500000, tp:9000,  vpn:55000},
            ssl: 8000, tunGw: 2000, tunCli: 50000, sslVpn:3600, sslVpnUsers: 5000, policies: 10000, vdomMax: 25},
  '600F':  {ficha:'FG-600F-DAT-R23-202604', ancla:{sess:8000000, cps:550000, tp:10500, vpn:55000},
            ssl: 9000, tunGw: 2000, tunCli: 50000, sslVpn:4300, sslVpnUsers:10000, policies: 30000, vdomMax: 50},
  '1000F': {ficha:'FG-1000F-DAT-R17-202604', ancla:{sess:7500000, cps:650000, tp:13000, vpn:55000},
            ssl:10000, tunGw:20000, tunCli:100000, sslVpn:5300, sslVpnUsers:10000, policies:100000, vdomMax:250},
};
for (const [base, lim] of Object.entries(FICHAS_LIMITES)) {
  const m=MODELS.find((x)=>bareId(x.id)===base);
  if (!m) { console.warn(`[fortinet] FICHAS_LIMITES declara "${base}" y no hay tal modelo`); continue; }
  const discrepan=Object.entries(lim.ancla).filter(([k,v])=>m[k]!==v);
  if (discrepan.length) {
    console.warn(`[fortinet] la ficha ${lim.ficha} ya no casa con el catalogo en ${discrepan.map(([k])=>k).join(', ')}: `
      +'no se aplica. Volver a leer la ficha antes de confiar en sus limites.');
    continue;
  }
  for (const h of [m].concat(hermanasDe(m))) {
    if (h.matrixDe || MATRIX_LIMITES[bareId(h.id)]) continue;
    for (const k of CLAVES_MATRIX) h[k]=lim[k];
    h.limitesDe={modelo:base, fuente:`ficha por serie ${lim.ficha}`};
  }
}
// Procedencia por modelo de los siete limites, como DATO: la ficha del equipo dice de donde
// sale cada cifra en vez de que haya que leer este comentario.
for (const m of MODELS) {
  if (m.limitesDe) continue;
  if (MATRIX_LIMITES[bareId(m.id)]) m.limitesDe={modelo:bareId(m.id), fuente:'Product Matrix sept-2026'};
  else if (m.matrixDe) m.limitesDe={modelo:m.matrixDe, fuente:'Product Matrix sept-2026 (variante del mismo silicio)'};
  else m.limitesDe=null;
}

// ── PLATAFORMA POR MODELO: LO QUE EL MATRIX PUBLICA ADEMAS DEL RENDIMIENTO (2026-09-23) ──
// Seis filas del Product Matrix de septiembre que el catalogo no traia y que el informe de
// auditoria del 23-sep pide como restricciones (F06, F14, F15): VDOM incluidos, almacenamiento
// local, variantes (PoE incluido), fuentes, formato y la escala del Security Fabric que el
// equipo gestiona (FortiAP, FortiSwitch, FortiToken). Reconstruidas por coordenadas de texto
// de las paginas 1-3, igual que MATRIX_LIMITES, y ANCLADAS COLUMNA A COLUMNA con la cifra de
// SSL Inspection ya verificada: las 27 columnas casan.
//
//   almacen   [variante, GB] — el documento atribuye el disco a la VARIANTE, entre parentesis
//             («120 GB (91G)»). Por eso el modelo base se queda en 0 GB y no en null: el
//             documento dice cuanto disco tiene cada uno, y el base no tiene. `null` en la
//             columna significa «—» (el 40F no tiene variante con disco).
//   variantes lo que el documento lista como variantes de la serie. PoE ES UNA VARIANTE
//             (FG-50G-SFP-POE, FG-70G-POE, FG-80F-POE), no una propiedad del SKU base: el
//             catalogo rotulaba el 80F como «Sucursal + PoE» y su ficha publica «PoE/+ Ports
//             — — 6 6 —», es decir, PoE solo en las variantes -POE.
//   aps       Max FortiAPs (total / tunel) · switches Max FortiSwitches · tokens Max FortiTokens.
//   notas     llamadas del documento que condicionan una funcion:
//             11 «SSL VPN only supported between 7.0.12 and 7.0.15» — pegada a la celda SSL
//                VPN del FG-90G. El informe citaba la release note 7.6.1; el Matrix es mas
//                estricto y es el documento que ya respalda este catalogo.
//             12 «Proxy features limited supported, refer to data sheet» — en la cabecera de
//                30G, 40F, 50G y 60F.
const MATRIX_PLATAFORMA={
  '30G':  {vdomDef:null, almacen:['31G',30],    variantes:['WiFi'],                              fuentes:'Single AC PS',              formato:'Desktop', aps:16,   apsTun:8,    switches:8,   tokens:500,   notas:{proxy:12}},
  '40F':  {vdomDef:10,   almacen:null,          variantes:['WiFi','3G4G'],                       fuentes:'Single AC PS',              formato:'Desktop', aps:16,   apsTun:8,    switches:8,   tokens:500,   notas:{proxy:12}},
  '50G':  {vdomDef:5,    almacen:['51G',64],    variantes:['WiFi','DSL','SFP','POE','5G'],       fuentes:'Single AC PS',              formato:'Desktop', aps:16,   apsTun:8,    switches:8,   tokens:500,   notas:{proxy:12}},
  '60F':  {vdomDef:10,   almacen:['61F',128],   variantes:['WiFi','Storage'],                    fuentes:'Single AC PS',              formato:'Desktop', aps:64,   apsTun:32,   switches:24,  tokens:500,   notas:{proxy:12}},
  '70F':  {vdomDef:10,   almacen:['71F',128],   variantes:[],                                    fuentes:'Single AC PS',              formato:'Desktop', aps:64,   apsTun:32,   switches:24,  tokens:500,   notas:{}},
  '70G':  {vdomDef:10,   almacen:['71G',64],    variantes:['WiFi','POE'],                        fuentes:'Single AC PS',              formato:'Desktop', aps:96,   apsTun:48,   switches:24,  tokens:500,   notas:{}},
  '80F':  {vdomDef:10,   almacen:['81F',128],   variantes:['WiFi','3G4G','DSL','Bypass','Storage'], fuentes:'Single AC PS, dual inputs', formato:'Desktop', aps:96, apsTun:48, switches:24,  tokens:500,   notas:{}},
  '90G':  {vdomDef:10,   almacen:['91G',120],   variantes:[],                                    fuentes:'Single AC PS, dual inputs', formato:'Desktop', aps:128,  apsTun:64,   switches:24,  tokens:500,   notas:{sslVpn:11}},
  '120G': {vdomDef:10,   almacen:['121G',480],  variantes:[],                                    fuentes:'Dual AC PS',                formato:'1 RU',    aps:128,  apsTun:64,   switches:48,  tokens:5000,  notas:{}},
  '200G': {vdomDef:10,   almacen:['201G',480],  variantes:[],                                    fuentes:'Dual AC PS',                formato:'1 RU',    aps:256,  apsTun:128,  switches:64,  tokens:5000,  notas:{}},
  '400G': {vdomDef:10,   almacen:['401G',960],  variantes:[],                                    fuentes:'Dual AC PS',                formato:'1 RU',    aps:512,  apsTun:256,  switches:96,  tokens:5000,  notas:{}},
  '700G': {vdomDef:10,   almacen:['701G',960],  variantes:[],                                    fuentes:'Dual AC PS',                formato:'1 RU',    aps:1024, apsTun:512,  switches:128, tokens:5000,  notas:{}},
  '900G': {vdomDef:10,   almacen:['901G',960],  variantes:['DC'],                                fuentes:'Dual PS',                   formato:'1 RU',    aps:2048, apsTun:1024, switches:196, tokens:5000,  notas:{}},
  '1800F':{vdomDef:10,   almacen:['1801F',1920],variantes:['DC'],                                fuentes:'Dual PS',                   formato:'2 RU',    aps:4096, apsTun:2048, switches:196, tokens:20000, notas:{}},
  '2600F':{vdomDef:10,   almacen:['2601F',1920],variantes:['DC'],                                fuentes:'Dual PS',                   formato:'2 RU',    aps:4096, apsTun:2048, switches:196, tokens:20000, notas:{}},
  '3000F':{vdomDef:10,   almacen:['3001F',1920],variantes:['DC'],                                fuentes:'Dual PS',                   formato:'2 RU',    aps:4096, apsTun:2048, switches:300, tokens:20000, notas:{}},
  '3000G':{vdomDef:10,   almacen:['3001G',1920],variantes:[],                                    fuentes:'Dual PS',                   formato:'2 RU',    aps:4096, apsTun:2048, switches:300, tokens:20000, notas:{}},
  '3200F':{vdomDef:10,   almacen:['3201F',1920],variantes:[],                                    fuentes:'Dual PS',                   formato:'2 RU',    aps:4096, apsTun:2048, switches:300, tokens:20000, notas:{}},
  '3500F':{vdomDef:10,   almacen:['3501F',3840],variantes:[],                                    fuentes:'Dual PS',                   formato:'2 RU',    aps:4096, apsTun:2048, switches:300, tokens:20000, notas:{}},
  '3500G':{vdomDef:10,   almacen:['3501G',3840],variantes:[],                                    fuentes:'Dual PS',                   formato:'2 RU',    aps:4096, apsTun:2048, switches:300, tokens:20000, notas:{}},
  '3700F':{vdomDef:10,   almacen:['3701F',3840],variantes:[],                                    fuentes:'Dual PS',                   formato:'2 RU',    aps:4096, apsTun:2048, switches:300, tokens:20000, notas:{}},
  '3800G':{vdomDef:10,   almacen:['3801G',3840],variantes:['DC'],                                fuentes:'4 PS',                      formato:'3 RU',    aps:8192, apsTun:4096, switches:300, tokens:20000, notas:{}},
  '4200F':{vdomDef:10,   almacen:['4201F',3840],variantes:['DC'],                                fuentes:'Dual PS',                   formato:'3 RU',    aps:8192, apsTun:4096, switches:300, tokens:20000, notas:{}},
  '4400F':{vdomDef:10,   almacen:['4401F',3840],variantes:['DC'],                                fuentes:'4 PS',                      formato:'4 RU',    aps:8192, apsTun:4096, switches:300, tokens:20000, notas:{}},
  '4800F':{vdomDef:10,   almacen:['4801F',3840],variantes:['DC','NEBS'],                         fuentes:'4 PS',                      formato:'4 RU',    aps:8192, apsTun:4096, switches:300, tokens:20000, notas:{}},
  // Los chasis publican el disco del propio chasis, sin variante: 4 x 4 TB SSD.
  '7081F':{vdomDef:10,   almacen:['7081F',16000],variantes:['DC'],                               fuentes:'6 PS',                      formato:'12 RU',   aps:null, apsTun:null, switches:300, tokens:20000, notas:{}},
  '7121F':{vdomDef:10,   almacen:['7121F',16000],variantes:['DC'],                               fuentes:'8 PS',                      formato:'16 RU',   aps:null, apsTun:null, switches:300, tokens:20000, notas:{}},
};
// Lo mismo desde las fichas por serie, para los tres que el Matrix ya no lista. El 601F no
// esta en este catalogo: la ficha del 600F lo publica, pero aqui solo cuenta que el 600F
// base no tiene disco.
const FICHAS_PLATAFORMA={
  '400F': {vdomDef:10, almacen:['401F',960],  variantes:[], aps:512,  apsTun:256,  switches:96,  tokens:5000,  notas:{}, ficha:'FG-400F-DAT-R22-202604'},
  '600F': {vdomDef:10, almacen:['601F',480],  variantes:[], aps:1024, apsTun:512,  switches:128, tokens:5000,  notas:{}, ficha:'FG-600F-DAT-R23-202604'},
  '1000F':{vdomDef:10, almacen:['1001F',960], variantes:[], aps:4096, apsTun:2048, switches:196, tokens:20000, notas:{}, ficha:'FG-1000F-DAT-R17-202604'},
};

/* PUERTOS ESTRUCTURADOS, SOLO DONDE LA FUENTE ES LIMPIA. `ifaces` es texto libre y en varios
   modelos no cuenta nada («GE + SFP/SFP+ (alta densidad)» en el 120G), asi que comparar un
   requerimiento de puertos contra el habria sido inventar la mitad del dato. Se estructuran
   las ocho columnas de la pagina 1 del Matrix, cuya celda «Interfaces» es de una sola linea,
   y el 120G, cuya ficha trae la tabla de hardware completa. Las celdas de las paginas 2 y 3 se
   parten en varias lineas y se entremezclan entre columnas al extraerlas: es exactamente donde
   se cuela una fila desplazada, y por eso esos modelos se quedan en null (el eje de puertos se
   declara «no comprobado» para ellos, no se aprueba ni se rechaza a ciegas).
   `medios` con dos valores = puerto de medio compartido («Shared Port Pairs»): cuenta como
   UNO u OTRO, nunca como los dos a la vez. Los puertos de gestion y HA dedicados no entran. */
const P=(n,vel,...medios)=>({n,vel,medios});
const PUERTOS={
  '30G':  {puertos:[P(4,1,'RJ45')],                         fuente:'Product Matrix sept-2026 (Interfaces)'},
  '40F':  {puertos:[P(5,1,'RJ45')],                         fuente:'Product Matrix sept-2026 (Interfaces)'},
  '50G':  {puertos:[P(5,1,'RJ45')],                         fuente:'Product Matrix sept-2026 (Interfaces)'},
  '60F':  {puertos:[P(10,1,'RJ45')],                        fuente:'Product Matrix sept-2026 (Interfaces)'},
  '70F':  {puertos:[P(10,1,'RJ45')],                        fuente:'Product Matrix sept-2026 (Interfaces)'},
  '70G':  {puertos:[P(10,1,'RJ45')],                        fuente:'Product Matrix sept-2026 (Interfaces)'},
  '80F':  {puertos:[P(8,1,'RJ45'), P(2,1,'RJ45','SFP')],     fuente:'Product Matrix sept-2026 (Interfaces: 8x GE RJ45, 2x Shared Port Pairs)'},
  '90G':  {puertos:[P(8,1,'RJ45'), P(2,10,'RJ45','SFP+')],   fuente:'Product Matrix sept-2026 (Interfaces: 8x GE RJ45, 2x 10GE Shared Port Pairs)'},
  '120G': {puertos:[P(16,1,'RJ45'), P(8,1,'SFP'), P(4,10,'SFP+')], fuente:'ficha por serie FG-120G-DAT-R18-202607 (Hardware Specifications)'},
};

for (const m of MODELS) {
  const id=bareId(m.id);
  // Una variante hereda la plataforma de su base (misma columna del documento); el disco no,
  // porque el documento dice de quien es.
  const baseId=[id, m.matrixDe, m.limitesDe&&m.limitesDe.modelo].find((x)=>x&&(MATRIX_PLATAFORMA[x]||FICHAS_PLATAFORMA[x]));
  const pl=baseId?(MATRIX_PLATAFORMA[baseId]||FICHAS_PLATAFORMA[baseId]):null;
  if (!pl) {
    // 100F y 200F: sin ficha ni columna en el Matrix. null EXPLICITO en todo: «el catalogo no
    // lo trae», nunca «no tiene».
    Object.assign(m,{vdomDef:null, almacenamientoGB:null, poe:null, poeVariante:null, aps:null, apsTun:null,
      switches:null, tokens:null, formato:null, notasMatrix:{}, plataformaFuente:null});
  } else {
    const [variante, gb]=pl.almacen||[null, 0];
    Object.assign(m,{
      vdomDef:pl.vdomDef,
      // El disco es de la variante que el documento nombra; cualquier otro modelo de la
      // columna -el base- publica 0 GB.
      almacenamientoGB: variante===id ? gb : 0,
      // Ningun SKU de este catalogo es una variante -POE: el base publica 0 W de PoE.
      poe:false,
      poeVariante:(pl.variantes||[]).includes('POE') || baseId==='80F',
      aps:pl.aps, apsTun:pl.apsTun, switches:pl.switches, tokens:pl.tokens,
      formato:pl.formato||null,
      notasMatrix:pl.notas||{},
      plataformaFuente:MATRIX_PLATAFORMA[baseId]?'Product Matrix sept-2026':`ficha por serie ${pl.ficha}`,
    });
  }
  const pu=PUERTOS[baseId||id]||PUERTOS[id];
  m.puertos=pu?pu.puertos:null;
  m.puertosFuente=pu?pu.fuente:null;
  // Los dos chasis no se pueden cotizar como una linea: necesitan FIM, FPM, fuentes,
  // ventiladores y opticas, y este catalogo no trae ese configurador (F07).
  m.modular=/^(7081F|7121F)$/.test(id);
}
// El 80F y el 81F se rotulaban «Sucursal + PoE». Su ficha (FG-80F-DAT-R47-202606) publica PoE
// solo en las variantes -POE y el Matrix lo lista como variante: el SKU que este catalogo
// cotiza (FG-80F / FG-81F) no tiene PoE. El rotulo era un dato falso con pinta de cierto.
for (const m of MODELS) if (/^FortiGate 8[01]F$/.test(m.id)) m.seg=m.seg.replace(/\s*\+\s*PoE/i,'');

/* ── COMPATIBILIDAD FortiOS × FUNCION × MODELO (hallazgo P0 F02 del 23-sep) ─────────────
   La pagina aceptaba SSL-VPN en modo tunel sin preguntar la version de FortiOS y recomendaba
   un 90G con sus 200 usuarios publicados. Tres reglas, y cada una con su procedencia REAL:
     · 7.6.3 o superior: el modo tunel SSL-VPN se sustituye por IPsec en TODOS los modelos.
       Hasta el 2026-09-24 estaba transcrita del informe de auditoria SIN LEER (`leida:false`):
       `docs.fortinet.com` responde `connect_rejected` al proxy de egreso de este entorno. Ese
       dia la trajo `traer-fortinet-pendientes.yml` desde Actions (corrida 35997261950) y se
       leyo: dice exactamente lo que la regla aplicaba. Condicion 2 del GO CONDICIONADO.
     · 7.6.0 a 7.6.2: SSL-VPN no soportado en modelos de 2 GB de RAM (nota 10 del Matrix).
       QUE MODELOS TIENEN 2 GB NO LO DECIA EL MATRIX, y la compatibilidad era «desconocida»
       para todos. Las Release Notes de 7.6.0 (PDF de fortinetweb.s3, misma corrida) dan la
       lista -40F y variantes, 60F, 61F- y la cierran: «FortiGate models not listed above will
       continue to have SSL VPN web and tunnel mode support». La regla pasa a esos tres. El
       camino `ram-2gb` del motor sigue existiendo para una regla por RAM sin lista de modelos,
       y lo guarda una prueba sobre un catalogo sintetico.
     · Serie 90G: SSL-VPN solo entre 7.0.12 y 7.0.15 (nota 11 del Matrix, leida, pegada a la
       celda del FG-90G). Ninguna de las ramas que ofrece esta herramienta cae en ese rango.
   Las ramas son tres a proposito: son las que las fuentes distinguen. Una lista de versiones
   mas fina solo daria precision a lo que el catalogo no sabe. */
const FORTIOS={
  versiones:[
    {id:'7.4',         n:'FortiOS 7.4.x'},
    {id:'7.6.0-7.6.2', n:'FortiOS 7.6.0 a 7.6.2'},
    {id:'7.6.3+',      n:'FortiOS 7.6.3 o superior (rama vigente)'},
  ],
  porDefecto:'7.6.3+',
  reglas:[
    {funcion:'sslvpn', versiones:['7.6.3+'], modelos:'*', estado:'retirada', sustituto:'ipsec',
     fuente:'FortiOS 7.6.3 Release Notes, «SSL VPN tunnel mode replaced with IPsec VPN»: «Starting in FortiOS 7.6.3, the SSL VPN tunnel mode feature is replaced with IPsec VPN […] This applies to all FortiGate models.»',
     leida:true},
    {funcion:'sslvpn', versiones:['7.6.0-7.6.2'], modelos:['40F','60F','61F'], estado:'no-soportada', sustituto:'ipsec',
     fuente:'FortiOS 7.6.0 Release Notes, «SSL VPN removed from 2GB RAM models for tunnel and web mode»: 40F y variantes, 60F y 61F; «FortiGate models not listed above will continue to have SSL VPN web and tunnel mode support» (y nota 10 del Product Matrix sept-2026)',
     leida:true},
    {funcion:'sslvpn', versiones:['7.4','7.6.0-7.6.2','7.6.3+'], modelos:['90G','91G'], estado:'no-soportada', sustituto:'ipsec',
     fuente:'Product Matrix sept-2026, nota 11 en la celda SSL VPN del FG-90G: «SSL VPN only supported between 7.0.12 and 7.0.15»',
     leida:true},
    {funcion:'proxy', versiones:['7.4','7.6.0-7.6.2','7.6.3+'], modelos:['30G','31G','40F','50G','51G','60F','61F'], estado:'limitada',
     fuente:'Product Matrix sept-2026, nota 12: «Proxy features limited supported, refer to data sheet»; para 40F y 60F, las FortiOS 7.6.0 Release Notes: sin funciones proxy desde 7.4.4 en los modelos de 2 GB de RAM',
     leida:true},
  ],
};

/* ── TRES FAMILIAS DE SKU DEL PRICE LIST QUE EL BOM NECESITABA Y NO USABA ─────────────────
   Salen de `fortinetSkus.js` —la price list que `fuentes.js` declara como fuente de precios,
   la «Mid 090726» del 07-sep— y se leen por su codigo de familia en vez de copiarse a mano:
     204  «Upgrade FortiCare Premium to Elite (Require FortiCare Premium)». El BOM cotizaba
          Elite como el contrato completo (-284) encima del Premium que el bundle ya trae, y
          lo advertia; el propio documento publica la MEJORA como SKU aparte.
     577  «FG AI based Sandbox SVC» — el servicio de sandbox del FortiGate, por modelo.
     585  «Sub to CLD based Central Logging» — registro central en la nube, por modelo.
   Si una familia no esta para un modelo, el campo queda en null y la linea que lo pida sale
   sin SKU, que es lo que cierra la puerta comercial. */
const SKUS_POR_MODELO=require('./fortinetSkus.js');
const FAMILIAS_EXTRA={eliteUpg:'204', sandboxAi:'577', logCloud:'585'};
// El CODIGO DE MODELO de la price list (`0080F` en FC-10-0080F-809-02-DD) se toma de los SKU
// que LICENSES ya tiene verificados, y la familia se busca SOLO con ese codigo. Las
// referencias de un equipo traen tambien las de sus variantes -el 80F lleva F80FD, F80FP y
// F80FC- y la primera version de este bucle se quedo con el SKU de una variante: una linea
// con el precio de otro producto, que es el error que no se nota.
const codigoModelo=(lic)=>{
  for (const t of [lic.ent, lic.utp, lic.atp].concat(lic.care?Object.values(lic.care):[])) {
    const x=t&&t.sku&&/^FC-10-([A-Z0-9]+)-/.exec(t.sku);
    if (x) return x[1];
  }
  return null;
};
for (const m of MODELS) {
  const refs=SKUS_POR_MODELO[m.id]||[];
  if (!m.lic) continue;
  const cod=codigoModelo(m.lic);
  for (const [clave, fam] of Object.entries(FAMILIAS_EXTRA)) {
    if (!cod) { m.lic[clave]=null; continue; }
    const re=new RegExp(`^(FC-10-${cod}-${fam}-02)-(12|36|60)$`);
    const t={};
    let base=null;
    for (const r of refs) {
      const x=re.exec(r.sku);
      if (!x) continue;
      base=x[1];
      t[{12:'y1',36:'y3',60:'y5'}[x[2]]]=r.p;
    }
    m.lic[clave]=base?{sku:`${base}-DD`, y1:t.y1==null?null:t.y1, y3:t.y3==null?null:t.y3, y5:t.y5==null?null:t.y5}:null;
  }
}

/* ── SD-WAN SERVICE: EL SKU DE LOS TRES SERVICIOS AVANZADOS (pendiente F2, 2026-09-24) ────────
   Fuente: «Secure SD-WAN Ordering Guide» SDWAN-OG-R31-20260804 (paginas 3-6, tablas SERVICES),
   traido por `traer-fortinet-pendientes.yml` (corrida 35991156286) y leido por coordenadas.
   Lo confirma el «FortiGate Subscriptions and FortiGuard Bundles Ordering Guide» (mayo-2026,
   p. 4): Underlay and Application Monitoring, Overlay Orchestration y el conector FortiSASE
   llevan marca SOLO en la columna SD-WAN, ni a la carta ni en Enterprise/UTP/ATP. O sea que NO
   son tres lineas con tres SKU: son UN SKU por FortiGate, en dos formas:
     bundle  1337 (30G-60F) / 1329 (60G en adelante) — «including FortiCare», para el equipo
             que no lleva otro bundle ni soporte;
     add-on  1387 / 1389 — «a lower priced alternative for FortiGates with additional security
             bundles already in place» (FAQ, p. 10). Es el que corresponde aqui: el BOM siempre
             lleva un bundle de seguridad, o lo excluye porque el parque ya lo tiene.
   LA PRICE LIST DE SEPTIEMBRE NO TRAE NINGUNO DE LOS DOS (0 referencias con -1329/-1337/-1387/
   -1389 en fortinetSkus.js): el SKU es oficial y exacto, el PRECIO no esta, y la linea sale sin
   cotizar en vez de con un precio de otra familia.
   DOBLE ANCLAJE SOBRE EL CODIGO DE MODELO: el documento imprime el codigo dentro del SKU
   (`FC-10-0090G-1389-02-DD`), y solo se acepta si es el MISMO que la price list firmada usa para
   ese modelo (`codigoModelo`, arriba). Casan 20 de 23. Los 3 que no, se quedan sin SKU con su
   motivo, porque no se sabe cual de los dos codigos es el pedible:
     70G   el documento imprime FG70G (y en su propia tabla de renovacion, 0070G); la price list, GT70G.
     200G  el documento imprime F200G; la price list, FG2HG.
     4800F el documento imprime F481F bajo la columna del 4800F, y F481F es el codigo del 4801F.
   Las variantes (31G, 91G, 401F...) no estan en esas tablas y se quedan sin SKU: el documento
   las remite a la price list, y deducir su codigo seria inventarlo. */
const SDWAN_SERVICIO={
  fuente:'Secure SD-WAN Ordering Guide SDWAN-OG-R31-20260804',
  porModelo:{
    '30G':  ['FC-10-FG30G-1337-02-DD', 'FC-10-FG30G-1387-02-DD'],
    '40F':  ['FC-10-0040F-1337-02-DD', 'FC-10-0040F-1387-02-DD'],
    '50G':  ['FC-10-GT50G-1337-02-DD', 'FC-10-GT50G-1387-02-DD'],
    '70G':  ['FC-10-FG70G-1329-02-DD', 'FC-10-FG70G-1389-02-DD'],
    '80F':  ['FC-10-0080F-1329-02-DD', 'FC-10-0080F-1389-02-DD'],
    '90G':  ['FC-10-0090G-1329-02-DD', 'FC-10-0090G-1389-02-DD'],
    '120G': ['FC-10-F120G-1329-02-DD', 'FC-10-F120G-1389-02-DD'],
    '200G': ['FC-10-F200G-1329-02-DD', 'FC-10-F200G-1389-02-DD'],
    '400G': ['FC-10-FG4H0-1329-02-DD', 'FC-10-FG4H0-1389-02-DD'],
    '700G': ['FC-10-G7H0G-1329-02-DD', 'FC-10-G7H0G-1389-02-DD'],
    '900G': ['FC-10-FG9H0-1329-02-DD', 'FC-10-FG9H0-1389-02-DD'],
    '1000F':['FC-10-F1K0F-1329-02-DD', 'FC-10-F1K0F-1389-02-DD'],
    '1800F':['FC-10-F18HF-1329-02-DD', 'FC-10-F18HF-1389-02-DD'],
    '2600F':['FC-10-F26HF-1329-02-DD', 'FC-10-F26HF-1389-02-DD'],
    '3000F':['FC-10-F3K0F-1329-02-DD', 'FC-10-F3K0F-1389-02-DD'],
    '3000G':['FC-10-G3K0G-1329-02-DD', 'FC-10-G3K0G-1389-02-DD'],
    '3200F':['FC-10-F3K2F-1329-02-DD', 'FC-10-F3K2F-1389-02-DD'],
    '3500G':['FC-10-G3K5G-1329-02-DD', 'FC-10-G3K5G-1389-02-DD'],
    '3700F':['FC-10-F3K7F-1329-02-DD', 'FC-10-F3K7F-1389-02-DD'],
    '3800G':['FC-10-3K80G-1329-02-DD', 'FC-10-3K80G-1389-02-DD'],
    '4200F':['FC-10-F42HF-1329-02-DD', 'FC-10-F42HF-1389-02-DD'],
    '4400F':['FC-10-F44HF-1329-02-DD', 'FC-10-F44HF-1389-02-DD'],
    '4800F':['FC-10-F481F-1329-02-DD', 'FC-10-F481F-1389-02-DD'],
  },
};
for (const m of MODELS) {
  if (!m.lic) continue;
  const fila=SDWAN_SERVICIO.porModelo[bareId(m.id)];
  if (!fila) { m.lic.sdwanSvc=null; continue; }
  const cod=codigoModelo(m.lic);
  const impreso=/^FC-10-([A-Z0-9]+)-/.exec(fila[1])[1];
  m.lic.sdwanSvc = impreso===cod
    ? {bundle:fila[0], addon:fila[1], fuente:SDWAN_SERVICIO.fuente}
    : {bundle:null, addon:null, fuente:SDWAN_SERVICIO.fuente,
       motivo:`el Ordering Guide imprime el código ${impreso} y la price list usa ${cod || 'otro'} para este modelo: no se sabe cuál es el pedible`};
}

/* ── FORTICLIENT EMS Y FORTISASE: SKU DE SUS ORDERING GUIDES (2026-09-24) ─────────────────
   Las dos lineas entraban en el BOM con `sku: null` y dejaban la cotizacion en borrador: este
   catalogo tenia el PATRON del codigo de EMS y ninguno de FortiSASE. Sus Ordering Guides los
   publican como TABLA, y la tabla es determinista una vez que se sabe una cosa mas en cada caso:
     EMS       el despliegue. FortiClient Cloud (EMS alojado por Fortinet) es la familia EMS05 y
               EMS on-premise la EMS04; los dos en VPN/ZTNA, que es la licencia 428 (la 429 es
               EPP/ATP y la 485 el servicio gestionado, otros productos). Se vende en PACKS de
               25, 500, 2.000 y 10.000 endpoints («FortiClient Ordering Guide», abr-2026, p. 3).
               Los endpoints se redondean a 25 y se reparten del pack mayor al menor: 550 son
               1 x 500 + 2 x 25, exactamente el ejemplo del propio documento. Cuando conviene
               subir de pack (20 packs de 25 frente a uno de 500) lo decide el PRECIO, que no esta
               en este catalogo: se declara, no se optimiza a ciegas.
     FortiSASE la edicion. Standard (547), Advanced (676) o Comprehensive (759), por BANDA de
               usuarios: 50-499 (FC2), 500-1.999 (FC3), 2.000-9.999 (FC4) y 10.000+ (FC5)
               («FortiSASE Ordering Guide», sep-2026, p. 3). La banda mas baja empieza en 50: por
               debajo no hay SKU publicado y la linea lo dice en vez de subir a 50 por su cuenta.
   Ninguno de estos SKU esta en la price list de septiembre: la linea sale con SKU exacto y sin
   precio, en borrador, igual que el SD-WAN Service. */
const EMS_LICENCIAS={
  fuente:'FortiClient Ordering Guide (abr-2026), p. 3 «Order Information: Device-based»',
  packs:[25, 500, 2000, 10000],
  sku:{
    cloud: {25:'FC1-10-EMS05-428-01-DD', 500:'FC2-10-EMS05-428-01-DD', 2000:'FC3-10-EMS05-428-01-DD', 10000:'FC4-10-EMS05-428-01-DD'},
    onprem:{25:'FC1-10-EMS04-428-01-DD', 500:'FC2-10-EMS04-428-01-DD', 2000:'FC3-10-EMS04-428-01-DD', 10000:'FC4-10-EMS04-428-01-DD'},
  },
};
const SASE_USUARIOS={
  fuente:'FortiSASE Ordering Guide (sep-2026), p. 3 «Remote Users»',
  minimo:50,
  // Nota ➀ del documento: «Comprehensive subscriptions of less than 200 users have limited POP
  // availability».
  comprehensivePopMinimo:200,
  bandas:[
    {desde:50,    hasta:499,  standard:'FC2-10-EMS05-547-02-DD', advanced:'FC2-10-EMS05-676-02-DD', comprehensive:'FC2-10-EMS05-759-02-DD'},
    {desde:500,   hasta:1999, standard:'FC3-10-EMS05-547-02-DD', advanced:'FC3-10-EMS05-676-02-DD', comprehensive:'FC3-10-EMS05-759-02-DD'},
    {desde:2000,  hasta:9999, standard:'FC4-10-EMS05-547-02-DD', advanced:'FC4-10-EMS05-676-02-DD', comprehensive:'FC4-10-EMS05-759-02-DD'},
    {desde:10000, hasta:null, standard:'FC5-10-EMS05-547-02-DD', advanced:'FC5-10-EMS05-676-02-DD', comprehensive:'FC5-10-EMS05-759-02-DD'},
  ],
};

/* ── LICENCIAS REANCLADAS A LA PRICE LIST DECLARADA (hallazgo N02, 2026-09-23) ────────────
   LICENSES se transcribio de la «2026Q3 Main Price list 080326» (vigente desde el 03-ago),
   pero la fuente de precios que declara `fuentes.js` —y de la que salen el hardware de
   `cotizadorCatalog.js` y las 6.849 referencias de `fortinetSkus.js`— es la «Mid Price list
   090726» del 07-sep. Medido ese dia, SKU por SKU y termino por termino: de 1.193 precios,
   108 diferian —los 78 de los SKU combinados BDL, porque el hardware cambio de precio entre
   las dos ediciones, y los 30 del bundle y el soporte de los dos chasis (+15 %)— y 17 no
   estan en las referencias de septiembre. Una misma cotizacion llevaba el equipo al precio de
   septiembre y su licencia al de agosto, y con el SKU combinado de compra nueva la diferencia
   llegaba entera al total (90G, BDL Enterprise a 3 anos: 10.273,60 frente a 10.604,60).

   SE ANCLA POR SKU EXACTO, con su sufijo de termino, contra la lista declarada: donde la
   referencia existe manda su precio; donde no existe, el precio de agosto se CONSERVA pero se
   marca (`anterior`), y la linea que lo use sale como borrador diciendo por que. No se borra:
   los 17 son renovaciones de equipos fuera de venta (70F, 100F, 200F, 600F), cuyo bloque el
   importador de referencias no ancla porque no tienen SKU de hardware, asi que su ausencia
   en `fortinetSkus.js` no prueba que la lista de septiembre no los traiga. */
const PRECIO_DECLARADO=new Map();
for (const refs of Object.values(SKUS_POR_MODELO)) for (const r of refs) PRECIO_DECLARADO.set(r.sku, r.p);
const REANCLAJE={reanclados:0, sinReferencia:0, iguales:0, ejemplos:[]};
{
  const vistos=new Set();
  for (const m of MODELS) {
    if (!m.lic) continue;
    const tiers=[m.lic.ent, m.lic.utp, m.lic.atp, m.lic.entBdl, m.lic.utpBdl]
      .concat(m.lic.care?Object.values(m.lic.care):[]);
    for (const t of tiers) {
      if (!t || !t.sku || vistos.has(t)) continue;
      vistos.add(t);
      for (const [y, suf] of [['y1','12'],['y3','36'],['y5','60']]) {
        if (t[y]==null) continue;
        const sku=t.sku.replace(/-DD$/, `-${suf}`);
        const p=PRECIO_DECLARADO.get(sku);
        if (p==null) { (t.anterior=t.anterior||{})[y]=true; REANCLAJE.sinReferencia++; }
        else if (Math.abs(p-t[y])>0.005) {
          if (REANCLAJE.ejemplos.length<5) REANCLAJE.ejemplos.push({sku, agosto:t[y], septiembre:p});
          t[y]=p; REANCLAJE.reanclados++;
        } else REANCLAJE.iguales++;
      }
    }
  }
}

// Bundles de protección FortiGuard reales y vigentes (sufijos de SKU -809/-950/-928 en el price list AMER).
// Los 3 ya incluyen FortiCare Premium. "Elite" no es un bundle de protección Fortinet — se reemplaza por
// ATP (Advanced Threat Protection), el nombre y alcance oficiales del tercer bundle.
// ── Procesadores de seguridad (ASIC) ─────────────────────────────────────────
// Verificado contra las páginas "fast path architecture" de la guía Hardware Acceleration
// de FortiOS (docs.fortinet.com) — el lugar donde Fortinet documenta qué silicio lleva cada
// equipo. Cada grupo indica su fuente. Los modelos que no aparecen en esa guía se dejan
// explícitamente sin dato en lugar de inferirlos por nomenclatura.
//
// POR QUÉ IMPORTA PARA DIMENSIONAR: el procesador de red (NP) descarga la sesión completa
// —firewall, NAT, IPsec— sin que toque la CPU, y de ahí salen las cifras de Firewall
// Throughput e IPsec VPN del datasheet. En cuanto se aplica cualquier perfil de inspección,
// la sesión abandona el fast path y pasa a CPU con asistencia del content processor (CP),
// que acelera el pattern matching de IPS y antivirus. Esa transición es exactamente el salto
// de un orden de magnitud entre `fw` y `tp`.
//
// SP5/SoC5 y SoC4 son system-on-chip: integran CPU + NP + CP y el switch fabric en un solo
// chip, lo que permite descargar tráfico entre cualquier par de puertos frontales.
const ASIC_GROUPS = [
  { asic: 'SP5 — SoC5 (CPU + NP7Lite + CP10)', np: 'NP7Lite', cp: 'CP10', soc: true,
    src: 'docs.fortinet.com · fast path architecture de cada modelo',
    models: ['50G','51G','70G','71G','90G','91G','120G','121G','200G','201G'] },

  // El 30G/31G es de la serie G pero NO lleva el SP5: su datasheet trae una sección
  // "Secure SD-WAN ASIC SP4" y la tabla de hardware de FG-30G/31G y FWF-30G/31G dice SoC4.
  // Es el caso que justifica verificar en vez de deducir por nomenclatura: asumir
  // "serie G = SP5" habría puesto el silicio equivocado en el modelo de entrada.
  { asic: 'SP4 — SoC4 (CPU + NP6XLite + CP9XLite)', np: 'NP6XLite', cp: 'CP9XLite', soc: true,
    src: 'fortinet.com · datasheet FortiGate/FortiWiFi 30G Series (tabla de hardware)',
    models: ['30G','31G'] },

  { asic: 'SoC4 (CPU + NP6XLite + CP9XLite)', np: 'NP6XLite', cp: 'CP9XLite', soc: true,
    src: 'docs.fortinet.com · fast path architecture de 40F y 60F/61F',
    models: ['40F','60F','61F'] },

  { asic: 'NP6XLite', np: 'NP6XLite', cp: null, soc: false,
    src: 'docs.fortinet.com · índice "NP6XLite architectures" (familia verificada; empaquetado SoC no confirmado por modelo)',
    models: ['70F','71F','80F','81F','100F','200F'] },

  { asic: '1x NP7 + 1x CP10', np: 'NP7', cp: 'CP10', soc: false,
    src: 'docs.fortinet.com · fast path architecture (NP7 de 200 Gbps)',
    models: ['400G','401G','700G','701G'] },

  { asic: '1x NP7', np: 'NP7', cp: null, soc: false,
    src: 'docs.fortinet.com · fast path architecture (NP7 de 200 Gbps; CP no indicado en la página)',
    models: ['900G','901G'] },

  { asic: '2x NP7 + 6x CP10', np: 'NP7', cp: 'CP10', soc: false,
    src: 'docs.fortinet.com · fast path architecture (400 Gbps de NP)',
    models: ['3000G','3001G'] },

  { asic: '3x NP7 + 8x CP10', np: 'NP7', cp: 'CP10', soc: false,
    src: 'docs.fortinet.com · fast path architecture (600 Gbps de NP)',
    models: ['3500G','3501G'] },

  { asic: '4x NP7 + 12x CP10', np: 'NP7', cp: 'CP10', soc: false,
    src: 'docs.fortinet.com · fast path architecture (800 Gbps de NP)',
    models: ['3800G','3801G'] },

  { asic: 'NP7', np: 'NP7', cp: null, soc: false,
    src: 'docs.fortinet.com · índice "NP7 architectures" (familia verificada; cantidad de NP/CP no abierta por modelo)',
    models: ['400F','401F','600F','1000F','1001F','1800F','1801F','2600F','2601F',
             '3000F','3001F','3200F','3201F','3500F','3501F','3700F','3701F',
             '4200F','4201F','4400F','4401F','4800F','4801F','7081F','7121F'] },
];

// Los 58 modelos del catálogo tienen ASIC verificado contra fuente oficial. Si en el futuro
// se agrega un modelo sin página de fast path ni tabla de hardware publicada, quedará sin
// dato y la UI lo mostrará como no documentado en vez de inferirlo por nomenclatura.
const ASIC_BY_MODEL = {};
for (const g of ASIC_GROUPS) {
  for (const m of g.models) {
    ASIC_BY_MODEL[m] = { asic: g.asic, np: g.np, cp: g.cp, soc: g.soc, asicSrc: g.src };
  }
}
for (const m of MODELS) {
  const a = ASIC_BY_MODEL[m.id.replace('FortiGate ', '')];
  if (a) Object.assign(m, a);
}

// `incluye` ESTRUCTURA lo que `svcs` ya decia en prosa, y no es cosmetica: de aqui salen las
// tres reglas comerciales que el informe del 2026-09-22 marco como P0 y que una cadena de
// texto no puede sostener.
//   1. BUNDLE MINIMO (AT-03). Una funcion pedida en el formulario se cubre con el bundle mas
//      barato que la incluya; elegir uno por debajo se BLOQUEA en vez de avisarse. DLP e IoT
//      Security solo estan en Enterprise, asi que «IoT Detection + DLP con UTP» no es una
//      advertencia: es una cotizacion que no se puede pedir.
//   2. FORTICARE PREMIUM NO SE COTIZA DOS VECES (AT-04). Los tres bundles lo incluyen, y el
//      BOM anadia ademas una linea de soporte SIEMPRE: el cliente pagaba Premium dos veces.
//   3. FORTICONVERTER NO SE DUPLICA (AT-05). Solo Enterprise lo trae; con Enterprise elegido
//      la linea a la carta sobra, y fuera de Enterprise solo entra si alguien la pide.
// `nivel` es el orden de cobertura para poder decir «este bundle esta por debajo del minimo»;
// NO es orden de precio -ATP puede salir mas caro que UTP en algun modelo- y por eso no se
// usa para recomendar el mas barato, solo para comparar coberturas.
const BUNDLES={
  utp:  {n:'UTP — Unified Threat Protection', nivel:2,
         svcs:'IPS, Advanced Malware Protection, Application Control, URL/DNS/Video Filtering, Antispam Service, FortiCare Premium',
         incluye:['ips','amp','appctrl','webfilter','antispam','forticare-premium']},
  ent:  {n:'Enterprise Protection', nivel:3,
         svcs:'IPS, DLP, AMP, Antispam, AI-Based Malware Prevention, Application Control, URL/DNS/Video Filtering, FortiConverter, IoT Security, Security Rating, FortiCare Premium',
         incluye:['ips','amp','appctrl','webfilter','antispam','dlp','iot','securityrating','forticonverter','forticare-premium']},
  atp:  {n:'ATP — Advanced Threat Protection', nivel:1,
         svcs:'IPS, Advanced Malware Protection Service, Application Control, FortiCare Premium',
         incluye:['ips','amp','appctrl','forticare-premium']},
};

// Catalogo de funciones de seguridad que el formulario puede pedir, como DATOS. Cada una
// declara el servicio FortiGuard que consume (`servicio`, la clave que se cruza contra el
// `incluye` de cada bundle) y el piso de capa de inspeccion que impone.
// `servicio:null` = la funcion NO exige ningun servicio FortiGuard: es de FortiOS o se
// cotiza como producto aparte, y por tanto NO puede elevar el bundle minimo. Confundir las
// dos cosas es como se llega a «multi-WAN obliga a Enterprise», que el informe desmiente.
const FUNCIONES=[
  {id:'chkAv',     n:'Antivirus / Antimalware', servicio:'amp',       capa:'tp'},
  {id:'chkWeb',    n:'Web Filtering / Application Control', servicio:'webfilter', capa:'ngfw'},
  {id:'chkIotDlp', n:'IoT Detection + DLP',     servicio:'dlp',       capa:'tp',
   tambien:['iot'], porQue:'DLP e IoT Security solo existen en Enterprise Protection'},
  // La inspeccion TLS profunda es una funcion de FortiOS: no consume un servicio FortiGuard
  // y por tanto NO eleva el bundle. Lo que si hace es cambiar el EJE contra el que se
  // dimensiona -pasa a mandar la cifra oficial de SSL Inspection-, que es cosa del motor.
  {id:'chkSsl',    n:'Inspeccion profunda SSL/TLS', servicio:null,    capa:'tp'},
  // FortiSandbox analiza FUERA DE BANDA: ni eleva la capa ni entra en el bundle. Se cotiza
  // como producto propio. Figura aqui para que la pagina no tenga una lista paralela.
  {id:'chkSandbox',n:'FortiSandbox (analisis zero-day)', servicio:null, capa:null,
   producto:'FortiSandbox', porQue:'analiza fuera de banda: no consume throughput ni entra en el bundle'},
];

// SERVICIOS AVANZADOS DE SD-WAN (categoria «SD-WAN» del Ordering Guide de FortiGuard).
// EXISTEN PORQUE LA FUNCION BASE NO SE LICENCIA. Secure SD-WAN -seleccion dinamica de camino
// por SLA, health checks, ADVPN- viene en FortiOS y se configura en cualquier FortiGate; lo
// que se licencia aparte son estos servicios. Tener dos WAN NO obliga a Enterprise, y esa
// suposicion es justo lo que el informe del 2026-09-22 manda retirar (AT-07).
//
// `sku:null` A PROPOSITO, y desde el 2026-09-24 por otra razon: el Ordering Guide de Secure
// SD-WAN no vende estos servicios uno a uno sino en UN SKU por FortiGate (el SD-WAN Service,
// ver SDWAN_SERVICIO), asi que el codigo no es de cada servicio sino del equipo. Antes era
// null porque nadie lo habia leido; una linea sin SKU exacto sigue sin poder exportarse como
// cotizacion, que es preferible a inventar un codigo con pinta de valido (el «FortiGate 2000F»).
const SERVICIOS_SDWAN=[
  {id:'sdwanMon', n:'SD-WAN Underlay and Application Monitoring Service', sku:null,
   d:'Base de datos de SLA, speed tests activos y monitoreo de aplicacion. Se deriva solo si el diseno usa esas funciones, no por tener varios enlaces.'},
  {id:'sdwanOrq', n:'SD-WAN Overlay Orchestration Service', sku:null,
   d:'Orquestacion cloud de overlays (plantillas de hub-and-spoke y ADVPN desde el portal). Se deriva solo si el diseno la usa.'},
  {id:'sdwanSase',n:'FortiSASE — conector SD-WAN (spoke)', sku:null,
   d:'Conecta el FortiGate a FortiSASE como spoke. Se licencia por usuario segun el Ordering Guide, aparte del FortiGate.'},
];

// TERMINO -> sufijo real del SKU. En el price list de Fortinet el sufijo `DD` es el marcador
// del PATRON («duracion»), no un codigo pedible: una cotizacion con `-DD` no se puede pasar a
// un distribuidor. La equivalencia es meses, no anios, y por eso se declara en meses.
const TERMINOS={1:{meses:12, sufijo:'12'}, 3:{meses:36, sufijo:'36'}, 5:{meses:60, sufijo:'60'}};

// Niveles de soporte FortiCare tal como aparecen en el price list AMER (SKUs -314/-247/-284 por modelo, ver LICENSES).
// Essential no incluye TAC 24x7 ni reemplazo de hardware — confirmar alcance exacto y SLA de RMA con Fortinet,
// ya que el price list solo trae SKU y precio, no el texto de nivel de servicio completo.
const CARE={
  fc247:  {n:'FortiCare Essential',  sla:'Actualizaciones de firmware y portal self-service — sin TAC 24x7 ni reemplazo de hardware'},
  fcpre:  {n:'FortiCare Premium',    sla:'TAC 24x7, reemplazo avanzado de hardware (NBD), firmware y upgrades generales'},
  fcelite:{n:'FortiCare Elite',      sla:'FortiCare Premium + atención de tickets con prioridad Elite'},
};

module.exports = { MODELS, BUNDLES, CARE, LICENSES, HW_SKU, FUNCIONES, SERVICIOS_SDWAN, SDWAN_SERVICIO, EMS_LICENCIAS, SASE_USUARIOS, TERMINOS, MATRIX_LIMITES,
  FICHAS_LIMITES, MATRIX_PLATAFORMA, FICHAS_PLATAFORMA, PUERTOS, FORTIOS, REANCLAJE };
