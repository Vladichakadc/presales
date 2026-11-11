# Traspaso: fortinet-version-motor

- **Tema:** subir VERSION_MOTOR de fortinet-motor a 7.3.0: el PR #166 cambió reglas (FortiOS 8.0) y la dejó en 7.2.0
- **Rama:** claude/fortinet-version-motor
- **Cuenta:** servicioiptv2025@gmail.com (sesión de Claude Code en la nube)
- **Estado:** en curso
- **Actualizado:** 2026-11-11 06:14
- **Archivos que toca:** public/js/fortinet-motor.js, test/fortinet-fortios-8.test.js
- **Siguiente paso:** esperar `verificar` y `pantallas` en el PR; en verde, commit de cierre y fusionar

## Encargo del dueño

«Continuar», tras el PR #166 («Trae las características de la versión 8.0.2 al dimensionador»). Se entendió: rematar esa entrega. El PR #166 cambió reglas del motor de Fortinet y dejó `VERSION_MOTOR` en 7.2.0; CLAUDE.md dice que se sube al cambiar una regla, porque «Supuestos» la lleva al Excel.

## Hecho

- `VERSION_MOTOR` 7.3.0 con su nota, y una prueba que frena una versión sin nota.

## Falta

- CI en verde, cierre y fusión.

## Decisiones y hallazgos

- Nadie compara la versión del motor con un valor escrito (ni pruebas ni servidor): subirla no rompe huellas guardadas (la huella es del escenario).

## Verificación

- `node --test test/fortinet-fortios-8.test.js test/fortinet-*.test.js` en local.
