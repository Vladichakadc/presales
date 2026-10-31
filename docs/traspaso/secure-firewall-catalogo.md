# Traspaso: secure-firewall-catalogo

- **Tema:** el Cisco Secure Firewall 1200/3100/4200 con ficha completa y en el portal (decisión del dueño del 2026-10-31: «Sí, ficha completa»)
- **Rama:** claude/secure-firewall-catalogo
- **Cuenta:** servicioiptv2025@gmail.com (sesión de Claude Code)
- **Estado:** F1 hecha y empujada; falta PR, cierre y fusión
- **Actualizado:** 2026-10-31 07:30
- **Archivos que toca:** server/seed/legacyData/cisco.js, server/seed/legacyData/indexPR.js, server/seed/legacyData/fuentes.js, public/js/index.js, public/js/calculadora.js, test/secure-firewall-catalogo.test.js
- **Siguiente paso:** F1 (esta rama): los 14 modelos en el portal con los datos de hardware de sus fichas y los lectores de la calculadora. Después F2 (figuras de las fichas, por Actions) y F3 (ficha en el dimensionador Cisco), cada una en su rama.

## Encargo del dueño

«Ejecuta pendientes y mejora propuesta»; a la pregunta de si el Secure Firewall entra al catálogo: «Sí, ficha completa».

## Plan

- F1: portal y calculadora. Datos de hardware de las tablas 3, 4, 5, 10 y 11 (1200), 4 (3100) y 3 (4200) de las fichas traídas el 2026-10-21 (rama fuente/cisco-propuestas-2026-10-21).
- F2: figuras: las imágenes de las fichas (renditions de cisco.com, con su alt) por traer-cisco-huawei.yml, WebP sin pérdida y pie literal.
- F3: la ficha del firewall dedicado en el dimensionador Cisco, con FICHA, y su e2e.
- Sin precio: no hay lista oficial en el repositorio; «Consultar».
