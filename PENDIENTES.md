# Pendientes

Registro vivo de lo que falta. **Se lee al empezar y se actualiza al terminar cualquier
tarea**, y su contenido se resume al usuario al cerrar cada entrega — esa es la instrucción
permanente que lo justifica (ver `CLAUDE.md`, sección *Pendientes*).

Última revisión: 2026-08-26.

---

## Lo primero: el alta de usuarios

1. **Crear usuarios queda pendiente por decisión del dueño del repo** — por ahora la
   herramienta opera solo con el administrador. El backend ya distingue identidad y rol: la
   sesión dice quién eres, `exige('usuarios')` protege la ruta y el panel `/usuarios` lista
   usuarios y permisos. Lo que falta **no es el formulario**, es decidir cómo llega la
   primera contraseña a la persona nueva, que es donde estos módulos se vuelven inseguros:

   - comunicarla por un canal aparte y forzar el cambio en el primer acceso,
   - o generar un enlace de alta con caducidad y que la elija la propia persona.

   Hasta que eso esté resuelto, `POST /api/usuarios` responde **501** y lo explica, en vez de
   crear cuentas con una clave provisional que nadie rota. El rol `consulta` ya existe con
   sus permisos declarados y sin ningún usuario: dar de alta al primero será añadir una fila.

## Bloqueado por acceso — necesita una máquina fuera de este entorno

Nada de esto es trabajo de ingeniería pendiente: el código está hecho y probado, falta el
dato. El proxy de egreso de la organización responde **403** a estos dominios, y un 403 de
política se reporta, no se rodea.

El procedimiento completo —incluido qué viaja de local a producción y por qué no es la base
de datos— está en [`IMPORTAR-CATALOGO.md`](IMPORTAR-CATALOGO.md).

| # | Qué falta | Cómo se cierra | Bloqueo |
|---|---|---|---|
| 2 | **`cps` en 37 de los 58 FortiGate.** El motor ya usa las sesiones nuevas por segundo como tercer eje; los 21 verificados funcionan, los 37 en `null` no se filtran por ese eje y la ficha lo declara. | `npm run cps -- --check`, copiar tres columnas del Product Matrix a CSV/XLSX, `npm run cps -- matrix.xlsx`. Rechaza filas cuya columna de sesiones concurrentes no case con el `sess` verificado. | `fortinet.com` |
| 3 | **PDFs de datasheets de Aruba.** `public/datasheets/` va vacío a propósito; la página enlaza la URL de HPE mientras no esté el archivo local. | `npm run datasheets` desde una máquina con salida, y commitear los PDF. | dominios de HPE |
| 14 | **Ciclo de vida y cifras finas del catálogo Huawei.** 40 modelos cargados y ninguno marcado como fuera de venta, mientras Cisco tiene 8; las 17 NetEngine no traen `ipsec` ni `typ` y las 23 AR no traen `mpps`. El motor no inventa: muestra lo que hay. | Huawei Info-Finder o el capítulo «Specifications» de la documentación de producto, más los boletines EOX. Falta el importador, equivalente a `npm run cps`. | `e.huawei.com`, `support.huawei.com`, `info.support.huawei.com` |
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

5. **Completar el catálogo del dimensionador Juniper.** El dimensionador ya está en
   producción y el motor es correcto, pero el catálogo tiene huecos y el motor los declara en
   vez de rellenarlos. Lo que falta, por orden de impacto:

   - **Threat Prevention (`atp`) solo en el SRX1500.** Es la capa con la que hay que
     dimensionar de verdad una sucursal con seguridad avanzada, así que al marcar «ATP Cloud»
     hoy solo queda un candidato. Sin esa cifra la línea de sucursal no se puede proponer
     para ese perfil.
   - **Sesiones concurrentes de la línea SRX300.** Aparecieron 380.000 y 4.000.000 para el
     SRX380; el segundo es implausible frente a los 512.000 del SRX1500, muy superior. Ambos
     quedaron descartados.
   - **IPS y ATP de la generación 2024** (SRX1600/2300/4300/4700) y de SRX4100/4200. Para el
     SRX1600 apareció «21 Gbps de IPS» sobre un firewall de 24 Gbps, lo que contradice que
     inspeccionar cueste capacidad: no se registró.
   - **Precios y SKU**: no hay lista de precios de Juniper, todo va sin cotizar.
   - **Niveles de Juniper Care**: nombres y SLA sin verificar. Antes que inventar una tabla
     de SLA en una herramienta de preventa, hay un único nivel declarado como no verificado.

   Todo eso está en la **«SRX Series and vSRX Performance and Features Matrix»**
   (`juniper.net/content/dam/www/assets/datasheets/us/en/security/security-products-comparison-chart.pdf`),
   que **no es accesible desde este entorno**: el proxy responde 403 a `juniper.net`, igual
   que a `fortinet.com`. Se abre desde una máquina con salida, se copia la tabla a una hoja de
   cálculo y se aplica con **`npm run juniper -- matriz.xlsx`** (ver `npm run juniper -- --check`
   para la cobertura actual, casilla por casilla). El importador reconoce las columnas por su
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

## Limpieza

11. **Nada abierto.** Los cuatro puntos que vivían aquí (el sufijo `-v3_1`, el conjunto
    `CISCO_EOL_MODELS` inerte, la falta de lint y pruebas, y las skills a medio instalar) se
    cerraron en agosto de 2026 — ver *Cerrado recientemente*. Lo que dejó esa limpieza es la
    forma de que no vuelvan: `npm run verificar` antes de empujar, y un aviso en el arranque
    cuando un conjunto de fuera de venta deja de casar con el catálogo.

## Decisiones que necesitan al dueño del producto

12. **El alta de usuarios (punto 1) es la única grande**, y es una decisión de producto, no
    de ingeniería: cómo llega la primera contraseña a la persona nueva. Mientras no se
    resuelva, el endpoint responde 501 y lo explica.
13. **El nombre de usuario se compara exacto: «PreSales» no entra.** Lo destapó una prueba al
    escribirla. `mismoUsuario` compara en tiempo constante y sin normalizar, que es correcto
    de seguridad y áspero de usar: quien teclee la primera en mayúscula recibe el mismo error
    que quien se equivoca de contraseña, y con el freno de fuerza bruta contando. Normalizar
    (minúsculas y sin espacios alrededor) es lo habitual y aquí no tiene contraindicación real
    —los nombres son ASCII y el alta de usuarios ni siquiera existe todavía—, pero es un
    cambio de comportamiento en la autenticación y no se hace de tapadillo dentro de una tarea
    de limpieza. La prueba fija el comportamiento actual para que cambiarlo sea deliberado.

## Cerrado recientemente

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
