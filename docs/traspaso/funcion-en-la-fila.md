# Traspaso: funcion-en-la-fila

- **Tema:** «Por <función>» fijo en cada fila del BOM nacida de una función (Cisco y Fortinet), complementario del resaltado del PR #66
- **Rama:** claude/funcion-en-la-fila
- **Cuenta:** servicioiptv2025, sesión 01V8T7S8Yt1sBG4cCF7vWeFw
- **Estado:** en curso
- **Actualizado:** 2026-10-29 21:20
- **Archivos que toca:** public/js/por-funcion.js (nuevo), public/js/bom.js, public/js/cisco-motor.js, public/js/fortinet-reglas.js, public/js/dimensionador-cisco-catalyst8k.js, public/js/dimensionador-fortinet-fortigate.js, public/dimensionador-cisco-catalyst8k.html, public/dimensionador-fortinet-fortigate.html, public/controles.css (sección 5, al final), test/por-funcion.test.js, test/e2e/e2e-por-funcion.js
- **Siguiente paso:** CI del PR #70 (ya sobre main con el #66, en un solo commit); en verde, cierre y fusión; luego, la extensión a las otras cinco páginas (aprobada el 2026-10-29: «ejecuta pendientes y mejoras»)

## Encargo del dueño

«Ejecuta pendientes y mejora propuesta» / «Cierra pendientes y avanza con la mejora propuesta» (2026-10-29): la mejora del cierre del PR #61. Decisiones del dueño en esta sesión: tocar en paralelo los archivos del PR #62 (ya fusionado) y, ante el PR #66 de otra sesión con la misma mejora por otro camino, «las dos, complementarias»: primero el #66 tal cual y encima esto, solo la etiqueta fija del BOM, sin duplicar su resaltado.

## Hecho

- `por-funcion.js` (módulo aparte para no chocar con el #66 en `funciones-activas.js`): `chip`, `atributo`, `nombre`, `irA`; solo casillas reales y marcadas; el clic abre la pestaña de la casilla.
- `bom.js`: `data-por` y la etiqueta en la fila; `consolidar()` quita `por` (perfiles guardados, sin casillas que lo respalden).
- Cisco: `req` en `cisco-motor.js` (segunda fuente, PIM, NIM MACsec, LIC-SEC URL y Malware, Secure Private Access, SA-THRT) y en la página `CASILLA_REQ/LIC/SA`, cada entrada comprobada contra la lectura `clave:$('casilla').checked` que ya hace la página.
- Fortinet: `req` en `fortinet-reglas.js` (unidad del par HA, FortiConverter, servicio SD-WAN por servicio, EMS, segunda fuente); la página lo traduce con su tabla `UI` y `CHK_SDWAN`.

## Falta

- CI; rebase sobre el #66 cuando entre; cierre (PENDIENTES, RELEVO, CLAUDE.md).

## Decisiones y hallazgos

- Sin resaltado al pasar el puntero: ese lo da el #66. Aquí solo la procedencia fija.
- El Excel no lleva la marca: es información del preventa, no del cliente.
- Los estilos van al final de `controles.css`: `ciclo-y-casillas.test.js` exige que nada antes de la sección 2 use `--red`.
- FortiSASE y Sandbox sin marca: los trae un número o un desplegable, no una casilla.

## Verificación

- `node --test`: 1199 en verde; los 29 en rojo son los de siempre aquí (sin `sequelize`, `express`…: el proxy deniega el registro de npm).
- Banco en Chromium con `bom.js` y `por-funcion.js` reales: marca en la fila con su casilla marcada, ninguna con la casilla sin marcar o un id inexistente, y el botón abre la pestaña y enfoca la casilla. Las páginas con servidor las conduce `e2e-por-funcion.js` en CI.
