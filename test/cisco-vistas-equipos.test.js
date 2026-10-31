'use strict';
// FIGURAS OFICIALES DEL DIMENSIONADOR CISCO (2026-10-20, petición del dueño: «incluir en la
// actualización del dimensionador los gráficos de los equipos en alta calidad con la parte
// frontal y posterior»).
//
// Lo mismo que vigilan las de Aruba, Fortinet, Huawei y MikroTik —una ruta que no existe, un
// modelo que el catálogo ya no tiene, una figura sin procedencia— y lo propio de Cisco:
//   1. La cara la dice el pie del documento: cada cara cita su documento, su figura y su rótulo
//      literal entre comillas angulares. Un dibujo hecho a mano (los SVG del dimensionador externo
//      que trajo el dueño) no es una figura y no puede entrar por aquí.
//   2. Sin pérdida y sin reescalar: el WebP lleva los píxeles del documento y el pie dice el
//      tamaño original; una figura servida más grande que su original es una figura inventada.
//   3. La línea G2 y los Meraki MX llevan frontal y trasera salvo donde el documento no publica
//      la trasera: entonces la pestaña lo dice (`rearNota`), nunca desaparece.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..');
const VISTAS = JSON.parse(fs.readFileSync(path.join(RAIZ, 'public/data/cisco-vistas-equipos.json'), 'utf8'));
const { MODELS, SECURE_FIREWALL } = require('../server/seed/legacyData/cisco.js');
const entradas = Object.entries(VISTAS).filter(([k]) => !k.startsWith('_'));

function lienzo(buf) {
  const i = buf.indexOf(Buffer.from('VP8L')) + 8;
  const bits = buf.readUInt32LE(i + 1);
  return [(bits & 0x3fff) + 1, ((bits >> 14) & 0x3fff) + 1];
}
function lienzoConPerdida(buf) {
  const i = buf.indexOf(Buffer.from('VP8 '));
  return [buf.readUInt16LE(i + 14) & 0x3fff, buf.readUInt16LE(i + 16) & 0x3fff];
}

// Lo que se declara a propósito sin figura, y por qué (ver `_procedencia`).
// Desde el 2026-10-28 los ISR 1116-4P y 1161X-8P tienen figura (ver «ISR sin figura propia» abajo).
// Desde el 2026-10-28 los tres ASR también (vista de frente de la página de la serie en cisco.com).
const SIN_FIGURA = new Set([]);
// Lo que Cisco solo dibuja por una cara, y lo dice la pestaña de la que falta.
const SOLO_TRASERA = new Set(['ISR 1116-4P']);

test('cada figura existe, es WebP SIN pérdida y no está reescalada', () => {
  for (const [modelo, v] of entradas) {
    const pies = v.fuente.split(/\. (?=Trasera — )/);
    for (const cara of ['front', 'rear']) {
      if (!v[cara]) continue;
      assert.match(v[cara], /^\/img\/equipos\/cs-[a-z0-9-]+-(front|rear)\.webp$/, `${modelo}: ${cara} fuera del patrón cs-*.webp`);
      const buf = fs.readFileSync(path.join(RAIZ, 'public', v[cara]));
      const cab = buf.subarray(0, 12).toString('latin1');
      assert.ok(cab.startsWith('RIFF') && cab.endsWith('WEBP'), `${modelo}: ${v[cara]} no es un WebP`);
      assert.ok(buf.includes(Buffer.from('VP8L')) && !buf.includes(Buffer.from('VP8 ')), `${modelo}: ${v[cara]} con pérdida`);
      const [w, h] = lienzo(buf);
      const pie = pies.find((p) => p.startsWith(cara === 'front' ? 'Frontal — ' : 'Trasera — '));
      assert.ok(pie, `${modelo}: el pie no dice de dónde sale la cara ${cara}`);
      const m = pie.match(/\((\d+) × (\d+) px(?:, servida a (\d+) × (\d+)|, sin recortar)\)\.?$/);
      assert.ok(m, `${modelo}: el pie de ${cara} no dice el tamaño original («${pie}»)`);
      const [W, H] = [Number(m[1]), Number(m[2])];
      const servida = m[3] ? [Number(m[3]), Number(m[4])] : [W, H];
      assert.deepStrictEqual([w, h], servida, `${modelo}: ${v[cara]} mide ${w} × ${h} y el pie dice ${servida.join(' × ')}`);
      assert.ok(w <= W && h <= H, `${modelo}: ${v[cara]} (${w} × ${h}) es más grande que su original (${W} × ${H}): reescalada`);
    }
  }
});

test('cada cara cita su documento, su figura o panel y el rótulo literal', () => {
  for (const [modelo, v] of entradas) {
    for (const pie of v.fuente.split(/\. (?=Trasera — )/)) {
      assert.match(pie, /^(Frontal|Trasera) — (ficha|guía|«)/, `${modelo}: el pie no nombra su documento («${pie}»)`);
      assert.match(pie, /«[^»]+».*«[^»]+»/, `${modelo}: el pie no trae documento y rótulo entre comillas («${pie}»)`);
      assert.match(pie, /figura \d+|Panel|panel|product_image|imagen «/, `${modelo}: el pie no dice qué figura es («${pie}»)`);
    }
  }
});

test('cada modelo con figura está en el catálogo y los que no la tienen están declarados', () => {
  // Los Secure Firewall (2026-10-31) no son routers del dimensionador: viven en SECURE_FIREWALL
  // y en el portal, y cada uno tiene figura.
  const ids = new Set([...MODELS, ...SECURE_FIREWALL.modelos].map((m) => m.id));
  for (const [modelo] of entradas) assert.ok(ids.has(modelo), `${modelo} tiene figura pero no está en el catálogo`);
  for (const m of SECURE_FIREWALL.modelos) assert.ok(VISTAS[m.id] && VISTAS[m.id].front, `${m.id}: sin figura frontal`);
  for (const m of MODELS) {
    if (SIN_FIGURA.has(m.id)) { assert.ok(!VISTAS[m.id], `${m.id}: declarado sin figura y la tiene`); continue; }
    if (SOLO_TRASERA.has(m.id)) { assert.ok(VISTAS[m.id] && VISTAS[m.id].rear && VISTAS[m.id].frontNota, `${m.id}: sin trasera o sin decir por qué no hay frontal`); continue; }
    assert.ok(VISTAS[m.id] && VISTAS[m.id].front, `${m.id}: sin figura frontal y no está declarado como tal`);
  }
});

test('frontal y trasera: la que falta, la pestaña la explica', () => {
  for (const [modelo, v] of entradas) {
    if (v.front && !v.rear) assert.ok(v.rearNota && v.rearNota.length > 30, `${modelo}: sin trasera y sin decir por qué`);
    if (v.rear) assert.ok(!v.rearNota, `${modelo}: tiene trasera y además una nota de que no la tiene`);
    if (!v.front) assert.ok(v.frontNota && v.frontNota.length > 30, `${modelo}: sin frontal y sin decir por qué`);
    if (v.front) assert.ok(!v.frontNota, `${modelo}: tiene frontal y además una nota de que no la tiene`);
  }
  const g2 = MODELS.filter((m) => /Secure Router|Meraki/.test(m.ser) && VISTAS[m.id]);
  const conDos = g2.filter((m) => VISTAS[m.id].rear).length;
  assert.ok(conDos >= 20, `solo ${conDos} equipos G2/Meraki con las dos caras`);
});

// La previa se sirve a 1.600 px como mucho (2026-10-28, «mejora la calidad de las imágenes»): la tarjeta
// mide unos 700 px de CSS, y en una pantalla de densidad 2 una previa de 1.200 px se veía borrosa.
test('cada figura tiene su vista previa: con pérdida, de 1.600 px como mucho y del mismo dibujo', () => {
  for (const [modelo, v] of entradas) {
    for (const cara of ['front', 'rear']) {
      if (!v[cara]) { assert.ok(!v[cara + 'Prev'], `${modelo}: previa de una cara que no tiene`); continue; }
      assert.strictEqual(v[cara + 'Prev'], v[cara].replace(/\.webp$/, '.prev.webp'));
      const buf = fs.readFileSync(path.join(RAIZ, 'public', v[cara + 'Prev']));
      assert.ok(buf.includes(Buffer.from('VP8 ')), `${modelo}: la previa de ${cara} no es con pérdida`);
      const [w, h] = lienzoConPerdida(buf);
      const [W, H] = lienzo(fs.readFileSync(path.join(RAIZ, 'public', v[cara])));
      assert.ok(w <= 1600, `${modelo}: previa de ${w} px de ancho`);
      assert.ok(w === Math.min(W, 1600), `${modelo}: la previa de ${cara} (${w} px) no está a la resolución que la tarjeta pide (${Math.min(W, 1600)} px)`);
      assert.ok(Math.abs(h - w * H / W) <= 1, `${modelo}: la previa de ${cara} (${w} × ${h}) no tiene las proporciones de su original (${W} × ${H})`);
    }
  }
});

test('la foto de producto (tercera pestaña) es opcional, sin pérdida, sin reescalar y con su propio pie', () => {
  const conFoto = entradas.filter(([, v]) => v.foto);
  assert.ok(conFoto.length >= 5, `solo ${conFoto.length} equipos con foto: se perdió alguna`);
  for (const [modelo, v] of conFoto) {
    assert.match(v.foto, /^\/img\/equipos\/cs-[a-z0-9-]+-foto\.webp$/, `${modelo}: foto fuera del patrón cs-*-foto.webp`);
    assert.notStrictEqual(v.foto, v.front, `${modelo}: la foto no puede ser la misma figura que la frontal`);
    const buf = fs.readFileSync(path.join(RAIZ, 'public', v.foto));
    assert.ok(buf.includes(Buffer.from('VP8L')) && !buf.includes(Buffer.from('VP8 ')), `${modelo}: la foto con pérdida`);
    // Las fichas de Meraki y las fotos de cabecera de las fichas de Cisco no numeran sus imágenes: el
    // rótulo literal es su texto alternativo («imagen «…»»).
    const m = (v.fotoFuente || '').match(/^Foto de producto de la ficha «[^»]+».*(?:figura \d+|imagen(?: de cabecera)?) «[^»]+» \((\d+) × (\d+) px(?:, servida a (\d+) × (\d+)|, sin recortar)\)/);
    assert.ok(m, `${modelo}: el pie de la foto no dice documento, figura, rótulo y tamaño («${v.fotoFuente}»)`);
    const servida = m[3] ? [Number(m[3]), Number(m[4])] : [Number(m[1]), Number(m[2])];
    assert.deepStrictEqual(lienzo(buf), servida, `${modelo}: la foto no mide lo que dice su pie`);
    assert.strictEqual(v.fotoPrev, v.foto.replace(/\.webp$/, '.prev.webp'));
    const prev = fs.readFileSync(path.join(RAIZ, 'public', v.fotoPrev));
    assert.ok(prev.includes(Buffer.from('VP8 ')) && lienzoConPerdida(prev)[0] <= 1600, `${modelo}: la previa de la foto`);
  }
});

test('no hay figuras huérfanas: todo cs-*.webp lo usa algún modelo', () => {
  const usadas = new Set(entradas.flatMap(([, v]) => [v.front, v.rear, v.foto, v.frontPrev, v.rearPrev, v.fotoPrev].filter(Boolean))
    .map((r) => path.basename(r)));
  const enDisco = fs.readdirSync(path.join(RAIZ, 'public/img/equipos')).filter((f) => f.startsWith('cs-') && f.endsWith('.webp'));
  const huerfanas = enDisco.filter((f) => !usadas.has(f));
  assert.deepStrictEqual(huerfanas, [], `figuras sin modelo: ${huerfanas.join(', ')}`);
});

test('ISR sin figura propia (2026-10-28): la de la familia que el documento nombra, dicho en el pie', () => {
  const i1161 = VISTAS['ISR 1161X-8P'];
  assert.match(i1161.fuente, /figura 29 «Cisco 11x1\(X\)-8P\/ C11x1\(X\)-8PLTEP LED Indicators»/);
  assert.match(i1161.fuente, /C1121-8PLTEP/, 'el pie tiene que decir que el dibujo lleva el rótulo de otra variante');
  assert.strictEqual(i1161.frontLeyenda.filas.length, 9);
  assert.match(i1161.fotoFuente, /figura 3 «C1161X- 8PLTEP».*sin el módulo/);
  assert.ok(i1161.rearNota, 'el 1161X-8P no tiene trasera publicada');
  const i1116 = VISTAS['ISR 1116-4P'];
  assert.strictEqual(i1116.rear, VISTAS['ISR 1111-8P'].rear, 'la cara del logotipo es la de la serie C111x');
  assert.deepStrictEqual(i1116.rearLeyenda, VISTAS['ISR 1111-8P'].rearLeyenda);
  assert.ok(!i1116.front && !i1116.foto, 'del C111x-4P Cisco no publica cara de puertos ni foto: no se sirve la de otro');
});

test('los Meraki de sobremesa se abren por la cara de puertos y llevan su foto de producto (2026-10-28)', () => {
  for (const m of ['Meraki MX67', 'Meraki MX67C', 'Meraki MX68', 'Meraki MX68CW', 'Meraki MX75']) {
    assert.strictEqual(VISTAS[m].inicial, 'rear', `${m}: la tarjeta tiene que abrirse por los puertos`);
    assert.ok(VISTAS[m].rear, `${m}: inicial apunta a una cara que no tiene`);
  }
  for (const [m, v] of entradas) if (v.inicial) assert.ok(['front', 'rear', 'foto'].includes(v.inicial) && v[v.inicial], `${m}: inicial «${v.inicial}» sin esa cara`);
  for (const m of ['Meraki MX75', 'Meraki MX85', 'Meraki MX95', 'Meraki MX105', 'Meraki MX67C', 'Meraki MX68CW', 'Cisco Secure Router C8455-G2-MX']) {
    assert.ok(VISTAS[m].foto, `${m}: sin la foto de producto de su ficha`);
  }
  // La foto de la ficha del MX67/MX68 lleva antenas: no va a los modelos sin radio, que llevan la de su
  // propia página de producto en cisco.com (2026-10-28, fuente/cisco-fotos-2026-10-28).
  for (const m of ['Meraki MX67', 'Meraki MX68']) {
    assert.ok(VISTAS[m].foto && VISTAS[m].foto !== VISTAS['Meraki MX67C'].foto, `${m}: sin foto propia o con la de antenas`);
    assert.match(VISTAS[m].fotoFuente, new RegExp(`imagen «Cisco Meraki ${m.split(' ')[1]} Security`), `${m}: la foto no nombra su modelo`);
  }
  assert.match(VISTAS['Cisco Secure Router C8355-G2-MX'].fotoFuente, /«8355-G2-MX secure router»/);
});

test('los ASR (fuera de venta) tienen figura: la vista de frente de la página de la serie y su foto (2026-10-28)', () => {
  for (const m of ['ASR 1001-X', 'ASR 1002-HX', 'ASR 1006-X']) {
    const v = VISTAS[m];
    assert.match(v.fuente, /comparativa de modelos, imagen «Cisco ASR 10\d\d-? ?[A-Z]+ model»/, `${m}: la frontal no cita su imagen`);
    assert.ok(v.foto && v.rearNota, `${m}: sin foto o sin decir por qué no hay trasera`);
  }
  assert.match(VISTAS['ASR 1001-X'].fotoFuente, /figura 2 «Cisco ASR 1001-X Router»/);
  assert.match(VISTAS['ASR 1002-HX'].fotoFuente, /figura 4 «Cisco ASR 1002-HX Router»/);
});
