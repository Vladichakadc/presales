# Sincronización Inteligente de Catálogo

Documentación oficial del módulo. Explica **qué hace**, **por qué está partido en dos mitades**
y **cómo se publica un cambio** — desde el panel del portal o desde la línea de comandos.

El módulo revisa el catálogo de un fabricante con la IA (Claude) y propone correcciones:
métricas técnicas desactualizadas, precios, licencias, niveles de soporte y SKUs, más modelos
que falten. Opcionalmente se le sube un documento de referencia (datasheet o lista de precios)
del que extrae los valores exactos.

## Regla de oro

**La IA propone; una persona revisa un diff; el catálogo cambia por un PR.** Nunca al revés.
Este catálogo ya tuvo una vez un modelo inexistente con precio y specs creíbles, y todo el
diseño de abajo existe para que eso no vuelva a pasar. Un dato falso con pinta de verdadero es
el peor resultado posible en una herramienta de preventa: alguien lo cita delante de un cliente.

## Las dos mitades, y por qué

El catálogo de producción es **efímero**: se resiembra desde `server/seed/legacyData/` en cada
despliegue. Esto tiene una consecuencia que decide toda la arquitectura del módulo: **escribir
en la base de producción no persiste** — el cambio se perdería en el siguiente deploy. Por eso:

| Acción | Qué hace | Producción | Local |
|---|---|---|---|
| **Analizar** (`POST /api/sync/analyze`) | Lee el catálogo vigente + el documento y llama a la IA. Devuelve una lista de cambios. **No escribe nada.** | Sí | Sí |
| **Aplicar a base local** (`POST /api/sync/apply`) | Escribe los cambios en la base SQLite. Solo para iterar en local. | **No** (503) | Sí |
| **Descargar propuesta** (cliente) | Serializa los cambios al JSON que consume el importador. | Sí | Sí |
| **Aplicar de verdad** (`aplicar-propuesta.yml`) | Aplica la propuesta sobre `legacyData/` con anclaje y abre un PR. | — (corre en Actions) | — |

Analizar es seguro en producción y además es lo correcto: como la base es lo que se sembró
desde `legacyData/`, analizarla es analizar exactamente lo que se está sirviendo. Y falla
cerrado sin `ANTHROPIC_API_KEY` (`aiSync` lanza `SinClave` → 503): **ya no existe** el mock que
antes inventaba propuestas sin clave, así que no hay forma de que devuelva un dato falso por no
tenerla.

## El camino que publica un cambio

```
   Panel «Sincronización»                GitHub Actions
   ┌──────────────────────┐              ┌───────────────────────────────┐
   │ Analizar (IA)        │              │ aplicar-propuesta.yml         │
   │  ↓ cambios           │  descargar   │  1. importar-propuesta --aplicar (con anclaje)
   │ Descargar propuesta ─┼──JSON──────► │  2. npm run verificar         │
   └──────────────────────┘   pegas el   │  3. abre PR sobre legacyData/ │
                               JSON       └───────────────┬───────────────┘
                                                          │  revisas el diff
                                                          ▼
                                                    merge → deploy
```

1. En el portal, **IA Sync → Analizar**. Sube un documento si quieres que mande sobre el
   conocimiento previo del modelo.
2. **Descargar propuesta**: baja un `propuesta-<fabricante>-<fecha>.json`.
3. En GitHub → **Actions → aplicar-propuesta → Run workflow**, y pega el contenido del JSON.
   (Se puede hacer desde la app de GitHub en el móvil.)
4. El workflow aplica **solo lo que ancla**, corre `npm run verificar`, y si todo pasa **abre
   un PR**. Revisas el diff y lo fusionas; Railway despliega desde `main`.

El token con permiso de escritura al repositorio vive **en Actions**, nunca en el servicio
desplegado — que es el que sirve los precios detrás del muro de acceso. Enviar ese token al
servidor sería ampliar su superficie a cambio de ahorrarse un paso.

## El anclaje: por qué no se cree a la propuesta sin más

`scripts/importar-propuesta.js` no aplica un cambio por el hecho de que lo diga la IA. Un
`UPDATE` solo entra si **su `oldValue` coincide de verdad con lo que el catálogo dice hoy**,
sobre un modelo que existe, con una URL de fuente oficial (`https://…`). El razonamiento: *si
la propuesta se equivoca sobre lo que el catálogo dice ahora, no hay razón para creerle lo que
dice que debería decir*. Una cifra suelta siempre parece plausible; una que además acierta el
valor que va a sustituir, mucho menos.

- Las **altas** (`type: NEW`) se reportan pero **nunca se aplican solas**: dar de alta un
  modelo es justo donde entró aquel producto inventado. Las escribe una persona.
- Los **precios** viven en `cotizadorCatalog.js`, no en los archivos de specs; el importador
  los aparta.
- El `newValue` se escribe como **literal de dato**, con escapado completo (barra invertida,
  comilla, salto de línea). Puede venir de un documento subido por cualquiera, así que no es
  una cadena de confianza: se guarda como texto, nunca como código.

Y `npm run verificar` dentro del workflow es el segundo muro: si la escritura dejara un archivo
inválido, las pruebas no pasan y el PR no se abre.

## Cargar la fuente oficial sin IA (por fabricante)

Aparte del análisis con IA, cada fabricante tiene en su pestaña **«Fuentes y Referencias»** un
control **«Cargar fuente oficial»** (visible para quien tiene el permiso `sync`). Sube el
datasheet o la lista de precios (PDF, Excel/CSV o texto) y **la procedencia de ese fabricante
se actualiza al instante**, sin gastar crédito de IA: la pestaña muestra el documento como
fuente **«Cargada»**, con su fecha, su hash SHA-256 y un enlace para consultarlo.

**Qué hace y qué no** — la distinción es la misma regla de siempre:

- **Sí:** registra qué documento oficial hay, de qué fecha, y guarda el archivo para poder
  abrirlo. Es conciencia de la fuente sin coste.
- **No:** *no* reescribe las cifras del catálogo. Subir un documento no es haberlo contrastado;
  estampar «verificado hoy» sobre números que nadie comparó sería la mentira que este catálogo
  prohíbe. Convertir el documento en cambios sigue siendo del importador (`npm run …`, con
  contraste, gratis) o del análisis con IA (crédito).

### La ventana de contraste (Excel/CSV)

Al subir una fuente **tabular** (Excel, CSV, TSV o TXT con tabla), en el acto se abre una
ventana que **contrasta el documento con el catálogo vigente en el navegador, sin IA y sin
crédito**, y enseña qué trae de nuevo. La regla vive en `public/js/contraste.js`
(`window.CONTRASTE`); el parseo (SheetJS, cargado bajo demanda) y el pintado, en
`public/js/index.js`. Devuelve cuatro montones, porque son cuatro cosas distintas:

- **Cambios** — el modelo existe y una columna reconocida trae un valor **distinto** (comparado
  por valor, no por formato: «300» y «300 Mbps» no son un cambio).
- **Altas** — el documento trae un modelo que **no** está en el catálogo. Se reportan, y por la
  misma regla de siempre **nunca** se aplican solas: dar de alta un modelo se hace a mano.
- **Sin cambio** — coincidencias que ya están al día (solo se cuentan).
- **Columnas ignoradas** — cabeceras que no casan con ningún campo del catálogo. Se **listan**,
  no se adivinan: reconoce una columna solo si su cabecera es un campo real (o un alias
  explícito, y solo si ese campo existe para ese fabricante). Nunca inventa un mapeo.

Es una **vista previa**, no el importador: no escribe nada. Desde la ventana se marcan los
cambios y se **descarga la propuesta** con la forma exacta que consume `npm run propuesta` y
`aplicar-propuesta.yml` — así el cambio pasa por el mismo anclaje (`oldValue` que casa con el
catálogo de hoy, URL de fuente oficial) y por un PR revisable. Un **PDF** o un texto libre no
se contrastan aquí —extraer una tabla de un PDF sin equivocar de fila es justo lo que este
repositorio no automatiza—: la ventana lo dice y remite al análisis por IA o a los importadores.

**Dónde viven los archivos.** En el volumen persistente (`AUTH_STATE_DIR/fuentes/`), igual que
`usuarios.json` — no en la base de catálogo, que es efímera y se resiembra en cada despliegue.
Así los documentos subidos sobreviven a un deploy. El nombre en disco lo genera el servidor
(`<fabricante>-<id>.<ext>`), nunca el del archivo subido, y el tipo se decide por la firma del
contenido (415 si no es PDF/XLSX/CSV/TXT). `server/fuentesSubidas.js` es el módulo; las rutas
son `POST /api/fuentes/:vendor` (permiso `sync`) y `GET /api/fuentes/:vendor/documento/:id`
(sesión válida).

## Documentos que acepta

El tipo se decide **leyendo la firma del contenido** (`server/services/firmaArchivo.js`), no la
extensión que declara el navegador —esa la controla quien sube el archivo—:

- **PDF** (`%PDF`) → va como documento a la IA.
- **Excel `.xlsx`** (firma ZIP `PK`) y **CSV/TSV** → se convierten a texto tabular con SheetJS.
- **Texto `.txt`** → va como documento de texto plano.

Cualquier otra cosa recibe **415** en vez de mandarse a la IA como un binario etiquetado de PDF.

## Desde la línea de comandos (equivalente sin panel)

```
npm run propuesta -- propuesta.json            # simulacro: enseña qué haría, sin escribir
npm run propuesta -- propuesta.json --aplicar  # escribe sobre legacyData/, para revisar en git
```

La propuesta es lo que descarga el panel, o un `{ "vendor": "...", "cambios": [ ... ] }` a mano.

## Configuración en producción

Para que **Analizar** funcione en el servicio desplegado hay que definir `ANTHROPIC_API_KEY` en
las variables de Railway. Sin ella, el panel lo dice y no deja pulsar Analizar (el servidor
respondería 503). El permiso `sync` (hoy solo el rol administrador) es lo que da acceso al panel
y a estas rutas. **Una variable nueva solo la toma el proceso tras un arranque nuevo**: Railway
redespliega al guardarla, así que espera a que el deploy llegue a SUCCESS antes de probar.

### Qué dice cada error del panel

El mensaje que ves viene del servidor y distingue la causa, para no mandarte a revisar el
catálogo cuando el problema es la clave:

| Mensaje | HTTP | Causa | Qué hacer |
|---|---|---|---|
| «Falta `ANTHROPIC_API_KEY`…» | 503 | La variable no está en el entorno | Definirla en Railway |
| «La `ANTHROPIC_API_KEY` configurada no es válida (401)…» | 503 | La variable está pero la API la rechaza | Revisar el valor: clave de API vigente (`sk-ant-api…`), sin espacios ni saltos de línea al pegarla, del mismo espacio de trabajo |
| «La cuenta de la API de IA no tiene saldo suficiente…» | 503 | La clave es válida pero la cuenta no tiene crédito (400 «credit balance is too low») | Añadir créditos en la consola de Anthropic (Plans & Billing) |
| «…límite de uso (429)…» | 429 | Límite transitorio de la API | Esperar unos segundos y reintentar |
| «Error analizando con IA» | 500 | Cualquier otra cosa | Revisar los logs del servidor (`[AI Sync] Error llamando a Claude`) |

El detalle completo del fallo siempre queda en los logs del contenedor con el prefijo
`[AI Sync]`, aunque al usuario se le muestre el mensaje corto.
