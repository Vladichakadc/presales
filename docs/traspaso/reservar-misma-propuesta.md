# Traspaso: reservar-misma-propuesta

- **Tema:** npm run reservar avisa cuando otro tema en curso cita la misma «propuesta al cerrar el PR #N» (mejora propuesta al cerrar el PR #198)
- **Rama:** claude/reservar-misma-propuesta
- **Cuenta:** servicioiptv2025@gmail.com
- **Estado:** en curso
- **Actualizado:** 2026-11-12 15:45
- **Archivos que toca:** scripts/reservar.js, test/reservar.test.js, docs/traspaso/README.md
- **Siguiente paso:** abrir el PR, esperar `verificar` y `pantallas`, y cerrar con su entrega

## Encargo del dueño

«ejecuta los pendientes que puedas cerrar y ejecuta la mejora propuesta como un arquitecto senior con las Skills instaladas». La mejora propuesta al cerrar el PR #198: que `npm run reservar` avise cuando otro tema en curso cita la misma «propuesta al cerrar el PR #N».

## Hecho

- `propuestasCitadas`, `textoDeEncargo`, `mismaPropuesta` y `--propuesta <N>` en `scripts/reservar.js`; aviso antes y después de empujar; seis pruebas nuevas en `test/reservar.test.js` (26 en verde; la mutación de control deja 3 en rojo).

## Falta

- Fusionar y cerrar.

## Decisiones y hallazgos


- <Lo decidido y su porqué; lo medido; lo que no funcionó, para no repetirlo.>

## Verificación

- <Qué se corrió (`npm run verificar`, `auditar`, `pantallas`…) y con qué resultado.>
