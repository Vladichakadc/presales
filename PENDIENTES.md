# Pendientes

Registro vivo de lo que falta. **Se lee al empezar y se actualiza al terminar cualquier
tarea**, y su contenido se resume al usuario al cerrar cada entrega — esa es la instrucción
permanente que lo justifica (ver `CLAUDE.md`, sección *Pendientes*).

Última revisión: 2026-09-24 (**los precios de Fortinet, solo de la 2026Q3 Mid Price list**. Regla del dueño: «los precios debes tomarlos de 2026Q3 Mid Price list_AMER_FINAL_EFF 090726.xlsx». Auditado cada precio que puede llegar a una línea: 1.818 de licencias y servicios y 54 de hardware casan al céntimo con la lista, ninguno difiere. Lo que no cumplía, corregido: **17 precios de agosto** (renovaciones de 70F, 100F, 200F y 600F) salen ahora sin precio y en borrador, y **FortiConverter** cotizaba a 3 y 5 años un SKU que la lista no tiene. Una invariante nueva lo exige en cada `npm run verificar`. Ver *Cerrado recientemente*.)

Revisión anterior: 2026-09-24 (**los documentos pendientes de Fortinet, traídos y leídos, y las decisiones humanas preparadas**, fusionado con el trabajo paralelo de otra sesión del mismo día. Encargo del dueño: activar «Wait for CI», leer la rama `fuente/fortinet-pendientes` y avanzar con lo que solo puede hacer una persona. **La rama no traía nada**: sus 15 URL se habían adivinado por patrón y dieron 404; buscadas las reales, tres corridas trajeron 12 documentos oficiales. **F6 cerrado**: 100F y 200F con `cps` y sus siete límites (ficha coreana oficial, anclada 12 de 12), y los cuatro modelos sin figura la tienen (QuickStart Guide del 100F y del 200F, System Guide de los chasis) — 58 de 58. **F2 cerrado entero**: un solo SD-WAN Service add-on por equipo, **con SKU y precio de la lista firmada** en 54 de 58 modelos, y la familia contrastada con el Ordering Guide. La primera versión lo dejaba sin precio porque buscó el SKU con el marcador `-DD` y la lista guarda el término resuelto. **SKU exactos de EMS (packs) y FortiSASE (edición y banda)**; su precio no está en el catálogo. **Condición 2 del GO cerrada**: la regla de SSL-VPN de 7.6.3+ está leída, y la de 7.6.0 deja de ser «desconocida» con la lista cerrada de modelos de 2 GB. **Aruba** (otra sesión): el Boost toma el escenario de falla que más túnel pide. **Railway: no se pudo** — el conector no expone el ajuste y su agente no tiene cuota; los pasos exactos y el análisis de los workflows están en `docs/decisiones-del-dueno-2026-09-24.md`, junto con la lista para aprobar el GO, el memo de M4 y el guion del lector de pantalla.)

Revisión anterior: 2026-09-24 (**la batería e2e corre en CI** — la mejora propuesta al cerrar la entrega anterior, aprobada por el dueño. **Medir antes de cambiar corrigió la propuesta**: se dijo que las 219 pausas fijas darían rojos al azar en un ejecutor lento, y con la CPU del navegador a 4x y a 10x la batería vieja pasó entera. Las esperas pasan a `asentar(page)`, que espera a que la página termine lo que empezó, y se quedan por lo que sí se midió: 336 s → 114 s, y un fallo que dice qué quedó pendiente. Por el camino: **el paso de contraste en CI no podía fallar** (`| tee` sin `pipefail`), **Playwright en CI iba sin versión** (la corrida del 24-sep bajó Chromium 153 y su cobertura solo contó el último caso) y el runner reutilizaba `/tmp/e2e-auth` entre corridas. Ver *Cerrado recientemente*.)

Revisión anterior: 2026-09-24 (**cierre de pendientes con lo que el repositorio ya tenía dentro**. Encargo del dueño: cerrar todo lo abierto, buscar la forma de gestionar los bloqueos y desplegar. **Aruba**: el rol activo/respaldo en el Multi-Underlay Builder (R11/M9 — un 4G de respaldo subía el tier: $80.857 frente a $42.697 en el caso medido), y las fases 2 y 3 de su auditoría cerradas en código (A2, A3, A4, A5, A7, M1, M3, M5, M6, M7, M8, B1; M4 declarado, es regla del dueño). **Los datos que faltaban estaban en los PDF oficiales ya versionados** en `public/datasheets/`, leídos en local sin salir a internet: los SKU de Central por serie de gateway (91xx y 92xx tienen los suyos), el tope de 75 clientes de Foundation Base, la tabla AOS-8 del 9106, el throughput de IDS/IPS de cada gateway y la escala de túneles de cada headend (VSG SD-Branch, sep-2026). **Accesibilidad**: auditoría axe y zoom al 200 % automatizados sobre 17 estados de pantalla; encontró 13 fallos reales (contraste de los colores de marca, controles sin nombre, pestañas que desbordaban) y quedan en 0. **Un fallo del propio arnés**: tres baterías e2e nuevas salían en verde con fallos impresos; `resumen()` fija ahora el código de salida. **Bloqueado y declarado**: el ajuste de Railway y la lectura de la rama de transporte de Fortinet los denegó el control de permisos de la sesión (ver *Decisiones que necesitan al dueño*). **Alimentación**: los seis gateways Aruba desde los mismos PDF (Aruba 16/25). 565 unitarios, 16/16 pantallas, 7/7 contrastes y la batería e2e completa (14/14 scripts).)

Revisión anterior: 2026-09-23 (**etapa 7 del dimensionador Fortinet: una sola verdad para recomendación, BOM y cotización** — el informe de auditoría en vivo del 23-sep y su prompt maestro. **Resultado: GO CONDICIONADO**, primero en la rama `claude/laughing-babbage-pvpxyi` y desplegado ese mismo día (`f6f1952`, Railway `dcb662d9` en SUCCESS). Los cuatro P0 eran un solo defecto (varias verdades en la misma página) y los cierra un motor único, `fortinet-motor.js`, que es el mismo archivo en el navegador y en `POST /api/v1/fortinet/evaluations`. **T01–T30: 30/30 reportadas y aprobadas, cinco con un límite declarado.** Por el camino salieron cuatro defectos nuevos: N01 (error JS al abrir un enlace), N02 (108 precios de licencias con la lista de agosto), N03 (60 textos visibles sin tilde, entre ellos «termino 3 anos» en la nota que llega al Excel) y N04 (el bloqueo de SSL-VPN no pintaba su fuente). Entrega completa en `docs/auditoria-fortinet-2026-09-23/`. **542 unitarios, 16/16 pantallas, 6/6 contrastes y 11/11 baterías e2e.**)

Revisión anterior: 2026-09-23 (**puntos 3 y 4 del orden de automatizaciones, activados**. (3)
`self-learning` deja de estar muda: `.claude/hooks/aprendizaje.sh` escribe
`.claude/learning/runs.jsonl`, que **no existía** — tres skills instaladas dependían de un
archivo que nadie escribía, el defecto de `CISCO_EOL_MODELS`. **El diseño salió de medir el
contrato**: con un comando que sale con código 3, `PostToolUse` NO se dispara, así que un
registro basado solo en él habría reportado 100 % de éxito siempre; ahora `PreToolUse` apunta,
`PostToolUse` cierra y el hook de arranque **salda como fallidas** las que quedaron abiertas.
(4) `.claude/hooks/pre-push.sh` avisa antes de un `git push` cuando la puerta no ha pasado
desde el último cambio — responde `ask` con el motivo, **no bloquea**, porque un bloqueo rígido
se rodea y entonces la advertencia se pierde. **Un fallo encontrado probando**: la primera
versión registró un `npm run verificar` que solo estaba *mencionado* dentro de una cadena — un
verde falso delante de un push que despliega. Lo arregla `lib-comando.js`, compartido por los
dos hooks. Quedan sin hacer los puntos 1 (`npm run puerta`), 2 (allowlist), 5
(`revisor-catalogo`) y 6 (pendiente 33, decisión del dueño).)

Revisión anterior: 2026-09-23 (**las dos mejoras propuestas, ejecutadas, y el repo arranca solo
en la web**. (1) **El Comparador dice cuántas casillas son un hueco del catálogo**: medido en
pantalla, un 7750 SR-7s frente a un FortiGate 120G deja **9 de 19 filas sin dato contra 3**, así
que leer la tabla de arriba abajo favorece al que más publica y no al mejor. Los `noAplica` se
cuentan aparte, porque ahí el concepto no existe para esa clase de equipo. (2) **El hook de
arranque avisa cuando `npm install` reescribe el lock**, que es el fallo que tumbó el despliegue
del 1 de septiembre y del que solo se entera `npm ci` en CI, cuando ya empujaste — avisa y
sigue, comprobado saboteando. (3) **`.claude/hooks/session-start.sh`**, registrado en
`.claude/settings.json`: instala dependencias y comprueba Playwright y Chromium donde
`scripts/ayuda/chromium.js` los busca; para que exista hubo que un-ignorar dos rutas del
`.gitignore` respetando su motivo original, que sigue valiendo para `settings.local.json`.
492 unitarios, 16/16 pantallas.)

Revisión anterior: 2026-09-23 (**la Calculadora de Throughput del portal gana el perfil de
inspección TLS** — la mejora propuesta al cerrar la entrega anterior, aplicada a petición del
dueño. Esa pantalla ofrecía cinco perfiles y ninguno era el de descifrado HTTPS, así que
respondía con la cifra de **Threat Protection**: el mismo defecto P0 que el dimensionador de
Fortinet arrastró hasta el 2026-09-22, pero en la pantalla de portada. No se podía cerrar
antes porque el catálogo solo traía `ssl` de 9 modelos. **Medido en la propia pantalla, se
equivocaba en las dos direcciones**: a 175 Mbps proponía un 30G que solo hace 400 Mbps de TLS
(corto) y a 500 Mbps proponía un 70G donde el 50G cumple (sobredimensionado). **Y entra con
él una línea de cobertura encima de la lista, para los seis perfiles**, porque el riesgo
declarado al proponer la mejora era real: con inspección TLS compite 1 de 7 fabricantes, y
una lista corta sin explicación se lee como «no hay equipo» en vez de «no hay dato». 489 unitarios, 16/16 pantallas, **6/6 contrastes** —uno nuevo, `calculadora-ssl`— y 10/10
baterías e2e. **El caso de contraste se endureció saboteando**: su primera versión pasaba en
verde con el derate dentro.)

Revisión anterior: 2026-09-23 (**los límites del Product Matrix dejan de declararse y pasan a
comprobarse** — encargo del dueño: ejecutar los pendientes con el máximo esfuerzo y aplicar la
mejora propuesta. **F1 cerrado**: la inspección SSL pasa de 9 a **51 de 58 modelos**, leída del
PDF que ya estaba en la rama de transporte `fuente/fortinet-product-matrix` —no se descargó
nada: `fortinet.com` y `docs.fortinet.com` siguen denegados por política de egreso, medido otra
vez hoy—, con **doble anclaje 27/27 sin un solo rechazo** contra `sess` y `cps`. **F4 cerrado
en su mayor parte**: entran `tunGw`, `tunCli`, `sslVpnUsers`, `sslVpn`, `policies` y `vdomMax`,
y los tres límites que la pantalla declaraba «sin comprobar» son ahora **ejes duros**; lo que
sigue fuera son rutas BGP/OSPF, vecinos y VRF, que ese documento no publica. **F7 cerrado**:
las excepciones TLS como fracción declarada, con 0 % por defecto. **Un defecto de la etapa 5
corregido por el camino**: el acceso remoto cargaba SIEMPRE el eje IPsec porque la pantalla no
preguntaba si termina en IPsec dial-up o en SSL-VPN, que son dos motores distintos con dos
topes distintos — 400 remotos dan un 60F por uno y un 120G por el otro. Y un contador que
habría contado cualquier cosa: los apartados se agrupan por el eje que falta, no todos bajo el
rótulo de SSL. 484 unitarios, 16/16 pantallas, **5/5 contrastes sin discrepancias** —uno nuevo,
comprobado saboteando— y 10/10 baterías e2e.)

Revisión anterior: 2026-09-22 (**el formulario del dimensionador Fortinet, reconstruido sobre lo
que de verdad dimensiona** — encargo del dueño: revisarlo como arquitecto senior, dejar solo
las variables de SD-WAN y NGFW, retirar el tipo de transacción «que no es válido técnicamente»
y quitar lo que no aporta. **Tres bajas**: `tipoTx` (decisión comercial disfrazada de entrada
técnica; se comprobó que no alimentaba el motor), `modoSeg` (dos controles para una pregunta:
el código ya tenía que forzar `agg` al elegir `hub`, y dejaba abierta la combinación «hub en
enlace único» con la que un concentrador se dimensiona de menos) y `perUser` (segunda fuente
de verdad del caudal desde que existe el builder, con un aviso en pantalla que decía que no te
fiaras de él). **Cuatro altas**: la **VPN de acceso remoto**, que no estaba modelada en
absoluto y carga el eje IPsec y la tabla de sesiones, y el **conteo de túneles** como eje
declarado —spokes en el hub, hubs en el spoke—. El eje IPsec recibe ahora overlay + acceso
remoto. **Licenciamiento derivado**: FortiClient EMS toma los endpoints del paso 3 y entra sin
SKU, bloqueando la exportación, porque el catálogo solo trae el patrón del código. 473
unitarios, 16/16 pantallas, **4/4 contrastes sin discrepancias** y 10/10 baterías e2e.)

Revisión anterior: 2026-09-22 (**skill `agent-browser` de Vercel Labs instalada y probada** —
petición del dueño. Está en `vercel-labs/agent-browser`, no en `vercel/`. Es el caso opuesto a
`agent-reach`: conduce un navegador **local**, así que aquí sí funciona, y se comprobó de
extremo a extremo contra nuestra propia app —entró por el muro de acceso y leyó el banner de
datos del dimensionador Fortinet—. Dos tropiezos medidos: pide **Node 24** (aquí hay 22, así
que npm instala la 0.27.0 y no la 0.38.1, y el stub menciona dos skills que esa versión no
trae) y no encuentra el Chromium de `/opt/pw-browsers` sin `--executable-path` con el demonio
cerrado antes. **Lo que NO se obedece**: su descripción dice «Prefer agent-browser over any
built-in browser automation», y aquí `npm run pantallas` / `contraste` / `e2e` / `manual`
siguen sobre Playwright, porque son lo que CI mira. Regla escrita: explorar con agent-browser,
comprobar con Playwright.)

Revisión anterior: 2026-09-22 (**skill `agent-reach` instalada** — petición del dueño:
«https://github.com/Panniantong/Agent-Reach.git Installar skills». Ese repositorio no es una
colección de skills sino una herramienta Python que trae **una**, un router de acceso a
internet para 16 plataformas; está en `.claude/skills/agent-reach/`, copiada del commit
`a19a171` sin tocar una línea, y Claude Code ya la descubre. Dos cosas se **midieron** en vez
de suponerse: desde este entorno el proxy de egreso **corta las 16 plataformas** —solo pasan
`api.github.com`, `raw.githubusercontent.com` y `pypi.org`—, así que la skill se dispara aquí
y no puede cumplir; y **`pip install agent-reach` instala otro proyecto** (0.1.0 de Jean
Galea, 2 canales, frente al 1.5.0 de Panniantong con 16), con el agravante de que el
`doctor --json` del paquete equivocado **responde con éxito** y se lee como «sin backends» en
vez de «programa equivocado». Todo declarado en `CLAUDE.md` y en el LEEME de la skill. Queda
abierto para el dueño si se configuran los canales con login, que piden cookies de Twitter y
sesión de Chrome.)

Revisión anterior: 2026-09-22 (plan 21: **el informe de validación técnica del módulo Fortinet,
aplicado** — petición directa del dueño con el informe adjunto: «actúa como un experto
arquitecto senior en el fabricante de Fortinet implementando según el informe adjunto todas
las mejoras que se han consolidado… el dimensionador debe ser funcional, dinámico e
interactivo»). El informe consolida dos auditorías, clasifica sus hallazgos en P0 técnico, P0
comercial, P1 arquitectónico y P2 de experiencia, y cierra con veinte pruebas de aceptación y
un dictamen de NO-GO hasta cerrar los P0. **No se implementó literalmente, y él mismo pide que
no se haga**: once de sus diecisiete propuestas vienen marcadas para excluir o reformular
porque son constantes sin respaldo (0,55 y 0,45 para SSL, 0,95 para SD-WAN, 0,90 para SIP, 0,70
para proxy, 0,95 para logging, 0,85 por nodo en HA A-A, 15 % por VDOM, pisos de serie para
SD-WAN y BGP) — ninguna de ellas se aplicó. Lo entregado: **(1) P0 técnico** — la inspección
SSL deja de estimarse como `tp × 0,65` y pasa a ser un eje con la cifra oficial por modelo
(9 de 58; el cociente ssl/tp va de 0,52 a 1,18, así que el factor único se equivocaba en las
dos direcciones y en el 40F prometía 390 Mbps donde el equipo da 310); los 49 sin cifra se
**apartan con su motivo** y piden PoC, nunca se sustituyen por otra capa. **(2) Motor multieje**
en `public/js/fortinet-reglas.js` (UMD, patrón de `aruba-reglas.js`): ocho ejes independientes
con tres estados y dos durezas, cuello de botella explicado, y techo de utilización separado
del margen de crecimiento (por defecto 100 %, para no mover en silencio los escenarios ya
compartidos). La reformulación es equivalente para lo que no toca y se **demostró**: el
contraste `fortinet`, con línea base de antes del cambio, pasa sus 8 escenarios y sus 6
migraciones v1 sin discrepancias. **(3) P0 comercial** — FortiCare Premium ya no se cobra dos
veces (los tres bundles lo incluyen y el BOM añadía además una línea de soporte *siempre*),
FortiConverter no se duplica con Enterprise, el SKU resuelve el término real (`-36` en vez del
marcador `DD`, que no es pedible), el bundle mínimo se deriva de las funciones y **bloquea** lo
que está por debajo, multi-WAN ya no insinúa Enterprise y los servicios avanzados de SD-WAN
derivan su línea con `sku: null` declarado. **(4) Puerta de exportación real**: deshabilita
Excel, copiar y enviar al cotizador ante un bloqueo P0, un SKU inexacto o una lista de precios
vencida, con override de motivo obligatorio que viaja estampado en el documento. **(5) P2 de
experiencia**: banner de estado de datos con cobertura contada sobre el catálogo, pestañas con
los nombres de Aruba, barra de acciones en una fila, cuatro pasos plegables con chip de
validación, resumen fijo compacto con alternativas de un clic, panel de utilización por eje y
gráfico con métrica elegible y filtro de ciclo de vida. Cobertura: **31 unitarios**
(AT-01…AT-20), **38 afirmaciones e2e**, un **contraste nuevo** comprobado saboteando —bajar el
eje SSL a `blanda` da 6 discrepancias y a 4 Gbps pasa de «sin candidato» a recomendar un 200G—,
454 unitarios y 16/16 pantallas en verde. Tres hallazgos que salieron del camino y se
arreglaron: el rótulo `<b>Threat Protection</b>` salía literal en la ficha (ficha.js escapa la
columna izquierda), el chip del paso 4 no se refrescaba al cambiar el bundle, y el caso de
contraste `cotizador-bom` seleccionaba la pestaña por su **rótulo visible** y se rompió con el
renombrado — ahora usa `data-tab`, que es el contrato.)

Revisión previa: 2026-09-18 (plan 20: **la foto oficial viaja con la propuesta
exportada** — mejora propuesta al cerrar el plan 19 y aprobada por el dueño («Avanza…
y si encuentras alguna mejora por el camino ejecútala»). El BOM exportado deja de ser
solo texto y tabla: el Excel lleva ahora una segunda hoja, «Fotos del equipo», con las
vistas frontal y trasera del equipo cotizado a su resolución natural y el mismo pie de
tamaño y fuente documental que la ficha en pantalla (regla de procedencia). Decisiones
de arquitectura: (1) el escritor del Excel MIGRA de SheetJS a **ExcelJS** — la edición
comunitaria de SheetJS no incrusta imágenes — servido perezoso desde node_modules como
`/vendor/exceljs.js` (mismo patrón que xlsx.js; la LECTURA de xlsx en procedencia.js
sigue con SheetJS); (2) el contenido de la hoja BOM se extrae a un núcleo PURO,
`BOM.matrizExcel(filas, meta)` → { aoa, cols, filaCabecera, filaTotal }: una sola
fuente que el escritor vierte y los unitarios afirman sin navegador ni dobles; (3) los
webp oficiales se re-codifican a PNG sin pérdida vía canvas (Excel no admite webp) y se
incrustan a resolución natural, mostrados a un máximo de 860 px; (4) regla del piloto
intacta: solo Aruba emite `meta.fotos` (desde `FICHA_CFG.vistas`), y un modelo sin foto
declarada exporta SIN hoja de fotos — el hueco honesto también viaja. Mejoras
encontradas y ejecutadas en el camino: la conversión a PDF reveló que la foto se
cortaba en el margen al imprimir, así que AMBAS hojas salen apaisadas y ajustadas al
ancho (`fitToWidth`), la hoja BOM gana cabecera fija al desplazarse, título/cabecera/
total en negrita con la tinta de la página, dinero con separador de miles conservando
tipo numérico, y la columna «Precio unit.» pasa de 14 a 20 caracteres (el encabezado y
la etiqueta «Total de referencia» quedaban cortados). Cobertura: el unitario del
export se reescribe sobre el núcleo puro (+1 afirmación de índices); `e2e-ux.js` gana
9 afirmaciones — el Excel descargado incrusta `xl/media/image1.png` y `image2.png`,
lleva la hoja con el modelo cotizado y su procedencia, la hoja BOM declara el puntero,
y el 7005 sin foto exporta sin hoja ni imagen (SheetJS relee el fichero como prueba de
interop). Validado además abriéndolo con LibreOffice → PDF: las dos caras se ven
completas. 419 unitarios y 9/9 e2e en verde.)

Revisión de antes: 2026-09-18 (plan 19: **lupa en las fotos de los equipos Aruba** —
petición directa del dueño: «incluir una Lupa en las imágenes de los routers de Aruba
para que al darle click en la lupa traiga al frente la foto, ya sea frontal o trasera,
en la máxima calidad de la imagen». La tarjeta sirve la foto a 150 px de alto; la lupa
la abre al frente a su RESOLUCIÓN NATURAL — los webp del repo son los originales
extraídos de los documentos oficiales de HPE (~1200 px de ancho), así que la máxima
calidad disponible es servir el mismo archivo sin reescalado. Implementación en
`ficha.js`: (1) botón-lupa en la esquina de la tarjeta gráfica (26×26, borde --rule,
acento --red al pasar — el lenguaje visual de la página) y clic sobre la propia foto
(cursor zoom-in); (2) lightbox perezoso de una sola instancia (`#fichaLupa`,
role="dialog" aria-modal): guarda DATOS, no referencias DOM, porque `pintar()`
reconstruye la tarjeta en cada render y una referencia guardada quedaría huérfana;
(3) cabecera con el modelo, las pestañas Frontal/Trasera cuando hay ambas caras y el
cierre por ×, fondo o Escape; ←/→ conmutan las caras sin salir del diálogo; (4) el pie
conserva tamaño y fuente documental (regla de procedencia); (5) accesibilidad: el foco
entra al botón de cierre y VUELVE al botón de la lupa al cerrar, y el scroll del fondo
queda bloqueado mientras está abierta. Solo Aruba declara «vistas» (regla del piloto):
otro fabricante que las declare hereda la lupa sin tocar nada. Cobertura: 8
afirmaciones e2e nuevas en `e2e-ux.js` (abre al frente; sirve el archivo original;
resolución natural ≥ 1000 px; pie con procedencia; conmuta a trasera dentro del
diálogo; ← devuelve la frontal; Esc cierra; el foco vuelve a la lupa). Nota de
convergencia: este trabajo se hizo en paralelo con otra sesión que entregó el plan 18
(auditoría fase 1 + desbloqueo del despliegue); se reintegró sobre `f4f6892` sin
conflicto de código (solo este registro) y se renumeró como plan 19.)

Revisión anterior: 2026-09-17 (plan 18: **fase 1 de la auditoría técnica del
dimensionador Aruba** — pedida por el dueño («avanza con la fase 1») sobre el documento
«Auditoría técnica — Dimensionador Aruba»
(<https://claude.ai/code/artifact/73f4cc17-eb40-494c-9127-ac3eea6849a0>). Cinco
críticos que cambiaban equipo o precio (C1 tiers Foundation inexistentes, C2 licencias
9240 AOS 8 vs AOS 10, C3 serie 9000 a 32 APs, C4 Boost ~5x, C5 7005/7008/7210/7220
cotizables) más el A1 (DTD en EC-XS), y el **bloqueo de despliegue**: 8 despliegues
seguidos en FAILED desde `b4e8c4e` porque `package-lock.json` resolvía 4 paquetes
(pdf-parse y dependencias) contra `npm.mirrors.msh.team`, inalcanzable desde Railway.
Producción seguía en `00ccc4b` (16-sep) y no tenía los planes 13 a 17. Ver *Cerrado
recientemente*. 404 unitarios y 9/9 e2e en verde; 16/16 pantallas.)
Revisión anterior: 2026-09-17 (plan 17: **la traza viaja con la propuesta exportada** —
mejora propuesta al cerrar el plan 16 y aprobada por el dueño («Si»). La cuenta del
dimensionado vivía solo en pantalla; quien recibía la lista de materiales no podía
auditar de dónde sale el requerimiento. Implementación: (1) el núcleo de cada traza
se extrae PLANO (sin intro ni <b>) — `cuentaMotorPlana` / `cuentaProcesoPlana` — y
las envolturas HTML de la ficha (`trazaMotorHtml` / `trazaProcesoHtml`) se
reescriben sobre él: una sola fuente para las dos superficies, imposible que
deriven; (2) la exportación del BOM abre su «REVISIÓN DEL DISEÑO» con la línea
`Dimensionado (motor de ingeniería): 200 Mbps físicos ÷ IMIX 0,70 × 1,15 FEC × 1,00
seguridad × 1,30 margen ≈ 428 Mbps de diseño.` — para gateways, `Dimensionado
(proceso, fórmula histórica): …` — que viaja al textarea, al copiado como texto y
al Excel. Cobertura: 2 afirmaciones e2e nuevas (la traza del motor en el BOM del
EC-10150 en desbordamiento; la traza de proceso en el BOM del Gateway 9114); 392
unitarios y 8/8 e2e en verde.)

Revisión anterior: 2026-09-17 (plan 16: **la traza aritmética en TODOS los veredictos** —
continuación del plan 15, aprobada por el dueño («Si»). La traza deja de ser
exclusiva del desbordamiento: (1) los dos textos se extraen a helpers compartidos a
nivel de módulo — `trazaMotorHtml(D, wanNeed)` (la cuenta del motor de ingeniería,
con los factores vivos de `D.ing.traza`) y `trazaProcesoHtml(D)` (la fórmula
histórica de proceso de los gateways: máx(enlaces, usuarios × Mbps/usuario) × margen
× penalización de función, desde los DATOS del escenario); (2) el veredicto de
desbordamiento delega en el mismo helper — una sola fuente para el texto; (3) el
camino feliz la muestra: la ficha de todo EdgeConnect recomendado con enlaces
declarados lleva la cuenta («200 Mbps físicos ÷ IMIX 0,70 × 1,15 FEC × 1,00
seguridad × 1,30 margen ≈ 428 Mbps de diseño»; sin enlaces se conserva la prosa, la
fórmula histórica no tiene traza del motor que mostrar) y la de todo gateway lleva la
cuenta de proceso («10,000 Mbps de enlaces × 1,30 margen = 13,000 Mbps»). El e2e
destapó un comportamiento preexistente que ahora queda DOCUMENTADO en el propio test:
`#pickModel` es catálogo completo por diseño (selección manual deliberada, p. ej.
cotizar el EC-10150 en desbordamiento), así que el pick SOBREVIVE al cambio de
familia — la §2 que elige un gateway debe restaurarlo antes de la §3. Cobertura: 3
afirmaciones e2e nuevas (traza EC en el camino feliz, traza de proceso en la ficha
del gateway, restauración documentada del pick); 392 unitarios y 8/8 e2e en verde.)

Revisión anterior: 2026-09-17 (plan 15: **traza aritmética viva en el veredicto de
desbordamiento** — mejora propuesta al cerrar el plan 14 y aprobada por el dueño
(«Si»). CONTEXTO: un prompt externo diagnosticó el veredicto de desbordamiento como
«bug de filtrado por `tipo_despliegue`» — campo que NUNCA existió (0 coincidencias
en el repo y en TODA la historia git); la clasificación real es `fam`/`rol` y el
síntoma descrito («Gateway campus recomienda EC-10150») es imposible por
construcción (`coincideFiltro`). El análisis quedó entregado: con 2×4000 Mbps el
veredicto ES el comportamiento diseñado (≈23 Gbps de diseño > 12 Gbps publicados).
La lección: un lector rápido —humano o IA— puede leer «ningún appliance lo cubre»
como un fallo. Implementación: (1) el motor de ingeniería devuelve ahora `traza`
con los factores VIVOS del cálculo (`bwFisico, factorIMIX, overheadFEC,
factorSeguridad, factorHeadroom`) — la fuente del texto es el propio cálculo, no
una foto que pueda derivar; (2) el veredicto pinta la cuenta factor a factor:
«10,000 Mbps físicos ÷ IMIX 0,70 × 1,15 FEC × 1,00 seguridad × 1,30 margen ≈
21,358 Mbps de diseño» (con la penalización de función cuando aplica, y solo con
enlaces declarados — sin caudal físico el requerimiento sale de la fórmula
histórica y la traza no corresponde). Cobertura: test unitario nuevo en el motor
(la traza reconstruye el resultado + el escenario 2×4000 del reporte + el mapeo
VOIP/LTE) y 3 afirmaciones e2e nuevas en el desbordamiento; 392 unitarios y 8/8 e2e
en verde.)

Revisión anterior: 2026-09-17 (plan 14: **interconexión EdgeHA en la lista de
materiales — pendiente #7** — mejora propuesta y aprobada por el dueño en la misma
frase («avanza con la mejora propuesta y el pendiente 7»: el #7 ERA esa mejora). El
enlace directo entre los dos chasis del par necesita 1 puerto por chasis y ninguna
propuesta puede salir sin él. Implementado con el patrón de siempre, nunca una óptica
inventada: (1) PREDICADO ÚNICO `parEdgeHA()` compartido por asistente de cableado,
chooser y BOM (EdgeConnect + HA marcado + ≥2 enlaces activos); (2) regla de
ingeniería DECLARADA de la casa para la velocidad — `velocidadEdgeHA()`: la menor
velocidad de óptica compatible con el modelo que cubre el AGREGADO WAN del sitio (el
VSG no la fija; por la interconexión cruza el tráfico de los underlays que no
aterrizan en el activo — dimensionarla al agregado deja la asignación libre y el
failover sin cuello de botella); (3) fila «Interconexión EdgeHA» en el chooser — se
muestra AUNQUE no haya ópticas WAN que elegir (dos enlaces RJ45 en par HA siguen
necesitando la interconexión), la elección viaja en `sfpPickData['EdgeHA']` con la
misma mecánica de los enlaces WAN; (4) línea del BOM: ×2 cotizadas si hay elección,
PENDIENTE DE SELECCIÓN sin precio si hay varias compatibles, y declarada sin SKU si
el agregado supera las ópticas del catálogo del modelo (salida honesta: cobre directo
o confirmar con HPE); (5) la fila de interconexión del asistente de cableado refleja
el estado real (elegida / por elegir / no cubierta). El trabajo destapó UN DEFECTO
PREEXISTENTE: el chooser se pintaba al principio del render leyendo `#pickModel` ANTES
de que el combo se repoblará — quedaba un render atrás (invisible hasta que la fila
EdgeHA lo hizo notar). Corregido: el chooser se pinta al final de `poblarPickModel`,
con el pick del render actual. Cobertura: 9 comprobaciones e2e nuevas (fila visible,
velocidad desde los datos, PENDIENTE → elegida → cotizada, chooser se oculta sin HA,
elección que sobrevive al ciclo HA off→on); 391 unitarios y 8/8 e2e en verde.)

Revisión anterior: 2026-09-17 (plan 13: **vigencia extendida a los gateways de campus +
asistente de cableado EdgeHA + dedup de «Interfaces» en la ficha** — petición del
dueño: «ejecuta el primer pendiente y la mejora propuesta… y valida en las
características del equipo, veo información redundante, por ejemplo interfaces».
MAPA HONESTO de la petición: el primer pendiente LITERAL de la tabla era una acción
del dueño (reenviar las secciones 2+ del reporte truncado del plan 11 — no la puede
hacer la casa), así que se ejecutó el primer pendiente ACCIONABLE: extender
`npm run vigencia` más allá de EdgeConnect. (1) VIGENCIA MULTI-FUENTE: el script pasa
de una guía a un array FUENTES — QuickSpecs EdgeConnect (a50004289enw) + guía de
pedidos PSNow de la serie 9000 (a00067607enw: el documento entero ES la guía, sin
sección «Configuration Information»; ancla «Ordering guide» hasta el final) +
QuickSpecs 9100 (a50006999enw) + QuickSpecs 9200 (a50004272enw)— con la
correspondencia por prefijo de modelo (Gateway 90xx/91xx/92xx) y la regla dura de la
casa: un modelo con SKU que no case con NINGUNA fuente rompe el cruce con código 2,
nunca verde silencioso. Hoy: 15/15 ordenables en 4 guías (9 EC + 6 gateways), cero
alarmas; EC-V y las series legacy 7000/7200 quedan fuera declaradas (sin SKU que
buscar). El `--json` ya existía; se entrega `vigencia-ci.patch` (el PAT no tiene scope
workflow) con el workflow que lo corre en push/PR que toquen guías o catálogo, los
lunes 06:17 UTC y a mano, y publica el JSON como artefacto. (2) MEJORA PROPUESTA —
ASISTENTE DE CABLEADO EdgeHA: con HA marcado y ≥2 enlaces activos, la ficha pinta la
sección «Cableado del par EdgeHA»: cada enlace a SU chasis (WAN 1→Nodo A, WAN 2→Nodo
B, alterno si hay más — declarado como extensión del patrón, no figura oficial), la
interconexión EdgeHA directa entre chasis (sin switch; el VSG no fija SKU y no se
inventa) y la óptica de cada nodo según el medio declarado. Destapó una INCONSISTENCIA
REAL: el BOM y el chooser cotizaban las ópticas ×2 unidades con HA — el patrón de HUB
(«Each WAN transport is brought into each appliance») aplicado a una sucursal. Con
EdgeHA cada enlace aterriza en UN chasis: corregido a 1 por enlace (solo fam `ec`;
los gateways conservan el ×unidades — su cableado HA no está validado contra fuente).
(3) REDUNDANCIA VALIDADA Y CORREGIDA: «Interfaces» se pintaba DOS veces con la misma
cadena `m.ifaces` — en «Características del equipo» y en «Configuración de puertos»
(rama de texto libre de FICHA.seccionPuertos). Queda una sola vez, en su sección
dedicada y con su nota de procedencia. El resto de la ficha se auditó sección a
sección: «Alimentación» ya tenía su regla anti-dup (watts se salta si psu.watts lo
da) y «Boost recomendado» (recomendación) no duplica la escalera (capacidad).
Cobertura: 2 unitarias nuevas de vigencia (correspondencia modelo-guía + los seis
gateways ordenables) y 6 comprobaciones e2e nuevas (sección EdgeHA presente/ausente
según HA, asignación A/B, interconexión, «Interfaces» exactamente una); 391 unitarios
y 8/8 e2e en verde.)

Revisión anterior: 2026-09-16 (plan 12: **HA 1+1 pre-marcado por capacidad del sitio +
validación de la premisa «cada WAN a un equipo del par»** — petición del dueño: con 2
enlaces de ≥5 Gbps, «cada WAN debería ir conectado a un equipo del HA y por defecto
debería habilitarse el HA con el licenciamiento necesario». Validación contra las
fuentes oficiales EN EL REPO: la intuición de cableado ES el diseño oficial —EdgeHA,
VSG SD-Branch: dos EdgeConnect, «each connected with a single WAN link to two
different underlay networks», sin switches WAN, con el enlace EdgeHA llevando los
túneles de cada underlay a ambos—; pero la inferencia de dimensionado NO: el VRRP
manda todo el tráfico al activo y el standby solo toma el relevo en fallo («traffic is
sent there only during an outage», mismo VSG — ECMP hay que evitarlo), así que cada
chasis del par se dimensiona al AGREGADO completo. HA suma disponibilidad, no caudal:
el motor NO divide el requerimiento entre los dos. Implementado: regla del dueño
(≥2 enlaces activos, todos ≥5 Gbps — decisión de negocio declarada, SIN FUENTE
oficial) que PRE-MARCA HA de flanco (no pelea con quien lo desmarca a mano: queda
registrado y la revisión del diseño lo declara como aviso), hint #haAutoHint que
declara la regla y su porqué, y dos reglas nuevas en REGLAS_DISENO (ok con cita VSG
cuando el par queda; aviso cuando el sitio de ≥10 Gbps va sin HA por decisión manual).
El licenciamiento ya seguía solo: 2 unidades + 1× suscripción estándar + 1× SKU HA
E-STU del mismo tier (LICENSES_HA, invariante verificada). El bloque de
desbordamiento del plan 11 gana la aclaración explícita: «Lo que NO resuelve el
desbordamiento: el par HA». La auditoría de puertos se queda conservadora a propósito
(cuenta todos los enlaces contra el chasis): es el patrón de hub del VSG («Each WAN
transport is brought into each appliance») y el único que resiste un failover con
circuitos dual-home. Cobertura: 8 comprobaciones e2e nuevas (auto-marcado, hint,
BOM del par con SKU HA, desmarcado manual respetado + aviso, no-disparo en escenario
pequeño); 389 unitarios y 8/8 e2e en verde.)

Revisión anterior: 2026-09-16 (plan 11: **desbordamiento de la línea EdgeConnect guiado
por el techo oficial + la trampa del cero falso en el margen** — reporte del dueño:
5000 Mbps de Internet + 5000 de MPLS → «No se recomienda ningún equipo». Diagnóstico
con evidencia oficial, contra lo que sugería el snippet que acompañaba el reporte: el
catálogo NO estaba mal — reverificado cifra a cifra contra las QuickSpecs oficiales
a50004289enw V18 (p. 30 y fichas por modelo: EC-10108 «2-2000 Mbps» con SKU S0E23A,
EC-10150 «Up to 12 Gbps» con S2N65A, EC-XL S0B67A fuera de venta desde 2026-03-31).
Los datos propuestos (SKU «S2D93A» para el 10108, 20 Gbps para el 10150, «JZ888A» como
chasis EC-XL —es el kit de montaje—, un «EC-V-10G» que no existe) NO entran: chocan
con la fuente oficial y la casa nunca corrige contra ella. La causa real es
aritmética: la fórmula del motor (÷IMIX 0,70 × FEC 1,15 × margen 1,30) lleva 10.000
Mbps físicos a 21.358 Mbps de diseño, por encima de los 12 Gbps que HPE publica para
su modelo más capaz. La corrección NO es recomendar igualmente —sería afirmar una
capacidad que la fuente no publica—: el veredicto vacío se convierte en respuesta de
arquitectura, que declara el techo con su cita y ofrece las vías que la documentación
sí sostiene (EC-V por licencia/vCPU con SR-IOV, reparto del fabric entre appliances,
revisión de hipótesis con la cifra mínima calculada de los DATOS, y la selección
deliberada del EC-10150 — sigue en el combo y cotiza con la revisión del diseño en
rojo). Y el e2e pescó un defecto real más: `headroom_pct || 20` en el motor se tragaba
el «margen 0» del slider y aplicaba un 20 % fantasma — la página declaraba 0 % y
calculaba 20 (con todo al mínimo daba 12,6 Gbps en vez de los 10,5 que el propio
veredicto prometía). Corregido con `?? 20`: el default es solo para el parámetro
ausente. Cobertura: guardia de datos `aruba-techo-ec` (fija las cifras oficiales y deja
constancia de la refutación del snippet), prueba del cero falso en `motor-ingenieria`,
`e2e-desbordamiento-ec` nuevo (14 comprobaciones); 389 unitarios en verde, e2e 8/8. El
mensaje del reporte llegó TRUNCADO tras su sección 1: si traía más secciones, se piden.)

Revisión anterior: 2026-09-16 (plan 10: **vigilancia de vigencia por QuickSpecs +
congelado declarado de la política de ciclo de vida** — el dueño aceptó la mejora
propuesta y los pendientes «—» del plan 9. Nace `npm run vigencia`: cruza el `hwSku`
de cada EdgeConnect contra la sección de pedido de las QuickSpecs oficiales EN EL
REPO (sin salir a internet) y ALARMA con código 1 cuando un modelo SIN boletín
desaparece de la guía — la señal temprana y oficial de fin de venta, la misma que
desmontó el falso EOL del EC-XS. Hoy: 9/9 ordenables, EC-XL nota (la V18 aún lista
la variante NoLoc pese al boletín vencido), cero alarmas. No escribe en el catálogo:
la marca sigue entrando solo por documento del fabricante. Alcance declarado: solo
fam `ec` con SKU (gateways de campus y EC-V fuera, con motivo). Además la política
de ciclo de vida entra en DATASHEETS para congelarla como las demás — los bytes
quedan bloqueados por el egreso (fila nueva en *Bloqueado por acceso*); la pestaña
de fuentes ya la enlaza oficial mientras tanto. Cobertura: 6 tests nuevos, 382 en
verde; e2e 8/8).

Revisión anterior: 2026-09-16 (plan 9: **EC-XS verificado VIGENTE en fuentes oficiales
+ resaltado de fin de venta consciente de la fecha** — petición directa del dueño:
«valida en las fuentes oficiales si el EC-XS sigue vigente o entró en EOL y resalta
si hay equipos con esta condición». Veredicto con cuatro fuentes oficiales: las
QuickSpecs a50004289enw V18 (06-jul-2026, en el repo) lo listan ORDENABLE
(JM962A#AC3 y la NAL S3N70A), la versión online actual de hpe.com igual, la
garantía oficial a00143138enw lo declara «Active» sin fecha de fin de venta y la
política de ciclo de vida solo menciona el EC-XS de 4 GB (EoS 2016, hardware
antiguo). La señal de los agregadores (EoS 31-ene-2026) no existe en ningún canal
oficial y queda contradicha por las QuickSpecs publicadas cinco meses después: NO
se marca — la casa nunca marca por terceros. EC-L-H (JZ878A): mismo veredicto.
Resaltado, integrado con la regla única del pendiente 34 que el dueño subió mientras
tanto (semáforo en `FICHA.cicloHtml`, tercer estado sin verde por omisión): el EC-XL
sale ROJO «Fuera de venta» con su fecha y ahora también con el fin de soporte del
boletín (2033-03-31) en el detalle; el combo lo nombra «fin de venta vencido»
(marca de ficha.js); el EC-XS queda en el tercer estado, sin marca de fin de venta.
Guardas: test de datos que fija el veredicto del EC-XS y e2e-ciclo-vida.js nuevo).

Revisión anterior: 2026-09-16 (plan 8: **características expandibles DENTRO de la tarjeta
+ #41 parcial** — petición directa del dueño: el detalle «en el mismo cuadro donde
recomiendas el equipo, como estaba antes, sin llevarlo a otra página». La pestaña
«Equipo» del plan 7 se retira: el conmutador «Ver características del equipo ↓»
despliega porqué + secciones en la propia tarjeta; al expandirse, la columna SUELTA
el sticky (`.expandida → position:static` — una tarjeta clavada más alta que el
viewport dejaría el detalle inalcanzable) y el detalle se lee con el scroll normal;
al plegarse vuelve a clavarse. El estado sobrevive a los repintados (módulo ficha.js)
y viaja en la URL (`?ficha=abierta`, deep-link: la mejora propuesta, adaptada — la
pestaña a la que apuntaba ya no existe). Medido: el detalle en línea permanente
haría la tarjeta de 2 475 px — el despliegue bajo demanda es la única forma de
cumplir AMBAS peticiones del dueño (tarjeta fija sin scroll + características en el
mismo cuadro). Además #41 parcial: fotos oficiales de EC-S/M/L/XL del Hardware
Reference Rev V (el supuesto de que solo había variantes -P/-H era falso) y
pictograma rotulado del EC-V; sigue abierta la serie 7000/7200).

Revisión anterior: 2026-09-16 (plan 7: **pestaña «Equipo»** — el plan 6 movió el porqué
y las secciones de características a `#verdict-detalle`, pero al quedar en el flujo de
«Dimensionar» aterrizaban a ~6 300 px (7 viewports: la columna de configuración sola
mide ~5 500 px) y el dueño reportó la información «perdida». Solución de diseño: sexta
pestaña «Equipo» en la barra — visible siempre, a un clic, a todo ancho — que aloja el
porqué + secciones en `.pane-centro`; el enlace «Ver características del equipo ↓» de
la tarjeta fija cambia a esa pestaña y sube al inicio; pista de vacío mientras no hay
candidatos. La tarjeta sigue fija y sin scroll interno, como pidió el dueño. SUPERADO
POR EL PLAN 8 el mismo día: el dueño pidió el detalle en el mismo cuadro).

Revisión anterior: 2026-09-16 (plan 6: **tarjeta «Equipos que cumplen» FIJA y con foto
oficial del equipo** — petición directa del dueño: sin scroll interno (el único scroll
es el de la página), foto oficial coronando la ficha con vistas frontal/trasera del
documento de origen, cambia al elegir otro equipo, pie con tamaño y procedencia;
candidatos compactados a 6 con pie honesto «+ N más». Opt-ins nuevos de ficha.js
(`vistas`, `panelFijo`, `contenedorDetalle`) — los demás dimensionadores no cambian.
Nace el pendiente #41: fotos oficiales de los modelos legacy).
Anterior (2026-09-16): plan 5: **#17 CERRADO** — la escalera On-Premises High
Availability E-STU sí existe: QuickSpecs a50004289enw + 32 SKU en la lista vigente, par
HA on-prem con SKU propio —; corrección de datos: los 6 términos de 7 años On-Premises
que la revisión del 2026-09-15 no vio (descripción «EC ONP 20M 7y», sin «Gb» ni «yr
Sub»); mejora ejecutada: cantidades editables a mano en el BOM de Aruba con sello de
declaración, viajan en `#bomAjustes`; #16 y #25 afinados con fuentes nuevas).
Anterior (2026-09-16): plan 4, fusionado a main: paquete A de datos — #27 variantes
EC-S-P, #28 término de 7 años, #32 títulos Lista/Neto —; paquete B — ópticas SFP de los
enlaces WAN en el BOM con selección del usuario y lista clicable de equipos candidatos —;
paquete D — los 10 ajustes de UX del dimensionador pedidos por el dueño —; paquete C — la
batería E2E promovida al repo, #40 —; y el #14 investigado: Huawei sí publica el ciclo de
vida de sus routers NetEngine, pero el documento oficial exige cuenta del fabricante).
Anterior (2026-09-15): UX del dimensionador Aruba — panel «Equipos que cumplen» fijo con
sticky mientras la columna de configuración se desplaza (tope de altura contra la zona
muerta bajo .cols; E2E e2e-sticky.js 4/4). Anterior (2026-09-14): plan 3 — cerrados
29/31/34/35/39 como código, 33 queda solo con la acción manual de GitHub, 38 verificado
«no comprobada» — bloqueo externo del fabricante; rediseño carrier-grade del input WAN
underlay.

---

## En curso: plan de sincronismo y actualización continua (2026-09-02)

Aprobado por el dueño del repo con la instrucción de avanzar con todas las fases y subirlas
a producción. El plan completo, con el diagnóstico y la evidencia de cada hallazgo, está en
<https://claude.ai/code/artifact/68c7ff3f-e0f0-4c3d-9448-3911c342283f>.

| Fase | Qué cierra | Estado |
|---|---|---|
| 0 | Permiso `sync` exigido en la ruta, sin simulacro sin clave, firma del adjunto, `xlsx` al espejo mantenido, `cors` fuera, `sqlite3` 6 | **hecha** |
| 1 | CI en GitHub Actions, `/salud` como healthcheck, Railway espera a CI, Dependabot | **hecha** |
| 2 | `FUENTES` por fabricante, `npm run catalogo`, importador de propuestas de la IA, salida estructurada, importador Huawei | **hecha** |
| 3 | Vigía de fuentes semanal fuera del proxy de egreso | **hecha** |

---

## Lo primero: el alta de usuarios — cerrado

1. **~~Crear usuarios queda pendiente~~ Resuelto (2026-09-02), a petición del dueño del
   repo.** `POST /api/usuarios` (protegido con `exige('usuarios')`) genera la contraseña
   temporal en el servidor y la devuelve **una sola vez** en la respuesta —nunca se guarda
   en claro ni se registra en el log— para que el administrador la comunique por un canal
   distinto al panel. La cuenta nace con `debeCambiar: true`, y un middleware nuevo en
   `server.js` (justo detrás del muro de sesión) le bloquea cualquier pantalla que no sea
   `/cuenta` hasta que cambie la clave de verdad — no es un aviso descartable como
   `desdeSemilla`, es una condición que hay que cumplir. El panel `/usuarios` tiene el
   formulario, el revelado con botón de copiar y una insignia «cambio pendiente» en la lista
   para quien todavía no completó su primer acceso. Verificado de extremo a extremo en
   Chromium: alta → login con la clave temporal → intento de ir al portal rebotado a
   `/cuenta` → cambio de clave → acceso liberado. Ver *Cerrado recientemente*.

## Bloqueado por acceso — necesita una máquina fuera de este entorno

Nada de esto es trabajo de ingeniería pendiente: el código está hecho y probado, falta el
dato. El proxy de egreso de la organización responde **403** a estos dominios, y un 403 de
política se reporta, no se rodea.

**Hallazgo del 2 de septiembre de 2026: los ejecutores de GitHub Actions sí alcanzan estos
dominios.** La primera corrida del vigía leyó las seis fuentes con URL sin un solo 403
(Cisco 173.913 bytes, Juniper 392.019, MikroTik 459.308, HPE 333.670, Nokia 307.119). No pasan
por el proxy de la organización. Eso **no** convierte los pendientes de abajo en automáticos
—descargar un PDF y leer una tabla sin equivocarse de fila son cosas distintas, y este
repositorio no automatiza la segunda a propósito—, y **tampoco significa que cada dominio se
comporte igual bajo carga real**: el vigía solo pide una URL por fabricante; pedir 24 seguidas
(el caso de Aruba) puede toparse con límites que una sola petición no revela. El pendiente 2
(Fortinet `cps`) sí se cerró desde aquí — un workflow (`traer-fortinet-matrix.yml`) baja el
documento a una rama de transporte que se lee y se descarta, nunca a `main` ni a un PR, porque
no es un activo de la aplicación. Juniper podría cerrarse igual si alguien dispara ese
workflow. **Aruba y Huawei no**: investigados el 2026-09-02 (ver *Cerrado recientemente*).
Huawei bloquea el navegador automatizado con un "Access Denied" propio del fabricante
(Akamai), categoría distinta de un 403 de proxy y que este repositorio no intenta evadir.
Aruba, al pedir sus 24 datasheets en una sola corrida, tropezó con 403/timeout en 21 de
ellos — y aparte, el permiso de GitHub para que Actions abra PRs está desactivado en este
repositorio, un ajuste independiente del bloqueo de HPE. Los pendientes 3 y 14 siguen
necesitando una persona con navegador real.

**Y el 3 de septiembre de 2026 se supo que HPE es el mismo caso que Huawei, no uno más
suave.** Se pidió `buy.hpe.com` desde un ejecutor de Actions —que no pasa por el proxy de
esta sesión— y respondió **403 con un "Access Denied" de Akamai** (`errors.edgesuite.net`
en el cuerpo). No es límite de ritmo ni política de egreso: es la defensa anti-automatización
del propio fabricante, la misma categoría que este repositorio no intenta evadir. Los 403 y
timeouts que `npm run datasheets` ve desde cualquier máquina son la misma pared, y espaciar
las peticiones la ablanda pero no la abre. Para HPE, igual que para Huawei: **una persona con
navegador real**.

**Firecrawl no es la salida, y conviene saberlo antes de intentarlo (2026-09-03).** Se instaló
el servidor MCP de Firecrawl —un servicio de scraping alojado— pensando que sus servidores
leerían por nosotros lo que este entorno no alcanza. No funciona desde aquí, y no por la clave
ni por HPE: el servidor MCP corre **dentro** de este sandbox (`npx firecrawl-mcp`), así que sus
llamadas salen por el mismo proxy, y ese proxy deniega el dominio del propio Firecrawl. Medido
con una URL de control (`example.com`) que falló igual, y confirmado por el propio proxy:

```
"kind": "connect_rejected",
"detail": "gateway answered 403 to CONNECT (policy denial or upstream failure)",
"host": "api.firecrawl.dev:443"
```

`mcp.firecrawl.dev` y `firecrawl.dev` están denegados igual. La configuración queda en
`.mcp.json` a propósito —sin clave, solo la referencia `${FIRECRAWL_API_KEY}`— porque **sí
sirve desde una máquina que no esté detrás de este proxy**, que es donde tiene sentido usarla.
Desde esta sesión, la vía que sí funciona sigue siendo GitHub Actions.

El procedimiento completo —incluido qué viaja de local a producción y por qué no es la base
de datos— está en [`IMPORTAR-CATALOGO.md`](IMPORTAR-CATALOGO.md).

| # | Qué falta | Cómo se cierra | Bloqueo |
|---|---|---|---|
| ~~2~~ | ~~`cps` en 37 de los 58 FortiGate~~ **Resuelto (2026-09-02)**, y ampliado el 2026-09-03 de 53 a **56 de 58** leyendo las fichas por serie de 400F y 600F. Quedan 100F y 200F, cuyas fichas no están en la URL que sigue el patrón del resto (404, reportado). | — | resuelto vía Actions |
| ~~3~~ | **~~PDFs de datasheets de Aruba~~ Resuelto (2026-09-11): 18/24, ver *Cerrado recientemente*.** Los 6 que quedaban atascados bajaron en sesión nueva con Chrome real: `ecQuickspecs`, `ecXlSpec`, `gw9000`, `gw9100`, `gw9200Qs` y `sdBranchVsg`. La cuota de `psnow/downloadDoc` efectivamente se había reseteado al día siguiente. De los 6 que faltan: 4 nunca fueron PDFs (páginas de documentación en vivo), 1 URL murió (`ecSpecSheet`, 404 genuino, hay que buscar el reemplazo) y 1 exige cuenta de soporte HPE (`gw9000Spec`). El método completo quedó documentado en `public/datasheets/LEEME.md`. | Nada pendiente salvo decidir el reemplazo de `ecSpecSheet` y conseguir una cuenta HPE para `gw9000Spec`. | — |
| — | **Bytes del PDF «EdgeConnect Product Lifecycle Policy»** (entrada `ecLifecycle` en DATASHEETS, plan 10 del 2026-09-16). La entrada ya existe y la pestaña de fuentes enlaza la URL oficial; falta la copia congelada en `public/datasheets/edgeconnect-lifecycle-policy.pdf`. | `npm run datasheets` desde una máquina con salida (o navegador real) y commit del PDF — el mecanismo es el de siempre, la pared es la misma de los otros seis datasheets sin copia | El proxy de egreso responde 403 a `arubanetworking.hpe.com`; desde GitHub Actions la cuota de HPE se agota con ráfagas |
| 14 | **Ciclo de vida y cifras finas del catálogo Huawei.** 40 modelos cargados y ninguno marcado como fuera de venta, mientras Cisco tiene 8; las 17 NetEngine no traen `fwd`, `ipsec` ni `typ` y las 23 AR no traen `mpps`. El motor no inventa: muestra lo que hay. | **El importador ya existe, y desde el 2026-09-04 también la plantilla**: `npm run huawei -- --check` inventaría los huecos y `npm run huawei -- --plantilla` escribe `huawei-specs.csv` y `huawei-eox.csv` ya con los 40 modelos y las cabeceras que el importador reconoce, así que el trabajo en la página se reduce a pegar cifras. Luego `npm run huawei -- huawei-specs.csv --dry` para el ensayo, sin `--dry` para aplicar, y `npm run huawei -- huawei-eox.csv --eol` para el fin de venta. **2026-09-10: el bloqueo de Akamai no es contra todo navegador** — con Chrome real (no Playwright/Actions) `support.huawei.com/enterprise/en/bulletins/` carga completo y sin captcha, con buscador por modelo (`AR6700` → 11 avisos con fecha real). Dos obstáculos nuevos, distintos del bloqueo anterior: el **contenido** de cada aviso exige cuenta Huawei (candado visible, no se intentó sortear), y lo que se ve en la lista son ciclos de vida de **versiones de software** (`V600R023C00`…), no de hardware — puede que ni sea la categoría correcta para lo que el catálogo modela (fin de venta del equipo físico). "PCN" (Product Change Notice) sí es a nivel de hardware pero no lista una categoría de routers en este momento. **2026-09-16: la categoría correcta ya no es una duda.** La búsqueda web localizó el documento oficial «Huawei NetEngine AR5700&6700&8000 Series Routers Product Life Cycle» (e.huawei.com, 2023-10-20) — ciclo de vida de **hardware**, exactamente lo que el catálogo modela — y al abrirlo pide contraseña: el contenido sigue tras la cuenta Huawei, como se sospechaba. El tablón de routers «Life Cycle Notices» existe y declara 450 avisos (la página carga; el índice es dinámico). Conclusión: el bloqueo ya no es la categoría ni el buscador, es solo la cuenta. | Cuenta Huawei Enterprise para abrir el PDF «NetEngine AR5700&6700&8000 Series Routers Product Life Cycle» (e.huawei.com) y el tablón de routers — la categoría de hardware quedó confirmada el 2026-09-16, ya no hace falta aclararla |
| 4 | **~~Comprobar el sitio en vivo tras desplegar~~ Cerrado (2026-09-04)**, ver *Cerrado recientemente*. Eran dos preguntas distintas y ahora las cubren dos workflows: `sonda-produccion.yml` confirma desde fuera de este entorno que el dominio público responde de verdad (`/salud` y `/login`, sin sesión), y **`pantallas.yml`** conduce las 15 pantallas detrás del muro en un Chromium de verdad y sube una captura de cada una. No hace falta producción para lo segundo: la base es efímera y se resiembra desde `legacyData/` en cada despliegue, así que lo que pinta una pantalla es función del commit. | Nada pendiente de ingeniería. Queda el **juicio**: mirar las capturas del artefacto y decidir si la pantalla dice lo que se le quiere decir a un cliente. | — |

## Fabricantes sin dimensionador

Cobertura actual por herramienta:

| Fabricante | Portal | Cotizador | Guía de diseño | Dimensionador |
|---|:---:|:---:|:---:|:---:|
| Huawei | sí | sí | sí | sí |
| Cisco | sí | sí | sí | sí |
| Fortinet | sí | sí | sí | sí |
| MikroTik | sí | sí | sí | sí |
| Aruba | sí | sí | sí | sí |
| **Juniper** | sí (22 modelos) | sí (21) | sí | **sí** (nuevo) |
| **Nokia** | sí (18 modelos) | sí (18) | sí | **sí, dos** (18/18 — fabric 7220 IXR + agregación/core) |
| ~~Arista~~ | retirado | retirado | retirado | — |
| **Starlink** | no | no (llega como referencias) | no | **sí** (módulo canónico integrado, 2026-09-24) |

**Starlink: integración del módulo canónico `starlink-leo-dimensionador` v1.0.0 — cerrado
(2026-09-24).** El bloqueo anterior («los seis archivos no están ni en el entorno, ni en
GitHub, ni en Drive») se resolvió cuando el dueño los adjuntó en la sesión. Los seis SHA-256
verificaron exactos contra la línea base del prompt maestro antes de tocar nada, y el motor
(`app.js`) se integró **sin una sola línea distinta**: `public/js/dimensionador-starlink-leo.js`
es copia byte a byte, requereable desde `server/services/starlinkSizing.js` para que
`POST /api/sizing/starlink` recalcule con el mismo motor que ve el navegador (paridad
frontend/backend, sección 4.3 del prompt). La carpeta `starlink-leo-dimensionador/` en la raíz
del repo se conserva como línea base para repetir la verificación en el futuro, igual que
`server/seed/legacyData/` conserva sus fuentes sin retipear. Reemplaza por completo el
dimensionador anterior (Standard/Mini/Enterprise/Performance/Flat High Performance, cinco kits
sin precio) — el motor canónico trae **dos** kits (Standard 4X, Performance) con **catálogo de
precios COP real** (tarifa Local/Global Priority publicada), y `pricesVerified` sigue
desmarcado por defecto porque ese precio de lista no incluye impuestos ni el descuento
negociado del sitio, no porque el número sea inventado.

Mejoras futuras no implementadas (declaradas, no aplicadas, por mandato del prompt maestro):
- **Vigilancia**: las ocho `SOURCE_LINKS` del motor no están en `npm run vigia`
  (`legacyData/fuentes.js`), así que un cambio de tarifa de Starlink no generaría aviso.
- **Persistencia de escenarios**: no hay auditoría server-side de qué se cotizó (sección 15.3
  del prompt); ningún otro dimensionador de este portal la tiene tampoco, así que no se creó
  solo para este.
- **A propósito sigue sin estar** en `navegacion.js`, `/api/catalog` ni el cotizador como
  equipo — no es uno de los ocho fabricantes de equipo de red del portal, y sumarlo ahí rompería
  los conteos que varias pruebas fijan (`fabricantes: 8`).
- **Matriz T01–T62 del prompt**: automatizada la parte que vive en el motor puro (`plan`,
  `roleFactor`, arquitectura, alertas, saneo del backend — `test/starlink-motor.test.js`) más la
  paridad end-to-end contra el servidor real (`test/servidor-produccion.test.js`). Lo que es
  puramente de navegador (grid responsive en los cinco anchos, impresión A4/Letter, lector de
  pantalla, `prefers-reduced-motion`) se verificó a mano en Chromium (carga limpia, sin errores
  de consola, recálculo en vivo, paridad frontend/backend en la app real) pero no quedó como
  prueba automatizada — igual que `npm run manual` para el manual de usuario, es una verificación
  que se repite pocas veces y automatizarla entera habría sido una inversión fuera de escala
  para este cierre.

5. **Completar el catálogo del dimensionador Juniper — parcialmente resuelto (2026-09-02),
   ver *Cerrado recientemente*.** La «SRX Series and vSRX Performance and Features Matrix» se
   trajo vía GitHub Actions (mismo patrón que cerró el pendiente 2 de Fortinet) y corrigió
   `fwImix`/`vpn`/`sess` de varios modelos que la reconstrucción por búsqueda había adivinado
   mal, además de completar `sess`/`cps`/`atp` donde faltaban. Lo que sigue abierto:

   - **SRX380: fw/fwImix/vpn en disputa, sin resolver a propósito.** El documento trae una fila
     para este modelo que contradice lo ya guardado (10/4/3,5 Gbps frente a 20/6,5/4,4), pero
     solo `ips` de esa fila coincide — un único anclaje, por debajo del doble anclaje que este
     catálogo exige antes de pisar un dato existente. Corregirlo exige `--sin-contraste` bajo
     responsabilidad de quien decide; documentado en la cabecera de `juniper.js` y junto al
     propio modelo.
   - **~~IPS y ATP de la generación 2024~~ Resuelto para SRX1600, SRX2300 y SRX4300
     (2026-09-03)**, con la ficha oficial por modelo — el documento distinto que hacía falta.
     **Y resolvió el enigma que bloqueaba esto**: aquel «21 Gbps de IPS sobre un firewall de
     24 Gbps» no contradecía que inspeccionar cueste capacidad, era el **otro método de
     medida**. La ficha publica dos («TPS: average HTTP sessions» y «CPS: short-lived
     sessions») y el SRX1600 da 19 Gbps por TPS y 4,5 por CPS. Se transcribió siempre CPS, el
     único método en el que Juniper publica también las capas profundas. Siguen abiertos el
     **SRX4700** (la conexión falló, merece un reintento) y el **SRX4100/SRX4200**, cuyas
     fichas dan 404 en ese patrón de URL — son de una generación anterior y probablemente se
     llamen de otra forma. **Verificado el 2026-09-16:** el SRX4700 ya quedó completo el
     2026-09-11 (fw/fwImix 1,4 Tbps, vpn 170G, vpnImix 90G, ips 60G por método CPS — no el
     TPS de 110 que titula la ficha —, sess 60M, cps 600k) y la ficha oficial del modelo
     (juniper.net) confirma esas cifras; `atp` se mantiene en null a propósito porque
     Juniper no publica Advanced Threat Prevention para este modelo. Lo abierto de verdad:
     el reintento de SRX4100/SRX4200.
   - **Precios y SKU**: no hay lista de precios de Juniper, todo va sin cotizar.
   - **Niveles de Juniper Care**: nombres y SLA sin verificar. Antes que inventar una tabla
     de SLA en una herramienta de preventa, hay un único nivel declarado como no verificado.

   Para lo que sigue abierto, `npm run juniper -- matriz.xlsx` (ver `npm run juniper -- --check`
   para la cobertura casilla por casilla) sigue siendo la vía: reconoce las columnas por su
   cabecera, resuelve Gbps frente a Mbps sin multiplicar a ojo y **rechaza la fila si alguna de
   sus columnas contradice lo ya verificado**, que es lo que caza una fila desplazada.
6. **~~Dimensionador Nokia~~ Resuelto (2026-09-03)**, ver *Cerrado recientemente*. Los 18
   modelos están cubiertos por dos páginas, porque son dos preguntas: la **7220 IXR** (4
   modelos) como fabric leaf-spine, y los otros **14** (7250 IXR, 7250 IXR-X, 7250 IXR-R,
   7750 SR/SR-s/SR-1x) por capacidad de un único equipo, en
   `dimensionador-nokia-7750sr.html`. Nokia es ahora el único fabricante del portal con dos
   dimensionadores.

## Cerrado: el BOM se quedaba atrás del dimensionamiento (2026-09-03)

A petición del dueño del repo. **Se midió antes de tocar nada**, conduciendo las ocho páginas
en Chromium, y el resultado fue que había *tres* comportamientos distintos para la misma
pregunta:

| Página | Antes |
|---|---|
| Fortinet, MikroTik, Aruba | el BOM seguía al dimensionamiento |
| **Cisco, Huawei** | **se quedaban cotizando el equipo anterior** |
| **Juniper** | solo repintaba el BOM al abrir su pestaña |
| Nokia (×2) | sin desplegable propio, pero sin aviso al quedarse sin diseño |

**La causa era una sola línea, repetida en seis copias.** `llevarABom(id)` empezaba con
`if(!id) return;`, así que el caso que más importa —que el dimensionamiento se quede **sin
candidato**— nunca llegaba al BOM. Medido: en Cisco a 20 Gbps ningún equipo cumple y el BOM
seguía mostrando un **Catalyst 8200L de 1 Gbps**, exportable, sin una palabra de aviso.

La regla pasa a `js/bom.js` (`BOM.sincronizar` y `BOM.avisoDesvio`), igual que la de fin de
venta vive solo en `ficha.js`. Repinta siempre —no solo cuando cambia el modelo—, distingue lo
**elegido a mano** de lo **heredado** (una elección manual en el BOM no se pisa; una heredada
sigue al cálculo) y declara los dos desajustes, que no son el mismo: «no hay candidato» y
«estás cotizando otro equipo». Ese aviso existía solo en Fortinet; ahora lo dan los siete.

Verificado en las ocho páginas: el BOM sigue al cambio de escenario, respeta la elección
manual, declara el desvío y declara el «sin candidato» —incluido el fabric 7220 IXR, donde se
provocó a propósito un diseño imposible. Sin errores de consola. 156 pruebas (eran 148), ocho
de ellas nuevas, y una comprueba en el propio código fuente que **ninguna página vuelva a
guardarse su copia de la regla**.

## Cerrado: el Comparador de Equipos mostraba seis filas de treinta posibles (2026-09-04)

A petición del dueño del repo, con el motivo que dieron los usuarios: «la información es muy
poca». Lo era, y **el dato no faltaba**: `/api/catalog` entrega entre 15 y 29 campos por
fabricante y `buildAll()` los tiraba al normalizar los ocho catálogos a una forma común
mínima de seis. La corrección es casi toda de frontend; el backend ya servía todo.

**Ahora son ~30 filas en siete secciones** —identidad, rendimiento, escala, interfaces,
plataforma, alimentación y ciclo de vida/comercial— y en **matriz** en vez de una tarjeta por
equipo: con tarjetas, comparar un atributo obligaba a buscarlo en cuatro sitios y compararlo
de memoria.

**Dos defectos propios, encontrados al conducir la pantalla y corregidos antes de entregar.**
Los dos son del tipo que no rompe nada y solo miente:

1. **Decía «IPS: no aplica» de un Catalyst 8300**, que hace IPS con Snort desde IOS XE. La
   primera versión deducía la inaplicabilidad de que al fabricante le faltara el campo, y eso
   confunde «no lo tiene» con «no lo tenemos apuntado». Ahora `noAplica` se declara a mano y
   con motivo —un router de transporte Nokia no tiene sesiones concurrentes porque no es un
   cortafuegos con estado— y todo lo demás que falte es `sinDato`, que habla del catálogo y no
   del equipo. En un comparador el error era peor que en una ficha: descarta un equipo por
   algo que sí sabe hacer.
2. **Coronaba un ganador entre cifras que no se miden igual**, marcando los 24 Gbps de
   firewall de un SRX por encima de los 5 Gbps de forwarding de un Cisco — justo debajo del
   aviso que dice que esas cifras no son comparables. Las filas de rendimiento llevan ahora
   `mismaBase` y solo se marcan dentro de un mismo fabricante. Las que no dependen de la base
   —sesiones, APs, vatios— se siguen comparando entre fabricantes, porque ahí sí procede.

Se retiran cinco clases CSS que quedaron muertas al cambiar de tarjetas a matriz. 165 pruebas
(eran 156), nueve nuevas sobre las reglas del módulo. Verificado en Chromium: matriz de tres
fabricantes, aviso de bases, interruptor de «solo diferencias» que oculta exactamente las
filas idénticas, y repintado al cambiar cualquier control sin volver a pulsar el botón.

## Conflictos entre el catálogo y una ficha oficial — Juniper y Nokia resueltos (2026-09-11)

**~~Ninguno de estos se corrigió~~ Juniper y Nokia se resolvieron el 2026-09-11, por
decisión del dueño del catálogo** (ver *Cerrado recientemente*). Quedan abiertos solo los
dos de Aruba, que siguen por debajo del doble anclaje. El registro original se conserva
abajo para memoria.

**~~Juniper — cuatro campos~~ Resuelto (2026-09-11).** El catálogo guardaba cifras de una
revisión vieja de las fichas y Juniper re-evaluó al alza; cada valor nuevo quedó confirmado
por dos fuentes oficiales (ficha vigente + Pathfinder HCT) y se transcribió:

| Modelo | Campo | Catálogo (antes) | Ficha oficial (aplicada) |
|---|---|---|---|
| SRX1600 | `vpnImix` | 5.500 | **8.000** |
| SRX1600 | `cps` | 95.000 | **170.000** |
| SRX2300 | `cps` | 320.000 | **450.000** |
| SRX4300 | `fw` | 90.000 | **98.000** |

**~~Nokia — seis capacidades~~ Resuelto (2026-09-11).** Los 7220 eran un error real (el
catálogo prometía el doble) y los 7750 SR-s una elección de métrica: se adoptó «System
capacity (FD; max)», documentada en la cabecera de `nokia.js`:

| Modelo | Catálogo | Ficha oficial | Efecto |
|---|---|---|---|
| 7220 IXR-D2L | 4 Tb/s | **2,0 Tb/s** | el catálogo promete el **doble** |
| 7220 IXR-D3L | 6,4 Tb/s | **3,2 Tb/s** | el catálogo promete el **doble** |
| 7750 SR-1s | 1,2 Tb/s | 4,8 Tb/s | sobredimensiona |
| 7750 SR-2s | 4 Tb/s | 9,6 Tb/s | sobredimensiona |
| 7750 SR-7s | 19,2 Tb/s | 108 Tb/s | sobredimensiona |
| 7750 SR-14s | 38,4 Tb/s | 216 Tb/s | sobredimensiona |

Cómo se decidió (registro del razonamiento original):

1. **El caso 7220 era el urgente, aunque pareciera el pequeño**, porque era el único que iba
   en la dirección peligrosa: el catálogo prometía el doble de lo que el equipo hace. Y no
   hizo falta creerle a la ficha para verlo — **sumar los puertos del propio catálogo dio la
   razón a la ficha**: el D2L son 48×25G + 8×100G = 2.000 Gb/s, y el D3L 32×100G = 3.200.
   Además el catálogo era **incoherente consigo mismo**: el D1 (88 Gb/s) y el D5 (12,8 Tb/s)
   sí coincidían con la suma de sus puertos, solo el D2L y el D3L iban al doble.
2. **El caso 7750 SR-s era ambiguo de verdad: elección de métrica.** La ficha publica *tres*
   métricas distintas de capacidad, y el valor viejo del catálogo coincidía con una de ellas
   por slot. La decisión tomada: **«System capacity (FD; max)»**, porque el dimensionador de
   agregación/core ordena por `cap` y la «Interface capacity» es agregación estadística
   sobresuscrita. Quedó documentada en la cabecera de `nokia.js`.

**Aruba — un campo, encontrado el 2026-09-10 al ampliar el catálogo EdgeConnect** (ver
*Cerrado recientemente*). El QuickSpecs oficial vigente (v18, 06-jul-2026) contradice el
`wanMax` de EC-XS con un solo documento — por debajo del doble anclaje que esta tabla exige
antes de pisar un dato existente — así que se deja sin tocar.

| Modelo | Campo | Catálogo | Ficha oficial |
|---|---|---|---|
| EC-XS | `wanMax` | 200 Mbps | **1.000 Mbps** |

**~~Aruba — EC-XL, un conflicto de ciclo de vida y no de capacidad, encontrado el 2026-09-10 al
extraer List Price~~ Resuelto (2026-09-13)**, ver *Cerrado recientemente* («EC-XL marcado fin
de venta con fechas oficiales»). La Product Lifecycle Policy oficial de EdgeConnect confirmó la
señal del export del distribuidor y el dueño aprobó marcarlo: `eolAnnounced` con anuncio
jun-2025, último pedido 2026-03-31 y fin de soporte 2033-03-31.

**Aruba — cuatro conflictos más, encontrados el 2026-09-13 al incorporar las fichas
técnicas completas de los datasheets** (ver *Cerrado recientemente*). Misma regla: dos
documentos oficiales por dato y la decisión final es del dueño del catálogo; mientras
tanto, el dato nuevo del datasheet se muestra en el campo `spec` sin pisar el existente.

| Modelo | Campo | Catálogo | Ficha oficial |
|---|---|---|---|
| 7010 | `fw` / `fwSess` | 4 Gbps / 32.768 | **8 Gbps / 65.536** (DS serie 7000 vigente) |
| 7205 | `fw` | 15 Gbps | **12 Gbps** (DS serie 7200) |
| 7030 | `ifaces` | «8x combo + puertos 10G» | **8x combo 1G, sin 10G** (DS serie 7000) |
| EC-L | `psu.texto` watts | 401 W | **404 W** (QuickSpecs) / **440 W** (Hardware Ref., EC-L-P) |
| Gateway 9004/9012 | `fwSess` | 128.000 (datasheet AOS 10) | **64.000 en modo SD-WAN** (doc oficial a00099294en_us, validado 2026-09-13) — expuesto en `spec.fwSessSdwan` sin pisar el dato; si el dueño decide que el filtro de flujos use la cifra SD-WAN conservadora, se cambia `fwSess` y se ajusta el test de flujos |

**~~Gateway 9004/9012 `aps` 32 (AOS 8) vs 128/256 (AOS 10)~~ Resuelto (2026-09-17, fase 1
de la auditoría, C3).** Las dos cifras eran ciertas, cada una en su arquitectura: el
selector «Sistema operativo de los gateways» elige cuál aplica (`porSo` en `aruba.js`).
La base del catálogo pasa a AOS 10, la que gestiona Central.

## Fases 2 y 3 de la auditoría técnica del 2026-09-17 — cerradas en código (2026-09-24)

Documento: «Auditoría técnica — Dimensionador Aruba»
(<https://claude.ai/code/artifact/73f4cc17-eb40-494c-9127-ac3eea6849a0>). Todas las fases están
cerradas en el código; el detalle, con su evidencia, en *Cerrado recientemente* (2026-09-24). Lo
único que queda son **datos que tiene un tercero** y **una regla del dueño**:

- **M4 · la regla 70/30 del brief descarga el 70 % del caudal TOTAL, MPLS incluido.** No se
  cambió: es decisión del dueño y una prueba la fija con su nombre. Ahora la revisión del
  diseño **avisa** cuando esa descarga supera la capacidad de los enlaces de Internet (su propio
  caso de prueba, MPLS 100 + Internet 200, saca 210 por un enlace de 200). **Decisión del dueño**:
  limitar la descarga a `min(70 % del total, Internet)` o dejarla como está.
- **Precios de Central por serie.** Los SKU oficiales de las series 91xx y 92/72xx, Foundation
  Base y los «+ Security» ya están cableados (documento oficial de suscripciones de Central, en
  el repo), pero la lista cargada solo tarifa la 90/70xx: van en «consultar» con su SKU. Se
  cierran con la próxima importación de la lista del distribuidor (`npm run lista-aruba`), que
  ahora los detecta como candidatos (cubo `central`).
- **R8R13AAE / R8R14AAE** (Silver/Gold AOS 8 del 9240): sin List Price en la lista del
  distribuidor — «consultar» en el BOM.
- **Estado de venta de 7010, 7024, 7030, 7205 y 7240XM**: no se localizó boletín oficial; siguen
  como línea anterior. Los dominios de HPE bloquean la automatización (Akamai), incluso desde
  Actions: necesita una persona con navegador.
- ~~**9106 en AOS 8**~~ **Cerrado el 2026-09-24**: tabla «AOS-8 Specifications» de la QuickSpecs
  9100 (p. 14), leída en local — 256 APs y 8K clientes; el 9114 «Not Supported».

## Lo que el informe de validación técnica de Fortinet deja abierto (rev. 2026-09-23)

Documento: «Informe final de validación técnica y plan de mejora del módulo Fortinet
Presales», 22-sep-2026. Los P0 técnico y comercial están cerrados (ver *Cerrado
recientemente* y `docs/rediseno-fortinet.md`, etapa 3). Lo que queda, con su motivo:

**Y lo que deja abierto la auditoría en vivo del 23-sep (etapa 7, GO CONDICIONADO).** Detalle y
riesgos R1–R11 en `docs/auditoria-fortinet-2026-09-23/LEEME.md`.

- ~~**Decisión del dueño: fusionar y desplegar la etapa 7.**~~ **Hecho el 2026-09-23**: `main`
  avanzó de `ec2f803` a `f6f1952`; `verificar` y `pantallas` en verde sobre ese commit; Railway
  `dcb662d9` en SUCCESS con `[seed]` y `listen`; sonda `/salud` 200 y `/login` 200. **Sigue
  abierta la aprobación explícita de arquitectura Fortinet** que pide el informe: la da una
  persona revisando `docs/auditoria-fortinet-2026-09-23/motor-y-bom.md`, no un despliegue.
- ~~**R1 · La retirada de SSL-VPN en modo túnel en FortiOS 7.6.3+ está citada, no leída.**~~
  **Cerrado el 2026-09-24, por dos lecturas que casan**: el PDF de las Release Notes de 7.6.3
  (p. 15), leído por otra sesión desde una máquina sin el proxy, y la página del mismo aviso,
  traída desde Actions (`traer-fortinet-pendientes.yml`, corrida `35997261950`). Las dos dicen
  lo que la regla aplicaba, «This applies to all FortiGate models». La regla pasa a
  `leida:true` con la cita literal; el caso «citada y no leída» se sigue probando con un
  catálogo sintético y, en pantalla, interceptando la API.
- ~~**R2 · «Modelos con 2 GB de RAM» (nota 10 del Matrix) no dice cuáles son.**~~ **Cerrado el
  2026-09-24**: las Release Notes de 7.6.0 (PDF de `fortinetweb.s3`, pp. 10-11, corrida
  `35997486119`) dan la lista —40F y variantes, 60F, 61F— y la cierran: «FortiGate models not
  listed above will continue to have SSL VPN web and tunnel mode support». La regla pasa a esos
  tres modelos y en 7.6.0–7.6.2 ya no queda nada «desconocido». Otra sesión llegó el mismo día a
  los mismos tres por la p. 16 de las de 7.6.3 y dejó el resto en «desconocida», que era lo
  correcto con ese texto: es el aviso de las funciones proxy y no trae la frase que cierra la
  lista. Una prueba exige ahora que la regla cite esa frase, porque de ella depende que el resto
  quede soportado.
- ~~**Accesibilidad no ejecutada**~~ **La parte automática, cerrada el 2026-09-24**:
  `test/e2e/e2e-accesibilidad.js` pasa axe-core (WCAG 2.0/2.1 A y AA) por 17 estados de pantalla
  —incluidos escenarios con resultados y la pestaña de BOM— y comprueba el reflujo a 640 px (200 %
  de zoom). Encontró 13 fallos reales y quedan en 0: contraste de los colores de marca (se añade
  `--red-txt`, el tono de marca oscurecido lo justo, para texto; la marca pura queda para lo
  decorativo), `#unit`/`#portVel`/`#sesUser`/título y fecha del cotizador sin nombre accesible,
  y las pestañas de cinco dimensionadores que desbordaban. **Sigue abierta, y es humana, la prueba
  con un lector de pantalla real** (NVDA, VoiceOver): axe comprueba la semántica que un lector
  necesita, no si lo que anuncia se entiende.
- **Lo que deja la cotización en borrador**, sin afectar al dimensionamiento (rev. 2026-09-24):
  - **Precio de FortiClient EMS y FortiSASE**: salen ya con su SKU exacto de los Ordering
    Guides, pero su precio **no está en el catálogo**. `npm run skus` solo extrae las filas de la
    lista que nombran un FortiGate, y estas licencias no nombran ninguno. La lista completa no
    vive en el repositorio, así que desde aquí no se sabe si las trae. Se cierra pasándola por un
    importador que extraiga también esas filas.
  - ~~**SD-WAN Service**~~ **Cerrado el 2026-09-24**: SKU **y precio** de la lista firmada en 54
    de 58 modelos. Los tres en los que el Ordering Guide imprimía otro código (70G, 200G, 4800F)
    los resuelve la lista, que es con la que se pide. Quedan sin SKU 70F, 100F, 200F y 600F, que
    no tienen SKU de hardware vigente.
  - **FortiSASE por debajo de 50 usuarios**: la banda publicada más baja empieza en 50.
  - **FortiSandbox dedicado y FortiAnalyzer**: son otro dimensionamiento (archivos/hora y VM de
    detonación; forma y GB/día). El mensaje cita la tabla exacta de su Ordering Guide.
  - **Licencia de VDOM adicional** y **segunda fuente opcional**: sin SKU en ningún documento
    traído ni en lo que se extrajo de la price list.
- **17 líneas de renovación sin precio (70F, 100F, 200F y 600F)**, y el FortiConverter de esos
  cuatro sin SKU. Hasta el 2026-09-24 llevaban el precio de la edición de **agosto**, marcado;
  ese día el dueño fijó la regla —«los precios debes tomarlos de 2026Q3 Mid Price
  list_AMER_FINAL_EFF 090726.xlsx»— y ahora salen **sin precio**, en borrador y diciendo cuál.
  No se sabe si la lista de septiembre los trae: `npm run skus` no extrae el bloque de un modelo
  sin SKU de hardware vigente. Se cierran pasando la lista por un importador que extraiga esas
  filas por SKU exacto.
- **Co-term sin prorrateo; heartbeat de HA sin modelar; ópticas de Fortinet fuera del
  catálogo.** Se declaran en la entrega (CU-03, CU-09 y CU-10 parciales) y no se inventan.
- ~~**El caso `calculadora-ssl` se quedó sin sujeto.**~~ **Cerrado el 2026-09-24**: el caso
  intercepta `/api/catalog` en su navegador y añade un FortiGate sintético sin `ssl` a la
  respuesta; comprueba el cableado real de la pantalla con un sujeto que no depende del catálogo
  del día. **Probado saboteando**: con el lector de TLS cayendo a Threat Protection, la
  comprobación sale en rojo.

**Cerrados el 2026-09-23 (F1, F4 en su mayor parte, F7).** Ver `docs/rediseno-fortinet.md`,
etapa 6, y *Cerrado recientemente*. Lo que sigue abierto, con su motivo:

- ~~**F6 · Los 4 modelos sin ninguna figura de hardware**~~ **Cerrado el 2026-09-24**, con dos
  aportes del mismo día que se complementan:
  - **La figura** (otra sesión): los cuatro —100F, 200F, 7081F y 7121F— tienen frontal y trasera
    de las **guías oficiales de hardware** de docs.fortinet.com: la QuickStart Guide del 100F
    (p. 5, dibuja un **101F** de la misma serie, y el pie lo dice) y la del 200F (p. 6), y los
    System Guide de los dos chasis (7.0.5 y 7.4.4), con las caras rotuladas literalmente. Todas
    tienen ahora una segunda copia, traída por el transporte, que casa: los System Guide son la
    misma versión y rotulan las mismas páginas, y las QuickStart (corrida `36033165475`) también;
    el texto del propio dibujo del 100F dice «FortiGate 101F».
  - **Los datos** (esta sesión): la ficha por serie **en inglés** da 404 en todas las rutas,
    también desde internet abierto, pero la **coreana oficial** sigue en el CDN de fortinet.com y
    trae la tabla completa: `cps` y los siete límites, anclados 12 de 12. Su dibujo del 100F
    rotula otro equipo (un 212F), y por eso la figura que se sirve es la de la QuickStart.
  **Lo que sigue es la historia, que conviene no repetir**: la primera corrida del workflow no
  trajo nada porque sus 15 URL se habían adivinado por patrón. Texto original: (100F, 200F y los
  chasis 7081F y
  7121F). **Sigue bloqueado y el bloqueo se volvió a medir el 2026-09-23**: `www.fortinet.com`
  y `docs.fortinet.com` devuelven `connect_rejected` del proxy de egreso —denegación de
  política de la organización, no un fallo de red—. El datasheet por serie de 100F y 200F no
  está en la URL que sigue el patrón del resto (404 reportado, no dado por bueno) y los
  *System Guide* de los dos chasis viven en `docs.fortinet.com`. **Se revisó la rama
  `fuente/fortinet-psu` y NO sirve**: son páginas de sustitución de fuente de alimentación —una
  de ellas del foro de la comunidad—, no la página «Hardware» de un datasheet, y su única
  figura es un detalle de la PSU del 7081F. Usarla sería la «figura parecida» que esta ficha
  no muestra. Se cierra publicando esos documentos en una rama `fuente/*` desde un ejecutor de
  Actions y volviendo a correr la extracción. Mientras tanto la ficha declara el hueco.
  **Ese workflow ya existe desde el 2026-09-23**: `.github/workflows/traer-fortinet-pendientes.yml`
  (`workflow_dispatch`) prueba las rutas conocidas de cada documento, publica lo que responde
  en `fuente/fortinet-pendientes` y **deja en el resumen qué código dio cada intento** — un
  404 se reporta, no se da por bueno ni tumba la corrida. **2026-09-24: se lanzó y terminó en
  verde** (corrida `35934676181`, 23:39 UTC); la rama `fuente/fortinet-pendientes` está
  publicada. **Lo que falta es leerla**: desde la sesión, el control de permisos denegó traer
  esa rama, y no se intentó por otra vía. La lee el dueño (el resumen de la corrida dice qué
  documento bajó) o concede el permiso; después, la transcripción sigue su camino con anclaje.
- ~~**F2 · Los SKU de los tres servicios avanzados de SD-WAN**~~ **Cerrado entero el
  2026-09-24.** El Ordering Guide de Secure SD-WAN (R31, ago-2026) no los vende como tres
  líneas sino como **un SKU por equipo**: el SD-WAN Service add-on, 1387 por debajo del 60G y
  1389 desde ahí. La matriz del Ordering Guide de FortiGuard lo confirma.
  - **El SKU y el precio salen de la lista firmada**: sus filas «SD-WAN BDL SVC» con el código de
    cada equipo, a 1, 3 y 5 años, en **54 de 58 modelos**. Otra sesión había visto los dos
    candidatos por modelo sin poder decir cuál era cuál; el documento lo decide.
  - **La familia se contrasta con el documento** en los 23 modelos que tabula: casa en todos. El
    código de modelo casa en 20. En 70G, 200G y 4800F el documento imprime otro, y manda la
    lista, que es con la que se pide; la línea lo dice.
  - **La primera versión lo dejaba sin precio**, en borrador, por un error propio: buscó el SKU
    con el marcador `-DD` del documento, y la lista guarda el término resuelto. Una prueba fija
    ahora esa forma.
  - **Sin SKU quedan 70F, 100F, 200F y 600F**: no tienen SKU de hardware vigente y sin ese ancla
    `npm run skus` no extrae su bloque. El motivo lo dice así, sin afirmar que la lista no lo
    traiga.
  Texto anterior, con el hallazgo de la otra sesión que esta entrega usó: (Underlay & Application
  Monitoring, Overlay Orchestration, conector FortiSASE), de la categoría «SD-WAN» del
  Ordering Guide de FortiGuard. **Sigue abierto, con un hallazgo nuevo (2026-09-24)**: la lista
  de precios firmada que ya está extraída (`fortinetSkus.js`) trae **dos candidatos por modelo**
  con la descripción «SD-WAN BDL SVC» —`FC-10-<modelo>-1337-02-DD` y `…-1387-02-DD`— y un
  «FortiSASE Cloud Management SVC» (`…-595-02-DD`), pero la descripción **no dice** cuál es
  «Underlay and Application Monitoring» y cuál «Overlay Orchestration». Asignarlos sería
  inventar la correspondencia, así que van con `sku: null` declarado y la exportación comercial
  sigue bloqueada al pedirlos. **Falta el Ordering Guide** para casar código y servicio: la
  página de guías de pedido de fortinet.com carga la lista por JavaScript, y las tres rutas que
  probó `traer-fortinet-pendientes.yml` dan 404 (el `sd-wan-ordering-guide.pdf` de
  `fuente/fortinet-product-matrix` es el de **Aruba**). Se cierra con una persona que abra esa
  guía en un navegador, o con el PDF que entregue el distribuidor.
- **F3 · Elegibilidad de FortiGuard único en HA activo-pasivo**, por modelo y versión de
  FortiOS. La regla general —una licencia por nodo— está aplicada; la excepción se declara sin
  ofrecerse, porque este catálogo no trae de qué modelos y qué versiones se puede afirmar.
- **F4-resto · Escala del plano de control que el Product Matrix NO publica**: rutas BGP/OSPF,
  vecinos y VRF por modelo. Los túneles, los VDOM, las políticas de firewall y los usuarios
  SSL-VPN concurrentes **ya entraron** y son ejes duros; estos tres siguen solo en la
  *Maximum Values Table*, que este catálogo no trae. **No se piden en el formulario mientras
  no se puedan contrastar**: un control que no comprueba nada invita a creer que se tuvo en
  cuenta, que es peor que su ausencia. Cuando entre el dato, el motor ya tiene dónde ponerlo —
  son tres entradas más en `FortinetReglas.EJES`, con la misma mecánica de `configuracion: true`.
- **F5 · Si un derate publicado por Fortinet apareciera** para proxy, SIP, logging o HA
  activo-activo, entraría como dato con su fuente. Los del informe se excluyeron porque
  dependen del flujo, del perfil, del cifrado y de la configuración: no son constantes.
- ~~**De los 7 modelos que el Product Matrix de septiembre ya no lista quedan 2: el 100F y el
  200F.**~~ **Cerrado el 2026-09-24**: su ficha coreana oficial —en el CDN de fortinet.com, no una
  copia archivada—, anclada con seis cifras por fila (12 de 12), trae `ssl`, `cps` y los siete
  límites; `FICHAS_LIMITES` vuelve a comprobar las
  anclas en cada carga. El consumo del 100F **no** casa con esa revisión de 2023 y sigue saliendo
  de la R42 de 2025. Texto original: Los otros cinco (400F, 401F, 600F, 1000F y 1001F) se cerraron el 2026-09-23 en la
  etapa 7 con sus fichas por serie (`FICHAS_LIMITES` en `fortinet.js`). Esas fichas ya estaban
  en las ramas de transporte y casaron 12 de 12 contra cuatro anclas, que se comprueban al
  cargar. El 100F y el 200F siguen **apartándose con su motivo** cuando un escenario pide esos
  ejes. **Y el bloqueo cambió de naturaleza el 2026-09-24**: ya no es de red, porque sus
  datasheets dan 404 también desde internet abierto (Fortinet ya no los publica), y sus
  QuickStart Guide no traen límites. La única fuente oficial que queda es una copia archivada
  del datasheet, y eso es justo lo que la regla de abajo no admite.
  **No se completan desde los espejos** con los que se leyó su alimentación el 2026-09-11. Un
  tope de túneles o de SSL es una restricción crítica, y el prompt de la auditoría del 23-sep
  prohíbe usar como autoridad una copia secundaria cuando existe el documento del fabricante.

## Datos por confirmar

7. **Precio de los modelos Juniper y Nokia añadidos en agosto 2026.** Las cifras técnicas
   están verificadas contra datasheets oficiales; el precio no, porque no hay lista de precios
   de estos dos fabricantes en el material disponible. Van como `Consultar` con `elpN:0` y el
   BOM los cuenta como sin cotizar, igual que Aruba.
8. **~~Ciclo de vida de SRX1500 / SRX4100 / SRX4200~~ Resuelto (2026-09-03)**, ver *Cerrado
   recientemente*. El SRX1500 y el SRX4100 **sí** tienen boletín y su último pedido ya venció;
   el SRX4200 no lo tiene y se queda sin marcar a propósito.
9. **~~Cisco `C8355-G2` tiene `sdwan: null`~~ Resuelto (2026-09-03)**, ver *Cerrado
   recientemente*. Cisco sí lo publica: 8,7 Gbps.
10. **~~Precios de Aruba: todos en `null`~~ Resuelto (2026-09-13)**, ver *Cerrado
    recientemente*. Suscripciones EdgeConnect, Boost, Central, licencias perpetuas del
    9240 y remanufacturados 7000/7200 ya llevan SKU y List Price. Siguen en `null` a
    propósito: Foundational Care (SKU por variante de hardware, se resuelve en HPE SSC),
    EC-V, EC-XS-SP y Dynamic Threat Defense (no están en la lista del distribuidor).
15. **Alimentación eléctrica: cobertura real, no completa.** La nueva sección «Alimentación
    eléctrica» de la ficha (agosto 2026) solo tiene dato donde el propio catálogo ya traía
    una frase publicada — Cisco 21/21 (ya existía), Huawei 17/40, MikroTik 14/15, **Aruba 16/25** (2026-09-24:
    los seis gateways 9000/9100/9200, leídos de los PDF oficiales de `public/datasheets/`; los
    nueve controladores AOS 8 7000/7200 siguen sin dato porque no hay documento suyo en el
    repositorio),
    **Juniper 12/12 SRX** (2026-09-03, completo: ver *Cerrado recientemente*), **Fortinet
    58/58** (2026-09-11, completo: 70F, 100F y 200F cerrados — solo 7081F y 7121F quedan
    sin `watts` porque sus guías solo publican capacidad por fuente, decisión documentada)
    y **Nokia 6/18** (2026-09-03). El resto queda `null` y la ficha lo declara sin rodeos.

    **Nokia no figuraba en esta lista hasta el 2026-09-03**, y ese era un fallo del registro,
    no del catálogo: contaba seis fabricantes de siete, así que sus 18 modelos no aparecían
    ni como hueco — ni ahí ni en `npm run catalogo`, que tenía el mismo punto ciego. Un
    pendiente que no se lista se comporta igual que uno que no existe, el mismo modo de fallo
    que el conjunto inerte de `CISCO_EOL_MODELS`. Ya listado y ya parcialmente cerrado: **6 de
    18** con las fichas de serie de nokia.com. Los 12 restantes no salen de ahí — el 7250
    IXR-e publica variantes redundantes y no redundantes del **mismo** modelo, y este catálogo
    tiene una sola entrada, así que elegir una sería falso para la mitad de los pedidos (el
    caso del SRX320); y de las familias 7250 IXR-6e/10e, IXR-X, IXR-R y 7750 SR-1 no se
    localizó ficha oficial en esta corrida. Esto **no es lo mismo** que los bloqueados por egreso de más arriba: el Product
    Matrix de Fortinet, el material de Juniper y el datasheet abreviado de MikroTik que este
    catálogo ya usa **no traen** consumo eléctrico por modelo — no es una tabla que falte
    copiar, es una hoja mecánica/eléctrica aparte por cada modelo, que ningún importador de
    este repo sabe pedir todavía. Cerrarlo del todo es fabricante por fabricante y modelo por
    modelo, no un solo documento.

    **Fortinet, con pistas concretas ya buscadas (28-08-2026).** `WebSearch` sí funciona en
    este entorno, pero `WebFetch` está bloqueado **para todo**, no solo para Fortinet —
    denegado por igual contra `fortinet.com`, `docs.fortinet.com`, `community.fortinet.com`,
    un mirror del datasheet en `enbitcon.de`, una ficha de reventa en `corporatearmor.com` e
    incluso `en.wikipedia.org`. Con eso, lo que sigue son **fragmentos de búsqueda sin
    confirmar por lectura directa** — pistas para verificar, no datos para copiar al
    catálogo:

    | Modelo | Indicio | Fuente | Confianza |
    |---|---|---|---|
    | ~~FortiGate 100F~~ **Confirmado y aplicado (2026-09-03)** | Leído directo: «the device has two power supplies that can be connected to different power sources». `redund: true` en el catálogo | [Technical Tip: Checking FortiGate-100F series power supply](https://community.fortinet.com/t5/FortiGate/Technical-Tip-Checking-FortiGate-100F-series-power-supply/ta-p/267021) | **verificado** |
    | FortiGate 200F | SKU de repuesto oficial `SP-FDD200F-PS` — "hot-plug / redundant" | [ficha de reventa](https://www.corporatearmor.com/product/fortinet-power-supply-hot-plug-redundant-sp-fdd200f-ps/) | Media |
    | FortiGate 400F | SKU de repuesto oficial `SP-FAD400F-PS` — "power supply redundant" | [ficha de reventa](https://www.corporatearmor.com/product/fortinet-power-supply-redundant-sp-fad400f-ps/) | Media |
    | ~~FortiGate 7081F~~ **Confirmado y aplicado (2026-09-03)** | Leído directo: «up to six hot swappable 200-277V, 16A AC PSUs. The capacity of each PSU is 2500W» + «You can add extra PSUs to provide redundancy». Los 2.500 W son capacidad por fuente, **no** consumo: van en el texto, no en `psu.watts` | [System Guide — AC PSUs](https://docs.fortinet.com/document/fortigate-7000/hardware/fortigate-7081f-system-guide/12189/ac-psus-and-supplying-ac-power-to-the-chassis) | **verificado** |
    | ~~FortiGate 7121F~~ **Confirmado en parte y aplicado (2026-09-03)** | Leído directo: se cambia una fuente en caliente «as long as four PSUs are connected to power and operating normally». El **número máximo** de fuentes (el «hasta 8» que decía esta tabla) **no** aparece en ese documento, así que no se registró | [System Guide — Hot Swapping an AC PSU](https://docs.fortinet.com/document/fortigate-7000/hardware/fortigate-7121f-system-guide/410545/hot-swapping-an-ac-psu) | **verificado en parte** |
    | ~~FortiGate 60F / 90G / 91G~~ | **Atribución retirada (2026-09-03).** Al leer el documento de verdad resultó tratar de las series 100/101E y 200/201E —que no están en este catálogo— y no dice nada de los 60F/90G/91G. Era una cita mal asignada, del tipo que este registro existe para no propagar. | — | retirada |

    Sin ningún indicio, ni a favor ni en contra: 400G/401G, 600F, 700G/701G, 900G/901G,
    1000F/1001F, 1800F/1801F, 2600F/2601F y toda la línea 3000-4800 (F y G) — 45 de los 58
    modelos. Cómo cerrarlo: desde una máquina con acceso, abrir las URL de arriba, confirmar
    el texto exacto y transcribirlo a `redund`/`psu` en `fortinet.js` con el mismo cuidado que
    Huawei — cita literal, nunca inferido del tamaño o la gama del equipo.
16. **Señales de fin de venta de terceros en EC-L-H y EC-XS (2026-09-13).** Al verificar
    las fechas oficiales del EC-XL, los verificadores de ciclo de vida de terceros
    (router-switch.com, layer23-switch.com) daban también fin de venta a **EC-L-H
    (JZ878A, EoS 2025-12-31)** y **EC-XS (JM962A, EoS 2026-01-31)**. Ninguna de las dos
    está confirmada por un documento oficial de HPE — la Product Lifecycle Policy
    consultada solo nombra al EC-XL-H — así que NO se marcan: misma regla de doble
    anclaje que el EC-XL en su momento. **Indicios oficiales acumulados (importador,
    2026-09-13):** el SKU pelado JM962A está AUSENTE de la lista vigente (solo quedan
    variantes localizadas JM962A#xx y el reman JM962AR ya en PLC «ES») — coherente con
    un fin de venta reciente del EC-XS; y JZ878A (EC-L-H) renovó vigencia de List Price
    a 2025-06-01 con PLC GA, señal a favor de seguir vivo. El S0B67A (EC-XL-H-10G) sí
    pasó a PLC «ES» en la lista — coherente con su EOL_ANNOUNCED ya marcado.
    **Afinado el 2026-09-16:** la lista oficial «HPE ARUBA HARDWARE END OF SALE (EoS)»
    (PDF de asp-documents.arubanetworks.com, 25 págs., descargada y leída completa) NO
    incluye ninguna fila EdgeConnect — solo switches y APs legados, así que no confirma
    ni desmiente; el documento que nombraría ambos modelos (EC_LifecyclePolicy_latest.pdf)
    sigue devolviendo 403 (bloqueo Akamai del datacenter, no del documento). Los rastreadores
    de terceros convergen al día exacto y citan el título del anuncio oficial («HPE Aruba
    Networking EdgeConnect L-H Gateway End of Sale Announcement»): JZ878A — anuncio
    2025-06-30, EoS 2025-12-31, fin de soporte 2030-12-31; JM962A — anuncio 2025-06-30,
    EoS 2026-01-31, fin de soporte 2031-01-31. Cómo se cierra: una persona con navegador
    real descarga el PDF de la política de ciclo de vida y confirma esas dos filas (las
    fechas a verificar ya están aquí), y entonces se replica el patrón `EOL_ANNOUNCED`
    del EC-XL. Sin el documento oficial NO se marca (regla de doble anclaje).
17. **~~Equivalencia E-STU de HA para suscripciones On-Premises~~ Resuelto (2026-09-16)**,
    ver *Cerrado recientemente*. El QuickSpecs vigente (a50004289enw) SÍ publica la
    escalera «EdgeConnect On-Premises High Availability E-STU» (8 tiers × 1/3/5/7 años) y
    la lista del distribuidor tarifa los 32 SKU con la invariante de siempre (precio HA
    idéntico al estándar, verificada 32/32). Mapeada en `LICENSES_HA[bw].onprem`; el par
    HA on-prem ya no cotiza 2× estándar. De paso, la verificación cazó 6 términos de 7
    años On-Premises estándar que la revisión del 2026-09-15 había declarado inexistentes
    (formato de descripción distinto): entran con SKU y precio de la lista.
18. **~~Segunda PSU del Gateway 9240: R1C72A o R7J63A~~ Resuelto (2026-09-13)**, ver
    *Cerrado recientemente*. La lista oficial del distribuidor desempata: R1C72A es un
    kit de montaje de APs ($415) y la PSU del 9240 es **R7J63A** ($747 List).
19. **~~Precios de accesorios: catálogo maestro vs partner~~ Resuelto (2026-09-13)**, ver
    *Cerrado recientemente*. Todos los precios de accesorios salen ahora de la lista
    oficial del distribuidor, con vigencia y PLC — el brief de la fase 12 quedó
    corregido por ella (sus cifras eran ~40-60 % más bajas, parecían precio neto).
20. **~~Compatibilidades de accesorios por inferencia de familia~~ Resuelto
    (2026-09-13)**, ver *Cerrado recientemente* («Matriz de accesorios reescrita contra
    la compatibilidad oficial»). La matriz completa salió del VSG SD-Branch, el Hardware
    Reference Guide Rev S, los QuickSpecs EC v18 y 9200 v14 y la Install Guide del
    EC-10150, cruzada con la lista: las inferencias quedaron confirmadas o refutadas una
    a una (JL747B no soportado en toda la línea EC; J4860D/J9285D sin matriz EC; J9153D
    fuera de EC-10108/10150; 25G confirmado en EC-10108; matriz legacy EC-S/M/L/XL
    validada). El test de integridad codifica ahora la matriz oficial SKU por SKU.
21. **~~EC-XS/S/M/L/XL sin accesorios en el catálogo maestro~~ Resuelto (2026-09-13)**,
    ver *Cerrado recientemente*. El EC-XS tiene ya su kit oficial (JM965A, $365) y su
    adaptador de corriente externo (JM996A, $296) — el Accessories Guide PN 201911 Rev F
    confirma que no existe rack kit separado (las orejas van en caja) — y la línea
    anterior tiene su matriz de ópticas validada (JM534A/JM535A + TAA según columna HRG).
22. **VSG inalcanzable en el chequeo de salud desde el sandbox (2026-09-13, fase 11 E5).**
    El nuevo endpoint `GET /api/fuentes/:vendor/salud` y el botón «Comprobar salud de las
    fuentes» funcionan, pero desde este entorno la URL del VSG SD-Branch responde
    inalcanzable (bloqueo de egreso a dominios HPE ya conocido — las GitHub Actions sí la
    alcanzan). No es un fallo del vigía: verificar desde la red del cliente antes de dar
    una fuente por caída.
23. **~~Requisito de almacenamiento Boost en EC-10106/10108~~ Resuelto (2026-09-13)**,
    ver *Cerrado recientemente*. Respuesta oficial del Hardware Reference Guide Rev S:
    EC-10106/10108 llevan un SSD interno de 120 GB **no reemplazable por el usuario** y
    **no tienen slot** de ampliación — no existe kit y no puede existir. Boost corre
    sobre ese SSD interno (hasta 250 Mbps en el 10106 y 500 en el 10108, según los
    datasheets oficiales). Y la lectura anterior de S2N67A quedó corregida del todo:
    «NM» = **Network Memory** — es el «10150/10170 1.6TB Network Memory Drive Kit» del
    QuickSpecs v18 (con él, Boost llega a 8 Gbps en el EC-10150; 1 Gbps sin él), con
    S3R70A/S3P35A como repuestos oficiales. Reclasificado a STORAGE en el catálogo.
24. **1G en EC-10108 y EC-10150: conflicto documental oficial (2026-09-13).** El VSG
    SD-Branch dice NO; el Hardware Reference Guide Rev S y la Install Guide del 10150
    dicen SÍ con restricciones de puerto (solo wan0/wan1). Decisión de la casa: no se
    ofertan ópticas 1G en esos modelos hasta que el distribuidor o HPE TAC desempate —
    ofertar en conflicto documental es apostar el pedido. Cómo se cierra: una respuesta
    escrita del distribuidor/HPE; entonces se añaden las 1G al modelo que proceda y se
    ajusta el test de la matriz.
25. **Transceptores ANW genéricos y EC-SFP-1000BT en la lista, sin matriz para nuestros
    modelos (2026-09-13).** El cruce lista ∩ compatibilidad localizó: **J8177E** «HPE
    ANW 1G SFP RJ45 100m» ($473) y **J9153E** «HPE ANW 10G ER SFP+ 40km» ($11.855 —
    mismo precio que J9153D, vigencia 2026: probable rebranding ANW del mismo
    transceptor), y **R9Y49A** «EC-SFP-1000BT» ($650, 1G cobre marca EdgeConnect,
    confirmado por el VSG solo en EC-M-P — variante que no está en este catálogo; el
    EC-M-H queda sin confirmar). Ninguno entra al catálogo maestro hasta tener plataforma
    confirmada: la regla de la casa es cita literal, no parecido. **Afinado el
    2026-09-16:** el QuickSpecs EdgeConnect vigente (a50004289enw) lista **R9Y49A** bajo
    «EdgeConnect SD-WAN Hub Gateways Options → SFP Transceivers» — confirmación oficial
    de que es transceptor EdgeConnect de HUB (los EC-10150/10170 son hubs): ya hay
    documento oficial, falta decidir el alcance (¿todos los hubs o alguna restricción por
    modelo que el chunk consultado no mostraba?). J9153E es pedible en buy.hpe.com como
    «HPE ANW 10G ER SFP+ LC 40km SMF» mientras el QuickSpecs sigue listando J9153D:
    hipótesis de rebranding reforzada, pendiente de confirmación del distribuidor.
    Cómo se cierra: preguntar al distribuidor si J9153E sustituye a J9153D (y J8177E a
    S3R03A) en las matrices EC/9200, y confirmar la matriz por modelo de R9Y49A.
26. **S0W40A «EC-NX-SSD-A2» no está en la lista del distribuidor (2026-09-13).** El
    Accessories Guide Rev F lo da como repuesto SSD actual de la línea -H (EC-M/L/L-H/
    XL/XL-H, 480 GB), pero no tiene fila en la lista — el catálogo sigue ofertando
    JZ889A (que sí está, $1.207). Si el distribuidor confirma que S0W40A sustituye a
    JZ889A, se añade con el importador y se ajusta la matriz.
27. **~~Variantes de modelo detectadas por el importador — decisión de surtido~~ Resuelto
    (2026-09-15)**, ver *Cerrado recientemente* (plan 4, paquete A). El EC-S del catálogo
    ya era el EC-S-P, así que JM538A ($13.479, canal no-NAL) y JM769A (DC, $15.510)
    entraron como **variantes** del modelo. Fuera a propósito: JM778A (NFR, no vendible)
    y JM538AR (reman). El EC-10170 (hermano del 10150 en el kit S2N67A) sigue sin
    catalogar — ampliar el roster sigue siendo decisión del dueño. Registro original: el
    primer dry-run del importador encontró esos cinco SKU fuera del roster.
28. **~~Suscripciones a 7 años: la lista las tiene, el dimensionador no~~ Resuelto
    (2026-09-15 — el dueño lo pidió)**, ver *Cerrado recientemente* (plan 4, paquete A).
    Cableado donde la lista lo publica, «consultar» donde no, nunca inventado. Registro
    original: la lista oficial trae términos de 1, 3, 5 **y 7 años** para Advanced,
    On-Prem y Advanced HA; el dimensionador modelaba solo 1/3/5.
29. **~~SSE (R8M36AAE) sin List Price~~ Resuelto operativamente (2026-09-14).** El SKU sigue
    sin precio en la lista (eso no cambia: si aparece, el importador lo detecta), pero el
    ciclo ya se cierra en la herramienta: toda línea sin precio verificado queda marcada
    «PENDIENTE DE COTIZACIÓN» en el BOM, enumerada en la nota al pie y en sección propia
    del Excel y del texto plano — lo que se entrega al distribuidor ya no admite olvido.
30. **~~Fórmula IMIX del widget: coeficientes del brief, no oficiales~~ Resuelto
    (2026-09-13).** El dueño envió el brief carrier-grade con la función determinista
    `calcularRequerimientosIngenieria` («reemplazar cualquier comparación directa»): hay
    UNA sola regla — IMIX 0,70/0,55/1,00 por perfil de tráfico, FEC 5/15/25 %, cargo de
    seguridad 0/5/35 % y margen — implementada en `public/js/motor-ingenieria.js`. Los
    anchors oficiales previos (FEC 10/25 % VSG, SLA de enlace 75 %) quedan referenciados
    en comentarios; el slider de margen conserva el default 30 % por el ancla SLA 75 %
    (el 20 % del brief es el mínimo documentado). Ver *Cerrado recientemente*.
31. **~~DTD: licencia aparte y ahora TAMBIÉN cotizada~~ Resuelto (2026-09-14).** Se mantiene
    la regla oficial (QuickSpecs p.32: DTD no fuerza Advanced). Y al cruzarlo con la lista
    resultó que DTD SÍ tiene escalera de SKU con precio (plano por appliance, SaaS/On-Prem
    × estándar/HA × 1/3/5 años — $372/$1.116/$1.860, PLC GA): con la estrategia «En el
    chasis — DTD» el BOM añade la línea con su SKU y precio reales (2 líneas en HA 1+1,
    patrón de las demás suscripciones). Los términos de 7 años y los SKU de evaluación a
    $0 quedan fuera con comentario (ver 28).
32. **~~Títulos de columna del BOM: «LIST/NET» vs «Lista/Neto»~~ Resuelto
    (2026-09-15)**, ver *Cerrado recientemente* (plan 4, paquete A). `bom.js` unificado
    al criterio del pie de TCO —«Subtotal Lista/Neto», «Unit. Neto», totales Lista/Neto—
    en tabla, Excel y texto plano. El archivo es compartido por los 7 fabricantes, pero
    es etiqueta y no cifra, así que era seguro tocarlo.
39. **~~El brief carrier-grade llegó truncado~~ Cerrado por ejecución de arquitecto
    (2026-09-14).** El dueño autorizó avanzar sin las secciones 2-4; se diseñaron e
    implementaron con criterio propio: (Frontend) rediseño carrier-grade del builder de
    underlay WAN — filas tarjeta con badge por familia, toggle simétrico, duplicar,
    validación inline, sugerencia de medio, barra agregada viva #wanResumen con semáforo
    de densidad de puertos; (Lógica SP) campos cliente/proyecto que encabezan BOM y Excel
    y enlace compartible del escenario (con el bug de round-trip de secMode corregido);
    (Componentes) todo con los IDs de contrato intactos. Si el brief original reaparece,
    lo que llegue se cruza con lo construido.
40. **~~La batería E2E vivía en /tmp y moría con la sesión~~ Resuelto (2026-09-15)**,
    ver *Cerrado recientemente* (plan 4, paquete C). `npm run e2e` corre cinco guiones
    (regresión, sticky, ópticas SFP, candidatos, UX — 51 comprobaciones) contra un
    servidor propio con base SQLite desechable. Fuera de `verificar` a propósito
    (exige Chromium); el workflow de CI que la correría en cada push se entrega en
    parche (`e2e-ci.patch`) porque el token en uso no tiene scope «workflow» —
    aplicarlo es acción manual del dueño, junto a la de 33.

33. **Railway no espera a CI (reformulado el 2026-09-24).** *Segundo intento el 2026-09-24, con
    autorización expresa del dueño: tampoco fue posible. `describe-service` confirma
    `checkSuites: false`; el conector de Railway no tiene ninguna herramienta que toque ese campo
    y su agente volvió a responder «Agent usage limit reached» dos veces. Queda como un clic del
    dueño, con los pasos, el requisito de permisos de la GitHub App y el análisis de los
    workflows (qué correrá, qué no puede bloquearse y el caso límite de la vigía) en
    `docs/decisiones-del-dueno-2026-09-24.md`, sección 1.* *Medido el 2026-09-23: el servicio
    `presales-web` tiene `source.checkSuites: false`, así que no espera ni a `verificar` ni a
    `pantallas` — el despliegue `dcb662d9` se creó antes de que `verificar` arrancara. **La
    acción que lo cierra es activar «Wait for CI»** en los ajustes del origen del servicio en
    Railway; con eso, un workflow en rojo salta el despliegue. Un required check de GitHub no lo
    arregla solo: no frena lo que Railway no espera. Se intentó activar desde la sesión y no fue
    posible (el agente de Railway rechazó por límite de uso y el control de permisos denegó
    seguir por otra vía): es un clic del dueño. **Desde el 2026-09-24 ese clic frenaría tres
    cosas y no dos**: el job de `pantallas` lleva ahora las pantallas, el contraste y la batería
    e2e, y su paso de contraste ya puede fallar (antes `| tee` sin `pipefail` lo dejaba siempre
    en verde). El coste es que cada despliegue espera a ese job, el más lento de los workflows
    (ver *Cerrado recientemente*).* Texto de la entrada original:
    **Railway no espera a `pantallas`, solo a `verificar` (2026-09-13).** *Actualizado el
    2026-09-14: hay un segundo agujero, de otra clase, y ya está cerrado — un push de bot no
    creaba ningún check, así que Railway no esperaba a nada. Un required check tampoco lo
    habría cerrado: un push que no crea ningún check no puede fallarlo. El vigía abre PR desde
    hoy. Ver `CLAUDE.md`, sección Deploying.*
    Medido, no supuesto:
    el commit `7fe786e` desplegó con estado SUCCESS teniendo la comprobación de navegador en
    rojo desde hacía cuatro días — el dimensionador Aruba llevaba ese tiempo sin que nadie lo
    condujera. La cabecera de `.github/workflows/pantallas.yml` afirma «ESTE CHECK FRENA EL
    DESPLIEGUE, a proposito» y **no es cierto**, así que la red es más fina de lo que el propio
    repositorio cree. Un documento que promete una protección que no existe es peor que no
    prometer nada. **Decisión del dueño:** convertir `pantallas` en *required check* de la rama
    `main` (ajuste de GitHub, no de código) y corregir esa cabecera, o aceptar que solo frena
    `verificar` y decirlo en los dos sitios. `CLAUDE.md` ya lo declara como está hoy.
    *2026-09-14: la cabecera de `pantallas.yml` ya dice la verdad (qué frena y qué no, y que
    el required check es un ajuste manual de GitHub). Queda abierta SOLO esa acción manual
    del dueño en la configuración del repo.*

34. **El semáforo de ciclo de vida pintaría verde falso sobre 131 modelos (2026-09-13).**
    Sale de la revisión de portabilidad (`docs/portabilidad-aruba.md`). Solo Cisco (8/21),
    Juniper (2/12) y Aruba (1/25) tienen boletín de fin de venta **con fecha**. Huawei,
    MikroTik y Nokia tienen cero, y Fortinet marca cuatro modelos como `eol` **binario** en
    `FORTINET_EOL_MODELS`, sin fecha: nunca encendería el naranja de «fin de venta anunciado».
    Portar el semáforo tal cual afirmaría «vigente» sobre 131 modelos que nadie ha comprobado
    —el mismo error que el «IPS: no aplica» del Catalyst 8300, y más caro, porque lo que se
    afirma es que un equipo se puede pedir. **Regla al portarlo:** se enciende solo donde hay
    `eolAnnounced` con fecha; donde no, declara «el catálogo no trae el ciclo de vida», que es
    el tercer estado que ya protege `redund`. Cerrarlo de verdad exige cargar los boletines,
    y para Huawei eso es el pendiente 14, bloqueado por Akamai. *2026-09-14: la regla ya
    estaba escrita en `docs/portabilidad-aruba.md` y ahora además está FIJADA EN TEST
    (`test/ciclo-de-vida-datos.test.js`): ningún modelo de los 189 afirma vigencia sin
    boletín con fecha; todo `eolAnnounced` trae `lastOrder` parseable. La carga de los
    boletines que faltan sigue pendiente (14 para Huawei). Cerrado como REGLA; abierto
    como DATO.* **2026-09-16: cerrado también como PANTALLA.** El semáforo existía solo
    dentro de `dimensionador-aruba-edgeconnect.js` y su rama por defecto era **verde**, así
    que no era que portarlo fuera a pintar verde falso: **ya lo estaba pintando** sobre sus
    propios 25 modelos. Ahora vive en `FICHA.cicloHtml` y lo usan los siete, con **cinco
    estados**: fuera de venta (fecha vencida, o `eol` binario declarando que no hay fecha),
    fin de venta **anunciado y todavía pedible**, línea anterior, vigente, y el tercer estado.
    **El verde se gana, no se hereda:** solo lo enciende un fabricante cuya `legacyData/
    fuentes.js` declare en `campos` que alguna fuente respalda `eolAnnounced` —hoy **Cisco y
    Juniper**, y la ficha dice contra qué documento y de qué fecha—; los otros cinco declaran
    «el catálogo no trae el ciclo de vida». Se reutiliza esa declaración en vez de escribir
    una segunda lista de fabricantes, que es como se desincronizan dos sitios con el mismo
    dato. De paso corrige un defecto que la copia de Aruba tenía y `FICHA.rango()` no: pintaba
    de rojo un fin de venta anunciado **que aún no había vencido**, cuando hasta esa fecha el
    equipo se pide con normalidad — la misma página se contradecía. `test/ciclo-de-vida-
    semaforo.test.js` (9 casos) lo fija, y se comprobó saboteando: devolviendo el verde a rama
    por defecto caen 2 de 9 nombrando el motivo. **Sigue abierto como DATO**: cerrarlo del todo
    es cargar los boletines que faltan (14 para Huawei, bloqueado por Akamai).

35. **~~La auditoría de puertos de Nokia es la mejor de las ocho y no se ve~~ Resuelto
    (2026-09-16).** La regla subió a `FICHA.seccionPuertos` y la usan los siete. Lo que Nokia
    aporta —y ningún otro catálogo tenía resuelto— son dos cosas: **las configuraciones son
    alternativas y no acumulables** («36x100GE o 12x400GE» nunca son 48 interfaces) y **un
    chasis modular no publica densidad** («7 slots IOM» dice cuántas tarjetas caben, no
    cuántos puertos salen), así que se aparta con su motivo. **Los otros seis no reciben un
    panel vacío:** sus catálogos traen los puertos como texto libre (`ports` en Cisco/Huawei/
    MikroTik, `ifaces` en Fortinet/Juniper/Aruba), la sección los muestra y **declara** que no
    están estructurados y que por eso no se puede contrastar densidad contra un requerimiento
    — la diferencia entre «este equipo no tiene puertos» y «el catálogo no sabe contarlos».
    Una regla nueva salió de moverla: **una `notaPuertos` explícita gana al texto libre**,
    porque el 7250 IXR-e publica velocidades pero no densidad y pintar su `ifaces` al lado de
    esa nota lo haría leer como una densidad. **No audita nada contra un escenario**: la de
    Aruba (cuántos enlaces declarados caben en el chasis) responde otra pregunta y se queda en
    su página — mezclarlas habría metido un motor de cálculo en un módulo de presentación.
    Probado con `npm run contraste -- nokia-sr` contra la línea base **medida antes de mover
    nada**, que cazó dos tildes perdidas en texto visible. `test/nokia-puertos.test.js` pasó
    sin tocar una sola aserción, que es la mejor señal de que cambió de domicilio y no de
    contenido.

    *Texto original del pendiente:*
    También de la revisión de portabilidad. `legacyData/nokia.js` ya modela las configuraciones
    de puertos como **alternativas y no acumulables** —«36x100GE o 12x400GE» nunca son 48
    interfaces— y aparta los chasis modulares que no publican densidad. Es más rica que la que
    el refactor estrenó en Aruba, y no está en ninguna pantalla. El flujo no es «Aruba enseña a
    los siete»: la capa común es algo a lo que cada fabricante aporta lo que ya resolvió.
    Coste bajo, no toca ningún motor de cálculo.

36. **~~El Fortinet Product Matrix se republicó y nadie lo ha leído~~ Resuelto (2026-09-14).**
    Se trajo con `traer-fortinet-matrix.yml` (los ejecutores de Actions sí alcanzan
    fortinet.com) y se leyó entero: sha256 `242a6eba…`, 123.387 bytes, exactamente lo que el
    vigía había marcado. **Es una edición nueva de verdad** —`PRQMTX-2026-R176-SEP`,
    septiembre de 2026, frente a la de julio con la que se transcribió— y por eso sube la
    fecha de procedencia, que decía «2026-07» en pantalla. **Pero ninguna cifra que el
    catálogo use se movió:** 27 modelos FortiGate x 7 campos = 189 comparaciones, 189
    coincidencias, 0 diferencias, y ni un modelo nuevo ni uno que desaparezca. La lectura se
    sometió al doble anclaje de `npm run cps` (27 filas aceptadas, 0 rechazadas) y se
    comprobó que ese anclaje sigue vivo desplazando a propósito la fila del 90G a los valores
    del 200G, que sí fue rechazada. De paso corrigió una afirmación de `CLAUDE.md`: este
    documento publica «Power Supplies» (tipo y número, que respalda `redund`) y **no**
    vatios.

37. **~~El boletín EOL de Cisco: sospecha de `estable: true` mal clasificado~~ Resuelto
    (2026-09-14), midiéndolo.** La sospecha era correcta y la medición encontró **los dos
    errores posibles a la vez**. `npm run vigia -- --sondeo`, nuevo, pide cada URL dos veces
    con segundos de diferencia —lo que cambie entre ellas no puede ser un cambio del
    fabricante— y compara los bytes y el texto por separado. Desde Actions:

    - el **boletín EOL de Cisco**, declarado `estable: true`, devolvió los mismos 173.911
      bytes con **hash distinto** y el **mismo texto**: sus tres semanas de «cambios» eran
      alarmas falsas. Marcado revisado con esa evidencia;
    - el **EOL de Juniper**, declarado `estable: false`, devolvió bytes y hash idénticos:
      estaba **callado sin motivo**, así que un boletín nuevo de fin de venta se habría
      reportado como «varió (página dinámica)» y nadie se habría enterado. Corregido a
      `estable: true`.

    De ahí sale el arreglo general: el vigía vigila ahora el **texto** en las fuentes HTML y
    los bytes en los PDF. Lo que **no** se midió es la estabilidad de un día para otro —dos
    peticiones con 15 s de diferencia no dicen nada de eso—, así que MikroTik, las páginas de
    HPE y la de Nokia siguen en `estable: false` hasta que las corridas semanales acumulen
    evidencia. Medir una cosa y afirmar otra es exactamente como se llega a un campo puesto a
    ojo.

38. **~~Tres fuentes siguen dando 403 incluso desde GitHub Actions~~ Eran dos cosas
    distintas, y la medición lo separó (2026-09-16).** La conclusión anterior —«no es el proxy
    de este entorno, así que es una restricción del propio fabricante»— **estaba deducida, no
    medida**, y en 2 de los 3 casos era falsa. Las tres URL terminaban en `/`: no eran
    documentos sino **directorios**, y un CDN niega un listado de directorio por configuración
    sin bloquear a nadie. Las dos hipótesis se distinguen con un **grupo de control**, que es
    lo que añade `scripts/probar-candidatas.js` (+ `candidatas-fuentes.yml`): junto a cada URL
    bloqueada se pide un **archivo** del mismo dominio —y donde se puede, del mismo
    directorio— que este repositorio ya sabe que se descarga. Medido desde un ejecutor:

    | Fuente | Carpeta | Control | Veredicto |
    |---|---|---|---|
    | Juniper · *hardware guides* (`redund`/`psu`) | 403 | matriz SRX **200** | **forma de la URL** |
    | Juniper · fichas 2024 (`fwImix`/`ips`/`atp`) | 403 | mismo directorio, PDF **200** | **forma de la URL** |
    | HPE · Validated Solution Guide | 403 | Hardware Reference **403** | **el fabricante** |

    Las dos de Juniper **se corrigieron con documentos que responden**:
    `…/hardware/srx1600/index.html` (200) y `…/security/srx1600-firewall-datasheet.pdf` (200,
    PDF real de 484 KB; el del SRX4300 también responde y sigue el mismo patrón). Van con su
    `cubre` ajustado: el vigía mira **una URL por fuente**, así que ahora vigila un modelo de
    los doce y una ficha de las tres — menos de lo que la entrada prometía antes, y más de lo
    que de verdad hacía, que era **nada**, porque una carpeta no se puede leer nunca.

    **La de HPE sigue abierta, y ahora con evidencia en vez de con una suposición.** La URL
    **se deja como carpeta a propósito**: apuntarla al PDF concreto alinearía las dos
    declaraciones del repositorio (`fuentes.js` vigila la carpeta y `aruba.js` declara el PDF
    en `DATASHEETS.sdBranchVsg`), pero un `.pdf` obliga a `estable: true` —se vigila por
    bytes— y de la estabilidad de ese documento no hay ninguna medición porque nadie puede
    leerlo. Declararla sería el campo puesto a ojo que este repositorio persigue. Cierra desde
    una máquina con acceso a los dominios de HPE.
41. **Fotos oficiales de los modelos legacy (2026-09-16, nace con la tarjeta gráfica de la
    ficha; CERRADO PARCIAL el mismo día).** ~~EC-S, EC-M, EC-L, EC-XL~~ y ~~EC-V~~
    resueltos: el supuesto original («el Hardware Reference solo publica las variantes
    -P/-H») era FALSO — el documento tiene secciones propias del modelo base con sus
    vistas «— Front View»/«— Rear View»: EC-S p.55, EC-M p.63, EC-L p.77, EC-XL p.92
    (Rev V, ago-2026, ya versionado en `public/datasheets/`). Extraídas, recortadas y
    servidas en WebP con su atribución en `aruba-vistas-equipos.json`; la figura
    frontal de EC-L y EC-XL es byte a byte LA MISMA en el documento oficial (pp.77 y
    92), así que ambos modelos citan un único archivo `ec-lxl-front.webp` con la
    doble página declarada. El EC-V, al no tener chasis, lleva pictograma propio
    rotulado «REPRESENTACIÓN — NO ES UNA FOTO». Esos documentos no publican las
    dimensiones de los legacy: el pie declara el peso (catálogo) y dice que las
    dimensiones no están en el repo. **Sigue abierto: serie 7000/7200** — no hay
    fuente oficial con fotos en el repo y el egreso a los dominios de HPE está
    bloqueado desde el sandbox (2026-09-16); cierra bajando el DS oficial de la
    serie 7000/7200 desde una máquina con acceso y repitiendo este mismo patrón.

## Limpieza

11. **Nada abierto.** Los cuatro puntos que vivían aquí (el sufijo `-v3_1`, el conjunto
    `CISCO_EOL_MODELS` inerte, la falta de lint y pruebas, y las skills a medio instalar) se
    cerraron en agosto de 2026 — ver *Cerrado recientemente*. Lo que dejó esa limpieza es la
    forma de que no vuelvan: `npm run verificar` antes de empujar, y un aviso en el arranque
    cuando un conjunto de fuera de venta deja de casar con el catálogo.

## Decisiones que necesitan al dueño del producto

**Las cuatro primeras están preparadas para resolverse en minutos en
`docs/decisiones-del-dueno-2026-09-24.md`** (también publicado como página privada,
<https://claude.ai/artifact/Sw97q5rDmJ5KJCYbB2PWXJ>, que su dueño comparte), con los pasos, lo
que ya se comprobó y lo que cuesta cada opción.

- **Activar «Wait for CI» en Railway** (`presales-web` → *Settings* → *Source*). Medido el
  2026-09-24: `source.checkSuites: false`. **Desde la sesión no se pudo, y se intentó con
  autorización expresa del dueño**: el conector de Railway no expone ese ajuste y su agente
  respondió dos veces «Agent usage limit reached»; no hay CLI ni token en el contenedor. **Se
  comprobó que funcionará a la primera**: solo `verificar.yml` y `pantallas.yml` corren en push a
  `main`, los dos con el `on: push` que Railway exige, ninguno cancela corridas por
  `concurrency`, y la sonda es manual. Caso límite anotado: la vigía de los lunes. Coste: 6-7,5
  minutos por despliegue, lo que tarda el job de `pantallas` (pantallas, contraste y batería
  e2e), el más lento: esa espera es el precio de que un flujo roto no llegue a producción.
  Cierra el punto 33 y la condición 4 del GO.
- ~~**Leer `fuente/fortinet-pendientes`, o conceder permiso para leerla.**~~ **Hecho el
  2026-09-24** con el «sí» del dueño. Tal como estaba no traía ningún documento: sus 15 URL se
  habían adivinado por patrón y dieron 404 (otra sesión la leyó en ese estado y llegó a lo mismo).
  Buscadas las reales, tres corridas (`35991156286`, `35997261950` y `35997486119`) trajeron 12
  documentos oficiales, y de ellos salieron F2, los límites de 100F y 200F, R1, R2 y los SKU de
  EMS y FortiSASE (ver *Cerrado recientemente*).
- **M4 de Aruba**: si la descarga del breakout se limita a la capacidad de Internet. **Medido**:
  solo mueve el Boost (en MPLS 1.000 + DIA 100, 1 bloque con la regla actual frente a 3
  limitada). **Recomendación: limitarla**; decide el dueño. Ver la sección de Aruba.
- **Aprobación de arquitectura Fortinet** sobre `docs/auditoria-fortinet-2026-09-23/motor-y-bom.md`,
  que es la condición 1 del GO CONDICIONADO. Lista de comprobación en el documento de decisiones.
- **Prueba con un lector de pantalla real** (NVDA o VoiceOver): guion de diez tareas con lo que
  debería oírse y qué parte ya está automatizada, en el mismo documento.
- **Si `agent-reach` se activa de verdad, con qué credenciales** (2026-09-22). La skill está
  instalada y declarada, pero **no se ha configurado ningún canal con login**, y esa parte no
  es un `npm install`: pide cookies de Twitter (`TWITTER_AUTH_TOKEN`, `TWITTER_CT0`), un
  Chrome dedicado con el puerto de depuración `127.0.0.1:9222` para Boss直聘, y la sesión de
  Chrome del usuario para Xiaohongshu, Facebook e Instagram. En su descargo, el upstream
  declara sus límites (nada de `sudo` sin permiso, nada fuera de `~/.agent-reach/`), y su
  guía de instalación se sigue **desde una URL remota** que puede cambiar cualquier día —se
  leyó la del commit `a19a171`—. Desde este entorno la pregunta es teórica (todo bloqueado);
  desde una máquina con salida, decide el dueño. Los seis canales «zero-config» (búsqueda web
  Exa, GitHub, YouTube, RSS, lectura de páginas, V2EX) no piden ninguna credencial.


14. **Nada abierto por ahora.** El único punto que vivía aquí (el nombre de usuario sin
    normalizar) se cerró el 2026-09-02 — ver *Cerrado recientemente*.

## Cerrado recientemente

### Integración del módulo canónico Starlink LEO v1.0.0 (2026-09-24)

El pendiente que llevaba semanas bloqueado por «los archivos no están ni en el entorno, ni en
GitHub, ni en Drive» se cerró cuando el dueño subió la carpeta `starlink-leo-dimensionador/` al
repositorio. Los seis SHA-256 del prompt maestro de integración verificaron exactos byte a byte
antes de tocar nada; el motor (`app.js`) se sirve sin una sola línea distinta en
`public/js/dimensionador-starlink-leo.js`, y ese mismo archivo es el que
`server/services/starlinkSizing.js` `require()` para `POST /api/sizing/starlink` — un solo
motor, no dos implementaciones que puedan divergir. Reemplaza por completo el dimensionador
anterior (cinco kits sin precio, escrito desde cero cuando los archivos no aparecían) por el
canónico (dos kits, catálogo COP real, formulario de nueve secciones con recálculo en vivo).

Verificado: las 47 aserciones canónicas siguen pasando sin tocarlas (`test/starlink-motor.test.js`
las corre como línea base), más una matriz propia (T17/T18 diversidad, T19/T20 mínimos de
arquitectura, T31 sin tráfico, T33 confianza, T41/T42 UPS/energía, saneo del backend contra
entradas hostiles del prompt sección 19) y la paridad frontend/backend contra el servidor real.
Probado a mano en Chromium: login → botón «BOM Starlink» → recálculo en vivo al cambiar usuarios
(el plan salta de 1 TB a 6 TB, terminales de 7 a 11) → `/api/sizing/starlink` devuelve
exactamente lo mismo que `window.StarlinkDimensioner.getResult()` en la misma sesión → BOM de 9
líneas correctas. Cero errores de consola. `npm run verificar` en 590/590. Detalle completo,
alcance de lo automatizado y lo verificado a mano en la sección de Starlink más arriba.

### Los precios de Fortinet, solo de la 2026Q3 Mid Price list (2026-09-24)

Regla del dueño: «Recuerda que los precios debes tomarlos de 2026Q3 Mid Price
list_AMER_FINAL_EFF 090726.xlsx». Se auditó cada precio de Fortinet que puede llegar a una
línea del BOM o del cotizador, buscándolo por su SKU exacto, con el término resuelto, en lo que
`npm run skus` extrajo de esa lista.

- **Casan 1.818 precios** de licencias, soporte, SKU combinados, SD-WAN Service, mejora a
  Elite, sandbox y registro en la nube, y los **54 de hardware** del cotizador por su `hwSku`.
  **Ninguno difiere.**
- **Dos cosas no cumplían, y se corrigieron:**
  - **17 precios de la «Main» de agosto** seguían en el catálogo, marcados `anterior`: las
    renovaciones UTP, ATP y FortiCare de 70F, 100F, 200F y 600F. Ahora salen **sin precio**
    («consultar»), con su SKU exacto, marcados `fueraDeLista` y en borrador. No se sabe si la
    lista de septiembre los trae: `npm run skus` no extrae el bloque de un modelo sin SKU de
    hardware vigente.
  - **FortiConverter** llevaba el patrón `-DD`, y la línea le aplicaba el término de la
    cotización. A 3 y 5 años emitía `…-189-02-36` y `-60`, que la lista no tiene, con el precio
    del de 12 meses. La lista lo publica una sola vez por modelo («1 Year FCT SVC», 93 filas,
    todas `-12`), y ese es ahora su SKU. Los cuatro modelos sin bloque se quedan sin él.
- **Lo guarda una invariante**, «regla del dueño» en `test/fortinet-precios.test.js`: todo
  precio que puede llegar a una línea tiene que existir en la lista con la misma cifra. **Se
  comprobó saboteando**: con el precio de agosto conservado saltan tres pruebas, y sin el
  anclaje de FortiConverter, otras tres.
- **Se buscó el `.xlsx` en Drive y en el correo del dueño, y no está** en ninguno de los dos,
  ni en el repositorio. Por eso lo que falta (esas 17 líneas, EMS y FortiSASE) no se pudo sacar
  hoy de la lista: se cierra pasándola por un importador que extraiga esas filas por SKU exacto.
- **Verificación**: 598 pruebas y lint, 17/17 pantallas, 7/7 contrastes y 15/15 baterías e2e.
  En pantalla, la línea de FortiConverter a 3 años ya sale como `FC-10-0071F-189-02-12`.
- **En producción el 2026-09-24**: `main` avanzó de `b04def5` a `cf7d47e` (el cambio es
  `63bb74e`). Railway `edb4afcd` en SUCCESS con `[seed]` y `Presales corriendo en`; `verificar`
  (`36038065110`) y `pantallas` (`36038065108`, con contraste y e2e) en verde sobre ese commit,
  y la sonda (`36038496822`) dio `/salud` 200 con 7 fabricantes y 228 modelos, y `/login` 200.

### Los documentos pendientes de Fortinet, traídos y leídos (2026-09-24)

Encargo del dueño, con un «sí» explícito para leer la rama de transporte que el control de
permisos había denegado. Corrió en paralelo con la entrega de otra sesión (la entrada siguiente),
y las dos se fusionaron el mismo día: donde llegaron a lo mismo por caminos distintos, las dos
lecturas se citan como anclas; donde una llegó más lejos, manda esa y se dice.

- **La rama no traía nada.** `fuente/fortinet-pendientes` (corrida `35934676181`) solo tenía el
  informe de la corrida: las 15 URL del workflow se habían **adivinado por patrón** y dieron 404
  todas. Se buscaron las reales, y tres corridas nuevas (`35991156286` sobre `main`;
  `35997261950` y `35997486119` sobre la rama de trabajo, sin tocar producción) trajeron **12
  documentos**, validados por la firma del contenido y, en la página web, por su texto:
  - las fichas por serie del 100F y el 200F;
  - los System Guide del 7081F y el 7121F;
  - los Ordering Guides de FortiGuard, Secure SD-WAN, FortiClient, FortiSASE, FortiSandbox y
    FortiAnalyzer;
  - las Release Notes de FortiOS 7.6.0 y 7.6.3.
- **F6, los datos.** El 100F y el 200F no tienen ficha en inglés en ninguna ruta, pero la
  **coreana oficial** sigue en el CDN de fortinet.com.
  - Su tabla se reconstruyó por coordenadas y se ancló con seis cifras ya verificadas por fila:
    12 de 12.
  - Entran `cps` (56.000 y 280.000) y los siete límites. `cps` y `ssl` pasan a 58 de 58.
  - El consumo del 100F **no** casa con esa revisión de 2023 y sigue saliendo de la de 2025.
- **F6, las figuras.** Las dos sesiones sacaron figuras para los cuatro modelos. Se sirven las de
  la otra (QuickStart Guide del 100F y del 200F, System Guide de los chasis): el dibujo de la
  ficha coreana del 100F rotula un 212F, y el de la QuickStart un 101F de la misma serie. Los
  System Guide del transporte son la misma versión y rotulan las mismas páginas que los que ella
  leyó, y casan también sus dos citas nuevas del 7121F (hasta ocho fuentes, p. 8; cuántas hacen
  falta, p. 24). Las dos QuickStart se trajeron después por el transporte (corrida
  `36033165475`), sin URL que la otra sesión hubiera guardado: casan en página y rótulo, y la
  figura servida es exactamente su dibujo.
- **F2, cerrado entero.** Los tres servicios avanzados de SD-WAN no son tres líneas: son **un
  SKU por equipo**, el SD-WAN Service add-on.
  - **SKU y precio salen de la lista firmada**, en 54 de 58 modelos; la familia se contrasta con
    el Ordering Guide y casa en los 23 que tabula. En 70G, 200G y 4800F el documento imprime otro
    código de modelo: manda la lista, y la línea lo dice.
  - **Un error propio, corregido antes de desplegar.** La primera versión dejaba la línea sin
    precio y afirmaba que la lista no traía estos SKU. Buscó con el marcador `-DD` del
    documento, y la lista guarda el término resuelto (`-02-36`). Lo destapó la fusión: la otra
    sesión había contado dos candidatos por modelo en la lista. **Probado saboteando**: con la
    búsqueda aceptando cualquier código, el SKU seguía bien y el precio salía de una variante; la
    prueba de entonces pasaba en verde, y ahora compara el precio de cada término con su fila.
  - Ese SKU ya incluye plazas de FortiSASE, y se avisa para no pagarlas dos veces. Los dos
    documentos oficiales **discrepan** en el último tramo, y el aviso cita los dos.
- **EMS y FortiSASE con SKU exacto.**
  - EMS se reparte en packs de 25, 500, 2.000 y 10.000 endpoints, en la nube o on-premise.
  - FortiSASE va por edición y por banda de usuarios.
  - La pantalla pregunta el despliegue de EMS y la edición de FortiSASE.
  - **Su precio no está en el catálogo**, y es lo único que se afirma: `npm run skus` solo extrae
    las filas de la lista que nombran un FortiGate, y estas no nombran ninguno. La frase «la
    price list no los trae», que estuvo escrita, no se podía sostener y se retiró.
- **Condición 2 del GO, cerrada.** La regla de SSL-VPN de 7.6.3+ pasa a leída. La de 7.6.0 deja
  de ser «desconocida»: las Release Notes dan la lista cerrada de modelos de 2 GB de RAM.
- **La matriz de bundles FortiGuard, leída columna a columna, coincide con `BUNDLES.incluye`.**
  El sandbox en la nube va incluido en los tres bundles, y su aviso deja de advertir y cita la
  fuente.
- **Lo que se destapó al llegar el dato.** Varias pruebas se quedaron sin sujeto, y **el
  contraste `fortinet-ssl` pasaba en falso** («ninguno de los 0 sin cifra aparece»).
  - Ninguna se ablandó.
  - Las unitarias prueban la misma regla sobre el modelo con el dato **borrado**.
  - El contraste y los e2e interceptan la API para recrear el hueco, y fallan si la
    intercepción no se aplica. Se comprobó saboteándola.
- **Lo que no se pudo: «Wait for CI».** Ver *Decisiones que necesitan al dueño*. Se reintentó
  al cerrar la entrega y el agente de Railway sigue respondiendo «Agent usage limit reached».
- **En producción el 2026-09-24.** `main` avanzó de `422defa` a `6af3e07` (la fusión es
  `a5ec504`). Railway `7c40150d` en SUCCESS, con `[seed]` y `Presales corriendo en` en el
  registro del contenedor. Sobre ese commit, `verificar` (`36034613497`) y `pantallas`
  (`36034613654`: pantallas, contraste y e2e, 6 min 41 s) en verde, y la sonda (`36034760896`)
  dio `/salud` 200 con 7 fabricantes y 228 modelos, y `/login` 200. **Y lo midió otra vez**:
  el despliegue se creó a las 17:29:03 y quedó en SUCCESS a las 17:29:59, antes de que
  `pantallas` terminara (17:35:49). Hasta que se active «Wait for CI», un rojo ahí no lo frena.

### Validación de pendientes: Boost por escenario, las cuatro figuras de F6, R1 y R2 en parte (2026-09-24)

**Nota de la fusión (mismo día).** Esta entrega corrió en paralelo con la de arriba y se fusionó
con ella. Se conserva tal cual lo que es suyo: el Boost por escenario, las cuatro figuras y el
máximo de fuentes del 7121F; las figuras de los chasis y ese máximo casan además con las copias
del transporte. Tres de sus conclusiones quedaron superadas por documentos que trajo la otra:
- **R2 se cerró entero**: las Release Notes de 7.6.0 traen la lista cerrada, y el resto de los
  modelos queda soportado. La p. 16 de las de 7.6.3 es el aviso de las funciones proxy.
- **F2 se cerró, con precio**: el Ordering Guide dice qué familia es el add-on, y los dos
  candidatos que esta entrega encontró en la lista son justo el bundle y el add-on.
- **Los límites de 100F y 200F sí tienen fuente oficial**: la ficha coreana, en el CDN de
  fortinet.com. No es una copia archivada.

Encargo del dueño: «valida los pendientes y ejecútalos si es que ya no se realizaron». Se
validó cada uno contra `main` antes de tocar nada, y la mitad del trabajo fue descubrir que
algunos «bloqueos» no eran lo que decía el registro.

**1 · Aruba: el Boost toma el escenario que más túnel pide.** `fa25c7a` cerró el M9 dimensionando
caudal, tier **y Boost** con la operación normal, y su comentario afirmaba que ninguna falla
supera a la normal. Es cierto en caudal y falso en Boost: con breakout, el túnel es el 30 % del
caudal solo mientras quede Internet. Medido con el propio código de `main`: MPLS 500 + DIA 500
con un MPLS 500 de respaldo pide 300 Mbps de túnel en operación normal y **1.000** si cae el DIA
(Boost 90 → 300 Mbps, 1 → 3 bloques). La prueba de propiedad del M9 comprobaba caudal y
throughput de diseño, nunca el túnel, y por eso no lo vio. `ArubaReglas.escenarioBoost()` toma
el máximo y, en empate, la normal; sin respaldos solo existe la normal, así que ningún sitio
sin respaldo cambia (contraste `aruba-underlay` en verde, incluido su escenario con Boost). La
ficha dice qué falla gobierna el Boost. **Comprobado saboteando**: con el Boost otra vez sobre
la normal, `e2e-aruba-respaldo` sale en rojo.

**2 · F6 cerrado: los cuatro FortiGate sin figura la tienen.** Primero, lo que había: la rama
`fuente/fortinet-pendientes`, cuyo permiso de lectura figuraba como decisión del dueño, **no
traía ningún documento**, solo un `informe.json` con los cinco intentos en 404. Las rutas del
workflow estaban mal, y los datasheets de 100F y 200F dan 404 **también desde internet abierto**:
Fortinet ya no los publica, así que no había datasheet que esperar. Desde una máquina sin el
proxy se localizaron las guías oficiales de hardware en docs.fortinet.com y se leyeron:
- **100F**: QuickStart Guide, p. 5 «Front/Rear - FG 100F Series». El chasis dibujado lleva el
  rótulo **FortiGate 101F**, y el pie lo dice.
- **200F**: QuickStart Guide, p. 6 «Front/Rear - FG 200F Series».
- **7081F**: System Guide 7.0.5, p. 8 «front panel» y p. 12 «back panel».
- **7121F**: System Guide 7.4.4, p. 9 «generation 1 front panel» y p. 13 «back panel».

En las QuickStart la cara se decidió con la misma ancla que los otros 54: la trasera es la de
«Redundant Power Supplies». Se recortaron del vector y van en WebP calidad 82, como las
existentes (unos 700 KB los ocho ficheros). **58 de 58 modelos tienen figura**: 54 de datasheet
y 4 de guía oficial. La prueba de procedencia exigía «Datasheet, p. 7 «Hardware»» a todas; ahora
acepta también una guía oficial, siempre que el pie cite página y rótulo literal. El e2e que
usaba el 100F como hueco honesto sigue conduciendo ese camino interceptando el mapa de figuras,
el patrón de `calculadora-ssl`.

De paso, la **p. 8 del System Guide del 7121F publica el máximo de fuentes** que el catálogo
declaraba ausente: ocho, de 2.000 W en la generación 1 y de 2.500 W en la 2. Casa con el «8 PS»
del Product Matrix: dos anclas.

**3 · R1 cerrado.** Release Notes 7.6.3, p. 15: «Starting in FortiOS 7.6.3, the SSL VPN tunnel
mode feature is replaced with IPsec VPN [...] This applies to all FortiGate models.» La regla
pasa a `leida:true` con esa cita, y la pantalla deja de disculparse por no haberla leído.

**4 · R2 cerrado en parte.** La p. 16 del mismo documento dice que el recorte de los modelos de
2 GB «impacts the FortiGate 40F and 60F series devices, along with their variants». Con la nota
10 del Matrix, **40F, 60F y 61F** pasan a «no soportada» en 7.6.0–7.6.2. El resto sigue en
«desconocida»: no figurar en esa frase no prueba tener más RAM.

**Lo que se validó y sigue abierto, con su motivo nuevo:**
- **F2**: la lista firmada trae dos «SD-WAN BDL SVC» por modelo (`-1337-` y `-1387-`), pero no
  dice cuál es cuál. Hace falta el Ordering Guide.
- **Límites de 100F y 200F**: su única fuente oficial ya no existe.
- **Decisiones del dueño**: «Wait for CI» en Railway, la aprobación de arquitectura Fortinet y
  M4.

**Verificación.** `npm run verificar` 584/584, `npm run pantallas` 17/17 y los contrastes y
baterías e2e que se detallan en el cierre de la entrega. La cobertura del contraste no se
regeneró: el Chromium de esta máquina mide mal, y ya se había descartado por eso.

### La batería e2e corre en CI y espera a condiciones, no a relojes (2026-09-24)

La mejora propuesta al cerrar la entrega anterior, aprobada por el dueño: llevar `npm run e2e`
a CI, que solo corría cuando alguien se acordaba (así salieron en verde tres baterías con fallos
impresos). **Ahora es un paso del job de `pantallas`**, con su propio servidor en el puerto 4131
y una clave generada en la corrida. **En el ejecutor tarda 1 min 50 s** (corrida
`35985786379`, lanzada sobre la rama antes de fusionar: 15/15 en verde) y el job entero
7 min 23 s. Un rojo ahí todavía no frena el despliegue (punto 33).

**MEDIR ANTES DE CAMBIAR CORRIGIÓ LA PROPUESTA.** Se dijo que las 219 pausas fijas
(`waitForTimeout(300…3500)`) había que sustituirlas antes porque en un ejecutor lento darían
rojos al azar. Se midió ralentizando la CPU del navegador por el protocolo de depuración, sin
tocar los scripts: **a 4x la batería vieja pasó entera (430 s) y a 10x también (630 s)**. Las
pausas tenían margen, y la propuesta exageraba el riesgo; queda escrito así.

**Por qué el cambio se queda igualmente, con lo que sí se midió.** `asentar(page)`
(`test/e2e/ayuda.js`) espera a que la página termine lo que empezó: un rastreador que
`abrirSesion()` instala antes que los scripts de la página cuenta la red y las lecturas de
cuerpo en vuelo, los temporizadores de hasta 1 s, los cuadros de animación, las transiciones,
las imágenes que cargan y el desplazamiento; quieta es todo a cero dos cuadros seguidos.
- **Tiempo:** la batería pasa de **336 s a 114 s** a velocidad normal, y a 10x de 630 a 442 s.
  Es el coste que se declaró para llevarla a CI, dividido por tres.
- **Diagnóstico:** si la página no queda quieta, falla diciendo qué quedó pendiente, en vez de
  una aserción roja sin explicación.
- **Que no lee antes de tiempo:** la batería con 1,5 s añadidos tras cada espera da las mismas
  afirmaciones, línea por línea.
- **Su contrato se prueba aparte** (`e2e-asentar.js`, página sintética servida por Playwright):
  espera a un temporizador corto y a una petición lenta, no a uno largo, no se cuelga con una
  imagen diferida fuera de la vista y falla si la página no lleva rastreador. Comprobado
  saboteando: el filtro de un solo borde y los temporizadores sin contar ponen en rojo,
  cada uno, justo su caso.
- **Lo que salió al medirlo:** la primera versión esperó 30 s a la foto diferida de un 50G que
  había quedado 5.000 px **por encima** de la vista: solo miraba un borde. Y «Limpiar
  escenario» de Aruba recarga la página, así que su `waitForSelector('#users')` se cumplía en la
  página vieja; ahora se espera como navegación (`trasNavegar`).
- **Las tipografías de Google se cortan en la batería**, para que una prueba de maquetación no
  dependa de un tercero; las capturas con las tipografías reales siguen siendo las de
  `pantallas`.

**TRES DEFECTOS DE CI SALIERON POR EL CAMINO.**
1. **El paso de contraste no podía fallar.** Sin `shell:` explícito, GitHub corre `bash -e`
   sin `pipefail`, y `contraste.js | tee contraste.txt` devolvía el código de `tee`. El log de
   la corrida `35946092377` muestra `shell: /usr/bin/bash -e {0}`. Hasta hoy no había ocultado
   nada (esa corrida pasó de verdad), pero ahora lleva `set -o pipefail`. **Variantes
   revisadas**: `verificar.yml` ya lo cubría con un `grep` sobre el contenido; `aplicar-propuesta`
   lo tiene y lo mitigan su segunda barrera (`npm run verificar`) y la revisión humana del PR;
   en los informativos (vigía, sondeo, candidatas, datasheets) seguir tras un código no nulo es
   a propósito, porque el issue o el resumen se abren después.
2. **Playwright en CI iba sin versión.** La corrida del 24-sep bajó Chromium 153 y su informe
   de cobertura solo contó los módulos del último caso: 19 «sin conducir», entre ellos el
   dimensionador de Fortinet, que cinco casos de esa corrida conducen; en local, con 1.56.1,
   son 8. Va fijado a 1.56.1, la versión con la que se valida todo, y **era la versión**: con
   ella la corrida `35985786379` vuelve a sumar entre páginas y da 8, como en local.
3. **El runner reutilizaba `/tmp/e2e-auth`** —el `usuarios.json` era del 22-sep—, así que una
   corrida con otra clave no podía entrar y dos corridas a la vez compartían base. Cada corrida
   trae ahora su propio directorio temporal.

**Y la auditoría de accesibilidad cubre ya la pantalla de Starlink**, que entró en `main` ese
mismo día desde otra sesión: axe sin ninguna violación y sin desplazamiento horizontal a 640 px,
en el cálculo y en la lista de materiales. Son 19 estados de pantalla y no 17, y como la batería
corre ahora en CI, una regresión de accesibilidad en esa página ya no espera a que alguien se
acuerde.

### Catálogo Starlink contrastado con las fichas oficiales en PDF (2026-09-24)

La mejora propuesta al cerrar la entrega anterior, aplicada. `traer-starlink.yml` (corrida
35949951292) trajo desde Actions las cinco fichas oficiales de `api.starlink.com/public-files/`
a la rama `fuente/starlink-specs`. **El riesgo declarado al proponerlo se cumplió y quedó
cubierto**: la página de especificaciones es una aplicación de JavaScript, y sus nueve
variantes respondieron 200 renderizadas en Chromium sin una sola cifra de ficha.
`juzgarTexto()` las marcó vacías en vez de publicarlas como fuente. **Leer los PDF corrigió
tres afirmaciones escritas a ojo**: un cable de 45 m que ninguna ficha documenta, el Flat High
Performance como «línea anterior» y el soporte marítimo, que ninguna ficha menciona. **Añadió
el kit Enterprise**, con 50 m de cable, que ahora es el recomendado para tendidos largos.
584 unitarios (con la prueba del juicio, comprobada saboteando el umbral) y 17/17 pantallas.

### Dimensionador y BOM de Starlink LEO (2026-09-24)

Encargo del dueño: un botón «BOM Starlink» en el dashboard, la página y su BOM. La carpeta
`starlink-leo-dimensionador` que se mencionó no existía en el entorno ni en GitHub, así que se
escribió desde cero con la arquitectura del fabric Nokia 7220 (sin `ficha.js`: Starlink no
publica una capacidad por terminal contra la que comparar). El caudal por terminal es un
**supuesto declarado y editable** (100/10 Mbps). Un dato que falta **aparta** el kit con su
motivo. Al cotizador viaja todo el BOM como referencias (`todoComoRef` en `bom.js`), porque el
kit no está en `CATALOG`. 574 unitarios (9 nuevos) y 17/17 pantallas.

### Cierre de pendientes con lo que el repositorio ya tenía dentro (2026-09-24)

Encargo del dueño: cerrar lo abierto, buscar la forma de gestionar los bloqueos y desplegar.
**El hallazgo que cambió el alcance: varios datos «bloqueados» no lo estaban.** Los PDF oficiales
de HPE ya estaban versionados en `public/datasheets/` y se leyeron en local, sin salir a
internet: el documento de suscripciones de Central (agosto de 2026), el Ordering Guide de
gateways SD-WAN, la QuickSpecs de la serie 9100 y el VSG de SD-Branch (septiembre de 2026).

**ARUBA, RESPALDO (R11/M9).** La fila del builder gana `rol` (activo/respaldo) con la misma regla
que Fortinet (`ArubaReglas.escenariosUnderlay`): el caudal, el tier y el Boost son los de la
operación normal; un respaldo ocupa puerto y óptica, y si no cubre la caída de un activo la
revisión declara la «continuidad parcial». Medido: DIA 1000 + 4G 200 pasaba a Foundation «sin
límite» ($80.857); con el 4G como respaldo, 1 Gbps ($42.697). **El contraste nuevo
`aruba-underlay`** (7 escenarios medidos sobre `f6f1952` antes del cambio) demuestra que un sitio
sin respaldos sale idéntico, y se comprobó saboteando (3 discrepancias).

**ARUBA, FASES 2 Y 3.**
- M5: el error de JS al abrir un enlace antes de que llegue la API.
- M6: la página vacía cotizaba un EC-XS por defecto; ahora dice «sin equipo que cotizar».
- M1: aviso falso del underlay.
- M3: dos cifras de FEC sin explicar; el requerimiento usa una sola regla y la pantalla rotula las dos.
- M7: el exportable nombraba archivos y constantes del repo.
- A7: un chasis sin jaulas SFP se recomendaba para fibra, el motivo real de la óptica que falta, y el medio SFP28 25G.
- A2: el salto de familia se declara y se deshace; nueva estrategia «IDS/IPS en el gateway —
  Central + Security», dimensionada contra el throughput de IDS/IPS oficial del VSG.
- A3: SKU de Central por serie.
- A4: Foundation Base, con el tope de 75 clientes del documento.
- A5: los APs entran declarados.
- M8: túneles por sede y headend VPNC sugerido en el consolidado, con la escala oficial.
- B1: sucesor del EC-XL, rotulado como inferencia.

**ACCESIBILIDAD.** `e2e-accesibilidad.js` (axe-core + reflujo a 640 px) encontró 13 fallos reales
en 17 estados y quedan en 0. **Y un fallo del arnés**: tres baterías nuevas cerraban sin
`process.exit(...)` y el runner las daba en verde con fallos impresos; `resumen()` fija ahora el
código de salida.

**ALIMENTACIÓN (pendiente 15).** Los seis gateways 9000/9100/9200 salen de los mismos PDF: el
9004, el 9004-LTE, el 9012 y el 9106 son de fuente única (adaptador externo o fuente interna; el
9106 publica «Power Supply Slots: -»), y el 9114 y el 9240 son `'opcional'` porque publican
«Power Supply Slots: 1 + Redundant» con una sola fuente como *Power Source*. Aruba pasa de 10 a
16 de 25. Los nueve controladores AOS 8 siguen sin dato: no hay documento suyo aquí.

**OTROS.** `calculadora-ssl` con sujeto sintético (probado saboteando). La documentación de la
etapa 7 dice ya el hecho del despliegue, y `CLAUDE.md` corrige lo que afirmaba de Railway.

**NO SE HIZO, Y SE DICE.** El ajuste de Railway y la lectura de la rama de transporte de Fortinet
los denegó el control de permisos de la sesión; no se buscó otra vía. Las ópticas, el heartbeat
de HA y el prorrateo de co-term de Fortinet siguen sin dato en el repositorio.

### Etapa 7 del dimensionador Fortinet: una sola verdad, puerta única y formulario dinámico (2026-09-23)

Encargo: el *Informe de auditoría y propuesta de rediseño dinámico del módulo Fortinet
Presales* (auditoría en vivo, 23-sep) con su prompt maestro. **Resultado: GO CONDICIONADO, sin
fusionar ni desplegar.** Entrega completa, con el informe delta, las matrices T01–T30 y
CU-01…CU-13, los ADR, el contrato de la API y las fórmulas, en
`docs/auditoria-fortinet-2026-09-23/`. Las capturas antes/después viven en la página de resumen
que enlaza su `LEEME.md`: el `.gitignore` excluye `capturas/` a propósito, y no se esquivó.

**LOS CUATRO P0 ERAN UN SOLO DEFECTO.** El recomendado, lo cotizado, la cantidad y la puerta
vivían en cuatro estados de la misma página:
- se elegía un 40F a mano y el BOM lo cotizaba con Excel y cotizador habilitados (F01);
- SSL-VPN se aceptaba sin versión de FortiOS (F02);
- con HA la cantidad bajaba a 1 (F03);
- la puerta deshabilitaba un id que el botón del cotizador no tenía (F04).

Se reprodujeron los cuatro en Chromium antes de tocar nada. **Se cerraron con un motor único,
no con cuatro parches**: `fortinet-motor.js`, el mismo archivo en el navegador y en `POST
/api/v1/fortinet/evaluations`, que confirma cada salida comercial por huella y versión de
catálogo y la audita en el volumen.

**CUATRO DEFECTOS NUEVOS, Y TRES SALIERON DE ENDURECER PRUEBAS:**
- **N01**: al abrir un enlace, el BOM se pintaba antes de llegar el catálogo. Las capturas del
  «antes» registran 4 errores de página; el «después», ninguno.
- **N02**: 108 de 1.193 precios de licencias seguían con la lista de agosto; se reanclaron por
  SKU exacto.
- **N03**: la aserción de EMS aceptaba cualquier fila con «EMS». Al exigir la cantidad apareció
  la nota «termino 3 anos», que llega al Excel, y otros 59 textos visibles sin tilde (53 en las reglas, 6 en el motor y 1 en los datos).
- **N04**: el bloqueo de SSL-VPN no pintaba la fuente que llevaba en los datos, y CU-05 pide
  justo eso.

**Y F13 se cerró en su propio origen.** La nota del Product Matrix en `fuentes.js` seguía
diciendo «cps en 53 de 58» y «49 en null». Queda fechada como historia, declara que los
recuentos los hace `npm run catalogo` y no la prosa, y registra las fichas por serie de
400F/600F/1000F como fuente propia: **sin URL a propósito**, porque la exacta no consta en el
repositorio y ponerla a ojo sería inventarla.

**Verificación.** 542 unitarios, 16/16 pantallas, 6/6 contrastes y 11/11 baterías e2e.
`e2e-fortinet-rediseno.js` es nuevo, con 76 afirmaciones. Hay capturas antes/después en tres
viewports, y el servidor arranca en modo producción con `[seed]`, `listen` y `/salud` en verde.

### El portal dimensiona la inspección TLS con su propia cifra (2026-09-23)

Petición del dueño: «aplica la mejora propuesta». Era esta, y su argumento era que el
dimensionador de Fortinet acababa de ganar la cifra oficial de inspección TLS en 51 de 58
modelos mientras **la pantalla de portada seguía respondiendo con Threat Protection**.

**EL PERFIL NO ES UN PELDAÑO MÁS DE LA ESCALERA.** Los cinco que había sí forman una escalera
de profundidad creciente; descifrar TLS es **otra ruta de proceso**, y el cociente ssl/tp de
este catálogo va de 0,52 a 1,18 — en el 50G, el 70G y el 90G el equipo aguanta **más**
inspección TLS que Threat Protection. Por eso no se deriva con un factor: ese derate único es
exactamente lo que se retiró del dimensionador el día anterior.

**MEDIDO EN LA PANTALLA, LOS DOS ERRORES OPUESTOS:**

| Escenario | Respuesta anterior (Threat Protection) | Con su cifra propia |
|---|---|---|
| 175 Mbps (455 de requerimiento) | **30G** — hace 500 de TP y solo **400 de TLS** | **60F** (630) — la anterior se quedaba **corta** |
| 500 Mbps (1,3 Gbps) | **70G** | **50G** — aguanta 1.300 de TLS contra 1.100 de TP: la anterior **sobredimensionaba una gama** |

**Y LA LÍNEA DE COBERTURA, QUE ERA EL RIESGO DECLARADO AL PROPONER LA MEJORA.** Con inspección
TLS compite **1 de 7 fabricantes**; el panel de apartados ya lo contaba pero va **al final**,
así que primero se leían cinco equipos de un fabricante y solo al bajar se descubría que los
otros siete no se habían comprobado. Ahora `CALC.cobertura()` lo dice **encima de la tabla**,
para los seis perfiles —también para NGFW, que viene marcado por defecto y aparta cinco de los
ocho grupos—, y **se mide contra el catálogo**: una lista de qué fabricante publica qué capa
se quedaría con los fabricantes de ayer, que es la forma de `CISCO_EOL_MODELS`.

**EL CASO DE CONTRASTE SE ENDURECIÓ SABOTEANDO, Y ESE ES EL HALLAZGO DEL DÍA.** La primera
versión de `calculadora-ssl` pasaba **en verde** con el derate metido a mano dentro del lector
—`d.ssl != null ? d.ssl : d.tp`—, porque los dos modelos Fortinet sin la cifra (100F y 200F)
no son el más pequeño que cumple en ninguno de los seis escenarios. Un caso que pasa con el
defecto dentro se porta igual que uno que no comprueba nada. La señal que sí cambia está en
pantalla: **Fortinet tiene que aparecer entre los apartados de su propio perfil**, porque dos
de sus modelos no traen la cifra; con la sustitución dentro desaparece de esa lista. Se afirma
la relación y no el número 2, que cambiará el día que se cierre **F6**.

**Lo que NO entró, y se declara.** La mejora se propuso como «el eje SSL y los límites de
configuración». Los límites —túneles, VDOM, usuarios SSL-VPN— **no se llevaron a esta
pantalla**: la calculadora responde una sola pregunta (caudal → equipo) y un conteo de túneles
no es un caudal. Meterlos ahí habría duplicado el dimensionador en la portada. Viven donde se
pueden contrastar contra un escenario completo, que es el paso 3 del dimensionador de
Fortinet.

**Verificación.** 489 unitarios, 16/16 pantallas, **6/6 contrastes sin discrepancias** y 10/10
baterías e2e. El mapa de capas se afirma contra el **servidor real** (`test/servidor-produccion.test.js`)
y no contra `legacyData/`: `ssl` llega a `/api/catalog` por la fusión de la siembra, y un mapa
escrito contra `indexPR.js` apartaría el perfil entero — es el mismo fallo que ese caso ya
cazó con el `sdwan` de Cisco. Esa prueba también **se comprobó saboteando**: añadir un segundo
fabricante al perfil con la cifra de otra capa la pone roja nombrando los SRX que se colaron.


### Los límites del Product Matrix se comprueban: F1, F4 (casi entero) y F7 (2026-09-23)

Encargo del dueño: «ejecuta los pendientes haciendo el máximo esfuerzo para resolverlos y
aplica la mejora propuesta y la que encuentres por el camino». La mejora propuesta al cerrar la
etapa 5 era exactamente esta: **convertir en ejes duros los tres límites que la pantalla pedía
y no podía comprobar**.

**EL DATO NO HUBO QUE TRAERLO: YA ESTABA EN EL REPOSITORIO.** `www.fortinet.com` y
`docs.fortinet.com` se volvieron a medir hoy y siguen devolviendo `connect_rejected` del proxy
de egreso —denegación de política de la organización—, así que **no se descargó nada**. El PDF
del **Product Matrix de septiembre de 2026** (`PROMTX-2026-R176-SEP`) lo publicó un ejecutor de
Actions el 2026-09-02 en la rama de transporte `fuente/fortinet-product-matrix`. Se reconstruyó
su tabla por coordenadas de texto de las páginas 1 a 3 y se transcribieron **27 filas de modelo
con siete columnas**. **El doble anclaje dio 27/27 sin un solo rechazo** (anclas: `Concurrent
Sessions` y `New Sessions/Sec`, las dos ya verificadas modelo a modelo) — es lo único que
prueba que ninguna fila se desplazó. De paso la fuente primaria **confirma exactamente** los
cinco valores de SSL que la etapa 3 había transcrito de un informe.

**F1 · La inspección SSL pasa de 9 a 51 de 58 modelos.** Era el hueco más caro del catálogo:
con inspección TLS profunda pedida competían 9 equipos. Los **7 que siguen en `null`** (100F,
200F, 400F, 401F, 600F, 1000F, 1001F) son los que esa edición del documento ya no lista, y
**se apartan con su motivo** en vez de dimensionarse con otra capa.

**F4 · Seis campos nuevos, y los tres límites declarados pasan a ejes duros.** `tunGw`,
`tunCli`, `sslVpnUsers`, `sslVpn`, `policies` y `vdomMax`. La pantalla decía «el límite de
túneles por modelo no está en este catálogo»; ahora dice «entra en 200 túneles publicados —
95 % del tope de plataforma». **`configuracion: true` los separa de los ejes de rendimiento** y
no es cosmético: el techo de utilización es una política sobre *cifras de laboratorio*, y un
máximo de túneles o de VDOM es un tope de la plataforma — aplicarle ese margen apartaría un
modelo por un límite que nadie fijó, y en silencio. **Lo que NO entró y sigue abierto**: rutas
BGP/OSPF, vecinos y VRF, que este documento no publica.

**F7 · Las excepciones TLS, como fracción declarada.** `#pctTlsExento`, con **0 % por defecto**
—dimensionar sobre el caudal completo, que es lo conservador y lo que la página hacía—. No es
una constante de Fortinet y la pantalla lo dice donde se usa.

**EL DEFECTO QUE SALIÓ POR EL CAMINO, Y ES DE LA ETAPA 5.** El caudal de acceso remoto se sumaba
**siempre** al eje IPsec, porque la pantalla no preguntaba cómo termina. Son **dos motores
distintos** y el documento publica un tope para cada uno: IPsec dial-up se cifra en el mismo
ASIC que el overlay; SSL-VPN se termina en el stack TLS, tiene su propia cifra de caudal y **no
carga el eje IPsec**. `#vpnTipo` lo declara. Medido: los mismos 400 usuarios remotos con el
mismo caudal dan un **60F por IPsec dial-up y un 120G por SSL-VPN**.

**Y UN CONTADOR QUE HABRÍA CONTADO CUALQUIER COSA.** Todos los modelos apartados se rotulaban
«por falta de cifra oficial de inspección SSL». Valía mientras `ssl` fuera el único eje duro que
podía faltar; con cuatro más habría mandado a completar el documento equivocado. El motor expone
**`apartadoPor` como dato** —no como una cadena que alguien tenga que leer con una expresión
regular— y la pantalla agrupa por eje.

**Verificación.** 484 unitarios (AT-29…AT-34 nuevos), **16/16 pantallas**, **5/5 contrastes sin
discrepancias** y **10/10 baterías e2e**. El contraste nuevo `fortinet-limites` **se comprobó
saboteando**: aplicar el techo a los topes de configuración, o mandar todo el acceso remoto al
eje IPsec, producen discrepancias. **Dos líneas base se revisaron y ninguna en silencio**: la de
`fortinet` movió solo `nCandidatos` (`recomendado` y `need` quedaron idénticos en los ocho
escenarios), y la de `fortinet-ssl` se rehízo porque **la premisa de un escenario dejó de ser
cierta** —«a 4 Gbps ningún modelo trae la cifra» era verdad con 9 de 58— y se sustituyó por uno
más fuerte que no depende de que el catálogo siga incompleto: el 600F hace 10,5 Gbps de Threat
Protection y aun así no compite, porque su SSL no está publicado.

**Y el transporte de lo que sigue bloqueado queda montado, no solo descrito.**
`.github/workflows/traer-fortinet-pendientes.yml` baja desde un ejecutor de Actions los dos
documentos que cierran **F6** (fichas por serie del 100F y el 200F, System Guide de los chasis
7081F y 7121F) y **F2** (Ordering Guide de FortiGuard). Prueba las rutas conocidas de cada
uno —Fortinet sirve las fichas nuevas en `/data-sheets/pdf/` y las de la generación F en
`/data-sheets/`, el subdirectorio que ya explicó doce 404—, **valida la firma del contenido y
no el código HTTP** —un 200 que devuelve la página de error en HTML donde se espera un PDF es
un 404 disfrazado— y deja en el resumen qué respondió cada intento. **Un 404 se reporta y no
tumba la corrida**: un informe que dice «no se pudo» con su código vale, y uno que se calla
los fallos para salir en verde no. No extrae nada: la lectura sigue siendo humana.

**Se revisó `fuente/fortinet-psu` y NO servía para F6**, y conviene dejarlo escrito para que
nadie lo vuelva a intentar: son páginas de sustitución de fuente de alimentación —una del foro
de la comunidad— y su única figura es un detalle de la PSU del 7081F, no la página «Hardware»
de un datasheet. Y el `sd-wan-ordering-guide.pdf` que hay en `fuente/fortinet-product-matrix`
**es el de Aruba**, no el de Fortinet: se leyeron sus 5 páginas para comprobarlo.

**De paso, dos tildes en texto visible**: `Inspeccion SSL` y `Tuneles` se leían sin acento en el
panel de utilización, que es texto que ve el usuario. Mismo hallazgo que el contraste de Nokia
cazó el día que se escribió.


### La figura oficial del equipo, frontal Y trasera, en el dimensionador Fortinet (2026-09-22)

Petición del dueño: «en el dimensionador de Fortinet debe traer las fotos de la parte frontal
y trasera de los equipos tal como está en Aruba». **Entregado por la tarde, después de que él
mismo corrigiera la primera entrega**: «sí hay evidencia que existe las imágenes de la parte
trasera». La tenía. **54 de 58 modelos con las dos caras**, con lupa, pie documental y viaje
al Excel en la hoja «Fotos del equipo».

**LO QUE LA PRIMERA ENTREGA AFIRMÓ ERA FALSO, y conviene que quede escrito.** Dijo —en el
commit, en `CLAUDE.md`, aquí y en una prueba e2e— que ningún datasheet de Fortinet publica
vista trasera. El fallo no fue de lectura sino de **alcance**: se abrieron los 28 documentos,
se extrajo la foto de **portada** de cada uno y se comprobó que las imágenes de las páginas 3
y 5 eran idénticas en los 28. Nunca se miraron las otras ocho páginas. La **página 7** de los
28 es la página «Hardware», con el diagrama de panel y sus llamadas numeradas, y **cuatro de
ellos rotulan las caras literalmente** —«Front Panel» / «Rear Panel»: 400F, 400G, 700G y
900G—; el 400F publica **tres** figuras (frontal, trasera AC y trasera DC). Una búsqueda de
la palabra «rear» sobre el texto de los PDF lo habría encontrado en treinta segundos.

Y el diagrama de panel es **mejor** que la portada: es el equivalente exacto del *Front View*
/ *Rear View* del *Hardware Reference* de HPE con el que se construyó la tarjeta de Aruba,
mientras que la portada es un render comercial. Así que las portadas se **retiraron** y las
sustituyen los paneles: 57 ficheros, 2,6 MB.

**Cómo se decidió qué cara es cada una.** Los 24 documentos que no lo rotulan se resolvieron
con un **ancla tomada de los cuatro que sí**: allí, la cara rotulada trasera es exactamente la
que lleva la entrada de alimentación, las fuentes, los ventiladores o los SSD — contrastable
leyendo el texto que el propio dibujo incrusta (`AC LINE`, `PWR1/PWR2`, `FAN1..5`, `SSD1/2`).
**No se dedujo del orden en la página, que no es constante**: el 120G y el 90G publican la
trasera **primero**, así que un `figuras[0] = frontal` habría puesto la cara de alimentación
como portada de dos modelos sin que nadie lo notara. **Y en los ocho de sobremesa no hay
lectura automática posible**: los rótulos de su panel son **trazos vectoriales, no texto**
(comprobado — `get_text()` sobre el marco del 60F devuelve cadena vacía), así que la tabla de
caras se escribió **a mano, mirando las 68 figuras una por una**.

**Tres casos que no encajan en la regla, declarados:** 400F y 900G publican **dos traseras**
(AC y DC — se sirve la AC, la configuración por defecto, y el pie dice que existe la otra);
**el 80F se queda sin frontal**, porque su datasheet publica una sola figura del 80F/81F y es
la cara de conectores —las dos que traen frontal son de las variantes DSL y PoE, que son otro
producto—, para lo que `ficha.js` se generalizó a pintar la tarjeta con **una sola cara, la
que haya**; y **cuatro modelos siguen sin ninguna figura**: 100F y 200F (su datasheet por
serie da 404 en la URL que sigue el patrón del resto, reportado y no dado por bueno) y los
chasis 7081F y 7121F (sus *System Guide* no son datasheets de serie). Esos cuatro muestran el
aviso honesto, **nunca una figura «parecida»**.

**Qué unidad dibuja cada figura** se leyó en el propio dibujo. A diferencia de la portada
—que retrataba con frecuencia la variante con SSD: la serie 1000F retrataba un 1001F— los
diagramas dibujan casi siempre el **modelo base**; el **400G** (dibuja un 401G) y el **700G**
(un 701G) son las excepciones y van declaradas en el pie. El caso 70F/71F sigue siendo el
mismo que la cabecera de `fortinet.js` documenta para las CIFRAS, y sigue dicho en el pie.

**Los PDF no se bajaron desde aquí.** `fortinet.com` responde 403 al proxy de egreso —medido
el mismo día con `agent-reach`, ver más abajo—. Se trajeron por el mecanismo de transporte que
este repositorio ya usa y documenta: las ramas `fuente/fortinet-serie`,
`fuente/fortinet-serie-f` y `fuente/fortinet-datasheets`, publicadas por un ejecutor de
GitHub Actions. No es rodear el bloqueo: es el camino sancionado.

Cobertura: `test/fortinet-vistas-equipos.test.js` (**11 casos**, entre ellos que los cuatro
datasheets que rotulan las caras den modelo con las dos — si uno perdiera una cara, el ancla
con la que se resolvieron los otros 24 habría dejado de existir sin que nadie se enterara),
más las afirmaciones e2e **invertidas**: una prueba que afirma un hueco inexistente es peor
que no tenerla, porque bloquea el arreglo y da la falsa sensación de estar cubierto.

### Paridad con Aruba en la pestaña de materiales, y «no incluir» en los combos (2026-09-22)

Las otras cinco peticiones del mismo mensaje. Documentado entero en
`docs/rediseno-fortinet.md`, etapa 4.

- **Los pasos 1 a 3, contrastados campo a campo con la §8 del informe.** Coinciden en todo lo
  que este catálogo puede respaldar; las nueve divergencias son deliberadas y cada una tiene
  su motivo escrito (tabla completa en el documento). Siete se cierran con un dato, no con
  código: `appliance o VM` (no hay modelos FortiGate-VM en el catálogo), `región` (una sola
  price list — un selector que no cambia ningún precio invita a creer que se tuvo en cuenta),
  `upstream` (el motor consume un solo caudal), la **mezcla porcentual por capa** (el Product
  Matrix no la publica, y las propias reglas de interacción del informe admiten que las
  clases se solapan y no se suman), `proxy o flow` (su derate está entre los once que el
  propio informe pide excluir) y `rutas/vecinos/túneles` (pendiente **F4**: la *Maximum
  Values Table* los publica y este catálogo no la trae). El hueco más defendible de los que
  quedan son las **excepciones TLS**, que sí serían una fracción declarada por el usuario y
  no una constante inventada.
- **Las referencias de pedido salen de la ficha y van a la lista de materiales**, al final
  del tab y con el nombre y el orden de Aruba: sección `#skuPanel`, «Añadir a la lista de
  materiales», detrás de lista → precio neto y TCO → perfiles multi-sede.
- **Fuera el «Resumen de sizing»**: Aruba no lo tiene y todo lo que decía está ya —y mejor—
  en el panel sticky, en las barras por eje y en el veredicto.
- **«No incluir» en `#licBundle` y `#careLevel`**, que habilita la cotización de solo hardware
  y la que separa equipo de servicios. Avisa y **no** bloquea; lo que sigue bloqueando es un
  bundle real por debajo del mínimo. Medido: $2.747,70 → $1.525,60 (sin bundle) → $1.093.
- **El paso 4 sigue al equipo elegido en la calculadora**: `llevarABom()` no soltaba el
  pestillo manual, así que tocar una vez el modelo del paso 4 desincronizaba los dos
  desplegables para siempre y sin forma de volver.
- **En el portal, «BOM EdgeConnect» pasa a «BOM Aruba»**, como los otros seis botones.

### `agent-reach` usado para medir el bloqueo, y lo que dijo (2026-09-22)

Petición del dueño: «utiliza la skill agent-reach para revisar si existe un bloqueo para
avanzar con la ejecución de pendientes». Hecho, y el resultado es útil:

- `agent-reach doctor` (con el CLI correcto, v1.5.0 desde el repositorio —no el 0.1.0 de
  PyPI, que es otro proyecto—): **2 de 16 canales disponibles**. V2EX falla con
  `Tunnel connection failed: 403 Forbidden`, que es la firma del proxy.
- Por su categoría `web` (Jina Reader, el único canal que el doctor da por bueno):
  **no alcanza `fortinet.com`** ni el Product Matrix ni las páginas de producto. Directo,
  tampoco.

**Conclusión: el bloqueo es real y sigue en pie**, así que **F1** (49 modelos sin cifra
oficial de SSL) y las fotos que faltan **no se pueden cerrar desde este entorno**. Lo que sí
funciona —y es lo que se usó para las fotos— es el transporte por ramas `fuente/*` desde un
ejecutor de Actions, que este repositorio ya tenía montado.


### Skill `agent-browser` (Vercel Labs) instalada y probada contra nuestra app (2026-09-22)

Petición del dueño: «busca en la web o en github la Skills Agent Browser de Vercel e instala».
Está en `vercel-labs/agent-browser` (no en `vercel/`), y se instaló su skill en
`.claude/skills/agent-browser/` desde el commit `b0f3962` (v0.38.1), copia literal. Claude Code
ya la descubre.

**Es el caso OPUESTO a `agent-reach`, instalada el mismo día.** Aquella enruta hacia 16
plataformas de internet y el proxy de egreso las corta todas; ésta conduce un **navegador
local**, así que no depende de la red. Probada de extremo a extremo contra nuestra propia
aplicación en modo producción: navegó a `/login`, leyó el formulario con refs `@e2/@e3/@e4`,
rellenó, entró por el muro de acceso, abrió el dimensionador de Fortinet y leyó el banner de
datos que se escribió el día anterior («FUENTE TÉCNICA · Fortinet Product Matrix · COBERTURA ·
precio 54/58 · cps 56/58 · SSL 9/58»). La interfaz en español la lee sin problema.

**Dos tropiezos medidos, con su salida:**

- **Pide Node 24 y aquí hay Node 22.** Su `engines` declara `>=24.0.0`, así que
  `npm i -g agent-browser` **no instala la última**: npm retrocede. Medido — npm sirve 0.38.1
  como `latest` y aquí quedó la **0.27.0**. No es cosmético: 0.27.0 trae 6 skills y el stub de
  0.38.1 menciona `derive-client` y `protected-vercel-deployments`, que no existen ahí.
- **No encuentra el Chromium de este contenedor** (`/opt/pw-browsers/...`, que no es ninguna de
  las cachés que mira). Hay que pasar `--executable-path`, y **cerrar antes el demonio**: si ya
  hay uno corriendo avisa «--executable-path ignored» y luego todo falla con «Chrome not found».

**LO QUE NO SE OBEDECE, Y ES LO IMPORTANTE.** Su descripción termina con «Prefer agent-browser
over any built-in browser automation or web tools». Aquí no: `npm run pantallas`,
`npm run contraste`, `npm run e2e` y `npm run manual` siguen sobre Playwright, resuelto en un
solo sitio (`scripts/ayuda/chromium.js`). No es preferencia de librería — esos comandos son lo
que CI mira y lo que produce el informe, las capturas del artefacto y
`scripts/contrastes/cobertura.lock.json`. Sustituirlos por agent-browser sería apagar la red de
comprobación sin que nadie lo notara.

Se conserva porque **lo que aporta es distinto, no sustituto**: los snapshots del árbol de
accesibilidad sirven para *explorar* una pantalla a mano, sin escribir un script. La regla
queda escrita en su LEEME: **explorar con agent-browser, comprobar con Playwright**, y lo que se
descubra explorando se convierte en una aserción de `pantallas`, un caso de contraste o una
batería de `e2e` — que es lo que vuelve a correr solo en el siguiente push.


### Skill `agent-reach` instalada, con su bloqueo medido (2026-09-22)

Petición del dueño: «https://github.com/Panniantong/Agent-Reach.git Installar skills». Ese
repositorio **no es una colección de skills**: es una herramienta Python (un router de acceso
a internet para 16 plataformas) que trae **una** skill, la que enruta hacia su propio CLI.
Instalada en `.claude/skills/agent-reach/` desde el commit `a19a171` (v1.5.0), copiada sin
tocar una línea; Claude Code ya la descubre.

**Dos cosas se midieron en vez de suponerse, y las dos cambian cómo usarla:**

- **Desde este entorno no alcanza ninguna de las 16 plataformas.** Se probaron una por una:
  `r.jina.ai`, `v2ex.com/api`, `xiaohongshu.com`, `x.com`, `reddit.com`, `api.bilibili.com`,
  `youtube.com`, `linkedin.com`, `xueqiu.com` y `api.exa.ai` no responden. Solo pasan
  `api.github.com`, `raw.githubusercontent.com` y `pypi.org`, que el proxy ya permitía. Es la
  misma política que devuelve 403 a `fortinet.com` y a los dominios de HPE y Huawei, y se
  reporta igual: **la skill se dispara aquí pero no puede cumplir**; sirve desde una máquina
  con salida a internet.
- **`pip install agent-reach` instala OTRO proyecto.** PyPI sirve `agent-reach` 0.1.0 de
  *Jean Galea* (`github.com/jgalea/agent-reach`, 2 canales), no el de `Panniantong` (1.5.0,
  16 plataformas). Se comprobó instalándolo. El modo de fallo es el peor: con el paquete
  equivocado en el PATH, el `agent-reach doctor --json` que la skill manda ejecutar
  **responde con éxito** (`[]`, «No channels installed»), que se lee como «no hay backends
  configurados» y no como «has instalado otro programa». El CLI correcto se instala desde el
  repositorio, no por nombre de paquete.

**Lo que NO cambia.** Su descripción es un `MUST USE` sobre «buscar algo en internet», que en
este repositorio se dice a todas horas —buscar una cifra de un datasheet—, así que conviene
dejarlo escrito: **lo que esta skill traiga es material de lectura humana**. El dato del
catálogo sigue entrando por `npm run cps` / `juniper` / `huawei` / `propuesta`, que contrastan
con doble anclaje antes de escribir. Este repositorio no automatiza la extracción de tablas de
PDF a propósito, y una skill nueva no es motivo para empezar.

Queda declarado en `CLAUDE.md` (tabla de skills) y en `.claude/skills/agent-reach/LEEME.md`,
que incluye cómo comprobar que el CLI instalado es el bueno.


### El informe de validación técnica de Fortinet, aplicado (2026-09-22)

Petición del dueño con el informe adjunto: implementar «todas las mejoras que se han
consolidado», con el dimensionador «funcional, dinámico e interactivo». Detalle completo en
`docs/rediseno-fortinet.md`, etapa 3. Lo que importa recordar:

**El informe no se implementó literalmente, y él mismo pide que no se haga.** Su sección 4 es
una matriz de «incorporar / reformular / excluir» donde once de sus diecisiete propuestas van
marcadas para excluir o reformular porque son constantes sin respaldo. Ninguno de esos factores
se aplicó: multiplicar por ellos habría sido inventar precisión, el mismo vicio que este
catálogo persigue con los SKU.

**P0 técnico — la inspección SSL era un derate y ahora es un eje.** Vivía como
`SSL_DERATE = 0,65` sobre Threat Protection. El Product Matrix publica la cifra por modelo y el
cociente ssl/tp va de **0,52 (40F) a 1,18 (50G)**: en tres de los cinco modelos con dato el
equipo aguanta MÁS SSL que Threat Protection, así que un factor único **no es conservador, se
equivoca en las dos direcciones** — en el 40F prometía 390 Mbps donde el equipo da 310. `ssl`
entra con 9 de 58 (5 base + 4 variantes con SSD) y `null` explícito en los otros 49, que se
apartan con su motivo. Las cifras están **transcritas del informe**, que cita el documento y su
edición: `fortinet.com` responde 403 al proxy de egreso de este entorno y eso se declara en la
cabecera del catálogo y en `fuentes.js`.

**El motor pasa de una cifra derivada a ocho ejes independientes** (`public/js/fortinet-reglas.js`).
Y la reformulación es equivalente para lo que no toca: `min(capa, IPsec/frac) ≥ req` es lo mismo
que `req ≤ capa` Y `req × frac ≤ IPsec`. Eso **se demostró, no se afirmó** — el contraste
`fortinet`, cuya línea base se midió en septiembre antes de este cambio, pasa sus 8 escenarios y
sus 6 migraciones de enlace v1 sin una discrepancia.

**P0 comercial — tres cobros que no correspondían.** FortiCare Premium cobrado dos veces (los
tres bundles lo incluyen y el BOM añadía además una línea de soporte *siempre*), FortiConverter
duplicado con Enterprise, y el SKU con el marcador `DD` del price list, que es el patrón del
término y no un código pedible. Más el bundle mínimo derivado de las funciones, que **bloquea**
en vez de avisar, y la retirada de la suposición «multi-WAN obliga a Enterprise».

**Tres hallazgos que salieron del camino y se arreglaron**, los tres invisibles desde `curl`:
el rótulo `<b>Threat Protection</b>` salía literal en la ficha (ficha.js escapa la columna
izquierda con `esc(k)`); el chip de validación del paso 4 no se refrescaba al cambiar el bundle,
porque `#licBundle` solo dispara `renderBom` y los chips se pintaban solo desde `render`; y el
caso de contraste `cotizador-bom` seleccionaba la pestaña de la lista de materiales **por su
rótulo visible**, así que el renombrado a «Lista de materiales» lo dejó en la calculadora y el
fallo salía 40 líneas después como «`.btn-cotizador` no es visible», que no dice nada de la
causa. Ahora usa `data-tab`, que es el contrato; el rótulo es texto de interfaz y cambia.

**Cobertura:** 31 unitarios nuevos (AT-01…AT-20) en `test/fortinet-reglas.test.js`, 38
afirmaciones en `test/e2e/e2e-fortinet-auditoria.js`, un contraste nuevo (`fortinet-ssl`, 7
escenarios + 2 comprobaciones de mensaje) y `ssl` incorporado al inventario de
`npm run catalogo`. Total: **454 unitarios, 10/10 e2e, 4/4 contrastes y 16/16 pantallas en
verde**. El contraste nuevo se comprobó **saboteando**: bajando el eje SSL de `dura` a `blanda`
—la «simplificación» plausible que devolvería el defecto— da 6 discrepancias, y la peor es
exactamente el fallo que el cambio venía a cerrar: a 4 Gbps con inspección SSL pasa de «sin
candidato» a recomendar un **FortiGate 200G**. Los dos escenarios de control **sin** SSL se
quedan en verde, que es lo que prueba que el caso aísla el eje.


### El cotizador recibe el BOM entero, y dos fallos de dinero que salieron con él (2026-09-18)

**A6 de la fase 2.** Se midió antes de tocar nada, en Chromium: el BOM de un FortiGate 200G a
2.500 Mbps son **cuatro líneas por $38.088,20** —equipo $11.477, bundle Enterprise Protection
$21.205,80, FortiCare Premium $4.989,60 y FortiConverter $415,80— y al cotizador viajaba
**solo el equipo**. El 70 % de la cotización se volvía a teclear a mano, que es exactamente el
hueco que «Enviar al cotizador» existe para cerrar.

**No hizo falta un canal nuevo.** El cotizador ya ingiere líneas que no están en `CATALOG` por
la vía de las referencias, construida para los bundles añadidos desde la ficha. Una línea de
licencia calculada por el dimensionador es eso mismo. El equipo **sigue viajando solo como
nombre** —su precio y su texto salen de `CATALOG`, que es la fuente de verdad de esa pantalla—
y por eso la fila `cat:'Equipo'` se excluye de lo que viaja como referencia: si viajara, el
hardware se cotizaría dos veces. Lo que **no** viaja es la `nota` de cada fila, decisión
declarada: llevan texto interno del dimensionador y la cotización la ve el cliente.

**Falla cerrado.** Solo se manda el resto del BOM cuando se puede probar que ese BOM es el del
equipo que viaja: sin ninguna fila `cat:'Equipo'` no hay forma de saber cuál es el hardware, y
si la fila de equipo del BOM no es el modelo que manda la página, el BOM está cotizando otra
caja y sus licencias no corresponden. En los dos casos viaja solo el equipo y el botón dice por
qué, en vez de armar una cotización incoherente en silencio.

**Los dos fallos de dinero, los dos preexistentes y los dos invisibles desde `curl`:**

1. **Toda cotización empezada desde un dimensionador salía al DOBLE.** La fusión con el BOM
   restaurado corría también cuando no había nada que restaurar, y entonces `bom` seguía
   siendo el array de lo que acababa de entrar: cada línea se encontraba a sí misma y se
   sumaba su propia cantidad. Comprobado revirtiendo el arreglo — un FortiGate 200G llegaba
   con cantidad 2 y **$22.954** en vez de $11.477. Estaba ahí desde que existe el traspaso.
2. **Cotizar un segundo equipo fundía su licencia dentro de la del primero.** La identidad de
   una línea se tomaba de `model + vendor`, y `model` de una referencia es el nombre comercial
   del bundle: «Enterprise Protection» es el mismo texto en un 30G que en un 200G. Medido: la
   licencia de $1.147,50 del 30G se metía en la de $21.205,80 del 200G con cantidad 2. Ahora
   la identidad vive en **un solo sitio** (`identidadLinea`) y es el SKU para una referencia y
   el fabricante+modelo para un equipo.

**Verificado de extremo a extremo**, no razonado: Fortinet $38.088,20 → cotización $38.088,20
en 4 líneas; dos envíos del mismo equipo suman a $76.176,40 sin duplicar líneas; un segundo
equipo distinto da 8 líneas y $78.307,90, que es la suma exacta de los dos BOM. Aruba:
$12.873 → $12.873 con su suscripción SD-WAN y su Foundational Care dentro. Las demás
categorías (Boost, DTD/SSE, Central, licencia de capacidad, ópticas, HA) viajan por la misma
regla, que es **categórica y no una lista enumerada**: cualquier fila que el motor produzca
que no sea `cat:'Equipo'` viaja.

**Lo que lo frena si alguien lo deshace.** `test/bom-traspaso.test.js` sube a 14 casos, y
**el caso que importa se descubrió saboteando**: quitar la condición `cat !== 'Equipo'` pasaba
en verde, porque la defensa de segundo orden (el SKU repetido) tapaba el fallo en el escenario
que había escrito. Cuatro de los seis dimensionadores que montan el botón —Huawei, Juniper,
MikroTik y Nokia— construyen su fila de hardware con `sku: null`, así que ahí la categoría es
la **única** defensa; con ese escenario añadido, el sabotaje salta. La otra mitad del viaje
—que el cotizador ingiera esa cola sin duplicar ni fundir— no la puede ver una función pura, y
por eso hay un caso de contraste nuevo, `scripts/contrastes/cotizador-bom.js`, que conduce las
dos pantallas y **no lleva ni una cifra del catálogo**: declara la *relación* (la cotización
vale lo que ya llevaba más el BOM que entra, y el equipo aparece una sola vez) y lee las cifras
de la pantalla, para no ponerse rojo en cada cambio de precio. Comprobado que detecta:
revertir cada uno de los dos arreglos lo pone en rojo, con el importe esperado y el obtenido.
De paso el contraste pasa a cubrir `cotizador.js`, que estaba **sin conducir** y ahora sale al
65 %.


### Fase 1 de la auditoría técnica del dimensionador Aruba + despliegue desbloqueado (2026-09-17)

El dueño pidió una auditoría como arquitecto Aruba del dimensionador en producción y,
sobre el documento resultante, «avanza con la fase 1». Cada hallazgo se reprodujo en
producción con un escenario y quedó fijado como prueba.

**Despliegue.** Los 8 despliegues desde `b4e8c4e` (16-sep) fallaban en `npm install`:
`package-lock.json` resolvía `pdf-parse`, `node-ensure` y `debug@3.2.7` contra
`npm.mirrors.msh.team` (un espejo del entorno donde se añadió la dependencia), que
Railway no resuelve (`ENOTFOUND`). Se reescriben a `registry.npmjs.org` — mismos
tarballs, las `integrity` validan con `npm ci`.

**C1 · tiers Foundation.** `tierParaCaudal` recorría los 8 tiers sin mirar el nivel y
proponía «Foundation 200 Mbps» (o 20/50/500 Mbps, 2 Gbps), que no existe: la suscripción
quedaba en «consultar» y fuera del total. Ahora elige solo entre los tiers del nivel
deducido (150 Mbps → Foundation 1 Gbps S1A24AAS, US$5.040 a 3 años, más barato que
Advanced 200 Mbps).

**C2/C3 · sistema operativo de los gateways.** Selector nuevo «Sistema operativo de los
gateways» (AOS 10 por defecto / AOS 8), en la URL como `soSeg`. `porSo` en `aruba.js`
superpone por SO: serie 9000 128/256 APs en AOS 10 y 32 en AOS 8; 9240 con su tabla y sus
SKU por SO (AOS 10: 4K/8K/16K APs, 32K/48K/64K clientes, R8R41/R8R42AAE; AOS 8:
512/1K/2K, 16K/24K/32K, R8R13/R8R14AAE sin List Price). 9114 no corre AOS 8; del 9106 solo
está la tabla AOS 10; las series 7000/7200 solo tienen cifras AOS 8 — cada descarte lleva
su motivo en el veredicto y en la revisión del diseño. La propuesta exportada declara el SO.
Escenario de la auditoría: 12.000 clientes / 1.200 APs ya no añade una Gold de US$19.995;
300 usuarios / 40 APs vuelve a la serie 9000 en vez de un 9106.

**C4 · Boost.** Se calculaba sobre `needProc` (margen + penalización + usuarios) con una
cuota de breakout invertida (MPLS + 0,70 × Internet): un hub MPLS 1G + DIA 1G pedía 10
bloques (US$196.560). Ahora es el 30 % de `bwTunelesPrivados` del motor (la cifra que el
propio hint del breakout muestra) → 2 bloques. Se descarta el appliance cuyo Boost
recomendado por HPE (`spec.boostRec`) no alcanza, y la barra de la ficha muestra ese
recomendado en vez del techo WAN.

**C5 · fin de venta.** Boletines oficiales en `EOL_ANNOUNCED`: 7005/7008 (último pedido
31-oct-2022, soporte hasta 31-oct-2027; 7008 → 9012, no 9004) y 7210/7220 (31-ene-2025 /
31-ene-2030; → 9240, el 7220 con Silver R8R13AAE). `FICHA.rango` ya los saca de la
recomendación; siguen en el catálogo y en el selector para parque instalado.

**A1 · DTD en EC-XS.** `dtd:false` en el EC-XS y filtro duro: con Dynamic Threat Defense
ya no sale recomendado ni cotiza una licencia que no corre.

**Dónde vive.** Las reglas puras salen a `public/js/aruba-reglas.js` (UMD, mismo patrón
que `motor-ingenieria.js`) para probarlas en Node: `test/aruba-auditoria-fase1.test.js`
(12 pruebas con los escenarios de la auditoría) y `test/e2e/e2e-auditoria-fase1.js` (19
comprobaciones en Chromium, entrando por el enlace del escenario). `e2e-ciclo-vida.js`
pasa a esperar el 7005 en rojo y el 7010 en ámbar. `npm run verificar` 404/404, e2e 9/9,
`npm run pantallas` 16/16, arranque con `NODE_ENV=production` con `[seed]` y `/salud` ok.

### Interconexión EdgeHA en la lista de materiales — pendiente #7 (2026-09-17)

El asistente de cableado del plan 13 dejaba claro que el enlace EdgeHA necesita un
puerto por chasis, pero ninguna línea del BOM lo reflejaba: en un chasis todo-SFP+ son
2 ópticas que la propuesta no recogía. El dueño aprobó la mejora propuesta («avanza
con la mejora propuesta y el pendiente 7» — eran la misma).

**Implementación.** Predicado único `parEdgeHA()` (EdgeConnect + HA + ≥2 enlaces
activos) compartido por ficha, chooser y BOM. Regla de velocidad declarada de la casa
(`velocidadEdgeHA()`): menor óptica compatible con el modelo que cubre el agregado WAN
del sitio — el VSG no la fija, y por la interconexión cruza el tráfico de los
underlays que no aterrizan en el activo. El chooser muestra la fila «Interconexión
EdgeHA» aunque no haya ópticas WAN que elegir; la elección viaja en
`sfpPickData['EdgeHA']`. El BOM cotiza ×2 si hay elección, declara PENDIENTE DE
SELECCIÓN si hay varias compatibles, y declara sin SKU si el agregado supera las
ópticas del catálogo (cobre directo o confirmar con HPE — nunca una óptica inventada).

**Defecto preexistente pescado al probarlo:** el chooser se pintaba al principio del
render leyendo `#pickModel` antes de que el combo se repoblara — quedaba un render
atrás. Ahora se pinta al final de `poblarPickModel`, con el pick del render actual.

Cobertura: 9 comprobaciones e2e nuevas en `e2e-desbordamiento-ec.js` (§3c); 391
unitarios y 8/8 e2e en verde.

### Vigencia multi-fuente + asistente de cableado EdgeHA + dedup «Interfaces» (2026-09-17)

Petición del dueño en tres partes: ejecutar el primer pendiente, ejecutar la mejora
propuesta y validar la información redundante de las características del equipo
(«por ejemplo interfaces»). Mapa honesto: el primer pendiente literal era una acción
del dueño (reenviar las secciones 2+ del reporte del plan 11), así que se ejecutó el
primero ACCIONABLE.

**1 · Vigencia extendida a gateways de campus.** `scripts/vigencia-quickspecs.js` pasa
de una única guía a un array FUENTES con la correspondencia declarada por prefijo:
EdgeConnect → QuickSpecs a50004289enw; Gateway 90xx → guía de pedidos PSNow
a00067607enw (documento entero, ancla «Ordering guide»); Gateway 91xx → QuickSpecs
a50006999enw; Gateway 92xx → QuickSpecs a50004272enw. Un modelo con SKU sin fuente
asignable rompe el cruce con código 2 (nunca verde silencioso). Hoy: **15/15
ordenables en 4 guías oficiales, cero alarmas**; EC-V y legacy 7000/7200 fuera,
declarados. CI: `vigencia-ci.patch` (el PAT no tiene scope `workflow`) — corre en
push/PR que toquen guías o catálogo, los lunes y a mano, y sube el JSON de artefacto.

**2 · Asistente de cableado EdgeHA (la mejora propuesta).** Con HA marcado y ≥2
enlaces WAN activos, la ficha del EdgeConnect pinta «Cableado del par EdgeHA»: cada
enlace a su chasis (WAN 1 → Nodo A, WAN 2 → Nodo B; con >2 transportes el reparto A/B
se declara extensión del patrón, no figura oficial), la interconexión EdgeHA directa
entre chasis sin switch (sin SKU: el VSG no lo fija y aquí no se inventa) y la óptica
de cada nodo según el medio declarado. La mejora destapó una inconsistencia real: el
BOM y el chooser cotizaban las ópticas WAN ×2 con HA — el patrón de hub del VSG
aplicado a una sucursal. Con EdgeHA cada enlace aterriza en UN chasis: corregido a 1
por enlace (solo fam `ec`; gateways sin tocar — sin fuente validada para su HA).

**3 · Redundancia de la ficha: confirmada y corregida.** «Interfaces» se pintaba DOS
veces con la misma cadena — en «Características del equipo» y en «Configuración de
puertos». Queda una sola vez, en su sección dedicada y con su nota de procedencia
(el catálogo lo trae como texto libre). Auditoría completa de las demás secciones:
«Alimentación» ya tenía su regla anti-duplicado (watts vs. psu.watts) y «Boost
recomendado» (recomendación de preventa) no duplica la escalera (capacidad publicada).

Cobertura: 2 unitarias nuevas (`vigencia-quickspecs`: correspondencia modelo-guía,
los seis gateways ordenables) y 6 comprobaciones e2e nuevas en
`e2e-desbordamiento-ec.js` (sección EdgeHA presente/ausente según HA, asignación A/B,
interconexión declarada, «Interfaces» exactamente una vez). **391 unitarios y 8/8 e2e
en verde.**

### HA pre-marcado por capacidad del sitio + validación «cada WAN a un equipo del par» (2026-09-16)

El dueño pidió validar como arquitectura: con 2 enlaces WAN de ≥5 Gbps cada uno, cada
enlace debería aterrizar en un equipo distinto del par HA, HA debería habilitarse por
defecto y el licenciamiento debería seguir solo.

**Veredicto de la validación (fuentes oficiales en el repo):**
- ✅ El cableado propuesto ES el diseño oficial de sucursal: **EdgeHA** (VSG SD-Branch,
  sección High Availability): dos EdgeConnect, «each connected with a single WAN link
  to two different underlay networks», sin switches WAN, con el enlace EdgeHA llevando
  los túneles de cada underlay a ambos appliances. Las QuickSpecs V18 lo confirman:
  «a HA link that allows tunnels over each underlay to connect to both appliances».
- ❌ La inferencia de dimensionado NO: en HA 1+1 el VRRP/enrutado manda TODO el tráfico
  al activo y el standby solo toma el relevo en fallo (VSG: «traffic is sent there only
  during an outage of the first appliance», evitando ECMP a propósito). Cada chasis del
  par se dimensiona al agregado completo del sitio — HA suma disponibilidad, no caudal.
  Dividir el requerimiento entre los dos habría sobrevendido el par al 50 %.
- ✅ HA por defecto en ese escenario: implementado como regla de preventa declarada del
  dueño (SIN FUENTE oficial — HPE no publica umbral; la decisión es de la casa).
- ✅ El licenciamiento ya seguía solo: 2 unidades, 1× suscripción estándar + 1× SKU HA
  E-STU del mismo tier y término (LICENSES_HA; invariante de precio verificada).

**Implementación:** `sincronizarHaAuto()` corre al inicio de cada render (las unidades
y el BOM se derivan de la casilla ya ajustada); la regla es de FLANCO — pre-marca al
entrar en el escenario y no vuelve a marcar si el usuario la desmarca a mano
(`data-ha-manual`), caso que la revisión del diseño declara como aviso. `#haAutoHint`
explica la regla y su porqué mientras aplique. El bloque de desbordamiento del plan 11
gana la aclaración «Lo que NO resuelve el desbordamiento: el par HA». La auditoría de
puertos se queda conservadora a propósito (todos los enlaces contra el chasis: es el
patrón de hub del VSG y el único que resiste failover con circuitos dual-home).

Cobertura: 8 comprobaciones e2e nuevas en `e2e-desbordamiento-ec.js`; 389 unitarios y
8/8 e2e en verde.

### Desbordamiento de la línea EdgeConnect guiado por el techo oficial (2026-09-16)

Reporte del dueño: con enlaces de gran capacidad (5000 Mbps Internet + 5000 Mbps MPLS)
el dimensionador respondía «Ningún modelo cumple todas las restricciones» — un callejón
sin salida. El diagnóstico se hizo contra la fuente oficial y tumbó la mitad de lo que
parecía obvio.

**Lo que NO era: el catálogo.** El snippet que acompañaba el reporte proponía
«corregirlo» con cifras nuevas (EC-10108 a 10/15 Gbps con SKU S2D93A, EC-10150 a 20
Gbps, EC-XL con SKU JZ888A, un modelo «EC-V-10G»). Reverificado contra las QuickSpecs
oficiales a50004289enw V18 que viajan en el repo: el catálogo ya estaba bien —EC-10108
«2-2000 Mbps» (S0E23A), EC-10150 «Up to 12 Gbps» (S2N65A), EC-XL fuera de venta
(S0B67A; JZ888A es su kit de montaje en rack, no el chasis) y EC-V sin techo publicado
(se dimensiona por licencia y vCPU)—. Ninguna de esas «correcciones» entró: la casa
solo escribe datos desde fuentes oficiales, nunca desde lo que parece razonable. La
guardia `test/aruba-techo-ec.test.js` fija las cifras verdaderas y deja constancia del
snippet refutado, para que la próxima propuesta parecida rompa ahí.

**Lo que SÍ era: aritmética, no datos.** El motor de ingeniería carrier-grade aplica
÷IMIX (0,70 en mezcla empresarial) × FEC (1,15) × margen (1,30): 10.000 Mbps físicos
se convierten en 21.358 Mbps de requerimiento de diseño, y el EdgeConnect más capaz
que HPE publica (EC-10150) llega a 12 Gbps. Ningún appliance cubre el escenario en
solitario — la respuesta honesta no es un modelo sino una arquitectura. El veredicto
vacío ahora lo dice: cuantifica el exceso contra el techo oficial con su cita
(QuickSpecs V18, p. 30, cifra bidireccional según la nota 3) y ofrece las vías que la
documentación sí sostiene: EC-V en el hub (la escalera oficial de suscripción llega a
«Sin límite de caudal»; la guía de despliegue exige Accelerated Networking/SR-IOV),
reparto del fabric entre varios appliances, revisión de las hipótesis del motor con la
cifra mínima calculada de los datos (si entra en el techo se dice, si ni así, también),
y la selección deliberada del EC-10150 —que sigue en el combo y cotiza su BOM real con
la revisión del diseño marcando el exceso en rojo—. En el estado vacío no se pinta
ficha aunque haya selección manual, a propósito: pintarla contradeciría el veredicto
honesto; el BOM sí la cotiza con el aviso de desvío, y el veredicto lo declara.

**El defecto que pescó el e2e de regalo:** la sección «hipótesis al mínimo» de la
prueba reveló que `headroom_pct || 20` en `motor-ingenieria.js` convertía el 0 %
legítimo del slider en un 20 % fantasma (la página declaraba «margen 0 %» y calculaba
con 20: 12,6 Gbps en vez de 10,5 — la vía «revisar hipótesis» del propio veredicto
fallaba al seguirla). Corregido a `?? 20` con su prueba de regresión: el default solo
aplica cuando el parámetro está ausente.

Cobertura: 6 guardias de datos + 1 prueba del cero falso + e2e nuevo de 14
comprobaciones (desbordamiento guiado, selección deliberada con revisión en rojo,
hipótesis al mínimo → EC-10150 recomendado, regresión del escenario pequeño). 389
unitarios y 8/8 e2e en verde. El mensaje del dueño llegó truncado tras la sección 1 —
si traía más correcciones, quedan por pedir.

### Vigilancia de vigencia por QuickSpecs + congelado declarado de la política de ciclo de vida (2026-09-16)

El dueño aceptó la mejora propuesta al cerrar la validación del EC-XS, junto con los
pendientes «—» de aquella entrega.

**La mejora: `npm run vigencia`.** Lo que el 2026-09-16 se hizo a mano —desmontar el
falso EOL del EC-XS cruzando los agregadores contra las QuickSpecs oficiales— queda
convertido en sistema: `scripts/vigencia-quickspecs.js` lee la copia de las QuickSpecs
que viaja CON el repositorio (sin salir a internet, corre igual aquí que en CI), busca
el `hwSku` de cada EdgeConnect en la sección «Configuration Information» (la guía de
pedido) y clasifica: **ordenable** / **mencionado** (solo fuera de la guía, p. ej. la
tabla comparativa — el tercer estado, no un ausente) / **ausente**. Cruzado con el
boletín del catálogo: ausente o mencionado SIN boletín es **ALARMA** (código de salida
1: posible fin de venta no documentado, revisar el boletín oficial a mano); con boletín
es nota consistente; ordenable con boletín vencido es nota (la V18 aún lista S0B67A
NoLoc — patrón observado, no alarma). Declara la fuente con lo legible del propio PDF
(título + fecha de creación) y el alcance con motivo: solo fam `ec` con SKU — gateways
de campus (sus guías son otros documentos) y EC-V/legacy sin SKU quedan fuera
declarados. **No escribe en el catálogo**: la marca de fin de venta sigue entrando solo
por documento del fabricante con cita literal — automatizar la marca sería automatizar
el juicio. Pareja natural del vigía: `vigia` avisa de que el documento cambió →
`datasheets --force` lo refresca → `vigencia` dice qué cambió en ordenabilidad. Hoy:
9/9 ordenables, cero alarmas. Seis tests fijan la regla (con modelos de mentira) y la
realidad (contra el PDF oficial: si fallan tras un refresco, es la alarma funcionando).

**El monitoreo EC-XS / EC-L-H (pendiente «—») queda cerrado por ese script**: si HPE
retira JM962A o JZ878A de la guía, la alarma salta en la próxima corrida — y la guarda
de `ciclo-de-vida-datos.test.js` sigue impidiendo marcarlos sin documento.

**El congelado de la política de ciclo de vida (pendiente «—») queda declarado y
mecanizado**: entrada `ecLifecycle` en DATASHEETS (la pestaña de fuentes ya la enlaza
oficial, con «copia local» cuando baje). Los bytes no bajan desde este entorno —403 del
proxy, la misma pared de los otros seis datasheets sin copia—: fila nueva en *Bloqueado
por acceso*. La URL viva del documento ya no muestra las líneas por modelo que
fundamentaron el boletín del EC-XL el 2026-09-13, que es justo lo que el congelado
protege; las citas del seed quedan como el registro mientras tanto.

### La cobertura del contraste se mide, no se declara (2026-09-16)

La mejora propuesta al cerrar la entrega anterior — **con la corrección que la propia
propuesta ya advertía**. La idea era que cada caso declarara `cubre: ['ficha.js']`, y ahí
mismo quedó escrito el riesgo: «que el campo se rellene a ojo; un caso que declara cubrir
`bom.js` sin conducir ni una línea del BOM daría una cobertura falsa — peor que no tener el
dato». Eso no es un riesgo que se mitigue con cuidado: es el diseño equivocado. Así que no se
declara, **se mide**: `page.coverage` de Chromium dice qué funciones de cada script se
ejecutaron durante la corrida, y eso no se puede escribir a mano.

**Tres decisiones que hacen la cifra defendible.** La métrica son **funciones ejecutadas** y
no bytes, porque los rangos de V8 **anidan** —el de una función contiene los de sus bloques—
y sumarlos cuenta dos veces lo mismo. Se **une entre cargas de página** en vez de tomar la
mejor, porque un módulo compartido ejecuta funciones distintas en cada pantalla y quedarse
con una diría menos de lo que la corrida hizo. Y hay **tres estados**: `ejercitado`, `rozado`
(se carga pero casi nada suyo corre) y **`sin conducir`**, que **no es «0 %»** — es que
ninguna pantalla de ningún caso lo carga. Reportarlo como cero afirmaría que se midió algo
que nadie miró, el tercer estado de siempre.

**El dato envejece, y el inventario lo dice.** El artefacto
(`scripts/contrastes/cobertura.lock.json`) lleva su `medidoEn: {commit, fecha}` dentro, y
`npm run catalogo` **compara ese commit contra HEAD**: «del commit actual», «de otro commit —
puede estar desfasada» o «nunca medida». Sin eso, una cobertura de hace meses se leería como
un hecho de hoy, que es el vicio del lock del vigía curándose solo.

**La medición corrigió la suposición que originó la mejora.** Se propuso diciendo que
`bom.js` «no tiene ni un caso detrás». Medido: está al **54 %**, porque los dimensionadores
pintan el BOM al cargar. Lo que sí está casi a cero es otra cosa —`comparador.js` al **4 %**
y `calculadora.js` al **6 %**, las dos herramientas del portal que ningún caso toca— y eso no
se habría sabido declarando. Hoy: **10 ejercitados, 4 rozados, 11 sin conducir**.

**Comprobado que la cifra responde a lo que los casos hacen de verdad:** saboteando el caso de
Nokia para que deje de conducir su pantalla, el contraste sale en rojo con 3 discrepancias
**y** `ficha.js` baja de 78 % a 72 %. Las dos señales se mueven.

Verificado: `npm run verificar` (375 pruebas, +8), la corrida completa con cobertura,
`npm run catalogo` con la sección nueva, `npm run pantallas` 16/16 y arranque con
`NODE_ENV=production`. El lint volvió a ganarse el sueldo: cazó un `RAIZ` que no existe en ese
archivo y un `execSync` sin importar, los dos en la sección nueva del inventario.

### El contraste corre en CI, y los tres navegadores comparten su resolución (2026-09-16)

La mejora propuesta al cerrar la entrega anterior, ejecutada. `npm run contraste -- --todos`
entra en el job de `pantallas.yml`.

**Un bloqueador real, encontrado antes de que lo encontrara CI.** Tres scripts abren un
navegador y los tres llevaban su propia copia de «dónde está Playwright y dónde está
Chromium». La de `contraste-motor.js` —escrita el día anterior— fijaba `/opt/pw-browsers/…`
sin alternativa y pasaba **siempre** `executablePath`: habría fallado en el primer intento en
el ejecutor, donde Playwright se instala en `node_modules` y trae su propio Chromium. Las
tres copias se unifican en `scripts/ayuda/chromium.js`, conservando el orden de búsqueda de
las dos que sí funcionaban. Medido simulando el ejecutor (parcheando `existsSync` para que
ninguna ruta conocida exista): devuelve `{}`, que es exactamente lo que hace hoy
`verificar-pantallas.js` en verde.

**Por qué en el mismo job y no en un workflow aparte.** El contraste necesita lo que ese job
ya monta: Chromium, un servidor con `NODE_ENV=production` y una clave efímera que se genera
en el propio ejecutor. Uno propio pagaría ese montaje dos veces para comprobar lo mismo sobre
el mismo commit. Va **después** de las pantallas y se ejecuta **aunque estas fallen** (pero no
si el servidor no arrancó): son preguntas distintas y tener las dos en un informe evita una
segunda corrida.

**Lo que este control sí y no gatea, dicho claro.** Railway espera a `verificar` y **no** a
`pantallas` (punto 33), así que un contraste en rojo **no frena el despliegue hoy**. Lo hará
el día que ese pendiente se cierre. Escribirlo aquí es lo mismo que se hizo con la cabecera de
`pantallas.yml`: una protección que se anuncia y no existe es peor que ninguna.

**Dos defensas contra que se vuelva ceremonia.** `--todos` deriva la lista del directorio, así
que añadir `contrastes/cisco.js` basta y no hay una lista en el YAML que se quede atrás — un
caso que nunca corre se porta igual que uno que pasa. Y cada caso declara
`medidoEn: {commit, fecha}`, que el informe **imprime**: una línea base medida hace meses
sigue pasando en verde y ya no quiere decir lo mismo.

**Y una tercera contra el gasto inútil:** `test/contraste-casos.test.js` (9 casos) frena en
`npm run verificar` —segundos, en cada push— lo que se ve leyendo el archivo: un caso sin
`leer`, una pantalla renombrada, una clave que la línea base no mide, una procedencia
ausente. Misma idea que `test/pantallas-campos.test.js`: parsear en vez de ejecutar cuando
ejecutar es caro.

De paso, el arnés pasó a **una sola sesión para todos los casos** (`abrirSesion` +
`correr(caso, sesion)`): el comentario ya prometía un solo navegador y la implementación
abría uno por caso.

Verificado: `npm run verificar` (367 pruebas, +9), el comando **exacto** de CI corriendo en
local con la clave por entorno y sin `--password` (2 casos, sin discrepancias, salida 0),
`npm run pantallas` 16/16 y `npm run manual` tras el refactor del helper. **Comprobado que
detecta en las dos mitades:** cambiando un texto visible del módulo compartido, la corrida
sale con código 1 nombrando el caso; quitando la procedencia y declarando una clave que la
línea base no mide, caen 2 de 9 pruebas antes de tocar un navegador.

### Pendientes 34, 35 y 38, y el arnés de contraste compartido (2026-09-16)

Los tres pendientes que la entrega anterior propuso, más la mejora propuesta al cerrarla.
El detalle de cada uno está en su punto; aquí lo que los une.

**La mejora primero, porque es lo que hizo seguro el 35.** `scripts/contraste-fortinet.js`
se partió en un **arnés** (`scripts/contraste-motor.js`) más **casos declarados**
(`scripts/contrastes/*.js`), con `npm run contraste -- <caso>`. Lo único que cambia entre
casos es traducir un escenario a los controles de *su* pantalla y leer de ella lo que se
compara; entrar por el muro, conducir Chromium, comparar contra la línea base y salir con
código distinto de cero es idéntico. Copiar el archivo para el segundo caso habría sido
exactamente como `llevarABom` acabó en seis copias que no hacían lo mismo. **No generaliza
de más a propósito**: `preparar()` recibe la página y hace lo que haga falta, sin intentar
adivinar campos comunes — un traductor que aceptara campos que una página no tiene acabaría
rellenando controles inexistentes, que es el fallo que el gancho `caudal(page)` existe para
evitar. El caso de Fortinet se reprodujo idéntico tras la partición.

**Y sirvió el mismo día.** Al mover la regla de puertos de Nokia, el contraste cazó dos
tildes perdidas en texto visible («Configuracion de puertos», «Opcion 1 de 2»). Es
literalmente el fallo que un refactor produce y que una revisión a ojo no ve.

**Lo que los tres pendientes tenían en común: una afirmación deducida.** El 34 daba por
vigente todo modelo sin marca; el 35 daba por hecho que la regla de Nokia no estaba en
ninguna pantalla (estaba, pero solo en la suya); el 38 daba por hecho que el 403 era del
fabricante. Los tres se cerraron **midiendo**, y en dos de ellos la medición contradijo la
premisa: la copia de Aruba **ya** pintaba verde falso sobre sus propios 25 modelos, y 2 de
las 3 fuentes bloqueadas no lo estaban por el fabricante sino por pedir una carpeta.

Verificado: `npm run verificar` (358 pruebas, +10), `npm run catalogo`, `npm run contraste`
en sus dos casos, `npm run pantallas` 16/16 contra un arranque con `NODE_ENV=production`, y
los siete dimensionadores conducidos a mano en Chromium sin una sola excepción — Cisco y
Juniper en verde citando su boletín, los otros cinco en el tercer estado, y la sección de
puertos en los siete. La revisión diferencial del diff está en `docs/revision-34-35-38.md`;
de ella salió un hallazgo propio: el CSS del semáforo de Aruba quedó inerte al sustituirlo
y se retiró, porque es la misma forma que `CISCO_EOL_MODELS`.

### EC-XS verificado VIGENTE en fuentes oficiales + resaltado de fin de venta con la fecha encima (2026-09-16)

Petición directa del dueño: «valida en las fuentes oficiales si el EC-XS sigue vigente o
entró en EOL… y resalta si hay equipos con esta condición para que los usuarios lo sepan».

**La validación (cuatro fuentes oficiales, ninguna marca el EC-XS):**
1. QuickSpecs oficiales a50004289enw **V18 del 06-jul-2026** (copia en el repo,
   `public/datasheets/edgeconnect-quickspecs.pdf`): el EC-XS figura ORDENABLE en
   Configuration Information → BTO Models → «Extra Small» (JM962A#AC3), igual que la
   variante NAL S3N70A y sus accesorios JM965A/JM996A. Cero marcas de fin de venta en
   las 47 páginas. La versión online actual (hpe.com) mantiene la misma línea.
2. Product Warranty Quick Reference oficial (a00143138enw): JM962A «Active», garantía
   1-Year, SIN fecha de End of Sale.
3. Política de ciclo de vida oficial (EC_LifecyclePolicy_latest.pdf, en vivo): la única
   mención al EC-XS es histórica — la versión de 4 GB declarada EoS el 31-dic-2016,
   una revisión de hardware antigua, no el modelo actual.
4. El anuncio que citan los agregadores («EdgeConnect XS Gateway End of Sale
   Announcement», EoS 31-ene-2026) **no existe en ningún canal oficial**
   (networkingsupport.hpe.com: 0 resultados) y queda contradicho por (1): unas
   QuickSpecs publicadas cinco meses después de esa fecha no listarían el SKU como
   ordenable. Veredicto: la casa nunca marca por agregadores — el EC-XS queda SIN
   boletín, y un test de datos fija el veredicto para que nadie lo «arregle» desde un
   checker de terceros. EC-L-H (JZ878A): misma señal, mismo veredicto (ordenable en
   las QuickSpecs V18).

**El resaltado, integrado con la regla única del pendiente 34** (los commits del dueño
movieron el semáforo a `FICHA.cicloHtml` mientras esta validación corría — la integración
quedó sobre SU arquitectura, no sobre la copia vieja de Aruba): el EC-XL, con su último
pedido (2026-03-31) ya vencido, sale ROJO «Fuera de venta» en el catálogo con su fecha,
y el detalle suma ahora el **fin de soporte del boletín** («soporte del fabricante hasta
el 2033-03-31») — el dato que salva la renovación del parque instalado, opt-in como en
`avisoDe()`. El combo de selección nombra la condición con la marca de ficha.js
(«fin de venta vencido», no «fin de venta» a secas). El EC-XS, sin boletín y sin respaldo
declarado a nivel fabricante, sale en el **tercer estado** («Sin dato de ciclo de vida»):
nunca verde por omisión y nunca con una marca de fin de venta sacada de un agregador.
Cubierto por `test/e2e/e2e-ciclo-vida.js` (nuevo) y por la guarda de datos en
`test/ciclo-de-vida-datos.test.js`.

**Nota de gobierno:** la URL viva de la política de ciclo de vida ya no muestra hoy las
líneas por modelo que fundamentaron el boletín del EC-XL el 2026-09-13 (la copia en
caché de buscadores sí las conserva; el documento cambia sin historial público). Las
citas del seed quedan como el registro — si el dueño quiere, se guarda una copia
congelada del PDF en `public/datasheets/` como se hizo con las QuickSpecs.

### Rediseño del módulo Fortinet sobre la arquitectura de Aruba (2026-09-16)

Dos entregas, en dos commits, según lo acordado con el dueño del repo.

**Etapa 1 — la escalera de 4 pasos y la capa comercial.** El formulario era una columna
de catorce controles sin jerarquía; ahora son cuatro pasos con la misma semántica que
Aruba —*plataforma y rol*, *capa de inspección*, *tráfico y capacidad*, *equipo y
cotización*— y el panel de «Selección de equipo» sube desde la pestaña de BOM a la
calculadora, donde se decide. Lo que **no** se copió de Aruba, y por qué, está en
`docs/rediseno-fortinet.md`: el tier por caudal, el pool de Boost, el rango WAN publicado
y la auditoría de puertos son del modelo comercial y del catálogo de HPE, no de Fortinet.
La capa comercial sí es universal, y por eso bajó al módulo compartido: simulador de
descuento, TCO sobre las filas neutras y perfiles multi-sede quedan disponibles en
Fortinet sin duplicar una línea de lógica. **Las reglas de agregación se declaran vacías a
propósito** (`BOM.consolidar(l,{agregadas:[],unicas:[]})`): en FortiGate cada sede compra
su equipo y su suscripción, y heredar en silencio las de Aruba habría dado un consolidado
con precios de otro fabricante.

**De paso, un error de dinero en el módulo compartido.** Añadir al BOM una referencia cuyo
SKU es el del propio equipo calculado sumaba la línea dos veces sin decirlo: medido,
$38.088,20 → $49.565,20. Ahora `renderTabla` lo avisa, y el aviso vale para los siete
fabricantes porque vive en `bom.js`.

**Etapa 2 — el Multi-Underlay Builder.** `pctOverlay` era un **deslizador con el que el
usuario estimaba a ojo** justo el número que fija el segundo techo del motor
(`min(capa de inspección, IPsec / fracción)`). Ahora los enlaces WAN del sitio se declaran
como filas y la fracción **se calcula**. La fila de FortiGate es más corta que la de Aruba
a propósito: sin `medio` (este catálogo no trae ópticas de Fortinet, así que una auditoría
de puertos sería un dato inventado) y sin `up` (el motor consume un solo caudal, y un campo
que nadie lee es peor que uno ausente), pero **con `overlay`**, que Aruba no necesita.

**El motor no cambia, y se demostró en vez de declararse.** `#bw` y `#pctOverlay` siguen
siendo lo que `render()` lee; el builder solo los calcula, como espejos ocultos.
`scripts/contraste-fortinet.js` conduce en Chromium los ocho escenarios medidos sobre el
commit anterior y exige la misma recomendación, el mismo requerimiento y el mismo número de
candidatos: **los ocho idénticos**, y las seis migraciones de enlace v1 también. Se
comprobó que el contraste detecta saboteando el cálculo del caudal — seis discrepancias con
la cifra concreta.

**La lección del 2026-09-13 no se repitió.** Cuando Aruba retiró su `#bw`, `pantallas.yml`
quedó en rojo cuatro días porque el verificador rellenaba ese campo en las ocho páginas.
Aquí el gancho `caudal(page)` de Fortinet entró en el mismo commit, con un `extraAcciones`
que conduce el caso de dos enlaces y exige que la barra agregada declare la fracción
cifrada; apagando esa línea, `npm run pantallas` da 15/16 nombrando el fallo. **No hay un
gancho compartido entre los dos builders**: las filas no tienen los mismos campos, y uno
común tendría que rellenar controles que en una de las dos páginas no existen.

Verificado: `npm run verificar` (348 pruebas), `npm run catalogo` (PANTALLAS en verde, 29
campos en Fortinet), `npm run pantallas` 16/16 contra un arranque con `NODE_ENV=production`,
y la página conducida a mano en Chromium — casilla de overlay deshabilitada sin rol SD-WAN
y declarándolo, validación en línea, default por transporte que no pisa una elección manual,
duplicar/quitar, última fila que no se puede quitar, y el enlace compartido reabierto con
las dos filas y el mismo equipo.

### Plan 5: HA On-Premises E-STU (#17), 7 años On-Premises completos y cantidades ajustadas a mano en el BOM (2026-09-16)

**#17 cerrado — el par HA on-prem ya tiene SKU propio.** La premisa del pendiente («HPE
no publica equivalencia E-STU de HA») era falsa: el QuickSpecs EdgeConnect vigente
(a50004289enw) lista la escalera **«EdgeConnect On-Premises High Availability E-STU»**
completa — 8 tiers (20M/50M/100M/200M/500M/1G/2G/ILIMITADO) × 1/3/5/7 años. La lista del
distribuidor tarifa los 32 SKU (PLC GA, vigencia 2026-06-01) y la invariante histórica se
cumple celda a celda: **precio HA idéntico al estándar on-prem del mismo tier y término
(32/32)** — solo cambia el número de parte. Cableado como `LICENSES_HA[bw].onprem`
(familia CSV nueva «Suscripcion EdgeConnect On-Premises HA»); el dimensionador resuelve el
segundo nodo con su SKU HA en las tres modalidades y la nota declara la fuente. El CSV de
precios pasó de 234 a 272 filas por la vía gobernada (`importar-lista-aruba.js`, dry-run
limpio: 0 divergencias de precio repo↔lista).

**Corrección de datos cazada por la medición.** La revisión del 2026-09-15 (#28) declaró
«On-Premises no-HA: solo 1G y 2G tienen 7 años». Era un artefacto del filtro: esas filas se
describen «EC ONP 20M 7y E-STU» (sin «Gb» ni «yr Sub») y no se vieron. Re-verificación
literal: la lista SÍ publica los 6 términos que faltaban (20/50/100/200/500M y UL — PLC GA,
vigencia 2026-06-01); entran en `LICENSES[bw].onprem.y7` y el test de cobertura exacta de
7 años se reescribe con la corrección documentada.

**Mejora ejecutada (propuesta del plan 4): cantidades editables a mano en el BOM de Aruba.**
El dimensionador calcula cada cantidad, pero el ingeniero de preventa puede ajustarla: la
línea queda sellada «cantidad ajustada a mano — el cálculo decía N» (borde discontinuo en
el input, sello ámbar bajo la descripción), el ajuste viaja en el enlace compartido
(`#bomAjustes`, en `CAMPOS_ESCENARIO`), se declara en el texto plano (nota inline + sección
de cierre) y en el Excel (columna Notas + bloque propio), y alimenta TCO y totales porque
se aplica antes que todos los consumidores. Volver a la cifra calculada poda el ajuste
(nada que declarar); los ajustes de líneas ausentes se conservan por si la línea vuelve;
las líneas sin cifra (`qty` null, p. ej. SSE «consultar») no ofrecen control — lo que falta
ahí es el dato del cliente, no una cifra que pisar. Opt-in en `bom.js` (`o.ajustable`, como
`o.editable`): los otros 6 fabricantes no cambian. Regla del piloto: solo Aruba hasta que
el dueño diga lo contrario. Pruebas: `test/bom-ajustes.test.js` (7) y `test/e2e/e2e-ajustes.js`
(12), con sabotaje verificado (apagar `ajustable` rompe el E2E).

### Plan 4: datos 7 años, ópticas SFP en el BOM, candidatos clicables, UX del dimensionador y la batería E2E en el repo (2026-09-15/16)

Dos instrucciones del dueño, ejecutadas con la regla de siempre (fuente oficial > brief;
donde falta el dato, «consultar» — nunca inventado). Paquetes A-D integrados en
`feature/plan4` y fusionados a main.

**Paquete A — datos (pendientes 27/28/32).** Término de 7 años cableado donde la lista
oficial lo publica y `null` («consultar») donde no: Advanced SaaS 20M→2G (UL no existe en
la lista), On-Premises solo 1G/2G, Foundation 1G/UL, la escalera HA completa, Boost
(100M/10G) y DTD On-Prem. CARE no se extiende: la lista no trae «7Y FC». La medición cazó
un bug real: `tierPrice`/`tierSku` caían al *else* de 3 años — 7 años se habría cotizado a
precio de 3. JM538A y JM769A entran como variantes del EC-S (que ya era el EC-S-P);
JM778A (NFR) y JM538AR (reman) fuera a propósito. Títulos del BOM unificados a
«Lista/Neto» en tabla, Excel y texto plano (`bom.js`, compartido: es etiqueta, no cifra).

**Paquete B — el usuario decide la óptica y el equipo.** (1) Cada enlace WAN con medio
SFP 1G/SFP+ 10G añade su óptica al BOM (una por enlace × unidades del sitio, HA 1+1 = 2):
candidatas = compatibilidad oficial del modelo ∩ lista de precios, a la velocidad del
medio, sin DAC/TAA/PLC-ES. Cero opciones → aviso; una → automática; varias → **mensaje
para que el usuario elija, sin valor por defecto**, con la línea «PENDIENTE DE SELECCIÓN»
hasta que elija. La elección viaja en el enlace compartido (`#sfpPickData`). (2) La ficha
muestra «Equipos que cumplen · N» con la lista clicable de **todos** los candidatos que
pasan el filtro — no solo el recomendado — como opt-in de `ficha.js`; las otras páginas
no cambian.

**Paquete D — los 10 ajustes de UX pedidos (2026-09-15).** Botón «copiar enlace»
duplicado retirado (queda uno); «Limpiar escenario» con confirmación (URL a pelo +
recarga); el destino de tráfico declara su cálculo (×1,00 híbrido / ×1,05 cloud-first);
el perfil de datos de Boost se **queda** — decisión de arquitecto: alimenta el widget de
rendimiento, el dimensionado de reserva sin enlaces y la justificación de la ficha — y su
ayuda declara dónde actúa y dónde NO (ni el modelo del appliance ni el tier de la
suscripción, doctrina oficial); usuarios/dispositivos declara sus tres influencias y con
estrategia SSE se convierte en la **cantidad de licencias** (vacío → línea PENDIENTE y
campo marcado, nunca un «1» inventado); AIOps queda declarado como capacidad del nivel
Advanced — ya forzaba Advanced en EdgeConnect y Central, no es SKU aparte —; el campo
«cantidad (unidades)» se retira: las unidades se deducen de HA (1 o 2); el tier de caudal
declara que **tarifa y no dimensiona**, con la opción «Automático» mostrando en vivo el
tier deducido del Σ WAN del módulo 2; «Añadir a la lista de materiales» se mueve al final
de la pestaña; y la lista de materiales sube al principio y es **editable**: toda línea
(computada o manual) se puede retirar (✕) a una sección restaurable, las omisiones viajan
en el enlace (`#bomOmitidas`) y se excluyen de totales, texto, Excel y TCO.

**Paquete C — la batería E2E promovida al repo (#40).** `test/e2e/` con runner propio:
`npm run e2e` levanta un servidor desechable (puerto 4131, SQLite en /tmp) y corre los
cinco guiones en serie. Fuera de `verificar` a propósito (exige Chromium instalado) — el
workflow de CI se entrega en parche (`e2e-ci.patch`) por la falta de scope «workflow»
del token; aplicarlo es acción manual del dueño.

Verificación: 335/335 pruebas y eslint limpio (`npm run verificar`), 5/5 guiones E2E en
verde (51 comprobaciones). Fusionado a main (`769bf2c`); Railway despliega solo.

### Plan 3: underlay WAN carrier-grade, DTD cotizado, «pendiente de cotización», Nokia visible y enlace de escenario (2026-09-14)

Instrucción del dueño: «avanza con el 39, 29, 31, 33-38 — revisa el diseño de cómo se
ingresan los BW enlaces WAN del sitio (underlay), MEJÓRALO». Orquestación multi-agente
(dos frentes con archivos disjuntos, integrados por bundles).

- **Rediseño del input WAN underlay** (la petición central): de filas planas a filas
  tarjeta con badge por familia (MPLS/Internet/celular), toggle «Simétrico» (up sigue a
  down, persiste en el estado v2), botón duplicar, validación inline (down vacío, up>down,
  celular por fibra), sugerencia de medio por tipo solo si no se tocó a mano, y barra
  agregada viva `#wanResumen` (Σ↓/Σ↑, desglose MPLS/Internet, puertos WAN +2 LAN y
  semáforo de densidad contra el modelo — la misma función `evaluarPuertos` gobierna el
  descarte del EC-10104: la regla no se duplica). Contrato de IDs intacto.
- **#31**: DTD resultó tener escalera completa en la lista (SaaS/On-Prem × std/HA ×
  1/3/5 años, $372-$1.860, PLC GA) — el BOM lo cotiza con SKU y precio reales, dos
  líneas en HA 1+1, sin forzar Advanced (QuickSpecs p.32). CSV 192→204 por el importador.
- **#29**: las líneas sin precio verificado se etiquetan «PENDIENTE DE COTIZACIÓN» en el
  BOM, el texto plano y el Excel — el «consultar» ya no se puede olvidar al enviar.
- **#39** (secciones ausentes del brief, diseño de arquitecto autorizado): campos
  cliente/proyecto que encabezan BOM/Excel y botón «Copiar enlace del escenario» con
  round-trip (se encontró y corrigió un bug real: secMode no se restauraba desde la URL).
- **#35**: las dos páginas Nokia muestran su auditoría de puertos (alternativas no
  acumulables, nota literal en chasis modulares, tercer estado honesto).
- **#33**: la cabecera de `pantallas.yml` ya dice la verdad; el required check de main
  queda como acción manual del dueño en GitHub. **#34**: la regla de 3 estados del
  semáforo queda fijada en test sobre los 189 modelos. **#38**: verificado — las tres
  fuentes 403 salen «no comprobada», nunca en verde; es restricción del fabricante.

Verificación: 334/334 tests, E2E Chromium 12/12 del plan + comprobación rápida de
descuento/TCO/widget. Se corrigió en integración un binding de render que faltaba en
`nombreCliente`/`refProyecto`.

### Motor de ingeniería carrier-grade + submenú Cumplimiento Especial (2026-09-13)

Sección 1 del brief carrier-grade del dueño (el archivo llegó truncado — ver pendiente
39). El dimensionamiento del appliance pasa a una función matemática determinista y
testeable: `public/js/motor-ingenieria.js` (módulo puro UMD) con
`calcularRequerimientosIngenieria` — IMIX por perfil de tráfico (0,70 empresarial /
0,55 voz / 1,00 backup), FEC 5/15/25 %, cargo de seguridad (35 % NGFW local / 5 % SSE),
margen de crecimiento, segregación 70/30 del caudal total con Local Breakout, flujos
80/150 por usuario y licencia tasada por el ancho de banda físico agregado. Sin doble
conteo de IMIX: el requerimiento ya viene ÷IMIX, así que EdgeConnect compara contra el
throughput nominal publicado (los gateways 9000/9200 conservan su regla). Nuevo
selector de perfil de tráfico; el widget declara la fórmula única con sus componentes
vivos. TAA/NAL/FIPS recogidas en el submenú colapsable «Cumplimiento Especial / Sector
Público», cerrado por defecto. Los inputs manuales de «throughput de firewall» y
«túneles IPSec» no existían ya — el brief pedía eliminarlos: verificado, el
dimensionado es por flujos y caudal agregado. 7 tests nuevos de la fórmula (273/273 en
verde), E2E Chromium 13/13.

### La capa comercial sale del archivo de Aruba (2026-09-13)

Paso 1 del orden de [`docs/portabilidad-aruba.md`](docs/portabilidad-aruba.md), aprobado por el
dueño. Mientras TCO y simulador de descuento vivieran dentro de las 2.117 líneas de Aruba,
portarlos a los otros siete significaba copiarlos siete veces — el fallo de `llevarABom` en seis
copias con más superficie.

- **`BOM.simuladorDescuento()`**: el control se **construye** en el módulo, con sus tramos y su
  aviso de «simulador genérico, no el descuento real del distribuidor». Es la decisión de
  `ESTADO.botonEnlace` — añadirlo a otra pantalla es una línea, no doce de marcado repetido.
  Conserva los ids `selDescuento`/`dtoCustom` porque `estado.js` los serializa en el enlace
  compartido, y por eso quedan declarados en `TARDIOS`.
- **`BOM.tco()`**: se calcula sobre las **filas del BOM**, que ya son la forma neutra. Antes
  salía de los objetos de licenciamiento de Aruba, y eso era lo que lo ataba a una sola página.
  **Qué cuenta como OPEX lo declara la página**, por lo mismo que las reglas de agregación.

**Medido antes de cambiarlo, no supuesto.** Siete escenarios en el navegador con las tres cifras
(CAPEX, OPEX anual, TCO) idénticas a las del cálculo anterior. El primer contraste solo cubría el
camino fácil —sin Boost ni seguridad— así que se repitió activando Boost y DTD, que son los que
traen las categorías del camino largo; sin eso la clasificación habría quedado verificada a
medias.

**Y el comprobador de ayer se ganó el sueldo:** al sacar el marcado del HTML, `npm run catalogo`
reportó en el acto «selDescuento: no existe ningún control con ese id». La prueba que lo guarda
también se rompió, pero por un motivo distinto y peor: exigía que la única excepción fuera
`verdict-sel`, codificando el estado de ese día en vez de la regla. Corregida para afirmar lo que
importa — que las excepciones se usan y ninguna ha caducado.

**Lo que NO subió**: la matriz de accesorios. Solo Aruba tiene compatibilidad declarada, y
construir la pantalla antes que el dato produce seis paneles vacíos — es el paso 4 del orden, y
está bloqueado por dato, no por código.

287/287 pruebas, lint limpio y 16/16 pantallas.

### Los perfiles multi-sede dejan de ser de un solo fabricante (2026-09-13)

Sale de la **revisión de arquitectura** que pidió el dueño sobre lo que dejó el otro motor de IA
—«valida la estructura de los fabricantes que faltan, no la forma como se calcula el
dimensionamiento, porque se dimensionan de diferente manera»—. El informe completo está en
[`docs/portabilidad-aruba.md`](docs/portabilidad-aruba.md), y de él salen también los pendientes
34 y 35.

**El defecto.** Los perfiles nacieron en `arubaPerfilesV1`, una clave por fabricante. Un perfil
multi-sede es *por definición* el caso de las 50 sucursales, y un despliegue real de 50 sedes
**mezcla marcas**: spokes Fortinet contra un core Nokia, EdgeConnect en sucursal con Catalyst en
el datacenter. Con una clave por página, el consolidado de cada fabricante ignoraba al resto en
silencio — el mismo fallo que `presales-bom-refs:<pathname>` ya tuvo y que se corrigió el
2026-09-09. Se arregló **antes** de portar la función a los otros siete, porque después costaba
siete veces.

- **Una sola clave** (`presales-perfiles`) en `bom.js`, copiando el patrón que ese archivo ya usa
  para las referencias: cada perfil lleva su `vendor` dentro, y la clave vieja **se migra** en la
  primera lectura y se borra. Sin eso, quien ya tuviera perfiles los vería desaparecer al
  desplegar — justo la pérdida que el cambio venía a evitar.
- **Cargar es del fabricante; consolidar no.** `campos` son los ids del formulario de *esa*
  página, así que aplicar un perfil de Fortinet al de Aruba no significa nada y no se ofrece. Pero
  `filas` es la forma neutra que los siete comparten, y el BOM global suma **todos**: ese es el
  valor real, y es la distinción que hace correcto el cambio.
- **Se borra por id, no por índice.** En una lista compartida el índice deja de ser estable en
  cuanto otro dimensionador guarda algo, y borrar por posición borraría el perfil del vecino.
- **Las reglas de agregación las declara la página.** El pool de Boost en una línea y el
  Orchestrator único por fabric son el modelo **comercial de Aruba**, no una regla universal:
  dejarlas a fuego en el módulo compartido haría que cualquier fabricante que use esos nombres de
  categoría heredara la semántica de precios de Aruba sin que nadie lo decidiera. Quien no declare
  nada multiplica todo por sedes.
- **Y si el consolidado mezcla marcas se dice en pantalla**, no solo en el Excel: leer las reglas
  de Aruba como si aplicaran a las líneas de otro fabricante es exactamente lo que un aviso
  ausente invita a hacer.

**Comprobado que las pruebas detectan, no solo que pasan:** desactivando la migración reportan
los perfiles perdidos; devolviendo las reglas a fuego, el fabricante que no las declara hereda la
semántica de Aruba y la prueba lo dice.

Conducido en Chromium de extremo a extremo: tres perfiles guardados, uno de Fortinet sembrado a
mano que **no** aparece en la lista de Aruba pero **sí** entra en el consolidado, supervivencia a
la recarga, borrado del perfil del medio sin tocar al vecino, y una cotización de **52 sedes con
FortiGate 60F ×40 y EC-M ×12 juntos**. 287/287 pruebas (8 nuevas) y 16/16 pantallas.

### Una pantalla y su estado ya no se desincronizan en silencio (2026-09-13)

Mejora propuesta al cerrar la entrega anterior y aprobada por el dueño. Sale de mirar los dos
fallos del día y ver que eran **el mismo**: el refactor de Aruba retiró `#bw` y ninguna
comprobación cruzó ese cambio con la lista de campos que el enlace compartido repone. El
inventario miraba el catálogo —cobertura, ciclo de vida, precios, procedencia— y **nada** de
la capa de presentación.

`npm run catalogo` gana la sección «PANTALLAS»: cruza los `campos` que cada dimensionador
declara en `ESTADO.vincular()` contra los `id=` de su propio HTML. Hoy salen las ocho en
verde, 124 campos en total.

Cuatro decisiones, cada una contra un modo de fallo concreto:

- **Se parsea, no se ejecuta.** En `dimensionador-nokia-7220ixr.js` la llamada vive tras un
  `await fetch(...)`, así que cargar el módulo exigiría doblar la red y el DOM para leer un
  array literal. Cuando `campos:` es un identificador —el `CAMPOS_ESCENARIO` de Aruba— se
  resuelve su declaración en el mismo archivo.
- **Una página que no se sepa leer es un error, no un salto.** Un comprobador que no
  comprueba se porta igual que uno que pasa: es `CISCO_EOL_MODELS` otra vez.
- **Las excepciones caducan solas.** `verdict-sel` no está en ningún HTML porque lo construye
  `ficha.js`; la excepción declara el módulo **y el ancla que debe seguir existiendo en él**.
- **También se comprueba que se miran las ocho páginas.** Un parser que devolviera lista vacía
  dejaría todo en verde sin haber mirado nada.

**Y el ancla se aprendió saboteando, no razonando.** La primera versión anclaba en
`${cid}-sel`; al renombrar el control a `${cid}-selector` para ver si saltaba, **no saltó** —
el ancla corta seguía siendo subcadena de la larga, así que la excepción se daba por viva
sobre un control que ya no existía. Con el ancla completa (`<select id="${cid}-sel">`) sí
salta. Los otros tres sabotajes —renombrar un `id` del HTML, romper la forma de la llamada y
quitar un dimensionador— se detectaron a la primera.

La regla vive en `scripts/catalogo-check.js` y `test/pantallas-campos.test.js` solo la afirma,
una sola implementación como `FICHA.rango()` con el fin de venta. Está en las pruebas y no
solo en el inventario porque `npm run catalogo` se corre cuando alguien se acuerda, y
`npm run verificar` corre en cada push. 279/279 pruebas (3 nuevas) y 16/16 pantallas.

### Un enlace compartido ya no se pierde en silencio (2026-09-13)

Mejora propuesta al cerrar la entrega anterior y aprobada por el dueño. Sale de lo que se
acababa de tocar: `migrarEstadoV1()` salvó los enlaces de Aruba cuando esa pantalla retiró su
campo `#bw`, pero **solo porque alguien se acordó de escribirla para esa página**. La regla
general no existía, así que cualquier otra pantalla que renombre un control seguiría dejando
al receptor viendo otro escenario sin una sola señal — el mismo modo de fallo que
`RENOMBRADAS` evita para el nombre del archivo, y que nadie cubría para los parámetros.

`ESTADO.vincular()` devuelve ahora `ignorados` y `ESTADO.avisoOrigen()` los **nombra** en
pantalla, en los ocho dimensionadores a la vez porque el módulo es compartido. Tres decisiones
son lo que separa un aviso útil de un ruido que se aprende a ignorar:

- **Se avisa aunque el enlace no traiga ningún campo reconocible.** Es el caso peor: la
  pantalla sale entera en blanco, y sin el aviso no habría absolutamente nada que explicara
  por qué. Es justo el caso que un `if (!origen) return` habría dejado fuera.
- **No se denuncia lo que la página sabe migrar.** Se declara en `cfg.migrados`, y Aruba pasa
  `PARAMS_V1` — la misma constante que usa `migrarEstadoV1()`, extraída para que no haya dos
  listas iguales en dos sitios, que es como se desincronizan.
- **Tampoco las marcas de campaña** (`utm_*`, `gclid`, `fbclid`…), que nunca fueron escenario.

Los nombres se escapan antes de pintarse —la URL la escribe quien manda el enlace, y confiar
eso a la CSP sería dejar la corrección de una pantalla en manos de una cabecera de otra capa—
y la lista se acota a seis, porque un párrafo que nadie lee no avisa.

Verificado en Chromium en seis escenarios, incluidos los dos que importan: un enlace v1 de
Aruba **no** dispara el aviso (se migró de verdad) y uno de Cisco con solo parámetros viejos
**sí** lo dispara. `npm run pantallas` guarda el falso positivo: quitando `migrados` de Aruba,
el informe lo reporta. 276/276 pruebas (10 nuevas) y 16/16 pantallas.

### El verificador de pantallas vuelve a conducir Aruba, y ahora dice qué le falta (2026-09-13)

`pantallas.yml` llevaba **cuatro días en rojo** sobre `main`. El refactor del dimensionador
Aruba sustituyó su campo `#bw` por el Multi-Underlay Builder, y `scripts/verificar-pantallas.js`
seguía rellenando `#bw` en las ocho páginas: `page.fill: Timeout 30000ms exceeded`, 14/15. La
pantalla que más cambió —1.702 líneas— se quedó sin la única comprobación que la conduce en un
navegador, que es justo la clase de fallo que este repositorio documenta como invisible a `curl`.

**Se midió antes de tocar nada, y la conclusión importa: la página funciona.** Conducida a mano
en Chromium, 13 equipos cumplen a 2,5 Gbps, EC-M sale recomendado, el builder responde y el BOM
pinta 20 KB; los únicos errores de consola son los ambientales de siempre (Google Fonts y el
favicon) y no hay una sola petición fallida al propio origen. El rojo era del verificador.

Qué cambió, y por qué cada cosa:

- **`caudal(page)` es ahora un gancho opcional por página.** El defecto de fondo no era el
  selector: era asumir una sola forma para ocho páginas. Siete siguen entrando con una línea
  (el `#bw` por defecto) y Aruba declara el suyo sobre las filas del builder.
- **Un control ausente falla en el acto y con su nombre**, no con treinta segundos de espera.
  Un rojo que tarda medio minuto en decir «ese campo ya no existe» se lee como lentitud del
  ejecutor, y así es como se acaba ignorando.
- **La ficha tiene que repintarse al mover el caudal.** El comentario del script lo prometía
  desde que se escribió; nadie lo comprobaba.
- **El E2E del refactor vuelve al repositorio.** El que declaró la entrega anterior (11/11)
  vivía en `/tmp/e2e-refactor.js` y murió con su sesión: 1.702 líneas nuevas sin una sola
  comprobación repetible. Ahora corre en cada push: segunda fila WAN, y el banner Microbranch
  apareciendo y **retirándose** en sus umbrales.
- **Pantalla nueva: el enlace compartido v1.** `migrarEstadoV1()` estaba bien escrita y nunca se
  había ejecutado en un navegador. Verificada a mano en los tres casos —`?bw=2500&unit=1`,
  `?bw=2.5&unit=1000` (multiplica bien) y MPLS+Internet, que da dos filas— y fijada como
  pantalla propia. Un enlace viejo que aterriza con los valores por defecto es **peor que un
  404 porque no se nota**: el receptor ve otra recomendación y no tiene cómo saberlo.
- **La navegación del portal deja de esperar al evento `load`.** Medido desde este entorno: las
  siete navegaciones alternaban 90 ms y **12.100 ms**, y esos 12 segundos son el mismo bloqueo
  de Google Fonts que `js/fuentes.js` documenta. Lo que se afirma ahí es que el botón *navega*,
  así que se espera a `commit` más `domcontentloaded`. Los `ERR_ABORTED` de la vuelta al portal
  se descuentan por **el momento** en que ocurren y no por su nombre: fuera de esa ventana, un
  script cancelado sigue siendo un fallo.

**Se comprobó que detecta, no solo que pasa**, con tres sabotajes: renombrando `data-campo=down`
dice que falta ese control; con el banner forzado a oculto lo declara; y desactivando
`migrarEstadoV1()` reporta la fila DIA vacía, que es exactamente su fallo silencioso.

16/16 pantallas y 266/266 pruebas. De aquí sale el pendiente **33**: Railway desplegó ese commit
con SUCCESS pese al rojo, así que `pantallas` no frena un despliegue aunque su cabecera diga que
sí. También se archivaron `SPEC.md` y `plan.md` —artefactos de proceso de otro motor, con rutas
`/mnt/agents/output/` que no existen aquí— en `docs/refactor-aruba-2026-09-13/`, y se reconcilió
`CLAUDE.md`, que tras 54 commits solo había cambiado tres líneas.

### Refactor integral del dimensionador Aruba en 7 módulos (2026-09-13)

Brief del dueño ejecutado con orquestación multi-agente (`docs/refactor-aruba-2026-09-13/SPEC.md` como contrato, dos
frentes —datos y motor/UI— integrados por bundles). Todo lo que el brief contradecía a
la fuente oficial quedó resuelto a favor de la fuente oficial y documentado (pendientes
28-32): S2N67A a $9.096 (no $7.146), PSU del 9240 = R7J63A $747 (no R1C72A, que es un
kit de APs), Boost con factores oficiales 1,3/2,0/1,8 (no ×3,5), DTD sin forzar
Advanced (QuickSpecs p.32) y SSE «consultar» (R8M36AAE no está en la lista).

1. **Multi-Underlay Builder + banner Microbranch**: filas WAN dinámicas
   (tipo MPLS L3/L2, DIA, banda ancha, 4G/5G × medio RJ45/SFP 1G/SFP+ 10G × down/up),
   estado v2 con migración desde la serialización v1, y banner Microbranch con umbrales
   gobernados por el API (≤10 usuarios, ≤50 Mbps, sin MPLS).
2. **Motor 70/30 y auditoría de puertos**: con Local Breakout el ~30 % del tráfico de
   Internet se declara descargado del overlay (el appliance se sigue dimensionando por
   el caudal total, regla oficial); auditoría de puertos que descarta el EC-10104 con
   >4 puertos o fibra (escalado con alerta) y avisa de densidad SFP en 10106/10108 (>2),
   10150 (>8) y 9240 (>4).
3. **Licenciamiento calibrado**: tiers 20M/50M/200M/500M/2G añadidos a Advanced, On-Prem
   y Advanced HA con los SKU y precios literales de la lista (45 filas nuevas en el CSV,
   147→192, diff del importador en 0); Foundation restringido a 100M/1G/UL con bloqueo
   en el selector (restricción oficial verificada); badge «Advanced requerida por
   especificación oficial»; SSE inyectada por usuario, co-terminada, «consultar».
4. **Inyección de hardware**: Boost>0 en EC-10150 añade S2N67A (qty mín 1, nota de
   fábrica «Boost >1 Gbps requiere el kit»); EC-10150 declara doble PSU de fábrica;
   checkbox Dual PSU en Gateway 9240 → R7J63A.
5. **Widget de rendimiento**: 3 barras (física / útil tras FEC / percibida con Boost
   por perfil) + estimación IMIX del brief con desviación documentada (pendiente 30).
6. **TCO y multi-sede**: simulador genérico de descuento partner (0/35/45/50/55 %/
   personalizado — declarado como NO el descuento real del distribuidor), columnas
   Lista/Neto, pie CAPEX/OPEX-anual/TCO, y perfiles multi-sede en localStorage con
   consolidado Σ(BOM×sedes) y export Excel.
7. **Ciclo de vida, delta viewer y OS matrix**: ya existían; verificados intactos.

Verificación: 266/266 tests (`npm run verificar`), E2E Chromium 11/11 (builder,
escalado EC-10104, banner, 70/30, tiers filtrados, SSE, S2N67A, widget, TCO, perfiles).

### Importador gobernado de lista de precios + matriz de accesorios contra la compatibilidad oficial (2026-09-13)

Instrucción del dueño: «Aplica como un arquitecto la mejora propuesta. Con respecto a
los pendientes busca en la web los accesorios y compáralo con los SKU de la lista de
precios — los accesorios como transceptores están en esta lista, debes cruzarlos —
busca como un experto».

**El importador gobernado (`scripts/importar-lista-aruba.js`).** Convierte la
actualización de precios en un proceso: lee el txt del distribuidor extrayendo
ÚNICAMENTE las 5 columnas permitidas (SKU, descripción, List Price, vigencia, PLC) con
validación literal de cabecera (un cambio de formato aborta, no adivina), dedup por
vigencia reciente, y confronta tres estados: la lista oficial, la declaración del repo
(qué SKU se cotizan — 147 en el roster) y el CSV vigente. Emite el diff en cinco
canales (precios repo≠lista, filas CSV que cambian, transiciones PLC, ausentes de la
lista, candidatos nuevos por cubos edgeconnect/ópticas/gateways) para aprobación
humana. Dry-run por defecto; `--aplicar` reescribe SOLO el CSV del cotizador; jamás
toca `aruba.js` (el commit gobernado es del humano, y el test de coherencia dual rompe
la build hasta que lo haga). Guardarraíl de confidencialidad: ninguna salida puede
contener el separador de la lista ni rastro de las columnas prohibidas. 7 tests con
fixtures sintéticos. Primer dry-run real: precios del repo 100 % conformes; detectó la
transición S0B67A (EC-XL) GA→ES, la renovación de vigencia de JZ878A y la ausencia del
SKU pelado JM962A.

**La matriz de accesorios, reescrita contra la compatibilidad oficial.** Dos
investigadores con fuentes oficiales HPE/Aruba (VSG SD-Branch, Hardware Reference
Guide Rev S dic-2025, QuickSpecs EC v18 y 9200 v14, Install Guide EC-10150, Hardware
Accessories Guide PN 201911 Rev F) produjeron la matriz por plataforma; el cruce con
la lista confirmó que TODOS los SKU necesarios existen en ella. Refutaciones
aplicadas: JL747B fuera (el HRG lo marca no soportado en toda la línea EC), J4860D y
J9285D fuera de EdgeConnect (sin matriz; J9285D sí en 9240), J9153D fuera de
EC-10108/10150 (el VSG no lo certifica ahí), JL485A/JL487A/JL488A fuera del EC-10150
(sin confirmar; siguen en 9240). Ampliaciones confirmadas: EC-10108 gana 25G
(JL484A/JL486A/JL489A) y 10G cobre (JL563C); EC-10150 gana JM532A/JM533A, S2N63A,
JL563C, JL749A y el tren Network Memory completo; la línea anterior gana
JM534A/JM535A (EC-SFP-LR/SR) y las TAA 1G/10G por columna HRG; EC-XS gana su kit
JM965A y su adaptador JM996A; EC-10106/10108 ganan el kit S2D96A y el adaptador
S2D95A; el 9240 gana las ópticas 1G/10G del QuickSpecs 9200. Catálogo: 40 → 53 SKU;
CSV: 135 → 148 filas (regenerado con el propio importador). **S2N67A reclasificado**:
«NM» = Network Memory (no network module) — kit de 2× NVMe 1,6 TB del EC-10150/10170;
con él Boost llega a 8 Gbps en el 10150 (1 Gbps sin él). Pendientes cerrados: #20
(matriz sin inferencias), #21 (EC-XS y legacy), #23 (EC-10106/10108 no tienen slot —
SSD interno 120 GB no reemplazable; Boost corre sobre él hasta 250/500 Mbps). Nuevos
pendientes: #24 (1G en 10108/10150, conflicto VSG vs HRG), #25 (J8177E/J9153E/R9Y49A
sin matriz para nuestros modelos), #26 (S0W40A ausente de la lista), #27 (variantes de
modelo detectadas — decisión de surtido).

**Verificación.** 263/263 pruebas (el test de integridad codifica ahora la matriz
oficial SKU por SKU y plataforma) y eslint verde. E2E en Chromium: EC-10106 con 14
accesorios sin los refutados, EC-10108 con 25G, EC-10150 con el tren Network Memory
(S2N67A $9.096 + repuestos), EC-XS con kit y adaptador, EC-S/EC-L con ópticas
oficiales, 9240 con 20 accesorios 1G/10G/25G.

### Catálogo de accesorios corregido y ampliado contra la lista de precios oficial (fase 12, 2026-09-13)

Instrucción del dueño: «Vamos a corregir los pendientes — debes basarte en la lista de
precios que te subí, esa es la fuente oficial de los SKU y precios de lista. Amplía el
catálogo maestro con lo declarado anteriormente». Se extrajeron de la lista ÚNICAMENTE
Product Number, Short Description, List Price, List Price Effective Date y PLC Status
(la regla de confidencialidad del repo prohíbe el resto de columnas).

**Correcciones que la lista oficial hace al brief de la fase 12.** Cuatro SKU estaban
mal descritos: **R1C72A** es un kit de montaje de APs ($415), no la PSU del 9240 — la
PSU real es **R7J63A** «9240 550W AC Power supply» ($747); **R1B23A/R1B24A** son
gateways 9004 regionales (IL/EG, $2.505), no kits de rack — los racks reales son
**R1B30A** (9004, $282) y **R4X13A** (9012, $71); **JW084A** es el rack del 7005
($282), no un cable de consola — la consola AP-CBL-SERU real es **JY728A** ($36);
**JL747A** es 1G cobre TAA en estado **ES** ($854), no un 10G SR — su sucesor GA es
**JL747B**. Y todos los precios del brief eran ~40-60 % más bajos que el List oficial
(parecían precio neto): corregidos uno a uno con su vigencia y PLC.

**S2N67A y la sincronización Boost → NVMe.** La lista describe S2N67A como «EC
10150/10170 NM» ($9.096) — módulo del EC-10150, no un kit «EC 10010». Como la lista no
tiene kit de almacenamiento para EC-10106/10108, la sincronización automática
Boost → NVMe de esos modelos se retira (el requisito queda documentado en *Datos por
confirmar* #23) y S2N67A se ofrece solo en EC-10150.

**Ampliación con lo declarado.** 40 SKUs en el catálogo maestro: los transceptores y
DAC 1G/10G/25G corregidos, más lo que la lista aporta para los modelos que no tenían
nada — EC-S (PSU JM779A, kit JZ893A), EC-M (PSU JZ955A, kit JZ894A), EC-L/XL (SSD
JZ889A, montaje central JZ888A), Gateway 9114 (fan tray S2N64A), 9004-LTE (rack
R3W17A) y los racks de la línea anterior 7000/7200 (JW084A, JX934A, JW085A, JW086A,
JW107A). El cobre 1G del 9240 se ofrece como reman S1H24AR ($353) porque el SKU nuevo
no figura en la lista. Regla nueva: un SKU en PLC «ES» nunca entra en la matriz de
compatibilidad — queda en el catálogo solo para trazabilidad.

**Doble vista, una fuente.** El CSV del cotizador
(`aruba-lista-precios-hpe.csv`, 95 → 135 filas) gana la familia «Accesorios
EdgeConnect y gateways», y un test nuevo exige que catálogo maestro y CSV digan lo
mismo SKU a SKU (precio, vigencia y PLC) — las dos vistas de la misma fuente no pueden
divergir sin romper la build.

**Verificación.** 256/256 pruebas (9 de integridad de accesorios: cobertura de los 40,
campos obligatorios, matriz referenciando solo lo existente, ES fuera de la matriz,
S2N67A solo en 10150, regla VSG 1G con la excepción declarada del 9240, exclusividad de
PSU/racks/fan, coherencia catálogo ↔ CSV) y eslint verde. E2E en Chromium: EC-10106 con
15 items a precios oficiales y sin S2N67A (con Boost ON tampoco), EC-10150 con el
módulo a $9.096, 9240 con R7J63A $747 y S1H24AR $353, EC-S/EC-L/7005/9114 con sus
accesorios oficiales.

### Catálogo maestro de accesorios ARUBA_ACCESSORY_CATALOG y sincronización Boost → NVMe (fase 12, 2026-09-13)

Instrucción del dueño: «Ejecuta el prompt adjunto» — brief de Ingeniería Principal /
Arquitecto Senior HPE Aruba Networking cuya sección 1.1 declara el
`ARUBA_ACCESSORY_CATALOG` verbatim (26 SKUs: transceptores 1G/10G/25G, DAC, kit NVMe
Boost, PSU, racks y consola, con List Price HPE) como «modelo de datos centralizado» que
gobierna compatibilidad y cotización.

**Qué se construyó.** El catálogo verbatim vive en `server/seed/legacyData/aruba.js` con
la matriz `ACCESSORY_COMPAT` (modelo → accesorios ofertables) anclada al VSG oficial —
1G fibra solo EC-10106; 10G/DAC en EC-10106/10108/10150; EC-10104 sin SFP; 9240 = 4x
SFP28 — y a lo declarado en el brief (25G → EC-10150/9240, R1C72A → 9240, racks
9004/9012, NVMe Boost → S2N67A). La proyección sirve `accessories` y `accessoryCompat`
al dimensionador: la página ya no mantiene precios ni matriz propios — el modal de
accesorios de la fase 11 se refactorizó para consumir el maestro con descripciones
oficiales literales, etiquetas velocidad/medio/alcance y destacado TAA. Los precios del
brief sustituyen a los provisionales de partner de la fase 11 (discrepancias
documentadas en el código y en *Datos por confirmar* #18/#19).

**Sincronización Boost → NVMe.** La optimización con deduplicación exige almacenamiento
local: con Boost activo en EC-10106/10108 el kit S2N67A se añade solo al BOM (mínimo 1,
no baja mientras Boost siga, marcado «añadido automáticamente») y se retira al apagar
Boost o cambiar de modelo; el EC-10150 declara sus 2 SSD NVMe de fábrica y no lo ofrece.

**Verificación.** 254/254 pruebas (248 + 6 nuevas de integridad del catálogo: 26 SKUs
verbatim, precios positivos, matriz referenciando solo SKUs/modelos reales, S2N67A solo
donde aplica, regla VSG 1G, PSU/racks en su gateway) y eslint verde. E2E en Chromium:
NVMe auto con Boost ON en EC-10106, bloqueo del mínimo, retirada al apagar Boost,
ausencia en EC-10150, 16/15/9 items por modelo, TAA visible.

### Madurez del catálogo: semáforo de ciclo de vida, matriz de SO, salud de fuentes y delta de precios (fase 11, E5, 2026-09-13)

**Semáforo de ciclo de vida** en la tabla del catálogo: verde = generación actual,
naranja = línea anterior (AOS 8, QuickSpecs RETIRED) con sucesor natural etiquetado como
«inferencia por capacidad, sin doc oficial» (mapa `SUCESORES` en `aruba.js`, decisión del
dueño), rojo = fin de venta anunciado con fecha de último pedido.

**Matriz de versiones mínimas de SO** (`OS_MATRIX`): ECOS mínimo por plataforma
EdgeConnect (8.3.1.0 → 9.5.3.0 con notas de tren y PIDs) y trenes AOS 8/10 por serie de
gateway (7000/7200 alcanzan 10.3.1.1 SSR aunque estén RETIRED; 9200 → 10.4.0.0 LSR;
9100 → 10.5/10.6/10.7 según modelo). Proyectada al dimensionador y pintada en la pestaña
«Fuentes».

**Salud de las fuentes bajo demanda**: endpoint `GET /api/fuentes/:vendor/salud` que
re-corre el vigía contra cada URL pública y botón en «Fuentes» que lo pinta (leído /
inalcanzable / sin URL). No corre solo: cada revisión pega contra los servidores del
fabricante.

**Delta de precios**: sube una lista CSV nueva y la compara en memoria contra la vigente
(alzas, bajas, SKUs nuevos, desaparecidos, PLC → ES) sin persistir nada — la decisión de
actualizar la lista gobernante queda en manos del dueño.

**Verificación.** 248/248 pruebas y eslint verde. E2E en Chromium: semáforo 15 verde /
9 naranja / 1 rojo, OS matrix con ambas tablas, delta detectando alza +9,9 %, baja −5,0 %,
SKU nuevo, 90 desaparecidos y PLC → ES en una lista de prueba, endpoint de salud
respondiendo por las 3 fuentes de Aruba.

### Sincronización total del módulo Aruba: revisión de diseño automática (fase 10, 2026-09-13)

Instrucción del dueño: «analiza como un arquitecto en networking de Aruba e integra tus
observaciones en el dimensionador… todo el módulo debe estar sincronizado para que cada
función que se active llame la licencia y calcule automáticamente; valida por web los
ajustes necesarios a nivel de diseño». Tres investigadores validaron cada regla contra
fuentes oficiales (VSG SD-Branch, data sheet de suscripciones a50010073enw, QuickSpecs
a50004289enw, Orchestrator Docs, tabla de licenciamiento de Central) antes de tocar código.

**Revisión del diseño (par técnico automático).** Nueva sección del BOM con reglas
declarativas (`REGLAS_DISENO`) y semáforo: ROJO = incoherencia que hay que corregir
(modelo elegido por debajo de los flujos o del caudal estimado, HA con cantidad ≠ 2,
**DTD en EC-XS** — la doc oficial de IDS/IPS confirma que no corre ahí); AVISO = decisión
que hay que saber defender (Boost/DTD huérfanos sin suscripción, HA on-prem 2× declarado,
EC-V virtual, sobredimensionamiento bajo el suelo del rango publicado); OK = diseño
coherente. El portal ya no solo cotiza: revisa el diseño antes de que salga al cliente.

**Sincronía función → licencia → cálculo.** DTD fuerza el filtro de familia a EdgeConnect
(es licencia EC, QuickSpecs p.32) y sale de la deducción de Central; EC-V oculta el nivel
CARE (appliance virtual: el soporte de hardware no aplica, la ficha lo declara);
On-Premises agrega la fila de Orchestrator auto-alojado — el data sheet oficial confirma
que el software va **incluido** en la suscripción E-STU y lo que cotiza el cliente es el
alojamiento (VM, uptime, backup, upgrades).

**Precisiones oficiales integradas.** Foundation = exactamente 2 VRF (default y guest) y
AppExpress solo monitor; Advanced = AppExpress con steering; On-Prem existe solo como
«Advanced On-Prem»; Central Advanced = segmentación de extremo a extremo / AIOps ampliada
(la retención de Central es la misma en ambos niveles — corregido); FEC anclado a los
ratios oficiales 1:8 (12,5 %) y 1:4 (25 %) con FEC adaptativo; headroom con ancla en el
SLA DPS del 75 % de la guía de diseño; flujos por modelo (256.000/2.000.000) y tier por
caudal agregado del sitio, ambos confirmados por el VSG. Atribución corregida: la paridad
de precio de los SKU HA sale de la **lista de precios documentada** (HPE no publica
precios); la existencia del SKU y la regla «match tier, bandwidth, term» salen del
QuickSpecs/VSG. Lo que quedó **sin fuente** se declara como regla de trabajo del
arquitecto: flujos por usuario (80-100/150-200) y Boost = 30 % del WAN privado (la única
regla de campo localizada, no oficial, dice 40 % — discrepancia documentada en el motor).

**Verificación.** 248/248 pruebas (2 nuevas: EC-V sin CARE_SKU, overhead FEC anclado a
los ratios oficiales) y eslint verde. E2E en Chromium: semáforo OK en diseño coherente,
ROJO por flujos+caudal al forzar EC-10104 bajo, ROJO DTD+EC-XS, AVISO Boost huérfano (y
Boost fuera del BOM), EC-V sin fila de soporte, fila Orchestrator on-prem, DTD moviendo
el filtro de familia, Central Foundation/Advanced con el texto corregido, ficha 9004 con
las sesiones SD-WAN, humo Fortinet 60F, cero errores de consola.

### Refactor del Dimensionador y BOM Aruba: SD-WAN por flujos + licenciamiento 100% automático (2026-09-13)

Disparado por el brief del dueño («Actúa como un Arquitecto de Soluciones de Redes
especializado en HPE Aruba Networking — EdgeConnect Enterprise y SD-Branch»): la SD-WAN de
Aruba no se rige por túneles IPsec estáticos sino por Business Intent Overlays (BIO),
flujos simultáneos y First-packet iQ (10.000+ apps; AppRF 3.500+ en SD-Branch). Aruba es el
piloto — los demás fabricantes no se tocan hasta que el dueño lo diga.

**Depuración de parámetros.** Fuera el campo «Túneles IPSec» (de las etiquetas, del «por
qué» y de las características); fuera el input manual de throughput de firewall; las
variantes gubernamentales (TAA/NAL/FIPS) se ocultan del catálogo pedible tras un botón
«Variantes gubernamentales · mostrar/ocultar» (86 visibles ↔ 94 totales), y las opciones
avanzadas (On-Premises, puntero TAA) viven en un `<details>` del panel 4.

**Dimensionamiento por flujos y aplicaciones.** Nuevo selector de perfil de entorno
(estándar ~100 / intensivo ~200 flujos por usuario — se usa el extremo alto como headroom
incorporado) y `estadoDerivado()` calcula `flujosReq = usuarios × tasa`: los candidatos que
no los soportan quedan descartados con su motivo («600.000 flujos req > 256.000 pub») y un
medidor nuevo lo pinta. Nuevo selector de estrategia de aplicaciones: Híbrido/DC privado
(Path Conditioning FEC/POC) ↔ Cloud-First/SaaS (First-packet iQ para DIA/SSE), con hint
dinámico y narrativa en el «por qué». La pregunta Boost (CIFS/SMB, transferencias masivas,
satelitales) auto-calcula Boost = 30% del tráfico WAN privado (`needProc × (1+FEC)`) y
mete sus bloques de 100 Mbps y SKU sin tocar nada más.

**Motor de licenciamiento 100% automático.** Se eliminó la selección manual de licencia:
el nivel (Foundation/Advanced) se deduce de las funciones del diseño según la matriz
oficial del QuickSpecs v18 p.31, y el SKU sale de la familia/tier de hardware + ancho de
banda + término. Co-terminación real: un único selector [1,3,5 años] gobierna licencias,
Central y soportes. HA 1+1 (qty=2 en EdgeConnect): el BOM parte la suscripción en 1×
estándar (nodo primario) + 1× SKU «HA» del segundo nodo — HPE publica juego propio de 18
SKU con precio idéntico tier a tier y año a año (invariante guardada por test). Lo manual
que queda es opt-out declarado: «no incluir suscripción», «solo hardware», «sin Central».

**Correcciones del brief contra la fuente oficial (decisiones documentadas).** El brief
proponía deducir Advanced de «DPS por SLA de aplicación, NGFW/IDS/IPS o AIOps»; el
QuickSpecs v18 p.31-32 dice otra cosa y manda la fuente: Dynamic Path Steering y el NGFW
completo son **Foundation**; IDS/IPS no es tier sino la licencia opcional aparte **Dynamic
Threat Defense** (p.32, sin precio publicado → línea «consultar» en el BOM); DIA /
First-packet iQ / encadenamiento SSE son funciones de plataforma, así que Cloud-First **no
fuerza** Advanced. Advanced se deduce de: más de 3 BIOs / VRFs avanzadas, topología fuera
de hub-and-spoke, o AIOps/retención ampliada. Equivalencia E-STU de HA on-premises **no
confirmada** por HPE → on-prem HA cotiza 2× estándar con declaración (pendiente abajo).

**Verificación.** 246/246 pruebas (243 + 3 nuevas: cobertura LICENSES_HA 3×2×3 sin
on-prem a propósito, invariante precio HA == estándar, todo modelo publica flujos o
declara por qué no — EC-V y «Gateway 9240» declarados) y eslint verde. E2E en Chromium:
deducción Foundation/Advanced con sus motivos, filtro de flujos (600k descarta EC-10106 →
EC-M), Boost 30% auto (3 bloques a 751 Mbps, 5 a 1.500), split HA (1× S1B79AAS + 1×
S1B86AAS, ambos $19.620), línea DTD «consultar», toggle TAA 86↔94, categorías HA 9+9,
Central Advanced en Gateway 9004, tier Gold automático en 9240, humo Fortinet 60F sin
cambios, cero errores de consola.

### EC-XL marcado fin de venta con fechas oficiales — Aruba (2026-09-13)

Aprobado por el dueño al cierre de la fase anterior: marcar el EC-XL como fin de venta,
buscando en la web la fecha de anuncio de EoS, la fecha efectiva de EoS y el fin de
soporte.

**Las tres fechas, de la fuente oficial.** La Product Lifecycle Policy de EdgeConnect
publicada por HPE (`arubanetworking.hpe.com/techdocs/sdwan-PDFs/docs/eula/EC_LifecyclePolicy_latest.pdf`)
declara literalmente: anuncio de fin de venta **junio 2025**, fin de venta efectivo
(último pedido) **2026-03-31**, y como regla de la política «End of Support +7 years
after End of Sale» → fin de soporte **2033-03-31** (la renovación de mantenimiento de
hardware cierra antes, 2030-03-31, también literal del documento). Los verificadores de
terceros (router-switch, layer23-switch) dan fechas distintas —EOL 2025-06-30, EoS
2025-09-30, EOSL 2030-09-30— pero la discrepancia quedó documentada en el comentario de
`aruba.js` y **manda el documento oficial del fabricante**. Ambas fechas de venta ya
pasaron respecto a hoy, así que el equipo queda «FIN DE VENTA VENCIDO».

**Cómo se marcó (patrón Cisco, opt-in).** Nuevo mapa `EOL_ANNOUNCED` en
`server/seed/legacyData/aruba.js` con `pid` (S0B67A), `lastOrder`, `endOfSupport` y la
URL de la política; un bucle tras `MODELS` lo adjunta como `m.eolAnnounced`, que fluye
por `specs` hasta la página igual que en Cisco. `sucesor` quedó en `null` a propósito:
declarar EC-10150 como sucesor sería inferirlo — HPE no lo dice en ningún documento
consultado. En `ficha.js`, la rama de fin de venta vencido suma una frase opt-in: «El
parque instalado conserva soporte del fabricante hasta el <fecha>» solo cuando el modelo
trae `endOfSupport` (los Cisco sin ese campo no cambian). En el dimensionador, el
selector de equipo marca «· fin de venta» junto a «· recomendado»/«· cumple», y cuando
ningún candidato cumple el «por qué» nombra los equipos que cumplirían si no estuvieran
fuera de venta, con su fecha de último pedido.

**El matiz que preocupaba en la fase anterior resultó no existir.** Se temía que excluir
al EC-XL dejara los escenarios >5 Gbps sin propuesta, pero el EC-10150 (hasta 12 Gbps,
añadido al catálogo el 2026-09-10) cubre todo lo que el EC-XL cubría: a 6 Gbps recomienda
EC-L, a 8 Gbps recomienda EC-10150, y el EC-XL nunca sale propuesto — solo seleccionable
a mano, declarado como referencia del parque instalado.

**Verificación.** 243/243 pruebas (242 + 1 nueva: las fechas declaradas parsean y
`endOfSupport` es posterior a `lastOrder`) y eslint verde (salvo el aviso preexistente de
siempre). E2E en Chromium: selector con «EC-XL · fin de venta», ficha con chip «FIN DE
VENTA VENCIDO» y ambas fechas, recomendación EC-L a 6 Gbps y EC-10150 a 8, «EQUIPOS QUE
CUMPLEN · 3» sin proponer nunca el EC-XL.

**Señales de terceros que quedan PENDIENTES de fuente oficial** (registradas también en
*Datos por confirmar*): los mismos verificadores de terceros dan fin de venta a **EC-L-H
(JZ878A, EoS 2025-12-31)** y **EC-XS (JM962A, EoS 2026-01-31)** — esta última explicaría
por qué el SKU de EC-XS ya no aparece en el export de lista de precios vigente. Sin
documento oficial de HPE no se marcan: misma regla de doble anclaje de siempre.

### Guardarraíl de integridad de precios y alerta de fin de venta (PLC «ES») — Aruba (2026-09-13)

Aprobado por el dueño al cierre de la fase anterior: implementar las dos mejoras
propuestas, con búsqueda web para ajustar la página como experto.

**Guardarraíl anti-regresión (`test/aruba-integridad-precios.test.js`, 9 pruebas).** El
bug del «SKU sin valor» llegó a producción porque nada cruzaba catálogo, lista de precios
y servicios. Ahora falla el CI si: un modelo con `hwSku` no está en el CSV con precio; un
modelo sin `hwSku` no está declarado a propósito (EC-V + serie 7000/7200, que se pide
remanufacturada); hay SKU duplicados o filas sin precio en el CSV; un
`modelo_dimensionador` no cuelga de modelo ni familia; aparece un estado PLC que la página
no sabe pintar (hoy GA/ES); los SKU de suscripción/Boost/Central del seed no están en el
CSV con el mismo precio; o `CARE_SKU` tiene modelos/niveles inexistentes, términos
incompletos o choques con el CSV.

**Alerta de fin de venta (mejora de consultoría).** La lista ya traía `estado_plc` y se
mostraba como texto plano. Ahora: las filas con PLC «ES» del panel de añadir van con fondo
y chip ámbar «ES · fin de venta», y si cualquier línea del BOM —del motor o añadida a
mano— tiene PLC «ES», salta un aviso ámbar sobre la tabla («HPE ya no lo vende y el
soporte deja de contratarse años antes de que acabe el plazo») y una nota «FIN DE VENTA»
en la exportación Excel/texto. De paso se define el CSS `.bom-desvio` que faltaba en esta
página (el aviso de desvío se pintaba sin estilo, solo Fortinet lo tenía).

**La búsqueda web confirmó el fin de venta del EC-XL** (era «señal sin confirmar» desde
el 2026-09-10): la Product Lifecycle Policy oficial de EdgeConnect
(arubanetworking.hpe.com/techdocs, `EC_LifecyclePolicy_latest.pdf`) declara «EC-XL-H end
of sale announcement June 2025» y «EC-XL-H end of sale (EoS) Mar 31, 2026», y la variante
NAL S3N77A ya vino con PLC «ES» en el export. **La decisión del dueño llegó el mismo día
(2026-09-13): marcarlo** — ver la entrada «EC-XL marcado fin de venta con fechas
oficiales» más arriba. Comentarios actualizados junto a EC-XL en `aruba.js` y en
`fuentes.js`.

**Verificación.** 242/242 pruebas (233 + 9 nuevas) y eslint verdes; E2E en Chromium: fila
S3N77A con chip ámbar, aviso «Fin de venta» sobre el BOM al añadirla, nota en la
exportación, ausencia del aviso sin líneas ES, humo de Fortinet sin efectos. Grep de
privacidad limpio.

### Catálogo SKU sin duplicados ni filas sin valor, Foundational Care con precio y panel 4 bajo el 3 — Aruba (2026-09-13)

Petición del dueño (con captura del panel «Añadir» y el export de lista de precios):
en la lista de materiales se duplicaban números de parte y había SKU sin valor —analizar
de dónde salen—; el soporte «Foundational Care 24x7 / NBD HW» salía «— / consultar» y
debía buscarse su SKU y valor en el txt; y «4 · Equipo y cotización» debía volver a la
columna izquierda, debajo de «3 · Funciones adicionales».

**De dónde salía el SKU sin valor (la respuesta al análisis).** `cargarCatalogoSku()`
mezclaba al CSV de precios las variantes de hardware declaradas en el catálogo de modelos
(`m.skus`) que no estaban en la lista: formaban el grupo «Otras variantes de hardware»,
siempre a «consultar» y duplicando visualmente al modelo base (el S3N71A «variante de
EC-10106» junto al S0E22A). Al cruzarlas con el export completo del distribuidor resultó
que las 29 variantes CON número de parte tienen precio publicado (22 ya estaban en el CSV
y 7 faltaban), y las 14 sin número de parte eran ruido inpedible. Fix: las 7 variantes
que faltaban entran al CSV con su fila literal del txt (S3N78A, S3N69A, S3N71A, S3N72A,
S3N74A, S3N77A —PLC «ES», ojo— y R1B37A; 69→76 SKU), se elimina el merge de `m.skus` y
con él el grupo «Otras variantes»: el panel queda sin duplicados, sin «sin número de
parte» y sin «consultar».

**Foundational Care con SKU y List Price.** El servicio se vende atado a la VARIANTE de
hardware, no al tier de caudal: nueva tabla `CARE_SKU` en `aruba.js` por modelo con las
filas literales del PL «SD-WAN Support» del txt —fcnbd ↔ «FC NBD Exch», fc247 ↔ «FC 4HR
Onsite», correspondencia documentada en el comentario— para los 9 EdgeConnect (51 SKU,
1/3/5 años, verificados uno a uno contra el txt). Lo que la lista no cubre sigue en
«consultar» declarado: FC de software (no hay filas), FC de gateways (va por sub-variante
de pedido que la app no modela) y el 4HR del EC-10150 (solo publica NBD). La estructura
`care` en null dentro de LICENSES se retira: era el callejón sin salida que mostraba
«— / consultar». `catalogProjection` expone `careSkus` y el BOM cotiza el soporte del
modelo elegido (E2E: EC-10106 NBD 1 año = H45D0E $446; 4HR 3 años = H46F4E $1.432).

**Layout.** «4 · Equipo y cotización» vuelve a la columna izquierda bajo «3 · Funciones
adicionales»; la derecha queda para la ficha unificada y la nota metodológica. Avisos de
la página actualizados al nuevo estado de datos (76 SKU + CARE_SKU; ya no se declara FC
entero como sin precio).

**Verificación.** 233/233 pruebas y eslint verdes; E2E en Chromium: panel de añadir sin
grupo «Otras variantes», sin «sin número de parte» ni «consultar», S3N71A con $4.318 y
botón «Añadir», soporte con SKU/precio en el BOM, paneles 1-4 en la columna izquierda en
orden, humo de Fortinet sin efectos. Privacidad: grep sin nombre del distribuidor, PA ni
Net Prices en el repo; el txt sigue en `privado/` gitignored.

### Layout reparado, ficha técnica unificada y lista de materiales centrada — Aruba (2026-09-13)

Petición del dueño: la página se había ido toda a la columna izquierda; unificar «ficha
técnica» con «características del equipo» para que no hubiera información redundante;
quitar el «Resumen de sizing»; y centrar en pantalla los cuadros de la pestaña Lista de
materiales, con uniformidad de diseño en toda la página.

**El roto del layout (causa real).** Al mover paneles en la unificación anterior quedó el
grid de dos columnas desbalanceado: la columna derecha se cerraba tras el veredicto y
«Capacidad publicada», «Resumen de sizing», el detalle del equipo y la nota quedaban
sueltos como hijos directos del grid, con un `</div>` de más descompensando el documento —
el navegador lo recuperaba apilándolo todo a la izquierda. En «Lista de materiales», el
grid de dos columnas envolvía UNA sola columna, así que ambos cuadros quedaban estrechos
(340 px) y arrinconados a la izquierda.

**La reparación estructural.** «Dimensionar» vuelve a un grid sano de dos columnas:
izquierda (340 px) los tres paneles de entrada del dimensionamiento (Plataforma, Tráfico,
Funciones); derecha (fluida) «4 · Equipo y cotización», la ficha unificada y la nota
metodológica. «Lista de materiales» deja el grid y pasa a un contenedor centrado propio
(`.pane-centro`, 960 px, márgenes automáticos simétricos): «Añadir a la lista de
materiales» y «Lista de materiales» van al centro de la pantalla y al mismo ancho.

**La unificación de la ficha (sin redundancia).** Había TRES sitios repitiendo las mismas
cifras: la tarjeta del veredicto (con su sección «Características del equipo»), el panel
«Capacidad publicada» y los paneles de detalle que pintaba `bomBody` («Ficha del equipo»,
«Capacidad por nivel de licencia», «Suscripción», «Soporte HPE»). Ahora vive todo en UNA
tarjeta, la ficha del dimensionador, con siete secciones sin repetición: «Capacidad
publicada» (escalera de rangos en EdgeConnect; tabla de niveles Silver/Gold en la 9200,
con el nivel elegido en negrita), «Características del equipo» (solo lo que la escalera no
dice), «Ficha técnica» (las cifras profundas del datasheet que antes estaban en bomBody:
conexiones, MTBF, consumo, ruido, peso, condiciones ambientales…), «Alimentación
eléctrica», «Suscripción y licencias» (con los estados reales Requerida/Opcional/No
incluida del panel 4 — antes la ficha proponía una suscripción que el detalle declaraba
excluida, inconsistencia cerrada de paso), «Software del portafolio» y «Soporte» (que
también declara «No incluido» cuando aplica). Interfaces y Datasheet aparecen exactamente
una vez. El «Resumen de sizing» se eliminó: no decía nada que no dijeran ya los medidores,
el «por qué» y la sección de licenciamiento. El aviso de desvío de `bomBody` se mudó sobre
la lista de materiales, su sitio natural (con selector único, ficha y lista nunca
divergen; el aviso solo queda para «ningún modelo cumple»). ficha.js ganó la opción
opt-in `sec.html` (bloque libre por sección) — los demás fabricantes no cambian.

**Verificación.** 233/233 pruebas y eslint verdes; E2E en Chromium: grid 340+744 px,
ficha con las siete secciones, «No incluir» reflejado en la ficha al instante (los
selectores de licenciamiento ahora disparan `render()` completo, con el tier manual
protegido por su marca «tocado»), selección manual no candidata con desvío y «Volver al
recomendado», 9240 con tabla de niveles, lista centrada 960 px con márgenes de 240 px,
catálogo de 90 SKU en 10 grupos intacto, humo de Fortinet sin efectos.

### Selección de equipo unificada en «Dimensionar» y líneas excluibles — Aruba (2026-09-13)

Petición del dueño: unificar la sección de equipo en la pestaña Dimensionar, dejando en la
pestaña de BOM solo «Añadir a la lista de materiales» y «Lista de materiales»; sin campos
duplicados; todo sincronizado con el dimensionador; opción «No incluir» en los selects; y
analizar si hacía falta un botón de sincronizar. Aruba es el piloto — los demás
fabricantes NO se tocan hasta nueva orden (en ficha.js solo se añadieron opciones opt-in
que no cambian su comportamiento).

**La unificación.** La pestaña BOM tenía el panel «Selección de equipo» (modelo, cantidad,
término, suscripción, tier, Boost, Central, capacidad 9240 y soporte) y la ficha técnica;
la pestaña Dimensionar tenía el selector de candidatos de la ficha. Dos selectores de
modelo en la misma página era la duplicación a cerrar. Ahora hay UN SOLO selector
(`pickModel`, todos los modelos por serie con marcas «· cumple» y «· recomendado») en el
panel nuevo «4 · Equipo y cotización» de Dimensionar; la ficha ya no pinta el suyo
(`selector:false`, opción nueva de ficha.js) y muestra el elegido aunque no sea candidato
(`incluir`, otra opción) con el aviso de desvío y «Volver al recomendado». La ficha
técnica (`bomBody`) también vive en Dimensionar. La pestaña de BOM se renombra «Lista de
materiales» y contiene solo el catálogo de SKU y la lista, con el aviso de preventa.

**Sincronización (respuesta al botón pedido: NO hace falta).** La página ya es reactiva de
extremo a extremo: cada cambio de parámetro recalcula y el selector sigue al recomendado;
cambiarlo a mano mueve ficha, resumen, escalera y BOM; «Volver al recomendado» suelta la
elección manual. Un botón de sincronizar duplicaría lo que ya ocurre solo. El enlace
compartible lleva el modelo (`pickModel` sustituye a `verdict-sel` en ESTADO) y reponerlo
desde la URL queda como elección manual, igual que hacía la ficha — con la captura del
parámetro al cargar el script, porque ESTADO reescribe el querystring antes de que el
desplegable tenga opciones.

**«No incluir».** Suscripción EdgeConnect, Central y soporte admiten quedar vacíos: la
línea desaparece de la lista y su panel declara el estado («Sin suscripción el equipo
queda standalone…», «Sin soporte no hay repuestos ni TAC…»). El tier de caudal no tiene
«No incluir» porque la suscripción no tiene SKU sin tier: excluir la suscripción oculta
tier y Boost — Boost es un add-on de la suscripción, criterio de licenciamiento HPE. La
licencia perpetua 9240 ya tenía «Solo hardware».

Verificado E2E en Chromium: un solo selector, sigue al dimensionador (500→EC-10106,
900→EC-10108), manual candidato y no candidato con aviso, volver resincroniza, las tres
exclusiones y su reactivación, URL con modelo, catálogo SKU intacto (90 referencias),
Fortinet/Cisco sin regresión. 233/233 pruebas y eslint en verde.

### Referencias de pedido integradas en la lista de materiales de Aruba (2026-09-13)

Petición del dueño: las referencias de pedido y la lista de materiales duplicaban valores y
eran redundantes — había que integrarlas rediseñando el dimensionador de Aruba para que
TODOS los SKU del archivo de precios se puedan añadir y quitar (hardware, software,
servicios) de forma dinámica e interactiva.

**La duplicación eliminada.** El mismo SKU llegaba a verse en cuatro sitios: la ficha del
equipo (filas «SKU de hardware» y «Referencias pedibles»), los paneles de suscripción y
soporte (SKU y precio en línea), la tabla de referencias de la ficha de cálculo y la propia
lista de materiales. Ahora la lista de materiales es la ÚNICA fuente de referencias de
pedido de la página: la ficha queda solo técnica (capacidad, interfaces, specs de
datasheet), los paneles explican QUÉ se licencia sin repetir SKU ni precio, y la ficha de
cálculo muestra una nota que apunta a la pestaña «Equipo y BOM» (opción genérica
`refs:false`/`refsNota` nueva en `ficha.js`, disponible para los demás fabricantes).

**El panel «Añadir a la lista de materiales».** Carga el CSV público de lista de precios
(`public/datasheets/aruba-lista-precios-hpe.csv`, 69 SKU) y lo categoriza con las propias
columnas del archivo —hardware, remanufacturados (sufijo AR), suscripciones EdgeConnect
Foundation/Advanced/On-Premises, Boost SaaS/On-Premises, Central y licencias perpetuas
9240— más las variantes de hardware sin precio (TAA/NAL/FIPS) que el catálogo declara por
modelo: 90 referencias en 10 grupos. Buscador por SKU o descripción, chips de categoría con
conteo, List Price con su vigencia y estado PLC, y marca «En el BOM» en las líneas que el
motor ya puso en la lista para no meterlas dos veces.

**La lista de materiales queda como el componente integrado.** Añadir mete la línea con
`BOM.agregarRef` (persistente en localStorage, sobrevive a recargas y a cambios de modelo),
con stepper de cantidad y botón de quitar que ya existían en `bom.js`. Y dos huecos
cerrados en `bom.js` para los SIETE dimensionadores: `exportarExcel` y `comoTexto` ahora
incluyen las referencias añadidas a mano — antes solo se veían en pantalla y se perdían al
exportar. Verificado de extremo a extremo en Chromium: añadir Boost S0Z73AAS → subtotal y
total actualizados ($47.608 con cantidad 2), quitar, persistencia tras recarga, chips,
buscador, texto plano con el SKU, y humo en Fortinet/Cisco sin regresiones. 233/233
pruebas y eslint en verde.

### Combos por familia, ficha técnica completa de Aruba y guarda de ancho de banda (2026-09-13)

Tres peticiones del dueño en una sola entrega:

1. **Combos de equipos organizados por serie/familia en los seis dimensionadores.** Los
   combos de Fortinet, MikroTik y Juniper eran listas planas en el orden (alfabético) en
   que la API servía el catálogo; Aruba, Cisco y Huawei ya agrupaban pero heredaban ese
   mismo orden. Ahora los seis usan `<optgroup>` por familia —Fortinet deriva la familia
   del propio id (G sucursal / G DC / F sucursal / F gama alta / F chasis)— con orden
   determinista por capacidad dentro de cada familia y entre familias, sin depender del
   orden en que llegue el catálogo. Lo virtual (CHR de MikroTik, EC-V de Aruba) va al
   final de su grupo.
2. **Ficha técnica completa de Aruba.** Nuevo campo `spec` por modelo (24 de 25; EC-V es
   virtual) con las características de los datasheets oficiales que la ficha no mostraba:
   conexiones simultáneas, Boost recomendado, IDS/IPS, throughput cifrado por cifrado,
   VLANs, túneles, SSL, clustering, RAM, almacenamiento, FRU, certificaciones, MTBF,
   alimentación/consumo, BTU, ruido, dimensiones y peso. Procedencia literal en la
   cabecera de `aruba.js`: QuickSpecs EdgeConnect a50004289enw + Hardware Reference,
   DS_9000/9100/9200 y DS_7000/7200 (estas dos con doble ancla de dos copias del mismo
   documento). También se rellenaron `fwSess`/`ipsecSess`/`greTuns` que estaban en null
   (series 9000, 7000 y 7200). Los conflictos detectados contra datos existentes NO se
   aplicaron: quedan en la tabla de conflictos de este archivo.
3. **Sin ancho de banda no hay recomendación.** Los seis dimensionadores (Aruba, Cisco,
   Fortinet, Huawei, Juniper, MikroTik) muestran «Ingrese valores para recomendar un
   equipo» y limpian veredicto, escala, resumen y BOM cuando el campo de ancho de banda
   está vacío; al escribir un valor vuelve la recomendación normal. Nokia ya pedía
   valores por sí solo.

Verificado: `npm run verificar` (233/233) y E2E en Chromium — combos agrupados y ordenados
en los seis, mensaje de vacío y recomendación al ingresar caudal, y las nuevas filas de
la ficha (EC-10104, Gateway 9240, 7010) pintadas desde el `spec`.

### Aruba: catálogo de suscripciones y servicios con SKU y List Price (2026-09-13)

El pendiente 10 («Precios de Aruba: todos en `null`») se cierra casi entero. El export de
lista de precios del distribuidor (el mismo del 2026-09-10, re-subido por el dueño) cubre
mucho más que hardware: se extrajo el List Price de **todas** las líneas que el
dimensionador consume, y la correspondencia SKU↔descripción se verificó contra el QuickSpecs
oficial EdgeConnect SD-WAN (v18, 06-jul-2026) publicado en hpe.com, con punto de control
externo en una tienda pública (JZ118AAE, LIST $1,260.00 — idéntico al de la lista).

Lo que se cargó (solo SKU, descripción, List Price y vigencia — nunca el distribuidor ni su
descuento, que es su dato confidencial):

- **LICENSES** (`aruba.js`): los 9 combos tier×bundle (Foundation/Advanced/On-Premises ×
  100 Mbps/1 Gbps/ilimitado) con un SKU distinto por duración — el `sku` ahora va desglosado
  `{y1,y3,y5}` igual que el precio, y el motor (`tierSku`) elige el del término elegido.
- **BOOST**: bloque de 100 Mbps y de 10 Gbps, en modalidad SaaS (sobre Foundation/Advanced)
  y On-Premises (E-STU). El BOM ya muestra SKU y precio por bloque con su cantidad.
- **CENTRAL_TIERS**: Foundation (JZ118-120AAE) y Advanced (JZ121-123AAE) de gateway
  70xx/90xx. Las variantes (72xx, Foundation Base 9004/9012, +Security, vGW) quedan
  documentadas en comentario con sus precios, sin cargar, porque el dimensionador no las
  elige todavía.
- **9240**: licencias perpetuas Silver (R8R41AAE, $9,995) y Gold (R8R42AAE, $19,995) en
  variante AOS-10 — la arquitectura que gestiona Central, que es la que usa este catálogo.
- **Serie 7000/7200**: la unidad nueva no está en la lista; la **remanufacturada HPE**
  (sufijo AR) sí — 7005/7008/7010/7030/7205/7210/7220 con SKU y List Price, declarados
  «(Reman)» en el cotizador y en `referencias.js`. 7024 y 7240XM no tienen ni una ni otra:
  siguen en «Consultar».

Lo que **sigue en `null` a propósito**: Foundational Care (sus SKU — H43W0E, H44Z4E… — van
por variante de hardware y se resuelven en HPE SSC equipo a equipo; mapearlos a un tier de
caudal sería inventar la estructura), EC-V, EC-XS-SP y Dynamic Threat Defense (ausentes de
la lista). El CSV público (`aruba-lista-precios-hpe.csv`) pasa de 15 a 69 filas. Verificado
con `npm run verificar` (233/233) y E2E en Chromium: EC-S con Advanced 1G/3a + 2 bloques
Boost ($72,411 parcial), 9012 con Central Foundation 5a (JZ120AAE) y 9240 Gold + Central
Advanced 3a ($61,389 parcial).

### Dimensionadores: los campos arrancan vacíos en cada sesión (2026-09-12)

A petición del dueño del repo: los valores de ejemplo que traían precargados los ocho
dimensionadores (bw 500, usuarios 100, sucursales 20/50...) desaparecieron — cada inicio de
sesión encuentra los campos **vacíos** para que el usuario ingrese sus propias cifras. Tres
capas: (1) los `<input type="number">` del HTML ya no llevan atributo `value` (los
deslizadores sí conservan su posición: un slider no puede estar «vacío»); (2)
`autocomplete="off"` en todos ellos, porque lo que «guardaba los valores» ya no era la
aplicación —el localStorage se quitó el 2026-09-10— sino el navegador, que repone lo último
tecleado al recargar o al volver con atrás; (3) red de seguridad en `estado.js`: si la URL no
trae parámetros, vacía los campos tecleables al cargar y en el `pageshow` del bfcache. Los
motores ya toleraban el vacío (`parseFloat(...)||0` → el escenario sin cifras no produce
candidatos). Lo que **no** cambió: un enlace compartido (`?bw=2500&users=800`) sigue
restaurando el escenario completo — es la función para la que existe el módulo. Verificado de
extremo a extremo en Chromium tras login: las 8 páginas entran en blanco, teclear 2.500 Mbps
sigue recomendando el FortiGate 200G y el enlace compartido sigue restaurando. 233/233 tests.

### Nokia: las 6 capacidades en conflicto, corregidas contra la ficha oficial (2026-09-11)

Por decisión del dueño del catálogo. Los **7220 IXR-D2L/D3L** eran un error real: el catálogo
prometía el doble (4 y 6,4 Tb/s) de lo que la ficha oficial (`nokia.com/asset/f/207599`) y la
suma de puertos del propio catálogo confirman (2,0 y 3,2 Tb/s FD). Los **7750 SR-s** eran una
elección de métrica: se adoptó «System capacity (FD; max)» —SR-1s 4,8; SR-2s 9,6; SR-7s 108;
SR-14s 216 Tb/s— porque el dimensionador de agregación/core ordena por `cap` y la «Interface
capacity» es agregación estadística sobresuscrita. La decisión quedó documentada en la
cabecera de `nokia.js`, y se actualizaron portal, cotizador, guía de roles y el test de
agregación (el techo del catálogo ya no es 38,4 sino 216 Tb/s).

### Juniper: 4 conflictos resueltos, 3 modelos completados y Juniper Care verificado (2026-09-11)

Los 4 «conflictos» eran cifras de una revisión vieja de las fichas: Juniper re-evaluó al alza
con Junos más reciente. Cada valor nuevo confirmado por **dos fuentes oficiales** (ficha
vigente en juniper.net + Pathfinder HCT): SRX1600 `vpnImix` 5.500→8.000 y `cps` 95.000→170.000,
SRX2300 `cps` 320.000→450.000, SRX4300 `fw` 90.000→98.000. Completados los huecos de
**SRX4700** (con la regla de la casa: `ips` transcribe el método CPS, 60 Gbps, no el TPS de
100 que titula la ficha; `atp` en `null` porque Juniper no publica Advanced Threat para ese
modelo), **SRX4100** y **SRX4200** (donde Pathfinder dice 18 Gbps de NGFW y la ficha fechada
16: se transcribió la ficha y la discrepancia quedó anotada). **Juniper Care** deja de ser un
nivel «sin verificar»: los tres niveles (Care, Advanced Care, Premium Care) transcritos de
juniper.net con alcance y tiempos de respuesta.

### Fortinet: alimentación 58/58 — 70F, 100F y 200F cerrados (2026-09-11)

El **70F** se cerró con la ficha combinada auténtica 70F/71F (`FG-70F-DAT-R02-20221028`:
10,17 W medio / 12,43 W máx, adaptador externo 12VDC 3A único), validando primero la identidad
del documento: su columna 71F coincide cifra a cifra con la ficha oficial del 71F — la trampa
del `fortigate-70f-series.pdf` (que es solo del 71F) sigue documentada. El **200F**
(`FG-200F-DAT-R28-20250407`: 101,92/118,90 W, doble fuente AC de serie no intercambiable en
caliente, 1+1) y el consumo del **100F** (`FG-100F-DAT-R42-20250407`: 26,5/29,5 W — Fortinet
lo re-evaluó a la baja desde los 35,1/38,7 W de la revisión de 2021) salieron de espejos del
PDF oficial, verificando el código de revisión impreso en el documento, porque fortinet.com
responde con reto JavaScript de Akamai en esas rutas. Sin `watts` quedan solo 7081F y 7121F,
cuyas guías solo publican capacidad por fuente: decisión ya documentada.

### Aruba: los 6 PDFs que faltaban, descargados — pendiente 3 cerrado (2026-09-11)

En sesión nueva (la cuota de `psnow/downloadDoc` se había reseteado) y con Chrome real
bajaron los 6 que quedaban: QuickSpecs de EdgeConnect (47 págs), spec sheet EC-XL, data sheet
Serie 9000, QuickSpecs 9100 y 9200, y el SD-Branch Design VSG (132 págs, 17,6 MB). Tres
métodos, todos documentados en `public/datasheets/LEEME.md` para la próxima refrescada:
enlace `downloadDoc` en la página, el visor de Chromium con `fetch(location.href)`, y la
carcasa del visor Adobe de los QuickSpecs (se escucha la respuesta `application/pdf` a
`downloadDoc` y se repite con `fetch` desde la página). Cobertura final: **18/24**; de los 6
restantes, 4 nunca fueron PDFs, 1 URL murió (`ecSpecSheet`) y 1 exige cuenta HPE (`gw9000Spec`).

### Aruba: List Price real para 15 modelos EdgeConnect/gateway (2026-09-10)

A petición del dueño del repo, que dejó en `public/Precios Aruba.txt` (82.546 líneas, 16,6 MB)
un export de lista de precios de HPE con la instrucción de sumarlo como fuente y sacar lo más
importante para dimensionar equipos.

**El archivo NO era una fuente pública genérica: era una lista de precios de un distribuidor
autorizado** (nombre del partner y PA number visibles, con su % de descuento negociado), y
mezclaba TODO el portafolio de HPE (servers, storage, Synergy...) con Aruba como una porción.
Consultado el alcance con el dueño del repo antes de tocar nada: se descartó commitear el
archivo completo y se optó por extraer solo lo útil — SKU, descripción, List Price y su
vigencia — sin el nombre del distribuidor ni su descuento, que es la parte confidencial y no
aporta nada para dimensionar un equipo. El archivo original se movió fuera de `public/` (que
Express sirve, aunque detrás del muro de sesión) a `privado/`, agregado a `.gitignore`.

**Lo extraído:** `public/datasheets/aruba-lista-precios-hpe.csv`, 15 filas (los EdgeConnect y
gateways con SKU confirmado en el catálogo: EC-XS, EC-S/M/L/XL, EC-10104/106/108/150, Gateway
9004/9004-LTE/9012/9106/9114/9240). Se agregó como entrada `DATASHEETS.priceList` en aruba.js
(sin `url` pública, con `local` — la página no muestra el enlace "en hpe.com" para esta,
porque no existe uno legítimo que ofrecer). El SKU de EC-XS (JM962A) también se completó en
`aruba.js`: el QuickSpecs no lo publica, este export sí.

**Se conectó el precio real donde antes decía "Consultar":** `cotizadorCatalog.js` (15 filas,
antes `elp:'Consultar',elpN:0`), la ficha de "Referencias de pedido" (`referencias.js`, nueva
tabla `ARUBA_LIST_PRICE`), el BOM del dimensionador (ya leía `priceNumeric` del Product, solo
faltaba que existiera) y los tres avisos de "sin price list" del HTML, corregidos para decir
lo que hoy es cierto: 15 modelos tienen List Price de HPE (sin el descuento del distribuidor,
no una cotización firme); el resto del catálogo sigue sin precio.

**Un bug real, encontrado al verificar y no al buscarlo.** Con el precio en cero, un defecto
de `backfillPricesFromCotizador` (server/seed/seedCatalog.js) era invisible: los 4 modelos
EdgeConnect 10104/106/108/150 (sumados a `aruba.js` en la sesión anterior sin sumarlos también
a `indexPR.js`) no tenían fila de PR previa que igualar por nombre, así que su rama de "sin
match" les creaba una fila fantasma con el nombre completo de `cotizadorCatalog.js` ("Aruba
EC-10104") en vez de encontrar la fila real ("EC-10104") que `seedDimensionadorModels` crea
después — dos filas por modelo, y cuál de las dos terminaba con el precio dependía del orden
de `Product.findAll()`, no del código. Con precio real de por medio dejó de ser invisible: los
4 modelos seguían mostrando "Consultar" pese a tener fila en el CSV. Corregido sumando los 4 a
`indexPR.js` (mismo patrón que los otros 11 modelos Aruba) y con una limpieza de una vez de las
4 filas fantasma ya sembradas. **Intento de arreglo descartado a tiempo:** la primera solución
probada — pelar el prefijo de fabricante también en la rama de creación de
`backfillPricesFromCotizador` — parecía correcta pero rompía a Fortinet y a la familia Catalyst
8000 de Cisco, que SÍ llevan el prefijo como parte de su `id` real (a diferencia de
Aruba/Huawei/MikroTik/Nokia/Juniper, que no); se detectó comparando el conteo de `Product` de
un arranque limpio contra un worktree del commit anterior antes de darlo por bueno (232 → 261
en vez de la baja esperada), y se revirtió por la vía correcta: sumar la fila de PR que
faltaba, no tocar una función compartida por los 7 fabricantes.

**Señal sin confirmar, dejada así a propósito:** en el mismo export, el SKU de EC-XL (S0B67A)
aparece con estado PLC "End of Sale" (vigencia 2026-06-30) en su fila sin sufijo de país, pero
"GA" en las ~20 variantes por país del mismo SKU. Un solo documento, contradictorio consigo
mismo, no alcanza para marcar EC-XL como descontinuado — comentario junto al modelo en
`aruba.js` y fila en "Conflictos abiertos" más abajo.

Verificado: 233 pruebas (232 + 1 nueva sobre `referencias.js`), Chromium autenticado (BOM con
el subtotal real de EC-10106, ficha con "Precio de lista: ~ $4.318", pestaña Fuentes con el
CSV sirviendo detrás del login, catálogo/cotizador con los 15 precios), sin errores de
consola. `npm run pantallas` no corrió (falta `playwright` instalado en este entorno).

**Mejora propuesta al cerrar esta entrega:** este mismo bug (una fila de PR faltante creando
una fila fantasma en `backfillPricesFromCotizador`) puede repetirse en cualquier fabricante
cada vez que se agregue un modelo nuevo directo a su `legacyData` sin sumarlo también a
`indexPR.js` — pasó una vez en silencio (con precio en 0 no se notaba) y podría volver a pasar.
Un aviso de arranque tipo el que ya existe para `eolModels` huérfanos (`seedDimensionadorModels`
avisa si una entrada no casa con nada) que compare los `model` de `cotizadorCatalog.js` contra
los `Product` ya sembrados y señale cuáles cayeron en la rama de creación, cerraría esto de raíz
en vez de depender de que alguien lo note contando filas a mano.

### Los dimensionadores dejan de recordar la sesión anterior (2026-09-10)

A petición del dueño del repo («cada vez que se inicie sesión limpia todos los campos de
los dimensionadores que estén vacíos y no guarde valores como ahora»). `js/estado.js`
guardaba cada campo en `localStorage` y lo reponía en la siguiente visita — pensado para no
perder un dimensionamiento a medio hacer, documentado así en el propio módulo — pero eso
significaba que cada inicio de sesión arrancaba con los valores de la vez anterior en vez de
en blanco. Consultado el alcance con el dueño del repo (¿limpiar solo al hacer login, o
sacar el guardado por completo?): eligió lo segundo.

**Se quitó la lectura y la escritura en `localStorage` de `js/estado.js`.** Lo único que se
conserva es reponer desde la URL — el enlace compartido («mírate este sizing») sigue
reproduciendo el mismo escenario a quien lo abre, que es el caso de uso real de compartir un
dimensionamiento con un compañero. El botón "Copiar enlace de este escenario" no cambió. El
aviso "se restauraron los parámetros de tu última visita" deja de aparecer (el de "estás
viendo un escenario recibido por enlace" sigue igual). Las 7 páginas dejaron de pasar
`clave: '<nombre>'` a `ESTADO.vincular()` porque esa clave solo existía para nombrar la
entrada de `localStorage` que ya no se escribe.

**Lo que NO se tocó, a propósito, por estar fuera de lo pedido:** el BOM del cotizador
(`js/cotizador.js`) y las referencias de pedido (`js/bom.js`) también usan `localStorage`,
pero guardan listas de equipos y referencias añadidas —perderlas al iniciar sesión sería una
regresión real, no una limpieza—, y el pedido fue específicamente sobre "los campos de los
dimensionadores", no sobre el BOM ni el cotizador.

Verificado en Chromium autenticado: se cambia el caudal de un dimensionador (queda en la
URL), se recarga sin parámetros y el campo vuelve al valor por defecto, sin el aviso de
sesión anterior. Sin errores de consola. 232 pruebas sin cambios (no hay pruebas de este
módulo de frontend).

### Aruba: la pestaña de Fuentes ya no está duplicada (2026-09-10)

A petición del dueño del repo («unifica en aruba la opción de fuentes, está duplicado»).
Al replicar el patrón de Fortinet a Aruba (entrada anterior de este mismo día), se había
dejado una división a medias: la pestaña «Licencias, software y fuentes» seguía con su
propio listado de datasheets, y la pestaña nueva «Fuentes» solo mostraba la procedencia
verificada y remitía a la otra pestaña para el detalle por producto — dos lugares para lo
mismo, y el propio dueño lo notó de inmediato al usar la página.

**Ahora todo lo de fuentes vive en un solo lugar.** La pestaña se renombra a «Licencias y
software» (ya sin mención a fuentes) y pierde la sección de datasheets; esa sección se
mueve a la pestaña «Fuentes», justo debajo de «Procedencia verificada». Se quitó la frase
que remitía de una pestaña a la otra (ya no hace falta) y se corrigió la nota de cierre de
la página, que citaba la pestaña de licencias como destino de los enlaces. Cambio solo de
`public/dimensionador-aruba-edgeconnect.html`; el JS no se tocó — pinta el listado por id
(`dsList`), sin importar en qué pestaña viva el `<ul>`.

Verificado en Chromium autenticado: «Fuentes» muestra procedencia y datasheets juntos;
«Licencias y software» termina en la tabla de soporte, sin el listado. Sin errores de
consola. 232 pruebas sin cambios (edición solo de HTML).

**Mejora propuesta al cerrar esta entrega:** la entrada de arriba («El piloto de Fortinet
se replica...») ya documentaba esta división como decisión deliberada («Aruba solo sumó
"Catálogo" y una "Fuentes" liviana que remite a esa pestaña») — es decir, el propio informe
de cierre describió como intencional lo que el dueño del repo vio como un defecto de UX en
cuanto abrió la página. La revisión de cada entrega debería incluir, además de Chromium y
las pruebas automáticas, una relectura rápida desde la perspectiva de quien usa la página
por primera vez — no solo confirmar que el código hace lo que el texto dice, sino que lo
que el texto llama "resuelto" de verdad se siente resuelto.

### Chrome real destraba 9 PDFs más de Aruba; Huawei sigue bloqueado, pero por otra razón (2026-09-10)

A petición del dueño del repo, siguiendo la mejora propuesta al cerrar la entrega anterior:
reintentar los pendientes 3 (PDFs de Aruba) y 14 (ciclo de vida Huawei) ahora que Agent Reach
estaba instalado. El resultado fue desigual entre los dos, y vale la pena registrar el porqué
para no repetir el mismo camino sin salida.

**Aruba: 9 documentos nuevos, de 3/24 a 12/24.** Jina Reader (usado en la entrega anterior)
solo entrega texto, nunca el binario del PDF — no servía para este pendiente. Lo que sí
funcionó fue **Chrome real vía la extensión**, en vez del Playwright/Actions que Akamai
bloqueaba: `hpe.com` y `arubanetworking.hpe.com` cargan completos y sin captcha. Se descargaron
y commitearon `edgeconnect-xs-spec-sheet.pdf`, `gateway-9004.pdf`, `serie-9000-psnow.pdf`,
`serie-9200-campus-gateways.pdf`, `serie-9200-psnow.pdf`, `central-suscripciones-saas.pdf`,
`foundational-care.pdf`, `clearpass-access-license.pdf` y `edgeconnect-ecv-azure.pdf` (128
páginas). Quedan 12 sin resolver, en tres categorías distintas — ver la fila actualizada del
pendiente 3.

**Segundo intento, mismo día: causa confirmada, no es la automatización.** Con
`read_network_requests` se vio que el clic sí llega al enlace real (`psnow/downloadDoc`) pero
el servidor de HPE responde **503**. Tras 2 minutos de espera, el mismo 503 apareció incluso en
`a00110177enw` (EC-XS) — el documento que **ya se había descargado con éxito** minutos antes en
esta misma sesión. Es un límite de sesión/IP del propio servicio de descarga de HPE, agotado por
las 9 descargas ya hechas, no un límite de tamaño ni de tipo de documento ni un detalle del
botón — la hipótesis original quedó descartada. Insistir en la misma sesión solo golpea un
servicio que ya está limitando; hace falta una sesión distinta (al día siguiente, por ejemplo).

**Huawei: el bloqueo de Akamai no es el obstáculo real.** Con Chrome real,
`support.huawei.com/enterprise/en/bulletins/` — "Life Cycle Notices" — carga completo, con
buscador por modelo y resultados reales (`AR6700` dio 11 avisos con fecha). Pero dos hallazgos
cierran el camino de todos modos, y son motivos nuevos y más precisos que "Akamai bloquea todo":

1. **El contenido de cada aviso está tras una cuenta Huawei** (candado visible en cada fila).
   No se intentó iniciar sesión ni crear una cuenta — sigue siendo la barrera real.
2. **Puede que ni sea la categoría correcta.** Lo que se ve ahí son ciclos de vida de
   **versiones de software** (`V600R023C00`, `V200R024C10`…), no del hardware — un dato
   distinto de lo que este catálogo modela (`eolAnnounced`: fin de venta del equipo físico,
   con última fecha de pedido y sucesor, al estilo de la serie ISR 4000 de Cisco). La categoría
   "PCN" (Product Change Notice) sí es a nivel de hardware, pero no lista routers/NetEngine
   entre sus categorías visibles ahora mismo.

Ninguna cifra de Huawei se agregó al catálogo: no hay dato verificado que trasladar todavía, y
este catálogo no adivina desde un título de aviso. 232 pruebas sin cambios — todo lo aplicado es
un asset binario nuevo, sin tocar código.

**Mejora propuesta al cerrar esta entrega:** de los 12 documentos Aruba que faltan, 7
comparten el mismo síntoma (botón de descarga inerte en fichas largas) y uno más exige cuenta
HPE — vale la pena que alguien con paciencia reintente esos 7 a mano una vez (confirmar si es
realmente un límite de tamaño/tipo o solo falta de reintentos) antes de darlos por imposibles;
los otros 5 (una URL muerta y cuatro páginas que nunca fueron PDF) no necesitan reintento, solo
que alguien busque el reemplazo de la URL muerta si le importa esa ficha en particular.

### Catálogo Aruba ampliado: 4 EdgeConnect nuevos y SKUs reales completados (2026-09-10)

A petición del dueño del repo: buscar más equipos Aruba en fuentes oficiales para alimentar
el dimensionador. El bloqueo de egreso a HPE que este repositorio lleva documentado desde
agosto (Akamai contra automatización) resultó ser **contra ciertos clientes HTTP, no contra
toda automatización**: `curl` directo sigue bloqueado, pero **Jina Reader** (`r.jina.ai`,
recién instalado como parte de Agent Reach) sí atraviesa, y **Exa** (búsqueda semántica, misma
instalación) encontró los documentos oficiales exactos a buscar. Es el primer cierre real de
ese bloqueo desde que se abrió.

**Cuatro modelos EdgeConnect que no existían en el catálogo**, todos del QuickSpecs oficial
vigente de HPE (`a50004289enw`, versión 18, 06-jul-2026 — el propio documento con su changelog
de 18 versiones, así que es la fuente activa, no una copia vieja): **EC-10104** (2-500 Mbps),
**EC-10106** (2-1 Gbps), **EC-10108** (2-2 Gbps) y **EC-10150** (hasta 12 Gbps, el tope de la
línea EdgeConnect — sin mínimo publicado, a diferencia del resto de la serie). Los tres
primeros llenan justo el hueco entre EC-XS y EC-S que antes no tenía escalones intermedios.
SKU reales de la misma ficha (R9D72A, S0E22A, S0E23A, S2N65A, más sus variantes TAA/NAL).

**El motor de dimensionamiento no necesitó ningún cambio de lógica** para aceptarlos — ya
generalizaba por `fam`/`wanMin`/`wanMax`, y el único ajuste fue de texto: el mensaje que
mostraba «según licencia y vCPU» cuando `wanMin` es `null` asumía que esa era siempre la razón
(cierta para EC-V, un appliance virtual) y ahora dice «sin mínimo publicado», que es lo que de
verdad pasa con el EC-10150 — HPE no publica un piso para ese modelo y no hay por qué inventar
una razón que no aplica.

**De paso, tres huecos cerrados con la misma fuente ya citada en esas filas**, sin necesidad de
un documento nuevo: `hwSku` de Gateway 9004 (R1B20A) y 9004-LTE (R3V91A) estaban en `null`
pudiendo no estarlo, y Gateway 9106/9114 no tenían `fw`/`fwSess`/`ipsecSess` — con esos tres
campos vacíos, la serie 9100 Hybrid era invisible para cualquier requerimiento dimensionado por
throughput de firewall. Los tres coinciden exactamente con los datos ya verificados del
catálogo (clientes, APs) donde se pudo contrastar, lo que da confianza en el resto de la ficha.
Se corrigió además una nota de cabecera de `aruba.js` que decía «se retiran 9106/9114, no
aparecen en el portafolio publicado» — la nota estaba desactualizada, no el catálogo: las filas
de esos dos modelos siempre estuvieron ahí.

**Un conflicto se encontró y se dejó sin resolver a propósito**: el mismo QuickSpecs dice que
EC-XS llega a 1.000 Mbps, el doble del `wanMax:200` que ya tenía el catálogo. Un solo documento
no supera el doble anclaje que esta tabla exige antes de pisar un dato existente — mismo criterio
que el SRX380 de Juniper — así que queda anotado en *Conflictos abiertos* para que lo decida
el dueño del catálogo, no tocado en este cambio.

Los 4 modelos nuevos se sumaron también a `cotizadorCatalog.js` (si no, «Enviar al cotizador»
desde el dimensionador habría fallado con «modelo no encontrado en el catálogo del cotizador»,
el mismo síntoma que ya documenta ese botón para un equipo fuera de venta). 232 pruebas (una
ampliada, no una nueva: el conteo de modelos Aruba con `redund` documentado subió de 6 a 10).
Verificado en Chromium de extremo a extremo: EC-10106 recomendado en vivo para 715 Mbps, las
cuatro filas nuevas en la pestaña Catálogo con su SKU, la ficha de EC-10150 mostrando «sin
mínimo publicado» y su redundancia real, y «Enviar al cotizador» llevándolo correctamente al
cotizador multi-fabricante. Sin errores de consola.

**Mejora propuesta al cerrar esta entrega:** ahora que Jina Reader/Exa demostraron que
atraviesan el bloqueo de HPE, los pendientes 3 (23 datasheets PDF de Aruba sin descargar) y 14
(ciclo de vida de Huawei, bloqueado por Akamai contra Huawei específicamente, no HPE) merecen
un reintento con la misma herramienta antes de seguir dándolos por bloqueados sin remedio desde
este entorno — el costo es bajo (ya está instalada) y el pendiente 3 lleva desde agosto sin
avanzar por creerlo imposible desde aquí.

### El piloto de Fortinet se replica a los otros seis fabricantes (2026-09-10)

A petición del dueño del repo, decidiendo el punto que el piloto había dejado abierto
(«decidir después si se replica a los otros seis»). Huawei, Cisco, Nokia, Juniper, MikroTik y
Aruba pasan a navegar directo a su dimensionador igual que Fortinet, que suma dos pestañas
propias («Catálogo», «Fuentes») con la tabla de modelos y la procedencia verificada. Las seis
secciones que esas pestañas tenían en el portal se retiraron.

**Decisión de diseño resuelta con el dueño del repo: Nokia tiene dos dimensionadores, no
uno.** El botón «Nokia» navega al **7750 SR** (14 de los 18 modelos, el caso de un solo equipo
elegido); el fabric 7220 IXR sigue accesible por el paso «extra» de la barra de fabricante, que
`navegacion.js` ya traía preparado para esto desde el propio piloto.

**Un bug ya en producción, encontrado al explorar el código para replicar el patrón, y
corregido en el mismo cambio.** Las pastillas «Catálogo»/«Fuentes» de la barra de fabricante
(`navegacion.js`) seguían redirigiendo a `/index.html?fab=<id>&paso=cat`, una URL que ya no
hacía nada desde que la sección de Fortinet se quitó del portal — ese clic dejaba a quien lo
usara varado en el dashboard, en silencio. Replicar el patrón a seis fabricantes más sin
arreglarlo habría repetido el mismo bug seis veces. Ahora, si el destino es la página en la que
ya se está, cambia de pestaña en el sitio (dispara un click real sobre el botón de esa pestaña,
reutilizando el listener que la página ya tiene); si es otro fabricante, navega pidiendo esa
pestaña por la URL (`?tab=cat`), y la página la abre sola al montar la barra.

**La mejora que el propio piloto dejó anotada, resuelta — y mejor de lo propuesto.** El mapa
fabricante → dimensionador vivía duplicado en `public/js/index.js` y en
`scripts/verificar-pantallas.js`. La propuesta original era un JSON compartido nuevo; resultó
innecesaria porque `navegacion.js` ya mantenía ese mismo mapa completo (`FABRICANTES`, con los
siete) para su propia barra. Ambos sitios pasan a leerlo de ahí —`window.NAVFAB.FABRICANTES`,
cargando `navegacion.js` también en el portal, donde no pinta nada pero expone el dato— en vez
de mantener una segunda copia. Cero archivos nuevos.

**Lo que cada dimensionador ya tenía se preservó, no se rediseñó.** MikroTik y Aruba tenían una
tercera pestaña propia en el portal («RouterOS Features», «SD-WAN y Licencias») que se llevó
tal cual. Un hallazgo cambió el plan sobre la marcha: la pestaña «SD-WAN y Licencias» de Aruba
resultó ser **redundante** con contenido que su dimensionador ya tenía en su propia pestaña de
licencias (la misma nota metodológica proceso-vs-caudal, la misma tabla de Boost como pool) —
así que no se duplicó, y Aruba solo sumó «Catálogo» y una «Fuentes» liviana que remitía a esa
pestaña para el detalle por producto — división que el dueño del repo pidió unificar el mismo
día (ver *Aruba: la pestaña de Fuentes ya no está duplicada*, más abajo). Huawei aporta sus dos tablas (AR y NetEngine) desde el
mismo `MODELS` que ya carga su dimensionador —los 40 modelos traen el campo `cls` que las
distingue—, sin repetir el fetch. Juniper separa SRX y Session Smart Router en dos tablas, la
misma regla de «no se comparan entre sí» que ya aplica en el resto de esa página. Aruba declara
en la columna «Capacidad» si es rango WAN (EdgeConnect) o firewall (gateways), en vez de fundir
dos medidas distintas en un solo número.

Verificado en Chromium en las 7 páginas: navegación directa desde sidebar y dashboard, tablas
de catálogo con la cuenta de modelos esperada, pestaña de Fuentes con procedencia en vivo, y el
caso que antes fallaba (pastilla «Fuentes» de la barra inferior) cambiando de pestaña en el
sitio en vez de navegar. Sin errores de consola en ninguna. 232 pruebas (sin cambios: todo el
trabajo es de frontend, sin tocar servidor ni API).

**Mejora propuesta al cerrar esta entrega:** `scripts/verificar-pantallas.js` mueve el caudal y
abre la pestaña de BOM en los 7 dimensionadores, pero nunca visita sus pestañas nuevas de
«Catálogo»/«Fuentes» — una regresión ahí (por ejemplo, `renderCatalogo()` rompiéndose el día que
cambie la forma de `MODELS`) pasaría los 15/15 sin que nadie se entere hasta que alguien abra la
pestaña a mano. El costo de cerrarlo es bajo (dos clics más por dimensionador en la función que
ya conduce las 7 páginas) pero no se hizo en este cambio para no mezclar la replicación con una
ampliación del verificador.

### Fortinet: el dimensionador pasa a ser su página principal — piloto (2026-09-09)

A petición del dueño del repo, con la instrucción explícita de hacerlo primero solo para
Fortinet y decidir después si se replica a los otros seis fabricantes.

**Antes**, el botón «Fortinet» del dashboard y de la barra lateral llevaba a una vista de
catálogo dentro del portal, con un botón aparte para abrir el dimensionador en otra pestaña —
dos pantallas para una sola herramienta activa. **Ahora** el botón navega directo al
dimensionador, que suma dos pestañas (**Catálogo**, **Fuentes**) a las tres que ya tenía
(Dimensionar, Equipo y BOM, Licencias). El catálogo se pinta desde `MODELS`, ya cargado para el
propio dimensionador — no se repite el fetch a `/api/catalog` para mostrar lo mismo dos veces —
e incluye los modelos fuera de venta marcados, a diferencia del portal, que los ocultaba del todo
(criterio de `FICHA.rango`: se muestran, no se recomiendan).

**La vista de catálogo/fuentes de Fortinet en el portal se retiró.** Su lógica de
procedencia, carga de fuente oficial y contraste en el acto contra el catálogo —que usan
también los otros seis fabricantes— se extrajo de `index.js` a **`public/js/procedencia.js`**,
un módulo compartido (mismo patrón que `bom.js`/`ficha.js`/`estado.js`) que ambas páginas
cargan: evita duplicar ~300 líneas y que el dimensionador y el portal diverjan en esa pestaña.
El modal de contraste, antes marcado a mano en `index.html`, ahora lo inyecta ese módulo la
primera vez que hace falta — así una página nueva solo necesita la caja `[data-procedencia]`
y el `<script>`, sin copiar marcado.

**Divergencia detectada y resuelta antes de publicar.** Mientras se trabajaba, `origin/main`
avanzó con un commit ajeno a esta tarea (activó el dimensionador de Juniper y quitó
`target="_blank"` de la navegación del portal) que tocaba los mismos tres archivos. Se fusionó
a mano conservando ambos cambios y se reverificó completo (lint, 232 pruebas, Chromium).

**Un fallo propio, cazado por `pantallas.yml` y no por mí.** El primer push rompió
`npm run pantallas`: el chequeo «Portal — las once secciones» esperaba que el botón de
Fortinet activara `#page-fortinet`, que ya no existe. Corregido en `scripts/verificar-pantallas.js`
para reconocer que Fortinet ahora **navega** en vez de activar una sección, y volver al portal
antes de seguir con el resto. Es exactamente para lo que ese workflow existe: cazó una
regresión real de mi propio cambio antes de que Railway la sirviera — el primer despliegue del
push quedó marcado `REMOVED` sin llegar a `SUCCESS` (ver `git log`, deploy `f4c19549`).

Verificado en Chromium (tarjeta y barra lateral → dimensionador; pestañas Catálogo/Fuentes con
el control de carga completo para el rol con permiso `sync`) y en producción tras el despliegue:
`/salud` responde `ok` y los logs muestran `[seed]` y `Presales corriendo en`. Sin
tocar los otros seis fabricantes — el piloto queda ahí hasta que se decida replicarlo.

**Mejora propuesta al cerrar esta entrega — resuelta (2026-09-10)**, ver la entrada de arriba:
el mapa `directo` que decide qué fabricante
navega en vez de abrir su sección vive duplicado en dos sitios — `public/js/index.js` (el
click del portal) y `scripts/verificar-pantallas.js` (la prueba) — con la misma entrada
`{fortinet: 'dimensionador-fortinet-fortigate.html'}` escrita dos veces. Con un solo
fabricante no pesa, pero si el piloto se replica a los otros seis, esa lista crecerá en
ambos archivos a la vez y en algún push alguien va a actualizar uno y olvidar el otro —el
mismo modo de fallo que ya tuvo `CISCO_EOL_MODELS` al vivir sin nada que lo comprobara. El
costo de evitarlo hoy es bajo (un JSON compartido que ambos archivos importen) pero es
trabajo especulativo mientras el mapa tenga una sola entrada; conviene hacerlo en el mismo
cambio que añada el segundo fabricante, no antes.

### Sincronización Inteligente replanteada: analiza en producción, publica por PR (2026-09-08)

El módulo estaba bloqueado entero en producción bajo un solo motivo, pero eran dos problemas
distintos metidos en el mismo saco, y juntarlos impedía justo lo que la herramienta tiene que
hacer — revisar el catálogo que se está sirviendo.

- **Analizar** ahora corre en cualquier entorno. Lee el catálogo vigente (que en producción es
  exactamente lo sembrado desde `legacyData/`) y devuelve cambios sin escribir nada. Falla
  cerrado sin `ANTHROPIC_API_KEY` — el mock que inventaba propuestas ya no existe, así que no
  hay forma de que devuelva un dato falso por no tener clave.
- **Escribir en la base** sigue bloqueado en producción, y con razón: esa base es efímera. Ese
  muro se queda.
- **La escritura durable** no pasa por el servidor: se descarga la propuesta y
  `.github/workflows/aplicar-propuesta.yml` la aplica sobre `legacyData/` con el anclaje de
  `npm run propuesta`, corre `npm run verificar` y abre un PR. **El token de escritura vive en
  Actions, nunca en el servicio que sirve los precios** — esa fue la decisión de diseño frente
  a poner un token de GitHub en Railway.

Excel, CSV y txt ya se subían; ahora la UI lo dice con claridad y el tipo se decide por la
firma del contenido, no por la extensión. Se añadieron Juniper y Nokia al selector. `GET
/api/sync/estado` informa a la UI del entorno y de si hay clave, para no ofrecer un botón que
va a fallar. Documentación oficial del módulo en **`docs/sincronizacion.md`**.

**Un fallo encontrado y cerrado de paso:** `escribirCampo` en `importar-propuesta.js` escapaba
la comilla pero no la barra invertida, así que un `newValue` acabado en `\` cerraba la cadena
antes de tiempo y el resto se leía como código — corrompiendo el archivo de catálogo y dejando
el servidor sin arrancar. El `newValue` puede venir de un documento subido por cualquiera, así
que no es una cadena de confianza. Ahora se escapa por completo (barra, comilla, saltos) y hay
una prueba que reproduce el ataque y confirma que el valor vuelve como dato, nunca como código.

**Para que Analizar funcione en el sitio desplegado hace falta definir `ANTHROPIC_API_KEY` en
Railway.** Sin ella el panel lo dice y no deja pulsar Analizar. Es lo único que queda por hacer
del lado de operación, y es una variable de entorno, no código.

184 pruebas (eran 181). Verificado en Chromium en modo producción: el panel abre, sin clave
avisa y deshabilita Analizar, `/estado` responde `{produccion:true, tieneClave:false}`, y la
descarga produce el JSON con la forma exacta que consume el importador. Sin errores de consola.

### Navegación por fabricante, y cantidad editable en las referencias (2026-09-09)

Dos peticiones del dueño del repo en la misma entrega.

**Cantidad editable** (la mejora propuesta al cerrar la anterior). «Añadir» sumaba de uno en
uno: cotizar 10 licencias eran diez clics y bajar de 3 a 2 no se podía. Ahora la fila del BOM
trae el campo, **solo en lo añadido a mano** —las filas que calcula el dimensionador salen de su
motor, y editarlas invitaría a cambiar una cifra que el próximo repintado pisa—, escribiendo con
`change` y no con `input`: guardar repinta la tabla, así que reaccionar a cada pulsación
destruiría el campo a medio teclear. Menos de 1 quita la línea, que es lo que significa escribir 0.

**La barra de fabricante** (`js/navegacion.js`), en el portal y en los ocho dimensionadores:
← anterior / siguiente → con el nombre del destino a la vista, el paso actual marcado, «3 / 7» y
`Alt`+flechas. **Conserva el paso**: desde el dimensionador de Fortinet, «siguiente» lleva al
dimensionador de Juniper, no a su portada — eso la convierte en un recorrido y no en un menú.

**Lo que NO se hizo, y por qué.** La petición literal era fusionar catálogo, fuentes,
dimensionador, BOM y licencias en una sola página. Los ocho dimensionadores tienen cada uno un
`#bw`, un `#verdict` y un `#pane-bom`: juntarlos habría metido ocho motores en el mismo espacio
de identificadores y el mismo estado global, para ganar una continuidad que es de **navegación**
y no de archivo. Con la barra, el riesgo es que se pinte mal una barra; con la fusión, que
calcule mal un dimensionador. **Dentro de cada dimensionador ya hay pestañas**
(Dimensionar · Equipo y BOM · Licencias), así que lo que faltaba era moverse entre fabricantes,
que es justo lo que se añadió.

**Un fallo propio, cazado al mirar la prueba en vez de su resultado:** la primera versión
necesitaba que la prueba llamara a `pintar()` a mano, porque el portal cambia de sección sin
recargar y la barra no se enteraba — para un usuario real no habría aparecido nunca. Se corrigió
observando la clase de las secciones (`MutationObserver`), y la prueba se endureció para navegar
como un usuario, pulsando la barra lateral.

232 pruebas (eran 228). **15/15 pantallas** en Chromium, y la captura del dimensionador de
Fortinet revisada a ojo: la barra queda discreta, con el acento del fabricante y el paso actual
marcado.

### Las referencias añadidas dejan de perderse entre fabricantes (2026-09-09)

Ejecución de la mejora propuesta al cerrar la entrega anterior, aprobada por el dueño del repo.

**El fallo, que era de pérdida de datos y silencioso.** Las referencias se guardaban en
`presales-bom-refs:<pathname>`, una clave por página. Así que añadías un bundle de Fortinet,
te ibas a Aruba, enviabas al cotizador desde allí — y el de Fortinet se quedaba atrás sin un
aviso. Justo en la pantalla que existe para armar una cotización **multi**-fabricante.

**La corrección.** Una sola clave para los siete, y el fabricante que cada referencia ya llevaba
dentro es lo que las separa: el BOM de cada dimensionador muestra **solo las suyas** —una
referencia de Aruba en el BOM de un FortiGate no corresponde a ese equipo— pero
`enviarACotizador` manda **todas**. `ficha.js` informa el fabricante de la página con
`BOM.fijarVendor`, así que las siete páginas siguen sin tocarse.

**Dos detalles que evitan reemplazar un fallo por otro:**

- **La clave de una referencia es `fabricante|sku`, no el sku suelto.** Con una lista compartida,
  dos fabricantes pueden traer el mismo código, y quitar uno habría quitado el otro.
- **La clave vieja se migra** en la primera lectura y luego se borra. Sin eso, quien ya tuviera
  referencias guardadas las habría visto desaparecer al desplegar — la misma pérdida silenciosa
  que este cambio venía a evitar, reintroducida por la propia corrección.

228 pruebas (eran 224). Verificado en Chromium el caso exacto: añadir en Fortinet → el BOM de
Aruba **no** la muestra → añadir una de Aruba → enviar al cotizador **desde Aruba** → llegan las
dos.

### Las referencias llegan al BOM y al cotizador: añadir un bundle, no solo verlo (2026-09-09)

Continuación directa de lo anterior, a petición del dueño del repo. Ver las referencias no
servía de mucho: un FortiGate se vende casi siempre con su bundle de FortiCare, y esa línea
había que teclearla a mano en el cotizador.

Ahora cada fila de la sección trae un botón **«Añadir»**, la referencia aparece en el BOM bajo
**«Referencias añadidas»** con su SKU y su precio, **suma al total**, y «Enviar al cotizador» se
la lleva junto al equipo. Se quita con la × de su propia fila.

**Viven en `bom.js`, no en cada página.** `renderTabla` es el punto único por el que pasan los
siete dimensionadores, así que gestionarlas ahí las da a los siete sin tocar ninguno — la misma
razón por la que `sincronizar` y `avisoDesvio` acabaron en ese módulo.

**Sobreviven al repintado, y ese es todo el punto.** El BOM se repinta en cada cambio de
escenario; una referencia guardada en el array de filas que construye la página se habría
borrado al mover el caudal, en silencio — el mismo modo de fallo que ya tuvo `llevarABom`. Se
guardan aparte, por página, y se vuelven a pegar en cada render. Verificado moviendo el caudal a
3.000 Mbps con el bundle puesto.

**Un fallo propio, corregido antes de entregar:** la primera versión fijaba `vendor:'Fortinet'`
al construir la línea en el cotizador, lo que habría pintado de Fortinet una referencia de
Aruba. Ahora el fabricante viaja con la referencia y el color sale de `CATALOG` buscando ese
fabricante real. Es un dato inventado de los que no rompen nada y solo mienten.

224 pruebas (eran 219). Verificado en Chromium el ciclo entero: añadir → aparece en el BOM →
sobrevive al cambio de escenario → llega al cotizador marcado como referencia de pedido →
persiste tras recargar → la × lo quita.

### Referencias de pedido en la ficha: 6.849 SKU de Fortinet, y lo que cada fabricante sí tiene (2026-09-09)

A petición del dueño del repo: «mostrar todos los SKU con la descripción relacionados a los
equipos, para que los usuarios vean la mayor cantidad de información asociada».

**El hueco era real y más grande de lo que parecía.** `ficha.js` no mostraba **ningún** SKU —ni
siquiera el `hwSku` que ya estaba en el catálogo—, así que quien armaba una propuesta tenía el
modelo y luego iba a buscar el número de parte a otro sitio. Y las **28 referencias que Aruba ya
traía estructuradas** desde la fase 6c no se veían en ninguna pantalla: el dato estaba guardado y
nadie podía leerlo.

**Fortinet aporta 6.849 referencias** —hardware, bundles de FortiCare/FortiGuard, licencias y
SaaS— con descripción y precio de lista, extraídas con `npm run skus` de la misma price list que
respalda los precios. El importador **ancla cada bloque** contra el `hwSku` y el precio ya
verificados antes de aceptarlo: 54 de 54 modelos entraron, cero rechazos. El casado va anclado al
nombre (`FortiGate-30G` sin que le siga letra o dígito), no por substring suelto: hoy no hay
arrastre —se midió— pero un futuro `FortiGate-30G2` lo habría producido en silencio.

**Van bajo demanda y por modelo**, y esa fue la decisión de arquitectura: 774 KB en el payload
del dimensionador cargaría todo eso en cada visita para mostrar, como mucho, las de un equipo.
`GET /api/referencias/:vendor/:modelo` sirve unos 12 KB, desde `legacyData` sin pasar por la base
—precedente de `toFuentes`—, y una prueba e2e falla si ese payload por equipo supera los 120 KB.

**Lo que cada fabricante tiene es distinto, y se dice.** Aruba trae variantes **sin número de
parte** (HPE no lo publica, igual que no publica precios) y se presentan como variantes, no como
referencias de pedido; Cisco solo el SKU de cabecera de 8 de sus 21 modelos; Huawei, MikroTik,
Juniper y Nokia no traen ninguna y la sección **lo declara**, en vez de dejar un hueco mudo que
se lee como «este equipo no necesita nada» — el mismo criterio que «el catálogo no lo especifica»
de la sección de alimentación.

219 pruebas (eran 212). Verificado en Chromium: el buscador filtra sin perder el foco, los chips
acotan por tipo, y al cambiar de equipo **los SKU cambian**. Esa última aserción se reforzó a
propósito: la primera versión comprobaba el conteo, y el conteo no prueba nada —el 60F y el 61F
traen 79 referencias cada uno—, así que ahora compara los SKU, que es lo que distingue «la tabla
siguió al equipo» de «se quedó con la del anterior».

### Carga de fuente por fabricante, y una ventana que contrasta el documento con el catálogo (2026-09-08)

A petición del dueño del repo, en dos pasos: primero *«un botón para subir documentos por
fabricante que actualice las fuentes automáticamente apenas se suba»*, y después *«al subir,
generar una ventana interactiva que contraste el documento con el actual y muestre lo nuevo
que se va a actualizar»*.

**La carga sin IA y sin crédito.** Cada fabricante tiene en su pestaña «Fuentes y Referencias»
un control «Cargar fuente oficial» (permiso `sync`). Sube el datasheet o la lista de precios
(PDF/XLSX/CSV/TXT, tipo decidido por la firma del contenido, no por la extensión) y **la
procedencia de ese fabricante se actualiza al instante**: aparece como fuente «Cargada» con
fecha, hash SHA-256 y enlace. Los archivos viven en el volumen persistente
(`AUTH_STATE_DIR/fuentes/`), como `usuarios.json`, no en la base efímera, así que sobreviven a
un deploy; el nombre en disco lo genera el servidor, nunca el del archivo subido, y `rutaArchivo`
valida el formato del id antes de tocar disco (defensa de path traversal). `server/fuentesSubidas.js`
es el módulo; rutas `POST /api/fuentes/:vendor` y `GET /api/fuentes/:vendor/documento/:id`.
**Actualiza la procedencia, no reescribe las cifras** — subir no es contrastar, y estampar
«verificado» sobre números que nadie comparó es la mentira que este catálogo prohíbe.

**La ventana de contraste (Excel/CSV), determinista y en el navegador.** Al subir una fuente
tabular se abre en el acto una ventana que la compara con el catálogo vigente **sin IA**:
reconoce una columna solo si su cabecera casa con un campo real del catálogo (o un alias
explícito cuyo campo existe para ese fabricante), y lo que no reconoce lo **lista** en vez de
adivinar. Devuelve cuatro montones: **cambios** (modelo que existe con un valor distinto,
comparado por valor y no por formato), **altas** (modelo que no está — se reportan pero nunca
se aplican solas, la regla del importador), **sin cambio** (se cuentan) y **columnas
ignoradas**. Es una vista previa: no escribe nada. Desde ahí se marcan los cambios y se
**descarga la propuesta** con la forma que consumen `npm run propuesta` y `aplicar-propuesta.yml`,
así el cambio pasa por el mismo anclaje y por un PR revisable. Un **PDF** no se contrasta aquí
—extraer una tabla de un PDF sin equivocar de fila es lo que este repositorio no automatiza—:
la ventana lo dice y remite a la IA o a los importadores. La regla vive en
`public/js/contraste.js` (`window.CONTRASTE`); el parseo (SheetJS cargado bajo demanda, para no
pesar ~900 KB en cada visita al portal) y el pintado, en `js/index.js`.

**Borrar una fuente y actualizar la pestaña (tercera petición del mismo día).** Cada fila trae
ahora, para quien tiene `sync`, una columna **Acciones**:

- **Borrar** solo en las fuentes **cargadas** — quita el archivo del volumen y su fila, con
  confirmación porque no hay deshacer. Las del catálogo (`legacyData/fuentes.js`) muestran en su
  lugar **«en el código»**: se quitan con un commit, que deja diff y revisión. Un botón que
  borrara la procedencia del catálogo sin rastro sería justo lo contrario de lo que esta pestaña
  da. La ruta `DELETE` exige el permiso (403 sin él) y responde **404 a un id de otro
  fabricante**, así que borrar uno no puede alcanzar al de al lado. Y la entrada se retira
  **aunque el archivo ya no esté** en el volumen: una fila que anuncia un documento que no se
  puede abrir es un enlace roto presentado como procedencia.
- **Actualizar** en los **siete** fabricantes — vuelve a pedir `/api/fuentes` y repinta, con la
  hora del último refresco. El portal pinta esta pantalla una sola vez al cargarse, así que un
  documento subido desde otra pestaña, o borrado por otra persona, no se veía hasta recargar la
  página entera. Va sin permiso: releer no cambia nada.

206 pruebas (12 nuevas sobre `contraste.js`: mapeo por valor no por formato, columna no
reconocida que se ignora, alias solo si el campo existe, alta nunca aplicada, celda vacía que no
propone borrar, casado de nombre con prefijo de fabricante, y la forma de `comoPropuesta`; más 3
sobre `eliminar` y el e2e de borrado contra el servidor real).
Verificado de extremo a extremo en Chromium: login → pestaña de fuentes de Huawei → subir un CSV
→ la ventana detecta el cambio de un AR611 (fwd 300→700), reporta el alta y la columna ignorada,
el botón de descargar propuesta aparece y la procedencia muestra la fuente «Cargada». Sin errores
de consola (salvo las tipografías de Google, bloqueadas por egreso en este entorno).

**Lo único pendiente de operación** sigue siendo definir `ANTHROPIC_API_KEY` con saldo en
Railway para que el *análisis por IA* funcione; la carga de fuentes y el contraste tabular no lo
necesitan.

### El pendiente 4, cerrado: las pantallas se conducen solas en cada push (2026-09-04)

Faltaba la mitad visual: `sonda-produccion.yml` confirmaba que el dominio público responde,
pero nunca inicia sesión —no tiene por qué guardar la contraseña real de producción—, así que
«¿esta pantalla funciona?» seguía dependiendo de que una persona abriera el sitio.

**Se estudió montar un entorno de staging en Railway y se descartó por seguridad, no por
coste.** Habría añadido una **segunda copia pública del catálogo de precios**, tras una
contraseña guardada en los secretos del repositorio — y los secretos de Actions los puede leer
cualquiera que sepa empujar un workflow. Y a cambio de esa exposición no se veía nada nuevo:
`DATABASE_PATH` va sin definir en producción, la base es **efímera** y se resiembra desde
`server/seed/legacyData/` en **cada** despliegue, así que lo que pinta una pantalla es función
del *commit*, no del entorno. Un arranque de ese mismo commit en el ejecutor de Actions —que
`verificar.yml` ya hacía para comprobar `/salud`— renderiza exactamente los mismos datos.

Así que la verificación vive donde ya estaba el servidor. `npm run pantallas`
(`scripts/verificar-pantallas.js`) entra por el muro y conduce **15 pantallas**: las once
secciones del portal, el comparador, las cinco capas de la calculadora, los ocho
dimensionadores —moviendo el caudal y abriendo la pestaña de BOM en cada uno—, el cotizador,
la guía, cuenta y usuarios. `.github/workflows/pantallas.yml` lo corre en cada push y sube las
capturas como artefacto, con una tabla de resultados en el resumen de la corrida. La
contraseña la genera el propio job y muere con él: no es un secreto del repositorio ni abre
nada más.

**Falla ante lo que de verdad rompe una pantalla:** un error de consola, una excepción, una
petición fallida **al propio origen** o un contenedor que se queda vacío —el síntoma de un
`fetch` que falló en silencio, que es el modo más callado que tiene esta aplicación, porque
cada pantalla se pinta desde una sola llamada—. Las peticiones a terceros se ignoran a
propósito: las tipografías de Google se cargan sin bloquear (`js/fuentes.js`) y desde este
entorno ni siquiera resuelven, y un verificador que se pone rojo por un CDN ajeno se acaba
ignorando.

**Y se comprobó que detecta, no solo que pasa.** Con todo en su sitio da 15/15; quitando
`public/js/comparador.js` cae a 12/15 con código de salida 1, y el informe dice
«`#compareOut` se quedó vacío» además de reproducir la firma histórica exacta —«Refused to
execute script… MIME type (`text/html`)»—, que es literalmente el fallo del script que quedó
detrás del muro de auth que CLAUDE.md lleva documentado. Dos fallos de la primera versión, los
dos míos y no de la aplicación, se arreglaron antes de subirla: esperaba **visibilidad** de
controles que viven en una `.page` inactiva del portal (es `attached` lo que hay que esperar),
y contaba como error de la aplicación el `ERR_CONNECTION_RESET` de Google Fonts.

**Lo que sigue sin automatizarse, y no se puede:** el juicio de si la pantalla dice lo que se
le quiere decir a un cliente. Pero eso ahora se hace con las capturas delante en cada push, no
teniendo que acordarse de abrir el sitio. Lo que **no** se comprueba es ninguna cifra del
catálogo: para eso están las 181 pruebas, y una aserción sobre «3,1 Gbps» se rompería en cada
cambio de catálogo, que es como se enseña a la gente a ignorar un rojo.

**Este check frena el despliegue a propósito** —Railway espera a las comprobaciones de CI y una
pantalla rota no debería llegar a producción—. Si alguna vez estorbara más de lo que ayuda, la
válvula está escrita en la cabecera del workflow: `continue-on-error: true` en el job deja el
rojo y las capturas pero desbloquea.

### La calculadora de throughput dimensionaba con la cifra de portada (2026-09-04)

La pantalla elegía equipo con una sola línea:

```js
const cap = profile === 'ipsec' && d.ipsec > 0 ? d.ipsec : d.tp;
```

`d.tp` es la cifra de **portada** de cada catálogo —firewall en Fortinet, forwarding en
Huawei, capacidad de conmutación en Nokia—, así que de ahí salían tres fallos, y los tres
daban una respuesta con pinta de correcta:

1. **El perfil «SD-WAN / NGFW» no miraba la cifra de NGFW ni una sola vez.** Medido en el
   navegador con los valores por defecto de la pantalla (1 Gbps, bidireccional, 30 % de
   margen = 2,6 Gbps): proponía un **FortiGate 30G**, que hace 4 Gbps de firewall y **570 Mbps
   de NGFW**. Factor **4,6x por debajo** de lo pedido. El que cumple de verdad es el
   FortiGate 120G, cuatro escalones de gama más arriba. Es el mismo modo de fallo que la
   auditoría de FortiGate documentó (14,3x) y que el SRX380 repite (10x).
2. **Un equipo sin cifra de IPsec se juzgaba por su forwarding.** Para 2,6 Gbps de IPsec
   proponía un **Nokia 7220 IXR-D1** —un leaf de fabric de datacenter— porque conmuta
   88 Gbps, y un **Aruba EC-S** cuyo IPsec en este catálogo es `0`.
3. **Comparaba las siete cifras de portada entre sí sin decirlo**, mientras el comparador de
   la pantalla de al lado avisa exactamente de eso.

**La regla ahora vive en `public/js/calculadora.js`** (el pintado sigue en `js/index.js`,
mismo reparto que el comparador): se dimensiona con la cifra de la capa que pide el perfil, y
si el catálogo no la trae para ese modelo, **el modelo se aparta con su motivo** — nunca se
sustituye por la de otra capa. El panel de apartados los cuenta por fabricante, dice por qué
y enlaza al dimensionador de ese fabricante, así que una lista corta se explica en vez de
leerse como catálogo completo. El perfil de tráfico pasó de tres opciones a **cinco capas**
(reenvío/firewall, IPsec, SD-WAN, con inspección NGFW/IPS, e inspección completa
Threat Protection/ATP), que son cinco preguntas distintas sobre el mismo equipo: en un
FortiGate 120G son 39, 35, — , 3,1 y 2,8 Gbps.

**El error que cometí a mitad, y cómo se cazó.** Escribí el mapa de capas contra
`legacyData/indexPR.js`, y lo que sirve la aplicación es otra cosa: `seedCatalog.js` funde en
la misma fila el catálogo del portal y el del dimensionador de ese fabricante. En
`indexPR.js` el `sdwan` de Cisco es el texto «Sí»; en `/api/catalog` es un **número**. Con el
mapa mal escrito, la pantalla apartaba los 19 modelos de Cisco «porque el catálogo no publica
su cifra de SD-WAN» — un «sin dato» falso, del mismo tipo que el «IPS: no aplica» de un
Catalyst 8300 que el comparador llegó a mostrar. Apareció al mirar la API real en el
navegador, no en las pruebas, porque las pruebas leían el mismo fichero equivocado. La
corrección trajo además a Juniper (los SRX de 2024 publican `vpn`, `ips` y `atp`) y a
EdgeConnect (su rango de ancho de banda WAN). La guarda está en
`test/servidor-produccion.test.js`, que interroga al servidor de verdad: un modelo solo puede
apartarse si el campo del que sale esa capa está vacío **en su fila**.

Otros dos arreglos de la misma pantalla: la exportación CSV se armaba rascando el HTML ya
pintado —perdía la capa dimensionada y se rompía al tocar el maquetado—, y ahora sale de los
datos, con la capa, la holgura y los apartados con su motivo; y la lista de fabricantes se
deriva del catálogo en vez de un `['Huawei','Cisco',...]` escrito a mano, que es lo que dejó
a Aruba y MikroTik sin botón en los filtros del cotizador. Verificado en Chromium con los
cinco perfiles, sin errores de consola. 16 pruebas nuevas (181 en total).

### Nokia, los 18 modelos cubiertos: un segundo dimensionador para lo que no es fabric (2026-09-03)

Cierra el pendiente 6. Los 14 modelos que la fase 1 dejó fuera —7250 IXR, 7250 IXR-X,
7250 IXR-R y 7750 SR/SR-s/SR-1x— ya se dimensionan, en `dimensionador-nokia-7750sr.html`.

**Son dos páginas porque son dos preguntas.** El dimensionador 7220 IXR responde «cuántos
leafs y cuántos spines», y su resultado son dos equipos con sus cantidades. Aquí la pregunta
es «cuál de estos catorce aguanta el enlace», y el resultado es **un** equipo — así que esta
página sí reutiliza `js/ficha.js`, con su desplegable de candidatos, su ficha completa y su
sección de alimentación, igual que los otros cinco dimensionadores. Nokia es ahora el único
fabricante del portal con dos.

**No hizo falta ningún documento externo, y eso era el hallazgo.** La capacidad y los puertos
de los catorce ya estaban verificados en `indexPR.js`, pero como **texto libre**: `"6.4 Tbps"`,
`"36x100GE o 12x400GE · 1U"`. Todo el trabajo fue estructurarlos en campos que un motor pueda
usar, sin añadir, corregir ni completar una sola cifra. Y estructurar obligó a decidir tres
cosas que el texto libre escondía:

1. **«36x100GE o 12x400GE» son dos configuraciones alternativas, no la suma de las dos.** Un
   7250 IXR-6e da 36 puertos de 100GE **o** 12 de 400GE, nunca ambos. Por eso `configs` es una
   lista de opciones y el motor comprueba si *alguna* cumple: sumarlas habría prometido 48
   interfaces donde hay 36. Medido en el navegador: pidiendo 40 puertos de 400GE, el único
   candidato es el 7750 SR-1x-48D, y el SR-1x-92S —que trae 12x400GE **más** 80x100GE— queda
   fuera correctamente, porque sus puertos de 100GE no completan los de 400GE.
2. **Un chasis modular no tiene densidad publicada, y eso no es lo mismo que no tener
   puertos.** «7 slots IOM · hasta 400GE» dice cuántas tarjetas caben, no cuántos puertos
   salen: depende de qué IOM se pida, y este catálogo no tiene el catálogo de IOM. Los cinco
   modelos así (7750 SR-7s, SR-14s, 7250 IXR-R6dl, IXR-e, IXR-e2) se dimensionan por caudal y
   **se apartan con su motivo** en una sección propia cuando se pide una densidad concreta.
   Descartarlos en silencio los haría parecer insuficientes; colarlos con una densidad
   inventada sería peor. Es el mismo trato que `ficha.js` da a una capa sin cifra.
3. **La capacidad va en Gbps aunque el material comercial la cite en Tbps.** 6,4 Tbps son
   6400. Con las dos unidades mezcladas, un equipo de 6,4 Tbps habría perdido al ordenar
   contra uno de 300 Gbps — el mismo fallo que `tabla.js` ya tuvo cuando 5.999 dólares valían
   menos que 29.

**La plataforma se elige antes que el caudal**, la misma regla que ya gobierna el dimensionador
Cisco. Estas cinco familias no son intercambiables aunque coincidan en Tbps: un router de cell
site, un agregador de datacenter y un PE de core IP/MPLS cambian el sistema operativo, el papel
en la red y quién la opera. Verificado en el navegador: a 520 Gbps, sin acotar sale un
7250 IXR-e2 de cell site; acotando a la familia 7750 SR sale un SR-1s. Son respuestas distintas
a preguntas distintas, y ordenar por capacidad sin acotar la familia daría la primera cuando se
buscaba la segunda.

Seis pruebas nuevas (144 en total, eran 138) sobre el motor puro, que se expone como
`window.NOKIA_SR` igual que `BOM`, `FICHA` y `ESTADO` exponen el suyo: cubren las
configuraciones como alternativas, el apartado de los modulares, el acotado por familia y que
pedir más que el modelo más grande no devuelva el mayor «por aproximación». Arranque real con
`NODE_ENV=production` y la página conducida en Chromium sin errores de consola.

### Juniper 12/12, dos SRX que ya no se piden, y una etiqueta que decía lo contrario (2026-09-03)

Una sola corrida de Actions trajo los siete documentos que faltaban para cerrar tres
pendientes — cinco *hardware guides* de Juniper, la tabla oficial de fin de vida de la serie
SRX y la ficha de la serie Cisco 8300 — y los tres se cerraron. Lo interesante no fue el
volumen sino que **cada uno enseñó algo distinto sobre cómo se lee una fuente**.

**Pendiente 15, Juniper pasa de 7/12 a 12/12.** SRX320, SRX340, SRX345, SRX4200 y SRX4700.
Dos casos merecen quedar escritos:

1. **El SRX340 y el SRX345 son modelos consecutivos de la misma serie con respuestas
   opuestas.** El 345 se vende con una fuente o con dos (`RE-SRX345-DUAL-AC`) y con las dos
   instaladas la que queda asume la carga sin interrupción — es el **quinto** `'opcional'`.
   El 340 lleva la suya **fija en el chasis**, no reemplazable en campo y con una sola entrada
   AC: `false` duro. Deducir uno del otro por la gama habría acertado en ninguno de los dos.
2. **El SRX320 se queda sin `watts` aunque su guía sí publique consumo medio**, porque publica
   **dos**: 46 W el modelo sin PoE y 221 W el modelo PoE, un factor 4,8. Este catálogo tiene
   una sola entrada `SRX320`, así que elegir una de las dos cifras sería correcto para la
   mitad de los pedidos y falso para la otra mitad. Las dos van en el texto y `watts` queda
   vacío — el mismo tercer estado que ya protege a `redund` y a las fuentes sin fecha.

El SRX4200 y el SRX4700 son `true` sin matices, y ninguno lleva `watts`: los 650 W y los
2.200 W que publican son capacidad **por fuente**, no consumo. Su dato queda registrado pero
**hoy no se ve en pantalla**, porque los dos solo traen `fw` y el motor descarta con su motivo
a los modelos sin cifra en la capa efectiva — se verá el día que se complete su `fwImix`.

**Pendiente 8: dos de los doce SRX ya no se piden, y lo difícil fue no marcar de más.** La
tabla oficial de hitos mezcla en las mismas filas el fin de vida de **paquetes de software**
(`S-SRX1500DP-A1-7` y compañía, «7-year security software bundles») con el del hardware, y
varios modelos aparecen **solo** por ahí. Retirar un paquete de licencias no retira el equipo:
aplicar esas filas habría sacado de la recomendación a aparatos que Juniper sigue vendiendo.
El criterio que se usó es el SKU — solo cuenta la fila que lista el chasis o el sistema del
propio modelo (`SRX1500-CHAS`, `SRX1500-SYS-JB-AC`, `SRX4100-CHAS`, `SRX4100-SYS-JB-AC`) — y
con ese filtro los doce modelos dan **exactamente dos**: SRX1500 (TSB101240) y SRX4100
(TSB101895), ambos con último pedido el **2026-04-15**, ya vencido, y soporte hasta 2031.
El **SRX4200 es el caso que mejor lo ilustra**: sí aparece en la tabla, pero su única fila es
la del kit de rack `SRX4200-RMK2`, y un accesorio retirado no retira el equipo.

Verificado en el navegador: el SRX1500 ahora se muestra con «fin de venta vencido» y deja de
ser el recomendado. `sucesor` va **vacío** en los dos: el SRX1600 y el SRX4300 son los
reemplazos evidentes por posicionamiento, pero la tabla no nombra ninguno, y «evidente» es
exactamente como entró el FortiGate 2000F inexistente que este catálogo ya sufrió.

**Pendiente 9: Cisco sí publica el SD-WAN del C8355-G2, y son 8,7 Gbps.** Mientras estuvo en
`null`, la página lo dimensionaba con sus 20 Gbps de IPsec marcándolos «(cifra IPsec)»:
**2,3 veces por encima** de lo que el equipo hace en SD-WAN, en el único perfil en el que ese
equipo se vende. La fila entró con doble anclaje — su forwarding de 38 Gbps y su IPsec de
20 Gbps ya coincidían con el catálogo — y de paso la misma ficha corrigió otras dos cosas del
mismo modelo: su `redund` estaba en `false` y el equipo trae **entrada de alimentación doble
con dos fuentes por defecto**, y sus 45 W son de las pocas cifras que Cisco publica como
*típica* y no como máximo, así que sí entran en `psu.watts`.

**Y una etiqueta que decía lo contrario de lo que mostraba.** Al revisar cómo se pintaba lo
anterior apareció que la fila `psu.amps` de la ficha se llamaba **«Salida»**, y era falso en
**22 de las 24 filas del catálogo**: en Fortinet y en Juniper lo que se guarda ahí es la
corriente que el equipo **toma de la red** («12 A @100 V · 9 A @240 V»), que es justo el dato
con el que se dimensiona un UPS o un circuito — llamarlo salida invitaba a leerlo al revés.
Ahora se llama «Corriente», y las dos únicas filas que **sí** son una salida (el módulo
PAC350S12-CR de Huawei) lo dicen en el propio valor. De paso, su decimal pasó a coma, que es
la convención de este catálogo.

Las tres fuentes quedan registradas en `fuentes.js` — incluidas las *hardware guides* de
Juniper, que se habían usado el mismo día para los primeros siete modelos **sin registrarse**.
138 pruebas (eran 135), arranque real con `NODE_ENV=production` y las dos páginas conducidas en
Chromium sin un solo error de consola.

### Juniper 7/12 y un defecto de Cisco que decía dos cosas a la vez (2026-09-03)

**Juniper** (pendiente 15): su material comercial publica rendimiento, no alimentación — lo
eléctrico vive en las *hardware guides*, una por modelo. Se bajaron seis y se comprobó modelo
por modelo que **cada guía habla solo de su equipo** antes de aplicar nada; la lección del
`70f-series.pdf` de Fortinet, que resultó ser la ficha del 71F, ya está incorporada. De 1 a 7
de 12.

**Cuatro de los seis son `'opcional'`**, y Juniper lo dice sin rodeos: *«We ship the SRX1600
with only one power supply unit (PSU). You can order the second»*. El SRX1500, el SRX1600, el
SRX2300 y el SRX4300 salen con una fuente y la segunda se pide aparte. Es la segunda vez en el
mismo día que ese cuarto estado evita una promesa falsa — nació con el FortiGate 80F/90G.

**Cisco, revisado como pedía el encargo, y aparecieron tres defectos del mismo tipo**: datos de
pedido afirmados como hechos sobre equipos que no los admiten.

1. **La misma pantalla decía dos cosas sobre el mismo campo.** La tabla de ficha tenía su
   propia fila «Redundancia de fuente de serie» pintando «No (kit opcional)», mientras la
   sección de alimentación que esa misma página ya renderiza con `FICHA.seccionAlimentacion`
   decía «No — fuente única». La fila se retiró: la regla vive en un solo sitio.
2. **Ese «(kit opcional)» afirmaba que existe un kit de redundancia** para los **once** modelos
   con `redund:false`, entre ellos cuatro Meraki MX de sobremesa. Inventar una opción de pedido
   es el mismo fallo que el `FortiGate 2000F` y el `EC-2XL`.
3. **Y en dos sitios más se ofrecía una NIM de LTE a equipos con `nim: 0`** — los Meraki no
   tienen ranuras. Ahora los avisos distinguen si el equipo admite la ampliación o no.

**Pendiente 3, avanzado de verdad**: con el hallazgo de que `arubanetworking.hpe.com` sí
responde, se bajaron **4 de 4** documentos de ese dominio y, por decisión del dueño del repo, se
commitearon **los dos que sirven para cotizar** — el *EdgeConnect Hardware Reference* (17 MB,
el de las especificaciones eléctricas) y la guía de licenciamiento (0,8 MB). Los otros dos son
documentos de arquitectura y habrían sumado 21 MB permanentes al historial sin aportar a una
propuesta. **De 1 a 3 de 24 con copia local.** Verificado en Chromium: con sesión el PDF llega
como `application/pdf` con su firma `%PDF-`; sin sesión redirige al login, que es como debe
estar detrás del muro.

Los 21 restantes viven en los dominios que devuelven Akamai o agotan el tiempo. `LEEME.md`
recoge ahora la tabla por dominio, para que nadie vuelva a pedir los 24 de golpe.

### Pendiente 15: MikroTik 14/15 y Aruba 6/21, y un quinto estado (2026-09-03)

MikroTik se dejó leer sin resistencia —su sitio ya respondía al vigía— y cada ficha de
producto publica «Max power consumption» y el modo de alimentación. Aruba era la duda, y la
respuesta resultó **más matizada que «HPE es Akamai»**: de los tres dominios que usa su
manifiesto, `arubanetworking.hpe.com` (documentación técnica) **sí responde** y entregó el
*EdgeConnect Hardware Reference* completo, 170 páginas; `arubanetworks.com` devuelve Akamai y
`hpe.com/psnow` agota el tiempo. Medirlo por dominio en vez de dar el fabricante por perdido
es lo que abrió esta puerta.

**Dos distinciones que el campo no sabía decir:**

- **Varias entradas de alimentación no son doble fuente.** El RB5009 tiene *tres* (jack DC,
  PoE-IN y terminal de 2 pines) sobre **una sola fuente interna**: permite alimentar desde dos
  tomas distintas, que es información útil, pero marcarlo `true` sería prometer una redundancia
  de fuente que no existe. Va en `false` con la explicación en el texto. El único MikroTik de
  esta tanda con doble fuente real es el CCR2004-16G-2S+, que declara **2 ranuras de PSU**.
- **Quinto estado, `'no-aplica'`.** Las licencias CHR de MikroTik y el EdgeConnect virtual son
  software sobre un hipervisor: no tienen fuente ninguna. Dejarlos en «el catálogo no lo
  especifica» haría esperar un dato que no existe.

**Ni MikroTik ni HPE publican un consumo típico**: MikroTik da máximos («Max power
consumption» y «sin accesorios») y HPE un «Power Requirement». Como la ficha rotula
`psu.watts` como «Consumo típico», esas cifras van en el texto diciendo qué miden — el mismo
criterio que dejó fuera los 2.500 W del FortiGate 7081F, que eran capacidad por fuente.

**Un fallo propio, encontrado y corregido**: la primera aplicación insertó `redund`/`psu`
**dentro del array `skus`** de EC-S y EC-M, colgando la alimentación de una referencia de
pedido en vez del equipo. El objeto seguía siendo válido y el arranque no se quejaba; solo lo
delató contar la cobertura. Se revirtió, se rehízo anclando la inserción al `id`, y hay una
prueba nueva que fija que ningún SKU lleve esos campos. El linter cazó además un `psu`
duplicado en EC-S —`no-dupe-keys`, la regla que existe por el `{f:'hub',f:'hub'}` de la guía—
y los dos se fusionaron conservando lo que el catálogo ya decía.

Quedan sin dato el RB4011iGS+ sin RM (MikroTik no publica ficha propia de esa versión; la de
`rb4011igs_rm` es explícitamente del RM, y aplicarla habría sido el mismo error que el 70F) y
los 15 equipos AOS de Aruba —gateways 9000 y controladoras 7000—, que viven en los dominios
que sí bloquean.

### Pendiente 15: Fortinet de 6 a 56 de 58, y un cuarto estado que faltaba (2026-09-03)

Segunda tanda del mismo día, con el patrón ya probado: `WebSearch` localizó el nombre real de
las fichas —Fortinet usa **dos** convenciones, `fortigate-<serie>-series.pdf` y
`fortigate-fortiwifi-<serie>-series.pdf`, y cuál toca no se adivina—, un workflow probó las dos
por serie desde un ejecutor de Actions, y las 16 que existen se leyeron **página por página en
su versión renderizada**. 31 modelos nuevos con dato.

**Lo que apareció leyendo, y que ninguna búsqueda habría dado:**

- **`redund` necesitaba un cuarto estado.** El 80F y el 90G publican «Powered by up to 2
  External DC Power Adapters (**1 adapter included**)»: salen de fábrica con una fuente y
  admiten la segunda. `true` habría prometido algo que no viene en la caja y `false` habría
  negado una redundancia que el equipo sí soporta — las dos etiquetas mentían. `ficha.js` gana
  `'opcional'` («Opcional — admite una segunda fuente, no viene de serie»), por el mismo motivo
  por el que ya existía el tercer estado. Reparto final: 24 `true`, 4 `'opcional'`, 9 `false`.
- **«Doble fuente» no significa lo mismo en toda la línea.** El 200G, el 400G y el 700G traen
  las dos de serie pero **no se cambian en caliente**; el 900G, el 1000F, el 3000G y el 3500G
  sí. En una propuesta con SLA de disponibilidad eso no es un detalle.
- **El 3800G exige 200-240 V** y no arranca a 100 V como el resto de la línea. Es una condición
  de instalación que se descubre en obra si no está en la ficha.

**Y dos defectos propios, corregidos antes de desplegar**: la nota escribía «19,9 W» mientras
la fila de arriba pintaba «19.9 W» —dos separadores decimales en el mismo panel—, y «1.496 W»
era directamente ambiguo en un catálogo que declara el punto como decimal (se leería 1,496 W).
La prosa va ahora sin separador de millares, igual que la fila.

**Y esos 404 resultaron ser la pista, no el final.** Fortinet sirve las fichas nuevas en
`/assets/data-sheets/pdf/<archivo>` y las de la generación F antigua en
`/assets/data-sheets/<archivo>` — un subdirectorio de diferencia. Con la ruta corta bajaron 10
de 12 y entraron **19 modelos más**: toda la línea 1800F a 4800F. Justo por esto la sonda
reportaba los 404 en vez de darlos por buenos.

**Una trampa que conviene recordar**: `fortigate-70f-series.pdf` **no es la ficha del 70F**. Es
la del 71F —su portada lo dice y el 70F no aparece ni una sola vez en el documento—, así que
aplicarle esas cifras habría sido creerle al nombre del archivo en vez de a su contenido. El
70F se queda sin dato a propósito.

Quedan **2 de 58** sin dato: el 70F por lo anterior y el 200F porque su ficha da 404 en las dos
rutas. Las sondas se retiraron tras aplicar el dato; quedan publicadas las ramas
`fuente/fortinet-serie` y `fuente/fortinet-serie-f`.

### Fortinet sí se deja leer: `cps` a 56/58 y alimentación a 6/58 (2026-09-03)

El mismo día en que HPE y Huawei quedaron confirmados como pared de Akamai, Fortinet demostró
ser lo contrario: `.github/workflows/traer-fortinet-psu.yml` pidió cuatro documentos oficiales
desde un ejecutor de Actions y los cuatro respondieron **200 con contenido real**, sin rastro
de bloqueo. Eso convierte en dato verificado lo que esta misma lista tenía como «fragmentos de
búsqueda sin confirmar por lectura directa» — que era la única razón por la que Fortinet iba
0 de 58 en alimentación eléctrica pese a tener las URL ya localizadas.

Leído a mano y transcrito literal, tres modelos:

- **100F** — «the device has two power supplies that can be connected to different power
  sources». `redund: true`. El documento no publica consumo, así que `watts` se queda fuera.
- **7081F** — «up to six hot swappable 200-277V, 16A AC PSUs. The capacity of each PSU is
  2500W», más «You can add extra PSUs to provide redundancy».
- **7121F** — se cambia una fuente en caliente «as long as four PSUs are connected to power
  and operating normally».

**Un detalle que valía la lectura**: los 2.500 W del 7081F son la *capacidad de cada fuente*,
no el consumo del equipo — y `ficha.js` rotula `psu.watts` como «Consumo típico». Meterlos ahí
habría producido una cifra falsa con apariencia perfectamente correcta, en la pantalla que
alguien enseña a un cliente. Van en el texto, que es donde se puede decir qué miden.

**Y una corrección**: la tabla de pistas atribuía a los 60F/90G/91G un artículo que, leído de
verdad, trata de las series 100/101E y 200/201E — modelos que ni siquiera están en este
catálogo. Cita mal asignada, retirada. Del «hasta 8 fuentes» del 7121F tampoco hay rastro en
el documento citado, así que no se registró el número máximo.

**Y de paso cayó el pendiente 2 casi entero.** Los 5 modelos sin `cps` no estaban en el
Product Matrix, pero sí en las fichas por serie: `traer-fortinet-datasheets.yml` bajó las de
400F y 600F (URL confirmadas por búsqueda) y ahí estaba «New Sessions/Second (TCP)» — 500.000
para 400F/401F y 550.000 para el 600F. Pasaron por `npm run cps` sin un solo rechazo, con
`sess` (7,8 M y 8 M), `ips`, `ngfw`, `tp` y `vpn` casando todos. **53 → 56 de 58.**

Las URL de 100F y 200F se probaron siguiendo el patrón del sitio y devolvieron **404** — y eso
es exactamente lo que el workflow marcaba como «no confirmada»: se reportó y no se guardó nada,
en vez de dar por bueno un HTML con extensión `.pdf`. Esos dos siguen en `null`.

Esas mismas fichas traían la tabla «Dimensions and Power» completa, así que la alimentación
subió a 6 de 58: 400F (154,8 W medios, doble fuente AC 1+1), 401F (161,1 W, algo más por el
SSD) y 600F (169 W, dos fuentes de serie). Aquí `watts` **sí** es consumo — el documento
publica «AC Power Consumption (Average)», que es justo lo que la ficha rotula.

Los otros 52 modelos siguen en `undefined` («el catálogo no lo dice»), nunca en `false`.

Las dos sondas (`traer-fortinet-psu.yml` y `traer-fortinet-datasheets.yml`) se retiraron tras
dejar el dato aplicado, igual que las de Huawei y HPE: un workflow que ya cumplió su encargo
es un artefacto inerte, el error que tuvo `CISCO_EOL_MODELS`. **Lo que sí conviene recordar es
el patrón**, porque funciona y es repetible: localizar la URL con `WebSearch` (que sí opera en
este entorno, al revés que `WebFetch`), bajar el documento desde un ejecutor de Actions,
publicarlo en una rama de transporte, leerlo a mano —renderizado, nunca con extractor de
tablas— y aplicarlo con el importador que contrasta. Quedan publicadas las ramas
`fuente/fortinet-psu` y `fuente/fortinet-datasheets`; el proxy git de este entorno no deja
borrar ramas remotas.

### HPE también es Akamai, y Firecrawl no es la salida (2026-09-03)

Dos intentos de abrir por fin las fuentes de HPE, los dos cerrados con una medición en vez de
una suposición. Vale la pena leerlos antes de reintentar cualquiera de las dos vías.

**1. Firecrawl, descartado por política de egreso.** Se instaló su servidor MCP creyendo que
sus servidores leerían por nosotros lo que este entorno no alcanza. Falla — y no por la clave
(verificada: 35 caracteres, prefijo correcto, sin espacios, y no es la que se filtró) ni por
HPE. El servidor MCP corre **dentro** de este sandbox (`npx firecrawl-mcp`), así que sus
llamadas salen por el mismo proxy, que deniega el dominio de Firecrawl. Lo delató una URL de
control: `example.com` falló idéntico. El propio proxy lo confirma —
`connect_rejected · gateway answered 403 to CONNECT · api.firecrawl.dev:443` — y
`mcp.firecrawl.dev` y `firecrawl.dev` están igual. La configuración se queda en `.mcp.json`
(sin clave, solo `${FIRECRAWL_API_KEY}`) porque **sí sirve desde una máquina fuera de este
proxy**; desde aquí, no.

**2. `buy.hpe.com`, denegado por el propio HPE.** Se pidió desde un ejecutor de GitHub
Actions —que no pasa por el proxy de esta sesión, y que ya trajo Fortinet y Juniper sin
problema— con cabeceras de navegador completas. Respondió **403 con un "Access Denied" de
Akamai**, con `errors.edgesuite.net` en el cuerpo: la misma pared que Huawei, no un límite de
ritmo. Eso reencuadra el pendiente 3 entero — los 403/timeout que `npm run datasheets` ve
desde cualquier máquina no son mala suerte ni ráfaga excesiva, son esta misma defensa. No se
intentó nada para evadirla (ni el modo *stealth* de Firecrawl, que existe justo para eso):
es una decisión deliberada del fabricante, categoría distinta de un 403 de política de egreso,
y aquí se reporta, no se rodea.

La sonda (`traer-hpe-routers.yml`) se retiró tras dejar el hallazgo escrito, igual que las
tres de Huawei: un workflow que ya sabe que nunca va a producir dato es un artefacto inerte,
el mismo error que tuvo `CISCO_EOL_MODELS`. Quedó publicada la rama `fuente/hpe-routers` con
la respuesta de Akamai — el proxy git de este entorno no deja borrar ramas remotas, así que
se borra desde GitHub o desde una máquina con acceso.

### Pendiente 4, parcial: confirmación externa de que el sitio en vivo responde (2026-09-02)

El bloqueo documentado (`presales.up.railway.app` no se puede pedir desde este entorno de
edición) seguía siendo cierto la primera vez que se probó de nuevo:

```
curl https://presales.up.railway.app/salud
curl: (56) CONNECT tunnel failed, response 403
```

Mismo patrón que ya cerró varios pendientes de datos este mismo día: los ejecutores de GitHub
Actions no pasan por ese proxy. `.github/workflows/sonda-produccion.yml` pide `/salud` y
`/login` —las dos únicas rutas públicas, sin sesión— desde ahí. Primera corrida:

```json
[
  { "ruta": "/salud", "status": 200, "bytes": 41, "cuerpo": "{\"ok\":true,\"fabricantes\":7,\"modelos\":224}" },
  { "ruta": "/login", "status": 200, "bytes": 4230 }
]
```

Es una confirmación **distinta** a la que ya daba la API de Railway (que solo dice que el
contenedor arrancó): esta viene de pedirle el dominio público de verdad desde fuera, con DNS,
TLS y el edge de Railway de por medio. **No inicia sesión a propósito** — eso exigiría la
contraseña real de producción, que este workflow no tiene ni debe tener — así que confirma que
el sitio está vivo, no que cada pantalla funcione. Revisar la pantalla tocada tras un deploy
sigue siendo de una persona, exactamente como ya decía este pendiente.

### Dimensionador Nokia — pendiente 6, primera entrega: fabric 7220 IXR (2026-09-02)

Primera entrega del pendiente que el propio registro marcaba como «la pieza más grande de
esta lista»: un motor de sizing **distinto** al de los otros seis fabricantes, porque un
fabric de datacenter no se resuelve con «un equipo cumple un requerimiento» — se resuelve con
un LEAF y un SPINE, cada uno con su cantidad.

**Alcance, recortado a propósito**: de los 18 modelos Nokia del portal, esta entrega cubre los
4 de la línea **7220 IXR** (D1/D2L/D3L/D5) — la única con puertos de una sola velocidad, sin
modos de breakout, y que Nokia posiciona sin ambigüedad como fabric de datacenter (acceso,
leaf, spine). Los 14 restantes (7250 IXR de agregación/edge, 7750 SR de core IP-MPLS) se
dimensionan por capacidad y densidad de puertos de un único equipo — el motor de los otros
seis fabricantes, no el de fabric — y quedan como fase 2, documentados, no silenciados.

**El motor**: un diseño Clos de dos capas en malla completa (cada leaf conecta un puerto a
*cada* spine, para ECMP). A partir de servidores a conectar, velocidad de acceso y
sobresuscripción deseada: puertos de acceso necesarios → leafs necesarios → uplinks por leaf
→ spines necesarios (= uplinks por leaf) → spine con puertos suficientes para todos los
leafs. El D3L («Leaf / Spine compacto», puertos uniformes que sirven para lo uno o lo otro)
necesitó una segunda rama del motor: reparte su propio pool de puertos entre acceso y subida
en vez de sumar dos grupos separados.

Un caso queda deliberadamente sin resultado: acceso a 1 GbE (D1) no tiene con qué spine
conectar dentro de esta línea — sus uplinks son de 10 GbE y ningún otro modelo de la 7220 IXR
tiene puertos de spine a esa velocidad. Se reporta el hueco, no se inventa un intermedio.

Archivos nuevos: `legacyData/nokia.js` (los 4 modelos, puertos estructurados a partir del
mismo texto ya verificado en `indexPR.js`, sin inventar ni corregir ningún dato — solo
estructurado), `dimensionador-nokia-7220ixr.html`/`.js` (no reutiliza `js/ficha.js`, que
asume un único equipo elegible; sí reutiliza `js/bom.js` y `js/estado.js`). Verificado con el
servidor real en `NODE_ENV=production` y Chromium: tres escenarios (25 GbE, 100 GbE, 1 GbE
sin diseño posible), enlace desde el portal, pestaña BOM con 2 líneas. 129 pruebas.

### Investigado el pendiente 3 (Aruba): ejecutado por primera vez, y no se completó (2026-09-02)

Primera corrida real de `datasheets-aruba.yml`, que llevaba desde agosto marcado «resuelto vía
Actions» sin haberse disparado nunca — la marca era una expectativa razonable por el patrón
que sí funcionó con Fortinet, no una medición. Al correrlo de verdad:

- **HPE bloqueó la mayoría del lote**: de 24 documentos, 9 devolvieron 403, 12 agotaron el
  tiempo de espera y 2 resultaron ser páginas de aterrizaje en vez de un PDF directo. Solo
  **1 PDF** (`sd-wan-ordering-guide.pdf`, 123 KB) se descargó limpio. El vigía había leído sin
  problema la página de HPE que `FUENTES.aruba` registra — pero esa es una sola petición; pedir
  24 documentos distintos de HPE en la misma corrida topó con límites que una petición sola no
  revela. Bloqueo real del lado de HPE, no de este entorno.
- **Y aparte, el paso de abrir el PR falló por un motivo independiente**: este repositorio
  tiene desactivado el permiso de GitHub «Allow GitHub Actions to create pull requests»
  (Settings → Actions → General → Workflow permissions). No es algo que el workflow pueda
  resolver solo, y no se intentó rodear activando nada por cuenta propia — es una decisión de
  configuración del repositorio, no de este workflow.

La rama `datasheets/aruba` quedó publicada con el único PDF descargado; no vale la pena un PR
para un solo documento de bajo valor, así que no se abrió a mano. `PENDIENTES.md` deja de
marcar el pendiente 3 como resuelto — el importador está listo, el hallazgo de HPE bloqueando
un lote grande es nuevo y queda documentado, y sigue haciendo falta una persona con navegador
real, igual que Huawei.

### Pendiente 5 (Juniper SRX): la matriz oficial corrigió datos que la reconstrucción por búsqueda había adivinado mal (2026-09-02)

Mismo patrón que cerró el pendiente 2 de Fortinet: `.github/workflows/traer-juniper-matrix.yml`
trajo la «SRX Series and vSRX Performance and Features Matrix» a la rama de transporte
`fuente/juniper-srx-matrix` (los ejecutores de GitHub Actions no pasan por el proxy que
responde 403 a `juniper.net` en este entorno). El documento resultó ser de **agosto de 2020**
(pie de página «1000265-021-EN Aug 2020») — la fecha «2026-08» que llevaba el registro en
`FUENTES.juniper` era una suposición de cuando no se podía leer el documento, no una medición;
corregida.

Con el documento real en mano, la reconstrucción por búsqueda que llevaba meses en el catálogo
resultó acertada en unos campos y **equivocada en otros** — una serie internamente coherente
no garantiza ser la serie correcta, solo que es plausible:

- `fw`/`vpn`/`ips` de la línea SRX300 (300/320/340/345) ya estaban bien.
- `fwImix` de esa misma línea **no**: corregido de 600/600/1.100/1.500 a los 500/500/1.000/1.700
  Mbps reales, anclado por los tres campos anteriores ya coincidentes.
- El SRX1500 —documentado hasta hoy como «el único modelo con la fila completa»— tenía `vpn` y
  `sess` equivocados: 3.000 Mbps / 512.000 sesiones reconstruidos frente a los 1.300 Mbps /
  2.000.000 reales, anclados por `fw`/`fwImix`/`ips`/`atp` ya coincidentes.
- `sess` y `cps` de la línea SRX300 completa más el SRX1500 no existían en ninguna
  reconstrucción previa: los trae el documento y se aplicaron sin conflicto.

**El SRX380 queda a propósito sin tocar** en `fw`/`fwImix`/`vpn`: el documento también trae su
fila (10/4/3,5 Gbps, no los 20/6,5/4,4 ya guardados) pero de esos campos solo `ips` coincide —
un único anclaje, por debajo del doble que este catálogo exige antes de pisar un dato
existente. Corregirlo exigiría `--sin-contraste` bajo responsabilidad de quien decide, así que
queda documentado —en la cabecera de `juniper.js` y junto al modelo— para resolverse a
propósito en vez de colarse sin que nadie lo note.

Se intentó además traer las fichas individuales por modelo que la propia matriz enlaza (p.3,
SRX300 y SRX1500) para contrastar con una segunda fuente, pero sus URL de 2020 ya no resuelven
a un PDF (Juniper reorganizó su sitio desde entonces) — no se agregan a `FUENTES` sin una URL
vigente confirmada. 17 valores escritos con `npm run juniper -- --force` (nunca menos de 2
anclas por fila), verificado con el servidor real en `NODE_ENV=production` y Chromium contra
`/api/dimensionador/juniper`. 129 pruebas.

### Investigado el pendiente 14 (Huawei): no se cierra vía Actions, y ahora se sabe por qué (2026-09-02)

Tras cerrar el 2 y el 3 con el mismo truco (bajar el documento desde un ejecutor de GitHub
Actions, que no pasa por el proxy de este entorno), tocaba probar si Huawei se cerraba igual.
No se cierra, y la investigación deja documentado un motivo distinto y más duro que un 403 de
proxy — importa saberlo antes de que alguien reintente la misma vía.

Tres sondas sucesivas, cada una construida sobre lo que dejó la anterior:

1. **Alcance de red**: `e.huawei.com`, `support.huawei.com` e `info.support.huawei.com`
   responden **200** desde un ejecutor de Actions. La red sí llega, igual que a Fortinet.
2. **Contenido del HTML crudo**: un `fetch()` normal a `e.huawei.com` y `support.huawei.com`
   solo trae el cascarón vacío de una aplicación Vue/Nuxt (`<div id="__nuxt"></div>` sin nada
   dentro) — el catálogo real se carga por JavaScript después de arrancar, así que ni con red
   ni sin bloqueo hay dato que leer sin ejecutar ese JS.
3. **Navegador real (Playwright + Chromium)**: al renderizar de verdad, `e.huawei.com` y
   `support.huawei.com` devuelven un **"Access Denied" de Akamai** — el borde del propio
   Huawei bloqueando la huella de un navegador automatizado, no el proxy de este entorno ni
   una política de egreso. `info.support.huawei.com` sí renderiza, pero resultó ser el
   glosario de términos de Info-Finder (AAA, ACL, Antivirus…), no una base de ciclo de vida
   por modelo, y su propio texto confirma el login: *"Log in to obtain more information."*

No se intentó nada para evadir el bloqueo de Akamai (huellas de navegador falsas, proxies
residenciales, credenciales de Huawei): es una defensa deliberada del fabricante contra
automatización, categoría distinta de un 403 de política de egreso que sí es razonable
recorrer con Actions. Se reporta, no se rodea — el mismo principio que ya rige los 403 de este
entorno, aplicado también al borde de Huawei.

**Conclusión para quien retome el pendiente 14**: `npm run huawei` sigue siendo la herramienta
correcta y está lista; lo que falta es que una persona con navegador real (y sesión de Huawei
si hace falta el detalle de Info-Finder) copie las cifras a un CSV/XLSX, igual que antes de
esta investigación. Los tres workflows de sonda (`sonda-huawei.yml`, `explorar-huawei.yml`,
`renderizar-huawei.yml`) se retiraron tras dejar su hallazgo documentado aquí: dejarlos vivos
sin ningún dato que produzcan sería el mismo error que ya tuvo `CISCO_EOL_MODELS` de
`seedCatalog.js` — un artefacto inerte que no dice nada.

### `cps` de FortiGate: de 21 a 53 de 58 modelos (2026-09-02)

Pendiente 2, cerrado con el mismo hallazgo que ya había cerrado el 3 (los ejecutores de
GitHub Actions llegan a `fortinet.com` aunque este entorno no): `.github/workflows/
traer-fortinet-matrix.yml` bajó el Product Matrix real y lo publicó en la rama de transporte
`fuente/fortinet-product-matrix` — nunca `main` ni un PR, porque el PDF no es un activo de la
aplicación, solo material de trabajo que se trae con `git fetch` y se descarta después de
transcribirlo.

El documento se leyó página por página en su versión renderizada, nunca con un extractor
automático de tablas — es exactamente el mecanismo que este catálogo ya sufrió una vez (fila
desplazada = número plausible de otro equipo). Los 32 valores transcritos a un CSV pasaron
por `npm run cps`, que los contrastó contra el `sess` ya verificado del catálogo: pasaron los
32, sin un solo rechazo, lo que confirma que la lectura no se desplazó de fila. Donde el
documento publica un segundo valor con licencia Hyperscale (nota⁶: 2600F, 3000F/G, 3500F/G,
3800G, 4200F, 4400F, 4800F), se transcribió siempre el valor base.

Quedan 5 modelos en `null` (100F, 200F, 400F, 401F, 600F): no es un bloqueo de acceso, es que
el Product Matrix es un "Top Selling Models Matrix" — un subconjunto curado — y esos SKUs no
están en ninguna de sus páginas. Verificado con el servidor real en `NODE_ENV=production` (API
sirviendo los `cps` nuevos, sibling de SSD propagando en vivo, los 5 restantes en `null`,
dimensionador cargando sin errores en Chromium) antes de desplegar. 129 pruebas.

### El nombre de usuario ya no distingue mayúsculas ni espacios alrededor (2026-09-02)

Punto 13, cerrado a petición del dueño del repo tras el alta de usuarios: con cuentas
creadas por un administrador, la mayúscula que use quien las crea y la que use quien entra
ya no tenían por qué coincidir, y eso lo volvía un problema real y no solo áspero.

`usuarios.normalizarUsuario(s)` — minúsculas, recortado por los bordes, nunca el espacio
interior — es ahora la forma canónica: `mismoUsuario()` (el login) normaliza los dos lados
antes de comparar, y `crear()` guarda el usuario ya normalizado y comprueba duplicados sobre
esa misma forma, así que «JMartinez» y «jmartinez» son la misma cuenta tanto para entrar como
para darse de alta. El campo `nombre` (el que se muestra) no se toca: conserva la
capitalización tal como se escribió, porque nunca se usa para autenticar. No hay migración
de datos — el único usuario ya existente (`presales`) ya estaba en minúsculas.

6 pruebas nuevas o reescritas, incluida la que antes fijaba a propósito el comportamiento
contrario: ahora fija el nuevo, con el mismo espíritu de que un cambio de autenticación sea
deliberado y quede escrito.

### Fases 2 y 3 del plan de sincronismo: el catálogo dice de dónde sale y avisa cuando cambia (2026-09-02)

**El problema medido**: el catálogo se verifica contra documentos que los fabricantes
actualizan sin avisar, y esa procedencia vivía en comentarios de cabecera — invisible para la
aplicación, para cualquier comprobación automática y para quien está a punto de citar una
cifra delante de un cliente.

- **`legacyData/fuentes.js`** estructura esa información transcrita de cada cabecera, sin
  inventar nada. Donde la cabecera no da fecha (MikroTik y Aruba), queda en `null` y se
  declara: **una fuente sin fecha no es una fuente reciente**, el mismo tercer estado que
  protege `redund`. Se proyecta en `/api/fuentes`, el portal la pinta por fabricante y el
  arranque avisa de lo que pasa de seis meses o no tiene fecha.
- **`npm run catalogo`** generaliza a los seis catálogos lo que solo hacían `cps --check` y
  `juniper --check`. Los precios se cuentan sobre `cotizadorCatalog.js`: contarlos sobre los
  `MODELS` daba «Fortinet 0/58 sin cotizar» justo del único fabricante con lista firmada.
- **La IA propone con esquema y `npm run propuesta` aplica con anclaje.** La respuesta salía
  de una expresión regular sobre texto libre; ahora va con `output_config.format`. Y el
  importador escribe sobre `legacyData/` para que lo revisable sea un diff de git, aceptando
  solo lo que ancla: *si la IA se equivoca sobre lo que el catálogo dice hoy, no hay razón
  para creerle lo que dice que debería decir*. Las altas se reportan, nunca se aplican solas.
- **`npm run huawei`** cierra el pendiente 14 por el lado de la herramienta, con modo `--eol`
  para cargar los boletines con su fecha real.
- **`npm run vigia`** compara el SHA-256 de cada fuente y el workflow semanal abre un issue
  cuando algo cambia o no se pudo leer. **Un documento inalcanzable no es un documento sin
  cambios**, y el informe los distingue.

De 76 pruebas a 113.

### Alta de usuarios: la contraseña la genera el servidor, el primer acceso queda encerrado (2026-09-02)

Petición del dueño del repo. La decisión que quedaba abierta era cómo llega la primera
contraseña a la persona nueva; se resolvió con la primera opción que el propio pendiente ya
apuntaba: **el servidor la genera y la muestra una sola vez**, en vez de un enlace de alta
con caducidad (más superficie: página nueva, tokens, expiración, y nada que este catálogo ya
necesitara para otra cosa).

- **`usuarios.crear({ usuario, nombre, rol })`** valida (usuario 3-60 caracteres sin espacios
  ni control, nombre no vacío, rol conocido, sin duplicados exactos — sin tocar la
  normalización, que sigue siendo el punto 13 aparte), genera una contraseña de 24 caracteres
  en un alfabeto sin `0/O/1/l/I` (se puede leer en voz alta sin ambigüedad) y devuelve
  `{ usuario, passwordTemporal }`. La cuenta nace con `debeCambiar: true`.
- **`debeCambiar` no es un aviso, es un candado.** A diferencia de `desdeSemilla` (blando: el
  admin migrado puede seguir trabajando con la contraseña compartida), un middleware nuevo en
  `server.js` —justo detrás del muro de sesión, antes de `exige()`— bloquea cualquier
  pantalla que no sea `/cuenta` mientras `debeCambiar` siga en `true`: 403 explicando por qué
  en la API, redirect a `/cuenta?m=forzado` en la navegación. `cambiarPassword()` lo libera
  en el mismo momento en que ya libera `desdeSemilla`.
- **El panel `/usuarios`** tiene el formulario de alta, el revelado de la clave con botón de
  copiar (con reserva seleccionable por si el portapapeles falla), y una insignia «cambio
  pendiente» en la lista para las cuentas que aún no completaron su primer acceso.

Verificado de extremo a extremo en Chromium contra un servidor con `NODE_ENV=production`:
alta de un usuario, cierre de sesión, entrada con la clave temporal, intento de llegar al
portal rebotado a `/cuenta`, cambio de clave, y segunda entrada con acceso normal — sin un
solo error de consola propio de la app. 14 pruebas nuevas de `usuarios.crear()` más 2 de
extremo a extremo, 127 en total.

### `omniroute` fuera: tenía la producción parada desde el 1 de septiembre (2026-09-02)

Retirado con autorización expresa del dueño del repo, que fue quien lo había añadido. El
commit `187a4dd` («Instalar Skill omniroute en presales») metió `omniroute: ^1.0.0` en
`package.json` y **tumbó dos despliegues seguidos, por dos causas distintas**:

- `e7192063` (1-sep): entró sin tocar `package-lock.json`, y `npm ci` falla cerrado cuando
  los dos no coinciden. Murió en `BUILD_IMAGE`.
- `d7d0c445` (2-sep), ya con el lockfile sincronizado: `npm install` murió con **código 139,
  una segmentation fault**, dentro del `postinstall` del propio paquete, al recompilar
  `better-sqlite3` para linux-x64. Eso no se arregla desde este repositorio.

Durante esos dos días producción siguió sirviendo el contenedor del 28 de agosto y **ningún
cambio podía desplegarse**. Nadie se enteró hasta el día siguiente, que es justamente el
agujero que cierra la Fase 1.

Nada del repositorio lo importaba (`grep -rn omniroute` solo lo encontraba en
`package.json`). Al quitarlo el árbol vuelve de 560 a 283 paquetes, `npm audit` de 5 avisos
moderados a 2, y los paquetes con script de instalación de 6 a 2 (`sqlite3` y `fsevents`,
que en Linux no hace nada).

**Lo que conviene recordar**: el `omniroute` de npm no es una skill de Claude Code. Las
skills son carpetas con un `SKILL.md` dentro de `.claude/skills/` y no tocan `package.json`,
así que no pueden romper un despliegue. El paquete de npm con ese nombre es otra cosa —
«Unified AI router with 352 providers, desktop, PWA», una aplicación Next.js/Electron de un
tercero (`diegosouza.pw`)—, y muy probablemente no era lo que se buscaba.

### Fase 1 del plan de sincronismo: el ciclo de despliegue se cierra solo (2026-09-02)

Hasta ahora, entre `git push` y producción no había ninguna comprobación: Railway construía
cada push a `main` aunque las pruebas fallaran, y el servicio no tenía healthcheck, así que
un contenedor que muriera al arrancar sustituía al que funcionaba. La prueba de que eso no
era teórico la dio el propio repositorio dos días antes: el despliegue del 1 de septiembre
murió en `BUILD_IMAGE` y nadie se enteró hasta el día siguiente.

- **`.github/workflows/verificar.yml`** corre en cada push y cada PR: `npm ci`, lint, las 85
  pruebas, y un arranque de verdad con `NODE_ENV=production` que exige ver `[seed]`, la línea
  de `listen` y un `/salud` que responda `ok`. La auditoría de dependencias va informativa,
  no bloqueante: la Fase 0 dejó el árbol en avisos que hoy no se pueden cerrar sin saltar a
  Sequelize 7, y bloquear por eso pararía cada push por algo que no tiene arreglo todavía.
- **Railway espera a esas comprobaciones** (`checkSuites`) y usa **`/salud`** como
  `healthcheckPath`. La ruta es pública a propósito —el healthcheck no tiene sesión, y detrás
  del muro recibiría un 302 que Railway leería como «sano»— y cuenta el catálogo en vez de
  devolver un `{ok:true}` fijo, que estaría igual de verde con la base sin sembrar. Devuelve
  503 si la base está vacía o no responde, que es lo que retira el contenedor del balanceo.
- **Dependabot** abre PR semanales de parches y menores, agrupados, que pasan por el mismo
  workflow. Las mayores se revisan a mano: en este repositorio ya costaron caro dos de ellas.

### Fase 0 del plan de sincronismo: la sincronización dejaba de fallar abierta (2026-09-02)

Tres defensas que parecían serlo y no lo eran, encontradas al auditar el módulo de
sincronización con `insecure-defaults` y `vibesec` antes de tocar nada:

- **El permiso `sync` no se exigía en ninguna ruta.** Estaba en `ROLES` desde que hubo roles
  y `grep exige('sync')` devolvía cero. Ahora va delante del router de `/api/sync/*`, y al
  montarlo apareció un segundo fallo: `exige` miraba `req.path`, que Express recorta al
  prefijo de montaje, así que en vez del 403 la API redirigía al portal y el navegador veía
  un 200. Lo cazó la prueba nueva que arranca el servidor real.
- **Sin `ANTHROPIC_API_KEY` el servicio devolvía propuestas inventadas** con apariencia
  legítima — un «FortiGate 9000F» con precio. Retirado; ahora responde 503 explicando que
  falta la clave, el mismo fallo cerrado que aplica `AUTH_PASSWORD`.
- **El tipo del adjunto se tomaba del mimetype que declara el navegador.** Ahora lo decide
  la firma del contenido (`services/firmaArchivo.js`), con el mismo criterio que
  `descargar-datasheets.js` ya aplicaba a lo que baja; lo que no es PDF, XLSX ni texto recibe
  415.

Dependencias: `xlsx` pasa al espejo mantenido `@e965/xlsx` 0.20.3 (el de npm quedó
abandonado con una vulnerabilidad alta sin arreglo; mismo `dist/xlsx.full.min.js`, verificado
exportando un BOM a Excel en Chromium), `cors` fuera de `package.json` (nadie lo requería) y
`sqlite3` a la 6, que dejó de arrastrar la cadena de build con el `tar` crítico. `npm audit`
pasa de 10 avisos a 2 moderados (`sequelize` por `uuid`, sin arreglo sin saltar a Sequelize
7). Ocho pruebas nuevas, 84 en total.

### Alimentación eléctrica en la ficha: doble fuente y sus características (2026-08-28)

Petición del dueño del repo. Antes de escribir código se auditaron los seis catálogos
buscando qué dato eléctrico ya existía —y apareció uno que no se sabía que estaba: Cisco ya
traía `redund: true/false` al 100 % de sus 21 modelos, mostrado dentro de «Características
del equipo». Los otros cinco fabricantes no tenían nada estructurado, pero sí frases sueltas
ya publicadas («fuentes 1+1 · 205.8 W típicos», «doble fuente 350 W», «PSU y almacenamiento
redundantes») escondidas en el campo `ports`/`ifaces` de texto libre.

**La regla que sostiene todo esto**: `redund` es de tres estados, no dos. `true` y `false` son
hechos verificados (Cisco los tiene los 21); `undefined` es «el catálogo no lo dice», y
tratarlo como `false` habría inventado un dato negativo — exactamente lo que este catálogo
evita en todo lo demás. `FICHA.seccionAlimentacion(m)` en `ficha.js` centraliza esa distinción
una sola vez para las seis páginas, en vez de que cada una la reimplemente con su propio
riesgo de leer `undefined` como «no».

Se transcribieron a `redund`/`psu` estructurados los datos que el catálogo ya tenía publicados
en prosa — nunca se dedujo nada del tamaño o la gama del equipo. Cobertura resultante: Cisco
21/21 (ya existía), Huawei 17/40 (serie NE8000 y AR8140, con vatios), MikroTik 3/15, Aruba
2/21, Juniper 1/12 SRX, Fortinet 0/58 — el Product Matrix no publica esta cifra. El hueco
restante queda como pendiente 15, con la aclaración de que no es un simple bloqueo de egreso:
ninguna de las fuentes que este catálogo ya usa trae consumo eléctrico por modelo.

Verificado: 8 pruebas nuevas en `test/ficha-alimentacion.test.js` (76 en total), conducido en
Chromium contra un servidor con `NODE_ENV=production` en las seis páginas — sección presente,
sin fila duplicada en Cisco, sin errores de consola, y el aviso «el catálogo no lo especifica»
en vez de un «No» falso donde el dato no existe.

### El dimensionador de Fortinet mostraba siempre el mismo equipo (2026-08-27)

Reportado por el dueño del repo y **reproducido en el navegador antes de tocar nada**. Eran
dos defectos distintos y solo uno estaba en la página de Fortinet.

**El trinquete de la selección** (`public/js/ficha.js`, las seis páginas a la vez). La regla
era «conservar la selección mientras ese equipo siga cumpliendo». Como cumplir es
capacidad ≥ requerimiento, un equipo grande cumple para *todo* requerimiento menor: se
elegía un 7121F a 20 Gbps, se bajaba a 50 Mbps y seguía el 7121F con el 30G como
recomendado. La selección solo subía. Lo grave no era la elección manual sino que no se
distinguía de la **heredada** —la que el propio módulo había dejado en el render anterior—,
así que el recomendado solo salía en el primer render de la página: en un barrido limpio de
caudal el equipo ya aparecía desalineado en la primera lectura. Corregido distinguiendo
deliberada de heredada; lo heredado sigue siempre al recomendado, lo deliberado se marca en
pantalla y tiene botón «Volver al recomendado».

**El BOM no avisaba de quedarse descolgado.** Con un caudal que ningún modelo cubre, el
veredicto decía «Sin candidato» y la pestaña de BOM conservaba intacta la cotización del
último equipo que sí cumplía — exportable a Excel sin ninguna señal. No se vacía, porque ahí
se puede querer cotizar cualquier equipo a mano, pero ahora declara el desajuste. Igual
cuando el modelo cotizado no es el elegido en el dimensionamiento.

**El motor NO estaba mal, y conviene que quede escrito.** Se comprobó eje por eje con cargas
limpias: 100 usuarios x 3 Mbps no mueven un requerimiento de 500 Mbps, pero 2.000 usuarios lo
llevan de 650 Mbps a 7,8 Gbps; el perfil IoT (20.000 dispositivos a 0,05 Mbps con 100
sesiones) hace que mande la tabla de sesiones, exactamente como predicen los comentarios del
código; y bajar la vida media de sesión a 2 s multiplica por 15 las sesiones nuevas por
segundo. La relación entre ancho de banda, usuarios, sesiones y cps estaba bien modelada —
lo que la ocultaba era que el equipo mostrado no cambiaba.

También se quitó un doble render del BOM por cada pulsación de tecla (se sincronizaba una vez
con el recomendado y acto seguido con el elegido). Siete pruebas nuevas en
`test/ficha-seleccion.test.js` fijan la regla: 66 casos en total.



- **Limpieza de agosto de 2026: cuatro puntos cerrados, y tres fallos reales que aparecieron
  al cerrarlos.** La limpieza en sí era cosmética; lo que valió fue lo que destapó.
  - **El dimensionador Huawei ya no se llama `-v3_1`.** Es `dimensionador-huawei-netengine`,
    y la ruta vieja **redirige conservando el querystring** — sin eso, un enlace compartido
    habría llegado a la página correcta con los parámetros por defecto, que es peor que un
    404 porque no se nota. La clave de `localStorage` conserva el nombre viejo a propósito:
    es la identidad bajo la que la gente ya tiene escenarios guardados.
  - **`CISCO_EOL_MODELS` fuera, y el mecanismo ahora avisa.** Listaba la serie ISR 4000 que
    la Fase 2 había retirado: llevaba meses sin marcar nada y nadie se enteró, porque un
    conjunto inerte se comporta igual que uno que funciona. `seedDimensionadorModels` avisa
    cuando una entrada no casa con ningún modelo. La razón que lo mantenía vivo («volvería a
    aplicar vía `cotizadorCatalog`») era además falsa: esa ruta no consulta estos conjuntos.
  - **`npm run verificar`: lint y 59 pruebas, sin dependencias nuevas salvo ESLint.** Las
    pruebas cubren lo que ya falló —la migración de usuarios que se rehacía en cada lectura e
    invalidaba la sesión recién creada, la regla única de fin de venta, el orden de columnas,
    el casado de nombres entre catálogos, el parser del importador Juniper— y la coherencia
    del catálogo (IMIX nunca por encima de paquetes grandes, ATP nunca por encima de IPS,
    ningún precio inventado donde no hay lista). El lint no es un manual de estilo: cada
    regla corresponde a un fallo que este repo tuvo (`no-undef` habría cazado el
    `BOM is not defined`; `no-use-before-define`, el TDZ de `capDe`).
  - **La tabla de skills de `CLAUDE.md` decía 8 y había 27**, y dos de ellas
    (`data-viz-charts`, `web-page-builder`) describían el stack de `chikisdtv` —React, Vite,
    Tailwind, Recharts— que aquí no existe. Una skill que miente sobre el stack se dispara
    sola y empuja el trabajo hacia una arquitectura que este proyecto no tiene: retiradas.

  **Los tres fallos que destapó**, ninguno visible mirando el código:
  1. **El cotizador Cisco descartaba en silencio un campo del formulario.** «Módulos NIM
     adicionales a cotizar» se leía, disparaba el repintado y no llegaba al BOM: escribías 3
     y salía sin ellos. Lo marcó el linter como variable sin usar. Ahora sale una línea con
     la cantidad, **sin SKU y sin precio** —el catálogo trae el número de slots, no una lista
     de NIM por modelo— porque inventar una referencia es lo que este catálogo tiene prohibido.
  2. **El orden por columna se equivocaba con los miles repetidos.** `1,400,000` se leía como
     1.400: el patrón capturaba un solo grupo de miles. Tres órdenes de magnitud y hacia
     abajo, así que el equipo más grande de una tabla aparecía entre los más pequeños, y la
     celda se veía perfectamente bien. Lo encontró una prueba.
  3. **Cinco páginas tenían una rama muerta de exportación a CSV**, escondida tras un
     `typeof exportCSV === 'function'` que nunca era cierto desde que `js/bom.js` centralizó
     la exportación a Excel. Y el diagrama de la guía tenía una clave duplicada
     (`{f:'hub',f:'hub',...}`) que silenciosamente descartaba una de las dos.

- **`npm run juniper`: el importador de la matriz SRX ya existe** (`scripts/importar-juniper.js`).
  Completar el catálogo Juniper era transcribir 96 números a mano, que es exactamente donde se
  cuela una fila desplazada: una cifra suelta siempre parece plausible, el resto de su fila no.
  El importador acepta CSV/TSV/XLSX, reconoce las columnas por su cabecera, resuelve Gbps
  frente a Mbps sin que nadie multiplique por mil a ojo, y **solo se cree una fila si al menos
  dos de sus columnas casan con lo que el catálogo ya trae verificado y ninguna lo contradice**.
  Con ese doble anclaje, las casillas en `null` de esa misma fila se pueden dar por buenas.
  Probado extremo a extremo: fila desplazada rechazada con el motivo, unidades deducidas del
  propio contraste, escritura sobre el catálogo verificada (`--dry`, `--force`,
  `--force-partial`, `--sin-contraste`) y el parser de números con 13 casos. Los cuatro
  modelos que hoy solo tienen `fw` no llegan al anclaje y se apartan a propósito. Falta el
  dato, no la herramienta: la matriz sigue bloqueada por `juniper.net`.
- **El router de cliente: medido y descartado, con el problema real arreglado.** El pendiente
  pedía navegación sin recarga. Antes de construirlo se cronometró: una navegación completa
  cuesta **25-95 ms**, así que un router habría ahorrado casi nada a cambio de reescribir las
  ocho páginas (todas declaran `const $` en el ámbito global y colisionarían al compartirlo).
  Lo que sí costaba 12,5 s era la hoja de Google Fonts bloqueando el render. Corregido en
  `js/fuentes.js`: **DOM listo en 31 ms en vez de 12.529**. El router queda descartado por
  medición, no por pereza.
- **El cotizador ya recibe equipos del dimensionador** — botón «Enviar al cotizador» en las
  seis páginas de sizing, con casado tolerante de nombres entre los dos catálogos y aviso
  honesto cuando el equipo no está (normalmente porque está fuera de venta).
- **De documentos sueltos a aplicación** — la aplicación nunca fue estática (servidor, API,
  base de datos, sesión), pero se comportaba como un juego de documentos: recargar perdía el
  trabajo y no había forma de pasarle un dimensionamiento a un compañero. Ahora el escenario
  viaja en la URL y sobrevive a la recarga (`js/estado.js`), el BOM del cotizador se recupera
  con aviso y botón de «empezar una nueva», y las tablas del portal se ordenan por columna
  (`js/tabla.js`). Sin reescritura: se integró con el motor existente en vez de sustituirlo.
- **Dimensionador Juniper** — sexta herramienta de sizing, con dos plataformas separadas:
  SRX por capa de inspección y Session Smart Router para SD-WAN. El principio que la hace
  útil es el mismo que salió de la auditoría FortiGate: la cifra de portada (firewall con
  paquetes grandes) queda fuera de la escala y nunca elige, y un modelo sin cifra en la capa
  efectiva se descarta explicando por qué en vez de colarse con la de otra capa. En el
  SRX380 la diferencia es 20 Gbps de portada frente a 2 con IPS.
- **Usuarios y roles** — el acceso pasa de credencial compartida a identidad: `usuarios.js`
  como almacén, sesión que dice quién es, `exige('permiso')` para autorizar y panel
  `/usuarios`. La migración es automática: el usuario que ya existía es ahora el
  administrador, sin contraseña nueva que comunicar. **Fallo encontrado al construirlo y
  corregido**: la migración generaba el hash con un salt aleatorio en cada lectura, y como la
  clave de firma de la sesión se deriva de ese hash, se podía iniciar sesión y en la petición
  siguiente el servidor la desconocía. Se persiste una sola vez.
- **Arista retirado por completo** — catálogo del portal, cotizador, guía de diseño, página,
  navegación, fabricante en la base y proyecciones. Sin referencias residuales.
- **Juniper de 10 a 22 modelos y Nokia de 8 a 18**, desde datasheets oficiales: línea SRX de
  sucursal con sus cifras de IPsec, generación SRX 2024, Session Smart Router, fabric 7220 IXR
  sobre SR Linux, 7250 IXR-X y 7750 SR-1x.
- **Skills de los repos hermanos instaladas** — 20 skills de `chikisdtv` en `.claude/skills/`,
  con las de seguridad (`vibesec`, `insecure-defaults`, `sharp-edges`, `semgrep`, `codeql`,
  `differential-review`) usadas para revisar y construir el módulo de acceso.
- **Sesiones nuevas por segundo como tercer eje** (`f63dcdf`) y **`npm run cps`** (`2da77c7`).
- **Fuera de venta se muestra pero no se recomienda** (`0074dc2`) — regla única en `ficha.js`,
  con toda la línea ASR 1000 marcada tras encontrarla ofreciéndose como vigente.
- **Plataforma en el dimensionador de Cisco** y **MikroTik en el cotizador y la guía**
  (`6a4d4aa`).
