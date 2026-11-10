# Traspaso: huawei-mikrotik-bom

- **Tema:** Fase 2 de la auditoria (ADR-1, corte 5): las listas de Huawei y MikroTik al motor, y la version de motor de Aruba, Huawei y MikroTik
- **Rama:** claude/huawei-mikrotik-bom
- **Cuenta:** (no consta)
- **Estado:** en curso
- **Actualizado:** 2026-11-10 06:50
- **Archivos que toca:** public/js/huawei-motor.js, public/js/dimensionador-huawei-netengine.js, public/js/mikrotik-motor.js, public/js/dimensionador-mikrotik-routeros.js, public/js/aruba-reglas.js, public/js/dimensionador-aruba-edgeconnect.js, scripts/equivalencias/huawei-bom.js, scripts/equivalencias/mikrotik-bom.js, test/huawei-mikrotik-lineas-bom.test.js, test/e2e/e2e-trazabilidad-catalogo.js
- **Siguiente paso:** HuaweiMotor.lineasBom y MikrotikMotor.lineasBom sin DOM; VERSION_MOTOR en los tres; casos de equivalencia

## Encargo del dueño

«Ejecuta fase 2 y fase 3» (2026-11-10): corte 5 de la fase 2 (ADR-1), las listas de Huawei y MikroTik al motor y la versión de motor de los que faltaban.

## Hecho

- `HuaweiMotor.lineasBom` (era `filasBom` de la página) y `MikrotikMotor.lineasBom` (el bloque de `renderBom()`), sin DOM.
- `VERSION_MOTOR` en `huawei-motor.js`, `mikrotik-motor.js` y `aruba-reglas.js`, a «Supuestos»: con Juniper, Cisco, Fortinet y Nokia, los ocho la declaran; el e2e de trazabilidad exige la de Cisco en el Excel.
- Equivalencias `huawei-bom` (1.800) y `mikrotik-bom` (1.380), 0 diferencias; `test/huawei-mikrotik-lineas-bom.test.js` (6).

## Falta

- PR, cierre y fusión (apilado sobre el #170).

## Decisiones y hallazgos

- Reservado pasando por alto los archivos de claude/aruba-lineas-bom, claude/juniper-motor-orden, claude/cisco-lineas-bom y claude/nokia-motores (`--aunque`): no son ramas paradas, son los cortes 1 a 4 de esta misma cadena (PR #167 a #170), sobre los que esta rama va apilada; el choque son los archivos de Aruba del #167.
- La medición de equivalencias vigila `aruba-bom` (por public/js/aruba-reglas.js), `aruba-eleccion` (por public/js/aruba-reglas.js), `aruba-estado` (por public/js/aruba-reglas.js): se corre en cada PR; un cambio a propósito se declara con `equivalencia-acepta: <caso>: <motivo>`.

- `npm run reservar` chocaba con los archivos de Aruba de la propia cadena (#167): se reservó con `--aunque` sobre las cuatro ramas de la cadena.

## Verificación

- `verificar` en verde (1.532); `equivalencia --todos` (9 casos) sin diferencias; e2e de Huawei (3), Aruba (8), `arranque`, `ciclo-excel` y `trazabilidad` en verde; contrastes `huawei`, `mikrotik`, `cotizador-bom` y `aruba-underlay` sin discrepancias.
