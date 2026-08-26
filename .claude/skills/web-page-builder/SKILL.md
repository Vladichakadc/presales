---
name: web-page-builder
description: Build and refine React web pages and UI components in this project's stack (React + Vite + Tailwind CSS v3 + Lucide icons). Use when creating or restructuring admin/user pages, layouts, forms, tables, or reusable UI primitives. Pairs with frontend-design for aesthetics.
metadata:
  stack: React 18, Vite, Tailwind CSS v3, Lucide React, Recharts
  ui-language: Spanish (Colombian peso, es-CO formatting)
---

# Web Page Builder (Credifuturo stack)

Use this skill to implement or restructure pages and components. It encodes how THIS codebase is wired so new UI is consistent with what already exists. For the aesthetic point-of-view (typography, color, motion, composition), apply the `frontend-design` skill alongside this one.

## Project conventions (follow these)

- **All API calls go through `src/config/api.js`** — never call `axios`/`fetch` directly. Use the exported `api` instance (auto-attaches the JWT Bearer token) or `apiWithRetry()` for flaky endpoints.
- **className composition**: use `cn()` from `src/utils/cn.js` (clsx + tailwind-merge) for conditional classes. Never hand-concatenate class strings.
- **Reuse primitives in `src/components/ui/`** (Button, Card, Input, Badge, DataTable) before introducing new ones. Admin-specific composites live in `src/components/admin/`.
- **Layouts**: admin pages render inside `DashboardLayout`; member pages inside `UserDashboardLayout`. Routes are declared in `App.jsx` (React Router v6) and split into `/admin` and `/dashboard` trees.
- **Icons**: Lucide React only — keep the icon set consistent.
- **Money & dates**: format pesos with `Number(v).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })` and prefix `$`. Use the helpers in `src/utils/` (`formatDate`, `excelUtils`) rather than re-implementing.
- **Spanish UI**: all visible copy is in Spanish; match existing terminology (socio, ahorro, aporte, préstamo, cuota, mora).

## Build workflow

1. **Locate the pattern.** Find the closest existing page (`pages/admin/*` or `pages/user/*`) and mirror its data-loading, loading/empty/error states, and layout shell. Consistency beats novelty for internal tools.
2. **Data first.** Sketch the API calls (which `/api/admin/*` or `/api/admin/my/*` endpoints), the shape of the response, and the loading/empty/error states before writing JSX.
3. **Compose from primitives.** Build with `ui/` components; only drop to raw Tailwind for layout glue.
4. **State & a11y.** Every async view needs explicit `loading`, empty, and error UI. Inputs get labels; interactive elements are keyboard-reachable; color is never the only signal (pair with text/icon).
5. **Responsive.** Mobile-first Tailwind; verify at `sm`/`md`/`lg`. Tables should scroll or collapse gracefully on narrow screens.

## Quality checklist before declaring done

- [ ] No direct `axios`/`fetch` — routed through `config/api.js`
- [ ] Conditional classes via `cn()`
- [ ] Loading + empty + error states implemented
- [ ] Pesos/dates formatted with the shared helpers (`es-CO`)
- [ ] Reused `ui/` primitives; no duplicate one-off components
- [ ] Keyboard accessible, labeled inputs, sufficient contrast
- [ ] Verified in the browser via `npm run dev` (port 5173), not just type-check

## Print/PDF gotcha (this repo)

`DashboardLayout`'s content div has `overflow-x-hidden`, which clips descendants in print mode. Any page meant to print must include in its `@media print` block:

```css
* { overflow: visible !important; max-height: none !important; }
```

When in doubt about whether a page prints correctly, test with the browser print preview, not assumptions.
