'use strict';
// LAS FICHAS DE FORTINET, UNA ENTRADA POR DOCUMENTO Y CON URL (2026-11-09, mejora propuesta al
// cerrar el PR #152). Hasta ese día las fichas por serie de las variantes (30G, 50G, 70G, 40F) y
// de 400F, 600F y 1000F iban en dos entradas sin URL, y 100F/200F y 7081F/7121F compartían una
// URL entre dos documentos: el vigía no medía ninguna de las que faltaban. Tres reglas:
//   1. Un documento, una entrada: el nombre de una ficha cita un solo código de edición.
//   2. Cada ficha o guía de hardware de Fortinet lleva URL https y es estable, para que el vigía
//      la mida cada lunes.
//   3. El lock del vigía ya trae su huella: la de la copia que se leyó, no la de la primera
//      medición. Sin eso, una edición nueva ya publicada (la 40F R49 frente a la R48 de la figura,
//      la 60F R51…) entraría como «verificada» sin que nadie la contrastara.
const test = require('node:test');
const assert = require('node:assert');
const { FUENTES } = require('../server/seed/legacyData/fuentes');
const { claveDe } = require('../scripts/vigia-fuentes');
const LOCK = require('../server/seed/legacyData/fuentes.lock.json');

const FICHAS = FUENTES.fortinet.filter((f) => /^Ficha por serie |System Guide/.test(f.documento));
const CODIGO = /\b(?:FG|FGFWF)-[0-9A-Z]+-DAT-R\d+/g;

test('cada ficha de Fortinet es una entrada con un solo documento', () => {
  assert.ok(FICHAS.length >= 11, `se esperaban las once fichas y guías partidas, hay ${FICHAS.length}`);
  for (const f of FICHAS) {
    const codigos = f.documento.match(CODIGO) || [];
    assert.ok(codigos.length <= 1, `${f.documento}: cita ${codigos.length} ediciones en una entrada`);
    assert.ok(!/ y FortiGate-|, FG-/.test(f.documento), `${f.documento}: agrupa dos documentos`);
  }
  // Ninguna entrada de Fortinet vuelve a agrupar fichas por serie sin URL.
  assert.ok(!FUENTES.fortinet.some((f) => /^Fichas por serie/.test(f.documento)), 'queda una entrada agrupada «Fichas por serie»');
});

test('cada ficha lleva URL https de Fortinet y es estable', () => {
  const vistas = new Set();
  for (const f of FICHAS) {
    assert.match(f.url || '', /^https:\/\/(?:www\.fortinet\.com|fortinetweb\.s3\.amazonaws\.com)\//, `${f.documento}: sin URL de Fortinet`);
    assert.strictEqual(f.estable, true, `${f.documento}: un PDF se vigila por sus bytes, estable`);
    assert.ok(!vistas.has(f.url), `${f.url}: dos entradas con la misma URL`);
    vistas.add(f.url);
  }
});

test('el lock del vigía trae la huella de la copia leída de cada ficha', () => {
  for (const f of FICHAS) {
    const e = LOCK.documentos[claveDe('fortinet', f)];
    assert.ok(e, `${f.documento}: sin entrada en fuentes.lock.json; la primera medición se daría por verificada`);
    assert.match(e.hashVerificado || '', /^[0-9a-f]{64}$/, `${f.documento}: sin hashVerificado`);
    assert.strictEqual(e.clase, 'bytes', `${f.documento}: un PDF se vigila por bytes`);
    assert.strictEqual(e.documento, f.documento, `${f.documento}: el lock lo nombra distinto`);
  }
});

test('ningún equipo pierde su ficha al partir las entradas', () => {
  const de = (m) => FICHAS.filter((f) => (f.modelos || []).includes(m)).length;
  const antes = ['FortiWiFi 30G', 'FortiWiFi 31G', 'FortiWiFi 50G', 'FortiWiFi 51G', 'FortiWiFi 70G', 'FortiWiFi 71G',
    'FortiWiFi 70G-POE', 'FortiGate 40F-3G4G', 'FortiGate 50G-5G', 'FortiGate 51G-5G', 'FortiWiFi 50G-5G-II',
    'FortiGate 400F', 'FortiGate 401F', 'FortiGate 600F', 'FortiGate 1000F', 'FortiGate 1001F',
    'FortiGate 100F', 'FortiGate 200F', 'FortiGate 7081F', 'FortiGate 7121F'];
  for (const m of antes) assert.strictEqual(de(m), 1, `${m}: lo respaldan ${de(m)} fichas, debería ser una`);
});
