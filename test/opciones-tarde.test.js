'use strict';
/* Un desplegable que el HTML trae vacío y viaja en el enlace se declara en `opcionesTarde`.

   Pasó tres veces (2026-10-30): `apModel` de MikroTik, `pickModel` y `selTier` de Aruba. Sus
   opciones llegan con el catálogo, después de que ESTADO restaura el enlace: sin declararlo, el
   valor del enlace se pierde sin aviso (medido en CI: `selTier=bw20` aterrizaba en `auto`) y la
   primera opción viaja siempre, aunque nadie la eligiera. Esta prueba frena el cuarto. */

const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..', 'public');
const paginas = fs.readdirSync(path.join(RAIZ, 'js'))
  .filter((f) => /^dimensionador-.*\.js$/.test(f) && fs.existsSync(path.join(RAIZ, f.replace(/\.js$/, '.html'))));

// Los ids que la página pasa a ESTADO.vincular: la lista literal o la constante que nombra.
function camposDelEnlace(js) {
  const m = /ESTADO\.vincular\(\{\s*campos:\s*(\[[\s\S]*?\]|[A-Za-z_$][\w$]*)/.exec(js);
  if (!m) return [];
  let lista = m[1];
  if (!lista.startsWith('[')) {
    const d = new RegExp(`const ${lista}\\s*=\\s*(\\[[\\s\\S]*?\\]);`).exec(js);
    lista = d ? d[1] : '[]';
  }
  return [...lista.matchAll(/'([^']+)'/g)].map((x) => x[1]);
}
const opcionesTarde = (js) => {
  const m = /opcionesTarde:\s*\[([^\]]*)\]/.exec(js);
  return m ? [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1]) : [];
};

test('se comprueba en las páginas que vinculan su estado', () => {
  assert.ok(paginas.filter((f) => camposDelEnlace(fs.readFileSync(path.join(RAIZ, 'js', f), 'utf8')).length).length >= 8);
});

for (const f of paginas) {
  const js = fs.readFileSync(path.join(RAIZ, 'js', f), 'utf8');
  const html = fs.readFileSync(path.join(RAIZ, f.replace(/\.js$/, '.html')), 'utf8');
  const campos = new Set(camposDelEnlace(js));
  if (!campos.size) continue;
  test(`${f}: cada desplegable vacío del enlace está en opcionesTarde`, () => {
    const vacios = [...html.matchAll(/<select[^>]*\bid="([^"]+)"[^>]*>\s*<\/select>/g)].map((x) => x[1]);
    const declarados = new Set(opcionesTarde(js));
    for (const id of vacios.filter((v) => campos.has(v))) {
      assert.ok(declarados.has(id), `#${id} llega vacío y viaja en el enlace: decláralo en opcionesTarde`);
    }
    for (const id of declarados) assert.ok(campos.has(id), `opcionesTarde «${id}» no viaja en el enlace: sobra`);
  });
}
