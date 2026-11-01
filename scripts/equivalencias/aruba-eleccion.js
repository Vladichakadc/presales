'use strict';
// El filtro de candidatos de Aruba, `ArubaReglas.filtrarCandidatos`: el módulo de la base contra el del
// árbol de trabajo. Nació para medir la fase 3.1 (PR #113), cuando la versión vieja era el bloque de
// render() tomado tal cual de la página; ya fusionado, vigila el módulo en cada PR que lo toque. Las
// funciones de la página que el filtro llama (capacidad, filtro de familia, puertos, Central, PQC) salen
// del árbol de trabajo y son las MISMAS para las dos versiones: lo que se mide es el filtro.
//   npm run equivalencia -- scripts/equivalencias/aruba-eleccion.js
const path = require('path');
const vm = require('vm');

const RAIZ = path.join(__dirname, '..', '..');
const PAGINA = 'public/js/dimensionador-aruba-edgeconnect.js';
const A = require(path.join(RAIZ, 'server/seed/legacyData/aruba.js'));

function trozo(src, desde, hasta) {
  const i = src.indexOf(desde);
  if (i < 0) throw new Error(`no está «${desde.slice(0, 60)}» en la página`);
  const j = src.indexOf(hasta, i + desde.length);
  if (j < 0) throw new Error(`no está el final de «${desde.slice(0, 60)}»`);
  return src.slice(i, j + hasta.length);
}

const SALIDA = ['candidates', 'outByBoost', 'outByClients', 'outByAps', 'outBySinDato', 'outByFlujos', 'outByPersona', 'outBySo', 'outByDtd',
  'outByBoostRec', 'outBySinSec', 'outByIds', 'outByIdsEc', 'outByPuertos', 'outByPqc'];

let comun = null; // las funciones de la página y los modelos por SO, iguales para las dos versiones
let G = null;

module.exports = {
  nombre: 'Aruba: el filtro de candidatos (ArubaReglas.filtrarCandidatos), base contra árbol de trabajo',
  mide: ['public/js/aruba-reglas.js'],
  cargar({ desdeRef, actual }) {
    const baseR = desdeRef(['public/js/aruba-reglas.js']).ArubaReglas;
    if (typeof baseR.filtrarCandidatos !== 'function') return { sinBase: 'la base no trae ArubaReglas.filtrarCandidatos (llegó en el PR #113)' };
    const src = require('fs').readFileSync(path.join(RAIZ, PAGINA), 'utf8');
    G = actual(['public/js/aruba-reglas.js', 'public/js/pqc.js']);
    const R = G.ArubaReglas;
    // Las funciones de la página que el filtro llama, del texto de la referencia.
    const pagina = vm.createContext({ ArubaReglas: R });
    vm.runInContext(`
      ${trozo(src, 'const SO_NOMBRE=', ';\n')}
      ${trozo(src, 'const PERSONA_MODELOS={', '\n};\n')}
      ${trozo(src, 'const IMIX_FACTOR=', ';\n')}
      ${trozo(src, 'function coincideFiltro(m,modo){', '\n}\n')}
      ${trozo(src, 'function capacidad(m){', '\n}\n')}
      ${trozo(src, 'function capacidadMax(m){', '\n}\n')}
      ${trozo(src, 'function capacidadComparable(m){', '\n}\n')}
      globalThis.__p = { SO_NOMBRE, PERSONA_MODELOS, IMIX_FACTOR, coincideFiltro, capacidadMax, capacidadComparable };`, pagina);
    const acc = { catalogo: A.ARUBA_ACCESSORY_CATALOG, compat: A.ACCESSORY_COMPAT };
    comun = { ...pagina.__p, ArubaReglas: R, PQC: G.PQC, fmt: R.fmt,
      clientesMax: R.clientesMax, apsMax: R.apsMax, flujosDe: R.flujosDe,
      centralParaModelo: (m, nivel, termYrs, sec) => R.centralParaModelo({ centralSerie: A.CENTRAL_POR_SERIE, central: A.CENTRAL_TIERS, skuCat: [] }, m, nivel, termYrs, sec) };
    const ids = (x) => (Array.isArray(x) ? x.map((e) => (e && e.id ? e.id : e && e.m ? { id: e.m.id, motivo: e.motivo } : e)) : x);
    const forma = (r) => Object.fromEntries(SALIDA.map((k) => [k, ids(r[k])]));
    const ctxDe = (c) => ({ ...comun, ...c, evaluarPuertos: (m, links) => R.evaluarPuertos(acc, m, links, c.unidades) });
    return {
      viejo: (MODELS, c) => forma(baseR.filtrarCandidatos(MODELS, ctxDe(c))),
      nuevo: (MODELS, c) => forma(R.filtrarCandidatos(MODELS, ctxDe(c))),
      // La mutación: el filtro nuevo pidiendo el doble de caudal (cambia los candidatos) y con la PQC
      // exigida de otra forma (cambia los apartados por PQC).
      mutado: (MODELS, c) => forma(R.filtrarCandidatos(MODELS, ctxDe({ ...c, needDe: (m) => 2 * c.needDe(m),
        nivelPqc: c.nivelPqc === 'mlkem' ? '' : 'mlkem' }))),
    };
  },
  casos() {
    let semilla = 31101;
    const azar = () => { semilla = (semilla * 1103515245 + 12345) % 2147483648; return semilla / 2147483648; };
    const de = (xs) => xs[Math.floor(azar() * xs.length)];
    const R = G.ArubaReglas;
    // Los modelos con las cifras de cada SO, como hace aplicarSo() en la página.
    const porSo = Object.fromEntries(['aos10', 'aos8'].map((so) => [so, A.MODELS.map((m0) => {
      const m = JSON.parse(JSON.stringify(m0));
      if (!m.porSo) return m;
      const ov = R.capacidadSo(m, so);
      m.sinCifraSo = !!ov.sinCifra;
      if (!ov.sinCifra) for (const k of ['aps', 'clients', 'fw', 'licCap']) if (k in ov) m[k] = ov[k];
      return m;
    })]));
    const medios = ['RJ45', 'RJ45', 'RJ45', 'SFP', 'SFP+', 'SFP28'];
    const out = [];
    for (let i = 0; i < 2500; i += 1) {
      const soMode = de(['aos10', 'aos8']);
      const wanNeed = Math.round(10 ** (1 + azar() * (azar() < 0.7 ? 2.5 : 4.3)));
      const needProc = Math.round(wanNeed * (0.5 + azar()));
      const n = 1 + Math.floor(azar() * (azar() < 0.7 ? 2 : 4));
      const wanLinks = Array.from({ length: n }, (_, k) => {
        const down = Math.round(10 ** (1 + azar() * (azar() < 0.7 ? 2.5 : 4)));
        return { id: k + 1, tipo: de(['DIA', 'MPLS', '4G/5G', 'Broadband']), medio: de(medios), down, up: down, simetrico: true, rol: k && azar() < 0.3 ? 'respaldo' : 'activo' };
      });
      const users = de([0, 0, 0, 20, 60, 150, 1500, 20000]);
      out.push([porSo[soMode], {
        famMode: de(['any', 'any', 'ec', 'sucursal', 'vpnc']), personaMode: de(['auto', 'auto', 'micro', 'peq', 'med', 'campus']),
        boost: azar() < 0.3, secMode: de(['none', 'sse', 'gwsec', 'dtd']), needProc,
        needDe: (m) => (m.fam === 'ec' ? wanNeed : needProc), users, aps: users ? Math.round(users / de([10, 30, 60])) : 0,
        flujosReq: users ? users * de([80, 150]) : 0, D: { boostMbps: azar() < 0.5 ? Math.round(azar() * 1500) : 0, wanLinks },
        soMode, nivelPqc: de(['', '', 'clave', 'mlkem']), unidades: azar() < 0.3 ? 2 : 1,
      }]);
    }
    // Escenarios sencillos (sin filtro de familia ni arquetipo, caudal moderado): la lista con varios
    // candidatos, que es lo que la página ordena y recomienda, se compara muchas veces.
    for (let i = 0; i < 800; i += 1) {
      const soMode = de(['aos10', 'aos8']);
      const wanNeed = Math.round(10 + azar() * 1500);
      const down = Math.round(wanNeed * (0.5 + azar()));
      out.push([porSo[soMode], {
        famMode: 'any', personaMode: 'auto', boost: azar() < 0.2, secMode: de(['none', 'none', 'sse', 'dtd', 'gwsec']),
        needProc: Math.round(wanNeed * 0.8), needDe: (m) => (m.fam === 'ec' ? wanNeed : Math.round(wanNeed * 0.8)),
        users: de([0, 30, 100, 300]), aps: de([0, 2, 8]), flujosReq: de([0, 2400, 24000]),
        D: { boostMbps: 0, wanLinks: [{ id: 1, tipo: 'DIA', medio: 'RJ45', down, up: down, simetrico: true, rol: 'activo' }] },
        soMode, nivelPqc: de(['', '', '', 'clave']), unidades: 1,
      }]);
    }
    return out;
  },
};
