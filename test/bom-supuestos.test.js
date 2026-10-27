'use strict';
// Hoja «Supuestos» del Excel de bom.js (2026-10-19). La hoja «BOM» sigue siendo la primera (lo
// fija e2e-huawei-vistas en el Excel descargado); aquí se afirma el contenido de la nueva, que es
// un núcleo puro: fecha, enlace, fabricante, plataforma, resultado, parámetros y fuentes, y que lo
// que no consta lo dice en vez de quedar en blanco.
const test = require('node:test');
const assert = require('node:assert');
const { cargar } = require('./ayuda/navegador');

const { BOM } = cargar('public/js/bom.js');
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
