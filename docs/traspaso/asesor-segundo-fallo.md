# Traspaso: asesor-segundo-fallo

- **Tema:** El segundo fallo seguido del mismo npm run recuerda consultar al asesor (hook de aprendizaje.sh)
- **Rama:** claude/elegant-pascal-7ymts7
- **Cuenta:** vladichakadc@gmail.com (sesión 01TxCQ3W2sHYVmimAdMKht3j)
- **Estado:** en curso
- **Actualizado:** 2026-11-04 05:45
- **Archivos que toca:** .claude/hooks/aprendizaje.sh, .claude/hooks/lib-fallos.js, test/aprendizaje-hook.test.js
- **Siguiente paso:** abrir el PR y cerrar con su entrega (CLAUDE.md en el commit de cierre)

## Encargo del dueño

«Ejecuta los pendientes como un arquitecto senior con las Skills instaladas y las propuestas de mejora; no pares hasta no tener resuelto». Es la mejora «Que el segundo fallo seguido del mismo comando recuerde consultar al asesor», propuesta al cerrar el PR #94.

## Hecho

- `.claude/hooks/lib-fallos.js`: cuenta los fallos seguidos de una acción con `runs.jsonl` y `en-curso.jsonl`.
- `.claude/hooks/aprendizaje.sh`: en `PreToolUse`, antes de abrir la corrida, devuelve el recordatorio en `additionalContext` si van dos o más.
- `test/aprendizaje-hook.test.js`: conduce el hook con el JSON de Claude Code (también el registro, que no tenía prueba).

## Falta

- PR, entrega, relevo y `CLAUDE.md` en el cierre.

## Decisiones y hallazgos

- `additionalContext` en `PreToolUse` lo documenta code.claude.com/docs/en/hooks; sin `permissionDecision`, que aprobaría o frenaría.
- Una corrida en tubería (`| tail`) queda con rc=0 aunque npm falle: medido con dos `reservar` que fallaron.

## Verificación

- `node --test test/aprendizaje-hook.test.js`: 5/5; caen los sabotajes (la regla no cuenta, o el hook devuelve `permissionDecision`).
