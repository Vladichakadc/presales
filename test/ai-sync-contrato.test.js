'use strict';
/* global Response, Headers */
// Contrato de la sincronizacion con IA (mejora del PR #173, aprobada el 2026-11-11): con el SDK
// real de Anthropic y un `fetch` de mentira, la `analyzeCatalog()` de verdad. Fija lo que sale por
// la red y como se traduce cada respuesta, para que la proxima version mayor del SDK o de la API se
// mida aqui y no en la primera sincronizacion fallida en produccion (aqui no hay clave).
// No fija lo que cambia en cada parche (user-agent, x-stainless-*), ni el texto de las
// instrucciones, que es del producto y no del contrato.
// Si cambia `anthropic-version`, se relee la guia de migracion de esa version
// (platform.claude.com/docs/en/api/migration-<version>) antes de tocar el valor esperado.

process.env.ANTHROPIC_API_KEY = 'sk-ant-contrato-0000';
delete process.env.ANTHROPIC_AUTH_TOKEN;
delete process.env.ANTHROPIC_BASE_URL;

const test = require('node:test');
const assert = require('node:assert');

function sse(eventos) {
  return eventos.map((e) => `event: ${e.type}\ndata: ${JSON.stringify(e)}\n\n`).join('');
}
function mensaje({ textos, stop_reason = 'end_turn', stop_details = null, usageDelta = {} }) {
  const ev = [
    { type: 'message_start', message: { id: 'msg_c', type: 'message', role: 'assistant', model: 'claude-opus-5-5', content: [], stop_reason: null, stop_sequence: null, usage: { input_tokens: 1200, output_tokens: 1, cache_read_input_tokens: 800, cache_creation_input_tokens: 0 } } },
    { type: 'content_block_start', index: 0, content_block: { type: 'thinking', thinking: '', signature: '' } },
    { type: 'content_block_delta', index: 0, delta: { type: 'thinking_delta', thinking: 'reviso' } },
    { type: 'content_block_delta', index: 0, delta: { type: 'signature_delta', signature: 'firma' } },
    { type: 'content_block_stop', index: 0 },
  ];
  if (textos.length) {
    ev.push({ type: 'content_block_start', index: 1, content_block: { type: 'text', text: '' } });
    for (const t of textos) ev.push({ type: 'content_block_delta', index: 1, delta: { type: 'text_delta', text: t } });
    ev.push({ type: 'content_block_stop', index: 1 });
  }
  ev.push({ type: 'message_delta', delta: { stop_reason, stop_sequence: null, stop_details }, usage: { output_tokens: 321, ...usageDelta } });
  ev.push({ type: 'message_stop' });
  return () => new Response(sse(ev), { status: 200, headers: { 'content-type': 'text/event-stream', 'request-id': 'req_c' } });
}
function fallo(status, tipo, texto) {
  return () => new Response(JSON.stringify({ type: 'error', error: { type: tipo, message: texto } }), {
    status, headers: { 'content-type': 'application/json', 'request-id': 'req_c', 'x-should-retry': 'false' },
  });
}

const CAMBIO = { tipo: 'UPDATE', categoria: 'equipo', id: 'FG-40F', campo: 'fw', valorAnterior: 5, valorNuevo: 5.5, fuente: 'ficha', sourceUrl: '' };
const JSON_OK = JSON.stringify({ cambios: [CAMBIO] });
const ESCENARIOS = [
  { nombre: 'sin adjunto', archivo: null, respuesta: mensaje({ textos: [JSON_OK] }), cambios: 1 },
  { nombre: 'PDF con respuesta del modelo de respaldo', archivo: { tipo: 'pdf', buffer: Buffer.from('%PDF-1.4 contrato') }, respuesta: mensaje({ textos: [JSON_OK.slice(0, 20), JSON_OK.slice(20)], usageDelta: { iterations: [{ type: 'message' }, { type: 'fallback_message' }] } }), cambios: 1, documento: true },
  { nombre: 'texto plano', archivo: { tipo: 'txt', buffer: Buffer.from('Ficha FG-40F: 5,5 Gbps') }, respuesta: mensaje({ textos: [JSON.stringify({ cambios: [] })] }), cambios: 0, documento: true },
  { nombre: 'hoja CSV', archivo: { tipo: 'csv', buffer: Buffer.from('modelo,fw\nFG-40F,5.5\n') }, nota: 'Solo la columna clave.', respuesta: mensaje({ textos: [JSON_OK] }), cambios: 1 },
  { nombre: 'rechazo', archivo: null, respuesta: mensaje({ textos: [], stop_reason: 'refusal', stop_details: { type: 'refusal', category: 'cyber', explanation: 'contrato' } }), error: 'RechazoIA' },
  { nombre: 'corte por max_tokens', archivo: null, respuesta: mensaje({ textos: ['{"cambios":[{"tipo"'], stop_reason: 'max_tokens' }), error: 'RespuestaCortada' },
  { nombre: '401', archivo: null, respuesta: fallo(401, 'authentication_error', 'invalid key'), error: 'ClaveInvalida' },
  { nombre: '429', archivo: null, respuesta: fallo(429, 'rate_limit_error', 'rate limited'), error: 'LimiteIA' },
  { nombre: '400 sin saldo', archivo: null, respuesta: fallo(400, 'invalid_request_error', 'Your credit balance is too low to access the Anthropic API.'), error: 'SinSaldo' },
  { nombre: '500', archivo: null, respuesta: fallo(500, 'api_error', 'internal'), error: 'Error' },
];

let actual = null;
globalThis.fetch = async (url, init = {}) => {
  const cabeceras = {};
  new Headers(init.headers || {}).forEach((v, k) => { cabeceras[k] = v; });
  actual.peticiones.push({ metodo: init.method, url: String(url), cabeceras, cuerpo: JSON.parse(init.body) });
  return actual.respuesta();
};
const sync = require('../server/services/aiSync');
const CATALOGO = { equipment: [{ id: 'FG-40F', fw: 5 }], licenses: [], supportTiers: [], parts: [] };

const resultados = [];
test.before(async () => {
  const consola = { log: console.log, warn: console.warn, error: console.error };
  console.log = () => {}; console.warn = () => {}; console.error = () => {};
  try {
    for (const e of ESCENARIOS) {
      actual = { peticiones: [], respuesta: e.respuesta };
      const r = { e, peticiones: actual.peticiones };
      try { r.cambios = await sync.analyzeCatalog('fortinet', CATALOGO, e.archivo, e.nota); } catch (err) { r.error = err; }
      resultados.push(r);
    }
  } finally { Object.assign(console, consola); }
});

test('cada escenario hace una sola peticion: POST a /v1/messages, sin parametros en la URL', () => {
  for (const { e, peticiones } of resultados) {
    assert.strictEqual(peticiones.length, 1, `${e.nombre}: ${peticiones.length} peticiones`);
    assert.strictEqual(peticiones[0].metodo, 'POST');
    assert.strictEqual(peticiones[0].url, 'https://api.anthropic.com/v1/messages', e.nombre);
  }
});

test('cabeceras: version de la API, beta del respaldo y la clave como Bearer', () => {
  for (const { e, peticiones: [p] } of resultados) {
    assert.strictEqual(p.cabeceras['anthropic-version'], '2026-10-21', `${e.nombre}: otra version de la API: relee su guia de migracion`);
    assert.ok(String(p.cabeceras['anthropic-beta']).split(',').map((s) => s.trim()).includes('server-side-fallback-2026-07-01'), e.nombre);
    assert.strictEqual(p.cabeceras.authorization, 'Bearer sk-ant-contrato-0000', e.nombre);
    assert.strictEqual(p.cabeceras['x-api-key'], undefined, `${e.nombre}: una sola credencial`);
  }
});

test('cuerpo: modelo, esfuerzo alto, salida con esquema, respaldo y nada de muestreo', () => {
  for (const { e, peticiones: [p] } of resultados) {
    const b = p.cuerpo;
    assert.deepStrictEqual(Object.keys(b).sort(), ['fallbacks', 'max_tokens', 'messages', 'model', 'output_config', 'stream', 'system'], e.nombre);
    assert.strictEqual(b.model, 'claude-opus-5-5');
    assert.strictEqual(b.fallbacks, 'default');
    assert.strictEqual(b.stream, true);
    assert.strictEqual(b.output_config.effort, 'high');
    assert.strictEqual(b.output_config.format.type, 'json_schema');
    assert.ok(b.output_config.format.schema.properties.cambios, 'el esquema pide «cambios»');
    for (const k of ['temperature', 'top_p', 'top_k']) assert.ok(!(k in b), `${e.nombre}: ${k} lo rechaza la API 2026-10-21`);
    assert.ok(b.system.some((s) => s.cache_control && s.cache_control.type === 'ephemeral'), `${e.nombre}: instrucciones sin cache`);
  }
});

test('un solo mensaje, del usuario; el documento va en el, nunca en uno del asistente, y sin citas', () => {
  for (const { e, peticiones: [p] } of resultados) {
    const ms = p.cuerpo.messages;
    assert.deepStrictEqual(ms.map((m) => m.role), ['user'], e.nombre);
    const bloques = ms[0].content;
    const docs = bloques.filter((c) => c.type === 'document');
    assert.strictEqual(docs.length, e.documento ? 1 : 0, `${e.nombre}: documentos`);
    assert.ok(bloques.every((c) => !c.citations), `${e.nombre}: citations en un mensaje del usuario lo rechaza la API 2026-10-21`);
    assert.ok(bloques.some((c) => c.cache_control), `${e.nombre}: el catalogo va cacheado`);
  }
});

test('cada respuesta se traduce a su resultado o a su error', () => {
  for (const { e, cambios, error } of resultados) {
    if (e.error) {
      assert.ok(error, `${e.nombre}: tenia que lanzar ${e.error}`);
      assert.strictEqual(error.constructor.name, e.error, `${e.nombre}: ${error.constructor.name}: ${error.message}`);
    } else {
      assert.ok(!error, `${e.nombre}: ${error && error.message}`);
      assert.strictEqual(cambios.length, e.cambios, e.nombre);
    }
  }
});
