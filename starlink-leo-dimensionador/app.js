(() => {
  "use strict";

  const VERSION = "1.0.0";
  const RESEARCH_DATE = "2026-09-23";
  const GB_PER_MBPS_HOUR = 0.45;
  const OFFICIAL_TYPICAL_MAX = { down: 220, up: 30 };

  const DEFAULT_CATALOGS = Object.freeze({
    local: Object.freeze([
      Object.freeze({ id: "local-50", name: "Local Priority 50 GB", gb: 50, price: 203000 }),
      Object.freeze({ id: "local-1000", name: "Local Priority 1 TB", gb: 1000, price: 905000 }),
      Object.freeze({ id: "local-2000", name: "Local Priority 2 TB", gb: 2000, price: 1685000 }),
      Object.freeze({ id: "local-6000", name: "Local Priority 6 TB", gb: 6000, price: 4805000 })
    ]),
    global: Object.freeze([
      Object.freeze({ id: "global-50", name: "Global Priority 50 GB", gb: 50, price: 1300000 }),
      Object.freeze({ id: "global-1000", name: "Global Priority 1 TB", gb: 1000, price: 5980000 }),
      Object.freeze({ id: "global-5000", name: "Global Priority 5 TB", gb: 5000, price: 26780000 }),
      Object.freeze({ id: "global-10000", name: "Global Priority 10 TB", gb: 10000, price: 52780000 }),
      Object.freeze({ id: "global-15000", name: "Global Priority 15 TB", gb: 15000, price: 78780000 }),
      Object.freeze({ id: "global-25000", name: "Global Priority 25 TB", gb: 25000, price: 130780000 })
    ])
  });

  const VIDEO_PROFILES = Object.freeze({
    sd: { label: "Video estándar", down: 0.6, up: 1.0 },
    720: { label: "Videoconferencia HD 720p", down: 1.8, up: 2.6 },
    1080: { label: "Videoconferencia Full HD 1080p", down: 3.0, up: 3.8 }
  });

  const STREAM_PROFILES = Object.freeze({
    720: { label: "Streaming HD 720p", down: 2.5 },
    1080: { label: "Streaming HD 1080p", down: 5.0 },
    "4k": { label: "Streaming 4K UHD", down: 20.0 }
  });

  const SPEED_PROFILES = Object.freeze({
    conservative: { label: "extremo inferior publicado", down: 50, up: 10, siteValidated: false },
    reference: { label: "referencia de diseño", down: 100, up: 15, siteValidated: false },
    upper: { label: "escenario alto declarado como validado", down: 220, up: 30, siteValidated: true }
  });

  const SOURCE_LINKS = Object.freeze([
    "https://starlink.com/co/business",
    "https://starlink.com/public-files/Priority_Plan_Transition.pdf",
    "https://starlink.com/legal/documents/DOC-1728-44881-79",
    "https://starlink.com/legal/documents/DOC-1722-29027-68",
    "https://starlink.com/public-files/specification_sheet_performance.pdf",
    "https://starlink.com/public-files/specification_sheet_standard.pdf",
    "https://support.zoom.com/hc/en/article?id=zm_kb&sysparm_article=KB0060748",
    "https://support.google.com/youtube/answer/78358?hl=es"
  ]);

  const $ = (id) => document.getElementById(id);
  const value = (id) => $(id)?.value ?? "";
  const checked = (id) => Boolean($(id)?.checked);
  const number = (id, fallback = 0) => {
    const parsed = Number.parseFloat(value(id));
    return Number.isFinite(parsed) ? parsed : fallback;
  };
  const clamp = (n, min, max) => Math.min(Math.max(Number.isFinite(n) ? n : min, min), max);
  const round = (n, digits = 1) => Number((Number.isFinite(n) ? n : 0).toFixed(digits));
  const pct = (n) => clamp(n, 0, 100) / 100;
  const factor = (percent) => 1 + Math.max(0, percent) / 100;
  const deepCloneCatalogs = () => ({
    local: DEFAULT_CATALOGS.local.map((plan) => ({ ...plan })),
    global: DEFAULT_CATALOGS.global.map((plan) => ({ ...plan }))
  });

  let catalogs = deepCloneCatalogs();
  let latestResult = null;
  let toastTimer = null;

  function formatCop(amount) {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0
    }).format(amount || 0);
  }

  function formatNumber(amount, maxDigits = 1) {
    return new Intl.NumberFormat("es-CO", {
      maximumFractionDigits: maxDigits
    }).format(Number.isFinite(amount) ? amount : 0);
  }

  function formatData(gb) {
    if (gb >= 1000) return `${formatNumber(gb / 1000, 2)} TB`;
    return `${formatNumber(gb, gb < 100 ? 1 : 0)} GB`;
  }

  function showToast(message) {
    const toast = $("toast");
    toast.textContent = message;
    toast.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 2600);
  }

  function readState() {
    return {
      siteName: value("siteName").trim() || "Sede sin nombre",
      scope: value("scope"),
      linkRole: value("linkRole"),
      criticality: value("criticality"),
      availability: number("availability", 99.5),
      users: clamp(number("users", 1), 1, 10000),
      concurrency: clamp(number("concurrency", 50), 5, 100),
      workDays: clamp(number("workDays", 22), 1, 31),
      workHours: clamp(number("workHours", 8), 1, 24),
      growth: clamp(number("growth", 0), 0, 200),
      headroom: clamp(number("headroom", 20), 5, 100),
      failoverHours: clamp(number("failoverHours", 8), 1, 744),
      protocolOverhead: clamp(number("protocolOverhead", 10), 0, 40),
      applications: {
        office: {
          enabled: checked("officeEnabled"), adoption: clamp(number("officeAdoption"), 0, 100),
          down: clamp(number("officeDown"), 0.01, 20), up: clamp(number("officeUp"), 0.01, 20)
        },
        video: {
          enabled: checked("videoEnabled"), quality: value("videoQuality"),
          adoption: clamp(number("videoAdoption"), 0, 100), hours: clamp(number("videoHours"), 0, 12),
          concurrent: clamp(number("videoConcurrent"), 0, 10000)
        },
        voice: {
          enabled: checked("voiceEnabled"), adoption: clamp(number("voiceAdoption"), 0, 100),
          hours: clamp(number("voiceHours"), 0, 12), concurrent: clamp(number("voiceConcurrent"), 0, 10000),
          rate: clamp(number("voiceRate"), 0.03, 1)
        },
        streaming: {
          enabled: checked("streamEnabled"), quality: value("streamQuality"),
          adoption: clamp(number("streamAdoption"), 0, 100), hours: clamp(number("streamHours"), 0, 12),
          concurrent: clamp(number("streamConcurrent"), 0, 10000)
        },
        cctv: {
          enabled: checked("cctvEnabled"), cameras: clamp(number("cctvCameras"), 0, 1000),
          rate: clamp(number("cctvRate"), 0.1, 50), hours: clamp(number("cctvHours"), 0, 24),
          days: clamp(number("cctvDays"), 0, 31)
        },
        backup: {
          enabled: checked("backupEnabled"), gbDay: clamp(number("backupGbDay"), 0, 100000),
          window: clamp(number("backupWindow"), 0.5, 24), frequency: value("backupFrequency")
        },
        transfer: {
          enabled: checked("transferEnabled"), gbMonth: clamp(number("transferGbMonth"), 0, 1000000),
          direction: value("transferDirection"), window: clamp(number("transferWindow"), 1, 744)
        },
        iot: {
          enabled: checked("iotEnabled"), devices: clamp(number("iotDevices"), 0, 100000),
          mbDay: clamp(number("iotMbDay"), 0, 100000), peak: clamp(number("iotPeak"), 0, 1000)
        },
        guest: {
          enabled: checked("guestEnabled"), users: clamp(number("guestUsers"), 0, 10000),
          gbDay: clamp(number("guestGbDay"), 0, 100), concurrent: clamp(number("guestConcurrent"), 0, 10000),
          rate: clamp(number("guestRate"), 0.1, 50)
        },
        manual: {
          enabled: checked("manualEnabled"), gb: clamp(number("manualGb"), 0, 1000000),
          down: clamp(number("manualDown"), 0, 10000), up: clamp(number("manualUp"), 0, 10000)
        }
      },
      speedProfile: value("speedProfile"),
      customDown: clamp(number("customDown"), 1, 1000),
      customUp: clamp(number("customUp"), 1, 500),
      maxUtilization: clamp(number("maxUtilization"), 40, 90),
      redundancy: value("redundancy"),
      obstruction: value("obstruction"),
      powerQuality: value("powerQuality"),
      environment: value("environment"),
      mobility: value("mobility"),
      area: clamp(number("area"), 20, 1000000),
      floors: clamp(number("floors"), 1, 100),
      wallDensity: value("wallDensity"),
      upsMinutes: clamp(number("upsMinutes"), 0, 1440),
      pricesVerified: checked("pricesVerified"),
      catalogDate: value("catalogDate") || RESEARCH_DATE
    };
  }

  function appRow(key, label, gb, down, up, details = "") {
    return {
      key,
      label,
      gb: Math.max(0, gb || 0),
      down: Math.max(0, down || 0),
      up: Math.max(0, up || 0),
      details
    };
  }

  function calculateApplications(state) {
    const rows = [];
    const apps = state.applications;
    const concurrentUsers = Math.ceil(state.users * pct(state.concurrency));

    if (apps.office.enabled) {
      const participants = state.users * pct(apps.office.adoption);
      const activeAtPeak = concurrentUsers * pct(apps.office.adoption);
      rows.push(appRow(
        "office", "Ofimática, web y SaaS",
        participants * state.workHours * state.workDays * (apps.office.down + apps.office.up) * GB_PER_MBPS_HOUR,
        activeAtPeak * apps.office.down,
        activeAtPeak * apps.office.up,
        `${round(participants, 0)} usuarios · ${apps.office.down}/${apps.office.up} Mbps por usuario activo`
      ));
    }

    if (apps.video.enabled) {
      const profile = VIDEO_PROFILES[apps.video.quality] || VIDEO_PROFILES["720"];
      const participants = state.users * pct(apps.video.adoption);
      rows.push(appRow(
        "video", profile.label,
        participants * apps.video.hours * state.workDays * (profile.down + profile.up) * GB_PER_MBPS_HOUR,
        apps.video.concurrent * profile.down,
        apps.video.concurrent * profile.up,
        `${round(participants, 0)} participantes · ${apps.video.concurrent} simultáneos`
      ));
    }

    if (apps.voice.enabled) {
      const participants = state.users * pct(apps.voice.adoption);
      rows.push(appRow(
        "voice", "Telefonía IP",
        participants * apps.voice.hours * state.workDays * (apps.voice.rate * 2) * GB_PER_MBPS_HOUR,
        apps.voice.concurrent * apps.voice.rate,
        apps.voice.concurrent * apps.voice.rate,
        `${apps.voice.concurrent} llamadas simultáneas · ${apps.voice.rate} Mbps por sentido`
      ));
    }

    if (apps.streaming.enabled) {
      const profile = STREAM_PROFILES[apps.streaming.quality] || STREAM_PROFILES["1080"];
      const participants = state.users * pct(apps.streaming.adoption);
      rows.push(appRow(
        "streaming", profile.label,
        participants * apps.streaming.hours * state.workDays * profile.down * GB_PER_MBPS_HOUR,
        apps.streaming.concurrent * profile.down,
        apps.streaming.concurrent * profile.down * 0.03,
        `${apps.streaming.concurrent} streams simultáneos`
      ));
    }

    if (apps.cctv.enabled) {
      rows.push(appRow(
        "cctv", "CCTV hacia nube/centro remoto",
        apps.cctv.cameras * apps.cctv.rate * apps.cctv.hours * apps.cctv.days * GB_PER_MBPS_HOUR,
        apps.cctv.cameras * apps.cctv.rate * 0.02,
        apps.cctv.cameras * apps.cctv.rate,
        `${apps.cctv.cameras} cámaras · ${apps.cctv.rate} Mbps por cámara`
      ));
    }

    if (apps.backup.enabled) {
      const days = apps.backup.frequency === "daily" ? 30 : state.workDays;
      const uploadMbps = apps.backup.gbDay * 8000 / (apps.backup.window * 3600);
      rows.push(appRow(
        "backup", "Copias de seguridad y sincronización",
        apps.backup.gbDay * days,
        uploadMbps * 0.04,
        uploadMbps,
        `${apps.backup.gbDay} GB/día en ventana de ${apps.backup.window} h`
      ));
    }

    if (apps.transfer.enabled) {
      const aggregateRate = apps.transfer.gbMonth * 8000 / (apps.transfer.window * 3600);
      let down = 0;
      let up = 0;
      if (apps.transfer.direction === "down") down = aggregateRate;
      else if (apps.transfer.direction === "up") up = aggregateRate;
      else { down = aggregateRate / 2; up = aggregateRate / 2; }
      rows.push(appRow(
        "transfer", "Transferencias y actualizaciones",
        apps.transfer.gbMonth, down, up,
        `${apps.transfer.gbMonth} GB/mes en ${apps.transfer.window} horas de mayor actividad`
      ));
    }

    if (apps.iot.enabled) {
      rows.push(appRow(
        "iot", "IoT y telemetría",
        apps.iot.devices * apps.iot.mbDay * 30 / 1000,
        apps.iot.peak * 0.2,
        apps.iot.peak,
        `${apps.iot.devices} dispositivos · ${apps.iot.mbDay} MB/día cada uno`
      ));
    }

    if (apps.guest.enabled) {
      rows.push(appRow(
        "guest", "Wi-Fi de invitados",
        apps.guest.users * apps.guest.gbDay * state.workDays,
        apps.guest.concurrent * apps.guest.rate,
        apps.guest.concurrent * apps.guest.rate * 0.2,
        `${apps.guest.users} invitados/día · límite ${apps.guest.rate} Mbps`
      ));
    }

    if (apps.manual.enabled) {
      rows.push(appRow(
        "manual", "Carga adicional conocida",
        apps.manual.gb,
        apps.manual.down,
        apps.manual.up,
        "Entrada manual de preventa"
      ));
    }

    return { rows, concurrentUsers };
  }

  function resolveSpeedProfile(state) {
    if (state.speedProfile === "custom") {
      return {
        label: "medición personalizada",
        down: state.customDown,
        up: state.customUp,
        siteValidated: true
      };
    }
    return { ...(SPEED_PROFILES[state.speedProfile] || SPEED_PROFILES.conservative) };
  }

  function resolveArchitecture(state, capacityTerminals) {
    let mode = state.redundancy;
    if (mode === "auto") {
      if (state.criticality === "mission" || state.availability >= 99.9) mode = "hybrid";
      else if (capacityTerminals > 1) mode = "dual";
      else mode = "single";
    }

    let starlinkTerminals = capacityTerminals;
    if (mode === "single") starlinkTerminals = 1;
    if (mode === "dual") starlinkTerminals = Math.max(2, capacityTerminals);
    if (mode === "hybrid") starlinkTerminals = Math.max(1, capacityTerminals);

    const labels = {
      single: "Una línea Starlink",
      dual: "Starlink activo-activo",
      hybrid: "Starlink + operador diverso"
    };

    return {
      mode,
      label: labels[mode],
      starlinkTerminals,
      hasDiverseBackup: mode === "hybrid",
      activeActive: mode === "dual" || starlinkTerminals > 1
    };
  }

  function selectPlan(scope, requiredPerLineGb, activeCatalogs) {
    const list = activeCatalogs[scope] || activeCatalogs.local;
    const selected = list.find((plan) => plan.gb >= requiredPerLineGb);
    if (selected) return { ...selected, overflowGb: 0, custom: false };
    const largest = list[list.length - 1];
    return {
      ...largest,
      name: `${largest.name} + capacidad adicional`,
      overflowGb: Math.max(0, requiredPerLineGb - largest.gb),
      custom: true
    };
  }

  function resolveHardware(state, architecture) {
    const performanceReasons = [];
    if (state.mobility !== "fixed") performanceReasons.push("uso en movimiento");
    if (state.environment !== "normal") performanceReasons.push("entorno exigente");
    if (state.criticality === "mission") performanceReasons.push("operación de misión crítica");
    if (state.availability >= 99.9) performanceReasons.push("objetivo elevado de continuidad");
    if (architecture.starlinkTerminals > 1) performanceReasons.push("arquitectura multienlace");
    if (state.users > 75) performanceReasons.push("escala empresarial");

    if (performanceReasons.length) {
      return {
        name: "Performance Kit",
        shortName: "Performance",
        powerW: 100,
        reason: `Se prioriza por ${performanceReasons.slice(0, 3).join(", ")}.`,
        specs: "140° FoV · IP69K conectado · -40 a 60 °C · AC/DC"
      };
    }
    return {
      name: "Standard 4 X Kit",
      shortName: "Standard 4 X",
      powerW: 100,
      reason: "Adecuado para una sede fija, de entorno normal y criticidad controlada.",
      specs: "110° FoV · IP67 · -30 a 50 °C · Wi-Fi 6"
    };
  }

  function calculateAccessPoints(state, concurrentUsers) {
    const coverage = { open: 180, medium: 120, dense: 80 }[state.wallDensity] || 120;
    const byArea = Math.ceil(state.area / coverage);
    const byUsers = Math.ceil(concurrentUsers / 30);
    return Math.max(1, state.floors, byArea, byUsers);
  }

  function calculateUps(state, terminalCount, hardware, accessPoints) {
    const networkBaseW = 90;
    const totalW = terminalCount * hardware.powerW + networkBaseW + accessPoints * 15;
    const hours = state.upsMinutes / 60;
    const requiredWh = totalW * hours / 0.85;
    const requiredVa = totalW * 1.55;
    const standards = [1000, 1500, 2200, 3000, 5000, 6000];
    const selectedVa = standards.find((size) => size >= requiredVa) || Math.ceil(requiredVa / 1000) * 1000;
    return { totalW: round(totalW, 0), requiredWh: round(requiredWh, 0), selectedVa };
  }

  function determineConstraint(quotaRatio, downRatio, upRatio) {
    const candidates = [
      { key: "quota", label: "Cuota mensual", ratio: quotaRatio },
      { key: "down", label: "Descarga pico", ratio: downRatio },
      { key: "up", label: "Subida pico", ratio: upRatio }
    ];
    return candidates.sort((a, b) => b.ratio - a.ratio)[0];
  }

  function issue(type, title, description, code) {
    return { type, title, description, code };
  }

  function buildIssues(ctx) {
    const { state, rows, speed, architecture, plan, requiredGb, requiredDown, requiredUp, capacityTerminals, quotaRatio, downRatio, upRatio } = ctx;
    const issues = [];

    if (!rows.length) {
      issues.push(issue("danger", "No hay aplicaciones activas", "Active al menos una carga o incorpore una demanda manual para calcular el servicio.", "NO_TRAFFIC"));
    }

    if (state.obstruction === "partial") {
      issues.push(issue("danger", "No-Go por obstrucciones", "Starlink exige un campo de visión despejado. Reubique o eleve el terminal y repita la verificación en la aplicación oficial.", "OBSTRUCTION_BLOCK"));
    } else if (state.obstruction === "pending") {
      issues.push(issue("warning", "Estudio de obstrucciones pendiente", "La recomendación permanece condicionada hasta confirmar un cielo 100% despejado en la ubicación definitiva.", "OBSTRUCTION_PENDING"));
    } else {
      issues.push(issue("success", "Campo de visión declarado como despejado", "Conserve la captura del estudio y la ubicación propuesta como evidencia de preventa.", "OBSTRUCTION_CLEAR"));
    }

    if (!speed.siteValidated) {
      issues.push(issue("warning", "Capacidad no validada en la sede", `El cálculo usa ${speed.down}/${speed.up} Mbps (${speed.label}). Ejecute Speed Map y una prueba en hora pico.`, "SPEED_UNVALIDATED"));
    } else if (speed.down > OFFICIAL_TYPICAL_MAX.down || speed.up > OFFICIAL_TYPICAL_MAX.up) {
      issues.push(issue("warning", "Medición superior al rango típico publicado", "Conserve evidencia repetida por franja horaria y no convierta el máximo observado en compromiso contractual.", "SPEED_ABOVE_TYPICAL"));
    }

    if (!state.pricesVerified) {
      issues.push(issue("warning", "Tarifa por verificar", "El valor precargado es una referencia pública; valide dirección, impuestos, disponibilidad y cotización antes de ofertar.", "PRICE_UNVERIFIED"));
    }

    if (plan.custom) {
      issues.push(issue("danger", "La cuota excede el mayor paquete publicado", `Faltan aproximadamente ${formatData(plan.overflowGb)} por línea. Solicite bloques adicionales, redistribuya tráfico o diseñe más líneas.`, "PLAN_OVERFLOW"));
    }

    if (state.redundancy === "single" && capacityTerminals > 1) {
      issues.push(issue("danger", "Una sola línea no satisface el pico", `La demanda requiere al menos ${capacityTerminals} líneas con el perfil de capacidad elegido.`, "SINGLE_CAPACITY_CONFLICT"));
    }

    if (state.availability >= 99.9 && !architecture.hasDiverseBackup) {
      issues.push(issue("danger", "Falta diversidad de operador", "Para una meta de 99,9% o superior se recomienda un segundo medio independiente; dos antenas Starlink pueden compartir fallas correlacionadas.", "NO_CARRIER_DIVERSITY"));
    }

    if (state.criticality === "mission" && !architecture.hasDiverseBackup) {
      issues.push(issue("danger", "Continuidad insuficiente para misión crítica", "Incorpore un enlace terrestre, celular, microondas u otro satélite con dominio de falla diferente.", "MISSION_NO_DIVERSITY"));
    }

    if (architecture.hasDiverseBackup) {
      issues.push(issue("info", "Resiliencia híbrida propuesta", "Implemente SD-WAN con pruebas de salud de aplicación; el respaldo debe usar ruta, energía y operador distintos.", "HYBRID_READY"));
    }

    if (state.powerQuality !== "stable" && state.upsMinutes < 60) {
      issues.push(issue("warning", "Autonomía eléctrica limitada", "La disponibilidad satelital no evita cortes por energía local. Aumente UPS/batería y valide puesta a tierra.", "POWER_RISK"));
    }

    if (upRatio >= 0.8) {
      issues.push(issue(upRatio > 1 ? "danger" : "warning", "La subida es el factor restrictivo", `La carga consume ${formatNumber(upRatio * 100, 0)}% de la capacidad de diseño agregada de subida. Revise CCTV, backups y ventanas de sincronización.`, "UPLOAD_CONSTRAINT"));
    }

    if (quotaRatio >= 0.85) {
      issues.push(issue(quotaRatio > 1 ? "danger" : "warning", "Cuota con poca holgura", `La proyección utiliza ${formatNumber(quotaRatio * 100, 0)}% del paquete agregado. Configure alertas y política de top-up.`, "QUOTA_HEADROOM"));
    }

    if (state.mobility === "maritime" && state.scope !== "global") {
      issues.push(issue("danger", "Ámbito de plan incompatible", "El uso marítimo o internacional requiere validar Prioridad Global y las áreas autorizadas.", "MARITIME_SCOPE"));
    }

    if (state.linkRole === "backup") {
      issues.push(issue("info", "Cuota modelada para contingencia", `El volumen mensual se ajustó a ${state.failoverHours} horas esperadas de failover; el pico conserva la carga completa.`, "BACKUP_FACTOR"));
    }

    if (requiredGb > 0 && requiredDown < 0.1 && requiredUp < 0.1) {
      issues.push(issue("warning", "Consumo sin ventana de pico significativa", "Revise los parámetros manuales para evitar una cuota correcta con un caudal subestimado.", "NO_PEAK"));
    }

    return issues;
  }

  function calculateConfidence(state, speed, plan, issues) {
    let score = 100;
    if (state.obstruction === "pending") score -= 25;
    if (state.obstruction === "partial") score -= 55;
    if (!speed.siteValidated) score -= 20;
    if (!state.pricesVerified) score -= 10;
    if (plan.custom) score -= 20;
    if (issues.some((item) => item.code === "SINGLE_CAPACITY_CONFLICT")) score -= 20;
    score = clamp(score, 0, 100);
    return {
      score,
      label: score >= 80 ? "Alta" : score >= 55 ? "Media" : "Baja"
    };
  }

  function calculateCompleteness(state, speed) {
    const checks = [
      state.siteName.length > 2,
      state.users > 0,
      Object.values(state.applications).some((app) => app.enabled),
      state.obstruction === "clear",
      speed.siteValidated,
      state.pricesVerified,
      state.upsMinutes > 0,
      state.area > 0,
      state.redundancy !== "auto",
      state.catalogDate.length > 0
    ];
    return Math.round(checks.filter(Boolean).length / checks.length * 100);
  }

  function buildBom(state, architecture, plan, hardware, accessPoints, ups) {
    const rows = [
      { item: `Terminal ${hardware.name}`, qty: architecture.starlinkTerminals, why: `${hardware.reason} ${hardware.specs}` },
      { item: `Línea de servicio ${plan.name}`, qty: architecture.starlinkTerminals, why: `${formatData(plan.gb)} prioritarios por línea; validar tarifa y elegibilidad.` },
      { item: "Montaje permanente, sellado y cableado certificado", qty: architecture.starlinkTerminals, why: "Ubicación elevada, campo de visión despejado y protección mecánica." },
      { item: architecture.mode === "single" ? "Firewall/router empresarial" : "Firewall SD-WAN multi-WAN", qty: 1, why: architecture.mode === "single" ? "Políticas, VPN, QoS y observabilidad." : "Balanceo, failover, pruebas de salud y control de sesiones." },
      { item: `Switch PoE administrable · mínimo ${nextSwitchPorts(accessPoints + 6)} puertos`, qty: 1, why: "Alimenta AP, segmenta VLAN y separa tráfico corporativo, IoT, CCTV e invitados." },
      { item: "Puntos de acceso Wi-Fi empresariales", qty: accessPoints, why: "Estimación preliminar por área, pisos, muros y usuarios concurrentes; requiere site survey RF." },
      { item: `UPS online ${ups.selectedVa} VA · batería útil ≥ ${ups.requiredWh} Wh`, qty: 1, why: `${state.upsMinutes} minutos de autonomía para una carga estimada de ${ups.totalW} W.` },
      { item: "Protección contra sobretensión, tierra y protección exterior", qty: 1, why: "Reduce riesgos eléctricos y ambientales en antena y equipos de borde." },
      { item: "Monitoreo WAN y consumo prioritario", qty: 1, why: "Alertas de cuota, latencia, pérdida, jitter, disponibilidad y uso de top-ups." }
    ];

    if (architecture.hasDiverseBackup) {
      rows.splice(4, 0, { item: "Enlace de respaldo de operador diverso", qty: 1, why: "Diversidad de medio, ruta, energía y dominio de falla." });
    }

    if (state.environment === "remote" || state.criticality === "mission") {
      rows.push({ item: "Kit de repuesto crítico", qty: 1, why: "Fuente, cables y elementos de montaje para reducir MTTR en sitio remoto." });
    }

    return rows;
  }

  function nextSwitchPorts(needed) {
    return [8, 16, 24, 48].find((ports) => ports >= needed) || Math.ceil(needed / 48) * 48;
  }

  function calculateScenario(state, activeCatalogs = catalogs) {
    const appCalculation = calculateApplications(state);
    const fullMonthHours = Math.max(1, state.workDays * state.workHours);
    const roleFactor = state.linkRole === "backup"
      ? clamp(state.failoverHours / fullMonthHours, 0.001, 1)
      : 1;

    const rows = appCalculation.rows.map((row) => ({ ...row, gb: row.gb * roleFactor }));
    const baseGb = rows.reduce((sum, row) => sum + row.gb, 0);
    const baseDown = rows.reduce((sum, row) => sum + row.down, 0);
    const baseUp = rows.reduce((sum, row) => sum + row.up, 0);
    const aggregateFactor = factor(state.protocolOverhead) * factor(state.growth) * factor(state.headroom);
    const requiredGb = baseGb * aggregateFactor;
    const requiredDown = baseDown * aggregateFactor;
    const requiredUp = baseUp * aggregateFactor;

    const speed = resolveSpeedProfile(state);
    const utilizationFactor = pct(state.maxUtilization);
    const capacityPerTerminal = {
      down: speed.down * utilizationFactor,
      up: speed.up * utilizationFactor
    };
    const capacityTerminals = Math.max(1, Math.ceil(Math.max(
      requiredDown / Math.max(capacityPerTerminal.down, 0.1),
      requiredUp / Math.max(capacityPerTerminal.up, 0.1)
    )));

    const architecture = resolveArchitecture(state, capacityTerminals);
    const dataDistributionLines = architecture.activeActive ? architecture.starlinkTerminals : 1;
    const requiredPerLineGb = requiredGb / dataDistributionLines;
    const plan = selectPlan(state.scope, requiredPerLineGb, activeCatalogs);
    const aggregateQuotaGb = plan.gb * dataDistributionLines;
    const totalMonthlyPrice = plan.price * architecture.starlinkTerminals;

    const totalDesignCapacity = {
      down: capacityPerTerminal.down * architecture.starlinkTerminals,
      up: capacityPerTerminal.up * architecture.starlinkTerminals
    };
    const quotaRatio = requiredGb / Math.max(aggregateQuotaGb, 1);
    const downRatio = requiredDown / Math.max(totalDesignCapacity.down, 0.1);
    const upRatio = requiredUp / Math.max(totalDesignCapacity.up, 0.1);
    const constraint = determineConstraint(quotaRatio, downRatio, upRatio);
    const hardware = resolveHardware(state, architecture);
    const accessPoints = calculateAccessPoints(state, appCalculation.concurrentUsers);
    const ups = calculateUps(state, architecture.starlinkTerminals, hardware, accessPoints);

    const issueContext = {
      state, rows, speed, architecture, plan, requiredGb, requiredDown, requiredUp,
      capacityTerminals, quotaRatio, downRatio, upRatio
    };
    const issues = buildIssues(issueContext);
    const confidence = calculateConfidence(state, speed, plan, issues);
    const hasDanger = issues.some((item) => item.type === "danger");
    const hasWarning = issues.some((item) => item.type === "warning");
    const status = hasDanger ? "nogo" : (hasWarning || confidence.score < 80 ? "conditional" : "ready");
    const bom = buildBom(state, architecture, plan, hardware, accessPoints, ups);
    const completeness = calculateCompleteness(state, speed);

    return {
      version: VERSION,
      state,
      rows,
      concurrentUsers: appCalculation.concurrentUsers,
      roleFactor,
      factors: {
        protocol: factor(state.protocolOverhead),
        growth: factor(state.growth),
        headroom: factor(state.headroom),
        aggregate: aggregateFactor
      },
      base: { gb: baseGb, down: baseDown, up: baseUp },
      required: { gb: requiredGb, down: requiredDown, up: requiredUp },
      speed,
      capacityPerTerminal,
      totalDesignCapacity,
      capacityTerminals,
      architecture,
      dataDistributionLines,
      plan,
      aggregateQuotaGb,
      totalMonthlyPrice,
      ratios: { quota: quotaRatio, down: downRatio, up: upRatio },
      constraint,
      hardware,
      accessPoints,
      ups,
      issues,
      confidence,
      status,
      bom,
      completeness,
      calculatedAt: new Date().toISOString()
    };
  }

  function statusPresentation(status) {
    if (status === "ready") return { label: "Apta para propuesta", className: "status-ready" };
    if (status === "nogo") return { label: "No-Go técnico", className: "status-nogo" };
    return { label: "Condicionada", className: "status-conditional" };
  }

  function renderMeter(element, ratio) {
    const percent = clamp(ratio * 100, 0, 100);
    element.style.width = `${percent}%`;
    element.classList.toggle("is-warning", ratio >= 0.8 && ratio <= 1);
    element.classList.toggle("is-danger", ratio > 1);
  }

  function renderArchitecture(result) {
    const nodes = [
      { title: `${result.state.users} usuarios`, detail: `${result.concurrentUsers} concurrentes`, className: "" },
      { title: `${result.accessPoints} AP empresariales`, detail: "VLAN + QoS", className: "" },
      { title: result.architecture.mode === "single" ? "Firewall" : "SD-WAN", detail: "Seguridad y políticas", className: "is-accent" },
      { title: `${result.architecture.starlinkTerminals} × Starlink`, detail: result.hardware.shortName, className: "is-accent" }
    ];
    if (result.architecture.hasDiverseBackup) {
      nodes.push({ title: "Operador diverso", detail: "Failover independiente", className: "is-backup" });
    } else {
      nodes.push({ title: "Internet/Cloud", detail: result.plan.name, className: "" });
    }
    $("architectureDiagram").innerHTML = nodes.map((node) => (
      `<div class="arch-node ${node.className}"><div><strong>${node.title}</strong><small>${node.detail}</small></div></div>`
    )).join("");
  }

  function renderReasons(result) {
    const reasons = [
      `${result.plan.name} cubre ${formatData(result.required.gb)} proyectados frente a ${formatData(result.aggregateQuotaGb)} agregados de prioridad.`,
      `${result.capacityTerminals} terminal(es) son necesarios por capacidad; la arquitectura propuesta utiliza ${result.architecture.starlinkTerminals}.`,
      `${result.hardware.name}: ${result.hardware.reason}`,
      result.architecture.hasDiverseBackup
        ? "La continuidad se apoya en un segundo operador para evitar un dominio de falla satelital compartido."
        : "La arquitectura no incorpora diversidad de operador; evalúela si una interrupción afecta procesos esenciales.",
      "El plan Priority permite configurar IPv4 pública, soporte priorizado y monitoreo empresarial; confirme condiciones vigentes por línea."
    ];
    $("reasonList").innerHTML = reasons.map((text) => `<li>${text}</li>`).join("");
  }

  function renderBom(result) {
    $("bomBody").innerHTML = result.bom.map((row) => (
      `<tr><td><strong>${row.item}</strong></td><td>${row.qty}</td><td>${row.why}</td></tr>`
    )).join("");
  }

  function renderIssues(result) {
    const symbols = { danger: "!", warning: "!", info: "i", success: "✓" };
    $("issueList").innerHTML = result.issues.map((item) => (
      `<article class="issue issue-${item.type}"><span class="issue-icon" aria-hidden="true">${symbols[item.type]}</span><div><strong>${item.title}</strong><p>${item.description}</p></div></article>`
    )).join("");
    $("issueCount").textContent = String(result.issues.length);
  }

  function renderTrace(result) {
    $("traceBody").innerHTML = result.rows.length
      ? result.rows.map((row) => (
        `<tr title="${row.details}"><td>${row.label}</td><td>${formatNumber(row.gb, 1)}</td><td>${formatNumber(row.down, 1)} Mbps</td><td>${formatNumber(row.up, 1)} Mbps</td></tr>`
      )).join("")
      : `<tr><td colspan="4">No hay cargas activas.</td></tr>`;
    $("traceTotalGb").textContent = formatData(result.required.gb);
    $("traceTotalDown").textContent = `${formatNumber(result.required.down, 1)} Mbps`;
    $("traceTotalUp").textContent = `${formatNumber(result.required.up, 1)} Mbps`;
    const backupText = result.state.linkRole === "backup"
      ? ` × factor de contingencia ${formatNumber(result.roleFactor, 3)}`
      : "";
    $("formulaSummary").textContent = `Demanda base${backupText} × protocolo ${formatNumber(result.factors.protocol, 2)} × crecimiento ${formatNumber(result.factors.growth, 2)} × reserva ${formatNumber(result.factors.headroom, 2)}. La selección final se valida de manera independiente contra cuota, descarga, subida, instalación y continuidad.`;
  }

  function renderResult(result) {
    latestResult = result;
    const status = statusPresentation(result.status);
    const scopeLabel = result.state.scope === "global" ? "Prioridad global · internacional" : "Prioridad local · Colombia";

    $("resultSiteName").textContent = result.state.siteName;
    $("statusBadge").textContent = status.label;
    $("statusBadge").className = `status-badge ${status.className}`;
    $("resultPlanFamily").textContent = scopeLabel;
    $("resultPlanName").textContent = result.plan.name;
    $("resultPlanReason").textContent = result.plan.custom
      ? "La demanda supera el mayor paquete del catálogo; requiere capacidad adicional o rediseño."
      : `El paquete mínimo cubre ${formatData(result.required.gb)} de demanda prioritaria proyectada.`;
    $("resultPrice").textContent = formatCop(result.totalMonthlyPrice);
    $("resultTerminals").textContent = String(result.architecture.starlinkTerminals);
    $("resultHardware").textContent = result.hardware.shortName;
    $("resultConfidence").textContent = `${result.confidence.label} · ${result.confidence.score}%`;

    $("catalogNotice").hidden = result.state.pricesVerified;
    $("kpiData").textContent = formatData(result.required.gb);
    $("kpiDown").textContent = `${formatNumber(result.required.down, 1)} Mbps`;
    $("kpiUp").textContent = `${formatNumber(result.required.up, 1)} Mbps`;
    $("kpiConstraint").textContent = result.constraint.label;
    $("kpiConstraintNote").textContent = `${formatNumber(result.constraint.ratio * 100, 0)}% del umbral`;

    $("quotaLabel").textContent = `${formatData(result.required.gb)} de ${formatData(result.aggregateQuotaGb)}`;
    $("downLabel").textContent = `${formatNumber(result.required.down, 1)} de ${formatNumber(result.totalDesignCapacity.down, 1)} Mbps`;
    $("upLabel").textContent = `${formatNumber(result.required.up, 1)} de ${formatNumber(result.totalDesignCapacity.up, 1)} Mbps`;
    renderMeter($("quotaMeter"), result.ratios.quota);
    renderMeter($("downMeter"), result.ratios.down);
    renderMeter($("upMeter"), result.ratios.up);
    const maxRatio = Math.max(result.ratios.quota, result.ratios.down, result.ratios.up);
    $("capacityBadge").textContent = maxRatio > 1 ? "Insuficiente" : maxRatio >= 0.8 ? "Holgura baja" : "Con holgura";
    $("capacityBadge").style.color = maxRatio > 1 ? "var(--red)" : maxRatio >= 0.8 ? "var(--amber)" : "var(--green)";
    $("capacityFootnote").textContent = `Perfil ${result.speed.label}: ${result.speed.down}/${result.speed.up} Mbps por terminal, limitado al ${result.state.maxUtilization}% para diseño. No representa velocidad garantizada.`;

    $("architectureBadge").textContent = result.architecture.label;
    renderArchitecture(result);
    renderReasons(result);
    renderBom(result);
    renderIssues(result);
    renderTrace(result);

    $("progressText").textContent = `${result.completeness}%`;
    $("progressBar").style.width = `${result.completeness}%`;
  }

  function updateDynamicFields() {
    document.querySelectorAll("[data-app-card]").forEach((card) => {
      const key = card.dataset.appCard;
      const toggle = card.querySelector('input[type="checkbox"]');
      const config = document.querySelector(`[data-app-config="${key}"]`);
      const active = Boolean(toggle?.checked);
      card.classList.toggle("is-active", active);
      if (config) config.hidden = !active;
    });

    document.querySelectorAll("[data-show-when]").forEach((element) => {
      const [id, expected] = element.dataset.showWhen.split(":");
      element.hidden = value(id) !== expected;
    });
  }

  function recalculate() {
    updateDynamicFields();
    const state = readState();
    renderResult(calculateScenario(state, catalogs));
  }

  function renderCatalogEditor() {
    const rows = [];
    for (const scope of ["local", "global"]) {
      for (const plan of catalogs[scope]) {
        rows.push(`<tr><td>${plan.name}<small style="display:block;color:var(--ink-muted)">${scope === "local" ? "Colombia" : "Global"}</small></td><td>${formatData(plan.gb)}</td><td><input type="number" min="0" step="1000" value="${plan.price}" data-catalog-scope="${scope}" data-catalog-id="${plan.id}" aria-label="Precio ${plan.name}"></td></tr>`);
      }
    }
    $("catalogEditor").innerHTML = rows.join("");
  }

  function updateCatalogFromEditor(target) {
    const scope = target.dataset.catalogScope;
    const id = target.dataset.catalogId;
    if (!scope || !id) return;
    const plan = catalogs[scope].find((entry) => entry.id === id);
    if (plan) plan.price = Math.max(0, Number.parseFloat(target.value) || 0);
  }

  const EXAMPLES = Object.freeze({
    office: {
      siteName: "Oficina rural · 25 usuarios", scope: "local", linkRole: "primary", criticality: "important", availability: "99.5",
      users: 25, concurrency: 70, workDays: 22, workHours: 9, growth: 20, headroom: 25,
      officeEnabled: true, officeAdoption: 100, officeDown: 0.18, officeUp: 0.06,
      videoEnabled: true, videoQuality: "720", videoAdoption: 50, videoHours: 1, videoConcurrent: 5,
      voiceEnabled: true, voiceAdoption: 50, voiceHours: 0.5, voiceConcurrent: 4, voiceRate: 0.1,
      streamEnabled: false, cctvEnabled: false, backupEnabled: true, backupGbDay: 4, backupWindow: 6,
      transferEnabled: false, iotEnabled: false, guestEnabled: true, guestUsers: 8, guestGbDay: 0.3, guestConcurrent: 3, guestRate: 1,
      manualEnabled: false, speedProfile: "conservative", redundancy: "auto", obstruction: "pending", powerQuality: "stable",
      environment: "normal", mobility: "fixed", area: 350, floors: 1, wallDensity: "medium", upsMinutes: 60, pricesVerified: false
    },
    branch: {
      siteName: "Sucursal crítica · 80 usuarios", scope: "local", linkRole: "primary", criticality: "mission", availability: "99.9",
      users: 80, concurrency: 70, workDays: 24, workHours: 11, growth: 25, headroom: 30,
      officeEnabled: true, officeAdoption: 100, officeDown: 0.22, officeUp: 0.08,
      videoEnabled: true, videoQuality: "720", videoAdoption: 65, videoHours: 1.5, videoConcurrent: 16,
      voiceEnabled: true, voiceAdoption: 70, voiceHours: 1.2, voiceConcurrent: 15, voiceRate: 0.1,
      streamEnabled: false, cctvEnabled: false, backupEnabled: true, backupGbDay: 15, backupWindow: 8,
      transferEnabled: true, transferGbMonth: 250, transferDirection: "balanced", transferWindow: 60,
      iotEnabled: true, iotDevices: 100, iotMbDay: 15, iotPeak: 1.5,
      guestEnabled: true, guestUsers: 25, guestGbDay: 0.4, guestConcurrent: 10, guestRate: 1,
      manualEnabled: false, speedProfile: "reference", redundancy: "hybrid", obstruction: "clear", powerQuality: "unstable",
      environment: "remote", mobility: "fixed", area: 1200, floors: 2, wallDensity: "medium", upsMinutes: 120, pricesVerified: false
    },
    backup: {
      siteName: "Respaldo corporativo · 120 usuarios", scope: "local", linkRole: "backup", criticality: "mission", availability: "99.9",
      users: 120, concurrency: 60, workDays: 22, workHours: 10, growth: 15, headroom: 30, failoverHours: 10,
      officeEnabled: true, officeAdoption: 100, officeDown: 0.2, officeUp: 0.07,
      videoEnabled: true, videoQuality: "720", videoAdoption: 45, videoHours: 1, videoConcurrent: 18,
      voiceEnabled: true, voiceAdoption: 60, voiceHours: 0.8, voiceConcurrent: 20, voiceRate: 0.1,
      streamEnabled: false, cctvEnabled: false, backupEnabled: false, transferEnabled: false,
      iotEnabled: false, guestEnabled: false, manualEnabled: false,
      speedProfile: "conservative", redundancy: "hybrid", obstruction: "clear", powerQuality: "stable",
      environment: "normal", mobility: "fixed", area: 1600, floors: 3, wallDensity: "dense", upsMinutes: 90, pricesVerified: false
    },
    cctv: {
      siteName: "Operación industrial + CCTV", scope: "local", linkRole: "primary", criticality: "mission", availability: "99.9",
      users: 40, concurrency: 75, workDays: 30, workHours: 24, growth: 20, headroom: 30,
      officeEnabled: true, officeAdoption: 80, officeDown: 0.15, officeUp: 0.05,
      videoEnabled: true, videoQuality: "720", videoAdoption: 30, videoHours: 0.5, videoConcurrent: 4,
      voiceEnabled: true, voiceAdoption: 50, voiceHours: 0.5, voiceConcurrent: 5, voiceRate: 0.1,
      streamEnabled: false, cctvEnabled: true, cctvCameras: 16, cctvRate: 1.5, cctvHours: 24, cctvDays: 30,
      backupEnabled: true, backupGbDay: 20, backupWindow: 8, transferEnabled: false,
      iotEnabled: true, iotDevices: 250, iotMbDay: 25, iotPeak: 3,
      guestEnabled: false, manualEnabled: false, speedProfile: "reference", redundancy: "hybrid", obstruction: "pending",
      powerQuality: "generator", environment: "harsh", mobility: "fixed", area: 2200, floors: 1, wallDensity: "open", upsMinutes: 180, pricesVerified: false
    }
  });

  function setControl(id, newValue) {
    const element = $(id);
    if (!element) return;
    if (element.type === "checkbox") element.checked = Boolean(newValue);
    else element.value = String(newValue);
  }

  function loadExample(key) {
    const example = EXAMPLES[key] || EXAMPLES.office;
    Object.entries(example).forEach(([id, newValue]) => setControl(id, newValue));
    updateDynamicFields();
    recalculate();
    showToast(`Escenario “${example.siteName}” cargado.`);
  }

  function resetAll() {
    $("sizingForm").reset();
    catalogs = deepCloneCatalogs();
    renderCatalogEditor();
    updateDynamicFields();
    recalculate();
    showToast("Valores iniciales restablecidos.");
  }

  function exportJson() {
    if (!latestResult) return;
    const payload = {
      metadata: {
        module: "Dimensionador empresarial Starlink LEO",
        version: VERSION,
        researchDate: RESEARCH_DATE,
        catalogDate: latestResult.state.catalogDate,
        disclaimer: "Resultado de apoyo de preventa; requiere validación física, técnica y comercial."
      },
      inputs: latestResult.state,
      recommendation: {
        status: latestResult.status,
        plan: latestResult.plan,
        terminals: latestResult.architecture.starlinkTerminals,
        architecture: latestResult.architecture,
        hardware: latestResult.hardware,
        required: latestResult.required,
        designCapacity: latestResult.totalDesignCapacity,
        monthlyReferenceCop: latestResult.totalMonthlyPrice,
        confidence: latestResult.confidence,
        accessPoints: latestResult.accessPoints,
        ups: latestResult.ups,
        bom: latestResult.bom,
        issues: latestResult.issues
      },
      trace: latestResult.rows,
      sources: SOURCE_LINKS
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `dimensionamiento-starlink-${latestResult.state.siteName.toLowerCase().replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "sede"}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(link.href), 500);
    showToast("Escenario y trazabilidad exportados en JSON.");
  }

  function openMethodology() {
    const dialog = $("methodDialog");
    if (typeof dialog.showModal === "function") dialog.showModal();
  }

  function attachEvents() {
    $("sizingForm").addEventListener("input", (event) => {
      if (event.target.matches("[data-catalog-id]")) updateCatalogFromEditor(event.target);
      recalculate();
    });
    $("sizingForm").addEventListener("change", (event) => {
      if (event.target.id === "mobility" && event.target.value === "maritime" && value("scope") !== "global") {
        setControl("scope", "global");
        showToast("Se cambió el ámbito a Prioridad Global para el escenario marítimo.");
      }
      recalculate();
    });
    $("btnLoadExample").addEventListener("click", () => loadExample(value("exampleSelect")));
    $("btnReset").addEventListener("click", resetAll);
    $("btnExport").addEventListener("click", exportJson);
    $("btnPrint").addEventListener("click", () => window.print());
    $("btnMethod").addEventListener("click", openMethodology);
    $("btnSources").addEventListener("click", openMethodology);
  }

  function init() {
    renderCatalogEditor();
    attachEvents();
    updateDynamicFields();
    recalculate();
    window.StarlinkDimensioner = Object.freeze({
      version: VERSION,
      researchDate: RESEARCH_DATE,
      calculate: (state, customCatalogs = catalogs) => calculateScenario(state, customCatalogs),
      getState: readState,
      getResult: () => latestResult,
      getCatalogs: () => JSON.parse(JSON.stringify(catalogs)),
      defaults: { catalogs: DEFAULT_CATALOGS, videoProfiles: VIDEO_PROFILES, streamProfiles: STREAM_PROFILES }
    });
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = Object.freeze({
      version: VERSION,
      researchDate: RESEARCH_DATE,
      calculate: calculateScenario,
      createCatalogs: deepCloneCatalogs,
      defaults: { catalogs: DEFAULT_CATALOGS, videoProfiles: VIDEO_PROFILES, streamProfiles: STREAM_PROFILES }
    });
    return;
  }

  if (typeof document === "undefined") return;
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
