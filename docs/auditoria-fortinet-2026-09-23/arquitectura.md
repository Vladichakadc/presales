# Arquitectura del dimensionador Fortinet: antes, después, decisiones y contrato

## Mapa antes (`ec2f803`)

```
dimensionador-fortinet-fortigate.js (≈3.600 líneas: motor + pintado + salidas)
│
├─ render() ── ejes por FortinetReglas ── #verdict-sel (ficha.js)        ← «recomendado»
├─ #pickModel (paso 4) ──────────────── BOM.sincronizar ── #bomBody     ← «cotizado»
├─ #qty  (editable, también con HA) ──── renderBom                       ← cantidad a mano
├─ puerta de exportación ── deshabilita #xlsBtn, #copyBtn, #btnACotizador
│                            └─ bom.js creaba el botón SIN id → el cotizador no obedecía
└─ enlace compartido ── estado.js (todos los campos, visibles o no)
```

Había cuatro verdades sobre el mismo escenario: el recomendado, el cotizado, la cantidad y la
puerta. Los P0 F01–F04 eran las costuras entre ellas, no cuatro fallos independientes.

## Mapa después

```
formulario ─ leerEscenario() ─► escenario tipado (esquema 1)
                                   │
            ┌──────────────────────┴───────────────────────────┐
            │  FortinetMotor.evaluar(escenario, catálogo)      │   public/js/fortinet-motor.js (UMD)
            │  mismo archivo en el navegador y en el servidor  │
            └──────────────────────┬───────────────────────────┘
                                   ▼
RES = { snapshot, scenarioHash, datasetVersion, campos, escenarios, requisitos,
        candidatos, elegibles, descartados, recomendacion, alternativas (shortlist),
        seleccion (= selectedValidatedModel), override, bom, bloqueos, avisos,
        supuestos, confianza, quoteGate, acciones }
   │
   ├─ RES.campos ─────────────► aplicarReglas(): visible, obligatorio, «afecta a…»
   ├─ RES.recomendacion/…────► cabecera, ejes, ficha, shortlist, requisitos, gráfico + tabla
   ├─ RES.bom (SOLO de RES.seleccion) ─► tabla BOM, TCO, precio neto, referencias
   ├─ RES.acciones ──────────► TODOS los botones: M.permite(RES, acción)
   └─ RES.scenarioHash + datasetVersion ─► enlace (?h=…&ds=…) y confirmación del servidor

acción comercial (Excel, copiar, perfil, consolidar, cotizador)
   └─► POST /api/v1/fortinet/evaluations {scenario, accion, scenarioHash, datasetVersion, idempotencyKey}
         ├─ mismo fortinet-motor.js sobre el catálogo del servidor
         ├─ 409 si difieren la huella, el catálogo o la puerta
         └─ auditoría: AUTH_STATE_DIR/auditoria/fortinet.jsonl
```

## ADR

Cada ADR cuenta el contexto, la decisión, lo que se descartó y la consecuencia. El motivo
largo está en el comentario de cabecera del código correspondiente.

**ADR-01 · Un único motor UMD, compartido por navegador y servidor.**
- *Contexto:* el informe pide que el backend sea autoritativo y que la respuesta sea
  instantánea mientras se escribe.
- *Decisión:* `fortinet-motor.js` es una función pura que carga igual `<script>` y `require()`.
- *Descartado:* dos implementaciones, porque divergen, y este repositorio ya lo pagó con
  `llevarABom` en seis copias; y un motor solo en el servidor, que exigiría un viaje de red en
  cada tecla.
- *Consecuencia:* la única forma de que navegador y servidor discrepen es que difieran el
  escenario o el catálogo, y eso lo detectan la huella y `datasetVersion`.

**ADR-02 · El servidor confirma cada salida comercial; el navegador solo previsualiza.**
Todo lo que decide el navegador lo puede reescribir el navegador. Las acciones van a `POST
/api/v1/fortinet/evaluations` con su huella. Si el servidor responde 409, la acción no sale.

**ADR-03 · Huella SHA-256 síncrona, en JavaScript puro, sobre JSON canónico.**
`crypto.subtle` es asíncrono y solo existe en contexto seguro, y la huella se calcula en cada
tecla. Se prueba contra `crypto` de Node, incluido UTF-8 multibyte. El JSON canónico ordena
las claves, así que el orden de escritura no cambia la huella.

**ADR-04 · Elegir a mano es pedir una revalidación, no aprobar.**
- Si el modelo elegido cumple, pasa a ser el validado.
- Si no cumple, el validado sigue siendo la recomendación, se muestra el déficit por eje y la
  puerta queda en BLOCKED mientras el intento siga en pie.
- *Descartado:* sustituir en silencio, que era F01; e impedir elegir, porque el preventa
  necesita ver *por qué* no cabe su equipo.

**ADR-05 · La cantidad se deriva del modo HA y no es un dato del escenario.**
Enviar `disponibilidad.nodos` da `campo-desconocido`. Se prefirió a validar la cantidad a
posteriori porque así no hay estado incoherente que validar.

**ADR-06 · Puerta de cuatro estados con una tabla de acciones.**
- READY y WARNING permiten todo. DRAFT permite solo el borrador técnico, sellado «NO ES UNA
  COTIZACIÓN EN FIRME». BLOCKED no permite nada.
- *Descartado:* un booleano. Sin DRAFT, un diseño coherente con un SKU pendiente no tendría
  salida, y la tabla se copiaría a mano, perdiendo la advertencia.

**ADR-07 · Las reglas del formulario son datos del motor.**
- `REGLAS` declara `visible`, `requerido` y `afecta`.
- Un valor inactivo se conserva en el campo y sale del cálculo, de la huella y del enlace
  (`data-inactivo`, que `estado.js` omite). Es la política `preserve-inactive` del prompt.
- Que la pantalla y el motor lean la misma tabla es lo que impide F09.

**ADR-08 · Qué hace un dato que falta depende de si es técnico o comercial.**
- Falta un dato técnico (caudal, usuarios remotos, retención): no se evalúa, porque el
  resultado mentiría.
- Falta un dato comercial (serie instalada, justificación de fuera de venta, endpoints,
  usuarios de SASE): se evalúa y se ve, pero se bloquea la cotización.

**ADR-09 · Correcciones automáticas solo con disparador explícito, reversibles y explicadas.**
- Hay dos: el bundle mínimo al marcar DLP o IoT, y IPsec al elegir SSL-VPN en 7.6.3+.
- Siempre muestran un aviso con «Deshacer» y quedan en un historial de 30 estados.
- No se aplica ninguna corrección en silencio.

**ADR-10 · En compra nueva va el SKU combinado BDL.**
- El BDL es equipo + bundle + FortiCare Premium en una sola línea, que es lo que la price list
  publica para la primera compra.
- **No es un descuento**: en la lista de septiembre cuesta exactamente lo mismo que las dos
  líneas separadas (162 de 162).
- Ampliación: equipo y bundle van por separado. Renovación y co-term: solo servicios.

**ADR-11 · Precios de licencias reanclados por SKU exacto a la lista declarada.**
- Se reanclan 108; lo que la lista vigente no trae queda marcado `anterior` y deja borrador.
- *Descartado:* borrarlo, que dejaría el BOM sin precio sin decir por qué; y dejarlo como
  vigente, que mentiría sobre la fecha.

**ADR-12 · En el término, el sufijo del código gobierna sobre el texto (F18).**
El texto contradictorio se corrige al mostrarlo, conservando el original y el motivo. El
importador reporta la incoherencia pero no rechaza la fila.

**ADR-13 · La auditoría va al volumen persistente, solo acciones comerciales, sin datos del cliente.**
La base SQLite se resiembra en cada despliegue, así que el registro va a JSONL junto a
`usuarios.json`. Guarda la huella, no el escenario: el nombre del cliente viaja en el enlace y
no en el registro.

**ADR-14 · Un solo scroll por columna.**
- La página se desplaza y el panel de decisión queda anclado, con cuerpo propio y pie siempre
  visible. En móvil: una columna y una barra de resumen fija.
- *Descartado:* scroll propio en el formulario. El dueño ya lo rechazó en Aruba («el único
  scroll es el de la página»).

**ADR-15 · Nada va a `main` en esta entrega.**
El prompt prohíbe desplegar sin autorización, y la instrucción permanente de `CLAUDE.md`
(empujar a `main` es desplegar) quedaría violada al fusionar. Manda lo más reciente y
explícito.

## Contrato de la API

`POST /api/v1/fortinet/evaluations` · detrás del muro de sesión y de `exige('herramientas')`.

**Petición** (JSON; cualquier clave fuera de esta lista da 400 `campo-desconocido`):

| Campo | Tipo | Uso |
|---|---|---|
| `scenario` | objeto | El escenario con el esquema de abajo. Se valida igual que en el navegador |
| `requestedOverrideModel` | texto | Opcional. Equivale a `scenario.seleccion.manual` |
| `accion` | enum | Opcional: `excel`, `copiar`, `cotizador`, `perfil`, `consolidar`, `excel-borrador`, `copiar-borrador`. Sin ella, la ruta solo evalúa |
| `scenarioHash` | texto | La huella que calculó la página. Si no coincide: 409 `huella-distinta` |
| `datasetVersion` | texto | El catálogo con el que calculó la página. Si no coincide: 409 `dataset-distinto` |
| `idempotencyKey` | texto | La misma clave devuelve la misma respuesta con `repetida: true` y no duplica la auditoría (10 min en memoria) |

**Respuesta 200:**
- identificación: `scenarioHash`, `datasetVersion`, `engineVersion`, `schemaVersion`;
- puerta: `quoteGate`, `acciones`, `confianza`;
- dimensionamiento: `requirements` (cada eje con su escenario gobernante), `trafficScenarios`,
  `recommendation`, `alternatives` y `selectedValidatedModel` (cada uno con `id`, `elegible`,
  `cuello`, `utilizacion` y `soporta`), `override`, `eligibleCandidates` y
  `rejectedCandidates` (con `motivos`);
- advertencias: `blockers`, `warnings`, `assumptions`;
- materiales: `bom` (`modelo`, `nodos`, `construccion`, `filas`);
- `inactiveFields`;
- con acción: además `accion`, `permitida` y `auditada`.

**Errores:**

| Código HTTP | `codigo` | Cuándo |
|---|---|---|
| 400 | `cuerpo-invalido` | El cuerpo no es un objeto JSON |
| 400 | `campo-desconocido` | Una clave fuera del contrato |
| 400 | `accion-invalida` | Una acción que no está en la lista |
| 400 | `entrada-invalida` | El esquema rechaza el escenario (lleva `errores[]` con `campo` y `codigo`) |
| 401 | — | Sin sesión |
| 403 | — | Sesión sin el permiso `herramientas` |
| 409 | `dataset-distinto` | El catálogo cambió desde que se cargó la página |
| 409 | `huella-distinta` | El servidor evaluó otro escenario que el que se ve |
| 409 | `puerta-cerrada` | La puerta no permite esa acción. La respuesta incluye la evaluación, y la línea queda auditada con `permitida:false` |

**Línea de auditoría** (`fortinet.jsonl`): `ts`, `usuario`, `accion`, `permitida`,
`scenarioHash`, `datasetVersion`, `motor`, `modelo`, `quoteGate`, `override`, `bloqueos`
(solo los códigos).

## Esquema del escenario (versión 1)

Tipos y rangos exactos en `ESQ`, en `public/js/fortinet-motor.js`. Los valores por defecto
están en `POR_DEFECTO`.

| Grupo | Campos |
|---|---|
| `sitio` | `segmento` (branch · campus · dc) |
| `software` | `fortiOS` (7.4 · 7.6.0-7.6.2 · 7.6.3+), `inspeccion` (flow · proxy) |
| `topologia` | `rol` (none · spoke · hub), `enlaces[]` `{id, tipo, down, overlay, rol: activo o respaldo}`, `hubs`, `spokes`, `simultaneidadPct` |
| `trafico` | `interVlanMbps`, `picosNoConcurrentes` |
| `seguridad` | `capa`, `funciones[]`, `tlsCifradoPct`, `tlsExentoPct` |
| `remoto` | `activo`, `metodo` (ipsec · sslvpn), `usuarios`, `mbps`, `mfa` |
| `escala` | `usuarios`, `sesionesPorUsuario`, `sesionesMedidas`, `vidaSesionS`, `cpsMedido`, `vdoms`, `fortiAps`, `fortiSwitches` |
| `fisico` | `puertos{rj45_1g, rj45_10g, sfp_1g, sfpp_10g, sfp28_25g, qsfp28_100g}`, `poeW`, `psuRedundante`, `registro`, `registroGbDia`, `registroDias` |
| `disponibilidad` | `modo` (standalone · ha-ap · ha-aa) |
| `politica` | `crecimientoPct`, `techoPct` |
| `comercial` | `motivo` (nueva · renovacion · ampliacion · coterm), `anios` (1 · 3 · 5), `bundle`, `soporte`, `converter`, `sdwan[]`, `emsActivo`, `emsEndpoints`, `sandbox`, `sandboxModalidad`, `saseUsuarios`, `serieInstalada`, `justificacionEol` |
| `seleccion` | `manual` (el id de un modelo del catálogo vigente, o `null`) |

## Matriz de reutilización Aruba ↔ Fortinet

| Pieza | Aruba | Fortinet | Dónde vive | Nota |
|---|---|---|---|---|
| Tabla BOM, Excel, TCO, precio neto, perfiles, consolidado | Sí | Sí | `bom.js` | Compartido desde antes de esta etapa |
| Botón «Enviar al cotizador» con puerta | Sí (sin `antes`) | Sí, con `antes: confirmar('cotizador')` | `bom.js` `montarBotonCotizador(obtener, {id, antes})` | **Nuevo en esta etapa.** El id fijo cierra F04; `antes` permite que cualquier página condicione el envío |
| Repintado del BOM ante una referencia añadida | `renderBom` propio | `BOM.fijarRepintado(fn)` | `bom.js` | Nuevo. Fortinet ya no usa `BOM.sincronizar` porque el BOM sale de `RES` |
| BDL como una sola referencia hacia el cotizador | No aplica | Sí | `bom.js` `acompanantes()` | Nuevo. Portable a cualquier fabricante con SKU combinado |
| Ficha, ciclo de vida, puertos, alimentación, vistas | Sí | Sí | `ficha.js` | Compartido. Fortinet pasa como `seleccionado` el modelo *validado* |
| Estado en URL y almacenamiento | Sí | Sí, con `data-inactivo` y `extras` | `estado.js` | **Nuevo:** los grupos inactivos no viajan, y `h`/`ds` no se denuncian como ignorados. Aruba lo hereda sin cambios |
| Pestaña de fuentes y procedencia | Sí | Sí, más `#fuentesCalculo` por modelo | `procedencia.js` | Compartido |
| Multi-Underlay Builder | `{tipo, medio, down, up}` | `{tipo, down, overlay, rol}` | En cada página | A propósito no se comparte (`docs/rediseno-fortinet.md`, etapa 2) |
| **Rol activo/respaldo por enlace (F05)** | **No: `caudalTotal = Σ down`** (`dimensionador-aruba-edgeconnect.js`) | Sí | `fortinet-motor.js` `escenariosTrafico` | **Aruba tiene el mismo defecto que F05.** El candidato más claro a portar (riesgo R11) |
| Motor puro, API autoritativa y puerta de 4 estados | No | Sí | `fortinet-motor.js`, `routes/fortinet.js` | El patrón es portable; las reglas son del fabricante. Aruba decide hoy dentro de la página |
| Reglas de formulario como datos | No | Sí (`REGLAS`) | `fortinet-motor.js` | Portable como patrón |
| Validador de término de SKU | No aplica (HPE no codifica el término igual) | Sí | `server/services/terminoSku.js` | Específico de Fortinet |
