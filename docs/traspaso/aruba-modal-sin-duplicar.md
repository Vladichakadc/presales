# Traspaso: aruba-modal-sin-duplicar

- **Tema:** Que el modal de accesorios de Aruba no duplique lo que el motor ya pone (mejora propuesta al cerrar el PR #167)
- **Rama:** claude/aruba-modal-sin-duplicar
- **Cuenta:** servicioiptv2025@gmail.com
- **Estado:** reservado
- **Actualizado:** 2026-11-11 06:15
- **Archivos que toca:** public/js/aruba-reglas.js, test/aruba-lineas-bom.test.js
- **Siguiente paso:** empezar: el tema está reservado y todavía no tiene código

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
