'use strict';
// Qué equipos respalda cada fuente (`modelos` en legacyData/fuentes.js, 2026-10-19).
//
// La hoja «Supuestos» del Excel decía qué documentos respaldan al equipo cotizado buscando su
// nombre en la prosa de `cubre`: un título de serie o un modelo citado de pasada atribuía una
// fuente que no respalda la cifra. Ahora se declara, y estas pruebas frenan lo que puede salir
// mal en silencio: un id que no existe (un equipo renombrado), una atribución que el propio texto
// de la fuente ni menciona, y un modelo nuevo del catálogo que entra sin ninguna fuente.
const test = require('node:test');
const assert = require('node:assert');
const { FUENTES, resolverModelos, fuentesDe } = require('../server/seed/legacyData/fuentes');

const VENDORS = ['huawei', 'cisco', 'fortinet', 'mikrotik', 'aruba', 'juniper', 'nokia'];
const idsDe = (v) => {
  const m = require(`../server/seed/legacyData/${v}`);
  return [...(m.MODELS || []), ...(m.MODELS_ROUTER || [])].map((x) => x.id);
};

test('cada modelo declarado existe en el catálogo y el texto de su fuente lo nombra', () => {
  const malas = [];
  for (const v of Object.keys(FUENTES)) {
    for (const f of FUENTES[v]) {
      if (f.modelos === undefined) continue;
      const r = resolverModelos(v, f);
      if (r.desconocidos.length || r.sinMencion.length) {
        malas.push(`\n  ${v} · ${f.documento}: no existen ${JSON.stringify(r.desconocidos)}; el texto no nombra ${JSON.stringify(r.sinMencion)}`);
      }
    }
  }
  assert.strictEqual(malas.length, 0, `fuentes con modelos mal declarados:${malas.join('')}`);
});

test('ningún equipo del catálogo se queda sin una fuente que lo declare', () => {
  for (const v of VENDORS) {
    const cubiertos = new Set(fuentesDe(v).flatMap((f) => f.modelosResueltos || []));
    const sin = idsDe(v).filter((id) => !cubiertos.has(id));
    assert.deepStrictEqual(sin, [], `${v}: sin fuente declarada → ${sin.join(', ')}`);
  }
});

test('la guarda mira de verdad: un id inventado y una atribución que el texto no nombra se detectan', () => {
  const inventado = resolverModelos('huawei', { documento: 'Ficha del AR611', cubre: 'x', modelos: ['AR9999'] });
  assert.deepStrictEqual(inventado.desconocidos, ['AR9999']);
  const ajeno = resolverModelos('huawei', { documento: 'Ficha del AR611', cubre: 'cifras del AR611', modelos: ['NE8000 F8'] });
  assert.deepStrictEqual(ajeno.sinMencion, ['NE8000 F8'], 'la ficha del AR611 no puede respaldar un NE8000');
  assert.deepStrictEqual(resolverModelos('huawei', { documento: 'Ficha del AR611', cubre: 'x', modelos: ['AR611'] }).ids, ['AR611']);
});

test('tres estados: declarado, «ninguno» y «no declarado»; y la serie arrastra a sus equipos', () => {
  assert.strictEqual(resolverModelos('huawei', { documento: 'x' }).ids, null, 'sin declarar no es «ninguno»');
  assert.deepStrictEqual(resolverModelos('huawei', { documento: 'x', modelos: [] }).ids, []);
  assert.strictEqual(resolverModelos('fortinet', { documento: 'x', modelos: '*' }).ids.length, idsDe('fortinet').length);
  const serie = resolverModelos('huawei', { documento: 'AR650 Series', cubre: '', modelos: ['AR650'] }).ids;
  assert.deepStrictEqual(serie.sort(), ['AR651', 'AR651W-8P']);
  // Exacto, no por subcadena: el NE8000 M1D no arrastra al M1D-B.
  assert.deepStrictEqual(resolverModelos('huawei', { documento: 'NE8000 M1D', cubre: '', modelos: ['NE8000 M1D'] }).ids, ['NE8000 M1D']);
});

test('fuentesDe lleva los modelos resueltos a la API (la hoja «Supuestos» los lee de ahí)', () => {
  const f = fuentesDe('huawei').find((x) => /AR650 Series/.test(x.documento));
  assert.deepStrictEqual([...f.modelosResueltos].sort(), ['AR651', 'AR651W-8P']);
  const folleto = fuentesDe('huawei').find((x) => x.documento === 'NetEngine A800 E Series Brochure');
  assert.deepStrictEqual(folleto.modelosResueltos, [], 'el folleto de contexto ya no respalda ninguna cifra');
});
