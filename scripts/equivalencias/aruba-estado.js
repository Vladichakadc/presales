'use strict';
// Fase 3.1, segunda entrega (2026-11-01): el estado comercial derivado de Aruba (topes de la licencia
// de capacidad, bloque de Boost, flujos, precio y SKU por término, Central de cada gateway) pasa de la
// página a `aruba-reglas.js`. La versión vieja se extrae del texto de la página en la referencia y se
// ejecuta con los mismos datos que la nueva recibe por parámetro.
//   npm run equivalencia -- scripts/equivalencias/aruba-estado.js
const { execFileSync } = require('child_process');
const path = require('path');
const vm = require('vm');

const RAIZ = path.join(__dirname, '..', '..');
const PAGINA = 'public/js/dimensionador-aruba-edgeconnect.js';
const FIRMAS = ['function clientesMax(m){', 'function apsMax(m){', 'function nivelLicenciaNecesario(m,need,users,aps){',
  'function bloquesBoost(mbps){', 'function flujosDe(m){', 'function tierPrice(t,y){', 'function tierSku(t,y){',
  'function baseParaModelo(m, D){', 'function centralParaModelo(m, nivel, termYrs, conSeguridad){'];

// El texto de una función de la página: hasta su «}» de cierre en columna 0, o la línea si cabe en una.
function funcion(src, firma) {
  const i = src.indexOf(firma);
  if (i < 0) throw new Error(`no está «${firma}» en la página de la referencia`);
  const finLinea = src.indexOf('\n', i);
  const linea = src.slice(i, finLinea);
  if (linea.trimEnd().endsWith('}') && linea.split('{').length === linea.split('}').length) return linea;
  return src.slice(i, src.indexOf('\n}\n', i) + 2);
}

const A = require(path.join(RAIZ, 'server/seed/legacyData/aruba.js'));
// La lista del distribuidor no entra al repositorio: una lista sintética con los SKU de Central que el
// catálogo nombra (precio inventado, igual para las dos versiones) ejerce la rama «precio de la lista».
function skuCat() {
  const out = [];
  let p = 100;
  for (const fam of Object.values(A.CENTRAL_POR_SERIE)) {
    for (const t of Object.values(fam)) {
      if (t && t.sku && typeof t.sku === 'object') for (const sku of Object.values(t.sku)) if (sku) out.push({ sku, p: (p += 7) });
    }
  }
  return out;
}

let datos = null;
module.exports = {
  nombre: 'Aruba: estado comercial derivado, de la página (main) a aruba-reglas.js',
  cargar({ actual }) {
    const ref = (process.argv.find((a) => a.startsWith('--ref=')) || '--ref=origin/main').slice(6);
    const src = execFileSync('git', ['show', `${ref}:${PAGINA}`], { cwd: RAIZ, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
    const viejo = vm.createContext({});
    vm.runInContext(`var SIZING, CENTRAL_SERIE, CENTRAL, SKU_CAT, secMode;
      ${FIRMAS.map((f) => funcion(src, f)).join('\n')}
      globalThis.__v = { clientesMax, apsMax, nivelLicenciaNecesario, bloquesBoost, flujosDe, tierPrice, tierSku, baseParaModelo, centralParaModelo,
        poner(d) { SIZING = d.SIZING; CENTRAL_SERIE = d.CENTRAL_SERIE; CENTRAL = d.CENTRAL; SKU_CAT = d.SKU_CAT; secMode = d.secMode; } };`, viejo);
    const V = viejo.__v;
    const N = actual(['public/js/aruba-reglas.js']).ArubaReglas;
    const conjuntoDe = (F, d, m, x, nuevo) => {
      if (!nuevo) F.poner(d);
      const cs = { centralSerie: d.CENTRAL_SERIE, central: d.CENTRAL, skuCat: d.SKU_CAT };
      return [
        F.clientesMax(m), F.apsMax(m), F.nivelLicenciaNecesario(m, x.need, x.users, x.aps), F.flujosDe(m),
        nuevo ? F.bloquesBoost(d.SIZING, x.need) : F.bloquesBoost(x.need),
        ...['y1', 'y3', 'y5', 'y7'].flatMap((y) => Object.values(d.CENTRAL).concat(Object.values(A.LICENSES)).slice(0, 12)
          .map((t) => [F.tierPrice(t, y.slice(1)), F.tierSku(t, y.slice(1))])),
        nuevo ? F.baseParaModelo(d.CENTRAL_SERIE, m, x.D, d.secMode) : F.baseParaModelo(m, x.D),
        ...['foundation', 'advanced', null].flatMap((nv) => [false, true].map((sec) => (nuevo
          ? F.centralParaModelo(cs, m, nv, x.D.termYrs, sec) : F.centralParaModelo(m, nv, x.D.termYrs, sec)))),
      ];
    };
    return {
      viejo: (d, m, x) => conjuntoDe(V, d, m, x, false),
      nuevo: (d, m, x) => conjuntoDe(N, d, m, x, true),
      // La mutación: Central con la lista del distribuidor vacía (cambia el precio de los SKU que solo
      // están en la lista) y el bloque de Boost de 50 en vez del del catálogo.
      mutado: (d, m, x) => conjuntoDe(N, { ...d, SKU_CAT: [], SIZING: { ...d.SIZING, boost: { ...(d.SIZING.boost || {}), bloque: 50 } } }, m, x, true),
    };
  },
  casos() {
    datos = datos || { SIZING: { bwTiers: A.BW_TIERS, boost: A.BOOST }, CENTRAL_SERIE: A.CENTRAL_POR_SERIE, CENTRAL: A.CENTRAL_TIERS, SKU_CAT: skuCat() };
    const out = [];
    for (const secMode of ['none', 'gwsec', 'ngfw']) {
      const d = { ...datos, secMode };
      for (const m of A.MODELS) {
        for (const need of [0, 40, 99, 100, 101, 250, 1000, 4000, 20000]) {
          for (const users of [0, 25, 200, 2000]) {
            for (const termYrs of [1, 3, 5, 7]) out.push([d, m, { need, users, aps: Math.round(users / 20), D: { users, termYrs } }]);
          }
        }
      }
    }
    // Sin catálogo de Boost (bloque por defecto) y sin lista.
    for (const m of A.MODELS) out.push([{ ...datos, SIZING: {}, SKU_CAT: [], secMode: 'none' }, m, { need: 150, users: 10, aps: 1, D: { users: 10, termYrs: 3 } }]);
    return out;
  },
};
