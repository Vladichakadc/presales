# Traspaso: aruba-lineas-bom

- **Tema:** Fase 2 de la auditoria (ADR-1, corte 1): la lista de materiales de Aruba fuera de renderBom()
- **Rama:** claude/aruba-lineas-bom
- **Cuenta:** (no consta)
- **Estado:** reservado
- **Actualizado:** 2026-11-10 05:31
- **Archivos que toca:** public/js/aruba-reglas.js, public/js/dimensionador-aruba-edgeconnect.js, scripts/equivalencias/aruba-bom.js, test/aruba-lineas-bom.test.js
- **Siguiente paso:** ArubaReglas.lineasBom(ctx) sin DOM; renderBom solo pinta; caso de equivalencia con mutacion

## Encargo del dueño

<Las palabras del dueño, literales, y lo que se entendió de ellas.>

## Hecho

- <Lo terminado, con el commit que lo contiene.>

## Falta

- <Lo pendiente de este tema, en orden.>

## Decisiones y hallazgos

- La medición de equivalencias vigila `aruba-eleccion` (por public/js/aruba-reglas.js), `aruba-estado` (por public/js/aruba-reglas.js): se corre en cada PR; un cambio a propósito se declara con `equivalencia-acepta: <caso>: <motivo>`.

- <Lo decidido y su porqué; lo medido; lo que no funcionó, para no repetirlo.>

## Verificación

- <Qué se corrió (`npm run verificar`, `auditar`, `pantallas`…) y con qué resultado.>
