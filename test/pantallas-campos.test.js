'use strict';
// UN CAMPO DECLARADO QUE YA NO EXISTE EN LA PANTALLA.
//
// Cada dimensionador le pasa a `ESTADO.vincular({campos})` la lista de ids cuyo valor viaja en
// el enlace compartido. Si alguien renombra o retira un control y no toca esa lista, el campo
// deja de reponerse y quien abre el enlace ve otro escenario — sin que nada se queje.
//
// POR QUE ESTO ES UNA PRUEBA Y NO SOLO UNA LINEA DEL INVENTARIO. `npm run catalogo` se corre
// cuando alguien se acuerda; `npm run verificar` corre en cada push y Railway lo espera. Los
// dos fallos del 2026-09-13 fueron de esta clase —el refactor de Aruba retiro `#bw` y nadie
// lo cruzo con nada— y ninguna comprobacion automatica miraba la capa de presentacion.
//
// La regla vive en `scripts/catalogo-check.js` y aqui solo se afirma: una sola implementacion,
// como `FICHA.rango()` para el fin de venta.

const test = require('node:test');
const assert = require('node:assert');
const { pantallas } = require('../scripts/catalogo-check');

test('ninguna pantalla declara un campo de escenario que no existe', () => {
  const rotas = pantallas().filter((p) => p.error || p.faltan.length);
  const detalle = rotas.map((p) => (p.error
    ? `${p.pagina}: ${p.error}`
    : `${p.pagina}: ${p.faltan.map((f) => `${f.id} (${f.motivo})`).join('; ')}`)).join('\n');
  assert.strictEqual(rotas.length, 0, `\n${detalle}\n`);
});

test('las ocho paginas de dimensionamiento entran en la comprobacion', () => {
  // Sin esto, un fallo del parser que devolviera una lista vacia dejaria la prueba anterior en
  // verde sin haber mirado nada — el mismo modo de fallo que el conjunto inerte de
  // CISCO_EOL_MODELS, que se comportaba igual que uno que funciona.
  const filas = pantallas();
  assert.strictEqual(filas.length, 8, `se esperaban 8 dimensionadores y se leyeron ${filas.length}`);
  for (const f of filas) {
    assert.ok(f.error || f.campos >= 4, `${f.pagina} declara ${f.campos} campos, sospechosamente pocos`);
  }
});

test('la excepcion de los campos tardios sigue viva, no caducada', () => {
  // `verdict-sel` no esta en ningun HTML a proposito: lo construye `ficha.js`. La excepcion
  // solo vale mientras ese modulo siga creandolo, y eso es lo que se afirma aqui — una
  // excepcion que ya no corresponde a nada taparia un campo roto de verdad.
  const conTardios = pantallas().filter((p) => !p.error && p.tardios.length);
  assert.ok(conTardios.length > 0, 'ninguna pantalla usa la excepcion: o sobra, o dejo de detectarse');
  for (const p of conTardios) {
    assert.ok(p.tardios.includes('verdict-sel'), `${p.pagina} exceptua algo distinto de verdict-sel`);
  }
});
