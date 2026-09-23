'use strict';
/* PRUEBAS DEL MOTOR UNICO DEL DIMENSIONADOR FORTIGATE (etapa 7, 2026-09-23).
   Se afirman contra `public/js/fortinet-motor.js`, el mismo archivo que evalua en el navegador
   y en `POST /api/v1/fortinet/evaluations`. Los identificadores T01-T30 son los del «Informe
   de auditoria y propuesta de rediseno dinamico» del 23-sep; los que necesitan navegador
   (disposicion, accesibilidad, que la PANTALLA obedezca la puerta) viven en
   `test/e2e/e2e-fortinet-rediseno.js` con el mismo identificador, para poder cruzarlos.

   EL ESCENARIO DE REFERENCIA ES EL DEL INFORME, NO UNO COMODO: sucursal spoke con dos hubs,
   un DIA de 500 Mbps todo por el overlay, 200 Mbps inter-VLAN, 50 remotos con 100 Mbps, 300
   usuarios con 75 sesiones y vida media de 30 s, Threat Protection + AV + web + SSL profunda,
   30 % de crecimiento y techo del 70 %. El informe midio en la pantalla 90G, TP 50 % y SSL
   42 %; si el motor deja de dar eso, algo cambio en la aritmetica y la prueba lo dice. */

const test = require('node:test');
const assert = require('node:assert');
const crypto = require('crypto');

const M = require('../public/js/fortinet-motor.js');
const fortinet = require('../server/seed/legacyData/fortinet.js');
const SKUS = require('../server/seed/legacyData/fortinetSkus.js');

// El catalogo con la misma forma que sirve /api/dimensionador/fortinet: `eol` lo pone la base
// para los equipos sin SKU de hardware vigente.
const CAT = {
  // `elpN` lo pone la base desde cotizadorCatalog; aqui sale de la misma price list, por el
  // SKU de hardware de cada modelo.
  models: fortinet.MODELS.map((m) => ({ ...m, eol: !m.hwSku,
    elpN: ((SKUS[m.id] || []).find((x) => x.sku === m.hwSku) || {}).p ?? null })),
  bundles: fortinet.BUNDLES, care: fortinet.CARE, funciones: fortinet.FUNCIONES,
  serviciosSdwan: fortinet.SERVICIOS_SDWAN, terminos: fortinet.TERMINOS, fortios: fortinet.FORTIOS,
  datasetVersion: 'fortinet@prueba',
};
const CU01 = () => ({
  sitio: { segmento: 'branch' },
  topologia: { rol: 'spoke', hubs: 2, enlaces: [{ id: 1, tipo: 'DIA', down: 500, overlay: true }] },
  trafico: { interVlanMbps: 200 },
  seguridad: { capa: 'tp', funciones: ['chkAv', 'chkWeb', 'chkSsl'] },
  remoto: { activo: true, metodo: 'ipsec', usuarios: 50, mbps: 100 },
  escala: { usuarios: 300, sesionesPorUsuario: 75, vidaSesionS: 30 },
  politica: { crecimientoPct: 30, techoPct: 70 },
});
const con = (base, parche) => {
  const o = JSON.parse(JSON.stringify(base));
  for (const [ruta, v] of Object.entries(parche)) {
    const ks = ruta.split('.');
    const ult = ks.pop();
    ks.reduce((a, k) => (a[k] = a[k] || {}), o)[ult] = v;
  }
  return o;
};
const evaluar = (esc) => M.evaluar(esc, CAT, { hoy: '2026-09-23T00:00:00Z' });
const eje = (c, k) => c.eval.ejes.find((e) => e.k === k);

test('la huella es SHA-256 de verdad: coincide con crypto de Node, tambien con UTF-8 multibyte', () => {
  for (const t of ['', 'abc', 'Fortinet — ñ € 😀', 'x'.repeat(4097)]) {
    assert.strictEqual(M.sha256(t), crypto.createHash('sha256').update(t, 'utf8').digest('hex'), JSON.stringify(t).slice(0, 30));
  }
});

test('T01 · el escenario auditado recomienda 90G con TP ~50 % y SSL ~42 % (tolerancia de 1 punto)', () => {
  const r = evaluar(CU01());
  assert.strictEqual(r.recomendacion.id, 'FortiGate 90G');
  assert.strictEqual(r.seleccion.id, 'FortiGate 90G');
  const c = r.recomendacion;
  assert.ok(Math.abs(eje(c, 'tp').u * 100 - 50) < 1, `TP ${eje(c, 'tp').u}`);
  assert.ok(Math.abs(eje(c, 'ssl').u * 100 - 42) < 1, `SSL ${eje(c, 'ssl').u}`);
  assert.strictEqual(c.eval.manda.k, 'tp', 'el cuello de botella es Threat Protection');
  assert.strictEqual(r.detalle.sess, 34125, 'las sesiones del informe');
  assert.strictEqual(r.detalle.cps, 1138, 'y sus sesiones nuevas por segundo');
  assert.ok(Math.abs(r.detalle.effectiveNeed - 1100) < 10, `la demanda presentada es ~1,1 Gbps (${r.detalle.effectiveNeed})`);
  assert.ok(Math.abs(r.multiplicador.total - 1.857) < 0.001, 'el multiplicador combinado crecimiento/techo se expone');
  assert.strictEqual(r.quoteGate, 'READY');
});

test('T02 · forzar el 40F bloquea, muestra el deficit de TP y SSL, y no toca el modelo validado', () => {
  const r = evaluar(con(CU01(), { 'seleccion.manual': 'FortiGate 40F' }));
  assert.strictEqual(r.quoteGate, 'BLOCKED');
  assert.deepStrictEqual(r.acciones, [], 'ninguna salida comercial');
  assert.strictEqual(r.seleccion.id, 'FortiGate 90G', 'la recomendacion vigente se conserva');
  assert.strictEqual(r.override.elegible, false);
  const ejes = r.override.deficit.map((d) => d.eje).sort();
  assert.deepStrictEqual(ejes, ['ssl', 'tp']);
  assert.ok(r.bloqueos.some((b) => b.codigo === 'override-no-elegible'));
  assert.notStrictEqual(r.bom.modelo, 'FortiGate 40F', 'el BOM nunca se construye con el modelo rechazado');
});

test('T03 · el modelo del BOM coincide SIEMPRE con el modelo validado', () => {
  const variantes = [
    {}, { 'seleccion.manual': 'FortiGate 120G' }, { 'seleccion.manual': 'FortiGate 40F' },
    { 'disponibilidad.modo': 'ha-ap' }, { 'comercial.bundle': 'atp' }, { 'politica.techoPct': 100 },
    { 'topologia.enlaces': [{ id: 1, tipo: 'DIA', down: 3000, overlay: true }] },
  ];
  for (const v of variantes) {
    const r = evaluar(con(CU01(), v));
    if (r.seleccion) assert.strictEqual(r.bom.modelo, r.seleccion.id, JSON.stringify(v));
    else assert.strictEqual(r.bom, null, 'sin modelo validado no hay BOM');
  }
  const elegido = evaluar(con(CU01(), { 'seleccion.manual': 'FortiGate 120G' }));
  assert.strictEqual(elegido.seleccion.id, 'FortiGate 120G', 'un override que cumple SI pasa a ser el validado');
  assert.strictEqual(elegido.bom.modelo, 'FortiGate 120G');
});

test('T04/T05 · HA deriva dos nodos, multiplica hardware y suscripciones, y NO duplica capacidad', () => {
  const solo = evaluar(CU01());
  const ha = evaluar(con(CU01(), { 'disponibilidad.modo': 'ha-ap' }));
  assert.strictEqual(ha.bom.nodos, 2);
  for (const f of ha.bom.filas) assert.strictEqual(f.qty, 2, `${f.desc} va por nodo`);
  assert.strictEqual(eje(ha.seleccion, 'tp').u, eje(solo.seleccion, 'tp').u, 'la utilizacion es la de una unidad');
  assert.ok(ha.escenarios.some((e) => e.id === 'failover-ha' && e.igualANormal), 'el failover se lista y se dice que es la carga normal');
  // No hay campo de cantidad en el escenario: no se puede pedir un cluster de uno.
  assert.ok(ha.errores.length === 0);
  const conCantidad = evaluar(con(CU01(), { 'disponibilidad.nodos': 1 }));
  assert.ok(conCantidad.errores.some((e) => e.codigo === 'campo-desconocido'), 'la cantidad no es un dato del escenario');
});

test('T06 · con FortiOS 7.6.3+ SSL-VPN esta retirado: bloquea y ofrece IPsec como correccion', () => {
  const r = evaluar(con(CU01(), { 'remoto.metodo': 'sslvpn', 'software.fortiOS': '7.6.3+' }));
  assert.strictEqual(r.quoteGate, 'BLOCKED');
  const b = r.bloqueos.find((x) => x.codigo === 'fortios-funcion-retirada');
  assert.ok(b, 'bloqueo de escenario');
  assert.deepStrictEqual(b.correccion, { accion: 'cambiar', campo: 'remoto.metodo', valor: 'ipsec' });
  assert.ok(b.fuente, 'con su fuente');
  // La regla sale de una cita del informe de auditoria (Release Notes 7.6.6) que no se leyo
  // desde este entorno: el catalogo la marca `leida:false` y el bloqueo tiene que decirlo.
  assert.strictEqual(b.fuenteLeida, false, 'una cita no leida no se presenta como leida');
});

test('T07 · 90G y 91G no admiten SSL-VPN en ninguna rama ofrecida aunque el Matrix publique su cifra', () => {
  for (const v of ['7.4', '7.6.0-7.6.2', '7.6.3+']) {
    const r = evaluar(con(CU01(), { 'remoto.metodo': 'sslvpn', 'software.fortiOS': v }));
    for (const id of ['FortiGate 90G', 'FortiGate 91G']) {
      const c = r.candidatos.find((x) => x.id === id);
      assert.ok(c.modelo.sslVpnUsers > 0, 'el dato historico existe');
      const b = c.bloqueos.find((x) => x.codigo === 'FORTIOS_INCOMPATIBLE');
      assert.ok(b, `${id} con ${v}`);
      assert.ok(!c.elegible);
      // En 7.4 manda la nota 11 del Matrix, leida; en 7.6.3+ la regla retirada, citada.
      assert.strictEqual(b.fuenteLeida, v !== '7.6.3+', `${id} con ${v}: ${b.fuente}`);
    }
  }
  const r74 = evaluar(con(CU01(), { 'remoto.metodo': 'sslvpn', 'software.fortiOS': '7.4' }));
  assert.strictEqual(r74.recomendacion.id, 'FortiGate 120G', 'en 7.4 otro modelo con SSL-VPN publicado lo cubre');
  // En 7.6.0-7.6.2 la RAM decide y no esta en el catalogo: nunca «soportada» por omision.
  const r760 = evaluar(con(CU01(), { 'remoto.metodo': 'sslvpn', 'software.fortiOS': '7.6.0-7.6.2' }));
  assert.ok(r760.avisos.some((a) => a.codigo === 'FORTIOS_DESCONOCIDA'));
  assert.strictEqual(r760.quoteGate, 'DRAFT', 'compatibilidad desconocida = confianza baja = solo borrador');
});

test('T08 · IoT/DLP con UTP bloquea; con Enterprise no', () => {
  const utp = evaluar(con(CU01(), { 'seguridad.funciones': ['chkAv', 'chkWeb', 'chkSsl', 'chkIotDlp'], 'comercial.bundle': 'utp' }));
  assert.strictEqual(utp.quoteGate, 'BLOCKED');
  assert.ok(utp.bloqueos.some((b) => b.codigo === 'bundle-insuficiente' && b.minimo === 'ent'));
  const ent = evaluar(con(CU01(), { 'seguridad.funciones': ['chkAv', 'chkWeb', 'chkSsl', 'chkIotDlp'], 'comercial.bundle': 'ent' }));
  assert.ok(!ent.bloqueos.some((b) => b.codigo === 'bundle-insuficiente'));
});

test('T09 · un bundle con FortiCare Premium no anade otra linea de Premium, en BDL ni por separado', () => {
  for (const motivo of ['nueva', 'ampliacion']) {
    const r = evaluar(con(CU01(), { 'comercial.motivo': motivo, 'comercial.soporte': 'fcpre' }));
    assert.strictEqual(r.bom.filas.filter((f) => f.cat === 'Soporte').length, 0, motivo);
  }
});

test('compra nueva usa el SKU combinado BDL; la ampliacion cotiza equipo y bundle por separado', () => {
  const nueva = evaluar(CU01());
  assert.strictEqual(nueva.bom.construccion, 'bdl');
  assert.deepStrictEqual(nueva.bom.filas.map((f) => f.sku), ['FG-90G-BDL-809-36']);
  assert.strictEqual(nueva.bom.filas[0].bdl, true);
  const amp = evaluar(con(CU01(), { 'comercial.motivo': 'ampliacion' }));
  assert.deepStrictEqual(amp.bom.filas.map((f) => f.sku), ['FG-90G', 'FC-10-0090G-809-02-36']);
  // El combinado NO es mas barato: en la lista de septiembre cuesta exactamente equipo +
  // bundle. Esta igualdad al centimo es ademas la prueba de que los precios de LICENSES se
  // reanclaron a la price list declarada (hallazgo N02): con los de agosto no cuadraba.
  const separado = amp.bom.filas.reduce((a, f) => a + f.unit, 0);
  assert.ok(Math.abs(nueva.bom.filas[0].unit - separado) < 0.01,
    `BDL ${nueva.bom.filas[0].unit} frente a equipo + bundle ${separado}`);
  // ATP no tiene combinado: se cotiza separado aunque sea compra nueva.
  const atp = evaluar(con(CU01(), { 'comercial.bundle': 'atp' }));
  assert.strictEqual(atp.bom.construccion, 'separado');
});

test('T10/T11 · sandbox incluido no crea linea; dedicado pide modalidad y va en linea propia', () => {
  const inc = evaluar(con(CU01(), { 'seguridad.funciones': ['chkAv', 'chkWeb', 'chkSsl', 'chkSandbox'], 'comercial.sandbox': 'incluido' }));
  assert.ok(!inc.bom.filas.some((f) => /Sandbox/i.test(f.desc)));
  assert.ok(inc.avisos.some((a) => a.codigo === 'sandbox-incluido'), 'la cobertura se advierte, no se da por leida');
  const ded = evaluar(con(CU01(), { 'seguridad.funciones': ['chkAv', 'chkWeb', 'chkSsl', 'chkSandbox'], 'comercial.sandbox': 'dedicado' }));
  assert.ok(ded.faltan.includes('comercial.sandboxModalidad'), 'sin modalidad no se puede cotizar');
  assert.strictEqual(ded.quoteGate, 'BLOCKED');
  const ok = evaluar(con(CU01(), { 'seguridad.funciones': ['chkAv', 'chkWeb', 'chkSsl', 'chkSandbox'],
    'comercial.sandbox': 'dedicado', 'comercial.sandboxModalidad': 'vm' }));
  const linea = ok.bom.filas.find((f) => /FortiSandbox dedicado/.test(f.desc));
  assert.ok(linea && linea.sku === null, 'linea separada, sin SKU en este catalogo');
  assert.strictEqual(ok.quoteGate, 'DRAFT');
  const ai = evaluar(con(CU01(), { 'seguridad.funciones': ['chkAv', 'chkWeb', 'chkSsl', 'chkSandbox'], 'comercial.sandbox': 'ai' }));
  assert.ok(ai.bom.filas.some((f) => f.sku === 'FC-10-0090G-577-02-36'), 'el servicio del FortiGate con su SKU de la price list');
});

test('T12 · EMS se licencia por endpoints gestionados, independientes de los usuarios', () => {
  const sinDato = evaluar(con(CU01(), { 'comercial.emsActivo': true }));
  assert.ok(sinDato.faltan.includes('comercial.emsEndpoints'), 'con EMS activo, los endpoints son obligatorios');
  const r = evaluar(con(CU01(), { 'comercial.emsActivo': true, 'comercial.emsEndpoints': 420 }));
  const ems = r.bom.filas.find((f) => f.cat === 'Licencias endpoint');
  assert.strictEqual(ems.qty, 420, 'no 350 (300 locales + 50 remotos)');
  assert.match(ems.nota, /17 tramo/);
  assert.strictEqual(r.quoteGate, 'DRAFT', 'sin SKU de tramo: borrador, no cotizacion');
});

test('T13 · sin SD-WAN, hubs, spokes, overlay y servicios avanzados quedan inactivos y fuera de la huella', () => {
  const base = con(CU01(), { 'topologia.rol': 'none', 'remoto.activo': false });
  const a = evaluar(base);
  const b = evaluar(con(base, { 'topologia.hubs': 9, 'comercial.sdwan': ['sdwanMon'] }));
  assert.strictEqual(a.scenarioHash, b.scenarioHash, 'un valor inactivo no cambia la huella');
  assert.ok(b.inactivos.includes('topologia.hubs') && b.inactivos.includes('comercial.sdwan'));
  assert.ok(!b.requisitos.some((x) => x.eje === 'tunGw'), 'sin tuneles del overlay');
  assert.ok(!b.bom.filas.some((f) => f.cat === 'Servicios SD-WAN'), 'sin servicios avanzados');
  assert.ok(!b.requisitos.some((x) => x.eje === 'vpn'), 'sin carga IPsec');
});

test('T14 · spoke cuenta sus hubs; hub cuenta sus spokes y declara el plano de control', () => {
  const spoke = evaluar(CU01());
  assert.strictEqual(spoke.requisitos.find((x) => x.eje === 'tunGw').requerido, 2);
  const hub = evaluar(con(CU01(), { 'topologia.rol': 'hub', 'topologia.spokes': 40, 'topologia.simultaneidadPct': 35 }));
  assert.strictEqual(hub.requisitos.find((x) => x.eje === 'tunGw').requerido, 40);
  assert.ok(hub.avisos.some((a) => a.codigo === 'plano-control-sin-tope'));
  assert.ok(hub.inactivos.length === 0 || !hub.inactivos.includes('topologia.spokes'));
});

test('T15 · el enlace de respaldo no suma en operacion normal y gobierna el escenario de su falla', () => {
  const esc = con(CU01(), { 'topologia.enlaces': [
    { id: 1, tipo: 'DIA', down: 500, overlay: false, rol: 'activo' },
    { id: 2, tipo: '4G/5G', down: 100, overlay: true, rol: 'respaldo' }] });
  const r = evaluar(esc);
  const normal = r.escenarios.find((e) => e.id === 'normal');
  assert.strictEqual(normal.caudal, 500, 'el respaldo no suma');
  const falla = r.escenarios.find((e) => e.id === 'falla:1');
  assert.ok(falla, 'hay escenario de falla del enlace activo');
  assert.strictEqual(falla.overlay, 100, 'la carga migra al respaldo, que va cifrado');
  const vpn = r.requisitos.find((x) => x.eje === 'vpn');
  assert.ok(vpn, 'la falla crea demanda IPsec que en normal no habia (salvo el acceso remoto)');
  const sinRespaldo = evaluar(con(CU01(), { 'topologia.enlaces': [{ id: 1, tipo: 'DIA', down: 500, overlay: false }] }));
  assert.ok(vpn.requerido > sinRespaldo.requisitos.find((x) => x.eje === 'vpn').requerido);
  assert.strictEqual(vpn.escenario, 'falla:1', 'y se dice que escenario la gobierna');
});

test('T16 · la demanda SSL es el trafico elegible por la fraccion cifrada por la fraccion inspeccionada', () => {
  const r = evaluar(con(CU01(), { 'seguridad.tlsCifradoPct': 80, 'seguridad.tlsExentoPct': 25 }));
  const ssl = r.requisitos.find((x) => x.eje === 'ssl').requerido;
  assert.ok(Math.abs(ssl - r.detalle.effectiveNeed * 0.8 * 0.75) < 1e-6);
});

test('T17 · registro local exige disco suficiente: la base sin disco sale, la variante con disco entra', () => {
  const r = evaluar(con(CU01(), { 'fisico.registro': 'local', 'fisico.registroGbDia': 1, 'fisico.registroDias': 60 }));
  const c90 = r.candidatos.find((x) => x.id === 'FortiGate 90G');
  assert.ok(c90.bloqueos.some((b) => b.codigo === 'ALMACENAMIENTO_INSUFICIENTE'), 'el 90G no tiene disco');
  assert.strictEqual(r.recomendacion.id, 'FortiGate 91G', 'su variante con 120 GB lo cubre');
  const falta = evaluar(con(CU01(), { 'fisico.registro': 'local' }));
  assert.ok(falta.faltan.includes('fisico.registroGbDia') && falta.faltan.includes('fisico.registroDias'));
  const nube = evaluar(con(CU01(), { 'fisico.registro': 'nube' }));
  assert.ok(nube.bom.filas.some((f) => f.sku === 'FC-10-0090G-585-02-36'), 'el registro en la nube con su SKU');
});

test('T18 · un requerimiento PoE no acepta un SKU base sin PoE', () => {
  const r = evaluar(con(CU01(), { 'fisico.poeW': 60 }));
  const c80 = r.candidatos.find((x) => x.id === 'FortiGate 80F');
  assert.ok(c80.bloqueos.some((b) => b.codigo === 'POE_NO_DISPONIBLE' && /variante -POE/.test(b.mensaje)));
  assert.strictEqual(r.elegibles.length, 0, 'ningun SKU del catalogo es una variante PoE');
  assert.strictEqual(r.quoteGate, 'BLOCKED');
});

test('T19 · los puertos se comparan por cantidad, velocidad y medio', () => {
  const dos = evaluar(con(CU01(), { 'fisico.puertos.sfpp_10g': 2 }));
  assert.ok(dos.candidatos.find((x) => x.id === 'FortiGate 90G').elegible, 'dos SFP+: el 90G los tiene (compartidos)');
  const tres = evaluar(con(CU01(), { 'fisico.puertos.sfpp_10g': 3 }));
  const c = tres.candidatos.find((x) => x.id === 'FortiGate 90G');
  assert.ok(c.bloqueos.some((b) => b.codigo === 'PUERTOS_INSUFICIENTES'));
  // Los compartidos cuentan como UNO u OTRO: 8 RJ45 + 2 SFP+ agotan los pares.
  const mezcla = M.asignarPuertos(fortinet.MODELS.find((m) => m.id === 'FortiGate 90G').puertos,
    { rj45_1g: 10, sfpp_10g: 1 });
  assert.strictEqual(mezcla.length, 1, 'diez RJ45 y un SFP+ no caben en 8 + 2 compartidos');
  assert.ok(tres.candidatos.find((x) => x.id === 'FortiGate 120G').elegible, 'el 120G trae 4 SFP+ dedicados');
  const sinEstructura = tres.candidatos.find((x) => x.id === 'FortiGate 200G');
  assert.ok(sinEstructura.avisos.some((a) => a.codigo === 'PUERTOS_SIN_ESTRUCTURAR'), 'donde no hay dato, se declara');
});

test('T20 · un chasis no emite BOM automatico', () => {
  const r = evaluar(con(CU01(), { 'seleccion.manual': 'FortiGate 7081F' }));
  assert.strictEqual(r.seleccion.id, 'FortiGate 7081F');
  assert.ok(r.bloqueos.some((b) => b.codigo === 'chasis-sin-configurador'));
  assert.strictEqual(r.quoteGate, 'BLOCKED');
});

test('T21 · fuera de venta: excluido en compra nueva, admitido en parque instalado solo con motivo', () => {
  const nueva = evaluar(con(CU01(), { 'comercial.motivo': 'nueva' }));
  assert.ok(!nueva.elegibles.some((c) => c.eol), 'ningun EOL elegible en compra nueva');
  const c70 = nueva.candidatos.find((x) => x.id === 'FortiGate 70F');
  assert.ok(c70.bloqueos.some((b) => b.codigo === 'CICLO_VIDA'));
  const esc = con(CU01(), { 'comercial.motivo': 'renovacion', 'comercial.serieInstalada': 'FGT70F-TEST',
    'seleccion.manual': 'FortiGate 70F', 'topologia.enlaces': [{ id: 1, tipo: 'DIA', down: 100, overlay: true }],
    'seguridad.funciones': ['chkAv'], 'remoto.activo': false });
  const sinMotivo = evaluar(esc);
  assert.ok(sinMotivo.faltan.includes('comercial.justificacionEol'));
  const conMotivo = evaluar(con(esc, { 'comercial.justificacionEol': 'Renovacion de servicios de un equipo instalado hasta su reemplazo en 2027' }));
  assert.strictEqual(conMotivo.seleccion.id, 'FortiGate 70F');
  assert.notStrictEqual(conMotivo.quoteGate, 'READY', 'nunca listo para cotizar sin reparo');
  assert.ok(!conMotivo.bom.filas.some((f) => f.cat === 'Equipo'), 'en renovacion no se cotiza la caja');
  assert.notStrictEqual(nueva.recomendacion.id, 'FortiGate 70F');
});

test('T22 · VDOM por encima de los incluidos anade la licencia; por encima del maximo aparta', () => {
  const r = evaluar(con(CU01(), { 'escala.vdoms': 20, 'seleccion.manual': 'FortiGate 200G' }));
  const lic = r.bom.filas.find((f) => /VDOM/.test(f.desc));
  assert.ok(lic, '200G: 10 incluidos, 25 de maximo');
  assert.strictEqual(lic.qty, 10);
  assert.strictEqual(r.quoteGate, 'DRAFT', 'sin SKU de la licencia: borrador');
  const mas = evaluar(con(CU01(), { 'escala.vdoms': 30, 'seleccion.manual': 'FortiGate 200G' }));
  assert.strictEqual(mas.override.elegible, false, 'por encima del maximo no cabe');
});

test('T23 · un termino de 60 meses resuelve el sufijo -60, nunca un ano', () => {
  const r = evaluar(con(CU01(), { 'comercial.anios': 5 }));
  assert.deepStrictEqual(r.bom.filas.map((f) => f.sku), ['FG-90G-BDL-809-60']);
  assert.match(r.bom.filas[0].nota, /5 años/);
});

test('T25 · la puerta decide las acciones, y BLOCKED nunca deja salir nada', () => {
  assert.deepStrictEqual(M.ACCIONES.BLOCKED, []);
  assert.ok(!M.ACCIONES.DRAFT.includes('cotizador'), 'un borrador nunca va al cotizador');
  const r = evaluar(con(CU01(), { 'seleccion.manual': 'FortiGate 40F' }));
  for (const a of ['excel', 'copiar', 'cotizador', 'perfil', 'consolidar', 'excel-borrador', 'copiar-borrador']) {
    assert.strictEqual(M.permite(r, a), false, a);
  }
  assert.strictEqual(M.permite(evaluar(CU01()), 'cotizador'), true);
});

test('T30 · la huella es determinista, ignora el orden de las claves y cambia con un dato activo', () => {
  const a = evaluar(CU01());
  const invertir = (v) => (v && typeof v === 'object' && !Array.isArray(v)
    ? Object.fromEntries(Object.keys(v).reverse().map((k) => [k, invertir(v[k])])) : v);
  const reordenado = invertir(CU01());
  assert.notStrictEqual(JSON.stringify(reordenado), JSON.stringify(CU01()), 'el orden de las claves si cambio');
  assert.strictEqual(evaluar(reordenado).scenarioHash, a.scenarioHash);
  assert.strictEqual(evaluar(CU01()).scenarioHash, a.scenarioHash);
  assert.notStrictEqual(evaluar(con(CU01(), { 'escala.usuarios': 301 })).scenarioHash, a.scenarioHash);
  assert.match(a.scenarioHash, /^sha256:[0-9a-f]{64}$/);
});

test('el esquema rechaza campos desconocidos, tipos invalidos y valores fuera de rango', () => {
  const r = evaluar({ ...CU01(), inventado: 1, escala: { usuarios: 'muchos' }, politica: { techoPct: 5 } });
  const codigos = r.errores.map((e) => `${e.codigo}:${e.campo}`);
  assert.ok(codigos.includes('campo-desconocido:inventado'));
  assert.ok(codigos.includes('tipo-invalido:escala.usuarios'));
  assert.ok(codigos.includes('fuera-de-rango:politica.techoPct'));
  assert.strictEqual(r.quoteGate, 'BLOCKED');
  assert.ok(r.bloqueos.every((b) => b.codigo === 'entrada-invalida'));
});

test('las sesiones medidas mandan sobre las estimadas, y el crecimiento se aplica una sola vez', () => {
  const r = evaluar(con(CU01(), { 'escala.sesionesMedidas': 100000 }));
  assert.strictEqual(r.requisitos.find((x) => x.eje === 'sess').requerido, 130000);
  const cps = evaluar(con(CU01(), { 'escala.cpsMedido': 5000 }));
  assert.strictEqual(cps.requisitos.find((x) => x.eje === 'cps').requerido, 6500);
});

test('MFA con FortiToken es un eje: 600 remotos con doble factor no caben en un modelo de 500 tokens', () => {
  const r = evaluar(con(CU01(), { 'remoto.usuarios': 600, 'remoto.mfa': true }));
  const c90 = r.candidatos.find((x) => x.id === 'FortiGate 90G');
  assert.strictEqual(eje(c90, 'tokens').estado, 'excede');
  assert.notStrictEqual(r.recomendacion.id, 'FortiGate 90G');
});

/* ── INVARIANTES (§12.1 del prompt de la etapa 7) ──────────────────────────────────────── */
test('invariante · subir la demanda nunca baja el requerimiento, y bajar el techo nunca amplia la lista', () => {
  let previo = 0;
  for (const mbps of [100, 300, 500, 900, 1500, 4000]) {
    const r = evaluar(con(CU01(), { 'topologia.enlaces': [{ id: 1, tipo: 'DIA', down: mbps, overlay: true }] }));
    assert.ok(r.detalle.effectiveNeed >= previo);
    previo = r.detalle.effectiveNeed;
  }
  let n = Infinity;
  for (const techo of [100, 80, 70, 60]) {
    const r = evaluar(con(CU01(), { 'politica.techoPct': techo }));
    assert.ok(r.elegibles.length <= n, `techo ${techo}`);
    n = r.elegibles.length;
  }
});

test('invariante · un candidato con un eje insuficiente nunca es elegible', () => {
  for (const v of [{}, { 'politica.techoPct': 60 }, { 'disponibilidad.modo': 'ha-ap' }]) {
    const r = evaluar(con(CU01(), v));
    for (const c of r.candidatos) {
      if (c.eval.ejes.some((e) => e.estado === 'excede' || (e.estado === 'sinDato' && e.dureza === 'dura'))) {
        assert.strictEqual(c.elegible, false, c.id);
      }
    }
  }
});

test('invariante · un eje sin dato nunca se lee como cero ni como ilimitado', () => {
  const r = evaluar(con(CU01(), { 'seguridad.funciones': ['chkAv', 'chkWeb', 'chkSsl'] }));
  const c100 = r.candidatos.find((x) => x.id === 'FortiGate 100F');
  assert.strictEqual(c100.eval.estado, 'apartado', 'el 100F no tiene cifra de SSL: se aparta');
  assert.ok(!c100.elegible);
});

/* ── LO QUE SE AFINO AL CONDUCIR LA PANTALLA (etapa 7, misma fecha) ──────────────────────
   Cinco comportamientos que salieron de ver la pagina funcionar, no de leer el informe, y que
   por eso conviene fijar aqui: sin prueba, el primero en «simplificarlos» los desharia. */

test('un dato COMERCIAL que falta bloquea la cotizacion, no el dimensionamiento', () => {
  // Elegir un fuera de venta en ampliacion pide su justificacion. Antes de este ajuste el
  // motor dejaba de evaluar y la ficha se quedaba vacia: la persona no veia el equipo que
  // acababa de elegir. Ahora se evalua, se ve, y lo que se cierra es la salida comercial.
  const r = evaluar(con(CU01(), { 'comercial.motivo': 'ampliacion', 'seleccion.manual': 'FortiGate 600F',
    'seguridad.funciones': ['chkAv'] }));
  assert.ok(r.faltan.includes('comercial.justificacionEol'));
  assert.ok(r.seleccion && r.seleccion.id === 'FortiGate 600F', 'el equipo elegido se evalua y se ve');
  assert.ok(r.bom, 'y su BOM se construye');
  assert.strictEqual(r.quoteGate, 'BLOCKED');
  assert.ok(r.bloqueos.some((b) => b.codigo === 'dato-requerido' && b.campo === 'comercial.justificacionEol'));
  assert.strictEqual(r.bloqueos.filter((b) => /justificaci/i.test(b.mensaje)).length, 1, 'un solo motivo, no dos con otras palabras');
  // Un dato TECNICO que falta si impide evaluar: el resultado mentiria.
  const t = evaluar(con(CU01(), { 'remoto.usuarios': 0 }));
  assert.ok(t.faltan.includes('remoto.usuarios'));
  assert.strictEqual(t.seleccion, null);
});

test('el motor publica que campo se ve, cual es obligatorio y cual falta: la pagina no lo decide', () => {
  const r = evaluar(con(CU01(), { 'comercial.emsActivo': true }));
  assert.deepStrictEqual({ ...r.campos['comercial.emsEndpoints'], afecta: undefined },
    { visible: true, requerido: true, falta: true, afecta: undefined });
  assert.strictEqual(r.campos['topologia.spokes'].visible, false, 'un spoke no declara spokes');
  assert.strictEqual(r.campos['topologia.hubs'].visible, true);
  assert.ok(r.campos['remoto.usuarios'].afecta.includes('tunCli'), 'y que eje toca cada uno');
});

test('el bundle insuficiente trae su correccion, y se declara aunque no haya candidato', () => {
  const r = evaluar(con(CU01(), { 'seguridad.funciones': ['chkIotDlp'], 'comercial.bundle': 'utp' }));
  const b = r.bloqueos.find((x) => x.codigo === 'bundle-insuficiente');
  assert.deepStrictEqual(b.correccion, { accion: 'cambiar', campo: 'comercial.bundle', valor: 'ent' });
  const sin = evaluar(con(CU01(), { 'seguridad.funciones': ['chkIotDlp'], 'comercial.bundle': 'utp',
    'topologia.enlaces': [{ id: 1, tipo: 'DIA', down: 900000, overlay: true }] }));
  assert.ok(sin.bloqueos.some((x) => x.codigo === 'sin-candidato'));
  assert.ok(sin.bloqueos.some((x) => x.codigo === 'bundle-insuficiente'), 'sin candidato tambien se dice que el bundle no alcanza');
});

test('con SSL-VPN en 7.6.3+ la causa va delante de su consecuencia', () => {
  const r = evaluar(con(CU01(), { 'remoto.metodo': 'sslvpn' }));
  const cods = r.bloqueos.map((b) => b.codigo);
  assert.ok(cods.indexOf('fortios-funcion-retirada') < cods.indexOf('sin-candidato'), cods.join(' > '));
});

test('una alternativa del mismo silicio se explica por lo que la distingue, no con «0 % mas»', () => {
  const r = evaluar(CU01());
  const a91 = r.alternativas.find((a) => a.id === 'FortiGate 91G');
  assert.ok(a91, 'el 91G es alternativa del 90G');
  assert.match(a91.porQue, /misma capacidad que FortiGate 90G/);
  assert.match(a91.porQue, /disco local de \d+ GB/);
  assert.ok(!/\b0 % más/.test(a91.porQue));
});
