# Traspaso: contrato-motores

- **Tema:** La misma firma evaluar(escenario, catalogo, opciones) y el mismo sobre en los ocho motores, con una envoltura por fabricante y una prueba de contrato; Aruba gana evaluar en su motor (orden y recomendado salen de la pagina)
- **Rama:** claude/contrato-motores
- **Cuenta:** sesion de Claude Code de la auditoria (session_016ruRWEjxhbmKTGnagDrUvb)
- **Estado:** reservado
- **Actualizado:** 2026-11-12 12:33
- **Archivos que toca:** server/services/contratoMotores.js, test/contrato-motores.test.js, public/js/aruba-reglas.js, public/js/dimensionador-aruba-edgeconnect.js, test/aruba-eleccion-modelo.test.js, scripts/equivalencias/aruba-orden.js
- **Siguiente paso:** Escribir ArubaReglas.evaluar con su caso de equivalencia, las ocho envolturas y la prueba de contrato

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
