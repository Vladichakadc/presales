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
y a estas rutas.
