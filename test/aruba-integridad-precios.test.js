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

const { MODELS, CARE, CARE_SKU, LICENSES, LICENSES_HA, CENTRAL_TIERS, BOOST, FEC_OVERHEAD, ARUBA_ACCESSORY_CATALOG, ACCESSORY_COMPAT, ARUBA_SSE, DTD_LICENSES } = require('../server/seed/legacyData/aruba');

const csvFilas = fs.readFileSync(path.join(__dirname, '..', 'public', 'datasheets', 'aruba-lista-precios-hpe.csv'), 'utf8')
  .trim().split(/\r?\n/).slice(1).map((l) => l.split(','));
const porSku = new Map(csvFilas.map((c) => [c[0], { mod: c[1], p: c[3] === '' ? null : Number(c[3]), vig: c[4], plc: c[5] }]));

// Modelos sin SKU base pedible, declarados a proposito: EC-V es virtual (se cotiza por
// suscripcion) y la serie 7000/7200 se pide remanufacturada (filas …R del CSV). Si un
// modelo nuevo entra sin hwSku, hay que declararlo aqui con su motivo — no pasa de contrabando.
const SIN_HW_SKU_DECLARADO = new Set(['EC-V', '7005', '7008', '7010', '7024', '7030', '7205', '7210', '7220', '7240XM']);

// `modelo_dimensionador` del CSV que no es un modelo: son las familias de servicio.
const FAMILIAS_CSV = new Set([
  'Suscripcion EdgeConnect Foundation', 'Suscripcion EdgeConnect Advanced',
  'Suscripcion EdgeConnect Foundation HA', 'Suscripcion EdgeConnect Advanced HA',
  'Suscripcion EdgeConnect On-Premises',
  'Boost EdgeConnect (SaaS)', 'Boost EdgeConnect (On-Premises)', 'Central (gateways 70xx/90xx)',
  'Accesorios EdgeConnect y gateways',
  'Dynamic Threat Defense (SaaS)', 'Dynamic Threat Defense (SaaS HA)',
  'Dynamic Threat Defense (On-Premises)', 'Dynamic Threat Defense (On-Premises HA)',
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
    // y7 null (2026-09-15, pendiente #28): la lista no publica el término de 7 años en
    // ese peldaño — null es «la lista no tiene el dato», no un SKU que deba cruzar.
    if (sku == null) return;
    const f = porSku.get(sku);
    if (!f) { mal.push(`${origen}: ${sku} no esta en el CSV`); return; }
    if (f.p !== precio) mal.push(`${origen}: ${sku} seed=${precio} csv=${f.p}`);
  };
  for (const [bw, lic] of Object.entries(LICENSES)) {
    for (const [nivel, t] of Object.entries(lic)) {
      for (const [term, sku] of Object.entries(t.sku || {})) cruza(`${bw}/${nivel}/${term}`, sku, t[term]);
    }
  }
  for (const [bw, lic] of Object.entries(LICENSES_HA)) {
    for (const [nivel, t] of Object.entries(lic)) {
      for (const [term, sku] of Object.entries(t.sku || {})) cruza(`HA ${bw}/${nivel}/${term}`, sku, t[term]);
    }
  }
  for (const [k, t] of Object.entries(CENTRAL_TIERS)) {
    for (const [term, sku] of Object.entries(t.sku)) cruza(`central/${k}/${term}`, sku, t[term]);
  }
  for (const modal of ['saas', 'onprem']) {
    const blk = BOOST[modal].bloque100;
    for (const [term, sku] of Object.entries(blk.sku || {})) cruza(`boost/${modal}/${term}`, sku, blk[term]);
  }
  for (const [variante, t] of Object.entries(DTD_LICENSES)) {
    for (const [term, sku] of Object.entries(t.sku || {})) cruza(`dtd/${variante}/${term}`, sku, t[term]);
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

test('LICENSES_HA cubre los 8 tiers en advanced y los 3 de foundation, con precios positivos', () => {
  // 2026-09-13: Advanced HA crece de 3 a 8 tiers (20M-2G, verificado en la lista oficial).
  // Foundation HA se queda en bw100/bw1g/bwunl: la lista no publica Foundation en los
  // tiers intermedios, ni estandar ni HA. On-Premises NO esta mapeado a proposito: HPE
  // no publica equivalencia E-STU de HA para el segundo nodo on-prem, asi que el motor
  // cotiza 2x estandar con declaracion (decision del duenyo, 2026-09-13). Si algun dia
  // se confirma, se mapea aqui y se ajusta el BOM.
  assert.deepStrictEqual(Object.keys(LICENSES_HA).sort(),
    ['bw100', 'bw1g', 'bw20', 'bw200', 'bw2g', 'bw50', 'bw500', 'bwunl']);
  const mal = [];
  for (const [bw, lic] of Object.entries(LICENSES_HA)) {
    const niveles = ['bw100', 'bw1g', 'bwunl'].includes(bw) ? ['foundation', 'advanced'] : ['advanced'];
    for (const nivel of niveles) {
      const t = lic[nivel];
      if (!t) { mal.push(`${bw}/${nivel}: falta el nivel`); continue; }
      for (const term of ['y1', 'y3', 'y5']) {
        if (!t.sku || !t.sku[term]) mal.push(`${bw}/${nivel}/${term}: falta SKU`);
        if (!(t[term] > 0)) mal.push(`${bw}/${nivel}/${term}: precio no positivo`);
      }
    }
  }
  assert.deepStrictEqual(mal, []);
});

test('el precio HA es identico al estandar, tier a tier y anyo a anyo (invariante QuickSpecs)', () => {
  // QuickSpecs EdgeConnect Enterprise: el SKU de alta disponibilidad del segundo nodo
  // cuesta EXACTAMENTE lo mismo que el estandar del mismo tier/nivel/termino — solo
  // cambia el numero de parte. Si esto se rompe, la lista de precios cambio y hay que
  // revisar la invariante antes de cotizar pares HA.
  const mal = [];
  for (const [bw, lic] of Object.entries(LICENSES_HA)) {
    for (const [nivel, t] of Object.entries(lic)) {
      const std = (LICENSES[bw] || {})[nivel];
      if (!std) { mal.push(`${bw}/${nivel}: sin par estandar`); continue; }
      for (const term of ['y1', 'y3', 'y5']) {
        if (t[term] !== std[term]) mal.push(`${bw}/${nivel}/${term}: HA=${t[term]} estandar=${std[term]}`);
      }
    }
  }
  assert.deepStrictEqual(mal, []);
});

// ── Tiers 20M-2G, restriccion Foundation y SSE (2026-09-13) ──────────────────
// La lista oficial amplio Advanced y On-Premises a ocho tiers de caudal; Foundation
// NO los tiene (restriccion oficial, no hueco de datos) y SSE quedo en «consultar».
// Estas tres reglas convierten en ruido de CI: un tier Foundation colado de contrabando,
// un par HA que deje de costar lo mismo que el estandar, o un precio inventado para SSE.

test('Foundation (y Foundation HA) solo tienen bw100/bw1g/bwunl; advanced/onprem tienen los 8 tiers', () => {
  // Restriccion oficial verificada en la lista 2026-09-13: no existe ninguna fila
  // Foundation de 20/50/200/500 Mbps ni 2 Gbps. El motor debe bloquear esos tiers
  // cuando el nivel es Foundation — si aparecen aqui, alguien los invento.
  const TIERS_8 = ['bw20', 'bw50', 'bw100', 'bw200', 'bw500', 'bw1g', 'bw2g', 'bwunl'];
  const TIERS_FND = ['bw100', 'bw1g', 'bwunl'];
  assert.deepStrictEqual(Object.keys(LICENSES).sort(), [...TIERS_8].sort());
  assert.deepStrictEqual(Object.keys(LICENSES_HA).sort(), [...TIERS_8].sort());
  for (const bw of TIERS_8) {
    for (const nivel of ['advanced', 'onprem']) {
      const t = LICENSES[bw][nivel];
      assert.ok(t, `LICENSES ${bw}/${nivel}: falta el nivel`);
      for (const term of ['y1', 'y3', 'y5']) {
        assert.ok(t.sku && t.sku[term], `LICENSES ${bw}/${nivel}/${term}: falta SKU`);
        assert.ok(t[term] > 0, `LICENSES ${bw}/${nivel}/${term}: precio no positivo`);
      }
    }
    assert.ok(LICENSES_HA[bw].advanced, `LICENSES_HA ${bw}/advanced: falta el nivel`);
    if (TIERS_FND.includes(bw)) {
      assert.ok(LICENSES[bw].foundation, `LICENSES ${bw}/foundation: falta el nivel`);
      assert.ok(LICENSES_HA[bw].foundation, `LICENSES_HA ${bw}/foundation: falta el nivel`);
    } else {
      assert.ok(!LICENSES[bw].foundation, `LICENSES ${bw}/foundation: tier intermedio inventado`);
      assert.ok(!LICENSES_HA[bw].foundation, `LICENSES_HA ${bw}/foundation: tier intermedio inventado`);
    }
  }
});

test('invariante HA == estandar en los 8 tiers de advanced', () => {
  // Misma invariante QuickSpecs del test historico, extendida 2026-09-13 a los ocho
  // tiers de Advanced: el SKU HA del segundo nodo cuesta EXACTAMENTE lo mismo que el
  // estandar — solo cambia el numero de parte. 2026-09-15: tambien en y7 (#28).
  for (const bw of ['bw20', 'bw50', 'bw100', 'bw200', 'bw500', 'bw1g', 'bw2g', 'bwunl']) {
    const ha = (LICENSES_HA[bw] || {}).advanced;
    const std = (LICENSES[bw] || {}).advanced;
    assert.ok(ha && std, `${bw}/advanced: falta el par HA o el estandar`);
    for (const term of ['y1', 'y3', 'y5', 'y7']) {
      // Excepcion literal de la lista (2026-09-15): en 7 anos publica «Adv HA UL» pero
      // NO «Adv UL» estandar — la invariante se predica donde AMBOS existen; el hueco
      // de bwunl/y7 esta clavado en el test de cobertura de 7 anos.
      if (std[term] == null || ha[term] == null) continue;
      assert.strictEqual(ha[term], std[term], `${bw}/advanced/${term}: HA=${ha[term]} estandar=${std[term]}`);
    }
  }
});

test('termino de 7 anos: cobertura exacta de la lista, null donde no se publica (#28)', () => {
  // Cobertura literal verificada contra el export de la lista el 2026-09-15 (vigencia
  // 2026-06-01, PLC GA). Regla: y7 con SKU y precio donde la lista lo publica; y7 null
  // donde no — jamas un SKU o precio inventado.
  const TIERS_ADV_7Y = ['bw20', 'bw50', 'bw100', 'bw200', 'bw500', 'bw1g', 'bw2g'];
  // Advanced SaaS: 20M→2G completo; ILIMITADO no (la lista solo trae «Adv HA UL 7yr»).
  for (const bw of TIERS_ADV_7Y) {
    const t = LICENSES[bw].advanced;
    assert.ok(t.sku.y7 && t.y7 > 0, `LICENSES ${bw}/advanced/y7: la lista SI lo publica`);
    assert.ok(porSku.has(t.sku.y7), `LICENSES ${bw}/advanced/y7: ${t.sku.y7} debe tener fila en el CSV`);
  }
  assert.strictEqual(LICENSES.bwunl.advanced.y7, null, 'Adv UL 7y no esta en la lista: null');
  assert.strictEqual(LICENSES.bwunl.advanced.sku.y7, null);
  // Advanced HA: los 8 tiers completos, y el SKU de 7 anos tambien cruza al CSV.
  for (const bw of [...TIERS_ADV_7Y, 'bwunl']) {
    const t = LICENSES_HA[bw].advanced;
    assert.ok(t.sku.y7 && t.y7 > 0, `LICENSES_HA ${bw}/advanced/y7: la lista SI lo publica`);
    assert.ok(porSku.has(t.sku.y7), `LICENSES_HA ${bw}/advanced/y7: ${t.sku.y7} debe tener fila en el CSV`);
  }
  // On-Premises no-HA: la lista solo publica 7y para 1G y 2G.
  for (const bw of ['bw20', 'bw50', 'bw100', 'bw200', 'bw500', 'bwunl']) {
    assert.strictEqual(LICENSES[bw].onprem.y7, null, `LICENSES ${bw}/onprem/y7: no publicado — null`);
    assert.strictEqual(LICENSES[bw].onprem.sku.y7, null);
  }
  for (const bw of ['bw1g', 'bw2g']) {
    assert.ok(LICENSES[bw].onprem.sku.y7 && LICENSES[bw].onprem.y7 > 0, `LICENSES ${bw}/onprem/y7: la lista SI lo publica`);
  }
  // Foundation: 1G y UL si; 100M no. Foundation HA: las 3 completas.
  assert.strictEqual(LICENSES.bw100.foundation.y7, null, 'Fnd 100M 7y no esta en la lista: null');
  for (const bw of ['bw1g', 'bwunl']) assert.ok(LICENSES[bw].foundation.sku.y7, `LICENSES ${bw}/foundation/y7: publicado`);
  for (const bw of ['bw100', 'bw1g', 'bwunl']) assert.ok(LICENSES_HA[bw].foundation.sku.y7, `LICENSES_HA ${bw}/foundation/y7: publicado`);
  // Boost: los cuatro bloques tienen 7 anos.
  for (const via of ['saas', 'onprem']) {
    for (const bloque of ['bloque100', 'bloque10g']) {
      assert.ok(BOOST[via][bloque].sku.y7 && BOOST[via][bloque].y7 > 0, `BOOST ${via}/${bloque}/y7: publicado`);
    }
  }
  // Linealidad documentada de la lista: 7 anos = 7 x 1 ano en toda la escalera.
  for (const bw of TIERS_ADV_7Y) {
    assert.strictEqual(LICENSES[bw].advanced.y7, LICENSES[bw].advanced.y1 * 7, `${bw}/advanced: y7 no es 7 x y1`);
  }
});

test('ARUBA_SSE va siempre sin precio: linea «consultar», nunca importe inventado', () => {
  // R8M36AAE existe en el catalogo HPE pero NO figura en la lista de precios vigente
  // (verificado 2026-09-13). Regla de gobierno: null = «la lista no tiene el dato».
  assert.strictEqual(ARUBA_SSE.sku, 'R8M36AAE');
  assert.strictEqual(ARUBA_SSE.precio, null, 'SSE no tiene precio en la lista: debe quedar en «consultar»');
  assert.ok(!porSku.has('R8M36AAE'), 'R8M36AAE no puede tener fila con precio en el CSV del cotizador');
});

// ── Dynamic Threat Defense (2026-09-14, pendiente #31) ──────────────────────
// DTD SI esta en la lista de precios vigente (PLC GA, vigencia 2026-06-01): escalera
// PLANA por appliance (sin tiers de caudal) en cuatro variantes (modalidad x HA).
// Estas reglas convierten en ruido de CI: una variante que falte, un precio HA que se
// desvie del estandar o un SKU que deje de ser el literal de la lista.

test('DTD_LICENSES tiene las 4 variantes con SKU literales de la lista y precios positivos', () => {
  // Literales verificados contra el export de la lista el 2026-09-14 (vigencia
  // 2026-06-01, PLC GA). Los de evaluacion a $0 quedan FUERA por alcance: no son
  // cotizables. El termino de 7 anos ENTRA el 2026-09-15 (pendiente #28, pedido del
  // duenyo): la lista solo lo publica para DTD On-Premises (estandar y HA) — en SaaS
  // y7 queda null («la lista no tiene el dato»).
  const esperado = {
    saas:     { y1: 'S0Z37AAS', y3: 'S0Z39AAS', y5: 'S0Z41AAS', y7: null },
    saasHa:   { y1: 'S0Z44AAS', y3: 'S0Y26AAS', y5: 'S0Y28AAS', y7: null },
    onprem:   { y1: 'S0Y31AAS', y3: 'S0Y33AAS', y5: 'S0Y35AAS', y7: 'S0Y36AAS' },
    onpremHa: { y1: 'S0Y38AAS', y3: 'S0Y40AAS', y5: 'S0Y42AAS', y7: 'S0Y43AAS' },
  };
  assert.deepStrictEqual(Object.keys(DTD_LICENSES).sort(), Object.keys(esperado).sort());
  for (const [variante, skus] of Object.entries(esperado)) {
    const t = DTD_LICENSES[variante];
    for (const term of ['y1', 'y3', 'y5', 'y7']) {
      assert.strictEqual(t.sku[term], skus[term], `dtd/${variante}/${term}: SKU no es el literal de la lista`);
      if (skus[term] == null) { assert.strictEqual(t[term], null, `dtd/${variante}/${term}: precio debe ser null si no hay SKU`); continue; }
      assert.ok(t[term] > 0, `dtd/${variante}/${term}: precio no positivo`);
      assert.ok(porSku.has(t.sku[term]), `dtd/${variante}/${term}: ${t.sku[term]} no esta en el CSV del cotizador`);
    }
    // Escalera plana 1/3/5: el precio es lineal al termino (372/1116/1860 en toda la escalera).
    assert.strictEqual(t.y1, 372, `dtd/${variante}: y1 distinto del literal $372 de la lista`);
    assert.strictEqual(t.y3, 1116, `dtd/${variante}: y3 distinto del literal $1.116 de la lista`);
    assert.strictEqual(t.y5, 1860, `dtd/${variante}: y5 distinto del literal $1.860 de la lista`);
  }
  // Los SKU de evaluacion a $0 NO entran al catalogo cotizable (una evaluacion no se cotiza).
  for (const excluido of ['S1C85AAS', 'S1C86AAS', 'S1C87AAS', 'S1C88AAS']) {
    assert.ok(!porSku.has(excluido), `${excluido} (evaluacion) no debe tener fila en el CSV`);
  }
});

test('invariante DTD: el SKU HA cuesta exactamente lo mismo que el estandar', () => {
  // Misma invariante QuickSpecs que LICENSES_HA, verificada literal contra la lista el
  // 2026-09-14: el SKU de alta disponibilidad del segundo nodo solo cambia el numero
  // de parte, no el importe — vale para SaaS y para On-Premises.
  for (const [std, ha] of [['saas', 'saasHa'], ['onprem', 'onpremHa']]) {
    for (const term of ['y1', 'y3', 'y5']) {
      assert.strictEqual(DTD_LICENSES[ha][term], DTD_LICENSES[std][term],
        `dtd ${ha}/${term}: HA=${DTD_LICENSES[ha][term]} estandar=${DTD_LICENSES[std][term]}`);
      assert.notStrictEqual(DTD_LICENSES[ha].sku[term], DTD_LICENSES[std].sku[term],
        `dtd ${ha}/${term}: el SKU HA debe ser distinto del estandar`);
    }
  }
});

test('todo modelo publica sus flujos simultaneos o declara por que no', () => {
  // El dimensionador filtra por flujos simultaneos (Simultaneous Flows), no por tuneles
  // IPsec: un modelo sin dato de flujos no puede validarse y pasaria de contrabando.
  // EC-V es virtual (depende del hipervisor) y el Gateway 9240 no publica sesiones de
  // firewall en su QuickSpecs — ambos declarados a proposito.
  const SIN_FLUJOS_DECLARADO = new Set(['EC-V', 'Gateway 9240']);
  const mal = [];
  for (const m of MODELS) {
    if (SIN_FLUJOS_DECLARADO.has(m.id)) continue;
    if (m.fam === 'ec') {
      const digitos = String(((m.spec || {}).conexiones) || '').replace(/[^\d]/g, '');
      if (!digitos) mal.push(`${m.id}: spec.conexiones ausente o sin cifra`);
    } else if (!(m.fwSess > 0)) {
      mal.push(`${m.id}: fwSess ausente sin declarar`);
    }
  }
  assert.deepStrictEqual(mal, []);
});

test('EC-V no tiene CARE_SKU: appliance virtual, el soporte de hardware no aplica', () => {
  // Regla de diseno (fase 10, 2026-09-13): EC-V corre sobre el hipervisor del cliente, asi
  // que el Foundational Care de hardware no tiene sentido — la suscripcion ya incluye el
  // soporte de software. El BOM oculta el nivel CARE para EC-V y la ficha lo declara; este
  // test cierra la puerta a que alguien le cuelgue un SKU de soporte HW por error.
  assert.ok(!CARE_SKU['EC-V'], 'EC-V no debe tener soporte de hardware cotizable');
});

test('el overhead FEC esta anclado a los ratios oficiales del VSG (1:8 y 1:4)', () => {
  // VSG SD-Branch de HPE (validado 2026-09-13): ratio 1:8 = 12,5% para apps en tiempo
  // real, 1:4 = 25% para VoIP, y FEC adaptativo = 0% sin perdida medida. El modo auto del
  // motor no puede superar el ancla 1:8 y el agresivo clava el 1:4; la politica HA (1:1,
  // 50%) no se ofrece a proposito.
  assert.strictEqual(FEC_OVERHEAD.off.pct, 0);
  assert.ok(FEC_OVERHEAD.auto.pct > 0 && FEC_OVERHEAD.auto.pct <= 0.125,
    `auto (${FEC_OVERHEAD.auto.pct}) no puede superar el ratio oficial 1:8 (12,5%)`);
  assert.strictEqual(FEC_OVERHEAD.alto.pct, 0.25, 'agresivo debe clavar el ratio oficial 1:4 (25%)');
});

// ── Catálogo maestro de accesorios (fase 12, corregido 2026-09-13) ───────────
// La fuente oficial es la lista de precios del distribuidor subida por el dueño («esa
// es la fuente oficial de los SKU y precios de lista»). Estas reglas convierten en
// ruido de CI: un SKU de la matriz que no exista en el catálogo, un accesorio sin
// List Price o sin vigencia, una compatibilidad colgada de un modelo inexistente, un
// SKU en fin de venta (PLC «ES») ofertado, o una discrepancia de precio entre el
// catálogo maestro y el CSV del cotizador (dos vistas de la MISMA fuente).

test('el catálogo maestro cubre los 53 accesorios extraídos de la lista oficial', () => {
  const skus = Object.keys(ARUBA_ACCESSORY_CATALOG);
  assert.strictEqual(skus.length, 53, `se esperaban 53 SKUs de la lista oficial, hay ${skus.length}`);
  for (const obligatorio of ['S3R03A', 'J4858D', 'J4859D', 'J4860D', 'JL745A', 'JL746A',
    'JL747A', 'JL747B', 'J9150D', 'J9151E', 'J9153D', 'JL748A', 'J9281D', 'J9283D', 'J9285D',
    'JM534A', 'JM535A', 'JL563C', 'JL749A',
    'JL484A', 'JL485A', 'JL486A', 'JL487A', 'JL488A', 'JL489A', 'JM532A', 'JM533A', 'S2N63A',
    'S2N67A', 'S3R70A', 'S3P35A', 'JZ889A', 'R7J63A', 'JM779A', 'JZ955A', 'R1B30A', 'R3W17A', 'R4X13A',
    'JZ888A', 'JZ893A', 'JZ894A', 'S2D96A', 'S2D95A', 'JM965A', 'JM996A', 'S2N64A', 'JY728A', 'S1H24AR',
    'JW084A', 'JX934A', 'JW085A', 'JW086A', 'JW107A']) {
    assert.ok(ARUBA_ACCESSORY_CATALOG[obligatorio], `falta el SKU ${obligatorio} de la lista oficial`);
  }
});

test('todo accesorio tiene descripción oficial, List Price, vigencia y PLC conocido', () => {
  for (const [sku, a] of Object.entries(ARUBA_ACCESSORY_CATALOG)) {
    assert.ok(a.name && a.name.length > 10, `${sku}: falta la descripción oficial de la lista`);
    assert.ok(typeof a.listPrice === 'number' && a.listPrice > 0, `${sku}: List Price inválido (${a.listPrice})`);
    assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(a.vigencia || ''), `${sku}: vigencia List Price inválida (${a.vigencia})`);
    assert.ok(PLC_CONOCIDOS.has(a.plc), `${sku}: PLC desconocido (${a.plc}) — decidir cómo se pinta antes de aceptarlo`);
    assert.ok(a.speed || a.category, `${sku}: debe declarar speed (transceptor/DAC) o category (funcional)`);
  }
});

test('la matriz de compatibilidad solo referencia SKUs y modelos que existen', () => {
  const idsModelos = new Set(MODELS.map((m) => m.id));
  for (const [modelo, cfg] of Object.entries(ACCESSORY_COMPAT)) {
    assert.ok(idsModelos.has(modelo), `compatibilidad colgada de un modelo inexistente: ${modelo}`);
    assert.ok(Array.isArray(cfg.items) && cfg.items.length > 0, `${modelo}: sin accesorios ofertables`);
    for (const sku of cfg.items) {
      assert.ok(ARUBA_ACCESSORY_CATALOG[sku], `${modelo}: el SKU ${sku} no está en el catálogo maestro`);
    }
  }
});

test('ningún SKU en fin de venta (PLC «ES») se oferta en la matriz', () => {
  // Regla de la casa: un SKU en ES queda en el catálogo para trazabilidad pero nunca
  // se ofrece — JL747A (1G cobre TAA, ES) es el caso vivo; su sucesor GA es JL747B.
  for (const [sku, a] of Object.entries(ARUBA_ACCESSORY_CATALOG)) {
    if (a.plc !== 'ES') continue;
    for (const [modelo, cfg] of Object.entries(ACCESSORY_COMPAT)) {
      assert.ok(!cfg.items.includes(sku), `${sku} está en ES y se oferta en ${modelo}`);
    }
  }
});

test('el tren Network Memory del EC-10150 (S2N67A y sus repuestos) solo se ofrece ahí', () => {
  // QuickSpecs EC v18 + Install Guide: S2N67A es el «10150/10170 1.6TB Network Memory
  // Drive Kit» (Boost hasta 8 Gbps con él) y S3R70A/S3P35A sus repuestos; el 10170 no
  // está en este catálogo. EC-10106/10108 NO tienen slot (HRG Rev S: SSD interno de
  // 120 GB no reemplazable) — no existe kit para ellos y no se inventa.
  for (const sku of ['S2N67A', 'S3R70A', 'S3P35A']) {
    for (const [modelo, cfg] of Object.entries(ACCESSORY_COMPAT)) {
      assert.strictEqual(cfg.items.includes(sku), modelo === 'EC-10150',
        `${sku} en ${modelo}: el tren Network Memory es específico del EC-10150/10170`);
    }
  }
});

test('la matriz de ópticas reproduce la compatibilidad oficial citada (2026-09-13)', () => {
  // Codifica la matriz del bloque de comentarios de ACCESSORY_COMPAT: VSG SD-Branch,
  // HRG Rev S, QuickSpecs EC v18 y 9200 v14. Cada SKU va EXACTAMENTE donde la fuente
  // oficial lo certifica — ni una plataforma más (inferencia) ni una menos.
  const matriz = {
    S3R03A: ['EC-10106'],                                  // 1G cobre EC (VSG/HRG)
    J4858D: ['EC-10106', 'Gateway 9240'],                  // 1G SX (VSG/HRG + QS 9200)
    J4859D: ['EC-10106', 'Gateway 9240'],                  // 1G LX (ídem)
    J4860D: [],                                            // sin matriz oficial: no se oferta
    JL745A: ['EC-10106', 'EC-M', 'EC-L', 'EC-XL', 'Gateway 9240'],   // 1G SX TAA (HRG + QS 9200)
    JL746A: ['EC-10106', 'EC-M', 'EC-L', 'EC-XL', 'Gateway 9240'],   // 1G LX TAA (ídem)
    JL747B: [],                                            // HRG: NO soportado en toda la línea EC
    S1H24AR: ['Gateway 9240'],                             // cobre 1G específico del 9240
    J9150D: ['EC-10106', 'EC-10108', 'EC-10150', 'EC-L', 'EC-XL', 'Gateway 9240'],
    J9151E: ['EC-10106', 'EC-10108', 'EC-10150', 'EC-L', 'EC-XL', 'Gateway 9240'],
    J9153D: ['EC-10106', 'Gateway 9240'],                  // VSG: NO en EC-10108/10150
    JL748A: ['EC-10106', 'EC-10108', 'EC-10150', 'EC-S', 'EC-M', 'EC-L', 'EC-XL'], // 10G SR TAA (HRG); 9240 sin confirmar
    JL749A: ['EC-10108', 'EC-10150', 'EC-S', 'EC-M', 'EC-L', 'EC-XL', 'Gateway 9240'], // 10G LR TAA (HRG + QS 9200)
    J9281D: ['EC-10106', 'EC-10108', 'EC-10150', 'Gateway 9240'],    // DAC 10G 1m (HRG + QS 9200)
    J9283D: ['EC-10106', 'EC-10108', 'EC-10150', 'Gateway 9240'],    // DAC 10G 3m (ídem)
    J9285D: ['Gateway 9240'],                              // DAC 10G 7m: solo 9200 lo certifica
    JL563C: ['EC-10108', 'EC-10150'],                      // 10GBASE-T (VSG)
    JM534A: ['EC-S', 'EC-M', 'EC-L', 'EC-XL'],             // EC-SFP-LR línea anterior (HRG/QS)
    JM535A: ['EC-S', 'EC-M', 'EC-L', 'EC-XL'],             // EC-SFP-SR línea anterior (ídem)
    JL484A: ['EC-10108', 'EC-10150', 'Gateway 9240'],      // 25G SR (VSG + QS 9200)
    JL485A: ['Gateway 9240'],                              // 25G eSR: solo 9200 confirmado
    JL486A: ['EC-10108', 'EC-10150', 'Gateway 9240'],      // 25G LR (VSG + QS 9200)
    JL487A: ['Gateway 9240'],                              // DAC 25G 0,65m: solo 9200 confirmado
    JL488A: ['Gateway 9240'],                              // DAC 25G 3m: ídem
    JL489A: ['EC-10108', 'EC-10150', 'Gateway 9240'],      // DAC 25G 5m (VSG + QS 9200)
    JM532A: ['EC-10150'],                                  // EC-SFP28-25G-LR (QS hub)
    JM533A: ['EC-10150'],                                  // EC-SFP28-25G-SR (ídem)
    S2N63A: ['EC-10150'],                                  // 25G LR TAA (HRG)
  };
  const modelos = new Set(Object.keys(ACCESSORY_COMPAT));
  for (const [sku, esperados] of Object.entries(matriz)) {
    for (const modelo of modelos) {
      assert.strictEqual(cfg_items(modelo).includes(sku), esperados.includes(modelo),
        `${sku} en ${modelo}: la matriz oficial dice ${esperados.includes(modelo) ? 'SÍ' : 'NO'} (certificados: ${esperados.join(', ') || 'ninguno'})`);
    }
  }
  function cfg_items(modelo) { return ACCESSORY_COMPAT[modelo].items; }
});

test('PSU, racks y fan tray van solo a su equipo (lista oficial)', () => {
  const exclusivos = {
    R7J63A: 'Gateway 9240',   // 9240 550W AC Power supply
    R1B30A: 'Gateway 9004',   // 9004-MNT-19
    R3W17A: 'Gateway 9004-LTE', // 9004-LTE-MNT-19
    R4X13A: 'Gateway 9012',   // 9012-MNT-19
    S2N64A: 'Gateway 9114',   // 9114 Spare Fan Tray
    JM779A: 'EC-S',           // EC-S-P AC PSU
    JZ955A: 'EC-M',           // EC-M-H PSU
    JM965A: 'EC-XS',          // EC-XS A1 Accessory Kit
    JM996A: 'EC-XS',          // EC-XS A1 Power Adapter
    JW084A: '7005', JX934A: '7008', JW085A: '7010', JW086A: '7030',
  };
  for (const [sku, dueno] of Object.entries(exclusivos)) {
    for (const [modelo, cfg] of Object.entries(ACCESSORY_COMPAT)) {
      assert.strictEqual(cfg.items.includes(sku), modelo === dueno,
        `${sku} en ${modelo}: la lista oficial lo ata a ${dueno}`);
    }
  }
  // Compartidos EC-10106/10108 (QuickSpecs EC v18 + Accessories Guide Rev F):
  for (const sku of ['S2D96A', 'S2D95A']) {
    for (const [modelo, cfg] of Object.entries(ACCESSORY_COMPAT)) {
      assert.strictEqual(cfg.items.includes(sku), ['EC-10106', 'EC-10108'].includes(modelo),
        `${sku} en ${modelo}: la fuente oficial lo ata a EC-10106/10108`);
    }
  }
  // Compartidos declarados: JZ889A/JZ888A (EC-L y EC-XL) y JW107A (serie 7200).
  for (const sku of ['JZ889A', 'JZ888A']) {
    for (const [modelo, cfg] of Object.entries(ACCESSORY_COMPAT)) {
      assert.strictEqual(cfg.items.includes(sku), ['EC-L', 'EC-XL'].includes(modelo),
        `${sku} en ${modelo}: la lista lo ata a EC-L/XL-H`);
    }
  }
  for (const [modelo, cfg] of Object.entries(ACCESSORY_COMPAT)) {
    assert.strictEqual(cfg.items.includes('JW107A'), ['7205', '7210', '7220', '7240XM'].includes(modelo),
      `JW107A en ${modelo}: la lista lo ata a la serie 7200`);
  }
});

test('el catálogo maestro y el CSV del cotizador dicen lo mismo (misma fuente)', () => {
  // El CSV es la otra vista de la lista oficial: todo accesorio del catálogo maestro
  // debe estar en el CSV, con el mismo List Price, vigencia y PLC. Una discrepancia
  // aquí significa que una de las dos vistas se editó a mano — y eso es exactamente
  // lo que esta prueba existe para impedir.
  for (const [sku, a] of Object.entries(ARUBA_ACCESSORY_CATALOG)) {
    const fila = porSku.get(sku);
    assert.ok(fila, `${sku}: está en el catálogo maestro pero no en el CSV del cotizador`);
    assert.strictEqual(fila.mod, 'Accesorios EdgeConnect y gateways',
      `${sku}: familia CSV «${fila.mod}» en vez de «Accesorios EdgeConnect y gateways»`);
    assert.strictEqual(fila.p, a.listPrice, `${sku}: CSV $${fila.p} vs catálogo $${a.listPrice}`);
    assert.strictEqual(fila.vig, a.vigencia, `${sku}: vigencia CSV «${fila.vig}» vs catálogo «${a.vigencia}»`);
    assert.strictEqual(fila.plc, a.plc, `${sku}: PLC CSV «${fila.plc}» vs catálogo «${a.plc}»`);
  }
});
