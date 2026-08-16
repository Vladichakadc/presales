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
- `server/routes/` — thin route handlers that call the projection functions above.
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

Phase 1 (this migration) transcribed the existing hardcoded data as-is for structural parity. Phase 2 replaces it with data verified against official Huawei/Cisco/Fortinet sources. Phase 3 adds a real "Sincronizar" button (Claude API + web search, review-before-write) — not built yet; `ANTHROPIC_API_KEY` in `.env.example` is reserved for it.
