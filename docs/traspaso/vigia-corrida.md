# Traspaso: vigia-corrida

- **Tema:** la última corrida del vigía fusionada en main, a la vista en «Fuentes oficiales», con aviso si pasa de 8 días
- **Rama:** claude/elegant-pascal-7ymts7
- **Cuenta:** vladichakadc@gmail.com (sesión 01TxCQ3W2sHYVmimAdMKht3j)
- **Estado:** en curso
- **Actualizado:** 2026-11-02 17:15
- **Archivos que toca:** server/services/catalogProjection.js, server/routes/catalog.js, public/js/fuentes-portal.js, public/index.html, test/fuentes-portal.test.js, test/e2e/e2e-fuentes-portal.js
- **Siguiente paso:** `vigiaRevisado` en cada fabricante de `toFuentes` (del `revisado` del lock) y la línea de la página con su aviso

## Encargo del dueño

«Ejecuta los pendientes como un arquitecto senior con las Skills instaladas y las propuestas de
mejora; no pares hasta no tener resuelto», y «Continuar con ejecución». Es la mejora «La última corrida
del vigía, a la vista, con aviso si se paró» (propuesta al cerrar el PR #122).

## Hecho

- Nada todavía.

## Falta

- Código, pruebas (Node y e2e), verificación, PR, entrega y relevo.

## Decisiones y hallazgos

- El vigía no escribe en main: deja el lock en la rama `vigia/fuentes` y una persona lo fusiona. El
  `revisado` de producción es la última corrida FUSIONADA: el aviso lo dice así, no «el vigía no corre».
- `test/fuentes-por-fabricante.test.js` fija que el primer nivel de `/api/fuentes` son los siete: el
  campo va dentro de cada fabricante (`vigiaRevisado`), igual en todos.

## Verificación

- Pendiente.
