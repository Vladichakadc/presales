# Traspaso: funcion-en-resultado

- **Tema:** Al activar una función, resaltar en el panel derecho lo que esa función hizo aparecer o cambiar
- **Rama:** claude/funcion-en-resultado
- **Cuenta:** servicioiptv2025@gmail.com, sesión 01V8T7S6ACDK2CAYKoqhKyry
- **Estado:** en curso
- **Actualizado:** 2026-10-29 14:35
- **Archivos que toca:** public/js/funciones-activas.js, public/controles.css, test/funciones-activas.test.js, test/e2e/e2e-funciones-activas.js
- **Siguiente paso:** CI del PR (la batería `e2e-funciones-activas` conduce las ocho páginas); si verde, cierre y fusión

## Encargo del dueño

«cuando se active una función también debes resaltar la descripción en el panel derecho para que los
usuarios puedan observar en donde apareció dicha descripción» (2026-10-29). Coincide con la mejora
propuesta al cerrar el PR #61 («Del panel a la fila»).

## Hecho

- `funciones-activas.js`: foto del texto de la derecha en el `click` de la casilla, comparación tras el recálculo (300 ms de calma, tope 4 s), `.fa-nuevo` con «Apareció al activar «X»», aviso en el panel con «Ver», reposición si la página repinta, borrado con otro control.
- `controles.css` sección 4: acento al 6 %, barra de 3 px y contorno al 40 %; alto contraste.
- Pruebas: `funciones-activas.test.js` (estática) y `e2e-funciones-activas.js` (ocho páginas). Banco en Chromium con una página falsa: los seis casos en verde.

## Falta

- Implementación, pruebas unitarias y e2e en las ocho páginas, cierre.

## Decisiones y hallazgos

- La marca sale de lo que de verdad cambió en la pantalla: se toma una foto del texto de la columna
  de resultados al pulsar la casilla y se compara con la de después del recálculo. Así no hay un
  mapa función→fila escrito a mano que pueda mentir (el riesgo que señalaba la propuesta del PR #61),
  y no se toca el código de ninguna de las ocho páginas.

## Verificación

- `node --test`: los mismos 63 fallos de entorno que `main`; lint limpio. Sin servidor local (sqlite3): la batería e2e la corre CI.
