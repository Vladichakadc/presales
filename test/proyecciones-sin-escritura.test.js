'use strict';
// LAS PROYECCIONES NO ESCRIBEN EN legacyData/ (2026-11-10, mejora propuesta al cerrar el PR #174).
//
// Las proyecciones de catalogProjection.js devuelven objetos de legacyData/ por referencia (por
// ejemplo `funciones` de Fortinet es fortinetData.FUNCIONES): si una proyeccion escribiera en ellos,
// cambiaria el catalogo dentro del proceso para la siguiente peticion. Hoy da igual porque cada
// peticion vuelve a proyectar, pero el corte 2 del ADR-3 quiere cachear las proyecciones por
// despliegue, y entonces una escritura se quedaria. Esto lo convierte en una garantia.
//
// Por que no basta con congelar: catalogProjection.js no esta en modo estricto, y en codigo no
// estricto escribir en un objeto congelado NO lanza, se ignora en silencio. Asi que congelar solo
// daria un verde que no prueba nada. Se miden tres cosas:
//   1. una huella completa de cada modulo de legacyData/ (util.inspect, que ve tambien Map, Set y
//      lo que JSON no serializa) antes y despues de dos pasadas por las 16 proyecciones: cualquier
//      escritura, estricta o no, la cambia;
//   2. con legacyData/ congelado en profundidad (los mismos objetos que carga require, no una
//      copia), las proyecciones corren sin error y dan el mismo JSON que sin congelar: una escritura
//      ignorada en silencio que importara cambiaria la salida;
//   3. controles: la huella ve una escritura hecha a proposito, y lo que las proyecciones reparten
//      por referencia esta congelado y lanza al escribirlo desde codigo estricto.
const fs = require('fs');
const os = require('os');
const path = require('path');
const util = require('util');

process.env.DATABASE_PATH = ':memory:';
process.env.AUTH_STATE_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'proyecciones-sin-escritura-'));

const test = require('node:test');
const assert = require('node:assert');
const seedCatalog = require('../server/seed/seedCatalog');
const proyeccion = require('../server/services/catalogProjection');
const { crearCatalogo } = require('../server/services/catalogoEnMemoria');

const LLAMADAS = [
  ['getVendorsList'], ['toIndexPR'], ['toCotizadorCatalog'], ['toGuiaRoles'],
  ['toFuentes'], ['toFuentes', 'fortinet'], ['toFuentes', 'cisco'], ['toFuentes', 'nokia'],
  ['toDimensionadorHuawei'], ['toDimensionadorCisco'], ['toDimensionadorFortinet'],
  ['toDimensionadorJuniper'], ['toDimensionadorMikrotik'], ['toDimensionadorAruba'],
  ['toDimensionadorNokia'], ['toDimensionadorNokiaRouter'],
];

// Todos los modulos de legacyData/, cargados por require: son los objetos que reciben las proyecciones.
const DIR = path.join(__dirname, '..', 'server', 'seed', 'legacyData');
const MODULOS = fs.readdirSync(DIR).filter((f) => /\.(js|json)$/.test(f)).sort()
  .map((f) => ({ nombre: f, exports: require(path.join(DIR, f)) }));

const OPC = { depth: Infinity, maxArrayLength: Infinity, maxStringLength: Infinity, breakLength: Infinity, compact: true };
const huella = (x) => util.inspect(x, OPC);
const huellas = () => Object.fromEntries(MODULOS.map((m) => [m.nombre, huella(m.exports)]));

// Congela en profundidad y devuelve el conjunto de objetos congelados (para el control 3).
function congelar(raiz, vistos = new Set()) {
  const pila = [raiz];
  while (pila.length) {
    const o = pila.pop();
    if (o === null || (typeof o !== 'object' && typeof o !== 'function') || vistos.has(o)) continue;
    vistos.add(o);
    for (const k of Reflect.ownKeys(o)) {
      const d = Object.getOwnPropertyDescriptor(o, k);
      if (d && 'value' in d) pila.push(d.value);
    }
    Object.freeze(o);
  }
  return vistos;
}

async function enSilencio(fn) {
  const log = console.log;
  console.log = () => {};
  try { return await fn(); } finally { console.log = log; }
}
async function proyectar() {
  const salida = {};
  for (const [fn, ...args] of LLAMADAS) salida[[fn, ...args].join(':')] = await proyeccion[fn](...args);
  return salida;
}

let antes;
let despues;
let libre;
let congelada;
let errorCongelada = null;
let congelados;
let controlHuella;

test.before(async () => {
  const memoria = crearCatalogo();
  await enSilencio(() => seedCatalog(memoria));
  proyeccion.usarModelos(memoria);

  antes = huellas();
  // Control 1: la huella ve una escritura en un objeto profundo de legacyData/, y deja de verla al deshacerla.
  const fortinet = require(path.join(DIR, 'fortinet.js'));
  const clave = Object.keys(fortinet.FUNCIONES)[0];
  const objetivo = fortinet.FUNCIONES[clave];
  objetivo.__control = 1;
  const conEscritura = huella(fortinet);
  delete objetivo.__control;
  controlHuella = { ve: conEscritura !== antes['fortinet.js'], vuelve: huella(fortinet) === antes['fortinet.js'] };

  // Dos pasadas: la segunda veria lo que la primera hubiera dejado escrito (una cache, un contador).
  libre = JSON.stringify(await proyectar());
  libre = JSON.stringify(await proyectar());
  despues = huellas();

  congelados = new Set();
  for (const m of MODULOS) congelar(m.exports, congelados);
  try { congelada = await proyectar(); } catch (e) { errorCongelada = e; }
});

test.after(async () => {
  // Solo existe si lo cargo catalogProjection (con Sequelize). Cerrarlo no falla si nunca conecto.
  const modelos = require.cache[require.resolve('../server/models')];
  if (modelos && modelos.exports.sequelize) await modelos.exports.sequelize.close();
});

test('la lista de llamadas cubre todas las proyecciones que exporta catalogProjection', () => {
  const exportadas = Object.keys(proyeccion).filter((k) => /^(to|get)[A-Z]/.test(k) && typeof proyeccion[k] === 'function');
  const llamadas = new Set(LLAMADAS.map(([fn]) => fn));
  for (const fn of exportadas) assert.ok(llamadas.has(fn), `${fn} se exporta y esta prueba no la llama`);
});

test('control: la huella ve una escritura en legacyData/ y vuelve al deshacerla', () => {
  assert.ok(controlHuella.ve, 'una propiedad nueva en FUNCIONES no cambio la huella: la huella no mira lo bastante hondo');
  assert.ok(controlHuella.vuelve, 'deshecha la escritura, la huella no volvio: la huella no es estable');
});

test('dos pasadas por las 16 proyecciones no escriben en ningun modulo de legacyData/', () => {
  const cambiados = MODULOS.map((m) => m.nombre).filter((n) => antes[n] !== despues[n]);
  assert.deepStrictEqual(cambiados, [], `las proyecciones escribieron en: ${cambiados.join(', ')}`);
});

test('con legacyData/ congelado, las 16 proyecciones corren sin error', () => {
  assert.strictEqual(errorCongelada, null, errorCongelada && `una proyeccion escribe en legacyData/: ${errorCongelada.stack}`);
});

test('y dan el mismo JSON que sin congelar (ninguna escritura ignorada en silencio importaba)', () => {
  assert.ok(congelada, 'no hubo salida con legacyData/ congelado');
  const l = JSON.parse(libre);
  for (const [fn, ...args] of LLAMADAS) {
    const k = [fn, ...args].join(':');
    assert.strictEqual(JSON.stringify(congelada[k]), JSON.stringify(l[k]), `${k}: difiere con legacyData/ congelado`);
  }
});

test('control: lo que las proyecciones reparten por referencia es lo congelado, y lanza al escribirlo', () => {
  assert.ok(congelada, 'no hubo salida con legacyData/ congelado');
  // Los objetos de la salida que son de legacyData/ (misma identidad, no una copia igual).
  const compartidos = [];
  const vistos = new Set();
  const pila = Object.entries(congelada).map(([k, v]) => [k, v]);
  while (pila.length) {
    const [ruta, o] = pila.pop();
    if (o === null || typeof o !== 'object' || vistos.has(o)) continue;
    vistos.add(o);
    if (congelados.has(o)) { compartidos.push([ruta, o]); continue; }
    for (const [k, v] of Object.entries(o)) pila.push([`${ruta}.${k}`, v]);
  }
  const fortinet = require(path.join(DIR, 'fortinet.js'));
  assert.ok(compartidos.some(([, o]) => o === fortinet.FUNCIONES),
    'la salida de Fortinet ya no reparte FUNCIONES por referencia: el hallazgo del PR #174 cambio, revisa esta prueba');
  for (const [ruta, o] of compartidos) assert.ok(Object.isFrozen(o), `${ruta} se reparte por referencia y no esta congelado`);
  // Este archivo es estricto: escribir en lo repartido lanza, que es lo que veria una proyeccion estricta.
  assert.throws(() => { fortinet.FUNCIONES.__control = 1; }, TypeError);
});
