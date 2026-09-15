'use strict';
// PERFILES MULTI-SEDE: UNA SOLA CLAVE PARA LOS SIETE.
//
// Nacieron en `arubaPerfilesV1`, una clave por fabricante. Un perfil multi-sede es POR
// DEFINICION el caso de las 50 sucursales, y un despliegue real de 50 sedes mezcla marcas
// —spokes Fortinet contra un core Nokia, EdgeConnect en sucursal con Catalyst en el
// datacenter—: con una clave por pagina, el consolidado de cada fabricante ignoraba al resto
// en silencio. Es el mismo fallo que `presales-bom-refs:<pathname>` tuvo y se corrigio el
// 2026-09-09, y se arregla ANTES de portar la funcion a los otros siete porque despues cuesta
// siete veces.
//
// LO QUE SE PRUEBA AQUI es la regla del almacen, no el pintado: para eso esta
// `npm run pantallas`, que conduce la pagina de verdad.

const test = require('node:test');
const assert = require('node:assert');
const { cargar, cargarCon } = require('./ayuda/navegador');

const filaEquipo = (desc, qty, unit) => ({ cat: 'Equipo', desc, sku: desc, qty, unit });
const perfil = (nombre, vendor, sedes, filas) => ({ nombre, vendor, sedes, modelo: 'X', filas });

test('un perfil guardado lleva su fabricante y un id propio', () => {
  const g = cargar('public/js/bom.js');
  const p = g.BOM.guardarPerfil(perfil('Tienda', 'aruba', 50, [filaEquipo('EC-10104', 1, 100)]));
  assert.ok(p.id, 'sin id: borrar por posicion es lo que rompe una lista compartida');
  assert.strictEqual(p.vendor, 'aruba');
});

test('cada dimensionador ve solo sus perfiles, porque los campos son de SU formulario', () => {
  // `campos` guarda los ids de CAMPOS_ESCENARIO de esa pagina: aplicar un perfil de Fortinet
  // al formulario de Aruba no significa nada, asi que no se ofrece.
  const g = cargar('public/js/bom.js');
  g.BOM.guardarPerfil(perfil('Sucursal', 'aruba', 10, []));
  g.BOM.guardarPerfil(perfil('Spoke', 'fortinet', 40, []));
  assert.strictEqual(g.BOM.perfilesDe('aruba').length, 1);
  assert.strictEqual(g.BOM.perfilesDe('fortinet').length, 1);
  assert.strictEqual(g.BOM.perfiles().length, 2, 'el almacen es uno solo');
});

test('el consolidado SI cruza fabricantes: es el caso que la pantalla existe para armar', () => {
  const g = cargar('public/js/bom.js');
  const r = g.BOM.consolidar([
    perfil('Sucursal', 'aruba', 10, [filaEquipo('EC-10104', 1, 100)]),
    perfil('Spoke', 'fortinet', 40, [filaEquipo('FG-60F', 1, 50)]),
  ], {});
  assert.strictEqual(r.totalSedes, 50);
  assert.deepStrictEqual([...r.fabricantes].sort(), ['aruba', 'fortinet']);
  const porSku = Object.fromEntries(r.filas.map((f) => [f.sku, f]));
  assert.strictEqual(porSku['EC-10104'].qty, 10);
  assert.strictEqual(porSku['FG-60F'].qty, 40);
  // Cada fila declara su marca: un SKU sin fabricante en una cotizacion multi-marca es el
  // mismo dato inventado que ya se evito al mandar referencias al cotizador.
  assert.strictEqual(porSku['FG-60F'].v, 'fortinet');
});

test('dos fabricantes con el mismo SKU no se funden en una linea', () => {
  // Con una sola lista compartida, agrupar solo por cat+desc+sku mezclaria equipos de marcas
  // distintas en el mismo renglon. Es el motivo por el que la clave de una referencia es
  // `fabricante|sku` y no el sku suelto.
  const g = cargar('public/js/bom.js');
  const r = g.BOM.consolidar([
    perfil('A', 'aruba', 2, [filaEquipo('X100', 1, 10)]),
    perfil('B', 'nokia', 3, [filaEquipo('X100', 1, 10)]),
  ], {});
  assert.strictEqual(r.filas.length, 2, 'se fundieron dos marcas en una sola linea');
});

test('sin reglas declaradas, TODO se multiplica por sedes', () => {
  // El comportamiento por defecto correcto. Las excepciones de Aruba son su modelo comercial
  // y tiene que declararlas la pagina.
  const g = cargar('public/js/bom.js');
  const r = g.BOM.consolidar([
    perfil('T', 'fortinet', 10, [
      filaEquipo('FG-60F', 1, 50),
      { cat: 'Orquestación', desc: 'FortiManager', sku: 'FMG', qty: 1, unit: 900 },
    ]),
  ], {});
  const orq = r.filas.find((f) => f.cat === 'Orquestación');
  assert.strictEqual(orq.qty, 10, 'heredo la semantica de Aruba sin que nadie la declarara');
});

test('las reglas declaradas agregan en pool y dejan lo unico en cantidad 1', () => {
  const g = cargar('public/js/bom.js');
  const r = g.BOM.consolidar([
    perfil('A', 'aruba', 10, [
      { cat: 'Aceleración', desc: 'Boost 100M', sku: 'BOOST', qty: 2, unit: 500 },
      { cat: 'Orquestación', desc: 'Orchestrator', sku: 'ORCH', qty: 1, unit: 9000 },
    ]),
    perfil('B', 'aruba', 5, [
      { cat: 'Aceleración', desc: 'Boost 100M', sku: 'BOOST', qty: 4, unit: 500 },
      { cat: 'Orquestación', desc: 'Orchestrator', sku: 'ORCH', qty: 1, unit: 9000 },
    ]),
  ], { agregadas: ['Aceleración'], unicas: ['Orquestación'] });
  const boost = r.filas.filter((f) => f.cat === 'Aceleración');
  assert.strictEqual(boost.length, 1, 'el pool tiene que colapsar en UNA linea del fabric');
  assert.strictEqual(boost[0].qty, 2 * 10 + 4 * 5);
  const orq = r.filas.filter((f) => f.cat === 'Orquestación');
  assert.strictEqual(orq.length, 1);
  assert.strictEqual(orq[0].qty, 1, 'el Orchestrator va una vez por fabric, no por sede');
});

test('lo guardado bajo la clave vieja se migra y no se pierde', () => {
  // Sin esto, quien ya tuviera perfiles los veria desaparecer al desplegar — exactamente la
  // perdida de datos que este cambio viene a evitar.
  const previo = { arubaPerfilesV1: JSON.stringify([{ nombre: 'Antiguo', sedes: 7, modelo: 'EC-M', filas: [] }]) };
  const g = cargarCon(previo, 'public/js/bom.js');
  const l = g.BOM.perfiles();
  assert.strictEqual(l.length, 1);
  assert.strictEqual(l[0].nombre, 'Antiguo');
  assert.strictEqual(l[0].vendor, 'aruba', 'el perfil migrado tiene que saber de que marca era');
  assert.ok(l[0].id, 'el perfil migrado necesita id para poder borrarse');
  assert.strictEqual(g.localStorage.getItem('arubaPerfilesV1'), null, 'la clave vieja no se borro');
});

test('borrar quita el perfil pedido, no el de al lado', () => {
  // Antes se borraba por indice. En una lista compartida entre fabricantes el indice deja de
  // ser estable en cuanto otro dimensionador guarda algo.
  const g = cargar('public/js/bom.js');
  g.BOM.guardarPerfil(perfil('Uno', 'aruba', 1, []));
  const medio = g.BOM.guardarPerfil(perfil('Dos', 'aruba', 2, []));
  g.BOM.guardarPerfil(perfil('Tres', 'aruba', 3, []));
  g.BOM.quitarPerfil(medio.id);
  // El array vuelve del realm de `vm`, asi que no hereda del mismo `Array` que esta prueba
  // y `deepStrictEqual` lo rechaza por identidad de prototipo aunque el contenido coincida.
  assert.deepStrictEqual([...g.BOM.perfiles().map((p) => p.nombre)], ['Uno', 'Tres']);
});
