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
// LO QUE LEYO, SIEMPRE A LA VISTA (2026-11-09, mejora propuesta al cerrar el PR #145). Desde una sesión
// no se leen los logs de Actions (el proxy los corta), solo las anotaciones: sin solapes, el job no
// dejaba ninguna y no se sabía si había corrido ni sobre qué. Ahora deja UNA línea `::notice` por
// corrida (`notaLectura`), nunca una por archivo, con lo que leyó y contado con los mismos filtros que
// `choques`: sin la propia rama y sin los temas cerrados, que no se comparan.
//
// Uso (en CI): HEAD_REF=<rama del PR> BASE_REF=main node scripts/solapes-pr.js
// En local: node scripts/solapes-pr.js --base=origin/main --rama=<rama>
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { ocupadosRemotos, choques, esComun } = require('./reservar');

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

/* Puro: la línea de lo leído. Cuenta lo que `choques` compara de verdad: los otros temas en curso
   (ni la propia rama, que también aparece como PR sin traspaso al borrar su traspaso, ni los
   cerrados) y los archivos del PR sin los de cierre. Con `avisoPrs`, los PR no se leyeron y lo dice
   en vez de contar cero. */
function notaLectura({ propios, ocupados, rama, base, avisoPrs, solapes }) {
  const otros = ocupados.filter((o) => o && o.origen !== rama);
  const cerrado = (o) => /^cerrado/i.test(String(o.estado || '').trim());
  const esPr = (o) => o.estado === 'PR abierto';
  const traspasos = otros.filter((o) => !esPr(o) && !cerrado(o)).length;
  const cerrados = otros.filter((o) => !esPr(o) && cerrado(o)).length;
  const prs = otros.filter(esPr).length;
  const cuentan = propios.filter((r) => !esComun(r)).length;
  const partes = [
    `${traspasos} traspaso(s) en curso de otras ramas${cerrados ? ` (y ${cerrados} cerrado(s), que no cuentan)` : ''}`,
    avisoPrs ? 'los PR abiertos no se pudieron leer' : `${prs} PR abierto(s) sin traspaso`,
    `${propios.length} archivo(s) de este PR contra ${base}, ${cuentan} sin los de cierre`,
  ];
  return `Leído: ${partes.join('; ')}. Solapes: ${solapes}.`;
}

function argumento(argv, nombre) {
  const a = argv.find((x) => x.startsWith(`--${nombre}=`));
  return a ? a.slice(nombre.length + 3) : null;
}

const LECTORES = {
  diff: (base) => git(['diff', '--name-only', `${base}...HEAD`]).split('\n').map((s) => s.trim()).filter(Boolean),
  ocupados: () => ocupadosRemotos(),
};

// `lectores` se inyecta en las pruebas (diff y ocupados sin git ni red); en CI, los reales.
function main(argv = process.argv.slice(2), env = process.env, lectores = LECTORES) {
  const base = argumento(argv, 'base') || (env.BASE_REF ? `origin/${env.BASE_REF}` : 'origin/main');
  const rama = argumento(argv, 'rama') || env.HEAD_REF || git(['rev-parse', '--abbrev-ref', 'HEAD']).trim();
  const resumen = [];
  const decir = (linea) => { console.log(linea); resumen.push(linea); };

  let propios;
  try {
    propios = (lectores.diff || LECTORES.diff)(base);
  } catch (e) {
    console.log(`::warning title=solapes::${escaparAnotacion(`No se pudo leer el diff contra ${base}: ${String(e.stderr || e.message).trim().split('\n')[0]}`)}`);
    return 0;
  }
  let lectura;
  try {
    lectura = (lectores.ocupados || LECTORES.ocupados)();
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
  const nota = notaLectura({ propios, ocupados: lectura.ocupados, rama, base, avisoPrs: lectura.avisoPrs, solapes: lista.length });
  console.log(`::notice title=solapes::${escaparAnotacion(nota)}`);
  resumen.push('', nota);
  if (env.GITHUB_STEP_SUMMARY) {
    try { fs.appendFileSync(env.GITHUB_STEP_SUMMARY, `${resumen.join('\n')}\n`); } catch { /* el resumen es comodidad */ }
  }
  return 0;
}

if (require.main === module) process.exitCode = main();

module.exports = { avisos, notaLectura, escaparAnotacion, main };
