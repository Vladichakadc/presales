# Revisión de arquitectura del dimensionador Huawei, contra el módulo Aruba

**2026-09-29.** Encargo del dueño del repo: revisar el módulo Huawei *como arquitecto senior del
fabricante*, en detalle: cómo se dimensionan los equipos y qué debe decidir el dimensionador y
qué el BOM. También validar el módulo de Aruba, que ya está afinado, como referencia.

Criterios aplicados, de las skills instaladas:

- `sharp-edges`: controles que se contradicen y ceros que significan «sin dato».
- `feature-planning`: el plan por etapas.
- `database-designer`: el modelo de `PARTS` y `OPTICS`.
- `differential-review`: qué cambia en la cifra final.

**Qué se midió y cómo:**

- Las cifras de los escenarios salen de reproducir `render()` en Node sobre
  `legacyData/huawei.js`, en el commit `f2a939d`. No son estimaciones.
- La validación de Aruba es la de su propia batería: 99/99 pruebas en verde (`aruba-*`,
  `etapa-a-aruba`, `motor-ingenieria`) y la cobertura de `cobertura.lock.json`.
- **No se leyó ningún datasheet de Huawei.** `e.huawei.com` y `support.huawei.com` siguen tras
  Akamai y la cuenta Huawei (pendiente 14). Lo que depende de un documento se marca como
  *a contrastar*, sin darlo por resuelto.

---

## Veredicto

**El módulo Huawei elige bien el equipo más pequeño que cumple una cifra. El problema es la
cifra: con qué se compara y qué se pide después.**

- Hay tres defectos que producen una propuesta corta o equivocada sin ningún aviso (P0).
- Hay seis que hacen que el BOM no corresponda al diseño (P1).
- **Todos salen de la misma raíz: no hay una sola verdad.** `render()` decide el equipo leyendo
  el formulario. `renderBom()` vuelve a leer el formulario y recalcula las licencias con otro
  contexto. `PARTS` y `OPTICS` son listas de *compatibles* que el BOM trata como *obligatorias*.
- Aruba resolvió esto con `estadoDerivado()` y `aruba-reglas.js`. Fortinet lo resolvió con
  `fortinet-motor.js`, un único `evaluar()` para la página y el servidor. Huawei no tiene
  ninguno de los dos.
- **Ninguna prueba conduce el módulo**: `dimensionador-huawei-netengine.js` figura como
  **«sin conducir»** en la cobertura del contraste. Por eso ninguno de los hallazgos de abajo
  puso nada en rojo.

---

## Cómo dimensiona hoy

```
necesidad  = caudal × (sedes × simultaneidad, si es agregado) × 2 (por dirección) × (1 + margen)
Mpps       = necesidad / (trama × 8)
capacidad  = AR: la columna del perfil (fwd | ipsec | typ) · NetEngine: cap (conmutación)
candidato  = cumple capacidad, Mpps (solo NetEngine), PoE, 4G/5G, Wi-Fi, LAN y APs
elegido    = el de menor capacidad entre los candidatos, con FICHA.rango() para el ciclo de vida
```

La familia NetEngine (A800 E y NE8000) solo compite si se cumplen a la vez **siete
condiciones**: perfil `fwd`, sin SD-WAN, sin UTM, sin APs, sin PoE, sin 4G/5G y sin Wi-Fi
(`wanOk`). La plataforma no se elige: se deduce.

---

## Escenarios medidos

| Escenario | Necesidad | Propone | Lectura de arquitecto |
|---|---:|---|---|
| Enlace SD-WAN de 500 Mbps, valores por defecto | 1.300 | **AR6710-L14T2X4** (campus) | Salto de gama por el ×2, ver H-03 |
| Igual, medido como «total agregado» | 650 | AR5710-S8T2XE | La respuesta cambia de familia |
| Perfil `fwd` + SD-WAN marcado, 500 Mbps | 1.300 | AR5710-S8T2S | **SD-WAN típico 620: corto 2,1x** (H-01) |
| Perfil `ipsec` + SD-WAN, 500 Mbps | 1.300 | AR6710-L8T3TS1X2 | SD-WAN típico 1.200: corto 1,08x (H-01) |
| UTM + SD-WAN, 300 Mbps | 780 | AR6710-L8T3TS1X2 | Dimensionado sin cifra de UTM (H-02) |
| SD-WAN de 50 Mbps | 130 | AR5710-S8T2S (620) | ×4,8: AR610/AR650 sin `typ` (H-14) |
| 1 Gbps `fwd` + slicing FlexE | 2.600 | **AR6710-L14T2X4** | Un AR no hace FlexE (H-04) |
| SD-WAN de 2 Gbps + 8 puertos LAN (total agregado) | 2.600 | **sin candidato** | Los hubs traen `lan: 0` (H-05) |
| Hub de 100 sedes × 50 Mbps al 40 % | 5.200 | AR6710-H4T4X2Y7 | Sin túneles, sin sesiones, sin HA (H-11/12) |

La necesidad va en Mbps. El agregado del hub tampoco comprueba si el equipo soporta 100 túneles
IPsec: el dato no está en el catálogo, y la página no lo dice.

---

## Hallazgos

### P0 · La propuesta sale corta o equivocada sin ningún aviso

**H-01 · Marcar SD-WAN no fija la capa que se dimensiona.**
- Hay dos controles para una pregunta: el perfil (`fwd`/`ipsec`/`typ`) y la casilla
  «SD-WAN gestionado por iMaster NCE».
- Con perfil `fwd` y SD-WAN marcado, la página cobra la licencia de SD-WAN
  (`licensesFor`: `pk !== 'fwd' || svc.sdwan`), pero **dimensiona contra `fwd`**.
- En la serie AR5710-S eso es 1.300 frente a 620 Mbps de SD-WAN típico: **2,1x por debajo**.
- Es el defecto que Fortinet cerró con `PISO_POR_FUNCION`: una función activa fija una capa
  mínima y nunca se queda en la del perfil.
- **Arreglo:** SD-WAN fija el piso `typ`, e IPsec fija el piso `ipsec`. El perfil deja de ser
  un control libre y pasa a mostrar la capa efectiva, como `capaEfectiva()` en Fortinet.

**H-02 · UTM solo añade licencias y no toca la capacidad.**
- Con IPS, filtrado URL y antivirus activos, un AR procesa por otra ruta. Este catálogo no trae
  cifra de esa capa para ningún modelo, así que el motor dimensiona contra `typ` como si UTM no
  costara nada.
- La regla del repositorio es no sustituir una capa por la de otra. Juniper, Fortinet y la
  Calculadora la aplican.
- **Arreglo:**
  - Un eje `utm` en `null` explícito.
  - Con UTM marcado, la ficha declara «sin cifra de inspección publicada: dimensionado contra
    SD-WAN típico, confirmar con PoC» y el BOM sale en borrador.
  - Apartar todos los AR dejaría UTM sin respuesta posible. Declarar y frenar la exportación es
    la salida que ya usa Fortinet: un dato técnico que falta impide cotizar sin aviso.

**H-03 · El ×2 bidireccional por defecto no tiene fuente declarada.**
- `#dirSeg` arranca en «Por dirección» y duplica la necesidad, porque la página afirma que
  «Huawei publica throughput y capacidad de conmutación como suma bidireccional».
- Para la **conmutación** del NE8000 eso es la convención del sector.
- Para el **throughput de servicio de la serie AR** (`fwd`/`ipsec`/`typ`), ninguna entrada de
  `legacyData/fuentes.js` lo respalda.
- Mueve la respuesta un escalón entero: 500 Mbps dan un AR6710 de campus en vez de un AR5710-SE.
- **En una comparación con otros fabricantes pesa en contra de Huawei.** Aruba dimensiona por
  la suma de bajada y Fortinet por el caudal sin duplicar, así que para el mismo sitio Huawei
  siempre sale una gama más cara.
- **Arreglo:**
  - Contrastar la nota al pie de la tabla de rendimiento del datasheet AR (bloqueado, igual que
    el pendiente 14).
  - Hasta entonces, el supuesto va escrito en la ficha y en el BOM, y el valor por defecto se
    decide con el documento delante. No se cambia a ojo en ninguna de las dos direcciones.

### P1 · El BOM no corresponde al diseño

**H-04 · La plataforma no se elige antes que el caudal.**
- `modeSeg = core` solo cambia una etiqueta: no limita la familia a NetEngine.
- Marcar slicing FlexE/SRv6 no aparta los AR, así que 1 Gbps con FlexE propone un AR6710.
- En la misma lista ordenada se mezclan dos medidas distintas: el throughput de servicio IMIX
  de un AR y la capacidad de conmutación del sistema de un NE8000.
- Cisco (`PLATAFORMAS`) y Nokia (dos páginas) ya resolvieron esto eligiendo primero la
  plataforma.
- **Arreglo:** un selector de plataforma y rol con cuatro valores:
  - AR sucursal
  - AR hub
  - A800 E acceso de operador
  - NE8000 agregación/core
- Las capacidades de plataforma (FlexE, TPM, WAC, SD-WAN) pasan a ser datos del modelo, no
  casillas que se cruzan en un `wanOk`.

**H-05 · `lan: 0` significa «sin dato» y se lee como cero.**
- AR6710-H, AR8140, AR8140-T y AR8700 traen `lan: 0`. Sus puertos no son LAN o WAN fijos:
  se configuran.
- Basta pedir 8 puertos LAN para que los cuatro hubs desaparezcan. A 2 Gbps no queda candidato.
- Es el tercer estado de `redund`: `null` es «el catálogo no lo dice», nunca «no tiene».

**H-06 · El BOM mete como obligatorias las piezas que son alternativas.**
- `filasBom` añade **todas** las `parts` del modelo, con la cantidad del equipo:
  - AR8700-8: MPU-100 **y** MPU-100-T, más PAC1000, PAC600 **y** PDC1000. Son cinco módulos
    donde el pedido real es una MPU (o dos) y un único tipo de fuente.
  - AR6710-L: WSIC-4GE **y** WSIC-8GE, más la tarjeta 5G (SIC-NR) aunque no se pidió 5G.
  - AR8140, doble fuente de 350 W: una PAC350 por equipo.
- **Esta es la frontera que el diseño tiene que discriminar.** El catálogo dice qué es
  *compatible* y el BOM tiene que decir qué se *pide*.
- **Arreglo, con `database-designer`:** cada pieza lleva un `rol` —`incluida`, `redundancia`,
  `alternativa:<grupo>` o `condicional:<requisito>`— y el motor la resuelve contra el escenario.

**H-07 · Las ópticas se inventan.**
- Con «ópticas por equipo = 2», el BOM toma la **primera** óptica de cada familia que admite el
  chasis.
- En un AR5710-S8T2X salen 2 × 10G SR multimodo y 2 × GE SX multimodo: cuatro ópticas donde se
  pidieron dos. El medio y el alcance son arbitrarios.
- Aruba deriva la óptica del **medio declarado en cada enlace** (`necesidadesOptica`), con
  selector y matriz de compatibilidad.
- **Arreglo:** que las ópticas salgan de los puertos declarados (medio y alcance), nunca de un
  contador suelto.

**H-08 · La licencia de rendimiento desaparece del BOM.**
- `renderBom()` llama a `licensesFor(..., {need: 0, ...})`, así que la condición
  `need > m.boost` nunca se cumple.
- Ejemplo: 450 Mbps `fwd` con PoE y Wi-Fi proponen un AR651W-8P. La pestaña de cálculo dice
  «Licencia de rendimiento: Requerida» y el BOM y el Excel no la llevan.
- Es el síntoma más claro de las dos verdades.
- Además, `boost` choca de nombre con Aruba Boost, que es optimización WAN, en el BOM y el
  cotizador compartidos. Conviene renombrarlo a `licRendimiento`.

**H-09 · El dimensionador y el BOM calculan cada uno por su lado.**
- No existe estado derivado. `render()` y `renderBom()` leen el DOM cada uno.
- `drawVerdict` duplica el razonamiento de `porQueHuawei`.
- No hay reglas puras que se puedan probar en Node: `importar-huawei.test.js` prueba el
  importador, no el motor.

**H-10 · Del dimensionador al cotizador casan 13 de 40 modelos.**
- Los otros 27 llegan como «no está en el catálogo del cotizador». Entre ellos están casi toda
  la serie AR5710 y AR6710-L, AR8140, AR8700-8, AR6710-H, los A800 E salvo el A821 y los
  NE8000 M1, M6, M14 y X.
- A la inversa, el cotizador vende un **AR6300**, que el propio catálogo da por reemplazado por
  el AR6710-H, además de un **AR8700-10** y un **A811 E** que el dimensionador no conoce.
- Las cifras de los dos no coinciden:

  | Modelo | Cotizador | Dimensionador |
  |---|---|---|
  | NE8000 M8 | 4,8 Tbps · 1.086 Mpps | 2,4 Tbps · 453 Mpps |
  | NE8000 F8 | 12,8 Tbps | 6,4 Tbps |

- Son dos verdades en dos herramientas, justo en la cifra que se pone delante de un cliente.

### P2 · Ejes y diseño que faltan

**H-11 · El hub no tiene ejes de hub.**
- El modo agregado suma caudal, pero no pide túneles IPsec, sesiones concurrentes ni sesiones
  nuevas por segundo, y el catálogo no los trae.
- Fortinet, en su etapa 5, mostraba cuántos se piden y declaraba que el tope se contrasta con
  el datasheet. Esa es la salida aquí también, hasta que haya dato.

**H-12 · No hay alta disponibilidad.**
- La criticidad «Misión crítica — hub» solo cambia el nivel de Hi-Care.
- No hay doble CPE ni doble hub, y la cantidad es un campo manual que no sigue al modo agregado.
- Aruba modela HA 1+1 con la regla correcta: **HA suma disponibilidad, no caudal**. Cada nodo
  del par se dimensiona al agregado completo.

**H-13 · La capa comercial está incompleta.**
- Hi-Care, SnS e iMaster NCE van a 12 meses fijos. Aruba ofrece 1, 3, 5 y 7 años.
- La página no monta `BOM.simuladorDescuento`, `BOM.tco` ni los perfiles multi-sede, que
  `docs/portabilidad-aruba.md` ya marcó como aplicables a Huawei.

**H-14 · Hay datos incoherentes o que faltan.**
- **NE8000 M14:** 2,0 Tbps con 1.117 Mpps frente a los 2,4 Tbps y 453 Mpps del M8, que tiene la
  mitad de ranuras. La cifra de conmutación es sospechosa, se deja **a contrastar** y no se
  corrige.
- **A800 E:** declaran 20 Gbps y 4,4 Mpps. A IMIX de 340 B su techo real es de unos 12 Gbps. El
  motor lo aplica bien, pero la ficha no dice que manda el Mpps.
- **AR610 y AR650:** no traen `typ`. Por eso un SD-WAN de 50 Mbps propone un AR5710-S de
  620 Mbps. Apartarlos es la regla correcta, pero la página no cuenta ni nombra lo apartado,
  como sí hace la Calculadora.

**H-15 · Código muerto.**
- En `supportFor()`, la condición `remote && (essential||basic) && crit >= 2` nunca se cumple.

---

## Qué discrimina el dimensionador y qué el BOM

La regla que ya aplican Aruba y Fortinet, escrita para Huawei:

- **El dimensionador decide *qué equipo y por qué*.**
- **El BOM decide *qué se pide*, a partir del modelo validado y del escenario.**
- El BOM nunca vuelve a leer el formulario ni vuelve a decidir el equipo.

| Decisión | Dimensionador | BOM | Hoy en Huawei |
|---|:---:|:---:|---|
| Plataforma y rol (AR sucursal, AR hub, A800 E, NE8000) | **sí** | — | Se deduce de 7 casillas |
| Capa efectiva (fwd → ipsec → SD-WAN típico → UTM) | **sí** | — | La elige el usuario, sin piso por función |
| Ejes: caudal por capa, Mpps, túneles, sesiones, APs, puertos por medio | **sí** | — | Caudal, Mpps y APs; los demás no se piden |
| Requisitos duros (PoE, 5G, Wi-Fi, FlexE, TPM) | **sí** | — | Casillas, sin la familia FlexE ni TPM |
| Número de nodos (HA 1+1, doble hub) | **sí** | cantidad | No existe |
| Ciclo de vida | **sí** (`FICHA.rango`) | — | Regla correcta; 0 de 40 con dato |
| Piezas incluidas, de redundancia, alternativas y condicionales | — | **sí** | Todas como obligatorias |
| Ópticas por enlace o puerto declarado | — | **sí** | La primera de cada familia × contador |
| Licencias (SD-WAN, UTM, WAC por AP extra, rendimiento, NCE) | deriva | **cotiza** | Dos cálculos distintos; el BOM pierde una |
| Soporte, plazo y precio | — | **sí** | 12 meses fijos, sin precio |
| Puerta de exportación (sin código BOM, sin cifra de capa) | — | **sí** | Solo un aviso de texto |

---

## Validación del módulo Aruba como referencia

**Lo afinado, comprobado:**

- 99/99 pruebas en verde.
- Cobertura del contraste: la página al 66 %, `aruba-reglas.js` al 90 % y `motor-ingenieria.js`
  al 100 %.
- Tiene e2e propios (`e2e-aruba-respaldo`, `e2e-aruba-fases23`).

| Patrón de Aruba | ¿Aplica a Huawei? | Por qué |
|---|---|---|
| **Estado derivado único** (`estadoDerivado()`) para cálculo, ficha y BOM | **sí, primero** | Cierra H-08 y H-09 de raíz |
| **Reglas puras UMD** probadas en Node (`aruba-reglas.js`) | **sí** | `huawei-motor.js` con `evaluar()`, como Fortinet |
| Familia antes que caudal, cada una con su unidad de medida | **sí** | AR por throughput de servicio, NetEngine por conmutación, Mpps y puertos |
| Multi-Underlay Builder con rol activo/respaldo | **solo AR** | Un NE8000 es un PE: no hay underlay de sede que declarar |
| Ópticas desde el medio de cada enlace, con selector | **sí** | Cierra H-07 |
| HA 1+1: «suma disponibilidad, no caudal» | **sí** | Cierra H-12 |
| Ajustes y líneas retiradas del BOM con rastro | **sí** | Da una salida limpia a las piezas opcionales de H-06 |
| Capa comercial en `bom.js` (descuento, TCO, perfiles) | **sí** | Ya es genérica; solo falta montarla |
| **Motor de ingeniería (÷ IMIX 0,70)** | **NO** | Huawei ya publica `fwd`, `ipsec` y `typ` **en IMIX**; dividir otra vez penaliza dos veces |
| Reglas 70/30 de breakout y 80/150 flujos por usuario | **no** | Son reglas de la casa para tarifar EdgeConnect, sin fuente de Huawei |
| Tiers de suscripción por caudal y pool de Boost | **no** | Huawei licencia por equipo y función; ver `portabilidad-aruba.md` |

**Lo que hay que saber antes de tomar Aruba como molde:**

1. **Los factores de la casa se multiplican.**
   - Un DIA de 1 Gbps con DTD, FEC automático y 30 % de margen exige
     `1000 / 0,70 × 1,15 × 1,35 × 1,30` = **2.883 Mbps, un factor 2,9**.
   - Cada factor está declarado, y eso está bien. Pero la composición no la respalda ningún
     documento de HPE.
   - Copiarla a Huawei repetiría el problema que H-03 señala con el ×2.
2. **`dimensionador-aruba-edgeconnect.js` tiene 3.488 líneas**, seis veces las del de Huawei.
   Lo que se porta es el *patrón*: estado derivado, reglas puras y BOM gobernado. El tamaño no.

---

## Plan por etapas

Cada etapa se puede rechazar por separado. **La etapa H1 no cambia ninguna cifra** y es la que
hace medible todo lo demás.

| Etapa | Qué hace | Cierra | Coste | Riesgo |
|---|---|---|---|---|
| **H1** | Extraer `public/js/huawei-motor.js` (UMD, `evaluar(escenario, catálogo)`) que reproduce la salida de hoy. La página y el BOM consumen su resultado. Contraste `scripts/contrastes/huawei.js` con línea base medida en `f2a939d`, más pruebas unitarias. | H-08, H-09, H-15 | medio | bajo: el contraste prueba que no se movió nada |
| **H2** | SD-WAN e IPsec fijan piso de capa. UTM se declara sin cifra y deja el BOM en borrador. El ×2 queda visible con su fuente, o como supuesto. Se cuentan los apartados por motivo. | H-01, H-02, H-03 (declarado), H-14 (AR sin `typ`) | bajo | medio: **cambia recomendaciones a propósito**, y el contraste enumera cuáles |
| **H3** | Selector de plataforma y rol. FlexE, TPM y WAC como capacidades del modelo. `lan: null`. Builder de enlaces **solo en AR**. | H-04, H-05 | medio | medio |
| **H4** | BOM gobernado: `rol` en `PARTS`, ópticas por puerto declarado, HA, plazo, y descuento, TCO y perfiles de `bom.js`. | H-06, H-07, H-12, H-13 | alto | bajo |
| **H5** | Datos: reconciliar cotizador y dimensionador (27 sin casar, cifras del NE8000), túneles y sesiones del hub, ciclo de vida. | H-10, H-11, H-14 | según acceso | bloqueado por la cuenta Huawei (pendiente 14) |

**Cómo se verifica cada etapa:**

- `npm run verificar`.
- `npm run contraste -- --todos`, con el caso `huawei` nuevo.
- `npm run pantallas`.
- Un e2e que conduzca H-01 y H-08: SD-WAN con perfil `fwd`, y un AR651W-8P con su licencia
  presente en el Excel.

---

## Lo que este documento no afirma

- **Si el ×2 es correcto para la serie AR.** Depende de una nota al pie que no se ha podido leer.
- **Los SKU y la estructura exacta del licenciamiento de iMaster NCE-WAN y de las funciones AR.**
  El catálogo no los trae y aquí no se inventan.
- **Si la cifra del NE8000 M14 está mal.** Se marca como incoherente, pero la corrección llega
  por `npm run huawei`, con doble anclaje, igual que cualquier otra cifra del catálogo.

---

## Avance (2026-09-29, misma sesión)

Se ejecutaron H1 y las partes de H2, H3 y H4 que no dependen de datos bloqueados:
`public/js/huawei-motor.js`, `test/huawei-motor.test.js` (26 casos, con línea base del comportamiento
anterior) y el contraste `scripts/contrastes/huawei.js`. Pantallas 17/17 y contraste sin discrepancias.
Estado por hallazgo en `PENDIENTES.md`. Sin cerrar: H-03 (fuente del ×2), H-10/H-11/H-14 (datos)
y lo marcado «falta» en H3 y H4.

**H-11, primera versión (2026-09-29).** El modo agregado declara los túneles IPsec que se piden
(uno por sede) y que el catálogo no trae el tope de ningún modelo; no aparta a nadie. El motor ya
filtra por `tuneles` cuando un modelo lo publique (`null` es «no lo dice», nunca «sin límite»), y
la prueba lo comprueba con un catálogo sintético. Sesiones concurrentes y nuevas por segundo no se
piden: exigirían usuarios por sede, y derivarlos sería inventar un dato.

**H-12 (2026-09-29).** `#chkHa` añade la alta disponibilidad 1+1: el motor devuelve `unidades: 2`,
la necesidad no se reparte (cada equipo lleva el caudal completo) y el BOM y el envío al cotizador
multiplican por sitios x unidades. Con criticidad «misión crítica» y sin HA, avisa. **De paso se
corrigió que SnS salía dos veces en el BOM** (como licencia y como soporte).

**Intento de traer los datos bloqueados, con `agent-browser` (2026-09-29).** Los trece hosts
probados —nueve de Huawei (`e`, `support`, `info.support`, `download`, `carrier`, `consumer`, `www`,
`forum` y `support.huawei.com.cn`), más `web.archive.org`, `archive.org`, `r.jina.ai` y
`duckduckgo.com`— no responden: `CONNECT` 403 del proxy de egreso del proxy de egreso; el
navegador lo ve como `ERR_TUNNEL_CONNECTION_FAILED`. Es política de la organización: no se rodea.
No entró ninguna cifra al catálogo.

**Segundo intento, con el conector Firecrawl (2026-09-29).** Una petición simple, sin proxy
«stealth» ni sesión, a `e.huawei.com/en/products/routers/ar5710-s` responde 403. No se escaló a
un proxy de evasión: la defensa de Akamai contra automatización es del fabricante (ver el pendiente
14), y saltarla no es una vía que este repositorio adopte. El PDF de ciclo de vida de la serie
AR5700/6700/8000 pide además la cuenta Huawei.

**Lo que sí lo cierra:** una persona con su Huawei ID descarga desde su equipo el PDF «NetEngine
AR5700&6700&8000 Series Routers Product Life Cycle» y los datasheets AR y NetEngine, y los deja en
la sesión (o en Drive). Entran por `npm run huawei` con el doble anclaje de siempre.


**H-13, capa comercial (2026-09-29).** El dimensionador monta lo que `bom.js` ya daba a Aruba y
Fortinet: plazo de suscripciones y soporte (1, 3 o 5 años, con el término real en el texto de cada
línea), simulador de precio neto, TCO y perfiles multi-sede con BOM consolidado. **Dos decisiones
que conviene conocer.** (1) El precio del equipo se toma del cotizador (`/api/cotizador/catalog`,
la fuente única de precios) casando por nombre normalizado, y no se copia al catálogo: cubre 13 de
los 40 modelos y es una estimación sin descuentos ni impuestos, cosa que dice cada fila. (2) El TCO
se declara **parcial** en el propio pie: licencias, suscripciones y soporte no tienen precio
publicado, así que la suma cubre el equipo y cuenta cuántas líneas quedan fuera. Un total que
pareciera completo sería el dato inventado que este catálogo prohíbe.
