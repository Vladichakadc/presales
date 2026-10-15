'use strict';
// Las fuentes de Starlink en legacyData/fuentes.js son las del motor canonico, y solo esas.
//
// El motor (public/js/dimensionador-starlink-leo.js) es copia byte a byte de la linea base y no
// exporta su lista de enlaces, asi que no se puede generar desde el: se transcribe en
// fuentes.js y esta prueba la casa con el archivo. Sin ella habria dos listas, y la que vigila
// el vigia se quedaria con las URLs de ayer el dia que el modulo canonico cambie una -- el modo
// de fallo de CISCO_EOL_MODELS: un conjunto que deja de casar con nada y nadie lo ve.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { FUENTES, fuentesQueAvisan } = require('../server/seed/legacyData/fuentes');
const motor = require('../public/js/dimensionador-starlink-leo.js');

const RUTA_MOTOR = path.join(__dirname, '..', 'public', 'js', 'dimensionador-starlink-leo.js');

function enlacesDelMotor() {
  const src = fs.readFileSync(RUTA_MOTOR, 'utf8');
  const bloque = src.match(/const SOURCE_LINKS = Object\.freeze\(\[([\s\S]*?)\]\)/);
  assert.ok(bloque, 'el motor ya no declara SOURCE_LINKS como se esperaba: revisar esta prueba');
  return [...bloque[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
}

test('las URLs de Starlink son las SOURCE_LINKS del motor, en su orden', () => {
  const delMotor = enlacesDelMotor();
  assert.ok(delMotor.length >= 8, `solo ${delMotor.length} enlaces leidos del motor: la lectura no funciona`);
  assert.deepStrictEqual(FUENTES.starlink.map((f) => f.url), delMotor);
});

test('la fecha es la de la investigacion del motor, no una puesta a ojo', () => {
  for (const f of FUENTES.starlink) {
    assert.strictEqual(f.fecha, motor.researchDate, `${f.documento}: fecha distinta de researchDate`);
  }
});

test('el precio va marcado como tal y el resto dice por que no declara campos', () => {
  const precio = FUENTES.starlink.filter((f) => f.dominio === 'precio');
  assert.strictEqual(precio.length, 1, 'una sola fuente de precio: la del Priority Plan');
  assert.match(precio[0].url, /Priority_Plan_Transition\.pdf$/);
  for (const f of FUENTES.starlink) {
    assert.strictEqual(f.campos, null, `${f.documento}: Starlink no tiene MODELS contra los que declarar campos`);
    assert.ok(f.dominio === 'precio' || f.porQue, `${f.documento} no dice por que no declara campos`);
  }
});

test('solo los PDF se declaran estables hasta que el sondeo mida las paginas', () => {
  for (const f of FUENTES.starlink) {
    assert.strictEqual(f.estable, /\.pdf$/.test(f.url), `${f.documento}: estable=${f.estable}`);
  }
});

test('las fuentes de Starlink no ensucian el aviso del arranque mientras esten vigentes', () => {
  const dentro = new Date(Date.UTC(2026, 9, 15));
  assert.strictEqual(fuentesQueAvisan(dentro).filter((a) => a.vendor === 'starlink').length, 0);
  // Y a los seis meses, avisan: una tarifa de hace medio ano ya no es referencia.
  const despues = new Date(Date.UTC(2027, 3, 1));
  assert.strictEqual(fuentesQueAvisan(despues).filter((a) => a.vendor === 'starlink').length, FUENTES.starlink.length);
});

test('lo medido manda: los PDF se vigilan y las cinco paginas HTML declaran por que no', () => {
  // Medido con sondeo-fuentes.yml el 2026-10-15: los PDF, estables en bytes; las paginas, un
  // cascaron de JavaScript o un texto que cambia en cada peticion.
  for (const f of FUENTES.starlink) {
    const pdf = /\.pdf$/.test(f.url);
    assert.strictEqual(Boolean(f.sinVigilancia), !pdf, `${f.documento}: sinVigilancia=${f.sinVigilancia}`);
  }
  const precio = FUENTES.starlink.find((f) => f.dominio === 'precio');
  assert.ok(!precio.sinVigilancia, 'la tarifa es justo lo que no puede quedar sin vigilar');
});
