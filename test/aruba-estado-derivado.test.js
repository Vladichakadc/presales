'use strict';
// EL ESTADO COMERCIAL DERIVADO DE ARUBA, FUERA DE LA PÁGINA (2026-11-01, fase 3.1, segunda entrega).
// Movido sin cambiar su cuerpo y medido con `npm run equivalencia -- scripts/equivalencias/aruba-estado.js`
// (10.825 casos contra la página de main, 0 diferencias; la mutación de control da 9.505). Aquí, lo
// que cada regla tiene que seguir haciendo y que la página solo delega.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const R = require('../public/js/aruba-reglas.js');
const A = require('../server/seed/legacyData/aruba.js');

test('los topes de la licencia de capacidad son los del peldaño más alto, y el nivel el primero que cubre todo', () => {
  const m = { clients: 10, aps: 1, licCap: [{ fw: 1000, clients: 500, aps: 32 }, { fw: 4000, clients: 2000, aps: 128 }] };
  assert.strictEqual(R.clientesMax(m), 2000);
  assert.strictEqual(R.apsMax(m), 128);
  assert.strictEqual(R.nivelLicenciaNecesario(m, 800, 400, 10), m.licCap[0]);
  assert.strictEqual(R.nivelLicenciaNecesario(m, 800, 600, 10), m.licCap[1], 'los clientes también suben de nivel');
  assert.strictEqual(R.nivelLicenciaNecesario(m, 9000, 0, 0), m.licCap[1], 'por encima de todo, el más alto');
  assert.strictEqual(R.nivelLicenciaNecesario({ clients: 5 }, 1, 1, 1), null);
});

test('Boost en bloques del catálogo (100 si no lo dice), al menos uno', () => {
  assert.strictEqual(R.bloquesBoost({ boost: A.BOOST }, 250), Math.ceil(250 / (A.BOOST.bloque || 100)));
  assert.strictEqual(R.bloquesBoost({}, 0), 1);
  assert.strictEqual(R.bloquesBoost({ boost: { bloque: 50 } }, 120), 3);
});

test('precio y SKU por término: clave directa, sin caer al de 3 años (pendiente #28)', () => {
  const t = { y1: 10, y3: 25, sku: { y1: 'A-1', y3: 'A-3' } };
  assert.strictEqual(R.tierPrice(t, 7), null);
  assert.strictEqual(R.tierSku(t, 7), null);
  assert.strictEqual(R.tierSku({ sku: 'PLANO' }, 5), 'PLANO');
  assert.strictEqual(R.tierPrice(null, 3), null);
});

test('Central de un gateway: solo de su serie, y el precio solo de un SKU verificado', () => {
  const gw = A.MODELS.find((m) => m.fam !== 'ec' && Object.values(A.CENTRAL_POR_SERIE).some((f) => (f.series || []).includes(m.serie)));
  assert.ok(gw, 'hay un gateway con serie en Central');
  const c = R.centralParaModelo({ centralSerie: A.CENTRAL_POR_SERIE, central: A.CENTRAL_TIERS, skuCat: [] }, gw, 'foundation', 3, false);
  assert.ok(c && c.n, 'el nivel foundation existe para su serie');
  assert.strictEqual(R.centralParaModelo({ centralSerie: A.CENTRAL_POR_SERIE, central: {}, skuCat: [] }, gw, null, 3, false), null);
  assert.strictEqual(R.centralParaModelo({ centralSerie: {}, central: {}, skuCat: [] }, gw, 'foundation', 3, false), null, 'sin serie, nada');
});

test('la página conserva los nombres y solo delega', () => {
  const pag = fs.readFileSync(path.join(__dirname, '..', 'public/js/dimensionador-aruba-edgeconnect.js'), 'utf8');
  for (const linea of [
    'function clientesMax(m){ return ArubaReglas.clientesMax(m); }',
    'function apsMax(m){ return ArubaReglas.apsMax(m); }',
    'function nivelLicenciaNecesario(m,need,users,aps){ return ArubaReglas.nivelLicenciaNecesario(m,need,users,aps); }',
    'function bloquesBoost(mbps){ return ArubaReglas.bloquesBoost(SIZING,mbps); }',
    'function flujosDe(m){ return ArubaReglas.flujosDe(m); }',
    'function tierPrice(t,y){ return ArubaReglas.tierPrice(t,y); }',
    'function tierSku(t,y){ return ArubaReglas.tierSku(t,y); }',
    'function baseParaModelo(m, D){ return ArubaReglas.baseParaModelo(CENTRAL_SERIE, m, D, secMode); }',
  ]) assert.ok(pag.includes(linea), `falta el envoltorio: ${linea}`);
  assert.match(pag, /function centralParaModelo\(m, nivel, termYrs, conSeguridad\)\{ return ArubaReglas\.centralParaModelo\(\{centralSerie:CENTRAL_SERIE, central:CENTRAL, skuCat:SKU_CAT\}, m, nivel, termYrs, conSeguridad\); \}/);
  assert.doesNotMatch(pag, /m\.licCap\.find\(t=>t\.fw>=need/, 'la regla del nivel no vuelve a la página');
});
