# AI agent instructions (Claude Skills Manager)

This repository deploys **native GitHub Copilot instructions** under `.github/instructions/*.instructions.md`.
When you work on files matching a skill's `applyTo` globs, follow that skill's instruction file fully.

## Installed skills

| Skill | Applies when |
|---|---|
| deployment-practical | `**/*.tf, **/*.bicep, **/azure.yaml, **/azure.yml, **/Dockerfile, **/Dockerfile.*, **/docker-compose*.yml, **/.gitlab-ci.yml, **/azure-pipelines.yml, **/.env*, **/deployment/**` — Deployment-first delivery — concrete architecture and IaC over theoretical advice. Use when deploying, provisioning infra, debugging first-apply failures, or when the user wants advice that works on the first attempt (not hand-wavy theory). Pair with Practical Focus toggle (architecture-first / deploy-ready). |
| file-style-conventions | `**/*` — Apply two lightweight file-hygiene conventions when writing or editing files - no emoji characters outside Markdown (.md) files, and YAML files (.yml/.yaml) end with exactly one trailing newline. Use whenever creating or editing non-Markdown files that might contain emoji, or any .yml/.yaml file. |
| self-learning | `**/*` — Maintain a project-local self-learning base of task/command outcomes — record successes and failures with timestamps, durations, and fixes; generate a patterns report (pass rates, recurring errors, known fixes); and surface a learned hint before retrying something that failed before. Use at the start of a session to check learned hints, after running a non-trivial command/skill to record the outcome, when asked "what failed before" or "what did we learn", or to record a manual decision/learning. |
| skill-creator | `**/*` — Create new skills, modify and improve existing skills, and measure skill performance. Use when users want to create a skill from scratch, edit, or optimize an existing skill, run evals to test a skill, benchmark skill performance with variance analysis, or optimize a skill's description for better triggering accuracy. |
| skill-feedback-adaptation | `**/.claude/learning/skill-feedback.jsonl, **/.claude/learning/task-skill-proposals.json, **/.claude/learning/**` — Record user disagreement with the agent's output into .claude/learning/skill-feedback.jsonl, attributed to the skill that drove it, and propose skills for a task when the user asks which ones fit. Use when the user rejects or corrects what the agent just did or said, or asks which skills apply to the current task. |
| skill-official-updater | `**/*` — Check github.com/anthropics/skills for new or updated official Anthropic skills and sync them into a skills library that has skills_library/. Use on explicit request ("check for official skill updates", "sync official skills"). This repository has no skills_library/ (its skills live in .claude/skills/, copied by hand from the sibling repository's library), so here report what changed upstream and let the user decide what to copy; do not create skills_library/. |
| skill-usage-insights | `**/.claude/learning/runs.jsonl, **/.claude/skills/**` — Analyze recorded skill usage in this project (.claude/learning/runs.jsonl, written by self-learning) and the skills installed in .claude/skills/ to produce a usage and KPI report - which skills are actively used and reliable, which are failing, and which are unused or low-value, with recommendations on what to add or remove. Use when asked for "skill usage stats", "skill KPIs", "which skills should we add or remove", or "are our installed skills still useful". |

## How to use in agent mode

1. Prefer instructions whose `applyTo` matches the files you are editing.
2. If multiple match, combine them; if they conflict, ask the user.
3. Do not invent procedures — use the installed `.instructions.md` files.
4. Claude Code skills live under `.claude/skills/`; Copilot uses this folder.
