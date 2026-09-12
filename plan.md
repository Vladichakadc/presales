# Plan — Fase 5: layout Aruba, unificación ficha/características, limpieza Dimensionar

Petición del dueño (2026-09-13):
1. Todo se fue a la columna izquierda → revisar estructura (grid `.cols` roto en pane-calc y/o pane-bom).
2. Unificar «ficha técnica» con «características del equipo» — sin información redundante.
3. Quitar «Resumen de Sizing» (no se necesita).
4. En «Lista de materiales»: centrar el cuadro «Añadir a la lista de materiales» y el cuadro «Lista de materiales» (están a la izquierda).
5. Uniformidad de página con criterio de diseño web experto.

Skill: vibecoding-general-swarm (Modo B, agente único). Repo reglas: PENDIENTES.md al cerrar,
commits en español, privacidad lista de precios, 233 tests + eslint verdes, E2E con screenshots.

## Diagnóstico previo (hipótesis)
- Fase 4 movió el panel «Equipo y cotización» y `<div id="bomBody">` al pane-calc; al extraer
  el panel del pane-bom se retiró un `</div>` de cierre de columna. Probable desbalance de divs
  en pane-calc (`.cols` con una sola columna => todo a la izquierda) y pane-bom con `.cols`
  huérfano que estrecha los paneles a la izquierda.

## Etapas
- E1 Diagnóstico estructural: contar aperturas/cierres de div por sección en
  dimensionador-aruba-edgeconnect.html; screenshot E2E del estado actual (Dimensionar y
  Lista de materiales) para ver el roto.
- E2 Fix layout pane-calc: grid de 2 columnas coherente (izq: equipo/cotización unificado;
  der: BOM resumen) o la distribución que resulte uniforme con el resto de la página.
- E3 Unificar ficha técnica + características del equipo: una sola tarjeta/sección, sin
  campos repetidos (modelo, throughput, puertos, SKUs...). Decidir qué bloque absorbe al otro.
- E4 Eliminar «Resumen de Sizing» (HTML + JS que lo pinta + CSS huérfano + referencias en tests).
- E5 Layout «Lista de materiales»: quitar grid de columnas ahí; paneles centrados con
  max-width uniforme (mismo ancho que el resto de contenedores de la página).
- E6 Verificación: npm run verificar (233 tests + eslint), E2E Playwright con screenshots
  de ambas pestañas, grep privacidad, humo Fortinet/Cisco.
- E7 Commit + push + verificar Railway /salud + actualizar PENDIENTES.md.

## Decisiones de diseño (a validar en E2–E5)
- Uniformidad: mismo ancho máximo de contenedor, misma separación vertical entre paneles,
  mismas tarjetas `.panel` en todas las pestañas.
- La ficha unificada conserva el aviso de desvío + «Volver al recomendado» (fase 4).
