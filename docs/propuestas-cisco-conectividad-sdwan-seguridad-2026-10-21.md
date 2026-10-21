# Dimensionador Cisco: propuestas de conectividad, SD-WAN y seguridad (2026-10-21)

Encargo del dueño: «revisa si hay algún componente de seguridad que haga falta, ya sea con
licenciamiento DNA, o mira qué propones para mejorar el dimensionador a nivel de conectividad,
SD-WAN y seguridad».

Este documento tiene dos partes. La primera es lo que **ya se hizo** en esta entrega, porque tenía
documento oficial y era un error o un hueco del BOM. La segunda son **propuestas**: ninguna está
implementada y ninguna se da por aprobada por silencio. Cada una dice qué evita, qué cuesta, qué
documento hace falta y qué se rompe si se hace mal. Las que piden un documento nuevo lo traen por
`traer-cisco-huawei.yml` (el proxy de este entorno responde 403 a cisco.com): **ninguna cifra entra
sin él**.

## 1. Hecho en esta entrega: licencias y seguridad con fuente

Fuentes: la FAQ de las suscripciones DNA (16-jun-2026, traída por Actions a
`fuente/cisco-dna-faq-2026-10-21`), la guía de pedido de los Catalyst 8300/8200 (tablas 8, 9 y 11),
la guía de pedido de la G2 (tabla 10) y la ficha del ISR 1000 (tabla 41).

| Hueco que había | Qué hace ahora el BOM |
|---|---|
| El tier DNA salía como `DNA-C-T<n>-…` («se confirma en CCW») | El tier sale del tráfico del escenario: en SD-WAN cuenta todo el WAN; en autónomo, solo el cifrado; sin cifrado, el tier más bajo. Nunca pasa del máximo de la plataforma (`dnaTierMax`: T2 en 8200 y 8300-6T, T3 en 8300-4T2X y 8500, T5 en el 8500-20X6C) y avisa si el margen de crecimiento pide el siguiente. |
| Se ofrecía **DNA Premier**, discontinuado | Premier se convierte en Advantage, con aviso. |
| Término de 1 año en DNA | DNA es de 3, 5 o 7 años: 1 año se propone como 3, con aviso; la página ofrece 7 años. |
| Essentials en el Catalyst 8500 y el ASR | Solo admiten Advantage: se propone Advantage, con aviso. |
| Segmentación sin límite con Essentials | Casilla «VPN de usuario (VRF) por equipo»: más de 10 lleva a Advantage. |
| Módulos de voz con Essentials | La guía pide Advantage para los módulos de voz y SRST: aviso con el módulo del BOM. |
| HSEC como texto genérico «según país» | Catalyst 8200/8300: fila `C8000-HSEC` incluida con DNA (sin ella, 1.000 túneles y 250 Mbps cifrados por sentido). ISR 1000: `FL-1100-8P-HSEC` / `FL-1100-4P-HSEC` cuando el cifrado pasa de VPERF (250 / 150 Mbps); si no, aviso de que basta VPERF. 8500 y ASR: aviso de que las fuentes no la nombran. |
| LIC-SEC propuesto en equipos que no lo admiten | C8130-G2, C8140-G2, serie 8500 y serie 8600 (`secAddon: false`): sin filas LIC-SEC y aviso de que la inspección va desacoplada o en la nube. |
| Seguridad en autónomo sin su prerrequisito | Los complementos LIC-SEC en autónomo llevan Routing Advantage y `LIC-R-OP-SWM` (tabla 10). |
| Gestión del SD-WAN Manager sin decir | Línea opcional «elegir una»: Cisco Hosted Cloud, Hosted Cloud Pro o controladores propios. |
| Routing Essentials sin mencionar | En autónomo, en 8200/8300, aviso con `ROUT-P-C8300-E-7Y` / `ROUT-P-C8200-E-7Y` (7 años, sin tier, sin SD-WAN). |

Los avisos de licencia salen también en la pestaña de BOM y en las notas del Excel y del texto.

## 2. Propuestas

Ordenadas por lo que evitan frente a lo que cuestan. **Todas hechas el 2026-10-21**: la 2.1 (la
recomendada) y la 1.1 primero; las otras siete con el encargo del dueño «avanza con todo», cada una
con su documento, traído por Actions a `fuente/cisco-propuestas-2026-10-21` (ver cada apartado).

### Conectividad

**1.1 Enlaces WAN reales, cada uno a un puerto del equipo. Hecha el 2026-10-21** con el encargo
del dueño «avanza con la mejora propuesta»: `puertos` de los 52 modelos contados de sus fichas,
`asignarEnlaces` en el motor, el editor «Enlaces WAN y puertos» en la sección 4 y una fila nueva en
el contraste. Ampliada el mismo día (encargo «ejecuta y cierra pendientes y avanza con la mejora
propuesta»): cada enlace de fibra declara el tipo de fibra y el tramo, y la óptica sale del alcance
de su ficha (`elegirOptica`); el DSL, el portador de dos NIM en una ranura SM, las combinaciones de
puertos del 12X4QC y del C8570-G2 y el SFP+ 10GBASE-T de la serie 8300 entraron con su documento.
Lo que decía: hoy el escenario es un caudal y unas
casillas (celular, NIM, SM). Aruba y MikroTik ya tienen un constructor de enlaces: filas
`{principal/respaldo, Internet/MPLS/celular, bajada, subida, medio}`; un respaldo ocupa puerto pero
no suma; el caudal es el peor escenario de falla; cada enlace va a un puerto real (cobre, SFP,
SFP+), y lo que no cabe pide la NIM o el PIM de la guía de pedido, o aparta el equipo con su motivo.
- *Evita*: proponer un equipo con el caudal justo pero sin el puerto (dos enlaces SFP+ en un
  modelo con uno) y ópticas elegidas a mano.
- *Cuesta*: medio-alto. Los puertos hay que contarlos de la ficha de cada uno de los 52 modelos
  (hoy `ports` es texto), como `PUERTOS` en Aruba. Las ópticas por familia ya están.
- *Documento*: las fichas que ya están en `fuentes.js`; los puertos combo, de la guía de hardware.
- *Si se hace mal*: un puerto combo contado dos veces aprueba un equipo que no da los enlaces.

**1.2 Celular por categoría. Hecha el 2026-10-21**: cada enlace celular declara bajada y subida, y
el PIM de la guía de su familia se filtra por la categoría de la ficha «Cisco Wireless WAN Routers
and Modules» (`CELULAR`; la nota dice que es el pico de la norma). Lo que decía: el PIM hoy va «elegir uno» por región. La propuesta: el enlace
celular declara su caudal y el PIM se elige por categoría (LTE Cat 4/6/18, 5G), de la ficha de los
PIM.
- *Evita*: un respaldo 5G de 300 Mbps sobre un PIM Cat 4.
- *Cuesta*: bajo una vez traída la ficha de los PIM.
- *Documento*: «Cisco Pluggable Interface Modules Data Sheet» (no está en `fuentes.js`).
- *Si se hace mal*: una cifra de la categoría (teórica del 3GPP) tomada como caudal real.

**1.3 Alta disponibilidad por par de routers. Hecha el 2026-10-21** con la guía de diseño de
Catalyst SD-WAN («WAN Edge Deployment»: si un router cae, el otro lleva la sede, así que cada uno se
dimensiona para todo) y la de TLOC extension: casilla «Sede con dos routers» (el BOM lleva dos) y
«Un transporte por router, con extensión TLOC» (enlaces alternados y una interfaz entre los dos; un
celular no se extiende). Lo que decía: casilla «sitio en HA»: dos equipos, licencias y
soporte por equipo, y el caudal de cada uno con un solo enlace activo en falla.
- *Evita*: un BOM de una sede crítica con un solo equipo.
- *Cuesta*: bajo (el BOM ya multiplica por cantidad); la regla de reparto en falla, documentarla.
- *Documento*: guía de diseño de SD-WAN de Cisco (TLOC extension, VRRP).

### SD-WAN

**2.1 Túneles y sesiones BFD por topología (recomendada). Hecha el 2026-10-21** con el encargo del
dueño «ejecuta pendientes y mejora propuesta»: `tunelesTopologia` en `cisco-motor.js`, el bloque
«Túneles según la topología» en la sección 3 de la página, la cuenta en la memoria técnica y una fila
nueva en el contraste. Lo que decía: hoy «túneles» es una casilla que
escribe la persona. La propuesta: se derivan de la topología, que es aritmética y no necesita
ninguna cifra nueva de Cisco:
- *full mesh*: cada equipo levanta `(sedes − 1) × colores locales × colores remotos` túneles;
- *hub and spoke*: el spoke, `hubs × colores locales × colores del hub`; el hub,
  `sedes × colores de la sede × colores del hub`;
- *regional*: la suma de los dos tramos.

Cada túnel lleva su sesión BFD, y el resultado se compara con la cifra de túneles publicada de cada
modelo (`tuneles`, que ya está en el catálogo con su base: «Starting at IOS XE 26.2.1» en la G2).
- *Evita*: el error más caro de un hub, que pasa en caudal y se queda corto en túneles (200 sedes
  con dos transportes contra un hub con dos son 800 túneles, más de lo que publica un C8231-G2
  antes de 26.2.1).
- *Cuesta*: bajo. Tres entradas (topología, colores por sede, hubs), una función pura en
  `cisco-motor.js` con sus pruebas, y la escala que ya existe compara.
- *Documento*: ninguno nuevo; la fórmula se declara como supuesto en la memoria técnica.
- *Si se hace mal*: contar colores que no forman túnel entre sí (`restrict`, MPLS contra Internet)
  infla la cifra; la casilla «colores que se ven entre sí» lo resuelve, y la manual sigue pudiendo
  pisar el cálculo.

**2.2 Controladores (SD-WAN Manager, Validator y Controller). Hecha el 2026-10-21** con los
«Recommended Computing Resources» de la 20.18.x (25-sep-2026): con los equipos del overlay, las
opciones de SD-WAN Manager de su tabla 2 (con o sin SAIE) y los Validators y Controllers de las
tablas 5 y 6. Lo que decía: Cuántas instancias y de qué tamaño
para N equipos, o la opción Cisco Hosted Cloud (ya en el BOM como opcional).
- *Evita*: un proyecto de 300 sedes con un SD-WAN Manager de una instancia.
- *Cuesta*: medio. Es una tabla por versión.
- *Documento*: «Cisco Catalyst SD-WAN Control Components Compatibility Matrix and Server
  Recommendations» (no está en `fuentes.js`).
- *Si se hace mal*: una tabla de otra versión del software.

**2.3 AppQoE y Cloud OnRamp. Hecha el 2026-10-21** con la guía de AppQoE (capítulo de DRE,
10-mar-2026): ninguna ficha ni la guía publican caudal con optimización, así que no hay cifra; el
requisito «Optimización TCP con DRE» aparta a quien la guía no da como nodo o controlador de
servicio, o cuyo perfil no llega a las conexiones pedidas, y avisa del perfil y de la RAM y el disco
que añade. Cloud OnRamp pide Advantage, que ya lo dice la licencia. Lo que decía: La optimización TCP y DRE consumen CPU y tienen su propia cifra en
algunas fichas; Cloud OnRamp para SaaS y multicloud pide Advantage (ya lo dice la FAQ).
- *Evita*: dimensionar con la capa SD-WAN un sitio que además optimiza.
- *Cuesta*: medio, solo donde la ficha publique la cifra; donde no, aviso.
- *Documento*: fichas de los Catalyst 8300/8200 y de la G2 (comprobar si publican AppQoE).

### Seguridad

**3.1 Cisco Secure Access (SSE) en el BOM. Hecha el 2026-10-21** con su guía de pedido (20-oct-2026)
y la página de túneles de su guía de usuario: suscripción, licencia por usuario (mínimo 50) o, en SIA
Essentials, por sede, SPA y SA-THRT, y los túneles de 1 Gbps con su respaldo. Lo que decía: Hoy la salida a un SSE dice «la suscripción va por
usuario y no está en este catálogo». La propuesta: usuarios del sitio × referencia de Secure Access
(Essentials o Advantage) y el número de túneles IPsec al SSE que pide el caudal de salida, con el
límite por túnel que publique Cisco.
- *Evita*: un BOM de SD-WAN con «seguridad en la nube» sin la línea que la paga.
- *Cuesta*: medio. Una fila por usuario y una regla de túneles.
- *Documento*: «Cisco Secure Access Ordering Guide» y la página de límites de túnel de Secure
  Access (no están en `fuentes.js`).
- *Si se hace mal*: un límite por túnel de Umbrella SIG (el producto anterior) aplicado a Secure
  Access.

**3.2 Cisco Secure Firewall para «firewall dedicado». Hecha el 2026-10-21, como panel de
recomendación**: las fichas de las series 1200, 3100 y 4200 y la guía de pedido de seguridad de red
dan sus cifras por capa y sus referencias; con «Firewall dedicado aparte» se propone el más pequeño
que llega con la cifra de su capa (FW + AVC, con IPS o TLS) y va al BOM con su licencia TMC. Sin ficha
gráfica ni figuras de esos equipos (quedan en `PENDIENTES.md`). Lo que decía: Hoy remite al dimensionador de Fortinet.
La propuesta: la serie 1200/3100/4200 con sus cifras por capa (firewall, AVC+IPS, VPN, TLS) y el
mismo método de capas que Fortinet: se dimensiona con la capa que pide el perfil, nunca con otra.
- *Evita*: que un proyecto todo Cisco salga con el firewall de otro fabricante.
- *Cuesta*: alto. Es una línea de producto nueva: catálogo, procedencia, fichas, figuras, BOM y
  licencias (Threat, Malware, URL).
- *Documento*: las fichas de cada serie y su guía de pedido.
- *Si se hace mal*: la cifra de firewall (paquetes grandes) usada para dimensionar IPS.

**3.3 Threat Protection con URL y Malware Defense. Cerrada el 2026-10-21 sin aviso nuevo**: la
premisa no se sostenía. Las fichas de la G2 y de los Catalyst 8200/8300/8500 definen Threat
Protection como «DIA-NAT + NGFW + IPS + URLF + AMP»: la cifra ya incluye URL y Malware (el catálogo
lo dice en `bases`); la página lo dice junto a los complementos LIC-SEC. Lo que decía: Las fichas de la G2 publican Threat
Protection en EMIX; con URL Filtering y Malware Defense el caudal puede ser menor y no hay cifra.
La propuesta: un aviso cuando se marcan esos complementos, sin derivar ninguna cifra.
- *Evita*: que se lea la cifra de Threat como la del equipo con todo activado.
- *Cuesta*: muy bajo.
- *Documento*: ninguno (es decir que no consta).

## 3. Lo que no se propone

- **Estimar el caudal con descifrado TLS en el router.** Ninguna ficha lo publica; el motor ya
  aparta el escenario y remite a un firewall o a un SSE. Derivarlo de otra capa es el error que el
  catálogo prohíbe.
- **Precios de las licencias.** Salen de CCW; ninguna lista firmada está en el repositorio.
