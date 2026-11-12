'use strict';
// Cisco: en qué orden salen los modelos que cumplen y cuál se recomienda (`CiscoMotor.evaluar` con
// `opciones`, 2026-11-12, la firma común del ADR-1). Mientras la base no devuelva `orden`, la versión
// vieja son las dos líneas que tenía render(): `FICHA.ordenar` sobre los candidatos del motor, por su
// capacidad equivalente, y `FICHA.recomendar`; ya fusionado, vigila el motor de la base contra el del PR.
// El catálogo es el que sirve la ruta, en su orden y con su ciclo de vida; FICHA sale del árbol de trabajo
// y es la misma para las dos versiones.
//   npm run equivalencia -- scripts/equivalencias/cisco-orden.js
const { execFileSync } = require('child_process');
const path = require('path');

const RAIZ = path.join(__dirname, '..', '..');
let MODELS = null;
let M = null;

const forma = (orden, recomendado) => ({ orden: orden.map((m) => m.id), recomendado: recomendado ? recomendado.id : null });

module.exports = {
  nombre: 'Cisco: el orden por ciclo de vida y el recomendado (CiscoMotor.evaluar con opciones), base contra árbol de trabajo',
  mide: ['public/js/cisco-motor.js', 'public/js/dimensionador-cisco-catalyst8k.js'],
  cargar({ desdeRef, actual }) {
    const d = JSON.parse(execFileSync(process.execPath, [path.join(RAIZ, 'scripts/ayuda/proyeccion-dimensionador.js'), 'cisco'],
      { cwd: RAIZ, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 64 * 1024 * 1024 }));
    MODELS = d.models;
    const G = actual(['public/js/ficha.js', 'public/js/pqc.js', 'public/js/cisco-motor.js']);
    const FICHA = G.FICHA;
    M = G.CiscoMotor;
    const base = desdeRef(['public/js/pqc.js', 'public/js/cisco-motor.js']).CiscoMotor;
    const deFicha = { rango: FICHA.rango, recomendar: FICHA.recomendar };
    const conMotor = (motor, opciones) => (p) => { const ev = motor.evaluar(MODELS, p, opciones); return forma(ev.orden, ev.recomendado); };
    // Las dos líneas de render() en la base.
    const pagina = (p) => {
      const ev = base.evaluar(MODELS, p);
      const capEq = new Map(ev.filas.map((f) => [f.m.id, f.capEq != null ? f.capEq : Infinity]));
      const candidatos = FICHA.ordenar(ev.candidatos.map((f) => f.m), (a, b) => capEq.get(a.id) - capEq.get(b.id));
      return forma(candidatos, FICHA.recomendar(candidatos));
    };
    const baseOrdena = Array.isArray(base.evaluar(MODELS, module.exports.casos()[0][0], deFicha).orden);
    return {
      viejo: baseOrdena ? conMotor(base, deFicha) : pagina,
      nuevo: conMotor(M, deFicha),
      // La mutación: el ciclo de vida al revés (lo fuera de venta primero).
      mutado: conMotor(M, { rango: (m) => -FICHA.rango(m), recomendar: FICHA.recomendar }),
    };
  },
  casos() {
    const out = [];
    for (const plataforma of ['xe', 'isr', 'meraki', 'asr', 'all']) {
      for (const perfil of ['fwd', 'ipsec', 'sdwan']) {
        for (const seguridad of ['ninguna', 'onbox', 'desacoplada', 'sse']) {
          for (const bw of [5, 50, 200, 500, 1000, 2500, 5000, 10000, 40000]) {
            for (const diaPct of [0, 50]) {
              out.push([{ modo: 'link', bwMbps: bw, dirMult: 2, headPct: 30, perfil, plataforma, seguridad, diaPct }]);
            }
          }
        }
      }
    }
    return out;
  },
};
