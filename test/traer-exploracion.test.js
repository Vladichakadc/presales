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

const WORKFLOWS = ['traer-cisco-huawei.yml', 'traer-fortinet-pendientes.yml'];
const leer = (f) => fs.readFileSync(path.join(__dirname, '..', '.github', 'workflows', f), 'utf8');

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
});

test('traer-cisco-huawei se niega a correr con una entrada sin declarar, e informa EXPL aparte de OK', () => {
  const src = leer('traer-cisco-huawei.yml');
  assert.match(src, /d\.tipo === 'html' && !d\.debeContener && !d\.exploracion/);
  assert.match(src, /process\.exit\(1\); \}\n\s*const SOLO/, 'la comprobacion corre antes de pedir nada');
  const impresiones = src.match(/d\.guardado \? \(d\.exploracion \? 'EXPL ' : 'OK   '\) : 'FALLA'/g) || [];
  assert.strictEqual(impresiones.length, 2, 'el registro de la corrida y el resumen dicen EXPL');
  assert.match(src, /verificado: !doc\.exploracion/);
});
