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
//                          [--siguiente "…"] [--aunque <rama>]… [--propuesta <N>]… [--comprobar] [--sin-fetch] [--en-esta-rama]
//   --propuesta   el tema sale de la mejora propuesta al cerrar el PR #N: va al Tema del traspaso y se avisa si
//                 otro tema en curso cita la misma (también la cita «propuesta al cerrar el PR #N» de --descripcion).
//   --comprobar   solo dice si hay choque; no crea nada.
//   --en-esta-rama  el traspaso va en un commit de la rama actual, no en claude/<tema>: para la sesión que
//                 trabaja en una rama fija (las de la nube la traen asignada). Ver «EN LA RAMA DE LA SESIÓN».
//   --aunque      no cuenta los archivos de esa rama (una rama parada cuyo tema ya está en main);
//                 se dice en el traspaso, para que quede constancia de a quién se pasó por alto.
// Sale con 0 si reservó (o si --comprobar no ve choque), 1 si hay choque y 2 si falla otra cosa.
const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { leerCabecera, archivosDeTema, prsSinTraspaso, repoDeOrigen, RAMA_NO_TEMA, cerradoEnMain, borradoEnMain } = require('./traspasos');

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

// EN LA RAMA DE LA SESIÓN (2026-11-03, mejora propuesta al cerrar el PR #129). Una sesión que trabaja en
// una rama fija dejaba, al reservar, una rama `claude/<tema>` de sobra que declaraba los mismos archivos
// que la suya y que a veces no podía borrar (el proxy de git dio 403 al borrar claude/visibles-contra-main).
// Con --en-esta-rama el traspaso va en un commit de la rama actual. Lo que se pierde es el arbitraje de
// GitHub, que se negaba a crear una rama que ya existe: empujar a la rama propia siempre funciona. Por eso,
// tras empujar se vuelve a mirar, y si otra rama declaró lo mismo MANDA LA RESERVA MÁS ANTIGUA (la fecha
// del commit que añadió cada traspaso; a igual segundo, el nombre de la rama). Las dos sesiones hacen la
// misma cuenta y llegan a lo mismo: la que pierde retira su traspaso con otro commit y sale con 1.
function ganaLaReserva(propia, rival) {
  const a = Date.parse(propia.fecha);
  const b = Date.parse(rival.fecha);
  if (Number.isFinite(a) && Number.isFinite(b) && a !== b) return a < b;
  if (!Number.isFinite(b) && Number.isFinite(a)) return false; // sin fecha que comparar, manda lo que ya estaba
  return String(propia.rama) < String(rival.rama);
}

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

// LOS CASOS DE EQUIVALENCIA QUE VIGILAN LO RESERVADO (2026-11-01, mejora propuesta al cerrar el PR #114).
// Desde ese PR, `verificar.yml` vuelve a medir en cada PR los casos de scripts/equivalencias/ cuyo `mide`
// toca el cambio. Quien reserva un archivo vigilado lo sabe desde el primer minuto: qué caso lo mide,
// cómo correrlo en local y cómo declarar un cambio de comportamiento hecho a propósito. El `mide` se lee
// del texto del caso, sin ejecutarlo (cargar un caso carga catálogos enteros). Solo avisa.
const DIR_EQUIVALENCIAS = path.join(RAIZ, 'scripts', 'equivalencias');
function casosQueVigilan(archivos, dir = DIR_EQUIVALENCIAS) {
  let lista;
  try { lista = fs.readdirSync(dir).filter((f) => f.endsWith('.js')).sort(); } catch { return []; }
  const out = [];
  for (const f of lista) {
    const texto = fs.readFileSync(path.join(dir, f), 'utf8');
    const m = /\bmide:\s*\[([^\]]*)\]/.exec(texto);
    if (!m) continue;
    const mide = [...m[1].matchAll(/'([^']+)'|"([^"]+)"/g)].map((x) => x[1] || x[2]);
    const pisa = archivos.filter((a) => mide.some((r) => solapan(a, r)));
    if (pisa.length) out.push({ caso: f.replace(/\.js$/, ''), mide, pisa });
  }
  return out;
}
function avisoEquivalencias(lista) {
  if (!lista.length) return '';
  return ['Lo vigila la medición de equivalencias en cada PR (verificar.yml):',
    ...lista.map((c) => `  ${c.caso} (por ${c.pisa.join(', ')}): npm run equivalencia -- scripts/equivalencias/${c.caso}.js`),
    '  Un cambio de comportamiento hecho a propósito se declara en la descripción del PR:',
    ...lista.map((c) => `    equivalencia-acepta: ${c.caso}: <motivo>`)].join('\n');
}

// LA MISMA MEJORA CON OTRO NOMBRE (2026-11-12, mejora propuesta al cerrar el PR #198). El PR #192 y el #193
// hicieron la misma prueba (cada FortiExtender con su figura), los dos «mejora propuesta al cerrar el PR #185»:
// temas de nombre distinto y archivos distintos, así que ni GitHub ni `choques` vieron nada, y uno se quitó
// en el #198. Lo que los delata es la propuesta que citan. Se leen las de cada tema en curso (su «Tema» y su
// «Encargo del dueño»; en un PR sin traspaso, su título y su descripción) y, si alguna coincide con la de la
// reserva, se avisa con quién. Solo avisa, nunca frena: un tema puede tomar otra parte de la misma propuesta.
const CITA_PROPUESTA = /propuesta\s+(?:al\s+cerrar\s+el|del)\s+PR\s*#(\d+)/gi;
function propuestasCitadas(texto) {
  return [...new Set([...String(texto || '').matchAll(CITA_PROPUESTA)].map((m) => Number(m[1])))].sort((a, b) => a - b);
}
// Del traspaso, solo lo que dice de qué va el tema: la línea «Tema» y la sección «Encargo del dueño». Las
// demás secciones cuentan la historia y citan propuestas viejas de pasada.
function textoDeEncargo(traspaso) {
  const t = String(traspaso || '');
  const tema = (/^- \*\*Tema:\*\* (.*)$/m.exec(t) || [])[1] || '';
  const encargo = (/^## Encargo del dueño\s*$([\s\S]*?)(?=^## |(?![\s\S]))/m.exec(t) || [])[1] || '';
  return `${tema}\n${encargo}`;
}
// Puro: los temas en curso que citan alguna de las propuestas de `propias`. Un traspaso cerrado no cuenta.
function mismaPropuesta(propias, ocupados, { ignorar = [] } = {}) {
  if (!propias.length) return [];
  const out = [];
  for (const o of ocupados || []) {
    if (!o || ignorar.includes(o.origen)) continue;
    if (/^cerrado/i.test(String(o.estado || '').trim())) continue;
    const comunes = (o.propuestas || []).filter((n) => propias.includes(n));
    if (comunes.length) out.push({ ...o, comunes });
  }
  return out;
}
function avisoMismaPropuesta(lista) {
  if (!lista.length) return '';
  return [`AVISO: ${lista.length} tema(s) en curso salen de la misma mejora propuesta:`,
    ...lista.map((c) => `  ${c.origen} — ${c.tema || '(sin tema)'} [${c.estado || 'sin estado'}]: cita ${c.comunes.map((n) => `la propuesta al cerrar el PR #${n}`).join(', ')}`),
    '  Mira su traspaso o su PR antes de escribir código: si hacen lo mismo, retoma ese en vez de duplicarlo (PR #192 y #193).'].join('\n');
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
function traspasoInicial({ tema, rama, descripcion, cuenta, archivos, siguiente, ignoradas = [], fecha, vigilan = [] }) {
  const plantilla = fs.readFileSync(path.join(RAIZ, CARPETA, 'PLANTILLA.md'), 'utf8');
  const cuerpo = plantilla.slice(plantilla.indexOf('## Encargo del dueño'));
  const nota = (ignoradas.length
    ? `\n- Reservado pasando por alto los archivos de ${ignoradas.join(', ')} (\`--aunque\`): rama parada cuyo tema ya está en main.`
    : '')
    + (vigilan.length
      ? `\n- La medición de equivalencias vigila ${vigilan.map((c) => `\`${c.caso}\` (por ${c.pisa.join(', ')})`).join(', ')}: se corre en cada PR; un cambio a propósito se declara con \`equivalencia-acepta: <caso>: <motivo>\`.`
      : '');
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
  const o = { aunque: [], propuesta: [], comprobar: false, sinFetch: false };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    const sig = () => { i += 1; return argv[i]; };
    if (a === '--archivos') o.archivos = sig();
    else if (a === '--descripcion') o.descripcion = sig();
    else if (a === '--cuenta') o.cuenta = sig();
    else if (a === '--siguiente') o.siguiente = sig();
    else if (a === '--aunque') o.aunque.push(String(sig() || '').replace(/^origin\//, ''));
    else if (a === '--propuesta') {
      const n = Number(String(sig() || '').replace(/^#/, ''));
      if (!Number.isInteger(n) || n <= 0) throw new Error('--propuesta pide el número del PR que la propuso (--propuesta 198)');
      o.propuesta.push(n);
    } else if (a === '--comprobar') o.comprobar = true;
    else if (a === '--sin-fetch') o.sinFetch = true;
    else if (a === '--en-esta-rama') o.enEstaRama = true;
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
      const texto = git(['show', `${ref}:${CARPETA}${nombre}`]);
      const cab = leerCabecera(texto);
      const rama = ref.replace(/^origin\//, '');
      // Un tema que main ya cerró (borró este traspaso después del último commit de la rama) no
      // bloquea: su rama es una reserva que nadie borró (`npm run traspasos` lo marca CERRADO EN MAIN).
      const borrado = borradoEnMain(git, `${CARPETA}${nombre}`);
      if (borrado && cerradoEnMain({ borrado: borrado.fecha, ultimoCommitRama: fecha })) continue;
      ramasConTraspaso.push(rama);
      temas.add(nombre.replace(/\.md$/, ''));
      // Cuándo se reservó: el commit que añadió el traspaso (el arbitraje de --en-esta-rama).
      let reservado = null;
      try { reservado = git(['log', '-1', '--diff-filter=A', '--format=%cI', ref, '--', `${CARPETA}${nombre}`]).trim() || null; } catch { reservado = null; }
      ocupados.push({ origen: rama, tema: cab.Tema, estado: cab.Estado, fecha, reservado, archivos: normalizarArchivos(cab['Archivos que toca']),
        propuestas: propuestasCitadas(textoDeEncargo(texto)) });
    }
  }
  let avisoPrs = null;
  try {
    const repo = repoDeOrigen(git(['remote', 'get-url', 'origin']));
    const prs = JSON.parse(gh(['api', `repos/${repo}/pulls?state=open&per_page=50`]));
    const cuerpo = new Map(prs.map((x) => [x.number, `${x.title || ''}\n${x.body || ''}`]));
    for (const p of prsSinTraspaso(prs, ramasConTraspaso).filter((x) => !/^dependabot\//.test(x.rama))) {
      const archivos = JSON.parse(gh(['api', `repos/${repo}/pulls/${p.numero}/files?per_page=100`])).map((f) => f.filename);
      ocupados.push({ origen: p.rama, tema: `PR #${p.numero} «${p.titulo}»`, estado: 'PR abierto', fecha: p.actualizado, archivos,
        propuestas: propuestasCitadas(cuerpo.get(p.numero)) });
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

// LA SEGUNDA MIRADA, TAMBIÉN EN LA RESERVA NORMAL (2026-11-09, mejora propuesta al cerrar el PR #160). Dos
// sesiones con el mismo encargo reservaron la misma mejora con 15 segundos de diferencia (PR #160 y #161):
// cada una miró antes de que la otra empujara y, como los temas tenían nombres distintos, GitHub no arbitró
// nada. Tras empujar se vuelve a mirar, con la misma regla que --en-esta-rama (`ganaLaReserva`): la que
// pierde no borra su rama (borrar ramas remotas lo deniega a veces el proxy de git), la deja CEDIDA: un
// segundo commit, sin --force, que pone su traspaso en «cerrado (cedido…)». `choques` no cuenta un traspaso
// cerrado, así que sus archivos vuelven a estar libres, y `npm run traspasos` enseña por qué.
function cederReserva(rama, ruta, contenido, padre, mensaje) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'reservar-'));
  const env = { ...process.env, GIT_INDEX_FILE: path.join(tmp, 'index') };
  try {
    git(['read-tree', padre], { env });
    const blob = git(['hash-object', '-w', '--stdin'], { input: contenido, stdio: ['pipe', 'pipe', 'pipe'] }).trim();
    git(['update-index', '--add', '--cacheinfo', `100644,${blob},${ruta}`], { env });
    const arbol = git(['write-tree'], { env }).trim();
    const commit = git(['commit-tree', arbol, '-p', padre, '-m', mensaje]).trim();
    git(['push', 'origin', `${commit}:refs/heads/${rama}`]);
    return commit;
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}
// Puro: el traspaso con su estado en «cerrado (cedido…)».
function traspasoCedido(contenido, ganadoras) {
  const texto = `cerrado (cedido: ${ganadoras.join(', ')} reservó lo mismo antes)`;
  return /^- \*\*Estado:\*\* .*$/m.test(contenido)
    ? contenido.replace(/^- \*\*Estado:\*\* .*$/m, `- **Estado:** ${texto}`)
    : `${contenido.trimEnd()}\n- **Estado:** ${texto}\n`;
}

// --en-esta-rama: un commit con el traspaso sobre HEAD, empujado sin --force (si origin/<rama> no es
// antecesor de HEAD, el push se niega). Solo entra ese archivo: el resto del índice y del árbol, lo que la
// sesión tenga a medias, se queda como estaba; la rama local avanza y el archivo queda en el índice y en
// el árbol, así que `git status` no lo ve como cambio.
function commitSobreHead(rama, cambio, mensaje) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'reservar-'));
  const env = { ...process.env, GIT_INDEX_FILE: path.join(tmp, 'index') };
  try {
    const head = git(['rev-parse', 'HEAD']).trim();
    git(['read-tree', head], { env });
    cambio(env);
    const arbol = git(['write-tree'], { env }).trim();
    const commit = git(['commit-tree', arbol, '-p', head, '-m', mensaje]).trim();
    git(['push', 'origin', `${commit}:refs/heads/${rama}`]);
    git(['update-ref', `refs/heads/${rama}`, commit, head]);
    return commit;
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}
function empujarEnEstaRama(rama, ruta, contenido, mensaje) {
  const blob = git(['hash-object', '-w', '--stdin'], { input: contenido, stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  const commit = commitSobreHead(rama, (env) => git(['update-index', '--add', '--cacheinfo', `100644,${blob},${ruta}`], { env }), mensaje);
  git(['update-index', '--add', '--cacheinfo', `100644,${blob},${ruta}`]);
  fs.mkdirSync(path.dirname(path.join(repoGit, ruta)), { recursive: true });
  fs.writeFileSync(path.join(repoGit, ruta), contenido);
  return commit;
}
function retirarEnEstaRama(rama, ruta, mensaje) {
  const commit = commitSobreHead(rama, (env) => git(['update-index', '--force-remove', ruta], { env }), mensaje);
  git(['update-index', '--force-remove', ruta]);
  fs.rmSync(path.join(repoGit, ruta), { force: true });
  return commit;
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
  // La propuesta de la que sale el tema: la que cite la descripción y la de --propuesta, que se añade al Tema
  // del traspaso para que las demás sesiones la lean.
  const propias = [...new Set([...propuestasCitadas(o.descripcion), ...o.propuesta])].sort((a, b) => a - b);
  const sinCitar = o.propuesta.filter((n) => !propuestasCitadas(o.descripcion).includes(n));
  if (sinCitar.length) o.descripcion = `${o.descripcion || o.tema} (${sinCitar.map((n) => `mejora propuesta al cerrar el PR #${n}`).join('; ')})`;
  let rama = `claude/${o.tema}`;
  if (o.enEstaRama) {
    let actual = '';
    try { actual = git(['symbolic-ref', '--short', '-q', 'HEAD']).trim(); } catch { actual = ''; }
    if (!actual || actual === 'main' || RAMA_NO_TEMA.test(`origin/${actual}`)) {
      console.error(`Con --en-esta-rama hace falta estar en la rama de trabajo de la sesión, no en ${actual || 'un HEAD suelto'}.`);
      return 2;
    }
    rama = actual;
    // Una rama, un tema: si ya lleva un traspaso, ese tema sigue abierto aquí.
    const propios = archivosDeTema(git(['ls-tree', '--name-only', 'HEAD', CARPETA]));
    if (propios.length) {
      console.log(`CHOQUE: ${rama} ya lleva el traspaso de ${propios.join(', ')}. Una rama, un tema: ciérralo (se borra al fusionar) antes de reservar otro.`);
      return 1;
    }
  }
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
  if ((existe && !o.enEstaRama) || temas.has(o.tema)) {
    console.log(`CHOQUE: el tema «${o.tema}» ya tiene rama o traspaso en origin. Elige otro nombre o retoma ese (npm run traspasos).`);
    return 1;
  }
  const misma = mismaPropuesta(propias, ocupados, { ignorar: o.aunque });
  if (misma.length) console.log(avisoMismaPropuesta(misma));
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
  const vigilan = casosQueVigilan(archivos);
  if (o.comprobar) {
    console.log(`Libre: ningún tema en curso declara ${archivos.filter((r) => !esComun(r)).join(', ') || 'esos archivos'}.`);
    if (vigilan.length) console.log(avisoEquivalencias(vigilan));
    return 0;
  }
  const ruta = `${CARPETA}${o.tema}.md`;
  const contenido = traspasoInicial({ tema: o.tema, rama, descripcion: o.descripcion, cuenta: o.cuenta, archivos,
    siguiente: o.siguiente, ignoradas: o.aunque, fecha: horaBogota(), vigilan });
  let commit;
  try {
    commit = o.enEstaRama
      ? empujarEnEstaRama(rama, ruta, contenido, `Reserva: ${o.descripcion || o.tema}`)
      : empujarReserva(rama, ruta, contenido, `Reserva: ${o.descripcion || o.tema}`);
  } catch (e) {
    console.log(`CHOQUE o fallo al empujar ${rama}: ${String(e.stderr || e.message).trim().split('\n').slice(-2).join(' ')}`);
    console.log(o.enEstaRama
      ? 'La rama de origin no es antecesora de la local (¿falta un pull?) o el push se denegó: no se reservó nada.'
      : 'Si otra sesión creó la rama a la vez, la reserva es suya: npm run traspasos.');
    return 1;
  }
  // Tras empujar, se vuelve a mirar (en las dos formas): la carrera la decide la reserva más antigua.
  try { git(['fetch', '--prune', '--quiet', 'origin']); } catch { /* se mira con lo que haya */ }
  const propia = { rama, fecha: git(['show', '-s', '--format=%cI', commit]).trim() };
  const despues = ocupadosRemotos().ocupados;
  const rivales = choques(archivos, despues, { ignorar: [...o.aunque, rama] });
  // Quien citó la misma propuesta entre la primera mirada y el push no salió antes: se avisa ahora.
  const yaAvisados = new Set(misma.map((m) => m.origen));
  const nuevasMisma = mismaPropuesta(propias, despues, { ignorar: [...o.aunque, rama] }).filter((m) => !yaAvisados.has(m.origen));
  if (nuevasMisma.length) console.log(avisoMismaPropuesta(nuevasMisma));
  const antes = rivales.filter((r) => !ganaLaReserva(propia, { rama: r.origen, fecha: r.reservado || r.fecha }));
  if (antes.length) {
    const quien = antes.map((r) => r.origen);
    console.log(`CHOQUE tras empujar: ${antes.map((r) => `${r.origen} (${r.pisa.join(', ')})`).join('; ')} reservó lo mismo antes.`);
    if (o.enEstaRama) {
      const retirada = retirarEnEstaRama(rama, ruta, `Retira la reserva de ${o.tema}: ${quien.join(', ')} reservó antes`);
      console.log(`Manda la reserva más antigua: se retiró la de ${rama} (${retirada.slice(0, 7)}).`);
    } else {
      try {
        const cedida = cederReserva(rama, ruta, traspasoCedido(contenido, quien), commit, `Cede la reserva de ${o.tema}: ${quien.join(', ')} reservó antes`);
        console.log(`Manda la reserva más antigua: ${rama} queda cedida (${cedida.slice(0, 7)}); su traspaso dice «cerrado» y no bloquea.`);
      } catch (e) {
        console.log(`Manda la reserva más antigua, pero no se pudo marcar ${rama} como cedida (${String(e.stderr || e.message).trim().split('\n').slice(-1)[0]}): bórrala o ciérrala a mano (git push origin --delete ${rama}).`);
      }
    }
    return 1;
  }
  for (const r of rivales) console.log(`AVISO: ${r.origen} declaró ${r.pisa.join(', ')} después; manda esta reserva, la más antigua.`);
  console.log(`Reservado: ${rama} (${commit.slice(0, 7)}) con ${ruta}.`);
  if (vigilan.length) console.log(avisoEquivalencias(vigilan));
  if (!o.enEstaRama) console.log(`Para trabajar en él: git fetch origin && git switch ${rama}  (o git switch -c ${rama} --track origin/${rama}).`);
  return 0;
}

if (require.main === module) process.exitCode = main(process.argv.slice(2));

module.exports = { main, ocupadosRemotos, propuestasCitadas, textoDeEncargo, mismaPropuesta, avisoMismaPropuesta, ganaLaReserva, traspasoCedido, casosQueVigilan, avisoEquivalencias, normalizarArchivos, solapan, choques, esComun, traspasoInicial, horaBogota, argumentos, diasDesde,
  COMUNES_AL_CIERRE, DIAS_PARADA };
