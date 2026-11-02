# Traspaso: vigilancia-portal

- **Tema:** la vigilancia del lunes en «Fuentes oficiales» del portal, antes de comprobar nada en vivo
- **Rama:** claude/elegant-pascal-7ymts7
- **Cuenta:** vladichakadc@gmail.com (sesión 01TxCQ3W2sHYVmimAdMKht3j)
- **Estado:** en curso
- **Actualizado:** 2026-11-01 23:30
- **Archivos que toca:** public/js/fuentes-portal.js, public/index.html, test/fuentes-portal.test.js, test/e2e/e2e-fuentes-portal.js
- **Siguiente paso:** `resumenVigilancia` en fuentes-portal.js, la columna «Vigía semanal» y la carga de `/api/fuentes` al abrir la sección

## Encargo del dueño

«Ejecuta los pendientes como un arquitecto senior con las Skills instaladas y las propuestas de
mejora; no pares hasta no tener resuelto», y «Continuar con ejecución». Es la mejora «La vigilancia
del lunes en «Fuentes oficiales», antes de comprobar nada» (propuesta al cerrar el PR #118).

## Hecho

- Nada todavía.

## Falta

- Código, prueba en Node (también contra la forma real de `toFuentes`), e2e (una sola petición, solo al
  abrir la sección), verificación, PR, entrega y relevo.

## Decisiones y hallazgos

- `/api/fuentes` sin parámetro sigue igual con el PR #121 (que añade `?vendor=`): se usa esa, una vez.
- Cada dato dice de cuándo es: la columna del vigía lleva la fecha de su última medición; la comprobación
  en vivo, su hora.

## Verificación

- Pendiente.
