'use strict';
// `npm run matrix` (2026-10-13): contrasta una edicion del Product Matrix contra el catalogo por
// coordenadas, sin escribir nada. Las paginas son SINTETICAS: el PDF de Fortinet no entra al
// repositorio. Lo que fija:
//   1. la celda se arma por posicion: la unidad en la linea de abajo se une a su cifra, una
//      linea que empieza por «(» no es fila y las llamadas de nota (letra pequena) se descartan;
//   2. cada texto llega a la unidad del catalogo, y lo que no se entiende queda «sin leer», no
//      convertido a ojo;
//   3. una cifra que cambia o una columna desplazada salen como diferencia;
//   4. los modelos que la edicion anade o quita se dicen.
const test = require('node:test');
const assert = require('node:assert');
const C = require('../scripts/contrastar-matrix.js');

// Un trozo de texto como lo da pdf-parse: h 36 es la letra de las celdas, 49 la de la cabecera
// y 12 la de las llamadas de nota.
const T = (s, x, y, h = 36, w = s.length * 5) => ({ s, x, y, h, w });
const pagina = [
  T('FG-10A', 200, 700, 49), T('FG-20A', 300, 700, 49), T('12', 250, 702, 12),
  T('Firewall Throughput', 39, 680), T('4/ 4/ 3.9', 200, 680), T('10 / 10 / 6', 300, 680),
  T('(1518/512/64 byte UDP)', 39, 672), T('Gbps', 205, 672), T('Gbps', 305, 672),
  T('Max G/W to G/W IPSEC Tunnels', 39, 660), T('200', 205, 660), T('2 000', 300, 660),
  T('SSL VPN Throughput', 39, 648), T('405 Mbps', 200, 648), T('1.4 Gbps', 300, 648), T('11', 345, 650, 12),
  T('Concurrent SSL VPN Users', 39, 636), T('—', 205, 632), T('200', 305, 632), T('11', 330, 634, 12),
  T('(Recommended Maximum, Tunnel Mode)', 39, 628),
  T('Concurrent Sessions', 39, 616), T('140 Million / 348 Million', 190, 616), T('1 Billion', 300, 616),
  T('Max FortiAPs (Total / Tunnel)', 39, 604), T('16 / 8', 205, 604), T('2 048 / 1 024', 300, 604),
  T('Local Storage', 39, 592), T('128 GB (11A)', 200, 592), T('4x 4 TB SSD', 300, 592),
  T('Variants', 39, 580), T('WiFi, POE', 200, 580), T('—', 305, 580),
  T('PROMTX-2026-R177-OCT (Web)', 39, 20, 30),
];

test('la celda se arma por posicion: unidad debajo, continuacion de etiqueta y notas fuera', () => {
  const { celdas, edicion } = C.celdasDe([pagina]);
  const de = (id, campo) => (celdas.find((c) => c.id === id && c.campo === campo) || {}).texto;
  assert.strictEqual(edicion, 'PROMTX-2026-R177-OCT');
  assert.strictEqual(de('10A', 'fw'), '4/ 4/ 3.9 Gbps');
  assert.strictEqual(de('20A', 'sslVpn'), '1.4 Gbps', 'la nota 11 no se pega a la cifra');
  assert.strictEqual(de('20A', 'sslVpnUsers'), '200', 'la cifra va a su fila aunque la etiqueta ocupe dos lineas');
  assert.strictEqual(de('10A', 'sslVpnUsers'), '—');
  assert.strictEqual(de('20A', 'tunGw'), '2 000');
  assert.ok(!celdas.some((c) => /Recommended/.test(c.texto)));
});

test('cada texto llega a la unidad del catalogo; lo que no se entiende queda sin leer', () => {
  assert.strictEqual(C.valorDe('4/ 4/ 3.9 Gbps', 'fw'), 4000);
  assert.strictEqual(C.valorDe('1.15 / 1.14 / 0.50 Tbps', 'fw'), 1150000);
  assert.strictEqual(C.valorDe('140 Million / 348 Million', 'sess'), 140000000, 'sin Hyperscale');
  assert.strictEqual(C.valorDe('1.4 Mllion', 'sess'), 1400000, 'la errata del documento');
  assert.strictEqual(C.valorDe('1 Billion', 'sess'), 1e9);
  assert.strictEqual(C.valorDe('2,500', 'tunCli'), 2500);
  assert.strictEqual(C.valorDe('2 500', 'tunCli'), 2500);
  assert.strictEqual(C.valorDe('405 Mbps', 'sslVpn'), 405);
  assert.strictEqual(C.valorDe('—', 'sslVpn'), null);
  assert.deepStrictEqual(C.valorDe('2 048 / 1 024', 'aps'), [2048, 1024]);
  assert.deepStrictEqual(C.valorDe('2x 1.92TB (3501F)', 'almacen'), { variante: '3501F', gb: 3840 });
  assert.deepStrictEqual(C.valorDe('4x 4 TB SSD', 'almacen'), { variante: null, gb: 16000 });
  assert.deepStrictEqual(C.valorDe('WiFi, DSL, SFP', 'variantes'), ['WiFi', 'DSL', 'SFP']);
  assert.strictEqual(C.valorDe('Varied', 'tunGw'), undefined);
  assert.strictEqual(C.valorDe('', 'tp'), undefined, 'una celda vacia no es «—»');
});

// Catalogo minimo con la forma del real.
const catalogo = () => ({
  MODELS: [
    { id: 'FortiGate 10A', fw: 4000, tunGw: 200, sslVpn: 405, sslVpnUsers: null, sess: 140000000, aps: 16, apsTun: 8 },
    { id: 'FortiGate 20A', fw: 10000, tunGw: 2000, sslVpn: 1400, sslVpnUsers: 200, sess: 1e9, aps: 2048, apsTun: 1024 },
  ],
  MATRIX_PLATAFORMA: { '10A': { almacen: ['11A', 128], variantes: ['WiFi', 'POE'] }, '20A': { almacen: ['20A', 16000], variantes: [] } },
  MATRIX_LIMITES: { '10A': {}, '20A': {} },
});

test('lo que casa cuenta; una cifra que cambia y una columna desplazada salen como diferencia', () => {
  const { celdas } = C.celdasDe([pagina]);
  const cat = catalogo();
  const r = C.contrastar(celdas, cat);
  assert.deepStrictEqual(r.difieren, []);
  assert.deepStrictEqual(r.sinLeer, []);
  assert.strictEqual(r.coinciden, 18);
  cat.MODELS[1].tunGw = 1000;
  assert.deepStrictEqual(C.contrastar(celdas, cat).difieren.map((d) => `${d.id} ${d.campo}`), ['20A tunGw']);
  // La columna del 10A leida como si fuera la del 20A: varias diferencias, no un acierto.
  const mal = celdas.filter((c) => c.id === '10A').map((c) => ({ ...c, id: '20A' }));
  assert.ok(C.contrastar(mal, catalogo()).difieren.length >= 5);
});

test('los modelos que la edicion anade o deja de listar se dicen', () => {
  const cat = catalogo();
  cat.MATRIX_LIMITES = { '10A': {}, '99Z': {} };
  const r = C.contrastar(C.celdasDe([pagina]).celdas, cat);
  assert.deepStrictEqual(r.nuevos, ['20A']);
  assert.deepStrictEqual(r.faltan, ['99Z']);
  assert.strictEqual(C.informe(r, 'X').limpio, false);
});

test('el comando solo compara: no abre legacyData/ para escribir', () => {
  const fuente = require('fs').readFileSync(require.resolve('../scripts/contrastar-matrix.js'), 'utf8');
  assert.ok(!/writeFileSync|appendFileSync|createWriteStream/.test(fuente));
});

// DESDE EL VIGIA (2026-10-14): el job `contrastar` pregunta al lock si el Product Matrix quedó
// pendiente y baja el PDF de la URL de fuentes.js, nunca de otra.
test('pendiente segun el lock: la URL sale de fuentes.js y del lock solo un hash valido', () => {
  const f = C.fuenteMatrix();
  assert.match(f.url, /Fortinet_Product_Matrix\.pdf$/);
  assert.strictEqual(C.pendienteDelLock({ documentos: {} }), null);
  assert.strictEqual(C.pendienteDelLock({ documentos: { [f.clave]: { hashVerificado: 'a'.repeat(64) } } }), null, 'verificado y sin visto: nada pendiente');
  const p = C.pendienteDelLock({ documentos: { [f.clave]: { visto: { hash: 'b'.repeat(64) }, pendienteDesde: '2026-10-13T19:07:48.856Z' } } });
  assert.deepStrictEqual(p, { url: f.url, hash: 'b'.repeat(64), desde: '2026-10-13T19:07:48.856Z' });
  const raro = C.pendienteDelLock({ documentos: { [f.clave]: { visto: { hash: 'x\nurl=https://otra' }, pendienteDesde: 'ayer' } } });
  assert.deepStrictEqual(raro, { url: f.url, hash: null, desde: null }, 'un hash con otra forma no llega a $GITHUB_OUTPUT');
  // A demanda: sin cambio pendiente, se espera el PDF verificado.
  const aDemanda = C.pendienteDelLock({ documentos: { [f.clave]: { hashVerificado: 'c'.repeat(64) } } }, f, true);
  assert.deepStrictEqual(aDemanda, { url: f.url, hash: 'c'.repeat(64), desde: null });
});

test('descargar comprueba la firma del PDF y devuelve su SHA-256', async () => {
  const resp = (cuerpo, ok = true, status = 200) => async () => ({ ok, status, arrayBuffer: async () => Buffer.from(cuerpo) });
  const { hash } = await C.descargar('https://x', resp('%PDF-1.7 hola'));
  assert.strictEqual(hash, require('crypto').createHash('sha256').update('%PDF-1.7 hola').digest('hex'));
  await assert.rejects(C.descargar('https://x', resp('<html>login</html>')), /no es un PDF/);
  await assert.rejects(C.descargar('https://x', resp('', false, 403)), /HTTP 403/);
});

test('--url solo acepta la del Product Matrix y sale con 2', () => {
  const r = require('child_process').spawnSync(process.execPath, [require.resolve('../scripts/contrastar-matrix.js'), '--url', 'https://example.com/otro.pdf'], { encoding: 'utf8' });
  assert.strictEqual(r.status, 2);
  assert.match(r.stderr, /solo acepta la del Product Matrix/);
});
