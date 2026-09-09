'use strict';
// Carga un modulo de public/js/ en Node para poder probarlo.
//
// POR QUE ASI Y NO CON UN DOM DE VERDAD. Los scripts de public/ son IIFE que cuelgan su API
// de `window` porque no hay build ni modulos: en el navegador se cargan con <script>. Traer
// jsdom por probar tres funciones puras seria una dependencia grande para nada — lo que se
// prueba aqui (la regla de fin de venta, el orden de una columna, el casado de nombres) no
// toca el DOM. El doble de `document` existe solo para que el fichero termine de cargarse.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function documentoFalso() {
  const nodo = () => ({
    style: {}, dataset: {}, classList: { add() {}, remove() {}, contains: () => false },
    children: [], appendChild() {}, setAttribute() {}, addEventListener() {},
    querySelector: () => null, querySelectorAll: () => [],
  });
  return {
    readyState: 'complete',
    head: nodo(),
    body: nodo(),
    createElement: nodo,
    addEventListener() {},
    querySelector: () => null,
    querySelectorAll: () => [],
    getElementById: () => null,
  };
}

// Devuelve el objeto global tras ejecutar los ficheros indicados, en orden.
function cargar(...relativos) {
  const global = {};
  global.window = global;
  global.document = documentoFalso();
  global.console = console;
  global.setTimeout = setTimeout;
  global.CSS = { escape: (s) => String(s) };
  global.MutationObserver = class { observe() {} disconnect() {} };
  // localStorage y location: los usa bom.js para guardar las referencias anadidas a mano, que
  // viven por pagina. Un doble en memoria basta — lo que se prueba es la regla (sumar cantidad
  // en vez de duplicar linea, quitar por clave), no el almacenamiento del navegador.
  const almacen = new Map();
  global.localStorage = {
    getItem: (k) => (almacen.has(k) ? almacen.get(k) : null),
    setItem: (k, v) => almacen.set(k, String(v)),
    removeItem: (k) => almacen.delete(k),
    clear: () => almacen.clear(),
  };
  global.location = { pathname: '/prueba.html', href: '' };
  const ctx = vm.createContext(global);
  for (const rel of relativos) {
    const archivo = path.join(__dirname, '..', '..', rel);
    vm.runInContext(fs.readFileSync(archivo, 'utf8'), ctx, { filename: rel });
  }
  return global;
}

// Directorio de estado limpio para las pruebas que tocan usuarios.js / auth.js. Hay que
// llamarlo ANTES de requerir esos modulos: leen AUTH_STATE_DIR al cargarse.
function estadoLimpio(nombre) {
  const dir = fs.mkdtempSync(path.join(require('os').tmpdir(), `presales-${nombre}-`));
  process.env.AUTH_STATE_DIR = dir;
  return dir;
}

module.exports = { cargar, estadoLimpio };
