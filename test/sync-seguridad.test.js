'use strict';
// La sincronizacion con IA, por la parte que fallaba abierta.
//
// Tres cosas que se comprobaron a mano antes de escribir esto: el permiso `sync` estaba
// declarado en ROLES y ninguna ruta lo exigia; sin ANTHROPIC_API_KEY el servicio devolvia
// propuestas inventadas con apariencia legitima; y el tipo del adjunto se tomaba del
// mimetype que declara el navegador. Las tres son del mismo genero — algo que parece una
// defensa y no defiende — y por eso van juntas.
const test = require('node:test');
const assert = require('node:assert');
const { estadoLimpio } = require('./ayuda/navegador');

estadoLimpio('sync-seguridad');
delete process.env.ANTHROPIC_API_KEY;

const { ROLES } = require('../server/usuarios');
const { tipoPorFirma } = require('../server/services/firmaArchivo');
const {
  analyzeCatalog, cambiosDeRespuesta, SinClave, ClaveInvalida, LimiteIA, SinSaldo, RechazoIA,
  RespuestaCortada, errorDeIA,
} = require('../server/services/aiSync');

// Una respuesta con la forma que devuelve `finalMessage()`: Opus 5 piensa por defecto, así
// que el bloque de texto llega detrás de uno `thinking` (con la visualización omitida, vacío).
function respuesta(stopReason, bloques, extra = {}) {
  return { stop_reason: stopReason, content: [{ type: 'thinking', thinking: '' }, ...bloques], ...extra };
}
const texto = (t) => ({ type: 'text', text: t });

test('el rol consulta no tiene el permiso sync y el administrador si', () => {
  assert.strictEqual(ROLES.consulta.permisos.sync, false);
  assert.strictEqual(ROLES.admin.permisos.sync, true);
});

test('sin ANTHROPIC_API_KEY el analisis falla cerrado con un error propio, nunca con datos', async () => {
  await assert.rejects(
    () => analyzeCatalog('fortinet', { equipment: [{ id: 'FortiGate 60F' }], licenses: [], supportTiers: [], parts: [] }, null),
    (err) => err instanceof SinClave && err.code === 'SIN_CLAVE',
  );
});

test('un 401 de la API se traduce a «clave inválida», no a un 500 genérico', () => {
  // POR QUE. En produccion, con la clave puesta pero rechazada, la API devolvia
  // AuthenticationError 401 y la ruta lo aplanaba en «Error analizando con IA» — sin pista de
  // que el problema era la clave y no el catalogo. Cada estado se traduce a su error propio.
  assert.ok(errorDeIA({ status: 401 }) instanceof ClaveInvalida, '401 -> clave invalida');
  assert.ok(errorDeIA({ status: 403 }) instanceof ClaveInvalida, '403 -> clave invalida');
  assert.match(errorDeIA({ status: 401 }).message, /no es válida/);
  assert.ok(errorDeIA({ status: 429 }) instanceof LimiteIA, '429 -> limite transitorio');

  // Sin saldo: la clave es valida pero la cuenta no tiene credito. La API lo manda como un 400
  // con «credit balance is too low», que no es lo mismo que una peticion mal formada.
  const saldo = errorDeIA({ status: 400, error: { error: { message: 'Your credit balance is too low to access the Anthropic API.' } } });
  assert.ok(saldo instanceof SinSaldo, '400 de credito -> sin saldo');
  assert.match(saldo.message, /saldo/);
  // Un 400 que NO habla de saldo es una peticion invalida de verdad: no se disfraza de billing.
  assert.ok(!(errorDeIA({ status: 400, message: 'invalid field foo' }) instanceof SinSaldo));

  // Lo desconocido no se disfraza de config: sigue siendo el error generico.
  const otro = errorDeIA({ status: 500 });
  assert.ok(!(otro instanceof ClaveInvalida) && !(otro instanceof LimiteIA) && !(otro instanceof SinSaldo));
  assert.ok(errorDeIA(new Error('boom')) instanceof Error);
});

test('una respuesta completa devuelve la lista del esquema, también la vacía', () => {
  assert.deepStrictEqual(cambiosDeRespuesta(respuesta('end_turn', [texto('{"cambios":[]}')])), []);
  const uno = cambiosDeRespuesta(respuesta('end_turn', [texto('{"cambios":[{"id":"FortiGate 60F"}]}')]));
  assert.strictEqual(uno.length, 1);
});

test('un rechazo del modelo es un error propio, nunca «el catálogo está al día»', () => {
  // POR QUE. `stop_reason: refusal` devolvía [] y el panel pintaba «El catálogo parece estar
  // actualizado»: un análisis que no ocurrió, presentado como uno que no encontró nada.
  assert.throws(
    () => cambiosDeRespuesta({ stop_reason: 'refusal', stop_details: { category: 'cyber' }, content: [] }),
    (err) => err instanceof RechazoIA && err.code === 'RECHAZO_IA' && /cyber/.test(err.message),
  );
  // stop_details es informativo y puede venir a null: el rechazo se decide por stop_reason.
  assert.throws(() => cambiosDeRespuesta({ stop_reason: 'refusal', stop_details: null, content: [] }), RechazoIA);
});

test('una respuesta cortada en max_tokens es un error propio, aunque no traiga texto', () => {
  // POR QUE. En Opus 5 max_tokens topa pensamiento más respuesta. Si el corte cae dentro del
  // pensamiento no hay bloque de texto, y el código devolvía [] — otra vez «al día» sin análisis.
  assert.throws(() => cambiosDeRespuesta(respuesta('max_tokens', [])), RespuestaCortada);
  // Cortada a mitad del JSON: el mismo error, no un SyntaxError genérico.
  assert.throws(() => cambiosDeRespuesta(respuesta('max_tokens', [texto('{"cambios":[{"id":"Forti')])), RespuestaCortada);
  // Terminada sin texto: tampoco es una lista vacía.
  assert.throws(() => cambiosDeRespuesta(respuesta('end_turn', [])), (err) => !(err instanceof RechazoIA) && /sin texto/.test(err.message));
});

test('con el modelo de respaldo, el tramo del primero y la continuación forman un solo JSON', () => {
  // Con `fallbacks`, un rechazo a mitad de respuesta deja el tramo ya emitido, marca el cambio
  // con un bloque `fallback` y el modelo de respaldo continúa desde ahí.
  const cambio = { type: 'fallback', from: { model: 'claude-opus-5' }, to: { model: 'claude-opus-4-8' } };
  const aMitad = {
    stop_reason: 'end_turn',
    model: 'claude-opus-4-8',
    content: [texto('{"cambios":[{"id":"Forti'), cambio, texto('Gate 60F"}]}')],
    usage: { iterations: [{ type: 'message' }, { type: 'fallback_message' }] },
  };
  assert.deepStrictEqual(cambiosDeRespuesta(aMitad).map((c) => c.id), ['FortiGate 60F']);
  // Rechazo antes de emitir nada: el bloque `fallback` va primero y el texto entero después.
  const antes = { ...aMitad, content: [cambio, texto('{"cambios":[]}')] };
  assert.deepStrictEqual(cambiosDeRespuesta(antes), []);
});

test('la firma del contenido decide el tipo, no la extension ni el mimetype', () => {
  const pdf = Buffer.concat([Buffer.from('%PDF-1.7\n'), Buffer.alloc(32, 0)]);
  const zip = Buffer.concat([Buffer.from([0x50, 0x4b, 0x03, 0x04]), Buffer.alloc(32, 0)]);
  const texto = Buffer.from('Modelo,New Sessions/Sec\nFortiGate 90G,56000\n');
  const binario = Buffer.from([0x7f, 0x45, 0x4c, 0x46, 0x00, 0x01]); // un ELF con extension .pdf

  assert.strictEqual(tipoPorFirma(pdf, 'matrix.pdf'), 'pdf');
  assert.strictEqual(tipoPorFirma(zip, 'matrix.xlsx'), 'xlsx');
  assert.strictEqual(tipoPorFirma(texto, 'matrix.csv'), 'csv');
  assert.strictEqual(tipoPorFirma(texto, 'notas.txt'), 'txt');
  // Un ZIP que dice ser PDF, o un ejecutable con extension .pdf: no pasan.
  assert.strictEqual(tipoPorFirma(zip, 'matrix.pdf'), null);
  assert.strictEqual(tipoPorFirma(binario, 'matrix.pdf'), null);
  assert.strictEqual(tipoPorFirma(Buffer.alloc(0), 'vacio.pdf'), null);
});
