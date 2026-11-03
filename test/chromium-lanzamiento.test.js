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
