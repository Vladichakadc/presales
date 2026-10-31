# Traspaso: velo-ventanas-aruba

- **Tema:** la ventana de ópticas de Aruba (`#accModal`) con la regla común de la ventana del consolidado
- **Rama:** claude/velo-ventanas-aruba
- **Cuenta:** servicioiptv2025@gmail.com (sesión de Claude Code en la nube)
- **Estado:** en curso
- **Actualizado:** 2026-10-31 16:25
- **Archivos que toca:** public/controles.css, public/dimensionador-aruba-edgeconnect.html, test/consolidado-estilos.test.js
- **Siguiente paso:** esperar CI en el PR; en verde, commit de cierre (`PENDIENTES.md`, `RELEVO.md`, borrar este traspaso) y fusionar

## Encargo del dueño

«Ejecuta pendientes y mejora propuesta» (2026-10-31): la mejora propuesta al cerrar el PR #89.

## Hecho

- Rama y traspaso empujados.
- `#accModal` comparte los selectores de la sección 6 de `controles.css`; la hoja de Aruba solo conserva `#accModal .acc-caja{max-width:640px}`. La prueba frena cualquier otra regla de ventana en una hoja y el velo cálido viejo.

## Falta

- CI, el commit de cierre y la fusión.

## Decisiones y hallazgos

- `#accModal` repetía el velo cálido `rgba(28,25,23,.45)`; el consolidado ya usa el de la tinta.

## Verificación

- `test/consolidado-estilos.test.js` en verde; con la hoja de Aruba de `main`, falla por el velo cálido.
- Chromium sobre `public/` estático, antes y después: oculta hasta abrirse, `position: fixed`, 640 px de ancho, `overflow: auto` y título igual; cambian el velo (de `rgba(28,25,23,.45)` al de la tinta) y el radio (3 a 6 px).
