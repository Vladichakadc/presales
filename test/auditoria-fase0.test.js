'use strict';
/* REGRESIONES DE LA AUDITORIA 2026-11-09 (fase 0). */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const huawei = require('../public/js/huawei-motor.js');
const { MODELS } = require('../server/seed/legacyData/huawei.js');

const base = { bw: 5000, unit: 1, mode: 'link', sites: 1, conc: 40, head: 30, dirMult: 2, frame: 340,
  profile: 'typ', lan: 0, aps: 0, svc: { sdwan: true }, want: {} };

test('Huawei: margen o concurrencia ausentes/no numericos no dan NaN ni recomiendan un equipo chico', () => {
  const ref = huawei.evaluar(base, MODELS);
  for (const parche of [{ head: undefined }, { head: 'abc' }, { head: null }]) {
    const r = huawei.evaluar({ ...base, ...parche }, MODELS);
    assert.ok(Number.isFinite(r.need), `need finito con ${JSON.stringify(parche)}`);
    assert.strictEqual(r.need, ref.need);
    assert.strictEqual(r.pick && r.pick.m.id, ref.pick && ref.pick.m.id);
  }
  const hub = huawei.evaluar({ ...base, mode: 'agg', sites: 50, conc: undefined }, MODELS);
  assert.ok(Number.isFinite(hub.need), 'concurrencia ausente no da NaN');
});

test('Huawei: un margen de 0 escrito a proposito se respeta (no se confunde con ausente)', () => {
  const r = huawei.evaluar({ ...base, head: 0 }, MODELS);
  assert.strictEqual(r.head, 0);
});

test('escape HTML: las paginas que lo usan en atributos escapan comillas dobles y simples', () => {
  for (const f of ['cotizador.js', 'index.js', 'dimensionador-huawei-netengine.js']) {
    const src = fs.readFileSync(path.join(__dirname, '..', 'public', 'js', f), 'utf8');
    const linea = src.split('\n').find((l) => /^const esc\s*=/.test(l));
    assert.ok(linea, `${f} define esc`);
    const esc = vm.runInNewContext(`${linea}; esc`);
    assert.strictEqual(esc('Rack 19" O\'Brien <&>'), 'Rack 19&quot; O&#39;Brien &lt;&amp;&gt;', f);
    assert.ok(!esc('Rack 19"').includes('"'), `${f}: ninguna comilla doble sin escapar`);
  }
});
