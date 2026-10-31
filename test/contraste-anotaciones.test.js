'use strict';
// LOS FALLOS DEL CONTRASTE, COMO ANOTACIONES (2026-10-31, mejora propuesta al cerrar el PR #88).
//
// El PR #87 falló dos veces en el contraste y la comprobación `pantallas` solo decía «exit code 1»:
// el resumen, los logs y los artefactos de Actions viven en un dominio que el proxy de las sesiones
// en la nube deniega, y hubo que reproducir el cálculo a mano para saber qué caso era. Ahora cada
// fallo sale en UNA línea con caso, escenario y detalle (`FALLO-CONTRASTE - `), y pantallas.yml la
// publica como anotación, que se lee por la API. Esto fija las dos mitades: que el motor la escribe
// para cada clase de fallo, y que el workflow publica justo ese prefijo.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { correr, lineaFallo, detalleDifs, PREFIJO_FALLO } = require('../scripts/contraste-motor');

// Una página de mentira: el motor solo navega, espera y deja que el caso lea.
const pagina = () => ({ goto: async () => {}, waitForTimeout: async () => {} });

async function salidaDe(caso) {
  const lineas = [];
  const original = console.log;
  console.log = (...a) => lineas.push(a.join(' '));
  let fallos;
  try {
    fallos = await correr(caso, { page: pagina(), base: 'http://127.0.0.1:1' });
  } finally {
    console.log = original;
  }
  return { fallos, lineas: lineas.join('\n').split('\n') };
}

test('la línea de fallo es una sola línea, con su prefijo, el caso, el escenario y el detalle', () => {
  const l = lineaFallo('Portal — TLS', 'TLS 175 Mbps\ncon salto', 'fabricantes: esperado 2, obtenido 1');
  assert.ok(l.startsWith(PREFIJO_FALLO));
  assert.ok(!/\n/.test(l), 'una anotación es una línea');
  assert.strictEqual(l, 'FALLO-CONTRASTE - Portal — TLS · TLS 175 Mbps con salto · fabricantes: esperado 2, obtenido 1');
  assert.strictEqual(lineaFallo('c', 'e', ''), 'FALLO-CONTRASTE - c · e', 'sin detalle no deja un separador colgando');
});

test('el detalle dice cada campo con lo esperado y lo obtenido', () => {
  assert.strictEqual(detalleDifs([
    { campo: 'recomendado', esperado: 'FortiGate 60F', obtenido: 'FortiGate 50G' },
    { campo: 'fabricantes', esperado: 1, obtenido: 2 },
  ]), 'recomendado: esperado FortiGate 60F, obtenido FortiGate 50G; fabricantes: esperado 1, obtenido 2');
});

test('un escenario que no casa con su línea base escribe su línea de fallo; uno que casa, no', async () => {
  const caso = {
    nombre: 'Caso de prueba', pagina: 'index.html', claves: ['recomendado'],
    medidoEn: { commit: 'abc', fecha: '2026-10-31' },
    baseLinea: [{ n: 'bien', recomendado: 'A' }, { n: 'mal', recomendado: 'B' }],
    esperaInicial: 0, esperaTrasPreparar: 0,
    async preparar(p, e) { this.actual = e.n; },
    async leer() { return { recomendado: 'A' }; },
  };
  const { fallos, lineas } = await salidaDe(caso);
  assert.strictEqual(fallos, 1);
  const anot = lineas.filter((l) => l.startsWith(PREFIJO_FALLO));
  assert.deepStrictEqual(anot, ['FALLO-CONTRASTE - Caso de prueba · mal · recomendado: esperado B, obtenido A']);
});

test('una comprobación propia (`extra`) que falla también escribe la suya, con su detalle', async () => {
  const caso = {
    nombre: 'Con extra', pagina: 'index.html', claves: ['x'], baseLinea: [],
    esperaInicial: 0, esperaTrasPreparar: 0,
    async preparar() {}, async leer() { return {}; },
    async extra() { return [{ n: 'declara la cobertura', ok: false, detalle: 'no lo declara' }, { n: 'otra', ok: true }]; },
  };
  const { fallos, lineas } = await salidaDe(caso);
  assert.strictEqual(fallos, 1);
  assert.deepStrictEqual(lineas.filter((l) => l.startsWith(PREFIJO_FALLO)),
    ['FALLO-CONTRASTE - Con extra · declara la cobertura · no lo declara']);
});

test('pantallas.yml publica como error de la comprobación justo las líneas con ese prefijo', () => {
  const yml = fs.readFileSync(path.join(__dirname, '../.github/workflows/pantallas.yml'), 'utf8');
  const paso = yml.split(/\n {6}- name: /).find((b) => b.startsWith('Publicar el contraste en la corrida'));
  assert.ok(paso, 'existe el paso que publica el contraste');
  assert.match(paso, /if: \$\{\{ !cancelled\(\) && hashFiles\('contraste\.txt'\) != '' \}\}/, 'corre también cuando el contraste falla');
  assert.ok(paso.includes(`grep -E '^${PREFIJO_FALLO}' contraste.txt`), 'busca el mismo prefijo que escribe el motor');
  assert.match(paso, /echo "::error title=contraste::\$linea"/);
  assert.match(paso, /sed 's\/%\/%25\/g'/, 'escapa el % de la sintaxis de los comandos');
});

test('contraste.js anota también la cobertura incoherente y un caso que revienta', () => {
  const js = fs.readFileSync(path.join(__dirname, '../scripts/contraste.js'), 'utf8');
  assert.match(js, /lineaFallo\('cobertura'/);
  assert.match(js, /\}\)\(\)\.catch\(\(e\) => \{[\s\S]*lineaFallo\('contraste', 'error'/);
});
