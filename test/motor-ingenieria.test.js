'use strict';
// Motor de ingeniería carrier-grade (brief del dueño, 2026-09-13 — SECCIÓN 1).
//
// POR QUÉ ESTA PRUEBA EXISTE. La fórmula de dimensionado del appliance EdgeConnect pasó
// de una doble regla histórica (anchors VSG: FEC 10/25 %, SLA de enlace 75 %) a UNA
// fórmula única declarada literalmente por el dueño:
//
//   throughputDiseno = ⌈(bwFísico / IMIX) × (1+overheadFEC) × (1+factorSeguridad)
//                      × (1+headroom)⌉
//
// Cada coeficiente es una decisión de negocio (IMIX por perfil de tráfico, FEC por
// calidad de enlace, seguridad por estrategia, margen por slider): si alguien «afina»
// uno, estas pruebas rompen aquí y no en la propuesta de un cliente.

const test = require('node:test');
const assert = require('node:assert');
const { calcularRequerimientosIngenieria } = require('../public/js/motor-ingenieria.js');

// Escenario base de referencia, calculado a mano y documentado en el brief:
//   100 Mbps MPLS + 200 Mbps Internet, SIN breakout, mezcla empresarial, FEC off,
//   sin inspección extra, headroom 20 %.
//   totalBwFisico = 300
//   IMIX 0,70 → 300/0,70 = 428,571…
//   ×1,05 (FEC off) = 450  ·  ×1,00 (sin seguridad) = 450  ·  ×1,20 (headroom) = 540
//   (en coma flotante sale 539,9999… y el ⌈ ⌉ del brief lo lleva a 540)
const BASE = {
  bw_mpls_mbps: 100,
  bw_internet_mbps: 200,
  local_breakout_activo: false,
  perfil_trafico: 'ENTERPRISE_MIX',
  fec_activo: false,
  enlace_calidad: 'NORMAL',
  modelo_seguridad: 'NINGUNO',
  headroom_pct: 20,
  total_usuarios: 10,
  densidad_usuarios: 'ESTANDAR',
};

test('fórmula determinista: caso base calculado a mano = 540 Mbps', () => {
  const r = calcularRequerimientosIngenieria(BASE);
  assert.strictEqual(r.throughputDisenoMbps, 540);
  // Y es entero hacia arriba por construcción (el Math.ceil del brief).
  assert.strictEqual(r.throughputDisenoMbps, Math.ceil((300 / 0.70) * 1.05 * 1.00 * 1.20));
});

test('Local Breakout reparte 70/30 sobre el caudal TOTAL físico', () => {
  const r = calcularRequerimientosIngenieria({ ...BASE, local_breakout_activo: true });
  assert.strictEqual(r.distribucion.totalBwFisico, 300);
  assert.strictEqual(r.distribucion.bwLocalInternet, 300 * 0.70);
  assert.strictEqual(r.distribucion.bwTunelesPrivados, 300 * 0.30);
  // Sin breakout, TODO el caudal va por túneles privados (full backhaul al DC).
  const s = calcularRequerimientosIngenieria(BASE);
  assert.strictEqual(s.distribucion.bwLocalInternet, 0);
  assert.strictEqual(s.distribucion.bwTunelesPrivados, 300);
  // Breakout sin enlace de Internet: no hay salida local — todo sigue tunelizado.
  const sinInet = calcularRequerimientosIngenieria({ ...BASE, bw_internet_mbps: 0, local_breakout_activo: true });
  assert.strictEqual(sinInet.distribucion.bwLocalInternet, 0);
  assert.strictEqual(sinInet.distribucion.bwTunelesPrivados, 100);
});

test('el IMIX degrada según el perfil: VOIP_INTENSIVE > ENTERPRISE > BULK_BACKUP', () => {
  const voip = calcularRequerimientosIngenieria({ ...BASE, perfil_trafico: 'VOIP_INTENSIVE' });
  const mix = calcularRequerimientosIngenieria(BASE);
  const bulk = calcularRequerimientosIngenieria({ ...BASE, perfil_trafico: 'BULK_BACKUP' });
  // Voz intensiva: paquetes pequeños, IMIX 0,55 → más throughput de diseño.
  assert.ok(voip.throughputDisenoMbps > mix.throughputDisenoMbps);
  assert.strictEqual(voip.throughputDisenoMbps, Math.ceil((300 / 0.55) * 1.05 * 1.20));
  // Backup/réplica masiva: paquetes grandes, IMIX 1,00 → el requerimiento baja.
  assert.ok(bulk.throughputDisenoMbps < mix.throughputDisenoMbps);
  assert.strictEqual(bulk.throughputDisenoMbps, Math.ceil((300 / 1.00) * 1.05 * 1.20));
});

test('el overhead FEC ordena: ALTA_PERDIDA_LTE (0,25) > normal (0,15) > off (0,05)', () => {
  const lte = calcularRequerimientosIngenieria({ ...BASE, fec_activo: true, enlace_calidad: 'ALTA_PERDIDA_LTE' });
  const normal = calcularRequerimientosIngenieria({ ...BASE, fec_activo: true, enlace_calidad: 'NORMAL' });
  const off = calcularRequerimientosIngenieria(BASE);
  assert.ok(lte.throughputDisenoMbps > normal.throughputDisenoMbps);
  assert.ok(normal.throughputDisenoMbps > off.throughputDisenoMbps);
  assert.strictEqual(off.throughputDisenoMbps, Math.ceil((300 / 0.70) * 1.05 * 1.20));
  assert.strictEqual(normal.throughputDisenoMbps, Math.ceil((300 / 0.70) * 1.15 * 1.20));
  assert.strictEqual(lte.throughputDisenoMbps, Math.ceil((300 / 0.70) * 1.25 * 1.20));
});

test('el factor de seguridad ordena: NGFW/DPI local (0,35) > SSE nube (0,05) > none (0)', () => {
  const ngfw = calcularRequerimientosIngenieria({ ...BASE, modelo_seguridad: 'LOCAL_NGFW_DPI' });
  const sse = calcularRequerimientosIngenieria({ ...BASE, modelo_seguridad: 'CLOUD_SASE_SSE' });
  const none = calcularRequerimientosIngenieria(BASE);
  assert.ok(ngfw.throughputDisenoMbps > sse.throughputDisenoMbps);
  assert.ok(sse.throughputDisenoMbps > none.throughputDisenoMbps);
  assert.strictEqual(ngfw.throughputDisenoMbps, Math.ceil((300 / 0.70) * 1.05 * 1.35 * 1.20));
  assert.strictEqual(sse.throughputDisenoMbps, Math.ceil((300 / 0.70) * 1.05 * 1.05 * 1.20));
});

test('headroom 0 % explícito se respeta (el default 20 % es solo para el parámetro ausente)', () => {
  // La trampa del cero falso (`headroom_pct || 20`) convertía el «sin margen» del
  // slider en un 20 % fantasma — la página declaraba «margen 0 %» y calculaba con 20.
  const sin = calcularRequerimientosIngenieria({ ...BASE, headroom_pct: 0 });
  assert.strictEqual(sin.throughputDisenoMbps, Math.ceil((300 / 0.70) * 1.05)); // sin ×1,20
  // Parámetro ausente o null: conserva el default documentado del brief (20 %).
  const ausente = { ...BASE }; delete ausente.headroom_pct;
  assert.strictEqual(calcularRequerimientosIngenieria(ausente).throughputDisenoMbps, 540);
  assert.strictEqual(calcularRequerimientosIngenieria({ ...BASE, headroom_pct: null }).throughputDisenoMbps, 540);
});

test('flujos requeridos: 80 por usuario estándar, 150 en INTENSIVO_SAAS', () => {
  assert.strictEqual(calcularRequerimientosIngenieria(BASE).flujosRequeridos, 10 * 80);
  const intensivo = calcularRequerimientosIngenieria({ ...BASE, densidad_usuarios: 'INTENSIVO_SAAS' });
  assert.strictEqual(intensivo.flujosRequeridos, 10 * 150);
  // Sin usuarios no hay flujos.
  assert.strictEqual(calcularRequerimientosIngenieria({ ...BASE, total_usuarios: 0 }).flujosRequeridos, 0);
});

test('el tier de licencia se tasa por el ancho de banda FÍSICO agregado', () => {
  // Regla del brief carrier-grade: la suscripción va por el caudal contratado al
  // operador, sin IMIX ni overheads — y NO por el efectivo tras el breakout.
  const sin = calcularRequerimientosIngenieria(BASE);
  const con = calcularRequerimientosIngenieria({ ...BASE, local_breakout_activo: true });
  assert.strictEqual(sin.tierLicenciaBwRequerido, 300);
  assert.strictEqual(con.tierLicenciaBwRequerido, 300);
});
