# Auditoría y rediseño dinámico del dimensionador Fortinet — entrega (etapa 7)

Documento de entrada: *Informe de auditoría y propuesta de rediseño dinámico del módulo
Fortinet Presales* (auditoría en vivo del portal autenticado, 23-sep-2026), con el prompt
maestro que lo acompañaba. Rama de trabajo: `claude/laughing-babbage-pvpxyi`. **En producción
desde el 2026-09-23**: `main` avanzó de `ec2f803` a `f6f1952` (avance rápido, sin reescribir
nada); `verificar` y `pantallas` pasaron en `main` sobre ese commit; Railway desplegó
`dcb662d9` en SUCCESS con `[seed]` y `Presales corriendo en` en los logs, y la sonda de Actions
devolvió `/salud` 200 `{"ok":true,"fabricantes":7,"modelos":228}` y `/login` 200. El veredicto
técnico sigue siendo GO CONDICIONADO: desplegar no cierra las condiciones de abajo.

| Documento | Contenido |
|---|---|
| Este `LEEME.md` | Resultado y veredicto, informe delta, matrices T01–T30 y CU-01…CU-13, riesgos residuales, cómo revisar y desplegar |
| [`arquitectura.md`](arquitectura.md) | Mapa antes/después, ADR, contrato de la API, esquema del escenario, matriz de reutilización Aruba/Fortinet |
| [`motor-y-bom.md`](motor-y-bom.md) | Fórmulas, supuestos, políticas y límites del motor; BOM y licencias; guía operativa de importación y fuentes |
| [Página de resumen](https://claude.ai/artifact/TFLrckSY8gwNwkwfX3um6o) (privada; su dueño la comparte) | Resumen ejecutivo y **capturas antes/después** en escritorio, resolución intermedia y móvil. No están en git: ver *Capturas antes/después* |

## Resultado: GO CONDICIONADO

**Los cuatro P0 están cerrados y verificados en tres capas**: funciones puras, el servidor real
en modo producción interrogado por HTTP, y Chromium. La recomendación, la selección, el
gráfico, el BOM, Excel, copiar, perfiles, consolidado y cotizador salen ahora de **un solo
resultado** (`FortinetMotor.evaluar`), con la misma huella y la misma versión de catálogo. El
servidor recalcula con el mismo archivo y confirma cada salida comercial. **Las 30 pruebas
T01–T30 están reportadas y las 30 pasan**; cinco lo hacen con un límite declarado, que se
detalla en su fila.

No es un GO por cinco condiciones. Ninguna es un P0, pero todas dependen de una persona o de
un documento que no está en este entorno:

1. **Falta la aprobación explícita de arquitectura Fortinet** que el informe pone como criterio
   de salida. Es una decisión humana y no se autoaprueba.
2. **Hay una fuente crítica citada y no leída.** La retirada del modo túnel de SSL-VPN en
   FortiOS 7.6.3+ viene de la referencia [3] del informe (Release Notes 7.6.6). `docs.fortinet.com`
   responde `connect_rejected` al proxy de egreso de este entorno, así que el documento no se
   leyó. El catálogo la marca `leida:false` y **desde esta entrega la pantalla lo dice junto al
   bloqueo**. Para cerrarla hay que leer las Release Notes desde una máquina con acceso.
3. **No se ejecutaron tres pruebas de accesibilidad**: el lector de pantalla real, el zoom al
   200 % y una auditoría automática tipo axe. Sí se verificó por automatización la semántica
   ARIA: `aria-live`, pestañas con roving tabindex, nombre y descripción del gráfico, tabla
   equivalente y navegación con flechas.
4. **Tres pruebas no frenan el despliegue.** Railway espera a `verificar` y no a `pantallas`
   (pendiente 33); los contrastes y el e2e tampoco frenan. Una regresión de pantalla llegaría
   a producción aunque CI la marcara.
5. **Faltan datos que el catálogo no trae**, y cada uno se trata según lo que arriesga:
   - **dejan la cotización en borrador**, sin tocar el dimensionamiento: los SKU de los
     servicios SD-WAN (F2), de EMS por tramo, de FortiSASE, de FortiSandbox dedicado y de
     FortiAnalyzer, y 17 precios que la lista de septiembre no trae;
   - **apartan el modelo con su motivo**: los límites del 100F y el 200F (F6), cuando el
     escenario pide esos ejes;
   - **bloquean**: el configurador de chasis, que no existe;
   - **se advierten con confianza media**: los topes de rutas, vecinos y VRF de la
     *Maximum Values Table* (F4-resto).

**Estado de las condiciones a 2026-09-24.** La lista de arriba es la del veredicto y no se
reescribe. Lo que ha cambiado desde entonces:

1. **Aprobación de arquitectura: abierta.** La lista de comprobación para quien aprueba está en
   `docs/decisiones-del-dueno-2026-09-24.md`, sección 2. Debajo de esta línea se anota el
   resultado, con nombre y fecha.
2. **Fuente citada y no leída: cerrada.** Las Release Notes de 7.6.3 se trajeron desde Actions
   y dicen lo que la regla aplicaba: «This applies to all FortiGate models». La regla es
   `leida:true`. Las de 7.6.0 dan además la lista cerrada de modelos de 2 GB de RAM, así que en
   7.6.0–7.6.2 ya no hay compatibilidad «desconocida».
3. **Accesibilidad: casi cerrada.** axe (WCAG 2.1 A/AA) y el reflujo a 640 px están
   automatizados en `test/e2e/e2e-accesibilidad.js`. Falta el lector de pantalla real; su guion
   está en la sección 4 del documento de decisiones.
4. **Pruebas que no frenan el despliegue: abierta.** Depende de activar «Wait for CI» en
   Railway. La sesión no pudo hacerlo; los pasos están en la sección 1 del mismo documento.
5. **Datos que faltan: reducida.**
   - F6 cerrada: 100F y 200F con sus límites y su figura, y los chasis con figura.
   - F2 con SKU exacto en 20 de 23 modelos.
   - EMS y FortiSASE con SKU exacto.
   - Lo que sigue en borrador es sobre todo **precio**, que la lista de septiembre no trae.
   - Siguen igual: FortiAnalyzer y FortiSandbox dedicado (otro dimensionamiento), la licencia
     de VDOM adicional, el configurador de chasis y F4-resto.

**Quién decide:** el dueño del repositorio (fusión y despliegue) y el arquitecto Fortinet que
pide el informe (aprobación técnica). El siguiente paso verificable está en
[*Cómo revisar y desplegar*](#cómo-revisar-y-desplegar).

## Informe delta

La línea base se midió sobre `ec2f803`: 492 pruebas en verde y el escenario auditado conducido
en Chromium. El CU-01 reprodujo exactamente las cifras del informe: 90G, TP 50 %, SSL 42 %,
IPsec 4 %, sesiones 1 % y CPS 0,92 %. «Confirmado» significa reproducido aquí. «Del informe»
significa que se aceptó su diagnóstico sin reproducirlo aparte.

| ID | Prioridad | Línea base | Qué se hizo | Estado | Evidencia |
|---|---|---|---|---|---|
| F01 | P0 | **Confirmado** en Chromium. Con el 40F elegido a mano, el BOM cotizaba el 40F, el panel seguía en 90G y Excel, copiar y cotizador estaban habilitados | Elegir a mano pasa a ser una petición de revalidación. Si el modelo no cumple, el modelo validado sigue siendo la recomendación, se muestra el déficit y la puerta queda en BLOCKED | Cerrado | `test/fortinet-motor.test.js` T02/T03; e2e T02/T03/T25; API `puerta-cerrada`; capturas «F01» de la página de resumen |
| F02 | P0 | **Confirmado, y peor**: no había campo de versión, y la nota 11 del Product Matrix solo admite SSL-VPN en el 90G entre 7.0.12 y 7.0.15 | Campo `#fortiOS` con tres ramas y matriz FortiOS × función × modelo con su fuente. SSL-VPN en 7.6.3+ se bloquea y ofrece «Cambiar a IPsec» | Cerrado; la fuente de 7.6.3+ va **citada, no leída** (condición 2) | T06/T07 unit y e2e; CU-05 e2e |
| F03 | P0 | **Confirmado**: con HA se podía bajar la cantidad a 1 y exportar | La cantidad se deriva del modo (standalone 1, HA 2) y es de solo lectura. `disponibilidad.nodos` no existe en el esquema, y enviarlo da `campo-desconocido` | Cerrado | T04/T05 unit y e2e |
| F04 | P0 | **Confirmado**: la puerta deshabilitaba `#btnACotizador` y `bom.js` creaba el botón sin id | Puerta única de cuatro estados. Cada botón pregunta `permite(res, acción)` y el servidor lo vuelve a comprobar | Cerrado | T25 unit y e2e; API DRAFT/BLOCKED → 409 |
| F05 | P1 | Del informe: el builder sumaba todas las bajadas | Rol activo o respaldo por enlace. La demanda por eje es el máximo entre el escenario normal, la falla de cada enlace activo y el failover HA, y el requisito dice qué escenario lo gobierna | Cerrado | T15 unit y e2e |
| F06 | P1 | Del informe: los puertos, el PoE, el disco y la PSU no filtraban | Son restricciones duras: puertos por cantidad, velocidad y medio; PoE del SKU base; disco para retención local; segunda fuente | Cerrado; las ópticas de Fortinet no están en el catálogo (riesgo R6) | T17/T18/T19 unit y e2e |
| F07 | P1 | Del informe | Un chasis modular bloquea el BOM y deriva a diseño especializado | Cerrado, por bloqueo (no hay configurador) | T20 unit y e2e |
| F08 | P1 | **Confirmado**: al desplazar, el panel se iba | Panel de decisión anclado con cuerpo desplazable y pie visible. En móvil, una sola columna con una barra de resumen fija | Cerrado | T26/T27 e2e; capturas «F08» y «Móvil» de la página de resumen |
| F09 | P1 | Del informe | Las reglas de formulario son datos del motor (`REGLAS`). Lo inactivo se conserva en el campo pero sale del cálculo, de la huella y del enlace | Cerrado | T13 unit (fuera de la huella) y e2e (no viaja en el enlace) |
| F10 | P1 | Del informe | Activadores contextuales para acceso remoto, EMS, SASE, sandbox, registro y HA | Cerrado | T13/T14 e2e; `REGLAS` en `fortinet-motor.js` |
| F11 | P1 | Del informe | Tres modos: `incluido` (sin línea), `ai` (SKU de la price list) y `dedicado` (pide modalidad, va en línea propia sin SKU y deja borrador) | Cerrado; el SKU del dedicado no está en el catálogo | T10/T11 |
| F12 | P1 | Del informe | Endpoints de EMS como dato propio, con un botón «Sugerir» visible en vez de forzar el valor | Cerrado; el SKU del tramo no está en el catálogo | T12 (e2e endurecida en esta entrega) |
| F13 | P1 | **Confirmado**: notas con «9 modelos», «53/58» y «julio» | El banner y la pestaña cuentan la cobertura sobre el catálogo servido. Las notas de `fuentes.js` quedan fechadas como historia, y se declaran las fichas por serie | Cerrado | T24 e2e; `server/seed/legacyData/fuentes.js` |
| F14 | P1 | Del informe | Fuera de venta excluido en compra nueva; en ampliación exige justificación escrita | Cerrado | T21 unit y e2e |
| F15 | P1 | Del informe | FortiAP, FortiSwitch, VDOM, tokens y túneles son ejes. El plano de control de un hub se **advierte** | **Parcial**: rutas, vecinos y VRF necesitan la *Maximum Values Table* (F4-resto) | T14/T22 |
| F16 | P2 | Del informe | Shortlist de tres, del mismo segmento primero, con el porqué de cada alternativa | Cerrado | `pintarShortlist`; prueba «misma capacidad que» |
| F17 | P2 | Del informe | `aria-live`, pestañas ARIA con roving tabindex, gráfico con `role="img"`, nombre, descripción y tabla equivalente | Cerrado en semántica; lector real **no ejecutado** | T28/T29 e2e |
| F18 | P2 | **Confirmado**: una referencia de 6.730 contradecía su término | Validador semántico: gobierna el sufijo del código, el texto corregido se muestra con el original y el motivo, y el importador lo reporta | Cerrado | `test/fortinet-precios.test.js` F18/T23 |
| N01 | nuevo | **Confirmado**: al abrir un enlace, `renderBom` corría antes de llegar el catálogo | La página no pinta hasta evaluar con el catálogo cargado | Cerrado | e2e T30 «sin excepciones de página» |
| N02 | nuevo | Medido: `LICENSES` venía de la lista de agosto y la fuente declarada es la de septiembre | 108 de 1.193 precios reanclados por SKU exacto. Los 17 que la lista vigente no trae se marcan `anterior` y dejan borrador | Cerrado | `test/fortinet-precios.test.js` N02 |
| N03 | nuevo | Encontrado al endurecer T12: la nota de la línea decía «termino 3 anos». En total, 60 textos visibles iban sin tilde: 53 en `fortinet-reglas.js`, 6 en el motor y 1 en los datos | Corregidos solo dentro de literales, sin tocar códigos ni claves. Llegan a Excel, al texto copiado y al cotizador | Cerrado | `test/fortinet-motor.test.js` T23 (`/5 años/`); `test/fortinet-reglas.test.js` (cuatro aserciones actualizadas) |
| N04 | nuevo | Encontrado al contrastar CU-05: el bloqueo de SSL-VPN llevaba `fuente` en los datos, pero la lista solo pintaba el mensaje | La fuente se pinta, y una regla `leida:false` lo declara | Cerrado | unit T06/T07 (`fuenteLeida`); e2e CU-05 |

## Matriz T01–T30

**Ambiente:**
- repositorio local;
- Node 22;
- servidor con `NODE_ENV=production` y SQLite efímera sembrada desde `legacyData/`;
- Chromium 1194 conducido con Playwright.

**Commit:** el que contiene este documento, en `claude/laughing-babbage-pvpxyi`, con base `d486b1b`.

**Catálogo servido:** `fortinet@51b7abb658668661` (58 modelos).

**Motor:** `7.0.0`; esquema `1`.

**Cómo leer las columnas:**
- «unit» remite a `test/fortinet-motor.test.js` salvo que se diga otro archivo;
- «e2e» remite a `test/e2e/e2e-fortinet-rediseno.js`;
- «API» remite a `test/servidor-produccion.test.js`.

| ID | Criterio | Estado | Evidencia | Hallazgo |
|---|---|---|---|---|
| T01 | El escenario auditado recomienda 90G y reproduce las utilizaciones | Aprobada | unit: TP y SSL a ±1 punto, sesiones 34.125, CPS 1.138, demanda ≈1,1 Gbps y READY. e2e a ±2 puntos. API: CU-01 da 90G READY | CU-01 |
| T02 | 40F con 1,1 Gbps bloquea el BOM y muestra el déficit TP/SSL | Aprobada | unit: déficit exacto `['ssl','tp']` y acciones `[]`. e2e ×4. API 409 `puerta-cerrada` | F01 |
| T03 | El BOM coincide siempre con el modelo validado | Aprobada | unit: 7 variantes, incluidos un override que cumple y otro que no. e2e ×3 | F01 |
| T04 | HA fija cantidad mínima 2, no reducible | Aprobada | unit: la cantidad no es un campo del escenario. e2e: `qty` = 2 y de solo lectura | F03 |
| T05 | HA duplica hardware y suscripciones sin duplicar capacidad | Aprobada | unit: cada fila ×2 y utilización igual a la de una unidad. e2e: recomendación sin cambio y BOM por 2 nodos | F03 |
| T06 | FortiOS incompatible oculta SSL-VPN túnel y ofrece IPsec | Aprobada | unit: bloqueo, corrección y `fuenteLeida:false`. e2e ×3 más la fuente visible. En 7.6.3+ la opción aparece deshabilitada y, si llega por enlace, se bloquea | F02 |
| T07 | 90G/91G bloquean SSL-VPN aunque exista dato histórico | Aprobada | unit: en las tres ramas, con su fuente (nota 11, leída). e2e | F02 |
| T08 | IoT/DLP deshabilita bundles insuficientes o corrige explicando | Aprobada | unit: bloqueo y corrección, también sin candidato. e2e: corrige a Enterprise, lo explica y se deshace | CU-06 |
| T09 | Un bundle con Premium no añade otra FortiCare Premium | Aprobada | unit T09 (BDL y separado); `test/fortinet-reglas.test.js` AT-04 | — |
| T10 | Sandbox incluido no crea add-on duplicado | Aprobada | unit T10/T11; e2e | F11 |
| T11 | Sandbox dedicado pide modalidad y genera línea propia | **Aprobada con límite declarado**: la línea va sin SKU (no está en el catálogo) y deja borrador | unit; e2e ×2 | F11 |
| T12 | EMS usa endpoints gestionados con edición y término | **Aprobada con límite declarado**: patrón de SKU con tramo de 25, sin código de tramo, en borrador | unit; e2e ×3: 350 endpoints y 14 tramos | F12 |
| T13 | Sin SD-WAN desaparecen el overlay y los servicios, y quedan inactivos | Aprobada | unit: fuera de la huella. e2e ×4: oculto, conservado, fuera del enlace y declarado | F09 |
| T14 | Un spoke muestra hubs; un hub muestra spokes, simultaneidad y plano de control | **Aprobada con límite declarado**: el plano de control se advierte, porque sus topes no están en el catálogo | unit; e2e ×3 | F09, F15 |
| T15 | El enlace de respaldo no suma en normal y sí en su falla | Aprobada | unit; e2e ×3, incluida la pérdida declarada de lo que no cabe | F05 |
| T16 | SSL = tráfico cifrado × fracción inspeccionada | Aprobada | unit; e2e | — |
| T17 | El registro local exige disco suficiente o una alternativa externa | Aprobada | unit; e2e: manda la variante con disco | F06 |
| T18 | PoE no acepta un SKU base sin PoE | Aprobada | unit: 80F frente a la variante -POE. e2e | F06 |
| T19 | Puertos por cantidad, velocidad y medio | **Aprobada con límite declarado**: un modelo sin puertos estructurados se declara «no comprobado» con confianza media | unit; e2e: 4 × SFP+ | F06 |
| T20 | Un chasis no exporta BOM sin módulos, fuentes y ópticas | Aprobada: bloquea y deriva | unit; e2e | F07 |
| T21 | Fuera de venta excluido de compra nueva; en parque instalado con justificación | Aprobada | unit; e2e ×4 | F14 |
| T22 | VDOM sobre la cuota añade licencia válida o bloquea | **Aprobada con límite declarado**: la licencia entra sin SKU y deja borrador; por encima del máximo, aparta | unit; e2e | F15 |
| T23 | 60 meses nunca se describe como un año | Aprobada | unit T23; `fortinet-precios.test.js`: ninguna referencia servida contradice su código | F18 |
| T24 | La cobertura del banner coincide con el catálogo servido y con las notas | Aprobada | e2e ×3 (cuenta SSL n/58 contra `/api/dimensionador/fortinet`); notas de `fuentes.js` fechadas | F13 |
| T25 | Todos los botones comerciales obedecen la misma puerta | Aprobada | unit; e2e: deshabilitados juntos, y en borrador solo el borrador. API: DRAFT deja `excel-borrador` y no `cotizador` | F04 |
| T26 | En escritorio, la columna izquierda se desplaza y el panel no | Aprobada a 1440×936 | e2e: formulario 1321 → 421 px, panel 12 → 12 px, pie dentro de la ventana | F08 |
| T27 | En móvil no hay doble scroll y el resumen sigue accesible | Aprobada a 390×844 | e2e: sin scroll horizontal, formulario sin scroll propio, barra `role="region"` con el modelo | F08 |
| T28 | Los cambios de modelo y los bloqueos se anuncian con `aria-live` | Aprobada en semántica; lector real **no ejecutado** | e2e: `polite`, anuncia 90G y el bloqueo del 40F | F17 |
| T29 | El gráfico tiene nombre accesible y tabla equivalente | Aprobada | e2e: `role="img"`, nombre y descripción, tabla de 54 filas | F17 |
| T30 | El enlace restaura entradas, catálogo, resultado y huella | Aprobada | unit: huella determinista e independiente del orden de claves. e2e: `h` y `ds` en el enlace, el receptor recalcula lo mismo y una huella distinta se avisa | — |

## Casos de uso CU-01…CU-13

| CU | Estado | Evidencia y límites |
|---|---|---|
| CU-01 sucursal spoke auditada | Cumple | T01 |
| CU-02 override a 40F | Cumple | T02, T03, T25. Ni Excel, ni texto, ni consolidación, ni cotizador presentan el 40F |
| CU-03 HA activo-pasivo | Cumple, salvo heartbeat | T04/T05. Al desactivar HA vuelve a 1 unidad por construcción. **El heartbeat no se modela.** La energía redundante es un control aparte (`#chkPsuRed`) |
| CU-04 sin SD-WAN | Cumple | T13 |
| CU-05 FortiOS y acceso remoto | Cumple | T06/T07. La fuente se ve junto al bloqueo y dice si se leyó. En 7.4 el escenario se puede evaluar como histórico |
| CU-06 IoT/DLP con bundle insuficiente | Cumple | T08, T25 |
| CU-07 registro local | Cumple | T17. La capacidad se compara en bruto; FortiOS reserva parte del disco y eso va declarado como supuesto |
| CU-08 activo/respaldo | Cumple | T15 |
| CU-09 puertos, medio y PoE | Parcial | T18/T19. **No se listan ópticas obligatorias**, porque el catálogo no trae ópticas de Fortinet |
| CU-10 nueva frente a renovación | Parcial | En compra nueva va el BDL; la renovación exige serie y cotiza solo servicios. **El co-term cotiza el término elegido (1, 3 o 5 años) y no prorratea** |
| CU-11 parque instalado EOL | Cumple | T21 |
| CU-12 chasis | Cumple por bloqueo | T20. No existe configurador |
| CU-13 móvil | Parcial | T27 y capturas. **No ejecutado:** lector de pantalla, y que el resultado conserve la posición del usuario al recalcular |

## Calidad técnica (§12.5 del prompt)

| Comprobación | Resultado |
|---|---|
| Formateador | **No aplica**: el repositorio no activa reglas de formato a propósito (`CLAUDE.md`, *El lint no es un manual de estilo*) |
| Linter | Aprobado (`npm run lint`) |
| Comprobación de tipos | **No aplica**: JavaScript sin TypeScript |
| Pruebas unitarias y de integración | **542/542** (`npm run verificar`) |
| Servidor real en producción | Aprobado: arranque con `NODE_ENV=production`, `[seed]`, `listen` y `/salud` → `{ok:true, fabricantes:7, modelos:228}` |
| Pantallas en Chromium | **16/16** (`npm run pantallas`) |
| Contrastes antes/después | **6/6 sin discrepancias** (`npm run contraste -- --todos`) |
| E2E | Ver *Verificación* más abajo |
| Build de producción | **No aplica**: no hay paso de build |
| Análisis automático de accesibilidad (axe) | **No ejecutado**: axe no es dependencia del repositorio y añadirla quedaba fuera del alcance |
| Revisión de dependencias | Sin cambios en `package.json` ni en el lock |
| Migración y rollback | Los enlaces v1 migran (6 casos en el contraste `fortinet`), y los enlaces con campos de acceso remoto sin su activador también (`migrarActivadores`). Rollback: la rama no está fusionada, y lo único persistente nuevo es `AUTH_STATE_DIR/auditoria/fortinet.jsonl` (solo añade líneas; revertir no lo necesita) |
| Comparación visual | Cinco parejas antes/después en la [página de resumen](https://claude.ai/artifact/TFLrckSY8gwNwkwfX3um6o) |

## Riesgos residuales y lo que requiere PoC

| # | Riesgo | Efecto hoy | Cómo se cierra |
|---|---|---|---|
| R1 | La retirada de SSL-VPN túnel en 7.6.3+ está **citada, no leída** | Bloquea con la fuente a la vista y dice que no se leyó | Leer las Release Notes 7.6.x desde una máquina con acceso y pasar `leida:true` con la cita literal |
| R2 | «Modelos con 2 GB de RAM» (nota 10 del Matrix) no dice cuáles son | En 7.6.0–7.6.2, SSL-VPN queda «desconocida», con confianza baja y borrador | Necesita el dato de RAM por modelo, de las fichas por serie |
| R3 | Faltan los límites y las figuras del 100F y el 200F (F6) | Se apartan con su motivo cuando el escenario pide esos ejes | Lanzar `traer-fortinet-pendientes.yml` y transcribir |
| R4 | Faltan los SKU de SD-WAN (F2), EMS por tramo, SASE, Sandbox dedicado y FortiAnalyzer | Borrador: no sale una cotización en firme | Leer el Ordering Guide de FortiGuard desde el mismo workflow |
| R5 | Faltan los topes de rutas, vecinos y VRF (F4-resto, F15) | El hub los advierte y baja la confianza a media | Leer la *Maximum Values Table*; el motor tiene sitio en `EJES` |
| R6 | No hay ópticas de Fortinet en el catálogo | Los puertos se comprueban, pero no se cotizan las ópticas | Importarlas de la price list con el mismo anclaje |
| R7 | Supuestos de la herramienta: ESP 6 %, vida de sesión de 30 s y simultaneidad de hub | Van a la vista en «Supuestos» en cada evaluación | PoC cuando el escenario dependa de ellos |
| R8 | **Requiere PoC**: inspección proxy, mezcla criptográfica atípica, DLP intensivo, full table, CPS extremo y chasis | Las cifras publicadas son de modo flow. En proxy la confianza baja a media con aviso; el chasis bloquea | PoC con el distribuidor autorizado (§12.5 del informe) |
| R9 | 17 precios siguen en la edición de agosto | La línea sale en borrador y dice cuál | Llegan con la próxima lista que los traiga |
| R10 | `pantallas`, contrastes y e2e no frenan el despliegue (pendiente 33) | Una regresión visual llegaría a producción | El dueño decide si pasan a *required check* |
| R11 | Los dimensionadores Aruba suman todos los enlaces (el mismo defecto que F05) | Aruba puede sobredimensionar un sitio con enlaces de respaldo | Portar el rol activo/respaldo (ver la matriz de reutilización en `arquitectura.md`) |

## Verificación

Todo sobre el árbol de este commit, en local, contra el servidor en modo producción:

- `npm run verificar`: lint y **542 pruebas** en verde, entre ellas 36 del motor, 7 de precios
  y 4 de la API de evaluaciones.
- `npm run pantallas`: **16/16** pantallas sin novedad.
- `npm run contraste -- --todos`: **6/6 casos sin discrepancias**. Las líneas base de
  `fortinet`, `fortinet-limites` y `fortinet-ssl` se re-midieron en `d486b1b` con el delta
  declarado en cada caso: solo cambia `nCandidatos`, por fuera de venta y fichas por serie;
  `recomendado` y `need` no cambian. La cobertura medida en esa corrida
  (`scripts/contrastes/cobertura.lock.json`) es del 83 % de las funciones de
  `fortinet-motor.js`, el 79 % de la página y el 69 % de `fortinet-reglas.js`.
- `npm run e2e`: la batería completa, 11 scripts en verde.
  - `e2e-fortinet-rediseno.js` tiene 76 afirmaciones. La última exige que las cinco pestañas
    del panel se vean enteras a 390 y a 1024 px: salió de revisar las capturas de entrega,
    donde a 1024 px la quinta quedaba cortada.
  - `e2e-fortinet-auditoria.js` sigue en verde, con su contenido adaptado a la puerta de
    cuatro estados.

## Capturas antes/después

**Dónde están: en la [página de resumen](https://claude.ai/artifact/TFLrckSY8gwNwkwfX3um6o), no en el repositorio.** El `.gitignore`
excluye las carpetas `capturas/` a propósito: son artefacto de verificación, y commitearlas
engordaría el repositorio con una imagen por pantalla y por cambio. No se renombró la carpeta
para esquivar la regla, porque su motivo vale igual para estas. Lo que sí queda en el
repositorio es la prueba: cada hecho que muestran lo afirma el e2e (T02, T03, T25, T26 y T27),
que vuelve a correr solo. Las dos capturas de BOM de la página están **recortadas por encima de
las filas de precio**.

**Cómo se tomaron:**
- el mismo escenario CU-01 abierto por enlace en los dos servidores: el antes, un árbol de
  `ec2f803` en otro puerto; el después, este commit; los dos con `NODE_ENV=production`;
- viewports: escritorio 1440×936, intermedia 1024×768 y móvil 390×844;
- parámetros del enlace CU-01 (el mismo que usan `test/e2e/e2e-fortinet-rediseno.js` y el
  unitario T01): un enlace DIA de 500 Mbps por el overlay, rol `spoke` con 2 hubs, 200 Mbps
  inter-VLAN, 50 remotos con 100 Mbps, 300 usuarios × 75 sesiones, vida de sesión de 30 s,
  antivirus, web filtering e inspección SSL, 30 % de crecimiento y techo del 70 %;
- el enlace del después lleva además `chkRemoto=1`, la casilla que añadió la etapa 7. Sin ella
  el resultado sería el mismo: `migrarActivadores` la marca sola al abrir un enlace anterior que
  trae usuarios remotos.

**Qué muestran:**

| Pareja | Antes (`ec2f803`) | Después |
|---|---|---|
| F01 · el panel con el 40F elegido a mano | **Idéntica a la del escenario sin override**, byte a byte: el panel no se enteraba (F01) | «BLOQUEADA», con déficit TP +84 % y SSL +256 %, y «Volver al recomendado» |
| F01 · la lista de materiales con ese override | **El BOM cotiza el 40F**, con Excel y cotizador habilitados | El BOM sigue en el **90G validado**, con Excel y cotizador deshabilitados |
| F08 · escritorio y 1024 px, a mitad de formulario | Solo queda anclada una línea de cabecera: los ejes, la puerta y las acciones se van con el scroll (F08, «el panel completo no permanece visible») | El panel entero queda anclado, y su pie con la puerta y «Revisar lista de materiales» sigue a la vista |
| Móvil, 390 px | **Desbordamiento horizontal** | Sin desbordamiento, con la barra fija «FortiGate 90G · Lista para cotizar» |

**Errores de página durante la toma:** en el antes, 4, todos
`Cannot read properties of undefined (reading 'lic')`, que es N01 (el BOM se pintaba antes de
llegar el catálogo); en el después, ninguno.

## Cómo revisar y desplegar

**Revisión humana, sin desplegar nada:**

1. Revisar el diff de la rama contra `main` (`git diff main...claude/laughing-babbage-pvpxyi`).
   Los archivos centrales son:
   - `public/js/fortinet-motor.js`;
   - `server/routes/fortinet.js`;
   - `public/js/dimensionador-fortinet-fortigate.js`;
   - `public/js/fortinet-reglas.js`.
2. Arrancar en local con `NODE_ENV=production`, con un `AUTH_PASSWORD` propio que no viaja en
   ningún archivo, y abrir `/dimensionador-fortinet-fortigate.html`. Recorrer el CU-01 con los
   parámetros de *Capturas antes/después*, y el CU-02 eligiendo el 40F en el paso 5.
3. Correr `npm run verificar`, `npm run pantallas -- --base=…`,
   `npm run contraste -- --todos --base=…` y `npm run e2e`.
4. Pedir la revisión de arquitectura Fortinet sobre `motor-y-bom.md`: fórmulas, supuestos y
   límites.

**Despliegue** (hecho el 2026-09-23 por avance rápido de `main`, sin PR; ver la cabecera):

1. Abrir un PR de la rama a `main`. `verificar.yml` y `pantallas.yml` corren en el PR.
2. Fusionar. **Ese push a `main` es el despliegue** (Railway `presales-web`).
3. Confirmar que el despliegue llega a SUCCESS y que los logs muestran `[seed]` y
   `Presales corriendo en`. `sonda-produccion.yml` confirma `/salud` y `/login` desde Actions.
4. En producción, abrir el dimensionador y comprobar que el pie del panel dice
   «Lista para cotizar» con el CU-01.
5. Rollback: revertir el commit de fusión, que hace un push nuevo a `main` y redespliega. No
   hay migración de base: se resiembra en cada despliegue.
