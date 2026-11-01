'use strict';
// LA MEDICIÓN DE EQUIVALENCIA, COMO HERRAMIENTA DEL REPOSITORIO (2026-11-01, mejora propuesta al
// cerrar el PR #100 y pedida por el dueño: «ejecuta Mejoras propuestas»).
//
// POR QUÉ. Los cortes de la fase 3 (sacar el cálculo de una página a un módulo puro) se dan por
// buenos ejecutando la versión de `main` contra la nueva sobre el catálogo real: 30.075 casos en el
// PR #99, 6.355 en el #100. El comparador se escribió a mano cada vez, y el del #100 confundía los
// `Map` de otro contexto con objetos vacíos y daba 3.000 diferencias falsas. Un comparador que no ve
// nada es peor que ninguno: por eso aquí la MUTACIÓN DE CONTROL es obligatoria. Si la versión
// mutada no da ninguna diferencia, la medición falla en vez de dar «equivalente».
//
// USO
//   npm run equivalencia -- scripts/equivalencias/<caso>.js [--ref=origin/main] [--max=5]
// Un caso es un módulo que exporta:
//   nombre                      lo que se mide, en una línea
//   cargar({ desdeRef, actual }) → { viejo, nuevo, mutado }   tres funciones con la misma firma;
//                               `desdeRef(archivos)` y `actual(archivos)` cargan scripts de
//                               public/js/ en un contexto propio (con el doble de navegador de las
//                               pruebas) de la referencia o del árbol de trabajo, y devuelven su global
//   casos()                     la lista de argumentos (cada uno, un array) sobre la que se mide
// Sale con 0 si no hay diferencias y la mutación sí las da; 1 si hay diferencias; 2 si la mutación
// no da ninguna (el comparador no ve) o si falla la carga.
const { execFileSync } = require('child_process');
const path = require('path');
const vm = require('vm');

const RAIZ = path.join(__dirname, '..');

// La forma canónica de un valor, para comparar sin depender del contexto que lo creó: un `Map` de
// otro `vm` no es `instanceof Map` aquí, así que se reconoce por su etiqueta, no por su prototipo.
function canonico(v, vistos = new WeakSet()) {
  if (v === undefined) return { $: 'undefined' };
  if (typeof v === 'number') {
    if (Number.isNaN(v)) return { $: 'NaN' };
    if (Object.is(v, -0)) return { $: '-0' };
    if (!Number.isFinite(v)) return { $: String(v) };
    return v;
  }
  if (typeof v === 'bigint') return { $: 'bigint', v: String(v) };
  if (typeof v === 'function') return { $: 'función' };
  if (typeof v === 'symbol') return { $: 'símbolo', v: String(v.description) };
  if (v === null || typeof v !== 'object') return v;
  if (vistos.has(v)) return { $: 'ciclo' };
  vistos.add(v);
  const etiqueta = Object.prototype.toString.call(v);
  let out;
  if (etiqueta === '[object Map]') {
    out = { $: 'Map', v: [...v.entries()].map(([k, x]) => [canonico(k, vistos), canonico(x, vistos)])
      .sort((a, b) => (JSON.stringify(a[0]) < JSON.stringify(b[0]) ? -1 : 1)) };
  } else if (etiqueta === '[object Set]') {
    out = { $: 'Set', v: [...v].map((x) => canonico(x, vistos)).sort((a, b) => (JSON.stringify(a) < JSON.stringify(b) ? -1 : 1)) };
  } else if (etiqueta === '[object Date]') {
    out = { $: 'Date', v: Number.isNaN(v.getTime()) ? 'inválida' : v.toISOString() };
  } else if (etiqueta === '[object RegExp]') {
    out = { $: 'RegExp', v: String(v) };
  } else if (Array.isArray(v)) {
    out = v.map((x) => canonico(x, vistos));
  } else {
    out = {};
    for (const k of Object.keys(v).sort()) out[k] = canonico(v[k], vistos);
  }
  vistos.delete(v);
  return out;
}
const huella = (v) => JSON.stringify(canonico(v));

// Ejecuta `fn(...args)`; una excepción es un resultado más (dos versiones que fallan igual son iguales).
function ejecutar(fn, args) {
  try { return { ok: canonico(fn(...args)) }; } catch (e) { return { error: `${e && e.name}: ${e && e.message}` }; }
}

// Compara dos funciones sobre los mismos casos. Puro.
function comparar(a, b, casos, { max = 5 } = {}) {
  let diferentes = 0;
  const ejemplos = [];
  for (const args of casos) {
    const ra = JSON.stringify(ejecutar(a, args));
    const rb = JSON.stringify(ejecutar(b, args));
    if (ra !== rb) {
      diferentes += 1;
      if (ejemplos.length < max) ejemplos.push({ args: JSON.stringify(canonico(args)).slice(0, 300), viejo: ra.slice(0, 300), nuevo: rb.slice(0, 300) });
    }
  }
  return { total: casos.length, diferentes, ejemplos };
}

// La medición entera: viejo contra nuevo, y viejo contra mutado como control del comparador.
function medir({ viejo, nuevo, mutado, casos, max }) {
  if (typeof mutado !== 'function') throw new Error('falta la mutación de control: sin ella no se sabe si el comparador ve algo');
  const lista = [...casos];
  if (!lista.length) throw new Error('sin casos no se mide nada');
  const r = comparar(viejo, nuevo, lista, { max });
  const control = comparar(viejo, mutado, lista, { max: 1 });
  return { ...r, control: control.diferentes, valido: control.diferentes > 0 };
}

// Un contexto de navegador con los scripts dados. `leer(rel)` devuelve el código de cada uno.
function contexto(archivos, leer) {
  const { cargarCon } = require('../test/ayuda/navegador');
  const g = cargarCon(null); // ya es un contexto de `vm`, con el doble de navegador de las pruebas
  for (const rel of archivos) vm.runInContext(leer(rel), g, { filename: rel });
  return g;
}
const desdeRef = (ref) => (archivos) => contexto(archivos,
  (rel) => execFileSync('git', ['show', `${ref}:${rel}`], { cwd: RAIZ, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }));
const actual = (archivos) => contexto(archivos, (rel) => require('fs').readFileSync(path.join(RAIZ, rel), 'utf8'));

function main(argv) {
  const ruta = argv.find((a) => !a.startsWith('--'));
  const opt = Object.fromEntries(argv.filter((a) => a.startsWith('--')).map((a) => a.slice(2).split('=')));
  if (!ruta) { console.error('Uso: npm run equivalencia -- scripts/equivalencias/<caso>.js [--ref=origin/main] [--max=5]'); return 2; }
  const ref = opt.ref || 'origin/main';
  let caso; let fns; let casos;
  try {
    caso = require(path.resolve(ruta));
    fns = caso.cargar({ desdeRef: desdeRef(ref), actual });
    casos = caso.casos();
  } catch (e) {
    console.error(`No se pudo cargar el caso: ${e.message}`);
    return 2;
  }
  const r = medir({ ...fns, casos, max: Number(opt.max) || 5 });
  console.log(`${caso.nombre || ruta}\n  ${ref} contra el árbol de trabajo: ${r.total} casos, ${r.diferentes} diferencia(s).`);
  console.log(`  Control: la mutación da ${r.control} diferencia(s)${r.valido ? '' : ' — EL COMPARADOR NO VE: la medición no vale'}.`);
  for (const e of r.ejemplos) console.log(`\n  args   ${e.args}\n  viejo  ${e.viejo}\n  nuevo  ${e.nuevo}`);
  if (!r.valido) return 2;
  return r.diferentes ? 1 : 0;
}

if (require.main === module) process.exitCode = main(process.argv.slice(2));

module.exports = { canonico, huella, comparar, medir, contexto, desdeRef, actual, main };
