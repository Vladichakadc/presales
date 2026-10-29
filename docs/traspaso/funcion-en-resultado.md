# Traspaso: funcion-en-resultado

- **Tema:** Al activar una función, resaltar en el panel derecho lo que esa función hizo aparecer o cambiar
- **Rama:** claude/funcion-en-resultado
- **Cuenta:** servicioiptv2025@gmail.com, sesión 01V8T7S6ACDK2CAYKoqhKyry
- **Estado:** en curso
- **Actualizado:** 2026-10-29 14:35
- **Archivos que toca:** public/js/funciones-activas.js, public/controles.css, test/funciones-activas.test.js, test/e2e/e2e-funciones-activas.js
- **Siguiente paso:** implementar la comparación antes/después en `funciones-activas.js`, su estilo y las pruebas

## Encargo del dueño

«cuando se active una función también debes resaltar la descripción en el panel derecho para que los
usuarios puedan observar en donde apareció dicha descripción» (2026-10-29). Coincide con la mejora
propuesta al cerrar el PR #61 («Del panel a la fila»).

## Hecho

- (nada todavía)

## Falta

- Implementación, pruebas unitarias y e2e en las ocho páginas, cierre.

## Decisiones y hallazgos

- La marca sale de lo que de verdad cambió en la pantalla: se toma una foto del texto de la columna
  de resultados al pulsar la casilla y se compara con la de después del recálculo. Así no hay un
  mapa función→fila escrito a mano que pueda mentir (el riesgo que señalaba la propuesta del PR #61),
  y no se toca el código de ninguna de las ocho páginas.

## Verificación

- (pendiente)
