'use strict';
// CISCO SECURE FIREWALL EN EL CATÁLOGO (2026-10-31, decisión del dueño: «Sí, ficha completa»). Fija:
//   1. el portal lista los 14 modelos de `SECURE_FIREWALL` (una sola copia de cada cifra), con los
//      datos de hardware de sus fichas y sin `fwd`: las fichas no dan un firewall sin inspección;
//   2. la calculadora dimensiona cada perfil con la cifra de su capa (IPsec, FW + AVC + IPS, TLS) y
//      los aparta, con su motivo, del reenvío y de Threat Protection;
//   3. el comparador da sus cifras como dato y lo que la ficha no publica como «sin dato».
const test = require('node:test');
const assert = require('node:assert');
const { cargar } = require('./ayuda/navegador');
const { SECURE_FIREWALL } = require('../server/seed/legacyData/cisco');
const PORTAL = require('../server/seed/legacyData/indexPR');
const { CALC } = cargar('public/js/calculadora.js');
const { COMPARADOR } = cargar('public/js/comparador.js');

const FILAS = PORTAL.cisco.filter((f) => /^Secure Firewall /.test(f.ser || ''));
const dev = (raw) => ({ grupo: 'cisco', vendor: 'Cisco', raw, model: raw.model, series: raw.ser, seg: raw.seg, ports: raw.ports, color: '#000' });

test('el portal lista los 14 Secure Firewall con los datos de su ficha y sin cifra de reenvío', () => {
  assert.deepStrictEqual(FILAS.map((f) => f.model), SECURE_FIREWALL.modelos.map((m) => m.id));
  for (const f of FILAS) {
    const m = SECURE_FIREWALL.modelos.find((x) => x.id === f.model);
    assert.ok(!('fwd' in f) && !('cap' in f), `${f.model}: una cifra de reenvío que su ficha no da`);
    assert.deepStrictEqual([f.ips, f.ipsec, f.tls, f.sess, f.cps], [m.ips, m.vpn, m.tls, m.sesiones, m.cps]);
    for (const k of ['ports', 'gestion', 'seg', 'formato', 'hwSku']) assert.ok(f[k], `${f.model}: falta ${k}`);
    assert.ok([true, false, 'opcional'].includes(f.redund), `${f.model}: redundancia`);
    assert.strictEqual(f.elp, 'Consultar');
  }
  const por = (id) => FILAS.find((f) => f.model === id);
  assert.strictEqual(por('Secure Firewall 1210CP').poe, true);
  assert.strictEqual(por('Secure Firewall 1210CE').psu.watts, 32);
  assert.strictEqual(por('Secure Firewall 1250').psu.watts, null, 'los 1U no publican consumo típico');
  assert.strictEqual(por('Secure Firewall 3110').redund, 'opcional');
  assert.strictEqual(por('Secure Firewall 3140').redund, true);
  assert.match(por('Secure Firewall 4245').psu.tipo, /solo a 200-240 V AC/);
});

test('la calculadora usa la cifra de cada capa y aparta lo que la ficha no publica', () => {
  const sf = dev(FILAS.find((f) => f.model === 'Secure Firewall 3120'));
  const r = (perfil) => CALC.evaluar([sf], perfil, 1000);
  assert.strictEqual(r('fwd').apartados.length, 1, 'sin firewall sin inspección, se aparta del reenvío');
  assert.strictEqual(r('tp').apartados.length, 1, 'ni Threat Protection');
  for (const [perfil, n, v] of [['ipsec', /IPsec \(Secure Firewall/, 10000], ['ngfw', /FW \+ AVC \+ IPS/, 21000], ['ssl', /TLS \(Secure Firewall/, 6700]]) {
    const c = CALC.capaDe(sf, perfil);
    assert.match(c.n || '', n, `${perfil}: rótulo de la capa`);
    assert.strictEqual(c.mbps, v, `${perfil}: cifra`);
    assert.strictEqual(r(perfil).apartados.length, 0, `${perfil}: no se aparta`);
  }
  assert.strictEqual(CALC.capaDe(sf, 'fwd').mbps, null);
});

test('el comparador da sus cifras como dato y lo no publicado como «sin dato»', () => {
  const f = FILAS.find((x) => x.model === 'Secure Firewall 4225');
  const fila = (k) => COMPARADOR.SECCIONES.flatMap((s) => s.filas).find((x) => x.k === k);
  const celda = (k) => COMPARADOR.celda(fila(k), { grupo: 'cisco', raw: f });
  assert.strictEqual(celda('ips').estado, 'dato');
  assert.strictEqual(celda('ipsec').estado, 'dato');
  assert.strictEqual(celda('portada').estado, 'sinDato');
  assert.match(celda('redund').txt, /^Sí — de serie/);
  assert.match(celda('ports').txt, /SFP28/);
});

// Fase 3 (2026-10-31): la ficha del firewall dedicado enlaza la ficha oficial de su serie. La URL es
// la misma que su entrada de fuentes.js: un enlace que se desvía de la fuente declarada no se nota.
test('cada serie de Secure Firewall enlaza la ficha oficial que declara fuentes.js', () => {
  const { FUENTES } = require('../server/seed/legacyData/fuentes');
  const urls = new Set(Object.values(FUENTES).flat().map((f) => f.url));
  const series = [...new Set(SECURE_FIREWALL.modelos.map((m) => m.serie))];
  assert.deepStrictEqual(Object.keys(SECURE_FIREWALL.fichas).sort(), series.sort());
  for (const [serie, url] of Object.entries(SECURE_FIREWALL.fichas)) {
    assert.match(url, /^https:\/\/www\.cisco\.com\//, `${serie}: solo https de cisco.com`);
    assert.ok(urls.has(url), `${serie}: ${url} no es la URL de ninguna entrada de fuentes.js`);
  }
});

test('la página pinta la ficha del firewall dedicado con FICHA y sin afirmar su ciclo de vida', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const js = fs.readFileSync(path.join(__dirname, '../public/js/dimensionador-cisco-catalyst8k.js'), 'utf8');
  const html = fs.readFileSync(path.join(__dirname, '../public/dimensionador-cisco-catalyst8k.html'), 'utf8');
  assert.match(html, /<div class="verdict" id="fichaFw" hidden/, 'el contenedor existe y nace oculto');
  assert.match(js, /FICHA\.render\(\{contenedor:'fichaFw'/);
  assert.match(js, /cicloVida:CICLO_FW/, 'el ciclo de vida del firewall se declara sin respaldo, no se hereda el de los routers');
  assert.match(js, /pintarAvisos\(ev, p\);\n {2}pintarFichaFw\(ev, p\);/, 'se pinta en cada recálculo, antes de la salida sin router');
});
