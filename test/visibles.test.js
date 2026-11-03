'use strict';
// La regla de `npm run visibles` (scripts/visibles.js), sin navegador: qué frena, qué avisa, cómo se
// agrupa y qué se acepta. El recorrido en Chromium no corre aquí (lo corre el workflow `visibles`
// en los PR que tocan public/, y su mutación de control comprueba en el navegador que la foto ve).
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { aceptaciones, cimas, comparar, agrupar, lineaDe, fotoDeLaPagina } = require('../scripts/visibles');

const paso = (nombre, visibles, presentes = visibles, padres = {}) => ({ nombre, visibles, presentes, padres });
const tipos = (hs) => hs.map((h) => `${h.tipo} ${h.id || '-'} ${h.que}`).sort();

test('las aceptaciones salen de las líneas visibles-acepta de la descripción, con motivo', () => {
  const texto = [
    'Este PR quita el panel viejo.',
    'visibles-acepta: #panelViejo: se retira a propósito, lo sustituye panelNuevo',
    '  visibles-acepta: sinAlmohadilla: también vale sin la almohadilla',
    'visibles-acepta: #corto: breve',
    'equivalencia-acepta: otro: no es de esta herramienta',
  ].join('\n');
  assert.deepStrictEqual(aceptaciones(texto), {
    panelViejo: 'se retira a propósito, lo sustituye panelNuevo',
    sinAlmohadilla: 'también vale sin la almohadilla',
  });
  assert.deepStrictEqual(aceptaciones(undefined), {});
});

test('lo mismo en los dos recorridos no da nada', () => {
  const p = [paso('a', ['x', 'y'], ['x', 'y', 'z'])];
  assert.deepStrictEqual(comparar(p, p), []);
});

test('frena lo que deja de verse, lo que ya no está y lo que la base ocultaba; lo nuevo solo avisa', () => {
  const base = [paso('a', ['sigue', 'seOculta', 'seQuita'], ['sigue', 'seOculta', 'seQuita', 'estabaOculto'])];
  const contra = [paso('a', ['sigue', 'estabaOculto', 'nuevo'], ['sigue', 'seOculta', 'estabaOculto', 'nuevo'])];
  assert.deepStrictEqual(tipos(comparar(base, contra)), [
    'aviso nuevo nuevo: se ve, y la base no lo tenía',
    'frena estabaOculto se ve, y en la base estaba en la página pero oculto',
    'frena seOculta deja de verse',
    'frena seQuita ya no está en la página',
  ]);
});

test('un panel que se oculta entero es una diferencia, con lo que lleva dentro contado', () => {
  const padres = { campoA: 'panel', campoB: 'panel', sub: 'campoA', panel: 'pagina' };
  assert.deepStrictEqual([...cimas(new Set(['panel', 'campoA', 'campoB', 'sub']), padres)], [['panel', 3]]);
  // Si el de arriba sigue a la vista, cada uno cuenta por su cuenta.
  assert.deepStrictEqual([...cimas(new Set(['campoA', 'campoB']), padres)].sort(), [['campoA', 0], ['campoB', 0]]);

  const base = [paso('ssr', ['pagina', 'panel', 'campoA', 'campoB', 'sub'], undefined, padres)];
  const contra = [paso('ssr', ['pagina'], ['pagina', 'panel', 'campoA', 'campoB', 'sub'])];
  const hs = comparar(base, contra);
  assert.deepStrictEqual(hs.map((h) => [h.tipo, h.id, h.dentro]), [['frena', 'panel', 3]]);
  assert.strictEqual(lineaDe(agrupar(hs)[0]), '#panel (y 3 id dentro) deja de verse en «ssr»');
});

test('lo que aparece se agrupa por separado: un id que la base ocultaba no se esconde bajo uno nuevo', () => {
  const padres = { viejo: 'envoltorio' };
  const base = [paso('a', ['pagina'], ['pagina', 'viejo'])];
  const contra = [paso('a', ['pagina', 'envoltorio', 'viejo'], ['pagina', 'envoltorio', 'viejo'], padres)];
  assert.deepStrictEqual(tipos(comparar(base, contra)), [
    'aviso envoltorio nuevo: se ve, y la base no lo tenía',
    'frena viejo se ve, y en la base estaba en la página pero oculto',
  ]);
});

test('lo aceptado no frena, y una aceptación que no casa con nada avisa de que sobra', () => {
  const base = [paso('a', ['x', 'y'])];
  const contra = [paso('a', ['x'], ['x', 'y'])];
  const hs = comparar(base, contra, { y: 'se oculta a propósito en este PR', z: 'una que no casa con nada' });
  assert.deepStrictEqual(tipos(hs), [
    'aceptado y deja de verse',
    'aviso z aceptación que no casa con ninguna diferencia: sobra',
  ]);
  assert.match(lineaDe(agrupar(hs)[0], { y: 'se oculta a propósito en este PR' }), /aceptado en el PR: se oculta a propósito/);
});

test('los pasos que fallan o faltan: falla solo aquí frena; lo demás avisa', () => {
  const base = [paso('ok', ['x']), { nombre: 'rotoEnLosDos', error: 'no está .node-box' }, paso('rotoAqui', ['x']),
    { nombre: 'rotoEnBase', error: 'tiempo agotado' }, paso('soloBase', ['x'])];
  const contra = [paso('ok', ['x']), { nombre: 'rotoEnLosDos', error: 'no está .node-box' }, { nombre: 'rotoAqui', error: 'no está #btn' },
    paso('rotoEnBase', ['x']), paso('soloAqui', ['x'])];
  const hs = comparar(base, contra);
  assert.deepStrictEqual(hs.map((h) => `${h.tipo} ${h.paso}`).sort(), [
    'aviso rotoEnBase', 'aviso rotoEnLosDos', 'aviso soloAqui', 'aviso soloBase', 'frena rotoAqui',
  ]);
});

test('agrupar: un id que deja de verse en varios pasos es una línea, primero lo que frena', () => {
  const base = [paso('p1', ['x', 'n']), paso('p2', ['x']), paso('p3', ['x'])];
  const contra = [paso('p1', ['n', 'nuevo'], ['x', 'n', 'nuevo']), paso('p2', [], ['x']), paso('p3', ['x'])];
  const gs = agrupar(comparar(base, contra));
  assert.deepStrictEqual(gs.map((g) => [g.tipo, g.id, g.pasos.length]), [['frena', 'x', 2], ['aviso', 'nuevo', 1]]);
  assert.strictEqual(lineaDe(gs[0]), '#x deja de verse en 2 pasos (el primero, «p1»)');
});

// La foto, con un doble mínimo del documento: con caja y sin display:none ni visibility:hidden se ve;
// un hijo de algo oculto no tiene caja; cada visible apunta a su id ancestro más cercano.
test('la foto de la página: qué se ve, qué está y de quién cuelga cada visible', () => {
  const el = (id, padre, { display = 'block', visibility = 'visible', w = 10, h = 10 } = {}) => {
    const e = { id, parentElement: padre, estilo: { display, visibility }, caja: { width: w, height: h } };
    e.getBoundingClientRect = () => e.caja;
    e.closest = () => { for (let x = e; x; x = x.parentElement) if (x.id) return x; return null; };
    return e;
  };
  const cuerpo = el('', null);
  const pagina = el('pagina', cuerpo);
  const sinId = el('', pagina);
  const campo = el('campo', sinId);
  const oculto = el('oculto', pagina, { display: 'none', w: 0, h: 0 });
  const hijoOculto = el('hijoOculto', oculto, { w: 0, h: 0 });
  const invisible = el('invisible', pagina, { visibility: 'hidden' });
  const vacio = el('vacio', pagina, { w: 0, h: 0 });
  const antes = { document: global.document, getComputedStyle: global.getComputedStyle };
  global.document = { querySelectorAll: () => [pagina, campo, oculto, hijoOculto, invisible, vacio] };
  global.getComputedStyle = (e) => e.estilo;
  try {
    assert.deepStrictEqual(fotoDeLaPagina(), {
      visibles: ['campo', 'pagina'],
      presentes: ['campo', 'hijoOculto', 'invisible', 'oculto', 'pagina', 'vacio'],
      padres: { campo: 'pagina' },
    });
  } finally {
    global.document = antes.document;
    global.getComputedStyle = antes.getComputedStyle;
  }
});

test('el workflow corre en los PR que tocan public/, contra su base y con la descripción por el entorno', () => {
  const yml = fs.readFileSync(path.join(__dirname, '..', '.github', 'workflows', 'visibles.yml'), 'utf8').replace(/^\s*#.*\n/gm, '');
  assert.match(yml, /\non:\n {2}pull_request:\n {4}branches: \[main\]\n {4}paths:\n(?: {6}- .+\n)*? {6}- 'public\/\*\*'\n/, 'no corre en los PR que tocan public/');
  assert.doesNotMatch(yml, /\n {2}push:/, 'en el push a main no hay base con la que comparar');
  assert.match(yml, /fetch-depth: 0/, 'sin el historial entero no hay origin/<base> para el worktree');
  assert.match(yml, /PR_BODY: \$\{\{ github\.event\.pull_request\.body \}\}/, 'las aceptaciones salen de la descripción, por el entorno');
  assert.match(yml, /run: node scripts\/visibles\.js --ref="origin\/\$BASE_REF"\n/, 'compara contra la rama base del PR');
  const runs = [...yml.matchAll(/\n {8}run: (?:\|\n((?: {10}.+\n)+)|(.+))/g)].map((m) => m[1] || m[2]);
  assert.strictEqual(runs.length, 3, `se esperaban tres run: (${runs.length})`);
  for (const r of runs) assert.doesNotMatch(r, /\$\{\{/, `nada de github.* interpolado en un run: («${r.trim()}»)`);
});
