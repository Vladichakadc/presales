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
  analyzeCatalog, SinClave, ClaveInvalida, LimiteIA, errorDeIA,
} = require('../server/services/aiSync');

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
  // Lo desconocido no se disfraza de config: sigue siendo el error generico.
  const otro = errorDeIA({ status: 500 });
  assert.ok(!(otro instanceof ClaveInvalida) && !(otro instanceof LimiteIA));
  assert.ok(errorDeIA(new Error('boom')) instanceof Error);
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
