# Traspaso: foto a color de cada Secure Router, Catalyst 8000, ISR y Meraki MX

- **Tema:** mejora propuesta al cerrar el PR #52: la foto a color de cada modelo Cisco desde su página en cisco.com
- **Rama:** claude/fotos-modelo-cisco
- **Cuenta:** sesión de Claude del 2026-10-28 (cuenta del dueño)
- **Estado:** en curso
- **Actualizado:** 2026-10-28 12:15
- **Archivos que toca:** .github/workflows/traer-cisco-huawei.yml, public/data/cisco-vistas-equipos.json, public/img/equipos/cs-*, test/cisco-vistas-equipos.test.js
- **Siguiente paso:** sacar la lista y el script del transporte del YAML (`scripts/transporte/`), la otra mejora aprobada

## Encargo del dueño

«Ejecuta los pendientes y las mejoras propuestas y súbelo a producción.» La mejora del PR #52: la foto a
color de los Secure Router, Catalyst 8200/8300, ISR y MX67/MX68 que no la tienen.

## Hecho

- Entradas de transporte de las páginas de familia, serie y modelo.

## Falta

- Hecho: MX67, MX68 y C8355-G2-MX con foto propia (corrida 40708139056). Las páginas de serie de los Secure Router solo repiten lo ya servido; las de Catalyst 8300 e ISR traen fotos de familia sin rótulo de modelo, que no se asignan.

## Decisiones y hallazgos

- Ninguna todavía.

## Verificación

- Pendiente.
