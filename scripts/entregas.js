'use strict';
// LAS ENTREGAS, UNA POR ARCHIVO (2026-10-31, mejora aprobada por el dueño al cerrar el PR #92).
//
// POR QUE. Hasta hoy cada entrega se anotaba ARRIBA de PENDIENTES.md («Última revisión», la primera
// línea de *Cerrado recientemente*) y de RELEVO.md («Última actualización», la primera línea de
// *Estado al cerrar esta entrega»). Con varias sesiones fusionando a la vez, dos entregas escribían
// las mismas líneas y cada fusión chocaba: el 2026-10-31 el PR #92 esperó más de una hora entre
// integrar main, repetir CI y volver a chocar porque otra sesión había fusionado entretanto. Un
// archivo nuevo por entrega no choca con nadie: git no tiene nada que mezclar.
//
// QUE ES UNA ENTREGA. `docs/entregas/AAAA-MM-DD-pr-N.md`, con la cabecera
// `# AAAA-MM-DD · PR #N · <título>`, la línea `- **Encargo:** …` y dos secciones: `## Cerrado` (lo que
// antes iba a *Cerrado recientemente*) y `## Estado` (lo que antes iba a *Estado al cerrar esta
// entrega* del relevo, con su «Criterio que conviene conservar» si lo hay). Se nombra por fecha y
// número de PR, como antes: el PR se abre antes del commit de cierre, que ya lleva su número.
//
// Uso: npm run entregas              las 10 más recientes, con su estado
//      npm run entregas -- --todas   todas
//      npm run entregas -- --n=3     las 3 más recientes
// Solo lee. `test/relevo.test.js` usa las mismas funciones para frenar una entrega mal formada.
const fs = require('fs');
const path = require('path');

const CARPETA = path.join(__dirname, '..', 'docs', 'entregas');
const NO_SON_ENTREGA = new Set(['README.md', 'PLANTILLA.md']);
const NOMBRE = /^(\d{4}-\d{2}-\d{2})-pr-(\d+)\.md$/;
const CABECERA = /^# (\d{4}-\d{2}-\d{2}) · PR #(\d+) · (.+)$/;

// Las secciones `## X` de un archivo, con su texto sin las líneas en blanco de los bordes.
function secciones(texto) {
  const out = {};
  let actual = null;
  for (const linea of texto.split('\n')) {
    const m = /^## (.+)$/.exec(linea);
    if (m) { actual = m[1].trim(); out[actual] = []; continue; }
    if (actual) out[actual].push(linea);
  }
  for (const k of Object.keys(out)) out[k] = out[k].join('\n').trim();
  return out;
}

// Lee una entrega. Devuelve sus datos y la lista de problemas: nunca rellena lo que falta.
function leerEntrega(nombre, texto) {
  const problemas = [];
  const n = NOMBRE.exec(nombre);
  if (!n) problemas.push(`el nombre no es AAAA-MM-DD-pr-N.md`);
  const primera = texto.split('\n')[0] || '';
  const c = CABECERA.exec(primera);
  if (!c) problemas.push('la primera línea no es «# AAAA-MM-DD · PR #N · <título>»');
  if (n && c && (n[1] !== c[1] || n[2] !== c[2])) {
    problemas.push(`el nombre dice ${n[1]} · PR #${n[2]} y la cabecera ${c[1]} · PR #${c[2]}`);
  }
  const enc = /^- \*\*Encargo:\*\*\s*(.+)$/m.exec(texto);
  if (!enc) problemas.push('falta «- **Encargo:** …» (quién lo pidió y con qué palabras)');
  const s = secciones(texto);
  for (const k of ['Cerrado', 'Estado']) if (!s[k]) problemas.push(`falta la sección «## ${k}» o está vacía`);
  return {
    archivo: nombre,
    fecha: c ? c[1] : (n ? n[1] : null),
    pr: c ? Number(c[2]) : (n ? Number(n[2]) : null),
    titulo: c ? c[3].trim() : null,
    encargo: enc ? enc[1].trim() : null,
    cerrado: s.Cerrado || null,
    estado: s.Estado || null,
    problemas,
  };
}

// Todas las entregas de la carpeta, de la más reciente a la más vieja (fecha y, a igual fecha, PR).
function leerEntregas(dir = CARPETA) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((f) => f.endsWith('.md') && !NO_SON_ENTREGA.has(f))
    .map((f) => leerEntrega(f, fs.readFileSync(path.join(dir, f), 'utf8')))
    .sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)) || (b.pr || 0) - (a.pr || 0));
}

function resumen(entregas, cuantas) {
  const lista = cuantas ? entregas.slice(0, cuantas) : entregas;
  const L = [];
  if (!entregas.length) return 'No hay entregas en docs/entregas/.';
  L.push(`Entregas registradas en docs/entregas/: ${entregas.length}${lista.length < entregas.length ? ` (se muestran las ${lista.length} más recientes)` : ''}.`);
  for (const e of lista) {
    L.push('');
    L.push(`${e.fecha} · PR #${e.pr} · ${e.titulo || '(sin título)'}`);
    if (e.encargo) L.push(`  Encargo: ${e.encargo}`);
    if (e.estado) for (const l of e.estado.split('\n')) L.push(`  ${l}`);
    for (const p of e.problemas) L.push(`  ! ${p}`);
  }
  // Las mal formadas que quedan fuera de las mostradas también se nombran (2026-11-01, mejora
  // aprobada al cerrar el PR #101): el arranque solo enseña tres, y su aviso saltaba por una entrega
  // rota más vieja sin decir cuál.
  const fuera = entregas.slice(lista.length).filter((e) => e.problemas.length);
  if (fuera.length) {
    L.push('');
    L.push(`Mal formadas fuera de las mostradas (${fuera.length}):`);
    for (const e of fuera) L.push(`  ! ${e.archivo}: ${e.problemas.join('; ')}`);
  }
  return L.join('\n');
}

if (require.main === module) {
  const arg = (n) => { const p = process.argv.find((a) => a.startsWith(`--${n}=`)); return p ? p.slice(n.length + 3) : null; };
  const todas = process.argv.includes('--todas');
  const n = Number(arg('n')) || 10;
  const entregas = leerEntregas();
  console.log(resumen(entregas, todas ? 0 : n));
  process.exitCode = entregas.some((e) => e.problemas.length) ? 1 : 0;
}

module.exports = { leerEntrega, leerEntregas, resumen, secciones, CARPETA, NOMBRE };
