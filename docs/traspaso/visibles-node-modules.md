# Traspaso: visibles-node-modules

- **Tema:** que visibles aguante una base con un node_modules versionado (el enlace del PR #191 rompe visibles en todos los PR; lo quita el #194) y que .gitignore lo frene también como enlace
- **Rama:** claude/visibles-node-modules
- **Cuenta:** servicioiptv2025@gmail.com (sesión de Claude Code en la nube)
- **Estado:** en curso
- **Actualizado:** 2026-11-12 12:52
- **Archivos que toca:** .gitignore, scripts/visibles.js, test/visibles.test.js
- **Siguiente paso:** CI del PR en verde (sobre todo `visibles`, que es lo que arregla); cierre y fusión

## Encargo del dueño

Sin encargo propio: sale de «Ejecuta pendientes y mejora propuesta…» (2026-11-11), porque el PR #190 no podía fusionarse con `visibles` en rojo. El cierre del PR #191 versionó un enlace `node_modules` (a `/home/user/presales/node_modules`) en `main`, y desde entonces `visibles` cae con EEXIST en todos los PR que tocan `public/`.

## Hecho

- `scripts/visibles.js`: `prepararNodeModules` quita del worktree de la base un `node_modules` versionado que sea un enlace o una carpeta vacía; con contenido, frena y lo dice.
- `.gitignore`: `node_modules` sin barra, que también casa un enlace.
- `test/visibles.test.js`: los dos casos.

## Falta

- CI y fusión. El enlace en sí lo quita el PR #194 (otra sesión, que lo tiene declarado): no se toca aquí.

## Decisiones y hallazgos

- No se borra el enlace aquí: el PR #194 lo declara. Con este arreglo, `visibles` pasa con o sin él.

## Verificación

- `node --test test/visibles.test.js`; `prepararNodeModules` contra un worktree real de `origin/main`: «quitado».
