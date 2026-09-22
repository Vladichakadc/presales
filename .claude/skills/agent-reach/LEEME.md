# agent-reach — procedencia y qué hace (y qué no) en este repositorio

Instalada el **2026-09-22** a petición del dueño del repo, desde
<https://github.com/Panniantong/Agent-Reach>, commit **`a19a171`** (v1.5.0, 16-sep-2026).

Es un **router de acceso a internet**: no busca nada por sí misma, enruta hacia un CLI
(`agent-reach`) y hacia las herramientas de cada plataforma (`opencli`, `twitter-cli`,
`bili-cli`, `rdt-cli`, `yt-dlp`, `mcporter`, `gh`, Jina Reader…). Cubre 16 plataformas:
búsqueda web (Exa), Twitter/X, Reddit, Xiaohongshu, Bilibili, V2EX, Facebook, Instagram,
LinkedIn, Boss直聘, GitHub, YouTube, 小宇宙, RSS, lectura de páginas y Xueqiu.

## Qué se instaló, exactamente

| Fichero | Qué es |
|---|---|
| `SKILL.md` | La variante **inglesa** del upstream (`agent_reach/skill/SKILL_en.md`), copiada sin tocar una línea. |
| `SKILL.zh.md` | El **original chino** (`agent_reach/skill/SKILL.md`), que es el canónico del proyecto. |
| `references/*.md` | Las siete referencias del upstream, copiadas literalmente. |

**Por qué la inglesa como `SKILL.md`.** El upstream sirve la china como canónica —su
`agent-reach skill --write` escribe esa— pero su público es chino-hablante. Las dos
declaran el mismo `name: agent-reach`, citan las mismas siete referencias y tienen la
misma estructura, así que la elección no cambia lo que la skill hace: cambia quién la
puede leer y mantener. El original se conserva al lado para que no se pierda la
procedencia y para poder contrastarlo cuando el upstream cambie.

## LO MEDIDO EL 2026-09-22 EN ESTE ENTORNO: no alcanza ninguna plataforma

No es una sospecha, son peticiones hechas. Desde el entorno donde se edita este
repositorio, el proxy de egreso corta **todos** los destinos de la skill:

| Destino | Resultado |
|---|---|
| `r.jina.ai` (lectura de páginas, camino «zero-config») | sin respuesta |
| `v2ex.com/api` | sin respuesta |
| `xiaohongshu.com` · `x.com` · `reddit.com` · `api.bilibili.com` | sin respuesta |
| `youtube.com` · `linkedin.com` · `xueqiu.com` · `api.exa.ai` | sin respuesta |
| `api.github.com` · `raw.githubusercontent.com` · `pypi.org` | **200** |

Solo pasan los tres que el proxy ya permitía para paquetes y repositorios. Es la misma
política que en este repositorio devuelve 403 a `fortinet.com`, a los dominios de HPE y
de Huawei y al propio `presales.up.railway.app` — y la regla de `CLAUDE.md` se aplica
igual: **se reporta el bloqueo, no se rodea**.

Dicho de otra forma: **aquí esta skill se dispara pero no puede cumplir**. Sirve desde
una máquina con salida a internet (el portátil de quien use Claude Code), no desde este
contenedor.

## `pip install agent-reach` INSTALA OTRO PROYECTO

Comprobado el 2026-09-22, y conviene no olvidarlo porque falla en silencio:

- **PyPI `agent-reach`** = versión **0.1.0**, autor **Jean Galea**, homepage
  `github.com/jgalea/agent-reach`, **2 canales** (rss, youtube).
- **El repositorio que pide esta skill** = `Panniantong/Agent-Reach`, versión **1.5.0**,
  **16 plataformas**.

Mismo nombre de paquete, proyecto distinto. Y el modo de fallo es el peor posible: con el
paquete equivocado en el PATH, el `agent-reach doctor --json` que la skill manda ejecutar
**responde con éxito** (`[]`, «No channels installed»), que se lee como «no hay backends
configurados» y no como «has instalado otro programa». Se verificó instalándolo.

**El CLI correcto NO se instala por `pip install agent-reach`.** El camino oficial del
proyecto es pasarle a un agente su guía de instalación:
<https://raw.githubusercontent.com/Panniantong/agent-reach/main/docs/install.md>
(o `pip install git+https://github.com/Panniantong/agent-reach` para tener solo el CLI).

## Antes de usarla, tres cosas que decide el dueño, no la skill

1. **Se dispara con `MUST USE` sobre «buscar / investigar / mirar algo en internet»**, que
   en este repositorio es una frase muy común: aquí se «busca» constantemente una cifra de
   un datasheet. Pero el dato del catálogo **no entra por ahí**: entra por
   `npm run cps` / `juniper` / `huawei` / `propuesta`, que contrastan con doble anclaje
   antes de escribir, y por eso este repositorio no automatiza la extracción de tablas de
   PDF. Si algún día la skill funciona desde la máquina de alguien, **lo que traiga sigue
   siendo material de lectura humana**, nunca una vía para escribir en `legacyData/`.
2. **Pide credenciales y sesión de navegador** para las plataformas con login: cookies de
   Twitter (`TWITTER_AUTH_TOKEN`, `TWITTER_CT0`), un Chrome dedicado con el puerto de
   depuración `127.0.0.1:9222` para Boss直聘, y la sesión de Chrome del usuario para
   Xiaohongshu, Facebook e Instagram. En su descargo, el upstream declara sus límites
   —nada de `sudo` sin permiso, nada fuera de `~/.agent-reach/`, nada de escribir en el
   workspace del agente— pero es una decisión de seguridad consciente, no un `npm install`.
3. **Su guía de instalación se sigue desde una URL remota.** Eso es ejecutar lo que diga un
   documento que puede cambiar cualquier día. Se leyó el del commit `a19a171`; el de
   mañana puede decir otra cosa.

## Cómo comprobar que sirve, el día que se use desde una máquina con salida

```bash
pip install git+https://github.com/Panniantong/agent-reach   # NO 'pip install agent-reach'
agent-reach --version        # tiene que decir 1.5.x, no 0.1.0
agent-reach list --all       # tiene que listar las 16 plataformas, no 2
agent-reach doctor --json    # qué backend sirve cada plataforma ahora mismo
```

Si `--version` dice `0.1.0` o `list --all` solo trae `rss` y `youtube`, está instalado el
paquete de PyPI equivocado: desinstálalo antes de seguir.
