# Traspaso: perfiles multi-sede en Juniper y Nokia 7750

- **Tema:** mejora propuesta al cerrar el PR #50: los perfiles multi-sede también en Juniper y Nokia 7750
- **Rama:** claude/perfiles-juniper-nokia
- **Cuenta:** sesión de Claude del 2026-10-28 (cuenta del dueño)
- **Estado:** listo para fusionar
- **Actualizado:** 2026-10-28 13:30
- **Archivos que toca:** public/dimensionador-juniper-srx.html, public/js/dimensionador-juniper-srx.js, public/dimensionador-nokia-7750sr.html, public/js/dimensionador-nokia-7750sr.js, public/js/bom.js, test/bom-perfiles.test.js, test/e2e/e2e-perfiles-juniper-nokia.js
- **Siguiente paso:** abrir el PR, cerrar PENDIENTES, RELEVO y CLAUDE.md y fusionar

## Encargo del dueño

«Sí, hazlo», sobre la mejora propuesta al cerrar el PR #50.

## Hecho

- Panel de perfiles y consolidado en las dos páginas; Nokia guarda con la clave `nokia-sr`.

## Falta

- El cierre.

## Decisiones y hallazgos

- La clave de Nokia es `nokia-sr` (su ruta de catálogo); el consolidado la enseña como «nokia».

## Verificación

- verificar 1.204, auditar, e2e completo, pantallas 17/17, puerta, contraste nokia-sr.
