'use strict';
/* EL PANEL DE PERFILES, UN SOLO MÓDULO (2026-10-28, mejora propuesta al cerrar el PR #55, ejecutada
   por encargo del dueño: «ejecuta las mejoras propuestas»).

   Las siete páginas con perfiles llevaban cada una su copia del mismo bloque y ya habían divergido
   (Escape y `role="dialog"` solo en dos, el aviso al guardar en seis). Desde hoy el bloque vive en
   `BOM.montarPerfiles` y cada página declara solo lo suyo. Estas pruebas conducen el módulo con un
   DOM mínimo —guardar, cargar, consolidar, cerrar— y comprueban que ninguna página conserva su copia. */

const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { cargar } = require('./ayuda/navegador');

// Un DOM mínimo: lo justo que usa el módulo. Cada nodo guarda sus manejadores para dispararlos.
let dom;
function nodo(id, extra) {
  const n = { id, value: '', hidden: false, disabled: false, title: '', textContent: '', innerHTML: '', attrs: {}, style: {},
    dataset: {}, enfocado: false, oyentes: {},
    addEventListener(tipo, fn) { (this.oyentes[tipo] = this.oyentes[tipo] || []).push(fn); },
    setAttribute(k, v) { this.attrs[k] = String(v); },
    getAttribute(k) { return this.attrs[k]; },
    focus() { dom.foco = this.id; },
    querySelector: () => null,
    closest: () => null,
    parentNode: null };
  return Object.assign(n, extra || {});
}
function montar(g, opciones) {
  const tit = nodo('', {});
  const ids = ['nombrePerfil', 'perfilSedes', 'btnGuardarPerfil', 'listaPerfiles', 'btnConsolidar', 'modalConsolidado',
    'consolidadoSub', 'consolidadoTabla', 'xlsConsolidadoBtn', 'consolidadoCerrar'];
  dom = { foco: null, nodos: {}, oyentesDoc: {}, insertados: [] };
  for (const id of ids) dom.nodos[id] = nodo(id);
  dom.nodos.modalConsolidado.querySelector = (sel) => (sel === 'h2, h3' ? tit : null);
  dom.nodos.modalConsolidado.hidden = true;
  // La fila del botón de guardar tiene padre: ahí crea el módulo la línea de mensajes si falta.
  const fila = nodo('fila');
  fila.parentNode = { insertBefore: (n) => { dom.insertados.push(n); dom.nodos[n.id] = n; } };
  dom.nodos.btnGuardarPerfil.parentNode = fila;
  g.document.getElementById = (id) => dom.nodos[id] || null;
  g.document.createElement = () => nodo('');
  g.document.addEventListener = (tipo, fn) => { (dom.oyentesDoc[tipo] = dom.oyentesDoc[tipo] || []).push(fn); };
  dom.tit = tit;
  return g.BOM.montarPerfiles(opciones);
}
const disparar = async (n, tipo, ev) => { for (const fn of n.oyentes[tipo] || []) await fn(ev || { target: n }); };
const pulsarLista = (dataset) => disparar(dom.nodos.listaPerfiles, 'click', { target: { closest: () => ({ dataset }) } });
const esperar = () => new Promise((r) => { setTimeout(r, 0); });

const MODELO = { id: 'X-100', eolAnnounced: { lastOrder: '2027-06-30' } };
const FILAS = [{ cat: 'Equipo', desc: 'X-100', sku: 'X-100', qty: 1, unit: 1000 }];

test('montar: la ventana se anuncia como diálogo con su título, y la línea de mensajes existe aunque la página no la traiga', () => {
  const g = cargar('public/js/bom.js');
  montar(g, { vendor: 'cisco', capturar: () => ({}), aplicar: () => {}, equipo: () => null });
  const m = dom.nodos.modalConsolidado;
  assert.strictEqual(m.attrs.role, 'dialog');
  assert.strictEqual(m.attrs['aria-modal'], 'true');
  assert.strictEqual(m.attrs['aria-labelledby'], 'consolidadoTit');
  assert.strictEqual(dom.tit.id, 'consolidadoTit');
  assert.strictEqual(dom.insertados.length, 1, 'crea #perfilMsg');
  assert.strictEqual(dom.nodos.perfilMsg.attrs.role, 'status');
  assert.strictEqual(dom.nodos.btnConsolidar.disabled, true, 'sin perfiles no se consolida');
});

test('guardar: pide nombre y sedes, dice por qué no guarda y guarda el ciclo del equipo', async () => {
  const g = cargar('public/js/bom.js');
  let hayEquipo = false;
  montar(g, { vendor: 'cisco', capturar: () => ({ bw: '500' }), aplicar: () => {},
    equipo: () => (hayEquipo ? { id: MODELO.id, modelo: MODELO, filas: FILAS } : null) });
  await disparar(dom.nodos.btnGuardarPerfil, 'click');
  assert.match(dom.nodos.perfilMsg.textContent, /Pon un nombre y el número de sedes/);
  assert.strictEqual(dom.foco, 'nombrePerfil');
  dom.nodos.nombrePerfil.value = 'Tienda';
  dom.nodos.perfilSedes.value = '40';
  await disparar(dom.nodos.btnGuardarPerfil, 'click');
  assert.match(dom.nodos.perfilMsg.textContent, /No hay un equipo dimensionado/);
  assert.strictEqual(g.BOM.perfiles().length, 0);
  hayEquipo = true;
  await disparar(dom.nodos.btnGuardarPerfil, 'click');
  const [p] = g.BOM.perfiles();
  assert.strictEqual(p.nombre, 'Tienda');
  assert.strictEqual(p.sedes, 40);
  assert.strictEqual(p.vendor, 'cisco');
  assert.strictEqual(JSON.stringify(p.campos), JSON.stringify({ bw: '500' }));
  assert.ok(p.ciclo && p.ciclo.eolAnnounced, 'el perfil guarda el ciclo de su equipo');
  assert.match(dom.nodos.perfilMsg.textContent, /Perfil «Tienda» guardado con 40 sede\(s\)/);
  assert.strictEqual(dom.nodos.nombrePerfil.value, '');
  assert.strictEqual(dom.nodos.btnConsolidar.disabled, false);
  assert.match(dom.nodos.listaPerfiles.innerHTML, /data-perfil-cargar=/);
});

test('cargar aplica los campos y lo dice; eliminar lo quita y repinta', async () => {
  const g = cargar('public/js/bom.js');
  const aplicados = [];
  montar(g, { vendor: 'cisco', capturar: () => ({ bw: '700' }), aplicar: (c) => aplicados.push(c),
    equipo: () => ({ id: MODELO.id, modelo: MODELO, filas: FILAS }) });
  dom.nodos.nombrePerfil.value = 'Oficina';
  dom.nodos.perfilSedes.value = '3';
  await disparar(dom.nodos.btnGuardarPerfil, 'click');
  const id = g.BOM.perfiles()[0].id;
  await pulsarLista({ perfilCargar: id });
  assert.strictEqual(JSON.stringify(aplicados), JSON.stringify([{ bw: '700' }]));
  assert.match(dom.nodos.perfilMsg.textContent, /Perfil «Oficina» cargado/);
  await pulsarLista({ perfilBorrar: id });
  assert.strictEqual(g.BOM.perfiles().length, 0);
  assert.match(dom.nodos.listaPerfiles.innerHTML, /Sin perfiles guardados/);
});

test('consolidar: abre la ventana con el aviso de ciclo y la tabla, lleva las notas y el contexto, y Escape la cierra', async () => {
  const g = cargar('public/js/bom.js');
  g.fetch = async () => { throw new Error('sin red en la prueba'); };
  let antes = 0;
  montar(g, { vendor: 'cisco', capturar: () => ({}), aplicar: () => {},
    modeloPorId: (id) => (id === MODELO.id ? MODELO : null),
    equipo: () => ({ id: MODELO.id, modelo: MODELO, filas: FILAS }),
    antes: async () => { antes++; return true; },
    contexto: () => ({ cliente: 'ACME', referencia: 'P-1' }),
    notas: ['REGLAS (prueba)'],
    extra: (l, meta) => { meta.notas.push('EXTRA'); return '<p id="extra">extra</p>'; } });
  dom.nodos.nombrePerfil.value = 'Tienda';
  dom.nodos.perfilSedes.value = '10';
  await disparar(dom.nodos.btnGuardarPerfil, 'click');
  await disparar(dom.nodos.btnConsolidar, 'click');
  await esperar();
  assert.strictEqual(antes, 2, 'guardar y consolidar pasan por la confirmación de la página');
  assert.strictEqual(dom.nodos.modalConsolidado.hidden, false);
  assert.match(dom.nodos.consolidadoSub.textContent, /Tienda ×10 \(X-100\) — 10 sedes en total/);
  assert.match(dom.nodos.consolidadoTabla.innerHTML, /fin de venta anunciado/i, 'el aviso de ciclo va arriba');
  assert.match(dom.nodos.consolidadoTabla.innerHTML, /<p id="extra">extra<\/p>/);
  assert.strictEqual(dom.foco, 'consolidadoCerrar');
  assert.strictEqual(typeof dom.nodos.xlsConsolidadoBtn.onclick, 'function');
  for (const fn of dom.oyentesDoc.keydown) fn({ key: 'Escape' });
  assert.strictEqual(dom.nodos.modalConsolidado.hidden, true);
  assert.strictEqual(dom.foco, 'btnConsolidar', 'el foco vuelve al botón que la abrió');
});

test('una confirmación negativa no guarda ni consolida', async () => {
  const g = cargar('public/js/bom.js');
  montar(g, { vendor: 'fortinet', capturar: () => ({}), aplicar: () => {}, antes: async () => false,
    equipo: () => ({ id: MODELO.id, modelo: MODELO, filas: FILAS }) });
  dom.nodos.nombrePerfil.value = 'Spoke';
  dom.nodos.perfilSedes.value = '5';
  await disparar(dom.nodos.btnGuardarPerfil, 'click');
  assert.strictEqual(g.BOM.perfiles().length, 0);
});

test('faltan las opciones obligatorias: falla al montar, no en el primer clic', () => {
  const g = cargar('public/js/bom.js');
  assert.throws(() => montar(g, { vendor: 'cisco', capturar: () => ({}) }), /faltan vendor, capturar, aplicar o equipo/);
});

// Las siete páginas montan el módulo y ninguna conserva su copia del bloque.
const PAGINAS = { 'aruba-edgeconnect': 'VENDOR', 'cisco-catalyst8k': 'VENDOR', 'fortinet-fortigate': 'VENDOR',
  'huawei-netengine': 'VENDOR', 'mikrotik-routeros': 'VENDOR', 'juniper-srx': 'VENDOR', 'nokia-7750sr': 'VENDOR' };
test('las siete páginas montan BOM.montarPerfiles y no conservan su propia copia del bloque', () => {
  for (const p of Object.keys(PAGINAS)) {
    const js = fs.readFileSync(path.join(__dirname, '..', 'public', 'js', `dimensionador-${p}.js`), 'utf8');
    assert.match(js, /BOM\.montarPerfiles\(\{\s*vendor: ?VENDOR,/, `${p}: no monta el panel común`);
    assert.match(js, /modeloPorId/, `${p}: sin modeloPorId, el ciclo de sus perfiles no se pone al día`);
    for (const copia of [/BOM\.guardarPerfil\(/, /BOM\.refrescarCicloTodos\(/, /\$\('listaPerfiles'\)\.addEventListener/,
      /\$\('btnConsolidar'\)\.addEventListener/, /\$\('consolidadoCerrar'\)\.addEventListener/, /function pintarPerfiles/]) {
      assert.doesNotMatch(js, copia, `${p}: conserva su copia (${copia})`);
    }
  }
});

test('montar: donde la caja interior ya es el diálogo (MikroTik), no se anida otro encima', () => {
  const g = cargar('public/js/bom.js');
  const caja = nodo('caja');
  caja.attrs = { role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'consolidadoTitulo' };
  montar(g, { vendor: 'mikrotik', capturar: () => ({}), aplicar: () => {}, equipo: () => null });
  // Se monta otra vez con la caja dentro de la ventana, como en su HTML.
  const m = dom.nodos.modalConsolidado;
  m.attrs = {};
  m.querySelector = (sel) => (sel === '[role="dialog"]' ? caja : sel === 'h2, h3' ? dom.tit : null);
  g.BOM.montarPerfiles({ vendor: 'mikrotik', capturar: () => ({}), aplicar: () => {}, equipo: () => null });
  assert.strictEqual(m.attrs.role, undefined, 'la capa de fuera no se anuncia como diálogo');
  assert.strictEqual(caja.attrs.role, 'dialog');
  assert.strictEqual(caja.attrs['aria-labelledby'], 'consolidadoTitulo', 'conserva el título que su HTML declara');
});
