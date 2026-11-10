'use strict';
/* EL ORDEN DE LOS CANDIDATOS DE JUNIPER, EN EL MOTOR (fase 2 de la auditoria del 2026-11-09, ADR-1,
   corte 2). Antes la pagina ordenaba en tres sitios por la cifra de la capa y sin desempate: con dos
   equipos de la misma cifra mandaba el orden en que el servidor servia el catalogo (el binario del
   nombre: SRX1500 antes que SRX380, que dan los dos 2.000 Mbps de IPS). Que el motor da lo mismo que
   la pagina sobre el catalogo servido lo mide scripts/equivalencias/juniper-orden.js; aqui, lo que el
   motor promete por si mismo. */
const test = require('node:test');
const assert = require('node:assert');
const JM = require('../public/js/juniper-motor.js');
const J = require('../server/seed/legacyData/juniper.js');
const { cargar } = require('./ayuda/navegador.js');

const { FICHA } = cargar('public/js/ficha.js');
const opciones = { rango: FICHA.rango, recomendar: FICHA.recomendar };
const cat = { srx: J.MODELS, ssr: J.SDWAN };

// Baraje con semilla fija: la prueba es reproducible.
const baraje = (semilla) => (a) => {
  let s = semilla;
  const rnd = () => { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648; };
  const b = a.slice();
  for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; }
  return b;
};
const ids = (r) => ({ rec: r.recomendado ? r.recomendado.id : null, orden: r.candidatos.map((m) => m.id) });

test('en empate de cifra manda el id en orden natural, no el orden del catalogo', () => {
  // Los dos vigentes a proposito (rango 0): asi solo decide el desempate.
  const dos = J.MODELS.filter((m) => m.id === 'SRX1500' || m.id === 'SRX380');
  assert.strictEqual(dos[0].ips, dos[1].ips, 'el empate de IPS sigue en el catalogo');
  for (const lista of [dos, [...dos].reverse()]) {
    assert.deepStrictEqual(JM.ordenar(lista, 'ips', () => 0).map((m) => m.id), ['SRX380', 'SRX1500']);
  }
  // Y el ciclo de vida va antes que la cifra: el fuera de venta queda detras aunque empate.
  const rango = (m) => (m.id === 'SRX380' ? 2 : 0);
  assert.deepStrictEqual(JM.ordenar(dos, 'ips', rango).map((m) => m.id), ['SRX1500', 'SRX380']);
});

test('barajar el catalogo no cambia el recomendado ni el orden, en SRX, SSR y el SRX desacoplado', () => {
  const escenarios = [];
  for (const bwMbps of [50, 300, 1500, 1800, 5000, 20000]) {
    for (const k of ['fwImix', 'vpn', 'ips', 'atp']) escenarios.push({ plat: 'srx', bwMbps, head: 0.3, users: 500, sesUser: 30, k, pqc: '' });
    for (const cifrado of ['plano', 'hmac']) {
      escenarios.push({ plat: 'ssr', rol: 'sucursal', bwMbps, cifrado, dupPct: 0, headroomPct: 30, pqc: '' });
      escenarios.push({ plat: 'inspeccion', rol: 'hub', bwMbps, spokes: 40, simultPct: 60, breakoutPct: 70, cifrado,
        headroomPct: 30, alcance: 'todo', k: 'ips' });
    }
  }
  for (const esc of escenarios) {
    const base = ids(JM.evaluar(esc, cat, opciones));
    for (const semilla of [1, 7, 42, 2026]) {
      const b = baraje(semilla);
      const otro = ids(JM.evaluar(esc, { srx: b(cat.srx), ssr: b(cat.ssr) }, opciones));
      assert.deepStrictEqual(otro, base, `${JSON.stringify(esc)} (semilla ${semilla})`);
    }
  }
});

test('la demanda SRX es la cuenta de la pagina: caudal con margen y sesiones con el mismo margen', () => {
  assert.deepStrictEqual(JM.demandaSrx({ bwMbps: 1000, head: 0.3, users: 200, sesUser: 30 }), { need: 1300, sessNeed: 7800, head: 0.3 });
  assert.strictEqual(JM.demandaSrx({ bwMbps: 1000, head: 0.3, users: 200, sesUser: 0 }).sessNeed, 0, 'sin sesiones por usuario no hay requisito');
  assert.strictEqual(JM.demandaSrx({}).need, 0);
});

test('el sobre del contrato: version, demanda, candidatos de menor a mayor cifra, recomendado y apartados', () => {
  const r = JM.evaluar({ plat: 'srx', bwMbps: 800, head: 0.3, users: 0, sesUser: 0, k: 'ips', pqc: '' }, cat, opciones);
  assert.strictEqual(r.version, JM.VERSION_MOTOR);
  assert.strictEqual(r.plat, 'srx');
  assert.strictEqual(r.need, 1040);
  assert.ok(r.candidatos.every((m) => m.ips >= 1040));
  const vivos = r.candidatos.filter((m) => FICHA.rango(m) === 0);
  for (let i = 1; i < vivos.length; i++) assert.ok(vivos[i - 1].ips <= vivos[i].ips, 'los vigentes van de menor a mayor IPS');
  assert.strictEqual(r.recomendado, FICHA.recomendar(r.candidatos));
  assert.deepStrictEqual(Object.keys(r.apartados).sort(), ['outByPqc', 'outBySess', 'sinCifra']);
  const ssr = JM.evaluar({ plat: 'ssr', rol: 'sucursal', bwMbps: 500, cifrado: 'hmac', dupPct: 0, headroomPct: 30 }, cat, opciones);
  assert.strictEqual(ssr.k, 'capHmac');
  assert.strictEqual(ssr.need, JM.demandaSsr({ rol: 'sucursal', bwMbps: 500, cifrado: 'hmac', dupPct: 0, headroomPct: 30 }).need);
});
