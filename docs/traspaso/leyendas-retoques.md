# Traspaso: retoques de las leyendas de Cisco

- **Tema:** quitar el aria-label del número de la leyenda de Cisco
- **Rama:** claude/leyendas-retoques
- **Cuenta:** servicioiptv2025@gmail.com
- **Estado:** listo para fusionar
- **Actualizado:** 2026-10-27 14:20
- **Archivos que toca:** public/js/ficha.js
- **Siguiente paso:** esperar `verificar` y `pantallas` en verde y fusionar

## Encargo del dueño

Lo que quedó del PR #23 («al ampliar la imagen deberá mostrar la tabla…») tras fusionarse su
retoma, el #24.

## Hecho

- `ficha.js`: el número de la leyenda sin `aria-label` (prohibido en un span sin rol).

## Falta

- CI y fusión.

## Decisiones y hallazgos

- Las anotaciones de fallos de e2e se retiraron de este PR: `pantallas.yml` ya convierte cada línea
  `FALLO` en `::error` (sexagesimosegunda entrega); repetirlo en `ayuda.js` las duplicaba.

## Verificación

- Pendiente de CI.
