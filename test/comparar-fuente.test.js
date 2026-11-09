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
