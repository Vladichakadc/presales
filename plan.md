# Plan — Fase 8: marcar EC-XL como fin de venta con fechas oficiales (Aruba)

Aprobado por el dueño (2026-09-13): «SI MARCALO BUSCA EN LA WEB LA FECHA DE ANUNCIO DE
EoS y fecha efectiva de EoS Y FIN DE SOPORTE». Skill: vibecoding-general-swarm, Modo B
(agente único). La investigación web de la fase 7 ya había localizado la fuente oficial;
esta fase la completa con las tres fechas y aplica el marcado.

## Etapas
- F1 ✓ Investigación web: Product Lifecycle Policy oficial de EdgeConnect
  (arubanetworking.hpe.com/techdocs, `EC_LifecyclePolicy_latest.pdf`) — anuncio EoS
  jun-2025, EoS efectivo (último pedido) 2026-03-31, renovación de mantenimiento HW
  hasta 2030-03-31, regla «End of Support +7 años tras EoS» → 2033-03-31. Discrepancia
  con verificadores de terceros documentada; manda el documento oficial. Hallazgo
  adicional: terceros dan EoS también a EC-L-H (2025-12-31) y EC-XS (2026-01-31) — sin
  fuente oficial, quedan pendientes (PENDIENTES.md #16).
- F2 ✓ Marcado en catálogo: mapa `EOL_ANNOUNCED` en `server/seed/legacyData/aruba.js`
  (patrón Cisco) con pid S0B67A, lastOrder 2026-03-31, endOfSupport 2033-03-31 y URL de
  la política; bucle que adjunta `m.eolAnnounced`; `sucesor: null` a propósito (HPE no
  declara sucesor — declararlo sería inferir). Exportado en module.exports.
- F3 ✓ UI: `ficha.js` — rama de fin de venta vencido suma opt-in la frase «El parque
  instalado conserva soporte del fabricante hasta el <fecha>» cuando el modelo trae
  `endOfSupport` (Cisco sin ese campo no cambia). Dimensionador: selector marca
  «· fin de venta»; rama «sin candidato» nombra los EOL que cumplirían con su fecha.
- F4 ✓ Test guardarraíl 10ª prueba: las fechas de `EOL_ANNOUNCED` parsean y
  `endOfSupport` > `lastOrder`.
- F5 ✓ Verificación: npm run verificar (243/243), eslint, resembrar DB local (el seed
  solo siembra DB vacía — hubo que borrar database.sqlite), E2E Chromium (selector con
  marca, ficha «FIN DE VENTA VENCIDO» con ambas fechas, EC-L recomendado a 6 Gbps,
  EC-10150 a 8 Gbps — el hueco >5 Gbps que se temía no existe), captura.
- F6 Commit (español) + push con reintentos + Railway /salud + PENDIENTES.md + bundle v8.
