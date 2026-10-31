# Relevo

Última actualización: 2026-10-31 · PR #93

Informe para continuar el trabajo. Lo pidió el dueño del repositorio el 2026-10-27: «de aquí en
adelante, un informe de pendientes y mejoras para que la cuenta **servicioiptv2025@gmail.com**
continúe ejecutando los cambios; van a trabajar en el proyecto juntos». Se reescribe en el commit
que fusiona cada entrega en `main` (instrucción permanente en `CLAUDE.md`). El detalle de cada
punto está en `PENDIENTES.md`; aquí va lo que hace falta para retomar sin leerlo entero. Lo que
está en curso no va aquí: lo dice `npm run traspasos` (protocolo en `docs/traspaso/README.md`).

## Cómo retomar

1. **Accesos** (los da el dueño; esta sesión no puede): colaborador en GitHub de
   `Vladichakadc/presales` (*Settings → Collaborators*) y, si vas a mirar despliegues, miembro del
   proyecto `Presales` de Railway. Con Claude Code, abre una sesión sobre el repositorio:
   `CLAUDE.md` se carga solo y dice cómo se trabaja aquí.
2. **Antes de tocar nada**: trae `main` y corre `npm run traspasos`: lista cada rama con su
   `docs/traspaso/<tema>.md` y los archivos que declara, y los PR abiertos sin traspaso con los suyos. No se toma un tema ni un archivo ajeno.
3. **Mientras trabajas**: un tema, una rama y su traspaso (de `docs/traspaso/PLANTILLA.md`) al día en
   cada commit, y empuja a menudo: lo no empujado se pierde si la sesión se corta. Antes de fusionar
   en `main`: `npm run verificar`, `npm run auditar`, el servidor con `NODE_ENV=production`, la
   pantalla conducida en el navegador (`npm run pantallas`, los casos de `npm run contraste`,
   `npm run e2e`, `npm run puerta`). Railway despliega `main` cuando CI pasa.
4. **Al fusionar**: abre el PR primero, porque **la entrega se nombra por fecha y número de PR**
   (`AAAA-MM-DD · PR #N`, nunca por ordinal); rebase sobre `main`; `PENDIENTES.md` (lo cerrado a
   *Cerrado recientemente*), este archivo y `CLAUDE.md` si cambió una regla; el traspaso del tema se
   borra en ese commit.
5. **Lo que no se negocia**: nunca se inventa un dato (sin documento oficial, `null` y «sin dato»);
   un 403 del proxy de egreso se reporta, no se rodea; los documentos de los fabricantes se traen con
   `traer-cisco-huawei.yml` a una rama `fuente/*` nueva por corrida; las decisiones del dueño no se
   toman por silencio; todo el texto visible, en español.

## Estado al cerrar esta entrega

- **2026-10-31 · PR #93**: el botón «Actualizar» avisa cuando su recálculo cambia lo que se veía
  («El resultado no estaba al día…») y deja en la consola el último campo tocado y el enlace. Es la
  vía para cazar el desfase que el dueño vio y ninguna batería reproduce: **si alguien ve ese aviso,
  que pase la línea `[actualizar]` de la consola**. **Criterio que conviene conservar**: el botón y
  las baterías leen el mismo texto de resultados; si cambia la rejilla de una página, se cambia en
  los dos sitios (la prueba frena que diverjan).
- **2026-10-31 · PR #91**: el Secure Firewall elegido a mano viaja en el enlace y en el perfil (pendiente del PR #88). **Criterio que conviene conservar**: un desplegable que pinta ficha.js con otro contenedor se declara igual que `verdict-sel` (en `CAMPOS_ENLACE` y en `TARDIOS`), y la página guarda en su variable solo la elección manual, nunca el recomendado.
- **2026-10-31 · PR #90**: **los fallos del contraste se leen por la API** (la mejora propuesta al cerrar el PR #88). Cada fallo sale como anotación `contraste` de la comprobación `pantallas`, con caso, escenario, campo, esperado y obtenido: `gh api repos/<dueño>/<repo>/check-runs/<id>/annotations`. **Criterio que conviene conservar**: todo lo que puede poner en rojo un paso de CI deja una línea que el workflow convierte en anotación; si no, desde una sesión en la nube solo se ve un código de salida.
- **2026-10-31 · PR #88**: **el Secure Firewall, con ficha completa** (F2 y F3). Sus figuras oficiales en el catálogo de figuras de Cisco y, con «Firewall dedicado aparte», su ficha debajo de la del router: cifras con su base, hardware, alimentación, figuras y enlace a su ficha oficial; elegir otro cambia el BOM. **Queda**: sin precio (no hay lista oficial) y sin ciclo de vida respaldado; la elección manual en el enlace, cerrada en el PR #91. **Criterio que conviene conservar**: una ficha secundaria con FICHA declara su ciclo de vida (`cicloVida`) en vez de heredar el del fabricante, que respalda a otros equipos.
- **2026-10-31 · PR #87**: **el Cisco Secure Firewall entra al catálogo** (decisión del dueño: «Sí, ficha completa»). F1 hecha: los 14 modelos en el portal con el hardware de sus fichas, generados de `SECURE_FIREWALL`, y la calculadora los dimensiona con IPsec, FW + AVC + IPS y TLS. F2 y F3, en el PR #88; sin precio. **Criterio que conviene conservar**: una sola copia de cada cifra —el portal se genera de `SECURE_FIREWALL`— y sin `fwd`, porque sus fichas no dan un firewall sin inspección.
- **2026-10-31 · PR #86**: la batería `e2e-arranque.js` comprueba que los nueve dimensionadores abren
  al día (vacía, desde un enlace compartido y recargada): 27 de 27 en CI. **Criterio que conviene
  conservar**: una página nueva entra en `PAGINAS` de `test/e2e/resultados.js` y queda en las dos
  baterías; la lectura de resultados vive solo ahí.
- **2026-10-30 · PR #85**: la verificación en navegador que faltó en el PR #84. `test/e2e/e2e-pqc-gestion-huawei.js` abre el dimensionador de Huawei servido por el servidor, elige el AR6710-L26T2X4 y comprueba la fila «Gestión y control» con su documento, el túnel en «no consta» y que «Exigir PQC» lo aparta por «no consta». Verde en CI (`pantallas`).
- **2026-10-30 · PR #84**: **la PQC de gestión y control** (la mejora propuesta al cerrar el PR #82). Los cuatro AR6710-L llevan `pqcGestion` con el literal de su ficha R26C00 («PQC is supported for SSL, SSH, and SD-WAN DTLS protocols»); la ficha lo dice en su fila «Gestión y control» y el Comparador como «Solo en …; no en el túnel de datos». **Criterio que conviene conservar**: `pqcGestion` nunca es `pqc` y `pqc.js` no lo lee; un canal que no lleva el tráfico no cumple «Exigir PQC» (`test/pqc-gestion.test.js`).
- **2026-10-30 · PR #83**: tercera corrida de transporte. La ficha oficial del SRX4100/4200 no trae PQC ni PPK, y la ficha de Meraki de los C8111/C8121-G2-MX da «2 x 2.5 mGig RJ45» para WAN sin velocidad mínima (como su guía de instalación): el `velMinSupuesto` sigue. Con esto, los pendientes que esperan documento han pasado por todos los documentos oficiales descargables que se conocen; lo que los cierra está en la tabla de *Esperan un documento oficial*.
- **2026-10-30 · PR #81**: el tier de caudal de Aruba viaja en el enlace (`selTier` en `opcionesTarde`;
  medido antes en CI: se perdía). **Criterio que conviene conservar**: un `<select>` vacío en el HTML
  que viaja en el enlace va en `opcionesTarde`; `test/opciones-tarde.test.js` lo frena si no.
- **2026-10-30 · PR #82**: lo que trajo la segunda corrida de transporte, registrado en *Esperan un documento oficial*. Huawei AR6710-L R26C00 da «PQC is supported for SSL, SSH, and SD-WAN DTLS protocols»: es gestión y control, no el IPsec de datos, y no da algoritmo, así que no satisface «Exigir PQC» (no se escribe `pqc`). La ficha de la línea SRX300 no trae PQC; la guía de instalación de los C8111/C8121-G2-MX da «2.5 MGig» sin velocidad mínima (el `velMinSupuesto` sigue).
- **2026-10-30 · PR #79**: la batería de campos en línea recorre también los bloques que aparecen al
  marcar otro campo, cada opción de los botones segmentados y las filas de «+ Añadir»: 380
  comprobaciones en CI, ninguna atrás. **Criterio que conviene conservar**: `PROFUNDIDAD` y `TOPE`
  acotan el recorrido; si una página crece y lo toca, se sube el tope antes que quitar niveles.
- **2026-10-30 · PR #80**: el modelo de Aruba en un enlace lo repone `ESTADO` (`opcionesTarde`), sin la
  captura propia `QMODEL_URL`. `opcionesTarde` también anuncia el valor cuando las opciones ya estaban.
- **2026-10-30 · PR #77**: el modelo de AP de MikroTik viaja en el enlace. **Criterio que conviene
  conservar**: un `<select>` que el HTML trae vacío y se rellena con el catálogo no se puede restaurar
  al vincular; la página lo declara en `ESTADO.vincular({ opcionesTarde })` y ESTADO lo repone cuando
  llegan sus opciones (`test/e2e/e2e-apmodel-enlace.js`).
- **2026-10-30 · PR #78**: lo que trajo el transporte para la PQC de Nokia 7250/7220 (cinco PDF de nokia.com) y lo que dice la página de VPN de Meraki, registrado en la tabla de *Esperan un documento oficial*. Ninguno se cierra: la nota de ANYsec habla de la serie 7250 IXR sin nombrar modelos, y una afirmación de serie no se extiende a un modelo sin documento que lo nombre (la misma regla que la PPK de un sistema operativo).
- **2026-10-30 · PR #74**: la batería `e2e-campos-en-linea.js` vigila que cada campo de los nueve
  dimensionadores recalcule en línea, con el botón «Actualizar» como oráculo. Medida en CI: 235
  campos, ninguno atrás. **Criterio que conviene conservar**: un campo que de verdad no debe seguir en
  línea se declara en `EXCEPCIONES` con su motivo; una página nueva entra en `PAGINAS` y, si sin
  caudal no recomienda nada, en `PREPARAR`.
- **2026-10-30 · PR #76**: la ayuda de «Exigir PQC» de Aruba (`#reqPqcHint`) ya dice que el 9106 trae la PPK con AOS-8 desde la 8.13.1.0. Solo esa frase, con autorización expresa del dueño, porque la página la declara el traspaso de `claude/elegant-pascal-7ymts7`, que tiene cambios sin fusionar en ella: si esa rama se fusiona, el choque es de una línea.
- **2026-10-30 · PR #75**: los campos del perfil multi-sede salen de los del enlace (`CAMPOS_ENLACE`
  menos `PERFIL_SIN` más `PERFIL_EXTRA`, cada excepción con su motivo) en Cisco, Huawei, Juniper,
  MikroTik y Nokia 7750. El enlace no cambia; el perfil de MikroTik gana «Exigir PQC», que se perdía.
  **Criterio que conviene conservar**: un campo nuevo del escenario va en `CAMPOS_ENLACE` y llega solo
  al perfil; si el perfil no debe guardarlo, va en `PERFIL_SIN` con su motivo
  (`test/perfil-campos-enlace.test.js` frena una lista escrita a mano o una excepción muerta).
- **2026-10-29 · PR #68**: Fortinet con fechas de fin de venta y de soporte en la ficha del equipo
  elegido. 60F y 61F: último pedido 2027-01-13 (siguen recomendables hasta entonces y caen solos);
  1000F y 1001F: vencido el 2026-10-13, ya no se recomiendan en compra nueva (sube el 1800F); 400F y
  401F sin fin de venta. Las fechas son de terceros y llevan la nota `confirmar` hasta leerlas en el portal.
- **2026-10-29 · PR #72**: **la PQC del Gateway 9106, cerrada con documento oficial.** El «What's New» de AOS-8 (traído por Actions) dice «Starting with AOS-8.13.1.0, the 9106 controller is now supported in AOS-8.x»; con la guía de PPK de AOS-8 (desde la 8.10.0.0), el 9106 trae la PPK con AOS-8.13.1.0. Los SKU S0B85A y S0B86A vienen con AOS-10 y no bajan: lo dice su `alcance`. El texto `#reqPqcHint` de la página de Aruba se puso al día en el PR #76.
- **2026-10-29 · PR #70**: «por <función>» en la fila del BOM de Cisco, Fortinet, Huawei, Aruba y
  MikroTik (`public/js/por-funcion.js`, `req` en los motores, `test/por-funcion.test.js`,
  `e2e-por-funcion.js`); complementa el resaltado del PR #66. **Criterio que conviene conservar**:
  una línea nueva que solo exista por una casilla lleva su `por` (o su `req`) en el mismo `if` que la
  crea; la prueba frena un `por` que no sea una casilla de la página y una clave sin casilla.
- **2026-10-29 · PR #69**: botón «Actualizar» en los nueve dimensionadores (encargo del dueño: el
  recálculo en línea no siempre reflejaba los parámetros). Valida los campos visibles con sus reglas
  del HTML, recalcula todo con `window.DIMENSIONADOR_ACTUALIZAR` y dice el resultado. **Criterio que
  conviene conservar**: un dimensionador nuevo registra su recálculo completo en
  `window.DIMENSIONADOR_ACTUALIZAR` (devuelve `false` si el catálogo no llegó) y carga
  `actualizar.js` y `actualizar.css`; `test/actualizar.test.js` lo frena si falta.
- **2026-10-29 · PR #71**: «↻ Actualizar fuentes» en las siete pestañas de fuentes: el servidor
  vuelve a leer cada documento oficial y dice si sigue siendo el contrastado (columna «Comprobado
  ahora»); solo lee, con 10 minutos de caché por fabricante.
- **2026-10-29 · PR #65**: la revisión de los pendientes que esperan documento, registrada uno por uno en *Esperan un documento oficial* (qué se buscó, qué se encontró, qué lo cierra). Ninguno se cierra sin su documento.
- **2026-10-29 · PR #67**: el marcado del panel de perfiles y de su ventana lo genera
  `BOM.montarPerfiles`; las siete páginas solo dejan su sección con su explicación (la mejora
  propuesta al cerrar el PR #62).
- **2026-10-29 · PR #66**: al activar una función, la columna de resultados resalta lo que apareció o
  cambió por ella, con «Apareció al activar «X»», y el panel de funciones dice cuántos puntos y lleva
  al primero (petición del dueño; era la mejora propuesta al cerrar el PR #61).
- **2026-10-29 · PR #62**: el panel de perfiles multi-sede de las siete páginas es un solo módulo,
  `BOM.montarPerfiles` en `bom.js` (la mejora propuesta al cerrar el PR #55): una mejora del
  consolidado se escribe una vez, y las siete se comportan igual (diálogo, Escape, mensajes).
- **2026-10-29 · PR #64**: la cadencia de la vigilia del despliegue, medida: una corrida programada en
  ~8 h donde se esperaban ~16. El aviso llega, pero puede llegar tarde. Se vuelve a medir el
  2026-11-05 (ver *Vigilar* en `PENDIENTES.md`). La PQC de los SRX se contrastó con el Feature
  Explorer de Juniper: casa con el catálogo, y el SRX4100 y los de sucursal siguen «no consta».
- **2026-10-28 · PR #61**: las funciones activadas, resaltadas también en la columna de resultados de
  los ocho dimensionadores con casillas (panel «Funciones activadas», `public/js/funciones-activas.js`
  y la sección 3 de `controles.css`). **Criterio que conviene conservar**: el panel cuenta lo mismo que
  la izquierda resalta; una exclusión nueva en la hoja (otro tipo de casilla compacta) va también en
  `EXCLUIDAS` del módulo, y la prueba lo frena si no.
- **2026-10-28 · PR #60**: en Fortinet, la casilla «Licencia FortiGuard única del par» cotiza un par
  activo-pasivo de las series de la guía con dos SKU de HA y un solo bundle, y dice el ahorro; si algo
  falta (70F y 100F no tienen SKU de HA en la lista firmada), sigue por nodo y dice por qué.
- **2026-10-28 · PR #59**: **la vigilia del despliegue** (la mejora propuesta al cerrar el PR #56).
  `vigilia-despliegue.yml` mira cada media hora la cabeza de `main`, su CI y sus despliegues de
  producción; si pasan 90 min sin ningún despliegue en `success`, abre un issue con la etiqueta
  `despliegue-en-espera` y la causa que se ve desde GitHub (`ci-rojo`, `ci-sin-terminar`,
  `en-cola`, `sin-despliegue`), y lo cierra solo cuando la cabeza queda desplegada. La decisión vive
  en `scripts/vigilia-despliegue.js`, con su prueba sin red. **Criterio que conviene conservar**: la
  sonda avisa de lo que falla y la vigilia de lo que no llega; un despliegue fallido no lo repite la
  vigilia. Con el issue abierto, el remedio de siempre: mirar Railway (`list-deployments`) y, si no
  ve el commit, un commit vacío en `main` o «Redeploy».
- **2026-10-28 · PR #58**: en Fortinet, elegir un fuera de venta que cumple el escenario en compra nueva
  ofrece «Es una ampliación» o «Es una renovación de servicios» en la caja del override: fija el tipo de
  compra y lleva a la justificación, que el motor sigue exigiendo.
- **2026-10-28 · PR #57**: el transporte de documentos, probado sin red (mejora propuesta al cerrar el PR
  #54). `traer()` se ejercita en `verificar` con respuestas fabricadas (`test/transporte-traer.test.js`).
  **Criterio que conviene conservar**: una regla nueva del transporte entra con su caso en esa prueba,
  y un cambio del script se confirma con una corrida real de una entrada conocida antes de fusionar.
- **2026-10-28 · PR #56**: **Fortinet F3, cerrado con documento oficial.** La guía de FortiOS 7.6.6
  («Single FortiGuard license for FortiGate A-P HA cluster») da la licencia FortiGuard única en
  activo-pasivo a las series 40F, 60F, 70F, 80F y 100F: los 8 FortiGate del catálogo llevan
  `haLicenciaUnica` (serie, heartbeat, SKU de HA de la lista firmada, fuente), el motor lo avisa y
  la página lo dice en la cantidad, el resumen, la ficha y el BOM (`licenciaHa()`), donde antes
  decía «la licencia no se comparte en HA». El BOM sigue cotizando una suscripción por nodo. De los
  pendientes de fuentes, revisados en internet: **N1 Advanced frente a Foundation**, que ya estaba
  cerrado, contrastado con una copia que tiene la huella del vigía; **las regiones y «flavors» del
  vCPE AR6700V-L**, localizados en las guías de despliegue por nube («Supported Flavors»), que solo
  sirven un cascarón de JavaScript; el **CCR2004-16G-2S+PC**, sin fuente (su manual no lo dice).
  **Criterio que conviene conservar**: un aviso `info` del motor de Fortinet no llega a la página
  (la página filtra `nivel !== 'info'`); si un dato tiene que verse, la página lo pinta ella, como
  `licenciaHa()`. La mejora del transporte la entregó el PR #54.
- **2026-10-28 · PR #51**: el desplegable de la ficha de Fortinet lleva también los fuera de venta
  que cumplen, como el de Cisco; y en los siete dimensionadores van al final en su propio grupo
  rojo con nombre, con contador, nota y, si se elige uno, pastilla y barra rojas. No se
  recomiendan, y elegir uno en compra nueva bloquea la cotización.
- **2026-10-28 · PR #55**: los perfiles multi-sede también en Juniper y Nokia 7750 (la mejora
  propuesta al cerrar el PR #50, aprobada por el dueño). Siete páginas guardan perfiles; la 7220 IXR
  y Starlink no, a propósito. **Criterio que conviene conservar**: la clave `vendor` de un perfil es
  la de la ruta `/api/dimensionador/<clave>` de su página (`nokia-sr`, no `nokia`), porque con ella
  el consolidado pide el catálogo para poner al día el ciclo de vida; lo que se enseña lo traduce
  `NOMBRE_FABRICANTE` en `bom.js`.
- **2026-10-28 · PR #53**: «Exigir PQC» respeta el sistema operativo del escenario: con AOS 10, los
  gateways de Aruba (PPK documentada solo con AOS 8) se apartan con «con AOS 10 no consta».
- **2026-10-28 · PR #54**: las dos mejoras pendientes que se podían ejecutar. Foto propia del MX67,
  el MX68 (sin radio) y el C8355-G2-MX desde su página de producto; el resto de la gama sin foto
  sigue con su dibujo de línea oficial (las páginas de Catalyst 8300 e ISR solo traen fotos de la
  familia, sin modelo). Y **el transporte de documentos fuera del YAML**: una entrada nueva se
  añade en `scripts/transporte/documentos.js`, nunca en `traer-cisco-huawei.yml`, y `npm run
  verificar` la carga (`test/transporte-documentos.test.js`: nombres únicos, tipos y fabricantes
  conocidos, https, y que lo que descubre en otra página la lea después de bajarla).
- **2026-10-28 · PR #50**: al consolidar, los perfiles de otros fabricantes también se ponen al día
  con su catálogo, pedido al servidor (la mejora propuesta); si una ruta falla, el perfil conserva su
  dato y el aviso dice por qué.
- **2026-10-28 · PR #52**: el dimensionador Cisco ya enseña figura de todos sus equipos. El ISR
  1161X-8P (cara de puertos de la familia 11x1(X)-8P, con su tabla de 9 números, y foto), el ISR
  1116-4P (cara del logotipo de la serie C111x; la pestaña «Frontal» dice que Cisco no publica la de
  puertos) y los tres ASR (vista de frente de cisco.com y foto de su ficha). Los Meraki de sobremesa
  se abren por la cara de puertos y siete MX llevan la foto de producto de su ficha; seis Secure
  Router, la foto de cabecera de su serie; y las 95 previas de Cisco, a 1.600 px y calidad 90.
  **Criterio que conviene conservar**: la figura de una familia entra solo si el documento la
  rotula para esa familia (la 29 de la guía del ISR dice «11x1(X)-8P»), y el pie dice lo que no
  coincide; una foto de otro modelo, nunca (por eso el MX67 y el MX68 sin radio no llevan la foto
  con antenas, ni el 1116-4P la del C1117-4PLTE). Dos opt-in nuevos en `ficha.js`: `inicial` (la
  cara por la que se abre la tarjeta) y `frontNota` (la frontal que falta, dicha).
- **2026-10-28 · PR #49**: PQC con documento en 12 gateways AOS-8 de Aruba (9004, 9012, 9240 y la
  línea 7000/7200), y Juniper MX y SSR100 citan su ficha inglesa (psnow). Lo buscado sin documento
  nuevo está en *Cerrado recientemente* de `PENDIENTES.md`.
- **2026-10-28 · PR #48**: una prueba frena una copia de `public/datasheets/` que ya no es el
  documento cuya huella verifica el vigía (`test/huella-copia-lock.test.js`).
- **2026-10-28 · PR #46**: el ciclo de los perfiles, al día con el catálogo al consolidar (la
  mejora propuesta): los perfiles del fabricante de la página se recalculan con su catálogo; los de
  otro fabricante dicen de qué fecha es su dato.
- **2026-10-28 · PR #47**: las dos fuentes de Aruba que eran un cascarón citan la descarga del
  PDF de psnow (serie 9000, mismo documento; EdgeConnect, Rev. 9 contrastada sin cifras distintas).
  El vigía las lee desde el lunes.
- **2026-10-28 · PR #45**: la fuente de la PQC, enlazada a `fuentes.js` (la mejora propuesta):
  cada `pqc`/`pqcNo` cita su documento por la URL de su entrada (`urls`), la prueba exige que esa
  entrada exista, respalde el campo y declare al equipo, y la ficha y la hoja «Supuestos» lo
  enlazan. De los pendientes de fuentes, solo con documento oficial: **los 20 MikroTik traen ya la
  PPK** (el RB1100AHx4, la PowerBox Pro y el hEX PoE lite, por el changelog oficial de RouterOS que
  los nombra en la 7.23, la 7.21.3 y la 7.24.2). El resto de la PQC se leyó y sigue en «no consta»
  (ver abajo). **El transporte de documentos** (`traer-cisco-huawei.yml`) iba como argumento de
  `node -e` y llegó al tope de 128 KiB de Linux: va por la entrada estándar (`node - <<NODE_JS`).
  **Criterio que conviene conservar**: una entrada nueva del transporte no lleva comillas dobles
  (`test/workflows-node-e.test.js` lo frena), y un dato de PQC sin URL de `fuentes.js` no pasa.
- **2026-10-28 · PR #44**: el fin de venta también en el consolidado multi-sede (la mejora
  propuesta): cada perfil guarda el ciclo de su equipo y el consolidado lo avisa en pantalla y en
  la hoja BOM de su Excel. Un perfil guardado antes dice «sin dato de ciclo».
- **2026-10-28 · PR #43**: `npm run candidatas` dice si cada PDF servido es el mismo documento que
  su copia de `public/datasheets/` o una edición distinta (campo `copia` en la candidata).
- **2026-10-28 · PR #41**: el fin de venta del equipo también en el Excel (la mejora propuesta):
  sección «Ciclo de vida del equipo» en «Supuestos» (estado, último pedido, sucesor, boletín) y
  un aviso en rojo en la hoja BOM. Sin dato de ciclo no sale nada.
- **2026-10-28 · PR #42**: las dos fuentes de Aruba que eran un cascarón ya tienen URL del PDF
  probada desde Actions (`psnow/downloadDoc/<id>.pdf?id=<id>`): la de la serie 9000 sirve el mismo
  documento que se leyó; la de EdgeConnect, la Rev. 9, que falta contrastar. `fuentes.js` no se tocó
  (lo declaraba otra rama).
- **2026-10-28 · PR #40**: la foto de producto también en el Excel (la mejora propuesta); en rojo,
  y con su texto, lo que está o va a estar fuera de venta en todos los desplegables de equipo
  (`FICHA.opcionCiclo`, una sola regla); y la fila de cada casilla de función marcada, resaltada
  con el acento de la página (`public/controles.css`, la hoja común de los ocho dimensionadores).
  **Criterio que conviene conservar**: el rojo del fin de venta es fijo (`--red` es la marca de
  cada página) y nunca va solo, porque los desplegables nativos de macOS y del móvil no lo pintan.
- **2026-10-28 · PR #39**: las entregas se nombran por fecha y número de PR, no por ordinal
  (abre el PR antes del commit de cierre; `test/relevo.test.js` exige el mismo `PR #N` en la
  cabecera de `PENDIENTES.md` y en la de este archivo).
- **Septuagesimoprimera entrega**: la mejora propuesta, hecha: **un «no la trae» de PQC con su documento**.
  Un equipo puede declarar `pqcNo: {motivo, corto, fuente}` (solo con fuente, nunca junto a `pqc`):
  la ficha dice «no la trae» con el motivo, el Comparador «No — …», «Exigir PQC» lo aparta con ese
  motivo en vez de «no consta», y la hoja «Supuestos» cita la fuente. Hoy solo el ASR 1001-X: su
  boletín de fin de venta lo deja en IOS XE 17.9 y la PPK llega en la 17.11.1a. Un `pqcNo` sin fuente
  se lee como «no consta» (lo exige la prueba). Los tres boletines de los ASR, que iban en una sola
  fuente con la URL del 1006-X, son ahora tres: el vigía vigila los tres. De lo pendiente: las
  ranuras de expansión del 9114 y el 9240 de Aruba no tienen módulo que modelar (sus QuickSpecs las
  dan «Reserved for Future Use», y el catálogo lo dice así), y se cerró la sección del piloto de IA,
  retirado en el PR #34.
- **Septuagésima entrega**: `test/contraste-cobertura.test.js` frena un
  `cobertura.lock.json` que cita un módulo ya borrado de `public/js/` (al borrar o renombrar uno,
  quita su fila del lock en el mismo PR o vuelve a medir con `npm run contraste -- --todos`).
- **Sexagesimonovena entrega** (PR #35): las figuras de Cisco sin tabla, buscadas en sus
  documentos. La frontal del Catalyst 8500-12X4QC, 8500-12X, 8500-20X6C, 8500L-8S4X y del ISR
  1111X-8P era la foto de la ficha, sin números: ahora es el dibujo numerado de su guía, con su
  tabla, y la foto sigue en una tercera pestaña «Foto». **Lo que no hay**: números en las figuras de
  Meraki, versiones de más resolución en las guías (sus PDF traen los mismos ráster que el HTML) y
  documento con las traseras que faltan; si Cisco publica una guía nueva, se trae por Actions.
- **Sexagesimoctava entrega**: la mejora propuesta, hecha: con «Exigir PQC», la hoja «Supuestos» del
  Excel dice el requisito, si el equipo lo cumple, el mecanismo, **la versión mínima de software** y
  la fuente (`matrizSupuestos` en `bom.js`; las siete páginas pasan el `pqc` del equipo; batería
  `e2e-pqc-supuestos.js`). Y seis equipos más con PQC documentada: el ASR 1002-HX y el ASR 1006-X
  (PPK desde la 17.11.1a, hasta la 17.15 y la 17.18 que dan sus boletines de fin de venta) y el hEX
  lite, el hEX, el hEX PoE y el hEX S de MikroTik (su manual: «RouterOS v7 and above»). El ASR 1001-X
  se queda en la 17.9 según su boletín: sin PPK. Documentos en `fuente/pqc-3-2026-10-27`.
- **Sexagesimoséptima entrega**: **retirado el piloto de IA «del pliego al escenario»** del
  dimensionador Cisco, por decisión del dueño (gastaba tokens y no servía): panel, ruta
  `/api/escenario/desde-documento`, servicio, módulo del navegador y sus pruebas. La IA que queda es
  la sincronización del catálogo.
- **Sexagesimosexta entrega** (PR #31): la criptografía post-cuántica, con documento oficial en
  43 equipos más. PPK (RFC 8784) en los 10 Catalyst 8000 y los 5 ISR 1000 (capítulo de PPK de la
  guía de IOS XE 17: 17.11.1a, y 17.12.1a en el ISR y el 8500), en los 10 EdgeConnect (technical
  brief de cifrados de ECOS) y en 16 MikroTik (RouterOS 7.21, donde la ficha dice «RouterOS v7», y
  CHR); MACsec/ANYsec quantum-safe en el 7750 SR-1x. Los documentos, en `fuente/pqc-2-2026-10-27`.
  **Criterio que conviene conservar**: la PPK de un sistema operativo solo se marca en el modelo
  que tiene documento de que corre esa versión (por eso los ASR, fuera de venta, y siete MikroTik
  siguen en «no consta»).
- **Sexagesimoquinta entrega**: `npm run traspasos` (y el arranque) enseña también los PR abiertos
  sin traspaso, con sus archivos, y ya no confunde las ramas `fuente/*` con temas. **Antes de tomar
  un tema, míralo entero**: dos veces el 27-oct se duplicó trabajo por no ver la rama de otra sesión.
- **Sexagesimocuarta entrega**: las figuras de Juniper, con la tabla de sus números, van en la
  hoja «Fotos del equipo» del Excel del BOM (PR #32), como ya hacían Aruba, Fortinet, Huawei y Cisco.
- **Sexagesimotercera entrega**: las figuras de Juniper (36) y del Aruba 7010 (2) dicen qué es
  cada número en la lupa, con su tabla literal y traducida (PR #29); la interconexión EdgeHA va
  por el puerto que cubre el agregado del sitio, no por el primer RJ-45 libre (PR #30).
- **Retoque tras la sexagesimosegunda** (PR #28): el número de la leyenda de Cisco sin
  `aria-label` (prohibido en un `span` sin rol). El PR #23 se cerró, superado por el #24.
- **Sexagesimosegunda entrega**: las tres mejoras propuestas, hechas (cita mínima del piloto del
  pliego, la interconexión EdgeHA por el puerto que le toca y las figuras de Cisco con su leyenda en
  el Excel), y la leyenda de las figuras de Cisco fusionada (PR #24). **Los fallos del e2e se leen
  ahora desde una sesión**: `gh api repos/Vladichakadc/presales/check-runs/<id>/annotations`
  (los logs y artefactos de Actions están en un dominio que el proxy deniega).
  Por el camino se arregló que **el Excel de Cisco no se descargaba** (la hoja «Supuestos» recibía
  un texto donde espera pares).
- **Producción**: `main` lleva esta entrega (ver `git log`); Railway despliega cuando CI pasa y la
  sonda (`sonda-produccion.yml`) abre un issue con la etiqueta `despliegue` si algo falla; si el
  despliegue ni llega, la vigilia (`vigilia-despliegue.yml`) abre uno con `despliegue-en-espera`.
- **Sexagesimoprimera entrega**: las figuras del dimensionador Cisco dicen qué es cada número. 67 caras de 38
  modelos traen la leyenda de su ficha o guía de hardware (número, rótulo literal y traducción);
  la lupa la pinta bajo la figura y la cambia con la cara, y la tarjeta la ofrece plegada
  (`frontLeyenda`/`rearLeyenda` en `cisco-vistas-equipos.json`, opt-in de `ficha.js`).
- **Sexagésima entrega**: el arranque de cada sesión remota lista los temas en curso (`npm run
  traspasos`) antes de instalar nada. **Aviso**: esta sesión y la de la entrega 59 hicieron a la vez
  el mismo piloto de IA porque aquella empujó a `main` sin rama de traspaso; el duplicado se cerró
  (PR #22). Antes de empezar un tema, rama y traspaso empujados: es lo que lo hace visible.
- **Entregado**: el requisito «Exigir criptografía post-cuántica» en los siete dimensionadores
  (`public/js/pqc.js`); el piloto de IA «del pliego al escenario» en el dimensionador Cisco
  (`POST /api/escenario/desde-documento`, `public/js/pliego.js`); la skill `accessibility` de ECC;
  y cerrados con documento oficial: la PQC de los diez FortiGate que faltaban (los 58 la
  documentan), la bahía 0 del C8570-G2 con la bahía 1 en 100G, el puerto de la interconexión
  EdgeHA de Aruba y el PoE a 48 V del MikroTik L009.

## En curso

Lo dice `npm run traspasos`, no este archivo (una tabla común chocaría en cada fusión). Al cerrar
esta entrega, ninguna rama de otra sesión llevaba un traspaso abierto ni había PR abiertos sin
traspaso (el #37, de otra sesión, se fusionó mientras se cerraba esta).

## Pendientes, por prioridad

### Solo los puede hacer el dueño

- **Confirmar en la herramienta Product Life Cycle de Fortinet** (support.fortinet.com, cuenta
  FortiCloud) las ocho fechas de `EOL_ANNOUNCED` y mirar 4200F, 7081F y 7121F. Al confirmarlas: quitar
  `confirmar` y declarar la fuente en `fuentes.js` con `campos: ['eolAnnounced']`.
0. **Borrar las ramas** `claude/leyendas-figuras-cisco`, `claude/leyendas-retoques` y
   `claude/ia-pliego-cisco` (el PR #23 ya está cerrado): el control de permisos de la sesión no deja
   borrar ramas remotas. Sus commits están en `main` o en sus PR cerrados; es solo limpieza.

1. **Proteger `main`**: *Settings → Rules → Rulesets* (o *Branches*): exigir las comprobaciones
   `verificar` y `pantallas` y «Require branches to be up to date before merging», **con el
   administrador en la lista de omisión** (las sesiones empujan directo a `main`). Aprobado, sin
   configurar: el 27-oct una sesión con acceso de administrador lo intentó por la API y el control
   de permisos de la sesión lo denegó; se hace a mano.
2. **Invitar a la cuenta colaboradora** en GitHub y, si hace falta, en Railway.
3. **Incidente de seguridad de Railway (20 al 22-oct), leído el 27-oct**: descifraron variables de
   entorno de hasta un 1,85 % de los espacios de trabajo y buscaban claves de IA. Rotar
   `ANTHROPIC_API_KEY` (crear una nueva en la consola de Anthropic, ponerla en Railway y revocar la
   vieja; mirar si hubo consumo raro) y `SESSION_SECRET` (cierra las sesiones); `AUTH_PASSWORD` solo
   crea el primer administrador, así que la contraseña se cambia en «Mi cuenta». Revisar el *Security
   log* y las apps de GitHub. Detalle en *Decisiones* de `PENDIENTES.md`.
4. **`ANTHROPIC_API_KEY` en Railway**: sin ella, la sincronización del catálogo responde 503
   (lo dicen en pantalla). `/api/sync/estado` dice si está puesta.
5. **Cuenta de Huawei** (Info-Finder pide sesión): sin ella no hay ciclo de vida de Huawei, ni el
   tope de túneles y rutas por modelo AR.

### Se pueden hacer desde una sesión, sin acceso especial

1. **Mejoras propuestas**: las de abajo, cuando el dueño las apruebe (no se hacen solas).

### Esperan un documento oficial (se cierran trayéndolo por Actions)

**Revisión del 2026-10-29 (PR #65), uno por uno.** Ninguno se cierra: cada uno necesita un documento que hoy no existe o que esta sesión no alcanza, y marcarlo cerrado sin él inventaría el dato.

| Pendiente | Qué se buscó el 2026-10-29 | Qué se encontró | Por qué sigue abierto · lo que lo cierra |
|---|---|---|---|
| PQC del SRX4100 y los SRX de sucursal (300/320/340/345/380) | Feature Explorer de Juniper, función 7502, y «Get started with PQC» de Junos; el 2026-10-30, por transporte (corrida 41060887530), la ficha de la línea SRX300 (sin PQC ni PPK) y, en una tercera corrida (rama `fuente/pendientes-3-2026-10-30`), la ficha del SRX4100/4200 en HTML (tampoco) | La tabla oficial nombra SRX1500, 1600, 2300, 4200, 4300 y 4700 con su versión: casa con el catálogo. Los demás no salen | No salir no es «no la trae». Lo cierra que la tabla los añada (entran como `pqc`) o un documento que diga que no (`pqcNo`) |
| PQC de los gateways Aruba 9004-LTE y 9114 (el 9106 se cerró en el PR #72) | «What's New» de AOS-8, notas de AOS-8.12.0.0 y gateways soportados de Central | El 9106 corre AOS-8 desde la 8.13.1.0 y trae la PPK desde ahí. El 9004-LTE y el 9114 no salen en ninguna versión de AOS-8 (Central los da solo con AOS-10) | Lo cierra la referencia de CLI de AOS-10 que nombre `ppk-mandatory` en el gateway |
| PQC de los Meraki MX y G2-MX | Búsqueda de PPK / RFC 8784 en Meraki y, el 2026-10-30, su página «IPsec VPN Configuration Settings» | Solo la norma y sus borradores en el IETF; el roadmap quantum-safe de Cisco (ago-2026) cita el TLS del Dashboard; la página de VPN da IKEv1/IKEv2 y los grupos DH 1, 2, 5, 14, 15 y 21, sin PPK ni ML-KEM | Lo cierra una página de Meraki que dé PPK o ML-KEM en Auto VPN o en la VPN de terceros |
| PQC de los Nokia 7250 IXR y 7220 IXR | El 2026-10-30, por `traer-cisco-huawei.yml` (corrida 41050590900, rama `fuente/pqc-nokia-2026-10-30`): la nota de aplicación «ANYsec quantum-safe network cryptography» y las fichas R26 de las 7250 IXR-X, IXR-R, IXR-6e/10e/18e (edición SR Linux) y 7220 IXR-D | La nota ofrece ANYsec quantum-safe en «7250 IXR series» sin nombrar modelos; las fichas no lo llaman quantum-safe (IXR-R y 6e/10e dan MACsec; la IXR-X no lo nombra); la 7220 IXR-D no nombra MACsec | Lo cierra una ficha o guía de Nokia que lo diga |
| PQC y ciclo de vida de Huawei | El 2026-10-30, por transporte (corrida 41060887530, rama `fuente/pendientes-2-2026-10-30`): las fichas oficiales de AR6000 R26C00, AR8000 R25C10, AR6710-L R26C00, AR6710-H R25C10 y AR6700V-L R26C00 | Solo la AR6710-L R26C00 (sep-2026) nombra PQC: «PQC is supported for SSL, SSH, and SD-WAN DTLS protocols», es decir, gestión y canal de control del SD-WAN, no el IPsec que lleva el tráfico, y sin algoritmo ni versión. No satisface «Exigir PQC» | La PQC del IPsec la cierra un documento que la dé para el túnel de datos; el ciclo de vida, la cuenta Huawei del dueño (Info-Finder pide sesión) |
| Datos sueltos de Cisco (precio del Secure Firewall, precio de Secure Access, velocidad mínima del mGig de los C8111/C8121-G2-MX, módulos del ASR, breakout 4x10G) | Sin documento nuevo | — | Cada uno, su documento por el transporte; el precio de Secure Access, CCW (sin acceso desde la sesión) |


- **Criptografía post-cuántica sin documento**: Huawei (pide la cuenta); de los gateways AOS de
  Aruba, el 9004-LTE y el 9114 (los demás la traen con AOS-8 desde el PR #49, y el 9106 desde la 8.13.1.0 con el PR #72; con AOS-10
  no consta en ninguno: lo cierra la referencia de CLI de AOS-10 que nombre `ppk-mandatory` en el
  gateway); los Meraki MX y G2-MX (el roadmap quantum-safe de Cisco de ago-2026 solo cita
  el TLS del Dashboard); el SRX4100 y los SRX de sucursal (fuera del Feature Explorer; la PQC de Junos
  25.4R1 es la firma de imágenes); y los Nokia 7250 IXR (sus fichas Release 26 no llaman
  quantum-safe a su MACsec) y 7220 IXR (la ficha R26 de los IXR-D no nombra MACsec). Dicen «no
  consta» y el requisito los aparta con ese motivo. El ASR 1001-X no es un hueco: su boletín lo deja en la
  17.9, anterior a la PPK, y la ficha dice «no la trae» (`pqcNo`). Si un documento oficial dice que
  otro equipo no la trae, entra igual: `pqcNo` con su fuente en `fuentes.js` (`campos: ['pqcNo']`).
- **Cisco**: precio del Secure Firewall (sin lista oficial), precio de Secure
  Access por usuario (CCW), velocidad mínima de los mGig de los C8111/C8121-G2-MX, 10GBASE-T en
  SFP+ fuera de la serie 8300 y de las 8100 VAI/VAP, módulos del ASR (fuera de venta), breakout
  4x10G (pide su cable u óptica en el catálogo).
- **Juniper**: cifra de inspección del SSR (tampoco en la ficha inglesa), foto del SSR120 base,
  FEC del SSR; no hay lista de precios ni SKU de chasis.
- **Aruba**: EC-XL S3N77A (fuera de venta, sin ópticas de 25G en su matriz). Las dos fuentes que
  eran un cascarón quedaron cerradas en el PR #47.
- **MikroTik**: si la cifra IPsec es por sentido o la suma (respuesta escrita de soporte), figuras
  traseras que la galería no publica, el CCR2004-16G-2S+PC en la matriz de compatibilidad (su manual
  no dice qué módulos admite: lo cierra una respuesta escrita de soporte).
- **Huawei**: ficha de iMaster NCE-Campus; **regiones y «flavors» del vCPE AR6700V-L**: están en la
  sección «Supported Flavors» de sus guías de despliegue por nube (Azure EDOC1100591294, GCP
  EDOC1100592600, Huawei Cloud EDOC1100368764; URL en el pendiente 10 de Huawei), que a Actions solo
  le sirven un cascarón: lo cierra una persona que las abra en el navegador.
- **Fortinet**: el resto de F4, F5 (derates), 17 renovaciones sin precio en la lista firmada y
  co-term. F3 cerrado (PR #56); el heartbeat, dicho para las series con licencia única.

### Bloqueado por acceso (se reporta, no se rodea)

El proxy de egreso de los entornos de Claude Code en la nube rechaza los dominios de los
fabricantes (y `presales.up.railway.app`); los ejecutores de GitHub Actions sí llegan, y por eso
existen los workflows de transporte. Huawei y HPE niegan además el navegador automatizado (Akamai).

## Mejoras propuestas sin decidir

- **Vigía semanal del ciclo de vida de Fortinet** (propuesta al cerrar el PR #68). Un workflow que
  cada lunes compare los FortiGate del catálogo con un listado de fin de vida y abra un issue si
  aparece un modelo nuevo. Evita que un anuncio como el del 60F pase sin verse. Cuesta un workflow
  más; depende de un repertorio de terceros cuyo formato puede cambiar (el issue solo avisa, nunca
  escribe en `legacyData/`).
- **«Por función» también en la hoja «Supuestos» del Excel** (propuesta al cerrar el PR #70). La
  marca vive solo en pantalla: el Excel que se archiva con la propuesta no dice qué línea trajo cada
  función, y quien la revisa días después no lo puede reconstruir. Una sección «Líneas por función»
  en «Supuestos» (la hoja de los supuestos del preventa, no la del BOM que ve el cliente) con cada
  línea marcada y el nombre de su casilla. Cuesta pasar las filas con `por` en `meta.supuestos` de las
  cinco páginas y una sección en `matrizSupuestos` con su prueba; si se hace mal, la hoja del BOM
  cambiaría y el cliente vería notas internas, así que la marca no entra en la hoja «BOM». Se decide
  por el dueño.

- **«Copiar informe» en el aviso del botón** (propuesta al cerrar el PR #93). Cuando el botón dice
  «El resultado no estaba al día», lo útil (página, último campo y su valor, enlace del escenario,
  hora) queda en la consola, que un preventa no suele abrir. Un botón «Copiar informe» junto al
  aviso que lleve ese mismo texto al portapapeles, listo para pegarlo en un mensaje. Evita que el
  aviso se pierda sin dejar rastro, que es lo que ha impedido reproducir el fallo. Cuesta un botón y
  su manejador en `actualizar.js` (el portapapeles ya lo usa «Copiar enlace»); si se hace mal, copia
  un enlace sin el escenario, así que se copia `location.href` en el momento del aviso. Nada sale del
  navegador salvo lo que la persona pegue. Se decide por el dueño.
- **Un reloj para la vigilia que no sea el de GitHub** (propuesta al cerrar el PR #64, solo si la
  medición del 2026-11-05 confirma que faltan más de la mitad de las corridas). Una tarea programada
  de Claude (fuera de Actions) que cada hora lance `vigilia-despliegue.yml` por `workflow_dispatch`.
  Evita que un despliegue atascado se avise horas tarde. Cuesta una tarea programada por hora y su
  aprobación; si se hace mal, solo duplica corridas, que el diseño de un aviso por commit ya tolera.
  Se decide por el dueño.
- **Lo que trajo la función, también en la lista de materiales** (propuesta al cerrar el PR #66; en
  parte cubierta por el PR #70, que marca de forma fija la procedencia de esas líneas en cinco páginas).
  La comparación mira la columna de resultados de la rejilla donde está la casilla, y en las siete
  páginas con BOM la lista de materiales va en su propia pestaña: la línea que una función añade al
  BOM (el PIM del respaldo celular, la segunda fuente) no se resalta allí. Propuesta: tomar también
  la foto de la tabla del BOM (`#bomTabla`) al pulsar la casilla y marcar sus filas nuevas con la
  misma regla, y que el aviso del panel diga «y N líneas en la lista de materiales». Evita que quien
  revisa el BOM no sepa de qué requisito sale una línea. Cuesta un segundo origen de la foto en
  `funciones-activas.js` y su caso en `e2e-funciones-activas.js`; si se hace mal, una pestaña que se
  repinta al abrirse (y no al recalcular) se compararía con una foto vieja y marcaría filas de más:
  la prueba tiene que abrir la pestaña después de marcar. Se decide por el dueño.
- **Los estilos de la ventana del consolidado, en la hoja común** (propuesta al cerrar el PR #67).
  El marcado ya es uno, pero `#modalConsolidado`, `.acc-caja` y sus `h3` siguen escritos en la hoja
  de cada una de las siete páginas, con diferencias (el tono del velo, rgba(28,25,23) en cuatro y
  rgba(14,26,43) en tres). Moverlos a `controles.css` con las variables de cada página (`--card`,
  `--rule`) deja una sola regla. Evita que la próxima mejora de la ventana se escriba siete veces.
  Cuesta quitar unas cuatro líneas de cada hoja; si se hace mal, la ventana sale sin velo o sin
  desplazamiento en alguna página, y lo verían el contraste de pantallas y `e2e-accesibilidad.js`
  (que ya abre la ventana). Se decide por el dueño.
- **Comprobar las fuentes de los siete fabricantes desde el portal** (propuesta al cerrar el PR #71).
  Hoy «Actualizar fuentes» va pestaña por pestaña: saber si algún documento de cualquier fabricante
  cambió pide abrir siete páginas. Un panel en el portal que llame a la misma ruta para los siete (en
  serie, respetando la caché de 10 minutos de cada uno) y enseñe un resumen por fabricante, con
  enlace a su pestaña, daría la vista del vigía del lunes en el momento. Cuesta una sección del
  portal y su script, sin tocar el servidor; si se hace mal, siete corridas a la vez pegarían a los
  fabricantes (la prueba tiene que fijar que van de una en una). Se decide por el dueño.
- (Hecha en el PR #84: la PQC de gestión y control, `pqcGestion`. Hecha en el PR #81: el tier de Aruba en el enlace. Hecha en el PR #80: el modelo de Aruba por `opcionesTarde`. Hecha en el PR #77: el modelo de AP de MikroTik en el enlace. Hecha en el PR #75: los campos del perfil, de los del enlace. Hecha en el PR #71: «Actualizar fuentes» en vivo. Hecha en el PR #67: el marcado del panel de perfiles, generado por el módulo. Hecha en el PR #66: lo que trajo cada función, resaltado en el resultado. Hecha en el PR #62: el panel de perfiles, un solo módulo. Hecha en el PR #60: la licencia FortiGuard única del par en el BOM. Hecha en el PR #59: la vigilia del despliegue. Hecha en el PR #58: del override por ciclo de vida a ampliación o renovación en un clic. Hecha en el PR #57: el transporte probado sin red. Hecha en el PR #55: los perfiles multi-sede en Juniper y Nokia 7750. Hecha en el PR #54: la foto desde la página de cada modelo, hasta donde Cisco la publica, y el transporte fuera del YAML. Hecha en el PR #50: los perfiles de otros fabricantes al día al consolidar. Hecha en el PR #46: el ciclo del perfil al día al consolidar. Hecha en el PR #45: la fuente de la PQC enlazada a `fuentes.js`. Hecha en el PR #44: el ciclo en el consolidado multi-sede. Hecha en el PR #41: el fin de venta en el Excel. Hecha en el PR #40: la foto de producto en el Excel. Hecha en la septuagesimoprimera: el «no la trae» documentado, `pqcNo`. Hecha en la sexagesimoctava: la
  versión mínima de la PQC en la hoja «Supuestos».)

## Decisiones del dueño abiertas

- La protección de `main` (aprobada, falta configurarla) y el aviso de Railway (ver arriba).
- Nada más: las dos de la IA y la de las variantes fuera del catálogo se tomaron el 2026-10-27 por
  la opción recomendada (ver *Decisiones* en `PENDIENTES.md`).
