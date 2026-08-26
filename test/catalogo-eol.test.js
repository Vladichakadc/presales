'use strict';
// Coherencia del catalogo y del conjunto de fuera de venta.
//
// POR QUE ESTA PRUEBA EXISTE. El conjunto CISCO_EOL_MODELS vivio meses en seedCatalog.js
// listando una serie ISR 4000 que la Fase 2 ya habia retirado: no marcaba nada y nadie se
// entero, porque un conjunto inerte se comporta exactamente igual que uno que funciona. Esto
// lo convierte en un fallo ruidoso.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const fortinet = require('../server/seed/legacyData/fortinet');
const cisco = require('../server/seed/legacyData/cisco');
const juniper = require('../server/seed/legacyData/juniper');

// Se lee el conjunto del fuente en vez de exportarlo: la prueba no debe obligar a cambiar la
// forma del modulo de siembra, y aqui lo unico que hace falta es la lista de nombres.
function conjuntoDelFuente(nombre) {
  const src = fs.readFileSync(path.join(__dirname, '..', 'server', 'seed', 'seedCatalog.js'), 'utf8');
  const marca = `const ${nombre} = new Set([`;
  const i = src.indexOf(marca);
  if (i < 0) return null;
  const fin = src.indexOf(']', i + marca.length);
  return src.slice(i + marca.length, fin)
    .split(',').map((s) => s.trim().replace(/^'|'$/g, '')).filter(Boolean);
}

test('todo modelo listado como fuera de venta existe en su catalogo', () => {
  const lista = conjuntoDelFuente('FORTINET_EOL_MODELS');
  assert.ok(lista && lista.length, 'no se encontro FORTINET_EOL_MODELS');
  const huerfanos = lista.filter((m) => !fortinet.MODELS.some((x) => x.id === m));
  assert.deepStrictEqual(huerfanos, [],
    'un nombre que no casa con ningun modelo no marca nada y aparenta que si');
});

test('el conjunto inerte de Cisco ya no esta', () => {
  assert.strictEqual(conjuntoDelFuente('CISCO_EOL_MODELS'), null,
    'la serie ISR 4000 se retiro en la Fase 2; el conjunto no marcaba nada desde entonces');
});

test('cada aviso de fin de venta de Cisco apunta a un modelo real', () => {
  for (const nombre of Object.keys(cisco.EOL_ANNOUNCED || {})) {
    assert.ok(cisco.MODELS.some((m) => m.id === nombre),
      `EOL_ANNOUNCED describe "${nombre}", que no esta en el catalogo`);
  }
});

test('las fechas de ultimo pedido son fechas de verdad', () => {
  // La regla de FICHA.rango depende de poder parsearlas: una fecha ilegible deja al equipo
  // como vigente para siempre, que es justo lo contrario de lo que el boletin dice.
  for (const [nombre, info] of Object.entries(cisco.EOL_ANNOUNCED || {})) {
    if (!info.lastOrder) continue;
    assert.ok(Number.isFinite(Date.parse(info.lastOrder)),
      `${nombre}: "${info.lastOrder}" no es una fecha parseable`);
  }
});

test('ningun modelo trae precio inventado donde no hay lista de precios', () => {
  // Juniper y Aruba van sin cotizar a proposito. Un precio plausible pero inventado es el
  // fallo que este catalogo ya cometio una vez, y el BOM cuenta las lineas sin precio.
  for (const m of juniper.MODELS) {
    assert.ok(m.elp == null && m.elpN == null,
      `${m.id} trae precio y no hay lista de precios de Juniper`);
  }
});

test('las cifras del catalogo Juniper son coherentes entre bases de medicion', () => {
  // IMIX nunca puede superar a paquetes grandes, y la inspeccion nunca al firewall. Una
  // cifra que rompa esto contradice la fisica del producto: es una fila mal copiada.
  for (const m of juniper.MODELS) {
    if (m.fw && m.fwImix) assert.ok(m.fwImix <= m.fw, `${m.id}: IMIX (${m.fwImix}) supera a paquetes grandes (${m.fw})`);
    if (m.vpn && m.vpnImix) assert.ok(m.vpnImix <= m.vpn, `${m.id}: IPsec IMIX supera a IPsec`);
    if (m.fw && m.ips) assert.ok(m.ips <= m.fw, `${m.id}: IPS (${m.ips}) supera al firewall (${m.fw})`);
    if (m.ips && m.atp) assert.ok(m.atp <= m.ips, `${m.id}: ATP (${m.atp}) supera a IPS (${m.ips})`);
  }
});

test('un hueco del catalogo es null, nunca 0 ni una cadena vacia', () => {
  // `null` significa "el catalogo no trae el dato" y el motor no filtra por ese eje. Un 0
  // significaria "capacidad cero" y descartaria el equipo sin decir por que.
  for (const m of juniper.MODELS) {
    for (const campo of ['fw', 'fwImix', 'vpn', 'vpnImix', 'ips', 'atp', 'sess', 'cps']) {
      const v = m[campo];
      assert.ok(v === null || (typeof v === 'number' && v > 0),
        `${m.id}.${campo} vale ${JSON.stringify(v)}: debe ser null o un numero positivo`);
    }
  }
});
