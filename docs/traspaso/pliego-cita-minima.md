# Traspaso: pliego-cita-minima

- **Tema:** Cita mínima de 6 caracteres en el piloto «del pliego al escenario» (mejora aprobada)
- **Rama:** claude/pliego-cita-minima
- **Cuenta:** servicioiptv2025, sesión 01V8T7S92WvujFK1KCusavSu
- **Estado:** listo para fusionar
- **Actualizado:** 2026-10-27 13:20
- **Archivos que toca:** server/services/aiEscenario.js, test/ia-escenario.test.js
- **Siguiente paso:** PR con CI en verde, borrar este traspaso y fusionar; PENDIENTES y RELEVO van en el cierre conjunto de las mejoras

## Encargo del dueño

«Ejecuta las mejoras propuestas» (2026-10-27, 12:58).

## Hecho

- `MIN_CITA = 6` sobre la cita normalizada; prueba con un «40» suelto.

## Verificación

- `test/ia-escenario.test.js` 5/5 (con el SDK sustituido por un módulo vacío: esta prueba no llama a la red).
