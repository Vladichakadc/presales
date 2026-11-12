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

// EN LA RAMA DE LA SESIÓN (2026-11-03, mejora propuesta al cerrar el PR #129): --en-esta-rama pone el
// traspaso en un commit de la rama actual. Sin la creación de rama no arbitra GitHub: tras empujar se
// vuelve a mirar y manda la reserva más antigua.
test('manda la reserva más antigua; a igual segundo, el nombre de la rama; sin fecha, la que ya estaba', () => {
  const a = { rama: 'claude/a', fecha: '2026-11-03T10:00:00Z' };
  const b = { rama: 'claude/b', fecha: '2026-11-03T10:00:05Z' };
  assert.ok(R.ganaLaReserva(a, b));
  assert.ok(!R.ganaLaReserva(b, a));
  assert.ok(R.ganaLaReserva(a, { ...b, fecha: a.fecha }), 'a igual segundo, claude/a antes que claude/b');
  assert.ok(!R.ganaLaReserva({ ...b, fecha: a.fecha }, a), 'y las dos sesiones llegan a lo mismo');
  assert.ok(!R.ganaLaReserva(a, { rama: 'claude/z', fecha: null }), 'un rival sin fecha ya estaba: manda él');
});

function enRama(dir, rama) {
  sh(dir, 'switch', '-q', '-c', rama);
  sh(dir, 'push', '-q', '-u', 'origin', rama);
}

test('--en-esta-rama: el traspaso va en un commit de la rama de la sesión, sin crear claude/<tema> ni tocar lo que está a medias', () => {
  const { base, clonar } = escenario();
  try {
    const a = clonar('sesion-a');
    enRama(a, 'claude/sesion-a');
    fs.writeFileSync(path.join(a, 'a-medias.js'), 'trabajo sin commit\n');
    fs.writeFileSync(path.join(a, 'LEEME.md'), 'repo de prueba, editado sin commit\n');
    const antes = sh(a, 'rev-parse', 'HEAD').trim();
    const r = correr(a, ['tema-uno', '--archivos', 'src/x.js', '--en-esta-rama', '--descripcion', 'Uno']);
    assert.strictEqual(r.rc, 0, r.salida);
    assert.match(r.salida, /Reservado: claude\/sesion-a/);
    assert.doesNotMatch(r.salida, /git switch/, 'no hay otra rama a la que cambiarse');
    assert.throws(() => sh(a, 'rev-parse', '--verify', 'origin/claude/tema-uno'), 'no crea claude/<tema>');
    sh(a, 'fetch', '-q', 'origin');
    assert.strictEqual(sh(a, 'rev-parse', 'origin/claude/sesion-a').trim(), sh(a, 'rev-parse', 'HEAD').trim(), 'la rama local y la de origin, en el commit de la reserva');
    assert.strictEqual(sh(a, 'rev-parse', 'HEAD^').trim(), antes, 'un solo commit sobre lo que había');
    const t = sh(a, 'show', 'HEAD:docs/traspaso/tema-uno.md');
    assert.match(t, /- \*\*Rama:\*\* claude\/sesion-a/);
    assert.deepStrictEqual(sh(a, 'show', '--name-only', '--format=', 'HEAD').trim().split('\n'), ['docs/traspaso/tema-uno.md'], 'solo entra el traspaso');
    assert.deepStrictEqual(sh(a, 'status', '--porcelain').replace(/\n$/, '').split('\n').sort(), [' M LEEME.md', '?? a-medias.js'], 'lo que estaba a medias sigue igual, y el traspaso no sale como cambio');
    assert.strictEqual(fs.readFileSync(path.join(a, 'docs/traspaso/tema-uno.md'), 'utf8'), t, 'el traspaso, también en el árbol');
    const b = clonar('sesion-b');
    const choque = correr(b, ['tema-dos', '--archivos', 'src/x.js', '--comprobar']);
    assert.strictEqual(choque.rc, 1, 'otra sesión la ve como cualquier reserva');
    assert.match(choque.salida, /claude\/sesion-a/);
  } finally { fs.rmSync(base, { recursive: true, force: true }); }
});

test('--en-esta-rama se niega en main y en una rama que ya lleva un tema abierto', () => {
  const { base, clonar } = escenario();
  try {
    const a = clonar('sesion-a');
    const enMain = correr(a, ['tema-uno', '--archivos', 'src/x.js', '--en-esta-rama']);
    assert.strictEqual(enMain.rc, 2, enMain.salida);
    assert.match(enMain.salida, /rama de trabajo de la sesión/);
    enRama(a, 'claude/sesion-a');
    assert.strictEqual(correr(a, ['tema-uno', '--archivos', 'src/x.js', '--en-esta-rama']).rc, 0);
    const otro = correr(a, ['tema-dos', '--archivos', 'src/y.js', '--en-esta-rama']);
    assert.strictEqual(otro.rc, 1, otro.salida);
    assert.match(otro.salida, /ya lleva el traspaso de tema-uno\.md/);
  } finally { fs.rmSync(base, { recursive: true, force: true }); }
});

test('--en-esta-rama: dos sesiones que reservan lo mismo a la vez; la segunda retira su reserva', () => {
  const { base, clonar } = escenario();
  try {
    const a = clonar('sesion-a');
    const b = clonar('sesion-b');
    enRama(a, 'claude/sesion-a');
    enRama(b, 'claude/sesion-b');
    // B mira antes de que A empuje y empuja después: su push a su propia rama funciona, así que la
    // carrera no la para GitHub; la para la segunda mirada, tras empujar.
    sh(b, 'fetch', '-q', 'origin');
    assert.strictEqual(correr(a, ['tema-a', '--archivos', 'src/x.js', '--en-esta-rama']).rc, 0);
    const tarde = correr(b, ['tema-b', '--archivos', 'src/x.js, src/z.js', '--en-esta-rama', '--sin-fetch']);
    assert.strictEqual(tarde.rc, 1, tarde.salida);
    assert.match(tarde.salida, /CHOQUE tras empujar: claude\/sesion-a \(src\/x\.js\) reservó lo mismo antes/);
    assert.match(tarde.salida, /se retiró la de claude\/sesion-b/);
    sh(b, 'fetch', '-q', 'origin');
    assert.throws(() => sh(b, 'show', 'origin/claude/sesion-b:docs/traspaso/tema-b.md'), 'en origin, la rama de B ya no lleva el traspaso');
    assert.match(sh(b, 'show', 'origin/claude/sesion-b^:docs/traspaso/tema-b.md'), /src\/z\.js/, 'la reserva y su retirada quedan en la historia');
    assert.strictEqual(sh(b, 'status', '--porcelain').trim(), '', 'y el árbol de B, limpio');
    assert.ok(!fs.existsSync(path.join(b, 'docs/traspaso/tema-b.md')));
    assert.match(sh(a, 'show', 'origin/claude/sesion-a:docs/traspaso/tema-a.md'), /src\/x\.js/, 'la de A sigue');
    const c = clonar('sesion-c');
    assert.strictEqual(correr(c, ['tema-c', '--archivos', 'src/z.js', '--comprobar']).rc, 0, 'lo que solo declaraba B vuelve a estar libre');
  } finally { fs.rmSync(base, { recursive: true, force: true }); }
});

// TEMAS CERRADOS EN MAIN (2026-11-03): la reserva en claude/<tema> de un tema que se trabajó y se cerró
// desde otra rama. El commit de cierre borra en main el mismo docs/traspaso/<tema>.md; si lo borró
// después del último commit de la rama, la reserva ya no bloquea.
test('cerrado en main: el borrado tiene que ser posterior al último commit de la rama', () => {
  const T = require('../scripts/traspasos');
  assert.ok(T.cerradoEnMain({ borrado: '2026-11-03T12:18:29+00:00', ultimoCommitRama: '2026-11-03 11:01:19 +0000' }));
  assert.ok(!T.cerradoEnMain({ borrado: '2026-11-03T12:18:29+00:00', ultimoCommitRama: '2026-11-03 13:00:00 +0000' }), 'una rama con commits después sigue viva');
  assert.ok(!T.cerradoEnMain({ borrado: null, ultimoCommitRama: '2026-11-03 11:01:19 +0000' }), 'sin borrado en main no hay nada cerrado');
});

function shFecha(cwd, fecha, ...args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, GIT_COMMITTER_DATE: fecha, GIT_AUTHOR_DATE: fecha } });
}

test('una reserva cuyo tema se cerró en main desde otra rama deja de bloquear; si se retomó, sigue', () => {
  const { base, clonar } = escenario();
  try {
    const a = clonar('sesion-a');
    // A reserva claude/tema-x (como hacía reservar sin --en-esta-rama) a las 10:00.
    const t = R.traspasoInicial({ tema: 'tema-x', rama: 'claude/tema-x', archivos: ['src/x.js'], fecha: 'f' });
    fs.mkdirSync(path.join(a, 'docs/traspaso'), { recursive: true });
    sh(a, 'switch', '-q', '-c', 'claude/tema-x');
    fs.writeFileSync(path.join(a, 'docs/traspaso/tema-x.md'), t);
    sh(a, 'add', '.');
    shFecha(a, '2026-11-03T10:00:00Z', 'commit', '-q', '-m', 'reserva');
    sh(a, 'push', '-q', 'origin', 'claude/tema-x');
    // El tema se trabaja desde la rama fija de otra sesión y se cierra en main: el traspaso entra y,
    // en el commit de cierre, sale (12:00), por un merge, como en el repositorio.
    const s = clonar('sesion-s');
    sh(s, 'switch', '-q', '-c', 'claude/rama-fija');
    fs.mkdirSync(path.join(s, 'docs/traspaso'), { recursive: true });
    fs.writeFileSync(path.join(s, 'docs/traspaso/tema-x.md'), t);
    fs.writeFileSync(path.join(s, 'x.js'), 'hecho\n');
    sh(s, 'add', '.');
    shFecha(s, '2026-11-03T11:00:00Z', 'commit', '-q', '-m', 'trabajo');
    sh(s, 'rm', '-q', 'docs/traspaso/tema-x.md');
    shFecha(s, '2026-11-03T12:00:00Z', 'commit', '-q', '-m', 'cierre');
    sh(s, 'switch', '-q', 'main');
    shFecha(s, '2026-11-03T12:05:00Z', 'merge', '-q', '--no-ff', '-m', 'merge', 'claude/rama-fija');
    sh(s, 'push', '-q', 'origin', 'main');
    const b = clonar('sesion-b');
    const libre = correr(b, ['tema-y', '--archivos', 'src/x.js', '--comprobar']);
    assert.strictEqual(libre.rc, 0, `la reserva vieja ya no bloquea: ${libre.salida}`);
    // Si A retoma su rama después del cierre (un commit a las 13:00), el tema vuelve a estar vivo.
    sh(a, 'switch', '-q', 'claude/tema-x');
    fs.writeFileSync(path.join(a, 'docs/traspaso/tema-x.md'), t.replace('reservado', 'en curso'));
    sh(a, 'add', '.');
    shFecha(a, '2026-11-03T13:00:00Z', 'commit', '-q', '-m', 'se retoma');
    sh(a, 'push', '-q', 'origin', 'claude/tema-x');
    const vivo = correr(b, ['tema-y', '--archivos', 'src/x.js', '--comprobar']);
    assert.strictEqual(vivo.rc, 1, `retomada después del cierre, bloquea: ${vivo.salida}`);
    assert.match(vivo.salida, /claude\/tema-x/);
  } finally { fs.rmSync(base, { recursive: true, force: true }); }
});

// LA SEGUNDA MIRADA EN LA RESERVA NORMAL (2026-11-09, mejora propuesta al cerrar el PR #160): dos sesiones
// reservaron la misma mejora con temas de nombre distinto y 15 segundos de diferencia (PR #160 y #161).
test('el traspaso cedido dice «cerrado» y quién reservó antes; un traspaso sin estado lo gana', () => {
  const t = R.traspasoInicial({ tema: 'x', rama: 'claude/x', archivos: ['a.js'], fecha: '2026-11-09 22:00' });
  const c = R.traspasoCedido(t, ['claude/y']);
  assert.match(c, /^- \*\*Estado:\*\* cerrado \(cedido: claude\/y reservó lo mismo antes\)$/m);
  assert.ok(!/^- \*\*Estado:\*\* reservado$/m.test(c));
  assert.match(R.traspasoCedido('# Traspaso: x\n', ['claude/y']), /- \*\*Estado:\*\* cerrado/);
  // `choques` ya no lo cuenta.
  assert.deepStrictEqual(R.choques(['a.js'], [{ origen: 'claude/x', estado: 'cerrado (cedido: claude/y reservó lo mismo antes)', archivos: ['a.js'] }]), []);
});

test('dos sesiones que reservan los mismos archivos con temas distintos a la vez: la segunda cede la suya', () => {
  const { base, clonar } = escenario();
  try {
    const a = clonar('sesion-a');
    const b = clonar('sesion-b');
    // B mira antes de que A empuje y empuja después: con nombres distintos, GitHub no para nada.
    sh(b, 'fetch', '-q', 'origin');
    assert.strictEqual(correr(a, ['tema-a', '--archivos', 'src/x.js']).rc, 0);
    const tarde = correr(b, ['tema-b', '--archivos', 'src/x.js, src/z.js', '--sin-fetch']);
    assert.strictEqual(tarde.rc, 1, tarde.salida);
    assert.match(tarde.salida, /CHOQUE tras empujar: claude\/tema-a \(src\/x\.js\) reservó lo mismo antes/);
    assert.match(tarde.salida, /claude\/tema-b queda cedida/);
    sh(b, 'fetch', '-q', 'origin');
    const cedido = sh(b, 'show', 'origin/claude/tema-b:docs/traspaso/tema-b.md');
    assert.match(cedido, /- \*\*Estado:\*\* cerrado \(cedido: claude\/tema-a reservó lo mismo antes\)/);
    assert.match(sh(b, 'show', 'origin/claude/tema-b^:docs/traspaso/tema-b.md'), /- \*\*Estado:\*\* reservado/, 'la reserva queda en la historia');
    assert.strictEqual(sh(b, 'rev-parse', '--abbrev-ref', 'HEAD').trim(), 'main', 'B no cambia de rama');
    assert.match(sh(a, 'show', 'origin/claude/tema-a:docs/traspaso/tema-a.md'), /- \*\*Estado:\*\* reservado/, 'la de A sigue');
    const c = clonar('sesion-c');
    assert.strictEqual(correr(c, ['tema-c', '--archivos', 'src/z.js', '--comprobar']).rc, 0, 'lo que solo declaraba B vuelve a estar libre');
    assert.strictEqual(correr(c, ['tema-c', '--archivos', 'src/x.js', '--comprobar']).rc, 1, 'lo de A sigue tomado');
  } finally { fs.rmSync(base, { recursive: true, force: true }); }
});

test('la primera en reservar no cede ante la que llega después: lo dice como aviso', () => {
  const { base, clonar } = escenario();
  try {
    const a = clonar('sesion-a');
    const b = clonar('sesion-b');
    assert.strictEqual(correr(a, ['tema-a', '--archivos', 'src/x.js']).rc, 0);
    // B reserva con --aunque (pasa por alto a A): no hay carrera que ceder, y A sigue reservada.
    const r = correr(b, ['tema-b', '--archivos', 'src/x.js', '--aunque', 'claude/tema-a']);
    assert.strictEqual(r.rc, 0, r.salida);
    assert.match(sh(b, 'show', 'origin/claude/tema-b:docs/traspaso/tema-b.md'), /- \*\*Estado:\*\* reservado/);
  } finally { fs.rmSync(base, { recursive: true, force: true }); }
});

// ── La misma mejora propuesta con otro nombre (2026-11-12, mejora propuesta al cerrar el PR #198) ──────────
test('las propuestas citadas se leen de la frase de siempre, sin repetir y en orden', () => {
  assert.deepStrictEqual(R.propuestasCitadas('Mejora propuesta al cerrar el PR #185; también la propuesta del PR #63 y la Propuesta al cerrar el PR #185'), [63, 185]);
  assert.deepStrictEqual(R.propuestasCitadas('lo que dejó el PR #185, sin la frase'), [], 'nombrar un PR no es citar su propuesta');
  assert.deepStrictEqual(R.propuestasCitadas(null), []);
});

test('del traspaso cuenta su Tema y su Encargo, no la historia de las demás secciones', () => {
  const t = R.traspasoInicial({ tema: 'x', rama: 'claude/x', descripcion: 'Figuras (mejora propuesta al cerrar el PR #185)', archivos: ['a.js'], fecha: '2026-11-12 10:00' })
    .replace('<Las palabras del dueño, literales, y lo que se entendió de ellas.>', 'Ejecuta la propuesta del PR #90.')
    .replace('<Lo decidido y su porqué; lo medido; lo que no funcionó, para no repetirlo.>', 'Se miró la propuesta al cerrar el PR #12.');
  assert.deepStrictEqual(R.propuestasCitadas(R.textoDeEncargo(t)), [90, 185]);
});

test('mismaPropuesta avisa con quién comparte propuesta; un cerrado, un pasado por alto o sin propuesta propia, no', () => {
  const ocupados = [
    { origen: 'claude/a', tema: 'A', estado: 'en curso', propuestas: [185] },
    { origen: 'claude/b', tema: 'B', estado: 'cerrado (cedido: claude/a reservó lo mismo antes)', propuestas: [185] },
    { origen: 'claude/c', tema: 'C', estado: 'en curso', propuestas: [185] },
    { origen: 'claude/d', tema: 'D', estado: 'en curso', propuestas: [63] },
    { origen: 'claude/e', tema: 'E', estado: 'en curso' },
  ];
  const l = R.mismaPropuesta([185, 198], ocupados, { ignorar: ['claude/c'] });
  assert.deepStrictEqual(l.map((x) => [x.origen, x.comunes]), [['claude/a', [185]]]);
  assert.deepStrictEqual(R.mismaPropuesta([], ocupados), []);
  assert.match(R.avisoMismaPropuesta(l), /claude\/a — A \[en curso\]: cita la propuesta al cerrar el PR #185/);
  assert.strictEqual(R.avisoMismaPropuesta([]), '');
});

test('el caso del #192 y el #193: archivos distintos, la misma propuesta; la segunda reserva avisa y se hace igual', () => {
  const { base, clonar } = escenario();
  try {
    const a = clonar('sesion-a');
    const b = clonar('sesion-b');
    const r1 = correr(a, ['fortinet-figuras-cobertura', '--archivos', 'test/fortinet-figuras-cobertura.test.js', '--descripcion', 'Cobertura de figuras', '--propuesta', '185']);
    assert.strictEqual(r1.rc, 0, r1.salida);
    assert.match(sh(a, 'show', 'origin/claude/fortinet-figuras-cobertura:docs/traspaso/fortinet-figuras-cobertura.md'),
      /- \*\*Tema:\*\* Cobertura de figuras \(mejora propuesta al cerrar el PR #185\)/, '--propuesta queda en el Tema para que la lean las demás');
    const r2 = correr(b, ['fortiextender-figuras', '--archivos', 'test/fortiextender-figuras.test.js', '--descripcion', 'Cada FortiExtender con figura (mejora propuesta al cerrar el PR #185)']);
    assert.strictEqual(r2.rc, 0, `solo avisa, no frena: ${r2.salida}`);
    assert.match(r2.salida, /AVISO: 1 tema\(s\) en curso salen de la misma mejora propuesta/);
    assert.match(r2.salida, /claude\/fortinet-figuras-cobertura — Cobertura de figuras/);
    assert.match(r2.salida, /Reservado: claude\/fortiextender-figuras/);
    // Mutación de control: otra propuesta no avisa.
    const r3 = correr(b, ['otro-tema', '--archivos', 'test/otro.test.js', '--propuesta', '186', '--comprobar']);
    assert.strictEqual(r3.rc, 0, r3.salida);
    assert.doesNotMatch(r3.salida, /misma mejora propuesta/);
  } finally { fs.rmSync(base, { recursive: true, force: true }); }
});

test('un PR abierto sin traspaso que cita la propuesta en su descripción también avisa', () => {
  const { base, clonar } = escenario();
  try {
    const a = clonar('sesion-a');
    const pr = [{ number: 192, title: 'Figuras de Fortinet', body: 'Mejora propuesta al cerrar el PR #185.', head: { ref: 'claude/sin-traspaso' }, user: { login: 'otra' }, updated_at: '2026-11-12T10:00:00Z' }];
    const gh = (args) => (/\/files/.test(args[1]) ? JSON.stringify([{ filename: 'test/otra.test.js' }]) : JSON.stringify(pr));
    const lineas = [];
    const log = console.log;
    console.log = (...x) => lineas.push(x.join(' '));
    let rc;
    try { rc = R.main(['mi-tema', '--archivos', 'test/mia.test.js', '--propuesta', '#185', '--comprobar'], { raiz: a, gh }); } finally { console.log = log; }
    assert.strictEqual(rc, 0, lineas.join('\n'));
    assert.match(lineas.join('\n'), /claude\/sin-traspaso — PR #192 «Figuras de Fortinet» \[PR abierto\]: cita la propuesta al cerrar el PR #185/);
  } finally { fs.rmSync(base, { recursive: true, force: true }); }
});

test('--propuesta pide un número', () => {
  assert.throws(() => R.argumentos(['t', '--propuesta', 'x']), /número del PR/);
  assert.deepStrictEqual(R.argumentos(['t', '--propuesta', '#5', '--propuesta', '7']).propuesta, [5, 7]);
});
