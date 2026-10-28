# Traspaso: ciclo-multisede

- **Tema:** El fin de venta en el BOM consolidado multi-sede (pantalla y Excel), con el ciclo guardado en cada perfil
- **Rama:** claude/ciclo-multisede
- **Cuenta:** servicioiptv2025, sesión 01V8T7S6ACDK2CAYKoqhKyry
- **Estado:** en curso
- **Actualizado:** 2026-10-28 07:30
- **Archivos que toca:** public/js/bom.js, public/js/dimensionador-{aruba-edgeconnect,cisco-catalyst8k,fortinet-fortigate,huawei-netengine,mikrotik-routeros}.js (perfil y consolidado), test/bom-perfiles.test.js, test/e2e/e2e-ciclo-excel.js
- **Siguiente paso:** abrir el PR y esperar CI (e2e-ciclo-excel guarda un perfil del 8300-1N1S-6T y consolida)

## Encargo del dueño

«Ejecuta pendientes y mejora propuesta». La mejora era la del PR #41: el ciclo de vida también en el Excel multi-sede.

## Hecho

- `BOM.cicloDePerfiles(lista, hoy)` y `BOM.avisoCicloConsolidado(lista)`; el Excel del consolidado escribe «Ciclo de vida de los equipos del despliegue» en su hoja BOM. Las cinco páginas con perfiles guardan `ciclo: BOM.cicloDe(<equipo>)` y pasan `perfiles` al consolidado.
- Pruebas: dos en `bom-perfiles.test.js` y el consolidado en `e2e-ciclo-excel.js`.

## Falta

- CI; PENDIENTES, RELEVO y CLAUDE.md al fusionar.

## Decisiones y hallazgos

- Un perfil guardado antes de este cambio no trae `ciclo`: se dice «sin dato de ciclo», nunca «vigente», y se pide guardarlo de nuevo.
- Un perfil cuyo equipo no tiene dato de ciclo (`ciclo: null`) no avisa: no se afirma nada.

## Verificación

- `node --test test/bom-perfiles.test.js`: 10 en verde; eslint limpio.
