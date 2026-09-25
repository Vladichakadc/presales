const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const engine = require("../app.js");

function state(overrides = {}) {
  const base = {
    siteName: "Caso de prueba",
    scope: "local",
    linkRole: "primary",
    criticality: "important",
    availability: 99.5,
    users: 20,
    concurrency: 60,
    workDays: 20,
    workHours: 8,
    growth: 0,
    headroom: 0,
    failoverHours: 8,
    protocolOverhead: 0,
    applications: {
      office: { enabled: false, adoption: 100, down: 0.2, up: 0.08 },
      video: { enabled: false, quality: "720", adoption: 50, hours: 1, concurrent: 4 },
      voice: { enabled: false, adoption: 50, hours: 1, concurrent: 4, rate: 0.1 },
      streaming: { enabled: false, quality: "1080", adoption: 20, hours: 1, concurrent: 2 },
      cctv: { enabled: false, cameras: 8, rate: 1.5, hours: 24, days: 30 },
      backup: { enabled: false, gbDay: 5, window: 5, frequency: "workdays" },
      transfer: { enabled: false, gbMonth: 100, direction: "down", window: 20 },
      iot: { enabled: false, devices: 100, mbDay: 10, peak: 1 },
      guest: { enabled: false, users: 10, gbDay: 0.5, concurrent: 3, rate: 1 },
      manual: { enabled: true, gb: 500, down: 5, up: 2 }
    },
    speedProfile: "conservative",
    customDown: 100,
    customUp: 15,
    maxUtilization: 70,
    redundancy: "auto",
    obstruction: "clear",
    powerQuality: "stable",
    environment: "normal",
    mobility: "fixed",
    area: 300,
    floors: 1,
    wallDensity: "medium",
    upsMinutes: 60,
    pricesVerified: true,
    catalogDate: "2026-09-23"
  };

  const merged = { ...base, ...overrides };
  if (overrides.applications) {
    merged.applications = {};
    for (const key of Object.keys(base.applications)) {
      merged.applications[key] = { ...base.applications[key], ...(overrides.applications[key] || {}) };
    }
  }
  return merged;
}

const catalogs = engine.createCatalogs();
assert.equal(engine.version, "1.0.0");
assert.deepEqual(catalogs.local.map((p) => p.price), [203000, 905000, 1685000, 4805000]);

const planCases = [
  [40, "Local Priority 50 GB"],
  [500, "Local Priority 1 TB"],
  [1001, "Local Priority 2 TB"],
  [2001, "Local Priority 6 TB"]
];
for (const [gb, expectedPlan] of planCases) {
  const result = engine.calculate(state({ applications: { manual: { gb } } }), catalogs);
  assert.equal(result.plan.name, expectedPlan, `${gb} GB debe seleccionar ${expectedPlan}`);
  assert.equal(Math.round(result.required.gb), gb);
}

const overflow = engine.calculate(state({ applications: { manual: { gb: 7000 } } }), catalogs);
assert.equal(overflow.plan.custom, true);
assert.equal(overflow.status, "nogo");
assert.ok(overflow.issues.some((item) => item.code === "PLAN_OVERFLOW"));

const backup = engine.calculate(state({
  linkRole: "backup",
  failoverHours: 10,
  applications: { manual: { gb: 500, down: 10, up: 5 } }
}), catalogs);
assert.equal(backup.roleFactor, 10 / 160);
assert.equal(backup.required.gb, 31.25);
assert.equal(backup.required.down, 10, "El respaldo no reduce el pico de descarga");
assert.equal(backup.required.up, 5, "El respaldo no reduce el pico de subida");

const peak = engine.calculate(state({
  applications: { manual: { gb: 40, down: 80, up: 15 } }
}), catalogs);
assert.equal(peak.capacityTerminals, 3);
assert.equal(peak.architecture.mode, "dual");
assert.equal(peak.architecture.starlinkTerminals, 3);
assert.equal(peak.constraint.key, "down");

const forcedSingle = engine.calculate(state({
  redundancy: "single",
  applications: { manual: { gb: 40, down: 80, up: 15 } }
}), catalogs);
assert.equal(forcedSingle.architecture.starlinkTerminals, 1);
assert.equal(forcedSingle.status, "nogo");
assert.ok(forcedSingle.issues.some((item) => item.code === "SINGLE_CAPACITY_CONFLICT"));

const mission = engine.calculate(state({
  criticality: "mission",
  availability: 99.9
}), catalogs);
assert.equal(mission.architecture.mode, "hybrid");
assert.equal(mission.architecture.hasDiverseBackup, true);
assert.equal(mission.hardware.shortName, "Performance");

const blocked = engine.calculate(state({ obstruction: "partial" }), catalogs);
assert.equal(blocked.status, "nogo");
assert.ok(blocked.issues.some((item) => item.code === "OBSTRUCTION_BLOCK"));

const industrial = engine.calculate(state({
  users: 40,
  environment: "harsh",
  applications: {
    manual: { enabled: false },
    cctv: { enabled: true, cameras: 16, rate: 1.5, hours: 24, days: 30 },
    iot: { enabled: true, devices: 250, mbDay: 25, peak: 3 }
  },
  speedProfile: "reference",
  redundancy: "hybrid"
}), catalogs);
assert.equal(industrial.hardware.shortName, "Performance");
assert.ok(industrial.required.gb > 7500);
assert.ok(industrial.required.up >= 27);
assert.ok(industrial.issues.some((item) => item.code === "UPLOAD_CONSTRAINT"));

const global = engine.calculate(state({
  scope: "global",
  mobility: "maritime",
  applications: { manual: { gb: 1100, down: 10, up: 2 } }
}), catalogs);
assert.equal(global.plan.name, "Global Priority 5 TB");
assert.equal(global.hardware.shortName, "Performance");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const css = fs.readFileSync(path.join(root, "styles.css"), "utf8");
const js = fs.readFileSync(path.join(root, "app.js"), "utf8");

for (const requiredId of [
  "sizingForm", "scope", "users", "videoEnabled", "cctvEnabled", "speedProfile",
  "obstruction", "resultados", "resultPlanName", "quotaMeter", "bomBody", "issueList", "traceBody"
]) {
  assert.ok(html.includes(`id="${requiredId}"`), `Falta el elemento #${requiredId}`);
}
assert.match(css, /body\s*\{[\s\S]*?overflow:\s*hidden;/);
assert.match(css, /\.config-panel\s*\{[\s\S]*?overflow-y:\s*auto;/);
assert.match(css, /\.results-scroll\s*\{[\s\S]*?overflow-y:\s*auto;/);
assert.match(css, /@media\s*\(max-width:\s*880px\)[\s\S]*?body\s*\{\s*overflow:\s*auto;/);
assert.ok(js.includes("window.StarlinkDimensioner"));
assert.ok(js.includes("PLAN_OVERFLOW"));
assert.ok(js.includes("OBSTRUCTION_BLOCK"));

console.log(JSON.stringify({
  ok: true,
  assertions: 47,
  scenarios: {
    quota40GB: planCases[0][1],
    backup: { requiredGb: backup.required.gb, peakDown: backup.required.down },
    capacity: { terminals: peak.architecture.starlinkTerminals, constraint: peak.constraint.label },
    mission: { architecture: mission.architecture.label, hardware: mission.hardware.shortName },
    industrial: { requiredGb: Math.round(industrial.required.gb), peakUp: Math.round(industrial.required.up) }
  }
}, null, 2));
