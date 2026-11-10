# Traspaso: las proyecciones no escriben en legacyData/

- **Tema:** una prueba que congele `legacyData/` y corra las 16 proyecciones (mejora propuesta al cerrar el PR #174)
- **Rama:** claude/proyecciones-sin-escritura
- **Cuenta:** servicioiptv2025@gmail.com (sesión 01V8T7S92WvujFK1KCusavSu)
- **Estado:** en curso
- **Actualizado:** 2026-11-10 18:05
- **Archivos que toca:** test/proyecciones-sin-escritura.test.js
- **Siguiente paso:** CI verde, commit de cierre con el número del PR (entrega en docs/entregas/) y fusión

## Encargo del dueño

«Ejecuta la mejora propuesta» (2026-11-10). La del PR #92 ya estaba hecha; se ejecuta la propuesta sin decidir más reciente de `RELEVO.md`, la del PR #174.

## Hecho

- `test/proyecciones-sin-escritura.test.js`: huella de cada módulo antes y después de dos pasadas, congelado en profundidad de los objetos que carga `require` y controles.

## Falta

- CI y fusión.

## Decisiones y hallazgos

- `catalogProjection.js` no es estricto: congelar solo no basta (una escritura se ignora en silencio). Por eso la huella.
- Saboteada dos veces en local (con Sequelize sustituido): una escritura en `FUNCIONES` la caza la huella; un `reverse()` en sitio, el congelado.

## Verificación

- Local: 6 pruebas en verde con los modelos de Sequelize sustituidos por un módulo vacío (el catálogo en memoria no los usa); en CI, con Sequelize.
