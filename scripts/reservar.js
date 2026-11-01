'use strict';
// Reserva un tema ANTES de escribir código (2026-11-01, mejora propuesta al cerrar el PR #63 y
// aprobada por el dueño: «ejecuta pendientes y mejora propuesta»).
//
// POR QUE. `npm run traspasos` dice qué está tomado, pero un tema solo aparece en GitHub con el
// primer push de su rama, y eso suele llegar tras una hora de trabajo. El 2026-10-28 tres sesiones
// miraron el listado, no vieron nada y se pusieron con la misma mejora (PR #60, #62 y #63): una
// sesión entera de trabajo se cerró sin fusionar. Reservar es empujar la rama con su traspaso en el
// primer minuto, y negarse si otra rama ya declara alguno de los archivos.
//
// LA RESERVA LA ARBITRA GITHUB, no este script: la rama se crea con un push SIN --force de un
// commit nuevo sobre origin/main. Si otra sesión creó la misma rama un segundo antes, GitHub
// rechaza el push y aquí se dice. El árbol de trabajo no se toca: el commit se arma con un índice
// temporal, así que se puede reservar con cambios a medio hacer.
//
// Uso:
//   npm run reservar -- <tema> --archivos "ruta, ruta/, …" [--descripcion "…"] [--cuenta "…"]
//                          [--siguiente "…"] [--aunque <rama>]… [--comprobar] [--sin-fetch]
//   --comprobar   solo dice si hay choque; no crea nada.
//   --aunque      no cuenta los archivos de esa rama (una rama parada cuyo tema ya está en main);
//                 se dice en el traspaso, para que quede constancia de a quién se pasó por alto.
// Sale con 0 si reservó (o si --comprobar no ve choque), 1 si hay choque y 2 si falla otra cosa.
const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { leerCabecera, archivosDeTema, prsSinTraspaso, repoDeOrigen, RAMA_NO_TEMA } = require('./traspasos');

const RAIZ = path.join(__dirname, '..');
const CARPETA = 'docs/traspaso/';

// Los archivos que TODAS las sesiones tocan al cerrar su entrega: un choque en ellos no es un choque
// de tema (docs/traspaso/README.md, «solo se tocan al fusionar»), y contarlos impediría trabajar en
// paralelo, que es justo lo que el protocolo permite.
const COMUNES_AL_CIERRE = ['PENDIENTES.md', 'RELEVO.md', 'CLAUDE.md', 'docs/entregas/', 'docs/traspaso/'];

// Una rama sin commits en este tiempo se señala como parada (no se descarta sola: decidir que un
// tema está abandonado es de una persona, con --aunque).
const DIAS_PARADA = 3;

const TEMA_VALIDO = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// «a, b/ (solo el final), c» → ['a', 'b/', 'c']. Lo que va entre paréntesis es una nota del
// traspaso, no parte de la ruta; «(no consta)» o vacío es ninguno.
function normalizarArchivos(texto) {
  return String(texto || '')
    .replace(/\([^)]*\)/g, ' ')
    .split(',')
    .map((s) => s.trim().replace(/^`|`$/g, '').replace(/^\.\//, ''))
    .filter((s) => s && !/\s/.test(s));
}

const esComun = (r) => COMUNES_AL_CIERRE.some((c) => (c.endsWith('/') ? r.startsWith(c) : r === c));

// Dos rutas chocan si son la misma o si una es una carpeta (termina en /) que contiene a la otra.
function solapan(a, b) {
  if (a === b) return true;
  if (a.endsWith('/') && b.startsWith(a)) return true;
  if (b.endsWith('/') && a.startsWith(b)) return true;
  return false;
}

// Puro: los choques de `propios` contra lo declarado por otros. `ocupados` es una lista de
// {origen, archivos, estado, fecha}; un traspaso «cerrado…» no cuenta.
function choques(propios, ocupados, { ignorar = [] } = {}) {
  const mios = propios.filter((r) => !esComun(r));
  const out = [];
  for (const o of ocupados) {
    if (!o || ignorar.includes(o.origen)) continue;
    if (/^cerrado/i.test(String(o.estado || '').trim())) continue;
    const pisa = [];
    for (const m of mios) for (const a of o.archivos || []) if (!esComun(a) && solapan(m, a)) pisa.push(a === m ? m : `${m} ↔ ${a}`);
    if (pisa.length) out.push({ ...o, pisa: [...new Set(pisa)] });
  }
  return out;
}

const diasDesde = (fecha, ahora = Date.now()) => {
  const t = Date.parse(fecha);
  return Number.isFinite(t) ? (ahora - t) / 86400000 : null;
};

// Hora de Bogotá en el formato del traspaso (AAAA-MM-DD HH:MM).
function horaBogota(d = new Date()) {
  const b = new Date(d.getTime() - 5 * 3600000);
  return b.toISOString().slice(0, 16).replace('T', ' ');
}

// El traspaso inicial, de la plantilla: mismos campos, con lo que se sabe al reservar.
function traspasoInicial({ tema, rama, descripcion, cuenta, archivos, siguiente, ignoradas = [], fecha }) {
  const plantilla = fs.readFileSync(path.join(RAIZ, CARPETA, 'PLANTILLA.md'), 'utf8');
  const cuerpo = plantilla.slice(plantilla.indexOf('## Encargo del dueño'));
  const nota = ignoradas.length
    ? `\n- Reservado pasando por alto los archivos de ${ignoradas.join(', ')} (\`--aunque\`): rama parada cuyo tema ya está en main.`
    : '';
  return [
    `# Traspaso: ${tema}`,
    '',
    `- **Tema:** ${descripcion || tema}`,
    `- **Rama:** ${rama}`,
    `- **Cuenta:** ${cuenta || '(no consta)'}`,
    '- **Estado:** reservado',
    `- **Actualizado:** ${fecha}`,
    `- **Archivos que toca:** ${archivos.join(', ')}`,
    `- **Siguiente paso:** ${siguiente || 'empezar: el tema está reservado y todavía no tiene código'}`,
    '',
    cuerpo.replace('## Decisiones y hallazgos\n', `## Decisiones y hallazgos\n${nota}\n`),
  ].join('\n');
}

function argumentos(argv) {
  const o = { aunque: [], comprobar: false, sinFetch: false };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    const sig = () => { i += 1; return argv[i]; };
    if (a === '--archivos') o.archivos = sig();
    else if (a === '--descripcion') o.descripcion = sig();
    else if (a === '--cuenta') o.cuenta = sig();
    else if (a === '--siguiente') o.siguiente = sig();
    else if (a === '--aunque') o.aunque.push(String(sig() || '').replace(/^origin\//, ''));
    else if (a === '--comprobar') o.comprobar = true;
    else if (a === '--sin-fetch') o.sinFetch = true;
    else if (!a.startsWith('--') && !o.tema) o.tema = a;
    else throw new Error(`argumento no reconocido: ${a}`);
  }
  return o;
}

// El repositorio sobre el que se trabaja: este, salvo en las pruebas, que pasan uno de usar y tirar.
let repoGit = RAIZ;
const git = (args, opts = {}) => execFileSync('git', args, { cwd: repoGit, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], ...opts });
let gh = (args) => execFileSync('gh', args, { cwd: repoGit, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 20000 });

// Lo que otros tienen tomado: traspasos de ramas remotas y PR abiertos sin traspaso.
function ocupadosRemotos() {
  const refs = git(['for-each-ref', '--format=%(refname:short)\t%(committerdate:iso8601)', 'refs/remotes/origin'])
    .split('\n').filter(Boolean).map((l) => l.split('\t'))
    .filter(([ref]) => ref !== 'origin/HEAD' && ref !== 'origin' && ref !== 'origin/main' && !RAMA_NO_TEMA.test(ref));
  const ocupados = [];
  const ramasConTraspaso = [];
  const temas = new Set();
  for (const [ref, fecha] of refs) {
    let listado;
    try { listado = git(['ls-tree', '--name-only', ref, CARPETA]); } catch { continue; }
    for (const nombre of archivosDeTema(listado)) {
      const cab = leerCabecera(git(['show', `${ref}:${CARPETA}${nombre}`]));
      const rama = ref.replace(/^origin\//, '');
      ramasConTraspaso.push(rama);
      temas.add(nombre.replace(/\.md$/, ''));
      ocupados.push({ origen: rama, tema: cab.Tema, estado: cab.Estado, fecha, archivos: normalizarArchivos(cab['Archivos que toca']) });
    }
  }
  let avisoPrs = null;
  try {
    const repo = repoDeOrigen(git(['remote', 'get-url', 'origin']));
    const prs = JSON.parse(gh(['api', `repos/${repo}/pulls?state=open&per_page=50`]));
    for (const p of prsSinTraspaso(prs, ramasConTraspaso).filter((x) => !/^dependabot\//.test(x.rama))) {
      const archivos = JSON.parse(gh(['api', `repos/${repo}/pulls/${p.numero}/files?per_page=100`])).map((f) => f.filename);
      ocupados.push({ origen: p.rama, tema: `PR #${p.numero} «${p.titulo}»`, estado: 'PR abierto', fecha: p.actualizado, archivos });
    }
  } catch (e) {
    avisoPrs = `no se pudieron leer los PR abiertos (${String(e.stderr || e.message).trim().split('\n')[0]}): miralos a mano antes de seguir`;
  }
  return { ocupados, temas, avisoPrs };
}

// Crea claude/<tema> en origin con un solo commit (el traspaso) sobre origin/main, sin tocar el
// árbol de trabajo ni el índice de la sesión. Push sin --force: GitHub arbitra la carrera.
function empujarReserva(rama, ruta, contenido, mensaje) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'reservar-'));
  const env = { ...process.env, GIT_INDEX_FILE: path.join(tmp, 'index') };
  try {
    git(['read-tree', 'origin/main'], { env });
    const blob = git(['hash-object', '-w', '--stdin'], { input: contenido, stdio: ['pipe', 'pipe', 'pipe'] }).trim();
    git(['update-index', '--add', '--cacheinfo', `100644,${blob},${ruta}`], { env });
    const arbol = git(['write-tree'], { env }).trim();
    const commit = git(['commit-tree', arbol, '-p', 'origin/main', '-m', mensaje]).trim();
    git(['push', 'origin', `${commit}:refs/heads/${rama}`]);
    return commit;
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

// `opts.raiz` y `opts.gh` existen para probar sin red (test/reservar.test.js).
function main(argv, opts = {}) {
  repoGit = opts.raiz || RAIZ;
  if (opts.gh) gh = opts.gh;
  let o;
  try { o = argumentos(argv); } catch (e) { console.error(e.message); return 2; }
  if (!o.tema || !TEMA_VALIDO.test(o.tema)) {
    console.error('Uso: npm run reservar -- <tema> --archivos "ruta, ruta/, …"  (tema en minúsculas y con guiones)');
    return 2;
  }
  const archivos = normalizarArchivos(o.archivos);
  if (!archivos.length) {
    console.error('Falta --archivos: sin los archivos que el tema va a tocar, la reserva no protege nada.');
    return 2;
  }
  const rama = `claude/${o.tema}`;
  if (!o.sinFetch) {
    try { git(['fetch', '--prune', '--quiet', 'origin']); } catch (e) {
      console.error(`No se pudieron traer las ramas (git fetch): ${String(e.stderr || e.message).trim()}. Sin ellas no se sabe qué está tomado.`);
      return 2;
    }
  }
  const { ocupados, temas, avisoPrs } = ocupadosRemotos();
  if (avisoPrs) console.log(`AVISO: ${avisoPrs}.`);
  let existe = false;
  try { git(['rev-parse', '--verify', '--quiet', `refs/remotes/origin/${rama}`]); existe = true; } catch { existe = false; }
  if (existe || temas.has(o.tema)) {
    console.log(`CHOQUE: el tema «${o.tema}» ya tiene rama o traspaso en origin. Elige otro nombre o retoma ese (npm run traspasos).`);
    return 1;
  }
  const lista = choques(archivos, ocupados, { ignorar: o.aunque });
  if (lista.length) {
    console.log(`CHOQUE: ${lista.length} tema(s) en curso declaran archivos de este:`);
    for (const c of lista) {
      const d = diasDesde(c.fecha);
      const parada = d != null && d > DIAS_PARADA ? `  (sin commits hace ${Math.floor(d)} días: si su tema ya está en main, --aunque ${c.origen})` : '';
      console.log(`\n  ${c.origen} — ${c.tema || '(sin tema)'} [${c.estado || 'sin estado'}]${parada}`);
      console.log(`    ${c.pisa.join(', ')}`);
    }
    console.log('\nNo se reserva: elige otros archivos u otro tema, o espera a que esas ramas se fusionen.');
    return 1;
  }
  const comunes = archivos.filter(esComun);
  if (comunes.length) console.log(`(No cuentan para el choque, se tocan al cerrar: ${comunes.join(', ')}.)`);
  if (o.comprobar) {
    console.log(`Libre: ningún tema en curso declara ${archivos.filter((r) => !esComun(r)).join(', ') || 'esos archivos'}.`);
    return 0;
  }
  const ruta = `${CARPETA}${o.tema}.md`;
  const contenido = traspasoInicial({ tema: o.tema, rama, descripcion: o.descripcion, cuenta: o.cuenta, archivos,
    siguiente: o.siguiente, ignoradas: o.aunque, fecha: horaBogota() });
  let commit;
  try {
    commit = empujarReserva(rama, ruta, contenido, `Reserva: ${o.descripcion || o.tema}`);
  } catch (e) {
    console.log(`CHOQUE o fallo al empujar ${rama}: ${String(e.stderr || e.message).trim().split('\n').slice(-2).join(' ')}`);
    console.log('Si otra sesión creó la rama a la vez, la reserva es suya: npm run traspasos.');
    return 1;
  }
  console.log(`Reservado: ${rama} (${commit.slice(0, 7)}) con ${ruta}.`);
  console.log(`Para trabajar en él: git fetch origin && git switch ${rama}  (o git switch -c ${rama} --track origin/${rama}).`);
  return 0;
}

if (require.main === module) process.exitCode = main(process.argv.slice(2));

module.exports = { main, normalizarArchivos, solapan, choques, esComun, traspasoInicial, horaBogota, argumentos, diasDesde,
  COMUNES_AL_CIERRE, DIAS_PARADA };
