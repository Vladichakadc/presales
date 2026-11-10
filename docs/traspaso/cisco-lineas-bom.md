# Traspaso: cisco-lineas-bom

- **Tema:** Fase 2 de la auditoria (ADR-1, corte 3): la lista de materiales de Cisco al motor
- **Rama:** claude/cisco-lineas-bom
- **Cuenta:** (no consta)
- **Estado:** en curso
- **Actualizado:** 2026-11-10 06:21
- **Archivos que toca:** public/js/cisco-motor.js, public/js/dimensionador-cisco-catalyst8k.js, scripts/equivalencias/cisco-bom.js, test/cisco-lineas-bom.test.js
- **Siguiente paso:** CiscoMotor.lineasBom(ctx) sin DOM; renderBom solo pinta; caso de equivalencia con mutacion

## Encargo del dueño

«Ejecuta fase 2 y fase 3» (2026-11-10): corte 3 de la fase 2 (ADR-1), la lista de materiales de Cisco al motor.

## Hecho

- `CiscoMotor.lineasBom(ctx)` → `{ filas, avisosPuertos, avisosLic }`; la página calcula lo que lee del DOM y lo pasa.
- `scripts/equivalencias/cisco-bom.js` (2.610 casos, 0 diferencias) y `test/cisco-lineas-bom.test.js` (4 pruebas).

## Falta

- PR, cierre y fusión (apilado sobre el #168).

## Decisiones y hallazgos


- `firewallDe` resetea `FW_ELEGIDO` cuando el elegido deja de cumplir: se llama antes de armar las filas, y nada en medio lee ese estado.

## Verificación

- `verificar` en verde (1.521); `equivalencia --todos` sin diferencias; e2e de Cisco (3) y contrastes `cisco` y `cotizador-bom` en verde.
