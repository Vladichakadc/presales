'use strict';
/* Los campos del perfil multi-sede salen de los del enlace (mejora decidida por el dueño el
   2026-10-30, «versión reformulada» de «los campos del perfil, de la misma lista que el enlace»).

   Cada página llevaba dos listas escritas a mano: la que viaja en el enlace (`ESTADO.vincular`) y la
   que guarda un perfil (`CAMPOS_PERFIL` + `SEGS_PERFIL`). No eran copias desviadas, sino que
   difieren a propósito: el equipo se guarda aparte, el descuento y el simulador financiero no entran
   en el consolidado y el perfil guarda opciones del BOM que el enlace no lleva. Pero nada frenaba
   la deriva, y ya había pasado: en MikroTik «Exigir PQC» viajaba en el enlace y un perfil cargado lo
   perdía. Ahora la lista del perfil se calcula de la del enlace, y cada página declara solo sus
   excepciones (`PERFIL_SIN`, `PERFIL_EXTRA`) con su motivo. Aruba y Fortinet ya usaban una sola
   lista (`CAMPOS_ESCENARIO`) para las dos cosas. */

const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const RAIZ = path.join(__dirname, '..', 'public');
const leer = (p) => fs.readFileSync(path.join(RAIZ, p), 'utf8');
const DERIVADAS = ['cisco-catalyst8k', 'huawei-netengine', 'juniper-srx', 'mikrotik-routeros', 'nokia-7750sr'];
const UNA_LISTA = ['aruba-edgeconnect', 'fortinet-fortigate'];

// Las listas de la página, evaluadas tal como están escritas (no una copia de ellas).
function listas(js) {
  let code = '';
  for (const n of ['ENTRADAS', 'CAMPOS_SA', 'CAMPOS_ENLACE', 'PERFIL_SIN', 'PERFIL_EXTRA', 'SEGS_PERFIL', 'CAMPOS_PERFIL']) {
    const m = new RegExp(`const ${n}\\s*=\\s*\\[[\\s\\S]*?\\];`).exec(js);
    if (m) code += `${m[0].replace('const ', 'var ')}\n`;
  }
  const ctx = {};
  vm.runInNewContext(code, ctx);
  return ctx;
}

for (const p of DERIVADAS) {
  const js = leer(`js/dimensionador-${p}.js`);
  const html = leer(`dimensionador-${p}.html`);

  test(`${p}: la lista del perfil se calcula de la del enlace, nunca se escribe a mano`, () => {
    assert.match(js, /ESTADO\.vincular\(\{\s*campos: CAMPOS_ENLACE\b/, 'el enlace usa CAMPOS_ENLACE');
    assert.match(js, /const CAMPOS_PERFIL = \[\.\.\.CAMPOS_ENLACE\.filter\(\(id\) => !SEGS_PERFIL\.includes\(id\) && !PERFIL_SIN\.includes\(id\)\),\s*\.\.\.PERFIL_EXTRA\];/);
    assert.strictEqual((js.match(/const CAMPOS_PERFIL\b/g) || []).length, 1, 'una sola definición');
  });

  test(`${p}: cada excepción es real y se puede leer en la pantalla`, () => {
    const L = listas(js);
    const enlace = new Set(L.CAMPOS_ENLACE);
    for (const id of L.PERFIL_SIN) assert.ok(enlace.has(id), `PERFIL_SIN «${id}» no está en el enlace: excepción muerta`);
    for (const id of L.SEGS_PERFIL) assert.ok(enlace.has(id), `«${id}» se guarda en el perfil pero no viaja en el enlace`);
    for (const id of L.PERFIL_EXTRA) {
      assert.ok(!enlace.has(id), `PERFIL_EXTRA «${id}» ya está en el enlace: sobra`);
      assert.ok(html.includes(`id="${id}"`), `PERFIL_EXTRA «${id}» no es un campo de la página`);
    }
    assert.ok(!L.CAMPOS_PERFIL.includes('verdict-sel'), 'el equipo lo guarda el perfil aparte, en `modelo`');
    assert.ok(L.CAMPOS_PERFIL.includes('reqPqc'), '«Exigir PQC» se guarda en el perfil');
  });
}

for (const p of UNA_LISTA) {
  test(`${p}: perfil y enlace usan la misma lista`, () => {
    const js = leer(`js/dimensionador-${p}.js`);
    assert.match(js, /function capturarCampos\s*\(\)\s*\{\s*const v\s*=\s*\{\};\s*CAMPOS_ESCENARIO\.forEach/);
    assert.match(js, /campos: CAMPOS_ESCENARIO\b/);
    assert.ok(listas(js.replace('CAMPOS_ESCENARIO', 'CAMPOS_ENLACE')).CAMPOS_ENLACE.includes('reqPqc'),
      '«Exigir PQC» se guarda en el perfil');
  });
}
