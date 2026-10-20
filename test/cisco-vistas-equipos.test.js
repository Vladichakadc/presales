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
const { MODELS } = require('../server/seed/legacyData/cisco.js');
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
const SIN_FIGURA = new Set([
  'Cisco Secure Router C8221-G2', 'Cisco Secure Router C8231-E-G2', // la ficha no publica la suya
  'ISR 1111-8P', 'ISR 1116-4P', 'ISR 1121X-8P', 'ISR 1161X-8P',      // la ficha dibuja otras variantes
  'ASR 1001-X', 'ASR 1002-HX', 'ASR 1006-X',                         // fuera de venta
]);

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
      assert.match(pie, /figura \d+|Panel|panel|product_image/, `${modelo}: el pie no dice qué figura es («${pie}»)`);
    }
  }
});

test('cada modelo con figura está en el catálogo y los que no la tienen están declarados', () => {
  const ids = new Set(MODELS.map((m) => m.id));
  for (const [modelo] of entradas) assert.ok(ids.has(modelo), `${modelo} tiene figura pero no está en el catálogo`);
  for (const m of MODELS) {
    if (SIN_FIGURA.has(m.id)) { assert.ok(!VISTAS[m.id], `${m.id}: declarado sin figura y la tiene`); continue; }
    assert.ok(VISTAS[m.id] && VISTAS[m.id].front, `${m.id}: sin figura frontal y no está declarado como tal`);
  }
});

test('frontal y trasera: la que falta, la pestaña la explica', () => {
  for (const [modelo, v] of entradas) {
    if (v.front && !v.rear) assert.ok(v.rearNota && v.rearNota.length > 30, `${modelo}: sin trasera y sin decir por qué`);
    if (v.rear) assert.ok(!v.rearNota, `${modelo}: tiene trasera y además una nota de que no la tiene`);
  }
  const g2 = MODELS.filter((m) => /Secure Router|Meraki/.test(m.ser) && VISTAS[m.id]);
  const conDos = g2.filter((m) => VISTAS[m.id].rear).length;
  assert.ok(conDos >= 20, `solo ${conDos} equipos G2/Meraki con las dos caras`);
});

test('cada figura tiene su vista previa: con pérdida, de 1.200 px como mucho y del mismo dibujo', () => {
  for (const [modelo, v] of entradas) {
    for (const cara of ['front', 'rear']) {
      if (!v[cara]) { assert.ok(!v[cara + 'Prev'], `${modelo}: previa de una cara que no tiene`); continue; }
      assert.strictEqual(v[cara + 'Prev'], v[cara].replace(/\.webp$/, '.prev.webp'));
      const buf = fs.readFileSync(path.join(RAIZ, 'public', v[cara + 'Prev']));
      assert.ok(buf.includes(Buffer.from('VP8 ')), `${modelo}: la previa de ${cara} no es con pérdida`);
      const [w, h] = lienzoConPerdida(buf);
      const [W, H] = lienzo(fs.readFileSync(path.join(RAIZ, 'public', v[cara])));
      assert.ok(w <= 1200, `${modelo}: previa de ${w} px de ancho`);
      assert.ok(Math.abs(h - w * H / W) <= 1, `${modelo}: la previa de ${cara} (${w} × ${h}) no tiene las proporciones de su original (${W} × ${H})`);
    }
  }
});

test('no hay figuras huérfanas: todo cs-*.webp lo usa algún modelo', () => {
  const usadas = new Set(entradas.flatMap(([, v]) => [v.front, v.rear, v.frontPrev, v.rearPrev].filter(Boolean))
    .map((r) => path.basename(r)));
  const enDisco = fs.readdirSync(path.join(RAIZ, 'public/img/equipos')).filter((f) => f.startsWith('cs-') && f.endsWith('.webp'));
  const huerfanas = enDisco.filter((f) => !usadas.has(f));
  assert.deepStrictEqual(huerfanas, [], `figuras sin modelo: ${huerfanas.join(', ')}`);
});
