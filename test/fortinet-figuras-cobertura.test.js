'use strict';
// Cada FortiExtender de la tabla y cada variante (FortiWiFi y FortiGate con módem) tiene su figura
// oficial, o está declarado sin ella con su motivo (mejora propuesta al cerrar el PR #185). Hoy los
// veinte la tienen; sin esta prueba, uno nuevo de la ficha entraría sin figura y nadie lo notaría.
// Una cara que falta lleva su nota (`rearNota`/`frontNota`), que dice por qué: nunca la de otro modelo.

const test = require('node:test');
const assert = require('node:assert');
const VISTAS = require('../public/data/fortinet-vistas-equipos.json');
const { VARIANTES, FORTIEXTENDER } = require('../server/seed/legacyData/fortinetVariantes.js');

// id → motivo. Solo para un equipo que ningún documento oficial traído dibuja.
const SIN_FIGURA = {
  'FortiExtender Vehicle 212F': 'la ficha Rugged FEXR-DAT-R08 (pp. 2 a 4) dibuja el Vehicle 211F, el Vehicle 511G y el Rugged 511G; del 212F solo da la tabla, y su QuickStart Guide no se ha traído (PR #190)',
};

const EQUIPOS = [...FORTIEXTENDER.modelos, ...VARIANTES].map((m) => m.id);

function fallos(equipos, vistas, sinFigura) {
  const out = [];
  for (const id of equipos) {
    const v = vistas[id];
    if (sinFigura[id]) {
      if (v && (v.front || v.rear)) out.push(`${id}: ya tiene figura; quita su excepción (${sinFigura[id]})`);
      continue;
    }
    if (!v || !(v.front || v.rear)) { out.push(`${id}: sin figura; tráela de su documento o decláralo en SIN_FIGURA con su motivo`); continue; }
    if (!v.front && !v.frontNota) out.push(`${id}: sin frontal y sin frontNota que diga por qué`);
    if (!v.rear && !v.rearNota) out.push(`${id}: sin trasera y sin rearNota que diga por qué`);
    if (!v.fuente) out.push(`${id}: figura sin pie (fuente)`);
  }
  for (const [id, motivo] of Object.entries(sinFigura)) {
    if (!equipos.includes(id)) out.push(`SIN_FIGURA cita ${id}, que ya no está en la tabla (${motivo})`);
  }
  return out;
}

test('cada FortiExtender y cada variante de Fortinet tiene su figura, o su motivo', () => {
  assert.ok(EQUIPOS.length >= 20, `la tabla trae ${EQUIPOS.length} equipos`);
  assert.deepStrictEqual(fallos(EQUIPOS, VISTAS, SIN_FIGURA), []);
});

test('mutación de control: la regla ve un equipo nuevo sin figura y una cara sin nota', () => {
  const nuevo = [...EQUIPOS, 'FortiExtender 999X'];
  assert.strictEqual(fallos(nuevo, VISTAS, SIN_FIGURA).length, 1);
  const sinNota = { ...VISTAS, 'FortiExtender WAN 50G': { ...VISTAS['FortiExtender WAN 50G'], rearNota: undefined } };
  assert.strictEqual(fallos(EQUIPOS, sinNota, SIN_FIGURA).length, 1);
  assert.strictEqual(fallos(EQUIPOS, VISTAS, { ...SIN_FIGURA, 'FortiExtender 101G': 'x' }).length, 1, 'una excepción de más también se ve');
});
