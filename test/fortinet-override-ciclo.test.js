'use strict';
/* Del override por ciclo de vida a la operación que lo admite, en un clic (mejora propuesta al
   cerrar el PR #51, ejecutada por encargo del dueño el 2026-10-28: «ejecuta las mejoras
   propuestas»).

   En compra nueva, elegir un fuera de venta que cumple el escenario bloquea la cotización
   (`CICLO_VIDA`). Quien lo elige casi siempre amplía o renueva un parque instalado: la caja del
   override ofrece declararlo en un clic. Lo que NO puede pasar: que los botones aparezcan cuando el
   equipo además no llega a la capacidad (eso no lo arregla cambiar el tipo de compra), o que el
   clic deje cotizar sin la justificación, que el motor sigue exigiendo. */

const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const M = require('../public/js/fortinet-motor.js');
const F = require('../server/seed/legacyData/fortinet.js');

const JS = fs.readFileSync(path.join(__dirname, '..', 'public', 'js', 'dimensionador-fortinet-fortigate.js'), 'utf8');
const CAT = {
  models: F.MODELS.map((m) => ({ ...m, eol: !m.hwSku })),
  bundles: F.BUNDLES, care: F.CARE, funciones: F.FUNCIONES,
  serviciosSdwan: F.SERVICIOS_SDWAN, terminos: F.TERMINOS, fortios: F.FORTIOS,
  ems: F.EMS_LICENCIAS, sase: F.SASE_USUARIOS, datasetVersion: 'fortinet@prueba',
};
// El escenario de referencia del e2e (CU-01 del informe de auditoría).
const CU01 = (comercial, manual) => ({
  sitio: { segmento: 'branch' },
  topologia: { rol: 'spoke', hubs: 2, enlaces: [{ id: 1, tipo: 'DIA', down: 500, overlay: true }] },
  trafico: { interVlanMbps: 200 },
  seguridad: { capa: 'tp', funciones: ['chkAv', 'chkWeb', 'chkSsl'] },
  remoto: { activo: true, metodo: 'ipsec', usuarios: 50, mbps: 100 },
  escala: { usuarios: 300, sesionesPorUsuario: 75, vidaSesionS: 30 },
  politica: { crecimientoPct: 30, techoPct: 70 },
  comercial,
  seleccion: { manual },
});
const evaluar = (e) => M.evaluar(e, CAT, { hoy: '2026-10-28T00:00:00Z' });
// La misma condición que la página (`soloCiclo`), leída de su código para no copiarla.
function soloCicloDeLaPagina() {
  const m = /const soloCiclo = ([\s\S]*?);\n/.exec(JS);
  assert.ok(m, 'la página ya no declara soloCiclo');
  // eslint-disable-next-line no-new-func
  return new Function('ov', `return ${m[1]};`);
}

test('cumple y solo lo aparta el ciclo: la caja ofrece declarar la operación', () => {
  const soloCiclo = soloCicloDeLaPagina();
  const r = evaluar(CU01({ motivo: 'nueva' }, 'FortiGate 200F'));
  assert.strictEqual(r.override.elegible, false);
  assert.strictEqual(soloCiclo(r.override), true);
});

test('si además no llega a la capacidad, no se ofrece: cambiar el tipo de compra no lo arregla', () => {
  const soloCiclo = soloCicloDeLaPagina();
  const r = evaluar(CU01({ motivo: 'nueva' }, 'FortiGate 100F'));
  assert.ok(r.override.deficit.length > 0, 'el 100F no llega en CU-01');
  assert.strictEqual(soloCiclo(r.override), false);
  // Un vigente que no llega tampoco: no tiene bloqueo de ciclo.
  const v = evaluar(CU01({ motivo: 'nueva' }, 'FortiGate 40F'));
  assert.strictEqual(soloCiclo(v.override), false);
});

test('tras el clic (ampliación), el equipo queda validado y la cotización espera la justificación', () => {
  const sin = evaluar(CU01({ motivo: 'ampliacion' }, 'FortiGate 200F'));
  assert.strictEqual(sin.seleccion.id, 'FortiGate 200F');
  assert.ok(sin.faltan.includes('comercial.justificacionEol'));
  assert.strictEqual(sin.quoteGate, 'BLOCKED', 'sin justificación no se cotiza');
  const con = evaluar(CU01({ motivo: 'ampliacion', justificacionEol: 'Ampliación del clúster instalado' }, 'FortiGate 200F'));
  assert.ok(!con.faltan.includes('comercial.justificacionEol'));
  assert.notStrictEqual(con.quoteGate, 'BLOCKED');
  assert.notStrictEqual(con.quoteGate, 'READY', 'un fuera de venta nunca sale listo sin reparo');
});

test('el clic solo cambia el tipo de compra: nunca escribe la justificación ni acepta otro valor', () => {
  const m = /if \(c\.accion === 'motivo-ciclo'[\s\S]*?\n {2}\}\n/.exec(JS);
  assert.ok(m, 'falta la acción motivo-ciclo');
  assert.match(m[0], /\['ampliacion', 'renovacion', 'coterm'\]\.includes\(c\.valor\)/);
  assert.doesNotMatch(m[0], /justificacionEol'\)\.value\s*=|\.value = .*justif/i);
  assert.match(m[0], /irAlCampo\(falta\)/);
});
