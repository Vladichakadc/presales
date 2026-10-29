'use strict';
/* LA VIGILIA DEL DESPLIEGUE (2026-10-28, mejora aprobada por el dueño).

   `sonda-produccion.yml` escucha los estados que Railway publica en GitHub y avisa cuando un
   despliegue falla o la sonda no pasa. Pero solo corre cuando un despliegue TERMINA: uno que se
   queda en cola, o que Railway nunca registra, no avisa a nadie. El 2026-10-28 pasaron las dos
   cosas el mismo día: la fusión del PR #53 esperó en cola casi una hora y Railway acabó
   saltándola (SKIPPED), y la del PR #51 no llegó a crear ningún despliegue; las dos se vieron
   porque una sesión miró a mano.

   `vigilia-despliegue.yml` corre cada media hora y le da a este módulo la cabeza de `main`, el
   estado de su CI y los despliegues de producción de ese commit. Decide:
     - la cabeza ya está desplegada (un despliegue suyo terminó en `success`): se cierra el aviso;
     - la fusión es más reciente que el margen (90 min por defecto; un despliegue normal tarda lo
       que el job de `pantallas`, ~7 min, y el más lento medido, ~55): nada, se espera;
     - pasado el margen sin despliegue terminado, se avisa con la causa que se ve desde aquí:
         · `ci-rojo`: `verificar` o `pantallas` fallaron y Railway, que espera a CI, no despliega;
         · `ci-sin-terminar`: CI sigue sin terminar;
         · `en-cola`: Railway creó el despliegue y no lo termina;
         · `sin-despliegue`: Railway no creó ninguno, o lo dejó inactivo (saltado o reemplazado);
     - si el último despliegue del commit falló, nada: eso ya lo avisa la sonda.

   Un aviso por commit: si el abierto ya es de esta cabeza, no se repite; si es de otra, se
   comenta con la nueva. Etiqueta propia (`despliegue-en-espera`), para no tocar los avisos de la
   sonda. Los datos vienen de la API de GitHub: se validan (40 hexadecimales, fecha ISO, estados
   de la lista) y nada de ellos se interpola en código.

   Solo usa JavaScript: el job no instala dependencias (lo vigila `test/workflows-permisos.test.js`). */

const ETIQUETA = 'despliegue-en-espera';
const PREFIJO = 'Main sin desplegar';
const MARGEN_MIN = 90;
const PRODUCCION = 'Presales / production';
const SHA = /^[0-9a-f]{40}$/;
const ESTADOS = new Set(['error', 'failure', 'inactive', 'in_progress', 'pending', 'queued', 'success']);
const CI = ['verificar', 'pantallas'];

// El margen que llega de una entrada manual: un entero entre 15 y 1440 minutos, o el de siempre.
function margen(v) {
  const n = Number.parseInt(v, 10);
  return Number.isInteger(n) && n >= 15 && n <= 1440 ? n : MARGEN_MIN;
}

// Lo que importa de la API, validado. `checks`: [{name, status, conclusion}];
// `despliegues`: [{sha, created_at, estados: [{state, created_at}] (el más reciente primero)}].
function leerDatos({ sha, fecha, checks, despliegues }) {
  const ci = {};
  for (const nombre of CI) {
    const c = (Array.isArray(checks) ? checks : []).filter((x) => x && x.name === nombre)
      .sort((a, b) => String(b.started_at || '').localeCompare(String(a.started_at || '')))[0];
    ci[nombre] = !c ? 'ausente' : c.status !== 'completed' ? 'en-curso' : c.conclusion === 'success' ? 'verde' : 'rojo';
  }
  const deps = (Array.isArray(despliegues) ? despliegues : [])
    .filter((d) => d && d.sha === sha)
    .map((d) => {
      const est = (Array.isArray(d.estados) ? d.estados : []).filter((e) => e && ESTADOS.has(e.state));
      return { creado: d.created_at, estado: est.length ? est[0].state : 'pending' };
    });
  const t = Date.parse(fecha);
  return { sha: SHA.test(String(sha || '')) ? sha : null, fecha: Number.isNaN(t) ? null : t, ci, deps };
}

function decidir(datos, ahora, margenMin = MARGEN_MIN) {
  const d = datos || {};
  if (!d.sha || d.fecha == null) return { accion: 'nada', motivo: 'datos-invalidos' };
  const minutos = Math.floor((ahora - d.fecha) / 60000);
  const base = { sha: d.sha, minutos, margen: margenMin, ci: d.ci };
  if (d.deps.some((x) => x.estado === 'success')) return { ...base, accion: 'cerrar', motivo: 'desplegado' };
  if (minutos < margenMin) return { ...base, accion: 'nada', motivo: 'esperando' };
  const ci = Object.values(d.ci || {});
  if (ci.includes('rojo')) return { ...base, accion: 'avisar', motivo: 'ci-rojo' };
  if (ci.includes('en-curso') || ci.includes('ausente')) return { ...base, accion: 'avisar', motivo: 'ci-sin-terminar' };
  const ultimo = d.deps.slice().sort((a, b) => String(b.creado || '').localeCompare(String(a.creado || '')))[0];
  if (ultimo && (ultimo.estado === 'failure' || ultimo.estado === 'error')) {
    return { ...base, accion: 'nada', motivo: 'fallido-lo-avisa-la-sonda' };
  }
  if (ultimo && ['queued', 'pending', 'in_progress'].includes(ultimo.estado)) {
    return { ...base, accion: 'avisar', motivo: 'en-cola', estado: ultimo.estado };
  }
  return { ...base, accion: 'avisar', motivo: 'sin-despliegue', estado: ultimo ? ultimo.estado : null };
}

const CAUSA = {
  'ci-rojo': 'CI de este commit está en rojo y Railway, que espera a `verificar` y `pantallas`, no lo despliega.',
  'ci-sin-terminar': 'CI de este commit sigue sin terminar (o no se lanzó), y Railway espera a CI.',
  'en-cola': 'Railway creó el despliegue y no lo termina.',
  'sin-despliegue': 'Railway no creó ningún despliegue para este commit, o lo dejó inactivo (saltado o reemplazado sin desplegar).',
};
const QUE_HACER = {
  'ci-rojo': 'Leer el fallo (`gh api repos/<dueño>/<repo>/check-runs/<id>/annotations`), arreglarlo y fusionar.',
  'ci-sin-terminar': 'Mirar la corrida de CI del commit; si no existe, volver a lanzarla.',
  'en-cola': 'Mirar la cola en Railway (`list-deployments`); si sigue atascado, volver a desplegar ese commit.',
  'sin-despliegue': 'Volver a avisar a Railway: un commit vacío en `main` (como el del 2026-10-28, 533932e) o «Redeploy» en su panel.',
};

function tituloIssue(d) {
  return `${PREFIJO}: ${d.sha.slice(0, 7)} lleva ${d.minutos} min sin desplegarse`;
}

function cuerpoIssue(d, urls) {
  const ci = Object.entries(d.ci || {}).map(([k, v]) => `\`${k}\`: ${v}`).join(' · ');
  return [
    `La cabeza de \`main\` ([\`${d.sha.slice(0, 7)}\`](${urls.repo}/commit/${d.sha})) se fusionó hace **${d.minutos} min** y no hay ningún despliegue de producción suyo terminado bien (margen: ${d.margen} min).`,
    '',
    `**Causa que se ve desde GitHub:** ${CAUSA[d.motivo]}${d.estado ? ` Último estado del despliegue: \`${d.estado}\`.` : ''}`,
    '',
    `**CI:** ${ci || 'sin datos'}`,
    '',
    `**Qué hacer:** ${QUE_HACER[d.motivo]}`,
    '',
    `Lo abre \`vigilia-despliegue.yml\` ([corrida](${urls.corrida})) y se cierra solo cuando la cabeza de \`main\` quede desplegada.`,
  ].join('\n');
}

function comentarioNuevaCabeza(d, urls) {
  return `Sigue sin desplegarse, ahora con la cabeza [\`${d.sha.slice(0, 7)}\`](${urls.repo}/commit/${d.sha}) (${d.minutos} min): ${CAUSA[d.motivo]} [Corrida](${urls.corrida}).`;
}

function comentarioCierre(d, urls) {
  return `La cabeza de \`main\` ([\`${d.sha.slice(0, 7)}\`](${urls.repo}/commit/${d.sha})) ya está desplegada en producción. Se cierra ([corrida](${urls.corrida})).`;
}

// Qué hacer con el aviso abierto (o no) a la vista de la decisión.
function plan(d, abierto) {
  if (d.accion === 'cerrar') return abierto ? 'cerrar' : 'nada';
  if (d.accion !== 'avisar') return 'nada';
  if (!abierto) return 'abrir';
  return String(abierto.title || '').includes(d.sha.slice(0, 7)) ? 'nada' : 'comentar';
}

module.exports = {
  ETIQUETA, PREFIJO, MARGEN_MIN, PRODUCCION, CI, margen, leerDatos, decidir, plan,
  tituloIssue, cuerpoIssue, comentarioNuevaCabeza, comentarioCierre,
};
