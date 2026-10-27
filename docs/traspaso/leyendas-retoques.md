# Traspaso: retoques de las leyendas de Cisco

- **Tema:** quitar el aria-label del número de la leyenda y anotar en Actions los fallos de e2e
- **Rama:** claude/leyendas-retoques
- **Cuenta:** servicioiptv2025@gmail.com
- **Estado:** listo para fusionar
- **Actualizado:** 2026-10-27 14:20
- **Archivos que toca:** public/js/ficha.js, test/e2e/ayuda.js
- **Siguiente paso:** esperar `verificar` y `pantallas` en verde y fusionar

## Encargo del dueño

Lo que quedó del PR #23 («al ampliar la imagen deberá mostrar la tabla…») tras fusionarse su
retoma, el #24.

## Hecho

- `ficha.js`: el número de la leyenda sin `aria-label` (prohibido en un span sin rol).
- `test/e2e/ayuda.js`: en Actions, cada fallo de `contador().ok` es también una anotación `::error`.

## Falta

- CI y fusión.

## Decisiones y hallazgos

- El log de los jobs vive en un almacén que el proxy de las sesiones no alcanza; las anotaciones se
  leen por la API (`check-runs/<id>/annotations`). Así se encontró el fallo del #23.

## Verificación

- Pendiente de CI.
