'use strict';
// MOTOR DEL DIMENSIONADOR CISCO (2026-10-20). Lo que la herramienta externa que trajo el dueño
// hacía mal y este motor no puede volver a hacer: sumar recargos inventados, contar la salida
// local a Internet en la etiqueta y no en la cuenta, duplicar un 35 % en vez del flujo entero,
// derivar la inspección TLS de otra cifra. Se prueba con el catálogo real, no con dobles: si una
// ficha cambia una cifra, esta prueba dice qué recomendación se movió.
const test = require('node:test');
const assert = require('node:assert');
const M = require('../public/js/cisco-motor.js');
const { MODELS, LICENCIAS_G2 } = require('../server/seed/legacyData/cisco.js');

const id = (x) => MODELS.find((m) => m.id === x);
const SR = (n) => id(`Cisco Secure Router ${n}`);
const base = { modo: 'link', bwMbps: 500, dirMult: 2, headPct: 30, perfil: 'sdwan', plataforma: 'xe', seguridad: 'ninguna' };

test('la salida local a Internet entra en la cuenta, en su propia capa', () => {
  const d = M.demanda({ ...base, diaPct: 30 });
  // 500 Mbps por sentido = 1 Gbps de suma (Cisco publica la suma); 30 % sale en local.
  assert.strictEqual(d.sitio, 1000);
  assert.strictEqual(d.overlay, 700);
  assert.strictEqual(d.diaMbps, 300);
  assert.strictEqual(d.overlayNeed, 910);
  assert.strictEqual(d.diaNeed, 390);
  // La barra de distribución suma lo mismo que la demanda.
  const t = d.distribucion;
  assert.strictEqual(t.overlay + t.dia + t.sobrecarga, d.total);
});

test('en un agregado solo llega el overlay: la salida local se queda en cada sede', () => {
  const d = M.demanda({ ...base, modo: 'agg', bwMbps: 100, sedes: 10, concPct: 50, diaPct: 40 });
  assert.strictEqual(d.diaNeed, 0);
  assert.strictEqual(d.overlay, 600); // 100 × 10 × 50 % × 60 % × 2 sentidos
  assert.strictEqual(d.overlayNeed, 780);
  // Menos de una sede no resta: el enlace compartido con sedes=-5 dimensionaba en negativo.
  assert.ok(M.demanda({ ...base, modo: 'agg', sedes: -5 }).overlayNeed > 0);
});

test('duplicar un flujo lo duplica entero, y el FEC es un supuesto declarado', () => {
  const d = M.demanda({ ...base, headPct: 0, dupPct: 100, fecPct: 25 });
  assert.strictEqual(d.overlayNeed, 2500); // 1000 × 1,25 × 2
  assert.ok(d.pasos.some((p) => /FEC .*supuesto/.test(p.n)));
});

test('la utilización es la suma de las dos fracciones, cada una contra su cifra', () => {
  const ev = M.evaluar(MODELS, { ...base, diaPct: 30, seguridad: 'onbox' });
  const f = ev.filas.find((x) => x.m.id === 'Cisco Secure Router C8231-G2');
  // 910 / 4.000 de SD-WAN + 390 / 1.000 de Threat Protection.
  assert.strictEqual(f.co.v, 4000);
  assert.strictEqual(f.cd.v, 1000);
  assert.strictEqual(Math.round(f.u * 10000) / 10000, 0.6175);
  assert.ok(f.ok);
  // Sin inspección local la misma salida se mide con el reenvío (19 Gbps) y pesa casi nada.
  const sin = M.evaluar(MODELS, { ...base, diaPct: 30 }).filas.find((x) => x.m.id === f.m.id);
  assert.strictEqual(sin.cd.k, 'fwd');
  assert.ok(sin.u < 0.25);
});

test('inspeccionar en el router aparta a quien no publica Threat Protection, con su motivo', () => {
  const ev = M.evaluar(MODELS, { ...base, diaPct: 30, seguridad: 'onbox' });
  const ap = (n) => ev.apartados.find((x) => x.m.id === n);
  assert.match(ap('Cisco Secure Router C8130-G2').motivos[0], /no publica Threat Protection/);
  assert.match(ap('Catalyst 8500-12X').motivos[0], /no publica Threat Protection/);
  // Con la salida a un SSE en la nube, viaja cifrada: ocupa la capa IPsec.
  const sse = M.evaluar(MODELS, { ...base, diaPct: 30, seguridad: 'sse' });
  assert.strictEqual(sse.filas.find((x) => x.m.id === 'Cisco Secure Router C8130-G2').cd.k, 'ipsec');
});

test('el descifrado TLS en el router no se deriva de otra cifra: nadie la publica', () => {
  const ev = M.evaluar(MODELS, { ...base, diaPct: 30, seguridad: 'onbox', tls: true });
  assert.strictEqual(ev.candidatos.length, 0);
  assert.ok(ev.tlsEnRouter);
  assert.ok(ev.apartados.every((f) => f.motivos.some((x) => /descifrado TLS/.test(x))));
  // Con el firewall desacoplado, el TLS es cosa del firewall y el router vuelve a cumplir.
  assert.ok(M.evaluar(MODELS, { ...base, diaPct: 30, seguridad: 'desacoplada', tls: true }).candidatos.length > 0);
});

test('el más pequeño que cumple va primero, y un 800 Mbps por sentido no se va a un hub', () => {
  // El escenario de la batería de accesibilidad (?bw=800): 800 × 2 × 1,3 = 2.080 Mbps de SD-WAN.
  const ev = M.evaluar(MODELS, { ...base, bwMbps: 800 });
  assert.strictEqual(ev.demanda.overlayNeed, 2080);
  const primero = ev.candidatos[0];
  assert.strictEqual(primero.capEq, 4000);
  assert.match(primero.m.ser, /Secure Router \(G2\)|Catalyst 8000/);
  // El C8211-G2 hace 2 Gbps de SD-WAN: se aparta por utilización, no por otra cosa.
  assert.match(ev.apartados.find((x) => x.m.id === 'Cisco Secure Router C8211-G2').motivos[0], /utilización del 104 %/);
  for (let i = 1; i < ev.candidatos.length; i++) assert.ok(ev.candidatos[i].capEq >= ev.candidatos[i - 1].capEq);
});

test('la plataforma se elige antes que el caudal: un Meraki no se cuela en IOS XE', () => {
  const ev = M.evaluar(MODELS, { ...base, plataforma: 'xe' });
  assert.ok(ev.filas.every((f) => /Catalyst 8000|Secure Router \(G2\)/.test(f.m.ser)));
  const mx = M.evaluar(MODELS, { ...base, plataforma: 'meraki' });
  assert.ok(mx.filas.some((f) => f.m.id === 'Cisco Secure Router C8111-G2-MX'), 'el C8111-G2-MX es Meraki');
  assert.ok(mx.filas.every((f) => f.m.ser === 'Meraki MX'));
});

test('en SD-WAN, un modelo sin cifra propia cae a IPsec y lo dice; la de 1.400 B también avisa', () => {
  // Desde la relectura de la ficha del ISR 1000 todos los modelos publican su SD-WAN: la regla se
  // prueba con una copia sin ella.
  const sinSdwan = { ...id('ISR 1111-8P'), sdwan: null };
  const isr = M.evaluar([sinSdwan], { ...base, plataforma: 'isr', bwMbps: 50 }).filas[0];
  assert.ok(isr.co.cae);
  assert.strictEqual(isr.co.k, 'ipsec');
  assert.ok(isr.avisos.some((a) => /Sin cifra SD-WAN propia/.test(a)));
  const c82 = M.evaluar(MODELS, { ...base, perfil: 'fwd', bwMbps: 100 }).filas.find((x) => x.m.id === 'Catalyst 8200');
  assert.ok(c82.avisos.some((a) => /1\.400 B/.test(a)));
});

test('escala: una cifra publicada que no llega aparta; una que no se publica, avisa', () => {
  const ev = M.evaluar(MODELS, { ...base, bwMbps: 100, escala: { tuneles: 2000 } });
  const f = (n) => ev.filas.find((x) => x.m.id === n);
  assert.ok(f('Cisco Secure Router C8231-G2').motivos.some((x) => /1\.500 túneles frente a 2\.000/.test(x)));
  assert.ok(f('Cisco Secure Router C8235-G2').ok, 'el C8235-G2 publica 2.500');
  const mx = M.evaluar(MODELS, { ...base, plataforma: 'meraki', bwMbps: 100, escala: { tuneles: 50, dispositivos: 100 } });
  const mx95 = mx.filas.find((x) => x.m.id === 'Meraki MX95');
  assert.ok(mx95.ok && mx95.avisos.some((a) => /no publica túneles/.test(a)), 'el MX95 no publica túneles: avisa, no aparta');
  assert.ok(mx.filas.find((x) => x.m.id === 'Meraki MX67').motivos.some((x) => /50 dispositivos recomendados frente a 100/.test(x)));
});

test('requisitos: «no lo tiene» y «no consta» apartan distinto; la segunda fuente va al BOM', () => {
  const ev = M.evaluar(MODELS, { ...base, bwMbps: 100, requisitos: { dualPsu: true } });
  const f = (n) => ev.filas.find((x) => x.m.id === n);
  assert.ok(f('Cisco Secure Router C8231-G2').motivos.includes('fuente única: no admite una segunda'));
  assert.ok(f('Cisco Secure Router C8455-G2').motivos.includes('no consta cuántas fuentes trae de serie'));
  const c8211 = f('Cisco Secure Router C8211-G2');
  assert.ok(c8211.ok);
  assert.deepStrictEqual(c8211.piezas.map((p) => p.sku), ['PWR-CC1-30WAC=']);
  assert.ok(f('Cisco Secure Router C8355-G2').ok && !f('Cisco Secure Router C8355-G2').piezas.length, 'el C8355-G2 trae dos de serie');

  const cel = M.evaluar(MODELS, { ...base, bwMbps: 100, requisitos: { celular: true } });
  assert.ok(cel.filas.find((x) => x.m.id === 'Cisco Secure Router C8151-G2').piezas.some((p) => p.pim));
  assert.ok(cel.filas.find((x) => x.m.id === 'Cisco Secure Router C8140-G2').motivos.includes('sin celular integrado ni ranura PIM'));

  const poe = M.evaluar(MODELS, { ...base, bwMbps: 100, requisitos: { poe: true, poeW: 100 } });
  assert.ok(poe.filas.find((x) => x.m.id === 'Cisco Secure Router C8231-G2').motivos.includes('PoE de 30 W frente a 100 W pedidos'));
  assert.ok(poe.filas.find((x) => x.m.id === 'Cisco Secure Router C8235-G2').ok);
});

test('licencias de la G2 por la clase de la plataforma, y sin LIC-SEC en la 2XL', () => {
  const l = M.licencias(SR('C8231-G2'), { gestion: 'sdwan', nivel: 'A', seguridad: 'onbox', url: true, anios: 3 }, LICENCIAS_G2);
  assert.deepStrictEqual(l.filas.map((x) => x.sku), ['R-OS-M-E', 'LIC-CSWAN-M-A', 'LIC-SEC-M-T', 'LIC-SEC-M-C']);
  const aut = M.licencias(SR('C8355-G2'), { gestion: 'autonomo', nivel: 'A', anios: 1 }, LICENCIAS_G2);
  assert.deepStrictEqual(aut.filas.map((x) => x.sku), ['R-OS-L-E', 'LIC-ROS-L-A']);
  const xxl = M.licencias(SR('C8650-G2'), { gestion: 'sdwan', nivel: 'A', seguridad: 'onbox' }, LICENCIAS_G2);
  assert.ok(!xxl.filas.some((x) => /LIC-SEC/.test(x.sku)));
  assert.ok(xxl.avisos.some((a) => /2XL/.test(a)));
  const dna = M.licencias(id('Catalyst 8500-12X'), { nivel: 'E', anios: 5 }, LICENCIAS_G2);
  assert.strictEqual(dna.filas[0].sku, 'DNA-C-T<n>-E-5Y');
  assert.ok(dna.avisos.some((a) => /no admite DNA Essentials/.test(a)));
});

test('pool de NAT por bloques de puertos: aritmética, sin cifras del fabricante', () => {
  const r = M.poolCgnat({ usuarios: 10000, bloque: 512 });
  assert.deepStrictEqual([r.porIp, r.ips, r.prefijo], [126, 80, 25]);
  assert.strictEqual(M.poolCgnat({ usuarios: 0, bloque: 512 }), null);
});

test('la memoria técnica rotula los supuestos y cita las bases de medida', () => {
  const ev = M.evaluar(MODELS, { ...base, diaPct: 30, seguridad: 'onbox', fecPct: 25 });
  const md = M.memoria(ev, { fecha: '2026-10-20', perfil: 'sdwan', filas: [{ cat: 'Equipo', desc: ev.candidatos[0].m.id, sku: null, qty: 1 }] });
  assert.match(md, /### Supuestos de diseño \(no son cifras de Cisco\)/);
  assert.match(md, /FEC: \+25 %/);
  assert.match(md, /EMIX, DIA-NAT \+ NGFW \+ IPS \+ URLF \+ AMP/);
  assert.match(md, /## Lista de materiales/);
});

test('el resumen de apartados agrupa por motivo con un rótulo legible, sin cifras cortadas', () => {
  const ev = M.evaluar(MODELS, { ...base, bwMbps: 800, escala: { tuneles: 2000 } });
  const res = M.resumenApartados(ev.apartados);
  const util = res.find((g) => /utilización por encima del 100 %/.test(g.motivo));
  assert.ok(util && util.ids.includes('Cisco Secure Router C8211-G2'));
  assert.ok(res.every((g) => !/\bdel$/.test(g.motivo)), 'ningún rótulo acaba a medias');
  assert.strictEqual(res.reduce((t, g) => t + g.ids.length, 0), ev.apartados.length);
});
