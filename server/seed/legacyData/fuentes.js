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
// LAS FICHAS DE MIKROTIK, UNA A UNA (2026-10-13). La fuente general vigilaba solo la portada
// de productos: un cambio en la tabla de pruebas o en el precio de un equipo no lo avisaba nadie.
// Ahora cada ficha transcrita es una fuente vigilada por sus DATOS (`vigilar: 'ficha-mikrotik'`):
// el vigia relee la pagina con el mismo lector que `npm run mikrotik` y compara la huella de lo
// que el catalogo usa, no el HTML. Se generan desde `mikrotikPruebas.js` para que no exista una
// segunda lista de URLs que se desincronice. `campos: null` a proposito: cada ficha respalda UN
// modelo, y declarar `fwd` aqui contaria los veinte equipos por cada una.
const { FICHAS: FICHAS_MIKROTIK } = require('./mikrotikPruebas');
const documentoFichaMikrotik = (codigo) => `Ficha de producto MikroTik ${codigo}`;
const fichasMikrotik = () => Object.entries(FICHAS_MIKROTIK).map(([codigo, f]) => ({
  documento: documentoFichaMikrotik(codigo),
  url: f.url, estable: true, fecha: null, hash: null,
  vigilar: 'ficha-mikrotik', codigo, modelos: [codigo],
  campos: null, porQue: `respalda un solo modelo (${codigo}); la procedencia por modelo es dato: la URL de cada ficha en mikrotikPruebas.js`,
  cubre: `tabla de pruebas RFC 2544, CPU, nucleos, RAM, nivel de licencia y «Suggested price» del ${codigo}`,
  nota: 'Vigilada por sus DATOS, no por el HTML: el vigia lee la pagina con el lector de `npm run mikrotik` y compara la huella de lo transcrito. Si cambia, se relee con `npm run mikrotik`, que vuelve a anclar y deja el lock verificado. Sin fecha: MikroTik no la publica en la ficha.',
}));

const FUENTES = {
  fortinet: [
    { documento: 'Fortinet Product Matrix',
      url: 'https://www.fortinet.com/content/dam/fortinet/assets/data-sheets/Fortinet_Product_Matrix.pdf', estable: true,
      fecha: '2026-10', hash: null, modelos: '*', cubre: 'throughput por capa, inspeccion SSL, sesiones, cps, tuneles IPsec, SSL-VPN, politicas y VDOM', campos: ['fw', 'vpn', 'ips', 'ngfw', 'tp', 'ssl', 'sess', 'cps', 'ifaces', 'redund', 'tunGw', 'tunCli', 'sslVpn', 'sslVpnUsers', 'policies', 'vdomMax'],
      nota: 'Fuente oficial. A 2026-09-02, `cps` estaba en 53 de los 58 modelos (traido via GitHub Actions a la rama fuente/fortinet-product-matrix y leido pagina por pagina). Los 5 restantes (100F/200F/400F/401F/600F) no aparecian en este documento: es un "Top Selling Models Matrix", subconjunto curado del catalogo completo. '
        + 'REVISADO EL 2026-09-14 (pendiente 36): el vigia lo vio pasar de 109.483 a 123.387 bytes. Es una EDICION NUEVA -PRQMTX-2026-R176-SEP, septiembre 2026, frente a la de julio con la que se transcribio- y por eso sube aqui la fecha. '
        + 'Pero NINGUNA de las cifras que usa el catalogo cambio: se leyeron sus 6 paginas y se contrastaron los 27 modelos FortiGate que publica x 7 campos (fw, vpn, ips, ngfw, tp, sess, cps) = 189 comparaciones, 189 coincidencias y 0 diferencias. Tampoco aparecen modelos nuevos ni desaparece ninguno de los que el catalogo toma de aqui. '
        + 'La lectura se sometio ademas al doble anclaje de `npm run cps`, que acepto las 27 filas sin rechazar ninguna; y se comprobo que ese anclaje sigue vivo desplazando a proposito la fila del 90G a los valores del 200G, que SI fue rechazada. '
        + 'Un matiz para la proxima vez: este documento publica "Power Supplies" (tipo y numero, que respalda `redund`) y NO vatios -esos salen de la tabla "Dimensions and Power" de cada ficha por serie-. Las 27 filas de Power Supplies no chocan con el `redund` del catalogo, incluidos el 80F y el 90G, que el documento describe como "Single AC PS, dual inputs" y el catalogo tiene en `opcional`.' 
        + '2026-09-22: se anade `ssl` (SSL Inspection Throughput), que este documento publica por modelo y que el catalogo NO tenia. La pagina lo estimaba como `tp x 0,65` y el informe de validacion tecnica del 22-sep lo marca como su defecto P0: el cociente ssl/tp va de 0,52 (40F) a 1,18 (50G), asi que un factor unico prometia 390 Mbps en un 40F que da 310 y se quedaba 1,8x corto en el 50G y el 90G. LAS CIFRAS ESTAN TRANSCRITAS DEL INFORME, QUE CITA ESTE DOCUMENTO Y ESTA EDICION, no leidas del PDF en esa sesion: fortinet.com responde 403 al proxy de egreso de ese entorno. Cubre 5 modelos base (30G 400, 40F 310, 50G 1300, 70G 1400, 90G 2600) mas sus 4 variantes con SSD, que heredan por la regla ya documentada en fortinet.js. Los otros 49 quedaron ese dia en null EXPLICITO: el motor los aparta con su motivo cuando el escenario pide ese eje, en vez de sustituirlos por la cifra de otra capa. Completarlos es leer la columna desde una maquina con acceso y pasarlos por `npm run cps`. '
        + '2026-09-23 (etapas 6 y 7): la columna se leyo del PDF de esta edicion, que ya estaba en la rama de transporte, con doble anclaje 27/27 contra `sess` y `cps`; con ella entraron los seis limites de plataforma (`tunGw`, `tunCli`, `sslVpn`, `sslVpnUsers`, `policies`, `vdomMax`), que por eso se suman ahora a `campos`. Lo que este documento ya no lista (400F, 401F, 600F, 1000F, 1001F) sale de sus fichas por serie, declaradas como fuente propia justo debajo; 100F y 200F siguen sin cifra (pendiente F6). '
        + 'LOS RECUENTOS DE ESTA NOTA SON HISTORICOS Y NO SE ACTUALIZAN. "53 de 58" y "49 en null" eran ciertos el dia que se escribieron, y esta misma nota los seguia afirmando cuando la pestana de procedencia ya pintaba otra cosa: el hallazgo F13 del informe de auditoria del 2026-09-23. La cobertura vigente la cuenta `npm run catalogo` sobre el catalogo, y la ficha de cada equipo dice de donde sale cada limite (`limitesDe`); una cifra escrita a mano aqui se quedaria otra vez con el catalogo de ayer. '
        + 'REVISADO EL 2026-10-13: el vigia (corrida 38452344121) lo vio pasar de 123.387 a 123.486 bytes. Es la edicion de OCTUBRE (PROMTX-2026-R177-OCT), traida por traer-fortinet-matrix.yml (corrida 38453579967). Se contrasto por programa, columna a columna sobre el texto del PDF, contra el catalogo servido: 511 cifras de 27 modelos (rendimiento, sesiones, cps, limites y plataforma), seis de ellas leidas a mano porque la maquetacion parte la celda. Coinciden 510. La unica diferencia es el 400G: 30.000 politicas de firewall, donde la de septiembre daba 10.000; entre dos ediciones oficiales manda la mas reciente y se aplico en MATRIX_LIMITES (y a su variante 401G). Ningun modelo entra ni sale. El mismo dia el contraste quedo como comando, `npm run matrix -- <pdf>`, que lee el PDF por coordenadas y compara sin escribir: 621 cifras (rendimiento, limites y plataforma: VDOM, FortiAP, FortiSwitch, tokens, disco, fuentes, formato y variantes) y 0 diferencias tras el cambio del 400G; las interfaces de los ocho de sobremesa y las notas 10, 11 y 12 se leyeron a mano y no cambian. Desde entonces los rotulos de procedencia (`limitesDe`, `plataformaFuente`, `PUERTOS`) citan la edicion de octubre.' },
    { documento: 'FortiOS Maximum Values Table (FortiOS 7.6.7)',
      url: 'https://docs.fortinet.com/max-value-table', estable: false,
      fecha: '2026-10-13', hash: null, cubre: 'vecinos BGP por modelo (router.bgp:neighbor), anclados por columna con las politicas y los tuneles IPsec del Product Matrix', campos: ['bgpPeers'],
      nota: 'La pagina es una aplicacion: sus filas salen de docs.fortinet.com/api/tools/max-values?family=fortigate&version=7.6.7&models=..., traidas por traer-cisco-huawei.yml (rama fuente/fortinet-mvt-datos-2026-10-13, corrida 38452268834). Doble anclaje por columna: 26 de 27 en politicas y 27 de 27 en tuneles. El 3800G no entra (la tabla da 200.000 politicas y el Product Matrix 400.000); 400G, 3000G y 3500G salen «-» en 7.6.7; 7081F y 7121F no figuran. Las filas de vecinos OSPF (declarados a mano, NBMA) y de VRF de BGP no se usan porque no miden lo que pide un diseno, y la tabla no publica rutas aprendidas. Se vigila la URL de la pagina, que es dinamica (estable: false): un cambio de cifras se ve al volver a traer la respuesta de la API.' },
    { documento: 'Fichas por serie de FortiGate 400F, 600F y 1000F (FG-400F-DAT-R22-202604, FG-600F-DAT-R23-202604, FG-1000F-DAT-R17-202604)',
      url: null, fecha: '2026-04', hash: null,
      modelos: ['FortiGate 400F', 'FortiGate 401F', 'FortiGate 600F', 'FortiGate 1000F', 'FortiGate 1001F'], cubre: 'los siete limites de plataforma (inspeccion SSL, tuneles IPsec, SSL-VPN, politicas, VDOM) y la plataforma (VDOM por defecto, almacenamiento, FortiAP, FortiSwitch, tokens) de 400F, 401F, 600F, 1000F y 1001F, que el Product Matrix de septiembre ya no lista',
      campos: null, porQue: 'respalda esos campos SOLO en cinco modelos, y el recuento de radio es por campo y no por modelo: declarar `ssl` o `tunGw` aqui contaria los 56 equipos que los traen del Product Matrix, y un cambio de estas fichas mandaria a revisar cifras que no salen de ellas. La procedencia por modelo ya es dato: `limitesDe` y `plataformaFuente` en fortinet.js',
      nota: 'Los siete LIMITES se aplicaron el 2026-09-23 (etapa 7, `FICHAS_LIMITES` en fortinet.js) con doble anclaje de cuatro anclas -sesiones, sesiones nuevas/s, Threat Protection e IPsec- que casaron en las tres, 12 de 12; ese ancla se comprueba al cargar fortinet.js, no solo el dia de la transcripcion, asi que si alguien corrige un `sess` sin volver a leer la ficha los limites dejan de aplicarse y el arranque lo dice. La tabla de PLATAFORMA (`FICHAS_PLATAFORMA`: VDOM por defecto, disco, FortiAP, FortiSwitch, tokens) se transcribio de las mismas tres fichas y NO tiene ancla automatica propia: lo que la respalda es haber salido del mismo documento cuyas cuatro anclas casan, y eso se declara en vez de presentarlo como comprobado. Los PDF se trajeron el 2026-09-03 por las ramas de transporte `fuente/fortinet-datasheets` y `fuente/fortinet-serie`, para leer la alimentacion; nadie los habia leido para esto. '
        + 'SIN URL A PROPOSITO: el repositorio no conserva la URL exacta de cada ficha -los workflows que las trajeron se retiraron-, Fortinet sirve unas en /data-sheets/ y otras en /data-sheets/pdf/, y este entorno no puede comprobarlo (fortinet.com responde connect_rejected al proxy de egreso, medido de nuevo el 2026-09-23). Poner una de las dos a ojo es inventar una URL, y el vigia la reportaria como inalcanzable para siempre; con null la columna Vigilancia dice «no comprobada», que es la verdad. '
        + 'La misma familia de documentos respalda tambien la alimentacion (leida entre el 2026-09-03 y el 2026-09-11, junto con los System Guide de los chasis) y el `cps` de 400F/401F/600F, con revisiones que van de 2022 a 2026: esas se documentan modelo a modelo en la cabecera de fortinet.js en vez de fingir aqui una fecha unica.' },
    { documento: 'Fichas por serie de FortiGate 100F y 200F, edicion coreana oficial (FG-100F-DAT-R30-20230227, FG-200F-DAT-R17-20230125)',
      url: 'https://www.fortinet.com/content/dam/fortinet/assets/data-sheets/ko_kr/ds-fortigate-100f-series_ko.pdf', estable: true,
      fecha: '2023-02', hash: null,
      modelos: ['FortiGate 100F', 'FortiGate 200F'], cubre: 'sesiones nuevas/s y los siete limites de plataforma de 100F y 200F',
      campos: null, porQue: 'respalda esos campos SOLO en dos modelos: declarar `cps` o `ssl` aqui contaria los 58 equipos que los traen, y un cambio de esta ficha mandaria a revisar cifras que no salen de ella. La procedencia por modelo es dato: `limitesDe` en fortinet.js y `fuente` en fortinet-vistas-equipos.json',
      nota: 'Pendiente F6, cerrado el 2026-09-24. La ficha en INGLES da 404 en todas las rutas probadas por `traer-fortinet-pendientes.yml` (el `informe.json` de la rama las lista) y tambien desde internet abierto, medido por otra sesion el mismo dia; la COREANA oficial sigue en el CDN de fortinet.com, con la misma tabla y las etiquetas traducidas: los numeros no se traducen. Se reconstruyo la pagina 7 por coordenadas y se ANCLO con seis cifras ya verificadas por fila (fw, ips, ngfw, tp, vpn, sess): 12 de 12. Es una revision de 2023, anterior a la R42/R28 de 2025 de la que sale el consumo; el rendimiento casa en las seis anclas, el consumo del 100F NO (35,1 W frente a 26,5 W) y por eso el consumo sigue saliendo de la R42. La URL es la del 100F; la del 200F es la misma con `200f`. NO respalda la figura: su dibujo del 100F rotula otro equipo («FortiGate 212F»), y la figura que se sirve sale de la QuickStart Guide (entrada siguiente), que dibuja un 101F de la misma serie.' },
    { documento: 'QuickStart Guide FortiGate 100F Series y FortiGate 200F Series',
      url: 'https://fortinetweb.s3.amazonaws.com/docs.fortinet.com/v2/attachments/42d64717-83f1-11e9-81a4-00505692583a/FG-100F-QSG.pdf', estable: true,
      fecha: '2025-02', hash: null,
      modelos: ['FortiGate 100F', 'FortiGate 200F'], cubre: 'la figura frontal y trasera de 100F y 200F',
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
      nota: 'Condicion 2 del GO CONDICIONADO, cerrada el 2026-09-24. La regla de 7.6.3+ venia CITADA del informe y sin leer (`leida:false`): la pagina «SSL VPN tunnel mode replaced with IPsec VPN» de las Release Notes de 7.6.3 (docs.fortinet.com, traida desde Actions) dice lo mismo, «This applies to all FortiGate models». Y la de 7.6.0 dejaba la compatibilidad «desconocida» porque el Product Matrix no dice que modelos tienen 2 GB de RAM: estas Release Notes dan la lista (40F y variantes, 60F, 61F) y la cierran, «FortiGate models not listed above will continue to have SSL VPN web and tunnel mode support». La URL es la del PDF de 7.6.0 (revision del 2026-09-10). REVISADO EL 2026-10-13: el vigia lo vio cambiar (1.325.974 a 1.338.345 bytes); traido por traer-cisco-huawei.yml (rama fuente/fortinet-rn-2026-10-13), su Change Log solo anade desde el 2026-09-10 «Resolved issues» (09-28, 10-13) y «Known issues» (10-06). Los «Special notices» que respaldan `FORTIOS` no cambian: la lista de modelos de 2 GB sin SSL-VPN sigue siendo 40F y variantes, 60F y 61F.' },
    { documento: 'FortiGate 7081F System Guide (7.0.5) y FortiGate-7121F System Guide (7.4.4)',
      url: 'https://fortinetweb.s3.amazonaws.com/docs.fortinet.com/v2/attachments/c7e69026-9283-11eb-b70b-00505692583a/fortigate-7121F-system-guide.pdf', estable: true,
      fecha: '2024-06', hash: null,
      modelos: ['FortiGate 7081F', 'FortiGate 7121F'], cubre: 'la figura frontal y trasera de los chasis 7081F y 7121F, y la alimentacion del 7121F (hasta ocho fuentes, p. 8; cuantas hacen falta segun los modulos, p. 24)',
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
      url: null, fecha: '2026-08', hash: null, modelos: ['Catalyst 8000', 'ISR 1000', 'Meraki MX', 'ASR 1000'], cubre: 'cifras tecnicas de Catalyst 8000, ISR 1000, Meraki MX y ASR 1000', campos: null, porQue: 'la entrada dice "cifras tecnicas" sin decir cuales; declararlas exige abrir los datasheets, y adivinarlas mandaria a revisar los campos equivocados',
      nota: 'Verificacion de la Fase 2.' },
    { documento: 'Boletines oficiales de fin de venta (EOL)',
      url: 'https://www.cisco.com/c/en/us/products/collateral/networking/sdwan-routers/catalyst-8000-edge-platforms/catalyst-c8300-2n2s-4t2x-6t-1n-4t-c8200l-eol.html', estable: true,
      fecha: '2026-07-27', hash: null, modelos: ['Catalyst 8200L', 'Catalyst 8200', 'Catalyst 8300-1N1S-6T', 'Catalyst 8300-2N2S-6T', 'Catalyst 8500-12X4QC', 'ASR 1000'], cubre: 'fechas de ultimo pedido de los chasis Catalyst 8300 (8300-1N1S-6T y 8300-2N2S-6T), 8200 y 8200L, 8500-12X4QC y la linea ASR 1000', campos: ['eolAnnounced'],
      nota: 'La regla de ficha.js compara la fecha de ultimo pedido contra la de hoy, asi que un equipo deja de proponerse solo el dia que vence.' },
    { documento: 'Cisco 8300 Series Secure Routers Data Sheet',
      url: 'https://www.cisco.com/c/dam/en/us/products/collateral/routers/secure-routers/8300-series-secure-routers-ds.pdf', estable: true,
      fecha: '2026-09-03', hash: null, modelos: ['Cisco Secure Router C8355-G2'], cubre: 'rendimiento y escala del C8355-G2 y el C8375-E-G2, mas su alimentacion y consumo tipico', campos: ['sdwan', 'redund', 'psu'],
      nota: '2026-09-03: traida via GitHub Actions. Es la que cierra el `sdwan: null` del C8355-G2 con 8,7 Gbps, y la que corrigio su `redund` a true (la ficha rotula la fila «Power Supply (Default - Dual PSU)»). La fila entro con doble anclaje: su forwarding de 38 Gbps y su IPsec de 20 Gbps ya coincidian con este catalogo.' },
    { documento: 'Export de CCW (Products_115951960955347.xlsx)',
      url: null, fecha: '2026-08-17', hash: null, modelos: ['Secure Router (G2)'], cubre: 'precios de lista y confirmacion de la generacion Secure Router (G2)', dominio: 'precio', campos: null,
      nota: 'Export real de la herramienta de cotizacion de Cisco.' },
  ],

  juniper: [
    { documento: 'SRX300 Line of Firewalls for the Branch Datasheet',
      url: 'https://www.juniper.net/gb/en/products/security/srx-series/srx300-line-firewalls-branch-datasheet.html', estable: false,
      fecha: '2026-10-02', hash: null, modelos: ['SRX 300'], cubre: 'firewall en las dos bases, IPsec en las dos bases, IPS, sesiones y conexiones por segundo de la linea SRX300 (300/320/340/345/380)', campos: ['fw', 'fwImix', 'vpn', 'vpnImix', 'ips', 'sess', 'cps'],
      nota: '2026-10-02: traido via GitHub Actions (traer-cisco-huawei.yml, corrida 37011208335, rama de transporte fuente/cisco-huawei). La URL de EE. UU. devolvio 39 KB sin la tabla y la del Reino Unido la pagina entera, con la tabla «Performance and Scale». Es la edicion VIGENTE de la linea y sustituye a la matriz de 2020 para estos cinco modelos: Juniper re-evaluo al alza (el SRX300 pasa de 1 a 1,9 Gbps de firewall y de 300 a 336 Mbps de IPsec). Se aplico con `npm run juniper --force`, anclado por las columnas que ya casaban: vpnImix, ips, sess y cps en 300/320/340/345, y fw, fwImix, vpn, vpnImix e ips en el SRX380. Cierra la disputa del SRX380: confirma los 20/6,5/4,4 Gbps guardados, que la matriz de 2020 contradecia, y le da 380.000 sesiones y 50.000 conexiones por segundo. No publica la capa de Advanced Threat: su «Secure Web Access firewall» no incluye proteccion contra malware, asi que no se transcribe como `atp`. La pagina no fecha su revision (© 1999-2025): la fecha es la de la lectura. `estable: false` porque su estabilidad entre peticiones no se ha medido todavia.' },
    { documento: 'SRX Series and vSRX Performance and Features Matrix',
      url: 'https://www.juniper.net/content/dam/www/assets/datasheets/us/en/security/security-products-comparison-chart.pdf', estable: true,
      fecha: '2020-08', hash: null, modelos: ['SRX1500', 'SRX340', 'SRX345'], cubre: 'firewall por base de medicion, IPsec, IPS, ATP y sesiones del SRX1500, y el `atp` del SRX340 y el SRX345; el resto de la linea SRX300 lo respalda su datasheet vigente', campos: ['fw', 'fwImix', 'vpn', 'ips', 'atp', 'sess', 'cps'],
      nota: '2026-09-02: traido via GitHub Actions (mismo patron que Fortinet). El documento en si es de agosto de 2020 (pie de pagina "1000265-021-EN Aug 2020") — la fecha "2026-08" que llevaba este registro era una suposicion de cuando no se podia leer el documento, no una medicion; corregida. Sigue siendo el que sirve la URL oficial de Juniper hoy. El propio documento enlaza fichas individuales por modelo (p.3) que se intentaron traer para contrastar, pero sus URL de 2020 ya no resuelven a un PDF (devuelven una pagina HTML) — no se agregan como fuente hasta tener una URL vigente confirmada. 2026-10-02: PARA LA LINEA SRX300 ES UNA EDICION ANTERIOR. Su datasheet vigente (arriba) publica cifras mas altas, y las que esta matriz habia hecho «corregir» el 2026-09-02 —el fwImix de la linea y la disputa del SRX380— eran las de la edicion nueva. El doble anclaje caza una fila desplazada, no una edicion vieja: eso lo decide la fecha del documento.' },
    { documento: 'Hardware guides por modelo (SRX300/320/340/345/1500/1600/2300/4100/4200/4300/4700)',
      url: 'https://www.juniper.net/documentation/us/en/hardware/srx1600/index.html', estable: true,
      fecha: '2026-09-03', hash: null, modelos: ['SRX 300', 'SRX 1500', 'SRX 1600', 'SRX 2300', 'SRX 4000'], cubre: 'alimentacion, redundancia de fuente y consumo medio de los 12 modelos SRX, de las series SRX 300, SRX 1500, SRX 1600, SRX 2300 y SRX 4000 (vigilado: el SRX1600); desde el 2026-10-19 declara sus series y no `*`, porque el catalogo Juniper incluye ya los Session Smart Router', campos: ['redund', 'psu'],
      nota: 'Una guia por modelo, traidas via GitHub Actions y leidas a mano. El material comercial de Juniper publica rendimiento pero NO alimentacion: esto es lo unico que la trae. Se comprobo que cada guia hable solo de su equipo antes de aplicar nada. URL CORREGIDA EL 2026-09-16, MIDIENDOLO (pendiente 38): antes apuntaba al INDICE `/documentation/us/en/hardware/`, que no es un documento sino un directorio y devuelve 403 SIEMPRE — el vigia llevaba desde el 2026-09-14 sin poder leer nada, y esa fuente se quedaba «no comprobada» para siempre. Que no era un bloqueo lo probo un grupo de control: la matriz SRX del mismo dominio respondio 200 en la misma corrida. Ahora se vigila la pagina del SRX1600, que responde 200. NO CUBRE LOS OTROS ONCE: el vigia sigue mirando una URL por fuente, asi que esta alarma avisa de que Juniper toco la guia de UN modelo, no de los doce. Es menos de lo que la entrada prometia antes, y mas de lo que de verdad hacia, que era nada.' },
    { documento: 'Fichas por modelo de la generacion 2024 (SRX1600, SRX2300, SRX4300)',
      url: 'https://www.juniper.net/content/dam/www/assets/datasheets/us/en/security/srx1600-firewall-datasheet.pdf', estable: true,
      fecha: '2026-09-03', hash: null, modelos: ['SRX1600', 'SRX2300', 'SRX4300'], cubre: 'fwImix, IPS y ATP de la generacion que la matriz de 2020 no alcanza', campos: ['fwImix', 'ips', 'atp'],
      nota: 'Traidas via GitHub Actions. Publican el rendimiento en DOS metodos y confundirlos es el error que este catalogo persigue: «TPS Method: throughput of average HTTP sessions» da 19 Gbps de NGFW en el SRX1600 sobre un firewall de 24, mientras «CPS Method: short-lived sessions» da 4,5. Se transcribe siempre CPS, el unico metodo en el que Juniper publica tambien las capas profundas. Cada fila entro con triple anclaje (fw, vpn y sess ya coincidian). La URL es la del directorio; cada ficha vive en srx<modelo>-firewall-datasheet.pdf. El SRX4100, el SRX4200 y la linea SRX300 dan 404 en ese patron, y el SRX4700 fallo la conexion: reportado, no dado por bueno. URL CORREGIDA EL 2026-09-16, MIDIENDOLO (pendiente 38): antes apuntaba al DIRECTORIO, que devuelve 403 siempre porque un CDN no sirve listados — no era un bloqueo a Juniper, y lo probo el grupo de control: la matriz SRX, ARCHIVO DEL MISMO DIRECTORIO, respondio 200 en la misma corrida. Ahora se vigila la ficha del SRX1600 (200 OK, PDF real de 484 KB); la del SRX4300 tambien responde y sigue el mismo patron. Vigila UNA de las tres fichas, no las tres: el vigia mira una URL por fuente.' },
    { documento: 'SRX Series Hardware Dates & Milestones',
      url: 'https://support.juniper.net/support/eol/product/srx_series/', estable: true,
      fecha: '2026-09-03', hash: null, modelos: ['SRX1500', 'SRX4100'], cubre: 'fin de venta del SRX1500 (TSB101240) y el SRX4100 (TSB101895), ambos con ultimo pedido 2026-04-15', campos: ['eolAnnounced'],
      nota: 'La tabla mezcla en las mismas filas el fin de vida de paquetes de software con el del hardware, asi que solo se aceptan las filas cuyo SKU es el chasis o el sistema del propio modelo. Con ese filtro, de los 12 modelos del catalogo exactamente 2 tienen fin de venta del equipo. CORREGIDO EL 2026-09-14 A `estable: true`, MIDIENDOLO: `npm run vigia -- --sondeo` desde Actions pidio esta URL dos veces con 15 s de diferencia y devolvio los mismos 104.377 bytes y el mismo hash. Estaba declarada inestable por suposicion -"es una pagina viva que crece con cada boletin"- y eso la dejaba SIN ALARMA: un boletin nuevo de fin de venta se habria reportado como "vario (pagina dinamica)" y nadie se habria enterado. Es el fallo contrario al de Cisco y sale del mismo sitio: un campo puesto a ojo.' },
    { documento: 'SSR100 Line of Routers Datasheet (1000728-005-JP)',
      url: 'https://www.juniper.net/content/dam/www/assets/datasheets/jp/ja/routers/ssr100-line-of-routers-datasheet.pdf', estable: true,
      fecha: '2023-03', hash: null, modelos: ['SSR 100'], campos: ['cap', 'capCif', 'capHmac', 'cap1500', 'capCif1500', 'capHmac1500', 'redund', 'psu', 'ifaces'],
      cubre: 'rendimiento agregado del SSR120 y el SSR130 en tres capas de cifrado (sin cifrar, solo cifrado, cifrado + HMAC), en IMIX y con 1.500 B; puertos y alimentacion',
      nota: 'Traido el 2026-10-19 por traer-cisco-huawei.yml (corrida 39357025445, rama fuente/juniper-ssr-2026-10-19). La URL en ingles devolvio HTML; la japonesa, el PDF. Medido con Session Smart v5.4.4. `cap` ya casaba en los dos (1,5 y 2 Gbps): era la capa «sin cifrar» en IMIX. La entrada de fuente redundante del chasis la ficha la marca como no soportada. No publica IDP ni filtrado URL.' },
    { documento: 'SSR1000 Line of Routers Datasheet (1000757-002-EN)',
      url: 'https://www.juniper.net/content/dam/www/assets/datasheets/us/en/routers/ssr1000-line-of-routers-datasheet.pdf', estable: true,
      fecha: '2023-03', hash: null, modelos: ['SSR 1000'], campos: ['cap', 'capCif', 'capHmac', 'cap1500', 'capCif1500', 'capHmac1500', 'redund', 'psu', 'ifaces'],
      cubre: 'rendimiento agregado de SSR1200, SSR1300, SSR1400 y SSR1500 en tres capas de cifrado, en IMIX y con 1.500 B; puertos, fuentes 1+1 y consumo maximo',
      nota: 'Traido el 2026-10-19 por traer-cisco-huawei.yml (corrida 39357025445). Medido con Session Smart v5.4.4 (v5.4.9 en el SSR1500). `cap` casaba en los tres que ya estaban (10, 20 y 40 Gbps = «Unencrypted IMIX»); el SSR1500 entra de alta con sus seis cifras. Varias celdas llevan la nota «Max throughput on single NIC»: tope del puerto, transcrito igual. Corrigio el motor, que dividia por un factor IMIX una cifra que ya era IMIX. No publica IDP ni filtrado URL.' },
    // 2026-10-19: los MX que el cotizador, el portal y la guia citan sin pareja en un
    // dimensionador. No son equipos de MODELS (el dimensionador Juniper es SRX y SSR), asi que
    // `modelos: []` y `campos: null`: la procedencia es la del texto escrito de esas tres listas.
    { documento: 'MX 204/240/480/960 Series Universal Routing Platforms Datasheet (1000597-042-JP)',
      url: 'https://juniper.net/content/dam/www/assets/datasheets/jp/ja/routers/mx-204-240-480-960-series-universal-routing-platforms-datasheet.pdf', estable: true,
      fecha: '2024-09', hash: null, modelos: [], campos: null,
      porQue: 'respalda texto escrito del cotizador, del portal y de la guia (MX204, MX480, MX960), equipos que no estan en MODELS',
      cubre: 'capacidad maxima (full duplex), ranuras y puertos de MX204, MX240, MX480 y MX960: tabla 1 del documento',
      nota: 'Traido el 2026-10-19 por traer-cisco-huawei.yml (corrida 39356629214, rama fuente/juniper-mx-2026-10-19). Solo se encontro en japones; las cifras de la tabla 1 no dependen del idioma: MX960 12 Tbps y 11 MPC, MX480 7,5 Tbps y 6 MPC, MX240 3 Tbps, MX204 400 Gbps con 8x10GbE + 4x100GbE. La nota 1 dice que son cifras full duplex. Corrigio el cotizador, el portal y la guia, que daban al MX480 7,7 Tbps y al MX960 19,2 Tbps y 12 ranuras. La URL en ingles (1000597-en.pdf) devolvio HTML, no el PDF.' },
    { documento: 'MX304 Universal Routing Platform (a00150831ENW, Rev. 1)',
      url: 'https://www.hpe.com/psnow/doc/a00150831enw', estable: false,
      fecha: '2025-10-12', hash: null, modelos: [], campos: null,
      porQue: 'respalda texto escrito del cotizador, del portal y de la guia (MX304), equipo que no esta en MODELS',
      cubre: 'capacidad (4,8 Tbps en 2 RU), densidad por chasis (48x100GbE / 12x400GbE en tres MIC) y referencias de pedido del MX304',
      nota: 'La ficha de juniper.net es ya un visor de HPE; el PDF se trajo de psnow el 2026-10-19 (corrida 39356819148, rama fuente/juniper-mx304-2026-10-19), con la URL leida de esa misma pagina. Confirma los 4,8 Tbps que ya citaba el cotizador y corrige «MPC slots»: el MX304 lleva MIC (MX304-LMIC16-BASE, 16x100GbE / 4x400GbE). Fecha: la de creacion del PDF. `estable: false` hasta medirlo con el sondeo.' },
  ],

  huawei: [
    { documento: 'NetEngine 8000 M8 Universal Service Router Datasheet',
      url: 'https://e-file.huawei.com/marketingcloud/pep/asset/20000001/Material/e9dd06e260b64df683f6221fc8442cbf/M3T1A590N1140253824460255266/NetEngine%208000%20M8%20Universal%20Service%20Router%20Datasheet.pdf', estable: true,
      fecha: '2025-06-12', hash: null, modelos: ['NE8000 M8'], cubre: 'capacidad de conmutacion del NE8000 M8 por tarjeta de control (IPU-480, IPU-1T2, IPU-2T4), y su figura (`huawei-vistas-equipos.json`)', campos: ['cap', 'redund', 'psu'],
      nota: '2026-10-02: traido via GitHub Actions (traer-cisco-huawei.yml, rama de transporte fuente/cisco-huawei), porque los dominios de Huawei estan bloqueados por el proxy de egreso de este entorno. La fecha es la de generacion del PDF (sus metadatos; el texto dice «© 2022»). La identidad se comprobo por el contenido: el titulo del PDF dice «NetEngine 8000 M4», una plantilla, pero el documento nombra el M8 catorce veces y el M4 ninguna. Corrigio la fila del M8, que llevaba la capacidad y los Mpps exactos del F1A: con la IPU-2T4 (tarjetas de 400 G, 774 W tipicos) la conmutacion es 4,8 Tbps. No publica Mpps, asi que el `mpps` del M8 queda en null.' },
    { documento: 'NetEngine 8000 F8 Datasheet',
      url: 'https://e.huawei.com/marketingcloud/pep/asset/20000001/Material/49184bd3a3c54e4b90f6d73b55ba1558/M3T1A590N1101892422391505075/NetEngine%208000%20F8%20Datasheet.pdf', estable: true,
      fecha: '2025-02-27', hash: null, modelos: ['NE8000 F8'], cubre: 'capacidad de conmutacion del NE8000 F8 en sus versiones 2T y 6.4T, y su figura (`huawei-vistas-equipos.json`)', campos: ['cap'],
      nota: '2026-10-02: traido por el mismo camino que la ficha del M8, y con la misma comprobacion de identidad (titulo de plantilla, contenido del F8). Publica 4 Tbps de conmutacion para la version 2T y 12,8 Tbps para la 6.4T; la fila del catalogo es la 6.4T (tarjetas de 800 G, 2.370 W tipicos) y llevaba 6,4 Tbps, que es su capacidad de puertos, la mitad. Tampoco publica Mpps: el 2.035 del F8 sigue respaldado por la verificacion de la Fase 2.' },
    { documento: 'NetEngine 8000 M14 Universal Service Router Datasheet',
      url: 'https://e-file.huawei.com/marketingcloud/pep/asset/20000001/Material/f4f1a7b9424a44ff9770b75a19eb5d2e/M3T1A590N1267221252983996547/NetEngine%208000%20M14%20Universal%20Service%20Router%20Datasheet.pdf', estable: true,
      fecha: '2026-05-27', hash: null, modelos: ['NE8000 M14'], cubre: 'capacidad de conmutacion y consumo tipico del NE8000 M14 por tarjeta de control (IPU-1T2, IPU-2T, IPU-3T6), y su figura (`huawei-vistas-equipos.json`)', campos: ['cap'],
      nota: '2026-10-02: traido por el mismo camino que las fichas del M8 y el F8; la URL del PDF se descubrio en la pagina de documentos de Huawei (material f4f1a7b9...), no se adivino. La fecha es la de generacion del PDF; el texto dice «© 2025». Identidad comprobada por el contenido: el titulo dice «NetEngine 8000 M4», la plantilla de siempre, y el texto nombra el M14 doce veces y el M4 ninguna. Conmutacion: 2,4 / 4 / 7,2 Tbps segun la IPU. La fila llevaba 2 Tbps (la capacidad de puertos de la IPU-2T) y el portal y la guia 7,2: se alinea con la IPU-3T6, la tarjeta mas alta, como la fila del M8. No publica Mpps.' },
    { documento: 'Huawei NetEngine AR8000 Series Enterprise Router Data Sheet-R25C10',
      url: 'https://e.huawei.com/marketingcloud/pep/asset/20000001/Material/eeda8c0f3659461cbe23ad0a36bc7d78/M3T1A590N1244677017247076576/Huawei%20NetEngine%20AR8000%20Series%20Enterprise%20Router%20Data%20Sheet-R25C10.pdf', estable: true,
      fecha: '2026-03-28', hash: null, modelos: ['AR8140-12G10XG', 'AR8140-T-12G10XG', 'AR8700-8'], cubre: 'reenvio, IPsec y SD-WAN tipico (IMIX) del AR8140-12G10XG, el AR8140-T-12G10XG y el AR8700-8, sus piezas de pedido («Ordering Information»: la SPU-700H y la MPU del AR8700-8) y su figura (`huawei-vistas-equipos.json`); desde el 2026-10-14 tambien sus capacidades SD-WAN (`capSdwan`: tabla «Software Features and Protocols», filas SD-WAN IPsec e IPsec + QoS en IMIX, memoria, paquetes N1 y suscripcion de amenazas de la «Ordering Information»), releida entera con pdftotext sobre la copia de Actions', campos: ['fwd', 'ipsec', 'typ', 'redund', 'psu', 'parts', 'capSdwan'],
      nota: '2026-10-05: traido via GitHub Actions (traer-cisco-huawei.yml, rama de transporte fuente/cisco-huawei) y leido dos veces, con PDF4me y con pdf-parse sobre la copia de Actions. La fecha es la de generacion del PDF. Reenvio e IPsec casan con el catalogo; el SD-WAN tipico (IPsec + QoS + SA + AppFlow) es 15 Gbps en el AR8140 y 15,5 en el AR8700-8, y el catalogo decia 12 y 24. Los 24 del AR8700-8 son la fila «SD-WAN IPsec performance» de esta misma tabla (solo IPsec): una fila confundida, no otra edicion. Se corrigio con `npm run huawei -- --force`, anclado en reenvio e IPsec. No publica Mpps.' },
    { documento: 'Huawei NetEngine AR6710-H Series Enterprise Router Data Sheet-R25C10',
      url: 'https://e-file.huawei.com/marketingcloud/pep/asset/20000001/Material/c63ee1473b9147a4b6a50dc64c8f1bcd/M3T1A590N1244327824896741626/Huawei%20NetEngine%20AR6710-H%20Series%20Enterprise%20Router%20Data%20Sheet-R25C10.pdf', estable: true,
      fecha: '2026-03-26', hash: null, modelos: ['AR6710-H4T4X2Y7'], cubre: 'reenvio, IPsec y SD-WAN tipico (IMIX) del AR6710-H4T4X2Y7, sus piezas de pedido («Ordering Information»: la placa de control SRU-700S; la potencia de su fuente, 300 W AC / 260 W DC) y su figura (`huawei-vistas-equipos.json`); desde el 2026-10-14 tambien sus capacidades SD-WAN (`capSdwan`: tabla «Software Features and Protocols», filas SD-WAN IPsec e IPsec + QoS en IMIX, memoria, paquetes N1 y suscripcion de amenazas de la «Ordering Information»), releida entera con pdftotext sobre la copia de Actions', campos: ['fwd', 'ipsec', 'typ', 'redund', 'psu', 'parts', 'capSdwan'],
      nota: '2026-10-05: traido via GitHub Actions (traer-cisco-huawei.yml, rama de transporte fuente/cisco-huawei) y leido dos veces, con PDF4me y con pdf-parse sobre la copia de Actions. Confirma las tres cifras del catalogo (13, 10 y 7 Gbps). Su nota al pie define el SD-WAN tipico como IPsec + QoS + SA + AppFlow, la suma de los dos sentidos: es la capa `typ` del motor. No publica Mpps.' },
    { documento: 'NetEngine AR5700, AR6700, and AR8000 Hardware Description (EDOC1100213474), pagina del AR6710-H4T4X2Y7',
      url: 'https://support.huawei.com/enterprise/en/doc/EDOC1100213474/3e859eec/ar6710-h4t4x2y7', estable: false,
      fecha: '2026-07-23', hash: null, modelos: ['AR6710-H4T4X2Y7'], cubre: 'los codigos de las fuentes del AR6710-H (PAC300S12-CL en AC; PDC260S12-CL y PDC260S12-DL en DC), sus dos ranuras de fuente y la SRU-700S como unica placa de control admitida', campos: ['parts', 'psu'],
      nota: '2026-10-07: leida renderizada por PDF4me (convert_url_to_pdf sobre la URL oficial y extraccion de su texto), porque la pagina es una aplicacion que a Actions le llega como cascaron de 3,8 KB (corrida 37556865487) y que Akamai niega a un Chromium sin cabeza; el Wayback Machine solo guardo ese mismo cascaron. La fecha es la que publica la pagina («Update Date: 2026-07-23»). SIN COPIA CON HASH: el resultado de PDF4me vive en api.pdf4me.com, que el proxy de este entorno deniega, y la pagina no se puede traer por Actions. Dice «Number of power modules 2» y «Double AC power modules (1+1)», que son las ranuras y la redundancia admitida, no cuantas fuentes vienen: el AR6710-H sigue sin `redund`. Las paginas hermanas del AR6710-L26/L50 (URL sacadas del indice del Wayback Machine) no se pudieron renderizar: PDF4me fallo despues con todas las URL, tambien con example.com.' },
    { documento: 'NetEngine AR5700, AR6700, and AR8000 Hardware Description (EDOC1100213474), paginas del AR6710-L26T2X4, L50T2X4, L14T2X4 (02355PSD) y AR8700-8',
      url: 'https://support.huawei.com/enterprise/en/doc/EDOC1100213474/5d943f96/ar6710-l26t2x4', estable: false,
      fecha: '2026-07-23', hash: null, modelos: ['AR6710-L26T2X4', 'AR6710-L50T2X4', 'AR6710-L14T2X4', 'AR8700-8'], cubre: 'las fuentes admitidas del AR6710-L26 y L50 (PAC350S12-CR o PAC180S12-CN en AC, PDC240S12-CN en DC) y las dos fuentes AC integradas del AR6710-L14', campos: ['parts', 'psu', 'redund'],
      nota: '2026-10-14: leidas en el Chrome del dueño (extension Claude in Chrome) con su sesion abierta; las paginas se sirven tambien sin sesion, pero este entorno no las alcanza (proxy de egreso) y a Actions le llega el cascaron. La fecha es la que publica la pagina («Update Date: 2026-07-23»). Las URL hermanas: L50 .../b4f79aa3/ar6710-l50t2x4, L14 .../7e1615f9/ar6710-l14t2x4-02355psd, AR8700-8 .../bc4a40e7/ar8700-8. El L14 dice «AC built-in», 2 modulos, 1:1: vienen integradas, y pasa a `redund: true`. El L26, el L50 y el AR8700-8 solo dan ranuras («Number of power modules 2») y la redundancia admitida, no cuantas fuentes vienen: siguen sin `redund`. La guia de instalacion (EDOC1100316397, «Unpacking the Router») tampoco lo dice; lo decide el pedido. SIN COPIA CON HASH: leida en el navegador del dueño.' },
    { documento: 'Huawei SD-WAN Solution Datasheet R25C00',
      url: 'https://e-file.huawei.com/marketingcloud/pep/asset/20000001/Material/c39e035b25f14a1897536864b6b928b3/M3T1A590N1185280594916528416/Huawei%20SD-WAN%20Solution%20Datasheet_R25C00.pdf', estable: true,
      fecha: null, hash: null, cubre: 'que funciones trae cada paquete N1 (Foundation, Advanced) y los add-on (Enhanced IFIT, Security Threat Prevention): decide cuando el BOM fija Advanced (`N1_SOLO_ADVANCED` en huawei-motor.js)', campos: ['capSdwan'],
      nota: '2026-10-14: leida en el Chrome del dueño (visor de PDF, paginas 13 y 14, «Software Package Functions»), porque a este entorno, a Firecrawl y a la descarga desde su equipo les da 403. Solo Advanced: multicast IP sobre SD-WAN, QoS adaptativo, compresion de datos, recomendacion inteligente de politicas, ITP, NetStream, IFIT estatico y orquestacion automatica de vCPE. Los dos: topologias hub-spoke/full-mesh/partial-mesh con tunel dinamico, jerarquica, multi-hub y multi-VPN, IWG, IPv6, Internet local/centralizado/hibrido, POP, QoS y HQoS, balanceo por paquete, duplicacion por varias rutas, FEC/A-FEC, IPsec/ACL/firewall. IPS, URL y antivirus solo con el add-on Security Threat Prevention; IFIT dinamico con Enhanced IFIT. No da topes de tuneles, sedes ni rutas. SIN FECHA: el documento dice © 2025 y no publica revision; SIN COPIA CON HASH: leida en el navegador del dueño.' },
    { documento: 'Huawei NetEngine AR502H-V2 Series Enterprise Router Data Sheet',
      url: 'https://e-file.huawei.com/marketingcloud/pep/asset/20000001/Material/4cca978bb8e74d2390504b091884b299/M3T1A590N1314888556208275475/Huawei%20NetEngine%20AR502H-V2%20Series%20Enterprise%20Router%20Data%20Sheet.pdf', estable: true,
      fecha: '2026-10-07', hash: null, modelos: ['AR502H-V2'], cubre: 'reenvio, IPsec y SD-WAN tipico (IMIX), capacidades SD-WAN, alimentacion DC doble y el adaptador PAC36S24-CN del AR502H-LTE4EA-V2, LTE4AU-V2 y NRGL-V2', campos: ['fwd', 'ipsec', 'typ', 'psu', 'redund', 'parts', 'capSdwan'],
      nota: '2026-10-14: traida via GitHub Actions el 2026-10-12 (traer-cisco-huawei.yml, rama fuente/huawei-familias-2026-10-12, corrida 38307704965), descubierta en la pagina de documentos de la familia; leida con pdftotext. La fecha es la de generacion del PDF. Una sola columna de rendimiento para la serie: 1,3 Gbps de reenvio (NAT+ACL+QoS, IMIX), 800 Mbps de IPsec, 1 Gbps de SD-WAN IPsec, 800 de SD-WAN (IPsec + QoS) y 620 de SD-WAN tipico, todo IMIX. El AR502H-ELTE-V2 (eLTE, red privada) no entra. No publica Mpps ni cuantos APs gestiona.' },
    { documento: 'Huawei NetEngine AR6700V-L Virtual Router Data Sheet-R26C00',
      url: 'https://e-file.huawei.com/marketingcloud/pep/asset/20000001/Material/38fc9bf1621e4da1be2124f1a0682d46/M3T1A590N1311350166408065076/Huawei%20NetEngine%20AR6700V-L%20Virtual%20Router%20Data%20Sheet-R26C00.pdf', estable: true,
      fecha: '2026-09-28', hash: null, modelos: ['AR6700V-L'], cubre: 'SD-WAN tipico (IMIX) del AR6700V-L de 4, 8 y 16 vCPU, su SD-WAN IPsec a 1400 bytes, la RAM por tamano y las capacidades SD-WAN (IPS, URL y antivirus solo desde 4 vCPU)', campos: ['typ', 'capSdwan', 'psu', 'redund'],
      nota: '2026-10-14: traida via GitHub Actions el 2026-10-12 (traer-cisco-huawei.yml, rama fuente/huawei-familias-2026-10-12); leida con pdftotext. La fecha es la de generacion del PDF. SD-WAN tipico IMIX: 2 / 4 / 7 Gbps con 4 / 8 / 16 vCPU; con 2 vCPU la ficha pone «-». SD-WAN IPsec solo a 1400 bytes (0,7 / 7 / 14 / 29 Gbps): no se usa para dimensionar, que es IMIX. No publica reenvio ni IPsec IMIX: `fwd` e `ipsec` en null y el modelo se aparta con su motivo si el perfil los pide. Medido en un RH2288X V5 con Xeon Gold 6238R a 2,2 GHz e Intel X710 con SR-IOV, que la pantalla declara. Licencias del vCPE no listadas en la ficha: el BOM dice codigo por confirmar.' },
    { documento: 'Huawei NetEngine AR6700V-L Virtual Router Data Sheet-R25C00',
      url: 'https://e-file.huawei.com/marketingcloud/pep/asset/20000001/Material/38fc9bf1621e4da1be2124f1a0682d46/M3T1A590N1221506358650974336/Huawei%20NetEngine%20AR6700V-L%20Virtual%20Router%20Data%20Sheet-R25C00.pdf', estable: true,
      fecha: null, hash: null, modelos: ['AR6700V-L'], cubre: 'el SD-WAN IPsec IMIX del AR6700V-L de 2, 4, 8 y 16 vCPU (400 Mbps, 3, 5 y 11 Gbps), que la edicion R26C00 ya no publica', campos: ['capSdwan'],
      nota: '2026-10-15: leida en el Chrome del dueño (visor de PDF, p. 3, «Performance data»); a este entorno le da 403. Ancla con la R26C00 en dos filas: SD-WAN IPsec a 1400 B (0,7 / 7 / 14 / 29 Gbps) y SD-WAN tipico IMIX (- / 2 / 4 / 7 Gbps). La R26C00 quito la fila IMIX del SD-WAN IPsec, no la contradice, asi que manda la nueva en lo que publica y esta en lo que solo ella da. Nota al pie: el modelo es EVPN + IPsec (AES-256-CBC), suma de los dos sentidos. No sustituye a `ipsec` (IPsec IMIX), que sigue en null. SIN FECHA: el texto dice © 2021 y no publica revision.' },
    { documento: 'NetEngine AR6700V-L V600R025C00 License Usage Guide (EDOC1100516044)',
      url: 'https://support.huawei.com/enterprise/en/doc/EDOC1100516044/f3caf584/license-control-items-in-the-n1-model', estable: false,
      fecha: null, hash: null, modelos: ['AR6700V-L'], cubre: 'los paquetes N1 del AR6700V-L por tamano (N1-AR6700V-L-F-xV y -A-xV) y su SnS de 1, 3 y 5 anos', campos: ['capSdwan'],
      nota: '2026-10-15: leida en el Chrome del dueño, paginas «N1 Foundation Packages» (.../6375e815/n1-foundation-packages) y «N1 Advanced Packages» (.../1472d883/n1-advanced-packages). Foundation: ancho de banda de reenvio, sin compresion (desde V600R023C10). Advanced: ancho de banda, compresion, multicast e ITP basada en HQoS (desde V600R023C10SPC100; multicast e ITP desde V600R025C00). El N1 son licencia de software y SnS, las dos obligatorias. No hay paquete sin SD-WAN. SIN COPIA CON HASH.' },
    { documento: 'Huawei NetEngine AR5710-S Series Enterprise Router Data Sheet-R25C10',
      url: 'https://e.huawei.com/marketingcloud/pep/asset/20000001/Material/5ed29e82ccc645fb94689a1fbd26bee7/M3T1A590N1245441110459510930/Huawei%20NetEngine%20AR5710-S%20Series%20Enterprise%20Router%20Data%20Sheet-R25C10.pdf', estable: true,
      fecha: '2026-03-30', hash: null, modelos: ['AR5710-S', 'AR5710-SE'], cubre: 'reenvio, IPsec y SD-WAN tipico (IMIX) de las once filas AR5710-S y AR5710-SE, y su figura (`huawei-vistas-equipos.json`); desde el 2026-10-14 tambien sus capacidades SD-WAN (`capSdwan`: tabla «Software Features and Protocols», filas SD-WAN IPsec e IPsec + QoS en IMIX, memoria, paquetes N1 y suscripcion de amenazas de la «Ordering Information»), releida entera con pdftotext sobre la copia de Actions', campos: ['fwd', 'ipsec', 'typ', 'redund', 'psu', 'capSdwan'],
      nota: '2026-10-05: traido via GitHub Actions (traer-cisco-huawei.yml, rama de transporte fuente/cisco-huawei) y leido dos veces, con PDF4me y con pdf-parse sobre la copia de Actions. Confirma las cifras del catalogo: 1,3 Gbps de reenvio, 800 Mbps de IPsec y 620 de SD-WAN tipico en la AR5710-S, y 1,5 Gbps, 800 y 720 en la AR5710-SE, iguales en todas las columnas de cada tabla. No publica Mpps.' },
    { documento: 'Huawei NetEngine AR5710-H Series Enterprise Router Data Sheet-R26C00',
      url: 'https://e-file.huawei.com/marketingcloud/pep/asset/20000001/Material/cf32710e9bd1417b9a9f16577d65257a/M3T1A590N1315338736208527473/Huawei%20NetEngine%20AR5710-H%20Series%20Enterprise%20Router%20Data%20Sheet-R26C00.pdf', estable: true,
      fecha: '2026-10-09', hash: null, modelos: ['AR5710-H'], cubre: 'reenvio, IPsec y SD-WAN tipico (IMIX), consumo tipico y figura de las nueve filas AR5710-H (`huawei-vistas-equipos.json`); desde el 2026-10-14 tambien sus capacidades SD-WAN (`capSdwan`: tabla «Software Features and Protocols», filas SD-WAN IPsec e IPsec + QoS en IMIX, memoria, paquetes N1 y suscripcion de amenazas de la «Ordering Information»), releida entera con pdftotext sobre la copia de Actions', campos: ['fwd', 'ipsec', 'typ', 'psu', 'capSdwan'],
      nota: '2026-10-12: la serie salio de recorrer las 21 paginas de familia de e.huawei.com/en/products/routers con la sesion del dueño abierta: la pagina de documentos del AR5710-H enlaza una ficha que el repositorio no tenia. Traida via GitHub Actions (traer-cisco-huawei.yml, rama de transporte fuente/huawei-familias-2026-10-12, corrida 38307704965), con el PDF descubierto en su pagina de documentos y no adivinado. La fecha es la de generacion del PDF (sus metadatos). Las nueve filas comparten las tres cifras de la serie: 4 Gbps de reenvio (NAT+ACL+QoS, IMIX, con cambio manual al reenvio por hardware), 1,6 Gbps de IPsec IMIX y 900 Mbps de SD-WAN tipico IMIX; las de SD-WAN son «el total combinado de trafico de entrada y salida», como en el resto de la linea AR. `mpps` queda en null: la ficha no publica paquetes por segundo. El H2T4PN2X-NRGL publica 36 W tipicos y 190 W de maximo porque suma los 130 W de PoE.' },
    { documento: 'Huawei NetEngine AR5710I-RU-NRGL Enterprise Router Data Sheet-R26C00',
      url: 'https://e-file.huawei.com/marketingcloud/pep/asset/20000001/Material/16333c5bd2dc442ba180ef2fecc2d317/M3T1A590N1311286109356806258/Huawei%20NetEngine%20AR5710I-RU-NRGL%20Enterprise%20Router%20Data%20Sheet-R26C00.pdf', estable: true,
      fecha: '2026-09-28', hash: null, modelos: ['AR5710I-RU-NRGL'], cubre: 'reenvio, IPsec y SD-WAN tipico (IMIX), consumo y ficha tecnica ampliada del AR5710I-RU-NRGL, y su figura (`huawei-vistas-equipos.json`); desde el 2026-10-14 tambien sus capacidades SD-WAN (`capSdwan`: tabla «Software Features and Protocols», filas SD-WAN IPsec e IPsec + QoS en IMIX, memoria, paquetes N1 y suscripcion de amenazas de la «Ordering Information»), releida entera con pdftotext sobre la copia de Actions', campos: ['fwd', 'ipsec', 'typ', 'psu', 'capSdwan'],
      nota: '2026-10-12: traido via GitHub Actions (traer-cisco-huawei.yml, rama de transporte fuente/huawei-familias-2026-10-12, corrida 38307704965); el PDF se descubrio en la pagina de documentos de la familia, enlazada desde e.huawei.com/en/products/routers. Equipo industrial IP65 de poste o pared, con 5G integrado: 1,5 Gbps de reenvio (NAT+ACL+QoS, IMIX), 800 Mbps de IPsec y 720 de SD-WAN tipico IMIX. Su unico puerto de consola es USB 3.0 tipo A. No publica Mpps.' },
    { documento: 'Huawei NetEngine AR6000 Series Enterprise Routers Datasheet-R26C00',
      url: 'https://e-file.huawei.com/marketingcloud/pep/asset/20000001/Material/b67ae821185b4ae68465a9494e6e3b81/M3T1A590N1311296491069919315/Huawei%20NetEngine%20AR6000%20Series%20Enterprise%20Routers%20Datasheet-R26C00.pdf', estable: true,
      fecha: '2026-09-28', hash: null, modelos: ['AR6000'], cubre: 'reenvio, IPsec y SD-WAN tipico (IMIX), consumo y ficha tecnica ampliada del AR6121E y el AR6140E-9G-2AC, y sus figuras (`huawei-vistas-equipos.json`); desde el 2026-10-14 tambien sus capacidades SD-WAN (`capSdwan`: tabla «Software Features and Protocols», filas SD-WAN IPsec e IPsec + QoS en IMIX, memoria, paquetes N1 y suscripcion de amenazas de la «Ordering Information»), releida entera con pdftotext sobre la copia de Actions', campos: ['fwd', 'ipsec', 'typ', 'psu', 'redund', 'capSdwan'],
      nota: '2026-10-12: traido por el mismo camino que la del AR5710I-RU-NRGL. Las dos columnas comparten las cifras de la serie: 2 Gbps de reenvio, 2 Gbps de IPsec IMIX y 800 Mbps de SD-WAN tipico IMIX. Solo el AR6140E-9G-2AC declara redundancia de alimentacion («Dual power modules»). La ficha NO dice cuantos APs gestiona el WAC: `apsFree`/`apsMax` quedan en null. Releida entera el 2026-10-12 (tabla tecnica, nota al pie y «Ordering Information»): la unica mencion es la licencia LAR0AC10 («AR6100 AC Express License … WLAN AC»), sin numero de APs; no hay mas que buscar en este documento. La placa del dibujo rotula «AR6121» y «AR6140-9G-2AC» (sin la E); los pies de figura del documento nombran los modelos completos. No publica Mpps.' },
    { documento: 'NetEngine 8000 F1A-C Datasheet',
      url: 'https://e-file.huawei.com/marketingcloud/pep/asset/20000001/Material/b4d387a588a44b67b8a55e9c63847336/M3T1A590N1101968838491570407/NetEngine%208000%20F1A-C%20Datasheet.pdf', estable: true,
      fecha: '2025-02-27', hash: null, modelos: ['NE8000 F1A-C'], cubre: 'conmutacion, consumo tipico, figuras y ficha tecnica del NE8000 F1A-C', campos: ['cap', 'psu'],
      nota: '2026-10-12: traido via GitHub Actions (traer-cisco-huawei.yml, rama de transporte fuente/huawei-familias-2026-10-12, corrida 38307704965); el PDF se descubrio en la pagina de documentos de la familia NE8000 enlazada desde e.huawei.com/en/products/routers. La fecha es la de generacion del PDF. El titulo del PDF es una plantilla («NetEngine 8000 M4»); el texto nombra el F1A-C y nunca el M4. Publica 2,4 Tbps de conmutacion y 325 W tipicos, como el F1A, en una caja de 420 mm con hasta 56 puertos combinables; no publica Mpps ni declara fuentes redundantes.' },
    { documento: 'Huawei NetEngine AR650 Series Enterprise Routers Datasheet (20250810-v3)',
      url: 'https://e.huawei.com/marketingcloud/pep/asset/20000001/Material/c42dc1420bae4b5cb6188ae903e43fd0/M3T1A590N1161701582779183172/Huawei%20NetEngine%20AR650%20Series%20Enterprise%20Routers%20Datasheet_20250810-v3.pdf', estable: true,
      fecha: '2025-08-10', hash: null, modelos: ['AR650'], cubre: 'reenvio con y sin licencia Boost, IPsec y SD-WAN tipico (IMIX) del AR651 y el AR651W-8P, y su figura (`huawei-vistas-equipos.json`); desde el 2026-10-14 tambien sus capacidades SD-WAN (`capSdwan`: tabla «Software Features and Protocols», filas SD-WAN IPsec e IPsec + QoS en IMIX, memoria, paquetes N1 y suscripcion de amenazas de la «Ordering Information»), releida entera con pdftotext sobre la copia de Actions', campos: ['fwd', 'ipsec', 'typ', 'boost', 'redund', 'psu', 'capSdwan'],
      nota: '2026-10-05: traido via GitHub Actions (traer-cisco-huawei.yml, rama de transporte fuente/cisco-huawei) y leido dos veces, con PDF4me y con pdf-parse sobre la copia de Actions. Reenvio 1 Gbps, 2 Gbps con la licencia de rendimiento (LAR0PERFE08), e IPsec 2 Gbps: casan con `boost` y `fwd`. El SD-WAN tipico, 600 Mbps, era el hueco: el AR651 y el AR651W-8P se apartaban del perfil SD-WAN por falta de cifra. Una sola celda para los cinco modelos de la serie. No publica Mpps.' },
    { documento: 'Huawei NetEngine AR610 Series Enterprise Routers Datasheet-R26C00',
      url: 'https://e-file.huawei.com/marketingcloud/pep/asset/20000001/Material/e1fc81f9c69d43eb96d1190f77711067/M3T1A590N1311347926431838457/Huawei%20NetEngine%20AR610%20Series%20Enterprise%20Routers%20Datasheet-R26C00.pdf', estable: true,
      fecha: '2026-09-28', hash: null, modelos: ['AR610'], cubre: 'reenvio, IPsec y SD-WAN tipico (IMIX) del AR611 y el AR617VW-LTE4, y su figura (`huawei-vistas-equipos.json`); desde el 2026-10-14 tambien sus capacidades SD-WAN (`capSdwan`: tabla «Software Features and Protocols», filas SD-WAN IPsec e IPsec + QoS en IMIX, memoria, paquetes N1 y suscripcion de amenazas de la «Ordering Information»), releida entera con pdftotext sobre la copia de Actions', campos: ['fwd', 'ipsec', 'typ', 'redund', 'psu', 'capSdwan'],
      nota: '2026-10-05: traido via GitHub Actions (traer-cisco-huawei.yml); la URL del PDF se descubrio en su pagina de documentos (e.huawei.com/en/documents/products/enterprise-network/e1fc81f9c69d43eb96d1190f77711067), no se adivino. Leido una vez, con pdf-parse sobre la copia de Actions: PDF4me se desconecto antes. Las siete columnas de la tabla dicen lo mismo, asi que no hay fila que desplazar: 300 Mbps de reenvio y 200 de IPsec, que casan con el catalogo, y 50 Mbps de SD-WAN tipico, que faltaba. La fecha es la de generacion del PDF. No publica Mpps.' },
    { documento: 'NetEngine A800 E Series Brochure',
      url: 'https://e-file.huawei.com/marketingcloud/pep/asset/20000001/Material/06048a7a12954961b5017a6459145905/M3T1A590N1063508522362871854/NetEngine%20A800%20E%20Series%20Brochure.pdf', estable: true,
      fecha: '2024-11-13', hash: null, modelos: [], cubre: 'contexto de la serie A800 E; ya no respalda ninguna cifra ni figura',
      campos: null, porQue: 'lo sustituyen las fichas individuales de los cuatro modelos, mas recientes: el folleto daba 35 W a la A822 E (su ficha, 33,2) y otra composicion de puertos a la A821 E',
      nota: '2026-10-06: traido via GitHub Actions (traer-cisco-huawei.yml, corrida 37401011603). El texto dice «© 2022». Esa manana corrigio el `redund:false` y los 120 W de «consumo tipico» de la A800 E; por la tarde llegaron las fichas individuales, que confirman las tres variantes de alimentacion y corrigen dos cosas del folleto. Su capacidad de conmutacion mezcla criterios (14 G de puertos en un sentido en la A813 E, 72 G en los dos en la A821 E) y da al A816 E «64-172 Gbit/s» con 4 + 4 puertos GE: no se transcribio.' },
    { documento: 'NetEngine 8000 M6 Universal Service Router Datasheet',
      url: 'https://e.huawei.com/marketingcloud/pep/asset/20000001/Material/b50df453e4bf4ca4b99ef855437e8cc9/M3T1A590N1140254128116289674/NetEngine%208000%20M6%20Universal%20Service%20Router%20Datasheet.pdf', estable: true,
      fecha: '2025-06-12', hash: null, modelos: ['NE8000 M6'], cubre: 'la figura del NE8000 M6',
      campos: null, porQue: 'respalda solo la figura de un modelo (`huawei-vistas-equipos.json`); sus cifras (320 Gbps, 72 Mpps, 205,8 W) casan con las del catalogo, que ya tenian respaldo',
      nota: '2026-10-06: traido via GitHub Actions (traer-cisco-huawei.yml, corrida 37401011603, rama de transporte fuente/cisco-huawei), porque los dominios de Huawei devuelven 403 en el proxy de egreso de este entorno; la URL del PDF se descubrio en su pagina de documentos. La fecha es la de generacion del PDF. Titulo de plantilla («NetEngine 8000 M4»); el texto nombra el M6 y nunca el M4.' },
    { documento: 'NetEngine 8000 M1A Universal Service Router Datasheet',
      url: 'https://e-file.huawei.com/marketingcloud/pep/asset/20000001/Material/cf634dea810542f1b578ec2a48992ce5/M3T1A590N1228070746570178625/NetEngine%208000%20M1A%20Universal%20Service%20Router%20Datasheet.pdf', estable: true,
      fecha: '2026-02-10', hash: null, modelos: ['NE8000 M1A'], cubre: 'capacidad de conmutacion del NE8000 M1A, y su figura', campos: ['cap'],
      nota: '2026-10-06: traido via GitHub Actions (traer-cisco-huawei.yml, corrida 37401011603, rama de transporte fuente/cisco-huawei), porque los dominios de Huawei devuelven 403 en el proxy de egreso de este entorno; la URL del PDF se descubrio en su pagina de documentos. La fecha es la de generacion del PDF. Titulo de plantilla («NetEngine 8000 M4»); el texto nombra el M1A y nunca el M4. Por la tarde corrigio su capacidad, de 176 a 352 Gbps (los 176 son la capacidad de puertos). Su consumo, 89,21 W, NO se transcribio: es identico al centesimo al del M1C, que la ficha del M1C si desglosa por configuracion, y en el M1A es la plantilla copiada.' },
    { documento: 'NetEngine 8000 M1D-B Universal Service Router Datasheet',
      url: 'https://e-file.huawei.com/marketingcloud/pep/asset/20000001/Material/d90f145262704e7d98541b3fe592120d/M3T1A590N1140257116414410888/NetEngine%208000%20M1D-B%20Universal%20Service%20Router%20Datasheet.pdf', estable: true,
      fecha: '2025-06-12', hash: null, modelos: ['NE8000 M1D-B'], cubre: 'la figura del NE8000 M1D-B',
      campos: null, porQue: 'respalda solo la figura de un modelo (`huawei-vistas-equipos.json`), no un campo de MODELS',
      nota: '2026-10-06: traido via GitHub Actions (traer-cisco-huawei.yml, corrida 37401011603, rama de transporte fuente/cisco-huawei), porque los dominios de Huawei devuelven 403 en el proxy de egreso de este entorno; la URL del PDF se descubrio en su pagina de documentos. La fecha es la de generacion del PDF. Titulo de plantilla («NetEngine 8000 M4»); el texto nombra el M1D-B y nunca el M4.' },
    { documento: 'NetEngine 8000 X Series Brochure',
      url: 'https://e.huawei.com/marketingcloud/pep/asset/20000001/Material/02d9fbd0807243b5b37d66759665d25a/M3T1A590N1069280707103375400/NetEngine%208000%20X%20Series%20Brochure.pdf', estable: true,
      fecha: '2024-11-26', hash: null, modelos: ['NE8000 X'], cubre: 'la figura del NE8000 X4, X8 y X16',
      campos: null, porQue: 'respalda solo las figuras de tres modelos (`huawei-vistas-equipos.json`), no un campo de MODELS',
      nota: '2026-10-06: traido via GitHub Actions (traer-cisco-huawei.yml, corrida 37401011603, rama de transporte fuente/cisco-huawei), porque los dominios de Huawei devuelven 403 en el proxy de egreso de este entorno; la URL del PDF se descubrio en su pagina de documentos. La fecha es la de generacion del PDF. Publica las tres figuras pequenas (233-303 px de ancho), y la lupa no puede ensenar mas.' },
    { documento: 'NetEngine A816 E Datasheet V800R024C10',
      url: 'https://e-file.huawei.com/marketingcloud/pep/asset/20000001/Material/56584a8272b44e61be416b1afc0eb241/M3T1A590N1117254686652182733/NetEngine%20A816%20E%20Datasheet%20V800R024C10.pdf', estable: true,
      fecha: '2025-04-11', hash: null, modelos: ['NetEngine A816 E'], cubre: 'variantes de alimentacion y consumo tipico del A816 E, y su figura', campos: ['redund', 'psu'],
      retirada: { fecha: '2026-10-13', motivo: 'el PDF da 404 y la pagina de producto ya solo enlaza el folleto' },
      nota: 'RETIRADA POR HUAWEI (2026-10-13): el PDF da 404 desde Actions (sondeo 38404551229), su pagina de documentos sirve el 404 del portal con estado 200 (corrida 38423580897) y la pagina de producto de la serie ya solo enlaza el folleto (corrida 38425311867); ningun buscador indexa una edicion nueva. Las cifras siguen respaldadas por la lectura del 2026-10-06, cuya copia sigue en la rama fuente/cisco-huawei (huawei-a816e-ds.pdf): el vigia la dara inalcanzable, y eso es lo cierto. 2026-10-06: traido via GitHub Actions (traer-cisco-huawei.yml, corrida 37405345929, rama de transporte fuente/cisco-huawei), porque los dominios de Huawei devuelven 403 en el proxy de este entorno; la URL salio de buscar el documento o de su pagina de documentos. Titulo de plantilla («NetEngine 8000 M4»); el texto nombra el A816 E once veces. No publica capacidad de conmutacion ni Mpps.' },
    { documento: 'NetEngine A813 E Datasheet V800R025C00',
      url: 'https://e-file.huawei.com/marketingcloud/pep/asset/20000001/Material/fd349b57d667437c99c0e8f1108aa246/M3T1A590N1142133084730556495/NetEngine%20A813%20E%20Datasheet%20V800R025C00.pdf', estable: true,
      fecha: '2025-06-18', hash: null, modelos: ['NetEngine A813 E'], cubre: 'variantes de alimentacion y consumo tipico del A813 E, y su figura', campos: ['redund', 'psu'],
      nota: '2026-10-06: traido via GitHub Actions (traer-cisco-huawei.yml, corrida 37405345929, rama de transporte fuente/cisco-huawei), porque los dominios de Huawei devuelven 403 en el proxy de este entorno; la URL salio de buscar el documento o de su pagina de documentos. Titulo de plantilla («NetEngine A816 E»); el texto nombra el A813 E doce veces. No publica capacidad de conmutacion ni Mpps.' },
    { documento: 'NetEngine A822 E Datasheet V800R025C00 (presentacion .pptx)',
      url: 'https://e-file.huawei.com/marketingcloud/pep/asset/20000001/Material/b61bc5869a67495888e7b2e4210ebb37/M3T1A590N1144953970340237579/NetEngine%20A822%20E%20Datasheet%20V800R025C00.pptx', estable: true,
      fecha: '2025-06-26', hash: null, modelos: ['NetEngine A822 E'], cubre: 'variantes de alimentacion y consumo tipico del A822 E, y su figura', campos: ['redund', 'psu'],
      nota: '2026-10-06: traido via GitHub Actions (corrida 37405535599). Huawei lo publica solo como presentacion: la pagina de documentos no enlaza ningun PDF. La fecha es la de la ultima modificacion del archivo. Confirma los 33,2 W que ya traia el catalogo frente a los 35 del folleto de 2022. No publica capacidad de conmutacion ni Mpps.' },
    { documento: 'NetEngine A821 E Datasheet V800R025C00 (presentacion .pptx)',
      url: 'https://e-file.huawei.com/marketingcloud/pep/asset/20000001/Material/1ff4ee729369411ba9288d36e86e3474/M3T1A590N1149651611493585023/NetEngine%20A821%20E%20Datasheet%20V800R025C00.pptx', estable: true,
      fecha: '2025-07-09', hash: null, modelos: ['NetEngine A821 E'], cubre: 'variantes de alimentacion, consumo tipico y puertos del A821 E, y su figura', campos: ['redund', 'psu'],
      nota: '2026-10-06: traido via GitHub Actions (corrida 37405535599). Como la del A822 E, solo existe como presentacion. Publica 6 x 10GE + 4 GE/FE opticos + 8 electricos, no la composicion del folleto, y 70 W tipicos. No publica capacidad de conmutacion ni Mpps.' },
    { documento: 'NetEngine 8000 M1C Universal Service Router Datasheet',
      url: 'https://e-file.huawei.com/marketingcloud/pep/asset/20000001/Material/4a59d6b44470458491311a5793c9ccb6/M3T1A590N1140256107802820723/NetEngine%208000%20M1C%20Universal%20Service%20Router%20Datasheet.pdf', estable: true,
      fecha: '2025-06-12', hash: null, modelos: ['NE8000 M1C'], cubre: 'la figura del NE8000 M1C',
      campos: null, porQue: 'respalda solo la figura de un modelo (`huawei-vistas-equipos.json`); sus cifras (344 Gbps, 89,21 W, fuentes 1+1) casan con las del catalogo, que ya tenian respaldo',
      nota: '2026-10-06: traido via GitHub Actions (traer-cisco-huawei.yml, corrida 37405345929, rama de transporte fuente/cisco-huawei), porque los dominios de Huawei devuelven 403 en el proxy de este entorno; la URL salio de buscar el documento o de su pagina de documentos. Titulo de plantilla; el texto nombra el M1C once veces. No publica Mpps.' },
    { documento: 'NetEngine 8000 M1D Universal Service Router Datasheet',
      url: 'https://e.huawei.com/marketingcloud/pep/asset/20000001/Material/fba94a0ac23f4dd883d0df9493eb0ed5/M3T1A590N1140256736524767245/NetEngine%208000%20M1D%20Universal%20Service%20Router%20Datasheet.pdf', estable: true,
      fecha: '2025-06-12', hash: null, modelos: ['NE8000 M1D'], cubre: 'la figura del NE8000 M1D',
      campos: null, porQue: 'respalda solo la figura de un modelo (`huawei-vistas-equipos.json`). Su conmutacion (1,76 Tbps) casa; su consumo no se transcribio porque el propio documento da dos (125,1 W en el resumen y 132,2 W en la tabla, que remite a Info-Finder) y el catalogo un tercero, 124,5',
      nota: '2026-10-06: traido via GitHub Actions (traer-cisco-huawei.yml, corrida 37405345929, rama de transporte fuente/cisco-huawei), porque los dominios de Huawei devuelven 403 en el proxy de este entorno; la URL salio de buscar el documento o de su pagina de documentos. Titulo de plantilla; el texto nombra el M1D siete veces. No publica Mpps.' },
    { documento: 'NetEngine 8000 M4 Universal Service Router Datasheet',
      url: 'https://e-file.huawei.com/marketingcloud/pep/asset/20000001/Material/4f9698f641b04f0da9a6ec7a5ddcf78b/M3T1A590N1279110148257448048/NetEngine%208000%20M4%20Universal%20Service%20Router%20Datasheet.pdf', estable: true,
      fecha: '2026-07-01', hash: null, modelos: ['NE8000 M4'], cubre: 'la figura del NE8000 M4',
      campos: null, porQue: 'respalda solo la figura de un modelo (`huawei-vistas-equipos.json`); sus cifras (2,4 Tbps, 405 Mpps, 283,4 W) casan con las del catalogo, que ya tenian respaldo',
      nota: '2026-10-06: traido via GitHub Actions (traer-cisco-huawei.yml, corrida 37405345929, rama de transporte fuente/cisco-huawei), porque los dominios de Huawei devuelven 403 en el proxy de este entorno; la URL salio de buscar el documento o de su pagina de documentos. Titulo de plantilla; el texto nombra el M4 ocho veces.' },
    { documento: 'NetEngine 8000 F1A Datasheet V800R024C10',
      url: 'https://e-file.huawei.com/marketingcloud/pep/asset/20000001/Material/9d1e5a135656419fb90354e8c68136eb/M3T1A590N1167033276639785031/NetEngine%208000%20F1A-8H20Q%20Datasheet%20V800R024C10.pdf', estable: true,
      fecha: '2025-08-26', hash: null, modelos: ['NE8000 F1A'], cubre: 'la figura frontal y trasera del NE8000 F1A',
      campos: null, porQue: 'respalda solo las figuras de un modelo (`huawei-vistas-equipos.json`); sus cifras (2,4 Tbps, 325 W) casan con las del catalogo, que ya tenian respaldo',
      nota: '2026-10-06: traido via GitHub Actions (traer-cisco-huawei.yml, corrida 37405345929, rama de transporte fuente/cisco-huawei), porque los dominios de Huawei devuelven 403 en el proxy de este entorno; la URL salio de buscar el documento o de su pagina de documentos. El archivo se llama «F1A-8H20Q», pero el documento es la ficha del F1A: su titulo dice «NetEngine 8000 F1A Datasheet» y el texto nombra el F1A nueve veces y el 8H20Q una. Huawei publica tambien la del 8000E F1A, que es otra linea: se trajo para compararla y no se usa.' },
    { documento: 'Huawei NetEngine AR6710-L Series Enterprise Router Data Sheet-R26C00',
      url: 'https://e-file.huawei.com/marketingcloud/pep/asset/20000001/Material/04c9821faf16492ea6cadb03722f97ce/M3T1A590N1311283223945314586/Huawei%20NetEngine%20AR6710-L%20Series%20Enterprise%20Router%20Data%20Sheet-R26C00.pdf', estable: true,
      fecha: '2026-09-28', hash: null, modelos: ['AR6700-L'], cubre: 'reenvio, IPsec, SD-WAN tipico (IMIX), alimentacion, consumo y potencia de salida de las fuentes de los cuatro AR6710-L (AR6710-L8T3TS1X2, AR6710-L26T2X4, AR6710-L50T2X4 y AR6710-L14T2X4; deciden que piezas de fuente pide el BOM), y su figura; desde el 2026-10-14 tambien sus capacidades SD-WAN (`capSdwan`: tabla «Software Features and Protocols», filas SD-WAN IPsec e IPsec + QoS en IMIX, memoria, paquetes N1 y suscripcion de amenazas de la «Ordering Information»), releida entera con pdftotext sobre la copia de Actions', campos: ['fwd', 'ipsec', 'typ', 'redund', 'psu', 'parts', 'capSdwan'],
      nota: '2026-10-06: traido via GitHub Actions (traer-cisco-huawei.yml, corrida 37405345929, rama de transporte fuente/cisco-huawei), porque los dominios de Huawei devuelven 403 en el proxy de este entorno; la URL salio de buscar el documento o de su pagina de documentos. La URL del PDF se descubrio en su pagina de documentos. Confirma IPsec y SD-WAN tipico de los cuatro y el reenvio del L8T3TS1X2 y el L14T2X4; corrigio el del L26T2X4 y el L50T2X4, de 2 a 3,2 Gbps (`npm run huawei -- --force`, anclado en las otras dos columnas). No publica Mpps.' },
    { documento: 'NetEngine A800 E Series Routers (pagina de producto, tabla «Specifications»)',
      url: 'https://e.huawei.com/en/products/routers/netengine-a800', estable: false,
      fecha: '2026-10-06', hash: null, modelos: ['A800 E'], cubre: 'capacidad de conmutacion y reenvio de las cuatro A800 E: 20 / 72 / 20 / 20 Gbps y 4,4 / 108 / 4,4 / 4,4 Mpps (A813 E, A821 E, A822 E, A816 E)', campos: ['cap', 'mpps'],
      nota: '2026-10-06: traida via GitHub Actions (traer-cisco-huawei.yml, corrida 37461520276, rama de transporte fuente/cisco-huawei; e.huawei.com responde 403 en el proxy de este entorno y no desde Actions). La busqueda web la senalo y su resumen no se tomo como fuente: se leyo la tabla en la pagina traida. Casa al digito con el catalogo, que llevaba esas cifras desde antes sin documento citado; las cuatro fichas individuales callan la capacidad. La pagina no dice si la conmutacion cuenta los dos sentidos. La fecha es la de lectura: la pagina no publica la suya.' },
    { documento: 'NetEngine 8000 Series Routers (pagina de producto, tablas «Specifications»)',
      url: 'https://e.huawei.com/en/products/routers/ne8000', estable: false,
      fecha: '2026-10-06', hash: null, modelos: ['NE8000 X', 'NE8000 M', 'NE8000 M1', 'NE8000 F1A', 'NE8000 F8'], cubre: 'conmutacion, reenvio, modulos de alimentacion y consumo tipico de las trece NE8000 (X16/X8/X4, M14/M8/M6/M4, M1A/M1C/M1D/M1D-B, F1A, F8)', campos: ['cap', 'mpps', 'psu'],
      nota: '2026-10-06: traida por el mismo camino (corrida 37461520276). Casa con el catalogo en las X, el M6, el M4, los cuatro M1 y el F1A, y respalda cifras que no tenian documento: los 74,8 W del M1A y los 124,5 W del M1D (su ficha da 125,1 en el resumen y 132,2 en la tabla), y los 1.117 Mpps del M14 y los 2.035 del F8, que venian de la Fase 2. Da al M8 1.086 Mpps en la misma columna que sus 4,8 Tbps y 774,3 W, que son la configuracion IPU-2T4 de la fila: entran en el catalogo. NO se toman dos cifras, porque la ficha por modelo describe mejor la fila: el consumo del M14 (865,8 W en la pagina; su ficha da 486 / 968 / 931 W por tarjeta de control y la fila es la IPU-3T6) y la conmutacion del F8 (28,86 Tbps en la pagina con las mismas 8 tarjetas de 800 G; la ficha da 12,8 Tbps a la version 6.4T, que es la base del resto de la serie). La fecha es la de lectura.' },
    { documento: 'Datasheets oficiales de producto',
      url: null, fecha: '2026-08', hash: null, cubre: 'cifras de las lineas AR y NetEngine', campos: ['fwd', 'ipsec', 'typ', 'mpps'],
      nota: 'Verificacion de la Fase 2. Faltan el ciclo de vida (0 de 40 modelos marcados), `ipsec` y `typ` en las NetEngine y `mpps` en los AR. 2026-09-02: comprobado desde GitHub Actions (a diferencia de Fortinet, esto NO se cierra igual) que e.huawei.com y support.huawei.com bloquean el navegador automatizado con un "Access Denied" de Akamai -bloqueo del propio Huawei contra automatizacion, no del proxy de este entorno- y que ademas sirven una aplicacion Vue/Nuxt sin contenido en el HTML crudo, asi que ni siquiera un fetch() sin navegador vale. Info.support.huawei.com si carga, pero Info-Finder es un glosario de terminos (AAA, ACL...), no una base de datos de ciclo de vida por modelo, y exige sesion iniciada para cualquier detalle. Se completa a mano, con `npm run huawei`, desde una maquina con navegador real y sesion de Huawei si hace falta el detalle fino.' },
  ],

  mikrotik: [
    { documento: 'Datasheets publicos y MSRP de mikrotik.com',
      url: 'https://mikrotik.com/products', estable: false, fecha: null, hash: null,
      cubre: 'la tabla de pruebas RFC 2544 de cada ficha (ruteo fast path, con 25 colas y con 25 reglas de filtro, L3HW, a 1518/512/64 B; IPsec con 1 y 256 tuneles por cifrado), CPU, nucleos, RAM, nivel de licencia, puertos, PoE, alimentacion y «Suggested price» de los 20 routers fisicos del listado oficial',
      campos: ['fwd', 'fw', 'ipsec', 'pruebas', 'cpu', 'ram', 'cores', 'lvl', 'wanMax', 'poe', 'poeA', 'redund', 'psu'],
      nota: 'RELEIDA ENTERA EL 2026-10-13. Las fichas de producto (mikrotik.com/product/<modelo>) se trajeron por traer-cisco-huawei.yml a las ramas de transporte fuente/mikrotik-fichas (2026-09-03), fuente/mikrotik-2026-10-13 y fuente/mikrotik-listados-2026-10-13 (corridas 38394703476 y 38394948689), descubriendo los modelos en el listado oficial «Ethernet routers» en vez de adivinar URL. `npm run mikrotik` transcribio su matriz a mikrotikPruebas.js con doble anclaje (codigo + nucleos/RAM/nivel) y con la coherencia kpps x bytes x 8 de cada celda: 20 de 20. '
        + 'Lo que corrigio: el catalogo traia UNA cifra de reenvio y UNA de IPsec por modelo que no casaban con estas tablas (IPsec del RB5009 2.400 frente a 1.354; CCR2216 15.000 frente a 2.013 con un tunel y 4.108 con 256; hEX 470 frente a 232), CPU de otro equipo en el RB4011 y el RB5009, el L009 con 1 nucleo e IPsec (son 2 y no lo publica), el hEX con PoE-out (no tiene), el CCR2116 con 12 GE (13) y precios distintos de los de la ficha (CCR2216 $5.999 frente a $2.795). Salio el RB4011iGS+ sin RM: no tiene ficha ni figura en el listado. '
        + 'SIN FECHA: las fichas no publican revision ni fecha, y la de lectura no es la del documento. Los precios son el «Suggested price» de cada ficha, no un price list firmado como el de Fortinet: confirmar con distribuidor antes de cotizar en firme. MikroTik no publica WireGuard en ninguna ficha, ni cuanta RAM ocupa una tabla BGP completa (la de mikrotik.js es un supuesto de diseno declarado).' },
    { documento: 'RouterOS license key levels y CHR licensing (documentacion oficial de MikroTik)',
      url: 'https://help.mikrotik.com/docs/spaces/ROS/pages/328149/RouterOS+license+keys', estable: false, fecha: null, hash: null,
      campos: null, porQue: 'respalda LICENSE_LEVELS (topes de tuneles PPPoE/PPTP/L2TP/OpenVPN y usuarios HotSpot por nivel) y el tope y precio de las licencias CHR, que son tablas del dimensionador y no campos de MODELS',
      modelos: ['CHR'], cubre: 'topes por nivel 4/5/6 (nivel 4: 200 tuneles PPPoE/PPTP/L2TP/OpenVPN y 200 usuarios HotSpot; nivel 5: 500, OpenVPN sin tope y 500; nivel 6 sin tope), que los niveles no aplican a CHR, y las licencias CHR Free (1 Mbps), P1 (1 Gbps, $45), P10 (10 Gbps, $95) y P-Unlimited ($250), con prueba de 60 dias',
      nota: 'Traidas el 2026-10-13 por traer-cisco-huawei.yml (rama fuente/mikrotik-2026-10-13; la de CHR desde manual.mikrotik.com/docs/getting-started/routeros-licensing/chr/chr-licensing/). Corrigieron dos textos de la pagina: «CHR Free sin tope, limitado a 60 dias» (es 1 Mbps por interfaz y sin caducidad; los 60 dias son la prueba de los niveles de pago) y «todas las CHR son nivel 6» (los niveles no aplican a CHR). Y el nivel 5, que el catalogo daba con 500 tuneles OpenVPN: no tiene tope.' },
    { documento: 'MikroTik wired interface compatibility (manual.mikrotik.com, version vigente)',
      url: 'https://manual.mikrotik.com/docs/wired-connections/mikrotik-wired-interface-compatibility', estable: false, fecha: null, hash: null,
      campos: ['compat'],
      cubre: 'que modulo SFP/SFP+/SFP28/QSFP28 funciona en que equipo («+», «-» y notas): con ella el dimensionador pone a cada enlace WAN el modulo recomendado, y no recomienda lo que la matriz marca «-» (el S+RJ10 en hEX S, hEX PoE, PowerBox Pro y L009) ni nada en un equipo que no lista',
      nota: 'Traida el 2026-10-13 por traer-cisco-huawei.yml (rama fuente/mikrotik-compat-2026-10-13, corrida 38440589580) y extraida de sus tablas por programa. Sustituye a la vieja tabla del wiki, que solo remite aqui. Notas que aplican: 11 (el CCR2004-1G-12S+2XS admite hasta 6 S+RJ10), 14 (en la jaula SFP del L009 y el hEX S 2025 los modulos de 10G/25G van a 2,5G como maximo, con la velocidad fijada a mano) y la de refrigeracion pasiva (no recomienda el S+RJ10 sin ventilacion extra). Las especificaciones de cada modulo (velocidad, longitud de onda, alcance, precio) salen de su ficha del listado «SFP/QSFP». 2026-10-14: la 7.25 quedo congelada (el manual remite a la 7.26) y vigilar su URL no veria nunca un cambio; la fuente pasa a la URL sin version, que sirve la vigente. La 7.26 se trajo por Actions (rama fuente/mikrotik-pendientes-2-2026-10-14) y su texto es identico al de la 7.25 salvo el aviso de version: la matriz extraida no cambia y sigue sin listar el CCR2004-16G-2S+PC. Su huella la toma el vigia en su proxima corrida; el --revisado lo da una persona. Sin fecha: la pagina no la publica.' },
    { documento: 'Manuales de usuario de MikroTik (manual.mikrotik.com/hardware)',
      url: 'https://manual.mikrotik.com/hardware/rb1100-series/', estable: false, fecha: null, hash: null,
      campos: ['redund', 'psu'],
      cubre: 'la alimentacion de RB1100AHx4 y CCR2004-1G-12S+2XS: dos entradas AC «for failover purposes» en el RB1100 series y «dual integrated power supply units» en el CCR2004-1G-12S+2XS, que con el «dual redundant power supply» de sus fichas cierran su redundancia',
      nota: 'Traidos el 2026-10-13 por traer-cisco-huawei.yml (rama fuente/pendientes-2026-10-13, corrida 38422143556): 22 manuales, descubiertos en el enlace «User manual» de cada ficha, sin adivinar rutas. La URL es la del RB1100 series; la del CCR2004 es manual.mikrotik.com/hardware/ccr2004-1g-12s-plus-2xs/. Lo que NO cierran: el PoE de salida sigue en amperios (hEX PoE 1 A por puerto y 2 A en total; PowerBox Pro igual con 12-30 V y 450 mA por puerto con 31-57 V; hEX PoE lite 500 mA), y no dicen si la cifra IPsec de las pruebas es por sentido o la suma. El manual del CCR2004-16G-2S+PC copia la frase de la doble fuente AC del modelo con ventiladores y su propia tabla da entrada de 36-57 V DC: manda la tabla, que casa con la ficha. Sin fecha: MikroTik no la publica.' },
    ...fichasMikrotik(),
  ],

  aruba: [
    { documento: 'Validated Solution Guide SD-Branch y data sheet de suscripciones EdgeConnect (HPE, oficiales)',
      url: 'https://arubanetworking.hpe.com/techdocs/VSG/docs/070-sd-branch-design/Media/PDF/Aruba_VSG_SD-Branch-Design.pdf', estable: true, fecha: '2026-09-13', hash: null,
      campos: null, porQue: 'son reglas de diseno del fabricante, no campos del catalogo',
      cubre: 'reglas de diseno validadas en la fase 10: Boost como add-on en bloques de 100 Mbps de pool del fabric; DTD por appliance y como add-on de la suscripcion; On-Prem solo como Advanced On-Prem con software de Orchestrator incluido (alojamiento del cliente); SKU HA del segundo nodo con regla "match tier, bandwidth, term"; Foundation = 3 BIOs y 2 VRF (default+guest) vs Advanced = 7 BIOs y 64 VRFs; AppExpress monitor-only en Foundation; NGFW completo y DPC en Foundation; ratios FEC 1:8 (12,5%) y 1:4 (25%); SLA DPS de utilizacion de enlace al 75%; flujos por modelo (256.000 / 2.000.000); tier de suscripcion por caudal WAN agregado del sitio; AppRF/Qosmos ~3.500 apps en SD-Branch; Boost solo EdgeConnect (no gateways); Central de gateway por dispositivo y termino con co-terminacion oficial en SaaS',
      nota: '2026-10-19: la URL era la CARPETA del VSG, que responde 403 a un listado: el vigia nunca la pudo leer. Pasa al PDF de la misma guia (el `sdBranchVsg` de aruba.js), que desde Actions responde 200 con un PDF real (candidatas-fuentes, corrida 39253322918); la copia de public/datasheets es la «Aruba ESP SD-WAN & SD-Branch Design Guide» del 04-sep-2026 (17.596.233 B) y la que se sirve hoy pesa 17.594.529 B: es OTRA edicion, sin leer. La primera medicion del vigia no equivale a contrastarla (PENDIENTES). Validacion web de la fase 10 (2026-09-13) con citas literales: VSG SD-Branch (arubanetworking.hpe.com/techdocs/VSG), data sheet de suscripciones a50010073enw (hpe.com), QuickSpecs a50004289enw, Orchestrator Docs (arubanetworks.com/techdocs/sdwan) y tabla oficial de licenciamiento de Central. SIN FUENTE y declarados como regla de trabajo del arquitecto: flujos por usuario (80-100/150-200), headroom del 25-30% (ancla parcial: SLA DPS 75%) y Boost = 30% del trafico WAN privado (la unica regla de campo localizada, no oficial, dice 40% — discrepancia documentada en el motor). IDS/IPS no corre en EC-XS (doc oficial IDS); la paridad de precio de los SKU HA sale de la lista del distribuidor, no de HPE (HPE no publica precios). MEDIDO EL 2026-09-16 DESDE ACTIONS (pendiente 38): esta URL es una CARPETA y da 403, pero aqui el 403 SI es del fabricante y no la forma de la URL, al reves que en las dos fuentes de Juniper. Lo prueba el grupo de control: dan 403 tambien el PDF concreto (`.../Media/PDF/Aruba_VSG_SD-Branch-Design.pdf`, que es el que `legacyData/aruba.js` declara en DATASHEETS.sdBranchVsg), el indice del VSG, y el Hardware Reference que `npm run datasheets` si descargaba desde otra maquina. LA URL SE DEJA COMO ESTA A PROPOSITO: apuntarla al PDF concreto alinearia las dos declaraciones del repositorio, pero un `.pdf` obliga a `estable: true` (se vigila por bytes) y de la estabilidad de este documento no hay ninguna medicion porque nadie puede leerlo — declararla seria el campo puesto a ojo que este repositorio persigue. Sigue saliendo «no comprobada» en la pestana de procedencia, que es lo honesto.' },
    { documento: 'QuickSpecs de las series 7000 y 7200 de Mobility Controllers (HPE, retirados)',
      url: 'https://www.hpe.com/psnow/doc/c05272677', estable: false, fecha: '2026-10-06', hash: null,
      campos: ['fw', 'fwSess', 'ipsecSess', 'greTuns', 'clients', 'ifaces', 'redund', 'psu', 'spec'],
      modelos: ['7005', '7008', '7010', '7024', '7030', '7205', '7210', '7220', '7240XM'], cubre: 'la linea AOS 8 (7005, 7008, 7010, 7024, 7030, 7205, 7210, 7220 y 7240XM): rendimiento, sesiones, tuneles, clientes, interfaces, cifrado, fisico y la fuente opcional de 7210/7220/7240XM; y su retiro («the base products listed herein are now considered obsolete and are no longer available for sale»)',
      nota: 'Dos documentos: el de la serie 7000 (psnow c05272689, PDF de oct-2023) y el de la 7200 (c05272677, feb-2024), traidos por traer-cisco-huawei.yml el 2026-10-06 (corrida 37504395999) y versionados en public/datasheets/serie-7000-quickspecs.pdf y serie-7200-quickspecs.pdf. La pagina de psnow cambia en cada peticion (estable: false); el retiro lo dice la pagina, no el texto del PDF. Corrigieron las cifras que venian del DS anterior en copias de terceros (ver la cabecera de la serie 7000 en aruba.js).' },
    { documento: 'Guias de instalacion de los controladores 7005, 7008, 7010, 7024, 7030 y 7205 (HPE Aruba Networking)',
      url: 'https://arubanetworking.hpe.com/techdocs/hardware/DocumentationPortal/Content/ArubaTopics/gatecontroller/controller-top.htm', estable: false, fecha: '2026-10-06', hash: null,
      campos: ['redund', 'psu', 'ifaces'],
      modelos: ['7005', '7008', '7010', '7024', '7030', '7205'], cubre: 'la fuente de cada uno (integrada de 225, 580, 80 y 180 W en 7010, 7024, 7030 y 7205; adaptador de 54 V en el 7008; 12 V o PoE en el 7005), los puertos del 7030 y las figuras de panel frontal y trasero de la ficha',
      nota: 'El portal de documentacion de hardware enlaza una pagina por controlador y cada pagina su guia; traer-cisco-huawei.yml guarda la pagina y pide el PDF que ella enlaza (la del 7024 sirvio de control). Las figuras son ilustraciones con rotulos, no fotografias. No se versionan los PDF (unos 10 MB): las figuras extraidas estan en public/img/equipos/ y su procedencia en public/data/aruba-vistas-equipos.json.' },
    { documento: 'QuickSpecs EdgeConnect SD-WAN (v18) y spec sheet del EC-XS (a00110177ENW Rev. 3)',
      url: 'https://www.hpe.com/us/en/collaterals/collateral.a50004289enw.html', estable: false, fecha: '2026-10-06', hash: null,
      campos: ['wanMin', 'wanMax', 'boostMax', 'ifaces', 'spec', 'idsMbps', 'idsPnExcluidos', 'hwSku', 'skus'],
      modelos: ['EC-XS', 'EC-10104', 'EC-10106', 'EC-10108', 'EC-S', 'EC-M', 'EC-L', 'EC-XL', 'EC-10150'], cubre: 'los nueve EdgeConnect fisicos: rango WAN tipico, conexiones simultaneas, optimizacion WAN recomendada, IDS/IPS, FRU e interfaces de datos (tabla «Comparison», p. 30), y del EC-XS su capacidad de IDS/IPS (300 Mbps en linea, 600 en modo performant)',
      nota: 'Sustituye el 2026-10-06 a «Paginas de producto y tienda oficiales de HPE/Aruba», sin fecha, de la que salieron las cifras de la primera revision cuando los PDF no se podian abrir desde el entorno de edicion. Los dos documentos estan en public/datasheets/ (edgeconnect-quickspecs.pdf, de jun-2026, y edgeconnect-xs-spec-sheet.pdf, de 2025) y se cotejaron fila a fila contra el catalogo: todo casaba salvo el rango del EC-XS, que el catalogo daba como 2-200 Mbps y los dos documentos como «2 to 1000 Mbps». Lo que no tiene precio verificado (EC-V, EC-XS-SP, Dynamic Threat Defense, Foundational Care de software y de gateways) sigue en null y el BOM lo declara en «consultar».' },
    { documento: 'Data sheet HPE Networking EdgeConnect (a00109847enw Rev. 8)',
      url: 'https://www.hpe.com/psnow/doc/a00109847enw', estable: false, fecha: '2026-07-07', hash: null,
      campos: ['idsMbps', 'spec'],
      modelos: ['EC-10104', 'EC-10106', 'EC-10108', 'EC-S', 'EC-M', 'EC-L', 'EC-XL', 'EC-10150'], cubre: 'la capacidad IDS/IPS de los ocho EdgeConnect fisicos sin spec sheet propia (EC-10104/10106/10108, S-P, M-H, L-H, XL-H y 10150): en linea, que es la que acota DTD, y en modo performant; y contrasta el rango WAN, las conexiones simultaneas y la optimizacion WAN recomendada, que casan con el catalogo en los ocho',
      nota: 'Traida el 2026-10-13 desde psnow por traer-cisco-huawei.yml (corrida 38423580897; la pagina de la corrida 38422143556 enlaza la descarga); copia en public/datasheets/edgeconnect-data-sheet.pdf. Sustituye a la «EdgeConnect US Spec Sheet» de arubanetworks.com, que dio 404 el 2026-09-11. La fecha es la de creacion del PDF (sus metadatos). Las variantes que publica (S-P, M-H, L-H, XL-H) son las que el catalogo modela como EC-S, EC-M, EC-L y EC-XL. Con su cifra, un EdgeConnect que no inspecciona lo que pide el escenario con DTD se aparta con su motivo; antes no tenia techo.' },
    { documento: 'Product Lifecycle Policy de EdgeConnect (HPE Aruba Networking, 12-feb-2026)',
      url: 'https://arubanetworking.hpe.com/techdocs/sdwan-PDFs/docs/eula/EC_LifecyclePolicy_latest.pdf', estable: true, fecha: '2026-10-06', hash: null,
      campos: null, porQue: 'respalda el ciclo de vida de la linea EdgeConnect y no el de los gateways: declararla como respaldo de eolAnnounced pintaria de vigentes a los gateways 9000/9100/9200, que no cubre',
      modelos: ['EC-XS', 'EC-L', 'EC-XL'], cubre: 'los fines de venta de EdgeConnect: EC-US (31-ene-2025) y EC-XL-H (31-mar-2026, con su fin de soporte); el EC-XS de 4 GB (PN 200889 y 200900) retirado en 2016; y que el EC-L-H y el EC-XS vigente no tienen fin de venta declarado',
      nota: 'Traida por traer-cisco-huawei.yml el 2026-10-06 (el 2026-09-16 dio 403) y leida entera. Cierra el pendiente 16 de «Datos por confirmar»: los rastreadores de terceros daban fin de venta al EC-L-H (2025-12-31) y al EC-XS (2026-01-31); esta edicion es posterior y no los trae, y si trae el anuncio del EC-XL-H de junio de 2025. No se marca ninguno de los dos.' },
    { documento: 'Documentacion de IDS/IPS del SD-WAN Orchestrator (HPE Aruba Networking)',
      url: 'https://arubanetworking.hpe.com/techdocs/sdwan/docs/orch/configuration/overlays/ids/', estable: false, fecha: '2026-10-06', hash: null,
      campos: ['idsPnExcluidos'],
      modelos: ['EdgeConnect'], cubre: 'en que EdgeConnect se puede activar IDS/IPS: todos «except EC-XS (part numbers 200889 and 200900 only) and EC-US», y EC-V con un minimo de 4 vCPU y 16 GB de RAM',
      nota: 'Traida por traer-cisco-huawei.yml y leida entera. La auditoria A1 (2026-09-17) aparto el EC-XS entero de Dynamic Threat Defense con esta documentacion; la restriccion es solo de dos numeros de parte antiguos, y la spec sheet vigente del EC-XS (PN 201571) publica su capacidad de IDS/IPS.' },
    { documento: 'Fichas de las series 9000, 9100 y 9200 de gateways (DS_9000Series y QuickSpecs 9100 y 9200)',
      url: 'https://www.arubanetworks.com/assets/ds/DS_9000Series.pdf', estable: true, fecha: '2026-10-06', hash: null,
      campos: ['fw', 'clients', 'aps', 'fwSess', 'ipsecSess', 'greTuns', 'porSo', 'porSoMotivo', 'licCap', 'ifaces', 'spec'],
      modelos: ['Gateway 9004', 'Gateway 9004-LTE', 'Gateway 9012', 'Gateway 9106', 'Gateway 9114', 'Gateway 9240'], cubre: 'firewall, clientes, APs, sesiones, tuneles IPsec y GRE de 9004, 9004-LTE, 9012, 9106, 9114 y 9240, por sistema operativo (AOS 10 y AOS 8) y, en el 9240, por licencia de capacidad',
      nota: 'Cotejadas fila a fila el 2026-10-06 sobre las copias de public/datasheets/ (serie-9000-branch-gateways.pdf, serie-9100-hybrid-quickspecs.pdf y serie-9200-quickspecs.pdf). Todo casaba salvo tres cosas: el 9004-LTE no corre AOS 8 («Not supported», p. 5 de la ficha de la serie 9000) y el catalogo le daba 32 APs en AOS 8; el 9240 publica 4M sesiones y 32K tuneles IPsec (p. 9) que el catalogo tenia en null; y el 9012 da 64 APs en AOS 8 desde AOS 8.12, que el catalogo deja en 32 porque vale para cualquier version.' },
    { documento: 'Lista de precios de un distribuidor autorizado de HPE (export interno, no publico)',
      url: null, fecha: '2026-09-13', hash: null, dominio: 'precio', campos: null, cubre: 'List Price de HPE para 15 modelos EdgeConnect/gateway y 7 variantes de pedido TAA/NAL, las suscripciones EdgeConnect (Foundation/Advanced/On-Premises x 100M/1G/ilimitado x 1/3/5 anos), las suscripciones de ALTA DISPONIBILIDAD del segundo nodo (Foundation/Advanced HA x 100M/1G/ilimitado x 1/3/5 anos), Boost SaaS y On-Premises, suscripciones Central de gateway 70xx/90xx, licencias perpetuas del 9240, unidades remanufacturadas 7000/7200 y los SKU de Foundational Care (NBD Exch y 4HR Onsite, 1/3/5 anos) de los 9 EdgeConnect',
      nota: 'Extracto elaborado por este catalogo el 2026-09-10 y ampliado el 2026-09-13 con las suscripciones, los remanufacturados, las variantes TAA/NAL, el Foundational Care por modelo (CARE_SKU en aruba.js) y las 18 suscripciones HA del segundo nodo (LICENSES_HA en aruba.js): se guardo SOLO el SKU, la descripcion, el List Price y su vigencia (public/datasheets/aruba-lista-precios-hpe.csv); el nombre del distribuidor y su % de descuento negociado NO se incorporan, por ser su dato confidencial. Es precio de lista, no neto -- no reemplaza confirmar con el distribuidor antes de cotizar en firme. La correspondencia SKU<->descripcion de las suscripciones se verifico el 2026-09-13 contra el QuickSpecs oficial EdgeConnect SD-WAN (v18) publicado en hpe.com, y JZ118AAE contra una tienda publica (LIST $1,260.00, identico). RESUELTO el 2026-09-13 (decision del duenyo): EC-XL marcado fin de venta con las fechas oficiales de HPE (anuncio jun-2025, ultimo pedido 2026-03-31, fin de soporte 2033-03-31). Refactor 2026-09-13 (motor de licenciamiento automatico): la matriz Foundation/Advanced de BUNDLES sale literal del QuickSpecs v18 p.31, y Dynamic Threat Defense (IDS/IPS, p.32) es licencia opcional aparte, sin precio publicado -- va en "consultar". Correcciones documentadas frente al brief del arquitecto: Dynamic Path Steering y NGFW son Foundation (no Advanced); el encadenamiento DIA/First-packet iQ/SSE es funcion de plataforma, no de tier.' },
  ],

  nokia: [
    { documento: 'Fichas de serie de Nokia (7220 IXR-D, 7750 SR-1x, 7750 SR-s, 7250 IXR-e)',
      url: 'https://www.nokia.com/asset/f/207599/', estable: true,
      fecha: '2026-09-03', hash: null, modelos: ['7220 IXR', '7750 SR-1x', '7750 SR-s', '7250 IXR'], cubre: 'alimentacion de los 7220 IXR-D y los 7750 SR-1x, y las capacidades publicadas de las series', campos: ['redund', 'psu', 'cap'],
      nota: 'Traidas via GitHub Actions desde nokia.com/asset/f/<id>, que es la URL oficial; no se usan los espejos de terceros que devolvio la busqueda. Aportan `redund` en 6 de los 18 modelos. Los vatios que publican NO son consumo: el 7220 IXR-D2L y el D3L declaran los mismos 650 W con capacidades distintas, asi que es la potencia de la fuente. Estas fichas ademas CONTRADECIAN las capacidades del catalogo en seis modelos — se RESOLVIO el 2026-09-11 (decision del duenyo): los 7220 IXR-D2L/D3L contaban el caudal dos veces y los 7750 SR-s adoptan «System capacity (FD; max)» como metrica de `cap`. Ver el comentario de metrica en nokia.js.' },
    { documento: 'Datasheets oficiales de producto',
      url: 'https://www.nokia.com/networks/ip-networks/', estable: false, fecha: '2026-08', hash: null,
      modelos: ['7220 IXR', '7250 IXR', '7250 IXR-X', '7250 IXR-R', '7750 SR'], cubre: 'lineas 7220 IXR, 7250 IXR (con sus series 7250 IXR-X y 7250 IXR-R) y 7750 SR', campos: null, porQue: 'nombra lineas, no campos: lo que respalda de cada una no esta acotado en esta entrada',
      nota: 'Cifras tecnicas verificadas; el PRECIO no, porque no hay lista de precios de Nokia en el material disponible. Van como Consultar y el BOM los cuenta sin cotizar.' },
  ],

  // STARLINK (2026-10-15). No es uno de los siete fabricantes de `vendors.js`: su dimensionador
  // es el motor canonico integrado byte a byte, que trae sus cifras dentro (DEFAULT_CATALOGS con
  // la tarifa en COP, los kits, los perfiles de video y streaming). Por eso no sale en la pestana
  // de fuentes ni en el inventario por fabricante, y `campos` va en null: no hay MODELS contra
  // los que declararlos. Lo que si gana es VIGILANCIA: hasta hoy un cambio de tarifa de Starlink
  // no lo avisaba nadie. Las ocho URLs son las SOURCE_LINKS del motor, en su orden;
  // `test/starlink-fuentes.test.js` las casa con el archivo del motor para que no haya dos listas
  // que se desincronicen. `fecha` es la de la investigacion del modulo (`researchDate`), no la de
  // publicacion de cada documento, que el modulo no registra.
  //
  // MEDIDO EL 2026-10-15 (sondeo-fuentes.yml, corrida 38774517394): los tres PDF —la tarifa y
  // las dos fichas de kit, que son los que llevan cifras— son estables en bytes y se vigilan. Las
  // cinco paginas HTML no se pueden vigilar sin navegador: cuatro llegan como cascaron de
  // JavaScript (113-118 caracteres de texto) y la de YouTube cambia de texto en cada peticion.
  // Llevan `sinVigilancia` con lo medido: siguen declaradas como procedencia, el vigia no las
  // pide cada lunes y el sondeo las sigue midiendo.
  starlink: [
    { documento: 'Starlink Business Colombia',
      url: 'https://starlink.com/co/business', estable: false, fecha: '2026-09-23', hash: null,
      sinVigilancia: 'la pagina es una aplicacion de JavaScript: el HTML llega como cascaron (118 caracteres de texto) y solo un navegador pinta el contenido. Medido con sondeo-fuentes.yml el 2026-10-15 (corrida 38774517394).',
      cubre: 'oferta empresarial en Colombia: planes Local y Global Priority y kits', campos: null,
      porQue: 'Starlink no tiene catalogo en legacyData: la oferta la lleva el motor canonico' },
    { documento: 'Priority Plan Transition (PDF)',
      url: 'https://starlink.com/public-files/Priority_Plan_Transition.pdf', estable: true, fecha: '2026-09-23', hash: null,
      dominio: 'precio', campos: null,
      cubre: 'bloques de datos prioritarios y precio publico de referencia en COP de los planes Local Priority (50 GB, 1, 2 y 6 TB) y Global Priority (50 GB a 25 TB)',
      nota: 'Es la fuente de DEFAULT_CATALOGS del motor: el precio que el dimensionador muestra y lleva al BOM. Precio de lista, sin impuestos ni descuento negociado (por eso `pricesVerified` sigue desmarcado por defecto en la pantalla).' },
    { documento: 'Service Plan Descriptions',
      url: 'https://starlink.com/legal/documents/DOC-1728-44881-79', estable: false, fecha: '2026-09-23', hash: null,
      sinVigilancia: 'la pagina es una aplicacion de JavaScript: el HTML llega como cascaron (118 caracteres de texto) y solo un navegador pinta el contenido. Medido con sondeo-fuentes.yml el 2026-10-15 (corrida 38774517394).',
      cubre: 'precedencia de los datos prioritarios sobre los estandar', campos: null,
      porQue: 'respalda una regla del motor (como se consumen los datos prioritarios), no un campo de catalogo' },
    { documento: 'Fair Use Policy',
      url: 'https://starlink.com/legal/documents/DOC-1722-29027-68', estable: false, fecha: '2026-09-23', hash: null,
      sinVigilancia: 'la pagina es una aplicacion de JavaScript: el HTML llega como cascaron (118 caracteres de texto) y solo un navegador pinta el contenido. Medido con sondeo-fuentes.yml el 2026-10-15 (corrida 38774517394).',
      cubre: 'gestion del consumo y top-ups', campos: null,
      porQue: 'respalda una regla del motor (que pasa al agotar el bloque), no un campo de catalogo' },
    { documento: 'Performance Kit Specifications (PDF)',
      url: 'https://starlink.com/public-files/specification_sheet_performance.pdf', estable: true, fecha: '2026-09-23', hash: null,
      cubre: 'ambiente, energia y capacidad del kit Performance', campos: null,
      porQue: 'Starlink no tiene catalogo en legacyData: el kit lo lleva el motor canonico' },
    { documento: 'Standard 4 X Specifications (PDF)',
      url: 'https://starlink.com/public-files/specification_sheet_standard.pdf', estable: true, fecha: '2026-09-23', hash: null,
      cubre: 'antena y router del kit Standard', campos: null,
      porQue: 'Starlink no tiene catalogo en legacyData: el kit lo lleva el motor canonico' },
    { documento: 'Zoom: requisitos de ancho de banda',
      url: 'https://support.zoom.com/hc/en/article?id=zm_kb&sysparm_article=KB0060748', estable: false, fecha: '2026-09-23', hash: null,
      sinVigilancia: 'la pagina es una aplicacion de JavaScript: el HTML llega como cascaron (113 caracteres de texto) y solo un navegador pinta el contenido. Medido con sondeo-fuentes.yml el 2026-10-15 (corrida 38774517394).',
      cubre: 'perfiles de videoconferencia (SD, 720p y 1080p) del motor', campos: null,
      porQue: 'respalda los supuestos de trafico del motor (VIDEO_PROFILES), no un campo de catalogo' },
    { documento: 'YouTube: velocidades recomendadas',
      url: 'https://support.google.com/youtube/answer/78358?hl=es', estable: false, fecha: '2026-09-23', hash: null,
      sinVigilancia: 'el texto cambia en cada peticion (un identificador aleatorio en el menu del Centro de ayuda): su huella no diria nada. Medido con sondeo-fuentes.yml el 2026-10-15 (corrida 38774517394).',
      cubre: 'perfiles de streaming (720p, 1080p y 4K) del motor', campos: null,
      porQue: 'respalda los supuestos de trafico del motor (STREAM_PROFILES), no un campo de catalogo' },
  ],
};

// QUE EQUIPOS RESPALDA CADA FUENTE (`modelos`, 2026-10-19). `cubre` es prosa y no dice a que
// equipo se aplica: la hoja «Supuestos» del Excel casaba fuente y equipo buscando el nombre en el
// texto, y un titulo de serie o un modelo citado de pasada atribuia una fuente que no respalda la
// cifra. `modelos` lo declara: una lista de ids exactos del catalogo, de series (`ser` o `serie`),
// de codigos de ficha (`codigo`, MikroTik) o '*' para todo el catalogo del fabricante. `[]` es
// «no respalda ningun equipo» (un folleto de contexto) y la ausencia es «no declarado». Cada
// elemento tiene que existir en el catalogo y el propio texto de la entrada (documento, cubre,
// nota o URL) tiene que nombrarlo, a el o a la serie de cada equipo que arrastra
// (`test/fuentes-modelos.test.js`): la guarda no prueba la atribucion, pero frena la que el
// documento ni menciona.
const CATALOGOS_MODELOS = {
  huawei: ['MODELS'], cisco: ['MODELS'], fortinet: ['MODELS'], mikrotik: ['MODELS'],
  aruba: ['MODELS'], juniper: ['MODELS', 'SDWAN'], nokia: ['MODELS', 'MODELS_ROUTER'],
};
const catalogoDe = (vendor) => {
  const listas = CATALOGOS_MODELOS[vendor];
  if (!listas) return [];
  // Se carga al pedirlo: el catalogo no depende de este archivo y la siembra ya lo tiene en memoria.
  const mod = require(`./${vendor}`);
  return listas.flatMap((l) => mod[l] || []);
};
const normTexto = (t) => String(t || '').toLowerCase().replace(/[\s_]+/g, '');
const serieDe = (m) => m.ser || m.serie || null;

// Resuelve `f.modelos` contra el catalogo. `ids: null` si la fuente no lo declara.
function resolverModelos(vendor, f) {
  if (!Array.isArray(f.modelos) && f.modelos !== '*') return { ids: null, desconocidos: [], sinMencion: [] };
  const cat = catalogoDe(String(vendor || '').toLowerCase());
  if (f.modelos === '*') return { ids: cat.map((m) => m.id), desconocidos: [], sinMencion: [] };
  const texto = normTexto([f.documento, f.cubre, f.nota, f.url].join(' '));
  const ids = new Set();
  const desconocidos = [];
  const sinMencion = [];
  for (const k of f.modelos) {
    const deK = cat.filter((m) => m.id === k || serieDe(m) === k || (m.codigo && m.codigo === k));
    if (!deK.length) { desconocidos.push(k); continue; }
    deK.forEach((m) => ids.add(m.id));
    // El texto nombra lo declarado: el propio elemento, la serie de cada equipo o la ultima palabra
    // de su id («401F» en «FortiGate 401F», «X16» en «NE8000 X16»).
    const nombrado = texto.includes(normTexto(k)) || deK.every((m) => {
      const ultima = String(m.id).split(' ').pop();
      return (serieDe(m) && texto.includes(normTexto(serieDe(m)))) || (ultima.length >= 2 && texto.includes(normTexto(ultima)));
    });
    if (!nombrado) sinMencion.push(k);
  }
  return { ids: [...ids], desconocidos, sinMencion };
}

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
  return lista.map((f) => ({ ...f, ...estadoFuente(f, ahora), modelosResueltos: resolverModelos(vendorCode, f).ids }));
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

// Los avisos que dicen lo mismo van en una sola linea. Las 20 fichas de MikroTik comparten estado
// («sin fecha»: MikroTik no fecha sus fichas) y nota, y como 20 lineas iguales enterraban en el
// log del arranque a las fuentes que si piden accion. Se agrupa por fabricante, estado, meses y
// nota; el grupo conserva cada documento y el recuento total no cambia.
function agruparAvisos(avisos) {
  const grupos = new Map();
  for (const a of avisos) {
    const clave = JSON.stringify([a.vendor, a.estado, a.meses, a.nota || '']);
    if (!grupos.has(clave)) grupos.set(clave, { ...a, documentos: [] });
    grupos.get(clave).documentos.push(a.documento);
  }
  return [...grupos.values()];
}

module.exports = { FUENTES, ANTIGUEDAD_AVISO_MESES, mesesDesde, estadoFuente, fuentesDe, resolverModelos, fuentesQueAvisan, agruparAvisos, documentoFichaMikrotik };
