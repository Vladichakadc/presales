'use strict';
// «OK» EN UN WORKFLOW DE TRANSPORTE SIGNIFICA «ES EL DOCUMENTO» (2026-10-07).
//
// Una pagina HTML se valida por un texto que solo puede estar en el documento correcto
// (`debeContener`). Las que se piden para ver que hay —un indice del archivo, una pagina de
// control— no tienen ese texto, y hasta hoy el informe las daba por buenas igual: cinco
// pantallas de inicio de sesion de Huawei salieron «OK» en la corrida 37613969445. Ahora cada
// entrada HTML declara una de las dos cosas, el workflow se niega a correr si alguna no lo hace,
// y el informe dice EXPL para lo explorado.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

// La lista de traer-cisco-huawei vive en scripts/transporte/ desde el 2026-10-28 (antes, dentro del YAML).
const WORKFLOWS = ['traer-fortinet-pendientes.yml'];
const leer = (f) => fs.readFileSync(path.join(__dirname, '..', '.github', 'workflows', f), 'utf8');
const TRAER = fs.readFileSync(path.join(__dirname, '..', 'scripts', 'transporte', 'traer.js'), 'utf8');
const DOCS = require('../scripts/transporte/documentos.js');

// Cada entrada empieza en «{ archivo: '…'» y sus atributos llegan hasta «urls:».
function entradasHtml(src) {
  const out = [];
  const re = /\{ archivo: '([^']+)', tipo: 'html'([\s\S]*?)urls:/g;
  for (const m of src.matchAll(re)) out.push({ archivo: m[1], atributos: m[2] });
  return out;
}

test('toda entrada HTML de un transporte declara su texto exigido o que es una exploracion', () => {
  for (const f of WORKFLOWS) {
    const entradas = entradasHtml(leer(f));
    assert.ok(entradas.length > 0, `${f}: no se encontro ninguna entrada HTML (¿cambio el formato?)`);
    for (const e of entradas) {
      assert.ok(/debeContener:/.test(e.atributos) || /exploracion: true/.test(e.atributos),
        `${f}: ${e.archivo} no dice ni debeContener ni exploracion: true`);
    }
  }
  const html = DOCS.filter((d) => d.tipo === 'html');
  assert.ok(html.length > 0, 'scripts/transporte/documentos.js: ninguna entrada HTML');
  for (const d of html) {
    assert.ok(d.debeContener || d.exploracion === true, `documentos.js: ${d.archivo} no dice ni debeContener ni exploracion: true`);
  }
});

test('traer-cisco-huawei se niega a correr con una entrada sin declarar, e informa EXPL aparte de OK', () => {
  const src = TRAER;
  assert.match(src, /d\.tipo === 'html' && !d\.debeContener && !d\.exploracion/);
  // Que valida antes de pedir nada se comprueba ejecutándolo (test/transporte-traer.test.js): `traer()`
  // rechaza la lista con `validar()` antes del primer `fetch`.
  assert.match(src, /const motivo = validar\(docs, solo\);\n\s*if \(motivo\) throw new Error\(motivo\);/, 'la comprobacion corre antes de pedir nada');
  const re = /d\.guardado \? \(d\.exploracion \? 'EXPL ' : 'OK   '\) : 'FALLA'/g;
  assert.strictEqual((src.match(re) || []).length, 1, 'el registro de la corrida dice EXPL');
  assert.strictEqual((leer('traer-cisco-huawei.yml').match(re) || []).length, 1, 'el resumen de la corrida dice EXPL');
  assert.match(src, /verificado: !doc\.exploracion/);
});
