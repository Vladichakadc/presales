'use strict';
// Dimensionador Nokia de agregacion y core (7250 IXR / 7750 SR), pendiente 6 fase 2.
//
// Estas pruebas cubren lo que puede fallar EN SILENCIO, que en este motor son tres cosas:
// que las configuraciones de puertos se sumen en vez de tratarse como alternativas, que un
// chasis modular se descarte por no publicar densidad, y que la familia deje de acotar antes
// que el caudal. Las tres darian una recomendacion con pinta de correcta.

const test = require('node:test');
const assert = require('node:assert');
const { cargar } = require('./ayuda/navegador.js');
const { MODELS_ROUTER, PLATAFORMAS } = require('../server/seed/legacyData/nokia.js');

const { NOKIA_SR } = cargar('public/js/dimensionador-nokia-7750sr.js');
const de = (id) => MODELS_ROUTER.find((m) => m.id === id);

test('el catalogo estructura los 14 modelos que no son fabric, y ninguno inventa densidad', () => {
  assert.strictEqual(MODELS_ROUTER.length, 14);

  for (const m of MODELS_ROUTER) {
    assert.ok(typeof m.cap === 'number' && m.cap > 0, `${m.id} tiene capacidad`);
    assert.ok(PLATAFORMAS[m.plat], `${m.id} pertenece a una familia declarada`);
    // O publica configuraciones, o dice por que no las tiene. Nunca las dos, nunca ninguna:
    // un modelo sin `configs` y sin `notaPuertos` seria un hueco mudo.
    if (m.configs) {
      assert.strictEqual(m.notaPuertos, null, `${m.id} publica densidad y no necesita excusa`);
      assert.ok(m.configs.length > 0);
      for (const c of m.configs) {
        assert.ok(c.n && c.puertos.length > 0, `${m.id}: la configuracion se nombra y trae puertos`);
      }
    } else {
      assert.ok(m.notaPuertos, `${m.id} no publica densidad y dice por que`);
    }
  }

  // Las cinco familias tienen al menos un modelo: una familia vacia en el selector seria un
  // boton que no filtra nada, el mismo defecto que el conjunto inerte de CISCO_EOL_MODELS.
  for (const plat of Object.keys(PLATAFORMAS)) {
    assert.ok(MODELS_ROUTER.some((m) => m.plat === plat), `la familia ${plat} tiene modelos`);
  }
});

test('las configuraciones de puertos son alternativas, no se suman', () => {
  // El 7250 IXR-6e da 36x100GE O 12x400GE. Nunca las dos: sumarlas prometeria 48 interfaces
  // donde hay 36, que es el tipo de dato con pinta de correcto que este catalogo persigue.
  const ixr6e = de('7250 IXR-6e');
  assert.ok(NOKIA_SR.configQueCumple(ixr6e, 36, 100), '36 puertos de 100GE si caben');
  assert.strictEqual(NOKIA_SR.configQueCumple(ixr6e, 37, 100), null, '37 de 100GE ya no');
  assert.ok(NOKIA_SR.configQueCumple(ixr6e, 12, 400), '12 de 400GE si caben');
  assert.strictEqual(NOKIA_SR.configQueCumple(ixr6e, 13, 400), null, '13 de 400GE ya no');

  // El caso que mejor lo prueba: el SR-1x-92S trae 12x400GE + 80x100GE EN LA MISMA
  // configuracion, asi que ahi si conviven — pero solo se cuentan los de la velocidad pedida.
  const s92 = de('7750 SR-1x-92S');
  assert.ok(NOKIA_SR.configQueCumple(s92, 80, 100), 'sus 80 puertos de 100GE');
  assert.ok(NOKIA_SR.configQueCumple(s92, 12, 400), 'sus 12 de 400GE');
  assert.strictEqual(NOKIA_SR.configQueCumple(s92, 40, 400), null,
    'no se mezclan velocidades: 12 de 400GE no se completan con los de 100GE');

  // Sin cantidad pedida no hay nada que comprobar.
  assert.strictEqual(NOKIA_SR.configQueCumple(ixr6e, 0, 100), null);
});

test('un chasis modular se aparta con su motivo, no se descarta', () => {
  const modulares = MODELS_ROUTER.filter(NOKIA_SR.sinDensidad).map((m) => m.id).sort();
  assert.deepStrictEqual(modulares,
    ['7250 IXR-R6dl', '7250 IXR-e', '7250 IXR-e2', '7750 SR-14s', '7750 SR-7s']);

  // Pidiendo 40 puertos de 400GE con caudal bajo: los dos chasis IOM cumplen el caudal de
  // sobra, pero su densidad depende de que tarjeta se pida. Descartarlos los haria parecer
  // insuficientes; colarlos con una densidad inventada seria peor. Van aparte, con el motivo.
  const r = NOKIA_SR.evaluar({ models: MODELS_ROUTER, need: 10000, portQty: 40, portVel: 400, familia: 'sr' });
  // Comparado como JSON: lo que devuelve el motor vive en el realm del vm de pruebas y
  // deepStrictEqual lo rechaza por identidad de Array.prototype aunque el contenido sea igual
  // (mismo motivo que en test/ficha-alimentacion.test.js).
  const apartados = Array.prototype.map.call(r.apartados, (a) => a.m.id).sort();
  assert.strictEqual(JSON.stringify(apartados), JSON.stringify(['7750 SR-14s', '7750 SR-7s']));
  for (const a of Array.from(r.apartados)) {
    assert.ok(a.motivo && a.motivo.length > 20, `${a.m.id} explica por que no se comprueba`);
  }
  // Y ninguno de los dos se cuela entre los candidatos.
  assert.ok(!Array.prototype.some.call(r.candidatos, (m) => modulares.includes(m.id)));
});

test('la familia acota antes que el caudal', () => {
  const need = 520;
  const todas = NOKIA_SR.evaluar({ models: MODELS_ROUTER, need, portQty: 0, portVel: 100, familia: 'all' });
  const soloSr = NOKIA_SR.evaluar({ models: MODELS_ROUTER, need, portQty: 0, portVel: 100, familia: 'sr' });

  // Sin acotar, el mas pequenyo que cumple es un 7250 IXR de cell site; acotando a la familia
  // 7750 SR es un PE. Son respuestas distintas a preguntas distintas, y por eso el selector de
  // familia existe: ordenar por capacidad sin acotarla haria saltar de un core IP/MPLS a un
  // router de acceso por unos cientos de Gbps.
  const menor = (l) => Array.from(l).sort((a, b) => a.cap - b.cap)[0];
  assert.strictEqual(menor(todas.candidatos).id, '7250 IXR-e2');
  assert.strictEqual(menor(soloSr.candidatos).id, '7750 SR-1s');
  assert.ok(Array.prototype.every.call(soloSr.candidatos, (m) => m.plat === 'sr'));
  assert.ok(soloSr.candidatos.length < todas.candidatos.length);
});

test('por encima del modelo mas grande no hay candidato, y no se redondea hacia abajo', () => {
  // El 7750 SR-14s es el techo del catalogo con 38,4 Tbps. Pedir mas no puede devolver el
  // mayor «por aproximacion»: repartir el trafico en varios equipos es una decision de diseno.
  const r = NOKIA_SR.evaluar({ models: MODELS_ROUTER, need: 50000, portQty: 0, portVel: 100, familia: 'all' });
  assert.strictEqual(r.candidatos.length, 0);
  assert.strictEqual(r.apartados.length, 0);

  const justo = NOKIA_SR.evaluar({ models: MODELS_ROUTER, need: 38400, portQty: 0, portVel: 100, familia: 'all' });
  assert.strictEqual(JSON.stringify(Array.prototype.map.call(justo.candidatos, (m) => m.id)),
    JSON.stringify(['7750 SR-14s']), 'la capacidad exacta si cumple: el corte es >=, no >');
});

test('la capacidad esta en Gbps aunque el material comercial la cite en Tbps', () => {
  // 6.4 Tbps son 6400, no 6.4. Un catalogo con las dos unidades mezcladas haria que un equipo
  // de 6,4 Tbps perdiera contra uno de 300 Gbps al ordenar — el mismo fallo que tabla.js ya
  // tuvo cuando 5.999 dolares valian menos que 29.
  assert.strictEqual(de('7250 IXR-6e').cap, 6400);
  assert.strictEqual(de('7250 IXR-e').cap, 300);
  assert.ok(MODELS_ROUTER.every((m) => Number.isInteger(m.cap) && m.cap >= 300));
});
