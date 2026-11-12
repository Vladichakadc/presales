'use strict';
// CADA FORTIEXTENDER DE LA TABLA, CON FIGURA O CON SU MOTIVO (2026-11-12, mejora propuesta al cerrar el PR #185).
//
// Desde los PR #172 y #185, los siete FortiExtender de `FORTIEXTENDER.modelos` tienen figura en
// `fortinet-vistas-equipos.json`: los de la ficha R57, de su ficha; los que la ficha no dibuja, de su QuickStart
// Guide. Pero nada lo exigía: uno nuevo de la ficha entraría sin figura y la página lo pintaría sin nada, sin que
// nadie lo notara. Esto lo exige, con la salida honrada: un modelo que ningún documento dibuje se declara en
// SIN_FIGURA con su motivo, nunca con la figura de otro (lo que el catálogo prohíbe).
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { FORTIEXTENDER } = require('../server/seed/legacyData/fortinetVariantes');
const VISTAS = require('../public/data/fortinet-vistas-equipos.json');

// Modelo de la tabla que ningún documento oficial dibuja: id -> motivo (qué se buscó y dónde). Hoy, ninguno.
const SIN_FIGURA = {};

const PUBLIC = path.join(__dirname, '..', 'public');
const existe = (ruta) => typeof ruta === 'string' && fs.existsSync(path.join(PUBLIC, ruta.replace(/^\//, '')));

// La regla, como función: así se le puede pasar una tabla saboteada (el control de abajo).
function sinCubrir(modelos, vistas, sinFigura) {
  const fallos = [];
  for (const m of modelos) {
    const v = vistas[m.id];
    if (sinFigura[m.id]) {
      if (v && v.front) fallos.push(`${m.id}: está en SIN_FIGURA pero ya tiene figura; quítalo de la excepción`);
      else if (!String(sinFigura[m.id]).trim()) fallos.push(`${m.id}: en SIN_FIGURA sin motivo`);
      continue;
    }
    if (!v || !v.front) { fallos.push(`${m.id}: sin figura en fortinet-vistas-equipos.json ni motivo en SIN_FIGURA`); continue; }
    if (!existe(v.front)) fallos.push(`${m.id}: su figura frontal ${v.front} no está en public/`);
    if (v.rear ? !existe(v.rear) : !v.rearNota) fallos.push(`${m.id}: sin trasera y sin rearNota que diga por qué`);
    if (!v.fuente) fallos.push(`${m.id}: su figura no dice de qué documento sale (fuente)`);
  }
  for (const id of Object.keys(sinFigura)) {
    if (!modelos.some((m) => m.id === id)) fallos.push(`SIN_FIGURA nombra ${id}, que ya no está en la tabla`);
  }
  return fallos;
}

test('cada FortiExtender de la tabla tiene figura de un documento, o su motivo para no tenerla', () => {
  assert.ok(FORTIEXTENDER.modelos.length >= 7, 'la tabla de FortiExtender no se cargó entera');
  assert.deepStrictEqual(sinCubrir(FORTIEXTENDER.modelos, VISTAS, SIN_FIGURA), []);
});

test('control: un FortiExtender nuevo sin figura, una excepción vieja y una trasera muda se ven', () => {
  const nuevo = [...FORTIEXTENDER.modelos, { id: 'FortiExtender 999X' }];
  assert.match(sinCubrir(nuevo, VISTAS, {}).join('\n'), /FortiExtender 999X: sin figura/);
  const conFigura = FORTIEXTENDER.modelos[0].id;
  assert.match(sinCubrir(FORTIEXTENDER.modelos, VISTAS, { [conFigura]: 'motivo' }).join('\n'), /ya tiene figura/);
  assert.match(sinCubrir(FORTIEXTENDER.modelos, VISTAS, { 'FortiExtender 000': 'motivo' }).join('\n'), /ya no está en la tabla/);
  const sinTrasera = FORTIEXTENDER.modelos.find((m) => VISTAS[m.id] && VISTAS[m.id].rearNota);
  assert.ok(sinTrasera, 'alguno declara por qué no tiene trasera');
  const muda = { ...VISTAS, [sinTrasera.id]: { ...VISTAS[sinTrasera.id], rearNota: undefined } };
  assert.match(sinCubrir(FORTIEXTENDER.modelos, muda, {}).join('\n'), /sin trasera y sin rearNota/);
});
