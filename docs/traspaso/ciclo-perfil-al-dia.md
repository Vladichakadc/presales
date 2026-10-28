# Traspaso: ciclo-perfil-al-dia

- **Tema:** El ciclo de vida de los perfiles, al día con el catálogo al consolidar
- **Rama:** claude/ciclo-perfil-al-dia
- **Cuenta:** servicioiptv2025, sesión 01V8T7S6ACDK2CAYKoqhKyry
- **Estado:** en curso
- **Actualizado:** 2026-10-28 08:00
- **Archivos que toca:** public/js/bom.js, public/js/dimensionador-{aruba-edgeconnect,cisco-catalyst8k,fortinet-fortigate,huawei-netengine,mikrotik-routeros}.js (la lista del consolidado), test/bom-perfiles.test.js, test/e2e/e2e-ciclo-excel.js
- **Siguiente paso:** abrir el PR y esperar CI

## Encargo del dueño

«Ejecuta la mejora propuesta» (la del PR #44: el ciclo del perfil, al día con el catálogo al consolidar).

## Hecho

- `BOM.refrescarCiclo(lista, vendor, buscar)`: los perfiles del fabricante de la página se recalculan con su `MODELS` (también los guardados sin ciclo); los de otro fabricante conservan su foto y el aviso dice «ciclo a fecha de <fecha>, sin contrastar con el catálogo de hoy». Las cinco páginas consolidan con la lista puesta al día.
- Pruebas: dos en `bom-perfiles.test.js`; `e2e-ciclo-excel.js` mete un perfil sin ciclo y comprueba que avisa.

## Falta

- CI; PENDIENTES, RELEVO y CLAUDE.md al fusionar.

## Decisiones y hallazgos

- No se reescribe lo guardado: `refrescarCiclo` devuelve copias, y el almacenamiento conserva la foto.

## Verificación

- `node --test test/bom-perfiles.test.js`: 12 en verde; eslint limpio.
