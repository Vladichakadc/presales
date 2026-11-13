'use strict';
// Qué ramas se pueden borrar (mejora aprobada por el dueño el 2026-11-12): las `claude/*` que `main`
// ya contiene entera (ninguna obra propia: comparadas con main, 0 commits por delante) y que no
// tienen un PR abierto. Una rama con commits propios no se toca nunca, aunque su trabajo haya
// entrado por otro camino: eso lo decide una persona. Función pura; el workflow
// limpiar-ramas.yml le pasa lo que lee de la API y borra solo con `aplicar`.

const PREFIJO = 'claude/';

// ramas: [{ nombre, porDelante }] (porDelante = commits de la rama que main no tiene, o null si
// no se pudo comparar). prAbiertos: nombres de rama con un PR abierto.
function clasificar(ramas, prAbiertos) {
  const abiertos = new Set(prAbiertos);
  const borrar = [];
  const quedan = [];
  for (const r of ramas) {
    if (!r || typeof r.nombre !== 'string' || !r.nombre.startsWith(PREFIJO)) continue;
    let motivo = null;
    if (abiertos.has(r.nombre)) motivo = 'tiene un PR abierto';
    else if (!Number.isInteger(r.porDelante)) motivo = 'no se pudo comparar con main';
    else if (r.porDelante > 0) motivo = `${r.porDelante} commit(s) que main no tiene`;
    if (motivo) quedan.push({ nombre: r.nombre, motivo });
    else borrar.push(r.nombre);
  }
  borrar.sort();
  quedan.sort((a, b) => a.nombre.localeCompare(b.nombre));
  return { borrar, quedan };
}

function resumen({ borrar, quedan }, aplicar) {
  const l = [`${aplicar ? 'Borradas' : 'Se borrarían'} (${borrar.length}):`];
  for (const n of borrar) l.push(`  - ${n}`);
  l.push(`Quedan (${quedan.length}):`);
  for (const q of quedan) l.push(`  - ${q.nombre}: ${q.motivo}`);
  return l.join('\n');
}

module.exports = { clasificar, resumen, PREFIJO };
