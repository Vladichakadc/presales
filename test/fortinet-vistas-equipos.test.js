'use strict';
// FIGURAS OFICIALES DEL DIMENSIONADOR FORTINET (2026-09-22, petición del dueño: «debe traer
// las fotos de la parte frontal y trasera de los equipos tal como está en Aruba»; y, cuando la
// primera entrega dijo que Fortinet no publicaba la trasera, su corrección: «sí hay evidencia
// que existe las imágenes de la parte trasera». La tenía: está en la página 7 de los 28
// documentos, y la primera revisión solo había mirado la portada).
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

test('cada figura declara su procedencia: de qué documento y de qué figura salió', () => {
  for (const [modelo, v] of entradas) {
    assert.ok(v.fuente && v.fuente.length > 15,
      `${modelo} no declara de qué documento salió su figura`);
    // Casi todas salen de la página 7 «Hardware» del datasheet por serie. Las de los cuatro
    // que no lo tienen (2026-09-24) salen de la guía oficial de hardware, y entonces el pie
    // tiene que nombrar esa guía, la página y el rótulo literal de la figura.
    if (/^Datasheet/.test(v.fuente)) {
      assert.match(v.fuente, /p\. 7 «Hardware»/, `${modelo}: no dice de qué página del datasheet sale`);
    } else {
      assert.match(v.fuente, /(QuickStart Guide|System Guide) .*docs\.fortinet\.com/,
        `${modelo}: la procedencia no nombra ni un datasheet ni una guía oficial de hardware`);
      assert.match(v.fuente, /p\. \d+ «[^»]{8,}»/, `${modelo}: no cita la página y el rótulo literal de la figura`);
    }
  }
});

test('los cuatro datasheets que ROTULAN las caras dan modelo con frontal y trasera', () => {
  // Ancla del reparto de caras: 400F, 400G, 700G y 900G escriben «Front Panel» y «Rear Panel»
  // literalmente. Si una de esas cuatro perdiera una cara, el ancla con la que se resolvieron
  // los otros 24 documentos habría dejado de existir y nadie se enteraría.
  for (const m of ['FortiGate 400F', 'FortiGate 400G', 'FortiGate 700G', 'FortiGate 900G']) {
    const v = VISTAS[m];
    assert.ok(v && v.front && v.rear, `${m} tiene que traer las dos caras: su datasheet las rotula`);
    assert.match(v.fuente, /Front Panel/, `${m}: la procedencia no cita la figura frontal rotulada`);
    assert.match(v.fuente, /Rear Panel/, `${m}: la procedencia no cita la figura trasera rotulada`);
  }
});

test('el 80F entra con trasera y SIN frontal, y lo dice', () => {
  // Su datasheet publica una sola figura del 80F/81F -la cara de conectores-; las dos que
  // traen frontal son de las variantes DSL y PoE, que son otro producto. Servirle aquella
  // sería la figura de otro equipo, que es lo que este catálogo prohíbe.
  const v = VISTAS['FortiGate 80F'];
  assert.ok(v && v.rear && !v.front, 'el 80F tiene que entrar solo con la cara trasera');
  assert.match(v.fuente, /NO publica vista frontal/,
    'el 80F no declara que el documento no trae frontal');
});

test('400F y 900G declaran que el documento trae ADEMÁS la trasera de la variante DC', () => {
  for (const m of ['FortiGate 400F', 'FortiGate 900G']) {
    assert.match(VISTAS[m].fuente, /variante DC/,
      `${m}: se sirve la trasera AC y no se dice que existe la DC`);
  }
});

test('el bloque _procedencia declara el hueco de la vista trasera y por qué existe', () => {
  const p = VISTAS._procedencia;
  assert.ok(p && p.length > 400, 'sin bloque de procedencia general');
  // Las tres cosas que alguien necesita saber antes de usar estas fotos delante de un
  // cliente, y que se olvidan justo cuando el fichero lleva meses sin tocarse.
  assert.match(p, /pagina 7|página 7/, 'no dice de qué página del datasheet salen las figuras');
  assert.match(p, /403 a fortinet\.com/, 'no declara el bloqueo de egreso que obligó al transporte');
  // La corrección tiene que quedar escrita, no solo aplicada: quien lea este fichero dentro de
  // seis meses necesita saber que la revisión anterior afirmó lo contrario y por qué se
  // equivocó -miró la portada-, o repetirá el mismo atajo.
  assert.match(p, /FALSO|falso/, 'no declara que la revisión anterior afirmó lo contrario');
  assert.match(p, /ANCLA|ancla/, 'no explica con qué se decidió la cara en los que no la rotulan');
});

test('ningún modelo sin figura aparece en el mapa con una entrada vacía', () => {
  // Un `front: null` se leería como «tiene entrada, luego tiene figura» en cualquier
  // comprobación por presencia de clave. Si un modelo no tiene ninguna cara, NO tiene
  // entrada: la ficha declara el hueco por su cuenta.
  for (const [modelo, v] of entradas) {
    assert.ok(v.front || v.rear, `${modelo} tiene entrada sin figura — o tiene una cara o no está en el mapa`);
  }
});

test('las variantes con SSD comparten la figura de su serie, y el pie dice cuál se dibujó', () => {
  // Un datasheet cubre la serie entera, así que la figura se sirve a las dos variantes
  // -mismo chasis- pero solo si el pie DICE cuál está dibujada: es la diferencia entre
  // compartir una figura oficial y enseñar la de otro equipo. El 400G y el 700G son los
  // casos que lo justifican: sus diagramas dibujan el 401G y el 701G, no el modelo base.
  const pares = [['FortiGate 1000F', 'FortiGate 1001F'], ['FortiGate 4800F', 'FortiGate 4801F'],
    ['FortiGate 200G', 'FortiGate 201G'], ['FortiGate 400G', 'FortiGate 401G']];
  for (const [base, ssd] of pares) {
    assert.ok(VISTAS[base] && VISTAS[ssd], `falta ${base} o ${ssd}`);
    for (const cara of ['front', 'rear']) {
      assert.strictEqual(VISTAS[base][cara], VISTAS[ssd][cara],
        `${base} y ${ssd} son el mismo chasis: comparten la figura ${cara} del datasheet`);
    }
    assert.match(VISTAS[base].fuente, /Unidad dibujada/,
      `${base}: el pie no dice qué unidad dibuja la figura`);
  }
});

test('el 70F declara que la figura es de un 71F — la trampa que el catálogo ya documentaba', () => {
  // `fortigate-70f-series.pdf` dibuja un 71F. La cabecera de fortinet.js documenta esa
  // trampa para las CIFRAS; aquí vale para la figura, y se resuelve diciéndolo en el pie en
  // vez de creerle al nombre del archivo.
  assert.match(VISTAS['FortiGate 70F'].fuente, /71F/,
    'el 70F muestra la figura de un 71F y tiene que decirlo');
});

test('no hay figuras huérfanas: todo fichero fg-*.webp lo usa algún modelo', () => {
  const dir = path.join(RAIZ, 'public/img/equipos');
  const enDisco = fs.readdirSync(dir).filter((f) => f.startsWith('fg-') && f.endsWith('.webp'));
  const usadas = new Set(entradas.flatMap(([, v]) => [v.front, v.rear].filter(Boolean))
    .map((r) => path.basename(r)));
  for (const f of enDisco) {
    assert.ok(usadas.has(f), `${f} está en el repositorio y no lo usa ningún modelo — peso muerto`);
  }
});

test('los cuatro sin datasheet (100F, 200F, 7081F y 7121F) tienen las dos caras y declaran la guía', () => {
  // Eran el hueco que la ficha declaraba desde el 2026-09-22. Sus figuras salen de las guías
  // oficiales de hardware, no de un datasheet, y la del 100F dibuja un 101F: si el pie dejara
  // de decirlo, se estaría enseñando otro equipo sin avisar.
  for (const m of ['FortiGate 100F', 'FortiGate 200F', 'FortiGate 7081F', 'FortiGate 7121F']) {
    const v = VISTAS[m];
    assert.ok(v && v.front && v.rear, `${m}: le falta una cara`);
    assert.doesNotMatch(v.fuente, /^Datasheet/, `${m}: no tiene datasheet por serie y el pie no puede decir que sale de uno`);
  }
  assert.match(VISTAS['FortiGate 100F'].fuente, /Unidad dibujada: FortiGate 101F/);
  assert.match(VISTAS['FortiGate 7121F'].fuente, /generacion 1/);
});
