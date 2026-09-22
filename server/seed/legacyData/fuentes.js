'use strict';
// Procedencia del catalogo, por fabricante y como DATOS.
//
// POR QUE EXISTE ESTE ARCHIVO
// Cada `legacyData/*.js` ya documentaba en su cabecera de que documento salieron sus cifras
// y de que fecha es — pero en un comentario, que no lo ve ni la aplicacion ni ninguna
// comprobacion automatica. En una herramienta de preventa eso importa: quien arma una
// propuesta necesita saber si la cifra que esta citando es de julio o de hace tres anos, y
// hoy no habia forma de saberlo sin abrir el codigo.
//
// Aqui esa misma informacion se estructura, sin inventar nada: cada entrada se transcribe
// de la cabecera del archivo correspondiente. Donde la cabecera NO da fecha, `fecha` queda
// en `null` y se declara — igual que el catalogo hace con los precios de Aruba o el `cps`
// de Fortinet. Una fuente sin fecha es un hueco que conviene ver, no uno que rellenar a ojo.
//
// QUIEN LO CONSUME
//   · `catalogProjection.js` lo proyecta a la API y el portal lo muestra por fabricante.
//   · `seedCatalog.js` avisa por consola cuando una fuente supera ANTIGUEDAD_AVISO_MESES.
//   · `scripts/catalogo-check.js` lo lista junto a la cobertura de campos.
//   · `scripts/vigia-fuentes.js` compara el `hash` guardado con el del documento en vivo,
//     desde una maquina con salida a internet, para avisar cuando el fabricante lo cambia.
//
// EL CAMPO `hash`
// Es el SHA-256 del documento tal como se descargo la ultima vez. Va en `null` mientras
// nadie lo haya calculado: el proxy de egreso de este entorno responde 403 a los dominios de
// los cuatro fabricantes, asi que se rellena la primera vez que `npm run vigia` corre desde
// fuera. `null` significa "todavia no se ha medido", nunca "no ha cambiado".
//
// EL CAMPO `estable`, Y POR QUE HIZO FALTA
// Se midio, no se supuso: dos corridas del vigia con minutos de diferencia dieron tamanos
// distintos para las paginas HTML (Cisco 173.913 -> 173.905 bytes, Aruba 333.670 -> 333.667,
// Nokia 307.119 -> 307.115) y EXACTAMENTE el mismo para el PDF de Juniper. Una pagina de
// producto lleva marcas de tiempo, identificadores de sesion y banners rotatorios: su hash
// cambia en cada peticion sin que el dato haya cambiado.
//
// Un vigia que avisa en falso todas las semanas se acaba ignorando, y entonces no avisa de
// nada. Asi que `estable: true` marca los documentos cuyo hash SI significa algo (un PDF
// publicado, un boletin), y solo esos abren un issue. Las paginas siguen midiendose y su
// variacion sale en el informe, pero como observacion y no como alarma.
//
// Y DESDE EL 2026-09-14 ESO YA NO DEPENDE DE QUE ALGUIEN LO ACERTARA A OJO. Este campo se
// puso a mano y nadie lo re-comprobaba: el modo de fallo de CISCO_EOL_MODELS. `npm run vigia
// -- --sondeo` pide cada URL DOS VECES con segundos de diferencia -lo que cambie entre ellas
// no puede ser un cambio del fabricante- y compara los bytes y el TEXTO por separado. La
// primera corrida, desde Actions, encontro los dos errores posibles a la vez:
//
//   - el boletin EOL de Cisco, declarado `estable: true`, cambia de BYTES entre dos
//     peticiones (mismos 173.911 en las dos, hash distinto) pero NO de texto: sus tres
//     semanas de "cambios" eran alarmas falsas;
//   - el EOL de Juniper, declarado `estable: false`, devolvio los mismos bytes y el mismo
//     hash: estaba callado sin motivo y un boletin nuevo no habria alarmado.
//
// De ahi que el vigia vigile ahora el TEXTO en las fuentes HTML y los bytes en los PDF. Las
// seis paginas HTML medidas dieron texto estable; las cuatro PDF, bytes estables. Lo que NO
// se midio es la estabilidad de un dia para otro -dos peticiones con 15 s de diferencia no
// dicen nada de eso-, asi que mikrotik, las paginas de HPE y la de Nokia siguen en
// `estable: false` hasta que las corridas semanales acumulen evidencia. Medir una cosa y
// afirmar otra es como se llega a un campo puesto a ojo.

// A partir de cuantos meses una fuente se considera vieja y el arranque lo dice. Seis meses
// es medio ciclo de refresco de catalogo de estos fabricantes: lo bastante largo para no
// avisar por ruido, lo bastante corto para que no se pase un cambio de gama entero.
const ANTIGUEDAD_AVISO_MESES = 6;

// `fecha` en ISO. Solo el mes cuando la cabecera solo da el mes ("julio 2026"), el dia
// completo cuando lo da ("17-ago-2026"). Nunca se completa el dia a ojo.
const FUENTES = {
  fortinet: [
    { documento: 'Fortinet Product Matrix',
      url: 'https://www.fortinet.com/content/dam/fortinet/assets/data-sheets/Fortinet_Product_Matrix.pdf', estable: true,
      fecha: '2026-09', hash: null, cubre: 'throughput por capa, inspeccion SSL, sesiones, cps', campos: ['fw', 'vpn', 'ips', 'ngfw', 'tp', 'ssl', 'sess', 'cps', 'ifaces', 'redund'],
      nota: 'Fuente oficial. `cps` esta en 53 de los 58 modelos (2026-09-02, traido via GitHub Actions a la rama fuente/fortinet-product-matrix y leido pagina por pagina). Los 5 restantes (100F/200F/400F/401F/600F) no aparecen en este documento: es un "Top Selling Models Matrix", subconjunto curado del catalogo completo. '
        + 'REVISADO EL 2026-09-14 (pendiente 36): el vigia lo vio pasar de 109.483 a 123.387 bytes. Es una EDICION NUEVA -PRQMTX-2026-R176-SEP, septiembre 2026, frente a la de julio con la que se transcribio- y por eso sube aqui la fecha. '
        + 'Pero NINGUNA de las cifras que usa el catalogo cambio: se leyeron sus 6 paginas y se contrastaron los 27 modelos FortiGate que publica x 7 campos (fw, vpn, ips, ngfw, tp, sess, cps) = 189 comparaciones, 189 coincidencias y 0 diferencias. Tampoco aparecen modelos nuevos ni desaparece ninguno de los que el catalogo toma de aqui. '
        + 'La lectura se sometio ademas al doble anclaje de `npm run cps`, que acepto las 27 filas sin rechazar ninguna; y se comprobo que ese anclaje sigue vivo desplazando a proposito la fila del 90G a los valores del 200G, que SI fue rechazada. '
        + 'Un matiz para la proxima vez: este documento publica "Power Supplies" (tipo y numero, que respalda `redund`) y NO vatios -esos salen de la tabla "Dimensions and Power" de cada ficha por serie-. Las 27 filas de Power Supplies no chocan con el `redund` del catalogo, incluidos el 80F y el 90G, que el documento describe como "Single AC PS, dual inputs" y el catalogo tiene en `opcional`.' 
        + '2026-09-22: se anade `ssl` (SSL Inspection Throughput), que este documento publica por modelo y que el catalogo NO tenia. La pagina lo estimaba como `tp x 0,65` y el informe de validacion tecnica del 22-sep lo marca como su defecto P0: el cociente ssl/tp va de 0,52 (40F) a 1,18 (50G), asi que un factor unico prometia 390 Mbps en un 40F que da 310 y se quedaba 1,8x corto en el 50G y el 90G. LAS CIFRAS ESTAN TRANSCRITAS DEL INFORME, QUE CITA ESTE DOCUMENTO Y ESTA EDICION, no leidas del PDF en esa sesion: fortinet.com responde 403 al proxy de egreso de ese entorno. Cubre 5 modelos base (30G 400, 40F 310, 50G 1300, 70G 1400, 90G 2600) mas sus 4 variantes con SSD, que heredan por la regla ya documentada en fortinet.js. Los otros 49 quedan en null EXPLICITO: el motor los aparta con su motivo cuando el escenario pide ese eje, en vez de sustituirlos por la cifra de otra capa. Completarlos es leer la columna desde una maquina con acceso y pasarlos por `npm run cps`.' },
    { documento: '2026Q3 Mid Price list_AMER_FINAL_EFF 090726.xlsx',
      url: null, fecha: '2026-09-07', hash: null, cubre: 'precios de hardware, licencias FortiGuard y soporte FortiCare', dominio: 'precio', campos: null,
      nota: 'Lista de precios AMER oficial, vigente desde el 7 de septiembre de 2026. Sucede a la "Main" del 3 de agosto, y lo declara el propio documento en su Cover Sheet ("Previous Version: Aug 3, 2026" -> "Current Version: Sep 7, 2026"). Fortinet sigue siendo el unico fabricante de este catalogo con precios verificados contra una lista firmada. '
        + 'CONTRASTADA Y APLICADA el 2026-09-09: los 54 equipos del cotizador se casaron por su SKU de hardware contra la hoja DataSet y casaron los 54; 41 quedaron sin cambio y 13 subieron un +10 % o +15 % exacto. Los 13 se aplicaron con anclaje —solo si el precio que tenia el catalogo coincidia con el "precio anterior" que la hoja Changes declara— y las tres fuentes coincidieron en los 13. Que 41 precios quedaran identicos es la prueba de que el catalogo venia bien alineado con la Main, que por eso sale de este registro: ya no es de donde salen las cifras.' },
  ],

  cisco: [
    { documento: 'Datasheets oficiales de producto',
      url: null, fecha: '2026-08', hash: null, cubre: 'cifras tecnicas de Catalyst 8000, ISR 1000, Meraki MX y ASR 1000', campos: null, porQue: 'la entrada dice "cifras tecnicas" sin decir cuales; declararlas exige abrir los datasheets, y adivinarlas mandaria a revisar los campos equivocados',
      nota: 'Verificacion de la Fase 2.' },
    { documento: 'Boletines oficiales de fin de venta (EOL)',
      url: 'https://www.cisco.com/c/en/us/products/collateral/networking/sdwan-routers/catalyst-8000-edge-platforms/catalyst-c8300-2n2s-4t2x-6t-1n-4t-c8200l-eol.html', estable: true,
      fecha: '2026-07-27', hash: null, cubre: 'fechas de ultimo pedido de los chasis Catalyst 8300/8200, 8500-12X4QC y la linea ASR 1000', campos: ['eolAnnounced'],
      nota: 'La regla de ficha.js compara la fecha de ultimo pedido contra la de hoy, asi que un equipo deja de proponerse solo el dia que vence.' },
    { documento: 'Cisco 8300 Series Secure Routers Data Sheet',
      url: 'https://www.cisco.com/c/dam/en/us/products/collateral/routers/secure-routers/8300-series-secure-routers-ds.pdf', estable: true,
      fecha: '2026-09-03', hash: null, cubre: 'rendimiento y escala del C8355-G2 y el C8375-E-G2, mas su alimentacion y consumo tipico', campos: ['sdwan', 'redund', 'psu'],
      nota: '2026-09-03: traida via GitHub Actions. Es la que cierra el `sdwan: null` del C8355-G2 con 8,7 Gbps, y la que corrigio su `redund` a true (la ficha rotula la fila «Power Supply (Default - Dual PSU)»). La fila entro con doble anclaje: su forwarding de 38 Gbps y su IPsec de 20 Gbps ya coincidian con este catalogo.' },
    { documento: 'Export de CCW (Products_115951960955347.xlsx)',
      url: null, fecha: '2026-08-17', hash: null, cubre: 'precios de lista y confirmacion de la generacion Secure Router (G2)', dominio: 'precio', campos: null,
      nota: 'Export real de la herramienta de cotizacion de Cisco.' },
  ],

  juniper: [
    { documento: 'SRX Series and vSRX Performance and Features Matrix',
      url: 'https://www.juniper.net/content/dam/www/assets/datasheets/us/en/security/security-products-comparison-chart.pdf', estable: true,
      fecha: '2020-08', hash: null, cubre: 'firewall por base de medicion, IPsec, IPS y ATP de las lineas SRX300/1500/4100/4200/4600/5000 y vSRX', campos: ['fw', 'fwImix', 'vpn', 'ips', 'atp', 'sess', 'cps'],
      nota: '2026-09-02: traido via GitHub Actions (mismo patron que Fortinet). El documento en si es de agosto de 2020 (pie de pagina "1000265-021-EN Aug 2020") — la fecha "2026-08" que llevaba este registro era una suposicion de cuando no se podia leer el documento, no una medicion; corregida. Sigue siendo el que sirve la URL oficial de Juniper hoy. El propio documento enlaza fichas individuales por modelo (p.3) que se intentaron traer para contrastar, pero sus URL de 2020 ya no resuelven a un PDF (devuelven una pagina HTML) — no se agregan como fuente hasta tener una URL vigente confirmada.' },
    { documento: 'Hardware guides por modelo (SRX300/320/340/345/1500/1600/2300/4100/4200/4300/4700)',
      url: 'https://www.juniper.net/documentation/us/en/hardware/srx1600/index.html', estable: true,
      fecha: '2026-09-03', hash: null, cubre: 'alimentacion, redundancia de fuente y consumo medio de los 12 modelos SRX (vigilado: el SRX1600)', campos: ['redund', 'psu'],
      nota: 'Una guia por modelo, traidas via GitHub Actions y leidas a mano. El material comercial de Juniper publica rendimiento pero NO alimentacion: esto es lo unico que la trae. Se comprobo que cada guia hable solo de su equipo antes de aplicar nada. URL CORREGIDA EL 2026-09-16, MIDIENDOLO (pendiente 38): antes apuntaba al INDICE `/documentation/us/en/hardware/`, que no es un documento sino un directorio y devuelve 403 SIEMPRE — el vigia llevaba desde el 2026-09-14 sin poder leer nada, y esa fuente se quedaba «no comprobada» para siempre. Que no era un bloqueo lo probo un grupo de control: la matriz SRX del mismo dominio respondio 200 en la misma corrida. Ahora se vigila la pagina del SRX1600, que responde 200. NO CUBRE LOS OTROS ONCE: el vigia sigue mirando una URL por fuente, asi que esta alarma avisa de que Juniper toco la guia de UN modelo, no de los doce. Es menos de lo que la entrada prometia antes, y mas de lo que de verdad hacia, que era nada.' },
    { documento: 'Fichas por modelo de la generacion 2024 (SRX1600, SRX2300, SRX4300)',
      url: 'https://www.juniper.net/content/dam/www/assets/datasheets/us/en/security/srx1600-firewall-datasheet.pdf', estable: true,
      fecha: '2026-09-03', hash: null, cubre: 'fwImix, IPS y ATP de la generacion que la matriz de 2020 no alcanza', campos: ['fwImix', 'ips', 'atp'],
      nota: 'Traidas via GitHub Actions. Publican el rendimiento en DOS metodos y confundirlos es el error que este catalogo persigue: «TPS Method: throughput of average HTTP sessions» da 19 Gbps de NGFW en el SRX1600 sobre un firewall de 24, mientras «CPS Method: short-lived sessions» da 4,5. Se transcribe siempre CPS, el unico metodo en el que Juniper publica tambien las capas profundas. Cada fila entro con triple anclaje (fw, vpn y sess ya coincidian). La URL es la del directorio; cada ficha vive en srx<modelo>-firewall-datasheet.pdf. El SRX4100, el SRX4200 y la linea SRX300 dan 404 en ese patron, y el SRX4700 fallo la conexion: reportado, no dado por bueno. URL CORREGIDA EL 2026-09-16, MIDIENDOLO (pendiente 38): antes apuntaba al DIRECTORIO, que devuelve 403 siempre porque un CDN no sirve listados — no era un bloqueo a Juniper, y lo probo el grupo de control: la matriz SRX, ARCHIVO DEL MISMO DIRECTORIO, respondio 200 en la misma corrida. Ahora se vigila la ficha del SRX1600 (200 OK, PDF real de 484 KB); la del SRX4300 tambien responde y sigue el mismo patron. Vigila UNA de las tres fichas, no las tres: el vigia mira una URL por fuente.' },
    { documento: 'SRX Series Hardware Dates & Milestones',
      url: 'https://support.juniper.net/support/eol/product/srx_series/', estable: true,
      fecha: '2026-09-03', hash: null, cubre: 'fin de venta del SRX1500 (TSB101240) y el SRX4100 (TSB101895), ambos con ultimo pedido 2026-04-15', campos: ['eolAnnounced'],
      nota: 'La tabla mezcla en las mismas filas el fin de vida de paquetes de software con el del hardware, asi que solo se aceptan las filas cuyo SKU es el chasis o el sistema del propio modelo. Con ese filtro, de los 12 modelos del catalogo exactamente 2 tienen fin de venta del equipo. CORREGIDO EL 2026-09-14 A `estable: true`, MIDIENDOLO: `npm run vigia -- --sondeo` desde Actions pidio esta URL dos veces con 15 s de diferencia y devolvio los mismos 104.377 bytes y el mismo hash. Estaba declarada inestable por suposicion -"es una pagina viva que crece con cada boletin"- y eso la dejaba SIN ALARMA: un boletin nuevo de fin de venta se habria reportado como "vario (pagina dinamica)" y nadie se habria enterado. Es el fallo contrario al de Cisco y sale del mismo sitio: un campo puesto a ojo.' },
  ],

  huawei: [
    { documento: 'Datasheets oficiales de producto',
      url: null, fecha: '2026-08', hash: null, cubre: 'cifras de las lineas AR y NetEngine', campos: ['fwd', 'ipsec', 'typ', 'mpps'],
      nota: 'Verificacion de la Fase 2. Faltan el ciclo de vida (0 de 40 modelos marcados), `ipsec` y `typ` en las NetEngine y `mpps` en los AR. 2026-09-02: comprobado desde GitHub Actions (a diferencia de Fortinet, esto NO se cierra igual) que e.huawei.com y support.huawei.com bloquean el navegador automatizado con un "Access Denied" de Akamai -bloqueo del propio Huawei contra automatizacion, no del proxy de este entorno- y que ademas sirven una aplicacion Vue/Nuxt sin contenido en el HTML crudo, asi que ni siquiera un fetch() sin navegador vale. Info.support.huawei.com si carga, pero Info-Finder es un glosario de terminos (AAA, ACL...), no una base de datos de ciclo de vida por modelo, y exige sesion iniciada para cualquier detalle. Se completa a mano, con `npm run huawei`, desde una maquina con navegador real y sesion de Huawei si hace falta el detalle fino.' },
  ],

  mikrotik: [
    { documento: 'Datasheets publicos y MSRP de mikrotik.com',
      url: 'https://mikrotik.com/products', estable: false, fecha: null, hash: null,
      cubre: 'forwarding con FastTrack, IPsec, RAM, nucleos y nivel de licencia', campos: ['fwd', 'ipsec', 'ram', 'cores', 'lvl'],
      nota: 'SIN FECHA en la cabecera del catalogo, y sin price list firmada a diferencia de Fortinet. Confirmar contra distribuidor autorizado antes de cotizar en firme.' },
  ],

  aruba: [
    { documento: 'Validated Solution Guide SD-Branch y data sheet de suscripciones EdgeConnect (HPE, oficiales)',
      url: 'https://arubanetworking.hpe.com/techdocs/VSG/docs/070-sd-branch-design/', estable: false, fecha: '2026-09-13', hash: null,
      campos: null, porQue: 'son reglas de diseno del fabricante, no campos del catalogo',
      cubre: 'reglas de diseno validadas en la fase 10: Boost como add-on en bloques de 100 Mbps de pool del fabric; DTD por appliance y como add-on de la suscripcion; On-Prem solo como Advanced On-Prem con software de Orchestrator incluido (alojamiento del cliente); SKU HA del segundo nodo con regla "match tier, bandwidth, term"; Foundation = 3 BIOs y 2 VRF (default+guest) vs Advanced = 7 BIOs y 64 VRFs; AppExpress monitor-only en Foundation; NGFW completo y DPC en Foundation; ratios FEC 1:8 (12,5%) y 1:4 (25%); SLA DPS de utilizacion de enlace al 75%; flujos por modelo (256.000 / 2.000.000); tier de suscripcion por caudal WAN agregado del sitio; AppRF/Qosmos ~3.500 apps en SD-Branch; Boost solo EdgeConnect (no gateways); Central de gateway por dispositivo y termino con co-terminacion oficial en SaaS',
      nota: 'Validacion web de la fase 10 (2026-09-13) con citas literales: VSG SD-Branch (arubanetworking.hpe.com/techdocs/VSG), data sheet de suscripciones a50010073enw (hpe.com), QuickSpecs a50004289enw, Orchestrator Docs (arubanetworks.com/techdocs/sdwan) y tabla oficial de licenciamiento de Central. SIN FUENTE y declarados como regla de trabajo del arquitecto: flujos por usuario (80-100/150-200), headroom del 25-30% (ancla parcial: SLA DPS 75%) y Boost = 30% del trafico WAN privado (la unica regla de campo localizada, no oficial, dice 40% — discrepancia documentada en el motor). IDS/IPS no corre en EC-XS (doc oficial IDS); la paridad de precio de los SKU HA sale de la lista del distribuidor, no de HPE (HPE no publica precios). MEDIDO EL 2026-09-16 DESDE ACTIONS (pendiente 38): esta URL es una CARPETA y da 403, pero aqui el 403 SI es del fabricante y no la forma de la URL, al reves que en las dos fuentes de Juniper. Lo prueba el grupo de control: dan 403 tambien el PDF concreto (`.../Media/PDF/Aruba_VSG_SD-Branch-Design.pdf`, que es el que `legacyData/aruba.js` declara en DATASHEETS.sdBranchVsg), el indice del VSG, y el Hardware Reference que `npm run datasheets` si descargaba desde otra maquina. LA URL SE DEJA COMO ESTA A PROPOSITO: apuntarla al PDF concreto alinearia las dos declaraciones del repositorio, pero un `.pdf` obliga a `estable: true` (se vigila por bytes) y de la estabilidad de este documento no hay ninguna medicion porque nadie puede leerlo — declararla seria el campo puesto a ojo que este repositorio persigue. Sigue saliendo «no comprobada» en la pestana de procedencia, que es lo honesto.' },
    { documento: 'Paginas de producto y tienda oficiales de HPE/Aruba',
      url: 'https://www.hpe.com/us/en/networking.html', estable: false, fecha: null, hash: null,
      cubre: 'modelos EdgeConnect, gateways 9000/9200, software y SKUs de hardware', campos: null, porQue: 'respalda los modelos ENTEROS, no una lista acotada; declarar solo hwSku y skus haria creer que el resto no queda afectado si esa pagina cambia',
      nota: 'SIN FECHA en la cabecera del catalogo. Los PDF no pudieron abrirse (bloqueo de egreso a los dominios de HPE): las cifras salen de las descripciones publicadas en esas paginas, no de la lectura integra del datasheet. Lo que sigue sin precio verificado (EC-V, EC-XS-SP, Dynamic Threat Defense, Foundational Care de software y de gateways) va en null y el BOM lo declara en "consultar".' },
    { documento: 'Lista de precios de un distribuidor autorizado de HPE (export interno, no publico)',
      url: null, fecha: '2026-09-13', hash: null, dominio: 'precio', campos: null, cubre: 'List Price de HPE para 15 modelos EdgeConnect/gateway y 7 variantes de pedido TAA/NAL, las suscripciones EdgeConnect (Foundation/Advanced/On-Premises x 100M/1G/ilimitado x 1/3/5 anos), las suscripciones de ALTA DISPONIBILIDAD del segundo nodo (Foundation/Advanced HA x 100M/1G/ilimitado x 1/3/5 anos), Boost SaaS y On-Premises, suscripciones Central de gateway 70xx/90xx, licencias perpetuas del 9240, unidades remanufacturadas 7000/7200 y los SKU de Foundational Care (NBD Exch y 4HR Onsite, 1/3/5 anos) de los 9 EdgeConnect',
      nota: 'Extracto elaborado por este catalogo el 2026-09-10 y ampliado el 2026-09-13 con las suscripciones, los remanufacturados, las variantes TAA/NAL, el Foundational Care por modelo (CARE_SKU en aruba.js) y las 18 suscripciones HA del segundo nodo (LICENSES_HA en aruba.js): se guardo SOLO el SKU, la descripcion, el List Price y su vigencia (public/datasheets/aruba-lista-precios-hpe.csv); el nombre del distribuidor y su % de descuento negociado NO se incorporan, por ser su dato confidencial. Es precio de lista, no neto -- no reemplaza confirmar con el distribuidor antes de cotizar en firme. La correspondencia SKU<->descripcion de las suscripciones se verifico el 2026-09-13 contra el QuickSpecs oficial EdgeConnect SD-WAN (v18) publicado en hpe.com, y JZ118AAE contra una tienda publica (LIST $1,260.00, identico). RESUELTO el 2026-09-13 (decision del duenyo): EC-XL marcado fin de venta con las fechas oficiales de HPE (anuncio jun-2025, ultimo pedido 2026-03-31, fin de soporte 2033-03-31). Refactor 2026-09-13 (motor de licenciamiento automatico): la matriz Foundation/Advanced de BUNDLES sale literal del QuickSpecs v18 p.31, y Dynamic Threat Defense (IDS/IPS, p.32) es licencia opcional aparte, sin precio publicado -- va en "consultar". Correcciones documentadas frente al brief del arquitecto: Dynamic Path Steering y NGFW son Foundation (no Advanced); el encadenamiento DIA/First-packet iQ/SSE es funcion de plataforma, no de tier.' },
  ],

  nokia: [
    { documento: 'Fichas de serie de Nokia (7220 IXR-D, 7750 SR-1x, 7750 SR-s, 7250 IXR-e)',
      url: 'https://www.nokia.com/asset/f/207599/', estable: true,
      fecha: '2026-09-03', hash: null, cubre: 'alimentacion de los 7220 IXR-D y los 7750 SR-1x, y las capacidades publicadas de las series', campos: ['redund', 'psu', 'cap'],
      nota: 'Traidas via GitHub Actions desde nokia.com/asset/f/<id>, que es la URL oficial; no se usan los espejos de terceros que devolvio la busqueda. Aportan `redund` en 6 de los 18 modelos. Los vatios que publican NO son consumo: el 7220 IXR-D2L y el D3L declaran los mismos 650 W con capacidades distintas, asi que es la potencia de la fuente. Estas fichas ademas CONTRADECIAN las capacidades del catalogo en seis modelos — se RESOLVIO el 2026-09-11 (decision del duenyo): los 7220 IXR-D2L/D3L contaban el caudal dos veces y los 7750 SR-s adoptan «System capacity (FD; max)» como metrica de `cap`. Ver el comentario de metrica en nokia.js.' },
    { documento: 'Datasheets oficiales de producto',
      url: 'https://www.nokia.com/networks/ip-networks/', estable: false, fecha: '2026-08', hash: null,
      cubre: 'lineas 7220 IXR, 7250 IXR y 7750 SR', campos: null, porQue: 'nombra lineas, no campos: lo que respalda de cada una no esta acotado en esta entrada',
      nota: 'Cifras tecnicas verificadas; el PRECIO no, porque no hay lista de precios de Nokia en el material disponible. Van como Consultar y el BOM los cuenta sin cotizar.' },
  ],
};

// Meses transcurridos desde `fecha` hasta `ahora`. Devuelve null si no hay fecha: no se
// puede medir la antiguedad de algo que no dice cuando se hizo, y fingir un 0 seria decir
// "recien verificado", que es justo lo contrario de lo que pasa.
function mesesDesde(fecha, ahora = new Date()) {
  if (!fecha) return null;
  const [anio, mes, dia] = String(fecha).split('-').map(Number);
  if (!anio || !mes) return null;
  const desde = new Date(Date.UTC(anio, mes - 1, dia || 1));
  if (Number.isNaN(desde.getTime())) return null;
  return (ahora.getUTCFullYear() - desde.getUTCFullYear()) * 12
    + (ahora.getUTCMonth() - desde.getUTCMonth())
    - (ahora.getUTCDate() < desde.getUTCDate() ? 1 : 0);
}

// Estado de una fuente: 'vigente', 'vieja' (supera el umbral) o 'sin fecha'.
function estadoFuente(fuente, ahora = new Date()) {
  const meses = mesesDesde(fuente.fecha, ahora);
  if (meses === null) return { estado: 'sin fecha', meses: null };
  return { estado: meses >= ANTIGUEDAD_AVISO_MESES ? 'vieja' : 'vigente', meses };
}

// Las fuentes de un fabricante, cada una con su estado ya resuelto. Lo consumen por igual la
// proyeccion a la API, el aviso del arranque y el inventario de `npm run catalogo`.
function fuentesDe(vendorCode, ahora = new Date()) {
  const lista = FUENTES[String(vendorCode || '').toLowerCase()] || [];
  return lista.map((f) => ({ ...f, ...estadoFuente(f, ahora) }));
}

// Todas las que piden atencion, para el aviso del arranque.
function fuentesQueAvisan(ahora = new Date()) {
  const avisos = [];
  for (const vendor of Object.keys(FUENTES)) {
    for (const f of fuentesDe(vendor, ahora)) {
      if (f.estado !== 'vigente') avisos.push({ vendor, ...f });
    }
  }
  return avisos;
}

module.exports = { FUENTES, ANTIGUEDAD_AVISO_MESES, mesesDesde, estadoFuente, fuentesDe, fuentesQueAvisan };
