'use strict';
/* ══ API AUTORITATIVA DEL DIMENSIONADOR FORTIGATE (etapa 7, 2026-09-23) ══════════════════
   POST /api/v1/fortinet/evaluations

   El navegador ya evalua el escenario mientras se escribe, con `public/js/fortinet-motor.js`.
   Esta ruta evalua EL MISMO escenario con EL MISMO archivo y es la que decide si una salida
   comercial puede salir: ninguna exportacion, perfil, consolidado ni envio al cotizador se
   hace sin que este endpoint lo confirme. El informe de auditoria del 23-sep lo pide como
   principio («el backend es autoritativo»), y el motivo es concreto: todo lo que decide el
   navegador lo puede reescribir el navegador.

   QUE SE COMPARA. El cliente manda su escenario, la huella que el calculo en su pantalla y
   la version del catalogo con la que lo hizo. Si la huella no coincide, el servidor evaluo
   otra cosa que la que el usuario ve (409); si el catalogo cambio desde que se cargo la
   pagina, se dice y no se simula el resultado anterior (409). Solo con las dos iguales cuenta
   la puerta.

   QUE SE GUARDA. Solo las ACCIONES comerciales (no cada evaluacion), en una linea JSON por
   accion en el volumen persistente (`AUTH_STATE_DIR/auditoria/fortinet.jsonl`), junto a
   `usuarios.json`: la base SQLite se resiembra en cada despliegue y un registro ahi no
   sobreviviria. Se guarda la huella y no el escenario: el nombre del cliente y la referencia
   del proyecto viajan en el enlace, no en este registro. */

const express = require('express');
const fs = require('fs');
const path = require('path');

const MOTOR = require('../../public/js/fortinet-motor.js');
const { toDimensionadorFortinet } = require('../services/catalogProjection');
const { FUENTES } = require('../seed/legacyData/fuentes');

const router = express.Router();

const CLAVES_CUERPO = new Set(['scenario', 'requestedOverrideModel', 'accion', 'scenarioHash', 'datasetVersion', 'idempotencyKey']);
const ACCIONES_VALIDAS = new Set(['excel', 'copiar', 'cotizador', 'perfil', 'consolidar', 'excel-borrador', 'copiar-borrador']);

// El catalogo no cambia en caliente: se siembra al arrancar. Se cachea para no rehacer la
// proyeccion en cada tecla, con una caducidad corta por si alguien aplica una propuesta en
// local (la unica via que escribe la base en caliente).
let cache = null;
async function catalogo() {
  if (cache && Date.now() - cache.t < 60000) return cache.cat;
  const d = await toDimensionadorFortinet();
  const cat = { ...d, fuentes: FUENTES.fortinet || [] };
  cache = { t: Date.now(), cat };
  return cat;
}

function dirAuditoria() {
  const base = process.env.AUTH_STATE_DIR || path.join(__dirname, '..', '..', '.auth-state');
  return path.join(base, 'auditoria');
}

// Doble envio: la misma clave de idempotencia devuelve la misma respuesta y no escribe una
// segunda linea de auditoria. Vive en memoria con caducidad: protege del doble clic y del
// reintento de red, que es lo que ocurre de verdad; no pretende ser un registro permanente.
const recientes = new Map();
function recordar(clave, respuesta) {
  recientes.set(clave, { t: Date.now(), respuesta });
  for (const [k, v] of recientes) if (Date.now() - v.t > 10 * 60000) recientes.delete(k);
}

function auditar(linea) {
  try {
    const dir = dirAuditoria();
    fs.mkdirSync(dir, { recursive: true });
    fs.appendFileSync(path.join(dir, 'fortinet.jsonl'), `${JSON.stringify(linea)}\n`);
    return true;
  } catch {
    return false;
  }
}

// Lo que el cliente necesita saber de la evaluacion, sin arrastrar el catalogo entero: la
// respuesta de la pagina ya tiene los modelos, y mandar 58 fichas con sus precios en cada
// confirmacion seria peso sin informacion.
function resumen(r) {
  const cand = (c) => (c ? { id: c.id, elegible: c.elegible, cuello: c.eval.manda ? c.eval.manda.k : null,
    utilizacion: c.eval.uMax, soporta: c.soporta } : null);
  return {
    scenarioHash: r.scenarioHash,
    datasetVersion: r.datasetVersion,
    engineVersion: r.motor,
    schemaVersion: r.esquema,
    quoteGate: r.quoteGate,
    acciones: r.acciones,
    confianza: r.confianza,
    requirements: r.requisitos,
    trafficScenarios: r.escenarios,
    recommendation: cand(r.recomendacion),
    alternatives: r.alternativas.map(cand),
    selectedValidatedModel: cand(r.seleccion),
    override: r.override,
    eligibleCandidates: r.elegibles.map((c) => c.id),
    rejectedCandidates: r.descartados.map((c) => ({ id: c.id,
      motivos: [c.eval.motivo].concat(c.bloqueos.map((b) => b.codigo)).filter(Boolean) })),
    blockers: r.bloqueos,
    warnings: r.avisos,
    assumptions: r.supuestos,
    bom: r.bom ? { modelo: r.bom.modelo, nodos: r.bom.nodos, construccion: r.bom.construccion, filas: r.bom.filas } : null,
    inactiveFields: r.inactivos,
  };
}

router.post('/evaluations', async (req, res, next) => {
  try {
    const cuerpo = req.body;
    if (!cuerpo || typeof cuerpo !== 'object' || Array.isArray(cuerpo)) {
      return res.status(400).json({ codigo: 'cuerpo-invalido', error: 'Se esperaba un objeto JSON.' });
    }
    const desconocidas = Object.keys(cuerpo).filter((k) => !CLAVES_CUERPO.has(k));
    if (desconocidas.length) {
      return res.status(400).json({ codigo: 'campo-desconocido', error: `Campos no reconocidos: ${desconocidas.join(', ')}` });
    }
    if (cuerpo.accion != null && !ACCIONES_VALIDAS.has(cuerpo.accion)) {
      return res.status(400).json({ codigo: 'accion-invalida', error: `Acción no reconocida: ${cuerpo.accion}` });
    }
    const escenario = cuerpo.scenario && typeof cuerpo.scenario === 'object' ? JSON.parse(JSON.stringify(cuerpo.scenario)) : {};
    if (cuerpo.requestedOverrideModel) {
      escenario.seleccion = { ...(escenario.seleccion || {}), manual: String(cuerpo.requestedOverrideModel) };
    }

    const cat = await catalogo();
    if (cuerpo.datasetVersion && cuerpo.datasetVersion !== cat.datasetVersion) {
      return res.status(409).json({ codigo: 'dataset-distinto',
        error: 'El catálogo cambió desde que se cargó la página: recargarla antes de exportar.',
        vigente: cat.datasetVersion, recibido: cuerpo.datasetVersion });
    }
    const r = MOTOR.evaluar(escenario, cat, { hoy: new Date().toISOString() });
    if (r.errores.length) {
      return res.status(400).json({ codigo: 'entrada-invalida', errores: r.errores, scenarioHash: r.scenarioHash });
    }
    if (cuerpo.scenarioHash && cuerpo.scenarioHash !== r.scenarioHash) {
      return res.status(409).json({ codigo: 'huella-distinta',
        error: 'El servidor evaluó un escenario distinto del que muestra la página.',
        servidor: r.scenarioHash, recibido: cuerpo.scenarioHash });
    }
    const out = resumen(r);
    if (!cuerpo.accion) return res.json(out);

    // ── ACCION COMERCIAL ────────────────────────────────────────────────────────────────
    const usuario = req.usuario ? (req.usuario.usuario || req.usuario.id || null) : null;
    const clave = cuerpo.idempotencyKey ? `${usuario}|${cuerpo.accion}|${r.scenarioHash}|${String(cuerpo.idempotencyKey).slice(0, 80)}` : null;
    if (clave && recientes.has(clave)) return res.json({ ...recientes.get(clave).respuesta, repetida: true });

    const permitida = MOTOR.permite(r, cuerpo.accion);
    const linea = {
      ts: new Date().toISOString(), usuario, accion: cuerpo.accion, permitida,
      scenarioHash: r.scenarioHash, datasetVersion: r.datasetVersion, motor: r.motor,
      modelo: r.seleccion ? r.seleccion.id : null, quoteGate: r.quoteGate,
      override: r.override ? { modelo: r.override.modelo, elegible: r.override.elegible } : null,
      bloqueos: r.bloqueos.map((b) => b.codigo),
    };
    const registrada = auditar(linea);
    const respuesta = { ...out, accion: cuerpo.accion, permitida, auditada: registrada };
    if (!permitida) {
      return res.status(409).json({ ...respuesta, codigo: 'puerta-cerrada',
        error: `La puerta de cotización está en ${r.quoteGate}: la acción «${cuerpo.accion}» no está permitida.` });
    }
    if (clave) recordar(clave, respuesta);
    return res.json(respuesta);
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
