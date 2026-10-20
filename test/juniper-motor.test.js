'use strict';
// Motor del dimensionador Juniper (2026-10-19).
//
// POR QUÉ ESTA PRUEBA EXISTE. El motor nació de auditar una herramienta externa que el dueño
// trajo para integrar. Esa herramienta tenía cuatro fallos de cálculo que aquí se fijan como
// regla para que nadie los reintroduzca al «homologar» de nuevo:
//   1. El breakout local se anunciaba y no se contaba. Aquí descarga el HUB, no la sucursal.
//   2. La duplicación de paquetes era un +35 % fijo. Duplicar un flujo lo duplica entero.
//   3. El túnel IPsec era un +32 % fijo. El overlay del SSR es SVR y su coste es la capa de
//      cifrado que publica la ficha, no un porcentaje.
//   4. La inspección se sumaba como recargo al caudal del SRX. En un SRX cambia la CAPA.
// Y una regla de datos: el filtro del SRX desacoplado es el mismo de la plataforma SRX, así
// que un modelo sin cifra en la capa se aparta en los dos sitios, nunca se cuela.

const test = require('node:test');
const assert = require('node:assert');
const M = require('../public/js/juniper-motor.js');
const { MODELS } = require('../server/seed/legacyData/juniper.js');

const { SDWAN } = require('../server/seed/legacyData/juniper.js');

const BASE = { rol: 'sucursal', bwMbps: 1000, cifrado: 'hmac', dupPct: 0, headroomPct: 0 };

test('el SSR no divide por IMIX: su cifra ya es IMIX (las fichas lo dicen)', () => {
  // La primera versión dividía por 0,70 «homologado con EdgeConnect» porque `cap` no declaraba
  // su base. Las fichas SSR100/SSR1000 la declaran: «Unencrypted (IMIX)». Contarla dos veces
  // pedía un 43 % de equipo de más.
  const r = M.demandaSsr(BASE);
  assert.strictEqual(r.need, 1000);
  assert.deepStrictEqual(r.pasos.map((p) => Math.round(p.v)), [1000, 1000, 1000]);
});

test('la capa de cifrado elige la cifra, por defecto la más exigente', () => {
  assert.strictEqual(M.demandaSsr(BASE).capa.k, 'capHmac');
  assert.strictEqual(M.demandaSsr({ ...BASE, cifrado: 'cif' }).capa.k, 'capCif');
  assert.strictEqual(M.demandaSsr({ ...BASE, cifrado: 'plano' }).capa.k, 'cap');
  assert.strictEqual(M.demandaSsr({ ...BASE, cifrado: 'otra' }).capa.k, 'capHmac', 'lo desconocido cae a la capa segura');
});

test('cada SSR del catálogo trae las tres capas, monótonas como en la ficha', () => {
  for (const m of SDWAN) {
    for (const c of Object.values(M.CIFRADOS)) {
      assert.ok(Number.isFinite(m[c.k]) && Number.isFinite(m[c.k1500]), `${m.id}: falta ${c.k} o ${c.k1500}`);
      assert.ok(m[c.k1500] >= m[c.k], `${m.id}: con 1.500 B no puede dar menos que en IMIX (${c.k})`);
    }
    assert.ok(m.cap >= m.capCif && m.capCif >= m.capHmac, `${m.id}: cifrar no puede dar más que sin cifrar`);
  }
});

test('con HMAC el SSR1200 da 2,5 Gbps: cumple 2 y no 3, aunque sin cifrar dé 10', () => {
  const k = M.demandaSsr(BASE).capa.k;
  const dos = M.candidatosSsr(SDWAN, k, 2000).candidatos.map((m) => m.id);
  assert.ok(dos.includes('SSR1200'));
  const tres = M.candidatosSsr(SDWAN, k, 3000).candidatos.map((m) => m.id);
  assert.ok(!tres.includes('SSR1200'), 'con la cifra sin cifrar (10 Gbps) habría salido: es el error que la capa evita');
  assert.ok(tres.includes('SSR1300'));
});

test('candidatosSsr aparta el modelo sin cifra en la capa', () => {
  const r = M.candidatosSsr([{ id: 'A', cap: 5000 }, { id: 'B', cap: 5000, capHmac: 4000 }], 'capHmac', 1000);
  assert.deepStrictEqual(r.candidatos.map((m) => m.id), ['B']);
  assert.strictEqual(r.sinCifra, 1);
});

test('duplicar el 100 % del tráfico lo duplica entero, no +35 %', () => {
  const sin = M.demandaSsr(BASE).need;
  const todo = M.demandaSsr({ ...BASE, dupPct: 100 }).need;
  assert.ok(Math.abs(todo - 2 * sin) <= 1);
  assert.strictEqual(M.demandaSsr({ ...BASE, dupPct: 20 }).need, 1200);
});

test('el breakout local no descarga la sucursal y sí el hub', () => {
  const suc = M.demandaSsr({ ...BASE, breakoutPct: 70 });
  assert.strictEqual(suc.base, 1000, 'todo el tráfico del sitio atraviesa el SSR de la sucursal');
  const hub = M.demandaSsr({ ...BASE, rol: 'hub', spokes: 20, bwMbps: 100, breakoutPct: 70, simultPct: 100 });
  assert.strictEqual(Math.round(hub.base), 600, '20 sucursales × 100 Mbps × 30 % de overlay');
  const hubSimult = M.demandaSsr({ ...BASE, rol: 'hub', spokes: 20, bwMbps: 100, breakoutPct: 70, simultPct: 50 });
  assert.strictEqual(Math.round(hubSimult.base), 300);
});

test('el margen se aplica una vez y al final', () => {
  const r = M.demandaSsr({ ...BASE, headroomPct: 30 });
  assert.strictEqual(r.need, 1300);
  assert.strictEqual(r.pasos[r.pasos.length - 1].v, r.need);
});

test('entradas vacías, negativas o absurdas no dan una demanda falsa', () => {
  assert.strictEqual(M.demandaSsr({ ...BASE, bwMbps: '' }).need, 0);
  assert.strictEqual(M.demandaSsr({ ...BASE, bwMbps: -50 }).need, 0);
  assert.strictEqual(M.demandaSsr({ ...BASE, rol: 'hub', spokes: 0 }).need, 0);
  assert.strictEqual(M.demandaSsr({ ...BASE, rol: 'hub', spokes: 5, breakoutPct: 100 }).need, 0);
  assert.strictEqual(M.demandaSsr({ ...BASE, dupPct: 400 }).duplicacion, 1, 'la fracción duplicada no pasa del 100 %');
});

test('el SRX desacoplado inspecciona por capa, sin IMIX ni recargos', () => {
  const todo = M.inspeccionSrx({ ...BASE, alcance: 'todo', breakoutPct: 70, headroomPct: 30 });
  assert.strictEqual(todo.need, 1300);
  const dia = M.inspeccionSrx({ ...BASE, alcance: 'dia', breakoutPct: 70, headroomPct: 30 });
  assert.strictEqual(dia.need, 910);
  assert.ok(dia.soloDia);
  const hub = M.inspeccionSrx({ ...BASE, rol: 'hub', alcance: 'dia', spokes: 10, bwMbps: 100, breakoutPct: 70, headroomPct: 0 });
  assert.strictEqual(hub.need, 300, 'en el hub no hay DIA: se inspecciona todo lo que llega');
  assert.strictEqual(hub.soloDia, false);
});

test('candidatosSrx aparta el modelo sin cifra en la capa y no lo rellena con otra', () => {
  const r = M.candidatosSrx(MODELS, 'atp', 1000, 0);
  const sinAtp = MODELS.filter((m) => m.atp == null).map((m) => m.id);
  assert.ok(sinAtp.length > 0, 'el catálogo real tiene modelos sin atp; si no, esta prueba no prueba nada');
  assert.strictEqual(r.sinCifra, sinAtp.length);
  for (const id of sinAtp) assert.ok(!r.candidatos.some((m) => m.id === id), `${id} no tiene atp y no puede salir`);
  for (const m of r.candidatos) assert.ok(m.atp >= 1000);
});

test('con las cifras verificadas, 5 Gbps de IPS no los cumple un SRX1600 (la herramienta externa decía 21)', () => {
  const r = M.candidatosSrx(MODELS, 'ips', 5000, 0);
  assert.ok(!r.candidatos.some((m) => m.id === 'SRX1600'));
  assert.ok(r.candidatos.some((m) => m.id === 'SRX2300'));
});

test('candidatosSrx descarta por sesiones solo donde hay cifra', () => {
  const r = M.candidatosSrx([{ id: 'A', ips: 9000, sess: 1000 }, { id: 'B', ips: 9000, sess: null }], 'ips', 100, 5000);
  assert.deepStrictEqual(r.candidatos.map((m) => m.id), ['B']);
  assert.strictEqual(r.outBySess, 1);
});

test('pool CGNAT por bloques: 50.000 usuarios con 1.024 puertos son 794 IPv4 en un /22', () => {
  const r = M.poolCgnat({ usuarios: 50000, bloque: 1024 });
  assert.strictEqual(r.porIp, 63);
  assert.strictEqual(r.ips, 794);
  assert.strictEqual(r.prefijo, 22);
  assert.strictEqual(r.enPrefijo, 1024);
  assert.strictEqual(M.poolCgnat({ usuarios: 1, bloque: 512 }).prefijo, 32);
  assert.strictEqual(M.poolCgnat({ usuarios: 0, bloque: 512 }), null);
  assert.strictEqual(M.poolCgnat({ usuarios: 10, bloque: 70000 }), null, 'un bloque mayor que los puertos de una IP no cabe');
});
