'use strict';
// FortiWiFi, FortiGate con módem 4G/5G y FortiExtender en el dimensionador de Fortinet
// (2026-11-04, encargo del dueño). Fija tres cosas:
//   1. sin pedir Wi-Fi ni celular, las variantes no compiten y la huella de un escenario guardado
//      antes no cambia;
//   2. cada requisito elige lo que debe, y aparta lo demás con su motivo;
//   3. ningún dato de la variante sale de un documento que no la nombra (PQC, BGP, precio de
//      FortiWiFi), y lo que la lista firmada no se extrajo se dice así, no como «no lo trae».
const test = require('node:test');
const assert = require('node:assert');

const F = require('../server/seed/legacyData/fortinet.js');
const V = require('../server/seed/legacyData/fortinetVariantes.js');
const SKUS = require('../server/seed/legacyData/fortinetSkus.js');
const M = require('../public/js/fortinet-motor.js');

const CAT = { models: F.MODELS.map((m) => ({ ...m, eol: !m.hwSku })), bundles: F.BUNDLES, care: F.CARE,
  funciones: F.FUNCIONES, serviciosSdwan: F.SERVICIOS_SDWAN, terminos: F.TERMINOS, fortios: F.FORTIOS,
  ems: F.EMS_LICENCIAS, sase: F.SASE_USUARIOS, extenders: F.FORTIEXTENDER, datasetVersion: 'fortinet@prueba' };
const HOY = { hoy: '2026-11-04T00:00:00Z' };
const esc = (fisico, enlaces) => ({ topologia: { rol: 'none', enlaces: enlaces || [{ id: 1, tipo: 'DIA', down: 300 }] },
  seguridad: { capa: 'tp' }, fisico: fisico || {} });
const ev = (e) => M.evaluar(e, CAT, HOY);
const porId = (id) => F.MODELS.find((m) => m.id === id);

test('las once variantes existen, comparten la tabla de su base y citan su ficha', () => {
  const vars = F.MODELS.filter((m) => m.variante);
  assert.deepStrictEqual(vars.map((m) => m.id).sort(), V.VARIANTES.map((v) => v.id).sort());
  assert.strictEqual(vars.length, 11);
  for (const m of vars) {
    const base = porId(m.variante.de);
    for (const k of ['fw', 'ips', 'ngfw', 'tp', 'vpn', 'sess', 'cps', 'ssl', 'tunGw', 'aps', 'switches']) {
      assert.strictEqual(m[k], base[k], `${m.id}.${k} tiene que ser la celda común con ${base.id}`);
    }
    assert.match(m.variante.fuente, /^ficha por serie F(G|GFWF)-/, m.id);
    assert.ok(m.wifi || m.celular, `${m.id}: una variante existe por su Wi-Fi o su módem`);
    // Documentos que no nombran a la variante: no se heredan.
    assert.strictEqual(m.pqc, null, `${m.id}: la Maximum Values Table no la lista`);
    assert.strictEqual(m.bgpPeers, null, m.id);
    assert.strictEqual(m.eolAnnounced, null, m.id);
    assert.notStrictEqual(m.psu.watts, undefined, m.id);
  }
});

test('sin pedir Wi-Fi ni celular, ninguna variante compite y la huella de antes no cambia', () => {
  for (const down of [50, 300, 2000, 8000]) {
    const r = ev(esc({}, [{ id: 1, tipo: 'DIA', down }]));
    assert.ok(r.candidatos.every((c) => !c.modelo.variante), `${down} Mbps: una variante entró sin pedirse`);
    assert.ok(!r.alternativas.some((c) => c.modelo.variante));
  }
  // `false` y «no está» son lo mismo: la huella de un escenario guardado antes de los campos
  // nuevos no cambia, y un escenario que los trae vacíos tampoco.
  const viejo = esc();
  const conVacios = esc({ wifi: false });
  assert.strictEqual(ev(viejo).scenarioHash, ev(conVacios).scenarioHash);
  assert.ok(!('wifi' in ev(conVacios).snapshot.fisico));
  assert.ok(!('celular' in ev(viejo).snapshot.fisico));
});

test('Wi-Fi integrado: solo FortiWiFi, y el SKU base se aparta con la alternativa FortiAP', () => {
  const r = ev(esc({ wifi: true }));
  assert.strictEqual(r.recomendacion.id, 'FortiWiFi 30G');
  assert.ok(r.elegibles.every((c) => c.modelo.wifi));
  const fg = r.descartados.find((c) => c.id === 'FortiGate 30G');
  const b = fg.bloqueos.find((x) => x.codigo === 'WIFI_NO_INTEGRADO');
  assert.ok(b);
  assert.match(b.correccion, /FortiAP/);
  // Sin precio extraído y con código regional: borrador, y diciendo por qué.
  assert.strictEqual(r.quoteGate, 'DRAFT');
  const msg = JSON.stringify(r.bom.bloqueos);
  assert.match(msg, /lista-sin-extraer/);
  assert.match(msg, /no es que la lista no los traiga/);
  assert.match(msg, /sku-codigo-regional/);
  assert.doesNotMatch(msg, /no tiene SKU vigente/);
  const equipo = r.bom.filas.find((f) => f.cat === 'Equipo');
  assert.strictEqual(equipo.sku, 'FWF-30G-[RC]');
  assert.strictEqual(equipo.unit, null);
});

test('4G integrado: el 40F-3G4G con su precio y sus licencias de la lista firmada', () => {
  const r = ev(esc({ celular: '4g', celularVia: 'integrado' }, [{ id: 1, tipo: 'DIA', down: 300 }, { id: 2, tipo: '4G/5G', down: 100, rol: 'respaldo' }]));
  assert.strictEqual(r.recomendacion.id, 'FortiGate 40F-3G4G');
  assert.ok(r.elegibles.every((c) => c.modelo.celular));
  const equipo = r.bom.filas.find((f) => f.cat === 'Equipo');
  assert.strictEqual(equipo.sku, 'FG-40F-3G4G-BDL-809-36');
  const lista = new Map(SKUS['FortiGate 40F'].map((x) => [x.sku, x.p]));
  assert.strictEqual(equipo.unit, lista.get('FG-40F-3G4G-BDL-809-36'));
  // El módem no publica su caudal: se avisa, no se aprueba ni se aparta a ciegas.
  assert.ok(r.avisos.some((a) => a.codigo === 'CELULAR_SIN_CAUDAL' && /100 Mbps/.test(a.mensaje)));
  assert.notStrictEqual(r.quoteGate, 'BLOCKED');
});

test('5G integrado: el 40F-3G4G (LTE) se aparta, y Wi-Fi + 5G solo deja el FortiWiFi 50G-5G-II', () => {
  const r = ev(esc({ celular: '5g', celularVia: 'integrado' }));
  assert.strictEqual(r.recomendacion.id, 'FortiGate 50G-5G');
  const lte = r.descartados.find((c) => c.id === 'FortiGate 40F-3G4G');
  assert.ok(lte.bloqueos.some((b) => b.codigo === 'CELULAR_SIN_5G'));
  const ambos = ev(esc({ wifi: true, celular: '5g', celularVia: 'integrado' }));
  assert.deepStrictEqual(ambos.elegibles.map((c) => c.id), ['FortiWiFi 50G-5G-II']);
});

test('celular sin elegir cómo llega: falta el dato, no se elige por silencio', () => {
  const r = ev(esc({ celular: '5g' }));
  assert.deepStrictEqual(r.faltan, ['fisico.celularVia']);
  assert.strictEqual(r.quoteGate, 'BLOCKED');
  assert.strictEqual(r.campos['fisico.celularVia'].requerido, true);
  // Y sin celular, el «cómo» no aplica y no viaja.
  const sin = ev(esc({ celularVia: 'extender' }));
  assert.ok(sin.inactivos.includes('fisico.celularVia'));
  assert.ok(!('celularVia' in sin.snapshot.fisico));
});

test('FortiExtender: por generación y bajada del enlace, uno por enlace, y sin precio inventado', () => {
  const enl = (down, n) => [{ id: 1, tipo: 'DIA', down: 300 }].concat(Array.from({ length: n || 1 }, (_, i) => ({ id: i + 2, tipo: '4G/5G', down, rol: 'respaldo' })));
  // 4G a 250 Mbps: el 101G (CAT-6, 300 Mbps) llega y va primero.
  let r = ev(esc({ celular: '4g', celularVia: 'extender' }, enl(250)));
  assert.strictEqual(r.celular.extender.recomendado.id, 'FortiExtender 101G');
  // 4G a 400 Mbps: el 101G se aparta por su módem y va el 211G (CAT-12, 600 Mbps).
  r = ev(esc({ celular: '4g', celularVia: 'extender' }, enl(400, 2)));
  assert.strictEqual(r.celular.extender.recomendado.id, 'FortiExtender 211G');
  assert.ok(r.celular.extender.descartados.some((d) => d.x.id === 'FortiExtender 101G' && /300 Mbps/.test(d.motivo)));
  const linea = r.bom.filas.find((f) => f.cat === 'WAN celular');
  assert.strictEqual(linea.sku, 'FEX-211G');
  assert.strictEqual(linea.qty, 2, 'uno por enlace 4G/5G');
  assert.strictEqual(linea.unit, null);
  assert.ok(r.bom.filas.some((f) => f.cat === 'Soporte' && f.sku === 'FC-10-X211G-247-02-36'));
  assert.ok(r.bom.bloqueos.some((b) => b.codigo === 'fex-sin-precio' && /No es que la lista no los traiga/.test(b.mensaje)));
  // El FortiGate se elige como siempre: ninguna variante con módem.
  assert.ok(!r.recomendacion.modelo.variante);
  // Los de una sola región no se recomiendan solos.
  assert.ok(!['FortiExtender 201F', 'FortiExtender 202F'].includes(r.celular.extender.recomendado.id));
  // 5G: solo los 5G; el WAN 50G publica su módem y va antes que el 511G, que no lo publica.
  r = ev(esc({ celular: '5g', celularVia: 'extender' }, enl(500)));
  assert.strictEqual(r.celular.extender.recomendado.id, 'FortiExtender WAN 50G');
  assert.ok(r.celular.extender.descartados.every((d) => /no es 5G/.test(d.motivo)));
  const l5 = r.bom.filas.find((f) => f.cat === 'WAN celular');
  assert.strictEqual(l5.sku, null, 'FEW-50G-AM o -EA: se elige por región');
  assert.match(l5.nota, /FEW-50G-AM para Norteamérica/);
  // Tres enlaces 4G/5G: un FortiGate admite dos FortiExtender en extensión de WAN.
  r = ev(esc({ celular: '4g', celularVia: 'extender' }, enl(100, 3)));
  assert.ok(r.bloqueos.some((b) => b.codigo === 'fex-demasiados' && /2 per FGT/.test(b.mensaje)));
  // A 5 Gbps no llega ninguno: bloqueo con los motivos.
  r = ev(esc({ celular: '5g', celularVia: 'extender' }, [{ id: 1, tipo: '4G/5G', down: 5000 }]));
  assert.strictEqual(r.celular.extender.recomendado, null);
  assert.ok(r.bloqueos.some((b) => b.codigo === 'fex-sin-candidato'));
});

test('un enlace 4G/5G sin decir cómo llega se avisa', () => {
  const r = ev(esc({}, [{ id: 1, tipo: '4G/5G', down: 50 }]));
  assert.ok(r.avisos.some((a) => a.codigo === 'enlace-celular-sin-equipo'));
});

test('las licencias de las variantes celulares salen por SKU exacto de la lista firmada', () => {
  const declarado = new Map(Object.values(SKUS).flat().map((r) => [r.sku, r.p]));
  for (const id of ['FortiGate 40F-3G4G', 'FortiGate 50G-5G', 'FortiGate 51G-5G']) {
    const m = porId(id);
    assert.strictEqual(m.listaSinExtraer, false);
    for (const k of ['ent', 'utp', 'atp', 'entBdl', 'utpBdl']) {
      const t = m.lic[k];
      assert.ok(t && t.sku, `${id}.${k}`);
      for (const [y, suf] of [['y1', '12'], ['y3', '36'], ['y5', '60']]) {
        assert.strictEqual(t[y], declarado.get(t.sku.replace(/-DD$/, `-${suf}`)), `${id}.${k}.${y}`);
      }
    }
  }
  for (const m of F.MODELS.filter((x) => x.variante && /^FortiWiFi/.test(x.id))) {
    assert.strictEqual(m.lic, null, m.id);
    assert.strictEqual(m.listaSinExtraer, true, m.id);
  }
});

test('FortiExtender: cada fila de la tabla cita su ficha y no inventa el caudal del 511G', () => {
  assert.match(F.FORTIEXTENDER.url, /^https:\/\/www\.fortinet\.com\/.+FortiExtender\.pdf$/);
  for (const x of F.FORTIEXTENDER.modelos) {
    assert.ok(['4G', '5G'].includes(x.gen), x.id);
    assert.ok(x.skus.length >= 1 && x.skus.every((s) => /^FE[XW]-/.test(s)), x.id);
    assert.ok(x.nat > 0, `${x.id}: reenvío LAN-WAN publicado`);
  }
  const fex511 = F.FORTIEXTENDER.modelos.find((x) => x.id === 'FortiExtender 511G');
  assert.strictEqual(fex511.bajada, null);
});
