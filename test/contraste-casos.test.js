'use strict';
// Los casos de contraste, comprobados SIN abrir un navegador.
//
// POR QUE EXISTE. `npm run contraste -- --todos` corre en CI dentro del job de pantallas, que
// tarda minutos: instalar Chromium, arrancar el servidor en modo producción, entrar por el
// muro. Un caso mal formado —sin `leer`, con `claves` que su `leer` no devuelve, o con una
// línea base a la que le falta un campo declarado— haría fallar ese job por algo que se ve
// leyendo el archivo. Esto lo frena en `npm run verificar`, que corre en cada push y tarda
// segundos. Es la misma idea que `test/pantallas-campos.test.js`: parsear en vez de ejecutar
// cuando ejecutar es caro.
//
// Lo que NO garantiza: que la línea base sea correcta. Eso solo lo dice conducir la pantalla.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, '..', 'scripts', 'contrastes');
const nombres = fs.readdirSync(DIR).filter((f) => f.endsWith('.js')).map((f) => f.replace(/\.js$/, ''));

test('hay al menos un caso declarado', () => {
  // Si alguien vacía el directorio, `--todos` pasaría en verde sin comprobar nada — un
  // conjunto inerte se porta igual que uno que funciona (CISCO_EOL_MODELS).
  assert.ok(nombres.length > 0, 'scripts/contrastes/ no puede quedarse vacío');
});

for (const nombre of nombres) {
  test(`el caso «${nombre}» declara todo lo que el arnés necesita`, () => {
    const c = require(path.join(DIR, nombre));
    for (const campo of ['nombre', 'pagina', 'claves', 'baseLinea', 'preparar', 'leer']) {
      assert.ok(c[campo] != null, `le falta \`${campo}\``);
    }
    assert.ok(typeof c.preparar === 'function' && typeof c.leer === 'function');
    assert.ok(Array.isArray(c.claves) && c.claves.length, '`claves` no puede estar vacío');
    assert.ok(Array.isArray(c.baseLinea) && c.baseLinea.length, '`baseLinea` no puede estar vacía');
    assert.match(c.pagina, /\.html$/, '`pagina` es una ruta de pantalla');
  });

  test(`el caso «${nombre}» conduce una pantalla que existe`, () => {
    // Anclar en un archivo que ya no está es el fallo del 2026-09-13 con `#bw`, una capa más
    // arriba: el caso fallaría en CI con un 404 en vez de decir que la pantalla se renombró.
    const c = require(path.join(DIR, nombre));
    assert.ok(fs.existsSync(path.join(__dirname, '..', 'public', c.pagina)),
      `public/${c.pagina} no existe`);
  });

  test(`la línea base de «${nombre}» declara todos los campos que se comparan`, () => {
    // El arnés compara SOLO las `claves`. Un escenario al que le falte una está diciendo
    // «no se midió», y comparar contra `undefined` convierte el contraste en ruido.
    const c = require(path.join(DIR, nombre));
    for (const esc of c.baseLinea) {
      assert.ok(esc.n, 'cada escenario necesita un nombre para el informe');
      for (const k of c.claves) {
        assert.ok(esc[k] !== undefined, `«${esc.n}» no declara \`${k}\``);
      }
    }
  });

  test(`la línea base de «${nombre}» dice de cuándo es`, () => {
    // Procedencia, no adorno: una referencia medida hace meses sigue pasando en verde y ya no
    // quiere decir lo mismo. Misma regla que la fecha de cada fuente del catálogo.
    const c = require(path.join(DIR, nombre));
    assert.ok(c.medidoEn && c.medidoEn.commit && c.medidoEn.fecha,
      'falta `medidoEn: {commit, fecha}`');
    assert.match(c.medidoEn.fecha, /^\d{4}-\d{2}-\d{2}$/);
  });
}
