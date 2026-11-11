# Traspaso: aruba-modal-sin-duplicar

- **Tema:** Que el modal de accesorios de Aruba no duplique lo que el motor ya pone (mejora propuesta al cerrar el PR #167)
- **Rama:** claude/aruba-modal-sin-duplicar
- **Cuenta:** servicioiptv2025@gmail.com
- **Estado:** en curso
- **Actualizado:** 2026-11-11 06:40
- **Archivos que toca:** public/js/aruba-reglas.js, test/aruba-lineas-bom.test.js
- **Siguiente paso:** CI verde (con `equivalencia-acepta: aruba-bom`), commit de cierre con su entrega y fusión

## Encargo del dueño

«Continuar», dentro del encargo «ejecuta los pendientes que puedas cerrar y ejecuta la mejora propuesta». La mejora del PR #175 la lleva el PR #176 de otra sesión; esta es la propuesta sin decidir de `RELEVO.md` que nadie tenía tomada y se puede medir aquí (cierre del PR #167).

## Hecho

- `ArubaReglas.lineasBom`: las filas del modal entran al final, sin las que el motor soltó; `VERSION_MOTOR` 1.0.1; tres pruebas nuevas en `test/aruba-lineas-bom.test.js` (dos fallan con el código de `main`).

## Falta

- <Lo pendiente de este tema, en orden.>

## Decisiones y hallazgos

- La medición de equivalencias vigila `aruba-bom` (por public/js/aruba-reglas.js), `aruba-eleccion` (por public/js/aruba-reglas.js), `aruba-estado` (por public/js/aruba-reglas.js): se corre en cada PR; un cambio a propósito se declara con `equivalencia-acepta: <caso>: <motivo>`.

- <Lo decidido y su porqué; lo medido; lo que no funcionó, para no repetirlo.>

## Verificación

- <Qué se corrió (`npm run verificar`, `auditar`, `pantallas`…) y con qué resultado.>
