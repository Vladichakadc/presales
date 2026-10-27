'use strict';
// LEYENDAS DE LAS FIGURAS DE CISCO (2026-10-27, petición del dueño: «al ampliar la imagen deberá
// mostrar la tabla donde se indica a qué hace referencia cada puerto con su número»).
//
// Las figuras oficiales de Cisco llevan números y la tabla que los explica está en el documento.
// Lo que se vigila:
//   1. Una leyenda está completa: números del 1 al último, sin saltos ni repetidos, cada uno con
//      su rótulo literal y su traducción. Una tabla a medias diría que el número que falta no es nada.
//   2. Va con su figura: solo en la cara que existe, y dice de qué tabla o leyenda sale.
//   3. Una misma figura dicha por el mismo documento lleva la misma leyenda en todos los modelos que
//      la comparten (la de un hermano no se «arregla» en uno solo).
//   4. Las figuras con números la tienen y las que no los tienen no: el inventario se miró figura a
//      figura el 2026-10-27 (las de Meraki y las fotos de producto de las fichas del Catalyst 8500
//      y del ISR 1111X-8P no llevan números). Una figura nueva tiene que decidirse aquí.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..');
const VISTAS = JSON.parse(fs.readFileSync(path.join(RAIZ, 'public/data/cisco-vistas-equipos.json'), 'utf8'));
const entradas = Object.entries(VISTAS).filter(([k]) => !k.startsWith('_'));
const CARAS = ['front', 'rear'];

// Figuras SIN números, miradas una a una: no llevan leyenda.
const SIN_NUMEROS = new Set([
  'cs-c8111-g2-mx-front', 'cs-c8111-g2-mx-rear', 'cs-c8121-g2-mx-front', 'cs-c8121-g2-mx-rear',
  'cs-c8355-g2-mx-front', 'cs-c8355-g2-mx-rear', 'cs-c8455-g2-mx-front', 'cs-c8455-g2-mx-rear',
  'cs-mx67-front', 'cs-mx67-rear', 'cs-mx67c-rear', 'cs-mx68-front', 'cs-mx68-rear', 'cs-mx68cw-rear',
  'cs-mx75-front', 'cs-mx75-rear', 'cs-mx85-front', 'cs-mx85-rear', 'cs-mx95-mx105-front', 'cs-mx95-rear',
  'cs-mx105-rear', 'cs-mx250-front', 'cs-mx250-mx450-rear', 'cs-mx450-front',
  'cs-c8500-12x4qc-front', 'cs-c8500-12x-front', 'cs-c8500-20x6c-front', 'cs-c8500l-8s4x-front',
  'cs-isr1111x-8p-front',
]);
const nombre = (ruta) => path.basename(ruta, '.webp');

test('cada leyenda está completa: del 1 al último, con rótulo literal y traducción', () => {
  for (const [modelo, v] of entradas) {
    for (const cara of CARAS) {
      const ley = v[cara + 'Leyenda'];
      if (!ley) continue;
      assert.ok(v[cara], `${modelo}: leyenda de la cara ${cara}, que no tiene figura`);
      assert.ok(typeof ley.tabla === 'string' && /tabla \d+|leyenda de la figura \d+/.test(ley.tabla),
        `${modelo}: la leyenda ${cara} no dice de qué tabla sale («${ley.tabla}»)`);
      assert.ok(Array.isArray(ley.filas) && ley.filas.length > 0, `${modelo}: leyenda ${cara} vacía`);
      ley.filas.forEach((f, i) => {
        assert.ok(Array.isArray(f) && f.length === 3, `${modelo}: fila ${i + 1} de ${cara} sin [n, literal, traducción]`);
        assert.strictEqual(f[0], i + 1, `${modelo}: la leyenda ${cara} salta del ${i} al ${f[0]}`);
        assert.ok(typeof f[1] === 'string' && f[1].trim() === f[1] && f[1].length > 1, `${modelo}: número ${f[0]} sin rótulo literal`);
        assert.ok(typeof f[2] === 'string' && f[2].trim() && !/[«»]/.test(f[2]), `${modelo}: número ${f[0]} sin traducción`);
      });
    }
  }
});

test('una misma figura del mismo documento lleva la misma leyenda en todos sus modelos', () => {
  const vistas = new Map();
  for (const [modelo, v] of entradas) {
    for (const cara of CARAS) {
      const ley = v[cara + 'Leyenda'];
      if (!ley) continue;
      // La trasera de los 8500 de 1RU es un solo dibujo que dos guías rotulan distinto: la clave
      // lleva la tabla, que nombra la guía cuando difiere.
      const clave = `${v[cara]}|${ley.tabla}`;
      const otra = vistas.get(clave);
      if (otra) assert.deepStrictEqual(ley.filas, otra.filas, `${modelo}: ${cara} difiere de ${otra.modelo} con la misma figura y tabla`);
      else vistas.set(clave, { modelo, filas: ley.filas });
    }
  }
});

test('las figuras con números llevan leyenda y las que no los tienen, no', () => {
  for (const [modelo, v] of entradas) {
    for (const cara of CARAS) {
      if (!v[cara]) continue;
      const sin = SIN_NUMEROS.has(nombre(v[cara]));
      if (sin) assert.ok(!v[cara + 'Leyenda'], `${modelo}: ${nombre(v[cara])} no lleva números y tiene leyenda`);
      else assert.ok(v[cara + 'Leyenda'], `${modelo}: ${nombre(v[cara])} lleva números y no tiene leyenda (o es nueva: decidir aquí)`);
    }
  }
});

test('la procedencia de las leyendas está declarada en el mapa', () => {
  assert.match(VISTAS._leyendas || '', /frontLeyenda y rearLeyenda/);
});

test('la lupa pinta la leyenda de la cara que enseña y la tarjeta la ofrece', () => {
  const ficha = fs.readFileSync(path.join(RAIZ, 'public/js/ficha.js'), 'utf8');
  assert.match(ficha, /leyendas: \{ front: leyendaDe\(fig\.dataset, 'front'\), rear: leyendaDe\(fig\.dataset, 'rear'\) \}/);
  assert.match(ficha, /const ley = d\.leyendas && d\.leyendas\[d\.cual\];/);
  assert.match(ficha, /class="ficha-vista-leyenda"/);
});
