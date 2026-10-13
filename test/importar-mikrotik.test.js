'use strict';
// `npm run mikrotik` transcribe la matriz de pruebas de las fichas oficiales (2026-10-13). Lo
// que se prueba es lo que separa una transcripcion de una fila desplazada: la coma ambigua del
// RB4011, las dos convenciones de la columna de 64 B, el anclaje por codigo y nucleos/RAM/nivel,
// y que el catalogo derive sus cifras de la ficha en vez de llevarlas escritas.
const test = require('node:test');
const assert = require('node:assert');
const { leerFicha, lecturas, par, anclar } = require('../scripts/importar-mikrotik.js');
const { FICHAS } = require('../server/seed/legacyData/mikrotikPruebas');
const D = require('../server/seed/legacyData/mikrotik');

test('la coma se resuelve con la otra columna de la fila, no a ojo', () => {
  assert.deepStrictEqual(lecturas('9,792.9'), [9792.9]);
  assert.deepStrictEqual(lecturas('806,4').sort((a, b) => a - b), [806.4, 8064]);
  // RB4011: «806,4» kpps y «9,792.9» Mbps a 1518 B cuadran solo si la coma es decimal.
  assert.deepStrictEqual(par('806,4', '9,792.9', 1518), [806.4, 9792.9]);
  assert.strictEqual(par('806,4', '5,000', 1518), null, 'si ninguna lectura cuadra, la celda no se acepta');
});

test('a 64 B se admiten las dos convenciones de MikroTik (64 y 68 bytes), y solo ahi', () => {
  assert.deepStrictEqual(par('217.8', '111.5', 64), [217.8, 111.5]);   // hEX lite: 64 B
  assert.deepStrictEqual(par('4969.4', '2703.3', 64), [4969.4, 2703.3]); // RB5009: 68 B
  assert.strictEqual(par('811.2', '10446.6', 1518), null, '1518 B no admite el relleno de 68');
});

const FICHA = (codigo, nucleos, ram, lvl) => `<meta property="og:url" content="https://mikrotik.com/product/x" />
<div>Product code</div><div>${codigo}</div><div>Suggested price</div><div>$219.00</div>
<div>CPU</div><div>88F7040</div><div>CPU core count</div><div>${nucleos}</div>
<div>Size of RAM</div><div>${ram}</div><div>RouterOS license</div><div>${lvl}</div>
<h2>Ethernet test results</h2><table>
<tr><td>Mode</td><td>Configuration</td><td>1518 byte</td><td>512 byte</td><td>64 byte</td></tr>
<tr><td>Routing</td><td>&#110;&#111;&#110;&#101;&#32;&#40;&#102;&#97;&#115;&#116;&#32;&#112;&#97;&#116;&#104;&#41;</td><td>811.2</td><td>9851.4</td><td>2332</td><td>9551.9</td><td>4969.4</td><td>2703.3</td></tr>
<tr><td>Routing</td><td>25 ip filter rules</td><td>771.2</td><td>9365.6</td><td>755.9</td><td>3096.2</td><td>761</td><td>414</td></tr>
</table><h2>Documents</h2>`;

test('una ficha se lee con su codigo, su precio y sus filas (texto codificado dos veces incluido)', () => {
  const { ficha, errores } = leerFicha(FICHA('RB5009UG+S+IN', 4, '1 GB', 5));
  assert.deepStrictEqual(errores, []);
  assert.strictEqual(ficha.codigo, 'RB5009UG+S+IN');
  assert.strictEqual(ficha.precio, 219);
  assert.strictEqual(ficha.ram, 1024);
  assert.deepStrictEqual(ficha.ruteo.filtro[512], [755.9, 3096.2]);
  assert.strictEqual(ficha.ipsec, null, 'sin tabla IPsec no se inventa una');
});

test('el anclaje exige dos columnas que casen y ninguna que choque', () => {
  const m = D.MODELS.find((x) => x.id === 'RB5009UG+S+IN');
  const ok = anclar(leerFicha(FICHA('RB5009UG+S+IN', 4, '1 GB', 5)).ficha, m);
  assert.ok(ok.ok);
  const otra = anclar(leerFicha(FICHA('RB5009UG+S+IN', 16, '16 GB', 6)).ficha, m);
  assert.strictEqual(otra.ok, false, 'una pagina de otro equipo con el mismo codigo no entra');
});

test('cada modelo con codigo tiene ficha leida y anclada, y sus cifras salen de ella', () => {
  assert.deepStrictEqual(D.SIN_FICHA, []);
  assert.deepStrictEqual(D.DESANCLADOS, []);
  for (const m of D.MODELS.filter((x) => x.codigo)) {
    const f = FICHAS[m.codigo];
    assert.strictEqual(m.fwd, f.ruteo.fastpath[1518][1], `${m.id}: fwd es el fast path a 1518 B`);
    assert.strictEqual(m.fw, f.ruteo.filtro[1518][1], `${m.id}: fw es la fila de filtro a 1518 B`);
    assert.strictEqual(m.elpN, f.precio, `${m.id}: el precio es el «Suggested price» de la ficha`);
    assert.strictEqual(m.ipsec, f.ipsec ? f.ipsec.uno['aes128-sha1'][1400][1] : null, `${m.id}: IPsec solo si la ficha lo publica`);
    assert.ok(/^https:\/\/mikrotik\.com\/product\//.test(f.url), `${m.id}: URL oficial`);
  }
});

test('los equipos que no publican IPsec quedan en null, no con la cifra de ruteo', () => {
  for (const id of ['hEX lite RB750r2', 'L009UiGS-2HaxD', 'L009UiGS-RM', 'hEX PoE RB960PGS']) {
    assert.strictEqual(D.MODELS.find((m) => m.id === id).ipsec, null, id);
  }
});
