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
    ['Fuente redundante (doble fuente)', 'Consumo típico', 'Tipo de fuente', 'Rango de entrada', 'Salida']));
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
