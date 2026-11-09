# Traspaso: solapes-notice

- **Tema:** el job `solapes` deja una línea `::notice` con lo que leyó (mejora propuesta al cerrar el PR #145)
- **Rama:** claude/elegant-pascal-7ymts7
- **Cuenta:** vladichakadc@gmail.com (sesión 01TxCQ3W2sHYVmimAdMKht3j)
- **Estado:** en curso
- **Actualizado:** 2026-11-09 13:40
- **Archivos que toca:** scripts/solapes-pr.js, test/solapes-pr.test.js
- **Siguiente paso:** abrir el PR, leer la anotación `::notice` del job `solapes` de su propio check y escribir el cierre

## Encargo del dueño

«Ejecuta los pendientes como un arquitecto senior con las Skills instaladas y las propuestas de mejora; no pares hasta no tener resuelto», y «Continuar». Preguntado por la mejora «el job `solapes` deja una línea `::notice` con lo que leyó» (propuesta al cerrar el PR #145), el dueño eligió **«Hacerla»**.

## Hecho

- La reserva.
- `notaLectura` y una sola `::notice` por corrida en `scripts/solapes-pr.js`; lectores inyectables en `main`; cinco pruebas nuevas en `test/solapes-pr.test.js`.

## Falta

- PR, comprobar la anotación en el check del propio PR, cierre, CI, fusión y sonda.

## Decisiones y hallazgos

- Se cuenta con los filtros de `choques`: un «0 solapes» junto a cifras que incluyen lo que nunca se comparó confundiría (asesor).

## Verificación

- `npm run verificar`: 1.469/1.469, lint sin errores.
- Sabotajes que caen: sin la línea (3 pruebas), una línea por archivo (2), contar la propia rama (2).
- En local contra `origin/main`: «Leído: 0 traspaso(s) en curso de otras ramas (y 1 cerrado(s), que no cuentan); 0 PR abierto(s) sin traspaso; … Solapes: 0.»
