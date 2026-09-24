'use strict';
// PRUEBAS DE ACEPTACION DEL «Informe final de validacion tecnica y plan de mejora del modulo
// Fortinet Presales» (22-sep-2026), seccion 15: AT-01 a AT-20.
//
// Se afirman contra `public/js/fortinet-reglas.js`, que es donde viven las reglas que antes
// estaban enterradas en la pagina. Las que necesitan navegador -que la PANTALLA conduzca la
// regla, no solo que la regla exista- se prueban en `test/e2e/e2e-fortinet-auditoria.js`; el
// id de cada una se repite alli para poder cruzarlas.
//
// CADA PRUEBA LLEVA EL ESCENARIO DEL INFORME, NO UNO COMODO. AT-01 usa los 300 Mbps con 30 %
// de crecimiento porque son los que dan 390 Mbps contra los 310 oficiales del 40F: el numero
// exacto es el que demuestra que el derate 0,65 (que daba 390 de capacidad) aprobaba justo el
// equipo que el dato oficial rechaza.

const test = require('node:test');
const assert = require('node:assert');

const R = require('../public/js/fortinet-reglas.js');
const fortinet = require('../server/seed/legacyData/fortinet.js');

const { MODELS, BUNDLES, CARE, FUNCIONES, SERVICIOS_SDWAN, TERMINOS, EMS_LICENCIAS, SASE_USUARIOS } = fortinet;
const porId = (id) => MODELS.find((m) => m.id === id);
const CARE_KEY = { fc247: 'essential', fcpre: 'premium', fcelite: 'elite' };

// Atajo: monta el argumento de lineasComerciales con los valores habituales.
const comercial = (over) => R.lineasComerciales(Object.assign({
  modelo: porId('FortiGate 90G'),
  bundles: BUNDLES,
  care: CARE,
  bundle: 'ent',
  care_elegido: 'fcpre',
  careKey: CARE_KEY.fcpre,
  qty: 1,
  anios: 3,
  terminos: TERMINOS,
  converter: false,
  serviciosSdwan: [],
  ems: EMS_LICENCIAS,
  sase: SASE_USUARIOS,
}, over || {}));

/* ══ AT-01 · SSL oficial, sin derate ═══════════════════════════════════════════════════
   «40F, 300 Mbps, crecimiento 30 por ciento y SSL → Rechazar por SSL 310 Mbps < 390 Mbps.» */
test('AT-01 · el 40F se rechaza por su SSL oficial de 310 Mbps, no por un derate', () => {
  const d = R.demandaTrafico({ internet: 300, crecimiento: 0.30 });
  assert.strictEqual(Math.round(d.previsto), 390);

  const m40 = porId('FortiGate 40F');
  assert.strictEqual(m40.ssl, 310, 'el catalogo tiene que traer la cifra oficial de SSL');

  const r = R.evaluarModelo(m40, { tp: d.previsto, ssl: d.previsto });
  assert.strictEqual(r.estado, 'excede');
  const ssl = r.ejes.find((e) => e.k === 'ssl');
  assert.strictEqual(ssl.cap, 310);
  assert.ok(ssl.u > 1, 'la utilizacion de SSL tiene que pasar del 100 %');
  assert.strictEqual(r.manda.k, 'ssl', 'el cuello de botella es SSL, no Threat Protection');

  // La prueba del motivo: con Threat Protection (600 Mbps) el 40F pasaria, y el derate que
  // esta pagina aplicaba -tp x 0,65 = 390- lo dejaba JUSTO en el limite. Es el escenario en
  // el que un factor unico aprueba el equipo que el dato oficial rechaza.
  assert.ok(m40.tp * 0.65 >= d.previsto, 'el derate anterior aprobaba este escenario');
});

/* ══ AT-02 · TP y SSL no se derivan una de otra ════════════════════════════════════════ */
test('AT-02 · el 50G usa TP 1,1 G y SSL 1,3 G como ejes independientes', () => {
  const m = porId('FortiGate 50G');
  assert.strictEqual(m.tp, 1100);
  assert.strictEqual(m.ssl, 1300);

  const r = R.evaluarModelo(m, { tp: 1200, ssl: 1200 });
  const tp = r.ejes.find((e) => e.k === 'tp');
  const ssl = r.ejes.find((e) => e.k === 'ssl');
  assert.strictEqual(tp.estado, 'excede', '1200 sobre 1100 de TP excede');
  assert.strictEqual(ssl.estado, 'ok', '1200 sobre 1300 de SSL cabe');
  assert.strictEqual(r.manda.k, 'tp');

  // En tres de los cinco modelos con cifra oficial el equipo aguanta MAS SSL que Threat
  // Protection: cualquier derate fijo sobre TP es falso por construccion.
  const conSsl = MODELS.filter((x) => x.ssl != null);
  const mayores = conSsl.filter((x) => x.ssl > x.tp);
  assert.ok(mayores.length >= 3, 'hay modelos con SSL por encima de su Threat Protection');
});

test('AT-20 · sin cifra oficial de SSL el modelo se aparta con su motivo, no se imputa', () => {
  // El ejemplo se fue mudando a medida que llegaba el dato: el 200G (Product Matrix, 23-sep),
  // el 600F (su ficha por serie, 23-sep) y por ultimo el 100F y el 200F (su ficha coreana,
  // 24-sep). Con los 58 cubiertos, la regla se prueba sobre el 100F con el SSL BORRADO: una
  // prueba que se queda sin sujeto no se ablanda ni se borra, se le da uno.
  assert.strictEqual(porId('FortiGate 100F').ssl, 1000, 'el catalogo real ya trae el SSL del 100F');
  const m = { ...porId('FortiGate 100F'), ssl: null };
  const r = R.evaluarModelo(m, { tp: 1000, ssl: 1000 });
  assert.strictEqual(r.estado, 'apartado');
  assert.match(r.motivo, /no trae Inspecci[oó]n SSL/);
  assert.match(r.motivo, /PoC/);
  const ssl = r.ejes.find((e) => e.k === 'ssl');
  assert.strictEqual(ssl.estado, 'sinDato');
  assert.strictEqual(ssl.u, null, 'un eje sin dato no tiene utilizacion: no se inventa');
});

test('un eje blando sin dato (cps) NO aparta el modelo, pero se declara', () => {
  // Mismo caso: el 200F era el ejemplo real hasta que su ficha trajo 280.000 cps.
  assert.strictEqual(porId('FortiGate 200F').cps, 280000);
  const m = { ...porId('FortiGate 200F'), cps: null };
  const r = R.evaluarModelo(m, { tp: 1000, cps: 5000 });
  assert.strictEqual(r.estado, 'ok');
  assert.deepStrictEqual(r.sinComprobar, ['Sesiones nuevas / s']);
});

/* ══ AT-11 · simultaneidad declarada, nunca max automatico ═════════════════════════════ */
test('AT-11 · inter-VLAN e Internet se SUMAN salvo declaracion expresa de picos no concurrentes', () => {
  const concurrentes = R.demandaTrafico({ internet: 600, interVlan: 300, crecimiento: 0.25 });
  assert.strictEqual(concurrentes.base, 900);
  assert.strictEqual(Math.round(concurrentes.previsto), 1125);
  assert.match(concurrentes.regla, /suma/);

  const noConcurrentes = R.demandaTrafico({ internet: 600, interVlan: 300, crecimiento: 0.25, picosNoConcurrentes: true });
  assert.strictEqual(noConcurrentes.base, 600);
  assert.strictEqual(Math.round(noConcurrentes.previsto), 750);
  assert.match(noConcurrentes.regla, /máximo/);

  // Las dos cifras del informe (§13), con su techo de utilizacion del 70 %. Y el punto del
  // hallazgo: el supuesto de simultaneidad, por si solo, CAMBIA DE FAMILIA.
  const techo = { techo: 0.70 };
  const m70 = porId('FortiGate 70G');
  const m90 = porId('FortiGate 90G');
  assert.strictEqual(R.evaluarModelo(m70, { tp: 750, ssl: 750 }, techo).estado, 'ok',
    'picos no concurrentes: el 70G cabe (TP 1,3 G y SSL 1,4 G)');
  const conc = R.evaluarModelo(m70, { tp: 1125, ssl: 1125 }, techo);
  assert.strictEqual(conc.estado, 'excede', 'picos concurrentes: el 70G falla TP');
  assert.strictEqual(conc.manda.k, 'tp');
  assert.strictEqual(R.evaluarModelo(m90, { tp: 1125, ssl: 1125 }, techo).estado, 'ok',
    'el 90G supera TP 2,2 G y SSL 2,6 G en el caso concurrente');
});

test('el techo de utilizacion es una politica SEPARADA del crecimiento', () => {
  const m = porId('FortiGate 70G'); // TP 1.300 Mbps
  // 1.000 Mbps cabe al 77 %: sin techo pasa, con techo del 70 % no.
  assert.strictEqual(R.evaluarModelo(m, { tp: 1000 }, { techo: 1 }).estado, 'ok');
  const conTecho = R.evaluarModelo(m, { tp: 1000 }, { techo: 0.70 });
  assert.strictEqual(conTecho.estado, 'excede');
  assert.match(conTecho.motivo, /techo de utilización declarado/);
  // Y el crecimiento no se confunde con el techo: infla la demanda, no limita la capacidad.
  assert.strictEqual(R.demandaTrafico({ internet: 1000, crecimiento: 0.30 }).previsto, 1300);
});

/* ══ AT-03 · bundle minimo derivado y bloqueante ═══════════════════════════════════════ */
test('AT-03 · IoT Detection + DLP con UTP eleva a Enterprise o bloquea', () => {
  const activas = ['chkIotDlp'];
  const min = R.bundleMinimo(activas, FUNCIONES, BUNDLES);
  assert.strictEqual(min.minimo, 'ent');
  assert.deepStrictEqual(min.validos, ['ent']);

  const err = R.validarBundle('utp', activas, FUNCIONES, BUNDLES);
  assert.ok(err, 'UTP tiene que bloquear');
  assert.strictEqual(err.minimo, 'ent');
  assert.match(err.mensaje, /Enterprise Protection/);

  assert.strictEqual(R.validarBundle('ent', activas, FUNCIONES, BUNDLES), null);
  assert.ok(R.validarBundle('atp', activas, FUNCIONES, BUNDLES), 'ATP tampoco cubre DLP');
});

test('Web Filtering exige UTP; el antivirus lo cubre cualquiera de los tres', () => {
  assert.strictEqual(R.bundleMinimo(['chkWeb'], FUNCIONES, BUNDLES).minimo, 'utp');
  assert.ok(R.validarBundle('atp', ['chkWeb'], FUNCIONES, BUNDLES), 'ATP no trae URL filtering');
  assert.strictEqual(R.bundleMinimo(['chkAv'], FUNCIONES, BUNDLES).minimo, 'atp');
  assert.strictEqual(R.validarBundle('atp', ['chkAv'], FUNCIONES, BUNDLES), null);
});

test('la inspeccion SSL y FortiSandbox NO elevan el bundle: no consumen servicio FortiGuard', () => {
  const min = R.bundleMinimo(['chkSsl', 'chkSandbox'], FUNCIONES, BUNDLES);
  assert.deepStrictEqual(min.servicios, []);
  assert.strictEqual(R.validarBundle('atp', ['chkSsl', 'chkSandbox'], FUNCIONES, BUNDLES), null);
});

/* ══ AT-04 · FortiCare Premium no se cotiza dos veces ══════════════════════════════════ */
test('AT-04 · con ATP, UTP o Enterprise no se anade una linea de FortiCare Premium', () => {
  for (const b of ['atp', 'utp', 'ent']) {
    const r = comercial({ bundle: b, care_elegido: 'fcpre', careKey: 'premium' });
    const soporte = r.filas.filter((f) => f.cat === 'Soporte');
    assert.strictEqual(soporte.length, 0, `${b} incluye Premium: no debe haber linea de soporte`);
    assert.ok(r.avisos.some((a) => a.codigo === 'soporte-incluido'), 'y se dice por que');
  }
});

test('AT-04b · FortiCare Elite se cotiza como upgrade del Premium incluido, no como soporte completo', () => {
  const r = comercial({ bundle: 'ent', care_elegido: 'fcelite', careKey: 'elite' });
  const soporte = r.filas.filter((f) => f.cat === 'Soporte');
  assert.strictEqual(soporte.length, 1);
  assert.match(soporte[0].desc, /upgrade sobre el Premium incluido/);
  assert.ok(r.avisos.some((a) => a.codigo === 'elite-upgrade'));
});

test('un nivel de soporte POR DEBAJO del incluido no se cotiza, y se explica', () => {
  const r = comercial({ bundle: 'ent', care_elegido: 'fc247', careKey: 'essential' });
  assert.strictEqual(r.filas.filter((f) => f.cat === 'Soporte').length, 0);
  assert.ok(r.avisos.some((a) => a.codigo === 'soporte-inferior'));
});

/* ══ AT-05 · FortiConverter no se duplica ══════════════════════════════════════════════ */
test('AT-05 · con Enterprise seleccionado no se anade FortiConverter por defecto ni pedido', () => {
  const porDefecto = comercial({ bundle: 'ent' });
  assert.strictEqual(porDefecto.filas.filter((f) => /FortiConverter/.test(f.desc)).length, 0);

  const pedido = comercial({ bundle: 'ent', converter: true });
  assert.strictEqual(pedido.filas.filter((f) => /FortiConverter/.test(f.desc)).length, 0,
    'Enterprise ya lo incluye: pedirlo no lo duplica');
  assert.ok(pedido.avisos.some((a) => a.codigo === 'converter-incluido'));
});

test('fuera de Enterprise, FortiConverter entra SOLO por seleccion explicita', () => {
  assert.strictEqual(comercial({ bundle: 'utp' }).filas.filter((f) => /FortiConverter/.test(f.desc)).length, 0);
  const pedido = comercial({ bundle: 'utp', converter: true });
  const lin = pedido.filas.filter((f) => /FortiConverter/.test(f.desc));
  assert.strictEqual(lin.length, 1);
  assert.match(lin[0].nota, /a la carta/);
});

/* ══ AT-06 · SKU exacto por termino, nunca DD ══════════════════════════════════════════ */
test('AT-06 · un termino de tres anios produce el SKU de 36 meses, no el marcador DD', () => {
  const s = R.skuTermino('FC-10-FG90G-809-02-DD', 3, TERMINOS);
  assert.strictEqual(s.sku, 'FC-10-FG90G-809-02-36');
  assert.strictEqual(s.exacto, true);
  assert.strictEqual(s.meses, 36);

  assert.strictEqual(R.skuTermino('FC-10-FG90G-809-02-DD', 1, TERMINOS).sku, 'FC-10-FG90G-809-02-12');
  assert.strictEqual(R.skuTermino('FC-10-FG90G-809-02-DD', 5, TERMINOS).sku, 'FC-10-FG90G-809-02-60');

  // Un SKU sin el marcador se devuelve intacto: reescribir los dos ultimos caracteres a
  // ciegas corromperia los que no lo llevan.
  assert.strictEqual(R.skuTermino('FG-90G', 3, TERMINOS).sku, 'FG-90G');
});

test('AT-06b · ninguna linea exportable conserva el marcador DD', () => {
  for (const anios of [1, 3, 5]) {
    const r = comercial({ anios, bundle: 'utp', care_elegido: 'fcelite', careKey: 'elite', converter: true });
    for (const f of r.filas) {
      if (!f.sku) continue;
      assert.ok(!/-DD$/.test(f.sku), `${f.desc} conserva DD con termino de ${anios} anios`);
    }
    assert.strictEqual(r.bloqueos.filter((b) => b.codigo === 'sku-dd').length, 0);
  }
});

test('un termino sin equivalencia declarada bloquea en vez de dejar el DD puesto', () => {
  const s = R.skuTermino('FC-10-FG90G-809-02-DD', 7, TERMINOS);
  assert.strictEqual(s.exacto, false);
  assert.match(s.motivo, /no es pedible/);
});

/* ══ AT-07 / AT-08 · SD-WAN base gratis, servicios avanzados aparte ════════════════════ */
test('AT-07 · multi-WAN sin servicios cloud no fuerza Enterprise ni ningun bundle SD-WAN', () => {
  // Ninguna funcion del catalogo declara un servicio por «tener dos WAN»: la comprobacion
  // es que el conjunto de funciones con servicio FortiGuard no contenga nada de SD-WAN.
  const sdwanComoServicio = FUNCIONES.filter((f) => f.servicio && /sdwan|wan/i.test(f.servicio));
  assert.deepStrictEqual(sdwanComoServicio, []);
  const r = comercial({ bundle: 'atp', serviciosSdwan: [] });
  assert.strictEqual(r.filas.filter((f) => f.cat === 'Servicios SD-WAN').length, 0);
  assert.strictEqual(R.validarBundle('atp', [], FUNCIONES, BUNDLES), null);
});

test('AT-08 · monitoring u orquestacion derivan UNA linea con el SKU del Ordering Guide (F2)', () => {
  const svs = SERVICIOS_SDWAN.filter((s) => s.id === 'sdwanMon' || s.id === 'sdwanOrq');
  assert.strictEqual(svs.length, 2);
  const r = comercial({ serviciosSdwan: svs });
  const lineas = r.filas.filter((f) => f.cat === 'Servicios SD-WAN');
  // Un SKU por FortiGate cubre los tres servicios: dos lineas lo cobrarian dos veces.
  assert.strictEqual(lineas.length, 1);
  assert.strictEqual(lineas[0].sku, 'FC-10-0090G-1389-02-36', 'el add-on del 90G a 3 anos, con el sufijo real');
  assert.strictEqual(lineas[0].unit, null, 'la price list de septiembre no trae su precio: no se inventa');
  assert.strictEqual(r.bloqueos.filter((b) => b.codigo === 'sin-sku-sdwan').length, 0);
  assert.strictEqual(r.bloqueos.filter((b) => b.codigo === 'sin-precio-sdwan').length, 1);
  assert.ok(r.bloqueos.every((b) => b.nivel === 'borrador'), 'falta un precio: borrador, no bloqueo');
});

test('F2 · el codigo del Ordering Guide solo se acepta si casa con el de la price list', () => {
  // 20 de 23 casan. En el 70G, el 200G y el 4800F el documento imprime otro codigo que la
  // price list: sin SKU y con el motivo, porque no se sabe cual es el pedible.
  const conSku = MODELS.filter((m) => m.lic && m.lic.sdwanSvc && m.lic.sdwanSvc.addon);
  assert.strictEqual(conSku.length, 20);
  for (const id of ['70G', '200G', '4800F']) {
    const m = porId(`FortiGate ${id}`);
    assert.strictEqual(m.lic.sdwanSvc.addon, null, id);
    assert.match(m.lic.sdwanSvc.motivo, /no se sabe cuál es el pedible/, id);
    const r = comercial({ modelo: m, serviciosSdwan: SERVICIOS_SDWAN.slice(0, 1) });
    assert.ok(r.bloqueos.some((b) => b.codigo === 'sin-sku-sdwan' && /price list usa/.test(b.mensaje)), id);
  }
  // El tramo lo decide el documento: 1387 hasta el 50G, 1389 desde el 70G.
  assert.match(porId('FortiGate 40F').lic.sdwanSvc.addon, /-1387-02-DD$/);
  assert.match(porId('FortiGate 80F').lic.sdwanSvc.addon, /-1389-02-DD$/);
  // Cada SKU aceptado lleva el MISMO codigo de modelo que el bundle de la price list.
  for (const m of conSku) {
    const cod = /^FC-10-([A-Z0-9]+)-/.exec(m.lic.sdwanSvc.addon)[1];
    assert.ok([m.lic.ent, m.lic.utp, m.lic.atp].some((t) => t && t.sku && t.sku.startsWith(`FC-10-${cod}-`)), m.id);
  }
});

test('F2 · el SD-WAN Service de gama 1389 trae plazas de FortiSASE: se avisa, no se descuenta a ojo', () => {
  const sase = SERVICIOS_SDWAN.filter((s) => s.id === 'sdwanSase');
  // 90G: add-on 1389, que incluye plazas segun la gama. La linea de usuarios no se toca.
  const r = comercial({ serviciosSdwan: sase, saseUsuarios: 20 });
  const aviso = r.avisos.find((a) => a.codigo === 'sase-incluido-sdwan');
  assert.ok(aviso && /FC-10-0090G-1389-02-DD/.test(aviso.mensaje));
  // Los dos documentos oficiales no coinciden en el ultimo tramo: el aviso lo dice.
  assert.match(aviso.mensaje, /1800F/);
  assert.match(aviso.mensaje, /2500G/);
  assert.strictEqual(r.filas.find((f) => /FortiSASE — licencias/.test(f.desc)).qty, 20, 'no se descuentan plazas deducidas');
  // 40F: add-on 1387, sin plazas incluidas. No hay nada que avisar.
  const r40 = comercial({ modelo: porId('FortiGate 40F'), serviciosSdwan: sase, saseUsuarios: 20 });
  assert.ok(!r40.avisos.some((a) => a.codigo === 'sase-incluido-sdwan'));
});

/* ══ AT-10 · SD-WAN no excluye por modelo ══════════════════════════════════════════════ */
test('AT-10 · un 40F con SD-WAN base no se excluye por ser un 40F: se evalua por capacidad', () => {
  const m = porId('FortiGate 40F');
  // 200 Mbps por el overlay: el motor IPsec del 40F (4,4 Gbps) da de sobra.
  const r = R.evaluarModelo(m, { tp: 200, vpn: 200 });
  assert.strictEqual(r.estado, 'ok');
  // Y a 5 Gbps de overlay ya no: lo rechaza la cifra, no el numero de modelo.
  const grande = R.evaluarModelo(m, { tp: 200, vpn: 5000 });
  assert.strictEqual(grande.estado, 'excede');
  assert.strictEqual(grande.manda.k, 'vpn');
});

/* ══ AT-12 · sesiones por usuario como politica, con su procedencia ════════════════════ */
test('AT-12 · el eje de sesiones existe con dato y se declara cuando no lo hay', () => {
  const m = porId('FortiGate 90G');
  const r = R.evaluarModelo(m, { tp: 500, sess: 10000, cps: 333 });
  assert.strictEqual(r.ejes.find((e) => e.k === 'sess').cap, m.sess);
  assert.strictEqual(r.ejes.find((e) => e.k === 'cps').cap, m.cps);
  // Un eje en 0 no se evalua: no se puede declarar ganador ni perdedor a lo que no se pidio.
  assert.strictEqual(R.evaluarModelo(m, { tp: 500 }).ejes.length, 1);
});

/* ══ AT-13 · el SPU es dato de plataforma y tiene que estar registrado ═════════════════ */
test('AT-13 · todos los modelos declaran su plataforma de aceleracion con su fuente', () => {
  const sinAsic = MODELS.filter((m) => !m.asic || !m.asicSrc);
  assert.deepStrictEqual(sinAsic.map((m) => m.id), [],
    'un modelo sin SPU registrado tiene que fallar la validacion del dataset');
  // Y el SPU no se deduce del nombre: el 30G es serie G y NO lleva el SP5 de sus hermanos.
  assert.match(porId('FortiGate 30G').asic, /SP4/);
  assert.match(porId('FortiGate 90G').asic, /SP5/);
});

/* ══ AT-14 · un modelo EOL no se recomienda en compra nueva ════════════════════════════ */
test('AT-14 · un equipo sin SKU de hardware vigente bloquea la cotizacion y lo dice', () => {
  const eol = MODELS.find((m) => !m.hwSku);
  assert.ok(eol, 'el catalogo tiene equipos descontinuados a proposito, como referencia');
  const r = comercial({ modelo: eol });
  assert.ok(r.bloqueos.some((b) => b.codigo === 'sin-sku-hardware'));
});

/* ══ AT-15 / AT-16 · puerta de exportacion ═════════════════════════════════════════════ */
test('AT-15 · la huella identifica el escenario: el orden no la cambia, un dato si', () => {
  // Desde el 2026-09-23 la huella la calcula el motor unico (SHA-256 canonico) y la compara el
  // servidor antes de confirmar una salida comercial: un BOM construido sobre otro escenario
  // no puede salir porque la huella que viaja con el ya no es la del escenario evaluado.
  const M = require('../public/js/fortinet-motor.js');
  const h1 = M.huella({ bw: 1000, capa: 'tp', ssl: true });
  assert.strictEqual(h1, M.huella({ ssl: true, capa: 'tp', bw: 1000 }), 'el orden de claves no cambia la huella');
  assert.notStrictEqual(h1, M.huella({ bw: 1001, capa: 'tp', ssl: true }));
});

test('AT-16 · una lista de precios vencida bloquea la exportacion comercial', () => {
  const vencida = R.saludPrecios({ fecha: '2026-01-15' }, '2026-09-22T00:00:00Z');
  assert.strictEqual(vencida.estado, 'vencida');
  assert.strictEqual(vencida.bloquea, true);
  assert.strictEqual(vencida.meses, 8);

  const vigente = R.saludPrecios({ fecha: '2026-09-07' }, '2026-09-22T00:00:00Z');
  assert.strictEqual(vigente.estado, 'vigente');
  assert.strictEqual(vigente.bloquea, false);

  // Una fuente sin fecha no es una fuente reciente: bloquea igual que una vencida.
  assert.strictEqual(R.saludPrecios({ fecha: null }).bloquea, true);
});

test('la puerta de cuatro estados del 23-sep sustituye a los seis del 22-sep, y cada una sabe que deja salir', () => {
  // Las acciones por estado viven en el motor; aqui se fija el contrato que consumen todos los
  // botones de la pagina y el endpoint del servidor.
  const M = require('../public/js/fortinet-motor.js');
  assert.deepStrictEqual(Object.keys(M.ACCIONES).sort(), ['BLOCKED', 'DRAFT', 'READY', 'WARNING']);
  assert.deepStrictEqual(M.ACCIONES.BLOCKED, []);
  assert.deepStrictEqual(M.ACCIONES.DRAFT, ['excel-borrador', 'copiar-borrador']);
  for (const e of ['READY', 'WARNING']) {
    for (const a of ['excel', 'copiar', 'cotizador', 'perfil', 'consolidar']) assert.ok(M.ACCIONES[e].includes(a), `${e} deja ${a}`);
  }
});

/* ══ AT-17 · HA ════════════════════════════════════════════════════════════════════════ */
test('AT-17 · en HA cada nodo lleva su licencia, y la excepcion se declara sin ofrecerla a ciegas', () => {
  const r = comercial({ qty: 2 });
  for (const f of r.filas.filter((x) => x.cat !== 'Servicios opcionales')) {
    assert.strictEqual(f.qty, 2, `${f.desc} tiene que ir por dos`);
  }
  const ha = r.avisos.find((a) => a.codigo === 'ha-licencia-por-nodo');
  assert.ok(ha);
  assert.match(ha.mensaje, /este catálogo no trae esa elegibilidad/);
});

/* ══ AT-19 · una interface fisica no obliga a subir de familia ═════════════════════════ */
test('AT-19 · 10GE requerido se valida contra las interfaces publicadas, no contra la gama', () => {
  // El 90G (gama de sucursal) publica 2x10GE SFP+: exigir 10GE no puede empujar a un 600F.
  assert.match(porId('FortiGate 90G').ifaces, /10GE/);
  const conDiez = MODELS.filter((m) => /10GE|25GE|40GE|100GE|400GE/.test(m.ifaces || ''));
  assert.ok(conDiez.some((m) => /90G|120G/.test(m.id)),
    'la lista de equipos con 10GE tiene que incluir gama de sucursal');
});

/* ══ Integridad del dato nuevo ═════════════════════════════════════════════════════════ */
test('el campo ssl es null explicito donde el catalogo no lo trae, nunca undefined ni 0', () => {
  for (const m of MODELS) {
    assert.ok(Object.prototype.hasOwnProperty.call(m, 'ssl'), `${m.id} sin campo ssl`);
    assert.ok(m.ssl === null || m.ssl > 0, `${m.id} tiene un ssl que no es ni null ni una cifra`);
  }
  const conDato = MODELS.filter((m) => m.ssl != null);
  assert.strictEqual(conDato.length, 58,
    '58 modelos con cifra oficial: 27 filas del Matrix + 24 variantes + 5 fichas por serie (100F, 200F, 400F, 600F, 1000F) + 2 variantes (401F, 1001F)');
  // Ninguno sin dato desde el 2026-09-24. Se enumera igual: si manana uno lo perdiera, la
  // prueba dice cual en vez de contar un total que cuadra.
  const sinDato = MODELS.filter((m) => m.ssl == null).map((m) => m.id.replace('FortiGate ', ''));
  assert.deepStrictEqual(sinDato.sort(), []);
  // Y los de ficha declaran DE QUE ficha salen, no del Matrix.
  for (const id of ['100F', '200F', '400F', '401F', '600F', '1000F', '1001F']) {
    assert.match(porId(`FortiGate ${id}`).limitesDe.fuente, /^ficha por serie FG-/, id);
  }
  // Las variantes con SSD heredan del modelo base por la regla ya declarada en el archivo.
  const pares = [['30G', '31G'], ['50G', '51G'], ['70G', '71G'], ['90G', '91G'],
    ['200G', '201G'], ['3500F', '3501F'], ['4800F', '4801F']];
  for (const [a, b] of pares) {
    assert.strictEqual(porId(`FortiGate ${b}`).ssl, porId(`FortiGate ${a}`).ssl);
    assert.strictEqual(porId(`FortiGate ${b}`).matrixDe, a, `${b} debe declarar de quien hereda`);
  }
  // Y el modelo base NO declara herencia: un valor propio marcado como heredado seria una
  // procedencia falsa, que es justo lo que `matrixDe` existe para poder decir en la ficha.
  assert.strictEqual(porId('FortiGate 30G').matrixDe, null);
});

test('los bundles declaran su contenido como datos, y los tres traen FortiCare Premium', () => {
  for (const [code, b] of Object.entries(BUNDLES)) {
    assert.ok(Array.isArray(b.incluye) && b.incluye.length, `${code} sin incluye`);
    assert.ok(b.incluye.includes('forticare-premium'), `${code} deberia incluir FortiCare Premium`);
    assert.ok(b.nivel > 0, `${code} sin nivel de cobertura`);
  }
  // Solo Enterprise trae DLP, IoT Security y FortiConverter: es lo que sostiene AT-03 y AT-05.
  for (const s of ['dlp', 'iot', 'forticonverter']) {
    const traen = Object.keys(BUNDLES).filter((c) => BUNDLES[c].incluye.includes(s));
    assert.deepStrictEqual(traen, ['ent'], `${s} solo esta en Enterprise`);
  }
});

test('cada funcion del catalogo declara un servicio que algun bundle cubre, o ninguno', () => {
  for (const f of FUNCIONES) {
    for (const s of [f.servicio].concat(f.tambien || []).filter(Boolean)) {
      const cubre = Object.values(BUNDLES).some((b) => b.incluye.includes(s));
      assert.ok(cubre, `la funcion ${f.n} pide el servicio "${s}" y ningun bundle lo incluye`);
    }
    if (f.capa) assert.ok(R.ORDEN_CAPAS.includes(f.capa), `${f.n} declara una capa inexistente`);
  }
});

/* ── «NO INCLUIR» EN LOS DOS COMBOS COMERCIALES (2026-09-22) ──────────────────────────
   Peticion del dueño: el bundle FortiGuard y el nivel FortiCare necesitan la opcion de no
   cotizarse. Hay dos cotizaciones legitimas que antes no se podian armar -solo hardware, y
   equipo separado de servicios-, y la primera version del cambio se ESTRELLABA: `BUNDLES`
   no tiene clave `none`, asi que leer `BUNDLES[bundle].n` lanzaba dentro de `renderBom` y,
   como la excepcion abortaba antes de escribir la tabla, la lista de materiales se quedaba
   con el contenido ANTERIOR. En pantalla eso se lee como «el combo no hace nada», no como
   «la pagina ha fallado» — el peor modo de fallo posible en la cifra que ve un cliente.
   De ahi que estas pruebas afirmen la FORMA de las filas y no solo que no lanza. */
// Reusa el `comercial()` de arriba fijando solo los dos combos que este bloque examina.
const comercialBC = (bundle, care) =>
  comercial({ bundle, care_elegido: care, careKey: CARE_KEY[care] || null });

test('AT-21 · excluir el bundle quita su linea y lo declara, sin tocar el equipo', () => {
  const r = comercialBC('none', 'fcpre');
  const cats = r.filas.map((f) => f.cat);
  assert.ok(cats.includes('Equipo'), 'el equipo se sigue cotizando');
  assert.ok(!cats.includes('Licencias FortiGuard'), 'no puede quedar linea de bundle');
  assert.ok(r.avisos.some((a) => a.codigo === 'bundle-excluido'),
    'una cotizacion sin suscripcion que no lo diga es una cotizacion corta presentada como completa');
});

test('AT-22 · sin bundle, el soporte deja de estar incluido y vuelve a ser linea propia', () => {
  // La regla de AT-04 (los tres bundles traen FortiCare Premium) es lo que hace que el
  // soporte no se cotice aparte. Sin bundle esa razon desaparece: si el soporte volviera a
  // omitirse, la cotizacion no llevaria NADA de soporte sin decirlo.
  const r = comercialBC('none', 'fcpre');
  const sop = r.filas.find((f) => f.cat === 'Soporte');
  assert.ok(sop, 'el soporte tiene que volver a ser linea propia');
  assert.ok(sop.sku, 'y con su SKU resuelto: sin el, la cotizacion no se puede pedir');
  assert.ok(!/DD$/.test(sop.sku), 'el marcador DD del price list no es un codigo pedible (AT-06)');
  assert.strictEqual(r.bloqueos.length, 0,
    'equipo + soporte sin bundle es una cotizacion completa y pedible: no hay nada que bloquear');
});

test('AT-23 · excluir el soporte se declara distinto segun lo traiga o no el bundle', () => {
  const conBundle = comercialBC('ent', 'none');
  assert.ok(!conBundle.filas.some((f) => f.cat === 'Soporte'));
  const a1 = conBundle.avisos.find((a) => a.codigo === 'soporte-excluido');
  assert.ok(a1 && /no pierde cobertura/.test(a1.mensaje),
    'con Enterprise puesto, excluir la linea de soporte no quita cobertura y hay que decirlo asi');

  const sinBundle = comercialBC('none', 'none');
  assert.deepStrictEqual(sinBundle.filas.map((f) => f.cat), ['Equipo'],
    'solo hardware: ni bundle ni soporte');
  const a2 = sinBundle.avisos.find((a) => a.codigo === 'soporte-excluido');
  assert.ok(a2 && /RMA/.test(a2.mensaje),
    'sin bundle que lo traiga, el equipo va sin RMA ni actualizaciones y eso NO puede callarse');
});

test('AT-24 · excluir el bundle avisa pero NO bloquea; elegir uno insuficiente si bloquea', () => {
  // La diferencia es la que separa «esto no se puede pedir» de «esto se deja fuera a
  // proposito». Bloquear la exportacion de una cotizacion de solo hardware dejaria sin
  // salida a quien la arma, y entonces la tabla se copia a mano — y la advertencia se
  // pierde, que es el mismo razonamiento por el que el override existe con motivo.
  const excluido = R.validarBundle('none', ['chkIotDlp'], FUNCIONES, BUNDLES);
  assert.strictEqual(excluido.codigo, 'bundle-excluido');
  assert.strictEqual(excluido.bloquea, false);
  assert.match(excluido.mensaje, /no el escenario/,
    'tiene que decir que la cotizacion cubre el equipo pero no el escenario pedido');

  const insuficiente = R.validarBundle('utp', ['chkIotDlp'], FUNCIONES, BUNDLES);
  assert.strictEqual(insuficiente.codigo, 'bundle-insuficiente');
  assert.strictEqual(insuficiente.bloquea, true, 'UTP con DLP e IoT sigue sin poderse pedir');
});

test('AT-25 · sin ninguna funcion que licenciar, excluir el bundle no genera aviso', () => {
  // `bundleMinimo` devuelve un minimo aunque no se pida ningun servicio -sin servicios,
  // todos los bundles «cubren» el vacio-, asi que usarlo como guarda avisaba SIEMPRE. Un
  // aviso que sale en todos los casos deja de leerse, que es como se apaga una advertencia.
  assert.strictEqual(R.validarBundle('none', [], FUNCIONES, BUNDLES), null);
  assert.strictEqual(R.validarBundle('none', ['chkSsl'], FUNCIONES, BUNDLES), null,
    'la inspeccion SSL no es un servicio licenciado por bundle en este catalogo');
  assert.ok(R.validarBundle('none', ['chkAv'], FUNCIONES, BUNDLES),
    'el antivirus si es un servicio de bundle: excluirlo se declara');
});

/* ── REDISENO DEL FORMULARIO (2026-09-22, peticion del dueno) ──────────────────────────
   «Solo las variables y los campos necesarios para dimensionar SD-WAN y NGFW; quita el tipo
   de transaccion, que no es valido tecnicamente; valida sesiones, cantidad de VPN y usuarios
   concurrentes.» Lo que estas pruebas fijan es la parte del rediseno que vive en el modulo
   puro: el licenciamiento por endpoint derivado del dimensionamiento. El resto -las bajas de
   campos y el reparto de la demanda entre ejes- lo guardan `test/pantallas-campos.test.js`,
   los contrastes y la bateria e2e, porque son de la pantalla y no de las reglas. */

test('AT-26 · FortiClient EMS entra con la cantidad de endpoints del dimensionamiento', () => {
  // La cantidad NO se pide en el paso 4: son los usuarios ya declarados. Un segundo campo
  // para el mismo dato es como se desincronizan dos sitios con la misma cifra. Sin el
  // despliegue declarado entra UNA linea con los endpoints y sin SKU.
  const r = comercial({ endpointsEms: 500 });
  const ems = r.filas.find((f) => f.cat === 'Licencias endpoint');
  assert.ok(ems, 'con endpoints declarados tiene que haber linea de EMS');
  assert.strictEqual(ems.qty, 500, 'la cantidad es el numero de endpoints, no las unidades de hardware');
  assert.strictEqual(ems.sku, null, 'sin despliegue no hay SKU de pack');
});

test('AT-27 · EMS sin despliegue declarado cierra la cotizacion en firme y dice por que', () => {
  // Es la misma regla que el resto: una linea sin codigo pedible no sale como cotizacion en
  // firme. Desde el 2026-09-24 el codigo existe (Ordering Guide de FortiClient), pero depende
  // del despliegue, y sin el no se elige uno a ojo.
  const r = comercial({ endpointsEms: 500 });
  const b = r.bloqueos.find((x) => x.codigo === 'sin-sku-ems');
  assert.ok(b, 'tiene que bloquear');
  assert.match(b.mensaje, /despliegue/, 'y decir por que: falta el despliegue');
});

test('EMS · packs del Ordering Guide de FortiClient, repartidos del mayor al menor', () => {
  assert.deepStrictEqual(R.packsEms(550, EMS_LICENCIAS.packs), [{ tam: 500, n: 1 }, { tam: 25, n: 2 }],
    '550 = 1 x 500 + 2 x 25, el ejemplo del propio documento');
  assert.deepStrictEqual(R.packsEms(350, EMS_LICENCIAS.packs), [{ tam: 25, n: 14 }]);
  assert.deepStrictEqual(R.packsEms(480, EMS_LICENCIAS.packs), [{ tam: 500, n: 1 }], 'se redondea a 25: 480 son 500');
  assert.deepStrictEqual(R.packsEms(12001, EMS_LICENCIAS.packs), [{ tam: 10000, n: 1 }, { tam: 2000, n: 1 }, { tam: 25, n: 1 }]);
  // Con el despliegue, cada pack es una linea con su SKU exacto y el sufijo real del termino.
  const nube = comercial({ endpointsEms: 550, emsDespliegue: 'cloud' });
  const lineas = nube.filas.filter((f) => f.cat === 'Licencias endpoint');
  assert.deepStrictEqual(lineas.map((f) => [f.sku, f.qty]),
    [['FC2-10-EMS05-428-01-36', 1], ['FC1-10-EMS05-428-01-36', 2]]);
  assert.ok(lineas.every((f) => f.unit === null), 'la price list no trae su precio: no se inventa');
  assert.ok(!nube.bloqueos.some((b) => b.codigo === 'sin-sku-ems'));
  assert.ok(nube.bloqueos.some((b) => b.codigo === 'sin-precio-ems' && b.nivel === 'borrador'));
  const local = comercial({ endpointsEms: 25, emsDespliegue: 'onprem', anios: 1 });
  assert.strictEqual(local.filas.find((f) => f.cat === 'Licencias endpoint').sku, 'FC1-10-EMS04-428-01-12', 'on-premise es EMS04');
});

test('FortiSASE · el SKU sale de la edicion y de la banda de usuarios del Ordering Guide', () => {
  const sase = SERVICIOS_SDWAN.filter((x) => x.id === 'sdwanSase');
  const lin = (r) => r.filas.find((f) => /FortiSASE .*licencias/.test(f.desc));
  // Sin edicion: linea sin SKU y el motivo.
  const sinEd = comercial({ serviciosSdwan: sase, saseUsuarios: 120 });
  assert.strictEqual(lin(sinEd).sku, null);
  assert.ok(sinEd.bloqueos.some((b) => b.codigo === 'sin-sku-sase' && /edición/.test(b.mensaje)));
  // Banda 50-499 en Standard, 2.000-9.999 en Advanced.
  const std = comercial({ serviciosSdwan: sase, saseUsuarios: 120, saseEdicion: 'standard' });
  assert.strictEqual(lin(std).sku, 'FC2-10-EMS05-547-02-36');
  assert.strictEqual(lin(std).qty, 120);
  assert.ok(std.bloqueos.some((b) => b.codigo === 'sin-precio-sase'));
  assert.strictEqual(lin(comercial({ serviciosSdwan: sase, saseUsuarios: 2500, saseEdicion: 'advanced' })).sku, 'FC4-10-EMS05-676-02-36');
  // Por debajo de la banda minima no hay SKU, y no se sube a 50 por su cuenta.
  const poco = comercial({ serviciosSdwan: sase, saseUsuarios: 20, saseEdicion: 'standard' });
  assert.strictEqual(lin(poco).sku, null);
  assert.strictEqual(lin(poco).qty, 20);
  assert.ok(poco.bloqueos.some((b) => b.codigo === 'sase-bajo-minimo'));
  // Comprehensive por debajo de 200 usuarios: el documento advierte de PoP limitados.
  const comp = comercial({ serviciosSdwan: sase, saseUsuarios: 150, saseEdicion: 'comprehensive' });
  assert.strictEqual(lin(comp).sku, 'FC2-10-EMS05-759-02-36');
  assert.ok(comp.avisos.some((a) => a.codigo === 'sase-pop-limitado'));
});

test('AT-28 · sin endpoints declarados no aparece ninguna linea de endpoint', () => {
  // Un bloqueo que se enciende solo porque el bloque existe cerraria la exportacion de todo
  // escenario, y una puerta que nunca se abre se rodea copiando la tabla a mano.
  for (const v of [0, undefined, null, '']) {
    const r = comercial({ endpointsEms: v });
    assert.ok(!r.filas.some((f) => f.cat === 'Licencias endpoint'), `endpointsEms=${v} no debe cotizar EMS`);
    assert.ok(!r.bloqueos.some((x) => x.codigo === 'sin-sku-ems'), `endpointsEms=${v} no debe bloquear`);
  }
});

/* ── AT-29 a AT-34 · LIMITES DE CONFIGURACION DEL PRODUCT MATRIX (2026-09-23) ────────────
   El informe los pedia como P1 (pendiente F4) y la pagina los declaraba sin poder
   comprobarlos: «el limite de tuneles por modelo no esta en este catalogo». La edicion de
   septiembre del Matrix los publica y ya entraron al catalogo, asi que lo que estas pruebas
   guardan es que el motor los TRATE COMO LO QUE SON -topes de plataforma, no cifras de
   laboratorio- y que sigan cayendo del lado seguro donde el documento no dice nada. */

test('AT-29 · el doble anclaje de la transcripcion del Matrix sigue casando modelo a modelo', () => {
  // Es la unica prueba de que ninguna fila se desplazo al reconstruir la tabla desde el PDF.
  // Se afirma sobre cinco modelos repartidos por toda la gama y no sobre uno: una fila
  // desplazada arrastra a sus vecinas, asi que mirar solo un extremo no la veria.
  const anclas = [
    ['FortiGate 40F', 700000, 35000, 310],
    ['FortiGate 90G', 3000000, 124000, 2600],
    ['FortiGate 200G', 11000000, 400000, 7000],
    ['FortiGate 3500G', 179000000, 1100000, 112000],
    ['FortiGate 7121F', 1000000000, 9000000, 540000],
  ];
  for (const [id, sess, cps, ssl] of anclas) {
    const m = porId(id);
    assert.strictEqual(m.sess, sess, `${id}: sess no casa con el Matrix`);
    assert.strictEqual(m.cps, cps, `${id}: cps no casa con el Matrix`);
    assert.strictEqual(m.ssl, ssl, `${id}: ssl no casa con el Matrix`);
  }
});

test('AT-30 · los tuneles sitio a sitio son un eje duro: por encima del tope el modelo no pasa', () => {
  const m = porId('FortiGate 60F');                 // tunGw = 200
  assert.strictEqual(m.tunGw, 200);
  assert.strictEqual(R.evaluarModelo(m, { tp: 100, tunGw: 180 }).estado, 'ok');
  const r = R.evaluarModelo(m, { tp: 100, tunGw: 260 });
  assert.strictEqual(r.estado, 'excede');
  assert.match(r.motivo, /T[uú]neles IPsec sitio a sitio/);
  assert.match(r.motivo, /la plataforma admite/, 'no se presenta como una cifra de rendimiento');
});

test('AT-31 · el techo de utilizacion NO se aplica a un tope de configuracion', () => {
  // La regla y su motivo: `techoUtil` es una politica sobre CIFRAS DE LABORATORIO. Un maximo
  // de tuneles es un tope declarado por el fabricante, y recortarlo un 30 % apartaria un
  // modelo por un limite que nadie fijo -y en silencio, que es lo grave-.
  const m = porId('FortiGate 60F');
  const conTecho = { techo: 0.7 };
  assert.strictEqual(R.evaluarModelo(m, { tunGw: 180 }, conTecho).estado, 'ok',
    '180 de 200 tuneles cabe aunque el techo declarado sea del 70 %');
  // Y el mismo techo SI recorta un eje de rendimiento, que es para lo que existe.
  const caudal = R.evaluarModelo(m, { tp: m.tp * 0.8 }, conTecho);
  assert.strictEqual(caudal.estado, 'excede');
  assert.match(caudal.motivo, /techo de utilización declarado/);
});

test('AT-32 · acceso remoto: IPsec dial-up y SSL-VPN son dos topes distintos, no uno', () => {
  const m = porId('FortiGate 70F');                 // tunCli 500 · sslVpnUsers 200
  assert.strictEqual(m.tunCli, 500);
  assert.strictEqual(m.sslVpnUsers, 200);
  // 300 usuarios caben por IPsec dial-up y NO caben por SSL-VPN. Es exactamente el escenario
  // que la pagina no podia distinguir antes de preguntar el modo: sumaba los dos al eje IPsec.
  assert.strictEqual(R.evaluarModelo(m, { tunCli: 300 }).estado, 'ok');
  assert.strictEqual(R.evaluarModelo(m, { sslVpnUsers: 300 }).estado, 'excede');
});

test('AT-33 · donde el documento imprime «—» el eje se aparta, nunca se da por ilimitado', () => {
  // El 70G no publica SSL-VPN. Tratar ese hueco como «cabe» es el error caro: un diseno de
  // teletrabajo entero sobre un equipo del que no se sabe si lo soporta.
  const m = porId('FortiGate 70G');
  assert.strictEqual(m.sslVpnUsers, null);
  assert.strictEqual(m.sslVpn, null);
  const r = R.evaluarModelo(m, { tp: 100, sslVpnUsers: 50 });
  assert.strictEqual(r.estado, 'apartado');
  assert.match(r.motivo, /Usuarios SSL-VPN concurrentes/);
  // Y si nadie pide ese eje, el hueco no aparta a nadie: un eje que el escenario no declara
  // no puede descartar un modelo.
  assert.strictEqual(R.evaluarModelo(m, { tp: 100 }).estado, 'ok');
});

test('AT-34 · solo los ejes proporcionales al caudal entran en la escala de Mbps', () => {
  // `escalaMbps` sustituyo a «no tiene unidad», que funcionaba por casualidad: al entrar el
  // eje de caudal SSL-VPN -Mbps, pero una constante declarada aparte- esa deduccion habria
  // metido en la regla de tres un numero que no crece con el caudal del sitio.
  const conEscala = R.EJES.filter((e) => e.escalaMbps).map((e) => e.k);
  assert.deepStrictEqual(conEscala, ['fw', 'vpn', 'ips', 'ngfw', 'tp', 'ssl']);
  for (const e of R.EJES) {
    if (e.configuracion) assert.ok(!e.escalaMbps, `${e.k}: un tope de configuracion no escala`);
    if (e.escalaMbps) assert.ok(!e.unidad, `${e.k}: un eje de caudal se mide en Mbps`);
  }
});

test('los siete campos del Matrix llegan a los 58 modelos como null o como cifra', () => {
  const claves = ['ssl', 'tunGw', 'tunCli', 'sslVpn', 'sslVpnUsers', 'policies', 'vdomMax'];
  for (const m of MODELS) {
    for (const k of claves) {
      assert.ok(Object.prototype.hasOwnProperty.call(m, k), `${m.id} sin campo ${k}`);
      assert.ok(m[k] === null || m[k] > 0, `${m.id}.${k} no es ni null ni una cifra`);
    }
  }
  const cuenta = (k) => MODELS.filter((m) => m[k] != null).length;
  // 51 del Matrix + 7 de las fichas por serie: 400F, 600F y 1000F con 401F y 1001F (en
  // ingles) y 100F y 200F (en coreano, la inglesa da 404).
  assert.strictEqual(cuenta('tunGw'), 58);
  assert.strictEqual(cuenta('tunCli'), 58);
  assert.strictEqual(cuenta('policies'), 58);
  // sslVpn y sslVpnUsers: el documento imprime «—» en cinco modelos base (30G, 40F, 50G, 60F,
  // 70G) y sus variantes. Ese hueco es del DOCUMENTO y se declara.
  assert.strictEqual(cuenta('sslVpn'), 49);
  assert.strictEqual(cuenta('sslVpnUsers'), 49);
  assert.strictEqual(cuenta('vdomMax'), 56);
});
