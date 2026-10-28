# Traspaso: pqc-fuente-y-fuentes-oficiales

- **Tema:** La fuente de la PQC enlazada a `fuentes.js` (mejora propuesta) y búsqueda de documentos oficiales para los pendientes de fuentes
- **Rama:** claude/elegant-pascal-7ymts7
- **Cuenta:** vladichakadc, sesión 01TxCQ3W2sHYVmimAdMKht3j
- **Estado:** en curso
- **Actualizado:** 2026-10-27 22:40
- **Archivos que toca:** server/seed/legacyData/cisco.js, server/seed/legacyData/aruba.js, server/seed/legacyData/fortinet.js, server/seed/legacyData/juniper.js, server/seed/legacyData/mikrotik.js, server/seed/legacyData/nokia.js, server/seed/legacyData/fuentes.js, test/pqc.test.js, .github/workflows/traer-cisco-huawei.yml
- **Siguiente paso:** buscar los documentos oficiales de los pendientes de PQC (SRX, MikroTik, AOS, Meraki, Nokia) y traerlos por Actions a una rama `fuente/*` nueva

## Encargo del dueño

«Ejecutas y buscar para solucionar pendientes de fuentes siempre oficiales, no especules ni asumas;
así mismo, ejecutar las mejoras propuestas». Se entiende: (1) buscar el documento oficial de cada
pendiente que espera uno, traerlo por Actions y cerrar solo lo que el documento diga literalmente;
(2) ejecutar las mejoras propuestas en `RELEVO.md`.

## Hecho

- (nada todavía)

## Falta

- Mejora «la fuente de la PQC, enlazada a `fuentes.js`»: datos (`url` en cada `pqc`/`pqcNo`) y
  prueba ahora; el enlace en la ficha (`ficha.js`) y en «Supuestos» (`bom.js`) **después** de que
  se fusione `claude/fotos-excel-fuera-venta-casillas`, que declara esos dos archivos.
- Pendientes de fuentes: buscar, traer por Actions, cerrar con cita literal.

## Decisiones y hallazgos

- La otra mejora propuesta, «la foto de producto también en el Excel», la lleva otra sesión
  (rama `claude/fotos-excel-fuera-venta-casillas`, cuenta servicioiptv2025): no se toma.

## Verificación

- (pendiente)
