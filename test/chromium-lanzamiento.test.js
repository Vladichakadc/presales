'use strict';
// RenderDocument apagado en el lanzamiento (2026-11-03). Playwright 1.62 o posterior deja
// activado RenderDocument en Chromium, y la cobertura del contraste solo contaba la ultima pagina
// (ver scripts/ayuda/chromium.js y el comentario de pantallas.yml). La version fijada en los
// workflows solo puede ser 1.62+ si `opcionesDeLanzamiento()` apaga esa funcion: quitar el flag
// con la version nueva rompe la cobertura en CI, y esta prueba lo dice antes.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { opcionesDeLanzamiento, SIN_RENDER_DOCUMENT } = require('../scripts/ayuda/chromium');

test('opcionesDeLanzamiento apaga RenderDocument', () => {
  assert.strictEqual(SIN_RENDER_DOCUMENT, '--disable-features=RenderDocument');
  assert.ok(opcionesDeLanzamiento().args.includes(SIN_RENDER_DOCUMENT));
});

test('conserva los args y las opciones del que llama, sin duplicar el flag', () => {
  const extra = { headless: true, args: ['--lang=es'] };
  const o = opcionesDeLanzamiento(extra);
  assert.deepStrictEqual(o.args, ['--lang=es', SIN_RENDER_DOCUMENT]);
  assert.strictEqual(o.headless, true);
  assert.deepStrictEqual(extra.args, ['--lang=es'], 'no muta el objeto del que llama');
  const propio = opcionesDeLanzamiento({ args: ['--enable-features=RenderDocument'] });
  assert.deepStrictEqual(propio.args, ['--enable-features=RenderDocument'], 'quien nombra RenderDocument decide');
});

test('Playwright 1.62+ en los workflows solo con RenderDocument apagado', () => {
  const dir = path.join(__dirname, '..', '.github', 'workflows');
  for (const yml of fs.readdirSync(dir).filter((f) => f.endsWith('.yml'))) {
    const texto = fs.readFileSync(path.join(dir, yml), 'utf8');
    for (const [, mayor, menor] of texto.matchAll(/playwright@(\d+)\.(\d+)\.\d+/g)) {
      if (Number(mayor) > 1 || Number(menor) >= 62) {
        assert.ok(opcionesDeLanzamiento().args.includes(SIN_RENDER_DOCUMENT),
          `${yml} fija Playwright ${mayor}.${menor} y el lanzamiento no apaga RenderDocument`);
      }
    }
  }
});

// UN SOLO LANZAMIENTO (2026-11-04, decision del dueño). Los dos cargadores de Playwright envuelven
// su `chromium` con `conLanzamiento`, asi que cada `chromium.launch()` del repositorio (las baterias
// e2e, visibles, limites, pantallas, contraste y el manual) pasa por `opcionesDeLanzamiento()`.
// Sin Playwright: el job `verificar` no lo instala.
const { conLanzamiento, conPlaywright } = require('../scripts/ayuda/chromium');

test('conLanzamiento pasa launch por opcionesDeLanzamiento y deja el resto en el objeto real', async () => {
  class TipoFalso {
    constructor() { this.nombre = 'chromium'; }
    async launch(o) { return { opciones: o, yo: this }; }
    name() { return this.nombre; }
  }
  const real = new TipoFalso();
  const envuelto = conLanzamiento(real);
  const r = await envuelto.launch({ args: ['--lang=es'], headless: true });
  assert.deepStrictEqual(r.opciones.args, ['--lang=es', SIN_RENDER_DOCUMENT]);
  assert.strictEqual(r.opciones.headless, true);
  assert.strictEqual(r.yo, real, 'launch corre sobre el objeto real');
  assert.ok((await envuelto.launch()).opciones.args.includes(SIN_RENDER_DOCUMENT), 'tambien sin argumentos');
  assert.strictEqual(envuelto.name(), 'chromium', 'un metodo que usa this sigue funcionando');
  const pw = conPlaywright({ chromium: real, devices: { x: 1 } });
  assert.ok((await pw.chromium.launch()).opciones.args.includes(SIN_RENDER_DOCUMENT));
  assert.deepStrictEqual(pw.devices, { x: 1 }, 'lo demas del modulo, tal cual');
});

test('solo los dos cargadores cargan Playwright, y los dos envuelven su chromium', () => {
  const raiz = path.join(__dirname, '..');
  const CARGADORES = ['scripts/ayuda/chromium.js', 'test/e2e/ayuda.js'];
  const archivos = [];
  const recorrer = (d) => {
    for (const e of fs.readdirSync(path.join(raiz, d), { withFileTypes: true })) {
      const r = path.posix.join(d, e.name);
      if (e.isDirectory()) { if (e.name !== 'node_modules') recorrer(r); } else if (r.endsWith('.js')) archivos.push(r);
    }
  };
  recorrer('scripts'); recorrer('test');
  const cargan = archivos.filter((f) => f !== 'test/chromium-lanzamiento.test.js'
    && /require\([^)]*['"/]playwright(?:-core)?['"]\)/.test(fs.readFileSync(path.join(raiz, f), 'utf8')));
  assert.deepStrictEqual(cargan.sort(), CARGADORES.slice().sort(),
    'un tercer cargador de Playwright lanzaria Chromium sin opcionesDeLanzamiento(): que use requerirPlaywright() o cargarPlaywright()');
  const chromium = fs.readFileSync(path.join(raiz, CARGADORES[0]), 'utf8');
  assert.match(chromium, /return conPlaywright\(pw\);/, 'requerirPlaywright() devuelve el modulo envuelto');
  const e2e = fs.readFileSync(path.join(raiz, CARGADORES[1]), 'utf8');
  const devoluciones = [...e2e.matchAll(/return (conPlaywright\()?require\(/g)];
  assert.ok(devoluciones.length >= 2 && devoluciones.every((m) => m[1]), 'cargarPlaywright() devuelve el modulo envuelto en sus dos caminos');
});
