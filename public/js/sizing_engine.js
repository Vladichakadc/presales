/**
 * @file sizing_engine.js
 * @description Motor Unificado Carrier-Grade de Dimensionamiento, BOM, Auditoría de Ópticas,
 * Rollout Multi-Sede, Simulador Financiero Telco (MRR/OpEx/TCV) y Estado Reactivo (PresalesState).
 * Compatible con Navegador (window.PresalesEngine) y Node.js / CommonJS (server/ & node --test).
 * Proyecto: https://github.com/Vladichakadc/presales (presales.up.railway.app)
 * Sincronizado para flujo colaborativo Gemini <-> Claude Code.
 */

/* global module, self */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.PresalesEngine = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // ============================================================================
  // 1. CATÁLOGOS CANÓNICOS DE HARDWARE, ÓPTICAS Y CICLO DE VIDA
  // ============================================================================

  const HUAWEI_HARDWARE_CATALOG = [
    {
      sku: '02352EPG',
      modelo: 'NetEngine AR651',
      serie: 'NetEngine AR',
      rol_recomendado: ['BRANCH'],
      segmento: 'Branch Pequeña / Retail',
      forwarding_capacity_mbps: 1000,
      imix_capacity_mbps: 400,
      ipsec_capacity_mbps: 400,
      max_ipsec_tunnels: 200,
      mpps: 0.45,
      fib_routes: 50000,
      cgnat_sessions: 32000,
      puertos_fijos: '2x GE Combo WAN + 8x GE RJ45 LAN',
      puertos_detalle: { rj45_1g: 8, combo_1g: 2, sfp_1g: 2, sfp_plus_10g: 0, sfp28_25g: 0, qsfp28_100g: 0 },
      slots_expansion: 'N/A',
      form_factor: '1U Fijo',
      dual_psu: false,
      modular: false,
      psu_sku: null,
      licencia_foundation_sku: 'N1-AR650-F-LIC',
      licencia_advanced_sku: 'N1-AR650-A-LIC',
      utm_sub_prefix: 'LIC-AR651-SEC-SUB',
      hicare_standard_prefix: 'HC-S-AR651',
      hicare_premier_prefix: 'HC-P-AR651',
      list_price_usd: 1150,
      consumo_watts: 36,
      lifecycle_status: 'VIGENTE / CARRIER-GRADE'
    },
    {
      sku: '02353EGE',
      modelo: 'NetEngine AR6121',
      serie: 'NetEngine AR',
      rol_recomendado: ['BRANCH'],
      segmento: 'Branch Mediana',
      forwarding_capacity_mbps: 2000,
      imix_capacity_mbps: 1000,
      ipsec_capacity_mbps: 800,
      max_ipsec_tunnels: 500,
      mpps: 1.2,
      fib_routes: 150000,
      cgnat_sessions: 128000,
      puertos_fijos: '2x 10GE SFP+ WAN + 8x GE RJ45',
      puertos_detalle: { rj45_1g: 8, combo_1g: 0, sfp_1g: 0, sfp_plus_10g: 2, sfp28_25g: 0, qsfp28_100g: 0 },
      slots_expansion: '2x SIC slots',
      form_factor: '1U Fijo',
      dual_psu: true,
      modular: false,
      psu_sku: 'PAC-150WA',
      licencia_foundation_sku: 'N1-AR6100-F-LIC',
      licencia_advanced_sku: 'N1-AR6100-A-LIC',
      utm_sub_prefix: 'LIC-AR6121-SEC-SUB',
      hicare_standard_prefix: 'HC-S-AR6121',
      hicare_premier_prefix: 'HC-P-AR6121',
      list_price_usd: 2650,
      consumo_watts: 65,
      lifecycle_status: 'VIGENTE / CARRIER-GRADE'
    },
    {
      sku: '02352STT',
      modelo: 'NetEngine AR6140-16G4XG',
      serie: 'NetEngine AR',
      rol_recomendado: ['BRANCH', 'HUB_REGIONAL'],
      segmento: 'Branch Grande / Edge',
      forwarding_capacity_mbps: 5000,
      imix_capacity_mbps: 2500,
      ipsec_capacity_mbps: 2000,
      max_ipsec_tunnels: 1500,
      mpps: 3.5,
      fib_routes: 500000,
      cgnat_sessions: 512000,
      puertos_fijos: '4x 10GE SFP+ + 16x GE RJ45',
      puertos_detalle: { rj45_1g: 16, combo_1g: 0, sfp_1g: 0, sfp_plus_10g: 4, sfp28_25g: 0, qsfp28_100g: 0 },
      slots_expansion: '2x SIC slots',
      form_factor: '1U',
      dual_psu: true,
      modular: false,
      psu_sku: 'PAC-150WA',
      licencia_foundation_sku: 'N1-AR6140-F-LIC',
      licencia_advanced_sku: 'N1-AR6140-A-LIC',
      utm_sub_prefix: 'LIC-AR6140-SEC-SUB',
      hicare_standard_prefix: 'HC-S-AR6140',
      hicare_premier_prefix: 'HC-P-AR6140',
      list_price_usd: 5400,
      consumo_watts: 110,
      lifecycle_status: 'VIGENTE / CARRIER-GRADE'
    },
    {
      sku: '02352STW',
      modelo: 'NetEngine AR6280',
      serie: 'NetEngine AR',
      rol_recomendado: ['BRANCH', 'HUB_REGIONAL'],
      segmento: 'Agregación / Campus Edge',
      forwarding_capacity_mbps: 12000,
      imix_capacity_mbps: 6000,
      ipsec_capacity_mbps: 5000,
      max_ipsec_tunnels: 4000,
      mpps: 8.5,
      fib_routes: 1500000,
      cgnat_sessions: 1000000,
      puertos_fijos: 'Modular via SRU100/200 (4x 10GE SFP+ + 4x GE SFP)',
      puertos_detalle: { rj45_1g: 4, combo_1g: 0, sfp_1g: 4, sfp_plus_10g: 4, sfp28_25g: 0, qsfp28_100g: 0 },
      slots_expansion: '4x SIC + 2x WSIC slots',
      form_factor: '3U Modular',
      dual_psu: true,
      modular: true,
      psu_sku: 'PAC-350WA-L',
      mpu_sku: 'SRU200',
      licencia_foundation_sku: 'N1-AR6200-F-LIC',
      licencia_advanced_sku: 'N1-AR6200-A-LIC',
      utm_sub_prefix: 'LIC-AR6280-SEC-SUB',
      hicare_standard_prefix: 'HC-S-AR6280',
      hicare_premier_prefix: 'HC-P-AR6280',
      list_price_usd: 11800,
      consumo_watts: 280,
      lifecycle_status: 'VIGENTE / CARRIER-GRADE'
    },
    {
      sku: '02352SUA',
      modelo: 'NetEngine AR6300',
      serie: 'NetEngine AR',
      rol_recomendado: ['HUB_REGIONAL', 'CORE_HEADEND'],
      segmento: 'Core Campus / Gran Agregación',
      forwarding_capacity_mbps: 25000,
      imix_capacity_mbps: 15000,
      ipsec_capacity_mbps: 12000,
      max_ipsec_tunnels: 8000,
      mpps: 18.0,
      fib_routes: 3000000,
      cgnat_sessions: 2000000,
      puertos_fijos: 'Modular via Dual SRU400H (14x 10GE SFP+ + 10x GE)',
      puertos_detalle: { rj45_1g: 10, combo_1g: 0, sfp_1g: 0, sfp_plus_10g: 14, sfp28_25g: 0, qsfp28_100g: 0 },
      slots_expansion: '8x WSIC slots',
      form_factor: '5U Modular',
      dual_psu: true,
      modular: true,
      psu_sku: 'PAC-600WA',
      mpu_sku: 'SRU400H',
      licencia_foundation_sku: 'N1-AR6300-F-LIC',
      licencia_advanced_sku: 'N1-AR6300-A-LIC',
      utm_sub_prefix: 'LIC-AR6300-SEC-SUB',
      hicare_standard_prefix: 'HC-S-AR6300',
      hicare_premier_prefix: 'HC-P-AR6300',
      list_price_usd: 22500,
      consumo_watts: 480,
      lifecycle_status: 'VIGENTE / CARRIER-GRADE'
    },
    {
      sku: '02353YRQ',
      modelo: 'NetEngine A812 E',
      serie: 'NetEngine A800',
      rol_recomendado: ['HUB_REGIONAL', 'METRO_EDGE', 'CORE_HEADEND'],
      segmento: 'Cloud Edge / Metro Slicing / SRv6',
      forwarding_capacity_mbps: 48000,
      imix_capacity_mbps: 24000,
      ipsec_capacity_mbps: 18000,
      max_ipsec_tunnels: 10000,
      mpps: 36.0,
      fib_routes: 4000000,
      cgnat_sessions: 2500000,
      puertos_fijos: '4x 10GE SFP+ + 8x GE Combo',
      puertos_detalle: { rj45_1g: 0, combo_1g: 8, sfp_1g: 8, sfp_plus_10g: 4, sfp28_25g: 0, qsfp28_100g: 0 },
      slots_expansion: 'N/A',
      form_factor: '1U Fijo',
      dual_psu: true,
      modular: false,
      psu_sku: 'PAC-A800-AC',
      licencia_foundation_sku: 'N1-A812E-F-LIC',
      licencia_advanced_sku: 'LIC-FLEXE-10M',
      utm_sub_prefix: null,
      hicare_standard_prefix: 'HC-S-A812E',
      hicare_premier_prefix: 'HC-P-A812E',
      list_price_usd: 19800,
      consumo_watts: 150,
      lifecycle_status: 'VIGENTE / CARRIER-GRADE'
    },
    {
      sku: '02354BTA',
      modelo: 'NetEngine A821 E',
      serie: 'NetEngine A800',
      rol_recomendado: ['HUB_REGIONAL', 'METRO_EDGE', 'CORE_HEADEND'],
      segmento: 'Metro Aggregation / High Slicing',
      forwarding_capacity_mbps: 100000,
      imix_capacity_mbps: 50000,
      ipsec_capacity_mbps: 35000,
      max_ipsec_tunnels: 16000,
      mpps: 75.0,
      fib_routes: 6000000,
      cgnat_sessions: 4000000,
      puertos_fijos: '2x 50GE QSFP28 + 4x 25GE SFP28 + 16x 10GE/GE SFP+',
      puertos_detalle: { rj45_1g: 0, combo_1g: 0, sfp_1g: 0, sfp_plus_10g: 16, sfp28_25g: 4, qsfp28_100g: 2 },
      slots_expansion: 'N/A',
      form_factor: '1U Fijo',
      dual_psu: true,
      modular: false,
      psu_sku: 'PAC-A800-AC',
      licencia_foundation_sku: 'N1-A820E-F-LIC',
      licencia_advanced_sku: 'N1-A820E-A-LIC',
      utm_sub_prefix: null,
      hicare_standard_prefix: 'HC-S-A821E',
      hicare_premier_prefix: 'HC-P-A821E',
      list_price_usd: 34000,
      consumo_watts: 220,
      lifecycle_status: 'VIGENTE / CARRIER-GRADE'
    },
    {
      sku: '02353JUR',
      modelo: 'NetEngine 8000 M1A',
      serie: 'NetEngine 8000',
      rol_recomendado: ['METRO_EDGE', 'CORE_HEADEND'],
      segmento: 'Carrier-Grade WAN Core / DCI Compact',
      forwarding_capacity_mbps: 144000,
      imix_capacity_mbps: 72000,
      ipsec_capacity_mbps: 50000,
      max_ipsec_tunnels: 32000,
      mpps: 110.0,
      fib_routes: 8000000,
      cgnat_sessions: 8000000,
      puertos_fijos: '4x 50GE/25GE/10GE + 16x 10GE/GE SFP+',
      puertos_detalle: { rj45_1g: 0, combo_1g: 0, sfp_1g: 0, sfp_plus_10g: 16, sfp28_25g: 4, qsfp28_100g: 0 },
      slots_expansion: 'N/A',
      form_factor: '1U Fijo',
      dual_psu: true,
      modular: false,
      psu_sku: 'PWR-NE8K-M1A-AC',
      licencia_foundation_sku: 'N1-NE8000-M-F-LIC',
      licencia_advanced_sku: 'N1-NE8000-M-A-LIC',
      rtu_port_sku: 'LIC-NE8K-100G-RTU',
      utm_sub_prefix: null,
      hicare_standard_prefix: 'HC-S-NE8KM1A',
      hicare_premier_prefix: 'HC-P-NE8KM1A',
      list_price_usd: 46500,
      consumo_watts: 260,
      lifecycle_status: 'VIGENTE / CARRIER-GRADE'
    },
    {
      sku: '02352VDE',
      modelo: 'NetEngine 8000 M6',
      serie: 'NetEngine 8000',
      rol_recomendado: ['CORE_HEADEND'],
      segmento: 'Modular WAN Aggregation / Core',
      forwarding_capacity_mbps: 720000,
      imix_capacity_mbps: 360000,
      ipsec_capacity_mbps: 120000,
      max_ipsec_tunnels: 64000,
      mpps: 540.0,
      fib_routes: 12000000,
      cgnat_sessions: 16000000,
      puertos_fijos: 'Modular (6x PIC slots)',
      puertos_detalle: { rj45_1g: 0, combo_1g: 0, sfp_1g: 0, sfp_plus_10g: 8, sfp28_25g: 4, qsfp28_100g: 4 },
      slots_expansion: '6x PIC slots',
      form_factor: '2U Modular',
      dual_psu: true,
      modular: true,
      psu_sku: 'CR8M00PACA01',
      mpu_sku: 'CR8D00CX2E00',
      licencia_foundation_sku: 'N1-NE8000M-LIC-FND',
      licencia_advanced_sku: 'N1-NE8000M-LIC-ADV',
      rtu_port_sku: 'LIC-NE8K-100G-RTU',
      utm_sub_prefix: null,
      hicare_standard_prefix: 'HC-S-NE8KM6',
      hicare_premier_prefix: 'HC-P-NE8KM6',
      list_price_usd: 88000,
      consumo_watts: 600,
      lifecycle_status: 'VIGENTE / CARRIER-GRADE'
    },
    {
      sku: '02353JVA',
      modelo: 'NetEngine 8000 F1A-1H24HF',
      serie: 'NetEngine 8000',
      rol_recomendado: ['CORE_HEADEND'],
      segmento: 'Fixed Core High-Density 100G',
      forwarding_capacity_mbps: 1200000,
      imix_capacity_mbps: 600000,
      ipsec_capacity_mbps: 200000,
      max_ipsec_tunnels: 64000,
      mpps: 900.0,
      fib_routes: 16000000,
      cgnat_sessions: 32000000,
      puertos_fijos: '8x 100GE QSFP28 + 16x 25GE/10GE SFP28',
      puertos_detalle: { rj45_1g: 0, combo_1g: 0, sfp_1g: 0, sfp_plus_10g: 0, sfp28_25g: 16, qsfp28_100g: 8 },
      slots_expansion: 'N/A',
      form_factor: '1U Fijo',
      dual_psu: true,
      modular: false,
      psu_sku: 'PWR-NE8K-F1A-AC',
      licencia_foundation_sku: 'N1-NE8000F-F-LIC',
      licencia_advanced_sku: 'N1-NE8000F-A-LIC',
      rtu_port_sku: 'LIC-NE8K-100G-RTU',
      utm_sub_prefix: null,
      hicare_standard_prefix: 'HC-S-NE8KF1A',
      hicare_premier_prefix: 'HC-P-NE8KF1A',
      list_price_usd: 135000,
      consumo_watts: 520,
      lifecycle_status: 'VIGENTE / CARRIER-GRADE'
    }
  ];

  const HUAWEI_NGFW_CATALOG = [
    {
      sku: '02352YMM',
      modelo: 'HiSecEngine USG6530E',
      max_dpi_mbps: 2000,
      ssl_inspect_mbps: 800,
      licencia_bundle_sku: 'LIC-USG6530E-TP-1Y',
      hicare_sku: 'HC-S-USG6530E',
      list_price_usd: 3200
    },
    {
      sku: '02353BVR',
      modelo: 'HiSecEngine USG6605E',
      max_dpi_mbps: 5000,
      ssl_inspect_mbps: 2500,
      licencia_bundle_sku: 'LIC-USG6605E-TP-1Y',
      hicare_sku: 'HC-S-USG6605E',
      list_price_usd: 6800
    },
    {
      sku: '02353BVW',
      modelo: 'HiSecEngine USG6680E',
      max_dpi_mbps: 40000,
      ssl_inspect_mbps: 15000,
      licencia_bundle_sku: 'LIC-USG6680E-TP-1Y',
      hicare_sku: 'HC-P-USG6680E',
      list_price_usd: 28500
    }
  ];

  const ARUBA_HARDWARE_CATALOG = [
    {
      sku: 'R9D72A',
      modelo: 'EC-10104',
      familia: 'EdgeConnect SD-WAN',
      segmento: 'Small Branch / Retail',
      wan_bw_nominal_mbps: 200,
      wan_bw_boost_mbps: 500,
      max_flows: 128000,
      puertos: { rj45_1g: 4, sfp_1g: 0, sfp_plus_10g: 0, sfp28_25g: 0, combo_1g: 0 },
      dual_psu: false,
      storage_ssd_gb: 64,
      ru: 'Desktop / 1U Option',
      consumo_watts: 25,
      list_price_usd: 1850,
      lifecycle_status: 'VIGENTE / CARRIER-GRADE',
      reemplaza_a: null
    },
    {
      sku: 'S2D90A',
      modelo: 'EC-10106',
      familia: 'EdgeConnect SD-WAN',
      segmento: 'Medium Branch',
      wan_bw_nominal_mbps: 1000,
      wan_bw_boost_mbps: 1000,
      max_flows: 256000,
      puertos: { rj45_1g: 2, sfp_1g: 2, sfp_plus_10g: 0, sfp28_25g: 0, combo_1g: 2, poe_ports: 2 },
      dual_psu: false,
      storage_ssd_gb: 128,
      ru: 'Desktop / 1U Option',
      consumo_watts: 60,
      list_price_usd: 3900,
      lifecycle_status: 'VIGENTE / CARRIER-GRADE',
      reemplaza_a: null
    },
    {
      sku: 'S2D93A',
      modelo: 'EC-10108',
      familia: 'EdgeConnect SD-WAN',
      segmento: 'Large Branch / Regional Hub',
      wan_bw_nominal_mbps: 2000,
      wan_bw_boost_mbps: 5000,
      max_flows: 500000,
      puertos: { rj45_1g: 4, sfp_1g: 0, sfp_plus_10g: 4, sfp28_25g: 0, combo_1g: 0 },
      dual_psu: true,
      psu_redundante_sku: 'JL085A-PSU',
      storage_ssd_gb: 480,
      ru: '1U Rackmount',
      consumo_watts: 120,
      list_price_usd: 8200,
      lifecycle_status: 'VIGENTE / CARRIER-GRADE',
      reemplaza_a: null
    },
    {
      sku: 'R8M33A',
      modelo: 'EC-10150',
      familia: 'EdgeConnect SD-WAN',
      segmento: 'Campus / Telco POP Aggregation',
      wan_bw_nominal_mbps: 10000,
      wan_bw_boost_mbps: 10000,
      max_flows: 2000000,
      puertos: { rj45_1g: 0, sfp_1g: 0, sfp_plus_10g: 6, sfp28_25g: 2, combo_1g: 0 },
      dual_psu: true,
      psu_redundante_sku: 'R8M33A-PSU',
      storage_ssd_gb: 960,
      ru: '1U Rackmount',
      consumo_watts: 350,
      list_price_usd: 19500,
      lifecycle_status: 'VIGENTE / CARRIER-GRADE',
      reemplaza_a: null
    },
    {
      sku: 'EC-V-VMWARE',
      modelo: 'EC-V (Virtual Appliance)',
      familia: 'EdgeConnect SD-WAN',
      segmento: 'NFV / Telco Cloud Core',
      wan_bw_nominal_mbps: 10000,
      wan_bw_boost_mbps: 10000,
      max_flows: 2000000,
      puertos: { virtual_nics: 8, rj45_1g: 0, sfp_1g: 0, sfp_plus_10g: 0, sfp28_25g: 0 },
      dual_psu: false,
      storage_ssd_gb: 500,
      ru: 'Virtual / VM',
      consumo_watts: 0,
      list_price_usd: 4500,
      lifecycle_status: 'VIGENTE / CARRIER-GRADE',
      reemplaza_a: null
    },
    {
      sku: 'R1B21A',
      modelo: 'Gateway 9004',
      familia: 'Aruba SD-Branch Gateway',
      segmento: 'Small/Medium SD-Branch',
      wan_bw_nominal_mbps: 2000,
      wan_bw_boost_mbps: 2000,
      max_flows: 64000,
      puertos: { rj45_1g: 4, sfp_1g: 0, sfp_plus_10g: 0, sfp28_25g: 0 },
      dual_psu: false,
      storage_ssd_gb: 32,
      ru: 'Desktop / 1U',
      consumo_watts: 30,
      list_price_usd: 1995,
      lifecycle_status: 'VIGENTE / CARRIER-GRADE',
      reemplaza_a: ['7005', '7008']
    },
    {
      sku: 'R1B25A',
      modelo: 'Gateway 9012',
      familia: 'Aruba SD-Branch Gateway',
      segmento: 'Medium/Large PoE SD-Branch',
      wan_bw_nominal_mbps: 2000,
      wan_bw_boost_mbps: 2000,
      max_flows: 64000,
      puertos: { rj45_1g: 10, sfp_1g: 2, sfp_plus_10g: 0, sfp28_25g: 0 },
      dual_psu: false,
      storage_ssd_gb: 64,
      ru: '1U Rackmount',
      consumo_watts: 165,
      list_price_usd: 3895,
      lifecycle_status: 'VIGENTE / CARRIER-GRADE',
      reemplaza_a: ['7030']
    },
    {
      sku: 'R7G97A',
      modelo: 'Gateway 9240',
      familia: 'Aruba Campus / Headend Gateway',
      segmento: 'Large Campus / SD-WAN Concentrator',
      wan_bw_nominal_mbps: 20000,
      wan_bw_boost_mbps: 20000,
      max_flows: 1000000,
      puertos: { rj45_1g: 0, sfp_1g: 0, sfp_plus_10g: 4, sfp28_25g: 4 },
      dual_psu: true,
      psu_redundante_sku: 'R7G99A',
      storage_ssd_gb: 240,
      ru: '1U Rackmount',
      consumo_watts: 260,
      list_price_usd: 16500,
      lifecycle_status: 'VIGENTE / CARRIER-GRADE',
      reemplaza_a: ['7210', '7220']
    }
  ];

  const ARUBA_LEGACY_MIGRATION_MAP = [
    {
      modelo_legacy: 'Aruba 7005 / 7008',
      serie_legacy: 'Serie 7000',
      estado: 'FIN DE VENTA / MIGRACIÓN',
      color_semaforo: 'NARANJA',
      reemplazo_recomendado: 'Gateway 9004 (R1B21A) o EdgeConnect EC-10104 (R9D72A)',
      mejora_clave: 'Incremento 4x en throughput SD-WAN e integración nativa con Aruba Central / Orchestrator'
    },
    {
      modelo_legacy: 'Aruba 7030',
      serie_legacy: 'Serie 7000',
      estado: 'FIN DE VENTA / MIGRACIÓN',
      color_semaforo: 'NARANJA',
      reemplazo_recomendado: 'Gateway 9012 (R1B25A) o EdgeConnect EC-10106 (S2D90A)',
      mejora_clave: '12 puertos GE con PoE+ integrado y segmentación dinámica por rol'
    },
    {
      modelo_legacy: 'Aruba 7210 / 7220',
      serie_legacy: 'Serie 7200',
      estado: 'FIN DE VENTA / MIGRACIÓN',
      color_semaforo: 'NARANJA',
      reemplazo_recomendado: 'Gateway 9240 (R7G97A) o EdgeConnect EC-10150 (R8M33A)',
      mejora_clave: 'Interfaces 10G/25G SFP28, fuentes redundantes hot-swap y hasta 2M de flujos simultáneos'
    }
  ];

  const OPTICAL_TRANSCEIVERS_CATALOG = {
    ARUBA: [
      { sku: 'J4858D', descripcion: 'Aruba 1G SFP LC SX 500m OM2 MMF Transceiver', tipo: '1G_SFP', medio: 'MMF', list_price_usd: 210 },
      { sku: 'J4859D', descripcion: 'Aruba 1G SFP LC LX 10km SMF Transceiver', tipo: '1G_SFP', medio: 'SMF', list_price_usd: 420 },
      { sku: 'J9150D', descripcion: 'Aruba 10G SFP+ LC SR 300m OM3 MMF Transceiver', tipo: '10G_SFP_PLUS', medio: 'MMF', list_price_usd: 580 },
      { sku: 'J9151E', descripcion: 'Aruba 10G SFP+ LC LR 10km SMF Transceiver', tipo: '10G_SFP_PLUS', medio: 'SMF', list_price_usd: 950 },
      { sku: 'J9281D', descripcion: 'Aruba 10G SFP+ to SFP+ 1m Direct Attach Copper Cable (DAC)', tipo: '10G_DAC', medio: 'DAC_1M', list_price_usd: 115 },
      { sku: 'J9283D', descripcion: 'Aruba 10G SFP+ to SFP+ 3m Direct Attach Copper Cable (DAC)', tipo: '10G_DAC', medio: 'DAC_3M', list_price_usd: 145 },
      { sku: 'JL484A', descripcion: 'Aruba 25G SFP28 LC SR 100m MMF Transceiver', tipo: '25G_SFP28', medio: 'MMF', list_price_usd: 890 }
    ],
    HUAWEI: [
      { sku: 'eSFP-GE-SX-MM850', descripcion: 'Huawei 1G eSFP 850nm MMF 500m Optical Transceiver', tipo: '1G_SFP', medio: 'MMF', list_price_usd: 95 },
      { sku: 'SFP-GE-LX-SM1310', descripcion: 'Huawei 1G eSFP 1310nm SMF 10km Optical Transceiver', tipo: '1G_SFP', medio: 'SMF', list_price_usd: 140 },
      { sku: 'OSX040N01', descripcion: 'Huawei 10G SFP+ 850nm MMF 300m Optical Transceiver (SFP-10G-USR)', tipo: '10G_SFP_PLUS', medio: 'MMF', list_price_usd: 220 },
      { sku: 'OSX010000', descripcion: 'Huawei 10G SFP+ 1310nm SMF 10km Optical Transceiver (SFP-10G-LR)', tipo: '10G_SFP_PLUS', medio: 'SMF', list_price_usd: 360 },
      { sku: 'SFP-25G-SR', descripcion: 'Huawei 25G SFP28 850nm MMF 100m Optical Transceiver', tipo: '25G_SFP28', medio: 'MMF', list_price_usd: 540 },
      { sku: 'QSFP-100G-LR4', descripcion: 'Huawei 100G QSFP28 1310nm SMF 10km Optical Transceiver', tipo: '100G_QSFP28', medio: 'SMF', list_price_usd: 2400 }
    ]
  };

  // ============================================================================
  // 2. MOTOR MATEMÁTICO Y DIMENSIONADOR HUAWEI NETENGINE (CARRIER-GRADE)
  // ============================================================================

  function calcularRequerimientosHuawei(params = {}) {
    const bwEnlaceMbps = Math.max(1, Number(params.bw_enlace_mbps) || 100);
    const multiplicadorDireccion = params.medicion === 'POR_DIRECCION' ? 2 : 1;
    const totalBwFisico = bwEnlaceMbps * multiplicadorDireccion;

    const rol = params.rol || 'BRANCH';
    let bwInternetDIA = 0;
    let bwTunelesIPsec = 0;

    if (Boolean(params.local_breakout) && rol === 'BRANCH') {
      bwInternetDIA = Number((totalBwFisico * 0.70).toFixed(2));
      bwTunelesIPsec = Number((totalBwFisico * 0.30).toFixed(2));
    } else {
      bwTunelesIPsec = totalBwFisico;
    }

    const factoresIMIX = {
      VOIP_FINTECH: { factor: 0.55, bytes: 250, label: 'VoIP / Fintech (250B)' },
      ENTERPRISE_STANDARD: { factor: 0.70, bytes: 570, label: 'Enterprise Estándar (570B)' },
      ISP_INTERNET: { factor: 0.85, bytes: 700, label: 'Telco / ISP Mix (700B)' },
      DCI_JUMBO: { factor: 1.00, bytes: 1400, label: 'Jumbo / DCI (1400B)' }
    };

    const imix = factoresIMIX[params.perfil_trafico] || factoresIMIX.ENTERPRISE_STANDARD;
    const overheadFEC = Boolean(params.afec_activo) ? 0.20 : 0.0;

    let factorSeguridad = 0.0;
    const requiereDesacoplarNGFW =
      Boolean(params.ssl_tls_decryption) ||
      (params.nivel_seguridad === 'UTM_BRANCH' && totalBwFisico > 1000);

    if (params.nivel_seguridad === 'UTM_BRANCH' && !requiereDesacoplarNGFW) {
      factorSeguridad = 0.45;
    }

    const headroomPct = params.headroom_pct !== undefined ? Number(params.headroom_pct) : 30;
    const factorHeadroom = Math.max(0, headroomPct) / 100;

    const throughputDisenoMbps = Math.ceil(
      ((totalBwFisico / imix.factor) * (1 + overheadFEC) * (1 + factorSeguridad)) * (1 + factorHeadroom)
    );

    const throughputIPsecDisenoMbps = Math.ceil(
      ((bwTunelesIPsec / imix.factor) * (1 + overheadFEC)) * (1 + factorHeadroom)
    );

    const mppsRequeridos = parseFloat(
      ((throughputDisenoMbps * 1e6) / (imix.bytes * 8 * 1e6)).toFixed(2)
    );

    const sedesRemotas = Math.max(1, Number(params.sedes_remotas) || 1);
    let tunelesRequeridos = 1;
    if (rol === 'HUB_REGIONAL') {
      tunelesRequeridos = sedesRemotas * (params.topologia === 'FULL_MESH' ? sedesRemotas : 1);
    } else if (rol === 'CORE_HEADEND') {
      tunelesRequeridos = sedesRemotas * 2;
    }

    const rutasBGPRequeridas = Math.max(1000, Number(params.rutas_bgp) || 10000);
    const sesionesCGNATRequeridas = Math.max(0, Number(params.sesiones_cgnat) || 0);

    return {
      throughputDisenoMbps,
      throughputIPsecDisenoMbps,
      mppsRequeridos,
      tunelesRequeridos,
      rutasBGPRequeridas,
      sesionesCGNATRequeridas,
      requiereDesacoplarNGFW,
      parametrosAplicados: {
        imixPerfil: params.perfil_trafico || 'ENTERPRISE_STANDARD',
        imixFactor: imix.factor,
        imixBytes: imix.bytes,
        overheadFEC,
        factorSeguridad,
        factorHeadroom
      },
      distribucion: {
        bwInternetDIA,
        bwTunelesIPsec,
        totalBwFisico
      }
    };
  }

  const ADVERTENCIA_DATOS =
    'Catálogo, SKUs derivados y precios de este motor NO tienen fuente verificada (no provienen de server/seed/legacyData). Uso de pruebas de concepto: no cotizar.';

  function dimensionarHuaweiNetEngine(params = {}) {
    const req = calcularRequerimientosHuawei(params);
    const sdwanActivo = params.sdwan_activo !== undefined ? Boolean(params.sdwan_activo) : true;
    const plazoAnios = [1, 3, 5].includes(Number(params.plazo_anios)) ? Number(params.plazo_anios) : 1;
    const nivelSoporte = params.nivel_soporte === 'PREMIER' ? 'PREMIER' : 'STANDARD';

    const candidatos = HUAWEI_HARDWARE_CATALOG.filter((chasis) => {
      const cumpleForwarding = chasis.forwarding_capacity_mbps >= req.throughputDisenoMbps;
      const cumpleIPsec = !sdwanActivo || chasis.ipsec_capacity_mbps >= req.throughputIPsecDisenoMbps;
      const cumpleTuneles = !sdwanActivo || chasis.max_ipsec_tunnels >= req.tunelesRequeridos;
      const cumpleMpps = chasis.mpps >= req.mppsRequeridos;
      const cumpleRutas = chasis.fib_routes >= req.rutasBGPRequeridas;
      const cumpleCGNAT = chasis.cgnat_sessions >= req.sesionesCGNATRequeridas;
      const cumpleModular = !params.requiere_modular || chasis.modular;
      return (
        cumpleForwarding &&
        cumpleIPsec &&
        cumpleTuneles &&
        cumpleMpps &&
        cumpleRutas &&
        cumpleCGNAT &&
        cumpleModular
      );
    }).sort((a, b) => a.list_price_usd - b.list_price_usd);

    const equipoSeleccionado = candidatos[0] || HUAWEI_HARDWARE_CATALOG[HUAWEI_HARDWARE_CATALOG.length - 1];
    const equipoUpsell = candidatos[1] || null;

    const alertasIngenieria = [ADVERTENCIA_DATOS];
    if (equipoSeleccionado.serie !== 'NetEngine AR' && (params.rol || 'BRANCH') === 'BRANCH') {
      alertasIngenieria.push(
        `Escalado automático de arquitectura: la demanda (${req.throughputDisenoMbps} Mbps diseño / ${req.mppsRequeridos} Mpps) supera la familia NetEngine AR; se asigna ${equipoSeleccionado.modelo} (${equipoSeleccionado.serie}).`
      );
    }
    if (!candidatos.length) {
      alertasIngenieria.push(
        `Demanda extrema detectada (${req.throughputDisenoMbps} Mbps). Se selecciona el tope de catálogo (${equipoSeleccionado.modelo}); considere arquitectura en clúster Dual-Homing o chasis NE8000 X4/X8.`
      );
    }

    const bom = [];
    bom.push({
      categoria: 'Chasis Principal',
      sku: equipoSeleccionado.sku,
      descripcion: `Huawei ${equipoSeleccionado.modelo} (${equipoSeleccionado.puertos_fijos})`,
      cantidad: 1,
      precio_unitario_usd: equipoSeleccionado.list_price_usd
    });

    if (equipoSeleccionado.dual_psu && equipoSeleccionado.psu_sku) {
      bom.push({
        categoria: 'Potencia y Redundancia',
        sku: equipoSeleccionado.psu_sku,
        descripcion: `Módulo de fuente de poder redundante (1+1) para ${equipoSeleccionado.modelo}`,
        cantidad: 2,
        precio_unitario_usd: 420
      });
    }

    const requiereAdvanced =
      sdwanActivo ||
      Boolean(params.srv6_evpn) ||
      Boolean(params.flexe_slicing) ||
      Boolean(params.spr_activo);

    const licenciaSku = requiereAdvanced
      ? equipoSeleccionado.licencia_advanced_sku
      : equipoSeleccionado.licencia_foundation_sku;

    bom.push({
      categoria: 'Licencia de Software N1',
      sku: licenciaSku,
      descripcion: requiereAdvanced
        ? `Huawei N1 Advanced Software Package (SD-WAN / SRv6 / EVPN) para ${equipoSeleccionado.modelo}`
        : `Huawei N1 Foundation Software Package (Routing IP / BGP / OSPF) para ${equipoSeleccionado.modelo}`,
      cantidad: 1,
      precio_unitario_usd: Math.round(equipoSeleccionado.list_price_usd * (requiereAdvanced ? 0.35 : 0.18))
    });

    if (sdwanActivo) {
      bom.push({
        categoria: 'Gestión y Orquestación SD-WAN',
        sku: `LIC-NCE-WAN-DEV-${plazoAnios}Y`,
        descripcion: `Suscripción de gestión iMaster NCE-WAN por dispositivo (${plazoAnios} Año(s))`,
        cantidad: 1,
        precio_unitario_usd: 380 * plazoAnios
      });
    }

    let ngfwRecomendado = null;
    if (req.requiereDesacoplarNGFW) {
      const ngfwQueCumple = HUAWEI_NGFW_CATALOG.find((fw) => fw.max_dpi_mbps >= req.throughputDisenoMbps);
      ngfwRecomendado = ngfwQueCumple || HUAWEI_NGFW_CATALOG[HUAWEI_NGFW_CATALOG.length - 1];
      if (!ngfwQueCumple) {
        alertasIngenieria.push(
          `Ningún NGFW del catálogo inspecciona ${req.throughputDisenoMbps} Mbps: ${ngfwRecomendado.modelo} queda sub-dimensionado. Usar varios equipos en clúster.`
        );
      }

      alertasIngenieria.push(
        `Umbral NGFW Dedicado activado: por caudal > 1 Gbps o descifrado SSL/TLS, se desacopla la inspección profunda incorporando ${ngfwRecomendado.modelo} (${ngfwRecomendado.sku}).`
      );

      bom.push({
        categoria: 'Seguridad Perimetral Desacoplada (NGFW)',
        sku: ngfwRecomendado.sku,
        descripcion: `Firewall Dedicado Huawei ${ngfwRecomendado.modelo} (Inspección DPI / SSL Offload)`,
        cantidad: 1,
        precio_unitario_usd: ngfwRecomendado.list_price_usd
      });
      bom.push({
        categoria: 'Suscripción de Seguridad NGFW',
        sku: `${ngfwRecomendado.licencia_bundle_sku.replace('1Y', `${plazoAnios}Y`)}`,
        descripcion: `Threat Protection Bundle (IPS, AV, URL Filtering) para ${ngfwRecomendado.modelo} (${plazoAnios}Y)`,
        cantidad: 1,
        precio_unitario_usd: Math.round(ngfwRecomendado.list_price_usd * 0.25 * plazoAnios)
      });
    } else if (params.nivel_seguridad === 'UTM_BRANCH' && equipoSeleccionado.utm_sub_prefix) {
      bom.push({
        categoria: 'Seguridad UTM Integrada',
        sku: `${equipoSeleccionado.utm_sub_prefix}-${plazoAnios}Y`,
        descripcion: `Suscripción IPS, Antivirus y URL Filtering integrada para ${equipoSeleccionado.modelo} (${plazoAnios}Y)`,
        cantidad: 1,
        precio_unitario_usd: Math.round(equipoSeleccionado.list_price_usd * 0.20 * plazoAnios)
      });
    }

    if (equipoSeleccionado.rtu_port_sku && Boolean(params.habilitar_rtu_100g)) {
      bom.push({
        categoria: 'Licencia Port RTU',
        sku: equipoSeleccionado.rtu_port_sku,
        descripcion: 'Habilitación Right-To-Use (RTU) de puertos 100GE en chasis NetEngine 8000',
        cantidad: Number(params.cantidad_rtu_100g) || 2,
        precio_unitario_usd: 3200
      });
    }

    const prefijoSoporte =
      nivelSoporte === 'PREMIER'
        ? equipoSeleccionado.hicare_premier_prefix
        : equipoSeleccionado.hicare_standard_prefix;

    bom.push({
      categoria: 'Soporte y Garantía Hi-Care',
      sku: `${prefijoSoporte}-${plazoAnios}Y`,
      descripcion:
        nivelSoporte === 'PREMIER'
          ? `Huawei Hi-Care Premier 24x7x4 Onsite Replacement (${plazoAnios}Y) - ${equipoSeleccionado.modelo}`
          : `Huawei Hi-Care Standard 9x5xNBD Next Business Day (${plazoAnios}Y) - ${equipoSeleccionado.modelo}`,
      cantidad: 1,
      precio_unitario_usd: Math.round(
        equipoSeleccionado.list_price_usd * (nivelSoporte === 'PREMIER' ? 0.16 : 0.10) * plazoAnios
      )
    });

    const auditoriaOpticas = auditarAccesoriosBOM(equipoSeleccionado, {
      fabricante: 'HUAWEI',
      opticas_seleccionadas: params.opticas_seleccionadas || []
    });

    auditoriaOpticas.items_bom.forEach((item) => bom.push(item));

    const totalCapexUsd = bom
      .filter((i) => ['Chasis Principal', 'Potencia y Redundancia', 'Ópticas y Transceptores', 'Seguridad Perimetral Desacoplada (NGFW)'].includes(i.categoria))
      .reduce((acc, i) => acc + i.cantidad * i.precio_unitario_usd, 0);

    const totalOpexUsd = bom
      .filter((i) => !['Chasis Principal', 'Potencia y Redundancia', 'Ópticas y Transceptores', 'Seguridad Perimetral Desacoplada (NGFW)'].includes(i.categoria))
      .reduce((acc, i) => acc + i.cantidad * i.precio_unitario_usd, 0);

    return {
      fabricante: 'HUAWEI',
      requerimientos: req,
      equipoSeleccionado,
      equipoUpsell,
      ngfwRecomendado,
      bom,
      auditoriaOpticas,
      alertasIngenieria,
      resumenCostosLista: {
        totalCapexUsd,
        totalOpexUsd,
        totalGeneralListaUsd: totalCapexUsd + totalOpexUsd
      }
    };
  }

  // ============================================================================
  // 3. MOTOR MATEMÁTICO Y DIMENSIONADOR HPE ARUBA EDGECONNECT (SP EDITION)
  // ============================================================================

  function calcularRequerimientosIngenieria(params = {}) {
    const bwMplsMbps = Math.max(0, Number(params.bw_mpls_mbps) || 0);
    const bwInternetMbps = Math.max(0, Number(params.bw_internet_mbps) || 0);
    const totalBwFisico = Math.max(10, bwMplsMbps + bwInternetMbps);

    const localBreakoutActivo =
      params.local_breakout_activo !== undefined ? Boolean(params.local_breakout_activo) : true;

    let bwLocalInternet = 0;
    let bwTunelesPrivados = 0;

    if (localBreakoutActivo && bwInternetMbps > 0) {
      bwLocalInternet = Number((totalBwFisico * 0.70).toFixed(2));
      bwTunelesPrivados = Number((totalBwFisico * 0.30).toFixed(2));
    } else {
      bwTunelesPrivados = totalBwFisico;
    }

    let factorIMIX = 0.70;
    if (params.perfil_trafico === 'VOIP_INTENSIVE') factorIMIX = 0.55;
    if (params.perfil_trafico === 'BULK_BACKUP') factorIMIX = 1.00;

    let overheadFEC = 0.05;
    if (Boolean(params.fec_activo)) {
      overheadFEC = params.enlace_calidad === 'ALTA_PERDIDA_LTE' ? 0.25 : 0.15;
    }

    let factorSeguridad = 0.0;
    if (params.modelo_seguridad === 'LOCAL_NGFW_DPI') {
      factorSeguridad = 0.35;
    } else if (params.modelo_seguridad === 'CLOUD_SASE_SSE') {
      factorSeguridad = 0.05;
    }

    const headroomPct = params.headroom_pct !== undefined ? Number(params.headroom_pct) : 20;
    const factorHeadroom = Math.max(0, headroomPct) / 100;

    const throughputDisenoMbps = Math.ceil(
      ((totalBwFisico / factorIMIX) * (1 + overheadFEC) * (1 + factorSeguridad)) * (1 + factorHeadroom)
    );

    const totalUsuarios = Math.max(1, Number(params.total_usuarios) || 50);
    const sesionesPorUsuario = params.densidad_usuarios === 'INTENSIVO_SAAS' ? 150 : 80;
    const flujosRequeridos = totalUsuarios * sesionesPorUsuario;

    const caudalNetoPosFecMbps = Math.round(totalBwFisico * (1 - overheadFEC));
    const factorBoostMultiplicador = params.boost_activo ? (params.factor_deduplicacion || 3.5) : 1.0;
    const caudalVirtualEquivalenteBoostMbps = Math.round(totalBwFisico * factorBoostMultiplicador);

    return {
      throughputDisenoMbps,
      flujosRequeridos,
      tierLicenciaBwRequerido: totalBwFisico,
      distribucion: {
        bwLocalInternet,
        bwTunelesPrivados,
        totalBwFisico
      },
      widgetRendimiento3Barras: {
        barra1_fisico_contratado_mbps: totalBwFisico,
        barra2_neto_pos_fec_mbps: caudalNetoPosFecMbps,
        barra3_virtual_boost_mbps: caudalVirtualEquivalenteBoostMbps
      },
      cumplimientoEspecial: {
        variante_taa_nal: Boolean(params.cumplimiento_taa_nal)
      }
    };
  }

  function dimensionarArubaEdgeConnect(params = {}) {
    const req = calcularRequerimientosIngenieria(params);
    const plazoAnios = [1, 3, 5].includes(Number(params.plazo_anios)) ? Number(params.plazo_anios) : 3;

    const catalogoElegible = ARUBA_HARDWARE_CATALOG.filter(
      (c) =>
        c.familia === 'EdgeConnect SD-WAN' &&
        (Boolean(params.permitir_virtual) || c.sku !== 'EC-V-VMWARE')
    );

    const candidatos = catalogoElegible
      .filter(
        (c) =>
          c.wan_bw_nominal_mbps >= req.throughputDisenoMbps &&
          c.max_flows >= req.flujosRequeridos
      )
      .sort((a, b) => a.list_price_usd - b.list_price_usd);

    const equipoSeleccionado = candidatos[0] || catalogoElegible[catalogoElegible.length - 1];
    const equipoUpsell = candidatos[1] || null;

    const alertasIngenieria = [ADVERTENCIA_DATOS];
    if (!candidatos.length) {
      alertasIngenieria.push(
        `Ningún EdgeConnect cubre ${req.throughputDisenoMbps} Mbps / ${req.flujosRequeridos} flujos: ${equipoSeleccionado.modelo} queda sub-dimensionado. Dividir en varios equipos o cambiar de familia.`
      );
    }

    const sufijoTAA = req.cumplimientoEspecial.variante_taa_nal ? '-TAA' : '';
    const bom = [];

    bom.push({
      categoria: 'Chasis SD-WAN EdgeConnect',
      sku: `${equipoSeleccionado.sku}${sufijoTAA}`,
      descripcion: `HPE Aruba Networking ${equipoSeleccionado.modelo} (${equipoSeleccionado.segmento})${
        sufijoTAA ? ' [Variante Gubernamental TAA]' : ''
      }`,
      cantidad: 1,
      precio_unitario_usd: equipoSeleccionado.list_price_usd
    });

    const requiereAdvanced =
      Boolean(params.dynamic_path_steering) ||
      Boolean(params.dynamic_threat_defense) ||
      Boolean(params.aiops_analytics) ||
      (Number(params.cantidad_bios) || 1) > 3 ||
      (Number(params.cantidad_vrfs) || 1) > 2;

    const nivelLicencia = requiereAdvanced ? 'ADV' : 'FND';
    let tierBwLabel = '100M';
    let factorPrecioTier = 1.0;
    if (req.tierLicenciaBwRequerido > 1000) {
      tierBwLabel = 'UNL';
      factorPrecioTier = 2.6;
    } else if (req.tierLicenciaBwRequerido > 100) {
      tierBwLabel = '1G';
      factorPrecioTier = 1.75;
    }

    const precioBaseSuscripcionAnual = requiereAdvanced ? 1150 : 780;
    bom.push({
      categoria: 'Suscripción SD-WAN (Co-Termed)',
      sku: `EC-SUB-${nivelLicencia}-${tierBwLabel}-${plazoAnios}Y`,
      descripcion: `Suscripción HPE Aruba EdgeConnect ${
        requiereAdvanced ? 'Advanced' : 'Foundation'
      } Tier ${tierBwLabel} (${plazoAnios} Años Co-Termed)`,
      cantidad: 1,
      precio_unitario_usd: Math.round(precioBaseSuscripcionAnual * factorPrecioTier * plazoAnios)
    });

    if (Boolean(params.boost_activo)) {
      const bwParaBoost = req.distribucion.bwTunelesPrivados || req.tierLicenciaBwRequerido;
      const bloquesBoost100M = Math.max(1, Math.ceil(bwParaBoost / 100));
      bom.push({
        categoria: 'Optimización WAN (Aruba Boost)',
        sku: `EC-BOOST-100M-${plazoAnios}Y`,
        descripcion: `Paquete de Optimización y Deduplicación WAN Boost (Bloque de 100 Mbps, ${plazoAnios} Años)`,
        cantidad: bloquesBoost100M,
        precio_unitario_usd: 450 * plazoAnios
      });
    }

    if (
      req.distribucion.bwLocalInternet > 0 &&
      (params.modelo_seguridad === 'CLOUD_SASE_SSE' || Boolean(params.incluir_aruba_sse))
    ) {
      const tierSSE = ['ESSENTIAL', 'ADVANCED', 'COMPLETE'].includes(params.paquete_sse)
        ? params.paquete_sse
        : 'ADVANCED';
      const preciosSSEPorUsuarioAnio = { ESSENTIAL: 48, ADVANCED: 78, COMPLETE: 110 };
      const totalUsuarios = Math.max(1, Number(params.total_usuarios) || 50);

      bom.push({
        categoria: 'Seguridad Cloud SASE / SSE (Axis Security)',
        sku: `SSE-AXIS-${tierSSE}-${plazoAnios}Y`,
        descripcion: `Suscripción HPE Aruba Networking SSE ${tierSSE} (ZTNA, SWG, CASB, DEM) por usuario (${plazoAnios} Años)`,
        cantidad: totalUsuarios,
        precio_unitario_usd: preciosSSEPorUsuarioAnio[tierSSE] * plazoAnios
      });
    }

    bom.push({
      categoria: 'Soporte HPE Aruba Foundational Care',
      sku: `HPE-FC-24X7-${equipoSeleccionado.modelo}-${plazoAnios}Y`,
      descripcion: `Soporte HPE Aruba Foundational Care 24x7x4 sincronizado a ${plazoAnios} Años para ${equipoSeleccionado.modelo}`,
      cantidad: 1,
      precio_unitario_usd: Math.round(equipoSeleccionado.list_price_usd * 0.14 * plazoAnios)
    });

    const auditoriaOpticas = auditarAccesoriosBOM(equipoSeleccionado, {
      fabricante: 'ARUBA',
      opticas_seleccionadas: params.opticas_seleccionadas || []
    });

    auditoriaOpticas.items_bom.forEach((item) => bom.push(item));

    const totalCapexUsd = bom
      .filter((i) => ['Chasis SD-WAN EdgeConnect', 'Potencia y Redundancia', 'Ópticas y Transceptores'].includes(i.categoria))
      .reduce((acc, i) => acc + i.cantidad * i.precio_unitario_usd, 0);

    const totalOpexUsd = bom
      .filter((i) => !['Chasis SD-WAN EdgeConnect', 'Potencia y Redundancia', 'Ópticas y Transceptores'].includes(i.categoria))
      .reduce((acc, i) => acc + i.cantidad * i.precio_unitario_usd, 0);

    return {
      fabricante: 'ARUBA',
      requerimientos: req,
      equipoSeleccionado,
      equipoUpsell,
      bom,
      auditoriaOpticas,
      catalogoMigracionLegacy: ARUBA_LEGACY_MIGRATION_MAP,
      alertasIngenieria,
      resumenCostosLista: {
        totalCapexUsd,
        totalOpexUsd,
        totalGeneralListaUsd: totalCapexUsd + totalOpexUsd
      }
    };
  }

  // ============================================================================
  // 4. MODAL DE AUDITORÍA DE ACCESORIOS («BOM HEALTH CHECK»)
  // ============================================================================

  function auditarAccesoriosBOM(chasis, opciones = {}) {
    const fabricante = opciones.fabricante || 'ARUBA';
    const catalogoOpticas = OPTICAL_TRANSCEIVERS_CATALOG[fabricante] || OPTICAL_TRANSCEIVERS_CATALOG.ARUBA;
    const puertas = chasis.puertos_detalle || chasis.puertos || {};

    const requiereOpticas =
      (puertas.sfp_1g || 0) > 0 ||
      (puertas.sfp_plus_10g || 0) > 0 ||
      (puertas.sfp28_25g || 0) > 0 ||
      (puertas.qsfp28_100g || 0) > 0;

    const advertencias = [];
    const items_bom = [];

    if (requiereOpticas) {
      if (Array.isArray(opciones.opticas_seleccionadas) && opciones.opticas_seleccionadas.length > 0) {
        opciones.opticas_seleccionadas.forEach((sel) => {
          const opticaOficial = catalogoOpticas.find((o) => o.sku === sel.sku);
          if (opticaOficial) {
            items_bom.push({
              categoria: 'Ópticas y Transceptores',
              sku: opticaOficial.sku,
              descripcion: opticaOficial.descripcion,
              cantidad: Math.max(1, Number(sel.cantidad) || 2),
              precio_unitario_usd: opticaOficial.list_price_usd
            });
          }
        });
      } else {
        const opticaDefault =
          (puertas.sfp_plus_10g || 0) > 0
            ? catalogoOpticas.find((o) => o.tipo === '10G_SFP_PLUS')
            : catalogoOpticas[0];

        if (opticaDefault) {
          advertencias.push(
            `BOM Health Check: El chasis ${chasis.modelo} posee puertos ópticos SFP/SFP+. Se pre-asigna un par de transceptores oficiales (${opticaDefault.sku}); valide en el modal si requiere fibra monomodo (LR) o cable DAC.`
          );
          items_bom.push({
            categoria: 'Ópticas y Transceptores',
            sku: opticaDefault.sku,
            descripcion: `${opticaDefault.descripcion} [Auto-incluido por BOM Health Check]`,
            cantidad: 2,
            precio_unitario_usd: opticaDefault.list_price_usd
          });
        }
      }
    }

    if (chasis.dual_psu) {
      items_bom.push({
        categoria: 'Potencia y Redundancia',
        sku: fabricante === 'ARUBA' ? 'JW115A' : 'PWR-CORD-C13-NEMA',
        descripcion: 'Cable de poder oficial AC C13 a NEMA 5-15P (2.5m) para fuentes redundantes Dual PSU',
        cantidad: 2,
        precio_unitario_usd: 35
      });
    }

    return {
      estado_auditoria: advertencias.length === 0 ? 'OPTIMO' : 'REQUIERE_REVISION_OPTICAS',
      requiere_modal_sfp: requiereOpticas,
      dual_psu_verificado: Boolean(chasis.dual_psu),
      catalogo_compatible: catalogoOpticas,
      advertencias,
      items_bom
    };
  }

  // ============================================================================
  // 5. DIMENSIONADOR MULTI-SEDE (ROLLOUT WAN) & SIMULADOR FINANCIERO TELCO (MRR)
  // ============================================================================

  function consolidarRolloutMultiSede(perfilesSede = []) {
    const mapaConsolidado = new Map();
    const desglosePorPerfil = [];
    let totalSedes = 0;

    perfilesSede.forEach((perfil, idx) => {
      const cantidadSedes = perfil.cantidad_sedes === undefined ? 1 : Number(perfil.cantidad_sedes);
      if (!Number.isInteger(cantidadSedes) || cantidadSedes < 1) {
        throw new Error(`perfiles_sede[${idx}].cantidad_sedes debe ser un entero >= 1`);
      }
      const factorHA = Boolean(perfil.alta_disponibilidad_ha) ? 2 : 1;
      const multiplicadorEquipos = cantidadSedes * factorHA;
      totalSedes += cantidadSedes;

      const fabricante = (perfil.fabricante || 'ARUBA').toUpperCase();
      const resultadoSede =
        fabricante === 'HUAWEI'
          ? dimensionarHuaweiNetEngine(perfil.parametros || {})
          : dimensionarArubaEdgeConnect(perfil.parametros || {});

      desglosePorPerfil.push({
        id_perfil: perfil.id || `PERFIL_${idx + 1}`,
        nombre_perfil: perfil.nombre || `Perfil Sede ${idx + 1}`,
        fabricante,
        cantidad_sedes: cantidadSedes,
        alta_disponibilidad_ha: Boolean(perfil.alta_disponibilidad_ha),
        modelo_seleccionado: resultadoSede.equipoSeleccionado.modelo,
        sku_chasis: resultadoSede.equipoSeleccionado.sku,
        throughput_diseno_mbps: resultadoSede.requerimientos.throughputDisenoMbps,
        costo_lista_por_sede_usd: resultadoSede.resumenCostosLista.totalGeneralListaUsd * factorHA,
        subtotal_perfil_lista_usd: resultadoSede.resumenCostosLista.totalGeneralListaUsd * multiplicadorEquipos
      });

      resultadoSede.bom.forEach((item) => {
        const clave = `${fabricante}::${item.sku}`;
        const cantidadTotalItem = item.cantidad * multiplicadorEquipos;
        if (mapaConsolidado.has(clave)) {
          const existente = mapaConsolidado.get(clave);
          existente.cantidad += cantidadTotalItem;
          existente.subtotal_lista_usd = existente.cantidad * existente.precio_unitario_usd;
        } else {
          mapaConsolidado.set(clave, {
            fabricante,
            categoria: item.categoria,
            sku: item.sku,
            descripcion: item.descripcion,
            cantidad: cantidadTotalItem,
            precio_unitario_usd: item.precio_unitario_usd,
            subtotal_lista_usd: cantidadTotalItem * item.precio_unitario_usd
          });
        }
      });
    });

    const bomConsolidado = Array.from(mapaConsolidado.values());
    const categoriasCapex = [
      'Chasis Principal',
      'Chasis SD-WAN EdgeConnect',
      'Potencia y Redundancia',
      'Ópticas y Transceptores',
      'Seguridad Perimetral Desacoplada (NGFW)'
    ];

    const capexListaTotalUsd = bomConsolidado
      .filter((i) => categoriasCapex.includes(i.categoria))
      .reduce((acc, i) => acc + i.subtotal_lista_usd, 0);

    const opexListaTotalUsd = bomConsolidado
      .filter((i) => !categoriasCapex.includes(i.categoria))
      .reduce((acc, i) => acc + i.subtotal_lista_usd, 0);

    return {
      totalSedesProyecto: totalSedes,
      totalPerfiles: desglosePorPerfil.length,
      desglosePorPerfil,
      bomConsolidado,
      totalesLista: {
        capexListaTotalUsd,
        opexListaTotalUsd,
        totalProyectoListaUsd: capexListaTotalUsd + opexListaTotalUsd
      }
    };
  }

  function calcularSimuladorFinancieroTelco(totalesLista, paramsFinancieros = {}) {
    const mesesContrato = [12, 24, 36, 60].includes(Number(paramsFinancieros.meses_contrato))
      ? Number(paramsFinancieros.meses_contrato)
      : 36;

    const tablaDescuentosPartner = {
      LIST_PRICE: 0,
      BUSINESS_PARTNER: 35,
      SILVER: 45,
      GOLD: 50,
      PLATINUM: 55
    };

    const descuentoPct =
      paramsFinancieros.descuento_especial_pct !== undefined
        ? Math.min(90, Math.max(0, Number(paramsFinancieros.descuento_especial_pct)))
        : tablaDescuentosPartner[paramsFinancieros.nivel_partner] ?? 45;

    const factorNeto = 1 - descuentoPct / 100;
    const capexHardwareNetoUsd = Number(((totalesLista.capexListaTotalUsd || 0) * factorNeto).toFixed(2));
    const opexSuscripcionNetoTotalUsd = Number(((totalesLista.opexListaTotalUsd || 0) * factorNeto).toFixed(2));

    const margenFinanciacionPct =
      paramsFinancieros.margen_financiacion_pct !== undefined
        ? Number(paramsFinancieros.margen_financiacion_pct)
        : 12;

    const tarifaGestionMspPct =
      paramsFinancieros.tarifa_msp_pct !== undefined ? Number(paramsFinancieros.tarifa_msp_pct) : 15;

    const cuotaHardwareMensualUsd =
      (capexHardwareNetoUsd * (1 + margenFinanciacionPct / 100)) / mesesContrato;
    const opexMensualSuscripcionSoporteUsd = opexSuscripcionNetoTotalUsd / mesesContrato;
    const baseMensualSinMsp = cuotaHardwareMensualUsd + opexMensualSuscripcionSoporteUsd;
    const tarifaGestionMspMensualUsd = baseMensualSinMsp * (tarifaGestionMspPct / 100);

    const cuotaMensualMrrTotalUsd = Number((baseMensualSinMsp + tarifaGestionMspMensualUsd).toFixed(2));
    const totalSedes = Math.max(1, Number(paramsFinancieros.total_sedes) || 1);
    const canonMensualPorSedeUsd = Number((cuotaMensualMrrTotalUsd / totalSedes).toFixed(2));
    const totalContractValueTcvUsd = Number((cuotaMensualMrrTotalUsd * mesesContrato).toFixed(2));

    return {
      mesesContrato,
      nivelPartner: paramsFinancieros.nivel_partner || 'SILVER',
      descuentoAplicadoPct: descuentoPct,
      margenFinanciacionPct,
      tarifaGestionMspPct,
      capexHardwareNetoUsd,
      opexSuscripcionNetoTotalUsd,
      desgloseMensualUsd: {
        cuotaHardwareMensualUsd: Number(cuotaHardwareMensualUsd.toFixed(2)),
        opexMensualSuscripcionSoporteUsd: Number(opexMensualSuscripcionSoporteUsd.toFixed(2)),
        tarifaGestionMspMensualUsd: Number(tarifaGestionMspMensualUsd.toFixed(2)),
        cuotaMensualMrrTotalUsd,
        canonMensualPorSedeUsd
      },
      totalContractValueTcvUsd
    };
  }

  // ============================================================================
  // 6. GENERADOR DE MEMORIA TÉCNICA DE INGENIERÍA (EXPORTADOR MARKDOWN / PDF)
  // ============================================================================

  function generarMemoriaTecnica(resultadoDimensionamiento, datosProyecto = {}) {
    const cliente = datosProyecto.cliente || 'Cliente Corporativo / Operador Telco';
    const fecha = datosProyecto.fecha || new Date().toISOString().slice(0, 10);
    const fab = resultadoDimensionamiento.fabricante || 'ARUBA';
    const eq = resultadoDimensionamiento.equipoSeleccionado;
    const req = resultadoDimensionamiento.requerimientos;

    const filasBom = (resultadoDimensionamiento.bom || [])
      .map(
        (item) =>
          `| ${item.categoria} | \`${item.sku}\` | ${item.descripcion} | ${item.cantidad} | $${item.precio_unitario_usd.toLocaleString('en-US')} | $${(item.cantidad * item.precio_unitario_usd).toLocaleString('en-US')} |`
      )
      .join('\n');

    return `# MEMORIA TÉCNICA DE INGENIERÍA Y DIMENSIONAMIENTO WAN / SASE
**Cliente:** ${cliente}
**Fecha de Emisión:** ${fecha}
**Fabricante / Arquitectura:** ${fab === 'HUAWEI' ? 'Huawei NetEngine Carrier-Grade SD-WAN / IP Core' : 'HPE Aruba Networking EdgeConnect Enterprise SD-WAN / SASE'}
**Equipo Principal Seleccionado:** ${eq.modelo} (\`${eq.sku}\`)

## 1. Resumen Ejecutivo de la Arquitectura
Se ha diseñado una arquitectura determinista de transporte híbrido y seguridad convergente para **${cliente}**, garantizando cumplimiento de SLA a nivel de aplicación, mitigación de pérdida de paquetes mediante corrección de errores hacia adelante (FEC/A-FEC) y capacidad de crecimiento proyectada (Headroom).

## 2. Memoria de Cálculo Justificativa
* **Caudal Físico Agregado de Entrada:** ${req.distribucion.totalBwFisico} Mbps
* **Segregación Local Internet Breakout (70% SaaS/DIA):** ${req.distribucion.bwLocalInternet ?? req.distribucion.bwInternetDIA} Mbps
* **Caudal Protegido hacia Data Center / Túneles Privados (30%):** ${req.distribucion.bwTunelesPrivados ?? req.distribucion.bwTunelesIPsec} Mbps
* **Throughput IMIX de Diseño Requerido (con FEC + Seguridad + Headroom):** **${req.throughputDisenoMbps} Mbps**
* **Capacidad Nominal Soportada por Chasis (${eq.modelo}):** **${eq.forwarding_capacity_mbps || eq.wan_bw_nominal_mbps} Mbps**
* **Métrica de Escala Concurrente:** ${
      fab === 'HUAWEI'
        ? `${req.mppsRequeridos} Mpps / ${req.tunelesRequeridos} Túneles IPsec (Soportado: ${eq.mpps} Mpps / ${eq.max_ipsec_tunnels} túneles)`
        : `${req.flujosRequeridos.toLocaleString('en-US')} Flujos Simultáneos (Soportado: ${eq.max_flows.toLocaleString('en-US')} flujos)`
    }

## 3. Matriz de Business Intent Overlays (BIO) y Políticas de Tráfico
| Overlay de Negocio (BIO) | Aplicaciones Objetivo | Topología / Transporte Primario | Política SLA / Corrección FEC |
| :--- | :--- | :--- | :--- |
| **BIO-1: RealTime Voice & Video** | VoIP, Microsoft Teams, Zoom | Dual-Link Active/Active (MPLS + DIA) | FEC 1:1 continuo, Jitter < 15ms, Latencia < 100ms |
| **BIO-2: Critical Enterprise Apps** | ERP, SAP, Bases de Datos Core | Hub-and-Spoke IPsec hacia Data Center | Dynamic Path Steering + Optimización WAN Boost |
| **BIO-3: Cloud SaaS Direct** | Microsoft 365, Salesforce, Web | Local Internet Breakout (First-packet iQ) | Inspección SASE / NGFW directo a Internet |
| **BIO-4: Bulk & Backup** | Replicación, Backups nocturnos | Best-Effort Internet Secundario | Scavenger QoS con límite de caudal |

## 4. Lista Oficial de Materiales (BOM)
| Categoría | SKU Oficial | Descripción Técnica | Cant. | Precio Lista Unit. (USD) | Subtotal Lista (USD) |
| :--- | :--- | :--- | :---: | :---: | :---: |
${filasBom}
`;
  }

  // ============================================================================
  // 7. ESTADO GLOBAL REACTIVO CENTRALIZADO (PresalesState)
  // ============================================================================

  class PresalesState {
    constructor(initialConfig = {}) {
      this.state = {
        fabricanteActivo: initialConfig.fabricanteActivo || 'ARUBA',
        parametrosHuawei: {
          bw_enlace_mbps: 200,
          medicion: 'AGREGADO',
          rol: 'BRANCH',
          local_breakout: true,
          perfil_trafico: 'ENTERPRISE_STANDARD',
          afec_activo: true,
          nivel_seguridad: 'UTM_BRANCH',
          headroom_pct: 30,
          sedes_remotas: 10,
          topologia: 'HUB_AND_SPOKE',
          plazo_anios: 3,
          nivel_soporte: 'STANDARD',
          ...(initialConfig.parametrosHuawei || {})
        },
        parametrosAruba: {
          bw_mpls_mbps: 100,
          bw_internet_mbps: 200,
          local_breakout_activo: true,
          perfil_trafico: 'ENTERPRISE_MIX',
          fec_activo: true,
          enlace_calidad: 'FIBRA_ESTANDAR',
          modelo_seguridad: 'CLOUD_SASE_SSE',
          headroom_pct: 20,
          total_usuarios: 80,
          densidad_usuarios: 'ESTANDAR',
          boost_activo: true,
          dynamic_path_steering: true,
          plazo_anios: 3,
          ...(initialConfig.parametrosAruba || {})
        },
        perfilesRollout: initialConfig.perfilesRollout || [],
        parametrosFinancieros: {
          meses_contrato: 36,
          nivel_partner: 'GOLD',
          margen_financiacion_pct: 12,
          tarifa_msp_pct: 15,
          ...(initialConfig.parametrosFinancieros || {})
        },
        ultimoResultado: null,
        ultimoRollout: null,
        ultimaSimulacionFinanciera: null
      };
      this.listeners = new Set();
      this.recalcularTodo();
    }

    subscribe(listener) {
      if (typeof listener === 'function') {
        this.listeners.add(listener);
      }
      return () => this.listeners.delete(listener);
    }

    emit(evento, payload) {
      this.listeners.forEach((listener) => {
        try {
          listener({ evento, payload, state: this.getSnapshot() });
        } catch (err) {
          console.error('[PresalesState] Error en listener:', err);
        }
      });
    }

    updateParametros(fabricante, nuevosParams = {}) {
      const fab = (fabricante || this.state.fabricanteActivo).toUpperCase();
      this.state.fabricanteActivo = fab;
      if (fab === 'HUAWEI') {
        this.state.parametrosHuawei = { ...this.state.parametrosHuawei, ...nuevosParams };
      } else {
        this.state.parametrosAruba = { ...this.state.parametrosAruba, ...nuevosParams };
      }
      this.recalcularTodo();
      this.emit('STATE_UPDATED', this.state.ultimoResultado);
      return this.state.ultimoResultado;
    }

    agregarPerfilSede(perfil) {
      this.state.perfilesRollout.push(perfil);
      this.recalcularTodo();
      this.emit('ROLLOUT_UPDATED', this.state.ultimoRollout);
      return this.state.ultimoRollout;
    }

    recalcularTodo() {
      this.state.ultimoResultado =
        this.state.fabricanteActivo === 'HUAWEI'
          ? dimensionarHuaweiNetEngine(this.state.parametrosHuawei)
          : dimensionarArubaEdgeConnect(this.state.parametrosAruba);

      if (this.state.perfilesRollout.length > 0) {
        this.state.ultimoRollout = consolidarRolloutMultiSede(this.state.perfilesRollout);
        this.state.ultimaSimulacionFinanciera = calcularSimuladorFinancieroTelco(
          this.state.ultimoRollout.totalesLista,
          {
            ...this.state.parametrosFinancieros,
            total_sedes: this.state.ultimoRollout.totalSedesProyecto
          }
        );
      } else {
        this.state.ultimaSimulacionFinanciera = calcularSimuladorFinancieroTelco(
          {
            capexListaTotalUsd: this.state.ultimoResultado.resumenCostosLista.totalCapexUsd,
            opexListaTotalUsd: this.state.ultimoResultado.resumenCostosLista.totalOpexUsd
          },
          { ...this.state.parametrosFinancieros, total_sedes: 1 }
        );
      }
    }

    getSnapshot() {
      return JSON.parse(JSON.stringify(this.state));
    }
  }

  return {
    HUAWEI_HARDWARE_CATALOG,
    HUAWEI_NGFW_CATALOG,
    ARUBA_HARDWARE_CATALOG,
    ARUBA_LEGACY_MIGRATION_MAP,
    OPTICAL_TRANSCEIVERS_CATALOG,
    calcularRequerimientosHuawei,
    dimensionarHuaweiNetEngine,
    calcularRequerimientosIngenieria,
    dimensionarArubaEdgeConnect,
    auditarAccesoriosBOM,
    consolidarRolloutMultiSede,
    calcularSimuladorFinancieroTelco,
    generarMemoriaTecnica,
    PresalesState
  };
});
