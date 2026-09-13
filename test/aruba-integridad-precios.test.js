'use strict';
// Integridad entre el catalogo Aruba, la lista de precios (CSV) y los SKU de servicio.
//
// POR QUE ESTA PRUEBA EXISTE. El 2026-09-13 el panel «Añadir a la lista de materiales»
// mostraba numeros de parte duplicados y filas «sin valor»: el JS mezclaba al CSV las
// variantes declaradas en el catalogo (m.skus) que no tenian precio, y nadie lo detecto
// porque ninguna prueba cruzaba catalogo y lista de precios. Estas reglas convierten esa
// clase de fallo en ruido de CI: un modelo cuyo hwSku no es pedible, un SKU duplicado,
// una fila sin precio, un SKU de servicio mal tecleado o un estado PLC desconocido rompen
// la build aqui — no la cotizacion de un cliente.

const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const { MODELS, CARE, CARE_SKU, LICENSES, CENTRAL_TIERS, BOOST } = require('../server/seed/legacyData/aruba');

const csvFilas = fs.readFileSync(path.join(__dirname, '..', 'public', 'datasheets', 'aruba-lista-precios-hpe.csv'), 'utf8')
  .trim().split(/\r?\n/).slice(1).map((l) => l.split(','));
const porSku = new Map(csvFilas.map((c) => [c[0], { mod: c[1], p: c[3] === '' ? null : Number(c[3]), plc: c[5] }]));

// Modelos sin SKU base pedible, declarados a proposito: EC-V es virtual (se cotiza por
// suscripcion) y la serie 7000/7200 se pide remanufacturada (filas …R del CSV). Si un
// modelo nuevo entra sin hwSku, hay que declararlo aqui con su motivo — no pasa de contrabando.
const SIN_HW_SKU_DECLARADO = new Set(['EC-V', '7005', '7008', '7010', '7024', '7030', '7205', '7210', '7220', '7240XM']);

// `modelo_dimensionador` del CSV que no es un modelo: son las familias de servicio.
const FAMILIAS_CSV = new Set([
  'Suscripcion EdgeConnect Foundation', 'Suscripcion EdgeConnect Advanced', 'Suscripcion EdgeConnect On-Premises',
  'Boost EdgeConnect (SaaS)', 'Boost EdgeConnect (On-Premises)', 'Central (gateways 70xx/90xx)',
]);

// Estados del ciclo de vida que la pagina sabe pintar (columna PLC Status del export):
// GA = se puede pedir; ES = End of Sale (fin de venta, se marca en ambar). Un valor nuevo
// obliga a decidir como se muestra — no se cuela sin avisar.
const PLC_CONOCIDOS = new Set(['GA', 'ES']);

test('todo modelo con hwSku lo tiene en la lista de precios, con precio', () => {
  const faltan = MODELS.filter((m) => m.hwSku)
    .filter((m) => { const f = porSku.get(m.hwSku); return !f || f.p == null; })
    .map((m) => `${m.id} (${m.hwSku})`);
  assert.deepStrictEqual(faltan, [],
    'un modelo cuyo SKU base no es pedible cotiza «consultar» sin que nadie lo sepa');
});

test('todo modelo sin hwSku esta declarado a proposito', () => {
  const sinDeclarar = MODELS.filter((m) => !m.hwSku && !SIN_HW_SKU_DECLARADO.has(m.id)).map((m) => m.id);
  assert.deepStrictEqual(sinDeclarar, [],
    'un modelo sin SKU base y sin motivo documentado es el «SKU sin valor» de manana');
});

test('no hay SKU duplicados en la lista de precios', () => {
  const vistos = new Set(); const repetidos = [];
  for (const c of csvFilas) { if (vistos.has(c[0])) repetidos.push(c[0]); vistos.add(c[0]); }
  assert.deepStrictEqual(repetidos, [], 'un SKU duplicado pinta dos veces la misma linea pedible');
});

test('ninguna fila de la lista va sin precio', () => {
  const vacias = csvFilas.filter((c) => c[3] === '').map((c) => c[0]);
  assert.deepStrictEqual(vacias, [], 'una fila sin precio es una fila «consultar» en el panel de añadir');
});

test('todo modelo_dimensionador del CSV existe en el catalogo o es familia conocida', () => {
  const ids = new Set(MODELS.map((m) => m.id));
  const huerfanos = [...new Set(csvFilas.map((c) => c[1]))].filter((x) => !ids.has(x) && !FAMILIAS_CSV.has(x));
  assert.deepStrictEqual(huerfanos, [], 'una fila que no cuelga de ningun modelo ni familia es ruido en el panel');
});

test('los estados PLC de la lista son los que la pagina sabe pintar', () => {
  const raros = [...new Set(csvFilas.map((c) => c[5]))].filter((x) => !PLC_CONOCIDOS.has(x));
  assert.deepStrictEqual(raros, [], 'un estado PLC nuevo necesita su decision de UI (ver sku-plc-es)');
});

test('los SKU de suscripcion, Boost y Central del seed estan en el CSV con el mismo precio', () => {
  const mal = [];
  const cruza = (origen, sku, precio) => {
    const f = porSku.get(sku);
    if (!f) { mal.push(`${origen}: ${sku} no esta en el CSV`); return; }
    if (f.p !== precio) mal.push(`${origen}: ${sku} seed=${precio} csv=${f.p}`);
  };
  for (const [bw, lic] of Object.entries(LICENSES)) {
    for (const [nivel, t] of Object.entries(lic)) {
      for (const [term, sku] of Object.entries(t.sku || {})) cruza(`${bw}/${nivel}/${term}`, sku, t[term]);
    }
  }
  for (const [k, t] of Object.entries(CENTRAL_TIERS)) {
    for (const [term, sku] of Object.entries(t.sku)) cruza(`central/${k}/${term}`, sku, t[term]);
  }
  for (const modal of ['saas', 'onprem']) {
    const blk = BOOST[modal].bloque100;
    for (const [term, sku] of Object.entries(blk.sku || {})) cruza(`boost/${modal}/${term}`, sku, blk[term]);
  }
  assert.deepStrictEqual(mal, [], 'seed y lista cuentan dos precios distintos para el mismo SKU');
});

test('CARE_SKU cuelga de modelos y niveles reales, con los tres terminos completos', () => {
  const ids = new Set(MODELS.map((m) => m.id));
  const niveles = new Set(Object.keys(CARE));
  const mal = [];
  for (const [modelo, porNivel] of Object.entries(CARE_SKU)) {
    if (!ids.has(modelo)) mal.push(`${modelo}: no es un modelo del catalogo`);
    for (const [nivel, porTerm] of Object.entries(porNivel)) {
      if (!niveles.has(nivel)) mal.push(`${modelo}/${nivel}: no es un nivel CARE`);
      for (const term of ['y1', 'y3', 'y5']) {
        const par = porTerm[term];
        if (!par || typeof par[0] !== 'string' || !par[0] || !(par[1] > 0)) {
          mal.push(`${modelo}/${nivel}/${term}: falta SKU o precio positivo`);
        }
      }
    }
  }
  assert.deepStrictEqual(mal, [], 'un CARE_SKU incompleto vuelve a mostrar «— / consultar» en el BOM');
});

test('el fin de venta declarado tiene fechas de verdad y coherentes', () => {
  // Misma regla que catalogo-eol.test.js para Cisco/Fortinet: una fecha ilegible deja al
  // equipo recomendandose solo (ficha.js eosVencido parsea lastOrder en el navegador), y
  // el fin de soporte no puede ser anterior al ultimo pedido.
  const mal = [];
  for (const m of MODELS.filter((x) => x.eolAnnounced)) {
    const { lastOrder, endOfSupport } = m.eolAnnounced;
    if (!Number.isFinite(Date.parse(lastOrder))) mal.push(`${m.id}: lastOrder ilegible (${lastOrder})`);
    if (endOfSupport != null) {
      if (!Number.isFinite(Date.parse(endOfSupport))) mal.push(`${m.id}: endOfSupport ilegible (${endOfSupport})`);
      else if (Number.isFinite(Date.parse(lastOrder)) && Date.parse(endOfSupport) <= Date.parse(lastOrder)) {
        mal.push(`${m.id}: el fin de soporte (${endOfSupport}) no puede ser anterior al ultimo pedido (${lastOrder})`);
      }
    }
  }
  assert.deepStrictEqual(mal, []);
});

test('los SKU de servicio de CARE_SKU no chocan con la lista de precios', () => {
  const choques = [];
  for (const [modelo, porNivel] of Object.entries(CARE_SKU)) {
    for (const [nivel, porTerm] of Object.entries(porNivel)) {
      for (const [term, [sku]] of Object.entries(porTerm)) {
        if (porSku.has(sku)) choques.push(`${modelo}/${nivel}/${term}: ${sku}`);
      }
    }
  }
  assert.deepStrictEqual(choques, [], 'el mismo SKU no puede vivir en dos fuentes con dos precios');
});
