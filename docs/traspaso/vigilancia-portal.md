# Traspaso: vigilancia-portal

- **Tema:** la vigilancia del lunes en «Fuentes oficiales» del portal, antes de comprobar nada en vivo
- **Rama:** claude/elegant-pascal-7ymts7
- **Cuenta:** vladichakadc@gmail.com (sesión 01TxCQ3W2sHYVmimAdMKht3j)
- **Estado:** en curso
- **Actualizado:** 2026-11-01 23:45
- **Archivos que toca:** public/js/fuentes-portal.js, public/index.html, test/fuentes-portal.test.js, test/e2e/e2e-fuentes-portal.js
- **Siguiente paso:** verificar (axe, pantallas, contraste, e2e, puerta), abrir el PR y cerrar la entrega

## Encargo del dueño

«Ejecuta los pendientes como un arquitecto senior con las Skills instaladas y las propuestas de
mejora; no pares hasta no tener resuelto», y «Continuar con ejecución». Es la mejora «La vigilancia
del lunes en «Fuentes oficiales», antes de comprobar nada» (propuesta al cerrar el PR #118).

## Hecho

- `resumenVigilancia` y `celdaVigia` en `fuentes-portal.js`; columna «Vigía semanal» con la fecha de la
  lectura; `/api/fuentes` al abrir la sección (`MutationObserver` sobre la clase `active` de
  `#page-fuentes`), una vez. Dos pruebas nuevas en Node (una contra `toFuentes` sembrado; quitar el filtro
  de las cargadas a mano la tumba) y la batería e2e ampliada (0 peticiones al cargar el portal, 1 al abrir,
  ninguna más al volver).

## Falta

- Código, prueba en Node (también contra la forma real de `toFuentes`), e2e (una sola petición, solo al
  abrir la sección), verificación, PR, entrega y relevo.

## Decisiones y hallazgos

- `/api/fuentes` sin parámetro sigue igual con el PR #121 (que añade `?vendor=`): se usa esa, una vez.
- Cada dato dice de cuándo es: la columna del vigía lleva la fecha de su última medición; la comprobación
  en vivo, su hora.

## Verificación

- Pendiente.
