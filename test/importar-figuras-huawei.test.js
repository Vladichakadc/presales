'use strict';
// EL IMPORTADOR DE FIGURAS DE HUAWEI (2026-10-15).
//
// Lo que se prueba es lo que haría que una figura mala entrara callada: un modelo que el
// catálogo no tiene, una cara mal escrita, una figura sin procedencia, una más pequeña que la que
// ya hay, un WebP con pérdida, y escribir encima de un archivo que comparten dos modelos. Las
// imágenes son sintéticas (cabeceras PNG de un tamaño dado): no se guarda ninguna de Huawei aquí.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { planificar, dimensiones, problemasDelPie, ramaDeCapturas } = require('../scripts/importar-figuras-huawei');

// Una cabecera PNG basta: el plan solo lee el tamaño.
function png(ancho, alto) {
  const b = Buffer.alloc(33);
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(b, 0);
  b.writeUInt32BE(13, 8); b.write('IHDR', 12, 'latin1');
  b.writeUInt32BE(ancho, 16); b.writeUInt32BE(alto, 20);
  return b;
}

const fuente = (rotulo) => `Galería de imágenes de productos de Info-Finder (50010720) — «NetEngine ${rotulo}». Render oficial.`;
const FUENTE = fuente('AR5710-S8T2S');
const modelos = [{ id: 'AR5710-S8T2S' }, { id: 'AR8140-12G10XG' }, { id: 'AR8140-T-12G10XG' }];
const vistas = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'public/data/huawei-vistas-equipos.json'), 'utf8'));

// Cada modelo lleva su captura de la galería salvo que la prueba diga `captura: null`.
function carpeta(archivos, proc) {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'figuras-'));
  for (const [n, b] of Object.entries(archivos)) fs.writeFileSync(path.join(d, n), b);
  fs.writeFileSync(path.join(d, 'captura.png'), png(1400, 900));
  for (const e of Object.values(proc)) if (!('captura' in e)) e.captura = 'captura.png';
  for (const e of Object.values(proc)) if (e.captura === null) delete e.captura;
  fs.writeFileSync(path.join(d, 'procedencia.json'), JSON.stringify(proc));
  return d;
}

test('una figura mayor, con su procedencia, entra con la ruta que ya tenía', () => {
  const d = carpeta({ 'f.png': png(4000, 600), 'r.png': png(4000, 600) },
    { 'AR5710-S8T2S': { front: 'f.png', rear: 'r.png', fuente: FUENTE } });
  const p = planificar(d, { modelos, vistas });
  assert.deepStrictEqual(p.errores, []);
  assert.deepStrictEqual(p.cambios.map((c) => [c.cara, c.destino]),
    [['front', vistas['AR5710-S8T2S'].front], ['rear', '/img/equipos/hw-ar5710-s8t2s-rear.webp']]);
});

test('se rechaza lo que entraría mal: modelo ajeno, cara mal escrita, sin procedencia, más pequeña', () => {
  const d = carpeta({ 'f.png': png(4000, 600), 'chica.png': png(100, 20) }, {
    'AR9999': { front: 'f.png', fuente: fuente('AR9999') },
    'AR5710-S8T2S': { trasera: 'f.png', front: 'chica.png', fuente: FUENTE },
    'AR8140-12G10XG': { front: 'f.png', fuente: 'corta' },
  });
  const p = planificar(d, { modelos, vistas });
  const texto = p.errores.join('\n');
  assert.match(texto, /AR9999: no está en el catálogo/);
  assert.match(texto, /AR5710-S8T2S: claves desconocidas \(trasera\)/);
  assert.match(texto, /AR5710-S8T2S front: la nueva \(100 × 20\) es menor que la actual/);
  assert.match(texto, /AR8140-12G10XG: sin procedencia escrita/);
  assert.deepStrictEqual(p.cambios, []);
  // Y a propósito, con --aunque-menor, sí.
  const p2 = planificar(carpeta({ 'chica.png': png(100, 20) }, { 'AR5710-S8T2S': { front: 'chica.png', fuente: FUENTE } }),
    { modelos, vistas, aunqueMenor: true });
  assert.strictEqual(p2.cambios.length, 1);
});

test('un WebP con pérdida no entra: hace falta el original', () => {
  const webp = Buffer.concat([Buffer.from('RIFF'), Buffer.alloc(4), Buffer.from('WEBPVP8 '), Buffer.alloc(20)]);
  assert.deepStrictEqual(dimensiones(webp), { tipo: 'webp', sinPerdida: false });
  const p = planificar(carpeta({ 'f.webp': webp }, { 'AR5710-S8T2S': { front: 'f.webp', fuente: FUENTE } }), { modelos, vistas });
  assert.match(p.errores.join('\n'), /WebP con pérdida/);
});

test('una figura que comparten dos modelos no se pisa: la nueva va a su propio archivo', () => {
  // El AR8140 y el AR8140-T publican la misma figura (hw-ar8140-front.webp).
  assert.strictEqual(vistas['AR8140-12G10XG'].front, vistas['AR8140-T-12G10XG'].front);
  const p = planificar(carpeta({ 'f.png': png(5000, 900) }, { 'AR8140-T-12G10XG': { front: 'f.png', fuente: fuente('AR8140-T-12G10XG') } }), { modelos, vistas });
  assert.deepStrictEqual(p.errores, []);
  assert.strictEqual(p.cambios[0].destino, '/img/equipos/hw-ar8140-t-12g10xg-front.webp');
  assert.strictEqual(p.cambios[0].compartida, true);
});

test('las figuras que ya hay se leen bien: WebP sin pérdida con su tamaño', () => {
  const buf = fs.readFileSync(path.join(__dirname, '..', 'public', vistas['NE8000 F8'].front));
  assert.deepStrictEqual(dimensiones(buf), { tipo: 'webp', sinPerdida: true, ancho: 1028, alto: 1230 });
});

test('el pie se comprueba al planificar con las reglas de la prueba de figuras', () => {
  // Lo que verificar rechazaría después: un rótulo de un hermano, un pie sin documento ni
  // galería, una NE8000 que no dice qué variante dibuja.
  assert.deepStrictEqual(problemasDelPie('AR5710-S8T2S', FUENTE), []);
  assert.match(problemasDelPie('AR5710-S8T2X', fuente('AR5710-S8T2XE')).join(), /no nombra este modelo/);
  assert.match(problemasDelPie('AR5710-S8T2S', 'Una foto que encontré en la web del fabricante, bonita.').join(), /el pie no sigue/);
  assert.match(problemasDelPie('NE8000 M1A', fuente('8000 M1A')).join(), /variante/);
  const p = planificar(carpeta({ 'f.png': png(4000, 600) }, { 'AR5710-S8T2S': { front: 'f.png', fuente: fuente('AR5710-S8T2SE') } }), { modelos, vistas });
  assert.match(p.errores.join(), /no nombra este modelo/);
  assert.deepStrictEqual(p.cambios, []);
});

test('todas las figuras publicadas pasarían hoy por el importador', () => {
  for (const [modelo, v] of Object.entries(vistas)) {
    if (modelo.startsWith('_')) continue;
    assert.deepStrictEqual(problemasDelPie(modelo, v.fuente), [], modelo);
  }
});

test('un modelo sin figura previa trae el tamaño del equipo en la carpeta', () => {
  const sinFigura = [...modelos, { id: 'AR9998' }];
  const sinTamano = planificar(carpeta({ 'f.png': png(900, 200) }, { 'AR9998': { front: 'f.png', fuente: fuente('AR9998') } }), { modelos: sinFigura, vistas });
  assert.match(sinTamano.errores.join(), /AR9998: falta «tamano»/);
  const conTamano = planificar(carpeta({ 'f.png': png(900, 200) },
    { 'AR9998': { front: 'f.png', fuente: fuente('AR9998'), tamano: '43,6 × 442 × 420 mm (Al × An × Fo)' } }), { modelos: sinFigura, vistas });
  assert.deepStrictEqual(conTamano.errores, []);
  assert.strictEqual(conTamano.cambios[0].destino, '/img/equipos/hw-ar9998-front.webp');
});

test('sin la captura de la galería no entra: es la prueba de que el pie dice lo que decía la página', () => {
  const p = planificar(carpeta({ 'f.png': png(4000, 600) }, { 'AR5710-S8T2S': { front: 'f.png', fuente: FUENTE, captura: null } }), { modelos, vistas });
  assert.match(p.errores.join(), /AR5710-S8T2S: falta «captura»/);
  assert.deepStrictEqual(p.cambios, []);
});

test('las capturas van a una rama fuente/ nueva, sin tocar el árbol de trabajo ni la rama en curso', () => {
  const { execFileSync } = require('node:child_process');
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'repo-'));
  const git = (...a) => execFileSync('git', a, { cwd: repo, encoding: 'utf8' }).trim();
  git('init', '-q', '-b', 'main');
  git('-c', 'user.name=p', '-c', 'user.email=p@p', 'commit', '-q', '--allow-empty', '-m', 'base');
  const d = carpeta({ 'f.png': png(4000, 600) }, { 'AR5710-S8T2S': { front: 'f.png', fuente: FUENTE } });
  const p = planificar(d, { modelos, vistas });
  const ahora = new Date('2026-10-15T12:34:00Z');
  const entorno = { ...process.env, GIT_AUTHOR_NAME: 'p', GIT_AUTHOR_EMAIL: 'p@p', GIT_COMMITTER_NAME: 'p', GIT_COMMITTER_EMAIL: 'p@p' };
  const antes = process.env; process.env = entorno;
  let rama;
  try { rama = ramaDeCapturas(p, d, { cwd: repo, ahora }); } finally { process.env = antes; }
  assert.strictEqual(rama, 'fuente/figuras-huawei-20261015-1234');
  assert.deepStrictEqual(git('ls-tree', '-r', '--name-only', rama).split('\n'), ['capturas/ar5710-s8t2s.png', 'procedencia.json']);
  assert.strictEqual(git('rev-parse', '--abbrev-ref', 'HEAD'), 'main');
  assert.strictEqual(git('status', '--porcelain'), '');
  // Una por corrida: la misma hora no pisa la rama anterior.
  process.env = entorno;
  try { assert.throws(() => ramaDeCapturas(p, d, { cwd: repo, ahora }), /ya existe/); } finally { process.env = antes; }
});
