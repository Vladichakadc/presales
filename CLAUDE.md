<!-- claude-skills-manager:installed-skills -->
## Installed Claude Skills

Claude Code discovers and loads skills under `.claude/skills/` automatically — nothing here needs to be read for that to work. This table is kept up to date purely as a human-readable summary of what's installed and why.

| Skill | Detected via | Description |
|---|---|---|
| deployment-practical | `**/*.tf, **/*.bicep, **/azure.yaml, **/azure.yml, **/Dockerfile, **/Dockerfile.*, **/docker-compose*.yml, **/.gitlab-ci.yml, **/azure-pipelines.yml, **/.env*, **/deployment/**` | Deployment-first delivery — concrete architecture and IaC over theoretical advice. Use when deploying, provisioning infra, debugging first-apply failures, or when the user wants advice that works on the first attempt (not hand-wavy theory). Pair with Practical Focus toggle (architecture-first / deploy-ready). |
| file-style-conventions | `**/*` | Apply two lightweight file-hygiene conventions when writing or editing files - no emoji characters outside Markdown (.md) files, and YAML files (.yml/.yaml) end with exactly one trailing newline. Use whenever creating or editing non-Markdown files that might contain emoji, or any .yml/.yaml file. |
| self-learning | `**/*` | Maintain a project-local self-learning base of task/command outcomes — record successes and failures with timestamps, durations, and fixes; generate a patterns report (pass rates, recurring errors, known fixes); and surface a learned hint before retrying something that failed before. Use at the start of a session to check learned hints, after running a non-trivial command/skill to record the outcome, when asked "what failed before" or "what did we learn", or to record a manual decision/learning. |
| skill-creator | `**/*` | Create new skills, modify and improve existing skills, and measure skill performance. Use when users want to create a skill from scratch, edit, or optimize an existing skill, run evals to test a skill, benchmark skill performance with variance analysis, or optimize a skill's description for better triggering accuracy. |
| skill-feedback-adaptation | `**/.claude/learning/skill-feedback.jsonl, **/.claude/learning/task-skill-proposals.json, **/.claude/learning/**` | AUTO-START on new agent session/window (injected by profile-init-watch for Claude, Cursor, Kiro, Copilot) and on new tasks — analyze the prompt and repo, write task-skill-proposals.json, then read top proposed skills before other work. Also register user disagreement into skill-feedback.jsonl when the user says no, not, wrong, stop, or disagrees with agent output. |
| skill-official-updater | `**/*` | At the start of a new session, do a cheap check for new or updated official Anthropic skills (github.com/anthropics/skills) and automatically add or update them in skills_library/ (no user prompt). Also use on explicit request ("check for official skill updates", "sync official skills"). |
| skill-usage-insights | `**/.claude/learning/runs.jsonl, **/.claude/skills/**` | Analyze recorded skill usage in this project (.claude/learning/runs.jsonl, written by self-learning) and the skills installed in .claude/skills/ to produce a usage and KPI report - which skills are actively used and reliable, which are failing, and which are unused or low-value, with recommendations on what to add or remove. Use when asked for "skill usage stats", "skill KPIs", "which skills should we add or remove", or "are our installed skills still useful". |

<!-- /claude-skills-manager:installed-skills -->

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Presales is a set of internal network-equipment presales tools — sizing calculators, a BOM/quote generator, and a design guide — for Huawei, Cisco, Fortinet, Nokia, Juniper, and Arista gear. It's an Express + SQLite backend serving a set of vanilla HTML/CSS/JS pages, deployed as a single Railway service, mirroring the architecture of the sibling projects `chikisdtv` and `credifuturo`. UI text is in Spanish (`lang="es"`); code identifiers (functions, variables) are in English.

**Idioma: todo el texto visible para el usuario (UI, etiquetas, mensajes, comentarios explicativos) debe escribirse en español**, siguiendo la convención existente. Los identificadores de código (nombres de funciones/variables) se mantienen en inglés. Al conversar sobre este proyecto, responde en español.

## Running / developing

```
npm install
npm run dev        # nodemon server/server.js, http://localhost:4000
npm start           # node server/server.js
```

No build step for the frontend — `public/*.html` are served as-is by Express's static middleware; edit and reload. `DATABASE_PATH` (see `.env.example`) controls where the SQLite file lives; unset it locally and it defaults to `./database.sqlite`. On first boot with an empty DB, `server/seed/seedCatalog.js` seeds the catalog automatically — delete `database.sqlite` to force a reseed.

No lint/test tooling is configured yet.

## Architecture

Single Express process (`server/server.js`) serves both the JSON API (`/api/*`) and the static frontend (`public/`) — one Railway service, no client build, matching chikisdtv/credifuturo's production pattern (though they compile a React client; this project has none).

- `server/models/` — Sequelize models. `Product` is the central table: `vendorId`, `model`, `category`, a `specs` JSON column (vendor/category-specific numeric fields — `fwd`, `ipsec`, `mpps`, `poe`, etc. — instead of dozens of nullable columns), `specSummary`, `priceDisplay`/`priceNumeric`, `eol`. `OpticCategory`/`Optic` and `Part` hold Huawei/Cisco optics and BOM parts (joined to `Product` via `ProductOptic`/`ProductPart`); `SupportTier` and `LicenseBundle` hold Hi-Care/SmartNet/FortiCare tiers and Cisco DNA/Fortinet FortiGuard bundles; `RoleRecommendation` backs the design-guide's per-role equipment picks.
- `server/services/catalogProjection.js` — the only place that shapes DB rows into the JSON each frontend page expects. One function per page (`toIndexPR`, `toCotizadorCatalog`, `toDimensionadorHuawei/Cisco/Fortinet`, `toGuiaRoles`) — this is what lets `public/*.html` stay close to their original static-file logic: each page does one `fetch()` and gets back the exact shape its existing render code already expects.
- `server/routes/` — thin route handlers that call the projection functions above. `sync.js` handles AI synchronization via Anthropic's Claude API, using `multer` to accept multipart/form-data uploads (PDF/Excel datasheets) and `xlsx` for parsing spreadsheet catalogs.
- `server/services/aiSync.js` — handles the Anthropic API interaction (currently using `claude-3-5-sonnet-20241022`), passing the full database and uploaded documents to Claude for intelligent catalog comparison and updates.
- `server/seed/legacyData/` — near-verbatim copies of the original hardcoded JS arrays/objects from the pre-migration static files (kept so `seedCatalog.js` transcribes mechanically instead of by hand-retyping). `server/seed/seedCatalog.js` merges these into the normalized schema; see its comments for how overlapping vendor sources (e.g. index.html's `PR` vs a dimensionador's `MODELS`) get reconciled by name-matching, and where that reconciliation is imperfect (disclosed, not silent).

## Files (public/)

- `index.html` — hub/portal. SPA-style routing via CSS class toggling (`.page` / `.page.active`, driven by `go(pageId)`). Fetches `/api/catalog` on load (was a hardcoded `PR` object) into the 7 per-vendor arrays it renders from, plus the Comparador and Throughput Calculator.
- `cotizador.html` — multi-vendor BOM/quote builder. Fetches `/api/cotizador/catalog` (was `CATALOG`). The quote/BOM table itself is unchanged, in-memory client state.
- `dimensionador-bom-huawei-v3_1.html`, `dimensionador-cisco-catalyst8k.html`, `dimensionador-fortinet-fortigate.html` — per-vendor sizing + BOM calculators. Each fetches `/api/dimensionador/<vendor>` for its models/optics/parts/support-tier data (was several hardcoded consts per file); sizing/BOM render logic is unchanged.
- `guia-diseno-interactiva.html` — interactive topology reference. Fetches `/api/guia/roles` (was `EQ`); the SVG topology diagrams themselves (`TOPOS`/`nodes`/`links`) are still static, unchanged.

## Conventions

- Price fields use `elp` (display string) paired with `elpN` (numeric) — prices exclude channel discounts, taxes, and licensing/support costs.
- `eol: true` on a `Product` hides it from `cotizador.html`/`index.html` but not from its own dimensionador page (matches the original static files' behavior — e.g. Cisco ISR 4000 models are still sizeable on the Cisco dimensionador but don't appear in the cotizador catalog).
- The Huawei dimensionador file's `-v3_1` filename suffix is a leftover from the pre-migration static-file era (informal versioning before git existed in this repo) — no longer load-bearing, safe to rename in a future cleanup.

## Roadmap (see plan history for full detail)

Phase 1 (this migration) transcribed the existing hardcoded data as-is for structural parity. 
Phase 2 replaces it with data verified against official Huawei/Cisco/Fortinet sources (e.g. removing EOL ISR 4000 series and replacing with Catalyst 8000). 
Phase 3 added a real "Sincronizar" button (IA Sync) powered by Anthropic's Claude API (`claude-3-5-sonnet-20241022`). It supports local file uploads (PDF datasheets, Excel matrices) to perform strict, zero-duplication comparisons against the active database and propose structured updates.
