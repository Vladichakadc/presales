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

| # | Qué falta | Cómo se cierra | Bloqueo |
|---|---|---|---|
| 2 | **`cps` en 37 de los 58 FortiGate.** El motor ya usa las sesiones nuevas por segundo como tercer eje; los 21 verificados funcionan, los 37 en `null` no se filtran por ese eje y la ficha lo declara. | `npm run cps -- --check`, copiar tres columnas del Product Matrix a CSV/XLSX, `npm run cps -- matrix.xlsx`. Rechaza filas cuya columna de sesiones concurrentes no case con el `sess` verificado. | `fortinet.com` |
| 3 | **PDFs de datasheets de Aruba.** `public/datasheets/` va vacío a propósito; la página enlaza la URL de HPE mientras no esté el archivo local. | `npm run datasheets` desde una máquina con salida, y commitear los PDF. | dominios de HPE |
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
| **Juniper** | sí (22 modelos) | sí (21) | sí | **no** |
| **Nokia** | sí (18 modelos) | sí (18) | sí | **no** |
| ~~Arista~~ | retirado | retirado | retirado | — |

5. **Dimensionador Juniper.** Es el más viable: el catálogo ya trae las cifras de firewall e
   IPsec de la línea SRX de sucursal y de la generación 2024 (SRX1600/2300/4300/4700), más la
   familia **Session Smart Router**, que es la respuesta SD-WAN vigente de Juniper. Lo que
   falta para dimensionar de verdad son las cifras **por capa de inspección** (IPS, NGFW,
   Threat Prevention), las sesiones concurrentes, los SKU y los niveles de soporte — el mismo
   conjunto que tiene Fortinet. Con eso, el motor y `ficha.js` se reutilizan casi tal cual.
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

11. **`dimensionador-bom-huawei-v3_1.html`** — el sufijo `-v3_1` es un resto del versionado
    informal previo a git. Renombrarlo exige tocar el HTML, el JS y los enlaces del portal.
12. **`CISCO_EOL_MODELS` en `seedCatalog.js` está inerte** — la Fase 2 retiró la serie ISR
    4000 y ya no coincide con ningún `Product`. Se conserva por si reaparecieran vía
    `cotizadorCatalog`.
13. **Sin herramientas de lint ni de test.** La verificación es manual: arrancar con
    `NODE_ENV=production` y recorrer la página en Chromium. Ahora que hay autenticación por
    usuario, un juego mínimo de pruebas sobre `usuarios.js` y la firma de sesión atraparía
    justo la clase de fallo que apareció al construirlo (ver *Cerrado recientemente*).
14. **Skills instaladas parcialmente.** De `chikisdtv` se copiaron las 20 relevantes para este
    proyecto (seguridad, revisión, frontend, base de datos, planificación). Se dejaron fuera
    las de marketing, ventas, SEO y ASO —unas 59— porque esta es una herramienta interna
    detrás de un muro de autenticación y no tienen dónde aplicarse. Si alguna hace falta, se
    copia desde `.claude/skills/` del repo hermano.

## Decisiones que necesitan al dueño del producto

15. Ninguna abierta ahora mismo.

---

## Cerrado recientemente

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
