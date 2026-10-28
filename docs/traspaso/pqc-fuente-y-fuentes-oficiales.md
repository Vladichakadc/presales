# Traspaso: pqc-fuente-y-fuentes-oficiales

- **Tema:** La fuente de la PQC enlazada a `fuentes.js` (mejora propuesta) y búsqueda de documentos oficiales para los pendientes de fuentes
- **Rama:** claude/elegant-pascal-7ymts7
- **Cuenta:** vladichakadc, sesión 01TxCQ3W2sHYVmimAdMKht3j
- **Estado:** en curso
- **Actualizado:** 2026-10-28 07:20
- **Archivos que toca:** server/seed/legacyData/cisco.js, server/seed/legacyData/aruba.js, server/seed/legacyData/fortinet.js, server/seed/legacyData/juniper.js, server/seed/legacyData/mikrotik.js, server/seed/legacyData/nokia.js, server/seed/legacyData/fuentes.js, test/pqc.test.js, .github/workflows/traer-cisco-huawei.yml, test/workflows-node-e.test.js, public/js/ficha.js, public/js/bom.js, test/bom-supuestos.test.js, test/e2e/e2e-pqc-supuestos.js, public/dimensionador-mikrotik-routeros.html
- **Siguiente paso:** verificar entero (verificar, auditar, producción, pantallas, contraste, e2e, puerta), abrir el PR y el commit de cierre con su número

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

- Los tres MikroTik que faltaban, con el changelog oficial que los nombra: RB1100AHx4 (7.23),
  PowerBox Pro (7.21.3) y hEX PoE lite (7.24.2). Los 20 MikroTik traen ya la PPK.
- El transporte: una comilla doble cortaba el `node -e "..."` y el script pasó el tope de 128 KiB
  de un argumento; va por la entrada estándar, y la prueba vigila las dos cosas.

## Falta

- Mejora «la fuente de la PQC, enlazada a `fuentes.js`»: datos (`url` en cada `pqc`/`pqcNo`) y
  prueba ahora; el enlace en la ficha (`ficha.js`) y en «Supuestos» (`bom.js`) **después** de que
  se fusione `claude/fotos-excel-fuera-venta-casillas`, que declara esos dos archivos.
- Pendientes de fuentes: buscar, traer por Actions, cerrar con cita literal.

## Decisiones y hallazgos

- Siguen en «no consta», con lo leído: Juniper SRX4100 y de sucursal (Junos 25.4R1: su PQC es la
  firma de imágenes; el Feature Explorer no cambió), Nokia 7220 IXR-D (ficha R26 sin MACsec),
  Meraki MX y G2-MX (roadmap de Cisco de ago-2026: de Meraki solo el TLS del Dashboard), y los
  gateways AOS: AOS-10.8.0.0 trae «ppk-mandatory» en IKEv2 sin decir en qué equipo; la página de
  gateways soportados da AOS-10 sin última versión en 7000, 7200, 9000, 9100 y 9200. Lo cierra la
  referencia de CLI de AOS-10 que lo nombre en el gateway.

- La otra mejora propuesta, «la foto de producto también en el Excel», la lleva otra sesión
  (rama `claude/fotos-excel-fuera-venta-casillas`, cuenta servicioiptv2025): no se toma.

## Verificación

- (pendiente)
