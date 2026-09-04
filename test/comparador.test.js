'use strict';
// Comparador de equipos del portal (public/js/comparador.js).
//
// Las dos pruebas que importan de verdad aqui cubren errores que esta pantalla YA cometio
// en su primera version, y los dos eran del tipo peor: no rompian nada, solo mentian.
//   1. Decia «IPS: no aplica» de un Catalyst 8300 —que hace IPS con Snort desde IOS XE—
//      porque este catalogo no publica esa cifra para Cisco. Confundir «no lo tiene» con
//      «no lo tenemos apuntado» descarta un equipo por algo que si sabe hacer.
//   2. Marcaba «el mejor» comparando los 24 Gbps de firewall de un SRX con los 5 Gbps de
//      forwarding de un Cisco, justo debajo de un aviso que dice que esas cifras no se
//      miden igual.

const test = require('node:test');
const assert = require('node:assert');
const { cargar } = require('./ayuda/navegador.js');

const { COMPARADOR } = cargar('public/js/comparador.js');

// Comparado como JSON: lo que devuelve el modulo vive en el realm del vm de pruebas y
// deepStrictEqual lo rechaza por identidad de Array.prototype aunque el contenido sea igual
// (mismo motivo que en test/ficha-alimentacion.test.js).
const igual = (a, b, msg) => assert.strictEqual(JSON.stringify(Array.from(a)), JSON.stringify(b), msg);

const dev = (grupo, raw) => ({ grupo, raw, vendor: grupo, model: raw.model || 'X' });
const fila = (k) => COMPARADOR.SECCIONES.reduce((acc, s) => acc || s.filas.find((f) => f.k === k), null);

test('un hueco del catalogo es «sin dato», no «no aplica»', () => {
  // Cisco no trae `ips` en este catalogo, pero un Catalyst si hace IPS. La casilla tiene que
  // decir que el dato falta, no que el equipo no puede.
  const c = COMPARADOR.celda(fila('ips'), dev('cisco', { model: 'Catalyst 8300-2N2S-6T', fwd: 5000 }));
  assert.strictEqual(c.estado, 'sinDato');

  // Lo mismo con SD-WAN en un SRX, con LTE en un Juniper y con las ranuras en cualquiera:
  // que el catalogo no lo traiga no autoriza a afirmar que el equipo no lo hace.
  for (const [k, g] of [['sdwan', 'juniper'], ['lte', 'juniper'], ['slots', 'fortinet'], ['inspeccion', 'cisco']]) {
    assert.strictEqual(COMPARADOR.celda(fila(k), dev(g, {})).estado, 'sinDato', `${k} en ${g}`);
  }
});

test('«no aplica» solo donde el concepto no existe, y siempre con su motivo', () => {
  // Un router de transporte no tiene sesiones concurrentes porque no es un cortafuegos con
  // estado. Eso si es una inaplicabilidad, y se explica.
  const c = COMPARADOR.celda(fila('sess'), dev('nokia', { model: '7750 SR-7s' }));
  assert.strictEqual(c.estado, 'noAplica');
  assert.match(c.txt, /cortafuegos con estado/);

  // Toda inaplicabilidad declarada trae motivo: un «no aplica» a secas no se puede rebatir.
  for (const k of Object.keys(COMPARADOR.NA)) {
    for (const g of Object.keys(COMPARADOR.NA[k])) {
      assert.ok(COMPARADOR.NA[k][g] && COMPARADOR.NA[k][g].length > 15, `${k}/${g} explica el motivo`);
    }
  }
});

test('no se corona un ganador entre cifras que no se miden igual', () => {
  // El caso exacto que salio mal: 24 Gbps de firewall Juniper contra 5 Gbps de forwarding
  // Cisco. Son dos mediciones distintas y marcar una como mejor contradice el aviso que la
  // propia pantalla muestra encima de la tabla.
  const mezcla = [dev('juniper', { fw: 24000 }), dev('cisco', { fwd: 5000 })];
  igual(COMPARADOR.mejores(fila('portada'), mezcla), []);

  // Dentro del mismo fabricante si son comparables, y ahi si se marca.
  const mismo = [dev('fortinet', { fw: 4000 }), dev('fortinet', { fw: 10000 })];
  igual(COMPARADOR.mejores(fila('portada'), mismo), [1]);

  // Y las filas que NO dependen de la base de medida si se comparan entre fabricantes: unas
  // sesiones concurrentes son unas sesiones concurrentes.
  const sesiones = [dev('fortinet', { sess: 600000 }), dev('juniper', { sess: 2000000 })];
  igual(COMPARADOR.mejores(fila('sess'), sesiones), [1]);
});

test('un empate no tiene ganador', () => {
  // Marcar «el mejor» cuando los dos valen lo mismo no informa de nada y ensucia la tabla.
  const iguales = [dev('fortinet', { sess: 600000 }), dev('fortinet', { sess: 600000 })];
  igual(COMPARADOR.mejores(fila('sess'), iguales), []);
});

test('el aviso de bases sale al mezclar fabricantes y no antes', () => {
  assert.strictEqual(COMPARADOR.avisoBases([dev('fortinet', {}), dev('fortinet', {})]), null);
  // Las dos familias de Huawei son el mismo fabricante: avisar ahi seria ruido.
  assert.strictEqual(COMPARADOR.avisoBases([dev('hw_ar', {}), dev('hw_wan', {})]), null);
  assert.match(COMPARADOR.avisoBases([dev('fortinet', {}), dev('cisco', {})]), /no se mide igual/);
});

test('los cinco estados de alimentacion se dicen igual que en la ficha', () => {
  // Si el comparador y el dimensionador describen el mismo campo con palabras distintas, la
  // gente deja de fiarse de los dos.
  assert.match(COMPARADOR.redundancia(true).txt, /de serie/);
  assert.match(COMPARADOR.redundancia(false).txt, /fuente única/);
  assert.match(COMPARADOR.redundancia('opcional').txt, /Opcional/);
  assert.strictEqual(COMPARADOR.redundancia('no-aplica').estado, 'noAplica');
  // `undefined` NUNCA se lee como «no»: es el tercer estado que protege todo este catalogo.
  assert.strictEqual(COMPARADOR.redundancia(undefined).estado, 'sinDato');
  assert.strictEqual(COMPARADOR.redundancia(null).estado, 'sinDato');
});

test('el catalogo mezcla numeros y texto en el mismo campo, y se respetan los dos', () => {
  // `cap` llega como numero desde el dimensionador y como texto ya formateado desde el
  // catalogo del portal, segun el modelo. Reparsear el texto seria inventar precision.
  assert.strictEqual(COMPARADOR.capacidad(24000), '24 Gbps');
  assert.strictEqual(COMPARADOR.capacidad('1 Gbps FW'), '1 Gbps FW');
  assert.strictEqual(COMPARADOR.capacidad(null), null);
  assert.strictEqual(COMPARADOR.capacidad(500), '500 Mbps');
  assert.strictEqual(COMPARADOR.capacidad(2400000), '2.4 Tbps');
});

test('una fila donde nadie trae dato no se pinta', () => {
  // Con dos equipos sin nada, no queda ninguna seccion: una tabla llena de huecos no es
  // «mas informacion», es ruido que esconde lo que si hay.
  const vacios = [dev('cisco', {}), dev('cisco', {})];
  assert.strictEqual(COMPARADOR.filasVisibles(vacios, false).length, 0);

  const conAlgo = [dev('cisco', { seg: 'Sucursal' }), dev('cisco', { seg: 'Hub' })];
  const secs = COMPARADOR.filasVisibles(conAlgo, false);
  assert.strictEqual(secs.length, 1);
  assert.strictEqual(secs[0].filas.length, 1);
});

test('«solo diferencias» esconde lo que coincide, incluidos los huecos iguales', () => {
  const devs = [dev('cisco', { seg: 'Sucursal', fwd: 1000 }), dev('cisco', { seg: 'Sucursal', fwd: 5000 })];
  const todo = COMPARADOR.filasVisibles(devs, false);
  const dif = COMPARADOR.filasVisibles(devs, true);
  const claves = (secs) => Array.from(secs)
    .flatMap((x) => Array.from(x.filas).map((f) => f.k)).sort();
  igual(claves(todo), ['portada', 'seg']);
  igual(claves(dif), ['portada'], 'el segmento coincide y se oculta');
});
