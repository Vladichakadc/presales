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

// 4. LA MISMA URL EN LOS DOS LOCKS (2026-11-09, mejora propuesta al cerrar el PR #155). El vigía
// mide una ficha por la URL de fuentes.js y el job de figuras la baja por la URL de
// scripts/figuras-fortinet.lock.json: si una cambia sin la otra, uno de los dos mide un documento
// que el otro ya no mira, y nada lo avisa. Se compara la URL, no la edición: la 40F lleva R49 en
// fuentes.js y R48 en el lock de figuras a propósito (la figura es de la edición que se leyó).
const LOCK_FIGURAS = require('../scripts/figuras-fortinet.lock.json');

// Fichas que fuentes.js cita y cuyas figuras no salen de ellas: el lock de figuras sigue la guía
// rápida (QSG) de esos modelos, no la ficha coreana. Sin contraparte en el lock, y debe seguir así.
const SIN_FIGURAS = {
  'FG-100F-DAT-R30': 'las figuras de la 100F salen de su QSG (fg-100f-qsg.pdf), no de la ficha coreana',
  'FG-200F-DAT-R17': 'las figuras de la 200F salen de su QSG (fg-200f-qsg.pdf), no de la ficha coreana',
};

const nombreDe = (url) => String(url).split('/').pop().toLowerCase();

// Discrepancias entre las URL de las entradas de Fortinet y las de los documentos del lock de
// figuras, emparejados por nombre de archivo. Función pura: la mutación de control la reutiliza.
function discrepancias(entradas, documentos) {
  const fallos = [];
  const lock = Object.values(documentos);
  for (const e of entradas) {
    if (!e.url) continue;
    const pareja = lock.filter((d) => nombreDe(d.url) === nombreDe(e.url));
    for (const d of pareja) {
      if (d.url !== e.url) fallos.push(`${e.documento}: fuentes.js dice ${e.url} y el lock de figuras ${d.url}`);
    }
  }
  return fallos;
}

test('la URL de cada ficha es la misma en fuentes.js y en el lock de figuras', () => {
  const fallos = discrepancias(FUENTES.fortinet, LOCK_FIGURAS.documentos);
  assert.deepStrictEqual(fallos, []);
  // Cada ficha tiene su contraparte en el lock, salvo las declaradas sin figuras.
  const nombres = new Set(Object.values(LOCK_FIGURAS.documentos).map((d) => nombreDe(d.url)));
  for (const f of FICHAS) {
    const codigo = (f.documento.match(CODIGO) || [])[0];
    const exenta = SIN_FIGURAS[codigo];
    const tiene = nombres.has(nombreDe(f.url));
    if (exenta) assert.ok(!tiene, `${f.documento}: ya tiene contraparte en el lock; quita su excepción (${exenta})`);
    else assert.ok(tiene, `${f.documento}: ninguna figura del lock sale de esta URL; si es a propósito, decláralo en SIN_FIGURAS con su motivo`);
  }
  for (const [codigo, motivo] of Object.entries(SIN_FIGURAS)) {
    assert.ok(FICHAS.some((f) => f.documento.includes(codigo)), `SIN_FIGURAS cita ${codigo}, que ya no es una ficha (${motivo})`);
  }
});

test('mutación de control: la regla ve una URL que cambia en un solo lado', () => {
  const ficha = FICHAS.find((f) => /40F/.test(f.documento));
  const doc = Object.entries(LOCK_FIGURAS.documentos).find(([, d]) => nombreDe(d.url) === nombreDe(ficha.url));
  assert.ok(doc, 'la 40F debe tener su documento en el lock');
  const roto = { ...LOCK_FIGURAS.documentos, [doc[0]]: { ...doc[1], url: doc[1].url.replace('www.fortinet.com', 'fortinet.com') } };
  assert.strictEqual(discrepancias(FUENTES.fortinet, roto).length, 1);
  assert.strictEqual(discrepancias(FUENTES.fortinet, LOCK_FIGURAS.documentos).length, 0);
});
