# Traspaso: velo-ventanas-aruba

- **Tema:** la ventana de ópticas de Aruba (`#accModal`) con la regla común de la ventana del consolidado
- **Rama:** claude/velo-ventanas-aruba
- **Cuenta:** servicioiptv2025@gmail.com (sesión de Claude Code en la nube)
- **Estado:** en curso
- **Actualizado:** 2026-10-31 16:05
- **Archivos que toca:** public/controles.css, public/dimensionador-aruba-edgeconnect.html, test/consolidado-estilos.test.js
- **Siguiente paso:** dar a `#accModal` los selectores de la sección 6 de `controles.css` y dejar en la hoja de Aruba solo su ancho de 640 px

## Encargo del dueño

«Ejecuta pendientes y mejora propuesta» (2026-10-31): la mejora propuesta al cerrar el PR #89.

## Hecho

- Rama y traspaso empujados.

## Falta

- El cambio, su prueba, el PR, CI y la fusión.

## Decisiones y hallazgos

- `#accModal` repetía el velo cálido `rgba(28,25,23,.45)`; el consolidado ya usa el de la tinta.

## Verificación

- Pendiente.
