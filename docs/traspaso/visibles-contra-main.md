# Traspaso: visibles-contra-main

- **Tema:** lo visible, contra main: el sondeo del PR #127 como herramienta (scripts/visibles.js) y en los PR que tocan public/
- **Rama:** claude/elegant-pascal-7ymts7
- **Cuenta:** vladichakadc@gmail.com (sesión 01TxCQ3W2sHYVmimAdMKht3j)
- **Estado:** en curso
- **Actualizado:** 2026-11-03 06:01
- **Archivos que toca:** scripts/visibles.js, test/visibles.test.js, .github/workflows/visibles.yml, package.json
- **Siguiente paso:** scripts/visibles.js con su prueba pura, conducirlo main contra main y contra un sabotaje, y el workflow

## Encargo del dueño

«Ejecuta los pendientes como un arquitecto senior con las Skills instaladas y las propuestas de
mejora; no pares hasta no tener resuelto», y «Continuar con ejecución». Es la mejora «Lo visible,
contra `main`, en los PR que tocan `public/`», propuesta al cerrar el PR #127.

## Hecho

- Reserva (la rama que creó `npm run reservar`, `claude/visibles-contra-main`, se borró: esta sesión
  trabaja en `claude/elegant-pascal-7ymts7`).

## Falta

- `scripts/visibles.js`: dos servidores (el árbol y la base desde un worktree), el mismo recorrido con
  `asentar()`, cada paso desde el estado de partida, y la mutación de control obligatoria.
- `test/visibles.test.js` con la regla pura (qué frena y qué avisa) y sus sabotajes.
- `.github/workflows/visibles.yml` en los PR que tocan `public/`, con `visibles-acepta:` en la
  descripción del PR.
- Conducirlo main contra main y contra un sabotaje; entrega, relevo y `CLAUDE.md`.

## Decisiones y hallazgos

- Frena lo que deja de verse y lo que la base tenía en la página pero oculto y ahora se ve; un id
  nuevo que se ve solo avisa (es lo normal de una función nueva).

## Verificación

- Pendiente.
