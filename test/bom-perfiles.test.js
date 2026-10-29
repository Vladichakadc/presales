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

// EL CICLO DE VIDA EN EL CONSOLIDADO (2026-10-28, mejora propuesta al cerrar el PR #41). El BOM de
// varias sedes no lleva «Supuestos»: cada perfil guarda el ciclo de su equipo y el consolidado
// avisa, en pantalla y en el Excel. Un perfil guardado antes no trae el dato: «sin dato», nunca
// «vigente».
test('el consolidado avisa del fin de venta de cada perfil y dice cuáles no traen el dato', () => {
  const g = cargar('public/js/bom.js');
  const B = g.BOM;
  const HOY = Date.parse('2026-10-28');
  const c8300 = B.cicloDe({ eolAnnounced: { pid: 'C8300-1N1S-6T', lastOrder: '2027-01-31', sucesor: 'Cisco Secure Router C8375-E-G2', url: 'https://www.cisco.com/x-eol.html' } });
  const lista = [
    { ...perfil('Sucursal', 'cisco', 50, []), modelo: 'Catalyst 8300-1N1S-6T', ciclo: c8300 },
    { ...perfil('Hub', 'cisco', 2, []), modelo: 'Cisco Secure Router C8475-G2', ciclo: null },
    { ...perfil('Tienda vieja', 'aruba', 10, []), modelo: 'EC-10104' },
  ];
  const { avisos, sinDato } = B.cicloDePerfiles(lista, HOY);
  assert.strictEqual(avisos.length, 1, 'solo el perfil con fin de venta avisa; el vigente sin dato de ciclo, no');
  assert.match(avisos[0].texto, /^Perfil «Sucursal» \(50 sede\(s\), Catalyst 8300-1N1S-6T\): el equipo tiene fin de venta anunciado \(último pedido el 2027-01-31\); sucesor según el boletín: Cisco Secure Router C8375-E-G2; boletín: https:\/\/www\.cisco\.com\/x-eol\.html\.$/);
  assert.strictEqual(JSON.stringify(sinDato.map((p) => p.nombre)), '["Tienda vieja"]', 'el perfil guardado antes lo dice, no se da por vigente');
  const html = B.avisoCicloConsolidado(lista);
  assert.match(html, /Ciclo de vida del despliegue/);
  assert.match(html, /Sin dato de ciclo de vida en el perfil «Tienda vieja»/);
  assert.strictEqual(B.avisoCicloConsolidado([{ ...perfil('Hub', 'cisco', 2, []), ciclo: null }]), '', 'sin nada que decir, nada');
});

// Las siete páginas que guardan perfiles. Juniper y Nokia 7750 desde el 2026-10-28 (mejora propuesta
// al cerrar el PR #50): antes un core SRX o un PE 7750 no entraba en el BOM consolidado.
const PAGINAS_CON_PERFILES = ['aruba-edgeconnect', 'cisco-catalyst8k', 'fortinet-fortigate', 'huawei-netengine', 'mikrotik-routeros',
  'juniper-srx', 'nokia-7750sr'];

// EL PANEL ES UN SOLO MÓDULO (2026-10-28, mejora propuesta al cerrar el PR #55): cada página monta
// `BOM.montarPerfiles` y le pasa el ciclo de su equipo; guardar, consolidar y la ventana son de bom.js.
// Una página con su propio `guardarPerfil` o su propio consolidado es la copia que ya divergió.
const leerJs = (nombre) => require('fs').readFileSync(require('path').join(__dirname, '..', 'public', 'js', nombre), 'utf8');

test('las páginas con perfiles montan el panel común y le pasan el ciclo de su equipo', () => {
  for (const p of PAGINAS_CON_PERFILES) {
    const js = leerJs(`dimensionador-${p}.js`);
    assert.match(js, /BOM\.montarPerfiles\(\{/, `${p}: no monta el panel común`);
    assert.match(js, /ciclo: ?BOM\.cicloDe\(/, `${p}: el perfil no guarda el ciclo de su equipo`);
    assert.match(js, /buscar: ?\(id\) ?=> ?(MODELS\.find\(\(x\) ?=> ?x\.id ?=== ?id\)|modeloPorId\(id\))/, `${p}: consolida con la foto vieja del ciclo`);
    for (const copia of [/BOM\.guardarPerfil\(/, /BOM\.refrescarCiclo\(/, /BOM\.avisoCicloConsolidado\(/, /'modalConsolidado'\)\.hidden ?= ?(false|true)/, /\$\('consolidadoCerrar'\)/]) {
      assert.doesNotMatch(js, copia, `${p}: lleva otra vez su copia del panel (${copia})`);
    }
  }
  const bom = leerJs('bom.js');
  assert.match(bom, /sinRefs: true,\s*perfiles: l,/, 'el consolidado no pasa los perfiles al Excel');
  assert.match(bom, /meta\.perfiles = await refrescarCicloTodos\(meta\.perfiles\);/, 'no pone al día los perfiles de otros fabricantes');
  assert.match(bom, /avisoCicloConsolidado\(meta\.perfiles\)/, 'el aviso en pantalla no usa la lista puesta al día');
  assert.match(bom, /if \(m\.sinRefs && Array\.isArray\(m\.perfiles\)\)/, 'el Excel del consolidado no escribe el ciclo');
});

// EL CICLO AL DÍA AL CONSOLIDAR (2026-10-28, mejora propuesta al cerrar el PR #44). La foto que
// guarda el perfil se recalcula con el catálogo de la página que consolida; la de otro fabricante
// se conserva y dice de cuándo es.
test('al consolidar, el ciclo de los perfiles propios se pone al día y el de los ajenos dice su fecha', () => {
  const g = cargar('public/js/bom.js');
  const B = g.BOM;
  const HOY = Date.parse('2026-10-28');
  const CATALOGO = { 'Catalyst 8300-1N1S-6T': { id: 'Catalyst 8300-1N1S-6T', eolAnnounced: { lastOrder: '2027-01-31', sucesor: 'Cisco Secure Router C8375-E-G2' } } };
  const buscar = (id) => CATALOGO[id] || null;
  const lista = [
    // Guardado antes de que entrara el boletín: su foto dice «sin ciclo».
    { ...perfil('Sucursal', 'cisco', 50, []), modelo: 'Catalyst 8300-1N1S-6T', ciclo: null, fecha: '2026-09-01' },
    // Guardado antes de que los perfiles registraran el ciclo: tampoco trae la clave.
    { ...perfil('Oficina', 'cisco', 5, []), modelo: 'Catalyst 8300-1N1S-6T', fecha: '2026-08-01' },
    // De otro fabricante: su catálogo no está cargado aquí.
    { ...perfil('Tienda', 'aruba', 10, []), modelo: 'EC-10104', fecha: '2026-10-01',
      ciclo: B.cicloDe({ eolAnnounced: { lastOrder: '2027-06-30' } }) },
  ];
  const al = B.refrescarCiclo(lista, 'cisco', buscar);
  assert.strictEqual(al[0].cicloAlDia, true);
  assert.strictEqual(al[2].cicloAlDia, false);
  assert.strictEqual(lista[0].ciclo, null, 'no toca lo guardado: devuelve copias');
  const { avisos, sinDato } = B.cicloDePerfiles(al, HOY);
  assert.strictEqual(avisos.length, 3, 'los dos de Cisco, puestos al día, y el de Aruba con su foto');
  assert.match(avisos[0].texto, /Perfil «Sucursal» .*fin de venta anunciado \(último pedido el 2027-01-31\); sucesor según el boletín: Cisco Secure Router C8375-E-G2\.$/);
  assert.match(avisos[1].texto, /^Perfil «Oficina»/, 'el perfil viejo de la página ya no queda «sin dato»');
  assert.match(avisos[2].texto, /; ciclo a fecha de 2026-10-01, sin contrastar con el catálogo de hoy\.$/);
  assert.strictEqual(sinDato.length, 0);
  // Sin catálogo con que contrastar (otra página), el perfil viejo sigue diciendo «sin dato».
  assert.strictEqual(B.cicloDePerfiles(B.refrescarCiclo(lista, 'aruba', () => null), HOY).sinDato.length, 1);
});

// LOS PERFILES DE OTROS FABRICANTES, TAMBIÉN AL DÍA (2026-10-28, mejora propuesta al cerrar el PR
// #46): al consolidar se pide el catálogo de cada fabricante presente; si falla, o ya no trae el
// modelo, el perfil conserva su foto y el aviso dice por qué.
test('al consolidar, los perfiles de otros fabricantes se ponen al día con su catálogo, o dicen por qué no', async () => {
  const g = cargar('public/js/bom.js');
  const B = g.BOM;
  const HOY = Date.parse('2026-10-28');
  const pedidos = [];
  const catalogos = {
    fortinet: [{ id: 'FG-60E', eol: true }, { id: 'FG-70G' }],
  };
  const pedir = async (v) => { pedidos.push(v); if (!catalogos[v]) throw new Error('HTTP 503'); return catalogos[v]; };
  const base = [
    { ...perfil('Core', 'cisco', 1, []), modelo: 'C8500', ciclo: null, cicloAlDia: true },
    { ...perfil('Spoke viejo', 'fortinet', 40, []), modelo: 'FG-60E', ciclo: null, fecha: '2026-09-01', cicloAlDia: false },
    { ...perfil('Spoke nuevo', 'fortinet', 10, []), modelo: 'FG-70G', ciclo: null, cicloAlDia: false },
    { ...perfil('Retirado', 'fortinet', 2, []), modelo: 'FG-30E', ciclo: null, fecha: '2026-08-01', cicloAlDia: false },
    { ...perfil('Tienda', 'aruba', 5, []), modelo: 'EC-10104', fecha: '2026-10-01', cicloAlDia: false,
      ciclo: B.cicloDe({ eolAnnounced: { lastOrder: '2027-06-30' } }) },
  ];
  const al = await B.refrescarCicloTodos(base, pedir);
  assert.strictEqual(JSON.stringify(pedidos.sort()), '["aruba","fortinet"]', 'solo se piden los fabricantes que faltan, una vez cada uno');
  assert.strictEqual(al[0], base[0], 'lo que ya está al día no se toca');
  assert.strictEqual(al[1].cicloAlDia, true);
  assert.strictEqual(al[2].ciclo, null, 'un equipo vigente sin dato de ciclo queda sin aviso');
  assert.match(al[3].cicloError, /el catálogo de fortinet ya no trae el FG-30E/);
  assert.match(al[4].cicloError, /no se pudo leer el catálogo de aruba \(HTTP 503\)/);
  const { avisos } = B.cicloDePerfiles(al, HOY);
  const t = avisos.map((x) => x.texto).join('\n');
  assert.match(t, /Perfil «Spoke viejo» \(40 sede\(s\), FG-60E\): el equipo está fuera de venta\./, 'la foto vieja se corrige con el catálogo de Fortinet');
  assert.match(t, /Perfil «Tienda» .*ciclo a fecha de 2026-10-01, sin contrastar con el catálogo de hoy \(no se pudo leer el catálogo de aruba \(HTTP 503\)\)\./);
});

test('el fabricante del almacenamiento local se valida antes de pedir su catálogo', () => {
  const fs = require('fs');
  const path = require('path');
  const bom = fs.readFileSync(path.join(__dirname, '..', 'public', 'js', 'bom.js'), 'utf8');
  assert.match(bom, /if \(!VENDOR_VALIDO\.test\(v\)\) throw new Error\('fabricante no válido'\);/, 'el fabricante del almacenamiento local se valida antes de la URL');
});

// NOKIA 7750 GUARDA SUS PERFILES COMO `nokia-sr` (2026-10-28). Al consolidar, el ciclo de un perfil de otra
// página se pone al día pidiendo `/api/dimensionador/<fabricante del perfil>`. La de `nokia` es el catálogo
// de la 7220 IXR, donde los 7750 y 7250 no están: con esa clave, cada perfil del 7750 diría «el catálogo
// ya no trae el modelo».
test('Nokia 7750 guarda sus perfiles con la clave de su propia ruta de catálogo', () => {
  const fs = require('fs');
  const path = require('path');
  const js = fs.readFileSync(path.join(__dirname, '..', 'public', 'js', 'dimensionador-nokia-7750sr.js'), 'utf8');
  assert.match(js, /const VENDOR = 'nokia-sr';/);
  assert.match(js, /fetch\('\/api\/dimensionador\/nokia-sr'\)/, 'la página dejó de pedir su catálogo a esa ruta');
  const rutas = fs.readFileSync(path.join(__dirname, '..', 'server', 'routes', 'dimensionador.js'), 'utf8');
  assert.match(rutas, /'nokia-sr': toDimensionadorNokiaRouter/);
  // Los manejadores se montan detrás de la guarda de la página: el motor se carga sin ella en las pruebas.
  assert.match(js, /render\(\);\n {4}montarPerfiles\(\);\n {2}\}/);
});

test('el consolidado nombra al fabricante, no la clave del dimensionador', () => {
  const g = cargar('public/js/bom.js');
  const r = g.BOM.consolidar([perfil('PE', 'nokia-sr', 1, []), perfil('Core', 'juniper', 2, [])], {});
  assert.strictEqual(JSON.stringify(r.fabricantes), '["nokia","juniper"]');
});

// EL MÓDULO, CONDUCIDO (2026-10-28). Un DOM mínimo con los ids que las siete páginas comparten: lo que se
// prueba es lo que antes divergía entre copias (el mensaje al guardar o al no poder, Escape, pinchar
// fuera, el rol de la ventana) y los ganchos de las páginas con algo propio (la puerta de Fortinet).
function domPerfiles() {
  const oyentes = { doc: [] };
  const nodos = {};
  const nodo = (id, extra) => {
    const n = { id, value: '', textContent: '', innerHTML: '', hidden: false, disabled: false, title: '', attrs: {}, dataset: {},
      enfocado: false, onclick: null,
      setAttribute(k, v) { this.attrs[k] = String(v); }, getAttribute(k) { return this.attrs[k] == null ? null : this.attrs[k]; },
      addEventListener(t, fn) { (oyentes[id] = oyentes[id] || []).push([t, fn]); },
      focus() { for (const x of Object.values(nodos)) x.enfocado = false; this.enfocado = true; },
      querySelector: () => null, ...extra };
    nodos[id] = n;
    return n;
  };
  ['nombrePerfil', 'perfilSedes', 'perfilMsg', 'listaPerfiles', 'btnGuardarPerfil', 'btnConsolidar', 'consolidadoSub',
    'consolidadoTabla', 'xlsConsolidadoBtn', 'consolidadoCerrar'].forEach((id) => nodo(id));
  const tit = nodo('tituloModal');
  tit.id = '';
  nodo('modalConsolidado', { hidden: true, querySelector: (sel) => (sel === 'h3' ? tit : null) });
  const doc = { getElementById: (id) => nodos[id] || null, addEventListener: (t, fn) => oyentes.doc.push([t, fn]) };
  const disparar = async (id, tipo, ev) => {
    for (const [t, fn] of (id === 'doc' ? oyentes.doc : oyentes[id] || [])) if (t === tipo) await fn(ev || { target: nodos[id] });
    await new Promise((r) => { setTimeout(r, 0); });
  };
  return { doc, nodos, disparar };
}

function montarConDom(cfgExtra) {
  const g = cargar('public/js/bom.js');
  const d = domPerfiles();
  g.document = d.doc;
  g.fetch = async () => ({ ok: false, status: 503, json: async () => ({}) });
  const cfg = {
    vendor: 'cisco',
    capturar: () => ({ bw: '500' }),
    aplicados: [],
    aplicar(v) { this.aplicados.push(v); },
    equipo: () => ({ modelo: 'C8200-1N-4T', ciclo: null, filas: [filaEquipo('C8200-1N-4T', 1, 1000)] }),
    buscar: () => null,
    notas: ['REGLAS (prueba)'],
    ...cfgExtra,
  };
  const ui = g.BOM.montarPerfiles(cfg);
  ui.pintar();
  return { g, d, cfg, ui };
}

test('montarPerfiles: guardar dice qué falta o qué guardó, y la lista es solo de la página', async () => {
  const { g, d } = montarConDom({ equipo: () => ({ error: 'Sin equipo que guardar.' }) });
  const { nodos, disparar } = d;
  assert.strictEqual(nodos.btnConsolidar.disabled, true, 'sin perfiles, «Consolidar» desactivado');
  await disparar('btnGuardarPerfil', 'click');
  assert.strictEqual(nodos.perfilMsg.textContent, 'Pon un nombre y el número de sedes idénticas.');
  assert.ok(nodos.nombrePerfil.enfocado);
  nodos.nombrePerfil.value = 'Sucursal';
  nodos.perfilSedes.value = '20';
  await disparar('btnGuardarPerfil', 'click');
  assert.strictEqual(nodos.perfilMsg.textContent, 'Sin equipo que guardar.');
  assert.strictEqual(g.BOM.perfiles().length, 0);

  const ok = montarConDom();
  ok.g.BOM.guardarPerfil(perfil('Ajeno', 'aruba', 3, [filaEquipo('EC-10104', 1, 100)]));
  ok.d.nodos.nombrePerfil.value = 'Sucursal';
  ok.d.nodos.perfilSedes.value = '20';
  await ok.d.disparar('btnGuardarPerfil', 'click');
  assert.strictEqual(ok.d.nodos.perfilMsg.textContent, 'Perfil «Sucursal» guardado con 20 sede(s).');
  const [p] = ok.g.BOM.perfilesDe('cisco');
  assert.strictEqual(p.vendor, 'cisco');
  assert.strictEqual(p.ciclo, null, 'el ciclo viaja aunque sea «sin dato»');
  assert.strictEqual(JSON.stringify(p.campos), '{"bw":"500"}');
  assert.match(ok.d.nodos.listaPerfiles.innerHTML, /Sucursal/);
  assert.doesNotMatch(ok.d.nodos.listaPerfiles.innerHTML, /Ajeno/, 'la lista enseña solo los perfiles de la página');
  assert.strictEqual(ok.d.nodos.btnConsolidar.disabled, false);
  assert.strictEqual(ok.d.nodos.nombrePerfil.value, '', 'el formulario se vacía al guardar');

  await ok.d.disparar('listaPerfiles', 'click', { target: { closest: () => ({ dataset: { perfilCargar: p.id } }) } });
  assert.strictEqual(JSON.stringify(ok.cfg.aplicados), '[{"bw":"500"}]');
  assert.strictEqual(ok.d.nodos.perfilMsg.textContent, 'Perfil «Sucursal» cargado.');
  await ok.d.disparar('listaPerfiles', 'click', { target: { closest: () => ({ dataset: { perfilBorrar: p.id } }) } });
  assert.strictEqual(ok.g.BOM.perfilesDe('cisco').length, 0);
  assert.strictEqual(ok.g.BOM.perfiles().length, 1, 'borrar no toca los perfiles de otro fabricante');
});

test('montarPerfiles: el consolidado cruza fabricantes, lo dice y se cierra con Escape o pinchando fuera', async () => {
  const { g, d } = montarConDom({
    avisoMulti: 'Texto propio de la página.',
    extras: () => ({ html: '<p id="extraPagina">extra</p>' }),
  });
  const { nodos, disparar } = d;
  assert.strictEqual(nodos.modalConsolidado.getAttribute('role'), 'dialog');
  assert.strictEqual(nodos.modalConsolidado.getAttribute('aria-modal'), 'true');
  assert.strictEqual(nodos.modalConsolidado.getAttribute('aria-labelledby'), 'consolidadoTit', 'la ventana se nombra por su título');
  g.BOM.guardarPerfil({ ...perfil('Core', 'cisco', 2, [filaEquipo('C8500', 1, 9000)]), modelo: 'C8500', ciclo: null });
  g.BOM.guardarPerfil({ ...perfil('Tienda', 'aruba', 10, [filaEquipo('EC-10104', 1, 100)]), fecha: '2026-10-01',
    ciclo: g.BOM.cicloDe({ eolAnnounced: { lastOrder: '2027-06-30' } }) });
  await disparar('btnConsolidar', 'click');
  assert.strictEqual(nodos.modalConsolidado.hidden, false);
  assert.match(nodos.consolidadoSub.textContent, /12 sedes en total$/);
  assert.match(nodos.consolidadoTabla.innerHTML, /Consolidado <b>multi-fabricante<\/b> \(cisco, aruba\)\. Texto propio de la página\./);
  assert.match(nodos.consolidadoTabla.innerHTML, /id="extraPagina"/, 'lo que añade la página va en la ventana');
  assert.match(nodos.consolidadoTabla.innerHTML, /no se pudo leer el catálogo de aruba/, 'el perfil ajeno sin catálogo dice por qué conserva su foto');
  assert.strictEqual(typeof nodos.xlsConsolidadoBtn.onclick, 'function');
  assert.ok(nodos.consolidadoCerrar.enfocado, 'el foco entra en la ventana');
  await disparar('doc', 'keydown', { key: 'Escape' });
  assert.strictEqual(nodos.modalConsolidado.hidden, true, 'Escape cierra');
  assert.ok(nodos.btnConsolidar.enfocado, 'y el foco vuelve a «Consolidar»');
  await disparar('btnConsolidar', 'click');
  await disparar('modalConsolidado', 'click', { target: nodos.modalConsolidado });
  assert.strictEqual(nodos.modalConsolidado.hidden, true, 'pinchar fuera cierra');
});

test('montarPerfiles: la puerta de la página decide (Fortinet): cancelar no guarda ni consolida', async () => {
  let pintadas = 0;
  const { g, d } = montarConDom({
    equipo: async () => ({ cancelado: true }),
    antesDeConsolidar: async () => false,
    controlaConsolidar: true,
    alPintar: () => { pintadas += 1; },
  });
  const { nodos, disparar } = d;
  assert.ok(pintadas >= 1);
  nodos.btnConsolidar.disabled = true;
  g.BOM.guardarPerfil(perfil('Spoke', 'cisco', 4, [filaEquipo('X', 1, 1)]));
  d.nodos.btnConsolidar.disabled = false;
  nodos.nombrePerfil.value = 'Otro';
  nodos.perfilSedes.value = '1';
  await disparar('btnGuardarPerfil', 'click');
  assert.strictEqual(g.BOM.perfiles().length, 1, 'un «no» de la puerta no guarda');
  assert.strictEqual(nodos.perfilMsg.textContent, '', 'y calla: la puerta ya dijo por qué');
  await disparar('btnConsolidar', 'click');
  assert.strictEqual(nodos.modalConsolidado.hidden, true, 'la puerta cerrada no consolida');
  nodos.btnConsolidar.disabled = true;
  const antes = pintadas;
  await disparar('listaPerfiles', 'click', { target: { closest: () => ({ dataset: { perfilBorrar: g.BOM.perfiles()[0].id } }) } });
  assert.ok(pintadas > antes, 'cada repintado avisa a la página');
  assert.strictEqual(nodos.btnConsolidar.disabled, true, 'con `controlaConsolidar`, el estado del botón es de la página');
});
