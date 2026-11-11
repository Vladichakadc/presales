'use strict';
// ADR-3 de la auditoria del 2026-11-09, corte 1 (2026-11-10): el catalogo en memoria da las MISMAS
// proyecciones que SQLite. Se siembran los dos con la misma seedCatalog() y cada proyeccion de
// catalogProjection.js se compara dos veces: en JSON (lo que recibe el navegador) y con igualdad
// estricta (lo que usan los consumidores del propio servidor, como la evaluacion de Fortinet).
// La comparacion en JSON es la del texto exacto, con el orden de las claves: un desplegable que
// recorre un objeto lo pinta en ese orden.
// Dos controles: un precio cambiado en el almacen en memoria tiene que verse (si no, las dos
// pasadas serian la misma base y la igualdad no probaria nada), y modificar lo que devuelve una
// proyeccion no puede cambiar la siguiente (SQLite da objetos nuevos en cada consulta).
const fs = require('fs');
const os = require('os');
const path = require('path');

process.env.DATABASE_PATH = ':memory:';
process.env.AUTH_STATE_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'catalogo-en-memoria-'));

const test = require('node:test');
const assert = require('node:assert');
const modelosSql = require('../server/models');
const seedCatalog = require('../server/seed/seedCatalog');
const proyeccion = require('../server/services/catalogProjection');
const { crearCatalogo, comparar } = require('../server/services/catalogoEnMemoria');

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
  for (const [fn, ...args] of LLAMADAS) salida[[fn, ...args].join(':')] = await proyeccion[fn](...args);
  return salida;
}
const json = (x) => JSON.parse(JSON.stringify(x));

let sql;
let memoria;
let enMemoria;

test.before(async () => {
  await modelosSql.sequelize.sync();
  await enSilencio(() => seedCatalog(modelosSql));
  sql = await proyectar();
  memoria = crearCatalogo();
  await enSilencio(() => seedCatalog(memoria));
  proyeccion.usarModelos(memoria);
  enMemoria = await proyectar();
});
test.after(async () => {
  proyeccion.usarModelos(modelosSql);
  await modelosSql.sequelize.close();
});

test('las mismas filas que SQLite, tabla a tabla', async () => {
  for (const nombre of Object.keys(memoria)) {
    // Las tablas intermedias no tienen `id`: sin orden, SQLite las da en el de creacion.
    const conId = Boolean(modelosSql[nombre].rawAttributes.id);
    const a = (await modelosSql[nombre].findAll(conId ? { order: [['id', 'ASC']] } : {})).map((f) => f.get({ plain: true }));
    const b = (await memoria[nombre].findAll()).map((f) => f.get({ plain: true }));
    const sinFechas = (filas) => filas.map(({ createdAt, updatedAt, ...resto }) => resto);
    assert.deepStrictEqual(sinFechas(b), sinFechas(a), `${nombre}: las filas del catalogo en memoria no son las de SQLite`);
  }
});

for (const [fn, ...args] of LLAMADAS) {
  const clave = [fn, ...args].join(':');
  test(`${clave}: lo mismo que con SQLite`, () => {
    assert.strictEqual(JSON.stringify(enMemoria[clave]), JSON.stringify(sql[clave]), `${clave}: el JSON difiere`);
    assert.deepStrictEqual(enMemoria[clave], sql[clave], `${clave}: difiere dentro del servidor (tipos, claves o fechas)`);
  });
}

test('control: un precio cambiado en el almacen se ve en la proyeccion', async () => {
  const [p] = await memoria.Product.findAll({ where: { model: 'FortiGate 90G' } });
  assert.ok(p, 'el FortiGate 90G esta en el catalogo');
  const antes = p.priceNumeric;
  await p.update({ priceNumeric: (antes || 0) + 1 });
  try {
    assert.notDeepStrictEqual(json(await proyeccion.toCotizadorCatalog()), json(sql.toCotizadorCatalog),
      'con un precio cambiado tendria que diferir: la comparacion no esta leyendo el almacen en memoria');
  } finally {
    await p.update({ priceNumeric: antes });
  }
  assert.deepStrictEqual(json(await proyeccion.toCotizadorCatalog()), json(sql.toCotizadorCatalog));
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
