'use strict';
// La versión de Node se declara en un solo sitio: `engines.node` de package.json (2026-10-02).
// Medido ese día en el log de construcción de Railway: el constructor es Railpack, toma la
// versión de ese campo («package.json > engines > node») y, con `>=20`, eligió Node 20.20.2, sin
// soporte desde el 30 de abril de 2026. Llevaba cinco meses así sin que nada lo dijera.
// `nixpacks.toml` fijaba `nodejs_20` y no lo leía nadie, y cada workflow fijaba 20 por su cuenta.
// Cuatro reglas:
//   1. `engines.node` es una versión mayor, sin rango. Con un rango cada herramienta elige otra
//      versión: Railpack tomó la más baja que cumplía `>=20`.
//   2. Esa versión es LTS y tiene soporte hoy, según el calendario oficial de Node.js. El día que
//      termine, esta prueba se pone en rojo: es la alarma que faltó.
//   3. Cada `actions/setup-node` la lee de package.json (`node-version-file`), y ninguno la fija.
//   4. Ningún otro archivo declara una versión de Node, y el lock dice lo mismo que package.json.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..');
const WORKFLOWS = path.join(RAIZ, '.github', 'workflows');

// Calendario oficial de Node.js: https://github.com/nodejs/Release/blob/main/schedule.json,
// leído el 2026-10-02. Solo las versiones pares llegan a LTS. Al subir de versión se añade la
// nueva con sus dos fechas copiadas de ese archivo, nunca estimadas.
const CALENDARIO = {
  20: { lts: '2023-10-24', fin: '2026-04-30' },
  22: { lts: '2024-10-29', fin: '2027-04-30' },
  24: { lts: '2025-10-28', fin: '2028-04-30' },
  26: { lts: '2026-10-28', fin: '2029-04-30' },
};

// Por qué no vale una versión en una fecha dada, o null si vale.
function sinSoporte(mayor, hoy) {
  const c = CALENDARIO[mayor];
  if (!c) return `Node ${mayor} no está en el calendario: solo las versiones pares son LTS, y cada una se añade con sus fechas oficiales`;
  if (hoy < c.lts) return `Node ${mayor} todavía no es LTS (lo será el ${c.lts})`;
  if (hoy > c.fin) return `Node ${mayor} dejó de tener soporte el ${c.fin}: sube engines.node a la LTS vigente`;
  return null;
}

const paquete = JSON.parse(fs.readFileSync(path.join(RAIZ, 'package.json'), 'utf8'));
const declarada = paquete.engines && paquete.engines.node;

test('engines.node es una sola versión mayor, sin rango', () => {
  assert.match(String(declarada), /^\d+$/, `engines.node es «${declarada}»: con un rango, Railpack y setup-node pueden elegir versiones distintas`);
});

test('la versión declarada es LTS y tiene soporte hoy', () => {
  const hoy = new Date().toISOString().slice(0, 10);
  assert.strictEqual(sinSoporte(Number(declarada), hoy), null);
});

test('el calendario se lee bien en sus bordes', () => {
  assert.strictEqual(sinSoporte(24, '2028-04-30'), null, 'el último día todavía tiene soporte');
  assert.match(sinSoporte(24, '2028-05-01'), /dejó de tener soporte el 2028-04-30/);
  assert.match(sinSoporte(20, '2026-10-02'), /dejó de tener soporte el 2026-04-30/, 'la versión que corría producción');
  assert.match(sinSoporte(26, '2026-10-02'), /todavía no es LTS/);
  assert.match(sinSoporte(25, '2026-10-02'), /solo las versiones pares/);
});

test('cada setup-node lee la versión de package.json, y ninguno la fija', () => {
  let pasos = 0;
  for (const yml of fs.readdirSync(WORKFLOWS).filter((f) => f.endsWith('.yml'))) {
    const lineas = fs.readFileSync(path.join(WORKFLOWS, yml), 'utf8').split('\n');
    const fijas = lineas.filter((l) => /^\s+node-version:/.test(l));
    assert.deepStrictEqual(fijas, [], `${yml} fija su propia versión de Node`);
    lineas.forEach((l, i) => {
      if (!/uses: actions\/setup-node@/.test(l)) return;
      pasos++;
      // El bloque `with:` del paso: las líneas siguientes, hasta el próximo paso.
      const bloque = [];
      for (let k = i + 1; k < lineas.length && !/^\s+- /.test(lineas[k]); k++) bloque.push(lineas[k]);
      assert.ok(bloque.some((b) => /^\s+node-version-file: package\.json$/.test(b)), `${yml}:${i + 1} no lee la versión de package.json`);
    });
  }
  assert.ok(pasos >= 15, `se esperaban al menos 15 pasos de setup-node y hay ${pasos}`);
});

test('ningún otro archivo declara la versión de Node, y el lock dice lo mismo', () => {
  for (const archivo of ['.nvmrc', '.node-version', '.tool-versions', 'mise.toml', '.mise.toml', 'nixpacks.toml', 'Dockerfile']) {
    assert.ok(!fs.existsSync(path.join(RAIZ, archivo)), `${archivo} declara otra versión de Node: la única es engines.node de package.json`);
  }
  // El archivo de Railpack puede llegar a existir por otros motivos, pero sin fijar Node.
  const railpack = path.join(RAIZ, 'railpack.json');
  if (fs.existsSync(railpack)) {
    const cfg = JSON.parse(fs.readFileSync(railpack, 'utf8'));
    assert.ok(!(cfg.packages && cfg.packages.node), 'railpack.json fija Node: la única versión es engines.node de package.json');
  }
  // Y dentro de package.json tampoco: `setup-node` lee `volta.node` antes que `engines.node`, y
  // Railpack no, así que un bloque `volta` volvería a separar CI de producción sin que nada lo
  // dijera. `devEngines` es la otra forma de declararla que leen npm 11 y `setup-node`.
  for (const campo of ['volta', 'devEngines']) {
    assert.ok(!(campo in paquete), `package.json declara «${campo}»: la única versión es engines.node`);
  }
  const lock = JSON.parse(fs.readFileSync(path.join(RAIZ, 'package-lock.json'), 'utf8'));
  assert.strictEqual(lock.packages[''].engines && lock.packages[''].engines.node, declarada,
    'package-lock.json no dice la misma versión: se regenera con npm install --package-lock-only');
});
