'use strict';
// Hoja «Supuestos» del Excel de bom.js (2026-10-19). La hoja «BOM» sigue siendo la primera (lo
// fija e2e-huawei-vistas en el Excel descargado); aquí se afirma el contenido de la nueva, que es
// un núcleo puro: fecha, enlace, fabricante, plataforma, resultado, parámetros y fuentes, y que lo
// que no consta lo dice en vez de quedar en blanco.
const test = require('node:test');
const assert = require('node:assert');
const { cargar } = require('./ayuda/navegador');

const { BOM } = cargar('public/js/pqc.js', 'public/js/bom.js');
const texto = (aoa) => aoa.map((r) => r.join(' | ')).join('\n');

const META = { titulo: 'Lista de materiales — AR651', supuestos: { vendor: 'huawei', fabricante: 'Huawei', plataforma: 'NetEngine AR',
  modelo: 'AR651', serie: 'AR650', resumen: [['Necesidad de diseño', '1.3 Gbps · 0.48 Mpps a 340 bytes'], ['Cómo se mide el caudal', 'bajada 500 Mbps + subida 500 Mbps = 1 Gbps']] } };
const ENTORNO = { fecha: '19/10/2026, 10:00:00', url: 'https://x/dimensionador-huawei-netengine.html?bw=500',
  parametros: [{ etiqueta: 'Ancho de banda contratado', valor: '500', cambiado: true }, { etiqueta: 'Margen', valor: '30', cambiado: false }],
  fuentes: { lista: [{ documento: 'Ficha AR650', fecha: '2025-08-10', estado: 'Vigente', vigilancia: 'Sin cambios', cubre: 'AR651', url: 'https://e.huawei.com/x.pdf' }] } };

test('la hoja trae fecha, enlace reproducible, fabricante, plataforma y equipo', () => {
  const t = texto(BOM.matrizSupuestos(META, ENTORNO).aoa);
  assert.match(t, /Fecha de exportación \| 19\/10\/2026/);
  assert.match(t, /Enlace que reproduce el escenario \| https:\/\/x\/dimensionador-huawei-netengine\.html\?bw=500/);
  assert.match(t, /Fabricante \| Huawei/);
  assert.match(t, /Plataforma evaluada \| NetEngine AR/);
  assert.match(t, /Equipo del BOM \| AR651/);
});

test('el resultado y los parámetros activos, marcando los que se cambiaron', () => {
  const aoa = BOM.matrizSupuestos(META, ENTORNO).aoa;
  const t = texto(aoa);
  assert.match(t, /RESULTADO DEL DIMENSIONAMIENTO/);
  assert.match(t, /bajada 500 Mbps \+ subida 500 Mbps/);
  assert.deepStrictEqual([...aoa.find((r) => r[0] === 'Ancho de banda contratado')], ['Ancho de banda contratado', '500', 'Sí']);
  assert.deepStrictEqual([...aoa.find((r) => r[0] === 'Margen')], ['Margen', '30', '']);
});

test('las fuentes con su estado y vigilancia; un fallo de red se dice, no se calla', () => {
  assert.match(texto(BOM.matrizSupuestos(META, ENTORNO).aoa), /Ficha AR650 \| 2025-08-10 \| Vigente \| Sin cambios \| AR651/);
  const t = texto(BOM.matrizSupuestos(META, { ...ENTORNO, fuentes: { error: 'HTTP 500' } }).aoa);
  assert.match(t, /No se pudo leer la procedencia \(HTTP 500\)/);
});

test('sin parámetros ni plataforma declarados, lo dice', () => {
  const t = texto(BOM.matrizSupuestos({ titulo: 'BOM' }, { fecha: 'f', url: 'u' }).aoa);
  assert.match(t, /la página no distingue plataformas/);
  assert.match(t, /La página no expuso sus parámetros/);
  assert.match(t, /no registra fuentes/);
});

test('fuentesDelEquipo: manda lo declarado; el texto solo casa las que no declaran; si nada, todas con el aviso', () => {
  const datos = { fuentes: [
    { documento: 'Ficha AR650', cubre: 'reenvío del AR651 y el AR651W-8P', estado: 'vigente', vigilancia: { estado: 'verificada' }, modelosResueltos: ['AR651', 'AR651W-8P'] },
    { documento: 'Folleto', cubre: 'contexto del AR651', estado: 'vigente', modelosResueltos: [] },
    { documento: 'Hardware Description', cubre: 'fuentes del AR651', estado: 'vigente', modelosResueltos: null },
    { documento: 'Ficha AR8000', cubre: 'AR8140', estado: 'vieja', modelosResueltos: ['AR8140-12G10XG'] },
    { documento: 'Vieja', cubre: 'AR651', estado: 'historico', modelosResueltos: ['AR651'] },
  ] };
  const r = BOM.fuentesDelEquipo(datos, ['AR651', 'AR650']);
  assert.deepStrictEqual([...r.lista.map((x) => `${x.documento} · ${x.asociacion}`)],
    ['Ficha AR650 · declarada en el catálogo', 'Hardware Description · su texto nombra el equipo'],
    'el folleto declara que no respalda nada aunque lo cite, y la sustituida no cuenta');
  assert.ok(!r.todas);
  const r2 = BOM.fuentesDelEquipo(datos, ['NE8000 M8']);
  assert.strictEqual(r2.todas, true);
  assert.strictEqual(r2.lista.length, 4);
  assert.strictEqual(BOM.fuentesDelEquipo(datos, [undefined]).todas, true, 'sin equipo no se inventa una asociación');
});

test('la tabla de fuentes de la hoja dice cómo se asoció cada una', () => {
  const t = texto(BOM.matrizSupuestos(META, { ...ENTORNO, fuentes: { lista: [{ documento: 'Ficha AR650', estado: 'Vigente', vigilancia: 'Sin cambios', asociacion: 'declarada en el catálogo' }] } }).aoa);
  assert.match(t, /Asociación con el equipo/);
  assert.match(t, /Ficha AR650 \| sin fecha \| Vigente \| Sin cambios \|  \|  \| declarada en el catálogo/);
});

test('un resumen que llega como texto se escribe como una fila y no tumba la hoja', () => {
  // Cisco lo pasaba así hasta el 2026-10-27 y el Excel de Cisco no se descargaba.
  const t = texto(BOM.matrizSupuestos({ titulo: 'BOM', supuestos: { fabricante: 'Cisco', resumen: 'Overlay 900 Mbps' } }, { fecha: 'f', url: 'u' }).aoa);
  assert.match(t, /RESULTADO DEL DIMENSIONAMIENTO\nResultado \| Overlay 900 Mbps/);
});

// La PQC exigida con su versión mínima (2026-10-27, mejora propuesta en la sexagesimosexta entrega):
// el equipo la cumple DESDE una versión de software, y la propuesta tiene que decirlo.
test('con «Exigir PQC», la hoja dice el mecanismo, la versión mínima y la fuente; sin exigirla, nada', () => {
  const ISR = { tipo: 'ppk', mecanismo: 'Claves precompartidas post-cuánticas (PPK, RFC 8784)', donde: 'IKEv2 e IPsec',
    desde: 'IOS XE 17.12.1a', fuente: 'Guía de IOS XE 17' };
  const meta = { titulo: 'BOM', supuestos: { fabricante: 'Cisco', modelo: 'ISR 1111-8P', pqc: ISR } };
  const clave = { fecha: 'f', url: 'u', pqc: { nivel: 'clave', etiqueta: 'Mecanismo quantum-safe documentado (PPK, MACsec/ANYsec o ML-KEM)' } };
  const t = texto(BOM.matrizSupuestos(meta, clave).aoa);
  assert.match(t, /CRIPTOGRAFÍA POST-CUÁNTICA EXIGIDA/);
  assert.match(t, /Requisito del escenario \| Mecanismo quantum-safe documentado/);
  assert.match(t, /¿El equipo del BOM lo cumple\? \| Sí/);
  assert.match(t, /Mecanismo documentado \| PPK \(RFC 8784\): Claves precompartidas/);
  assert.match(t, /Versión mínima de software \| IOS XE 17\.12\.1a o superior/);
  assert.match(t, /Fuente \| Guía de IOS XE 17/);
  // Sin exigirla, la sección no sale (los parámetros ya dicen que no se exige).
  assert.doesNotMatch(texto(BOM.matrizSupuestos(meta, { fecha: 'f', url: 'u' }).aoa), /POST-CUÁNTICA/);
});

test('PQC exigida: sin versión lo dice, un equipo elegido a mano que no cumple lo dice con su motivo', () => {
  const EC = { tipo: 'ppk', mecanismo: 'PPK en IKEv2', desde: null, fuente: 'Cifrados de EdgeConnect' };
  const ml = { fecha: 'f', url: 'u', pqc: { nivel: 'mlkem', etiqueta: 'Algoritmo post-cuántico ML-KEM (FIPS 203)' } };
  const t = texto(BOM.matrizSupuestos({ titulo: 'BOM', supuestos: { modelo: 'EC-10104', pqc: EC } }, ml).aoa);
  assert.match(t, /¿El equipo del BOM lo cumple\? \| No: su documento da PPK \(RFC 8784\), no un algoritmo ML-KEM/);
  assert.match(t, /Versión mínima de software \| la fuente no da la versión/);
  const sin = texto(BOM.matrizSupuestos({ titulo: 'BOM', supuestos: { modelo: 'AR651' } }, { ...ml, pqc: { nivel: 'clave', etiqueta: 'x' } }).aoa);
  assert.match(sin, /¿El equipo del BOM lo cumple\? \| No: no consta en ningún documento oficial que la traiga/);
  assert.match(sin, /eso no prueba que no la tenga/);
});

test('PQC exigida con un «no» documentado: la hoja dice el motivo y la fuente, no «no consta»', () => {
  const no = { motivo: 'su última versión de IOS XE es la 17.9, anterior a la 17.11.1a', corto: 'x', fuente: 'Boletín del ASR1001-X' };
  const t = texto(BOM.matrizSupuestos({ titulo: 'BOM', supuestos: { modelo: 'ASR 1001-X', pqc: null, pqcNo: no } },
    { fecha: 'f', url: 'u', pqc: { nivel: 'clave', etiqueta: 'x' } }).aoa);
  assert.match(t, /¿El equipo del BOM lo cumple\? \| No: no la trae — su última versión de IOS XE es la 17\.9/);
  assert.match(t, /Fuente \| Boletín del ASR1001-X/);
  assert.doesNotMatch(t, /eso no prueba que no la tenga/);
});

test('las siete páginas pasan el `pqc` del equipo a la hoja', () => {
  const fs = require('fs');
  const path = require('path');
  for (const p of ['aruba-edgeconnect', 'cisco-catalyst8k', 'fortinet-fortigate', 'huawei-netengine', 'juniper-srx', 'mikrotik-routeros', 'nokia-7750sr']) {
    const js = fs.readFileSync(path.join(__dirname, '..', 'public', 'js', `dimensionador-${p}.js`), 'utf8');
    assert.match(js, /pqc: ?m\.pqc \|\| null, pqcNo: ?m\.pqcNo \|\| null/, `${p} no pasa la PQC (y su «no») a «Supuestos»`);
  }
});

// CICLO DE VIDA (2026-10-28, mejora propuesta al cerrar el PR #40): el equipo que está o va a estar
// fuera de venta lo dice también el Excel, con la fecha, el sucesor y el boletín; un equipo sin
// dato de ciclo no se declara vigente (la sección no sale).
test('ciclo de vida: fin de venta anunciado, vencido, fuera de venta y línea anterior; sin dato, nada', () => {
  const HOY = Date.parse('2026-10-28');
  const anunciado = BOM.cicloDe({ id: 'C8300-1N1S-6T', eolAnnounced: { pid: 'C8300-1N1S-6T', lastOrder: '2027-01-31', sucesor: 'Cisco Secure Router C8375-E-G2', url: 'https://www.cisco.com/x-eol.html' } });
  let c = BOM.cicloDelEquipo(anunciado, HOY);
  let t = texto(c.filas);
  assert.match(t, /Estado \| Fin de venta anunciado/);
  assert.match(t, /Último día de pedido \| 2027-01-31/);
  assert.match(t, /Sucesor según el boletín \| Cisco Secure Router C8375-E-G2/);
  assert.match(t, /Boletín oficial \| https:\/\/www\.cisco\.com\/x-eol\.html/);
  assert.match(c.linea, /fin de venta anunciado \(último pedido el 2027-01-31\)/);

  c = BOM.cicloDelEquipo(anunciado, Date.parse('2027-03-01'));
  assert.match(texto(c.filas), /Estado \| Fuera de venta: la fecha de último pedido ya pasó/);
  assert.match(c.linea, /está fuera de venta \(último pedido el 2027-01-31\)/);

  c = BOM.cicloDelEquipo(BOM.cicloDe({ eol: true, sucesor: 'EC-10106' }), HOY);
  t = texto(c.filas);
  assert.match(t, /Estado \| Fuera de venta/);
  assert.match(t, /Último día de pedido \| el catálogo no trae la fecha/);
  assert.match(t, /Sucesor natural \| EC-10106 \(inferencia por capacidad, sin documento oficial\)/, 'el sucesor inferido se dice como tal');
  assert.match(t, /Boletín oficial \| el catálogo no trae el boletín/);

  c = BOM.cicloDelEquipo(BOM.cicloDe({ legacy: true }), HOY);
  assert.match(texto(c.filas), /Estado \| Línea anterior/);
  assert.strictEqual(c.linea, null, 'la línea anterior no lleva aviso en la hoja BOM: se sigue pidiendo');

  assert.strictEqual(BOM.cicloDe({ id: 'AR651' }), null, 'sin dato de ciclo no se afirma nada');
  assert.strictEqual(BOM.cicloDelEquipo(null), null);
  // En la hoja: sección propia, y nada si no hay ciclo.
  const meta = { titulo: 'BOM', supuestos: { fabricante: 'Cisco', modelo: 'C8300-1N1S-6T', ciclo: anunciado } };
  assert.match(texto(BOM.matrizSupuestos(meta, { fecha: 'f', url: 'u' }).aoa), /CICLO DE VIDA DEL EQUIPO\n.*Estado \| Fin de venta anunciado/);
  assert.doesNotMatch(texto(BOM.matrizSupuestos(META, ENTORNO).aoa), /CICLO DE VIDA/);
});

test('las siete páginas pasan el ciclo de vida del equipo a la hoja', () => {
  const fs = require('fs');
  const path = require('path');
  for (const p of ['aruba-edgeconnect', 'cisco-catalyst8k', 'fortinet-fortigate', 'huawei-netengine', 'juniper-srx', 'mikrotik-routeros', 'nokia-7750sr']) {
    const js = fs.readFileSync(path.join(__dirname, '..', 'public', 'js', `dimensionador-${p}.js`), 'utf8');
    assert.match(js, /pqcNo: ?m\.pqcNo \|\| null, ciclo: ?BOM\.cicloDe\(m\)/, `${p} no pasa el ciclo de vida a «Supuestos»`);
  }
  const bom = fs.readFileSync(path.join(__dirname, '..', 'public', 'js', 'bom.js'), 'utf8');
  assert.match(bom, /Atención: \$\{ciclo\.linea\}\. Detalle, sucesor y boletín en la hoja «Supuestos»\./, 'el aviso no llega a la hoja BOM');
});
