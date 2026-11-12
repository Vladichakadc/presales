'use strict';
/* LOS MOTORES DE NOKIA, FUERA DE LAS PAGINAS (fase 2 de la auditoria del 2026-11-09, ADR-1, corte 4).
   `NokiaSrMotor` (7750 SR / 7250 IXR) y `NokiaFabricMotor` (el fabric 7220 IXR) vivian dentro de sus
   paginas, y el resultado dependia del orden en que llegaba el catalogo: el 7750 ordenaba por capacidad
   sin desempate (el SR-1x-48D y el SR-1x-92S dan 6 Tbps) y el fabric tomaba el primer leaf y el primer
   spine de la lista. Que los motores dan lo mismo que las paginas sobre el catalogo servido lo miden
   scripts/equivalencias/nokia-sr.js y nokia-fabric.js; aqui, lo que prometen por si mismos. */
const test = require('node:test');
const assert = require('node:assert');
const NSM = require('../public/js/nokia-sr-motor.js');
const NFM = require('../public/js/nokia-fabric-motor.js');
const { MODELS, MODELS_ROUTER, PLATAFORMAS } = require('../server/seed/legacyData/nokia.js');
const { cargar } = require('./ayuda/navegador.js');

const { FICHA } = cargar('public/js/ficha.js');
const opciones = { rango: FICHA.rango, recomendar: FICHA.recomendar };
const baraje = (semilla) => (a) => {
  let s = semilla;
  const rnd = () => { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648; };
  const b = a.slice();
  for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; }
  return b;
};

test('7750: en empate de capacidad manda el id en orden natural, no el orden del catalogo', () => {
  const dos = MODELS_ROUTER.filter((m) => m.id === '7750 SR-1x-48D' || m.id === '7750 SR-1x-92S');
  assert.strictEqual(dos.length, 2);
  assert.strictEqual(dos[0].cap, dos[1].cap, 'el empate sigue en el catalogo');
  for (const lista of [dos, [...dos].reverse()]) {
    assert.deepStrictEqual(NSM.ordenar(lista, () => 0).map((m) => m.id), ['7750 SR-1x-48D', '7750 SR-1x-92S']);
  }
});

test('7750: barajar el catalogo no cambia el requerimiento, el recomendado ni el orden', () => {
  for (const bw of [10, 400, 2400, 6000, 50000]) {
    for (const familia of ['all', ...Object.keys(PLATAFORMAS)]) {
      for (const [portQty, portVel] of [[0, 100], [12, 400]]) {
        const esc = { bw, head: 0.3, familia, portQty, portVel, pqc: '' };
        const base = NSM.evaluar(esc, { models: MODELS_ROUTER }, opciones);
        for (const semilla of [1, 7, 42]) {
          const otro = NSM.evaluar(esc, { models: baraje(semilla)(MODELS_ROUTER) }, opciones);
          assert.deepStrictEqual(otro.candidatos.map((m) => m.id), base.candidatos.map((m) => m.id), JSON.stringify(esc));
          assert.strictEqual(otro.recomendado && otro.recomendado.id, base.recomendado && base.recomendado.id);
        }
      }
    }
  }
});

test('7750: el requerimiento es el de la pagina, y un caudal negativo cuenta como ninguno', () => {
  assert.strictEqual(NSM.demanda({ bw: 1000, head: 0.3 }).need, 1300);
  assert.strictEqual(NSM.demanda({ bw: -6, head: 0.3 }).need, 0);
  const r = NSM.evaluar({ bw: 1000, head: 0.3, familia: 'all', portQty: 0, portVel: 100 }, { models: MODELS_ROUTER }, opciones);
  assert.strictEqual(r.version, NSM.VERSION_MOTOR);
  assert.strictEqual(r.need, 1300);
  assert.ok(r.candidatos.every((m) => m.cap >= 1300));
});

test('7220: barajar el catalogo no cambia el leaf, el spine ni las cantidades', () => {
  for (const servers of [10, 48, 500]) {
    for (const accesoVel of [10, 25, 100]) {
      for (const oversub of [1, 3]) {
        const esc = { servers, accesoVel, dual: true, oversub };
        const base = NFM.evaluar(esc, { models: MODELS });
        for (const semilla of [1, 7, 42]) {
          const otro = NFM.evaluar(esc, { models: baraje(semilla)(MODELS) });
          assert.deepStrictEqual({ ...otro, leaf: otro.leaf && otro.leaf.id, spine: otro.spine && otro.spine.id },
            { ...base, leaf: base.leaf && base.leaf.id, spine: base.spine && base.spine.id }, JSON.stringify(esc));
        }
      }
    }
  }
});

test('7220: el sobre trae la version del motor y el motivo cuando no hay fabric posible', () => {
  const r = NFM.evaluar({ servers: 48, accesoVel: 25, dual: true, oversub: 3 }, { models: MODELS });
  assert.strictEqual(r.version, NFM.VERSION_MOTOR);
  assert.strictEqual(r.ok, true);
  const no = NFM.evaluar({ servers: 48, accesoVel: 7, dual: false, oversub: 3 }, { models: MODELS });
  assert.strictEqual(no.ok, false);
  assert.match(no.motivo, /7 GbE/);
});

test('7220 IXR: el desplegable de acceso ofrece exactamente las velocidades que publica algún leaf del catálogo', () => {
  // La página ofrecía «1 GbE», que ningún modelo trae: elegirlo daba «sin diseño posible» (PR #182).
  const html = require('fs').readFileSync(require('path').join(__dirname, '..', 'public/dimensionador-nokia-7220ixr.html'), 'utf8');
  const sel = html.slice(html.indexOf('<select id="accesoVel">'), html.indexOf('</select>', html.indexOf('<select id="accesoVel">')));
  const ofrecidas = [...sel.matchAll(/<option value="(\d+)"/g)].map((m) => Number(m[1]));
  const publicadas = NFM.velocidadesAcceso(MODELS);
  assert.ok(publicadas.length > 0);
  assert.deepStrictEqual(ofrecidas, publicadas, 'una opción sin modelo da «sin diseño», y una velocidad publicada sin opción no se puede pedir');
  for (const v of ofrecidas) assert.ok(NFM.evaluar({ servers: 48, accesoVel: v, dual: false, oversub: 3 }, { models: MODELS }).ok, `${v} GbE da diseño`);
});
