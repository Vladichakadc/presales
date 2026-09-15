'use strict';
/* global module */
// `module` existe solo en Node (tests); en el navegador el typeof lo degrada.
/* ══ MOTOR DE INGENIERÍA CARRIER-GRADE (2026-09-13) ══
   Regla de diseño del dueño (brief carrier-grade, 2026-09-13) — sustituye a la doble
   regla anterior y cierra el pendiente #30. Los anchors oficiales previos (FEC auto
   10 %/agresivo 25 % VSG, SLA de enlace 75 %) quedan como referencia documentada; el
   SLA 75 % se conserva en el default del slider de margen (30 %).

   UNA sola fórmula para el throughput de diseño del appliance EdgeConnect:

     throughputDiseno = ⌈(bwFísico / IMIX) × (1 + overheadFEC) × (1 + factorSeguridad)
                        × (1 + headroom)⌉

   · IMIX según el perfil de tráfico: 0,70 mezcla empresarial / 0,55 voz intensiva
     (paquetes pequeños) / 1,00 backup-réplica masiva (paquetes grandes).
   · FEC: 0,05 base; 0,15 con FEC activo; 0,25 en enlace de alta pérdida (LTE/satélite).
   · Seguridad: 0,35 NGFW/DPI local (Dynamic Threat Defense), 0,05 SSE en la nube, 0.
   · Headroom: margen de crecimiento del slider (#head, en %).

   La LICENCIA (tier) se tasa aparte, por el ancho de banda FÍSICO AGREGADO del sitio —
   sin IMIX ni overheads: es lo que se contrata al operador.

   Módulo puro, sin DOM ni estado: patrón UMD para usarlo desde el navegador como global
   `MotorIngenieria` (la página lo carga con <script src="/js/motor-ingenieria.js">) y
   desde Node con require() en los tests. La ERRATA del brief (`bwTune`) queda corregida
   a `bwTunelesPrivados`. */
(function(root, factory){
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.MotorIngenieria = api;
})(typeof window !== 'undefined' ? window : globalThis, function(){

  function calcularRequerimientosIngenieria(params) {
    const totalBwFisico = params.bw_mpls_mbps + params.bw_internet_mbps;
    let bwLocalInternet = 0, bwTunelesPrivados = 0;
    if (params.local_breakout_activo && params.bw_internet_mbps > 0) {
      bwLocalInternet = totalBwFisico * 0.70;   // 70 % SaaS/navegación sale local
      bwTunelesPrivados = totalBwFisico * 0.30; // 30 % interno hacia el DC
    } else { bwTunelesPrivados = totalBwFisico; }
    let factorIMIX = 0.70;
    if (params.perfil_trafico === 'VOIP_INTENSIVE') factorIMIX = 0.55;
    if (params.perfil_trafico === 'BULK_BACKUP') factorIMIX = 1.00;
    let overheadFEC = 0.05;
    if (params.fec_activo) overheadFEC = params.enlace_calidad === 'ALTA_PERDIDA_LTE' ? 0.25 : 0.15;
    let factorSeguridad = 0.0;
    if (params.modelo_seguridad === 'LOCAL_NGFW_DPI') factorSeguridad = 0.35;
    else if (params.modelo_seguridad === 'CLOUD_SASE_SSE') factorSeguridad = 0.05;
    const factorHeadroom = (params.headroom_pct || 20) / 100;
    const throughputDisenoMbps = Math.ceil(((totalBwFisico / factorIMIX) * (1 + overheadFEC) * (1 + factorSeguridad)) * (1 + factorHeadroom));
    const sesionesPorUsuario = params.densidad_usuarios === 'INTENSIVO_SAAS' ? 150 : 80;
    const flujosRequeridos = params.total_usuarios * sesionesPorUsuario;
    return { throughputDisenoMbps, flujosRequeridos, tierLicenciaBwRequerido: totalBwFisico,
             distribucion: { bwLocalInternet, bwTunelesPrivados, totalBwFisico } };
  }

  return { calcularRequerimientosIngenieria };
});
