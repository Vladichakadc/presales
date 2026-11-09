'use strict';
// `npm run catalogo` dice lo que falta de la lista firmada en FortiWiFi y FortiExtender
// (2026-11-06, mejora propuesta al cerrar el PR #143). Lo que se prueba es lo que dejaría la
// extracción a medias sin que nadie lo viera: un FortiWiFi con bloque y sin `lic` que no se
// lista, una sugerencia distinta de la del importador, o un FortiExtender al que le falta un SKU
// de su ficha y se da por terminado. Los bloques son SINTÉTICOS (códigos PRB… y precios
// inventados): la lista firmada no entra al repositorio.
const test = require('node:test');
const assert = require('node:assert');
const { listaFortinet, sugerirLicencias } = require('../scripts/catalogo-check');
const { extraer } = require('../scripts/importar-skus-fortinet');
const V = require('../server/seed/legacyData/fortinetVariantes');

const ref = (sku, p = 1) => ({ sku, d: sku, p, t: /^FC-10-/.test(sku) ? 'Service' : 'HW' });
const WIFI_50G = ['FWF-50G-A', 'FC-10-PRB50-809-02-12', 'FC-10-PRB50-950-02-36', 'FWF-50G-BDL-809-12'].map((s) => ref(s));

test('hoy, sin extraer: cada FortiWiFi sin `lic` y cada FortiExtender se listan como «sin extraer»', () => {
  const filas = listaFortinet();
  const esperados = [
    ...V.VARIANTES.filter((v) => !v.lic && /^FortiWiFi /.test(v.id)).map((v) => v.id),
    ...V.FORTIEXTENDER.modelos.map((x) => x.id),
  ];
  assert.ok(esperados.length >= 14);
  assert.deepStrictEqual(filas.map((f) => [f.modelo, f.estado]), esperados.map((m) => [m, 'sin-extraer']));
});

test('un FortiWiFi con bloque y sin `lic` se lista con la sugerencia; un FortiExtender completo no se lista', () => {
  const fex = V.FORTIEXTENDER.modelos.find((x) => x.id === 'FortiExtender 101G');
  const wan = V.FORTIEXTENDER.modelos.find((x) => x.id === 'FortiExtender WAN 50G');
  const filas = listaFortinet({
    skus: { 'FortiWiFi 50G': WIFI_50G, 'FortiWiFi 31G': [ref('FWF-31G-A')],
      [fex.id]: fex.skus.map((s) => ref(s)), [wan.id]: [ref(wan.skus[0])] },
    variantes: V.VARIANTES.filter((v) => ['FortiWiFi 50G', 'FortiWiFi 31G', 'FortiGate 50G-5G'].includes(v.id)),
    extenders: [fex, wan],
  });
  const porModelo = (a, b) => a.modelo.localeCompare(b.modelo);
  assert.deepStrictEqual([...filas].sort(porModelo), [
    { modelo: 'FortiWiFi 31G', estado: 'sin-licencias', sugerido: { lic: null, bdl: null, codigos: [] } },
    { modelo: 'FortiWiFi 50G', estado: 'sin-licencias', sugerido: { lic: 'PRB50', bdl: 'FWF-50G-BDL', codigos: ['PRB50'] } },
    { modelo: 'FortiExtender WAN 50G', estado: 'incompleto', faltan: wan.skus.slice(1) },
  ].sort(porModelo));
  // La celular declara `lic`: no es asunto de esta sección.
  assert.ok(!filas.some((f) => f.modelo === 'FortiGate 50G-5G'));
});

test('con dos códigos de licencias no se sugiere ninguno', () => {
  const s = sugerirLicencias([...WIFI_50G, ref('FC-10-PRB51-809-02-12')]);
  assert.deepStrictEqual(s, { lic: null, bdl: null, codigos: ['PRB50', 'PRB51'] });
});

test('la sugerencia es la misma que la del importador', () => {
  const CAB = ['Item', 'SKU', 'Vendor Description', 'Short Description', 'Product', 'Product Type', 'Price'];
  const filas = [CAB, ...WIFI_50G.map((r) => ['FortiWiFi-50G', r.sku, r.d, r.d, 'FortiWiFi-50G', r.t, r.p])];
  const r = extraer({ filas, modelos: [], precioDe: new Map(),
    variantes: V.VARIANTES.filter((v) => v.id === 'FortiWiFi 50G'), extenders: [] });
  const s = sugerirLicencias(r.salida['FortiWiFi 50G']);
  assert.ok(r.sugerencias.includes(`FortiWiFi 50G: lic: '${s.lic}', bdl: '${s.bdl}'`), r.sugerencias.join(' | '));
});
