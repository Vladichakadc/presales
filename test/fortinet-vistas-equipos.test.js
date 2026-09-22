'use strict';
// FOTOS OFICIALES DEL DIMENSIONADOR FORTINET (2026-09-22, petición del dueño: «debe traer
// las fotos de la parte frontal y trasera de los equipos tal como está en Aruba»).
//
// QUÉ GUARDA ESTA PRUEBA, Y POR QUÉ ESTAS AFIRMACIONES Y NO OTRAS. Un mapa de fotos se pudre
// de tres maneras, y las tres han pasado ya en este repositorio con otros datos:
//   1. apunta a un fichero que no está (el enlace roto presentado como procedencia que
//      `fuentesSubidas.eliminar()` existe para evitar);
//   2. nombra un modelo que el catálogo ya no tiene (la forma de `CISCO_EOL_MODELS`);
//   3. pierde la procedencia y se queda una foto sin decir de dónde salió.
// Ninguna de las tres se ve leyendo el JSON por encima, y las tres cambian lo que un
// preventa le enseña a un cliente.
//
// LO QUE NO SE AFIRMA AQUÍ: cuántos modelos tienen foto. Ese número sube en cuanto alguien
// traiga los datasheets que faltan, y una prueba que lo fije en 54 se pondría roja por una
// mejora — que es como se enseña a la gente a ignorar un rojo.

const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..');
const VISTAS = JSON.parse(fs.readFileSync(path.join(RAIZ, 'public/data/fortinet-vistas-equipos.json'), 'utf8'));
const { MODELS } = require('../server/seed/legacyData/fortinet.js');

const entradas = Object.entries(VISTAS).filter(([k]) => !k.startsWith('_'));

test('cada foto declarada existe de verdad en el repositorio', () => {
  for (const [modelo, v] of entradas) {
    for (const cara of ['front', 'rear']) {
      if (!v[cara]) continue;
      assert.ok(v[cara].startsWith('/img/equipos/'), `${modelo}: ${cara} fuera de /img/equipos/`);
      const fichero = path.join(RAIZ, 'public', v[cara]);
      assert.ok(fs.existsSync(fichero), `${modelo}: ${v[cara]} no existe — un enlace roto presentado como foto oficial`);
      assert.ok(fs.statSync(fichero).size > 1024, `${modelo}: ${v[cara]} está vacío o es un stub`);
    }
  }
});

test('cada modelo con foto existe en el catálogo, y ninguno se queda huérfano', () => {
  const ids = new Set(MODELS.map((m) => m.id));
  for (const [modelo] of entradas) {
    assert.ok(ids.has(modelo), `${modelo} tiene foto pero ya no está en el catálogo — la forma de CISCO_EOL_MODELS`);
  }
});

test('cada foto declara su procedencia: de qué documento salió', () => {
  for (const [modelo, v] of entradas) {
    assert.ok(v.fuente && v.fuente.length > 15,
      `${modelo} no declara de qué documento salió su foto`);
    assert.match(v.fuente, /Datasheet/i, `${modelo}: la procedencia no nombra el documento`);
  }
});

test('el bloque _procedencia declara el hueco de la vista trasera y por qué existe', () => {
  const p = VISTAS._procedencia;
  assert.ok(p && p.length > 400, 'sin bloque de procedencia general');
  // Las tres cosas que alguien necesita saber antes de usar estas fotos delante de un
  // cliente, y que se olvidan justo cuando el fichero lleva meses sin tocarse.
  assert.match(p, /SOLO HAY VISTA FRONTAL/, 'no declara que no hay vista trasera');
  assert.match(p, /28 datasheets/, 'no dice sobre cuántos documentos se comprobó');
  assert.match(p, /403 a fortinet\.com/, 'no declara el bloqueo de egreso que obligó al transporte');
});

test('ningún modelo sin foto aparece en el mapa con una foto vacía', () => {
  // Un `front: null` se leería como «tiene entrada, luego tiene foto» en cualquier
  // comprobación por presencia de clave. Si un modelo no tiene foto, NO tiene entrada: la
  // ficha declara el hueco por su cuenta.
  for (const [modelo, v] of entradas) {
    assert.ok(v.front, `${modelo} tiene entrada sin foto — o tiene foto o no está en el mapa`);
  }
});

test('las variantes con SSD comparten la foto de su serie, y el pie dice cuál se fotografió', () => {
  // Fortinet fotografía con frecuencia la variante con SSD (el datasheet de la serie 1000F
  // retrata un 1001F). Servirla a las dos es correcto -mismo chasis, un solo datasheet- pero
  // solo si el pie lo DICE: es la diferencia entre compartir una figura oficial y enseñar la
  // foto de otro equipo.
  const pares = [['FortiGate 1000F', 'FortiGate 1001F'], ['FortiGate 4800F', 'FortiGate 4801F'],
    ['FortiGate 200G', 'FortiGate 201G'], ['FortiGate 400G', 'FortiGate 401G']];
  for (const [base, ssd] of pares) {
    assert.ok(VISTAS[base] && VISTAS[ssd], `falta ${base} o ${ssd}`);
    assert.strictEqual(VISTAS[base].front, VISTAS[ssd].front,
      `${base} y ${ssd} son el mismo chasis: comparten la figura del datasheet`);
    assert.match(VISTAS[base].fuente, /unidad fotografiada/,
      `${base}: el pie no dice qué unidad retrata la foto`);
  }
});

test('el 70F declara que la foto es de un 71F — la trampa que el catálogo ya documentaba', () => {
  // `fortigate-70f-series.pdf` retrata un 71F. La cabecera de fortinet.js documenta esa
  // trampa para las CIFRAS; aquí vale para la foto, y se resuelve diciéndolo en el pie en
  // vez de creerle al nombre del archivo.
  assert.match(VISTAS['FortiGate 70F'].fuente, /71F/,
    'el 70F muestra la foto de un 71F y tiene que decirlo');
});

test('no hay fotos huérfanas: todo fichero fg-*.webp lo usa algún modelo', () => {
  const dir = path.join(RAIZ, 'public/img/equipos');
  const enDisco = fs.readdirSync(dir).filter((f) => f.startsWith('fg-') && f.endsWith('.webp'));
  const usadas = new Set(entradas.flatMap(([, v]) => [v.front, v.rear].filter(Boolean))
    .map((r) => path.basename(r)));
  for (const f of enDisco) {
    assert.ok(usadas.has(f), `${f} está en el repositorio y no lo usa ningún modelo — peso muerto`);
  }
});
