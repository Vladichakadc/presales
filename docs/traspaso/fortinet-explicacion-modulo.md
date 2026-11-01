# Traspaso: fortinet-explicacion-modulo

- **Tema:** fase 3.2, primera entrega: la explicación del resultado de Fortinet (descartes, fuera de venta que cumplen, licencia HA), de la página a `fortinet-explicacion.js`
- **Rama:** claude/fortinet-explicacion-modulo
- **Cuenta:** servicioiptv2025@gmail.com (sesión de Claude Code en la nube)
- **Estado:** en curso
- **Actualizado:** 2026-10-31 22:25
- **Archivos que toca:** public/js/fortinet-explicacion.js, public/js/dimensionador-fortinet-fortigate.js, public/dimensionador-fortinet-fortigate.html, eslint.config.js, test/fortinet-explicacion.test.js, test/fortinet-ha-licencia.test.js, test/fortinet-combo-fuera-venta.test.js
- **Siguiente paso:** esperar `verificar` y `pantallas` (contraste de Fortinet y baterías e2e); en verde, cierre y fusión

## Encargo del dueño

«Ejecuta la fase # 3» (2026-10-31). Primera entrega de la 3.2.

## Hecho

- `resumenDescartes`, `fueraDeVentaQueCumplen`, `licenciaHa` y `RESTRICCION_N` pasan a un módulo
  UMD nuevo (`FortinetExplicacion`); la página conserva los nombres como envoltorios de una línea.
  El motor y sus reglas (arquitectura aprobada el 2026-10-07) no se tocan.
- Equivalencia: las funciones de `main` contra las del módulo en 6.355 casos (58 FortiGate × 3
  modos × licencia cotizada o no, y 3.000 resultados al azar): 0 diferencias; dos mutaciones, 40 y
  374 diferencias.
- Las dos pruebas que recortaban esas funciones del código de la página ejecutan ahora su
  envoltorio con el módulo real.

## Falta

- CI y fusión.

## Decisiones y hallazgos

- La página de Fortinet ya no calcula por diseño (todo pasa por `FortinetMotor.evaluar`): de sus
  2.141 líneas solo ~308 son puras, casi todas texto que explica el resultado. Lo que queda puro
  (`porQueDe`, `porQueSinCandidato`) lee una docena de globales de la página; va en otra entrega.
- Módulo nuevo y no `fortinet-reglas.js`: esto es explicación del resultado, no una regla del motor.

## Verificación

- `node --test` de las pruebas de Fortinet tocadas y la nueva en verde; el conjunto sin
  dependencias, los mismos 29 fallos que `main`. `verificar` y `pantallas`, en CI.
