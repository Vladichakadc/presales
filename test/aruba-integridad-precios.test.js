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

const { MODELS, CARE, CARE_SKU, LICENSES, LICENSES_HA, CENTRAL_TIERS, BOOST, FEC_OVERHEAD, ARUBA_ACCESSORY_CATALOG, ACCESSORY_COMPAT } = require('../server/seed/legacyData/aruba');

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

test('LICENSES_HA cubre los 3 tiers x 2 niveles x 3 terminos, con precios positivos', () => {
  // On-Premises NO esta mapeado a proposito: HPE no publica equivalencia E-STU de HA para
  // el segundo nodo on-prem, asi que el motor cotiza 2x estandar con declaracion (decision
  // del duenyo, 2026-09-13). Si algun dia se confirma, se mapea aqui y se ajusta el BOM.
  assert.deepStrictEqual(Object.keys(LICENSES_HA).sort(), ['bw100', 'bw1g', 'bwunl']);
  const mal = [];
  for (const [bw, lic] of Object.entries(LICENSES_HA)) {
    for (const nivel of ['foundation', 'advanced']) {
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
