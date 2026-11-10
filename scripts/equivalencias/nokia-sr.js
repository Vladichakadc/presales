'use strict';
// Nokia 7750 SR / 7250 IXR: el requerimiento, el recomendado y el orden de candidatos (`NokiaSrMotor.evaluar`,
// fase 2 de la auditoría del 2026-11-09, ADR-1, corte 4). Mientras la base no traiga el motor, la versión
// vieja es el «motor puro» que vivía dentro de la página (tomado tal cual de su texto en la base), con el
// orden y la recomendación que hacía `render()` (`FICHA.ordenar` por capacidad y `FICHA.recomendar`) y su
// cuenta del requerimiento; ya fusionado, vigila el motor de la base contra el del PR. El catálogo va en
// el orden que sirve la ruta; FICHA y PQC salen del árbol de trabajo y son los mismos para las dos.
//   npm run equivalencia -- scripts/equivalencias/nokia-sr.js
const { execFileSync } = require('child_process');
const path = require('path');
const vm = require('vm');

const RAIZ = path.join(__dirname, '..', '..');
const PAGINA = 'public/js/dimensionador-nokia-7750sr.js';
let cat = null;

function trozo(src, desde, hasta) {
  const i = src.indexOf(desde);
  if (i < 0) throw new Error(`no está «${desde.slice(0, 60)}» en la página`);
  const j = src.indexOf(hasta, i + desde.length);
  if (j < 0) throw new Error(`no está el final de «${desde.slice(0, 60)}»`);
  return src.slice(i, j + hasta.length);
}
const forma = (r) => ({ need: r.need, recomendado: r.recomendado ? r.recomendado.id : null, orden: r.candidatos.map((m) => m.id),
  apartados: r.apartados.map((x) => [x.m.id, x.motivo]), outByPqc: r.outByPqc.map((x) => x.m.id) });

module.exports = {
  nombre: 'Nokia 7750 SR / 7250 IXR: el recomendado y el orden de candidatos (NokiaSrMotor.evaluar), base contra árbol de trabajo',
  mide: ['public/js/nokia-sr-motor.js', PAGINA],
  cargar({ desdeRef, actual, ref }) {
    cat = JSON.parse(execFileSync(process.execPath, [path.join(RAIZ, 'scripts/ayuda/proyeccion-dimensionador.js'), 'nokia-sr'],
      { cwd: RAIZ, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 64 * 1024 * 1024 }));
    const G = actual(['public/js/ficha.js', 'public/js/pqc.js', 'public/js/nokia-sr-motor.js']);
    const FICHA = G.FICHA;
    const opciones = { rango: FICHA.rango, recomendar: FICHA.recomendar };
    const nuevo = (esc) => forma(G.NokiaSrMotor.evaluar(esc, { models: cat.models }, opciones));
    let viejo;
    const enBase = (rel) => { try { execFileSync('git', ['cat-file', '-e', `${ref}:${rel}`], { cwd: RAIZ, stdio: 'ignore' }); return true; } catch { return false; } };
    const baseMotor = enBase('public/js/nokia-sr-motor.js') ? desdeRef(['public/js/pqc.js', 'public/js/nokia-sr-motor.js']).NokiaSrMotor : null;
    if (baseMotor && typeof baseMotor.evaluar === 'function') {
      viejo = (esc) => forma(baseMotor.evaluar(esc, { models: cat.models }, opciones));
    } else {
      const base = execFileSync('git', ['show', `${ref}:${PAGINA}`], { cwd: RAIZ, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
      const motor = trozo(base, '  function enPlataforma(m, familia) {', '    return { familia, candidatos, apartados, outByPqc };\n  }\n');
      const ctx = vm.createContext({ PQC: G.PQC });
      vm.runInContext(`${motor}\nglobalThis.__evaluar = evaluar;`, ctx, { filename: `${ref}:${PAGINA} (motor puro)` });
      viejo = (esc) => {
        // La cuenta de requerimiento() y las dos líneas de render(), como estaban en la página.
        const need = Math.round(Math.max(0, esc.bw) * (1 + esc.head));
        const r = ctx.__evaluar({ models: cat.models, need, portQty: esc.portQty, portVel: esc.portVel, familia: esc.familia, pqc: esc.pqc });
        const candidatos = FICHA.ordenar(r.candidatos, (a, b) => a.cap - b.cap);
        return forma({ need, candidatos, recomendado: FICHA.recomendar(candidatos), apartados: r.apartados, outByPqc: r.outByPqc });
      };
    }
    return {
      viejo,
      nuevo,
      // La mutación: el triple de caudal (cambia el requerimiento, los candidatos y el recomendado).
      mutado: (esc) => nuevo({ ...esc, bw: esc.bw * 3 + 1 }),
    };
  },
  casos() {
    const out = [];
    for (const bw of [0, 1, 10, 50, 100, 400, 1000, 2400, 6000, 12000, 50000, 108000, 216000, 300000]) {
      for (const head of [0, 0.3]) {
        for (const familia of ['all', ...Object.keys(cat.plataformas)]) {
          for (const [portQty, portVel] of [[0, 100], [4, 10], [12, 100], [36, 100], [12, 400], [80, 100]]) {
            for (const pqc of ['', 'clave']) out.push([{ bw, head, familia, portQty, portVel, pqc }]);
          }
        }
      }
    }
    return out;
  },
};
