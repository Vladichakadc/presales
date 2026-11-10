# Traspaso: aruba-lineas-bom

- **Tema:** Fase 2 de la auditoria (ADR-1, corte 1): la lista de materiales de Aruba fuera de renderBom()
- **Rama:** claude/aruba-lineas-bom
- **Cuenta:** (no consta)
- **Estado:** en curso
- **Actualizado:** 2026-11-10 05:31
- **Archivos que toca:** public/js/aruba-reglas.js, public/js/dimensionador-aruba-edgeconnect.js, scripts/equivalencias/aruba-bom.js, test/aruba-lineas-bom.test.js, test/etapa-a-aruba.test.js
- **Siguiente paso:** abrir el PR, esperar CI (equivalencia, visibles, pantallas) y fusionar

## Encargo del dueño

«Ejecuta fase 2 y fase 3» (2026-11-10): la fase 2 de la auditoría del 2026-11-09 son cinco cortes del contrato común de motor (ADR-1), uno por PR; este es el primero, la lista de materiales de Aruba fuera de `renderBom()`.

## Hecho

- `ArubaReglas.lineasBom(ctx)` → `{ filas, soltar, licHa }`: las ~230 líneas que armaban las filas dentro de `renderBom()`, movidas tal cual (comentarios incluidos), sin DOM ni estado. La página lee las casillas, las ópticas elegidas y el modal, llama al módulo y aplica `soltar` a `accesoriosElegidos`.
- `scripts/equivalencias/aruba-bom.js`: el bloque de la página de la base contra el módulo, sobre la proyección real (`toDimensionadorAruba` en una base de usar y tirar); 2.250 casos, 0 diferencias; la mutación (otro término) da 2.091.
- `test/aruba-lineas-bom.test.js` (6 pruebas) y `test/etapa-a-aruba.test.js` apuntando la regla DTD al módulo.

## Falta

- PR, CI y fusión; después, el corte 2 (Juniper).

## Decisiones y hallazgos

- La medición de equivalencias vigila `aruba-eleccion` (por public/js/aruba-reglas.js), `aruba-estado` (por public/js/aruba-reglas.js): se corre en cada PR; un cambio a propósito se declara con `equivalencia-acepta: <caso>: <motivo>`.

- La selección del modal se copia: el bloque viejo borraba de `accesoriosElegidos` mientras armaba filas; los borrados que no cambian las filas de esa pasada se devuelven en `soltar` y la página los aplica después (mismo estado final, medido por la equivalencia).
- Las funciones de la página que el bloque usa (`opticaResuelta`, `necesidadesOptica`, `accesoriosInyectados`) siguen en la página y se pasan en `ctx`: se mueven en un corte posterior si hace falta.

## Verificación

- `npm run verificar`: 1508 pruebas en verde tras ajustar `etapa-a-aruba`. `npm run equivalencia -- --todos`: aruba-bom, aruba-eleccion y aruba-estado sin diferencias. e2e de Aruba (8 baterías) en verde.
