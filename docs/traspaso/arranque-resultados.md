# Traspaso: el resultado al abrir la página

- **Tema:** batería e2e que compara el resultado recién abierta la página con el del botón «Actualizar», en tres arranques
- **Rama:** claude/arranque-resultados
- **Cuenta:** servicioiptv2025@gmail.com (sesión de Claude Code en la nube)
- **Estado:** en curso
- **Actualizado:** 2026-10-31 07:45
- **Archivos que toca:** test/e2e/e2e-arranque.js, test/e2e/resultados.js, test/e2e/e2e-campos-en-linea.js
- **Siguiente paso:** leer los avisos `RESUMEN - ` y los fallos `e2e` de la comprobación `pantallas` del PR; arreglar la página que arranque desfasada

## Encargo del dueño

«Ejecuta la mejora propuesta» (2026-10-31), la del cierre del PR #79.

## Hecho

- `e2e-arranque.js`: vacía, enlace compartido (caudal, una casilla y la segunda opción del primer botón segmentado) y recarga; A (al abrir) contra C (tras el botón).
- `resultados.js`: páginas, escenario de partida, lectura de resultados y diferencia, compartidos con `e2e-campos-en-linea.js`.
- Starlink en local: 3 de 3; sabotaje (un valor puesto tras el `load` sin eventos): 3 fallos, como debe.

## Falta

- Medición en CI de las otras ocho y el arreglo de lo que salga.

## Decisiones y hallazgos

- `estado.js` ya no guarda en localStorage (2026-09-10): los arranques reales son vacía, enlace y recarga. El perfil multi-sede cargado es una acción del usuario, no un arranque: queda fuera.

## Verificación

- Starlink en local, las dos baterías: TODO VERDE.
