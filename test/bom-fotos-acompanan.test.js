'use strict';
// «Fotos del equipo» del Excel con los equipos que acompañan al recomendado (2026-11-11, encargo del
// dueño: «todos los gráficos correspondientes»): el FortiExtender del enlace celular viaja detrás del
// FortiGate con SUS figuras. Lo que se afirma es el núcleo puro que decide qué equipos se escriben.
const test = require('node:test');
const assert = require('node:assert');
const { cargar } = require('./ayuda/navegador');

const { BOM } = cargar('public/js/pqc.js', 'public/js/bom.js');
const FG = { modelo: 'FortiGate 70G', origen: 'Fortinet', front: '/img/equipos/fg-70g-front.webp', rear: '/img/equipos/fg-70g-rear.webp', pie: 'ficha' };

test('sin `acompanan`, la hoja es la de siempre: solo el recomendado', () => {
  const eq = BOM.equiposDeFotos(FG);
  assert.strictEqual(eq.length, 1);
  assert.strictEqual(eq[0].modelo, 'FortiGate 70G');
  assert.strictEqual(eq[0].principal, true);
  assert.strictEqual(BOM.equiposDeFotos(null).length, 0);
});

test('el que acompaña va detrás, con su modelo, su pie y sus leyendas, nunca con los del recomendado', () => {
  const fex = { modelo: 'FortiExtender 211G', qty: 1, front: '/img/equipos/fex-211g-front.webp', rear: '/img/equipos/fex-211g-rear.webp',
    pie: 'QuickStart Guide FortiExtender 211G', frontLeyenda: { filas: [[1, 'CONSOLE Port', 'Puerto de consola']] } };
  const eq = BOM.equiposDeFotos({ ...FG, acompanan: [fex] });
  assert.strictEqual(eq.map((x) => x.modelo).join(' | '), 'FortiGate 70G | FortiExtender 211G');
  assert.strictEqual(eq[1].principal, false);
  assert.strictEqual(eq[1].pie, 'QuickStart Guide FortiExtender 211G');
  assert.strictEqual(eq[1].front, '/img/equipos/fex-211g-front.webp');
  assert.strictEqual(eq[0].frontLeyenda, undefined, 'la leyenda del FortiExtender no pasa al FortiGate');
  assert.strictEqual(eq[0].acompanan, undefined);
});

test('uno sin modelo o sin ninguna cara no se escribe', () => {
  const eq = BOM.equiposDeFotos({ ...FG, acompanan: [{ modelo: 'FortiExtender X' }, { front: '/a.webp' }, null, { modelo: 'FortiExtender 201F', rear: '/img/equipos/fex-201f-rear.webp' }] });
  assert.strictEqual(eq.map((x) => x.modelo).join(' | '), 'FortiGate 70G | FortiExtender 201F');
});

test('la página de Fortinet pasa el FortiExtender del BOM a `acompanan`', () => {
  const js = require('fs').readFileSync(require('path').join(__dirname, '..', 'public', 'js', 'dimensionador-fortinet-fortigate.js'), 'utf8');
  assert.match(js, /acompanan: fotosExtender\(r\)/);
  assert.match(js, /function fotosExtender\(r\)/);
});
