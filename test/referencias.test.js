'use strict';
// Referencias de pedido de un equipo (server/services/referencias.js).
//
// Lo que se prueba es lo que haria MENTIR a esta pantalla, que es donde alguien va a copiar un
// numero de parte para una propuesta:
//   1. Que un fabricante sin referencias se DECLARE, en vez de devolver una lista vacia que se
//      lee como «este equipo no necesita nada».
//   2. Que las variantes de Aruba, que van sin numero de parte porque HPE no lo publica, no se
//      presenten como referencias de pedido.
//   3. Que el precio venga del mismo sitio que el cotizador, y no de una segunda copia.

const test = require('node:test');
const assert = require('node:assert');
const { referenciasDe } = require('../server/services/referencias.js');

test('Fortinet devuelve las referencias del equipo, con precio y tipo', () => {
  const r = referenciasDe('fortinet', 'FortiGate 120G');
  assert.ok(r.refs.length > 10, 'un FortiGate trae decenas de referencias');
  const hw = r.refs.find((x) => x.sku === 'FG-120G');
  assert.ok(hw, 'incluye su propio SKU de hardware');
  assert.strictEqual(hw.t, 'HW');
  assert.ok(hw.p > 0, 'y su precio de lista');
  assert.match(r.fuente, /Price list/i);
});

test('el precio del hardware es EL MISMO que cotiza el cotizador, no una segunda copia', () => {
  // Dos sitios con el mismo dato es como se desincronizan los catalogos. Aqui se comprueba que
  // ambos salen de la misma lista de precios.
  const cot = require('../server/seed/legacyData/cotizadorCatalog.js');
  const CAT = Array.isArray(cot) ? cot : (cot.CATALOG || Object.values(cot).find(Array.isArray));
  const fj = require('../server/seed/legacyData/fortinet.js');
  const M = fj.MODELS || Object.values(fj).find(Array.isArray);

  let comprobados = 0;
  for (const it of CAT.filter((x) => /fortinet/i.test(x.vendor || ''))) {
    const m = M.find((x) => x.id === it.model);
    if (!m || !m.hwSku) continue;
    const r = referenciasDe('fortinet', it.model);
    const hw = r.refs.find((x) => x.sku === m.hwSku);
    if (!hw) continue;
    assert.strictEqual(hw.p, it.elpN, `${it.model}: la referencia dice ${hw.p} y el cotizador ${it.elpN}`);
    comprobados += 1;
  }
  assert.ok(comprobados >= 50, `se comprobaron ${comprobados} modelos`);
});

test('Aruba no presenta como numero de parte lo que HPE no publica', () => {
  const r = referenciasDe('aruba', 'EC-XS');
  assert.ok(r.refs.length, 'trae variantes');
  // La mayoria va con sku null: son variantes de producto, no referencias de pedido.
  assert.ok(r.refs.some((x) => x.sku === null), 'las variantes sin numero de parte se conservan como tales');
  assert.match(r.nota, /no publica n[uú]mero de parte/i, 'y la nota lo dice');
  // EC-XS-SP y EC-XS-FIPS no tienen SKU propio confirmado, asi que tampoco tienen precio.
  assert.ok(r.refs.filter((x) => x.sku === null).every((x) => x.p === null), 'sin SKU no hay precio que atarle');
});

test('Aruba SI trae List Price (sin descuento de distribuidor) para el SKU de cabecera confirmado', () => {
  // Desde el 2026-09-10 hay List Price real de HPE para 15 modelos (ver ARUBA_LIST_PRICE en
  // referencias.js); antes esta linea era el caso contrario ('Aruba no tiene lista de precios').
  const r = referenciasDe('aruba', 'EC-XS');
  const hw = r.refs.find((x) => x.sku === 'JM962A');
  assert.ok(hw, 'incluye el SKU de cabecera de EC-XS');
  assert.strictEqual(hw.p, 2752, 'con su List Price de HPE');
  assert.match(r.fuente, /distribuidor/i, 'la fuente distingue que ese precio no viene de la pagina de producto');
});

test('un fabricante sin referencias lo declara, no devuelve un hueco mudo', () => {
  for (const v of ['huawei', 'mikrotik', 'juniper', 'nokia']) {
    const r = referenciasDe(v, 'lo-que-sea');
    assert.strictEqual(r.refs.length, 0);
    assert.ok(r.nota && r.nota.length > 20, `${v} explica por que no tiene referencias`);
  }
});

test('un fabricante fuera de la lista devuelve null, no un objeto vacio', () => {
  assert.strictEqual(referenciasDe('marte', 'x'), null);
  assert.strictEqual(referenciasDe('', 'x'), null);
});

test('un modelo que no existe devuelve lista vacia con su motivo, sin reventar', () => {
  const r = referenciasDe('fortinet', 'FortiGate 9999X');
  assert.strictEqual(r.refs.length, 0);
  assert.ok(r.nota);
});
