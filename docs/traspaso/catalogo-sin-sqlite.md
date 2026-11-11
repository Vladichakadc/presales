# Traspaso: catalogo-sin-sqlite

- **Tema:** Fase 3 de la auditoria, ADR-3 cortes 2 y 3: el servidor sirve el catalogo en memoria y se retiran SQLite, Sequelize y sqlite3; el aplicar local pasa a npm run propuesta
- **Rama:** claude/catalogo-sin-sqlite
- **Cuenta:** sesion de Claude Code de la auditoria (session_016ruRWEjxhbmKTGnagDrUvb)
- **Estado:** en curso
- **Actualizado:** 2026-11-11 08:30
- **Archivos que toca:** server/server.js, server/routes/sync.js, server/services/catalogProjection.js, server/services/catalogoEnMemoria.js, server/seed/seedCatalog.js, server/models/index.js, server/config/database.js, package.json, package-lock.json, .env.example, eslint.config.js, scripts/ayuda/pantallas-servidas.js, scripts/ayuda/proyeccion-dimensionador.js, scripts/equivalencias/aruba-bom.js, scripts/importar-cps.js, scripts/importar-juniper.js, scripts/visibles.js, test/e2e/run-e2e.js, test/catalogo-en-memoria.test.js, test/proyecciones-sin-escritura.test.js, test/servidor-produccion.test.js, test/scripts-instalacion.test.js, test/trazabilidad-catalogo.test.js, test/fortinet-ha-licencia.test.js, test/fuentes-portal.test.js, test/fuentes-por-fabricante.test.js, test/compresion.test.js, .github/workflows/pantallas.yml, .github/workflows/verificar.yml, .claude/hooks/session-start.sh, public/js/sincronizacion.js, public/js/index.js, public/index.html, test/lock-origen.test.js, docs/sincronizacion.md
- **Siguiente paso:** Abrir el PR, cerrar (entrega, relevo, CLAUDE.md) y fusionar con el CI en verde.

## Encargo del dueño

«Ejecuta los pendientes que puedas hacer tú y ejecuta mejoras como un arquitecto senior» (2026-11-11):
los cortes 2 y 3 del ADR-3, que quedaron pendientes en el PR #174.

## Hecho

- El catálogo único del proceso (`catalogoEnMemoria.catalogo`, `listo()`); proyecciones, siembra,
  sincronización y `/salud` leen de él. Fuera `server/models/`, `server/config/`, Sequelize y `sqlite3`.
- El «aplicar» responde 503 en todas partes y remite a `npm run propuesta`; fuera su botón del portal.

## Falta

- PR, cierre y fusión.

## Decisiones y hallazgos

- Los cortes 2 y 3 van juntos: separados, el «aplicar» local habría escrito en una SQLite que ya no se leía.
- Main (SQLite, 3b26f59) contra la rama (memoria): las 16 proyecciones idénticas byte a byte (1,46 MB) y
  el catálogo que recibe la IA idéntico en los siete fabricantes (609 KB). La sincronización lleva escrito
  el orden que daba el índice de SQLite.
- Arranque en producción: la siembra tarda 112 ms (con SQLite, unos 5,8 s).
- El lock pasa de más de 450 entradas a 298: `sqlite3` arrastraba su cadena de compilación.

## Verificación

- `npm run verificar`: 1.550 pruebas en verde. `auditar`: 0 que frenan. `equivalencia` de Aruba: 0 diferencias.
- Arranque con `NODE_ENV=production`: `/salud` 200, la puerta cerrada.
