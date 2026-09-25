'use strict';
/* ══ PRECIOS Y TERMINOS DE FORTINET CONTRA LA PRICE LIST DECLARADA (2026-09-23) ══════════
   Dos hallazgos del mismo dia, los dos en la cifra que se pone delante de un cliente:

   N02  LICENSES (licencias, soporte y SKU combinados BDL) se transcribio de la price list de
        AGOSTO, y la fuente de precios declarada —de la que salen el hardware y las 6.849
        referencias— es la de SEPTIEMBRE. 108 de 1.193 precios por termino no cuadraban, y
        con el SKU combinado de compra nueva la diferencia llegaba entera al total.
   F18  una referencia de 60 meses se describe en la lista como «1 Year».

   Y la regla del dueño (2026-09-24): «los precios debes tomarlos de 2026Q3 Mid Price
   list_AMER_FINAL_EFF 090726.xlsx». Ese dia se retiraron los 17 precios de agosto que se
   conservaban marcados, y FortiConverter dejo de cotizar a 3 y 5 anos un SKU que la lista no
   tiene.

   Lo que se fija aqui son INVARIANTES, no cifras: que todo precio que puede llegar a una linea
   existe en la lista declarada con esa misma cifra, que lo que no trae sale sin precio y
   bloquea la cotizacion en firme, y que ninguna descripcion servida contradice el termino de
   su codigo. Si mañana se regenera `fortinetSkus.js` con otra lista, estas pruebas siguen
   valiendo sin tocarlas. */
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

test('N02 · lo que la lista declarada no trae NO lleva precio: se marca, y el de agosto no se conserva', () => {
  let conPrecio = 0;
  let marcados = 0;
  for (const m of F.MODELS) {
    if (!m.lic) continue;
    for (const [k, t] of tiersDe(m.lic)) {
      if (!t || !t.sku) continue;
      for (const [y, suf] of TERMINOS) {
        if (DECLARADO.has(t.sku.replace(/-DD$/, `-${suf}`))) continue;
        if (t[y] != null) conPrecio += 1;
        if (t.fueraDeLista && t.fueraDeLista[y]) marcados += 1;
        assert.ok(!t.anterior, `${m.id} ${k}: la marca de la edicion de agosto ya no existe`);
      }
    }
  }
  assert.strictEqual(conPrecio, 0, 'un precio sin fila en la lista declarada no puede llegar a una linea');
  assert.strictEqual(marcados, F.REANCLAJE.sinReferencia, 'el informe de reanclaje cuenta lo mismo que se marco');
  assert.strictEqual(marcados, 17, 'los 17 de 70F, 100F, 200F y 600F: si cambia, que sea porque la lista los trae');
});

test('N02 · una linea sin precio en la lista sale sin precio, en borrador, y dice cual', () => {
  // El 70F es el caso real: fuera de venta, su renovacion UTP a 1 ano no esta en lo extraido
  // de la lista de septiembre. Antes salia con el precio de agosto; ahora sin ninguno.
  const m = F.MODELS.find((x) => x.id === 'FortiGate 70F');
  assert.ok(m.lic.utp.fueraDeLista && m.lic.utp.fueraDeLista.y1, 'el 70F trae su UTP a 1 ano marcado');
  const r = R.lineasComerciales({ modelo: m, bundles: F.BUNDLES, care: F.CARE, bundle: 'utp', care_elegido: 'fcpre',
    careKey: 'premium', qty: 1, anios: 1, terminos: F.TERMINOS, sinEquipo: true });
  const utp = r.filas.find((f) => f.cat === 'Licencias FortiGuard');
  assert.strictEqual(utp.sku, 'FC-10-0070F-950-02-12', 'el SKU exacto se conserva: es lo que hay que pedir');
  assert.strictEqual(utp.unit, null, 'y sin precio: el de agosto ya no se usa');
  const b = r.bloqueos.find((x) => x.codigo === 'precio-fuera-de-lista');
  assert.ok(b, 'la cotizacion no puede salir en firme con una linea sin precio');
  assert.strictEqual(b.nivel, 'borrador');
  assert.match(b.mensaje, /FC-10-0070F-950-02-12/);
  assert.match(b.mensaje, /2026Q3 Mid Price list/);
});

test('regla del dueño · todo precio que puede llegar a una linea sale de la lista declarada, al centimo', () => {
  // La auditoria del 2026-09-24 hecha prueba: cada precio del catalogo Fortinet que el BOM o
  // el cotizador pueden usar se busca por su SKU EXACTO (con el termino resuelto) en lo que
  // `npm run skus` extrajo de la 2026Q3 Mid Price list. Un precio sin fila, o con otra cifra,
  // vendria de otra fuente, y eso es lo que la regla prohibe.
  const malos = [];
  let comprobados = 0;
  const ver = (origen, sku, p) => {
    if (p == null) return;
    comprobados += 1;
    const q = DECLARADO.get(sku);
    if (q == null) malos.push(`${origen}: ${sku} no esta en la lista`);
    else if (Math.abs(q - p) > 0.005) malos.push(`${origen}: ${p} frente a ${q} de la lista`);
  };
  for (const m of F.MODELS) {
    const lic = m.lic || {};
    const tiers = tiersDe(lic).concat([['eliteUpg', lic.eliteUpg], ['sandboxAi', lic.sandboxAi],
      ['logCloud', lic.logCloud], ['sdwan', lic.sdwanSvc && lic.sdwanSvc.addon]]);
    for (const [k, t] of tiers) {
      if (!t || !t.sku) continue;
      for (const [y, suf] of TERMINOS) ver(`${m.id} ${k} ${y}`, t.sku.replace(/-DD$/, `-${suf}`), t[y]);
    }
    if (lic.converter && lic.converter.sku) ver(`${m.id} converter`, lic.converter.sku, lic.converter.fee);
  }
  // El hardware del cotizador, por el SKU de hardware de cada modelo.
  const C = require('../server/seed/legacyData/cotizadorCatalog.js');
  const CAT = Array.isArray(C) ? C : (C.CATALOG || Object.values(C).find(Array.isArray));
  const porId = new Map(F.MODELS.map((m) => [m.id, m]));
  for (const x of CAT.filter((c) => /fortinet/i.test(c.vendor || ''))) {
    const m = porId.get(x.model);
    assert.ok(m && m.hwSku, `${x.model}: el cotizador cotiza un equipo sin SKU de hardware`);
    ver(`cotizador ${x.model}`, m.hwSku, x.elpN);
  }
  assert.ok(comprobados > 1800, `se comprobaron ${comprobados} precios`);
  assert.deepStrictEqual(malos, []);
});

test('FortiConverter · el SKU es el de 12 meses de la lista, sea cual sea el termino', () => {
  // La lista lo publica una sola vez por modelo, «1 Year FCT SVC». A 3 y 5 anos el BOM
  // emitia -36 y -60, que la lista no tiene, con el precio del de 12 meses.
  const todas = Object.values(SKUS).flat().filter((r) => /-189-02-/.test(r.sku));
  assert.ok(todas.length > 50 && todas.every((r) => /-189-02-12$/.test(r.sku)),
    'la lista solo trae el converter a 12 meses; si un dia trae otros terminos, esta regla hay que revisarla');
  const m = F.MODELS.find((x) => x.id === 'FortiGate 90G');
  for (const anios of [1, 3, 5]) {
    const r = R.lineasComerciales({ modelo: m, bundles: F.BUNDLES, care: F.CARE, bundle: 'utp', care_elegido: 'fcpre',
      careKey: 'premium', qty: 1, anios, terminos: F.TERMINOS, converter: true });
    const c = r.filas.find((f) => /FortiConverter/.test(f.desc));
    assert.strictEqual(c.sku, 'FC-10-0090G-189-02-12', `a ${anios} ano(s)`);
    assert.strictEqual(c.unit, DECLARADO.get('FC-10-0090G-189-02-12'));
  }
  // Un modelo cuyo bloque no se extrajo no inventa el SKU: la linea no se pide sin el.
  const m70 = F.MODELS.find((x) => x.id === 'FortiGate 70F');
  assert.strictEqual(m70.lic.converter.sku, null);
  const r70 = R.lineasComerciales({ modelo: m70, bundles: F.BUNDLES, care: F.CARE, bundle: 'utp', care_elegido: 'fcpre',
    careKey: 'premium', qty: 1, anios: 3, terminos: F.TERMINOS, converter: true, sinEquipo: true });
  assert.ok(r70.bloqueos.some((b) => b.codigo === 'sin-sku-converter' && /2026Q3 Mid Price list/.test(b.mensaje)));
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
