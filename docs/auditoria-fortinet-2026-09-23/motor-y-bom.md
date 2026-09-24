# Motor, BOM y fuentes del dimensionador Fortinet

Todo lo que sigue está en `public/js/fortinet-motor.js` (evaluación, escenarios, restricciones
y puerta) y en `public/js/fortinet-reglas.js` (ejes, capa efectiva y líneas comerciales). Donde
este documento y el código discrepen, manda el código, y la discrepancia es un defecto de este
documento.

## 1 · De las entradas a la demanda por eje

**Política.** Con `g = crecimientoPct / 100` y `techo = techoPct / 100`, la página muestra el
multiplicador combinado `(1 + g) / techo` como texto. En el CU-01 es 1,30 ÷ 0,70 = 1,857. Son
dos reservas distintas: el crecimiento sube la demanda y el techo baja la capacidad admisible.

**Escenarios de tráfico** (`escenariosTrafico`). La demanda de cada eje es el **máximo** entre
escenarios, y cada requisito dice qué escenario lo gobierna:

| Escenario | Caudal | Overlay |
|---|---|---|
| `normal` | Σ bajada de los enlaces **activos** | Σ bajada de los activos con overlay |
| `falla:X` (uno por activo, solo si hay respaldos) | normal − X + lo que absorben los respaldos, hasta su capacidad | igual, según el overlay de cada respaldo |
| `failover-ha` (solo con HA) | igual a normal: el clúster no suma capacidad | igual a normal |

Lo que un respaldo no puede absorber en `falla:X` se declara como `perdida` y **no se reparte**
sobre los otros activos, porque ya se declararon a su pico.

**Demanda de un escenario** (`demandaDeEscenario`):

```
caudalSitio   = hub ? caudal × spokes × simultaneidadPct/100 : caudal
frac          = sin SD-WAN ? 0 : round(overlay / caudal, 2)
previsto      = (picosNoConcurrentes ? max(caudalSitio, interVlan) : caudalSitio + interVlan) × (1 + g)
remoto        = acceso remoto activo ? mbpsRemoto × (1 + g) : 0
efectiva      = (previsto + remoto) × (1 + frac × 0,06)            ← ESP, supuesto de la herramienta
capa elegida  = efectiva                                           ← en la capa efectiva (ver abajo)
IPsec         = (efectiva − remoto) × frac + (método IPsec ? remoto : 0)
SSL           = inspección SSL ? efectiva × tlsCifradoPct/100 × (1 − tlsExentoPct/100) : —
```

**Capa efectiva** (`R.capaEfectiva`): la más profunda entre la capa que elige el usuario y el
piso que fija cada función de seguridad (`FUNCIONES` en `fortinet.js`):
- antivirus, IoT/DLP e inspección SSL → Threat Protection;
- web filtering → NGFW;
- FortiSandbox → ninguna, porque analiza fuera de banda y se cotiza como producto propio.

Una función **cambia la cifra que aplica**, nunca añade un porcentaje.

**Ejes de escala** (`demandaDeEscala`), independientes del camino del tráfico:

```
sesiones = sesionesMedidas ? sesionesMedidas × (1+g)
                           : (usuarios + remotos) × sesionesPorUsuario × (1+g)
cps      = cpsMedido ? cpsMedido × (1+g) : sesiones / vidaSesionS
tunGw    = hub ? spokes : spoke ? hubs : —
IPsec    : tunCli = remotos
SSL-VPN  : sslVpnUsers = remotos ; sslVpn = mbpsRemoto × (1+g)
MFA      : tokens = remotos
vdom, aps, switches = lo declarado
```

El crecimiento se aplica **una sola vez**, también sobre las cifras medidas. Hasta esta etapa
se omitía sobre las sesiones forzadas.

**Almacenamiento para registro local** = `GB/día × días × (1 + g)`, comparado contra la
capacidad **bruta** publicada. Esto último va declarado como supuesto en cada evaluación.

## 2 · Capacidad, utilización y elegibilidad

Por cada modelo y cada eje con demanda (`R.evaluarModelo`):

- `u = requerido / capacidad publicada`.
- **Ejes de rendimiento** (fw, vpn, ips, ngfw, tp, ssl, sess, cps, sslVpn): excede si
  `u > techo`.
- **Topes de configuración** (`configuracion: true`: tunGw, tunCli, sslVpnUsers, vdom, aps,
  switches, tokens): excede si `u > 1`. El techo es una política sobre cifras de laboratorio;
  un tope de plataforma no se mide en banco y no admite margen.
- **Sin dato**: en un eje **duro**, el modelo *se aparta* con su motivo (`apartadoPor`, como
  dato). En un eje **blando** (cps) se declara «no comprobado» y la confianza baja a media.
  **Nunca** se sustituye por la cifra de otra capa, y `null` nunca vale cero ni infinito.
- **Restricciones duras** (`restricciones`), independientes de cualquier holgura:
  - `CICLO_VIDA`: fuera de venta en compra nueva.
  - `FORTIOS_INCOMPATIBLE`: la función no está en esa rama para ese modelo; lleva su fuente y
    `fuenteLeida`.
  - `PROXY_LIMITADO`: modo proxy en los siete modelos de la nota 12 del Matrix.
  - `PUERTOS_INSUFICIENTES`: se asignan primero los puertos de un solo medio y después los
    compartidos. Un puerto sirve si es del medio pedido y de igual o mayor velocidad. **No se
    supone** que una jaula SFP+ acepte SFP de 1 GE.
  - `ALMACENAMIENTO_*`, `POE_*` y `PSU_*`.

**Elegible** = todos los ejes en `ok` y ninguna restricción. **Orden**: vigente antes que fuera
de venta y, dentro de cada grupo, el que menos `soporta`, es decir, el más pequeño que cumple.
`soporta` es el caudal efectivo máximo que el modelo aguanta con las proporciones de demanda
del escenario.

**Recomendación**: el primer elegible vigente del segmento elegido; si no hay, el primer
elegible vigente. **Shortlist**: la recomendación más dos alternativas con igual o mayor
`soporta`, primero del mismo segmento, cada una con su porqué («misma capacidad que 90G · con
disco local de 128 GB»).

## 3 · Confianza y puerta

La confianza empieza en **alta** y solo baja:
- **media** con un eje blando sin comprobar, modo proxy, un hub (plano de control sin topes en
  el catálogo), puertos no estructurados o un modelo fuera de venta elegido;
- **baja** con un chasis, o con SSL-VPN en 7.6.0–7.6.2 sobre un modelo cuya RAM no consta.

| Puerta | Cuándo | Acciones |
|---|---|---|
| BLOCKED | Cualquier bloqueo: override no elegible, sin candidato, FortiOS incompatible, bundle por debajo del mínimo, dato comercial requerido que falta, chasis | Ninguna |
| DRAFT | Un aviso de nivel `borrador` (falta un SKU o un precio pedible, precio de la edición anterior, lista vencida) o confianza baja | `excel-borrador`, `copiar-borrador` |
| WARNING | Un aviso `warning` o confianza media | Excel, copiar, cotizador, perfil y consolidado, con la advertencia estampada |
| READY | Nada de lo anterior | Todas |

El documento que sale lleva siempre la huella, la versión del catálogo, la del motor y el
estado de la puerta. En DRAFT va sellado «BORRADOR TÉCNICO — NO ES UNA COTIZACIÓN EN FIRME».

## 4 · Supuestos de la herramienta (no son cifras de Fortinet)

Se imprimen en «Supuestos» en cada evaluación:
- **ESP**: 6 % sobre la fracción que viaja por el overlay.
- **Vida media de sesión**: 30 s por defecto, cuando no se mide el CPS.
- **Simultaneidad de spokes** en un hub: 35 % por defecto, declarada.
- **HA activo-activo**: se dimensiona como si un nodo tuviera que absorber toda la carga.
- **Registro local**: se compara contra el disco bruto.

**Lo que el motor no hace, a propósito**: no aplica factores de penalización que Fortinet no
publique para proxy, SIP, logging o HA activo-activo. Donde falta la cifra, lo declara y baja la
confianza, y lo que depende de eso **requiere PoC** (§12.5 del informe).

## 5 · BOM y licencias (`R.lineasComerciales`)

El BOM se construye **solo** desde el modelo validado, y cada línea va por `nodos` unidades: 1
en standalone y 2 en HA.

| Tipo de compra | Equipo | Bundle y soporte |
|---|---|---|
| Nueva (Enterprise o UTP) | **SKU combinado BDL**, una línea: equipo + bundle + FortiCare Premium (`FG-90G-BDL-809-36`) | Dentro del BDL |
| Nueva con ATP | Equipo por su `hwSku` (ATP no tiene combinado) | Bundle en línea propia |
| Ampliación | Equipo por su `hwSku`; si es fuera de venta, con justificación escrita | Bundle en línea propia |
| Renovación / co-term | **Sin equipo**, y exige serie instalada | Solo servicios del término elegido; **el co-term no se prorratea** |

- **El BDL no es un descuento**: cuesta lo mismo que equipo + bundle en los 162 casos de la
  lista de septiembre (`test/fortinet-precios.test.js`). Hacia el cotizador viaja como una
  referencia, con la categoría «Equipo · SKU combinado (BDL)», para no cotizar el equipo dos
  veces.
- **Soporte**:
  - Los tres bundles traen FortiCare Premium, así que no se añade una segunda línea (T09).
  - Elite se cotiza con el SKU de *mejora* de la familia 204 si la lista lo trae; si no, como
    contrato completo con aviso.
  - Un nivel por debajo del incluido no se cotiza.
  - Sin bundle, FortiCare vuelve a ser línea propia.
- **Sandbox**:
  - `incluido`: sin línea. «FortiGate Cloud Sandbox» va dentro de Advanced Malware Protection en
    Enterprise, UTP y ATP según la matriz del Ordering Guide de FortiGuard, leída el 2026-09-24;
    el aviso informa y cita esa fuente.
  - `ai`: familia 577, por modelo.
  - `dedicado`: pide modalidad y va en línea propia sin SKU, en borrador.
- **Registro**: nube → familia 585, que es la suscripción por equipo de FortiAnalyzer Cloud
  según su Ordering Guide; FortiAnalyzer en appliance o VM → línea sin SKU, en borrador. Su forma y
  su tramo de GB/día son otro dimensionamiento, y el mensaje cita la tabla del guide.
- **EMS** (desde el 2026-09-24): `emsEndpoints` más `emsDespliegue` (FortiClient Cloud u
  on-premise). Sale en packs de 25/500/2.000/10.000 del Ordering Guide de FortiClient, con SKU
  exacto, y queda en borrador porque la lista de septiembre no trae su precio.
- **Servicios SD-WAN** (desde el 2026-09-24): **un** SD-WAN Service add-on por equipo (1387/1389,
  Ordering Guide de Secure SD-WAN), con SKU exacto en 20 de 23 modelos y sin precio en la lista.
- **FortiSASE** (desde el 2026-09-24): edición por banda de usuarios (50-499 … 10.000+), con SKU
  exacto y sin precio. Por debajo de 50 no hay SKU publicado.
- **VDOM** por encima de la cuota incluida: licencia en línea propia, sin SKU, en borrador. Por
  encima del máximo, el modelo se aparta.
- **Segunda fuente** (`redund: 'opcional'` y PSU redundante pedida): línea sin SKU, en borrador.
- **HA**: cada nodo lleva su suscripción. La excepción de FortiGuard único en activo-pasivo se
  **declara sin ofrecerse** (F3).
- **Término**: el SKU resuelve el sufijo `-12`, `-36` o `-60` a partir del marcador `DD` del
  patrón. Un término sin equivalencia deja la línea no pedible y la cotización en borrador.
- **Precio**: el de `LICENSES`, **reanclado** a la lista declarada, y el de `elpN` para el
  hardware. Un precio de la edición anterior (`anterior`) deja borrador y dice cuál. Una lista
  de más de 6 meses deja borrador.

## 6 · Guía operativa: importar y actualizar fuentes de Fortinet

**Qué documento respalda qué** (declarado en `server/seed/legacyData/fuentes.js`):

| Documento | Campos | Cómo se actualiza |
|---|---|---|
| Product Matrix (sept-2026, `PROMTX-2026-R176-SEP`) | fw, vpn, ips, ngfw, tp, ssl, sess, cps, ifaces, redund, tunGw, tunCli, sslVpn, sslVpnUsers, policies, vdomMax | `cps` entra con `npm run cps` (dos columnas, contrastada con `sess` si el archivo la trae). Los límites (`MATRIX_LIMITES` en `fortinet.js`) se transcriben a mano, y la prueba AT-29 exige que cada fila siga casando con el `sess` y el `cps` ya verificados. Después, `npm run vigia -- --revisado fortinet <url>` |
| Fichas por serie de 400F, 600F y 1000F (`-202604`) | Límites de plataforma de 400F/401F/600F/1000F/1001F (`FICHAS_LIMITES` en `fortinet.js`) | La tabla se autocomprueba al cargar contra cuatro anclas. Si alguien corrige `sess`, `cps`, `tp` o `vpn` sin volver a leer la ficha, los límites dejan de aplicarse y el arranque lo avisa. La tabla de plataforma (`FICHAS_PLATAFORMA`: VDOM por defecto, disco, FortiAP, FortiSwitch, tokens) sale de las mismas fichas y **no tiene ancla propia**, y eso se declara |
| Price list (Mid 090726) | Precios (`fortinetSkus.js`, `LICENSES` reanclado) | `npm run skus`, que ancla cada bloque contra el `hwSku` y el precio ya verificados. El reanclaje se recalcula solo al cargar (`REANCLAJE` en `fortinet.js`): tras una lista nueva, `sinReferencia` debe bajar |
| Compatibilidad FortiOS (`FORTIOS` en `fortinet.js`) | Reglas función × versión × modelo | Cada regla lleva `fuente` y `leida`. **Para pasar una regla a `leida: true` hay que leer el documento y citarlo literal.** La de 7.6.3+ sigue en `false` |

**Reglas que no cambian:**

- **No se lee una tabla de un PDF de forma automática.** La transcripción es humana y el
  contraste automático (doble anclaje), porque es ahí donde se cuelan las filas desplazadas.
- **Un término contradictorio no se rechaza, se corrige a la vista.** `server/services/terminoSku.js`
  lo valida y `npm run skus` lo reporta con la cabecera «TERMINO INCOHERENTE ENTRE TEXTO Y
  CODIGO».
- **La lista del distribuidor no entra al repositorio.** En esta etapa no entró ningún
  documento de precios nuevo: el reanclaje usa `fortinetSkus.js`, que ya estaba versionado.
- **Un 403 del proxy de egreso es una denegación de política.** Se reporta con el dominio y el
  comando que lo cierra desde otra máquina; no se rodea. Los PDF llegan por ramas `fuente/*`
  que publica un ejecutor de Actions (`traer-fortinet-pendientes.yml`).
- **Las cifras de cobertura no se escriben a mano en una nota.** Las cuenta `npm run catalogo`,
  y la pantalla las cuenta sobre el catálogo servido. Las notas de `fuentes.js` que traían «53
  de 58» quedaron fechadas como historia (F13).
