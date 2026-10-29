# Traspaso: override-ciclo-un-clic

- **Tema:** del override por ciclo de vida a ampliación o renovación en un clic (Fortinet)
- **Rama:** claude/override-ciclo-un-clic
- **Cuenta:** servicioiptv2025@gmail.com (sesión de Claude)
- **Estado:** en curso
- **Actualizado:** 2026-10-28 21:40
- **Archivos que toca:** public/js/dimensionador-fortinet-fortigate.js, test/e2e/e2e-fortinet-rediseno.js, test/fortinet-override-ciclo.test.js
- **Siguiente paso:** esperar CI del PR; commit de cierre (PENDIENTES, RELEVO, CLAUDE.md) y fusionar.

## Encargo del dueño

«Ejecuta las mejoras propuestas como un arquitecto senior con las Skills instaladas» (2026-10-28). Esta es la propuesta al cerrar el PR #51.

## Hecho

- Caja del override: si el equipo cumple y solo lo aparta `CICLO_VIDA`, dice «cumple este escenario, pero está fuera de venta» y ofrece «Es una ampliación» y «Es una renovación de servicios» (`accion: 'motivo-ciclo'`). El clic fija el tipo de compra (reevaluación inmediata) y lleva el foco al primer dato que falta: la serie instalada (renovación) o la justificación.

## Falta

- CI y cierre.

## Decisiones y hallazgos

- No se ofrece si además hay déficit de capacidad: cambiar el tipo de compra no lo arregla.
- El clic nunca escribe la justificación: el motor la sigue exigiendo y la cotización no sale sin ella.
- graphify no se pudo usar: PyPI bloqueado por el proxy de egreso en esta sesión.

## Verificación

- `test/fortinet-override-ciclo.test.js` (4) contra el motor real; T21 de `e2e-fortinet-rediseno.js` conduce el clic en Chromium (en CI).
