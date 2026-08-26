---
name: feature-planning
description: Plan a frontend/feature change before writing code — turn a vague request into a concrete, file-level implementation plan with risks and a verification strategy. Use for any change touching more than one or two files, or anything ambiguous.
metadata:
  output: a short markdown plan reviewed with the user before coding
---

# Feature Planning

Use this skill to move from "I want X" to a precise plan, BEFORE editing code. Good planning prevents half-built features and rework. Keep the plan short and concrete — it's a working document, not a spec.

## When to use

- The change spans multiple files, layers (frontend → API → DB), or pages.
- The requirement is ambiguous or could be interpreted several ways.
- The work touches money math, reporting, or data integrity (high blast radius in this app).

Skip for trivial one-file edits — just do them.

## Planning steps

1. **Restate the goal in one sentence.** What does the user actually want, and who benefits? Confirm if unclear.
2. **Map the current state.** Which pages, components, endpoints (`routes/admin.js` etc.), and models are involved? Read them first — don't plan against assumptions.
3. **Define done.** List the observable outcomes that mean success (what the user sees/can do). Include edge cases: empty data, inactive socios, prepaid months, mora.
4. **List the changes file-by-file.** For each: path, what changes, and why. Flag any change to shared code (`config/api.js`, `models/`, layouts) since it has wide reach.
5. **Surface risks & domain gotchas.** Money fields with subtle semantics (gross `amount` vs net `valorAhorrado`), date fields (`monthInt`/`year` = transaction date vs `mesAbonado`/`anioAbonado` = credited period), the `clientEstatus` flat field, the JWT-secret duplication. Note anything irreversible.
6. **Verification strategy.** How will this be checked? (Run `npm run dev`, exercise the golden path + an edge case in the browser; compare a computed total against a known reference.) State explicitly if something can't be verified.
7. **Review with the user** for anything non-trivial before implementing. Adjust, then build.

## Plan template

```markdown
## Goal
<one sentence>

## Definition of done
- [ ] <observable outcome>
- [ ] <edge case handled>

## Changes
- `path/to/file` — <what & why>

## Risks / gotchas
- <domain semantic or irreversible action to watch>

## Verification
- <how it will be confirmed working>
```

## Notes

- Prefer editing existing files over adding new ones; reuse `ui/` primitives and existing endpoints.
- Don't expand scope mid-plan. If you discover adjacent problems, note them as follow-ups rather than silently fixing them.
- For production data changes, plan a backup + verification step and confirm with the user (production is the source of truth).
