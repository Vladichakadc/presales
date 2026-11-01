'use strict';
/* UN `hidden` QUE SE VE (2026-11-01). El atributo `hidden` es un `display:none` de la hoja del
   navegador, y cualquier `display` de autor le gana. En la página de Fortinet la casilla «Licencia
   FortiGuard única del par» iba en un `.checks` (`display:grid`) con `hidden`: se veía sin alta
   disponibilidad y en activo-activo, y el resumen WAN (`.wan-resumen`, `display:flex`) quedaba como
   una caja vacía sin enlaces. Lo vio Chromium; ninguna prueba lo miraba.

   La regla: un elemento que una página marca `hidden` en su HTML y cuya clase pone `display` en la
   hoja de esa página necesita su `.<clase>[hidden]{display:none}` (o una regla `[hidden]` general). */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const PUBLICO = path.join(__dirname, '..', 'public');

function clasesConDisplay(estilo) {
  const out = new Set();
  for (const m of estilo.matchAll(/([^{}]+)\{([^}]*)\}/g)) {
    if (!/display\s*:\s*(grid|flex|block|inline|inline-flex|inline-block|table)/.test(m[2])) continue;
    for (const sel of m[1].split(',')) {
      const c = /^\s*\.([\w-]+)\s*$/.exec(sel);
      if (c) out.add(c[1]);
    }
  }
  return out;
}

test('ningún elemento con hidden se ve porque su clase pone display', () => {
  const malos = [];
  for (const f of fs.readdirSync(PUBLICO).filter((x) => x.endsWith('.html'))) {
    const html = fs.readFileSync(path.join(PUBLICO, f), 'utf8');
    const estilo = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join('\n');
    if (/(^|[\s,}])\[hidden\]\s*\{[^}]*display\s*:\s*none/.test(estilo)) continue;
    const conDisplay = clasesConDisplay(estilo);
    for (const m of html.matchAll(/<\w+\b([^>]*)>/g)) {
      const attrs = m[1];
      if (!/\shidden(\s|$|=)/.test(attrs)) continue;
      const clase = /\sclass="([^"]*)"/.exec(attrs);
      if (!clase) continue;
      for (const c of clase[1].split(/\s+/)) {
        if (conDisplay.has(c) && !estilo.includes(`.${c}[hidden]`)) {
          const id = /\sid="([^"]*)"/.exec(attrs);
          malos.push(`${f}: #${id ? id[1] : '?'} (.${c})`);
        }
      }
    }
  }
  assert.deepStrictEqual(malos, []);
});
