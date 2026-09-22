# Rediseño del módulo Fortinet sobre la arquitectura de Aruba

**2026-09-16.** Encargado por el dueño del repo: *«rediseña el módulo de este fabricante basado
en la arquitectura y las consideraciones de diseño de la página de Aruba… ten en cuenta que el
dimensionamiento de los equipos de Fortinet es diferente».*

Esa advertencia es la tesis del documento. `docs/portabilidad-aruba.md` ya separó **tres capas
que no viajan juntas**; esto la aplica a Fortinet, caso por caso y con las cifras medidas en el
commit desplegado.

**Nota sobre la validación.** El dueño pidió entrar a
`https://presales.up.railway.app/dimensionador-aruba-edgeconnect.html`. Ese dominio está
**bloqueado por la política de egreso de este entorno** (el túnel del proxy se queda sin
respuesta) y no se rodea. Se usó el equivalente que este repositorio ya estableció al cerrar el
pendiente 4: `DATABASE_PATH` va sin definir en producción, la base es efímera y se resiembra
desde `legacyData/` en cada despliegue, así que **arrancar el mismo commit en local renderiza
exactamente los mismos datos**. Las dos páginas se condujeron en Chromium y de ahí salen las
cifras de abajo.

---

## Lo que NO se porta, y por qué

Aruba se dimensiona contra un **rango de caudal WAN publicado** por modelo. Fortinet publica
**cinco cifras de throughput que miden rutas de procesamiento distintas**. Confundirlas es el
error de preventa que este repositorio ya documentó con un factor de 14,3x.

| Bloque de Aruba | ¿A Fortinet? | Motivo |
|---|---|---|
| Tier de licencia por caudal (bw20…bw2g) | **No** | Los SKU de Fortinet llevan el equipo dentro: `LICENSES` va por modelo, no por ancho de banda. Portarlo sería una tabla de precios que no corresponde a cómo se compra. |
| Boost como pool del fabric en bloques de 100 Mbps | **No** | No existe en el portafolio Fortinet. |
| Rango WAN publicado (`wanMin`/`wanMax`) | **No** | Fortinet no publica un piso: quedarse por debajo no es sobredimensionar. Son cinco capas, no un rango. |
| Auditoría de puertos del chasis | **No** | `ifaces` es texto libre («4x 10 GE SFP+, 18x GE RJ45…»), no un conteo estructurado. Contarlo sería inventar una densidad — la misma razón por la que los chasis modulares de Nokia se apartan. |

Y lo propio de Fortinet **se queda intacto**, porque es lo que hace correcto a este
dimensionador:

- **Cinco capas con piso, no recargo.** `PISO_POR_FUNCION` + `capaEfectiva()`: activar antivirus
  no encarece un 8 % la cifra de firewall, hace que aplique la de Threat Protection.
- **Tres ejes.** `ejesDe()` decide cuál manda entre capa de throughput, `sess` (memoria) y `cps`
  (CPU). Aruba tiene throughput + APs + clientes: no son el mismo problema.
- **El derate de SSL sobre la capacidad**, nunca sobre el requerimiento.
  *(Retirado el 2026-09-22 — ver la etapa 3 al final de este documento: el Product Matrix
  publica SSL Inspection Throughput por modelo y el derate era el P0 técnico del informe.)*
- **El overlay como segundo techo**: `min(capa, IPsec / fracción del overlay)`.

---

## Capa 2 — Comercial: universal, y en Fortinet estaba vacía

Medido contando llamadas al módulo compartido:

| | Aruba | Fortinet |
|---|---:|---:|
| Funciones de `BOM.*` en uso | **20** | **6** |

Lo que falta ya está construido y probado; no hace falta un dato nuevo:

- **`BOM.agregarRef` / `refsExtra`** — el hallazgo más caro. `GET /api/referencias/fortinet/FortiGate 120G`
  devuelve **71 referencias de pedido**; el EC-M de Aruba devuelve 2. **Fortinet es el fabricante
  con los datos más ricos del catálogo y su página era la única que no podía cotizar ni uno.**
- **`BOM.tco`** — y encaja sin adaptación: `opexTermino` suma el precio *tal como viene* y `anios`
  solo deriva el anual, que es justo la semántica de `tierPrice(licTier, termYrs)`. Se declara
  `opex: ['Licencias FortiGuard', 'Soporte']`; `Equipo` y `Servicios opcionales` (FortiConverter
  es un pago único) quedan en CAPEX.
- **`BOM.simuladorDescuento`**, **`BOM.perfiles/consolidar`** (multi-sede) e **identidad de
  propuesta** (`nombreCliente`, `refProyecto`).

**Las reglas de agregación las declara la página, como en Aruba.** En Fortinet **todo multiplica
por sedes**: en HA cada nodo paga su propia suscripción FortiGuard y su propio FortiCare, así que
no hay nada análogo al pool de Boost ni al Orchestrator único. Declarar `agregadas`/`unicas`
vacías no es un olvido: es el comportamiento correcto, y se escribe para que se vea que se
decidió.

---

## La escalera: de 2 pasos a 4

Hoy Fortinet tiene **2 pasos y 2 paneles de salida**, y el equipo, el término, el bundle y el
soporte viven en **otra pestaña** — así que la cotización no está donde se dimensiona. Y el paso 1
mezcla dos preguntas distintas: *qué capa aplica* (arquitectura) y *cuánto tráfico hay*
(capacidad).

| | Paso | Qué agrupa |
|---|---|---|
| 1 | **Plataforma y rol** | Segmento, rol SD-WAN, HA. Acota antes que el caudal — lo que Cisco ya hace con la plataforma. |
| 2 | **Capa de inspección** | La capa, las funciones que elevan el piso, el derate SSL *(hoy: el eje SSL con cifra oficial — etapa 3)*. Lo propio de Fortinet, junto. |
| 3 | **Tráfico y capacidad** | Caudal, usuarios, Mbps/usuario, sesiones, vida de sesión, crecimiento. |
| 4 | **Equipo y cotización** | Modelo, cantidad, término, bundle FortiGuard, FortiCare. Traído desde la pestaña de BOM. |

**Cambian los agrupamientos, no los `id` de los controles**, así que los enlaces compartidos ya
pegados en chats siguen siendo válidos — y `ESTADO.vincular()` avisaría si no lo fueran.

---

## Capa 1 — Escenario: el Multi-Underlay Builder sí aplica

`docs/portabilidad-aruba.md` marca a Fortinet como **el caso más claro** del Builder, y la razón
es concreta: hoy `pctOverlay` es una **fracción que el usuario estima con un deslizador**. Con los
enlaces declarados esa fracción **se calcula**: el tráfico que va por MPLS/overlay contra el que
sale por breakout local deja de ser una opinión.

Lo que el Builder aporta aquí y no en Aruba: alimenta directamente el segundo techo
`min(capa, IPsec / fracción)`, que es el cálculo que decide si una sucursal con salida directa a
SaaS necesita subir de gama.

Lo que **no** se trae del Builder de Aruba: la auditoría de puertos (ver arriba) y el medio del
puerto (`SFP 1G`/`SFP+ 10G`), que en Aruba sirve para elegir ópticas y aquí no tiene catálogo que
lo respalde.

---

## Riesgos declarados

- **Reordenar la escalera puede romper `npm run catalogo`** si un `id` declarado en
  `ESTADO.vincular()` desaparece. Es justo lo que esa comprobación existe para cazar, y correrá.
- **Sustituir `pctOverlay` cambia el motor.** Se contrasta antes/después: el mismo escenario
  expresado de las dos formas tiene que recomendar el mismo equipo, o la diferencia se explica.
- **Declarar mal el OPEX daría un TCO equivocado en silencio.** Por eso se verificó la semántica
  de `BOM.tco` leyéndola, no suponiéndola, antes de elegir las categorías.

## Verificación

1. `npm run verificar` — lint y las pruebas, más las nuevas del TCO y las reglas de agregación.
2. `npm run catalogo` — la sección PANTALLAS cruza los campos declarados con los `id=` del HTML.
3. **Conducir la página en Chromium**, que es donde este repositorio ha encontrado todas sus
   regresiones: añadir una referencia al BOM, guardar un perfil, ver el TCO.
4. **Contraste antes/después del Builder**: mismo escenario, misma recomendación.
5. `npm run pantallas` — 16/16.

---

# Etapa 2 — El Multi-Underlay Builder, entregado (2026-09-16)

## Qué se sustituyó

El par «un caudal único + un deslizador de *% por el overlay*» por **filas de enlaces WAN
declarados**. El deslizador era una **estimación a ojo justo del número que fija el segundo
techo** del motor: `capacidad efectiva = min(capa de inspección, IPsec / fracción del overlay)`.
Ahora esa fracción **sale de los enlaces**: se declara qué transporta cada uno y si su tráfico va
cifrado al fabric, y la fracción es aritmética sobre datos declarados en vez de una opinión
arrastrando un control.

## La fila de FortiGate es más corta que la de Aruba, a propósito

| Campo | Aruba | Fortinet | Por qué |
|---|---|---|---|
| `tipo` (transporte) | sí | **sí** | Decide la familia y el default de overlay. |
| `medio` (RJ-45 / SFP) | sí | **no** | Alimenta la auditoría de puertos y la elección de ópticas. **Este catálogo no trae ópticas de Fortinet**, así que el campo produciría un dato inventado — el vicio del `noAplica` deducido. |
| `down` / `up` | sí | **solo `down`** | El motor de FortiGate consume **un** caudal. Un campo que nadie lee es peor que uno ausente: invita a creer que se tuvo en cuenta. |
| `overlay` | no | **sí** | En EdgeConnect el appliance se dimensiona por el agregado del sitio; en FortiGate la fracción cifrada **es** el segundo techo. Es el campo propio de este fabricante. |

## Por qué el riesgo es bajo, y cómo se demostró

**El motor no cambia.** El builder solo *calcula* los dos números que `render()` ya leía —`#bw`
(con `#unit` fijo en Mbps) y `#pctOverlay`—, que pasan a ser **espejos ocultos**. Por
construcción, un escenario equivalente tiene que dar el mismo equipo.

Eso hay que probarlo, no declararlo: **`scripts/contraste-fortinet.js`** conduce en Chromium los
mismos ocho escenarios medidos sobre la página anterior (commit `2147588`) y exige la misma
recomendación, el mismo requerimiento y el mismo número de candidatos. Los ocho cubren los dos
techos que el motor puede aplicar y los tres roles, porque el rol es lo que activa el segundo.

| Escenario | Antes | Después |
|---|---|---|
| sin SD-WAN, 500 Mbps | FortiGate 60F · 650 Mbps · 55 cand. | **idéntico** |
| sin SD-WAN, 2,5 Gbps | FortiGate 200G · 3,3 Gbps · 39 cand. | **idéntico** |
| spoke 100 % overlay, 500 Mbps | FortiGate 60F · 689 Mbps · 55 cand. | **idéntico** |
| spoke 70 % overlay, 500 Mbps | FortiGate 60F · 677 Mbps · 55 cand. | **idéntico** |
| spoke 30 % overlay, 2,5 Gbps | FortiGate 200G · 3,3 Gbps · 39 cand. | **idéntico** |
| spoke 100 % overlay, 2,5 Gbps | FortiGate 200G · 3,4 Gbps · 39 cand. | **idéntico** |
| hub 100 % overlay, 10 Gbps | FortiGate 200G · 4,8 Gbps · 39 cand. | **idéntico** |
| hub 50 % overlay, 10 Gbps | FortiGate 200G · 4,7 Gbps · 39 cand. | **idéntico** |

**La línea base va embebida en el script y no en un archivo aparte** a propósito: es un hecho
histórico medido sobre el commit anterior, no un dato que se regenere — un fichero regenerable se
regeneraría justo cuando el contraste fallara.

**Se comprobó que el contraste detecta, no solo que pasa.** Saboteando `actualizarEspejos()` para
que el caudal contara únicamente los enlaces del overlay, los tres escenarios de dos filas y tres
migraciones se pusieron en rojo con la cifra concreta (`FortiGate 30G` donde debía salir un 60F,
`bw=350` donde debía ser 500). Los escenarios de una sola fila **no** lo detectan, y eso también
es información: un contraste de un solo enlace no discrimina este fallo.

## Enlaces ya compartidos

`migrarEstadoV1()` convierte `?bw=…&unit=…&pctOverlay=…` en las filas equivalentes avisando por
consola, con la misma regla que Aruba: **un enlace viejo que aterriza con los valores por defecto
es peor que un 404, porque no se nota.** Con una fracción intermedia hacen falta **dos** filas
—la cifrada y la de breakout— para conservarla, que es exactamente lo que el escenario v1
describía. `PARAMS_V1` vive en una sola constante porque la usan dos cosas distintas: la
migración y `ESTADO.vincular({migrados})`, que es lo que evita que esos parámetros se denuncien
como desconocidos.

**Los perfiles guardados antes del builder se migran igual**, al aplicarlos: viven en
`localStorage` con `bw`/`unit`/`pctOverlay` y sin `wanLinksData`, así que aplicarlos tal cual
habría dejado el escenario sin caudal y **en silencio** — la misma pérdida muda que tuvo la clave
por página de `presales-bom-refs`.

## Lo que se aprendió del refactor de Aruba y aquí no se repitió

El 2026-09-13 el builder de Aruba retiró `#bw` y dejó `pantallas.yml` en rojo cuatro días porque
el verificador rellenaba `#bw` en las ocho páginas. Aquí el gancho `caudal(page)` de Fortinet
entró **en el mismo commit** que el builder, con su propio `extraAcciones` que conduce el caso de
dos enlaces y exige que la barra agregada declare la fracción cifrada. Se comprobó que detecta:
apagando esa línea, `npm run pantallas` da 15/16 nombrando el fallo.

**No hay un gancho compartido entre Aruba y Fortinet**, aunque los dos se llamen «builder»: las
filas no tienen los mismos campos, y un gancho común tendría que rellenar controles que en una de
las dos no existen — justo el fallo que el gancho existe para evitar.

---

# Etapa 3 — El informe de validación técnica, aplicado (2026-09-22)

Documento de partida: **«Informe final de validación técnica y plan de mejora del módulo
Fortinet Presales»** (22-sep-2026), que consolida dos auditorías, clasifica sus hallazgos
en P0 técnico, P0 comercial, P1 arquitectónico y P2 de experiencia, y cierra con veinte
pruebas de aceptación (AT-01 a AT-20) y un dictamen de **NO-GO** para cotización vinculante
hasta resolver los P0.

Lo primero que hay que decir del informe es que **no se implementó literalmente, y él mismo
pide que no se haga**: su sección 4 es una matriz de «incorporar / reformular / excluir» en
la que once de sus diecisiete propuestas se marcan para excluir o reformular porque son
constantes sin respaldo. Aquí no se aplicó ninguno de los factores que manda excluir —0,55 y
0,45 para SSL, 0,95 para SD-WAN, 0,90 para SIP, 0,70 para proxy, 0,95 para logging, 0,85 por
nodo en HA activo-activo, 0,95 por política DDoS, 15 % por VDOM— ni los pisos de serie (60F
como mínimo de SD-WAN, pisos fijos para OSPF/BGP). Multiplicar por ellos habría sido inventar
precisión, que es el mismo vicio que el catálogo persigue con los SKU.

## P0 técnico · la inspección SSL es un eje, no un castigo porcentual

Esta página estimaba la inspección SSL como `tp × 0,65`. El Product Matrix **publica la cifra
por modelo**, y el cociente entre las dos mediciones no es constante:

| modelo | Threat Protection | SSL oficial | cociente | lo que daba el derate |
|---|---|---|---|---|
| FG-30G | 500 Mbps | 400 Mbps | 0,80 | 325 Mbps — **subdimensiona** |
| FG-40F | 600 Mbps | **310 Mbps** | 0,52 | 390 Mbps — **sobrestima el equipo** |
| FG-50G | 1.100 Mbps | 1.300 Mbps | 1,18 | 715 Mbps — subdimensiona 1,8× |
| FG-70G | 1.300 Mbps | 1.400 Mbps | 1,08 | 845 Mbps — subdimensiona |
| FG-90G | 2.200 Mbps | 2.600 Mbps | 1,18 | 1.430 Mbps — subdimensiona 1,8× |

Un factor único **no es conservador: se equivoca en las dos direcciones**, y en el 40F es el
error caro —promete 390 Mbps donde el equipo da 310—. En tres de los cinco el equipo aguanta
**más** SSL que Threat Protection, así que ningún derate sobre `tp` puede describirlos.

`ssl` entra en el catálogo con **9 de 58 modelos** (5 base + 4 variantes con SSD, que heredan
por la regla ya documentada en `fortinet.js`). Los otros 49 quedan en `null` **explícito**, y
`null` no es cero ni «no tiene límite»: es *«el catálogo no trae la cifra»*. Cuando el
escenario pide ese eje, el motor **aparta ese modelo con su motivo** y pide PoC — nunca lo
sustituye por la cifra de otra capa. La pantalla lo dice de tres formas: el banner cuenta la
cobertura (`SSL 9/58`), el panel de ejes nombra cuántos se apartaron, y el veredicto sin
candidato distingue «falta el dato» de «falta equipo» — porque lo segundo manda a cotizar un
chasis que nadie necesita.

**Las cifras están transcritas del informe, que cita el documento y su edición, no leídas del
PDF**: `fortinet.com` responde 403 al proxy de egreso de este entorno. Eso está declarado en
la cabecera de `legacyData/fortinet.js` y en `fuentes.js`, ni más ni menos.

## El motor pasa de una cifra derivada a ocho ejes independientes

El motor anterior reducía el modelo a **una** capacidad efectiva —`min(capa, IPsec/fracción)`,
con el derate SSL dentro— y la comparaba contra **un** requerimiento. Ahora cada eje
—firewall, IPsec, IPS, NGFW, Threat Protection, SSL, sesiones concurrentes y sesiones nuevas
por segundo— lleva su demanda, su capacidad oficial y su utilización, y el máximo define el
cuello de botella.

**La reformulación es exactamente equivalente para lo que no toca**, y eso se demostró en vez
de afirmarse: `min(capa, IPsec/fracción) ≥ req` es lo mismo que pedir `req ≤ capa` **y**
`req × fracción ≤ IPsec`, que son dos ejes independientes — y además es la fórmula del propio
informe (`U_ipsec = T_overlay / C_ipsec`). `scripts/contrastes/fortinet.js`, cuya línea base se
midió en septiembre **antes** de este cambio, pasa sus ocho escenarios y sus seis migraciones
de enlace v1 sin una discrepancia.

**Tres estados por eje, no dos.** `ok`, `excede` y `sinDato`, que dice algo del *catálogo* y
no del equipo. Y dos durezas, que evitan errores opuestos: un eje `duro` sin dato **aparta**
(SSL, porque pedirlo es declarar que ESA es la métrica que manda); uno `blando` se **declara
ausente** sin apartar (`cps` en el 100F y el 200F — apartar dos modelos vigentes por un hueco
del «Top Selling Models Matrix» los escondería de una propuesta por un defecto del documento,
no del equipo).

## Crecimiento y techo de utilización son dos políticas, no una

El crecimiento infla la **demanda**; el techo limita la **utilización** admisible de una cifra
medida en laboratorio. Mezclarlas en un solo «margen» hace imposible responder *«¿a qué
utilización queda este equipo?»*. El techo va **por defecto en 100 %** —«no se declara techo
más allá del crecimiento»— y no en 70 %: poner uno por defecto habría cambiado en silencio la
recomendación de todos los escenarios ya compartidos por enlace. Es una política visible,
versionada y elegible por criticidad, no un factor escondido.

## AT-11 · la simultaneidad se declara, nunca se asume

`max(WAN, inter-VLAN)` solo vale si alguien declara que los picos no coinciden; en cualquier
otro caso **se suma**. El defecto es la suma porque es la lectura conservadora y porque un
`max` automático cambia de familia sin que nadie lo haya decidido: el ejemplo del informe
—600 Mbps de Internet + 300 de inter-VLAN con 25 % de crecimiento— da 750 u 1.125 Mbps según
el supuesto, y entre esas dos cifras el equipo pasa de 70G a 90G.

## P0 comercial · tres cobros que no correspondían

`FortinetReglas.lineasComerciales` sustituye la construcción a mano de las filas del BOM. De
esa construcción salían los tres:

1. **FortiCare Premium cobrado dos veces (AT-04).** Los tres bundles lo incluyen, y el BOM
   añadía *siempre* una línea de soporte encima. Ahora no se cotiza aparte, y se explica por
   qué en vez de que la línea desaparezca sin más. **Elite** se representa como *mejora* sobre
   el Premium incluido —no como un segundo contrato completo— y se declara que el price list
   publica su SKU como servicio completo, no como diferencial: eso lo confirma el distribuidor.
   Un nivel **por debajo** del incluido tampoco se cotiza, y se dice.
2. **FortiConverter duplicado (AT-05).** Solo Enterprise lo trae. Con ese bundle elegido, la
   línea a la carta no se añade aunque se pida; fuera de Enterprise entra **solo** por
   selección explícita, nunca por defecto.
3. **SKU con el marcador `DD` (AT-06).** En el price list `DD` es el marcador del patrón, no
   un código pedible: una cotización con `-DD` no se pasa a un distribuidor. El término
   resuelve el sufijo real (`-12` / `-36` / `-60`), y donde no hay equivalencia declarada, la
   línea **bloquea** en vez de dejar el marcador puesto. Los dos SKU de la pestaña de licencias
   que siguen mostrando `DD` se rotulan ahora **«patrón»**, que es lo único para lo que valen.

**El bundle mínimo se deriva de las funciones y bloquea lo que está por debajo (AT-03).** DLP e
IoT Security solo existen en Enterprise: elegir UTP con ellos marcados no es una advertencia,
es una cotización que no se puede pedir. Se deriva del `incluye` de cada bundle —estructurado
en `legacyData`— y no de una tabla paralela función→bundle, porque dos sitios con el mismo dato
se desincronizan y el que se quedaría atrás es el que decide si una cotización es válida.

**SD-WAN (AT-07, AT-08).** Secure SD-WAN se configura en cualquier FortiGate sin licencia: tener
varios enlaces **no obliga a Enterprise**, y esa suposición se retiró. Lo que sí se licencia son
los servicios avanzados —Underlay & Application Monitoring, Overlay Orchestration, conector
FortiSASE—, que ahora se piden por casilla y derivan su línea. **Van con `sku: null` a
propósito**: este repositorio no ha leído esos SKU del Ordering Guide, así que la línea no es
pedible y la puerta de exportación lo bloquea. Es preferible a inventar un código con pinta de
válido, que es el fallo del `FortiGate 2000F` que este catálogo ya sufrió.

**HA (AT-17).** Regla general: una licencia por nodo. La excepción de FortiGuard único en
activo-pasivo existe, pero depende del modelo y de la versión de FortiOS y este catálogo no
trae esa elegibilidad: se **declara** en vez de ofrecerse sin evidencia.

## La puerta de exportación

Exportar a Excel, copiar y enviar al cotizador se habilitan **solo** cuando no hay bloqueos
P0, cada línea lleva SKU exacto y la lista de precios está vigente (AT-16: una fuente vencida
bloquea, y el umbral —6 meses— va declarado, igual que `SEMANAS_TOLERADAS` en el vigía). No es
un aviso pasivo: los botones se deshabilitan de verdad.

**El override existe a propósito, y con motivo obligatorio.** A veces hay que mandar un borrador
técnico antes de tener el SKU del Ordering Guide, y una puerta sin salida se rodea copiando la
tabla a mano — que es peor, porque entonces el documento sale **sin** la advertencia. Así sale
con ella: el motivo, la fecha y el usuario viajan estampados dentro del documento exportado,
que se declara a sí mismo como borrador.

**Sobre la huella del escenario (AT-15):** se publica en la puerta y viaja dentro del documento,
así que quien recibe un BOM por correo puede cruzarlo contra el enlace del escenario. La
comparación escenario↔BOM se mantiene como **invariante, no como detector**: `BOM.sincronizar`
repinta el BOM en cada render, así que en esta página no pueden divergir. Llamarla «detector de
escenarios obsoletos» sería venderla como algo que en esta arquitectura no puede pasar — la
clase de comprobación inerte que este repositorio ya pagó con `CISCO_EOL_MODELS`.

## P2 · la experiencia, con la jerarquía de Aruba

- **Banner de estado de datos** bajo el hero: fuente técnica, fecha, vigencia de la lista de
  precios, región y **cobertura contada sobre el catálogo servido** (`precio 54/58 · cps 56/58
  · SSL 9/58`). No es un texto fijo: el día que alguien complete `ssl` en el Product Matrix,
  el banner sube solo.
- **Pestañas** renombradas a *Dimensionar · Lista de materiales · Licencias y software ·
  Catálogo · Fuentes*, por paridad con Aruba. Los `data-tab` no cambian, así que los enlaces
  ya compartidos siguen valiendo — pero el caso de contraste `cotizador-bom` sí seleccionaba
  la pestaña por su **rótulo visible** y se rompió; se corrigió para usar el atributo, que es
  el contrato.
- **Barra de acciones en una fila**: cliente, referencia, copiar enlace, limpiar y el estado
  guardado. Antes estaban en tres sitios distintos.
- **Cuatro pasos plegables** (`<details>` nativo: plegar no necesita JavaScript, que la CSP
  prohíbe en línea, y conserva teclado y lector de pantalla gratis) con **chip de validación**
  por paso. Los chips salen de la misma regla que decide el cálculo o la cotización, no de una
  segunda comprobación escrita aparte; un paso que **bloquea** se despliega solo.
- **Resumen fijo y compacto**: equipo, cuello de botella con su porcentaje y las dos
  alternativas **como botones**. Compacto a propósito: un sticky más alto que la ventana no se
  pega a nada, y la ficha completa mide varias pantallas. Las alternativas son los vecinos por
  capacidad en la lista ordenada, y se prueban de un clic — una alternativa que hay que buscar
  en un desplegable de 39 entradas no es una alternativa.
- **Panel de utilización por eje** con los tres estados (el `sinDato` va rayado, nunca en cero)
  y el pie que nombra el cuello de botella y los apartados. Las barras viven **en un solo
  sitio**: se retiraron los `medidores` que la ficha pintaba, que mostraban los mismos ejes dos
  veces en la misma pantalla y decían menos.
- **Gráfico**: métrica del eje elegible (por defecto «la que dimensiona», no la cifra de
  portada), filtro de fuera de venta, y el elegido más sus dos alternativas etiquetados. Los 58
  puntos siguen dibujándose: esconder el catálogo sería peor que no etiquetarlo.

## Verificación

| qué | dónde | cuánto |
|---|---|---|
| AT-01…AT-20 sobre las reglas puras | `test/fortinet-reglas.test.js` | 31 casos |
| Las mismas reglas **conducidas en la pantalla** | `test/e2e/e2e-fortinet-auditoria.js` | 38 afirmaciones |
| Que el multieje **no cambió** lo que no debía | `scripts/contrastes/fortinet.js` | 8 escenarios + 6 migraciones v1, sin discrepancias |
| Que el eje SSL decide lo que debe | `scripts/contrastes/fortinet-ssl.js` | 7 escenarios + 2 comprobaciones de mensaje |
| Que la pantalla entera no explota | `npm run pantallas` | 16/16 |

**Los dos contrastes se comprobaron saboteando, no solo pasando.** Cambiando la dureza del eje
SSL de `dura` a `blanda` —que es la «simplificación» plausible que devolvería el defecto—,
`fortinet-ssl` da **6 discrepancias** y la peor es exactamente el fallo que este cambio vino a
cerrar: a 4 Gbps con inspección SSL pasa de «sin candidato» a recomendar un **FortiGate 200G**,
una propuesta corta por un orden de magnitud. Los dos escenarios de control **sin** SSL se
quedan en verde, que es lo que prueba que el caso aísla el eje y no mide el motor entero.

## Lo que sigue abierto, y por qué

- **49 modelos sin cifra de inspección SSL.** Es el hueco más caro que queda: con ese eje
  pedido, compiten 9 de 58. Se cierra leyendo la columna del Product Matrix desde una máquina
  con acceso y pasándola por `npm run cps`, que ya contrasta contra `sess` antes de aceptar
  una fila. `npm run catalogo` lo cuenta desde hoy.
- **Los SKU de los tres servicios SD-WAN** (Ordering Guide de FortiGuard). Mientras no estén,
  pedir uno bloquea la exportación comercial, que es el comportamiento correcto.
- **La elegibilidad de FortiGuard único en HA activo-pasivo** por modelo y versión de FortiOS.
- **Escala del plano de control** (rutas BGP/OSPF, vecinos, VRF, VDOM, túneles máximos) como
  *hard constraints*. El informe lo pide (P1) y la Maximum Values Table lo publica, pero este
  catálogo no la trae: pedir esos datos en el formulario sin poder contrastarlos contra un
  límite por modelo daría controles que no hacen nada, que es peor que su ausencia. Entra
  cuando entre el dato.
