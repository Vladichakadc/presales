# Traspaso: campos que no recalculan en línea

- **Tema:** batería e2e que encuentra los campos de los dimensionadores que no recalculan en línea, y su arreglo uno a uno
- **Rama:** claude/campos-en-linea
- **Cuenta:** servicioiptv2025@gmail.com (sesión de Claude Code en la nube)
- **Estado:** en curso
- **Actualizado:** 2026-10-30 05:55
- **Archivos que toca:** test/e2e/e2e-campos-en-linea.js, public/js/dimensionador-*.js
- **Siguiente paso:** leer las anotaciones `e2e` de la comprobación `pantallas` de esta rama y enlazar cada campo que salga «se queda atrás»

## Encargo del dueño

«Ejecuta mejora propuesta» (2026-10-29), sobre la propuesta al cerrar el PR #69: encontrar los campos
que el recálculo en línea no escucha y enlazarlos uno a uno.

## Hecho

- `test/e2e/e2e-campos-en-linea.js`: el oráculo es el propio botón «Actualizar». Para cada campo
  visible: texto de resultados antes (A), tras cambiarlo sin pulsar nada (B) y tras
  `DIMENSIONADOR_ACTUALIZAR()` (C). C ≠ B es fallo. En local (estático, sin catálogo) solo corre
  Starlink: 59 campos, 0 atrás.

## Falta

- La medición con catálogo real (CI) de las otras ocho páginas y el arreglo de cada campo.

## Decisiones y hallazgos

- Sin dependencias en este contenedor (el proxy niega registry.npmjs.org): la batería se mide en CI.

## Verificación

- Starlink en local: TODO VERDE.
