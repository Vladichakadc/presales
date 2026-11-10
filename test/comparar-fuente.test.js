'use strict';
// `scripts/comparar-fuente.js` (2026-11-09): la comparación de una rama fuente/* con la copia
// anterior de cada documento. Se fija lo que la haría mentir: dar por igual un texto que cambió,
// esconder la línea que cambia, contar como cambio un simple recorte de línea, tomar como
// «anterior» una copia posterior, o leer «sin texto» como «sin cambios». Los textos son
// sintéticos, calcados de lo que pasó el 2026-11-09 (la ficha del 7250 IXR-R pasó a nombrar
// MACsec; las Release Notes de FortiOS solo cambiaron su menú).
const test = require('node:test');
const assert = require('node:assert');
const { lineasDeHtml, lineasDeTexto, compararLineas, clasificar, elegirAnterior, argumentos, pintar } = require('../scripts/comparar-fuente');
const { textoNormalizado } = require('../scripts/vigia-fuentes');

const doc = (blob, texto) => ({ blob, texto: texto.replace(/\s+/g, ' ').trim(), lineas: lineasDeTexto(texto) });

test('el corte de línea no cuenta; la línea que cambia de verdad se enseña', () => {
  const vieja = 'Security\n• Secure boot\napplications for telecommunications providers, AI and\ncloud providers.';
  const nueva = 'Security\n• Secure boot\n• MAC security (MACsec) LAN mode\napplications for telecommunications\nproviders, AI and cloud providers.';
  const d = compararLineas(lineasDeTexto(vieja), lineasDeTexto(nueva));
  assert.deepStrictEqual(d.mas, ['• MAC security (MACsec) LAN mode']);
  assert.deepStrictEqual(d.menos, []);
  // Solo recolocado: igual.
  assert.strictEqual(compararLineas(['a b', 'c d'], ['a', 'b c', 'd']).igual, true);
  // El mismo texto en otro orden no es igual, y se dice como cambio de orden.
  const o = compararLineas(['Security', 'MACsec'], ['MACsec', 'Security']);
  assert.deepStrictEqual([o.igual, o.soloOrden, o.mas.length, o.menos.length], [false, true, 0, 0]);
});

test('los cinco veredictos', () => {
  const a = doc('b1', 'IPS throughput 2.25 Gbps\nMACsec planned');
  assert.deepStrictEqual(clasificar(null, a), { estado: 'NUEVO' });
  assert.deepStrictEqual(clasificar(a, { ...a }), { estado: 'IGUAL' });
  assert.deepStrictEqual(clasificar(a, doc('b2', 'IPS throughput 2.25 Gbps MACsec\nplanned')), { estado: 'BYTES' });
  const t = clasificar(a, doc('b3', 'IPS throughput 2.5 Gbps\nMACsec planned'));
  assert.deepStrictEqual(t, { estado: 'TEXTO', mas: ['IPS throughput 2.5 Gbps'], menos: ['IPS throughput 2.25 Gbps'], soloOrden: false });
  // Sin texto que leer, con bytes distintos: no se sabe. Nunca BYTES ni IGUAL.
  assert.deepStrictEqual(clasificar(a, { blob: 'b4', sinTexto: 'falta pdf-parse (npm install); no hay pdftotext' }),
    { estado: 'SIN-TEXTO', motivo: 'falta pdf-parse (npm install); no hay pdftotext' });
  assert.strictEqual(clasificar({ blob: 'b0', sinTexto: 'x' }, a).estado, 'SIN-TEXTO');
});

test('en HTML decide el texto del vigía, y las líneas salen de los bloques', () => {
  const pagina = (menu, cuerpo) => `<html><head><style>p{}</style><script>var t=${Date.now()}</script></head><body><!-- ${Math.random()} -->`
    + `<nav><a>Products</a>${menu}</nav><p>FortiWiFi</p><ul><li>FWF-50G</li><li>FWF-50G-5G</li>${cuerpo}</ul></body></html>`;
  const de = (blob, html) => ({ blob, texto: textoNormalizado(Buffer.from(html), 'text/html'), lineas: lineasDeHtml(html) });
  // Otra marca en un script y en un comentario: BYTES.
  assert.strictEqual(clasificar(de('1', pagina('', '')), de('2', pagina('', ''))).estado, 'BYTES');
  // Un enlace nuevo en el menú: TEXTO, y se ve que es el menú y no la lista de modelos.
  const menu = clasificar(de('1', pagina('', '')), de('3', pagina('<a>AI Security</a>', '')));
  assert.deepStrictEqual([menu.estado, menu.mas, menu.menos], ['TEXTO', ['AI Security'], []]);
  // Un modelo nuevo en la lista: su línea, entera.
  const modelo = clasificar(de('1', pagina('', '')), de('4', pagina('', '<li>FWF-50G-5G-II</li>')));
  assert.deepStrictEqual(modelo.mas, ['FWF-50G-5G-II']);
  assert.deepStrictEqual(lineasDeHtml('<td>A&amp;B&nbsp;1</td><td>x</td>'), ['A&B 1', 'x']);
});

test('la copia anterior: la más reciente de otra rama, nunca posterior a la que se compara', () => {
  const c = [
    { rama: 'fuente/pqc-2026-10-27', fecha: 100, ruta: 'f/a.pdf', blob: 'x' },
    { rama: 'fuente/pqc-4-2026-10-28', fecha: 200, ruta: 'f/a.pdf', blob: 'y' },
    { rama: 'fuente/hoy', fecha: 300, ruta: 'f/a.pdf', blob: 'z' },
    { rama: 'fuente/manana', fecha: 400, ruta: 'f/a.pdf', blob: 'w' },
  ];
  assert.strictEqual(elegirAnterior(c, 'fuente/hoy', 300).rama, 'fuente/pqc-4-2026-10-28');
  assert.strictEqual(elegirAnterior(c, 'fuente/pqc-2026-10-27', 100), null);
  assert.strictEqual(elegirAnterior([], 'fuente/hoy', 300), null);
});

test('los argumentos y lo que se pinta: un TEXTO siempre con sus líneas, y dice cuántas calla', () => {
  const o = argumentos(['origin/fuente/x', '--lineas=1', '--buscar=MACsec', '--solo=a.pdf, b.html', '--sin-traer']);
  assert.deepStrictEqual([o.rama, o.lineas, o.traer, [...o.solo]], ['fuente/x', 1, false, ['a.pdf', 'b.html']]);
  assert.throws(() => argumentos([]), /Falta la rama/);
  assert.throws(() => argumentos(['fuente/x', '--aplicar']), /no reconocido/);
  const fila = { nombre: 'nokia-7250ixr-r-ds.pdf', anterior: { rama: 'fuente/pqc-2-2026-10-27', fecha: 1793059200 },
    veredicto: { estado: 'TEXTO', mas: ['• MACsec LAN mode', '• MACsec WAN mode'], menos: [], soloOrden: false }, buscar: { antes: 0, ahora: 2 } };
  const salida = pintar(fila, o);
  assert.match(salida[0], /^TEXTO {5}nokia-7250ixr-r-ds\.pdf {2}\+2 −0 {2}\(anterior: fuente\/pqc-2-2026-10-27, \d{4}-\d\d-\d\d\)$/);
  assert.deepStrictEqual(salida.slice(1), ['    + • MACsec LAN mode', '    + … y 1 más (--lineas=0 las enseña todas)', '    buscar /MACsec/g: antes 0, ahora 2']);
  assert.match(pintar({ nombre: 'x.pdf', anterior: null, veredicto: { estado: 'SIN-TEXTO', motivo: 'no hay pdftotext' } }, o)[0], /sin texto que comparar: no hay pdftotext/);
});

// ── En Actions: el job `comparar` del transporte (2026-11-09) ──────────────────────────────────
const fs = require('fs');
const path = require('path');
const { anotaciones, main, TOPE_AVISOS } = require('../scripts/comparar-fuente');

test('las anotaciones: una línea con el recuento, un aviso por TEXTO o SIN-TEXTO, y lo buscado', () => {
  const ant = { rama: 'fuente/pqc-2-2026-10-27', fecha: 1 };
  const filas = [
    { nombre: 'a.html', anterior: ant, veredicto: { estado: 'IGUAL' }, buscar: { antes: 0, ahora: 0 } },
    { nombre: 'ixr-r.pdf', anterior: ant, veredicto: { estado: 'TEXTO', mas: ['• MACsec LAN mode', '• MACsec WAN mode'], menos: ['x 100%'], soloOrden: false }, buscar: { antes: 0, ahora: 2 } },
    { nombre: 'b.pdf', anterior: ant, veredicto: { estado: 'SIN-TEXTO', motivo: 'no hay pdftotext' }, buscar: { antes: 'sin texto', ahora: 'sin texto' } },
    { nombre: 'c.pdf', anterior: null, veredicto: { estado: 'NUEVO' }, buscar: { antes: 'sin copia', ahora: 3 } },
  ];
  const a = anotaciones(filas, 'fuente/hoy');
  assert.strictEqual(a.length, 3);
  assert.strictEqual(a[0], '::notice title=comparar-fuente::Rama fuente/hoy: 4 documento(s) frente a su copia anterior. '
    + 'IGUAL: 1 · TEXTO: 1 · NUEVO: 1 · SIN-TEXTO: 1. Lo buscado cambia en: ixr-r.pdf (0 → 2), c.pdf (nuevo: 3).');
  assert.strictEqual(a[1], '::warning title=comparar-fuente::ixr-r.pdf: cambia el texto, +2 −1 (anterior: fuente/pqc-2-2026-10-27). '
    + '+ • MACsec LAN mode | + • MACsec WAN mode | − x 100%25');
  assert.match(a[2], /^::warning title=comparar-fuente::b\.pdf: bytes distintos y sin texto que comparar .*no hay pdftotext\. No es «sin cambios»\.$/);
  // Sin --buscar no se dice nada de lo buscado; y todo igual es una sola línea.
  assert.deepStrictEqual(anotaciones([{ nombre: 'a', anterior: ant, veredicto: { estado: 'IGUAL' }, buscar: null }], 'fuente/x'),
    ['::notice title=comparar-fuente::Rama fuente/x: 1 documento(s) frente a su copia anterior. IGUAL: 1.']);
  // Más avisos que el tope: el resto, juntos en uno.
  const muchos = Array.from({ length: TOPE_AVISOS + 3 }, (_, i) => ({ nombre: `d${i}.pdf`, anterior: ant, veredicto: { estado: 'TEXTO', mas: ['x'], menos: [], soloOrden: false } }));
  const m = anotaciones(muchos, 'fuente/x');
  assert.strictEqual(m.length, 1 + TOPE_AVISOS + 1);
  assert.match(m[m.length - 1], /Y 3 más con cambios o sin leer: d9\.pdf \(TEXTO\), d10\.pdf \(TEXTO\), d11\.pdf \(TEXTO\)/);
});

test('con --anotaciones nunca sale distinto de 0, y lo que falla se dice en un aviso', async () => {
  const lineas = [];
  const log = console.log; const err = console.error;
  console.log = (t) => lineas.push(String(t)); console.error = () => {};
  try {
    assert.strictEqual(await main(['fuente/rama-que-no-existe-jamas', '--sin-traer', '--anotaciones'], {}), 0);
    assert.strictEqual(await main(['fuente/x', '--sin-traer', '--anotaciones', '--buscar=('], {}), 0, 'una expresión mal escrita tampoco');
    assert.strictEqual(await main(['fuente/rama-que-no-existe-jamas', '--sin-traer'], {}), 2, 'a mano sí dice que falló');
  } finally { console.log = log; console.error = err; }
  assert.strictEqual(lineas.filter((l) => /^::warning title=comparar-fuente::La comparación no se pudo hacer/.test(l)).length, 2);
});

const DIR_WF = path.join(__dirname, '..', '.github', 'workflows');
const sinComentarios = (f) => fs.readFileSync(path.join(DIR_WF, f), 'utf8').replace(/^\s*#.*\n/gm, '');
const TRANSPORTES = ['traer-cisco-huawei.yml', 'traer-fortinet-pendientes.yml', 'traer-fortinet-matrix.yml', 'traer-juniper-matrix.yml'];

test('el workflow comparar-fuente: reutilizable, sin escritura, sin token guardado y sin scripts de instalación', () => {
  const yml = sinComentarios('comparar-fuente.yml');
  assert.match(yml, /on:\n {2}workflow_call:\n/, 'se llama desde otro workflow');
  assert.match(yml, /rama:\n(?: {8}[^\n]*\n)*? {8}required: true/, 'la rama es obligatoria');
  assert.match(yml, /permissions:\n {2}contents: read\n/);
  assert.ok(!/: write/.test(yml), 'sin escritura');
  assert.match(yml, /persist-credentials: false/);
  assert.match(yml, /fetch-depth: 0/, 'todas las ramas: la copia anterior vive en otra');
  assert.deepStrictEqual(yml.match(/npm (?:ci|install)[^\n]*/g), ['npm ci --ignore-scripts']);
  // La rama y lo buscado llegan por el entorno, nunca interpolados en el script.
  assert.ok(!/run:[^\n]*\$\{\{|^\s+(?:node|\[\[|if)[^\n]*\$\{\{/m.test(yml), 'ninguna entrada interpolada en bash');
  assert.match(yml, /node scripts\/comparar-fuente\.js "\$RAMA" --sin-traer --anotaciones "--buscar=\$BUSCAR"/);
  assert.match(yml, /node scripts\/comparar-fuente\.js "\$RAMA" --sin-traer --anotaciones\n/);
  assert.ok(!/continue-on-error/.test(yml), 'no hace falta: el script sale siempre con 0');
});

test('los cuatro transportes llaman al mismo workflow, aparte del job que empuja y con solo lectura', () => {
  for (const f of TRANSPORTES) {
    const yml = sinComentarios(f);
    const [traer, comparar] = [yml.slice(yml.indexOf('\n  traer:\n'), yml.indexOf('\n  comparar:\n')), yml.slice(yml.indexOf('\n  comparar:\n'))];
    assert.ok(comparar.length > 20, `${f}: existe el job comparar`);
    // El que empuja no instala nada ni corre la comparación (lee documentos de fuera).
    assert.ok(!/npm (?:ci|install)|npx |comparar-fuente/.test(traer), `${f}: el job que empuja no compara`);
    assert.match(comparar, /needs: traer\n/, f);
    assert.match(comparar, /permissions:\n {6}contents: read\n/, `${f}: el job pide solo lectura`);
    assert.ok(!/: write/.test(comparar), `${f}: sin escritura`);
    assert.match(comparar, /uses: \.\/\.github\/workflows\/comparar-fuente\.yml\n/, f);
    assert.ok(!/run:|steps:/.test(comparar), `${f}: la llamada no lleva pasos propios`);
    assert.strictEqual((yml.match(/comparar-fuente\.yml/g) || []).length, 1, `${f}: una sola llamada`);
  }
  // La rama que se compara es la que el transporte empujó, en cada uno:
  assert.match(sinComentarios('traer-cisco-huawei.yml'), /rama: \$\{\{ inputs\.rama \}\}/);
  for (const f of TRANSPORTES.slice(1)) {
    const yml = sinComentarios(f);
    // el job que empuja publica la rama que crea (la salida del paso `rama`) y la llamada la lee
    assert.match(yml, /outputs:\n {6}rama: \$\{\{ steps\.rama\.outputs\.rama \}\}\n/, `${f}: traer expone la rama`);
    assert.match(yml, /echo "rama=\$rama" >> "\$GITHUB_OUTPUT"/, `${f}: el paso escribe la salida`);
    assert.match(yml, /rama: \$\{\{ needs\.traer\.outputs\.rama \}\}/, `${f}: compara la rama que empujó`);
    // si no se empujó ninguna, no hay nada que comparar
    assert.match(yml, /if: needs\.traer\.outputs\.rama != ''/, `${f}: sin rama no se llama`);
  }
});

test('una rama sin documentos sale en un aviso, no como «sin cambios»', () => {
  const v = anotaciones([], 'fuente/x');
  assert.strictEqual(v.length, 1);
  assert.match(v[0], /^::warning title=comparar-fuente::Rama fuente\/x: no trae ningún documento que comparar\. No es «sin cambios»/);
});

// Lo destapó la primera corrida real (42693323597, lanzada desde una rama): el traspaso de esa rama,
// que main no tiene, salió contado como documento NUEVO.
test('un documento es lo que puso el commit del transporte, no todo lo que main no tiene', () => {
  const { esDocumento } = require('../scripts/comparar-fuente');
  const enMain = new Map([['README.md', 'x']]);
  const delTransporte = new Set(['fuente-cisco-huawei/a.pdf', 'fuente-cisco-huawei/informe.json']);
  assert.strictEqual(esDocumento('fuente-cisco-huawei/a.pdf', { enMain, delTransporte }), true);
  assert.strictEqual(esDocumento('docs/traspaso/transporte-compara.md', { enMain, delTransporte }), false);
  assert.strictEqual(esDocumento('fuente-cisco-huawei/informe.json', { enMain, delTransporte }), false);
  // Sin el commit a la vista, la regla de main.
  assert.strictEqual(esDocumento('fuente-cisco-huawei/a.pdf', { enMain, delTransporte: null }), true);
  assert.strictEqual(esDocumento('README.md', { enMain, delTransporte: null }), false);
});
