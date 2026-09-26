'use strict';
// Todo script de package.json tiene que aparecer en CLAUDE.md.
//
// POR QUE. CLAUDE.md es lo que lee cada sesión de Claude Code antes de tocar nada, y un
// script que no figura en él es un script que la siguiente sesión no sabe que existe: vuelve
// a escribir a mano lo que ya hace, o no corre el control que lo cubría. Se midió el
// 2026-09-26: `npm run vigencia`, el vigilante de guías de pedido de Aruba, llevaba diez días
// en package.json sin una sola mención. La prosa se desincroniza sola; esta es la parte de ese
// desfase que se puede comprobar sola, igual que `pantallas-campos.test.js` hace con los
// campos de cada pantalla.
//
// Basta con que aparezca EN CUALQUIER PARTE, no en el bloque de comandos: exigir el bloque
// haría engordar un archivo que ya pesa demasiado, y la mención útil suele estar en la
// sección que explica para qué sirve el script.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..');

// Un script cuenta como mencionado si aparece como `npm run <nombre>` —o `npm start` y
// `npm test`, que npm acepta sin `run`— y el nombre no sigue con otra letra o un guion:
// `npm run lista-aruba` no puede valer por un script que se llamara `lista`. Es el
// ancla-subcadena que este repositorio ya pagó dos veces (`${cid}-sel` dentro de
// `${cid}-selector`, `/600F/` dentro de `2600F`).
function sinMencion(scripts, texto) {
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return scripts.filter((n) => {
    const atajo = n === 'start' || n === 'test' ? `|npm ${esc(n)}(?![\\w-])` : '';
    return !new RegExp(`npm run ${esc(n)}(?![\\w-])${atajo}`).test(texto);
  });
}

test('la comprobación no acepta un prefijo ni una mención sin npm run', () => {
  const texto = 'Usa `npm run lista-aruba` y `npm test`; `npm run e2e` corre la batería. '
    + 'La vigencia de un modelo es otra cosa.';
  assert.deepStrictEqual(sinMencion(['lista-aruba', 'test', 'e2e'], texto), []);
  assert.deepStrictEqual(sinMencion(['lista', 'e2', 'vigencia'], texto), ['lista', 'e2', 'vigencia']);
});

test('cada script de package.json aparece en CLAUDE.md', () => {
  const scripts = Object.keys(require(path.join(RAIZ, 'package.json')).scripts);
  const claude = fs.readFileSync(path.join(RAIZ, 'CLAUDE.md'), 'utf8');
  const faltan = sinMencion(scripts, claude);
  assert.deepStrictEqual(faltan, [],
    `CLAUDE.md no menciona ${faltan.map((n) => `\`npm run ${n}\``).join(', ')}. `
    + 'Añade una línea que diga para qué sirve, en el bloque de comandos o en la sección que lo '
    + 'explica: un script que no figura ahí es uno que la siguiente sesión no sabe que existe.');
});
