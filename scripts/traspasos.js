'use strict';
// Lista los temas en curso: cada rama remota que lleva un docs/traspaso/<tema>.md y, aparte, los
// PR abiertos cuya rama no lleva traspaso (2026-10-27, mejora aprobada: dos veces ese día dos
// sesiones hicieron el mismo trabajo porque la otra rama era invisible al listado: una empujaba
// directo a main y otra ya había borrado su traspaso con el PR sin fusionar).
//
// POR QUE. Varias sesiones de Claude, a veces desde cuentas distintas, trabajan este repositorio a
// la vez, y ninguna ve el contenedor de otra: lo único compartido es GitHub. Antes de tomar un
// tema hay que saber cuáles ya tienen rama y qué archivos declaran tocar (docs/traspaso/README.md).
// Solo lee: no cambia de rama ni escribe nada.
//
// Uso: npm run traspasos [-- --sin-fetch] [--sin-prs]
// Los PR se piden a la API de GitHub con `gh`; si no está o no responde, se avisa y el listado de
// ramas sigue valiendo (nunca corta el arranque de la sesión).
const { execFileSync } = require('child_process');
const path = require('path');

const RAIZ = path.join(__dirname, '..');
const CARPETA = 'docs/traspaso/';
const NO_SON_TEMA = new Set(['README.md', 'PLANTILLA.md']);
const CAMPOS = ['Tema', 'Rama', 'Cuenta', 'Estado', 'Actualizado', 'Archivos que toca', 'Siguiente paso'];

// Lee los campos de cabecera («- **Campo:** valor») de un traspaso. Un campo que falta no se
// rellena: queda fuera del objeto y la salida lo dice.
function leerCabecera(texto) {
  const campos = {};
  for (const linea of texto.split('\n')) {
    const m = /^- \*\*([^*]+):\*\*\s*(.*)$/.exec(linea.trim());
    if (m && CAMPOS.includes(m[1]) && !(m[1] in campos)) campos[m[1]] = m[2].trim();
  }
  return campos;
}

// Nombres de archivo de tema dentro de la salida de `git ls-tree --name-only`.
function archivosDeTema(listado) {
  return listado.split('\n').map((s) => s.trim()).filter(Boolean)
    .map((ruta) => ruta.slice(ruta.lastIndexOf('/') + 1))
    .filter((nombre) => nombre.endsWith('.md') && !NO_SON_TEMA.has(nombre));
}

// Ramas que nunca son un tema: las de transporte de documentos (`fuente/*`), que un workflow corta
// desde la rama de un tema y por eso arrastran su traspaso, y las de Dependabot.
const RAMA_NO_TEMA = /^origin\/(fuente|dependabot)\//;

// Los PR abiertos que el listado de traspasos no enseña: los de una rama sin traspaso. Puro, para
// probarlo sin red: `prs` como los da la API (number, title, head.ref, user.login, updated_at).
function prsSinTraspaso(prs, ramasConTraspaso) {
  const con = new Set(ramasConTraspaso);
  return (prs || []).filter((p) => p && p.head && !con.has(p.head.ref))
    .map((p) => ({ numero: p.number, titulo: p.title, rama: p.head.ref, autor: p.user && p.user.login, actualizado: p.updated_at }));
}

// owner/repo del remoto origin (https o ssh, con o sin .git).
function repoDeOrigen(url) {
  const m = /github\.com[/:]([^/]+)\/([^/]+?)(?:\.git)?\/?$/.exec(String(url || '').trim());
  return m ? `${m[1]}/${m[2]}` : null;
}

// RAMAS PARADAS (2026-11-01, mejora propuesta al cerrar el PR #106). Una rama abandonada sigue
// declarando sus archivos y sale igual que un tema vivo: `claude/elegant-pascal-7ymts7` bloqueó 28
// archivos días después de que sus tres temas llegaran a main. Sin commits en más de DIAS_PARADA
// días (la regla de `npm run reservar`) se marca parada, y se dice qué PR que nombra su traspaso ya
// se fusionaron. Solo avisa: decidir que un tema está abandonado es de una persona.
const DIAS_PARADA = 3;
const diasSin = (fecha, ahora = Date.now()) => {
  const t = Date.parse(fecha);
  return Number.isFinite(t) ? (ahora - t) / 86400000 : null;
};
// Los «PR #N» que nombra un traspaso, sin repetir y en orden.
function prsNombrados(texto) {
  return [...new Set((String(texto || '').match(/PR #(\d+)/g) || []).map((m) => Number(m.slice(4))))].sort((a, b) => a - b);
}
// Puro: la marca de una rama. `fusionados` son los números de PR ya fusionados entre los que nombra.
function marcaParada({ rama, fecha, estado, fusionados = [], ahora = Date.now() }) {
  const d = diasSin(fecha, ahora);
  const cerrado = /^cerrado/i.test(String(estado || '').trim());
  if (!cerrado && (d == null || d <= DIAS_PARADA)) return null;
  const partes = [cerrado ? 'CERRADO: su traspaso lo da por terminado' : `PARADA: ${Math.floor(d)} días sin commits`];
  if (fusionados.length) partes.push(`su traspaso nombra PR ya fusionados (${fusionados.map((n) => `#${n}`).join(', ')})`);
  partes.push(cerrado
    ? `ya no bloquea a npm run reservar; se puede borrar (git push origin --delete ${rama})`
    : `si su tema ya está en main, se puede borrar (git push origin --delete ${rama}); mientras, reservar sus archivos pide --aunque ${rama}`);
  return partes.join('; ');
}

function gh(args) {
  return execFileSync('gh', args, { cwd: RAIZ, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 20000 });
}

function git(args) {
  return execFileSync('git', args, { cwd: RAIZ, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

function main(argv) {
  if (!argv.includes('--sin-fetch')) {
    try {
      git(['fetch', '--prune', '--quiet', 'origin']);
    } catch (e) {
      console.error(`No se pudieron traer las ramas (git fetch): ${String(e.stderr || e.message).trim()}`);
      console.error('Se listan las que ya había en local.');
    }
  }
  let salida;
  try {
    salida = git(['for-each-ref', '--sort=-committerdate',
      '--format=%(refname:short)\t%(committerdate:iso8601)', 'refs/remotes/origin']);
  } catch (e) {
    console.error(`No se pudieron leer las ramas remotas (git for-each-ref): ${String(e.stderr || e.message).trim()}`);
    process.exitCode = 1;
    return;
  }
  const refs = salida
    .split('\n').filter(Boolean).map((l) => l.split('\t'))
    .filter(([ref]) => ref !== 'origin/HEAD' && ref !== 'origin' && !RAMA_NO_TEMA.test(ref));

  let temas = 0;
  const ramasConTraspaso = [];
  for (const [ref, fecha] of refs) {
    let listado;
    try {
      listado = git(['ls-tree', '--name-only', ref, CARPETA]);
    } catch {
      continue;
    }
    for (const nombre of archivosDeTema(listado)) {
      const ruta = CARPETA + nombre;
      // En main no vive ningún traspaso: si aparece, alguien olvidó borrarlo al fusionar.
      const enMain = ref === 'origin/main';
      const texto = git(['show', `${ref}:${ruta}`]);
      const cab = leerCabecera(texto);
      temas += 1;
      ramasConTraspaso.push(ref.replace(/^origin\//, ''));
      console.log(`\n${ref}  (último commit ${fecha})${enMain ? '  << en main: borrar al fusionar' : ''}`);
      console.log(`  ${ruta}`);
      for (const campo of CAMPOS) {
        console.log(`  ${campo}: ${campo in cab ? cab[campo] : '(no consta)'}`);
      }
      const rama = ref.replace(/^origin\//, '');
      if (!enMain && (/^cerrado/i.test(String(cab.Estado || '').trim()) || (diasSin(fecha) || 0) > DIAS_PARADA)) {
        console.log(`  >> ${marcaParada({ rama, fecha, estado: cab.Estado, fusionados: fusionadosDe(prsNombrados(texto)) })}`);
      }
    }
  }
  if (temas === 0) console.log('Ningún tema en curso: ninguna rama remota lleva un traspaso.');
  else console.log(`\n${temas} tema(s) en curso. No tomes un tema ni un archivo que ya declaren.`);
  if (!argv.includes('--sin-prs')) listarPrs(ramasConTraspaso);
}

// De los PR nombrados, los ya fusionados (como mucho 10 consultas; sin `gh`, ninguno: la marca se
// queda en los días, que no necesitan red).
function fusionadosDe(numeros) {
  let repo;
  try { repo = repoDeOrigen(git(['remote', 'get-url', 'origin'])); } catch { return []; }
  if (!repo) return [];
  const out = [];
  for (const n of numeros.slice(-10)) {
    try { if (JSON.parse(gh(['api', `repos/${repo}/pulls/${n}`])).merged) out.push(n); } catch { /* sin red: no se dice */ }
  }
  return out;
}

// PR abiertos sin traspaso, con los archivos que tocan (como mucho 10 PR): un tema que ya está
// en un PR es un tema tomado aunque su traspaso se haya borrado.
function listarPrs(ramasConTraspaso) {
  let repo;
  try { repo = repoDeOrigen(git(['remote', 'get-url', 'origin'])); } catch { repo = null; }
  if (!repo) { console.log('\nAVISO: no se pudo saber el repositorio de origin; no se listan los PR abiertos.'); return; }
  let prs;
  try {
    prs = JSON.parse(gh(['api', `repos/${repo}/pulls?state=open&per_page=50`]));
  } catch (e) {
    console.log(`\nAVISO: no se pudieron pedir los PR abiertos a GitHub (${String(e.stderr || e.message).trim().split('\n')[0]}); mira https://github.com/${repo}/pulls antes de tomar un tema.`);
    return;
  }
  const sin = prsSinTraspaso(prs, ramasConTraspaso).filter((p) => !/^dependabot\//.test(p.rama));
  if (!sin.length) { console.log('\nNingún PR abierto sin traspaso.'); return; }
  console.log(`\nPR abiertos sin traspaso (${sin.length}): su tema también está tomado.`);
  for (const p of sin.slice(0, 10)) {
    let archivos = '(no se pudieron leer)';
    try {
      const lista = JSON.parse(gh(['api', `repos/${repo}/pulls/${p.numero}/files?per_page=100`])).map((f) => f.filename);
      archivos = lista.length ? lista.join(', ') : '(ninguno)';
    } catch { /* se dice arriba: no se pudieron leer */ }
    console.log(`\n#${p.numero} «${p.titulo}»  (rama ${p.rama}, ${p.autor || '?'}, actualizado ${p.actualizado || '?'})`);
    console.log(`  Archivos que toca: ${archivos}`);
  }
  if (sin.length > 10) console.log(`\n… y ${sin.length - 10} más: https://github.com/${repo}/pulls`);
}

if (require.main === module) main(process.argv.slice(2));

module.exports = { leerCabecera, archivosDeTema, prsSinTraspaso, repoDeOrigen, RAMA_NO_TEMA, CAMPOS, marcaParada, prsNombrados, DIAS_PARADA };
