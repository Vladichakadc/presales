# Traspaso: licencia-unica-ha

- **Tema:** la licencia FortiGuard única del par activo-pasivo, cotizada en el BOM de Fortinet
- **Rama:** claude/licencia-unica-ha
- **Cuenta:** servicioiptv2025@gmail.com (sesión de Claude)
- **Estado:** en curso
- **Actualizado:** 2026-10-28 22:30
- **Archivos que toca:** server/seed/legacyData/fortinet.js, public/js/fortinet-motor.js, public/js/fortinet-reglas.js, public/js/dimensionador-fortinet-fortigate.js, public/dimensionador-fortinet-fortigate.html, test/fortinet-ha-licencia.test.js, test/fortinet-ha-licencia-bom.test.js, test/e2e/e2e-fortinet-rediseno.js
- **Siguiente paso:** esperar CI del PR; commit de cierre (PENDIENTES, RELEVO, CLAUDE.md) y fusionar.

## Encargo del dueño

«Ejecuta las mejoras propuestas como un arquitecto senior con las Skills instaladas» (2026-10-28). Esta es la propuesta al cerrar el PR #56.

## Hecho

- Casilla «Licencia FortiGuard única del par» (`comercial.haLicenciaUnica`), visible solo en activo-pasivo y cuando se compran los equipos.
- `lineasComerciales`: con la casilla y todo lo que la guía exige (serie declarada, SKU de HA en la lista firmada, compra de equipos, Enterprise/UTP/ATP con SKU), 2 × SKU de HA con su precio de la lista y un solo bundle; aviso `info` con el ahorro. Si falta algo, sigue por nodo con aviso `warning` que dice por qué. Las líneas por unidad a la carta siguen por unidad con aviso.
- Huella: el campo solo existe cuando vale `true` (`clonar` acepta `undefined`), así los escenarios guardados no cambian de huella.

## Falta

- CI y cierre.

## Decisiones y hallazgos

- Texto leído de la copia oficial (rama fuente/transporte-1-2026-10-28): «a single order» de Enterprise, UTP o ATP registrado al vSN; «A la carte SKUs are not supported, and cannot be registered to the vSN». El FortiCare Premium va en ese bundle; la mejora a Elite y los servicios a la carta no se deciden: siguen por unidad y se dice.
- graphify no se pudo usar: PyPI bloqueado por el proxy de egreso en esta sesión.

## Verificación

- `test/fortinet-ha-licencia-bom.test.js` (5) y `test/fortinet-ha-licencia.test.js` contra el motor y la página; bloque HA-UNICA en `e2e-fortinet-rediseno.js` (CI). Batería completa: las mismas fallas que main (sin node_modules aquí).
