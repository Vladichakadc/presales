---
name: project-kickoff
description: Kickoff / discovery activities at the start of a new feature, page, or initiative — clarify goals, users, scope, and success criteria before design or code begins. Use when starting something new or when a request is broad ("build a reports module", "redo the dashboard").
metadata:
  output: a short kickoff brief agreed with the user
---

# Project / Feature Kickoff

Use this skill at the very start of a new piece of work to align on intent before any design or implementation. A 5-minute kickoff prevents building the wrong thing. The output is a concise brief, not a heavy document.

## When to use

- Starting a new feature, page, module, or redesign.
- The request is broad, strategic, or could go several directions.
- Stakeholders/users aren't clearly identified yet.

## Discovery questions (ask the ones that matter, skip the obvious)

1. **Problem** — What problem are we solving, and what happens today without it?
2. **Users** — Who uses this? Admin (gestor de la cooperativa) or socio (member)? Their goal in one sentence.
3. **Success** — How will we know it worked? A concrete, observable outcome.
4. **Scope** — What's explicitly IN and OUT for this round? Name the smallest version that delivers value.
5. **Data** — What data drives it, and where does it live (which endpoints/models)? Any money-math definitions to pin down up front (gross vs net, which period)?
6. **Constraints** — Deadlines, must-reuse components, print/PDF or Excel export needs, Spanish copy specifics.
7. **Risks** — Anything irreversible, production-data-touching, or high-blast-radius?

Use `AskUserQuestion` to offer concrete options when a decision has a few clear paths, rather than asking open-ended questions repeatedly.

## Kickoff brief template

```markdown
## Feature: <name>
**Problem**: <what & why now>
**Primary user**: <admin | socio> — <their goal>
**Success looks like**: <observable outcome>
**In scope**: <smallest valuable slice>
**Out of scope (this round)**: <deferred items>
**Data & endpoints**: <models/routes involved; metric definitions>
**Constraints**: <deadlines, exports, reuse, copy>
**Open questions**: <to resolve before building>
```

## After the brief

- Hand off to `feature-planning` to turn the agreed brief into a file-level implementation plan.
- Apply `frontend-design` + `web-page-builder` for the build, and `data-viz-charts` for any graphs.
- Keep the smallest valuable slice in view — ship that first, defer the rest to follow-ups.
