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

/* EN CI (2026-11-01, mejora propuesta al cerrar el PR #113 y aprobada por el dueño). Cada caso declara
   en `mide` los archivos cuyo cambio vuelve a medirlo (rutas o carpetas terminadas en «/»), y compara
   el módulo de la BASE del PR con el del árbol de trabajo. `--todos --base=<ref>` corre los casos que
   el cambio toca: el diff se toma contra la base común (`git merge-base`), así que en local no cuenta
   lo que haya entrado en main desde que se cortó la rama. Un caso cuya función aún no existe en la
   base devuelve `{ sinBase }` desde `cargar` y se salta diciéndolo. Un cambio de comportamiento hecho a
   propósito se acepta con una línea en la descripción del PR (variable PR_BODY en CI):
     equivalencia-acepta: <caso>: <motivo de al menos diez caracteres>
   y aun así se imprimen sus diferencias. Sale con 0 si todo casa o está aceptado, 1 si hay diferencias
   sin aceptar y 2 si un caso no carga o su mutación no se ve. */
const DIR_CASOS = path.join(RAIZ, 'scripts', 'equivalencias');
const git = (args) => execFileSync('git', args, { cwd: RAIZ, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }).trim();

// Las aceptaciones declaradas en un texto (la descripción del PR): { caso: motivo }.
function aceptaciones(texto) {
  const out = {};
  for (const m of String(texto || '').matchAll(/^\s*equivalencia-acepta:\s*([\w-]+)\s*:\s*(.+?)\s*$/gm)) {
    if (m[2].length >= 10) out[m[1]] = m[2];
  }
  return out;
}
const tocaCaso = (mide, cambiados) => (mide || []).some((r) => cambiados.some((c) => (r.endsWith('/') ? c.startsWith(r) : c === r)));

// Mide un caso. Devuelve { estado: 'igual'|'distinto'|'ciego'|'sinBase'|'error', ... }.
function medirCaso(caso, ref, { max = 5 } = {}) {
  let fns; let casos;
  try {
    fns = caso.cargar({ desdeRef: desdeRef(ref), actual, ref });
    if (fns && fns.sinBase) return { estado: 'sinBase', motivo: fns.sinBase };
    casos = caso.casos();
  } catch (e) {
    return { estado: 'error', motivo: e.message };
  }
  const r = medir({ ...fns, casos, max });
  return { ...r, estado: !r.valido ? 'ciego' : r.diferentes ? 'distinto' : 'igual' };
}

function informar(nombre, ref, r) {
  if (r.estado === 'sinBase') { console.log(`${nombre}\n  Sin línea base en ${ref}: ${r.motivo}. No se mide.`); return; }
  if (r.estado === 'error') { console.log(`${nombre}\n  No se pudo cargar el caso: ${r.motivo}`); return; }
  console.log(`${nombre}\n  ${ref} contra el árbol de trabajo: ${r.total} casos, ${r.diferentes} diferencia(s).`);
  console.log(`  Control: la mutación da ${r.control} diferencia(s)${r.valido ? '' : ' — EL COMPARADOR NO VE: la medición no vale'}.`);
  for (const e of r.ejemplos) console.log(`\n  args   ${e.args}\n  viejo  ${e.viejo}\n  nuevo  ${e.nuevo}`);
}

function todos(opt) {
  const base = opt.base || 'origin/main';
  let ref; let cambiados;
  try {
    ref = git(['merge-base', base, 'HEAD']);
    cambiados = git(['diff', '--name-only', ref]).split('\n').filter(Boolean);
  } catch (e) {
    console.error(`No se pudo comparar con ${base}: ${String(e.stderr || e.message).trim()}`);
    return 2;
  }
  const acepta = aceptaciones(opt.prBody != null ? opt.prBody : process.env.PR_BODY);
  const archivos = require('fs').readdirSync(DIR_CASOS).filter((f) => f.endsWith('.js')).sort();
  let rc = 0; let medidos = 0;
  for (const f of archivos) {
    const nombre = f.replace(/\.js$/, '');
    const caso = require(path.join(DIR_CASOS, f));
    if (!Array.isArray(caso.mide) || !caso.mide.length) { console.log(`${nombre}: no declara \`mide\`: no se sabe cuándo medirlo.`); rc = 2; continue; }
    if (!tocaCaso(caso.mide, cambiados)) continue;
    medidos += 1;
    const r = medirCaso(caso, ref, { max: Number(opt.max) || 5 });
    informar(`[${nombre}] ${caso.nombre || ''}`, `la base (${ref.slice(0, 7)})`, r);
    if (r.estado === 'error' || r.estado === 'ciego') rc = 2;
    else if (r.estado === 'distinto') {
      if (acepta[nombre]) console.log(`  Aceptado en el PR: ${acepta[nombre]}`);
      else {
        console.log(`  Si el cambio es a propósito, decláralo en la descripción del PR:\n    equivalencia-acepta: ${nombre}: <motivo>`);
        if (rc === 0) rc = 1;
      }
    }
  }
  console.log(`\n${medidos} caso(s) medidos de ${archivos.length}; archivos cambiados: ${cambiados.length}.`);
  return rc;
}

function main(argv) {
  const opt = Object.fromEntries(argv.filter((a) => a.startsWith('--')).map((a) => { const [k, ...v] = a.slice(2).split('='); return [k, v.length ? v.join('=') : true]; }));
  if (opt.todos) return todos(opt);
  const ruta = argv.find((a) => !a.startsWith('--'));
  if (!ruta) { console.error('Uso: npm run equivalencia -- scripts/equivalencias/<caso>.js [--ref=origin/main] [--max=5]\n   o: npm run equivalencia -- --todos [--base=origin/main]'); return 2; }
  const ref = opt.ref || 'origin/main';
  let caso;
  try { caso = require(path.resolve(ruta)); } catch (e) { console.error(`No se pudo cargar el caso: ${e.message}`); return 2; }
  const r = medirCaso(caso, ref, { max: Number(opt.max) || 5 });
  informar(caso.nombre || ruta, ref, r);
  if (r.estado === 'sinBase') return 0;
  if (r.estado === 'error') return 2;
  if (!r.valido) return 2;
  return r.diferentes ? 1 : 0;
}

if (require.main === module) process.exitCode = main(process.argv.slice(2));

module.exports = { canonico, huella, comparar, medir, contexto, desdeRef, actual, main, todos, aceptaciones, tocaCaso, medirCaso };
