'use strict';
/* QUE COMANDO SE ESTA EJECUTANDO DE VERDAD, y no cual se menciona dentro de una cadena.
 *
 * LO ENCONTRO UNA PRUEBA, NO UN RAZONAMIENTO. La primera version de `aprendizaje.sh` casaba
 * con un `grep` sobre el JSON crudo del hook, asi que al probarlo con cargas realistas
 * —donde el texto `npm run verificar` viajaba DENTRO de una variable de shell— registro una
 * corrida que nunca ocurrio. Es el mismo defecto que este repositorio ya pago dos veces: el
 * ancla `${cid}-sel` que seguia siendo subcadena de `${cid}-selector`, y el `/600F/` que
 * casaba dentro de `2600F`.
 *
 * Y AQUI ESE FALSO POSITIVO ES CARO, no molesto: `pre-push.sh` decide si la puerta de
 * verificacion paso leyendo estas anotaciones. Una corrida inventada es un VERDE FALSO justo
 * delante de un push que despliega.
 *
 * LA REGLA: se parte el comando por los separadores de shell y se exige que el programa sea
 * lo PRIMERO de su segmento, saltando solo lo que no cambia que se ejecuta —un `cd X &&` y
 * las asignaciones de entorno que preceden al comando—. Lo que va dentro de comillas nunca
 * empieza un segmento, asi que deja de contar.
 */
const SEPARADORES = /&&|\|\||;|\n|\|/;

// Quita `cd algo`, `timeout 90`, `env A=B` y las asignaciones `A=B` del principio del
// segmento: ninguna cambia CUAL es el comando que corre detras.
function programaDe(segmento) {
  let s = segmento.trim();
  for (;;) {
    const antes = s;
    s = s.replace(/^cd\s+[^\s&|;]+\s*$/, '');
    s = s.replace(/^(?:sudo|env|nohup|time)\s+/, '');
    s = s.replace(/^timeout\s+\S+\s+/, '');
    s = s.replace(/^[A-Za-z_][A-Za-z0-9_]*=(?:"[^"]*"|'[^']*'|\S*)\s+/, '');
    if (s === antes) break;
  }
  return s;
}

/* Devuelve la accion de npm que ese comando EJECUTA (`verificar`, `pantallas`, `test`...) o
 * null. Un comando que solo la nombra dentro de una cadena devuelve null. */
function accionNpm(cmd) {
  for (const seg of String(cmd || '').split(SEPARADORES)) {
    const p = programaDe(seg);
    const m = p.match(/^npm\s+(?:run\s+([\w:-]+)|(test))\b/);
    if (m) return m[1] || 'test';
  }
  return null;
}

/* Lo mismo para `git push`: se exige que `git` abra su segmento. */
function esGitPush(cmd) {
  for (const seg of String(cmd || '').split(SEPARADORES)) {
    if (/^git\s+(?:-\S+\s+)*push\b/.test(programaDe(seg))) return true;
  }
  return false;
}

/* SI EL CODIGO DE SALIDA DE LA LINEA ES EL DE NPM (2026-11-04, decision del dueño: «apuntar
 * desconocido»). Claude Code solo ve el codigo de la linea entera, que es el de su ULTIMO programa:
 * en `npm run verificar | tail` es el de `tail`, en `npm run verificar > log; echo rc=$?` el de
 * `echo`, y en los dos un verificar en rojo llegaba al registro como rc=0 —un verde que nadie vio,
 * justo el que `pre-push.sh` lee antes de un push que despliega—. Se midio con dos `reservar` en
 * tuberia que fallaron y quedaron en verde.
 *
 * Es fiable si detras de npm solo hay `&&` (un fallo corta la cadena y la linea sale con el codigo
 * de npm), o `|` con `set -o pipefail` antes. Cualquier otra cosa detras (`;`, `||`, `|` sin
 * pipefail) lo hace desconocido. Ante la duda, desconocido: un caso que no se entiende solo cuesta
 * una pregunta de mas, nunca un verde falso. */
const PARTES = /(&&|\|\||;|\n|\|)/;
const NPM = /^npm\s+(?:run\s+[\w:-]+|test)\b/;
const PIPEFAIL = /\bset\s+-[a-z]*o\s+pipefail\b/;

// Lo que va entre comillas no separa nada: el `|` de `grep -E "^# (pass|fail)"` no es una tuberia.
// Se vacia antes de partir; un npm entre comillas tampoco se ejecuta, asi que deja de contar igual.
const COMILLAS = /"(?:[^"\\]|\\.)*"|'[^']*'/g;

function rcEsDeNpm(cmd) {
  const partes = String(cmd || '').replace(COMILLAS, '""').split(PARTES);   // segmento, operador, ...
  let i = -1;
  for (let k = 0; k < partes.length; k += 2) {
    if (NPM.test(programaDe(partes[k]))) { i = k; break; }
  }
  if (i < 0) return false;
  let pipefail = false;
  for (let k = 0; k < i; k += 2) if (PIPEFAIL.test(partes[k])) pipefail = true;
  for (let k = i + 1; k < partes.length; k += 2) {
    if (!partes.slice(k + 1).join('').trim()) break;  // `npm run x;` o un salto final: detras no hay nada
    const op = partes[k];
    if (op === '&&' || (op === '|' && pipefail)) continue;
    return false;
  }
  return true;
}

module.exports = { accionNpm, esGitPush, programaDe, rcEsDeNpm };
