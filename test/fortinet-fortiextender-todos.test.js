'use strict';
// TODOS LOS FORTIEXTENDER DE LA FICHA Y LA GUÍA DE PEDIDO (2026-11-11, encargo del dueño: «todos los
// equipos referencia FEX»). La tabla tenía siete; la ficha R57 trae además el 200F y la guía de pedido
// R18 los Vehicle 211F, 212F y 511G y el Rugged 511G, con sus cifras en la ficha Rugged R08. Fija:
//   1. están los doce, cada uno con las cifras de SU documento y nada inventado;
//   2. sin pedir entorno, la recomendación es la de antes: los nuevos no compiten;
//   3. pedido vehículo o exterior, solo compiten los de ese entorno;
//   4. el 200F, sin módem, nunca sirve un enlace 4G/5G y lo dice.
const test = require('node:test');
const assert = require('node:assert');

const F = require('../server/seed/legacyData/fortinet.js');
const M = require('../public/js/fortinet-motor.js');
const { FUENTES } = require('../server/seed/legacyData/fuentes');

const CAT = { models: F.MODELS.map((m) => ({ ...m, eol: !m.hwSku })), bundles: F.BUNDLES, care: F.CARE,
  funciones: F.FUNCIONES, serviciosSdwan: F.SERVICIOS_SDWAN, terminos: F.TERMINOS, fortios: F.FORTIOS,
  ems: F.EMS_LICENCIAS, sase: F.SASE_USUARIOS, extenders: F.FORTIEXTENDER, datasetVersion: 'fortinet@prueba' };
const HOY = { hoy: '2026-11-11T00:00:00Z' };
const enl = (down) => [{ id: 1, tipo: 'DIA', down: 300 }, { id: 2, tipo: '4G/5G', down, rol: 'respaldo' }];
const ev = (fisico, down) => M.evaluar({ topologia: { rol: 'none', enlaces: enl(down || 200) }, seguridad: { capa: 'tp' }, fisico }, CAT, HOY);
const de = (id) => F.FORTIEXTENDER.modelos.find((x) => x.id === id);
const RUGGED = 'FortiExtender Rugged Data Sheet (FEXR-DAT-R08-20260805)';

test('la tabla trae los doce FortiExtender de la ficha y la guía de pedido', () => {
  assert.deepStrictEqual(F.FORTIEXTENDER.modelos.map((x) => x.id).sort(), [
    'FortiExtender 101G', 'FortiExtender 200F', 'FortiExtender 201F', 'FortiExtender 202F', 'FortiExtender 211G',
    'FortiExtender 511G', 'FortiExtender 511G-WiFi', 'FortiExtender Rugged 511G', 'FortiExtender Vehicle 211F',
    'FortiExtender Vehicle 212F', 'FortiExtender Vehicle 511G', 'FortiExtender WAN 50G']);
});

test('los de vehículo y exterior llevan las cifras de la ficha Rugged y la citan', () => {
  const v211 = de('FortiExtender Vehicle 211F');
  const v212 = de('FortiExtender Vehicle 212F');
  const v511 = de('FortiExtender Vehicle 511G');
  const r511 = de('FortiExtender Rugged 511G');
  for (const x of [v211, v212, v511, r511]) {
    assert.strictEqual(x.fuente, RUGGED, x.id);
    assert.match(x.url, /^https:\/\/www\.fortinet\.com\/.+fortiextender-rugged\.pdf$/, x.id);
    assert.ok(['vehiculo', 'exterior'].includes(x.entorno), x.id);
  }
  // «Bandwidth and Throughput Information» y «Ordering Information» de la R08.
  assert.deepStrictEqual([v211.bajada, v211.subida, v211.nat, v211.ipsec, v211.maxW, v211.modems], [600, 150, 930, 120, 22.74, 1]);
  assert.deepStrictEqual([v212.bajada, v212.subida, v212.nat, v212.ipsec, v212.maxW, v212.modems], [600, 150, 930, 120, 22.74, 2]);
  assert.deepStrictEqual([v511.bajada, v511.subida, v511.nat, v511.ipsec, v511.maxW], [3400, 460, 940, 400, 20]);
  assert.deepStrictEqual([r511.nat, r511.ipsec, r511.maxW, r511.entorno], [940, 400, 16, 'exterior']);
  assert.deepStrictEqual(v211.skus, ['FEV-211F-AM', 'FEV-211F']);
  assert.deepStrictEqual(v212.skus, ['FEV-212F-AM', 'FEV-212F']);
  assert.strictEqual(v511.care, 'FC-10-FV51G-247-02-DD');
  assert.strictEqual(r511.care, 'FC-10-XR51G-247-02-DD');
  // Lo que la ficha no publica no se rellena: la bajada del módem del Rugged no está en su pedido.
  assert.strictEqual(r511.bajada, null, 'la bajada del Rugged 511G no se toma del Vehicle por llevar el mismo módem');
  assert.strictEqual(r511.subida, null);
});

test('la ficha Rugged es una fuente declarada, con URL y estable', () => {
  const f = FUENTES.fortinet.find((x) => x.documento === RUGGED);
  assert.ok(f, 'entrada en fuentes.js');
  assert.strictEqual(f.url, de('FortiExtender Rugged 511G').url);
  assert.strictEqual(f.estable, true);
  for (const n of ['FEV-211F', 'FEV-212F', 'FEV-511G', 'FER-511G']) assert.ok(f.cubre.includes(n), `${n} en lo que cubre`);
});

test('sin pedir entorno nada cambia: los de vehículo, exterior y el 200F no compiten', () => {
  for (const [gen, espera] of [['4g', 'FortiExtender 101G'], ['5g', 'FortiExtender WAN 50G']]) {
    const r = ev({ celular: gen, celularVia: 'extender' });
    const fex = r.celular.extender;
    assert.strictEqual(fex.recomendado.id, espera, gen);
    const fuera = [fex.recomendado, ...fex.alternativas].filter((x) => x.entorno || x.sinModem).map((x) => x.id);
    assert.deepStrictEqual(fuera, [], `ni recomendados ni alternativas: ${fuera.join(', ')}`);
    assert.ok(fex.descartados.some((d) => d.x.id === 'FortiExtender 200F' && /no tiene módem/.test(d.motivo)));
    assert.ok(fex.descartados.some((d) => d.x.id === 'FortiExtender Vehicle 511G' && /de vehículo: compite al pedir ese entorno/.test(d.motivo)));
    assert.ok(fex.descartados.some((d) => d.x.id === 'FortiExtender Rugged 511G' && /de exterior: compite al pedir ese entorno/.test(d.motivo)));
  }
});

test('la huella no cambia sin pedirlo, y el entorno solo existe con FortiExtender', () => {
  const base = ev({ celular: '4g', celularVia: 'extender' });
  assert.ok(!('celularEntorno' in base.snapshot.fisico));
  const veh = ev({ celular: '4g', celularVia: 'extender', celularEntorno: 'vehiculo' });
  assert.strictEqual(veh.snapshot.fisico.celularEntorno, 'vehiculo');
  assert.notStrictEqual(veh.scenarioHash, base.scenarioHash);
  // Con módem integrado, o sin celular, el entorno no tiene a qué aplicarse y no viaja.
  const integ = ev({ celular: '5g', celularVia: 'integrado', celularEntorno: 'vehiculo' });
  assert.ok(!('celularEntorno' in integ.snapshot.fisico));
  assert.strictEqual(integ.scenarioHash, ev({ celular: '5g', celularVia: 'integrado' }).scenarioHash);
});

test('vehículo: 4G va al Vehicle 211F y 5G al Vehicle 511G; los de interior se apartan', () => {
  let r = ev({ celular: '4g', celularVia: 'extender', celularEntorno: 'vehiculo' }, 400);
  let fex = r.celular.extender;
  assert.strictEqual(fex.recomendado.id, 'FortiExtender Vehicle 211F');
  assert.deepStrictEqual(fex.alternativas.map((x) => x.id), ['FortiExtender Vehicle 212F', 'FortiExtender Vehicle 511G']);
  assert.ok(fex.descartados.some((d) => d.x.id === 'FortiExtender 211G' && /de interior y se pidió de vehículo/.test(d.motivo)));
  assert.strictEqual(fex.fuente, RUGGED, 'el resultado cita la ficha del equipo elegido');
  const fila = r.bom.filas.find((f) => f.cat === 'WAN celular');
  assert.match(fila.desc, /FortiExtender Vehicle 211F/);
  assert.strictEqual(fila.sku, null, 'dos SKU por región: se elige');
  assert.strictEqual(fila.unit, null, 'sin precio inventado');
  assert.match(fila.nota, /FEV-211F-AM para Norteamérica/);
  assert.match(fila.nota, /7 a 36 V CC/);

  r = ev({ celular: '5g', celularVia: 'extender', celularEntorno: 'vehiculo' }, 800);
  fex = r.celular.extender;
  assert.strictEqual(fex.recomendado.id, 'FortiExtender Vehicle 511G');
  assert.ok(fex.descartados.some((d) => d.x.id === 'FortiExtender Vehicle 211F' && /no es 5G/.test(d.motivo)));
  assert.strictEqual(r.bom.filas.find((f) => f.cat === 'WAN celular').sku, 'FEV-511G');
  // 950 Mbps no caben en su reenvío LAN-WAN de 940: se aparta con la cifra, no se recomienda igual.
  r = ev({ celular: '5g', celularVia: 'extender', celularEntorno: 'vehiculo' }, 950);
  assert.strictEqual(r.celular.extender.recomendado, null);
  assert.ok(r.celular.extender.descartados.some((d) => d.x.id === 'FortiExtender Vehicle 511G' && /reenvía 940 Mbps/.test(d.motivo)));
});

test('exterior: el Rugged 511G, y avisa de que su ficha no publica el caudal del módem', () => {
  const r = ev({ celular: '5g', celularVia: 'extender', celularEntorno: 'exterior' }, 500);
  assert.strictEqual(r.celular.extender.recomendado.id, 'FortiExtender Rugged 511G');
  assert.deepStrictEqual(r.celular.extender.alternativas, []);
  const todos = [...(r.avisos || []), ...((r.bom && r.bom.avisos) || [])].map((a) => a.mensaje || '').join(' | ') + JSON.stringify(r);
  assert.match(todos, /La ficha de FortiExtender Rugged 511G no publica el caudal de su módem/);
  // 4G en exterior: el Rugged es 5G y también da LTE; es el único de exterior.
  const r4 = ev({ celular: '4g', celularVia: 'extender', celularEntorno: 'exterior' }, 100);
  assert.strictEqual(r4.celular.extender.recomendado.id, 'FortiExtender Rugged 511G');
});

test('cada FortiExtender de la tabla tiene su figura, salvo el que ningún documento traído dibuja', () => {
  const fs = require('fs');
  const path = require('path');
  const vistas = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'public/data/fortinet-vistas-equipos.json'), 'utf8'));
  const { FORTIEXTENDER } = require('../server/seed/legacyData/fortinet.js');
  // La ficha Rugged (FEXR-DAT-R08) dibuja el Vehicle 211F, el Vehicle 511G y el Rugged 511G; del
  // Vehicle 212F solo da la tabla. Servirle la figura del 211F sería la de otro equipo.
  const SIN_FIGURA = { 'FortiExtender Vehicle 212F': 'la ficha Rugged no lo dibuja y su QuickStart Guide no se ha traído' };
  for (const x of FORTIEXTENDER.modelos) {
    const v = vistas[x.id];
    if (SIN_FIGURA[x.id]) { assert.ok(!v, `${x.id}: ya tiene figura; quítalo de SIN_FIGURA`); continue; }
    assert.ok(v && v.front, `${x.id}: sin figura de su cara de puertos`);
    assert.ok(v.rear || v.rearNota, `${x.id}: sin la otra cara y sin decir por qué`);
  }
  for (const id of Object.keys(SIN_FIGURA)) assert.ok(FORTIEXTENDER.modelos.some((x) => x.id === id), `${id} ya no está en la tabla`);
  // Las de la ficha Rugged llevan la leyenda de su lista «Interfaces» en la cara numerada.
  for (const id of ['FortiExtender Vehicle 211F', 'FortiExtender Vehicle 511G', 'FortiExtender Rugged 511G']) {
    assert.match(vistas[id].fuente, /FEXR-DAT-R08-20260805/);
    assert.ok(vistas[id].frontLeyenda && !vistas[id].rearLeyenda, `${id}: la leyenda va en la cara de puertos y solo en ella`);
  }
});
