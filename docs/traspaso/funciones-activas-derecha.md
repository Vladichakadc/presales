# Traspaso: funciones-activas-derecha

- **Tema:** Las funciones activadas, resaltadas también en la columna derecha (resultados) de los ocho dimensionadores con casillas
- **Rama:** claude/funciones-activas-derecha
- **Cuenta:** servicioiptv2025, sesión 01V8T7S8Yt1sBG4cCF7vWeFw
- **Estado:** en curso
- **Actualizado:** 2026-10-28 21:55
- **Archivos que toca:** public/js/funciones-activas.js, public/controles.css, public/dimensionador-{aruba-edgeconnect,cisco-catalyst8k,fortinet-fortigate,huawei-netengine,juniper-srx,mikrotik-routeros,nokia-7220ixr,nokia-7750sr}.html, test/funciones-activas.test.js, test/e2e/e2e-funciones-activas.js
- **Siguiente paso:** esperar CI del PR; en verde, PENDIENTES, RELEVO y CLAUDE.md en el commit de cierre y fusionar

## Encargo del dueño

«Ejecuta la siguiente modificación como un arquitecto senior con los Skills instalados para que cuando se seleccione una opción de cualquier dimensionador como ya se está resaltando en la parte de la izquierda también se resalte en la parte de la derecha de todos los dimensionadores».

Se entendió: la izquierda (parámetros) ya resalta la fila de cada casilla de función marcada; la derecha (resultados: ficha, licencias, BOM) tiene que enseñar ese mismo resaltado, para que quien lee el resultado vea con qué funciones se calculó.

## Hecho

- `public/js/funciones-activas.js`: arriba de la columna derecha de cada rejilla `.cols`/`.dim` con casillas de función a la izquierda, el panel «Funciones activadas» con una pastilla por casilla marcada, mismo resaltado que su fila; clic → foco en la casilla.
- `controles.css`, sección 3: estilos del panel; en Fortinet, franja dentro del panel de resultados.
- Enlazado (diferido) en los ocho dimensionadores. Pruebas: `funciones-activas.test.js` y la batería `e2e-funciones-activas.js` (las ocho páginas).

## Falta

- CI; PENDIENTES, RELEVO y CLAUDE.md al fusionar.

## Decisiones y hallazgos

- Una pieza común sin tocar el JS de ninguna página: el PR #58 tiene tomado `dimensionador-fortinet-fortigate.js`, y una correspondencia casilla → fila de resultado por fabricante serían ocho mapas a mano que se desincronizan.
- Las mismas exclusiones que la izquierda (`.wan-sim`, `.wan-ov`, `.switch`), fijadas por la prueba contra la hoja; lo oculto no cuenta, lo bloqueado sí con barra gris.
- Se repinta con `change`/`input` y cuando la derecha cambia (las páginas marcan casillas por programa sin eventos, pero siempre repintan resultados); solo escribe si cambia lo activado, sin bucle.
- La insignia del número usa `--red-txt` (blanco encima con AA; el `--red` de Cisco no llega).
- Starlink no lo lleva: interruptores, como en la hoja común.

## Verificación

- `node --test`: 1163 en verde; los 29 en rojo son los de siempre aquí (sin `sequelize`, `express`… instalados: el proxy deniega el registro de npm).
- Banco en Chromium con las ocho páginas reales servidas en estático: la batería nueva da 40/40 en lo suyo (los errores de JS son de la API ausente en el banco). Capturas a 1280 y 390 px sin desborde.
