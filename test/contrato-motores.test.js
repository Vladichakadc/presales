'use strict';
/* LA BATERÍA ÚNICA DEL CONTRATO DE MOTOR (ADR-1 de la auditoría del 2026-11-09; 2026-11-12). Los ocho
   motores se llaman con la misma firma, `evaluar(escenario, catalogo, opciones)`, por
   server/services/contratoMotores.js, y una sola batería les exige el mismo sobre sobre el catálogo que
   sirve cada ruta: versión, candidatos ordenados, recomendado y apartados. Lo que una envoltura no puede
   hacer es decidir: el recomendado sale de los candidatos, nunca está fuera de venta, nada está a la vez
   entre los candidatos y entre los apartados, y barajar el catálogo no cambia el recomendado. */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const C = require('../server/services/contratoMotores');
const proyeccion = require('../server/services/catalogProjection');
const E = require('../scripts/equivalencia');
const casoAruba = require('../scripts/equivalencias/aruba-orden');
const casoJuniper = require('../scripts/equivalencias/juniper-orden');

const FICHA = E.actual(['public/js/ficha.js']).FICHA;
const DE_FICHA = { rango: FICHA.rango, recomendar: FICHA.recomendar, recomendable: FICHA.recomendable };
const cadaN = (lista, n) => lista.filter((_, i) => i % n === 0);
const BW = [10, 100, 500, 2000, 10000];

// Cada fabricante: su catálogo (la proyección de su ruta) y sus escenarios, [escenario, catalogo, opciones].
const FABRICANTES = {
  async fortinet() {
    const cat = await proyeccion.toDimensionadorFortinet();
    const out = [];
    for (const segmento of ['branch', 'campus', 'dc']) for (const capa of ['fw', 'tp']) for (const bw of BW) {
      out.push([{ sitio: { segmento }, topologia: { rol: 'spoke', hubs: 1, enlaces: [{ id: 1, tipo: 'DIA', down: bw, overlay: true }] },
        trafico: { interVlanMbps: bw / 4 }, seguridad: { capa, funciones: capa === 'tp' ? ['chkAv', 'chkWeb'] : [] },
        remoto: { activo: false }, escala: { usuarios: 200, sesionesPorUsuario: 50, vidaSesionS: 30 },
        politica: { crecimientoPct: 30, techoPct: 70 } }, cat, { hoy: '2026-11-12T00:00:00Z' }]);
    }
    return { cat, casos: out };
  },
  async cisco() {
    const cat = await proyeccion.toDimensionadorCisco();
    const M = C.MOTORES.cisco.motor;
    const out = [];
    for (const plataforma of ['xe', 'isr', 'meraki', 'asr']) for (const perfil of Object.keys(M.PERFILES)) for (const bw of BW) {
      out.push([{ modo: 'link', bwMbps: bw, dirMult: 2, headPct: 30, perfil, plataforma, seguridad: 'ninguna', diaPct: 0 }, cat, DE_FICHA]);
    }
    return { cat, casos: out };
  },
  async huawei() {
    const cat = await proyeccion.toDimensionadorHuawei();
    const M = C.MOTORES.huawei.motor;
    const out = [];
    for (const plataforma of Object.keys(M.PLATAFORMAS)) for (const profile of M.CAPAS) for (const bw of BW) {
      out.push([{ bw, unit: 1, mode: 'link', sites: 20, conc: 40, head: 30, dirMult: 2, frame: 340, profile, plataforma,
        lan: 0, aps: 0, svc: { sdwan: false, utm: false }, want: {} }, cat, DE_FICHA]);
    }
    return { cat, casos: out };
  },
  async mikrotik() {
    const cat = await proyeccion.toDimensionadorMikrotik();
    const M = C.MOTORES.mikrotik.motor;
    const opciones = { ...DE_FICHA, licencias: cat.sizing.licenseLevels, bgpRam: cat.sizing.bgpRam };
    const out = [];
    for (const perfil of Object.keys(M.PERFILES)) for (const trama of Object.keys(M.TRAMAS)) for (const bw of BW) {
      out.push([{ bw, head: 20, perfil, trama, modo: 'sitio', sedes: 10, conc: 50 }, cat, opciones]);
    }
    return { cat, casos: out };
  },
  async juniper() {
    const cat = await proyeccion.toDimensionadorJuniper();
    return { cat: { models: [...cat.models, ...(cat.sdwan || [])] }, casos: cadaN(casoJuniper.casos(), 7).map(([esc]) => [esc, cat, DE_FICHA]) };
  },
  async 'nokia-sr'() {
    const cat = await proyeccion.toDimensionadorNokiaRouter();
    const out = [];
    for (const bw of [1, 100, 1000, 12000, 108000]) for (const familia of ['all', ...Object.keys(cat.plataformas)]) {
      for (const [portQty, portVel] of [[0, 100], [12, 100], [36, 100]]) out.push([{ bw, head: 0.3, familia, portQty, portVel, pqc: '' }, cat, DE_FICHA]);
    }
    return { cat, casos: out };
  },
  async 'nokia-fabric'() {
    const cat = await proyeccion.toDimensionadorNokia();
    const out = [];
    for (const servers of [1, 48, 500, 2000]) for (const accesoVel of [1, 10, 25, 100, 400]) for (const oversub of [1, 3]) {
      out.push([{ servers, accesoVel, dual: true, oversub }, cat, DE_FICHA]);
    }
    return { cat, casos: out };
  },
  async aruba() {
    casoAruba.cargar({ desdeRef: E.desdeRef('HEAD'), actual: E.actual });
    const casos = cadaN(casoAruba.casos(), 23).map(([MODELS, c]) => casoAruba.argumentos(MODELS, c));
    return { cat: casos[0][1], casos };
  },
};

// Los ids de modelo que aparecen en `apartados`, tenga la forma que tenga en cada motor: una fila con
// `m`, un candidato de Fortinet con `modelo`, un `{ id, motivo }` o el id suelto. Los contadores no cuentan.
function idsApartados(apartados, conocidos) {
  const out = new Set();
  const mirar = (x) => {
    if (typeof x === 'string') { if (conocidos.has(x)) out.add(x); return; }
    if (Array.isArray(x)) { x.forEach(mirar); return; }
    if (!x || typeof x !== 'object') return;
    const m = x.m || x.modelo;
    if (m && typeof m === 'object' && m.id) out.add(m.id);
    else if (typeof x.id === 'string') out.add(x.id);
  };
  if (Array.isArray(apartados)) mirar(apartados);
  else Object.values(apartados).forEach(mirar);
  return out;
}

const baraje = (semilla) => {
  let s = semilla;
  const rnd = () => { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648; };
  return (a) => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
};
const barajado = (cat, semilla) => {
  const b = baraje(semilla);
  const out = { ...cat };
  for (const k of ['models', 'sdwan']) if (Array.isArray(cat[k])) out[k] = b(cat[k]);
  return out;
};

test('el contrato cubre los ocho motores, y cada uno declara su versión', () => {
  assert.deepStrictEqual(C.FABRICANTES.slice().sort(), ['aruba', 'cisco', 'fortinet', 'huawei', 'juniper', 'mikrotik', 'nokia-fabric', 'nokia-sr']);
  assert.deepStrictEqual(Object.keys(FABRICANTES).sort(), C.FABRICANTES.slice().sort(), 'cada motor del contrato tiene su batería aquí');
  for (const f of C.FABRICANTES) {
    assert.match(String(C.MOTORES[f].motor.VERSION_MOTOR), /^\d+\.\d+\.\d+$/, `${f}: VERSION_MOTOR`);
    assert.strictEqual(typeof C.MOTORES[f].motor.evaluar, 'function', `${f}: el motor tiene evaluar`);
  }
  assert.throws(() => C.evaluar('arista', {}, {}, {}), /No hay motor de «arista»/);
});

for (const fabricante of Object.keys(FABRICANTES)) {
  test(`${fabricante}: el mismo sobre, y el recomendado sale de los candidatos`, async () => {
    const { cat, casos } = await FABRICANTES[fabricante]();
    const conocidos = new Set(cat.models.map((m) => m.id));
    assert.ok(casos.length >= 20, `escenarios (${casos.length})`);
    let conRecomendado = 0, conApartados = 0, conVarios = 0;
    for (const [i, args] of casos.entries()) {
      const r = C.evaluar(fabricante, ...args);
      const donde = `${fabricante} #${i} ${JSON.stringify(args[0]).slice(0, 160)}`;
      assert.deepStrictEqual(Object.keys(r), ['fabricante', 'version', 'candidatos', 'recomendado', 'apartados', 'nativo'], donde);
      assert.strictEqual(r.version, C.MOTORES[fabricante].motor.VERSION_MOTOR, donde);
      assert.ok(Array.isArray(r.candidatos), donde);
      const ids = r.candidatos.map((m) => m && m.id);
      assert.ok(ids.every((id) => conocidos.has(id)), `${donde}: un candidato no es un modelo del catálogo (${ids})`);
      assert.strictEqual(new Set(ids).size, ids.length, `${donde}: candidatos repetidos`);
      assert.ok(r.apartados && typeof r.apartados === 'object', `${donde}: apartados`);
      assert.ok(r.nativo && typeof r.nativo === 'object', `${donde}: nativo`);
      if (r.recomendado) {
        conRecomendado += 1;
        assert.ok(r.candidatos.includes(r.recomendado), `${donde}: el recomendado (${r.recomendado.id}) no está entre los candidatos`);
        assert.ok(FICHA.recomendable(r.recomendado), `${donde}: se recomienda un equipo fuera de venta (${r.recomendado.id})`);
      } else {
        assert.strictEqual(r.recomendado, null, donde);
        assert.ok(!r.candidatos.some((m) => FICHA.recomendable(m)) || fabricante === 'fortinet' || fabricante === 'mikrotik',
          `${donde}: hay candidatos vigentes y ninguno recomendado`);
      }
      const fuera = idsApartados(r.apartados, conocidos);
      if (fuera.size) conApartados += 1;
      const doble = ids.filter((id) => fuera.has(id));
      assert.deepStrictEqual(doble, [], `${donde}: a la vez candidato y apartado`);
      if (ids.length > 1) conVarios += 1;
    }
    assert.ok(conRecomendado > 0, `${fabricante}: ningún escenario recomienda equipo: la batería no prueba nada`);
    if (fabricante !== 'nokia-fabric') {
      assert.ok(conVarios > 0, `${fabricante}: ningún escenario deja más de un candidato`);
      assert.ok(conApartados > 0, `${fabricante}: ningún escenario aparta un modelo con nombre`);
    }
  });

  test(`${fabricante}: barajar el catálogo no cambia el recomendado`, async () => {
    const { casos } = await FABRICANTES[fabricante]();
    const malos = [];
    for (const [i, [esc, cat, opciones]] of casos.entries()) {
      const base = C.evaluar(fabricante, esc, cat, opciones).recomendado;
      for (const semilla of [1, 13, 2026]) {
        const otro = C.evaluar(fabricante, esc, barajado(cat, semilla), opciones).recomendado;
        if ((otro && otro.id) !== (base && base.id)) { malos.push(`#${i}: ${base && base.id} / ${otro && otro.id} (semilla ${semilla})`); break; }
      }
    }
    assert.deepStrictEqual(malos.slice(0, 5), [], `${malos.length} escenarios dependen del orden del catálogo`);
  });
}

test('Cisco: la página delega el orden y el recomendado en CiscoMotor.evaluar', () => {
  const pag = fs.readFileSync(path.join(__dirname, '..', 'public/js/dimensionador-cisco-catalyst8k.js'), 'utf8');
  assert.ok(pag.includes('const ev = M.evaluar(MODELS, p, {rango:FICHA.rango, recomendar:FICHA.recomendar});'));
  assert.ok(pag.includes('const candidatos = ev.orden;') && pag.includes('const pick = ev.recomendado;'));
  assert.doesNotMatch(pag, /FICHA\.ordenar\(ev\.candidatos/, 'el orden no vuelve a la página');
  // Sin opciones, el motor no sabe de ciclo de vida: el orden es el de capacidad y se recomienda el primero.
  const M = C.MOTORES.cisco.motor;
  const modelos = require('../server/seed/legacyData/cisco').MODELS;
  const r = M.evaluar(modelos, { modo: 'link', bwMbps: 500, dirMult: 2, headPct: 30, perfil: Object.keys(M.PERFILES)[0], plataforma: 'xe', seguridad: 'ninguna', diaPct: 0 });
  assert.deepStrictEqual(r.orden.map((m) => m.id), r.candidatos.map((f) => f.m.id));
  assert.strictEqual(r.recomendado, r.orden[0] || null);
});

test('Aruba: la página delega el orden y el recomendado en ArubaReglas.evaluar', () => {
  const pag = fs.readFileSync(path.join(__dirname, '..', 'public/js/dimensionador-aruba-edgeconnect.js'), 'utf8');
  assert.match(pag, /const evMotor = ArubaReglas\.evaluar\(\{/);
  assert.match(pag, /const pick=evMotor\.recomendado;/);
  assert.doesNotMatch(pag, /FICHA\.ordenar\(candidates/, 'el orden no vuelve a la página');
});
