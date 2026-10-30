# Traspaso: aruba-pickmodel-opciones-tarde

- **Tema:** el modelo de Aruba en un enlace lo repone ESTADO (`opcionesTarde`) en vez de la captura propia QMODEL_URL
- **Rama:** claude/aruba-pickmodel-opciones-tarde
- **Cuenta:** servicioiptv2025@gmail.com (sesión 01V8T7S7ZbQULfHYAyefitrr)
- **Estado:** en curso
- **Actualizado:** 2026-10-30 07:45
- **Archivos que toca:** public/js/estado.js, public/js/dimensionador-aruba-edgeconnect.js, test/e2e/e2e-aruba-pickmodel-enlace.js
- **Siguiente paso:** con CI en verde (las baterías e2e solo corren allí), commit de cierre y fusión en main.

## Encargo del dueño

La mejora propuesta al cerrar el PR #77; preguntado, el dueño respondió «Sí, hazla».

## Hecho

- `estado.js`: `opcionesTarde` cubre también el caso en que las opciones ya están al vincular (el
  catálogo llegó antes): se repone y se anuncia igual (`input` y `change`).
- Aruba: fuera `QMODEL_URL` y su reposición en `initApp`; declara `opcionesTarde: ['pickModel']`.
  Su manejador de `change` marca `bomManual` y la firma de puertos, como hacía la captura.
- `test/e2e/e2e-aruba-pickmodel-enlace.js`: aterriza en el equipo del enlace, queda manual, un
  cambio del escenario no lo suelta y el enlace lo sigue llevando.

## Decisiones y hallazgos

- Sin el caso «ya hay opciones», un catálogo llegado antes de `DOMContentLoaded` repondría el valor
  sin marcarlo manual y el render lo pisaría con el recomendado (el comentario de Aruba avisa de
  ese orden).

## Verificación

- `node --check`; pruebas de `estado` y `perfil-campos-enlace` en verde. Las e2e, en CI.
