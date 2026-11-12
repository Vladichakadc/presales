'use strict';
// El catalogo en memoria (ADR-3). Hasta el 2026-11-11 esta prueba comparaba cada proyeccion con la
// de SQLite (PR #174: las 16 identicas, texto JSON exacto e igualdad estricta); al quitar SQLite se
// midio una ultima vez contra main, byte a byte (PR del 2026-11-11). Lo que queda vigila lo que el
// almacen promete: un catalogo sembrado aparte da las mismas proyecciones que el del proceso, un
// precio cambiado se ve (si no, la comparacion no leeria el almacen), una fila leida y modificada
// no cambia la siguiente consulta, el orden es el de SQLite y un uso que no se imita lanza.
const fs = require('fs');
const os = require('os');
const path = require('path');

process.env.AUTH_STATE_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'catalogo-en-memoria-'));

const test = require('node:test');
const assert = require('node:assert');
const seedCatalog = require('../server/seed/seedCatalog');
const proyeccion = require('../server/services/catalogProjection');
const { crearCatalogo, catalogo, listo, comparar } = require('../server/services/catalogoEnMemoria');

const LLAMADAS = [
  ['getVendorsList'], ['toIndexPR'], ['toCotizadorCatalog'], ['toGuiaRoles'],
  ['toFuentes'], ['toFuentes', 'fortinet'], ['toFuentes', 'cisco'], ['toFuentes', 'nokia'],
  ['toDimensionadorHuawei'], ['toDimensionadorCisco'], ['toDimensionadorFortinet'],
  ['toDimensionadorJuniper'], ['toDimensionadorMikrotik'], ['toDimensionadorAruba'],
  ['toDimensionadorNokia'], ['toDimensionadorNokiaRouter'],
];

async function enSilencio(fn) {
  const log = console.log;
  console.log = () => {};
  try { return await fn(); } finally { console.log = log; }
}
async function proyectar() {
  const salida = {};
  for (const [fn, ...args] of LLAMADAS) salida[[fn, ...args].join(':')] = JSON.stringify(await proyeccion[fn](...args));
  return salida;
}
const json = (x) => JSON.parse(JSON.stringify(x));

let delProceso;
let memoria;
let enMemoria;

test.before(async () => {
  await enSilencio(() => listo());
  delProceso = await proyectar();
  memoria = crearCatalogo();
  await enSilencio(() => seedCatalog(memoria));
  proyeccion.usarModelos(memoria);
  enMemoria = await proyectar();
});
test.after(() => { proyeccion.usarModelos(catalogo); });

test('un catalogo sembrado aparte da las mismas 16 proyecciones que el del proceso', () => {
  for (const [fn, ...args] of LLAMADAS) {
    const clave = [fn, ...args].join(':');
    assert.strictEqual(enMemoria[clave], delProceso[clave], `${clave}: difiere`);
  }
});

test('control: un precio cambiado en el almacen se ve en la proyeccion', async () => {
  const [p] = await memoria.Product.findAll({ where: { model: 'FortiGate 90G' } });
  assert.ok(p, 'el FortiGate 90G esta en el catalogo');
  const antes = p.priceNumeric;
  await p.update({ priceNumeric: (antes || 0) + 1 });
  try {
    assert.notDeepStrictEqual(json(await proyeccion.toCotizadorCatalog()), JSON.parse(delProceso.toCotizadorCatalog),
      'con un precio cambiado tendria que diferir: la comparacion no esta leyendo el almacen en memoria');
  } finally {
    await p.update({ priceNumeric: antes });
  }
  assert.deepStrictEqual(json(await proyeccion.toCotizadorCatalog()), JSON.parse(delProceso.toCotizadorCatalog));
});

// Lo que promete el almacen: cada consulta da objetos nuevos, como SQLite. (Las proyecciones
// devuelven ademas objetos de legacyData/ por referencia, como FUNCIONES de Fortinet: eso pasa
// igual con SQLite y no es de este corte, pero una proyeccion cacheada no podria compartirlos.)
test('modificar una fila leida no cambia la siguiente consulta', async () => {
  const leer = () => memoria.Product.findAll({
    where: { model: 'Catalyst 8300-1N1S-6T' }, include: [{ model: memoria.OpticCategory }, { model: memoria.Part }],
  });
  const [a] = await leer();
  assert.ok(a && a.specs && a.OpticCategories.length, 'el Catalyst 8300-1N1S-6T trae specs y opticas');
  const intacta = JSON.stringify(a);
  a.specs.cls = 'basura';
  a.OpticCategories[0].code = 'basura';
  a.OpticCategories.push('basura');
  const [b] = await leer();
  assert.strictEqual(JSON.stringify(b), intacta);
});

test('el orden imita al de SQLite: NULL, numeros y texto byte a byte', () => {
  const valores = ['b', 'B', null, 10, 2, 'a', 'Á', 'a10', 'a9'];
  assert.deepStrictEqual([...valores].sort(comparar), [null, 2, 10, 'B', 'a', 'a10', 'a9', 'b', 'Á']);
});

test('un uso de Sequelize que no se imita lanza en vez de dar un resultado a medias', async () => {
  await assert.rejects(() => memoria.Product.findAll({ where: { model: { like: 'FG%' } } }), /operador que no se imita/);
  await assert.rejects(() => memoria.Product.findAll({ limit: 3 }), /opciones que no se imitan: limit/);
  await assert.rejects(() => memoria.Product.findAll({ order: [['model', 'DESC']] }), /orden que no se imita/);
  await assert.rejects(() => memoria.Vendor.findAll({ include: [{ model: memoria.Part }] }), /asociacion no declarada/);
});
