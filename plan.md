# Plan — Fase 11: suite integral de diseño, dimensionamiento y cotización Aruba

Brief del dueño (2026-09-13, segundo documento): «Ingeniero Principal Full-Stack y
Arquitecto Senior HPE Aruba (ESP, EdgeConnect, SD-Branch, Central, SASE/SSE)» — refactor
integral del módulo en 6 secciones + aplicar la mejora propuesta de la fase 10 (matriz de
funciones por modelo). Skill: vibecoding-general-swarm, Modo B. Aruba sigue de piloto.
Regla de oro heredada: COMMIT TRAS CADA ETAPA ESTABLE (el /tmp se borra entre turnos).

## Alcance por secciones del brief

### 1. Pestaña DIMENSIONAR
- 1.1 YA HECHO (fase 9): sin throughput firewall ni túneles IPsec; TAA tras toggle.
- 1.2 Selector de arquetipo de sede (personas): Micro-Sucursal/Teletrabajador (EdgeConnect
  Microbranch — AP 500H/600H con SD-WAN por Central, declarado, sin gateway), Sucursal
  Pequeña (9004/EC-10104), Mediana (9012/EC-10106/10108), Campus/DC (9240, EC-10150, EC-V).
- 1.3 Transporte dual: Enlace 1 MPLS [Ninguno/L3 eBGP/L2 Metro-E/VPLS/EVPN] + Mbps;
  Enlace 2 Internet [Ninguno/DIA/Banda ancha/4G-5G-Satelital] + Mbps. Checkbox Local
  Breakout (DIA+FPiQ) activo por defecto: 70% del tráfico sale local, 30% al DC por túnel;
  muestra el ahorro de MPLS evitado. Licencia EdgeConnect = agregado MPLS+Internet (VSG).
- 1.4 Flujos: 80/usuario estándar, 150/usuario intensivo (NUEVA cifra del dueño — sustituye
  la regla 100/200 de la fase 9, se documenta el cambio). Filtro de chasis por flujos.
  Degradación IMIX 30% sobre throughput nominal (~570 bytes): capacidad efectiva = 0,70×.
- 1.5 Widget 3 barras: físico contratado / útil tras FEC (BW/(1+FEC)) / equivalente Boost.
- 1.6 Estrategia de seguridad (radio): SSE por usuario (agrega suscripción por usuario al
  BOM, «consultar» si no hay precio) vs DTD en chasis (+35% carga CPU al dimensionar).
- 1.7 Multi-sede: perfiles de sitio guardables («Tienda ×50») y BOM global consolidado.

### 2. Pestaña BOM
- 2.1 Modal de accesorios al meter chasis con SFP/SFP+: J4858D, J4859D, J9150D, J9151E,
  J9281D/J9283D DAC + segunda PSU y cables. Precios: lista documentada o «consultar».
- 2.2 Co-terming estricto: YA HECHO (selector único 1/3/5).
- 2.3 Simulador de netos: [List 0%, BP 35%, Silver 45%, Gold 50%, Platinum 55%, OPG %]
  con columnas paralelas LIST/NET en el BOM.
- 2.4 CAPEX (hardware+accesorios) vs OPEX (suscripciones+soporte) y TCO 1/3/5 años.

### 3. Pestaña LICENCIAS
- 3.1 Motor automático: YA HECHO (fases 9-10, con correcciones oficiales: DPS es Foundation).
- 3.2 Calculadora de pool Boost: sedes con latencia/transferencias masivas → bloques 100M.
- 3.3 Sección SASE/SSE: tiers Essential/Advanced/Complete por usuario + integración EC.

### 4. Pestaña CATÁLOGO
- 4.1 Semáforo de ciclo de vida: verde 9000/9100/9200/EC; naranja legacy 7000/7200.
- 4.2 Tech Refresh: 7005/7008→9004, 7030→9012, 7210/7220→9240.
- 4.3 Specs canónicas: WAN bidireccional, max flows, IPsec IMIX, SSD Boost, RU, watts.

### 5. Pestaña FUENTES
- 5.1 Price Delta Viewer: importar CSV nuevo → resalta subidas/bajadas/nuevos/ES.
- 5.2 Matriz de SO mínimo: ECOS por hardware EC; AOS-8 vs AOS-10 en gateways.
- 5.3 Link Health Check: endpoint servidor que verifica HTTP 200 de las URLs oficiales.

### 6. Nuevas pestañas
- 6.1 «Arquitectura y Topología»: diagrama SVG (spokes, hubs, MPLS, Internet, SSE) + PNG/SVG.
- 6.2 «Generador de Propuesta Técnica»: informe formal descargable (justificación, BOM,
  TCO, alcance de soporte) — texto estructurado + impresión a PDF.

### 7. Mejora propuesta fase 10 (aprobada): matriz FUNCIONES_POR_MODELO en la ficha
- Filas: Boost, DTD/IDS-IPS, Segmentación >3 BIOs, HA 1+1, FEC/POC, SSE.
- Celdas: Soportada / Exige Advanced / No soportada (ámbar, con motivo oficial).
- Mapa declarativo en el seed + test.

## Etapas de ejecución (commit tras cada una)
- E1 Investigación web (3 agentes): (a) Microbranch 500H/600H + ECOS mínimas + AOS-8/10 +
  EoS 7000/7200; (b) SSE tiers/SKUs + accesorios (transceivers/PSU/cables) con precios
  citables; (c) validar IMIX 30%, split 70/30, DTD +35% CPU.
- E2 Motor DIMENSIONAR (1.2-1.6) + tests.
- E3 BOM financiero (2.1, 2.3, 2.4) + tests.
- E4 Multi-sede (1.7) + calculadora pool Boost (3.2).
- E5 Catálogo + Fuentes (4.x, 5.x).
- E6 Nuevas pestañas (6.1, 6.2).
- E7 Matriz FUNCIONES_POR_MODELO (mejora propuesta).
- E8 Verificación integral, E2E, PENDIENTES, bundle v11, informe.
