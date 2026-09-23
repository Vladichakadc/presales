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

---

# Etapa 4 — La corrección del dueño, y la paridad con Aruba (2026-09-22, tarde)

Seis peticiones en un mensaje, y la primera corrige a la etapa anterior.

## 1 · «Sí hay evidencia que existe las imágenes de la parte trasera» — y la había

La entrega de la mañana afirmó, en el commit, en `CLAUDE.md`, en `PENDIENTES.md` y en una
prueba e2e, que **Fortinet no publica vista trasera**. Era falso.

**Cómo se llegó al error.** Se abrieron los 28 datasheets por serie, se extrajo la foto de
**portada** de cada uno y se comprobó que las imágenes de las páginas 3 y 5 eran idénticas en
los 28 (gráficos de marketing). De ahí se concluyó «no hay trasera». El fallo no fue de
lectura sino de **alcance**: nunca se miraron las otras ocho páginas.

**Dónde estaba.** La **página 7** de los 28 documentos es la página «Hardware», con el
diagrama de panel y sus llamadas numeradas. Cuatro de ellos rotulan las caras literalmente
—`Front Panel` / `Rear Panel`: 400F, 400G, 700G y 900G— y uno, el 400F, publica **tres**
figuras: frontal, trasera AC y trasera DC. Una búsqueda de la palabra «rear» sobre el texto
de los PDF lo habría encontrado en treinta segundos.

Y es **mejor** que la portada: el diagrama de panel es el equivalente exacto del
*Front View* / *Rear View* del *Hardware Reference* de HPE con el que se construyó la tarjeta
de Aruba, mientras que la portada es un render comercial. Así que las portadas se retiraron y
las sustituyen los paneles: **54 de 58 modelos con las dos caras**, 57 ficheros y 2,6 MB.

### Cómo se decidió qué cara es cada una

Solo 4 de 28 documentos lo rotulan. Los otros 24 se resolvieron con un **ancla tomada de esos
cuatro**: en ellos, la cara rotulada trasera es exactamente la que lleva la entrada de
alimentación, las fuentes, los ventiladores o los SSD. Ese es el criterio, y es contrastable
leyendo el texto que el propio dibujo incrusta (`AC LINE`, `PWR1/PWR2`, `FAN1..5`, `SSD1/2`).

**No se dedujo del orden en la página, que no es constante**: el 120G y el 90G publican la
trasera **primero**. Un `figuras[0] = frontal` habría puesto la cara de alimentación como
portada de dos modelos sin que nadie lo notara.

**Y en los ocho equipos de sobremesa no hay lectura automática posible**: los rótulos de su
panel son **trazos vectoriales, no texto** (comprobado: `get_text()` sobre el marco del 60F
devuelve cadena vacía). Ahí la tabla de caras se escribió **a mano, mirando las 68 figuras
una por una**, y va transcrita con esa declaración dentro de `_procedencia`.

### Los tres casos que no encajan en la regla, declarados

- **400F y 900G publican dos traseras** (AC y DC). Se sirve la **AC**, que es la
  configuración por defecto, y el pie dice que existe la otra.
- **El 80F se queda sin frontal.** Su datasheet publica una sola figura del 80F/81F y es la
  cara de conectores; las dos que sí traen frontal son de las variantes **DSL** y **PoE**,
  que son otro producto. Servirle aquella habría sido la figura de otro equipo. `ficha.js`
  se generalizó para pintar una tarjeta con **una sola cara**, la que haya: exigir `front`
  habría dejado a ese modelo sin figura teniendo una oficial.
- **Cuatro modelos siguen sin ninguna figura**: 100F y 200F (su datasheet por serie no está
  en la URL que sigue el patrón del resto — 404 reportado, no dado por bueno) y los chasis
  7081F y 7121F (sus *System Guide* no son datasheets de serie). Muestran el aviso honesto.

### Qué unidad dibuja cada figura

Se leyó el rótulo del chasis en el propio dibujo. A diferencia de la portada —que retrataba
con frecuencia la variante con SSD: la serie 1000F retrataba un 1001F— los diagramas dibujan
casi siempre el **modelo base**. Las excepciones son el **400G** (dibuja un 401G) y el
**700G** (un 701G), y van declaradas en el pie. El caso 70F/71F sigue siendo el mismo que la
cabecera de `fortinet.js` documenta para las cifras, y sigue dicho en el pie.

## 2 · Los pasos 1 a 3 contra la §8 del informe

Contraste campo a campo con la tabla «Especificación del formulario Dimensionar».

| Paso | Campo del informe | Estado | Nota |
|---|---|---|---|
| **1** | Rol | ✔ `#rolSeg` | Sin SD-WAN / spoke / hub |
| | Segmento | ✔ `#segSeg` | Sucursal / campus / DC |
| | HA | ✔ `#chkHa` | Con la nota de que A-P no suma capacidad |
| | Lifecycle | ✔ | Por dos vías: `#tipoTx` decide si un EOL puede recomendarse, y `#chkVerEol` filtra el gráfico (§7 del informe) |
| | Sitio | ✔ `#nombreCliente` · `#refProyecto` | En la barra de acciones, no en el paso |
| | Appliance o VM | ✖ **declarado** | Este catálogo no trae modelos FortiGate-VM. Un selector con una sola opción es un control que no hace nada |
| | Región | ✖ **declarado** | Una sola price list (AMER). Un selector de región que no cambia ningún precio invita a creer que se tuvo en cuenta |
| | Rack/PSU/SSD/VDOM/FortiOS/AP/switches | ✖ | Avanzados. PSU sí está, en la ficha (`FICHA.seccionAlimentacion`) |
| **2** | SSL deep inspection | ✔ `#chkSsl` | Eje propio con cifra oficial (etapa 3) |
| | DLP, IoT | ✔ `#chkIotDlp` | Y fija el bundle mínimo |
| | Sandbox | ✔ `#chkSandbox` | Declarado como fuera de banda: no eleva capa |
| | Porcentaje FW/IPS/NGFW/TP | ✖ **declarado** | El informe pide una **mezcla porcentual** por capa. Este motor elige **una** capa efectiva y toma la más profunda entre la elegida y las que obligan las funciones. Repartir el caudal por capas exigiría una mezcla que el Product Matrix no publica, y sus propias reglas de interacción admiten que las clases se solapan y no se suman |
| | Proxy o flow | ✖ **declarado** | Su derate está entre los once que el informe pide excluir por no tener constante publicada |
| | Excepciones TLS, OT, CASB | ✖ | No están en `FUNCIONES`. Las excepciones TLS son el hueco más defendible de los tres |
| **3** | Downstream | ✔ builder WAN | Fila `{tipo, down, overlay}` |
| | Inter-VLAN + simultaneidad | ✔ `#interVlan` · `#chkNoConcurrente` | AT-11 |
| | Growth | ✔ `#head` | |
| | Utilization ceiling | ✔ `#techoUtil` | Política separada del crecimiento |
| | Sesiones | ✔ `#users` × `#sesUser`, con `#sessNeed` como anulación | |
| | CPS | ✔ derivado de `#vidaSes` | |
| | Vida de sesión | ✔ `#vidaSes` | El informe lo pone en «avanzados»; aquí es obligatorio porque de él sale el eje CPS |
| | Upstream | ✖ **declarado** | El motor consume un solo caudal. Un campo que nadie lee es peor que uno ausente |
| | IMIX, NAT, VPN users, SLA probes | ✖ | Avanzados sin dato de catálogo detrás |
| | Túneles, rutas, vecinos | ✖ **pendiente F4** | La *Maximum Values Table* los publica; este catálogo no la trae. Pedirlos sin poder contrastarlos daría controles que no hacen nada |

**Conclusión: los tres pasos coinciden con el informe en todo lo que este catálogo puede
respaldar.** Las nueve divergencias son deliberadas y cada una tiene su motivo escrito; siete
de ellas se cierran con un dato, no con código.

## 3 · «No incluir» en los dos combos comerciales

`#licBundle` y `#careLevel` ganan la opción. Habilita dos cotizaciones legítimas que antes no
se podían armar: **solo hardware** (ampliar un parque que ya tiene sus suscripciones vigentes)
y **equipo separado de servicios** para negociarlos por vías distintas.

**Avisa, no bloquea.** Excluir el bundle teniendo funciones de inspección pedidas produce una
cotización que no alcanza para el escenario descrito, y eso se **declara** — «la cotización
cubre el equipo, no el escenario» — en vez de cerrar la puerta de exportación. Bloquearlo
dejaría sin salida a quien cotiza solo hardware, y entonces la tabla se copia a mano y **la
advertencia se pierde**: el mismo razonamiento por el que el override existe con motivo
obligatorio. Lo que sigue bloqueando es un bundle **real** por debajo del mínimo (UTP con
DLP/IoT): eso no es una exclusión, es una cotización que no se puede pedir.

**Dos cosas que no son simétricas y se dicen distinto:**
- Sin bundle, **FortiCare vuelve a ser línea propia**. La razón por la que no se cotizaba
  (AT-04: los tres bundles traen Premium) desaparece con el bundle. Si se hubiera mantenido
  la omisión, la cotización no llevaría **nada** de soporte sin decirlo.
- Excluir el soporte **con** un bundle puesto no pierde cobertura y se dice así; **sin**
  bundle, el equipo va sin RMA ni actualizaciones de FortiOS, y eso no puede callarse.

**El fallo que costó entenderlo, porque es el peor modo posible.** La primera versión
reventaba: `BUNDLES` no tiene clave `none`, así que `BUNDLES[bundle].n` lanzaba dentro de
`renderBom` y, como la excepción abortaba **antes** de `$('bomBody').innerHTML = html`, la
lista de materiales se quedaba con el contenido **anterior**. En pantalla eso se lee como «el
combo no hace nada», no como «la página ha fallado» — y el contenido obsoleto es una cifra
que se pone delante de un cliente. Medido: $2.747,70 → $1.525,60 (sin bundle) → $1.093 (solo
hardware).

## 4 · El paso 4 sigue al equipo elegido en la calculadora

`llevarABom()` no soltaba el pestillo manual de `BOM.sincronizar`. Tocar una vez el modelo
del paso 4 dejaba los dos desplegables desincronizados **para siempre y sin forma de volver**.
Elegir en la calculadora es una elección posterior y más explícita sobre el mismo asunto, así
que ahora suelta el pestillo. La distinción «elegido a mano / heredado» sigue intacta: el
desplegable del paso 4 cotiza cualquier equipo a propósito, y `BOM.avisoDesvio` lo declara.

## 5 · Fuera el «Resumen de sizing»

No lo tiene Aruba y todo lo que decía está ya —y mejor— en el panel sticky (equipo, cuello de
botella, utilización), en las barras por eje y en el veredicto. Con él se fueron
`ejeQueLimita` y dos variables que solo existían para alimentarlo.

## 6 · Las referencias de pedido van a la lista de materiales

Vivían dentro de la ficha, en la pestaña de cálculo, que es donde se decide **qué equipo** —
no qué se pide. Ahora están donde Aruba las tiene: al final de la pestaña de lista de
materiales, en una sección `#skuPanel` titulada **«Añadir a la lista de materiales»**, con el
mismo orden (lista → precio neto y TCO → perfiles multi-sede → añadir).

El contenido lo sigue pintando `ficha.js`: se le añadió `refsEn` (el contenedor externo donde
pintarlas) y `refsTitulo` (para suprimir el `h3` interno cuando el contenedor ya titula). Con
`refsEn` la ficha **deja de emitir su div interno**, porque dos elementos con el mismo id
harían que `getElementById` devolviera el primero del documento y la tabla se pintara en el
sitio equivocado según el orden del marcado — un fallo que no se ve hasta que alguien
reordena una sección. Duplicar el buscador, los chips y el botón «Añadir» en esta página
habría sido la sexta copia de `llevarABom`.

## Verificación de la etapa 4

- **470 unitarios**, con cinco nuevos (AT-21…AT-25) sobre «no incluir» y once sobre el mapa
  de figuras, incluida la afirmación de que los cuatro datasheets que rotulan las caras dan
  modelo con las dos.
- **16/16 pantallas** y **4/4 contrastes sin discrepancias** — incluido `fortinet`, cuya
  línea base se midió **antes** del rediseño: la prueba de que nada de esto movió el
  dimensionamiento.
- **10/10 baterías e2e**, tras **invertir** la aserción que afirmaba el hueco inexistente.
  Una prueba que afirma un hueco que no existe es peor que no tenerla: bloquea el arreglo y
  da la falsa sensación de estar cubierto.
- Conducido en Chromium: conmutador frontal/trasera con la figura trasera cargando de verdad
  (`naturalWidth` 1599), las 385 referencias del equipo pintadas en la sección nueva, y el
  orden de secciones idéntico al de Aruba.

---

# Etapa 5 — El formulario, reconstruido sobre lo que de verdad dimensiona (2026-09-22)

Encargo del dueño: revisar el dimensionador **como arquitecto senior**, dejar solo las
variables que dimensionan SD-WAN y NGFW, retirar el tipo de transacción «que no es válido
técnicamente», validar sesiones, cantidad de VPN y usuarios concurrentes, y quitar los campos
que no aportan valor al diseño.

## Tres bajas

**`#tipoTx` — tipo de transacción.** Compra nueva, renovación, co-term, ampliación. Ninguna de
las cinco cambia un solo Mbps que el equipo tenga que procesar: es una **decisión comercial
disfrazada de entrada técnica**, en el primer paso de un formulario de ingeniería. Se
comprobó antes de retirarla que no alimentaba el motor — un `grep` da cuatro usos: el
escuchador que repinta, el campo del enlace compartido, una línea del texto exportado y una
mención en el tooltip del paso 1. Cero en el cálculo. El ciclo de vida, que era el argumento
para tenerla, ya lo cubren dos cosas mejores: `FICHA.rango()` nunca recomienda un equipo fuera
de venta, y `#chkVerEol` filtra el gráfico.

**`#modoSeg` — enlace único / agregado.** Dos controles para una sola pregunta. El rol ya
dice si el equipo es un concentrador, y el código tenía que **forzar `agg` a mano** cada vez
que alguien elegía `hub` — la señal de que el segundo control sobraba. Peor: dejaba abierta la
combinación «hub en enlace único», que es exactamente como se dimensiona de menos un
concentrador. Ahora el modo **se deriva** (`esConcentrador() === rolSdwan==='hub'`) y los
controles de sedes y simultaneidad aparecen solos.

**`#perUser` — Mbps por usuario activo.** Desde que existe el Multi-Underlay Builder, el
caudal **se declara** enlace por enlace. `usuarios × Mbps/usuario` era una segunda fuente de
verdad para la misma magnitud, resuelta con un `max()` — y la propia pantalla advertía que
producía cifras irreales («5.000 usuarios a 3 Mbps dan 15 Gbps, cifra que no representa ningún
consumo real»). Un campo cuyo aviso dice que no te fíes de él no es un campo, es una trampa.
Los usuarios se quedan: alimentan sesiones, CPS y licenciamiento por endpoint, que es para lo
que sirven de verdad.

## Cuatro altas — lo que faltaba para dimensionar SD-WAN y acceso remoto

**VPN de acceso remoto (`#vpnUsers` + `#vpnMbps`).** No estaba modelado **en absoluto**, y es
un caso de uso central de cualquier FortiGate. Su tráfico atraviesa las dos rutas de
procesamiento: entra por el motor IPsec/SSL-VPN y sale por el stack de inspección, así que
suma al caudal de la capa efectiva **y** carga el eje IPsec. Se piden las dos magnitudes por
separado porque miden ejes distintos y ninguna se deduce de la otra sin inventar un Mbps por
usuario — el error que se acaba de retirar. Los usuarios remotos **suman a la tabla de
sesiones**: el FortiGate sostiene esa sesión igual que la de un usuario local.

**Conteo de túneles (`#sites` como spokes, `#hubs` nuevo).** La pregunta es distinta a cada
lado del fabric y por eso el control también: un hub declara cuántos spokes agrega, un spoke
cuántos hubs cifra. `#sites` ya existía pero solo servía para el caudal agregado; ahora fija
las dos cosas. Un spoke no tenía dónde declararlo.

**Lo que se declara y NO se comprueba, dicho en pantalla.** Tres límites reales de FortiOS que
este catálogo no trae: túneles IPsec por modelo, usuarios SSL-VPN concurrentes por modelo, y
la escala del plano de control (pendiente **F4**). Se muestra **cuántos se piden** y se dice
que el tope hay que contrastarlo con el datasheet y la *Maximum Values Table*. Dar por bueno
que caben sería inventarlo; callarlo sería peor, porque el conteo es justo lo que decide un
hub de fabric grande.

## El reparto de la demanda entre ejes, corregido

El eje IPsec recibía solo la fracción del overlay. Ahora recibe **overlay + acceso remoto**,
porque son dos orígenes de tráfico cifrado que terminan en el **mismo motor** del equipo: un
hub con 40 spokes y 300 teletrabajadores los cifra todos a la vez. El overlay es una fracción
del caudal del sitio (el resto sale por breakout local); el acceso remoto va entero, porque no
existe una parte de él sin cifrar.

Medido en Chromium: 500 Mbps de WAN con 200 usuarios recomiendan un **60F**; añadir 300
usuarios remotos y 400 Mbps de acceso remoto lo llevan a un **70G**, con las sesiones pasando
de 5.200 a 13.000 y el aviso del límite SSL-VPN en pantalla. Ese salto no existía antes
porque el escenario no se podía expresar.

## Licenciamiento derivado del dimensionamiento

**FortiClient EMS** es el único bloque cuya cantidad sale de un campo técnico y no de una
elección comercial: los endpoints son los usuarios ya declarados (sitio + acceso remoto).
Pedirlos otra vez en el paso 4 habría sido un segundo sitio con el mismo dato. Va como casilla
y apagado por defecto, y cuando se pide **entra con la cantidad correcta y sin SKU**, cerrando
la puerta de exportación: este repositorio tiene el **patrón** del código
(`FC1-10-EMS05-428-01-DD`, tramo de 25) y no un código pedible. La línea entra igualmente para
que la cotización no salga corta — declarada, no inventada.

## El formulario resultante

| Paso | Campos | Qué eje alimenta |
|---|---|---|
| **1 · Plataforma y rol** | Segmento · Rol SD-WAN · HA | Acota la familia; el rol decide si el eje IPsec entra y si el caudal es agregado |
| **2 · Capa de inspección** | Capa · SSL · AV · Web/App · IoT+DLP · Sandbox · Servicios SD-WAN · FortiConverter | Qué cifra del Product Matrix aplica, y el bundle mínimo |
| **3 · Tráfico, VPN y sesiones** | Enlaces WAN · inter-VLAN + simultaneidad · Spokes/Hubs · Simultaneidad · **VPN remota (usuarios + caudal)** · Usuarios del sitio · Sesiones/usuario (+ override) · Vida de sesión · Crecimiento · Techo de utilización | Capa efectiva, IPsec, sesiones, CPS, túneles |
| **4 · Equipo y cotización** | Modelo · Cantidad · Término · Bundle (+ no incluir) · FortiCare (+ no incluir) · **FortiClient EMS** | Solo cotización |

**Lo que sigue sin entrar, y por qué:** mezcla porcentual por capa (el Product Matrix no la
publica), proxy/flow (su derate está entre los once que el informe pide excluir), upstream (el
motor consume un solo caudal), appliance/VM y región (no hay dato en el catálogo), rutas,
vecinos y VDOM (pendiente F4). Ninguno se cierra con código: se cierran con un dato.

## Verificación de la etapa 5

473 unitarios (AT-26…AT-28 nuevos sobre el licenciamiento por endpoint), 16/16 pantallas,
**4/4 contrastes sin discrepancias** —incluido `fortinet`, cuya línea base se midió antes del
Multi-Underlay Builder: la prueba de que retirar tres campos y añadir cuatro **no movió el
dimensionamiento de ningún escenario que no los use**— y 10/10 baterías e2e.

---

# Etapa 6 · Los límites del Product Matrix dejan de declararse y pasan a comprobarse (2026-09-23)

La etapa 5 cerró con el formulario pidiendo tres cosas que la pantalla no podía contrastar
—túneles IPsec, usuarios SSL-VPN concurrentes y la escala del plano de control— y diciéndolo
en voz alta: «el límite por modelo no está en este catálogo». Eso era lo correcto mientras el
dato no estuviera, y a la vez era el defecto más caro que quedaba: **un control que no se
puede comprobar invita a creer que se tuvo en cuenta**, que es peor que su ausencia. El
pendiente **F4** lo registraba así, y remitía a la *Maximum Values Table* de Fortinet.

## El dato no hizo falta traerlo: ya estaba en el repositorio

`fortinet.com` y `docs.fortinet.com` siguen respondiendo `connect_rejected` al proxy de egreso
de este entorno — se volvió a medir el 2026-09-23 y sigue siendo una denegación de política de
la organización, no un fallo de red. **No se descargó nada.** El PDF del **Product Matrix de
septiembre de 2026** (`PROMTX-2026-R176-SEP`) lo publicó un ejecutor de GitHub Actions el
2026-09-02 en la rama de transporte `fuente/fortinet-product-matrix`, que es de donde ya
salieron `cps` y `sess` de 32 modelos. Se reconstruyó su tabla por coordenadas de texto de las
páginas 1 a 3 y se transcribieron **27 filas de modelo con siete columnas cada una**.

**El doble anclaje dio 27 de 27 sin un solo rechazo**, con `Concurrent Sessions` y
`New Sessions/Sec` como anclas — las dos que este catálogo ya traía verificadas modelo a
modelo. Es lo único que prueba que ninguna fila se desplazó al reconstruir una tabla desde un
PDF, que es justo el fallo que los importadores de este repositorio existen para cazar. De
paso, la fuente primaria **confirma exactamente** los cinco valores de inspección SSL que la
etapa 3 había transcrito de un informe (30G 400, 40F 310, 50G 1300, 70G 1400, 90G 2600): la
comprobación que entonces no se pudo hacer.

## Qué entró, y qué sigue faltando

| Campo | Columna del documento | Cobertura |
|---|---|---|
| `ssl` | SSL Inspection Throughput | **51/58** (era 9/58) |
| `tunGw` | Max G/W to G/W IPsec Tunnels | 51/58 |
| `tunCli` | Max Client to G/W IPsec Tunnels | 51/58 |
| `sslVpn` | SSL VPN Throughput | 42/58 |
| `sslVpnUsers` | Concurrent SSL VPN Users (Recommended Maximum, Tunnel Mode) | 42/58 |
| `policies` | Firewall Policies | 51/58 |
| `vdomMax` | Virtual Domains (Max) | 49/58 |

Los **7 que faltan** son 100F, 200F, 400F, 600F y 1000F con sus variantes 401F y 1001F: cinco
modelos de la generación F que la edición de septiembre ya no lista, porque es un *Top Selling
Models Matrix* y no el catálogo completo. Van en `null`, y **`null` no es cero ni «no tiene
límite»**. Los huecos de `sslVpn`/`sslVpnUsers` son distintos: ahí **el documento imprime
«—»** en cinco modelos base (30G, 40F, 50G, 60F, 70G). No se dedujo la causa; el motivo por el
que Fortinet deja de publicar esa fila en parte de la gama G no está en el documento, y
escribirlo sería inventarlo.

Las variantes con SSD heredan del modelo base **deduciendo el parentesco del propio catálogo**
—dos modelos son hermanos si comparten `fw`, `tp`, `vpn` y `sess`—, que es la regla que ya
aplica `scripts/importar-cps.js`: una segunda lista escrita a mano se desincronizaría al
entrar un modelo nuevo. El campo `matrixDe` declara de quién heredó cada uno, y la ficha lo
dice en pantalla en vez de presentar un valor heredado como propio.

## Cinco ejes nuevos, y una distinción que no es cosmética

`FortinetReglas.EJES` pasa de 8 a 13: `tunGw`, `tunCli`, `sslVpnUsers`, `sslVpn` y `vdom`.
Cuatro de ellos llevan **`configuracion: true`**, y ahí está la decisión de diseño:

> **El techo de utilización es una política sobre CIFRAS DE LABORATORIO** —«no diseñar al
> 100 % de un número medido en banco»—. Un máximo de túneles, de VDOM o de usuarios
> recomendados **no es una medición: es un tope de la plataforma**. Aplicarle el mismo margen
> apartaría un modelo por un límite que el fabricante declara como absoluto, y encima en
> silencio. Se comparan contra el 100 % de lo publicado.

El contraste lo fija con un par: 190 de 200 túneles es el 95 %, así que un techo del 70 %
aplicado a ciegas habría sacado ese modelo. Sigue entrando, y el resultado es idéntico al del
100 %.

Y `escalaMbps` sustituye a la deducción «no tiene `unidad`» con la que `soporta()` decidía qué
ejes entran en la regla de tres del «hasta cuántos Mbps aguanta este modelo». Funcionaba por
casualidad: al entrar el caudal SSL-VPN —Mbps, pero una constante declarada aparte— esa
deducción habría metido en la escala un número que no crece con el caudal del sitio.

## El acceso remoto pasaba por el motor equivocado

**Es el defecto que salió por el camino, y es de la etapa 5.** Cuando entró la VPN de acceso
remoto, su caudal se sumaba **siempre** al eje IPsec, porque la pantalla no preguntaba cómo
termina. El Product Matrix publica dos topes distintos —*Max Client to G/W IPsec Tunnels* y
*Concurrent SSL VPN Users*— porque son **dos motores distintos del equipo**: IPsec dial-up se
cifra en el mismo ASIC que el overlay; SSL-VPN se termina en el stack TLS, tiene su propia
cifra de caudal y **no carga el eje IPsec**. Un diseño SSL-VPN cargaba el eje equivocado en
los dos sentidos.

El control nuevo es `#vpnTipo`, y **no es una preferencia de producto**: decide a qué eje va
la demanda. Medido: 400 usuarios remotos con el mismo caudal y el mismo requerimiento dan un
**60F por IPsec dial-up y un 120G por SSL-VPN**.

## F7 · Las excepciones TLS, como fracción declarada

Toda implantación real deja fuera de la inspección una parte del HTTPS —categorías con
obligación legal, aplicaciones con *pinning*, tráfico de actualización—. Ese caudal atraviesa
el equipo pero **no consume el motor de inspección SSL**. `#pctTlsExento` lo declara, igual
que ya se declara la fracción del overlay, y **el valor por defecto es 0 %**: dimensionar
sobre el caudal completo, que es lo conservador y lo que esta página hacía antes. **No es una
constante de Fortinet** y la pantalla lo dice donde se usa. Se descuenta del eje SSL y **no**
del caudal de la capa efectiva, que sí procesa ese tráfico.

## Un contador que contaba cualquier cosa

`sinSsl` agrupaba **todos** los modelos apartados bajo el rótulo «por falta de cifra oficial
de inspección SSL». Valía mientras `ssl` fuera el único eje duro que podía faltar; al entrar
cuatro más habría contado y rotulado como hueco de SSL un modelo apartado por no publicar su
tope de túneles — y habría mandado a completar el documento equivocado. Ahora el motor expone
**`apartadoPor`** como dato (no como cadena que alguien tenga que leer con una expresión
regular) y la pantalla agrupa por eje.

## Verificación de la etapa 6

484 unitarios (AT-29…AT-34 nuevos, entre ellos el doble anclaje afirmado modelo a modelo y el
techo que no recorta un tope de plataforma), **16/16 pantallas**, **5/5 contrastes sin
discrepancias** —`fortinet-limites` es nuevo y **se comprobó saboteando**: aplicar el techo a
los topes de configuración, o mandar todo el acceso remoto al eje IPsec, producen
discrepancias— y **10/10 baterías e2e**, con AT-29…AT-32 y F7 conducidos en Chromium.

**Dos líneas base se revisaron, y ninguna en silencio.** La de `fortinet` movió solo
`nCandidatos` en los seis escenarios con rol spoke o hub —los 7 modelos sin tope de túneles
publicado se apartan— mientras `recomendado` y `need` quedaron **idénticos**, que es lo que
ese caso existe para vigilar. La de `fortinet-ssl` se rehízo entera porque **la premisa de uno
de sus escenarios dejó de ser cierta**: «a 4 Gbps ningún modelo trae la cifra» era verdad con
9 de 58 y hoy el 200G la cubre. Ese escenario no se borró: se sustituyó por uno más fuerte
—el 600F hace 10,5 Gbps de Threat Protection y aun así no puede competir, porque su SSL no
está publicado—, que **no depende de que el catálogo siga incompleto**.
