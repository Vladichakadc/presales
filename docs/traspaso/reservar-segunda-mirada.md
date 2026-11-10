# Traspaso: reservar-segunda-mirada

- **Tema:** npm run reservar vuelve a mirar después de empujar: manda la reserva más antigua también sin --en-esta-rama (propuesta al cerrar el PR #160)
- **Rama:** claude/reservar-segunda-mirada
- **Cuenta:** (no consta)
- **Estado:** en revisión (PR abierto)
- **Actualizado:** 2026-11-09 23:14
- **Archivos que toca:** scripts/reservar.js, test/reservar.test.js
- **Siguiente paso:** CI del PR y commit de cierre

## Encargo del dueño

«Ejecuta pendientes como arquitecto senior» (2026-11-09): la mejora propuesta al cerrar el PR #160.

## Hecho

- La segunda mirada tras empujar corre también sin `--en-esta-rama`; la que pierde deja su rama cedida (`traspasoCedido`, `cederReserva`).

## Falta

- Cierre: CLAUDE.md, entrega y relevo.

## Decisiones y hallazgos


- Ceder en vez de borrar la rama: el proxy de git a veces corta el borrado de ramas remotas (pasó hoy con claude/skus-fortinet-variantes).

## Verificación

- `node --test test/reservar.test.js`: 20/20; sin la segunda mirada en la reserva normal, la carrera nueva falla. eslint limpio.
