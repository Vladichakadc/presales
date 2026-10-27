'use strict';
// Lista los temas en curso: cada rama remota que lleva un docs/traspaso/<tema>.md.
//
// POR QUE. Varias sesiones de Claude, a veces desde cuentas distintas, trabajan este repositorio a
// la vez, y ninguna ve el contenedor de otra: lo único compartido es GitHub. Antes de tomar un
// tema hay que saber cuáles ya tienen rama y qué archivos declaran tocar (docs/traspaso/README.md).
// Solo lee: no cambia de rama ni escribe nada.
//
// Uso: npm run traspasos [-- --sin-fetch]
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
  const refs = git(['for-each-ref', '--sort=-committerdate',
    '--format=%(refname:short)\t%(committerdate:iso8601)', 'refs/remotes/origin'])
    .split('\n').filter(Boolean).map((l) => l.split('\t'))
    .filter(([ref]) => ref !== 'origin/HEAD' && ref !== 'origin');

  let temas = 0;
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
      const cab = leerCabecera(git(['show', `${ref}:${ruta}`]));
      temas += 1;
      console.log(`\n${ref}  (último commit ${fecha})${enMain ? '  << en main: borrar al fusionar' : ''}`);
      console.log(`  ${ruta}`);
      for (const campo of CAMPOS) {
        console.log(`  ${campo}: ${campo in cab ? cab[campo] : '(no consta)'}`);
      }
    }
  }
  if (temas === 0) console.log('Ningún tema en curso: ninguna rama remota lleva un traspaso.');
  else console.log(`\n${temas} tema(s) en curso. No tomes un tema ni un archivo que ya declaren.`);
}

if (require.main === module) main(process.argv.slice(2));

module.exports = { leerCabecera, archivosDeTema, CAMPOS };
