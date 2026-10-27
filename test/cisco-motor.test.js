'use strict';
// MOTOR DEL DIMENSIONADOR CISCO (2026-10-20). Lo que la herramienta externa que trajo el dueño
// hacía mal y este motor no puede volver a hacer: sumar recargos inventados, contar la salida
// local a Internet en la etiqueta y no en la cuenta, duplicar un 35 % en vez del flujo entero,
// derivar la inspección TLS de otra cifra. Se prueba con el catálogo real, no con dobles: si una
// ficha cambia una cifra, esta prueba dice qué recomendación se movió.
const test = require('node:test');
const assert = require('node:assert');
const M = require('../public/js/cisco-motor.js');
const { MODELS, LICENCIAS_G2, LICENCIAS_DNA } = require('../server/seed/legacyData/cisco.js');

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

test('licencias de la G2 por la clase de la plataforma, y sin LIC-SEC donde la guía no los admite', () => {
  const skus = (l) => l.filas.map((x) => x.sku).filter(Boolean);
  const l = M.licencias(SR('C8231-G2'), { gestion: 'sdwan', nivel: 'A', seguridad: 'onbox', url: true, anios: 3 }, LICENCIAS_G2);
  assert.deepStrictEqual(skus(l), ['R-OS-M-E', 'LIC-CSWAN-M-A', 'LIC-SEC-M-T', 'LIC-SEC-M-C']);
  // En SD-WAN, la gestión del SD-WAN Manager se elige (nube de Cisco, Pro o propia): línea «elegir una».
  // Es opcional (puede ir con controladores propios): la pantalla no la marca «Requerida».
  assert.ok(l.filas.some((x) => !x.sku && x.opcional && /elegir una/.test(x.desc) && /LIC-CSWAN-HCLD/.test(x.nota)));
  const aut = M.licencias(SR('C8355-G2'), { gestion: 'autonomo', nivel: 'A', anios: 1 }, LICENCIAS_G2);
  assert.deepStrictEqual(skus(aut), ['R-OS-L-E', 'LIC-ROS-L-A']);
  // En autónomo, los add-ons de seguridad piden el SD-WAN Manager local (LIC-R-OP-SWM) y Routing Advantage.
  const autSeg = M.licencias(SR('C8355-G2'), { gestion: 'autonomo', nivel: 'E', seguridad: 'onbox', anios: 1 }, LICENCIAS_G2);
  assert.deepStrictEqual(skus(autSeg), ['R-OS-L-E', 'LIC-ROS-L-A', 'LIC-R-OP-SWM', 'LIC-SEC-L-T']);
  // Ninguna nota se queda con la plantilla sin sustituir («R-OS-{c}-A»).
  assert.ok(autSeg.filas.every((x) => !/\{c\}/.test(x.nota || '')), JSON.stringify(autSeg.filas.map((x) => x.nota)));
  // La guía nombra los que no admiten Threat, URL ni Malware: C8130/C8140-G2, 8500 y 8600.
  for (const n of ['C8130-G2', 'C8140-G2', 'C8550-G2', 'C8570-G2', 'C8650-G2']) {
    const x = M.licencias(SR(n), { gestion: 'sdwan', nivel: 'A', seguridad: 'onbox' }, LICENCIAS_G2);
    assert.ok(!skus(x).some((k) => /LIC-SEC/.test(k)), n);
    assert.ok(x.avisos.some((a) => /no admite las licencias de seguridad/.test(a)), n);
  }
  assert.ok(skus(M.licencias(SR('C8131-G2'), { gestion: 'sdwan', nivel: 'A', seguridad: 'onbox' }, LICENCIAS_G2)).includes('LIC-SEC-S-T'));
});

test('DNA: tier de ancho de banda por el tráfico, sin pasar del máximo de la plataforma', () => {
  const lic = (m, o) => M.licencias(m, { gestion: 'sdwan', nivel: 'A', anios: 3, ...o }, LICENCIAS_G2, LICENCIAS_DNA);
  const dna = (l) => l.filas.find((x) => /^DNA-C-/.test(x.sku || '')).sku;
  // En SD-WAN cuenta todo el tráfico WAN (los dos sentidos): 300 Mbps → T1 (400 agregados).
  assert.strictEqual(dna(lic(id('Catalyst 8200'), { trafico: { wan: 300, cifrado: 210 } })), 'DNA-C-T1-A-3Y');
  assert.strictEqual(dna(lic(id('Catalyst 8300-1N1S-4T2X'), { trafico: { wan: 5000, cifrado: 3500 } })), 'DNA-C-T3-A-3Y');
  // El 8200 llega como mucho a T2 (la guía: «Tier 2 provides the max platform throughput»).
  const alto = lic(id('Catalyst 8200'), { trafico: { wan: 3000, cifrado: 0 } });
  assert.strictEqual(dna(alto), 'DNA-C-T2-A-3Y');
  assert.ok(alto.avisos.some((a) => /el más alto de esta plataforma/.test(a)));
  // T4 y T5 solo existen en el 20X6C.
  assert.strictEqual(dna(lic(id('Catalyst 8500-20X6C'), { trafico: { wan: 40000, cifrado: 0 } })), 'DNA-C-T4-A-3Y');
  assert.strictEqual(dna(lic(id('Catalyst 8500-12X4QC'), { trafico: { wan: 40000, cifrado: 0 } })), 'DNA-C-T3-A-3Y');
  // Fuera de SD-WAN cuenta solo el cifrado; sin cifrado, el tier más bajo.
  assert.strictEqual(dna(lic(id('Catalyst 8200'), { gestion: 'autonomo', trafico: { wan: 900, cifrado: 0 } })), 'DNA-C-T0-A-3Y');
  assert.strictEqual(dna(lic(id('Catalyst 8200'), { gestion: 'autonomo', trafico: { wan: 900, cifrado: 300 } })), 'DNA-C-T1-A-3Y');
  // El margen de crecimiento que cruza de tier se avisa.
  assert.ok(lic(id('Catalyst 8200'), { trafico: { wan: 380, cifrado: 0, conMargen: 494 } }).avisos.some((a) => /haría falta el T2/.test(a)));
});

test('DNA: Premier discontinuado, Advantage obligatorio en 8500 y ASR, plazos, VPN y voz', () => {
  const lic = (m, o) => M.licencias(m, { gestion: 'sdwan', anios: 3, trafico: { wan: 300, cifrado: 0 }, ...o }, LICENCIAS_G2, LICENCIAS_DNA);
  const dna = (l) => l.filas.find((x) => /^DNA-C-/.test(x.sku || '')).sku;
  const p = lic(id('Catalyst 8200'), { nivel: 'P' });
  assert.strictEqual(dna(p), 'DNA-C-T1-A-3Y');
  assert.ok(p.avisos.some((a) => /Premier está discontinuado/.test(a)));
  for (const n of ['Catalyst 8500-12X', 'ASR 1002-HX']) {
    const e = lic(id(n), { nivel: 'E' });
    assert.match(dna(e), /-A-3Y$/, n);
    assert.ok(e.avisos.some((a) => /solo admite DNA Advantage/.test(a)), n);
  }
  // Los plazos de DNA son 3, 5 y 7 años: 1 año no existe.
  const uno = lic(id('Catalyst 8200'), { nivel: 'A', anios: 1 });
  assert.strictEqual(dna(uno), 'DNA-C-T1-A-3Y');
  assert.ok(uno.avisos.some((a) => /3, 5 o 7 años/.test(a)));
  assert.strictEqual(dna(lic(id('Catalyst 8200'), { nivel: 'A', anios: 7 })), 'DNA-C-T1-A-7Y');
  // Essentials: 10 VPN de usuario. Con más, Advantage.
  assert.strictEqual(dna(lic(id('Catalyst 8200'), { nivel: 'E', vpns: 10 })), 'DNA-C-T1-E-3Y');
  const seg = lic(id('Catalyst 8200'), { nivel: 'E', vpns: 12 });
  assert.strictEqual(dna(seg), 'DNA-C-T1-A-3Y');
  assert.ok(seg.avisos.some((a) => /10 VPN de usuario/.test(a)));
  // Los módulos de voz piden Advantage (guía de pedido, tabla 9): con Essentials, se avisa.
  const { MODULOS_C8K } = require('../server/seed/legacyData/cisco.js');
  const fxs = MODULOS_C8K.find((x) => x.sku === 'NIM-4FXSP');
  assert.ok(lic(id('Catalyst 8300-1N1S-6T'), { nivel: 'E', modulos: [fxs] }).avisos.some((a) => /módulos de voz/.test(a)));
  assert.ok(!lic(id('Catalyst 8300-1N1S-6T'), { nivel: 'A', modulos: [fxs] }).avisos.some((a) => /módulos de voz/.test(a)));
});

test('cifrado: HSEC incluida en los Catalyst 8200/8300 y en el ISR por encima de VPERF', () => {
  const lic = (m, o) => M.licencias(m, { gestion: 'sdwan', nivel: 'A', anios: 3, ...o }, LICENCIAS_G2, LICENCIAS_DNA);
  const c = lic(id('Catalyst 8300-1N1S-6T'), { trafico: { wan: 300, cifrado: 200 } });
  const h = c.filas.find((x) => x.sku === 'C8000-HSEC');
  assert.ok(h && h.incluida, 'la HSEC va incluida con la suscripción');
  const c85 = lic(id('Catalyst 8500-12X'), { trafico: { wan: 300, cifrado: 200 } });
  assert.ok(!c85.filas.some((x) => /HSEC/.test(x.sku || '')), 'el 8500 no la lleva por esta guía');
  // Y no se calla: dice que para él las fuentes no la nombran, en vez de darla por resuelta.
  assert.ok(c85.avisos.some((x) => /HSEC: .*no la nombran/.test(x)));
  // ISR: SEC 50 Mbps, VPERF 250 (8P) o 150 (4P), HSEC sin límite.
  assert.ok(lic(id('ISR 1111-8P'), { trafico: { wan: 400, cifrado: 300 } }).filas.some((x) => x.sku === 'FL-1100-8P-HSEC'));
  assert.ok(lic(id('ISR 1116-4P'), { trafico: { wan: 400, cifrado: 200 } }).filas.some((x) => x.sku === 'FL-1100-4P-HSEC'));
  const bajo = lic(id('ISR 1111-8P'), { trafico: { wan: 300, cifrado: 200 } });
  assert.ok(!bajo.filas.some((x) => /HSEC/.test(x.sku || '')) && bajo.avisos.some((a) => /basta la licencia de rendimiento VPERF/.test(a)));
  // En autónomo, el Catalyst ofrece Routing Essentials como alternativa.
  assert.ok(lic(id('Catalyst 8200'), { gestion: 'autonomo', trafico: { wan: 300, cifrado: 0 } }).avisos.some((a) => /ROUT-P-C8200-E-7Y/.test(a)));
});

test('el tráfico que cuenta para el tier: todo el WAN en SD-WAN; el cifrado fuera de él', () => {
  const d = M.demanda({ ...base, diaPct: 30, bwMbps: 500 });
  const sd = M.traficoLicencia(d, { perfil: 'sdwan', seguridad: 'ninguna', headPct: 30 });
  assert.deepStrictEqual([sd.wan, sd.cifrado], [1000, 700]);
  assert.strictEqual(M.traficoLicencia(d, { perfil: 'sdwan', seguridad: 'sse', headPct: 30 }).cifrado, 1000);
  assert.strictEqual(M.traficoLicencia(d, { perfil: 'fwd', seguridad: 'ninguna', headPct: 30 }).cifrado, 0);
});

test('Meraki: la licencia por suscripción lleva la referencia de su clase', () => {
  // «Subscription - MX Licensing»: LIC-MX-S/M/L/XL y LIC-CSR-S/L/XL, con -E o -A.
  assert.strictEqual(M.licencias(id('Meraki MX67C'), { nivel: 'E', anios: 3 }, LICENCIAS_G2).filas[0].sku, 'LIC-MX-S-E');
  assert.strictEqual(M.licencias(id('Meraki MX250'), { nivel: 'A', anios: 1 }, LICENCIAS_G2).filas[0].sku, 'LIC-MX-XL-A');
  assert.strictEqual(M.licencias(SR('C8455-G2-MX'), { nivel: 'A', anios: 5 }, LICENCIAS_G2).filas[0].sku, 'LIC-CSR-XL-A');
  // Cada Meraki del catálogo tiene su clase: ninguno se queda sin referencia.
  for (const m of MODELS.filter((x) => x.lic === 'meraki')) assert.match(m.licClase || '', /^LIC-(MX|CSR)-(S|M|L|XL)$/, m.id);
});

test('Meraki: SD-WAN+ cita la ampliación de su grupo solo donde la página de licencias lo nombra', () => {
  // La página da LIC-MX-SDW-<grupo>-<1|3|5>Y por grupo de plataformas; el MX95 va en «L».
  const l = M.licencias(id('Meraki MX95'), { nivel: 'P', anios: 3 }, LICENCIAS_G2);
  assert.strictEqual(l.filas[0].sku, 'LIC-MX-L-A');
  assert.ok(l.avisos.some((a) => /LIC-MX-SDW-L-3Y/.test(a)));
  // Un término que la página no ofrece, o un modelo que no nombra (los G2-MX), no inventa la referencia.
  const dos = M.licencias(id('Meraki MX95'), { nivel: 'P', anios: 2 }, LICENCIAS_G2);
  assert.ok(!dos.avisos.some((a) => /LIC-MX-SDW/.test(a)));
  const g2mx = M.licencias(SR('C8355-G2-MX'), { nivel: 'P', anios: 3 }, LICENCIAS_G2);
  assert.ok(g2mx.avisos.some((a) => /confirmar en CCW/.test(a)));
  assert.ok(!M.licencias(id('Meraki MX95'), { nivel: 'A', anios: 3 }, LICENCIAS_G2).avisos.some((a) => /SD-WAN\+/.test(a)));
});

test('módulos de los Catalyst 8300/8200: los de su guía de pedido, con los límites de la tabla 5', () => {
  const { MODULOS_C8K } = require('../server/seed/legacyData/cisco.js');
  const sku = (s) => MODULOS_C8K.find((x) => x.sku === s);
  assert.strictEqual(new Set(MODULOS_C8K.map((x) => x.sku)).size, MODULOS_C8K.length, 'un módulo repetido');
  // Las T1/E1 están en las columnas de datos y de voz: van una vez, con las dos.
  assert.strictEqual(sku('NIM-1MFT-T1/E1').d, 'NIM de datos y de voz');
  // Los SM de doble ancho solo en el 2N2S; los marcados con asterisco, solo en el 8300.
  assert.deepStrictEqual([sku('C-SM-40P8M2X').ranuras, sku('SM-X-72FXS').familia], [2, 'Catalyst 8300-2N2S']);
  assert.strictEqual(sku('C-NIM-1X').familia, 'Catalyst 8300');
  assert.deepStrictEqual(MODULOS_C8K.filter((x) => x.en === 'pim').map((x) => x.sku), ['P-LTEA-LA', 'P-LTEA-EA', 'P-LTEAP18-GL']);
});

test('ópticas: los Meraki llevan las MA-SFP de su guía, nunca las de Catalyst, y cada familia las suyas', () => {
  const { OPTICS } = require('../server/seed/legacyData/cisco.js');
  const skus = (m) => m.optics.flatMap((k) => (OPTICS[k] || []).map((o) => o.sku));
  for (const m of MODELS.filter((x) => x.ser === 'Meraki MX')) {
    assert.ok(m.optics.every((k) => OPTICS[k]), `${m.id}: categoría de óptica sin lista`);
    assert.ok(!skus(m).some((s) => /^(GLC-|SFP-10G-|QSFP-)/.test(s)), `${m.id}: ópticas de Catalyst en un Meraki`);
  }
  // La guía de accesorios SFP no da la SX ni la ZR a los G2-MX.
  for (const n of ['C8355-G2-MX', 'C8455-G2-MX']) {
    const l = skus(SR(n));
    assert.ok(!l.includes('MA-SFP-1GB-SX') && !l.includes('MA-SFP-10GB-ZR') && l.includes('MA-SFP-10GB-LR'), n);
  }
  assert.ok(skus(id('Meraki MX450')).includes('MA-SFP-10GB-ZR'));
  assert.ok(skus(SR('C8455-G2-MX')).includes('SFP-25G-SR-S') && !skus(SR('C8355-G2-MX')).includes('SFP-25G-SR-S'));
  assert.deepStrictEqual(id('Meraki MX75').optics, ['mxsfp1g']);
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

// TÚNELES POR TOPOLOGÍA (propuesta 2.1, 2026-10-21). El fallo que evita: un hub o una sucursal
// en malla que pasa por caudal y se queda corta en túneles porque la cifra se escribía a ojo.
test('túneles por topología: aritmética de sedes, hubs y transportes, con el rol del modo', () => {
  const T = (t, modo = 'link') => M.tunelesTopologia(t, modo);
  // Sucursal en malla de 200 sedes con dos transportes y un hub: 199 × 4 + 1 × 4.
  assert.strictEqual(T({ topologia: 'malla', sedes: 200, hubs: 1, colores: 2 }).total, 800);
  // En hub y radios la sucursal solo ve a los hubs.
  assert.strictEqual(T({ topologia: 'hub', sedes: 200, hubs: 2, colores: 2 }).total, 8);
  // El hub cuenta igual en las dos: todas las sedes más los otros hubs.
  for (const topologia of ['hub', 'malla']) {
    const h = T({ topologia, sedes: 200, hubs: 2, colores: 2 }, 'hub');
    assert.deepStrictEqual([h.rol, h.total], ['hub', 804]);
    assert.strictEqual(T({ topologia, sedes: 200, hubs: 2, colores: 2 }, 'agg').total, 804);
  }
  // Cada transporte solo con el suyo: los pares son los colores comunes, no el producto.
  assert.strictEqual(T({ topologia: 'malla', sedes: 11, hubs: 0, colores: 3, ven: false }).total, 30);
  // El hub con otro número de transportes que la sede.
  assert.strictEqual(T({ topologia: 'hub', sedes: 10, hubs: 1, colores: 2, coloresHub: 3 }, 'hub').total, 60);
  // Vacío es un hub; 0 vale en una malla sin hubs; el equipo que ES el hub cuenta al menos uno.
  assert.strictEqual(T({ topologia: 'malla', sedes: 10, hubs: '', colores: 1 }).total, 10);
  assert.strictEqual(T({ topologia: 'malla', sedes: 10, hubs: 0, colores: 1 }).total, 9);
  assert.strictEqual(T({ topologia: 'hub', sedes: 10, hubs: 0, colores: 1 }, 'hub').total, 10);
  // Sin topología o sin sedes no hay cálculo: no se inventa una red.
  assert.strictEqual(T({ topologia: '', sedes: 10 }), null);
  assert.strictEqual(T({ topologia: 'malla', sedes: '' }), null);
  // La cuenta va escrita entera: lo que suman los pasos es el total.
  const r = T({ topologia: 'malla', sedes: 200, hubs: 1, colores: 2 });
  assert.strictEqual(r.pasos.reduce((a, x) => a + x.v, 0), r.total);
  assert.match(r.pasos[0].n, /199 sedes más × 4 pares de transportes/);
});

test('túneles por topología en la evaluación: apartan con su cifra y la escrita a mano manda', () => {
  const topologia = { topologia: 'malla', sedes: 200, hubs: 1, colores: 2 };
  const ev = M.evaluar(MODELS, { ...base, topologia });
  assert.strictEqual(ev.topo.total, 800);
  const f8130 = ev.apartados.find((f) => f.m.id === 'Cisco Secure Router C8130-G2');
  assert.ok(f8130 && f8130.motivos.includes('250 túneles frente a 800'), JSON.stringify(f8130 && f8130.motivos));
  // El C8231-G2 publica 1.500 desde IOS XE 26.2.1 y 700 antes: cumple, pero lo avisa.
  const f8231 = ev.filas.find((f) => f.m.id === 'Cisco Secure Router C8231-G2');
  assert.ok(f8231.ok && f8231.avisos.some((a) => /700 antes de IOS XE 26\.2\.1/.test(a)));
  // La cifra escrita pisa la calculada.
  const manual = M.evaluar(MODELS, { ...base, topologia, escala: { tuneles: 100 } });
  assert.ok(manual.tunelesManual);
  assert.ok(!manual.apartados.some((f) => f.m.id === 'Cisco Secure Router C8130-G2' && f.motivos.some((x) => /túneles/.test(x))));
  // Sin topología, nada cambia respecto a antes.
  const sin = M.evaluar(MODELS, base);
  assert.strictEqual(sin.topo, null);
  // Y la memoria técnica la rotula como supuesto, con la cuenta.
  const md = M.memoria(ev, { perfil: 'sdwan' });
  assert.match(md, /Túneles por topología \(malla completa, el equipo como sucursal\): 199 sedes más × 4 pares de transportes = 796; 1 hub × 4 pares de transportes = 4; total \*\*800\*\*/);
});

// ENLACES WAN A PUERTOS REALES (propuesta 1.1, 2026-10-21). Lo que evita: proponer un equipo con
// el caudal justo y sin el puerto para un enlace, o cotizar ópticas a ojo.
const { MODULOS_G2, MODULOS_C8K, OPTICS, SECURE_ACCESS, SECURE_FIREWALL, CELULAR, CONTROLADORES_SDWAN } = require('../server/seed/legacyData/cisco.js');
const CAT = { optics: OPTICS, modulosG2: MODULOS_G2, modulosC8k: MODULOS_C8K };
const E = (...xs) => xs.map((x) => (typeof x === 'string' ? { tipo: 'internet', rol: 'principal', entrega: x } : x));
const asig = (m, ...xs) => M.asignarEnlaces(typeof m === 'string' ? id(m) : m, E(...xs), CAT);

test('puertos: todos los equipos los tienen contados (o son modulares) y con la forma de ficha.js', () => {
  const MEDIOS = new Set(['RJ45', 'SFP', 'SFP+', 'SFP28', 'QSFP+', 'QSFP28']);
  for (const m of MODELS) {
    if (m.puertos === null) { assert.match(m.id, /ASR 1006-X/, `${m.id}: modular sin serlo`); continue; }
    assert.ok(Array.isArray(m.puertos) && m.puertos.length, `${m.id}: sin puertos contados`);
    for (const g of m.puertos) {
      assert.ok(Number.isInteger(g.n) && g.n > 0 && g.vel > 0, `${m.id}: grupo sin cantidad o velocidad`);
      assert.ok(g.medios.length && g.medios.every((x) => MEDIOS.has(x)), `${m.id}: medio desconocido ${g.medios}`);
      assert.ok(['WAN', 'LAN/WAN', 'LAN'].includes(g.uso), `${m.id}: uso ${g.uso}`);
      if (g.velMin != null) assert.ok(g.velMin < g.vel, `${m.id}: velMin ${g.velMin} ≥ vel ${g.vel}`);
    }
    assert.ok(m.puertos.some((g) => g.uso === 'WAN'), `${m.id}: ningún puerto WAN`);
  }
});

test('reparto: el más exigente primero, WAN antes que flex, y lo que no cabe aparta con su motivo', () => {
  // C8211-G2: dos combo WAN. Fibra y cobre de 1G caben; una fibra de 10G, no.
  const a = asig('Cisco Secure Router C8211-G2', 'fibra-1g', 'cobre-1g');
  assert.deepStrictEqual(a.asignados.map((x) => [x.enlace, x.medio, x.puerto.uso]), [[1, 'SFP', 'WAN'], [2, 'RJ45', 'WAN']]);
  assert.deepStrictEqual(asig('Cisco Secure Router C8211-G2', 'fibra-10g').sinAsignar.map((x) => x.motivo), ['sin puerto para el enlace 1 (fibra de 10G)']);
  // Un puerto de solo LAN nunca recibe un enlace: el C8355-G2 tiene dos SFP+ LAN que no cuentan.
  const c8355 = asig('Cisco Secure Router C8355-G2', 'fibra-10g', 'fibra-10g', 'fibra-10g');
  assert.deepStrictEqual(c8355.sinAsignar.map((x) => x.enlace), [3]);
  // El flex (LAN/WAN) se usa cuando los WAN se acaban.
  const c8211 = asig('Cisco Secure Router C8211-G2', 'cobre-1g', 'cobre-1g', 'cobre-1g');
  assert.deepStrictEqual(c8211.asignados.map((x) => x.puerto.uso), ['WAN', 'WAN', 'LAN/WAN']);
  // Un SFP+ que la ficha da «no reducible a 1G» (ASR) no recibe una fibra de 1G.
  const asr = asig('ASR 1001-X', ...Array(7).fill('fibra-1g'));
  assert.deepStrictEqual(asr.sinAsignar.map((x) => x.enlace), [7]);
});

test('reparto: módulo NIM de la guía cuando los fijos no bastan, y transceptor de cobre en una jaula', () => {
  const e = asig('Cisco Secure Router C8231-E-G2', 'fibra-10g', 'fibra-10g', 'fibra-10g');
  assert.deepStrictEqual(e.modulos.map((x) => [x.sku, x.enlaces]), [['C-NIM-WAN-2X', [3]]]);
  assert.strictEqual(e.asignados[2].puerto.modulo, 'C-NIM-WAN-2X');
  // En el 8300-6T, la fibra de 10G va al C-NIM-1X (WAN), no a un switch con L3 opcional.
  assert.deepStrictEqual(asig('Catalyst 8300-1N1S-6T', 'fibra-10g').modulos.map((x) => x.sku), ['C-NIM-1X']);
  // El C-NIM-1X es solo del 8300: el 8200 se queda sin puerto de 10G... salvo el switch C-NIM-4X.
  assert.deepStrictEqual(asig('Catalyst 8200', 'fibra-10g').modulos.map((x) => x.sku), ['C-NIM-4X']);
  // Sin ranura NIM no hay módulo: el C8231-G2 con tres fibras de 10G aparta el tercero.
  assert.deepStrictEqual(asig('Cisco Secure Router C8231-G2', 'fibra-10g', 'fibra-10g', 'fibra-10g').sinAsignar.map((x) => x.enlace), [3]);
  // Tercer cobre en el Catalyst 8200 (2 RJ-45 + 2 SFP): a una jaula SFP, con GLC-T/GLC-TE.
  const c8200 = asig('Catalyst 8200', 'cobre-1g', 'cobre-1g', 'cobre-1g');
  assert.deepStrictEqual(c8200.asignados.map((x) => x.via), ['nativo', 'nativo', 'transceptor']);
  assert.deepStrictEqual(c8200.asignados[2].transceptores.map((o) => o.sku), ['GLC-T', 'GLC-TE']);
  // Si el catálogo no trae transceptor de cobre para la familia, lo dice así.
  assert.match(asig('Catalyst 8500-12X', 'cobre-1g').sinAsignar[0].motivo, /jaulas de 1G, pero el catálogo no trae su transceptor de cobre/);
});

test('reparto: el límite de enlaces WAN de Meraki, el chasis modular y el celular', () => {
  const mx = asig('Meraki MX67', 'cobre-1g', 'cobre-1g', 'cobre-1g');
  assert.deepStrictEqual(mx.asignados.map((x) => x.puerto.uso), ['WAN', 'LAN/WAN']);
  assert.deepStrictEqual(mx.sinAsignar.map((x) => x.motivo), ['admite 2 enlaces WAN a la vez']);
  const asr = asig('ASR 1006-X', 'fibra-10g');
  assert.ok(asr.modular && !asr.sinAsignar.length);
  // Un celular no ocupa puerto: pide módem, que es el requisito de celular de siempre.
  const cel = { tipo: 'celular', rol: 'respaldo' };
  assert.strictEqual(asig('Cisco Secure Router C8211-G2', cel).asignados.length, 0);
  assert.strictEqual(M.requisitosConEnlaces({ enlaces: E('cobre-1g', cel) }).celular, true);
  assert.ok(!M.requisitosConEnlaces({ enlaces: E('cobre-1g') }).celular);
});

test('piezas del reparto: módulo propuesto, óptica «elegir una» de su familia y transceptor', () => {
  const pz = M.piezasEnlaces(asig('Cisco Secure Router C8231-E-G2', 'fibra-10g', 'fibra-10g', 'fibra-10g', 'cobre-1g'));
  assert.ok(pz.some((x) => x.sku === 'C-NIM-WAN-2X' && /para el enlace 3/.test(x.desc)));
  const opt = pz.filter((x) => /^Óptica de 10G/.test(x.desc));
  assert.strictEqual(opt.length, 3);
  assert.ok(opt.every((x) => x.sku === null && /SFP-10G-SR, SFP-10G-LR/.test(x.nota)));
  // Meraki lleva sus MA-SFP, nunca las de Catalyst.
  const mxo = M.piezasEnlaces(asig('Meraki MX85', 'fibra-1g'));
  assert.match(mxo[0].nota, /MA-SFP-1GB-SX/);
  assert.doesNotMatch(mxo[0].nota, /GLC-/);
  // Un puerto de módulo lleva las ópticas Cisco de su velocidad, con el aviso de confirmarlas: el
  // 8200L solo lista ópticas de 1G (las de sus jaulas fijas) y el C-NIM-4X es de 1/10G.
  const mod = M.piezasEnlaces(asig('Catalyst 8200L', 'fibra-10g'));
  const o10 = mod.find((x) => /^Óptica de 10G/.test(x.desc));
  assert.ok(o10 && /SFP-10G-SR/.test(o10.nota) && /Va en el C-NIM-4X: confirmar su compatibilidad/.test(o10.nota), JSON.stringify(mod));
  // Una velocidad sin óptica en el catálogo de la familia: consultar, sin referencia inventada.
  const c8455 = M.piezasEnlaces(asig('Cisco Secure Router C8455-G2', 'fibra-25g'));
  assert.ok(c8455[0].sku === null && /no trae ópticas de esta velocidad/.test(c8455[0].nota));
});

// ÓPTICA POR ALCANCE (2026-10-21). El alcance de cada óptica es el de la tabla de cableado de su
// ficha; con la fibra y la distancia del tramo, el motor elige la primera que llega.
const elegida = (cat, fibra, km) => { const r = M.elegirOptica(OPTICS[cat], fibra, km); return r.elegida ? r.elegida.sku : r; };

test('óptica por alcance: la primera que llega en esa fibra, y la que exige algo solo si no hay otra', () => {
  // 1G: SX en multimodo mientras llega (OM1 275 m); más allá, la LX/LH con su cable de acondicionamiento.
  assert.strictEqual(elegida('sfp1g', 'om2', 0.3), 'GLC-SX-MMD');
  const lx = M.elegirOptica(OPTICS.sfp1g, 'om1', 0.5);
  assert.strictEqual(lx.elegida.sku, 'GLC-LH-SMD');
  assert.ok(lx.tramo.segunda && /acondicionamiento de modo/.test(lx.tramo.nota));
  assert.strictEqual(elegida('sfp1g', 'smf', 5), 'GLC-LH-SMD');
  assert.strictEqual(elegida('sfp1g', 'smf', 40), 'GLC-ZX-SMD');
  // 10G en monomodo: LR hasta 10 km, ER hasta 40 (de 30 a 40 es enlace de ingeniería), y la ZR con
  // el atenuador que su ficha pide por tramo.
  assert.strictEqual(elegida('sfp10g', 'smf', 3), 'SFP-10G-LR');
  const er = M.elegirOptica(OPTICS.sfp10g, 'smf', 35);
  assert.ok(er.elegida.sku === 'SFP-10G-ER' && /enlace de ingeniería/.test(er.tramo.nota));
  const zr = M.elegirOptica(OPTICS.sfp10g, 'smf', 42);
  assert.ok(zr.elegida.sku === 'SFP-10G-ZR' && /atenuador de 5 dB/.test(zr.tramo.nota));
  assert.ok(!/atenuador/.test(M.elegirOptica(OPTICS.sfp10g, 'smf', 60).tramo.nota));
  // 100G: la ER4-Lite llega a 30 km sola y a 40 con el FEC del equipo.
  assert.ok(!M.elegirOptica(OPTICS.qsfp100g, 'smf', 25).tramo.segunda);
  assert.ok(M.elegirOptica(OPTICS.qsfp100g, 'smf', 35).tramo.segunda);
});

test('óptica por alcance: lo que falta se dice y lo que no llega no se inventa', () => {
  // Sin distancia, la lista se estrecha a las que van en esa fibra; sin fibra, no se estrecha.
  const sinKm = M.elegirOptica(OPTICS.sfp10g, 'om3', null);
  assert.deepStrictEqual(sinKm.lista.map((o) => o.sku), ['SFP-10G-SR']);
  assert.strictEqual(sinKm.falta, 'la distancia del tramo');
  assert.strictEqual(M.elegirOptica(OPTICS.sfp10g, null, 5).falta, 'el tipo de fibra');
  // Nada llega: la de más alcance en esa fibra, para decirlo.
  assert.deepStrictEqual(M.elegirOptica(OPTICS.sfp10g, 'smf', 90).noLlega, { max: { sku: 'SFP-10G-ZR', m: 80000 } });
  assert.deepStrictEqual(M.elegirOptica(OPTICS.sfp10g, 'om1', 0.05).noLlega, { max: { sku: 'SFP-10G-SR-S', m: 33 } });
  // 40G en OM1: ninguna óptica del catálogo va en esa fibra.
  assert.deepStrictEqual(M.elegirOptica(OPTICS.qsfp40g, 'om1', null).noLlega, { max: null });
  // Meraki: los G2-MX no llevan la MA-SFP-10GB-ZR; la LRM va en multimodo solo en ellos.
  assert.strictEqual(elegida('mxsfp10g', 'smf', 60), 'MA-SFP-10GB-ZR');
  assert.strictEqual(M.elegirOptica(OPTICS.mxg2sfp10g, 'smf', 60).noLlega.max.sku, 'MA-SFP-10GB-ER');
  assert.strictEqual(elegida('mxg2sfp10g', 'om1', 0.1), 'MA-SFP-10GB-LRM');
  assert.ok(M.elegirOptica(OPTICS.mxsfp10g, 'om1', 0.1).noLlega);
  // En OM3 manda la SR aunque la LRM también llegue: es la primera de la lista.
  assert.strictEqual(elegida('mxg2sfp10g', 'om3', 0.2), 'MA-SFP-10GB-SR');
  // 25G del C8455-G2-MX: sin FEC la CSR llega a 30 m en OM3; más allá, lo que pide RS-FEC.
  assert.strictEqual(elegida('mxsfp25g', 'om3', 0.025), 'SFP-10/25G-CSR-S');
  assert.ok(/RS-FEC/.test(M.elegirOptica(OPTICS.mxsfp25g, 'om4', 0.3).tramo.nota));
});

test('óptica por alcance en el reparto: la pieza lleva su referencia, o «consultar» con su motivo', () => {
  const f = (entrega, fibra, km) => ({ tipo: 'internet', rol: 'principal', entrega, fibra, km });
  const r = M.asignarEnlaces(id('Cisco Secure Router C8231-E-G2'), [f('fibra-10g', 'smf', '12'), f('fibra-10g', 'smf', '90'), f('fibra-10g', 'om3')], CAT);
  const pz = M.piezasEnlaces(r).filter((x) => /^Óptica de 10G/.test(x.desc));
  assert.strictEqual(pz[0].sku, 'SFP-10G-ER-I');
  assert.match(pz[0].desc, /para el enlace 1: tramo de 12 km en monomodo G\.652/);
  // La nota da el alcance de la óptica (40 km), no el del tramo que se usa (hasta 30 km).
  assert.match(pz[0].nota, /el tramo es de 12 km y llega a 40 km en monomodo G\.652/);
  assert.ok(pz[1].sku === null && /— consultar/.test(pz[1].desc) && /llega a 90 km en monomodo G\.652 \(la de más alcance, SFP-10G-ZR: 80 km\)/.test(pz[1].nota), pz[1].nota);
  assert.ok(pz[2].sku === 'SFP-10G-SR-S' && /falta la distancia del tramo/.test(pz[2].nota), JSON.stringify(pz[2]));
  // En la evaluación, lo que no llega avisa sin apartar (el catálogo no trae todas las ópticas de
  // Cisco) y la memoria técnica cita el tramo y la óptica.
  const ev = M.evaluar(MODELS, { ...base, bwMbps: 100, plataforma: 'xe', enlaces: [f('fibra-10g', 'smf', '90')], catalogo: CAT });
  const c = ev.candidatos[0];
  assert.ok(c && c.avisos.some((x) => /^Enlace 1: ninguna óptica de 10G del catálogo/.test(x)), JSON.stringify(c && c.avisos));
  const ok = M.evaluar(MODELS, { ...base, bwMbps: 100, enlaces: [f('fibra-10g', 'smf', '12')], catalogo: CAT });
  assert.match(M.memoria(ok, { perfil: 'sdwan' }), /Enlace 1: Internet, principal, fibra de 10G, 12 km en monomodo G\.652 → .*óptica SFP-10G-ER-I/);
  // La fibra solo cuenta en una entrega de fibra; el tramo, en fibra y en cobre (no en DSL).
  assert.deepStrictEqual(M.enlacesValidos([{ entrega: 'cobre-1g', fibra: 'smf', km: 3 }, { entrega: 'dsl', km: 2 }]).map((x) => [x.fibra, x.km]), [[null, 3], [null, null]]);
});

// LO QUE EL REPARTO NO CUBRÍA (2026-10-21), cerrado con su documento.
test('cobre con tramo: 100 m en un RJ-45 o con un 1000BASE-T, 30 m con el SFP-10G-T-X', () => {
  const c = (entrega, km) => ({ tipo: 'internet', rol: 'principal', entrega, km });
  // 80 m en el RJ-45 de un Catalyst 8300: llega, con los 100 m de su guía de hardware.
  const ok = M.asignarEnlaces(id('Catalyst 8300-1N1S-6T'), [c('cobre-1g', '0.08')], CAT);
  assert.deepStrictEqual(ok.asignados[0].tramoCobre, { km: 0.08, llega: 100, supuesto: false });
  // 150 m: ningún puerto ni transceptor de cobre llega; el motivo es la distancia.
  const lejos = M.asignarEnlaces(id('Catalyst 8300-1N1S-6T'), [c('cobre-1g', '0.15')], CAT);
  assert.match(lejos.sinAsignar[0].motivo, /el cobre no llega a 150 m \(100 m en un RJ-45; 100 m con el SFP-1GE-T; 100 m con el SFP-GE-T\); hace falta fibra/);
  // 10G de cobre en el C8355-G2: el SFP-10G-T-X llega a 30 m; a 50 m, no.
  const t = M.asignarEnlaces(id('Cisco Secure Router C8355-G2'), [c('cobre-10g', '0.025')], CAT);
  assert.strictEqual(t.asignados[0].tramoCobre.llega, 30);
  assert.match(M.piezasEnlaces(t)[0].nota, /Tramo de 25 m; llega a 30 m/);
  assert.match(M.asignarEnlaces(id('Cisco Secure Router C8355-G2'), [c('cobre-10g', '0.05')], CAT).sinAsignar[0].motivo, /el cobre no llega a 50 m \(30 m con el SFP-10G-T-X\)/);
  // Donde la guía de hardware no da los 100 m (ISR, Meraki), es la norma: se avisa.
  const ev = M.evaluar(MODELS, { ...base, bwMbps: 50, plataforma: 'isr', enlaces: [c('cobre-1g', '0.05')], catalogo: CAT });
  assert.ok(ev.candidatos[0].avisos.some((x) => /los 100 m del cobre en su RJ-45 son la norma IEEE 802\.3/.test(x)), JSON.stringify(ev.candidatos[0].avisos));
  // El resumen de apartados dice el porqué: el cobre, no la falta de puerto.
  const ev150 = M.evaluar(MODELS, { ...base, bwMbps: 100, enlaces: [c('cobre-1g', '0.15')], catalogo: CAT });
  assert.ok(M.resumenApartados(ev150.apartados).some((g) => /no llegan con cobre a algún tramo: hace falta fibra/.test(g.motivo)));
  // Sin tramo declarado no se comprueba nada.
  assert.strictEqual(M.asignarEnlaces(id('Catalyst 8300-1N1S-6T'), [c('cobre-1g')], CAT).asignados[0].tramoCobre, null);
});

test('reparto: el DSL del ISR 1116-4P recibe un enlace DSL y nunca uno Ethernet', () => {
  const r = asig('ISR 1116-4P', 'cobre-1g', 'dsl');
  assert.deepStrictEqual(r.sinAsignar, []);
  assert.strictEqual(M.rotuloPuerto(r.asignados[1]), 'Puerto DSL WAN (ADSL2/VDSL2+, Annex B/J sobre RDSI)');
  assert.match(asig('ISR 1116-4P', 'cobre-1g', 'cobre-1g').sinAsignar[0].motivo, /sin puerto para el enlace 2/);
  assert.match(asig('ISR 1111-8P', 'dsl').sinAsignar[0].motivo, /sin puerto para el enlace 1 \(DSL/);
  // En un Catalyst 8300, el DSL por NIM ya no se puede pedir: EOL15805, último pedido el 1-ago-2026.
  assert.match(asig('Catalyst 8300-1N1S-6T', 'dsl').sinAsignar[0].motivo, /fuera de venta \(último pedido el 2026-08-01, boletín EOL15805\)/);
  assert.ok(MODULOS_C8K.find((x) => x.sku === 'NIM-VA-B').finVenta);
  // Un DSL entre los principales no declara velocidad: no se afirma que el caudal no cabe.
  assert.strictEqual(M.enlacesFrenteCaudal({ ...base, bwMbps: 5000, enlaces: E('dsl') }), null);
});

test('reparto: el módulo que lleva más enlaces, y sin ranura NIM, el portador en una ranura SM', () => {
  const diez = (n) => Array.from({ length: n }, () => 'fibra-10g');
  // Tres fibras de 10G en el 8300-1N1S-6T (sin SFP+ fijos): un C-NIM-4X las lleva en su única
  // ranura NIM; tres C-NIM-1X habrían pedido el portador.
  assert.deepStrictEqual(asig('Catalyst 8300-1N1S-6T', ...diez(3)).modulos.map((x) => x.sku), ['C-NIM-4X']);
  // Con cinco ya no basta la ranura NIM: el C-SM-NIM-ADPTR va en la SM y aloja el NIM del quinto.
  const r = asig('Catalyst 8300-1N1S-6T', ...diez(5));
  assert.deepStrictEqual(r.sinAsignar, []);
  assert.deepStrictEqual(r.modulos.map((x) => x.sku), ['C-NIM-4X', 'C-SM-NIM-ADPTR', 'C-NIM-1X']);
  assert.deepStrictEqual(r.modulos[1].enlaces, [5]);
  assert.strictEqual(r.modulos[2].enPortador, 'C-SM-NIM-ADPTR');
  const pz = M.piezasEnlaces(r);
  assert.ok(pz.some((x) => x.sku === 'C-SM-NIM-ADPTR' && /para el NIM del enlace 5$/.test(x.desc)), JSON.stringify(pz.map((x) => x.desc)));
  assert.ok(pz.some((x) => x.sku === 'C-NIM-1X' && /en el portador C-SM-NIM-ADPTR/.test(x.nota)));
  // El 8200 no tiene ranura SM: cuatro caben en su C-NIM-4X y el quinto no.
  assert.strictEqual(asig('Catalyst 8200', ...diez(5)).sinAsignar.length, 1);
  // G2: el C8375-E-G2 (2 SFP+ fijos, 1 NIM, 1 SM) usa el C-SM-NIM-ADPT de su guía.
  const g2 = asig('Cisco Secure Router C8375-E-G2', ...diez(7));
  assert.deepStrictEqual(g2.sinAsignar, []);
  assert.deepStrictEqual(g2.modulos.map((x) => x.sku), ['C-NIM-4X', 'C-SM-NIM-ADPT', 'C-NIM-WAN-2X']);
});

test('reparto: el 12X4QC solo admite las combinaciones de la tabla 5 de su ficha', () => {
  const c = (...xs) => M.motivoCombinacion(asig('Catalyst 8500-12X4QC', ...xs));
  // Con un 100G en la bahía 1 no queda nada más en las bahías 0 y 1: dos de 100G van solos.
  assert.match(c('fibra-100g', 'fibra-100g', 'fibra-10g'), /2×100G \+ 1×SFP\+ no está entre las que admite a la vez \(tabla 5 de su ficha\)/);
  assert.strictEqual(c('fibra-100g', 'fibra-100g'), null);
  assert.strictEqual(c('fibra-100g', 'fibra-40g', 'fibra-10g'), null);
  assert.strictEqual(c('fibra-40g', 'fibra-40g', 'fibra-40g', 'fibra-10g'), null);
  // 1×100G + 3×40G es una combinación (sin SFP+); con un SFP+ más, ya no.
  assert.strictEqual(c('fibra-100g', 'fibra-40g', 'fibra-40g'), null);
  assert.match(c('fibra-100g', 'fibra-40g', 'fibra-40g', 'fibra-10g'), /1×100G \+ 2×40G \+ 1×SFP\+ no está entre/);
  // El C8570-G2: las mismas bahías (su guía de hardware), el tope de 240 GE de su ficha y, desde el
  // 2026-10-27, la nota de su guía de configuración: con la bahía 1 en 100G, la bahía 0 cae.
  const g = (...xs) => M.motivoCombinacion(asig('Cisco Secure Router C8570-G2', ...xs));
  assert.match(g('fibra-100g', 'fibra-100g', 'fibra-10g', 'fibra-10g'), /2×100G \+ 2×SFP\+ no está entre las que admite a la vez \(bahías de sus guías de hardware y de configuración\)/);
  assert.strictEqual(g('fibra-100g', 'fibra-100g'), null);
  assert.strictEqual(g('fibra-100g', 'fibra-40g', 'fibra-40g', 'fibra-40g'), null);
  assert.strictEqual(g('fibra-100g', 'fibra-40g', 'fibra-10g', 'fibra-10g'), null);
  // 1×100G + 2×40G va con la bahía 1 en 100G (bahía 2 en 40G): ya no queda ningún SFP+.
  assert.match(g('fibra-100g', 'fibra-40g', 'fibra-40g', 'fibra-10g'), /1×100G \+ 2×40G \+ 1×SFP\+ no está entre/);
  assert.strictEqual(g('fibra-40g', 'fibra-40g', 'fibra-40g', 'fibra-40g', 'fibra-10g', 'fibra-10g', 'fibra-10g', 'fibra-10g'), null);
  // Las dos bahías en 100G dejan sin los QSFP de 40G de la bahía 2.
  assert.match(g('fibra-100g', 'fibra-100g', 'fibra-40g', 'fibra-40g'), /2×100G \+ 2×40G no está entre las que admite a la vez \(bahías de sus guías de hardware y de configuración\)/);
  // Tabla 3: cuatro jaulas QSFP (2 de 40/100G y 2 de 40G), no cinco.
  const qsfp = id('Catalyst 8500-12X4QC').puertos.filter((g) => /QSFP/.test(g.medios[0])).reduce((t, g) => t + g.n, 0);
  assert.strictEqual(qsfp, 4);
  // En la evaluación, aparta con su grupo.
  const ev = M.evaluar(MODELS, { ...base, bwMbps: 1000, plataforma: 'xe', enlaces: E('fibra-100g', 'fibra-100g', 'fibra-10g'), catalogo: CAT });
  assert.ok(M.resumenApartados(ev.apartados).some((g) => /no admiten esa combinación de puertos/.test(g.motivo) && g.ids.includes('Catalyst 8500-12X4QC')));
});

test('reparto: un cobre de 10G va a una SFP+ con el 10GBASE-T solo donde la guía de hardware lo da', () => {
  const r = asig('Cisco Secure Router C8355-G2', 'cobre-10g');
  assert.strictEqual(r.asignados[0].via, 'transceptor');
  const pz = M.piezasEnlaces(r)[0];
  assert.ok(pz.sku === 'SFP-10G-T-X' && /10GBASE-T/.test(pz.desc) && /30 m/.test(pz.nota), JSON.stringify(pz));
  assert.match(asig('Cisco Secure Router C8231-G2', 'cobre-10g').sinAsignar[0].motivo, /tiene jaulas de 10G, pero el catálogo no trae su transceptor de cobre 10GBASE-T/);
  // Un 1000BASE-T no es una óptica, ni el 10GBASE-T: no salen como óptica de fibra.
  assert.ok(M.asignarEnlaces(id('Cisco Secure Router C8355-G2'), E('fibra-10g'), CAT).asignados[0].opticas.every((o) => !/BASE-T\b/.test(o.d)));
});

// Variantes de la 8100 (2026-10-26): DSL integrado en un producto vigente y 10G en cobre.
test('reparto 8100: el DSL de las VAI/VAP, la jaula XGSPON/10GBASE-T solo con cobre y el 10GBASE-T de las H', () => {
  // DSL vigente: la VAI lo recibe en su puerto integrado (el ISR 1116-4P ya no es el único).
  const dsl = asig('Cisco Secure Router C8130-VAI-G2', 'dsl', 'cobre-10g');
  assert.deepStrictEqual(dsl.sinAsignar, []);
  assert.strictEqual(M.rotuloPuerto(dsl.asignados[0]), 'Puerto DSL WAN (VDSL2/ADSL2+, Annex B/J sobre RDSI)');
  assert.strictEqual(SR('C8130-VAP-G2').dsl, 'VDSL2/ADSL2+, Annex A sobre POTS');
  // El cobre de 10G va a la jaula con el SFP-10G-T-X, y el rótulo dice qué admite esa jaula.
  assert.strictEqual(dsl.asignados[1].via, 'transceptor');
  assert.match(M.rotuloPuerto(dsl.asignados[1]), /XGSPON\/10GBASE-T: SFP-10G-ONT20-I o SFP-10G-T-X/);
  assert.ok(M.piezasEnlaces(dsl).some((x) => x.sku === 'SFP-10G-T-X'));
  // Esa jaula nunca recibe una óptica: una fibra de 10G no tiene dónde ir.
  assert.match(asig('Cisco Secure Router C8151-CVAI-G2', 'fibra-10g').sinAsignar[0].motivo, /sin puerto para el enlace 1 \(fibra de 10G\)/);
  // Las H traen el 10GBASE-T en RJ-45 nativo, sin transceptor, y no tienen DSL.
  const h = asig('Cisco Secure Router C8130H-G2', 'cobre-10g', 'cobre-1g');
  assert.deepStrictEqual(h.sinAsignar, []);
  assert.strictEqual(h.asignados.find((a) => a.enlace === 1).via, 'nativo');
  assert.match(asig('Cisco Secure Router C8151H-C-G2', 'dsl').sinAsignar[0].motivo, /sin puerto para el enlace 1 \(DSL/);
  // Las cifras son las de su modelo base (columnas compartidas de las tablas 12 y 13 de la ficha).
  for (const [v, b] of [['C8130-VAI-G2', 'C8130-G2'], ['C8130H-G2', 'C8130-G2'], ['C8151-CVAP-G2', 'C8151-G2'], ['C8151H-C-G2', 'C8151-G2']]) {
    for (const k of ['fwd', 'ipsec', 'sdwan', 'amenazas', 'tuneles', 'rutas', 'nat']) assert.strictEqual(SR(v)[k], SR(b)[k], `${v} ${k}`);
  }
  // El 5G RedCap va integrado (sin PIM), y la guía de pedido niega los complementos de seguridad a
  // las 8130 sin Threat Protection.
  assert.ok(SR('C8151H-C-G2').lte && !SR('C8151H-C-G2').pim);
  for (const v of ['C8130-VAI-G2', 'C8130-VAP-G2', 'C8130H-G2']) assert.strictEqual(SR(v).secAddon, false, v);
  assert.notStrictEqual(SR('C8151-CVAI-G2').secAddon, false);
});

test('puertos mGig: la velocidad mínima tiene fuente en la G2 y en el MX95/MX105, y es supuesto solo en los G2-MX', () => {
  // Desde el 2026-10-27 el MX95 y el MX105 la tienen de su página «WAN Behavior» (LED de los
  // RJ-45: 1 Gbps es «slow link»); los C8111/C8121-G2-MX siguen sin documento que la dé.
  const conFuente = new Set(['Meraki MX95', 'Meraki MX105']);
  for (const m of MODELS) {
    for (const g of m.puertos || []) {
      if (!g.mgig) continue;
      assert.strictEqual(!!g.velMinSupuesto, m.ser === 'Meraki MX' && !conFuente.has(m.id), `${m.id}: velMinSupuesto donde no toca`);
    }
  }
  const mx95 = MODELS.find((m) => m.id === 'Meraki MX95');
  assert.ok(mx95.puertos.some((g) => g.mgig && g.uso === 'WAN' && g.velMin === 1 && !g.velMinSupuesto));
});

// XGS-PON (2026-10-27): el enlace PON de un operador solo cabe en la jaula XGSPON/10GBASE-T de las
// 8100 VAI/VAP y CVAI/CVAP, con la ONT SFP-10G-ONT20-I de su ficha (20 km en monomodo G.652).
test('XGS-PON: solo en la jaula de las 8100 con ONT, con la ONT en el BOM; en otro equipo, motivo', () => {
  const SR = (n) => id(`Cisco Secure Router ${n}`);
  const pon = [{ tipo: 'internet', rol: 'principal', entrega: 'xgspon' }];
  for (const n of ['C8130-VAI-G2', 'C8130-VAP-G2', 'C8151-CVAI-G2', 'C8151-CVAP-G2']) {
    const r = M.asignarEnlaces(SR(n), pon, CAT);
    assert.strictEqual(r.asignados.length, 1, n);
    assert.strictEqual(r.asignados[0].via, 'ont');
    assert.match(M.rotuloPuerto(r.asignados[0]), /XGSPON\/10GBASE-T/);
    const p = M.piezasEnlaces(r);
    assert.deepStrictEqual(p.map((x) => x.sku), ['SFP-10G-ONT20-I']);
    assert.match(p[0].nota, /20 km en monomodo G\.652/);
  }
  // En la jaula con la ONT ya no cabe el cobre de 10G: es la misma jaula.
  const dos = M.asignarEnlaces(SR('C8130-VAI-G2'), [...pon, { tipo: 'internet', rol: 'respaldo', entrega: 'cobre-10g' }], CAT);
  assert.deepStrictEqual([dos.asignados.length, dos.sinAsignar.length], [1, 1]);
  // El 10GBASE-T nativo de las H no admite la ONT, ni una fibra de 10G va a la jaula de la ONT.
  const h = M.asignarEnlaces(SR('C8130H-G2'), pon, CAT);
  assert.match(h.sinAsignar[0].motivo, /ningún puerto admite la ONT XGS-PON/);
  const fibra = M.asignarEnlaces(SR('C8130-VAI-G2'), [{ tipo: 'internet', rol: 'principal', entrega: 'fibra-10g' }], CAT);
  assert.strictEqual(fibra.asignados.length, 0);
  // Un PON no lleva tipo de fibra ni tramo: los da la red del operador.
  const v = M.enlacesValidos([{ tipo: 'internet', entrega: 'xgspon', fibra: 'smf', km: 12 }])[0];
  assert.deepStrictEqual([v.fibra, v.km], [null, null]);
});

// PROPUESTA 3.2 (2026-10-21): el firewall dedicado es un Cisco Secure Firewall, por la cifra de su capa.
test('firewall dedicado: el Secure Firewall más pequeño que llega con la cifra de la capa pedida, nunca de otra', () => {
  const d = (bw) => M.demanda({ ...base, bwMbps: bw, diaPct: 100 });
  // 4 Gbps por sentido al 100 %: 10,4 Gbps con margen. Con IPS, el 1250 (18 Gbps de FW + AVC + IPS)…
  const ips = M.firewallDedicado(d(4000), { capa: 'ips' }, SECURE_FIREWALL);
  assert.strictEqual(ips.need, 10400);
  assert.strictEqual(ips.elegido.m.id, 'Secure Firewall 1240');
  // …el 1230 da 13 Gbps de FW + AVC pero solo 9 con IPS: sin IPS cumple, con IPS se aparta.
  assert.strictEqual(M.firewallDedicado(d(4000), { capa: 'avc' }, SECURE_FIREWALL).elegido.m.id, 'Secure Firewall 1230');
  assert.ok(ips.apartados.some((f) => f.m.id === 'Secure Firewall 1230' && /FW \+ AVC \+ IPS: 9\.000 Mbps frente a 10\.400/.test(f.motivos[0])));
  // Con descifrado TLS manda su cifra: 10,4 Gbps de TLS solo los dan el 3140 y la serie 4200.
  assert.strictEqual(M.firewallDedicado(d(4000), { tls: true }, SECURE_FIREWALL).elegido.m.id, 'Secure Firewall 3140');
  // Las sesiones escritas también apartan: con 500.000 cumplen el 1240 (12 Gbps de IPS) y la 3100;
  // el menor por su cifra de la capa es el 3105 (10 Gbps).
  const ses = M.firewallDedicado(d(100), { capa: 'ips', sesiones: 500000 }, SECURE_FIREWALL);
  assert.strictEqual(ses.elegido.m.id, 'Secure Firewall 3105');
  assert.ok(ses.apartados.some((f) => f.m.id === 'Secure Firewall 1230' && /400\.000 sesiones con AVC frente a 500\.000/.test(f.motivos[0])));
  // Al BOM: el equipo y su licencia TMC; la 3100 lleva el plazo en la referencia y 7 años no existen.
  const pz = M.piezasFirewall(M.firewallDedicado(d(4000), { tls: true }, SECURE_FIREWALL), 7);
  assert.deepStrictEqual(pz.filas.map((x) => x.sku), ['FPR3140-NGFW-K9', 'L-FPR3140T-TMC-5Y']);
  assert.ok(pz.avisos.some((x) => /1, 3 o 5 años: se propone 5/.test(x)));
  // Sin salida a Internet, nada.
  assert.strictEqual(M.firewallDedicado(M.demanda(base), {}, SECURE_FIREWALL), null);
});

// PROPUESTA 2.3 (2026-10-21): AppQoE con DRE, por la guía de configuración (sin caudal publicado).
test('AppQoE con DRE: aparta a quien no consta o no llega a las conexiones, y avisa sin cifra de caudal', () => {
  const r = (id_, c) => M.requisitos(id(id_), { appqoe: true, appqoeConexiones: c });
  assert.match(r('Catalyst 8200L', 100).motivos[0], /AppQoE \(DRE\) no consta/);
  assert.match(r('Catalyst 8200', 1000).motivos[0], /DRE llega a 750 conexiones \(perfil S\) frente a 1\.000/);
  const ok = r('Catalyst 8300-2N2S-4T2X', 6000);
  assert.ok(!ok.motivos.length && /perfil L, hasta 10\.000 conexiones/.test(ok.avisos[0]) && /ninguna ficha publica el caudal/.test(ok.avisos[0]));
  // El perfil más pequeño que llega: 3.000 conexiones en un C8375-E-G2 son su perfil M.
  assert.match(r('Cisco Secure Router C8375-E-G2', 3000).avisos[0], /perfil M, hasta 5\.000/);
  // Un controlador de servicio no ejecuta el DRE: lo dice, sin apartar.
  const ctrl = r('Catalyst 8500-12X', 1000);
  assert.ok(!ctrl.motivos.length && /nodo externo/.test(ctrl.avisos[0]));
});

// PROPUESTA 1.3 (2026-10-21): sede con dos routers.
test('sede con dos routers: cada uno para toda la sede; con TLOC, enlaces alternados y una interfaz entre los dos', () => {
  const p = { ...base, bwMbps: 100, enlaces: E('fibra-1g', 'cobre-1g'), catalogo: CAT };
  // Sin TLOC, el reparto es el de un router (los dos van a todos los transportes).
  const ha = M.evaluar(MODELS, { ...p, ha: true });
  const sin = M.evaluar(MODELS, p);
  assert.deepStrictEqual(ha.candidatos.map((f) => f.m.id), sin.candidatos.map((f) => f.m.id));
  assert.deepStrictEqual(ha.ha, { tloc: false, celular: false });
  assert.match(M.memoria(ha, { perfil: 'sdwan' }), /Sede con dos routers: cada uno dimensionado para todo el tráfico/);
  // Con TLOC: el enlace 1 al router 1, el 2 al router 2, y cada uno su interfaz TLOC.
  const r = M.repartoHa(id('Catalyst 8300-1N1S-6T'), { ...p, ha: true, haTloc: true });
  assert.deepStrictEqual(r.asignados.map((a) => [a.router, a.enlace]), [[1, 1], [1, 101], [2, 2], [2, 102]]);
  assert.ok(r.tloc && !r.sinAsignar.length);
  // Una pieza de un router lo dice y no se duplica con el segundo.
  const pz = M.piezasEnlaces(r).find((x) => /^Router 1: Óptica de 1G para el enlace 1/.test(x.desc));
  assert.ok(pz && pz.porRouter, JSON.stringify(M.piezasEnlaces(r).map((x) => x.desc)));
  // Un equipo sin puerto libre para la interfaz TLOC se aparta con su motivo.
  const ev = M.evaluar(MODELS, { ...p, plataforma: 'meraki', ha: true, haTloc: true, enlaces: E('cobre-1g', 'cobre-1g', 'cobre-1g', 'cobre-1g') });
  assert.ok(M.resumenApartados(ev.apartados).some((g) => /extensión TLOC|algún enlace WAN|enlaces WAN/.test(g.motivo)), JSON.stringify(M.resumenApartados(ev.apartados)));
  assert.ok(ev.candidatos.every((f) => f.avisos.some((x) => /warm spare/.test(x))));
});

// PROPUESTA 2.2 (2026-10-21): los componentes de control por número de equipos (versión 20.18.x).
test('controladores SD-WAN: Manager, Validators y Controllers por equipos del overlay', () => {
  const r = M.controladoresSdwan(1200, false, CONTROLADORES_SDWAN);
  assert.deepStrictEqual(r.manager.map((x) => x.n), ['Un nodo Large', 'Clúster de tres nodos Large (todos los servicios)']);
  assert.deepStrictEqual([r.validadores.n, r.validadores.vcpu, r.controladores.n, r.controladores.vcpu], [2, 4, 2, 8]);
  // 6.000 equipos: seis Controllers y cuatro Validators; con SAIE, otro despliegue del Manager.
  const g = M.controladoresSdwan(6000, true, CONTROLADORES_SDWAN);
  assert.deepStrictEqual([g.validadores.n, g.controladores.n], [4, 6]);
  assert.ok(g.manager.every((x) => /seis nodos/.test(x.n)));
  // Más de 12.500: varios overlays. Sin equipos, nada.
  assert.ok(M.controladoresSdwan(13000, false, CONTROLADORES_SDWAN).fuera);
  assert.strictEqual(M.controladoresSdwan(0, false, CONTROLADORES_SDWAN), null);
});

// PROPUESTA 1.2 (2026-10-21): el módulo celular se elige por la categoría que llega.
test('celular por categoría: los PIM de la guía que llegan a la bajada y la subida del enlace', () => {
  const g2 = MODULOS_G2.filter((x) => x.en === 'pim');
  // 500/100 Mbps: solo el 5G de la G2 (el CAT7 da 300/150).
  const r = M.pimsCelular(g2, CELULAR, { bajada: 500, subida: 100 });
  assert.deepStrictEqual(r.elegibles.map((o) => o.sku), ['P-5GS6-R16SA-GL']);
  // 200/120: el 5G y los tres CAT7 (uno por región).
  assert.strictEqual(M.pimsCelular(g2, CELULAR, { bajada: 200, subida: 120 }).elegibles.length, 4);
  // 4 Gbps no llega con ninguno: se dice cuál es el mayor.
  const no = M.pimsCelular(g2, CELULAR, { bajada: 4000 });
  assert.ok(!no.elegibles.length && no.max.sku === 'P-5GS6-R16SA-GL');
  // Sin bajada ni subida, la lista entera de la familia, como antes.
  assert.ok(M.pimsCelular(g2, CELULAR, null).falta);
  // En los Catalyst 8300/8200, la subida del CAT6 (50 Mbps) se queda corta para 100.
  const c8k = MODULOS_C8K.filter((x) => x.en === 'pim');
  assert.deepStrictEqual(M.pimsCelular(c8k, CELULAR, { subida: 100 }).elegibles.map((o) => o.sku), ['P-LTEAP18-GL']);
  // El requisito lleva la mayor bajada y subida de los enlaces celulares.
  const req = M.requisitosConEnlaces({ enlaces: [{ tipo: 'celular', rol: 'respaldo', bajada: '150', subida: '40' }] });
  assert.deepStrictEqual(req.celularMbps, { bajada: 150, subida: 40 });
});

// PROPUESTA 3.1 (2026-10-21): la salida a un SSE lleva la suscripción de Secure Access.
test('Secure Access: suscripción, licencia por usuario con su mínimo, por sede por ancho de banda y túneles', () => {
  const d = M.demanda({ ...base, bwMbps: 400, diaPct: 50 });
  const r = M.secureAccess({ licencia: 'usuario', nivel: 'ess', usuarios: 30, privado: true, ips: true }, d, SECURE_ACCESS);
  assert.deepStrictEqual(r.filas.map((x) => [x.sku, x.qty]), [['SECURE-ACCESS-SUB', 1], ['SA-SIA-ESS', 50], ['SA-SPA-ESS-K9', 50], ['SA-THRT', 50]]);
  assert.ok(r.avisos.some((x) => /mínimo de 50 usuarios/.test(x)));
  // 400 Mbps por sentido × 50 % = 400 Mbps de suma, 520 con el margen: un túnel y su respaldo.
  assert.deepStrictEqual([r.principales, r.tuneles], [1, 2]);
  // Advantage incluye el IPS: sin SA-THRT.
  const adv = M.secureAccess({ licencia: 'usuario', nivel: 'adv', usuarios: 200, ips: true }, d, SECURE_ACCESS);
  assert.ok(!adv.filas.some((x) => x.sku === 'SA-THRT') && adv.filas.some((x) => x.sku === 'SA-SIA-ADV-K9' && x.qty === 200));
  // Por sede: 200 Mbps por sentido van al grupo Medium (hasta 500 Mbps), «elegir una» por volumen.
  const sede = M.secureAccess({ licencia: 'sede', nivel: 'adv' }, d, SECURE_ACCESS);
  const fila = sede.filas.find((x) => /por sede/.test(x.desc));
  assert.ok(fila && /grupo Medium/.test(fila.desc) && /SA-SIAS-M1-ESS: 1 TB/.test(fila.nota), JSON.stringify(sede.filas));
  assert.ok(sede.avisos.some((x) => /solo existe en SIA Essentials/.test(x)));
  // Más de 5 Gbps por sentido no cabe por sede: va por usuario. Y 1,5 Gbps por sentido (1,95 con el
  // margen) piden 2 túneles: el gigabit del túnel es por sentido («in either direction»), no la suma.
  const grande = M.secureAccess({ licencia: 'sede' }, M.demanda({ ...base, bwMbps: 6000, diaPct: 100 }), SECURE_ACCESS);
  assert.ok(grande.avisos.some((x) => /llega a 5\.000 Mbps/.test(x)) && grande.filas.some((x) => x.sku === 'SA-SIA-ESS'));
  assert.strictEqual(M.secureAccess({}, M.demanda({ ...base, bwMbps: 1500, diaPct: 100 }), SECURE_ACCESS).principales, 2);
  assert.ok(!grande.avisos.some((x) => /hasta 10 túneles/.test(x)), '6 Gbps por sentido: 8 túneles, caben en ECMP');
  // Más de 10 túneles no caben en un grupo ECMP: avisa.
  const enorme = M.secureAccess({}, M.demanda({ ...base, bwMbps: 9000, diaPct: 100 }), SECURE_ACCESS);
  assert.strictEqual(enorme.principales, 12);
  assert.ok(enorme.avisos.some((x) => /hasta 10 túneles en ECMP/.test(x)));
  // Sin salida a Internet no hay nada que pagar.
  assert.deepStrictEqual(M.secureAccess({}, M.demanda(base), SECURE_ACCESS).filas, []);
});

test('enlaces en la evaluación: apartan agrupados, el celular pide módem y sin enlaces nada cambia', () => {
  const sin = M.evaluar(MODELS, base);
  const vacio = M.evaluar(MODELS, { ...base, enlaces: [], catalogo: CAT });
  assert.deepStrictEqual(vacio.candidatos.map((f) => f.m.id), sin.candidatos.map((f) => f.m.id));
  const dos10 = M.evaluar(MODELS, { ...base, bwMbps: 100, enlaces: E('fibra-10g', { tipo: 'mpls', rol: 'respaldo', entrega: 'fibra-10g' }), catalogo: CAT });
  const g = M.resumenApartados(dos10.apartados).find((x) => /no tienen puerto para algún enlace WAN/.test(x.motivo));
  assert.ok(g && g.ids.includes('Cisco Secure Router C8211-G2'), JSON.stringify(M.resumenApartados(dos10.apartados)));
  assert.ok(dos10.candidatos.every((f) => f.enlaces.sinAsignar.length === 0));
  // La fila lleva las ópticas de sus dos enlaces como piezas.
  assert.ok(dos10.candidatos[0].piezas.filter((x) => /^Óptica de 10G/.test(x.desc)).length === 2);
  // Un enlace celular aparta a quien no tiene módem ni ranura PIM.
  const cel = M.evaluar(MODELS, { ...base, bwMbps: 100, enlaces: E('cobre-1g', { tipo: 'celular', rol: 'respaldo' }), catalogo: CAT });
  assert.ok(cel.candidatos.every((f) => f.m.lte || f.m.pim));
  // El caudal por sentido que no cabe en la entrega de los principales se dice en el escenario.
  assert.deepStrictEqual(M.evaluar(MODELS, { ...base, bwMbps: 2000, enlaces: E('cobre-1g'), catalogo: CAT }).enlacesCaudal, { bw: 2000, cabe: 1000 });
  assert.strictEqual(M.evaluar(MODELS, { ...base, bwMbps: 800, enlaces: E('cobre-1g'), catalogo: CAT }).enlacesCaudal, null);
  // El 8200L cumple: sus jaulas son de 1G, pero su ranura NIM admite el C-NIM-4X (1/10G con L3
  // opcional), y la memoria técnica dice a qué puerto va cada enlace.
  assert.strictEqual(dos10.candidatos[0].m.id, 'Catalyst 8200L');
  assert.deepStrictEqual(dos10.candidatos[0].enlaces.modulos.map((x) => x.sku), ['C-NIM-4X']);
  const md = M.memoria(dos10, { perfil: 'sdwan' });
  assert.match(md, /## Enlaces WAN y puertos[\s\S]*Enlace 1: Internet, principal, fibra de 10G → SFP\+ LAN\/WAN de 10G en el C-NIM-4X/);
});

// ASR 1000 (2026-10-27): un enlace que no cabe en los puertos fijos cita lo que admite la bahía del
// chasis, de su guía de hardware; el catálogo no propone el módulo (chasis fuera de venta).
test('ASR: el enlace sin puerto fijo dice qué admite su bahía y de qué guía sale', () => {
  const tres = Array.from({ length: 3 }, () => ({ tipo: 'internet', rol: 'principal', entrega: 'fibra-10g' }));
  const r = M.asignarEnlaces(id('ASR 1001-X'), tres, CAT);
  assert.strictEqual(r.asignados.length, 2);
  assert.match(r.sinAsignar[0].motivo, /SPA-1X10GE-L-V2[\s\S]*NIM-SSD y NIM-T1\/E1, sin Ethernet[\s\S]*guía de hardware del ASR 1001-X/);
  assert.match(r.sinAsignar[0].motivo, /fuera de venta/);
  assert.deepStrictEqual(r.modulos, [], 'no se propone ningún módulo');
  // El 1002-HX no tiene puerto fijo de 100G: su EPA-1X100GE sí.
  const hx = M.asignarEnlaces(id('ASR 1002-HX'), [{ tipo: 'internet', rol: 'principal', entrega: 'fibra-100g' }], CAT);
  assert.match(hx.sinAsignar[0].motivo, /EPA-1X100GE con CPAK[\s\S]*Supported EPAs/);
});
