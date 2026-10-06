# graphify: procedencia y qué hace (y qué no) en este repositorio

Instalada el **2026-10-06** a petición del dueño («Instálala
https://github.com/Graphify-Labs/graphify.git»), desde
<https://github.com/Graphify-Labs/graphify>, commit **`5c7b847`** (release **0.9.77**, 5-oct-2026),
licencia Apache-2.0.

Convierte el repositorio en un **grafo de conocimiento** que se consulta en vez de buscar con
grep: `graphify query "<pregunta>"`, `graphify path A B` y `graphify explain X`. El código se
analiza **en local** con tree-sitter, sin LLM y sin enviar nada fuera. La skill se dispara con
`/graphify`.

## Qué se instaló, exactamente

| Pieza | Qué es | Dónde |
|---|---|---|
| La CLI `graphify` | Paquete de PyPI **`graphifyy`** (doble y), **fijado a 0.9.77** | En la máquina, fuera del repositorio |
| `SKILL.md` + `references/` + `.graphify_version` | Lo que copia el paquete, sin tocar una línea | `.claude/skills/graphify/` (versionado) |
| `graphify-out/` | El grafo construido | Ignorado por git: se construye en cada máquina |
| `.graphifyignore` | Qué no entra en el grafo | Raíz del repositorio (versionado) |

**Se comprobó que lo que trajo PyPI es lo que se revisó**: la `skill.md` del paquete instalado y
la del commit `5c7b847` dan el mismo SHA-256, y los módulos coinciden archivo por archivo.

Huellas de lo instalado (las comprueba `test/graphify-instalacion.test.js`):

- `SKILL.md`: `44b54637560fadb98fd8dc0769cf3979dbdeeaf4c75971a81ea620f243e16cae`
- `SKILL.md` + `references/*.md` en orden alfabético, concatenados:
  `6a94da6569cb583cf4dc12ff9cce8d597e0045cd08764ff9583cb0a372e7fad8`

Si una actualización cambia esas huellas, la prueba se pone en rojo hasta que alguien **lea** la
skill nueva y anote aquí la versión y las huellas. Es el mismo trato que `sqlite3` con
`allowScripts`: lo que se le ordena al agente no cambia sin que una persona lo revise.

## Qué NO se instaló, a propósito

**El modo «siempre activo».** En la 0.9.77, `graphify install --project` hace dos cosas para
Claude Code, aunque el README solo mencione la primera:

1. copia la skill a `.claude/skills/graphify/`;
2. llama a `claude_install`, que **registra hooks `PreToolUse`** en `.claude/settings.json`
   (sobre Bash, Grep, Read y Glob) y **escribe una sección `## graphify`** en el `CLAUDE.md`
   raíz que ordena consultar el grafo antes de leer archivos.

Lo segundo se deshizo con `git checkout` en cuanto se vio, por tres motivos:

- **El hook llama a un comando que no está en el repositorio.** `graphify` vive en la máquina
  de cada quien. En una sesión nueva, o en un ejecutor de CI, sin la CLI instalada, cada lectura
  pasaría por un comando que no existe.
- **Cambia cómo trabajan todas las sesiones, no solo la que lo pide.** Aquí la verdad del
  catálogo está en `legacyData/` y en las pruebas; un grafo construido ayer es un mapa de ayer,
  y una regla que manda consultarlo antes de leer el archivo antepone la copia a la fuente.
- **No es lo que se pidió.** Se pidió instalar la skill. El modo siempre activo es una decisión
  aparte del dueño.

Si un día se quiere, es `graphify claude install --project`, y la prueba de instalación se
pondrá en rojo para que esa decisión quede escrita en vez de colarse con una actualización.

**Para actualizar sin que se cuele**: `uv tool install "graphifyy==<versión>"`, después
`graphify install --project`, después `git checkout -- .claude/settings.json CLAUDE.md` (no hay
opción para instalar solo la skill en Claude Code), leer el diff de `.claude/skills/graphify/` y
anotar aquí la versión y las huellas nuevas.

## Lo que hay que saber antes de usarla

- **La CLI se instala fijada**: `uv tool install "graphifyy==0.9.77"` (o
  `pipx install "graphifyy==0.9.77"`). Si la skill no la encuentra, **se instala sola sin fijar
  versión** (`uv tool install --upgrade graphifyy`, o `pip install graphifyy
  --break-system-packages`): es lo que trae su paso 1 y no se tocó. Instalarla fijada antes evita
  que una sesión traiga sin querer una versión que nadie ha leído.
- **En una sesión en la nube la CLI no persiste**: el contenedor se rehace. `pypi.org` sí pasa
  por el proxy de egreso, así que la instalación funciona desde aquí.
- **Construir el grafo del código**: `graphify update .`, solo AST, sin LLM y sin coste. Medido el
  2026-10-06 sobre este repositorio: 15 s, 2.827 nodos, 4.772 aristas y 171 comunidades con el
  `.graphifyignore` (4.490 nodos sin él, la mitad ruido del markdown de otras skills).
- **`/graphify .` hace además una pasada semántica sobre los documentos** (`CLAUDE.md`,
  `PENDIENTES.md`, `docs/`) lanzando subagentes que leen cada archivo. En este repositorio son
  muchos y largos: cuesta tokens de verdad. Para preguntas sobre el código basta `graphify update .`.
- **Sin el extra `pdf`** (`pypdf`), los PDF se saltan. Está bien así: los PDF del repositorio son
  documentos de fabricantes, que entran al catálogo por los importadores con doble anclaje.

## Lo que se midió que hace bien y lo que no

- **Bien en el servidor**, que usa `require`: `graphify explain "rellenarSpec"` da quién la llama,
  qué pruebas la importan y dónde la mencionan `CLAUDE.md` y `PENDIENTES.md`.
- **Mal en el frontal.** Los módulos de `public/js/` son IIFE que se hablan por globales del
  navegador (`window.HuaweiMotor`, `FICHA`, `BOM`), sin `require` ni `import`, y graphify no
  enlaza esas llamadas. No vio que `dimensionador-huawei-netengine.js` llama a
  `HuaweiMotor.piezasBom`, y `graphify path "piezasBom" "filasBom"` no encuentra camino. **Un
  «no hay camino» en `public/js/` no prueba que no haya relación.**
- **Los catálogos de `legacyData/` no dan símbolos**: son literales de datos (`fortinetSkus.js`,
  `cotizadorCatalog.js`, `indexPR.js`, `guiaRoles.js`). Las cifras se preguntan a esos archivos,
  a `npm run catalogo` o al servidor, nunca al grafo.

## Qué lee el grafo, medido archivo por archivo (2026-10-06)

Cruzando `git ls-files` con el `source_file` de cada nodo, sobre el grafo hecho en `HEAD`:
**234 de 604 archivos versionados**.

| Grupo | Archivos | Por qué |
|---|---:|---|
| Código JS | 203 de 203 | Todo, con AST local. 6 de ellos son catálogos de datos y no dan símbolos |
| Markdown del proyecto | 26 | Por su estructura (títulos y enlaces), sin la pasada semántica |
| Scripts `.sh` y `package.json` | 5 | Código |
| Excluidos por `.graphifyignore` | 326 | Skills de terceros (159), imágenes (129), PDF de fabricantes (20), tipografías (11), copia de Starlink (7) |
| **Fuera sin pasada semántica** | 44 | Las 16 páginas HTML, los 14 workflows YAML, 7 JSON de datos, el PDF del manual y cuatro sueltos |

Las páginas HTML y los workflows son para graphify **documentos**: solo entran con `/graphify .`,
que lanza subagentes a leer cada uno con el modelo. Los documentos del proyecto suman unas 220.000
palabras (markdown 166.000, HTML 40.000, YAML 14.000): leerlos así cuesta tokens de verdad, y es
una decisión del dueño, no algo que haga un arranque.

## La CLI al arrancar

`.claude/hooks/graphify-cli.sh`, que llama `session-start.sh`, compara `graphify --version` con
el sello `.graphify_version` de esta carpeta: si falta, dice el comando fijado; si es otra versión,
avisa. No instala nada. Lo guarda `test/graphify-cli-hook.test.js` con un `graphify` falso en el
`PATH`.

**Y avisa cuando el grafo es de otro commit** (2026-10-06). graphify guarda en `graph.json` el
commit sobre el que se hizo (`built_at_commit`), y su propio aviso de grafo viejo vive en el modo
siempre activo, que aquí no se instaló. El arranque compara ese commit con `HEAD` y, si cambió algún
archivo, dice cuántos y da el comando: `graphify update .` (unos 13 s, sin LLM). Un commit que no
cambia nada, o un grafo sin commit registrado, no avisa; un commit que el clon no tiene, sí. Medido
en la sesión que lo escribió: el grafo era de `ff54b51`, `HEAD` era `bae4ad9`, y el aviso dijo «6
archivo(s)», los mismos que `git diff --name-only`. **Lo que no ve**: los cambios sin commitear,
que tampoco están en el grafo. La prueba usa un repositorio temporal, porque el `graphify-out/` de
cada máquina es de cualquier día, y se comprobó saboteando la comparación, el patrón y la rama del
commit desconocido.

**El grafo es un mapa para orientarse, no una fuente.** Ninguna cifra ni ninguna decisión sale de
él: sale del archivo al que apunta.
