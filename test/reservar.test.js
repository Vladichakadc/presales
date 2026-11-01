'use strict';
// RESERVAR UN TEMA ANTES DE ESCRIBIR CÓDIGO (2026-11-01). El 2026-10-28 tres sesiones hicieron la misma
// mejora porque ninguna veía a las otras hasta su primer push. Se prueba sin red: las reglas puras y,
// con un `origin` local de usar y tirar, la reserva entera, el choque por archivos y la carrera de dos
// sesiones que reservan el mismo tema (la segunda pierde porque GitHub —aquí, el origin local— rechaza
// su push, no porque este script lo compruebe).
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const R = require('../scripts/reservar');

test('los archivos declarados se leen como rutas: sin notas entre paréntesis ni «(no consta)»', () => {
  assert.deepStrictEqual(R.normalizarArchivos('scripts/transporte/documentos.js (entradas al final), public/js/bom.js, test/e2e/'),
    ['scripts/transporte/documentos.js', 'public/js/bom.js', 'test/e2e/']);
  assert.deepStrictEqual(R.normalizarArchivos('(no consta)'), []);
  assert.deepStrictEqual(R.normalizarArchivos(''), []);
  assert.deepStrictEqual(R.normalizarArchivos('`a.js`, ./b.js'), ['a.js', 'b.js']);
});

test('dos rutas chocan si son la misma o si una carpeta contiene a la otra', () => {
  assert.ok(R.solapan('public/js/bom.js', 'public/js/bom.js'));
  assert.ok(R.solapan('test/e2e/', 'test/e2e/e2e-ux.js'));
  assert.ok(R.solapan('test/e2e/e2e-ux.js', 'test/e2e/'));
  assert.ok(!R.solapan('public/js/bom.js', 'public/js/bom-extra.js'), 'un prefijo de nombre no es una carpeta');
  assert.ok(!R.solapan('test/e2e', 'test/e2e/e2e-ux.js'), 'sin la barra final no se lee como carpeta');
});

test('los archivos que todos tocan al cerrar no cuentan como choque', () => {
  const ocupados = [{ origen: 'claude/otro', estado: 'en curso', archivos: ['CLAUDE.md', 'RELEVO.md', 'PENDIENTES.md', 'docs/entregas/2026-11-01-pr-1.md'] }];
  assert.deepStrictEqual(R.choques(['CLAUDE.md', 'RELEVO.md', 'docs/entregas/', 'scripts/x.js'], ocupados), []);
});

test('un choque dice con quién y en qué archivo; un traspaso cerrado o pasado por alto no choca', () => {
  const ocupados = [
    { origen: 'claude/a', tema: 'A', estado: 'en curso', archivos: ['public/js/bom.js', 'test/e2e/'] },
    { origen: 'claude/b', tema: 'B', estado: 'cerrado sin fusionar: duplicado', archivos: ['public/js/bom.js'] },
    { origen: 'claude/c', tema: 'C', estado: 'en curso', archivos: ['public/js/bom.js'] },
    { origen: 'claude/d', tema: 'D', estado: 'en curso', archivos: ['server/x.js'] },
  ];
  const c = R.choques(['public/js/bom.js', 'test/e2e/e2e-nuevo.js'], ocupados, { ignorar: ['claude/c'] });
  assert.strictEqual(c.length, 1);
  assert.strictEqual(c[0].origen, 'claude/a');
  assert.deepStrictEqual(c[0].pisa, ['public/js/bom.js', 'test/e2e/e2e-nuevo.js ↔ test/e2e/']);
});

test('el traspaso inicial lleva los campos que lee npm run traspasos, con estado «reservado»', () => {
  const { leerCabecera } = require('../scripts/traspasos');
  const t = R.traspasoInicial({ tema: 'x', rama: 'claude/x', descripcion: 'Algo', cuenta: 'yo', archivos: ['a.js', 'b/'],
    fecha: '2026-11-01 12:00', ignoradas: ['claude/vieja'] });
  const cab = leerCabecera(t);
  assert.strictEqual(cab.Tema, 'Algo');
  assert.strictEqual(cab.Rama, 'claude/x');
  assert.strictEqual(cab.Estado, 'reservado');
  assert.strictEqual(cab['Archivos que toca'], 'a.js, b/');
  assert.match(t, /## Encargo del dueño/, 'sigue la plantilla');
  assert.match(t, /pasando por alto los archivos de claude\/vieja/, 'el --aunque queda dicho en el traspaso');
});

test('la hora del traspaso es la de Bogotá', () => {
  assert.strictEqual(R.horaBogota(new Date('2026-11-01T17:10:00Z')), '2026-11-01 12:10');
});

// ── Con git de verdad y un origin local ─────────────────────────────────────────────────────
function sh(cwd, ...args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}
function escenario() {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'reservar-prueba-'));
  const origen = path.join(base, 'origen.git');
  sh(base, 'init', '-q', '--bare', '-b', 'main', origen);
  const clonar = (nombre) => {
    const dir = path.join(base, nombre);
    sh(base, 'clone', '-q', origen, dir);
    sh(dir, 'config', 'user.email', `${nombre}@prueba`);
    sh(dir, 'config', 'user.name', nombre);
    return dir;
  };
  const semilla = clonar('semilla');
  fs.writeFileSync(path.join(semilla, 'LEEME.md'), 'repo de prueba\n');
  sh(semilla, 'add', '.');
  sh(semilla, 'commit', '-q', '-m', 'inicio');
  sh(semilla, 'push', '-q', 'origin', 'HEAD:main');
  return { base, clonar };
}
// Sin PR abiertos: `gh` respondería con una lista vacía.
const ghVacio = () => '[]';
function correr(dir, argv) {
  const lineas = [];
  const log = console.log; const err = console.error;
  console.log = (...a) => lineas.push(a.join(' '));
  console.error = (...a) => lineas.push(a.join(' '));
  try {
    return { rc: R.main(argv, { raiz: dir, gh: ghVacio }), salida: lineas.join('\n') };
  } finally {
    console.log = log; console.error = err;
  }
}

test('reservar crea la rama en origin con su traspaso, sin tocar el árbol de trabajo', () => {
  const { base, clonar } = escenario();
  try {
    const a = clonar('sesion-a');
    fs.writeFileSync(path.join(a, 'a-medias.js'), 'trabajo sin commit\n');
    const r = correr(a, ['tema-uno', '--archivos', 'src/x.js, test/x.test.js', '--descripcion', 'Uno']);
    assert.strictEqual(r.rc, 0, r.salida);
    assert.match(r.salida, /Reservado: claude\/tema-uno/);
    const traspaso = sh(a, 'show', 'origin/claude/tema-uno:docs/traspaso/tema-uno.md');
    assert.match(traspaso, /- \*\*Archivos que toca:\*\* src\/x\.js, test\/x\.test\.js/);
    assert.strictEqual(sh(a, 'rev-parse', 'origin/claude/tema-uno^'), sh(a, 'rev-parse', 'origin/main'), 'un solo commit sobre main');
    assert.strictEqual(sh(a, 'status', '--porcelain').trim(), '?? a-medias.js', 'el árbol de trabajo sigue igual');
    assert.strictEqual(sh(a, 'rev-parse', '--abbrev-ref', 'HEAD').trim(), 'main', 'no cambia de rama');
  } finally { fs.rmSync(base, { recursive: true, force: true }); }
});

test('otra sesión que declara un archivo ya reservado choca, y con --comprobar no crea nada', () => {
  const { base, clonar } = escenario();
  try {
    const a = clonar('sesion-a');
    const b = clonar('sesion-b');
    assert.strictEqual(correr(a, ['tema-uno', '--archivos', 'src/x.js, CLAUDE.md']).rc, 0);
    const choque = correr(b, ['tema-dos', '--archivos', 'src/x.js', '--comprobar']);
    assert.strictEqual(choque.rc, 1, choque.salida);
    assert.match(choque.salida, /claude\/tema-uno/);
    assert.match(choque.salida, /src\/x\.js/);
    assert.strictEqual(correr(b, ['tema-dos', '--archivos', 'src/y.js, CLAUDE.md', '--comprobar']).rc, 0, 'CLAUDE.md no choca');
    assert.throws(() => sh(b, 'rev-parse', '--verify', 'origin/claude/tema-dos'), '--comprobar no empuja nada');
    const pasado = correr(b, ['tema-dos', '--archivos', 'src/x.js', '--aunque', 'claude/tema-uno']);
    assert.strictEqual(pasado.rc, 0, pasado.salida);
    assert.match(sh(b, 'show', 'origin/claude/tema-dos:docs/traspaso/tema-dos.md'), /pasando por alto los archivos de claude\/tema-uno/);
  } finally { fs.rmSync(base, { recursive: true, force: true }); }
});

test('dos sesiones que reservan el mismo tema a la vez: gana la primera, la segunda lo dice', () => {
  const { base, clonar } = escenario();
  try {
    const a = clonar('sesion-a');
    const b = clonar('sesion-b');
    // B mira antes de que A empuje (su fetch no ve nada) y empuja después: es la carrera real.
    sh(b, 'fetch', '-q', 'origin');
    assert.strictEqual(correr(a, ['tema-uno', '--archivos', 'src/x.js']).rc, 0);
    const tarde = correr(b, ['tema-uno', '--archivos', 'src/z.js', '--sin-fetch']);
    assert.strictEqual(tarde.rc, 1, tarde.salida);
    assert.match(tarde.salida, /CHOQUE o fallo al empujar claude\/tema-uno/);
    assert.match(sh(b, 'show', 'refs/heads/main:LEEME.md'), /repo de prueba/);
    sh(b, 'fetch', '-q', 'origin');
    assert.match(sh(b, 'show', 'origin/claude/tema-uno:docs/traspaso/tema-uno.md'), /src\/x\.js/, 'en origin queda la reserva de A');
  } finally { fs.rmSync(base, { recursive: true, force: true }); }
});

test('sin tema válido o sin archivos no se reserva', () => {
  assert.strictEqual(correr(process.cwd(), ['Tema Malo', '--archivos', 'a.js']).rc, 2);
  assert.strictEqual(correr(process.cwd(), ['tema-bueno']).rc, 2);
});

// LOS CASOS DE EQUIVALENCIA QUE VIGILAN LO RESERVADO (2026-11-01): se leen del texto del caso, sin
// ejecutarlo, y solo avisan.
test('reservar dice qué caso de equivalencia vigila los archivos reservados y cómo aceptar un cambio', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'reservar-equiv-'));
  try {
    fs.writeFileSync(path.join(dir, 'aruba-estado.js'), "module.exports = { nombre: 'x', mide: ['public/js/aruba-reglas.js'], cargar() { throw new Error('no se ejecuta'); } };\n");
    fs.writeFileSync(path.join(dir, 'carpeta.js'), 'module.exports = { mide: ["public/js/"] };\n');
    fs.writeFileSync(path.join(dir, 'sin-mide.js'), 'module.exports = { nombre: "y" };\n');
    const l = R.casosQueVigilan(['public/js/aruba-reglas.js', 'test/x.test.js'], dir);
    assert.deepStrictEqual(l.map((c) => [c.caso, c.pisa.join()]), [['aruba-estado', 'public/js/aruba-reglas.js'], ['carpeta', 'public/js/aruba-reglas.js']]);
    assert.deepStrictEqual(R.casosQueVigilan(['server/x.js'], dir), [], 'lo que nadie mide no avisa');
    const aviso = R.avisoEquivalencias(l);
    assert.match(aviso, /npm run equivalencia -- scripts\/equivalencias\/aruba-estado\.js/);
    assert.match(aviso, /equivalencia-acepta: aruba-estado: <motivo>/);
    assert.strictEqual(R.avisoEquivalencias([]), '');
    const t = R.traspasoInicial({ tema: 'x', rama: 'claude/x', archivos: ['public/js/aruba-reglas.js'], fecha: 'f', vigilan: l });
    assert.match(t, /La medición de equivalencias vigila `aruba-estado` \(por public\/js\/aruba-reglas\.js\)/, 'queda dicho en el traspaso');
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
  assert.deepStrictEqual(R.casosQueVigilan(['x.js'], path.join(os.tmpdir(), 'no-existe-reservar')), [], 'sin carpeta de casos, nada');
});
