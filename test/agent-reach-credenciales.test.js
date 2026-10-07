'use strict';
// LAS CREDENCIALES DE agent-reach NO ENTRAN EN EL REPOSITORIO (2026-10-07).
//
// El dueño aprobó activar agent-reach con credenciales: cookies de Twitter (TWITTER_AUTH_TOKEN,
// TWITTER_CT0) y sesiones de Chrome. Viven en ~/.agent-reach/ de quien la usa, nunca aquí (ver
// .claude/skills/agent-reach/LEEME.md). Una cookie de sesión filtrada es la cuenta entera, y este
// repositorio despliega a producción con cada push: esta prueba frena en `npm run verificar` un
// archivo versionado que traiga una con valor, y que se deje de ignorar su directorio.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const RAIZ = path.join(__dirname, '..');
const VARIABLES = ['TWITTER_AUTH_TOKEN', 'TWITTER_CT0'];

// Una asignación con valor: `TWITTER_CT0=abc`, `TWITTER_CT0: "abc"` o `"TWITTER_CT0": "abc"`. El
// nombre suelto (en esta misma prueba, en el LEEME) no es una credencial.
function conValor(texto) {
  return VARIABLES.filter((v) => new RegExp(`["']?${v}["']?\\s*[=:]\\s*["']?[A-Za-z0-9%_\\-]{8,}`).test(texto));
}

test('la comprobación distingue el nombre de la variable de una credencial con valor', () => {
  // Los ejemplos se arman en tiempo de ejecución: escritos literales, este mismo archivo sería
  // una «credencial con valor» para la prueba de abajo.
  const [token, ct0] = VARIABLES;
  assert.deepStrictEqual(conValor(`pide ${token} y ${ct0}`), []);
  assert.deepStrictEqual(conValor(`${ct0}=${'a1b2'.repeat(3)}`), ['TWITTER_CT0']);
  assert.deepStrictEqual(conValor(`{"${token}": "${'f00b'.repeat(4)}"}`), ['TWITTER_AUTH_TOKEN']);
});

test('ningún archivo versionado trae una credencial de agent-reach con valor', () => {
  const archivos = execFileSync('git', ['ls-files', '-z'], { cwd: RAIZ, encoding: 'utf8' }).split('\0').filter(Boolean);
  const malos = [];
  for (const f of archivos) {
    const ruta = path.join(RAIZ, f);
    let texto;
    try {
      const st = fs.statSync(ruta);
      if (!st.isFile() || st.size > 2 * 1024 * 1024) continue;
      texto = fs.readFileSync(ruta, 'utf8');
    } catch { continue; }
    const v = conValor(texto);
    if (v.length) malos.push(`${f}: ${v.join(', ')}`);
  }
  assert.deepStrictEqual(malos, []);
});

test('el directorio de agent-reach y los volcados de cookies están ignorados', () => {
  const ignorados = (rutas) => execFileSync('git', ['check-ignore', '--no-index', ...rutas], { cwd: RAIZ, encoding: 'utf8' })
    .split('\n').filter(Boolean);
  assert.deepStrictEqual(ignorados(['.agent-reach/credenciales.json', 'x.cookies', 'cookies.txt']).length, 3);
});
