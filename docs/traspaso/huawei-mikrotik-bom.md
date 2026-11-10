# Traspaso: huawei-mikrotik-bom

- **Tema:** Fase 2 de la auditoria (ADR-1, corte 5): las listas de Huawei y MikroTik al motor, y la version de motor de Aruba, Huawei y MikroTik
- **Rama:** claude/huawei-mikrotik-bom
- **Cuenta:** (no consta)
- **Estado:** reservado
- **Actualizado:** 2026-11-10 06:50
- **Archivos que toca:** public/js/huawei-motor.js, public/js/dimensionador-huawei-netengine.js, public/js/mikrotik-motor.js, public/js/dimensionador-mikrotik-routeros.js, public/js/aruba-reglas.js, public/js/dimensionador-aruba-edgeconnect.js, scripts/equivalencias/huawei-bom.js, scripts/equivalencias/mikrotik-bom.js, test/huawei-mikrotik-lineas-bom.test.js, test/e2e/e2e-trazabilidad-catalogo.js
- **Siguiente paso:** HuaweiMotor.lineasBom y MikrotikMotor.lineasBom sin DOM; VERSION_MOTOR en los tres; casos de equivalencia

## Encargo del dueño

<Las palabras del dueño, literales, y lo que se entendió de ellas.>

## Hecho

- <Lo terminado, con el commit que lo contiene.>

## Falta

- <Lo pendiente de este tema, en orden.>

## Decisiones y hallazgos

- Reservado pasando por alto los archivos de claude/aruba-lineas-bom, claude/juniper-motor-orden, claude/cisco-lineas-bom y claude/nokia-motores (`--aunque`): no son ramas paradas, son los cortes 1 a 4 de esta misma cadena (PR #167 a #170), sobre los que esta rama va apilada; el choque son los archivos de Aruba del #167.
- La medición de equivalencias vigila `aruba-bom` (por public/js/aruba-reglas.js), `aruba-eleccion` (por public/js/aruba-reglas.js), `aruba-estado` (por public/js/aruba-reglas.js): se corre en cada PR; un cambio a propósito se declara con `equivalencia-acepta: <caso>: <motivo>`.

- <Lo decidido y su porqué; lo medido; lo que no funcionó, para no repetirlo.>

## Verificación

- <Qué se corrió (`npm run verificar`, `auditar`, `pantallas`…) y con qué resultado.>
