'use strict';
// LA ALIMENTACION ELECTRICA ES TRES ESTADOS, NO DOS.
//
// `m.redund` (doble fuente si/no) es el mismo campo que Cisco ya traia al 100% de su
// catalogo. Al extenderlo a los otros cinco fabricantes, la mayoria de sus modelos no tienen
// el dato -el Product Matrix de Fortinet no lo publica, ni el material de Juniper o
// MikroTik que ya usa este catalogo-. Tratar esa ausencia como "no es de doble fuente"
// inventaria un dato negativo, exactamente lo que este catalogo evita en todo lo demas
// (precios de Aruba, cps de Fortinet, cobertura de Juniper). Estas pruebas fijan que
// `undefined` se declara como tal y nunca se confunde con `false`.
const test = require('node:test');
const assert = require('node:assert');
const { cargar } = require('./ayuda/navegador');

const { FICHA } = cargar('public/js/ficha.js');

test('sin campo redund ni psu: se declara que el catalogo no lo dice, no que no lo tiene', () => {
  const sec = FICHA.seccionAlimentacion({ id: 'X' });
  assert.strictEqual(sec.titulo, 'Alimentación eléctrica');
  assert.strictEqual(sec.filas.length, 1);
  assert.match(sec.filas[0][1], /no lo especifica/);
  assert.doesNotMatch(sec.filas[0][1], />No</, 'undefined no puede leerse como "No"');
  assert.match(sec.nota, /datasheet/i);
});

test('redund:false es un hecho verificado, no una ausencia de dato', () => {
  const sec = FICHA.seccionAlimentacion({ id: 'X', redund: false });
  assert.match(sec.filas[0][1], /No — fuente única/);
  assert.doesNotMatch(sec.filas[0][1], /no lo especifica/);
});

test('redund:true declara doble fuente de serie', () => {
  const sec = FICHA.seccionAlimentacion({ id: 'X', redund: true });
  assert.match(sec.filas[0][1], /Sí — de serie/);
});

test('psu.watts/tipo/volts/amps solo aparecen cuando estan presentes', () => {
  const sec = FICHA.seccionAlimentacion({ id: 'X', redund: true,
    psu: { watts: 350, tipo: 'AC-DC', volts: '90–290 V', amps: '12 V / 29.2 A' } });
  // Comparado como JSON: los arrays que devuelve ficha.js viven en el realm del vm de
  // pruebas, y deepStrictEqual los rechaza por identidad de Array.prototype aunque el
  // contenido sea igual.
  const claves = Array.prototype.map.call(sec.filas, (f) => f[0]);
  assert.strictEqual(JSON.stringify(claves), JSON.stringify(
    ['Fuente redundante (doble fuente)', 'Consumo típico', 'Tipo de fuente', 'Rango de entrada', 'Corriente']));
});

test('la fila de corriente no promete que el valor sea una salida', () => {
  // Se llamaba «Salida», y era falso en 22 de las 24 filas del catalogo: en Fortinet y en
  // Juniper lo que se guarda ahi es la corriente que el equipo TOMA de la red -«12 A @100 V ·
  // 9 A @240 V»-, que es justo el dato con el que se dimensiona un UPS o un circuito.
  // Llamarlo salida invitaba a leerlo al reves. Solo las dos filas de Huawei son de verdad una
  // salida (la del modulo PAC350S12-CR) y lo dicen en el propio valor.
  const { MODELS: FTNT } = require('../server/seed/legacyData/fortinet.js');
  const { MODELS: HW } = require('../server/seed/legacyData/huawei.js');
  const conAmps = (l) => l.filter((m) => m.psu && m.psu.amps);

  assert.ok(conAmps(FTNT).length > 0);
  for (const m of conAmps(FTNT)) {
    assert.ok(!/salida/i.test(m.psu.amps), `${m.id} no declara una salida`);
  }
  for (const m of conAmps(HW)) {
    assert.match(m.psu.amps, /^salida /, `${m.id} si es una salida y lo dice`);
  }
});

test('sin psu.watts no aparece la fila de consumo (no se rellena con 0)', () => {
  const sec = FICHA.seccionAlimentacion({ id: 'X', redund: true, psu: {} });
  assert.strictEqual(sec.filas.length, 1);
});

test('psu.texto se usa como nota cuando esta presente, aunque redund sea conocido', () => {
  const sec = FICHA.seccionAlimentacion({ id: 'X', redund: true, psu: { texto: 'Doble fuente 350 W.' } });
  assert.strictEqual(sec.nota, 'Doble fuente 350 W.');
});

test('sin modelo no revienta', () => {
  const sec = FICHA.seccionAlimentacion(null);
  assert.strictEqual(sec.titulo, 'Alimentación eléctrica');
  assert.strictEqual(sec.filas.length, 0);
});

// ── COBERTURA REAL DEL CATALOGO: lo que se transcribio y lo que se dejo en null ──────────
// No inventa cifras: cada modelo con dato viene de una frase ya publicada en el propio
// legacyData (fuentes 1+1, doble fuente, PSU redundantes...), nunca de una suposicion sobre
// el tamano o la gama del equipo.
test('Huawei: los AR8140 (doble fuente 350 W) quedan marcados; un AR sin mencion de fuente queda sin dato', () => {
  const { MODELS } = require('../server/seed/legacyData/huawei.js');
  const ar8140 = MODELS.find((m) => m.id === 'AR8140-12G10XG');
  assert.strictEqual(ar8140.redund, true);
  assert.strictEqual(ar8140.psu.watts, 350);
  const ar611 = MODELS.find((m) => m.id === 'AR611');
  assert.strictEqual(ar611.redund, undefined, 'AR611 no menciona fuente en el catalogo: no se debe inventar');
});

test('Cisco: redund sigue con cobertura completa (no se toco el dato, solo se movio la seccion)', () => {
  const { MODELS } = require('../server/seed/legacyData/cisco.js');
  assert.strictEqual(MODELS.filter((m) => m.redund === undefined).length, 0);
});

// Esta prueba fijaba «ningun modelo Fortinet tiene redund ni psu» porque el Product Matrix
// no publica alimentacion. Eso seguia siendo cierto del Product Matrix, pero no del
// fabricante: las fichas por serie si la publican, y al leerlas (2026-09-03) la cobertura
// paso de 0 a 37 de 58. Lo que la prueba fija no es el numero -que crecera segun se lean mas
// documentos- sino las tres reglas que importan.
test('Fortinet: alimentacion solo donde se leyo un documento, y con los cuatro estados bien', () => {
  const { MODELS } = require('../server/seed/legacyData/fortinet.js');
  const con = MODELS.filter((m) => m.redund !== undefined);
  assert.strictEqual(con.length, 56, 'cobertura leida de fichas por serie y System Guides');

  // 1. El que no tiene dato se queda en `undefined`. Nunca en `false`, que seria inventar un
  //    dato negativo, y nunca en `null`.
  assert.strictEqual(MODELS.filter((m) => m.redund === null).length, 0);
  // Solo dos sin dato, y por motivos distintos: la ficha del 200F da 404 en las dos rutas
  // que usa el sitio, y el archivo `fortigate-70f-series.pdf` resulto ser el datasheet del
  // 71F -el 70F no aparece ni una vez en el-, asi que aplicarle esas cifras habria sido
  // creerle al nombre del archivo en vez de a su contenido.
  const sinDato = MODELS.filter((m) => m.redund === undefined).map((m) => m.id);
  assert.deepStrictEqual(sinDato.sort(), ['FortiGate 200F', 'FortiGate 70F']);
  for (const id of sinDato) {
    assert.strictEqual(MODELS.find((m) => m.id === id).psu, undefined, `${id}: sin redund tampoco hay psu`);
  }

  // 2. `false` es un hecho leido («Powered by External DC Power Adapter», sin segunda fuente),
  //    no una ausencia de dato, y 'opcional' es el cuarto estado: sale con una fuente pero
  //    admite la segunda («up to 2 adapters, 1 adapter included»).
  const opcionales = MODELS.filter((m) => m.redund === 'opcional').map((m) => m.id);
  assert.deepStrictEqual(opcionales.sort(),
    ['FortiGate 80F', 'FortiGate 81F', 'FortiGate 90G', 'FortiGate 91G']);

  // 3. `psu.watts` solo donde la fuente publica CONSUMO. Los 2.500 W del 7081F son capacidad
  //    por fuente y la ficha rotula ese campo «Consumo tipico»: confundirlos seria una cifra
  //    falsa con apariencia correcta.
  for (const id of ['FortiGate 7081F', 'FortiGate 7121F', 'FortiGate 100F']) {
    const m = MODELS.find((x) => x.id === id);
    assert.strictEqual(m.psu.watts, undefined, `${id}: su fuente no publica consumo, no se declara`);
  }
  // Y donde si lo publica, es un numero positivo y plausible: el 3800G consume 1.496 W y el
  // 30G 6,8 W, tres ordenes de magnitud de diferencia entre sobremesa y chasis de 3 RU.
  for (const m of MODELS.filter((x) => x.psu && x.psu.watts != null)) {
    assert.ok(m.psu.watts > 0 && m.psu.watts < 5000, `${m.id}: consumo fuera de rango`);
  }
});

test('el quinto estado dice que la pregunta no aplica, no que falte el dato', () => {
  const na = FICHA.seccionAlimentacion({ id: 'CHR', redund: 'no-aplica' });
  assert.match(na.filas[0][1], /No aplica/);
  assert.doesNotMatch(na.filas[0][1], /no lo especifica/, 'no es un dato que falte');
  assert.doesNotMatch(na.filas[0][1], /fuente única/, 'ni una fuente unica: no tiene ninguna');
});

test('el cuarto estado se pinta distinto de si, de no y de «no lo dice»', () => {
  const opc = FICHA.seccionAlimentacion({ id: 'X', redund: 'opcional' });
  assert.match(opc.filas[0][1], /Opcional/);
  // Ni la afirmacion de `true` ni la negacion de `false`: se comprueban las dos etiquetas
  // exactas, no la subcadena «de serie» -que aparece a proposito dentro de «no viene de
  // serie», y prohibirla obligaria a escribir peor la frase que se le ensena al cliente.
  assert.doesNotMatch(opc.filas[0][1], /Sí — de serie/, 'no puede prometer lo que no viene en la caja');
  assert.doesNotMatch(opc.filas[0][1], /No — fuente única/, 'ni negar una redundancia que si soporta');
});

// ── MikroTik y Aruba (2026-09-03) ────────────────────────────────────────────────────────
// Dos casos que obligaron a mirar mas alla del si/no, ademas de los cuatro estados que ya
// existian.
test('MikroTik: varias entradas de alimentacion no son doble fuente, y el CHR no tiene ninguna', () => {
  const { MODELS } = require('../server/seed/legacyData/mikrotik.js');
  assert.strictEqual(MODELS.filter((m) => m.redund !== undefined).length, 14);

  // El RB5009 tiene TRES entradas (jack, PoE-IN, terminal) sobre UNA fuente interna: eso
  // permite alimentar desde dos tomas, pero no es doble fuente y no puede marcarse `true`.
  const rb5009 = MODELS.find((m) => m.id === 'RB5009UG+S+IN');
  assert.strictEqual(rb5009.redund, false);
  assert.match(rb5009.psu.tipo, /3 entradas/);

  // El unico MikroTik de esta tanda con doble fuente de verdad: 2 ranuras de PSU.
  assert.strictEqual(MODELS.find((m) => m.id === 'CCR2004-16G-2S+').redund, true);

  // Las licencias CHR son software sobre un hipervisor: no tienen fuente, y decir «el
  // catalogo no lo especifica» seria esperar un dato que no existe.
  for (const id of ['CHR P1', 'CHR P10', 'CHR P-Unlimited']) {
    assert.strictEqual(MODELS.find((m) => m.id === id).redund, 'no-aplica');
  }

  // MikroTik publica maximos, no consumos tipicos, asi que ninguno declara `watts` -la ficha
  // rotula ese campo «Consumo tipico»-: las cifras van en el texto, diciendo que miden.
  for (const m of MODELS.filter((x) => x.psu)) {
    assert.strictEqual(m.psu.watts, undefined, `${m.id}: MikroTik publica maximos, no tipicos`);
  }
});

test('Aruba: el EdgeConnect Hardware Reference separa adaptador, fuente unica y 1+1', () => {
  const { MODELS } = require('../server/seed/legacyData/aruba.js');
  assert.strictEqual(MODELS.filter((m) => m.redund !== undefined).length, 6);
  assert.strictEqual(MODELS.find((m) => m.id === 'EC-XS').redund, false);
  assert.strictEqual(MODELS.find((m) => m.id === 'EC-S').redund, false);
  assert.strictEqual(MODELS.find((m) => m.id === 'EC-M').redund, true);
  assert.strictEqual(MODELS.find((m) => m.id === 'EC-V').redund, 'no-aplica', 'es un appliance virtual');

  // El dato no puede colgar de una referencia de pedido: al aplicarlo por primera vez se
  // inserto dentro del array `skus` de EC-S y EC-M, y el objeto seguia siendo valido -solo
  // la cobertura lo delato-. Esta comprobacion fija que no vuelva a pasar.
  for (const m of MODELS) {
    for (const s of m.skus || []) {
      assert.ok(!('redund' in s) && !('psu' in s), `${m.id}: la alimentacion es del equipo, no del SKU`);
    }
  }
});

// ── Cisco: la pagina decia dos cosas sobre el mismo campo (2026-09-03) ────────────────────
// Su tabla de ficha tenia una fila propia de «Redundancia de fuente de serie» que pintaba
// «No (kit opcional)», mientras la seccion de alimentacion que la misma pagina ya renderiza
// con FICHA.seccionAlimentacion decia «No — fuente unica». Dos afirmaciones distintas sobre
// el mismo dato, en la misma pantalla. Y el «(kit opcional)» ademas daba por hecho que existe
// un kit para los ONCE modelos con redund:false, entre ellos cuatro Meraki de sobremesa.
test('Cisco: la pagina no reafirma la redundancia por su cuenta ni inventa opciones de pedido', () => {
  const fs = require('node:fs');
  const src = fs.readFileSync('public/js/dimensionador-cisco-catalyst8k.js', 'utf8');
  assert.doesNotMatch(src, /kit opcional/, 'la regla vive en ficha.js, no repetida aqui');
  assert.doesNotMatch(src, /NIM-4G-LTE-LA/,
    'no se nombra una NIM concreta: los Meraki tienen nim:0 y no la admiten');

  // Y los modelos que no admiten NIM no pueden recibir un consejo de ampliacion por modulo.
  const { MODELS } = require('../server/seed/legacyData/cisco.js');
  const sinSlots = MODELS.filter((m) => !m.nim);
  assert.ok(sinSlots.length >= 4, 'los Meraki MX estan en el catalogo con nim 0');
  assert.ok(sinSlots.every((m) => m.redund !== undefined), 'Cisco sigue con cobertura completa');
});

test('Juniper: la cobertura de alimentacion esta completa y distingue los cinco estados', () => {
  const { MODELS } = require('../server/seed/legacyData/juniper.js');
  assert.strictEqual(MODELS.filter((m) => m.redund !== undefined).length, MODELS.length);

  // Las hardware guides lo dicen sin ambiguedad: «We ship the SRX1600 with only one power
  // supply unit (PSU). You can order the [second]». Marcarlos `true` prometeria una
  // redundancia que no viene en la caja, que es justo por lo que existe el cuarto estado.
  const opcionales = MODELS.filter((m) => m.redund === 'opcional').map((m) => m.id);
  assert.deepStrictEqual(opcionales.sort(), ['SRX1500', 'SRX1600', 'SRX2300', 'SRX345', 'SRX4300']);

  // Dos modelos consecutivos de la misma serie con respuestas opuestas: el SRX345 se vende
  // con una fuente o con dos, y el SRX340 lleva la suya FIJA en el chasis, no reemplazable en
  // campo y con una sola entrada AC. Por eso esto se lee modelo por modelo.
  assert.strictEqual(MODELS.find((m) => m.id === 'SRX340').redund, false);

  // Los de datacenter si salen con las dos: «shipped with two AC or two DC power supply units
  // preinstalled». Y el SRX300 se alimenta con un adaptador externo, sin segunda opcion.
  for (const id of ['SRX4100', 'SRX4200', 'SRX4700']) {
    assert.strictEqual(MODELS.find((m) => m.id === id).redund, true, id);
  }
  assert.strictEqual(MODELS.find((m) => m.id === 'SRX300').redund, false);

  // `watts` solo donde la guia publica un consumo MEDIO o TIPICO. Los tres que lo omiten lo
  // hacen por motivos distintos y los tres importan: el SRX4100 publica un «Maximum System
  // Power Requirement» (un maximo), el SRX4200 y el SRX4700 publican 650 W y 2200 W POR
  // FUENTE (capacidad), y el SRX320 publica dos consumos medios para una sola entrada de
  // catalogo -46 W sin PoE y 221 W con PoE-, asi que elegir uno seria falso para la mitad de
  // los pedidos. La ficha rotula el campo «Consumo tipico»: lo que no lo sea, no entra.
  assert.strictEqual(MODELS.find((m) => m.id === 'SRX4300').psu.watts, 327);
  assert.strictEqual(MODELS.find((m) => m.id === 'SRX345').psu.watts, 122);
  for (const id of ['SRX4100', 'SRX4200', 'SRX4700', 'SRX320']) {
    assert.strictEqual(MODELS.find((m) => m.id === id).psu.watts, undefined, id);
  }
  // Pero las dos cifras si se declaran, en el texto, en vez de perderse.
  const t320 = MODELS.find((m) => m.id === 'SRX320').psu.texto;
  assert.match(t320, /46 W/);
  assert.match(t320, /221 W/);
});

test('Juniper: solo el fin de venta del propio equipo degrada, no el de un paquete de software', () => {
  const { MODELS } = require('../server/seed/legacyData/juniper.js');

  // La tabla oficial de hitos mezcla en las mismas filas el fin de vida de bundles de
  // licencias (S-SRX1500DP-A1-7 y companyia) con el del hardware. Retirar un paquete de
  // licencias no retira el equipo: si se aplicaran esas filas, saldrian de la recomendacion
  // aparatos que Juniper sigue vendiendo. Solo cuentan las filas cuyo SKU es el chasis o el
  // sistema del propio modelo, y con ese filtro son exactamente dos.
  const conEol = MODELS.filter((m) => m.eolAnnounced).map((m) => m.id);
  assert.deepStrictEqual(conEol.sort(), ['SRX1500', 'SRX4100']);

  for (const id of conEol) {
    const e = MODELS.find((m) => m.id === id).eolAnnounced;
    assert.strictEqual(e.lastOrder, '2026-04-15');
    assert.ok(e.url && e.url.startsWith('https://'), `${id} cita su boletin`);
    // `sucesor` va vacio a proposito: el SRX1600 y el SRX4300 son los reemplazos evidentes
    // por posicionamiento, pero la tabla de hitos no nombra ninguno, y «evidente» es como
    // entro el FortiGate 2000F inexistente que este catalogo ya sufrio.
    assert.strictEqual(e.sucesor, undefined, `${id} no inventa un sucesor`);
  }

  // El SRX4200 SI aparece en esa tabla, pero su unica fila es la del kit de rack
  // SRX4200-RMK2. Un accesorio retirado no retira el equipo.
  assert.strictEqual(MODELS.find((m) => m.id === 'SRX4200').eolAnnounced, undefined);
});

test('Cisco: el C8355-G2 ya no cae a su cifra de IPsec en perfil SD-WAN', () => {
  const { MODELS } = require('../server/seed/legacyData/cisco.js');
  const m = MODELS.find((x) => /C8355-G2/.test(x.id));

  // La ficha oficial de la serie 8300 SI publica un SD-WAN propio para este modelo. Mientras
  // estuvo en null, la pagina lo dimensionaba con los 20 Gbps de IPsec marcandolos «(cifra
  // IPsec)»: 2,3 veces por encima de lo que el equipo hace en SD-WAN, en el unico perfil
  // donde ese equipo se vende. Los dos campos que anclaron la fila siguen fijados aqui,
  // porque si alguno cambiara, la cifra que entro con ellos dejaria de estar respaldada.
  assert.strictEqual(m.sdwan, 8700);
  assert.strictEqual(m.fwd, 38000);
  assert.strictEqual(m.ipsec, 20000);
  assert.ok(m.sdwan < m.ipsec, 'inspeccionar cuesta capacidad: el SD-WAN no puede superar al IPsec');

  // Y su alimentacion: la ficha rotula la fila «Power Supply (Default - Dual PSU)» y el panel
  // trae entrada doble, asi que el `false` que este catalogo traia era falso. Los 45 W si son
  // un «Typical Power Consumption», que es lo unico que admite psu.watts.
  assert.strictEqual(m.redund, true);
  assert.strictEqual(m.psu.watts, 45);
});

test('Juniper: la generacion 2024 entra con la escalera de inspeccion monotona', () => {
  const { MODELS } = require('../server/seed/legacyData/juniper.js');

  // La ficha por modelo publica el rendimiento en DOS metodos, y confundirlos es justo el
  // error que este catalogo persigue: «TPS Method: throughput of average HTTP sessions» da
  // 19 Gbps de NGFW en el SRX1600 —sobre un firewall de 24— mientras «CPS Method: short-lived
  // sessions» da 4,5. La cabecera de juniper.js llevaba anotado ese «21 Gbps de IPS» como
  // dato que contradecia la fisica del producto; no la contradecia, era el otro metodo.
  // Se transcribe SIEMPRE el metodo CPS, porque es el unico en el que Juniper publica tambien
  // las capas profundas —Secure Web Access y Advanced Threat solo traen CPS—, asi que es el
  // unico que da una escalera comparable de principio a fin.
  for (const id of ['SRX1600', 'SRX2300', 'SRX4300']) {
    const m = MODELS.find((x) => x.id === id);
    assert.ok(m.fw > m.fwImix, `${id}: IMIX por debajo de paquetes grandes`);
    assert.ok(m.fwImix > m.ips, `${id}: inspeccionar cuesta capacidad`);
    assert.ok(m.ips > m.atp, `${id}: el stack completo cuesta mas que solo IPS`);
  }

  // Cifras exactas de las fichas oficiales de 2026, para que un cambio se note.
  const srx1600 = MODELS.find((x) => x.id === 'SRX1600');
  assert.strictEqual(srx1600.fwImix, 12000);
  assert.strictEqual(srx1600.ips, 4500);
  assert.strictEqual(srx1600.atp, 2000);
  // Y los anclajes que confirmaron que se leia el modelo correcto siguen fijados: si alguno
  // cambiara, las cifras que entraron con ellos dejarian de estar respaldadas.
  assert.strictEqual(srx1600.fw, 24000);
  assert.strictEqual(srx1600.vpn, 18000);
  assert.strictEqual(srx1600.sess, 2000000);
});
