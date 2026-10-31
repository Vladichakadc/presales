# Traspaso: funcion-en-bom

- **Tema:** lo que trae una función, resaltado también en la lista de materiales (fase 2.2 del plan de mejora de los dimensionadores)
- **Rama:** claude/funcion-en-bom
- **Cuenta:** servicioiptv2025@gmail.com (sesión de Claude Code en la nube)
- **Estado:** en curso
- **Actualizado:** 2026-10-31 17:20
- **Archivos que toca:** public/js/funciones-activas.js, test/e2e/e2e-funciones-activas.js
- **Siguiente paso:** esperar `pantallas` en el PR; si la batería dice que una página no repinta el BOM con su pestaña cerrada, decidir allí (no comparar con una foto vieja)

## Encargo del dueño

«Ejecuta lo pendiente del plan aprobado» (2026-10-31): la 2.2, la mejora propuesta al cerrar el PR #66.

## Hecho

- `funciones-activas.js`: las líneas de `#bomTabla` (sin rótulos de grupo ni total) entran en la foto
  del `click` y en la comparación; el panel las cuenta aparte («y M líneas de la lista de
  materiales»); «Ver» abre la pestaña del BOM si lo primero resaltado está en ella; las marcas se
  reponen si la tabla se repinta.
- `e2e-funciones-activas.js`: el número del panel suma puntos y líneas, las líneas contadas son las
  resaltadas en la tabla, y un caso fijo en MikroTik («Capacitación» trae su línea).

## Falta

- CI, el commit de cierre y la fusión.

## Decisiones y hallazgos

- El riesgo de la propuesta: una pestaña que se repinta al abrirse y no al recalcular se compararía
  con una foto vieja. `bom.js` repinta siempre (`BOM.sincronizar`); la batería lo comprueba página a
  página con la pestaña cerrada.

## Verificación

- `node --test test/funciones-activas.test.js` en verde. La batería e2e, en CI (aquí no hay dependencias).
