'use strict';
// El portal y la guia frente al dimensionador (`cifrasCotizador.js`, seccion «PORTAL Y GUIA
// FRENTE AL DIMENSIONADOR» de `npm run catalogo`). Nacio el 2026-10-02 de dos fallos que ningun
// archivo mostraba: la capacidad de Nokia llegaba al portal en Gbps donde todo el portal lee
// Mbps, y «SRX 345» se quedaba sin el IPsec de «SRX345». Las reglas se prueban con catalogos
// SINTETICOS, como la seccion del cotizador: una prueba que fijara cifras reales se pondria roja
// el dia que alguien corrigiera un dato. Lo unico real es el ultimo caso, que exige que el archivo
// del portal no diga otra cosa que el dimensionador.
const test = require('node:test');
const assert = require('node:assert');
const {
  contrastePortal, contrastarAlternativa, leerAlternativa, proyectarGuia, contrasteGuia,
  normalizarModelo, aMbps,
} = require('../server/services/cifrasCotizador');

const indiceDe = (vendor, modelos) => ({ [vendor]: new Map(modelos.map((m) => [normalizarModelo(m.id), m])) });

test('el portal lee un numero como Mbps: la capacidad de Nokia en Gbps es el fallo que se mide', () => {
  const indice = indiceDe('nokia', [{ id: '7250 IXR-e', cap: 300 }]);
  const mapa = { nokia: { vendor: 'nokia', campos: { cap: 'cap' } } };
  assert.strictEqual(aMbps('nokia', 'cap', 300), 300000, 'el dimensionador de Nokia guarda Gbps');
  // Lo que servia la siembra antes del arreglo: el numero del dimensionador, sin convertir.
  const roto = contrastePortal({ nokia: [{ model: '7250 IXR-e', cap: 300 }] }, { indice, mapa })[0];
  assert.strictEqual(roto.difiere.length, 1);
  assert.strictEqual(roto.difiere[0].dimensionador, 300000);
  for (const cap of [300000, '300 Gbps']) {
    const r = contrastePortal({ nokia: [{ model: '7250 IXR-e', cap }] }, { indice, mapa })[0];
    assert.deepStrictEqual([r.coincide, r.comparadas, r.difiere.length], [1, 1, 0], `cap ${cap}`);
  }
});

test('coincidir es dentro del redondeo con que el portal la escribe, y lo demas difiere', () => {
  const indice = indiceDe('fortinet', [{ id: 'FortiGate 30G', fw: 4000, ngfw: 570, vpn: 3500 }]);
  const mapa = { fortinet: { vendor: 'fortinet', campos: { fw: 'fw', ngfw: 'ngfw', vpn: 'vpn' } } };
  const r = contrastePortal({ fortinet: [{ model: 'FortiGate 30G', fw: '4 Gbps', ngfw: '0.6 Gbps', vpn: '3.1 Gbps' }] }, { indice, mapa })[0];
  assert.strictEqual(r.coincide, 2, '«0.6 Gbps» cubre los 570 Mbps');
  // «3 Gbps», sin decimales, cubriria de 2,5 a 3,5: el redondeo con que se escribio decide.
  assert.strictEqual(contrastePortal({ fortinet: [{ model: 'FortiGate 30G', vpn: '3 Gbps' }] }, { indice, mapa })[0].coincide, 1);
  assert.deepStrictEqual(r.difiere.map((x) => [x.campo, x.dimensionador]), [['vpn', 3500]]);
});

test('calla: el dimensionador trae la cifra y el portal no la da (el SRX 345 sin su IPsec)', () => {
  const indice = indiceDe('juniper', [{ id: 'SRX345', fw: 5000, vpn: 977, ips: 600 }]);
  const mapa = { juniper: { vendor: 'juniper', campos: { cap: ['fw', 'cap'], fw: 'fw', vpn: 'vpn', ips: 'ips' } } };
  const r = contrastePortal({ juniper: [{ model: 'SRX 345', cap: '5 Gbps FW', ips: 0 }] }, { indice, mapa })[0];
  assert.strictEqual(r.coincide, 1, 'el «5 Gbps FW» de texto es el firewall');
  assert.deepStrictEqual(r.calla.map((x) => x.destino).sort(), ['ips', 'vpn'], 'cero y ausente son la misma forma de no dar la cifra');
});

test('un dato que el portal da en un campo no esta callado aunque otro venga vacio (Gateway 9106)', () => {
  const indice = indiceDe('aruba', [{ id: 'Gateway 9106', fw: 10000 }, { id: 'EC-M', wanMax: 5000 }]);
  const mapa = { aruba: { vendor: 'aruba', campos: { fwd: ['wanMax', 'fw'], fw: 'fw', wanMax: 'wanMax' } } };
  const r = contrastePortal({ aruba: [
    { model: 'Gateway 9106', fwd: 0, fw: 10000 },
    { model: 'EC-M', fwd: 5000, wanMax: 5000 },
  ] }, { indice, mapa })[0];
  assert.deepStrictEqual([r.coincide, r.calla.length, r.difiere.length], [3, 0, 0], 'la portada es el techo WAN de un EdgeConnect y el firewall de un gateway');
});

test('sin dato, ilegible y sin pareja son estados propios, nunca «coincide»', () => {
  const indice = indiceDe('cisco', [{ id: 'C1', fwd: 300 }]);
  const mapa = { cisco: { vendor: 'cisco', campos: { fwd: 'fwd', ipsec: 'ipsec' } } };
  const r = contrastePortal({ cisco: [
    { model: 'C1', fwd: 'hasta 300 Mbps', ipsec: '200 Mbps' },
    { model: 'C2', fwd: '1 Gbps' },
  ] }, { indice, mapa })[0];
  assert.deepStrictEqual(r.ilegible.map((x) => x.campo), ['fwd']);
  assert.deepStrictEqual(r.sinDato.map((x) => x.campo), ['ipsec']);
  assert.deepStrictEqual(r.sinPareja, ['C2']);
  assert.strictEqual(r.comparadas, 0);
});

test('la alternativa: el modelo es el prefijo mas largo que casa, y la cifra cuenta pegada a el', () => {
  const porNombre = indiceDe('aruba', [{ id: 'Gateway 9012', fw: 6000 }, { id: 'EC-M', wanMax: 5000 }]).aruba;
  assert.strictEqual(leerAlternativa('Gateway 9012 si la sucursal necesita LAN', porNombre).modelo, 'Gateway 9012');
  assert.strictEqual(leerAlternativa('Gateway 9012 si la sucursal necesita LAN', porNombre).cifra, null);
  assert.strictEqual(contrastarAlternativa('EC-M (5 Gbps WAN) si el hub no pasa de esa cifra', 'aruba', porNombre).estado, 'coincide');
  assert.strictEqual(contrastarAlternativa('EC-M (2 Gbps)', 'aruba', porNombre).estado, 'difiere');
  assert.strictEqual(contrastarAlternativa('Otro equipo (2 Gbps)', 'aruba', porNombre).estado, 'sinPareja');
  assert.strictEqual(contrastarAlternativa('Aruba Central para la serie 9000', 'aruba', porNombre).estado, 'sinCifra');
});

test('la etiqueta tras la cifra dice el campo; una desconocida no se adivina', () => {
  const porNombre = indiceDe('fortinet', [{ id: 'FortiGate 700G', fw: 164000, ngfw: 29000 }]).fortinet;
  const de = (alt) => contrastarAlternativa(alt, 'fortinet', porNombre);
  assert.deepStrictEqual([de('FortiGate 700G (29 Gbps NGFW)').estado, de('FortiGate 700G (29 Gbps NGFW)').campo], ['coincide', 'ngfw']);
  assert.deepStrictEqual([de('FortiGate 700G (164 Gbps FW)').estado, de('FortiGate 700G (164 Gbps FW)').campo], ['coincide', 'fw']);
  // Sin etiqueta manda la cifra de portada; leer «29 Gbps» como firewall daria un «difiere» falso,
  // que es por lo que la etiqueta se respeta.
  assert.strictEqual(de('FortiGate 700G (29 Gbps)').estado, 'difiere');
  assert.strictEqual(de('FortiGate 700G (164 Gbps modular)').estado, 'coincide', 'una palabra en minusculas es prosa');
  assert.strictEqual(de('FortiGate 700G (29 Gbps IPS)').estado, 'ilegible');
});

test('la guia no cita una cifra en disputa ni recomienda una alternativa fuera de venta', () => {
  const porNombre = indiceDe('huawei', [{ id: 'NE8000 M14', cap: 7200000 }, { id: 'NE8000 M8', cap: 4800000 }, { id: 'NE8000 M4', cap: 2400000 }]).huawei;
  const pareja = porNombre.get(normalizarModelo('NE8000 M8'));
  const ctx = { vendor: 'huawei', porNombre, pareja, fuera: (m) => m.id === 'NE8000 M4' };

  const disputa = proyectarGuia({ spec: '2.4 Tbps · 8 tarjetas 400G', alt: 'NE8000 M14 (2 Tbps)' }, ctx);
  assert.strictEqual(disputa.spec, 'Capacidad en revisión · 8 tarjetas 400G');
  assert.strictEqual(disputa.alt, 'NE8000 M14 (capacidad en revisión)');
  assert.deepStrictEqual(disputa.enRevision.map((x) => [x.donde, x.citado]), [['ficha', '2.4 Tbps'], ['alternativa', '2 Tbps']]);

  const retirada = proyectarGuia({ spec: '4.8 Tbps', alt: 'NE8000 M4 (2.4 Tbps modular)' }, ctx);
  assert.strictEqual(retirada.alt, '', 'una alternativa fuera de venta no se pinta, aunque su cifra coincida');
  assert.deepStrictEqual(retirada.altRetirada, { modelo: 'NE8000 M4', motivo: 'fuera de venta' });

  const bien = proyectarGuia({ spec: '4.8 Tbps · 8 tarjetas 400G', alt: 'NE8000 M14 (7.2 Tbps)' }, ctx);
  assert.deepStrictEqual([bien.spec, bien.alt, bien.enRevision.length], ['4.8 Tbps · 8 tarjetas 400G', 'NE8000 M14 (7.2 Tbps)', 0]);
});

test('el informe de la guia cuenta lo que la pantalla retiro y delata lo que dejo pasar', () => {
  const indice = indiceDe('huawei', [{ id: 'NE8000 M14', cap: 7200000 }, { id: 'NE8000 M8', cap: 4800000 }, { id: 'NE8000 M4', cap: 2400000 }]);
  const guia = { core: [
    { v: 'Huawei', model: 'NE8000 M8', spec: '4.8 Tbps', alt: 'NE8000 M14 (capacidad en revisión)',
      enRevision: [{ donde: 'alternativa', modelo: 'NE8000 M14', campo: 'cap', citado: '2 Tbps', dimensionador: '7.2 Tbps' }] },
    { v: 'Huawei', model: 'NE8000 M8', spec: '4.8 Tbps', alt: 'NE8000 M14 (2 Tbps)' },
    { v: 'Huawei', model: 'NE8000 M8', spec: '4.8 Tbps', alt: 'NE8000 M4 (2.4 Tbps)' },
    { v: 'Huawei', model: 'CloudEngine 9860', spec: '48 Tbps · 48x400GE', alt: 'CE9800 (19.2 Tbps)' },
    { v: 'Huawei', model: 'NE8000 M8', spec: '', alt: '' },
  ] };
  const r = contrasteGuia(guia, { indice, fuera: (v, m) => m.id === 'NE8000 M4' });
  assert.strictEqual(r.entradas, 5);
  assert.deepStrictEqual(r.enRevision.map((x) => [x.alternativa, Boolean(x.sinRetirar)]), [['NE8000 M14', false], ['NE8000 M14', true]]);
  assert.deepStrictEqual(r.altRetiradas.map((x) => [x.alternativa, x.sinRetirar]), [['NE8000 M4', true]]);
  assert.deepStrictEqual(r.fichaSinPareja.map((x) => x.modelo), ['CloudEngine 9860']);
  assert.deepStrictEqual(r.altSinPareja.map((x) => x.alternativa), ['CE9800 (19.2 Tbps)']);
  assert.deepStrictEqual(r.sinFicha.map((x) => x.modelo), ['NE8000 M8']);
});

test('el archivo del portal no dice otra cosa que el dimensionador', () => {
  // La siembra pisa con las del dimensionador las cifras que los dos traen, asi que una fila del
  // portal que no coincida no se ve... hasta el dia en que deja de casar y vuelve a pintarse la
  // suya. El 2026-10-02 eran diecisiete, entre ellas el Catalyst 8300-2N2S-6T con 10 Gbps de
  // forwarding frente a los 5 de su ficha.
  const portal = require('../server/seed/legacyData/indexPR');
  const malas = contrastePortal(portal).flatMap((r) => [
    ...r.difiere.map((x) => `${r.grupo} · ${x.modelo}: ${x.campo} «${x.portal}» frente a ${x.dimensionador} Mbps del dimensionador`),
    ...r.ilegible.map((x) => `${r.grupo} · ${x.modelo}: ${x.campo} «${x.texto}» no se sabe leer`),
  ]);
  assert.deepStrictEqual(malas, [], 'alinea legacyData/indexPR.js con el dimensionador (npm run catalogo)');
});

test('una entrada de la guia lleva texto y precio propios solo si el equipo no esta en el catalogo', () => {
  // Las que casan se pintan con el texto y el precio del catalogo, y una copia aqui seria un texto
  // que nadie ve hasta que el equipo sale del catalogo y vuelve a pintarse. La prueba del servidor
  // real (`servidor-produccion.test.js`) mira lo servido; esta, el archivo, en milisegundos.
  const guia = require('../server/seed/legacyData/guiaRoles');
  const cotizador = require('../server/seed/legacyData/cotizadorCatalog');
  const portal = require('../server/seed/legacyData/indexPR');
  const grupos = { hw_ar: 'huawei', hw_wan: 'huawei' };
  const enCatalogo = new Set([
    ...cotizador.map((r) => `${r.vendor.toLowerCase()}::${normalizarModelo(r.model)}`),
    ...Object.entries(portal).flatMap(([g, filas]) => filas.map((f) => `${grupos[g] || g}::${normalizarModelo(f.model)}`)),
  ]);
  for (const [rol, lista] of Object.entries(guia)) {
    for (const e of lista) {
      const casa = enCatalogo.has(`${e.v.toLowerCase()}::${normalizarModelo(e.model)}`);
      assert.strictEqual(e.spec === undefined && e.elp === undefined, casa,
        `${rol} · ${e.model}: ${casa ? 'esta en el catalogo y lleva texto o precio propios' : 'solo vive en la guia y le falta texto o precio'}`);
      assert.strictEqual(e.color, undefined, `${rol} · ${e.model}: el color es el del fabricante en la base`);
    }
  }
});
