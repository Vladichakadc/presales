'use strict';
// Fin de venta de Fortinet con fecha (petición del dueño, 2026-10-29): al elegir un equipo, la
// ficha dice su último pedido y su fin de soporte; un fin de venta anunciado se marca y sigue
// recomendable hasta su fecha, y uno vencido deja de proponerse aunque tenga SKU en la lista.

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { cargar } = require('./ayuda/navegador.js');

const F = require('../server/seed/legacyData/fortinet.js');
const { FICHA } = cargar('public/js/ficha.js');

const modelo = (id) => F.MODELS.find((m) => m.id === id);

test('cada fila de EOL_ANNOUNCED casa con un modelo y trae fechas coherentes', () => {
  for (const [base, a] of Object.entries(F.EOL_ANNOUNCED)) {
    const m = modelo(`FortiGate ${base}`);
    assert.ok(m, `${base}: no hay tal modelo; la fila no marcaría nada`);
    assert.strictEqual(m.eolAnnounced, a);
    const eoo = new Date(a.lastOrder);
    const eos = new Date(a.endOfSupport);
    assert.ok(Number.isFinite(eoo.getTime()) && Number.isFinite(eos.getTime()), `${base}: fechas parseables`);
    assert.strictEqual(eos.getUTCFullYear() - eoo.getUTCFullYear(), 5, `${base}: el aviso da 60 meses de soporte`);
    assert.strictEqual(a.lastOrder.slice(4), a.endOfSupport.slice(4), `${base}: mismo día y mes`);
    assert.match(a.url, /^https:\/\/support\.fortinet\.com\//, `${base}: remite al portal de Fortinet`);
    assert.ok(!a.confirmar, `${base}: confirmada por el dueño en Product Life Cycle el 2026-11-04; ya no es un dato transcrito`);
  }
});

// LA CONFIRMACION DEL 2026-11-04. El dueño confirmo en Product Life Cycle las ocho fechas y que el
// 4200F, el 7081F y el 7121F no tienen fecha; el resto de la linea no lo miro. La fuente declara a
// los once, y no respalda `eolAnnounced`: el semaforo va por fabricante y pintaria de vigentes a los
// que nadie miro. Se levanta cuando el dueño confirme el resto en el portal: entonces la fuente pasa
// a campos: ['eolAnnounced'] y esta prueba cambia con ella.
test('la fuente del portal declara cada modelo con fecha y no respalda el semaforo de toda la linea', () => {
  const { FUENTES, resolverModelos } = require('../server/seed/legacyData/fuentes.js');
  const plc = FUENTES.fortinet.find((f) => /Product Life Cycle/.test(f.documento));
  assert.ok(plc, 'falta la fuente de Product Life Cycle en fuentes.js');
  assert.strictEqual(plc.fecha, '2026-11-04');
  const declarados = new Set(resolverModelos('fortinet', plc).ids);
  for (const base of Object.keys(F.EOL_ANNOUNCED)) assert.ok(declarados.has(`FortiGate ${base}`), `${base}: su fecha no tiene fuente`);
  for (const id of ['FortiGate 4200F', 'FortiGate 7081F', 'FortiGate 7121F']) {
    assert.ok(declarados.has(id), `${id}: confirmado sin fecha, la fuente lo declara`);
    assert.strictEqual(modelo(id).eolAnnounced, null, `${id}: sin fecha en el portal`);
  }
  const respaldan = FUENTES.fortinet.filter((f) => Array.isArray(f.campos) && f.campos.includes('eolAnnounced'));
  const sinMirar = F.MODELS.filter((m) => !m.eolAnnounced && !declarados.has(m.id)).length;
  assert.deepStrictEqual(respaldan.map((f) => f.documento), [],
    `una fuente de Fortinet respalda eolAnnounced y pintaria de vigentes a ${sinMirar} FortiGate que nadie miro en el portal; solo cuando el dueño confirme el resto`);
  // El banner de la pagina (y su resumen de fuentes) toma como «Fuente tecnica» la primera que no es
  // de precio: el portal, que solo da fechas, no puede ir delante del Product Matrix.
  const tecnica = FUENTES.fortinet.find((f) => f.dominio !== 'precio');
  assert.match(tecnica.documento, /Product Matrix/, `la «Fuente tecnica» del banner seria «${tecnica.documento}»`);
});

test('el 400F y el 401F no tienen fin de venta: sin afirmar, nunca «vigente» por declaración', () => {
  for (const id of ['FortiGate 400F', 'FortiGate 401F']) {
    assert.strictEqual(modelo(id).eolAnnounced, null);
    assert.strictEqual(FICHA.marca(modelo(id)), null);
  }
});

test('el 60F se pide hasta el 13-ene-2027 y después cae solo', () => {
  const m = modelo('FortiGate 60F');
  assert.strictEqual(m.eolAnnounced.lastOrder, '2027-01-13');
  assert.strictEqual(FICHA.rango(m), Date.now() < Date.parse('2027-01-13') ? 0 : 2);
  // La misma fila con la fecha ya pasada: la regla común la aparta sola.
  assert.strictEqual(FICHA.rango({ ...m, eolAnnounced: { ...m.eolAnnounced, lastOrder: '2000-01-13' } }), 2);
});

test('el 1000F, con SKU en la lista, sale fuera de venta por su fecha vencida', () => {
  const m = modelo('FortiGate 1000F');
  assert.ok(m.hwSku, 'sigue en la lista firmada: el SKU solo no lo apartaría');
  assert.strictEqual(FICHA.rango(m), 2);
});

test('la ficha dice último pedido y fin de soporte; confirmadas, sin el aviso de dato transcrito', () => {
  const vencido = { ...modelo('FortiGate 1000F'), eol: true };
  const t = FICHA.avisoDe(vencido);
  assert.match(t, /2026-10-13/);
  assert.match(t, /2031-10-13/);
  assert.doesNotMatch(t, /confirmar en el portal/, 'confirmadas en el portal el 2026-11-04');
  // El mecanismo sigue: una fila transcrita y sin confirmar lo dice junto a la fecha.
  const transcrita = { id: 'X', eol: true, eolAnnounced: { lastOrder: '2000-01-13', endOfSupport: '2005-01-13', confirmar: 'confirmar en el portal' } };
  assert.match(FICHA.avisoDe(transcrita), /confirmar en el portal/);
  const anunciado = { id: 'X', eolAnnounced: { lastOrder: '2999-01-13', endOfSupport: '3004-01-13', confirmar: 'confirmar' } };
  assert.match(FICHA.avisoDe(anunciado), /3004-01-13/);
  assert.match(FICHA.cicloDeVida(anunciado, { respaldado: false }).detalle, /soporte del fabricante hasta el 3004-01-13/);
});

test('la proyección del dimensionador Fortinet aplica la regla común de fuera de venta', () => {
  const src = fs.readFileSync(path.join(__dirname, '../server/services/catalogProjection.js'), 'utf8');
  const cuerpo = /async function toDimensionadorFortinet\(\)[\s\S]*?\n\}\n/.exec(src)[0];
  assert.match(cuerpo, /eol: fueraDeVenta\(p\.eol, p\.specs\)/);
});
