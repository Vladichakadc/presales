# CLAUDE.md

Guía para Claude Code (claude.ai/code) en este repositorio. Aquí va **la regla vigente y su
porqué**, no su historia: la crónica (qué día, qué se midió, qué corrida, qué sabotaje) está en
`docs/claude-md-cronica.md`, que no se carga en cada sesión, y lo cerrado en
`PENDIENTES.md` → *Cerrado recientemente*. Si una regla de aquí parece arbitraria, su motivo
completo está allí.

## Instrucciones permanentes del dueño

- **Idioma: todo el texto visible (UI, etiquetas, mensajes, comentarios explicativos) en
  español**, y la conversación también. Los identificadores de código, en inglés.
- **El trabajo va a producción.** El servicio `presales-web` de Railway (proyecto `Presales`,
  entorno `production`) despliega desde `main`: terminar un cambio es fusionarlo en `main` y
  empujar, sin preguntar y sin dejarlo aparcado en una rama. Eso no autoriza a empujar sin
  verificar: ver *Desplegar*.
- **Recordar siempre lo que falta.** `PENDIENTES.md` es el registro vivo. Al empezar una tarea se
  buscan los puntos abiertos que la tocan (no se lee entero: casi todo es historia); al terminar
  se actualiza (lo cerrado a *Cerrado recientemente*, lo nuevo a su sección) y **se resume al
  usuario al cerrar cada entrega**, aunque no lo pida. Un pendiente bloqueado por política de
  egreso se reporta como tal, con el dominio y el comando que lo cierra desde una máquina con
  acceso; no se rodea el bloqueo ni se rellena el dato a ojo.
- **Proponer una mejora al cerrar cada entrega**, junto al resumen de pendientes: **una**, la
  mejor, salida de lo que se acaba de tocar (no de un catálogo genérico), con su porqué y su coste
  (qué evita, qué cuesta, qué se rompe si se hace mal). Se puede rechazar sin discusión: no se
  implementa sola ni se da por aprobada por silencio. Si no hay ninguna que merezca la pena, se
  dice eso en vez de inventarla.
- **Informe de relevo en cada entrega** (decisión del dueño, 2026-10-27: «de aquí en adelante, un
  informe de pendientes y mejoras para que la cuenta servicioiptv2025@gmail.com continúe; van a
  trabajar en el proyecto juntos»). En el commit que fusiona cada entrega en `main` se reescribe
  `RELEVO.md`: qué se entregó, los pendientes por prioridad con lo que los cierra, las mejoras
  propuestas sin decidir, lo que decide el dueño y cómo retomar. Complementa el traspaso (punto
  siguiente): el traspaso es el estado de UN tema en SU rama mientras se trabaja; el relevo, el
  resumen de todo lo pendiente en `main` al cerrar. Lo que está en curso no se apunta en el
  relevo (una tabla común chocaría en cada fusión): lo dice `npm run traspasos`.
  `test/relevo.test.js` frena un relevo sin sus secciones o más viejo que `PENDIENTES.md`.
  **Una entrega se nombra por fecha y número de PR** (`Última revisión: AAAA-MM-DD · PR #N` en
  `PENDIENTES.md`, `Última actualización: AAAA-MM-DD · PR #N` en `RELEVO.md`, el mismo PR en los
  dos), nunca por ordinal: dos sesiones en paralelo tomaban el mismo número. Por eso el PR se abre
  antes del commit de cierre, que ya lleva su número. Las revisiones viejas con ordinal no se tocan.
- **Las decisiones del dueño no se toman por silencio.** Cuando el dueño pide «ejecuta los
  pendientes», la opción recomendada de una decisión pendiente se ejecuta y se anota; si no, se
  pregunta.
- **Trabajo en paralelo y traspaso entre sesiones** (`docs/traspaso/README.md`). Varias sesiones,
  a veces de cuentas distintas, trabajan a la vez y solo comparten GitHub. Al empezar, `npm run
  traspasos` dice qué temas tienen rama y qué archivos declaran, y los PR abiertos sin traspaso
  con los suyos: **no se toma un tema ni un archivo ajeno**. Cada tema va en su rama con `docs/traspaso/<tema>.md` (de `PLANTILLA.md`) al
  día en cada commit, y se empuja a menudo: lo no empujado se pierde si la sesión se corta.
  Retomar es leer ese traspaso y seguir su «Siguiente paso». `PENDIENTES.md` y `CLAUDE.md` se
  tocan solo al fusionar, y en ese commit el traspaso se borra.
- **Nunca se inventa un dato.** Un campo sin fuente queda en `null` y la pantalla lo dice («sin
  dato», «consultar», «sin cotizar»). Un resumen de buscador o de un tercero no es fuente: el dato
  entra desde el documento oficial, por los importadores con anclaje o leído y citado en
  `server/seed/legacyData/fuentes.js`.

## Skills instaladas

Claude Code carga solo lo que hay en `.claude/skills/`; esta tabla dice qué es cada una **en este
repositorio**, que es lo que se desincroniza. Una skill que describe otro stack (React, Vite,
Tailwind…) se retira: empuja el trabajo hacia una arquitectura que aquí no existe.

| Skill | Para qué sirve aquí |
|---|---|
| `deployment-practical` | Arquitectura e IaC concretas; la que aplica al ciclo de Railway. |
| `file-style-conventions` | Sin emoji fuera de `.md`; los `.yml` terminan con un solo salto de línea. |
| `vibesec` · `insecure-defaults` · `sharp-edges` | Código seguro, valores por defecto que fallan abiertos, APIs fáciles de usar mal. |
| `supply-chain-risk-auditor` · `codeql` · `semgrep` · `semgrep-rule-creator` · `sarif-parsing` | Dependencias y análisis estático. |
| `variant-analysis` · `fp-check` · `audit-context-building` · `differential-review` · `code-review-guide` | Auditoría y revisión de diffs. |
| `frontend-design` · `feature-planning` · `project-kickoff` · `database-designer` | Interfaz (HTML y JS a mano, sin build), planes por archivo, arranque, modelo Sequelize. |
| `accessibility` | WCAG 2.2 sobre HTML y ARIA nativos (de ECC, MIT; las secciones de iOS y Android no aplican). Lo que manda es `e2e-accesibilidad.js` (axe 2.1 AA): un criterio 2.2 que merezca frenar se convierte en una comprobación de esa batería. Ver su `LEEME.md`. |
| `agent-browser` | Explorar una pantalla por su árbol de accesibilidad. **Explorar con agent-browser, comprobar con Playwright**: `pantallas`, `contraste`, `e2e` y `manual` siguen en Playwright porque son lo que CI mira. Pide `--executable-path` al Chromium de `/opt/pw-browsers`. |
| `agent-reach` | Router a 16 plataformas sociales. **Desde este contenedor no trae nada** (el proxy de egreso corta las 16); sirve desde una máquina con salida. Lo que traiga es lectura humana, nunca vía de escritura a `legacyData/`. Credenciales: ver su `LEEME.md`. |
| `graphify` | Grafo de conocimiento del código (`graphify update .`, `query`, `path`). Solo la skill: el modo «siempre activo» se dejó fuera a propósito. CLI fijada a 0.9.77 con su extensión `pdf`, que el arranque instala si falta (el grafo no lo construye). **El grafo orienta, no es fuente**: enlaza bien el servidor (`require`) y no los módulos de `public/js/` (globales del navegador). |
| `skill-creator` · `skill-usage-insights` · `skill-feedback-adaptation` · `skill-official-updater` · `self-learning` | Sobre las propias skills y el registro de corridas (`.claude/learning/`, ignorado por git). |

Siete skills tienen copia para Copilot en `.github/instructions/*.instructions.md`: se regeneran
con `node scripts/copilot-instrucciones.js`, y `test/copilot-instrucciones.test.js` frena una copia
que ya no dice lo que su skill.

## Overview

Presales: herramientas internas de preventa de equipos de red —calculadoras de
dimensionamiento, cotizador/BOM y guía de diseño— para **Huawei, Cisco, Fortinet, MikroTik,
Aruba, Nokia y Juniper** (siete fabricantes; Arista se retiró por completo en agosto de 2026),
más el módulo de Starlink LEO. Express + SQLite que sirve páginas HTML/CSS/JS a mano tras un
login, en un solo servicio de Railway (mismo patrón que los proyectos hermanos `chikisdtv` y
`credifuturo`, sin cliente compilado).

## Desarrollo

```
npm install
npm run dev        # node --watch server/server.js, http://localhost:4000
npm start          # node server/server.js
```

Sin build: `public/*.html` y `public/js/*.js` se sirven tal cual. `DATABASE_PATH` (ver
`.env.example`) decide dónde vive el SQLite; sin ella, `./database.sqlite`. Con la base vacía,
`server/seed/seedCatalog.js` siembra el catálogo al arrancar (borrar la base fuerza la resiembra).
Sin `AUTH_PASSWORD` nadie entra: en local el servidor avisa, y con `NODE_ENV=production` **se
niega a arrancar** (fallo cerrado deliberado). `AUTH_USER`, `SESSION_SECRET` y `AUTH_STATE_DIR`,
en `.env.example`.

```
npm run verificar   # lint + pruebas: lo que hay que pasar antes de empujar
npm test            # node --test, sin dependencias
npm run lint        # eslint
npm run auditar     # freno de las dependencias: npm audit con excepciones declaradas y caducidad
npm run catalogo    # inventario: cobertura por campo, ciclo de vida, precios, procedencia, pantallas
npm run pantallas   # conduce las pantallas en Chromium y captura cada una
npm run contraste   # contraste antes/después de un refactor (casos en scripts/contrastes/)
npm run e2e         # batería de flujos completos en Chromium (levanta su servidor)
npm run limites     # recorrido de valores límite por los dimensionadores (semanal en CI)
npm run puerta      # comprueba que el muro de acceso sigue cerrado en una instancia en marcha

# Una sola pieza
node --test test/sync-seguridad.test.js                              # un archivo de pruebas
node --test --test-name-pattern="firma" test/sync-seguridad.test.js  # una prueba, por nombre
E2E_SOLO=e2e-asentar npm run e2e                                     # una batería
npm run contraste -- nokia-sr --base=http://127.0.0.1:4000          # un caso de contraste

# Importadores: anclan contra lo ya verificado antes de escribir en legacyData/
npm run cps         # cps de Fortinet desde el Product Matrix (ancla contra sess)
npm run matrix      # contrasta una edición del Product Matrix (PDF) celda a celda; solo compara
npm run cisco       # contrasta las fichas HTML de Cisco y Meraki (carpeta traída) celda a celda; solo compara
npm run juniper     # cifras de la línea SRX
npm run mikrotik    # matriz de pruebas de las fichas de MikroTik (carpeta de HTML traída; --check, --dry)
npm run huawei      # cifras y fin de venta de Huawei (--check, --plantilla, --eol, --force)
npm run figuras-huawei # figuras de Huawei bajadas con la sesión del dueño (procedencia.json; dry-run salvo --aplicar)
npm run skus        # referencias de pedido de Fortinet desde la price list
npm run lista-aruba # lista del distribuidor de Aruba: dry-run salvo --aplicar
npm run propuesta   # aplica una propuesta de la sincronización sobre legacyData/, con anclaje

# Fuentes y documentos (lo que descarga necesita salida a internet: IMPORTAR-CATALOGO.md)
npm run traspasos   # temas en curso: ramas con docs/traspaso/<tema>.md y PR abiertos sin él (solo lee)
npm run vigia       # ¿cambió el documento de cada fuente? (hash contra fuentes.lock.json)
npm run vigencia    # ¿desapareció algún modelo de Aruba de su guía de pedido oficial?
npm run candidatas  # grupo de control: distingue el 403 de un fabricante del de un proxy
npm run datasheets  # PDF oficiales de HPE a public/datasheets/
npm run manual      # manual de usuario a PDF (docs/manual-usuario/)
```

`pantallas` y `contraste` hablan con un servidor ya arrancado en modo producción (`e2e` levanta el
suyo), con base y credenciales de usar y tirar: un `AUTH_STATE_DIR` reutilizado conserva el
`usuarios.json` anterior y rechaza la clave nueva, y una base que ya existe no se resiembra.

```
NODE_ENV=production PORT=4000 AUTH_USER=presales AUTH_PASSWORD=local SESSION_SECRET=local \
  DATABASE_PATH="$(mktemp -d)/db.sqlite" AUTH_STATE_DIR="$(mktemp -d)" node server/server.js &
AUTH_USER=presales AUTH_PASSWORD=local npm run pantallas -- --base=http://127.0.0.1:4000 --salida=/tmp/capturas
AUTH_PASSWORD=local npm run contraste -- --todos --base=http://127.0.0.1:4000
```

`contraste --todos` reescribe además `scripts/contrastes/cobertura.lock.json`, que se versiona en
un commit aparte. **Cada script de `package.json` tiene que aparecer en este archivo**
(`test/claude-md-comandos.test.js`): uno que no se menciona es uno que la siguiente sesión no sabe
que existe.

**Hooks de `.claude/`** (registrados en `.claude/settings.json`, versionado; `settings.local.json`
sigue ignorado):
- `session-start.sh` (solo en remoto): lista los temas en curso de otras sesiones (`npm run
  traspasos`, antes de instalar nada y sin cortar el arranque si falla), `npm install`, comprueba Playwright y Chromium, **instala
  la CLI de graphify fijada al sello de la skill si falta** (con `uv`, nunca `--upgrade`; si falla,
  dice el comando y sigue; otra versión ya instalada no la toca), avisa si el grafo local no refleja
  algún archivo que lee (se lo pregunta a graphify contra su manifiesto; sin CLI, compara el commit)
  y si `npm install` reescribió el lock. No instala Playwright, no construye el grafo, no
  inventa `AUTH_PASSWORD`, no siembra la base.
- `aprendizaje.sh`: anota cada `npm run …` en `.claude/learning/runs.jsonl` con tres estados
  (`PreToolUse` abre, `PostToolUse` cierra, lo que queda abierto lo salda el arranque como fallo),
  porque `PostToolUse` no se dispara cuando el comando falla.
- `pre-push.sh`: **avisa, no bloquea**, si el último `verificar` en verde (o el último `auditar`,
  que caduca a las 12 h) es anterior al último cambio. Los dos usan `lib-comando.js`, que distingue
  un comando que se ejecuta de uno que solo se menciona dentro de una cadena.

**Las pruebas cubren lo que ya falló, no lo que es fácil de probar.** `test/servidor-produccion.test.js`
arranca el servidor real con `NODE_ENV=production` y lo interroga por HTTP: es la única que cruza
todas las capas. `test/ayuda/navegador.js` carga los módulos de `public/js/` en Node con un doble
mínimo de `document` (sin jsdom). **El lint no es un manual de estilo**: cada regla activada
corresponde a un fallo que este repositorio ya tuvo (`no-undef`, `no-use-before-define`,
`no-eval`/`no-new-func` por la CSP); no se activa nada de formato.

## Desplegar

**Railway espera a CI** (`source.checkSuites: true` desde el 2026-10-05): un push con `verificar`
o `pantallas` en rojo se salta, y cada despliegue tarda lo que el job de `pantallas` (~7 min).
Los workflows programados (vigía, recorrido de límites) terminan en verde a propósito y reportan
en un issue, para no saltar un despliegue que espera.

**Antes de fusionar en `main`:**
- `npm run verificar` y `npm run auditar`.
- Arrancar con `NODE_ENV=production`: tres comportamientos solo existen ahí (el fallo cerrado sin
  `AUTH_PASSWORD`, la cookie `Secure`, las rutas `/api/sync/apply` en 503).
- Conducir la pantalla cambiada en un navegador, no solo la API: toda regresión real de este
  repositorio era invisible a `curl`. `npm run pantallas`, los casos de `contraste` que toquen, la
  batería `e2e` y `npm run puerta`.

**Después de empujar:** el despliegue en SUCCESS, sus logs con `[seed]`, la línea `[db]` y
`Presales corriendo en`, el healthcheck `/salud` superado (Railway lo usa como healthcheck; responde
503 con la base vacía) y la sonda: `sonda-produccion.yml` escucha el `deployment_status` que Railway
publica en GitHub, corre `/salud`, `/login` y `npm run puerta` contra el dominio real, y abre o
cierra un issue con la etiqueta `despliegue`. Lo que nunca termina lo vigila
`vigilia-despliegue.yml` (cada media hora, `scripts/vigilia-despliegue.js`): si la cabeza de `main`
lleva 90 min sin un despliegue en `success`, abre un issue `despliegue-en-espera` con la causa (CI en
rojo o sin terminar, en cola, sin despliegue) y lo cierra al desplegarse; un fallido es de la sonda.

**Agujeros conocidos de la red:**
- Un push de bot (`GITHUB_TOKEN`) no dispara workflows: los workflows que escriben llevan su
  resultado a una rama (`scripts/empujar-rama.js`, con la lease que espera la cabeza actual) y una
  persona abre el PR. GitHub no deja que Actions cree PR en este repositorio.
- La base de producción es efímera: se resiembra desde `legacyData/` en cada despliegue
  (`DATABASE_PATH=./database.sqlite`, fuera del volumen `/data`). Por eso un cambio de catálogo no
  necesita migración, y por eso `apply` de la sincronización no se usa en producción. Una base que
  sobreviviera serviría el catálogo anterior: el arranque lo dice en la línea `[db]`.

**Runtime y cadena de suministro:**
- **Node 24 LTS, declarado una sola vez** en `engines.node` (`"24"`); Railpack y los workflows lo
  leen de ahí. `test/version-node.test.js` se pone en rojo el día que termine su soporte
  (2028-04-30). Este entorno trae Node 22: el `EBADENGINE` es inofensivo.
- **Railpack instala con `npm ci`** (variable de servicio `RAILPACK_INSTALL_CMD`, que ninguna
  prueba ve: su confirmación es el log de construcción). `test/lock-origen.test.js` exige que el
  lock solo descargue de `registry.npmjs.org`, del archivo de su nombre y versión.
- `sqlite3` es la única dependencia que ejecuta código al instalarse: va aprobada **fijada a su
  versión** en `allowScripts` (nunca `false`: npm se salta el script en silencio y el servidor se
  cae al arrancar). `test/scripts-instalacion.test.js` se pone en rojo cuando Dependabot la sube.
- **Las acciones de GitHub, fijadas por commit** (`actions/<acción>@<sha> # vX.Y.Z`), solo
  oficiales, con Dependabot vigilándolas (`test/workflows-acciones.test.js`).
- **Un `node -e "..."` de un workflow no lleva comillas invertidas ni `$` sin escapar, ni una
  comilla doble que lo corte**: bash los procesa antes que Node (`test/workflows-node-e.test.js`).
  Un script largo va a un archivo y el workflow solo lo lanza: el del transporte vive en
  `scripts/transporte/` desde el 2026-10-28 (como `node -e` pasó el tope de 128 KiB de un argumento,
  y como heredoc bash seguía leyéndolo antes que Node). `traer({ docs, solo, fetch, dir })` se prueba
  sin red en `test/transporte-traer.test.js`: una regla nueva del transporte entra con su caso ahí.
- **`npm run auditar` falla cerrado**: un aviso alto o crítico frena; la salida es una excepción
  declarada con GHSA, motivo y caducidad de 90 días como mucho, nunca apagar el paso.
- Los jobs de navegador corren en `ubuntu-26.04` con **Playwright 1.61.1**, movidos juntos: la
  1.62+ activa RenderDocument y la cobertura del contraste solo cuenta el último caso
  (`test/workflows-imagen.test.js`; `contraste.js` se niega a escribir una cobertura incoherente).

**Lo que este entorno no alcanza.** El proxy de egreso deniega `presales.up.railway.app`, los
dominios de HPE, Huawei, Fortinet, Juniper y otros fabricantes: **un 403 del proxy es política de
la organización y se reporta, no se rodea**. Los ejecutores de GitHub Actions sí llegan, y los
documentos se traen con workflows de transporte (`traer-cisco-huawei.yml` —con `solo` y `rama`; su
lista está en `scripts/transporte/documentos.js` y una entrada nueva va ahí, que `npm run verificar`
carga con `test/transporte-documentos.test.js`—,
`traer-fortinet-pendientes.yml`, `candidatas-fuentes.yml`…) a ramas `fuente/*` que se leen y se
descartan, **una por corrida y nunca con `--force` a un nombre fijo** (pisaba la edición anterior); el workflow no da por guardada una pantalla de inicio de sesión (`test/traer-pantalla-login.test.js`),
y cada entrada HTML declara `debeContener` o `exploracion: true`: lo explorado sale EXPL, no OK
(`test/traer-exploracion.test.js`).
Huawei (`support.huawei.com`) y HPE (`buy.hpe.com`) niegan además el navegador
automatizado con Akamai, y eso tampoco se rodea; desde el 2026-10-07 Info-Finder pide iniciar
sesión, también bajo `support.huawei.com/enterprise/en/info-finder/`, y las páginas estáticas de
HedEx (`info.support.huawei.com/hedex/api/pages/…`) ya solo sirven el cascarón del portal. PDF4me (conector de claude.ai,
fuera del sandbox) lee una URL pública desde sus servidores,
pero su salida vive en `api.pdf4me.com`, que el proxy deniega: se le pide el texto con
`extract_text_by_expression`, nunca se le manda un documento de canal (la lista del distribuidor).
Se comprueba con `example.com` antes de culpar al fabricante: el 2026-10-07 volvió conectado y
fallaba con cualquier URL. Firecrawl corre dentro del sandbox y su dominio está
denegado. **Los logs y los artefactos de Actions** viven en un dominio que el proxy también
deniega: un fallo del e2e se lee por las anotaciones de la comprobación `pantallas`
(`gh api repos/<dueño>/<repo>/check-runs/<id>/annotations`, título `e2e`), que el workflow publica.

## Arquitectura

Un proceso Express (`server/server.js`) sirve la API (`/api/*`) y el frontend (`public/`). Todo
salvo la página de acceso va tras un muro: la API responde 401 en JSON y la navegación redirige a
`/login` conservando el destino y el querystring.

**El recorrido de un dato:** la verdad está en `server/seed/legacyData/*.js`, con su procedencia
en `fuentes.js` → `seedCatalog.js` la vuelca a SQLite con la base vacía → 
`services/catalogProjection.js` da a cada página la forma exacta que espera → la página la pide a
su ruta. En el navegador, lo común vive en módulos compartidos de `public/js/` (`ficha.js`,
`bom.js`, `estado.js`, `procedencia.js`). Un cambio de catálogo entra por un importador que ancla
contra lo verificado, queda como diff de `legacyData/` y llega a producción con el merge.

- `server/usuarios.js` — usuarios y roles en `AUTH_STATE_DIR/usuarios.json` (volumen persistente,
  no SQLite). Sin archivo, el primer administrador sale de `AUTH_PASSWORD`. Los permisos
  (`herramientas`, `usuarios`, `sync`) se declaran por rol en `ROLES`. El nombre de usuario se
  compara normalizado (`normalizarUsuario`). Nadie cambia la contraseña de otro; reponer un acceso
  es borrar `usuarios.json` del volumen. El alta (`POST /api/usuarios`) genera una contraseña de 24
  caracteres que se muestra una vez y obliga a cambiarla (`debeCambiar`). **Todo lo que se escribe en
  el volumen pasa por `server/escrituraAtomica.js`** (temporal, `fsync` y `rename`): un
  `usuarios.json` cortado se lee como «no existe» y rehace el administrador.
- `server/auth.js` — sesión `expiración.id.firma` firmada con una clave derivada de la credencial
  de cada usuario (cambiar una contraseña invalida solo sus sesiones); freno a la fuerza bruta por
  IP más retardo global (rotar `X-Forwarded-For` daba cuota nueva).
- **Autorización: `exige('permiso')`** en `server.js`; ocultar un enlace es comodidad, nunca
  control. Usa `req.baseUrl + req.path` (Express recorta el prefijo de montaje).
- `server.js` también: CSP estricta con helmet (`script-src 'self'`), sin `cors()`, SheetJS en
  `/vendor/xlsx.js` desde `npm:@e965/xlsx` (el `xlsx` de npm quedó abandonado con un aviso alto),
  `RENOMBRADAS` para páginas renombradas (conserva el querystring), `/salud` público.
- `server/models/` — Sequelize. `Product` es la tabla central, con `specs` JSON (campos numéricos
  por fabricante) en vez de decenas de columnas; `OpticCategory`/`Optic`, `Part`, `SupportTier`,
  `LicenseBundle`, `RoleRecommendation`, `SyncLog`.
- `server/services/catalogProjection.js` — el único sitio que da forma a las filas para cada página
  (`toIndexPR`, `toCotizadorCatalog`, `toDimensionador*`, `toGuiaRoles`, `toFuentes`).
  `fueraDeVenta()` aplica en portal, cotizador y guía la misma regla que `FICHA.rango()`.
- `server/services/cifrasCotizador.js` — casa cada línea del cotizador con su pareja del
  dimensionador; las cifras con pareja no se copian: el texto deja un hueco (`{fwd}`) que la
  siembra rellena (`rellenarSpec`), y lo que difiere sale «en revisión» con las dos cifras.
  También proyecta la guía (`proyectarGuia`) y declara la escala de unidades (`aMbps`).
- `server/routes/` — rutas finas. `fortinet.js` **evalúa** con el mismo `public/js/fortinet-motor.js`
  del navegador; `starlinkSizing.js`, con el mismo motor de Starlink.
- **Sincronización** (`routes/sync.js` + `services/aiSync.js`; documentación en
  `docs/sincronizacion.md`). **Analizar** corre en cualquier entorno; **escribir en la base, solo en
  local**. El cambio durable no pasa por `apply`: se descarga la propuesta y
  `aplicar-propuesta.yml` la aplica sobre `legacyData/` con anclaje (`npm run propuesta`: el
  `oldValue` tiene que casar con el catálogo de hoy, URL oficial obligatoria, las altas nunca se
  aplican solas). **Una hoja CSV/XLSX se contrasta primero sin IA** con `public/js/contraste.js` (el
  mismo archivo que el navegador): si reconoce todas las columnas no hay llamada al modelo ni hace
  falta clave; si no, el modelo recibe solo la columna del equipo y las no reconocidas. Un PDF o un
  texto van al modelo, **Claude Opus 5.5 (`claude-opus-5-5`) con `effort: 'high'` explícito** (su
  valor por defecto es `medium`), salida con esquema (`output_config.format`), `fallbacks:
  'default'` ante un rechazo, catálogo e instrucciones cacheados. Sin `ANTHROPIC_API_KEY`, lo que
  necesita el modelo responde 503 (`SinClave`); aquí vivió un simulacro que inventaba propuestas y
  se retiró. El tipo del adjunto lo decide la firma del contenido (`firmaArchivo.js`), no el
  mimetype.
- `server/fuentesSubidas.js` — carga manual de la fuente oficial por fabricante (permiso `sync`) en
  el volumen persistente: **actualiza la procedencia, no reescribe cifras** (subir no es
  contrastar). Una vigente por fabricante; la anterior pasa a un histórico consultable. Solo se
  borra lo cargado: lo de `fuentes.js` se quita con un commit.
- `server/seed/legacyData/fuentes.js` — la procedencia como datos: documento, URL, fecha (`null` si
  no consta, que nunca es «reciente»), `hash`, `estable`, `cubre` y `campos` (qué campos respalda,
  contrastados contra las claves reales de `MODELS`; `campos: null` es «no consta» y exige
  `dominio: 'precio'` o `porQue`) y **`modelos`** (qué equipos respalda: ids, series, códigos de
  ficha o `'*'`; `[]` es «ninguno» y la ausencia, «no declarado»; cada elemento existe en el
  catálogo, el texto de la entrada lo nombra y ningún equipo queda sin fuente:
  `test/fuentes-modelos.test.js`). La pestaña «Fuentes y Referencias» la pinta con dos columnas
  distintas: **Estado** (antigüedad) y **Vigilancia** (si el documento sigue siendo el mismo).

## Páginas y módulos del navegador (`public/`)

Cada página es un `.html` (marcado y `<style>`) más su script en `public/js/`. **Sin JavaScript en
línea**: la CSP es `script-src 'self'`, así que un `<script>` en línea o un `onclick=` no corren;
los manejadores van por la delegación de clics existente. `style=` en línea sí está permitido.

- `index.html` (portal): catálogos por fabricante, **Comparador** (`comparador.js`: ~30 filas en
  matriz, tres estados por casilla —`dato`, `sinDato`, `noAplica` declarado a mano en `NA` con su
  motivo, nunca deducido—, flecha de «mejor» solo entre cifras de la misma base, recuento de huecos
  por equipo), **Calculadora de Throughput** (`calculadora.js`: se dimensiona con la cifra de la
  capa que pide el perfil; un modelo sin esa cifra **se aparta con su motivo**, nunca se rellena
  con la de otra capa; la inspección TLS es otra ruta, no un peldaño; línea de cobertura por
  perfil) y el panel de sincronización. Ambas herramientas se repintan al cambiar un control.
- `cotizador.html`: BOM multifabricante. Recibe el BOM entero del dimensionador; la identidad de
  una línea (`identidadLinea()`) es el SKU para una referencia y fabricante+modelo para un equipo.
  Los filtros salen de `CATALOG`, no de una lista escrita.
- Dimensionadores: Huawei, Cisco, Fortinet, MikroTik, Aruba, Juniper, Nokia 7750 SR y Nokia 7220
  IXR (fabric leaf-spine, el único que no elige un equipo), más Starlink LEO.
- `guia-diseno-interactiva.html`: topologías; pinta lo que decide `proyectarGuia`. Cada rol lo
  pinta algún nodo y cada nodo tiene recomendaciones (`test/guia-topologias.test.js`). La guía
  **puede citar equipos fuera del catálogo** (decisión del dueño, 2026-10-07): salen marcados
  «Fuera del catálogo: cifras sin contrastar» y a «Consultar».
- `login.html`, `cuenta.html`, `usuarios.html`.

Módulos compartidos:
- `ficha.js` — selección de equipo y ficha completa en los siete dimensionadores de un equipo.
  **Elegido a mano y heredado no son lo mismo**: solo persiste lo que alguien eligió (desplegable,
  enlace, almacenamiento); lo heredado sigue al recomendado, y hay «Volver al recomendado».
  `FICHA.rango()` es la única regla de fin de venta: 0 vigente, 1 línea anterior (`legacy`), 2 fuera
  de venta (`eol` o `eolAnnounced.lastOrder` vencido). **Semáforo de ciclo de vida de cinco
  estados**: el verde solo se pinta si una fuente con `eolAnnounced` en sus `campos` respalda al
  fabricante (hoy Cisco y Juniper); los demás declaran que el catálogo no trae el ciclo de vida.
  Secciones comunes: características, alimentación (cinco estados: `true`, `false`, `'opcional'`,
  `'no-aplica'` y «no consta», nunca `undefined` leído como `false`), puertos (configuraciones
  alternativas, no acumulables; un chasis modular no publica densidad), **criptografía
  post-cuántica** (`seccionPqc`, de `m.pqc` con su fuente: `mlkem` —algoritmo ML-KEM, G2 con IOS XE
  26.1 y FortiGate con FortiOS 7.6.1—, `ppk` —clave precompartida de RFC 8784: SRX de gama alta,
  Catalyst 8000, ISR 1000 y ASR 1002-HX/1006-X con IOS XE 17.11/17.12, EdgeConnect y los 20 MikroTik
  con RouterOS 7.21 (donde su ficha o su manual dice «RouterOS v7», donde el changelog oficial de una
  versión posterior nombra el equipo, y CHR)— y `macsec` —MACsec/ANYsec
  simétrico, Nokia 7750 y SR-1x—, cada uno dicho como lo que es; la PPK de un sistema operativo no
  se extiende a un modelo sin documento de que corre esa versión (el boletín de fin de venta da la
  última de cada ASR: el 1001-X se queda en la 17.9, y lo dice como «no la trae», `pqcNo`); sin
  documento, «no consta»; **cada `pqc`/`pqcNo` cita su documento por la URL de su entrada en
  `fuentes.js` (`urls`)**, la prueba exige que esa entrada respalde el campo y declare al equipo, y
  la ficha («Documento oficial», solo `https`) y «Supuestos» la enlazan; el Comparador del portal lo
  da en una línea), licenciamiento, software,
  soporte, referencias de pedido (bajo demanda por modelo) y figuras con su página y rótulo literal
  (frontal, trasera y, opt-in `foto` + `fotoFuente`, una tercera pestaña con la foto de producto a
  color y su propio pie; Juniper y los Cisco que la tienen en su ficha —Catalyst 8500, ISR, ASR, siete
  Meraki MX y seis Secure Router—; las dos viajan también al Excel). Opt-in `inicial`: la cara por
  la que se abre la tarjeta (los Meraki de sobremesa, por la de puertos, que Meraki rotula «Back»);
  `frontNota`, gemelo de `rearNota`, dice por qué falta la frontal (ISR 1116-4P).
  **El ciclo de vida en los desplegables** (`opcionCiclo`, 2026-10-28): fuera de venta y fin de venta
  anunciado salen en rojo fijo y con su texto en el desplegable de la ficha y en el selector de
  modelo de cada página; una sola regla, nunca una marca escrita a mano (`test/ciclo-y-casillas.test.js`).
  El desplegable de la ficha lleva los fuera de venta que cumplen, detrás de los vigentes (Cisco y,
  desde el 2026-10-28, Fortinet: los que el motor solo aparta por `CICLO_VIDA`; elegir uno es un
  override que bloquea la cotización, `test/fortinet-combo-fuera-venta.test.js`).
  Van en su propio grupo al final (`optgroup.optg-fuera`, «Fuera de venta (N) · solo parque instalado»), con el
  contador y una nota que lo dicen; elegido uno, pastilla y barra roja (`test/ficha-combo-fuera.test.js`).
  `escalon` (los siete lo declaran): junto al recomendado, el N+1 (menor métrica estrictamente mayor
  en la cifra del desplegable, nunca fuera de venta; `comparable` lo limita a la misma familia o base
  de medida) y el diferencial de precio solo con precio en los dos; no toca la selección. En la
  tarjeta clavada (`panelFijo`, Aruba) va dentro del detalle: la compacta tiene que caber entera.
- `bom.js` — tabla del BOM, totales con las líneas sin precio contadas («sin cotizar») y Excel.
  `BOM.sincronizar()` repinta siempre (también sin candidato). Referencias añadidas a mano en una
  sola clave para los siete, `fabricante|sku`. Simulador de precio neto, TCO sobre las filas (qué
  es OPEX lo declara la página), perfiles multi-sede de todos los fabricantes en una clave (siete
  páginas; no la 7220 IXR ni Starlink; el `vendor` del perfil es la clave de la ruta de catálogo de su
  página —`nokia-sr` en el 7750— y `NOMBRE_FABRICANTE` la traduce al enseñarla), y el
  traspaso al cotizador: el equipo viaja como nombre (su precio lo pone `CATALOG`) y el resto del
  BOM como referencias; falla cerrado si la fila del equipo no casa. El Excel (ExcelJS) lleva
  «BOM» en el índice 0 y detrás **«Supuestos»** (`matrizSupuestos`: fecha, enlace, plataforma,
  resultado que declare `meta.supuestos`, parámetros de `ESTADO.escenario()` y las fuentes que
  **declaran** al equipo en `modelos`, o las que lo nombran si no declaran, con su «Asociación»); el
  consolidado multi-sede no la lleva. Con «Exigir PQC» (`#reqPqc`), «Supuestos» trae además la
  sección de la PQC exigida: si el equipo la cumple, su mecanismo, **la versión mínima de software**
  y la fuente, del `pqc` que cada página pasa en `meta.supuestos`. **El ciclo de vida del equipo** (2026-10-28):
  con `eol`, `eolAnnounced` o `legacy`, «Supuestos» trae su sección (último pedido, sucesor del boletín o
  inferido —dicho como tal—, boletín) y la hoja BOM un aviso en rojo; sin dato no se dice nada
  (`BOM.cicloDe`, `cicloDelEquipo`; `ciclo` en `meta.supuestos` de las siete páginas). El consolidado
  multi-sede, que no lleva «Supuestos», lo dice perfil a perfil en pantalla y en su hoja BOM: cada
  perfil guarda su `ciclo` al crearse, y uno guardado antes dice «sin dato de ciclo»
  (`cicloDePerfiles`, `avisoCicloConsolidado`; `perfiles` en el `meta` del consolidado). Al consolidar,
  `refrescarCiclo` pone al día con el catálogo de la página los perfiles de su fabricante (también los
  guardados sin ciclo), y `refrescarCicloTodos` pide al servidor el catálogo de cada otro fabricante
  presente (`/api/dimensionador/<fabricante>`); si la ruta falla o el modelo ya no está, el perfil
  conserva su foto y lo dice («ciclo a fecha de …», con el motivo). La hoja «Fotos del equipo» (`meta.fotos`: Aruba, Fortinet, Huawei,
  Cisco y Juniper) escribe bajo cada figura su leyenda opt-in (`frontLeyenda`/`rearLeyenda`), como la ficha. Detrás, la foto de
  producto con su pie (`foto`/`fotoFuente`, Cisco y Juniper).
  Llevan leyenda las figuras con números: las de Cisco, las 36 de Juniper y el Aruba 7010 (decidido
  figura a figura en `cisco-leyendas.test.js` y `vistas-leyendas.test.js`); en la tarjeta clavada
  (`panelFijo`) no va el desplegable, solo en la lupa, y el rótulo literal lleva su idioma (`lang`).
- `estado.js` — el escenario en la URL (manda si trae parámetros) y en el almacenamiento local;
  solo se serializa lo que difiere del valor por defecto; lo que va dentro de `[data-inactivo]` no
  viaja; un enlace con parámetros que la pantalla ya no entiende lo dice (`avisoOrigen`), salvo lo
  que la página declara migrar.
- `procedencia.js` — la pestaña de fuentes (leer, subir, borrar, contrastar en el acto con
  `contraste.js`: cambios, altas, sin cambio y columnas ignoradas; nunca adivina un mapeo).
- `navegacion.js` — barra de fabricante (anterior/siguiente conservando el paso, `Alt`+flechas).
- `tabla.js` — ordenación por columna; la coma es separador de miles y el punto decimal, y «sin
  dato» va siempre al final.
- `fuentes.js` — las tipografías no bloquean el render (va en `PUBLICO`).
- `public/controles.css` — la hoja común de los ocho dimensionadores con casillas (Starlink no:
  usa interruptores): el rojo del ciclo de vida en los desplegables (`#B42318`, nunca `--red`, que
  es el color de marca de cada página) y la fila de la casilla de función marcada, resaltada con el
  acento de la página al 6 % (AA con el texto gris), sin moverse de sitio.
- `funciones-activas.js` — el panel «Funciones activadas» arriba de la columna de resultados de esas
  ocho páginas (2026-10-28): una pastilla por casilla de función marcada, con el mismo resaltado que su
  fila y un clic que lleva a ella. Lee las rejillas `.cols`/`.dim` (parámetros en la primera hija,
  resultados en la segunda), con las mismas exclusiones que la hoja (`test/funciones-activas.test.js`);
  se repinta también cuando la derecha se recalcula. Sin tocar el código de ninguna página.
- `pqc.js` — **el requisito «Exigir PQC»** (2026-10-27), una sola regla para los siete
  dimensionadores y para el motor de Fortinet en el servidor: `''` no se exige, `'clave'` basta un
  mecanismo quantum-safe documentado (PPK, MACsec/ANYsec o ML-KEM), `'mlkem'` exige ML-KEM. Sin
  `pqc` documentado el equipo se aparta con «no consta en ningún documento oficial», nunca «no la
  tiene»; con ML-KEM exigido, una PPK o un MACsec no bastan y se dice qué trae. **Un «no» solo con
  documento** (2026-10-28): `pqcNo: {motivo, corto, fuente}` (hoy el ASR 1001-X, que su boletín deja
  en la 17.9) aparta con «no la trae — <motivo>» y la ficha y el Comparador lo dicen; nunca junto a
  `pqc`, y sin `fuente` se lee como «no consta». **Un `pqc` de un solo sistema operativo** (2026-10-28):
  `so`/`soNombre` (los gateways de Aruba, PPK solo con AOS-8); la página pasa el del escenario
  (`PQC.motivo(m, nivel, {so})`, también la hoja «Supuestos» por `meta.supuestos.so`) y, si no es
  ese, aparta con «con AOS 10 no consta»; sin `so` o sin contexto, la regla de siempre. Cada página lo
  ofrece en `#reqPqc` (mismas opciones, `test/pqc-requisito.test.js`) y carga `pqc.js` antes que su
  motor.

## Reglas del catálogo

- **Se dimensiona con la cifra de la capa que se pide; si el catálogo no la trae, el modelo se
  aparta con su motivo.** Nunca se sustituye por la de otra capa: produce propuestas cortas por un
  orden de magnitud (FortiGate 60F, 14,3x; SRX345, 10x). Aplica a la calculadora, al comparador y a
  cada dimensionador.
- **Fuera de venta se muestra, pero no se recomienda.** `eol` oculta el equipo del portal, el
  cotizador y la guía; en un dimensionador sigue visible para el parque instalado. Un fin de venta
  anunciado (`eolAnnounced: {pid, lastOrder, sucesor, url}`) se marca y sigue siendo recomendable
  hasta su `lastOrder`, y después cae solo. Un conjunto de fuera de venta que no casa con ningún
  modelo avisa al arrancar.
- **Precios:** `elp` (texto) con `elpN` (número), sin descuento de canal ni impuestos. Fortinet sale
  de una sola lista firmada (`2026Q3 Mid Price list_AMER_FINAL_EFF 090726.xlsx`): lo que no trae
  queda sin precio, marcado `fueraDeLista`, nunca con otra edición. Aruba tiene List Price del
  distribuidor solo donde el SKU está confirmado. MikroTik, Juniper y Nokia no tienen lista.
- **La lista del distribuidor de Aruba nunca entra al repositorio**: `npm run lista-aruba` extrae
  solo cinco columnas permitidas al CSV del cotizador y sus pruebas usan fixtures sintéticos.
- **Un importador ancla antes de escribir**: una fila se acepta solo si al menos dos columnas casan
  con lo verificado y ninguna lo contradice (`--force` pisa lo que difiere en una fila que sí
  ancla; `--sin-contraste`, para la que no). **El doble anclaje caza una fila desplazada, no una
  edición vieja**: entre dos documentos oficiales manda el más reciente, y si uno remite a otro,
  manda ese otro.
- **Los puertos, las piezas y las ópticas del BOM salen de la «Ordering Information» y de las
  matrices oficiales**, modelo a modelo; un «compatible» no es un «se pide», y lo que depende de
  una elección va en una línea «elegir una».
- **Renombrar una página exige redirigir la anterior** (`RENOMBRADAS`), conservando el querystring.

## Fabricantes: lo que cada uno tiene de propio

- **Fortinet** (`public/js/fortinet-motor.js`, `fortinet-reglas.js`; historia en
  `docs/rediseno-fortinet.md` y `docs/auditoria-fortinet-2026-09-23/`). **Arquitectura aprobada por
  el dueño el 2026-10-07: veredicto GO.** Una sola verdad: `evaluar(escenario, catálogo)` corre en
  el navegador y en `POST /api/v1/fortinet/evaluations`, que confirma cada salida comercial por
  huella y versión de catálogo (409 si difieren) y la audita. Ejes independientes (`EJES`) con su
  cifra oficial; las funciones fijan un **piso de capa**, no un recargo (`FUNCIONES`,
  `capaEfectiva()`); la inspección TLS es un eje propio; el overlay SD-WAN es un segundo techo
  (`min(capa, IPsec / fracción)` con un 6 % de ESP, supuesto declarado); sesiones y CPS derivados de
  los usuarios (30 s de vida media, supuesto editable); límites de plataforma sin techo de
  utilización. Los vecinos BGP salen de la **Maximum Values Table** de FortiOS 7.6.7 (su API,
  traída por Actions), anclada columna a columna con políticas y túneles del Product Matrix al
  cargar; sus filas de vecinos OSPF (los declarados a mano) y de VRF no se usan, y no publica
  rutas aprendidas. El BOM sale solo del modelo validado; la puerta READY/WARNING/DRAFT/BLOCKED bloquea
  Excel, copiar y enviar con un P0, un SKU sin casar o la lista vencida, y el override exige motivo.
  Si el override solo choca con `CICLO_VIDA` (cumple el escenario), su caja ofrece declarar ampliación o
  renovación en un clic (`motivo-ciclo`), que lleva a la justificación sin escribirla.
  Un SKU nunca se busca con el marcador `-DD`. Figuras desde la página «Hardware» de cada ficha.
  **HA y FortiGuard** (F3, 2026-10-28): una suscripción por nodo, salvo en activo-pasivo de las
  series que la guía de FortiOS 7.6.6 nombra (`haLicenciaUnica`: 40F, 60F, 70F, 80F, 100F y
  variantes, con su SKU de HA y su heartbeat), que admiten una sola. Con la casilla «Licencia FortiGuard
  única del par» (`comercial.haLicenciaUnica`, solo existe si es `true`: la huella no cambia) el BOM la
  cotiza —2 × SKU de HA con `precioHa` y un bundle, sin el combinado— si todo lo que pide la guía está; si
  no, sigue por nodo con su motivo. Los SKU a la carta no se registran al vSN: siguen por unidad y avisan.
  La página lo dice con `licenciaHa()` y `unicaCotizada()`.
- **Aruba** (`dimensionador-aruba-edgeconnect.js`, `aruba-reglas.js`, `motor-ingenieria.js`). El
  caudal es el **Multi-Underlay Builder** (filas `{tipo, medio, down, up, rol}`; un respaldo ocupa
  puerto pero no suma); `migrarEstadoV1()` traduce los enlaces viejos. **Cada enlace va a un puerto
  real** (`PUERTOS` en `aruba.js`, contado de su `ifaces`; `ArubaReglas.asignarPuertos`, más 2 LAN):
  un RJ-45 solo va a cobre nativo (en una jaula es «SFP 1G» con el transceptor 1000BASE-T), y el
  modelo sin puerto para algún enlace sale con su motivo. **Con el par EdgeHA**
  (`asignarPuertosPar`, 2026-10-27) se audita el par: cada enlace aterriza en un chasis, y cada uno
  reserva sus 2 LAN y el puerto de la interconexión, del mismo tipo en los dos («any LAN or WAN
  port […] match the media type and speed […] not MGMT», página EdgeHA del Orchestrator). La interconexión va
  por ESE puerto en el builder, el asistente de cableado y el BOM (`interconexionEdgeHA`): por cobre,
  un latiguillo y ninguna óptica; por jaula, 2 ópticas de una velocidad que esa jaula admite. El medio no elegido a mano sigue al
  caudal (todo RJ-45 del catálogo es de 1 GbE). Una elección manual que no cabe se respeta hasta
  que cambien los enlaces. Sin selector de segmento: el tamaño de sitio lo fija el arquetipo. EdgeConnect se dimensiona
  contra su rango WAN publicado; los gateways 9000/9100/9200, contra firewall, clientes y APs, con la
  capacidad del 9200 ligada a la licencia. Boost en bloques de 100 Mbps, un pool por fabric, máximo
  entre escenarios de falla; el breakout no descarga más de lo que cabe por Internet (M4). Central
  por serie (`CENTRAL_POR_SERIE`); IDS/IPS con su cifra (`idsMbps`, la de modo en línea: los
  gateways del VSG, los EdgeConnect de su data sheet `a00109847enw` y el EC-XS de su spec sheet;
  DTD solo en EdgeConnect). La línea
  AOS 8 (7000/7200) está **fuera de venta** (por fecha o por `RETIRADOS_SIN_FECHA`), visible para el
  parque instalado; sus **Reman** (SKU `…AR`) se siguen cotizando si la lista versionada los trae.
  **Ópticas de la línea EC-10xxx según el Hardware Reference Rev V** (ago-2026; el VSG remite a
  él): 1G y 10G en 10106/10108/10150, 25G solo en el 10150; el 10106/10108 tiene cuatro jaulas SFP
  (dos SFP+ en wan0/wan1, dos combo de 1G). Un accesorio con compatibilidad oficial y sin fila de
  lista transcrita (R9Y49A) va «consultar» con `sinPrecio`.
- **Huawei** (`huawei-motor.js`; revisión en `docs/revision-huawei-2026-09-29.md`). La plataforma se
  elige antes que el caudal (`#platSeg`: NetEngine AR, A800 E, NE8000). El reenvío (`fwd`) no
  dimensiona SD-WAN (`typ`); las cifras SD-WAN e IPsec de los AR son de los dos sentidos
  (`respaldoBidireccional`). En Huawei **EOS no es fin de venta**: EOM es el último pedido. El BOM
  sale de la «Ordering Information» (el AR8700-8 pide su SPU-700H; el AR6710-H su SRU-700S y una
  fuente PAC300S12-CL o PDC260S12-CL/-DL) y marca `base` lo que hace falta para encender el chasis,
  con su motivo y sin afirmar cuántas fuentes vienen de serie. Cada modelo apartado trae `motivos`
  con cifras (`miss` conserva el texto corto) y `resumenApartados()` los agrupa por cuello; el ×2 lo
  escribe entero `formulaBidireccional()`. Figuras **sin pérdida** (WebP `VP8L`, los píxeles exactos
  del documento) en `public/data/huawei-vistas-equipos.json`; una figura solo se cambia por la de
  otro documento si es el mismo dibujo. Los renders de la Galería de imágenes de Info-Finder solo se
  bajan con la sesión del dueño (desde su Mac); entran con `npm run figuras-huawei`, que exige
  modelo del catálogo, cara, el pie que exige la prueba de figuras (documento o galería, rótulo del
  propio modelo, variante de alimentación), no ser menor que la actual y WebP sin pérdida, y no pisa
  un archivo que comparten dos modelos. **No se edita el JSON a mano**: el importador escribe
  `scripts/figuras-huawei.lock.json` y la prueba frena una figura que encoge o que no está en él. Cada
  figura trae la `captura` de su ficha en la galería, que va a una rama `fuente/figuras-huawei-<fecha>`
  (nunca a `main`) para revisar el pie contra la página. Sin trasera oficial, la pestaña «Trasera» dice por qué
  (`rearNota`). **El ciclo de vida sigue sin respaldo**: pide una cuenta
  Huawei (Info-Finder exige sesión).
- **Cisco** (`cisco-motor.js`; contraste del adjunto del dueño en
  `docs/herramienta-externa-cisco-2026-10-20.md`). La plataforma se elige antes que el caudal
  (`PLATAFORMAS`: IOS XE SD-WAN —Secure Router G2 y Catalyst 8000—, Meraki MX —con los C81x1-G2-MX—,
  ISR 1000, ASR 1000). **Cada cifra lleva su base en `bases`** y la pantalla la enseña: G2 e ISR a
  512 B, reenvío de Catalyst a 1.400 B (el motor avisa), SD-WAN con IQDF, Threat Protection
  (`amenazas`) en EMIX y Meraki sin tamaño de paquete (su `amenazas` es NGFW en detección o
  prevención). En una sede el overlay va contra la capa del perfil y la salida local contra la de su
  seguridad (reenvío, Threat Protection o IPsec hacia un SSE); la utilización es la **suma de las dos
  fracciones** (supuesto declarado). FEC y duplicación son supuestos; duplicar cuenta el flujo
  entero. El descifrado TLS en el router no tiene cifra: sin candidato. Escala publicada que no llega
  y requisito que no consta apartan con su motivo; lo no publicado, avisa. Los túneles se escriben o
  salen de la topología (`tunelesTopologia`: hub y radios o malla, sedes, hubs y transportes; el
  rol lo da el modo), que es aritmética rotulada como supuesto; la cifra escrita manda. **Enlaces WAN a
  puertos reales** (`asignarEnlaces`): cada equipo trae sus `puertos` contados de su ficha (`uso`
  WAN, LAN/WAN —los «Flex L2/L3» y los convertibles— o LAN, que nunca recibe un enlace; `velMin`
  solo donde la ficha o la guía de hardware da el rango —en el MX95/MX105, su página «WAN
  Behavior»; en los mGig de los C8111/C8121-G2-MX es supuesto, `velMinSupuesto`), y cada enlace
  declarado por su entrega (cobre, fibra, DSL o XGS-PON y velocidad de la
  interfaz) va a uno, el más exigente primero; un cobre de 1G puede ir a una jaula con el
  transceptor 1000BASE-T del catálogo, y uno de 10G a una SFP+ con el 10GBASE-T solo donde la guía
  de hardware lo da (`sfp10gt`); la jaula XGSPON/10GBASE-T de las 8100 VAI/VAP y CVAI/CVAP nunca
  recibe una óptica (`sinOptica`) y es la única que admite un XGS-PON (`pon`), con la ONT
  SFP-10G-ONT20-I (`xgspon` en `OPTICS`; la fibra y la distancia a la OLT son del operador); un DSL,
  al puerto `dsl` (ISR 1116-4P y esas cuatro 8100; los NIM DSL están fuera de venta); si no cabe, el
  módulo NIM de la guía de su familia que lleve más enlaces (sin ranura NIM, en el portador
  C-SM-NIM-ADPT(R) de una ranura SM) o se aparta (en el ASR, el motivo cita lo que admite su bahía,
  `BAHIA_ASR`, sin proponer el módulo: chasis fuera de venta); el `maxWan` de Meraki manda, y las `combinaciones` (tabla 5 del
  12X4QC; bahías y 240 GE del C8570-G2, con la bahía 0 caída si la 1 va a 100G según su guía de
  configuración) apartan lo que la ficha no admite a la vez. **Cada fibra
  lleva su óptica por alcance** (`elegirOptica`): con el tipo de fibra (OM1…OM4, monomodo) y el
  tramo en km, la primera de la lista que llega según el `alcance` de la ficha de la óptica (en
  `OPTICS`, columna `reach` de `Optic`), antes la que no pide RS-FEC ni cable de acondicionamiento;
  sin los dos datos, «elegir una»; si ninguna llega, «consultar» y aviso, sin apartar (el catálogo
  no trae todas las ópticas de Cisco). En cobre el tramo se comprueba contra los 100 m del RJ-45
  (`alcanceRJ45`: de su guía de hardware o, si no lo da, la norma 802.3, avisada) o el alcance del
  transceptor. Sin enlaces no se comprueba nada. **Propuestas de conectividad, SD-WAN y seguridad**
  (todas hechas el 2026-10-21; `docs/propuestas-cisco-conectividad-sdwan-seguridad-2026-10-21.md`):
  el enlace celular declara bajada y subida y el PIM sale de su categoría (`CELULAR`, un pico de la
  norma); sede con dos routers (`repartoHa`: cada uno para toda la sede; con TLOC, enlaces
  alternados y una interfaz entre los dos); controladores por equipos del overlay
  (`CONTROLADORES_SDWAN`, recursos 20.18.x); AppQoE con DRE por perfil y conexiones (`appqoe`, sin
  caudal publicado: avisa); Cisco Secure Access en el BOM con sus túneles de 1 Gbps y respaldo
  (`SECURE_ACCESS`); y con «Firewall dedicado», un Cisco Secure Firewall 1200/3100/4200 por la cifra
  de su capa (`SECURE_FIREWALL`, `firewallDedicado`: FW + AVC, con IPS o TLS, nunca otra) y su
  licencia TMC. La cifra de Threat Protection ya incluye URLF y AMP. En SD-WAN un modelo sin
  cifra propia cae a IPsec y la lista lo marca. Licencias G2 por `clase` (S…2XL, guía de pedido) y
  segunda fuente `psu2`; los LIC-SEC no se proponen donde la guía los niega (`secAddon: false`), y en
  autónomo piden Routing Advantage y LIC-R-OP-SWM. **DNA** (`LICENCIAS_DNA`, FAQ de DNA y guía de
  los 8300/8200): el tier sale del tráfico (todo el WAN en SD-WAN, solo el cifrado en autónomo;
  `traficoLicencia`), sin pasar del `dnaTierMax` de la plataforma; plazos 3/5/7, Premier
  discontinuado, 8500 y ASR solo Advantage, Essentials hasta 10 VPN, voz con Advantage; HSEC
  incluida en 8200/8300 y, en el ISR, por encima de VPERF. En Meraki, la licencia por suscripción por clase de equipo (`licClase`:
  LIC-MX-S…XL o LIC-CSR-S/L/XL, -E o -A; la de co-terminación va por modelo y no se publica) y
  SD-WAN+ cita la ampliación `LIC-MX-SDW-<sdwPlus>` solo donde su página nombra el modelo. Los
  Meraki llevan sus ópticas MA-SFP (guía de accesorios SFP), por familia: los G2-MX no admiten la
  SX ni la ZR. Módulos de la guía de pedido de cada familia: G2 (`MODULOS_G2`) y Catalyst 8300/8200
  (`MODULOS_C8K`, con sus límites de ranura). Figuras en `public/data/cisco-vistas-equipos.json`
  (sin pérdida, pie literal, `rearNota` donde no hay trasera; previas a 1.600 px y calidad 90; la
  figura de una familia solo si el documento la rotula para ella, y el pie dice lo que no coincide). **`npm run cisco`** lee las fichas
  HTML traídas (la carpeta de una rama `fuente/*`, o de la red con `--traer`, que es como lo corre
  el vigía cada lunes) y las contrasta con el catálogo celda a celda, en la base que cada modelo
  declara; solo compara y falla cerrado (una ficha de la que no sale ninguna celda, o que no se pudo
  traer, es un 2, no un «todo casa»). También avisa de las referencias de equipo que las cabeceras de
  una ficha nombran y el catálogo no trae (`fueraDeCatalogo`: un aviso, no cambia el código de salida);
  lo que una persona ya miró va a `REVISADAS` con su motivo y no vuelve a avisar.
- **Juniper** (`juniper-motor.js`): SRX y Session Smart Router no se comparan. `fw` (paquetes
  grandes) se muestra y no dimensiona; manda la capa de inspección (`CAPAS`). El SSR se dimensiona
  por capa de cifrado en IMIX (`cap`/`capCif`/`capHmac`, de sus fichas; la de 1.500 B es portada),
  como sucursal o hub, y su inspección va desacoplada en un SRX elegido por capa o en la nube.
  Distribución de Aruba (tarjeta clavada con figuras de la guía de hardware de cada modelo,
  `public/data/juniper-vistas-equipos.json`, sin pérdida, con foto de producto en los 18 y tamaño y
  peso de la tabla física de cada guía). El ciclo de vida respaldado es solo el
  de los SRX: en un SSR la ficha dice que no hay fuente.
- **MikroTik** (`mikrotik-motor.js`, `legacyData/mikrotikPruebas.js` generado por `npm run
  mikrotik`). Se dimensiona con la **celda** de la tabla de pruebas de cada ficha oficial: la fila
  la fijan las funciones (firewall con FastTrack = fast path, que es un techo; sin FastTrack = 25
  reglas de filtro; colas; L3HW solo en CCR2116/2216), la columna el perfil de tráfico (1518/512/64
  B), IPsec 1 túnel en un sitio y 256 en un hub, por cifrado. La prueba es «all port» (suma de
  puertos): la necesidad va ×2 y aparte el caudal por sentido contra `wanMax`. `fwd`/`fw`/`ipsec`/
  precio se **derivan** de la ficha, nunca se escriben a mano. WireGuard no tiene cifra oficial y
  no se estima; la RAM por feed BGP es un supuesto declarado; el PoE cuenta en vatios donde la
  ficha los da (RB5009UPr) y, si la caja trae adaptador, con su tensión × la corriente de la ficha
  (`presupuestoPoe`: el manual dice que la salida va a la tensión de entrada; a 24 V es pasivo, no
  802.3af/at); con «Fuente de 48 V aparte» (`#poeFuente`) mandan los límites de alta tensión de
  la ficha (desde el 2026-10-27 también el L009: 450 mA en su único puerto) y su entrada máxima, el 802.3af/at solo donde el manual lo dice (hEX PoE, PowerBox Pro)
  y la fuente va al BOM sin precio; sin tensión conocida, no se comprueba. La ficha pinta una barra por escenario de falla
  (solo con respaldo) y la del IPsec del respaldo cifrado. Niveles de licencia de la tabla oficial (el 5 no limita OpenVPN; CHR no tiene niveles).
  Figuras de la galería de cada ficha (`public/data/mikrotik-vistas-equipos.json`), sin pérdida y a
  resolución nativa; la galería no rotula la cara: se decide mirándola, y sin trasera no se sirve la
  de un hermano. La tarjeta pinta una previa con pérdida (`frontPrev`/`rearPrev`, opt-in de
  `ficha.js`) y la lupa y el Excel el original. Perfiles multi-sede como Huawei (`BOM.perfiles`).
  **Enlaces WAN** (`#enlacesData`): principal o respaldo, Internet o MPLS, velocidad y entrega; un
  respaldo ocupa puerto y no suma, el caudal es el máximo entre el escenario normal y los de falla,
  y cada enlace va a un puerto del equipo (los puertos salen de la ficha) con el módulo de la
  matriz oficial «wired interface compatibility» (`COMPATIBILIDAD`): lo que marca «-» no se
  recomienda y un equipo que no lista va «a consultar». Cada enlace declara bajada, subida (vacía
  = simétrico; la prueba «all port» suma las dos) y la distancia del tramo: dentro de su velocidad
  va el primer módulo que llega según el «Distance» de su ficha (el cobre, 100 m; el S+RJ10 a 10G,
  30 m; el BiDi avisa de que el otro extremo lleva la longitud de onda complementaria), y un tramo
  al que nada llega aparta el equipo. MPLS principal con respaldo de Internet comprueba además la
  celda IPsec del respaldo. **Caudal, enlaces y sentidos son una sola cadena**: el caudal del
  sitio (sin margen) es la velocidad de cada enlace que no declare la suya (si todos la declaran,
  puede ir vacío); los enlaces dan el peor escenario por sentido; «Sentidos simultáneos» compara
  con la prueba bajada + subida o el sentido mayor (nunca un ×2 que pise la subida declarada); y el
  margen multiplica lo que procesa el equipo (celda de ruteo, IPsec del respaldo, tope de CHR),
  nunca el puerto, que lleva el enlace contratado. Las casillas de los enlaces van en la unidad del
  sitio (el JSON guarda Mbps).
- **Nokia**: dos dimensionadores — 7750 SR / 7250 IXR (equipo, por plataforma; chasis modulares
  apartados por densidad) y 7220 IXR (fabric). Capacidad en Gbps; `aMbps()` es el único que lo sabe.
- **Starlink LEO**: motor canónico integrado byte a byte (`starlink-leo-dimensionador/` es la línea
  base para verificar su SHA-256). La hoja servida no es la de la línea base: lleva la piel del
  portal y conserva las variables que el motor escribe en línea (`--red`, `--amber`, `--green`,
  `--ink-muted`). Fuera de `navegacion.js` y de `/api/catalog` a propósito.

## Comprobaciones que vigilan el catálogo

- **`npm run catalogo`**: cobertura por campo, ciclo de vida, precios y procedencia; **pantallas**
  (los `campos` de `ESTADO.vincular()` contra los `id=` de su HTML; lo que crea un módulo se declara
  en `TARDIOS` con su ancla); **cotizador y portal frente al dimensionador**, sobre lo que sirve el
  servidor (`scripts/ayuda/pantallas-servidas.js` siembra una base en memoria); lo que va
  «consultar» a propósito (`sinPrecio` en cualquier `legacyData/`, con su motivo, y si el CSV ya trae
  su fila); cobertura del contraste; fuentes que cambiaron sin contrastar.
- **Vigía** (`npm run vigia`, `vigia-fuentes.yml` los lunes en dos jobs: `medir` sin escritura,
  `publicar` sin instalar nada y validando el lock). **Tres estados en el lock**: `hashVerificado`
  (lo que una persona contrastó, no se mueve solo), `visto` y `pendienteDesde`; se limpia con
  `npm run vigia -- --revisado <fabricante> <url>`. Vigila el texto en HTML, los bytes en PDF y,
  en las 20 fichas de MikroTik, **los datos transcritos** (`vigilar: 'ficha-mikrotik'`: la huella de
  lo que `npm run mikrotik` lee, que al transcribir deja el lock verificado); en una ayuda que
  sirve su tema dentro de la navegación entera (Secure Access), solo el `<article>` (`vigilar:
  'articulo'`; sin él, ilegible);
  `--sondeo` mide qué varía entre dos peticiones. Un HTML que, sin scripts, deja menos de
  `TEXTO_MINIMO` (200) caracteres es el cascarón de una aplicación de JavaScript y sale ilegible,
  nunca «sin cambios». Lo que el sondeo midió como no legible sin navegador lleva
  `sinVigilancia: '<lo medido>'` (nunca en una fuente estable): el vigía no lo pide cada lunes y
  el sondeo lo sigue midiendo, en una sola pasada (`--resumen-sondeo` saca el texto del JSON).
  Starlink no está en `vendors.js` pero sí en `FUENTES` (sus ocho `SOURCE_LINKS`, casadas con el
  motor por `test/starlink-fuentes.test.js`); se vigilan sus tres PDF. Cuando el Product
  Matrix de Fortinet queda pendiente, el job **`contrastar`** del vigía corre `npm run matrix` sobre él (sin escritura ni
  token, `npm ci --ignore-scripts`) y el issue dice qué cifras cambiaron; `publicar` valida ese
  informe antes de escribirlo. A demanda, `contrastar_matrix` al lanzarlo a mano; en local,
  `npm run matrix -- <pdf>`. Las fichas de Cisco y Meraki son páginas dinámicas que nunca quedan
  pendientes, así que el job **`contrastar_cisco`** no espera a nada: cada lunes trae las fichas
  que cita el catálogo (solo las que `fuentes.js` declara) y corre `npm run cisco -- --traer`, sin
  escritura ni instalación; `publicar` valida su artefacto y el issue dice qué cifra cambió, qué
  ficha no se pudo leer o qué modelo nombra una ficha y el catálogo no trae. Nada de eso escribe en `legacyData/`: el `--revisado` sigue siendo
  humano. **Un documento inalcanzable no es uno sin
  cambios**, y un 403 no prueba quién bloquea (`npm run candidatas`). Pasadas 4 semanas sin
  contrastar, `verificar` frena (`SEMANAS_TOLERADAS`).
- **Contraste** (`npm run contraste`, dentro del job de `pantallas`): cada caso de
  `scripts/contrastes/` declara su línea base embebida y `medidoEn`; la cobertura de módulos se
  **mide** en Chromium (funciones ejecutadas; `ejercitado`, `rozado`, `sin conducir`).
- **e2e** (`npm run e2e`, en CI): espera a condiciones con `asentar(page)`, nunca con pausas
  fijas; `resumen()` fija el código de salida. `e2e-accesibilidad.js` pasa axe (WCAG 2.1 A/AA) y el
  reflujo a 640 px. **Recorrido de límites** (`npm run limites`, miércoles): los hallazgos van a un
  issue; lo correcto se declara en `EXCEPCIONES` con su motivo.

## Documentos de referencia

`IMPORTAR-CATALOGO.md` (procedimiento de importación) · `docs/sincronizacion.md` ·
`docs/decisiones-del-dueno-2026-09-24.md` · `docs/herramienta-externa-cisco-2026-10-20.md` · `docs/propuestas-cisco-conectividad-sdwan-seguridad-2026-10-21.md` (las nueve, hechas o cerradas el 2026-10-21, con su documento) · `docs/ia-en-el-dimensionador-2026-10-27.md` (qué IA cabe en los dimensionadores sin inventar datos; el piloto «del pliego al escenario» se hizo y se retiró el 2026-10-27 por decisión del dueño) · `RELEVO.md` (el informe de relevo de la última entrega: pendientes, mejoras y cómo retomar) · `docs/portabilidad-aruba.md` (tres capas: escenario,
comercial, gobierno del dato) · `docs/revision-huawei-2026-09-29.md` · `docs/manual-usuario/`
(manual a PDF con `npm run manual`; Playwright fuera de `package.json` a propósito) ·
`docs/claude-md-cronica.md` (la historia de cada regla de este archivo).


---

## Arquitectura de Módulos Actualizados (Refactorización Carrier-Grade)

> **Estado (decisión del dueño, 2026-10-20, con el encargo «cierra lo que está abierto»):** los dos
> módulos de esta sección (`public/js/sizing_engine.js` y `server/presales_api_controller.js`)
> **no los carga ninguna página ni `server.js`**; los dimensionadores en producción son los de la
> sección *Fabricantes*. Se conservan, con su prueba (`test/presales-api-controller.test.js`), como
> propuesta de Gemini, bajo la regla de datos del dueño: **sus catálogos, códigos y precios
> (`list_price_usd`) no son fuente de nada que se muestre**, y si alguno entra a una pantalla lo
> hace por `server/seed/legacyData/` con su documento en `fuentes.js`, o en `null`.

### Motor Unificado de Cálculo y Estado Reactivo (`public/js/sizing_engine.js`)
Módulo isomórfico (compatible con navegador vía `window.PresalesEngine` y con Node.js vía `require('./sizing_engine')`) que centraliza:

1. **Dimensionador Huawei NetEngine (`calcularRequerimientosHuawei` y `dimensionarHuaweiNetEngine`):**
   * **Perfiles IMIX reales (elimina el paquete fijo heredado de 340B):**
     * `VOIP_FINTECH`: 250 Bytes (factor `0.55`)
     * `ENTERPRISE_STANDARD`: 570 Bytes (factor `0.70`)
     * `ISP_INTERNET`: 700 Bytes (factor `0.85`)
     * `DCI_JUMBO`: 1400 Bytes (factor `1.00`)
   * **Segregación DIA vs IPsec:** Local Breakout (`70%` salida directa a Internet DIA + `30%` túneles IPsec hacia Data Center) frente a Full Backhaul (`100%` IPsec).
   * **Factores Carrier-Grade:** Sobrecarga A-FEC (`+20%`), penalización por inspección UTM en router AR (`+45%`) y Headroom configurable (`30%` por defecto).
   * **Desacoplamiento NGFW Dedicado:** Si el caudal con inspección profunda supera `1000 Mbps` o se activa descifrado SSL/TLS, el motor desacopla la seguridad recomendando automáticamente un firewall dedicado **Huawei HiSecEngine USG6530E / USG6605E / USG6680E** y libera el CPU del router WAN.
   * **Escalado Fluido entre Familias:** Elimina el bloqueo `"FUERA DE LA PLATAFORMA"` escalando automáticamente desde **NetEngine AR** (`AR651`, `AR6121`, `AR6140-16G4XG`, `AR6280`, `AR6300`) hacia **NetEngine A800** (`A812 E`, `A821 E`) y **NetEngine 8000** (`M1A`, `M6`, `F1A-1H24HF`) evaluando simultáneamente `forwarding_capacity_mbps`, `ipsec_capacity_mbps`, `max_ipsec_tunnels`, `mpps`, `fib_routes` y `cgnat_sessions`.
   * **Reglas de Licenciamiento:** Selección automática `N1 Foundation` vs `N1 Advanced`, suscripción `LIC-NCE-WAN-DEV` (1Y/3Y/5Y), licencias `LIC-NE8K-100G-RTU` y soporte `Hi-Care Standard (9x5xNBD)` o `Hi-Care Premier (24x7x4)`.

2. **Dimensionador HPE Aruba EdgeConnect (`calcularRequerimientosIngenieria` y `dimensionarArubaEdgeConnect`):**
   * **Depuración de entradas heredadas:** Se eliminan las entradas manuales de "Throughput de Firewall (Mbps)" y "Túneles IPsec Activos"; el dimensionamiento se rige por ancho de banda de diseño y **flujos simultáneos activos (`max_flows`)**.
   * **Fórmula de Throughput de Diseño:** Integra First-packet iQ (`70%` SaaS / `30%` túneles privados), factor IMIX (`0.55` VoIP, `0.70` Enterprise, `1.00` Bulk), FEC (`5%` fibra limpia, `15%` estándar, `25%` LTE alta pérdida), seguridad (`35%` NGFW local DPI vs `5%` túnel ligero Cloud SASE) y sesiones concurrentes por usuario (`80` estándar vs `150` intensivo SaaS).
   * **Widget de 3 Barras Horizontales:** Retorna `widgetRendimiento3Barras` con Caudal Físico Contratado, Caudal Neto pos-FEC y Caudal Virtual Equivalente con **Aruba Boost** (deduplicación 3x a 5x).
   * **Reglas Co-Terming y SASE:** Sincroniza el plazo (1, 3 o 5 años) en suscripciones `Foundation` / `Advanced` (`100M`, `1G`, `Unlimited`), bloques de 100 Mbps de `Aruba Boost`, soporte `Foundational Care 24x7` y suscripciones por usuario de **HPE Aruba Networking SSE (Axis Security)** en paquetes `ESSENTIAL`, `ADVANCED` o `COMPLETE`.
   * **Semáforo de Ciclo de Vida:** Incluye el mapa oficial de migración de las series legacy `7000/7200` (Naranja) hacia `Gateway 9004/9012/9240` y `EdgeConnect 10104/10106/10108/10150` (Verde).

3. **Auditoría de Accesorios (`auditarAccesoriosBOM` — BOM Health Check):**
   * Verifica automáticamente si el chasis cuenta con puertos ópticos (`1G SFP`, `10G SFP+`, `25G SFP28`, `100G QSFP28`) y asigna o valida transceptores oficiales (`J4858D`, `J4859D`, `J9150D`, `J9151E`, DACs `J9281D`/`J9283D` en Aruba; `eSFP-GE`, `OSX040N01`, `OSX010000`, `QSFP-100G-LR4` en Huawei), además de cables `C13/NEMA 5-15P` y fuentes redundantes en equipos Dual PSU.

4. **Rollout Multi-Sede y Simulador Financiero Telco (`consolidarRolloutMultiSede` y `calcularSimuladorFinancieroTelco`):**
   * Unifica múltiples perfiles de sede (ej. 50 Tiendas Retail + 10 Sucursales Regionales + 2 Data Center Hubs en HA) en un BOM maestro consolidado.
   * Calcula CAPEX Neto, OPEX Neto, Tarifa de Gestión MSP, Canon Mensual por Sede (MRR) y Total Contract Value (TCV) a 24, 36 o 60 meses según el nivel de Partner (`List 0%`, `Business 35%`, `Silver 45%`, `Gold 50%`, `Platinum 55%` o descuento especial).

5. **Estado Reactivo (`PresalesState`):**
   * Store centralizado con patrón pub/sub (`subscribe`, `updateParametros`, `agregarPerfilSede`, `getSnapshot`) que recalcula en tiempo real el dimensionamiento, el BOM y las métricas financieras ante cualquier cambio en la interfaz.

---

### Controlador Backend y Rutas API (`server/presales_api_controller.js`)
Provee los endpoints REST listos para montarse en Express (`app.use('/api/presales', createPresalesRouter(express, deps))`):

| Método y Ruta | Descripción Funcional |
| :--- | :--- |
| `POST /api/presales/sizing/huawei` | Ejecuta el motor Huawei NetEngine Carrier-Grade + BOM + Simulador MRR |
| `POST /api/presales/sizing/aruba` | Ejecuta el motor HPE Aruba EdgeConnect + SSE + Widget 3 Barras + MRR |
| `POST /api/presales/rollout/consolidate` | Consolida perfiles multi-sede y calcula MRR/TCV del proyecto completo |
| `POST /api/presales/catalog/import` | Valida e importa catálogos de hardware en SQLite/Sequelize (`bulkCreate`) |
| `POST /api/presales/export/memoria-tecnica` | Genera la Memoria Técnica justificativa en Markdown estructurado |

---

## Protocolo de Integración y Sincronización Gemini <-> Claude Code

Para garantizar que tanto **Gemini** (que lee `GEMINI.md`, el cual importa este archivo) como **Claude Code** (con las skills locales en `.claude/`) operen como un único equipo de ingeniería sobre este repositorio:

1. **Preservación de Contratos Isomórficos:**
   * Ningún cambio en `sizing_engine.js` debe romper la exportación UMD (`window.PresalesEngine` en navegador y `module.exports` en Node.js).
2. **Validación Determinista Obligatoria (`node --test`):**
   * Antes de dar por cerrada cualquier tarea o commit, tanto Claude como Gemini deben verificar que los cálculos de IMIX, flujos, BOM Health Check y MRR pasen el 100% de las pruebas en `test/`.
3. **Sincronización de Catálogos y SKUs:**
   * Todo nuevo SKU agregado a `HUAWEI_HARDWARE_CATALOG`, `ARUBA_HARDWARE_CATALOG` o `OPTICAL_TRANSCEIVERS_CATALOG` lleva `sku`, `modelo`, capacidades nominales, `list_price_usd` y `lifecycle_status` **solo con documento oficial**; sin él, `null` («nunca se inventa un dato», que manda sobre este protocolo).
4. **Registro en `CLAUDE.md` y `PENDIENTES.md`:**
   * Cuando Gemini genere nuevos módulos o refactorizaciones, entregará el bloque de actualización correspondiente para `CLAUDE.md` de modo que Claude Code tenga contexto inmediato al abrir el repositorio local.
5. **Grafo de código siempre al día (`graphify`):**
   * Un hook de git (`graphify hook install`, local a cada clon) reconstruye el grafo tras cada commit y cada cambio de rama, lo haga Claude o Gemini. Los `.md` no entran en esa pasada: tras cambiar documentos, `/graphify --update`.
   * Antes de leer varios archivos para ubicarse, preguntar al grafo: `graphify query "<pregunta>"`, `graphify path A B`, `graphify explain X`. Si el grafo falta o está viejo (`graphify update .`), no bloquea: se lee el código.
   * **El grafo orienta, no es fuente**: el dato lo dan `server/seed/legacyData/` y las pruebas; no se cita el grafo como prueba.
