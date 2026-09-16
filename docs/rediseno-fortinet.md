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
