# Traspaso: el botón «Actualizar» como detector

- **Tema:** el botón avisa cuando su recálculo cambia lo que se veía (la página no estaba al día) y deja el último campo y el enlace en la consola
- **Rama:** claude/boton-detector
- **Cuenta:** servicioiptv2025@gmail.com (sesión de Claude Code en la nube)
- **Estado:** en curso
- **Actualizado:** 2026-10-31 15:40
- **Archivos que toca:** public/js/actualizar.js, test/actualizar.test.js, test/e2e/e2e-boton-detector.js, test/e2e/e2e-campos-en-linea.js, .github/workflows/pantallas.yml
- **Siguiente paso:** leer el aviso `RESUMEN - botón detector` y los fallos `e2e` de la comprobación `pantallas` del PR

## Encargo del dueño

«Ejecuta la mejora propuesta» (2026-10-31), la del cierre del PR #86.

## Hecho

- `actualizar.js`: texto de resultados antes y después del recálculo; si cambia, «El resultado no estaba al día…» con el último campo tocado, y `console.warn` con página, campo, enlace y hora. Nada sale del navegador.
- `e2e-boton-detector.js`: sin falso aviso con la página al día; con un campo cambiado sin eventos, aviso y consola; al pulsar otra vez, «Actualizado».
- Una sola línea `RESUMEN - ` por batería (GitHub publica 10 avisos por paso).

## Falta

- Medición en CI.

## Decisiones y hallazgos

- Sin catálogo (`DIMENSIONADOR_ACTUALIZAR` devuelve `false`) no se compara: una carga a medias no es un desfase.

## Verificación

- Starlink en local: TODO VERDE en la batería nueva; `node --test test/actualizar.test.js` 3/3.
