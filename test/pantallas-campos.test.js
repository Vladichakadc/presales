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

test('las nueve paginas de dimensionamiento (Starlink con estado propio) entran en la comprobacion', () => {
  // Sin esto, un fallo del parser que devolviera una lista vacia dejaria la prueba anterior en
  // verde sin haber mirado nada — el mismo modo de fallo que el conjunto inerte de
  // CISCO_EOL_MODELS, que se comportaba igual que uno que funciona.
  const filas = pantallas();
  assert.strictEqual(filas.length, 9, `se esperaban 9 dimensionadores y se leyeron ${filas.length}`);
  for (const f of filas) {
    assert.ok(f.error || f.campos === null || f.campos >= 4, `${f.pagina} declara ${f.campos} campos, sospechosamente pocos`);
  }
});

test('las excepciones de campos tardios siguen vivas, no caducadas', () => {
  // Un campo exceptuado no esta en ningun HTML a proposito porque lo construye un modulo
  // compartido: `verdict-sel` lo pinta `ficha.js`, y el simulador de precio neto lo pinta
  // `bom.js` desde el 2026-09-13. La excepcion solo vale mientras ese modulo siga creandolo —
  // `pantallas()` lo comprueba contra el ancla y la degrada a «falta» si caduco, asi que lo
  // que se afirma aqui es que SE USAN y que ninguna se cuela sin estar declarada.
  //
  // Lo que esta prueba NO hace es fijar cuales son: la version anterior exigia que la unica
  // fuera `verdict-sel`, y eso codificaba el estado de ese dia en vez de la regla. Se rompio
  // sola al compartir el simulador, que es un cambio correcto.
  const filas = pantallas().filter((p) => !p.error);
  const enUso = new Set(filas.flatMap((p) => p.tardios));
  assert.ok(enUso.size > 0, 'ninguna pantalla usa la excepcion: o sobra, o dejo de detectarse');
  // Si una excepcion hubiera caducado, su campo estaria en `faltan` y no en `tardios`, asi
  // que ninguna pagina puede tener huecos.
  assert.strictEqual(filas.filter((p) => p.faltan.length).length, 0);
});
