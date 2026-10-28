# Traspaso: ciclo-todos-fabricantes

- **Tema:** Al consolidar, el ciclo de los perfiles de otros fabricantes también al día con su catálogo
- **Rama:** claude/ciclo-todos-fabricantes
- **Cuenta:** servicioiptv2025, sesión 01V8T7S6ACDK2CAYKoqhKyry
- **Estado:** en curso
- **Actualizado:** 2026-10-28 09:10
- **Archivos que toca:** public/js/bom.js, public/js/dimensionador-{aruba-edgeconnect,cisco-catalyst8k,fortinet-fortigate,huawei-netengine,mikrotik-routeros}.js (el botón «Consolidar»), test/bom-perfiles.test.js, test/e2e/e2e-ciclo-excel.js
- **Siguiente paso:** abrir el PR y esperar CI

## Encargo del dueño

«Ejecuta la mejora propuesta» (la del PR #46: los perfiles de otros fabricantes, también al día).

## Hecho

- `BOM.refrescarCicloTodos(lista, pedir?)`: pide `/api/dimensionador/<fabricante>` de cada fabricante con perfiles aún sin poner al día (una vez cada uno, en paralelo; el fabricante se valida antes de componer la URL) y los recalcula; si la ruta falla o el modelo ya no está, el perfil conserva su foto y el aviso dice por qué (`cicloError`). Las cinco páginas lo esperan al pulsar «Consolidar».
- Pruebas: dos en `bom-perfiles.test.js`; `e2e-ciclo-excel.js` consolida en Cisco con un perfil de FortiGate 70F (fuera de venta) sin ciclo guardado.

## Falta

- CI; PENDIENTES, RELEVO y CLAUDE.md al fusionar.

## Decisiones y hallazgos

- Las rutas de catálogo ya existen y todas sirven `models` con `eol`, `eolAnnounced` y `legacy`: no hizo falta tocar el servidor.

## Verificación

- `node --test test/bom-perfiles.test.js`: 14 en verde; eslint limpio.
