'use strict';
// Juniper: qué equipo se recomienda y en qué orden salen los candidatos (`JuniperMotor.evaluar`, fase 2
// de la auditoría del 2026-11-09, ADR-1, corte 2), en las tres preguntas de la página: la plataforma
// SRX, el Session Smart Router y el SRX desacoplado que inspecciona por un SSR. Mientras la base no
// traiga `evaluar`, la versión vieja son las tres líneas que la página repetía en cada sitio (filtro
// del motor, `FICHA.ordenar` por la cifra de la capa y `FICHA.recomendar`) con su cuenta de la
// demanda; ya fusionado, vigila el motor de la base contra el del PR. El catálogo va en el orden en
// que lo sirve la ruta: con él, el desempate nuevo no tiene que cambiar nada (el único empate que
// llega a decidir, SRX380 y SRX1500 a 2.000 Mbps de IPS, lo resuelve antes el ciclo de vida).
// FICHA y PQC salen del árbol de trabajo y son los mismos para las dos versiones.
//   npm run equivalencia -- scripts/equivalencias/juniper-orden.js
const { execFileSync } = require('child_process');
const path = require('path');

const RAIZ = path.join(__dirname, '..', '..');
let cat = null;

const forma = (r) => ({ need: r.need, sessNeed: r.sessNeed == null ? null : r.sessNeed,
  recomendado: r.recomendado ? r.recomendado.id : null, orden: r.candidatos.map((m) => m.id),
  sinCifra: r.apartados.sinCifra, outBySess: r.apartados.outBySess == null ? null : r.apartados.outBySess,
  outByPqc: (r.apartados.outByPqc || []).map((x) => x.id) });

module.exports = {
  nombre: 'Juniper: el recomendado y el orden de candidatos (JuniperMotor.evaluar), base contra árbol de trabajo',
  mide: ['public/js/juniper-motor.js', 'public/js/dimensionador-juniper-srx.js'],
  cargar({ desdeRef, actual }) {
    const d = JSON.parse(execFileSync(process.execPath, [path.join(RAIZ, 'scripts/ayuda/proyeccion-dimensionador.js'), 'juniper'],
      { cwd: RAIZ, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 64 * 1024 * 1024 }));
    cat = { srx: d.models, ssr: d.sdwan || [] };
    const G = actual(['public/js/ficha.js', 'public/js/pqc.js', 'public/js/juniper-motor.js']);
    const FICHA = G.FICHA;
    const opciones = { rango: FICHA.rango, recomendar: FICHA.recomendar };
    const nuevo = (esc) => forma(G.JuniperMotor.evaluar(esc, cat, opciones));
    const baseJM = desdeRef(['public/js/pqc.js', 'public/js/juniper-motor.js']).JuniperMotor;
    let viejo;
    if (typeof baseJM.evaluar === 'function') {
      viejo = (esc) => forma(baseJM.evaluar(esc, cat, opciones));
    } else {
      // Lo que hacía la página: el filtro del motor de la base, y el orden y la recomendación de FICHA.
      const pagina = (base, k, r) => {
        const candidatos = FICHA.ordenar(r.candidatos, (a, b) => a[k] - b[k]);
        return { ...base, candidatos, recomendado: FICHA.recomendar(candidatos), apartados: r };
      };
      viejo = (esc) => {
        if (esc.plat === 'ssr') {
          const dem = baseJM.demandaSsr(esc);
          return forma(pagina({ need: dem.need }, dem.capa.k, baseJM.candidatosSsr(cat.ssr, dem.capa.k, dem.need, esc.pqc)));
        }
        if (esc.plat === 'inspeccion') {
          const insp = baseJM.inspeccionSrx(esc);
          return forma(pagina({ need: insp.need }, esc.k, baseJM.candidatosSrx(cat.srx, esc.k, insp.need, 0)));
        }
        const head = esc.head;
        const need = Math.round(esc.bwMbps * (1 + head));
        const sessNeed = esc.users && esc.sesUser ? Math.round(esc.users * esc.sesUser * (1 + head)) : 0;
        return forma(pagina({ need, sessNeed }, esc.k, baseJM.candidatosSrx(cat.srx, esc.k, need, sessNeed, esc.pqc)));
      };
    }
    return {
      viejo,
      nuevo,
      // La mutación: el triple de caudal (cambia la demanda, los candidatos y el recomendado).
      mutado: (esc) => nuevo({ ...esc, bwMbps: esc.bwMbps * 3 }),
    };
  },
  casos() {
    const out = [];
    const BW = [10, 50, 100, 250, 500, 1000, 1500, 2000, 3000, 5000, 10000, 20000, 40000];
    for (const bwMbps of BW) {
      for (const k of ['fwImix', 'vpn', 'ips', 'atp']) {
        for (const head of [0, 0.2, 0.3]) {
          for (const [users, sesUser] of [[0, 0], [200, 30], [5000, 50], [20000, 100]]) {
            for (const pqc of ['', 'clave', 'mlkem']) out.push([{ plat: 'srx', bwMbps, head, users, sesUser, k, pqc }]);
          }
        }
      }
      for (const rol of ['sucursal', 'hub']) {
        for (const cifrado of ['plano', 'cif', 'hmac']) {
          for (const dupPct of [0, 30]) {
            for (const pqc of ['', 'clave', 'mlkem']) {
              const ssr = { rol, bwMbps, spokes: rol === 'hub' ? 40 : 0, simultPct: 60, breakoutPct: 70, cifrado, dupPct,
                headroomPct: 30, alcance: 'todo' };
              out.push([{ ...ssr, plat: 'ssr', pqc }]);
            }
          }
          for (const alcance of ['todo', 'dia']) {
            for (const k of ['fwImix', 'ips', 'atp']) {
              out.push([{ rol, bwMbps, spokes: rol === 'hub' ? 40 : 0, simultPct: 60, breakoutPct: 70, cifrado, dupPct: 0,
                headroomPct: 30, alcance, plat: 'inspeccion', k }]);
            }
          }
        }
      }
    }
    return out;
  },
};
