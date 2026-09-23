'use strict';
/* ══ PRECIOS Y TERMINOS DE FORTINET CONTRA LA PRICE LIST DECLARADA (2026-09-23) ══════════
   Dos hallazgos del mismo dia, los dos en la cifra que se pone delante de un cliente:

   N02  LICENSES (licencias, soporte y SKU combinados BDL) se transcribio de la price list de
        AGOSTO, y la fuente de precios declarada —de la que salen el hardware y las 6.849
        referencias— es la de SEPTIEMBRE. 108 de 1.193 precios por termino no cuadraban, y
        con el SKU combinado de compra nueva la diferencia llegaba entera al total.
   F18  una referencia de 60 meses se describe en la lista como «1 Year».

   Lo que se fija aqui son INVARIANTES, no cifras: que todo precio que la lista declarada
   trae coincide con ella, que lo que no trae se marca y bloquea la cotizacion en firme, y
   que ninguna descripcion servida contradice el termino de su codigo. Si mañana se regenera
   `fortinetSkus.js` con otra lista, estas pruebas siguen valiendo sin tocarlas. */
const test = require('node:test');
const assert = require('node:assert');

const F = require('../server/seed/legacyData/fortinet.js');
const SKUS = require('../server/seed/legacyData/fortinetSkus.js');
const R = require('../public/js/fortinet-reglas.js');
const terminoSku = require('../server/services/terminoSku');
const { referenciasDe } = require('../server/services/referencias.js');

const DECLARADO = new Map();
for (const refs of Object.values(SKUS)) for (const r of refs) DECLARADO.set(r.sku, r.p);
const TERMINOS = [['y1', '12'], ['y3', '36'], ['y5', '60']];
const tiersDe = (lic) => [['ent', lic.ent], ['utp', lic.utp], ['atp', lic.atp], ['entBdl', lic.entBdl],
  ['utpBdl', lic.utpBdl]].concat(lic.care ? Object.entries(lic.care).map(([k, v]) => [`care.${k}`, v]) : []);

test('N02 · todo precio de LICENSES que la lista declarada trae coincide con ella al centimo', () => {
  const malos = [];
  let comparados = 0;
  for (const m of F.MODELS) {
    if (!m.lic) continue;
    for (const [k, t] of tiersDe(m.lic)) {
      if (!t || !t.sku) continue;
      for (const [y, suf] of TERMINOS) {
        if (t[y] == null) continue;
        const p = DECLARADO.get(t.sku.replace(/-DD$/, `-${suf}`));
        if (p == null) continue;
        comparados += 1;
        if (Math.abs(p - t[y]) > 0.005) malos.push(`${m.id} ${k} ${suf}m: ${t[y]} frente a ${p}`);
      }
    }
  }
  assert.ok(comparados > 1000, `se compararon ${comparados} precios`);
  assert.deepStrictEqual(malos, []);
});

test('N02 · lo que la lista declarada no trae se conserva MARCADO, nunca como precio vigente', () => {
  let sinMarca = 0;
  let marcados = 0;
  for (const m of F.MODELS) {
    if (!m.lic) continue;
    for (const [, t] of tiersDe(m.lic)) {
      if (!t || !t.sku) continue;
      for (const [y, suf] of TERMINOS) {
        if (t[y] == null || DECLARADO.has(t.sku.replace(/-DD$/, `-${suf}`))) continue;
        if (t.anterior && t.anterior[y]) marcados += 1; else sinMarca += 1;
      }
    }
  }
  assert.strictEqual(sinMarca, 0, 'un precio sin respaldo en la lista declarada tiene que ir marcado');
  assert.strictEqual(marcados, F.REANCLAJE.sinReferencia, 'el informe de reanclaje cuenta lo mismo que se marco');
});

test('N02 · una linea con precio de la edicion anterior sale en borrador y dice cual', () => {
  // El 70F es el caso real: fuera de venta, su renovacion UTP a 1 ano no esta en las
  // referencias de septiembre.
  const m = F.MODELS.find((x) => x.id === 'FortiGate 70F');
  assert.ok(m.lic.utp.anterior && m.lic.utp.anterior.y1, 'el 70F trae su UTP a 1 ano marcado');
  const r = R.lineasComerciales({ modelo: m, bundles: F.BUNDLES, care: F.CARE, bundle: 'utp', care_elegido: 'fcpre',
    careKey: 'premium', qty: 1, anios: 1, terminos: F.TERMINOS, sinEquipo: true });
  const b = r.bloqueos.find((x) => x.codigo === 'precio-edicion-anterior');
  assert.ok(b, 'la cotizacion no puede salir en firme con un precio de otra edicion');
  assert.strictEqual(b.nivel, 'borrador');
  assert.match(b.mensaje, /FC-10-0070F-950-02-DD/);
});

test('N02 · el SKU combinado cuesta lo mismo que equipo + bundle en toda la lista (no es un descuento)', () => {
  let casos = 0;
  for (const m of F.MODELS) {
    if (!m.lic || !m.lic.entBdl || !m.hwSku) continue;
    const hw = (SKUS[m.id] || []).find((r) => r.sku === m.hwSku);
    if (!hw) continue;
    for (const [y] of TERMINOS) {
      if (m.lic.entBdl[y] == null || !m.lic.ent || m.lic.ent[y] == null) continue;
      casos += 1;
      assert.ok(Math.abs(m.lic.entBdl[y] - (hw.p + m.lic.ent[y])) < 0.01, `${m.id} ${y}`);
    }
  }
  assert.ok(casos >= 150, `${casos} combinaciones comprobadas`);
});

test('F18 / T23 · ninguna referencia servida describe un termino distinto del de su codigo', () => {
  const malas = [];
  for (const modelo of Object.keys(SKUS)) {
    for (const r of referenciasDe('fortinet', modelo).refs) {
      const v = terminoSku.validar(r);
      if (!v.ok) malas.push(`${modelo}: ${r.sku} «${r.d}»`);
      // Y en particular la forma que el informe encontro: 60 meses descritos como un ano.
      if (/-60$/.test(r.sku) && /\b1\s*Year\b/i.test(r.d)) malas.push(`${r.sku} sigue diciendo 1 Year`);
    }
  }
  assert.deepStrictEqual(malas, []);
});

test('F18 · la correccion se declara: el texto original de la lista y el motivo viajan con la referencia', () => {
  const r = referenciasDe('fortinet', 'FortiGate 90G').refs.find((x) => x.sku === 'FG-90G-BDL-1082-60');
  assert.ok(r, 'la referencia sigue servida: se corrige, no se esconde');
  assert.match(r.d, /^5 Year /);
  assert.strictEqual(r.dLista, '1 Year HW, Sovereign SASE Security');
  assert.match(r.aviso, /60 meses/);
  // Lo coherente no se toca.
  const ok = referenciasDe('fortinet', 'FortiGate 90G').refs.find((x) => x.sku === 'FG-90G-BDL-809-60');
  assert.strictEqual(ok.dLista, undefined);
});

test('F18 · el validador lee las formas de la price list y no inventa terminos', () => {
  assert.strictEqual(terminoSku.mesesDeSku('FC-10-0090G-809-02-36'), 36);
  assert.strictEqual(terminoSku.mesesDeSku('FG-90G'), null, 'el hardware no lleva termino');
  assert.strictEqual(terminoSku.mesesDeSku('FC-10-0090G-809-02-DD'), null, 'un patron no es un termino');
  assert.strictEqual(terminoSku.mesesDeTexto('3 Year HW, FC Premium & ENT BDL SVC 7.4'), 36);
  assert.strictEqual(terminoSku.mesesDeTexto('5 Years Enterprise Protection'), 60);
  assert.strictEqual(terminoSku.mesesDeTexto('HW FG-90G'), null);
  assert.strictEqual(terminoSku.validar({ sku: 'X-60', d: 'sin termino en el texto' }).ok, true);
});
