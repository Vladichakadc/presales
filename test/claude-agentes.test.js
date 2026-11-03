'use strict';
// Los subagentes de .claude/agents/ y el asesor de .claude/settings.json (PR #94, petición del
// dueño). Un subagente de búsqueda es «de solo lectura» porque su lista de herramientas lo
// impone, no porque su prompt lo pida: si alguien le añade Bash o Edit, nadie lo ve hasta que
// escribe. Y una pareja modelo-asesor que la API rechaza se acepta al guardar y falla en la
// primera petición de la sesión. Esta prueba frena las dos cosas antes de llegar a main.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..');
const DIR = path.join(RAIZ, '.claude', 'agents');
const ESCRITURA = ['Write', 'Edit', 'NotebookEdit', 'Bash'];

// Un subagente que SÍ debe escribir se declara aquí, con su motivo; sin entrada, es de solo lectura.
const EXCEPCIONES = {};

// La gama de cada modelo: el asesor tiene que ser de la misma o de una superior a la del modelo
// principal (la API rechaza un asesor por debajo, y Claude Code no lo comprueba al guardar).
const GAMA = { haiku: 1, sonnet: 2, opus: 3, fable: 4 };
function gama(modelo) {
  const m = /(?:^|claude-)(haiku|sonnet|opus|fable)\b/.exec(String(modelo || ''));
  return m ? GAMA[m[1]] : null;
}

// Frontmatter YAML de una sola capa (clave: valor), que es lo único que usan estos archivos.
function frontmatter(texto) {
  const m = /^---\n([\s\S]*?)\n---\n/.exec(texto);
  if (!m) return null;
  const campos = {};
  for (const linea of m[1].split('\n')) {
    const kv = /^([A-Za-z]+):\s*(.*)$/.exec(linea);
    if (kv) campos[kv[1]] = kv[2].trim();
  }
  return campos;
}
const lista = (v) => (v ? v.split(',').map((s) => s.trim()).filter(Boolean) : []);

const archivos = fs.existsSync(DIR) ? fs.readdirSync(DIR).filter((f) => f.endsWith('.md')).sort() : [];

test('hay subagentes declarados en .claude/agents/', () => {
  assert.ok(archivos.length > 0, '.claude/agents/ está vacía o no existe: CLAUDE.md dice que hay tres');
});

for (const archivo of archivos) {
  test(`${archivo}: nombre, descripción y modelo declarados`, () => {
    const fm = frontmatter(fs.readFileSync(path.join(DIR, archivo), 'utf8'));
    assert.ok(fm, `${archivo} no empieza con su frontmatter (--- … ---)`);
    assert.strictEqual(fm.name, archivo.replace(/\.md$/, ''), `${archivo}: «name» tiene que ser el nombre del archivo`);
    assert.ok(fm.description, `${archivo}: sin «description», la sesión no sabe cuándo delegarle`);
    assert.ok(gama(fm.model), `${archivo}: «model» no declarado o desconocido («${fm.model}»); sin él hereda el de la sesión`);
  });

  test(`${archivo}: de solo lectura, por su lista de herramientas`, () => {
    const fm = frontmatter(fs.readFileSync(path.join(DIR, archivo), 'utf8')) || {};
    if (EXCEPCIONES[fm.name]) return;
    const tools = lista(fm.tools);
    const denegadas = lista(fm.disallowedTools);
    assert.ok(tools.length > 0, `${archivo}: sin «tools» hereda todas las herramientas, también las de escritura`);
    for (const h of ESCRITURA) {
      assert.ok(!tools.includes(h), `${archivo}: «tools» incluye ${h}; si debe escribir, va en EXCEPCIONES con su motivo`);
      assert.ok(denegadas.includes(h), `${archivo}: «disallowedTools» no deniega ${h}`);
    }
  });
}

test('las excepciones de escritura son de subagentes que existen y llevan motivo', () => {
  const nombres = archivos.map((f) => f.replace(/\.md$/, ''));
  for (const [nombre, motivo] of Object.entries(EXCEPCIONES)) {
    assert.ok(nombres.includes(nombre), `EXCEPCIONES nombra «${nombre}», que no está en .claude/agents/`);
    assert.ok(typeof motivo === 'string' && motivo.length > 10, `EXCEPCIONES: «${nombre}» sin motivo`);
  }
});

test('el asesor es de la misma gama o superior que el modelo de la sesión', () => {
  const s = JSON.parse(fs.readFileSync(path.join(RAIZ, '.claude', 'settings.json'), 'utf8'));
  if (!s.advisorModel) return;
  assert.ok(gama(s.model), `.claude/settings.json: «model» no declarado o desconocido («${s.model}») con un asesor puesto`);
  assert.ok(gama(s.advisorModel), `.claude/settings.json: «advisorModel» desconocido («${s.advisorModel}»)`);
  assert.ok(gama(s.advisorModel) >= gama(s.model),
    `el asesor (${s.advisorModel}) está por debajo del modelo (${s.model}): la API rechaza la pareja en la primera petición`);
});

test('CLAUDE.md nombra cada subagente', () => {
  const claude = fs.readFileSync(path.join(RAIZ, 'CLAUDE.md'), 'utf8');
  for (const archivo of archivos) {
    const nombre = archivo.replace(/\.md$/, '');
    assert.ok(claude.includes('`' + nombre + '`'), `CLAUDE.md no menciona el subagente \`${nombre}\`: la siguiente sesión no sabrá que existe`);
  }
});
