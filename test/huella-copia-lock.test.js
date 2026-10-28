'use strict';
// La copia de public/datasheets/ y la huella que el vigía da por verificada tienen que ser el
// mismo documento (mejora aprobada el 2026-10-28). Las cifras del catálogo salen de la copia y el
// vigía avisa cuando cambia lo que está en `hashVerificado`: si las dos se separan, se vigila un
// documento distinto del que se leyó y nadie lo ve. El 2026-10-28 (PR #47) se movieron a mano a la
// vez para EdgeConnect (Rev. 9) y la serie 9000; esto lo deja escrito.
//
// Solo aplica a las entradas que el vigía sigue por sus BYTES (`clase: 'bytes'`, un PDF): las de
// `texto` llevan la huella del texto de una página HTML, que no es la del PDF copiado.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { DATASHEETS } = require('../server/seed/legacyData/aruba.js');
const { documentos } = require('../server/seed/legacyData/fuentes.lock.json');

const RAIZ = path.join(__dirname, '..');
const sha = (f) => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');

// Excepciones con su motivo, como en `limites`: hoy ninguna.
const EXCEPCIONES = {};

function parejas() {
  const out = [];
  for (const [clave, d] of Object.entries(DATASHEETS)) {
    if (!d.url || !d.file) continue;
    const copia = path.join(RAIZ, 'public/datasheets', d.file);
    if (!fs.existsSync(copia)) continue;
    for (const [k, e] of Object.entries(documentos)) {
      if (k.slice(k.indexOf('::') + 2) !== d.url || e.clase !== 'bytes' || !e.hashVerificado) continue;
      out.push({ clave, url: d.url, archivo: d.file, copia, verificado: e.hashVerificado });
    }
  }
  return out;
}

test('cada fuente PDF con copia: la huella verificada del vigía es la de la copia', () => {
  const p = parejas();
  assert.ok(p.length >= 4, `se esperaban al menos las cuatro de hoy, salen ${p.length}`);
  const malas = p.filter((x) => !EXCEPCIONES[x.clave] && sha(x.copia) !== x.verificado)
    .map((x) => `${x.clave}: public/datasheets/${x.archivo} es sha256 ${sha(x.copia).slice(0, 16)}, el lock verifica ${x.verificado.slice(0, 16)} (${x.url})`);
  assert.deepStrictEqual(malas, [], 'copia y lock separados: o la copia no es lo que se contrastó, o el lock dio por bueno otro documento. '
    + 'Se cambian juntos, después de contrastar.');
});

test('una excepción declarada sigue haciendo falta y lleva motivo', () => {
  const p = parejas();
  for (const [clave, motivo] of Object.entries(EXCEPCIONES)) {
    assert.ok(typeof motivo === 'string' && motivo.length > 20, `${clave}: la excepción necesita su motivo`);
    const x = p.find((y) => y.clave === clave);
    assert.ok(x && sha(x.copia) !== x.verificado, `${clave}: ya casa, sobra la excepción`);
  }
});
