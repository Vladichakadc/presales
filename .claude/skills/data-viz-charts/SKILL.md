---
name: data-viz-charts
description: Design and build clear, accurate financial charts and dashboards with Recharts (this project's charting library). Use when adding or improving graphs, KPIs, rankings, or data visualizations on admin/user dashboards.
metadata:
  library: Recharts
  domain: microfinance KPIs (ahorros, préstamos, cuotas, mora)
---

# Data Visualization & Charts (Recharts)

Use this skill when building or improving any chart, KPI card, or dashboard visualization. The goal is charts that are **truthful first, beautiful second** — financial data must never mislead.

## Choose the right chart

- **Trend over time** (ahorros por mes, recaudo mensual) → line or area chart.
- **Comparison across categories** (ahorro por socio, cartera por estado) → bar chart (horizontal when labels are long, e.g. member names).
- **Part-to-whole** (composición de cartera) → stacked bar; avoid pie charts beyond ~4 slices.
- **Single headline number** (Saldo en Banco, Capital Ahorrado) → KPI stat card, not a chart.
- **Distribution / outliers** → consider a sorted bar (ranking) over a histogram for a non-technical audience.

Don't add a chart where a number or small table communicates faster.

## Accuracy rules (non-negotiable for money)

- **Never truncate the Y axis baseline** on bar charts — start at 0 so bar heights are proportional. Truncation exaggerates differences.
- **Label the unit** ($ COP) and the period. Ambiguous axes cause misreadings.
- **Match the metric to its definition.** In this domain, gross vs. net amounts differ on purpose (e.g. `amount` is gross inflows; `valorAhorrado` is net of penalties). State which one a chart uses and stay consistent within a view.
- **Format pesos** with `toLocaleString('es-CO', { maximumFractionDigits: 0 })` and a `$` prefix in tooltips, axis ticks, and labels.
- **Handle missing/zero data explicitly** — show an empty state, don't render a misleading flat line or a broken axis.

## Recharts implementation notes

- Wrap charts in `<ResponsiveContainer width="100%" height={...}>` so they adapt to the layout.
- Provide a custom `<Tooltip formatter={...}>` that formats pesos and uses Spanish labels.
- Use the project's corporate palette (CSS variables / Tailwind theme) for series colors; keep a consistent color → metric mapping across the dashboard (e.g. ahorro = green, préstamo = blue) so users build muscle memory.
- Add `<CartesianGrid>` lightly (low-contrast) for readability; don't let gridlines compete with data.
- For many categories, sort descending and consider `layout="vertical"` (horizontal bars) with adequate left margin for Spanish member names.
- Memoize derived chart data (`useMemo`) so re-renders don't recompute aggregations.

## Accessibility & clarity

- Color is a secondary signal — pair series with direct labels or a legend; ensure contrast for color-blind users.
- Give every chart a concise Spanish title and, when useful, a one-line caption explaining the metric definition.
- Keep tick counts low; abbreviate large pesos in axes ($1.2M) but show full values in tooltips.

## Checklist

- [ ] Correct chart type for the question being answered
- [ ] Y axis starts at 0 for bars; units and period labeled
- [ ] Pesos formatted `es-CO`, consistent metric definition stated
- [ ] Empty/zero/missing-data state handled
- [ ] Responsive container; palette consistent with the rest of the dashboard
- [ ] Verified visually in `npm run dev`
