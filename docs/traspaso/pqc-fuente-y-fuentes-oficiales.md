# Traspaso: pqc-fuente-y-fuentes-oficiales

- **Tema:** La fuente de la PQC enlazada a `fuentes.js` (mejora propuesta) y búsqueda de documentos oficiales para los pendientes de fuentes
- **Rama:** claude/elegant-pascal-7ymts7
- **Cuenta:** vladichakadc, sesión 01TxCQ3W2sHYVmimAdMKht3j
- **Estado:** en curso
- **Actualizado:** 2026-10-27 23:05
- **Archivos que toca:** server/seed/legacyData/cisco.js, server/seed/legacyData/aruba.js, server/seed/legacyData/fortinet.js, server/seed/legacyData/juniper.js, server/seed/legacyData/mikrotik.js, server/seed/legacyData/nokia.js, server/seed/legacyData/fuentes.js, test/pqc.test.js, .github/workflows/traer-cisco-huawei.yml
- **Siguiente paso:** leer lo traído en `fuente/pqc-4-2026-10-28` y cerrar solo lo que los documentos digan; después, el enlace en la ficha y en «Supuestos» cuando se fusione la rama que declara `ficha.js` y `bom.js`

## Encargo del dueño

«Ejecutas y buscar para solucionar pendientes de fuentes siempre oficiales, no especules ni asumas;
así mismo, ejecutar las mejoras propuestas». Se entiende: (1) buscar el documento oficial de cada
pendiente que espera uno, traerlo por Actions y cerrar solo lo que el documento diga literalmente;
(2) ejecutar las mejoras propuestas en `RELEVO.md`.

## Hecho

- Transporte: changelogs de RouterOS 7.21.x–7.23.x, notas de Junos 25.4R1, Feature Explorer 7502,
  ficha del 7220 IXR-D, roadmap quantum-safe de Cisco y novedades de AOS 10 (`baad318`), lanzado a
  `fuente/pqc-4-2026-10-28`.
- Mejora, parte de datos: `urls` en cada `pqc`/`pqcNo` de los seis catálogos, y la prueba que exige
  que cada URL sea una entrada de `fuentes.js` que respalde el campo y declare al equipo.

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
