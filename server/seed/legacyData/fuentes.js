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
      fecha: '2026-09', hash: null, cubre: 'throughput por capa, inspeccion SSL, sesiones, cps, tuneles IPsec, SSL-VPN, politicas y VDOM', campos: ['fw', 'vpn', 'ips', 'ngfw', 'tp', 'ssl', 'sess', 'cps', 'ifaces', 'redund', 'tunGw', 'tunCli', 'sslVpn', 'sslVpnUsers', 'policies', 'vdomMax'],
      nota: 'Fuente oficial. A 2026-09-02, `cps` estaba en 53 de los 58 modelos (traido via GitHub Actions a la rama fuente/fortinet-product-matrix y leido pagina por pagina). Los 5 restantes (100F/200F/400F/401F/600F) no aparecian en este documento: es un "Top Selling Models Matrix", subconjunto curado del catalogo completo. '
        + 'REVISADO EL 2026-09-14 (pendiente 36): el vigia lo vio pasar de 109.483 a 123.387 bytes. Es una EDICION NUEVA -PRQMTX-2026-R176-SEP, septiembre 2026, frente a la de julio con la que se transcribio- y por eso sube aqui la fecha. '
        + 'Pero NINGUNA de las cifras que usa el catalogo cambio: se leyeron sus 6 paginas y se contrastaron los 27 modelos FortiGate que publica x 7 campos (fw, vpn, ips, ngfw, tp, sess, cps) = 189 comparaciones, 189 coincidencias y 0 diferencias. Tampoco aparecen modelos nuevos ni desaparece ninguno de los que el catalogo toma de aqui. '
        + 'La lectura se sometio ademas al doble anclaje de `npm run cps`, que acepto las 27 filas sin rechazar ninguna; y se comprobo que ese anclaje sigue vivo desplazando a proposito la fila del 90G a los valores del 200G, que SI fue rechazada. '
        + 'Un matiz para la proxima vez: este documento publica "Power Supplies" (tipo y numero, que respalda `redund`) y NO vatios -esos salen de la tabla "Dimensions and Power" de cada ficha por serie-. Las 27 filas de Power Supplies no chocan con el `redund` del catalogo, incluidos el 80F y el 90G, que el documento describe como "Single AC PS, dual inputs" y el catalogo tiene en `opcional`.' 
        + '2026-09-22: se anade `ssl` (SSL Inspection Throughput), que este documento publica por modelo y que el catalogo NO tenia. La pagina lo estimaba como `tp x 0,65` y el informe de validacion tecnica del 22-sep lo marca como su defecto P0: el cociente ssl/tp va de 0,52 (40F) a 1,18 (50G), asi que un factor unico prometia 390 Mbps en un 40F que da 310 y se quedaba 1,8x corto en el 50G y el 90G. LAS CIFRAS ESTAN TRANSCRITAS DEL INFORME, QUE CITA ESTE DOCUMENTO Y ESTA EDICION, no leidas del PDF en esa sesion: fortinet.com responde 403 al proxy de egreso de ese entorno. Cubre 5 modelos base (30G 400, 40F 310, 50G 1300, 70G 1400, 90G 2600) mas sus 4 variantes con SSD, que heredan por la regla ya documentada en fortinet.js. Los otros 49 quedaron ese dia en null EXPLICITO: el motor los aparta con su motivo cuando el escenario pide ese eje, en vez de sustituirlos por la cifra de otra capa. Completarlos es leer la columna desde una maquina con acceso y pasarlos por `npm run cps`. '
        + '2026-09-23 (etapas 6 y 7): la columna se leyo del PDF de esta edicion, que ya estaba en la rama de transporte, con doble anclaje 27/27 contra `sess` y `cps`; con ella entraron los seis limites de plataforma (`tunGw`, `tunCli`, `sslVpn`, `sslVpnUsers`, `policies`, `vdomMax`), que por eso se suman ahora a `campos`. Lo que este documento ya no lista (400F, 401F, 600F, 1000F, 1001F) sale de sus fichas por serie, declaradas como fuente propia justo debajo; 100F y 200F siguen sin cifra (pendiente F6). '
        + 'LOS RECUENTOS DE ESTA NOTA SON HISTORICOS Y NO SE ACTUALIZAN. "53 de 58" y "49 en null" eran ciertos el dia que se escribieron, y esta misma nota los seguia afirmando cuando la pestana de procedencia ya pintaba otra cosa: el hallazgo F13 del informe de auditoria del 2026-09-23. La cobertura vigente la cuenta `npm run catalogo` sobre el catalogo, y la ficha de cada equipo dice de donde sale cada limite (`limitesDe`); una cifra escrita a mano aqui se quedaria otra vez con el catalogo de ayer.' },
    { documento: 'Fichas por serie de FortiGate 400F, 600F y 1000F (FG-400F-DAT-R22-202604, FG-600F-DAT-R23-202604, FG-1000F-DAT-R17-202604)',
      url: null, fecha: '2026-04', hash: null,
      cubre: 'los siete limites de plataforma (inspeccion SSL, tuneles IPsec, SSL-VPN, politicas, VDOM) y la plataforma (VDOM por defecto, almacenamiento, FortiAP, FortiSwitch, tokens) de 400F, 401F, 600F, 1000F y 1001F, que el Product Matrix de septiembre ya no lista',
      campos: null, porQue: 'respalda esos campos SOLO en cinco modelos, y el recuento de radio es por campo y no por modelo: declarar `ssl` o `tunGw` aqui contaria los 56 equipos que los traen del Product Matrix, y un cambio de estas fichas mandaria a revisar cifras que no salen de ellas. La procedencia por modelo ya es dato: `limitesDe` y `plataformaFuente` en fortinet.js',
      nota: 'Los siete LIMITES se aplicaron el 2026-09-23 (etapa 7, `FICHAS_LIMITES` en fortinet.js) con doble anclaje de cuatro anclas -sesiones, sesiones nuevas/s, Threat Protection e IPsec- que casaron en las tres, 12 de 12; ese ancla se comprueba al cargar fortinet.js, no solo el dia de la transcripcion, asi que si alguien corrige un `sess` sin volver a leer la ficha los limites dejan de aplicarse y el arranque lo dice. La tabla de PLATAFORMA (`FICHAS_PLATAFORMA`: VDOM por defecto, disco, FortiAP, FortiSwitch, tokens) se transcribio de las mismas tres fichas y NO tiene ancla automatica propia: lo que la respalda es haber salido del mismo documento cuyas cuatro anclas casan, y eso se declara en vez de presentarlo como comprobado. Los PDF se trajeron el 2026-09-03 por las ramas de transporte `fuente/fortinet-datasheets` y `fuente/fortinet-serie`, para leer la alimentacion; nadie los habia leido para esto. '
        + 'SIN URL A PROPOSITO: el repositorio no conserva la URL exacta de cada ficha -los workflows que las trajeron se retiraron-, Fortinet sirve unas en /data-sheets/ y otras en /data-sheets/pdf/, y este entorno no puede comprobarlo (fortinet.com responde connect_rejected al proxy de egreso, medido de nuevo el 2026-09-23). Poner una de las dos a ojo es inventar una URL, y el vigia la reportaria como inalcanzable para siempre; con null la columna Vigilancia dice «no comprobada», que es la verdad. '
        + 'La misma familia de documentos respalda tambien la alimentacion (leida entre el 2026-09-03 y el 2026-09-11, junto con los System Guide de los chasis) y el `cps` de 400F/401F/600F, con revisiones que van de 2022 a 2026: esas se documentan modelo a modelo en la cabecera de fortinet.js en vez de fingir aqui una fecha unica.' },
    { documento: 'Fichas por serie de FortiGate 100F y 200F, edicion coreana oficial (FG-100F-DAT-R30-20230227, FG-200F-DAT-R17-20230125)',
      url: 'https://www.fortinet.com/content/dam/fortinet/assets/data-sheets/ko_kr/ds-fortigate-100f-series_ko.pdf', estable: true,
      fecha: '2023-02', hash: null,
      cubre: 'sesiones nuevas/s y los siete limites de plataforma de 100F y 200F',
      campos: null, porQue: 'respalda esos campos SOLO en dos modelos: declarar `cps` o `ssl` aqui contaria los 58 equipos que los traen, y un cambio de esta ficha mandaria a revisar cifras que no salen de ella. La procedencia por modelo es dato: `limitesDe` en fortinet.js y `fuente` en fortinet-vistas-equipos.json',
      nota: 'Pendiente F6, cerrado el 2026-09-24. La ficha en INGLES da 404 en todas las rutas probadas por `traer-fortinet-pendientes.yml` (el `informe.json` de la rama las lista) y tambien desde internet abierto, medido por otra sesion el mismo dia; la COREANA oficial sigue en el CDN de fortinet.com, con la misma tabla y las etiquetas traducidas: los numeros no se traducen. Se reconstruyo la pagina 7 por coordenadas y se ANCLO con seis cifras ya verificadas por fila (fw, ips, ngfw, tp, vpn, sess): 12 de 12. Es una revision de 2023, anterior a la R42/R28 de 2025 de la que sale el consumo; el rendimiento casa en las seis anclas, el consumo del 100F NO (35,1 W frente a 26,5 W) y por eso el consumo sigue saliendo de la R42. La URL es la del 100F; la del 200F es la misma con `200f`. NO respalda la figura: su dibujo del 100F rotula otro equipo («FortiGate 212F»), y la figura que se sirve sale de la QuickStart Guide (entrada siguiente), que dibuja un 101F de la misma serie.' },
    { documento: 'QuickStart Guide FortiGate 100F Series y FortiGate 200F Series',
      url: 'https://fortinetweb.s3.amazonaws.com/docs.fortinet.com/v2/attachments/42d64717-83f1-11e9-81a4-00505692583a/FG-100F-QSG.pdf', estable: true,
      fecha: '2025-02', hash: null,
      cubre: 'la figura frontal y trasera de 100F y 200F',
      campos: null, porQue: 'respalda solo las figuras de dos modelos (`fortinet-vistas-equipos.json`), no un campo de MODELS',
      nota: 'Pendiente F6, cerrado el 2026-09-24 por otra sesion, que las leyo desde una maquina sin el proxy: p. 5 «Front/Rear - FG 100F Series» (el dibujo es un 101F, y el pie lo dice) y p. 6 «Front/Rear - FG 200F Series». La cara trasera es la de «Redundant Power Supplies», la misma ancla que los otros 54. Esa sesion no guardo la URL; estas son las del almacen de adjuntos de docs.fortinet.com, localizadas por su nombre de archivo (FG-100F-QSG.pdf y FG-200F-Series-QSG.pdf) y traidas por el transporte (corrida 36033165475) para contrastarlas: la copia casa en pagina y rotulo, el texto del propio dibujo del 100F dice «FortiGate 101F» y el del 200F «FortiGate 200F», y la cara trasera es la de «Redundant Power Supplies». Revisiones del 14-feb-2025 (100F) y del 30-may-2025 (200F); la fecha es la mas antigua de las dos. La URL es la del 100F; la del 200F es la adjunta 89694abf-1ef2-11eb-96b9-00505692583a.' },
    { documento: 'Secure SD-WAN Ordering Guide (SDWAN-OG-R31-20260804)',
      url: 'https://www.fortinet.com/content/dam/fortinet/assets/data-sheets/og-secure-sdwan.pdf', estable: true,
      fecha: '2026-08', hash: null,
      cubre: 'que familia del SD-WAN Service es el bundle (1329/1337) y cual el add-on (1387/1389), y su tabla por modelo, contra la que se contrasta la price list',
      campos: null, porQue: 'respalda un SKU comercial (`lic.sdwanSvc`), no un campo tecnico de MODELS',
      nota: 'Pendiente F2, cerrado el 2026-09-24. Los tres servicios avanzados (Underlay and Application Monitoring, Overlay Orchestration, conector FortiSASE) NO son tres lineas: son UN SKU por FortiGate. El documento dice que familia es cada cosa (FAQ, p. 10: el bundle incluye FortiCare y es para el equipo sin otro bundle ni soporte; el add-on es la alternativa para el que ya lleva un bundle de seguridad) y tabula el SKU de 23 modelos (pp. 3-6). El SKU y el PRECIO que se cotizan salen de la price list firmada, en 54 de 58 modelos, y la familia se contrasta con esta tabla: casa en los 23. El codigo de modelo casa en 20; en 70G, 200G y 4800F el documento imprime otro y manda la lista, que es con la que se pide. La primera version de este registro decia que la price list no traia estos SKU: se busco con el marcador -DD y la lista guarda el termino resuelto.' },
    { documento: 'FortiGate Subscriptions and FortiGuard Bundles Ordering Guide',
      url: 'https://www.fortinet.com/content/dam/fortinet/assets/data-sheets/og-fortiguard.pdf', estable: true,
      fecha: '2026-05', hash: null,
      cubre: 'que servicios trae cada bundle (Enterprise, UTP, ATP, SD-WAN) y cuales se venden a la carta',
      campos: null, porQue: 'respalda la composicion de los bundles (`BUNDLES.incluye`), que no es un campo de MODELS',
      nota: 'Traido el 2026-09-24. Es la matriz de bundles que el informe de auditoria del 23-sep citaba como referencia [2] sin haberla podido leer, y se leyo columna por columna (p. 3): la composicion de `BUNDLES.incluye` COINCIDE con ella en los tres bundles -DLP e IoT solo en Enterprise, filtrado web y antispam en Enterprise y UTP, ATP sin filtrado web-, y «FortiGate Cloud Sandbox» va dentro de Advanced Malware Protection en los tres, que es la cobertura «incluida» que el BOM daba por buena con una advertencia y ahora cita. Su pagina 4 confirma que los tres servicios avanzados de SD-WAN llevan marca SOLO en la columna SD-WAN: ni a la carta ni dentro de Enterprise, UTP o ATP.' },
    { documento: 'FortiClient Ordering Guide',
      url: 'https://www.fortinet.com/content/dam/fortinet/assets/data-sheets/og-forticlient.pdf', estable: true,
      fecha: '2026-04', hash: null,
      cubre: 'el SKU de FortiClient EMS (VPN/ZTNA) por pack de 25, 500, 2.000 y 10.000 endpoints, en la nube (EMS05) o on-premise (EMS04)',
      campos: null, porQue: 'respalda un SKU comercial (`EMS_LICENCIAS`), no un campo tecnico de MODELS',
      nota: 'Traido el 2026-09-24 por `traer-fortinet-pendientes.yml`. La tabla de la p. 3 se leyo por coordenadas; el reparto en packs (550 = 1 x 500 + 2 x 25) es el ejemplo del propio documento. Su precio no esta en el catalogo: `npm run skus` solo extrae las filas de la price list que nombran un FortiGate, y estas no nombran ninguno. La linea sale con SKU exacto y sin precio.' },
    { documento: 'FortiSASE Ordering Guide',
      url: 'https://www.fortinet.com/content/dam/fortinet/assets/data-sheets/og-fortisase.pdf', estable: true,
      fecha: '2026-09', hash: null,
      cubre: 'el SKU de usuarios de FortiSASE por edicion y banda, y las plazas incluidas en el SD-WAN Service',
      campos: null, porQue: 'respalda un SKU comercial (`SASE_USUARIOS`), no un campo tecnico de MODELS',
      nota: 'Traido el 2026-09-24. Bandas de usuarios 50-499, 500-1.999, 2.000-9.999 y 10.000+ por edicion Standard, Advanced y Comprehensive (p. 3). DISCREPA del Ordering Guide de Secure SD-WAN en un dato: las plazas incluidas en el SD-WAN Service suben a 100 «desde el 1800F» aqui y «desde el 2500G» alli; el BOM no descuenta plazas y el aviso cita los dos.' },
    { documento: 'FortiOS 7.6 Release Notes (7.6.0 y 7.6.3)',
      url: 'https://fortinetweb.s3.amazonaws.com/docs.fortinet.com/v2/attachments/51fcbb4f-33ff-11ef-bfe5-fa163e15d75b/fortios-v7.6.0-release-notes.pdf', estable: true,
      fecha: '2026-09', hash: null,
      cubre: 'la compatibilidad de SSL-VPN por rama de FortiOS y modelo: retirada del modo tunel en 7.6.3 y modelos de 2 GB de RAM sin SSL-VPN en 7.6.0',
      campos: null, porQue: 'respalda las reglas de `FORTIOS`, no un campo de MODELS',
      nota: 'Condicion 2 del GO CONDICIONADO, cerrada el 2026-09-24. La regla de 7.6.3+ venia CITADA del informe y sin leer (`leida:false`): la pagina «SSL VPN tunnel mode replaced with IPsec VPN» de las Release Notes de 7.6.3 (docs.fortinet.com, traida desde Actions) dice lo mismo, «This applies to all FortiGate models». Y la de 7.6.0 dejaba la compatibilidad «desconocida» porque el Product Matrix no dice que modelos tienen 2 GB de RAM: estas Release Notes dan la lista (40F y variantes, 60F, 61F) y la cierran, «FortiGate models not listed above will continue to have SSL VPN web and tunnel mode support». La URL es la del PDF de 7.6.0 (revision del 2026-09-10).' },
    { documento: 'FortiGate 7081F System Guide (7.0.5) y FortiGate-7121F System Guide (7.4.4)',
      url: 'https://fortinetweb.s3.amazonaws.com/docs.fortinet.com/v2/attachments/c7e69026-9283-11eb-b70b-00505692583a/fortigate-7121F-system-guide.pdf', estable: true,
      fecha: '2024-06', hash: null,
      cubre: 'la figura frontal y trasera de los chasis 7081F y 7121F, y la alimentacion del 7121F (hasta ocho fuentes, p. 8; cuantas hacen falta segun los modulos, p. 24)',
      campos: null, porQue: 'respalda solo las figuras de dos chasis (`fortinet-vistas-equipos.json`), no un campo de MODELS',
      nota: 'Pendiente F6, cerrado el 2026-09-24. Las URL de docs.fortinet.com son una aplicacion web; los PDF viven en fortinetweb.s3.amazonaws.com. Las dos caras vienen rotuladas literalmente («front panel» / «back panel»), y la frontal es una configuracion de ejemplo, que se declara. La URL es la del 7121F; la del 7081F es la adjunta 17ef7271-b6d2-11ed-8e6d-fa163e15d75b. Otra sesion leyo el mismo dia las mismas versiones (7.0.5 y 7.4.4) desde docs.fortinet.com: las paginas y los rotulos de las figuras casan con las copias del transporte, y tambien las dos citas nuevas del 7121F.' },
    { documento: '2026Q3 Mid Price list_AMER_FINAL_EFF 090726.xlsx',
      url: null, fecha: '2026-09-07', hash: null, cubre: 'precios de hardware, licencias FortiGuard, soporte FortiCare, SD-WAN Service y FortiConverter: la unica fuente de precios de Fortinet', dominio: 'precio', campos: null,
      nota: 'Lista de precios AMER oficial, vigente desde el 7 de septiembre de 2026. Sucede a la "Main" del 3 de agosto, y lo declara el propio documento en su Cover Sheet ("Previous Version: Aug 3, 2026" -> "Current Version: Sep 7, 2026"). Fortinet sigue siendo el unico fabricante de este catalogo con precios verificados contra una lista firmada. '
        + 'CONTRASTADA Y APLICADA el 2026-09-09: los 54 equipos del cotizador se casaron por su SKU de hardware contra la hoja DataSet y casaron los 54; 41 quedaron sin cambio y 13 subieron un +10 % o +15 % exacto. Los 13 se aplicaron con anclaje —solo si el precio que tenia el catalogo coincidia con el "precio anterior" que la hoja Changes declara— y las tres fuentes coincidieron en los 13. Que 41 precios quedaran identicos es la prueba de que el catalogo venia bien alineado con la Main, que por eso sale de este registro: ya no es de donde salen las cifras. '
        + 'Desde el 2026-09-24 es la UNICA fuente de precios de Fortinet, por instruccion del dueño: lo que no trae sale sin precio (`fueraDeLista`) y ya no se rellena con la Main de agosto. La invariante «regla del dueño» de test/fortinet-precios.test.js busca cada precio que puede llegar a una linea por su SKU exacto en lo extraido de esta lista.' },
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
    { documento: 'SRX300 Line of Firewalls for the Branch Datasheet',
      url: 'https://www.juniper.net/gb/en/products/security/srx-series/srx300-line-firewalls-branch-datasheet.html', estable: false,
      fecha: '2026-10-02', hash: null, cubre: 'firewall en las dos bases, IPsec en las dos bases, IPS, sesiones y conexiones por segundo de la linea SRX300 (300/320/340/345/380)', campos: ['fw', 'fwImix', 'vpn', 'vpnImix', 'ips', 'sess', 'cps'],
      nota: '2026-10-02: traido via GitHub Actions (traer-cisco-huawei.yml, corrida 37011208335, rama de transporte fuente/cisco-huawei). La URL de EE. UU. devolvio 39 KB sin la tabla y la del Reino Unido la pagina entera, con la tabla «Performance and Scale». Es la edicion VIGENTE de la linea y sustituye a la matriz de 2020 para estos cinco modelos: Juniper re-evaluo al alza (el SRX300 pasa de 1 a 1,9 Gbps de firewall y de 300 a 336 Mbps de IPsec). Se aplico con `npm run juniper --force`, anclado por las columnas que ya casaban: vpnImix, ips, sess y cps en 300/320/340/345, y fw, fwImix, vpn, vpnImix e ips en el SRX380. Cierra la disputa del SRX380: confirma los 20/6,5/4,4 Gbps guardados, que la matriz de 2020 contradecia, y le da 380.000 sesiones y 50.000 conexiones por segundo. No publica la capa de Advanced Threat: su «Secure Web Access firewall» no incluye proteccion contra malware, asi que no se transcribe como `atp`. La pagina no fecha su revision (© 1999-2025): la fecha es la de la lectura. `estable: false` porque su estabilidad entre peticiones no se ha medido todavia.' },
    { documento: 'SRX Series and vSRX Performance and Features Matrix',
      url: 'https://www.juniper.net/content/dam/www/assets/datasheets/us/en/security/security-products-comparison-chart.pdf', estable: true,
      fecha: '2020-08', hash: null, cubre: 'firewall por base de medicion, IPsec, IPS, ATP y sesiones del SRX1500, y el `atp` del SRX340 y el SRX345; el resto de la linea SRX300 lo respalda su datasheet vigente', campos: ['fw', 'fwImix', 'vpn', 'ips', 'atp', 'sess', 'cps'],
      nota: '2026-09-02: traido via GitHub Actions (mismo patron que Fortinet). El documento en si es de agosto de 2020 (pie de pagina "1000265-021-EN Aug 2020") — la fecha "2026-08" que llevaba este registro era una suposicion de cuando no se podia leer el documento, no una medicion; corregida. Sigue siendo el que sirve la URL oficial de Juniper hoy. El propio documento enlaza fichas individuales por modelo (p.3) que se intentaron traer para contrastar, pero sus URL de 2020 ya no resuelven a un PDF (devuelven una pagina HTML) — no se agregan como fuente hasta tener una URL vigente confirmada. 2026-10-02: PARA LA LINEA SRX300 ES UNA EDICION ANTERIOR. Su datasheet vigente (arriba) publica cifras mas altas, y las que esta matriz habia hecho «corregir» el 2026-09-02 —el fwImix de la linea y la disputa del SRX380— eran las de la edicion nueva. El doble anclaje caza una fila desplazada, no una edicion vieja: eso lo decide la fecha del documento.' },
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
    { documento: 'NetEngine 8000 M8 Universal Service Router Datasheet',
      url: 'https://e-file.huawei.com/marketingcloud/pep/asset/20000001/Material/e9dd06e260b64df683f6221fc8442cbf/M3T1A590N1140253824460255266/NetEngine%208000%20M8%20Universal%20Service%20Router%20Datasheet.pdf', estable: true,
      fecha: '2025-06-12', hash: null, cubre: 'capacidad de conmutacion del NE8000 M8 por tarjeta de control (IPU-480, IPU-1T2, IPU-2T4), y su figura (`huawei-vistas-equipos.json`)', campos: ['cap'],
      nota: '2026-10-02: traido via GitHub Actions (traer-cisco-huawei.yml, rama de transporte fuente/cisco-huawei), porque los dominios de Huawei estan bloqueados por el proxy de egreso de este entorno. La fecha es la de generacion del PDF (sus metadatos; el texto dice «© 2022»). La identidad se comprobo por el contenido: el titulo del PDF dice «NetEngine 8000 M4», una plantilla, pero el documento nombra el M8 catorce veces y el M4 ninguna. Corrigio la fila del M8, que llevaba la capacidad y los Mpps exactos del F1A: con la IPU-2T4 (tarjetas de 400 G, 774 W tipicos) la conmutacion es 4,8 Tbps. No publica Mpps, asi que el `mpps` del M8 queda en null.' },
    { documento: 'NetEngine 8000 F8 Datasheet',
      url: 'https://e.huawei.com/marketingcloud/pep/asset/20000001/Material/49184bd3a3c54e4b90f6d73b55ba1558/M3T1A590N1101892422391505075/NetEngine%208000%20F8%20Datasheet.pdf', estable: true,
      fecha: '2025-02-27', hash: null, cubre: 'capacidad de conmutacion del NE8000 F8 en sus versiones 2T y 6.4T, y su figura (`huawei-vistas-equipos.json`)', campos: ['cap'],
      nota: '2026-10-02: traido por el mismo camino que la ficha del M8, y con la misma comprobacion de identidad (titulo de plantilla, contenido del F8). Publica 4 Tbps de conmutacion para la version 2T y 12,8 Tbps para la 6.4T; la fila del catalogo es la 6.4T (tarjetas de 800 G, 2.370 W tipicos) y llevaba 6,4 Tbps, que es su capacidad de puertos, la mitad. Tampoco publica Mpps: el 2.035 del F8 sigue respaldado por la verificacion de la Fase 2.' },
    { documento: 'NetEngine 8000 M14 Universal Service Router Datasheet',
      url: 'https://e-file.huawei.com/marketingcloud/pep/asset/20000001/Material/f4f1a7b9424a44ff9770b75a19eb5d2e/M3T1A590N1267221252983996547/NetEngine%208000%20M14%20Universal%20Service%20Router%20Datasheet.pdf', estable: true,
      fecha: '2026-05-27', hash: null, cubre: 'capacidad de conmutacion y consumo tipico del NE8000 M14 por tarjeta de control (IPU-1T2, IPU-2T, IPU-3T6), y su figura (`huawei-vistas-equipos.json`)', campos: ['cap'],
      nota: '2026-10-02: traido por el mismo camino que las fichas del M8 y el F8; la URL del PDF se descubrio en la pagina de documentos de Huawei (material f4f1a7b9...), no se adivino. La fecha es la de generacion del PDF; el texto dice «© 2025». Identidad comprobada por el contenido: el titulo dice «NetEngine 8000 M4», la plantilla de siempre, y el texto nombra el M14 doce veces y el M4 ninguna. Conmutacion: 2,4 / 4 / 7,2 Tbps segun la IPU. La fila llevaba 2 Tbps (la capacidad de puertos de la IPU-2T) y el portal y la guia 7,2: se alinea con la IPU-3T6, la tarjeta mas alta, como la fila del M8. No publica Mpps.' },
    { documento: 'Huawei NetEngine AR8000 Series Enterprise Router Data Sheet-R25C10',
      url: 'https://e.huawei.com/marketingcloud/pep/asset/20000001/Material/eeda8c0f3659461cbe23ad0a36bc7d78/M3T1A590N1244677017247076576/Huawei%20NetEngine%20AR8000%20Series%20Enterprise%20Router%20Data%20Sheet-R25C10.pdf', estable: true,
      fecha: '2026-03-28', hash: null, cubre: 'reenvio, IPsec y SD-WAN tipico (IMIX) del AR8140-12G10XG, el AR8140-T-12G10XG y el AR8700-8, y su figura (`huawei-vistas-equipos.json`)', campos: ['fwd', 'ipsec', 'typ'],
      nota: '2026-10-05: traido via GitHub Actions (traer-cisco-huawei.yml, rama de transporte fuente/cisco-huawei) y leido dos veces, con PDF4me y con pdf-parse sobre la copia de Actions. La fecha es la de generacion del PDF. Reenvio e IPsec casan con el catalogo; el SD-WAN tipico (IPsec + QoS + SA + AppFlow) es 15 Gbps en el AR8140 y 15,5 en el AR8700-8, y el catalogo decia 12 y 24. Los 24 del AR8700-8 son la fila «SD-WAN IPsec performance» de esta misma tabla (solo IPsec): una fila confundida, no otra edicion. Se corrigio con `npm run huawei -- --force`, anclado en reenvio e IPsec. No publica Mpps.' },
    { documento: 'Huawei NetEngine AR6710-H Series Enterprise Router Data Sheet-R25C10',
      url: 'https://e-file.huawei.com/marketingcloud/pep/asset/20000001/Material/c63ee1473b9147a4b6a50dc64c8f1bcd/M3T1A590N1244327824896741626/Huawei%20NetEngine%20AR6710-H%20Series%20Enterprise%20Router%20Data%20Sheet-R25C10.pdf', estable: true,
      fecha: '2026-03-26', hash: null, cubre: 'reenvio, IPsec y SD-WAN tipico (IMIX) del AR6710-H4T4X2Y7, y su figura (`huawei-vistas-equipos.json`)', campos: ['fwd', 'ipsec', 'typ'],
      nota: '2026-10-05: traido via GitHub Actions (traer-cisco-huawei.yml, rama de transporte fuente/cisco-huawei) y leido dos veces, con PDF4me y con pdf-parse sobre la copia de Actions. Confirma las tres cifras del catalogo (13, 10 y 7 Gbps). Su nota al pie define el SD-WAN tipico como IPsec + QoS + SA + AppFlow, la suma de los dos sentidos: es la capa `typ` del motor. No publica Mpps.' },
    { documento: 'Huawei NetEngine AR5710-S Series Enterprise Router Data Sheet-R25C10',
      url: 'https://e.huawei.com/marketingcloud/pep/asset/20000001/Material/5ed29e82ccc645fb94689a1fbd26bee7/M3T1A590N1245441110459510930/Huawei%20NetEngine%20AR5710-S%20Series%20Enterprise%20Router%20Data%20Sheet-R25C10.pdf', estable: true,
      fecha: '2026-03-30', hash: null, cubre: 'reenvio, IPsec y SD-WAN tipico (IMIX) de las once filas AR5710-S y AR5710-SE, y su figura (`huawei-vistas-equipos.json`)', campos: ['fwd', 'ipsec', 'typ'],
      nota: '2026-10-05: traido via GitHub Actions (traer-cisco-huawei.yml, rama de transporte fuente/cisco-huawei) y leido dos veces, con PDF4me y con pdf-parse sobre la copia de Actions. Confirma las cifras del catalogo: 1,3 Gbps de reenvio, 800 Mbps de IPsec y 620 de SD-WAN tipico en la AR5710-S, y 1,5 Gbps, 800 y 720 en la AR5710-SE, iguales en todas las columnas de cada tabla. No publica Mpps.' },
    { documento: 'Huawei NetEngine AR650 Series Enterprise Routers Datasheet (20250810-v3)',
      url: 'https://e.huawei.com/marketingcloud/pep/asset/20000001/Material/c42dc1420bae4b5cb6188ae903e43fd0/M3T1A590N1161701582779183172/Huawei%20NetEngine%20AR650%20Series%20Enterprise%20Routers%20Datasheet_20250810-v3.pdf', estable: true,
      fecha: '2025-08-10', hash: null, cubre: 'reenvio con y sin licencia Boost, IPsec y SD-WAN tipico (IMIX) del AR651 y el AR651W-8P, y su figura (`huawei-vistas-equipos.json`)', campos: ['fwd', 'ipsec', 'typ', 'boost'],
      nota: '2026-10-05: traido via GitHub Actions (traer-cisco-huawei.yml, rama de transporte fuente/cisco-huawei) y leido dos veces, con PDF4me y con pdf-parse sobre la copia de Actions. Reenvio 1 Gbps, 2 Gbps con la licencia de rendimiento (LAR0PERFE08), e IPsec 2 Gbps: casan con `boost` y `fwd`. El SD-WAN tipico, 600 Mbps, era el hueco: el AR651 y el AR651W-8P se apartaban del perfil SD-WAN por falta de cifra. Una sola celda para los cinco modelos de la serie. No publica Mpps.' },
    { documento: 'Huawei NetEngine AR610 Series Enterprise Routers Datasheet-R26C00',
      url: 'https://e-file.huawei.com/marketingcloud/pep/asset/20000001/Material/e1fc81f9c69d43eb96d1190f77711067/M3T1A590N1311347926431838457/Huawei%20NetEngine%20AR610%20Series%20Enterprise%20Routers%20Datasheet-R26C00.pdf', estable: true,
      fecha: '2026-09-28', hash: null, cubre: 'reenvio, IPsec y SD-WAN tipico (IMIX) del AR611 y el AR617VW-LTE4, y su figura (`huawei-vistas-equipos.json`)', campos: ['fwd', 'ipsec', 'typ'],
      nota: '2026-10-05: traido via GitHub Actions (traer-cisco-huawei.yml); la URL del PDF se descubrio en su pagina de documentos (e.huawei.com/en/documents/products/enterprise-network/e1fc81f9c69d43eb96d1190f77711067), no se adivino. Leido una vez, con pdf-parse sobre la copia de Actions: PDF4me se desconecto antes. Las siete columnas de la tabla dicen lo mismo, asi que no hay fila que desplazar: 300 Mbps de reenvio y 200 de IPsec, que casan con el catalogo, y 50 Mbps de SD-WAN tipico, que faltaba. La fecha es la de generacion del PDF. No publica Mpps.' },
    { documento: 'NetEngine A800 E Series Brochure',
      url: 'https://e-file.huawei.com/marketingcloud/pep/asset/20000001/Material/06048a7a12954961b5017a6459145905/M3T1A590N1063508522362871854/NetEngine%20A800%20E%20Series%20Brochure.pdf', estable: true,
      fecha: '2024-11-13', hash: null, cubre: 'variantes de alimentacion y consumo tipico de los cuatro A800 E (A816, A813, A822 y A821), y la figura de cada uno', campos: ['redund', 'psu'],
      nota: '2026-10-06: traido via GitHub Actions (traer-cisco-huawei.yml, corrida 37401011603, rama de transporte fuente/cisco-huawei), porque los dominios de Huawei devuelven 403 en el proxy de egreso de este entorno; la URL del PDF se descubrio en su pagina de documentos. La fecha es la de generacion del PDF. El texto dice «© 2022». Una pagina por modelo con su tabla de especificaciones: «Power Redundancy: Single AC / Dual AC / AC+DC» en los cuatro, y el consumo tipico (24, 32,7, 35 y 69,87 W). Corrigio el `redund:false` y los 120 W de «consumo tipico» que el catalogo traia. NO se transcribio su capacidad: da 14 G al A813 E y 32 G al A822 E (aqui 20 G) y al A816 E «64-172 Gbit/s» y «112-246 Mpps» con ocho puertos GE, que no es posible; queda en PENDIENTES.md.' },
    { documento: 'NetEngine 8000 M6 Universal Service Router Datasheet',
      url: 'https://e.huawei.com/marketingcloud/pep/asset/20000001/Material/b50df453e4bf4ca4b99ef855437e8cc9/M3T1A590N1140254128116289674/NetEngine%208000%20M6%20Universal%20Service%20Router%20Datasheet.pdf', estable: true,
      fecha: '2025-06-12', hash: null, cubre: 'la figura del NE8000 M6',
      campos: null, porQue: 'respalda solo la figura de un modelo (`huawei-vistas-equipos.json`); sus cifras (320 Gbps, 72 Mpps, 205,8 W) casan con las del catalogo, que ya tenian respaldo',
      nota: '2026-10-06: traido via GitHub Actions (traer-cisco-huawei.yml, corrida 37401011603, rama de transporte fuente/cisco-huawei), porque los dominios de Huawei devuelven 403 en el proxy de egreso de este entorno; la URL del PDF se descubrio en su pagina de documentos. La fecha es la de generacion del PDF. Titulo de plantilla («NetEngine 8000 M4»); el texto nombra el M6 y nunca el M4.' },
    { documento: 'NetEngine 8000 M1A Universal Service Router Datasheet',
      url: 'https://e-file.huawei.com/marketingcloud/pep/asset/20000001/Material/cf634dea810542f1b578ec2a48992ce5/M3T1A590N1228070746570178625/NetEngine%208000%20M1A%20Universal%20Service%20Router%20Datasheet.pdf', estable: true,
      fecha: '2026-02-10', hash: null, cubre: 'la figura del NE8000 M1A',
      campos: null, porQue: 'respalda solo la figura de un modelo (`huawei-vistas-equipos.json`). Sus cifras NO se transcribieron: publica 352 Gbps de conmutacion y 89,21 W tipicos, y el catalogo trae 176 G (la capacidad de puertos) y 74,8 W; queda en PENDIENTES.md',
      nota: '2026-10-06: traido via GitHub Actions (traer-cisco-huawei.yml, corrida 37401011603, rama de transporte fuente/cisco-huawei), porque los dominios de Huawei devuelven 403 en el proxy de egreso de este entorno; la URL del PDF se descubrio en su pagina de documentos. La fecha es la de generacion del PDF. Titulo de plantilla («NetEngine 8000 M4»); el texto nombra el M1A y nunca el M4.' },
    { documento: 'NetEngine 8000 M1D-B Universal Service Router Datasheet',
      url: 'https://e-file.huawei.com/marketingcloud/pep/asset/20000001/Material/d90f145262704e7d98541b3fe592120d/M3T1A590N1140257116414410888/NetEngine%208000%20M1D-B%20Universal%20Service%20Router%20Datasheet.pdf', estable: true,
      fecha: '2025-06-12', hash: null, cubre: 'la figura del NE8000 M1D-B',
      campos: null, porQue: 'respalda solo la figura de un modelo (`huawei-vistas-equipos.json`), no un campo de MODELS',
      nota: '2026-10-06: traido via GitHub Actions (traer-cisco-huawei.yml, corrida 37401011603, rama de transporte fuente/cisco-huawei), porque los dominios de Huawei devuelven 403 en el proxy de egreso de este entorno; la URL del PDF se descubrio en su pagina de documentos. La fecha es la de generacion del PDF. Titulo de plantilla («NetEngine 8000 M4»); el texto nombra el M1D-B y nunca el M4.' },
    { documento: 'NetEngine 8000 X Series Brochure',
      url: 'https://e.huawei.com/marketingcloud/pep/asset/20000001/Material/02d9fbd0807243b5b37d66759665d25a/M3T1A590N1069280707103375400/NetEngine%208000%20X%20Series%20Brochure.pdf', estable: true,
      fecha: '2024-11-26', hash: null, cubre: 'la figura del NE8000 X4, X8 y X16',
      campos: null, porQue: 'respalda solo las figuras de tres modelos (`huawei-vistas-equipos.json`), no un campo de MODELS',
      nota: '2026-10-06: traido via GitHub Actions (traer-cisco-huawei.yml, corrida 37401011603, rama de transporte fuente/cisco-huawei), porque los dominios de Huawei devuelven 403 en el proxy de egreso de este entorno; la URL del PDF se descubrio en su pagina de documentos. La fecha es la de generacion del PDF. Publica las tres figuras pequenas (233-303 px de ancho), y la lupa no puede ensenar mas.' },
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
