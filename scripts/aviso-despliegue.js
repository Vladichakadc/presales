'use strict';
/* EL AVISO DE DESPLIEGUE (2026-10-02).

   Railway publica en GitHub el estado de cada despliegue: crea un deployment «Presales /
   production» y le va poniendo estados (`in_progress`, `success`, `failure`, `inactive`). Medido
   ese día con la API de GitHub: de 246 despliegues desde el 19 de agosto, 10 terminaron en
   `failure` y ninguno avisó a nadie. El 1 de septiembre producción pasó unas 23 horas sin
   cambios, y el 16 unas 13, con ocho despliegues fallidos seguidos. Con `npm ci` en Railway, un
   lock roto hace fallar la construcción y producción sigue con lo anterior, que es lo correcto,
   pero en silencio. Y la sonda solo corría si alguien la lanzaba.

   `sonda-produccion.yml` escucha esos estados. Este módulo decide qué hacer con cada uno y
   redacta el issue, y es lo único del repositorio que ejecuta el job con `issues: write`:
     - un despliegue de producción que termina bien: la sonda ya corrió contra el dominio real.
       Si pasó, se cierra el aviso abierto; si no, se abre o se comenta;
     - un despliegue que falla: se abre o se comenta el aviso;
     - cualquier otro estado, o uno que no crea Railway o no es de producción: nada;
     - un simulacro, lanzado a mano, recorre el camino del fallo y lo dice en el título.

   EL EVENTO ES UN DATO DE FUERA. Cualquiera con escritura en el repositorio puede crear un
   deployment o un estado por la API. Solo cuenta lo que crea `railway-app[bot]` para el entorno
   de producción, y de él solo se usan campos validados: el estado contra la lista de GitHub, el
   commit contra 40 hexadecimales y el enlace contra la forma de las URL de Railway. La
   descripción del estado es texto libre y no se usa nunca.

   FALLA CERRADO. Un despliegue que terminó bien y cuya sonda no pasó, o no llegó a correr, se
   avisa: un despliegue sin comprobar no es un despliegue comprobado.

   Solo usa JavaScript: el job no instala dependencias (lo vigila
   `test/workflows-permisos.test.js`). */

const ETIQUETA = 'despliegue';
const RAILWAY = 'railway-app[bot]';
// El entorno de producción por su id, que no cambia si se renombra el proyecto, y por su nombre,
// por si Railway dejara de mandar el id. Los dos ya son públicos: viajan en cada deployment.
const PRODUCCION = { id: '96a55d46-1f45-4eda-9d46-1cf9a0c8131f', nombre: 'Presales / production' };
const ESTADOS = new Set(['error', 'failure', 'inactive', 'in_progress', 'pending', 'queued', 'success']);
const SHA = /^[0-9a-f]{40}$/;
const ENLACE_RAILWAY = /^https:\/\/railway\.com\/project\/[0-9a-f-]{36}(?:\?environmentId=[0-9a-f-]{36})?$/;
const SIMULACRO = 'despliegue-fallido';

// Lo que importa del evento, validado. `shaContexto` es el commit de la corrida manual.
function leerEvento(nombre, payload, shaContexto) {
  const p = payload && typeof payload === 'object' ? payload : {};
  if (nombre === 'workflow_dispatch') {
    return {
      tipo: 'manual',
      simulacro: Boolean(p.inputs && p.inputs.simulacro === SIMULACRO),
      sha: SHA.test(String(shaContexto || '')) ? shaContexto : null,
    };
  }
  if (nombre !== 'deployment_status') return { tipo: 'otro' };
  const ds = p.deployment_status && typeof p.deployment_status === 'object' ? p.deployment_status : {};
  const d = p.deployment && typeof p.deployment === 'object' ? p.deployment : {};
  const datos = d.payload && typeof d.payload === 'object' ? d.payload : {};
  return {
    tipo: 'despliegue',
    estado: ESTADOS.has(ds.state) ? ds.state : null,
    deRailway: Boolean(ds.creator && ds.creator.login === RAILWAY),
    esProduccion: datos.environmentId === PRODUCCION.id || d.environment === PRODUCCION.nombre,
    sha: SHA.test(String(d.sha || '')) ? d.sha : null,
    enlaceRailway: [ds.log_url, ds.target_url, ds.environment_url]
      .find((u) => typeof u === 'string' && ENLACE_RAILWAY.test(u)) || null,
  };
}

// Qué hacer: `nada`, `avisar` (abrir o comentar el aviso) o `cerrar` (cerrar el que haya).
// `sonda` trae el resultado del job que sondea y el de sus dos pasos, tal como los da GitHub.
function decidir(evento, sonda = {}) {
  if (evento.tipo === 'manual') {
    return evento.simulacro
      ? { accion: 'avisar', caso: 'fallo', simulacro: true, sha: evento.sha, enlaceRailway: null, motivo: 'simulacro lanzado a mano' }
      : { accion: 'nada', motivo: 'corrida manual: su resultado se ve en la propia corrida' };
  }
  if (evento.tipo !== 'despliegue') return { accion: 'nada', motivo: 'no es un estado de despliegue' };
  if (!evento.deRailway) return { accion: 'nada', motivo: 'el estado no lo creó Railway' };
  if (!evento.esProduccion) return { accion: 'nada', motivo: 'no es el entorno de producción' };
  const base = { sha: evento.sha, enlaceRailway: evento.enlaceRailway, simulacro: false };
  if (evento.estado === 'failure' || evento.estado === 'error') {
    return { ...base, accion: 'avisar', caso: 'fallo', motivo: `Railway dio ${evento.estado}` };
  }
  if (evento.estado !== 'success') return { accion: 'nada', motivo: `estado ${evento.estado || 'desconocido'}: no es final` };
  if (sonda.resultado === 'success') return { ...base, accion: 'cerrar', motivo: 'desplegado, y la sonda pasa' };
  return {
    ...base, accion: 'avisar', caso: 'sonda', salud: sonda.salud, muro: sonda.muro,
    motivo: `desplegado, pero la sonda dio ${sonda.resultado || 'nada'}`,
  };
}

const corto = (sha) => (sha ? sha.slice(0, 7) : '(commit no legible)');
const paso = (r) => (r === 'success' ? 'pasa' : r === 'failure' ? '**falla**' : `no llegó a correr (${r || 'sin resultado'})`);

function tituloIssue(d) {
  const pre = d.simulacro ? '[Simulacro] ' : '';
  return d.caso === 'fallo'
    ? `${pre}Despliegue fallido: ${corto(d.sha)} no llegó a producción`
    : `${pre}Producción en rojo tras desplegar ${corto(d.sha)}`;
}

// `urls.repo` y `urls.corrida` los arma el workflow con el contexto de GitHub, no con el evento.
function enlaces(d, urls) {
  return [
    ...(d.sha ? [`- Commit: ${urls.repo}/commit/${d.sha}`] : []),
    d.enlaceRailway ? `- Railway: ${d.enlaceRailway}` : '- Railway: el estado no trae un enlace reconocible; el log está en el panel del servicio.',
    `- Corrida que avisa: ${urls.corrida}`,
  ];
}

function cuerpoIssue(d, urls) {
  const out = [];
  if (d.simulacro) {
    out.push('> **Simulacro**, lanzado a mano para probar este aviso: no ha fallado ningún despliegue. Se cierra solo con el siguiente despliegue que termine bien y pase la sonda.', '');
  }
  if (d.caso === 'fallo') {
    out.push(`**El despliegue de \`${corto(d.sha)}\` falló en Railway.** Producción sigue con el despliegue anterior: los cambios de ese commit no están publicados.`,
      '', ...enlaces(d, urls), '',
      'Qué mirar primero: el log de construcción en Railway. Los dos incidentes anteriores fueron el lock: el 1 de septiembre no cuadraba con `package.json`, y el 16 resolvía paquetes contra un espejo inalcanzable. Si fue un fallo pasajero de Railway, basta con volver a desplegar; si es el lock o el código, hay que empujar el arreglo.');
  } else {
    out.push(`**El despliegue de \`${corto(d.sha)}\` terminó bien en Railway, pero la sonda contra el dominio real no pasa.**`,
      '', `- \`/salud\` y \`/login\`: ${paso(d.salud)}`, `- Muro de acceso (\`npm run puerta\`): ${paso(d.muro)}`,
      '', ...enlaces(d, urls), '',
      'Si falla `/salud`, el sitio no responde o la base está vacía (503). Si falla el muro, una ruta protegida responde sin sesión y el catálogo de precios podría estar a la vista: eso va primero. El detalle está en el resumen de la corrida.');
  }
  out.push('', 'Este aviso se cierra solo cuando un despliegue posterior termina bien y la sonda pasa.');
  return out.join('\n');
}

function comentarioCierre(d, urls) {
  return `Resuelto: el despliegue de \`${corto(d.sha)}\` terminó bien y la sonda pasa (\`/salud\`, \`/login\` y el muro de acceso). Corrida: ${urls.corrida}`;
}

module.exports = {
  ETIQUETA, RAILWAY, PRODUCCION, SIMULACRO, leerEvento, decidir, tituloIssue, cuerpoIssue, comentarioCierre,
};
