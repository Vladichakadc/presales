# Plan — Fase 7: guardarraíl de integridad de precios + alerta End-of-Sale (Aruba)

Aprobado por el dueño (2026-09-13): implementar las dos mejoras propuestas al cierre de la
fase 6. Skill: vibecoding-general-swarm, Modo B (agente único). Investigación web previa
para confirmar el significado de los códigos PLC de HPE (GA/ES) y el estado del EC-XL, de
modo que los textos de la UI sean exactos.

## Etapas
- F1 ✓ Investigación web: significado de los PLC Status de HPE (GA, ES…) y noticias de
  fin de venta del EC-XL / sucesor. Solo informa textos y PENDIENTES — no se toca el
  catálogo sin decisión del dueño.
- F2 ✓ Test guardarraíl `test/aruba-integridad-precios.test.js`:
  (1) todo hwSku de MODELS está en el CSV con precio no vacío;
  (2) no hay SKU duplicados en el CSV;
  (3) todo SKU de CARE_SKU tiene sus 3 términos con precio positivo y no choca con el CSV;
  (4) ninguna fila del CSV tiene precio vacío;
  (5) todo modelo_dimensionador del CSV existe en MODELS o es familia conocida.
- F3 ✓ Alerta EoS en UI: mapa plcPorSku desde el CSV; filas «ES» en el panel de añadir con
  estilo ámbar + «fin de venta — confirmar sucesor»; aviso ámbar sobre el BOM si alguna
  línea cotizada tiene PLC «ES» + nota en la exportación Excel/texto.
- F4 ✓ Verificación: npm run verificar (tests viejos + nuevos), eslint, E2E Chromium
  (S3N77A marcada, BOM con S3N77A añadida muestra el aviso, modelo normal sin aviso),
  grep privacidad, humo Fortinet.
- F5 ✓ Commit (español) + push con reintentos + Railway /salud + PENDIENTES.md + bundle v7.
