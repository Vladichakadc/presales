# Pendientes

Registro vivo de lo que falta. **Se lee al empezar y se actualiza al terminar cualquier
tarea**, y su contenido se resume al usuario al cerrar cada entrega — esa es la instrucción
permanente que lo justifica (ver `CLAUDE.md`, sección *Pendientes*).

Última revisión: 2026-09-08.

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
| 3 | **PDFs de datasheets de Aruba.** `public/datasheets/` va vacío a propósito; la página enlaza la URL de HPE mientras no esté el archivo local. **Ejecutado por primera vez el 2026-09-02** (ver *Cerrado recientemente* — «investigado», no «cerrado»): de 24 documentos, HPE devolvió 21 fallos (403 o timeout) al ejecutor de GitHub Actions y solo 1 PDF de bajo valor se descargó — un bloqueo del lado de HPE, distinto del de este entorno. **Ese único PDF (`sd-wan-ordering-guide.pdf`) ya está commiteado** (2026-09-02): se había quedado fuera de git, en un clon suelto, así que producción seguía enlazando la URL de HPE aunque el archivo existiera en disco. Cobertura local real: **1 de 24**; los otros 23 siguen enlazando a HPE. Y aunque hubiera bajado los 24, el paso de abrir el PR falló aparte: este repositorio tiene desactivado el permiso «Allow GitHub Actions to create pull requests» (ajuste de GitHub, no de este workflow). | El workflow (`datasheets-aruba.yml`) está listo y el permiso de PR se activa en un clic (Settings → Actions → General → Workflow permissions), pero incluso con eso resuelto, HPE sigue bloqueando casi todo el lote — hace falta una máquina con navegador real, igual que Huawei. **2026-09-03: se supo por qué** — `buy.hpe.com` devuelve un "Access Denied" de **Akamai** al ejecutor de Actions (ver *Cerrado recientemente*), así que no es límite de ritmo sino la defensa anti-automatización del fabricante. Espaciar las peticiones en `descargar-datasheets.js` la ablanda, no la abre. | HPE bloquea con Akamai (defensa del fabricante, no del proxy de este entorno); el repositorio tampoco permite que Actions abra PRs |
| 14 | **Ciclo de vida y cifras finas del catálogo Huawei.** 40 modelos cargados y ninguno marcado como fuera de venta, mientras Cisco tiene 8; las 17 NetEngine no traen `fwd`, `ipsec` ni `typ` y las 23 AR no traen `mpps`. El motor no inventa: muestra lo que hay. | **El importador ya existe, y desde el 2026-09-04 también la plantilla**: `npm run huawei -- --check` inventaría los huecos y `npm run huawei -- --plantilla` escribe `huawei-specs.csv` y `huawei-eox.csv` ya con los 40 modelos y las cabeceras que el importador reconoce, así que el trabajo en la página se reduce a pegar cifras. Luego `npm run huawei -- huawei-specs.csv --dry` para el ensayo, sin `--dry` para aplicar, y `npm run huawei -- huawei-eox.csv --eol` para el fin de venta. Falta el dato, no la herramienta — **y, a diferencia de Fortinet/Aruba, esta vez no se cierra vía Actions** (ver *Cerrado recientemente*, investigación 2026-09-02): hace falta una persona con navegador real, y sesión de Huawei si hace falta el detalle fino de Info-Finder. | `e.huawei.com`, `support.huawei.com` bloquean el navegador automatizado (Akamai); `info.support.huawei.com` exige sesión |
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
     llamen de otra forma.
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

## Conflictos abiertos entre el catálogo y una ficha oficial (2026-09-03)

**Ninguno de estos se corrigió: pisar un dato existente es decisión del dueño del catálogo,
igual que el SRX380.** Todos salieron de comparar el catálogo contra la ficha oficial por
modelo del propio fabricante, traída vía Actions el 2026-09-03. Se listan con las dos cifras
para que la decisión se tome mirando, no recordando.

**Juniper — cuatro campos, los cuatro fuera de la escala de dimensionamiento.** Es lo que hace
que puedan esperar: `fw` está deliberadamente fuera de `CAPAS`, y `vpnImix` y `cps` no filtran
en la página Juniper (`sess` sí, y ese coincide en los tres modelos).

| Modelo | Campo | Catálogo | Ficha oficial |
|---|---|---|---|
| SRX1600 | `vpnImix` | 5.500 | **8.000** |
| SRX1600 | `cps` | 95.000 | **170.000** |
| SRX2300 | `cps` | 320.000 | **450.000** |
| SRX4300 | `fw` | 90.000 | **98.000** |

**Nokia — seis capacidades, y estas sí dimensionan.** Más serio que lo anterior, y con dos
direcciones distintas de error:

| Modelo | Catálogo | Ficha oficial | Efecto |
|---|---|---|---|
| 7220 IXR-D2L | 4 Tb/s | **2,0 Tb/s** | el catálogo promete el **doble** |
| 7220 IXR-D3L | 6,4 Tb/s | **3,2 Tb/s** | el catálogo promete el **doble** |
| 7750 SR-1s | 1,2 Tb/s | 4,8 Tb/s | sobredimensiona |
| 7750 SR-2s | 4 Tb/s | 9,6 Tb/s | sobredimensiona |
| 7750 SR-7s | 19,2 Tb/s | 108 Tb/s | sobredimensiona |
| 7750 SR-14s | 38,4 Tb/s | 216 Tb/s | sobredimensiona |

Dos cosas que ayudan a decidir:

1. **El caso 7220 es el urgente, aunque parezca el pequeño**, porque es el único que va en la
   dirección peligrosa: el catálogo promete el doble de lo que el equipo hace. Y no hace falta
   creerle a la ficha para verlo — **sumar los puertos del propio catálogo da la razón a la
   ficha**: el D2L son 48×25G + 8×100G = 2.000 Gb/s, y el D3L 32×100G = 3.200. Además el
   catálogo es **incoherente consigo mismo**: el D1 (88 Gb/s) y el D5 (12,8 Tb/s) sí coinciden
   con la suma de sus puertos, solo el D2L y el D3L van al doble. Atenuante: el dimensionador
   de fabric **no usa `cap`** —dimensiona por puertos—, así que hoy esa cifra solo se muestra
   en el portal y en el comparador.
2. **El caso 7750 SR-s es ambiguo de verdad y por eso no se tocó.** Esa ficha publica *tres*
   métricas distintas de capacidad, y el valor del catálogo coincide **exactamente** con una
   de ellas: los 19,2 Tb/s del SR-7s son su «IA slot forwarding (FD)», una cifra **por slot**.
   O sea que no parece un error de transcripción sino la elección de otra métrica — puede que
   deliberada. Quien decida tiene que elegir qué métrica quiere que dimensione, y **eso sí
   afecta**: el dimensionador nuevo de agregación/core sí ordena por `cap`.

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
10. **Precios de Aruba: todos en `null`.** No existe lista de precios en el material
    disponible.
15. **Alimentación eléctrica: cobertura real, no completa.** La nueva sección «Alimentación
    eléctrica» de la ficha (agosto 2026) solo tiene dato donde el propio catálogo ya traía
    una frase publicada — Cisco 21/21 (ya existía), Huawei 17/40, MikroTik 14/15, Aruba 6/21,
    **Juniper 12/12 SRX** (2026-09-03, completo: ver *Cerrado recientemente*), **Fortinet
    56/58** y **Nokia 6/18** (2026-09-03). El resto queda `null` y la ficha lo declara sin
    rodeos.

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

203 pruebas (12 nuevas sobre `contraste.js`: mapeo por valor no por formato, columna no
reconocida que se ignora, alias solo si el campo existe, alta nunca aplicada, celda vacía que no
propone borrar, casado de nombre con prefijo de fabricante, y la forma de `comoPropuesta`).
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
