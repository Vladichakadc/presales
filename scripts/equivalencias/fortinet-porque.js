'use strict';
// Fase 3.2, segunda entrega (2026-11-01): `porQueSinCandidato` y `porQueDe` salen de la página de
// Fortinet a `fortinet-explicacion.js`. La versión vieja vivía dentro de la página, que no se puede
// ejecutar entera fuera del navegador: se extrae su texto de la referencia (`git show`) y se ejecuta
// con las MISMAS definiciones de la página (esc, fmt, cifra, nMil, TIERS, CAMPO_N), sacadas también de
// la referencia, sobre el motor y las reglas de esa misma referencia. La nueva es la del módulo, con el
// contexto que arma la página. Las dos leen los mismos resultados del motor actual.
//   npm run equivalencia -- scripts/equivalencias/fortinet-porque.js
const { execFileSync } = require('child_process');
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
  nombre: 'Fortinet: porQueSinCandidato y porQueDe, de la página (main) al módulo fortinet-explicacion.js',
  cargar({ desdeRef, actual }) {
    CAT = catalogo();
    G = actual(MODULOS);
    const viejoG = desdeRef(MODULOS);
    const ref = process.argv.find((a) => a.startsWith('--ref='));
    const src = execFileSync('git', ['show', `${ref ? ref.slice(6) : 'origin/main'}:${PAGINA}`], { cwd: RAIZ, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
    const funciones = trozo(src, 'function porQueSinCandidato(r) {', '\n}\n') + trozo(src, 'function porQueDe(r, c) {', '\n}\n');
    // La página vieja: sus definiciones, sus dos funciones y lo que leían de sus globales.
    vm.runInContext(`
      const R = FortinetReglas; const M = FortinetMotor;
      function resumenDescartes(r) { return FortinetExplicacion.resumenDescartes(r); }
      const RESTRICCION_N = FortinetExplicacion.RESTRICCION_N;
      var MODELS = []; var rolSdwan = 'none';
      function licenciaHa(m, modo) { return FortinetExplicacion.licenciaHa(m, modo, false); }
      ${definiciones(src)}
      ${funciones}
      globalThis.__vieja = { porQueSinCandidato, porQueDe, poner(models, rol) { MODELS = models; rolSdwan = rol; },
        defs: { esc, fmt, cifra, nMil, TIER_BY_K, CAMPO_N } };`, viejoG);
    const V = viejoG.__vieja;
    V.poner(CAT.models, 'none');
    // La nueva: el módulo actual con el contexto que arma la página (mismas definiciones, mismos datos).
    const ctxDe = (rol) => ({ ...V.defs, MODELS: CAT.models, rolSdwan: rol, R: G.FortinetReglas, M: G.FortinetMotor,
      licenciaHa: (m, modo) => G.FortinetExplicacion.licenciaHa(m, modo, false) });
    const viejo = (r) => {
      V.poner(CAT.models, r.snapshot.topologia.rol);
      return [V.porQueSinCandidato(r), ...r.candidatos.slice(0, 4).map((c) => V.porQueDe(r, c)), V.porQueDe(r, null)];
    };
    const nuevo = (r) => {
      const X = G.FortinetExplicacion;
      const ctx = ctxDe(r.snapshot.topologia.rol);
      return [X.porQueSinCandidato(r, ctx), ...r.candidatos.slice(0, 4).map((c) => X.porQueDe(r, c, ctx)), X.porQueDe(r, null, ctx)];
    };
    // La mutación: el rol SD-WAN que no es (cambia el texto del overlay en `porQueDe`) y los nombres de
    // las capas en mayúsculas (cambia el requerimiento que dicen las dos funciones).
    const TIER_MAYUS = Object.fromEntries(Object.entries(V.defs.TIER_BY_K).map(([k, t]) => [k, { ...t, n: t.n.toUpperCase() }]));
    const mutado = (r) => {
      const X = G.FortinetExplicacion;
      const ctx = { ...ctxDe(r.snapshot.topologia.rol === 'hub' ? 'spoke' : 'hub'), TIER_BY_K: TIER_MAYUS };
      return [X.porQueSinCandidato(r, ctx), ...r.candidatos.slice(0, 4).map((c) => X.porQueDe(r, c, ctx)), X.porQueDe(r, null, ctx)];
    };
    return { viejo, nuevo, mutado };
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
