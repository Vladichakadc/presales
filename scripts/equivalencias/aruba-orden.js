'use strict';
// Aruba: en qué orden salen los candidatos y cuál se recomienda (`ArubaReglas.evaluar`, 2026-11-12, la
// firma común del ADR-1). Mientras la base no traiga `evaluar`, la versión vieja son las dos líneas que
// tenía render(): `FICHA.ordenar` por la capacidad máxima sobre lo que deja `filtrarCandidatos` y
// `FICHA.recomendar`; ya fusionado, vigila el motor de la base contra el del PR. Los escenarios, las
// funciones de la página y los modelos por SO son los de `aruba-eleccion.js`, que mide el filtro; los
// modelos llevan además el ciclo de vida que sirve la ruta, que es lo que ordena FICHA, y van en el orden
// en que la ruta los sirve. FICHA sale del árbol de trabajo y es la misma para las dos versiones.
//   npm run equivalencia -- scripts/equivalencias/aruba-orden.js
const { execFileSync } = require('child_process');
const path = require('path');
const eleccion = require('./aruba-eleccion');

const RAIZ = path.join(__dirname, '..', '..');
const PAGINA = 'public/js/dimensionador-aruba-edgeconnect.js';
let servidos = null; // id -> modelo como lo sirve la ruta (con su ciclo de vida)

const APARTADOS = ['outByBoost', 'outByClients', 'outByAps', 'outBySinDato', 'outByFlujos', 'outByPersona', 'outBySo', 'outByDtd',
  'outByBoostRec', 'outBySinSec', 'outByIds', 'outByIdsEc', 'outByPuertos', 'outByPqc'];
const ids = (x) => (Array.isArray(x) ? x.map((e) => (e && e.id ? e.id : e && e.m ? e.m.id : e)) : x);
const forma = (r) => ({ orden: r.candidatos.map((m) => m.id), recomendado: r.recomendado ? r.recomendado.id : null,
  apartados: Object.fromEntries(APARTADOS.map((k) => [k, ids(r.apartados[k])])) });
// Lo que el filtro lee de la página y lo que cambia con la pantalla, separados como los pasa render().
const PAGINA_CTX = ['coincideFiltro', 'PERSONA_MODELOS', 'ArubaReglas', 'IMIX_FACTOR', 'fmt', 'centralParaModelo', 'capacidadMax',
  'capacidadComparable', 'clientesMax', 'apsMax', 'flujosDe', 'evaluarPuertos', 'PQC', 'SO_NOMBRE'];

module.exports = {
  nombre: 'Aruba: el orden de candidatos y el recomendado (ArubaReglas.evaluar), base contra árbol de trabajo',
  mide: ['public/js/aruba-reglas.js', PAGINA],
  cargar({ desdeRef, actual }) {
    // Las funciones de la página y el contexto de cada escenario, los mismos que mide aruba-eleccion.
    const armado = {};
    const baseR = desdeRef(['public/js/aruba-reglas.js']).ArubaReglas;
    const fnsEleccion = eleccion.cargar({
      desdeRef: () => ({ ArubaReglas: { filtrarCandidatos: (MODELS, ctx) => { armado.ctx = ctx; return baseR.filtrarCandidatos(MODELS, ctx); } } }),
      actual,
    });
    const ctxDe = (MODELS, c) => { fnsEleccion.viejo(MODELS, c); return armado.ctx; };
    const d = JSON.parse(execFileSync(process.execPath, [path.join(RAIZ, 'scripts/ayuda/proyeccion-dimensionador.js'), 'aruba'],
      { cwd: RAIZ, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 64 * 1024 * 1024 }));
    servidos = new Map(d.models.map((m) => [m.id, m]));
    const G = actual(['public/js/ficha.js', 'public/js/pqc.js', 'public/js/aruba-reglas.js']);
    const FICHA = G.FICHA;
    const R = G.ArubaReglas;
    const partir = (ctx) => {
      const pagina = {}, escenario = {};
      for (const [k, v] of Object.entries(ctx)) (PAGINA_CTX.includes(k) ? pagina : escenario)[k] = v;
      return { pagina, escenario };
    };
    const conMotor = (motor) => (MODELS, c) => {
      const { pagina, escenario } = partir(ctxDe(MODELS, c));
      return forma(motor.evaluar(escenario, { models: MODELS }, { rango: FICHA.rango, recomendar: FICHA.recomendar, pagina }));
    };
    // Los tres argumentos de `evaluar` para un caso: los usa también test/contrato-motores.test.js.
    module.exports.argumentos = (MODELS, c) => {
      const { pagina, escenario } = partir(ctxDe(MODELS, c));
      return [escenario, { models: MODELS }, { rango: FICHA.rango, recomendar: FICHA.recomendar, recomendable: FICHA.recomendable, pagina }];
    };
    const nuevo = conMotor(R);
    let viejo;
    if (typeof baseR.evaluar === 'function') viejo = conMotor(baseR);
    else {
      // Las dos líneas de render() en la base: FICHA.ordenar por capacidad máxima y FICHA.recomendar.
      viejo = (MODELS, c) => {
        const ctx = ctxDe(MODELS, c);
        const { candidates, ...apartados } = baseR.filtrarCandidatos(MODELS, ctx);
        const candidatos = FICHA.ordenar(candidates, (a, b) => ctx.capacidadMax(a) - ctx.capacidadMax(b));
        return forma({ candidatos, recomendado: FICHA.recomendar(candidatos, null), apartados });
      };
    }
    return {
      viejo,
      nuevo,
      // La mutación: el orden al revés dentro de cada grupo de ciclo de vida (cambia el orden y, con
      // más de un candidato vigente, el recomendado).
      mutado: (MODELS, c) => {
        const { pagina, escenario } = partir(ctxDe(MODELS, c));
        return forma(R.evaluar(escenario, { models: MODELS },
          { rango: FICHA.rango, recomendar: FICHA.recomendar, pagina: { ...pagina, capacidadMax: (m) => -pagina.capacidadMax(m) } }));
      },
    };
  },
  casos() {
    // Los de aruba-eleccion, con el ciclo de vida de la ruta en cada modelo (lo que ordena FICHA.rango).
    const vistos = new Map();
    const conCiclo = (MODELS) => {
      if (!vistos.has(MODELS)) {
        // En el orden en que la ruta sirve el catálogo, que es el que ve la página: con él, el
        // desempate por id del motor no tiene que cambiar nada (legacyData trae el EC-XS antes que el
        // EC-10106, y la ruta, al revés).
        const puesto = new Map([...servidos.keys()].map((id, i) => [id, i]));
        const enOrden = [...MODELS].sort((a, b) => (puesto.get(a.id) ?? Infinity) - (puesto.get(b.id) ?? Infinity));
        vistos.set(MODELS, enOrden.map((m) => {
          const s = servidos.get(m.id) || {};
          const extra = {};
          for (const k of ['eol', 'eolAnnounced', 'legacy']) if (k in s) extra[k] = s[k];
          return { ...m, ...extra };
        }));
      }
      return vistos.get(MODELS);
    };
    return eleccion.casos().map(([MODELS, c]) => [conCiclo(MODELS), c]);
  },
};
