# Traspaso: visibles-contra-main

- **Tema:** lo visible, contra main: el sondeo del PR #127 como herramienta (scripts/visibles.js) y en los PR que tocan public/
- **Rama:** claude/elegant-pascal-7ymts7
- **Cuenta:** vladichakadc@gmail.com (sesión 01TxCQ3W2sHYVmimAdMKht3j)
- **Estado:** en curso
- **Actualizado:** 2026-11-03 11:40
- **Archivos que toca:** scripts/visibles.js, test/visibles.test.js, .github/workflows/visibles.yml, package.json
- **Siguiente paso:** scripts/visibles.js con su prueba pura, conducirlo main contra main y contra un sabotaje, y el workflow

## Encargo del dueño

«Ejecuta los pendientes como un arquitecto senior con las Skills instaladas y las propuestas de
mejora; no pares hasta no tener resuelto», y «Continuar con ejecución». Es la mejora «Lo visible,
contra `main`, en los PR que tocan `public/`», propuesta al cerrar el PR #127.

## Hecho

- Reserva. La rama que creó `npm run reservar`, `claude/visibles-contra-main`, sobra: esta sesión
  trabaja en `claude/elegant-pascal-7ymts7`, y borrarla da 403 en el proxy de git. Solo lleva el
  traspaso de la reserva; la borra el dueño (`git push origin --delete claude/visibles-contra-main`).
- `scripts/visibles.js`, `test/visibles.test.js` y `.github/workflows/visibles.yml`.

## Falta

- PR (el workflow corre en él: toca la herramienta), `npm run visibles` en `package.json` y
  `CLAUDE.md`, entrega y relevo.

## Decisiones y hallazgos

- Frena lo que deja de verse y lo que la base tenía en la página pero oculto y ahora se ve; un id
  nuevo que se ve solo avisa (es lo normal de una función nueva).
- Un panel que se oculta entero es una línea (`cimas`, con «y N id dentro»): sin eso, el sabotaje de
  `#panelSsr` salía en seis.
- Quitar el `hidden` del HTML de `#tableWrap` no da diferencia, y es correcto: el JS del cotizador lo
  vuelve a ocultar al cargar. Se compara lo que se ve, no el marcado.

## Verificación

- Árbol contra `origin/main`: 163 pasos, 7.951 id visibles, 0 diferencias, mutación vista, 80 s.
- Sabotajes en el navegador: `display:none` en línea en `#panelSsr` frena (una línea, «y 5 id
  dentro»); `#summaryBar` siempre visible frena; un id nuevo en la cuenta solo avisa; `--acepta` lo
  acepta.
- Sabotajes de la regla en `test/visibles.test.js`: lo oculto que aparece como aviso, sin agrupar y
  aceptar sin motivo caen.
