# Plan — Fase 9: refactor del Dimensionador y BOM Aruba (SD-WAN por flujos + licenciamiento automático)

Disparado por el brief del dueño (2026-09-13): «Actúa como un Arquitecto de Soluciones de
Redes especializado en HPE Aruba Networking (EdgeConnect Enterprise y SD-Branch)». La SD-WAN
de Aruba no se rige por túneles IPsec estáticos sino por Business Intent Overlays (BIO),
flujos simultáneos y First-packet iQ (10.000+ apps; AppRF 3.500+ en SD-Branch). Skill:
vibecoding-general-swarm, Modo B (agente único). Aruba es el piloto — NO se aplica a otros
fabricantes hasta que el dueño lo diga.

## Bloques del brief
1. Depuración de parámetros: fuera «Túneles IPSec»; fuera el input manual de throughput de
   firewall; opciones gubernamentales (TAA/NAL) a un menú avanzado secundario.
2. Dimensionamiento por flujos y aplicaciones: (A) flujos simultáneos auto-calculados
   (estándar 80-100/usuario, intensivo 150-200/usuario — se usa el extremo alto como
   headroom incorporado) y el chasis recomendado debe soportarlos; (B) selector de
   estrategia de aplicaciones Cloud-First/SaaS (First-packet iQ para DIA/SSE) vs
   Híbrido/DC privado (Path Conditioning FEC/POC); pregunta Boost (CIFS/SMB, transferencias
   masivas, satelitales Sí/No) — si Sí, Boost auto = 30% del tráfico WAN privado y su SKU.
3. Motor de licenciamiento 100% automático: sin selección manual de licencia. Advanced si
   el diseño requiere DPS por SLA de aplicación, NGFW/IDS/IPS o AIOps; si no, Foundation.
   SKU por familia/tier de hardware + ancho de banda. Co-terminación: un único selector de
   duración [1,3,5 años] para licencias y soporte. HA 1+1: duplica chasis y soportes de
   hardware y aplica la cantidad de licencia de gestión correspondiente.
4. Entregables: formulario DIMENSIONAR actualizado; motor JS refactorizado con validación
   de flujos y catálogo dinámico de licencias; tabla BOM sin intervención manual.

## Correcciones del brief contra la fuente oficial (documentadas, QuickSpecs v18 p.31-32)
- Dynamic Path Steering y el NGFW completo son Foundation, no Advanced (p.31).
- IDS/IPS no es un tier: es la licencia opcional aparte «Dynamic Threat Defense» (p.32),
  sin precio publicado → «consultar».
- DIA / First-packet iQ / encadenamiento SSE son funciones de plataforma, no de tier:
  Cloud-First no fuerza Advanced.
- Advanced se deduce de: más de 3 BIOs / VRFs avanzadas, topología fuera de hub-and-spoke
  (más de 4 hubs/región), o AIOps/retención ampliada.
- HA 1+1: HPE publica SKU «HA» propios para el segundo nodo, precio idéntico tier a tier
  y año a año (18 SKU en LICENSES_HA). Equivalencia E-STU de HA on-premises NO confirmada
  → on-prem HA cotiza 2× estándar con declaración.

## Etapas
- F1 ✓ Datos: BUNDLES reescrito con la matriz oficial p.31 + comentario de procedencia de
  las 3 correcciones; LICENSES_HA (3 tiers × 2 niveles × 3 términos) en aruba.js y
  exportado; 18 filas HA insertadas en el CSV (95 líneas); catalogProjection expone
  `licensesHa`.
- F2 ✓ Formulario (HTML): panel 1 con destSeg (Híbrido/DC privado ↔ Cloud-First/SaaS) +
  hint dinámico y chkBoost con la regla del 30%; panel 2 con perfilEntorno
  (estándar ~100 / intensivo ~200 flujos por usuario); panel 3 con chkSeg (>3 BIOs/VRFs),
  chkTopo, chkDtd, chkAiops, chkHa — chkBreakout eliminado; panel 4 con licenciamiento
  automático de solo lectura (licAutoTxt/centralAutoTxt/capAutoTxt + chkNoSub/chkNoCentral/
  chkSoloHw), careLevel manual y details.adv (chkOnprem + puntero TAA); CSS .lic-auto y
  details.adv; botón skuTaa; flag-ft 94 SKU; pane-lic con la matriz oficial + fila DTD +
  regla Boost 30% + nota soporte incluido.
- F3 ✓ Motor (JS): globals LICENSES_HA/skuTaaOn; destMode + DEST_HINT; estadoDerivado()
  como función pura única del formulario (bw, users, perfil, flujosReq, tier, bundle,
  central, termYrs, care, qty, bloques...); render/candidatos con filtro outByFlujos y
  medidor de flujos; porQueDe reescrito; seccionesDe derivadas; renderBom reescrito
  (visibilidad de campos, textos auto, split HA 1× estándar + 1× SKU «HA», línea DTD
  «consultar», notas meta con la línea de flujos y «CÓMO SE LICENCIA»); SKU_CAT_ORDEN con
  las 2 categorías HA + TAA_RE; pintarCatalogoSku filtra TAA salvo toggle; listener
  skuTaa; estado campos y initApp actualizados.
- F4 ✓ Tests: import LICENSES_HA; FAMILIAS_CSV +2; cruce CSV↔seed también para HA;
  3 pruebas nuevas (cobertura 3×2×3 con precios positivos y sin on-prem a propósito;
  invariante QuickSpecs precio HA == estándar; todo modelo publica flujos o declara por
  qué no — EC-V y «Gateway 9240» declarados).
- F5 ✓ Fuentes: entrada Aruba de la lista de precios actualizada (cubre +HA; nota con la
  extracción HA, EC-XL RESUELTO con fechas oficiales y la nota del refactor p.31/DTD).
- F6 Verificación: node --check, npm run verificar (esperado 246/246), resembrar DB local,
  E2E Chromium (Foundation/Advanced auto con motivos, filtro de flujos EC-10106→EC-M,
  Boost 30% auto, split HA, línea DTD, toggle TAA 86↔94, categorías HA 9+9, humo Fortinet,
  cero errores de consola).
- F7 Cierre: PENDIENTES.md, commit en español, push con reintentos verificando el exit
  code real, Railway /salud ×3, bundle v9. COMMIT TEMPRANO: en cuanto verificar pase,
  antes del E2E — un wipe de /tmp ya destruyó una vez este trabajo sin commitear.
