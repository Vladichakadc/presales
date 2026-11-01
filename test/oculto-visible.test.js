'use strict';
/* UN `hidden` QUE SE VE (2026-11-01). El atributo `hidden` es un `display:none` de la hoja del
   navegador, y cualquier `display` de autor le gana. En la página de Fortinet la casilla «Licencia
   FortiGuard única del par» iba en un `.checks` (`display:grid`) con `hidden`: se veía sin alta
   disponibilidad y en activo-activo, y llegó a producción (PR #112). Lo vio Chromium; ninguna prueba
   lo miraba. Hasta entonces cada página arreglaba su caso con una regla por clase
   (`.tabpane[hidden]`, `.checks[hidden]`, `#modalConsolidado[hidden]`…), y el fallo aparecía el día
   que faltaba una.

   La regla, desde la mejora propuesta al cerrar el PR #112: una sola, `[hidden]{display:none !important}`,
   que cada página alcanza en su `<style>` o en una hoja propia que enlaza (`controles.css` en los
   ocho dimensionadores con casillas; la de Starlink en el suyo). El `!important` no es adorno: sin
   él, una ventana con `#id{display:flex}` le gana igualmente, porque el id pesa más que el atributo.
   Lo único que podría ganarle es otro `display` con `!important`, y por eso no se admite ninguno que
   no sea `none`. */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const PUBLICO = path.join(__dirname, '..', 'public');
const PAGINAS = fs.readdirSync(PUBLICO).filter((x) => x.endsWith('.html')).sort();
const sinComentarios = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');
const leer = (f) => fs.readFileSync(path.join(PUBLICO, f), 'utf8');

// El CSS que una página tiene a mano: su `<style>` y las hojas del propio sitio que enlaza.
function hojasDe(pagina) {
  const html = leer(pagina);
  const hojas = [{ donde: `${pagina} <style>`, css: [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join('\n') }];
  for (const m of html.matchAll(/<link\b[^>]*>/g)) {
    if (!/rel="stylesheet"/.test(m[0])) continue;
    const href = (/href="([^"]+)"/.exec(m[0]) || [])[1];
    if (!href || /^(https?:)?\/\//.test(href)) continue;
    const archivo = href.replace(/^\//, '').split(/[?#]/)[0];
    assert.ok(fs.existsSync(path.join(PUBLICO, archivo)), `${pagina} enlaza ${href}, que no existe en public/`);
    hojas.push({ donde: archivo, css: leer(archivo) });
  }
  return hojas.map((h) => ({ ...h, css: sinComentarios(h.css) }));
}

const REGLA = /(^|[}\s])\[hidden\]\s*\{\s*display\s*:\s*none\s*!important\s*;?\s*\}/;

test('cada página alcanza la regla única [hidden]{display:none !important}', () => {
  const sin = PAGINAS.filter((p) => !hojasDe(p).some((h) => REGLA.test(h.css)));
  assert.deepStrictEqual(sin, [], 'páginas en las que un display de autor puede volver a enseñar un hidden');
});

test('ningún display de autor con !important le gana a la regla [hidden]', () => {
  const vistos = new Set();
  const malos = [];
  for (const p of PAGINAS) {
    for (const h of hojasDe(p)) {
      if (vistos.has(h.donde)) continue;
      vistos.add(h.donde);
      for (const m of h.css.matchAll(/([^{}]+)\{([^}]*)\}/g)) {
        for (const d of m[2].matchAll(/display\s*:\s*([^;}]*?)\s*!important/g)) {
          if (d[1].trim() !== 'none') malos.push(`${h.donde}: ${m[1].trim()} { display: ${d[1].trim()} !important }`);
        }
      }
    }
  }
  assert.deepStrictEqual(malos, []);
});
