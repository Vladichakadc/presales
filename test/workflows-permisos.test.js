'use strict';
// Los workflows que escriben en el repositorio o en sus issues (2026-10-02). Cuatro reglas que
// salieron de medir, no de un manual:
//   1. El job que ejecuta código de fuera (npm ci, Playwright, un navegador o lo que devuelve un
//      fabricante) no tiene permiso de escritura ni guarda el token: en un mismo job, un paso
//      anterior puede leer el token del siguiente. Y el que tiene el permiso no instala nada.
//   2. Ningún workflow intenta crear un PR desde Actions: en este repositorio GitHub no lo deja,
//      y así fallaron la vigía dos lunes seguidos y datasheets-aruba el 2026-09-02.
//   3. Lo que corren los jobs sin `npm ci` solo puede requerir módulos de Node o archivos del
//      repositorio.
//   4. Un `run:` de una sola línea no puede llevar «: » — YAML lo lee como un mapa y el
//      workflow entero deja de cargar. Pasó escribiendo estos mismos archivos.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..');
const DIR = path.join(RAIZ, '.github', 'workflows');

// Cada job de un workflow, por su texto y sin comentarios: «Sin `npm ci` a propósito» no es
// instalar nada.
function jobs(yml) {
  const texto = fs.readFileSync(path.join(DIR, yml), 'utf8').replace(/^\s*#.*\n/gm, '');
  const out = { cab: texto.slice(0, texto.indexOf('\njobs:')) };
  const partes = texto.slice(texto.indexOf('\njobs:')).split(/\n {2}(?=[a-z][\w-]*:\n)/);
  for (const p of partes.slice(1)) out[p.slice(0, p.indexOf(':'))] = p;
  return out;
}
const INSTALA = /npm (?:ci|install)|npx /;

// [workflow, job sin permisos que ejecuta código de fuera, job con permisos, permiso que lleva]
const SEPARADOS = [
  ['vigia-fuentes.yml', 'medir', 'publicar', /contents: write/],
  ['vigia-fuentes.yml', 'contrastar', 'publicar', /contents: write/],
  ['limites.yml', 'recorrer', 'informar', /issues: write/],
  ['aplicar-propuesta.yml', 'aplicar', 'publicar', /contents: write/],
  ['datasheets-aruba.yml', 'descargar', 'publicar', /contents: write/],
  ['sonda-produccion.yml', 'sondear', 'avisar', /issues: write/],
];

test('el job que ejecuta código de fuera no tiene escritura; el que la tiene no instala nada', () => {
  for (const [yml, abierto, privilegiado, permiso] of SEPARADOS) {
    const j = jobs(yml);
    assert.match(j.cab, /permissions:\n {2}contents: read\n/, `${yml}: el permiso por defecto es solo lectura`);
    assert.ok(j[abierto] && !/: write/.test(j[abierto]), `${yml} · ${abierto}: sin escritura`);
    assert.match(j[abierto], /persist-credentials: false/, `${yml} · ${abierto}: no guarda el token`);
    assert.ok(j[privilegiado] && permiso.test(j[privilegiado]), `${yml} · ${privilegiado}: lleva su permiso`);
    assert.ok(!INSTALA.test(j[privilegiado]), `${yml} · ${privilegiado}: no instala nada`);
    assert.match(j[privilegiado], new RegExp(`needs: (?:\\[[^\\]\\n]*\\b)?${abierto}\\b`), `${yml} · ${privilegiado}: va después de ${abierto}`);
  }
  // Los artefactos se bajan fuera del repositorio, para que no caigan sobre el checkout.
  for (const yml of ['vigia-fuentes.yml', 'aplicar-propuesta.yml', 'datasheets-aruba.yml']) {
    assert.match(jobs(yml).publicar, /path: \$\{\{ runner\.temp \}\}\//, `${yml}: el artefacto va a runner.temp`);
  }
  // Y la vigía escribe en el issue aunque algo falle: un rojo que no llega al issue no avisa.
  assert.ok((jobs('vigia-fuentes.yml').publicar.match(/if: \$\{\{ !cancelled\(\) \}\}/g) || []).length >= 2);
});

// EL JOB QUE INSTALA PARA LEER UN PDF DE FUERA (2026-10-14). `contrastar` de la vigía es el
// único de esa familia que necesita un paquete (pdf-parse): instala del lock, pero sin dejar que
// ninguna dependencia ejecute código al instalarse, y solo cuando hay algo que contrastar.
test('el contraste del Product Matrix instala sin scripts y solo cuando está pendiente', () => {
  const c = jobs('vigia-fuentes.yml').contrastar;
  const instala = c.match(/npm (?:ci|install)[^\n]*/g) || [];
  assert.deepStrictEqual(instala, ['npm ci --ignore-scripts']);
  assert.match(c, /if: \$\{\{ steps\.pendiente\.outputs\.pendiente == 'true' \}\}\n\s+run: npm ci --ignore-scripts/);
  assert.match(c, /path: \$\{\{ runner\.temp \}\}\/vigia/, 'lo medido va a runner.temp');
  // Y publicar no se cae si contrastar falla o no corre.
  assert.match(jobs('vigia-fuentes.yml').publicar, /needs: \[medir, contrastar\]\n\s+if: \$\{\{ !cancelled\(\) \}\}/);
});

test('ningún workflow intenta crear un PR desde Actions, y las ramas se empujan con el script compartido', () => {
  for (const yml of fs.readdirSync(DIR).filter((f) => f.endsWith('.yml'))) {
    const texto = fs.readFileSync(path.join(DIR, yml), 'utf8').replace(/^\s*#.*\n/gm, '');
    assert.ok(!/create-pull-request|pulls\.create|gh pr create/.test(texto), `${yml} intenta crear un PR`);
  }
  for (const yml of ['vigia-fuentes.yml', 'aplicar-propuesta.yml', 'datasheets-aruba.yml']) {
    const texto = fs.readFileSync(path.join(DIR, yml), 'utf8');
    assert.match(texto, /node scripts\/empujar-rama\.js --rama /, `${yml} empuja con scripts/empujar-rama.js`);
    assert.ok(!/git push/.test(texto.replace(/^\s*#.*\n/gm, '')), `${yml} no lleva su propio git push`);
  }
});

test('lo que corre en los jobs sin npm ci no necesita paquetes de npm', () => {
  const internos = new Set(require('module').builtinModules);
  // Puntos de entrada de cada job sin `npm ci`, y lo que cargan, recorrido entero. El
  // importador carga el catálogo del fabricante con una ruta calculada, así que esos módulos se
  // nombran a mano.
  const entradas = [
    'scripts/vigia-fuentes.js', 'scripts/vigia-publicar.js', 'test/e2e/limites-reglas.js', 'scripts/aviso-despliegue.js',
    'scripts/empujar-rama.js', 'scripts/publicar-datasheets.js', 'scripts/descargar-datasheets.js',
    'scripts/importar-propuesta.js', 'scripts/leer-propuesta.js',
    ...['huawei', 'cisco', 'fortinet', 'mikrotik', 'aruba', 'juniper', 'nokia'].map((v) => `server/seed/legacyData/${v}.js`),
  ];
  const vistos = new Set();
  const recorrer = (archivo) => {
    if (vistos.has(archivo)) return;
    vistos.add(archivo);
    const fuente = fs.readFileSync(archivo, 'utf8');
    for (const [, m] of fuente.matchAll(/require\(\s*['"]([^'"]+)['"]\s*\)/g)) {
      if (m.startsWith('.')) {
        const r = path.resolve(path.dirname(archivo), m);
        recorrer(fs.existsSync(r) && fs.statSync(r).isFile() ? r : `${r}.js`);
      } else {
        assert.ok(internos.has(m.replace(/^node:/, '')), `${path.relative(RAIZ, archivo)} requiere «${m}», que el job no tiene instalado`);
      }
    }
  };
  for (const e of entradas) recorrer(path.join(RAIZ, e));
  assert.ok(vistos.size >= entradas.length);
});

test('el job que publica una propuesta la vuelve a aplicar con el importador, no con el parche del otro', () => {
  const p = jobs('aplicar-propuesta.yml').publicar;
  assert.match(p, /node scripts\/importar-propuesta\.js "\$RUNNER_TEMP\/propuesta\.json" --aplicar/);
  assert.match(p, /cmp -s "\$RUNNER_TEMP\/publicado\.patch" "\$RUNNER_TEMP\/propuesta\/propuesta\.patch"/);
  assert.ok(!/git apply/.test(p), 'no aplica el parche que viene del job de npm ci');
  assert.ok(!/needs\.aplicar\.outputs\.vendor/.test(p), 'el fabricante lo lee él mismo, no de las salidas del otro job');
});

test('ningún run: de una sola línea lleva «: », que YAML leería como un mapa', () => {
  for (const yml of fs.readdirSync(DIR).filter((f) => f.endsWith('.yml'))) {
    const malas = fs.readFileSync(path.join(DIR, yml), 'utf8').split('\n')
      .filter((l) => /^\s+run: (?![|>])/.test(l) && /: /.test(l.replace(/^\s+run: /, '')));
    assert.deepStrictEqual(malas, [], `${yml}: ${malas.join(' | ')}`);
  }
});

// LAS RAMAS DE TRANSPORTE NO SE PISAN (2026-10-14). Un `git push --force` a una rama de nombre
// fijo borraba la descarga anterior: el 2026-10-13 la edición de octubre del Product Matrix
// pisó a la de septiembre y ya no hubo con qué compararla. Cada corrida deja su propia rama.
// `traer-cisco-huawei.yml` empuja a la rama que se le pasa (`rama`), que es la de la corrida.
test('ningún workflow empuja con --force a una rama de transporte de nombre fijo', () => {
  for (const yml of fs.readdirSync(DIR).filter((f) => f.endsWith('.yml'))) {
    const texto = fs.readFileSync(path.join(DIR, yml), 'utf8').replace(/^\s*#.*\n/gm, '');
    const fijas = texto.match(/git push --force[^\n]*\sfuente\/[\w-]+/g) || [];
    assert.deepStrictEqual(fijas, [], `${yml} pisa una rama fija`);
  }
  for (const yml of ['traer-fortinet-matrix.yml', 'traer-juniper-matrix.yml', 'traer-fortinet-pendientes.yml']) {
    assert.match(fs.readFileSync(path.join(DIR, yml), 'utf8'), /rama="fuente\/[\w-]+-\$\(date -u \+%Y-%m-%d\)-\$GITHUB_RUN_ID"/, `${yml}: rama por corrida`);
  }
});
