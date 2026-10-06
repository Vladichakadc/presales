'use strict';
// LA SKILL graphify, TAL COMO SE DECIDIÓ INSTALARLA (2026-10-06). Ver
// `.claude/skills/graphify/LEEME.md`. Tres cosas que una actualización podría cambiar sin que
// nadie lo decida:
//   1. el texto que se le ordena al agente (SKILL.md y references/): fijado por huella, como
//      `sqlite3` en `allowScripts`. Si cambia, alguien lo lee y anota la huella nueva;
//   2. el modo «siempre activo»: `graphify install --project` registra hooks en
//      `.claude/settings.json` y escribe una sección `## graphify` en el CLAUDE.md raíz. Se
//      deshizo a propósito; si vuelve, tiene que ser una decisión escrita, no una actualización;
//   3. el grafo (`graphify-out/`) no se versiona: es un mapa del código del día en que se hizo.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const RAIZ = path.join(__dirname, '..');
const DIR = path.join(RAIZ, '.claude', 'skills', 'graphify');
const LEEME = fs.readFileSync(path.join(DIR, 'LEEME.md'), 'utf8');
const sha = (buf) => crypto.createHash('sha256').update(buf).digest('hex');

test('la skill instalada es la versión revisada, y el LEEME dice cuál', () => {
  const version = fs.readFileSync(path.join(DIR, '.graphify_version'), 'utf8').trim();
  assert.match(version, /^\d+\.\d+\.\d+$/);
  assert.ok(LEEME.includes(`graphifyy==${version}`), `el LEEME no da la orden de instalación fijada a ${version}`);
  const skill = fs.readFileSync(path.join(DIR, 'SKILL.md'));
  assert.match(skill.toString('utf8'), /^---\nname: graphify\n/);
  assert.ok(LEEME.includes(sha(skill)), 'SKILL.md cambió y nadie anotó en el LEEME la huella de la versión revisada');
  const refs = fs.readdirSync(path.join(DIR, 'references')).filter((f) => f.endsWith('.md')).sort();
  assert.ok(refs.length > 0, 'la skill carga references/ bajo demanda y no está');
  const todo = Buffer.concat([skill, ...refs.map((f) => fs.readFileSync(path.join(DIR, 'references', f)))]);
  assert.ok(LEEME.includes(sha(todo)), 'references/ cambió y nadie anotó en el LEEME la huella de la versión revisada');
});

test('el modo «siempre activo» no está instalado: ni hooks de graphify ni su sección en CLAUDE.md', () => {
  // Solo se busca la palabra: el mensaje no reproduce el contenido de settings.json.
  const settings = fs.readFileSync(path.join(RAIZ, '.claude', 'settings.json'), 'utf8');
  assert.ok(!/graphify/i.test(settings),
    '.claude/settings.json registra algo de graphify: es el modo siempre activo, que se dejó fuera a propósito (ver el LEEME de la skill)');
  const claudeMd = fs.readFileSync(path.join(RAIZ, 'CLAUDE.md'), 'utf8');
  assert.ok(!/^## graphify\s*$/m.test(claudeMd),
    'CLAUDE.md tiene la sección «## graphify» que escribe `graphify claude install`');
});

test('el grafo no se versiona, y el ignore quita lo que no es de este proyecto', () => {
  const gitignore = fs.readFileSync(path.join(RAIZ, '.gitignore'), 'utf8');
  assert.match(gitignore, /^graphify-out\/$/m);
  const ignore = fs.readFileSync(path.join(RAIZ, '.graphifyignore'), 'utf8');
  for (const ruta of ['.claude/skills/', 'starlink-leo-dimensionador/']) {
    assert.match(ignore, new RegExp(`^${ruta.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')}$`, 'm'), `${ruta} vuelve a entrar en el grafo`);
  }
});
