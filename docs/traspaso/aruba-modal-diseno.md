# Traspaso: aruba-modal-diseno

- **Tema:** Que el modal de accesorios de Aruba diga qué ya pone el diseño (mejora propuesta al cerrar el PR #179)
- **Rama:** claude/aruba-modal-diseno
- **Cuenta:** servicioiptv2025@gmail.com
- **Estado:** reservado
- **Actualizado:** 2026-11-11 22:55
- **Archivos que toca:** public/js/aruba-reglas.js, public/js/dimensionador-aruba-edgeconnect.js, test/aruba-lineas-bom.test.js, test/e2e/e2e-aruba-modal-diseno.js
- **Siguiente paso:** CI verde (la batería `e2e-aruba-modal-diseno` corre en `pantallas`), commit de cierre con su entrega y fusión

## Encargo del dueño

<Las palabras del dueño, literales, y lo que se entendió de ellas.>

## Hecho

- <Lo terminado, con el commit que lo contiene.>

## Falta

- <Lo pendiente de este tema, en orden.>

## Decisiones y hallazgos

- La medición de equivalencias vigila `aruba-bom` (por public/js/aruba-reglas.js), `aruba-eleccion` (por public/js/aruba-reglas.js), `aruba-estado` (por public/js/aruba-reglas.js): se corre en cada PR; un cambio a propósito se declara con `equivalencia-acepta: <caso>: <motivo>`.

- <Lo decidido y su porqué; lo medido; lo que no funcionó, para no repetirlo.>

## Verificación

- <Qué se corrió (`npm run verificar`, `auditar`, `pantallas`…) y con qué resultado.>
