'use strict';
// LA VENTANA DEL CONSOLIDADO, UNA SOLA REGLA (2026-10-31; la mejora propuesta al cerrar el PR #67).
// El marcado lo pone `BOM.montarPerfiles` y el estilo vive en `public/controles.css`. Antes cada una
// de las siete hojas lo repetía, con dos velos distintos. Lo que se ve lo conducen el contraste de
// pantallas y `e2e-accesibilidad.js`, que abre la ventana.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..');
const leer = (r) => fs.readFileSync(path.join(RAIZ, r), 'utf8');

// Las páginas que montan el panel de perfiles se leen del código, no de una lista escrita.
const PAGINAS = fs.readdirSync(path.join(RAIZ, 'public/js'))
  .filter((f) => /^dimensionador-.+\.js$/.test(f) && /BOM\.montarPerfiles\(/.test(leer(`public/js/${f}`)))
  .map((f) => f.replace(/^dimensionador-|\.js$/g, ''))
  .sort();

const estiloDe = (html) => (html.match(/<style>([\s\S]*?)<\/style>/) || [, ''])[1];

test('las siete páginas con perfiles cargan la hoja común', () => {
  assert.deepStrictEqual(PAGINAS, ['aruba-edgeconnect', 'cisco-catalyst8k', 'fortinet-fortigate',
    'huawei-netengine', 'juniper-srx', 'mikrotik-routeros', 'nokia-7750sr']);
  for (const pag of PAGINAS) {
    assert.match(leer(`public/dimensionador-${pag}.html`), /<link rel="stylesheet" href="\/controles\.css">/,
      `${pag}: sin controles.css la ventana del consolidado sale sin velo ni posición`);
  }
});

test('ninguna hoja de página vuelve a escribir las ventanas', () => {
  for (const pag of PAGINAS) {
    const css = estiloDe(leer(`public/dimensionador-${pag}.html`));
    assert.doesNotMatch(css, /#modalConsolidado/, `${pag}: la regla va en controles.css, sección 6`);
    assert.doesNotMatch(css, /rgba\(28,\s*25,\s*23/, `${pag}: el velo cálido viejo; el velo sale de la tinta`);
    // Lo único propio de una ventana que puede quedar en una hoja es el ancho de la de ópticas de
    // Aruba (`#accModal`, 640 px): velo, caja y título son la regla común (2026-10-31, tras el PR #89).
    const propias = (css.match(/[^{}]*(?:#accModal|\.acc-caja)[^{}]*\{[^}]*\}/g) || []).map((r) => r.replace(/\/\*[\s\S]*?\*\//g, '').trim());
    for (const regla of propias) {
      assert.match(regla, /^#accModal \.acc-caja\{max-width:\d+px\}$/, `${pag}: «${regla}» repite la ventana común`);
    }
  }
  assert.match(leer('public/dimensionador-aruba-edgeconnect.html'), /<div id="accModal" hidden>/, 'la ventana de ópticas de Aruba sigue existiendo');
});

test('la hoja común da velo, posición y caja, con el velo de la tinta', () => {
  const css = leer('public/controles.css');
  const regla = (sel) => {
    const m = css.match(new RegExp(`(?:^|\\n)${sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} \\{([^}]*)\\}`));
    assert.ok(m, `falta la regla ${sel}`);
    return m[1];
  };
  const modal = regla('#modalConsolidado, #accModal');
  assert.match(modal, /position: fixed/);
  assert.match(modal, /inset: 0/);
  assert.match(modal, /color-mix\(in srgb, var\(--ink, #0E1A2B\) 45%, transparent\)/,
    'el velo sale de la tinta de la página, no de un rgba escrito a mano');
  assert.match(regla('#modalConsolidado[hidden], #accModal[hidden]'), /display: none/, 'sin esto la ventana no se cierra');
  const caja = regla('#modalConsolidado .acc-caja, #accModal .acc-caja');
  assert.match(caja, /max-height: 86vh/);
  assert.match(caja, /overflow: auto/, 'sin desplazamiento un consolidado largo se corta');
  // La tinta de las siete es la misma: el velo común no cambia de tono de una a otra.
  for (const pag of PAGINAS) {
    assert.match(estiloDe(leer(`public/dimensionador-${pag}.html`)), /--ink:#0E1A2B/, `${pag}: otra tinta, otro velo`);
  }
});
