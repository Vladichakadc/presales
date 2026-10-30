# Traspaso: aruba-tier-enlace

- **Tema:** el tier de caudal de Aruba (`#selTier`) en un enlace: medir si se pierde y, si se pierde, `opcionesTarde`
- **Rama:** claude/aruba-tier-enlace
- **Cuenta:** servicioiptv2025@gmail.com (sesión 01V8T7S7ZbQULfHYAyefitrr)
- **Estado:** en curso
- **Actualizado:** 2026-10-30 08:30
- **Archivos que toca:** test/e2e/e2e-aruba-tier-enlace.js, public/js/dimensionador-aruba-edgeconnect.js
- **Siguiente paso:** leer el resultado de la batería en CI sobre el primer commit (solo la prueba); si está en rojo, declarar `selTier` en `opcionesTarde`.

## Encargo del dueño

«Ejecuta las mejoras propuestas»: la del cierre del PR #80, «el tier de Aruba en el enlace»,
que pedía medirlo antes de cambiar nada.

## Hecho

- `test/e2e/e2e-aruba-tier-enlace.js`, subida sola para medir.

## Decisiones y hallazgos

- Por el código: `#selTier` llega vacío del HTML y `populateSelects` lo rellena una vez, con el
  catálogo; su opción por defecto es `auto`.
