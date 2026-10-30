# Traspaso: campos-perfil-del-enlace

- **Tema:** los campos del perfil multi-sede se calculan de los del enlace, con las excepciones declaradas
- **Rama:** claude/campos-perfil-del-enlace
- **Cuenta:** servicioiptv2025@gmail.com (sesión 01V8T7S7ZbQULfHYAyefitrr)
- **Estado:** en curso
- **Actualizado:** 2026-10-30 06:00
- **Archivos que toca:** public/js/dimensionador-cisco-catalyst8k.js, public/js/dimensionador-huawei-netengine.js, public/js/dimensionador-juniper-srx.js, public/js/dimensionador-mikrotik-routeros.js, public/js/dimensionador-nokia-7750sr.js, test/perfil-campos-enlace.test.js
- **Siguiente paso:** con CI en verde, commit de cierre (PENDIENTES, RELEVO y CLAUDE.md, fuera este traspaso) y fusión en main.

## Encargo del dueño

«Ejecuta las mejoras propuestas» y, preguntado por la mejora «los campos del perfil, de la misma
lista que el enlace» (las listas difieren a propósito, unificarlas cambiaría lo que guardan los
perfiles), eligió «Versión reformulada»: la lista del perfil sale de la del enlace más las
excepciones que declare cada página, con una prueba que lo frene.

## Hecho

- Las cinco páginas con dos listas (Cisco, Huawei, Juniper, MikroTik, Nokia 7750) declaran
  `CAMPOS_ENLACE` (lo que ya pasaban a `ESTADO.vincular`), `PERFIL_SIN` y `PERFIL_EXTRA` con su
  motivo; `CAMPOS_PERFIL` se calcula. `SEGS_PERFIL` y el orden de `aplicarCampos` no cambian.
- `test/perfil-campos-enlace.test.js`: las cinco derivan, cada excepción es real (lo excluido está
  en el enlace, lo extra no y es un campo de la página), el equipo no entra en el perfil y «Exigir
  PQC» sí; Aruba y Fortinet ya usan una sola lista (`CAMPOS_ESCENARIO`).

## Falta

- CI del PR, cierre y fusión.

## Decisiones y hallazgos

- Medido evaluando las declaraciones de `main` y de la rama: el enlace es idéntico en las cinco y
  el perfil solo gana `reqPqc` en MikroTik, que viajaba en el enlace y un perfil cargado perdía.
- Excepciones: `verdict-sel` (el perfil guarda el equipo en `modelo`), descuento (el consolidado
  aplica el de la página), simulador financiero y TCO (no entran en el consolidado); solo en el
  perfil, opciones del BOM (`qty`, `licTier`, `termYears`…) y, en MikroTik, `apModel`, que no viaja
  en el enlace (posible olvido del enlace: se deja anotado, no se cambia aquí).
- `bom.js` no se toca (lo declara el PR #68). La rama `claude/panel-perfiles-modulo` declara estos
  archivos en un traspaso que quedó de su PR #62, ya fusionado: tema cerrado.

## Verificación

- `node --test test/perfil-campos-enlace.test.js`: 12 en verde; con el MikroTik de `main`, 2 en rojo.
- Suite completa: los mismos fallos que `main` (65, todos por faltar `sequelize` en este contenedor,
  donde el registro de npm no responde); ninguno nuevo. `eslint` y el navegador, en CI.
