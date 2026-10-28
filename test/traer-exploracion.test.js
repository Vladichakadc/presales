'use strict';
// «OK» EN UN WORKFLOW DE TRANSPORTE SIGNIFICA «ES EL DOCUMENTO» (2026-10-07).
//
// Una pagina HTML se valida por un texto que solo puede estar en el documento correcto
// (`debeContener`). Las que se piden para ver que hay —un indice del archivo, una pagina de
// control— no tienen ese texto, y hasta hoy el informe las daba por buenas igual: cinco
// pantallas de inicio de sesion de Huawei salieron «OK» en la corrida 37613969445. Ahora cada
// entrada HTML declara una de las dos cosas, el workflow se niega a correr si alguna no lo hace,
// y el informe dice EXPL para lo explorado. Desde el 2026-10-28 la lista y el script de
// `traer-cisco-huawei.yml` viven en `scripts/transporte/` (fuera del YAML); `traer-fortinet-pendientes.yml`
// sigue con su script dentro.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const RAIZ = path.join(__dirname, '..');
const FUENTES = ['scripts/transporte/documentos.js', '.github/workflows/traer-fortinet-pendientes.yml'];
const leer = (f) => fs.readFileSync(path.join(RAIZ, f), 'utf8');

// Cada entrada empieza en «{ archivo: '…'» y sus atributos llegan hasta «urls:».
function entradasHtml(src) {
  const out = [];
  const re = /\{ archivo: '([^']+)', tipo: 'html'([\s\S]*?)urls:/g;
  for (const m of src.matchAll(re)) out.push({ archivo: m[1], atributos: m[2] });
  return out;
}

test('toda entrada HTML de un transporte declara su texto exigido o que es una exploracion', () => {
  for (const f of FUENTES) {
    const entradas = entradasHtml(leer(f));
    assert.ok(entradas.length > 0, `${f}: no se encontro ninguna entrada HTML (¿cambio el formato?)`);
    for (const e of entradas) {
      assert.ok(/debeContener:/.test(e.atributos) || /exploracion: true/.test(e.atributos),
        `${f}: ${e.archivo} no dice ni debeContener ni exploracion: true`);
    }
  }
});

test('el transporte se niega a correr con una entrada sin declarar, e informa EXPL aparte de OK', () => {
  const src = leer('scripts/transporte/traer.js');
  assert.match(src, /d\.tipo === 'html' && !d\.debeContener && !d\.exploracion/);
  assert.match(src, /process\.exit\(1\); \}\n\s*const SOLO/, 'la comprobacion corre antes de pedir nada');
  // El registro de la corrida (el script) y el resumen (paso del workflow) dicen EXPL.
  const expl = /d\.guardado \? \(d\.exploracion \? 'EXPL ' : 'OK   '\) : 'FALLA'/g;
  assert.strictEqual((src.match(expl) || []).length, 1, 'el registro de la corrida dice EXPL');
  assert.strictEqual((leer('.github/workflows/traer-cisco-huawei.yml').match(expl) || []).length, 1, 'el resumen dice EXPL');
  assert.match(src, /verificado: !doc\.exploracion/);
});
