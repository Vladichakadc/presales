'use strict';
// La lista de materiales de Aruba, `ArubaReglas.lineasBom` (fase 2 de la auditoría del 2026-11-09, ADR-1,
// primer corte): las filas que renderBom() armaba entre el pintado. Mientras la base no traiga la
// función, la versión vieja es el bloque de renderBom() tomado tal cual del texto de la página de la
// base; ya fusionado, vigila el módulo en cada PR que lo toque. Las funciones de la página que el bloque
// llama (accesorios que exige el diseño, ópticas por medio, la casilla del par) salen del árbol de
// trabajo y son las MISMAS para las dos versiones: lo que se mide son las filas, la selección del modal
// que queda después y la suscripción del segundo nodo.
//   npm run equivalencia -- scripts/equivalencias/aruba-bom.js
const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const vm = require('vm');

const RAIZ = path.join(__dirname, '..', '..');
const PAGINA = 'public/js/dimensionador-aruba-edgeconnect.js';
const INICIO = '  const lic=LICENSES[bwCode]||null;';
// eslint-disable-next-line no-template-curly-in-string -- es el texto literal de la página que marca el final del bloque
const FIN = 'nota:`${termino} · ${CARE[care].sla}`});\n  }\n';

function trozo(src, desde, hasta) {
  const i = src.indexOf(desde);
  if (i < 0) throw new Error(`no está «${desde.slice(0, 60)}» en la página`);
  const j = src.indexOf(hasta, i + desde.length);
  if (j < 0) throw new Error(`no está el final de «${desde.slice(0, 60)}»`);
  return src.slice(i, j + hasta.length);
}

// Lo que recibe la página (GET /api/dimensionador/aruba), del catálogo en memoria sembrado desde
// legacyData. Va a un archivo y no a la salida: la siembra escribe sus avisos por ella.
function proyeccion() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'equiv-aruba-bom-'));
  const salida = path.join(dir, 'aruba.json');
  const codigo = `(async () => {
    const d = await require('./server/services/catalogProjection').toDimensionadorAruba();
    require('fs').writeFileSync(process.env.SALIDA_EQUIV, JSON.stringify(d));
  })().catch((e) => { console.error(e); process.exit(1); });`;
  try {
    execFileSync(process.execPath, ['-e', codigo], { cwd: RAIZ, stdio: ['ignore', 'ignore', 'pipe'], maxBuffer: 64 * 1024 * 1024,
      env: { ...process.env, AUTH_STATE_DIR: dir, SALIDA_EQUIV: salida } });
    return JSON.parse(fs.readFileSync(salida, 'utf8'));
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

let datos = null; // la proyección, como la guardan los globales de la página
let pag = null; // el contexto con las funciones de la página
const MEDIOS = ['RJ45', 'SFP 1G', 'SFP+ 10G', 'SFP28 25G'];

module.exports = {
  nombre: 'Aruba: la lista de materiales (ArubaReglas.lineasBom), base contra árbol de trabajo',
  mide: ['public/js/aruba-reglas.js', PAGINA],
  cargar({ desdeRef, actual, ref }) {
    const d = proyeccion();
    const csv = fs.readFileSync(path.join(RAIZ, 'public/datasheets/aruba-lista-precios-hpe.csv'), 'utf8');
    const G = actual(['public/js/aruba-reglas.js', 'public/js/pqc.js']);
    const R = G.ArubaReglas;
    const src = fs.readFileSync(path.join(RAIZ, PAGINA), 'utf8');
    // Las funciones de la página que el bloque llama, del árbol de trabajo. `$` lee el DOM del caso.
    pag = vm.createContext({ ArubaReglas: R, __dom: {}, console });
    vm.runInContext(`
      var $ = (id) => __dom[id] || {};
      var ACCESSORY_CATALOG = {}, ACCESSORY_COMPAT = {}, CENTRAL = {}, CENTRAL_SERIE = {}, SKU_CAT = [];
      ${trozo(src, 'const MEDIOS_OPTICA=', ';\n')}
      ${trozo(src, 'function catAccesorios(){', '}\n')}
      ${trozo(src, 'function opticasPorVelocidad(', '}\n')}
      ${trozo(src, 'function opticasPara(', '\n}\n')}
      ${trozo(src, 'function necesidadesOptica(', '\n}\n')}
      ${trozo(src, 'function leerSfpPick(', '}\n')}
      ${trozo(src, 'function opticaResuelta(', '\n}\n')}
      ${trozo(src, 'function accesoriosInyectados(', '\n}\n')}
      ${trozo(src, 'function interconexionEdgeHA(', '}\n')}
      ${trozo(src, 'function centralParaModelo(', '}\n')}
      ${trozo(src, 'function tierPrice(', '}\n')}
      ${trozo(src, 'function tierSku(', '}\n')}
      ${trozo(src, 'function fmt(m){', '}\n')}
      ${trozo(src, 'const miles=', ';\n')}
      ${trozo(src, 'const famLabel=', ';\n')}
      ${trozo(src, 'const NOMBRE_PUERTO=', ';\n')}
      ${trozo(src, 'function categoriaDeFilaCsv(', '\n}\n')}
      ${trozo(src, 'function parseCsvCatalogo(', '\n}\n')}
      globalThis.__fijar = (x) => { ACCESSORY_CATALOG = x.ACCESSORY_CATALOG; ACCESSORY_COMPAT = x.ACCESSORY_COMPAT;
        CENTRAL = x.CENTRAL; CENTRAL_SERIE = x.CENTRAL_SERIE; SKU_CAT = x.SKU_CAT; };
      globalThis.__p = { necesidadesOptica, opticaResuelta, accesoriosInyectados, leerSfpPick, parseCsvCatalogo };`, pag);
    datos = {
      MODELS: d.models, LICENSES: d.licenses, LICENSES_HA: d.licensesHa || {}, BUNDLES: d.bundles, CARE: d.care,
      CARE_SKU: d.careSkus || {}, CENTRAL: d.centralTiers || {}, CENTRAL_SERIE: d.centralPorSerie || {},
      SKU_CAT: pag.__p.parseCsvCatalogo(csv), SIZING: d.sizing, ACCESSORY_CATALOG: d.accessories || {},
      ACCESSORY_COMPAT: d.accessoryCompat || {}, DTD: d.dtd || null, SSE: d.sse || null,
    };
    pag.__fijar(datos);
    const P = pag.__p;

    // El caso es JSON: el modelo y la licencia de capacidad van por su id.
    const resolver = (c) => {
      const m = datos.MODELS.find((x) => x.id === c.m);
      const capTier = c.capTier && m.licCap ? m.licCap.find((t) => t.code === c.capTier) || null : null;
      pag.__dom = { chkHa: { checked: c.haMarcado }, chkDualPsu: { checked: c.dualPsu },
        sfpPickData: { value: JSON.stringify(c.pick) }, accBtn: {} };
      return { m, capTier };
    };
    const conModulo = (mod) => (c) => {
      const { m, capTier } = resolver(c);
      const r = mod.lineasBom({ m, D: c.D, capTier, haMarcado: c.haMarcado, secMode: c.secMode,
        elegidos: c.elegidos, inyectados: P.accesoriosInyectados(m, c.D), pickSfp: P.leerSfpPick(),
        datos, opticaResuelta: P.opticaResuelta, necesidadesOptica: P.necesidadesOptica });
      const elegidos = { ...c.elegidos };
      r.soltar.forEach((sku) => { delete elegidos[sku]; });
      return { filas: r.filas, elegidos, licHa: r.licHa };
    };

    let viejo;
    const baseR = desdeRef(['public/js/aruba-reglas.js', 'public/js/pqc.js']).ArubaReglas;
    if (typeof baseR.lineasBom === 'function') {
      viejo = conModulo(baseR);
    } else {
      // El bloque de renderBom() de la base, con lo que la función calculaba antes de él.
      const base = execFileSync('git', ['show', `${ref}:${PAGINA}`], { cwd: RAIZ, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
      const bloque = trozo(base, INICIO, FIN);
      vm.runInContext(`
        var LICENSES, LICENSES_HA, BUNDLES, CARE, CARE_SKU, SIZING, DTD, SSE, secMode, accesoriosElegidos;
        globalThis.__viejo = function (__c) {
          ({ LICENSES, LICENSES_HA, BUNDLES, CARE, CARE_SKU, SIZING, DTD, SSE } = __c.datos);
          secMode = __c.secMode; accesoriosElegidos = __c.elegidos;
          const D = __c.D, m = __c.m, capTier = __c.capTier;
          const qty = D.qty, termYrs = D.termYrs;
          const bundle = D.bundle, care = D.care, central = D.central;
          const bwTier = D.tier, bwCode = bwTier ? bwTier.code : null;
          const bloques = D.bloques;
          const esEC = m.fam === 'ec';
          const esVirtual = m.id === 'EC-V';
          const termino = \`término \${termYrs} año\${termYrs > 1 ? 's' : ''}\`;
          void capTier; void bloques;
          ${bloque}
          return { filas, licHa };
        };`, pag, { filename: `${ref}:${PAGINA} (bloque de renderBom)` });
      viejo = (c) => {
        const { m, capTier } = resolver(c);
        const elegidos = { ...c.elegidos };
        const r = pag.__viejo({ datos, secMode: c.secMode, elegidos, D: c.D, m, capTier });
        return { filas: r.filas, elegidos, licHa: r.licHa };
      };
    }
    const nuevo = conModulo(R);
    return {
      viejo,
      nuevo,
      // La mutación: el mismo escenario con otro término (cambia SKU, precio y nota de casi toda fila).
      mutado: (c) => nuevo({ ...c, D: { ...c.D, termYrs: c.D.termYrs === 1 ? 3 : 1 } }),
    };
  },
  casos() {
    let semilla = 20261110;
    const azar = () => { semilla = (semilla * 1103515245 + 12345) % 2147483648; return semilla / 2147483648; };
    const de = (xs) => xs[Math.floor(azar() * xs.length)];
    const skus = Object.keys(datos.ACCESSORY_CATALOG);
    const bundles = ['', ...Object.keys(datos.BUNDLES)];
    const cares = ['', ...Object.keys(datos.CARE)];
    const centrales = ['', ...Object.keys(datos.CENTRAL)];
    const tiers = [null, ...(datos.SIZING.bwTiers || [])];
    const out = [];
    for (const m of datos.MODELS) {
      for (let k = 0; k < 90; k += 1) {
        const nEnl = Math.floor(azar() * 4);
        const wanLinks = Array.from({ length: nEnl }, () => {
          const down = de([0, 50, 300, 1000, 2500, 10000]);
          return { tipo: de(['DIA', 'MPLS L3', 'Broadband', 'LTE']), medio: de(MEDIOS), down, up: de([down, Math.round(down / 2), 0]),
            rol: de(['activo', 'activo', 'respaldo']) };
        });
        const bundle = de(bundles);
        const D = { qty: de([1, 2, 2, 3]), termYrs: de([1, 3, 5, 7]), bundle, care: de(cares), central: de(centrales),
          tier: de(tiers), bloques: de([0, 0, 1, 4, 12]), wanLinks, onprem: bundle === 'onprem',
          users: de([0, '', 25, 300, '40']), aps: de([0, 0, 4, 40]) };
        const elegidos = {};
        for (let i = Math.floor(azar() * 4); i > 0; i -= 1) elegidos[de(skus)] = de([0, 1, 2, 3]);
        const pick = {};
        for (const medio of MEDIOS.slice(1)) if (azar() < 0.5) pick[medio] = de(skus);
        if (azar() < 0.5) pick.EdgeHA = de(skus);
        out.push([{ m: m.id, D, capTier: m.licCap ? de([null, ...m.licCap.map((t) => t.code)]) : null,
          haMarcado: azar() < 0.5, dualPsu: azar() < 0.5, secMode: de(['none', 'dtd', 'sse', 'gwsec', 'none']), elegidos, pick }]);
      }
    }
    return out;
  },
};
