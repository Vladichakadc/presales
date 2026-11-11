'use strict';
// FortiOS 8.0 en el dimensionador de Fortinet (2026-11-10, encargo del dueño: «trae las
// características de la versión 8.0.2 al dimensionador, es decir que al seleccionarlo debe tener en
// cuenta lo nuevo que trae»). Lo que entra es lo que dicen las Release Notes de FortiOS 8.0.2, leídas
// (fuente/fortios-rn-2026-11-09). Se fija:
//   1. sin elegir 8.0 nada cambia: la versión por defecto y la huella de un escenario guardado;
//   2. con 8.0, solo compiten los modelos que sus Release Notes nombran, el modo túnel SSL-VPN está
//      retirado y los modelos de 2 GB no admiten inspección proxy, cada cosa con su fuente;
//   3. lo que 8.0.2 no documenta no se inventa: las cifras siguen siendo las de 7.6 y se dice.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const F = require('../server/seed/legacyData/fortinet.js');
const M = require('../public/js/fortinet-motor.js');

const CAT = { models: F.MODELS.map((m) => ({ ...m, eol: !m.hwSku })), bundles: F.BUNDLES, care: F.CARE,
  funciones: F.FUNCIONES, serviciosSdwan: F.SERVICIOS_SDWAN, terminos: F.TERMINOS, fortios: F.FORTIOS,
  ems: F.EMS_LICENCIAS, sase: F.SASE_USUARIOS, extenders: F.FORTIEXTENDER, datasetVersion: 'fortinet@prueba' };
const HOY = { hoy: '2026-11-10T00:00:00Z' };
const esc = (mas = {}) => ({ topologia: { rol: 'none', enlaces: [{ id: 1, tipo: 'DIA', down: 300 }] }, seguridad: { capa: 'tp' }, ...mas });
const ev = (e) => M.evaluar(e, CAT, HOY);
const V8 = F.FORTIOS.versiones.find((v) => v.id === '8.0');
const descartadoPor = (r, id, codigo) => (r.descartados || []).find((d) => d.modelo.id === id && d.bloqueos.some((b) => b.codigo === codigo));

test('8.0 es una rama más, y no la de por defecto: lo guardado no cambia', () => {
  assert.deepStrictEqual(F.FORTIOS.versiones.map((v) => v.id), ['7.4', '7.6.0-7.6.2', '7.6.3+', '8.0']);
  assert.strictEqual(F.FORTIOS.porDefecto, '7.6.3+');
  assert.strictEqual(M.POR_DEFECTO.software.fortiOS, '7.6.3+');
  // El esquema acepta las mismas ramas que declara el catálogo, y la página las ofrece.
  const html = fs.readFileSync(path.join(__dirname, '..', 'public', 'dimensionador-fortinet-fortigate.html'), 'utf8');
  const select = html.slice(html.indexOf('<select id="fortiOS">'), html.indexOf('</select>', html.indexOf('<select id="fortiOS">')));
  assert.deepStrictEqual([...select.matchAll(/value="([^"]+)"/g)].map((x) => x[1]).sort(), F.FORTIOS.versiones.map((v) => v.id).sort());
  assert.match(select, /value="7\.6\.3\+" selected/);
  for (const v of F.FORTIOS.versiones) assert.deepStrictEqual(ev(esc({ software: { fortiOS: v.id } })).errores, [], v.id);
  // Un escenario que no nombra la versión se evalúa igual que con 7.6.3+, y con la misma huella.
  const a = ev(esc()); const b = ev(esc({ software: { fortiOS: '7.6.3+' } }));
  assert.strictEqual(a.scenarioHash, b.scenarioHash);
  assert.strictEqual(a.recomendacion.modelo.id, b.recomendacion.modelo.id);
  assert.ok(!a.supuestos.some((x) => /FortiOS 8\.0/.test(x)));
});

test('la lista de modelos soportados es la de las Release Notes de 8.0.2, y cubre el catálogo salvo el FortiWiFi 50G-5G-II', () => {
  assert.match(V8.soportadosFuente, /^FortiOS 8\.0\.2 Release Notes \(build 0251, 2026-10-26\), pp\. 6-7/);
  assert.strictEqual(new Set(V8.soportados).size, V8.soportados.length, 'sin repetidos');
  for (const c of V8.soportados) assert.match(c, /^(FG|FWF)-[0-9A-Z]+(-[0-9A-Z]+)*$/, c);
  // Lo que la lista dice y lo que no, tal como lo imprime el documento.
  for (const c of ['FG-30G', 'FG-40F-3G4G', 'FG-50G-5G', 'FG-90G', 'FG-200G', 'FG-3800G', 'FG-7081F', 'FG-7121F', 'FWF-50G-5G', 'FWF-70G-POE']) assert.ok(V8.soportados.includes(c), c);
  for (const c of ['FWF-50G-5G-II', 'FG-3000D', 'FG-3700D', 'FG-5001E']) assert.ok(!V8.soportados.includes(c), `${c} no está en la lista de 8.0.2`);
  const fuera = CAT.models.filter((m) => { const x = M.soportadoEnVersion(m, { software: { fortiOS: '8.0' } }, F.FORTIOS); return x && !x.ok; }).map((m) => m.id);
  assert.deepStrictEqual(fuera, ['FortiWiFi 50G-5G-II'], 'el único del catálogo que 8.0.2 no nombra');
  // Una rama sin lista no frena a nadie: no se sabe.
  assert.strictEqual(M.soportadoEnVersion(CAT.models[0], { software: { fortiOS: '7.6.3+' } }, F.FORTIOS), null);
});

test('con 8.0 un modelo que sus Release Notes no nombran se aparta, con el documento', () => {
  const wifi5g = { fisico: { wifi: true, celular: '5g', celularVia: 'integrado' },
    topologia: { rol: 'none', enlaces: [{ id: 1, tipo: 'DIA', down: 300 }, { id: 2, tipo: '4G/5G', down: 100, rol: 'respaldo' }] } };
  const con76 = ev(esc(wifi5g));
  assert.strictEqual(con76.recomendacion && con76.recomendacion.modelo.id, 'FortiWiFi 50G-5G-II', 'con 7.6.3+ es el único con Wi-Fi y 5G');
  const con8 = ev(esc({ ...wifi5g, software: { fortiOS: '8.0' } }));
  assert.strictEqual(con8.recomendacion, null);
  const d = descartadoPor(con8, 'FortiWiFi 50G-5G-II', 'FORTIOS_MODELO');
  assert.ok(d, 'apartado por la versión');
  const b = d.bloqueos.find((x) => x.codigo === 'FORTIOS_MODELO');
  assert.strictEqual(b.mensaje, 'FortiWiFi 50G-5G-II (FWF-50G-5G-II) no figura entre los modelos soportados por FortiOS 8.0 (8.0.2).');
  assert.strictEqual(b.fuente, V8.soportadosFuente);
  // Si era el único que cumplía, el bloqueo del escenario dice la causa antes que «ningún modelo cumple»,
  // y ofrece volver a la rama por defecto.
  assert.deepStrictEqual(con8.bloqueos.map((x) => x.codigo), ['fortios-modelo-no-soportado', 'sin-candidato']);
  const causa = con8.bloqueos[0];
  assert.strictEqual(causa.mensaje, 'Con FortiOS 8.0 (8.0.2), FortiWiFi 50G-5G-II cumple el escenario pero no figura entre los modelos que esa versión soporta.');
  assert.deepStrictEqual(causa.correccion, { accion: 'cambiar', campo: 'software.fortiOS', valor: '7.6.3+' });
  assert.strictEqual(causa.fuente, V8.soportadosFuente);
  // La lista de descartados lo dice con sus palabras, no como «no admite la función pedida».
  const E = require('../public/js/fortinet-explicacion.js');
  assert.strictEqual(E.RESTRICCION_N.FORTIOS_MODELO, 'no figura entre los modelos soportados por la versión de FortiOS elegida');
});

test('con 8.0 el modo túnel SSL-VPN está retirado en todos los modelos, como dicen sus Release Notes', () => {
  const remoto = { remoto: { activo: true, metodo: 'sslvpn', usuarios: 50, mbps: 50 } };
  const r = ev(esc({ ...remoto, software: { fortiOS: '8.0' } }));
  const todos = JSON.stringify(r);
  assert.ok(/fortios-funcion-retirada/.test(todos), 'el bloqueo de escenario está');
  assert.match(todos, /SSL-VPN en modo túnel está retirado en FortiOS 8\.0: el acceso remoto se diseña con IPsec\./);
  assert.match(todos, /FortiOS 8\.0\.2 Release Notes \(build 0251, 2026-10-26\), p\. 10: «SSL VPN tunnel mode is not longer supported on any models\.»/);
  assert.ok(!r.recomendacion, 'ningún modelo lo admite');
  // El texto de 7.6.3+ no cambia.
  assert.match(JSON.stringify(ev(esc({ ...remoto, software: { fortiOS: '7.6.3+' } }))), /está retirado en FortiOS 7\.6\.3 o superior: el acceso remoto/);
  // Y con 7.6.0-7.6.2 sigue existiendo.
  assert.ok(!/fortios-funcion-retirada/.test(JSON.stringify(ev(esc({ ...remoto, software: { fortiOS: '7.6.0-7.6.2' } })))));
  assert.strictEqual(M.sslvpnRetirada({ software: { fortiOS: '8.0' } }, F.FORTIOS).versiones[0], '8.0');
  assert.strictEqual(M.sslvpnRetirada({ software: { fortiOS: '7.4' } }, F.FORTIOS), null);
});

test('con 8.0 los modelos de 2 GB no admiten inspección proxy: los que nombra 8.0.2 citan 8.0.2', () => {
  const s8 = { software: { fortiOS: '8.0', inspeccion: 'proxy' }, remoto: { activo: false } };
  const de = (id) => M.compatibilidad(CAT.models.find((m) => m.id === id), 'proxy', s8, F.FORTIOS);
  for (const id of ['FortiGate 40F', 'FortiGate 50G', 'FortiGate 51G', 'FortiGate 60F', 'FortiGate 61F', 'FortiWiFi 50G', 'FortiGate 40F-3G4G']) {
    const c = de(id);
    assert.strictEqual(c.estado, 'limitada', id);
    assert.match(c.regla.fuente, /^FortiOS 8\.0\.2 Release Notes .*p\. 11.*40F, 60F, and 50G series devices, along with their variants/, id);
  }
  // 30G y 31G: 8.0.2 no los nombra; siguen limitados por la nota 12 del Product Matrix, que no depende de la versión.
  assert.match(de('FortiGate 30G').regla.fuente, /^Product Matrix oct-2026, nota 12/);
  assert.strictEqual(de('FortiGate 30G').estado, 'limitada');
  assert.strictEqual(de('FortiGate 100F').estado, 'soportada');
});

test('lo que 8.0.2 no documenta se dice: cifras y topes de 7.6, en los supuestos y solo con 8.0', () => {
  const r = ev(esc({ software: { fortiOS: '8.0' } }));
  const sup = r.supuestos.find((x) => /^FortiOS 8\.0:/.test(x));
  assert.ok(sup, r.supuestos.join(' | '));
  assert.match(sup, /Maximum Values Table de FortiOS 7\.6\.7; la tabla de 8\.0 no se ha traído/);
  // Mismo equipo y mismas cifras que con 7.6.3+ en un escenario que 8.0 no restringe.
  const r76 = ev(esc());
  assert.strictEqual(r.recomendacion.modelo.id, r76.recomendacion.modelo.id);
  assert.notStrictEqual(r.scenarioHash, r76.scenarioHash, 'la versión viaja en la huella');
});

test('la página nombra las mismas ramas sin SSL-VPN que las reglas del catálogo', () => {
  const js = fs.readFileSync(path.join(__dirname, '..', 'public', 'js', 'dimensionador-fortinet-fortigate.js'), 'utf8');
  const m = /const SIN_SSLVPN = \{([^}]+)\};/.exec(js);
  const enPagina = [...m[1].matchAll(/'([^']+)':/g)].map((x) => x[1]).sort();
  const enReglas = [...new Set(F.FORTIOS.reglas.filter((r) => r.funcion === 'sslvpn' && r.modelos === '*' && r.estado === 'retirada').flatMap((r) => r.versiones))].sort();
  assert.deepStrictEqual(enPagina, enReglas);
});
