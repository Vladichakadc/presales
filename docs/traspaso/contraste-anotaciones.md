# Traspaso: los fallos del contraste como anotaciones

- **Tema:** cada fallo del contraste, en una línea que `pantallas.yml` publica como anotación de la comprobación
- **Rama:** claude/contraste-anotaciones
- **Cuenta:** servicioiptv2025@gmail.com (sesión 01V8T7S92WvujFK1KCusavSu)
- **Estado:** en curso
- **Actualizado:** 2026-10-31 10:40
- **Archivos que toca:** scripts/contraste-motor.js, scripts/contraste.js, .github/workflows/pantallas.yml, test/contraste-anotaciones.test.js
- **Siguiente paso:** CI verde, commit de cierre con el número del PR y fusión

## Encargo del dueño

La mejora propuesta al cerrar el PR #88, dentro del encargo «ejecuta los pendientes que puedas cerrar y ejecuta la mejora propuesta».

## Hecho

- `lineaFallo` en el motor; una línea por escenario o comprobación que falla, por la cobertura incoherente y por un caso que revienta; el paso «Publicar el contraste» la convierte en `::error title=contraste::`.

## Falta

- CI y fusión.

## Decisiones y hallazgos

- El informe de siempre no cambia: la línea se añade debajo. Diez anotaciones como mucho (el tope de GitHub por paso).

## Verificación

- `test/contraste-anotaciones.test.js` (6 pruebas; saboteada, se pone en rojo); pruebas de workflows y de contraste en verde.
