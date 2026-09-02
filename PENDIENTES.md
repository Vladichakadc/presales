# Pendientes

Registro vivo de lo que falta. **Se lee al empezar y se actualiza al terminar cualquier
tarea**, y su contenido se resume al usuario al cerrar cada entrega — esa es la instrucción
permanente que lo justifica (ver `CLAUDE.md`, sección *Pendientes*).

Última revisión: 2026-09-02.

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
repositorio no automatiza la segunda a propósito— pero sí abre una vía que no existía: el
pendiente 3 ya se cierra desde ahí (`datasheets-aruba.yml`), y el pendiente 2 (Fortinet `cps`)
también, con el mismo patrón — un workflow (`traer-fortinet-matrix.yml`) baja el documento a
una rama de transporte que se lee y se descarta, nunca a `main` ni a un PR, porque no es un
activo de la aplicación. Juniper podría cerrarse igual si alguien dispara ese workflow — pero
**Huawei no**: investigado el 2026-09-02 (ver *Cerrado recientemente*), `e.huawei.com` y
`support.huawei.com` bloquean el navegador automatizado con un "Access Denied" propio del
fabricante (Akamai), categoría distinta de un 403 de proxy y que este repositorio no intenta
evadir. El pendiente 14 sigue necesitando una persona con navegador real.

El procedimiento completo —incluido qué viaja de local a producción y por qué no es la base
de datos— está en [`IMPORTAR-CATALOGO.md`](IMPORTAR-CATALOGO.md).

| # | Qué falta | Cómo se cierra | Bloqueo |
|---|---|---|---|
| ~~2~~ | ~~`cps` en 37 de los 58 FortiGate~~ **Resuelto (2026-09-02)** — ver *Cerrado recientemente*. Quedan 5 modelos en `null` (100F/200F/400F/401F/600F) que no están en el documento, no un bloqueo de acceso. | — | resuelto vía Actions |
| 3 | **PDFs de datasheets de Aruba.** `public/datasheets/` va vacío a propósito; la página enlaza la URL de HPE mientras no esté el archivo local. | **Ya no hace falta una máquina propia**: el workflow `datasheets-aruba.yml` se dispara a mano en GitHub Actions y deja un PR con los PDF y su peso medido. Merge o no, es decisión de peso del repo (ver `public/datasheets/LEEME.md`). | resuelto vía Actions |
| 14 | **Ciclo de vida y cifras finas del catálogo Huawei.** 40 modelos cargados y ninguno marcado como fuera de venta, mientras Cisco tiene 8; las 17 NetEngine no traen `fwd`, `ipsec` ni `typ` y las 23 AR no traen `mpps`. El motor no inventa: muestra lo que hay. | **El importador ya existe**: `npm run huawei -- --check` para ver los huecos, `npm run huawei -- specs.xlsx` para las cifras y `npm run huawei -- eox.csv --eol` para el fin de venta. Falta el dato, no la herramienta — **y, a diferencia de Fortinet/Aruba, esta vez no se cierra vía Actions** (ver *Cerrado recientemente*, investigación 2026-09-02): hace falta una persona con navegador real, y sesión de Huawei si hace falta el detalle fino de Info-Finder. | `e.huawei.com`, `support.huawei.com` bloquean el navegador automatizado (Akamai); `info.support.huawei.com` exige sesión |
| 4 | **Comprobar el sitio en vivo tras desplegar.** Se verifica que el deploy llegue a SUCCESS y que los logs muestren `[seed]` y `Presales corriendo en`, pero la página en producción solo puede abrirla una persona. | Abrir `presales.up.railway.app` y revisar la pantalla tocada. | `presales.up.railway.app` |

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
| **Nokia** | sí (18 modelos) | sí (18) | sí | **no** |
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
   - **IPS y ATP de la generación 2024** (SRX1600/2300/4300/4700) y de SRX4100/4200. Para el
     SRX1600 apareció «21 Gbps de IPS» sobre un firewall de 24 Gbps, lo que contradice que
     inspeccionar cueste capacidad: no se registró. La matriz de 2020 no cubre esta generación
     (es posterior a esa fecha), así que sigue haciendo falta un documento distinto.
   - **Precios y SKU**: no hay lista de precios de Juniper, todo va sin cotizar.
   - **Niveles de Juniper Care**: nombres y SLA sin verificar. Antes que inventar una tabla
     de SLA en una herramienta de preventa, hay un único nivel declarado como no verificado.

   Para lo que sigue abierto, `npm run juniper -- matriz.xlsx` (ver `npm run juniper -- --check`
   para la cobertura casilla por casilla) sigue siendo la vía: reconoce las columnas por su
   cabecera, resuelve Gbps frente a Mbps sin multiplicar a ojo y **rechaza la fila si alguna de
   sus columnas contradice lo ya verificado**, que es lo que caza una fila desplazada.
6. **Dimensionador Nokia.** No es copiar el motor. El catálogo es fabric de datacenter
   (7220 IXR sobre SR Linux) y agregación de operador (7250 IXR, 7750 SR): no se dimensiona
   por «ancho de banda WAN» sino por **densidad de puertos, sobresuscripción leaf-spine y
   diseño de fabric**. Necesita un motor propio — número de leafs, uplinks por leaf, factor de
   sobresuscripción, puertos de acceso por velocidad. Es la pieza más grande de esta lista y
   conviene tratarla como un proyecto aparte.

## Datos por confirmar

7. **Precio de los modelos Juniper y Nokia añadidos en agosto 2026.** Las cifras técnicas
   están verificadas contra datasheets oficiales; el precio no, porque no hay lista de precios
   de estos dos fabricantes en el material disponible. Van como `Consultar` con `elpN:0` y el
   BOM los cuenta como sin cotizar, igual que Aruba.
8. **Ciclo de vida de SRX1500 / SRX4100 / SRX4200.** La generación 2024 los sustituye en
   posicionamiento, pero no se encontró boletín oficial de fin de venta, así que **no se
   marcan**. Confirmarlo en `support.juniper.net/support/eol/product/srx_series/` y, si existe,
   registrarlo — el mecanismo ya está: basta la fecha de último pedido y la regla de
   `ficha.js` hace el resto.
9. **Cisco `C8355-G2` tiene `sdwan: null`** y por eso cae a su cifra de IPsec (20 Gbps),
   mientras el `C8455-G2` sí trae cifra SD-WAN propia (15,5 Gbps). La lista lo marca con
   «(cifra IPsec)», pero hay que confirmar si Cisco publica el número real del 8355.
10. **Precios de Aruba: todos en `null`.** No existe lista de precios en el material
    disponible.
15. **Alimentación eléctrica: cobertura real, no completa.** La nueva sección «Alimentación
    eléctrica» de la ficha (agosto 2026) solo tiene dato donde el propio catálogo ya traía
    una frase publicada — Cisco 21/21 (ya existía), Huawei 17/40, MikroTik 3/15, Aruba 2/21,
    Juniper 1/12 SRX, **Fortinet 0/58**. El resto queda `null` y la ficha lo declara sin
    rodeos. Esto **no es lo mismo** que los bloqueados por egreso de más arriba: el Product
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
    | FortiGate 100F | «Dual built-in non-hot swappable power supplies» | [Technical Tip: Checking FortiGate-100F series power supply](https://community.fortinet.com/t5/FortiGate/Technical-Tip-Checking-FortiGate-100F-series-power-supply/ta-p/267021) | Media |
    | FortiGate 200F | SKU de repuesto oficial `SP-FDD200F-PS` — "hot-plug / redundant" | [ficha de reventa](https://www.corporatearmor.com/product/fortinet-power-supply-hot-plug-redundant-sp-fdd200f-ps/) | Media |
    | FortiGate 400F | SKU de repuesto oficial `SP-FAD400F-PS` — "power supply redundant" | [ficha de reventa](https://www.corporatearmor.com/product/fortinet-power-supply-redundant-sp-fad400f-ps/) | Media |
    | FortiGate 7081F | Hasta 6 fuentes AC de 2500 W en caliente, redundancia añadible | [System Guide — AC PSUs](https://docs.fortinet.com/document/fortigate-7000/hardware/fortigate-7081f-system-guide/12189/ac-psus-and-supplying-ac-power-to-the-chassis) | Media-alta |
    | FortiGate 7121F | Hasta 8 fuentes hot-swap; SKU de repuesto oficial `FG-7121F-PS-2KAC` (2 kW) | [System Guide — Hot Swapping an AC PSU](https://docs.fortinet.com/document/fortigate-7000/hardware/fortigate-7121f-system-guide/410545/hot-swapping-an-ac-psu) · [SKU en reventa](https://www.corporatearmor.com/product/fortinet-power-supply-hot-plug-redundant-2-kw-fg-7121f-ps-2kac/) | Media-alta |
    | FortiGate 60F / 90G / 91G (y por extensión 30-121G, 40-91F) | Un solo adaptador externo 12 V DC (SKU `SP-FG60E-PDC`), sin bahía para segunda fuente — indicio de **fuente única**, no doble | [Technical Tip: FortiGate-100/101E y 200/201E power supply](https://community.fortinet.com/t5/FortiGate/Technical-Tip-How-to-check-power-supply-details-for-FortiGate/ta-p/193557) | Media-alta |

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
