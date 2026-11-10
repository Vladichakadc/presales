'use strict';
// La lista de materiales de MikroTik, `MikrotikMotor.lineasBom` (fase 2 de la auditoría del 2026-11-09,
// ADR-1, corte 5): las filas que renderBom() armaba entre el pintado. Mientras la base no traiga la
// función, la versión vieja es el bloque de renderBom() tomado tal cual del texto de la página de la base;
// ya fusionado, vigila el motor de la base contra el del PR. Lo que la página lee del DOM o calcula aparte
// (módulos de los enlaces, ópticas adicionales, AP, fuente de PoE, soporte, capacitación) llega igual a
// las dos versiones: lo que se mide son las filas.
//   npm run equivalencia -- scripts/equivalencias/mikrotik-bom.js
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const RAIZ = path.join(__dirname, '..', '..');
const PAGINA = 'public/js/dimensionador-mikrotik-routeros.js';
const INICIO = "  const filas=[\n    {cat:'Equipo', desc:m.id, sku:null, qty, unit:m.elpN!=null?m.elpN:null,";
const FIN = '    nota:SUPPORT.training.d});\n';
let d = null;

function trozo(src, desde, hasta) {
  const i = src.indexOf(desde);
  if (i < 0) throw new Error(`no está «${desde.slice(0, 60)}» en la página`);
  const j = src.indexOf(hasta, i + desde.length);
  if (j < 0) throw new Error(`no está el final de «${desde.slice(0, 60)}»`);
  return src.slice(i, j + hasta.length);
}

module.exports = {
  nombre: 'MikroTik: la lista de materiales (MikrotikMotor.lineasBom), base contra árbol de trabajo',
  mide: ['public/js/mikrotik-motor.js', PAGINA],
  cargar({ desdeRef, actual, ref }) {
    d = JSON.parse(execFileSync(process.execPath, [path.join(RAIZ, 'scripts/ayuda/proyeccion-dimensionador.js'), 'mikrotik'],
      { cwd: RAIZ, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 64 * 1024 * 1024 }));
    const G = actual(['public/js/pqc.js', 'public/js/mikrotik-motor.js']);
    const M = G.MikrotikMotor;
    const src = fs.readFileSync(path.join(RAIZ, PAGINA), 'utf8');
    const lvlTxt = vm.runInNewContext(`${trozo(src, 'const lvlTxt=', ';\n')} lvlTxt`);
    const preparar = (c) => {
      const m = d.models.find((x) => x.id === c.m);
      const ap = c.ap.modelo == null ? undefined : d.accessPoints.find((a) => a.sku === c.ap.modelo) || d.accessPoints[0];
      return { m, lic: d.sizing.licenseLevels[m.lvl] || {}, ap, support: d.support[c.supCode] };
    };
    const conModulo = (mod) => (c) => {
      const x = preparar(c);
      return mod.lineasBom({ m: x.m, qty: c.qty, enlaces: c.enlaces, optics: c.optics, ap: { qty: c.ap.qty, modelo: x.ap, manual: c.ap.manual },
        poe: c.poe, licencia: x.lic, nivel: lvlTxt(x.m), soporte: { support: x.support, supCode: c.supCode }, training: c.training,
        datos: { APS: d.accessPoints, SUPPORT: d.support } });
    };
    let viejo;
    const baseM = desdeRef(['public/js/pqc.js', 'public/js/mikrotik-motor.js']).MikrotikMotor;
    if (typeof baseM.lineasBom === 'function') {
      viejo = conModulo(baseM);
    } else {
      const base = execFileSync('git', ['show', `${ref}:${PAGINA}`], { cwd: RAIZ, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
      const bloque = trozo(base, INICIO, FIN);
      const ctx = vm.createContext({ M, fmt: M.fmt, lvlTxt, APS: d.accessPoints, SUPPORT: d.support, __c: null, __dom: {} });
      vm.runInContext(`
        var $ = (id) => __dom[id] || {};
        var enlacesBom = () => __c.enlaces, fuentePoe = () => __c.poe.fuente;
        globalThis.__viejo = function (m, qty, optics, apQty, ap, apManual, lic, support, supCode) {
          const isChr = m.ser === 'CHR';
          ${bloque}
          return filas;
        };`, ctx, { filename: `${ref}:${PAGINA} (bloque de renderBom)` });
      viejo = (c) => {
        const x = preparar(c);
        ctx.__c = c;
        ctx.__dom = { chkCapsman: { checked: c.poe.capsman }, chkPoe: { checked: c.poe.poe }, apModel: { value: c.poe.apModel },
          apCount: { value: c.poe.apCount }, chkTraining: { checked: c.training } };
        return ctx.__viejo(x.m, c.qty, c.optics, c.ap.qty, x.ap, c.ap.manual, x.lic, x.support, c.supCode);
      };
    }
    const nuevo = conModulo(M);
    return {
      viejo,
      nuevo,
      // La mutación: un router más (cambia la cantidad del equipo, las ópticas y la licencia).
      mutado: (c) => nuevo({ ...c, qty: c.qty + 1 }),
    };
  },
  casos() {
    let semilla = 20261110;
    const azar = () => { semilla = (semilla * 1103515245 + 12345) % 2147483648; return semilla / 2147483648; };
    const de = (xs) => xs[Math.floor(azar() * xs.length)];
    const opticas = Object.values(d.optics).flat();
    const aps = d.accessPoints.map((a) => a.sku);
    const soportes = Object.keys(d.support).filter((k) => k !== 'training');
    const out = [];
    for (const m of d.models) {
      for (let k = 0; k < 60; k += 1) {
        const enlaces = Array.from({ length: Math.floor(azar() * 3) }, (_, i) => {
          const o = de([null, ...opticas]);
          return { sku: o ? o.sku : null, precio: o ? o.price ?? null : null, d: o ? o.d || '' : '', kit: azar() < 0.2,
            ns: [i + 1], puertos: [de(['sfp1', 'sfp-sfpplus1', 'ether1'])] };
        });
        out.push([{ m: m.id, qty: de([1, 2, 4]),
          enlaces, optics: Array.from({ length: Math.floor(azar() * 3) }, () => ({ cat: 'x', qty: de([1, 2]), optic: de(opticas) })),
          ap: { qty: de([0, 0, 2, 8]), modelo: de([null, ...aps]), manual: azar() < 0.3 },
          poe: { fuente: de(['caja', '48']), capsman: azar() < 0.5, poe: azar() < 0.5, apModel: de(aps), apCount: String(de([0, 2, 6])) },
          supCode: de(soportes), training: azar() < 0.3 }]);
      }
    }
    return out;
  },
};
