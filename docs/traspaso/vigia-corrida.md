# Traspaso: vigia-corrida

- **Tema:** la última corrida del vigía fusionada en main, a la vista en «Fuentes oficiales», con aviso si pasa de 8 días
- **Rama:** claude/elegant-pascal-7ymts7
- **Cuenta:** vladichakadc@gmail.com (sesión 01TxCQ3W2sHYVmimAdMKht3j)
- **Estado:** en curso
- **Actualizado:** 2026-11-02 17:40
- **Archivos que toca:** server/services/catalogProjection.js, server/routes/catalog.js, public/js/fuentes-portal.js, public/index.html, test/fuentes-portal.test.js, test/e2e/e2e-fuentes-portal.js
- **Siguiente paso:** abrir el PR, verificar con navegador (axe, pantallas, contraste, e2e, puerta) y cerrar la entrega

## Encargo del dueño

«Ejecuta los pendientes como un arquitecto senior con las Skills instaladas y las propuestas de
mejora; no pares hasta no tener resuelto», y «Continuar con ejecución». Es la mejora «La última corrida
del vigía, a la vista, con aviso si se paró» (propuesta al cerrar el PR #122).

## Hecho

- `vigiaRevisado` en cada fabricante de `toFuentes` (el `revisado` del lock); `lineaCorrida` y
  `#fpVigiaCorrida` en el portal, con aviso pasados 8 días (`DIAS_AVISO`). Pruebas: la regla de los días
  con fechas fijas y el campo contra la base sembrada (los dos sabotajes caen); e2e con la línea real y con
  un lock retocado en la red a 2020, que avisa.

## Falta

- Código, pruebas (Node y e2e), verificación, PR, entrega y relevo.

## Decisiones y hallazgos

- El vigía no escribe en main: deja el lock en la rama `vigia/fuentes` y una persona lo fusiona. El
  `revisado` de producción es la última corrida FUSIONADA: el aviso lo dice así, no «el vigía no corre».
- `test/fuentes-por-fabricante.test.js` fija que el primer nivel de `/api/fuentes` son los siete: el
  campo va dentro de cada fabricante (`vigiaRevisado`), igual en todos.

## Verificación

- Pendiente.
