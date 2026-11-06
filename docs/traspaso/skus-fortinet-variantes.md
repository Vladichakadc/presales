# Traspaso: skus-fortinet-variantes

- **Tema:** El importador de la lista de Fortinet extrae también FortiWiFi y FortiExtender, anclados por SKU exacto
- **Rama:** claude/skus-fortinet-variantes
- **Cuenta:** (no consta)
- **Estado:** en revisión (PR abierto)
- **Actualizado:** 2026-11-06 05:51
- **Archivos que toca:** scripts/importar-skus-fortinet.js, test/importar-skus-fortinet.test.js, server/seed/legacyData/fortinetVariantes.js
- **Siguiente paso:** esperar CI del PR y escribir el commit de cierre (entrega, RELEVO, CLAUDE.md)

## Encargo del dueño

«Conéctate al repositorio con escritura […] y avanza con los Skills instalados» (2026-11-06). Se entiende como aprobar la única mejora viva del relevo: que el importador de la lista de Fortinet extraiga también FortiWiFi y FortiExtender.

## Hecho

- `extraerSinFortiGate` en `scripts/importar-skus-fortinet.js` y su prueba con lista sintética.

## Falta

- Que el dueño corra `npm run skus -- <lista>` con la lista firmada; después, que las variantes lean su bloque.

## Decisiones y hallazgos


- Ancla doble: SKU exacto de la ficha + bloque que nombra el modelo; un nombre más largo conocido se lleva sus filas; hardware ajeno rechaza el bloque.
- No se toca `fortinet-reglas.js`: su mensaje cambia cuando haya datos.

## Verificación

- `node --test test/importar-skus-fortinet.test.js`: 8/8; dos mutaciones de control la ponen en rojo. eslint limpio. Sin `node_modules` (red cerrada): CI hace el resto.
