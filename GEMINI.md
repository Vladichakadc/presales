# GEMINI.md

Este repositorio se trabaja con **Gemini y con Claude Code sobre las mismas reglas**. La fuente única
de verdad es `CLAUDE.md`; este archivo solo la importa y añade lo propio de Gemini.

@./CLAUDE.md

## Notas para Gemini

- Las instrucciones permanentes del dueño de `CLAUDE.md` (español, nunca inventar un dato, recordar
  `PENDIENTES.md`, producción desde `main`) valen igual para Gemini.
- Las skills y hooks de `.claude/` son de Claude Code y Gemini no los ejecuta: léelos como
  documentación de las reglas (`.claude/skills/*/SKILL.md`), no como automatización.
- Antes de cerrar una tarea, `node --test` debe dejar igual o mejor que en `main`.
- Si cambias algo que `CLAUDE.md` describe, actualízalo en el mismo cambio: Claude lo lee al abrir el
  repo. No dupliques su contenido aquí.
