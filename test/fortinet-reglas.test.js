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

const { MODELS, BUNDLES, CARE, FUNCIONES, SERVICIOS_SDWAN, TERMINOS } = fortinet;
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
  const m = porId('FortiGate 200G');
  assert.strictEqual(m.ssl, null, 'el catalogo no trae SSL de este modelo');
  const r = R.evaluarModelo(m, { tp: 1000, ssl: 1000 });
  assert.strictEqual(r.estado, 'apartado');
  assert.match(r.motivo, /no trae Inspeccion SSL/);
  assert.match(r.motivo, /PoC/);
  const ssl = r.ejes.find((e) => e.k === 'ssl');
  assert.strictEqual(ssl.estado, 'sinDato');
  assert.strictEqual(ssl.u, null, 'un eje sin dato no tiene utilizacion: no se inventa');
});

test('un eje blando sin dato (cps del 200F) NO aparta el modelo, pero se declara', () => {
  const m = porId('FortiGate 200F');
  assert.strictEqual(m.cps, null);
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
  assert.match(noConcurrentes.regla, /maximo/);

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
  assert.match(conTecho.motivo, /techo de utilizacion declarado/);
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

test('AT-08 · monitoring u orquestacion derivan su entitlement, y sin SKU bloquean la exportacion', () => {
  const svs = SERVICIOS_SDWAN.filter((s) => s.id === 'sdwanMon' || s.id === 'sdwanOrq');
  assert.strictEqual(svs.length, 2);
  const r = comercial({ serviciosSdwan: svs });
  const lineas = r.filas.filter((f) => f.cat === 'Servicios SD-WAN');
  assert.strictEqual(lineas.length, 2);
  // Este repositorio no ha leido esos SKU del Ordering Guide: la linea se declara sin SKU y
  // la puerta de exportacion la bloquea, en vez de inventar un codigo con pinta de valido.
  assert.strictEqual(r.bloqueos.filter((b) => b.codigo === 'sin-sku-sdwan').length, 2);
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
test('AT-15 · un escenario modificado despues del calculo invalida el BOM y cierra la exportacion', () => {
  const e1 = { bw: 1000, capa: 'tp', ssl: true };
  const h1 = R.huella(e1);
  assert.strictEqual(h1, R.huella({ ssl: true, capa: 'tp', bw: 1000 }), 'el orden de claves no cambia la huella');
  assert.notStrictEqual(h1, R.huella({ ...e1, bw: 1001 }));

  const st = R.estadoEscenario({ hayCandidato: true, stale: true, bloqueos: [], avisos: [] });
  assert.strictEqual(st.estado, 'bloqueado');
  assert.strictEqual(st.puedeExportar, false);
  assert.match(st.titulo, /modificado despues del calculo/);
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

test('los seis estados del informe, y cual de ellos deja exportar', () => {
  const base = { hayCandidato: true, stale: false, bloqueos: [], avisos: [] };
  assert.strictEqual(R.estadoEscenario({ ...base, faltan: ['caudal WAN'] }).estado, 'borrador');
  assert.strictEqual(R.estadoEscenario({ ...base, faltan: ['caudal WAN'] }).puedeCalcular, false);
  assert.strictEqual(R.estadoEscenario({ ...base, hayCandidato: false }).estado, 'calculable');
  assert.strictEqual(R.estadoEscenario({ ...base, hayCandidato: false }).puedeExportar, false);
  assert.strictEqual(R.estadoEscenario({ ...base, bloqueos: [{ mensaje: 'x' }] }).puedeExportar, false);
  assert.strictEqual(R.estadoEscenario({ ...base, avisos: [{ mensaje: 'y' }] }).estado, 'advertencia');
  assert.strictEqual(R.estadoEscenario({ ...base, avisos: [{ mensaje: 'y' }] }).puedeExportar, true);
  assert.strictEqual(R.estadoEscenario(base).estado, 'valido-comercial');
  assert.strictEqual(R.estadoEscenario(base).puedeExportar, true);
});

/* ══ AT-17 · HA ════════════════════════════════════════════════════════════════════════ */
test('AT-17 · en HA cada nodo lleva su licencia, y la excepcion se declara sin ofrecerla a ciegas', () => {
  const r = comercial({ qty: 2 });
  for (const f of r.filas.filter((x) => x.cat !== 'Servicios opcionales')) {
    assert.strictEqual(f.qty, 2, `${f.desc} tiene que ir por dos`);
  }
  const ha = r.avisos.find((a) => a.codigo === 'ha-licencia-por-nodo');
  assert.ok(ha);
  assert.match(ha.mensaje, /este catalogo no trae esa elegibilidad/);
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
  assert.strictEqual(conDato.length, 9, 'nueve modelos con cifra oficial: 5 base + 4 variantes con SSD');
  // Las variantes con SSD heredan del modelo base por la regla ya declarada en el archivo.
  const pares = [['30G', '31G'], ['50G', '51G'], ['70G', '71G'], ['90G', '91G']];
  for (const [a, b] of pares) {
    assert.strictEqual(porId(`FortiGate ${b}`).ssl, porId(`FortiGate ${a}`).ssl);
  }
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
