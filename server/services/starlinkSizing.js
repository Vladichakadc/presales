'use strict';
// Motor de dominio del dimensionador Starlink LEO, compartido entre frontend y backend.
//
// El archivo que se ejecuta aqui es EL MISMO que sirve /js/dimensionador-starlink-leo.js al
// navegador (no una copia): `calculateScenario` es una funcion pura que solo lee el objeto
// `state` que se le pasa, nunca el DOM, asi que requerirla desde Node reproduce exactamente el
// mismo resultado que el navegador calcula. Es el requisito de paridad del prompt maestro de
// integracion (seccion 4.3): un solo motor, no dos implementaciones que puedan divergir.
//
// LO QUE ESTE ARCHIVO SI HACE Y EL MOTOR NO: `calculateScenario` asume un `state` ya saneado,
// porque en el navegador ese saneo lo hace `readState()` leyendo el formulario (clamp por
// campo). El backend no tiene formulario — recibe JSON de cualquier origen — asi que
// `sanearEstado()` reaplica exactamente los mismos limites que `readState()` en
// public/js/dimensionador-starlink-leo.js, campo por campo. Sin esto, un payload con
// `users: "mil"` o `concurrency: 99999` llegaria intacto al motor y produciria un resultado sin
// sentido en vez de un 400 o un valor acotado.
const path = require('path');
const engine = require(path.join(__dirname, '..', '..', 'public', 'js', 'dimensionador-starlink-leo.js'));

function num(v, fallback, min, max) {
  const n = typeof v === 'number' ? v : Number.parseFloat(v);
  const val = Number.isFinite(n) ? n : fallback;
  return Math.min(Math.max(val, min), max);
}
const bool = (v) => v === true;
const str = (v, opciones, fallback) => (typeof v === 'string' && opciones.includes(v) ? v : fallback);
const obj = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});

// Los limites de cada campo son los mismos que `readState()` aplica en el motor de navegador
// (public/js/dimensionador-starlink-leo.js), transcritos aqui porque ese archivo es codigo de
// UI atado al DOM (usa `document.getElementById`) y no se puede requerir dos veces con
// distinto comportamiento. La tabla 5 del prompt maestro documenta los mismos limites.
function sanearEstado(raw) {
  raw = obj(raw);
  const apps = obj(raw.applications);
  const app = (clave) => obj(apps[clave]);

  return {
    siteName: (typeof raw.siteName === 'string' ? raw.siteName.trim() : '').slice(0, 80) || 'Sede sin nombre',
    scope: str(raw.scope, ['local', 'global'], 'local'),
    linkRole: str(raw.linkRole, ['primary', 'backup', 'temporary'], 'primary'),
    criticality: str(raw.criticality, ['standard', 'important', 'mission'], 'important'),
    availability: num(raw.availability, 99.5, 99, 99.95),
    users: num(raw.users, 1, 1, 10000),
    concurrency: num(raw.concurrency, 50, 5, 100),
    workDays: num(raw.workDays, 22, 1, 31),
    workHours: num(raw.workHours, 8, 1, 24),
    growth: num(raw.growth, 0, 0, 200),
    headroom: num(raw.headroom, 20, 5, 100),
    failoverHours: num(raw.failoverHours, 8, 1, 744),
    protocolOverhead: num(raw.protocolOverhead, 10, 0, 40),
    applications: {
      office: {
        enabled: bool(app('office').enabled),
        adoption: num(app('office').adoption, 100, 0, 100),
        down: num(app('office').down, 0.22, 0.01, 20),
        up: num(app('office').up, 0.08, 0.01, 20),
      },
      video: {
        enabled: bool(app('video').enabled),
        quality: str(app('video').quality, ['sd', '720', '1080'], '720'),
        adoption: num(app('video').adoption, 55, 0, 100),
        hours: num(app('video').hours, 1.25, 0, 12),
        concurrent: num(app('video').concurrent, 8, 0, 10000),
      },
      voice: {
        enabled: bool(app('voice').enabled),
        adoption: num(app('voice').adoption, 45, 0, 100),
        hours: num(app('voice').hours, 0.75, 0, 12),
        concurrent: num(app('voice').concurrent, 6, 0, 10000),
        rate: num(app('voice').rate, 0.1, 0.03, 1),
      },
      streaming: {
        enabled: bool(app('streaming').enabled),
        quality: str(app('streaming').quality, ['720', '1080', '4k'], '1080'),
        adoption: num(app('streaming').adoption, 20, 0, 100),
        hours: num(app('streaming').hours, 0.5, 0, 12),
        concurrent: num(app('streaming').concurrent, 4, 0, 10000),
      },
      cctv: {
        enabled: bool(app('cctv').enabled),
        cameras: num(app('cctv').cameras, 8, 0, 1000),
        rate: num(app('cctv').rate, 1.5, 0.1, 50),
        hours: num(app('cctv').hours, 24, 0, 24),
        days: num(app('cctv').days, 30, 0, 31),
      },
      backup: {
        enabled: bool(app('backup').enabled),
        gbDay: num(app('backup').gbDay, 8, 0, 100000),
        window: num(app('backup').window, 6, 0.5, 24),
        frequency: str(app('backup').frequency, ['workdays', 'daily'], 'workdays'),
      },
      transfer: {
        enabled: bool(app('transfer').enabled),
        gbMonth: num(app('transfer').gbMonth, 100, 0, 1000000),
        direction: str(app('transfer').direction, ['down', 'up', 'balanced'], 'down'),
        window: num(app('transfer').window, 40, 1, 744),
      },
      iot: {
        enabled: bool(app('iot').enabled),
        devices: num(app('iot').devices, 60, 0, 100000),
        mbDay: num(app('iot').mbDay, 20, 0, 100000),
        peak: num(app('iot').peak, 1, 0, 1000),
      },
      guest: {
        enabled: bool(app('guest').enabled),
        users: num(app('guest').users, 15, 0, 10000),
        gbDay: num(app('guest').gbDay, 0.5, 0, 100),
        concurrent: num(app('guest').concurrent, 6, 0, 10000),
        rate: num(app('guest').rate, 1, 0.1, 50),
      },
      manual: {
        enabled: bool(app('manual').enabled),
        gb: num(app('manual').gb, 50, 0, 1000000),
        down: num(app('manual').down, 5, 0, 10000),
        up: num(app('manual').up, 2, 0, 10000),
      },
    },
    speedProfile: str(raw.speedProfile, ['conservative', 'reference', 'upper', 'custom'], 'conservative'),
    customDown: num(raw.customDown, 120, 1, 1000),
    customUp: num(raw.customUp, 20, 1, 500),
    maxUtilization: num(raw.maxUtilization, 70, 40, 90),
    redundancy: str(raw.redundancy, ['auto', 'single', 'dual', 'hybrid'], 'auto'),
    obstruction: str(raw.obstruction, ['pending', 'clear', 'partial'], 'pending'),
    powerQuality: str(raw.powerQuality, ['stable', 'unstable', 'generator', 'solar'], 'stable'),
    environment: str(raw.environment, ['normal', 'remote', 'coastal', 'harsh', 'extreme'], 'normal'),
    mobility: str(raw.mobility, ['fixed', 'vehicle', 'maritime'], 'fixed'),
    area: num(raw.area, 600, 20, 1000000),
    floors: num(raw.floors, 1, 1, 100),
    wallDensity: str(raw.wallDensity, ['open', 'medium', 'dense'], 'medium'),
    upsMinutes: num(raw.upsMinutes, 60, 0, 1440),
    pricesVerified: bool(raw.pricesVerified),
    catalogDate: (typeof raw.catalogDate === 'string' && raw.catalogDate.trim()) || engine.researchDate,
  };
}

// El catalogo editable solo admite cambiar PRECIO de un plan ya existente, nunca su cuota GB,
// su nombre ni anadir/quitar planes — igual que el editor del navegador (seccion 6 del prompt:
// "conserva ... las cuotas inmutables desde la interfaz"). Un id que no exista en el catalogo
// canonico se ignora en vez de crear un plan nuevo con datos arbitrarios.
function sanearCatalogos(raw) {
  const base = engine.createCatalogs();
  raw = obj(raw);
  for (const scope of ['local', 'global']) {
    const overrides = Array.isArray(raw[scope]) ? raw[scope] : [];
    for (const o of overrides) {
      if (!o || typeof o.id !== 'string') continue;
      const plan = base[scope].find((p) => p.id === o.id);
      if (plan && Number.isFinite(Number(o.price)) && Number(o.price) >= 0) {
        plan.price = Math.round(Number(o.price));
      }
    }
  }
  return base;
}

// Autoritativo: recibe el JSON del cliente, lo sanea y devuelve exactamente el mismo objeto de
// resultado que `window.StarlinkDimensioner.calculate()` produce en el navegador para el mismo
// estado ya saneado. El cliente nunca puede enviar `required`, `plan`, `bom`, etc. como
// autoritativos porque esta funcion los ignora por completo: solo mira `inputs`/`catalogSnapshot`.
function calcular(payload) {
  const state = sanearEstado(payload && payload.inputs);
  const catalogos = sanearCatalogos(payload && payload.catalogSnapshot);
  return { state, result: engine.calculate(state, catalogos) };
}

module.exports = { sanearEstado, sanearCatalogos, calcular, engine };
