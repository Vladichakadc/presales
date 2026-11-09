# Traspaso: figuras-fortinet-vigia

- **Tema:** figuras-fortinet-vigia
- **Rama:** claude/figuras-fortinet-vigia
- **Cuenta:** (no consta)
- **Estado:** en curso
- **Actualizado:** 2026-11-09 18:10
- **Archivos que toca:** scripts/figuras-fortinet.js, scripts/figuras-fortinet.lock.json, scripts/vigia-publicar.js, .github/workflows/vigia-fuentes.yml, test/figuras-fortinet.test.js, test/vigia-publicar.test.js, test/workflows-permisos.test.js
- **Siguiente paso:** abrir el PR y el commit de cierre (entrega, CLAUDE.md, RELEVO, borrar este traspaso)

## Encargo del dueño

«Cierra pendientes y ejecuta mejora» (2026-11-09): la mejora propuesta al cerrar el PR #149, rehacer en Actions las figuras de una ficha de Fortinet que cambie y decirlo en el issue del vigía.

## Hecho

- `--traer` en `scripts/figuras-fortinet.js`, URL por documento en el lock, job `contrastar_figuras` en `vigia-fuentes.yml`, `resumenFiguras` en `vigia-publicar.js`, con sus pruebas.

## Falta

- PR y cierre.

## Decisiones y hallazgos


- La premisa de la propuesta no se sostenía: el vigía no mide las fichas por serie (fuentes.js las declara sin URL), así que nunca quedan pendientes. El job no espera a un pendiente, como `contrastar_cisco`: baja las 32 cada lunes.
- Las URL salen de los informes de las ramas fuente/* y de los workflows de transporte del 2026-09-03 (commits 9eef2d8, 26a58b8, f9a2172) y del 2026-09-24 (informe de fuente/fortinet-pendientes); cada documento lo dice en `urlDe`.

## Verificación

- Pruebas de los archivos tocados en verde; `node --test` completo: las mismas caídas que main (faltan dotenv, sequelize… en este contenedor). Ensayo de `traer` con fetch simulado sobre los 32 PDF reales: misma edición, otra edición IGUAL, otra ficha DISTINTA (62,7 frente a 12,9) y 403 como ERROR. Mutación: quitar el error del 403 pone la prueba en rojo.
