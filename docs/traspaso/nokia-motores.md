# Traspaso: nokia-motores

- **Tema:** Fase 2 de la auditoria (ADR-1, corte 4): Nokia 7750 y 7220 con motor propio
- **Rama:** claude/nokia-motores
- **Cuenta:** (no consta)
- **Estado:** en curso
- **Actualizado:** 2026-11-10 06:32
- **Archivos que toca:** public/js/nokia-sr-motor.js, public/js/nokia-fabric-motor.js, public/js/dimensionador-nokia-7750sr.js, public/js/dimensionador-nokia-7220ixr.js, public/dimensionador-nokia-7750sr.html, public/dimensionador-nokia-7220ixr.html, scripts/equivalencias/nokia-sr.js, scripts/equivalencias/nokia-fabric.js, test/nokia-motores.test.js, test/nokia-agregacion.test.js, test/nokia-puertos.test.js
- **Siguiente paso:** NokiaSrMotor y NokiaFabricMotor (UMD) con el calculo de las paginas, orden explicito y version; casos de equivalencia

## Encargo del dueño

«Ejecuta fase 2 y fase 3» (2026-11-10): corte 4 de la fase 2 (ADR-1), Nokia 7750 y 7220 con motor propio.

## Hecho

- `NokiaSrMotor` (nokia-sr-motor.js) y `NokiaFabricMotor` (nokia-fabric-motor.js), con el cálculo que vivía en las páginas, orden explícito y `VERSION_MOTOR`; las páginas y sus HTML los cargan.
- Equivalencias `nokia-sr` (2.016 casos) y `nokia-fabric` (500), 0 diferencias; `test/nokia-motores.test.js`.

## Falta

- PR, cierre y fusión (apilado sobre el #169).

## Decisiones y hallazgos


- `window.NOKIA_SR` se conserva para las pruebas, apuntando al motor (`evaluar` es el `filtrar` de antes).
- El 7220 no tiene caso de contraste: su motor sale «sin conducir», como la página antes.

## Verificación

- `verificar` en verde (1.526); e2e de Nokia, `arranque` y `campos-en-linea` en verde; `contraste --todos` (11 casos) sin discrepancias.
