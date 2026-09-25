# Plan — Refactor integral del dimensionador Aruba (brief de 7 módulos, 2026-09-13)

Skill: vibecoding-general-swarm (Mode A). SPEC.md = contrato. Coordinación por
bundles en /mnt/agents/output/ (cada subagente tiene /tmp aislado).

- Etapa 1 (DATOS, subagente): tiers 20M-2G en LICENSES/LICENSES_HA, SSE, Microbranch,
  CSV 192 filas, tests. ENTREGADO (9bcd3ca, 266/266).
- Etapa 2 (MOTOR, subagente): builder multi-underlay, motor 70/30, auditoría puertos,
  tiers filtrados, SSE, inyección hardware, widget, TCO multi-sede. EN CURSO.
- Etapa 3 (orquestador): merge, npm run verificar, commit, push, bundle, E2E
  (/tmp/e2e-refactor.js), PENDIENTES, informe con pendientes + mejora propuesta.
