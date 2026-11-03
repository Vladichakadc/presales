'use strict';
// `porQueSinCandidato` y `porQueDe` de `fortinet-explicacion.js`: el módulo de la base contra el del
// árbol de trabajo, sobre resultados del motor actual. Nació para medir la fase 3.2 (PR #110), cuando
// la versión vieja vivía en la página y se extraía de su texto; ya fusionado, vigila que un cambio
// en el módulo no altere la explicación sin decirlo (en CI, `npm run equivalencia -- --todos`). Las
// definiciones que la página le pasa (esc, fmt, cifra, nMil, TIERS, CAMPO_N) salen de la página del
// árbol de trabajo y son las mismas para las dos versiones: lo que se mide es el módulo.
//   npm run equivalencia -- scripts/equivalencias/fortinet-porque.js
const path = require('path');
const vm = require('vm');

const RAIZ = path.join(__dirname, '..', '..');
const PAGINA = 'public/js/dimensionador-fortinet-fortigate.js';
const MODULOS = ['public/js/fortinet-reglas.js', 'public/js/fortinet-explicacion.js', 'public/js/pqc.js', 'public/js/fortinet-motor.js'];

// Un trozo de la página entre dos marcas literales (el final incluido).
function trozo(src, desde, hasta) {
  const i = src.indexOf(desde);
  if (i < 0) throw new Error(`no está «${desde}» en la página`);
  const j = src.indexOf(hasta, i + desde.length);
  if (j < 0) throw new Error(`no está «${hasta}» tras «${desde}»`);
  return src.slice(i, j + hasta.length);
}
// Las definiciones de la página que leen las dos funciones, en el texto de la referencia.
function definiciones(src) {
  return [
    trozo(src, 'const esc = (s) =>', ';\n'),
    trozo(src, 'function fmt(m) {', '\n}\n'),
    trozo(src, 'const nMil = (v) =>', ';\n'),
    trozo(src, 'const cifra = (n) =>', ';\n'),
    trozo(src, 'const TIERS = [', '\n];\n'),
    trozo(src, 'const TIER_BY_K =', ';\n'),
    trozo(src, 'const CAMPO_N = {', '\n};\n'),
  ].join('\n');
}

// El catálogo como lo da el servidor a la página y al motor (el de test/fortinet-motor.test.js).
function catalogo() {
  const f = require(path.join(RAIZ, 'server/seed/legacyData/fortinet.js'));
  const SKUS = require(path.join(RAIZ, 'server/seed/legacyData/fortinetSkus.js'));
  return {
    models: f.MODELS.map((m) => ({ ...m, eol: !m.hwSku, elpN: ((SKUS[m.id] || []).find((x) => x.sku === m.hwSku) || {}).p ?? null })),
    bundles: f.BUNDLES, care: f.CARE, funciones: f.FUNCIONES, serviciosSdwan: f.SERVICIOS_SDWAN, terminos: f.TERMINOS,
    fortios: f.FORTIOS, ems: f.EMS_LICENCIAS, sase: f.SASE_USUARIOS, datasetVersion: 'fortinet@equivalencia',
  };
}

let CAT = null;
let G = null; // el contexto actual: motor que da los resultados y módulo nuevo

module.exports = {
  nombre: 'Fortinet: porQueSinCandidato y porQueDe (fortinet-explicacion.js), base contra árbol de trabajo',
  mide: ['public/js/fortinet-explicacion.js'],
  cargar({ desdeRef, actual }) {
    CAT = catalogo();
    G = actual(MODULOS);
    const base = desdeRef(MODULOS);
    if (typeof base.FortinetExplicacion.porQueDe !== 'function') return { sinBase: 'la base no trae FortinetExplicacion.porQueDe (llegó en el PR #110)' };
    const src = require('fs').readFileSync(path.join(RAIZ, PAGINA), 'utf8');
    const defsCtx = vm.createContext({});
    vm.runInContext(`${definiciones(src)}\nglobalThis.__d = { esc, fmt, cifra, nMil, TIER_BY_K, CAMPO_N };`, defsCtx);
    const D = defsCtx.__d;
    const ctxDe = (rol, extra) => ({ ...D, MODELS: CAT.models, rolSdwan: rol, R: G.FortinetReglas, M: G.FortinetMotor,
      licenciaHa: (m, modo) => G.FortinetExplicacion.licenciaHa(m, modo, false), ...extra });
    const con = (X, ctxPara) => (r) => {
      const ctx = ctxPara(r);
      return [X.porQueSinCandidato(r, ctx), ...r.candidatos.slice(0, 4).map((c) => X.porQueDe(r, c, ctx)), X.porQueDe(r, null, ctx)];
    };
    // La mutación: el rol SD-WAN que no es y los nombres de las capas en mayúsculas.
    const TIER_MAYUS = Object.fromEntries(Object.entries(D.TIER_BY_K).map(([k, t]) => [k, { ...t, n: t.n.toUpperCase() }]));
    return {
      viejo: con(base.FortinetExplicacion, (r) => ctxDe(r.snapshot.topologia.rol)),
      nuevo: con(G.FortinetExplicacion, (r) => ctxDe(r.snapshot.topologia.rol)),
      mutado: con(G.FortinetExplicacion, (r) => ctxDe(r.snapshot.topologia.rol === 'hub' ? 'spoke' : 'hub', { TIER_BY_K: TIER_MAYUS })),
    };
  },
  // Resultados del motor actual sobre escenarios al azar (semilla fija) y los 58 modelos elegidos a mano.
  casos() {
    let semilla = 20261101;
    const azar = () => { semilla = (semilla * 1103515245 + 12345) % 2147483648; return semilla / 2147483648; };
    const de = (xs) => xs[Math.floor(azar() * xs.length)];
    const evaluar = (esc) => G.FortinetMotor.evaluar(esc, CAT, { hoy: '2026-11-01T00:00:00Z' });
    const funciones = ['chkAv', 'chkWeb', 'chkIotDlp', 'chkSsl', 'chkSandbox'];
    const out = [];
    for (let i = 0; i < 1500; i += 1) {
      const rol = de(['none', 'spoke', 'hub']);
      const esc = {
        sitio: { segmento: de(['branch', 'campus', 'dc']) },
        software: { inspeccion: azar() < 0.15 ? 'proxy' : 'flow' },
        topologia: { rol, hubs: 1 + Math.floor(azar() * 3), spokes: 1 + Math.floor(azar() * 400), simultaneidadPct: 35,
          enlaces: [{ id: 1, tipo: 'DIA', down: Math.round(10 ** (1 + azar() * 4)), overlay: rol !== 'none' && azar() < 0.7 }] },
        seguridad: { capa: de(['fw', 'vpn', 'ips', 'ngfw', 'tp']), funciones: funciones.filter(() => azar() < 0.3),
          tlsCifradoPct: Math.round(azar() * 100), tlsExentoPct: Math.round(azar() * 40) },
        remoto: azar() < 0.4 ? { activo: true, metodo: de(['ipsec', 'sslvpn']), usuarios: Math.round(azar() * 2000), mbps: Math.round(azar() * 500), mfa: azar() < 0.5 } : { activo: false },
        escala: { usuarios: Math.round(azar() * 5000), sesionesPorUsuario: Math.round(azar() * 150), vdoms: azar() < 0.2 ? Math.round(azar() * 30) : 0,
          bgpPeers: azar() < 0.2 ? Math.round(azar() * 500) : 0, fortiAps: azar() < 0.2 ? Math.round(azar() * 200) : 0 },
        fisico: { psuRedundante: azar() < 0.2, poeW: azar() < 0.1 ? 120 : 0, registro: de(['ninguno', 'local', 'nube']), registroGbDia: 5, registroDias: 30 },
        disponibilidad: { modo: de(['standalone', 'ha-ap', 'ha-aa']) },
        politica: { crecimientoPct: 30, techoPct: de([100, 80, 70]) },
        comercial: { sandbox: de(['ninguno', 'incluido', 'ai', 'dedicado']) },
      };
      if (esc.comercial.sandbox === 'ninguno') delete esc.comercial.sandbox;
      out.push([evaluar(esc)]);
    }
    // Sin candidato: lo que falta (sin enlaces), un campo inválido y requerimientos por encima del catálogo.
    out.push([evaluar({})], [evaluar({ topologia: { enlaces: [] }, escala: { usuarios: 10 } })]);
    out.push([evaluar({ topologia: { enlaces: [{ id: 1, tipo: 'DIA', down: 100 }] }, politica: { techoPct: 5 } })]);
    for (const down of [2e5, 1e6, 5e6, 2e7]) {
      for (const capa of ['fw', 'ips', 'tp']) {
        out.push([evaluar({ topologia: { rol: 'hub', spokes: 3000, enlaces: [{ id: 1, tipo: 'DIA', down, overlay: true }] },
          seguridad: { capa, funciones: ['chkSsl', 'chkIotDlp'] }, politica: { techoPct: 70 }, escala: { usuarios: 200000, sesionesPorUsuario: 150 } })]);
      }
    }
    for (const m of CAT.models) {
      out.push([evaluar({ topologia: { rol: 'spoke', hubs: 2, enlaces: [{ id: 1, tipo: 'DIA', down: 300, overlay: true }] },
        seguridad: { capa: 'tp', funciones: ['chkSsl'] }, disponibilidad: { modo: 'ha-ap' }, seleccion: { manual: m.id } })]);
    }
    return out;
  },
};
