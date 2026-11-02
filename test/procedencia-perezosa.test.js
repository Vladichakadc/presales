'use strict';
// La pestaña «Fuentes» de los siete dimensionadores pide /api/fuentes cuando alguien la va a ver,
// no al abrir la página (la tabla trae los siete fabricantes y la pestaña está oculta al entrar).
// Lo que se vigila aquí es la regla y su fallo hacia el lado seguro:
//   - sin que la caja se vea, ninguna petición a /api/fuentes;
//   - al verse, una sola, y la caja se pinta;
//   - un administrador (puedeSync) no la pide dos veces antes de verla;
//   - un navegador sin IntersectionObserver la pide en el acto (nunca una pestaña vacía).
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const CODIGO = fs.readFileSync(path.join(__dirname, '..', 'public', 'js', 'procedencia.js'), 'utf8');

function nodo(extra = {}) {
  return {
    style: {}, dataset: {}, classList: { add() {}, remove() {}, contains: () => false },
    children: [], appendChild() {}, setAttribute() {}, addEventListener() {},
    querySelector: () => null, querySelectorAll: () => [], innerHTML: '', textContent: '', ...extra,
  };
}

function montar({ conObservador = true, puedeSync = false } = {}) {
  const caja = nodo({ dataset: { procedencia: 'huawei' } });
  const peticiones = [];
  const observadores = [];
  const g = {};
  g.window = g;
  g.console = console;
  g.setTimeout = setTimeout;
  g.document = {
    readyState: 'complete', head: nodo(), body: nodo(), createElement: () => nodo(),
    addEventListener() {}, getElementById: () => null, querySelector: () => null,
    querySelectorAll: (sel) => (sel === '[data-procedencia]' ? [caja] : []),
  };
  g.fetch = (url) => {
    peticiones.push(String(url));
    if (url === '/api/cuenta/estado') return Promise.resolve({ ok: true, json: async () => ({ puedeSync }) });
    if (url === '/api/fuentes') {
      return Promise.resolve({ ok: true, json: async () => ({ huawei: { fuentes: [] } }) });
    }
    return Promise.resolve({ ok: false, json: async () => ({}) });
  };
  if (conObservador) {
    g.IntersectionObserver = class {
      constructor(cb, opciones) { this.cb = cb; this.opciones = opciones; this.vigila = []; this.desconectado = false; observadores.push(this); }
      observe(n) { this.vigila.push(n); }
      disconnect() { this.desconectado = true; }
    };
  }
  vm.runInNewContext(CODIGO, g, { filename: 'procedencia.js' });
  return { g, caja, peticiones, observadores };
}

const pausa = () => new Promise((ok) => setTimeout(ok, 0));
const deFuentes = (p) => p.filter((u) => u === '/api/fuentes').length;

test('sin verse la pestaña no se pide /api/fuentes; al verse, una vez y se pinta', async () => {
  const { caja, peticiones, observadores } = montar();
  await pausa(); await pausa();
  assert.strictEqual(deFuentes(peticiones), 0, `al abrir la página no se pide (${peticiones.join(', ')})`);
  assert.strictEqual(observadores.length, 1);
  assert.deepStrictEqual(observadores[0].vigila, [caja], 'se vigila la caja de la pestaña');

  const obs = observadores[0];
  obs.cb([{ isIntersecting: false }]);
  await pausa();
  assert.strictEqual(deFuentes(peticiones), 0, 'una notificación sin intersección no la pide');

  obs.cb([{ isIntersecting: true }]);
  obs.cb([{ isIntersecting: true }]);
  await pausa(); await pausa();
  assert.strictEqual(deFuentes(peticiones), 1, 'al verse se pide una sola vez');
  assert.ok(obs.desconectado, 'y se deja de vigilar');
  assert.match(caja.innerHTML, /Sin procedencia registrada|<table/, 'la caja se pinta');
});

test('un administrador no la pide antes de verla, y al verla la pinta con sus controles', async () => {
  const { caja, peticiones, observadores } = montar({ puedeSync: true });
  await pausa(); await pausa();
  assert.strictEqual(deFuentes(peticiones), 0, 'puedeSync no adelanta la petición');
  observadores[0].cb([{ isIntersecting: true }]);
  await pausa(); await pausa();
  assert.strictEqual(deFuentes(peticiones), 1);
  assert.match(caja.innerHTML, /data-subir-fuente="huawei"/, 'con permiso sync sale el control de carga');
});

test('sin IntersectionObserver se pide en el acto: nunca una pestaña vacía', async () => {
  const { caja, peticiones } = montar({ conObservador: false });
  await pausa(); await pausa();
  assert.strictEqual(deFuentes(peticiones), 1);
  assert.notStrictEqual(caja.innerHTML, '', 'la caja se pinta');
});
