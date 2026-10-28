'use strict';
// LOS SCRIPTS `node -e "..."` DE LOS WORKFLOWS, TAL COMO LOS VE BASH (2026-10-06).
//
// POR QUE ESTA PRUEBA EXISTE. Un script de Node entre comillas dobles pasa antes por bash, y
// bash ejecuta lo que encuentra entre comillas invertidas y expande lo que va detras de un `$`.
// El 2026-10-06 un comentario de traer-cisco-huawei.yml citaba dos rutas entre comillas
// invertidas: bash intento ejecutarlas («Default.js: command not found»), se comio ese texto y
// la corrida 37504707952 salio en verde igual. Ahi era un comentario; en una linea de codigo
// habria cambiado lo que se ejecuta, en silencio. Lo que se quiere literal va escapado, como
// hace el resumen de pantallas.yml (\` y \$).
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, '..', '.github', 'workflows');

// Devuelve el cuerpo de cada `node -e "..."` de un bloque `run`, cortado en la primera comilla
// doble sin escapar, que es donde bash lo cierra, y lo que sigue a esa comilla en su línea.
function scriptsNodeE(run, conCola = false) {
  const out = [];
  const abre = 'node -e "';
  let i = run.indexOf(abre);
  while (i >= 0) {
    let k = i + abre.length;
    while (k < run.length && !(run[k] === '"' && run[k - 1] !== '\\')) k++;
    const fin = run.indexOf('\n', k + 1);
    const cuerpo = run.slice(i + abre.length, k);
    out.push(conCola ? { cuerpo, cola: run.slice(k + 1, fin < 0 ? run.length : fin) } : cuerpo);
    i = run.indexOf(abre, k + 1);
  }
  return out;
}

// La comilla que cierra el script tiene que ser la última del script: detrás va el fin de línea, un
// espacio (los argumentos del script) o sintaxis de bash (`|`, `&&`, `;`, una redirección), nunca
// texto pegado. El 2026-10-28 una entrada de traer-cisco-huawei.yml llevaba `debeContener: "What's
// new"`: bash cerró el script en esa comilla, Node recibió medio programa y la corrida 40622507025
// cayó antes de traer nada. La misma prueba sacó otra que llevaba años en silencio: con
// `debeContener: '"rows"'` bash pegaba los trozos y el script buscaba `rows` sin sus comillas.
const colaDeBash = (cola) => /^(\s|$|[|&;>)<])/.test(cola);

// Comillas invertidas y `$` sin escapar; `${{ ... }}` es de GitHub, no de bash, y se resuelve
// antes de que bash lo vea.
function peligrosos(cuerpo) {
  const malos = [];
  for (let j = 0; j < cuerpo.length; j++) {
    const c = cuerpo[j];
    if ((c !== '`' && c !== '$') || cuerpo[j - 1] === '\\') continue;
    if (c === '$' && cuerpo.startsWith('${{', j)) continue;
    malos.push(cuerpo.slice(Math.max(0, j - 40), j + 20).replace(/\n/g, '⏎'));
  }
  return malos;
}

function bloquesRun(texto) {
  // Los bloques `run: |` del YAML, sin dependencias: cada linea con mas sangria que la clave.
  const lineas = texto.split('\n');
  const bloques = [];
  for (let i = 0; i < lineas.length; i++) {
    const m = lineas[i].match(/^(\s*)(?:- )?run: \|/);
    if (!m) continue;
    const sangria = m[1].length;
    const cuerpo = [];
    for (let k = i + 1; k < lineas.length; k++) {
      const l = lineas[k];
      if (l.trim() && l.search(/\S/) <= sangria) break;
      cuerpo.push(l);
    }
    bloques.push(cuerpo.join('\n'));
  }
  return bloques;
}

test('ningún `node -e "..."` de un workflow deja a bash ejecutar o expandir algo sin escapar', () => {
  let vistos = 0;
  for (const f of fs.readdirSync(DIR).filter((x) => /\.ya?ml$/.test(x))) {
    for (const run of bloquesRun(fs.readFileSync(path.join(DIR, f), 'utf8'))) {
      for (const cuerpo of scriptsNodeE(run)) {
        vistos++;
        const malos = peligrosos(cuerpo);
        assert.deepStrictEqual(malos, [], `${f}: comilla invertida o $ sin escapar dentro de node -e "...": ${malos.join(' | ')}`);
      }
    }
  }
  assert.ok(vistos >= 5, `solo se encontraron ${vistos} scripts node -e: la extracción dejó de verlos`);
});

test('ningún `node -e "..."` de un workflow lleva una comilla doble que lo corte a medias', () => {
  for (const f of fs.readdirSync(DIR).filter((x) => /\.ya?ml$/.test(x))) {
    for (const run of bloquesRun(fs.readFileSync(path.join(DIR, f), 'utf8'))) {
      for (const { cuerpo, cola } of scriptsNodeE(run, true)) {
        assert.ok(colaDeBash(cola), `${f}: una comilla doble corta el script node -e "..." tras «${cuerpo.slice(-60).replace(/\n/g, '⏎')}»; sigue «${cola.slice(0, 40)}»`);
      }
    }
  }
  const [corto] = scriptsNodeE('node -e "\n  const d = { debeContener: "What\'s new", urls: [] };\n"', true);
  assert.ok(!colaDeBash(corto.cola), 'el detector no ve la comilla doble de debeContener');
  const [bien] = scriptsNodeE('node -e "\n  console.log(1);\n" > salida.txt', true);
  assert.ok(colaDeBash(bien.cola), 'una redirección detrás del script es de bash');
});

test('el detector ve lo que tiene que ver', () => {
  // Es el texto de un workflow, no una plantilla de JS: los ${...} son literales a propósito.
  // eslint-disable-next-line no-template-curly-in-string
  const run = 'node -e "\n  // ruta `a.js` y $HOME\n  console.log(\\`ok \\${x}\\`);\n  const v = \'${{ github.ref }}\';\n"';
  const [cuerpo] = scriptsNodeE(run);
  const malos = peligrosos(cuerpo);
  assert.strictEqual(malos.length, 3, malos.join(' | '));
});
