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
| 2 | **Capa de inspección** | La capa, las funciones que elevan el piso, el derate SSL. Lo propio de Fortinet, junto. |
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
