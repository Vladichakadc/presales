# Traspaso: fin-de-venta-excel

- **Tema:** El fin de venta del equipo también en el Excel del BOM (aviso en la hoja BOM y sección en «Supuestos»)
- **Rama:** claude/fin-de-venta-excel
- **Cuenta:** servicioiptv2025, sesión 01V8T7S6ACDK2CAYKoqhKyry
- **Estado:** en curso
- **Actualizado:** 2026-10-28 06:40
- **Archivos que toca:** public/js/bom.js, public/js/dimensionador-*.js (solo `supuestos.ciclo`), test/bom-supuestos.test.js, test/e2e/e2e-ciclo-excel.js
- **Siguiente paso:** abrir el PR y esperar CI (la batería nueva e2e-ciclo-excel descarga el Excel de Cisco con un 8300 de fin de venta anunciado)

## Encargo del dueño

«Ejecuta los pendientes que puedas cerrar y la mejora propuesta; si encuentras alguna mejora por el camino, avanza con la ejecución». La mejora propuesta vigente era la del PR #40: el fin de venta en el Excel.

## Hecho

- `BOM.cicloDe(m)` y `BOM.cicloDelEquipo(c, hoy)` (bom.js): sección «Ciclo de vida del equipo» en «Supuestos» (estado, último pedido, referencia, sucesor del boletín o inferido —dicho como tal—, fin de soporte, boletín) y aviso en rojo en la hoja BOM. Las siete páginas pasan `ciclo: BOM.cicloDe(m)`.
- Pruebas: `bom-supuestos.test.js` (dos nuevas) y la batería `e2e-ciclo-excel.js`.

## Falta

- CI; PENDIENTES, RELEVO y CLAUDE.md al fusionar.

## Decisiones y hallazgos

- Sin dato de ciclo no sale nada: un equipo sin boletín no se declara vigente (la regla del semáforo).
- La línea anterior sale en la sección pero no lleva aviso en la hoja BOM: se sigue pidiendo.
- La otra mejora propuesta (fuente de la PQC enlazada a `fuentes.js`) no se toma: toca los `legacyData/` que declara el traspaso `pqc-documentos` (rama `claude/elegant-pascal-7ymts7`, cuyo único commit fuera de `main` es el que abre ese traspaso).

## Verificación

- `node --test test/bom-supuestos.test.js`: 13 en verde.
