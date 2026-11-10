'use strict';
// La lista de materiales de Cisco, `CiscoMotor.lineasBom` (fase 2 de la auditoría del 2026-11-09, ADR-1,
// corte 3): las filas que renderBom() armaba entre el pintado. Mientras la base no traiga la función, la
// versión vieja es el bloque de renderBom() tomado tal cual del texto de la página de la base; ya
// fusionado, vigila el motor de la base contra el del PR. Lo que la página calcula fuera del bloque y le
// pasa (módulos de su guía, referencia, fin de venta vencido, opciones de licencia, firewall dedicado,
// Secure Access) sale del árbol de trabajo y es lo MISMO para las dos versiones: lo que se mide son las
// filas y los avisos de puertos y de licencias.
//   npm run equivalencia -- scripts/equivalencias/cisco-bom.js
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const RAIZ = path.join(__dirname, '..', '..');
const PAGINA = 'public/js/dimensionador-cisco-catalyst8k.js';
const INICIO = "  const filas = [\n    {cat:'Equipo', desc:m.id, sku:pidDe(m), qty,";
const FIN = "  if(sn) filas.push({cat:'Soporte', desc:sn.n, sku:null, qty, unit:null, nota:";

function trozo(src, desde, hasta) {
  const i = src.indexOf(desde);
  if (i < 0) throw new Error(`no está «${desde.slice(0, 60)}» en la página`);
  const j = src.indexOf(hasta, i + desde.length);
  if (j < 0) throw new Error(`no está el final de «${desde.slice(0, 60)}»`);
  return src.slice(i, j + hasta.length);
}

let datos = null;
let M = null;

module.exports = {
  nombre: 'Cisco: la lista de materiales (CiscoMotor.lineasBom), base contra árbol de trabajo',
  mide: ['public/js/cisco-motor.js', PAGINA],
  cargar({ desdeRef, actual, ref }) {
    const d = JSON.parse(execFileSync(process.execPath, [path.join(RAIZ, 'scripts/ayuda/proyeccion-dimensionador.js'), 'cisco'],
      { cwd: RAIZ, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 64 * 1024 * 1024 }));
    datos = { MODELS: d.models, OPTICS: d.optics, OPTIC_LABEL: d.opticLabel, PARTS_DESC: d.partsDesc, SMARTNET: d.smartnet,
      LIC_G2: d.licenciasG2 || {}, LIC_DNA: d.licenciasDna || null, MOD_G2: d.modulosG2 || [], MOD_C8K: d.modulosC8k || [],
      SA: d.secureAccess || null, SFW: d.secureFirewall || null, CELULAR: d.celular || {} };
    const G = actual(['public/js/ficha.js', 'public/js/pqc.js', 'public/js/cisco-motor.js']);
    M = G.CiscoMotor;
    const src = fs.readFileSync(path.join(RAIZ, PAGINA), 'utf8');
    // Lo que la página calcula fuera del bloque, de su propio texto. `$` lee lo elegido en el caso.
    const pag = vm.createContext({ M, FICHA: G.FICHA, __dom: {}, console, ...datos });
    vm.runInContext(`
      var $ = (id) => __dom[id] || { value: '' };
      var crit = 'low', __lic = null, __fw = null, __sa = null;
      var opcionesLicencia = () => __lic, firewallDe = () => __fw, lineasSecureAccess = () => __sa;
      ${trozo(src, 'const pidDe = ', '|| null;\n')}
      ${trozo(src, 'const vencido = ', ';\n')}
      ${trozo(src, 'const miles = ', ';\n')}
      ${trozo(src, 'const CASILLA_REQ = ', ';\n')}
      ${trozo(src, 'const CASILLA_LIC = ', ';\n')}
      ${trozo(src, 'const CASILLA_SA = ', ';\n')}
      ${trozo(src, 'const PIM_SKUS = ', ';\n')}
      ${trozo(src, 'function catalogoPuertos(){', '}\n')}
      ${trozo(src, 'function modulosDe(m){', '\n}\n')}
      ${trozo(src, 'function modulosElegidos(m){', '\n}\n')}
      globalThis.__p = { pidDe, vencido, PIM_SKUS, catalogoPuertos, modulosDe, modulosElegidos,
        CASILLA_REQ, CASILLA_LIC, CASILLA_SA };
      globalThis.__fijar = (c) => { crit = c.crit; __lic = c.licencia; __fw = c.firewall; __sa = c.secureAccess; };`, pag);
    const P = pag.__p;

    // Del caso (JSON) a lo que recibe la lista: el equipo, los parámetros con su catálogo de puertos y lo
    // que la página calcula con el DOM (licencia, firewall dedicado, Secure Access), igual para las dos.
    const preparar = (c) => {
      const m = datos.MODELS.find((x) => x.id === c.m);
      pag.__dom = { pickModel: { value: m.id }, modNim: { value: c.sel.nim }, modSm: { value: c.sel.sm },
        modPim: { value: c.sel.pim }, optSel: { value: c.sel.opt } };
      const p = { ...c.p, catalogo: P.catalogoPuertos() };
      const dem = M.demanda(p);
      const licencia = { gestion: c.lic.gestion, nivel: c.lic.nivel, seguridad: p.seguridad, url: c.lic.url, malware: c.lic.malware,
        anios: c.anios || 1, trafico: M.traficoLicencia(dem, p), vpns: c.lic.vpns, modulos: P.modulosElegidos(m) };
      const firewall = p.seguridad === 'desacoplada'
        ? M.firewallDedicado(dem, { capa: c.fwCapa, tls: p.tls, sesiones: (p.escala || {}).sesiones }, datos.SFW) : null;
      const secureAccess = p.seguridad === 'sse' ? M.secureAccess(c.sa, dem, datos.SA) : { filas: [], avisos: [] };
      return { m, p, licencia, firewall, secureAccess, mods: P.modulosDe(m) };
    };
    const conModulo = (mod) => (c) => {
      const x = preparar(c);
      const r = mod.lineasBom({ m: x.m, p: x.p, sedesQty: c.sedesQty, anios: c.anios, optQty: c.optQty, mods: x.mods, crit: c.crit,
        sel: c.sel, pid: P.pidDe(x.m), vencido: P.vencido(x.m), licencia: x.licencia, firewall: x.firewall, secureAccess: x.secureAccess,
        datos: { CELULAR: datos.CELULAR, OPTICS: datos.OPTICS, OPTIC_LABEL: datos.OPTIC_LABEL, PARTS_DESC: datos.PARTS_DESC,
          SMARTNET: datos.SMARTNET, LIC_G2: datos.LIC_G2, LIC_DNA: datos.LIC_DNA, PIM_SKUS: [...P.PIM_SKUS()],
          CASILLA_REQ: P.CASILLA_REQ, CASILLA_LIC: P.CASILLA_LIC, CASILLA_SA: P.CASILLA_SA } });
      return { filas: r.filas, avisosPuertos: r.avisosPuertos, avisosLic: r.avisosLic };
    };

    let viejo;
    const baseM = desdeRef(['public/js/pqc.js', 'public/js/cisco-motor.js']).CiscoMotor;
    if (typeof baseM.lineasBom === 'function') {
      viejo = conModulo(baseM);
    } else {
      const base = execFileSync('git', ['show', `${ref}:${PAGINA}`], { cwd: RAIZ, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
      const bloque = trozo(base, INICIO, '\n');
      const resto = base.slice(base.indexOf(bloque) + bloque.length);
      const cola = resto.slice(0, resto.indexOf(FIN)) + trozo(resto, FIN, '\n');
      vm.runInContext(`
        globalThis.__viejo = function (__c) {
          const m = __c.m, p = __c.p, sedesQty = __c.sedesQty, anios = __c.anios, optQty = __c.optQty, mods = __c.mods;
          const qty = sedesQty * (p.ha ? 2 : 1);
          const g2 = m.lic === 'cswan';
          __fijar(__c);
          ${bloque}${cola}
          return { filas, avisosPuertos, avisosLic: lic.avisos };
        };`, pag, { filename: `${ref}:${PAGINA} (bloque de renderBom)` });
      viejo = (c) => {
        const x = preparar(c);
        const r = pag.__viejo({ ...x, sedesQty: c.sedesQty, anios: c.anios, optQty: c.optQty, crit: c.crit });
        return { filas: r.filas, avisosPuertos: r.avisosPuertos, avisosLic: r.avisosLic };
      };
    }
    const nuevo = conModulo(M);
    return {
      viejo,
      nuevo,
      // La mutación: una sede más (cambia la cantidad de casi toda fila).
      mutado: (c) => nuevo({ ...c, sedesQty: c.sedesQty + 1 }),
    };
  },
  casos() {
    let semilla = 20261110;
    const azar = () => { semilla = (semilla * 1103515245 + 12345) % 2147483648; return semilla / 2147483648; };
    const de = (xs) => xs[Math.floor(azar() * xs.length)];
    const entregas = Object.keys(M.ENTREGAS);
    const fibras = Object.keys(M.FIBRAS);
    const out = [];
    for (const m of datos.MODELS) {
      const mods = M.modulosEquipo(m, { optics: datos.OPTICS, modulosG2: datos.MOD_G2, modulosC8k: datos.MOD_C8K }).lista;
      const deTipo = (en) => ['', ...mods.filter((x) => x.en === en).map((x) => x.sku)];
      const opticas = ['', ...(m.optics || []).flatMap((k) => (datos.OPTICS[k] || []).map((o) => `${k}|${o.sku}`))];
      for (let k = 0; k < 45; k += 1) {
        const modo = de(['link', 'link', 'link', 'hub']);
        const enlaces = Array.from({ length: Math.floor(azar() * 4) }, () => {
          const tipo = de(['internet', 'internet', 'mpls', 'celular']);
          return tipo === 'celular'
            ? { tipo, rol: de(['principal', 'respaldo']), bajada: de(['', '50', '300', '1000']), subida: de(['', '20', '100']) }
            : { tipo, rol: de(['principal', 'respaldo']), entrega: de(entregas), fibra: de(['', ...fibras]), km: de(['', '0.3', '2', '40']) };
        });
        const ha = modo === 'link' && azar() < 0.3;
        const seguridad = modo === 'link' ? de(['ninguna', 'onbox', 'desacoplada', 'sse']) : 'ninguna';
        const p = { modo, bwMbps: de([20, 100, 500, 1000, 2500, 10000]), dirMult: de([1, 2]), sedes: de([1, 20]), concPct: 60,
          headPct: de([0, 30]), diaPct: modo === 'hub' ? 0 : de([0, 30, 70]), fecPct: de([0, 0, 10]), dupPct: de([0, 0, 25]),
          perfil: de(Object.keys(M.PERFILES)), plataforma: de(Object.keys(M.PLATAFORMAS)), seguridad,
          tls: modo === 'link' && azar() < 0.2,
          escala: { tuneles: de([0, 50, 2000]), rutas: de([0, 1000, 100000]), sesiones: de([0, 10000, 500000]), dispositivos: de([0, 50]) },
          enlaces, topologia: { topologia: de(['', 'hub', 'malla']), sedes: de(['', '20']), hubs: de(['', '2']), colores: de(['', '2']),
            coloresHub: de(['', '3']), ven: azar() < 0.3 },
          requisitos: { dualPsu: azar() < 0.3, celular: azar() < 0.3, nim: azar() < 0.2, sm: azar() < 0.2, macsec: azar() < 0.2,
            poe: azar() < 0.2, poeW: de([0, 30, 120]), appqoe: azar() < 0.2, appqoeConexiones: de([0, 500]), pqc: de(['', 'clave', 'mlkem']) },
          ha, haTloc: ha && azar() < 0.5 };
        out.push([{ m: m.id, p, sedesQty: de([1, 1, 3]), anios: de([1, 3, 5]), optQty: de([0, 0, 2]), crit: de(['low', 'med', 'high', 'crit']),
          sel: { nim: de(deTipo('nim')), sm: de(deTipo('sm')), pim: de(deTipo('pim')), opt: de(opticas) },
          lic: { gestion: de(['sdwan', 'autonomo']), nivel: de(['', 'essentials', 'advantage', 'premier']), url: azar() < 0.3,
            malware: azar() < 0.3, vpns: de([0, 5, 20]) },
          fwCapa: de(['fwAvc', 'ips', 'tls']),
          sa: { licencia: de(['essentials', 'advantage']), nivel: de(['', 'priv']), usuarios: de([0, 100, 2000]),
            privado: azar() < 0.5, ips: azar() < 0.5 } }]);
      }
    }
    return out;
  },
};
