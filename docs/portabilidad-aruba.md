# Qué del módulo Aruba pertenece a los otros siete dimensionadores

**Revisión de arquitectura, 2026-09-13.** Encargada por el dueño del repo tras el refactor que
otro motor de IA entregó sobre `main`: *«valida la estructura de los fabricantes que faltan, no
la forma como se calcula el dimensionamiento, porque se dimensionan de diferente manera»*.

Versión visual de este documento:
<https://claude.ai/code/artifact/804db692-1613-48f9-a72c-4c28eaa88d61>

Las cifras salen de `server/seed/legacyData/` y `cotizadorCatalog.js` **en el commit desplegado
ese día**, no de estimaciones. Como cualquier tabla de decisión, envejece: al leerla, contrastar
con `npm run catalogo` antes de actuar sobre una cifra.

---

## La tesis

El refactor mezcló **tres capas que no viajan juntas**. Una es del fabricante y no se debe
homogeneizar; las otras dos son universales y están atrapadas dentro del archivo de Aruba
(2.117 líneas frente a las 257–848 del resto). **Portar el módulo entero a los siete sería tan
erróneo como no portar nada.**

---

## Capa 1 — Escenario: específica del fabricante

Cómo se describe el sitio antes de calcular nada. El Multi-Underlay Builder solo tiene sentido
donde el equipo **termina varios transportes heterogéneos y construye un overlay sobre ellos**.
Fuera de ese supuesto inventa un concepto que el fabricante no vende.

| Bloque | Huawei | Cisco | Fortinet | MikroTik | Juniper | Nokia fabric | Nokia SR |
|---|---|---|---|---|---|---|---|
| Multi-Underlay Builder | solo AR | no ASR | **sí** | no aplica | solo SSR | no aplica | no aplica |
| Motor 70/30 (breakout local) | solo AR | no ASR | **sí** | no aplica | solo SSR | no aplica | no aplica |
| Auditoría de puertos | sin dato | sin dato | **sí** | sin dato | sin dato | **ya lo tiene** | **ya lo tiene** |
| Widget de rendimiento | no aplica | no aplica | reformulado | no aplica | no aplica | no aplica | no aplica |

**Los motivos, uno por uno.** *Fortinet* es el caso más claro: la página ya modela `pctOverlay`
como una fracción que el usuario **estima**, y el builder la sustituiría por una declaración de
enlaces reales. *Cisco* y *Huawei* lo admiten en sus familias de sucursal (Catalyst 8000, ISR,
Meraki MX; serie AR) pero **no** en ASR 1000 ni NetEngine 8000, que son PE de core: ahí no hay
underlay de sede que declarar. *Juniper* lo admite en Session Smart Router —que es SD-WAN sin
túneles— y **no** en SRX, que se dimensiona por capa de inspección; la página ya separa las dos
plataformas. *MikroTik* no vende producto de overlay: es routing de propósito general y CHR, y su
catálogo se dimensiona por reenvío más funciones (BGP, PPPoE, CAPsMAN). Y los dos *Nokia* son la
frontera más nítida: un fabric leaf-spine se dimensiona por servidores, velocidad de acceso y
sobresuscripción, y un agregador o PE por puertos y capacidad.

> Preguntarle a un fabric «¿cuántos enlaces WAN tiene la sede?» no es una mejora: es una pregunta
> de otra red.

---

## Capa 2 — Comercial: universal, limitada por el dato

Qué se pide y cuánto cuesta. No depende de la física del equipo sino de cómo se arma una
cotización, así que casi todo debería portarse. Lo que lo frena no es el código.

| Bloque | Huawei | Cisco | Fortinet | MikroTik | Juniper | Nokia |
|---|---|---|---|---|---|---|
| Matriz de compatibilidad de ópticas | sin matriz | sin matriz | sin dato | sin matriz | sin dato | sin dato |
| Inyección de hardware obligatorio | sin matriz | sin matriz | sin dato | sin matriz | sin dato | sin dato |
| Simulador de precio neto (LIST/NET) | **sí** | **sí** | **sí** | **sí** | 43 % con precio | 44 % con precio |
| CAPEX / OPEX / TCO | **sí** | **sí** | **sí** | **sí** | total parcial | total parcial |
| Perfiles multi-sede | **sí** | **sí** | **sí** | **sí** | **sí** | **sí** |
| Tiers de licencia por caudal | otro modelo | otro modelo | por equipo | por nivel SW | otro modelo | no aplica |

**Cobertura de precio en el cotizador**, que es lo que decide si un TCO es un total o una media
verdad (medida sobre `cotizadorCatalog.js`, la fuente autoritativa de qué se puede cotizar):

| Fabricante | Con precio | % |
|---|---:|---:|
| Cisco | 9/9 | 100 |
| Fortinet | 54/54 | 100 |
| Huawei | 16/16 | 100 |
| MikroTik | 15/15 | 100 |
| Aruba | 22/25 | 88 |
| Nokia | 8/18 | 44 |
| Juniper | 9/21 | 43 |

**La fila de licencias es el mejor ejemplo de lo que no se porta.** Aruba cobra la suscripción
*por ancho de banda del sitio* (tiers de 20 Mbps a 2 Gbps); Fortinet cobra por modelo de
appliance —el SKU lleva el equipo dentro— y MikroTik por nivel de RouterOS o licencia CHR. Portar
«tiers por caudal» a Fortinet no sería una mejora: sería una tabla de precios que no corresponde
a cómo se compra. Lo común es el patrón, ya escrito en `CLAUDE.md`: **cada fabricante tiene una
forma de licenciamiento propia y la proyección la refleja**.

---

## Capa 3 — Gobierno del dato: universal, y medio portada ya

`GET /api/fuentes/:vendor/salud` se escribió genérico y funciona para los siete hoy. Lo atrapado
es la interfaz, no el servidor.

| Bloque | Huawei | Cisco | Fortinet | MikroTik | Juniper | Nokia |
|---|---|---|---|---|---|---|
| Salud de fuentes bajo demanda | sí | sí | sí | sí | sí | sí |
| Delta de precios de una lista subida | sí | sí | sí | sí | sí | sí |
| Semáforo de ciclo de vida | 0/40 con fecha | 8/21 | 0/58 con fecha | 0/15 | 2/12 | 0/18 |
| Matriz de sistema operativo | sin dato | sin dato | sin dato | sin dato | sin dato | sin dato |

---

## Tres hallazgos con precedente en este repositorio

### 1. Un semáforo verde por falta de dato (riesgo alto)

Solo Cisco (8/21), Juniper (2/12) y Aruba (1/25) tienen boletín de fin de venta **con fecha**.
Huawei, MikroTik y Nokia tienen cero, y Fortinet marca cuatro modelos como `eol` **binario**
(`FORTINET_EOL_MODELS` en `seedCatalog.js`), sin fecha: nunca encendería el estado naranja de
«fin de venta anunciado». Portar el semáforo tal cual pintaría **«vigente» sobre 131 modelos que
nadie ha comprobado**. Es el mismo error que el «IPS: no aplica» del Catalyst 8300 en el
comparador, y aquí más caro, porque lo que se afirma es que un equipo se puede pedir.

**Regla:** el semáforo se enciende **solo donde existe `eolAnnounced` con fecha**; donde no,
declara «el catálogo no trae el ciclo de vida». Es el tercer estado que ya protege `redund`.

### 2. Los perfiles multi-sede nacían mal alcanzados — **corregido el 2026-09-13**

Se guardaban en `arubaPerfilesV1`, una clave por fabricante: exactamente el fallo de
`presales-bom-refs:<pathname>`. Un despliegue real de 50 sedes mezcla marcas, así que replicar
esa clave siete veces reproducía la pérdida silenciosa siete veces. Ya está arreglado —una sola
clave, `vendor` dentro de cada perfil, migración de lo guardado, borrado por id y reglas de
agregación declaradas por la página— **antes** de portar la función, porque después costaba siete
veces. Ver *Cerrado recientemente* en `PENDIENTES.md`.

### 3. El flujo no es solo de Aruba hacia fuera

La auditoría de puertos **no hay que llevarla a Nokia: Nokia tiene la versión más rica**. Su
catálogo ya modela configuraciones alternativas —«36x100GE o 12x400GE» nunca son 48 interfaces— y
aparta los chasis modulares que no publican densidad. Lo que falta es sacarla a pantalla. La capa
común es algo a lo que cada fabricante aporta lo que ya resolvió, no un molde que Aruba impone.

---

## Orden recomendado

1. **Extraer la capa comercial a un módulo compartido.** TCO, descuento, perfiles y accesorios
   viven dentro del archivo de Aruba; copiarlos a siete repetiría el fallo de `llevarABom` en seis
   copias. Van a `bom.js`, que ya recibió el simulador de descuento y lo ofrece opt-in.
   *Coste alto · riesgo bajo · no toca ningún cálculo.*
2. **Encender el gobierno del dato donde hay dato.** Salud y delta ya funcionan en el servidor:
   es solo interfaz. El semáforo, con la regla del hallazgo 1.
   *Coste bajo · riesgo alto si se omite el tercer estado.*
3. **Multi-Underlay solo en Fortinet, y medirlo antes** de tocar Cisco, Huawei AR y Juniper SSR,
   que además exigen acotar por plataforma y no por fabricante.
   *Coste medio · toca el motor.*
4. **Matriz de compatibilidad: primero el dato, luego la pantalla.** Es el bloque de más valor
   comercial —una óptica que no encaja es un pedido fallido— y el único que ningún otro fabricante
   puede sostener hoy. Construir la pantalla antes que el dato produce siete paneles vacíos.
   *Bloqueado por dato, no por código.*

---

## Lo que este documento no dice

Si cada bloque **merece la pena comercialmente** para cada fabricante. Eso depende de qué se
cotiza más, y ese dato no está en el repositorio.
