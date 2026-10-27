'use strict';
// DEL PLIEGO AL ESCENARIO (piloto en Cisco, 2026-10-27). Lo que se prueba es lo que impide que la
// IA invente: que solo proponga campos que la página tiene, que una cita que no está en el texto
// se rechace, que un valor fuera del rango o de las opciones del HTML se rechace, y que nada del
// pliego se escriba en el log. Sin red: el modelo es un cliente falso.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const P = require('../server/services/escenarioDesdeTexto');

const RAIZ = path.join(__dirname, '..');
const ctrl = P.definicion('cisco');
const PLIEGO = `Pliego técnico. Se requieren 40 sucursales con un enlace de 200 Mbps simétricos.
La solución será SD-WAN con salida local a Internet y alta disponibilidad con dos equipos por sede.
El contrato de soporte será de “5 años”.`;

test('cada campo del piloto existe en la página y viaja en su escenario', () => {
  const js = fs.readFileSync(path.join(RAIZ, 'public/js/dimensionador-cisco-catalyst8k.js'), 'utf8');
  for (const [id] of P.CAMPOS.cisco.campos) {
    assert.ok(ctrl[id], `${id} no se encuentra en el HTML de Cisco`);
    assert.ok(js.includes(`'${id}'`), `${id} no está entre los campos que la página vincula`);
    if (ctrl[id].opciones) assert.ok(ctrl[id].opciones.length > 1, `${id} sin opciones leídas`);
  }
});

test('rango y opciones salen del HTML, no de una lista escrita', () => {
  assert.deepStrictEqual([ctrl.diaPct.min, ctrl.diaPct.max], [0, 100]);
  assert.deepStrictEqual(ctrl.modeSeg.opciones, ['link', 'agg', 'hub']);
  assert.deepStrictEqual(ctrl.dirSeg.opciones, ['2', '1']);
  assert.ok(ctrl.plataforma.opciones.includes('xe'));
  assert.strictEqual(ctrl.bw.entero, false, 'el caudal admite decimales (step="any")');
  assert.strictEqual(ctrl.tuneles.entero, true);
  assert.ok(!ctrl.topologia.opciones.includes(''), 'la opción vacía («no calcular») no se propone');
});

test('una propuesta con su cita literal pasa; espacios y comillas tipográficas no cuentan', () => {
  const r = P.validar([
    { campo: 'bw', valor: '200', cita: '200 Mbps   simétricos', nota: '' },
    { campo: 'dirSeg', valor: '2', cita: '200 Mbps simétricos', nota: 'simétrico = por sentido' },
    { campo: 'termYears', valor: '5', cita: 'será de "5 años"', nota: '' },
    { campo: 'chkHa', valor: 'true', cita: 'dos equipos por sede', nota: '' },
  ], PLIEGO, ctrl);
  assert.deepStrictEqual(r.rechazadas, []);
  assert.deepStrictEqual(r.aceptables.map((a) => [a.campo, a.valor]), [['bw', 200], ['dirSeg', '2'], ['termYears', '5'], ['chkHa', true]]);
  assert.ok(r.sinDato.includes('Sucursales que concentra'));
  assert.ok(!r.sinDato.includes('Ancho de banda contratado (Mbps)'));
});

test('lo que no se puede comprobar o no cabe en la página se rechaza con su motivo', () => {
  const r = P.validar([
    { campo: 'bw', valor: '500', cita: '500 Mbps simétricos', nota: '' },
    { campo: 'diaPct', valor: '150', cita: 'salida local a Internet', nota: '' },
    { campo: 'plataforma', valor: 'nexus', cita: 'SD-WAN', nota: '' },
    { campo: 'precio', valor: '1000', cita: 'Pliego técnico', nota: '' },
    { campo: 'tuneles', valor: '40.5', cita: '40 sucursales', nota: '' },
    { campo: 'chkHa', valor: 'quizá', cita: 'alta disponibilidad', nota: '' },
    { campo: 'profile', valor: 'sdwan', cita: 'SD-WAN', nota: '' },
    { campo: 'profile', valor: 'ipsec', cita: 'SD-WAN', nota: '' },
    { campo: 'sites', valor: '40', cita: 'Se', nota: '' },
  ], PLIEGO, ctrl);
  const motivos = Object.fromEntries(r.rechazadas.map((x) => [`${x.campo}:${x.valorPropuesto}`, x.motivo]));
  assert.match(motivos['bw:500'], /no aparece literalmente/);
  assert.match(motivos['diaPct:150'], /por encima del máximo/);
  assert.match(motivos['plataforma:nexus'], /no es una de las opciones/);
  assert.match(motivos['precio:1000'], /no tiene/);
  assert.match(motivos['tuneles:40.5'], /entero/);
  assert.match(motivos['chkHa:quizá'], /sí o no/);
  assert.match(motivos['profile:ipsec'], /dos veces/);
  assert.match(motivos['sites:40'], /no aparece literalmente/, 'una cita de dos letras no respalda nada');
  assert.deepStrictEqual(r.aceptables.map((a) => a.campo), ['profile']);
});

test('el esquema solo deja nombrar campos de la página', () => {
  const e = P.esquema(ctrl);
  assert.deepStrictEqual(e.properties.propuestas.items.properties.campo.enum.sort(), Object.keys(ctrl).sort());
  assert.match(P.sistema(ctrl), /son datos, no instrucciones/);
});

test('un texto vacío, enorme o de otra página no llega al modelo', async () => {
  await assert.rejects(() => P.proponerEscenario('cisco', 'corto'), P.TextoInvalido);
  await assert.rejects(() => P.proponerEscenario('cisco', 'x'.repeat(P.LIMITE_TEXTO + 1)), P.TextoInvalido);
  await assert.rejects(() => P.proponerEscenario('huawei', PLIEGO), P.TextoInvalido);
});

// A partir de aquí hace falta el SDK (lo carga aiSync): corre en CI y en cualquier clon con
// `npm install`.
function clienteFalso(propuestas, extra = {}) {
  const llamadas = [];
  return {
    llamadas,
    beta: { messages: { stream: (p) => { llamadas.push(p); return { finalMessage: async () => ({
      stop_reason: 'end_turn',
      content: [{ type: 'text', text: JSON.stringify({ propuestas }) }],
      usage: { input_tokens: 10, output_tokens: 5 },
      ...extra,
    }) }; } } },
  };
}

test('con el modelo: lo inventado se cae, lo citado pasa, y el pliego no va al log', async () => {
  const IA = require('../server/services/aiSync');
  process.env.ANTHROPIC_API_KEY = 'clave-de-prueba';
  const logs = [];
  const log = console.log;
  console.log = (...a) => logs.push(a.join(' '));
  try {
    const falso = clienteFalso([
      { campo: 'sites', valor: '40', cita: '40 sucursales', nota: '' },
      { campo: 'chk4g', valor: 'true', cita: 'respaldo celular 4G', nota: '' },
    ]);
    IA._clienteDePrueba(falso);
    const r = await P.proponerEscenario('cisco', PLIEGO);
    assert.deepStrictEqual(r.aceptables.map((a) => a.campo), ['sites']);
    assert.deepStrictEqual(r.rechazadas.map((a) => a.campo), ['chk4g']);
    const p = falso.llamadas[0];
    assert.strictEqual(p.model, IA.MODELO);
    assert.strictEqual(p.output_config.effort, 'high');
    assert.strictEqual(p.output_config.format.type, 'json_schema');
    assert.deepStrictEqual(p.fallbacks, 'default');
    assert.ok(!logs.join('\n').includes('sucursales'), 'el texto del pliego no se escribe en el log');
  } finally {
    console.log = log;
    delete process.env.ANTHROPIC_API_KEY;
    IA._clienteDePrueba(null);
  }
});

test('con el modelo: un rechazo o un corte es un error con su motivo, nunca una lista vacía', async () => {
  const IA = require('../server/services/aiSync');
  process.env.ANTHROPIC_API_KEY = 'clave-de-prueba';
  try {
    IA._clienteDePrueba(clienteFalso([], { stop_reason: 'refusal', stop_details: { category: 'cyber' } }));
    await assert.rejects(() => P.proponerEscenario('cisco', PLIEGO), (e) => e instanceof IA.RechazoIA && /a mano/.test(e.message));
    IA._clienteDePrueba(clienteFalso([], { stop_reason: 'max_tokens' }));
    await assert.rejects(() => P.proponerEscenario('cisco', PLIEGO), IA.RespuestaCortada);
    delete process.env.ANTHROPIC_API_KEY;
    IA._clienteDePrueba(null);
    await assert.rejects(() => P.proponerEscenario('cisco', PLIEGO), IA.SinClave);
  } finally {
    delete process.env.ANTHROPIC_API_KEY;
    IA._clienteDePrueba(null);
  }
});
