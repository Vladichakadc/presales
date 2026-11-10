'use strict';
// La lista de materiales de Huawei, `HuaweiMotor.lineasBom` (fase 2 de la auditoría del 2026-11-09, ADR-1,
// corte 5): las filas que `filasBom()` armaba en la página. Mientras la base no traiga la función, la
// versión vieja es esa función tomada tal cual del texto de la página de la base; ya fusionado, vigila el
// motor de la base contra el del PR. Lo que la página le pasa (piezas de `piezasBom`, ópticas válidas de
// `opticasBom`, licencias, soporte Hi-Care, término y precio de referencia) sale del motor del árbol de
// trabajo y es lo MISMO para las dos versiones: lo que se mide son las filas.
//   npm run equivalencia -- scripts/equivalencias/huawei-bom.js
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const RAIZ = path.join(__dirname, '..', '..');
const PAGINA = 'public/js/dimensionador-huawei-netengine.js';
let d = null;
let H = null;

function trozo(src, desde, hasta) {
  const i = src.indexOf(desde);
  if (i < 0) throw new Error(`no está «${desde.slice(0, 60)}» en la página`);
  const j = src.indexOf(hasta, i + desde.length);
  if (j < 0) throw new Error(`no está el final de «${desde.slice(0, 60)}»`);
  return src.slice(i, j + hasta.length);
}

module.exports = {
  nombre: 'Huawei: la lista de materiales (HuaweiMotor.lineasBom), base contra árbol de trabajo',
  mide: ['public/js/huawei-motor.js', PAGINA],
  cargar({ desdeRef, actual, ref }) {
    d = JSON.parse(execFileSync(process.execPath, [path.join(RAIZ, 'scripts/ayuda/proyeccion-dimensionador.js'), 'huawei'],
      { cwd: RAIZ, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 64 * 1024 * 1024 }));
    const G = actual(['public/js/ficha.js', 'public/js/pqc.js', 'public/js/huawei-motor.js']);
    H = G.HuaweiMotor;
    const FICHA = G.FICHA;
    const src = fs.readFileSync(path.join(RAIZ, PAGINA), 'utf8');
    const casillas = vm.runInNewContext(`${trozo(src, 'const CASILLA_REQ = ', ';\n')} CASILLA_REQ`);
    // Lo que la página calcula antes de armar las filas, igual para las dos versiones.
    const preparar = (c) => {
      const m = d.models.find((x) => x.id === c.m);
      const ev = H.evaluar(c.esc, d.models, { rango: FICHA.rango, recomendable: FICHA.recomendable });
      const isWan = m.cls === 'WAN';
      const pick = { m, isWan, cap: isWan ? m.cap : (m.typ ?? m.ipsec ?? m.fwd) };
      const lics = H.licencias(pick, { anios: c.anios, need: ev.need, aps: ev.aps, svc: ev.svc, pk: ev.pk, req: ev.req });
      return { m, lics, piezas: H.piezasBom(m, d.parts, ev), opticas: H.opticasBom(m, c.opticas, d.optics).validas,
        soporte: d.hicare[c.hicare] };
    };
    const conModulo = (mod) => (c) => {
      const x = preparar(c);
      return mod.lineasBom({ m: x.m, qty: c.qty, opticas: x.opticas, piezas: x.piezas, lics: x.lics, soporte: x.soporte,
        anios: c.anios, precioRef: c.precio == null ? undefined : c.precio, datos: { PARTS: d.parts, OPTIC_LABEL: d.opticLabel, CASILLA_REQ: casillas } });
    };
    let viejo;
    const baseH = desdeRef(['public/js/pqc.js', 'public/js/huawei-motor.js']).HuaweiMotor;
    if (typeof baseH.lineasBom === 'function') {
      viejo = conModulo(baseH);
    } else {
      const base = execFileSync('git', ['show', `${ref}:${PAGINA}`], { cwd: RAIZ, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
      const fn = trozo(base, 'function filasBom(m, qty, opticas, piezas, lics, s){', '\n  return filas;\n}\n');
      const ctx = vm.createContext({ PARTS: d.parts, OPTIC_LABEL: d.opticLabel, CASILLA_REQ: casillas, PRECIO_REF: {}, __anios: 1,
        BOM: { normalizar: (x) => x } });
      vm.runInContext(`var aniosSel = () => __anios;\n${fn}\nglobalThis.__filas = filasBom;`, ctx, { filename: `${ref}:${PAGINA} (filasBom)` });
      viejo = (c) => {
        const x = preparar(c);
        ctx.__anios = c.anios;
        ctx.PRECIO_REF = c.precio == null ? {} : { [x.m.id]: c.precio };
        return ctx.__filas(x.m, c.qty, x.opticas, x.piezas, x.lics, x.soporte);
      };
    }
    const nuevo = conModulo(H);
    return {
      viejo,
      nuevo,
      // La mutación: un equipo más (cambia la cantidad de casi toda fila).
      mutado: (c) => nuevo({ ...c, qty: c.qty + 1 }),
    };
  },
  casos() {
    let semilla = 20261110;
    const azar = () => { semilla = (semilla * 1103515245 + 12345) % 2147483648; return semilla / 2147483648; };
    const de = (xs) => xs[Math.floor(azar() * xs.length)];
    const hicare = Object.keys(d.hicare);
    const out = [];
    for (const m of d.models) {
      const fams = m.optics || [];
      for (let k = 0; k < 30; k += 1) {
        const opticas = Array.from({ length: Math.floor(azar() * 3) }, () => {
          const fam = de([...fams, 'otra']);
          const lista = (d.optics[fam] || []);
          return { fam, sku: lista.length ? de(lista).sku : 'NO-EXISTE', qty: String(de([0, 1, 2, 4])) };
        });
        const esc = { bw: de([50, 300, 1000, 5000, 20000]), unit: 1, mode: de(['link', 'agg']), sites: de([1, 20]), conc: 40, head: 30, dirMult: 2,
          frame: 340, profile: de(['fwd', 'ipsec', 'typ']), lan: de([0, 8]), aps: de([0, 16, 200]),
          svc: { sdwan: azar() < 0.5, utm: azar() < 0.3, slice: azar() < 0.2 }, want: { poe: azar() < 0.3, wan: azar() < 0.3, wifi: azar() < 0.3 },
          req: { srv6: azar() < 0.2, mpls: azar() < 0.2, mcast: azar() < 0.2, dsvpn: azar() < 0.2, compresion: azar() < 0.2 },
          ha: azar() < 0.3, pqc: '' };
        out.push([{ m: m.id, esc, opticas, qty: de([1, 2, 5]), anios: de([1, 3, 5]), hicare: de(hicare), precio: de([null, null, 1234, 98765]) }]);
      }
    }
    return out;
  },
};
