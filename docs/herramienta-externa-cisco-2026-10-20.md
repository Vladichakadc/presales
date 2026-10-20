# Herramienta externa de Cisco — contraste con las fichas oficiales (2026-10-20)

El dueño trajo un HTML suelto, «Dimensionador Oficial CISCO — 8000 Secure Routers G2, Catalyst
8000, Meraki MX & Licenciamiento Unificado (35 Equipos)», y pidió actualizar con él el
dimensionador de Cisco y sus pestañas, con el formato de los demás fabricantes y con las figuras
frontal y trasera de cada equipo. Este documento dice qué se tomó, qué no y por qué. El código que
resulta es `public/js/cisco-motor.js` (su cabecera resume lo mismo) y la página
`public/dimensionador-cisco-catalyst8k.html`.

**Regla aplicada:** lo que entra es su **método**, corregido; sus **datos** solo donde coinciden con
la ficha oficial, que es la que manda. Las fichas, guías de instalación, la guía de pedido de la
G2 y los boletines EOL se trajeron por `traer-cisco-huawei.yml` (ramas `fuente/cisco-secure-*`,
corridas 39360888778 y 39410454052): el proxy de egreso de este entorno responde 403 a
`cisco.com` y a `documentation.meraki.com`.

## 1. Cifras: 157 comparadas, 25 distintas

Se casaron sus 35 equipos con el catálogo (`legacyData/cisco.js`) y se compararon reenvío, IPsec,
SD-WAN, NGFW/Threat Protection y túneles. Donde difieren manda la ficha:

| Equipo | Adjunto → catálogo (ficha) | Por qué |
|---|---|---|
| ISR 1121X-8P | reenvío 1.200 → 1.600; IPsec 400 → 600; SD-WAN 350 → 250; túneles 250 → 200 | Ficha del ISR 1000, a 512 B |
| ISR 1161X-8P | reenvío 2.000 → 1.900; IPsec 650 → 700; SD-WAN 500 → 350; túneles 400 → 200 | Ídem |
| Catalyst 8200L / 8200 | IPsec 500 → 400 y 1.000 → 900; SD-WAN 460 → 300 | Ficha del 8200, IMIX |
| Catalyst 8300-1N1S-4T2X / 2N2S-4T2X | IPsec 17.000 → 6.600 y 18.800 → 9.300 | El adjunto citaba la cifra de 1.400 B; la ficha publica IMIX |
| Catalyst 8300 (6T) | IPsec 2.000 → 1.900 | Ficha, IMIX |
| Catalyst 8500 | túneles 8.000-10.000 → 6.000-8.000; 20X6C IPsec 350 → 400 Gbps | Ficha del 8500 |
| Meraki MX250 / MX450 | NGFW 3.000 → 2.000 y 7.000 → 5.000 | El adjunto daba el modo **detección**; el catálogo guarda prevención y aparte la de detección (`amenazasDet`) |
| C8111/C8121-G2-MX | NGFW 1.000 → 1.200 | Ficha de Meraki: «Advanced Security» 1,2 Gbps |

Las 132 restantes coinciden. **No entra ninguna cifra que la ficha no publique**: los túneles de
los Meraki (50 a 5.000), la Threat Protection de los ISR, `ssl_inspect_mbps`, `mpps`,
`fib_routes` y `max_sessions` de todos.

Además, el adjunto **no traía** quince equipos que sí están en el catálogo: ocho Secure Router
(C8130-G2, C8140-G2, C8151-G2, C8211-G2, C8221-G2, C8221L-G2, C8225-G2 y C8231-E-G2), el Meraki
MX68, los ISR 1111-8P, 1111X-8P y 1116-4P y los tres ASR 1000 (fuera de venta). Y **no declaraba
la base de medida** de ninguna cifra. Cisco mide cada familia distinto, y mezclar
bases es el error que este repositorio ya tuvo con el `fwd`/`typ` de Huawei:

| Familia | Reenvío | IPsec | SD-WAN | Seguridad |
|---|---|---|---|---|
| Secure Router (G2) | 512 B | 512 B | 512 B, IPsec + QoS + DPI + FNF | Threat Protection, EMIX (DIA-NAT + NGFW + IPS + URLF + AMP) |
| Catalyst 8200/8300 | 1.400 B | IMIX | IMIX, con IQDF | Threat Protection, EMIX |
| Catalyst 8500 | 1.400 B | 1.400 B | IMIX, sin IQDF | no publica |
| Meraki MX | sin tamaño de paquete | AutoVPN | AutoVPN | NGFW en detección (MX67-MX105) o prevención (MX250/450) |

Cada cifra lleva su base en `bases` y la pantalla la enseña junto a la cifra. **El reenvío de los
Catalyst sube a su cifra de 1.400 B** (3,8 Gbps el 8200, 19,7 el 8300, 197 el 8500-12X4QC): era la
decisión pendiente de PENDIENTES.md («si se quiere, se añade un campo a 1.400 B y la página dice
con cuál dimensiona»), y el adjunto del dueño trae esas cifras. La página avisa cuando la cifra
que dimensiona es de 1.400 B.

## 2. Precios: no entra ninguno

Sus `list_price_usd` no son de una lista: donde el catálogo tiene el export de CCW del 17-ago-2026,
el adjunto da la mitad o menos (C8355-G2: 7.450 frente a 15.552,28; Catalyst 8200: 3.390 frente a
6.967,76; 8300-1N1S-6T: 6.490 frente a 21.286,41). El precio de las licencias lo calculaba como un
porcentaje del equipo (`list_price × 0,35` en Advantage, `× 0,19` en Essentials, por el término)
y el descuento de partner arrancaba en un 52 % con un 12 % de financiación por defecto. Nada de
eso es de Cisco. Lo que no tiene precio sale «consultar» y el TCO lo dice.

## 3. Referencias: solo las de la guía de pedido

- **Licencias G2**: `LIC-CSWAN-<clase>-E/A`, `LIC-ROS-<clase>-A`, `R-OS-<clase>-E` y
  `LIC-SEC-<clase>-T/C/M` salen de las tablas 9 y 10 de la guía de pedido, con la clase de cada
  plataforma (S, M, L, XL, 2XL). El adjunto acertaba el patrón CSWAN; sus `LIC-MX-S-E/A` para
  Meraki no aparecen en ningún documento traído y no entran.
- **Módulos**: NIM, SM y PIM de las tablas 7 y 8. **Fuentes**: la segunda fuente de la tabla 3
  (`PWR-CC1-30WAC=`, `PWR-CC1-66WAC=` solo como repuesto; `PWR-ADPT-150WAC` en los -E).
- **No entran**: SKU de soporte (`CON-SNT-…`), de ventiladores (`FANLESS-0DBA` y similares), su
  catálogo de Firepower/Secure Firewall (`CISCO_FTD_CATALOG`, sin una sola fuente) ni sus
  configuraciones de ejemplo.

## 4. Método: lo que entra corregido

| El adjunto | Defecto | En el motor |
|---|---|---|
| `bw × (1 + FEC) × (1 + margen)` y una etiqueta «50 % SD-WAN + 50 % DIA» (con la topología llamada «70/30») | La salida local a Internet estaba en la etiqueta y nunca en la cuenta; la etiqueta ni siquiera decía lo mismo que el nombre | Overlay y salida local por separado, cada uno contra la cifra de su capa; la utilización es la suma de las dos fracciones |
| `PACKET_CLONING_2X: 0.35` | Duplicar un flujo lo manda dos veces entero, no un 35 % más | El tráfico duplicado cuenta dos veces |
| FEC 15 % / 25 % | Coeficiente sin fuente presentado como dato | Supuesto declarado, editable, apagado por defecto (25 % al encenderlo) |
| `ngfw × 0,55` con descifrado TLS | Ninguna ficha de router publica caudal con TLS: el 0,55 es inventado | Con TLS en el router no hay candidato, y la pantalla dice que va desacoplado o en un SSE |
| `eq.sdwan_iqdf_ngfw_mbps` en el modo con salida local | El campo no existe en su propio catálogo: ese modo dimensionaba contra `undefined` | No aplica |
| Inspección «en el router» para todos | El 8500 y los ISR no publican Threat Protection | Se apartan con su motivo |
| Dibujos SVG de los equipos | No son las figuras de los documentos | 58 figuras oficiales sin pérdida, con el pie literal de cada cara (`public/data/cisco-vistas-equipos.json`) |

Lo que sí entra tal cual es la estructura de la pantalla que pidió el dueño: plataforma, perfil
del overlay, salida local, seguridad, resiliencia, escala, requisitos, licencias por clase,
TCO/MRR, perfiles multi-sede y memoria técnica.

## 5. Qué queda abierto

En PENDIENTES.md («Abierto: herramienta externa Cisco»): la guía de instalación de la 8400 (su URL
sirve la guía de software), los C8355-G2-MX y C8455-G2-MX que solo constan en CCW, los NIM que el
catálogo atribuye a los ISR 1100, el boletín del Catalyst 8500-20X6C, los clientes de los MX95/105
y el contraste de los precios aproximados («~») del cotizador con el export de CCW.
