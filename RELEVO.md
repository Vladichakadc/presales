# Relevo

Última actualización: 2026-10-28 · PR #42

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
  sonda (`sonda-produccion.yml`) abre un issue con la etiqueta `despliegue` si algo falla.
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

- **Criptografía post-cuántica sin documento**: Huawei (pide la cuenta), los gateways AOS de
  Aruba, tres MikroTik (RB1100AHx4, hEX PoE lite y PowerBox Pro: su manual solo dice «la versión de
  /system resource o superior»), los G2-MX (MX OS), el SRX4100 y los SRX de sucursal, y los Nokia
  7250 IXR (sus fichas Release 26 no llaman quantum-safe a su MACsec) y 7220 IXR. Dicen «no consta»
  y el requisito los aparta con ese motivo. El ASR 1001-X no es un hueco: su boletín lo deja en la
  17.9, anterior a la PPK, y la ficha dice «no la trae» (`pqcNo`). Si un documento oficial dice que
  otro equipo no la trae, entra igual: `pqcNo` con su fuente en `fuentes.js` (`campos: ['pqcNo']`).
- **Cisco**: ficha del Secure Firewall dedicado (y decidir si entra al portal), precio de Secure
  Access por usuario (CCW), velocidad mínima de los mGig de los C8111/C8121-G2-MX, 10GBASE-T en
  SFP+ fuera de la serie 8300 y de las 8100 VAI/VAP, módulos del ASR (fuera de venta), breakout
  4x10G (pide su cable u óptica en el catálogo).
- **Juniper**: ficha de la serie MX en inglés, cifra de inspección del SSR, foto del SSR120 base,
  FEC del SSR; no hay lista de precios ni SKU de chasis.
- **Aruba**: EC-XL S3N77A (fuera de venta, sin ópticas de 25G en su matriz), y
  las dos fuentes que eran un cascarón: la URL del PDF ya está probada desde Actions
  (`psnow/downloadDoc/<id>.pdf?id=<id>`, PR #42; no hace falta el Chrome del dueño). Falta
  cambiarla en `fuentes.js` (serie 9000, mismo documento) y traer y contrastar la Rev. 9 del data
  sheet de EdgeConnect antes de cambiar la suya.
- **MikroTik**: si la cifra IPsec es por sentido o la suma (respuesta escrita de soporte), figuras
  traseras que la galería no publica, el CCR2004-16G-2S+PC en la matriz de compatibilidad.
- **Huawei**: ficha de iMaster NCE-Campus, nubes del vCPE, funciones de N1 Advanced frente a
  Foundation.
- **Fortinet**: F3 (FortiGuard en HA activo-pasivo), el resto de F4, F5 (derates), 17 renovaciones
  sin precio en la lista firmada, co-term y heartbeat de HA.

### Bloqueado por acceso (se reporta, no se rodea)

El proxy de egreso de los entornos de Claude Code en la nube rechaza los dominios de los
fabricantes (y `presales.up.railway.app`); los ejecutores de GitHub Actions sí llegan, y por eso
existen los workflows de transporte. Huawei y HPE niegan además el navegador automatizado (Akamai).

## Mejoras propuestas sin decidir

- **El fin de venta también en el Excel que ve el cliente** (propuesta al cerrar el PR #40). En
  pantalla el equipo fuera de venta o con fin de venta anunciado sale en rojo, pero el Excel del BOM
  no lo dice: una propuesta puede llegar al cliente con un equipo cuyo último pedido es dentro de
  dos meses sin una línea que lo avise. Añadir en la hoja «Supuestos» (`matrizSupuestos`, `bom.js`)
  una fila «Ciclo de vida: fin de venta el <fecha> · sucesor <…> (boletín)» cuando el equipo la
  tenga, leída de `FICHA.cicloOpcion` y del `eolAnnounced` del modelo, con su URL. Evita entregar
  un equipo que no se podrá pedir cuando el cliente firme. Cuesta una fila en `bom.js`
  (compartido por los siete) y pasar el ciclo en `meta.supuestos` desde cada página; si se hace
  mal, la hoja «Supuestos» descuadra o el Excel no se descarga, y lo verían `bom-supuestos.test.js`
  y las baterías de Excel. Se decide por el dueño.
- **La fuente de la PQC, enlazada a `fuentes.js` y no escrita a mano** (propuesta al cerrar la
  septuagesimoprimera entrega). Hoy `pqc.fuente` y `pqcNo.fuente` son un texto libre en cada
  `legacyData/` («Boletín de fin de venta de los Cisco ASR1001-X y ASR1002-X»), y nada comprueba
  que ese documento esté en `fuentes.js` ni que el vigía lo mire: en esta entrega salió que dos de
  los tres boletines de los ASR que respaldan la PQC no los vigilaba nadie. La propuesta: que cada
  `pqc`/`pqcNo` cite su fuente por la URL de su entrada en `fuentes.js`, que la prueba exija que
  esa entrada exista, declare al equipo en `modelos` y lleve `pqc` o `pqcNo` en `campos`, y que la
  ficha pinte el documento con su enlace. Evita que una cifra de seguridad cite un documento que ya
  no se vigila (o que cambió sin que nadie lo contraste). Cuesta tocar las fuentes de la PQC de
  seis `legacyData/` (145 equipos, 14 fuentes distintas), `seccionPqc` y el texto de
  la hoja «Supuestos» (`bom.js`, compartido), y la batería `e2e-pqc-supuestos.js`. Si se hace mal,
  la ficha pierde el nombre del documento o el Excel no se descarga; lo verían `pqc.test.js` y esa
  batería. Se decide por el dueño.
- (Hecha en el PR #40: la foto de producto en el Excel. Hecha en la septuagesimoprimera: el «no la trae» documentado, `pqcNo`. Hecha en la sexagesimoctava: la
  versión mínima de la PQC en la hoja «Supuestos».)

## Decisiones del dueño abiertas

- La protección de `main` (aprobada, falta configurarla) y el aviso de Railway (ver arriba).
- Nada más: las dos de la IA y la de las variantes fuera del catálogo se tomaron el 2026-10-27 por
  la opción recomendada (ver *Decisiones* en `PENDIENTES.md`).
