'use strict';
// Caso de ejemplo de `npm run equivalencia` (y el que usa su prueba): la regla «Exigir PQC»
// (`PQC.motivo`) de `main` contra la del árbol de trabajo, sobre todos los modelos del catálogo,
// los tres niveles y los dos sistemas operativos de Aruba. Para un corte nuevo se copia este archivo:
// `cargar` dice qué scripts y qué función, `casos` sobre qué datos, y `mutado` una versión que
// cambia una sola cosa, para probar que el comparador la ve.
const path = require('path');

const FABRICANTES = ['aruba', 'cisco', 'fortinet', 'huawei', 'juniper', 'mikrotik', 'nokia'];

module.exports = {
  nombre: 'PQC.motivo (public/js/pqc.js) sobre los modelos del catálogo',
  mide: ['public/js/pqc.js'],
  cargar({ desdeRef, actual }) {
    const viejo = desdeRef(['public/js/pqc.js']).PQC;
    const nuevo = actual(['public/js/pqc.js']).PQC;
    return {
      viejo: (m, n, ctx) => viejo.motivo(m, n, ctx),
      nuevo: (m, n, ctx) => nuevo.motivo(m, n, ctx),
      // La mutación: ML-KEM exigido acepta cualquier mecanismo (el error que la regla existe para evitar).
      mutado: (m, n, ctx) => nuevo.motivo(m, n === 'mlkem' ? 'clave' : n, ctx),
    };
  },
  casos() {
    const modelos = FABRICANTES.flatMap((f) => require(path.join(__dirname, '..', '..', 'server', 'seed', 'legacyData', `${f}.js`)).MODELS);
    const ctxs = [undefined, { so: 'aos8', soNombre: 'AOS 8' }, { so: 'aos10', soNombre: 'AOS 10' }];
    return modelos.flatMap((m) => ['', 'clave', 'mlkem', 'otro'].flatMap((n) => ctxs.map((c) => [m, n, c])));
  },
};
