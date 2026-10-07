'use strict';
// LA HOJA SE CONTRASTA SIN IA, Y AL MODELO SOLO LLEGA LO QUE ESE CONTRASTE NO SABE LEER
// (2026-10-07, propuesta 10 de la auditoría de prompts) — y la llamada que queda va a Claude
// Opus 5.5 con el esfuerzo explícito (propuesta 11).
//
// Lo que se prueba es lo que haría mentir al panel si fallara: que una hoja se mande entera al
// modelo cuando bastaba el contraste, que el modelo vea columnas que ya se contrastaron, que una
// lista vacía con columnas sin leer se presente como «al día», y que un alta se cuele en los
// cambios aplicables. El cliente de la API es de mentira: no sale a la red.
const test = require('node:test');
const assert = require('node:assert');

delete process.env.ANTHROPIC_API_KEY;
const sync = require('../server/services/aiSync');

const catalogo = () => ({
  equipment: [{ id: 'AR650', fwd: 620, ipsec: 200 }, { id: 'AR6700', fwd: 1300, ipsec: 800 }],
  licenses: [], supportTiers: [], parts: [],
});
const hoja = (texto) => ({ tipo: 'csv', buffer: Buffer.from(texto, 'utf8') });

// Un cliente que guarda la petición y responde con la lista que se le dé.
function clienteFalso(cambios) {
  const llamadas = [];
  return {
    llamadas,
    beta: { messages: { stream: (params) => {
      llamadas.push(params);
      return { finalMessage: async () => ({
        stop_reason: 'end_turn', model: params.model, usage: {},
        content: [{ type: 'thinking', thinking: '' }, { type: 'text', text: JSON.stringify({ cambios }) }],
      }) };
    } } },
  };
}

test('una hoja con todas sus columnas reconocidas se contrasta sin IA y sin clave', async () => {
  const r = await sync.analizarDocumento('huawei', catalogo(), hoja('modelo,fwd,ipsec\nAR650,700,200\nAR6700,1300,800\n'));
  assert.strictEqual(r.contraste.ia, 'no-hace-falta');
  assert.deepStrictEqual(r.changes.map((c) => [c.id, c.field, c.oldValue, c.newValue, c.origen]),
    [['AR650', 'fwd', '620', '700', 'contraste']]);
  assert.strictEqual(r.changes[0].sourceUrl, '', 'la URL oficial la pone quien aplica: el importador la exige');
});

test('sin clave, las columnas no reconocidas se declaran sin leer, no se dan por buenas', async () => {
  const r = await sync.analizarDocumento('huawei', catalogo(), hoja('modelo,fwd,color\nAR650,620,rojo\n'));
  assert.strictEqual(r.contraste.ia, 'sin-clave');
  assert.deepStrictEqual(r.contraste.columnasIgnoradas, ['color']);
  assert.deepStrictEqual(r.changes, [], 'lo reconocido coincide; el panel no puede decir «al día» con «color» sin leer');
});

test('un alta se informa y nunca entra en los cambios aplicables', async () => {
  const r = await sync.analizarDocumento('huawei', catalogo(), hoja('modelo,fwd\nAR9999,5000\n'));
  assert.deepStrictEqual(r.contraste.altas, ['AR9999']);
  assert.ok(!r.changes.some((c) => c.type === 'NEW' || c.id === 'AR9999'));
});

test('un PDF y una hoja sin columna de modelo siguen yendo al modelo, y sin clave fallan cerrado', async () => {
  const pdf = { tipo: 'pdf', buffer: Buffer.from('%PDF-1.7\n') };
  await assert.rejects(() => sync.analizarDocumento('huawei', catalogo(), pdf), sync.SinClave);
  await assert.rejects(() => sync.analizarDocumento('huawei', catalogo(), hoja('cosa,fwd\nx,1\n')), sync.SinClave);
});

test('con clave, el modelo recibe SOLO la columna del equipo y las no reconocidas', async () => {
  process.env.ANTHROPIC_API_KEY = 'clave-de-prueba';
  try {
    const falso = clienteFalso([
      { target: 'product', type: 'UPDATE', id: 'AR650', field: 'poe', oldValue: 'N/A', newValue: '60', reason: 'r', sourceUrl: '' },
      // El mismo equipo y campo que ya resolvió el contraste: manda el contraste.
      { target: 'product', type: 'UPDATE', id: 'AR650', field: 'fwd', oldValue: '620', newValue: '9999', reason: 'r', sourceUrl: '' },
    ]);
    sync._clienteDePrueba(falso);
    const r = await sync.analizarDocumento('huawei', catalogo(), hoja('modelo,fwd,Potencia PoE\nAR650,700,60\n'));
    assert.strictEqual(r.contraste.ia, 'columnas-no-reconocidas');
    assert.strictEqual(falso.llamadas.length, 1);
    const enviado = falso.llamadas[0].messages[0].content.filter((b) => b.type === 'text').map((b) => b.text).join('\n');
    const csv = enviado.split('CONTENIDO DEL EXCEL/CSV ADJUNTO:\n')[1].split('\n').slice(0, 2);
    assert.deepStrictEqual(csv, ['modelo,Potencia PoE', 'AR650,60'], 'la columna fwd ya contrastada no llega al modelo');
    assert.deepStrictEqual(r.changes.map((c) => [c.field, c.newValue, c.origen]),
      [['fwd', '700', 'contraste'], ['poe', '60', 'ia']]);
  } finally {
    delete process.env.ANTHROPIC_API_KEY;
    sync._clienteDePrueba(null);
  }
});

test('la llamada va a Claude Opus 5.5 con el esfuerzo explícito, sin desactivar el pensamiento', async () => {
  // Opus 5.5 piensa en `medium` si no se le dice nada (Opus 5 lo hacía en `high`), y rechaza con
  // un 400 `thinking: disabled` y un `tool_choice` forzado.
  assert.strictEqual(sync.MODELO, 'claude-opus-5-5');
  process.env.ANTHROPIC_API_KEY = 'clave-de-prueba';
  try {
    const falso = clienteFalso([]);
    sync._clienteDePrueba(falso);
    await sync.analyzeCatalog('huawei', catalogo(), null);
    const p = falso.llamadas[0];
    assert.strictEqual(p.model, 'claude-opus-5-5');
    assert.strictEqual(p.output_config.effort, sync.ESFUERZO);
    assert.ok(['low', 'medium', 'high', 'xhigh', 'max'].includes(sync.ESFUERZO));
    assert.ok(!p.thinking || p.thinking.type === 'adaptive', 'el pensamiento no se puede apagar en Opus 5.5');
    assert.ok(!p.tool_choice, 'un tool_choice forzado es un 400 en Opus 5.5');
    assert.strictEqual(p.fallbacks, 'default', 'un rechazo de los clasificadores se reintenta en el modelo de respaldo');
  } finally {
    delete process.env.ANTHROPIC_API_KEY;
    sync._clienteDePrueba(null);
  }
});
