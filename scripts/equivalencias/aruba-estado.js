'use strict';
// El estado comercial derivado de Aruba en `aruba-reglas.js` (topes de la licencia de capacidad, bloque
// de Boost, flujos, precio y SKU por término, Central de cada gateway): el módulo de la base contra el
// del árbol de trabajo, con los mismos datos. Nació para medir la fase 3.1 (PR #111), cuando la versión
// vieja se extraía del texto de la página; ya fusionado, vigila el módulo en cada PR que lo toque.
//   npm run equivalencia -- scripts/equivalencias/aruba-estado.js
const path = require('path');

const RAIZ = path.join(__dirname, '..', '..');
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
  nombre: 'Aruba: estado comercial derivado (aruba-reglas.js), base contra árbol de trabajo',
  mide: ['public/js/aruba-reglas.js'],
  cargar({ desdeRef, actual }) {
    const V = desdeRef(['public/js/aruba-reglas.js']).ArubaReglas;
    if (typeof V.centralParaModelo !== 'function') return { sinBase: 'la base no trae ArubaReglas.centralParaModelo (llegó en el PR #111)' };
    const N = actual(['public/js/aruba-reglas.js']).ArubaReglas;
    const conjuntoDe = (F, d, m, x) => {
      const cs = { centralSerie: d.CENTRAL_SERIE, central: d.CENTRAL, skuCat: d.SKU_CAT };
      return [
        F.clientesMax(m), F.apsMax(m), F.nivelLicenciaNecesario(m, x.need, x.users, x.aps), F.flujosDe(m), F.bloquesBoost(d.SIZING, x.need),
        ...['1', '3', '5', '7'].flatMap((y) => Object.values(d.CENTRAL).concat(Object.values(A.LICENSES)).slice(0, 12)
          .map((t) => [F.tierPrice(t, y), F.tierSku(t, y)])),
        F.baseParaModelo(d.CENTRAL_SERIE, m, x.D, d.secMode),
        ...['foundation', 'advanced', null].flatMap((nv) => [false, true].map((sec) => F.centralParaModelo(cs, m, nv, x.D.termYrs, sec))),
      ];
    };
    return {
      viejo: (d, m, x) => conjuntoDe(V, d, m, x),
      nuevo: (d, m, x) => conjuntoDe(N, d, m, x),
      // La mutación: sin la lista del distribuidor y con bloques de Boost de 50.
      mutado: (d, m, x) => conjuntoDe(N, { ...d, SKU_CAT: [], SIZING: { ...d.SIZING, boost: { ...(d.SIZING.boost || {}), bloque: 50 } } }, m, x),
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
