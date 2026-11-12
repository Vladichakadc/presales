# Traspaso: cisco-orden-motor

- **Tema:** Llevar al motor de Cisco el orden por ciclo de vida y el recomendado (mejora propuesta al cerrar el PR #194): evaluar gana opciones {rango, recomendar}, y la pagina y la envoltura solo leen
- **Rama:** claude/cisco-orden-motor
- **Cuenta:** sesion de Claude Code de la auditoria (session_016ruRWEjxhbmKTGnagDrUvb)
- **Estado:** reservado
- **Actualizado:** 2026-11-12 17:39
- **Archivos que toca:** public/js/cisco-motor.js, public/js/dimensionador-cisco-catalyst8k.js, server/services/contratoMotores.js, test/contrato-motores.test.js, scripts/equivalencias/cisco-orden.js
- **Siguiente paso:** Escribir el orden en cisco-motor.js con su caso de equivalencia

## Encargo del dueño

<Las palabras del dueño, literales, y lo que se entendió de ellas.>

## Hecho

- <Lo terminado, con el commit que lo contiene.>

## Falta

- <Lo pendiente de este tema, en orden.>

## Decisiones y hallazgos

- La medición de equivalencias vigila `cisco-bom` (por public/js/cisco-motor.js): se corre en cada PR; un cambio a propósito se declara con `equivalencia-acepta: <caso>: <motivo>`.

- <Lo decidido y su porqué; lo medido; lo que no funcionó, para no repetirlo.>

## Verificación

- <Qué se corrió (`npm run verificar`, `auditar`, `pantallas`…) y con qué resultado.>
