# Traspaso: cache-proyecciones

- **Tema:** cache-proyecciones
- **Rama:** claude/elegant-pascal-7ymts7
- **Cuenta:** vladichakadc (sesión de Claude Code en la nube)
- **Estado:** en revisión (PR abierto)
- **Actualizado:** 2026-11-12 13:20
- **Archivos que toca:** server/services/cacheRespuestas.js, server/services/catalogProjection.js, server/routes/catalog.js, server/routes/cotizador.js, server/routes/guia.js, server/routes/dimensionador.js, test/cache-respuestas.test.js
- **Siguiente paso:** CI del PR; commit de cierre (entrega, RELEVO, CLAUDE.md) y fusión

## Encargo del dueño

«Avanza con los pendientes y mejoras propuestas»; en la pregunta de la sesión eligió las cuatro, entre ellas «Caché de proyecciones» (propuesta al cerrar el PR #183).

## Hecho

- `server/services/cacheRespuestas.js`: el cuerpo serializado de `/api/vendors`, `/api/catalog`, `/api/cotizador/catalog`, `/api/guia/roles` y `/api/dimensionador/:vendor`, una vez por día UTC; `usarModelos()` la vacía. `/api/fuentes` y `/api/v1/fortinet/*`, fuera.
- `test/cache-respuestas.test.js`: siete pruebas, con sus sabotajes.

## Falta

- CI, cierre y fusión.

## Decisiones y hallazgos

- El día UTC va en la clave porque `fueraDeVenta()` compara `lastOrder` con la hora; todos son AAAA-MM-DD y la prueba lo exige.
- Se guarda la promesa del JSON: dos primeras peticiones comparten el cálculo; un fallo se borra.
- Medido: `/api/dimensionador/fortinet` pasa de 21,8 ms a 1,7 ms de media (20 peticiones, local).
- `main` versiona `node_modules` como un enlace a sí mismo; `npm ci` lo reemplaza por la carpeta. No se toca aquí.

## Verificación

- `npm run verificar`: 1.586/1.586. `npm run auditar`: verde. `npm run puerta` contra el servidor en producción: cerrada.
- Las 14 rutas de `main` y de la rama en producción, byte a byte y con el mismo `Content-Type`: iguales.
