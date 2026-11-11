# Traspaso: catalogo-sin-sqlite

- **Tema:** Fase 3 de la auditoria, ADR-3 cortes 2 y 3: el servidor sirve el catalogo en memoria y se retiran SQLite, Sequelize y sqlite3; el aplicar local pasa a npm run propuesta
- **Rama:** claude/catalogo-sin-sqlite
- **Cuenta:** sesion de Claude Code de la auditoria (session_016ruRWEjxhbmKTGnagDrUvb)
- **Estado:** reservado
- **Actualizado:** 2026-11-11 06:33
- **Archivos que toca:** server/server.js, server/routes/sync.js, server/services/catalogProjection.js, server/services/catalogoEnMemoria.js, server/seed/seedCatalog.js, server/models/index.js, server/config/database.js, package.json, package-lock.json, .env.example, eslint.config.js, scripts/ayuda/pantallas-servidas.js, scripts/ayuda/proyeccion-dimensionador.js, scripts/equivalencias/aruba-bom.js, scripts/importar-cps.js, scripts/importar-juniper.js, scripts/visibles.js, test/e2e/run-e2e.js, test/catalogo-en-memoria.test.js, test/proyecciones-sin-escritura.test.js, test/servidor-produccion.test.js, test/scripts-instalacion.test.js, test/trazabilidad-catalogo.test.js, test/fortinet-ha-licencia.test.js, test/fuentes-portal.test.js, test/fuentes-por-fabricante.test.js, test/compresion.test.js, .github/workflows/pantallas.yml, .github/workflows/verificar.yml, .claude/hooks/session-start.sh, public/js/sincronizacion.js
- **Siguiente paso:** catalogoEnMemoria con un catalogo unico por proceso; server.js, sync.js y las proyecciones leen de el; fuera models y sqlite3

## Encargo del dueño

<Las palabras del dueño, literales, y lo que se entendió de ellas.>

## Hecho

- <Lo terminado, con el commit que lo contiene.>

## Falta

- <Lo pendiente de este tema, en orden.>

## Decisiones y hallazgos


- <Lo decidido y su porqué; lo medido; lo que no funcionó, para no repetirlo.>

## Verificación

- <Qué se corrió (`npm run verificar`, `auditar`, `pantallas`…) y con qué resultado.>
