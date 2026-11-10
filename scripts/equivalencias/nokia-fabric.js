'use strict';
// Nokia 7220 IXR, el fabric leaf-spine (`NokiaFabricMotor.calcularFabric`, fase 2 de la auditoría del
// 2026-11-09, ADR-1, corte 4). Mientras la base no traiga el motor, la versión vieja es el «motor puro» que
// vivía dentro de la página, tomado tal cual de su texto en la base; ya fusionado, vigila el motor de la
// base contra el del PR. El catálogo va en el orden que sirve la ruta: con él, el orden explícito nuevo
// (el id en orden natural) no tiene que cambiar ni el leaf ni el spine.
//   npm run equivalencia -- scripts/equivalencias/nokia-fabric.js
const { execFileSync } = require('child_process');
const path = require('path');
const vm = require('vm');

const RAIZ = path.join(__dirname, '..', '..');
const PAGINA = 'public/js/dimensionador-nokia-7220ixr.js';
let cat = null;

function trozo(src, desde, hasta) {
  const i = src.indexOf(desde);
  if (i < 0) throw new Error(`no está «${desde.slice(0, 60)}» en la página`);
  const j = src.indexOf(hasta, i + desde.length);
  if (j < 0) throw new Error(`no está el final de «${desde.slice(0, 60)}»`);
  return src.slice(i, j + hasta.length);
}
const forma = (r) => ({ ...r, leaf: r.leaf ? r.leaf.id : null, spine: r.spine ? r.spine.id : null, version: undefined });

module.exports = {
  nombre: 'Nokia 7220 IXR: el fabric leaf-spine (NokiaFabricMotor.calcularFabric), base contra árbol de trabajo',
  mide: ['public/js/nokia-fabric-motor.js', PAGINA],
  cargar({ desdeRef, actual, ref }) {
    cat = JSON.parse(execFileSync(process.execPath, [path.join(RAIZ, 'scripts/ayuda/proyeccion-dimensionador.js'), 'nokia'],
      { cwd: RAIZ, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 64 * 1024 * 1024 }));
    const G = actual(['public/js/nokia-fabric-motor.js']);
    const nuevo = (esc) => forma(G.NokiaFabricMotor.calcularFabric({ ...esc, models: cat.models }));
    let viejo;
    const enBase = (rel) => { try { execFileSync('git', ['cat-file', '-e', `${ref}:${rel}`], { cwd: RAIZ, stdio: 'ignore' }); return true; } catch { return false; } };
    const baseMotor = enBase('public/js/nokia-fabric-motor.js') ? desdeRef(['public/js/nokia-fabric-motor.js']).NokiaFabricMotor : null;
    if (baseMotor && typeof baseMotor.calcularFabric === 'function') {
      viejo = (esc) => forma(baseMotor.calcularFabric({ ...esc, models: cat.models }));
    } else {
      const base = execFileSync('git', ['show', `${ref}:${PAGINA}`], { cwd: RAIZ, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
      const motor = trozo(base, '  function puertosDe(', '      spine, numSpines, puertosPorSpine, spineInsuficiente,\n    };\n  }\n');
      const ctx = vm.createContext({});
      vm.runInContext(`${motor}\nglobalThis.__calcular = calcularFabric;`, ctx, { filename: `${ref}:${PAGINA} (motor puro)` });
      viejo = (esc) => forma(ctx.__calcular({ ...esc, models: cat.models }));
    }
    return {
      viejo,
      nuevo,
      // La mutación: el doble de servidores más uno (cambia los leafs).
      mutado: (esc) => nuevo({ ...esc, servers: esc.servers * 2 + 1 }),
    };
  },
  casos() {
    const out = [];
    for (const servers of [0, 1, 10, 24, 48, 100, 250, 500, 2000, 10000]) {
      for (const accesoVel of [1, 10, 25, 100, 400]) {
        for (const dual of [false, true]) {
          for (const oversub of [1, 1.5, 2, 3, 4]) out.push([{ servers, accesoVel, dual, oversub }]);
        }
      }
    }
    return out;
  },
};
