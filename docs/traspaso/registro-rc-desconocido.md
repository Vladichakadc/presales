# Traspaso: registro-rc-desconocido

- **Tema:** El registro de corridas apunta rc desconocido cuando el código de la línea no es el de npm (decisión del dueño, 2026-11-04)
- **Rama:** claude/elegant-pascal-7ymts7
- **Cuenta:** vladichakadc@gmail.com (sesión 01TxCQ3W2sHYVmimAdMKht3j)
- **Estado:** en curso
- **Actualizado:** 2026-11-04 06:11
- **Archivos que toca:** .claude/hooks/lib-comando.js, .claude/hooks/aprendizaje.sh, .claude/hooks/lib-fallos.js, .claude/hooks/pre-push.sh, test/aprendizaje-hook.test.js, test/pre-push-hook.test.js, .claude/skills/skill-usage-insights/SKILL.md, .github/instructions/skill-usage-insights.instructions.md
- **Siguiente paso:** abrir el PR y cerrar con su entrega (CLAUDE.md en el commit de cierre)

## Encargo del dueño

Preguntado el 2026-11-04 si, cuando un `npm run` va seguido de `| tail` o `; echo`, el registro debía apuntar «desconocido» o dejarlo como está, el dueño eligió «Apuntar «desconocido» (Recomendado)».

## Hecho

- `lib-comando.js`: `rcEsDeNpm(cmd)`, fiable solo si detrás de npm hay `&&` o `|` con `set -o pipefail` antes; lo que va entre comillas no separa.
- `aprendizaje.sh`: rc=null (con su `note`) si no es fiable o va en segundo plano.
- `lib-fallos.js`: rc=null ni corta ni alarga la racha.
- `pre-push.sh`: un `verificar` de resultado desconocido más reciente que el último verde lo dice y pide confirmación.
- `skill-usage-insights`: `rc: null` fuera de la tasa de éxito, y su copia para Copilot regenerada.

## Falta

- PR, entrega, relevo y `CLAUDE.md` en el cierre.

## Decisiones y hallazgos

- Primera versión: el `|` de `grep -E "^# (pass|fail)"` contaba como tubería y daba un falso «desconocido». Lo cazó el registro real; ahora se vacían las comillas antes de partir.

## Verificación

- `node --test test/aprendizaje-hook.test.js test/pre-push-hook.test.js`: 17/17; caen los sabotajes (rc siempre 0, y `pre-push.sh` sin el caso desconocido).
- `npm run verificar`: 1.425/1.425, registrado con rc=0 por el hook real (detrás solo `&&`).
