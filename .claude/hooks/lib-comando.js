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

module.exports = { accionNpm, esGitPush, programaDe };
