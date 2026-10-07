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
- **Las decisiones del dueño no se toman por silencio.** Cuando el dueño pide «ejecuta los
  pendientes», la opción recomendada de una decisión pendiente se ejecuta y se anota; si no, se
  pregunta.
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
| `agent-browser` | Explorar una pantalla por su árbol de accesibilidad. **Explorar con agent-browser, comprobar con Playwright**: `pantallas`, `contraste`, `e2e` y `manual` siguen en Playwright porque son lo que CI mira. Pide `--executable-path` al Chromium de `/opt/pw-browsers`. |
| `agent-reach` | Router a 16 plataformas sociales. **Desde este contenedor no trae nada** (el proxy de egreso corta las 16); sirve desde una máquina con salida. Lo que traiga es lectura humana, nunca vía de escritura a `legacyData/`. Credenciales: ver su `LEEME.md`. |
| `graphify` | Grafo de conocimiento del código (`graphify update .`, `query`, `path`). Solo la skill: el modo «siempre activo» se dejó fuera a propósito. CLI fijada a 0.9.77. **El grafo orienta, no es fuente**: enlaza bien el servidor (`require`) y no los módulos de `public/js/` (globales del navegador). |
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
npm run juniper     # cifras de la línea SRX
npm run huawei      # cifras y fin de venta de Huawei (--check, --plantilla, --eol, --force)
npm run skus        # referencias de pedido de Fortinet desde la price list
npm run lista-aruba # lista del distribuidor de Aruba: dry-run salvo --aplicar
npm run propuesta   # aplica una propuesta de la sincronización sobre legacyData/, con anclaje

# Fuentes y documentos (lo que descarga necesita salida a internet: IMPORTAR-CATALOGO.md)
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
- `session-start.sh` (solo en remoto): `npm install`, comprueba Playwright, Chromium y la CLI de
  graphify contra la versión revisada, avisa si el grafo local es de otro commit y si `npm install`
  reescribió el lock. No instala Playwright, no inventa `AUTH_PASSWORD`, no siembra la base.
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
cierra un issue con la etiqueta `despliegue`. Si Railway dejara de publicar esos estados, el aviso
callaría.

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
- **Un `node -e "..."` de un workflow no lleva comillas invertidas ni `$` sin escapar**: bash los
  procesa antes que Node (`test/workflows-node-e.test.js`).
- **`npm run auditar` falla cerrado**: un aviso alto o crítico frena; la salida es una excepción
  declarada con GHSA, motivo y caducidad de 90 días como mucho, nunca apagar el paso.
- Los jobs de navegador corren en `ubuntu-26.04` con **Playwright 1.61.1**, movidos juntos: la
  1.62+ activa RenderDocument y la cobertura del contraste solo cuenta el último caso
  (`test/workflows-imagen.test.js`; `contraste.js` se niega a escribir una cobertura incoherente).

**Lo que este entorno no alcanza.** El proxy de egreso deniega `presales.up.railway.app`, los
dominios de HPE, Huawei, Fortinet, Juniper y otros fabricantes: **un 403 del proxy es política de
la organización y se reporta, no se rodea**. Los ejecutores de GitHub Actions sí llegan, y los
documentos se traen con workflows de transporte (`traer-cisco-huawei.yml` —con `solo` y `rama`—,
`traer-fortinet-pendientes.yml`, `candidatas-fuentes.yml`…) a ramas `fuente/*` que se leen y se
descartan; el workflow no da por guardada una pantalla de inicio de sesión (`test/traer-pantalla-login.test.js`),
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
denegado.

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
  caracteres que se muestra una vez y obliga a cambiarla (`debeCambiar`).
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
  `dominio: 'precio'` o `porQue`). La pestaña «Fuentes y Referencias» la pinta con dos columnas
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
  alternativas, no acumulables; un chasis modular no publica densidad), licenciamiento, software,
  soporte, referencias de pedido (bajo demanda por modelo) y figuras con su página y rótulo literal.
- `bom.js` — tabla del BOM, totales con las líneas sin precio contadas («sin cotizar») y Excel.
  `BOM.sincronizar()` repinta siempre (también sin candidato). Referencias añadidas a mano en una
  sola clave para los siete, `fabricante|sku`. Simulador de precio neto, TCO sobre las filas (qué
  es OPEX lo declara la página), perfiles multi-sede de todos los fabricantes en una clave, y el
  traspaso al cotizador: el equipo viaja como nombre (su precio lo pone `CATALOG`) y el resto del
  BOM como referencias; falla cerrado si la fila del equipo no casa.
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
  utilización. El BOM sale solo del modelo validado; la puerta READY/WARNING/DRAFT/BLOCKED bloquea
  Excel, copiar y enviar con un P0, un SKU sin casar o la lista vencida, y el override exige motivo.
  Un SKU nunca se busca con el marcador `-DD`. Figuras desde la página «Hardware» de cada ficha.
- **Aruba** (`dimensionador-aruba-edgeconnect.js`, `aruba-reglas.js`, `motor-ingenieria.js`). El
  caudal es el **Multi-Underlay Builder** (filas `{tipo, medio, down, up, rol}`; un respaldo ocupa
  puerto pero no suma); `migrarEstadoV1()` traduce los enlaces viejos. EdgeConnect se dimensiona
  contra su rango WAN publicado; los gateways 9000/9100/9200, contra firewall, clientes y APs, con la
  capacidad del 9200 ligada a la licencia. Boost en bloques de 100 Mbps, un pool por fabric, máximo
  entre escenarios de falla; el breakout no descarga más de lo que cabe por Internet (M4). Central
  por serie (`CENTRAL_POR_SERIE`); IDS/IPS con su cifra (`idsMbps`; DTD solo en EdgeConnect). La línea
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
  fuente PAC300S12-CL o PDC260S12-CL/-DL). Figuras **sin pérdida** (WebP `VP8L`, los píxeles exactos
  del documento) en `public/data/huawei-vistas-equipos.json`; una figura solo se cambia por la de
  otro documento si es el mismo dibujo. **El ciclo de vida sigue sin respaldo**: pide una cuenta
  Huawei (Info-Finder exige sesión).
- **Cisco**: la plataforma se elige antes que el caudal (`PLATAFORMAS`: IOS XE SD-WAN, ISR 1000,
  Meraki MX, ASR 1000); en SD-WAN un modelo sin cifra propia cae a IPsec y la lista lo marca.
- **Juniper**: SRX y Session Smart Router no se comparan. `fw` (paquetes grandes) se muestra y no
  dimensiona; manda la capa de inspección (`CAPAS`).
- **Nokia**: dos dimensionadores — 7750 SR / 7250 IXR (equipo, por plataforma; chasis modulares
  apartados por densidad) y 7220 IXR (fabric). Capacidad en Gbps; `aMbps()` es el único que lo sabe.
- **Starlink LEO**: módulo canónico integrado byte a byte (`starlink-leo-dimensionador/` es la línea
  base para verificar su SHA-256). Fuera de `navegacion.js` y de `/api/catalog` a propósito.

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
  `npm run vigia -- --revisado <fabricante> <url>`. Vigila el texto en HTML y los bytes en PDF;
  `--sondeo` mide qué varía entre dos peticiones. **Un documento inalcanzable no es uno sin
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
`docs/decisiones-del-dueno-2026-09-24.md` · `docs/portabilidad-aruba.md` (tres capas: escenario,
comercial, gobierno del dato) · `docs/revision-huawei-2026-09-29.md` · `docs/manual-usuario/`
(manual a PDF con `npm run manual`; Playwright fuera de `package.json` a propósito) ·
`docs/claude-md-cronica.md` (la historia de cada regla de este archivo).
