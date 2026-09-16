# Pendientes

Registro vivo de lo que falta. **Se lee al empezar y se actualiza al terminar cualquier
tarea**, y su contenido se resume al usuario al cerrar cada entrega — esa es la instrucción
permanente que lo justifica (ver `CLAUDE.md`, sección *Pendientes*).

Última revisión: 2026-09-16 (plan 6: **tarjeta «Equipos que cumplen» FIJA y con foto
oficial del equipo** — petición directa del dueño: sin scroll interno (el único scroll
es el de la página), foto oficial coronando la ficha con vistas frontal/trasera del
documento de origen, cambia al elegir otro equipo, pie con tamaño y procedencia;
candidatos compactados a 6 con pie honesto «+ N más». Opt-ins nuevos de ficha.js
(`vistas`, `panelFijo`, `contenedorDetalle`) — los demás dimensionadores no cambian.
Nace el pendiente #41: fotos oficiales de los modelos legacy).
Anterior (2026-09-16): plan 5: **#17 CERRADO** — la escalera On-Premises High
Availability E-STU sí existe: QuickSpecs a50004289enw + 32 SKU en la lista vigente, par
HA on-prem con SKU propio —; corrección de datos: los 6 términos de 7 años On-Premises
que la revisión del 2026-09-15 no vio (descripción «EC ONP 20M 7y», sin «Gb» ni «yr
Sub»); mejora ejecutada: cantidades editables a mano en el BOM de Aruba con sello de
declaración, viajan en `#bomAjustes`; #16 y #25 afinados con fuentes nuevas).
Anterior (2026-09-16): plan 4, fusionado a main: paquete A de datos — #27 variantes
EC-S-P, #28 término de 7 años, #32 títulos Lista/Neto —; paquete B — ópticas SFP de los
enlaces WAN en el BOM con selección del usuario y lista clicable de equipos candidatos —;
paquete D — los 10 ajustes de UX del dimensionador pedidos por el dueño —; paquete C — la
batería E2E promovida al repo, #40 —; y el #14 investigado: Huawei sí publica el ciclo de
vida de sus routers NetEngine, pero el documento oficial exige cuenta del fabricante).
Anterior (2026-09-15): UX del dimensionador Aruba — panel «Equipos que cumplen» fijo con
sticky mientras la columna de configuración se desplaza (tope de altura contra la zona
muerta bajo .cols; E2E e2e-sticky.js 4/4). Anterior (2026-09-14): plan 3 — cerrados
29/31/34/35/39 como código, 33 queda solo con la acción manual de GitHub, 38 verificado
«no comprobada» — bloqueo externo del fabricante; rediseño carrier-grade del input WAN
underlay.

---

## En curso: plan de sincronismo y actualización continua (2026-09-02)

Aprobado por el dueño del repo con la instrucción de avanzar con todas las fases y subirlas
a producción. El plan completo, con el diagnóstico y la evidencia de cada hallazgo, está en
<https://claude.ai/code/artifact/68c7ff3f-e0f0-4c3d-9448-3911c342283f>.

| Fase | Qué cierra | Estado |
|---|---|---|
| 0 | Permiso `sync` exigido en la ruta, sin simulacro sin clave, firma del adjunto, `xlsx` al espejo mantenido, `cors` fuera, `sqlite3` 6 | **hecha** |
| 1 | CI en GitHub Actions, `/salud` como healthcheck, Railway espera a CI, Dependabot | **hecha** |
| 2 | `FUENTES` por fabricante, `npm run catalogo`, importador de propuestas de la IA, salida estructurada, importador Huawei | **hecha** |
| 3 | Vigía de fuentes semanal fuera del proxy de egreso | **hecha** |

---

## Lo primero: el alta de usuarios — cerrado

1. **~~Crear usuarios queda pendiente~~ Resuelto (2026-09-02), a petición del dueño del
   repo.** `POST /api/usuarios` (protegido con `exige('usuarios')`) genera la contraseña
   temporal en el servidor y la devuelve **una sola vez** en la respuesta —nunca se guarda
   en claro ni se registra en el log— para que el administrador la comunique por un canal
   distinto al panel. La cuenta nace con `debeCambiar: true`, y un middleware nuevo en
   `server.js` (justo detrás del muro de sesión) le bloquea cualquier pantalla que no sea
   `/cuenta` hasta que cambie la clave de verdad — no es un aviso descartable como
   `desdeSemilla`, es una condición que hay que cumplir. El panel `/usuarios` tiene el
   formulario, el revelado con botón de copiar y una insignia «cambio pendiente» en la lista
   para quien todavía no completó su primer acceso. Verificado de extremo a extremo en
   Chromium: alta → login con la clave temporal → intento de ir al portal rebotado a
   `/cuenta` → cambio de clave → acceso liberado. Ver *Cerrado recientemente*.

## Bloqueado por acceso — necesita una máquina fuera de este entorno

Nada de esto es trabajo de ingeniería pendiente: el código está hecho y probado, falta el
dato. El proxy de egreso de la organización responde **403** a estos dominios, y un 403 de
política se reporta, no se rodea.

**Hallazgo del 2 de septiembre de 2026: los ejecutores de GitHub Actions sí alcanzan estos
dominios.** La primera corrida del vigía leyó las seis fuentes con URL sin un solo 403
(Cisco 173.913 bytes, Juniper 392.019, MikroTik 459.308, HPE 333.670, Nokia 307.119). No pasan
por el proxy de la organización. Eso **no** convierte los pendientes de abajo en automáticos
—descargar un PDF y leer una tabla sin equivocarse de fila son cosas distintas, y este
repositorio no automatiza la segunda a propósito—, y **tampoco significa que cada dominio se
comporte igual bajo carga real**: el vigía solo pide una URL por fabricante; pedir 24 seguidas
(el caso de Aruba) puede toparse con límites que una sola petición no revela. El pendiente 2
(Fortinet `cps`) sí se cerró desde aquí — un workflow (`traer-fortinet-matrix.yml`) baja el
documento a una rama de transporte que se lee y se descarta, nunca a `main` ni a un PR, porque
no es un activo de la aplicación. Juniper podría cerrarse igual si alguien dispara ese
workflow. **Aruba y Huawei no**: investigados el 2026-09-02 (ver *Cerrado recientemente*).
Huawei bloquea el navegador automatizado con un "Access Denied" propio del fabricante
(Akamai), categoría distinta de un 403 de proxy y que este repositorio no intenta evadir.
Aruba, al pedir sus 24 datasheets en una sola corrida, tropezó con 403/timeout en 21 de
ellos — y aparte, el permiso de GitHub para que Actions abra PRs está desactivado en este
repositorio, un ajuste independiente del bloqueo de HPE. Los pendientes 3 y 14 siguen
necesitando una persona con navegador real.

**Y el 3 de septiembre de 2026 se supo que HPE es el mismo caso que Huawei, no uno más
suave.** Se pidió `buy.hpe.com` desde un ejecutor de Actions —que no pasa por el proxy de
esta sesión— y respondió **403 con un "Access Denied" de Akamai** (`errors.edgesuite.net`
en el cuerpo). No es límite de ritmo ni política de egreso: es la defensa anti-automatización
del propio fabricante, la misma categoría que este repositorio no intenta evadir. Los 403 y
timeouts que `npm run datasheets` ve desde cualquier máquina son la misma pared, y espaciar
las peticiones la ablanda pero no la abre. Para HPE, igual que para Huawei: **una persona con
navegador real**.

**Firecrawl no es la salida, y conviene saberlo antes de intentarlo (2026-09-03).** Se instaló
el servidor MCP de Firecrawl —un servicio de scraping alojado— pensando que sus servidores
leerían por nosotros lo que este entorno no alcanza. No funciona desde aquí, y no por la clave
ni por HPE: el servidor MCP corre **dentro** de este sandbox (`npx firecrawl-mcp`), así que sus
llamadas salen por el mismo proxy, y ese proxy deniega el dominio del propio Firecrawl. Medido
con una URL de control (`example.com`) que falló igual, y confirmado por el propio proxy:

```
"kind": "connect_rejected",
"detail": "gateway answered 403 to CONNECT (policy denial or upstream failure)",
"host": "api.firecrawl.dev:443"
```

`mcp.firecrawl.dev` y `firecrawl.dev` están denegados igual. La configuración queda en
`.mcp.json` a propósito —sin clave, solo la referencia `${FIRECRAWL_API_KEY}`— porque **sí
sirve desde una máquina que no esté detrás de este proxy**, que es donde tiene sentido usarla.
Desde esta sesión, la vía que sí funciona sigue siendo GitHub Actions.

El procedimiento completo —incluido qué viaja de local a producción y por qué no es la base
de datos— está en [`IMPORTAR-CATALOGO.md`](IMPORTAR-CATALOGO.md).

| # | Qué falta | Cómo se cierra | Bloqueo |
|---|---|---|---|
| ~~2~~ | ~~`cps` en 37 de los 58 FortiGate~~ **Resuelto (2026-09-02)**, y ampliado el 2026-09-03 de 53 a **56 de 58** leyendo las fichas por serie de 400F y 600F. Quedan 100F y 200F, cuyas fichas no están en la URL que sigue el patrón del resto (404, reportado). | — | resuelto vía Actions |
| ~~3~~ | **~~PDFs de datasheets de Aruba~~ Resuelto (2026-09-11): 18/24, ver *Cerrado recientemente*.** Los 6 que quedaban atascados bajaron en sesión nueva con Chrome real: `ecQuickspecs`, `ecXlSpec`, `gw9000`, `gw9100`, `gw9200Qs` y `sdBranchVsg`. La cuota de `psnow/downloadDoc` efectivamente se había reseteado al día siguiente. De los 6 que faltan: 4 nunca fueron PDFs (páginas de documentación en vivo), 1 URL murió (`ecSpecSheet`, 404 genuino, hay que buscar el reemplazo) y 1 exige cuenta de soporte HPE (`gw9000Spec`). El método completo quedó documentado en `public/datasheets/LEEME.md`. | Nada pendiente salvo decidir el reemplazo de `ecSpecSheet` y conseguir una cuenta HPE para `gw9000Spec`. | — |
| 14 | **Ciclo de vida y cifras finas del catálogo Huawei.** 40 modelos cargados y ninguno marcado como fuera de venta, mientras Cisco tiene 8; las 17 NetEngine no traen `fwd`, `ipsec` ni `typ` y las 23 AR no traen `mpps`. El motor no inventa: muestra lo que hay. | **El importador ya existe, y desde el 2026-09-04 también la plantilla**: `npm run huawei -- --check` inventaría los huecos y `npm run huawei -- --plantilla` escribe `huawei-specs.csv` y `huawei-eox.csv` ya con los 40 modelos y las cabeceras que el importador reconoce, así que el trabajo en la página se reduce a pegar cifras. Luego `npm run huawei -- huawei-specs.csv --dry` para el ensayo, sin `--dry` para aplicar, y `npm run huawei -- huawei-eox.csv --eol` para el fin de venta. **2026-09-10: el bloqueo de Akamai no es contra todo navegador** — con Chrome real (no Playwright/Actions) `support.huawei.com/enterprise/en/bulletins/` carga completo y sin captcha, con buscador por modelo (`AR6700` → 11 avisos con fecha real). Dos obstáculos nuevos, distintos del bloqueo anterior: el **contenido** de cada aviso exige cuenta Huawei (candado visible, no se intentó sortear), y lo que se ve en la lista son ciclos de vida de **versiones de software** (`V600R023C00`…), no de hardware — puede que ni sea la categoría correcta para lo que el catálogo modela (fin de venta del equipo físico). "PCN" (Product Change Notice) sí es a nivel de hardware pero no lista una categoría de routers en este momento. **2026-09-16: la categoría correcta ya no es una duda.** La búsqueda web localizó el documento oficial «Huawei NetEngine AR5700&6700&8000 Series Routers Product Life Cycle» (e.huawei.com, 2023-10-20) — ciclo de vida de **hardware**, exactamente lo que el catálogo modela — y al abrirlo pide contraseña: el contenido sigue tras la cuenta Huawei, como se sospechaba. El tablón de routers «Life Cycle Notices» existe y declara 450 avisos (la página carga; el índice es dinámico). Conclusión: el bloqueo ya no es la categoría ni el buscador, es solo la cuenta. | Cuenta Huawei Enterprise para abrir el PDF «NetEngine AR5700&6700&8000 Series Routers Product Life Cycle» (e.huawei.com) y el tablón de routers — la categoría de hardware quedó confirmada el 2026-09-16, ya no hace falta aclararla |
| 4 | **~~Comprobar el sitio en vivo tras desplegar~~ Cerrado (2026-09-04)**, ver *Cerrado recientemente*. Eran dos preguntas distintas y ahora las cubren dos workflows: `sonda-produccion.yml` confirma desde fuera de este entorno que el dominio público responde de verdad (`/salud` y `/login`, sin sesión), y **`pantallas.yml`** conduce las 15 pantallas detrás del muro en un Chromium de verdad y sube una captura de cada una. No hace falta producción para lo segundo: la base es efímera y se resiembra desde `legacyData/` en cada despliegue, así que lo que pinta una pantalla es función del commit. | Nada pendiente de ingeniería. Queda el **juicio**: mirar las capturas del artefacto y decidir si la pantalla dice lo que se le quiere decir a un cliente. | — |

## Fabricantes sin dimensionador

Cobertura actual por herramienta:

| Fabricante | Portal | Cotizador | Guía de diseño | Dimensionador |
|---|:---:|:---:|:---:|:---:|
| Huawei | sí | sí | sí | sí |
| Cisco | sí | sí | sí | sí |
| Fortinet | sí | sí | sí | sí |
| MikroTik | sí | sí | sí | sí |
| Aruba | sí | sí | sí | sí |
| **Juniper** | sí (22 modelos) | sí (21) | sí | **sí** (nuevo) |
| **Nokia** | sí (18 modelos) | sí (18) | sí | **sí, dos** (18/18 — fabric 7220 IXR + agregación/core) |
| ~~Arista~~ | retirado | retirado | retirado | — |

5. **Completar el catálogo del dimensionador Juniper — parcialmente resuelto (2026-09-02),
   ver *Cerrado recientemente*.** La «SRX Series and vSRX Performance and Features Matrix» se
   trajo vía GitHub Actions (mismo patrón que cerró el pendiente 2 de Fortinet) y corrigió
   `fwImix`/`vpn`/`sess` de varios modelos que la reconstrucción por búsqueda había adivinado
   mal, además de completar `sess`/`cps`/`atp` donde faltaban. Lo que sigue abierto:

   - **SRX380: fw/fwImix/vpn en disputa, sin resolver a propósito.** El documento trae una fila
     para este modelo que contradice lo ya guardado (10/4/3,5 Gbps frente a 20/6,5/4,4), pero
     solo `ips` de esa fila coincide — un único anclaje, por debajo del doble anclaje que este
     catálogo exige antes de pisar un dato existente. Corregirlo exige `--sin-contraste` bajo
     responsabilidad de quien decide; documentado en la cabecera de `juniper.js` y junto al
     propio modelo.
   - **~~IPS y ATP de la generación 2024~~ Resuelto para SRX1600, SRX2300 y SRX4300
     (2026-09-03)**, con la ficha oficial por modelo — el documento distinto que hacía falta.
     **Y resolvió el enigma que bloqueaba esto**: aquel «21 Gbps de IPS sobre un firewall de
     24 Gbps» no contradecía que inspeccionar cueste capacidad, era el **otro método de
     medida**. La ficha publica dos («TPS: average HTTP sessions» y «CPS: short-lived
     sessions») y el SRX1600 da 19 Gbps por TPS y 4,5 por CPS. Se transcribió siempre CPS, el
     único método en el que Juniper publica también las capas profundas. Siguen abiertos el
     **SRX4700** (la conexión falló, merece un reintento) y el **SRX4100/SRX4200**, cuyas
     fichas dan 404 en ese patrón de URL — son de una generación anterior y probablemente se
     llamen de otra forma. **Verificado el 2026-09-16:** el SRX4700 ya quedó completo el
     2026-09-11 (fw/fwImix 1,4 Tbps, vpn 170G, vpnImix 90G, ips 60G por método CPS — no el
     TPS de 110 que titula la ficha —, sess 60M, cps 600k) y la ficha oficial del modelo
     (juniper.net) confirma esas cifras; `atp` se mantiene en null a propósito porque
     Juniper no publica Advanced Threat Prevention para este modelo. Lo abierto de verdad:
     el reintento de SRX4100/SRX4200.
   - **Precios y SKU**: no hay lista de precios de Juniper, todo va sin cotizar.
   - **Niveles de Juniper Care**: nombres y SLA sin verificar. Antes que inventar una tabla
     de SLA en una herramienta de preventa, hay un único nivel declarado como no verificado.

   Para lo que sigue abierto, `npm run juniper -- matriz.xlsx` (ver `npm run juniper -- --check`
   para la cobertura casilla por casilla) sigue siendo la vía: reconoce las columnas por su
   cabecera, resuelve Gbps frente a Mbps sin multiplicar a ojo y **rechaza la fila si alguna de
   sus columnas contradice lo ya verificado**, que es lo que caza una fila desplazada.
6. **~~Dimensionador Nokia~~ Resuelto (2026-09-03)**, ver *Cerrado recientemente*. Los 18
   modelos están cubiertos por dos páginas, porque son dos preguntas: la **7220 IXR** (4
   modelos) como fabric leaf-spine, y los otros **14** (7250 IXR, 7250 IXR-X, 7250 IXR-R,
   7750 SR/SR-s/SR-1x) por capacidad de un único equipo, en
   `dimensionador-nokia-7750sr.html`. Nokia es ahora el único fabricante del portal con dos
   dimensionadores.

## Cerrado: el BOM se quedaba atrás del dimensionamiento (2026-09-03)

A petición del dueño del repo. **Se midió antes de tocar nada**, conduciendo las ocho páginas
en Chromium, y el resultado fue que había *tres* comportamientos distintos para la misma
pregunta:

| Página | Antes |
|---|---|
| Fortinet, MikroTik, Aruba | el BOM seguía al dimensionamiento |
| **Cisco, Huawei** | **se quedaban cotizando el equipo anterior** |
| **Juniper** | solo repintaba el BOM al abrir su pestaña |
| Nokia (×2) | sin desplegable propio, pero sin aviso al quedarse sin diseño |

**La causa era una sola línea, repetida en seis copias.** `llevarABom(id)` empezaba con
`if(!id) return;`, así que el caso que más importa —que el dimensionamiento se quede **sin
candidato**— nunca llegaba al BOM. Medido: en Cisco a 20 Gbps ningún equipo cumple y el BOM
seguía mostrando un **Catalyst 8200L de 1 Gbps**, exportable, sin una palabra de aviso.

La regla pasa a `js/bom.js` (`BOM.sincronizar` y `BOM.avisoDesvio`), igual que la de fin de
venta vive solo en `ficha.js`. Repinta siempre —no solo cuando cambia el modelo—, distingue lo
**elegido a mano** de lo **heredado** (una elección manual en el BOM no se pisa; una heredada
sigue al cálculo) y declara los dos desajustes, que no son el mismo: «no hay candidato» y
«estás cotizando otro equipo». Ese aviso existía solo en Fortinet; ahora lo dan los siete.

Verificado en las ocho páginas: el BOM sigue al cambio de escenario, respeta la elección
manual, declara el desvío y declara el «sin candidato» —incluido el fabric 7220 IXR, donde se
provocó a propósito un diseño imposible. Sin errores de consola. 156 pruebas (eran 148), ocho
de ellas nuevas, y una comprueba en el propio código fuente que **ninguna página vuelva a
guardarse su copia de la regla**.

## Cerrado: el Comparador de Equipos mostraba seis filas de treinta posibles (2026-09-04)

A petición del dueño del repo, con el motivo que dieron los usuarios: «la información es muy
poca». Lo era, y **el dato no faltaba**: `/api/catalog` entrega entre 15 y 29 campos por
fabricante y `buildAll()` los tiraba al normalizar los ocho catálogos a una forma común
mínima de seis. La corrección es casi toda de frontend; el backend ya servía todo.

**Ahora son ~30 filas en siete secciones** —identidad, rendimiento, escala, interfaces,
plataforma, alimentación y ciclo de vida/comercial— y en **matriz** en vez de una tarjeta por
equipo: con tarjetas, comparar un atributo obligaba a buscarlo en cuatro sitios y compararlo
de memoria.

**Dos defectos propios, encontrados al conducir la pantalla y corregidos antes de entregar.**
Los dos son del tipo que no rompe nada y solo miente:

1. **Decía «IPS: no aplica» de un Catalyst 8300**, que hace IPS con Snort desde IOS XE. La
   primera versión deducía la inaplicabilidad de que al fabricante le faltara el campo, y eso
   confunde «no lo tiene» con «no lo tenemos apuntado». Ahora `noAplica` se declara a mano y
   con motivo —un router de transporte Nokia no tiene sesiones concurrentes porque no es un
   cortafuegos con estado— y todo lo demás que falte es `sinDato`, que habla del catálogo y no
   del equipo. En un comparador el error era peor que en una ficha: descarta un equipo por
   algo que sí sabe hacer.
2. **Coronaba un ganador entre cifras que no se miden igual**, marcando los 24 Gbps de
   firewall de un SRX por encima de los 5 Gbps de forwarding de un Cisco — justo debajo del
   aviso que dice que esas cifras no son comparables. Las filas de rendimiento llevan ahora
   `mismaBase` y solo se marcan dentro de un mismo fabricante. Las que no dependen de la base
   —sesiones, APs, vatios— se siguen comparando entre fabricantes, porque ahí sí procede.

Se retiran cinco clases CSS que quedaron muertas al cambiar de tarjetas a matriz. 165 pruebas
(eran 156), nueve nuevas sobre las reglas del módulo. Verificado en Chromium: matriz de tres
fabricantes, aviso de bases, interruptor de «solo diferencias» que oculta exactamente las
filas idénticas, y repintado al cambiar cualquier control sin volver a pulsar el botón.

## Conflictos entre el catálogo y una ficha oficial — Juniper y Nokia resueltos (2026-09-11)

**~~Ninguno de estos se corrigió~~ Juniper y Nokia se resolvieron el 2026-09-11, por
decisión del dueño del catálogo** (ver *Cerrado recientemente*). Quedan abiertos solo los
dos de Aruba, que siguen por debajo del doble anclaje. El registro original se conserva
abajo para memoria.

**~~Juniper — cuatro campos~~ Resuelto (2026-09-11).** El catálogo guardaba cifras de una
revisión vieja de las fichas y Juniper re-evaluó al alza; cada valor nuevo quedó confirmado
por dos fuentes oficiales (ficha vigente + Pathfinder HCT) y se transcribió:

| Modelo | Campo | Catálogo (antes) | Ficha oficial (aplicada) |
|---|---|---|---|
| SRX1600 | `vpnImix` | 5.500 | **8.000** |
| SRX1600 | `cps` | 95.000 | **170.000** |
| SRX2300 | `cps` | 320.000 | **450.000** |
| SRX4300 | `fw` | 90.000 | **98.000** |

**~~Nokia — seis capacidades~~ Resuelto (2026-09-11).** Los 7220 eran un error real (el
catálogo prometía el doble) y los 7750 SR-s una elección de métrica: se adoptó «System
capacity (FD; max)», documentada en la cabecera de `nokia.js`:

| Modelo | Catálogo | Ficha oficial | Efecto |
|---|---|---|---|
| 7220 IXR-D2L | 4 Tb/s | **2,0 Tb/s** | el catálogo promete el **doble** |
| 7220 IXR-D3L | 6,4 Tb/s | **3,2 Tb/s** | el catálogo promete el **doble** |
| 7750 SR-1s | 1,2 Tb/s | 4,8 Tb/s | sobredimensiona |
| 7750 SR-2s | 4 Tb/s | 9,6 Tb/s | sobredimensiona |
| 7750 SR-7s | 19,2 Tb/s | 108 Tb/s | sobredimensiona |
| 7750 SR-14s | 38,4 Tb/s | 216 Tb/s | sobredimensiona |

Cómo se decidió (registro del razonamiento original):

1. **El caso 7220 era el urgente, aunque pareciera el pequeño**, porque era el único que iba
   en la dirección peligrosa: el catálogo prometía el doble de lo que el equipo hace. Y no
   hizo falta creerle a la ficha para verlo — **sumar los puertos del propio catálogo dio la
   razón a la ficha**: el D2L son 48×25G + 8×100G = 2.000 Gb/s, y el D3L 32×100G = 3.200.
   Además el catálogo era **incoherente consigo mismo**: el D1 (88 Gb/s) y el D5 (12,8 Tb/s)
   sí coincidían con la suma de sus puertos, solo el D2L y el D3L iban al doble.
2. **El caso 7750 SR-s era ambiguo de verdad: elección de métrica.** La ficha publica *tres*
   métricas distintas de capacidad, y el valor viejo del catálogo coincidía con una de ellas
   por slot. La decisión tomada: **«System capacity (FD; max)»**, porque el dimensionador de
   agregación/core ordena por `cap` y la «Interface capacity» es agregación estadística
   sobresuscrita. Quedó documentada en la cabecera de `nokia.js`.

**Aruba — un campo, encontrado el 2026-09-10 al ampliar el catálogo EdgeConnect** (ver
*Cerrado recientemente*). El QuickSpecs oficial vigente (v18, 06-jul-2026) contradice el
`wanMax` de EC-XS con un solo documento — por debajo del doble anclaje que esta tabla exige
antes de pisar un dato existente — así que se deja sin tocar.

| Modelo | Campo | Catálogo | Ficha oficial |
|---|---|---|---|
| EC-XS | `wanMax` | 200 Mbps | **1.000 Mbps** |

**~~Aruba — EC-XL, un conflicto de ciclo de vida y no de capacidad, encontrado el 2026-09-10 al
extraer List Price~~ Resuelto (2026-09-13)**, ver *Cerrado recientemente* («EC-XL marcado fin
de venta con fechas oficiales»). La Product Lifecycle Policy oficial de EdgeConnect confirmó la
señal del export del distribuidor y el dueño aprobó marcarlo: `eolAnnounced` con anuncio
jun-2025, último pedido 2026-03-31 y fin de soporte 2033-03-31.

**Aruba — cuatro conflictos más, encontrados el 2026-09-13 al incorporar las fichas
técnicas completas de los datasheets** (ver *Cerrado recientemente*). Misma regla: dos
documentos oficiales por dato y la decisión final es del dueño del catálogo; mientras
tanto, el dato nuevo del datasheet se muestra en el campo `spec` sin pisar el existente.

| Modelo | Campo | Catálogo | Ficha oficial |
|---|---|---|---|
| 7010 | `fw` / `fwSess` | 4 Gbps / 32.768 | **8 Gbps / 65.536** (DS serie 7000 vigente) |
| 7205 | `fw` | 15 Gbps | **12 Gbps** (DS serie 7200) |
| 7030 | `ifaces` | «8x combo + puertos 10G» | **8x combo 1G, sin 10G** (DS serie 7000) |
| EC-L | `psu.texto` watts | 401 W | **404 W** (QuickSpecs) / **440 W** (Hardware Ref., EC-L-P) |
| Gateway 9004/9012 | `aps` | 32 (AOS 8) | **128 / 256 "devices" (AOS 10)** — arquitecturas distintas |
| Gateway 9004/9012 | `fwSess` | 128.000 (datasheet AOS 10) | **64.000 en modo SD-WAN** (doc oficial a00099294en_us, validado 2026-09-13) — expuesto en `spec.fwSessSdwan` sin pisar el dato; si el dueño decide que el filtro de flujos use la cifra SD-WAN conservadora, se cambia `fwSess` y se ajusta el test de flujos |

## Datos por confirmar

7. **Precio de los modelos Juniper y Nokia añadidos en agosto 2026.** Las cifras técnicas
   están verificadas contra datasheets oficiales; el precio no, porque no hay lista de precios
   de estos dos fabricantes en el material disponible. Van como `Consultar` con `elpN:0` y el
   BOM los cuenta como sin cotizar, igual que Aruba.
8. **~~Ciclo de vida de SRX1500 / SRX4100 / SRX4200~~ Resuelto (2026-09-03)**, ver *Cerrado
   recientemente*. El SRX1500 y el SRX4100 **sí** tienen boletín y su último pedido ya venció;
   el SRX4200 no lo tiene y se queda sin marcar a propósito.
9. **~~Cisco `C8355-G2` tiene `sdwan: null`~~ Resuelto (2026-09-03)**, ver *Cerrado
   recientemente*. Cisco sí lo publica: 8,7 Gbps.
10. **~~Precios de Aruba: todos en `null`~~ Resuelto (2026-09-13)**, ver *Cerrado
    recientemente*. Suscripciones EdgeConnect, Boost, Central, licencias perpetuas del
    9240 y remanufacturados 7000/7200 ya llevan SKU y List Price. Siguen en `null` a
    propósito: Foundational Care (SKU por variante de hardware, se resuelve en HPE SSC),
    EC-V, EC-XS-SP y Dynamic Threat Defense (no están en la lista del distribuidor).
15. **Alimentación eléctrica: cobertura real, no completa.** La nueva sección «Alimentación
    eléctrica» de la ficha (agosto 2026) solo tiene dato donde el propio catálogo ya traía
    una frase publicada — Cisco 21/21 (ya existía), Huawei 17/40, MikroTik 14/15, Aruba 6/21,
    **Juniper 12/12 SRX** (2026-09-03, completo: ver *Cerrado recientemente*), **Fortinet
    58/58** (2026-09-11, completo: 70F, 100F y 200F cerrados — solo 7081F y 7121F quedan
    sin `watts` porque sus guías solo publican capacidad por fuente, decisión documentada)
    y **Nokia 6/18** (2026-09-03). El resto queda `null` y la ficha lo declara sin rodeos.

    **Nokia no figuraba en esta lista hasta el 2026-09-03**, y ese era un fallo del registro,
    no del catálogo: contaba seis fabricantes de siete, así que sus 18 modelos no aparecían
    ni como hueco — ni ahí ni en `npm run catalogo`, que tenía el mismo punto ciego. Un
    pendiente que no se lista se comporta igual que uno que no existe, el mismo modo de fallo
    que el conjunto inerte de `CISCO_EOL_MODELS`. Ya listado y ya parcialmente cerrado: **6 de
    18** con las fichas de serie de nokia.com. Los 12 restantes no salen de ahí — el 7250
    IXR-e publica variantes redundantes y no redundantes del **mismo** modelo, y este catálogo
    tiene una sola entrada, así que elegir una sería falso para la mitad de los pedidos (el
    caso del SRX320); y de las familias 7250 IXR-6e/10e, IXR-X, IXR-R y 7750 SR-1 no se
    localizó ficha oficial en esta corrida. Esto **no es lo mismo** que los bloqueados por egreso de más arriba: el Product
    Matrix de Fortinet, el material de Juniper y el datasheet abreviado de MikroTik que este
    catálogo ya usa **no traen** consumo eléctrico por modelo — no es una tabla que falte
    copiar, es una hoja mecánica/eléctrica aparte por cada modelo, que ningún importador de
    este repo sabe pedir todavía. Cerrarlo del todo es fabricante por fabricante y modelo por
    modelo, no un solo documento.

    **Fortinet, con pistas concretas ya buscadas (28-08-2026).** `WebSearch` sí funciona en
    este entorno, pero `WebFetch` está bloqueado **para todo**, no solo para Fortinet —
    denegado por igual contra `fortinet.com`, `docs.fortinet.com`, `community.fortinet.com`,
    un mirror del datasheet en `enbitcon.de`, una ficha de reventa en `corporatearmor.com` e
    incluso `en.wikipedia.org`. Con eso, lo que sigue son **fragmentos de búsqueda sin
    confirmar por lectura directa** — pistas para verificar, no datos para copiar al
    catálogo:

    | Modelo | Indicio | Fuente | Confianza |
    |---|---|---|---|
    | ~~FortiGate 100F~~ **Confirmado y aplicado (2026-09-03)** | Leído directo: «the device has two power supplies that can be connected to different power sources». `redund: true` en el catálogo | [Technical Tip: Checking FortiGate-100F series power supply](https://community.fortinet.com/t5/FortiGate/Technical-Tip-Checking-FortiGate-100F-series-power-supply/ta-p/267021) | **verificado** |
    | FortiGate 200F | SKU de repuesto oficial `SP-FDD200F-PS` — "hot-plug / redundant" | [ficha de reventa](https://www.corporatearmor.com/product/fortinet-power-supply-hot-plug-redundant-sp-fdd200f-ps/) | Media |
    | FortiGate 400F | SKU de repuesto oficial `SP-FAD400F-PS` — "power supply redundant" | [ficha de reventa](https://www.corporatearmor.com/product/fortinet-power-supply-redundant-sp-fad400f-ps/) | Media |
    | ~~FortiGate 7081F~~ **Confirmado y aplicado (2026-09-03)** | Leído directo: «up to six hot swappable 200-277V, 16A AC PSUs. The capacity of each PSU is 2500W» + «You can add extra PSUs to provide redundancy». Los 2.500 W son capacidad por fuente, **no** consumo: van en el texto, no en `psu.watts` | [System Guide — AC PSUs](https://docs.fortinet.com/document/fortigate-7000/hardware/fortigate-7081f-system-guide/12189/ac-psus-and-supplying-ac-power-to-the-chassis) | **verificado** |
    | ~~FortiGate 7121F~~ **Confirmado en parte y aplicado (2026-09-03)** | Leído directo: se cambia una fuente en caliente «as long as four PSUs are connected to power and operating normally». El **número máximo** de fuentes (el «hasta 8» que decía esta tabla) **no** aparece en ese documento, así que no se registró | [System Guide — Hot Swapping an AC PSU](https://docs.fortinet.com/document/fortigate-7000/hardware/fortigate-7121f-system-guide/410545/hot-swapping-an-ac-psu) | **verificado en parte** |
    | ~~FortiGate 60F / 90G / 91G~~ | **Atribución retirada (2026-09-03).** Al leer el documento de verdad resultó tratar de las series 100/101E y 200/201E —que no están en este catálogo— y no dice nada de los 60F/90G/91G. Era una cita mal asignada, del tipo que este registro existe para no propagar. | — | retirada |

    Sin ningún indicio, ni a favor ni en contra: 400G/401G, 600F, 700G/701G, 900G/901G,
    1000F/1001F, 1800F/1801F, 2600F/2601F y toda la línea 3000-4800 (F y G) — 45 de los 58
    modelos. Cómo cerrarlo: desde una máquina con acceso, abrir las URL de arriba, confirmar
    el texto exacto y transcribirlo a `redund`/`psu` en `fortinet.js` con el mismo cuidado que
    Huawei — cita literal, nunca inferido del tamaño o la gama del equipo.
16. **Señales de fin de venta de terceros en EC-L-H y EC-XS (2026-09-13).** Al verificar
    las fechas oficiales del EC-XL, los verificadores de ciclo de vida de terceros
    (router-switch.com, layer23-switch.com) daban también fin de venta a **EC-L-H
    (JZ878A, EoS 2025-12-31)** y **EC-XS (JM962A, EoS 2026-01-31)**. Ninguna de las dos
    está confirmada por un documento oficial de HPE — la Product Lifecycle Policy
    consultada solo nombra al EC-XL-H — así que NO se marcan: misma regla de doble
    anclaje que el EC-XL en su momento. **Indicios oficiales acumulados (importador,
    2026-09-13):** el SKU pelado JM962A está AUSENTE de la lista vigente (solo quedan
    variantes localizadas JM962A#xx y el reman JM962AR ya en PLC «ES») — coherente con
    un fin de venta reciente del EC-XS; y JZ878A (EC-L-H) renovó vigencia de List Price
    a 2025-06-01 con PLC GA, señal a favor de seguir vivo. El S0B67A (EC-XL-H-10G) sí
    pasó a PLC «ES» en la lista — coherente con su EOL_ANNOUNCED ya marcado.
    **Afinado el 2026-09-16:** la lista oficial «HPE ARUBA HARDWARE END OF SALE (EoS)»
    (PDF de asp-documents.arubanetworks.com, 25 págs., descargada y leída completa) NO
    incluye ninguna fila EdgeConnect — solo switches y APs legados, así que no confirma
    ni desmiente; el documento que nombraría ambos modelos (EC_LifecyclePolicy_latest.pdf)
    sigue devolviendo 403 (bloqueo Akamai del datacenter, no del documento). Los rastreadores
    de terceros convergen al día exacto y citan el título del anuncio oficial («HPE Aruba
    Networking EdgeConnect L-H Gateway End of Sale Announcement»): JZ878A — anuncio
    2025-06-30, EoS 2025-12-31, fin de soporte 2030-12-31; JM962A — anuncio 2025-06-30,
    EoS 2026-01-31, fin de soporte 2031-01-31. Cómo se cierra: una persona con navegador
    real descarga el PDF de la política de ciclo de vida y confirma esas dos filas (las
    fechas a verificar ya están aquí), y entonces se replica el patrón `EOL_ANNOUNCED`
    del EC-XL. Sin el documento oficial NO se marca (regla de doble anclaje).
17. **~~Equivalencia E-STU de HA para suscripciones On-Premises~~ Resuelto (2026-09-16)**,
    ver *Cerrado recientemente*. El QuickSpecs vigente (a50004289enw) SÍ publica la
    escalera «EdgeConnect On-Premises High Availability E-STU» (8 tiers × 1/3/5/7 años) y
    la lista del distribuidor tarifa los 32 SKU con la invariante de siempre (precio HA
    idéntico al estándar, verificada 32/32). Mapeada en `LICENSES_HA[bw].onprem`; el par
    HA on-prem ya no cotiza 2× estándar. De paso, la verificación cazó 6 términos de 7
    años On-Premises estándar que la revisión del 2026-09-15 había declarado inexistentes
    (formato de descripción distinto): entran con SKU y precio de la lista.
18. **~~Segunda PSU del Gateway 9240: R1C72A o R7J63A~~ Resuelto (2026-09-13)**, ver
    *Cerrado recientemente*. La lista oficial del distribuidor desempata: R1C72A es un
    kit de montaje de APs ($415) y la PSU del 9240 es **R7J63A** ($747 List).
19. **~~Precios de accesorios: catálogo maestro vs partner~~ Resuelto (2026-09-13)**, ver
    *Cerrado recientemente*. Todos los precios de accesorios salen ahora de la lista
    oficial del distribuidor, con vigencia y PLC — el brief de la fase 12 quedó
    corregido por ella (sus cifras eran ~40-60 % más bajas, parecían precio neto).
20. **~~Compatibilidades de accesorios por inferencia de familia~~ Resuelto
    (2026-09-13)**, ver *Cerrado recientemente* («Matriz de accesorios reescrita contra
    la compatibilidad oficial»). La matriz completa salió del VSG SD-Branch, el Hardware
    Reference Guide Rev S, los QuickSpecs EC v18 y 9200 v14 y la Install Guide del
    EC-10150, cruzada con la lista: las inferencias quedaron confirmadas o refutadas una
    a una (JL747B no soportado en toda la línea EC; J4860D/J9285D sin matriz EC; J9153D
    fuera de EC-10108/10150; 25G confirmado en EC-10108; matriz legacy EC-S/M/L/XL
    validada). El test de integridad codifica ahora la matriz oficial SKU por SKU.
21. **~~EC-XS/S/M/L/XL sin accesorios en el catálogo maestro~~ Resuelto (2026-09-13)**,
    ver *Cerrado recientemente*. El EC-XS tiene ya su kit oficial (JM965A, $365) y su
    adaptador de corriente externo (JM996A, $296) — el Accessories Guide PN 201911 Rev F
    confirma que no existe rack kit separado (las orejas van en caja) — y la línea
    anterior tiene su matriz de ópticas validada (JM534A/JM535A + TAA según columna HRG).
22. **VSG inalcanzable en el chequeo de salud desde el sandbox (2026-09-13, fase 11 E5).**
    El nuevo endpoint `GET /api/fuentes/:vendor/salud` y el botón «Comprobar salud de las
    fuentes» funcionan, pero desde este entorno la URL del VSG SD-Branch responde
    inalcanzable (bloqueo de egreso a dominios HPE ya conocido — las GitHub Actions sí la
    alcanzan). No es un fallo del vigía: verificar desde la red del cliente antes de dar
    una fuente por caída.
23. **~~Requisito de almacenamiento Boost en EC-10106/10108~~ Resuelto (2026-09-13)**,
    ver *Cerrado recientemente*. Respuesta oficial del Hardware Reference Guide Rev S:
    EC-10106/10108 llevan un SSD interno de 120 GB **no reemplazable por el usuario** y
    **no tienen slot** de ampliación — no existe kit y no puede existir. Boost corre
    sobre ese SSD interno (hasta 250 Mbps en el 10106 y 500 en el 10108, según los
    datasheets oficiales). Y la lectura anterior de S2N67A quedó corregida del todo:
    «NM» = **Network Memory** — es el «10150/10170 1.6TB Network Memory Drive Kit» del
    QuickSpecs v18 (con él, Boost llega a 8 Gbps en el EC-10150; 1 Gbps sin él), con
    S3R70A/S3P35A como repuestos oficiales. Reclasificado a STORAGE en el catálogo.
24. **1G en EC-10108 y EC-10150: conflicto documental oficial (2026-09-13).** El VSG
    SD-Branch dice NO; el Hardware Reference Guide Rev S y la Install Guide del 10150
    dicen SÍ con restricciones de puerto (solo wan0/wan1). Decisión de la casa: no se
    ofertan ópticas 1G en esos modelos hasta que el distribuidor o HPE TAC desempate —
    ofertar en conflicto documental es apostar el pedido. Cómo se cierra: una respuesta
    escrita del distribuidor/HPE; entonces se añaden las 1G al modelo que proceda y se
    ajusta el test de la matriz.
25. **Transceptores ANW genéricos y EC-SFP-1000BT en la lista, sin matriz para nuestros
    modelos (2026-09-13).** El cruce lista ∩ compatibilidad localizó: **J8177E** «HPE
    ANW 1G SFP RJ45 100m» ($473) y **J9153E** «HPE ANW 10G ER SFP+ 40km» ($11.855 —
    mismo precio que J9153D, vigencia 2026: probable rebranding ANW del mismo
    transceptor), y **R9Y49A** «EC-SFP-1000BT» ($650, 1G cobre marca EdgeConnect,
    confirmado por el VSG solo en EC-M-P — variante que no está en este catálogo; el
    EC-M-H queda sin confirmar). Ninguno entra al catálogo maestro hasta tener plataforma
    confirmada: la regla de la casa es cita literal, no parecido. **Afinado el
    2026-09-16:** el QuickSpecs EdgeConnect vigente (a50004289enw) lista **R9Y49A** bajo
    «EdgeConnect SD-WAN Hub Gateways Options → SFP Transceivers» — confirmación oficial
    de que es transceptor EdgeConnect de HUB (los EC-10150/10170 son hubs): ya hay
    documento oficial, falta decidir el alcance (¿todos los hubs o alguna restricción por
    modelo que el chunk consultado no mostraba?). J9153E es pedible en buy.hpe.com como
    «HPE ANW 10G ER SFP+ LC 40km SMF» mientras el QuickSpecs sigue listando J9153D:
    hipótesis de rebranding reforzada, pendiente de confirmación del distribuidor.
    Cómo se cierra: preguntar al distribuidor si J9153E sustituye a J9153D (y J8177E a
    S3R03A) en las matrices EC/9200, y confirmar la matriz por modelo de R9Y49A.
26. **S0W40A «EC-NX-SSD-A2» no está en la lista del distribuidor (2026-09-13).** El
    Accessories Guide Rev F lo da como repuesto SSD actual de la línea -H (EC-M/L/L-H/
    XL/XL-H, 480 GB), pero no tiene fila en la lista — el catálogo sigue ofertando
    JZ889A (que sí está, $1.207). Si el distribuidor confirma que S0W40A sustituye a
    JZ889A, se añade con el importador y se ajusta la matriz.
27. **~~Variantes de modelo detectadas por el importador — decisión de surtido~~ Resuelto
    (2026-09-15)**, ver *Cerrado recientemente* (plan 4, paquete A). El EC-S del catálogo
    ya era el EC-S-P, así que JM538A ($13.479, canal no-NAL) y JM769A (DC, $15.510)
    entraron como **variantes** del modelo. Fuera a propósito: JM778A (NFR, no vendible)
    y JM538AR (reman). El EC-10170 (hermano del 10150 en el kit S2N67A) sigue sin
    catalogar — ampliar el roster sigue siendo decisión del dueño. Registro original: el
    primer dry-run del importador encontró esos cinco SKU fuera del roster.
28. **~~Suscripciones a 7 años: la lista las tiene, el dimensionador no~~ Resuelto
    (2026-09-15 — el dueño lo pidió)**, ver *Cerrado recientemente* (plan 4, paquete A).
    Cableado donde la lista lo publica, «consultar» donde no, nunca inventado. Registro
    original: la lista oficial trae términos de 1, 3, 5 **y 7 años** para Advanced,
    On-Prem y Advanced HA; el dimensionador modelaba solo 1/3/5.
29. **~~SSE (R8M36AAE) sin List Price~~ Resuelto operativamente (2026-09-14).** El SKU sigue
    sin precio en la lista (eso no cambia: si aparece, el importador lo detecta), pero el
    ciclo ya se cierra en la herramienta: toda línea sin precio verificado queda marcada
    «PENDIENTE DE COTIZACIÓN» en el BOM, enumerada en la nota al pie y en sección propia
    del Excel y del texto plano — lo que se entrega al distribuidor ya no admite olvido.
30. **~~Fórmula IMIX del widget: coeficientes del brief, no oficiales~~ Resuelto
    (2026-09-13).** El dueño envió el brief carrier-grade con la función determinista
    `calcularRequerimientosIngenieria` («reemplazar cualquier comparación directa»): hay
    UNA sola regla — IMIX 0,70/0,55/1,00 por perfil de tráfico, FEC 5/15/25 %, cargo de
    seguridad 0/5/35 % y margen — implementada en `public/js/motor-ingenieria.js`. Los
    anchors oficiales previos (FEC 10/25 % VSG, SLA de enlace 75 %) quedan referenciados
    en comentarios; el slider de margen conserva el default 30 % por el ancla SLA 75 %
    (el 20 % del brief es el mínimo documentado). Ver *Cerrado recientemente*.
31. **~~DTD: licencia aparte y ahora TAMBIÉN cotizada~~ Resuelto (2026-09-14).** Se mantiene
    la regla oficial (QuickSpecs p.32: DTD no fuerza Advanced). Y al cruzarlo con la lista
    resultó que DTD SÍ tiene escalera de SKU con precio (plano por appliance, SaaS/On-Prem
    × estándar/HA × 1/3/5 años — $372/$1.116/$1.860, PLC GA): con la estrategia «En el
    chasis — DTD» el BOM añade la línea con su SKU y precio reales (2 líneas en HA 1+1,
    patrón de las demás suscripciones). Los términos de 7 años y los SKU de evaluación a
    $0 quedan fuera con comentario (ver 28).
32. **~~Títulos de columna del BOM: «LIST/NET» vs «Lista/Neto»~~ Resuelto
    (2026-09-15)**, ver *Cerrado recientemente* (plan 4, paquete A). `bom.js` unificado
    al criterio del pie de TCO —«Subtotal Lista/Neto», «Unit. Neto», totales Lista/Neto—
    en tabla, Excel y texto plano. El archivo es compartido por los 7 fabricantes, pero
    es etiqueta y no cifra, así que era seguro tocarlo.
39. **~~El brief carrier-grade llegó truncado~~ Cerrado por ejecución de arquitecto
    (2026-09-14).** El dueño autorizó avanzar sin las secciones 2-4; se diseñaron e
    implementaron con criterio propio: (Frontend) rediseño carrier-grade del builder de
    underlay WAN — filas tarjeta con badge por familia, toggle simétrico, duplicar,
    validación inline, sugerencia de medio, barra agregada viva #wanResumen con semáforo
    de densidad de puertos; (Lógica SP) campos cliente/proyecto que encabezan BOM y Excel
    y enlace compartible del escenario (con el bug de round-trip de secMode corregido);
    (Componentes) todo con los IDs de contrato intactos. Si el brief original reaparece,
    lo que llegue se cruza con lo construido.
40. **~~La batería E2E vivía en /tmp y moría con la sesión~~ Resuelto (2026-09-15)**,
    ver *Cerrado recientemente* (plan 4, paquete C). `npm run e2e` corre cinco guiones
    (regresión, sticky, ópticas SFP, candidatos, UX — 51 comprobaciones) contra un
    servidor propio con base SQLite desechable. Fuera de `verificar` a propósito
    (exige Chromium); el workflow de CI que la correría en cada push se entrega en
    parche (`e2e-ci.patch`) porque el token en uso no tiene scope «workflow» —
    aplicarlo es acción manual del dueño, junto a la de 33.

33. **Railway no espera a `pantallas`, solo a `verificar` (2026-09-13).** *Actualizado el
    2026-09-14: hay un segundo agujero, de otra clase, y ya está cerrado — un push de bot no
    creaba ningún check, así que Railway no esperaba a nada. Un required check tampoco lo
    habría cerrado: un push que no crea ningún check no puede fallarlo. El vigía abre PR desde
    hoy. Ver `CLAUDE.md`, sección Deploying.*
    Medido, no supuesto:
    el commit `7fe786e` desplegó con estado SUCCESS teniendo la comprobación de navegador en
    rojo desde hacía cuatro días — el dimensionador Aruba llevaba ese tiempo sin que nadie lo
    condujera. La cabecera de `.github/workflows/pantallas.yml` afirma «ESTE CHECK FRENA EL
    DESPLIEGUE, a proposito» y **no es cierto**, así que la red es más fina de lo que el propio
    repositorio cree. Un documento que promete una protección que no existe es peor que no
    prometer nada. **Decisión del dueño:** convertir `pantallas` en *required check* de la rama
    `main` (ajuste de GitHub, no de código) y corregir esa cabecera, o aceptar que solo frena
    `verificar` y decirlo en los dos sitios. `CLAUDE.md` ya lo declara como está hoy.
    *2026-09-14: la cabecera de `pantallas.yml` ya dice la verdad (qué frena y qué no, y que
    el required check es un ajuste manual de GitHub). Queda abierta SOLO esa acción manual
    del dueño en la configuración del repo.*

34. **El semáforo de ciclo de vida pintaría verde falso sobre 131 modelos (2026-09-13).**
    Sale de la revisión de portabilidad (`docs/portabilidad-aruba.md`). Solo Cisco (8/21),
    Juniper (2/12) y Aruba (1/25) tienen boletín de fin de venta **con fecha**. Huawei,
    MikroTik y Nokia tienen cero, y Fortinet marca cuatro modelos como `eol` **binario** en
    `FORTINET_EOL_MODELS`, sin fecha: nunca encendería el naranja de «fin de venta anunciado».
    Portar el semáforo tal cual afirmaría «vigente» sobre 131 modelos que nadie ha comprobado
    —el mismo error que el «IPS: no aplica» del Catalyst 8300, y más caro, porque lo que se
    afirma es que un equipo se puede pedir. **Regla al portarlo:** se enciende solo donde hay
    `eolAnnounced` con fecha; donde no, declara «el catálogo no trae el ciclo de vida», que es
    el tercer estado que ya protege `redund`. Cerrarlo de verdad exige cargar los boletines,
    y para Huawei eso es el pendiente 14, bloqueado por Akamai. *2026-09-14: la regla ya
    estaba escrita en `docs/portabilidad-aruba.md` y ahora además está FIJADA EN TEST
    (`test/ciclo-de-vida-datos.test.js`): ningún modelo de los 189 afirma vigencia sin
    boletín con fecha; todo `eolAnnounced` trae `lastOrder` parseable. La carga de los
    boletines que faltan sigue pendiente (14 para Huawei). Cerrado como REGLA; abierto
    como DATO.*

35. **La auditoría de puertos de Nokia es la mejor de las ocho y no se ve (2026-09-13).**
    También de la revisión de portabilidad. `legacyData/nokia.js` ya modela las configuraciones
    de puertos como **alternativas y no acumulables** —«36x100GE o 12x400GE» nunca son 48
    interfaces— y aparta los chasis modulares que no publican densidad. Es más rica que la que
    el refactor estrenó en Aruba, y no está en ninguna pantalla. El flujo no es «Aruba enseña a
    los siete»: la capa común es algo a lo que cada fabricante aporta lo que ya resolvió.
    Coste bajo, no toca ningún motor de cálculo.

36. **~~El Fortinet Product Matrix se republicó y nadie lo ha leído~~ Resuelto (2026-09-14).**
    Se trajo con `traer-fortinet-matrix.yml` (los ejecutores de Actions sí alcanzan
    fortinet.com) y se leyó entero: sha256 `242a6eba…`, 123.387 bytes, exactamente lo que el
    vigía había marcado. **Es una edición nueva de verdad** —`PRQMTX-2026-R176-SEP`,
    septiembre de 2026, frente a la de julio con la que se transcribió— y por eso sube la
    fecha de procedencia, que decía «2026-07» en pantalla. **Pero ninguna cifra que el
    catálogo use se movió:** 27 modelos FortiGate x 7 campos = 189 comparaciones, 189
    coincidencias, 0 diferencias, y ni un modelo nuevo ni uno que desaparezca. La lectura se
    sometió al doble anclaje de `npm run cps` (27 filas aceptadas, 0 rechazadas) y se
    comprobó que ese anclaje sigue vivo desplazando a propósito la fila del 90G a los valores
    del 200G, que sí fue rechazada. De paso corrigió una afirmación de `CLAUDE.md`: este
    documento publica «Power Supplies» (tipo y número, que respalda `redund`) y **no**
    vatios.

37. **~~El boletín EOL de Cisco: sospecha de `estable: true` mal clasificado~~ Resuelto
    (2026-09-14), midiéndolo.** La sospecha era correcta y la medición encontró **los dos
    errores posibles a la vez**. `npm run vigia -- --sondeo`, nuevo, pide cada URL dos veces
    con segundos de diferencia —lo que cambie entre ellas no puede ser un cambio del
    fabricante— y compara los bytes y el texto por separado. Desde Actions:

    - el **boletín EOL de Cisco**, declarado `estable: true`, devolvió los mismos 173.911
      bytes con **hash distinto** y el **mismo texto**: sus tres semanas de «cambios» eran
      alarmas falsas. Marcado revisado con esa evidencia;
    - el **EOL de Juniper**, declarado `estable: false`, devolvió bytes y hash idénticos:
      estaba **callado sin motivo**, así que un boletín nuevo de fin de venta se habría
      reportado como «varió (página dinámica)» y nadie se habría enterado. Corregido a
      `estable: true`.

    De ahí sale el arreglo general: el vigía vigila ahora el **texto** en las fuentes HTML y
    los bytes en los PDF. Lo que **no** se midió es la estabilidad de un día para otro —dos
    peticiones con 15 s de diferencia no dicen nada de eso—, así que MikroTik, las páginas de
    HPE y la de Nokia siguen en `estable: false` hasta que las corridas semanales acumulen
    evidencia. Medir una cosa y afirmar otra es exactamente como se llega a un campo puesto a
    ojo.

38. **Tres fuentes siguen dando 403 incluso desde GitHub Actions (2026-09-14).** El sondeo lo
    confirmó con su código, que es el resultado honesto: las *hardware guides* por modelo de
    Juniper, sus fichas de la generación 2024, y el Validated Solution Guide de HPE. No es el
    proxy de este entorno —los ejecutores no pasan por él—, así que es una restricción del
    propio fabricante. Mientras siga así, esas tres respaldan datos que el vigía **no puede
    comprobar**, y la pestaña de procedencia lo dice: salen como «no comprobada», nunca en
    verde. Cierra desde una máquina con acceso, o con una URL vigente que sí resuelva.
41. **Fotos oficiales de los modelos legacy (2026-09-16, nace con la tarjeta gráfica de la
    ficha).** La tarjeta «Equipos que cumplen» ya corona con la foto oficial del equipo
    elegido —EdgeConnect 101xx/XS con frontal y trasera del Hardware Reference Rev V,
    gateways 9004/9004-LTE/9012/9106/9114/9240 con la suya del DS/QuickSpecs—, pero los
    modelos que no tienen foto oficial en el repo muestran el aviso honesto «Sin foto
    oficial…» (la regla del catálogo prohíbe un «parecido»): **EC-S, EC-M, EC-L, EC-XL**,
    la serie **7000/7200** y **EC-V** (virtual: no hay chasis que fotografiar — candidato
    a un pictograma propio declarado como tal, no a una foto). Las fotos que el Hardware
    Reference publica de esos chasis van etiquetadas con la variante (-P/-H), no con el
    modelo base, así que no se reutilizan. Cierra bajando las fotos de la biblioteca de
    medios oficial de HPE (o de los QuickSpecs de cada legacy si los hubiera) con su
    atribución, y añadiéndolas a `public/data/aruba-vistas-equipos.json`.

## Limpieza

11. **Nada abierto.** Los cuatro puntos que vivían aquí (el sufijo `-v3_1`, el conjunto
    `CISCO_EOL_MODELS` inerte, la falta de lint y pruebas, y las skills a medio instalar) se
    cerraron en agosto de 2026 — ver *Cerrado recientemente*. Lo que dejó esa limpieza es la
    forma de que no vuelvan: `npm run verificar` antes de empujar, y un aviso en el arranque
    cuando un conjunto de fuera de venta deja de casar con el catálogo.

## Decisiones que necesitan al dueño del producto

14. **Nada abierto por ahora.** El único punto que vivía aquí (el nombre de usuario sin
    normalizar) se cerró el 2026-09-02 — ver *Cerrado recientemente*.

## Cerrado recientemente

### Plan 5: HA On-Premises E-STU (#17), 7 años On-Premises completos y cantidades ajustadas a mano en el BOM (2026-09-16)

**#17 cerrado — el par HA on-prem ya tiene SKU propio.** La premisa del pendiente («HPE
no publica equivalencia E-STU de HA») era falsa: el QuickSpecs EdgeConnect vigente
(a50004289enw) lista la escalera **«EdgeConnect On-Premises High Availability E-STU»**
completa — 8 tiers (20M/50M/100M/200M/500M/1G/2G/ILIMITADO) × 1/3/5/7 años. La lista del
distribuidor tarifa los 32 SKU (PLC GA, vigencia 2026-06-01) y la invariante histórica se
cumple celda a celda: **precio HA idéntico al estándar on-prem del mismo tier y término
(32/32)** — solo cambia el número de parte. Cableado como `LICENSES_HA[bw].onprem`
(familia CSV nueva «Suscripcion EdgeConnect On-Premises HA»); el dimensionador resuelve el
segundo nodo con su SKU HA en las tres modalidades y la nota declara la fuente. El CSV de
precios pasó de 234 a 272 filas por la vía gobernada (`importar-lista-aruba.js`, dry-run
limpio: 0 divergencias de precio repo↔lista).

**Corrección de datos cazada por la medición.** La revisión del 2026-09-15 (#28) declaró
«On-Premises no-HA: solo 1G y 2G tienen 7 años». Era un artefacto del filtro: esas filas se
describen «EC ONP 20M 7y E-STU» (sin «Gb» ni «yr Sub») y no se vieron. Re-verificación
literal: la lista SÍ publica los 6 términos que faltaban (20/50/100/200/500M y UL — PLC GA,
vigencia 2026-06-01); entran en `LICENSES[bw].onprem.y7` y el test de cobertura exacta de
7 años se reescribe con la corrección documentada.

**Mejora ejecutada (propuesta del plan 4): cantidades editables a mano en el BOM de Aruba.**
El dimensionador calcula cada cantidad, pero el ingeniero de preventa puede ajustarla: la
línea queda sellada «cantidad ajustada a mano — el cálculo decía N» (borde discontinuo en
el input, sello ámbar bajo la descripción), el ajuste viaja en el enlace compartido
(`#bomAjustes`, en `CAMPOS_ESCENARIO`), se declara en el texto plano (nota inline + sección
de cierre) y en el Excel (columna Notas + bloque propio), y alimenta TCO y totales porque
se aplica antes que todos los consumidores. Volver a la cifra calculada poda el ajuste
(nada que declarar); los ajustes de líneas ausentes se conservan por si la línea vuelve;
las líneas sin cifra (`qty` null, p. ej. SSE «consultar») no ofrecen control — lo que falta
ahí es el dato del cliente, no una cifra que pisar. Opt-in en `bom.js` (`o.ajustable`, como
`o.editable`): los otros 6 fabricantes no cambian. Regla del piloto: solo Aruba hasta que
el dueño diga lo contrario. Pruebas: `test/bom-ajustes.test.js` (7) y `test/e2e/e2e-ajustes.js`
(12), con sabotaje verificado (apagar `ajustable` rompe el E2E).

### Plan 4: datos 7 años, ópticas SFP en el BOM, candidatos clicables, UX del dimensionador y la batería E2E en el repo (2026-09-15/16)

Dos instrucciones del dueño, ejecutadas con la regla de siempre (fuente oficial > brief;
donde falta el dato, «consultar» — nunca inventado). Paquetes A-D integrados en
`feature/plan4` y fusionados a main.

**Paquete A — datos (pendientes 27/28/32).** Término de 7 años cableado donde la lista
oficial lo publica y `null` («consultar») donde no: Advanced SaaS 20M→2G (UL no existe en
la lista), On-Premises solo 1G/2G, Foundation 1G/UL, la escalera HA completa, Boost
(100M/10G) y DTD On-Prem. CARE no se extiende: la lista no trae «7Y FC». La medición cazó
un bug real: `tierPrice`/`tierSku` caían al *else* de 3 años — 7 años se habría cotizado a
precio de 3. JM538A y JM769A entran como variantes del EC-S (que ya era el EC-S-P);
JM778A (NFR) y JM538AR (reman) fuera a propósito. Títulos del BOM unificados a
«Lista/Neto» en tabla, Excel y texto plano (`bom.js`, compartido: es etiqueta, no cifra).

**Paquete B — el usuario decide la óptica y el equipo.** (1) Cada enlace WAN con medio
SFP 1G/SFP+ 10G añade su óptica al BOM (una por enlace × unidades del sitio, HA 1+1 = 2):
candidatas = compatibilidad oficial del modelo ∩ lista de precios, a la velocidad del
medio, sin DAC/TAA/PLC-ES. Cero opciones → aviso; una → automática; varias → **mensaje
para que el usuario elija, sin valor por defecto**, con la línea «PENDIENTE DE SELECCIÓN»
hasta que elija. La elección viaja en el enlace compartido (`#sfpPickData`). (2) La ficha
muestra «Equipos que cumplen · N» con la lista clicable de **todos** los candidatos que
pasan el filtro — no solo el recomendado — como opt-in de `ficha.js`; las otras páginas
no cambian.

**Paquete D — los 10 ajustes de UX pedidos (2026-09-15).** Botón «copiar enlace»
duplicado retirado (queda uno); «Limpiar escenario» con confirmación (URL a pelo +
recarga); el destino de tráfico declara su cálculo (×1,00 híbrido / ×1,05 cloud-first);
el perfil de datos de Boost se **queda** — decisión de arquitecto: alimenta el widget de
rendimiento, el dimensionado de reserva sin enlaces y la justificación de la ficha — y su
ayuda declara dónde actúa y dónde NO (ni el modelo del appliance ni el tier de la
suscripción, doctrina oficial); usuarios/dispositivos declara sus tres influencias y con
estrategia SSE se convierte en la **cantidad de licencias** (vacío → línea PENDIENTE y
campo marcado, nunca un «1» inventado); AIOps queda declarado como capacidad del nivel
Advanced — ya forzaba Advanced en EdgeConnect y Central, no es SKU aparte —; el campo
«cantidad (unidades)» se retira: las unidades se deducen de HA (1 o 2); el tier de caudal
declara que **tarifa y no dimensiona**, con la opción «Automático» mostrando en vivo el
tier deducido del Σ WAN del módulo 2; «Añadir a la lista de materiales» se mueve al final
de la pestaña; y la lista de materiales sube al principio y es **editable**: toda línea
(computada o manual) se puede retirar (✕) a una sección restaurable, las omisiones viajan
en el enlace (`#bomOmitidas`) y se excluyen de totales, texto, Excel y TCO.

**Paquete C — la batería E2E promovida al repo (#40).** `test/e2e/` con runner propio:
`npm run e2e` levanta un servidor desechable (puerto 4131, SQLite en /tmp) y corre los
cinco guiones en serie. Fuera de `verificar` a propósito (exige Chromium instalado) — el
workflow de CI se entrega en parche (`e2e-ci.patch`) por la falta de scope «workflow»
del token; aplicarlo es acción manual del dueño.

Verificación: 335/335 pruebas y eslint limpio (`npm run verificar`), 5/5 guiones E2E en
verde (51 comprobaciones). Fusionado a main (`769bf2c`); Railway despliega solo.

### Plan 3: underlay WAN carrier-grade, DTD cotizado, «pendiente de cotización», Nokia visible y enlace de escenario (2026-09-14)

Instrucción del dueño: «avanza con el 39, 29, 31, 33-38 — revisa el diseño de cómo se
ingresan los BW enlaces WAN del sitio (underlay), MEJÓRALO». Orquestación multi-agente
(dos frentes con archivos disjuntos, integrados por bundles).

- **Rediseño del input WAN underlay** (la petición central): de filas planas a filas
  tarjeta con badge por familia (MPLS/Internet/celular), toggle «Simétrico» (up sigue a
  down, persiste en el estado v2), botón duplicar, validación inline (down vacío, up>down,
  celular por fibra), sugerencia de medio por tipo solo si no se tocó a mano, y barra
  agregada viva `#wanResumen` (Σ↓/Σ↑, desglose MPLS/Internet, puertos WAN +2 LAN y
  semáforo de densidad contra el modelo — la misma función `evaluarPuertos` gobierna el
  descarte del EC-10104: la regla no se duplica). Contrato de IDs intacto.
- **#31**: DTD resultó tener escalera completa en la lista (SaaS/On-Prem × std/HA ×
  1/3/5 años, $372-$1.860, PLC GA) — el BOM lo cotiza con SKU y precio reales, dos
  líneas en HA 1+1, sin forzar Advanced (QuickSpecs p.32). CSV 192→204 por el importador.
- **#29**: las líneas sin precio verificado se etiquetan «PENDIENTE DE COTIZACIÓN» en el
  BOM, el texto plano y el Excel — el «consultar» ya no se puede olvidar al enviar.
- **#39** (secciones ausentes del brief, diseño de arquitecto autorizado): campos
  cliente/proyecto que encabezan BOM/Excel y botón «Copiar enlace del escenario» con
  round-trip (se encontró y corrigió un bug real: secMode no se restauraba desde la URL).
- **#35**: las dos páginas Nokia muestran su auditoría de puertos (alternativas no
  acumulables, nota literal en chasis modulares, tercer estado honesto).
- **#33**: la cabecera de `pantallas.yml` ya dice la verdad; el required check de main
  queda como acción manual del dueño en GitHub. **#34**: la regla de 3 estados del
  semáforo queda fijada en test sobre los 189 modelos. **#38**: verificado — las tres
  fuentes 403 salen «no comprobada», nunca en verde; es restricción del fabricante.

Verificación: 334/334 tests, E2E Chromium 12/12 del plan + comprobación rápida de
descuento/TCO/widget. Se corrigió en integración un binding de render que faltaba en
`nombreCliente`/`refProyecto`.

### Motor de ingeniería carrier-grade + submenú Cumplimiento Especial (2026-09-13)

Sección 1 del brief carrier-grade del dueño (el archivo llegó truncado — ver pendiente
39). El dimensionamiento del appliance pasa a una función matemática determinista y
testeable: `public/js/motor-ingenieria.js` (módulo puro UMD) con
`calcularRequerimientosIngenieria` — IMIX por perfil de tráfico (0,70 empresarial /
0,55 voz / 1,00 backup), FEC 5/15/25 %, cargo de seguridad (35 % NGFW local / 5 % SSE),
margen de crecimiento, segregación 70/30 del caudal total con Local Breakout, flujos
80/150 por usuario y licencia tasada por el ancho de banda físico agregado. Sin doble
conteo de IMIX: el requerimiento ya viene ÷IMIX, así que EdgeConnect compara contra el
throughput nominal publicado (los gateways 9000/9200 conservan su regla). Nuevo
selector de perfil de tráfico; el widget declara la fórmula única con sus componentes
vivos. TAA/NAL/FIPS recogidas en el submenú colapsable «Cumplimiento Especial / Sector
Público», cerrado por defecto. Los inputs manuales de «throughput de firewall» y
«túneles IPSec» no existían ya — el brief pedía eliminarlos: verificado, el
dimensionado es por flujos y caudal agregado. 7 tests nuevos de la fórmula (273/273 en
verde), E2E Chromium 13/13.

### La capa comercial sale del archivo de Aruba (2026-09-13)

Paso 1 del orden de [`docs/portabilidad-aruba.md`](docs/portabilidad-aruba.md), aprobado por el
dueño. Mientras TCO y simulador de descuento vivieran dentro de las 2.117 líneas de Aruba,
portarlos a los otros siete significaba copiarlos siete veces — el fallo de `llevarABom` en seis
copias con más superficie.

- **`BOM.simuladorDescuento()`**: el control se **construye** en el módulo, con sus tramos y su
  aviso de «simulador genérico, no el descuento real del distribuidor». Es la decisión de
  `ESTADO.botonEnlace` — añadirlo a otra pantalla es una línea, no doce de marcado repetido.
  Conserva los ids `selDescuento`/`dtoCustom` porque `estado.js` los serializa en el enlace
  compartido, y por eso quedan declarados en `TARDIOS`.
- **`BOM.tco()`**: se calcula sobre las **filas del BOM**, que ya son la forma neutra. Antes
  salía de los objetos de licenciamiento de Aruba, y eso era lo que lo ataba a una sola página.
  **Qué cuenta como OPEX lo declara la página**, por lo mismo que las reglas de agregación.

**Medido antes de cambiarlo, no supuesto.** Siete escenarios en el navegador con las tres cifras
(CAPEX, OPEX anual, TCO) idénticas a las del cálculo anterior. El primer contraste solo cubría el
camino fácil —sin Boost ni seguridad— así que se repitió activando Boost y DTD, que son los que
traen las categorías del camino largo; sin eso la clasificación habría quedado verificada a
medias.

**Y el comprobador de ayer se ganó el sueldo:** al sacar el marcado del HTML, `npm run catalogo`
reportó en el acto «selDescuento: no existe ningún control con ese id». La prueba que lo guarda
también se rompió, pero por un motivo distinto y peor: exigía que la única excepción fuera
`verdict-sel`, codificando el estado de ese día en vez de la regla. Corregida para afirmar lo que
importa — que las excepciones se usan y ninguna ha caducado.

**Lo que NO subió**: la matriz de accesorios. Solo Aruba tiene compatibilidad declarada, y
construir la pantalla antes que el dato produce seis paneles vacíos — es el paso 4 del orden, y
está bloqueado por dato, no por código.

287/287 pruebas, lint limpio y 16/16 pantallas.

### Los perfiles multi-sede dejan de ser de un solo fabricante (2026-09-13)

Sale de la **revisión de arquitectura** que pidió el dueño sobre lo que dejó el otro motor de IA
—«valida la estructura de los fabricantes que faltan, no la forma como se calcula el
dimensionamiento, porque se dimensionan de diferente manera»—. El informe completo está en
[`docs/portabilidad-aruba.md`](docs/portabilidad-aruba.md), y de él salen también los pendientes
34 y 35.

**El defecto.** Los perfiles nacieron en `arubaPerfilesV1`, una clave por fabricante. Un perfil
multi-sede es *por definición* el caso de las 50 sucursales, y un despliegue real de 50 sedes
**mezcla marcas**: spokes Fortinet contra un core Nokia, EdgeConnect en sucursal con Catalyst en
el datacenter. Con una clave por página, el consolidado de cada fabricante ignoraba al resto en
silencio — el mismo fallo que `presales-bom-refs:<pathname>` ya tuvo y que se corrigió el
2026-09-09. Se arregló **antes** de portar la función a los otros siete, porque después costaba
siete veces.

- **Una sola clave** (`presales-perfiles`) en `bom.js`, copiando el patrón que ese archivo ya usa
  para las referencias: cada perfil lleva su `vendor` dentro, y la clave vieja **se migra** en la
  primera lectura y se borra. Sin eso, quien ya tuviera perfiles los vería desaparecer al
  desplegar — justo la pérdida que el cambio venía a evitar.
- **Cargar es del fabricante; consolidar no.** `campos` son los ids del formulario de *esa*
  página, así que aplicar un perfil de Fortinet al de Aruba no significa nada y no se ofrece. Pero
  `filas` es la forma neutra que los siete comparten, y el BOM global suma **todos**: ese es el
  valor real, y es la distinción que hace correcto el cambio.
- **Se borra por id, no por índice.** En una lista compartida el índice deja de ser estable en
  cuanto otro dimensionador guarda algo, y borrar por posición borraría el perfil del vecino.
- **Las reglas de agregación las declara la página.** El pool de Boost en una línea y el
  Orchestrator único por fabric son el modelo **comercial de Aruba**, no una regla universal:
  dejarlas a fuego en el módulo compartido haría que cualquier fabricante que use esos nombres de
  categoría heredara la semántica de precios de Aruba sin que nadie lo decidiera. Quien no declare
  nada multiplica todo por sedes.
- **Y si el consolidado mezcla marcas se dice en pantalla**, no solo en el Excel: leer las reglas
  de Aruba como si aplicaran a las líneas de otro fabricante es exactamente lo que un aviso
  ausente invita a hacer.

**Comprobado que las pruebas detectan, no solo que pasan:** desactivando la migración reportan
los perfiles perdidos; devolviendo las reglas a fuego, el fabricante que no las declara hereda la
semántica de Aruba y la prueba lo dice.

Conducido en Chromium de extremo a extremo: tres perfiles guardados, uno de Fortinet sembrado a
mano que **no** aparece en la lista de Aruba pero **sí** entra en el consolidado, supervivencia a
la recarga, borrado del perfil del medio sin tocar al vecino, y una cotización de **52 sedes con
FortiGate 60F ×40 y EC-M ×12 juntos**. 287/287 pruebas (8 nuevas) y 16/16 pantallas.

### Una pantalla y su estado ya no se desincronizan en silencio (2026-09-13)

Mejora propuesta al cerrar la entrega anterior y aprobada por el dueño. Sale de mirar los dos
fallos del día y ver que eran **el mismo**: el refactor de Aruba retiró `#bw` y ninguna
comprobación cruzó ese cambio con la lista de campos que el enlace compartido repone. El
inventario miraba el catálogo —cobertura, ciclo de vida, precios, procedencia— y **nada** de
la capa de presentación.

`npm run catalogo` gana la sección «PANTALLAS»: cruza los `campos` que cada dimensionador
declara en `ESTADO.vincular()` contra los `id=` de su propio HTML. Hoy salen las ocho en
verde, 124 campos en total.

Cuatro decisiones, cada una contra un modo de fallo concreto:

- **Se parsea, no se ejecuta.** En `dimensionador-nokia-7220ixr.js` la llamada vive tras un
  `await fetch(...)`, así que cargar el módulo exigiría doblar la red y el DOM para leer un
  array literal. Cuando `campos:` es un identificador —el `CAMPOS_ESCENARIO` de Aruba— se
  resuelve su declaración en el mismo archivo.
- **Una página que no se sepa leer es un error, no un salto.** Un comprobador que no
  comprueba se porta igual que uno que pasa: es `CISCO_EOL_MODELS` otra vez.
- **Las excepciones caducan solas.** `verdict-sel` no está en ningún HTML porque lo construye
  `ficha.js`; la excepción declara el módulo **y el ancla que debe seguir existiendo en él**.
- **También se comprueba que se miran las ocho páginas.** Un parser que devolviera lista vacía
  dejaría todo en verde sin haber mirado nada.

**Y el ancla se aprendió saboteando, no razonando.** La primera versión anclaba en
`${cid}-sel`; al renombrar el control a `${cid}-selector` para ver si saltaba, **no saltó** —
el ancla corta seguía siendo subcadena de la larga, así que la excepción se daba por viva
sobre un control que ya no existía. Con el ancla completa (`<select id="${cid}-sel">`) sí
salta. Los otros tres sabotajes —renombrar un `id` del HTML, romper la forma de la llamada y
quitar un dimensionador— se detectaron a la primera.

La regla vive en `scripts/catalogo-check.js` y `test/pantallas-campos.test.js` solo la afirma,
una sola implementación como `FICHA.rango()` con el fin de venta. Está en las pruebas y no
solo en el inventario porque `npm run catalogo` se corre cuando alguien se acuerda, y
`npm run verificar` corre en cada push. 279/279 pruebas (3 nuevas) y 16/16 pantallas.

### Un enlace compartido ya no se pierde en silencio (2026-09-13)

Mejora propuesta al cerrar la entrega anterior y aprobada por el dueño. Sale de lo que se
acababa de tocar: `migrarEstadoV1()` salvó los enlaces de Aruba cuando esa pantalla retiró su
campo `#bw`, pero **solo porque alguien se acordó de escribirla para esa página**. La regla
general no existía, así que cualquier otra pantalla que renombre un control seguiría dejando
al receptor viendo otro escenario sin una sola señal — el mismo modo de fallo que
`RENOMBRADAS` evita para el nombre del archivo, y que nadie cubría para los parámetros.

`ESTADO.vincular()` devuelve ahora `ignorados` y `ESTADO.avisoOrigen()` los **nombra** en
pantalla, en los ocho dimensionadores a la vez porque el módulo es compartido. Tres decisiones
son lo que separa un aviso útil de un ruido que se aprende a ignorar:

- **Se avisa aunque el enlace no traiga ningún campo reconocible.** Es el caso peor: la
  pantalla sale entera en blanco, y sin el aviso no habría absolutamente nada que explicara
  por qué. Es justo el caso que un `if (!origen) return` habría dejado fuera.
- **No se denuncia lo que la página sabe migrar.** Se declara en `cfg.migrados`, y Aruba pasa
  `PARAMS_V1` — la misma constante que usa `migrarEstadoV1()`, extraída para que no haya dos
  listas iguales en dos sitios, que es como se desincronizan.
- **Tampoco las marcas de campaña** (`utm_*`, `gclid`, `fbclid`…), que nunca fueron escenario.

Los nombres se escapan antes de pintarse —la URL la escribe quien manda el enlace, y confiar
eso a la CSP sería dejar la corrección de una pantalla en manos de una cabecera de otra capa—
y la lista se acota a seis, porque un párrafo que nadie lee no avisa.

Verificado en Chromium en seis escenarios, incluidos los dos que importan: un enlace v1 de
Aruba **no** dispara el aviso (se migró de verdad) y uno de Cisco con solo parámetros viejos
**sí** lo dispara. `npm run pantallas` guarda el falso positivo: quitando `migrados` de Aruba,
el informe lo reporta. 276/276 pruebas (10 nuevas) y 16/16 pantallas.

### El verificador de pantallas vuelve a conducir Aruba, y ahora dice qué le falta (2026-09-13)

`pantallas.yml` llevaba **cuatro días en rojo** sobre `main`. El refactor del dimensionador
Aruba sustituyó su campo `#bw` por el Multi-Underlay Builder, y `scripts/verificar-pantallas.js`
seguía rellenando `#bw` en las ocho páginas: `page.fill: Timeout 30000ms exceeded`, 14/15. La
pantalla que más cambió —1.702 líneas— se quedó sin la única comprobación que la conduce en un
navegador, que es justo la clase de fallo que este repositorio documenta como invisible a `curl`.

**Se midió antes de tocar nada, y la conclusión importa: la página funciona.** Conducida a mano
en Chromium, 13 equipos cumplen a 2,5 Gbps, EC-M sale recomendado, el builder responde y el BOM
pinta 20 KB; los únicos errores de consola son los ambientales de siempre (Google Fonts y el
favicon) y no hay una sola petición fallida al propio origen. El rojo era del verificador.

Qué cambió, y por qué cada cosa:

- **`caudal(page)` es ahora un gancho opcional por página.** El defecto de fondo no era el
  selector: era asumir una sola forma para ocho páginas. Siete siguen entrando con una línea
  (el `#bw` por defecto) y Aruba declara el suyo sobre las filas del builder.
- **Un control ausente falla en el acto y con su nombre**, no con treinta segundos de espera.
  Un rojo que tarda medio minuto en decir «ese campo ya no existe» se lee como lentitud del
  ejecutor, y así es como se acaba ignorando.
- **La ficha tiene que repintarse al mover el caudal.** El comentario del script lo prometía
  desde que se escribió; nadie lo comprobaba.
- **El E2E del refactor vuelve al repositorio.** El que declaró la entrega anterior (11/11)
  vivía en `/tmp/e2e-refactor.js` y murió con su sesión: 1.702 líneas nuevas sin una sola
  comprobación repetible. Ahora corre en cada push: segunda fila WAN, y el banner Microbranch
  apareciendo y **retirándose** en sus umbrales.
- **Pantalla nueva: el enlace compartido v1.** `migrarEstadoV1()` estaba bien escrita y nunca se
  había ejecutado en un navegador. Verificada a mano en los tres casos —`?bw=2500&unit=1`,
  `?bw=2.5&unit=1000` (multiplica bien) y MPLS+Internet, que da dos filas— y fijada como
  pantalla propia. Un enlace viejo que aterriza con los valores por defecto es **peor que un
  404 porque no se nota**: el receptor ve otra recomendación y no tiene cómo saberlo.
- **La navegación del portal deja de esperar al evento `load`.** Medido desde este entorno: las
  siete navegaciones alternaban 90 ms y **12.100 ms**, y esos 12 segundos son el mismo bloqueo
  de Google Fonts que `js/fuentes.js` documenta. Lo que se afirma ahí es que el botón *navega*,
  así que se espera a `commit` más `domcontentloaded`. Los `ERR_ABORTED` de la vuelta al portal
  se descuentan por **el momento** en que ocurren y no por su nombre: fuera de esa ventana, un
  script cancelado sigue siendo un fallo.

**Se comprobó que detecta, no solo que pasa**, con tres sabotajes: renombrando `data-campo=down`
dice que falta ese control; con el banner forzado a oculto lo declara; y desactivando
`migrarEstadoV1()` reporta la fila DIA vacía, que es exactamente su fallo silencioso.

16/16 pantallas y 266/266 pruebas. De aquí sale el pendiente **33**: Railway desplegó ese commit
con SUCCESS pese al rojo, así que `pantallas` no frena un despliegue aunque su cabecera diga que
sí. También se archivaron `SPEC.md` y `plan.md` —artefactos de proceso de otro motor, con rutas
`/mnt/agents/output/` que no existen aquí— en `docs/refactor-aruba-2026-09-13/`, y se reconcilió
`CLAUDE.md`, que tras 54 commits solo había cambiado tres líneas.

### Refactor integral del dimensionador Aruba en 7 módulos (2026-09-13)

Brief del dueño ejecutado con orquestación multi-agente (`docs/refactor-aruba-2026-09-13/SPEC.md` como contrato, dos
frentes —datos y motor/UI— integrados por bundles). Todo lo que el brief contradecía a
la fuente oficial quedó resuelto a favor de la fuente oficial y documentado (pendientes
28-32): S2N67A a $9.096 (no $7.146), PSU del 9240 = R7J63A $747 (no R1C72A, que es un
kit de APs), Boost con factores oficiales 1,3/2,0/1,8 (no ×3,5), DTD sin forzar
Advanced (QuickSpecs p.32) y SSE «consultar» (R8M36AAE no está en la lista).

1. **Multi-Underlay Builder + banner Microbranch**: filas WAN dinámicas
   (tipo MPLS L3/L2, DIA, banda ancha, 4G/5G × medio RJ45/SFP 1G/SFP+ 10G × down/up),
   estado v2 con migración desde la serialización v1, y banner Microbranch con umbrales
   gobernados por el API (≤10 usuarios, ≤50 Mbps, sin MPLS).
2. **Motor 70/30 y auditoría de puertos**: con Local Breakout el ~30 % del tráfico de
   Internet se declara descargado del overlay (el appliance se sigue dimensionando por
   el caudal total, regla oficial); auditoría de puertos que descarta el EC-10104 con
   >4 puertos o fibra (escalado con alerta) y avisa de densidad SFP en 10106/10108 (>2),
   10150 (>8) y 9240 (>4).
3. **Licenciamiento calibrado**: tiers 20M/50M/200M/500M/2G añadidos a Advanced, On-Prem
   y Advanced HA con los SKU y precios literales de la lista (45 filas nuevas en el CSV,
   147→192, diff del importador en 0); Foundation restringido a 100M/1G/UL con bloqueo
   en el selector (restricción oficial verificada); badge «Advanced requerida por
   especificación oficial»; SSE inyectada por usuario, co-terminada, «consultar».
4. **Inyección de hardware**: Boost>0 en EC-10150 añade S2N67A (qty mín 1, nota de
   fábrica «Boost >1 Gbps requiere el kit»); EC-10150 declara doble PSU de fábrica;
   checkbox Dual PSU en Gateway 9240 → R7J63A.
5. **Widget de rendimiento**: 3 barras (física / útil tras FEC / percibida con Boost
   por perfil) + estimación IMIX del brief con desviación documentada (pendiente 30).
6. **TCO y multi-sede**: simulador genérico de descuento partner (0/35/45/50/55 %/
   personalizado — declarado como NO el descuento real del distribuidor), columnas
   Lista/Neto, pie CAPEX/OPEX-anual/TCO, y perfiles multi-sede en localStorage con
   consolidado Σ(BOM×sedes) y export Excel.
7. **Ciclo de vida, delta viewer y OS matrix**: ya existían; verificados intactos.

Verificación: 266/266 tests (`npm run verificar`), E2E Chromium 11/11 (builder,
escalado EC-10104, banner, 70/30, tiers filtrados, SSE, S2N67A, widget, TCO, perfiles).

### Importador gobernado de lista de precios + matriz de accesorios contra la compatibilidad oficial (2026-09-13)

Instrucción del dueño: «Aplica como un arquitecto la mejora propuesta. Con respecto a
los pendientes busca en la web los accesorios y compáralo con los SKU de la lista de
precios — los accesorios como transceptores están en esta lista, debes cruzarlos —
busca como un experto».

**El importador gobernado (`scripts/importar-lista-aruba.js`).** Convierte la
actualización de precios en un proceso: lee el txt del distribuidor extrayendo
ÚNICAMENTE las 5 columnas permitidas (SKU, descripción, List Price, vigencia, PLC) con
validación literal de cabecera (un cambio de formato aborta, no adivina), dedup por
vigencia reciente, y confronta tres estados: la lista oficial, la declaración del repo
(qué SKU se cotizan — 147 en el roster) y el CSV vigente. Emite el diff en cinco
canales (precios repo≠lista, filas CSV que cambian, transiciones PLC, ausentes de la
lista, candidatos nuevos por cubos edgeconnect/ópticas/gateways) para aprobación
humana. Dry-run por defecto; `--aplicar` reescribe SOLO el CSV del cotizador; jamás
toca `aruba.js` (el commit gobernado es del humano, y el test de coherencia dual rompe
la build hasta que lo haga). Guardarraíl de confidencialidad: ninguna salida puede
contener el separador de la lista ni rastro de las columnas prohibidas. 7 tests con
fixtures sintéticos. Primer dry-run real: precios del repo 100 % conformes; detectó la
transición S0B67A (EC-XL) GA→ES, la renovación de vigencia de JZ878A y la ausencia del
SKU pelado JM962A.

**La matriz de accesorios, reescrita contra la compatibilidad oficial.** Dos
investigadores con fuentes oficiales HPE/Aruba (VSG SD-Branch, Hardware Reference
Guide Rev S dic-2025, QuickSpecs EC v18 y 9200 v14, Install Guide EC-10150, Hardware
Accessories Guide PN 201911 Rev F) produjeron la matriz por plataforma; el cruce con
la lista confirmó que TODOS los SKU necesarios existen en ella. Refutaciones
aplicadas: JL747B fuera (el HRG lo marca no soportado en toda la línea EC), J4860D y
J9285D fuera de EdgeConnect (sin matriz; J9285D sí en 9240), J9153D fuera de
EC-10108/10150 (el VSG no lo certifica ahí), JL485A/JL487A/JL488A fuera del EC-10150
(sin confirmar; siguen en 9240). Ampliaciones confirmadas: EC-10108 gana 25G
(JL484A/JL486A/JL489A) y 10G cobre (JL563C); EC-10150 gana JM532A/JM533A, S2N63A,
JL563C, JL749A y el tren Network Memory completo; la línea anterior gana
JM534A/JM535A (EC-SFP-LR/SR) y las TAA 1G/10G por columna HRG; EC-XS gana su kit
JM965A y su adaptador JM996A; EC-10106/10108 ganan el kit S2D96A y el adaptador
S2D95A; el 9240 gana las ópticas 1G/10G del QuickSpecs 9200. Catálogo: 40 → 53 SKU;
CSV: 135 → 148 filas (regenerado con el propio importador). **S2N67A reclasificado**:
«NM» = Network Memory (no network module) — kit de 2× NVMe 1,6 TB del EC-10150/10170;
con él Boost llega a 8 Gbps en el 10150 (1 Gbps sin él). Pendientes cerrados: #20
(matriz sin inferencias), #21 (EC-XS y legacy), #23 (EC-10106/10108 no tienen slot —
SSD interno 120 GB no reemplazable; Boost corre sobre él hasta 250/500 Mbps). Nuevos
pendientes: #24 (1G en 10108/10150, conflicto VSG vs HRG), #25 (J8177E/J9153E/R9Y49A
sin matriz para nuestros modelos), #26 (S0W40A ausente de la lista), #27 (variantes de
modelo detectadas — decisión de surtido).

**Verificación.** 263/263 pruebas (el test de integridad codifica ahora la matriz
oficial SKU por SKU y plataforma) y eslint verde. E2E en Chromium: EC-10106 con 14
accesorios sin los refutados, EC-10108 con 25G, EC-10150 con el tren Network Memory
(S2N67A $9.096 + repuestos), EC-XS con kit y adaptador, EC-S/EC-L con ópticas
oficiales, 9240 con 20 accesorios 1G/10G/25G.

### Catálogo de accesorios corregido y ampliado contra la lista de precios oficial (fase 12, 2026-09-13)

Instrucción del dueño: «Vamos a corregir los pendientes — debes basarte en la lista de
precios que te subí, esa es la fuente oficial de los SKU y precios de lista. Amplía el
catálogo maestro con lo declarado anteriormente». Se extrajeron de la lista ÚNICAMENTE
Product Number, Short Description, List Price, List Price Effective Date y PLC Status
(la regla de confidencialidad del repo prohíbe el resto de columnas).

**Correcciones que la lista oficial hace al brief de la fase 12.** Cuatro SKU estaban
mal descritos: **R1C72A** es un kit de montaje de APs ($415), no la PSU del 9240 — la
PSU real es **R7J63A** «9240 550W AC Power supply» ($747); **R1B23A/R1B24A** son
gateways 9004 regionales (IL/EG, $2.505), no kits de rack — los racks reales son
**R1B30A** (9004, $282) y **R4X13A** (9012, $71); **JW084A** es el rack del 7005
($282), no un cable de consola — la consola AP-CBL-SERU real es **JY728A** ($36);
**JL747A** es 1G cobre TAA en estado **ES** ($854), no un 10G SR — su sucesor GA es
**JL747B**. Y todos los precios del brief eran ~40-60 % más bajos que el List oficial
(parecían precio neto): corregidos uno a uno con su vigencia y PLC.

**S2N67A y la sincronización Boost → NVMe.** La lista describe S2N67A como «EC
10150/10170 NM» ($9.096) — módulo del EC-10150, no un kit «EC 10010». Como la lista no
tiene kit de almacenamiento para EC-10106/10108, la sincronización automática
Boost → NVMe de esos modelos se retira (el requisito queda documentado en *Datos por
confirmar* #23) y S2N67A se ofrece solo en EC-10150.

**Ampliación con lo declarado.** 40 SKUs en el catálogo maestro: los transceptores y
DAC 1G/10G/25G corregidos, más lo que la lista aporta para los modelos que no tenían
nada — EC-S (PSU JM779A, kit JZ893A), EC-M (PSU JZ955A, kit JZ894A), EC-L/XL (SSD
JZ889A, montaje central JZ888A), Gateway 9114 (fan tray S2N64A), 9004-LTE (rack
R3W17A) y los racks de la línea anterior 7000/7200 (JW084A, JX934A, JW085A, JW086A,
JW107A). El cobre 1G del 9240 se ofrece como reman S1H24AR ($353) porque el SKU nuevo
no figura en la lista. Regla nueva: un SKU en PLC «ES» nunca entra en la matriz de
compatibilidad — queda en el catálogo solo para trazabilidad.

**Doble vista, una fuente.** El CSV del cotizador
(`aruba-lista-precios-hpe.csv`, 95 → 135 filas) gana la familia «Accesorios
EdgeConnect y gateways», y un test nuevo exige que catálogo maestro y CSV digan lo
mismo SKU a SKU (precio, vigencia y PLC) — las dos vistas de la misma fuente no pueden
divergir sin romper la build.

**Verificación.** 256/256 pruebas (9 de integridad de accesorios: cobertura de los 40,
campos obligatorios, matriz referenciando solo lo existente, ES fuera de la matriz,
S2N67A solo en 10150, regla VSG 1G con la excepción declarada del 9240, exclusividad de
PSU/racks/fan, coherencia catálogo ↔ CSV) y eslint verde. E2E en Chromium: EC-10106 con
15 items a precios oficiales y sin S2N67A (con Boost ON tampoco), EC-10150 con el
módulo a $9.096, 9240 con R7J63A $747 y S1H24AR $353, EC-S/EC-L/7005/9114 con sus
accesorios oficiales.

### Catálogo maestro de accesorios ARUBA_ACCESSORY_CATALOG y sincronización Boost → NVMe (fase 12, 2026-09-13)

Instrucción del dueño: «Ejecuta el prompt adjunto» — brief de Ingeniería Principal /
Arquitecto Senior HPE Aruba Networking cuya sección 1.1 declara el
`ARUBA_ACCESSORY_CATALOG` verbatim (26 SKUs: transceptores 1G/10G/25G, DAC, kit NVMe
Boost, PSU, racks y consola, con List Price HPE) como «modelo de datos centralizado» que
gobierna compatibilidad y cotización.

**Qué se construyó.** El catálogo verbatim vive en `server/seed/legacyData/aruba.js` con
la matriz `ACCESSORY_COMPAT` (modelo → accesorios ofertables) anclada al VSG oficial —
1G fibra solo EC-10106; 10G/DAC en EC-10106/10108/10150; EC-10104 sin SFP; 9240 = 4x
SFP28 — y a lo declarado en el brief (25G → EC-10150/9240, R1C72A → 9240, racks
9004/9012, NVMe Boost → S2N67A). La proyección sirve `accessories` y `accessoryCompat`
al dimensionador: la página ya no mantiene precios ni matriz propios — el modal de
accesorios de la fase 11 se refactorizó para consumir el maestro con descripciones
oficiales literales, etiquetas velocidad/medio/alcance y destacado TAA. Los precios del
brief sustituyen a los provisionales de partner de la fase 11 (discrepancias
documentadas en el código y en *Datos por confirmar* #18/#19).

**Sincronización Boost → NVMe.** La optimización con deduplicación exige almacenamiento
local: con Boost activo en EC-10106/10108 el kit S2N67A se añade solo al BOM (mínimo 1,
no baja mientras Boost siga, marcado «añadido automáticamente») y se retira al apagar
Boost o cambiar de modelo; el EC-10150 declara sus 2 SSD NVMe de fábrica y no lo ofrece.

**Verificación.** 254/254 pruebas (248 + 6 nuevas de integridad del catálogo: 26 SKUs
verbatim, precios positivos, matriz referenciando solo SKUs/modelos reales, S2N67A solo
donde aplica, regla VSG 1G, PSU/racks en su gateway) y eslint verde. E2E en Chromium:
NVMe auto con Boost ON en EC-10106, bloqueo del mínimo, retirada al apagar Boost,
ausencia en EC-10150, 16/15/9 items por modelo, TAA visible.

### Madurez del catálogo: semáforo de ciclo de vida, matriz de SO, salud de fuentes y delta de precios (fase 11, E5, 2026-09-13)

**Semáforo de ciclo de vida** en la tabla del catálogo: verde = generación actual,
naranja = línea anterior (AOS 8, QuickSpecs RETIRED) con sucesor natural etiquetado como
«inferencia por capacidad, sin doc oficial» (mapa `SUCESORES` en `aruba.js`, decisión del
dueño), rojo = fin de venta anunciado con fecha de último pedido.

**Matriz de versiones mínimas de SO** (`OS_MATRIX`): ECOS mínimo por plataforma
EdgeConnect (8.3.1.0 → 9.5.3.0 con notas de tren y PIDs) y trenes AOS 8/10 por serie de
gateway (7000/7200 alcanzan 10.3.1.1 SSR aunque estén RETIRED; 9200 → 10.4.0.0 LSR;
9100 → 10.5/10.6/10.7 según modelo). Proyectada al dimensionador y pintada en la pestaña
«Fuentes».

**Salud de las fuentes bajo demanda**: endpoint `GET /api/fuentes/:vendor/salud` que
re-corre el vigía contra cada URL pública y botón en «Fuentes» que lo pinta (leído /
inalcanzable / sin URL). No corre solo: cada revisión pega contra los servidores del
fabricante.

**Delta de precios**: sube una lista CSV nueva y la compara en memoria contra la vigente
(alzas, bajas, SKUs nuevos, desaparecidos, PLC → ES) sin persistir nada — la decisión de
actualizar la lista gobernante queda en manos del dueño.

**Verificación.** 248/248 pruebas y eslint verde. E2E en Chromium: semáforo 15 verde /
9 naranja / 1 rojo, OS matrix con ambas tablas, delta detectando alza +9,9 %, baja −5,0 %,
SKU nuevo, 90 desaparecidos y PLC → ES en una lista de prueba, endpoint de salud
respondiendo por las 3 fuentes de Aruba.

### Sincronización total del módulo Aruba: revisión de diseño automática (fase 10, 2026-09-13)

Instrucción del dueño: «analiza como un arquitecto en networking de Aruba e integra tus
observaciones en el dimensionador… todo el módulo debe estar sincronizado para que cada
función que se active llame la licencia y calcule automáticamente; valida por web los
ajustes necesarios a nivel de diseño». Tres investigadores validaron cada regla contra
fuentes oficiales (VSG SD-Branch, data sheet de suscripciones a50010073enw, QuickSpecs
a50004289enw, Orchestrator Docs, tabla de licenciamiento de Central) antes de tocar código.

**Revisión del diseño (par técnico automático).** Nueva sección del BOM con reglas
declarativas (`REGLAS_DISENO`) y semáforo: ROJO = incoherencia que hay que corregir
(modelo elegido por debajo de los flujos o del caudal estimado, HA con cantidad ≠ 2,
**DTD en EC-XS** — la doc oficial de IDS/IPS confirma que no corre ahí); AVISO = decisión
que hay que saber defender (Boost/DTD huérfanos sin suscripción, HA on-prem 2× declarado,
EC-V virtual, sobredimensionamiento bajo el suelo del rango publicado); OK = diseño
coherente. El portal ya no solo cotiza: revisa el diseño antes de que salga al cliente.

**Sincronía función → licencia → cálculo.** DTD fuerza el filtro de familia a EdgeConnect
(es licencia EC, QuickSpecs p.32) y sale de la deducción de Central; EC-V oculta el nivel
CARE (appliance virtual: el soporte de hardware no aplica, la ficha lo declara);
On-Premises agrega la fila de Orchestrator auto-alojado — el data sheet oficial confirma
que el software va **incluido** en la suscripción E-STU y lo que cotiza el cliente es el
alojamiento (VM, uptime, backup, upgrades).

**Precisiones oficiales integradas.** Foundation = exactamente 2 VRF (default y guest) y
AppExpress solo monitor; Advanced = AppExpress con steering; On-Prem existe solo como
«Advanced On-Prem»; Central Advanced = segmentación de extremo a extremo / AIOps ampliada
(la retención de Central es la misma en ambos niveles — corregido); FEC anclado a los
ratios oficiales 1:8 (12,5 %) y 1:4 (25 %) con FEC adaptativo; headroom con ancla en el
SLA DPS del 75 % de la guía de diseño; flujos por modelo (256.000/2.000.000) y tier por
caudal agregado del sitio, ambos confirmados por el VSG. Atribución corregida: la paridad
de precio de los SKU HA sale de la **lista de precios documentada** (HPE no publica
precios); la existencia del SKU y la regla «match tier, bandwidth, term» salen del
QuickSpecs/VSG. Lo que quedó **sin fuente** se declara como regla de trabajo del
arquitecto: flujos por usuario (80-100/150-200) y Boost = 30 % del WAN privado (la única
regla de campo localizada, no oficial, dice 40 % — discrepancia documentada en el motor).

**Verificación.** 248/248 pruebas (2 nuevas: EC-V sin CARE_SKU, overhead FEC anclado a
los ratios oficiales) y eslint verde. E2E en Chromium: semáforo OK en diseño coherente,
ROJO por flujos+caudal al forzar EC-10104 bajo, ROJO DTD+EC-XS, AVISO Boost huérfano (y
Boost fuera del BOM), EC-V sin fila de soporte, fila Orchestrator on-prem, DTD moviendo
el filtro de familia, Central Foundation/Advanced con el texto corregido, ficha 9004 con
las sesiones SD-WAN, humo Fortinet 60F, cero errores de consola.

### Refactor del Dimensionador y BOM Aruba: SD-WAN por flujos + licenciamiento 100% automático (2026-09-13)

Disparado por el brief del dueño («Actúa como un Arquitecto de Soluciones de Redes
especializado en HPE Aruba Networking — EdgeConnect Enterprise y SD-Branch»): la SD-WAN de
Aruba no se rige por túneles IPsec estáticos sino por Business Intent Overlays (BIO),
flujos simultáneos y First-packet iQ (10.000+ apps; AppRF 3.500+ en SD-Branch). Aruba es el
piloto — los demás fabricantes no se tocan hasta que el dueño lo diga.

**Depuración de parámetros.** Fuera el campo «Túneles IPSec» (de las etiquetas, del «por
qué» y de las características); fuera el input manual de throughput de firewall; las
variantes gubernamentales (TAA/NAL/FIPS) se ocultan del catálogo pedible tras un botón
«Variantes gubernamentales · mostrar/ocultar» (86 visibles ↔ 94 totales), y las opciones
avanzadas (On-Premises, puntero TAA) viven en un `<details>` del panel 4.

**Dimensionamiento por flujos y aplicaciones.** Nuevo selector de perfil de entorno
(estándar ~100 / intensivo ~200 flujos por usuario — se usa el extremo alto como headroom
incorporado) y `estadoDerivado()` calcula `flujosReq = usuarios × tasa`: los candidatos que
no los soportan quedan descartados con su motivo («600.000 flujos req > 256.000 pub») y un
medidor nuevo lo pinta. Nuevo selector de estrategia de aplicaciones: Híbrido/DC privado
(Path Conditioning FEC/POC) ↔ Cloud-First/SaaS (First-packet iQ para DIA/SSE), con hint
dinámico y narrativa en el «por qué». La pregunta Boost (CIFS/SMB, transferencias masivas,
satelitales) auto-calcula Boost = 30% del tráfico WAN privado (`needProc × (1+FEC)`) y
mete sus bloques de 100 Mbps y SKU sin tocar nada más.

**Motor de licenciamiento 100% automático.** Se eliminó la selección manual de licencia:
el nivel (Foundation/Advanced) se deduce de las funciones del diseño según la matriz
oficial del QuickSpecs v18 p.31, y el SKU sale de la familia/tier de hardware + ancho de
banda + término. Co-terminación real: un único selector [1,3,5 años] gobierna licencias,
Central y soportes. HA 1+1 (qty=2 en EdgeConnect): el BOM parte la suscripción en 1×
estándar (nodo primario) + 1× SKU «HA» del segundo nodo — HPE publica juego propio de 18
SKU con precio idéntico tier a tier y año a año (invariante guardada por test). Lo manual
que queda es opt-out declarado: «no incluir suscripción», «solo hardware», «sin Central».

**Correcciones del brief contra la fuente oficial (decisiones documentadas).** El brief
proponía deducir Advanced de «DPS por SLA de aplicación, NGFW/IDS/IPS o AIOps»; el
QuickSpecs v18 p.31-32 dice otra cosa y manda la fuente: Dynamic Path Steering y el NGFW
completo son **Foundation**; IDS/IPS no es tier sino la licencia opcional aparte **Dynamic
Threat Defense** (p.32, sin precio publicado → línea «consultar» en el BOM); DIA /
First-packet iQ / encadenamiento SSE son funciones de plataforma, así que Cloud-First **no
fuerza** Advanced. Advanced se deduce de: más de 3 BIOs / VRFs avanzadas, topología fuera
de hub-and-spoke, o AIOps/retención ampliada. Equivalencia E-STU de HA on-premises **no
confirmada** por HPE → on-prem HA cotiza 2× estándar con declaración (pendiente abajo).

**Verificación.** 246/246 pruebas (243 + 3 nuevas: cobertura LICENSES_HA 3×2×3 sin
on-prem a propósito, invariante precio HA == estándar, todo modelo publica flujos o
declara por qué no — EC-V y «Gateway 9240» declarados) y eslint verde. E2E en Chromium:
deducción Foundation/Advanced con sus motivos, filtro de flujos (600k descarta EC-10106 →
EC-M), Boost 30% auto (3 bloques a 751 Mbps, 5 a 1.500), split HA (1× S1B79AAS + 1×
S1B86AAS, ambos $19.620), línea DTD «consultar», toggle TAA 86↔94, categorías HA 9+9,
Central Advanced en Gateway 9004, tier Gold automático en 9240, humo Fortinet 60F sin
cambios, cero errores de consola.

### EC-XL marcado fin de venta con fechas oficiales — Aruba (2026-09-13)

Aprobado por el dueño al cierre de la fase anterior: marcar el EC-XL como fin de venta,
buscando en la web la fecha de anuncio de EoS, la fecha efectiva de EoS y el fin de
soporte.

**Las tres fechas, de la fuente oficial.** La Product Lifecycle Policy de EdgeConnect
publicada por HPE (`arubanetworking.hpe.com/techdocs/sdwan-PDFs/docs/eula/EC_LifecyclePolicy_latest.pdf`)
declara literalmente: anuncio de fin de venta **junio 2025**, fin de venta efectivo
(último pedido) **2026-03-31**, y como regla de la política «End of Support +7 years
after End of Sale» → fin de soporte **2033-03-31** (la renovación de mantenimiento de
hardware cierra antes, 2030-03-31, también literal del documento). Los verificadores de
terceros (router-switch, layer23-switch) dan fechas distintas —EOL 2025-06-30, EoS
2025-09-30, EOSL 2030-09-30— pero la discrepancia quedó documentada en el comentario de
`aruba.js` y **manda el documento oficial del fabricante**. Ambas fechas de venta ya
pasaron respecto a hoy, así que el equipo queda «FIN DE VENTA VENCIDO».

**Cómo se marcó (patrón Cisco, opt-in).** Nuevo mapa `EOL_ANNOUNCED` en
`server/seed/legacyData/aruba.js` con `pid` (S0B67A), `lastOrder`, `endOfSupport` y la
URL de la política; un bucle tras `MODELS` lo adjunta como `m.eolAnnounced`, que fluye
por `specs` hasta la página igual que en Cisco. `sucesor` quedó en `null` a propósito:
declarar EC-10150 como sucesor sería inferirlo — HPE no lo dice en ningún documento
consultado. En `ficha.js`, la rama de fin de venta vencido suma una frase opt-in: «El
parque instalado conserva soporte del fabricante hasta el <fecha>» solo cuando el modelo
trae `endOfSupport` (los Cisco sin ese campo no cambian). En el dimensionador, el
selector de equipo marca «· fin de venta» junto a «· recomendado»/«· cumple», y cuando
ningún candidato cumple el «por qué» nombra los equipos que cumplirían si no estuvieran
fuera de venta, con su fecha de último pedido.

**El matiz que preocupaba en la fase anterior resultó no existir.** Se temía que excluir
al EC-XL dejara los escenarios >5 Gbps sin propuesta, pero el EC-10150 (hasta 12 Gbps,
añadido al catálogo el 2026-09-10) cubre todo lo que el EC-XL cubría: a 6 Gbps recomienda
EC-L, a 8 Gbps recomienda EC-10150, y el EC-XL nunca sale propuesto — solo seleccionable
a mano, declarado como referencia del parque instalado.

**Verificación.** 243/243 pruebas (242 + 1 nueva: las fechas declaradas parsean y
`endOfSupport` es posterior a `lastOrder`) y eslint verde (salvo el aviso preexistente de
siempre). E2E en Chromium: selector con «EC-XL · fin de venta», ficha con chip «FIN DE
VENTA VENCIDO» y ambas fechas, recomendación EC-L a 6 Gbps y EC-10150 a 8, «EQUIPOS QUE
CUMPLEN · 3» sin proponer nunca el EC-XL.

**Señales de terceros que quedan PENDIENTES de fuente oficial** (registradas también en
*Datos por confirmar*): los mismos verificadores de terceros dan fin de venta a **EC-L-H
(JZ878A, EoS 2025-12-31)** y **EC-XS (JM962A, EoS 2026-01-31)** — esta última explicaría
por qué el SKU de EC-XS ya no aparece en el export de lista de precios vigente. Sin
documento oficial de HPE no se marcan: misma regla de doble anclaje de siempre.

### Guardarraíl de integridad de precios y alerta de fin de venta (PLC «ES») — Aruba (2026-09-13)

Aprobado por el dueño al cierre de la fase anterior: implementar las dos mejoras
propuestas, con búsqueda web para ajustar la página como experto.

**Guardarraíl anti-regresión (`test/aruba-integridad-precios.test.js`, 9 pruebas).** El
bug del «SKU sin valor» llegó a producción porque nada cruzaba catálogo, lista de precios
y servicios. Ahora falla el CI si: un modelo con `hwSku` no está en el CSV con precio; un
modelo sin `hwSku` no está declarado a propósito (EC-V + serie 7000/7200, que se pide
remanufacturada); hay SKU duplicados o filas sin precio en el CSV; un
`modelo_dimensionador` no cuelga de modelo ni familia; aparece un estado PLC que la página
no sabe pintar (hoy GA/ES); los SKU de suscripción/Boost/Central del seed no están en el
CSV con el mismo precio; o `CARE_SKU` tiene modelos/niveles inexistentes, términos
incompletos o choques con el CSV.

**Alerta de fin de venta (mejora de consultoría).** La lista ya traía `estado_plc` y se
mostraba como texto plano. Ahora: las filas con PLC «ES» del panel de añadir van con fondo
y chip ámbar «ES · fin de venta», y si cualquier línea del BOM —del motor o añadida a
mano— tiene PLC «ES», salta un aviso ámbar sobre la tabla («HPE ya no lo vende y el
soporte deja de contratarse años antes de que acabe el plazo») y una nota «FIN DE VENTA»
en la exportación Excel/texto. De paso se define el CSS `.bom-desvio` que faltaba en esta
página (el aviso de desvío se pintaba sin estilo, solo Fortinet lo tenía).

**La búsqueda web confirmó el fin de venta del EC-XL** (era «señal sin confirmar» desde
el 2026-09-10): la Product Lifecycle Policy oficial de EdgeConnect
(arubanetworking.hpe.com/techdocs, `EC_LifecyclePolicy_latest.pdf`) declara «EC-XL-H end
of sale announcement June 2025» y «EC-XL-H end of sale (EoS) Mar 31, 2026», y la variante
NAL S3N77A ya vino con PLC «ES» en el export. **La decisión del dueño llegó el mismo día
(2026-09-13): marcarlo** — ver la entrada «EC-XL marcado fin de venta con fechas
oficiales» más arriba. Comentarios actualizados junto a EC-XL en `aruba.js` y en
`fuentes.js`.

**Verificación.** 242/242 pruebas (233 + 9 nuevas) y eslint verdes; E2E en Chromium: fila
S3N77A con chip ámbar, aviso «Fin de venta» sobre el BOM al añadirla, nota en la
exportación, ausencia del aviso sin líneas ES, humo de Fortinet sin efectos. Grep de
privacidad limpio.

### Catálogo SKU sin duplicados ni filas sin valor, Foundational Care con precio y panel 4 bajo el 3 — Aruba (2026-09-13)

Petición del dueño (con captura del panel «Añadir» y el export de lista de precios):
en la lista de materiales se duplicaban números de parte y había SKU sin valor —analizar
de dónde salen—; el soporte «Foundational Care 24x7 / NBD HW» salía «— / consultar» y
debía buscarse su SKU y valor en el txt; y «4 · Equipo y cotización» debía volver a la
columna izquierda, debajo de «3 · Funciones adicionales».

**De dónde salía el SKU sin valor (la respuesta al análisis).** `cargarCatalogoSku()`
mezclaba al CSV de precios las variantes de hardware declaradas en el catálogo de modelos
(`m.skus`) que no estaban en la lista: formaban el grupo «Otras variantes de hardware»,
siempre a «consultar» y duplicando visualmente al modelo base (el S3N71A «variante de
EC-10106» junto al S0E22A). Al cruzarlas con el export completo del distribuidor resultó
que las 29 variantes CON número de parte tienen precio publicado (22 ya estaban en el CSV
y 7 faltaban), y las 14 sin número de parte eran ruido inpedible. Fix: las 7 variantes
que faltaban entran al CSV con su fila literal del txt (S3N78A, S3N69A, S3N71A, S3N72A,
S3N74A, S3N77A —PLC «ES», ojo— y R1B37A; 69→76 SKU), se elimina el merge de `m.skus` y
con él el grupo «Otras variantes»: el panel queda sin duplicados, sin «sin número de
parte» y sin «consultar».

**Foundational Care con SKU y List Price.** El servicio se vende atado a la VARIANTE de
hardware, no al tier de caudal: nueva tabla `CARE_SKU` en `aruba.js` por modelo con las
filas literales del PL «SD-WAN Support» del txt —fcnbd ↔ «FC NBD Exch», fc247 ↔ «FC 4HR
Onsite», correspondencia documentada en el comentario— para los 9 EdgeConnect (51 SKU,
1/3/5 años, verificados uno a uno contra el txt). Lo que la lista no cubre sigue en
«consultar» declarado: FC de software (no hay filas), FC de gateways (va por sub-variante
de pedido que la app no modela) y el 4HR del EC-10150 (solo publica NBD). La estructura
`care` en null dentro de LICENSES se retira: era el callejón sin salida que mostraba
«— / consultar». `catalogProjection` expone `careSkus` y el BOM cotiza el soporte del
modelo elegido (E2E: EC-10106 NBD 1 año = H45D0E $446; 4HR 3 años = H46F4E $1.432).

**Layout.** «4 · Equipo y cotización» vuelve a la columna izquierda bajo «3 · Funciones
adicionales»; la derecha queda para la ficha unificada y la nota metodológica. Avisos de
la página actualizados al nuevo estado de datos (76 SKU + CARE_SKU; ya no se declara FC
entero como sin precio).

**Verificación.** 233/233 pruebas y eslint verdes; E2E en Chromium: panel de añadir sin
grupo «Otras variantes», sin «sin número de parte» ni «consultar», S3N71A con $4.318 y
botón «Añadir», soporte con SKU/precio en el BOM, paneles 1-4 en la columna izquierda en
orden, humo de Fortinet sin efectos. Privacidad: grep sin nombre del distribuidor, PA ni
Net Prices en el repo; el txt sigue en `privado/` gitignored.

### Layout reparado, ficha técnica unificada y lista de materiales centrada — Aruba (2026-09-13)

Petición del dueño: la página se había ido toda a la columna izquierda; unificar «ficha
técnica» con «características del equipo» para que no hubiera información redundante;
quitar el «Resumen de sizing»; y centrar en pantalla los cuadros de la pestaña Lista de
materiales, con uniformidad de diseño en toda la página.

**El roto del layout (causa real).** Al mover paneles en la unificación anterior quedó el
grid de dos columnas desbalanceado: la columna derecha se cerraba tras el veredicto y
«Capacidad publicada», «Resumen de sizing», el detalle del equipo y la nota quedaban
sueltos como hijos directos del grid, con un `</div>` de más descompensando el documento —
el navegador lo recuperaba apilándolo todo a la izquierda. En «Lista de materiales», el
grid de dos columnas envolvía UNA sola columna, así que ambos cuadros quedaban estrechos
(340 px) y arrinconados a la izquierda.

**La reparación estructural.** «Dimensionar» vuelve a un grid sano de dos columnas:
izquierda (340 px) los tres paneles de entrada del dimensionamiento (Plataforma, Tráfico,
Funciones); derecha (fluida) «4 · Equipo y cotización», la ficha unificada y la nota
metodológica. «Lista de materiales» deja el grid y pasa a un contenedor centrado propio
(`.pane-centro`, 960 px, márgenes automáticos simétricos): «Añadir a la lista de
materiales» y «Lista de materiales» van al centro de la pantalla y al mismo ancho.

**La unificación de la ficha (sin redundancia).** Había TRES sitios repitiendo las mismas
cifras: la tarjeta del veredicto (con su sección «Características del equipo»), el panel
«Capacidad publicada» y los paneles de detalle que pintaba `bomBody` («Ficha del equipo»,
«Capacidad por nivel de licencia», «Suscripción», «Soporte HPE»). Ahora vive todo en UNA
tarjeta, la ficha del dimensionador, con siete secciones sin repetición: «Capacidad
publicada» (escalera de rangos en EdgeConnect; tabla de niveles Silver/Gold en la 9200,
con el nivel elegido en negrita), «Características del equipo» (solo lo que la escalera no
dice), «Ficha técnica» (las cifras profundas del datasheet que antes estaban en bomBody:
conexiones, MTBF, consumo, ruido, peso, condiciones ambientales…), «Alimentación
eléctrica», «Suscripción y licencias» (con los estados reales Requerida/Opcional/No
incluida del panel 4 — antes la ficha proponía una suscripción que el detalle declaraba
excluida, inconsistencia cerrada de paso), «Software del portafolio» y «Soporte» (que
también declara «No incluido» cuando aplica). Interfaces y Datasheet aparecen exactamente
una vez. El «Resumen de sizing» se eliminó: no decía nada que no dijeran ya los medidores,
el «por qué» y la sección de licenciamiento. El aviso de desvío de `bomBody` se mudó sobre
la lista de materiales, su sitio natural (con selector único, ficha y lista nunca
divergen; el aviso solo queda para «ningún modelo cumple»). ficha.js ganó la opción
opt-in `sec.html` (bloque libre por sección) — los demás fabricantes no cambian.

**Verificación.** 233/233 pruebas y eslint verdes; E2E en Chromium: grid 340+744 px,
ficha con las siete secciones, «No incluir» reflejado en la ficha al instante (los
selectores de licenciamiento ahora disparan `render()` completo, con el tier manual
protegido por su marca «tocado»), selección manual no candidata con desvío y «Volver al
recomendado», 9240 con tabla de niveles, lista centrada 960 px con márgenes de 240 px,
catálogo de 90 SKU en 10 grupos intacto, humo de Fortinet sin efectos.

### Selección de equipo unificada en «Dimensionar» y líneas excluibles — Aruba (2026-09-13)

Petición del dueño: unificar la sección de equipo en la pestaña Dimensionar, dejando en la
pestaña de BOM solo «Añadir a la lista de materiales» y «Lista de materiales»; sin campos
duplicados; todo sincronizado con el dimensionador; opción «No incluir» en los selects; y
analizar si hacía falta un botón de sincronizar. Aruba es el piloto — los demás
fabricantes NO se tocan hasta nueva orden (en ficha.js solo se añadieron opciones opt-in
que no cambian su comportamiento).

**La unificación.** La pestaña BOM tenía el panel «Selección de equipo» (modelo, cantidad,
término, suscripción, tier, Boost, Central, capacidad 9240 y soporte) y la ficha técnica;
la pestaña Dimensionar tenía el selector de candidatos de la ficha. Dos selectores de
modelo en la misma página era la duplicación a cerrar. Ahora hay UN SOLO selector
(`pickModel`, todos los modelos por serie con marcas «· cumple» y «· recomendado») en el
panel nuevo «4 · Equipo y cotización» de Dimensionar; la ficha ya no pinta el suyo
(`selector:false`, opción nueva de ficha.js) y muestra el elegido aunque no sea candidato
(`incluir`, otra opción) con el aviso de desvío y «Volver al recomendado». La ficha
técnica (`bomBody`) también vive en Dimensionar. La pestaña de BOM se renombra «Lista de
materiales» y contiene solo el catálogo de SKU y la lista, con el aviso de preventa.

**Sincronización (respuesta al botón pedido: NO hace falta).** La página ya es reactiva de
extremo a extremo: cada cambio de parámetro recalcula y el selector sigue al recomendado;
cambiarlo a mano mueve ficha, resumen, escalera y BOM; «Volver al recomendado» suelta la
elección manual. Un botón de sincronizar duplicaría lo que ya ocurre solo. El enlace
compartible lleva el modelo (`pickModel` sustituye a `verdict-sel` en ESTADO) y reponerlo
desde la URL queda como elección manual, igual que hacía la ficha — con la captura del
parámetro al cargar el script, porque ESTADO reescribe el querystring antes de que el
desplegable tenga opciones.

**«No incluir».** Suscripción EdgeConnect, Central y soporte admiten quedar vacíos: la
línea desaparece de la lista y su panel declara el estado («Sin suscripción el equipo
queda standalone…», «Sin soporte no hay repuestos ni TAC…»). El tier de caudal no tiene
«No incluir» porque la suscripción no tiene SKU sin tier: excluir la suscripción oculta
tier y Boost — Boost es un add-on de la suscripción, criterio de licenciamiento HPE. La
licencia perpetua 9240 ya tenía «Solo hardware».

Verificado E2E en Chromium: un solo selector, sigue al dimensionador (500→EC-10106,
900→EC-10108), manual candidato y no candidato con aviso, volver resincroniza, las tres
exclusiones y su reactivación, URL con modelo, catálogo SKU intacto (90 referencias),
Fortinet/Cisco sin regresión. 233/233 pruebas y eslint en verde.

### Referencias de pedido integradas en la lista de materiales de Aruba (2026-09-13)

Petición del dueño: las referencias de pedido y la lista de materiales duplicaban valores y
eran redundantes — había que integrarlas rediseñando el dimensionador de Aruba para que
TODOS los SKU del archivo de precios se puedan añadir y quitar (hardware, software,
servicios) de forma dinámica e interactiva.

**La duplicación eliminada.** El mismo SKU llegaba a verse en cuatro sitios: la ficha del
equipo (filas «SKU de hardware» y «Referencias pedibles»), los paneles de suscripción y
soporte (SKU y precio en línea), la tabla de referencias de la ficha de cálculo y la propia
lista de materiales. Ahora la lista de materiales es la ÚNICA fuente de referencias de
pedido de la página: la ficha queda solo técnica (capacidad, interfaces, specs de
datasheet), los paneles explican QUÉ se licencia sin repetir SKU ni precio, y la ficha de
cálculo muestra una nota que apunta a la pestaña «Equipo y BOM» (opción genérica
`refs:false`/`refsNota` nueva en `ficha.js`, disponible para los demás fabricantes).

**El panel «Añadir a la lista de materiales».** Carga el CSV público de lista de precios
(`public/datasheets/aruba-lista-precios-hpe.csv`, 69 SKU) y lo categoriza con las propias
columnas del archivo —hardware, remanufacturados (sufijo AR), suscripciones EdgeConnect
Foundation/Advanced/On-Premises, Boost SaaS/On-Premises, Central y licencias perpetuas
9240— más las variantes de hardware sin precio (TAA/NAL/FIPS) que el catálogo declara por
modelo: 90 referencias en 10 grupos. Buscador por SKU o descripción, chips de categoría con
conteo, List Price con su vigencia y estado PLC, y marca «En el BOM» en las líneas que el
motor ya puso en la lista para no meterlas dos veces.

**La lista de materiales queda como el componente integrado.** Añadir mete la línea con
`BOM.agregarRef` (persistente en localStorage, sobrevive a recargas y a cambios de modelo),
con stepper de cantidad y botón de quitar que ya existían en `bom.js`. Y dos huecos
cerrados en `bom.js` para los SIETE dimensionadores: `exportarExcel` y `comoTexto` ahora
incluyen las referencias añadidas a mano — antes solo se veían en pantalla y se perdían al
exportar. Verificado de extremo a extremo en Chromium: añadir Boost S0Z73AAS → subtotal y
total actualizados ($47.608 con cantidad 2), quitar, persistencia tras recarga, chips,
buscador, texto plano con el SKU, y humo en Fortinet/Cisco sin regresiones. 233/233
pruebas y eslint en verde.

### Combos por familia, ficha técnica completa de Aruba y guarda de ancho de banda (2026-09-13)

Tres peticiones del dueño en una sola entrega:

1. **Combos de equipos organizados por serie/familia en los seis dimensionadores.** Los
   combos de Fortinet, MikroTik y Juniper eran listas planas en el orden (alfabético) en
   que la API servía el catálogo; Aruba, Cisco y Huawei ya agrupaban pero heredaban ese
   mismo orden. Ahora los seis usan `<optgroup>` por familia —Fortinet deriva la familia
   del propio id (G sucursal / G DC / F sucursal / F gama alta / F chasis)— con orden
   determinista por capacidad dentro de cada familia y entre familias, sin depender del
   orden en que llegue el catálogo. Lo virtual (CHR de MikroTik, EC-V de Aruba) va al
   final de su grupo.
2. **Ficha técnica completa de Aruba.** Nuevo campo `spec` por modelo (24 de 25; EC-V es
   virtual) con las características de los datasheets oficiales que la ficha no mostraba:
   conexiones simultáneas, Boost recomendado, IDS/IPS, throughput cifrado por cifrado,
   VLANs, túneles, SSL, clustering, RAM, almacenamiento, FRU, certificaciones, MTBF,
   alimentación/consumo, BTU, ruido, dimensiones y peso. Procedencia literal en la
   cabecera de `aruba.js`: QuickSpecs EdgeConnect a50004289enw + Hardware Reference,
   DS_9000/9100/9200 y DS_7000/7200 (estas dos con doble ancla de dos copias del mismo
   documento). También se rellenaron `fwSess`/`ipsecSess`/`greTuns` que estaban en null
   (series 9000, 7000 y 7200). Los conflictos detectados contra datos existentes NO se
   aplicaron: quedan en la tabla de conflictos de este archivo.
3. **Sin ancho de banda no hay recomendación.** Los seis dimensionadores (Aruba, Cisco,
   Fortinet, Huawei, Juniper, MikroTik) muestran «Ingrese valores para recomendar un
   equipo» y limpian veredicto, escala, resumen y BOM cuando el campo de ancho de banda
   está vacío; al escribir un valor vuelve la recomendación normal. Nokia ya pedía
   valores por sí solo.

Verificado: `npm run verificar` (233/233) y E2E en Chromium — combos agrupados y ordenados
en los seis, mensaje de vacío y recomendación al ingresar caudal, y las nuevas filas de
la ficha (EC-10104, Gateway 9240, 7010) pintadas desde el `spec`.

### Aruba: catálogo de suscripciones y servicios con SKU y List Price (2026-09-13)

El pendiente 10 («Precios de Aruba: todos en `null`») se cierra casi entero. El export de
lista de precios del distribuidor (el mismo del 2026-09-10, re-subido por el dueño) cubre
mucho más que hardware: se extrajo el List Price de **todas** las líneas que el
dimensionador consume, y la correspondencia SKU↔descripción se verificó contra el QuickSpecs
oficial EdgeConnect SD-WAN (v18, 06-jul-2026) publicado en hpe.com, con punto de control
externo en una tienda pública (JZ118AAE, LIST $1,260.00 — idéntico al de la lista).

Lo que se cargó (solo SKU, descripción, List Price y vigencia — nunca el distribuidor ni su
descuento, que es su dato confidencial):

- **LICENSES** (`aruba.js`): los 9 combos tier×bundle (Foundation/Advanced/On-Premises ×
  100 Mbps/1 Gbps/ilimitado) con un SKU distinto por duración — el `sku` ahora va desglosado
  `{y1,y3,y5}` igual que el precio, y el motor (`tierSku`) elige el del término elegido.
- **BOOST**: bloque de 100 Mbps y de 10 Gbps, en modalidad SaaS (sobre Foundation/Advanced)
  y On-Premises (E-STU). El BOM ya muestra SKU y precio por bloque con su cantidad.
- **CENTRAL_TIERS**: Foundation (JZ118-120AAE) y Advanced (JZ121-123AAE) de gateway
  70xx/90xx. Las variantes (72xx, Foundation Base 9004/9012, +Security, vGW) quedan
  documentadas en comentario con sus precios, sin cargar, porque el dimensionador no las
  elige todavía.
- **9240**: licencias perpetuas Silver (R8R41AAE, $9,995) y Gold (R8R42AAE, $19,995) en
  variante AOS-10 — la arquitectura que gestiona Central, que es la que usa este catálogo.
- **Serie 7000/7200**: la unidad nueva no está en la lista; la **remanufacturada HPE**
  (sufijo AR) sí — 7005/7008/7010/7030/7205/7210/7220 con SKU y List Price, declarados
  «(Reman)» en el cotizador y en `referencias.js`. 7024 y 7240XM no tienen ni una ni otra:
  siguen en «Consultar».

Lo que **sigue en `null` a propósito**: Foundational Care (sus SKU — H43W0E, H44Z4E… — van
por variante de hardware y se resuelven en HPE SSC equipo a equipo; mapearlos a un tier de
caudal sería inventar la estructura), EC-V, EC-XS-SP y Dynamic Threat Defense (ausentes de
la lista). El CSV público (`aruba-lista-precios-hpe.csv`) pasa de 15 a 69 filas. Verificado
con `npm run verificar` (233/233) y E2E en Chromium: EC-S con Advanced 1G/3a + 2 bloques
Boost ($72,411 parcial), 9012 con Central Foundation 5a (JZ120AAE) y 9240 Gold + Central
Advanced 3a ($61,389 parcial).

### Dimensionadores: los campos arrancan vacíos en cada sesión (2026-09-12)

A petición del dueño del repo: los valores de ejemplo que traían precargados los ocho
dimensionadores (bw 500, usuarios 100, sucursales 20/50...) desaparecieron — cada inicio de
sesión encuentra los campos **vacíos** para que el usuario ingrese sus propias cifras. Tres
capas: (1) los `<input type="number">` del HTML ya no llevan atributo `value` (los
deslizadores sí conservan su posición: un slider no puede estar «vacío»); (2)
`autocomplete="off"` en todos ellos, porque lo que «guardaba los valores» ya no era la
aplicación —el localStorage se quitó el 2026-09-10— sino el navegador, que repone lo último
tecleado al recargar o al volver con atrás; (3) red de seguridad en `estado.js`: si la URL no
trae parámetros, vacía los campos tecleables al cargar y en el `pageshow` del bfcache. Los
motores ya toleraban el vacío (`parseFloat(...)||0` → el escenario sin cifras no produce
candidatos). Lo que **no** cambió: un enlace compartido (`?bw=2500&users=800`) sigue
restaurando el escenario completo — es la función para la que existe el módulo. Verificado de
extremo a extremo en Chromium tras login: las 8 páginas entran en blanco, teclear 2.500 Mbps
sigue recomendando el FortiGate 200G y el enlace compartido sigue restaurando. 233/233 tests.

### Nokia: las 6 capacidades en conflicto, corregidas contra la ficha oficial (2026-09-11)

Por decisión del dueño del catálogo. Los **7220 IXR-D2L/D3L** eran un error real: el catálogo
prometía el doble (4 y 6,4 Tb/s) de lo que la ficha oficial (`nokia.com/asset/f/207599`) y la
suma de puertos del propio catálogo confirman (2,0 y 3,2 Tb/s FD). Los **7750 SR-s** eran una
elección de métrica: se adoptó «System capacity (FD; max)» —SR-1s 4,8; SR-2s 9,6; SR-7s 108;
SR-14s 216 Tb/s— porque el dimensionador de agregación/core ordena por `cap` y la «Interface
capacity» es agregación estadística sobresuscrita. La decisión quedó documentada en la
cabecera de `nokia.js`, y se actualizaron portal, cotizador, guía de roles y el test de
agregación (el techo del catálogo ya no es 38,4 sino 216 Tb/s).

### Juniper: 4 conflictos resueltos, 3 modelos completados y Juniper Care verificado (2026-09-11)

Los 4 «conflictos» eran cifras de una revisión vieja de las fichas: Juniper re-evaluó al alza
con Junos más reciente. Cada valor nuevo confirmado por **dos fuentes oficiales** (ficha
vigente en juniper.net + Pathfinder HCT): SRX1600 `vpnImix` 5.500→8.000 y `cps` 95.000→170.000,
SRX2300 `cps` 320.000→450.000, SRX4300 `fw` 90.000→98.000. Completados los huecos de
**SRX4700** (con la regla de la casa: `ips` transcribe el método CPS, 60 Gbps, no el TPS de
100 que titula la ficha; `atp` en `null` porque Juniper no publica Advanced Threat para ese
modelo), **SRX4100** y **SRX4200** (donde Pathfinder dice 18 Gbps de NGFW y la ficha fechada
16: se transcribió la ficha y la discrepancia quedó anotada). **Juniper Care** deja de ser un
nivel «sin verificar»: los tres niveles (Care, Advanced Care, Premium Care) transcritos de
juniper.net con alcance y tiempos de respuesta.

### Fortinet: alimentación 58/58 — 70F, 100F y 200F cerrados (2026-09-11)

El **70F** se cerró con la ficha combinada auténtica 70F/71F (`FG-70F-DAT-R02-20221028`:
10,17 W medio / 12,43 W máx, adaptador externo 12VDC 3A único), validando primero la identidad
del documento: su columna 71F coincide cifra a cifra con la ficha oficial del 71F — la trampa
del `fortigate-70f-series.pdf` (que es solo del 71F) sigue documentada. El **200F**
(`FG-200F-DAT-R28-20250407`: 101,92/118,90 W, doble fuente AC de serie no intercambiable en
caliente, 1+1) y el consumo del **100F** (`FG-100F-DAT-R42-20250407`: 26,5/29,5 W — Fortinet
lo re-evaluó a la baja desde los 35,1/38,7 W de la revisión de 2021) salieron de espejos del
PDF oficial, verificando el código de revisión impreso en el documento, porque fortinet.com
responde con reto JavaScript de Akamai en esas rutas. Sin `watts` quedan solo 7081F y 7121F,
cuyas guías solo publican capacidad por fuente: decisión ya documentada.

### Aruba: los 6 PDFs que faltaban, descargados — pendiente 3 cerrado (2026-09-11)

En sesión nueva (la cuota de `psnow/downloadDoc` se había reseteado) y con Chrome real
bajaron los 6 que quedaban: QuickSpecs de EdgeConnect (47 págs), spec sheet EC-XL, data sheet
Serie 9000, QuickSpecs 9100 y 9200, y el SD-Branch Design VSG (132 págs, 17,6 MB). Tres
métodos, todos documentados en `public/datasheets/LEEME.md` para la próxima refrescada:
enlace `downloadDoc` en la página, el visor de Chromium con `fetch(location.href)`, y la
carcasa del visor Adobe de los QuickSpecs (se escucha la respuesta `application/pdf` a
`downloadDoc` y se repite con `fetch` desde la página). Cobertura final: **18/24**; de los 6
restantes, 4 nunca fueron PDFs, 1 URL murió (`ecSpecSheet`) y 1 exige cuenta HPE (`gw9000Spec`).

### Aruba: List Price real para 15 modelos EdgeConnect/gateway (2026-09-10)

A petición del dueño del repo, que dejó en `public/Precios Aruba.txt` (82.546 líneas, 16,6 MB)
un export de lista de precios de HPE con la instrucción de sumarlo como fuente y sacar lo más
importante para dimensionar equipos.

**El archivo NO era una fuente pública genérica: era una lista de precios de un distribuidor
autorizado** (nombre del partner y PA number visibles, con su % de descuento negociado), y
mezclaba TODO el portafolio de HPE (servers, storage, Synergy...) con Aruba como una porción.
Consultado el alcance con el dueño del repo antes de tocar nada: se descartó commitear el
archivo completo y se optó por extraer solo lo útil — SKU, descripción, List Price y su
vigencia — sin el nombre del distribuidor ni su descuento, que es la parte confidencial y no
aporta nada para dimensionar un equipo. El archivo original se movió fuera de `public/` (que
Express sirve, aunque detrás del muro de sesión) a `privado/`, agregado a `.gitignore`.

**Lo extraído:** `public/datasheets/aruba-lista-precios-hpe.csv`, 15 filas (los EdgeConnect y
gateways con SKU confirmado en el catálogo: EC-XS, EC-S/M/L/XL, EC-10104/106/108/150, Gateway
9004/9004-LTE/9012/9106/9114/9240). Se agregó como entrada `DATASHEETS.priceList` en aruba.js
(sin `url` pública, con `local` — la página no muestra el enlace "en hpe.com" para esta,
porque no existe uno legítimo que ofrecer). El SKU de EC-XS (JM962A) también se completó en
`aruba.js`: el QuickSpecs no lo publica, este export sí.

**Se conectó el precio real donde antes decía "Consultar":** `cotizadorCatalog.js` (15 filas,
antes `elp:'Consultar',elpN:0`), la ficha de "Referencias de pedido" (`referencias.js`, nueva
tabla `ARUBA_LIST_PRICE`), el BOM del dimensionador (ya leía `priceNumeric` del Product, solo
faltaba que existiera) y los tres avisos de "sin price list" del HTML, corregidos para decir
lo que hoy es cierto: 15 modelos tienen List Price de HPE (sin el descuento del distribuidor,
no una cotización firme); el resto del catálogo sigue sin precio.

**Un bug real, encontrado al verificar y no al buscarlo.** Con el precio en cero, un defecto
de `backfillPricesFromCotizador` (server/seed/seedCatalog.js) era invisible: los 4 modelos
EdgeConnect 10104/106/108/150 (sumados a `aruba.js` en la sesión anterior sin sumarlos también
a `indexPR.js`) no tenían fila de PR previa que igualar por nombre, así que su rama de "sin
match" les creaba una fila fantasma con el nombre completo de `cotizadorCatalog.js` ("Aruba
EC-10104") en vez de encontrar la fila real ("EC-10104") que `seedDimensionadorModels` crea
después — dos filas por modelo, y cuál de las dos terminaba con el precio dependía del orden
de `Product.findAll()`, no del código. Con precio real de por medio dejó de ser invisible: los
4 modelos seguían mostrando "Consultar" pese a tener fila en el CSV. Corregido sumando los 4 a
`indexPR.js` (mismo patrón que los otros 11 modelos Aruba) y con una limpieza de una vez de las
4 filas fantasma ya sembradas. **Intento de arreglo descartado a tiempo:** la primera solución
probada — pelar el prefijo de fabricante también en la rama de creación de
`backfillPricesFromCotizador` — parecía correcta pero rompía a Fortinet y a la familia Catalyst
8000 de Cisco, que SÍ llevan el prefijo como parte de su `id` real (a diferencia de
Aruba/Huawei/MikroTik/Nokia/Juniper, que no); se detectó comparando el conteo de `Product` de
un arranque limpio contra un worktree del commit anterior antes de darlo por bueno (232 → 261
en vez de la baja esperada), y se revirtió por la vía correcta: sumar la fila de PR que
faltaba, no tocar una función compartida por los 7 fabricantes.

**Señal sin confirmar, dejada así a propósito:** en el mismo export, el SKU de EC-XL (S0B67A)
aparece con estado PLC "End of Sale" (vigencia 2026-06-30) en su fila sin sufijo de país, pero
"GA" en las ~20 variantes por país del mismo SKU. Un solo documento, contradictorio consigo
mismo, no alcanza para marcar EC-XL como descontinuado — comentario junto al modelo en
`aruba.js` y fila en "Conflictos abiertos" más abajo.

Verificado: 233 pruebas (232 + 1 nueva sobre `referencias.js`), Chromium autenticado (BOM con
el subtotal real de EC-10106, ficha con "Precio de lista: ~ $4.318", pestaña Fuentes con el
CSV sirviendo detrás del login, catálogo/cotizador con los 15 precios), sin errores de
consola. `npm run pantallas` no corrió (falta `playwright` instalado en este entorno).

**Mejora propuesta al cerrar esta entrega:** este mismo bug (una fila de PR faltante creando
una fila fantasma en `backfillPricesFromCotizador`) puede repetirse en cualquier fabricante
cada vez que se agregue un modelo nuevo directo a su `legacyData` sin sumarlo también a
`indexPR.js` — pasó una vez en silencio (con precio en 0 no se notaba) y podría volver a pasar.
Un aviso de arranque tipo el que ya existe para `eolModels` huérfanos (`seedDimensionadorModels`
avisa si una entrada no casa con nada) que compare los `model` de `cotizadorCatalog.js` contra
los `Product` ya sembrados y señale cuáles cayeron en la rama de creación, cerraría esto de raíz
en vez de depender de que alguien lo note contando filas a mano.

### Los dimensionadores dejan de recordar la sesión anterior (2026-09-10)

A petición del dueño del repo («cada vez que se inicie sesión limpia todos los campos de
los dimensionadores que estén vacíos y no guarde valores como ahora»). `js/estado.js`
guardaba cada campo en `localStorage` y lo reponía en la siguiente visita — pensado para no
perder un dimensionamiento a medio hacer, documentado así en el propio módulo — pero eso
significaba que cada inicio de sesión arrancaba con los valores de la vez anterior en vez de
en blanco. Consultado el alcance con el dueño del repo (¿limpiar solo al hacer login, o
sacar el guardado por completo?): eligió lo segundo.

**Se quitó la lectura y la escritura en `localStorage` de `js/estado.js`.** Lo único que se
conserva es reponer desde la URL — el enlace compartido («mírate este sizing») sigue
reproduciendo el mismo escenario a quien lo abre, que es el caso de uso real de compartir un
dimensionamiento con un compañero. El botón "Copiar enlace de este escenario" no cambió. El
aviso "se restauraron los parámetros de tu última visita" deja de aparecer (el de "estás
viendo un escenario recibido por enlace" sigue igual). Las 7 páginas dejaron de pasar
`clave: '<nombre>'` a `ESTADO.vincular()` porque esa clave solo existía para nombrar la
entrada de `localStorage` que ya no se escribe.

**Lo que NO se tocó, a propósito, por estar fuera de lo pedido:** el BOM del cotizador
(`js/cotizador.js`) y las referencias de pedido (`js/bom.js`) también usan `localStorage`,
pero guardan listas de equipos y referencias añadidas —perderlas al iniciar sesión sería una
regresión real, no una limpieza—, y el pedido fue específicamente sobre "los campos de los
dimensionadores", no sobre el BOM ni el cotizador.

Verificado en Chromium autenticado: se cambia el caudal de un dimensionador (queda en la
URL), se recarga sin parámetros y el campo vuelve al valor por defecto, sin el aviso de
sesión anterior. Sin errores de consola. 232 pruebas sin cambios (no hay pruebas de este
módulo de frontend).

### Aruba: la pestaña de Fuentes ya no está duplicada (2026-09-10)

A petición del dueño del repo («unifica en aruba la opción de fuentes, está duplicado»).
Al replicar el patrón de Fortinet a Aruba (entrada anterior de este mismo día), se había
dejado una división a medias: la pestaña «Licencias, software y fuentes» seguía con su
propio listado de datasheets, y la pestaña nueva «Fuentes» solo mostraba la procedencia
verificada y remitía a la otra pestaña para el detalle por producto — dos lugares para lo
mismo, y el propio dueño lo notó de inmediato al usar la página.

**Ahora todo lo de fuentes vive en un solo lugar.** La pestaña se renombra a «Licencias y
software» (ya sin mención a fuentes) y pierde la sección de datasheets; esa sección se
mueve a la pestaña «Fuentes», justo debajo de «Procedencia verificada». Se quitó la frase
que remitía de una pestaña a la otra (ya no hace falta) y se corrigió la nota de cierre de
la página, que citaba la pestaña de licencias como destino de los enlaces. Cambio solo de
`public/dimensionador-aruba-edgeconnect.html`; el JS no se tocó — pinta el listado por id
(`dsList`), sin importar en qué pestaña viva el `<ul>`.

Verificado en Chromium autenticado: «Fuentes» muestra procedencia y datasheets juntos;
«Licencias y software» termina en la tabla de soporte, sin el listado. Sin errores de
consola. 232 pruebas sin cambios (edición solo de HTML).

**Mejora propuesta al cerrar esta entrega:** la entrada de arriba («El piloto de Fortinet
se replica...») ya documentaba esta división como decisión deliberada («Aruba solo sumó
"Catálogo" y una "Fuentes" liviana que remite a esa pestaña») — es decir, el propio informe
de cierre describió como intencional lo que el dueño del repo vio como un defecto de UX en
cuanto abrió la página. La revisión de cada entrega debería incluir, además de Chromium y
las pruebas automáticas, una relectura rápida desde la perspectiva de quien usa la página
por primera vez — no solo confirmar que el código hace lo que el texto dice, sino que lo
que el texto llama "resuelto" de verdad se siente resuelto.

### Chrome real destraba 9 PDFs más de Aruba; Huawei sigue bloqueado, pero por otra razón (2026-09-10)

A petición del dueño del repo, siguiendo la mejora propuesta al cerrar la entrega anterior:
reintentar los pendientes 3 (PDFs de Aruba) y 14 (ciclo de vida Huawei) ahora que Agent Reach
estaba instalado. El resultado fue desigual entre los dos, y vale la pena registrar el porqué
para no repetir el mismo camino sin salida.

**Aruba: 9 documentos nuevos, de 3/24 a 12/24.** Jina Reader (usado en la entrega anterior)
solo entrega texto, nunca el binario del PDF — no servía para este pendiente. Lo que sí
funcionó fue **Chrome real vía la extensión**, en vez del Playwright/Actions que Akamai
bloqueaba: `hpe.com` y `arubanetworking.hpe.com` cargan completos y sin captcha. Se descargaron
y commitearon `edgeconnect-xs-spec-sheet.pdf`, `gateway-9004.pdf`, `serie-9000-psnow.pdf`,
`serie-9200-campus-gateways.pdf`, `serie-9200-psnow.pdf`, `central-suscripciones-saas.pdf`,
`foundational-care.pdf`, `clearpass-access-license.pdf` y `edgeconnect-ecv-azure.pdf` (128
páginas). Quedan 12 sin resolver, en tres categorías distintas — ver la fila actualizada del
pendiente 3.

**Segundo intento, mismo día: causa confirmada, no es la automatización.** Con
`read_network_requests` se vio que el clic sí llega al enlace real (`psnow/downloadDoc`) pero
el servidor de HPE responde **503**. Tras 2 minutos de espera, el mismo 503 apareció incluso en
`a00110177enw` (EC-XS) — el documento que **ya se había descargado con éxito** minutos antes en
esta misma sesión. Es un límite de sesión/IP del propio servicio de descarga de HPE, agotado por
las 9 descargas ya hechas, no un límite de tamaño ni de tipo de documento ni un detalle del
botón — la hipótesis original quedó descartada. Insistir en la misma sesión solo golpea un
servicio que ya está limitando; hace falta una sesión distinta (al día siguiente, por ejemplo).

**Huawei: el bloqueo de Akamai no es el obstáculo real.** Con Chrome real,
`support.huawei.com/enterprise/en/bulletins/` — "Life Cycle Notices" — carga completo, con
buscador por modelo y resultados reales (`AR6700` dio 11 avisos con fecha). Pero dos hallazgos
cierran el camino de todos modos, y son motivos nuevos y más precisos que "Akamai bloquea todo":

1. **El contenido de cada aviso está tras una cuenta Huawei** (candado visible en cada fila).
   No se intentó iniciar sesión ni crear una cuenta — sigue siendo la barrera real.
2. **Puede que ni sea la categoría correcta.** Lo que se ve ahí son ciclos de vida de
   **versiones de software** (`V600R023C00`, `V200R024C10`…), no del hardware — un dato
   distinto de lo que este catálogo modela (`eolAnnounced`: fin de venta del equipo físico,
   con última fecha de pedido y sucesor, al estilo de la serie ISR 4000 de Cisco). La categoría
   "PCN" (Product Change Notice) sí es a nivel de hardware, pero no lista routers/NetEngine
   entre sus categorías visibles ahora mismo.

Ninguna cifra de Huawei se agregó al catálogo: no hay dato verificado que trasladar todavía, y
este catálogo no adivina desde un título de aviso. 232 pruebas sin cambios — todo lo aplicado es
un asset binario nuevo, sin tocar código.

**Mejora propuesta al cerrar esta entrega:** de los 12 documentos Aruba que faltan, 7
comparten el mismo síntoma (botón de descarga inerte en fichas largas) y uno más exige cuenta
HPE — vale la pena que alguien con paciencia reintente esos 7 a mano una vez (confirmar si es
realmente un límite de tamaño/tipo o solo falta de reintentos) antes de darlos por imposibles;
los otros 5 (una URL muerta y cuatro páginas que nunca fueron PDF) no necesitan reintento, solo
que alguien busque el reemplazo de la URL muerta si le importa esa ficha en particular.

### Catálogo Aruba ampliado: 4 EdgeConnect nuevos y SKUs reales completados (2026-09-10)

A petición del dueño del repo: buscar más equipos Aruba en fuentes oficiales para alimentar
el dimensionador. El bloqueo de egreso a HPE que este repositorio lleva documentado desde
agosto (Akamai contra automatización) resultó ser **contra ciertos clientes HTTP, no contra
toda automatización**: `curl` directo sigue bloqueado, pero **Jina Reader** (`r.jina.ai`,
recién instalado como parte de Agent Reach) sí atraviesa, y **Exa** (búsqueda semántica, misma
instalación) encontró los documentos oficiales exactos a buscar. Es el primer cierre real de
ese bloqueo desde que se abrió.

**Cuatro modelos EdgeConnect que no existían en el catálogo**, todos del QuickSpecs oficial
vigente de HPE (`a50004289enw`, versión 18, 06-jul-2026 — el propio documento con su changelog
de 18 versiones, así que es la fuente activa, no una copia vieja): **EC-10104** (2-500 Mbps),
**EC-10106** (2-1 Gbps), **EC-10108** (2-2 Gbps) y **EC-10150** (hasta 12 Gbps, el tope de la
línea EdgeConnect — sin mínimo publicado, a diferencia del resto de la serie). Los tres
primeros llenan justo el hueco entre EC-XS y EC-S que antes no tenía escalones intermedios.
SKU reales de la misma ficha (R9D72A, S0E22A, S0E23A, S2N65A, más sus variantes TAA/NAL).

**El motor de dimensionamiento no necesitó ningún cambio de lógica** para aceptarlos — ya
generalizaba por `fam`/`wanMin`/`wanMax`, y el único ajuste fue de texto: el mensaje que
mostraba «según licencia y vCPU» cuando `wanMin` es `null` asumía que esa era siempre la razón
(cierta para EC-V, un appliance virtual) y ahora dice «sin mínimo publicado», que es lo que de
verdad pasa con el EC-10150 — HPE no publica un piso para ese modelo y no hay por qué inventar
una razón que no aplica.

**De paso, tres huecos cerrados con la misma fuente ya citada en esas filas**, sin necesidad de
un documento nuevo: `hwSku` de Gateway 9004 (R1B20A) y 9004-LTE (R3V91A) estaban en `null`
pudiendo no estarlo, y Gateway 9106/9114 no tenían `fw`/`fwSess`/`ipsecSess` — con esos tres
campos vacíos, la serie 9100 Hybrid era invisible para cualquier requerimiento dimensionado por
throughput de firewall. Los tres coinciden exactamente con los datos ya verificados del
catálogo (clientes, APs) donde se pudo contrastar, lo que da confianza en el resto de la ficha.
Se corrigió además una nota de cabecera de `aruba.js` que decía «se retiran 9106/9114, no
aparecen en el portafolio publicado» — la nota estaba desactualizada, no el catálogo: las filas
de esos dos modelos siempre estuvieron ahí.

**Un conflicto se encontró y se dejó sin resolver a propósito**: el mismo QuickSpecs dice que
EC-XS llega a 1.000 Mbps, el doble del `wanMax:200` que ya tenía el catálogo. Un solo documento
no supera el doble anclaje que esta tabla exige antes de pisar un dato existente — mismo criterio
que el SRX380 de Juniper — así que queda anotado en *Conflictos abiertos* para que lo decida
el dueño del catálogo, no tocado en este cambio.

Los 4 modelos nuevos se sumaron también a `cotizadorCatalog.js` (si no, «Enviar al cotizador»
desde el dimensionador habría fallado con «modelo no encontrado en el catálogo del cotizador»,
el mismo síntoma que ya documenta ese botón para un equipo fuera de venta). 232 pruebas (una
ampliada, no una nueva: el conteo de modelos Aruba con `redund` documentado subió de 6 a 10).
Verificado en Chromium de extremo a extremo: EC-10106 recomendado en vivo para 715 Mbps, las
cuatro filas nuevas en la pestaña Catálogo con su SKU, la ficha de EC-10150 mostrando «sin
mínimo publicado» y su redundancia real, y «Enviar al cotizador» llevándolo correctamente al
cotizador multi-fabricante. Sin errores de consola.

**Mejora propuesta al cerrar esta entrega:** ahora que Jina Reader/Exa demostraron que
atraviesan el bloqueo de HPE, los pendientes 3 (23 datasheets PDF de Aruba sin descargar) y 14
(ciclo de vida de Huawei, bloqueado por Akamai contra Huawei específicamente, no HPE) merecen
un reintento con la misma herramienta antes de seguir dándolos por bloqueados sin remedio desde
este entorno — el costo es bajo (ya está instalada) y el pendiente 3 lleva desde agosto sin
avanzar por creerlo imposible desde aquí.

### El piloto de Fortinet se replica a los otros seis fabricantes (2026-09-10)

A petición del dueño del repo, decidiendo el punto que el piloto había dejado abierto
(«decidir después si se replica a los otros seis»). Huawei, Cisco, Nokia, Juniper, MikroTik y
Aruba pasan a navegar directo a su dimensionador igual que Fortinet, que suma dos pestañas
propias («Catálogo», «Fuentes») con la tabla de modelos y la procedencia verificada. Las seis
secciones que esas pestañas tenían en el portal se retiraron.

**Decisión de diseño resuelta con el dueño del repo: Nokia tiene dos dimensionadores, no
uno.** El botón «Nokia» navega al **7750 SR** (14 de los 18 modelos, el caso de un solo equipo
elegido); el fabric 7220 IXR sigue accesible por el paso «extra» de la barra de fabricante, que
`navegacion.js` ya traía preparado para esto desde el propio piloto.

**Un bug ya en producción, encontrado al explorar el código para replicar el patrón, y
corregido en el mismo cambio.** Las pastillas «Catálogo»/«Fuentes» de la barra de fabricante
(`navegacion.js`) seguían redirigiendo a `/index.html?fab=<id>&paso=cat`, una URL que ya no
hacía nada desde que la sección de Fortinet se quitó del portal — ese clic dejaba a quien lo
usara varado en el dashboard, en silencio. Replicar el patrón a seis fabricantes más sin
arreglarlo habría repetido el mismo bug seis veces. Ahora, si el destino es la página en la que
ya se está, cambia de pestaña en el sitio (dispara un click real sobre el botón de esa pestaña,
reutilizando el listener que la página ya tiene); si es otro fabricante, navega pidiendo esa
pestaña por la URL (`?tab=cat`), y la página la abre sola al montar la barra.

**La mejora que el propio piloto dejó anotada, resuelta — y mejor de lo propuesto.** El mapa
fabricante → dimensionador vivía duplicado en `public/js/index.js` y en
`scripts/verificar-pantallas.js`. La propuesta original era un JSON compartido nuevo; resultó
innecesaria porque `navegacion.js` ya mantenía ese mismo mapa completo (`FABRICANTES`, con los
siete) para su propia barra. Ambos sitios pasan a leerlo de ahí —`window.NAVFAB.FABRICANTES`,
cargando `navegacion.js` también en el portal, donde no pinta nada pero expone el dato— en vez
de mantener una segunda copia. Cero archivos nuevos.

**Lo que cada dimensionador ya tenía se preservó, no se rediseñó.** MikroTik y Aruba tenían una
tercera pestaña propia en el portal («RouterOS Features», «SD-WAN y Licencias») que se llevó
tal cual. Un hallazgo cambió el plan sobre la marcha: la pestaña «SD-WAN y Licencias» de Aruba
resultó ser **redundante** con contenido que su dimensionador ya tenía en su propia pestaña de
licencias (la misma nota metodológica proceso-vs-caudal, la misma tabla de Boost como pool) —
así que no se duplicó, y Aruba solo sumó «Catálogo» y una «Fuentes» liviana que remitía a esa
pestaña para el detalle por producto — división que el dueño del repo pidió unificar el mismo
día (ver *Aruba: la pestaña de Fuentes ya no está duplicada*, más abajo). Huawei aporta sus dos tablas (AR y NetEngine) desde el
mismo `MODELS` que ya carga su dimensionador —los 40 modelos traen el campo `cls` que las
distingue—, sin repetir el fetch. Juniper separa SRX y Session Smart Router en dos tablas, la
misma regla de «no se comparan entre sí» que ya aplica en el resto de esa página. Aruba declara
en la columna «Capacidad» si es rango WAN (EdgeConnect) o firewall (gateways), en vez de fundir
dos medidas distintas en un solo número.

Verificado en Chromium en las 7 páginas: navegación directa desde sidebar y dashboard, tablas
de catálogo con la cuenta de modelos esperada, pestaña de Fuentes con procedencia en vivo, y el
caso que antes fallaba (pastilla «Fuentes» de la barra inferior) cambiando de pestaña en el
sitio en vez de navegar. Sin errores de consola en ninguna. 232 pruebas (sin cambios: todo el
trabajo es de frontend, sin tocar servidor ni API).

**Mejora propuesta al cerrar esta entrega:** `scripts/verificar-pantallas.js` mueve el caudal y
abre la pestaña de BOM en los 7 dimensionadores, pero nunca visita sus pestañas nuevas de
«Catálogo»/«Fuentes» — una regresión ahí (por ejemplo, `renderCatalogo()` rompiéndose el día que
cambie la forma de `MODELS`) pasaría los 15/15 sin que nadie se entere hasta que alguien abra la
pestaña a mano. El costo de cerrarlo es bajo (dos clics más por dimensionador en la función que
ya conduce las 7 páginas) pero no se hizo en este cambio para no mezclar la replicación con una
ampliación del verificador.

### Fortinet: el dimensionador pasa a ser su página principal — piloto (2026-09-09)

A petición del dueño del repo, con la instrucción explícita de hacerlo primero solo para
Fortinet y decidir después si se replica a los otros seis fabricantes.

**Antes**, el botón «Fortinet» del dashboard y de la barra lateral llevaba a una vista de
catálogo dentro del portal, con un botón aparte para abrir el dimensionador en otra pestaña —
dos pantallas para una sola herramienta activa. **Ahora** el botón navega directo al
dimensionador, que suma dos pestañas (**Catálogo**, **Fuentes**) a las tres que ya tenía
(Dimensionar, Equipo y BOM, Licencias). El catálogo se pinta desde `MODELS`, ya cargado para el
propio dimensionador — no se repite el fetch a `/api/catalog` para mostrar lo mismo dos veces —
e incluye los modelos fuera de venta marcados, a diferencia del portal, que los ocultaba del todo
(criterio de `FICHA.rango`: se muestran, no se recomiendan).

**La vista de catálogo/fuentes de Fortinet en el portal se retiró.** Su lógica de
procedencia, carga de fuente oficial y contraste en el acto contra el catálogo —que usan
también los otros seis fabricantes— se extrajo de `index.js` a **`public/js/procedencia.js`**,
un módulo compartido (mismo patrón que `bom.js`/`ficha.js`/`estado.js`) que ambas páginas
cargan: evita duplicar ~300 líneas y que el dimensionador y el portal diverjan en esa pestaña.
El modal de contraste, antes marcado a mano en `index.html`, ahora lo inyecta ese módulo la
primera vez que hace falta — así una página nueva solo necesita la caja `[data-procedencia]`
y el `<script>`, sin copiar marcado.

**Divergencia detectada y resuelta antes de publicar.** Mientras se trabajaba, `origin/main`
avanzó con un commit ajeno a esta tarea (activó el dimensionador de Juniper y quitó
`target="_blank"` de la navegación del portal) que tocaba los mismos tres archivos. Se fusionó
a mano conservando ambos cambios y se reverificó completo (lint, 232 pruebas, Chromium).

**Un fallo propio, cazado por `pantallas.yml` y no por mí.** El primer push rompió
`npm run pantallas`: el chequeo «Portal — las once secciones» esperaba que el botón de
Fortinet activara `#page-fortinet`, que ya no existe. Corregido en `scripts/verificar-pantallas.js`
para reconocer que Fortinet ahora **navega** en vez de activar una sección, y volver al portal
antes de seguir con el resto. Es exactamente para lo que ese workflow existe: cazó una
regresión real de mi propio cambio antes de que Railway la sirviera — el primer despliegue del
push quedó marcado `REMOVED` sin llegar a `SUCCESS` (ver `git log`, deploy `f4c19549`).

Verificado en Chromium (tarjeta y barra lateral → dimensionador; pestañas Catálogo/Fuentes con
el control de carga completo para el rol con permiso `sync`) y en producción tras el despliegue:
`/salud` responde `ok` y los logs muestran `[seed]` y `Presales corriendo en`. Sin
tocar los otros seis fabricantes — el piloto queda ahí hasta que se decida replicarlo.

**Mejora propuesta al cerrar esta entrega — resuelta (2026-09-10)**, ver la entrada de arriba:
el mapa `directo` que decide qué fabricante
navega en vez de abrir su sección vive duplicado en dos sitios — `public/js/index.js` (el
click del portal) y `scripts/verificar-pantallas.js` (la prueba) — con la misma entrada
`{fortinet: 'dimensionador-fortinet-fortigate.html'}` escrita dos veces. Con un solo
fabricante no pesa, pero si el piloto se replica a los otros seis, esa lista crecerá en
ambos archivos a la vez y en algún push alguien va a actualizar uno y olvidar el otro —el
mismo modo de fallo que ya tuvo `CISCO_EOL_MODELS` al vivir sin nada que lo comprobara. El
costo de evitarlo hoy es bajo (un JSON compartido que ambos archivos importen) pero es
trabajo especulativo mientras el mapa tenga una sola entrada; conviene hacerlo en el mismo
cambio que añada el segundo fabricante, no antes.

### Sincronización Inteligente replanteada: analiza en producción, publica por PR (2026-09-08)

El módulo estaba bloqueado entero en producción bajo un solo motivo, pero eran dos problemas
distintos metidos en el mismo saco, y juntarlos impedía justo lo que la herramienta tiene que
hacer — revisar el catálogo que se está sirviendo.

- **Analizar** ahora corre en cualquier entorno. Lee el catálogo vigente (que en producción es
  exactamente lo sembrado desde `legacyData/`) y devuelve cambios sin escribir nada. Falla
  cerrado sin `ANTHROPIC_API_KEY` — el mock que inventaba propuestas ya no existe, así que no
  hay forma de que devuelva un dato falso por no tener clave.
- **Escribir en la base** sigue bloqueado en producción, y con razón: esa base es efímera. Ese
  muro se queda.
- **La escritura durable** no pasa por el servidor: se descarga la propuesta y
  `.github/workflows/aplicar-propuesta.yml` la aplica sobre `legacyData/` con el anclaje de
  `npm run propuesta`, corre `npm run verificar` y abre un PR. **El token de escritura vive en
  Actions, nunca en el servicio que sirve los precios** — esa fue la decisión de diseño frente
  a poner un token de GitHub en Railway.

Excel, CSV y txt ya se subían; ahora la UI lo dice con claridad y el tipo se decide por la
firma del contenido, no por la extensión. Se añadieron Juniper y Nokia al selector. `GET
/api/sync/estado` informa a la UI del entorno y de si hay clave, para no ofrecer un botón que
va a fallar. Documentación oficial del módulo en **`docs/sincronizacion.md`**.

**Un fallo encontrado y cerrado de paso:** `escribirCampo` en `importar-propuesta.js` escapaba
la comilla pero no la barra invertida, así que un `newValue` acabado en `\` cerraba la cadena
antes de tiempo y el resto se leía como código — corrompiendo el archivo de catálogo y dejando
el servidor sin arrancar. El `newValue` puede venir de un documento subido por cualquiera, así
que no es una cadena de confianza. Ahora se escapa por completo (barra, comilla, saltos) y hay
una prueba que reproduce el ataque y confirma que el valor vuelve como dato, nunca como código.

**Para que Analizar funcione en el sitio desplegado hace falta definir `ANTHROPIC_API_KEY` en
Railway.** Sin ella el panel lo dice y no deja pulsar Analizar. Es lo único que queda por hacer
del lado de operación, y es una variable de entorno, no código.

184 pruebas (eran 181). Verificado en Chromium en modo producción: el panel abre, sin clave
avisa y deshabilita Analizar, `/estado` responde `{produccion:true, tieneClave:false}`, y la
descarga produce el JSON con la forma exacta que consume el importador. Sin errores de consola.

### Navegación por fabricante, y cantidad editable en las referencias (2026-09-09)

Dos peticiones del dueño del repo en la misma entrega.

**Cantidad editable** (la mejora propuesta al cerrar la anterior). «Añadir» sumaba de uno en
uno: cotizar 10 licencias eran diez clics y bajar de 3 a 2 no se podía. Ahora la fila del BOM
trae el campo, **solo en lo añadido a mano** —las filas que calcula el dimensionador salen de su
motor, y editarlas invitaría a cambiar una cifra que el próximo repintado pisa—, escribiendo con
`change` y no con `input`: guardar repinta la tabla, así que reaccionar a cada pulsación
destruiría el campo a medio teclear. Menos de 1 quita la línea, que es lo que significa escribir 0.

**La barra de fabricante** (`js/navegacion.js`), en el portal y en los ocho dimensionadores:
← anterior / siguiente → con el nombre del destino a la vista, el paso actual marcado, «3 / 7» y
`Alt`+flechas. **Conserva el paso**: desde el dimensionador de Fortinet, «siguiente» lleva al
dimensionador de Juniper, no a su portada — eso la convierte en un recorrido y no en un menú.

**Lo que NO se hizo, y por qué.** La petición literal era fusionar catálogo, fuentes,
dimensionador, BOM y licencias en una sola página. Los ocho dimensionadores tienen cada uno un
`#bw`, un `#verdict` y un `#pane-bom`: juntarlos habría metido ocho motores en el mismo espacio
de identificadores y el mismo estado global, para ganar una continuidad que es de **navegación**
y no de archivo. Con la barra, el riesgo es que se pinte mal una barra; con la fusión, que
calcule mal un dimensionador. **Dentro de cada dimensionador ya hay pestañas**
(Dimensionar · Equipo y BOM · Licencias), así que lo que faltaba era moverse entre fabricantes,
que es justo lo que se añadió.

**Un fallo propio, cazado al mirar la prueba en vez de su resultado:** la primera versión
necesitaba que la prueba llamara a `pintar()` a mano, porque el portal cambia de sección sin
recargar y la barra no se enteraba — para un usuario real no habría aparecido nunca. Se corrigió
observando la clase de las secciones (`MutationObserver`), y la prueba se endureció para navegar
como un usuario, pulsando la barra lateral.

232 pruebas (eran 228). **15/15 pantallas** en Chromium, y la captura del dimensionador de
Fortinet revisada a ojo: la barra queda discreta, con el acento del fabricante y el paso actual
marcado.

### Las referencias añadidas dejan de perderse entre fabricantes (2026-09-09)

Ejecución de la mejora propuesta al cerrar la entrega anterior, aprobada por el dueño del repo.

**El fallo, que era de pérdida de datos y silencioso.** Las referencias se guardaban en
`presales-bom-refs:<pathname>`, una clave por página. Así que añadías un bundle de Fortinet,
te ibas a Aruba, enviabas al cotizador desde allí — y el de Fortinet se quedaba atrás sin un
aviso. Justo en la pantalla que existe para armar una cotización **multi**-fabricante.

**La corrección.** Una sola clave para los siete, y el fabricante que cada referencia ya llevaba
dentro es lo que las separa: el BOM de cada dimensionador muestra **solo las suyas** —una
referencia de Aruba en el BOM de un FortiGate no corresponde a ese equipo— pero
`enviarACotizador` manda **todas**. `ficha.js` informa el fabricante de la página con
`BOM.fijarVendor`, así que las siete páginas siguen sin tocarse.

**Dos detalles que evitan reemplazar un fallo por otro:**

- **La clave de una referencia es `fabricante|sku`, no el sku suelto.** Con una lista compartida,
  dos fabricantes pueden traer el mismo código, y quitar uno habría quitado el otro.
- **La clave vieja se migra** en la primera lectura y luego se borra. Sin eso, quien ya tuviera
  referencias guardadas las habría visto desaparecer al desplegar — la misma pérdida silenciosa
  que este cambio venía a evitar, reintroducida por la propia corrección.

228 pruebas (eran 224). Verificado en Chromium el caso exacto: añadir en Fortinet → el BOM de
Aruba **no** la muestra → añadir una de Aruba → enviar al cotizador **desde Aruba** → llegan las
dos.

### Las referencias llegan al BOM y al cotizador: añadir un bundle, no solo verlo (2026-09-09)

Continuación directa de lo anterior, a petición del dueño del repo. Ver las referencias no
servía de mucho: un FortiGate se vende casi siempre con su bundle de FortiCare, y esa línea
había que teclearla a mano en el cotizador.

Ahora cada fila de la sección trae un botón **«Añadir»**, la referencia aparece en el BOM bajo
**«Referencias añadidas»** con su SKU y su precio, **suma al total**, y «Enviar al cotizador» se
la lleva junto al equipo. Se quita con la × de su propia fila.

**Viven en `bom.js`, no en cada página.** `renderTabla` es el punto único por el que pasan los
siete dimensionadores, así que gestionarlas ahí las da a los siete sin tocar ninguno — la misma
razón por la que `sincronizar` y `avisoDesvio` acabaron en ese módulo.

**Sobreviven al repintado, y ese es todo el punto.** El BOM se repinta en cada cambio de
escenario; una referencia guardada en el array de filas que construye la página se habría
borrado al mover el caudal, en silencio — el mismo modo de fallo que ya tuvo `llevarABom`. Se
guardan aparte, por página, y se vuelven a pegar en cada render. Verificado moviendo el caudal a
3.000 Mbps con el bundle puesto.

**Un fallo propio, corregido antes de entregar:** la primera versión fijaba `vendor:'Fortinet'`
al construir la línea en el cotizador, lo que habría pintado de Fortinet una referencia de
Aruba. Ahora el fabricante viaja con la referencia y el color sale de `CATALOG` buscando ese
fabricante real. Es un dato inventado de los que no rompen nada y solo mienten.

224 pruebas (eran 219). Verificado en Chromium el ciclo entero: añadir → aparece en el BOM →
sobrevive al cambio de escenario → llega al cotizador marcado como referencia de pedido →
persiste tras recargar → la × lo quita.

### Referencias de pedido en la ficha: 6.849 SKU de Fortinet, y lo que cada fabricante sí tiene (2026-09-09)

A petición del dueño del repo: «mostrar todos los SKU con la descripción relacionados a los
equipos, para que los usuarios vean la mayor cantidad de información asociada».

**El hueco era real y más grande de lo que parecía.** `ficha.js` no mostraba **ningún** SKU —ni
siquiera el `hwSku` que ya estaba en el catálogo—, así que quien armaba una propuesta tenía el
modelo y luego iba a buscar el número de parte a otro sitio. Y las **28 referencias que Aruba ya
traía estructuradas** desde la fase 6c no se veían en ninguna pantalla: el dato estaba guardado y
nadie podía leerlo.

**Fortinet aporta 6.849 referencias** —hardware, bundles de FortiCare/FortiGuard, licencias y
SaaS— con descripción y precio de lista, extraídas con `npm run skus` de la misma price list que
respalda los precios. El importador **ancla cada bloque** contra el `hwSku` y el precio ya
verificados antes de aceptarlo: 54 de 54 modelos entraron, cero rechazos. El casado va anclado al
nombre (`FortiGate-30G` sin que le siga letra o dígito), no por substring suelto: hoy no hay
arrastre —se midió— pero un futuro `FortiGate-30G2` lo habría producido en silencio.

**Van bajo demanda y por modelo**, y esa fue la decisión de arquitectura: 774 KB en el payload
del dimensionador cargaría todo eso en cada visita para mostrar, como mucho, las de un equipo.
`GET /api/referencias/:vendor/:modelo` sirve unos 12 KB, desde `legacyData` sin pasar por la base
—precedente de `toFuentes`—, y una prueba e2e falla si ese payload por equipo supera los 120 KB.

**Lo que cada fabricante tiene es distinto, y se dice.** Aruba trae variantes **sin número de
parte** (HPE no lo publica, igual que no publica precios) y se presentan como variantes, no como
referencias de pedido; Cisco solo el SKU de cabecera de 8 de sus 21 modelos; Huawei, MikroTik,
Juniper y Nokia no traen ninguna y la sección **lo declara**, en vez de dejar un hueco mudo que
se lee como «este equipo no necesita nada» — el mismo criterio que «el catálogo no lo especifica»
de la sección de alimentación.

219 pruebas (eran 212). Verificado en Chromium: el buscador filtra sin perder el foco, los chips
acotan por tipo, y al cambiar de equipo **los SKU cambian**. Esa última aserción se reforzó a
propósito: la primera versión comprobaba el conteo, y el conteo no prueba nada —el 60F y el 61F
traen 79 referencias cada uno—, así que ahora compara los SKU, que es lo que distingue «la tabla
siguió al equipo» de «se quedó con la del anterior».

### Carga de fuente por fabricante, y una ventana que contrasta el documento con el catálogo (2026-09-08)

A petición del dueño del repo, en dos pasos: primero *«un botón para subir documentos por
fabricante que actualice las fuentes automáticamente apenas se suba»*, y después *«al subir,
generar una ventana interactiva que contraste el documento con el actual y muestre lo nuevo
que se va a actualizar»*.

**La carga sin IA y sin crédito.** Cada fabricante tiene en su pestaña «Fuentes y Referencias»
un control «Cargar fuente oficial» (permiso `sync`). Sube el datasheet o la lista de precios
(PDF/XLSX/CSV/TXT, tipo decidido por la firma del contenido, no por la extensión) y **la
procedencia de ese fabricante se actualiza al instante**: aparece como fuente «Cargada» con
fecha, hash SHA-256 y enlace. Los archivos viven en el volumen persistente
(`AUTH_STATE_DIR/fuentes/`), como `usuarios.json`, no en la base efímera, así que sobreviven a
un deploy; el nombre en disco lo genera el servidor, nunca el del archivo subido, y `rutaArchivo`
valida el formato del id antes de tocar disco (defensa de path traversal). `server/fuentesSubidas.js`
es el módulo; rutas `POST /api/fuentes/:vendor` y `GET /api/fuentes/:vendor/documento/:id`.
**Actualiza la procedencia, no reescribe las cifras** — subir no es contrastar, y estampar
«verificado» sobre números que nadie comparó es la mentira que este catálogo prohíbe.

**La ventana de contraste (Excel/CSV), determinista y en el navegador.** Al subir una fuente
tabular se abre en el acto una ventana que la compara con el catálogo vigente **sin IA**:
reconoce una columna solo si su cabecera casa con un campo real del catálogo (o un alias
explícito cuyo campo existe para ese fabricante), y lo que no reconoce lo **lista** en vez de
adivinar. Devuelve cuatro montones: **cambios** (modelo que existe con un valor distinto,
comparado por valor y no por formato), **altas** (modelo que no está — se reportan pero nunca
se aplican solas, la regla del importador), **sin cambio** (se cuentan) y **columnas
ignoradas**. Es una vista previa: no escribe nada. Desde ahí se marcan los cambios y se
**descarga la propuesta** con la forma que consumen `npm run propuesta` y `aplicar-propuesta.yml`,
así el cambio pasa por el mismo anclaje y por un PR revisable. Un **PDF** no se contrasta aquí
—extraer una tabla de un PDF sin equivocar de fila es lo que este repositorio no automatiza—:
la ventana lo dice y remite a la IA o a los importadores. La regla vive en
`public/js/contraste.js` (`window.CONTRASTE`); el parseo (SheetJS cargado bajo demanda, para no
pesar ~900 KB en cada visita al portal) y el pintado, en `js/index.js`.

**Borrar una fuente y actualizar la pestaña (tercera petición del mismo día).** Cada fila trae
ahora, para quien tiene `sync`, una columna **Acciones**:

- **Borrar** solo en las fuentes **cargadas** — quita el archivo del volumen y su fila, con
  confirmación porque no hay deshacer. Las del catálogo (`legacyData/fuentes.js`) muestran en su
  lugar **«en el código»**: se quitan con un commit, que deja diff y revisión. Un botón que
  borrara la procedencia del catálogo sin rastro sería justo lo contrario de lo que esta pestaña
  da. La ruta `DELETE` exige el permiso (403 sin él) y responde **404 a un id de otro
  fabricante**, así que borrar uno no puede alcanzar al de al lado. Y la entrada se retira
  **aunque el archivo ya no esté** en el volumen: una fila que anuncia un documento que no se
  puede abrir es un enlace roto presentado como procedencia.
- **Actualizar** en los **siete** fabricantes — vuelve a pedir `/api/fuentes` y repinta, con la
  hora del último refresco. El portal pinta esta pantalla una sola vez al cargarse, así que un
  documento subido desde otra pestaña, o borrado por otra persona, no se veía hasta recargar la
  página entera. Va sin permiso: releer no cambia nada.

206 pruebas (12 nuevas sobre `contraste.js`: mapeo por valor no por formato, columna no
reconocida que se ignora, alias solo si el campo existe, alta nunca aplicada, celda vacía que no
propone borrar, casado de nombre con prefijo de fabricante, y la forma de `comoPropuesta`; más 3
sobre `eliminar` y el e2e de borrado contra el servidor real).
Verificado de extremo a extremo en Chromium: login → pestaña de fuentes de Huawei → subir un CSV
→ la ventana detecta el cambio de un AR611 (fwd 300→700), reporta el alta y la columna ignorada,
el botón de descargar propuesta aparece y la procedencia muestra la fuente «Cargada». Sin errores
de consola (salvo las tipografías de Google, bloqueadas por egreso en este entorno).

**Lo único pendiente de operación** sigue siendo definir `ANTHROPIC_API_KEY` con saldo en
Railway para que el *análisis por IA* funcione; la carga de fuentes y el contraste tabular no lo
necesitan.

### El pendiente 4, cerrado: las pantallas se conducen solas en cada push (2026-09-04)

Faltaba la mitad visual: `sonda-produccion.yml` confirmaba que el dominio público responde,
pero nunca inicia sesión —no tiene por qué guardar la contraseña real de producción—, así que
«¿esta pantalla funciona?» seguía dependiendo de que una persona abriera el sitio.

**Se estudió montar un entorno de staging en Railway y se descartó por seguridad, no por
coste.** Habría añadido una **segunda copia pública del catálogo de precios**, tras una
contraseña guardada en los secretos del repositorio — y los secretos de Actions los puede leer
cualquiera que sepa empujar un workflow. Y a cambio de esa exposición no se veía nada nuevo:
`DATABASE_PATH` va sin definir en producción, la base es **efímera** y se resiembra desde
`server/seed/legacyData/` en **cada** despliegue, así que lo que pinta una pantalla es función
del *commit*, no del entorno. Un arranque de ese mismo commit en el ejecutor de Actions —que
`verificar.yml` ya hacía para comprobar `/salud`— renderiza exactamente los mismos datos.

Así que la verificación vive donde ya estaba el servidor. `npm run pantallas`
(`scripts/verificar-pantallas.js`) entra por el muro y conduce **15 pantallas**: las once
secciones del portal, el comparador, las cinco capas de la calculadora, los ocho
dimensionadores —moviendo el caudal y abriendo la pestaña de BOM en cada uno—, el cotizador,
la guía, cuenta y usuarios. `.github/workflows/pantallas.yml` lo corre en cada push y sube las
capturas como artefacto, con una tabla de resultados en el resumen de la corrida. La
contraseña la genera el propio job y muere con él: no es un secreto del repositorio ni abre
nada más.

**Falla ante lo que de verdad rompe una pantalla:** un error de consola, una excepción, una
petición fallida **al propio origen** o un contenedor que se queda vacío —el síntoma de un
`fetch` que falló en silencio, que es el modo más callado que tiene esta aplicación, porque
cada pantalla se pinta desde una sola llamada—. Las peticiones a terceros se ignoran a
propósito: las tipografías de Google se cargan sin bloquear (`js/fuentes.js`) y desde este
entorno ni siquiera resuelven, y un verificador que se pone rojo por un CDN ajeno se acaba
ignorando.

**Y se comprobó que detecta, no solo que pasa.** Con todo en su sitio da 15/15; quitando
`public/js/comparador.js` cae a 12/15 con código de salida 1, y el informe dice
«`#compareOut` se quedó vacío» además de reproducir la firma histórica exacta —«Refused to
execute script… MIME type (`text/html`)»—, que es literalmente el fallo del script que quedó
detrás del muro de auth que CLAUDE.md lleva documentado. Dos fallos de la primera versión, los
dos míos y no de la aplicación, se arreglaron antes de subirla: esperaba **visibilidad** de
controles que viven en una `.page` inactiva del portal (es `attached` lo que hay que esperar),
y contaba como error de la aplicación el `ERR_CONNECTION_RESET` de Google Fonts.

**Lo que sigue sin automatizarse, y no se puede:** el juicio de si la pantalla dice lo que se
le quiere decir a un cliente. Pero eso ahora se hace con las capturas delante en cada push, no
teniendo que acordarse de abrir el sitio. Lo que **no** se comprueba es ninguna cifra del
catálogo: para eso están las 181 pruebas, y una aserción sobre «3,1 Gbps» se rompería en cada
cambio de catálogo, que es como se enseña a la gente a ignorar un rojo.

**Este check frena el despliegue a propósito** —Railway espera a las comprobaciones de CI y una
pantalla rota no debería llegar a producción—. Si alguna vez estorbara más de lo que ayuda, la
válvula está escrita en la cabecera del workflow: `continue-on-error: true` en el job deja el
rojo y las capturas pero desbloquea.

### La calculadora de throughput dimensionaba con la cifra de portada (2026-09-04)

La pantalla elegía equipo con una sola línea:

```js
const cap = profile === 'ipsec' && d.ipsec > 0 ? d.ipsec : d.tp;
```

`d.tp` es la cifra de **portada** de cada catálogo —firewall en Fortinet, forwarding en
Huawei, capacidad de conmutación en Nokia—, así que de ahí salían tres fallos, y los tres
daban una respuesta con pinta de correcta:

1. **El perfil «SD-WAN / NGFW» no miraba la cifra de NGFW ni una sola vez.** Medido en el
   navegador con los valores por defecto de la pantalla (1 Gbps, bidireccional, 30 % de
   margen = 2,6 Gbps): proponía un **FortiGate 30G**, que hace 4 Gbps de firewall y **570 Mbps
   de NGFW**. Factor **4,6x por debajo** de lo pedido. El que cumple de verdad es el
   FortiGate 120G, cuatro escalones de gama más arriba. Es el mismo modo de fallo que la
   auditoría de FortiGate documentó (14,3x) y que el SRX380 repite (10x).
2. **Un equipo sin cifra de IPsec se juzgaba por su forwarding.** Para 2,6 Gbps de IPsec
   proponía un **Nokia 7220 IXR-D1** —un leaf de fabric de datacenter— porque conmuta
   88 Gbps, y un **Aruba EC-S** cuyo IPsec en este catálogo es `0`.
3. **Comparaba las siete cifras de portada entre sí sin decirlo**, mientras el comparador de
   la pantalla de al lado avisa exactamente de eso.

**La regla ahora vive en `public/js/calculadora.js`** (el pintado sigue en `js/index.js`,
mismo reparto que el comparador): se dimensiona con la cifra de la capa que pide el perfil, y
si el catálogo no la trae para ese modelo, **el modelo se aparta con su motivo** — nunca se
sustituye por la de otra capa. El panel de apartados los cuenta por fabricante, dice por qué
y enlaza al dimensionador de ese fabricante, así que una lista corta se explica en vez de
leerse como catálogo completo. El perfil de tráfico pasó de tres opciones a **cinco capas**
(reenvío/firewall, IPsec, SD-WAN, con inspección NGFW/IPS, e inspección completa
Threat Protection/ATP), que son cinco preguntas distintas sobre el mismo equipo: en un
FortiGate 120G son 39, 35, — , 3,1 y 2,8 Gbps.

**El error que cometí a mitad, y cómo se cazó.** Escribí el mapa de capas contra
`legacyData/indexPR.js`, y lo que sirve la aplicación es otra cosa: `seedCatalog.js` funde en
la misma fila el catálogo del portal y el del dimensionador de ese fabricante. En
`indexPR.js` el `sdwan` de Cisco es el texto «Sí»; en `/api/catalog` es un **número**. Con el
mapa mal escrito, la pantalla apartaba los 19 modelos de Cisco «porque el catálogo no publica
su cifra de SD-WAN» — un «sin dato» falso, del mismo tipo que el «IPS: no aplica» de un
Catalyst 8300 que el comparador llegó a mostrar. Apareció al mirar la API real en el
navegador, no en las pruebas, porque las pruebas leían el mismo fichero equivocado. La
corrección trajo además a Juniper (los SRX de 2024 publican `vpn`, `ips` y `atp`) y a
EdgeConnect (su rango de ancho de banda WAN). La guarda está en
`test/servidor-produccion.test.js`, que interroga al servidor de verdad: un modelo solo puede
apartarse si el campo del que sale esa capa está vacío **en su fila**.

Otros dos arreglos de la misma pantalla: la exportación CSV se armaba rascando el HTML ya
pintado —perdía la capa dimensionada y se rompía al tocar el maquetado—, y ahora sale de los
datos, con la capa, la holgura y los apartados con su motivo; y la lista de fabricantes se
deriva del catálogo en vez de un `['Huawei','Cisco',...]` escrito a mano, que es lo que dejó
a Aruba y MikroTik sin botón en los filtros del cotizador. Verificado en Chromium con los
cinco perfiles, sin errores de consola. 16 pruebas nuevas (181 en total).

### Nokia, los 18 modelos cubiertos: un segundo dimensionador para lo que no es fabric (2026-09-03)

Cierra el pendiente 6. Los 14 modelos que la fase 1 dejó fuera —7250 IXR, 7250 IXR-X,
7250 IXR-R y 7750 SR/SR-s/SR-1x— ya se dimensionan, en `dimensionador-nokia-7750sr.html`.

**Son dos páginas porque son dos preguntas.** El dimensionador 7220 IXR responde «cuántos
leafs y cuántos spines», y su resultado son dos equipos con sus cantidades. Aquí la pregunta
es «cuál de estos catorce aguanta el enlace», y el resultado es **un** equipo — así que esta
página sí reutiliza `js/ficha.js`, con su desplegable de candidatos, su ficha completa y su
sección de alimentación, igual que los otros cinco dimensionadores. Nokia es ahora el único
fabricante del portal con dos.

**No hizo falta ningún documento externo, y eso era el hallazgo.** La capacidad y los puertos
de los catorce ya estaban verificados en `indexPR.js`, pero como **texto libre**: `"6.4 Tbps"`,
`"36x100GE o 12x400GE · 1U"`. Todo el trabajo fue estructurarlos en campos que un motor pueda
usar, sin añadir, corregir ni completar una sola cifra. Y estructurar obligó a decidir tres
cosas que el texto libre escondía:

1. **«36x100GE o 12x400GE» son dos configuraciones alternativas, no la suma de las dos.** Un
   7250 IXR-6e da 36 puertos de 100GE **o** 12 de 400GE, nunca ambos. Por eso `configs` es una
   lista de opciones y el motor comprueba si *alguna* cumple: sumarlas habría prometido 48
   interfaces donde hay 36. Medido en el navegador: pidiendo 40 puertos de 400GE, el único
   candidato es el 7750 SR-1x-48D, y el SR-1x-92S —que trae 12x400GE **más** 80x100GE— queda
   fuera correctamente, porque sus puertos de 100GE no completan los de 400GE.
2. **Un chasis modular no tiene densidad publicada, y eso no es lo mismo que no tener
   puertos.** «7 slots IOM · hasta 400GE» dice cuántas tarjetas caben, no cuántos puertos
   salen: depende de qué IOM se pida, y este catálogo no tiene el catálogo de IOM. Los cinco
   modelos así (7750 SR-7s, SR-14s, 7250 IXR-R6dl, IXR-e, IXR-e2) se dimensionan por caudal y
   **se apartan con su motivo** en una sección propia cuando se pide una densidad concreta.
   Descartarlos en silencio los haría parecer insuficientes; colarlos con una densidad
   inventada sería peor. Es el mismo trato que `ficha.js` da a una capa sin cifra.
3. **La capacidad va en Gbps aunque el material comercial la cite en Tbps.** 6,4 Tbps son
   6400. Con las dos unidades mezcladas, un equipo de 6,4 Tbps habría perdido al ordenar
   contra uno de 300 Gbps — el mismo fallo que `tabla.js` ya tuvo cuando 5.999 dólares valían
   menos que 29.

**La plataforma se elige antes que el caudal**, la misma regla que ya gobierna el dimensionador
Cisco. Estas cinco familias no son intercambiables aunque coincidan en Tbps: un router de cell
site, un agregador de datacenter y un PE de core IP/MPLS cambian el sistema operativo, el papel
en la red y quién la opera. Verificado en el navegador: a 520 Gbps, sin acotar sale un
7250 IXR-e2 de cell site; acotando a la familia 7750 SR sale un SR-1s. Son respuestas distintas
a preguntas distintas, y ordenar por capacidad sin acotar la familia daría la primera cuando se
buscaba la segunda.

Seis pruebas nuevas (144 en total, eran 138) sobre el motor puro, que se expone como
`window.NOKIA_SR` igual que `BOM`, `FICHA` y `ESTADO` exponen el suyo: cubren las
configuraciones como alternativas, el apartado de los modulares, el acotado por familia y que
pedir más que el modelo más grande no devuelva el mayor «por aproximación». Arranque real con
`NODE_ENV=production` y la página conducida en Chromium sin errores de consola.

### Juniper 12/12, dos SRX que ya no se piden, y una etiqueta que decía lo contrario (2026-09-03)

Una sola corrida de Actions trajo los siete documentos que faltaban para cerrar tres
pendientes — cinco *hardware guides* de Juniper, la tabla oficial de fin de vida de la serie
SRX y la ficha de la serie Cisco 8300 — y los tres se cerraron. Lo interesante no fue el
volumen sino que **cada uno enseñó algo distinto sobre cómo se lee una fuente**.

**Pendiente 15, Juniper pasa de 7/12 a 12/12.** SRX320, SRX340, SRX345, SRX4200 y SRX4700.
Dos casos merecen quedar escritos:

1. **El SRX340 y el SRX345 son modelos consecutivos de la misma serie con respuestas
   opuestas.** El 345 se vende con una fuente o con dos (`RE-SRX345-DUAL-AC`) y con las dos
   instaladas la que queda asume la carga sin interrupción — es el **quinto** `'opcional'`.
   El 340 lleva la suya **fija en el chasis**, no reemplazable en campo y con una sola entrada
   AC: `false` duro. Deducir uno del otro por la gama habría acertado en ninguno de los dos.
2. **El SRX320 se queda sin `watts` aunque su guía sí publique consumo medio**, porque publica
   **dos**: 46 W el modelo sin PoE y 221 W el modelo PoE, un factor 4,8. Este catálogo tiene
   una sola entrada `SRX320`, así que elegir una de las dos cifras sería correcto para la
   mitad de los pedidos y falso para la otra mitad. Las dos van en el texto y `watts` queda
   vacío — el mismo tercer estado que ya protege a `redund` y a las fuentes sin fecha.

El SRX4200 y el SRX4700 son `true` sin matices, y ninguno lleva `watts`: los 650 W y los
2.200 W que publican son capacidad **por fuente**, no consumo. Su dato queda registrado pero
**hoy no se ve en pantalla**, porque los dos solo traen `fw` y el motor descarta con su motivo
a los modelos sin cifra en la capa efectiva — se verá el día que se complete su `fwImix`.

**Pendiente 8: dos de los doce SRX ya no se piden, y lo difícil fue no marcar de más.** La
tabla oficial de hitos mezcla en las mismas filas el fin de vida de **paquetes de software**
(`S-SRX1500DP-A1-7` y compañía, «7-year security software bundles») con el del hardware, y
varios modelos aparecen **solo** por ahí. Retirar un paquete de licencias no retira el equipo:
aplicar esas filas habría sacado de la recomendación a aparatos que Juniper sigue vendiendo.
El criterio que se usó es el SKU — solo cuenta la fila que lista el chasis o el sistema del
propio modelo (`SRX1500-CHAS`, `SRX1500-SYS-JB-AC`, `SRX4100-CHAS`, `SRX4100-SYS-JB-AC`) — y
con ese filtro los doce modelos dan **exactamente dos**: SRX1500 (TSB101240) y SRX4100
(TSB101895), ambos con último pedido el **2026-04-15**, ya vencido, y soporte hasta 2031.
El **SRX4200 es el caso que mejor lo ilustra**: sí aparece en la tabla, pero su única fila es
la del kit de rack `SRX4200-RMK2`, y un accesorio retirado no retira el equipo.

Verificado en el navegador: el SRX1500 ahora se muestra con «fin de venta vencido» y deja de
ser el recomendado. `sucesor` va **vacío** en los dos: el SRX1600 y el SRX4300 son los
reemplazos evidentes por posicionamiento, pero la tabla no nombra ninguno, y «evidente» es
exactamente como entró el FortiGate 2000F inexistente que este catálogo ya sufrió.

**Pendiente 9: Cisco sí publica el SD-WAN del C8355-G2, y son 8,7 Gbps.** Mientras estuvo en
`null`, la página lo dimensionaba con sus 20 Gbps de IPsec marcándolos «(cifra IPsec)»:
**2,3 veces por encima** de lo que el equipo hace en SD-WAN, en el único perfil en el que ese
equipo se vende. La fila entró con doble anclaje — su forwarding de 38 Gbps y su IPsec de
20 Gbps ya coincidían con el catálogo — y de paso la misma ficha corrigió otras dos cosas del
mismo modelo: su `redund` estaba en `false` y el equipo trae **entrada de alimentación doble
con dos fuentes por defecto**, y sus 45 W son de las pocas cifras que Cisco publica como
*típica* y no como máximo, así que sí entran en `psu.watts`.

**Y una etiqueta que decía lo contrario de lo que mostraba.** Al revisar cómo se pintaba lo
anterior apareció que la fila `psu.amps` de la ficha se llamaba **«Salida»**, y era falso en
**22 de las 24 filas del catálogo**: en Fortinet y en Juniper lo que se guarda ahí es la
corriente que el equipo **toma de la red** («12 A @100 V · 9 A @240 V»), que es justo el dato
con el que se dimensiona un UPS o un circuito — llamarlo salida invitaba a leerlo al revés.
Ahora se llama «Corriente», y las dos únicas filas que **sí** son una salida (el módulo
PAC350S12-CR de Huawei) lo dicen en el propio valor. De paso, su decimal pasó a coma, que es
la convención de este catálogo.

Las tres fuentes quedan registradas en `fuentes.js` — incluidas las *hardware guides* de
Juniper, que se habían usado el mismo día para los primeros siete modelos **sin registrarse**.
138 pruebas (eran 135), arranque real con `NODE_ENV=production` y las dos páginas conducidas en
Chromium sin un solo error de consola.

### Juniper 7/12 y un defecto de Cisco que decía dos cosas a la vez (2026-09-03)

**Juniper** (pendiente 15): su material comercial publica rendimiento, no alimentación — lo
eléctrico vive en las *hardware guides*, una por modelo. Se bajaron seis y se comprobó modelo
por modelo que **cada guía habla solo de su equipo** antes de aplicar nada; la lección del
`70f-series.pdf` de Fortinet, que resultó ser la ficha del 71F, ya está incorporada. De 1 a 7
de 12.

**Cuatro de los seis son `'opcional'`**, y Juniper lo dice sin rodeos: *«We ship the SRX1600
with only one power supply unit (PSU). You can order the second»*. El SRX1500, el SRX1600, el
SRX2300 y el SRX4300 salen con una fuente y la segunda se pide aparte. Es la segunda vez en el
mismo día que ese cuarto estado evita una promesa falsa — nació con el FortiGate 80F/90G.

**Cisco, revisado como pedía el encargo, y aparecieron tres defectos del mismo tipo**: datos de
pedido afirmados como hechos sobre equipos que no los admiten.

1. **La misma pantalla decía dos cosas sobre el mismo campo.** La tabla de ficha tenía su
   propia fila «Redundancia de fuente de serie» pintando «No (kit opcional)», mientras la
   sección de alimentación que esa misma página ya renderiza con `FICHA.seccionAlimentacion`
   decía «No — fuente única». La fila se retiró: la regla vive en un solo sitio.
2. **Ese «(kit opcional)» afirmaba que existe un kit de redundancia** para los **once** modelos
   con `redund:false`, entre ellos cuatro Meraki MX de sobremesa. Inventar una opción de pedido
   es el mismo fallo que el `FortiGate 2000F` y el `EC-2XL`.
3. **Y en dos sitios más se ofrecía una NIM de LTE a equipos con `nim: 0`** — los Meraki no
   tienen ranuras. Ahora los avisos distinguen si el equipo admite la ampliación o no.

**Pendiente 3, avanzado de verdad**: con el hallazgo de que `arubanetworking.hpe.com` sí
responde, se bajaron **4 de 4** documentos de ese dominio y, por decisión del dueño del repo, se
commitearon **los dos que sirven para cotizar** — el *EdgeConnect Hardware Reference* (17 MB,
el de las especificaciones eléctricas) y la guía de licenciamiento (0,8 MB). Los otros dos son
documentos de arquitectura y habrían sumado 21 MB permanentes al historial sin aportar a una
propuesta. **De 1 a 3 de 24 con copia local.** Verificado en Chromium: con sesión el PDF llega
como `application/pdf` con su firma `%PDF-`; sin sesión redirige al login, que es como debe
estar detrás del muro.

Los 21 restantes viven en los dominios que devuelven Akamai o agotan el tiempo. `LEEME.md`
recoge ahora la tabla por dominio, para que nadie vuelva a pedir los 24 de golpe.

### Pendiente 15: MikroTik 14/15 y Aruba 6/21, y un quinto estado (2026-09-03)

MikroTik se dejó leer sin resistencia —su sitio ya respondía al vigía— y cada ficha de
producto publica «Max power consumption» y el modo de alimentación. Aruba era la duda, y la
respuesta resultó **más matizada que «HPE es Akamai»**: de los tres dominios que usa su
manifiesto, `arubanetworking.hpe.com` (documentación técnica) **sí responde** y entregó el
*EdgeConnect Hardware Reference* completo, 170 páginas; `arubanetworks.com` devuelve Akamai y
`hpe.com/psnow` agota el tiempo. Medirlo por dominio en vez de dar el fabricante por perdido
es lo que abrió esta puerta.

**Dos distinciones que el campo no sabía decir:**

- **Varias entradas de alimentación no son doble fuente.** El RB5009 tiene *tres* (jack DC,
  PoE-IN y terminal de 2 pines) sobre **una sola fuente interna**: permite alimentar desde dos
  tomas distintas, que es información útil, pero marcarlo `true` sería prometer una redundancia
  de fuente que no existe. Va en `false` con la explicación en el texto. El único MikroTik de
  esta tanda con doble fuente real es el CCR2004-16G-2S+, que declara **2 ranuras de PSU**.
- **Quinto estado, `'no-aplica'`.** Las licencias CHR de MikroTik y el EdgeConnect virtual son
  software sobre un hipervisor: no tienen fuente ninguna. Dejarlos en «el catálogo no lo
  especifica» haría esperar un dato que no existe.

**Ni MikroTik ni HPE publican un consumo típico**: MikroTik da máximos («Max power
consumption» y «sin accesorios») y HPE un «Power Requirement». Como la ficha rotula
`psu.watts` como «Consumo típico», esas cifras van en el texto diciendo qué miden — el mismo
criterio que dejó fuera los 2.500 W del FortiGate 7081F, que eran capacidad por fuente.

**Un fallo propio, encontrado y corregido**: la primera aplicación insertó `redund`/`psu`
**dentro del array `skus`** de EC-S y EC-M, colgando la alimentación de una referencia de
pedido en vez del equipo. El objeto seguía siendo válido y el arranque no se quejaba; solo lo
delató contar la cobertura. Se revirtió, se rehízo anclando la inserción al `id`, y hay una
prueba nueva que fija que ningún SKU lleve esos campos. El linter cazó además un `psu`
duplicado en EC-S —`no-dupe-keys`, la regla que existe por el `{f:'hub',f:'hub'}` de la guía—
y los dos se fusionaron conservando lo que el catálogo ya decía.

Quedan sin dato el RB4011iGS+ sin RM (MikroTik no publica ficha propia de esa versión; la de
`rb4011igs_rm` es explícitamente del RM, y aplicarla habría sido el mismo error que el 70F) y
los 15 equipos AOS de Aruba —gateways 9000 y controladoras 7000—, que viven en los dominios
que sí bloquean.

### Pendiente 15: Fortinet de 6 a 56 de 58, y un cuarto estado que faltaba (2026-09-03)

Segunda tanda del mismo día, con el patrón ya probado: `WebSearch` localizó el nombre real de
las fichas —Fortinet usa **dos** convenciones, `fortigate-<serie>-series.pdf` y
`fortigate-fortiwifi-<serie>-series.pdf`, y cuál toca no se adivina—, un workflow probó las dos
por serie desde un ejecutor de Actions, y las 16 que existen se leyeron **página por página en
su versión renderizada**. 31 modelos nuevos con dato.

**Lo que apareció leyendo, y que ninguna búsqueda habría dado:**

- **`redund` necesitaba un cuarto estado.** El 80F y el 90G publican «Powered by up to 2
  External DC Power Adapters (**1 adapter included**)»: salen de fábrica con una fuente y
  admiten la segunda. `true` habría prometido algo que no viene en la caja y `false` habría
  negado una redundancia que el equipo sí soporta — las dos etiquetas mentían. `ficha.js` gana
  `'opcional'` («Opcional — admite una segunda fuente, no viene de serie»), por el mismo motivo
  por el que ya existía el tercer estado. Reparto final: 24 `true`, 4 `'opcional'`, 9 `false`.
- **«Doble fuente» no significa lo mismo en toda la línea.** El 200G, el 400G y el 700G traen
  las dos de serie pero **no se cambian en caliente**; el 900G, el 1000F, el 3000G y el 3500G
  sí. En una propuesta con SLA de disponibilidad eso no es un detalle.
- **El 3800G exige 200-240 V** y no arranca a 100 V como el resto de la línea. Es una condición
  de instalación que se descubre en obra si no está en la ficha.

**Y dos defectos propios, corregidos antes de desplegar**: la nota escribía «19,9 W» mientras
la fila de arriba pintaba «19.9 W» —dos separadores decimales en el mismo panel—, y «1.496 W»
era directamente ambiguo en un catálogo que declara el punto como decimal (se leería 1,496 W).
La prosa va ahora sin separador de millares, igual que la fila.

**Y esos 404 resultaron ser la pista, no el final.** Fortinet sirve las fichas nuevas en
`/assets/data-sheets/pdf/<archivo>` y las de la generación F antigua en
`/assets/data-sheets/<archivo>` — un subdirectorio de diferencia. Con la ruta corta bajaron 10
de 12 y entraron **19 modelos más**: toda la línea 1800F a 4800F. Justo por esto la sonda
reportaba los 404 en vez de darlos por buenos.

**Una trampa que conviene recordar**: `fortigate-70f-series.pdf` **no es la ficha del 70F**. Es
la del 71F —su portada lo dice y el 70F no aparece ni una sola vez en el documento—, así que
aplicarle esas cifras habría sido creerle al nombre del archivo en vez de a su contenido. El
70F se queda sin dato a propósito.

Quedan **2 de 58** sin dato: el 70F por lo anterior y el 200F porque su ficha da 404 en las dos
rutas. Las sondas se retiraron tras aplicar el dato; quedan publicadas las ramas
`fuente/fortinet-serie` y `fuente/fortinet-serie-f`.

### Fortinet sí se deja leer: `cps` a 56/58 y alimentación a 6/58 (2026-09-03)

El mismo día en que HPE y Huawei quedaron confirmados como pared de Akamai, Fortinet demostró
ser lo contrario: `.github/workflows/traer-fortinet-psu.yml` pidió cuatro documentos oficiales
desde un ejecutor de Actions y los cuatro respondieron **200 con contenido real**, sin rastro
de bloqueo. Eso convierte en dato verificado lo que esta misma lista tenía como «fragmentos de
búsqueda sin confirmar por lectura directa» — que era la única razón por la que Fortinet iba
0 de 58 en alimentación eléctrica pese a tener las URL ya localizadas.

Leído a mano y transcrito literal, tres modelos:

- **100F** — «the device has two power supplies that can be connected to different power
  sources». `redund: true`. El documento no publica consumo, así que `watts` se queda fuera.
- **7081F** — «up to six hot swappable 200-277V, 16A AC PSUs. The capacity of each PSU is
  2500W», más «You can add extra PSUs to provide redundancy».
- **7121F** — se cambia una fuente en caliente «as long as four PSUs are connected to power
  and operating normally».

**Un detalle que valía la lectura**: los 2.500 W del 7081F son la *capacidad de cada fuente*,
no el consumo del equipo — y `ficha.js` rotula `psu.watts` como «Consumo típico». Meterlos ahí
habría producido una cifra falsa con apariencia perfectamente correcta, en la pantalla que
alguien enseña a un cliente. Van en el texto, que es donde se puede decir qué miden.

**Y una corrección**: la tabla de pistas atribuía a los 60F/90G/91G un artículo que, leído de
verdad, trata de las series 100/101E y 200/201E — modelos que ni siquiera están en este
catálogo. Cita mal asignada, retirada. Del «hasta 8 fuentes» del 7121F tampoco hay rastro en
el documento citado, así que no se registró el número máximo.

**Y de paso cayó el pendiente 2 casi entero.** Los 5 modelos sin `cps` no estaban en el
Product Matrix, pero sí en las fichas por serie: `traer-fortinet-datasheets.yml` bajó las de
400F y 600F (URL confirmadas por búsqueda) y ahí estaba «New Sessions/Second (TCP)» — 500.000
para 400F/401F y 550.000 para el 600F. Pasaron por `npm run cps` sin un solo rechazo, con
`sess` (7,8 M y 8 M), `ips`, `ngfw`, `tp` y `vpn` casando todos. **53 → 56 de 58.**

Las URL de 100F y 200F se probaron siguiendo el patrón del sitio y devolvieron **404** — y eso
es exactamente lo que el workflow marcaba como «no confirmada»: se reportó y no se guardó nada,
en vez de dar por bueno un HTML con extensión `.pdf`. Esos dos siguen en `null`.

Esas mismas fichas traían la tabla «Dimensions and Power» completa, así que la alimentación
subió a 6 de 58: 400F (154,8 W medios, doble fuente AC 1+1), 401F (161,1 W, algo más por el
SSD) y 600F (169 W, dos fuentes de serie). Aquí `watts` **sí** es consumo — el documento
publica «AC Power Consumption (Average)», que es justo lo que la ficha rotula.

Los otros 52 modelos siguen en `undefined` («el catálogo no lo dice»), nunca en `false`.

Las dos sondas (`traer-fortinet-psu.yml` y `traer-fortinet-datasheets.yml`) se retiraron tras
dejar el dato aplicado, igual que las de Huawei y HPE: un workflow que ya cumplió su encargo
es un artefacto inerte, el error que tuvo `CISCO_EOL_MODELS`. **Lo que sí conviene recordar es
el patrón**, porque funciona y es repetible: localizar la URL con `WebSearch` (que sí opera en
este entorno, al revés que `WebFetch`), bajar el documento desde un ejecutor de Actions,
publicarlo en una rama de transporte, leerlo a mano —renderizado, nunca con extractor de
tablas— y aplicarlo con el importador que contrasta. Quedan publicadas las ramas
`fuente/fortinet-psu` y `fuente/fortinet-datasheets`; el proxy git de este entorno no deja
borrar ramas remotas.

### HPE también es Akamai, y Firecrawl no es la salida (2026-09-03)

Dos intentos de abrir por fin las fuentes de HPE, los dos cerrados con una medición en vez de
una suposición. Vale la pena leerlos antes de reintentar cualquiera de las dos vías.

**1. Firecrawl, descartado por política de egreso.** Se instaló su servidor MCP creyendo que
sus servidores leerían por nosotros lo que este entorno no alcanza. Falla — y no por la clave
(verificada: 35 caracteres, prefijo correcto, sin espacios, y no es la que se filtró) ni por
HPE. El servidor MCP corre **dentro** de este sandbox (`npx firecrawl-mcp`), así que sus
llamadas salen por el mismo proxy, que deniega el dominio de Firecrawl. Lo delató una URL de
control: `example.com` falló idéntico. El propio proxy lo confirma —
`connect_rejected · gateway answered 403 to CONNECT · api.firecrawl.dev:443` — y
`mcp.firecrawl.dev` y `firecrawl.dev` están igual. La configuración se queda en `.mcp.json`
(sin clave, solo `${FIRECRAWL_API_KEY}`) porque **sí sirve desde una máquina fuera de este
proxy**; desde aquí, no.

**2. `buy.hpe.com`, denegado por el propio HPE.** Se pidió desde un ejecutor de GitHub
Actions —que no pasa por el proxy de esta sesión, y que ya trajo Fortinet y Juniper sin
problema— con cabeceras de navegador completas. Respondió **403 con un "Access Denied" de
Akamai**, con `errors.edgesuite.net` en el cuerpo: la misma pared que Huawei, no un límite de
ritmo. Eso reencuadra el pendiente 3 entero — los 403/timeout que `npm run datasheets` ve
desde cualquier máquina no son mala suerte ni ráfaga excesiva, son esta misma defensa. No se
intentó nada para evadirla (ni el modo *stealth* de Firecrawl, que existe justo para eso):
es una decisión deliberada del fabricante, categoría distinta de un 403 de política de egreso,
y aquí se reporta, no se rodea.

La sonda (`traer-hpe-routers.yml`) se retiró tras dejar el hallazgo escrito, igual que las
tres de Huawei: un workflow que ya sabe que nunca va a producir dato es un artefacto inerte,
el mismo error que tuvo `CISCO_EOL_MODELS`. Quedó publicada la rama `fuente/hpe-routers` con
la respuesta de Akamai — el proxy git de este entorno no deja borrar ramas remotas, así que
se borra desde GitHub o desde una máquina con acceso.

### Pendiente 4, parcial: confirmación externa de que el sitio en vivo responde (2026-09-02)

El bloqueo documentado (`presales.up.railway.app` no se puede pedir desde este entorno de
edición) seguía siendo cierto la primera vez que se probó de nuevo:

```
curl https://presales.up.railway.app/salud
curl: (56) CONNECT tunnel failed, response 403
```

Mismo patrón que ya cerró varios pendientes de datos este mismo día: los ejecutores de GitHub
Actions no pasan por ese proxy. `.github/workflows/sonda-produccion.yml` pide `/salud` y
`/login` —las dos únicas rutas públicas, sin sesión— desde ahí. Primera corrida:

```json
[
  { "ruta": "/salud", "status": 200, "bytes": 41, "cuerpo": "{\"ok\":true,\"fabricantes\":7,\"modelos\":224}" },
  { "ruta": "/login", "status": 200, "bytes": 4230 }
]
```

Es una confirmación **distinta** a la que ya daba la API de Railway (que solo dice que el
contenedor arrancó): esta viene de pedirle el dominio público de verdad desde fuera, con DNS,
TLS y el edge de Railway de por medio. **No inicia sesión a propósito** — eso exigiría la
contraseña real de producción, que este workflow no tiene ni debe tener — así que confirma que
el sitio está vivo, no que cada pantalla funcione. Revisar la pantalla tocada tras un deploy
sigue siendo de una persona, exactamente como ya decía este pendiente.

### Dimensionador Nokia — pendiente 6, primera entrega: fabric 7220 IXR (2026-09-02)

Primera entrega del pendiente que el propio registro marcaba como «la pieza más grande de
esta lista»: un motor de sizing **distinto** al de los otros seis fabricantes, porque un
fabric de datacenter no se resuelve con «un equipo cumple un requerimiento» — se resuelve con
un LEAF y un SPINE, cada uno con su cantidad.

**Alcance, recortado a propósito**: de los 18 modelos Nokia del portal, esta entrega cubre los
4 de la línea **7220 IXR** (D1/D2L/D3L/D5) — la única con puertos de una sola velocidad, sin
modos de breakout, y que Nokia posiciona sin ambigüedad como fabric de datacenter (acceso,
leaf, spine). Los 14 restantes (7250 IXR de agregación/edge, 7750 SR de core IP-MPLS) se
dimensionan por capacidad y densidad de puertos de un único equipo — el motor de los otros
seis fabricantes, no el de fabric — y quedan como fase 2, documentados, no silenciados.

**El motor**: un diseño Clos de dos capas en malla completa (cada leaf conecta un puerto a
*cada* spine, para ECMP). A partir de servidores a conectar, velocidad de acceso y
sobresuscripción deseada: puertos de acceso necesarios → leafs necesarios → uplinks por leaf
→ spines necesarios (= uplinks por leaf) → spine con puertos suficientes para todos los
leafs. El D3L («Leaf / Spine compacto», puertos uniformes que sirven para lo uno o lo otro)
necesitó una segunda rama del motor: reparte su propio pool de puertos entre acceso y subida
en vez de sumar dos grupos separados.

Un caso queda deliberadamente sin resultado: acceso a 1 GbE (D1) no tiene con qué spine
conectar dentro de esta línea — sus uplinks son de 10 GbE y ningún otro modelo de la 7220 IXR
tiene puertos de spine a esa velocidad. Se reporta el hueco, no se inventa un intermedio.

Archivos nuevos: `legacyData/nokia.js` (los 4 modelos, puertos estructurados a partir del
mismo texto ya verificado en `indexPR.js`, sin inventar ni corregir ningún dato — solo
estructurado), `dimensionador-nokia-7220ixr.html`/`.js` (no reutiliza `js/ficha.js`, que
asume un único equipo elegible; sí reutiliza `js/bom.js` y `js/estado.js`). Verificado con el
servidor real en `NODE_ENV=production` y Chromium: tres escenarios (25 GbE, 100 GbE, 1 GbE
sin diseño posible), enlace desde el portal, pestaña BOM con 2 líneas. 129 pruebas.

### Investigado el pendiente 3 (Aruba): ejecutado por primera vez, y no se completó (2026-09-02)

Primera corrida real de `datasheets-aruba.yml`, que llevaba desde agosto marcado «resuelto vía
Actions» sin haberse disparado nunca — la marca era una expectativa razonable por el patrón
que sí funcionó con Fortinet, no una medición. Al correrlo de verdad:

- **HPE bloqueó la mayoría del lote**: de 24 documentos, 9 devolvieron 403, 12 agotaron el
  tiempo de espera y 2 resultaron ser páginas de aterrizaje en vez de un PDF directo. Solo
  **1 PDF** (`sd-wan-ordering-guide.pdf`, 123 KB) se descargó limpio. El vigía había leído sin
  problema la página de HPE que `FUENTES.aruba` registra — pero esa es una sola petición; pedir
  24 documentos distintos de HPE en la misma corrida topó con límites que una petición sola no
  revela. Bloqueo real del lado de HPE, no de este entorno.
- **Y aparte, el paso de abrir el PR falló por un motivo independiente**: este repositorio
  tiene desactivado el permiso de GitHub «Allow GitHub Actions to create pull requests»
  (Settings → Actions → General → Workflow permissions). No es algo que el workflow pueda
  resolver solo, y no se intentó rodear activando nada por cuenta propia — es una decisión de
  configuración del repositorio, no de este workflow.

La rama `datasheets/aruba` quedó publicada con el único PDF descargado; no vale la pena un PR
para un solo documento de bajo valor, así que no se abrió a mano. `PENDIENTES.md` deja de
marcar el pendiente 3 como resuelto — el importador está listo, el hallazgo de HPE bloqueando
un lote grande es nuevo y queda documentado, y sigue haciendo falta una persona con navegador
real, igual que Huawei.

### Pendiente 5 (Juniper SRX): la matriz oficial corrigió datos que la reconstrucción por búsqueda había adivinado mal (2026-09-02)

Mismo patrón que cerró el pendiente 2 de Fortinet: `.github/workflows/traer-juniper-matrix.yml`
trajo la «SRX Series and vSRX Performance and Features Matrix» a la rama de transporte
`fuente/juniper-srx-matrix` (los ejecutores de GitHub Actions no pasan por el proxy que
responde 403 a `juniper.net` en este entorno). El documento resultó ser de **agosto de 2020**
(pie de página «1000265-021-EN Aug 2020») — la fecha «2026-08» que llevaba el registro en
`FUENTES.juniper` era una suposición de cuando no se podía leer el documento, no una medición;
corregida.

Con el documento real en mano, la reconstrucción por búsqueda que llevaba meses en el catálogo
resultó acertada en unos campos y **equivocada en otros** — una serie internamente coherente
no garantiza ser la serie correcta, solo que es plausible:

- `fw`/`vpn`/`ips` de la línea SRX300 (300/320/340/345) ya estaban bien.
- `fwImix` de esa misma línea **no**: corregido de 600/600/1.100/1.500 a los 500/500/1.000/1.700
  Mbps reales, anclado por los tres campos anteriores ya coincidentes.
- El SRX1500 —documentado hasta hoy como «el único modelo con la fila completa»— tenía `vpn` y
  `sess` equivocados: 3.000 Mbps / 512.000 sesiones reconstruidos frente a los 1.300 Mbps /
  2.000.000 reales, anclados por `fw`/`fwImix`/`ips`/`atp` ya coincidentes.
- `sess` y `cps` de la línea SRX300 completa más el SRX1500 no existían en ninguna
  reconstrucción previa: los trae el documento y se aplicaron sin conflicto.

**El SRX380 queda a propósito sin tocar** en `fw`/`fwImix`/`vpn`: el documento también trae su
fila (10/4/3,5 Gbps, no los 20/6,5/4,4 ya guardados) pero de esos campos solo `ips` coincide —
un único anclaje, por debajo del doble que este catálogo exige antes de pisar un dato
existente. Corregirlo exigiría `--sin-contraste` bajo responsabilidad de quien decide, así que
queda documentado —en la cabecera de `juniper.js` y junto al modelo— para resolverse a
propósito en vez de colarse sin que nadie lo note.

Se intentó además traer las fichas individuales por modelo que la propia matriz enlaza (p.3,
SRX300 y SRX1500) para contrastar con una segunda fuente, pero sus URL de 2020 ya no resuelven
a un PDF (Juniper reorganizó su sitio desde entonces) — no se agregan a `FUENTES` sin una URL
vigente confirmada. 17 valores escritos con `npm run juniper -- --force` (nunca menos de 2
anclas por fila), verificado con el servidor real en `NODE_ENV=production` y Chromium contra
`/api/dimensionador/juniper`. 129 pruebas.

### Investigado el pendiente 14 (Huawei): no se cierra vía Actions, y ahora se sabe por qué (2026-09-02)

Tras cerrar el 2 y el 3 con el mismo truco (bajar el documento desde un ejecutor de GitHub
Actions, que no pasa por el proxy de este entorno), tocaba probar si Huawei se cerraba igual.
No se cierra, y la investigación deja documentado un motivo distinto y más duro que un 403 de
proxy — importa saberlo antes de que alguien reintente la misma vía.

Tres sondas sucesivas, cada una construida sobre lo que dejó la anterior:

1. **Alcance de red**: `e.huawei.com`, `support.huawei.com` e `info.support.huawei.com`
   responden **200** desde un ejecutor de Actions. La red sí llega, igual que a Fortinet.
2. **Contenido del HTML crudo**: un `fetch()` normal a `e.huawei.com` y `support.huawei.com`
   solo trae el cascarón vacío de una aplicación Vue/Nuxt (`<div id="__nuxt"></div>` sin nada
   dentro) — el catálogo real se carga por JavaScript después de arrancar, así que ni con red
   ni sin bloqueo hay dato que leer sin ejecutar ese JS.
3. **Navegador real (Playwright + Chromium)**: al renderizar de verdad, `e.huawei.com` y
   `support.huawei.com` devuelven un **"Access Denied" de Akamai** — el borde del propio
   Huawei bloqueando la huella de un navegador automatizado, no el proxy de este entorno ni
   una política de egreso. `info.support.huawei.com` sí renderiza, pero resultó ser el
   glosario de términos de Info-Finder (AAA, ACL, Antivirus…), no una base de ciclo de vida
   por modelo, y su propio texto confirma el login: *"Log in to obtain more information."*

No se intentó nada para evadir el bloqueo de Akamai (huellas de navegador falsas, proxies
residenciales, credenciales de Huawei): es una defensa deliberada del fabricante contra
automatización, categoría distinta de un 403 de política de egreso que sí es razonable
recorrer con Actions. Se reporta, no se rodea — el mismo principio que ya rige los 403 de este
entorno, aplicado también al borde de Huawei.

**Conclusión para quien retome el pendiente 14**: `npm run huawei` sigue siendo la herramienta
correcta y está lista; lo que falta es que una persona con navegador real (y sesión de Huawei
si hace falta el detalle de Info-Finder) copie las cifras a un CSV/XLSX, igual que antes de
esta investigación. Los tres workflows de sonda (`sonda-huawei.yml`, `explorar-huawei.yml`,
`renderizar-huawei.yml`) se retiraron tras dejar su hallazgo documentado aquí: dejarlos vivos
sin ningún dato que produzcan sería el mismo error que ya tuvo `CISCO_EOL_MODELS` de
`seedCatalog.js` — un artefacto inerte que no dice nada.

### `cps` de FortiGate: de 21 a 53 de 58 modelos (2026-09-02)

Pendiente 2, cerrado con el mismo hallazgo que ya había cerrado el 3 (los ejecutores de
GitHub Actions llegan a `fortinet.com` aunque este entorno no): `.github/workflows/
traer-fortinet-matrix.yml` bajó el Product Matrix real y lo publicó en la rama de transporte
`fuente/fortinet-product-matrix` — nunca `main` ni un PR, porque el PDF no es un activo de la
aplicación, solo material de trabajo que se trae con `git fetch` y se descarta después de
transcribirlo.

El documento se leyó página por página en su versión renderizada, nunca con un extractor
automático de tablas — es exactamente el mecanismo que este catálogo ya sufrió una vez (fila
desplazada = número plausible de otro equipo). Los 32 valores transcritos a un CSV pasaron
por `npm run cps`, que los contrastó contra el `sess` ya verificado del catálogo: pasaron los
32, sin un solo rechazo, lo que confirma que la lectura no se desplazó de fila. Donde el
documento publica un segundo valor con licencia Hyperscale (nota⁶: 2600F, 3000F/G, 3500F/G,
3800G, 4200F, 4400F, 4800F), se transcribió siempre el valor base.

Quedan 5 modelos en `null` (100F, 200F, 400F, 401F, 600F): no es un bloqueo de acceso, es que
el Product Matrix es un "Top Selling Models Matrix" — un subconjunto curado — y esos SKUs no
están en ninguna de sus páginas. Verificado con el servidor real en `NODE_ENV=production` (API
sirviendo los `cps` nuevos, sibling de SSD propagando en vivo, los 5 restantes en `null`,
dimensionador cargando sin errores en Chromium) antes de desplegar. 129 pruebas.

### El nombre de usuario ya no distingue mayúsculas ni espacios alrededor (2026-09-02)

Punto 13, cerrado a petición del dueño del repo tras el alta de usuarios: con cuentas
creadas por un administrador, la mayúscula que use quien las crea y la que use quien entra
ya no tenían por qué coincidir, y eso lo volvía un problema real y no solo áspero.

`usuarios.normalizarUsuario(s)` — minúsculas, recortado por los bordes, nunca el espacio
interior — es ahora la forma canónica: `mismoUsuario()` (el login) normaliza los dos lados
antes de comparar, y `crear()` guarda el usuario ya normalizado y comprueba duplicados sobre
esa misma forma, así que «JMartinez» y «jmartinez» son la misma cuenta tanto para entrar como
para darse de alta. El campo `nombre` (el que se muestra) no se toca: conserva la
capitalización tal como se escribió, porque nunca se usa para autenticar. No hay migración
de datos — el único usuario ya existente (`presales`) ya estaba en minúsculas.

6 pruebas nuevas o reescritas, incluida la que antes fijaba a propósito el comportamiento
contrario: ahora fija el nuevo, con el mismo espíritu de que un cambio de autenticación sea
deliberado y quede escrito.

### Fases 2 y 3 del plan de sincronismo: el catálogo dice de dónde sale y avisa cuando cambia (2026-09-02)

**El problema medido**: el catálogo se verifica contra documentos que los fabricantes
actualizan sin avisar, y esa procedencia vivía en comentarios de cabecera — invisible para la
aplicación, para cualquier comprobación automática y para quien está a punto de citar una
cifra delante de un cliente.

- **`legacyData/fuentes.js`** estructura esa información transcrita de cada cabecera, sin
  inventar nada. Donde la cabecera no da fecha (MikroTik y Aruba), queda en `null` y se
  declara: **una fuente sin fecha no es una fuente reciente**, el mismo tercer estado que
  protege `redund`. Se proyecta en `/api/fuentes`, el portal la pinta por fabricante y el
  arranque avisa de lo que pasa de seis meses o no tiene fecha.
- **`npm run catalogo`** generaliza a los seis catálogos lo que solo hacían `cps --check` y
  `juniper --check`. Los precios se cuentan sobre `cotizadorCatalog.js`: contarlos sobre los
  `MODELS` daba «Fortinet 0/58 sin cotizar» justo del único fabricante con lista firmada.
- **La IA propone con esquema y `npm run propuesta` aplica con anclaje.** La respuesta salía
  de una expresión regular sobre texto libre; ahora va con `output_config.format`. Y el
  importador escribe sobre `legacyData/` para que lo revisable sea un diff de git, aceptando
  solo lo que ancla: *si la IA se equivoca sobre lo que el catálogo dice hoy, no hay razón
  para creerle lo que dice que debería decir*. Las altas se reportan, nunca se aplican solas.
- **`npm run huawei`** cierra el pendiente 14 por el lado de la herramienta, con modo `--eol`
  para cargar los boletines con su fecha real.
- **`npm run vigia`** compara el SHA-256 de cada fuente y el workflow semanal abre un issue
  cuando algo cambia o no se pudo leer. **Un documento inalcanzable no es un documento sin
  cambios**, y el informe los distingue.

De 76 pruebas a 113.

### Alta de usuarios: la contraseña la genera el servidor, el primer acceso queda encerrado (2026-09-02)

Petición del dueño del repo. La decisión que quedaba abierta era cómo llega la primera
contraseña a la persona nueva; se resolvió con la primera opción que el propio pendiente ya
apuntaba: **el servidor la genera y la muestra una sola vez**, en vez de un enlace de alta
con caducidad (más superficie: página nueva, tokens, expiración, y nada que este catálogo ya
necesitara para otra cosa).

- **`usuarios.crear({ usuario, nombre, rol })`** valida (usuario 3-60 caracteres sin espacios
  ni control, nombre no vacío, rol conocido, sin duplicados exactos — sin tocar la
  normalización, que sigue siendo el punto 13 aparte), genera una contraseña de 24 caracteres
  en un alfabeto sin `0/O/1/l/I` (se puede leer en voz alta sin ambigüedad) y devuelve
  `{ usuario, passwordTemporal }`. La cuenta nace con `debeCambiar: true`.
- **`debeCambiar` no es un aviso, es un candado.** A diferencia de `desdeSemilla` (blando: el
  admin migrado puede seguir trabajando con la contraseña compartida), un middleware nuevo en
  `server.js` —justo detrás del muro de sesión, antes de `exige()`— bloquea cualquier
  pantalla que no sea `/cuenta` mientras `debeCambiar` siga en `true`: 403 explicando por qué
  en la API, redirect a `/cuenta?m=forzado` en la navegación. `cambiarPassword()` lo libera
  en el mismo momento en que ya libera `desdeSemilla`.
- **El panel `/usuarios`** tiene el formulario de alta, el revelado de la clave con botón de
  copiar (con reserva seleccionable por si el portapapeles falla), y una insignia «cambio
  pendiente» en la lista para las cuentas que aún no completaron su primer acceso.

Verificado de extremo a extremo en Chromium contra un servidor con `NODE_ENV=production`:
alta de un usuario, cierre de sesión, entrada con la clave temporal, intento de llegar al
portal rebotado a `/cuenta`, cambio de clave, y segunda entrada con acceso normal — sin un
solo error de consola propio de la app. 14 pruebas nuevas de `usuarios.crear()` más 2 de
extremo a extremo, 127 en total.

### `omniroute` fuera: tenía la producción parada desde el 1 de septiembre (2026-09-02)

Retirado con autorización expresa del dueño del repo, que fue quien lo había añadido. El
commit `187a4dd` («Instalar Skill omniroute en presales») metió `omniroute: ^1.0.0` en
`package.json` y **tumbó dos despliegues seguidos, por dos causas distintas**:

- `e7192063` (1-sep): entró sin tocar `package-lock.json`, y `npm ci` falla cerrado cuando
  los dos no coinciden. Murió en `BUILD_IMAGE`.
- `d7d0c445` (2-sep), ya con el lockfile sincronizado: `npm install` murió con **código 139,
  una segmentation fault**, dentro del `postinstall` del propio paquete, al recompilar
  `better-sqlite3` para linux-x64. Eso no se arregla desde este repositorio.

Durante esos dos días producción siguió sirviendo el contenedor del 28 de agosto y **ningún
cambio podía desplegarse**. Nadie se enteró hasta el día siguiente, que es justamente el
agujero que cierra la Fase 1.

Nada del repositorio lo importaba (`grep -rn omniroute` solo lo encontraba en
`package.json`). Al quitarlo el árbol vuelve de 560 a 283 paquetes, `npm audit` de 5 avisos
moderados a 2, y los paquetes con script de instalación de 6 a 2 (`sqlite3` y `fsevents`,
que en Linux no hace nada).

**Lo que conviene recordar**: el `omniroute` de npm no es una skill de Claude Code. Las
skills son carpetas con un `SKILL.md` dentro de `.claude/skills/` y no tocan `package.json`,
así que no pueden romper un despliegue. El paquete de npm con ese nombre es otra cosa —
«Unified AI router with 352 providers, desktop, PWA», una aplicación Next.js/Electron de un
tercero (`diegosouza.pw`)—, y muy probablemente no era lo que se buscaba.

### Fase 1 del plan de sincronismo: el ciclo de despliegue se cierra solo (2026-09-02)

Hasta ahora, entre `git push` y producción no había ninguna comprobación: Railway construía
cada push a `main` aunque las pruebas fallaran, y el servicio no tenía healthcheck, así que
un contenedor que muriera al arrancar sustituía al que funcionaba. La prueba de que eso no
era teórico la dio el propio repositorio dos días antes: el despliegue del 1 de septiembre
murió en `BUILD_IMAGE` y nadie se enteró hasta el día siguiente.

- **`.github/workflows/verificar.yml`** corre en cada push y cada PR: `npm ci`, lint, las 85
  pruebas, y un arranque de verdad con `NODE_ENV=production` que exige ver `[seed]`, la línea
  de `listen` y un `/salud` que responda `ok`. La auditoría de dependencias va informativa,
  no bloqueante: la Fase 0 dejó el árbol en avisos que hoy no se pueden cerrar sin saltar a
  Sequelize 7, y bloquear por eso pararía cada push por algo que no tiene arreglo todavía.
- **Railway espera a esas comprobaciones** (`checkSuites`) y usa **`/salud`** como
  `healthcheckPath`. La ruta es pública a propósito —el healthcheck no tiene sesión, y detrás
  del muro recibiría un 302 que Railway leería como «sano»— y cuenta el catálogo en vez de
  devolver un `{ok:true}` fijo, que estaría igual de verde con la base sin sembrar. Devuelve
  503 si la base está vacía o no responde, que es lo que retira el contenedor del balanceo.
- **Dependabot** abre PR semanales de parches y menores, agrupados, que pasan por el mismo
  workflow. Las mayores se revisan a mano: en este repositorio ya costaron caro dos de ellas.

### Fase 0 del plan de sincronismo: la sincronización dejaba de fallar abierta (2026-09-02)

Tres defensas que parecían serlo y no lo eran, encontradas al auditar el módulo de
sincronización con `insecure-defaults` y `vibesec` antes de tocar nada:

- **El permiso `sync` no se exigía en ninguna ruta.** Estaba en `ROLES` desde que hubo roles
  y `grep exige('sync')` devolvía cero. Ahora va delante del router de `/api/sync/*`, y al
  montarlo apareció un segundo fallo: `exige` miraba `req.path`, que Express recorta al
  prefijo de montaje, así que en vez del 403 la API redirigía al portal y el navegador veía
  un 200. Lo cazó la prueba nueva que arranca el servidor real.
- **Sin `ANTHROPIC_API_KEY` el servicio devolvía propuestas inventadas** con apariencia
  legítima — un «FortiGate 9000F» con precio. Retirado; ahora responde 503 explicando que
  falta la clave, el mismo fallo cerrado que aplica `AUTH_PASSWORD`.
- **El tipo del adjunto se tomaba del mimetype que declara el navegador.** Ahora lo decide
  la firma del contenido (`services/firmaArchivo.js`), con el mismo criterio que
  `descargar-datasheets.js` ya aplicaba a lo que baja; lo que no es PDF, XLSX ni texto recibe
  415.

Dependencias: `xlsx` pasa al espejo mantenido `@e965/xlsx` 0.20.3 (el de npm quedó
abandonado con una vulnerabilidad alta sin arreglo; mismo `dist/xlsx.full.min.js`, verificado
exportando un BOM a Excel en Chromium), `cors` fuera de `package.json` (nadie lo requería) y
`sqlite3` a la 6, que dejó de arrastrar la cadena de build con el `tar` crítico. `npm audit`
pasa de 10 avisos a 2 moderados (`sequelize` por `uuid`, sin arreglo sin saltar a Sequelize
7). Ocho pruebas nuevas, 84 en total.

### Alimentación eléctrica en la ficha: doble fuente y sus características (2026-08-28)

Petición del dueño del repo. Antes de escribir código se auditaron los seis catálogos
buscando qué dato eléctrico ya existía —y apareció uno que no se sabía que estaba: Cisco ya
traía `redund: true/false` al 100 % de sus 21 modelos, mostrado dentro de «Características
del equipo». Los otros cinco fabricantes no tenían nada estructurado, pero sí frases sueltas
ya publicadas («fuentes 1+1 · 205.8 W típicos», «doble fuente 350 W», «PSU y almacenamiento
redundantes») escondidas en el campo `ports`/`ifaces` de texto libre.

**La regla que sostiene todo esto**: `redund` es de tres estados, no dos. `true` y `false` son
hechos verificados (Cisco los tiene los 21); `undefined` es «el catálogo no lo dice», y
tratarlo como `false` habría inventado un dato negativo — exactamente lo que este catálogo
evita en todo lo demás. `FICHA.seccionAlimentacion(m)` en `ficha.js` centraliza esa distinción
una sola vez para las seis páginas, en vez de que cada una la reimplemente con su propio
riesgo de leer `undefined` como «no».

Se transcribieron a `redund`/`psu` estructurados los datos que el catálogo ya tenía publicados
en prosa — nunca se dedujo nada del tamaño o la gama del equipo. Cobertura resultante: Cisco
21/21 (ya existía), Huawei 17/40 (serie NE8000 y AR8140, con vatios), MikroTik 3/15, Aruba
2/21, Juniper 1/12 SRX, Fortinet 0/58 — el Product Matrix no publica esta cifra. El hueco
restante queda como pendiente 15, con la aclaración de que no es un simple bloqueo de egreso:
ninguna de las fuentes que este catálogo ya usa trae consumo eléctrico por modelo.

Verificado: 8 pruebas nuevas en `test/ficha-alimentacion.test.js` (76 en total), conducido en
Chromium contra un servidor con `NODE_ENV=production` en las seis páginas — sección presente,
sin fila duplicada en Cisco, sin errores de consola, y el aviso «el catálogo no lo especifica»
en vez de un «No» falso donde el dato no existe.

### El dimensionador de Fortinet mostraba siempre el mismo equipo (2026-08-27)

Reportado por el dueño del repo y **reproducido en el navegador antes de tocar nada**. Eran
dos defectos distintos y solo uno estaba en la página de Fortinet.

**El trinquete de la selección** (`public/js/ficha.js`, las seis páginas a la vez). La regla
era «conservar la selección mientras ese equipo siga cumpliendo». Como cumplir es
capacidad ≥ requerimiento, un equipo grande cumple para *todo* requerimiento menor: se
elegía un 7121F a 20 Gbps, se bajaba a 50 Mbps y seguía el 7121F con el 30G como
recomendado. La selección solo subía. Lo grave no era la elección manual sino que no se
distinguía de la **heredada** —la que el propio módulo había dejado en el render anterior—,
así que el recomendado solo salía en el primer render de la página: en un barrido limpio de
caudal el equipo ya aparecía desalineado en la primera lectura. Corregido distinguiendo
deliberada de heredada; lo heredado sigue siempre al recomendado, lo deliberado se marca en
pantalla y tiene botón «Volver al recomendado».

**El BOM no avisaba de quedarse descolgado.** Con un caudal que ningún modelo cubre, el
veredicto decía «Sin candidato» y la pestaña de BOM conservaba intacta la cotización del
último equipo que sí cumplía — exportable a Excel sin ninguna señal. No se vacía, porque ahí
se puede querer cotizar cualquier equipo a mano, pero ahora declara el desajuste. Igual
cuando el modelo cotizado no es el elegido en el dimensionamiento.

**El motor NO estaba mal, y conviene que quede escrito.** Se comprobó eje por eje con cargas
limpias: 100 usuarios x 3 Mbps no mueven un requerimiento de 500 Mbps, pero 2.000 usuarios lo
llevan de 650 Mbps a 7,8 Gbps; el perfil IoT (20.000 dispositivos a 0,05 Mbps con 100
sesiones) hace que mande la tabla de sesiones, exactamente como predicen los comentarios del
código; y bajar la vida media de sesión a 2 s multiplica por 15 las sesiones nuevas por
segundo. La relación entre ancho de banda, usuarios, sesiones y cps estaba bien modelada —
lo que la ocultaba era que el equipo mostrado no cambiaba.

También se quitó un doble render del BOM por cada pulsación de tecla (se sincronizaba una vez
con el recomendado y acto seguido con el elegido). Siete pruebas nuevas en
`test/ficha-seleccion.test.js` fijan la regla: 66 casos en total.



- **Limpieza de agosto de 2026: cuatro puntos cerrados, y tres fallos reales que aparecieron
  al cerrarlos.** La limpieza en sí era cosmética; lo que valió fue lo que destapó.
  - **El dimensionador Huawei ya no se llama `-v3_1`.** Es `dimensionador-huawei-netengine`,
    y la ruta vieja **redirige conservando el querystring** — sin eso, un enlace compartido
    habría llegado a la página correcta con los parámetros por defecto, que es peor que un
    404 porque no se nota. La clave de `localStorage` conserva el nombre viejo a propósito:
    es la identidad bajo la que la gente ya tiene escenarios guardados.
  - **`CISCO_EOL_MODELS` fuera, y el mecanismo ahora avisa.** Listaba la serie ISR 4000 que
    la Fase 2 había retirado: llevaba meses sin marcar nada y nadie se enteró, porque un
    conjunto inerte se comporta igual que uno que funciona. `seedDimensionadorModels` avisa
    cuando una entrada no casa con ningún modelo. La razón que lo mantenía vivo («volvería a
    aplicar vía `cotizadorCatalog`») era además falsa: esa ruta no consulta estos conjuntos.
  - **`npm run verificar`: lint y 59 pruebas, sin dependencias nuevas salvo ESLint.** Las
    pruebas cubren lo que ya falló —la migración de usuarios que se rehacía en cada lectura e
    invalidaba la sesión recién creada, la regla única de fin de venta, el orden de columnas,
    el casado de nombres entre catálogos, el parser del importador Juniper— y la coherencia
    del catálogo (IMIX nunca por encima de paquetes grandes, ATP nunca por encima de IPS,
    ningún precio inventado donde no hay lista). El lint no es un manual de estilo: cada
    regla corresponde a un fallo que este repo tuvo (`no-undef` habría cazado el
    `BOM is not defined`; `no-use-before-define`, el TDZ de `capDe`).
  - **La tabla de skills de `CLAUDE.md` decía 8 y había 27**, y dos de ellas
    (`data-viz-charts`, `web-page-builder`) describían el stack de `chikisdtv` —React, Vite,
    Tailwind, Recharts— que aquí no existe. Una skill que miente sobre el stack se dispara
    sola y empuja el trabajo hacia una arquitectura que este proyecto no tiene: retiradas.

  **Los tres fallos que destapó**, ninguno visible mirando el código:
  1. **El cotizador Cisco descartaba en silencio un campo del formulario.** «Módulos NIM
     adicionales a cotizar» se leía, disparaba el repintado y no llegaba al BOM: escribías 3
     y salía sin ellos. Lo marcó el linter como variable sin usar. Ahora sale una línea con
     la cantidad, **sin SKU y sin precio** —el catálogo trae el número de slots, no una lista
     de NIM por modelo— porque inventar una referencia es lo que este catálogo tiene prohibido.
  2. **El orden por columna se equivocaba con los miles repetidos.** `1,400,000` se leía como
     1.400: el patrón capturaba un solo grupo de miles. Tres órdenes de magnitud y hacia
     abajo, así que el equipo más grande de una tabla aparecía entre los más pequeños, y la
     celda se veía perfectamente bien. Lo encontró una prueba.
  3. **Cinco páginas tenían una rama muerta de exportación a CSV**, escondida tras un
     `typeof exportCSV === 'function'` que nunca era cierto desde que `js/bom.js` centralizó
     la exportación a Excel. Y el diagrama de la guía tenía una clave duplicada
     (`{f:'hub',f:'hub',...}`) que silenciosamente descartaba una de las dos.

- **`npm run juniper`: el importador de la matriz SRX ya existe** (`scripts/importar-juniper.js`).
  Completar el catálogo Juniper era transcribir 96 números a mano, que es exactamente donde se
  cuela una fila desplazada: una cifra suelta siempre parece plausible, el resto de su fila no.
  El importador acepta CSV/TSV/XLSX, reconoce las columnas por su cabecera, resuelve Gbps
  frente a Mbps sin que nadie multiplique por mil a ojo, y **solo se cree una fila si al menos
  dos de sus columnas casan con lo que el catálogo ya trae verificado y ninguna lo contradice**.
  Con ese doble anclaje, las casillas en `null` de esa misma fila se pueden dar por buenas.
  Probado extremo a extremo: fila desplazada rechazada con el motivo, unidades deducidas del
  propio contraste, escritura sobre el catálogo verificada (`--dry`, `--force`,
  `--force-partial`, `--sin-contraste`) y el parser de números con 13 casos. Los cuatro
  modelos que hoy solo tienen `fw` no llegan al anclaje y se apartan a propósito. Falta el
  dato, no la herramienta: la matriz sigue bloqueada por `juniper.net`.
- **El router de cliente: medido y descartado, con el problema real arreglado.** El pendiente
  pedía navegación sin recarga. Antes de construirlo se cronometró: una navegación completa
  cuesta **25-95 ms**, así que un router habría ahorrado casi nada a cambio de reescribir las
  ocho páginas (todas declaran `const $` en el ámbito global y colisionarían al compartirlo).
  Lo que sí costaba 12,5 s era la hoja de Google Fonts bloqueando el render. Corregido en
  `js/fuentes.js`: **DOM listo en 31 ms en vez de 12.529**. El router queda descartado por
  medición, no por pereza.
- **El cotizador ya recibe equipos del dimensionador** — botón «Enviar al cotizador» en las
  seis páginas de sizing, con casado tolerante de nombres entre los dos catálogos y aviso
  honesto cuando el equipo no está (normalmente porque está fuera de venta).
- **De documentos sueltos a aplicación** — la aplicación nunca fue estática (servidor, API,
  base de datos, sesión), pero se comportaba como un juego de documentos: recargar perdía el
  trabajo y no había forma de pasarle un dimensionamiento a un compañero. Ahora el escenario
  viaja en la URL y sobrevive a la recarga (`js/estado.js`), el BOM del cotizador se recupera
  con aviso y botón de «empezar una nueva», y las tablas del portal se ordenan por columna
  (`js/tabla.js`). Sin reescritura: se integró con el motor existente en vez de sustituirlo.
- **Dimensionador Juniper** — sexta herramienta de sizing, con dos plataformas separadas:
  SRX por capa de inspección y Session Smart Router para SD-WAN. El principio que la hace
  útil es el mismo que salió de la auditoría FortiGate: la cifra de portada (firewall con
  paquetes grandes) queda fuera de la escala y nunca elige, y un modelo sin cifra en la capa
  efectiva se descarta explicando por qué en vez de colarse con la de otra capa. En el
  SRX380 la diferencia es 20 Gbps de portada frente a 2 con IPS.
- **Usuarios y roles** — el acceso pasa de credencial compartida a identidad: `usuarios.js`
  como almacén, sesión que dice quién es, `exige('permiso')` para autorizar y panel
  `/usuarios`. La migración es automática: el usuario que ya existía es ahora el
  administrador, sin contraseña nueva que comunicar. **Fallo encontrado al construirlo y
  corregido**: la migración generaba el hash con un salt aleatorio en cada lectura, y como la
  clave de firma de la sesión se deriva de ese hash, se podía iniciar sesión y en la petición
  siguiente el servidor la desconocía. Se persiste una sola vez.
- **Arista retirado por completo** — catálogo del portal, cotizador, guía de diseño, página,
  navegación, fabricante en la base y proyecciones. Sin referencias residuales.
- **Juniper de 10 a 22 modelos y Nokia de 8 a 18**, desde datasheets oficiales: línea SRX de
  sucursal con sus cifras de IPsec, generación SRX 2024, Session Smart Router, fabric 7220 IXR
  sobre SR Linux, 7250 IXR-X y 7750 SR-1x.
- **Skills de los repos hermanos instaladas** — 20 skills de `chikisdtv` en `.claude/skills/`,
  con las de seguridad (`vibesec`, `insecure-defaults`, `sharp-edges`, `semgrep`, `codeql`,
  `differential-review`) usadas para revisar y construir el módulo de acceso.
- **Sesiones nuevas por segundo como tercer eje** (`f63dcdf`) y **`npm run cps`** (`2da77c7`).
- **Fuera de venta se muestra pero no se recomienda** (`0074dc2`) — regla única en `ficha.js`,
  con toda la línea ASR 1000 marcada tras encontrarla ofreciéndose como vigente.
- **Plataforma en el dimensionador de Cisco** y **MikroTik en el cotizador y la guía**
  (`6a4d4aa`).
