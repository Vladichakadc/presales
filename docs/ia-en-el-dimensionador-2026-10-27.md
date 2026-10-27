# Inteligencia artificial en los dimensionadores: qué se puede hacer sin inventar datos

> **Retirado el 2026-10-27 por decisión del dueño** («elimina del dimensionador de Cisco «Del pliego al
> escenario», la IA piloto, porque gasta tokens y no nos sirve»). Se llegó a construir la función A
> como piloto en Cisco y se quitó entera: página, ruta, servicio y pruebas. Este documento queda
> como la investigación que fue; si algún día se retoma, el código está en el historial de git
> (`34f508c`).

Investigación del 2026-10-27, por encargo del dueño («empieza a investigar qué funcionalidades
tienes de inteligencia artificial para incluir en el dimensionador»). Es una investigación, no
una implementación: termina en una recomendación y en dos decisiones que son del dueño.

## 1. Lo que ya hay en el repositorio

- **SDK oficial `@anthropic-ai/sdk` 0.137** (`package.json`), sin otro proveedor.
- **`server/services/aiSync.js`** (la sincronización del catálogo) ya usa lo que una función nueva
  necesitaría, con las decisiones tomadas y probadas:
  - **Claude Opus 5.5** (`claude-opus-5-5`, el modelo vigente por defecto: 4 $ / 20 $ por millón
    de tokens de entrada / salida, 0,20 $ la caché leída), con `effort: 'high'` explícito (su
    valor por defecto es `medium`) y el pensamiento siempre activo (en Opus 5.5 no se puede
    apagar).
  - **Salida con esquema** (`output_config.format`): la respuesta es JSON que valida contra el
    esquema; no se interpreta texto libre.
  - **`fallbacks: 'default'`** con la cabecera `server-side-fallback-2026-07-01`: si los
    clasificadores declinan (un catálogo de cortafuegos, IPS y VPN puede rozar la categoría
    `cyber`), la API reintenta en el modelo que corresponde, y el servicio lo registra.
  - **Caché del prompt** (`cache_control`) sobre el sistema y el catálogo, que no cambian entre
    peticiones; el documento va después.
  - **PDF como bloque `document`** (base64; hasta 32 MB y 600 páginas por petición) o texto plano.
  - **Fallo cerrado**: sin `ANTHROPIC_API_KEY`, 503 (`SinClave`); clave rechazada, 502; respuesta
    cortada (`max_tokens`) o declinada (`refusal`), error con su motivo. Nunca una respuesta
    inventada en su lugar (el simulacro que la inventaba se retiró).
  - **El tipo del adjunto lo decide su firma** (`firmaArchivo.js`), no el mimetype.
- **Una hoja CSV/XLSX se contrasta sin IA** (`public/js/contraste.js`): la IA solo entra donde un
  programa no puede leer.
- **Los dimensionadores declaran sus parámetros**: cada página vincula su escenario con
  `ESTADO.vincular()` y `npm run catalogo` comprueba esos `campos` contra los `id=` del HTML. Esa
  lista es exactamente el contrato que una función de IA tendría que rellenar.

## 2. La regla que manda sobre cualquier función de IA

**El motor elige el equipo y el catálogo pone las cifras; la IA no aporta ni una cosa ni la
otra.** Lo que puede hacer es traducir entre lenguaje y parámetros, siempre con la cita literal
del documento del que sale cada valor, y lo que el documento no dice queda en `null` («sin dato»),
no se rellena con lo verosímil. Es la misma regla que ya cumple la sincronización: «un SKU o un
precio verosímil pero inventado es el peor resultado posible».

## 3. Candidatas, de más a menos recomendable

### A. Del pliego al escenario (recomendada)

El preventa sube el pliego o la RFP del cliente (PDF o texto pegado). Claude devuelve, con salida
con esquema, **los parámetros del escenario de esa página** (caudal por sede, número de sedes,
enlaces y su entrega, seguridad local o en la nube, alta disponibilidad, usuarios, túneles…), cada
uno con:

- `valor` (o `null` si el pliego no lo dice);
- `cita`: el texto literal del pliego que lo respalda, y su página;
- `nota`: la conversión aplicada, si la hay («250 Mbps simétricos» → bajada y subida de 250).

La página **no aplica nada sola**: enseña cada campo como «valor actual → propuesto (cita)», la
persona acepta campo a campo y entonces dimensiona el motor de siempre, con su cifra de capa, su
apartado con motivo y su BOM. Lo que el pliego no dice sigue con su valor por defecto y se marca.

Por qué es la mejor:
- Ataca el trabajo manual más largo del preventa (leer 40 páginas para sacar cinco números) sin
  tocar lo que tiene que ser determinista.
- El esquema se genera de los `campos` que la página ya declara: un parámetro nuevo de un
  dimensionador entra solo, y uno que no existe no se puede proponer.
- **La cita se puede verificar por programa** cuando la entrada es texto: el servidor comprueba
  que cada `cita` aparece literalmente en el documento; si no aparece, el campo se rechaza. Con un
  PDF, el repositorio no extrae texto de PDF de forma automática: la cita y su página se enseñan
  para que la persona la compruebe, marcada «cita sin verificar por programa».
- Una inyección de instrucciones dentro del pliego («ignora lo anterior…») no tiene a dónde ir: sin
  herramientas, con salida con esquema y con aceptación campo a campo, lo peor que logra es un
  valor equivocado que la persona ve con su cita.

Coste estimado por pliego (Opus 5.5): un pliego de 30 a 60 páginas son del orden de 30.000 a
80.000 tokens de entrada (0,12 a 0,32 $) más unos miles de salida y pensamiento (del orden de
0,05 a 0,20 $ con `effort: 'high'`); el sistema y el esquema, cacheados, se cobran a 0,20 $ el
millón desde la segunda petición. Latencia: decenas de segundos, así que va en streaming
(`finalMessage()`), con la página diciendo que trabaja.

Cómo se haría (sin escribir código aún):
- Ruta `POST /api/escenario/desde-documento` tras `exige('herramientas')`, con el mismo manejo de
  adjunto, límites y errores que la sincronización (503 sin clave; 422 con su motivo si declina o
  se corta).
- El documento **no se guarda** en el servidor ni en el volumen: se usa en la petición y se
  descarta.
- El esquema por página sale de la lista de `campos` y de sus tipos y rangos del HTML (`min`,
  `max`, opciones de cada `select`); un valor fuera de rango se rechaza en el servidor antes de
  llegar a la página.
- Sin JavaScript en línea (CSP): el botón y la tabla de propuestas van en el script de la página.
- Pruebas sin red: respuestas grabadas del modelo para comprobar el rechazo de citas que no están
  en el texto, de valores fuera de rango y de campos inexistentes; y una batería e2e que acepta
  dos campos y comprueba que el motor dimensiona con ellos.

### B. Explicar la recomendación al cliente

Redactar en prosa, a partir del resultado del motor (la memoria técnica que ya sale en Markdown),
por qué se propone ese equipo. Valor menor: la memoria ya existe y es determinista. Riesgo: que la
prosa cite una cifra que el motor no dio. Mitigación posible: el servidor rechaza un texto con
cualquier número que no esté en el resultado de entrada. Recomendación: después de A, si se pide.

### C. Asistente de preguntas sobre el catálogo

Preguntas del tipo «¿qué FortiGate llega a 5 Gbps de IPS con 10 puertos de 10G?» respondidas con
herramientas de solo lectura sobre el catálogo (uso de herramientas con `strict: true`; en Opus
5.5 no se puede forzar `tool_choice`, se usa `auto`) y citando la entrada de `fuentes.js` de cada
cifra. Valor medio: los comparadores y la calculadora ya responden lo mismo con filtros. Riesgo:
que responda de memoria sin llamar a la herramienta; mitigación: rechazar la respuesta que no
cite ninguna herramienta. Recomendación: no por ahora.

### D. Revisar el BOM contra la guía de pedido (no recomendada)

Pedir al modelo que diga «falta tal pieza» sin adjuntar la guía de pedido es pedirle un SKU de
memoria: lo que la regla del catálogo prohíbe. Con la guía adjunta y citas, sería una variante de
A sobre otro documento, pero las citas nativas de la API (`citations`) no se pueden combinar con la
salida con esquema (devuelve un 400), así que el formato se tendría que validar a mano. El BOM ya
sale de las guías de pedido y de las matrices oficiales, modelo a modelo. No se recomienda.

## 4. Riesgos comunes y cómo se cubren

| Riesgo | Cobertura |
|---|---|
| Un valor inventado | `null` obligatorio sin cita; cita verificada por programa en texto; aceptación campo a campo |
| Confidencialidad del pliego del cliente | Decisión del dueño (abajo); el documento no se guarda en el servidor |
| Inyección de instrucciones en el documento | Sin herramientas; salida con esquema; validación de rango en el servidor |
| Declinación por los clasificadores | `fallbacks: 'default'`, y si aun así declina, un error con su motivo |
| Sin clave o sin red | 503 y la página sigue funcionando a mano, como hoy |
| Coste | Caché del sistema y del esquema; un pliego cuesta céntimos; sin llamadas en segundo plano |

## 5. Decisiones que necesitan al dueño

1. **¿Se puede mandar el pliego de un cliente a la API de Anthropic?** Es su documento, a veces
   bajo confidencialidad. Si no, la función A solo admitiría texto que la persona pegue después de
   quitar lo sensible. *Recomendación*: sí, con un aviso en la pantalla antes de enviar y sin
   guardar el documento; para un pliego bajo NDA, pegar solo el pliego técnico.
2. **¿Por dónde se empieza?** *Recomendación*: la función A como piloto en el dimensionador
   Cisco (el que más parámetros tiene: enlaces, entrega, alta disponibilidad, Secure Access,
   firewall dedicado), primero con texto pegado, donde la cita se verifica al 100 %, y el PDF
   después. Si el piloto se usa, el mismo esquema por página lo lleva a los otros seis.
