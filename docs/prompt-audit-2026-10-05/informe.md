# Auditoría de prompts — 2026-10-05

Ejecutada con el subcomando `prompt-audit` de la skill `claude-api`, sobre `main` en `738aa80`.
**Propone, no aplica**: el diff está en [`propuesta.patch`](propuesta.patch) y no se ha
aplicado a ningún archivo. Se aplica entero con `git apply docs/prompt-audit-2026-10-05/propuesta.patch`,
o hunk a hunk.

## Supuestos

- **Alcance**: todo lo que llega a un modelo como texto en este directorio de trabajo. No se
  leyeron `.claude/settings*.json` (pueden guardar secretos) ni configuración de usuario fuera
  del repositorio.
- **Modelo objetivo de la aplicación**: Claude Opus 5, el que fija `server/services/aiSync.js:98`
  (`claude-opus-5`). **Modelo objetivo de `CLAUDE.md` y las skills**: el que corre la auditoría
  (sesión configurada con `claude-opus-5-5`).
- **La auditoría anterior (25/27-sep) ya está aplicada** desde `40e4d47` (2026-10-02): el rechazo
  y el corte de la IA tienen error propio, `fallbacks: 'default'`, `max_tokens` a 64.000, las
  reglas del prompt a volumen normal, `context-mode` retirada y cuatro skills que dejaron de mandar
  a herramientas ausentes. No se repite nada de eso.

## Inventario

| Superficie | Archivos |
|---|---|
| Prompt de aplicación y código que arma la petición | `server/services/aiSync.js` (sistema, esquema de salida, bloques del mensaje, modelo, `max_tokens`, `fallbacks`, caché) |
| Instrucciones del agente | `CLAUDE.md` (único; no hay `AGENTS.md`, reglas, comandos ni subagentes) |
| Skills | 26 en `.claude/skills/` |
| Instrucciones para Copilot | `.github/copilot-instructions.md` y 7 en `.github/instructions/` (regeneradas por `scripts/copilot-instrucciones.js`) |

## Resumen

Lo de más impacto, en orden:

1. **Todo `.txt` que se sube a «Sincronizar» falla.** Se manda como documento en base64 con
   `media_type: 'text/plain'`, y el contrato de la API solo admite base64 con
   `application/pdf`; el texto plano va como fuente `text`. El panel muestra un error genérico
   y no dice por qué.
2. **Seis afirmaciones de `CLAUDE.md` que el código contradice**: tres símbolos y un workflow de
   Fortinet que ya no existen (`PISO_POR_FUNCION`, `ejesDe()`, `traer-fortinet-datasheets.yml`) y
   tres recuentos que se quedaron atrás («dos casos» de contraste son ocho; «ocho fabricantes» y
   «`fabricantes: 8`» que ninguna prueba fija; «cinco páginas»).
3. **`CLAUDE.md` pesa 187 KB (29.480 palabras)** y se carga en cada sesión. Es del orden de
   50.000 tokens (estimado por caracteres: sin clave de API no se pudo medir con `count_tokens`),
   y buena parte es crónica — 92 fechas, 28 «medido» — que `PENDIENTES.md` ya guarda.

| Grupo | Hallazgos |
|---|---|
| 1 · Texto de prompt anticuado | 0 (se limpió el 2026-10-02) |
| 2 · Archivos de instrucciones | 7: 5 altos, 2 medios |
| 3 · Descripciones de herramientas | no aplica (la llamada no declara herramientas) |
| 4 · Configuración de la petición y arquitectura | 3: 1 alto, 2 medios; más 1 `flag` |

## Hallazgos

### Alta confianza

**1 · `server/services/aiSync.js:229-234`** — Grupo 4, forma de petición que la API no acepta.
> `type: 'base64', media_type: file.tipo === 'txt' ? 'text/plain' : 'application/pdf'`

Los tipos del SDK instalado (0.129.0, el que fija `package.json`) definen `BetaBase64PDFSource` con `media_type:
'application/pdf'` como único valor, y el texto plano como `BetaPlainTextSource` (`type: 'text'`,
el contenido tal cual). `firmaArchivo.js` clasifica como `txt` todo `.txt` o archivo sin
extensión, así que el camino se recorre. No se probó contra la API (no hay clave en la sesión): la
evidencia es el contrato del SDK. **Acción**: `rewrite` — `bloqueAdjunto()` arma el bloque
correcto para cada tipo, con su prueba.

**2 · `CLAUDE.md:516`** — Grupo 2, dato volátil contradicho.
> `PISO_POR_FUNCION` en `dimensionador-fortinet-fortigate.js` mapea cada función a su capa mínima

El símbolo salió de la página de Fortinet en `71d330e` (2026-09-22); hoy solo existe en Juniper y
Huawei. Las capas mínimas viven en `FUNCIONES` de `legacyData/fortinet.js` y `capaEfectiva()` en
`public/js/fortinet-reglas.js:179`. **Acción**: `rewrite`.

**3 · `CLAUDE.md:519`** — Grupo 2, dato volátil contradicho.
> `ejesDe()` en `dimensionador-fortinet-fortigate.js` es el único lugar que decide qué eje manda

`ejesDe` no existe en ningún archivo de `public/`, `server/` ni `scripts/`. Lo hace
`evaluarModelo()` en `public/js/fortinet-reglas.js:206`. **Acción**: `rewrite`.

**4 · `CLAUDE.md:519`** — Grupo 2, dato volátil contradicho.
> se bajaron el 2026-09-03 con `traer-fortinet-datasheets.yml`

No está en `.github/workflows/` ni en la historia de git de este repositorio. **Acción**:
`rewrite` — se dice que ese workflow ya no está y cuál es la vía de hoy.

**5 · `CLAUDE.md:333`** — Grupo 2, recuento contradicho.
> Dos casos hoy: `fortinet` (…) y `nokia-sr` (…)

`scripts/contrastes/` tiene ocho casos. **Acción**: `rewrite` sin número — los casos son los
archivos de esa carpeta, y los dos primeros se conservan como historia.

**6 · `CLAUDE.md:475`** — Grupo 2, afirmación contradicha.
> no es uno de los ocho fabricantes de equipo de red del portal, y forzarlo ahí rompería los conteos que varias pruebas fijan (`fabricantes: 8`)

Ninguna prueba fija `fabricantes: 8`, y `/salud` cuenta siete fabricantes (Arista se retiró).
**Acción**: `rewrite`.

### Confianza media

**7 · `CLAUDE.md:531`** — Grupo 2, recuento volátil.
> Las cinco páginas ordenan con `FICHA.ordenar(lista, desempate)`

`FICHA.ordenar` aparece en seis archivos. **Acción**: `rewrite` sin número («las páginas que usan
`ficha.js`»).

**8 · `server/services/aiSync.js:275-276`** — Grupo 4, sin contabilidad de tokens.
Nada registra `response.usage`: no se sabe si la caché del catálogo se aprovecha ni cuánto pesa
cada documento, que es el requisito para medir cualquier otro cambio. **Acción**: `add` — una
línea de log por análisis con entrada, caché leída y escrita, y salida.

**9 · `CLAUDE.md` entero** — Grupo 2, crónica en un archivo que se carga en cada sesión.
El porqué de cada regla es contexto y se queda; lo que sobra es la arqueología que lo acompaña
(quién, qué día, qué SHA, qué corrida), que `PENDIENTES.md` → *Cerrado recientemente* ya conserva.
**Acción**: `move` — dejar en `CLAUDE.md` la regla vigente con su porqué y llevar la crónica a
`docs/`. **Sin hunk**: es una reestructuración del archivo entero que merece su propio cambio
revisado, no un parche de auditoría.

**10 · `server/services/aiSync.js:197-204` y `server/routes/sync.js`** — Grupo 4, el modelo hace
un trabajo determinista. Con un CSV o XLSX, la llamada compara columnas reconocibles contra el
catálogo, que es exactamente lo que `public/js/contraste.js` ya hace sin IA y sin crédito.
**Acción**: `move` — dejar el modelo para los PDF y TXT y para las columnas que `contraste.js`
lista como ignoradas. **Sin hunk**: exige que `contraste.js` corra también en el servidor (hoy
solo cuelga de `window`).

### Para decidir (`flag`)

**11 · `server/services/aiSync.js:98`** — `claude-opus-5`. Claude Opus 5.5 es su sucesor y cuesta
menos (4/20 frente a 5/25 dólares por millón de tokens), pero su esfuerzo por defecto baja a
`medium`. Es una migración, no un resto anticuado: se hace aparte (`/claude-api migrate`).

## Lo que se miró y se queda

- Las reglas del prompt de sistema: ya están a volumen normal y cada una lleva su porqué.
- El campo `reason` del esquema: pide una justificación citando el documento, no reproducir el
  razonamiento, así que no corre riesgo de rechazo por extracción de razonamiento.
- «Tiene prioridad absoluta sobre tu conocimiento previo»: es contexto con su motivo.
- La descripción de `agent-browser` y la de `agent-reach`: ya declaran lo que este repositorio
  decidió (Playwright para comprobar; egreso bloqueado).
- Las prohibiciones de las skills de seguridad: son reglas de seguridad, no estilo.

## Verificación

Con el parche aplicado sobre `738aa80`: `npm run verificar` da **779/779** pruebas en verde (una
nueva, la del `.txt`). El único aviso de lint es previo y está en la copia canónica de Starlink,
que no se toca. `git apply --check` confirma que el parche aplica limpio.
