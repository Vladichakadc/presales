'use strict';
// EL SEGUNDO FALLO SEGUIDO DEL MISMO COMANDO RECUERDA CONSULTAR AL ASESOR (2026-11-04).
//
// CLAUDE.md manda consultar al asesor «cuando el mismo error aparece dos veces», y ningun ajuste
// de Claude Code lo fuerza: lo fuerza la regla, y una regla que solo vive en un texto se olvida a
// mitad de un reintento. Este modulo cuenta, con el registro que ya escribe `aprendizaje.sh`,
// cuantas corridas seguidas de una misma accion de npm acabaron mal, y el hook lo dice ANTES de
// la siguiente: es justo el momento en que la regla pide parar y preguntar.
//
// DE DONDE SALE «ACABO MAL». No se lee la salida del comando (adivinar el exito por el texto es la
// heuristica que un corchete suelto rompe). Se usan los dos archivos del registro:
//   · `runs.jsonl`: rc=0 lo escribe PostToolUse cuando la corrida termino bien; rc distinto de 0
//     lo escribe el arranque al saldar lo que quedo abierto en la sesion anterior.
//   · `en-curso.jsonl`: lo que PreToolUse abrio y PostToolUse no cerro. PostToolUse no se
//     dispara cuando el comando sale con codigo distinto de 0, asi que en la sesion en curso una
//     entrada abierta es un fallo (o una interrupcion, que tambien merece pensarlo).
//
// LO QUE NO VE. Una corrida en tuberia (`npm run x | tail`) sale con el codigo del ultimo programa,
// no con el de npm: para Claude Code termino bien, PostToolUse la cierra con rc=0 y aqui cuenta como
// un verde. Medido el 2026-11-04 con dos `npm run reservar ... | tail` que fallaron y quedaron con rc=0.
//
// AVISA, NO BLOQUEA. Un fallo esperado (una prueba que se pone en rojo a proposito para ver que
// muerde) tambien cuenta: por eso es un recordatorio en el contexto de la sesion, nunca un
// `permissionDecision`, que ademas aprobaria o frenaria lo que no le toca.

const MINIMO = 2;

function lineas(texto) {
  const out = [];
  for (const l of String(texto || '').split('\n')) {
    if (!l.trim()) continue;
    try { out.push(JSON.parse(l)); } catch { /* una linea cortada no es una corrida */ }
  }
  return out;
}

// Cuantas corridas seguidas de `accion`, desde la mas reciente hacia atras, acabaron mal.
// `excluirId` es la corrida que se esta abriendo ahora: todavia no ha pasado nada.
function fallosSeguidos(accion, runsTexto, enCursoTexto, excluirId) {
  if (!accion) return 0;
  const corridas = [];
  for (const r of lineas(runsTexto)) {
    if (r.action === accion && r.skill === 'npm') corridas.push({ ts: Date.parse(r.ts), mal: r.rc !== 0 });
  }
  for (const r of lineas(enCursoTexto)) {
    if (r.action === accion && r.skill === 'npm' && !(excluirId && r.id === excluirId)) {
      corridas.push({ ts: Date.parse(r.ts), mal: true });
    }
  }
  corridas.sort((a, b) => (a.ts || 0) - (b.ts || 0));
  let n = 0;
  for (let i = corridas.length - 1; i >= 0 && corridas[i].mal; i--) n++;
  return n;
}

function recordatorio(accion, n) {
  const comando = accion === 'test' ? 'npm test' : `npm run ${accion}`;
  return `Las ${n} ultimas corridas de "${comando}" acabaron mal (fallaron o se interrumpieron). `
    + 'CLAUDE.md: cuando el mismo error aparece dos veces, se consulta al asesor antes de reintentar. '
    + 'Si el fallo es esperado (una prueba en rojo a proposito), sigue.';
}

module.exports = { MINIMO, fallosSeguidos, recordatorio };
