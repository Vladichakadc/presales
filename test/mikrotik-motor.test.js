'use strict';
// El dimensionador MikroTik elige la CELDA de la matriz oficial de pruebas (revision del
// 2026-10-13). Cada prueba fija un fallo que el motor anterior tenia: un factor FastTrack sin
// fuente, WireGuard al 45 % del IPsec, la cifra agregada comparada con un enlace de un puerto
// Fast Ethernet, y un empate de precio resuelto a favor del equipo mas lento.
const test = require('node:test');
const assert = require('node:assert');
const M = require('../public/js/mikrotik-motor.js');
const D = require('../server/seed/legacyData/mikrotik');

const rango = (m) => (m.eol ? 2 : m.legacy ? 1 : 0);
const OPC = { licencias: D.LICENSE_LEVELS, bgpRam: D.BGP_RAM, rango };
const evaluar = (esc) => M.evaluar({ head: 0, ...esc }, D.MODELS, OPC);
const fila = (ev, id) => ev.rows.find((r) => r.m.id === id);

test('el firewall completo dimensiona con la fila de 25 reglas de filtro, a la trama pedida', () => {
  const ev = evaluar({ bw: 500, firewall: 'completo', trama: 512 });
  const r = fila(ev, 'RB5009UG+S+IN');
  assert.strictEqual(r.cap, 3096.2, 'la ficha del RB5009: Routing / 25 ip filter rules / 512 B');
  assert.match(r.fila, /25 reglas de filtro/);
  // A 64 B la misma fila cae a 414 Mbps: la columna la fija el perfil de trafico.
  assert.strictEqual(fila(evaluar({ bw: 500, firewall: 'completo', trama: 64 }), 'RB5009UG+S+IN').cap, 414);
});

test('colas y firewall a la vez toman la menor de las dos filas y lo avisan', () => {
  const ev = evaluar({ bw: 500, firewall: 'completo', qos: true, trama: 512 });
  assert.strictEqual(fila(ev, 'RB5009UG+S+IN').cap, Math.min(4612, 3096.2));
  assert.ok(ev.avisos.some((a) => /no publica la combinación/.test(a)));
});

test('L3HW solo lo tienen los CCR que lo publican; el resto se aparta con su motivo', () => {
  const ev = evaluar({ bw: 40, unit: 1000, firewall: 'ninguno', l3hw: true, trama: 512 });
  assert.strictEqual(ev.pick.m.id, 'CCR2216-1G-12XS-2XQ');
  assert.ok(fila(ev, 'CCR2004-16G-2S+').miss.includes('la ficha no publica «Ruteo con offload L3 por hardware (L3HW)»'));
  // Con colas el trafico no se descarga al hardware: vuelve a software.
  const conColas = evaluar({ bw: 1, unit: 1000, firewall: 'ninguno', l3hw: true, qos: true });
  assert.deepStrictEqual(conColas.configs, ['fastpath', 'colas']);
});

test('el caudal por sentido no pasa del puerto mas rapido: un hEX lite no lleva 200 Mbps', () => {
  const ev = evaluar({ bw: 200, firewall: 'ninguno', trama: 1518, dirMult: 1 });
  const r = fila(ev, 'hEX lite RB750r2');
  assert.ok(r.cap >= ev.need, 'la cifra agregada (493 Mbps) si cabria');
  assert.ok(r.miss.includes('su puerto más rápido es de 100 Mbps por sentido'));
});

test('la prueba «all port» se compara con los dos sentidos (x2 por defecto)', () => {
  assert.strictEqual(evaluar({ bw: 100 }).need, 200);
  assert.strictEqual(evaluar({ bw: 100, dirMult: 1 }).need, 100);
  assert.strictEqual(evaluar({ bw: 100, head: 30 }).porSentido, 130);
});

test('IPsec: un tunel en un sitio, 256 en un hub, y sin celda no hay cifra prestada', () => {
  const sitio = evaluar({ bw: 100, perfil: 'ipsec', trama: 1518 });
  assert.strictEqual(fila(sitio, 'CCR2116-12G-4S+').cap, 2012.6);
  const hub = evaluar({ bw: 50, perfil: 'ipsec', modo: 'hub', sedes: 40, conc: 100, trama: 1518 });
  assert.strictEqual(fila(hub, 'CCR2116-12G-4S+').cap, 4108.2);
  // La ficha solo publica un tunel con AES-128 + SHA1.
  const aes256 = evaluar({ bw: 100, perfil: 'ipsec', cifrado: 'aes256-sha256' });
  assert.strictEqual(aes256.pick, null);
  assert.match(fila(aes256, 'RB5009UG+S+IN').miss[0], /solo publica un túnel con AES-128-CBC \+ SHA1/);
  // Equipos sin tabla IPsec (L009, hEX PoE): apartados, nunca con la cifra de ruteo.
  assert.deepStrictEqual(fila(sitio, 'L009UiGS-RM').miss, ['la ficha no publica rendimiento IPsec']);
});

test('WireGuard no se recomienda: MikroTik no publica su rendimiento', () => {
  const ev = evaluar({ bw: 50, perfil: 'wg' });
  assert.strictEqual(ev.pick, null);
  assert.ok(ev.rows.every((r) => r.cap == null));
  assert.ok(ev.avisos.some((a) => /no publica su rendimiento/.test(a)));
});

test('a igual precio gana el de mas capacidad, y un equipo de linea anterior no se recomienda', () => {
  const ev = evaluar({ bw: 900, firewall: 'completo', trama: 512 });
  assert.strictEqual(ev.pick.m.id, 'RB5009UG+S+IN', 'RB5009 y RB4011 cuestan $219; el RB5009 da mas');
  const hex = evaluar({ bw: 300, trama: 512 });
  assert.notStrictEqual(hex.pick.m.id, 'hEX RB750Gr3', 'relevado por el hEX refresh');
});

test('licencia: PPPoE/L2TP, OpenVPN y HotSpot con los topes de la tabla oficial', () => {
  assert.strictEqual(D.LICENSE_LEVELS[5].ovpn, null, 'nivel 5: OpenVPN sin tope');
  assert.strictEqual(D.LICENSE_LEVELS[5].ppp, 500);
  const ev = evaluar({ bw: 100, ppp: 300 });
  assert.strictEqual(ev.pick.m.lvl, 5);
  assert.ok(fila(ev, 'hEX E50UG').miss.includes('licencia nivel 4: 200 túneles PPPoE/PPTP/L2TP'));
  // 300 tuneles OpenVPN caben en un nivel 5 (sin tope) y no en un nivel 4.
  const ovpn = evaluar({ bw: 100, ovpn: 300 });
  assert.strictEqual(fila(ovpn, 'L009UiGS-RM').miss.length, 0);
});

test('PoE para AP: solo cuenta quien publica vatios; la corriente sola no se convierte a ojo', () => {
  const ev = evaluar({ bw: 100, aps: 4, apPoe: true, apDraw: 11 });
  assert.match(ev.pick.m.id, /^RB5009UPr/);
  assert.match(fila(ev, 'hEX PoE RB960PGS').miss[0], /2 A de PoE-out y no vatios/);
});

test('CHR: la licencia limita la subida por interfaz; IPsec de un CHR no tiene cifra', () => {
  assert.strictEqual(evaluar({ bw: 800, virtual: true }).pick.m.id, 'CHR P1');
  assert.strictEqual(evaluar({ bw: 1.5, unit: 1000, virtual: true }).pick.m.id, 'CHR P10');
  assert.strictEqual(evaluar({ bw: 100, virtual: true, perfil: 'ipsec' }).pick, null);
});

test('sin caudal no hay recomendacion, y la memoria tecnica declara los supuestos', () => {
  assert.strictEqual(evaluar({ bw: 0 }).pick, null);
  const ev = evaluar({ bw: 300, bgpFeeds: 1, head: 30 });
  const md = M.memoria(ev, { fecha: '2026-10-13', filas: [], bgpRam: D.BGP_RAM });
  assert.match(md, /Memoria técnica — Dimensionamiento MikroTik/);
  assert.match(md, /supuestos de diseño declarados/);
  assert.match(md, /SUPUESTO DE DISEÑO/, 'el aviso de la RAM por feed BGP viaja a la memoria');
});

test('un campo vacio es «sin dato», no cero: el hub vacio va al 100 % de simultaneidad', () => {
  const ev = evaluar({ bw: 50, modo: 'hub', sedes: '40', conc: '', head: '' });
  assert.strictEqual(ev.conc, 100);
  assert.strictEqual(ev.base, 2000);
});
