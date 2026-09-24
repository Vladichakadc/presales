'use strict';
// `scripts/traer-starlink.js` renderiza starlink.com en Chromium y publica lo que traiga en
// una rama de transporte. La unica pieza cuyo error pasaria EN VERDE es el juicio del texto:
// starlink.com monta la pagina con JavaScript, y su esqueleto responde 200 con cientos de KB
// y ni una especificacion. Estas pruebas fijan que ese esqueleto —y una pagina comercial que
// nombra kits sin traer cifras— se reportan como vacios, nunca como fuente buena.
const test = require('node:test');
const assert = require('node:assert');
const { juzgarTexto, PDFS, PAGINAS } = require('../scripts/traer-starlink.js');

const FICHA = `Starlink Standard Kit specifications
Antenna: Electronic Phased Array. Field of View 110°. Environmental rating IP67.
Dimensions 594 x 383 mm. Weight 2.9 kg. Average power usage 75-100 W.
Operating temperature -30°C to 50°C. Router Gen 3, Wi-Fi 6, tri-band.`
  + ' Coverage details and mounting options follow.'.repeat(4);

test('una ficha real pasa y dice que kit describe', () => {
  const j = juzgarTexto(FICHA);
  assert.strictEqual(j.ok, true, j.motivo);
  assert.deepStrictEqual([...j.kits], ['Standard']);
  assert.ok(j.magnitudes.length >= 4);
});

test('el esqueleto de la aplicacion NO pasa aunque sea largo', () => {
  const esqueleto = 'You need to enable JavaScript to run this app. '.repeat(20);
  const j = juzgarTexto(esqueleto);
  assert.strictEqual(j.ok, false);
  assert.match(j.motivo, /no nombra ningun kit/);
});

test('una pagina comercial que nombra kits sin cifras NO pasa', () => {
  const comercial = ('Starlink Mini and Starlink Performance bring high-speed internet anywhere. '
    + 'Order today and get connected in minutes. ').repeat(6);
  const j = juzgarTexto(comercial);
  assert.strictEqual(j.ok, false);
  assert.match(j.motivo, /magnitudes de ficha/);
});

test('un texto vacio o casi vacio se declara como pagina que no se monto', () => {
  assert.match(juzgarTexto('').motivo, /no se monto/);
  assert.match(juzgarTexto('Loading…').motivo, /no se monto/);
});

test('Flat High Performance no se cuenta ademas como Performance', () => {
  const j = juzgarTexto(FICHA.replace('Starlink Standard Kit', 'Starlink Flat High Performance Kit'));
  assert.deepStrictEqual([...j.kits], ['Flat High Performance']);
});

test('cada documento candidato trae al menos una URL y nombres de archivo distintos', () => {
  const nombres = [...PDFS.map((d) => d.archivo), ...PAGINAS.map((p) => p.archivo)];
  assert.strictEqual(new Set(nombres).size, nombres.length);
  for (const d of PDFS) assert.ok(d.urls.length && d.urls.every((u) => u.startsWith('https://')));
});
