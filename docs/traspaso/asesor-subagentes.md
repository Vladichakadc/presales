# Traspaso: asesor-subagentes

- **Tema:** Sesión principal en Sonnet 5.5 con Opus 5.5 de asesor y tres subagentes Haiku 5.5 de solo lectura
- **Rama:** claude/asesor-subagentes
- **Cuenta:** servicioiptv2025@gmail.com
- **Estado:** bloqueado
- **Actualizado:** 2026-10-31 07:40, hora de Bogotá
- **Archivos que toca:** .claude/settings.json, .claude/agents/, .gitignore, CLAUDE.md (solo al fusionar)
- **Siguiente paso:** cuando se fusione el PR #87 (tiene tomados CLAUDE.md, PENDIENTES.md y RELEVO.md), rebasar sobre main, añadir la sección «Asesor y subagentes» a CLAUDE.md, abrir el PR y hacer el commit de cierre con su número.

## Encargo del dueño

«Ejecuta la sesión principal en Sonnet 5.5 con Opus 5.5 como asesor. Crea tres subagentes de solo
lectura Haiku 5.5: search (mapea el repo), grep (encuentra sitios de llamada), docs (extrae la
referencia de API). Añade una regla a CLAUDE.md: consulta al asesor antes de bloquear un plan,
después del mismo error dos veces, y antes de dar una tarea por terminada.» Después: «Go del 1 a 3»
y «Ejecuta todo por mí». El punto 4 (enrutar micro-forks con Jev) queda fuera de este tema.

## Hecho

- `.claude/settings.json`: `model: claude-sonnet-5-5` y `advisorModel: claude-opus-5-5`; los hooks, intactos.
- `.claude/agents/search.md`, `grep.md`, `docs.md`: `model: claude-haiku-5-5`, `tools` Read, Grep, Glob
  (docs también WebFetch) y `disallowedTools` Write, Edit, NotebookEdit, Bash: el «solo lectura» lo
  impone la lista de herramientas, no el prompt.
- `.gitignore`: `!/.claude/agents/`, con su motivo (sin ello los agentes no viajaban con el repo).

## Falta

- Sección en CLAUDE.md (al fusionar), con este texto:
  «Consulta al asesor antes de fijar un plan, cuando el mismo error aparezca dos veces y antes de dar
  una tarea por terminada. El asesor aconseja; las decisiones siguen requiriendo la aprobación
  explícita del dueño. Para mapear, buscar y leer docs, delega en `search`, `grep` y `docs`.»
  Y en la sección de `.claude/`, que `settings.json` también fija el modelo y el asesor, y que
  `.claude/agents/` se versiona.
- PENDIENTES.md y RELEVO.md en el commit de cierre.

## Decisiones y hallazgos

- `model` en el settings.json del proyecto fija Sonnet 5.5 para todas las sesiones del repositorio,
  también las de la otra cuenta. Quien quiera otro modelo lo pone en su `settings.local.json`.
- No hay ajuste para forzar cuándo se consulta al asesor: eso lo dice la regla de CLAUDE.md.
- La regla del asesor no sustituye la de «las decisiones del dueño no se toman por silencio».

## Verificación

- `npm run verificar`: ver el commit.
