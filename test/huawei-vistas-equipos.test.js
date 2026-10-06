'use strict';
// FIGURAS OFICIALES DEL DIMENSIONADOR HUAWEI (2026-10-06, petición del dueño: «sube la gráfica
// de los equipos al dimensionador de Huawei tal cual como está en Aruba y Fortinet»).
//
// Lo mismo que guarda `fortinet-vistas-equipos.test.js`, porque un mapa de figuras se pudre
// igual en cualquier fabricante: una ruta a un fichero que no está, un modelo que el catálogo
// ya no tiene, una figura sin procedencia. Y tres cosas propias de Huawei, que son las
// decisiones que se tomaron leyendo los documentos y que alguien podría «simplificar»:
//   1. qué cara es cada una se decidió con el ancla de Huawei («ports on the front panel»), no
//      con la de Fortinet, y los AR610 son el único documento con dos vistas por modelo;
//   2. las NetEngine 8000 y las A800 E publican varias variantes de alimentación de la misma
//      cara, y el pie tiene que decir cuál se sirve;
//   3. el AR8140 y el AR8140-T comparten la MISMA figura en su ficha, y se dice.
//
// LO QUE NO SE AFIRMA: cuántos modelos tienen figura. Hoy son los 40 (desde la tarde del
// 2026-10-06), pero un modelo nuevo entrará sin ella hasta que alguien traiga su ficha, y una
// prueba que lo fijara se pondría roja por un alta legítima.

const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..');
const VISTAS = JSON.parse(fs.readFileSync(path.join(RAIZ, 'public/data/huawei-vistas-equipos.json'), 'utf8'));
const { MODELS } = require('../server/seed/legacyData/huawei.js');

const entradas = Object.entries(VISTAS).filter(([k]) => !k.startsWith('_'));

test('cada figura declarada existe de verdad en el repositorio', () => {
  for (const [modelo, v] of entradas) {
    for (const cara of ['front', 'rear']) {
      if (!v[cara]) continue;
      assert.match(v[cara], /^\/img\/equipos\/hw-[a-z0-9-]+-(front|rear)\.webp$/, `${modelo}: ${cara} fuera del patrón hw-*.webp`);
      const fichero = path.join(RAIZ, 'public', v[cara]);
      assert.ok(fs.existsSync(fichero), `${modelo}: ${v[cara]} no existe — un enlace roto presentado como figura oficial`);
      assert.ok(fs.statSync(fichero).size > 1024, `${modelo}: ${v[cara]} está vacío o es un stub`);
      // Un WebP de verdad, no un PNG o un HTML con otra extensión.
      const cab = fs.readFileSync(fichero).subarray(0, 12).toString('latin1');
      assert.ok(cab.startsWith('RIFF') && cab.endsWith('WEBP'), `${modelo}: ${v[cara]} no es un WebP`);
    }
  }
});

test('cada figura es WebP SIN pérdida: los píxeles del documento, sin segunda generación (2026-10-06)', () => {
  // Las fichas traen las figuras en JPEG. Guardarlas en WebP con pérdida era una segunda
  // pérdida sobre la primera: medido contra el original, de 32 a 44 dB de PSNR, con los rótulos
  // de los puertos de la AR5710-S8T2S emborronados. Un WebP sin pérdida lleva el bloque `VP8L`
  // (directo o dentro de un `VP8X`); uno con pérdida, `VP8 `.
  for (const [modelo, v] of entradas) {
    for (const cara of ['front', 'rear']) {
      if (!v[cara]) continue;
      const buf = fs.readFileSync(path.join(RAIZ, 'public', v[cara]));
      assert.ok(buf.includes(Buffer.from('VP8L')) && !buf.includes(Buffer.from('VP8 ')),
        `${modelo}: ${v[cara]} está guardado con pérdida — regenerarlo sin pérdida desde su documento`);
    }
  }
});

test('el F8 sirve el dibujo de su ficha de 2023, al doble de resolución que la de 2025', () => {
  // Las dos fichas oficiales publican el mismo dibujo de la variante AC (reducido, correlaciona
  // 0,975): la de 2025 a 296 px y la de 2023 a 620. La figura no cambia de equipo, gana detalle.
  const v = VISTAS['NE8000 F8'];
  const buf = fs.readFileSync(path.join(RAIZ, 'public', v.front));
  // Ancho y alto del lienzo de un WebP sin pérdida: 14 bits cada uno, tras la firma 0x2f.
  const i = buf.indexOf(Buffer.from('VP8L')) + 8;
  assert.strictEqual(buf[i], 0x2f);
  const bits = buf.readUInt32LE(i + 1);
  assert.deepStrictEqual([(bits & 0x3fff) + 1, ((bits >> 14) & 0x3fff) + 1], [620, 767]);
  assert.match(v.fuente, /Service Router \(marzo de 2023\), p\. 1 — «NetEngine 8000 F8 service router»/);
  assert.match(v.fuente, /variante AC/);
});

test('cada modelo con figura existe en el catálogo', () => {
  const ids = new Set(MODELS.map((m) => m.id));
  for (const [modelo] of entradas) {
    assert.ok(ids.has(modelo), `${modelo} tiene figura pero ya no está en el catálogo — la forma de CISCO_EOL_MODELS`);
  }
});

test('ninguna entrada vacía: un modelo sin figura no está en el mapa', () => {
  for (const [modelo, v] of entradas) {
    assert.ok(v.front || v.rear, `${modelo} tiene entrada sin figura`);
    // Huawei publica siempre la cara de puertos: la ficha la sirve como frontal.
    assert.ok(v.front, `${modelo}: sin cara frontal, y el Excel solo lleva fotos con frontal`);
  }
});

test('cada figura cita su documento, la página y el rótulo literal, y trae el tamaño', () => {
  for (const [modelo, v] of entradas) {
    assert.match(v.fuente || '', /^(Data ?[Ss]heet|NetEngine) .+, (p\.|diapositiva) \d+ — «[^»]{6,}»\. \S/,
      `${modelo}: la procedencia no dice documento, página y rótulo («${v.fuente}»)`);
    assert.match(v.tamano || '', /\d+(,\d+)? × \d+(,\d+)? × \d+(,\d+)? mm/, `${modelo}: falta el tamaño`);
  }
});

test('el rótulo citado nombra al propio modelo, no a un hermano de serie', () => {
  // La clave del catálogo y el rótulo del documento se escriben distinto («NE8000 M8» frente a
  // «NetEngine 8000 M8 (DC)», «NetEngine A813 E» frente a «NetEngine A813E»): se comparan sin
  // espacios, sin el prefijo de la línea y sin lo que va entre paréntesis.
  // Igualdad exacta y no prefijo: con un prefijo, «AR5710-S8T2X» casaría con el rótulo del
  // «AR5710-S8T2XE», el ancla-subcadena que este repositorio ya pagó dos veces.
  // La ficha de 2023 del F8 rotula «NetEngine 8000 F8 service router», en minúscula.
  const clave = (s) => s.replace(/\(.*?\)|（.*?）/g, '').replace(/\s*service router/i, '').replace(/NetEngine|NE|Router/g, '').replace(/[\s*]/g, '').toLowerCase();
  for (const [modelo, v] of entradas) {
    const rotulo = (v.fuente.match(/«([^»]+)»/) || [])[1] || '';
    const nombres = rotulo.split(' / ').map(clave);
    assert.ok(nombres.some((n) => n === clave(modelo)),
      `${modelo}: el rótulo citado («${rotulo}») no nombra este modelo`);
  }
});

test('los AR610 publican dos vistas y la trasera es la de la toma de alimentación', () => {
  for (const m of ['AR611', 'AR617VW-LTE4']) {
    const v = VISTAS[m];
    assert.ok(v && v.front && v.rear, `${m}: su ficha publica las dos caras`);
    assert.match(v.fuente, /trasera es la que lleva la toma de alimentación|Trasera: la de la toma/,
      `${m}: no dice con qué se decidió qué cara es la trasera`);
  }
  // La celda del AR617VW-LTE4 es común con el -LTE4EA: tiene que decirlo.
  assert.match(VISTAS['AR617VW-LTE4'].fuente, /LTE4EA/);
});

test('las variantes de alimentación se nombran: DC en las NetEngine 8000, una fuente AC en las A800 E', () => {
  for (const [modelo, v] of entradas) {
    if (/^NE8000 [MF]/.test(modelo)) {
      // La DC, salvo el F8, que sirve la AC porque es la que existe a más resolución
      // (2026-10-06): sea cual sea, el pie dice cuál dibuja y que el documento trae la otra.
      const m = /variante (DC|AC)/.exec(v.fuente);
      assert.ok(m, `${modelo}: no dice qué variante dibuja`);
      const otra = m[1] === 'DC' ? 'AC' : 'DC';
      assert.match(v.fuente, new RegExp('también la ' + otra), `${modelo}: no dice que el documento trae también la ${otra}`);
      if (modelo !== 'NE8000 F8') assert.strictEqual(m[1], 'DC', `${modelo}: se sirve la DC`);
    }
    if (/^NetEngine A8\d\d E$/.test(modelo)) {
      assert.match(v.fuente, /una fuente AC/, `${modelo}: no dice qué variante dibuja`);
      assert.match(v.fuente, /doble AC/, `${modelo}: no nombra las otras variantes`);
    }
  }
});

test('el AR8140 y el AR8140-T comparten un solo archivo, y los dos pies lo dicen', () => {
  const a = VISTAS['AR8140-12G10XG'], b = VISTAS['AR8140-T-12G10XG'];
  assert.ok(a && b);
  assert.strictEqual(a.front, b.front, 'el documento usa la misma figura: un solo archivo');
  for (const v of [a, b]) assert.match(v.fuente, /MISMA figura/);
});

test('no hay figuras huérfanas: todo hw-*.webp lo usa algún modelo', () => {
  const dir = path.join(RAIZ, 'public/img/equipos');
  const enDisco = fs.readdirSync(dir).filter((f) => f.startsWith('hw-') && f.endsWith('.webp'));
  const usadas = new Set(entradas.flatMap(([, v]) => [v.front, v.rear].filter(Boolean)).map((r) => path.basename(r)));
  for (const f of enDisco) assert.ok(usadas.has(f), `${f} está en el repositorio y no lo usa ningún modelo`);
});

test('el bloque _procedencia declara el transporte, el ancla de las caras y los huecos', () => {
  const p = VISTAS._procedencia;
  assert.ok(p && p.length > 600, 'sin bloque de procedencia general');
  assert.match(p, /403/, 'no declara el bloqueo de egreso que obligó al transporte');
  assert.match(p, /fuente\/cisco-huawei/, 'no dice por qué rama llegaron los documentos');
  assert.match(p, /ANCLA/, 'no explica con qué se decidió qué cara es cada una');
  assert.match(p, /on the front panel/, 'no cita la frase de Huawei que hace de ancla');
  assert.match(p, /NATIVA/, 'no dice que las figuras van a la resolución del documento');
  // Los modelos que se quedan sin figura se nombran: el hueco es un dato.
  const sin = MODELS.filter((m) => !VISTAS[m.id]);
  for (const m of sin) {
    const corto = m.id.replace(/^NE8000 /, '').replace(/^AR6710-L.*/, 'AR6710-L');
    assert.ok(p.includes(corto), `${m.id} no tiene figura y la procedencia no lo declara`);
  }
});

test('la página de Huawei carga el mapa, lo pasa a la ficha y lo manda al Excel', () => {
  const pag = fs.readFileSync(path.join(RAIZ, 'public/js/dimensionador-huawei-netengine.js'), 'utf8');
  assert.ok(pag.includes("fetch('/data/huawei-vistas-equipos.json')"), 'la página no carga el mapa de figuras');
  assert.match(pag, /vistas: VISTAS/, 'la página no pasa las figuras a FICHA.render');
  assert.match(pag, /fotos:\{modelo:m\.id, front:v\.front, rear:v\.rear \|\| null/, 'el Excel del BOM no lleva las fotos');
});
