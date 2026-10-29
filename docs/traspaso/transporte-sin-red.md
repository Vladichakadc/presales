# Traspaso: el transporte de documentos, probado sin red

- **Tema:** mejora propuesta al cerrar el PR #54: ejercitar la lógica de `scripts/transporte/traer.js` en `npm run verificar` con un `fetch` de mentira
- **Rama:** claude/transporte-sin-red
- **Cuenta:** sesión de Claude del 2026-10-28 (cuenta del dueño)
- **Estado:** en curso
- **Actualizado:** 2026-10-28 21:35
- **Archivos que toca:** scripts/transporte/traer.js, test/transporte-traer.test.js, test/traer-exploracion.test.js, test/traer-pantalla-login.test.js
- **Siguiente paso:** comparar la corrida real (`fuente/transporte-sin-red-2026-10-28`) con `fuente/cisco-asr-2026-10-28`; si casa, cerrar y fusionar

## Encargo del dueño

«Ejecuta mejoras propuestas como un arquitecto senior con los Skills instalados» (2026-10-28, 21:00).

## Hecho

- `traer()` con lista, carpeta y fetch inyectables; el bucle, idéntico salvo esos dos nombres. Prueba `transporte-traer` (9 casos).

## Falta

- Refactor, prueba, corrida real por Actions y cierre.

## Decisiones y hallazgos

- Las cuatro mejoras van en cuatro ramas y PR, de menor a mayor riesgo.

## Verificación

- Pendiente.
