# Traspaso: las entregas, una por archivo

- **Tema:** cada entrega en `docs/entregas/AAAA-MM-DD-pr-N.md` en vez de arriba de PENDIENTES.md y RELEVO.md
- **Rama:** claude/entregas-por-archivo
- **Cuenta:** servicioiptv2025@gmail.com (sesión 01V8T7S92WvujFK1KCusavSu)
- **Estado:** en curso
- **Actualizado:** 2026-10-31 18:10
- **Archivos que toca:** docs/entregas/, scripts/entregas.js, package.json (script `entregas`), test/relevo.test.js, test/entregas.test.js, docs/traspaso/README.md; al fusionar, PENDIENTES.md, RELEVO.md y CLAUDE.md
- **Siguiente paso:** abrir el PR, escribir su propia entrega en docs/entregas/, CI y fusión

## Encargo del dueño

La mejora propuesta al cerrar el PR #92, aprobada («Sí, implementarla»).

## Hecho

- Script, plantilla, README, pruebas y migración de cabeceras (en el árbol; se confirman en el commit de cierre).

## Falta

- PR, entrega propia, CI y fusión.

## Decisiones y hallazgos

- El registro anterior se queda donde está; las cabeceras vigentes pasan a «Revisión anterior» y la prueba frena su vuelta.

## Verificación

- `test/relevo.test.js` y `test/entregas.test.js` en local.
