'use strict';
// Lo que el job con permisos acepta del job que ejecutó código de fuera (2026-10-02): el
// fabricante de una propuesta, la propuesta aplicada a `legacyData/` y los PDF de Aruba. Lo que
// llega es DATO: se acepta lo que el paso legítimo puede producir y nada más. En la propuesta,
// el job con permisos no aplica el parche del otro: vuelve a aplicar la propuesta con el
// importador y exige el mismo resultado byte a byte, y eso solo vale si el importador es
// determinista, que es lo que se prueba aquí.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');
const { fabricanteDe } = require('../scripts/leer-propuesta.js');
const D = require('../scripts/publicar-datasheets.js');

const RAIZ = path.join(__dirname, '..');
const git = (cwd, ...args) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();

test('el fabricante de la propuesta tiene que ser uno de los que conoce el importador', () => {
  assert.strictEqual(fabricanteDe('{"vendor":"Fortinet","cambios":[]}'), 'fortinet');
  for (const [texto, motivo] of [
    ['{"vendor":"fortinet; curl x | sh","cambios":[]}', /fabricante conocido/],
    ['{"vendor":"$(id)","cambios":[]}', /fabricante conocido/],
    ['{"vendor":"__proto__","cambios":[]}', /fabricante conocido/],
    ['{"vendor":" fortinet","cambios":[]}', /fabricante conocido/],
    ['{"vendor":"aruba"}', /cambios/],
    ['[{"id":"x"}]', /objeto/],
    ['no es json', /JSON/],
  ]) {
    assert.throws(() => fabricanteDe(texto), motivo, texto);
  }
  // El mensaje no repite lo recibido, que puede ser cualquier cosa.
  assert.throws(() => fabricanteDe('{"vendor":"@alguien **x**","cambios":[]}'), (e) => !e.message.includes('@alguien'));
});

// Una copia mínima del repositorio: el importador y el catálogo de un fabricante, en git.
function copiaRepo() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'propuesta-'));
  fs.mkdirSync(path.join(dir, 'scripts'));
  fs.mkdirSync(path.join(dir, 'server/seed/legacyData'), { recursive: true });
  fs.copyFileSync(path.join(RAIZ, 'scripts/importar-propuesta.js'), path.join(dir, 'scripts/importar-propuesta.js'));
  fs.copyFileSync(path.join(RAIZ, 'server/seed/legacyData/mikrotik.js'), path.join(dir, 'server/seed/legacyData/mikrotik.js'));
  git(dir, 'init', '-q', '-b', 'main');
  git(dir, 'add', '.');
  git(dir, '-c', 'user.name=t', '-c', 'user.email=t@example.com', 'commit', '-q', '-m', 'inicio');
  return dir;
}
const { MODELS: MIKROTIK } = require('../server/seed/legacyData/mikrotik.js');

test('el importador es determinista: los dos jobs producen el mismo parche, byte a byte', () => {
  const m = MIKROTIK.find((x) => typeof x.fwd === 'number');
  const propuesta = JSON.stringify({ vendor: 'mikrotik', cambios: [{
    type: 'UPDATE', target: 'product', id: m.id, field: 'fwd', oldValue: m.fwd, newValue: m.fwd + 1,
    reason: 'prueba', sourceUrl: 'https://mikrotik.com/product/x',
  }] });
  const parche = () => {
    const dir = copiaRepo();
    fs.writeFileSync(path.join(dir, 'propuesta.json'), propuesta);
    const r = spawnSync(process.execPath, ['scripts/importar-propuesta.js', 'propuesta.json', '--aplicar'], { cwd: dir, encoding: 'utf8' });
    assert.strictEqual(r.status, 0, r.stderr);
    return execFileSync('git', ['diff', '--', 'server/seed/legacyData/'], { cwd: dir, encoding: 'utf8' });
  };
  const primero = parche();
  const segundo = parche();
  assert.ok(primero.length > 0, 'la propuesta anclada cambia el catálogo');
  assert.strictEqual(segundo, primero, 'el job que publica reproduce exactamente lo verificado');
  const cambiadas = primero.split('\n').filter((l) => /^[-+](?![-+])/.test(l));
  assert.strictEqual(cambiadas.length, 2, 'una línea fuera y una dentro: solo el valor');
  assert.match(cambiadas[1], new RegExp(`fwd:\\s*${m.fwd + 1}\\b`));
  // Y un parche distinto, el de un job que lo hubiera manipulado, no casa.
  assert.notStrictEqual(primero.replace(String(m.fwd + 1), String(m.fwd + 2)), segundo);
});

test('los datasheets: solo PDF del manifiesto, con su firma y de tamaño acotado', () => {
  const nombres = new Set(['edgeconnect-xs-spec-sheet.pdf', 'gateway-9004.pdf']);
  const carpeta = (archivos) => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'datasheets-'));
    for (const [n, contenido] of Object.entries(archivos)) fs.writeFileSync(path.join(dir, n), contenido);
    return dir;
  };
  const bien = carpeta({ 'edgeconnect-xs-spec-sheet.pdf': '%PDF-1.7\nxx', 'gateway-9004.pdf': '%PDF-1.4\nyy' });
  const r = D.revisar(bien, nombres);
  assert.deepStrictEqual(r.archivos.sort(), ['edgeconnect-xs-spec-sheet.pdf', 'gateway-9004.pdf']);
  for (const [archivos, motivo] of [
    [{ 'otro.pdf': '%PDF-1.7' }, /manifiesto/],
    [{ 'gateway-9004.pdf': '<!doctype html>' }, /firma/],
    [{ 'gateway-9004.pdf': '%PDF-1.7', 'edgeconnect-xs-spec-sheet.pdf': '<html>' }, /firma/],
  ]) {
    assert.match(D.revisar(carpeta(archivos), nombres).error || '', motivo, JSON.stringify(Object.keys(archivos)));
  }
  const conCarpeta = carpeta({});
  fs.mkdirSync(path.join(conCarpeta, 'sub'));
  assert.match(D.revisar(conCarpeta, nombres).error || '', /archivo normal/);
  // Un enlace simbólico que apunte fuera no se sigue.
  const conEnlace = carpeta({});
  fs.symlinkSync('/etc/hostname', path.join(conEnlace, 'gateway-9004.pdf'));
  assert.match(D.revisar(conEnlace, nombres).error || '', /archivo normal/);
  assert.match(D.revisar(path.join(conEnlace, 'no-existe'), nombres).error || '', /carpeta/);
  // El manifiesto real: solo documentos con URL, y con nombre de archivo PDF.
  const reales = D.permitidos();
  assert.ok(reales.size >= 18 && [...reales].every((n) => /^[a-z0-9][a-z0-9._-]*\.pdf$/.test(n)), [...reales].join(', '));
});

test('publicar copia lo validado y nada si algo no encaja', () => {
  const origen = fs.mkdtempSync(path.join(os.tmpdir(), 'ds-origen-'));
  const destino = fs.mkdtempSync(path.join(os.tmpdir(), 'ds-destino-'));
  const nombre = [...D.permitidos()][0];
  fs.writeFileSync(path.join(origen, nombre), '%PDF-1.7\nhola');
  assert.deepStrictEqual(D.publicar(origen, destino).archivos, [nombre]);
  assert.strictEqual(fs.readFileSync(path.join(destino, nombre), 'utf8'), '%PDF-1.7\nhola');
  const malo = fs.mkdtempSync(path.join(os.tmpdir(), 'ds-malo-'));
  const destino2 = fs.mkdtempSync(path.join(os.tmpdir(), 'ds-destino2-'));
  fs.writeFileSync(path.join(malo, nombre), '%PDF-1.7\nbien');
  fs.writeFileSync(path.join(malo, 'intruso.pdf'), '%PDF-1.7\nmal');
  assert.throws(() => D.publicar(malo, destino2), /manifiesto/);
  assert.deepStrictEqual(fs.readdirSync(destino2), [], 'no se copió ni el que sí valía');
});
