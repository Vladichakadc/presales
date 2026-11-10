# Traspaso: archivar-codigo-muerto

- **Tema:** Auditoría fase 1: archivar el código muerto (sizing_engine.js, presales_api_controller.js, plan18, SyncLog)
- **Rama:** claude/archivar-codigo-muerto
- **Cuenta:** (no consta)
- **Estado:** en revisión (PR abierto)
- **Actualizado:** 2026-11-09 22:29
- **Archivos que toca:** public/js/sizing_engine.js, server/presales_api_controller.js, test/presales-api-controller.test.js, plan18-fase1-auditoria-aruba.patch, server/models/SyncLog.js, server/models/index.js, scripts/contrastes/cobertura.lock.json, docs/archivo/
- **Siguiente paso:** CI del PR y commit de cierre (CLAUDE.md sin la sección de Gemini, entrega, RELEVO)

## Encargo del dueño

«Ejecuta pendientes como arquitecto senior» (2026-11-09): el paso de la fase 1 de la auditoría que no tiene otra sesión (Express 5 está en el #156).

## Hecho

- Retirados del árbol los cuatro archivos y `SyncLog`; `docs/archivo/README.md` con el commit para recuperarlos; fuera del lock de cobertura.

## Falta

- Cierre: CLAUDE.md, entrega y relevo.

## Decisiones y hallazgos


- Archivar = sacar del árbol, no borrar la historia: `git show <commit>:<ruta>`.

## Verificación

- eslint sin errores; `node --test test/*.test.js`: las mismas 38 fallas que la base (dependencias ausentes en el entorno), ninguna nueva.
