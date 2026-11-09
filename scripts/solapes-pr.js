'use strict';
// SOLAPES DE UN PR CON OTROS TEMAS ABIERTOS (2026-11-06, mejora propuesta al cerrar el PR #144).
//
// POR QUE. `npm run reservar` solo frena a quien lo corre. El 2026-11-06 el PR #142 implementó el
// mismo importador que el PR #143 sin reservar el tema ni dejar traspaso, unos 15 minutos después de
// que el #143 se reservara. Ninguna comprobación lo vio, y el trabajo se hizo dos veces. Este paso
// corre en cada PR (`verificar.yml`, job `solapes`) y cruza los archivos que el PR cambia DE VERDAD
// (no los que declara) con los que tienen tomados los demás: los traspasos de las ramas remotas y
// los PR abiertos sin traspaso. Es la misma lectura de `npm run reservar`
// (`ocupadosRemotos`, `choques`), así que lo que cuenta como choque es lo mismo en los dos sitios.
//
// SOLO AVISA. Sale siempre con 0: Railway espera a los checks de main, y un solape no es un error
// del código. Lo dice como anotación `::warning` en la comprobación y en el resumen del job. Los
// archivos que todas las sesiones tocan al cerrar (RELEVO.md, PENDIENTES.md, CLAUDE.md,
// docs/entregas/, docs/traspaso/) no cuentan (`COMUNES_AL_CIERRE`), y un traspaso «cerrado…» o
// cerrado en main tampoco. Si no puede leer los PR, lo dice y sigue con los traspasos.
//
// Uso (en CI): HEAD_REF=<rama del PR> BASE_REF=main node scripts/solapes-pr.js
// En local: node scripts/solapes-pr.js --base=origin/main --rama=<rama>
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { ocupadosRemotos, choques } = require('./reservar');

const RAIZ = path.join(__dirname, '..');
const git = (args) => execFileSync('git', args, { cwd: RAIZ, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

// Una anotación de GitHub no admite saltos de línea ni «%» sin escapar.
const escaparAnotacion = (s) => String(s).replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A');

/* Puro: los avisos de un PR. `propios` son los archivos que cambia; `ocupados`, lo que tienen
   tomado los demás (la forma de `ocupadosRemotos`); `rama`, la del propio PR, que no cuenta (su
   traspaso declara lo mismo que cambia). */
function avisos({ propios, ocupados, rama }) {
  return choques(propios, ocupados, { ignorar: [rama] }).map((c) => ({
    origen: c.origen,
    tema: c.tema || '(sin tema)',
    estado: c.estado || '(no consta)',
    pisa: c.pisa,
    texto: `Este PR toca ${c.pisa.join(', ')}, que también tiene tomado ${c.tema || c.origen} (rama ${c.origen}, ${c.estado || 'estado no consta'}). `
      + 'Antes de fusionar, mira si es el mismo trabajo: un tema ajeno no se toma (docs/traspaso/README.md).',
  }));
}

function argumento(argv, nombre) {
  const a = argv.find((x) => x.startsWith(`--${nombre}=`));
  return a ? a.slice(nombre.length + 3) : null;
}

function main(argv = process.argv.slice(2), env = process.env) {
  const base = argumento(argv, 'base') || (env.BASE_REF ? `origin/${env.BASE_REF}` : 'origin/main');
  const rama = argumento(argv, 'rama') || env.HEAD_REF || git(['rev-parse', '--abbrev-ref', 'HEAD']).trim();
  const resumen = [];
  const decir = (linea) => { console.log(linea); resumen.push(linea); };

  let propios;
  try {
    propios = git(['diff', '--name-only', `${base}...HEAD`]).split('\n').map((s) => s.trim()).filter(Boolean);
  } catch (e) {
    console.log(`::warning title=solapes::${escaparAnotacion(`No se pudo leer el diff contra ${base}: ${String(e.stderr || e.message).trim().split('\n')[0]}`)}`);
    return 0;
  }
  let lectura;
  try {
    lectura = ocupadosRemotos();
  } catch (e) {
    console.log(`::warning title=solapes::${escaparAnotacion(`No se pudieron leer las ramas remotas: ${String(e.stderr || e.message).trim().split('\n')[0]}`)}`);
    return 0;
  }
  if (lectura.avisoPrs) console.log(`::warning title=solapes::${escaparAnotacion(`Solo se miraron los traspasos: ${lectura.avisoPrs}`)}`);

  const lista = avisos({ propios, ocupados: lectura.ocupados, rama });
  decir(`## Solapes con otros temas abiertos (rama ${rama}, ${propios.length} archivo(s) contra ${base})`);
  if (!lista.length) {
    decir('Ninguno: ningún traspaso ni PR abierto tiene tomado un archivo de este PR (sin contar los de cierre).');
  }
  for (const a of lista) {
    console.log(`::warning title=solapes::${escaparAnotacion(a.texto)}`);
    resumen.push(`- ${a.texto}`);
  }
  if (env.GITHUB_STEP_SUMMARY) {
    try { fs.appendFileSync(env.GITHUB_STEP_SUMMARY, `${resumen.join('\n')}\n`); } catch { /* el resumen es comodidad */ }
  }
  return 0;
}

if (require.main === module) process.exitCode = main();

module.exports = { avisos, escaparAnotacion, main };
